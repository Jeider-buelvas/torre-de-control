// CODIGO DE TORRE_CONTROL_MAESTRA_POLYUPROTEC — v4.3
//
// v4.3: ID_COMERCIAL corregido (I mayúscula). Entregas: si una OP aparece repetida en
//       ENTREGAS_CLIENTE se toma una sola (la que tenga entrega real; si no, la última),
//       y se ignoran filas con errores (#REF!) o sin OP.
//
// v4.2
//
// v4.2 — Semáforo de la OP con tres miradas (antes solo miraba la última fecha planeada):
//   🔴 rojo     : entrega vencida sin terminar · el cronograma termina después de la
//                 entrega · plan vencido > 7 días · brecha ≥ 25 puntos
//   🟡 amarillo : brecha ≥ 10 puntos · plan vencido 1–7 días · entrega en ≤ 15 días con avance < 80%
//   🟢 verde    : lo demás.  (Sin fechas planeadas → 'sinplan'; Terminado → verde.)
//   Brecha = avance esperado a hoy (% de tareas cuya fecha fin planeada ya pasó)
//            − avance real (% de tareas terminadas). Se envían los motivos
//            (semaforoMotivos) y los números (semaforoDatos) para mostrarlos en la App.
//
// v4.1
//
// v4.1:
//  - Tareas en estado "No aplica" (las marca Comercial en "🧩 Tareas de la OP")
//    no cuentan en el total de tareas de la OP ni del área.
//  - Vigilancia: un área no puede poner ni quitar "No aplica" (solo Comercial).
//  - Cumplimiento de entrega al cliente: lee ENTREGAS_CLIENTE y
//    REPROGRAMACIONES_ENTREGA del archivo de Comercial (ID_COMERCIAL).
//    API: ?tipo=entregas y "entregas" en ?tipo=todos.
//
// v4
//
// v4 (acuerdos de la reunión):
//  - Semáforo: una OP sin fechas planeadas ya NO sale "verde" → 'sinplan'.
//    Una OP sin terminar cuyo plan ya venció se mide contra HOY (antes, sin
//    fecha real, salía verde). El fin real que cuenta es el de tareas Terminado.
//  - Cumplimiento solo con evidencia (tarea Terminado/Reproceso o KG > 0) en
//    la subestructura; sin evidencia se informa vacío (antes 100% falso).
//    Eficiencia por área: solo con tareas Terminado (antes 100% si no había datos).
//  - Protección de fecha fin real (Terminado) y de fecha de entrega, historial
//    HISTORIAL_CAMBIOS (solo consulta), línea base y correo resumen cada 15 min.
//    Menú: 🛡 Instalar protección.  API: ?tipo=historial y "historial" en todos.
//
// v3.2
//
// v3.2 (auditoría): si falta un encabezado en un área con FECHA_ENTREGA_CLIENTE, no se
//       toma la columna vecina; y las importaciones se amplían solas a A5:AK.
//
// v3.1
//
// v3.1: los campos numéricos (duraciones, %, KG) que llegaban como FECHA
//       (31/12/1899, 19/1/1900…) por el formato de las hojas de importación
//       se convierten otra vez a número, y LOOKER_MAESTRA queda con el
//       formato correcto en esas columnas.
//
// v3 (oct-2026):
//  - Nueva hoja PRODUCCION_DIARIA: kilos reales y planeados por día, OP y
//    subestructura, leídos de las hojas mensuales (ENERO 2026, ...) de
//    PLANTILLA_LOOKER_PRODUCCION_V2. Se actualiza junto con LOOKER_MAESTRA
//    y con el menú '🏭 Actualizar Producción diaria'.
//  - doGet: nuevo ?tipo=produccion y campo "produccion" dentro de ?tipo=todos.
//
// v2 (oct-2026):
//  - Las columnas de cada área se ubican por NOMBRE de encabezado, no por
//    posición. Así no se desordena cuando un cronograma tiene la columna
//    nueva FECHA_ENTREGA_CLIENTE (AD) y otro todavía no.
//  - Nueva columna al FINAL de LOOKER_MAESTRA: FECHA_ENTREGA_CLIENTE
//    (índice 39). Las columnas 0..38 quedan iguales → el PHP no cambia.
//  - El JSON (doGet) agrega fechaEntregaCliente en ops y tareas.
//  - Menú: '🔧 Ampliar importaciones a A5:AK' (una sola vez).

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🚀 Torre de Control')
    .addItem('🔄 Actualizar LOOKER_MAESTRA', 'actualizarLookerMaestra')
    .addItem('📈 Generar Curva S', 'generarCurvaS')
    .addItem('🏭 Actualizar Producción diaria', 'actualizarProduccionDiaria')
    .addSeparator()
    .addItem('🔧 Ampliar importaciones a A5:AK (una sola vez)', 'ampliarImportaciones')
    .addSeparator()
    .addItem('🛡 Instalar protección (una sola vez)', 'instalarProteccion')
    .addItem('📜 Ver historial de cambios', 'verHistorialCambios')
    .addItem('✉️ Probar correo de cambios', 'probarCorreoCambios')
    .addItem('⛔ Desinstalar protección', 'desinstalarProteccion')
    .addToUi();
}

