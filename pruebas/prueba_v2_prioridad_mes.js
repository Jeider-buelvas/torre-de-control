process.env.TZ='America/Bogota';
const {Spreadsheet,entorno,cargar}=require('./gsim_rep.js');const fs=require('fs');
const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ FALLA ')+m); if(!c) process.exitCode=1;};
const V48='/home/claude/trabajo/PRODUCCION_V2_v4_8.gs';
const FN=['enviarOP','ordenarMesActivo','marcarPrioridad','bloquesMes_','leerCronograma_','leerDiario_','configurarFormulario','layoutDeHoja_','priHoja_','leerPrioridades_'];
const MESES=['ENERO 2028','FEBRERO 2028','MARZO 2028'];
function abrir(props){const ss=new Spreadsheet('V',JSON.parse(fs.readFileSync('v2_base.json')),'PLANTILLA_LOOKER_PRODUCCION_V2');
  const op={docProps:props||{}};const env=entorno({},ss,op);env.G.LockService={getDocumentLock:()=>({tryLock:()=>true,releaseLock(){}}),getScriptLock:()=>({tryLock:()=>true,waitLock(){},releaseLock(){}})};
  const F=cargar(V48,env,FN);const nov=ss.getSheetByName('NOVIEMBRE 2026');
  const L=['LINEA','LOTE','LINEA','LOTE','LOTE','LINEA','LOTE'];let k=0;for(let r=3;r<=23;r+=3){nov.getRange(r,2).setValue(L[k]);k++;}
  MESES.forEach(m=>nov.copyTo(ss).setName(m));   // la misma O.P en enero, febrero y marzo
  return {ss,F,op,env};}
const bloques=sh=>{const out=[];for(let r=3;r<sh.getLastRow();r++){const m=String(sh.getRange(r,3).getValue()).match(/^OP\s+(\S+)/);if(m)out.push({r,tok:m[1]});}return out;};
const x=abrir();const H=n=>x.ss.getSheetByName(n);
const T=bloques(H('ENERO 2028')).slice(-1)[0].tok;   // la última O.P (para que la prioridad la mueva)
const orden=n=>bloques(H(n)).map(b=>b.tok).join(',');
const marcar=(hoja,valor)=>{const sh=H(hoja);x.ss.setActiveSheet(sh);const b=bloques(sh).find(b=>b.tok===T);sh.getActiveRange=()=>({getRow:()=>b.r+1});x.op.respuesta=valor;x.F.marcarPrioridad();};
const pri=n=>x.F.priHoja_(H(n))[T];
const novAntes=orden('NOVIEMBRE 2026');
console.log('     O.P de prueba: '+T+' (en '+MESES.join(', ')+' y NOVIEMBRE 2026)');
marcar('ENERO 2028','1');ok(pri('ENERO 2028')===1&&pri('FEBRERO 2028')===undefined&&pri('MARZO 2028')===undefined,'1. Prioridad alta (1) en enero: solo enero la tiene');
const movE=H('ENERO 2028').movimientos;
marcar('FEBRERO 2028','9');ok(pri('FEBRERO 2028')===9&&pri('ENERO 2028')===1,'2. Prioridad baja (9) en febrero: enero sigue en 1');
marcar('MARZO 2028','5');ok(pri('MARZO 2028')===5&&pri('ENERO 2028')===1&&pri('FEBRERO 2028')===9,'3. Prioridad media (5) en marzo: enero 1 y febrero 9 no cambian');
ok(MESES.every(m=>bloques(H(m))[0].tok===T),'4. Al consultar cada hoja, la O.P está de primera en las tres (es la única prioritaria de cada mes)');
const nota=(m)=>{const sh=H(m),b=bloques(sh).find(b=>b.tok===T);return sh.getRange(b.r,2).getNote?sh.getRange(b.r,2).getNote():'';};
ok(nota('ENERO 2028')==='⭐ Prioridad 1'&&nota('FEBRERO 2028')==='⭐ Prioridad 9'&&nota('MARZO 2028')==='⭐ Prioridad 5','5. Cada hoja muestra su propia prioridad en la nota: 1 · 9 · 5');
ok(orden('NOVIEMBRE 2026')===novAntes&&x.F.priHoja_(H('NOVIEMBRE 2026'))[T]===undefined,'   Noviembre (donde no se marcó) no cambia');
const eA=orden('ENERO 2028'),mA=orden('MARZO 2028'),movM=H('MARZO 2028').movimientos,movE2=H('ENERO 2028').movimientos;
marcar('FEBRERO 2028','3');ok(pri('FEBRERO 2028')===3&&pri('ENERO 2028')===1&&pri('MARZO 2028')===5,'6. Cambiar febrero a 3: enero sigue en 1 y marzo en 5');
ok(orden('ENERO 2028')===eA&&orden('MARZO 2028')===mA&&H('MARZO 2028').movimientos===movM&&H('ENERO 2028').movimientos===movE2,'   …y no se movió ni una fila en enero ni en marzo');
marcar('MARZO 2028','');ok(pri('MARZO 2028')===undefined&&pri('ENERO 2028')===1&&pri('FEBRERO 2028')===3,'   Quitar la prioridad en marzo no afecta enero ni febrero');
const P=JSON.parse(x.op.docProps.PRIORIDAD_OP);ok(Object.keys(P).sort().join()===['ENERO 2028|'+T,'FEBRERO 2028|'+T].sort().join(),'   Guardado por hoja, sin duplicados: '+JSON.stringify(P));
ok(/en FEBRERO 2028/.test(x.env.alertas.filter(a=>/con prioridad 3/.test(a))[0]||'')&&/otros meses no cambiaron/.test(x.env.alertas.filter(a=>/con prioridad 3/.test(a))[0]||''),'   El aviso dice en qué hoja quedó y que los otros meses no cambiaron');
// datos de las O.P intactos (solo cambia el orden y el color)
const datos=n=>bloques(H(n)).map(b=>[b.tok,H(n).getRange(b.r,3).getValue(),H(n).getRange(b.r,4).getValue(),H(n).getRange(b.r,5).getValue(),H(n).getRange(b.r,7).getValue()].join('~')).sort().join('|');
ok(datos('FEBRERO 2028')===datos('NOVIEMBRE 2026'),'   Proyecto, cliente, comercial y peso de las O.P. sin cambios');

