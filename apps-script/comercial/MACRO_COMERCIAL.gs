// ============================================================
//  MACRO_COMERCIAL — v14.2
//  v14.2: menú "🔎 Buscar O.P" (al lado de "🚀 Torre de Control") y función
//         buscarOP para el botón de BASE_CREADOR: ventana con buscador por número,
//         proyecto, cliente o comercial; un clic (o Enter) abre la hoja de la OP.
//
//  MACRO_COMERCIAL — v14.1
//  v14.1: "Preparar registro de entregas" no se ejecuta dos veces a la vez (doble
//         clic) y no toma las hojas de respaldo (…_respaldo_…), para no repetir OP.
//
//  MACRO_COMERCIAL — v14
//  v14:
//   - Menú "🧩 Tareas de la OP": Comercial marca tareas que NO APLICAN (su peso
//     se reparte entre las demás de la subestructura; en el área quedan en estado
//     "No aplica") y puede poner un nombre de tarea solo para esa OP.
//   - Cumplimiento de entrega al cliente: hojas ENTREGAS_CLIENTE (fecha original,
//     vigente, reprogramaciones, entrega real) y REPROGRAMACIONES_ENTREGA.
//     Al cambiar la fecha de entrega con Editar OP se pide motivo obligatorio.
//     Menú "🚚 Registrar entrega real al cliente" (queda fija; solo usuario
//     autorizado la corrige) y "📅 Preparar registro de entregas" (una vez).
//
//  MACRO_COMERCIAL — v13
//  v13 (acuerdos de la reunión):
//   - Las tareas NUEVAS nacen en estado "Abierto" (antes "En pausa", que en las
//     áreas tipo A sumaba % de aporte sin trabajo real). Las O.P ya existentes
//     no se tocan.
//   - Las tareas NUEVAS ya no reciben una fecha de inicio real automática
//     (antes = fecha de inicio planeada, y las siguientes encadenadas), porque
//     hacía ver fechas "reales" y 100% de cumplimiento sin avance. Si Comercial
//     digita inicio/duración real en la hoja O.P, se siguen pasando como antes.
//     Las siguientes tareas se encadenan solo cuando la anterior tiene fin real.
//   - Orden de áreas parametrizable en ORDEN_AREAS (Diseño → Dibujo → Compras →
//     Producción → Galvanizado → Pintura → Logística → Montaje → Administración).
//     El menú "🔀 Ordenar lista de áreas" acomoda la lista de chequeo de
//     BASE_CREADOR en ese orden; cada casilla se ubica por su nombre.
//   - "Extraer Datos al Gantt": las tareas de Comercial ya no aparecen como
//     Terminado / 100% con fecha fija.
//
//  MACRO_COMERCIAL — v12
//  v12 (auditoría vs. original):
//   - Recuperado del original: al actualizar la O.P en las áreas se vuelven a
//     pasar FECHA_INICIO_TAREA_REAL y DURACION_DIAS_TAREAS_REAL de la hoja O.P
//     (si están digitadas). v9–v11 habían dejado de hacerlo.
//   - Recuperado del original: si una O.P aparece repetida en un cronograma, se
//     toma la ÚLTIMA aparición (como el borrado original).
//   - Todo lo demás (creación, fórmulas, planeado, KG, fecha de entrega,
//     edición, registro, correo) se mantiene; verificado celda por celda.
//
//  v11.2
//  v11.2: menú '📨 Reenviar correo de una O.P ya creada'.
//
//  v11.1
//  v11.1: si la cuenta no tiene acceso a un archivo de área, lo dice claro
//         (antes salía 'Falta autorizar el script').
//
//  v11
//  v11: al crear una O.P se envía un correo de aviso (detalles + áreas)
//       desde la cuenta del HOSTING, vía notificar_op.php. Configurar
//       URL_NOTIFICAR_OP y TOKEN_CORREO más abajo (sección v11).
//
//  v10
//  v10: el área Producción apunta a PLANTILLA_LOOKER_PRODUCCION_V2 (pegar su ID en IDS_AREAS).
//
//  v9.5
//  v9.5: ya no se atrapa la petición de permisos: Google muestra su
//        ventana 'Se requiere autorización' (desde la hoja o el editor).
//
//  v9.3: quitado un texto de ayuda que Google interpretaba como
//        'solo este documento' y bloqueaba el acceso a las áreas.
//
//  v9.2: función autorizarAreas (menú 🔐) para dar el permiso de
//        Google y probar el acceso a cada archivo de área.
//
//  v9.1: si falta el permiso para abrir los archivos de las áreas,
//        se pide la autorización (o se explica cómo darla) en vez
//        de mostrar el error técnico de SpreadsheetApp.openById.
//
//  CAMBIOS v9 — EDITAR OP (solo comercial) + REGISTRO DE CAMBIOS:
//  - ✏️ Cargar OP para editar: llena BASE_CREADOR con los datos de
//    una OP existente. En modo edición el botón "Crear Nueva OP"
//    GUARDA los cambios (aviso amarillo en E6).
//  - Guardar cambios: si solo cambian datos generales se actualiza la
//    hoja OP; si cambian áreas o # de subestructuras, la hoja OP se
//    reconstruye CONSERVANDO nombres/KG de subestructura, fechas,
//    duraciones y observaciones ya digitadas.
//  - 📤 Enviar / Actualizar OP en Áreas: ya NO borra y recrea la OP
//    en el área. Si existe, la ACTUALIZA en su sitio sin tocar lo que
//    llena el área (ESTADO, KG avance, fechas/duración reales,
//    OBSERVACIONES). Subestructuras nuevas se agregan al final; las
//    que sobran se borran (avisando si tienen avance). Si se quitó un
//    área, pregunta antes de borrar la OP de su cronograma.
//  - Corregido: al reenviar, antes se borraba un número de filas
//    calculado con la configuración NUEVA (podía borrar filas de otra
//    OP). Ahora se borra/ubica el bloque real de la OP.
//  - Hoja REGISTRO_CAMBIOS: fecha, usuario, OP, origen, área,
//    subestructura, tarea, campo, valor anterior y nuevo.
//  - Ya no se puede "reemplazar" una OP existente desde el botón
//    (se perdían datos): se ofrece cargarla para editar.
//  - Las fórmulas de las áreas son exactamente las mismas de v8.
//
//  (historial anterior)
//  MACRO_COMERCIAL — v8
//
//  CAMBIOS v8:
//  - Nuevo campo en BASE_CREADOR (fila 9, debajo de "Agregar
//    subestructuras"): FECHA DE ENTREGA AL CLIENTE.
//    Se crea una sola vez con el menú
//    Torre de Control > 📅 Agregar campo Fecha de entrega.
//  - La fecha se guarda en la hoja OP (col AK, META_FECHA_ENTREGA)
//    y al enviar aparece en el Cronograma de TODAS las áreas en una
//    columna "FECHA_ENTREGA_CLIENTE" justo después de OBSERVACIONES
//    (AC). La primera vez se inserta la columna AD en cada plantilla;
//    el bloque PLANEADO pasa de AD..AJ a AE..AK y el Gantt de AK a AL.
//    El script detecta ese corrimiento por el encabezado
//    FECHA_INICIO_TAREA_PLANEADO y ajusta todas sus columnas/fórmulas.
//  - Las filas de áreas en BASE_CREADOR se ajustan solas (+1) cuando
//    existe el campo de fecha: no hay que tocar AREAS_FILAS.
//  - NINGUNA fórmula existente fue modificada.
//
//  (historial anterior)
//  MACRO_COMERCIAL — v5
//  Actualizado para PLANTILLA_LOOKER_BORRADOR
//  Nuevo campo: KG_TOTAL_PROYECTO (ingresado en BASE_CREADOR,
//  propagado a todas las hojas de área como KG_TOTAL y PESO_KG_SUB)
//
//  CAMBIOS v3:
//  - AREAS_GENERALES: Administración genera un único bloque
//    en el Cronograma sin importar cuántas subestructuras se
//    hayan configurado. En el dashboard aparece como un bloque.
//
//  CAMBIOS v4:
//  - Gestión Humana eliminada como área independiente.
//    Su función queda representada por una tarea dentro de
//    Montaje: 'Contratación e ingreso de personal' (20%),
//    responsable: 'Gestión Humana'.
//  - Pesos Montaje redistribuidos: 0+0+26.67+26.67+26.66+20 = 100%
//  - Gestión Humana removida de BASE_CREADOR (AREAS_FILAS),
//    IDS_AREAS, TAREAS_AREA, TIPO_AREA, ORDEN_AREAS y AREAS_GENERALES.
//
//  CAMBIOS v5:
//  - 'Ingreso de Personal*' eliminado de Montaje.
//  - Tareas Montaje finales (5): Contratación e ingreso de personal,
//    Ingreso de Equipos, Armado en campo, Izaje de conjuntos, Pernado.
//  - Pesos: 20+0+26.67+26.67+26.66 = 100% ✓
//
//  CAMBIOS v7:
//  - NINGUNA fórmula fue modificada respecto a la versión anterior.
//  - Único cambio: se agrega formato numérico a la columna S
//    (KG_AVANCE_ACUMULADO) para que quede lista para digitar el
//    kg avance manualmente por tarea, tal como está diseñado
//    (T = S/L, Q = peso%*T, R = SUM(Q)). No se usa fórmula en S
//    a propósito, para no generar referencia circular S→R→Q→T→S.
// ============================================================

const IDS_AREAS = {
  'Dibujo':            '1yxBiuE8Wu_tkZRTCLWRS7jaqM2tpXcLrESO5XW0AlxE',  // BORRADOR PRUEBAS
  'Diseño':            '1TZVeRXofIyUEJCxfm3gcgvQfeMInt9VOIYj78rssaUg',  // BORRADOR PRUEBAS
  'Compras':           '1kLqy0vkEt8q-3nfg1gGuLnSXHffY5E2tMf38ncAZ3hU',  // BORRADOR PRUEBAS
  'Galvanizado':       '1Pem1XZmjV7tBFf1T-sKTV0EynxZSUSRPly2F52ZXrzQ',  // BORRADOR PRUEBAS
  'Logistica':         '1u4G64iP2NC79BvMoDmGbXuy4RV5TlW00gQ4_HAvodhE',  // BORRADOR PRUEBAS
  'Montaje':           '1FSS3Y7O1jrhAXJ9LNI6oaIdmU3WgQD9xepYNtteigwY',  // BORRADOR PRUEBAS
  'Pintura':           '1AmUQuvq62wOLSNDa0dgWOFx-6ELU5kZuiI6WiMYmL34',  // BORRADOR PRUEBAS
  // v10: Producción ahora es PLANTILLA_LOOKER_PRODUCCION_V2 (Cronograma + registro diario).
  //      Pega aquí el ID de la V2 (lo que va entre /d/ y /edit en su enlace).
  //      Mientras diga PON_AQUI, el envío a Producción se salta y lo avisa.
  'Produccion':        '1hjd1v3L7rfJhK3Nu5LsRXoN5WTNnoigepwZis0Gh0Mc',  // PLANTILLA_LOOKER_PRODUCCION_V2
  // (antes: '1fPNU8AEwnI591RXr6zfuhDwQ8Ry7u1zqMVkoet6ySyA'  — PLANTILLA_LOOKER_PRODUCCION)
  'Administración':    '1-JPB1aMFRSoin5Y4DMwDTinVRMWnOMhMK4fwR9uj9_4'
  // v4: Gestión Humana eliminada como área — ver tarea en Montaje

  // ── Cuando vayas a producción, reemplaza los IDs de arriba por los reales:
  // 'Dibujo':     '1z60DKmyv55X-HkK1pqF_iPRP1um3NzrKnK6Hn8BkQRM',
  // 'Diseño':     '1jRG-YSufFHQnL1HFyql77dcBKwmVH31dZcLP6vQqUes',
  // 'Compras':    '1MAiA80vSsVCGkUuBHONXWX_EvsThZeZ9x6koYVNJJbI',
  // 'Galvanizado':'1yk17gbuq61GJRO7Hpyo0yLZvMQpPsKclPXfZFQMjRq8',
  // 'Logistica':  '1H0vDC2HDcAvTs2MJrMb5QyVfmT60hGffg7Vb18mYYkw',
  // 'Montaje':    '1yq1S3Iza5gcw5WNWjk4OuSEyeEOdvv65soZg-BOQ3Vk',
  // 'Pintura':    '1Ns34bXdnHlqxjlgVkFdQPmqrf3SrtQg499_YqnFK5PY',
  // 'Produccion': '15Ei3If0mZE02j6YUxPSg-uaQBjtBFZoL4h3Y1PV-Z1E',
};

// ── TAREAS POR ÁREA — PLANTILLA_LOOKER_BORRADOR (FINAL) ──────
// Actualizado desde hoja 'Assignees and Status' del borrador
// Formato: [nombre_tarea, responsable, peso_terminado, peso_pausa, peso_reproceso]
const TAREAS_AREA = {
  'Diseño': [
    // Responsables y pesos según Assignees and Status
    ['Diseño de estructura',  'Andres Abril',        0.40,   0.20,   0.35],
    ['Cantidades',            'Edwar Rodriguez',     0.05,   0.025,  0.0 ],
    ['Revisión de planos',    'Sebastian Martinez',  0.05,   0.025,  0.0 ],
    ['Elaboración de planos', 'Pendiente',           0.40,   0.20,   0.35],
    ['Corrección de planos',  'Externo',             0.04,   0.02,   0.0 ],
    ['Memoria de cálculo',    'No Aplica',           0.04,   0.02,   0.0 ],
    ['Entrega final',         'Juan Urdaneta',       0.02,   0.02,   0.0 ]
  ],
  'Dibujo': [
    // Responsables según Assignees and Status
    ['Modelado',              'Hector Lopez',        0.50,   0.20,   0.35],
    ['Planos de Montaje',     'Johan Santana',       0.20,   0.025,  0.0 ],
    ['Aprobación',            'Javier Gamboa',       0.10,   0.025,  0.0 ],
    ['Planos de Taller',      'Bladir Corredor',     0.10,   0.025,  0.0 ],
    ['Listados',              'Alejandra Rodriguez', 0.04,   0.02,   0.0 ],
    ['Revision',              'Fabian Velandia',     0.03,   0.02,   0.0 ],
    ['Requisicion',           'Camilo Chitiva',      0.02,   0.02,   0.0 ],
    ['Emision',               'Pendiente',           0.01,   0.01,   0.0 ]
  ],
  'Compras': [
    // Responsables según Assignees and Status — pesos iguales 100/7
    ['Recepción Reqs',         'Monica Torres', 0.1429, 0.0714, 0.0],
    ['Cotizaciones',           'Jhon Murillo',  0.1429, 0.0714, 0.0],
    ['Rev. Cotizaciones',      'Daniela',       0.1429, 0.0714, 0.0],
    ['Generación O.C',         'Erika',         0.1429, 0.0714, 0.0],
    ['Trámite Anticipos',      'Lizeth',        0.1429, 0.0714, 0.0],
    ['Entrada (Rev. Facturas)','Monica Torres', 0.1428, 0.0714, 0.0],
    ['Radicación Facturas',    'Jhon Murillo',  0.1427, 0.0714, 0.0]
  ],
  'Produccion': [
    ['Corte',            'Producción 1', 0.25, 0.10, 0.0],
    ['Armado',           'Producción 2', 0.25, 0.10, 0.0],
    ['Soldadura',        'Producción 3', 0.25, 0.10, 0.0],
    ['Calidad',          'Producción 4', 0.15, 0.07, 0.0],
    ['Entrega en negro', 'Producción 5', 0.10, 0.05, 0.0]
  ],
  'Galvanizado': [
    ['Recepción Material', 'Sup. Galvanizado', 0.50, 0.20, 0.0],
    ['Galvanizado',        'Sup. Galvanizado', 0.50, 0.20, 0.0]
  ],
  'Pintura': [
    // Pesos iguales: 100/3 ≈ 33.33% cada tarea
    ['Recepción Material',     'Sup. Pintura', 0.3334, 0.1667, 0.0],
    ['Preparación Superficie', 'Sup. Pintura', 0.3333, 0.1667, 0.0],
    ['Pintura',                'Sup. Pintura', 0.3333, 0.1666, 0.0]
  ],
  'Logistica': [
    // Pesos iguales: 100/3 ≈ 33.33% cada tarea
    ['Recepción de material', 'Sup. Logistica', 0.3334, 0.1667, 0.0],
    ['Embalaje',              'Sup. Logistica', 0.3333, 0.1667, 0.0],
    ['Cargue',                'Sup. Logistica', 0.3333, 0.1666, 0.0]
  ],
  'Montaje': [
    // v5: 5 tareas — pesos: 20+0+26.67+26.67+26.66 = 100%
    // 'Ingreso de Personal*' eliminado. 'Ingreso de Equipos' mantiene 0% (solo logística).
    ['Contratación e ingreso de personal', 'Gestión Humana', 0.20,   0.10,   0.0],
    ['Ingreso de Equipos',                 'Sup. Montaje',  0.0,    0.0,    0.0],
    ['Armado en campo',                    'Sup. Montaje',  0.2667, 0.1334, 0.0],
    ['Izaje de conjuntos',                 'Sup. Montaje',  0.2667, 0.1334, 0.0],
    ['Pernado',                            'Sup. Montaje',  0.2666, 0.1332, 0.0]
  ],
  'Administración': [
    ['Recepción de documentos',   'Responsable Administración', 0.15, 0.07, 0.0],
    ['Validación contractual',    'Responsable Administración', 0.20, 0.10, 0.18],
    ['Gestión de anticipo',       'Responsable Administración', 0.25, 0.12, 0.22],
    ['Facturación',               'Responsable Administración', 0.25, 0.12, 0.22],
    ['Cierre administrativo',     'Responsable Administración', 0.15, 0.07, 0.0 ]
  ],
  // v4: Gestión Humana removida — su tarea ahora está en Montaje
};

// ── TIPO de área: A=Diseño/Dibujo (IF hardcoded), B=otras (referencia A&S) ──
const TIPO_AREA = {
  'Diseño': 'A', 'Dibujo': 'A',
  'Compras': 'B', 'Galvanizado': 'B', 'Logistica': 'B',
  'Montaje': 'B', 'Pintura': 'B', 'Produccion': 'B',
  'Administración': 'B'
  // v4: 'Gestión Humana' eliminada de TIPO_AREA
};

// ── Filas en 'Assignees and Status' por área y tarea (solo tipo B) ──────────
const AS_FILAS = {
  'Compras': {
    'Recepción Reqs': 33, 'Cotizaciones': 34, 'Rev. Cotizaciones': 35,
    'Generación O.C': 36, 'Trámite Anticipos': 37,
    'Entrada (Rev. Facturas)': 38, 'Radicación Facturas': 39
  },
  'Produccion': {
    'Corte': 45, 'Armado': 46, 'Soldadura': 47, 'Calidad': 48, 'Entrega en negro': 49
  },
  'Galvanizado': { 'Recepción Material': 54, 'Galvanizado': 55 },
  'Pintura': { 'Recepción Material': 61, 'Preparación Superficie': 62, 'Pintura': 63 },
  'Logistica': { 'Recepción de material': 69, 'Embalaje': 70, 'Cargue': 71 },
  'Montaje': {
    // v5: 'Contratación e ingreso de personal' → fallback IF (peso hardcoded, sin fila en A&S)
    // 'Ingreso de Personal*' eliminado
    'Ingreso de Equipos': 78,
    'Armado en campo': 79, 'Izaje de conjuntos': 80, 'Pernado': 81
  }
};

// ── v3: Áreas que trabajan de forma GENERAL (no por subestructura) ───────────
// Administración y Gestión Humana siempre generan UN SOLO bloque en el
// Cronograma, sin importar cuántas subestructuras se hayan configurado en
// BASE_CREADOR. En el dashboard también aparecen como un único bloque.
// v4: solo Administración es área general — Gestión Humana ya no existe como área
const AREAS_GENERALES = ['Administración'];

