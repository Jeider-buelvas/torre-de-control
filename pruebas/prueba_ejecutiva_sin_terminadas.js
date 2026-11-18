const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
const fs=require('fs');const RAW=fs.readFileSync('/home/claude/trabajo/sim/api_plantas.json','utf8');
const ok=(c,m)=>{console.log((c?'✔':'✘ FALLA')+' '+m);if(!c)process.exitCode=1;};const errs=[];
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:900}});p.on('pageerror',e=>errs.push(e.message));
 await p.route('**/*',r=>{const u=r.request().url();if(u.includes('chart.umd'))return r.fulfill({path:'/home/claude/trabajo/sim/node_modules/chart.js/dist/chart.umd.js',contentType:'application/javascript'});
  if(u.includes('script.google.com')){const d=JSON.parse(RAW);d.finalizadas=[{op:'4027',estado:'Finalizada',fechaCierre:'18/11/2026 10:00',planta:'BOGOTÁ',avance:100,kg:7428,detalle:[]}];d.listasCierre=[{op:'4085',faltan:['registrar la entrega real al cliente']}];return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(d)});}
  if(u.startsWith('http://127.0.0.1:8130'))return r.continue();return r.abort();});
 await p.goto('http://127.0.0.1:8130/app/app_manual.html');await p.waitForFunction(()=>TC_CARGA.ok,null,{timeout:15000});await p.waitForTimeout(300);
 const todas=async()=>p.evaluate(async()=>{const vis=[];const n=Math.ceil(opsItemsAll.length/opsPageSize);for(let i=1;i<=n;i++){goToOpsPage(i);vis.push(...[...document.querySelectorAll('#opsGrid .op-num')].map(x=>x.textContent.match(/OP (\d+)/)[1]));}goToOpsPage(1);return {vis,cnt:document.getElementById('opsCount').innerText};});
 const r=await todas();console.log('  ',r.cnt);
 ok(!r.vis.includes('4027')&&!r.vis.includes('4077')&&!r.vis.includes('4085'),'Vista Ejecutiva sin tarjetas de O.P. terminadas (4027 finalizada; 4077 y 4085 terminadas)');
 ok(r.vis.length===20&&/2 terminadas en 📁 OPs Terminadas/.test(r.cnt),'20 tarjetas de O.P. en curso + enlace a las 2 terminadas');
 await p.evaluate(()=>{currentOP='4085';renderAll();});const r2=await p.evaluate(()=>[...document.querySelectorAll('#opsGrid .op-num')].map(x=>x.textContent));ok(r2.length===1&&/4085/.test(r2[0]),'Si se filtra la O.P. 4085, sí se muestra su tarjeta');
 await p.evaluate(()=>{currentOP='all';renderAll();});await p.click('#opsCount a');await p.waitForTimeout(200);ok(await p.evaluate(()=>document.getElementById('page-historico').classList.contains('active')),'El enlace abre 📁 OPs Terminadas');
 ok(errs.length===0,'sin errores JS '+errs.join(';'));await b.close();})();
