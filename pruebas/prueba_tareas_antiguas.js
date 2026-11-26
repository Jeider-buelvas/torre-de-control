process.env.TZ='America/Bogota';
const {Spreadsheet,entorno,cargar}=require('./gsim_rep.js');
const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ FALLA ')+m); if(!c) process.exitCode=1;};
const GS='/home/claude/trabajo/MACRO_COMERCIAL_v14_15.gs';
const BOG='1g-xblOWHioFZbxpwlFZFHb60Hwa85q5X3jRSHHYk_X8',BAQ='1hjd1v3L7rfJhK3Nu5LsRXoN5WTNnoigepwZis0Gh0Mc';
const D=s=>{const [d,m,y]=s.split('/').map(Number);return new Date(y,m-1,d);};
const ANT=['Corte','Armado','Soldadura','Calidad','Entrega en negro'];
function crono(bloques){const c={};let r=6;
  const E={2:'OP',11:'NOMBRE_SUBESTRUCTURA',12:'PESO_KG_SUBESTRUCTURA',13:'Sede',14:'DESCRIPCION_TAREAS',16:'ESTADO',19:'KG_AVANCE_ACUMULADO'};for(const k in E)c['5,'+k]=[E[k],null];
  const put=(rr,col,v,f)=>{c[rr+','+col]=[v,f||null];};
  bloques.forEach(b=>{let primera=true;b.subs.forEach(s=>{const s0=r,n=s.tareas.length,s1=r+n-1;
    s.tareas.forEach((t,i)=>{const rr=r+i;
      if(primera&&i===0){put(rr,1,'Noviembre');put(rr,2,b.op);put(rr,3,'Proyecto '+b.op);put(rr,6,1000);put(rr,9,'',`=((L${rr}*100%)/F${rr})/G${rr}`);}
      if(i===0){put(rr,11,s.nombre);put(rr,12,s.peso||1000);put(rr,13,s.sede||'BOGOTÁ');put(rr,18,'',`=SUM(Q${s0}:Q${s1})`);put(rr,24,'',`=SUM(V${s0}:V${s1})`);put(rr,25,'',`=100%/SUM(V${s0}:V${s1})`);put(rr,27,'',`=Z${rr}`);put(rr,35,'',`=SUM(AF${s0}:AF${s1})`);put(rr,36,'',`=100%/SUM(AF${s0}:AF${s1})`);put(rr,37,'',`=AJ${rr}`);}
      else {put(rr,27,'',`=AA${rr-1}+Z${rr}`);put(rr,37,'',`=AK${rr-1}+AJ${rr}`);}
      const asF=n===5?45+i:88+i;
      put(rr,14,t);put(rr,15,'Producción '+(i+1));put(rr,16,s.estados[i]);put(rr,17,'',`='Assignees and Status'!B${asF}%*T${rr}`);
      put(rr,19,s.kg?s.peso||1000:'',n===5?`=L${s0}`:null);put(rr,20,'',`=S${rr}/L${s0}`);
      if(s.u){put(rr,21,D(s.u[i]));put(rr,22,s.v[i],`=AF${rr}`);put(rr,23,D(s.w[i]),`=IF(OR(U${rr}="",V${rr}=0),"",WORKDAY.INTL(U${rr},V${rr}-1,1,DIAS_FESTIVOS!$A$3:$A$20))`);
        put(rr,31,D(s.u[i]));put(rr,32,s.v[i]);put(rr,33,D(s.w[i]),`=IF(OR(AE${rr}="",AF${rr}=0),"",WORKDAY.INTL(AE${rr},AF${rr}-1,1,DIAS_FESTIVOS!$A$3:$A$20))`);}
      put(rr,26,'',`=V${rr}*Y$${s0}`);put(rr,36+0,c[rr+',36']?c[rr+',36'][0]:'',c[rr+',36']?c[rr+',36'][1]:`=AF${rr}*AI$${s0}`);});
    r+=n;primera=false;});});
  return c;}