// v13: secuencia lógica del proceso acordada en la reunión. Para cambiarla,
//      basta con reordenar esta lista (y usar el menú "🔀 Ordenar lista de áreas").
const ORDEN_AREAS = [
  'Diseño','Dibujo','Compras','Produccion',
  'Galvanizado','Pintura','Logistica','Montaje','Administración'
];

// v8: Fecha de entrega al cliente
var FILA_FECHA_ENTREGA = 9;        // BASE_CREADOR!C9 (debajo de Agregar subestructuras)
var COL_META_FECHA     = 37;       // hoja OP: col AK = META_FECHA_ENTREGA
var ETQ_FECHA_CRONO    = 'FECHA_ENTREGA_CLIENTE';

// AREAS_FILAS = filas ORIGINALES (sin el campo de fecha). Si el campo
// de fecha existe, _filaArea() les suma 1 automáticamente.
const AREAS_FILAS = {
  // Fila 9=KG_Total, Fila 10=Header Áreas, Fila 11+=checkboxes
  'Dibujo':          10,
  'Diseño':          11,
  'Compras':         12,
  'Galvanizado':     13,
  'Logistica':       14,
  'Montaje':         15,
  'Pintura':         16,
  'Produccion':      17,
  // v4: 'Gestión Humana' eliminada de BASE_CREADOR
  'Administración':  18
};

// ============================================================
//  MENÚ
// ============================================================
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🚀 Torre de Control')
    .addItem('➕ Crear Nueva OP  /  💾 Guardar cambios', 'crearNuevaOP')
    .addItem('✏️ Cargar OP para editar',              'cargarOPParaEditar')
    .addItem('✖️ Cancelar edición',                    'cancelarEdicion')
    .addSeparator()
    .addItem('📤 Enviar / Actualizar OP en Áreas',     'enviarOPActivaAAreas')
    .addSeparator()
    .addItem('🔄 Extraer Datos al Gantt',              'actualizarGanttEnComercial')
    .addItem('📋 Ver registro de cambios',             'verRegistroCambios')
    .addSeparator()
    .addItem('📅 Agregar campo Fecha de entrega (una sola vez)', 'agregarCampoFechaEntrega')
    .addItem('🔐 Autorizar / probar acceso a las áreas', 'autorizarAreas')
    .addItem('✉️ Probar correo de nueva O.P', 'probarCorreoNuevaOP')
    .addItem('📨 Reenviar correo de una O.P ya creada', 'reenviarCorreoOP')
    .addItem('🔀 Ordenar lista de áreas (BASE_CREADOR)', 'ordenarListaAreas')
    .addSeparator()
    .addItem('🧩 Tareas de la OP (No aplica / nombre)', 'abrirTareasOP')
    .addItem('🚚 Registrar entrega real al cliente', 'registrarEntregaReal')
    .addItem('📅 Preparar registro de entregas (una sola vez)', 'prepararRegistroEntregas')
    .addToUi();
  // v14.2: buscador de hojas de OP
  SpreadsheetApp.getUi()
    .createMenu('🔎 Buscar O.P')
    .addItem('🔎 Buscar O.P…', 'buscarOP')
    .addItem('🏠 Ir a BASE_CREADOR', 'irABaseCreador')
    .addToUi();
}

// ============================================================
//  v9 — CONSTANTES DE EDICIÓN Y REGISTRO
// ============================================================
var COL_META_ENVIADAS   = 38;                 // hoja OP: col AL = áreas a las que ya se envió
var HOJA_REGISTRO       = 'REGISTRO_CAMBIOS';
var CELDA_AVISO_EDICION = 'E6';               // aviso "EDITANDO OP" en BASE_CREADOR
var FILA_INICIO_CRONO   = 6;                  // primera fila de datos en Cronograma de áreas
var PROP_EDICION        = 'OP_EDICION';

// ============================================================
//  LEER FORMULARIO (BASE_CREADOR)
// ============================================================
function _leerFormularioOP(form) {
  var d = {
    op:        form.getRange('C3').getValue().toString().trim(),
    nombreOp:  form.getRange('C4').getValue().toString().trim(),
    cliente:   form.getRange('C5').getValue().toString().trim(),
    comercial: form.getRange('C6').getValue().toString().trim(),
    sede:      form.getRange('C7').getValue().toString().trim(),
    numSubs:   parseInt(form.getRange('C8').getValue()) || 1,
    tieneFecha: _tieneCampoFecha(form),
    areas: []
  };
  d.fechaEntrega = d.tieneFecha ? form.getRange(FILA_FECHA_ENTREGA, 3).getValue() : '';

  var areaNames = Object.keys(AREAS_FILAS);
  for (var a = 0; a < areaNames.length; a++) {
    if (form.getRange(_filaArea(form, areaNames[a]), 3).getValue() === true) d.areas.push(areaNames[a]);
  }
  _ordenarAreas(d.areas);

  var f = [];
  if (!d.op)                        f.push('C3 – Número de OP');
  if (!d.nombreOp)                  f.push('C4 – Nombre del Proyecto');
  if (!d.cliente)                   f.push('C5 – Cliente');
  if (!d.comercial)                 f.push('C6 – Comercial');
  if (!d.sede)                      f.push('C7 – Sede / Ciudad');
  if (!d.tieneFecha)                f.push('Falta el campo Fecha de entrega: usa el menú Torre de Control > 📅 Agregar campo Fecha de entrega');
  else if (!_esFecha(d.fechaEntrega)) f.push('C9 – Fecha de entrega al cliente');
  if (d.areas.length === 0)         f.push('Marca al menos un área');
  d.faltantes = f;
  return d;
}

function _ordenarAreas(arr) {
  arr.sort(function(a, b) {
    var ia = ORDEN_AREAS.indexOf(a), ib = ORDEN_AREAS.indexOf(b);
    if (ia === -1) ia = 99; if (ib === -1) ib = 99;
    return ia - ib;
  });
  return arr;
}

// ============================================================
//  CREAR NUEVA OP  (en modo edición, el mismo botón guarda cambios)
// ============================================================
function crearNuevaOP() {
  var ss   = SpreadsheetApp.getActiveSpreadsheet();
  var form = ss.getSheetByName('BASE_CREADOR');
  var ui   = SpreadsheetApp.getUi();
  if (!form) { ui.alert('❌ No se encontró la hoja "BASE_CREADOR".'); return; }

  // v9: si hay una OP cargada para editar, el botón guarda los cambios
  var opEdicion = _opEnEdicion();
  if (opEdicion) { guardarCambiosOP(); return; }

  var d = _leerFormularioOP(form);

  // v9: ya no se reemplaza la hoja (se perdían fechas y KG). Se ofrece editarla.
  // (se revisa ANTES de validar: basta escribir el # de OP y pulsar el botón)
  if (d.op && ss.getSheetByName(d.op)) {
    var resp = ui.alert('⚠️ La OP ya existe',
      'Ya existe la hoja "' + d.op + '".\n\n¿Quieres cargarla en el formulario para EDITARLA?\n' +
      '(Se conservan las fechas, KG y observaciones que ya tiene)',
      ui.ButtonSet.YES_NO);
    if (resp === ui.Button.YES) cargarOPParaEditar(d.op);
    return;
  }

  if (d.faltantes.length > 0) {
    ui.alert('❌ Faltan datos:\n\n• ' + d.faltantes.join('\n• '));
    return;
  }

  var numAreas = d.areas.length;
  var confirm = ui.alert(
    '¿Crear OP?',
    'OP: ' + d.op + ' – "' + d.nombreOp + '"' +
    '\nCliente: ' + d.cliente + '\nSede: ' + d.sede +
    '\nÁreas (' + numAreas + '): ' + d.areas.join(', ') +
    '\nSubestructuras por área: ' + d.numSubs +
    '\nFecha de entrega al cliente: ' + _fmtFecha(d.fechaEntrega) +
    '\n\n⚠️ Solo se creará la hoja interna.' +
    '\nDespués llena los datos manuales y usa' +
    '\n"📤 Enviar / Actualizar OP en Áreas" para distribuir.' +
    '\n\n¿Continuar?',
    ui.ButtonSet.YES_NO
  );
  if (confirm !== ui.Button.YES) return;

  _crearHojaOP(ss, d.op, d.nombreOp, d.cliente, d.comercial, d.sede, d.numSubs, 0, d.areas, numAreas, d.fechaEntrega);
  _limpiarFormulario(form);

  var reg = _nuevoRegistro(d.op);
  reg.add('Formulario BASE_CREADOR', '', '', '', 'OP', '', 'creada (' + numAreas + ' áreas, ' + d.numSubs + ' subestructuras)');
  reg.guardar(ss);
  // v14: línea base de la entrega (fecha comprometida original = la de la creación)
  try { _upsertEntrega(ss, d.op, { nombre: d.nombreOp, cliente: d.cliente, comercial: d.comercial, original: d.fechaEntrega, vigente: d.fechaEntrega, reprog: 0 }); } catch (e) {}

  // v11: correo de aviso de nueva O.P (si falla, la O.P igual queda creada)
  var wsNueva = ss.getSheetByName(d.op);
  var aviso = _notificarNuevaOP(d, wsNueva ? ss.getUrl() + '#gid=' + wsNueva.getSheetId() : ss.getUrl());

  ui.alert(
    '✅ OP ' + d.op + ' creada.\n\n' +
    'Áreas: ' + d.areas.join(', ') + '\n\n' +
    '1. Ve a la hoja "' + d.op + '"\n' +
    '2. Completa fechas, duraciones, nombres de subestructura y KG por subestructura (col F)\n' +
    '3. Usa  📤 Enviar / Actualizar OP en Áreas  para enviarla' +
    (aviso ? '\n\n' + aviso : '')
  );
}

// ============================================================
//  v9 — EDITAR OP
// ============================================================
/** Carga una OP existente en BASE_CREADOR para editarla. */
function cargarOPParaEditar(opParam) {
  var ss   = SpreadsheetApp.getActiveSpreadsheet();
  var form = ss.getSheetByName('BASE_CREADOR');
  var ui   = SpreadsheetApp.getUi();
  if (!form) { ui.alert('❌ No se encontró la hoja "BASE_CREADOR".'); return; }

  var op = (typeof opParam === 'string') ? opParam : form.getRange('C3').getValue().toString().trim();
  if (!op || !_esHojaOP(ss.getSheetByName(op))) {
    var lista = _listarOPs(ss);
    if (!lista.length) { ui.alert('No hay OPs creadas todavía.'); return; }
    var pr = ui.prompt('✏️ Cargar OP para editar',
      'Escribe el número de la OP que quieres editar.\n\nOPs disponibles:\n' + lista.join(', '),
      ui.ButtonSet.OK_CANCEL);
    if (pr.getSelectedButton() !== ui.Button.OK) return;
    op = pr.getResponseText().trim();
  }
  var ws = ss.getSheetByName(op);
  if (!_esHojaOP(ws)) { ui.alert('❌ No encontré la OP "' + op + '" (o es de una versión anterior sin datos guardados).'); return; }

  var m = _leerMetaOP(ws);
  _limpiarFormulario(form);
  form.getRange('C3').setValue(m.op);
  form.getRange('C4').setValue(m.nombreOp);
  form.getRange('C5').setValue(m.cliente);
  form.getRange('C6').setValue(m.comercial);
  form.getRange('C7').setValue(m.sede);
  form.getRange('C8').setValue(m.numSubs);
  if (_tieneCampoFecha(form) && _esFecha(m.fecha)) form.getRange(FILA_FECHA_ENTREGA, 3).setValue(m.fecha);
  for (var i = 0; i < m.areas.length; i++) {
    if (AREAS_FILAS[m.areas[i]]) form.getRange(_filaArea(form, m.areas[i]), 3).setValue(true);
  }

  PropertiesService.getUserProperties().setProperty(PROP_EDICION, m.op);
  _avisoEdicion(form, m.op);
  ss.setActiveSheet(form);

  ui.alert('✏️ OP ' + m.op + ' cargada para editar',
    'Corrige lo que necesites y pulsa el botón "Crear Nueva OP" (en modo edición guarda los cambios).\n\n' +
    '• No cambies el número de OP.\n' +
    '• Puedes cambiar nombre, cliente, comercial, sede, subestructuras, fecha de entrega y áreas.\n' +
    '• Para salir sin guardar: Torre de Control > ✖️ Cancelar edición.',
    ui.ButtonSet.OK);
}

/** Guarda los cambios de la OP cargada (hoja interna) y ofrece actualizar las áreas. */
function guardarCambiosOP() {
  var ss   = SpreadsheetApp.getActiveSpreadsheet();
  var form = ss.getSheetByName('BASE_CREADOR');
  var ui   = SpreadsheetApp.getUi();
  var opEd = _opEnEdicion();
  if (!opEd) { ui.alert('Primero carga una OP con  Torre de Control > ✏️ Cargar OP para editar.'); return; }

  var d = _leerFormularioOP(form);
  if (d.faltantes.length) { ui.alert('❌ Faltan datos:\n\n• ' + d.faltantes.join('\n• ')); return; }
  if (d.op !== opEd) {
    ui.alert('❌ Estabas editando la OP ' + opEd + ' y el número cambió a "' + d.op + '".\n\n' +
      'El número de OP no se puede cambiar. Vuelve a poner ' + opEd + ', o cancela la edición y crea la OP nueva.');
    return;
  }
  var ws = ss.getSheetByName(opEd);
  if (!_esHojaOP(ws)) { ui.alert('❌ La hoja de la OP ' + opEd + ' ya no existe.'); _salirEdicion(form); return; }

  var m = _leerMetaOP(ws);
  var cambios = [];
  var cmp = function(campo, antes, despues) { if (!_mismoValor(antes, despues)) cambios.push([campo, antes, despues]); };
  cmp('Nombre del Proyecto', m.nombreOp, d.nombreOp);
  cmp('Cliente', m.cliente, d.cliente);
  cmp('Comercial', m.comercial, d.comercial);
  cmp('Sede', m.sede, d.sede);
  cmp('Subestructuras', m.numSubs, d.numSubs);
  cmp('Fecha de entrega al cliente', m.fecha, d.fechaEntrega);
  var agregadas = d.areas.filter(function(a) { return m.areas.indexOf(a) === -1; });
  var quitadas  = m.areas.filter(function(a) { return d.areas.indexOf(a) === -1; });
  if (agregadas.length) cambios.push(['Áreas agregadas', '', agregadas.join(', ')]);
  if (quitadas.length)  cambios.push(['Áreas quitadas', quitadas.join(', '), '']);

  if (!cambios.length) {
    var r0 = ui.alert('Sin cambios', 'No hay cambios en el formulario.\n¿Salir del modo edición?', ui.ButtonSet.YES_NO);
    if (r0 === ui.Button.YES) { _limpiarFormulario(form); _salirEdicion(form); }
    return;
  }

  var estructural = (m.numSubs !== d.numSubs) || agregadas.length || quitadas.length;
  var txt = 'Cambios en la OP ' + d.op + ':\n\n' + cambios.map(function(c) {
    return '• ' + c[0] + ': ' + (_fmtLog(c[1]) || '—') + '  →  ' + (_fmtLog(c[2]) || '—');
  }).join('\n');
  if (quitadas.length)
    txt += '\n\n⚠️ En la hoja interna se borrarán las filas de: ' + quitadas.join(', ') + ' (fechas y KG de esas áreas).';
  if (d.numSubs < m.numSubs)
    txt += '\n\n⚠️ Bajan las subestructuras de ' + m.numSubs + ' a ' + d.numSubs +
           ': en la hoja interna se borran las subestructuras ' + (d.numSubs + 1) + ' a ' + m.numSubs + ' de cada área.';
  if (estructural) txt += '\n\nLas fechas, KG, nombres de subestructura y observaciones que ya tiene la hoja se conservan.';
  txt += '\n\n¿Guardar cambios?';
  if (ui.alert('💾 Guardar cambios', txt, ui.ButtonSet.YES_NO) !== ui.Button.YES) return;

  // v14: reprogramación de la entrega → motivo obligatorio; con entrega real registrada no se reprograma
  var cambioFecha = !_mismoValor(m.fecha, d.fechaEntrega), motivoReprog = null;
  if (cambioFecha && _esFecha(m.fecha)) {
    var fe = _filaEntrega(_hojaEntregas(ss), d.op);
    if (fe && _esFecha(fe.v[7])) {
      ui.alert('🔒 Entrega ya realizada', 'La OP ' + d.op + ' ya tiene entrega real registrada (' + _fmtFecha(fe.v[7]) + ').\nLa fecha comprometida ya no se puede reprogramar. No se guardó nada.', ui.ButtonSet.OK);
      return;
    }
    motivoReprog = _pedirMotivoReprog(ui, d.op, m.fecha, d.fechaEntrega);
    if (!motivoReprog) { ui.alert('No se guardó nada: la reprogramación necesita un motivo.'); return; }
  }

  if (estructural) ws = _reconstruirHojaOP(ss, ws, d, m);
  else             _actualizarMetaOP(ws, d);

  var reg = _nuevoRegistro(d.op);
  cambios.forEach(function(c) { reg.add('Formulario BASE_CREADOR', '', '', '', c[0], c[1], c[2]); });
  if (motivoReprog) reg.add('Formulario BASE_CREADOR', '', '', '', 'Motivo reprogramación', '', motivoReprog.motivo + (motivoReprog.comentario ? ' — ' + motivoReprog.comentario : ''));
  reg.guardar(ss);
  // v14: registro de entregas
  try {
    var feAct = _filaEntrega(_hojaEntregas(ss), d.op);
    var nRep = (feAct ? (parseInt(feAct.v[6], 10) || 0) : 0) + (motivoReprog ? 1 : 0);
    _upsertEntrega(ss, d.op, { nombre: d.nombreOp, cliente: d.cliente, comercial: d.comercial,
      original: _esFecha(m.fecha) ? m.fecha : d.fechaEntrega, vigente: d.fechaEntrega, reprog: nRep });
    if (motivoReprog) _registrarReprog(ss, d.op, m.fecha, d.fechaEntrega, motivoReprog);
  } catch (e) {}

  _limpiarFormulario(form);
  _salirEdicion(form);

  var r = ui.alert('✅ Cambios guardados en la hoja ' + d.op,
    '¿Quieres actualizar ahora la OP en los cronogramas de las áreas?\n\n' +
    '(Se conserva lo que cada área ya llenó: estado, KG avance, fechas reales y observaciones)',
    ui.ButtonSet.YES_NO);
  if (r === ui.Button.YES) _sincronizarOPConAreas(ss, ws);
  else ui.alert('Recuerda: cuando quieras que las áreas vean los cambios, ve a la hoja ' + d.op +
                ' y usa  📤 Enviar / Actualizar OP en Áreas.');
}

function cancelarEdicion() {
  var form = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('BASE_CREADOR');
  if (form) { _limpiarFormulario(form); _salirEdicion(form); }
  SpreadsheetApp.getActiveSpreadsheet().toast('Edición cancelada, no se guardó nada.', '✖️ Torre de Control', 4);
}

function _opEnEdicion() { return PropertiesService.getUserProperties().getProperty(PROP_EDICION) || ''; }

function _salirEdicion(form) {
  PropertiesService.getUserProperties().deleteProperty(PROP_EDICION);
  _avisoEdicion(form, null);
}

function _avisoEdicion(form, op) {
  var c = form.getRange(CELDA_AVISO_EDICION);
  if (op) {
    c.setValue('✏️ EDITANDO OP ' + op + '\nEl botón guarda los cambios')
     .setBackground('#fce8b2').setFontColor('#b45f06').setFontWeight('bold')
     .setWrap(true).setHorizontalAlignment('center').setVerticalAlignment('middle');
  } else {
    c.clearContent().setBackground(null).setFontColor(null).setFontWeight('normal');
  }
}

// ============================================================
//  v9 — HOJA OP: METADATOS, RECONSTRUCCIÓN CONSERVANDO DATOS
// ============================================================
function _esHojaOP(ws) {
  if (!ws || ws.getMaxColumns() < 36) return false;
  return String(ws.getRange(1, 36).getValue()).trim() !== '';
}

function _listarOPs(ss) {
  return ss.getSheets().filter(_esHojaOP).map(function(h) { return h.getName(); });
}

