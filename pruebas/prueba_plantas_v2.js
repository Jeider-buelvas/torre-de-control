process.env.TZ='America/Bogota';
const {Spreadsheet,entorno,cargar}=require('./gsim.js');const fs=require('fs');
const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ FALLA ')+m); if(!c) process.exitCode=1;};
const base=()=>JSON.parse(fs.readFileSync('v2_base.json'));
const V44='/home/claude/trabajo/PRODUCCION_V2_v4_4.gs', V45='/home/claude/trabajo/PRODUCCION_V2_v4_5.gs';
const FN=['sincronizarDiarioACronograma','separarPorPlanta','leerCronograma_','actualizarListasFormulario','plantaArchivo_','layoutDeHoja_','leerDiario_','subsPropias_','enviarOP'];
const abrir=(gs,nombre,props,data)=>{const ss=new Spreadsheet('V',data||base(),nombre);const env=entorno({},ss,{docProps:props||{}});const F=cargar(gs,env,FN.filter(n=>gs===V45||!['separarPorPlanta','plantaArchivo_','subsPropias_'].includes(n)));return {ss,env,F};};
const celdas=sh=>{const o={};for(const[k,x]of sh.cells)o[k]=JSON.stringify([x.v instanceof Date?x.v.getTime():x.v,x.f]);return o;};
const iguales=(a,b)=>{const A=celdas(a),B=celdas(b);return Object.keys({...A,...B}).filter(k=>A[k]!==B[k]).length;};
const opsDe=ss=>Object.keys(cargar(V45,entorno({},ss),['leerCronograma_']).leerCronograma_(ss).ops);
// ---- 1) sin planta configurada = v4.4
const a=abrir(V44,'PLANTILLA_LOOKER_PRODUCCION_V2'),b=abrir(V45,'PLANTILLA_LOOKER_PRODUCCION_V2');
ok(b.F.plantaArchivo_()==='','Archivo sin planta configurada ni en el nombre: planta = (ninguna)');
a.F.sincronizarDiarioACronograma();b.F.sincronizarDiarioACronograma();
ok(iguales(a.ss.getSheetByName('Cronograma'),b.ss.getSheetByName('Cronograma'))===0,'Sin planta: la sincronización deja el Cronograma idéntico a v4.4');
// ---- 2) archivo actual = BARRANQUILLA (por el nombre)
const baq=abrir(V45,'PLANTILLA_LOOKER_PRODUCCION_V2_BARRANQUILLA');
ok(baq.F.plantaArchivo_()==='BARRANQUILLA','Planta tomada del nombre del archivo: '+baq.F.plantaArchivo_());
const r1=baq.F.separarPorPlanta(); console.log('     '+baq.env.alertas.slice(-1)[0].replace(/\n+/g,' · '));
const opsBaq=opsDe(baq.ss);
ok(opsBaq.length===9&&r1.opsQuitadas.length===25,'Barranquilla: quedan sus 9 O.P (se quitan las 25 de Bogotá)');
// ---- 3) copia = BOGOTÁ (configurada por menú)
const bog=abrir(V45,'PLANTILLA_LOOKER_PRODUCCION_V2_BOGOTA',{PLANTA:'BOGOTÁ'});
const r2=bog.F.separarPorPlanta(); console.log('     '+bog.env.alertas.slice(-1)[0].replace(/\n+/g,' · '));
const opsBog=opsDe(bog.ss);
ok(opsBog.length===25&&r2.opsQuitadas.length===9,'Bogotá: quedan sus 25 O.P (se quitan las 9 de Barranquilla)');
ok(opsBaq.filter(x=>opsBog.includes(x)).length===0,'Ninguna O.P queda en los dos archivos (sin duplicados)');
ok(opsBaq.length+opsBog.length===opsDe(new Spreadsheet('o',base())).length,'Entre los dos archivos están las 34 O.P originales');
// bloques de cada O.P idénticos al original
const bloque=(ss,op)=>{const sh=ss.getSheetByName('Cronograma');const v=sh.getRange(6,1,sh.getLastRow()-5,30).getValues();let i=v.findIndex(r=>String(r[1]).replace(/\.0$/,'')===op);const out=[];do{out.push(v[i].map(x=>x instanceof Date?x.getTime():x).join('|'));i++;}while(i<v.length&&!String(v[i][1]).trim()&&String(v[i][13]).trim());return out.join('\n');};
const orig=new Spreadsheet('o',base());
ok(opsBaq.every(op=>bloque(baq.ss,op)===bloque(orig,op))&&opsBog.every(op=>bloque(bog.ss,op)===bloque(orig,op)),'Cada O.P conserva su bloque idéntico al original (valores de las 30 columnas)');
// hojas del mes
const etq=(ss,h)=>{const s=ss.getSheetByName(h);return s.getRange(1,3,s.getLastRow(),1).getValues().map(x=>String(x[0])).filter(x=>/^OP/.test(x));};
['NOVIEMBRE 2026','DICIEMBRE 2026','ENERO 2027'].forEach(h=>console.log('     '+h+' → BAQ: ['+etq(baq.ss,h).join(', ')+'] · BOG: ['+etq(bog.ss,h).join(', ')+']'));
ok(etq(baq.ss,'NOVIEMBRE 2026').length===7&&etq(bog.ss,'NOVIEMBRE 2026').length===0,'NOVIEMBRE (bloques de Barranquilla): quedan solo en el archivo de Barranquilla');
ok(['Cronograma','NOVIEMBRE 2026','DICIEMBRE 2026','ENERO 2027'].some(h=>baq.ss.getSheetByName('RESPALDO_SEP · '+h)&&baq.ss.getSheetByName('RESPALDO_SEP · '+h).hidden),'Respaldos ocultos "RESPALDO_SEP · …" creados antes de quitar');
const r3=baq.F.separarPorPlanta(); ok(r3&&r3.opsQuitadas.length===0&&r3.bloques.length===0,'Segunda separación: no quita nada (idempotente)');
// sincronización por planta = la del archivo único
const unico=abrir(V45,'PLANTILLA_LOOKER_PRODUCCION_V2');unico.F.sincronizarDiarioACronograma();
baq.F.sincronizarDiarioACronograma();bog.F.sincronizarDiarioACronograma();
ok(opsBaq.every(op=>bloque(baq.ss,op)===bloque(unico.ss,op))&&opsBog.every(op=>bloque(bog.ss,op)===bloque(unico.ss,op)),'Sincronizar en cada planta da lo mismo que en el archivo único, O.P por O.P');
// ---- 4) O.P MIXTO: 4103_1 Bogotá, 4103_2 Barranquilla
const mix=()=>{const d=base();const cr=new Spreadsheet('t',d).getSheetByName('Cronograma');const v=cr.getRange(6,1,cr.getLastRow()-5,13).getValues();const i=v.findIndex(r=>String(r[1])==='4103');d['Cronograma'].cells[(6+i)+',13'][0]='BOGOTÁ';return d;};
const mb=abrir(V45,'X_BARRANQUILLA',{},mix()), mg=abrir(V45,'X_BOGOTA',{},mix());
const s1=mb.F.separarPorPlanta(), s2=mg.F.separarPorPlanta();
ok(s1.mixtas.includes('4103')&&s2.mixtas.includes('4103'),'O.P MIXTO 4103 se conserva en los dos archivos');
ok(etq(mb.ss,'NOVIEMBRE 2026').some(x=>x.startsWith('OP 4103_2'))&&!etq(mb.ss,'NOVIEMBRE 2026').some(x=>x.startsWith('OP 4103_1')),'Barranquilla: queda el bloque diario de 4103_2 y se quita el de 4103_1');
ok(!etq(mg.ss,'NOVIEMBRE 2026').some(x=>x.startsWith('OP 4103_2')),'Bogotá: se quita el bloque diario de 4103_2 (no había bloque de 4103_1)');
const o3=mb.F.leerCronograma_(mb.ss).ops['4103'];
ok(mb.F.subsPropias_(o3).map(s=>s.n).join()==='2'&&mg.F.subsPropias_(mg.F.leerCronograma_(mg.ss).ops['4103']).map(s=>s.n).join()==='1','Formulario: Barranquilla solo ofrece 4103_2 y Bogotá solo 4103_1');
// la sincronización de Barranquilla no toca 4103_1 aunque haya kg reportados
const cr=mb.ss.getSheetByName('Cronograma'),f1=o3.subs[0].filaKg,antes=cr.getRange(f1,1,1,29).getValues()[0].join('|');
const ss2=mb.ss;const env2=entorno({},ss2,{});const F2=cargar(V45,env2,['sincronizarDiarioACronograma','leerDiario_']);
const di=F2.leerDiario_(ss2);
mb.F.sincronizarDiarioACronograma();
ok(cr.getRange(f1,1,1,29).getValues()[0].join('|')===antes,'Sincronizar en Barranquilla no modifica la subestructura de Bogotá (4103_1)');
