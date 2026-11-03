// CODIGO DE PLANTILLA_LOOKER_PRODUCCION_V2 — v4.3 (fusionada)
//
// v4.3:
//  - Si "Entrega en negro" de una subestructura está en "No aplica" (lo marca
//    Comercial), la sincronización diaria no la toca.
//
// v4.2:
//  - Línea base: si la tarea "Entrega en negro" ya está Terminado y tiene una
//    fecha de inicio real válida, la sincronización ya no le cambia el inicio
//    real ni la duración real (su fecha fin real queda fija). Si está Terminado
//    pero SIN inicio válido (caso 01/01/1900 → 31.023 días), se sigue corrigiendo
//    como en v4.1. El KG sigue subiendo como antes.
//
// v4.1:
//  - Una fecha anterior al año 2000 (p. ej. 01/01/1900 de una celda de inicio
//    real vacía) se trata como vacía en la sincronización. Antes se tomaba como
//    fecha válida y la duración real salía en ~31.000 días (caso OP 4103).
//
// v4 (auditoría):
//  - La sincronización diaria ya no baja datos digitados a mano por Producción:
//    no pasa un "Terminado" a "Abierto", no reduce el KG avance, no reemplaza
//    una fecha de inicio real más temprana ni acorta la duración.
//  - Al programar UNA subestructura de una O.P con varias, el bloque toma el
//    peso de esa subestructura (antes tomaba el total de la O.P).
//
//
// v3:
//  - Hoja "Cronograma" estándar (igual a las demás áreas) dentro de esta V2:
//    comercial la crea/edita con su macro y la MAESTRA la importa igual que
//    las otras áreas → la Torre de Control PHP la ve sin cambios.
//  - El formulario CREACIÓ_DE_O.P toma la OP de las que envió COMERCIAL
//    (lista desplegable) y llena solo nombre, cliente, comercial y peso.
//  - Hojas del mes: un bloque OP / PLANEADO / DIFERENCIA por SUBESTRUCTURA
//    ("OP 4027_1 · LA MINA").
//  - 🔄 Sincronizar diario → Cronograma: suma los kilos reales reportados
//    en todos los meses y llena, en la tarea "Entrega en negro" de cada
//    subestructura: KG_AVANCE_ACUMULADO, FECHA_INICIO_TAREA_REAL,
//    DURACION_DIAS_TAREAS_REAL y ESTADO (Abierto / Terminado).
//    Corte, Armado, Soldadura y Calidad siguen con estado manual.
//  - 🧹 Borrar de los meses las OP que no vienen de comercial (pruebas).
//

/**
 * ============================================================
 *  TORRE DE CONTROL – CREACIÓN DE O.P  (Google Apps Script)
 * ============================================================
 *  Qué hace:
 *   1. Lee los datos de la hoja "CREACIÓ_DE_O.P" (formulario).
 *   2. Por cada mes marcado crea (si no existe) la hoja "MES AÑO"
 *      p. ej. "ENERO 2026", con la misma estructura de
 *      "4. REVISION DE PROYECTOS": encabezados, todos los días del
 *      mes según el año, y el bloque fijo de totales / semanas.
 *   3. Agrega la O.P como bloque de 3 filas (OP / PLANEADO /
 *      DIFERENCIA) DEBAJO de la última O.P de esa hoja; el bloque
 *      de totales y REAL SEMANA / PLANEADO SEMANA / REAL-PLANEADO /
 *      CUMPLIMIENTO SEMANA siempre queda fijo al final.
 *
 *  Instalación: Extensiones > Apps Script > pegar este código >
 *  Guardar > recargar la hoja. Aparece el menú "Torre de Control".
 * ============================================================
 */

const CONFIG = {
  HOJA_FORMULARIO: 'CREACIÓ_DE_O.P',
  HOJA_CRONO: 'Cronograma',                 // v3: cronograma estándar del área
  FILA_ENC_CRONO: 5,                        // fila de encabezados del Cronograma
  FILA_INI_CRONO: 6,                        // primera fila de datos del Cronograma
  TAREA_KG: 'Entrega en negro',             // tarea que recibe los kilos diarios
  // Archivo de donde se copia el Cronograma la primera vez (PLANTILLA_LOOKER_PRODUCCION)
  ID_PLANTILLA_PRODUCCION: '1fPNU8AEwnI591RXr6zfuhDwQ8Ry7u1zqMVkoet6ySyA',
  FILA_INICIO: 3,                 // primera fila de O.P en la hoja del mes
  // true = incluye columnas K..S del original (galvanizado, pintado,
  // soldadores, auxiliares, operarios, APU...) antes de los días.
  // false = los días empiezan justo después de PENDIENTE.
  INCLUIR_COLUMNAS_EXTRA: false,
  DIA_INICIO_SEMANA: 5,           // 0=dom 1=lun ... 5=vie  (semanas viernes→jueves)
  MIN_DIAS_SEMANA: 4,             // semanas sueltas de menos días se unen a la vecina
  TRABAJA_SABADO: true,           // sábado cuenta como día hábil
  CODIGO_FORMATO: 'F-02-P001-I',
  TITULO: 'PRODUCCION BOGOTA',
  COLOR: {
    titulo: '#d9d9d9',
    linea: '#fabf8f',
    noHabil: '#efefef',
    resumen: '#fff2cc',
    semana: '#d9d9d9'
  }
};

const MESES = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO',
  'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];

const ENCABEZADOS_BASE = ['', 'PROYECTO', 'CLIENTE', 'COMERCIAL', 'DESCRIPCION',
  'PESO KILOS PLANEADOS', 'KG EMITIDOS A FABRICACION', 'REPORTE A LA FECHA', 'PENDIENTE'];
const ENCABEZADOS_EXTRA = ['PESO REAL GALVANIZADO', 'PESO REAL PINTADO', 'SOLDADORES',
  'AUXILIARES', 'OPERARIOS', 'Presupuesto APU mensual', 'Días de fabricación', '',
  'Presupuesto MO de ejecución'];

// Columnas fijas (1 = A)
const COL = { LINEA: 2, PROYECTO: 3, CLIENTE: 4, COMERCIAL: 5, DESCRIPCION: 6,
  PESO: 7, EMITIDOS: 8, REPORTE: 9, PENDIENTE: 10 };

const ETQ_TOTAL_REAL = 'TOTAL REAL INF. PRODUCCION';

// ------------------------------------------------------------
//  MENÚ
// ------------------------------------------------------------
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🏗️ Torre de Control')
    .addItem('📤 Enviar / Crear O.P', 'enviarOP')
    .addItem('🔄 Sincronizar diario → Cronograma', 'sincronizarDiarioACronograma')
    .addSeparator()
    .addItem('🔁 Actualizar lista de OP del formulario', 'actualizarListasFormulario')
    .addItem('⚙️ Configurar formulario (Año y campos)', 'configurarFormulario')
    .addItem('🧹 Borrar de los meses las OP que no vienen de comercial', 'limpiarOPsSinComercial')
    .addSeparator()
    .addItem('🔗 Preparar Cronograma (una sola vez)', 'prepararCronograma')
    .addItem('⏱ Activar sincronización automática (cada hora)', 'activarSincronizacionAutomatica')
    .addItem('❓ Ayuda', 'mostrarAyuda')
    .addToUi();
  try { actualizarListasFormulario(true); } catch (e) {}
}