function _asegurarColumnas(ws, n) {
  if (ws.getMaxColumns() < n) ws.insertColumnsAfter(ws.getMaxColumns(), n - ws.getMaxColumns());
}

function _leerMetaOP(ws) {
  _asegurarColumnas(ws, COL_META_ENVIADAS);
  var v = ws.getRange(1, 28, 1, 11).getValues()[0];   // AB..AL
  var lista = function(x) {
    return String(x || '').split(',').map(function(a) { return a.trim(); }).filter(String);
  };
  return {
    op:        String(v[0] || ws.getName()).trim(),
    nombreOp:  String(v[1]).trim(),
    cliente:   String(v[2]).trim(),
    comercial: String(v[3]).trim(),
    sede:      String(v[4]).trim(),
    numSubs:   parseInt(v[5]) || 1,
    numAreas:  parseInt(v[7]) || 1,
    areas:     lista(v[8]),
    fecha:     v[9],
    enviadas:  lista(v[10])
  };
}

/** Solo cambian datos generales (sin tocar estructura): META + sede en col G. */
function _actualizarMetaOP(ws, d) {
  ws.getRange(1, 29, 1, 5).setValues([[d.nombreOp, d.cliente, d.comercial, d.sede, d.numSubs]]);
  ws.getRange(1, COL_META_FECHA).setValue(d.fechaEntrega).setNumberFormat('dd/mm/yyyy');
  var last = ws.getLastRow();
  if (last < 2) return;
  var colD = ws.getRange(2, 4, last - 1, 1).getValues();
  for (var i = 0; i < colD.length; i++) {
    if (String(colD[i][0]).trim()) ws.getRange(i + 2, 7).setValue(d.sede);
  }
}

/** Recorre la hoja OP: cb(fila, area, sub, tarea, esInicioSub, valoresFila) */
function _recorrerHojaOP(ws, cb) {
  var last = ws.getLastRow();
  if (last < 2) return;
  var v = ws.getRange(2, 1, last - 1, 27).getValues();
  var area = '', s = -1;
  for (var i = 0; i < v.length; i++) {
    if (String(v[i][0]).trim()) { area = _areaDesdeEtiqueta(v[i][0]); s = -1; }
    var inicioSub = String(v[i][3]).trim() !== '';
    if (inicioSub) s++;
    var tarea = String(v[i][7]).trim();
    if (!area || !tarea || s < 0) continue;
    cb(i + 2, area, s, tarea, inicioSub, v[i]);
  }
}

function _areaDesdeEtiqueta(et) {
  var u = _norm(et), nombres = Object.keys(TAREAS_AREA);
  for (var i = 0; i < nombres.length; i++) if (_norm(nombres[i]) === u) return nombres[i];
  return String(et).trim();
}

/** Guarda lo que el comercial llenó a mano en la hoja OP. */
function _leerManualesOP(ws) {
  var filas = {}, subs = {};
  var metaT = _leerMetaTareas(ws), cont = {};   // v14: tareas renombradas en esta OP → nombre original
  _recorrerHojaOP(ws, function(fila, area, s, tarea, inicioSub, v) {
    var g = area + '|' + s; cont[g] = inicioSub ? 0 : (cont[g] || 0) + 1;
    tarea = _nombreOriginalOP(metaT, area, s, cont[g], tarea);
    filas[area + '|' + s + '|' + tarea] = { I: v[8], J: v[9], Q: v[16], R: v[17], Z: v[25] };
    if (inicioSub) subs[area + '|' + s] = { E: v[4], F: v[5] };
  });
  return { filas: filas, subs: subs };
}

function _restaurarManualesOP(ws, datos) {
  var last = ws.getLastRow();
  if (last < 2) return;
  var n = last - 1;
  var IJ = ws.getRange(2, 9, n, 2).getValues();
  var QR = ws.getRange(2, 17, n, 2).getValues();
  var Z  = ws.getRange(2, 26, n, 1).getValues();
  _recorrerHojaOP(ws, function(fila, area, s, tarea, inicioSub) {
    var i = fila - 2, g = datos.filas[area + '|' + s + '|' + tarea];
    if (g) { IJ[i] = [g.I, g.J]; QR[i] = [g.Q, g.R]; Z[i] = [g.Z]; }
    if (inicioSub) {
      var sg = datos.subs[area + '|' + s];
      if (sg) ws.getRange(fila, 5, 1, 2).setValues([[sg.E, sg.F]]);
    }
  });
  ws.getRange(2, 9, n, 2).setValues(IJ);
  ws.getRange(2, 17, n, 2).setValues(QR);
  ws.getRange(2, 26, n, 1).setValues(Z);
}

/**
 * Cambió la estructura (áreas o subestructuras): se crea la hoja de nuevo
 * con _crearHojaOP y se le devuelven los datos manuales. Si algo falla, la
 * hoja original vuelve a quedar como estaba.
 */
function _reconstruirHojaOP(ss, viejo, d, m) {
  var metaT = _leerMetaTareas(viejo);   // v14
  var datos = _leerManualesOP(viejo);
  var idx   = viejo.getIndex();
  viejo.setName(d.op + '_respaldo_' + new Date().getTime());
  var nuevo = null;
  try {
    nuevo = _crearHojaOP(ss, d.op, d.nombreOp, d.cliente, d.comercial, d.sede, d.numSubs, 0,
                         d.areas, d.areas.length, d.fechaEntrega);
    _restaurarManualesOP(nuevo, datos);
    nuevo.getRange(1, COL_META_ENVIADAS).setValue(m.enviadas.join(','));
    // v14: se conservan las tareas No aplica / nombres (solo de áreas y subestructuras que siguen)
    if (metaT.na.length || Object.keys(metaT.nom).length) {
      var vale = function(k) { var p = k.split('|'); return d.areas.indexOf(p[0]) !== -1 && (AREAS_GENERALES.indexOf(p[0]) !== -1 || Number(p[1]) < d.numSubs); };
      var nomOk = {}; Object.keys(metaT.nom).forEach(function(k) { if (vale(k)) nomOk[k] = metaT.nom[k]; });
      _guardarMetaTareas(nuevo, { na: metaT.na.filter(vale), nom: nomOk, ant: metaT.ant || {} });
      _formatoTareasOP(nuevo);
    }
    ss.setActiveSheet(nuevo);
    ss.moveActiveSheet(idx);
    ss.deleteSheet(viejo);
  } catch (e) {
    if (nuevo) { try { ss.deleteSheet(nuevo); } catch (_) {} }
    viejo.setName(d.op);
    throw new Error('No se pudo guardar la OP (la hoja quedó como estaba): ' + e.message);
  }
  return nuevo;
}

// ============================================================
//  ENVIAR / ACTUALIZAR OP ACTIVA EN ÁREAS
// ============================================================
function enviarOPActivaAAreas() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ws = ss.getActiveSheet();
  var nombre = ws.getName();
  if (nombre === 'BASE_CREADOR' || nombre === 'Cronograma Comercial' || nombre === HOJA_REGISTRO) {
    SpreadsheetApp.getUi().alert('❌ Debes estar en la hoja de la OP.\nVe a la pestaña de la OP y vuelve a ejecutar.');
    return;
  }
  if (!_esHojaOP(ws)) {
    SpreadsheetApp.getUi().alert('❌ No se encontraron las áreas guardadas.\nEsta hoja puede ser de una versión anterior.');
    return;
  }
  _sincronizarOPConAreas(ss, ws);
}

function _leerDatosHojaOP(ws) {
  var lastRow = ws.getLastRow(), datos = [];
  if (lastRow < 2) return datos;
  var rango = ws.getRange(2, 1, lastRow - 1, 28).getValues();
  for (var i = 0; i < rango.length; i++) {
    datos.push({
      nombreSub:    rango[i][4],   // col E = Nombre SubEstructura
      kgSub:        rango[i][5],   // col F = KG_SUBESTRUCTURA
      fechaIniPlan: rango[i][8],   // col I = FECHA_INICIO_TAREA_PLANEADO
      durPlan:      rango[i][9],   // col J = DURACION_DIAS_TAREAS_PLANEADO
      fechaIniReal: rango[i][16],  // col Q = FECHA_INICIO_TAREA_REAL
      durReal:      rango[i][17]   // col R = DURACION_DIAS_TAREAS_REAL
    });
  }
  return datos;
}

/**
 * Motor único de envío:
 *  - Área donde la OP NO existe  → se crea completa (como antes).
 *  - Área donde la OP YA existe  → se ACTUALIZA en su sitio, sin tocar lo que
 *    llena el área (ESTADO, KG avance, fechas/duración reales, OBSERVACIONES).
 *    Si cambiaron las subestructuras, se agregan o quitan solo las del final.
 *  - Área que se quitó de la OP  → se pregunta antes de borrarla.
 *  Todo queda en REGISTRO_CAMBIOS.
 */
function _sincronizarOPConAreas(ss, ws) {
  var ui = SpreadsheetApp.getUi();
  var lock = LockService.getDocumentLock();
  if (!lock.tryLock(30000)) { ui.alert('⏳ Otra persona está enviando una OP en este momento. Intenta de nuevo en un minuto.'); return; }
  try {
    if (!_verificarPermisoAreas()) return;     // v9.1
    var m  = _leerMetaOP(ws);
    var op = m.op;
    if (!m.areas.length) { ui.alert('❌ La OP no tiene áreas guardadas.'); return; }

    // Fecha de entrega (OP antiguas no la tienen)
    var fechaEntrega = m.fecha;
    if (!_esFecha(fechaEntrega)) {
      var pr = ui.prompt('📅 Fecha de entrega al cliente',
        'La OP "' + op + '" no tiene fecha de entrega al cliente.\n' +
        'Escríbela en formato dd/mm/aaaa (o deja vacío para enviar sin fecha):',
        ui.ButtonSet.OK_CANCEL);
      if (pr.getSelectedButton() !== ui.Button.OK) return;
      var txt = pr.getResponseText().trim();
      if (txt) {
        fechaEntrega = _parseFecha(txt);
        if (!fechaEntrega) { ui.alert('❌ Fecha no válida: "' + txt + '". Usa dd/mm/aaaa.'); return; }
        ws.getRange(1, COL_META_FECHA).setValue(fechaEntrega).setNumberFormat('dd/mm/yyyy');
      } else {
        fechaEntrega = '';
      }
    }

    // KG_TOTAL = suma de KG_SUBESTRUCTURA (col F)
    var kgTotal = 0;
    if (ws.getLastRow() >= 2) {
      var colF = ws.getRange(2, 6, ws.getLastRow() - 1, 1).getValues();
      for (var ki = 0; ki < colF.length; ki++) {
        var kgVal = parseFloat(colF[ki][0]);
        if (!isNaN(kgVal) && kgVal > 0) kgTotal += kgVal;
      }
    }
    var datosHoja = _leerDatosHojaOP(ws);
    var metaT = _leerMetaTareas(ws);   // v14

    // ---------- 1) PLAN: revisar cada cronograma antes de tocar nada ----------
    ss.toast('Revisando los cronogramas de las áreas...', '🔎 OP ' + op, 6);
    var plan = [], offset = 0;
    m.areas.forEach(function(area) {
      var T     = (TAREAS_AREA[area] || TAREAS_AREA['Diseño']).length;
      var nSubs = AREAS_GENERALES.indexOf(area) !== -1 ? 1 : m.numSubs;
      var it = { area: area, id: IDS_AREAS[area], T: T, newSubs: nSubs, riesgos: [],
                 datos: datosHoja.slice(offset, offset + nSubs * T) };
      offset += nSubs * T;
      if (!it.id || it.id.indexOf('PON_AQUI') !== -1) { it.accion = 'error'; it.error = 'ID no configurado'; plan.push(it); return; }
      try {
        it.tSheet = _abrirCronograma(it.id);
        it.blk    = _bloqueOP(it.tSheet, op);
        if (!it.blk) {
          it.accion = 'crear';
        } else if (it.blk.len % T !== 0) {
          it.accion = 'error';
          it.error  = 'la OP ocupa ' + it.blk.len + ' filas y no cuadra con ' + T + ' tareas por subestructura (revisar a mano)';
        } else {
          it.accion  = 'actualizar';
          it.oldSubs = it.blk.len / T;
          if (nSubs < it.oldSubs)
            it.riesgos = _subsConAvance(it.tSheet, it.blk.start + nSubs * T, (it.oldSubs - nSubs) * T, T, nSubs);
        }
      } catch (e) { it.accion = 'error'; it.error = e.message; }
      plan.push(it);
    });

    var candidatos = (m.enviadas.length ? m.enviadas : Object.keys(IDS_AREAS))
      .filter(function(a) { return m.areas.indexOf(a) === -1; });
    candidatos.forEach(function(area) {
      var id = IDS_AREAS[area];
      if (!id || id.indexOf('PON_AQUI') !== -1) return;
      try {
        var tSheet = _abrirCronograma(id), blk = _bloqueOP(tSheet, op);
        if (!blk) return;
        var T = (TAREAS_AREA[area] || TAREAS_AREA['Diseño']).length;
        plan.push({ area: area, id: id, tSheet: tSheet, blk: blk, T: T, accion: 'eliminar',
                    riesgos: _subsConAvance(tSheet, blk.start, blk.len, T, 0) });
      } catch (_) {}
    });

    // ---------- 2) CONFIRMAR ----------
    var grupo = function(acc) { return plan.filter(function(p) { return p.accion === acc; }); };

    // v11.1: distinguir "el script no está autorizado" de "la cuenta no tiene acceso al archivo del área"
    var sinAcceso = grupo('error').filter(function(p) { return _esErrorAccesoArchivo(p.error); });
    if (sinAcceso.length) {
      ui.alert('🔒 Sin acceso a archivos de áreas', _msgSinAcceso(sinAcceso.map(function(p) { return p.area; })), ui.ButtonSet.OK);
      return;
    }
    if (grupo('error').some(function(p) { return _esErrorPermiso(p.error); })) {
      ui.alert('🔐 Falta autorizar el script', _MSG_PERMISOS, ui.ButtonSet.OK);
      return;
    }
    if (!grupo('crear').length && !grupo('actualizar').length && !grupo('eliminar').length) {
      ui.alert('❌ No se pudo procesar ninguna área',
        grupo('error').map(function(p) { return '• ' + p.area + ': ' + p.error; }).join('\n'), ui.ButtonSet.OK);
      return;
    }
    var lin = ['OP ' + op + ' – "' + m.nombreOp + '"',
               'KG Total: ' + kgTotal.toLocaleString('es-CO') + ' kg  ·  Fecha entrega: ' + _fmtFecha(fechaEntrega), ''];
    if (grupo('crear').length)
      lin.push('🆕 Se ENVÍA por primera vez a:\n   ' + grupo('crear').map(function(p) { return p.area; }).join(', '));
    if (grupo('actualizar').length) {
      lin.push('🔄 Se ACTUALIZA (se conserva estado, KG avance, fechas reales y observaciones):');
      grupo('actualizar').forEach(function(p) {
        var t = '   • ' + p.area;
        if (p.newSubs > p.oldSubs) t += '  (+' + (p.newSubs - p.oldSubs) + ' subestructura/s nueva/s)';
        if (p.newSubs < p.oldSubs) t += '  (−' + (p.oldSubs - p.newSubs) + ' subestructura/s se borran)';
        if (p.riesgos.length) t += '\n       ⚠️ con avance: ' + p.riesgos.join(', ');
        lin.push(t);
      });
    }
    if (grupo('eliminar').length) {
      lin.push('🗑 Se QUITA la OP de (te pediré confirmar aparte):');
      grupo('eliminar').forEach(function(p) {
        lin.push('   • ' + p.area + (p.riesgos.length ? '  ⚠️ con avance: ' + p.riesgos.join(', ') : ''));
      });
    }
    if (grupo('error').length)
      lin.push('❌ No se puede en:\n' + grupo('error').map(function(p) { return '   • ' + p.area + ': ' + p.error; }).join('\n'));
    lin.push('', '¿Continuar?');
    if (ui.alert('📤 Enviar / Actualizar OP en Áreas', lin.join('\n'), ui.ButtonSet.YES_NO) !== ui.Button.YES) return;

    grupo('eliminar').forEach(function(p) {
      var r = ui.alert('🗑 Quitar OP ' + op + ' de ' + p.area,
        'Se borrarán ' + p.blk.len + ' filas de la OP en el Cronograma de ' + p.area + '.' +
        (p.riesgos.length ? '\n\n⚠️ Esas filas tienen avance registrado por el área: ' + p.riesgos.join(', ') : '') +
        '\n\n¿Quitarla?', ui.ButtonSet.YES_NO);
      if (r !== ui.Button.YES) p.accion = 'omitir';
    });

    // ---------- 3) EJECUTAR ----------
    var reg = _nuevoRegistro(op);
    var creadas = [], actualizadas = [], quitadasOk = [], omitidas = [], fallidas = [];
    var trabajo = plan.filter(function(p) { return p.accion !== 'error' && p.accion !== 'omitir'; });
    grupo('error').forEach(function(p) { fallidas.push(p.area + ': ' + p.error); });
    grupo('omitir').forEach(function(p) { omitidas.push(p.area); });

    trabajo.forEach(function(p, i) {
      ss.toast('Área ' + (i + 1) + ' de ' + trabajo.length + '...', '📤 ' + p.area, 4);
      var origen = 'Cronograma ' + p.area;
      try {
        if (p.accion === 'crear') {
          _enviarAPlantillaArea(p.id, p.area, op, m.nombreOp, m.cliente, m.comercial, m.sede,
                                m.numSubs, m.numAreas, kgTotal, p.datos, fechaEntrega, p.tSheet);
          reg.add(origen, p.area, '', '', 'OP', '', 'enviada (' + p.newSubs + ' subestructura/s)');
          _aplicarTareasEnArea(p.tSheet, p.area, op, metaT, function(area, sub, tarea, campo, antes, despues) {   // v14
            reg.add(origen, area, sub, tarea, campo, antes, despues);
          });
          creadas.push(p.area);
        } else if (p.accion === 'actualizar') {
          var ctx = _ctxArea(p.tSheet, p.area, op, m.nombreOp, m.cliente, m.comercial, m.sede,
                             m.numSubs, m.numAreas, kgTotal, p.datos, fechaEntrega);
          var n = _actualizarOPEnArea(p.tSheet, ctx, p.blk, function(area, sub, tarea, campo, antes, despues) {
            reg.add(origen, area, sub, tarea, campo, antes, despues);
          });
          // v14: tareas No aplica / nombres en esta OP
          n += _aplicarTareasEnArea(p.tSheet, p.area, op, metaT, function(area, sub, tarea, campo, antes, despues) {
            reg.add(origen, area, sub, tarea, campo, antes, despues);
          });
          actualizadas.push(p.area + (n ? ' (' + n + ' cambio/s)' : ' (sin cambios)'));
        } else if (p.accion === 'eliminar') {
          p.tSheet.deleteRows(p.blk.start, p.blk.len);
          reg.add(origen, p.area, '', '', 'OP', 'en cronograma (' + p.blk.len + ' filas)', 'eliminada');
          quitadasOk.push(p.area);
        }
      } catch (e) {
        fallidas.push(p.area + ': ' + e.message);
      }
    });

    // Áreas donde la OP quedó publicada
    var enviadas = m.enviadas.slice();
    creadas.concat(actualizadas.map(function(a) { return a.split(' (')[0]; })).forEach(function(a) {
      if (enviadas.indexOf(a) === -1) enviadas.push(a);
    });
    enviadas = enviadas.filter(function(a) { return quitadasOk.indexOf(a) === -1; });
    ws.getRange(1, COL_META_ENVIADAS).setValue(_ordenarAreas(enviadas).join(','));
    reg.guardar(ss);

    var msg = '✅ OP ' + op + '\n';
    if (creadas.length)      msg += '\n🆕 Enviada a: ' + creadas.join(', ');
    if (actualizadas.length) msg += '\n🔄 Actualizada en: ' + actualizadas.join(', ');
    if (quitadasOk.length)   msg += '\n🗑 Quitada de: ' + quitadasOk.join(', ');
    if (omitidas.length)     msg += '\n⏭ No se quitó de: ' + omitidas.join(', ');
    if (fallidas.length)     msg += '\n\n⚠️ Falló en:\n' + fallidas.join('\n');
    if (reg.n())             msg += '\n\n📋 ' + reg.n() + ' cambio/s anotados en "' + HOJA_REGISTRO + '".';
    ui.alert(msg);
  } finally {
    lock.releaseLock();
  }
}

