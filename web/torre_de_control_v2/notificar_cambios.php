<?php
/**
 * ============================================================
 *  notificar_cambios.php — Torre de Control · Polyuprotec S.A.
 * ============================================================
 *  Recibe (POST JSON) desde la MAESTRA (v4) el resumen de cambios críticos
 *  registrados en HISTORIAL_CAMBIOS (fechas reales, estados, fecha de
 *  entrega, intentos bloqueados, diferencias entre áreas) y envía UN correo
 *  resumen desde la cuenta del hosting. Misma cuenta y estilo que
 *  notificar_op.php (ese archivo no se modifica).
 *
 *  Seguridad: solo POST con el TOKEN; los destinatarios se fijan AQUÍ.
 * ============================================================
 */

// ======================== CONFIGURACIÓN ========================
$SECRETOS = require __DIR__ . '/config.php';   // TOKEN y SMTP_PASS: config.php (no se sube a GitHub)
$CONFIG = [
    // Debe ser EXACTAMENTE el mismo valor de TOKEN_CORREO_CAMBIOS en la Maestra (v4)
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
        //'todos@polyuprotec.com',
          'jbuelvas@polyuprotec.com',
          'obeyabarranquilla@polyuprotec.com', 
          'obeyabogota@polyuprotec.com', 
    ],
    
    // ¿Enviar copia a quien hizo el cambio bloqueado? (para que sepa que no quedó)
    'COPIA_AL_USUARIO_BLOQUEADO' => true,

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

// ------------------ Cambios ------------------
$limpio = function ($v, $max = 200) { return mb_substr(trim((string)$v), 0, $max); };
$cambios = [];
foreach ((is_array($in['cambios'] ?? null) ? $in['cambios'] : []) as $c) {
    if (!is_array($c)) continue;
    $cambios[] = [
        'fecha' => $limpio($c['fecha'] ?? '', 20),   'usuario' => $limpio($c['usuario'] ?? '', 80),
        'correo' => $limpio($c['correo'] ?? '', 120), 'op' => $limpio($c['op'] ?? '', 40),
        'area' => $limpio($c['area'] ?? '', 80),      'sub' => $limpio($c['sub'] ?? '', 80),
        'tarea' => $limpio($c['tarea'] ?? '', 120),   'campo' => $limpio($c['campo'] ?? '', 60),
        'anterior' => $limpio($c['anterior'] ?? '', 120), 'nuevo' => $limpio($c['nuevo'] ?? '', 120),
        'tipo' => $limpio($c['tipo'] ?? '', 60),      'detalle' => $limpio($c['detalle'] ?? '', 300),
    ];
    if (count($cambios) >= 200) break;
}
if (!$cambios) responder(false, 'No llegaron cambios', 400);

// ------------------ Destinatarios ------------------
$valido = function ($e) { return filter_var($e, FILTER_VALIDATE_EMAIL) ? strtolower($e) : null; };
$para = [];
foreach ($CONFIG['DESTINATARIOS'] as $e) if ($v = $valido($e)) $para[$v] = true;
if ($CONFIG['COPIA_AL_USUARIO_BLOQUEADO'])
    foreach ($cambios as $c) if (stripos($c['tipo'], 'bloqueado') !== false && ($v = $valido($c['correo']))) $para[$v] = true;
$para = array_keys($para);
if (!$para) responder(false, 'No hay destinatarios configurados en notificar_cambios.php', 500);

// ------------------ Correo ------------------
$bloq = count(array_filter($cambios, function ($c) { return stripos($c['tipo'], 'bloqueado') !== false; }));
$ops  = array_unique(array_map(function ($c) { return $c['op']; }, $cambios));
$asunto = ($bloq ? '⛔ ' : '🛡️ ') . count($cambios) . ' cambio' . (count($cambios) === 1 ? '' : 's') . ' crítico' . (count($cambios) === 1 ? '' : 's')
        . ($bloq ? ' (' . $bloq . ' bloqueado' . ($bloq === 1 ? '' : 's') . ')' : '')
        . ' · O.P ' . implode(', ', array_slice($ops, 0, 4)) . (count($ops) > 4 ? '…' : '') . ' — Torre de Control';
$CONFIG['_LOGO'] = null;
foreach ($CONFIG['LOGO_ARCHIVOS'] as $f) { if (is_readable($f)) { $CONFIG['_LOGO'] = $f; break; } }
$html  = plantillaCambios($cambios, $CONFIG);
$texto = textoPlanoCambios($cambios, $CONFIG);

$err = '';
$ok = $CONFIG['SMTP_HOST']
    ? enviarSMTP($CONFIG, $para, $asunto, $html, $texto, $err)
    : enviarMail($CONFIG, $para, $asunto, $html, $texto, $err);

