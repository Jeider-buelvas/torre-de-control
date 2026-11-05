<?php
require __DIR__ . '/acceso.php';
header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: private, no-store');
header('X-Robots-Tag: noindex, nofollow');
readfile(__DIR__ . '/privado/manual.html');