// ============================================================
//  CREAR HOJA OP INTERNA
// ============================================================
function _crearHojaOP(ss, op, nombreOp, cliente, comercial, sede, numSubs, kgTotal, areasSeleccionadas, numAreas, fechaEntrega) {
  var ws = ss.insertSheet(op);

  // Headers actualizados con nueva estructura
  var headers = [
    'PROCESO','PORCENTAJE_PARTICIPACIÓN_POR_ÁREA','PORCENTAJE_PARTICIPACIÓN_POR_SUBESTRUCTURA',
    '# SubEstructura','Nombre SubEstructura',
    'KG_SUBESTRUCTURA',           // col F — NUEVO (kg de cada sub)
    'Sede','Descripción Tareas',
    'FECHA_INICIO_TAREA_PLANEADO','DURACION_DIAS_TAREAS_PLANEADO','FECHA_FIN_TAREA_PLANEADO',
    'TOTAL_DIAS_TAREA_PLANEADO','%_TAREA_PLANEADO','%_TAREAS_INDIVIDUALES_PLANEADO',
    '%_TAREAS_INDIVIDUALES_PLANEADO_DESAGREGADO','%_TAREAS_INDIVIDUALES_PLANEADO_ACUMULADO',
    'FECHA_INICIO_TAREA_REAL','DURACION_DIAS_TAREAS_REAL','FECHA_FIN_TAREA_REAL',
    'TOTAL_DIAS_TAREA_REAL','%_TAREA_REAL','%_TAREAS_INDIVIDUALES_REAL',
    '%_TAREAS_INDIVIDUALES_REAL_DESAGREGADO','%_TAREAS_INDIVIDUALES_REAL_ACUMULADO',
    '%_DE_CUMPLIMIENTO_VS_PLANEACION','OBSERVACIONES','KPI Individual',
    // Columnas ocultas META
    'META_OP','META_NOMBRE','META_CLIENTE','META_COMERCIAL','META_SEDE','META_SUBS',
    'META_KG_TOTAL',              // col AH — NUEVO
    'META_AREAS_N','META_AREAS_LIST',
    'META_FECHA_ENTREGA',         // col AK — v8
    'META_AREAS_ENVIADAS'         // col AL — v9 (áreas donde ya está publicada)
  ];

  ws.getRange(1, 1, 1, headers.length).setValues([headers]);
  ws.getRange(1, 1, 1, 26).setBackground('#2F75B5').setFontColor('#FFFFFF').setFontWeight('bold').setWrap(true);

  // Guardar metadatos (ahora en columnas AB..AJ)
  ws.getRange(1, 28).setValue(op);
  ws.getRange(1, 29).setValue(nombreOp);
  ws.getRange(1, 30).setValue(cliente);
  ws.getRange(1, 31).setValue(comercial);
  ws.getRange(1, 32).setValue(sede);
  ws.getRange(1, 33).setValue(numSubs);
  ws.getRange(1, 34).setValue(0);  // KG_TOTAL se calcula dinámicamente al enviar (suma col F)
  ws.getRange(1, 35).setValue(numAreas);
  ws.getRange(1, 36).setValue(areasSeleccionadas.join(','));
  ws.getRange(1, COL_META_FECHA).setValue(_esFecha(fechaEntrega) ? fechaEntrega : '').setNumberFormat('dd/mm/yyyy'); // v8
  ws.getRange(1, COL_META_ENVIADAS).setValue('');                                  // v9
  ws.hideColumns(27, 12);
  ws.setFrozenRows(1);
  ws.setFrozenColumns(1);

  var currentRow = 2;

  for (var ai = 0; ai < areasSeleccionadas.length; ai++) {
    var area = areasSeleccionadas[ai];
    var tareas = TAREAS_AREA[area] || TAREAS_AREA['Diseño'];
    var TAREAS_POR_SUB = tareas.length;
    var areaStartRow = currentRow;

    // v3: Áreas generales solo crean 1 subestructura en la hoja interna
    var numSubsEfectivo = (AREAS_GENERALES.indexOf(area) !== -1) ? 1 : numSubs;

    for (var s = 0; s < numSubsEfectivo; s++) {
      var subLabel   = op + '_' + (s + 1);
      var subStartRow = currentRow;
      var kgSubDefault = 0; // El usuario edita KG_SUBESTRUCTURA manualmente en la hoja OP

      for (var tIdx = 0; tIdx < tareas.length; tIdx++) {
        var descTarea    = tareas[tIdx][0];
        var r            = currentRow;
        var isFirstDeArea = (s === 0 && tIdx === 0);
        var isFirstDeSub  = (tIdx === 0);

        if (isFirstDeArea) ws.getRange(r, 1).setValue(area.toUpperCase());
        if (isFirstDeArea) ws.getRange(r, 2).setValue(1/numAreas).setNumberFormat('0.00%');
        if (isFirstDeSub)  ws.getRange(r, 3).setValue((1/numAreas)/numSubsEfectivo).setNumberFormat('0.00%');
        if (isFirstDeSub)  ws.getRange(r, 4).setValue(subLabel);
        if (isFirstDeSub)  ws.getRange(r, 5).setValue('Nombre ' + (s+1));
        if (isFirstDeSub)  ws.getRange(r, 6).setValue(kgSubDefault); // KG_SUBESTRUCTURA
        if (isFirstDeSub)  ws.getRange(r, 7).setValue(sede);
        ws.getRange(r, 8).setValue(descTarea);

        // Fecha fin plan
        ws.getRange(r, 11).setFormula('=IF(OR(I' + r + '="",J' + r + '=0),"",WORKDAY.INTL(I' + r + ',J' + r + '-1,1,DIAS_FESTIVOS!A3:A20))');

        if (isFirstDeSub) {
          ws.getRange(r, 12).setFormula('=SUM(J' + subStartRow + ':J' + (subStartRow+TAREAS_POR_SUB-1) + ')');
          ws.getRange(r, 13).setFormula('=IF(L' + r + '=0,"",100%/L' + r + ')');
        }
        ws.getRange(r, 14).setFormula('=IF(J' + r + '="","",J' + r + '*M$' + subStartRow + ')');
        ws.getRange(r, 15).setFormula('=IF(N' + r + '="","",N' + r + '*C' + subStartRow + ')');
        if (tIdx === 0) {
          ws.getRange(r, 16).setFormula('=O' + r);
        } else {
          ws.getRange(r, 16).setFormula('=P' + (r-1) + '+O' + r);
        }

        // Fecha fin real
        ws.getRange(r, 19).setFormula('=IF(OR(Q' + r + '="",R' + r + '=0),"",WORKDAY.INTL(Q' + r + ',R' + r + '-1,1,DIAS_FESTIVOS!A3:A20))');

        if (isFirstDeSub) {
          ws.getRange(r, 20).setFormula('=SUM(R' + subStartRow + ':R' + (subStartRow+TAREAS_POR_SUB-1) + ')');
          ws.getRange(r, 21).setFormula('=IF(T' + r + '=0,"",100%/T' + r + ')');
        }
        ws.getRange(r, 22).setFormula('=IF(R' + r + '="","",R' + r + '*U$' + subStartRow + ')');
        ws.getRange(r, 23).setFormula('=IF(V' + r + '="","",V' + r + '*C' + subStartRow + ')');
        if (tIdx === 0) {
          ws.getRange(r, 24).setFormula('=W' + r);
        } else {
          ws.getRange(r, 24).setFormula('=X' + (r-1) + '+W' + r);
        }
        ws.getRange(r, 25).setFormula('=IF(OR(I' + r + '="",J' + r + '=0),"",IFERROR(MIN(1,J' + r + '/(R' + r + '+(Q' + r + '-I' + r + '))),0))');
        ws.getRange(r, 27).setFormula('=IF(OR(I' + r + '="",Q' + r + '=""),"",Y' + r + ')');

        currentRow++;
      }

      var colsMerge = [3, 4, 5, 6, 7, 12, 13, 20, 21]; // col 6 = KG_SUB
      for (var mc = 0; mc < colsMerge.length; mc++) {
        try {
          ws.getRange(subStartRow, colsMerge[mc], TAREAS_POR_SUB, 1).mergeVertically();
          ws.getRange(subStartRow, colsMerge[mc], TAREAS_POR_SUB, 1).setVerticalAlignment('middle');
        } catch(_) {}
      }
    }

    var areaRowCount = currentRow - areaStartRow;
    if (areaRowCount > 1) {
      try {
        ws.getRange(areaStartRow, 1, areaRowCount, 1).mergeVertically();
        ws.getRange(areaStartRow, 1, areaRowCount, 1)
          .setBackground('#2F75B5').setFontColor('#FFFFFF')
          .setFontWeight('bold').setVerticalAlignment('middle').setHorizontalAlignment('center');
      } catch(_) {}
      try {
        ws.getRange(areaStartRow, 2, areaRowCount, 1).mergeVertically();
        ws.getRange(areaStartRow, 2, areaRowCount, 1).setVerticalAlignment('middle').setHorizontalAlignment('center');
      } catch(_) {}
    }
  }

  var dataRows = currentRow - 2;
  if (dataRows > 0) {
    ws.getRange(2, 9,  dataRows, 1).setNumberFormat('dd/mm/yyyy');
    ws.getRange(2, 11, dataRows, 1).setNumberFormat('dd/mm/yyyy');
    ws.getRange(2, 17, dataRows, 1).setNumberFormat('dd/mm/yyyy');
    ws.getRange(2, 19, dataRows, 1).setNumberFormat('dd/mm/yyyy');
    ws.getRange(2, 6,  dataRows, 1).setNumberFormat('#,##0 "kg"');   // formato kg
    ws.getRange(2, 13, dataRows, 5).setNumberFormat('0.00%');
    ws.getRange(2, 21, dataRows, 4).setNumberFormat('0.00%');
    ws.getRange(2, 25, dataRows, 1).setNumberFormat('0.00%');
  }

  ws.setColumnWidth(1, 110); ws.setColumnWidth(2, 80);  ws.setColumnWidth(3, 90);
  ws.setColumnWidth(4, 75);  ws.setColumnWidth(5, 130); ws.setColumnWidth(6, 100);
  ws.setColumnWidth(7, 100); ws.setColumnWidth(8, 170);
  return ws;
}

// ============================================================
//  ENVIAR DATOS A LA PLANTILLA DE ÁREA
//  v9: dividido en piezas reutilizables para poder CREAR y ACTUALIZAR
//      con exactamente las mismas fórmulas de antes.
// ============================================================

function _abrirCronograma(spreadsheetId) {
  var tSheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName('Cronograma');
  if (!tSheet) throw new Error('Hoja "Cronograma" no encontrada');
  return tSheet;
}

/** Ubica el bloque de filas de una OP en el Cronograma: {start, len} o null. */
function _bloqueOP(tSheet, op) {
  var last = tSheet.getLastRow();
  if (last < FILA_INICIO_CRONO) return null;
  var n = last - FILA_INICIO_CRONO + 1;
  var colB = tSheet.getRange(FILA_INICIO_CRONO, 2, n, 1).getValues();
  var colN = tSheet.getRange(FILA_INICIO_CRONO, 14, n, 1).getValues();
  var objetivo = String(op).trim();
  // v12: como el original, se toma la ÚLTIMA aparición de la O.P (búsqueda de abajo hacia arriba)
  for (var i = n - 1; i >= 0; i--) {
    if (String(colB[i][0]).trim() !== objetivo) continue;
    var j = i + 1;
    while (j < n && String(colB[j][0]).trim() === '' && String(colN[j][0]).trim() !== '') j++;
    return { start: FILA_INICIO_CRONO + i, len: j - i };
  }
  return null;
}

/** Subestructuras (dentro de un rango de filas) donde el área ya registró avance. */
function _subsConAvance(tSheet, start, nFilas, T, s0) {
  if (nFilas <= 0) return [];
  var v = tSheet.getRange(start, 1, nFilas, 29).getValues();
  var out = [];
  for (var b = 0; b * T < nFilas; b++) {
    var con = false;
    for (var t = 0; t < T && b * T + t < nFilas; t++) {
      var row = v[b * T + t];
      var estado = String(row[15]).trim();                         // P = ESTADO
      if ((estado && estado !== 'En pausa') ||
          (parseFloat(row[18]) > 0) ||                              // S = KG avance
          String(row[28]).trim() !== '') { con = true; break; }     // AC = OBSERVACIONES
    }
    if (con) out.push('Sub ' + (s0 + b + 1) + (String(v[b * T][10]).trim() ? ' (' + String(v[b * T][10]).trim() + ')' : ''));
  }
  return out;
}

/** Contexto común de un área (columnas corridas, tareas, KG...). */
function _ctxArea(tSheet, area, op, nombreOp, cliente, comercial, sede, numSubs, numAreas, kgTotal, datosHoja, fechaEntrega) {
  var colFecha = _columnaFechaEntrega(tSheet);     // v8
  var k        = _offsetPlaneado(tSheet);          // v8
  var tareas   = TAREAS_AREA[area] || TAREAS_AREA['Diseño'];
  var T        = tareas.length;
  var numSubsEf = (AREAS_GENERALES.indexOf(area) !== -1) ? 1 : numSubs;
  datosHoja = datosHoja || [];

  var kgTotalArea = 0;
  for (var si = 0; si < numSubsEf; si++) {
    var idx = si * T;
    if (idx < datosHoja.length) {
      var kgSi = parseFloat(datosHoja[idx].kgSub);
      if (!isNaN(kgSi) && kgSi > 0) kgTotalArea += kgSi;
    }
  }
  if (kgTotalArea === 0) kgTotalArea = kgTotal;

  return {
    area: area, op: op, nombreOp: nombreOp, cliente: cliente, comercial: comercial, sede: sede,
    numAreas: numAreas, kgTotal: kgTotal, kgTotalArea: kgTotalArea, datosHoja: datosHoja,
    fechaEntrega: fechaEntrega, tareas: tareas, T: T, numSubsEf: numSubsEf,
    mes: _getNombreMes(), tipoArea: TIPO_AREA[area] || 'B', asFilas: AS_FILAS[area] || {},
    colFecha: colFecha, k: k,
    P:  function(n) { return n >= 30 ? n + k : n; },
    PL: function(n) { return _colLetra(n >= 30 ? n + k : n); },
    opStartRow: null
  };
}

function _kgSubCtx(ctx, s) {
  var d = ctx.datosHoja[s * ctx.T];
  if (d && d.kgSub) return parseFloat(d.kgSub) || 0;
  return ctx.numSubsEf > 0 ? ctx.kgTotal / ctx.numSubsEf : ctx.kgTotal;
}

