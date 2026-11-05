<?php
/**
 * ============================================================
 *  notificar_op.php — Torre de Control · Polyuprotec S.A.
 * ============================================================
 *  Recibe (POST JSON) los datos de una O.P recién creada desde la
 *  macro de COMERCIAL (Google Apps Script) y envía un correo HTML
 *  desde la cuenta del HOSTING (no desde el correo de quien crea la O.P).
 *
 *  Seguridad:
 *   - Solo acepta POST con el TOKEN secreto (el mismo de la macro).
 *   - Los destinatarios se configuran AQUÍ (no los manda el script),
 *     así este archivo no puede usarse para enviar correos a cualquiera.
 * ============================================================
 */

// ======================== CONFIGURACIÓN ========================
$SECRETOS = require __DIR__ . '/config.php';   // TOKEN y SMTP_PASS: config.php (no se sube a GitHub)
$CONFIG = [
    // Debe ser EXACTAMENTE el mismo valor de TOKEN_CORREO en la macro de comercial
    'TOKEN' => $SECRETOS['TOKEN'],

    // Cuenta de correo del hosting (cPanel → Cuentas de correo → "Conectar dispositivos")
    'SMTP_HOST'   => 'torredecontrol.polypro.space',   // servidor SMTP del hosting
    'SMTP_PORT'   => 465,                      // 465 = SSL · 587 = STARTTLS
    'SMTP_SECURE' => 'ssl',                    // 'ssl' (465) o 'tls' (587)
    'SMTP_USER'   => 'notificacion@torredecontrol.polypro.space',
    'SMTP_PASS'   => $SECRETOS['SMTP_PASS'],
    // Si dejas SMTP_HOST vacío ('') se usa mail() de PHP (menos confiable, puede caer en spam)

    'FROM_EMAIL' => 'notificacion@torredecontrol.polypro.space',
    'FROM_NAME'  => 'Torre de Control · Polyuprotec',
    'REPLY_TO'   => '',                         // opcional, ej. 'produccion@polyuprotec.com'

    // Siempre reciben el correo
    'DESTINATARIOS' => [
        'todos@polyuprotec.com',
    ],
    // Reciben solo si su área participa en la O.P (opcional)
    'CORREOS_POR_AREA' => [
        'Diseño'         => [],
        'Dibujo'         => [],
        'Compras'        => [],
        'Produccion'     => [],
        'Galvanizado'    => [],
        'Pintura'        => [],
        'Logistica'      => [],
        'Montaje'        => [],
        'Administración' => [],
    ],
    // ¿Enviar también una copia al comercial que creó la O.P? (su correo llega desde el script)
    'COPIA_AL_CREADOR' => true,

    // Enlace del botón "Abrir Torre de Control"
    'APP_URL'  => 'https://torredecontrol.polypro.space/torre_de_control_v2/',

    // Logo de la empresa: va INCRUSTADO en el correo (se ve aunque el correo
    // bloquee imágenes externas). Se usa el primero que exista.
    'LOGO_ARCHIVOS' => [__DIR__ . '/icons/logo-correo.png', __DIR__ . '/icons/logo-polyuprotec.png'],
];
// ===============================================================

header('Content-Type: application/json; charset=UTF-8');

