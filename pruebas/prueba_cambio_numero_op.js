process.env.TZ='America/Bogota';
const {Spreadsheet,entorno,cargar}=require('./gsim.js');const fs=require('fs');
const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ FALLA ')+m); if(!c) process.exitCode=1;};
const SRC='/home/claude/trabajo/MACRO_COMERCIAL_v14_11.gs', SRC10='/home/claude/trabajo/MACRO_COMERCIAL_v14_10.gs', MAE='/home/claude/trabajo/MAESTRA_POLYUPROTEC_v4_8.gs';
const src=fs.readFileSync(SRC,'utf8');
const ID=a=>src.match(new RegExp("'"+a+"':\\s*'([^']+)'"))[1];
const enc=['MES','OP','NOMBRE_OP','CLIENTE','COMERCIAL','KG_TOTAL_PROYECTO','NUM_PROCESOS','%_PARTICIPACION_PROCESO','%_PESO_SUBESTRUCTURA_PESO','%_PROGRESO_POR_SUBESTRUCTURA','NOMBRE_SUBESTRUCTURA','PESO_KG_SUBESTRUCTURA','Sede','DESCRIPCION_TAREAS','Asignado','ESTADO','%_APORTE_TAREA','%_EJECUCION_SUBESTRUCTURA','KG_AVANCE_ACUMULADO','AVANCE_REAL_%','FECHA_INICIO_TAREA_REAL','DURACION_DIAS_TAREAS_REAL','FECHA_FIN_TAREA_REAL','DURACION_PROCESO_REAL_DIAS','% _TAREA_REAL','%_TAREAS_INDIVIDUALES_REAL','%_TAREAS_ACUMULADO_REAL','%_DE_CUMPLIMIENTO_VS_PLANEACION','OBSERVACIONES','FECHA_ENTREGA_CLIENTE','FECHA_INICIO_TAREA_PLANEADO','DURACION_DIAS_TAREAS_PLANEADO','FECHA_FIN_TAREA_PLANEADO'];
const area=(id,nombre,mes)=>{const c={};enc.forEach((h,i)=>c['5,'+(i+1)]=[h,null]);const hojas={'Cronograma':{cells:c},'Assignees and Status':{cells:{}}};
  if(mes)hojas['NOVIEMBRE 2026']={cells:{'1,3':['PRODUCCION NOVIEMBRE 2026',null],'5,3':['OP 3998_1 · TORRE A',null],'6,3':['PLANEADO',null],'9,3':['OP 3998_2 · TORRE B',null],'13,3':['OP 39981_1 · OTRA',null],'14,3':['OP 4000_1 · OTRA OP',null]}};
  return new Spreadsheet(id,hojas,nombre);};
