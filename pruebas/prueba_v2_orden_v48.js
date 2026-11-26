process.env.TZ='America/Bogota';
const {Spreadsheet,entorno,cargar}=require('./gsim_rep.js');const fs=require('fs');
const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ FALLA ')+m); if(!c) process.exitCode=1;};
const V45='/home/claude/trabajo/PRODUCCION_V2_v4_5_actual.gs',V46='/home/claude/trabajo/PRODUCCION_V2_v4_8.gs';
const FN=['enviarOP','ordenarMesActivo','marcarPrioridad','bloquesMes_','sincronizarDiarioACronograma','leerCronograma_','leerDiario_','configurarFormulario','layoutDeHoja_'];
const LINEAS=['LINEA','LOTE','LINEA','LOTE','LOTE','LINEA','LOTE'];
function abrir(gs){const d=JSON.parse(fs.readFileSync('v2_base.json'));const ss=new Spreadsheet('V',d,'PLANTILLA_LOOKER_PRODUCCION_V2');
  const op={docProps:{}};const env=entorno({},ss,op);env.G.LockService={getDocumentLock:()=>({tryLock:()=>true,releaseLock(){}}),getScriptLock:()=>({tryLock:()=>true,waitLock(){},releaseLock(){}})};
  const F=cargar(gs,env,FN.filter(n=>gs===V46||!['ordenarMesActivo','marcarPrioridad','bloquesMes_'].includes(n)));
  const sh=ss.getSheetByName('NOVIEMBRE 2026');
  // Simula Bogotá: Línea/Lote intercalados y kg distintos en cada O.P para seguirlos
  let k=0;for(let r=3;r<=23;r+=3){sh.getRange(r,2).setValue(LINEAS[k]);k++;}
  return {ss,sh,F,op,env};}
