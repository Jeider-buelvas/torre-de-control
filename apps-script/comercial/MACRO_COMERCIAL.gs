// ============================================================
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
  'Produccion':        '1fPNU8AEwnI591RXr6zfuhDwQ8Ry7u1zqMVkoet6ySyA',  // BORRADOR PRUEBAS
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

const ORDEN_AREAS = [
  // v4: 'Gestión Humana' eliminada — su tarea está dentro de Montaje
  'Administración','Diseño','Dibujo','Compras',
  'Produccion','Galvanizado','Pintura','Logistica','Montaje'
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
    .addItem('➕ Crear Nueva OP',           'crearNuevaOP')
    .addSeparator()
    .addItem('📤 Enviar OP Activa a Áreas', 'enviarOPActivaAAreas')
    .addSeparator()
    .addItem('🔄 Extraer Datos al Gantt',   'actualizarGanttEnComercial')
    .addSeparator()
    .addItem('📅 Agregar campo Fecha de entrega (una sola vez)', 'agregarCampoFechaEntrega')
    .addToUi();
}

// ============================================================
//  CREAR NUEVA OP
// ============================================================
function crearNuevaOP() {
  var ss   = SpreadsheetApp.getActiveSpreadsheet();
  var form = ss.getSheetByName('BASE_CREADOR');
  if (!form) {
    SpreadsheetApp.getUi().alert('❌ No se encontró la hoja "BASE_CREADOR".');
    return;
  }

  var op        = form.getRange('C3').getValue().toString().trim();
  var nombreOp  = form.getRange('C4').getValue().toString().trim();
  var cliente   = form.getRange('C5').getValue().toString().trim();
  var comercial = form.getRange('C6').getValue().toString().trim();
  var sede      = form.getRange('C7').getValue().toString().trim();
  var numSubs   = parseInt(form.getRange('C8').getValue())  || 1;
  var kgTotal   = 0;  // El usuario lo ingresa en col F de la hoja OP (suma al enviar)
  var tieneFecha   = _tieneCampoFecha(form);
  var fechaEntrega = tieneFecha ? form.getRange(FILA_FECHA_ENTREGA, 3).getValue() : '';

  var areasSeleccionadas = [];
  var areaNames = Object.keys(AREAS_FILAS);
  for (var a = 0; a < areaNames.length; a++) {
    var areaName = areaNames[a];
    if (form.getRange(_filaArea(form, areaName), 3).getValue() === true) {
      areasSeleccionadas.push(areaName);
    }
  }

  var faltantes = [];
  if (!op)                             faltantes.push('C3 – Número de OP');
  if (!nombreOp)                       faltantes.push('C4 – Nombre del Proyecto');
  if (!cliente)                        faltantes.push('C5 – Cliente');
  if (!comercial)                      faltantes.push('C6 – Comercial');
  if (!sede)                           faltantes.push('C7 – Sede / Ciudad');
  if (!tieneFecha)                     faltantes.push('Falta el campo Fecha de entrega: usa el menú Torre de Control > 📅 Agregar campo Fecha de entrega');
  else if (!_esFecha(fechaEntrega))    faltantes.push('C9 – Fecha de entrega al cliente');
  if (areasSeleccionadas.length === 0) faltantes.push('Marca al menos un área');

  if (faltantes.length > 0) {
    SpreadsheetApp.getUi().alert('❌ Faltan datos:\n\n• ' + faltantes.join('\n• '));
    return;
  }

  if (ss.getSheetByName(op)) {
    var resp = SpreadsheetApp.getUi().alert(
      '⚠️ Ya existe',
      'Ya existe una hoja llamada "' + op + '".\n¿Deseas reemplazarla?',
      SpreadsheetApp.getUi().ButtonSet.YES_NO
    );
    if (resp !== SpreadsheetApp.getUi().Button.YES) return;
    ss.deleteSheet(ss.getSheetByName(op));
  }

  areasSeleccionadas.sort(function(a, b) {
    var ia = ORDEN_AREAS.indexOf(a), ib = ORDEN_AREAS.indexOf(b);
    if (ia===-1) ia=99; if (ib===-1) ib=99;
    return ia - ib;
  });

  var numAreas = areasSeleccionadas.length;
  var ui = SpreadsheetApp.getUi();
  var confirm = ui.alert(
    '¿Crear OP?',
    'OP: ' + op + ' – "' + nombreOp + '"' +
    '\nCliente: ' + cliente + '\nSede: ' + sede +
    '\nÁreas (' + numAreas + '): ' + areasSeleccionadas.join(', ') +
    '\nSubestructuras por área: ' + numSubs +
    '\nFecha de entrega al cliente: ' + _fmtFecha(fechaEntrega) +
    '\n\n⚠️ Solo se creará la hoja interna.' +
    '\nDespués llena los datos manuales y usa' +
    '\n"📤 Enviar OP Activa a Áreas" para distribuir.' +
    '\n\n¿Continuar?',
    ui.ButtonSet.YES_NO
  );
  if (confirm !== ui.Button.YES) return;

  _crearHojaOP(ss, op, nombreOp, cliente, comercial, sede, numSubs, kgTotal, areasSeleccionadas, numAreas, fechaEntrega);
  _limpiarFormulario(form);

  ui.alert(
    '✅ OP ' + op + ' creada.\n\n' +
    'Áreas: ' + areasSeleccionadas.join(', ') + '\n\n' +
    '1. Ve a la hoja "' + op + '"\n' +
    '2. Completa fechas, duraciones, nombres de subestructura y KG por subestructura (col F)\n' +
    '3. Usa  📤 Enviar OP Activa a Áreas  para enviarla'
  );
}