/** Escribe UNA subestructura completa (mismas fórmulas que v8). */
function _escribirSub(tSheet, ctx, s, subStart) {
  var tareas = ctx.tareas, TAREAS_POR_SUB = ctx.T, P = ctx.P, PL = ctx.PL;
  var opStartRow = ctx.opStartRow;
  var kgSub = _kgSubCtx(ctx, s);

  for (var tIdx = 0; tIdx < tareas.length; tIdx++) {
    var descTarea   = tareas[tIdx][0];
    var responsable = tareas[tIdx][1];
    var r           = subStart + tIdx;
    var isFirst     = (s === 0 && tIdx === 0);
    var isFirstSub  = (tIdx === 0);

    var datoFila        = ctx.datosHoja[s * TAREAS_POR_SUB + tIdx] || null;
    var nombreSubManual = datoFila ? datoFila.nombreSub    : '';
    var fechaIniPlan    = datoFila ? datoFila.fechaIniPlan : '';
    var durPlan         = datoFila ? datoFila.durPlan      : '';
    var fechaIniReal    = datoFila ? datoFila.fechaIniReal : '';
    var durReal         = datoFila ? datoFila.durReal      : '';

    if (isFirstSub) tSheet.getRange(r, 1).setValue(ctx.mes);
    tSheet.getRange(r, 2).setValue(isFirst ? ctx.op : '');
    tSheet.getRange(r, 3).setValue(isFirst ? ctx.nombreOp : '');
    tSheet.getRange(r, 4).setValue(isFirst ? ctx.cliente : '');
    tSheet.getRange(r, 5).setValue(isFirst ? ctx.comercial : '');

    if (isFirst) {
      tSheet.getRange(r, 6).setValue(ctx.kgTotalArea);
      tSheet.getRange(r, 6).setNumberFormat('#,##0 "kg"');
      tSheet.getRange(r, 7).setValue(ctx.numAreas);
      tSheet.getRange(r, 8).setValue(ctx.numAreas > 0 ? 1/ctx.numAreas : 0);
      tSheet.getRange(r, 8).setNumberFormat('0.00%');
    }

    if (isFirstSub) {
      tSheet.getRange(r, 9).setFormula('=((L' + r + '*100%)/F' + opStartRow + ')/G' + opStartRow);
      tSheet.getRange(r, 9).setNumberFormat('0.00%');
      tSheet.getRange(r, 10).setFormula('=I' + r + '*R' + r);
      tSheet.getRange(r, 10).setNumberFormat('0.00%');
      tSheet.getRange(r, 11).setValue(nombreSubManual || ('Nombre ' + (s+1)));
      tSheet.getRange(r, 12).setValue(kgSub);
      tSheet.getRange(r, 12).setNumberFormat('#,##0 "kg"');
      tSheet.getRange(r, 13).setValue(ctx.sede);
    }

    tSheet.getRange(r, 14).setValue(descTarea);
    tSheet.getRange(r, 15).setValue(responsable);
    tSheet.getRange(r, 16).setValue('Abierto');   // v13: estado inicial real (antes 'En pausa')

    // Col Q (%_APORTE_TAREA)
    if (ctx.tipoArea === 'A') {
      var pt = (tareas[tIdx][2]||0).toString().replace('.',',');
      var pp = (tareas[tIdx][3]||0).toString().replace('.',',');
      var pr = (tareas[tIdx][4]||0).toString().replace('.',',');
      tSheet.getRange(r, 17).setValue('=IF(P' + r + '="Terminado";' + pt + ';IF(P' + r + '="En pausa";' + pp + ';IF(P' + r + '="Reproceso";' + pr + ';0)))');
    } else {
      var asRow = ctx.asFilas[descTarea] || null;
      if (asRow) {
        tSheet.getRange(r, 17).setFormula("='Assignees and Status'!B" + asRow + '%*T' + r);
      } else {
        var pt2 = (tareas[tIdx][2]||0).toString().replace('.',',');
        var pp2 = (tareas[tIdx][3]||0).toString().replace('.',',');
        tSheet.getRange(r, 17).setValue('=IF(P' + r + '="Terminado";' + pt2 + ';IF(P' + r + '="En pausa";' + pp2 + ';0))');
      }
    }
    tSheet.getRange(r, 17).setNumberFormat('0.00%');

    // Col S = KG_AVANCE_ACUMULADO — valor manual del área (sin fórmula, evita circularidad)
    tSheet.getRange(r, 19).setNumberFormat('#,##0.00 "kg"');

    tSheet.getRange(r, 18).setNumberFormat('0.00%');
    tSheet.getRange(r, 20).setFormula('=S' + r + '/L' + subStart);

    if (fechaIniReal && fechaIniReal instanceof Date && fechaIniReal.getFullYear() > 1900) {
      tSheet.getRange(r, 21).setValue(fechaIniReal).setNumberFormat('dd/mm/yyyy');
    } else if (isFirstSub) {
      // v13: sin inicio real automático (antes '=' + PL(30) + r, copia del inicio planeado).
      //      Queda vacío hasta que el área registre cuándo empezó realmente.
    } else {
      // v13: se encadena solo si la tarea anterior ya tiene fin real (antes daba 01/01/1900 si estaba vacía)
      tSheet.getRange(r, 21).setValue('=IF(W' + (r-1) + '="";"";WORKDAY(W' + (r-1) + ';1;DIAS_FESTIVOS!$A$3:$A$20))');
    }

    if (durReal && typeof durReal === 'number' && durReal > 0) {
      tSheet.getRange(r, 22).setValue(durReal);
    }

    tSheet.getRange(r, 23).setValue('=IF(OR(U' + r + '="";V' + r + '=0);"";WORKDAY.INTL(U' + r + ';V' + r + '-1;1;DIAS_FESTIVOS!$A$3:$A$20))');

    tSheet.getRange(r, 26).setFormula('=V' + r + '*Y$' + subStart);
    if (tIdx === 0) tSheet.getRange(r, 27).setFormula('=Z' + r);
    else            tSheet.getRange(r, 27).setFormula('=AA' + (r-1) + '+Z' + r);
    tSheet.getRange(r, 28).setFormula('=' + PL(33) + r + '/X' + r);
    tSheet.getRange(r, 28).setNumberFormat('0.00%');

    if (fechaIniPlan && fechaIniPlan instanceof Date && fechaIniPlan.getFullYear() > 1900) {
      tSheet.getRange(r, P(30)).setValue(fechaIniPlan).setNumberFormat('dd/mm/yyyy');
    }
    if (durPlan && typeof durPlan === 'number' && durPlan > 0) {
      tSheet.getRange(r, P(31)).setValue(durPlan);
    }
    tSheet.getRange(r, P(32)).setValue('=IF(OR(' + PL(30) + r + '="";' + PL(31) + r + '=0);"";WORKDAY.INTL(' + PL(30) + r + ';' + PL(31) + r + '-1;1;DIAS_FESTIVOS!$A$3:$A$20))');

    tSheet.getRange(r, P(35)).setFormula('=' + PL(31) + r + '*' + PL(34) + '$' + subStart);
    if (isFirstSub) tSheet.getRange(r, P(36)).setFormula('=' + PL(35) + r);
    else            tSheet.getRange(r, P(36)).setFormula('=' + PL(36) + (r-1) + '+' + PL(35) + r);
  }

  // Fórmulas de resumen de la subestructura
  setSubSummaryFormulas(tSheet, subStart, TAREAS_POR_SUB, ctx.k);

  // Merges
  var mergeCols = [1, 6, 9, 10, 11, 12, 13, 18, 24, 25, 28, P(33), P(34)];
  for (var mc = 0; mc < mergeCols.length; mc++) {
    try {
      tSheet.getRange(subStart, mergeCols[mc], TAREAS_POR_SUB, 1).mergeVertically();
      tSheet.getRange(subStart, mergeCols[mc], TAREAS_POR_SUB, 1).setVerticalAlignment('middle');
    } catch(_) {}
  }

  var bloqueRange = tSheet.getRange(subStart, 1, TAREAS_POR_SUB, Math.max(P(36), ctx.colFecha));
  bloqueRange.setBorder(true,true,true,true,null,null,'#000000',SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  bloqueRange.setBorder(null,null,null,null,true,true,'#000000',SpreadsheetApp.BorderStyle.SOLID);
}

/** Merges de la OP completa, formatos de fecha y FECHA_ENTREGA_CLIENTE. */
function _cerrarBloqueOP(tSheet, ctx, start, len) {
  var P = ctx.P;
  var mergeColsOp = [2, 3, 4, 5, 6, 7, 8];
  for (var mc2 = 0; mc2 < mergeColsOp.length; mc2++) {
    try {
      var rg = tSheet.getRange(start, mergeColsOp[mc2], len, 1);
      rg.breakApart();
      rg.mergeVertically();
      rg.setVerticalAlignment('middle');
    } catch(_) {}
  }

  tSheet.getRange(start, 21, len, 1).setNumberFormat('dd/mm/yyyy');
  tSheet.getRange(start, 23, len, 1).setNumberFormat('dd/mm/yyyy');
  tSheet.getRange(start, P(30), len, 1).setNumberFormat('dd/mm/yyyy');
  tSheet.getRange(start, P(32), len, 1).setNumberFormat('dd/mm/yyyy');

  // v8: Fecha de entrega al cliente (una vez por OP, combinada como OP/Cliente)
  var rgFecha = tSheet.getRange(start, ctx.colFecha, len, 1);
  try { rgFecha.breakApart(); } catch(_) {}
  rgFecha.clearContent();
  tSheet.getRange(start, ctx.colFecha).setValue(_esFecha(ctx.fechaEntrega) ? ctx.fechaEntrega : '');
  rgFecha.setNumberFormat('dd/mm/yyyy').setHorizontalAlignment('center').setFontWeight('bold');
  try { rgFecha.mergeVertically().setVerticalAlignment('middle'); } catch(_) {}
}

/** CREA la OP en el cronograma del área (primer envío). */
function _enviarAPlantillaArea(spreadsheetId, area, op, nombreOp, cliente, comercial, sede, numSubs, numAreas, kgTotal, datosHoja, fechaEntrega, tSheetOpt) {
  var tSheet = tSheetOpt || _abrirCronograma(spreadsheetId);
  var ctx    = _ctxArea(tSheet, area, op, nombreOp, cliente, comercial, sede, numSubs, numAreas, kgTotal, datosHoja, fechaEntrega);

  var lastExistingRow = Math.max(tSheet.getLastRow(), FILA_INICIO_CRONO);
  tSheet.getRange(FILA_INICIO_CRONO, 14, lastExistingRow - FILA_INICIO_CRONO + 1, 1).clearDataValidations();
  tSheet.getRange(FILA_INICIO_CRONO, 15, lastExistingRow - FILA_INICIO_CRONO + 1, 1).clearDataValidations();

  // v9: si por algún motivo ya estaba, se borra su tamaño REAL (antes podía borrar filas de otra OP)
  var blk = _bloqueOP(tSheet, op);
  if (blk) tSheet.deleteRows(blk.start, blk.len);

  var fila = tSheet.getLastRow() + 1;
  ctx.opStartRow = fila;
  for (var s = 0; s < ctx.numSubsEf; s++) _escribirSub(tSheet, ctx, s, fila + s * ctx.T);
  _cerrarBloqueOP(tSheet, ctx, fila, ctx.numSubsEf * ctx.T);
}

/**
 * ACTUALIZA una OP que ya está en el cronograma del área.
 * Solo reescribe lo que es de comercial; NO toca ESTADO, KG avance,
 * fechas/duración reales ni OBSERVACIONES. Devuelve # de cambios.
 */
function _actualizarOPEnArea(tSheet, ctx, blk, registrar) {
  var T = ctx.T, start = blk.start, P = ctx.P;
  var oldSubs = blk.len / T, newSubs = ctx.numSubsEf;
  var cambios = 0;
  ctx.opStartRow = start;

  // Subestructuras sobrantes → se borran solo las del final
  if (newSubs < oldSubs) {
    var desde = start + newSubs * T, nBorrar = (oldSubs - newSubs) * T;
    var nombres = tSheet.getRange(desde, 11, nBorrar, 1).getValues();
    tSheet.deleteRows(desde, nBorrar);
    for (var sb = newSubs; sb < oldSubs; sb++) {
      registrar(ctx.area, ctx.op + '_' + (sb + 1) + ' ' + String(nombres[(sb - newSubs) * T][0] || ''), '',
                'Subestructura', 'existía', 'eliminada');
      cambios++;
    }
  }
  // Subestructuras nuevas → se agregan debajo de las existentes
  if (newSubs > oldSubs) {
    var despues = start + blk.len - 1, nNuevas = (newSubs - oldSubs) * T;
    tSheet.insertRowsAfter(despues, nNuevas);
    tSheet.getRange(despues + 1, 1, nNuevas, Math.max(P(36), ctx.colFecha)).breakApart().clearContent();
    tSheet.getRange(despues + 1, 14, nNuevas, 2).clearDataValidations();
    for (var sn = oldSubs; sn < newSubs; sn++) {
      _escribirSub(tSheet, ctx, sn, start + sn * T);
      registrar(ctx.area, ctx.op + '_' + (sn + 1), '', 'Subestructura', '', 'agregada');
      cambios++;
    }
  }

  var len   = newSubs * T;
  var ancho = Math.max(P(36), ctx.colFecha);
  var v     = tSheet.getRange(start, 1, len, ancho).getValues();
  var set = function(i, col, nuevo, sub, tarea, campo) {
    var antes = v[i][col - 1];
    if (_mismoValor(antes, nuevo)) return;
    tSheet.getRange(start + i, col).setValue(nuevo);
    registrar(ctx.area, sub, tarea, campo, antes, nuevo);
    cambios++;
  };

  // Datos generales de la OP (primera fila)
  set(0, 3, ctx.nombreOp,  '', '', 'NOMBRE_OP');
  set(0, 4, ctx.cliente,   '', '', 'CLIENTE');
  set(0, 5, ctx.comercial, '', '', 'COMERCIAL');
  set(0, 6, ctx.kgTotalArea, '', '', 'KG_TOTAL_PROYECTO');
  set(0, 7, ctx.numAreas,  '', '', 'NUM_PROCESOS');
  set(0, 8, ctx.numAreas > 0 ? 1 / ctx.numAreas : 0, '', '', '%_PARTICIPACION_PROCESO');
  set(0, ctx.colFecha, _esFecha(ctx.fechaEntrega) ? ctx.fechaEntrega : '', '', '', 'FECHA_ENTREGA_CLIENTE');

  // Subestructuras que ya existían: datos de comercial + PLANEADO
  var hasta = Math.min(oldSubs, newSubs);
  for (var s = 0; s < hasta; s++) {
    var i0  = s * T, d0 = ctx.datosHoja[i0];
    var sub = ctx.op + '_' + (s + 1);
    set(i0, 11, (d0 && d0.nombreSub) || ('Nombre ' + (s + 1)), sub, '', 'NOMBRE_SUBESTRUCTURA');
    set(i0, 12, _kgSubCtx(ctx, s), sub, '', 'PESO_KG_SUBESTRUCTURA');
    set(i0, 13, ctx.sede, sub, '', 'Sede');
    for (var t = 0; t < T; t++) {
      var i = i0 + t, d = ctx.datosHoja[i], tarea = ctx.tareas[t][0];
      if (!d) continue;
      if (_esFecha(d.fechaIniPlan))                        set(i, P(30), d.fechaIniPlan, sub, tarea, 'FECHA_INICIO_TAREA_PLANEADO');
      if (typeof d.durPlan === 'number' && d.durPlan > 0)  set(i, P(31), d.durPlan,      sub, tarea, 'DURACION_DIAS_TAREAS_PLANEADO');
      // v12 — LÓGICA ORIGINAL RECUPERADA: el original, al reenviar, pasaba al área la
      // FECHA_INICIO_TAREA_REAL y la DURACION_DIAS_TAREAS_REAL digitadas en la hoja de la
      // O.P (cols Q y R). Se vuelve a hacer igual; si en la hoja O.P están vacías, se
      // conserva lo que haya en el área (no se borra nada).
      if (d.fechaIniReal instanceof Date && d.fechaIniReal.getFullYear() > 1900) {
        if (!_mismoValor(v[i][20], d.fechaIniReal)) tSheet.getRange(start + i, 21).setNumberFormat('dd/mm/yyyy');
        set(i, 21, d.fechaIniReal, sub, tarea, 'FECHA_INICIO_TAREA_REAL');
      }
      if (typeof d.durReal === 'number' && d.durReal > 0)  set(i, 22, d.durReal,      sub, tarea, 'DURACION_DIAS_TAREAS_REAL');
    }
  }

  _cerrarBloqueOP(tSheet, ctx, start, len);
  return cambios;
}

// ============================================================
//  EXTRAER DATOS AL GANTT
// ============================================================
function actualizarGanttEnComercial() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Cronograma Comercial');
  if (!sheet) {
    SpreadsheetApp.getUi().alert('No se encontró la hoja "Cronograma Comercial"');
    return;
  }

  var opSeleccionada = sheet.getRange('B4').getValue();
  if (!opSeleccionada) {
    SpreadsheetApp.getUi().alert('❌ Escribe el número de OP en la celda B4');
    return;
  }

  var lastRow = sheet.getLastRow();
  if (lastRow > 8) sheet.getRange(9, 1, lastRow-8, 50).clearContent().clearFormat();

  var tareas = [];
  tareas.push(['Comercial','Inicio de Proyecto (COMERCIAL)','','0%','','','']);
  // v13: sin estados ni fechas automáticas (antes 'Terminado', 100% y 30/12/2025 fijos)
  tareas.push(['Comercial','Revisión y Firma del Contrato','Cliente','Abierto',0,'','']);
  tareas.push(['Comercial','Cuenta de Cobro / Gestión de Pólizas','Administración','Abierto',0,'','']);
  tareas.push(['Comercial','Recepción de Anticipo','Cliente','Abierto',0,'','']);

  var areaNames = Object.keys(IDS_AREAS);
  for (var ai = 0; ai < areaNames.length; ai++) {
    var area = areaNames[ai];
    var id   = IDS_AREAS[area];
    if (!id || id.indexOf('PON_AQUI') !== -1) continue;
    try {
      var data = SpreadsheetApp.openById(id).getSheetByName('Cronograma').getDataRange().getValues();
      // v8: columnas de fechas planeadas por nombre de encabezado (se corren si existe FECHA_ENTREGA_CLIENTE)
      var iIni = _idxEncabezado(data, 'FECHA_INICIO_TAREA_PLANEADO', 29);
      var iFin = _idxEncabezado(data, 'FECHA_FIN_TAREA_PLANEADO', 31);
      var lastOP = '';
      for (var i = 1; i < data.length; i++) {
        var r  = data[i];
        var op = r[1] ? r[1] : lastOP;
        if (r[1]) lastOP = r[1];
        if (String(op).trim() !== String(opSeleccionada).trim()) continue;
        var tarea = r[13]; // col N = DESCRIPCION_TAREAS (nueva estructura)
        if (!tarea || tarea.toString().trim() === '') continue;
        // r[14]=Asignado, r[15]=Estado, r[16]=%_aporte, r[29]=FIniPlan(col AD), r[31]=FFinPlan(col AF)
        tareas.push([area, tarea, r[14]||'', r[15]||'', r[16]||0, r[iIni]||'', r[iFin]||'']);
      }
    } catch(_) {}
  }

  var row = 9;
  var areaActual = '';
  for (var t = 0; t < tareas.length; t++) {
    var tArea  = tareas[t][0];
    var tarea  = tareas[t][1];
    var resp   = tareas[t][2];
    var estado = tareas[t][3];
    var prog   = tareas[t][4];
    var inicio = tareas[t][5];
    var fin    = tareas[t][6];

    if (tArea !== areaActual) {
      sheet.getRange(row, 2).setValue(tArea)
        .setFontWeight('bold').setBackground('#2f75b5').setFontColor('white').setFontSize(12);
      row++;
      areaActual = tArea;
    }
    sheet.getRange(row, 2).setValue(tarea);
    sheet.getRange(row, 3).setValue(resp);
    sheet.getRange(row, 4).setValue(estado);
    sheet.getRange(row, 5).setValue(prog).setNumberFormat('0%');
    sheet.getRange(row, 6).setValue(inicio).setNumberFormat('dd/mm/yyyy');
    sheet.getRange(row, 7).setValue(fin).setNumberFormat('dd/mm/yyyy');
    sheet.getRange(row, 8).setFormula('=IF(AND(F'+row+'<>"",G'+row+'<>""),G'+row+'-F'+row+'+1,"")');
    row++;
  }

  var colorMap = {'Terminado':'#00b050','Abierto':'#4f81bd','Reproceso':'#c00000','En pausa':'#ffc000'};
  var timelineDates = sheet.getRange(5, 9, 1, 200).getValues()[0];
  for (var i = 9; i < row; i++) {
    var ini  = sheet.getRange(i, 6).getValue();
    var fin2 = sheet.getRange(i, 7).getValue();
    var col  = colorMap[sheet.getRange(i, 4).getValue()] || '#d9d9d9';
    if (!ini || !fin2) continue;
    for (var c = 0; c < timelineDates.length; c++) {
      if (timelineDates[c] >= ini && timelineDates[c] <= fin2) {
        sheet.getRange(i, 9+c).setBackground(col);
      }
    }
  }

  sheet.getRange('E:E').setNumberFormat('0%');
  sheet.getRange('F:G').setNumberFormat('dd/mm/yyyy');
  sheet.autoResizeColumns(2, 8);
  SpreadsheetApp.getUi().alert('✅ OP ' + opSeleccionada + ' cargada correctamente.');
}

// ============================================================
//  HELPERS
// ============================================================
function _getNombreMes() {
  var meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  return meses[new Date().getMonth()];
}

function _limpiarFormulario(form) {
  var celdas = ['C3','C4','C5','C6','C7','C8'];
  if (_tieneCampoFecha(form)) celdas.push('C' + FILA_FECHA_ENTREGA);   // v8
  for (var i = 0; i < celdas.length; i++) {
    form.getRange(celdas[i]).clearContent();
  }
  var areaNames = Object.keys(AREAS_FILAS);
  for (var a = 0; a < areaNames.length; a++) {
    form.getRange(_filaArea(form, areaNames[a]), 3).setValue(false);
  }
}
// ====================== FUNCIÓN AUXILIAR PARA RESUMEN ======================

function setSubSummaryFormulas(sheet, startRow, taskCount, k) {
  var endRow = startRow + taskCount - 1;
  k = k || 0;                                   // v8: corrimiento del bloque PLANEADO
  var AE = _colLetra(31 + k);

  // % EJECUCIÓN SUBESTRUCTURA
  sheet.getRange(startRow, 18)
       .setFormula('=SUM(Q' + startRow + ':Q' + endRow + ')');

  // DURACIÓN REAL
  sheet.getRange(startRow, 24)
       .setFormula('=SUM(V' + startRow + ':V' + endRow + ')');

  // % TAREA REAL
  sheet.getRange(startRow, 25)
       .setFormula('=100%/SUM(V' + startRow + ':V' + endRow + ')');

  // DURACIÓN PLANEADA
  sheet.getRange(startRow, 33 + k)
       .setFormula('=SUM(' + AE + startRow + ':' + AE + endRow + ')');

  // % TAREA PLANEADA
  sheet.getRange(startRow, 34 + k)
       .setFormula('=100%/SUM(' + AE + startRow + ':' + AE + endRow + ')');
}
// ===========================================================================

// ============================================================
//  v8 — FECHA DE ENTREGA AL CLIENTE
// ============================================================

/** Crea (una sola vez) la fila "Fecha de entrega al cliente" debajo de "Agregar subestructuras". */
function agregarCampoFechaEntrega() {
  var ss   = SpreadsheetApp.getActiveSpreadsheet();
  var form = ss.getSheetByName('BASE_CREADOR');
  var ui   = SpreadsheetApp.getUi();
  if (!form) { ui.alert('❌ No se encontró la hoja "BASE_CREADOR".'); return; }
  if (_tieneCampoFecha(form)) { ui.alert('✅ El campo "Fecha de entrega al cliente" ya existe en la fila ' + FILA_FECHA_ENTREGA + '.'); return; }

  var etqSubs = _norm(form.getRange(FILA_FECHA_ENTREGA - 1, 2).getValue());
  if (etqSubs.indexOf('SUBESTRUCTURA') === -1) {
    ui.alert('❌ Esperaba "Agregar subestructuras" en B' + (FILA_FECHA_ENTREGA - 1) + ' y no lo encontré.\nRevisa la hoja antes de continuar.');
    return;
  }

  form.insertRowAfter(FILA_FECHA_ENTREGA - 1);
  var f = FILA_FECHA_ENTREGA;
  form.getRange(f - 1, 2, 1, 3).copyFormatToRange(form, 2, 4, f, f);   // mismo estilo que la fila de arriba
  form.getRange(3, 4).copyTo(form.getRange(f, 4), { formatOnly: true }); // estilo amarillo "Obligatorio"

  form.getRange(f, 2).setValue('Fecha de entrega al cliente:');
  var celda = form.getRange(f, 3);
  celda.clearDataValidations().clearContent();
  celda.setDataValidation(SpreadsheetApp.newDataValidation()
    .requireDate().setAllowInvalid(false)
    .setHelpText('Doble clic para escoger la fecha en el calendario').build());
  celda.setNumberFormat('dd/mm/yyyy').setHorizontalAlignment('center');
  form.getRange(f, 4).setValue('⚠ Obligatorio');

  ui.alert('✅ Campo creado en la fila ' + f + '.\nDoble clic en C' + f + ' para escoger la fecha en el calendario.');
}