function actualizarLookerMaestra() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  // v3.2: las importaciones de las áreas se amplían solas a A5:AK (antes A5:AJ dejaba
  // por fuera la última columna en las áreas que tienen FECHA_ENTREGA_CLIENTE).
  var ampliadas = _ampliarImportacionesSilencioso(ss);
  if (ampliadas.length) { SpreadsheetApp.flush(); Utilities.sleep(4000); }
  let maestra = ss.getSheetByName('LOOKER_MAESTRA');
  if (!maestra) maestra = ss.insertSheet('LOOKER_MAESTRA');
  maestra.clearContents();
  maestra.clearFormats();

  const header = [
    'Área','Mes','OP','Nombre de OP','Cliente','Comercial',
    'KG_TOTAL_PROYECTO','Numero de areas','Porcentaje x Area',
    'Avance Esperado por SubEstructura','Progreso por SubEstructura',
    'Nombre SubEstructura','PESO_KG_SUBESTRUCTURA','Sede',
    'Descripción Tareas','Asignado','ESTADO',
    '%_APORTE_TAREA','Ejecución por SubEstructura Individual%',
    'KG_AVANCE_ACUMULADO','AVANCE_REAL_%',
    'FECHA_INICIO_TAREA_REAL','DURACION_DIAS_TAREAS_REAL Individual',
    'FECHA_FIN_TAREA_REAL','TOTAL_DIAS_TAREA_REAL',
    '% _TAREA_REAL','%_TAREAS_INDIVIDUALES_REAL Planificado',
    '%_TAREAS_ACUMULADO_REAL Planificado',
    '%_DE_CUMPLIMIENTO_VS_PLANEACION','OBSERVACIONES',
    'FECHA_INICIO_TAREA_PLANEADO','DURACION_DIAS_TAREAS_PLANEADO Individual',
    'FECHA_FIN_TAREA_PLANEADO','TOTAL_DIAS_TAREA_PLANEADO',
    '% _TAREA_PLANEADO','%_TAREAS_INDIVIDUALES_PLANEADO Planificado',
    '%_TAREAS_ACUMULADO_PLANEADO Planificado',
    'Indicador de Eficiencia (KPI) Individual','Estado_OP',
    'FECHA_ENTREGA_CLIENTE'          // v2: índice 39 (al final, no mueve las demás)
  ];

  let datos = [header];

  const hojas = ['DISEÑO','DIBUJO','PINTURA','COMPRAS','GALVANIZADO',
                 'LOGISTICA','MONTAJE','PRODUCCION','ADMINISTRACION'];

  function parseFecha(valor) {
    if (!valor) return null;
    if (valor instanceof Date) return valor;
    if (typeof valor === 'number' && valor > 40000) {
      return new Date(Math.round((valor - 25569) * 86400000));
    }
    const str = valor.toString().trim();
    const partes = str.split('/');
    if (partes.length === 3) {
      return new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
    }
    return null;
  }

  function esVacio(v) {
    return v === null || v === undefined || v === '';
  }

  let totalFilas = 0;

  const estadoPorOP = {};
  for (let nombreHoja of hojas) {
    const sheet = ss.getSheetByName(nombreHoja);
    if (!sheet) continue;
    const valores = sheet.getDataRange().getValues();
    if (valores.length <= 1) continue;
    let lastOPHoja = null;
    for (let i = 1; i < valores.length; i++) {
      const f = valores[i];
      if (!esVacio(f[1])) lastOPHoja = f[1];
      const op     = lastOPHoja;
      const estado = String(f[15] || '').trim();
      if (!op || !estado) continue;
      if (!estadoPorOP[op]) estadoPorOP[op] = 'Sin Iniciar';
      if (estadoPorOP[op] !== 'Terminado') {
        if (!estadoPorOP[op + '_total']) estadoPorOP[op + '_total'] = 0;
        estadoPorOP[op + '_total']++;
        if (estado === 'Terminado') {
          if (!estadoPorOP[op + '_terminadas']) estadoPorOP[op + '_terminadas'] = 0;
          estadoPorOP[op + '_terminadas']++;
        } else {
          estadoPorOP[op] = 'En Progreso';
        }
      }
    }
  }
  for (let opKey in estadoPorOP) {
    if (opKey.includes('_')) continue;
    const term  = estadoPorOP[opKey + '_terminadas'] || 0;
    const total = estadoPorOP[opKey + '_total']      || 0;
    if (total > 0 && term === total) estadoPorOP[opKey] = 'Terminado';
    else if (total > 0)              estadoPorOP[opKey] = 'En Progreso';
  }

  for (let nombreHoja of hojas) {
    const sheet = ss.getSheetByName(nombreHoja);
    if (!sheet) continue;
    const valores = sheet.getDataRange().getValues();
    if (valores.length <= 1) continue;

    const area = nombreHoja;
    const C = _mapaColumnas(valores[0]);   // v2: columnas por nombre de encabezado
    let lFechaEnt = '';
    let lOP='', lNombre='', lCliente='', lComercial='';
    let lKgTotal='', lNumProc='', lPctPart='';
    let lPesoSub='', lProgresoSub='', lNombreSub='', lPesoKg='', lSede='';

    for (let i = 1; i < valores.length; i++) {
      const f = valores[i];

      const g = function(k) { return f[C[k]]; };

      const filaVacia = esVacio(g('OP')) && esVacio(g('DESCRIPCION_TAREAS')) && esVacio(g('ASIGNADO')) && esVacio(g('ESTADO'));
      if (filaVacia) continue;

      if (!esVacio(g('OP')))                          { if (g('OP') !== lOP) lFechaEnt = ''; lOP = g('OP'); }
      if (!esVacio(g('NOMBRE_OP')))                     lNombre      = g('NOMBRE_OP');
      if (!esVacio(g('CLIENTE')))                       lCliente     = g('CLIENTE');
      if (!esVacio(g('COMERCIAL')))                     lComercial   = g('COMERCIAL');
      if (!esVacio(g('KG_TOTAL_PROYECTO')))             lKgTotal     = _num(g('KG_TOTAL_PROYECTO'));
      if (!esVacio(g('NUM_PROCESOS')))                  lNumProc     = _num(g('NUM_PROCESOS'));
      if (!esVacio(g('%_PARTICIPACION_PROCESO')))       lPctPart     = _num(g('%_PARTICIPACION_PROCESO'));
      if (!esVacio(g('%_PESO_SUBESTRUCTURA_PESO')))     lPesoSub     = _num(g('%_PESO_SUBESTRUCTURA_PESO'));
      if (!esVacio(g('%_PROGRESO_POR_SUBESTRUCTURA')))  lProgresoSub = _num(g('%_PROGRESO_POR_SUBESTRUCTURA'));
      if (!esVacio(g('NOMBRE_SUBESTRUCTURA')))          lNombreSub   = g('NOMBRE_SUBESTRUCTURA');
      if (!esVacio(g('PESO_KG_SUBESTRUCTURA')))         lPesoKg      = _num(g('PESO_KG_SUBESTRUCTURA'));
      if (!esVacio(g('SEDE')))                          lSede        = g('SEDE');
      if (C['FECHA_ENTREGA_CLIENTE'] !== undefined && !esVacio(g('FECHA_ENTREGA_CLIENTE')))
                                                        lFechaEnt    = parseFecha(g('FECHA_ENTREGA_CLIENTE')) || '';

      if (!lOP) continue;
      if (esVacio(g('DESCRIPCION_TAREAS'))) continue;

      const estadoOP = estadoPorOP[lOP] || 'Sin Iniciar';

      const fechaInicioReal = parseFecha(g('FECHA_INICIO_TAREA_REAL'));
      const fechaFinReal    = parseFecha(g('FECHA_FIN_TAREA_REAL'));
      const fechaInicioPlan = parseFecha(g('FECHA_INICIO_TAREA_PLANEADO'));
      const fechaFinPlan    = parseFecha(g('FECHA_FIN_TAREA_PLANEADO'));

      datos.push([
        area,                                   // 0  Área
        g('MES'),                               // 1  Mes
        lOP,                                    // 2  OP
        lNombre,                                // 3  Nombre OP
        lCliente,                               // 4  Cliente
        lComercial,                             // 5  Comercial
        lKgTotal,                               // 6  KG_TOTAL_PROYECTO
        lNumProc,                               // 7  NUM_PROCESOS
        lPctPart,                               // 8  %_PARTICIPACION
        lPesoSub,                               // 9  %_PESO_SUBESTRUCTURA
        lProgresoSub,                           // 10 %_PROGRESO_SUB
        lNombreSub,                             // 11 NOMBRE_SUBESTRUCTURA
        lPesoKg,                                // 12 PESO_KG_SUBESTRUCTURA
        lSede,                                  // 13 Sede
        g('DESCRIPCION_TAREAS'),                // 14 DESCRIPCION_TAREAS
        g('ASIGNADO'),                          // 15 Asignado
        g('ESTADO'),                            // 16 ESTADO
        _num(g('%_APORTE_TAREA')),                    // 17 %_APORTE_TAREA
        _num(g('%_EJECUCION_SUBESTRUCTURA')),         // 18 %_EJECUCION_SUB
        _num(g('KG_AVANCE_ACUMULADO')),               // 19 KG_AVANCE_ACUMULADO
        _num(g('AVANCE_REAL_%')),                     // 20 AVANCE_REAL_%
        fechaInicioReal,                        // 21 F_INI_REAL
        _num(g('DURACION_DIAS_TAREAS_REAL')),         // 22 DUR_REAL
        fechaFinReal,                           // 23 F_FIN_REAL
        _num(g('DURACION_PROCESO_REAL_DIAS')),        // 24 DUR_PROCESO_REAL
        _num(g('%_TAREA_REAL')),                      // 25 %_TAREA_REAL
        _num(g('%_TAREAS_INDIVIDUALES_REAL')),        // 26 %_INDIV_REAL
        _num(g('%_TAREAS_ACUMULADO_REAL')),           // 27 %_ACUM_REAL
        _num(g('%_DE_CUMPLIMIENTO_VS_PLANEACION')),   // 28 %_CUMPLIMIENTO
        g('OBSERVACIONES'),                     // 29 OBS
        fechaInicioPlan,                        // 30 F_INI_PLAN
        _num(g('DURACION_DIAS_TAREAS_PLANEADO')),     // 31 DUR_PLAN
        fechaFinPlan,                           // 32 F_FIN_PLAN
        _num(g('DURACION_PROCESO_PLANEADO_DIAS')),    // 33 DUR_PROCESO_PLAN
        _num(g('%_TAREA_PLANEADO')),                  // 34 %_TAREA_PLAN
        _num(g('%_TAREAS_INDIVIDUALES_PLANEADO')),    // 35 %_INDIV_PLAN
        _num(g('%_TAREAS_ACUMULADO_PLANEADO')),       // 36 %_ACUM_PLAN
        _num(g('%_TAREA_PLANEADO')),                  // 37 KPI Individual (igual que antes: f[33])
        estadoOP,                               // 38 Estado_OP
        lFechaEnt                               // 39 FECHA_ENTREGA_CLIENTE (v2)
      ]);
    }
    totalFilas += valores.length - 1;
  }

  maestra.getRange(1, 1, datos.length, header.length).setValues(datos);
  maestra.getRange(1, 1, 1, header.length)
    .setBackground('#4a86e8').setFontColor('white').setFontWeight('bold');

  const columnasFecha = [22, 24, 31, 33, 40];   // v2: + FECHA_ENTREGA_CLIENTE
  for (let col of columnasFecha) {
    maestra.getRange(2, col, datos.length - 1, 1).setNumberFormat('dd/mm/yyyy');
  }
  maestra.getRange(2, 7,  datos.length - 1, 1).setNumberFormat('#,##0 "kg"');
  maestra.getRange(2, 13, datos.length - 1, 1).setNumberFormat('#,##0 "kg"');
  maestra.getRange(2, 20, datos.length - 1, 1).setNumberFormat('#,##0.00 "kg"');
  // v3.1: duraciones como número (no fecha) y porcentajes como %
  [23, 25, 32, 34].forEach(function(c) { maestra.getRange(2, c, datos.length - 1, 1).setNumberFormat('0'); });
  [9, 10, 11, 18, 19, 21, 26, 27, 28, 29, 35, 36, 37, 38].forEach(function(c) { maestra.getRange(2, c, datos.length - 1, 1).setNumberFormat('0.00%'); });
  maestra.getRange(2, 8, datos.length - 1, 1).setNumberFormat('0');

  if (maestra.getFilter()) maestra.getFilter().remove();
  maestra.autoResizeColumns(1, header.length);

  // v3: producción diaria (no detiene la actualización principal si falla)
  var msgDiario = '';
  try { msgDiario = actualizarProduccionDiaria(true); }
  catch (e) { msgDiario = '⚠ Producción diaria: ' + e.message; Logger.log(msgDiario); }

  // Solo mostrar alert si hay UI disponible (ejecución manual)
  try {
    SpreadsheetApp.getUi().alert(
      '✅ LOOKER_MAESTRA actualizada correctamente\n\n' +
      `Total de filas procesadas: ${totalFilas}\n\n` +
      `• Diseño: ${ss.getSheetByName('DISEÑO')?.getLastRow()-1 || 0}\n` +
      `• Dibujo: ${ss.getSheetByName('DIBUJO')?.getLastRow()-1 || 0}\n` +
      `• Pintura: ${ss.getSheetByName('PINTURA')?.getLastRow()-1 || 0}\n` +
      `• Compras: ${ss.getSheetByName('COMPRAS')?.getLastRow()-1 || 0}\n` +
      `• Galvanizado: ${ss.getSheetByName('GALVANIZADO')?.getLastRow()-1 || 0}\n` +
      `• Logística: ${ss.getSheetByName('LOGISTICA')?.getLastRow()-1 || 0}\n` +
      `• Montaje: ${ss.getSheetByName('MONTAJE')?.getLastRow()-1 || 0}\n` +
      `• Producción: ${ss.getSheetByName('PRODUCCION')?.getLastRow()-1 || 0}\n` +
      `• Administración: ${ss.getSheetByName('ADMINISTRACION')?.getLastRow()-1 || 0}` +
      (msgDiario ? '\n\n' + msgDiario : '')
    );
  } catch(e) {
    // Ejecución automática — sin UI, registrar en log
    Logger.log('✅ LOOKER_MAESTRA actualizada: ' + new Date().toLocaleString() + ' — Filas: ' + totalFilas);
  }
}

function generarCurvaS() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const maestra = ss.getSheetByName('LOOKER_MAESTRA');
  if (!maestra) { SpreadsheetApp.getUi().alert('❌ Primero ejecuta "🔄 Actualizar LOOKER_MAESTRA"'); return; }
  const valores = maestra.getDataRange().getValues();
  if (valores.length < 2) { SpreadsheetApp.getUi().alert('❌ LOOKER_MAESTRA está vacía'); return; }

  const header = valores[0];
  const data = valores.slice(1);

  const colPeso         = header.indexOf('%_APORTE_TAREA');
  const colAvanceActual = header.indexOf('Ejecución por SubEstructura Individual%');
  const colInicioPlan   = header.indexOf('FECHA_INICIO_TAREA_PLANEADO');
  const colDurPlan      = header.indexOf('DURACION_DIAS_TAREAS_PLANEADO Individual');
  const colFinPlan      = header.indexOf('FECHA_FIN_TAREA_PLANEADO');
  const colInicioReal   = header.indexOf('FECHA_INICIO_TAREA_REAL');

  let totalPeso = 0;
  data.forEach(f => { totalPeso += parseFloat(f[colPeso]) || 0; });
  if (totalPeso === 0) totalPeso = 1;

  let fechaMin = new Date(2100, 0, 1), fechaMax = new Date(2000, 0, 1);
  data.forEach(f => {
    const inicio = f[colInicioPlan], fin = f[colFinPlan];
    if (inicio instanceof Date && inicio < fechaMin) fechaMin = inicio;
    if (fin instanceof Date && fin > fechaMax) fechaMax = fin;
  });

  const fechasSemanales = [];
  let actual = new Date(fechaMin);
  while (actual <= fechaMax) { fechasSemanales.push(new Date(actual)); actual.setDate(actual.getDate() + 7); }

  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const curvaData = [['Semana','Fecha','Acumulado Semanal (Planificado)','Acumulado Real']];

  fechasSemanales.forEach((fecha, i) => {
    let sumaPlan = 0, sumaReal = 0;
    data.forEach(f => {
      const peso = parseFloat(f[colPeso]) || 0;
      if (peso === 0) return;
      const inicioPlan = f[colInicioPlan];
      const durPlan = parseFloat(f[colDurPlan]) || 1;
      let progPlan = 0;
      if (inicioPlan instanceof Date) {
        if (fecha < inicioPlan) progPlan = 0;
        else if (fecha >= f[colFinPlan]) progPlan = 1;
        else { const diasTrans = (fecha - inicioPlan)/(1000*60*60*24)+1; progPlan = Math.min(1,Math.max(0,diasTrans/durPlan)); }
      }
      sumaPlan += progPlan * peso;
      const inicioReal = f[colInicioReal];
      const avanceActual = parseFloat(f[colAvanceActual]) || 0;
      let progReal = 0;
      if (inicioReal instanceof Date && fecha >= inicioReal && fecha <= hoy) {
        const diasTransReal = (hoy - inicioReal)/(1000*60*60*24)+1;
        if (diasTransReal > 0) { const progresoLineal = Math.min(1,(fecha-inicioReal)/(1000*60*60*24)+1)/diasTransReal; progReal = progresoLineal * avanceActual; }
      }
      sumaReal += progReal * peso;
    });
    curvaData.push(['Semana '+(i+1), fecha, Math.round((sumaPlan/totalPeso)*10000)/1000000, Math.round((sumaReal/totalPeso)*10000)/1000000]);
  });

  let curvaSheet = ss.getSheetByName('CURVA_S');
  if (!curvaSheet) curvaSheet = ss.insertSheet('CURVA_S');
  curvaSheet.clear();
  curvaSheet.getRange(1,1,curvaData.length,4).setValues(curvaData);
  curvaSheet.getRange(1,1,1,4).setBackground('#4a86e8').setFontColor('white').setFontWeight('bold');
  curvaSheet.getRange(2,3,curvaData.length-1,2).setNumberFormat('0.00%');
  curvaSheet.getRange(2,2,curvaData.length-1,1).setNumberFormat('dd/mm/yyyy');
  curvaSheet.autoResizeColumns(1,4);
  SpreadsheetApp.getUi().alert('✅ CURVA S generada correctamente en la hoja "CURVA_S"');
}

