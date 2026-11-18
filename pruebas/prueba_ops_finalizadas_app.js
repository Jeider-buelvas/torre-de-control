const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
const fs=require('fs');const RAW=fs.readFileSync('/home/claude/trabajo/sim/api_plantas.json','utf8');
const ok=(c,m)=>{console.log((c?'✔':'✘ FALLA')+' '+m);if(!c)process.exitCode=1;};
const FIN=[{op:'4027',estado:'Finalizada',fechaCierre:'18/11/2026 10:00',nombre:'HINCAS Y SUNCOVER',cliente:'NEGRATIN',comercial:'Luz Mery Alvarez',planta:'BOGOTÁ',inicioPlan:'28/04/2026',finPlan:'13/07/2026',inicioReal:'28/04/2026',finReal:'13/07/2026',entregaComprometida:'20/08/2026',entregaReal:'26/08/2026',avance:100,kg:7428,areas:'DIBUJO',tareas:80,reaperturas:0,detalle:[]},
 {op:'4077',estado:'Reabierta',fechaCierre:'10/11/2026 10:00',nombre:'Bandas',cliente:'Dismet',planta:'BOGOTÁ',avance:100,kg:4236,reaperturas:1,detalle:[]},
 {op:'3500',estado:'Finalizada',fechaCierre:'02/10/2026 09:00',nombre:'Proyecto antiguo',cliente:'Cliente X',comercial:'Angel Romo',planta:'BARRANQUILLA',inicioPlan:'01/06/2026',finPlan:'30/08/2026',inicioReal:'03/06/2026',finReal:'28/08/2026',entregaComprometida:'05/09/2026',entregaReal:'01/09/2026',avance:100,kg:12000,areas:'DIBUJO, PRODUCCION',tareas:20,reaperturas:0,detalle:[{area:'DIBUJO',tareas:8,ini:'01/06/2026',fin:'20/06/2026',iniR:'03/06/2026',finR:'22/06/2026'}]}];
