const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
const D=require('./api_plantas.json');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext();
 const abrir=async()=>{const p=await ctx.newPage();await p.route('**/*',r=>{const u=r.request().url();if(u.includes('chart.umd'))return r.fulfill({path:'/home/claude/trabajo/sim/node_modules/chart.js/dist/chart.umd.js',contentType:'application/javascript'});return u.startsWith('http://127.0.0.1:8130')?r.continue():r.abort();});await p.goto('http://127.0.0.1:8130/app/app.html');await p.waitForTimeout(500);
   await p.evaluate(D=>{state.ops=D.ops;state.tareas=normalizarDatosGrupo(D.tareas);state.produccion=[];state.historial=[];populateFilters();},D);return p;};
 const p1=await abrir();await p1.evaluate(()=>elegirPlanta('BARRANQUILLA'));
 const p2=await abrir();const r=await p2.evaluate(()=>[currentSede,[...document.querySelectorAll('#plantaSeg button.on')].map(x=>x.textContent).join()]);
 console.log((r[0]==='BARRANQUILLA'&&r[1]==='Barranquilla'?'  ✔ ':'  ✘ FALLA ')+'La App recuerda la planta elegida al volver a abrirla en ese navegador ('+r.join(' · ')+')');
 await b.close();})();