// ============================================================
//  WEB APP — API JSON para el Dashboard
// ============================================================
function doGet(e) {
  var tipo = e && e.parameter && e.parameter.tipo ? e.parameter.tipo : 'todos';
  var output;
  switch (tipo) {
    case 'ops':   output = getDatosOPs();    break;
    case 'areas': output = getDatosAreas();  break;
    case 'curva': output = getDatosCurvaS(); break;
    case 'tareas':output = getDatosTareas(); break;
    case 'produccion': output = getDatosProduccion(); break;   // v3
    case 'historial':  output = getDatosHistorial();  break;   // v4
    case 'entregas':   output = getDatosEntregas();   break;   // v4.1
    default:      output = getTodosDatos();  break;
  }
  return ContentService.createTextOutput(JSON.stringify(output)).setMimeType(ContentService.MimeType.JSON);
}

function getTodosDatos() {
  return {
    timestamp: new Date().toISOString(),
    ops:    getDatosOPs(),
    areas:  getDatosAreas(),
    curva:  getDatosCurvaS(),
    tareas: getDatosTareas(),
    produccion: getDatosProduccion(),     // v3
    historial: getDatosHistorial(),       // v4
    entregas: getDatosEntregas()          // v4.1
  };
}

function getDatosOPs() {
  var ss    = SpreadsheetApp.openById('1v55aTL923MTMVXU2iuxYMATP0LePk6tUFyYx1jMsLj4');
  var sheet = ss.getSheetByName('LOOKER_MAESTRA');
  var data  = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  var opsMap = {};
  var lastOp='', lastNombre='', lastCliente='', lastComercial='', lastEstadoOP='', lastSede='';
  var evid = _evidenciaPorFila(data);   // v4
  var finRealTerm = {};                 // v4: fin real de tareas Terminado por OP (para el semáforo)

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (row[2] && String(row[2]).trim() !== lastOp) lastEstadoOP = '';
    if (row[2])  lastOp        = String(row[2]).trim().replace(/\.0$/,'');
    if (row[3])  lastNombre    = String(row[3]).trim();
    if (row[4])  lastCliente   = String(row[4]).trim();
    if (row[5])  lastComercial = String(row[5]).trim();
    if (row[13]) lastSede      = String(row[13]).trim();
    if (row[38]) lastEstadoOP  = String(row[38]).trim();

    var area         = row[0]  || '';
    var estado       = row[16] || '';
    var cumplimiento = evid[i] ? (parseFloat(row[28]) || 0) : 0;   // v4: solo con evidencia

    if (!lastOp) continue;

    if (!opsMap[lastOp]) {
      opsMap[lastOp] = {
        op: lastOp, nombre: lastNombre, cliente: lastCliente, comercial: lastComercial,
        sede: lastSede,
        estado: lastEstadoOP, areas: [],
        tareas: { total:0, terminadas:0, enPausa:0, reproceso:0, abierto:0 },
        avanceReal: 0, cumplimiento: 0,
        fechaFinPlan: '', fechaFinReal: '', fechaFin: '',
        fechaEntregaCliente: ''
      };
    }
    if (!opsMap[lastOp].fechaEntregaCliente && row[39]) opsMap[lastOp].fechaEntregaCliente = _formatFecha(row[39]);   // v2
    if (lastNombre)    opsMap[lastOp].nombre    = lastNombre;
    if (lastCliente)   opsMap[lastOp].cliente   = lastCliente;
    if (lastComercial) opsMap[lastOp].comercial = lastComercial;
    if (lastSede)      opsMap[lastOp].sede      = lastSede;

    if (row[32] && row[32] instanceof Date) {
      var ffp = _formatFecha(row[32]);
      if (!opsMap[lastOp].fechaFinPlan) {
        opsMap[lastOp].fechaFinPlan = ffp; opsMap[lastOp].fechaFin = ffp;
      } else {
        var pp1=opsMap[lastOp].fechaFinPlan.split('/'), pp2=ffp.split('/');
        if (pp1.length===3&&pp2.length===3) {
          var dp1=new Date(parseInt(pp1[2]),parseInt(pp1[1])-1,parseInt(pp1[0]));
          var dp2=new Date(parseInt(pp2[2]),parseInt(pp2[1])-1,parseInt(pp2[0]));
          if (dp2>dp1){opsMap[lastOp].fechaFinPlan=ffp;opsMap[lastOp].fechaFin=ffp;}
        }
      }
    }
    if (estado === 'Terminado' && row[23] instanceof Date && row[23].getFullYear() >= 2000 &&
        (!finRealTerm[lastOp] || row[23] > finRealTerm[lastOp])) finRealTerm[lastOp] = row[23];   // v4
    if (row[23] && row[23] instanceof Date) {
      var ffr = _formatFecha(row[23]);
      if (!opsMap[lastOp].fechaFinReal) {
        opsMap[lastOp].fechaFinReal = ffr;
      } else {
        var pr1=opsMap[lastOp].fechaFinReal.split('/'), pr2=ffr.split('/');
        if (pr1.length===3&&pr2.length===3) {
          var dr1=new Date(parseInt(pr1[2]),parseInt(pr1[1])-1,parseInt(pr1[0]));
          var dr2=new Date(parseInt(pr2[2]),parseInt(pr2[1])-1,parseInt(pr2[0]));
          if (dr2>dr1) opsMap[lastOp].fechaFinReal=ffr;
        }
      }
    }

    var prioEstado={'Terminado':3,'En Progreso':2,'Sin Iniciar':1};
    var prioNuevo=prioEstado[lastEstadoOP]||0, prioActual=prioEstado[opsMap[lastOp].estado]||0;
    if (prioNuevo>prioActual) opsMap[lastOp].estado=lastEstadoOP;

    if (area && opsMap[lastOp].areas.indexOf(area)===-1) opsMap[lastOp].areas.push(area);

    if (!row[14]) continue;
    if (String(estado).trim() === 'No aplica') continue;   // v4.1: no cuenta como tarea
    opsMap[lastOp].tareas.total++;
    // v4.2: tareas cuya fecha fin planeada ya pasó (para el avance esperado a hoy)
    if (row[32] instanceof Date && row[32].getFullYear() >= 2000) {
      var hoySem = new Date(); hoySem.setHours(0,0,0,0);
      if (row[32] < hoySem) opsMap[lastOp]._debian = (opsMap[lastOp]._debian || 0) + 1;
    }
    if (estado==='Terminado')      opsMap[lastOp].tareas.terminadas++;
    else if (estado==='En pausa')  opsMap[lastOp].tareas.enPausa++;
    else if (estado==='Reproceso') opsMap[lastOp].tareas.reproceso++;
    else opsMap[lastOp].tareas.abierto++;

    if (cumplimiento>0) opsMap[lastOp].cumplimiento=cumplimiento;
  }

  for (var k in opsMap) {
    var t=opsMap[k].tareas;
    opsMap[k].avanceReal=t.total>0?Math.round((t.terminadas/t.total)*100):0;
    var maxPlanDate=null, maxRealDate=null;
    if (opsMap[k].fechaFinPlan){var pp=opsMap[k].fechaFinPlan.split('/');if(pp.length===3)maxPlanDate=new Date(parseInt(pp[2]),parseInt(pp[1])-1,parseInt(pp[0]));}
    // v4: el fin real que cuenta para el semáforo es el de tareas Terminado (lo proyectado no es real)
    if (finRealTerm[k]) maxRealDate=new Date(finRealTerm[k].getTime());
    opsMap[k].semaforo=_getSemaforo(opsMap[k].estado,maxPlanDate,maxRealDate,opsMap[k].avanceReal);
    _semaforoCompleto(opsMap[k], maxPlanDate);   // v4.2: avance vs plan y fecha de entrega
    delete opsMap[k]._debian;
  }
  return Object.values(opsMap);
}

function getDatosAreas() {
  var ss    = SpreadsheetApp.openById('1v55aTL923MTMVXU2iuxYMATP0LePk6tUFyYx1jMsLj4');
  var sheet = ss.getSheetByName('LOOKER_MAESTRA');
  var data  = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  var areasMap = {};
  var evid = _evidenciaPorFila(data);   // v4
  for (var i = 1; i < data.length; i++) {
    var row  = data[i];
    var area = row[0] || '';
    if (!area || !row[14]) continue;

    var estado       = row[16] || '';
    // v4: días real/plan de la eficiencia solo de tareas Terminado (lo demás es proyección)
    var diasReal     = estado === 'Terminado' ? (parseFloat(row[22]) || 0) : 0;
    var diasPlan     = estado === 'Terminado' ? (parseFloat(row[31]) || 0) : 0;
    var cumplimiento = evid[i] ? (parseFloat(row[28]) || 0) : 0;   // v4: solo con evidencia
    if (String(estado).trim() === 'No aplica') continue;           // v4.1: no cuenta como tarea

    if (!areasMap[area]) {
      areasMap[area]={area:area,tareas:{total:0,terminadas:0,enPausa:0,reproceso:0,abierto:0},diasReal:0,diasPlan:0,cumplimiento:[],avancePct:0};
    }
    areasMap[area].tareas.total++;
    if (estado==='Terminado')      areasMap[area].tareas.terminadas++;
    else if (estado==='En pausa')  areasMap[area].tareas.enPausa++;
    else if (estado==='Reproceso') areasMap[area].tareas.reproceso++;
    else areasMap[area].tareas.abierto++;
    if (diasReal>0) areasMap[area].diasReal+=diasReal;
    if (diasPlan>0) areasMap[area].diasPlan+=diasPlan;
    if (cumplimiento>0) areasMap[area].cumplimiento.push(cumplimiento);
  }

  return Object.values(areasMap).map(function(a) {
    var t=a.tareas;
    a.avancePct=t.total>0?Math.round((t.terminadas/t.total)*100):0;
    a.eficiencia=a.diasPlan>0?Math.round((a.diasPlan/Math.max(a.diasReal,a.diasPlan))*100):null;   // v4: null = sin tareas terminadas (antes 100)
    a.cumplimientoPromedio=a.cumplimiento.length>0?Math.round(a.cumplimiento.reduce(function(s,v){return s+v;},0)/a.cumplimiento.length*100):0;
    delete a.cumplimiento;
    return a;
  });
}