function _tieneCampoFecha(form) {
  return _norm(form.getRange(FILA_FECHA_ENTREGA, 2).getValue()).indexOf('FECHA DE ENTREGA') !== -1;
}

/** Fila real del checkbox de un área (se corre +1 si existe el campo de fecha). */
function _filaArea(form, area) {
  // v13: primero se busca la casilla por el NOMBRE del área en la columna B
  //      (así la lista se puede reordenar); si no se encuentra, fila original.
  var f = _filaAreaPorNombre(form, area);
  if (f) return f;
  return AREAS_FILAS[area] + (_tieneCampoFecha(form) ? 1 : 0);
}

/** v13: fila de la lista de chequeo cuyo texto (col B) corresponde al área, o 0. */
function _filaAreaPorNombre(form, area) {
  var r = _rangoListaAreas(form);
  if (!r) return 0;
  var et = form.getRange(r.ini, 2, r.fin - r.ini + 1, 1).getValues();
  var buscado = _norm(area);
  for (var i = 0; i < et.length; i++) {
    if (_norm(et[i][0]).replace(/[^A-Z ]/g, '').trim() === buscado) return r.ini + i;
  }
  return 0;
}

/** v13: filas que ocupa la lista de chequeo de áreas (según AREAS_FILAS + corrimiento). */
function _rangoListaAreas(form) {
  var filas = Object.keys(AREAS_FILAS).map(function(a) { return AREAS_FILAS[a]; });
  var d = _tieneCampoFecha(form) ? 1 : 0;
  return { ini: Math.min.apply(null, filas) + d, fin: Math.max.apply(null, filas) + d };
}

/**
 * v13 — Menú "🔀 Ordenar lista de áreas": reescribe los nombres de la lista de
 * chequeo de BASE_CREADOR en el orden de ORDEN_AREAS y desmarca las casillas.
 * No toca ninguna otra celda; las casillas se siguen leyendo por nombre.
 */
function ordenarListaAreas() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), ui = SpreadsheetApp.getUi();
  var form = ss.getSheetByName('BASE_CREADOR');
  if (!form) { ui.alert('❌ No se encontró la hoja "BASE_CREADOR".'); return; }
  if (_opEnEdicion()) { ui.alert('⚠ Hay una O.P en edición. Guarda o cancela la edición antes de ordenar la lista.'); return; }
  var r = _rangoListaAreas(form), n = r.fin - r.ini + 1;
  var et = form.getRange(r.ini, 2, n, 1).getValues();
  // Texto actual de cada área (se conserva tal cual, solo cambia de fila)
  var texto = {};
  Object.keys(AREAS_FILAS).forEach(function(a) {
    for (var i = 0; i < n; i++) {
      if (_norm(et[i][0]).replace(/[^A-Z ]/g, '').trim() === _norm(a)) { texto[a] = et[i][0]; return; }
    }
  });
  var faltan = Object.keys(AREAS_FILAS).filter(function(a) { return !texto[a]; });
  if (faltan.length) { ui.alert('❌ No encontré en la lista de chequeo: ' + faltan.join(', ') + '.\nNo se cambió nada.'); return; }
  var orden = _ordenarAreas(Object.keys(AREAS_FILAS).slice());
  if (orden.length !== n) { ui.alert('❌ La lista tiene ' + n + ' filas y hay ' + orden.length + ' áreas. No se cambió nada.'); return; }
  form.getRange(r.ini, 2, n, 1).setValues(orden.map(function(a) { return [texto[a]]; }));
  form.getRange(r.ini, 3, n, 1).setValue(false);
  ui.alert('✅ Lista de áreas ordenada:\n' + orden.join(' → '));
}

/**
 * Busca "OBSERVACIONES" en los encabezados (filas 1–5) del Cronograma del área
 * y devuelve la columna siguiente, creándola con el título FECHA ENTREGA CLIENTE.
 * - Si la columna ya existe, la reutiliza.
 * - Si la columna después de OBSERVACIONES está libre, la usa.
 * - Si está ocupada, inserta una columna nueva (solo si no mueve las columnas
 *   1–36 que llena el script; si las movería, avisa en vez de dañar la hoja).
 */
function _columnaFechaEntrega(tSheet) {
  var maxCol = tSheet.getLastColumn();
  var filasEnc = Math.min(5, Math.max(tSheet.getLastRow(), 1));
  var enc = tSheet.getRange(1, 1, filasEnc, maxCol).getDisplayValues();
  var obsFila = -1, obsCol = -1;

  for (var r = 0; r < enc.length; r++) {
    for (var c = 0; c < enc[r].length; c++) {
      var t = _norm(enc[r][c]);
      if (t === _norm(ETQ_FECHA_CRONO)) return c + 1;                 // ya existe
      if (obsCol === -1 && t.indexOf('OBSERVACION') === 0) { obsFila = r + 1; obsCol = c + 1; }
    }
  }
  if (obsCol === -1) throw new Error('No encontré la columna OBSERVACIONES en el encabezado del Cronograma');

  var col = obsCol + 1;
  var ocupada = col <= maxCol && enc[obsFila - 1][col - 1] !== '';
  if (ocupada) {
    // Solo es seguro insertar antes del bloque PLANEADO (col AD=30) o después de él (col 36+):
    // en ambos casos el script se ajusta solo con _offsetPlaneado().
    if (col > 30 && col <= 36) throw new Error('OBSERVACIONES está en la col ' + obsCol + ', dentro del bloque PLANEADO; no se puede insertar ahí');
    tSheet.insertColumnAfter(obsCol);
  }
  tSheet.getRange(obsFila, obsCol).copyTo(tSheet.getRange(obsFila, col), { formatOnly: true });
  tSheet.getRange(obsFila, col).setValue(ETQ_FECHA_CRONO);
  tSheet.setColumnWidth(col, 130);
  return col;
}

function _esFecha(v) {
  return v instanceof Date && !isNaN(v.getTime()) && v.getFullYear() > 1900;
}

function _parseFecha(txt) {
  var m = String(txt).match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (!m) return null;
  var d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return (d.getDate() === Number(m[1]) && d.getMonth() === Number(m[2]) - 1) ? d : null;
}

function _fmtFecha(v) {
  if (!_esFecha(v)) return '(sin fecha)';
  return Utilities.formatDate(v, Session.getScriptTimeZone(), 'dd/MM/yyyy');
}

function _norm(v) {
  return String(v == null ? '' : v).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase().replace(/\s+/g, ' ').trim();
}

/** Corrimiento del bloque PLANEADO: 0 si FECHA_INICIO_TAREA_PLANEADO está en AD (30), 1 si en AE, etc. */
function _offsetPlaneado(tSheet) {
  var enc = tSheet.getRange(1, 1, Math.min(5, Math.max(tSheet.getLastRow(), 1)), tSheet.getLastColumn()).getDisplayValues();
  var idx = _idxEncabezado(enc, 'FECHA_INICIO_TAREA_PLANEADO', 29);
  return idx - 29;
}

/** Índice (0-based) de un encabezado buscado en las primeras 5 filas; si no está, devuelve `porDefecto`. */
function _idxEncabezado(data, nombre, porDefecto) {
  var objetivo = _norm(nombre);
  for (var r = 0; r < Math.min(5, data.length); r++) {
    for (var c = 0; c < data[r].length; c++) {
      if (_norm(String(data[r][c]).split('\n')[0]) === objetivo) return c;
    }
  }
  return porDefecto;
}

function _colLetra(n) {
  var s = '';
  while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

// ============================================================
//  v9 — REGISTRO DE CAMBIOS
// ============================================================
function _nuevoRegistro(op) {
  var filas = [], usuario = _usuario(), ahora = new Date();
  return {
    add: function(origen, area, sub, tarea, campo, antes, despues) {
      filas.push([ahora, usuario, String(op), origen || '', area || '', sub || '', tarea || '',
                  campo || '', _fmtLog(antes), _fmtLog(despues)]);
    },
    guardar: function(ss) { _escribirRegistro(ss, filas); },
    n: function() { return filas.length; }
  };
}

function _escribirRegistro(ss, filas) {
  if (!filas || !filas.length) return;
  var sh = ss.getSheetByName(HOJA_REGISTRO);
  if (!sh) {
    sh = ss.insertSheet(HOJA_REGISTRO);
    var enc = ['FECHA_HORA', 'USUARIO', 'OP', 'ORIGEN', 'AREA', 'SUBESTRUCTURA', 'TAREA',
               'CAMPO', 'VALOR_ANTERIOR', 'VALOR_NUEVO'];
    sh.getRange(1, 1, 1, enc.length).setValues([enc])
      .setBackground('#2F75B5').setFontColor('#FFFFFF').setFontWeight('bold');
    sh.setFrozenRows(1);
    sh.setColumnWidth(1, 140); sh.setColumnWidth(2, 190); sh.setColumnWidth(4, 170);
    sh.setColumnWidth(6, 150); sh.setColumnWidth(7, 180); sh.setColumnWidth(8, 210);
    sh.setColumnWidth(9, 180); sh.setColumnWidth(10, 180);
    try { sh.protect().setDescription('Registro de cambios (solo lo escribe el script)').setWarningOnly(true); } catch (_) {}
  }
  var desde = sh.getLastRow() + 1;
  sh.getRange(desde, 1, filas.length, filas[0].length).setValues(filas);
  sh.getRange(desde, 1, filas.length, 1).setNumberFormat('dd/mm/yyyy hh:mm');
}

function verRegistroCambios() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(HOJA_REGISTRO);
  if (!sh) { SpreadsheetApp.getUi().alert('Todavía no hay cambios registrados.'); return; }
  ss.setActiveSheet(sh);
  sh.setActiveRange(sh.getRange(Math.max(sh.getLastRow(), 1), 1));
}

function _usuario() {
  var e = '';
  try { e = Session.getActiveUser().getEmail(); } catch (_) {}
  if (!e) { try { e = Session.getEffectiveUser().getEmail(); } catch (_) {} }
  return e || 'desconocido';
}

function _fmtLog(v) {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return _esFecha(v) ? Utilities.formatDate(v, Session.getScriptTimeZone(), 'dd/MM/yyyy') : '';
  if (typeof v === 'number') return String(Math.round(v * 10000) / 10000);
  return String(v);
}

/** Compara valores de celda: fechas por día, números con tolerancia, texto sin espacios extra. */
function _mismoValor(a, b) {
  var vacio = function(x) { return x === '' || x === null || x === undefined; };
  if (vacio(a) && vacio(b)) return true;
  if (a instanceof Date || b instanceof Date) return _fmtLog(a) === _fmtLog(b);
  var na = (typeof a === 'number') ? a : (String(a).trim() !== '' && !isNaN(Number(a)) ? Number(a) : null);
  var nb = (typeof b === 'number') ? b : (String(b).trim() !== '' && !isNaN(Number(b)) ? Number(b) : null);
  if (na !== null && nb !== null) return Math.abs(na - nb) < 1e-6;
  return String(a).trim() === String(b).trim();
}


// ============================================================
//  v9.1 — PERMISOS PARA ABRIR LOS ARCHIVOS DE LAS ÁREAS
// ============================================================
var _SCOPE_SHEETS = 'https://www.googleapis.com/auth/spreadsheets';
var _MSG_PERMISOS =
  'El script no tiene permiso para abrir los cronogramas de las áreas (son otros archivos).\n\n' +
  '1. Extensiones > Apps Script.\n' +
  '2. Revisa que ningún archivo tenga la anotación de "solo documento actual".\n' +
  '3. En appsscript.json, si hay "oauthScopes", debe incluir\n   ' + _SCOPE_SHEETS + '\n   (no ".currentonly").\n' +
  '4. Escoge la función onOpen > Ejecutar, y en la ventana de Google MARCA TODAS las casillas,\n' +
  '   en especial "Ver, editar, crear y eliminar todas tus hojas de cálculo".\n' +
  '5. Vuelve a enviar la OP.';

function _esErrorPermiso(msg) {
  return /permiso|permission|authorization|autoriza/i.test(String(msg || ''));
}

/** Error de Drive: la cuenta no puede abrir ese archivo (no está compartido o el ID no existe). */
function _esErrorAccesoArchivo(msg) {
  var m = String(msg || '');
  if (/auth\/spreadsheets|permisos especificados|specified permissions/i.test(m)) return false;   // eso es de autorización
  return /acceder al documento|access the requested document|no existe|does not exist|not found|no se encontr/i.test(m);
}

function _msgSinAcceso(areas) {
  return 'Tu cuenta (' + _usuario() + ') no puede abrir el cronograma de:\n\n• ' + areas.join('\n• ') + '\n\n' +
    'El envío usa la cuenta de quien pulsa el botón, así que cada persona que envía O.P necesita ' +
    'acceso de EDITOR a los archivos PLANTILLA_LOOKER_… de esas áreas.\n\n' +
    'Pídele al dueño de los archivos que los comparta contigo como Editor ' +
    '(lo más fácil: compartir la carpeta PLANTILLA_GENERAL completa).\n\n' +
    'Luego vuelve a intentar. Puedes revisar el acceso con  Torre de Control > 🔐 Autorizar / probar acceso a las áreas.';
}

/**
 * Pide (si hace falta) el permiso de hojas de cálculo completo.
 * Con el consentimiento "por casillas" de Google, ScriptApp.requireScopes
 * muestra la ventana de autorización y detiene la ejecución hasta aceptar.
 */
function _verificarPermisoAreas() {
  // SIN try/catch: si falta algún permiso, Google detiene aquí y muestra
  // su ventana "Se requiere autorización". (Atraparlo impedía que saliera.)
  if (typeof ScriptApp.requireAllScopes === 'function') {
    ScriptApp.requireAllScopes(ScriptApp.AuthMode.FULL);
  }
  return true;
}


/**
 * v9.2 — Ejecútala UNA VEZ desde el editor (o el menú 🔐).
 * Pide el permiso completo de hojas de cálculo y prueba abrir el archivo
 * de cada área. El resultado queda en el Registro de ejecución y, si se
 * corre desde la hoja, también en una ventana.
 */
function autorizarAreas() {
  // Sin try/catch a propósito: si falta un permiso, Google detiene aquí y muestra la ventana de autorización
  _verificarPermisoAreas();
  var lineas = [];
  var nombres = Object.keys(IDS_AREAS);
  for (var i = 0; i < nombres.length; i++) {
    var area = nombres[i], id = IDS_AREAS[area];
    try {
      var archivo = SpreadsheetApp.openById(id);
      var crono   = archivo.getSheetByName('Cronograma');
      lineas.push('✅ ' + area + ': ' + archivo.getName() + (crono ? '' : '  ⚠️ (no tiene hoja "Cronograma")'));
    } catch (e) {
      lineas.push('❌ ' + area + ': ' + (_esErrorAccesoArchivo(e.message)
        ? 'sin acceso de Editor con ' + _usuario() + ' (compartir el archivo con esta cuenta)'
        : e.message));
    }
  }
  lineas.forEach(function(l) { Logger.log(l); });
  try {
    SpreadsheetApp.getUi().alert('🔐 Acceso a los archivos de las áreas', lineas.join('\n'), SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (_) { /* desde el editor no hay ventana: ver Registro de ejecución */ }
}


// ============================================================
//  v11 — CORREO "SE CREÓ UNA NUEVA O.P"
//  Lo envía el HOSTING (notificar_op.php), no la cuenta de quien
//  crea la O.P. Los destinatarios se configuran en notificar_op.php.
// ============================================================
var URL_NOTIFICAR_OP = 'https://torredecontrol.polypro.space/torre_de_control_v2/notificar_op.php';
var TOKEN_CORREO     = 'CONFIGURAR_AQUI';   // igual que 'TOKEN' en notificar_op.php
var CORREO_ACTIVO    = true;                   // false = no enviar correos

/** Envía el aviso. Devuelve un texto corto para mostrar al usuario (o '' si está apagado). */
function _notificarNuevaOP(d, urlHoja) {
  if (!CORREO_ACTIVO) return '';
  if (URL_NOTIFICAR_OP.indexOf('TU-DOMINIO') !== -1) return 'ℹ️ Correo no enviado: falta configurar URL_NOTIFICAR_OP.';
  try {
    var resp = UrlFetchApp.fetch(URL_NOTIFICAR_OP, {
      method: 'post',
      contentType: 'application/json',
      muteHttpExceptions: true,
      payload: JSON.stringify({
        token:        TOKEN_CORREO,
        op:           d.op,
        nombre:       d.nombreOp,
        cliente:      d.cliente,
        comercial:    d.comercial,
        sede:         d.sede,
        subs:         d.numSubs,
        fechaEntrega: _esFecha(d.fechaEntrega) ? Utilities.formatDate(d.fechaEntrega, Session.getScriptTimeZone(), 'dd/MM/yyyy') : '',
        areas:        d.areas,
        creador:      _usuario(),
        urlHoja:      urlHoja || ''
      })
    });
    var r = {};
    try { r = JSON.parse(resp.getContentText()); } catch (_) {}
    if (resp.getResponseCode() === 200 && r.ok) return '✉️ ' + (r.mensaje || 'Correo enviado');
    return '⚠️ No se envió el correo: ' + (r.mensaje || ('HTTP ' + resp.getResponseCode()));
  } catch (e) {
    return '⚠️ No se envió el correo: ' + e.message;
  }
}

/** Menú ✉️: envía un correo de prueba (y pide el permiso de conexión externa la primera vez). */
function probarCorreoNuevaOP() {
  if (typeof ScriptApp.requireAllScopes === 'function') ScriptApp.requireAllScopes(ScriptApp.AuthMode.FULL);
  var hoy = new Date(); hoy.setDate(hoy.getDate() + 20);
  var res = _notificarNuevaOP({
    op: 'PRUEBA', nombreOp: 'Correo de prueba — Torre de Control', cliente: 'Cliente de prueba',
    comercial: 'Comercial de prueba', sede: 'BOGOTÁ', numSubs: 2, fechaEntrega: hoy,
    areas: ['Administración', 'Diseño', 'Dibujo', 'Compras', 'Produccion', 'Galvanizado', 'Logistica', 'Montaje']
  }, SpreadsheetApp.getActiveSpreadsheet().getUrl());
  Logger.log(res);
  try { SpreadsheetApp.getUi().alert('✉️ Prueba de correo', res || 'El correo está desactivado (CORREO_ACTIVO = false).', SpreadsheetApp.getUi().ButtonSet.OK); } catch (_) {}
}


/** Menú 📨: envía el aviso de una O.P que ya existe (p. ej. las creadas antes de v11). */
function reenviarCorreoOP() {
  if (typeof ScriptApp.requireAllScopes === 'function') ScriptApp.requireAllScopes(ScriptApp.AuthMode.FULL);
  var ss = SpreadsheetApp.getActiveSpreadsheet(), ui = SpreadsheetApp.getUi();
  var activa = ss.getActiveSheet();
  var sugerida = _esHojaOP(activa) ? activa.getName() : '';
  var pr = ui.prompt('📨 Reenviar correo de O.P',
    'Escribe el número de la O.P (o varias separadas por coma):' + (sugerida ? '\n(Hoja actual: ' + sugerida + ')' : ''),
    ui.ButtonSet.OK_CANCEL);
  if (pr.getSelectedButton() !== ui.Button.OK) return;
  var lista = (pr.getResponseText().trim() || sugerida).split(',').map(function(x) { return x.trim(); }).filter(String);
  if (!lista.length) return;
  var res = [];
  lista.forEach(function(op) {
    var ws = ss.getSheetByName(op);
    if (!_esHojaOP(ws)) { res.push('❌ ' + op + ': no encontré la hoja de esa O.P'); return; }
    var m = _leerMetaOP(ws);
    var r = _notificarNuevaOP({
      op: m.op, nombreOp: m.nombreOp, cliente: m.cliente, comercial: m.comercial, sede: m.sede,
      numSubs: m.numSubs, fechaEntrega: m.fecha, areas: m.areas
    }, ss.getUrl() + '#gid=' + ws.getSheetId());
    res.push(op + ': ' + r);
  });
  ui.alert('📨 Resultado', res.join('\n'), ui.ButtonSet.OK);
}


// ============================================================
//  v14 — TAREAS QUE NO APLICAN Y NOMBRE DE TAREA POR OP
// ============================================================
//  Solo Comercial decide, desde el menú "🧩 Tareas de la OP":
//   • ☐ No aplica: la tarea queda en su fila (no se rompe la estructura), en el
//     área pasa a ESTADO "No aplica", su % de aporte queda en 0 y su peso se
//     REPARTE proporcionalmente entre las tareas que sí aplican de esa
//     subestructura → al terminarlas, la subestructura llega a 100%.
//   • ✏️ Nombre en esta OP: cambia el texto que ven las áreas solo en esa OP.
//     Por dentro la tarea conserva su nombre original (pesos, Assignees and
//     Status, fechas y KG no se pierden).
//  Se guarda en la hoja de la OP, celda META AM1 (col 39), y llega a las
//  áreas con "📤 Enviar / Actualizar OP en Áreas". Todo queda en REGISTRO_CAMBIOS.
// ------------------------------------------------------------
var COL_META_TAREAS = 39;                       // hoja OP: col AM = tareas No aplica / nombres
var ESTADO_NO_APLICA = 'No aplica';
var NO_RENOMBRAR = { 'Produccion': ['Entrega en negro'] };   // Producción V2 la busca por nombre

function _leerMetaTareas(ws) {
  _asegurarColumnas(ws, COL_META_TAREAS);
  var txt = String(ws.getRange(1, COL_META_TAREAS).getValue() || '').trim();
  var m = { na: [], nom: {}, ant: {} };
  if (!txt) return m;
  try { var j = JSON.parse(txt); m.na = j.na || []; m.nom = j.nom || {}; m.ant = j.ant || {}; } catch (e) {}
  return m;
}

function _guardarMetaTareas(ws, m) {
  _asegurarColumnas(ws, COL_META_TAREAS);
  // ant = nombres que se usaron antes en esta OP (para poder volver al original en las áreas)
  var vacio = !m.na.length && !Object.keys(m.nom).length && !Object.keys(m.ant || {}).length;
  ws.getRange(1, COL_META_TAREAS).setValue(vacio ? '' : JSON.stringify({ na: m.na, nom: m.nom, ant: m.ant || {} }));
}

/** Estructura de tareas de la OP: [{area, s, t, clave, original, sub}] */
function _estructuraTareasOP(ws) {
  var meta = _leerMetaOP(ws), datos = _leerDatosHojaOP(ws), out = [], offset = 0;
  meta.areas.forEach(function(area) {
    var tareas = TAREAS_AREA[area] || TAREAS_AREA['Diseño'], T = tareas.length;
    var nSubs = AREAS_GENERALES.indexOf(area) !== -1 ? 1 : meta.numSubs;
    for (var s = 0; s < nSubs; s++) {
      var d0 = datos[offset + s * T];
      var sub = (d0 && String(d0.nombreSub || '').trim()) || ('Nombre ' + (s + 1));
      for (var t = 0; t < T; t++) out.push({ area: area, s: s, t: t, clave: area + '|' + s + '|' + t, original: tareas[t][0], sub: sub });
    }
    offset += nSubs * T;
  });
  return out;
}

/** Menú: abre la ventana para marcar "No aplica" y renombrar tareas de la OP activa. */
function abrirTareasOP() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), ui = SpreadsheetApp.getUi();
  var ws = ss.getActiveSheet();
  if (!_esHojaOP(ws)) {
    var pr = ui.prompt('🧩 Tareas de la OP', 'Escribe el número de la OP (o abre su hoja antes de usar el menú):', ui.ButtonSet.OK_CANCEL);
    if (pr.getSelectedButton() !== ui.Button.OK) return;
    ws = ss.getSheetByName(pr.getResponseText().trim());
    if (!_esHojaOP(ws)) { ui.alert('❌ No encontré la hoja de esa OP.'); return; }
  }
  if (_opEnEdicion() === ws.getName()) { ui.alert('⚠ La OP ' + ws.getName() + ' está en edición. Guarda o cancela la edición primero.'); return; }
  var meta = _leerMetaTareas(ws), est = _estructuraTareasOP(ws);
  var datos = { op: ws.getName(), filas: est.map(function(x) {
    return { clave: x.clave, area: x.area, s: x.s, sub: x.sub, original: x.original,
             na: meta.na.indexOf(x.clave) !== -1, nombre: meta.nom[x.clave] || '',
             fijo: (NO_RENOMBRAR[x.area] || []).indexOf(x.original) !== -1 };
  }) };
  var html = HtmlService.createHtmlOutput(_htmlTareasOP(datos)).setWidth(760).setHeight(600);
  ui.showModalDialog(html, '🧩 Tareas de la OP ' + datos.op);
}