function responder($ok, $msg, $code = 200) {
    http_response_code($code);
    echo json_encode(['ok' => $ok, 'mensaje' => $msg], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') responder(false, 'Método no permitido', 405);
$in = json_decode(file_get_contents('php://input'), true);
if (!is_array($in)) responder(false, 'JSON inválido', 400);
if (!hash_equals($CONFIG['TOKEN'], (string)($in['token'] ?? ''))) responder(false, 'Token inválido', 403);

// ------------------ Datos de la O.P ------------------
$limpio = function ($v, $max = 200) { return mb_substr(trim((string)$v), 0, $max); };
$op = [
    'op'        => $limpio($in['op'] ?? '', 40),
    'nombre'    => $limpio($in['nombre'] ?? ''),
    'cliente'   => $limpio($in['cliente'] ?? ''),
    'comercial' => $limpio($in['comercial'] ?? ''),
    'sede'      => $limpio($in['sede'] ?? '', 80),
    'subs'      => (int)($in['subs'] ?? 1),
    'entrega'   => $limpio($in['fechaEntrega'] ?? '', 10),     // dd/mm/aaaa
    'creador'   => $limpio($in['creador'] ?? '', 120),
    'urlHoja'   => $limpio($in['urlHoja'] ?? '', 500),
    'areas'     => array_values(array_filter(array_map(function ($a) { return mb_substr(trim((string)$a), 0, 40); },
                    is_array($in['areas'] ?? null) ? $in['areas'] : []))),
];
if ($op['op'] === '') responder(false, 'Falta el número de O.P', 400);

// ------------------ Destinatarios ------------------
$valido = function ($e) { return filter_var($e, FILTER_VALIDATE_EMAIL) ? strtolower($e) : null; };
$para = [];
foreach ($CONFIG['DESTINATARIOS'] as $e) if ($v = $valido($e)) $para[$v] = true;
foreach ($op['areas'] as $a) foreach (($CONFIG['CORREOS_POR_AREA'][$a] ?? []) as $e) if ($v = $valido($e)) $para[$v] = true;
if ($CONFIG['COPIA_AL_CREADOR'] && ($v = $valido($op['creador']))) $para[$v] = true;
$para = array_keys($para);
if (!$para) responder(false, 'No hay destinatarios configurados en notificar_op.php', 500);

// ------------------ Correo ------------------
$asunto = '🆕 Nueva O.P ' . $op['op'] . ' · ' . $op['nombre'] . ' — Torre de Control';
$CONFIG['_LOGO'] = null;
foreach ($CONFIG['LOGO_ARCHIVOS'] as $f) { if (is_readable($f)) { $CONFIG['_LOGO'] = $f; break; } }
$html   = plantillaNuevaOP($op, $CONFIG);
$texto  = textoPlano($op, $CONFIG);

$err = '';
$ok = $CONFIG['SMTP_HOST']
    ? enviarSMTP($CONFIG, $para, $asunto, $html, $texto, $err)
    : enviarMail($CONFIG, $para, $asunto, $html, $texto, $err);

$ok ? responder(true, 'Correo enviado a ' . count($para) . ' destinatario(s)')
    : responder(false, 'No se pudo enviar: ' . $err, 500);


// ======================= PLANTILLA HTML =======================
function e($s) { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }

function infoEntrega($dmy) {
    if (!preg_match('/^(\d{2})\/(\d{2})\/(\d{4})$/', $dmy, $m)) return ['Sin fecha', '#8f9bb3', '#f7f7fc', ''];
    $tz = new DateTimeZone('America/Bogota');
    $f = DateTime::createFromFormat('!d/m/Y', $dmy, $tz);
    $hoy = new DateTime('today', $tz);
    $dias = (int)$hoy->diff($f)->format('%r%a');
    $meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    $txt = $m[1] . ' ' . $meses[(int)$m[2] - 1] . ' ' . $m[3];
    if ($dias < 0)  return [$txt, '#fc424a', '#ffe9ea', 'vencida hace ' . abs($dias) . ' días'];
    if ($dias <= 7) return [$txt, '#fc424a', '#ffe9ea', $dias === 0 ? 'es HOY' : 'faltan ' . $dias . ' días'];
    if ($dias <= 15) return [$txt, '#f4a100', '#fff3df', 'faltan ' . $dias . ' días'];
    return [$txt, '#1bc943', '#e7faec', 'faltan ' . $dias . ' días'];
}

function plantillaNuevaOP($op, $C) {
    $iconos = ['Diseño' => '✏️', 'Dibujo' => '📐', 'Compras' => '🛒', 'Produccion' => '🏭', 'Galvanizado' => '⚙️',
               'Pintura' => '🎨', 'Logistica' => '🚚', 'Montaje' => '🔧', 'Administración' => '📋'];
    $nombres = ['Produccion' => 'Producción', 'Logistica' => 'Logística'];
    list($fTxt, $fColor, $fBg, $fDias) = infoEntrega($op['entrega']);
    $ahora = (new DateTime('now', new DateTimeZone('America/Bogota')))->format('d/m/Y · h:i a');

    // Áreas: tarjetitas numeradas en el orden del flujo
    $chips = '';
    foreach ($op['areas'] as $i => $a) {
        $chips .= '<td style="padding:4px" width="50%" valign="top"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate">'
            . '<tr><td style="background:#f1edfe;border:1px solid #e3dcfd;border-radius:12px;padding:10px 12px;font-family:Arial,Helvetica,sans-serif">'
            . '<span style="display:inline-block;width:20px;height:20px;line-height:20px;text-align:center;border-radius:10px;background:#7c5cfc;color:#fff;font-size:11px;font-weight:bold;margin-right:6px">' . ($i + 1) . '</span>'
            . '<span style="font-size:15px">' . ($iconos[$a] ?? '📌') . '</span> '
            . '<span style="font-size:13px;font-weight:bold;color:#2b2b40">' . e($nombres[$a] ?? $a) . '</span>'
            . '</td></tr></table></td>';
        if (($i + 1) % 2 === 0 && $i + 1 < count($op['areas'])) $chips .= '</tr><tr>';
    }
    if (count($op['areas']) % 2 === 1) $chips .= '<td width="50%"></td>';
    if ($chips === '') $chips = '<td style="font-family:Arial,sans-serif;color:#8f9bb3;font-size:13px">Sin áreas seleccionadas</td>';

    $fila = function ($ico, $etq, $val, $extra = '') {
        return '<tr><td style="padding:10px 0;border-bottom:1px solid #edeef5;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#8f9bb3;width:46%">'
            . $ico . '&nbsp; ' . $etq . '</td><td style="padding:10px 0;border-bottom:1px solid #edeef5;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#2b2b40;font-weight:bold;text-align:right">'
            . $val . $extra . '</td></tr>';
    };
    $chipEntrega = $fDias ? '<br><span style="display:inline-block;margin-top:4px;padding:3px 10px;border-radius:20px;background:' . $fBg . ';color:' . $fColor . ';font-size:11px;font-weight:bold">' . e($fDias) . '</span>' : '';


    return '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
    . '<title>O.P registrada ' . e($op['op']) . '</title></head>'
    . '<body style="margin:0;padding:0;background:#f4f5fb">'
    . '<div style="display:none;max-height:0;overflow:hidden">Se registró la O.P ' . e($op['op']) . ' — ' . e($op['nombre']) . ' para ' . e($op['cliente']) . '</div>'
    . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5fb"><tr><td align="center" style="padding:28px 12px">'
    . '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 4px 24px rgba(43,43,64,.08)">'

    // Encabezado con el degradado de la App
    . '<tr><td bgcolor="#8763e8" style="background:#8763e8;background-image:linear-gradient(100deg,#ee4d9e,#8763e8 55%,#4b6ef5);padding:26px 30px">'
    .   '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>'
    .   '<td style="font-family:Arial,Helvetica,sans-serif;color:#ffffff">'
    .     '<div style="font-size:12px;letter-spacing:1px;opacity:.9;text-transform:uppercase">🏗️ Torre de Control · Polyuprotec S.A.</div>'
    .     '<div style="font-size:24px;font-weight:bold;margin-top:8px">🆕 ¡Se registró una nueva O.P!</div>'
    .     '<div style="font-size:13px;opacity:.9;margin-top:4px">Registrada el ' . $ahora . '</div>'
    .   '</td>'
    .   (!empty($C['_LOGO']) ? '<td align="right" valign="top" width="120"><span style="display:inline-block;background:#ffffff;border-radius:12px;padding:8px 12px;box-shadow:0 4px 14px rgba(0,0,0,.12)"><img src="' . e($C['_LOGO_SRC'] ?? 'cid:logo-polyuprotec') . '" alt="Polyuprotec S.A." width="91" height="45" style="display:block;width:91px;height:45px;border:0"></span></td>' : '')
    .   '</tr></table>'
    . '</td></tr>'

    // Tarjeta principal de la O.P
    . '<tr><td style="padding:26px 30px 6px">'
    .   '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7fc;border:1px solid #edeef5;border-left:5px solid #7c5cfc;border-radius:14px"><tr><td style="padding:18px 20px;font-family:Arial,Helvetica,sans-serif">'
    .     '<div style="font-family:Consolas,Menlo,monospace;font-size:13px;color:#7c5cfc;font-weight:bold">O.P ' . e($op['op']) . '</div>'
    .     '<div style="font-size:20px;font-weight:bold;color:#2b2b40;margin-top:4px">' . e($op['nombre']) . '</div>'
    .     '<div style="font-size:13px;color:#8f9bb3;margin-top:4px">👤 ' . e($op['cliente']) . '</div>'
    .   '</td></tr></table>'
    . '</td></tr>'

    // Detalles
    . '<tr><td style="padding:14px 30px 0"><div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;color:#2b2b40;text-transform:uppercase;letter-spacing:.5px">📋 Detalles de la O.P</div></td></tr>'
    . '<tr><td style="padding:4px 30px 10px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">'
    .   $fila('💼', 'Comercial responsable', e($op['comercial']))
    .   $fila('👤', 'Cliente', e($op['cliente']))
    .   $fila('📍', 'Sede / Ciudad', e($op['sede']))
    .   $fila('🧩', 'Subestructuras por área', e($op['subs']))
    .   $fila('🏁', 'Fecha de entrega al cliente', '<span style="color:' . $fColor . '">' . e($fTxt) . '</span>', $chipEntrega)
    .   $fila('✍️', 'Registrada por', e($op['creador'] ?: $op['comercial']))
    . '</table></td></tr>'

    // Áreas
    . '<tr><td style="padding:14px 30px 0"><div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;color:#2b2b40;text-transform:uppercase;letter-spacing:.5px">🏭 Áreas que participan (' . count($op['areas']) . ')</div></td></tr>'
    . '<tr><td style="padding:8px 26px 6px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>' . $chips . '</tr></table></td></tr>'

    // Próximos pasos
    . '<tr><td style="padding:16px 30px 4px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff3df;border-radius:12px;border-left:4px solid #f4a100"><tr><td style="padding:14px 16px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#2b2b40;line-height:1.6">'
    .   '<b>⏭️ Próximos pasos</b><br>'
    .   '1️⃣ Comercial completa fechas, duraciones y KG por subestructura en la hoja de la O.P.<br>'
    .   '2️⃣ Se envía a las áreas con <b>📤 Enviar / Actualizar O.P en Áreas</b>.<br>'
    .   '3️⃣ Cada área registra su avance en su cronograma.'
    . '</td></tr></table></td></tr>'

    // Botones
    . '<tr><td align="center" style="padding:20px 24px 26px"><table role="presentation" cellpadding="0" cellspacing="0"><tr>'
    .   '<td style="padding:6px"><a href="' . e($C['APP_URL']) . '" style="display:inline-block;padding:13px 24px;border-radius:24px;background:#7c5cfc;background-image:linear-gradient(100deg,#ee4d9e,#8763e8 55%,#4b6ef5);color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;text-decoration:none">🚀 Abrir Torre de Control</a></td>'
    . '</tr></table></td></tr>'

    // Pie
    . '<tr><td style="background:#f7f7fc;border-top:1px solid #edeef5;padding:16px 30px;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#8f9bb3;text-align:center;line-height:1.6">'
    .   'Este correo se envió automáticamente al registrar la O.P en la Torre de Control.<br>'
    .   '<b style="color:#7c5cfc">Polyuprotec S.A.</b> · Sistema de Monitoreo Operativo<br>'
    .   'Desarrollado por <b style="color:#7c5cfc">Jeider Buelvas</b> · Desarrollador Full Stack'
    . '</td></tr>'

    . '</table></td></tr></table></body></html>';
}

function textoPlano($op, $C) {
    return "Se registró una nueva O.P en la Torre de Control\n\n"
        . "O.P: {$op['op']} - {$op['nombre']}\nCliente: {$op['cliente']}\nComercial: {$op['comercial']}\n"
        . "Sede: {$op['sede']}\nSubestructuras: {$op['subs']}\nFecha de entrega: {$op['entrega']}\n"
        . "Áreas: " . implode(', ', $op['areas']) . "\n\nTorre de Control: {$C['APP_URL']}\n"
        . "\n--\nDesarrollado por Jeider Buelvas · Desarrollador Full Stack\n";
}

// ======================= ENVÍO =======================
function construirMensaje($C, $para, $asunto, $html, $texto, &$cabeceras) {
    $alt = 'a' . bin2hex(random_bytes(12));
    $rel = 'r' . bin2hex(random_bytes(12));
    $de = '=?UTF-8?B?' . base64_encode($C['FROM_NAME']) . '?= <' . $C['FROM_EMAIL'] . '>';
    $cuerpoAlt = "--$alt\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n"
        . chunk_split(base64_encode($texto))
        . "--$alt\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n"
        . chunk_split(base64_encode($html))
        . "--$alt--\r\n";
    $comunes = "From: $de\r\n"
        . ($C['REPLY_TO'] ? "Reply-To: {$C['REPLY_TO']}\r\n" : '')
        . "MIME-Version: 1.0\r\n";
    if (empty($C['_LOGO'])) {
        $cabeceras = $comunes . "Content-Type: multipart/alternative; boundary=\"$alt\"\r\n";
        return $cuerpoAlt;
    }
    // multipart/related: texto + HTML + logo incrustado (cid:logo-polyuprotec)
    $cabeceras = $comunes . "Content-Type: multipart/related; boundary=\"$rel\"; type=\"multipart/alternative\"\r\n";
    return "--$rel\r\nContent-Type: multipart/alternative; boundary=\"$alt\"\r\n\r\n" . $cuerpoAlt
        . "--$rel\r\nContent-Type: image/png; name=\"logo-polyuprotec.png\"\r\nContent-Transfer-Encoding: base64\r\n"
        . "Content-ID: <logo-polyuprotec>\r\nContent-Disposition: inline; filename=\"logo-polyuprotec.png\"\r\n\r\n"
        . chunk_split(base64_encode(file_get_contents($C['_LOGO'])))
        . "--$rel--\r\n";
}

function asuntoCodificado($asunto) { return '=?UTF-8?B?' . base64_encode($asunto) . '?='; }

function enviarMail($C, $para, $asunto, $html, $texto, &$err) {
    $cab = '';
    $cuerpo = construirMensaje($C, $para, $asunto, $html, $texto, $cab);
    $ok = @mail(implode(', ', $para), asuntoCodificado($asunto), $cuerpo, $cab, '-f' . $C['FROM_EMAIL']);
    if (!$ok) $err = 'mail() falló (el hosting puede tenerlo desactivado; configura SMTP)';
    return $ok;
}

/** Cliente SMTP mínimo (SSL 465 o STARTTLS 587) con AUTH LOGIN. */
function enviarSMTP($C, $para, $asunto, $html, $texto, &$err) {
    $host = ($C['SMTP_SECURE'] === 'ssl' ? 'ssl://' : '') . $C['SMTP_HOST'];
    $s = @stream_socket_client($host . ':' . $C['SMTP_PORT'], $no, $msg, 20);
    if (!$s) { $err = "No conecta a {$C['SMTP_HOST']}:{$C['SMTP_PORT']} ($msg)"; return false; }
    stream_set_timeout($s, 20);
    $leer = function () use ($s) { $r = ''; while (($l = fgets($s, 515)) !== false) { $r .= $l; if (isset($l[3]) && $l[3] === ' ') break; } return $r; };
    $cmd = function ($c, $esperado) use ($s, $leer, &$err) {
        if ($c !== null) fwrite($s, $c . "\r\n");
        $r = $leer();
        if ((int)substr($r, 0, 3) !== $esperado) { $err = 'SMTP: ' . trim($r); return false; }
        return true;
    };
    $yo = $_SERVER['SERVER_NAME'] ?? 'localhost';
    if (!$cmd(null, 220) || !$cmd("EHLO $yo", 250)) { fclose($s); return false; }
    if ($C['SMTP_SECURE'] === 'tls') {
        if (!$cmd('STARTTLS', 220)) { fclose($s); return false; }
        stream_socket_enable_crypto($s, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
        if (!$cmd("EHLO $yo", 250)) { fclose($s); return false; }
    }
    if (!$cmd('AUTH LOGIN', 334) || !$cmd(base64_encode($C['SMTP_USER']), 334) || !$cmd(base64_encode($C['SMTP_PASS']), 235)) { fclose($s); return false; }
    if (!$cmd('MAIL FROM:<' . $C['FROM_EMAIL'] . '>', 250)) { fclose($s); return false; }
    foreach ($para as $p) if (!$cmd("RCPT TO:<$p>", 250)) { fclose($s); return false; }
    if (!$cmd('DATA', 354)) { fclose($s); return false; }
    $cab = '';
    $cuerpo = construirMensaje($C, $para, $asunto, $html, $texto, $cab);
    $mensaje = 'To: ' . implode(', ', $para) . "\r\nSubject: " . asuntoCodificado($asunto) . "\r\nDate: " . date('r') . "\r\n" . $cab . "\r\n" . $cuerpo;
    $mensaje = preg_replace('/^\./m', '..', $mensaje);
    if (!$cmd($mensaje . "\r\n.", 250)) { fclose($s); return false; }
    $cmd('QUIT', 221);
    fclose($s);
    return true;
}