const L=x=>{const lay=x.F.layoutDeHoja_(x.sh);return lay;};
const bloques=x=>{const sh=x.sh,out=[];for(let r=3;r<sh.getLastRow();r++){const t=String(sh.getRange(r,3).getValue());const m=t.match(/^OP\s+(\S+)/);if(m)out.push({r,tok:m[1],lin:String(sh.getRange(r,2).getValue())});}return out;};
const x=abrir(V46),lay=L(x);
// kg reales por día para seguir cada bloque: día 1 = número de O.P
bloques(x).forEach(b=>{x.sh.getRange(b.r,lay.primerDia).setValue(+b.tok.split('_')[0]);x.sh.getRange(b.r+1,lay.primerDia).setValue(5);});
const antes=bloques(x).map(b=>b.lin+' '+b.tok);console.log('     antes:  '+antes.join(' | '));
const totalAntes=x.sh.getRange(x.sh.getLastRow(),1).getValue();
// 1) Ordenar el mes
x.ss.setActiveSheet(x.sh);x.F.ordenarMesActivo();
const d1=bloques(x);console.log('     después: '+d1.map(b=>b.lin+' '+b.tok).join(' | '));
const grupos=d1.map(b=>b.lin);const lin=grupos.filter(g=>g==='LINEA').length;
ok(grupos.slice(0,lin).every(g=>g==='LINEA')&&grupos.slice(lin).every(g=>g==='LOTE'),'Ordenado: primero LINEA, luego LOTE');
const ordOk=g=>{const t=d1.filter(b=>b.lin===g).map(b=>+b.tok.split('_')[0]);return t.every((v,i)=>i===0||t[i-1]<=v);};
ok(ordOk('LINEA')&&ordOk('LOTE'),'Dentro de cada grupo, por número de O.P');
// los kg viajan con su O.P y las fórmulas apuntan a su propia fila
const D1=lay.primerDia,colL=c=>{let s='';while(c>0){const m=(c-1)%26;s=String.fromCharCode(65+m)+s;c=Math.floor((c-1)/26);}return s;};
ok(d1.every(b=>x.sh.getRange(b.r,D1).getValue()===+b.tok.split('_')[0]&&x.sh.getRange(b.r+1,D1).getValue()===5),'Los kg de cada día se movieron con su O.P');
ok(d1.every(b=>String(x.sh.getRange(b.r,9).getFormula()).includes(colL(D1)+b.r)&&String(x.sh.getRange(b.r+2,D1).getFormula())==='='+colL(D1)+b.r+'-'+colL(D1)+(b.r+1)),'Fórmulas (reporte y diferencia) apuntan a la fila de su O.P');
ok(d1.every(b=>/PLANEADO/.test(x.sh.getRange(b.r+1,3).getValue())&&/DIFERENCIA/.test(x.sh.getRange(b.r+2,3).getValue())),'Cada O.P conserva sus filas PLANEADO y DIFERENCIA');
const s=d1[d1.length-1].r+4;const tot=String(x.sh.getRange(s,7).getFormula());ok(/SUMIF\(\$C\$3:\$C\$\d+,"OP\*"/.test(tot),'Totales reescritos sobre todas las O.P: '+tot.slice(0,40));
const resp=x.ss.getSheetByName('RESPALDO_ORDEN · NOVIEMBRE 2026');ok(resp&&resp.hidden,'Copia de respaldo oculta creada');
// 2) volver a ordenar no cambia nada
const mov0=x.sh.movimientos;x.F.ordenarMesActivo();ok(x.sh.movimientos===mov0&&/ya estaban en orden/.test(x.env.alertas.slice(-1)[0]),'Ordenar otra vez: no mueve nada');
// 3) prioridad por menú: un bloque LOTE pasa al primer lugar
const ult=d1[d1.length-1];x.sh.getActiveRange=()=>({getRow:()=>ult.r+1});x.op.respuesta='1';x.F.marcarPrioridad();
const d2=bloques(x);ok(d2[0].tok===ult.tok&&JSON.parse(x.op.docProps.PRIORIDAD_OP)['NOVIEMBRE 2026|'+ult.tok]===1,'⭐ Prioridad 1 a la O.P '+ult.tok+' (LOTE): queda de primera');
ok(x.sh.getRange(d2[0].r,lay.primerDia).getValue()===+ult.tok.split('_')[0],'…con sus kg');
// 4) enviar una O.P nueva con prioridad 2 desde el formulario → segunda
const cr=x.F.leerCronograma_(x.ss).ops;const enMes=new Set(d2.map(b=>b.tok.split('_')[0]));const nueva=Object.keys(cr).find(o=>!enMes.has(o)&&cr[o].subs.length===1);
const fm=x.ss.getSheetByName('CREACIÓ_DE_O.P');x.env.alertas.length=0;
x.ss.setActiveSheet(fm);x.F.configurarFormulario();const filaP=[...Array(40).keys()].map(i=>i+1).find(r=>String(fm.getRange(r,2).getValue())==='Prioridad');
ok(!filaP,'v4.8: ⚙️ Configurar formulario ya no agrega el campo "Prioridad"');
fm.getRange(3,3).setValue(nueva);fm.getRange(4,3).setValue('Prueba');fm.getRange(5,3).setValue('LOTE');const filaAnio=[...Array(40).keys()].map(i=>i+1).find(r=>String(fm.getRange(r,2).getValue())==='Año');fm.getRange(filaAnio,3).setValue(2026);
const filaNov=[...Array(40).keys()].map(i=>i+1).find(r=>String(fm.getRange(r,2).getValue())==='noviembre');fm.getRange(filaNov,3).setValue(true);
x.F.enviarOP();console.log('     '+x.env.alertas.slice(-1)[0].replace(/\n+/g,' · '));
const d3=bloques(x);ok(d3[0].tok===ult.tok&&d3.some(b=>b.tok.split('_')[0]===String(nueva)&&b.lin==='LOTE'),'O.P '+nueva+' enviada (LOTE, sin prioridad): entra en el grupo LOTE y la prioritaria sigue de primera');

// 5) enviar sin prioridad, LINEA → entra al final del grupo LINEA (no al final de la hoja)
const otra=Object.keys(cr).find(o=>!new Set(d3.map(b=>b.tok.split('_')[0])).has(o)&&cr[o].subs.length===1);
fm.getRange(3,3).setValue(otra);fm.getRange(4,3).setValue('Prueba 2');fm.getRange(5,3).setValue('LINEA');fm.getRange(filaNov,3).setValue(true);x.F.enviarOP();
const d4=bloques(x);const iN=d4.findIndex(b=>b.tok.split('_')[0]===String(otra));const ultLinea=d4.map(b=>b.lin).lastIndexOf('LINEA');
console.log('     final:   '+d4.map(b=>b.lin+' '+b.tok).join(' | '));
ok(iN>1&&iN<=ultLinea&&d4[iN+1]&&d4[iN+1].lin==='LOTE'||(iN<=ultLinea&&d4.slice(2,iN).every(b=>b.lin==='LINEA')),'O.P '+otra+' (LINEA, sin prioridad) entra dentro del grupo LINEA');
ok(d4.every(b=>/PLANEADO/.test(x.sh.getRange(b.r+1,3).getValue())),'Todos los bloques siguen completos');
// 6) la sincronización lee igual los kg
const diario=x.F.leerDiario_(x.ss);ok(Object.keys(diario).length>0,'Sincronización: lee los kg del mes por etiqueta ('+Object.keys(diario).length+' subestructuras)');
// 7) Comparación con v4.5: mismos datos leídos por la sincronización antes y después de ordenar
const y=abrir(V45),z=abrir(V46);[y,z].forEach(w=>{const l=L(w);bloques(w).forEach(b=>w.sh.getRange(b.r,l.primerDia).setValue(+b.tok.split('_')[0]));});
z.ss.setActiveSheet(z.sh);z.F.ordenarMesActivo();
const norm=o=>JSON.stringify(Object.keys(o).sort().map(k=>[k,o[k]]));
ok(norm(y.F.leerDiario_(y.ss))===norm(z.F.leerDiario_(z.ss)),'Los kg que lee la sincronización son idénticos a v4.5 aunque el orden cambie');
// 8) colores: LINEA naranja, LOTE azul, prioridad dorado
const fnd=w=>(global.FONDOS||{})[w.sh.name]||{};
global.FONDOS={};x.ss.setActiveSheet(x.sh);x.F.ordenarMesActivo();console.log('     '+x.env.alertas.slice(-1)[0].split('\n')[0]);const F8=fnd(x),b8=bloques(x);
const colorDe=b=>F8[b.r+',2'];
const pri0=JSON.parse(x.op.docProps.PRIORIDAD_OP||'{}'),pri={};Object.keys(pri0).forEach(k=>{if(k.startsWith('NOVIEMBRE 2026|'))pri[k.split('|')[1]]=pri0[k];});
const malos=b8.filter(b=>{const c=colorDe(b);return pri[b.tok]?c!=='#ffd966':b.lin==='LOTE'?c!=='#9fc5e8':c!=='#fabf8f';});
console.log('     colores: '+b8.map(b=>b.lin+' '+b.tok+'='+colorDe(b)).join(' | '));
ok(malos.length===0,'LINEA naranja, LOTE azul y prioritarias doradas'+(malos.length?' — mal: '+malos.map(b=>b.tok).join(','):''));
const filaLote=b8.find(b=>b.lin==='LOTE'&&!pri[b.tok]);ok([0,1,2].every(i=>F8[(filaLote.r+i)+',2']==='#9fc5e8'),'Se pinta todo el bloque (celda combinada), no solo la primera fila');
