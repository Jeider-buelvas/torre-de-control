<?php
/**
 * ============================================================
 *  presencia.php — Torre de Control · Polyuprotec S.A.
 * ============================================================
 *  "¿Quién está en línea?": cada pestaña abierta de la App avisa cada
 *  30 s (vista, planta, si está a la vista) y recibe:
 *    • enLinea : personas con la Torre abierta (activo / ausente)
 *    • hoy     : personas que entraron hoy (primera y última hora)
 *  La identidad sale de la SESIÓN (login Google @polyuprotec.com), no de
 *  lo que envíe el navegador. Los datos quedan en datos_presencia/
 *  (carpeta bloqueada con .htaccess). No usa Apps Script ni la Maestra.
 * ============================================================
 */
session_start();
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store');

const DOMINIO        = 'polyuprotec.com';
const SEG_EN_LINEA   = 90;    // sin aviso en 90 s → ya no está en línea
const SEG_BORRAR_TAB = 600;   // pestañas sin aviso en 10 min se eliminan del archivo
const ZONA           = 'America/Bogota';

function salir($code, $arr) { http_response_code($code); echo json_encode($arr, JSON_UNESCAPED_UNICODE); exit; }

$correo = strtolower(trim($_SESSION['pt_email'] ?? ''));
if (empty($_SESSION['pt_authenticated']) || !preg_match('/@' . preg_quote(DOMINIO, '/') . '$/', $correo))
    salir(401, ['ok' => false, 'error' => 'sin_sesion']);
$nombre = trim($_SESSION['pt_nombre'] ?? '') ?: $correo;
$foto   = trim($_SESSION['pt_foto'] ?? '');
session_write_close();   // no bloquear otras peticiones de la misma sesión

if ($_SERVER['REQUEST_METHOD'] !== 'POST') salir(405, ['ok' => false, 'error' => 'metodo']);
$in = json_decode(file_get_contents('php://input'), true);
if (!is_array($in)) $in = [];
$limpio = function ($v, $max) { return mb_substr(trim(preg_replace('/[\x00-\x1F<>]/u', '', (string)$v)), 0, $max); };
$tab     = preg_replace('/[^A-Za-z0-9]/', '', (string)($in['tab'] ?? '')) ?: 'x';
$tab     = substr($tab, 0, 24);
$vista   = $limpio($in['vista'] ?? '', 40);
$planta  = $limpio($in['planta'] ?? '', 20);
$visible = !empty($in['visible']);
$sale    = !empty($in['salir']);

// ── Carpeta de datos (bloqueada al navegador) ──
$dir = __DIR__ . '/datos_presencia';
if (!is_dir($dir)) @mkdir($dir, 0750, true);
if (!is_file("$dir/.htaccess"))
    @file_put_contents("$dir/.htaccess", "<IfModule mod_authz_core.c>\n  Require all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\n  Order allow,deny\n  Deny from all\n</IfModule>\n");

$tz    = new DateTimeZone(ZONA);
$ahora = time();
$hoy   = (new DateTime('now', $tz))->format('Y-m-d');

// ── Lectura / escritura con bloqueo (varias pestañas a la vez) ──
$fp = @fopen("$dir/estado.json", 'c+');
if (!$fp) salir(500, ['ok' => false, 'error' => 'almacenamiento']);
flock($fp, LOCK_EX);
$txt = stream_get_contents($fp);
$db  = json_decode($txt ?: '{}', true);
if (!is_array($db)) $db = [];
if (($db['_dia'] ?? '') !== $hoy) $db = ['_dia' => $hoy, 'usuarios' => [], 'hoy' => []];   // nuevo día: se reinicia "Hoy entraron"
$U = &$db['usuarios'];

