<?php
/**
 *  acceso.php — Manual Torre de Control · Polyuprotec S.A.
 *  Solo deja pasar con la sesión de la Torre de Control (login Google @polyuprotec.com).
 *  Usa la misma sesión de PHP que la App y bitacora.php.
 */
const DOMINIO    = 'polyuprotec.com';
const URL_LOGIN  = '../';   // Página de la Torre de Control que hace el login. Ajustar si es otra.

session_start();
$correo = strtolower(trim($_SESSION['pt_email'] ?? ''));
if (empty($_SESSION['pt_authenticated']) || !preg_match('/@' . preg_quote(DOMINIO, '/') . '$/', $correo)) {
    http_response_code(302);
    header('Location: ' . URL_LOGIN);
    header('Cache-Control: no-store');
    exit;
}
session_write_close();
