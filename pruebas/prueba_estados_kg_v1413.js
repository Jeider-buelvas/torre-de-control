process.env.TZ='America/Bogota';
const {Spreadsheet,entorno,cargar}=require('./gsim_rep.js');const fs=require('fs');
const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ FALLA ')+m); if(!c) process.exitCode=1;};
const GS='/home/claude/trabajo/MACRO_COMERCIAL_v14_13.gs';
// Cronograma de un área: fila 5 = subestructura A (peso 10.000), filas 5-9 tareas; fila 10 = subestructura B sin peso
const filas=[];const T=(r,sub,peso,tarea,estado,kg,subRow)=>{const f={};f[2]=r===5?'4200':'';f[11]=sub;f[12]=peso;f[14]=tarea;f[16]=estado;f[19]=kg;f[20]='=S'+r+'/L$'+subRow;filas.push([r,f]);};
filas.push([4,{2:'OP',11:'NOMBRE_SUBESTRUCTURA',14:'DESCRIPCION_TAREAS',16:'ESTADO'}]);T(5,'SUB A',10000,'Recepción material','Abierto','',5);
T(6,'','','Corte','Abierto',3000,5);
T(7,'','','Armado','Abierto',7500,5);
T(8,'','','Soldadura','Abierto',10000,5);
T(9,'','','Calidad','Abierto',12000,5);
T(10,'SUB B','','Embalaje','Abierto',500,10);
T(11,'','','Cargue','Terminado','',10);
T(12,'','','Despacho','No aplica',9000,10);
T(13,'SUB C',2000,'Ingreso','Terminado','',13);
T(14,'','','Montaje','En pausa',2000,13);T(15,'','','Pernado','En pausa',1000,13);
const cells={};filas.forEach(([r,f])=>{for(const c in f){const v=f[c];cells[r+','+c]=typeof v==='string'&&v.startsWith('=')?['',v]:[v,null];}});
['ÁREA','x'].forEach(()=>{});
const area=new Spreadsheet('AREA',{Cronograma:{cells}},'COMPRAS');const com=new Spreadsheet('COM',{BASE_CREADOR:{cells:{}}},'COMERCIAL');
const env=entorno({AREA:area,COM:com},com,{});
const F=cargar(GS,env,['_evaluarEstadosKg','_aplicarEstadosKg','_onEditEstadoKg','_archivosEstadoKg','_estadoPorKg']);
const sh=area.getSheetByName('Cronograma');const est=r=>sh.getRange(r,16).getValue(),kgv=r=>sh.getRange(r,19).getValue();
// los kg se escriben uno a uno, como lo haría el área (onEdit)
const editar=(r,c,v)=>{sh.getRange(r,c).setValue(v);F._onEditEstadoKg({range:{getSheet:()=>sh,getColumn:()=>c,getNumColumns:()=>1,getRow:()=>r,getNumRows:()=>1}});};
[5,6,7,8,9,10,12,14].forEach(r=>editar(r,19,kgv(r)));
ok(est(5)==='Abierto','1. Sin kg → Abierto');
ok(est(6)==='En Proceso'&&est(7)==='En Proceso','2. 3.000 y 7.500 de 10.000 → En Proceso');
ok(est(8)==='Terminado','3. 10.000 de 10.000 → Terminado');
ok(est(9)==='Terminado'&&kgv(9)===12000,'4. 12.000 de 10.000 → Terminado, sin tocar el valor (sigue 12.000)');
ok(est(10)==='Abierto','5. Sin peso válido → no cambia (sigue Abierto), nunca Terminado');
const ev=F._evaluarEstadosKg(sh,4,14);ok(/PENDIENTE/.test(ev.find(x=>x.fila===10).accion),'5b. …y queda "pendiente de validación" en el reporte');
ok(est(12)==='No aplica','"No aplica" no se toca aunque tenga kg');
ok(est(11)==='Terminado','Solo avanza: un Terminado sin kg no se baja');
ok(/REVISAR/.test(ev.find(x=>x.fila===13).accion),'…y sale en el reporte para revisar');
ok(est(14)==='Terminado','Montaje: 2.000 de 2.000 y estaba En pausa → Terminado');
// el área baja los kg: no retrocede (solo avanza)
editar(8,19,4000);ok(est(8)==='Terminado','Si después bajan los kg, no retrocede (queda en el reporte)');
// cambiar el estado a mano por debajo de los kg: vuelve al mínimo que dicen los kg
sh.getRange(7,16).setValue('Abierto');F._onEditEstadoKg({range:{getSheet:()=>sh,getColumn:()=>16,getNumColumns:()=>1,getRow:()=>7,getNumRows:()=>1}});ok(est(7)==='En Proceso','Si alguien baja el estado a mano por debajo de sus kg, vuelve a En Proceso');
// pegar varias filas a la vez
sh.getRange(5,19).setValue(10000);sh.getRange(6,19).setValue(10000);F._onEditEstadoKg({range:{getSheet:()=>sh,getColumn:()=>19,getNumColumns:()=>1,getRow:()=>5,getNumRows:()=>2}});ok(est(5)==='Terminado'&&est(6)==='Terminado','Pegar varias filas de kg a la vez también actualiza');
// otra columna: no hace nada
const antes=JSON.stringify([5,6,7,8,9].map(est));F._onEditEstadoKg({range:{getSheet:()=>sh,getColumn:()=>21,getNumColumns:()=>1,getRow:()=>6,getNumRows:()=>1}});ok(JSON.stringify([5,6,7,8,9].map(est))===antes,'Editar otra columna (fechas) no cambia estados');
const ar=F._archivosEstadoKg().map(x=>x.area);ok(!ar.includes('Diseño')&&!ar.includes('Dibujo')&&ar.length===8,'6. Diseño y Dibujo no se vigilan; sí los otros 8 archivos: '+ar.join(', '));
// las fórmulas de % y fechas no cambian
ok(!F._evaluarEstadosKg(sh,4,14).some(x=>x.fila===4),'La fila de encabezados no se evalúa');ok(sh.getRange(6,20).getFormula()==='=S6/L$5','Las fórmulas del cronograma no se tocan');
// dato antiguo «En pausa» con kg parciales: se reconoce (no cambia de nivel; la migración lo renombra)
editar(15,19,1000);ok(est(15)==='En pausa','Un «En pausa» antiguo con kg parciales se reconoce como el mismo nivel (no lo sube ni lo baja)');
editar(15,19,2000);ok(est(15)==='Terminado','…y si completa los kg pasa a Terminado');