// ============================================================
//  ENVIAR OP ACTIVA A ÁREAS
// ============================================================
function enviarOPActivaAAreas() {
  var ss     = SpreadsheetApp.getActiveSpreadsheet();
  var ws     = ss.getActiveSheet();
  var opName = ws.getName();

  if (opName === 'BASE_CREADOR' || opName === 'Cronograma Comercial') {
    SpreadsheetApp.getUi().alert('❌ Debes estar en la hoja de la OP.\nVe a la pestaña de la OP y vuelve a ejecutar.');
    return;
  }

  var op        = ws.getRange('AB1').getValue().toString().trim();
  var nombreOp  = ws.getRange('AC1').getValue().toString().trim();
  var cliente   = ws.getRange('AD1').getValue().toString().trim();
  var comercial = ws.getRange('AE1').getValue().toString().trim();
  var sede      = ws.getRange('AF1').getValue().toString().trim();
  var numSubs   = parseInt(ws.getRange('AG1').getValue())   || 1;
  // KG_TOTAL = suma de todos los KG_SUBESTRUCTURA (col F) ingresados manualmente
  var kgTotal = 0;
  if (ws.getLastRow() >= 2) {
    var colF = ws.getRange(2, 6, ws.getLastRow() - 1, 1).getValues();
    for (var ki = 0; ki < colF.length; ki++) {
      var kgVal = parseFloat(colF[ki][0]);
      if (!isNaN(kgVal) && kgVal > 0) kgTotal += kgVal;
    }
  }
  var numAreas  = parseInt(ws.getRange('AI1').getValue())   || 1;
  var areasStr  = ws.getRange('AJ1').getValue().toString().trim();
  var fechaEntrega = ws.getRange(1, COL_META_FECHA).getValue();   // v8: col AK

  if (!op) op = opName;
  if (!areasStr) {
    SpreadsheetApp.getUi().alert('❌ No se encontraron las áreas guardadas.\nEsta hoja puede ser de una versión anterior.');
    return;
  }

  var areasSeleccionadas = areasStr.split(',');
  var ui = SpreadsheetApp.getUi();

  // v8: OP creadas antes de este cambio no tienen fecha → se pide aquí
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
      ws.getRange(1, COL_META_FECHA).setNote('META_FECHA_ENTREGA');
    } else {
      fechaEntrega = '';
    }
  }

  var confirm = ui.alert(
    '📤 Enviar OP a Áreas',
    'Se enviarán los datos de OP "' + op + '" (KG Total: ' + kgTotal.toLocaleString('es-CO') + ' kg calculado)' +
    '\nFecha de entrega al cliente: ' + _fmtFecha(fechaEntrega) + '\n\na:\n\n' +
    areasSeleccionadas.join('\n') +
    '\n\n¿Continuar?',
    ui.ButtonSet.YES_NO
  );
  if (confirm !== ui.Button.YES) return;

  var htmlProgress = HtmlService.createHtmlOutput(
    '<html><head><style>' +
    'body{font-family:Arial,sans-serif;padding:20px;text-align:center;background:#f8f9fa;}' +
    'h3{color:#2F75B5;margin-bottom:16px;}' +
    '.bar-wrap{background:#e0e0e0;border-radius:8px;height:18px;width:100%;margin:10px 0;}' +
    '.bar{background:linear-gradient(90deg,#2F75B5,#4CAF50);height:18px;border-radius:8px;width:0%;transition:width 0.4s;}' +
    '.status{font-size:13px;color:#555;margin-top:10px;}' +
    '</style></head><body>' +
    '<h3>📤 Enviando OP ' + op + '...</h3>' +
    '<div class="bar-wrap"><div class="bar" id="bar"></div></div>' +
    '<div class="status" id="status">Preparando datos...</div>' +
    '<script>' +
    'var pct=0; var areas=' + JSON.stringify(areasSeleccionadas) + ';' +
    'var step=Math.round(100/areas.length);' +
    'var idx=0;' +
    'function tick(){' +
    '  if(idx<areas.length){' +
    '    document.getElementById("status").innerText="Enviando a "+areas[idx]+"... ("+(idx+1)+"/"+areas.length+")";' +
    '    pct=Math.min(100,(idx+1)*step);' +
    '    document.getElementById("bar").style.width=pct+"%";' +
    '    idx++;setTimeout(tick,1800);' +
    '  } else {' +
    '    document.getElementById("status").innerText="✅ Completado";' +
    '    document.getElementById("bar").style.width="100%";' +
    '  }' +
    '}' +
    'setTimeout(tick,500);' +
    '</script></body></html>'
  ).setWidth(380).setHeight(160);

  SpreadsheetApp.getUi().showModalDialog(htmlProgress, '⏳ Enviando OP a Áreas...');

  // Leer datos de fechas y kg por subestructura desde la hoja OP
  var lastRow = ws.getLastRow();
  var datosHoja = [];
  if (lastRow >= 2) {
    var rango = ws.getRange(2, 1, lastRow - 1, 28).getValues();
    for (var i = 0; i < rango.length; i++) {
      datosHoja.push({
        nombreSub:    rango[i][4],   // col E = Nombre SubEstructura
        kgSub:        rango[i][5],   // col F = KG_SUBESTRUCTURA
        fechaIniPlan: rango[i][8],   // col I = FECHA_INICIO_TAREA_PLANEADO
        durPlan:      rango[i][9],   // col J = DURACION_DIAS_TAREAS_PLANEADO
        fechaIniReal: rango[i][16],  // col Q = FECHA_INICIO_TAREA_REAL
        durReal:      rango[i][17]   // col R = DURACION_DIAS_TAREAS_REAL
      });
    }
  }

  var exitosas = [], fallidas = [], offsetPorArea = 0;

  for (var i = 0; i < areasSeleccionadas.length; i++) {
    var area = areasSeleccionadas[i].trim();
    var id   = IDS_AREAS[area];

    SpreadsheetApp.getActiveSpreadsheet().toast(
      'Procesando área ' + (i+1) + ' de ' + areasSeleccionadas.length + '...',
      '📤 ' + area, 3
    );

    var tareasDeEstaArea = (TAREAS_AREA[area] || TAREAS_AREA['Diseño']).length;

    // Si el área es general (Administración), solo tiene una subestructura
      var numSubsArea = AREAS_GENERALES.indexOf(area) !== -1 ? 1 : numSubs;

      var filasDeEstaArea = numSubsArea * tareasDeEstaArea;

      var datosDeEstaArea = datosHoja.slice(
          offsetPorArea,
          offsetPorArea + filasDeEstaArea
      );

offsetPorArea += filasDeEstaArea;

    if (!id || id.indexOf('PON_AQUI') !== -1) {
      fallidas.push(area + ': ID no configurado'); continue;
    }
    try {
      _enviarAPlantillaArea(id, area, op, nombreOp, cliente, comercial, sede, numSubs, numAreas, kgTotal, datosDeEstaArea, fechaEntrega);
      exitosas.push(area);
    } catch(e) {
      fallidas.push(area + ': ' + e.message);
    }
  }

  SpreadsheetApp.getActiveSpreadsheet().toast(
    exitosas.join(', ') + (fallidas.length ? '\n⚠️ Falló: ' + fallidas.join(', ') : ''),
    '✅ OP ' + op + ' enviada', 8
  );

  var msg = '✅ OP ' + op + ' enviada a:\n' + exitosas.join(', ');
  if (fallidas.length) msg += '\n\n⚠️ Falló en:\n' + fallidas.join('\n');
  ui.alert(msg);
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
    'META_FECHA_ENTREGA'          // col AK — v8
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
  ws.hideColumns(27, 11);
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
//  ENVIAR DATOS A LA PLANTILLA DE ÁREA (nueva estructura)
// ============================================================

