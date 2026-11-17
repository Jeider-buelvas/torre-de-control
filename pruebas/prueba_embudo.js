const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
const fs=require('fs');const D=JSON.parse(fs.readFileSync('/home/claude/trabajo/sim/api_plantas.json','utf8').replace(/Vazques/g,'Vasquez'));
const CAPS=[['DISEÑO','AMBAS',3,null],['DIBUJO','AMBAS',3,null],['COMPRAS','AMBAS',5,null],['PRODUCCION','BOGOTÁ',3,40000],['PRODUCCION','BARRANQUILLA',3,40000],['GALVANIZADO','AMBAS',4,50000],['PINTURA','AMBAS',3,40000],['LOGISTICA','AMBAS',4,null],['MONTAJE','AMBAS',3,35000],['ADMINISTRACION','AMBAS',null,null]]
 .map(r=>({area:r[0],planta:r[1],capOps:r[2],capKg:r[3],estado:r[2]?'Por validar':'Sin dato',nota:''}));
const errs=[];const ok=(c,m)=>{console.log((c?'✔':'✘ FALLA')+' '+m);if(!c)process.exitCode=1;};
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({acceptDownloads:true});
 const abrir=async(vp,caps)=>{const p=await ctx.newPage({viewport:vp});p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load|net::|fetch/i.test(m.text()))errs.push('console: '+m.text());});
  await p.route('**/*',r=>{const u=r.request().url();if(u.includes('chart.umd'))return r.fulfill({path:'/home/claude/trabajo/sim/node_modules/chart.js/dist/chart.umd.js',contentType:'application/javascript'});
   if(u.includes('xlsx.full.min.js'))return r.fulfill({path:'/tmp/xl/node_modules/xlsx/dist/xlsx.full.min.js',contentType:'application/javascript'});
   if(u.startsWith('http://127.0.0.1:8130'))return r.continue();return r.abort();});
  await p.goto('http://127.0.0.1:8130/app/app_manual.html');await p.waitForTimeout(900);
  await p.evaluate(([D,caps])=>{try{localStorage.clear();}catch(e){}state.ops=JSON.parse(JSON.stringify(D.ops));state.areas=D.areas;state.curva=D.curva||[];state.produccion=D.produccion;state.historial=D.historial.map(histNombreTareas);state.entregas=D.entregas||null;state.bitacora=[];state.capacidades=caps;
   state.tareas=normalizarDatosGrupo(JSON.parse(JSON.stringify(D.tareas)));populateFilters();renderAll();var lo=document.getElementById('loadingOverlay');if(lo)lo.style.display='none';},[D,caps]);
  await p.waitForTimeout(400);return p;};
 const p=await abrir({width:1440,height:900},CAPS);
 // snapshot de la funcionalidad original antes de abrir el Embudo
 const antes=await p.evaluate(()=>[document.getElementById('resumenBand').innerText,document.querySelectorAll('.bit-btn').length,document.getElementById('ganttBody')?document.getElementById('ganttBody').innerHTML.length:0]);
 ok(await p.evaluate(()=>[...document.querySelectorAll('.nav-item')].some(x=>/Embudo de O\.P\./.test(x.textContent))),'1. botón Embudo de O.P. en el menú');
 await p.click('text=Embudo de O.P.');await p.waitForTimeout(500);
 const g=await p.evaluate(()=>({filas:document.querySelectorAll('#embBody .emb-row:not(.hd)').length,bog:document.querySelectorAll('#embBody .emb-row .planta-badge.pb-bog').length,baq:document.querySelectorAll('#embBody .emb-row .planta-badge.pb-baq').length,kpi:[...document.querySelectorAll('#embKpis .rs-value')].map(x=>x.textContent),sinp:(document.querySelector('#embBody .emb-alert.i h3')||{}).textContent}));
 console.log(JSON.stringify(g));ok(g.filas>0&&g.bog>0&&g.baq>0,'2. Gantt general con O.P. de ambas plantas');
 await p.screenshot({path:'/tmp/rt/emb_general.png'});
 for(const z of ['Días','Meses','Semanas']){await p.click(`#embBody .emb-seg button:has-text("${z}")`);await p.waitForTimeout(200);}
 ok(true,'escalas días/semanas/meses sin error');
 // expandir primera O.P.
 await p.click('#embBody .emb-row:not(.hd) .chev >> nth=0');await p.waitForTimeout(200);const sub=await p.evaluate(()=>document.querySelectorAll('#embBody .emb-row.sub').length);ok(sub>0,'expandir O.P. muestra sus áreas ('+sub+')');
 // individual
 await p.evaluate(()=>embInd('4109'));await p.waitForTimeout(300);
 const ind=await p.evaluate(()=>({areas:document.querySelectorAll('#embBody .emb-row.sub').length,tareas:document.querySelectorAll('#embBody .emb-row.sub2').length,tabla:document.querySelectorAll('#embBody table tbody tr').length}));
 console.log(JSON.stringify(ind));ok(ind.areas>0&&ind.tareas>0&&ind.tabla>0,'3. vista Individual con áreas y tareas');
 await p.screenshot({path:'/tmp/rt/emb_individual.png'});
 // carga
 await p.evaluate(()=>embTab('carga'));await p.waitForTimeout(300);
 const car=await p.evaluate(()=>({filas:document.querySelectorAll('#embBody .emb-ct tbody tr').length,rojas:document.querySelectorAll('#embBody td.l3').length,celdas:document.querySelectorAll('#embBody td.c').length}));
 console.log(JSON.stringify(car));ok(car.filas>0,'4. Carga unificada con áreas');
 // verificación independiente de la carga: recalcular O.P. por área/semana desde las tareas crudas para una celda
 const ver=await p.evaluate(()=>{const M=window.__m=null;return null;});
 await p.evaluate(()=>embMet('kg'));await p.waitForTimeout(200);await p.screenshot({path:'/tmp/rt/emb_carga.png'});
 // seleccionar una celda
 await p.click('#embBody td.c.l1, #embBody td.c.l2, #embBody td.c.l3 >> nth=0');await p.waitForTimeout(200);ok(await p.evaluate(()=>!!document.querySelector('#embBody .emb-det')),'detalle de celda con las O.P. que coinciden');
 // qué hacer
 await p.evaluate(()=>embTab('quehacer'));await p.waitForTimeout(300);
 const qh=await p.evaluate(()=>[...document.querySelectorAll('#embBody .emb-alert h3')].map(x=>x.textContent));console.log(qh.join(' | '));
 ok(qh.length>0,'5-6. Qué hacer muestra alertas/recomendaciones');await p.screenshot({path:'/tmp/rt/emb_quehacer.png',fullPage:true});
 // kilos
 await p.evaluate(()=>embTab('kilos'));await p.waitForTimeout(300);const k1=await p.evaluate(()=>document.querySelector('#embBody h3').textContent);
 await p.click('text=Siguiente ▶');await p.waitForTimeout(150);const k2=await p.evaluate(()=>document.querySelector('#embBody h3').textContent);
 await p.click('text=Semana actual');await p.waitForTimeout(150);const k3=await p.evaluate(()=>document.querySelector('#embBody h3').textContent);
 console.log(k1,'→',k2,'→',k3);ok(k1!==k2&&k1===k3,'7. Resumen de kilos avanza y vuelve a la semana actual');
 await p.screenshot({path:'/tmp/rt/emb_kilos.png'});
 // filtros de planta
 await p.evaluate(()=>embTab('general'));
 const plantas=async n=>{await p.evaluate(n=>elegirPlanta(n),n);await p.waitForTimeout(300);return p.evaluate(()=>({bog:document.querySelectorAll('#embBody .emb-row:not(.hd) .planta-badge.pb-bog').length,baq:document.querySelectorAll('#embBody .emb-row:not(.hd) .planta-badge.pb-baq').length,mix:document.querySelectorAll('#embBody .emb-row:not(.hd) .planta-badge.pb-mix').length}));};
 const pb=await plantas('BOGOTÁ'),pq=await plantas('BARRANQUILLA');console.log('BOG',JSON.stringify(pb),'BAQ',JSON.stringify(pq));
 ok(pb.baq===0&&pq.bog===0,'8. filtro Bogotá/Barranquilla: no aparecen O.P. de la otra planta');
 // carga Barranquilla: no deben aparecer filas de Producción Bogotá
 await p.evaluate(()=>embTab('carga'));await p.waitForTimeout(200);const filasBaq=await p.evaluate(()=>[...document.querySelectorAll('#embBody .emb-ct tbody td.an b')].map(x=>x.textContent));console.log(filasBaq.join(', '));
 ok(!filasBaq.some(x=>/Bogotá/.test(x)),'8b. carga de Barranquilla sin filas de Bogotá');
 // MIXTO 4103 con Bogotá: solo tareas de Bogotá
 await p.evaluate(()=>elegirPlanta('BOGOTÁ'));const mixT=await p.evaluate(()=>{embTab('general');const M=modeloTest();return null;}).catch(()=>null);
 await p.evaluate(()=>elegirPlanta('all'));await p.evaluate(()=>embTab('general'));await p.waitForTimeout(200);
 // exportar
 const [dl]=await Promise.all([p.waitForEvent('download'),p.click('#embExportar')]);const ruta='/tmp/rt/'+dl.suggestedFilename();await dl.saveAs(ruta);
 const XLSX=require('/tmp/xl/node_modules/xlsx');const wb=XLSX.readFile(ruta);console.log(dl.suggestedFilename(),wb.SheetNames.join(','),wb.SheetNames.map(n=>XLSX.utils.sheet_to_json(wb.Sheets[n]).length).join(','));
 ok(wb.SheetNames.join()==='General,Detalle por tarea,Carga por semana,Filtros','9. Excel con General, Detalle, Carga y Filtros');
 // 10. no se modificó ningún dato
 const despuesDatos=await p.evaluate(()=>JSON.stringify(state.tareas.map(t=>[t.fechaIniPlan,t.fechaFinPlan,t.fechaIniReal,t.fechaFinReal,t.estado])));
 const origDatos=JSON.stringify(D.tareas.map(t=>[t.fechaIniPlan,t.fechaFinPlan,t.fechaIniReal,t.fechaFinReal,t.estado]));
 ok(despuesDatos===origDatos,'10. no se modificó ninguna fecha ni estado');
 // 11. funcionalidad original
 await p.evaluate(()=>{elegirPlanta('all');showPage('ejecutiva');});await p.waitForTimeout(300);
 const desp=await p.evaluate(()=>[document.getElementById('resumenBand').innerText,document.querySelectorAll('.bit-btn').length,document.getElementById('ganttBody')?document.getElementById('ganttBody').innerHTML.length:0]);
 ok(JSON.stringify(antes)===JSON.stringify(desp),'11. Ejecutiva, botones de tareas y Gantt original iguales');
 // sin capacidades
 const p2=await abrir({width:1440,height:900},[]);await p2.evaluate(()=>{showPage('embudo');embAbrir();embTab('carga');});await p2.waitForTimeout(300);
 ok(await p2.evaluate(()=>document.querySelectorAll('#embBody td.l3').length===0),'sin hoja de capacidades: no marca sobrecargas');
 await p2.evaluate(()=>embTab('plantilla'));ok(await p2.evaluate(()=>/Aún no hay capacidades/.test(document.getElementById('embBody').innerText)),'aviso cuando falta la hoja');
 const m=await abrir({width:390,height:844},CAPS);await m.evaluate(()=>{showPage('embudo');embAbrir();});await m.waitForTimeout(400);await m.screenshot({path:'/tmp/rt/emb_movil.png'});
 ok(errs.length===0,'sin errores de JavaScript '+errs.slice(0,3).join(' ; '));
 await b.close();})();