function _htmlTareasOP(datos) {
  var esc = function(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  var grupos = [], ult = '';
  datos.filas.forEach(function(f) {
    var g = f.area + '|' + f.s;
    if (g !== ult) { grupos.push({ area: f.area, sub: f.sub, filas: [] }); ult = g; }
    grupos[grupos.length - 1].filas.push(f);
  });
  var cuerpo = grupos.map(function(g) {
    return '<div class="g"><div class="gh"><b>' + esc(g.area) + '</b><span>' + esc(g.sub) + '</span></div>' +
      g.filas.map(function(f) {
        return '<div class="f' + (f.na ? ' na' : '') + '" data-c="' + esc(f.clave) + '">' +
          '<label class="chk"><input type="checkbox" class="cna"' + (f.na ? ' checked' : '') + '> No aplica</label>' +
          '<span class="ori">' + esc(f.original) + '</span>' +
          (f.fijo ? '<span class="fijo">nombre fijo (Producción V2)</span>'
                  : '<input class="nom" maxlength="60" placeholder="Nombre en esta OP (opcional)" value="' + esc(f.nombre) + '">') +
        '</div>';
      }).join('') + '</div>';
  }).join('');
  return '<!DOCTYPE html><html><head><base target="_top"><style>' +
    'body{font-family:Arial,sans-serif;margin:0;color:#2b2b40;font-size:13px}' +
    '.top{padding:10px 14px;background:#f1edfe;border-bottom:1px solid #e3dcfd;font-size:12px;line-height:1.5}' +
    '.lst{padding:10px 14px;height:440px;overflow:auto}.g{border:1px solid #edeef5;border-radius:10px;margin-bottom:10px;overflow:hidden}' +
    '.gh{background:#f7f7fc;padding:7px 10px;display:flex;gap:10px;align-items:center}.gh span{color:#8f9bb3;font-size:12px}' +
    '.f{display:flex;gap:10px;align-items:center;padding:6px 10px;border-top:1px solid #f2f2f7}.f.na .ori{text-decoration:line-through;color:#8f9bb3}' +
    '.chk{white-space:nowrap;font-size:12px;color:#5a5a72;width:92px}.ori{flex:0 0 220px}.nom{flex:1;padding:5px 8px;border:1px solid #dcdce8;border-radius:6px;font-size:12px}' +
    '.fijo{flex:1;color:#8f9bb3;font-size:11px;font-style:italic}.bar{padding:10px 14px;border-top:1px solid #edeef5;display:flex;gap:8px;justify-content:flex-end;align-items:center}' +
    'button{border:0;border-radius:18px;padding:8px 16px;font-weight:bold;cursor:pointer}.pri{background:#7c5cfc;color:#fff}.sec{background:#edeef5;color:#2b2b40}' +
    '#msg{flex:1;font-size:12px;color:#5a5a72}' +
    '</style></head><body>' +
    '<div class="top">☐ <b>No aplica</b>: la tarea no se hace en este contrato. Su peso se reparte entre las demás tareas de la subestructura y en el área queda en estado "No aplica".<br>' +
    '✏️ <b>Nombre en esta OP</b>: cambia solo el texto que ven las áreas en esta OP (vacío = nombre original).</div>' +
    '<div class="lst">' + cuerpo + '</div>' +
    '<div class="bar"><span id="msg"></span><button class="sec" onclick="google.script.host.close()">Cancelar</button>' +
    '<button class="pri" id="btn" onclick="guardar()">💾 Guardar</button></div>' +
    '<script>' +
    'document.querySelectorAll(".cna").forEach(function(c){c.addEventListener("change",function(){c.closest(".f").classList.toggle("na",c.checked);});});' +
    'function guardar(){var na=[],nom={};document.querySelectorAll(".f").forEach(function(f){var k=f.getAttribute("data-c");if(f.querySelector(".cna").checked)na.push(k);var n=f.querySelector(".nom");if(n&&n.value.trim())nom[k]=n.value.trim();});' +
    'document.getElementById("btn").disabled=true;document.getElementById("msg").textContent="Guardando...";' +
    'google.script.run.withSuccessHandler(function(r){document.getElementById("msg").textContent=r.msg;if(r.ok){document.getElementById("btn").textContent="📤 Enviar a las áreas";document.getElementById("btn").disabled=false;document.getElementById("btn").onclick=function(){google.script.run.enviarOPDesdeTareas(' + JSON.stringify(datos.op) + ');google.script.host.close();};}else{document.getElementById("btn").disabled=false;}})' +
    '.withFailureHandler(function(e){document.getElementById("msg").textContent="❌ "+e.message;document.getElementById("btn").disabled=false;}).guardarTareasOP(' + JSON.stringify(datos.op) + ',{na:na,nom:nom});}' +
    '</script></body></html>';
}

/** Llamada desde la ventana: guarda No aplica / nombres en la hoja de la OP. */
function guardarTareasOP(op, nuevo) {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), ws = ss.getSheetByName(op);
  if (!_esHojaOP(ws)) throw new Error('No encontré la hoja de la OP ' + op);
  var est = _estructuraTareasOP(ws), porClave = {};
  est.forEach(function(x) { porClave[x.clave] = x; });
  var na = (nuevo.na || []).filter(function(k) { return porClave[k]; });
  var nom = {};
  Object.keys(nuevo.nom || {}).forEach(function(k) {
    var x = porClave[k], n = String(nuevo.nom[k] || '').trim().slice(0, 60);
    if (!x || !n || n === x.original) return;
    if ((NO_RENOMBRAR[x.area] || []).indexOf(x.original) !== -1) return;
    nom[k] = n;
  });
  // Al menos una tarea debe aplicar en cada subestructura
  var porSub = {};
  est.forEach(function(x) { var g = x.area + '|' + x.s; porSub[g] = porSub[g] || { tot: 0, na: 0, area: x.area, sub: x.sub }; porSub[g].tot++; if (na.indexOf(x.clave) !== -1) porSub[g].na++; });
  var todas = Object.keys(porSub).filter(function(g) { return porSub[g].na === porSub[g].tot; });
  if (todas.length) return { ok: false, msg: '❌ Debe aplicar al menos una tarea en: ' + todas.map(function(g) { return porSub[g].area + ' · ' + porSub[g].sub; }).join(', ') + '. Si el área completa no aplica, quítala de la OP con Editar OP.' };

  var viejo = _leerMetaTareas(ws), reg = _nuevoRegistro(op);
  est.forEach(function(x) {
    var a = viejo.na.indexOf(x.clave) !== -1, b = na.indexOf(x.clave) !== -1;
    if (a !== b) reg.add('Tareas de la OP', x.area, x.sub, x.original, 'No aplica', a ? 'Sí' : 'No', b ? 'Sí' : 'No');
    var na1 = viejo.nom[x.clave] || '', nb1 = nom[x.clave] || '';
    if (na1 !== nb1) reg.add('Tareas de la OP', x.area, x.sub, x.original, 'Nombre en esta OP', na1 || x.original, nb1 || x.original);
  });
  if (!reg.n()) return { ok: true, msg: 'Sin cambios.' };
  var ant = viejo.ant || {};
  Object.keys(viejo.nom).forEach(function(k) { ant[k] = (ant[k] || []); if (ant[k].indexOf(viejo.nom[k]) === -1) ant[k].push(viejo.nom[k]); });
  _guardarMetaTareas(ws, { na: na, nom: nom, ant: ant });
  _formatoTareasOP(ws);
  reg.guardar(ss);
  var env = _leerMetaOP(ws).enviadas.length;
  return { ok: true, msg: '✅ ' + reg.n() + ' cambio/s guardados.' + (env ? ' Para que las áreas los vean, envía la OP.' : '') };
}

function enviarOPDesdeTareas(op) {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), ws = ss.getSheetByName(op);
  if (_esHojaOP(ws)) _sincronizarOPConAreas(ss, ws);
}

/** Hoja OP: col H muestra el nombre en esta OP y las "No aplica" van tachadas en gris. */
function _formatoTareasOP(ws) {
  var meta = _leerMetaTareas(ws), cont = {};
  _recorrerHojaOP(ws, function(fila, area, s, tarea, inicioSub) {
    var g = area + '|' + s;
    cont[g] = inicioSub ? 0 : (cont[g] || 0) + 1;
    var t = cont[g], clave = g + '|' + t, lista = TAREAS_AREA[area];
    if (!lista || !lista[t]) return;
    var original = lista[t][0], deseado = meta.nom[clave] || original;
    var c = ws.getRange(fila, 8), actual = String(c.getValue()).trim();
    var tocable = !!meta.nom[clave] || ((meta.ant || {})[clave] || []).indexOf(actual) !== -1;
    if (tocable && actual !== deseado) c.setValue(deseado);
    var esNA = meta.na.indexOf(clave) !== -1;
    if (esNA || c.getFontLine() === 'line-through')
      ws.getRange(fila, 8, 1, 4).setFontLine(esNA ? 'line-through' : 'none').setFontColor(esNA ? '#9e9e9e' : null);
    var nota = esNA ? 'No aplica en esta OP' : (meta.nom[clave] ? 'Nombre original: ' + original : '');
    if (nota || c.getNote()) c.setNote(nota);
  });
}

/** Nombre original de una fila de la hoja OP (si se renombró en esta OP). */
function _nombreOriginalOP(meta, area, s, t, tarea) {
  var clave = area + '|' + s + '|' + t, lista = TAREAS_AREA[area];
  if (meta && meta.nom[clave] && meta.nom[clave] === tarea && lista && lista[t]) return lista[t][0];
  return tarea;
}

/** Fórmula ORIGINAL de % aporte (col Q) de una tarea — igual que _escribirSub. */
function _formulaAporteBase(area, t, r) {
  var tareas = TAREAS_AREA[area] || TAREAS_AREA['Diseño'];
  var tipo = TIPO_AREA[area] || 'B', asFilas = AS_FILAS[area] || {};
  var c = function(x) { return (x || 0).toString().replace('.', ','); };
  if (tipo === 'A') return { fx: '=IF(P' + r + '="Terminado";' + c(tareas[t][2]) + ';IF(P' + r + '="En pausa";' + c(tareas[t][3]) + ';IF(P' + r + '="Reproceso";' + c(tareas[t][4]) + ';0)))', w: c(tareas[t][2]), setFormula: false };
  var asRow = asFilas[tareas[t][0]] || null;
  if (asRow) return { fx: "='Assignees and Status'!B" + asRow + '%*T' + r, w: "'Assignees and Status'!B" + asRow + '%', setFormula: true };
  return { fx: '=IF(P' + r + '="Terminado";' + c(tareas[t][2]) + ';IF(P' + r + '="En pausa";' + c(tareas[t][3]) + ';0))', w: c(tareas[t][2]), setFormula: false };
}

/**
 * Lleva al Cronograma del área lo marcado en "Tareas de la OP".
 * Si la OP no tiene nada marcado para esta área (y el área no tenía nada de
 * antes), NO toca ninguna celda: comportamiento idéntico a v13.
 */
function _aplicarTareasEnArea(tSheet, area, op, meta, registrar) {
  var blk = _bloqueOP(tSheet, op);
  if (!blk) return 0;
  var tareas = TAREAS_AREA[area] || TAREAS_AREA['Diseño'], T = tareas.length, nSubs = blk.len / T;
  if (nSubs !== Math.floor(nSubs)) return 0;
  var v = tSheet.getRange(blk.start, 1, blk.len, 17).getValues();
  var fx = tSheet.getRange(blk.start, 17, blk.len, 1).getFormulas();
  var ant = meta.ant || {};
  var deArea = function(k) { return k.indexOf(area + '|') === 0; };
  var hayMeta = meta.na.some(deArea) || Object.keys(meta.nom).some(deArea) || Object.keys(ant).some(deArea);
  var hayPrevio = v.some(function(row, i) { return String(row[15]).trim() === ESTADO_NO_APLICA || String(fx[i][0]).indexOf('=IFERROR((') === 0; });
  if (!hayMeta && !hayPrevio) return 0;

  var cambios = 0;
  for (var s = 0; s < nSubs; s++) {
    var sub = op + '_' + (s + 1), filasNA = [], wTodos = [], wNA = [];
    for (var t = 0; t < T; t++) {
      var i = s * T + t, r = blk.start + i, clave = area + '|' + s + '|' + t;
      var esNA = meta.na.indexOf(clave) !== -1, base = _formulaAporteBase(area, t, r);
      wTodos.push(base.w); if (esNA) { wNA.push(base.w); filasNA.push(t); }
      // Nombre que ve el área
      // Solo se toca el nombre si se cambió desde "Tareas de la OP" (nombre actual o uno usado antes)
      var deseado = meta.nom[clave] || tareas[t][0], actualN = String(v[i][13]).trim();
      var tocable = !!meta.nom[clave] || (ant[clave] || []).indexOf(actualN) !== -1;
      if (tocable && actualN !== deseado) { tSheet.getRange(r, 14).setValue(deseado); registrar(area, sub, tareas[t][0], 'DESCRIPCION_TAREAS', v[i][13], deseado); cambios++; }
      // Estado
      var est = String(v[i][15]).trim();
      if (esNA && est !== ESTADO_NO_APLICA) { tSheet.getRange(r, 16).setValue(ESTADO_NO_APLICA); registrar(area, sub, tareas[t][0], 'ESTADO', est, ESTADO_NO_APLICA); cambios++; }
      if (!esNA && est === ESTADO_NO_APLICA) { tSheet.getRange(r, 16).setValue('Abierto'); registrar(area, sub, tareas[t][0], 'ESTADO', est, 'Abierto (vuelve a aplicar)'); cambios++; }
      if (esNA || est === ESTADO_NO_APLICA) tSheet.getRange(r, 14).setFontLine(esNA ? 'line-through' : 'none').setFontColor(esNA ? '#9e9e9e' : null);
    }
    // % aporte: si hay tareas No aplica, su peso se reparte entre las demás
    var envuelta = false;
    for (var t2 = 0; t2 < T; t2++) if (String(fx[s * T + t2][0]).indexOf('=IFERROR((') === 0) envuelta = true;
    if (!filasNA.length && !envuelta) continue;
    var sumTodos = wTodos.join('+'), sumNA = wNA.join('+');
    for (var t3 = 0; t3 < T; t3++) {
      var r3 = blk.start + s * T + t3, b3 = _formulaAporteBase(area, t3, r3), celda = tSheet.getRange(r3, 17);
      if (filasNA.indexOf(t3) !== -1) celda.setValue(0);
      else if (filasNA.length) celda.setValue('=IFERROR((' + b3.fx.slice(1) + ')*(' + sumTodos + ')/((' + sumTodos + ')-(' + sumNA + '));0)');
      else if (b3.setFormula) celda.setFormula(b3.fx);
      else celda.setValue(b3.fx);
      celda.setNumberFormat('0.00%');
    }
    registrar(area, sub, '', '%_APORTE_TAREA', '', filasNA.length ? 'peso repartido (' + filasNA.length + ' tarea/s No aplica)' : 'pesos originales');
    cambios++;
  }
  return cambios;
}