// ------------------------------------------------------------
//  ACCIÓN PRINCIPAL (asígnala también a un botón/dibujo)
// ------------------------------------------------------------
function enviarOP() {
  const ui = SpreadsheetApp.getUi();
  const lock = LockService.getDocumentLock();
  if (!lock.tryLock(20000)) {
    ui.alert('Otra persona está creando una O.P en este momento. Intenta de nuevo.');
    return;
  }
  try {
    const ss = SpreadsheetApp.getActive();
    const form = leerFormulario_(ss);

    const errores = validar_(form);
    if (errores.length) {
      ui.alert('⚠ Faltan datos', errores.join('\n'), ui.ButtonSet.OK);
      return;
    }

    // v3: la OP debe venir de comercial (Cronograma) → un bloque por subestructura
    const crono = leerCronograma_(ss);
    const opC = crono.ops[form.op];
    if (!opC) {
      ui.alert('⚠ OP no encontrada', 'La OP ' + form.op + ' no está en la hoja "' + CONFIG.HOJA_CRONO + '".\n\n' +
        'Primero comercial debe enviarla a Producción (📤 Enviar / Actualizar OP en Áreas).', ui.ButtonSet.OK);
      return;
    }
    const subs = subsElegidas_(opC, form.sub);
    if (!subs.length) { ui.alert('⚠ No encontré la subestructura "' + form.sub + '" en la OP ' + form.op + '.'); return; }

    const creadas = [], agregadas = [], duplicadas = [];
    form.meses.forEach(function (mes) {
      const nombre = nombreHoja_(form.anio, mes);
      let sh = ss.getSheetByName(nombre);
      if (!sh) {
        sh = construirHojaMes_(ss, form.anio, mes);
        creadas.push(nombre);
      }
      subs.forEach(function (sub) {
        const token = form.op + '_' + sub.n;
        const etiqueta = nombre + ' · ' + token;
        if (existeOP_(sh, token)) { duplicadas.push(etiqueta); return; }
        agregarOP_(sh, {
          linea: form.linea, op: token, nombre: '· ' + sub.nombre,
          cliente: form.cliente || opC.cliente, comercial: form.comercial || opC.comercial,
          descripcion: form.descripcion || opC.nombre,
          // v4: el peso del formulario solo se usa si la O.P tiene UNA subestructura;
          // si tiene varias, cada bloque lleva el peso de SU subestructura (antes se
          // ponía el total de la O.P al escoger una sola subestructura).
          peso: (opC.subs.length === 1 && form.peso) ? form.peso : sub.kg
        });
        agregadas.push(etiqueta);
      });
    });

    if (agregadas.length) limpiarFormulario_(ss, form);

    let msg = '';
    if (agregadas.length) msg += '✅ O.P ' + form.op + ' agregada en:\n   ' + agregadas.join('\n   ') + '\n';
    if (creadas.length) msg += '🆕 Hojas nuevas creadas: ' + creadas.join(', ') + '\n';
    if (duplicadas.length) msg += '⚠ La O.P ' + form.op + ' ya existía (no se repitió) en: ' + duplicadas.join(', ');
    ui.alert('Resultado', msg.trim(), ui.ButtonSet.OK);
  } finally {
    lock.releaseLock();
  }
}

// ------------------------------------------------------------
//  FORMULARIO
// ------------------------------------------------------------
const CAMPOS = {
  'numero de op': 'op', 'n de op': 'op', 'numero op': 'op',
  'nombre del proyecto': 'nombre',
  'linea/lote': 'linea', 'linea / lote': 'linea',
  'comercial responsable': 'comercial',
  'ano': 'anio', 'anio': 'anio', 'ano de produccion': 'anio',
  'cliente': 'cliente',
  'descripcion': 'descripcion',
  'peso kilos planeados': 'peso', 'peso kilos planeados kg': 'peso',
  'subestructura': 'sub', 'subestructuras': 'sub'          // v3
};
const MESES_NORM = MESES.map(function (m) { return norm_(m); });

function norm_(s) {
  return String(s == null ? '' : s)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9\/ ]/g, '').replace(/\s+/g, ' ').trim();
}

function hojaFormulario_(ss) {
  const sh = ss.getSheetByName(CONFIG.HOJA_FORMULARIO);
  if (!sh) throw new Error('No encuentro la hoja "' + CONFIG.HOJA_FORMULARIO + '". Revisa CONFIG.HOJA_FORMULARIO.');
  return sh;
}

/** Lee el formulario buscando las etiquetas (no depende de filas fijas). */
function leerFormulario_(ss) {
  const sh = hojaFormulario_(ss);
  const data = sh.getDataRange().getValues();
  const form = { celdas: {}, meses: [], celdasMes: [] };
  const marcados = {};

  for (let r = 0; r < data.length; r++) {
    for (let c = 0; c < data[r].length - 1; c++) {
      const etq = norm_(data[r][c]);
      if (!etq) continue;
      const campo = CAMPOS[etq];
      if (campo && !(campo in form.celdas)) {
        form[campo] = data[r][c + 1];
        form.celdas[campo] = { fila: r + 1, col: c + 2 };
        continue;
      }
      const mi = MESES_NORM.indexOf(etq);
      if (mi >= 0 && typeof data[r][c + 1] === 'boolean') {
        form.celdasMes.push({ fila: r + 1, col: c + 2 });
        if (data[r][c + 1] === true) marcados[mi] = true;
      }
    }
  }
  form.meses = Object.keys(marcados).map(Number).sort(function (a, b) { return a - b; });

  // Limpieza de valores
  form.op = String(form.op == null ? '' : form.op).replace(/^\s*o\.?\s*p\.?\s*/i, '').trim();
  form.nombre = String(form.nombre || '').trim();
  form.linea = String(form.linea || '').trim();
  form.comercial = String(form.comercial || '').trim();
  form.cliente = String(form.cliente || '').trim();
  form.descripcion = String(form.descripcion || '').trim();
  form.peso = Number(form.peso) || 0;
  form.sub = String(form.sub || '').trim();                  // v3
  const a = parseInt(form.anio, 10);
  form.anio = a > 2000 && a < 2100 ? a : null;
  form.tieneCampoAnio = 'anio' in form.celdas;
  return form;
}

function validar_(f) {
  const e = [];
  if (!f.op) e.push('• Número de OP');
  if (!f.nombre) e.push('• Nombre del Proyecto');
  if (!f.linea) e.push('• Línea/Lote');
  // v3: el comercial se toma del Cronograma si el campo está vacío
  if (!f.tieneCampoAnio) e.push('• No existe el campo "Año". Usa el menú Torre de Control > Configurar formulario.');
  else if (!f.anio) e.push('• Año');
  if (!f.meses.length) e.push('• Marca al menos un mes de producción');
  return e;
}

function limpiarFormulario_(ss, f) {
  const sh = hojaFormulario_(ss);
  ['op', 'nombre', 'cliente', 'descripcion', 'peso'].forEach(function (k) {
    const c = f.celdas[k];
    if (c) sh.getRange(c.fila, c.col).clearContent();
  });
  f.celdasMes.forEach(function (c) { sh.getRange(c.fila, c.col).setValue(false); });
}

