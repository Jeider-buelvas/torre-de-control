process.env.TZ='America/Bogota';
const {Spreadsheet,entorno,cargar}=require('./gsim_rep.js');const fs=require('fs');
const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ FALLA ')+m); if(!c) process.exitCode=1;};
const GS='/home/claude/trabajo/MACRO_COMERCIAL_v14_13.gs';
// ---- Cronograma de área con: estados, fórmula Q, observación "en pausa por…", lista de estados, reglas de color y validación
const cells={};const put=(r,c,v,f)=>{cells[r+','+c]=[v,f||null];};
put(5,14,'DESCRIPCION_TAREAS');put(5,16,'ESTADO');
const filas=[[6,'Terminado'],[7,'En pausa'],[8,'Abierto'],[9,'En pausa'],[10,'Reproceso'],[11,'En Pausa']];
filas.forEach(([r,e])=>{put(r,14,'Tarea '+r);put(r,16,e);put(r,17,'',`=IF(P${r}="Terminado";0,4;IF(P${r}="En pausa";0,2;IF(P${r}="Reproceso";0,1;0)))`);});
put(12,29,'Detenida en pausa por lluvia');   // observación: NO se toca
put(13,29,'en pausa');                        // observación con texto exacto: NO se toca (no es la columna ESTADO)
const asg={};const pa=(r,c,v)=>{asg[r+','+c]=[v,null];};pa(12,4,'Abierto');pa(13,4,'En pausa');pa(14,4,'Terminado');pa(15,4,'Reproceso');pa(24,4,'En pausa');
const area=new Spreadsheet('AREA',{Cronograma:{cells},'Assignees and Status':{cells:asg},'RESPALDO_SEP · Cronograma':{cells:{'7,16':['En pausa',null]}}},'COMPRAS');
const com=new Spreadsheet('COM',{BASE_CREADOR:{cells:{}},REPORTE_ESTADOS_KG:{cells:{'5,7':['En pausa',null]}}},'COMERCIAL');
// ---- extensiones del simulador: TextFinder, formato condicional y validaciones
const SheetC=area.sheets[0].constructor;
SheetC.prototype.createTextFinder=function(txt){const sh=this;const o={fx:false,entera:false,mayus:false};
  const tf={matchFormulaText(b){o.fx=b;return tf;},matchEntireCell(b){o.entera=b;return tf;},matchCase(b){o.mayus=b;return tf;},
   _hits(){const out=[];for(const [k,x] of sh.cells){const [r,c]=k.split(',').map(Number);const base=o.fx?(x.f||''):(x.f?'':String(x.v==null?'':x.v));
     const a=o.mayus?base:base.toLowerCase(),t=o.mayus?txt:txt.toLowerCase();if(!a)continue;if(o.entera?a===t:a.includes(t))out.push([r,c,x]);}return out;},
   findAll(){return tf._hits().map(([r,c,x])=>({getFormula:()=>x.f||'',setValue:v=>{x.v=v;}}));},
   replaceAllWith(n){const h=tf._hits();h.forEach(([r,c,x])=>{if(o.fx)x.f=x.f.replace(new RegExp(txt.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),o.mayus?'g':'gi'),n);else x.v=n;});return h.length;}};return tf;};
const RP=Object.getPrototypeOf(area.sheets[0].getRange(1,1));
RP.createTextFinder=function(txt){const R=this;const sh=this.sh;const tf=sh.createTextFinder(txt);const h0=tf._hits;
  tf._hits=function(){return h0.call(tf).filter(([r,c])=>r>=R.r&&r<R.r+R.nr&&c>=R.c&&c<R.c+R.nc);};return tf;};
const reglas={Cronograma:[{tipo:'CUSTOM_FORMULA',v:['=Y(AL$4>=$AE6; AL$4<=$AG6; $P6="En pausa")'],color:'amarillo'},{tipo:'CUSTOM_FORMULA',v:['=Y(AL$4>=$AE6; AL$4<=$AG6; $P6="Terminado")'],color:'azul'},{tipo:'TEXT_EQUAL_TO',v:['En pausa'],color:'amarillo2'},{grad:true}]};
const mkRule=d=>({getBooleanCondition:()=>d.grad?null:{getCriteriaType:()=>d.tipo,getCriteriaValues:()=>d.v},
  copy:()=>{const n=Object.assign({},d);const b={whenFormulaSatisfied:f=>{n.v=[f];return b;},whenTextEqualTo:t=>{n.v=[t];return b;},whenTextContains:t=>{n.v=[t];return b;},build:()=>mkRule(n)};return b;},_d:d});