$ok ? responder(true, 'Correo enviado a ' . count($para) . ' destinatario(s)')
    : responder(false, 'No se pudo enviar: ' . $err, 500);


// ======================= PLANTILLA HTML =======================
function e($s) { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }

/** Color e ícono por tipo de cambio. */
function estiloTipo($tipo) {
    $t = mb_strtolower($tipo);
    if (strpos($t, 'bloqueado') !== false || strpos($t, 'sin revertir') !== false) return ['⛔', '#fc424a', '#ffe9ea'];
    if (strpos($t, 'terminación') !== false)  return ['✅', '#1bc943', '#e7faec'];
    if (strpos($t, 'diferencia') !== false)   return ['⚠️', '#f4a100', '#fff3df'];
    if (strpos($t, 'comercial') !== false)    return ['🏁', '#ee4d9e', '#fde8f3'];
    if (strpos($t, 'autorizado') !== false)   return ['🔑', '#4b6ef5', '#e8edfe'];
    if (strpos($t, 'detectado') !== false)    return ['🔍', '#f4a100', '#fff3df'];
    return ['✏️', '#7c5cfc', '#f1edfe'];
}

function plantillaCambios($cambios, $C) {
    $ahora = (new DateTime('now', new DateTimeZone('America/Bogota')))->format('d/m/Y · h:i a');
    // Resumen por tipo
    $porTipo = [];
    foreach ($cambios as $c) $porTipo[$c['tipo']] = ($porTipo[$c['tipo']] ?? 0) + 1;
    arsort($porTipo);
    $resumen = '';
    foreach ($porTipo as $t => $n) {
        list($ico, $col, $bg) = estiloTipo($t);
        $resumen .= '<span style="display:inline-block;margin:3px 4px 3px 0;padding:5px 11px;border-radius:20px;background:' . $bg . ';color:' . $col . ';font-family:Arial,sans-serif;font-size:12px;font-weight:bold">' . $ico . ' ' . e($t) . ' · ' . $n . '</span>';
    }
    // Agrupado por O.P
    $grupos = [];
    foreach ($cambios as $c) $grupos[$c['op']][] = $c;
    $bloques = '';
    foreach ($grupos as $op => $lista) {
        $bloques .= '<tr><td style="padding:14px 30px 4px"><div style="font-family:Consolas,Menlo,monospace;font-size:13px;color:#7c5cfc;font-weight:bold">O.P ' . e($op) . ' <span style="font-family:Arial,sans-serif;color:#8f9bb3;font-weight:normal">· ' . count($lista) . ' cambio' . (count($lista) === 1 ? '' : 's') . '</span></div></td></tr>';
        foreach ($lista as $c) {
            list($ico, $col, $bg) = estiloTipo($c['tipo']);
            $donde = trim(implode(' · ', array_filter([$c['area'], $c['sub'], $c['tarea']])));
            $valores = (stripos($c['tipo'], 'diferencia') !== false)
                ? '<span style="font-family:Consolas,Menlo,monospace;color:#f4a100;font-weight:bold">' . e(trim($c['anterior'] . ' ' . $c['nuevo'])) . '</span>'
                : (($c['anterior'] !== '' || $c['nuevo'] !== '')
                ? '<span style="font-family:Consolas,Menlo,monospace;color:#8f9bb3;text-decoration:line-through">' . e($c['anterior'] !== '' ? $c['anterior'] : '(vacío)') . '</span>'
                  . ' <span style="color:#8f9bb3">→</span> <span style="font-family:Consolas,Menlo,monospace;color:#2b2b40;font-weight:bold">' . e($c['nuevo'] !== '' ? $c['nuevo'] : '(vacío)') . '</span>'
                : '');
            $bloques .= '<tr><td style="padding:4px 30px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7fc;border:1px solid #edeef5;border-left:4px solid ' . $col . ';border-radius:12px"><tr><td style="padding:12px 14px;font-family:Arial,Helvetica,sans-serif">'
                . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>'
                .   '<td style="font-size:14px;font-weight:bold;color:#2b2b40">' . e($c['campo']) . '</td>'
                .   '<td align="right"><span style="display:inline-block;padding:3px 9px;border-radius:20px;background:' . $bg . ';color:' . $col . ';font-size:11px;font-weight:bold;white-space:nowrap">' . $ico . ' ' . e($c['tipo']) . '</span></td>'
                . '</tr></table>'
                . ($donde ? '<div style="font-size:12px;color:#8f9bb3;margin-top:3px">📍 ' . e($donde) . '</div>' : '')
                . ($valores ? '<div style="font-size:13px;margin-top:7px">' . $valores . '</div>' : '')
                . ($c['detalle'] ? '<div style="font-size:12px;color:#5a5a72;margin-top:6px;line-height:1.5">' . e($c['detalle']) . '</div>' : '')
                . '<div style="font-size:11px;color:#8f9bb3;margin-top:7px">👤 ' . e($c['usuario'] ?: '—') . ($c['correo'] ? ' · ' . e($c['correo']) : '') . ' &nbsp;·&nbsp; 🕒 ' . e($c['fecha']) . '</div>'
                . '</td></tr></table></td></tr>';
        }
    }

    return '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
    . '<title>Cambios críticos — Torre de Control</title></head>'
    . '<body style="margin:0;padding:0;background:#f4f5fb">'
    . '<div style="display:none;max-height:0;overflow:hidden">' . count($cambios) . ' cambios críticos registrados en la Torre de Control</div>'
    . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5fb"><tr><td align="center" style="padding:28px 12px">'
    . '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 4px 24px rgba(43,43,64,.08)">'
    . '<tr><td bgcolor="#8763e8" style="background:#8763e8;background-image:linear-gradient(100deg,#ee4d9e,#8763e8 55%,#4b6ef5);padding:26px 30px">'
    .   '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>'
    .   '<td style="font-family:Arial,Helvetica,sans-serif;color:#ffffff">'
    .     '<div style="font-size:12px;letter-spacing:1px;opacity:.9;text-transform:uppercase">🏗️ Torre de Control · Polyuprotec S.A.</div>'
    .     '<div style="font-size:24px;font-weight:bold;margin-top:8px">🛡️ Cambios críticos registrados</div>'
    .     '<div style="font-size:13px;opacity:.9;margin-top:4px">Resumen del ' . $ahora . '</div>'
    .   '</td>'
    .   (!empty($C['_LOGO']) ? '<td align="right" valign="top" width="120"><span style="display:inline-block;background:#ffffff;border-radius:12px;padding:8px 12px;box-shadow:0 4px 14px rgba(0,0,0,.12)"><img src="' . e($C['_LOGO_SRC'] ?? 'cid:logo-polyuprotec') . '" alt="Polyuprotec S.A." width="91" height="45" style="display:block;width:91px;height:45px;border:0"></span></td>' : '')
    .   '</tr></table>'
    . '</td></tr>'
    . '<tr><td style="padding:22px 30px 4px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#5a5a72;line-height:1.6">'
    .   'Se registraron <b style="color:#2b2b40">' . count($cambios) . '</b> cambio' . (count($cambios) === 1 ? '' : 's') . ' en fechas o información crítica de los procesos. '
    .   'Las fechas reales de tareas terminadas y la fecha de entrega comercial son <b>línea base</b>: si alguien intentó cambiarlas, el cambio se revirtió.'
    . '</td></tr>'
    . '<tr><td style="padding:8px 30px 4px">' . $resumen . '</td></tr>'
    . $bloques
    . '<tr><td align="center" style="padding:22px 24px 26px"><table role="presentation" cellpadding="0" cellspacing="0"><tr>'
    .   '<td style="padding:6px"><a href="' . e($C['APP_URL']) . '" style="display:inline-block;padding:13px 24px;border-radius:24px;background:#7c5cfc;background-image:linear-gradient(100deg,#ee4d9e,#8763e8 55%,#4b6ef5);color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;text-decoration:none">🚀 Abrir Torre de Control</a></td>'
    . '</tr></table></td></tr>'
    . '<tr><td style="background:#f7f7fc;border-top:1px solid #edeef5;padding:16px 30px;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#8f9bb3;text-align:center;line-height:1.6">'
    .   'Este correo se envía automáticamente desde el Historial de Cambios de la Torre de Control.<br>'
    .   '<b style="color:#7c5cfc">Polyuprotec S.A.</b> · Sistema de Monitoreo Operativo<br>'
    .   'Desarrollado por <b style="color:#7c5cfc">Jeider Buelvas</b> · Desarrollador Full Stack'
    . '</td></tr>'
    . '</table></td></tr></table></body></html>';
}

function textoPlanoCambios($cambios, $C) {
    $t = "Cambios críticos registrados en la Torre de Control\n\n";
    foreach ($cambios as $c) {
        $t .= "[{$c['tipo']}] O.P {$c['op']} · {$c['area']} · {$c['tarea']}\n  {$c['campo']}: {$c['anterior']} -> {$c['nuevo']}\n"
            . "  {$c['usuario']} {$c['correo']} · {$c['fecha']}\n" . ($c['detalle'] ? "  {$c['detalle']}\n" : '') . "\n";
    }
    return $t . "Torre de Control: {$C['APP_URL']}\n\n--\nDesarrollado por Jeider Buelvas · Desarrollador Full Stack\n";
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
