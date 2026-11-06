process.env.TZ='America/Bogota';
const {Spreadsheet,entorno,cargar}=require('./gsim.js');const fs=require('fs');
const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ FALLA ')+m); if(!c) process.exitCode=1;};
const M45='/home/claude/trabajo/MAESTRA_POLYUPROTEC_v4_5.gs', M46='/home/claude/trabajo/MAESTRA_POLYUPROTEC_v4_6.gs', V45='/home/claude/trabajo/PRODUCCION_V2_v4_5.gs';
const ID_M='1v55aTL923MTMVXU2iuxYMATP0LePk6tUFyYx1jMsLj4', ID_BAQ='1hjd1v3L7rfJhK3Nu5LsRXoN5WTNnoigepwZis0Gh0Mc', ID_BOG='1g-xblOWHioFZbxpwlFZFHb60Hwa85q5X3jRSHHYk_X8';
const FN=['actualizarLookerMaestra','actualizarProduccionDiaria','getDatosOPs','getDatosTareas','getDatosProduccion','_hojaHistorial','_evento','_escribirHistorial','getDatosHistorial'];
const v2=(nombre,separar)=>{const s=new Spreadsheet(nombre===ID_BOG?ID_BOG:ID_BAQ,JSON.parse(fs.readFileSync('v2_base.json')),nombre===ID_BOG?'PLANTILLA_LOOKER_PRODUCCION_V2_BOGOTA':'PLANTILLA_LOOKER_PRODUCCION_V2_BARRANQUILLA');
  if(separar){const e=entorno({},s,{sinUi:true});cargar(V45,e,['separarPorPlanta']).separarPorPlanta();}return s;};