/** Agrega al formulario los campos Año, Cliente, Descripción y Peso si no existen. */
function configurarFormulario() {
  const ss = SpreadsheetApp.getActive();
  const sh = hojaFormulario_(ss);
  const form = leerFormulario_(ss);
  const ref = form.celdas.comercial;
  if (!ref) {
    SpreadsheetApp.getUi().alert('No encontré la etiqueta "Comercial Responsable" en el formulario.');
    return;
  }
  const nuevos = [
    { k: 'anio', etq: 'Año', obligatorio: true },
    { k: 'sub', etq: 'Subestructura' },
    { k: 'cliente', etq: 'Cliente' },
    { k: 'descripcion', etq: 'Descripción' },
    { k: 'peso', etq: 'Peso Kilos Planeados' }
  ].filter(function (n) { return !(n.k in form.celdas); });

  if (!nuevos.length) {
    SpreadsheetApp.getUi().alert('El formulario ya tiene todos los campos. ✅');
    return;
  }

  const filaRef = ref.fila, colEtq = ref.col - 1, colVal = ref.col;
  sh.insertRowsAfter(filaRef, nuevos.length);
  const anioActual = new Date().getFullYear();

  nuevos.forEach(function (n, i) {
    const fila = filaRef + 1 + i;
    sh.getRange(filaRef, colEtq, 1, 3).copyFormatToRange(sh, colEtq, colEtq + 2, fila, fila);
    sh.getRange(fila, colEtq).setValue(n.etq);
    const celda = sh.getRange(fila, colVal);
    celda.clearDataValidations().clearContent();
    if (n.k === 'anio') {
      const anios = [];
      for (let y = anioActual - 1; y <= anioActual + 4; y++) anios.push(String(y));
      celda.setDataValidation(SpreadsheetApp.newDataValidation()
        .requireValueInList(anios, true).setAllowInvalid(false).build());
      celda.setValue(String(anioActual));
    } else if (n.k === 'peso') {
      celda.setDataValidation(SpreadsheetApp.newDataValidation()
        .requireNumberGreaterThanOrEqualTo(0).setAllowInvalid(false).build());
      celda.setNumberFormat('#,##0');
    }
    sh.getRange(fila, colVal + 1).setValue(n.obligatorio ? '⚠ Obligatorio' : 'Opcional');
  });

  SpreadsheetApp.getUi().alert('Campos agregados: ' + nuevos.map(function (n) { return n.etq; }).join(', '));
}

function mostrarAyuda() {
  SpreadsheetApp.getUi().alert('Cómo usar',
    '1. Llena los datos de la O.P en "' + CONFIG.HOJA_FORMULARIO + '" (Año incluido).\n' +
    '2. Marca uno o varios meses de producción.\n' +
    '3. Torre de Control > Enviar / Crear O.P (o el botón ENVIAR).\n\n' +
    '• Si la hoja del mes (ej. "ENERO 2026") no existe, se crea con todos los días del mes.\n' +
    '• Si ya existe, la O.P se agrega debajo de la última, y el bloque de totales y\n' +
    '  REAL SEMANA / PLANEADO SEMANA / CUMPLIMIENTO queda fijo al final.\n' +
    '• Una O.P no se repite dos veces en el mismo mes.',
    SpreadsheetApp.getUi().ButtonSet.OK);
}

// ------------------------------------------------------------
//  CALENDARIO (días, semanas, festivos de Colombia)
// ------------------------------------------------------------
function nombreHoja_(anio, mes) { return MESES[mes] + ' ' + anio; }

function pascua_(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4,
    f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3),
    h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4,
    l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
    mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(y, mes - 1, dia);
}

/** Festivos de Colombia (Ley 51 de 1983 / Ley Emiliani). Devuelve Set "m-d" (m 0-based). */
function festivosColombia_(y) {
  const set = {};
  const k = function (d) { return d.getMonth() + '-' + d.getDate(); };
  const add = function (d) { set[k(d)] = true; };
  const lunes = function (d) {
    const dow = d.getDay();
    if (dow !== 1) d.setDate(d.getDate() + ((8 - dow) % 7));
    return d;
  };
  const mas = function (d, n) { const x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; };

  [[0, 1], [4, 1], [6, 20], [7, 7], [11, 8], [11, 25]].forEach(function (p) { add(new Date(y, p[0], p[1])); });
  [[0, 6], [2, 19], [5, 29], [7, 15], [9, 12], [10, 1], [10, 11]].forEach(function (p) { add(lunes(new Date(y, p[0], p[1]))); });
  const p = pascua_(y);
  add(mas(p, -3)); add(mas(p, -2));               // Jueves y Viernes Santo
  add(mas(p, 43)); add(mas(p, 64)); add(mas(p, 71)); // Ascensión, Corpus, Sagrado Corazón
  return set;
}

/** Calcula columnas, días hábiles y semanas de un mes. */
function calcularLayout_(anio, mes) {
  const extras = CONFIG.INCLUIR_COLUMNAS_EXTRA ? ENCABEZADOS_EXTRA.length : 0;
  const dias = new Date(anio, mes + 1, 0).getDate();
  const fest = festivosColombia_(anio);
  const info = [];
  let habil = 0;
  for (let d = 1; d <= dias; d++) {
    const f = new Date(anio, mes, d), dow = f.getDay();
    const laborable = dow !== 0 && (CONFIG.TRABAJA_SABADO || dow !== 6) && !fest[mes + '-' + d];
    if (laborable) habil++;
    info.push({ dia: d, dow: dow, laborable: laborable, habil: laborable ? habil : 0 });
  }
  // Semanas (viernes→jueves por defecto); se unen fragmentos cortos
  let semanas = [];
  info.forEach(function (x) {
    if (x.dia === 1 || x.dow === CONFIG.DIA_INICIO_SEMANA) semanas.push({ ini: x.dia, fin: x.dia });
    else semanas[semanas.length - 1].fin = x.dia;
  });
  const largo = function (s) { return s.fin - s.ini + 1; };
  if (semanas.length > 1 && largo(semanas[0]) < CONFIG.MIN_DIAS_SEMANA) {
    semanas[1].ini = semanas[0].ini; semanas.shift();
  }
  const n = semanas.length;
  if (n > 1 && largo(semanas[n - 1]) < CONFIG.MIN_DIAS_SEMANA) {
    semanas[n - 2].fin = semanas[n - 1].fin; semanas.pop();
  }
  const primerDia = COL.PENDIENTE + 1 + extras;
  return {
    anio: anio, mes: mes, dias: dias, info: info, totalHabiles: habil, semanas: semanas,
    extras: extras, primerDia: primerDia, ultimoDia: primerDia + dias - 1,
    colTotal: primerDia + dias, colEtiqueta: primerDia + dias + 1
  };
}

