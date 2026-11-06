process.env.TZ='America/Bogota';
const {Spreadsheet,entorno,cargar}=require('./gsim.js');const fs=require('fs');
const M46='/home/claude/trabajo/MAESTRA_POLYUPROTEC_v4_6.gs', V45='/home/claude/trabajo/PRODUCCION_V2_v4_5.gs';
const ID_M='1v55aTL923MTMVXU2iuxYMATP0LePk6tUFyYx1jMsLj4', ID_BAQ='1hjd1v3L7rfJhK3Nu5LsRXoN5WTNnoigepwZis0Gh0Mc', ID_BOG='1g-xblOWHioFZbxpwlFZFHb60Hwa85q5X3jRSHHYk_X8';
const v2=(id,n)=>{const d=JSON.parse(fs.readFileSync('v2_base.json'));const cr=new Spreadsheet('t',d).getSheetByName('Cronograma');const v=cr.getRange(6,1,cr.getLastRow()-5,13).getValues();const i=v.findIndex(r=>String(r[1])==='4103');d['Cronograma'].cells[(6+i)+',13'][0]='BOGOTÁ';
  const s=new Spreadsheet(id,d,n);cargar(V45,entorno({},s,{sinUi:true}),['separarPorPlanta']).separarPorPlanta();return s;};
const M=new Spreadsheet(ID_M,JSON.parse(fs.readFileSync('maestra_base.json')),'MAESTRA');
const p=M.getSheetByName('PRODUCCION');const c=p.copyTo(M);c.setName('PRODUCCION_BOGOTA');c.cells.get('1,1').f=c.cells.get('1,1').f.replace(ID_BAQ,ID_BOG);
['PRODUCCION','PRODUCCION_BOGOTA'].forEach(n=>{const sh=M.getSheetByName(n);const v=sh.getRange(1,1,sh.getLastRow(),13).getValues();const i=v.findIndex(r=>String(r[1]).replace(/\.0$/,'')==='4103');sh.getRange(i+1,13).setValue('BOGOTÁ');});
const env=entorno({[ID_M]:M,[ID_BAQ]:v2(ID_BAQ,'X_BARRANQUILLA'),[ID_BOG]:v2(ID_BOG,'X_BOGOTA')},M,{sinUi:true});
const F=cargar(M46,env,['actualizarLookerMaestra','actualizarProduccionDiaria','getDatosOPs','getDatosTareas','getDatosAreas','getDatosProduccion','_escribirHistorial','_evento','getDatosHistorial']);
F.actualizarLookerMaestra();F.actualizarProduccionDiaria(true);
F._escribirHistorial(M,[F._evento('Producción Bogotá','p1@polyuprotec.com','4103','PRODUCCION','PRIORIDAD (1-5)','Kg Fabricados','Estado','Abierto','Terminado','Terminación registrada','',null,true,'BOGOTÁ'),
  F._evento('Producción Barranquilla','p2@polyuprotec.com','4103','PRODUCCION','PRIORIDAD (6-10)','Kg Fabricados','Estado','Abierto','En pausa','Cambio permitido','',null,true,'BARRANQUILLA'),
  F._evento('Dibujo','d@polyuprotec.com','4109','DIBUJO','Pedido 05','Modelado','Estado','Abierto','Terminado','Terminación registrada','',null,true,'BOGOTÁ')]);
const D={ops:F.getDatosOPs(),areas:F.getDatosAreas(),curva:[],tareas:F.getDatosTareas(),produccion:F.getDatosProduccion(),historial:F.getDatosHistorial(),entregas:null,bitacora:[]};
fs.writeFileSync('api_plantas.json',JSON.stringify(D));
console.log('ops',D.ops.length,'· tareas',D.tareas.length,'· producción',D.produccion.length,'· historial',D.historial.length,'· sedes:',[...new Set(D.ops.map(o=>o.sede))].join(','));
