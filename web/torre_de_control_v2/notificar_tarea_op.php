<?php
/**
 * ============================================================
 *  notificar_tarea_op.php — Torre de Control · Polyuprotec S.A.
 * ============================================================
 *  Correo al RESPONSABLE cuando se anota una nota, compromiso o bloqueo
 *  en "📝 Tareas de la O.P." (con copia a quien la anotó).
 *  No se abre directo: lo usa bitacora.php después de guardar en la Maestra.
 *  Misma cuenta, servidor SMTP y estilo que los demás correos de la Torre.
 * ============================================================
 */
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) { http_response_code(404); exit; }

function tcop_config() {
    $SECRETOS = require __DIR__ . '/config.php';
    return [
        'SMTP_HOST'   => 'torredecontrol.polypro.space',
        'SMTP_PORT'   => 465,
        'SMTP_SECURE' => 'ssl',
        'SMTP_USER'   => 'notificacion@torredecontrol.polypro.space',
        'SMTP_PASS'   => $SECRETOS['SMTP_PASS'],
        'FROM_EMAIL'  => 'notificacion@torredecontrol.polypro.space',
        'FROM_NAME'   => 'Torre de Control · Polyuprotec',
        'APP_URL'     => 'https://torredecontrol.polypro.space/torre_de_control_v2/',
        'LOGO_ARCHIVOS' => [__DIR__ . '/icons/logo-correo.png', __DIR__ . '/icons/logo-polyuprotec.png'],
    ];
}

function tcop_e($s) { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }

/**
 * Envía el aviso. $r = registro guardado (Maestra), $ctx = datos de la O.P. (App),
 * $para = correo del responsable, $cc = correo de quien anotó (o '').
 * Devuelve true/false y deja el motivo en $err.
 */
function enviarAvisoTareaOP($r, $ctx, $para, $nombrePara, $cc, &$err) {
    $C = tcop_config();
    $C['_LOGO'] = null;
    foreach ($C['LOGO_ARCHIVOS'] as $f) { if (is_readable($f)) { $C['_LOGO'] = $f; break; } }
    $tipo = $r['tipo'] ?? 'Nota';
    $ico  = ['Nota' => '📝', 'Compromiso' => '✅', 'Bloqueo' => '⛔'][$tipo] ?? '📝';
    $asunto = $ico . ' ' . $tipo . ' asignado · O.P. ' . ($r['op'] ?? '') . (($ctx['nombre'] ?? '') ? ' — ' . $ctx['nombre'] : '') . ' · Torre de Control';
    $html  = tcop_plantilla($r, $ctx, $nombrePara, $C);
    $texto = tcop_texto($r, $ctx, $nombrePara, $C);
    return tcop_smtp($C, $para, $cc, $asunto, $html, $texto, $err);
}

