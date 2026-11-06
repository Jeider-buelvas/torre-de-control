process.env.TZ='America/Bogota';
const {Spreadsheet,entorno,cargar}=require('./gsim.js');const fs=require('fs');
const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ FALLA ')+m); if(!c) process.exitCode=1;};
const SRC='/home/claude/trabajo/MACRO_COMERCIAL_v14_8.gs', SRC7='/home/claude/trabajo/MACRO_COMERCIAL_v14_7.gs';
const src=fs.readFileSync(SRC,'utf8');
const ID=a=>src.match(new RegExp("'"+a+"':\\s*'([^']+)'"))[1];
const enc=['MES','OP','NOMBRE_OP','CLIENTE','COMERCIAL','KG_TOTAL_PROYECTO','NUM_PROCESOS','%_PARTICIPACION_PROCESO','%_PESO_SUBESTRUCTURA_PESO','%_PROGRESO_POR_SUBESTRUCTURA','NOMBRE_SUBESTRUCTURA','PESO_KG_SUBESTRUCTURA','Sede','DESCRIPCION_TAREAS','Asignado','ESTADO','%_APORTE_TAREA','%_EJECUCION_SUBESTRUCTURA','KG_AVANCE_ACUMULADO','AVANCE_REAL_%','FECHA_INICIO_TAREA_REAL','DURACION_DIAS_TAREAS_REAL','FECHA_FIN_TAREA_REAL','DURACION_PROCESO_REAL_DIAS','% _TAREA_REAL','%_TAREAS_INDIVIDUALES_REAL','%_TAREAS_ACUMULADO_REAL','%_DE_CUMPLIMIENTO_VS_PLANEACION','OBSERVACIONES','FECHA_ENTREGA_CLIENTE','FECHA_INICIO_TAREA_PLANEADO','DURACION_DIAS_TAREAS_PLANEADO','FECHA_FIN_TAREA_PLANEADO'];
const area=(id,nombre)=>{const c={};enc.forEach((h,i)=>c['5,'+(i+1)]=[h,null]);return new Spreadsheet(id,{'Cronograma':{cells:c},'Assignees and Status':{cells:{}}},nombre);};
function escenario(dosPlantas,fuente){
  const A={[ID('Dibujo')]:area(ID('Dibujo'),'DIBUJO'),[ID('Galvanizado')]:area(ID('Galvanizado'),'GALV'),[ID('Produccion')]:area(ID('Produccion'),'PRODUCCION_V2_BARRANQUILLA'),IDBOG:area('IDBOG','PRODUCCION_V2_BOGOTA')};
  const COM=new Spreadsheet('COM',{'BASE_CREADOR':{cells:{}}},'COMERCIAL');A.COM=COM;
  const env=entorno(A,COM);
  const F=cargar(fuente||SRC,env,['_crearHojaOP','_sincronizarOPConAreas','_bloqueOP','_leerMetaOP','_recorrerHojaOP','_actualizarMetaOP','_reconstruirHojaOP','_plantasSubOP'],dosPlantas?"IDS_PRODUCCION_PLANTA['BOGOTÁ']='IDBOG';":"if(typeof IDS_PRODUCCION_PLANTA!=='undefined')IDS_PRODUCCION_PLANTA['BOGOTÁ']='PON_AQUI_ID_PRODUCCION_BOGOTA';");
  return {A,COM,env,F};
}
const crear=(E,op,sede,nSubs)=>{const ws=E.F._crearHojaOP(E.COM,op,'Proyecto '+op,'Cliente','Luz Mery Alvarez',sede,nSubs,0,['Dibujo','Produccion','Galvanizado'],3,new Date(2026,11,20));
  E.F._recorrerHojaOP(ws,(f,a,s,t,ini)=>{if(ini)ws.getRange(f,5,1,2).setValues([['Torre '+(s+1),1000*(s+1)]]);});ws.getRange(1,38).setValue('');return ws;};
const enviar=(E,ws)=>{E.COM.setActiveSheet(ws);E.F._sincronizarOPConAreas(E.COM,ws);return E.env.alertas.slice(-1)[0]||'';};
const filas=(ss,op,F)=>{const sh=ss.getSheetByName('Cronograma');const b=F._bloqueOP(sh,op);if(!b)return null;return sh.getRange(b.start,1,b.len,16).getValues().map(r=>[r[10],r[12],r[13]].join('|'));};
const celdas=ss=>{const o={};for(const s of ss.getSheets())for(const[k,x]of s.cells)o[s.getName()+'!'+k]=JSON.stringify([x.v instanceof Date?x.v.getTime():x.v,x.f]);return o;};

// ---------- 1) Sin ID de Bogotá: igual que v14.7
const e7=escenario(false,SRC7), e8=escenario(false);
for(const E of [e7,e8]){const ws=crear(E,'5001','BOGOTÁ',2);enviar(E,ws);}
const dif=Object.keys(e7.A).filter(k=>k!=='COM').map(k=>{const a=celdas(e7.A[k]),b=celdas(e8.A[k]);return Object.keys({...a,...b}).filter(x=>a[x]!==b[x]).length;});
ok(dif.every(n=>n===0),'Sin ID de Bogotá: los cronogramas de todas las áreas quedan celda por celda iguales que con v14.7 ('+dif.join('/')+' diferencias)');
ok(e7.env.alertas.join('\n')===e8.env.alertas.join('\n'),'Sin ID de Bogotá: los mensajes son los mismos que en v14.7');
ok(filas(e8.A[ID('Produccion')],'5001',e8.F)!==null,'Sin ID de Bogotá: la OP de Bogotá va al archivo único actual');