function maestra(gs,mod,separar){
  const M=new Spreadsheet(ID_M,JSON.parse(fs.readFileSync('maestra_base.json')),'TORRE_CONTROL_MAESTRA');
  if(mod)mod(M);
  const A={[ID_M]:M,[ID_BAQ]:v2(ID_BAQ,separar),[ID_BOG]:v2(ID_BOG,separar)};
  const env=entorno(A,M,{sinUi:true});const F=cargar(gs,env,FN);
  F.actualizarLookerMaestra();F.actualizarProduccionDiaria(true);
  return {M,F,env};
}
const filasLooker=M=>{const sh=M.getSheetByName('LOOKER_MAESTRA');return sh.getRange(1,1,sh.getLastRow(),40).getValues().map(r=>r.map(x=>x instanceof Date?x.getTime():x).join('¦'));};
const sinPlantas=o=>o.map(x=>{const c=Object.assign({},x);delete c.plantas;return JSON.stringify(c);}).sort();
// ---------- 1) sin hoja de Bogotá = v4.5
const a=maestra(M45), b=maestra(M46);
ok(JSON.stringify(filasLooker(a.M))===JSON.stringify(filasLooker(b.M)),'Sin PRODUCCION_BOGOTA: LOOKER_MAESTRA idéntica a v4.5 ('+filasLooker(a.M).length+' filas, mismo orden)');
ok(JSON.stringify(sinPlantas(a.F.getDatosOPs()))===JSON.stringify(sinPlantas(b.F.getDatosOPs())),'Sin PRODUCCION_BOGOTA: datos de OP iguales a v4.5 (más el campo nuevo "plantas")');
ok(JSON.stringify(a.F.getDatosTareas())===JSON.stringify(b.F.getDatosTareas()),'Sin PRODUCCION_BOGOTA: tareas iguales a v4.5');
const pa=a.F.getDatosProduccion(),pb=b.F.getDatosProduccion();
ok(pa.length===pb.length&&pa.every((r,i)=>JSON.stringify(r)===JSON.stringify(Object.assign({},pb[i],{planta:undefined}))||JSON.stringify(Object.assign({},r,{planta:''}))===JSON.stringify(pb[i])),'Sin PRODUCCION_BOGOTA: producción diaria igual ('+pa.length+' registros; planta vacía)');
console.log('     planta de las OP (v4.6): '+[...new Set(b.F.getDatosOPs().map(o=>o.sede+' → '+o.plantas.join('+')))].join(' · '));
// ---------- 2) con las dos plantas: el Cronograma COMPLETO en las dos hojas (peor caso)
const conBogota=M=>{const p=M.getSheetByName('PRODUCCION');const c=p.copyTo(M);c.setName('PRODUCCION_BOGOTA');const x=c.cells.get('1,1');x.f=x.f.replace(ID_BAQ,ID_BOG);};
const c=maestra(M46,conBogota);
const orden=x=>x.slice(1).sort();
ok(JSON.stringify(orden(filasLooker(c.M)))===JSON.stringify(orden(filasLooker(a.M))),'Con dos hojas de Producción con TODAS las O.P: LOOKER_MAESTRA tiene exactamente las mismas filas que con un archivo (sin duplicar ninguna subestructura)');
ok(JSON.stringify(sinPlantas(c.F.getDatosOPs()))===JSON.stringify(sinPlantas(a.F.getDatosOPs())),'… y las mismas OP con los mismos semáforos, avances y fechas');
ok(filasLooker(c.M).filter(r=>r.startsWith('PRODUCCION_BOGOTA')).length===0,'En LOOKER_MAESTRA las dos plantas aparecen como área PRODUCCION');
// ---------- 3) archivos ya separados + producción diaria de los dos
const d=maestra(M46,conBogota,true);
ok(JSON.stringify(orden(filasLooker(d.M)))===JSON.stringify(orden(filasLooker(a.M))),'Con los archivos separados por planta: LOOKER_MAESTRA = la de un archivo');
const pd=d.F.getDatosProduccion();
ok(pd.length===pa.length&&pd.every(r=>r.planta==='BOGOTÁ'||r.planta==='BARRANQUILLA'),'Producción diaria de los dos archivos: '+pd.length+' registros (= '+pa.length+'), cada uno con su planta ('+[...new Set(pd.map(r=>r.op+':'+r.planta))].join(', ')+')');
// ---------- 4) MIXTO: 4103_1 Bogotá, 4103_2 Barranquilla (en los dos archivos)
const mixto=M=>{conBogota(M);['PRODUCCION','PRODUCCION_BOGOTA'].forEach(n=>{const sh=M.getSheetByName(n);const v=sh.getRange(1,1,sh.getLastRow(),13).getValues();const i=v.findIndex(r=>String(r[1]).replace(/\.0$/,'')==='4103');sh.getRange(i+1,13).setValue('BOGOTÁ');});};
const e=maestra(M46,mixto);
const op4103=e.F.getDatosOPs().find(o=>o.op==='4103');
ok(op4103.sede==='MIXTO'&&op4103.plantas.join(',')==='BARRANQUILLA,BOGOTÁ','OP 4103 con subestructuras en las dos plantas: sede MIXTO, plantas BARRANQUILLA + BOGOTÁ');
const t4103=e.F.getDatosTareas().filter(t=>t.op==='4103'&&t.area==='PRODUCCION');
const base4103=a.F.getDatosTareas().filter(t=>t.op==='4103'&&t.area==='PRODUCCION');
ok(t4103.length===base4103.length&&t4103.filter(t=>t.sede==='BOGOTÁ').every(t=>t.subEstructura===base4103[0].subEstructura),'Sus tareas de Producción salen una vez cada una ('+t4103.length+'), la subestructura 1 marcada BOGOTÁ y la 2 BARRANQUILLA');
// ---------- 5) historial con PLANTA
const h=e.F._hojaHistorial(e.M);
e.F._escribirHistorial(e.M,[e.F._evento('Prueba','p@polyuprotec.com','4103','PRODUCCION','PRIORIDAD (1-5)','Kg Fabricados','Estado','Abierto','Terminado','Cambio permitido','',null,true,'BOGOTÁ')]);
const hist=e.F.getDatosHistorial();
ok(h.getRange(1,16).getValue()==='PLANTA'&&hist[0].planta==='BOGOTÁ','HISTORIAL_CAMBIOS: columna PLANTA agregada al final y la App la recibe ('+hist[0].planta+')');