function tcop_plantilla($r, $ctx, $nombrePara, $C) {
    $tipo = $r['tipo'] ?? 'Nota';
    $col = ['Nota' => '#7c5cfc', 'Compromiso' => '#f4a100', 'Bloqueo' => '#fc424a'][$tipo] ?? '#7c5cfc';
    $bg  = ['Nota' => '#f1edfe', 'Compromiso' => '#fff3df', 'Bloqueo' => '#ffe9ea'][$tipo] ?? '#f1edfe';
    $fila = function ($k, $v) { return $v === '' || $v === null ? '' : '<tr><td style="padding:5px 0;color:#8f9bb3;font-size:12px;width:150px;vertical-align:top">' . $k . '</td><td style="padding:5px 0;color:#2b2b40;font-size:13px;font-weight:bold">' . tcop_e($v) . '</td></tr>'; };
    $logo = !empty($C['_LOGO']) ? '<td align="right" valign="top" width="120"><span style="display:inline-block;background:#ffffff;border-radius:12px;padding:8px 12px"><img src="' . tcop_e($C['_LOGO_SRC'] ?? 'cid:logo-polyuprotec') . '" alt="Polyuprotec S.A." width="91" height="45" style="display:block;width:91px;height:45px;border:0"></span></td>' : '';
    return '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tareas de la O.P.</title></head>'
    . '<body style="margin:0;padding:0;background:#f4f5fb"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5fb"><tr><td align="center" style="padding:28px 12px">'
    . '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 4px 24px rgba(43,43,64,.08)">'
    . '<tr><td bgcolor="#8763e8" style="background:#8763e8;background-image:linear-gradient(100deg,#ee4d9e,#8763e8 55%,#4b6ef5);padding:26px 30px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="font-family:Arial,Helvetica,sans-serif;color:#ffffff">'
    .   '<div style="font-size:12px;letter-spacing:1px;opacity:.9;text-transform:uppercase">🏗️ Torre de Control · Polyuprotec S.A.</div>'
    .   '<div style="font-size:24px;font-weight:bold;margin-top:8px">📝 Tienes una tarea en la O.P. ' . tcop_e($r['op'] ?? '') . '</div>'
    .   '<div style="font-size:13px;opacity:.9;margin-top:4px">' . tcop_e($r['autor'] ?? '') . ' te asignó un' . ($tipo === 'Nota' ? 'a nota' : ($tipo === 'Bloqueo' ? ' bloqueo' : ' compromiso')) . ' el ' . tcop_e($r['fecha'] ?? '') . '</div>'
    . '</td>' . $logo . '</tr></table></td></tr>'
    . '<tr><td style="padding:22px 30px 6px;font-family:Arial,Helvetica,sans-serif">'
    .   '<div style="font-size:14px;color:#2b2b40">Hola ' . tcop_e($nombrePara) . ',</div>'
    .   '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;background:' . $bg . ';border-left:4px solid ' . $col . ';border-radius:12px"><tr><td style="padding:14px 16px;font-family:Arial,Helvetica,sans-serif">'
    .     '<span style="display:inline-block;padding:3px 10px;border-radius:20px;background:#ffffff;color:' . $col . ';font-size:11px;font-weight:bold">' . tcop_e($tipo) . ((($r['area'] ?? '') !== '') ? ' · ' . tcop_e($r['area']) : '') . '</span>'
    .     '<div style="font-size:16px;color:#2b2b40;font-weight:bold;margin-top:10px;line-height:1.45">' . tcop_e($r['descripcion'] ?? '') . '</div>'
    .     (($r['fechaCompromiso'] ?? '') ? '<div style="font-size:13px;color:#2b2b40;margin-top:8px">📅 Fecha compromiso: <b>' . tcop_e($r['fechaCompromiso']) . '</b></div>' : '')
    .   '</td></tr></table></td></tr>'
    . '<tr><td style="padding:16px 30px 4px;font-family:Arial,Helvetica,sans-serif"><div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#7c5cfc;font-weight:bold;margin-bottom:6px">📋 Datos de la O.P.</div>'
    .   '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">'
    .     $fila('O.P.', ($r['op'] ?? '') . (($ctx['nombre'] ?? '') ? ' — ' . $ctx['nombre'] : ''))
    .     $fila('Cliente', $ctx['cliente'] ?? '') . $fila('Comercial', $ctx['comercial'] ?? '') . $fila('Planta', $ctx['planta'] ?? '')
    .     $fila('Entrega al cliente', $ctx['entrega'] ?? '') . $fila('Responsable', $r['responsable'] ?? '') . $fila('Anotado por', ($r['autor'] ?? '') . (($r['correo'] ?? '') ? ' (' . $r['correo'] . ')' : ''))
    .   '</table></td></tr>'
    . '<tr><td align="center" style="padding:22px 24px 26px"><a href="' . tcop_e($C['APP_URL']) . '" style="display:inline-block;padding:13px 24px;border-radius:24px;background:#7c5cfc;background-image:linear-gradient(100deg,#ee4d9e,#8763e8 55%,#4b6ef5);color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;text-decoration:none">🚀 Abrir Torre de Control</a></td></tr>'
    . '<tr><td style="background:#f7f7fc;border-top:1px solid #edeef5;padding:16px 30px;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#8f9bb3;text-align:center;line-height:1.6">'
    .   'Para cerrarla: Torre de Control → tarjeta de la O.P. → 📝 Tareas de la O.P. → Cerrar.<br>'
    .   '<b style="color:#7c5cfc">Polyuprotec S.A.</b> · Sistema de Monitoreo Operativo<br>Desarrollado por <b style="color:#7c5cfc">Jeider Buelvas</b> · Desarrollador Full Stack'
    . '</td></tr></table></td></tr></table></body></html>';
}

