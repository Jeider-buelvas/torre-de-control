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
    .addSeparator()
    .addItem('⚙️ Configurar formulario (Año y campos)', 'configurarFormulario')
    .addItem('❓ Ayuda', 'mostrarAyuda')
    .addToUi();
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

    const creadas = [], agregadas = [], duplicadas = [];
    form.meses.forEach(function (mes) {
      const nombre = nombreHoja_(form.anio, mes);
      let sh = ss.getSheetByName(nombre);
      if (!sh) {
        sh = construirHojaMes_(ss, form.anio, mes);
        creadas.push(nombre);
      }
      if (existeOP_(sh, form.op)) {
        duplicadas.push(nombre);
        return;
      }
      agregarOP_(sh, form);
      agregadas.push(nombre);
    });

    if (agregadas.length) limpiarFormulario_(ss, form);

    let msg = '';
    if (agregadas.length) msg += '✅ O.P ' + form.op + ' agregada en: ' + agregadas.join(', ') + '\n';
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
  'peso kilos planeados': 'peso', 'peso kilos planeados kg': 'peso'
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
  if (!f.comercial) e.push('• Comercial Responsable');
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
  const re = new RegExp('^\\s*OP\\.?\\s*' + op.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\s|$)', 'i');
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