function escenario(usuario,fuente){
  const A={[ID('Dibujo')]:area(ID('Dibujo'),'DIBUJO'),[ID('Galvanizado')]:area(ID('Galvanizado'),'GALV'),[ID('Produccion')]:area(ID('Produccion'),'PRODUCCION_V2_BARRANQUILLA',true),IDBOG:area('IDBOG','PRODUCCION_V2_BOGOTA',true)};
  for(const n of ['Diseño','Compras','Pintura','Logistica','Montaje','Administración']){const m=src.match(new RegExp("'"+n+"':\\s*'([^']+)'"));if(m&&!A[m[1]])A[m[1]]=area(m[1],n.toUpperCase());}
  const hdr=a=>{const c={};a.forEach((h,i)=>c['1,'+(i+1)]=[h,null]);return {cells:c};};
  const COM=new Spreadsheet('COM',{'BASE_CREADOR':{cells:{}},'ENTREGAS_CLIENTE':hdr(['OP','NOMBRE_OP','CLIENTE','COMERCIAL','FECHA_ORIGINAL','FECHA_VIGENTE','REPROGRAMACIONES','FECHA_ENTREGA_REAL','OBSERVACION_ENTREGA','REGISTRADA_POR','FECHA_REGISTRO']),'REPROGRAMACIONES_ENTREGA':hdr(['FECHA_HORA','USUARIO','OP','FECHA_ANTERIOR','FECHA_NUEVA','DIAS_CORRIDOS','MOTIVO','COMENTARIO'])},'COMERCIAL');A.COM=COM;
  const env=entorno(A,COM);env.urls=[];
  env.G.SpreadsheetApp.flush=()=>{};const gu=env.G.SpreadsheetApp.getUi;env.G.SpreadsheetApp.getUi=()=>{const u=gu();u.prompt=()=>({getSelectedButton:()=>'OK',getResponseText:()=>env.respuesta||''});return u;};
  env.G.Session={getActiveUser:()=>({getEmail:()=>usuario}),getEffectiveUser:()=>({getEmail:()=>usuario}),getScriptTimeZone:()=>'America/Bogota'};
  const dp=env.docProps;env.G.PropertiesService.getDocumentProperties=()=>({getProperty:k=>(k in dp?dp[k]:null),setProperty:(k,v)=>{dp[k]=v;},deleteProperty:k=>{delete dp[k];}});
  env.G.PropertiesService.getScriptProperties=()=>({getProperty:k=>k==='TOKEN_CORREO'?'tk':null});
  env.G.UrlFetchApp={fetch:(u,o)=>{const b=JSON.parse(o.payload);env.urls.push({u,b});if(env.fallaMaestra&&/script.google/.test(u))return{getResponseCode:()=>200,getContentText:()=>JSON.stringify({ok:false,error:'simulado'})};
     return{getResponseCode:()=>200,getContentText:()=>JSON.stringify(/script.google/.test(u)?{ok:true,cambios:{}}:{ok:true,mensaje:'Correo enviado a todos@polyuprotec.com'})};}};
  const F=cargar(fuente||SRC,env,['_crearHojaOP','_sincronizarOPConAreas','_bloqueOP','_leerMetaOP','_recorrerHojaOP','_cambiarNumeroOP','_hojaEntregas','_upsertEntrega','_filaEntrega','_hojaReprog'],"IDS_PRODUCCION_PLANTA['BOGOTÁ']='IDBOG';");
  return {A,COM,env,F};
}
const crear=(E,op,sede,nSubs)=>{const ws=E.F._crearHojaOP(E.COM,op,'Proyecto '+op,'Cliente','Luz Mery Alvarez',sede,nSubs,0,['Dibujo','Produccion','Galvanizado'],3,new Date(2026,11,20));
  E.F._recorrerHojaOP(ws,(f,a,s,t,ini)=>{if(ini)ws.getRange(f,5,1,2).setValues([['Torre '+(s+1),1000*(s+1)]]);});ws.getRange(1,38).setValue('');E.COM.setActiveSheet(ws);E.F._sincronizarOPConAreas(E.COM,ws);return ws;};
const celdas=ss=>{const o={};for(const s of ss.getSheets())for(const[k,x]of s.cells)o[s.getName()+'!'+k]=JSON.stringify([x.v instanceof Date?x.v.getTime():x.v,x.f]);return o;};
const snap=E=>{const o={};for(const k of Object.keys(E.A))o[k]=celdas(E.A[k]);return o;};
const difs=(a,b)=>{const out=[];for(const k of Object.keys(a)){const x=a[k],y=b[k];for(const c of new Set([...Object.keys(x),...Object.keys(y)]))if(x[c]!==y[c])out.push(k.slice(0,6)+':'+c+' '+(x[c]||'∅')+' → '+(y[c]||'∅'));}return out;};