function _enviarAPlantillaArea(spreadsheetId, area, op, nombreOp, cliente, comercial, sede, numSubs, numAreas, kgTotal, datosHoja, fechaEntrega) {
  var tSS    = SpreadsheetApp.openById(spreadsheetId);
  var tSheet = tSS.getSheetByName('Cronograma');
  if (!tSheet) throw new Error('Hoja "Cronograma" no encontrada');

  // v8: ubica (o crea) la columna FECHA ENTREGA CLIENTE después de OBSERVACIONES
  var colFecha = _columnaFechaEntrega(tSheet);
  // v8: si la columna de fecha quedó antes del bloque PLANEADO (AD..AJ), ese
  // bloque se corrió k columnas. P(n) = columna real, PL(n) = su letra.
  var k  = _offsetPlaneado(tSheet);
  var P  = function(n) { return n >= 30 ? n + k : n; };
  var PL = function(n) { return _colLetra(P(n)); };

  var lastExistingRow = Math.max(tSheet.getLastRow(), 6);
  tSheet.getRange(6, 14, lastExistingRow - 5, 1).clearDataValidations();
  tSheet.getRange(6, 15, lastExistingRow - 5, 1).clearDataValidations();

  var tareas         = TAREAS_AREA[area] || TAREAS_AREA['Diseño'];
  var TAREAS_POR_SUB = tareas.length;
  var mes            = _getNombreMes();

  var numSubsEfectivo = (AREAS_GENERALES.indexOf(area) !== -1) ? 1 : numSubs;
  var totalFilas      = numSubsEfectivo * TAREAS_POR_SUB;

  var lastRow = tSheet.getLastRow();
  if (lastRow >= 6) {
    var colB = tSheet.getRange(6, 2, lastRow-5, 1).getValues();
    for (var ri = colB.length-1; ri >= 0; ri--) {
      if (String(colB[ri][0]).trim() === String(op).trim()) {
        tSheet.deleteRows(ri+6, totalFilas); break;
      }
    }
  }

  var fila       = tSheet.getLastRow() + 1;
  var opStartRow = fila;
  var hojaIdx    = 0;
  var ejecRanges = [];
  var tipoArea   = TIPO_AREA[area] || 'B';
  var asFilas    = AS_FILAS[area]  || {};

  var kgTotalArea = 0;
  var TAREAS_POR_SUB_LOCAL = (TAREAS_AREA[area] || TAREAS_AREA['Diseño']).length;
  for (var si = 0; si < numSubsEfectivo; si++) {
    var idxSi = si * TAREAS_POR_SUB_LOCAL;
    if (datosHoja && idxSi < datosHoja.length) {
      var kgSi = parseFloat(datosHoja[idxSi].kgSub);
      if (!isNaN(kgSi) && kgSi > 0) kgTotalArea += kgSi;
    }
  }
  if (kgTotalArea === 0) kgTotalArea = kgTotal;

  for (var s = 0; s < numSubsEfectivo; s++) {
    var subStart = fila;
    var subLabel = op + '_' + (s+1);

    // kgSub CORREGIDO
    var kgSub = 0;
    var datoSubPrimero = (datosHoja && hojaIdx < datosHoja.length) ? datosHoja[hojaIdx] : null;
    if (datoSubPrimero && datoSubPrimero.kgSub) {
      kgSub = parseFloat(datoSubPrimero.kgSub) || 0;
    } else if (numSubsEfectivo > 0) {
      kgSub = kgTotal / numSubsEfectivo;
    } else {
      kgSub = kgTotal;
    }

    for (var tIdx = 0; tIdx < tareas.length; tIdx++) {
      var descTarea   = tareas[tIdx][0];
      var responsable = tareas[tIdx][1];
      var r           = fila;
      var isFirst     = (s === 0 && tIdx === 0);
      var isFirstSub  = (tIdx === 0);

      var datoFila        = (datosHoja && hojaIdx < datosHoja.length) ? datosHoja[hojaIdx] : null;
      var nombreSubManual = datoFila ? datoFila.nombreSub    : '';
      var fechaIniPlan    = datoFila ? datoFila.fechaIniPlan : '';
      var durPlan         = datoFila ? datoFila.durPlan      : '';
      var fechaIniReal    = datoFila ? datoFila.fechaIniReal : '';
      var durReal         = datoFila ? datoFila.durReal      : '';
      hojaIdx++;

      if (isFirstSub) tSheet.getRange(r, 1).setValue(mes);
      tSheet.getRange(r, 2).setValue(isFirst ? op : '');
      tSheet.getRange(r, 3).setValue(isFirst ? nombreOp : '');
      tSheet.getRange(r, 4).setValue(isFirst ? cliente : '');
      tSheet.getRange(r, 5).setValue(isFirst ? comercial : '');

      if (isFirst) {
        tSheet.getRange(r, 6).setValue(kgTotalArea);
        tSheet.getRange(r, 6).setNumberFormat('#,##0 "kg"');
      }

      if (isFirst) {
        tSheet.getRange(r, 7).setValue(numAreas);
        tSheet.getRange(r, 8).setValue(numAreas > 0 ? 1/numAreas : 0);
        tSheet.getRange(r, 8).setNumberFormat('0.00%');
      }

      if (isFirstSub) {
        tSheet.getRange(r, 9).setFormula('=((L' + r + '*100%)/F' + opStartRow + ')/G' + opStartRow);
        tSheet.getRange(r, 9).setNumberFormat('0.00%');
        tSheet.getRange(r, 10).setFormula('=I' + r + '*R' + r);
        tSheet.getRange(r, 10).setNumberFormat('0.00%');
      }

      if (isFirstSub) tSheet.getRange(r, 11).setValue(nombreSubManual || ('Nombre ' + (s+1)));

      if (isFirstSub) {
        tSheet.getRange(r, 12).setValue(kgSub);
        tSheet.getRange(r, 12).setNumberFormat('#,##0 "kg"');
      }

      if (isFirstSub) tSheet.getRange(r, 13).setValue(sede);

      tSheet.getRange(r, 14).setValue(descTarea);
      tSheet.getRange(r, 15).setValue(responsable);
      tSheet.getRange(r, 16).setValue('En pausa');

      // Col Q (%_APORTE_TAREA)
      if (tipoArea === 'A') {
        var pt = (tareas[tIdx][2]||0).toString().replace('.',',');
        var pp = (tareas[tIdx][3]||0).toString().replace('.',',');
        var pr = (tareas[tIdx][4]||0).toString().replace('.',',');
        tSheet.getRange(r, 17).setValue('=IF(P' + r + '="Terminado";' + pt + ';IF(P' + r + '="En pausa";' + pp + ';IF(P' + r + '="Reproceso";' + pr + ';0)))');
      } else {
        var asRow = asFilas[descTarea] || null;
        if (asRow) {
          tSheet.getRange(r, 17).setFormula("='Assignees and Status'!B" + asRow + '%*T' + r);
        } else {
          var pt2 = (tareas[tIdx][2]||0).toString().replace('.',',');
          var pp2 = (tareas[tIdx][3]||0).toString().replace('.',',');
          tSheet.getRange(r, 17).setValue('=IF(P' + r + '="Terminado";' + pt2 + ';IF(P' + r + '="En pausa";' + pp2 + ';0))');
        }
      }
      tSheet.getRange(r, 17).setNumberFormat('0.00%');

      // Col S = KG_AVANCE_ACUMULADO — SIEMPRE es valor manual (el usuario
      // escribe el kg avanzado por tarea). A propósito NO se le pone
      // fórmula aquí: si S dependiera de R (vía L*R, por ejemplo) se
      // generaría una referencia circular S → R → Q → T → S, que es
      // justo lo que causaba los #REF!/#ERROR!. Solo se define el
      // formato numérico para que la celda quede lista para digitar.
      tSheet.getRange(r, 19).setNumberFormat('#,##0.00 "kg"');

      // ==================== FÓRMULAS DE RESUMEN ====================
//if (isFirstSub) {

  // Calcula el último registro REAL de esta subestructura
  //var subEnd = fila + (TAREAS_POR_SUB - tIdx) - 1;

  //setSubSummaryFormulas(tSheet, subStart, subEnd - subStart + 1);
//}
// ============================================================

      tSheet.getRange(r, 18).setNumberFormat('0.00%');
      tSheet.getRange(r, 20).setFormula('=S' + r + '/L' + subStart);

      // Resto de lógica (fechas, etc.) se mantiene igual...
      if (fechaIniReal && fechaIniReal instanceof Date && fechaIniReal.getFullYear() > 1900) {
        tSheet.getRange(r, 21).setValue(fechaIniReal).setNumberFormat('dd/mm/yyyy');
      } else if (isFirstSub) {
        tSheet.getRange(r, 21).setFormula('=' + PL(30) + r);
      } else {
        tSheet.getRange(r, 21).setValue('=WORKDAY(W' + (r-1) + ';1;DIAS_FESTIVOS!$A$3:$A$20)');
      }

      if (durReal && typeof durReal === 'number' && durReal > 0) {
        tSheet.getRange(r, 22).setValue(durReal);
      }

      tSheet.getRange(r, 23).setValue('=IF(OR(U' + r + '="";V' + r + '=0);"";WORKDAY.INTL(U' + r + ';V' + r + '-1;1;DIAS_FESTIVOS!$A$3:$A$20))');

      if (tIdx === 0) {
        tSheet.getRange(r, 26).setFormula('=V' + r + '*Y$' + subStart);
        tSheet.getRange(r, 27).setFormula('=Z' + r);
      } else {
        tSheet.getRange(r, 26).setFormula('=V' + r + '*Y$' + subStart);
        tSheet.getRange(r, 27).setFormula('=AA' + (r-1) + '+Z' + r);
      }
      tSheet.getRange(r, 28).setFormula('=' + PL(33) + r + '/X' + r);
      tSheet.getRange(r, 28).setNumberFormat('0.00%');

      if (fechaIniPlan && fechaIniPlan instanceof Date && fechaIniPlan.getFullYear() > 1900) {
        tSheet.getRange(r, P(30)).setValue(fechaIniPlan).setNumberFormat('dd/mm/yyyy');
      }
      if (durPlan && typeof durPlan === 'number' && durPlan > 0) {
        tSheet.getRange(r, P(31)).setValue(durPlan);
      }
      tSheet.getRange(r, P(32)).setValue('=IF(OR(' + PL(30) + r + '="";' + PL(31) + r + '=0);"";WORKDAY.INTL(' + PL(30) + r + ';' + PL(31) + r + '-1;1;DIAS_FESTIVOS!$A$3:$A$20))');

      if (isFirstSub) {
        tSheet.getRange(r, P(35)).setFormula('=' + PL(31) + r + '*' + PL(34) + '$' + subStart);
        tSheet.getRange(r, P(36)).setFormula('=' + PL(35) + r);
      } else {
        tSheet.getRange(r, P(35)).setFormula('=' + PL(31) + r + '*' + PL(34) + '$' + subStart);
        tSheet.getRange(r, P(36)).setFormula('=' + PL(36) + (r-1) + '+' + PL(35) + r);
      }

      fila++;
}

     var subEnd = fila - 1;

     // Crear las fórmulas de resumen una vez ya existen todas las filas
       setSubSummaryFormulas(
       tSheet,
       subStart,
 subEnd - subStart + 1,
       k
     ); 

    // Merges
    var mergeCols = [1, 6, 9, 10, 11, 12, 13, 18, 24, 25, 28, P(33), P(34)];
    for (var mc = 0; mc < mergeCols.length; mc++) {
      try {
        tSheet.getRange(subStart, mergeCols[mc], TAREAS_POR_SUB, 1).mergeVertically();
        tSheet.getRange(subStart, mergeCols[mc], TAREAS_POR_SUB, 1).setVerticalAlignment('middle');
      } catch(_) {}
    }

    var bloqueRange = tSheet.getRange(subStart, 1, TAREAS_POR_SUB, Math.max(P(36), colFecha));
    bloqueRange.setBorder(true,true,true,true,null,null,'#000000',SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
    bloqueRange.setBorder(null,null,null,null,true,true,'#000000',SpreadsheetApp.BorderStyle.SOLID);
  }

  // Merges OP y formatos finales
  var mergeColsOp = [2, 3, 4, 5, 6, 7, 8];
  var totalFilasEfectivo = (AREAS_GENERALES.indexOf(area) !== -1) ? TAREAS_POR_SUB : totalFilas;
  for (var mc2 = 0; mc2 < mergeColsOp.length; mc2++) {
    try {
      tSheet.getRange(opStartRow, mergeColsOp[mc2], totalFilasEfectivo, 1).mergeVertically();
      tSheet.getRange(opStartRow, mergeColsOp[mc2], totalFilasEfectivo, 1).setVerticalAlignment('middle');
    } catch(_) {}
  }

  tSheet.getRange(opStartRow, 21, totalFilasEfectivo, 1).setNumberFormat('dd/mm/yyyy');
  tSheet.getRange(opStartRow, 23, totalFilasEfectivo, 1).setNumberFormat('dd/mm/yyyy');
  tSheet.getRange(opStartRow, P(30), totalFilasEfectivo, 1).setNumberFormat('dd/mm/yyyy');
  tSheet.getRange(opStartRow, P(32), totalFilasEfectivo, 1).setNumberFormat('dd/mm/yyyy');

  // v8: Fecha de entrega al cliente (una vez por OP, combinada como OP/Cliente)
  var rgFecha = tSheet.getRange(opStartRow, colFecha, totalFilasEfectivo, 1);
  try { rgFecha.breakApart(); } catch(_) {}
  rgFecha.clearContent();
  tSheet.getRange(opStartRow, colFecha).setValue(_esFecha(fechaEntrega) ? fechaEntrega : '');
  rgFecha.setNumberFormat('dd/mm/yyyy').setHorizontalAlignment('center').setFontWeight('bold');
  try { rgFecha.mergeVertically().setVerticalAlignment('middle'); } catch(_) {}

  if (ejecRanges.length > 0) {
    var rules = tSheet.getConditionalFormatRules();
    rules.push(SpreadsheetApp.newConditionalFormatRule().whenNumberGreaterThanOrEqualTo(0.80).setBackground('#c6efce').setFontColor('#276221').setRanges(ejecRanges).build());
    rules.push(SpreadsheetApp.newConditionalFormatRule().whenNumberBetween(0.40, 0.7999).setBackground('#ffeb9c').setFontColor('#9c6500').setRanges(ejecRanges).build());
    rules.push(SpreadsheetApp.newConditionalFormatRule().whenNumberLessThan(0.40).setBackground('#ffc7ce').setFontColor('#9c0006').setRanges(ejecRanges).build());
    tSheet.setConditionalFormatRules(rules);
  }
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
  tareas.push(['Comercial','Revisión y Firma del Contrato','Cliente','Terminado','100%',new Date('2025-12-30'),new Date('2025-12-30')]);
  tareas.push(['Comercial','Cuenta de Cobro / Gestión de Pólizas','Administración','Terminado','100%',new Date('2025-12-30'),new Date('2025-12-30')]);
  tareas.push(['Comercial','Recepción de Anticipo','Cliente','Terminado','100%',new Date('2025-12-30'),new Date('2025-12-30')]);

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
  return AREAS_FILAS[area] + (_tieneCampoFecha(form) ? 1 : 0);
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
