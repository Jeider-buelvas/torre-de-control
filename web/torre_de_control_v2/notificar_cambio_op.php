<?php
/**
 * ============================================================
 *  notificar_cambio_op.php — Torre de Control · Polyuprotec S.A.
 * ============================================================
 *  Correo "Notificación de modificación del número de O.P. viejo → nuevo".
 *  Lo llama la Macro Comercial (v14.11) SOLO cuando el cambio de número quedó
 *  guardado en todo el sistema. Mismo token (config.php → TOKEN = TOKEN_CORREO),
 *  misma cuenta, servidor SMTP y estilo que los demás correos de la Torre.
 * ============================================================
 */
$SECRETOS = require __DIR__ . '/config.php';
require_once __DIR__ . '/notificar_tarea_op.php';   // envío SMTP compartido (tcop_*)

$DESTINATARIOS = ['todos@polyuprotec.com'];

header('Content-Type: application/json; charset=UTF-8');
function responder($ok, $msg, $code = 200) { http_response_code($code); echo json_encode(['ok' => $ok, 'mensaje' => $msg], JSON_UNESCAPED_UNICODE); exit; }

if ($_SERVER['REQUEST_METHOD'] !== 'POST') responder(false, 'Método no permitido', 405);
$in = json_decode(file_get_contents('php://input'), true);
if (!is_array($in)) responder(false, 'JSON inválido', 400);
if (!hash_equals((string)$SECRETOS['TOKEN'], (string)($in['token'] ?? ''))) responder(false, 'Token inválido', 403);

$l = function ($v, $max = 200) { return mb_substr(trim((string)$v), 0, $max); };
$c = [
    'viejo' => $l($in['viejo'] ?? '', 20), 'nuevo' => $l($in['nuevo'] ?? '', 20), 'motivo' => $l($in['motivo'] ?? '', 500),
    'usuario' => $l($in['usuario'] ?? '', 120), 'fecha' => $l($in['fecha'] ?? '', 20),
    'nombre' => $l($in['nombre'] ?? ''), 'cliente' => $l($in['cliente'] ?? ''), 'comercial' => $l($in['comercial'] ?? ''),
    'areas' => array_values(array_filter(array_map(function ($a) { return mb_substr(trim((string)$a), 0, 60); }, is_array($in['areas'] ?? null) ? $in['areas'] : []))),
];
if ($c['viejo'] === '' || $c['nuevo'] === '' || $c['motivo'] === '') responder(false, 'Faltan datos del cambio', 400);

