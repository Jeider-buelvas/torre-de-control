const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
const fs=require('fs');const D=JSON.parse(fs.readFileSync('/home/claude/trabajo/sim/api_plantas.json','utf8').replace(/Vazques/g,'Vasquez'));
const A='jbuelvas@polyuprotec.com';
const bit=[
 {id:'b1',op:'4109',area:'DIBUJO',tipo:'Compromiso',estado:'Cerrado',descripcion:'Enviar planos de taller revisados',responsable:'Dibujo',fechaCompromiso:'05/11/2026',autor:'Jeider Buelvas',correo:A,fecha:'03/11/2026 08:40',notaCierre:'Planos enviados y aprobados por el cliente',cerradoPor:'Dibujo',fechaCierre:'05/11/2026 16:20'},
 {id:'b2',op:'4109',area:'COMPRAS',tipo:'Bloqueo',estado:'Abierto',descripcion:'Falta la orden de compra de la lámina de 1/4"',responsable:'Compras',fechaCompromiso:'09/11/2026',autor:'Jeider Buelvas',correo:A,fecha:'06/11/2026 10:02'},
 {id:'b3',op:'4109',area:'PRODUCCION',tipo:'Compromiso',estado:'Abierto',descripcion:'Confirmar fecha de entrega en negro del Pedido 05 con Galvanizado',responsable:'Yeni Rodriguez',fechaCompromiso:'20/11/2026',autor:'Jeider Buelvas',correo:A,fecha:'10/11/2026 09:15'},
 {id:'b4',op:'4119',area:'GALVANIZADO',tipo:'Compromiso',estado:'Abierto',descripcion:'Programar el galvanizado de las hincas IPE 120',responsable:'Galvanizado',fechaCompromiso:'06/11/2026',autor:'Jeider Buelvas',correo:A,fecha:'04/11/2026 11:00'},
 {id:'b5',op:'3949',area:'PINTURA',tipo:'Compromiso',estado:'Abierto',descripcion:'Definir color RAL con el cliente',responsable:'Juan David Vasquez',fechaCompromiso:'17/11/2026',autor:'Yeimi Rosado',correo:'yrosado@polyuprotec.com',fecha:'12/11/2026 15:50'},
 {id:'b6',op:'4093',area:'',tipo:'Nota',estado:'Abierto',descripcion:'El cliente pidió visita técnica la próxima semana',responsable:'',fechaCompromiso:'',autor:'Yeimi Rosado',correo:'yrosado@polyuprotec.com',fecha:'13/11/2026 10:00'},
 {id:'b7',op:'4103',area:'LOGISTICA',tipo:'Compromiso',estado:'Abierto',descripcion:'Coordinar transporte Bogotá–Barranquilla',responsable:'Logística',fechaCompromiso:'15/12/2026',autor:'Jeider Buelvas',correo:A,fecha:'14/11/2026 08:00'},
 {id:'b8',op:'4095',area:'COMPRAS',tipo:'Compromiso',estado:'Cerrado',descripcion:'Comprar pernos galvanizados',responsable:'Compras',fechaCompromiso:'10/11/2026',autor:'Jeider Buelvas',correo:A,fecha:'01/11/2026 09:00',notaCierre:'Recibidos',cerradoPor:'Compras',fechaCierre:'09/11/2026 12:00'},
 {id:'b3',op:'4109',area:'PRODUCCION',tipo:'Compromiso',estado:'Abierto',descripcion:'DUPLICADO NO DEBE SALIR',responsable:'X',fechaCompromiso:'20/11/2026',autor:'x',correo:A,fecha:'10/11/2026 09:15'}];