function getDatosTareas() {
  var ss    = SpreadsheetApp.openById('1v55aTL923MTMVXU2iuxYMATP0LePk6tUFyYx1jMsLj4');
  var sheet = ss.getSheetByName('LOOKER_MAESTRA');
  var data  = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  var result = [];
  var evid = _evidenciaPorFila(data);   // v4
  var lastOp='', lastNombreOP='', lastCliente='', lastComercial='';
  var lastArea='', lastMes='', lastEstadoOP='';
  var lastKgTotal=0, lastNumAreas=0;
  var lastSub='', lastKgSub=0, lastSede='';

  // ── FIX: función declarada FUERA del loop ──
  function esVacio(v){ return v===null||v===undefined||v===''; }
  function cN(v){ var n=parseFloat(v); return (isNaN(n)||!isFinite(n))?0:n; }
  function fF(v){
    if (!v) return '';
    if (v instanceof Date) return _formatFecha(v);
    var s = String(v).trim();
    // Filtrar fechas inválidas (año 1899/1900 = celda vacía en Sheets)
    if (s.indexOf('1899')!==-1 || s.indexOf('1900')!==-1) return '';
    return s;
  }

  for (var i = 1; i < data.length; i++) {
    var row = data[i];

    if (!esVacio(row[0]))  lastArea      = String(row[0]).trim();
    if (!esVacio(row[1]))  lastMes       = String(row[1]).trim();
    if (!esVacio(row[2]))  lastOp        = String(row[2]).trim().replace(/\.0$/,'');
    if (!esVacio(row[3]))  lastNombreOP  = String(row[3]).trim();
    if (!esVacio(row[4]))  lastCliente   = String(row[4]).trim();
    if (!esVacio(row[5]))  lastComercial = String(row[5]).trim();
    if (!esVacio(row[6]))  lastKgTotal   = cN(row[6]);
    if (!esVacio(row[7]))  lastNumAreas  = cN(row[7]);
    if (!esVacio(row[11])) lastSub       = String(row[11]).trim();
    if (!esVacio(row[12])) lastKgSub     = cN(row[12]);
    if (!esVacio(row[13])) lastSede      = String(row[13]).trim();
    if (!esVacio(row[38])) lastEstadoOP  = String(row[38]).trim();

    if (!lastOp) continue;
    if (esVacio(row[14])) continue;

    // Filtrar strings con errores de fórmula
    function cleanVal(v) {
      if (v===null||v===undefined||v==='') return '';
      var s=String(v);
      if (s.indexOf('#')=== 0) return ''; // #DIV/0!, #VALUE!, etc.
      return s;
    }

    result.push({
      area:          lastArea,
      mes:           lastMes,
      op:            lastOp,
      nombreOP:      lastNombreOP,
      cliente:       lastCliente,
      comercial:     lastComercial,
      kgTotal:       lastKgTotal,
      numAreas:      lastNumAreas,
      subEstructura: lastSub,
      pesoKgSub:     lastKgSub,
      sede:          lastSede,
      tarea:         String(row[14]).trim(),
      asignado:      cleanVal(row[15]),
      estado:        cleanVal(row[16]),
      pct:           Math.round(cN(row[17])*100),
      ejecucionSub:  cN(row[18]),
      kgAvance:      cN(row[19]),
      avanceRealPct: cN(row[20]),
      fechaIniReal:  fF(row[21]),
      durReal:       cN(row[22]),
      fechaFinReal:  fF(row[23]),
      durProcesoReal:cN(row[24]),
      pctTareaReal:  cN(row[25]),
      pctIndivReal:  cN(row[26]),
      pctAcumReal:   cN(row[27]),
      cumplimiento:  evid[i] ? Math.round(cN(row[28])*100) : '',   // v4: '' = sin avance registrado
      sinAvance:     !evid[i],                                      // v4
      observaciones: cleanVal(row[29]),
      fechaIniPlan:  fF(row[30]),
      durPlan:       cN(row[31]),
      fechaFinPlan:  fF(row[32]),
      durProcesoPlan:cN(row[33]),
      pctTareaPlan:  cN(row[34]),
      pctIndivPlan:  cN(row[35]),
      pctAcumPlan:   cN(row[36]),
      kpi:           cN(row[37]),
      estadoOP:      lastEstadoOP,
      fechaEntregaCliente: fF(row[39])          // v2
    });
  }
  return result;
}

function getDatosCurvaS() {
  var ss    = SpreadsheetApp.openById('1v55aTL923MTMVXU2iuxYMATP0LePk6tUFyYx1jMsLj4');
  var sheet = ss.getSheetByName('CURVA_S');
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  var result = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[1]) continue;
    result.push({
      semana: row[0],
      fecha:  _formatFecha(row[1]),
      planificado: Math.round((parseFloat(row[2]) || 0) * 100),
      real:        Math.round((parseFloat(row[3]) || 0) * 100)
    });
  }
  return result;
}

function _formatFecha(val) {
  if (!val) return '';
  if (val instanceof Date) return Utilities.formatDate(val, Session.getScriptTimeZone(), 'dd/MM/yyyy');
  return String(val);
}

/**
 * v4.2 — Completa el semáforo de la OP: además de la fecha final del plan
 * (_getSemaforo), revisa el avance esperado a hoy y la fecha de entrega.
 * Siempre se queda con el color más grave. Deja motivos y datos para la App.
 */
function _semaforoCompleto(o, maxPlanDate) {
  var tz = Session.getScriptTimeZone(), fmt = function(d) { return Utilities.formatDate(d, tz, 'dd/MM/yyyy'); };
  var hoy = new Date(); hoy.setHours(0,0,0,0);
  var total = o.tareas.total || 0, term = o.tareas.terminadas || 0, debian = o._debian || 0;
  var esperado = total ? Math.round(debian / total * 100) : 0, real = o.avanceReal || 0, brecha = esperado - real;
  var entrega = null;
  if (o.fechaEntregaCliente) { var pe = String(o.fechaEntregaCliente).split('/'); if (pe.length === 3) entrega = new Date(+pe[2], +pe[1] - 1, +pe[0]); }
  var datos = { total: total, terminadas: term, debian: debian, esperado: esperado, real: real, brecha: brecha,
                finPlan: maxPlanDate ? fmt(maxPlanDate) : '', entrega: entrega ? fmt(entrega) : '', diasPlanVencido: 0, diasEntrega: null };
  var motivos = [], nivel = { verde: 0, amarillo: 1, rojo: 2 }, peor = o.semaforo;
  var subir = function(color, txt) { motivos.push({ nivel: color, texto: txt }); if (peor !== 'sinplan' && nivel[color] > (nivel[peor] || 0)) peor = color; };

  if (o.estado === 'Terminado' || real >= 100) { o.semaforoMotivos = [{ nivel: 'verde', texto: 'OP terminada' }]; o.semaforoDatos = datos; return; }
  if (o.semaforo === 'sinplan') motivos.push({ nivel: 'sinplan', texto: 'No tiene fechas planeadas: no se puede medir si va al día' });

  if (maxPlanDate) {
    var dpv = Math.round((hoy - maxPlanDate) / 86400000);
    datos.diasPlanVencido = Math.max(0, dpv);
    if (dpv > 7) subir('rojo', 'El plan terminó el ' + fmt(maxPlanDate) + ' (hace ' + dpv + ' días) y la OP no ha terminado');
    else if (dpv > 0) subir('amarillo', 'El plan terminó el ' + fmt(maxPlanDate) + ' (hace ' + dpv + ' día' + (dpv === 1 ? '' : 's') + ')');
  }
  if ((o.semaforo === 'rojo' || o.semaforo === 'amarillo') && !motivos.length)
    motivos.push({ nivel: o.semaforo, texto: 'Las tareas terminadas acabaron después de la fecha planeada' });
  if (total && debian) {
    var txtB = debian + ' de ' + total + ' tareas debían estar terminadas a hoy y van ' + term + ' (esperado ' + esperado + '% · real ' + real + '%)';
    if (brecha >= 25) subir('rojo', txtB + ' → brecha de ' + brecha + ' puntos');
    else if (brecha >= 10) subir('amarillo', txtB + ' → brecha de ' + brecha + ' puntos');
  }
  if (entrega) {
    var de = Math.round((entrega - hoy) / 86400000);
    datos.diasEntrega = de;
    if (de < 0) subir('rojo', 'La entrega al cliente venció el ' + fmt(entrega) + ' (hace ' + (-de) + ' días)');
    if (maxPlanDate && maxPlanDate > entrega) subir('rojo', 'El cronograma termina el ' + fmt(maxPlanDate) + ', después de la entrega al cliente (' + fmt(entrega) + ')');
    if (de >= 0 && de <= 15 && real < 80) subir('amarillo', (de === 0 ? 'La entrega es HOY' : 'Faltan ' + de + ' día' + (de === 1 ? '' : 's') + ' para la entrega') + ' y el avance es ' + real + '%');
  }
  if (!motivos.length) motivos.push({ nivel: 'verde', texto: 'Avance acorde al plan' + (total && debian ? ': a hoy debían ir ' + debian + ' tareas terminadas y van ' + term : ' (todavía no vence ninguna tarea)') });
  o.semaforo = peor;
  o.semaforoMotivos = motivos;
  o.semaforoDatos = datos;
}

function _getSemaforo(estado, maxPlanDate, maxRealDate, avanceReal) {
  if (estado === 'Terminado' || avanceReal >= 100) return 'verde';
  // v4: sin fechas planeadas no se puede afirmar que va al día (antes: 'verde')
  if (!maxPlanDate) return 'sinplan';
  // v4: la OP no ha terminado, así que su fin es como mínimo HOY.
  //     Antes, sin fecha real, siempre salía 'verde' aunque el plan ya hubiera vencido.
  var hoy = new Date(); hoy.setHours(0,0,0,0);
  var finEfectivo = (maxRealDate && maxRealDate > hoy) ? maxRealDate : hoy;
  maxPlanDate.setHours(0,0,0,0);
  finEfectivo.setHours(0,0,0,0);
  var diasAtraso = Math.round((finEfectivo - maxPlanDate) / (1000*60*60*24));
  if (diasAtraso > 7)  return 'rojo';
  if (diasAtraso > 0)  return 'amarillo';
  return 'verde';
}