function letra_(n) {
  let s = '';
  while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

/** Recupera el layout de una hoja de mes ya existente leyendo la fila 2. */
function layoutDeHoja_(sh) {
  const fila2 = sh.getRange(2, 1, 1, sh.getLastColumn()).getValues()[0];
  let primera = -1;
  for (let c = 0; c < fila2.length; c++) {
    if (fila2[c] instanceof Date) { primera = c; break; }
  }
  if (primera < 0) throw new Error('La hoja "' + sh.getName() + '" no tiene la fila de días en la fila 2.');
  // Año/mes desde el nombre de la hoja ("ENERO 2026"); si no, desde el día 15 (evita desfases de zona horaria)
  const m = sh.getName().match(/^([A-Z]+) (\d{4})$/);
  let anio, mes;
  if (m && MESES.indexOf(m[1]) >= 0) { anio = Number(m[2]); mes = MESES.indexOf(m[1]); }
  else { const f = fila2[Math.min(primera + 14, fila2.length - 1)]; anio = f.getFullYear(); mes = f.getMonth(); }
  const lay = calcularLayout_(anio, mes);
  // por si la hoja se creó con otra configuración de columnas extra
  const delta = (primera + 1) - lay.primerDia;
  lay.primerDia += delta; lay.ultimoDia += delta; lay.colTotal += delta; lay.colEtiqueta += delta;
  lay.extras += delta;
  return lay;
}

function indiceParaHoja_(ss, anio, mes) {
  const clave = anio * 12 + mes;
  const hojas = ss.getSheets();
  let idx = hojas.length, mejorMenor = -1;
  hojas.forEach(function (h, i) {
    const m = h.getName().match(/^([A-Z]+) (\d{4})$/);
    if (!m) return;
    const mi = MESES.indexOf(m[1]);
    if (mi < 0) return;
    const k = Number(m[2]) * 12 + mi;
    if (k < clave && k > mejorMenor) { mejorMenor = k; idx = i + 1; }
    if (k > clave && mejorMenor < 0 && i < idx) idx = i;
  });
  return idx;
}

// ------------------------------------------------------------
//  HOJA DEL MES
// ------------------------------------------------------------
function construirHojaMes_(ss, anio, mes) {
  const lay = calcularLayout_(anio, mes);
  const sh = ss.insertSheet(nombreHoja_(anio, mes), indiceParaHoja_(ss, anio, mes));
  const nCols = lay.colEtiqueta + 1;
  if (sh.getMaxColumns() < nCols) sh.insertColumnsAfter(sh.getMaxColumns(), nCols - sh.getMaxColumns());
  if (sh.getMaxRows() < 40) sh.insertRowsAfter(sh.getMaxRows(), 40 - sh.getMaxRows());
  sh.setHiddenGridlines(true);

  // --- Fila 1: título + nombre de semanas
  sh.getRange(1, COL.PROYECTO, 1, COL.PENDIENTE - COL.PROYECTO + 1).merge()
    .setValue(CONFIG.TITULO + ' ' + MESES[mes] + ' ' + anio)
    .setFontSize(18).setFontWeight('bold').setHorizontalAlignment('center')
    .setVerticalAlignment('middle').setBackground(CONFIG.COLOR.titulo)
    .setBorder(true, true, true, true, null, null, '#000000', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  lay.semanas.forEach(function (s) {
    sh.getRange(1, lay.primerDia + s.ini - 1, 1, s.fin - s.ini + 1).merge()
      .setValue('SEMANA DEL ' + dos_(s.ini) + ' AL ' + dos_(s.fin) + ' DE ' + MESES[mes] + ' DE ' + anio)
      .setFontSize(9).setFontWeight('bold').setWrap(true).setHorizontalAlignment('center')
      .setVerticalAlignment('middle').setBackground(CONFIG.COLOR.semana)
      .setBorder(true, true, true, true, null, null);
  });
  sh.setRowHeight(1, 42);

  // --- Fila 2: encabezados + días
  const enc = ENCABEZADOS_BASE.concat(CONFIG.INCLUIR_COLUMNAS_EXTRA ? ENCABEZADOS_EXTRA : []);
  // si la hoja trae extras de otra configuración, se ajusta aquí (normalmente 0)
  for (let d = 1; d <= lay.dias; d++) {
    enc.push(d === 1 ? '=DATE(' + anio + ',' + (mes + 1) + ',1)' : '=' + letra_(lay.primerDia + d - 2) + '2+1');
  }
  enc.push('TOTAL');
  sh.getRange(2, COL.LINEA, 1, enc.length).setValues([enc])
    .setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('bottom')
    .setWrap(true).setBorder(true, true, true, true, true, null);
  sh.getRange(2, lay.primerDia, 1, lay.dias).setNumberFormat('ddd dd').setVerticalAlignment('middle');
  const bg2 = [lay.info.map(function (x) { return x.laborable ? '#ffffff' : CONFIG.COLOR.noHabil; })];
  sh.getRange(2, lay.primerDia, 1, lay.dias).setBackgrounds(bg2);
  sh.getRange(2, COL.LINEA, 1, enc.length)
    .setBorder(null, null, true, null, null, null, '#000000', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  sh.setRowHeight(2, 52);

  // --- Anchos
  sh.setColumnWidth(1, 15);
  sh.setColumnWidth(COL.LINEA, 60);
  sh.setColumnWidth(COL.PROYECTO, 230);
  sh.setColumnWidth(COL.CLIENTE, 200);
  sh.setColumnWidth(COL.COMERCIAL, 150);
  sh.setColumnWidth(COL.DESCRIPCION, 240);
  sh.setColumnWidths(COL.PESO, 4 + lay.extras, 115);
  sh.setColumnWidths(lay.primerDia, lay.dias, 78);
  sh.setColumnWidth(lay.colTotal, 100);
  sh.setColumnWidth(lay.colEtiqueta, 115);

  // --- Fila separadora + bloque resumen fijo
  const sep = CONFIG.FILA_INICIO;
  escribirResumen_(sh, lay, sep);

  sh.setFrozenRows(2);
  sh.setFrozenColumns(COL.PROYECTO);
  return sh;
}

function dos_(n) { return (n < 10 ? '0' : '') + n; }

/**
 * Bloque fijo al final (debajo de la fila separadora `sep`):
 * totales, % desviación, acumulado, día hábil, proyección y semanas.
 */
function escribirResumen_(sh, lay, sep) {
  const s = sep + 1;                  // primera fila del resumen
  const ini = CONFIG.FILA_INICIO;     // los rangos incluyen la fila separadora para crecer solos
  const R = { REAL: 0, PLAN: 1, DIF: 2, DESV: 3, ACUM: 4, HABIL: 5, PROY: 6,
    RSEM: 7, PSEM: 8, DSEM: 9, CSEM: 10, CODIGO: 12 };
  const nFilas = R.CODIGO + 1;
  const c0 = COL.LINEA, ancho = lay.colEtiqueta - c0 + 1;
  const M = [];
  for (let i = 0; i < nFilas; i++) M.push(new Array(ancho).fill(''));
  const put = function (fila, col, v) { M[fila][col - c0] = v; };
  const L = letra_;
  const rango = function (col) { return L(col) + ini + ':' + L(col) + sep; };
  const crit = '$' + L(COL.PROYECTO) + '$' + ini + ':$' + L(COL.PROYECTO) + '$' + sep;

  put(R.REAL, COL.PROYECTO, ETQ_TOTAL_REAL);
  put(R.PLAN, COL.PROYECTO, 'TOTAL PLANEADO');
  put(R.DIF, COL.PROYECTO, 'DIFERENCIA');
  put(R.DESV, COL.PROYECTO, '% DESVIACIÓN');
  put(R.ACUM, COL.PROYECTO, 'ACUMULADO');
  put(R.HABIL, COL.PROYECTO, 'DIA HABIL');
  put(R.PROY, COL.PROYECTO, 'PROYECCIÓN DEL MES');

  // Totales de columnas numéricas (G..J y extras)
  for (let c = COL.PESO; c < lay.primerDia; c++) {
    put(R.REAL, c, '=SUMIF(' + crit + ',"OP*",' + rango(c) + ')');
  }
  put(R.DIF, COL.DESCRIPCION, '=' + L(COL.REPORTE) + (s + R.REAL) + '-' + L(COL.PESO) + (s + R.REAL));
  put(R.DESV, COL.DESCRIPCION, '=IFERROR(' + L(COL.DESCRIPCION) + (s + R.DIF) + '/' + L(COL.PESO) + (s + R.REAL) + ',0)');

  const hab1 = L(lay.primerDia) + (s + R.HABIL), habN = L(lay.ultimoDia) + (s + R.HABIL);
  for (let d = 0; d < lay.dias; d++) {
    const c = lay.primerDia + d, X = L(c);
    put(R.REAL, c, '=SUMIF(' + crit + ',"OP*",' + rango(c) + ')');
    put(R.PLAN, c, '=SUMIF(' + crit + ',"PLANEADO",' + rango(c) + ')');
    put(R.DIF, c, '=' + X + (s + R.REAL) + '-' + X + (s + R.PLAN));
    put(R.DESV, c, '=IFERROR(' + X + (s + R.DIF) + '/' + X + (s + R.PLAN) + ',0)');
    put(R.ACUM, c, d === 0 ? '=' + X + (s + R.REAL) : '=' + L(c - 1) + (s + R.ACUM) + '+' + X + (s + R.REAL));
    put(R.HABIL, c, lay.info[d].habil);
    put(R.PROY, c, '=IFERROR(' + X + (s + R.ACUM) + '*MAX($' + hab1.replace(/(\d+)$/, '$$$1') + ':$' +
      habN.replace(/(\d+)$/, '$$$1') + ')/' + X + (s + R.HABIL) + ',0)');
  }
  const T = L(lay.colTotal), D1 = L(lay.primerDia), DN = L(lay.ultimoDia);
  [R.REAL, R.PLAN, R.DIF].forEach(function (f) { put(f, lay.colTotal, '=SUM(' + D1 + (s + f) + ':' + DN + (s + f) + ')'); });
  put(R.REAL, lay.colEtiqueta, 'Total Producción');
  put(R.PLAN, lay.colEtiqueta, 'Total Planeado');
  put(R.DIF, lay.colEtiqueta, 'Diferencia');

  // Semanas
  put(R.RSEM, COL.REPORTE, 'REAL SEMANA');
  put(R.PSEM, COL.REPORTE, 'PLANEADO SEMANA');
  put(R.DSEM, COL.REPORTE, 'REAL - PLANEADO  KG');
  put(R.CSEM, COL.REPORTE, 'CUMPLIMIENTO SEMANA');
  lay.semanas.forEach(function (w) {
    const a = L(lay.primerDia + w.ini - 1), b = L(lay.primerDia + w.fin - 1), c = lay.primerDia + w.ini - 1;
    put(R.RSEM, c, '=SUM(' + a + (s + R.REAL) + ':' + b + (s + R.REAL) + ')');
    put(R.PSEM, c, '=SUM(' + a + (s + R.PLAN) + ':' + b + (s + R.PLAN) + ')');
    put(R.DSEM, c, '=' + a + (s + R.RSEM) + '-' + a + (s + R.PSEM));
    put(R.CSEM, c, '=IFERROR(' + a + (s + R.RSEM) + '/' + a + (s + R.PSEM) + ',0)');
  });
  const mesTxt = MESES[lay.mes];
  put(R.RSEM, COL.DESCRIPCION, 'SIN OP ' + mesTxt);  put(R.RSEM, COL.PESO, 0);
  put(R.PSEM, COL.DESCRIPCION, 'CON OP ' + mesTxt);  put(R.PSEM, COL.PESO, '=' + L(COL.PESO) + (s + R.REAL));
  put(R.DSEM, COL.DESCRIPCION, 'TOTAL');             put(R.DSEM, COL.PESO, '=' + L(COL.PESO) + (s + R.RSEM) + '+' + L(COL.PESO) + (s + R.PSEM));
  put(R.CODIGO, lay.ultimoDia, CONFIG.CODIGO_FORMATO);

  if (sh.getMaxRows() < s + nFilas) sh.insertRowsAfter(sh.getMaxRows(), s + nFilas - sh.getMaxRows());
  sh.getRange(s, c0, nFilas, ancho).setValues(M);

  // ---- Formato
  const nDias = lay.dias;
  const bloque = sh.getRange(s, COL.PROYECTO, R.PROY + 1, lay.colTotal - COL.PROYECTO + 1);
  bloque.setBorder(true, true, true, true, true, true).setVerticalAlignment('middle');
  sh.getRange(s, COL.PROYECTO, R.PROY + 1, 1).setFontWeight('bold');
  sh.getRange(s, COL.PROYECTO, 2, lay.colTotal - COL.PROYECTO + 1).setBackground(CONFIG.COLOR.resumen).setFontWeight('bold');
  sh.getRange(s, COL.PESO, R.PROY + 1, lay.primerDia - COL.PESO).setNumberFormat('#,##0;[Red]-#,##0');
  sh.getRange(s + R.DESV, COL.DESCRIPCION).setNumberFormat('0.0%');
  sh.getRange(s, lay.primerDia, R.PROY + 1, nDias + 1).setNumberFormat('#,##0;[Red]-#,##0').setHorizontalAlignment('center');
  sh.getRange(s + R.DESV, lay.primerDia, 1, nDias).setNumberFormat('0.0%;[Red]-0.0%');
  sh.getRange(s + R.HABIL, lay.primerDia, 1, nDias).setNumberFormat('0').setFontColor('#666666');
  sh.getRange(s + R.DIF, COL.DESCRIPCION, 2, 1).setFontWeight('bold').setHorizontalAlignment('center');

  // Semanas: etiquetas I:J + celdas combinadas por semana
  for (let f = R.RSEM; f <= R.CSEM; f++) {
    sh.getRange(s + f, COL.REPORTE, 1, 2).merge().setFontWeight('bold')
      .setBackground(CONFIG.COLOR.semana).setBorder(true, true, true, true, null, null);
    lay.semanas.forEach(function (w) {
      sh.getRange(s + f, lay.primerDia + w.ini - 1, 1, w.fin - w.ini + 1).merge()
        .setHorizontalAlignment('center').setFontWeight('bold')
        .setBorder(true, true, true, true, null, null)
        .setNumberFormat(f === R.CSEM ? '0.0%' : '#,##0;[Red]-#,##0');
    });
  }
  sh.getRange(s + R.RSEM, COL.DESCRIPCION, 3, 2).setBorder(true, true, true, true, true, true).setFontWeight('bold');
  sh.getRange(s + R.RSEM, COL.PESO, 3, 1).setNumberFormat('#,##0');
  sh.getRange(s + R.CODIGO, lay.ultimoDia).setFontSize(8).setFontColor('#666666');
}

// ------------------------------------------------------------
//  AGREGAR O.P (3 filas) DEBAJO DE LA ÚLTIMA
// ------------------------------------------------------------
function filaResumen_(sh) {
  const vals = sh.getRange(1, COL.PROYECTO, sh.getLastRow(), 1).getValues();
  for (let i = 0; i < vals.length; i++) {
    if (String(vals[i][0]).trim().toUpperCase() === ETQ_TOTAL_REAL) return i + 1;
  }
  throw new Error('No encuentro "' + ETQ_TOTAL_REAL + '" en la hoja "' + sh.getName() + '".');
}

function existeOP_(sh, op) {
  const fin = filaResumen_(sh) - 1;
  if (fin < CONFIG.FILA_INICIO) return false;
  const re = new RegExp('^\\s*OP\\.?\\s*' + op.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\s|·|$)', 'i');
  return sh.getRange(CONFIG.FILA_INICIO, COL.PROYECTO, fin - CONFIG.FILA_INICIO + 1, 1).getValues()
    .some(function (r) { return re.test(String(r[0])); });
}

function agregarOP_(sh, f) {
  const lay = layoutDeHoja_(sh);
  const sep = filaResumen_(sh) - 1;    // fila en blanco antes del resumen
  sh.insertRowsBefore(sep, 3);         // los rangos SUMIF del resumen se amplían solos
  const r = sep;                       // primera fila del nuevo bloque
  const c0 = COL.LINEA, ancho = lay.colEtiqueta - c0 + 1;
  const L = letra_;
  const M = [new Array(ancho).fill(''), new Array(ancho).fill(''), new Array(ancho).fill('')];
  const put = function (i, col, v) { M[i][col - c0] = v; };

  put(0, COL.LINEA, f.linea.toUpperCase());
  put(0, COL.PROYECTO, ('OP ' + f.op + ' ' + f.nombre).toUpperCase().trim());
  put(1, COL.PROYECTO, 'PLANEADO');
  put(2, COL.PROYECTO, 'DIFERENCIA');
  put(0, COL.CLIENTE, f.cliente);
  put(0, COL.COMERCIAL, f.comercial);
  put(0, COL.DESCRIPCION, f.descripcion.toUpperCase());
  put(0, COL.PESO, f.peso);
  const D1 = L(lay.primerDia), DN = L(lay.ultimoDia);
  put(0, COL.REPORTE, '=SUM(' + D1 + r + ':' + DN + r + ')');
  put(0, COL.PENDIENTE, '=' + L(COL.PESO) + r + '-' + L(COL.REPORTE) + r);
  for (let d = 0; d < lay.dias; d++) {
    const c = lay.primerDia + d, X = L(c);
    put(0, c, 0);
    put(1, c, 0);
    put(2, c, '=' + X + r + '-' + X + (r + 1));
  }
  for (let i = 0; i < 3; i++) put(i, lay.colTotal, '=SUM(' + D1 + (r + i) + ':' + DN + (r + i) + ')');
  put(0, lay.colEtiqueta, 'Total Producción');
  put(1, lay.colEtiqueta, 'Total Planeado');
  put(2, lay.colEtiqueta, 'Diferencia');

  const rg = sh.getRange(r, c0, 3, ancho);
  rg.breakApart().clearFormat().setValues(M);
  sh.setRowHeights(r, 3, 21);

  // Fondos: LINEA en naranja, días no hábiles en gris
  const bg = M.map(function () {
    const fila = new Array(ancho).fill('#ffffff');
    fila[0] = CONFIG.COLOR.linea;
    lay.info.forEach(function (x, d) { if (!x.laborable) fila[lay.primerDia + d - c0] = CONFIG.COLOR.noHabil; });
    return fila;
  });
  rg.setBackgrounds(bg).setVerticalAlignment('middle');

  sh.getRange(r, COL.LINEA, 3, 1).merge().setHorizontalAlignment('center').setFontSize(9);
  if (lay.extras >= 5) {                 // SOLDADORES / AUXILIARES / OPERARIOS combinadas
    [12, 13, 14].forEach(function (k) { sh.getRange(r, COL.PENDIENTE + k - 9, 3, 1).merge(); });
  }
  sh.getRange(r, COL.PROYECTO, 3, 1).setHorizontalAlignment('center');
  sh.getRange(r, COL.PROYECTO).setFontWeight('bold');
  sh.getRange(r, COL.CLIENTE, 1, 3).setHorizontalAlignment('center').setFontWeight('bold').setWrap(true);
  sh.getRange(r, COL.PESO, 3, lay.colTotal - COL.PESO + 1)
    .setNumberFormat('#,##0;[Red]-#,##0').setHorizontalAlignment('center');
  sh.getRange(r, lay.colEtiqueta, 3, 1).setFontColor('#666666').setFontSize(9);

  const tabla = sh.getRange(r, COL.LINEA, 3, lay.colTotal - COL.LINEA + 1);
  tabla.setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);
  tabla.setBorder(true, true, true, true, null, null, '#000000', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

  // Asegura que los totales del resumen sigan cubriendo todas las O.P
  escribirTotales_(sh, lay);
}

/** Reescribe las fórmulas SUMIF del resumen con el rango actual (por seguridad). */
function escribirTotales_(sh, lay) {
  const s = filaResumen_(sh), sep = s - 1, ini = CONFIG.FILA_INICIO, L = letra_;
  const crit = '$' + L(COL.PROYECTO) + '$' + ini + ':$' + L(COL.PROYECTO) + '$' + sep;
  const real = [], plan = [];
  for (let c = COL.PESO; c <= lay.ultimoDia; c++) {
    const rg = L(c) + ini + ':' + L(c) + sep;
    real.push('=SUMIF(' + crit + ',"OP*",' + rg + ')');
    plan.push(c >= lay.primerDia ? '=SUMIF(' + crit + ',"PLANEADO",' + rg + ')' : '');
  }
  sh.getRange(s, COL.PESO, 2, real.length).setValues([real, plan]);
}

// ============================================================
//  v3 — CRONOGRAMA (lo que envía comercial)
// ============================================================
function _n3(v) {
  return String(v == null ? '' : v).split('\n')[0]
    .normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/\s+/g, '').trim();
}

/** Columnas del Cronograma por nombre de encabezado (fila 5). */
function columnasCrono_(sh) {
  const enc = sh.getRange(CONFIG.FILA_ENC_CRONO, 1, 1, Math.min(sh.getLastColumn(), 60)).getValues()[0];
  const m = {};
  enc.forEach(function (v, i) { const k = _n3(v); if (k && m[k] === undefined) m[k] = i + 1; });
  const col = function (nombre, defecto) { const c = m[_n3(nombre)]; return c || defecto; };
  return {
    OP: col('OP', 2), NOMBRE: col('NOMBRE_OP', 3), CLIENTE: col('CLIENTE', 4), COMERCIAL: col('COMERCIAL', 5),
    SUB: col('NOMBRE_SUBESTRUCTURA', 11), KG: col('PESO_KG_SUBESTRUCTURA', 12), TAREA: col('DESCRIPCION_TAREAS', 14),
    ESTADO: col('ESTADO', 16), KG_AV: col('KG_AVANCE_ACUMULADO', 19),
    F_INI_REAL: col('FECHA_INICIO_TAREA_REAL', 21), DUR_REAL: col('DURACION_DIAS_TAREAS_REAL', 22)
  };
}

/**
 * Lee el Cronograma: { ops: { '4027': { nombre, cliente, comercial,
 *   subs: [ { n, nombre, kg, filaKg } ] } }, sh, C }
 */
function leerCronograma_(ss) {
  const sh = ss.getSheetByName(CONFIG.HOJA_CRONO);
  const res = { ops: {}, sh: sh, C: null };
  if (!sh) return res;
  const C = columnasCrono_(sh); res.C = C;
  const last = sh.getLastRow();
  if (last < CONFIG.FILA_INI_CRONO) return res;
  const ancho = Math.max(C.OP, C.NOMBRE, C.CLIENTE, C.COMERCIAL, C.SUB, C.KG, C.TAREA);
  const v = sh.getRange(CONFIG.FILA_INI_CRONO, 1, last - CONFIG.FILA_INI_CRONO + 1, ancho).getValues();
  let op = null, sub = null;
  const tareaKg = _n3(CONFIG.TAREA_KG);
  for (let i = 0; i < v.length; i++) {
    const fila = CONFIG.FILA_INI_CRONO + i, r = v[i];
    const opTxt = String(r[C.OP - 1]).trim().replace(/\.0$/, '');
    if (opTxt) {
      op = res.ops[opTxt] = { op: opTxt, nombre: String(r[C.NOMBRE - 1]).trim(),
        cliente: String(r[C.CLIENTE - 1]).trim(), comercial: String(r[C.COMERCIAL - 1]).trim(), subs: [] };
      sub = null;
    }
    if (!op) continue;
    if (String(r[C.SUB - 1]).trim() !== '' || (opTxt && !sub)) {
      sub = { n: op.subs.length + 1, nombre: String(r[C.SUB - 1]).trim() || ('Sub ' + (op.subs.length + 1)),
              kg: Number(r[C.KG - 1]) || 0, filaKg: null };
      op.subs.push(sub);
    }
    if (sub && _n3(r[C.TAREA - 1]) === tareaKg) sub.filaKg = fila;
  }
  return res;
}

function subsElegidas_(opC, subTxt) {
  const t = String(subTxt || '').trim();
  if (!t || /^todas?$/i.test(t)) return opC.subs.slice();
  const m = t.match(/_(\d+)/);
  if (m) return opC.subs.filter(function (s) { return s.n === Number(m[1]); });
  return opC.subs.filter(function (s) { return _n3(s.nombre) === _n3(t); });
}

// ============================================================
//  v3 — FORMULARIO: OP de comercial en lista + autollenado
// ============================================================
function actualizarListasFormulario(silencioso) {
  const ss = SpreadsheetApp.getActive();
  const crono = leerCronograma_(ss);
  const form = leerFormulario_(ss), sh = hojaFormulario_(ss);
  const ops = Object.keys(crono.ops);
  if (form.celdas.op && ops.length) {
    sh.getRange(form.celdas.op.fila, form.celdas.op.col).setDataValidation(
      SpreadsheetApp.newDataValidation().requireValueInList(ops.slice(0, 500), true).setAllowInvalid(true).build());
  }
  listaSubs_(sh, form, crono.ops[form.op]);
  if (silencioso !== true) {
    SpreadsheetApp.getUi().alert(ops.length
      ? '✅ Lista actualizada: ' + ops.length + ' OP enviadas por comercial.'
      : '⚠ No hay OP en la hoja "' + CONFIG.HOJA_CRONO + '". Usa "🔗 Preparar Cronograma" o pide a comercial que envíe la OP.');
  }
}

function listaSubs_(sh, form, opC) {
  if (!form.celdas.sub) return;
  const celda = sh.getRange(form.celdas.sub.fila, form.celdas.sub.col);
  const items = ['Todas'].concat(opC ? opC.subs.map(function (s) { return opC.op + '_' + s.n + ' · ' + s.nombre; }) : []);
  celda.setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(items, true).setAllowInvalid(true).build());
}

/** Al escoger la OP en el formulario, se llenan solos los datos que mandó comercial. */
function onEdit(e) {
  try {
    if (!e || !e.range || e.range.getSheet().getName() !== CONFIG.HOJA_FORMULARIO) return;
    const ss = e.source, form = leerFormulario_(ss), c = form.celdas.op;
    if (!c || e.range.getRow() !== c.fila || e.range.getColumn() !== c.col) return;
    const sh = e.range.getSheet(), opC = leerCronograma_(ss).ops[form.op];
    listaSubs_(sh, form, opC);
    if (!opC) { ss.toast('La OP ' + form.op + ' no está en el Cronograma (no la ha enviado comercial).', '⚠ Producción', 6); return; }
    const poner = function (k, v) { const x = form.celdas[k]; if (x) { try { sh.getRange(x.fila, x.col).setValue(v); } catch (_) {} } };
    poner('nombre', opC.nombre);
    poner('cliente', opC.cliente);
    poner('comercial', opC.comercial);
    poner('descripcion', opC.nombre);
    poner('peso', opC.subs.reduce(function (a, s) { return a + s.kg; }, 0));
    poner('sub', 'Todas');
    ss.toast('Datos de la OP ' + form.op + ' cargados (' + opC.subs.length + ' subestructura/s).', '✅ Producción', 4);
  } catch (err) { /* nunca bloquear la edición */ }
}

// ============================================================
//  v3 — SINCRONIZAR KILOS DIARIOS → CRONOGRAMA
// ============================================================
/** Lee todas las hojas "MES AÑO": { 'op|n': {real, plan, ini, fin, diasHab} } y bloques de OP completa. */
function leerDiario_(ss) {
  const agg = {};
  ss.getSheets().forEach(function (sh) {
    const m = sh.getName().match(/^([A-Z]+) (\d{4})$/);
    if (!m || MESES.indexOf(m[1]) < 0) return;
    let lay, sep;
    try { lay = layoutDeHoja_(sh); sep = filaResumen_(sh) - 1; } catch (e) { return; }
    const n = sep - CONFIG.FILA_INICIO;
    if (n <= 0) return;
    const v = sh.getRange(CONFIG.FILA_INICIO, COL.PROYECTO, n, lay.ultimoDia - COL.PROYECTO + 1).getValues();
    const d0 = lay.primerDia - COL.PROYECTO;
    for (let i = 0; i < v.length; i++) {
      const t = String(v[i][0]).match(/^\s*OP\.?\s*([^\s·]+)/i);
      if (!t) continue;
      const tok = t[1], mm = tok.match(/^(.+)_(\d+)$/);
      const key = mm ? mm[1] + '|' + Number(mm[2]) : tok + '|*';
      const a = agg[key] || (agg[key] = { real: 0, plan: 0, ini: null, fin: null, dias: {} });
      for (let d = 0; d < lay.dias; d++) {
        const real = Number(v[i][d0 + d]) || 0;
        const plan = (i + 1 < v.length) ? (Number(v[i + 1][d0 + d]) || 0) : 0;
        a.plan += plan;
        if (real > 0) {
          a.real += real;
          const f = new Date(lay.anio, lay.mes, d + 1);
          if (!a.ini || f < a.ini) a.ini = f;
          if (!a.fin || f > a.fin) a.fin = f;
        }
      }
    }
  });
  return agg;
}

/** Días hábiles lun–vie sin festivos entre dos fechas (igual que WORKDAY.INTL(...,1,...)). */
function diasHabiles_(ini, fin) {
  if (!ini || !fin) return 0;
  let n = 0, fest = {}, anio = -1;
  for (let d = new Date(ini.getTime()); d <= fin; d.setDate(d.getDate() + 1)) {
    if (d.getFullYear() !== anio) { anio = d.getFullYear(); fest = festivosColombia_(anio); }
    const dow = d.getDay();
    if (dow >= 1 && dow <= 5 && !fest[d.getMonth() + '-' + d.getDate()]) n++;
  }
  return n;
}

function sincronizarDiarioACronograma() {
  const ss = SpreadsheetApp.getActive();
  const lock = LockService.getDocumentLock();
  if (!lock.tryLock(30000)) return;
  let ui = null; try { ui = SpreadsheetApp.getUi(); } catch (e) {}
  try {
    const crono = leerCronograma_(ss);
    if (!crono.sh) { if (ui) ui.alert('⚠ No existe la hoja "' + CONFIG.HOJA_CRONO + '". Usa "🔗 Preparar Cronograma".'); return; }
    const C = crono.C, sh = crono.sh, diario = leerDiario_(ss);
    let actualizadas = 0, terminadas = 0;
    const sinFila = [];

    Object.keys(crono.ops).forEach(function (op) {
      const o = crono.ops[op];
      const kgTot = o.subs.reduce(function (a, s) { return a + s.kg; }, 0);
      const comp = diario[op + '|*'];                  // reportes de OP completa (sin _n)
      o.subs.forEach(function (s) {
        const a = diario[op + '|' + s.n];
        let real = a ? a.real : 0, ini = a ? a.ini : null, fin = a ? a.fin : null;
        if (comp && comp.real > 0) {                   // se reparte según el KG de cada subestructura
          const parte = kgTot > 0 ? s.kg / kgTot : 1 / o.subs.length;
          real += comp.real * parte;
          if (comp.ini && (!ini || comp.ini < ini)) ini = comp.ini;
          if (comp.fin && (!fin || comp.fin > fin)) fin = comp.fin;
        }
        if (ini && ini.getFullYear() < 2000) ini = null;   // v4.1: fecha < 2000 = vacía
        if (real <= 0) return;                         // sin reportes: no se toca nada
        if (!s.filaKg) { sinFila.push(op + '_' + s.n); return; }
        const r = s.filaKg;
        real = Math.round(real * 100) / 100;
        // v4 — se respeta lo que Producción digitó a mano (comportamiento original):
        //   la sincronización solo SUBE valores, nunca los baja ni los borra.
        const vals = sh.getRange(r, 1, 1, Math.max(C.KG_AV, C.F_INI_REAL, C.DUR_REAL, C.ESTADO)).getValues()[0];
        const kgActual = Number(vals[C.KG_AV - 1]) || 0;
        const iniActual = vals[C.F_INI_REAL - 1] instanceof Date && vals[C.F_INI_REAL - 1].getFullYear() >= 2000 ? vals[C.F_INI_REAL - 1] : null; // v4.1
        const durActual = Number(vals[C.DUR_REAL - 1]) || 0;
        const actual = String(vals[C.ESTADO - 1]).trim();
        if (actual === 'No aplica') return;   // v4.3: la marcó Comercial, no se sincroniza
        let cambio = false;
        if (real > kgActual) { sh.getRange(r, C.KG_AV).setValue(real); cambio = true; }
        const kgFinal = Math.max(real, kgActual);
        const lineaBase = actual === 'Terminado' && !!iniActual;   // v4.2: Terminado con fecha real válida = línea base
        const usaIniDiario = !lineaBase && !!(ini && (!iniActual || ini < iniActual));
        if (usaIniDiario) { sh.getRange(r, C.F_INI_REAL).setValue(ini).setNumberFormat('dd/mm/yyyy'); cambio = true; }
        // La duración solo se calcula con el reporte diario cuando el inicio también sale
        // de él (o no hay duración digitada); si Producción ya tenía fechas propias, se respetan.
        if (!lineaBase && (usaIniDiario || durActual <= 0)) {   // v4.2
          const dur = Math.max(1, diasHabiles_(usaIniDiario ? ini : iniActual, fin));
          if (dur !== durActual) { sh.getRange(r, C.DUR_REAL).setValue(dur); cambio = true; }
        }
        // Estado: En pausa → Abierto → Terminado. Nunca se baja un "Terminado"
        // y "Reproceso" se respeta mientras no se complete el peso.
        let nuevo = actual;
        if (s.kg > 0 && kgFinal >= s.kg) nuevo = 'Terminado';
        else if (actual === '' || actual === 'En pausa') nuevo = 'Abierto';
        if (nuevo !== actual) { sh.getRange(r, C.ESTADO).setValue(nuevo); cambio = true; }
        if (nuevo === 'Terminado') terminadas++;
        if (cambio) actualizadas++;
      });
    });

    const msg = '🔄 Sincronización: ' + actualizadas + ' subestructura/s actualizadas en "' + CONFIG.TAREA_KG + '"' +
      (terminadas ? ' (' + terminadas + ' terminadas)' : '') +
      (sinFila.length ? '\n⚠ Sin tarea "' + CONFIG.TAREA_KG + '": ' + sinFila.join(', ') : '');
    Logger.log(msg);
    if (ui) ss.toast(msg, '✅ Producción', 8);
  } finally {
    lock.releaseLock();
  }
}

/** Crea (una sola vez) el disparador que sincroniza cada hora. */
function activarSincronizacionAutomatica() {
  const ya = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'sincronizarDiarioACronograma'; });
  if (!ya) ScriptApp.newTrigger('sincronizarDiarioACronograma').timeBased().everyHours(1).create();
  SpreadsheetApp.getUi().alert(ya ? '✅ La sincronización automática ya estaba activa.'
    : '✅ Listo: los kilos diarios pasan solos al Cronograma cada hora.');
}

