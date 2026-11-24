process.env.TZ='America/Bogota';
const {Spreadsheet,entorno,cargar}=require('./gsim_rep.js');
const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ FALLA ')+m); if(!c) process.exitCode=1;};
const GC='/home/claude/trabajo/MACRO_COMERCIAL_v14_14.gs',GM='/home/claude/trabajo/MAESTRA_POLYUPROTEC_v4_13.gs';
const ID={M:'1v55aTL923MTMVXU2iuxYMATP0LePk6tUFyYx1jMsLj4',COMPRAS:'1kLqy0vkEt8q-3nfg1gGuLnSXHffY5E2tMf38ncAZ3hU',GALVANIZADO:'1Pem1XZmjV7tBFf1T-sKTV0EynxZSUSRPly2F52ZXrzQ',
  DISEÑO:'1TZVeRXofIyUEJCxfm3gcgvQfeMInt9VOIYj78rssaUg',DIBUJO:'1yxBiuE8Wu_tkZRTCLWRS7jaqM2tpXcLrESO5XW0AlxE',PRODUCCION:'1hjd1v3L7rfJhK3Nu5LsRXoN5WTNnoigepwZis0Gh0Mc',PRODUCCION_BOGOTA:'1g-xblOWHioFZbxpwlFZFHb60Hwa85q5X3jRSHHYk_X8'};
// Cronograma típico: fila 5 encabezados; SUB A (peso 1.000) filas 6-9
const crono=nombre=>{const c={};const E={2:'OP',11:'NOMBRE_SUBESTRUCTURA',12:'PESO_KG_SUBESTRUCTURA',13:'SEDE',14:'DESCRIPCION_TAREAS',16:'ESTADO',19:'KG_AVANCE_ACUMULADO',20:'%_AVANCE_KG'};
  for(const k in E)c['5,'+k]=[E[k],null];
  [[6,'Recepción','Abierto',''],[7,'Corte','Abierto',''],[8,'Armado','Abierto',''],[9,'Despacho','Abierto','']].forEach(([r,t,e,kg],i)=>{
    c[r+',2']=['4200',null];if(i===0){c[r+',11']=['SUB A',null];c[r+',12']=[1000,null];c[r+',13']=[nombre==='PRODUCCION_BOGOTA'?'BOGOTÁ':'BARRANQUILLA',null];}
    c[r+',14']=[t,null];c[r+',16']=[e,null];c[r+',19']=[kg,null];c[r+',20']=['','=S'+r+'/L$6'];});
  return new Spreadsheet(ID[nombre],{Cronograma:{cells:c}},nombre);};
const archivos={};Object.keys(ID).filter(k=>k!=='M').forEach(k=>archivos[ID[k]]=crono(k));
const M=new Spreadsheet(ID.M,{LINEA_BASE:{cells:{}}},'MAESTRA');archivos[ID.M]=M;
const props={AREAS_PROTEGIDAS:JSON.stringify(Object.fromEntries(Object.keys(ID).filter(k=>k!=='M').map(k=>[ID[k],k])))};
const mkEnv=()=>{const env=entorno(archivos,M,{sinUi:true});env.G.SpreadsheetApp.flush=()=>{};
  env.G.PropertiesService={getScriptProperties:()=>({getProperty:k=>props[k]||null,setProperty(k,v){props[k]=v;}}),getDocumentProperties:()=>({getProperty:()=>null,setProperty(){}})};
  env.G.LockService={getScriptLock:()=>({waitLock(){},tryLock:()=>true,releaseLock(){}}),getDocumentLock:()=>({tryLock:()=>true,releaseLock(){}})};return env;};
const FM=cargar(GM,mkEnv(),['_alEditarArea']),FC=cargar(GC,mkEnv(),['_onEditEstadoKg','_archivosEstadoKg']);
const sh=a=>archivos[ID[a]].getSheetByName('Cronograma'),est=(a,r)=>sh(a).getRange(r,16).getValue();
const ev=(a,r,c,old)=>({range:sh(a).getRange(r,c),source:archivos[ID[a]],oldValue:old,user:{getEmail:()=>'ana.compras@polyuprotec.com'}});
// usuario escribe: ambos activadores corren (Maestra y Comercial)
const escribir=(a,r,c,v)=>{const old=sh(a).getRange(r,c).getValue();sh(a).getRange(r,c).setValue(v);const e=ev(a,r,c,old===''?undefined:old);FC._onEditEstadoKg(e);FM._alEditarArea(e);};
const hist=()=>{const h=M.getSheetByName('HISTORIAL_CAMBIOS');if(!h)return[];const n=h.getLastRow();return n<2?[]:h.getRange(2,1,n-1,16).getValues();};
const ultimo=()=>hist().slice(-1)[0]||[];

