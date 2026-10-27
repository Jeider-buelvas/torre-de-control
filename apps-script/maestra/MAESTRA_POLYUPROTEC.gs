// CODIGO DE TORRE_CONTROL_MAESTRA_POLYUPROTEC — v3.1
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
    .addToUi();
}

function actualizarLookerMaestra() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
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
    produccion: getDatosProduccion()      // v3
  };
}

function getDatosOPs() {
  var ss    = SpreadsheetApp.openById('1v55aTL923MTMVXU2iuxYMATP0LePk6tUFyYx1jMsLj4');
  var sheet = ss.getSheetByName('LOOKER_MAESTRA');
  var data  = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  var opsMap = {};
  var lastOp='', lastNombre='', lastCliente='', lastComercial='', lastEstadoOP='', lastSede='';

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
    var cumplimiento = parseFloat(row[28]) || 0;

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
    opsMap[lastOp].tareas.total++;
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
    if (opsMap[k].fechaFinReal){var rp=opsMap[k].fechaFinReal.split('/');if(rp.length===3)maxRealDate=new Date(parseInt(rp[2]),parseInt(rp[1])-1,parseInt(rp[0]));}
    opsMap[k].semaforo=_getSemaforo(opsMap[k].estado,maxPlanDate,maxRealDate,opsMap[k].avanceReal);
  }
  return Object.values(opsMap);
}

function getDatosAreas() {
  var ss    = SpreadsheetApp.openById('1v55aTL923MTMVXU2iuxYMATP0LePk6tUFyYx1jMsLj4');
  var sheet = ss.getSheetByName('LOOKER_MAESTRA');
  var data  = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  var areasMap = {};
  for (var i = 1; i < data.length; i++) {
    var row  = data[i];
    var area = row[0] || '';
    if (!area || !row[14]) continue;

    var estado       = row[16] || '';
    var diasReal     = parseFloat(row[22]) || 0;
    var diasPlan     = parseFloat(row[31]) || 0;
    var cumplimiento = parseFloat(row[28]) || 0;

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
    a.eficiencia=a.diasPlan>0?Math.round((a.diasPlan/Math.max(a.diasReal,a.diasPlan))*100):100;
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
      cumplimiento:  Math.round(cN(row[28])*100),
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

function _getSemaforo(estado, maxPlanDate, maxRealDate, avanceReal) {
  if (estado === 'Terminado' || avanceReal >= 100) return 'verde';
  if (!maxPlanDate) return 'verde';
  if (maxRealDate) {
    maxPlanDate.setHours(0,0,0,0);
    maxRealDate.setHours(0,0,0,0);
    var diasAtraso = Math.round((maxRealDate - maxPlanDate) / (1000*60*60*24));
    if (diasAtraso > 7)  return 'rojo';
    if (diasAtraso > 0)  return 'amarillo';
    return 'verde';
  }
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
  for (k in _COLS_DEFECTO) {
    var kn = _normEnc(k);
    if (vistos[kn] !== undefined) mapa[k] = vistos[kn];
  }
  if (vistos['FECHA_ENTREGA_CLIENTE'] !== undefined) mapa['FECHA_ENTREGA_CLIENTE'] = vistos['FECHA_ENTREGA_CLIENTE'];
  return mapa;
}

/**
 * Una sola vez: cambia las importaciones de cada área de Cronograma!A5:AJ
 * a Cronograma!A5:AK, para no perder la última columna en las áreas que
 * ya tienen FECHA_ENTREGA_CLIENTE.
 */
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