const errs=[];const ok=(c,m)=>{console.log((c?'✔':'✘ FALLA')+' '+m);if(!c)process.exitCode=1;};
(async()=>{const b=await chromium.launch();
 const ctx=await b.newContext({acceptDownloads:true});
 const abrir=async(vp)=>{const p=await ctx.newPage({viewport:vp});await p.clock.setFixedTime(new Date('2026-11-17T10:00:00-05:00'));p.setViewportSize(vp);p.on('pageerror',e=>errs.push(e.message));
 await p.route('**/*',r=>{const u=r.request().url();if(u.includes('chart.umd'))return r.fulfill({path:'/home/claude/trabajo/sim/node_modules/chart.js/dist/chart.umd.js',contentType:'application/javascript'});
   if(u.includes('xlsx.full.min.js'))return r.fulfill({path:'/tmp/xl/node_modules/xlsx/dist/xlsx.full.min.js',contentType:'application/javascript'});
   if(u.startsWith('http://127.0.0.1:8130'))return r.continue();return r.abort();});
 await p.goto('http://127.0.0.1:8130/app/app_manual.html');await p.waitForTimeout(800);
 await p.evaluate(([D,bit])=>{state.ops=JSON.parse(JSON.stringify(D.ops));state.areas=D.areas;state.curva=D.curva||[];state.produccion=D.produccion;
  state.historial=D.historial.map(histNombreTareas);state.entregas=D.entregas||null;state.bitacora=bit;state.tareas=normalizarDatosGrupo(JSON.parse(JSON.stringify(D.tareas)));
  populateFilters();renderAll();var lo=document.getElementById('loadingOverlay');if(lo)lo.style.display='none';},[D,bit]);
 await p.waitForTimeout(500);return p;};
 const p=await abrir({width:1440,height:900});
 const navOk=await p.evaluate(()=>[...document.querySelectorAll('.nav-item')].some(x=>/Resumen de tareas de las O\.P\./.test(x.textContent)));ok(navOk,'botón en el menú');
 await p.click('text=Resumen de tareas de las O.P.');await p.waitForTimeout(300);
 const kp=async()=>p.evaluate(()=>[...document.querySelectorAll('#rtBand .rs-value')].map(x=>+x.textContent));
 const filas=async()=>p.evaluate(()=>document.querySelectorAll('#rtBody tr.rt-fila').length);
 let k=await kp();console.log('KPIs',k);
 // hoy 17/11/2026 → b2 vencida(9/11), b4 vencida(6/11), b5 vence hoy → por vencer, b3 (20/11)=3 días por vencer, b7 (15/12) abierta, b6 nota abierta sin fecha
 ok(JSON.stringify(k)==='[8,6,2,2,2,1]','KPIs todas: total 8, abiertas 6, cerradas 2, vencidas 2, por vencer 2, bloqueos 1 (duplicado ignorado)');
 ok(await filas()===8,'8 filas, sin duplicado');
 ok(!(await p.evaluate(()=>document.getElementById('rtBody').textContent.includes('DUPLICADO'))),'el duplicado no aparece');
 await p.selectOption('#rtPlanta','BARRANQUILLA');k=await kp();console.log('BAQ',k);ok(k[0]===4,'Barranquilla: 3949,4093,4095 + 4103 MIXTO = 4');
 await p.selectOption('#rtPlanta','BOGOTÁ');k=await kp();console.log('BOG',k);ok(k[0]===5,'Bogotá: 4109x3,4119 + 4103 MIXTO = 5');
 await p.selectOption('#rtPlanta','all');
 await p.selectOption('#rtEstado','vencidas');ok(await filas()===2,'filtro vencidas = 2');
 k=await kp();ok(k[0]===8,'indicadores siguen mostrando el total al filtrar por estado');
 await p.selectOption('#rtEstado','');await p.selectOption('#rtOP','4109');ok(await filas()===3,'filtro O.P. 4109 = 3');
 k=await kp();ok(JSON.stringify(k)==='[3,2,1,1,1,1]','KPIs de 4109');
 await p.selectOption('#rtOP','');await p.selectOption('#rtResp','Compras');ok(await filas()===2,'filtro responsable Compras = 2');
 await p.selectOption('#rtResp','');await p.fill('#rtDesde','2026-11-15');await p.fill('#rtHasta','2026-11-30');await p.dispatchEvent('#rtHasta','change');ok(await filas()===2,'rango de vencimiento 15–30/11 = 2 (b3,b5)');
 await p.click('text=Limpiar filtros');await p.fill('#rtTexto','ral');await p.dispatchEvent('#rtTexto','input');ok(await filas()===1,'buscador "ral" = 1');
 await p.fill('#rtTexto','');await p.dispatchEvent('#rtTexto','input');
 // orden
 await p.click('#page-resumentareas th[data-k="op"]');let o1=await p.evaluate(()=>[...document.querySelectorAll('#rtBody tr.rt-fila td:first-child strong')].map(x=>x.textContent));
 ok(o1[0]==='3949'&&o1[o1.length-1]==='4119','orden por O.P. ascendente');
 await p.click('#page-resumentareas th[data-k="op"]');o1=await p.evaluate(()=>[...document.querySelectorAll('#rtBody tr.rt-fila td:first-child strong')].map(x=>x.textContent));ok(o1[0]==='4119','orden descendente');
 await p.click('#page-resumentareas th[data-k="estado"]');
 // días
 const dias=await p.evaluate(()=>[...document.querySelectorAll('#rtBody tr.rt-fila')].map(r=>r.cells[0].querySelector('strong').textContent+':'+r.cells[8].textContent));console.log(dias.join(' | '));
 ok(dias.some(x=>x==='4119:11 días de retraso')&&dias.some(x=>x==='3949:Vence hoy')&&dias.some(x=>x==='4109:Faltan 3 días'),'días de retraso / faltan calculados');
 // integración: clic fila abre modal
 await p.click('#rtBody tr.rt-fila >> nth=0');await p.waitForTimeout(200);
 ok(await p.evaluate(()=>document.getElementById('bitOverlay').classList.contains('active')),'clic en fila abre 📝 Tareas de la O.P.');
 await p.evaluate(()=>cerrarBitacora());
 // simular cierre y nueva tarea como lo hace la App (misma ruta de código)
 await p.evaluate(()=>{state.bitacora=state.bitacora.map(b=>b.id==='b4'?Object.assign({},b,{estado:'Cerrado',notaCierre:'Hecho',cerradoPor:'G',fechaCierre:'17/11/2026 10:00'}):b);
   state.bitacora.push({id:'b9',op:'4121',area:'',tipo:'Bloqueo',estado:'Abierto',descripcion:'Nuevo bloqueo',responsable:'Compras',fechaCompromiso:'',autor:'J',correo:'jbuelvas@polyuprotec.com',fecha:'17/11/2026 11:00'});bitRefrescarVistas();});
 k=await kp();console.log('tras cambios',k);ok(JSON.stringify(k)==='[9,6,3,1,2,2]','el resumen refleja cierre y nueva tarea sin duplicar');
 // exportar con filtro Bogotá
 await p.selectOption('#rtPlanta','BOGOTÁ');
 const [dl]=await Promise.all([p.waitForEvent('download'),p.click('#rtExportar')]);const ruta='/tmp/rt/'+dl.suggestedFilename();await dl.saveAs(ruta);console.log('archivo',dl.suggestedFilename());
 const XLSX=require('/tmp/xl/node_modules/xlsx');const wb=XLSX.readFile(ruta);const rows=XLSX.utils.sheet_to_json(wb.Sheets['Tareas']);
 ok(rows.length===6&&wb.SheetNames.join()==='Tareas,Filtros','Excel con 6 tareas de Bogotá (incluye 4121 nueva y 4103 MIXTO) y hoja Filtros');
 console.log(JSON.stringify(rows[0]));
 await p.selectOption('#rtPlanta','all');await p.evaluate(()=>{state.bitacora=state.bitacora.filter(b=>b.id!=='b9');state.bitacora=state.bitacora.map(b=>b.id==='b4'?Object.assign({},b,{estado:'Abierto',notaCierre:'',cerradoPor:'',fechaCierre:''}):b);rtRender();});
 await p.evaluate(()=>window.scrollTo(0,0));await p.screenshot({path:'/tmp/rt/escritorio.png'});
 // funcionalidad original
 await p.evaluate(()=>showPage('ejecutiva'));const btn=await p.evaluate(()=>document.querySelectorAll('.bit-btn').length);ok(btn>0,'botones 📝 de las tarjetas siguen ('+btn+')');
 const m=await abrir({width:390,height:844});await m.evaluate(()=>{showPage('resumentareas');rtAbrir();});await m.waitForTimeout(300);await m.screenshot({path:'/tmp/rt/movil.png',fullPage:false});
 ok(errs.length===0,'sin errores de JavaScript '+errs.join(';'));
 await b.close();})();