// ============================================================
//  v14 — CUMPLIMIENTO DE ENTREGA AL CLIENTE
// ============================================================
//  Por cada OP:
//   • FECHA_ORIGINAL : la que se puso al CREAR la OP (no se sobrescribe nunca).
//   • FECHA_VIGENTE  : la última acordada con el cliente (Editar OP). Cada cambio
//                      es una REPROGRAMACIÓN con motivo obligatorio.
//   • FECHA_REAL     : cuándo se entregó. La registra Comercial con el menú
//                      "🚚 Registrar entrega real". Queda fija (solo un usuario
//                      autorizado la corrige, y queda registrado).
//  La Maestra lee estas hojas y la App calcula el indicador.
// ------------------------------------------------------------
var HOJA_ENTREGAS = 'ENTREGAS_CLIENTE';
var HOJA_REPROG   = 'REPROGRAMACIONES_ENTREGA';
var ENC_ENTREGAS  = ['OP','NOMBRE_OP','CLIENTE','COMERCIAL','FECHA_ORIGINAL','FECHA_VIGENTE','REPROGRAMACIONES',
                     'FECHA_ENTREGA_REAL','OBSERVACION_ENTREGA','REGISTRADA_POR','FECHA_REGISTRO'];
var ENC_REPROG    = ['FECHA_HORA','USUARIO','OP','FECHA_ANTERIOR','FECHA_NUEVA','DIAS_CORRIDOS','MOTIVO','COMENTARIO'];
var MOTIVOS_REPROG = ['Solicitud del cliente','Causa interna (planta / procesos)','Materiales / proveedores','Cambio de alcance','Otro'];
// Correos que pueden corregir una fecha de entrega real ya registrada (queda en el registro)
var AUTORIZADOS_ENTREGA = [
  // 'gerencia@polyuprotec.com',
];

function _hojaEntregas(ss) {
  var sh = ss.getSheetByName(HOJA_ENTREGAS);
  if (!sh) {
    sh = ss.insertSheet(HOJA_ENTREGAS);
    sh.getRange(1, 1, 1, ENC_ENTREGAS.length).setValues([ENC_ENTREGAS]).setBackground('#2F75B5').setFontColor('#FFFFFF').setFontWeight('bold');
    sh.setFrozenRows(1);
    sh.getRange('E:F').setNumberFormat('dd/mm/yyyy'); sh.getRange('H:H').setNumberFormat('dd/mm/yyyy'); sh.getRange('K:K').setNumberFormat('dd/mm/yyyy hh:mm');
    try { sh.protect().setDescription('Entregas al cliente (solo lo escribe el script)').setWarningOnly(true); } catch (_) {}
  }
  return sh;
}

function _hojaReprog(ss) {
  var sh = ss.getSheetByName(HOJA_REPROG);
  if (!sh) {
    sh = ss.insertSheet(HOJA_REPROG);
    sh.getRange(1, 1, 1, ENC_REPROG.length).setValues([ENC_REPROG]).setBackground('#2F75B5').setFontColor('#FFFFFF').setFontWeight('bold');
    sh.setFrozenRows(1);
    sh.getRange('A:A').setNumberFormat('dd/mm/yyyy hh:mm'); sh.getRange('D:E').setNumberFormat('dd/mm/yyyy');
    try { sh.protect().setDescription('Reprogramaciones de entrega (solo lo escribe el script)').setWarningOnly(true); } catch (_) {}
  }
  return sh;
}

/** {fila, valores} de la OP en ENTREGAS_CLIENTE (o null). */
function _filaEntrega(sh, op) {
  var last = sh.getLastRow();
  if (last < 2) return null;
  var ops = sh.getRange(2, 1, last - 1, 1).getDisplayValues();
  for (var i = 0; i < ops.length; i++) if (String(ops[i][0]).trim() === String(op).trim())
    return { fila: i + 2, v: sh.getRange(i + 2, 1, 1, ENC_ENTREGAS.length).getValues()[0] };
  return null;
}

/** Crea o actualiza la fila de la OP. campos: {nombre, cliente, comercial, original, vigente, reprog, real, obs, por, registro} */
function _upsertEntrega(ss, op, c) {
  var sh = _hojaEntregas(ss), f = _filaEntrega(sh, op);
  var v = f ? f.v.slice() : [String(op), '', '', '', '', '', 0, '', '', '', ''];
  if (c.nombre !== undefined)    v[1] = c.nombre;
  if (c.cliente !== undefined)   v[2] = c.cliente;
  if (c.comercial !== undefined) v[3] = c.comercial;
  if (c.original !== undefined && !_esFecha(v[4])) v[4] = c.original;    // la original nunca se sobrescribe
  if (c.vigente !== undefined)   v[5] = c.vigente;
  if (c.reprog !== undefined)    v[6] = c.reprog;
  if (c.real !== undefined)      v[7] = c.real;
  if (c.obs !== undefined)       v[8] = c.obs;
  if (c.por !== undefined)       v[9] = c.por;
  if (c.registro !== undefined)  v[10] = c.registro;
  if (f) sh.getRange(f.fila, 1, 1, v.length).setValues([v]);
  else   sh.getRange(sh.getLastRow() + 1, 1, 1, v.length).setValues([v]);
  return v;
}

/** Pide el motivo (obligatorio) de una reprogramación. Devuelve {motivo, comentario} o null si cancela. */
function _pedirMotivoReprog(ui, op, antes, despues) {
  var lista = MOTIVOS_REPROG.map(function(m, i) { return (i + 1) + '. ' + m; }).join('\n');
  while (true) {
    var p = ui.prompt('📅 Reprogramación de la entrega · OP ' + op,
      'La fecha de entrega cambia de ' + _fmtFecha(antes) + ' a ' + _fmtFecha(despues) + '.\n\n' +
      'Motivo (obligatorio) — escribe el número:\n' + lista, ui.ButtonSet.OK_CANCEL);
    if (p.getSelectedButton() !== ui.Button.OK) return null;
    var n = parseInt(p.getResponseText(), 10);
    if (n >= 1 && n <= MOTIVOS_REPROG.length) {
      var motivo = MOTIVOS_REPROG[n - 1];
      var c = ui.prompt('📝 Comentario', 'Motivo: ' + motivo + '\nDetalle de la reprogramación' + (motivo === 'Otro' ? ' (obligatorio)' : ' (opcional)') + ':', ui.ButtonSet.OK_CANCEL);
      if (c.getSelectedButton() !== ui.Button.OK) return null;
      var com = c.getResponseText().trim();
      if (motivo === 'Otro' && !com) { ui.alert('Con el motivo "Otro" el comentario es obligatorio.'); continue; }
      return { motivo: motivo, comentario: com };
    }
    ui.alert('Escribe un número del 1 al ' + MOTIVOS_REPROG.length + '.');
  }
}

function _registrarReprog(ss, op, antes, despues, mot) {
  var sh = _hojaReprog(ss);
  var dias = (_esFecha(antes) && _esFecha(despues)) ? Math.round((despues - antes) / 86400000) : '';
  sh.getRange(sh.getLastRow() + 1, 1, 1, ENC_REPROG.length).setValues([[new Date(), _usuario(), String(op), antes, despues, dias, mot.motivo, mot.comentario]]);
}

/** Menú: registra la fecha de entrega REAL al cliente. */
function registrarEntregaReal() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), ui = SpreadsheetApp.getUi();
  var sugerida = _esHojaOP(ss.getActiveSheet()) ? ss.getActiveSheet().getName() : '';
  var p = ui.prompt('🚚 Registrar entrega real al cliente', 'Número de la OP' + (sugerida ? ' (vacío = ' + sugerida + ')' : '') + ':', ui.ButtonSet.OK_CANCEL);
  if (p.getSelectedButton() !== ui.Button.OK) return;
  var op = p.getResponseText().trim() || sugerida, ws = ss.getSheetByName(op);
  if (!_esHojaOP(ws)) { ui.alert('❌ No encontré la hoja de la OP "' + op + '".'); return; }
  var m = _leerMetaOP(ws), sh = _hojaEntregas(ss), f = _filaEntrega(sh, op);
  var yo = _usuario(), autorizado = AUTORIZADOS_ENTREGA.map(function(x) { return x.toLowerCase(); }).indexOf(String(yo).toLowerCase()) !== -1;
  var anterior = f && _esFecha(f.v[7]) ? f.v[7] : '';
  if (anterior && !autorizado) {
    ui.alert('🔒 Entrega ya registrada', 'La OP ' + op + ' ya tiene entrega real el ' + _fmtFecha(anterior) +
      ' (registrada por ' + (f.v[9] || '—') + ').\n\nEs línea base: solo un usuario autorizado puede corregirla.', ui.ButtonSet.OK);
    return;
  }
  var q = ui.prompt('📅 Fecha de entrega real · OP ' + op,
    'Fecha comprometida original: ' + _fmtFecha(f && _esFecha(f.v[4]) ? f.v[4] : m.fecha) +
    '\nFecha comprometida vigente: ' + _fmtFecha(m.fecha) +
    (anterior ? '\n⚠ Corrección: la registrada es ' + _fmtFecha(anterior) : '') +
    '\n\n¿Cuándo se entregó al cliente? (dd/mm/aaaa)', ui.ButtonSet.OK_CANCEL);
  if (q.getSelectedButton() !== ui.Button.OK) return;
  var real = _parseFecha(q.getResponseText().trim());
  if (!real) { ui.alert('❌ Fecha no válida. Usa dd/mm/aaaa.'); return; }
  var hoy = new Date(); hoy.setHours(23, 59, 59, 0);
  if (real > hoy) { ui.alert('❌ La entrega real no puede ser una fecha futura.'); return; }
  var o = ui.prompt('📝 Observación de la entrega', 'Opcional (remisión, acta, quién recibió…)' + (anterior ? '\nPara la corrección escribe el motivo (obligatorio):' : ':'), ui.ButtonSet.OK_CANCEL);
  if (o.getSelectedButton() !== ui.Button.OK) return;
  var obs = o.getResponseText().trim();
  if (anterior && !obs) { ui.alert('❌ Para corregir una entrega registrada el motivo es obligatorio.'); return; }

  _upsertEntrega(ss, op, { nombre: m.nombreOp, cliente: m.cliente, comercial: m.comercial,
    original: m.fecha, vigente: m.fecha, real: real, obs: obs, por: yo, registro: new Date() });
  var reg = _nuevoRegistro(op);
  reg.add('Entrega al cliente', '', '', '', anterior ? 'Fecha de entrega real (corrección autorizada)' : 'Fecha de entrega real', anterior, real);
  reg.guardar(ss);
  var fv = _filaEntrega(sh, op).v, ori = fv[4], vig = fv[5];
  var est = function(ref) { if (!_esFecha(ref)) return 'sin fecha comprometida'; var d = Math.round((real - ref) / 86400000); return d <= 0 ? '✅ a tiempo' : '🔴 ' + d + ' día/s tarde'; };
  ui.alert('✅ Entrega registrada · OP ' + op, 'Entrega real: ' + _fmtFecha(real) +
    '\n\nContra la fecha original (' + _fmtFecha(ori) + '): ' + est(ori) +
    '\nContra la fecha vigente (' + _fmtFecha(vig) + '): ' + est(vig), ui.ButtonSet.OK);
}

/**
 * Menú (una sola vez): crea ENTREGAS_CLIENTE para las OP que ya existen.
 * La fecha ORIGINAL se recupera de REGISTRO_CAMBIOS (valor anterior del primer
 * cambio de "Fecha de entrega al cliente"); si nunca se cambió, es la actual.
 * No toca las OP que ya estén en ENTREGAS_CLIENTE.
 */
function prepararRegistroEntregas() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), ui = SpreadsheetApp.getUi();
  var lock = LockService.getDocumentLock();   // v14.1: evita doble ejecución
  if (!lock.tryLock(1000)) { ui.alert('⏳ El registro de entregas ya se está preparando. Espera a que termine.'); return; }
  try { _prepararRegistroEntregas(ss, ui); } finally { lock.releaseLock(); }
}
function _prepararRegistroEntregas(ss, ui) {
  var log = ss.getSheetByName(HOJA_REGISTRO), cambiosF = {};
  if (log && log.getLastRow() > 1) {
    log.getRange(2, 1, log.getLastRow() - 1, 10).getValues().forEach(function(r) {
      if (String(r[7]).trim() !== 'Fecha de entrega al cliente') return;
      var op = String(r[2]).trim();
      (cambiosF[op] = cambiosF[op] || []).push({ cuando: r[0], antes: r[8], despues: r[9] });
    });
  }
  var sh = _hojaEntregas(ss), nuevas = [], ya = 0;
  ss.getSheets().forEach(function(ws) {
    if (!_esHojaOP(ws)) return;
    var m = _leerMetaOP(ws), op = m.op;
    if (ws.getName() !== String(op)) return;   // v14.1: hojas de respaldo
    if (_filaEntrega(sh, op)) { ya++; return; }
    var cam = (cambiosF[op] || []).sort(function(a, b) { return a.cuando - b.cuando; });
    var original = cam.length ? (_parseFecha(String(cam[0].antes)) || m.fecha) : m.fecha;
    _upsertEntrega(ss, op, { nombre: m.nombreOp, cliente: m.cliente, comercial: m.comercial,
      original: _esFecha(original) ? original : '', vigente: _esFecha(m.fecha) ? m.fecha : '', reprog: cam.length });
    nuevas.push(op + (cam.length ? ' (' + cam.length + ' reprog.)' : ''));
  });
  _hojaReprog(ss);
  ui.alert('📅 Registro de entregas', '✅ OP agregadas: ' + nuevas.length + (nuevas.length ? '\n' + nuevas.join(', ') : '') +
    (ya ? '\n\nℹ️ Ya estaban: ' + ya : '') +
    '\n\nLas OP sin fecha de entrega quedan con la fecha vacía: complétala con Editar OP.', ui.ButtonSet.OK);
}


// ============================================================
//  v14.2 — BUSCAR O.P (ventana con buscador)
// ============================================================
function irABaseCreador() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), f = ss.getSheetByName('BASE_CREADOR');
  if (f) ss.setActiveSheet(f);
}

/** Lista de OP (solo hojas de OP, sin respaldos) con sus datos generales. */
function _listaOPsBusqueda() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), tz = Session.getScriptTimeZone(), out = [];
  ss.getSheets().forEach(function(ws) {
    var n = ws.getName();
    if (n.indexOf('_respaldo_') !== -1 || !_esHojaOP(ws)) return;
    var v = ws.getRange(1, 28, 1, 10).getValues()[0];   // AB..AK
    out.push({ hoja: n, op: String(v[0] || n).trim(), nombre: String(v[1] || ''), cliente: String(v[2] || ''),
               comercial: String(v[3] || ''), sede: String(v[4] || ''),
               entrega: (v[9] instanceof Date && v[9].getFullYear() > 1900) ? Utilities.formatDate(v[9], tz, 'dd/MM/yyyy') : '' });
  });
  out.sort(function(a, b) { return (Number(b.op) || 0) - (Number(a.op) || 0) || a.op.localeCompare(b.op); });
  return out;
}

/** Menú / botón: abre la ventana de búsqueda. */
function buscarOP() {
  var lista = _listaOPsBusqueda();
  var html = HtmlService.createHtmlOutput(_htmlBuscarOP(lista)).setWidth(560).setHeight(560);
  SpreadsheetApp.getUi().showModalDialog(html, '🔎 Buscar O.P');
}

/** Llamada desde la ventana: activa la hoja de la OP. */
function irAHojaOP(hoja) {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), ws = ss.getSheetByName(hoja);
  if (!ws) throw new Error('La hoja "' + hoja + '" ya no existe');
  ss.setActiveSheet(ws);
  ws.setActiveRange(ws.getRange('A1'));
  return true;
}

function _htmlBuscarOP(lista) {
  return '<!DOCTYPE html><html><head><base target="_top"><style>' +
    'body{margin:0;font-family:Arial,sans-serif;color:#2b2b40;font-size:13px}' +
    '.top{padding:12px 14px 10px;background:linear-gradient(100deg,#ee4d9e,#8763e8 55%,#4b6ef5)}' +
    '#q{width:100%;box-sizing:border-box;border:0;border-radius:22px;padding:11px 16px;font-size:15px;outline:none;box-shadow:0 4px 14px rgba(0,0,0,.15)}' +
    '.info{font-size:11px;color:#fff;opacity:.9;margin-top:7px}' +
    '#lst{height:440px;overflow:auto;padding:8px 10px}' +
    '.it{display:flex;gap:12px;align-items:center;padding:9px 12px;border:1px solid #edeef5;border-radius:10px;margin-bottom:6px;cursor:pointer;transition:all .12s}' +
    '.it:hover,.it.sel{border-color:#7c5cfc;background:#f1edfe}' +
    '.op{font-family:Consolas,Menlo,monospace;font-weight:bold;color:#7c5cfc;font-size:14px;min-width:58px}' +
    '.tx{flex:1;min-width:0}.nm{font-weight:bold;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.sb{font-size:11.5px;color:#8f9bb3;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.en{font-size:11px;color:#5a5a72;white-space:nowrap;background:#f7f7fc;border-radius:12px;padding:3px 8px}' +
    '.vacio{text-align:center;color:#8f9bb3;padding:40px 10px}mark{background:#ffe08a;color:inherit;border-radius:2px}' +
    '</style></head><body>' +
    '<div class="top"><input id="q" placeholder="Número de OP, proyecto, cliente o comercial…" autocomplete="off" autofocus>' +
    '<div class="info" id="info"></div></div><div id="lst"></div>' +
    '<script>' +
    'var L=' + JSON.stringify(lista) + ',vis=[],sel=0;' +
    'function n(s){return String(s||"").normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").toLowerCase();}' +
    'function e(s){return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;");}' +
    'function hl(s,q){s=e(s);if(!q)return s;var i=n(s).indexOf(q);return i<0?s:s.slice(0,i)+"<mark>"+s.slice(i,i+q.length)+"</mark>"+s.slice(i+q.length);}' +
    'function pinta(){var q=n(document.getElementById("q").value.trim());' +
    'vis=L.filter(function(o){return !q||[o.op,o.nombre,o.cliente,o.comercial,o.sede].some(function(v){return n(v).indexOf(q)!==-1;});});' +
    'if(q)vis.sort(function(a,b){return (n(b.op).indexOf(q)===0)-(n(a.op).indexOf(q)===0);});' +
    'sel=0;document.getElementById("info").textContent=vis.length+" de "+L.length+" O.P · Enter abre la primera · ↑↓ para moverte";' +
    'document.getElementById("lst").innerHTML=vis.length?vis.map(function(o,i){return \'<div class="it\'+(i===0?" sel":"")+\'" onclick="ir(\'+i+\')"><span class="op">\'+hl(o.op,q)+\'</span><div class="tx"><div class="nm">\'+hl(o.nombre||"—",q)+\'</div><div class="sb">👤 \'+hl(o.cliente||"—",q)+\' · 💼 \'+hl(o.comercial||"—",q)+(o.sede?" · 📍 "+e(o.sede):"")+\'</div></div>\'+(o.entrega?\'<span class="en">🏁 \'+o.entrega+"</span>":"")+"</div>";}).join(""):\'<div class="vacio">No hay O.P que coincidan</div>\';}' +
    'function marca(){var it=document.querySelectorAll(".it");it.forEach(function(x,i){x.classList.toggle("sel",i===sel);});if(it[sel])it[sel].scrollIntoView({block:"nearest"});}' +
    'function ir(i){var o=vis[i];if(!o)return;document.getElementById("info").textContent="Abriendo O.P "+o.op+"…";' +
    'google.script.run.withSuccessHandler(function(){google.script.host.close();}).withFailureHandler(function(er){document.getElementById("info").textContent="❌ "+er.message;}).irAHojaOP(o.hoja);}' +
    'document.getElementById("q").addEventListener("input",pinta);' +
    'document.getElementById("q").addEventListener("keydown",function(ev){if(ev.key==="Enter"){ev.preventDefault();ir(sel);}else if(ev.key==="ArrowDown"){ev.preventDefault();sel=Math.min(sel+1,vis.length-1);marca();}else if(ev.key==="ArrowUp"){ev.preventDefault();sel=Math.max(sel-1,0);marca();}else if(ev.key==="Escape"){google.script.host.close();}});' +
    'pinta();setTimeout(function(){document.getElementById("q").focus();},100);' +
    '</script></body></html>';
}