console.log('— Prioridades que ya existían (registro global de v4.7)');
const y=abrir({PRIORIDAD_OP:JSON.stringify({[T]:2})});const Hy=n=>y.ss.getSheetByName(n);
const py=n=>y.F.priHoja_(Hy(n))[T];
ok(['NOVIEMBRE 2026'].concat(MESES).every(m=>py(m)===2),'Se copian a cada mes donde está la O.P (todas con 2, como se veían)');
const Py=JSON.parse(y.op.docProps.PRIORIDAD_OP);ok(!(T in Py)&&Object.keys(Py).length===4&&JSON.parse(y.op.docProps.PRIORIDAD_OP_RESPALDO_v47)[T]===2,'El registro global se reemplaza y queda respaldo (PRIORIDAD_OP_RESPALDO_v47)');
{const sh=Hy('ENERO 2028');y.ss.setActiveSheet(sh);const b=bloques(sh).find(b=>b.tok===T);sh.getActiveRange=()=>({getRow:()=>b.r});y.op.respuesta='7';y.F.marcarPrioridad();}
ok(py('ENERO 2028')===7&&['NOVIEMBRE 2026','FEBRERO 2028','MARZO 2028'].every(m=>py(m)===2),'Después, cambiar enero (7) no afecta los otros meses (siguen en 2)');
y.F.leerPrioridades_();ok(Object.keys(JSON.parse(y.op.docProps.PRIORIDAD_OP)).length===4,'La copia se hace una sola vez (sin duplicar)');

console.log('— Formulario');
const fm=x.ss.getSheetByName('CREACIÓ_DE_O.P');x.ss.setActiveSheet(fm);x.F.configurarFormulario();
ok(![...Array(40).keys()].some(i=>String(fm.getRange(i+1,2).getValue())==='Prioridad'),'⚙️ Configurar formulario ya no agrega el campo Prioridad');
const cr=x.F.leerCronograma_(x.ss).ops;const enMes=new Set(bloques(H('ENERO 2028')).map(b=>b.tok.split('_')[0]));const nueva=Object.keys(cr).find(o=>!enMes.has(o)&&cr[o].subs.length===1);
const fila=t=>[...Array(40).keys()].map(i=>i+1).find(r=>String(fm.getRange(r,2).getValue())===t);
fm.getRange(3,3).setValue(nueva);fm.getRange(4,3).setValue('Prueba');fm.getRange(5,3).setValue('LINEA');fm.getRange(fila('Año'),3).setValue(2028);fm.getRange(fila('enero'),3).setValue(true);fm.getRange(fila('febrero'),3).setValue(true);
x.F.enviarOP();ok(bloques(H('ENERO 2028')).some(b=>b.tok.split('_')[0]===String(nueva))&&bloques(H('FEBRERO 2028')).some(b=>b.tok.split('_')[0]===String(nueva)),'📤 Enviar / Crear O.P sigue funcionando (O.P '+nueva+' en enero y febrero)');
ok(bloques(H('ENERO 2028'))[0].tok===T&&bloques(H('FEBRERO 2028'))[0].tok===T&&pri('ENERO 2028')===1&&pri('FEBRERO 2028')===3,'…y respeta la prioridad de cada hoja (la prioritaria sigue de primera)');
