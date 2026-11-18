process.env.TZ='America/Bogota';
const {Spreadsheet,entorno,cargar}=require('./gsim_rep.js');const fs=require('fs');
const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ FALLA ')+m); if(!c) process.exitCode=1;};
const M49='/home/claude/trabajo/MAESTRA_POLYUPROTEC_v4_9.gs', M410='/home/claude/trabajo/MAESTRA_POLYUPROTEC_v4_10.gs';
const ID_M='1v55aTL923MTMVXU2iuxYMATP0LePk6tUFyYx1jMsLj4';
function hacer(gs){
  const M=new Spreadsheet(ID_M,JSON.parse(fs.readFileSync('maestra_base.json')),'TORRE_CONTROL_MAESTRA');
  const IDC=fs.readFileSync(gs,'utf8').match(/var ID_COMERCIAL = '([^']+)'/)[1];const C=new Spreadsheet(IDC,{},'COMERCIAL');const env=entorno({[ID_M]:M,[IDC]:C},M,{sinUi:true});
  const cache={};env.G.CacheService.getScriptCache=()=>({get:k=>cache[k]||null,put:(k,v)=>{cache[k]=v;},remove:k=>{delete cache[k];}});
  env.G.ContentService={createTextOutput:t=>({txt:t,setMimeType(){return this;}}),MimeType:{JSON:'json'}};
  env.G.PropertiesService.getScriptProperties=()=>({getProperty:()=>null,setProperty(){}});
  const F=cargar(gs,env,['doGet','actualizarLookerMaestra']);F.actualizarLookerMaestra();return {M,F};
}
const a=hacer(M49),b=hacer(M410);
const ra=JSON.parse(a.F.doGet({parameter:{tipo:'todos'}}).txt),rb=JSON.parse(b.F.doGet({parameter:{tipo:'todos',prev:'800,1200,240,2240'}}).txt);
const limpio=o=>{const c=Object.assign({},o);delete c.timestamp;delete c._ms;delete c._prev;return JSON.stringify(c);};
ok(limpio(ra)===limpio(rb),'Datos idénticos a v4.9 ('+ra.tareas.length+' tareas, '+Math.round(JSON.stringify(ra).length/1024)+' KB)');
ok(rb._ms&&['ops','areas','curva','tareas','produccion','historial','entregas','bitacora','capacidades','datos'].every(k=>typeof rb._ms[k]==='number'),'Trae _ms con el tiempo de cada parte: '+JSON.stringify(rb._ms));
const sh=b.M.getSheetByName('RENDIMIENTO_API');ok(sh&&sh.getLastRow()===2,'Hoja RENDIMIENTO_API creada con 1 fila');
const fila=sh.getRange(2,1,1,16).getValues()[0];ok(fila[15]==='800,1200,240,2240'&&fila[14]===ra.tareas.length,'La fila guarda la carga anterior de la App y el n.º de tareas');
b.F.doGet({parameter:{tipo:'todos'}});ok(sh.getLastRow()===2,'Máx. 1 fila por minuto (la 2.ª consulta no escribe)');
const rc=JSON.parse(b.F.doGet({parameter:{tipo:'bitacora'}}).txt);ok(Array.isArray(rc),'Otras consultas (?tipo=bitacora) sin cambios');
