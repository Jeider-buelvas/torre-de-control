<?php
/** Entrega imágenes y el PDF del manual solo con sesión iniciada. */
require __DIR__ . '/acceso.php';
$f = $_GET['f'] ?? '';
if (!preg_match('/^[A-Za-z0-9_.\-]+\.(jpg|png|pdf)$/', $f)) { http_response_code(404); exit; }
$ruta = __DIR__ . '/privado/' . (preg_match('/\.pdf$/', $f) ? '' : 'img/') . $f;
if (!is_file($ruta)) { http_response_code(404); exit; }
$tipos = ['jpg' => 'image/jpeg', 'png' => 'image/png', 'pdf' => 'application/pdf'];
header('Content-Type: ' . $tipos[pathinfo($f, PATHINFO_EXTENSION)]);
header('Content-Length: ' . filesize($ruta));
header('Cache-Control: private, max-age=86400');
header('X-Robots-Tag: noindex, nofollow');
readfile($ruta);