const T5=e=>Array(5).fill(e),NEW=(e1,e2)=>({tareas:['Kg Fabricados','Entrega en negro'],estados:[e1,e2]});
const fechas={u:['25/05/2026','02/06/2026','10/06/2026','22/06/2026','01/07/2026'],v:[7,6,8,7,1],w:['02/06/2026','10/06/2026','22/06/2026','01/07/2026','01/07/2026']};
const bogBloques=[
 {op:'4085',subs:[Object.assign({nombre:'Columnas Prefabricadas',tareas:ANT,estados:T5('Terminado'),kg:1,peso:8773},fechas)]},
 {op:'4027',subs:[Object.assign({nombre:'LA MINA',tareas:ANT,estados:T5('Terminado'),kg:1,peso:4981},fechas),Object.assign({nombre:'LA TABLA',tareas:ANT,estados:T5('Terminado'),kg:1,peso:1135},fechas),Object.assign({nombre:'ADICIONALES',tareas:ANT,estados:T5('Terminado'),kg:1,peso:1312},fechas)]},
 {op:'4109',subs:[{nombre:'Pedido 05',tareas:ANT,estados:T5('En Proceso')}]},
 {op:'4103',subs:[{nombre:'PRIORIDAD (1-5)',sede:'BARRANQUILLA',tareas:ANT,estados:T5('Terminado'),kg:1},{nombre:'PRIORIDAD (6-10)',sede:'BARRANQUILLA',tareas:ANT,estados:T5('En Proceso')}]},
 {op:'4113',subs:[{nombre:'Prioridad 1 T25',tareas:ANT,estados:T5('Abierto')},{nombre:'Prioridad 2 Refugio',tareas:ANT,estados:T5('Abierto')}]},
 {op:'4999',subs:[{nombre:'Sin bloque nuevo',tareas:ANT,estados:T5('En Proceso')}]},
 {op:'4134',subs:[{nombre:'Proyecto norte',tareas:ANT,estados:T5('Abierto')}]},
 {op:'4135',subs:[Object.assign({nombre:'Pedido 73'},NEW('Abierto','Abierto'))]},
 {op:'4134',subs:[Object.assign({nombre:'Proyecto norte'},NEW('Abierto','Abierto'))]},
 {op:'4113',subs:[Object.assign({nombre:'Prioridad 1 T25'},NEW('Terminado','En Proceso')),Object.assign({nombre:'Prioridad 2 Refugio'},NEW('En Proceso','Abierto'))]},
 {op:'4109',subs:[Object.assign({nombre:'Pedido 05'},NEW('En Proceso','En Proceso'))]}];
const AS={};AS['88,1']=['Kg Fabricados',null];AS['88,2']=[50,null];AS['89,1']=['Entrega en negro',null];AS['89,2']=[50,null];
const FEST={'3,1':[D('29/06/2026'),null],'4,1':[D('22/06/2026'),null]};
function hacer(){
  const bog=new Spreadsheet(BOG,{Cronograma:{cells:crono(bogBloques)},'Assignees and Status':{cells:AS},DIAS_FESTIVOS:{cells:FEST}},'PRODUCCION BOGOTA');
  const baq=new Spreadsheet(BAQ,{Cronograma:{cells:crono([{op:'4128',subs:[Object.assign({nombre:'RIOSTRAS',sede:'BARRANQUILLA'},NEW('Terminado','Terminado'))]}])},'Assignees and Status':{cells:AS},DIAS_FESTIVOS:{cells:FEST}},'PRODUCCION BAQ');
  const com=new Spreadsheet('COM',{BASE_CREADOR:{cells:{}}},'COMERCIAL');
  const env=entorno({[BOG]:bog,[BAQ]:baq,COM:com},com,{});env.G.SpreadsheetApp.flush=()=>{};
  env.G.LockService.getScriptLock=()=>({tryLock:()=>true,releaseLock(){}});
  const F=cargar(GS,env,['revisarTareasAntiguasProduccion','aplicarTareasAntiguasProduccion','_rtaAnalizar']);
  return {bog,baq,com,env,F};}
