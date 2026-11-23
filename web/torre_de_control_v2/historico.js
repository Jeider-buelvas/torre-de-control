/* ══════════════════════════════════════════════════════════════════════
   📁 OPs TERMINADAS / HISTÓRICO — módulo de la Torre de Control (archivo aparte de app.html)
   • Fuente: el registro de cierre de la Maestra (hoja OPS_FINALIZADAS, campo "finalizadas")
     y los datos completos que ya carga la App (state.opsTodas, state.tareasTodas, state.bitacora,
     state.historial, state.produccion). No crea otra base ni escribe nada.
   • Una O.P. está FINALIZADA (lo decide la Maestra v4.11) con: todas las tareas Terminado
     (o No aplica) + entrega real registrada + sin compromisos ni bloqueos abiertos.
   • Las finalizadas salen del tablero de seguimiento (app.html las separa al cargar) y se
     consultan aquí. Si la O.P. ya no está en los cronogramas, se muestra el resumen guardado.
   ══════════════════════════════════════════════════════════════════════ */
(function(){
'use strict';
var HIS={orden:{k:'cierre',dir:-1},iniciado:false,vista:[]};
var MESES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

(function(){var css=`
.his-filtros{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px}
.his-filtros .filter-input{flex:1 1 220px;min-width:180px}
.his-filtros .filter-select{max-width:220px}
.his-btn{border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:999px;padding:7px 14px;font:600 12.5px 'DM Sans',sans-serif;cursor:pointer;white-space:nowrap}
.his-btn:hover{border-color:var(--accent);color:var(--accent)}
.his-btn.prim{background:var(--brand-gradient);color:#fff;border-color:transparent}
.his-btn:disabled{opacity:.6;cursor:wait}
#page-historico th.his-sort{cursor:pointer;white-space:nowrap;user-select:none}
#page-historico th.his-sort:hover{color:var(--accent)}
#page-historico tbody tr.his-fila{cursor:pointer}
#page-historico tbody tr.his-fila:hover td{background:var(--surface2)}
.his-chip{display:inline-block;font-size:10.5px;font-weight:700;padding:1px 7px;border-radius:999px;white-space:nowrap}
.his-chip.g{background:var(--tint-green);color:var(--green)}.his-chip.r{background:var(--tint-red);color:var(--red)}
.his-chip.y{background:var(--tint-yellow);color:var(--yellow)}.his-chip.m{background:var(--surface2);color:var(--muted)}
.his-cierre{border:1px solid var(--border);border-left:4px solid var(--yellow);border-radius:12px;padding:12px 14px;margin-bottom:14px;background:var(--surface)}
.his-cierre h3{margin:0 0 6px;font:700 14px 'Poppins',sans-serif}
.his-cierre ul{margin:4px 0 0 18px;padding:0;font-size:12.5px;line-height:1.6}
.his-det .his-sec{margin:14px 0 6px;font:700 12px 'DM Sans',sans-serif;color:var(--muted);text-transform:uppercase;letter-spacing:.5px}
.his-det table{width:100%;border-collapse:collapse;font-size:12px}.his-det th,.his-det td{padding:5px 6px;border-bottom:1px solid var(--border);text-align:left}
.his-det .his-res{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px}
.his-det .his-res div{background:var(--surface2);border-radius:10px;padding:8px 10px;font-size:12px}
.his-det .his-res b{display:block;font-size:14px;color:var(--text);margin-top:2px}
.op-cierre{margin-top:6px;font-size:11px;font-weight:600;color:var(--yellow);background:var(--tint-yellow);border-radius:8px;padding:4px 8px}
`;var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);})();

function e(s){return esc(s);}
function pD(s){var d=parseD(s);return d&&!isNaN(d)&&d.getFullYear()>=2000?d:null;}
function kgF(v){return Math.round(v||0).toLocaleString('es-CO');}
function plantaReg(r,o){if(o){var p=plantasOP(o);if(p.length>1||p.indexOf('MIXTO')!==-1)return 'MIXTO';if(p[0])return p[0];}return normPlanta(r.planta)||'';}

/* Finalizadas (registro de la Maestra) con los datos vivos si la O.P. sigue en la Maestra */
function finalizadas(){
  var todas=state.opsTodas||state.ops||[],porOp={};todas.forEach(function(o){porOp[String(o.op)]=o;});
  var tareas=state.tareasTodas||state.tareas||[];
  return (state.finalizadas||[]).filter(function(r){return r.estado==='Finalizada';}).map(function(r){
    var o=porOp[String(r.op)]||null,ent=(state.entregas&&state.entregas.entregas||[]).find(function(x){return String(x.op)===String(r.op);});
    var ec=pD(r.entregaComprometida)||(ent?pD(ent.vigente)||pD(ent.original):null),er=pD(r.entregaReal)||(ent?pD(ent.real):null);
    var dias=ec&&er?Math.round((er-ec)/864e5):null;
    return {r:r,o:o,op:String(r.op),nombre:(o&&o.nombre)||r.nombre,cliente:(o&&o.cliente)||r.cliente,comercial:(o&&comercialOP(o))||r.comercial,
      planta:plantaReg(r,o),cierre:pD(String(r.fechaCierre).split(' ')[0]),cierreTxt:r.fechaCierre,inicio:pD(r.inicioReal)||pD(r.inicioPlan),
      fin:pD(r.finReal)||pD(r.finPlan),finPlan:pD(r.finPlan),ec:ec,er:er,dias:dias,avance:o?Math.round(cN(o.avanceReal)):r.avance,kg:r.kg,
      vivo:!!o,tareas:tareas.filter(function(t){return String(t.op)===String(r.op);})};
  });
}
function enPlantaSel(f,pl){return pl==='all'||f.planta===pl||f.planta==='MIXTO';}
/* Cuenta para la tarjeta de la Vista Ejecutiva: respeta planta, comercial y O.P. del filtro general */
window.hisContar=function(){return finalizadas().filter(function(f){return enPlantaSel(f,currentSede)&&(currentComercial==='all'||f.comercial===currentComercial)&&(currentOP==='all'||f.op===currentOP);}).length;};
window.hisListasCierre=function(){var n=0;(state.listasCierre||[]).forEach(function(x){var o=opPorNumero(x.op);if(!o)return;if(opEnPlanta(o)&&(currentComercial==='all'||comercialOP(o)===currentComercial))n++;});return n;};

window.hisAbrir=function(){if(!HIS.iniciado){HIS.iniciado=true;var s=document.getElementById('hisPlanta');if(s&&currentSede!=='all')s.value=currentSede;}hisRender();};
window.hisRender=function(){var p=document.getElementById('page-historico');if(!p||!p.classList.contains('active'))return;dibujar();};
window.hisOrden=function(k){HIS.orden=HIS.orden.k===k?{k:k,dir:-HIS.orden.dir}:{k:k,dir:1};dibujar();};
window.hisLimpiar=function(){['hisTexto','hisCom','hisMes'].forEach(function(id){var x=document.getElementById(id);if(x)x.value='';});document.getElementById('hisPlanta').value='all';dibujar();};
window.irAHistorico=function(){var b=[].slice.call(document.querySelectorAll('.nav-item')).find(function(x){return /Terminadas/.test(x.textContent);});showPage('historico',b);hisAbrir();};

function dibujar(){
  var g=function(id){var x=document.getElementById(id);return x?x.value:'';};
  var todas=finalizadas(),pl=g('hisPlanta')||'all';
  // listas de filtros
  var coms={},meses={};todas.forEach(function(f){if(f.comercial)coms[f.comercial]=1;if(f.cierre)meses[f.cierre.getFullYear()+'-'+('0'+(f.cierre.getMonth()+1)).slice(-2)]=1;});
  var set=function(id,vals,primera,fmt){var s=document.getElementById(id);if(!s)return;var cur=s.value;s.innerHTML='<option value="">'+primera+'</option>'+vals.map(function(v){return '<option value="'+e(v)+'">'+e(fmt?fmt(v):v)+'</option>';}).join('');if(vals.indexOf(cur)!==-1)s.value=cur;};
  set('hisCom',Object.keys(coms).sort(function(a,b){return a.localeCompare(b,'es');}),'Todos los comerciales');
  set('hisMes',Object.keys(meses).sort().reverse(),'Cualquier mes de cierre',function(v){var p=v.split('-');return MESES[+p[1]-1]+' '+p[0];});
  var txt=g('hisTexto').trim().toLowerCase(),com=g('hisCom'),mes=g('hisMes');
  var filas=todas.filter(function(f){
    if(!enPlantaSel(f,pl))return false;if(com&&f.comercial!==com)return false;
    if(mes&&(!f.cierre||f.cierre.getFullYear()+'-'+('0'+(f.cierre.getMonth()+1)).slice(-2)!==mes))return false;
    if(txt&&[f.op,f.nombre,f.cliente,f.comercial].join(' ').toLowerCase().indexOf(txt)===-1)return false;return true;});
  var K={op:function(f){return parseFloat(f.op)||0;},nombre:function(f){return (f.nombre||'').toLowerCase();},planta:function(f){return f.planta;},inicio:function(f){return f.inicio?+f.inicio:0;},
    fin:function(f){return f.fin?+f.fin:0;},er:function(f){return f.er?+f.er:0;},dias:function(f){return f.dias==null?-1e9:f.dias;},avance:function(f){return f.avance;},kg:function(f){return f.kg;},cierre:function(f){return f.cierre?+f.cierre:0;}};
  var o=HIS.orden;filas.sort(function(a,b){var x=K[o.k](a),y=K[o.k](b);return (typeof x==='string'?x.localeCompare(y,'es'):x-y)*o.dir;});
  HIS.vista=filas;
  // indicadores (con los filtros)
  var hoy=new Date(),esteMes=filas.filter(function(f){return f.cierre&&f.cierre.getMonth()===hoy.getMonth()&&f.cierre.getFullYear()===hoy.getFullYear();}).length;
  var conEnt=filas.filter(function(f){return f.dias!==null;}),aTiempo=conEnt.filter(function(f){return f.dias<=0;}).length;
  var kg=filas.reduce(function(s,f){return s+(f.kg||0);},0),listas=(state.listasCierre||[]).filter(function(x){var op=opPorNumero(x.op);return op&&(pl==='all'||plantasOP(op).indexOf(pl)!==-1||plantasOP(op).indexOf('MIXTO')!==-1);});
  var t=[['📁','O.P. finalizadas',filas.length,'tareas, entrega y compromisos cerrados','var(--green)'],['📅','Cerradas este mes',esteMes,MESES[hoy.getMonth()]+' '+hoy.getFullYear(),'var(--accent)'],
    ['🏁','Entregadas a tiempo',conEnt.length?Math.round(aTiempo/conEnt.length*100)+' %':'—',conEnt.length?aTiempo+' de '+conEnt.length+' con fecha comprometida':'sin fechas comprometidas','var(--grad-1)'],
    ['⚖️','Kg de las finalizadas',kgF(kg),'kg de sus subestructuras','var(--yellow)'],['⏳','Listas para cierre',listas.length,'terminadas, falta entrega o compromisos','var(--orange,#f97316)']];
  document.getElementById('hisKpis').innerHTML=t.map(function(k){return '<div class="rs-tile" style="--rc:'+k[4]+'"><div class="rs-label">'+k[0]+' '+k[1]+'</div><div class="rs-value">'+k[2]+'</div><div class="rs-desc">'+k[3]+'</div></div>';}).join('');
  document.getElementById('hisListas').innerHTML=listas.length?'<div class="his-cierre"><h3>⏳ '+listas.length+' O.P. terminadas que aún no pasan al histórico</h3><p style="margin:0;font-size:12.5px;color:var(--muted)">Siguen en el tablero hasta completar lo que falta:</p><ul>'+
    listas.map(function(x){var op=opPorNumero(x.op);return '<li><b>'+e(x.op)+'</b> '+plantaBadgeOP(op)+' '+e(op&&op.nombre||'')+': falta '+e((x.faltan||[]).join(' y '))+'</li>';}).join('')+'</ul></div>':'';
  document.querySelectorAll('#page-historico th.his-sort').forEach(function(th){var k=th.getAttribute('data-k');th.textContent=th.textContent.replace(/ [▲▼]$/,'')+(o.k===k?(o.dir>0?' ▲':' ▼'):'');});
  document.getElementById('hisCount').textContent=filas.length+' O.P.'+(filas.length!==todas.length?' de '+todas.length+' finalizadas':'');
  var diasHtml=function(f){if(f.dias===null)return '<span class="his-chip m">sin fecha comprometida</span>';return f.dias<=0?'<span class="his-chip g">a tiempo'+(f.dias<0?' ('+(-f.dias)+' d antes)':'')+'</span>':'<span class="his-chip r">'+f.dias+' d tarde</span>';};
  document.getElementById('hisBody').innerHTML=filas.length?filas.map(function(f){
    return '<tr class="his-fila" onclick="hisDetalle(\''+e(f.op)+'\')" title="Ver el detalle completo"><td><strong>'+e(f.op)+'</strong></td><td>'+e(f.nombre)+'<div style="font-size:11px;color:var(--muted)">'+e(f.cliente)+' · '+e(f.comercial||'—')+'</div></td>'+
      '<td>'+(f.planta?plantaBadge(f.planta):'—')+'</td><td>'+(f.inicio?fmtDMY(f.inicio):'—')+'</td><td>'+(f.fin?fmtDMY(f.fin):'—')+'</td><td>'+(f.ec?fmtDMY(f.ec):'—')+'</td><td>'+(f.er?fmtDMY(f.er):'—')+'<div>'+diasHtml(f)+'</div></td>'+
      '<td>'+f.avance+' %</td><td>'+kgF(f.kg)+'</td><td style="white-space:nowrap">'+e(f.cierreTxt||'—')+(f.vivo?'':'<div><span class="his-chip m" title="La O.P. ya no está en los cronogramas; se muestra el resumen guardado al cerrar">resumen guardado</span></div>')+'</td></tr>';}).join(''):
    '<tr><td colspan="10" class="empty">'+(todas.length?'Ninguna O.P. finalizada cumple los filtros':'Aún no hay O.P. finalizadas. Pasan aquí cuando tienen todas sus tareas terminadas, la entrega real registrada y sin compromisos abiertos.')+'</td></tr>';
}

/* ── detalle de una O.P. finalizada (solo consulta) ── */
window.hisDetalle=function(op){
  var f=finalizadas().find(function(x){return x.op===String(op);});if(!f)return;
  var ov=document.getElementById('hisOverlay');
  if(!ov){ov=document.createElement('div');ov.className='modal-overlay';ov.id='hisOverlay';ov.onclick=function(ev){if(ev.target===ov)hisCerrar();};
    ov.innerHTML='<div class="modal-box wide" role="dialog" aria-modal="true" aria-labelledby="hisTitle"><div class="modal-header"><div class="modal-title-wrap"><div class="modal-icon" style="--mc:var(--green)">📁</div><div><div class="modal-title" id="hisTitle"></div><div class="modal-sub" id="hisSub"></div></div></div><button class="modal-close" onclick="hisCerrar()" aria-label="Cerrar">✕</button></div><div class="modal-body his-det" id="hisBodyDet"></div></div>';
    document.body.appendChild(ov);document.addEventListener('keydown',function(ev){if(ev.key==='Escape'&&ov.classList.contains('active'))hisCerrar();});}
  document.getElementById('hisTitle').textContent='O.P. '+f.op+' — '+(f.nombre||'');
  document.getElementById('hisSub').textContent=[f.cliente,f.comercial,f.planta].filter(Boolean).join(' · ')+' · finalizada el '+(f.cierreTxt||'—');
  var h='<div class="his-res">'+[['Inicio',f.inicio?fmtDMY(f.inicio):'—'],['Fin (real)',f.fin?fmtDMY(f.fin):'—'],['Fin planeado',f.finPlan?fmtDMY(f.finPlan):'—'],['Entrega comprometida',f.ec?fmtDMY(f.ec):'—'],
    ['Entrega real',f.er?fmtDMY(f.er):'—'],['Avance final',f.avance+' %'],['Kg (subestructuras)',kgF(f.kg)],['Reaperturas',f.r.reaperturas||0]].map(function(x){return '<div>'+x[0]+'<b>'+e(x[1])+'</b></div>';}).join('')+'</div>';
  // áreas y tareas: datos vivos si la O.P. sigue en la Maestra; si no, el resumen guardado al cerrar
  var porArea={};f.tareas.forEach(function(t){var a=String(t.area||'').toUpperCase();(porArea[a]=porArea[a]||[]).push(t);});
  h+='<div class="his-sec">Áreas y tareas</div>';
  if(f.tareas.length){
    h+='<table><thead><tr><th>Área</th><th>Tarea</th><th>Subestructura</th><th>Plan</th><th>Real</th><th>Estado</th></tr></thead><tbody>'+
      ordenarAreas(Object.keys(porArea)).map(function(a){return porArea[a].map(function(t){return '<tr><td>'+e(a)+'</td><td>'+e(t.tarea)+'</td><td>'+e(t.subEstructura||'')+'</td><td>'+e((t.fechaIniPlan||'—')+' – '+(t.fechaFinPlan||'—'))+'</td><td>'+e((t.fechaIniReal||'—')+' – '+(t.fechaFinReal||'—'))+'</td><td>'+e(verEstado(t.estado||''))+'</td></tr>';}).join('');}).join('')+'</tbody></table>';
  }else if(f.r.detalle&&f.r.detalle.length){
    h+='<p style="font-size:12px;color:var(--muted);margin:0 0 6px">La O.P. ya no está en los cronogramas. Resumen guardado al cerrar:</p><table><thead><tr><th>Área</th><th>Tareas</th><th>Plan</th><th>Real</th></tr></thead><tbody>'+
      f.r.detalle.map(function(A){return '<tr><td>'+e(A.area)+'</td><td>'+e(A.tareas)+'</td><td>'+e((A.ini||'—')+' – '+(A.fin||'—'))+'</td><td>'+e((A.iniR||'—')+' – '+(A.finR||'—'))+'</td></tr>';}).join('')+'</tbody></table>';
  }else h+='<div class="empty">Sin detalle de tareas.</div>';
  // producción: Kg Fabricados y Entrega en negro por separado (no se mezclan)
  var fab=0,neg=0,kgSub={};f.tareas.forEach(function(t){if(String(t.area).toUpperCase()!=='PRODUCCION')return;var k=t.subEstructura+'|'+t.tarea;if(kgSub[k])return;kgSub[k]=1;
    if(/fabricad/i.test(t.tarea||''))fab+=cN(t.kgAvance);else if(/negro/i.test(t.tarea||''))neg+=cN(t.kgAvance);});
  var diario=(state.produccion||[]).filter(function(r){return String(r.op)===f.op;}),real=diario.reduce(function(s,r){return s+cN(r.real);},0);
  h+='<div class="his-sec">Producción</div><div class="his-res"><div>Kg Fabricados (cronograma)<b>'+kgF(fab)+'</b></div><div>Entrega en negro (cronograma)<b>'+kgF(neg)+'</b></div><div>Kg reales en Producción diaria<b>'+kgF(real)+'</b></div></div>';
  // Tareas de la O.P. (compromisos y observaciones)
  var bit=(state.bitacora||[]).filter(function(b){return String(b.op)===f.op;});
  h+='<div class="his-sec">Tareas de la O.P. ('+bit.length+')</div>'+(bit.length?'<table><thead><tr><th>Tipo</th><th>Descripción</th><th>Responsable</th><th>Estado</th><th>Cierre</th></tr></thead><tbody>'+
    bit.map(function(b){return '<tr><td>'+e(b.tipo)+'</td><td>'+e(b.descripcion)+'</td><td>'+e(b.responsable||'—')+'</td><td>'+e(b.estado)+'</td><td>'+e(b.notaCierre||'')+'</td></tr>';}).join('')+'</tbody></table>':'<div class="empty">Sin registros</div>');
  // observaciones de las tareas
  var obs=f.tareas.filter(function(t){return String(t.observaciones||'').trim();});
  if(obs.length)h+='<div class="his-sec">Observaciones ('+obs.length+')</div><table><tbody>'+obs.map(function(t){return '<tr><td>'+e(String(t.area))+' · '+e(t.tarea)+'</td><td>'+e(t.observaciones)+'</td></tr>';}).join('')+'</tbody></table>';
  // historial de cambios
  var hist=(state.historial||[]).filter(function(x){return String(x.op)===f.op;});
  h+='<div class="his-sec">Historial de cambios ('+hist.length+')</div>'+(hist.length?'<table><tbody>'+hist.slice(0,30).map(function(x){return '<tr><td style="white-space:nowrap">'+e(x.fecha)+'</td><td>'+e(x.tipo)+'</td><td>'+e([x.area,x.tarea,x.campo].filter(Boolean).join(' · '))+'</td><td>'+e((verEstado(x.anterior)||'')+(x.nuevo?' → '+verEstado(x.nuevo):''))+'</td></tr>';}).join('')+'</tbody></table>'+(hist.length>30?'<p style="font-size:11px;color:var(--muted)">Se muestran los 30 más recientes; el resto está en 📜 Historial.</p>':''):'<div class="empty">Sin cambios registrados</div>');
  document.getElementById('hisBodyDet').innerHTML=h;ov.classList.add('active');
};
window.hisCerrar=function(){var ov=document.getElementById('hisOverlay');if(ov)ov.classList.remove('active');};

/* ── exportar a Excel con los filtros ── */
window.hisExportar=function(){var btn=document.getElementById('hisExportar'),t0=btn.textContent;btn.disabled=true;btn.textContent='Preparando…';
  rtCargarXLSX().then(function(){
    var rows=[['O.P.','Proyecto','Cliente','Comercial','Planta','Inicio','Fin','Fin planeado','Entrega comprometida','Entrega real','Días vs. comprometida (+ tarde)','Avance final %','Kg','Fecha de cierre','Reaperturas']];
    HIS.vista.forEach(function(f){rows.push([isNaN(+f.op)?f.op:+f.op,f.nombre,f.cliente,f.comercial,f.planta,f.inicio?fmtDMY(f.inicio):'',f.fin?fmtDMY(f.fin):'',f.finPlan?fmtDMY(f.finPlan):'',f.ec?fmtDMY(f.ec):'',f.er?fmtDMY(f.er):'',f.dias===null?'':f.dias,f.avance,f.kg,f.cierreTxt,f.r.reaperturas||0]);});
    var ws=XLSX.utils.aoa_to_sheet(rows);ws['!cols']=[8,30,24,22,13,11,11,11,13,11,12,10,10,16,10].map(function(w){return {wch:w};});
    var wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'OP finalizadas');var h=new Date();
    XLSX.writeFile(wb,'OP_finalizadas_'+h.getFullYear()+'-'+('0'+(h.getMonth()+1)).slice(-2)+'-'+('0'+h.getDate()).slice(-2)+'.xlsx');btn.disabled=false;btn.textContent=t0;
  }).catch(function(){btn.disabled=false;btn.textContent='❌ No se pudo cargar el exportador';setTimeout(function(){btn.textContent=t0;},4000);});};
})();