// Mi pestaña
if (!isset($U[$correo])) $U[$correo] = ['tabs' => []];
$U[$correo]['nombre'] = $nombre;
$U[$correo]['foto']   = $foto;
if ($sale) {
    unset($U[$correo]['tabs'][$tab]);
} else {
    $prev  = $U[$correo]['tabs'][$tab] ?? null;
    $desde = ($prev && $ahora - (int)$prev['ultimo'] <= SEG_EN_LINEA) ? (int)$prev['desde'] : $ahora;
    $U[$correo]['tabs'][$tab] = ['vista' => $vista, 'planta' => $planta, 'visible' => $visible, 'ultimo' => $ahora, 'desde' => $desde];
    // Hoy entraron
    $h = $db['hoy'][$correo] ?? ['nombre' => $nombre, 'primero' => $ahora, 'ultimo' => $ahora];
    $h['nombre'] = $nombre; $h['ultimo'] = $ahora;
    $db['hoy'][$correo] = $h;
}

// Limpieza y armado de la lista
$enLinea = [];
foreach ($U as $mail => &$u) {
    foreach ($u['tabs'] as $id => $t) if ($ahora - (int)$t['ultimo'] > SEG_BORRAR_TAB) unset($u['tabs'][$id]);
    $vivas = array_filter($u['tabs'], function ($t) use ($ahora) { return $ahora - (int)$t['ultimo'] <= SEG_EN_LINEA; });
    if (!$vivas) continue;
    $vis = array_filter($vivas, function ($t) { return !empty($t['visible']); });
    $base = $vis ?: $vivas;
    uasort($base, function ($a, $b) { return $b['ultimo'] <=> $a['ultimo']; });
    $t = reset($base);
    $enLinea[] = [
        'correo' => $mail, 'nombre' => $u['nombre'] ?? $mail, 'foto' => $u['foto'] ?? '',
        'estado' => $vis ? 'activo' : 'ausente', 'vista' => $t['vista'], 'planta' => $t['planta'],
        'desde'  => min(array_map(function ($x) { return (int)$x['desde']; }, $vivas)),
        'pestanas' => count($vivas), 'yo' => $mail === $correo,
    ];
}
unset($u);
foreach ($U as $mail => $u) if (!$u['tabs']) unset($U[$mail]);
unset($U);

// Directorio permanente de quienes han usado la Torre (para el campo Responsable de Tareas de la O.P.)
$fd = @fopen("$dir/usuarios.json", 'c+');
$directorio = [];
if ($fd) {
    flock($fd, LOCK_EX);
    $us = json_decode(stream_get_contents($fd) ?: '{}', true);
    if (!is_array($us)) $us = [];
    if (!$sale) $us[$correo] = ['nombre' => $nombre, 'ultimo' => $ahora];
    ftruncate($fd, 0); rewind($fd); fwrite($fd, json_encode($us, JSON_UNESCAPED_UNICODE)); fflush($fd);
    flock($fd, LOCK_UN); fclose($fd);
    foreach ($us as $m => $x) $directorio[] = ['correo' => $m, 'nombre' => $x['nombre'] ?? $m];
}

ftruncate($fp, 0); rewind($fp);
fwrite($fp, json_encode($db, JSON_UNESCAPED_UNICODE));
fflush($fp); flock($fp, LOCK_UN); fclose($fp);

usort($enLinea, function ($a, $b) {
    if ($a['estado'] !== $b['estado']) return $a['estado'] === 'activo' ? -1 : 1;
    return strcasecmp($a['nombre'], $b['nombre']);
});
$hoyLista = [];
foreach ($db['hoy'] as $mail => $h) $hoyLista[] = ['correo' => $mail, 'nombre' => $h['nombre'], 'primero' => (int)$h['primero'], 'ultimo' => (int)$h['ultimo']];
usort($hoyLista, function ($a, $b) { return $b['ultimo'] <=> $a['ultimo']; });

salir(200, ['ok' => true, 'ahora' => $ahora, 'enLinea' => $enLinea, 'hoy' => $hoyLista, 'directorio' => $directorio]);