// ============================================================
//  v3 — PREPARAR CRONOGRAMA (una sola vez)
// ============================================================
function prepararCronograma() {
  const ss = SpreadsheetApp.getActive(), ui = SpreadsheetApp.getUi();
  if (ss.getSheetByName(CONFIG.HOJA_CRONO)) { ui.alert('✅ Ya existe la hoja "' + CONFIG.HOJA_CRONO + '".'); return; }
  const r = ui.alert('🔗 Preparar Cronograma',
    'Se copiarán a este archivo las hojas "DIAS_FESTIVOS", "Assignees and Status" y "Cronograma" de ' +
    'PLANTILLA_LOOKER_PRODUCCION, con las OP que ya tiene.\n\n¿Continuar?', ui.ButtonSet.YES_NO);
  if (r !== ui.Button.YES) return;
  const src = SpreadsheetApp.openById(CONFIG.ID_PLANTILLA_PRODUCCION);
  const copiadas = [];
  ['DIAS_FESTIVOS', 'Assignees and Status', CONFIG.HOJA_CRONO].forEach(function (n) {
    if (ss.getSheetByName(n)) return;
    const h = src.getSheetByName(n);
    if (!h) return;
    h.copyTo(ss).setName(n);
    copiadas.push(n);
  });
  const c = ss.getSheetByName(CONFIG.HOJA_CRONO);
  if (c) { ss.setActiveSheet(c); ss.moveActiveSheet(1); }
  actualizarListasFormulario(true);
  ui.alert('✅ Hojas copiadas: ' + copiadas.join(', ') + '\n\n' +
    'Siguiente paso: en la macro de COMERCIAL cambia el ID de "Produccion" por el ID de este archivo, ' +
    'y en la MAESTRA cambia la importación de PRODUCCION a este archivo.');
}

