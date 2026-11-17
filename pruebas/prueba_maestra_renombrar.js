process.env.TZ='America/Bogota';
const {Spreadsheet,entorno,cargar}=require('./gsim.js');const fs=require('fs');
const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ FALLA ')+m); if(!c) process.exitCode=1;};
const MAE='/home/claude/trabajo/MAESTRA_POLYUPROTEC_v4_8.gs';const src=fs.readFileSync(MAE,'utf8');
const IDM=src.match(/var ID_MAESTRA = '([^']+)'/)[1];
const tabla=(enc,filas)=>{const c={};[enc].concat(filas).forEach((r,i)=>r.forEach((v,j)=>c[(i+1)+','+(j+1)]=[v,null]));return {cells:c};};
const ENC_B=['ID','FECHA_HORA','AUTOR','CORREO','OP','AREA','TIPO','DESCRIPCION','RESPONSABLE','FECHA_COMPROMISO','ESTADO','FECHA_CIERRE','CERRADO_POR','NOTA_CIERRE'];
const ENC_LB=['CLAVE','AREA','OP','SUB','TAREA','ESTADO','INI_REAL','INI_REAL_FX','DUR_REAL','DUR_REAL_FX','FIN_REAL','FIN_REAL_FX','ENTREGA','CAPTURA'];
const ENC_H=['FECHA_HORA','USUARIO','CORREO','OP','AREA','SUBESTRUCTURA','TAREA','CAMPO','VALOR_ANTERIOR','VALOR_NUEVO','TIPO','DETALLE','CELDA','NOTIFICAR','NOTIFICADO','PLANTA'];
const M=new Spreadsheet(IDM,{
 'BITACORA_OP':tabla(ENC_B,[['B1','','Yeimi','y@p.com',3998,'DIBUJO','Compromiso','enviar','Ana','','Abierto','','',''],['B2','','Yeimi','y@p.com',39981,'DIBUJO','Nota','x','','','Registrada','','',''],['B3','','Yeimi','y@p.com',3998,'','Bloqueo','y','','','Cerrado','','','ok']]),
 'LINEA_BASE':tabla(ENC_LB,[['DIBUJO|3998|0|0|Modelado','DIBUJO',3998,'T1','Modelado','Terminado','','','','','','','',''],['DIBUJO|39981|0|0|Modelado','DIBUJO',39981,'T1','Modelado','Abierto','','','','','','','',''],['PRODUCCION|3998|1|0|Kg Fabricados','PRODUCCION',3998,'T2','Kg Fabricados','Abierto','','','','','','','','']]),
 'LOOKER_MAESTRA':tabla(['Área','Mes','OP','Nombre de OP'],[['DIBUJO','Oct',3998,'X'],['DIBUJO','',3998,'X'],['PINTURA','Oct',4000,'Y']]),
 'HISTORIAL_CAMBIOS':tabla(ENC_H,[[new Date(2026,10,1),'Dibujo','d@p.com',3998,'DIBUJO','T1','Modelado','Estado','Abierto','Terminado','Terminación registrada','','','NO','','']])
},'MAESTRA');
const env=entorno({[IDM]:M},M);const props={DIF_ENTREGA:JSON.stringify({'3998':'a|b','4000':'c|d'})};
env.G.PropertiesService.getScriptProperties=()=>({getProperty:k=>k==='TOKEN_CORREO_CAMBIOS'?'tk':(props[k]||null),setProperty:(k,v)=>{props[k]=v;}});
env.G.LockService.getScriptLock=()=>({waitLock(){},releaseLock(){}});env.G.SpreadsheetApp.flush=()=>{};
const F=cargar(MAE,env,['_renombrarOPPost','_bitacoraPost','doPost'],'');
const col=(h,c)=>M.getSheetByName(h).getRange(2,c,M.getSheetByName(h).getLastRow()-1,1).getValues().map(r=>String(r[0]));
const histAntes=JSON.stringify(M.getSheetByName('HISTORIAL_CAMBIOS').getRange(2,1,1,16).getValues());
ok(!F._renombrarOPPost({token:'malo',viejo:'3998',nuevo:'4025',motivo:'motivo largo'}).ok,'Token inválido: rechazado');
const r=F._renombrarOPPost({token:'tk',viejo:'3998',nuevo:'4025',motivo:'Corrección del número',usuario:{correo:'jbuelvas@polyuprotec.com',nombre:'jbuelvas@polyuprotec.com'}});
ok(r.ok,'renombrarOP ok: '+JSON.stringify(r.cambios));
ok(col('BITACORA_OP',5).join()==='4025,39981,4025','Tareas de la O.P.: 3998 → 4025 (abierta y cerrada); 39981 intacta');
ok(col('LINEA_BASE',1).join(' ; ')==='DIBUJO|4025|0|0|Modelado ; DIBUJO|39981|0|0|Modelado ; PRODUCCION|4025|1|0|Kg Fabricados'&&col('LINEA_BASE',3).join()==='4025,39981,4025','Línea base: clave y OP renombradas; 39981 intacta');
ok(col('LOOKER_MAESTRA',3).join()==='4025,4025,4000','LOOKER_MAESTRA: 3998 → 4025; 4000 intacta');
ok(JSON.stringify(JSON.parse(props.DIF_ENTREGA))==='{"4000":"c|d","4025":"a|b"}','DIF_ENTREGA: clave 3998 → 4025');
const h=M.getSheetByName('HISTORIAL_CAMBIOS');
ok(JSON.stringify(h.getRange(2,1,1,16).getValues())===histAntes,'Historial anterior NO se reescribe (sigue con 3998)');
const ev=h.getRange(h.getLastRow(),1,1,16).getValues()[0];
ok(String(ev[3])==='4025'&&String(ev[8])==='3998'&&String(ev[9])==='4025'&&ev[10]==='Cambio de número de O.P.'&&/Motivo: Corrección/.test(ev[11]),'Historial: nuevo evento "Cambio de número de O.P." 3998 → 4025 con el motivo');
const n1=h.getLastRow();const r2=F._renombrarOPPost({token:'tk',viejo:'3998',nuevo:'4025',motivo:'Corrección del número',usuario:{correo:'j@p.com'}});
ok(r2.ok&&h.getLastRow()===n1,'Repetir la misma llamada: no duplica el evento ni cambia nada más');