// ============================================================
//  v2 — COLUMNAS POR NOMBRE DE ENCABEZADO
// ============================================================
// Índice por defecto = posición antigua (sin FECHA_ENTREGA_CLIENTE),
// por si una hoja no trae encabezados.
var _COLS_DEFECTO = {
  'MES':0,'OP':1,'NOMBRE_OP':2,'CLIENTE':3,'COMERCIAL':4,'KG_TOTAL_PROYECTO':5,'NUM_PROCESOS':6,
  '%_PARTICIPACION_PROCESO':7,'%_PESO_SUBESTRUCTURA_PESO':8,'%_PROGRESO_POR_SUBESTRUCTURA':9,
  'NOMBRE_SUBESTRUCTURA':10,'PESO_KG_SUBESTRUCTURA':11,'SEDE':12,'DESCRIPCION_TAREAS':13,'ASIGNADO':14,
  'ESTADO':15,'%_APORTE_TAREA':16,'%_EJECUCION_SUBESTRUCTURA':17,'KG_AVANCE_ACUMULADO':18,'AVANCE_REAL_%':19,
  'FECHA_INICIO_TAREA_REAL':20,'DURACION_DIAS_TAREAS_REAL':21,'FECHA_FIN_TAREA_REAL':22,
  'DURACION_PROCESO_REAL_DIAS':23,'%_TAREA_REAL':24,'%_TAREAS_INDIVIDUALES_REAL':25,
  '%_TAREAS_ACUMULADO_REAL':26,'%_DE_CUMPLIMIENTO_VS_PLANEACION':27,'OBSERVACIONES':28,
  'FECHA_INICIO_TAREA_PLANEADO':29,'DURACION_DIAS_TAREAS_PLANEADO':30,'FECHA_FIN_TAREA_PLANEADO':31,
  'DURACION_PROCESO_PLANEADO_DIAS':32,'%_TAREA_PLANEADO':33,'%_TAREAS_INDIVIDUALES_PLANEADO':34,
  '%_TAREAS_ACUMULADO_PLANEADO':35
};

function _normEnc(v) {
  return String(v == null ? '' : v).split('\n')[0]
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toUpperCase().replace(/\s+/g, '').trim();
}

/** Devuelve {NOMBRE: índice} leyendo la fila de encabezados importada. */
function _mapaColumnas(filaEnc) {
  var mapa = {}, k;
  for (k in _COLS_DEFECTO) mapa[k] = _COLS_DEFECTO[k];
  var vistos = {};
  for (var c = 0; c < (filaEnc || []).length; c++) {
    var n = _normEnc(filaEnc[c]);
    if (n && vistos[n] === undefined) vistos[n] = c;
  }
  // v3.2: si el área tiene la columna FECHA_ENTREGA_CLIENTE, las posiciones por defecto
  // desde OBSERVACIONES+1 se corren 1. Así, si un encabezado no se encuentra (p. ej. la
  // importación aún llega solo hasta AJ), no se toma por error la columna vecina:
  // queda vacío en vez de mostrar un dato equivocado.
  var fe = vistos['FECHA_ENTREGA_CLIENTE'];
  for (k in _COLS_DEFECTO) {
    var kn = _normEnc(k);
    if (vistos[kn] !== undefined) mapa[k] = vistos[kn];
    else if (fe !== undefined && _COLS_DEFECTO[k] >= fe) mapa[k] = _COLS_DEFECTO[k] + 1;
  }
  if (fe !== undefined) mapa['FECHA_ENTREGA_CLIENTE'] = fe;
  return mapa;
}

/**
 * Una sola vez: cambia las importaciones de cada área de Cronograma!A5:AJ
 * a Cronograma!A5:AK, para no perder la última columna en las áreas que
 * ya tienen FECHA_ENTREGA_CLIENTE.
 */
function _ampliarImportacionesSilencioso(ss) {
  var hojas = ['DISEÑO','DIBUJO','PINTURA','COMPRAS','GALVANIZADO','LOGISTICA','MONTAJE','PRODUCCION','ADMINISTRACION','RRHH'];
  var ok = [];
  hojas.forEach(function(n) {
    var sh = ss.getSheetByName(n);
    if (!sh) return;
    var celda = sh.getRange('A1'), fx = celda.getFormula();
    if (/Cronograma!A5:AJ(?![A-Z0-9])/.test(fx)) {
      celda.setFormula(fx.replace(/Cronograma!A5:AJ(?![A-Z0-9])/, 'Cronograma!A5:AK'));
      ok.push(n);
    }
  });
  if (ok.length) Logger.log('Importaciones ampliadas a A5:AK: ' + ok.join(', '));
  return ok;
}

function ampliarImportaciones() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojas = ['DISEÑO','DIBUJO','PINTURA','COMPRAS','GALVANIZADO','LOGISTICA','MONTAJE','PRODUCCION','ADMINISTRACION','RRHH'];
  var ok = [], sin = [];
  hojas.forEach(function(n) {
    var sh = ss.getSheetByName(n);
    if (!sh) return;
    var celda = sh.getRange('A1'), fx = celda.getFormula();
    if (/Cronograma!A5:AJ(?![A-Z0-9])/.test(fx)) {
      celda.setFormula(fx.replace(/Cronograma!A5:AJ(?![A-Z0-9])/, 'Cronograma!A5:AK'));
      ok.push(n);
    } else {
      sin.push(n);
    }
  });
  SpreadsheetApp.getUi().alert('🔧 Importaciones',
    (ok.length ? '✅ Ampliadas a A5:AK: ' + ok.join(', ') : '') +
    (sin.length ? '\n\nℹ️ Sin cambio (ya estaban o tienen otro rango): ' + sin.join(', ') : ''),
    SpreadsheetApp.getUi().ButtonSet.OK);
}


// ============================================================
//  v3 — PRODUCCIÓN DIARIA (desde PLANTILLA_LOOKER_PRODUCCION_V2)
// ============================================================
// Si lo dejas vacío, el ID se toma del IMPORTRANGE de la hoja PRODUCCION.
var ID_PRODUCCION_V2 = '';
var HOJA_DIARIO = 'PRODUCCION_DIARIA';
var MESES_PROD = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];

function _idProduccionV2(ss) {
  if (ID_PRODUCCION_V2) return ID_PRODUCCION_V2;
  var sh = ss.getSheetByName('PRODUCCION');
  if (!sh) return '';
  var fx = sh.getRange('A1').getFormula();
  var m = fx.match(/\/d\/([a-zA-Z0-9_-]{20,})/) || fx.match(/IMPORTRANGE\(\s*"+([a-zA-Z0-9_-]{20,})"/i);
  return m ? m[1] : '';
}

/**
 * Lee las hojas "MES AÑO" de la V2 y deja una fila por día con kilos:
 * FECHA, OP, SUB_ID, SUBESTRUCTURA, PROYECTO, CLIENTE, COMERCIAL, LINEA_LOTE, KG_REAL, KG_PLAN, HOJA
 */
function actualizarProduccionDiaria(silencioso) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var id = _idProduccionV2(ss);
  if (!id) throw new Error('No encontré el ID de PRODUCCION_V2 (revisa la hoja PRODUCCION o ID_PRODUCCION_V2).');
  var src = SpreadsheetApp.openById(id);
  var filas = [['FECHA','OP','SUB_ID','SUBESTRUCTURA','PROYECTO','CLIENTE','COMERCIAL','LINEA_LOTE','KG_REAL','KG_PLAN','HOJA']];
  var hojasLeidas = 0;

  src.getSheets().forEach(function(sh) {
    var nm = sh.getName().match(/^([A-Z]+) (\d{4})$/);
    if (!nm || MESES_PROD.indexOf(nm[1]) < 0) return;
    var data = sh.getDataRange().getValues();
    if (data.length < 4) return;
    var fila2 = data[1], p = -1, n = 0;
    for (var c = 0; c < fila2.length; c++) { if (fila2[c] instanceof Date) { p = c; break; } }
    if (p < 0) return;
    while (p + n < fila2.length && fila2[p + n] instanceof Date) n++;
    var fin = data.length;
    for (var r = 2; r < data.length; r++) {
      if (String(data[r][2]).trim().toUpperCase() === 'TOTAL REAL INF. PRODUCCION') { fin = r; break; }
    }
    hojasLeidas++;
    for (var i = 2; i < fin; i++) {
      var etiqueta = String(data[i][2]).trim();
      var m = etiqueta.match(/^OP\.?\s*([^\s·]+)\s*(.*)$/i);
      if (!m) continue;
      var token = m[1], resto = m[2].replace(/^·\s*/, '').trim();
      var mm = token.match(/^(.+)_(\d+)$/);
      var op = mm ? mm[1] : token;
      var subNombre = mm ? resto : '';
      var plan = (i + 1 < fin && /^PLANEADO/i.test(String(data[i + 1][2]).trim())) ? data[i + 1] : null;
      var proyecto = String(data[i][5] || '').trim() || (mm ? '' : resto);
      for (var d = 0; d < n; d++) {
        var real = Number(data[i][p + d]) || 0, pl = plan ? (Number(plan[p + d]) || 0) : 0;
        if (!real && !pl) continue;
        filas.push([fila2[p + d], op, token, subNombre, proyecto, data[i][3], data[i][4], data[i][1], real, pl, sh.getName()]);
      }
    }
  });

  var dest = ss.getSheetByName(HOJA_DIARIO) || ss.insertSheet(HOJA_DIARIO);
  dest.clearContents();
  dest.getRange(1, 1, filas.length, filas[0].length).setValues(filas);
  dest.getRange(1, 1, 1, filas[0].length).setBackground('#4a86e8').setFontColor('white').setFontWeight('bold');
  if (filas.length > 1) {
    dest.getRange(2, 1, filas.length - 1, 1).setNumberFormat('dd/mm/yyyy');
    dest.getRange(2, 9, filas.length - 1, 2).setNumberFormat('#,##0.00');
  }
  dest.setFrozenRows(1);

  var msg = '🏭 Producción diaria: ' + (filas.length - 1) + ' registros de ' + hojasLeidas + ' hoja/s de mes.';
  Logger.log(msg);
  if (silencioso !== true) { try { SpreadsheetApp.getUi().alert(msg); } catch (e) {} }
  return msg;
}

function getDatosProduccion() {
  var ss = SpreadsheetApp.openById('1v55aTL923MTMVXU2iuxYMATP0LePk6tUFyYx1jMsLj4');
  var sh = ss.getSheetByName(HOJA_DIARIO);
  if (!sh) return [];
  var data = sh.getDataRange().getValues(), out = [];
  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    if (!(r[0] instanceof Date)) continue;
    out.push({
      fecha: _formatFecha(r[0]), op: String(r[1]).trim().replace(/\.0$/, ''), subId: String(r[2]).trim(),
      sub: String(r[3] || '').trim(), proyecto: String(r[4] || '').trim(), cliente: String(r[5] || '').trim(),
      comercial: String(r[6] || '').trim(), linea: String(r[7] || '').trim(),
      real: Number(r[8]) || 0, plan: Number(r[9]) || 0
    });
  }
  return out;
}


