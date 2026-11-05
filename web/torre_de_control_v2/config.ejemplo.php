<?php
/**
 *  config.ejemplo.php — copiar como config.php y poner los SECRETOS de la Torre de Control (hosting).
 *  - NO se sube a GitHub (.gitignore). Solo vive en el servidor.
 *  - TOKEN: el mismo valor que TOKEN_CORREO (Macro Comercial) y
 *           TOKEN_CORREO_CAMBIOS (Maestra) en Propiedades del script.
 *  - SMTP_PASS: contraseña de la cuenta de notificaciones.
 */
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === 'config.php') { http_response_code(404); exit; }
return [
    'TOKEN'     => 'CONFIGURAR_AQUI',
    'SMTP_PASS' => 'CONFIGURAR_AQUI',
];
