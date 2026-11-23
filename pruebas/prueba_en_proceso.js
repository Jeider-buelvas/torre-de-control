const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
const fs=require('fs');const RAW=fs.readFileSync('/home/claude/trabajo/sim/api_plantas.json','utf8');
const ok=(c,m)=>{console.log((c?'✔':'✘ FALLA')+' '+m);if(!c)process.exitCode=1;};const errs=[];
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({acceptDownloads:true});
 const abrir=async(arch)=>{const p=await ctx.newPage({viewport:{width:1440,height:900}});p.on('pageerror',e=>errs.push(arch+': '+e.message));await p.clock.setFixedTime(new Date('2026-11-23T10:00:00-05:00'));
  await p.route('**/*',r=>{const u=r.request().url();if(u.includes('chart.umd'))return r.fulfill({path:'/home/claude/trabajo/sim/node_modules/chart.js/dist/chart.umd.js',contentType:'application/javascript'});
   if(u.includes('xlsx.full.min.js'))return r.fulfill({path:'/tmp/xl/node_modules/xlsx/dist/xlsx.full.min.js',contentType:'application/javascript'});
   if(u.includes('script.google.com')){const d=JSON.parse(RAW);d.historial=[{fecha:'20/11/2026 10:00',usuario:'J',op:'4109',area:'COMPRAS',tarea:'Cotizaciones',campo:'Estado',anterior:'Abierto',nuevo:'En pausa',tipo:'Cambio detectado en revisión'}];
     d.finalizadas=[{op:'4027',estado:'Finalizada',fechaCierre:'18/11/2026 10:00',planta:'BOGOTÁ',avance:100,kg:7428,detalle:[]}];return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(d)});}
   if(u.startsWith('http://127.0.0.1:8130'))return r.continue();return r.abort();});
  await p.goto('http://127.0.0.1:8130/app/'+arch);await p.waitForFunction(()=>document.getElementById('btnConectar').textContent.includes('Conectado'),null,{timeout:15000});await p.waitForTimeout(400);return p;};
 const p=await abrir('app_manual.html');
 const nPausa=await p.evaluate(()=>state.tareas.filter(t=>t.estado==='En pausa').length);console.log('   tareas con dato "En pausa":',nPausa);
 ok(nPausa>0,'Los datos siguen guardados como "En pausa" (no se cambió nada en los datos)');
 const paginas=['ejecutiva','kg','produccion','obeya','gantt','entregas','areas','curva','alertas','tabla','historial','resumentareas','embudo','historico'];
 const hallazgos=[];
 for(const pg of paginas){await p.evaluate(pg=>{const b=[...document.querySelectorAll('.nav-item')].find(x=>(x.getAttribute('onclick')||'').includes("'"+pg+"'"));if(b)b.click();else showPage(pg);},pg);await p.waitForTimeout(250);
   if(pg==='embudo'){for(const t of ['general','individual','carga','kilos','quehacer','plantilla']){await p.evaluate(t=>{if(t==='individual')embInd('4109');else embTab(t);},t);await p.waitForTimeout(150);const tx=await p.evaluate(()=>document.getElementById('page-embudo').innerText);if(/pausa/i.test(tx))hallazgos.push('embudo/'+t);}continue;}
   if(pg==='gantt'){await p.evaluate(()=>{const c=document.querySelector('#ganttBody .chev, #ganttBody [onclick*="toggle"]');if(c)c.click();});}
   const tx=await p.evaluate(pg=>document.getElementById('page-'+pg).innerText,pg);if(/pausa/i.test(tx))hallazgos.push(pg+': '+tx.match(/.{0,40}pausa.{0,20}/i)[0]);}
 // tabla detalle: todas las páginas de tareas
 const tablaTodas=await p.evaluate(()=>{showPage('tabla');pageSize=10000;renderTabla();return document.getElementById('page-tabla').innerText;});
 if(/pausa/i.test(tablaTodas))hallazgos.push('tabla completa');
 // detalle del histórico y de la O.P. en el Embudo
 await p.evaluate(()=>{showPage('historico');hisAbrir();hisDetalle('4027');});const det=await p.evaluate(()=>document.getElementById('hisBodyDet').innerText);if(/pausa/i.test(det))hallazgos.push('histórico detalle');await p.evaluate(()=>hisCerrar());
 // modales de indicadores
 for(const k of ['total','progreso','riesgo','desviados']){await p.evaluate(k=>{try{openKpiModal(k);}catch(e){}},k);const t=await p.evaluate(()=>document.getElementById('modalBody').innerText);if(/pausa/i.test(t))hallazgos.push('modal '+k);await p.evaluate(()=>closeModal&&closeModal());}
 ok(hallazgos.length===0,'Ninguna pantalla muestra "pausa" '+(hallazgos.length?'→ '+hallazgos.join(' | '):''));
 const tx=await p.evaluate(()=>{showPage('tabla');return document.getElementById('page-tabla').innerText+document.getElementById('page-historial').innerText;});
 ok(/En Proceso/.test(tablaTodas),'La tabla de detalle muestra "En Proceso"');
 ok(await p.evaluate(()=>/En Proceso/.test(document.getElementById('page-historial').innerText)),'El historial muestra "Abierto → En Proceso"');
 // filtro de estado de la tabla
 const f=await p.evaluate(()=>{const s=[...document.querySelectorAll('select')].find(x=>[...x.options].some(o=>o.value==='En pausa'));if(!s)return null;s.value='En pausa';s.dispatchEvent(new Event('change'));return {txt:s.options[s.selectedIndex].text,filas:tareasFiltradas.length,esperado:state.tareas.filter(t=>t.estado==='En pausa').length};});
 console.log('   filtro:',JSON.stringify(f));ok(f&&f.txt==='En Proceso'&&f.filas>0,'El filtro dice "En Proceso" y sigue filtrando esas tareas');
 // gráfico de áreas
 ok(await p.evaluate(()=>{const c=Object.values(Chart.instances||{}).find(x=>(x.data.labels||[]).includes('En Proceso'));return !!c;}),'El gráfico de estados usa la etiqueta "En Proceso"');
 // mismos números que antes
 const nums=q=>q.evaluate(()=>{showPage('ejecutiva');return [...document.querySelectorAll('.kpi-value,.rs-value')].map(x=>x.textContent).join('|')+'#'+[...document.querySelectorAll('#page-areas .area-sub')].map(x=>x.textContent.replace(/[⏸⏳]/g,'')).join('|');});
 const p0=await abrir('app_antes.html');const p2=await abrir('app_manual.html');const A=await nums(p2),B=await nums(p0);if(A!==B)console.log('  A',A,'\n  B',B);ok(A===B,'Indicadores y contadores idénticos a la versión anterior');
 // Excel del Embudo
 await p.evaluate(()=>{showPage('embudo');embAbrir();});const [dl]=await Promise.all([p.waitForEvent('download'),p.click('#embExportar')]);await dl.saveAs('/tmp/rt/emb_ep.xlsx');
 const X=require('/tmp/xl/node_modules/xlsx');const det2=X.utils.sheet_to_json(X.readFile('/tmp/rt/emb_ep.xlsx').Sheets['Detalle por tarea']);
 ok(!det2.some(r=>/pausa/i.test(r.Estado||''))&&det2.some(r=>r.Estado==='En Proceso'),'Excel del Embudo: "En Proceso"');
 ok(errs.length===0,'sin errores JS '+errs.join(';'));await b.close();})();