SheetC.prototype.getConditionalFormatRules=function(){return (reglas[this.name]||[]).map(mkRule);};
SheetC.prototype.setConditionalFormatRules=function(rs){reglas[this.name]=rs.map(r=>r._d);};
const dvs={Cronograma:{'7,16':{tipo:'VALUE_IN_LIST',lista:['Abierto','En pausa','Terminado','Reproceso']}}};
SheetC.prototype.getDataValidations=function(){return [];};
const env=entorno({AREA:area,COM:com},com,{});
env.G.SpreadsheetApp.BooleanCriteria={CUSTOM_FORMULA:'CUSTOM_FORMULA',TEXT_EQUAL_TO:'TEXT_EQUAL_TO',TEXT_CONTAINS:'TEXT_CONTAINS'};
env.G.SpreadsheetApp.DataValidationCriteria={VALUE_IN_LIST:'VALUE_IN_LIST'};
// validaciones: rango de datos con una celda de lista escrita
const RangeProto=Object.getPrototypeOf(area.sheets[0].getRange(1,1));
RangeProto.getDataValidations=function(){const nm=this.sh.name;const D=dvs[nm]||{};const out=[];for(let i=0;i<this.nr;i++){const f=[];for(let j=0;j<this.nc;j++){const d=D[(this.r+i)+','+(this.c+j)];
  f.push(d?{getCriteriaType:()=>d.tipo,getCriteriaValues:()=>[d.lista,true],copy:()=>{const b={requireValueInList:(l)=>{b.l=l;return b;},build:()=>({_l:b.l})};return b;}}:null);}out.push(f);}return out;};
RangeProto.setDataValidations=function(m){const nm=this.sh.name;for(let i=0;i<m.length;i++)for(let j=0;j<m[i].length;j++){const v=m[i][j];if(v&&v._l)dvs[nm][(this.r+i)+','+(this.c+j)].lista=v._l;}};
env.G.LockService={getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})};
const IDS={'Compras':'AREA'};
const F=cargar(GS.replace('',''),env,['_migrarArchivo','_migracionEnProceso','_archivosMigracion']);
const shC=area.getSheetByName('Cronograma'),shA=area.getSheetByName('Assignees and Status');
const Qantes=filas.map(([r])=>shC.getRange(r,17).getFormula());
// 1) revisar: cuenta sin cambiar
const rv=F._migrarArchivo(area,false);console.log('     revisar:',JSON.stringify(rv));
ok(rv.valores===5&&rv.formulas===6&&rv.formato===2&&rv.validaciones===1,'Revisar cuenta 5 valores (3 estados + 2 de la lista), 6 fórmulas, 2 reglas de color y 1 validación');
ok(shC.getRange(7,16).getValue()==='En pausa'&&/"En pausa"/.test(shC.getRange(7,17).getFormula()),'Revisar no cambia nada');
// 2) aplicar
const ap=F._migrarArchivo(area,true);const ver=F._migrarArchivo(area,false);
ok(JSON.stringify(ver)==='{"valores":0,"formulas":0,"formato":0,"validaciones":0}','Aplicar: verificación final en 0');
ok([7,9,11].every(r=>shC.getRange(r,16).getValue()==='En Proceso')&&shC.getRange(6,16).getValue()==='Terminado'&&shC.getRange(8,16).getValue()==='Abierto'&&shC.getRange(10,16).getValue()==='Reproceso','Estados: En pausa → En Proceso; Terminado, Abierto y Reproceso igual');
ok(filas.every(([r],i)=>shC.getRange(r,17).getFormula()===Qantes[i].replace('"En pausa"','"En Proceso"')),'Fórmulas %_APORTE: solo cambia el texto del estado');
ok(shC.getRange(12,29).getValue()==='Detenida en pausa por lluvia'&&shC.getRange(13,29).getValue()==='en pausa','Las observaciones no se tocan (ni "Detenida en pausa por lluvia" ni una que diga exactamente "en pausa")');
ok(shA.getRange(13,4).getValue()==='En Proceso'&&shA.getRange(24,4).getValue()==='En Proceso'&&shA.getRange(12,4).getValue()==='Abierto','Lista de estados (Assignees and Status): En Proceso');
ok(reglas.Cronograma[0].v[0]==='=Y(AL$4>=$AE6; AL$4<=$AG6; $P6="En Proceso")'&&reglas.Cronograma[0].color==='amarillo'&&reglas.Cronograma[1].v[0].includes('"Terminado"')&&reglas.Cronograma[2].v[0]==='En Proceso','Reglas de color: mismo color, ahora con "En Proceso"; las demás igual');
ok(dvs.Cronograma['7,16'].lista.join()==='Abierto,En Proceso,Terminado,Reproceso','Validación con lista: En Proceso');
ok(area.getSheetByName('RESPALDO_SEP · Cronograma').getRange(7,16).getValue()==='En pausa','Las hojas de respaldo no se tocan');
// equivalencia de resultado de la fórmula Q: misma evaluación con el estado nuevo
const evalQ=(fx,estado)=>{const m=fx.match(/P\d+="([^"]+)";([\d,]+)/g).map(x=>x.match(/="([^"]+)";([\d,]+)/));for(const [,e,v] of m)if(e.toLowerCase()===estado.toLowerCase())return v;return '0';};
ok(filas.every(([r,e],i)=>evalQ(Qantes[i],e)===evalQ(shC.getRange(r,17).getFormula(),shC.getRange(r,16).getValue())),'El %_APORTE de cada tarea da exactamente lo mismo que antes');
// 3) segunda ejecución: no hay nada que cambiar (no duplica)
const ap2=F._migrarArchivo(area,true);ok(ap2.valores+ap2.formulas+ap2.formato+ap2.validaciones===0,'Volver a aplicar no cambia nada (idempotente)');