// ---- 1) Usuario autorizado: 3998 → 4025
const E=escenario('jbuelvas@polyuprotec.com');
const ws=crear(E,'3998','BOGOTÁ',2);crear(E,'4000','BARRANQUILLA',1);
E.F._upsertEntrega(E.COM,'3998',{nombre:'Proyecto 3998',cliente:'Cliente',comercial:'Luz',original:new Date(2026,11,20),vigente:new Date(2026,11,20),reprog:0});
E.F._hojaReprog(E.COM).appendRow([new Date(),'x','3998',new Date(2026,11,10),new Date(2026,11,20),10,'Cliente','']);
E.env.respuesta='Corrección del número de la orden por solicitud del área Comercial';
const antes=snap(E);
const r=E.F._cambiarNumeroOP(E.COM,'3998','4025');
const despues=snap(E);for(const k of Object.keys(despues))for(const c of Object.keys(despues[k]))if(c.startsWith('4025!')){despues[k]['3998!'+c.slice(5)]=despues[k][c];delete despues[k][c];}const d=difs(antes,despues);
console.log('     Resumen: '+String(r).split('\n').join(' | '));
ok(r&&/3998 → 4025/.test(r),'Autorizado: el cambio termina y devuelve el resumen');
ok(E.COM.getSheetByName('4025')&&!E.COM.getSheetByName('3998'),'Comercial: la hoja pasa de 3998 a 4025');
ok(String(E.COM.getSheetByName('4025').getRange(1,28).getValue())==='4025','Comercial: AB1 = 4025');
const subs=[];E.F._recorrerHojaOP(E.COM.getSheetByName('4025'),(f,a,s,t,ini)=>{if(ini)subs.push(E.COM.getSheetByName('4025').getRange(f,4).getValue());});
ok(subs.every(x=>/^4025_\d+$/.test(x)),'Comercial: subestructuras '+[...new Set(subs)].join(', '));
ok(E.F._filaEntrega(E.F._hojaEntregas(E.COM),'4025')&&!E.F._filaEntrega(E.F._hojaEntregas(E.COM),'3998'),'ENTREGAS_CLIENTE pasa a 4025 (sin perder fechas)');
ok(String(E.F._hojaReprog(E.COM).getRange(2,3).getValue())==='4025','REPROGRAMACIONES pasa a 4025');
for(const [k,n] of [[ID('Dibujo'),'Dibujo'],[ID('Galvanizado'),'Galvanizado'],['IDBOG','Producción Bogotá']]){const sh=E.A[k].getSheetByName('Cronograma');ok(E.F._bloqueOP(sh,'4025')&&!E.F._bloqueOP(sh,'3998'),n+': el bloque ahora es 4025');}
ok(!E.F._bloqueOP(E.A[ID('Produccion')].getSheetByName('Cronograma'),'4025'),'Producción Barranquilla: no tenía la O.P. y no se toca su cronograma');
const mesB=E.A.IDBOG.getSheetByName('NOVIEMBRE 2026');
ok(mesB.getRange(5,3).getValue()==='OP 4025_1 · TORRE A'&&mesB.getRange(9,3).getValue()==='OP 4025_2 · TORRE B','Hojas de mes (Bogotá): "OP 3998_1/_2" → "OP 4025_1/_2"');
ok(mesB.getRange(13,3).getValue()==='OP 39981_1 · OTRA'&&mesB.getRange(14,3).getValue()==='OP 4000_1 · OTRA OP','Hojas de mes: otras O.P. parecidas (39981, 4000) no se tocan');
const otras=d.filter(x=>!/!(\d+),2 |!(\d+),3 |!(\d+),4 |1,28|REGISTRO_CAMBIOS|CAMBIOS_NUMERO_OP|ENTREGAS_CLIENTE!.*,1 |REPROGRAMACIONES_ENTREGA!2,3 /.test(x));
ok(otras.length===0,'Ninguna otra celda cambia (fechas, kg, estados, fórmulas): '+(otras.length?otras.slice(0,4).join(' ; '):'0 diferencias fuera de las del número'));
const mae=E.env.urls.find(x=>/script.google/.test(x.u)), cor=E.env.urls.find(x=>/notificar_cambio_op/.test(x.u));
ok(mae&&mae.b.accion==='renombrarOP'&&mae.b.viejo==='3998'&&mae.b.nuevo==='4025'&&mae.b.token==='tk','Maestra: se le pide renombrarOP con el token');
ok(cor&&cor.b.viejo==='3998'&&cor.b.nuevo==='4025'&&/Corrección/.test(cor.b.motivo)&&cor.b.usuario==='jbuelvas@polyuprotec.com'&&/\d\d\/\d\d\/\d{4} \d\d:\d\d/.test(cor.b.fecha),'Correo: anterior, nuevo, motivo, usuario y fecha ('+cor.b.fecha+')');
ok(E.env.urls.indexOf(mae)<E.env.urls.indexOf(cor),'El correo sale después de guardar todo (Maestra antes)');
const rc=E.COM.getSheetByName('CAMBIOS_NUMERO_OP').getRange(2,1,1,6).getValues()[0];
ok(rc[2]==='3998'&&rc[3]==='4025'&&/Corrección/.test(rc[4])&&rc[1]==='jbuelvas@polyuprotec.com','CAMBIOS_NUMERO_OP: '+rc.slice(1,6).join(' · '));
ok(!E.env.docProps.RENOMBRE_OP_PENDIENTE,'No queda nada pendiente');

