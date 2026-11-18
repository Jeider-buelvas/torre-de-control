const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
const fs=require('fs');const DATA=fs.readFileSync('/home/claude/trabajo/sim/api_plantas.json','utf8');
const ok=(c,m)=>{console.log((c?'✔':'✘ FALLA')+' '+m);if(!c)process.exitCode=1;};
(async()=>{const b=await chromium.launch();
 const S={modo:'ok',delay:1200,reqs:[]};const errs=[];
 const p=await b.newPage({viewport:{width:1440,height:900}});p.on('pageerror',e=>errs.push(e.message));
 await p.route('**/*',async r=>{const u=r.request().url();
  if(u.includes('chart.umd'))return r.fulfill({path:'/home/claude/trabajo/sim/node_modules/chart.js/dist/chart.umd.js',contentType:'application/javascript'});
  if(u.includes('script.google.com')){S.reqs.push(u);await new Promise(x=>setTimeout(x,S.delay));
    if(S.modo==='error')return r.fulfill({status:500,body:'err'});
    const d=JSON.parse(DATA);d._ms={ops:900,areas:700,tareas:1100,datos:3100};return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(d)});}
  if(u.startsWith('http://127.0.0.1:8130'))return r.continue();return r.abort();});
 await p.goto('http://127.0.0.1:8130/app/app_manual.html');
 await p.waitForTimeout(400);ok(await p.evaluate(()=>getComputedStyle(document.getElementById('loadingOverlay')).display!=='none'),'carga inicial: pantalla de carga visible');
 await p.waitForTimeout(1800);
 const st=await p.evaluate(()=>({ok:TC_CARGA.ok,ops:state.ops.length,ts:document.getElementById('timestampEl').textContent,title:document.getElementById('timestampEl').title,aviso:(document.getElementById('tcAviso')||{}).textContent}));
 console.log(JSON.stringify(st));ok(st.ok&&st.ops===23&&/Conectado en/.test(st.aviso),'conectó con datos reales y avisó el tiempo');
 // doble clic en Actualizar
 S.reqs=[];await p.click('#btnActualizar');await p.waitForTimeout(100);
 const durante=await p.evaluate(()=>({btn:document.getElementById('btnActualizar').textContent,dis:document.getElementById('btnActualizar').disabled,overlay:getComputedStyle(document.getElementById('loadingOverlay')).display,aviso:document.getElementById('tcAviso').textContent}));
 await p.evaluate(()=>{cargarDatos();cargarDatos();});
 // la App sigue usable durante la actualización
 await p.evaluate(()=>showPage('historial'));const usable=await p.evaluate(()=>document.getElementById('page-historial').classList.contains('active'));
 await p.waitForTimeout(1600);
 console.log(JSON.stringify(durante));
 ok(durante.dis&&/Actualizando/.test(durante.btn)&&durante.overlay==='none'&&/puedes seguir/.test(durante.aviso),'Actualizar: botón deshabilitado, sin congelar la pantalla, con aviso');
 ok(usable,'se puede navegar mientras actualiza');
 ok(S.reqs.length===1,'clics repetidos → 1 sola consulta ('+S.reqs.length+')');
 ok(/prev=\d+%2C\d+%2C\d+%2C\d+/.test(S.reqs[0]),'envía los tiempos de la carga anterior: '+decodeURIComponent(S.reqs[0].split('prev=')[1]));
 ok(await p.evaluate(()=>/Datos actualizados en/.test(document.getElementById('tcAviso').textContent)),'avisa "Datos actualizados en X s"');
 // error al actualizar: conserva datos reales
 await p.evaluate(()=>{state.ops[0].nombre='MARCA_REAL';});
 S.modo='error';await p.click('#btnActualizar');await p.waitForTimeout(1600);
 const e1=await p.evaluate(()=>({ops:state.ops.length,marca:state.ops[0].nombre,ts:document.getElementById('timestampEl').textContent,aviso:document.getElementById('tcAviso').innerText}));
 console.log(JSON.stringify(e1));ok(e1.marca==='MARCA_REAL'&&!/DEMO/.test(e1.ts)&&/No se pudo actualizar/.test(e1.aviso)&&/Reintentar/.test(e1.aviso),'falla al actualizar: conserva los datos reales (no DEMO) y ofrece Reintentar');
 S.modo='ok';await p.click('#tcAviso button');await p.waitForTimeout(1600);ok(await p.evaluate(()=>/Datos actualizados/.test(document.getElementById('tcAviso').textContent)),'Reintentar funciona');
 // tiempo de espera agotado al actualizar
 await p.evaluate(()=>{TC_TIMEOUT_MS=500;});S.delay=1500;await p.click('#btnActualizar');await p.waitForTimeout(1200);
 ok(await p.evaluate(()=>/no respondió en/.test(document.getElementById('tcAviso').textContent)&&!/DEMO/.test(document.getElementById('timestampEl').textContent)),'Maestra lenta al actualizar: avisa y conserva datos');
 await p.waitForTimeout(800);
 // carga inicial fallida: comportamiento anterior (DEMO) + aviso con Reintentar
 const p2=await b.newPage();S.modo='error';S.delay=200;
 await p2.route('**/*',async r=>{const u=r.request().url();if(u.includes('chart.umd'))return r.fulfill({path:'/home/claude/trabajo/sim/node_modules/chart.js/dist/chart.umd.js',contentType:'application/javascript'});if(u.includes('script.google.com'))return r.fulfill({status:500,body:'x'});if(u.startsWith('http://127.0.0.1:8130'))return r.continue();return r.abort();});
 await p2.goto('http://127.0.0.1:8130/app/app_manual.html');await p2.waitForTimeout(1200);
 ok(await p2.evaluate(()=>/DEMO/.test(document.getElementById('timestampEl').textContent)&&/EJEMPLO/.test(document.getElementById('tcAviso').textContent)),'sin conexión al abrir: DEMO como antes, ahora con aviso claro y Reintentar');
 ok(errs.length===0,'sin errores de JavaScript '+errs.join(';'));
 await b.close();})();