// ============================================================
//  v3.1 — Número que llegó como fecha → número otra vez
// ============================================================
// En Sheets una fecha es un número de días desde 30/12/1899. Si una celda
// numérica tiene formato de fecha, getValues() la entrega como Date:
// 1 → 31/12/1899, 19 → 18/01/1900. Aquí se recupera el número original.
var _EPOCA_SHEETS = new Date(1899, 11, 30).getTime();
function _num(v) {
  if (v instanceof Date) {
    var n = (v.getTime() - _EPOCA_SHEETS) / 86400000;
    return Math.round(n * 1e6) / 1e6;
  }
  return v;
}


var ID_MAESTRA = '1v55aTL923MTMVXU2iuxYMATP0LePk6tUFyYx1jMsLj4';

// ============================================================
//  v4 — PROTECCIÓN DE FECHAS, HISTORIAL DE CAMBIOS Y NOTIFICACIONES
// ============================================================
//  Acuerdos de la reunión:
//   • La FECHA FIN REAL de una tarea "Terminado" es línea base: no se puede
//     cambiar su inicio real, duración real, fin real ni sacarla de Terminado.
//     El cambio se REVIERTE y queda registrado (salvo usuarios autorizados).
//   • La FECHA_ENTREGA_CLIENTE es línea base comercial: solo cambia desde la
//     macro de Comercial ("Editar OP"). Si un área la cambia, se revierte.
//   • Todo cambio importante queda en HISTORIAL_CAMBIOS (solo consulta) y los
//     críticos se notifican por correo en un resumen cada 15 minutos.
//  Instalación: menú 🛡 Instalar protección (una vez, con la cuenta dueña).
// ------------------------------------------------------------

// Correos que SÍ pueden corregir fechas protegidas (el cambio igual queda registrado).
var AUTORIZADOS_FECHAS = [
  // 'gerencia@polyuprotec.com',
];
var HOJA_HISTORIAL   = 'HISTORIAL_CAMBIOS';
var HOJA_LINEA_BASE  = 'LINEA_BASE';
var HOJA_CRONO_AREA  = 'Cronograma';
var FILA_ENC_AREA    = 5;          // encabezados del Cronograma de cada área
var FILA_INI_AREA    = 6;          // primera fila de datos
var CORREO_CAMBIOS_ACTIVO = true;  // false = solo historial, sin correo
var URL_NOTIFICAR_CAMBIOS = 'https://torredecontrol.polypro.space/torre_de_control_v2/notificar_cambios.php';
var TOKEN_CORREO_CAMBIOS  = 'CONFIGURAR_AQUI';   // igual que TOKEN en el PHP
var HOJAS_IMPORT_AREAS = ['DISEÑO','DIBUJO','PINTURA','COMPRAS','GALVANIZADO','LOGISTICA','MONTAJE','PRODUCCION','ADMINISTRACION','RRHH'];

var ENC_HISTORIAL = ['FECHA_HORA','USUARIO','CORREO','OP','AREA','SUBESTRUCTURA','TAREA','CAMPO',
                     'VALOR_ANTERIOR','VALOR_NUEVO','TIPO','DETALLE','CELDA','NOTIFICAR','NOTIFICADO'];
var ENC_LINEA_BASE = ['CLAVE','AREA','OP','SUB','TAREA','ESTADO','INI_REAL','INI_REAL_FX',
                      'DUR_REAL','DUR_REAL_FX','FIN_REAL','FIN_REAL_FX','ENTREGA','CAPTURA'];

// Campos que se vigilan en el Cronograma de las áreas (por nombre de encabezado)
var CAMPOS_VIGILADOS = {
  ESTADO:   { enc: 'ESTADO',                        nombre: 'Estado',                 notificar: true  },
  INI_REAL: { enc: 'FECHA_INICIO_TAREA_REAL',       nombre: 'Fecha inicio real',      notificar: true  },
  DUR_REAL: { enc: 'DURACION_DIAS_TAREAS_REAL',     nombre: 'Duración real',          notificar: true  },
  FIN_REAL: { enc: 'FECHA_FIN_TAREA_REAL',          nombre: 'Fecha fin real',         notificar: true  },
  ENTREGA:  { enc: 'FECHA_ENTREGA_CLIENTE',         nombre: 'Fecha de entrega',       notificar: true  },
  INI_PLAN: { enc: 'FECHA_INICIO_TAREA_PLANEADO',   nombre: 'Fecha inicio planeada',  notificar: true  },
  DUR_PLAN: { enc: 'DURACION_DIAS_TAREAS_PLANEADO', nombre: 'Duración planeada',      notificar: true  },
  KG:       { enc: 'KG_AVANCE_ACUMULADO',           nombre: 'KG avance',              notificar: false }
};

// ── Instalación ──────────────────────────────────────────────
function instalarProteccion() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), ui = SpreadsheetApp.getUi();
  var areas = _idsAreasProtegidas(ss);
  var ids = Object.keys(areas);
  if (!ids.length) { ui.alert('❌ No encontré los archivos de las áreas en las hojas de importación.'); return; }

  ScriptApp.getProjectTriggers().forEach(function(t) {
    var f = t.getHandlerFunction();
    if (f === '_alEditarArea' || f === '_tareaProgramadaCambios') ScriptApp.deleteTrigger(t);
  });
  var ok = [], err = [];
  ids.forEach(function(id) {
    try { ScriptApp.newTrigger('_alEditarArea').forSpreadsheet(id).onEdit().create(); ok.push(areas[id]); }
    catch (e) { err.push(areas[id] + ': ' + e.message); }
  });
  ScriptApp.newTrigger('_tareaProgramadaCambios').timeBased().everyMinutes(15).create();
  PropertiesService.getScriptProperties().setProperty('AREAS_PROTEGIDAS', JSON.stringify(areas));

  _hojaHistorial(ss); _hojaLineaBase(ss);
  var n = _capturarLineaBase(ss, false);
  ui.alert('🛡 Protección instalada',
    '✅ Vigilando: ' + ok.join(', ') + (err.length ? '\n\n⚠ Sin vigilar:\n' + err.join('\n') : '') +
    '\n\n📌 Línea base capturada: ' + n + ' tareas.\n🕒 Resumen de cambios por correo cada 15 min' +
    (CORREO_CAMBIOS_ACTIVO ? '.' : ' (apagado).'), ui.ButtonSet.OK);
}

function desinstalarProteccion() {
  var n = 0;
  ScriptApp.getProjectTriggers().forEach(function(t) {
    var f = t.getHandlerFunction();
    if (f === '_alEditarArea' || f === '_tareaProgramadaCambios') { ScriptApp.deleteTrigger(t); n++; }
  });
  SpreadsheetApp.getUi().alert('Protección desinstalada (' + n + ' activadores eliminados). El historial se conserva.');
}

function verHistorialCambios() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.setActiveSheet(_hojaHistorial(ss));
}