// ---- 2) No autorizado
const E2=escenario('otro@polyuprotec.com');crear(E2,'3998','BOGOTÁ',1);const a2=snap(E2);
ok(!E2.F._cambiarNumeroOP(E2.COM,'3998','4025')&&difs(a2,snap(E2)).length===0&&/no autorizado/i.test(E2.env.alertas.slice(-1)[0]),'Usuario no autorizado: se bloquea y no cambia nada');
// ---- 3) Número duplicado
const E3=escenario('jdmonroy@polyuprotec.com');crear(E3,'3998','BOGOTÁ',1);crear(E3,'4025','BOGOTÁ',1);const a3=snap(E3);E3.env.respuesta='motivo de prueba';
ok(!E3.F._cambiarNumeroOP(E3.COM,'3998','4025')&&difs(a3,snap(E3)).length===0&&/Ya existe una hoja con el número 4025/.test(E3.env.alertas.slice(-1)[0]),'Número nuevo ya existe: se bloquea y no cambia nada');
// ---- 4) Motivo vacío
const E4=escenario('jbuelvas@polyuprotec.com');crear(E4,'3998','BOGOTÁ',1);const a4=snap(E4);E4.env.respuesta='';
ok(!E4.F._cambiarNumeroOP(E4.COM,'3998','4025')&&difs(a4,snap(E4)).length===0,'Sin motivo: no cambia nada');
// ---- 5) Terminada en todas las áreas
const E5=escenario('jbuelvas@polyuprotec.com');crear(E5,'3998','BOGOTÁ',1);E5.env.respuesta='motivo de prueba';
for(const k of Object.keys(E5.A)){if(k==='COM')continue;const sh=E5.A[k].getSheetByName('Cronograma');const b=E5.F._bloqueOP(sh,'3998');if(b)for(let i=0;i<b.len;i++)sh.getRange(b.start+i,16).setValue('Terminado');}
ok(!E5.F._cambiarNumeroOP(E5.COM,'3998','4025')&&/terminada/.test(E5.env.alertas.slice(-1)[0]),'O.P. terminada en todas las áreas: se bloquea');
// ---- 6) Entrega real registrada
const E6=escenario('jbuelvas@polyuprotec.com');crear(E6,'3998','BOGOTÁ',1);E6.env.respuesta='motivo de prueba';
E6.F._upsertEntrega(E6.COM,'3998',{nombre:'x',original:new Date(2026,11,20),vigente:new Date(2026,11,20),real:new Date(2026,10,5),reprog:0});
ok(!E6.F._cambiarNumeroOP(E6.COM,'3998','4025')&&/entrega real/.test(E6.env.alertas.slice(-1)[0]),'Con entrega real registrada: se bloquea');
// ---- 7) Falla la Maestra a mitad → no hay correo; al repetir continúa
const E7=escenario('jbuelvas@polyuprotec.com');crear(E7,'3998','BOGOTÁ',2);E7.env.respuesta='motivo de prueba';E7.env.fallaMaestra=true;
ok(!E7.F._cambiarNumeroOP(E7.COM,'3998','4025')&&!E7.env.urls.some(x=>/notificar_cambio_op/.test(x.u))&&E7.COM.getSheetByName('3998')&&/quedó a medias/.test(E7.env.alertas.slice(-1)[0]),'Falla la Maestra: avisa "quedó a medias", NO envía correo y Comercial sigue en 3998');
E7.env.fallaMaestra=false;
const r7=E7.F._cambiarNumeroOP(E7.COM,'3998','4025');
ok(r7&&E7.COM.getSheetByName('4025')&&E7.env.urls.filter(x=>/notificar_cambio_op/.test(x.u)).length===1&&E7.F._bloqueOP(E7.A.IDBOG.getSheetByName('Cronograma'),'4025'),'Al volver a guardar: continúa donde quedó, termina y envía UN correo');