$C = tcop_config();
$C['_LOGO'] = null;
foreach ($C['LOGO_ARCHIVOS'] as $f) { if (is_readable($f)) { $C['_LOGO'] = $f; break; } }
$asunto = 'Notificación de modificación del número de O.P. ' . $c['viejo'] . ' → ' . $c['nuevo'];
$e = 'tcop_e';
$fila = function ($k, $v) use ($e) { return $v === '' ? '' : '<tr><td style="padding:6px 0;color:#8f9bb3;font-size:12px;width:150px;vertical-align:top">' . $k . '</td><td style="padding:6px 0;color:#2b2b40;font-size:14px;font-weight:bold">' . $e($v) . '</td></tr>'; };
$logo = $C['_LOGO'] ? '<td align="right" valign="top" width="120"><span style="display:inline-block;background:#ffffff;border-radius:12px;padding:8px 12px"><img src="' . $e($C['_LOGO_SRC'] ?? 'cid:logo-polyuprotec') . '" alt="Polyuprotec S.A." width="91" height="45" style="display:block;width:91px;height:45px;border:0"></span></td>' : '';
$html = '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Cambio de número de O.P.</title></head>'
 . '<body style="margin:0;padding:0;background:#f4f5fb"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5fb"><tr><td align="center" style="padding:28px 12px">'
 . '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 4px 24px rgba(43,43,64,.08)">'
 . '<tr><td bgcolor="#8763e8" style="background:#8763e8;background-image:linear-gradient(100deg,#ee4d9e,#8763e8 55%,#4b6ef5);padding:26px 30px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="font-family:Arial,Helvetica,sans-serif;color:#ffffff">'
 .   '<div style="font-size:12px;letter-spacing:1px;opacity:.9;text-transform:uppercase">🏗️ Torre de Control · Polyuprotec S.A.</div>'
 .   '<div style="font-size:24px;font-weight:bold;margin-top:8px">🔢 Cambio de número de O.P.</div>'
 .   '<div style="font-size:30px;font-weight:bold;margin-top:6px;letter-spacing:.5px">' . $e($c['viejo']) . ' → ' . $e($c['nuevo']) . '</div></td>' . $logo . '</tr></table></td></tr>'
 . '<tr><td style="padding:22px 30px 6px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#2b2b40;line-height:1.55">'
 .   'Se informa que se ha realizado una modificación en el número de una Orden de Producción desde el módulo Comercial.</td></tr>'
 . '<tr><td style="padding:10px 30px 4px;font-family:Arial,Helvetica,sans-serif"><div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#7c5cfc;font-weight:bold;margin-bottom:6px">Detalle de la modificación</div>'
 .   '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">'
 .     $fila('O.P. anterior', $c['viejo']) . $fila('O.P. nueva', $c['nuevo']) . $fila('Motivo', $c['motivo'])
 .     $fila('Modificado por', $c['usuario']) . $fila('Fecha y hora', $c['fecha'])
 .     $fila('Proyecto', $c['nombre']) . $fila('Cliente', $c['cliente']) . $fila('Comercial', $c['comercial'])
 .     $fila('Actualizado en', implode(', ', $c['areas']))
 .   '</table></td></tr>'
 . '<tr><td style="padding:14px 30px 4px;font-family:Arial,Helvetica,sans-serif;font-size:12.5px;color:#5a5a72;line-height:1.55">Esta notificación tiene como finalidad mantener informadas a las áreas involucradas y garantizar la trazabilidad de los cambios realizados en las órdenes de producción. Los datos de la O.P. (fechas, kg, estados y observaciones) se conservan con el número nuevo.</td></tr>'
 . '<tr><td align="center" style="padding:22px 24px 26px"><a href="' . $e($C['APP_URL']) . '" style="display:inline-block;padding:13px 24px;border-radius:24px;background:#7c5cfc;background-image:linear-gradient(100deg,#ee4d9e,#8763e8 55%,#4b6ef5);color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;text-decoration:none">🚀 Abrir Torre de Control</a></td></tr>'
 . '<tr><td style="background:#f7f7fc;border-top:1px solid #edeef5;padding:16px 30px;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#8f9bb3;text-align:center;line-height:1.6"><b style="color:#7c5cfc">Polyuprotec S.A.</b> · Sistema de Monitoreo Operativo<br>Desarrollado por <b style="color:#7c5cfc">Jeider Buelvas</b> · Desarrollador Full Stack</td></tr>'
 . '</table></td></tr></table></body></html>';
$texto = "Se informa que se ha realizado una modificación en el número de una Orden de Producción desde el módulo Comercial.\n\nDetalle de la modificación:\n"
 . "- O.P. anterior: {$c['viejo']}\n- O.P. nueva: {$c['nuevo']}\n- Motivo: {$c['motivo']}\n- Modificado por: {$c['usuario']}\n- Fecha y hora: {$c['fecha']}\n"
 . ($c['nombre'] ? "- Proyecto: {$c['nombre']}\n" : '') . "\nEsta notificación tiene como finalidad mantener informadas a las áreas involucradas y garantizar la trazabilidad de los cambios realizados en las órdenes de producción.\n\n"
 . "Torre de Control: {$C['APP_URL']}\n";

$err = '';
$ok = true;
foreach ($DESTINATARIOS as $d) { if (!tcop_smtp($C, $d, '', $asunto, $html, $texto, $err)) { $ok = false; break; } }
$ok ? responder(true, 'Correo enviado a ' . implode(', ', $DESTINATARIOS)) : responder(false, 'No se pudo enviar: ' . $err, 500);