/** {idArchivo: 'AREA'} leído del IMPORTRANGE de cada hoja de importación. */
function _idsAreasProtegidas(ss) {
  var out = {};
  HOJAS_IMPORT_AREAS.forEach(function(n) {
    var sh = ss.getSheetByName(n);
    if (!sh) return;
    var fx = sh.getRange('A1').getFormula();
    var m = fx.match(/\/d\/([a-zA-Z0-9_-]{20,})/) || fx.match(/IMPORTRANGE\(\s*"+([a-zA-Z0-9_-]{20,})"/i);
    if (m) out[m[1]] = n;
  });
  return out;
}

function _hojaHistorial(ss) {
  var sh = ss.getSheetByName(HOJA_HISTORIAL);
  if (!sh) {
    sh = ss.insertSheet(HOJA_HISTORIAL);
    sh.getRange(1, 1, 1, ENC_HISTORIAL.length).setValues([ENC_HISTORIAL])
      .setFontWeight('bold').setBackground('#2b2b40').setFontColor('#ffffff');
    sh.setFrozenRows(1);
    _protegerHoja(sh, 'Historial de cambios — solo lo escribe el script (solo consulta)');
  }
  return sh;
}

function _hojaLineaBase(ss) {
  var sh = ss.getSheetByName(HOJA_LINEA_BASE);
  if (!sh) {
    sh = ss.insertSheet(HOJA_LINEA_BASE);
    sh.getRange(1, 1, 1, ENC_LINEA_BASE.length).setValues([ENC_LINEA_BASE]).setFontWeight('bold');
    sh.setFrozenRows(1);
    _protegerHoja(sh, 'Línea base de fechas protegidas — solo lo escribe el script');
    try { sh.hideSheet(); } catch (e) {}
  }
  return sh;
}

function _protegerHoja(sh, desc) {
  try {
    var p = sh.protect().setDescription(desc);
    var yo = Session.getEffectiveUser();
    p.addEditor(yo);
    p.removeEditors(p.getEditors().filter(function(u) { return u.getEmail() !== yo.getEmail(); }));
    if (p.canDomainEdit()) p.setDomainEdit(false);
  } catch (e) { Logger.log('No se pudo proteger ' + sh.getName() + ': ' + e.message); }
}

// ── Lectura del Cronograma de un área ────────────────────────
/** Índices (1-based) de los campos vigilados + B (OP), K (sub), N (tarea). */
function _columnasArea(sh) {
  var enc = sh.getRange(FILA_ENC_AREA, 1, 1, sh.getLastColumn()).getDisplayValues()[0];
  var cols = { OP: 2, SUB: 11, TAREA: 14 };
  var vistos = {};
  enc.forEach(function(h, i) { var n = _normEnc(h); if (n && vistos[n] === undefined) vistos[n] = i + 1; });
  Object.keys(CAMPOS_VIGILADOS).forEach(function(k) {
    var c = vistos[_normEnc(CAMPOS_VIGILADOS[k].enc)];
    if (c) cols[k] = c;
  });
  if (vistos['OP']) cols.OP = vistos['OP'];
  if (vistos['NOMBRE_SUBESTRUCTURA']) cols.SUB = vistos['NOMBRE_SUBESTRUCTURA'];
  if (vistos['DESCRIPCION_TAREAS']) cols.TAREA = vistos['DESCRIPCION_TAREAS'];
  return cols;
}

/** Identidad de cada fila (desde FILA_INI_AREA hasta hasta): {op, sub, subN, tarea, tN, clave}. */
function _identidadFilas(sh, cols, area, hasta) {
  var n = hasta - FILA_INI_AREA + 1;
  if (n <= 0) return [];
  var w = Math.max(cols.OP, cols.SUB, cols.TAREA);
  var v = sh.getRange(FILA_INI_AREA, 1, n, w).getValues();
  var out = [], op = '', sub = '', subN = -1, tN = 0;
  for (var i = 0; i < n; i++) {
    var vOp = String(v[i][cols.OP - 1]).trim().replace(/\.0$/, '');
    if (vOp) { op = vOp; subN = -1; }
    var vSub = String(v[i][cols.SUB - 1]).trim();
    if (vSub) { sub = vSub; subN++; tN = 0; } else { tN++; }
    var tarea = String(v[i][cols.TAREA - 1]).trim();
    out.push({ op: op, sub: sub, subN: subN, tarea: tarea, tN: tN,
               clave: area + '|' + op + '|' + subN + '|' + tN + '|' + tarea });
  }
  return out;
}

function _esFechaValida(v) { return v instanceof Date && !isNaN(v.getTime()) && v.getFullYear() >= 2000; }

function _txtValor(v) {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return _esFechaValida(v) ? Utilities.formatDate(v, Session.getScriptTimeZone(), 'dd/MM/yyyy') : '';
  if (typeof v === 'number') return String(Math.round(v * 10000) / 10000);
  return String(v);
}

/** e.oldValue llega como texto: serial de fecha, número o texto. */
function _valorDesdeOld(txt, esFecha) {
  if (txt === undefined || txt === null) return '';
  var s = String(txt).trim();
  if (s === '') return '';
  if (esFecha) {
    if (/^\d+(\.\d+)?$/.test(s)) return new Date(Math.round((Number(s) - 25569) * 86400000) + new Date().getTimezoneOffset() * 60000);
    var m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  }
  if (!isNaN(Number(s))) return Number(s);
  return s;
}

// ── Línea base ───────────────────────────────────────────────
/** Lee la línea base: {clave: {fila, ...}} */
function _leerLineaBase(ss) {
  var sh = _hojaLineaBase(ss), last = sh.getLastRow(), out = {};
  if (last < 2) return out;
  var v = sh.getRange(2, 1, last - 1, ENC_LINEA_BASE.length).getValues();
  v.forEach(function(r, i) {
    out[r[0]] = { fila: i + 2, area: r[1], op: r[2], sub: r[3], tarea: r[4], estado: r[5],
      iniReal: r[6], iniRealFx: r[7], durReal: r[8], durRealFx: r[9], finReal: r[10], finRealFx: r[11],
      entrega: r[12] };
  });
  return out;
}

/** Fila protegida = Terminado con fin real válido en la línea base. */
function _bloqueada(b) { return !!(b && String(b.estado).trim() === 'Terminado' && _esFechaValida(b.finReal)); }

/**
 * Recorre todas las áreas y deja en LINEA_BASE el estado, las fechas reales
 * (valor y fórmula) y la fecha de entrega de cada tarea. Si registrar=true,
 * anota en el historial lo que cambió por fuera de la vigilancia (macros,
 * pegados múltiples sin valor anterior, etc.).
 */
function _capturarLineaBase(ss, registrar) {
  var areas = _idsAreasProtegidas(ss), base = registrar ? _leerLineaBase(ss) : {};
  var filas = [], eventos = [], ahora = new Date(), entregasOP = {}, vistosEnt = {};
  Object.keys(areas).forEach(function(id) {
    var area = areas[id], sh;
    try { sh = SpreadsheetApp.openById(id).getSheetByName(HOJA_CRONO_AREA); } catch (e) { return; }
    if (!sh || sh.getLastRow() < FILA_INI_AREA) return;
    var cols = _columnasArea(sh), last = sh.getLastRow();
    var ids = _identidadFilas(sh, cols, area, last);
    var w = sh.getLastColumn(), rg = sh.getRange(FILA_INI_AREA, 1, last - FILA_INI_AREA + 1, w);
    var v = rg.getValues(), fx = rg.getFormulas();
    var g = function(i, k) { return cols[k] ? v[i][cols[k] - 1] : ''; };
    var gf = function(i, k) { return cols[k] ? fx[i][cols[k] - 1] : ''; };
    ids.forEach(function(it, i) {
      if (!it.op || !it.tarea) return;
      var ent = g(i, 'ENTREGA');
      // Cada fila guarda SOLO su propio valor (no se propaga a filas vacías)
      var nueva = [it.clave, area, it.op, it.sub, it.tarea, g(i, 'ESTADO'), g(i, 'INI_REAL'), gf(i, 'INI_REAL'),
                   g(i, 'DUR_REAL'), gf(i, 'DUR_REAL'), g(i, 'FIN_REAL'), gf(i, 'FIN_REAL'),
                   _esFechaValida(ent) ? ent : '', ahora];
      filas.push(nueva);
      if (_esFechaValida(nueva[12])) {
        var k = it.op; entregasOP[k] = entregasOP[k] || {};
        entregasOP[k][_txtValor(nueva[12])] = (entregasOP[k][_txtValor(nueva[12])] || []).concat(area);
      }
      var b = base[it.clave];
      if (registrar && b) {
        if (_bloqueada(b) && _txtValor(b.finReal) !== _txtValor(nueva[10]))
          eventos.push(_evento('Sistema (sin valor anterior)', '', it.op, area, it.sub, it.tarea, 'Fecha fin real',
            b.finReal, nueva[10], 'Cambio detectado en revisión', 'El cambio no pasó por la vigilancia (macro, pegado múltiple o archivo sin vigilar).', '', true));
        if (_txtValor(b.entrega) !== _txtValor(nueva[12]) && _esFechaValida(b.entrega) && !vistosEnt[it.op + '|' + area] && (vistosEnt[it.op + '|' + area] = true))
          eventos.push(_evento('Sistema (revisión)', '', it.op, area, it.sub, it.tarea, 'Fecha de entrega',
            b.entrega, nueva[12], 'Cambio de línea base comercial', 'Detectado en la revisión periódica (normalmente: Editar OP en Comercial).', '', true));
      }
    });
  });
  var sh = _hojaLineaBase(ss);
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, ENC_LINEA_BASE.length).clearContent();
  if (filas.length) sh.getRange(2, 1, filas.length, ENC_LINEA_BASE.length).setValues(filas);
  // Diferencias de fecha de entrega entre áreas (p. ej. OP 4101) → alerta una sola vez por combinación
  if (registrar) {
    var props = PropertiesService.getScriptProperties(), vistas = JSON.parse(props.getProperty('DIF_ENTREGA') || '{}');
    Object.keys(entregasOP).forEach(function(op) {
      var fechas = Object.keys(entregasOP[op]);
      if (fechas.length < 2) { delete vistas[op]; return; }
      var firma = fechas.sort().join('|');
      if (vistas[op] === firma) return;
      vistas[op] = firma;
      eventos.push(_evento('Sistema (revisión)', '', op, fechas.map(function(f) { return entregasOP[op][f].join(', '); }).join(' / '), '', '',
        'Fecha de entrega', '', fechas.join(' ≠ '), 'Diferencia entre áreas',
        'Las áreas tienen fechas de entrega distintas. Corregir desde Comercial con Editar OP.', '', true));
    });
    props.setProperty('DIF_ENTREGA', JSON.stringify(vistas));
  }
  if (eventos.length) _escribirHistorial(ss, eventos);
  return filas.length;
}

// ── Vigilancia de ediciones (activador instalable onEdit de cada área) ──
function _alEditarArea(e) {
  if (!e || !e.range) return;
  var sh = e.range.getSheet();
  if (sh.getName() !== HOJA_CRONO_AREA) return;
  var r1 = e.range.getRow(), nr = e.range.getNumRows(), c1 = e.range.getColumn(), nc = e.range.getNumColumns();
  if (r1 + nr - 1 < FILA_INI_AREA) return;
  var cols = _columnasArea(sh);
  var tocados = Object.keys(CAMPOS_VIGILADOS).filter(function(k) { return cols[k] && cols[k] >= c1 && cols[k] < c1 + nc; });
  if (!tocados.length) return;

  var lock = LockService.getScriptLock();
  try { lock.waitLock(20000); } catch (er) {}
  try {
    var ssM = SpreadsheetApp.openById(ID_MAESTRA);
    var areas = JSON.parse(PropertiesService.getScriptProperties().getProperty('AREAS_PROTEGIDAS') || '{}');
    var area = areas[e.source.getId()] || e.source.getName();
    var correo = '';
    try { correo = (e.user && e.user.getEmail && e.user.getEmail()) || ''; } catch (er) {}
    var usuario = correo ? correo.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, function(l) { return l.toUpperCase(); }) : 'Usuario externo';
    var autorizado = correo && AUTORIZADOS_FECHAS.map(function(x) { return x.toLowerCase(); }).indexOf(correo.toLowerCase()) !== -1;
    var unaCelda = (nr === 1 && nc === 1);
    var r0 = Math.max(r1, FILA_INI_AREA), rN = r1 + nr - 1;
    var ids = _identidadFilas(sh, cols, area, rN);
    var base = _leerLineaBase(ssM);
    var eventos = [], cambiosBase = [];
    SpreadsheetApp.flush();

    for (var r = r0; r <= rN; r++) {
      var it = ids[r - FILA_INI_AREA];
      if (!it || !it.op) continue;
      var b = base[it.clave], bloq = _bloqueada(b);
      var celda = function(k) { return sh.getRange(r, cols[k]); };
      tocados.forEach(function(k) {
        var campo = CAMPOS_VIGILADOS[k], c = celda(k);
        var nuevo = c.getValue();
        var esFecha = (k === 'INI_REAL' || k === 'FIN_REAL' || k === 'ENTREGA' || k === 'INI_PLAN');
        // valor anterior: e.oldValue (una sola celda) o línea base
        var ant = unaCelda ? _valorDesdeOld(e.oldValue, esFecha)
                : (b ? ({ ESTADO: b.estado, INI_REAL: b.iniReal, DUR_REAL: b.durReal, FIN_REAL: b.finReal, ENTREGA: b.entrega })[k] : '');
        if (ant === undefined) ant = '';
        if (_txtValor(ant) === _txtValor(nuevo)) return;

        var protegido = false, motivo = '';
        if (k === 'ENTREGA') { protegido = true; motivo = 'La fecha de entrega es línea base comercial: solo cambia desde Comercial (Editar OP).'; }
        else if (bloq && (k === 'INI_REAL' || k === 'DUR_REAL' || k === 'FIN_REAL')) { protegido = true; motivo = 'La tarea está Terminado: su fecha fin real es línea base.'; }
        else if (bloq && k === 'ESTADO' && String(nuevo).trim() !== 'Terminado') { protegido = true; motivo = 'La tarea está Terminado: no se puede sacar de Terminado.'; }
        else if (k === 'ESTADO' && (String(nuevo).trim() === 'No aplica' || String(ant).trim() === 'No aplica')) { protegido = true; motivo = 'Solo Comercial marca o quita "No aplica" (menú 🧩 Tareas de la OP).'; }   // v4.1

        if (protegido && !autorizado) {
          // Revertir: fórmula de la línea base si la había; si no, el valor anterior.
          var fxBase = b ? ({ INI_REAL: b.iniRealFx, DUR_REAL: b.durRealFx, FIN_REAL: b.finRealFx })[k] : '';
          var valBase = b ? ({ ESTADO: b.estado, INI_REAL: b.iniReal, DUR_REAL: b.durReal, FIN_REAL: b.finReal, ENTREGA: b.entrega })[k] : '';
          var restaurar = unaCelda ? ant : valBase;
          var revertido = true;
          if (fxBase) c.setFormula(fxBase);                                   // fórmula original (p. ej. fin real)
          else if (unaCelda || b) c.setValue(restaurar === undefined ? '' : restaurar);   // valor anterior (puede ser vacío)
          else revertido = false;                                             // pegado múltiple sin línea base
          eventos.push(_evento(usuario, correo, it.op, area, it.sub, it.tarea, campo.nombre, ant, nuevo,
            revertido ? 'Intento bloqueado' : 'Cambio protegido sin revertir',
            motivo + (revertido ? ' Se restauró el valor anterior.' : ' No había valor anterior para restaurarlo: revisar.'),
            _a1(r, cols[k]), true));
        } else {
          eventos.push(_evento(usuario, correo, it.op, area, it.sub, it.tarea, campo.nombre, ant, nuevo,
            protegido ? 'Cambio autorizado' : (k === 'ESTADO' && String(nuevo).trim() === 'Terminado' ? 'Terminación registrada' : 'Cambio permitido'),
            protegido ? 'Usuario autorizado para corregir fechas protegidas.' : '', _a1(r, cols[k]), campo.notificar || protegido));
          cambiosBase.push(r);
        }
      });
    }
    // Las filas que cambiaron legítimamente actualizan su línea base (p. ej. al quedar Terminado)
    if (cambiosBase.length) { SpreadsheetApp.flush(); _actualizarBaseFilas(ssM, sh, cols, area, ids, cambiosBase, base); }
    if (eventos.length) _escribirHistorial(ssM, eventos);
  } finally {
    try { lock.releaseLock(); } catch (er) {}
  }
}