// ---------- 2) Con dos plantas
const E=escenario(true);const BAQ=E.A[ID('Produccion')],BOG=E.A.IDBOG;
const w1=crear(E,'5002','BOGOTÁ',2); const m1=enviar(E,w1);
console.log('     '+E.env.alertas.filter(a=>a.startsWith('📤')).slice(-1)[0].split('\n').filter(l=>/Produccion|ENVÍA/.test(l)).join(' · '));
ok(filas(BOG,'5002',E.F)&&!filas(BAQ,'5002',E.F),'OP de BOGOTÁ: va solo a Producción Bogotá');
ok(filas(BOG,'5002',E.F).filter((x,i)=>i%2===0).every(x=>x.split('|')[1]==='BOGOTÁ'),'Cronograma Bogotá: columna Sede = BOGOTÁ en cada subestructura');
ok(E.F._leerMetaOP(w1).enviadas.join(',')==='Dibujo,Produccion,Galvanizado','Áreas publicadas en la hoja de la OP: Dibujo, Produccion, Galvanizado (sin repetir Producción)');
// cambio de sede → se mueve
E.F._actualizarMetaOP(w1,{nombreOp:'Proyecto 5002',cliente:'Cliente',comercial:'Luz Mery Alvarez',sede:'BARRANQUILLA',numSubs:2,fechaEntrega:new Date(2026,11,20)});
const m2=enviar(E,w1);
console.log('     '+m2.split('\n').filter(l=>/Produccion/.test(l)).join(' · '));
ok(filas(BAQ,'5002',E.F)&&!filas(BOG,'5002',E.F),'Cambio de Sede BOGOTÁ → BARRANQUILLA: se crea en Barranquilla y se quita de Bogotá (con confirmación)');
ok(E.F._leerMetaOP(w1).enviadas.join(',')==='Dibujo,Produccion,Galvanizado','Sigue publicada en Produccion (ahora en Barranquilla)');
// ---------- 3) MIXTO
const w3=crear(E,'5003','MIXTO',2);
const pl=[];E.F._recorrerHojaOP(w3,(f,a,s,t,ini)=>{if(a==='Produccion'&&ini)pl.push(f);});
ok(pl.length===2&&pl.every(f=>w3.getRange(f,7).getValue()===''),'OP MIXTO nueva: la columna Sede de cada subestructura de PRODUCCION queda vacía para elegir (con lista BOGOTÁ / BARRANQUILLA)');
w3.getRange(pl[0],7).setValue('BOGOTÁ');
const m3=enviar(E,w3);
ok(/MIXTO.*Falta: 5003_2/s.test(m3)&&!filas(BOG,'5003',E.F),'MIXTO con una subestructura sin planta: no se envía y dice cuál falta ('+m3.split('\n').slice(-1)[0]+')');
w3.getRange(pl[1],7).setValue('BARRANQUILLA');
const m4=enviar(E,w3);
const fb=filas(BOG,'5003',E.F), fq=filas(BAQ,'5003',E.F);
ok(fb&&fq,'MIXTO: se envía a los dos archivos de Producción');
ok(fb[0].split('|')[1]==='BOGOTÁ'&&fb[2].split('|')[1]==='BARRANQUILLA'&&fq[0].split('|')[1]==='BOGOTÁ'&&fq[2].split('|')[1]==='BARRANQUILLA','MIXTO: cada subestructura lleva su planta en la columna Sede (5003_1 BOGOTÁ, 5003_2 BARRANQUILLA)');
const gris=(ss,op,fila)=>{const sh=ss.getSheetByName('Cronograma');return E.F._bloqueOP(sh,op);};
const dib=filas(E.A[ID('Dibujo')],'5003',E.F);
ok(dib[0].split('|')[1]==='BOGOTÁ'&&dib[8]&&dib[8].split('|')[1]==='BARRANQUILLA','Dibujo (un solo archivo) también recibe la planta de cada subestructura → la App puede filtrar sus tareas');
// el formulario de Producción V2 de cada planta ve solo lo suyo
const V45='/home/claude/trabajo/PRODUCCION_V2_v4_5.gs';
const vb=cargar(V45,entorno({},BOG),['leerCronograma_','subsPropias_']), vq=cargar(V45,entorno({},BAQ),['leerCronograma_','subsPropias_']);
ok(vb.subsPropias_(vb.leerCronograma_(BOG).ops['5003']).map(s=>s.n).join()==='1'&&vq.subsPropias_(vq.leerCronograma_(BAQ).ops['5003']).map(s=>s.n).join()==='2','Producción V2: Bogotá trabaja 5003_1 y Barranquilla 5003_2');
// re-crear la hoja (cambio estructural) conserva la planta de cada subestructura
const m=E.F._leerMetaOP(w3);
const nueva=E.F._reconstruirHojaOP(E.COM,w3,{op:'5003',nombreOp:m.nombreOp,cliente:m.cliente,comercial:m.comercial,sede:'MIXTO',numSubs:2,areas:m.areas,fechaEntrega:m.fecha},m);
ok(E.F._plantasSubOP(nueva,E.F._leerMetaOP(nueva)).join(',')==='BOGOTÁ,BARRANQUILLA','Al reconstruir la hoja de una OP MIXTO se conserva la planta elegida en cada subestructura');
// re-envío sin cambios: no duplica
const m5=enviar(E,nueva);
ok(filas(BOG,'5003',E.F).length===4&&filas(BAQ,'5003',E.F).length===4,'Reenviar no duplica la OP en ningún archivo (2 subestructuras × 2 tareas)');
