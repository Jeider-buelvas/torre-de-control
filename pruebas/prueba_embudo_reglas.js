const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage();
 await p.route('**/*',r=>{const u=r.request().url();if(u.startsWith('http://127.0.0.1:8130'))return r.continue();return r.abort();});
 await p.goto('http://127.0.0.1:8130/app/app_manual.html');await p.waitForTimeout(800);
 const r=await p.evaluate(()=>{
  const f=festivosCO(2026),f25=festivosCO(2025);
  const T=(tarea,ini,fin,estado)=>({area:'PRODUCCION',op:'9001',subEstructura:'S1',pesoKgSub:12000,sede:'BOGOTÁ',tarea,estado:estado||'Abierto',fechaIniPlan:ini,fechaFinPlan:fin,fechaIniReal:'',fechaFinReal:''});
  state.ops=[{op:'9001',nombre:'Prueba',cliente:'X',comercial:'Y',sede:'BOGOTÁ',plantas:['BOGOTÁ'],estado:'En Progreso',avanceReal:0,fechaEntregaCliente:'30/12/2026'}];
  state.tareas=[T('Kg Fabricados','23/11/2026','28/11/2026'),T('Entrega en negro','07/12/2026','12/12/2026')];state.produccion=[];state.capacidades=[];state.bitacora=[];state.historial=[];
  currentSede='all';currentOP='all';currentComercial='all';currentSub='all';
  document.getElementById('loadingOverlay').style.display='none';showPage('embudo');embAbrir();embTab('carga');embMet('kg');
  const cells=[...document.querySelectorAll('#embBody .emb-ct tbody tr')].map(tr=>[...tr.querySelectorAll('td')].map(td=>td.textContent.trim()));
  const hdr=[...document.querySelectorAll('#embBody .emb-ct thead th')].map(th=>th.textContent.trim());
  return {chiq2026:!!f['6-13'],chiq2025:!!f25['6-14']||!!f25['6-9'],hdr,cells};});
 console.log('Chiquinquirá lunes 13/07/2026:',r.chiq2026,'· en 2025 (antes de la ley):',r.chiq2025);
 const row=r.cells[0];const idx=h=>r.hdr.findIndex(x=>x.includes(h));
 console.log('S48 (23/11, Kg Fabricados):',row[idx('23/11')],'· S50 (07/12, Entrega en negro):',row[idx('07/12')]);
 await b.close();})();
