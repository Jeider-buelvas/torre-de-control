<?php
/**
 * ============================================================
 *  notificar_bitacora.php — Torre de Control · Polyuprotec S.A.
 * ============================================================
 *  Correo SEMANAL (lunes) de la Bitácora de la OP, enviado desde la Maestra (v4.4):
 *  compromisos vencidos, compromisos que vencen en los próximos 7 días y
 *  bloqueos abiertos. Misma cuenta y estilo que los demás correos.
 * ============================================================
 */

// ======================== CONFIGURACIÓN ========================
$SECRETOS = require __DIR__ . '/config.php';   // TOKEN y SMTP_PASS: config.php (no se sube a GitHub)
$CONFIG = [
    // Debe ser EXACTAMENTE el mismo valor de TOKEN_CORREO_CAMBIOS (TOKEN_BITACORA) en la Maestra (v4.4)
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
    // ¿Enviar copia a quien anotó cada compromiso/bloqueo? (además de DESTINATARIOS)
    'COPIA_A_LOS_AUTORES' => false,

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

$limpio = function ($v, $max = 200) { return mb_substr(trim((string)$v), 0, $max); };
$lista = function ($k) use ($in, $limpio) {
    $o = [];
    foreach ((is_array($in[$k] ?? null) ? $in[$k] : []) as $b) {
        if (!is_array($b)) continue;
        $o[] = ['op' => $limpio($b['op'] ?? '', 20), 'nombreOP' => $limpio($b['nombreOP'] ?? ''), 'cliente' => $limpio($b['cliente'] ?? ''),
                'area' => $limpio($b['area'] ?? '', 40), 'descripcion' => $limpio($b['descripcion'] ?? '', 600), 'responsable' => $limpio($b['responsable'] ?? '', 80),
                'fechaCompromiso' => $limpio($b['fechaCompromiso'] ?? '', 10), 'dias' => (int)($b['dias'] ?? 0), 'autor' => $limpio($b['autor'] ?? '', 80),
                'correo' => $limpio($b['correo'] ?? '', 120), 'fecha' => $limpio($b['fecha'] ?? '', 20)];
        if (count($o) >= 150) break;
    }
    return $o;
};
$vencidos = $lista('vencidos'); $proximos = $lista('proximos'); $bloqueos = $lista('bloqueos');
$total = count($vencidos) + count($proximos) + count($bloqueos);
if (!$total) responder(false, 'Nada que reportar', 400);

$valido = function ($e) { return filter_var($e, FILTER_VALIDATE_EMAIL) ? strtolower($e) : null; };
$para = [];
foreach ($CONFIG['DESTINATARIOS'] as $e) if ($v = $valido($e)) $para[$v] = true;
if ($CONFIG['COPIA_A_LOS_AUTORES']) foreach (array_merge($vencidos, $proximos, $bloqueos) as $b) if ($v = $valido($b['correo'])) $para[$v] = true;
$para = array_keys($para);
if (!$para) responder(false, 'No hay destinatarios configurados', 500);

$asunto = '📝 Tareas de las O.P: ' . count($vencidos) . ' compromiso' . (count($vencidos) === 1 ? '' : 's') . ' vencido' . (count($vencidos) === 1 ? '' : 's')
        . ' · ' . count($proximos) . ' por vencer · ' . count($bloqueos) . ' bloqueo' . (count($bloqueos) === 1 ? '' : 's') . ' — Torre de Control';
$CONFIG['_LOGO'] = null;
foreach ($CONFIG['LOGO_ARCHIVOS'] as $f) { if (is_readable($f)) { $CONFIG['_LOGO'] = $f; break; } }
$html  = plantillaBitacora($vencidos, $proximos, $bloqueos, $CONFIG);
$texto = textoBitacora($vencidos, $proximos, $bloqueos, $CONFIG);
$err = '';
$ok = $CONFIG['SMTP_HOST'] ? enviarSMTP($CONFIG, $para, $asunto, $html, $texto, $err) : enviarMail($CONFIG, $para, $asunto, $html, $texto, $err);
$ok ? responder(true, 'Correo enviado a ' . count($para) . ' destinatario(s)') : responder(false, 'No se pudo enviar: ' . $err, 500);


// ======================= PLANTILLA HTML =======================
function e($s) { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }

function bloqueLista($titulo, $ico, $col, $bg, $items, $chip) {
    if (!$items) return '';
    $h = '<tr><td style="padding:18px 30px 4px"><div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;color:#2b2b40;text-transform:uppercase;letter-spacing:.5px">'
       . $ico . ' ' . e($titulo) . ' (' . count($items) . ')</div></td></tr>';
    foreach ($items as $b) {
        $h .= '<tr><td style="padding:4px 30px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7fc;border:1px solid #edeef5;border-left:4px solid ' . $col . ';border-radius:12px"><tr><td style="padding:12px 14px;font-family:Arial,Helvetica,sans-serif">'
            . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>'
            .   '<td style="font-family:Consolas,Menlo,monospace;font-size:12px;color:#7c5cfc;font-weight:bold">O.P ' . e($b['op']) . ($b['nombreOP'] ? ' <span style="font-family:Arial,sans-serif;color:#5a5a72;font-weight:normal">· ' . e($b['nombreOP']) . '</span>' : '') . '</td>'
            .   '<td align="right"><span style="display:inline-block;padding:3px 9px;border-radius:20px;background:' . $bg . ';color:' . $col . ';font-size:11px;font-weight:bold;white-space:nowrap">' . $chip($b) . '</span></td>'
            . '</tr></table>'
            . '<div style="font-size:14px;color:#2b2b40;font-weight:bold;margin-top:6px;line-height:1.45">' . e($b['descripcion']) . '</div>'
            . '<div style="font-size:12px;color:#5a5a72;margin-top:6px">👤 Responsable: <b>' . e($b['responsable'] ?: '—') . '</b>' . ($b['area'] ? ' · 📍 ' . e($b['area']) : '') . ($b['fechaCompromiso'] ? ' · 📅 ' . e($b['fechaCompromiso']) : '') . '</div>'
            . '<div style="font-size:11px;color:#8f9bb3;margin-top:5px">Anotado por ' . e($b['autor'] ?: '—') . ' · ' . e($b['fecha']) . '</div>'
            . '</td></tr></table></td></tr>';
    }
    return $h;
}

function plantillaBitacora($vencidos, $proximos, $bloqueos, $C) {
    $hoy = (new DateTime('now', new DateTimeZone('America/Bogota')))->format('d/m/Y');
    $kpi = function ($n, $l, $col, $bg) { return '<td width="33%" style="padding:4px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:' . $bg . ';border-radius:12px"><tr><td style="padding:12px;text-align:center;font-family:Arial,sans-serif"><div style="font-size:26px;font-weight:bold;color:' . $col . '">' . $n . '</div><div style="font-size:11px;color:#5a5a72;margin-top:2px">' . $l . '</div></td></tr></table></td>'; };
    return '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tareas de las O.P</title></head>'
    . '<body style="margin:0;padding:0;background:#f4f5fb">'
    . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5fb"><tr><td align="center" style="padding:28px 12px">'
    . '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 4px 24px rgba(43,43,64,.08)">'
    . '<tr><td bgcolor="#8763e8" style="background:#8763e8;background-image:linear-gradient(100deg,#ee4d9e,#8763e8 55%,#4b6ef5);padding:26px 30px">'
    .   '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="font-family:Arial,Helvetica,sans-serif;color:#ffffff">'
    .     '<div style="font-size:12px;letter-spacing:1px;opacity:.9;text-transform:uppercase">🏗️ Torre de Control · Polyuprotec S.A.</div>'
    .     '<div style="font-size:24px;font-weight:bold;margin-top:8px">📝 Resumen semanal de Tareas de las O.P</div>'
    .     '<div style="font-size:13px;opacity:.9;margin-top:4px">Compromisos y bloqueos al ' . $hoy . '</div></td>'
    .   (!empty($C['_LOGO']) ? '<td align="right" valign="top" width="120"><span style="display:inline-block;background:#ffffff;border-radius:12px;padding:8px 12px"><img src="' . e($C['_LOGO_SRC'] ?? 'cid:logo-polyuprotec') . '" alt="Polyuprotec S.A." width="91" height="45" style="display:block;width:91px;height:45px;border:0"></span></td>' : '')
    .   '</tr></table></td></tr>'
    . '<tr><td style="padding:20px 26px 4px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>'
    .   $kpi(count($vencidos), 'compromisos vencidos', '#fc424a', '#ffe9ea') . $kpi(count($proximos), 'vencen en 7 días', '#f4a100', '#fff3df') . $kpi(count($bloqueos), 'bloqueos abiertos', '#7c5cfc', '#f1edfe')
    . '</tr></table></td></tr>'
    . bloqueLista('Compromisos vencidos', '⛔', '#fc424a', '#ffe9ea', $vencidos, function ($b) { return 'Vencido hace ' . $b['dias'] . ' día' . ($b['dias'] === 1 ? '' : 's'); })
    . bloqueLista('Vencen en los próximos 7 días', '⏰', '#f4a100', '#fff3df', $proximos, function ($b) { return $b['dias'] === 0 ? 'Vence HOY' : 'Faltan ' . $b['dias'] . ' día' . ($b['dias'] === 1 ? '' : 's'); })
    . bloqueLista('Bloqueos abiertos', '🚧', '#7c5cfc', '#f1edfe', $bloqueos, function ($b) { return 'Bloqueo'; })
    . '<tr><td align="center" style="padding:22px 24px 26px"><a href="' . e($C['APP_URL']) . '" style="display:inline-block;padding:13px 24px;border-radius:24px;background:#7c5cfc;background-image:linear-gradient(100deg,#ee4d9e,#8763e8 55%,#4b6ef5);color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;text-decoration:none">🚀 Abrir Torre de Control</a></td></tr>'
    . '<tr><td style="background:#f7f7fc;border-top:1px solid #edeef5;padding:16px 30px;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#8f9bb3;text-align:center;line-height:1.6">'
    .   'Para cerrar un compromiso: Torre de Control → tarjeta de la O.P → 📝 Tareas de la O.P → Cerrar.<br>'
    .   '<b style="color:#7c5cfc">Polyuprotec S.A.</b> · Sistema de Monitoreo Operativo<br>Desarrollado por <b style="color:#7c5cfc">Jeider Buelvas</b> · Desarrollador Full Stack'
    . '</td></tr></table></td></tr></table></body></html>';
}

function textoBitacora($v, $p, $b, $C) {
    $t = "Resumen semanal de Tareas de las O.P\n\n";
    foreach ([['COMPROMISOS VENCIDOS', $v], ['VENCEN EN 7 DÍAS', $p], ['BLOQUEOS ABIERTOS', $b]] as $g) {
        if (!$g[1]) continue;
        $t .= $g[0] . "\n";
        foreach ($g[1] as $x) $t .= "- O.P {$x['op']}: {$x['descripcion']} · Resp: {$x['responsable']} · {$x['fechaCompromiso']}\n";
        $t .= "\n";
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