// ============================================================
//  v3 — BORRAR DE LOS MESES LAS OP QUE NO VIENEN DE COMERCIAL
// ============================================================
function limpiarOPsSinComercial() {
  const ss = SpreadsheetApp.getActive(), ui = SpreadsheetApp.getUi();
  const ops = leerCronograma_(ss).ops;
  if (!Object.keys(ops).length) { ui.alert('⚠ El Cronograma está vacío: no se borra nada (prepara el Cronograma primero).'); return; }
  const borrar = [];
  ss.getSheets().forEach(function (sh) {
    const m = sh.getName().match(/^([A-Z]+) (\d{4})$/);
    if (!m || MESES.indexOf(m[1]) < 0) return;
    let sep; try { sep = filaResumen_(sh) - 1; } catch (e) { return; }
    const n = sep - CONFIG.FILA_INICIO;
    if (n <= 0) return;
    const v = sh.getRange(CONFIG.FILA_INICIO, COL.PROYECTO, n, 1).getValues();
    for (let i = 0; i < v.length; i++) {
      const t = String(v[i][0]).match(/^\s*OP\.?\s*([^\s·]+)/i);
      if (!t) continue;
      const op = t[1].replace(/_\d+$/, '');
      if (!ops[op]) borrar.push({ sh: sh, fila: CONFIG.FILA_INICIO + i, txt: sh.getName() + ': ' + String(v[i][0]).trim() });
    }
  });
  if (!borrar.length) { ui.alert('✅ Todas las OP de los meses vienen de comercial.'); return; }
  const r = ui.alert('🧹 Borrar OP que no vienen de comercial',
    'Se borrarán estos bloques (OP / PLANEADO / DIFERENCIA) con sus kilos:\n\n' +
    borrar.map(function (b) { return '• ' + b.txt; }).join('\n') + '\n\n¿Borrar?', ui.ButtonSet.YES_NO);
  if (r !== ui.Button.YES) return;
  borrar.sort(function (a, b) { return b.fila - a.fila; }).forEach(function (b) { b.sh.deleteRows(b.fila, 3); });
  const hojas = {};
  borrar.forEach(function (b) { hojas[b.sh.getName()] = b.sh; });
  Object.keys(hojas).forEach(function (k) { try { escribirTotales_(hojas[k], layoutDeHoja_(hojas[k])); } catch (e) {} });
  ui.alert('✅ Borrados ' + borrar.length + ' bloque/s.');
}