const foto=sh=>JSON.stringify([...sh.cells.entries()].map(([k,x])=>[k,x.v instanceof Date?+x.v:x.v,x.f]).sort());
const filas=sh=>{const out=[];for(let r=6;r<=sh.getLastRow();r++){const t=String(sh.getRange(r,14).getValue()).trim();if(t)out.push({r,op:String(sh.getRange(r,2).getValue()),sub:String(sh.getRange(r,11).getValue()),t,e:sh.getRange(r,16).getValue()});}return out;};
const x=hacer(),cB=x.bog.getSheetByName('Cronograma');const antes=foto(cB),antesBaq=foto(x.baq.getSheetByName('Cronograma'));
const nAntes=filas(cB).length;
console.log('— Revisar');
x.F.revisarTareasAntiguasProduccion();const rep=x.com.getSheetByName('REPORTE_TAREAS_ANTIGUAS');
ok(foto(cB)===antes&&foto(x.baq.getSheetByName('Cronograma'))===antesBaq,'Revisar no cambia nada en los archivos');
const rv=r=>rep.getRange(r,1).getValue();const lineas=[];for(let r=1;r<=rep.getLastRow();r++)lineas.push([1,2,3,4,5].map(c=>rep.getRange(r,c).getValue()));
console.log('     '+lineas[1][0]);
const acc=op=>[...new Set(lineas.filter(l=>String(l[1])===op).map(l=>l[2]))].join();
ok(acc('4109')==='QUITAR (A)'&&acc('4113')==='QUITAR (A)'&&acc('4134')==='QUITAR (A)','A. Duplicados de Bogotá (4109, 4113 con 2 subs, 4134) → QUITAR');
ok(acc('4103')==='QUITAR (B)','B. 4103 de Barranquilla en el archivo de Bogotá → QUITAR');
ok(acc('4085')==='CONVERTIR (C)'&&acc('4027')==='CONVERTIR (C)','C. 4085 y 4027 (3 subestructuras), antiguas y terminadas → CONVERTIR');
ok(acc('4999')==='REVISAR','4999: antigua, no terminada y sin bloque nuevo → REVISAR (no se toca)');
ok(acc('4135')===''&&lineas.filter(l=>l[2]&&/QUITAR|CONVERTIR/.test(l[2])).length===5*(1+2+2+1)+5*(1+3),'Los bloques nuevos no salen en el reporte; una línea por cada fila afectada (30 a quitar + 20 a convertir)');
console.log('— Aplicar');
x.F.aplicarTareasAntiguasProduccion();console.log(x.env.alertas.slice(-1)[0]);
const f=filas(cB);
ok(!f.some(z=>/^(Corte|Armado|Soldadura|Calidad)$/.test(z.t)&&z.op!=='4999'&&!(f.find(y=>y.r<=z.r&&y.op)||{}).op==='4999'),'1. Ya no queda Corte, Armado, Soldadura ni Calidad (salvo la 4999, que se dejó para revisar)');
const bloquesOP=op=>{const o=[];let cur=null;f.forEach(z=>{if(z.op){cur=z.op;}if(cur===op)o.push(z);});return o;};
ok(bloquesOP('4999').map(z=>z.t).join()==='Corte,Armado,Soldadura,Calidad,Entrega en negro','   4999 quedó igual');
ok(f.filter(z=>z.op==='4109').length===1&&bloquesOP('4109').map(z=>z.t+':'+z.e).join()==='Kg Fabricados:En Proceso,Entrega en negro:En Proceso','3. 4109: solo su bloque nuevo, con sus estados');
ok(f.filter(z=>z.op==='4134').length===1&&f.filter(z=>z.op==='4113').length===1&&f.filter(z=>z.op==='4103').length===0,'   4134 y 4113 sin duplicado; 4103 (Barranquilla) fuera del archivo de Bogotá');
const c27=bloquesOP('4027');ok(c27.map(z=>z.t).join()==='Kg Fabricados,Entrega en negro,Kg Fabricados,Entrega en negro,Kg Fabricados,Entrega en negro'&&c27.every(z=>z.e==='Terminado'),'C. 4027: cada una de sus 3 subestructuras con Kg Fabricados + Entrega en negro, Terminado');
const r0=c27[0].r;const Fm=(r,c)=>cB.getRange(r,c).getFormula();
ok(Fm(r0,17)===`='Assignees and Status'!B88%*T${r0}`&&Fm(r0+1,17)===`='Assignees and Status'!B89%*T${r0+1}`,'4. Pesos 50 % / 50 % (Assignees and Status filas 88 y 89)');
ok(Fm(r0,18)===`=SUM(Q${r0}:Q${r0+1})`&&Fm(r0+1,27)===`=AA${r0}+Z${r0+1}`&&Fm(r0+1,37)===`=AK${r0}+AJ${r0+1}`&&Fm(r0,24)===`=SUM(V${r0}:V${r0+1})`,'   Fórmulas de la subestructura ajustadas (suma de aportes, días y acumulados), sin #REF');
ok(!f.some(z=>[17,18,20,24,25,26,27,36,37].some(c=>/#REF/.test(Fm(z.r,c)))),'   Ninguna fórmula rota en todo el Cronograma');
ok(Fm(r0,19)===`=L${r0}`&&Fm(r0+1,20)===`=S${r0+1}/L${r0}`,'   Kg (=peso) y % de la subestructura intactos → avance 100 %');
const U=+cB.getRange(r0,21).getValue(),V=cB.getRange(r0,22).getValue();
ok(U===+D('25/05/2026')&&V===26,'   Fechas reales: inicio de Corte (25/05) y duración hasta el fin de Calidad (01/07) = 26 días hábiles sin festivos ('+V+')');
ok(cB.getRange(r0,15).getValue()==='Producción 1'&&cB.getRange(r0+1,15).getValue()==='Producción 2','   Asignados Producción 1 y 2');
// los bloques nuevos no cambiaron (comparando contenido de la 4135)
const cont=(sh,op)=>{const r=filas(sh).find(z=>z.op===op).r;return [0,1].map(i=>[14,15,16].map(c=>sh.getRange(r+i,c).getValue()).join('|')).join('/');};
ok(cont(cB,'4135')==='Kg Fabricados|Producción 1|Abierto/Entrega en negro|Producción 2|Abierto','   4135 (bloque nuevo) sin cambios');
const resp=x.bog.getSheets().find(s=>/^RESPALDO_TAREAS_ANTIGUAS/.test(s.getName()));
ok(resp&&resp.hidden&&foto(resp)===antes,'8. Respaldo: hoja oculta con el Cronograma original completo ('+(resp&&resp.getName())+')');
ok(foto(x.baq.getSheetByName('Cronograma'))===antesBaq&&!x.baq.getSheets().some(s=>/^RESPALDO_TAREAS/.test(s.getName())),'6. Barranquilla (sin tareas antiguas) no se toca');
ok(filas(cB).length===nAntes-42,'   Filas: '+nAntes+' → '+filas(cB).length+' (30 de bloques quitados + 3 por cada una de las 4 subestructuras convertidas)');
const fotoD=foto(cB);x.F.aplicarTareasAntiguasProduccion();ok(foto(cB)===fotoD,'Aplicar otra vez no cambia nada');
// La sincronización de Producción (v4.8) lee el Cronograma limpio
const env2=entorno({},x.bog,{docProps:{}});const V2=cargar('/home/claude/trabajo/PRODUCCION_V2_v4_8.gs',env2,['leerCronograma_']);
const cr=V2.leerCronograma_(x.bog).ops;
ok(cr['4109'].subs.length===1&&cr['4109'].subs[0].filaKg&&cr['4109'].subs[0].filaEnt&&cr['4027'].subs.length===3&&cr['4027'].subs.every(s=>s.filaKg&&s.filaEnt&&!s.antigua),'5. La sincronización encuentra Kg Fabricados y Entrega en negro en cada subestructura (también en 4027)');