const LC=[{op:'4085',faltan:['registrar la entrega real al cliente']}];
const errs=[];
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({acceptDownloads:true});
 const abrir=async(archivo,conFin)=>{const p=await ctx.newPage({viewport:{width:1440,height:900}});p.on('pageerror',e=>errs.push(archivo+': '+e.message));
  await p.clock.setFixedTime(new Date('2026-11-18T10:00:00-05:00'));
  await p.route('**/*',r=>{const u=r.request().url();if(u.includes('chart.umd'))return r.fulfill({path:'/home/claude/trabajo/sim/node_modules/chart.js/dist/chart.umd.js',contentType:'application/javascript'});
   if(u.includes('xlsx.full.min.js'))return r.fulfill({path:'/tmp/xl/node_modules/xlsx/dist/xlsx.full.min.js',contentType:'application/javascript'});
   if(u.includes('script.google.com')){const d=JSON.parse(RAW);d.bitacora=[{id:'b1',op:'4027',tipo:'Compromiso',estado:'Cerrado',descripcion:'Entregar dossier',responsable:'Calidad',fecha:'01/09/2026 10:00',autor:'J',notaCierre:'Entregado'}];
     d.historial=[{fecha:'26/08/2026 10:00',usuario:'J',op:'4027',area:'LOGISTICA',tarea:'Cargue',campo:'Estado',anterior:'Abierto',nuevo:'Terminado',tipo:'Terminación registrada'}];
     if(conFin){d.finalizadas=FIN;d.listasCierre=LC;}return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(d)});}
   if(u.startsWith('http://127.0.0.1:8130'))return r.continue();return r.abort();});
  await p.goto('http://127.0.0.1:8130/app/'+archivo);await p.waitForFunction(()=>window.TC_CARGA?TC_CARGA.ok:document.getElementById('btnConectar').textContent.includes('Conectado'),null,{timeout:15000});await p.waitForTimeout(400);return p;};
 const p=await abrir('app_manual.html',true);
 const v=await p.evaluate(()=>({ops:state.ops.map(o=>o.op),todas:state.opsTodas.length,tar4027:state.tareas.filter(t=>t.op==='4027').length,tarTodas4027:state.tareasTodas.filter(t=>t.op==='4027').length,
   sel:[...document.querySelectorAll('#opFilter option')].map(o=>o.value),cards:document.getElementById('opsGrid').innerText,kpi:document.getElementById('kpiTerminados').textContent,kdesc:document.getElementById('kpiTermDesc').textContent}));
 ok(!v.ops.includes('4027')&&v.ops.includes('4077')&&v.ops.includes('4085')&&v.todas===23,'4027 (finalizada) sale del tablero; 4077 (reabierta) y 4085 (lista para cierre) siguen');
 ok(v.tar4027===0&&v.tarTodas4027>0,'sus tareas salen del seguimiento pero se conservan para el histórico ('+v.tarTodas4027+')');
 ok(!v.sel.includes('4027')&&v.sel.includes('4085'),'4027 ya no aparece en el filtro de O.P.');
 ok(v.kpi==='2'&&/1 lista para cierre/.test(v.kdesc),'Tarjeta "Finalizadas" = 2 · "1 lista para cierre" ('+v.kpi+' · '+v.kdesc+')');
 // chip en la tarjeta de 4085
 const chip=await p.evaluate(()=>{const cards=[...document.querySelectorAll('.op-card')];const c=cards.find(x=>/OP 4085/.test(x.innerText));if(!c){goToOpsPage&&0;}return c?(c.querySelector('.op-cierre')||{}).textContent:'(no visible en esta página)';});
 console.log('  chip 4085:',chip);
 // Gantt, Embudo, alertas sin 4027
 const mods=await p.evaluate(()=>{showPage('gantt');const g=document.getElementById('page-gantt').innerText;showPage('embudo');embAbrir();embTab('general');const e=document.getElementById('embBody').innerText;showPage('alertas');const a=document.getElementById('page-alertas').innerText;showPage('obeya');const o=document.getElementById('page-obeya').innerText;return {g:/\b4027\b/.test(g),e:/\b4027\b/.test(e),a:/\b4027\b/.test(a),o:/\b4027\b/.test(o)};});
 ok(!mods.g&&!mods.e&&!mods.a&&!mods.o,'4027 no aparece en Gantt, Embudo, Alertas ni Obeya '+JSON.stringify(mods));
 // Planta Bogotá: tarjeta cuenta solo la de Bogotá
 await p.evaluate(()=>{elegirPlanta('BOGOTÁ');showPage('ejecutiva');});await p.waitForTimeout(200);ok(await p.evaluate(()=>document.getElementById('kpiTerminados').textContent)==='1','Con Bogotá: Finalizadas = 1 (la de Barranquilla no cuenta)');
 await p.evaluate(()=>elegirPlanta('all'));
 // Histórico
 await p.click('text=OPs Terminadas / Histórico');await p.waitForTimeout(300);
 const h=await p.evaluate(()=>({filas:[...document.querySelectorAll('#hisBody tr.his-fila td:first-child')].map(x=>x.textContent),kpis:[...document.querySelectorAll('#hisKpis .rs-value')].map(x=>x.textContent),listas:document.getElementById('hisListas').innerText,txt:document.getElementById('hisBody').innerText}));
 console.log('  KPIs histórico:',h.kpis.join(' | '));
 ok(h.filas.length===2&&h.filas.includes('4027')&&h.filas.includes('3500')&&!h.filas.includes('4077'),'Histórico: 4027 y 3500 (no la reabierta 4077)');
 ok(/resumen guardado/.test(h.txt),'3500 (ya no está en los cronogramas) se muestra con su resumen guardado');
 ok(/4085/.test(h.listas)&&/entrega real/.test(h.listas),'Muestra la 4085 como lista para cierre y qué le falta');
 ok(h.kpis[2]==='50 %','Entregadas a tiempo: 1 de 2 (4027 tarde 6 d, 3500 a tiempo)');
 await p.fill('#hisTexto','negratin');await p.dispatchEvent('#hisTexto','input');ok(await p.evaluate(()=>document.querySelectorAll('#hisBody tr.his-fila').length)===1,'buscar por cliente');
 await p.fill('#hisTexto','');await p.dispatchEvent('#hisTexto','input');await p.selectOption('#hisPlanta','BARRANQUILLA');ok(await p.evaluate(()=>[...document.querySelectorAll('#hisBody tr.his-fila td:first-child')].map(x=>x.textContent).join())==='3500','filtro por planta');
 await p.selectOption('#hisPlanta','all');
 await p.click('#hisBody tr.his-fila >> text=4027');await p.waitForTimeout(200);
 const det=await p.evaluate(()=>document.getElementById('hisBodyDet').innerText);
 ok(/Áreas y tareas/i.test(det)&&/Kg Fabricados/.test(det)&&/Entrega en negro/.test(det)&&/Entregar dossier/.test(det)&&/Terminación registrada/.test(det),'Detalle: tareas, Kg Fabricados y Entrega en negro por separado, Tareas de la O.P. e historial');
 await p.screenshot({path:'/tmp/rt/his_detalle.png'});await p.evaluate(()=>hisCerrar());
 await p.screenshot({path:'/tmp/rt/his_lista.png',fullPage:true});
 const [dl]=await Promise.all([p.waitForEvent('download'),p.click('#hisExportar')]);await dl.saveAs('/tmp/rt/his.xlsx');const X=require('/tmp/xl/node_modules/xlsx');ok(X.utils.sheet_to_json(X.readFile('/tmp/rt/his.xlsx').Sheets['OP finalizadas']).length===2,'Exportar a Excel (2 O.P.)');
 // Resumen de tareas sigue mostrando la tarea de 4027 con su planta
 const rt=await p.evaluate(()=>{showPage('resumentareas');rtAbrir();return document.getElementById('rtBody').innerText;});ok(/4027/.test(rt)&&/BOG/.test(rt),'Resumen de tareas conserva las tareas de la O.P. finalizada');
 // Producción diaria igual que antes
 const prod=async q=>q.evaluate(()=>{showPage('produccion');renderProduccion();return document.getElementById('page-produccion').innerText;});
 const p0=await abrir('app_antes.html',true);const antes=await prod(p0);const despues=await prod(p);ok(antes===despues,'Producción diaria idéntica a la versión anterior');
 // sin finalizadas (Maestra anterior): todo igual que antes
 const p1=await abrir('app_manual.html',false);const r1=await p1.evaluate(()=>({n:state.ops.length,kpi:document.getElementById('kpiTerminados').textContent,grid:document.getElementById('opsGrid').textContent}));
 const r0=await p0.evaluate(()=>({n:state.ops.length,grid:document.getElementById('opsGrid').textContent}));
 ok(r1.n===23&&r1.kpi==='0'&&!/OP 4027/.test(r1.grid)&&/OP 3949/.test(r1.grid),'Sin registro de finalizadas: no se archiva nada (23 O.P.); solo se ocultan las tarjetas terminadas');
 ok(errs.length===0,'sin errores de JavaScript '+errs.join(' ; '));
 await b.close();})();