console.log('— Compras: estados manuales');
escribir('COMPRAS',6,16,'En Proceso');ok(est('COMPRAS',6)==='En Proceso','1. Compras: Abierto → En Proceso a mano, sin kg');
let h=ultimo();ok(h[1]==='Ana Compras'&&h[2]==='ana.compras@polyuprotec.com'&&h[3]==='4200'&&h[4]==='COMPRAS'&&h[6]==='Recepción'&&h[7]==='Estado'&&h[8]==='Abierto'&&h[9]==='En Proceso'&&h[0] instanceof Date&&h[10]==='Cambio permitido',
  '   historial: usuario, correo, fecha, OP, área, tarea, anterior y nuevo → '+JSON.stringify(h.slice(1,11)));
escribir('COMPRAS',6,16,'Terminado');ok(est('COMPRAS',6)==='Terminado'&&ultimo()[10]==='Terminación registrada','1b. Compras: En Proceso → Terminado a mano (registrado)');
escribir('COMPRAS',7,16,'Terminado');ok(est('COMPRAS',7)==='Terminado','1c. Compras: Abierto → Terminado directo');
escribir('COMPRAS',8,19,500);ok(est('COMPRAS',8)==='Abierto','2. Compras: escribir kg ya no cambia el estado solo');
ok(!FC._archivosEstadoKg().some(x=>x.area==='Compras'),'2b. Compras ya no está en «⚖️ Estados por kg»');
const lista=FC._archivosEstadoKg().map(x=>x.area);ok(lista.length===7&&!lista.includes('Diseño')&&!lista.includes('Dibujo'),'   archivos por kg: '+lista.join(', '));

console.log('— Diseño y Dibujo: estados como hoy');
escribir('DISEÑO',6,16,'En Proceso');escribir('DIBUJO',7,16,'Terminado');ok(est('DISEÑO',6)==='En Proceso'&&est('DIBUJO',7)==='Terminado','3. Diseño y Dibujo siguen cambiando su estado a mano');

console.log('— Áreas por kg (Galvanizado y Producción de las dos plantas)');
['GALVANIZADO','PRODUCCION','PRODUCCION_BOGOTA'].forEach(a=>{
  const n0=hist().length;
  escribir(a,6,16,'Terminado');const h1=ultimo();
  ok(est(a,6)==='Abierto'&&h1[10]==='Intento bloqueado'&&h1[9]==='Terminado'&&/KG_AVANCE_ACUMULADO/.test(h1[11])&&hist().length===n0+1,'5. '+a+': poner Terminado a mano sin kg se revierte (Abierto) y queda «Intento bloqueado»');
  escribir(a,6,19,400);ok(est(a,6)==='En Proceso','4. '+a+': kg 400 de 1.000 → En Proceso solo');
  escribir(a,6,16,'Terminado');ok(est(a,6)==='En Proceso','5b. '+a+': con kg parciales tampoco deja poner Terminado');
  escribir(a,6,16,'Abierto');ok(est(a,6)==='En Proceso','5c. '+a+': ni bajarlo a Abierto a mano');
  escribir(a,6,19,1000);ok(est(a,6)==='Terminado','4b. '+a+': kg 1.000 de 1.000 → Terminado solo');
  escribir(a,7,16,'Reproceso');ok(est(a,7)==='Reproceso'&&ultimo()[10]==='Cambio permitido','   '+a+': «Reproceso» sí se marca a mano');
  escribir(a,7,16,'Terminado');ok(est(a,7)==='Reproceso','   '+a+': salir de Reproceso a un estado distinto al de los kg se bloquea');
  escribir(a,7,16,'Abierto');ok(est(a,7)==='Abierto','   '+a+': salir de Reproceso al estado de los kg (Abierto) se acepta');
  escribir(a,8,16,'');ok(est(a,8)==='Abierto','   '+a+': borrar el estado a mano se revierte');
});
ok(['PRODUCCION','PRODUCCION_BOGOTA'].every(a=>[6,7,8].map(r=>est(a,r)).join()===[6,7,8].map(r=>est('GALVANIZADO',r)).join()),'6. Bogotá y Barranquilla quedan exactamente igual');
const hp=hist().filter(x=>x[4]==='PRODUCCION'||x[4]==='PRODUCCION_BOGOTA');ok(hp.some(x=>x[15]==='BOGOTÁ')&&hp.some(x=>x[15]==='BARRANQUILLA'),'   historial con la planta de cada intento');
ok(archivos[ID.GALVANIZADO].getSheetByName('Cronograma').getRange(6,20).getFormula()==='=S6/L$6'&&sh('GALVANIZADO').getRange(6,12).getValue()===1000,'   KG_AVANCE_ACUMULADO, PESO y fórmulas sin tocar');
console.log('     historial:',hist().length,'eventos;',hist().filter(x=>x[10]==='Intento bloqueado').length,'intentos bloqueados');