function tcop_texto($r, $ctx, $nombrePara, $C) {
    $t = "Hola $nombrePara,\n\n" . ($r['autor'] ?? '') . ' te asignó en la O.P. ' . ($r['op'] ?? '') . ":\n\n"
       . ($r['tipo'] ?? '') . (($r['area'] ?? '') ? ' · ' . $r['area'] : '') . "\n" . ($r['descripcion'] ?? '') . "\n"
       . (($r['fechaCompromiso'] ?? '') ? 'Fecha compromiso: ' . $r['fechaCompromiso'] . "\n" : '') . "\n"
       . 'O.P.: ' . ($r['op'] ?? '') . (($ctx['nombre'] ?? '') ? ' — ' . $ctx['nombre'] : '') . "\n"
       . (($ctx['cliente'] ?? '') ? 'Cliente: ' . $ctx['cliente'] . "\n" : '') . (($ctx['comercial'] ?? '') ? 'Comercial: ' . $ctx['comercial'] . "\n" : '')
       . (($ctx['planta'] ?? '') ? 'Planta: ' . $ctx['planta'] . "\n" : '') . (($ctx['entrega'] ?? '') ? 'Entrega al cliente: ' . $ctx['entrega'] . "\n" : '');
    return $t . "\nTorre de Control: {$C['APP_URL']}\n\n--\nDesarrollado por Jeider Buelvas · Desarrollador Full Stack\n";
}

function tcop_mensaje($C, $para, $cc, $html, $texto, &$cab) {
    $alt = 'a' . bin2hex(random_bytes(12)); $rel = 'r' . bin2hex(random_bytes(12));
    $de = '=?UTF-8?B?' . base64_encode($C['FROM_NAME']) . '?= <' . $C['FROM_EMAIL'] . '>';
    $cuerpoAlt = "--$alt\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($texto))
        . "--$alt\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($html)) . "--$alt--\r\n";
    $comunes = "From: $de\r\nTo: $para\r\n" . ($cc ? "Cc: $cc\r\n" : '') . "MIME-Version: 1.0\r\n";
    if (empty($C['_LOGO'])) { $cab = $comunes . "Content-Type: multipart/alternative; boundary=\"$alt\"\r\n"; return $cuerpoAlt; }
    $cab = $comunes . "Content-Type: multipart/related; boundary=\"$rel\"; type=\"multipart/alternative\"\r\n";
    return "--$rel\r\nContent-Type: multipart/alternative; boundary=\"$alt\"\r\n\r\n" . $cuerpoAlt
        . "--$rel\r\nContent-Type: image/png; name=\"logo-polyuprotec.png\"\r\nContent-Transfer-Encoding: base64\r\n"
        . "Content-ID: <logo-polyuprotec>\r\nContent-Disposition: inline; filename=\"logo-polyuprotec.png\"\r\n\r\n"
        . chunk_split(base64_encode(file_get_contents($C['_LOGO']))) . "--$rel--\r\n";
}

/** Cliente SMTP mínimo (mismo de los demás correos de la Torre). */
function tcop_smtp($C, $para, $cc, $asunto, $html, $texto, &$err) {
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
    foreach (array_filter([$para, $cc]) as $p) if (!$cmd("RCPT TO:<$p>", 250)) { fclose($s); return false; }
    if (!$cmd('DATA', 354)) { fclose($s); return false; }
    $cab = '';
    $cuerpo = tcop_mensaje($C, $para, $cc, $html, $texto, $cab);
    $mensaje = 'Subject: =?UTF-8?B?' . base64_encode($asunto) . "?=\r\nDate: " . date('r') . "\r\n" . $cab . "\r\n" . $cuerpo;
    $mensaje = preg_replace('/^\./m', '..', $mensaje);
    if (!$cmd($mensaje . "\r\n.", 250)) { fclose($s); return false; }
    $cmd('QUIT', 221);
    fclose($s);
    return true;
}