function _actualizarBaseFilas(ssM, sh, cols, area, ids, filas, base) {
  var shB = _hojaLineaBase(ssM), ahora = new Date(), nuevas = [];
  var unicas = filas.filter(function(x, i) { return filas.indexOf(x) === i; });
  unicas.forEach(function(r) {
    var it = ids[r - FILA_INI_AREA]; if (!it) return;
    var get = function(k) { return cols[k] ? sh.getRange(r, cols[k]).getValue() : ''; };
    var getf = function(k) { return cols[k] ? sh.getRange(r, cols[k]).getFormula() : ''; };
    var b = base[it.clave];
    var fila = [it.clave, area, it.op, it.sub, it.tarea, get('ESTADO'), get('INI_REAL'), getf('INI_REAL'),
                get('DUR_REAL'), getf('DUR_REAL'), get('FIN_REAL'), getf('FIN_REAL'),
                _esFechaValida(get('ENTREGA')) ? get('ENTREGA') : '', ahora];
    if (b && b.fila) shB.getRange(b.fila, 1, 1, fila.length).setValues([fila]);
    else nuevas.push(fila);
  });
  if (nuevas.length) shB.getRange(shB.getLastRow() + 1, 1, nuevas.length, ENC_LINEA_BASE.length).setValues(nuevas);
}

function _a1(r, c) {
  var s = '', n = c;
  while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s + r;
}

function _evento(usuario, correo, op, area, sub, tarea, campo, ant, nuevo, tipo, detalle, celda, notificar) {
  return [new Date(), usuario, correo || '', op, area, sub, tarea, campo, _txtValor(ant), _txtValor(nuevo),
          tipo, detalle || '', celda || '', notificar ? 'SI' : 'NO', ''];
}

function _escribirHistorial(ss, eventos) {
  var sh = _hojaHistorial(ss);
  sh.getRange(sh.getLastRow() + 1, 1, eventos.length, ENC_HISTORIAL.length).setValues(eventos);
  sh.getRange(2, 1, Math.max(1, sh.getLastRow() - 1), 1).setNumberFormat('dd/mm/yyyy hh:mm');
}

// ── Tarea programada (cada 15 min): revisión de línea base + correo resumen ──
function _tareaProgramadaCambios() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return;
  try {
    var ss = SpreadsheetApp.openById(ID_MAESTRA);
    _capturarLineaBase(ss, true);
    _enviarResumenCambios(ss);
  } finally { lock.releaseLock(); }
}

function _enviarResumenCambios(ss) {
  if (!CORREO_CAMBIOS_ACTIVO) return 0;
  var sh = _hojaHistorial(ss), last = sh.getLastRow();
  if (last < 2) return 0;
  var v = sh.getRange(2, 1, last - 1, ENC_HISTORIAL.length).getValues();
  var pend = [], filas = [];
  v.forEach(function(r, i) {
    if (r[13] === 'SI' && !r[14]) {
      pend.push({ fecha: r[0] instanceof Date ? Utilities.formatDate(r[0], Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm') : String(r[0]),
        usuario: r[1], correo: r[2], op: String(r[3]), area: r[4], sub: r[5], tarea: r[6], campo: r[7],
        anterior: r[8], nuevo: r[9], tipo: r[10], detalle: r[11] });
      filas.push(i + 2);
    }
  });
  if (!pend.length) return 0;
  var resp = UrlFetchApp.fetch(URL_NOTIFICAR_CAMBIOS, {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    payload: JSON.stringify({ token: TOKEN_CORREO_CAMBIOS, cambios: pend.slice(0, 200) })
  });
  var ok = false;
  try { ok = resp.getResponseCode() === 200 && JSON.parse(resp.getContentText()).ok === true; } catch (e) {}
  if (!ok) { Logger.log('Correo de cambios no enviado: ' + resp.getResponseCode() + ' ' + resp.getContentText()); return 0; }
  var ahora = new Date();
  filas.slice(0, 200).forEach(function(f) { sh.getRange(f, 15).setValue(ahora).setNumberFormat('dd/mm/yyyy hh:mm'); });
  return Math.min(pend.length, 200);
}

/** Para probar el correo sin esperar los 15 minutos. */
function probarCorreoCambios() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  _escribirHistorial(ss, [_evento('Prueba', Session.getEffectiveUser().getEmail(), '0000', 'PRUEBA', '—', 'Prueba de correo',
    'Fecha fin real', '01/01/2026', '02/01/2026', 'Prueba', 'Correo de prueba del historial de cambios.', '', true)]);
  var n = _enviarResumenCambios(ss);
  SpreadsheetApp.getUi().alert(n ? '✅ Correo de prueba enviado.' : '⚠ No se envió. Revisa URL_NOTIFICAR_CAMBIOS, TOKEN y el PHP (Ver > Registros).');
}

// ── API: historial (solo lectura) ────────────────────────────
function getDatosHistorial() {
  var ss = SpreadsheetApp.openById(ID_MAESTRA);
  var sh = ss.getSheetByName(HOJA_HISTORIAL);
  if (!sh || sh.getLastRow() < 2) return [];
  var last = sh.getLastRow(), n = Math.min(1000, last - 1);
  var v = sh.getRange(last - n + 1, 1, n, ENC_HISTORIAL.length).getValues();
  return v.reverse().map(function(r) {
    return { fecha: r[0] instanceof Date ? Utilities.formatDate(r[0], Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm') : String(r[0]),
      usuario: String(r[1]), correo: String(r[2]), op: String(r[3]).replace(/\.0$/, ''), area: String(r[4]),
      sub: String(r[5]), tarea: String(r[6]), campo: String(r[7]), anterior: String(r[8]), nuevo: String(r[9]),
      tipo: String(r[10]), detalle: String(r[11]) };
  });
}

// ── v4: evidencia de avance real por OP|área|subestructura ──
/** true para cada fila de LOOKER_MAESTRA cuya subestructura tiene evidencia real
 *  (alguna tarea Terminado/Reproceso o KG avance > 0). Sin evidencia, el
 *  cumplimiento no se informa (antes salía 100% con fechas copiadas del plan). */
function _evidenciaPorFila(data) {
  var ev = {}, claves = [], op = '', sub = '', area = '';
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (row[0]) area = String(row[0]).trim();
    if (row[2] && String(row[2]).trim().replace(/\.0$/, '') !== op) { op = String(row[2]).trim().replace(/\.0$/, ''); sub = ''; }
    if (row[11] !== '' && row[11] !== null && row[11] !== undefined) sub = String(row[11]).trim();
    var k = op + '|' + area + '|' + sub;
    claves[i] = k;
    var est = String(row[16] || '').trim();
    if (est === 'Terminado' || est === 'Reproceso' || (parseFloat(row[19]) || 0) > 0) ev[k] = true;
  }
  return claves.map(function(k) { return !!ev[k]; });
}


// ============================================================
//  v4.1 — CUMPLIMIENTO DE ENTREGA AL CLIENTE (datos de Comercial)
// ============================================================
// ID del archivo PLANTILLA_LOOKER_COMERCIAL (lo que va entre /d/ y /edit en su enlace).
// ⚠ Verifica que sea exactamente el de tu enlace.
var ID_COMERCIAL = '1VkjXI8Ghur28ecCtOrphfZIe3sAOW2qFenv2qC8jSUg';

function getDatosEntregas() {
  var out = { configurado: !!ID_COMERCIAL, error: '', entregas: [] };
  if (!ID_COMERCIAL) { out.error = 'Falta ID_COMERCIAL en la Maestra'; return out; }
  var ss;
  try { ss = SpreadsheetApp.openById(ID_COMERCIAL); } catch (e) { out.error = 'No se pudo abrir el archivo de Comercial: ' + e.message; return out; }
  var tz = Session.getScriptTimeZone();
  var f = function(v) { return (v instanceof Date && v.getFullYear() >= 2000) ? Utilities.formatDate(v, tz, 'dd/MM/yyyy') : ''; };
  var reprog = {};
  var shR = ss.getSheetByName('REPROGRAMACIONES_ENTREGA');
  if (shR && shR.getLastRow() > 1) {
    shR.getRange(2, 1, shR.getLastRow() - 1, 8).getValues().forEach(function(r) {
      var op = String(r[2]).trim().replace(/\.0$/, '');
      if (!op) return;
      (reprog[op] = reprog[op] || []).push({ fecha: r[0] instanceof Date ? Utilities.formatDate(r[0], tz, 'dd/MM/yyyy HH:mm') : String(r[0]),
        usuario: String(r[1]), anterior: f(r[3]), nueva: f(r[4]), dias: r[5] === '' ? null : Number(r[5]), motivo: String(r[6]), comentario: String(r[7]) });
    });
  }
  var sh = ss.getSheetByName('ENTREGAS_CLIENTE');
  if (!sh) { out.error = 'Comercial todavía no tiene la hoja ENTREGAS_CLIENTE (menú 📅 Preparar registro de entregas)'; return out; }
  if (sh.getLastRow() < 2) return out;
  var porOP = {};   // v4.3: una sola fila por OP
  sh.getRange(2, 1, sh.getLastRow() - 1, 11).getValues().forEach(function(r) {
    var op = String(r[0]).trim().replace(/\.0$/, '');
    if (!op || op.charAt(0) === '#') return;                       // v4.3: sin OP o con error (#REF!)
    var previa = porOP[op];
    if (previa !== undefined && previa.real && !f(r[7])) return;   // ya hay una con entrega real
    if (previa !== undefined) out.entregas.splice(previa.i, 1);
    porOP[op] = { i: out.entregas.length, real: !!f(r[7]) };
    out.entregas.push({ op: op, nombre: String(r[1]), cliente: String(r[2]), comercial: String(r[3]),
      original: f(r[4]), vigente: f(r[5]), reprogramaciones: parseInt(r[6], 10) || 0,
      real: f(r[7]), observacion: String(r[8] || ''), registradaPor: String(r[9] || ''),
      reprog: reprog[op] || [] });
  });
  return out;
}
