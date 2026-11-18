process.env.TZ='America/Bogota';
const {Spreadsheet,entorno,cargar}=require('./gsim_rep.js');const fs=require('fs');
const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ FALLA ')+m); if(!c) process.exitCode=1;};
const M410='/home/claude/trabajo/MAESTRA_POLYUPROTEC_v4_10.gs', M411='/home/claude/trabajo/MAESTRA_POLYUPROTEC_v4_11.gs';
const ID_M='1v55aTL923MTMVXU2iuxYMATP0LePk6tUFyYx1jMsLj4';
const tabla=(enc,filas)=>{const c={};[enc].concat(filas).forEach((r,i)=>r.forEach((v,j)=>c[(i+1)+','+(j+1)]=[v,null]));return {cells:c};};
const ENC_B=['ID','FECHA_HORA','AUTOR','CORREO','OP','AREA','TIPO','DESCRIPCION','RESPONSABLE','FECHA_COMPROMISO','ESTADO','FECHA_CIERRE','CERRADO_POR','NOTA_CIERRE'];
const ENC_E=['OP','NOMBRE_OP','CLIENTE','COMERCIAL','FECHA_ORIGINAL','FECHA_VIGENTE','REPROGRAMACIONES','FECHA_ENTREGA_REAL','OBSERVACION_ENTREGA','REGISTRADA_POR','FECHA_REGISTRO'];
function hacer(gs,mod){
  const base=JSON.parse(fs.readFileSync('maestra_base.json'));if(mod)mod(base);
  const M=new Spreadsheet(ID_M,base,'TORRE_CONTROL_MAESTRA');
  const IDC=fs.readFileSync(gs,'utf8').match(/var ID_COMERCIAL = '([^']+)'/)[1];
  const C=new Spreadsheet(IDC,{ENTREGAS_CLIENTE:tabla(ENC_E,[])},'COMERCIAL');
  const env=entorno({[ID_M]:M,[IDC]:C},M,{sinUi:true});
  const cache={};env.G.CacheService.getScriptCache=()=>({get:k=>cache[k]||null,put:(k,v)=>{cache[k]=v;},remove:k=>{delete cache[k];}});
  env.G.ContentService={createTextOutput:t=>({txt:t,setMimeType(){return this;}}),MimeType:{JSON:'json'}};
  env.G.PropertiesService.getScriptProperties=()=>({getProperty:()=>null,setProperty(){}});
  env.G.LockService.getScriptLock=()=>({tryLock(){return true;},waitLock(){},releaseLock(){}});env.G.SpreadsheetApp.flush=()=>{};
  const F=cargar(gs,env,['doGet','actualizarLookerMaestra','getDatosOPs']);F.actualizarLookerMaestra();
  return {M,C,F,cache,get:()=>{for(const k in cache)delete cache[k];return JSON.parse(F.doGet({parameter:{tipo:'todos'}}).txt);}};
}
// 1) LOOKER_MAESTRA: solo cambia Estado_OP donde "No aplica" bloqueaba
const a=hacer(M410),b=hacer(M411);
const L=x=>{const sh=x.M.getSheetByName('LOOKER_MAESTRA');return sh.getRange(1,1,sh.getLastRow(),40).getValues();};
const la=L(a),lb=L(b);let difOtras=0,difEst=new Set();
la.forEach((r,i)=>r.forEach((v,j)=>{const w=lb[i][j];if(String(v instanceof Date?+v:v)!==String(w instanceof Date?+w:w)){if(j===38)difEst.add(r[2]+':'+v+'→'+w);else difOtras++;}}));
ok(la.length===lb.length&&difOtras===0,'LOOKER_MAESTRA igual a v4.10 salvo Estado_OP ('+la.length+' filas, otras diferencias: '+difOtras+')');
console.log('     Estado_OP que cambian por "No aplica":',[...difEst].join(' ; ')||'ninguno en esta copia');
// 2) misma respuesta salvo campos nuevos
const ra=a.get(),rb=b.get();const limpio=o=>{const c=Object.assign({},o);['timestamp','_ms','_prev','finalizadas','listasCierre'].forEach(k=>delete c[k]);return c;};
const opsA=JSON.stringify(limpio(ra).ops),opsB=JSON.stringify(limpio(rb).ops);
ok(JSON.stringify(limpio(ra).tareas)===JSON.stringify(limpio(rb).tareas)&&JSON.stringify(limpio(ra).produccion)===JSON.stringify(limpio(rb).produccion),'Tareas y producción idénticas a v4.10');
const term=rb.ops.filter(o=>o.estado==='Terminado').map(o=>o.op);console.log('     O.P. Terminado en la copia:',term.join(', '));
ok(term.length>=2,'hay O.P. terminadas para probar');
// 3) escenario: T1 con entrega y sin pendientes → Finalizada; T2 sin entrega → Lista; T3 con compromiso abierto → Lista
const [T1,T2,T3]=term;
const E=b.C.getSheetByName('ENTREGAS_CLIENTE');E.appendRow([T1,'x','c','com','01/10/2026','01/10/2026',0,new Date(2026,9,5),'Entregado','j','']);if(T3)E.appendRow([T3,'x','c','com','01/10/2026','01/10/2026',0,new Date(2026,9,6),'Entregado','j','']);
b.M.insertSheet('BITACORA_OP');const Bh=b.M.getSheetByName('BITACORA_OP');Bh.appendRow(ENC_B);if(T3)Bh.appendRow(['B1','','J','j@p.com',T3,'','Compromiso','x','A','','Abierto','','','']);Bh.appendRow(['B2','','J','j@p.com',T1,'','Compromiso','y','A','','Cerrado','','','ok']);
let r=b.get();const fin=r.finalizadas.filter(x=>x.estado==='Finalizada').map(x=>x.op);
ok(fin.length===1&&fin[0]===T1,'Finalizada solo la O.P. con tareas + entrega + sin pendientes ('+T1+')');
const lc={};r.listasCierre.forEach(x=>lc[x.op]=x.faltan.join(' | '));
ok(/entrega/.test(lc[T2]||''),'Sin entrega → Lista para cierre: '+lc[T2]);
if(T3)ok(/abierto/.test(lc[T3]||'')&&!/entrega/.test(lc[T3]),'Con compromiso abierto → Lista para cierre: '+lc[T3]);
const F1=r.finalizadas.find(x=>x.op===T1);console.log('     Registro:',JSON.stringify(Object.assign({},F1,{detalle:F1.detalle.length+' áreas'})));
ok(F1.entregaReal==='05/10/2026'&&F1.tareas>0&&F1.inicioPlan&&F1.finPlan,'El registro guarda fechas, entrega real y tareas');
// 4) no se duplica
b.get();b.get();const SH=b.M.getSheetByName('OPS_FINALIZADAS');ok(SH.getLastRow()===2,'Consultas repetidas: 1 sola fila por O.P. (filas: '+(SH.getLastRow()-1)+')');
// 5) se reabre si deja de cumplir y vuelve a cerrar
Bh.appendRow(['B3','','J','j@p.com',T1,'','Bloqueo','z','A','','Abierto','','','']);r=b.get();
ok(r.finalizadas.find(x=>x.op===T1).estado==='Reabierta'&&SH.getLastRow()===2,'Nuevo bloqueo abierto → "Reabierta" (sin borrar ni duplicar)');
Bh.getRange(Bh.getLastRow(),11).setValue('Cerrado');r=b.get();const F2=r.finalizadas.find(x=>x.op===T1);
ok(F2.estado==='Finalizada'&&F2.reaperturas===1&&SH.getLastRow()===2,'Se cierra el bloqueo → "Finalizada" otra vez, reaperturas = 1');
// 6) si la O.P. ya no está en LOOKER, el registro se conserva
const LM=b.M.getSheetByName('LOOKER_MAESTRA');const n=LM.getLastRow();const vals=LM.getRange(1,1,n,40).getValues();
const quedan=vals.filter((x,i)=>i===0||String(x[2])!==String(T1));LM.clearContents();LM.getRange(1,1,quedan.length,40).setValues(quedan);
r=b.get();ok(r.finalizadas.find(x=>x.op===T1).estado==='Finalizada'&&!r.ops.some(o=>o.op===T1),'O.P. borrada de LOOKER: el registro sigue "Finalizada" con su resumen');
const rf=JSON.parse(b.F.doGet({parameter:{tipo:'finalizadas'}}).txt);ok(Array.isArray(rf)&&rf.length===1,'?tipo=finalizadas devuelve el registro');
// 7) "No aplica" ya no bloquea el Terminado: una O.P. terminada con una tarea pasada a "No aplica"
const NA=(base)=>{const sh=base['DIBUJO']||base['COMPRAS'];let last='';const filas={};
  Object.keys(sh.cells).forEach(k=>{const [r,c]=k.split(',').map(Number);(filas[r]=filas[r]||{})[c]=sh.cells[k];});
  for(const r of Object.keys(filas).map(Number).sort((x,y)=>x-y)){const f=filas[r];if(f[2]&&f[2][0]!==''&&f[2][0]!=null)last=String(f[2][0]);
    if(last==='4077'&&f[16]&&f[16][0]==='Terminado'){f[16][0]='No aplica';sh.cells[r+',16']=f[16];return;}}};
const a2=hacer(M410,NA),b2=hacer(M411,NA);
const ea=a2.F.getDatosOPs().find(o=>o.op==='4077'),eb=b2.F.getDatosOPs().find(o=>o.op==='4077');
ok(ea&&eb&&ea.estado==='En Progreso'&&eb.estado==='Terminado','4077 con una tarea "No aplica": v4.10 = '+(ea&&ea.estado)+' → v4.11 = '+(eb&&eb.estado));
ok(ea.avanceReal===eb.avanceReal,'El avance no cambia ('+eb.avanceReal+' %)');
