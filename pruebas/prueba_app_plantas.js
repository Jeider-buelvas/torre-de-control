const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
const fs=require('fs');const D=JSON.parse(fs.readFileSync('/home/claude/trabajo/sim/api_plantas.json'));
const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ FALLA ')+m); if(!c) process.exitCode=1;};
async function abrir(b,file,vp){const p=await b.newPage({viewport:vp||{width:1440,height:900}});p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));
 await p.route('**/*',r=>{const u=r.request().url();if(u.includes('chart.umd'))return r.fulfill({path:'/home/claude/trabajo/sim/node_modules/chart.js/dist/chart.umd.js',contentType:'application/javascript'});if(u.startsWith('http://127.0.0.1:8130'))return r.continue();return r.abort();});
 await p.goto('http://127.0.0.1:8130/app/'+file);await p.waitForTimeout(700);
 await p.evaluate(D=>{try{localStorage.clear();}catch(e){}state.ops=JSON.parse(JSON.stringify(D.ops));state.areas=D.areas;state.curva=[];state.produccion=D.produccion;state.historial=D.historial;state.entregas=null;state.bitacora=[];
   state.tareas=normalizarDatosGrupo(JSON.parse(JSON.stringify(D.tareas)));populateFilters();renderAll();var lo=document.getElementById('loadingOverlay');if(lo)lo.style.display='none';},D);
 await p.waitForTimeout(500);return p;}
const IDS=['resumenBand','opsGrid','ganttTableBody','tablaBody','obeyaGrid','alertList','areasBars','histBody','kgList'];
const vista=p=>p.evaluate(ids=>ids.map(i=>{const e=document.getElementById(i);return e?e.innerHTML:'';}),IDS);
const limpio=a=>a.map(h=>h.replace(/<span class="planta-badge[^>]*>[^<]*<\/span>/g,'').replace(/;white-space:nowrap/g,''));
(async()=>{const b=await chromium.launch();
 const viejo=await abrir(b,'app_antes.html'), nuevo=await abrir(b,'app.html');
 const va=limpio(await vista(viejo)), vn=limpio(await vista(nuevo));
 const dif=IDS.filter((x,i)=>va[i]!==vn[i]);
 ok(dif.length===0,'"Todas las plantas": las vistas quedan iguales a la versión anterior, salvo las insignias'+(dif.length?' — difieren: '+dif.join(', '):''));
 const cuenta=async P=>nuevo.evaluate(P=>{elegirPlanta(P);const t=filtTareas();return {ops:filtOps().map(o=>o.op),plantasT:[...new Set(t.map(x=>normPlanta(x.sede)))],nT:t.length,
   prod:prodBase().map(r=>r.planta),hist:(filtrarHistorial(),histFiltrados.map(h=>h.usuario)),op4103:t.filter(x=>x.op==='4103'&&x.area==='PRODUCCION').map(x=>x.subEstructura),
   kpi:document.getElementById('resumenBand').innerText.replace(/\s+/g,' ').slice(0,160)};},P);
 const tot=await nuevo.evaluate(()=>{elegirPlanta('all');return {ops:filtOps().length,nT:filtTareas().length,prod:prodBase().length};});
 const bog=await cuenta('BOGOTÁ'), baq=await cuenta('BARRANQUILLA');
 console.log('     Todas: '+tot.ops+' OP · '+tot.nT+' tareas · '+tot.prod+' registros diarios');
 console.log('     Bogotá: '+bog.ops.length+' OP · '+bog.nT+' tareas · Barranquilla: '+baq.ops.length+' OP · '+baq.nT+' tareas');
 ok(bog.plantasT.join()==='BOGOTÁ'&&baq.plantasT.join()==='BARRANQUILLA','Con una planta elegida, todas las tareas visibles son de esa planta');
 ok(bog.nT+baq.nT===tot.nT,'Bogotá + Barranquilla = todas las tareas ('+bog.nT+' + '+baq.nT+' = '+tot.nT+'): ninguna se pierde ni se duplica');
 ok(bog.ops.includes('4103')&&baq.ops.includes('4103')&&bog.ops.length+baq.ops.length===tot.ops+1,'La OP MIXTO 4103 aparece en las dos plantas; las demás OP solo en la suya');
 ok(bog.op4103.every(s=>s==='PRIORIDAD (1-5)')&&baq.op4103.every(s=>s==='PRIORIDAD (6-10)'),'OP MIXTO: Bogotá ve solo la subestructura 1 en Producción y Barranquilla solo la 2');
 ok(bog.prod.every(p=>p==='BOGOTÁ')&&baq.prod.every(p=>p==='BARRANQUILLA')&&bog.prod.length+baq.prod.length===tot.prod,'Producción diaria (Kg fabricados): cada planta ve solo sus registros ('+bog.prod.length+' + '+baq.prod.length+' = '+tot.prod+')');
 ok(bog.hist.join()==='Dibujo,Producción Bogotá'.split(',').sort().join()||(bog.hist.includes('Producción Bogotá')&&!bog.hist.includes('Producción Barranquilla')),'Historial: Bogotá no ve el cambio hecho en Barranquilla ('+bog.hist.join(', ')+')');
 ok(baq.hist.join()==='Producción Barranquilla','Historial: Barranquilla ve solo el suyo ('+baq.hist.join(', ')+')');
 console.log('     Banda de resumen (Bogotá): '+bog.kpi);
 console.log('     Banda de resumen (Barranquilla): '+baq.kpi);
 const badges=await nuevo.evaluate(()=>{elegirPlanta('all');showPage('ejecutiva');return [...document.querySelectorAll('#opsGrid .planta-badge')].map(x=>x.textContent);});
 ok(badges.includes('BOG')&&badges.includes('BAQ')&&badges.includes('MIXTO'),'Insignias en las tarjetas: '+[...new Set(badges)].join(', '));
 // recordar la planta
 await nuevo.evaluate(()=>elegirPlanta('BARRANQUILLA'));
 const p2=await nuevo.context().newPage();await p2.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:8130')?r.continue():r.abort());await p2.goto('http://127.0.0.1:8130/app/app.html');await p2.waitForTimeout(500);
 const rec=await p2.evaluate(D=>{state.ops=D.ops;state.tareas=normalizarDatosGrupo(D.tareas);state.produccion=[];state.historial=[];populateFilters();return currentSede;},D);
 ok(rec==='BARRANQUILLA','La App recuerda la planta elegida al volver a abrirla (en ese navegador)');
 // capturas
 await nuevo.evaluate(()=>{elegirPlanta('BOGOTÁ');showPage('ejecutiva');window.scrollTo(0,0);});await nuevo.waitForTimeout(600);
 await nuevo.screenshot({path:'/home/claude/trabajo/app/cap_bogota.png'});
 await nuevo.evaluate(()=>{elegirPlanta('all');var b=[...document.querySelectorAll('.nav-item')].find(x=>/Tabla/.test(x.textContent));showPage('tabla',b);});await nuevo.waitForTimeout(500);
 await nuevo.screenshot({path:'/home/claude/trabajo/app/cap_tabla.png'});
 const m=await abrir(b,'app.html',{width:390,height:844});await m.evaluate(()=>elegirPlanta('BARRANQUILLA'));await m.waitForTimeout(400);
 await m.screenshot({path:'/home/claude/trabajo/app/cap_movil.png'});
 ok(await m.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Celular: el selector de planta cabe sin desplazamiento horizontal');
 console.log('     Errores JS:',[...viejo.errs,...nuevo.errs,...m.errs]);
 await b.close();})();
