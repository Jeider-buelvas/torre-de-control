<?php
/**
 * ============================================================
 *  bitacora.php — Torre de Control · Polyuprotec S.A.
 * ============================================================
 *  Puente entre la App y la Maestra para la BITÁCORA DE LA OP.
 *  - Solo funciona con sesión iniciada (login de Google @polyuprotec.com).
 *  - El autor de cada anotación es el usuario de la sesión: no lo manda la App.
 *  - Reenvía a la Maestra (doPost) con el TOKEN; la Maestra valida y guarda en
 *    la hoja BITACORA_OP (no se borra ni se edita: se cierra con nota).
 * ============================================================
 */
$CONFIG = [
    // Mismo Web App que usa la App para leer los datos (app.html → WEB_APP_URL)
    'WEB_APP_URL' => 'https://script.google.com/macros/s/AKfycbyWtYmov4ExKuL9Tu5MOaskUinIRhap3sV_nHsu-58wz_xOB107WST8cCQXY834frKAiQ/exec',
    // Igual que TOKEN_CORREO_CAMBIOS en la Maestra
    'TOKEN'       => 'CONFIGURAR_AQUI',
    'DOMINIO'     => 'polyuprotec.com',
];

session_start();
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store');

function responder($a, $code = 200) { http_response_code($code); echo json_encode($a, JSON_UNESCAPED_UNICODE); exit; }

if ($_SERVER['REQUEST_METHOD'] !== 'POST') responder(['ok' => false, 'error' => 'Método no permitido'], 405);
if (empty($_SESSION['pt_authenticated'])) responder(['ok' => false, 'error' => 'Tu sesión terminó. Vuelve a iniciar sesión.'], 401);
$correo = strtolower(trim($_SESSION['pt_email'] ?? ''));
if (!preg_match('/@' . preg_quote($CONFIG['DOMINIO'], '/') . '$/', $correo)) responder(['ok' => false, 'error' => 'Cuenta no autorizada'], 403);

// Solo desde la propia App (mismo sitio)
$origen = $_SERVER['HTTP_ORIGIN'] ?? ($_SERVER['HTTP_REFERER'] ?? '');
if ($origen && parse_url($origen, PHP_URL_HOST) !== ($_SERVER['HTTP_HOST'] ?? '')) responder(['ok' => false, 'error' => 'Origen no permitido'], 403);

$in = json_decode(file_get_contents('php://input'), true);
if (!is_array($in)) responder(['ok' => false, 'error' => 'JSON inválido'], 400);
$accion = $in['accion'] ?? '';
if (!in_array($accion, ['agregar', 'cerrar'], true)) responder(['ok' => false, 'error' => 'Acción no válida'], 400);

$payload = [
    'token'   => $CONFIG['TOKEN'],
    'accion'  => $accion,
    'usuario' => ['correo' => $correo, 'nombre' => $_SESSION['pt_nombre'] ?? $correo],
];
if ($accion === 'agregar') $payload['datos'] = is_array($in['datos'] ?? null) ? $in['datos'] : [];
else { $payload['id'] = (string)($in['id'] ?? ''); $payload['nota'] = (string)($in['nota'] ?? ''); }

$ch = curl_init($CONFIG['WEB_APP_URL']);
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => json_encode($payload, JSON_UNESCAPED_UNICODE),
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,      // Apps Script responde con una redirección
    CURLOPT_TIMEOUT        => 40,
]);
$resp = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$err  = curl_error($ch);
curl_close($ch);

if ($resp === false) responder(['ok' => false, 'error' => 'No se pudo conectar con la Maestra: ' . $err], 502);
$json = json_decode($resp, true);
if (!is_array($json)) responder(['ok' => false, 'error' => 'La Maestra no respondió como se esperaba (HTTP ' . $code . '). ¿Se publicó la v4.4 como Nueva versión?'], 502);
responder($json, !empty($json['ok']) ? 200 : 400);
