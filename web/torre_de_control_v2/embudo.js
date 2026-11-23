/* ══════════════════════════════════════════════════════════════════════
   📊 EMBUDO DE O.P. — módulo de la Torre de Control (archivo aparte de app.html)
   Basado en la idea del proyecto "Embudo de OPs", adaptado a los datos de la Torre:
   • Fuente única: los mismos datos que ya carga la App (state.ops, state.tareas,
     state.produccion) y la hoja CAPACIDAD_AREAS de la Maestra (state.capacidades).
   • Usa las fechas PLANEADAS y REALES de los cronogramas. No estima fechas: las O.P.
     sin planeación se listan aparte y no cuentan en la carga.
   • Kg programados = kg de cada subestructura repartidos en los días hábiles planeados
     de cada área. En Producción solo la tarea Kg Fabricados (Entrega en negro no suma).
   • Días hábiles: festivosCO() de la App. Producción lunes a sábado; demás áreas lunes a viernes.
   • Solo consulta: no escribe nada ni cambia fechas, cronogramas ni estados.
   ══════════════════════════════════════════════════════════════════════ */
(function(){
'use strict';
var EMB={tab:'general',zoom:'semana',met:'ops',exp:{},ind:'',semana:null,sel:null,cache:null,iniciado:false};
var DIA=864e5;
var COLOR_AREA={'DISEÑO':'#2f6fdb','DIBUJO':'#8b5cf6','COMPRAS':'#e08a1e','PRODUCCION':'#0e9488','GALVANIZADO':'#3f9fc4',
  'PINTURA':'#d6457a','LOGISTICA':'#a07a3c','MONTAJE':'#4f9d3a','ADMINISTRACION':'#64748b','RRHH':'#94a3b8'};
var NOMBRE_AREA={'DISEÑO':'Diseño','DIBUJO':'Dibujo','COMPRAS':'Compras','PRODUCCION':'Producción','GALVANIZADO':'Galvanizado',
  'PINTURA':'Pintura','LOGISTICA':'Logística','MONTAJE':'Montaje','ADMINISTRACION':'Administración','RRHH':'RRHH'};
var MES=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

/* ── estilos (solo del módulo, prefijo emb-) ── */
(function(){var css=`
#page-embudo .emb-tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px}
#page-embudo .emb-tab{border:1px solid var(--border);background:var(--surface);color:var(--muted);border-radius:999px;padding:8px 15px;font:600 13px 'DM Sans',sans-serif;cursor:pointer;transition:all .15s}
#page-embudo .emb-tab:hover{color:var(--text);border-color:var(--accent)}
#page-embudo .emb-tab.on{background:var(--brand-gradient);color:#fff;border-color:transparent;box-shadow:0 4px 14px rgba(140,99,232,.3)}
#page-embudo .emb-tab .n{display:inline-block;min-width:18px;padding:0 5px;margin-left:5px;border-radius:999px;background:var(--red);color:#fff;font-size:11px;line-height:18px;text-align:center}
.emb-filtros{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px}
.emb-filtros .filter-input{flex:1 1 200px;min-width:170px}
.emb-filtros .filter-select{max-width:210px}
.emb-chk{display:inline-flex;gap:6px;align-items:center;font-size:12.5px;color:var(--muted);cursor:pointer;white-space:nowrap}
.emb-seg{display:inline-flex;gap:2px;padding:3px;border:1px solid var(--border);border-radius:999px;background:var(--surface2)}
.emb-seg button{border:0;background:none;color:var(--muted);font:700 12px 'DM Sans',sans-serif;padding:5px 12px;border-radius:999px;cursor:pointer}
.emb-seg button.on{background:var(--accent);color:#fff}
.emb-bar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;margin:4px 0 10px;font-size:12px;color:var(--muted)}
.emb-btn{border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:999px;padding:7px 14px;font:600 12.5px 'DM Sans',sans-serif;cursor:pointer;transition:all .15s;white-space:nowrap}
.emb-btn:hover{border-color:var(--accent);color:var(--accent)}
.emb-btn.prim{background:var(--brand-gradient);color:#fff;border-color:transparent}
.emb-btn.prim:hover{color:#fff;filter:brightness(1.05)}
.emb-btn:disabled{opacity:.6;cursor:wait}
.emb-nota{font-size:12px;color:var(--muted);margin:6px 0 0;line-height:1.45}
.emb-leyenda{display:flex;flex-wrap:wrap;gap:12px;font-size:11.5px;color:var(--muted);margin-top:10px}
.emb-leyenda i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:5px;vertical-align:-1px}
/* Gantt */
.emb-g{position:relative;border:1px solid var(--border);border-radius:12px;overflow:hidden;background:var(--surface)}
.emb-gs{overflow:auto;max-height:68vh;cursor:grab}
.emb-gs.drag{cursor:grabbing;user-select:none}
.emb-gt{position:relative;width:max-content;min-width:100%}
.emb-row{display:flex;border-bottom:1px solid var(--border);min-height:34px}
.emb-row.hd{position:sticky;top:0;z-index:4;background:var(--surface2);min-height:0}
.emb-row.hd .emb-lab{background:var(--surface2);font-weight:700;font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.4px}
.emb-lab{position:sticky;left:0;z-index:3;flex:0 0 300px;width:300px;background:var(--surface);border-right:1px solid var(--border);padding:6px 10px;font-size:12.5px;display:flex;align-items:center;gap:6px;overflow:hidden}
.emb-row.sub .emb-lab{padding-left:30px;font-size:12px;color:var(--text)}
.emb-row.sub2 .emb-lab{padding-left:48px;font-size:11.5px;color:var(--muted)}
.emb-row.sub,.emb-row.sub2{background:var(--surface2)}
.emb-row.sub .emb-lab,.emb-row.sub2 .emb-lab{background:var(--surface2)}
.emb-lab .t{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0}
.emb-lab .t small{display:block;color:var(--muted);font-size:10.5px;overflow:hidden;text-overflow:ellipsis}
.emb-lab .chev{border:0;background:none;color:var(--muted);cursor:pointer;width:18px;padding:0;font-size:12px;transition:transform .15s;flex:0 0 18px}
.emb-lab .chev.open{transform:rotate(90deg)}
.emb-tl{position:relative;flex:0 0 auto;overflow:hidden}
.emb-cell{position:absolute;top:0;bottom:0;border-left:1px solid var(--border);font-size:10px;color:var(--muted);padding:3px 3px;white-space:nowrap;overflow:hidden;box-sizing:border-box}
.emb-cell.mes{font-weight:700;color:var(--text);font-size:11px}
.emb-cell.hoy{background:var(--tint-accent);color:var(--accent);font-weight:700}
.emb-cell.fin{background:repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(148,163,184,.08) 3px,rgba(148,163,184,.08) 6px)}
.emb-hdl{height:22px;position:relative}
.emb-load{height:20px;position:relative}
.emb-load .lc{position:absolute;top:2px;bottom:2px;border-radius:4px;font-size:10px;font-weight:700;text-align:center;line-height:16px;color:#fff;cursor:default}
.emb-load .l1{background:#22c55e}.emb-load .l2{background:#eab308}.emb-load .l3{background:#ef4444}
.emb-bar-op{position:absolute;top:8px;height:18px;border-radius:6px;background:var(--bc,var(--accent));box-shadow:0 1px 3px rgba(0,0,0,.15);overflow:hidden;cursor:pointer}
.emb-bar-op .av{position:absolute;left:0;top:0;bottom:0;background:rgba(255,255,255,.35)}
.emb-bar-op span{position:relative;font-size:10.5px;color:#fff;font-weight:700;padding:0 6px;line-height:18px;white-space:nowrap}
.emb-bar-ar{position:absolute;top:7px;height:12px;border-radius:4px;background:var(--bc);opacity:.9}
.emb-bar-ar.over{box-shadow:0 0 0 2px #ef4444}
.emb-bar-real{position:absolute;top:22px;height:5px;border-radius:3px;background:var(--text);opacity:.55}
.emb-bar-tk{position:absolute;top:9px;height:10px;border-radius:3px;background:var(--bc);opacity:.75}
.emb-bar-tk.term{opacity:.35}
.emb-ent{position:absolute;top:9px;width:14px;height:14px;margin-left:-7px;transform:rotate(45deg);background:#f97316;border:2px solid var(--surface);border-radius:2px;z-index:2}
.emb-ent.tarde{background:#ef4444}
.emb-hoyl{position:absolute;top:0;bottom:0;width:2px;background:var(--accent);opacity:.55;z-index:2;pointer-events:none}
.emb-chip{display:inline-block;font-size:10px;font-weight:700;padding:1px 6px;border-radius:999px;white-space:nowrap}
.emb-chip.r{background:var(--tint-red);color:var(--red)}.emb-chip.y{background:var(--tint-yellow);color:var(--yellow)}
.emb-chip.g{background:var(--tint-green);color:var(--green)}.emb-chip.a{background:var(--tint-accent);color:var(--accent)}.emb-chip.m{background:var(--surface2);color:var(--muted)}
/* Carga */
.emb-ct{border-collapse:separate;border-spacing:0;font-size:12px;min-width:100%}
.emb-ct th,.emb-ct td{border-bottom:1px solid var(--border);padding:6px 6px;text-align:center;white-space:nowrap}
.emb-ct th{position:sticky;top:0;background:var(--surface2);font-size:10.5px;color:var(--muted);z-index:2}
.emb-ct th.cur{color:var(--accent)}
.emb-ct .an{position:sticky;left:0;background:var(--surface);text-align:left;z-index:1;min-width:190px}
.emb-ct th.an{z-index:3;background:var(--surface2)}
.emb-ct .an small{display:block;color:var(--muted);font-size:10.5px;font-weight:500}
.emb-ct td.c{cursor:pointer;font-weight:700;min-width:52px}
.emb-ct td.c:hover{outline:2px solid var(--accent);outline-offset:-2px}
.emb-ct td.sel{outline:2px solid var(--text);outline-offset:-2px}
.emb-ct td.l0{color:var(--muted);font-weight:500}
.emb-ct td.l1{background:rgba(34,197,94,.16);color:#15803d}
.emb-ct td.l2{background:rgba(234,179,8,.2);color:#a16207}
.emb-ct td.l3{background:rgba(239,68,68,.2);color:#b91c1c}
.emb-ct td.ln{background:var(--surface2);color:var(--text)}
[data-theme="dark"] .emb-ct td.l1{color:#4ade80}[data-theme="dark"] .emb-ct td.l2{color:#facc15}[data-theme="dark"] .emb-ct td.l3{color:#f87171}
.emb-det{margin-top:12px;border:1px solid var(--border);border-radius:12px;padding:12px 14px;background:var(--surface2);font-size:12.5px}
.emb-det h4{margin:0 0 8px;font:700 13px 'Poppins',sans-serif}
.emb-det table{width:100%;border-collapse:collapse}.emb-det td,.emb-det th{padding:4px 6px;border-bottom:1px solid var(--border);text-align:left}
/* Qué hacer */
.emb-alert{border:1px solid var(--border);border-left:4px solid var(--red);border-radius:12px;padding:12px 14px;margin-bottom:12px;background:var(--surface)}
.emb-alert.w{border-left-color:var(--yellow)}.emb-alert.ok{border-left-color:var(--green)}.emb-alert.i{border-left-color:var(--accent)}
.emb-alert h3{margin:0 0 6px;font:700 14px 'Poppins',sans-serif;color:var(--text)}
.emb-alert p{margin:4px 0;font-size:12.5px;color:var(--text);line-height:1.5}
.emb-alert ul{margin:6px 0 0 18px;padding:0;font-size:12.5px;line-height:1.55}
.emb-alert .muted{color:var(--muted)}
/* Resumen de kilos */
.emb-wk{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px}
.emb-wk h3{margin:0 8px 0 0;font:700 15px 'Poppins',sans-serif}
.emb-uso{height:8px;border-radius:5px;background:var(--surface2);overflow:hidden;min-width:90px}
.emb-uso>div{height:100%;border-radius:5px}
@media(max-width:700px){.emb-lab{flex-basis:170px;width:170px}.emb-filtros .filter-select{max-width:none;flex:1 1 140px}}
`;var st=document.createElement('style');st.id='emb-css';st.textContent=css;document.head.appendChild(st);})();

/* ── fechas y días hábiles (reutiliza festivosCO de la App) ── */
// Fecha de las hojas; una fecha vacía de Sheets (1899) o fuera de 2000–2099 se toma como sin fecha (no se inventa).
function pD(s){var d=parseD(s);return d&&!isNaN(d)&&d.getFullYear()>=2000&&d.getFullYear()<2100?d0(d):null;}
function d0(d){var x=new Date(d.getTime());x.setHours(0,0,0,0);return x;}
function hoy(){return d0(new Date());}
function addD(d,n){var x=new Date(d.getTime());x.setDate(x.getDate()+n);return x;}
function lunesDe(d){var x=d0(d),w=(x.getDay()+6)%7;return addD(x,-w);}
function semISO(d){var t=addD(lunesDe(d),3),y=t.getFullYear(),j=new Date(y,0,4);return 1+Math.round((t-lunesDe(j))/(7*DIA));}
function dm(d){return d?('0'+d.getDate()).slice(-2)+'/'+('0'+(d.getMonth()+1)).slice(-2):'—';}
function dmy(d){return d?fmtDMY(d):'—';}
var FEST={};
function esFestivo(d){var y=d.getFullYear();if(!FEST[y])FEST[y]=festivosCO(y);return !!FEST[y][d.getMonth()+'-'+d.getDate()];}
// Producción: lunes a sábado (igual que la hoja de Producción y Producción diaria). Demás áreas: lunes a viernes (como los cronogramas).
function esHabil(d,area){var w=d.getDay();if(w===0)return false;if(w===6&&area!=='PRODUCCION')return false;return !esFestivo(d);}
function diasHabiles(a,b,area){var r=[];if(!a||!b)return r;for(var d=d0(a);d<=b;d=addD(d,1))if(esHabil(d,area))r.push(d);return r;}
function nHabiles(a,b){return diasHabiles(a,b,'').length;}
function sumarHabiles(d,n){var x=d0(d);while(n>0){x=addD(x,1);if(esHabil(x,''))n--;}return x;}
function sigHabil(d){var x=d0(d);while(!esHabil(x,''))x=addD(x,1);return x;}
function kgF(v){return Math.round(v||0).toLocaleString('es-CO');}
function e(s){return esc(s);}
function nomA(a){return NOMBRE_AREA[a]||(a?a.charAt(0)+a.slice(1).toLowerCase():'—');}
function normA(a){return String(a||'').toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace('DISENO','DISEÑO').trim();}
function esTerm(t){return /^terminad/i.test(String(t.estado||''));}
function esNoAplica(t){return /no\s*aplica/i.test(String(t.estado||''));}
// Producción: solo la tarea Kg Fabricados cuenta para los kg (Entrega en negro es otro concepto y no suma).
function cuentaKg(t,tareasSub){
  if(normA(t.area)!=='PRODUCCION')return true;
  if(/negro/i.test(t.tarea||''))return false;
  var hayFab=tareasSub.some(function(x){return normA(x.area)==='PRODUCCION'&&/fabricad/i.test(x.tarea||'');});
  return hayFab?/fabricad/i.test(t.tarea||''):true;
}

/* ── capacidades (hoja CAPACIDAD_AREAS de la Maestra) ── */
function caps(){return (state.capacidades||[]);}
function areaPorPlanta(a){return caps().some(function(c){return c.area===a&&c.planta!=='AMBAS'&&c.planta!=='';});}
function capDe(a,pl){var cs=caps().filter(function(c){return c.area===a;});
  if(!cs.length)return null;
  var c=cs.find(function(x){return x.planta===pl;})||cs.find(function(x){return x.planta==='AMBAS'||!x.planta;});
  return c||null;}

/* ── modelo: O.P. → áreas → tareas, con los filtros ── */
function filtrosEmb(){var g=function(id){var x=document.getElementById(id);return x?x.value:'';};
  return {cli:g('embCli'),est:g('embEst'),area:g('embArea'),q:(g('embTxt')||'').trim().toLowerCase(),term:!!(document.getElementById('embTerm')||{}).checked};}
function modelo(){
  var F=filtrosEmb(),H=hoy();
  var tareas=filtTareas();   // planta (por subestructura), comercial, O.P. y subestructura del filtro general
  var porOP={};
  tareas.forEach(function(t){var k=String(t.op);(porOP[k]=porOP[k]||[]).push(t);});
  var ops=[],sinPlan=[];
  filtOps().forEach(function(o){
    if(F.cli&&String(o.cliente||'')!==F.cli)return;
    if(F.est&&String(o.estado||'')!==F.est)return;
    var ts=(porOP[String(o.op)]||[]).filter(function(t){return !esNoAplica(t);});
    if(F.area)ts=ts.filter(function(t){return normA(t.area)===F.area;});
    if(F.area&&!ts.length)return;
    if(F.q&&[o.op,o.nombre,o.cliente,comercialOP(o)].join(' ').toLowerCase().indexOf(F.q)===-1)return;
    var term=o.estado==='Terminado';
    if(term&&!F.term)return;
    var areas={},ini=null,fin=null,iniR=null,finR=null;
    ts.forEach(function(t){var a=normA(t.area),pi=pD(t.fechaIniPlan),pf=pD(t.fechaFinPlan),ri=pD(t.fechaIniReal),rf=pD(t.fechaFinReal);
      var A=areas[a]=areas[a]||{area:a,tareas:[],ini:null,fin:null,iniR:null,finR:null,tot:0,term:0};
      A.tareas.push(t);A.tot++;if(esTerm(t))A.term++;
      if(pi&&(!A.ini||pi<A.ini))A.ini=pi;if(pf&&(!A.fin||pf>A.fin))A.fin=pf;
      if(ri&&(!A.iniR||ri<A.iniR))A.iniR=ri;if(rf&&(!A.finR||rf>A.finR))A.finR=rf;});
    Object.keys(areas).forEach(function(a){var A=areas[a];if(A.ini&&(!ini||A.ini<ini))ini=A.ini;if(A.fin&&(!fin||A.fin>fin))fin=A.fin;
      if(A.iniR&&(!iniR||A.iniR<iniR))iniR=A.iniR;if(A.finR&&(!finR||A.finR>finR))finR=A.finR;
      A.retrasada=A.fin&&A.fin<H&&A.term<A.tot;});
    var ei=entregaInfo(o),ent=ei&&ei.d&&ei.d.getFullYear()>=2000?d0(ei.d):(pD(o.fechaEntregaCliente)||null);
    var pl=plantasOP(o),plab=pl.length>1||pl.indexOf('MIXTO')!==-1?'MIXTO':(pl[0]||'');
    var x={o:o,op:String(o.op),nombre:o.nombre||'',cliente:o.cliente||'',comercial:comercialOP(o)||'',planta:plab,estado:o.estado||'',
      areas:ordenarAreas(Object.keys(areas)).map(function(a){return areas[a];}),ini:ini,fin:fin,iniR:iniR,finR:finR,entrega:ent,
      avance:Math.max(0,Math.min(100,Math.round(cN(o.avanceReal)))),tareas:ts};
    x.tarde=!!(x.fin&&x.entrega&&x.fin>x.entrega&&!term);
    x.sit=term?'Terminada':!ini?'Sin planeación':(fin<H?'Atrasada':ini>H?'Por iniciar':'En curso');
    x.dur=ini&&fin?nHabiles(ini,fin):0;
    if(!ini)sinPlan.push(x);else ops.push(x);
  });
  ops.sort(function(a,b){return a.ini-b.ini||(a.entrega||0)-(b.entrega||0)||a.op.localeCompare(b.op);});
  var carga=calcCarga(ops,F);
  return {ops:ops,sinPlan:sinPlan,carga:carga,F:F};
}
/* Carga por área (y planta si su capacidad es por planta) y semana. Solo tareas sin terminar, con fechas planeadas. */
function calcCarga(ops,F){
  var m={},filas={};
  ops.forEach(function(x){if(x.estado==='Terminado')return;
    var porSub={};x.tareas.forEach(function(t){var k=t.subEstructura||'';(porSub[k]=porSub[k]||[]).push(t);});
    Object.keys(porSub).forEach(function(sk){var tsub=porSub[sk];
      var kgSub=cN(tsub[0].pesoKgSub);
      var porA={};tsub.forEach(function(t){if(esTerm(t))return;var pi=pD(t.fechaIniPlan),pf=pD(t.fechaFinPlan);if(!pi||!pf)return;
        var a=normA(t.area);var A=porA[a]=porA[a]||{ini:null,fin:null,kgIni:null,kgFin:null,planta:normPlanta(t.sede)};
        if(!A.ini||pi<A.ini)A.ini=pi;if(!A.fin||pf>A.fin)A.fin=pf;
        if(cuentaKg(t,tsub)){if(!A.kgIni||pi<A.kgIni)A.kgIni=pi;if(!A.kgFin||pf>A.kgFin)A.kgFin=pf;}});
      Object.keys(porA).forEach(function(a){var A=porA[a];
        var pl=A.planta&&A.planta!=='MIXTO'?A.planta:(x.planta!=='MIXTO'?x.planta:'');
        var fila=areaPorPlanta(a)?a+'|'+(pl||'—'):a+'|AMBAS';filas[fila]=1;
        var dias=diasHabiles(A.ini,A.fin<A.ini?A.ini:A.fin,a);if(!dias.length)dias=[d0(A.ini)];
        dias.forEach(function(d){var w=+lunesDe(d),k=fila+'#'+w,c=m[k]=m[k]||{ops:{},kg:0};c.ops[x.op]=c.ops[x.op]||0;});
        if(kgSub>0&&A.kgIni){var dk=diasHabiles(A.kgIni,A.kgFin<A.kgIni?A.kgIni:A.kgFin,a);if(!dk.length)dk=[d0(A.kgIni)];var per=kgSub/dk.length;
          dk.forEach(function(d){var w=+lunesDe(d),k=fila+'#'+w,c=m[k]=m[k]||{ops:{},kg:0};c.ops[x.op]=(c.ops[x.op]||0)+per;c.kg+=per;});}
      });
    });
  });
  // filas visibles en orden de áreas
  var lista=Object.keys(filas);
  caps().forEach(function(c){if(F.area&&c.area!==F.area)return;var f=c.planta&&c.planta!=='AMBAS'?c.area+'|'+c.planta:c.area+'|AMBAS';
    if(c.planta&&c.planta!=='AMBAS'&&currentSede!=='all'&&c.planta!==currentSede)return;if(lista.indexOf(f)===-1)lista.push(f);});
  lista.sort(function(a,b){var pa=a.split('|'),pb=b.split('|');return posArea(pa[0])-posArea(pb[0])||pa[1].localeCompare(pb[1]);});
  var nivel=function(fila,c){var p=fila.split('|'),cap=capDe(p[0],p[1]==='AMBAS'?'':p[1]);if(!c)return {l:0,r:0,cap:cap};
    var no=Object.keys(c.ops).length,rO=cap&&cap.capOps?no/cap.capOps:0,rK=cap&&cap.capKg?c.kg/cap.capKg:0,r=Math.max(rO,rK);
    return {l:!cap||(!cap.capOps&&!cap.capKg)?-1:r>1?3:r>.6?2:r>0?1:0,r:r,rO:rO,rK:rK,cap:cap,n:no};};
  // episodios de sobrecarga desde la semana actual
  var cw=+lunesDe(hoy()),eps=[];
  lista.forEach(function(f){var ws=Object.keys(m).filter(function(k){return k.split('#')[0]===f;}).map(function(k){return +k.split('#')[1];}).filter(function(w){return w>=cw;}).sort(function(a,b){return a-b;});
    var ep=null;ws.forEach(function(w){var c=m[f+'#'+w],lv=nivel(f,c);
      if(lv.l===3){if(ep&&w-ep.w1<=7*DIA+36e5){ep.w1=w;ep.cel.push({w:w,c:c,lv:lv});}else{ep={fila:f,w0:w,w1:w,cel:[{w:w,c:c,lv:lv}]};eps.push(ep);}}else ep=null;});});
  var sobreW={};Object.keys(m).forEach(function(k){var p=k.split('#');if(nivel(p[0],m[k]).l===3)sobreW[p[1]]=1;});
  return {m:m,filas:lista,nivel:nivel,eps:eps,sobreW:sobreW};
}
function filaNombre(f){var p=f.split('|');return nomA(p[0])+(p[1]&&p[1]!=='AMBAS'?' · '+(p[1]==='BOGOTÁ'?'Bogotá':p[1]==='BARRANQUILLA'?'Barranquilla':p[1]):'');}
function capTxt(cap){if(!cap||(!cap.capOps&&!cap.capKg))return 'sin capacidad configurada';
  return [cap.capOps?cap.capOps+' O.P.':'',cap.capKg?kgF(cap.capKg)+' kg/sem':''].filter(Boolean).join(' · ')+(/validar/i.test(cap.estado||'')?' (por validar)':'');}

/* ── página ── */
function contenedor(){return document.getElementById('embBody');}
window.embAbrir=function(){if(!EMB.iniciado){EMB.iniciado=true;llenarSelects();}embRender();};
window.embRender=function(){var p=document.getElementById('page-embudo');if(!p||!p.classList.contains('active'))return;llenarSelects();dibujar();};
window.embTab=function(t){EMB.tab=t;dibujar();};
window.embZoom=function(z){EMB.zoom=z;dibujar();};
window.embMet=function(mt){EMB.met=mt;dibujar();};
window.embToggle=function(k){EMB.exp[k]=!EMB.exp[k];dibujar();};
window.embInd=function(op){EMB.ind=op;EMB.tab='individual';dibujar();};
window.embSem=function(n){var H=+lunesDe(hoy());EMB.semana=n===0?H:(EMB.semana||H)+n*7*DIA;dibujar();};
window.embSelCelda=function(f,w){EMB.sel=EMB.sel&&EMB.sel.f===f&&EMB.sel.w===w?null:{f:f,w:w};dibujar();};
window.embLimpiar=function(){['embCli','embEst','embArea','embTxt'].forEach(function(id){var x=document.getElementById(id);if(x)x.value='';});var t=document.getElementById('embTerm');if(t)t.checked=false;dibujar();};
function llenarSelects(){
  var set=function(id,vals,primera,fmt){var s=document.getElementById(id);if(!s)return;var cur=s.value;
    s.innerHTML='<option value="">'+primera+'</option>'+vals.map(function(v){return '<option value="'+e(v).replace(/"/g,'&quot;')+'">'+e(fmt?fmt(v):v)+'</option>';}).join('');
    if(vals.indexOf(cur)!==-1)s.value=cur;};
  var cl={},es={},ar={};filtOps().forEach(function(o){if(o.cliente)cl[o.cliente]=1;if(o.estado)es[o.estado]=1;});
  filtTareas().forEach(function(t){var a=normA(t.area);if(a)ar[a]=1;});
  set('embCli',Object.keys(cl).sort(function(a,b){return a.localeCompare(b,'es');}),'Todos los clientes');
  set('embEst',Object.keys(es).sort(),'Todos los estados');
  set('embArea',ordenarAreas(Object.keys(ar)),'Todas las áreas',nomA);
}
function dibujar(){
  var M=EMB.cache=modelo(),c=contenedor();if(!c)return;
  var nEp=M.carga.eps.length;
  document.getElementById('embTabs').innerHTML=[['general','📅 General'],['individual','🔍 Individual'],['carga','🧱 Carga unificada'],['kilos','⚖️ Resumen de kilos'],['quehacer','🧭 Qué hacer'+(nEp?'<span class="n">'+nEp+'</span>':'')],['plantilla','⚙️ Capacidades']]
    .map(function(t){return '<button class="emb-tab'+(EMB.tab===t[0]?' on':'')+'" onclick="embTab(\''+t[0]+'\')">'+t[1]+'</button>';}).join('');
  kpis(M);
  var h='';
  if(EMB.tab==='general')h=vGeneral(M);
  else if(EMB.tab==='individual')h=vIndividual(M);
  else if(EMB.tab==='carga')h=vCarga(M);
  else if(EMB.tab==='kilos')h=vKilos(M);
  else if(EMB.tab==='quehacer')h=vQueHacer(M);
  else h=vPlantilla(M);
  c.innerHTML=h;
  arrastre();
  var hl=c.querySelector('.emb-gs[data-hoy]');if(hl&&!hl._pos){hl._pos=1;hl.scrollLeft=Math.max(0,+hl.getAttribute('data-hoy')-180);}
}
function kpis(M){
  var H=hoy(),cw=+lunesDe(H),curso=M.ops.filter(function(x){return x.sit==='En curso';}).length,prox=M.ops.filter(function(x){return x.sit==='Por iniciar';}).length;
  var kg=0;Object.keys(M.carga.m).forEach(function(k){if(+k.split('#')[1]>=cw)kg+=M.carga.m[k].kg;});
  var cnt={};M.ops.forEach(function(x){if(x.estado==='Terminado')return;for(var w=+lunesDe(x.ini);w<=+x.fin;w+=7*DIA)if(w>=cw)cnt[w]=(cnt[w]||0)+1;});
  var best=0,bw=null;Object.keys(cnt).forEach(function(w){if(cnt[w]>best){best=cnt[w];bw=+w;}});
  var tarde=M.ops.filter(function(x){return x.tarde;}).length;
  var t=[['🏗️','O.P. en curso',curso,'con fechas planeadas','var(--accent)'],['⏳','Por iniciar',prox,'arrancan más adelante','var(--grad-1)'],
    ['⚖️','Kg programados',kgF(kg),'desde esta semana, sin terminar','var(--green)'],['📈','Semana más cargada',bw?'S'+semISO(new Date(bw)):'—',bw?best+' O.P. a la vez · '+dm(new Date(bw)):'sin O.P. activas','var(--yellow)'],
    ['⛔','Sobrecargas por resolver',M.carga.eps.length,'áreas sobre su capacidad','var(--red)'],['🏁','Terminan después de la entrega',tarde,M.sinPlan.length+' O.P. sin planeación','var(--orange,#f97316)']];
  document.getElementById('embKpis').innerHTML=t.map(function(k,i){return '<div class="rs-tile" style="--rc:'+k[4]+'"'+(i===4?' onclick="embTab(\'quehacer\')"':i===5?' onclick="embTab(\'quehacer\')"':'')+'><div class="rs-label">'+k[0]+' '+k[1]+'</div><div class="rs-value">'+k[2]+'</div><div class="rs-desc">'+k[3]+'</div></div>';}).join('');
}

/* ── línea de tiempo ── */
var PX={dia:24,semana:9,mes:3};
function rango(rows){var a=null,b=null;rows.forEach(function(x){[x.ini,x.iniR].forEach(function(d){if(d&&(!a||d<a))a=d;});[x.fin,x.finR,x.entrega].forEach(function(d){if(d&&(!b||d>b))b=d;});});
  var H=hoy();if(!a){a=addD(H,-14);b=addD(H,60);}a=lunesDe(addD(a,-7));b=addD(b,21);if(H<a)a=lunesDe(addD(H,-7));if(H>b)b=addD(H,21);
  var mn=lunesDe(addD(H,-540)),mx=addD(H,1100);if(a<mn)a=mn;if(b>mx)b=mx;return {a:a,b:b,n:Math.round((b-a)/DIA)+1};}
function encabezado(R,px,carga,mostrarCarga){
  var H=hoy(),w=R.n*px,top='',bot='',lo='';
  for(var d=new Date(R.a);d<=R.b;d=addD(d,1)){var x=Math.round((d-R.a)/DIA)*px;
    if(d.getDate()===1||+d===+R.a){var dias=new Date(d.getFullYear(),d.getMonth()+1,0).getDate()-d.getDate()+1;top+='<div class="emb-cell mes" style="left:'+x+'px;width:'+(dias*px)+'px">'+MES[d.getMonth()]+' '+d.getFullYear()+'</div>';}
    if(EMB.zoom==='dia'){bot+='<div class="emb-cell'+(+d===+H?' hoy':'')+(d.getDay()===0||d.getDay()===6||esFestivo(d)?' fin':'')+'" style="left:'+x+'px;width:'+px+'px;text-align:center" title="'+dmy(d)+(esFestivo(d)?' · festivo':'')+'">'+d.getDate()+'</div>';}
    else if(EMB.zoom==='semana'&&d.getDay()===1){bot+='<div class="emb-cell'+(+d===+lunesDe(H)?' hoy':'')+'" style="left:'+x+'px;width:'+(7*px)+'px" title="Semana '+semISO(d)+': '+dmy(d)+' – '+dmy(addD(d,6))+'">S'+semISO(d)+'</div>';}
  }
  if(mostrarCarga){var cw=+lunesDe(H),cnt={};
    EMB.cache.ops.forEach(function(x){if(x.estado==='Terminado'||!x.ini)return;for(var s=+lunesDe(x.ini);s<=+x.fin;s+=7*DIA)cnt[s]=(cnt[s]||0)+1;});
    Object.keys(cnt).forEach(function(s){var d=new Date(+s);if(d<R.a||d>R.b)return;var x=Math.round((d-R.a)/DIA)*px,c=cnt[s],peor=carga.sobreW[s]?3:c>4?2:1;
      lo+='<div class="lc l'+peor+'" style="left:'+(x+1)+'px;width:'+(7*px-2)+'px" title="Semana '+semISO(d)+': '+c+' O.P. activas'+(peor===3?' · hay áreas sobre capacidad':'')+'">'+(7*px>=16?c:'')+'</div>';});}
  var hx=Math.round((H-R.a)/DIA)*px;
  return '<div class="emb-row hd"><div class="emb-lab">O.P. · cliente</div><div class="emb-tl" style="width:'+w+'px"><div class="emb-hdl">'+top+'</div>'+(EMB.zoom!=='mes'?'<div class="emb-hdl">'+bot+'</div>':'')+
    (mostrarCarga?'<div class="emb-load" title="O.P. activas por semana">'+lo+'</div>':'')+'<div class="emb-hoyl" style="left:'+hx+'px"></div></div></div>';
}
function barra(d1,d2,R,px){if(!d1||!d2)return null;var x=Math.round((d1-R.a)/DIA)*px,wd=Math.max(px,(Math.round((d2-d1)/DIA)+1)*px);return {x:x,w:wd};}
function filaOP(x,R,px,expandible,sobre){
  var H=hoy(),hx=Math.round((H-R.a)/DIA)*px,b=barra(x.ini,x.fin,R,px),col=x.sit==='Terminada'?'#22c55e':x.tarde||x.sit==='Atrasada'?'#ef4444':x.sit==='Por iniciar'?'#94a3b8':'var(--accent)';
  var chip=x.tarde?'<span class="emb-chip r">tarde</span>':x.sit==='Atrasada'?'<span class="emb-chip r">atrasada</span>':'';
  var ab=!!EMB.exp[x.op];
  var h='<div class="emb-row"><div class="emb-lab">'+(expandible?'<button class="chev'+(ab?' open':'')+'" onclick="embToggle(\''+e(x.op)+'\')" aria-label="Ver áreas">▶</button>':'')+
    '<div class="t"><strong>'+e(x.op)+'</strong> '+(x.planta?plantaBadge(x.planta):'')+' '+chip+'<small>'+e(x.nombre)+' · '+e(x.cliente)+'</small></div></div>'+
    '<div class="emb-tl" style="width:'+(R.n*px)+'px">';
  if(b)h+='<div class="emb-bar-op" style="--bc:'+col+';left:'+b.x+'px;width:'+b.w+'px" onclick="embInd(\''+e(x.op)+'\')" title="O.P. '+e(x.op)+' · '+e(x.nombre)+'\n'+e(x.cliente)+' · '+e(x.comercial)+'\nPlan: '+dmy(x.ini)+' – '+dmy(x.fin)+' ('+x.dur+' días hábiles)\nReal: '+(x.iniR?dmy(x.iniR):'—')+' – '+(x.finR?dmy(x.finR):'—')+'\nEntrega: '+(x.entrega?dmy(x.entrega):'sin fecha')+'\nAvance real: '+x.avance+' % · '+e(x.sit)+'\nÁreas: '+x.areas.map(function(a){return nomA(a.area);}).join(', ')+'"><div class="av" style="width:'+x.avance+'%"></div><span>'+(b.w>60?x.avance+' %':'')+'</span></div>';
  if(x.entrega){var ex=Math.round((x.entrega-R.a)/DIA)*px+px/2;if(ex>=0&&ex<=R.n*px)h+='<div class="emb-ent'+(x.tarde?' tarde':'')+'" style="left:'+ex+'px" title="Entrega al cliente: '+dmy(x.entrega)+(x.tarde?' · el plan termina después':'')+'"></div>';}
  h+='<div class="emb-hoyl" style="left:'+hx+'px"></div></div></div>';
  if(expandible&&ab)x.areas.forEach(function(A){h+=filaArea(x,A,R,px,sobre,true);});
  return h;
}
function filaArea(x,A,R,px,sobre,conTareas){
  var H=hoy(),hx=Math.round((H-R.a)/DIA)*px,b=barra(A.ini,A.fin,R,px),br=barra(A.iniR,A.finR||(A.iniR&&A.term<A.tot?H:null),R,px),k=x.op+'|'+A.area,ab=!!EMB.exp[k];
  var est=A.term===A.tot?'<span class="emb-chip g">terminada</span>':A.retrasada?'<span class="emb-chip r">retrasada</span>':'';
  var ov=sobre&&sobre[A.area]?'<span class="emb-chip r" title="Esta área está sobre su capacidad en alguna semana de esta O.P.">cruce</span>':'';
  var h='<div class="emb-row sub"><div class="emb-lab">'+(conTareas?'<button class="chev'+(ab?' open':'')+'" onclick="embToggle(\''+e(k)+'\')" aria-label="Ver tareas">▶</button>':'')+
    '<div class="t"><span style="color:'+(COLOR_AREA[A.area]||'#64748b')+'">●</span> '+e(nomA(A.area))+' '+est+' '+ov+'<small>'+A.term+'/'+A.tot+' tareas terminadas'+(A.ini?' · '+dm(A.ini)+' – '+dm(A.fin):' · sin fechas planeadas')+'</small></div></div>'+
    '<div class="emb-tl" style="width:'+(R.n*px)+'px">';
  if(b)h+='<div class="emb-bar-ar'+(ov?' over':'')+'" style="--bc:'+(COLOR_AREA[A.area]||'#64748b')+';left:'+b.x+'px;width:'+b.w+'px" title="'+e(nomA(A.area))+' · plan '+dmy(A.ini)+' – '+dmy(A.fin)+' ('+diasHabiles(A.ini,A.fin,A.area).length+' días hábiles)"></div>';
  if(br)h+='<div class="emb-bar-real" style="left:'+br.x+'px;width:'+br.w+'px" title="Real: '+dmy(A.iniR)+' – '+(A.finR?dmy(A.finR):'en curso')+'"></div>';
  h+='<div class="emb-hoyl" style="left:'+hx+'px"></div></div></div>';
  if(conTareas&&ab)tareasAgrupadas(A).forEach(function(T){var bt=barra(T.ini,T.fin,R,px),btr=barra(T.iniR,T.finR,R,px);
    h+='<div class="emb-row sub2"><div class="emb-lab"><div class="t">'+e(T.nombre)+(T.n>1?' <span class="emb-chip m">'+T.n+' subestructuras</span>':'')+' '+chipEst(T)+'<small>'+(T.ini?dm(T.ini)+' – '+dm(T.fin):'sin fechas planeadas')+'</small></div></div>'+
      '<div class="emb-tl" style="width:'+(R.n*px)+'px">'+(bt?'<div class="emb-bar-tk'+(T.term===T.n?' term':'')+'" style="--bc:'+(COLOR_AREA[A.area]||'#64748b')+';left:'+bt.x+'px;width:'+bt.w+'px" title="'+e(T.nombre)+' · plan '+dmy(T.ini)+' – '+dmy(T.fin)+'"></div>':'')+
      (btr?'<div class="emb-bar-real" style="top:20px;left:'+btr.x+'px;width:'+btr.w+'px" title="Real: '+dmy(T.iniR)+' – '+dmy(T.finR)+'"></div>':'')+'<div class="emb-hoyl" style="left:'+hx+'px"></div></div></div>';});
  return h;
}
function tareasAgrupadas(A){var g={},orden=[];A.tareas.forEach(function(t){var k=t.tarea||'—';if(!g[k]){g[k]={nombre:k,n:0,term:0,ini:null,fin:null,iniR:null,finR:null,estados:{}};orden.push(k);}var T=g[k];T.n++;if(esTerm(t))T.term++;T.estados[t.estado||'—']=(T.estados[t.estado||'—']||0)+1;
  var pi=pD(t.fechaIniPlan),pf=pD(t.fechaFinPlan),ri=pD(t.fechaIniReal),rf=pD(t.fechaFinReal);
  if(pi&&(!T.ini||pi<T.ini))T.ini=pi;if(pf&&(!T.fin||pf>T.fin))T.fin=pf;if(ri&&(!T.iniR||ri<T.iniR))T.iniR=ri;if(rf&&(!T.finR||rf>T.finR))T.finR=rf;});
  return orden.map(function(k){var T=g[k];T.retrasada=T.fin&&T.fin<hoy()&&T.term<T.n;return T;});}
function chipEst(T){if(T.term===T.n)return '<span class="emb-chip g">✔ terminado</span>';if(T.retrasada)return '<span class="emb-chip r">retrasado</span>';
  var k=Object.keys(T.estados).sort(function(a,b){return T.estados[b]-T.estados[a];})[0];return '<span class="emb-chip m">'+e(verEstado(k))+'</span>';}
function areasSobre(x,M){var r={};x.areas.forEach(function(A){if(!A.ini)return;Object.keys(M.carga.m).forEach(function(k){var p=k.split('#'),f=p[0].split('|');if(f[0]!==A.area)return;var c=M.carga.m[k];if(c.ops[x.op]===undefined)return;if(M.carga.nivel(p[0],c).l===3)r[A.area]=1;});});return r;}
function zoomHtml(){return '<span class="emb-seg">'+[['dia','Días'],['semana','Semanas'],['mes','Meses']].map(function(z){return '<button class="'+(EMB.zoom===z[0]?'on':'')+'" onclick="embZoom(\''+z[0]+'\')">'+z[1]+'</button>';}).join('')+'</span>';}
function leyenda(){return '<div class="emb-leyenda"><span><i style="background:var(--accent)"></i>En curso</span><span><i style="background:#94a3b8"></i>Por iniciar</span><span><i style="background:#ef4444"></i>Atrasada o termina después de la entrega</span><span><i style="background:#22c55e"></i>Terminada</span>'+
  '<span><i style="background:#f97316;transform:rotate(45deg)"></i>Entrega al cliente</span><span><i style="background:var(--text);opacity:.55;height:4px"></i>Fechas reales</span><span><i style="background:rgba(255,255,255,.6);border:1px solid var(--border)"></i>Parte clara de la barra = avance real</span></div>';}
function vGeneral(M){
  if(!M.ops.length)return '<div class="card"><div class="empty">Ninguna O.P. con fechas planeadas cumple los filtros.</div>'+sinPlanHtml(M)+'</div>';
  var px=PX[EMB.zoom],R=rango(M.ops),H=hoy(),h='';
  M.ops.forEach(function(x){h+=filaOP(x,R,px,true,areasSobre(x,M));});
  return '<div class="card"><div class="emb-bar"><span>'+M.ops.length+' O.P. · clic en ▶ para ver sus áreas y tareas · clic en la barra para la vista Individual · arrastre para moverse en el tiempo</span>'+zoomHtml()+'</div>'+
    '<div class="emb-g"><div class="emb-gs" data-hoy="'+Math.round((H-R.a)/DIA)*px+'"><div class="emb-gt">'+encabezado(R,px,M.carga,true)+h+'</div></div></div>'+leyenda()+
    '<p class="emb-nota">La fila de arriba cuenta las O.P. activas por semana: rojo = alguna área supera su capacidad esa semana. Las barras usan las fechas <b>planeadas</b> de los cronogramas; la línea delgada debajo son las fechas <b>reales</b> registradas.</p>'+sinPlanHtml(M)+'</div>';
}
function sinPlanHtml(M){if(!M.sinPlan.length)return '';
  return '<div class="emb-alert i" style="margin-top:14px"><h3>📋 '+M.sinPlan.length+' O.P. sin planeación</h3><p class="muted">No tienen fechas planeadas en los cronogramas, así que no aparecen en el Gantt ni cuentan en la carga. No se estiman fechas.</p><ul>'+
    M.sinPlan.map(function(x){return '<li><b>'+e(x.op)+'</b> '+(x.planta?plantaBadge(x.planta):'')+' — '+e(x.nombre)+' · '+e(x.cliente)+(x.entrega?' · entrega '+dmy(x.entrega):'')+'</li>';}).join('')+'</ul></div>';}
function vIndividual(M){
  var todas=M.ops.concat(M.sinPlan);if(!todas.length)return '<div class="card"><div class="empty">Ninguna O.P. cumple los filtros.</div></div>';
  if(!EMB.ind||!todas.some(function(x){return x.op===EMB.ind;}))EMB.ind=(M.ops[0]||todas[0]).op;
  var x=todas.find(function(y){return y.op===EMB.ind;}),sel='<select class="filter-select" onchange="embInd(this.value)">'+todas.map(function(y){return '<option value="'+e(y.op)+'"'+(y.op===x.op?' selected':'')+'>O.P. '+e(y.op)+' — '+e(y.nombre)+'</option>';}).join('')+'</select>';
  var sob=areasSobre(x,M),h='<div class="card"><div class="emb-bar">'+sel+zoomHtml()+'</div>';
  h+='<div class="emb-filtros" style="gap:14px;font-size:12.5px"><span>👤 <b>'+e(x.cliente)+'</b></span><span>💼 '+e(x.comercial||'—')+'</span><span>'+(x.planta?plantaBadge(x.planta):'')+'</span><span>📅 Plan '+dmy(x.ini)+' – '+dmy(x.fin)+(x.dur?' · '+x.dur+' días hábiles':'')+'</span><span>🏁 Entrega '+(x.entrega?dmy(x.entrega):'sin fecha')+'</span><span>Avance real <b>'+x.avance+' %</b></span><span>'+e(x.sit)+'</span>'+(x.tarde?'<span class="emb-chip r">el plan termina después de la entrega</span>':'')+'</div>';
  if(!x.ini)return h+'<div class="empty">Esta O.P. no tiene fechas planeadas en los cronogramas. No se estiman fechas.</div></div>';
  var px=PX[EMB.zoom],R=rango([x]),H=hoy(),rows='';
  x.areas.forEach(function(A){EMB.exp[x.op+'|'+A.area]=EMB.exp[x.op+'|'+A.area]!==false;rows+=filaArea(x,A,R,px,sob,true);});
  h+='<div class="emb-g"><div class="emb-gs" data-hoy="'+Math.round((H-R.a)/DIA)*px+'"><div class="emb-gt">'+encabezado(R,px,M.carga,false)+filaOP(x,R,px,false,sob)+rows+'</div></div></div>'+leyenda();
  // tabla detalle por área
  h+='<div class="table-wrap" style="margin-top:14px"><table><thead><tr><th>Área</th><th>Tarea</th><th>Inicio plan</th><th>Fin plan</th><th>Días plan</th><th>Inicio real</th><th>Fin real</th><th>Estado</th><th>Observación</th></tr></thead><tbody>';
  x.areas.forEach(function(A){tareasAgrupadas(A).forEach(function(T){
    var obs=[];if(T.retrasada)obs.push('<span class="emb-chip r">fin plan vencido sin terminar</span>');if(sob[A.area])obs.push('<span class="emb-chip r">área sobre capacidad</span>');if(!T.ini)obs.push('<span class="emb-chip m">sin fechas planeadas</span>');
    h+='<tr><td><span style="color:'+(COLOR_AREA[A.area]||'#64748b')+'">●</span> '+e(nomA(A.area))+'</td><td>'+e(T.nombre)+(T.n>1?' <span class="emb-chip m">×'+T.n+'</span>':'')+'</td><td>'+dmy(T.ini)+'</td><td>'+dmy(T.fin)+'</td><td>'+(T.ini?diasHabiles(T.ini,T.fin,A.area).length:'—')+'</td><td>'+dmy(T.iniR)+'</td><td>'+dmy(T.finR)+'</td><td>'+chipEst(T)+'</td><td>'+(obs.join(' ')||'—')+'</td></tr>';});});
  h+='</tbody></table></div><p class="emb-nota">Fechas tal como están en los cronogramas. Cuando la O.P. tiene varias subestructuras, cada tarea muestra la fecha más temprana de inicio y la más tardía de fin. "Días plan" son días hábiles (Producción lunes a sábado; demás áreas lunes a viernes, sin festivos).</p></div>';
  return h;
}
function semanasVista(M){var cw=+lunesDe(hoy()),max=cw;Object.keys(M.carga.m).forEach(function(k){var w=+k.split('#')[1];if(w>max)max=w;});
  var ws=[];for(var w=cw-2*7*DIA;w<=Math.min(max,cw+40*7*DIA);w+=7*DIA)ws.push(w);if(ws.length<12)for(var i=ws.length;i<12;i++)ws.push(ws[ws.length-1]+7*DIA);
  return ws.map(function(w){return +lunesDe(new Date(w+36e5*3));});}
function vCarga(M){
  var C=M.carga,ws=semanasVista(M),cw=+lunesDe(hoy());
  var h='<div class="card"><div class="emb-bar"><span>Cuántas O.P. coinciden en cada área por semana y cuántos kg tienen programados, contra la capacidad de la hoja CAPACIDAD_AREAS.</span><span class="emb-seg"><button class="'+(EMB.met==='ops'?'on':'')+'" onclick="embMet(\'ops\')">O.P. simultáneas</button><button class="'+(EMB.met==='kg'?'on':'')+'" onclick="embMet(\'kg\')">Kg por semana</button></span></div>';
  if(!C.filas.length)return h+'<div class="empty">Sin carga con los filtros actuales.</div></div>';
  h+='<div class="table-wrap" style="max-height:62vh"><table class="emb-ct"><thead><tr><th class="an">Área <small>capacidad</small></th>'+ws.map(function(w){var d=new Date(w);return '<th class="'+(w===cw?'cur':'')+'" title="'+dmy(d)+' – '+dmy(addD(d,6))+'">S'+semISO(d)+'<br>'+dm(d)+'</th>';}).join('')+'</tr></thead><tbody>';
  C.filas.forEach(function(f){var p=f.split('|'),cap=capDe(p[0],p[1]==='AMBAS'?'':p[1]);
    h+='<tr><td class="an"><span style="color:'+(COLOR_AREA[p[0]]||'#64748b')+'">●</span> <b>'+e(filaNombre(f))+'</b><small>'+e(capTxt(cap))+'</small></td>';
    ws.forEach(function(w){var c=C.m[f+'#'+w],lv=C.nivel(f,c),n=c?Object.keys(c.ops).length:0,v=EMB.met==='ops'?n:(c?Math.round(c.kg):0);
      var cls=!c?'l0':lv.l===-1?'ln':'l'+lv.l,sel=EMB.sel&&EMB.sel.f===f&&EMB.sel.w===w?' sel':'';
      var tit=filaNombre(f)+' · S'+semISO(new Date(w))+': '+n+' O.P.'+(c&&c.kg?' · '+kgF(c.kg)+' kg':'')+' · capacidad '+capTxt(cap);
      h+='<td class="c '+cls+sel+'" onclick="embSelCelda(\''+e(f)+'\','+w+')" title="'+e(tit)+'">'+(c?(EMB.met==='ops'?v:(v>=1000?Math.round(v/1000)+'k':v||'·')):'')+'</td>';});
    h+='</tr>';});
  h+='</tbody></table></div><div class="emb-leyenda"><span><i style="background:rgba(34,197,94,.5)"></i>Hasta 60 % de la capacidad</span><span><i style="background:rgba(234,179,8,.55)"></i>60 % a 100 %</span><span><i style="background:rgba(239,68,68,.55)"></i>Sobre la capacidad</span><span><i style="background:var(--surface2);border:1px solid var(--border)"></i>Sin capacidad configurada</span></div>';
  if(EMB.sel&&C.m[EMB.sel.f+'#'+EMB.sel.w])h+=detalleCelda(M,EMB.sel.f,EMB.sel.w);else h+='<p class="emb-nota">Haz clic en una celda para ver qué O.P. coinciden esa semana. Las semanas en verde o vacías son las que tienen disponibilidad.</p>';
  if(currentSede!=='all')h+='<p class="emb-nota">Con una planta filtrada, las áreas con capacidad compartida ("Ambas") se comparan contra su capacidad total.</p>';
  return h+'</div>';
}
function detalleCelda(M,f,w){var c=M.carga.m[f+'#'+w],lv=M.carga.nivel(f,c),d=new Date(w),ids=Object.keys(c.ops);
  var ops=ids.map(function(id){return M.ops.find(function(x){return x.op===id;});}).filter(Boolean).sort(function(a,b){return (a.entrega||Infinity)-(b.entrega||Infinity);});
  return '<div class="emb-det"><h4>'+e(filaNombre(f))+' · semana '+semISO(d)+' ('+dmy(d)+' – '+dmy(addD(d,6))+')</h4><p class="emb-nota" style="margin:0 0 8px">'+ids.length+' O.P. · '+kgF(c.kg)+' kg programados · capacidad '+e(capTxt(lv.cap))+(lv.l===3?' · <b style="color:var(--red)">sobre la capacidad</b>':'')+'</p>'+
    '<table><thead><tr><th>O.P.</th><th>Cliente</th><th>Kg esta semana</th><th>Entrega</th><th></th></tr></thead><tbody>'+ops.map(function(x){return '<tr><td><b>'+e(x.op)+'</b> '+e(x.nombre)+'</td><td>'+e(x.cliente)+'</td><td>'+(c.ops[x.op]?kgF(c.ops[x.op]):'—')+'</td><td>'+(x.entrega?dmy(x.entrega):'—')+(x.tarde?' <span class="emb-chip r">tarde</span>':'')+'</td><td><button class="emb-btn" onclick="embInd(\''+e(x.op)+'\')">Ver</button></td></tr>';}).join('')+'</tbody></table></div>';}
function vKilos(M){
  var C=M.carga,cw=+lunesDe(hoy());if(EMB.semana==null)EMB.semana=cw;var w=EMB.semana,d=new Date(w),fin=addD(d,6);
  var h='<div class="card"><div class="emb-wk"><h3>⚖️ Semana '+semISO(d)+' · '+dmy(d)+' – '+dmy(fin)+'</h3><button class="emb-btn" onclick="embSem(-1)">◀ Anterior</button><button class="emb-btn" onclick="embSem(0)"'+(w===cw?' disabled':'')+'>Semana actual</button><button class="emb-btn" onclick="embSem(1)">Siguiente ▶</button></div>';
  // Kg Fabricados reales de la semana (Producción diaria), con los mismos filtros. Entrega en negro no se suma.
  var real={};(state.produccion||[]).forEach(function(r){var f=parseD(r.fecha);if(!f||f<d||f>fin)return;if(!registroEnPlanta(r.planta,r.op))return;
    if(currentOP!=='all'&&String(r.op)!==currentOP)return;var o=opPorNumero(r.op);if(currentComercial!=='all'&&(!o||comercialOP(o)!==currentComercial))return;
    if(M.F.cli&&(!o||o.cliente!==M.F.cli))return;var pl=normPlanta(r.planta)||'—';real[pl]=(real[pl]||0)+cN(r.real);});
  h+='<div class="table-wrap"><table><thead><tr><th>Área</th><th>Kg programados</th><th>O.P. involucradas</th><th>Capacidad semanal</th><th>Utilización</th><th>Indicador</th></tr></thead><tbody>';
  var filas=C.filas.filter(function(f){return C.m[f+'#'+w];}),tot=0;
  if(!filas.length)h+='<tr><td colspan="6" class="empty">Sin carga programada esta semana con los filtros actuales.</td></tr>';
  filas.forEach(function(f){var c=C.m[f+'#'+w],lv=C.nivel(f,c),cap=lv.cap,ids=Object.keys(c.ops);tot+=c.kg;
    // utilización = la mayor entre O.P. simultáneas y kg (la misma regla que marca la sobrecarga)
    var uso=lv.l>=0&&cap?lv.r:null,pct=uso==null?null:Math.round(uso*100),col=uso==null?'var(--muted)':uso>1?'#ef4444':uso>.6?'#eab308':'#22c55e';
    var det=[];if(cap&&cap.capOps)det.push('O.P. '+ids.length+'/'+cap.capOps);if(cap&&cap.capKg)det.push('kg '+Math.round(lv.rK*100)+' %');
    var p=f.split('|');
    h+='<tr><td><span style="color:'+(COLOR_AREA[p[0]]||'#64748b')+'">●</span> <b>'+e(filaNombre(f))+'</b></td><td><b>'+kgF(c.kg)+'</b> kg'+(p[0]==='PRODUCCION'?'<div style="font-size:11px;color:var(--muted)">Kg Fabricados reales: '+kgF(p[1]!=='AMBAS'&&p[1]!=='—'?(real[p[1]]||0):Object.keys(real).reduce(function(s,k){return s+real[k];},0))+' kg</div>':'')+'</td>'+
      '<td>'+ids.map(function(id){return '<span class="emb-chip a" style="margin:1px" title="'+kgF(c.ops[id])+' kg">'+e(id)+'</span>';}).join(' ')+'</td>'+
      '<td>'+e(capTxt(cap))+'</td><td>'+(pct==null?'<span style="color:var(--muted)">—</span>':'<div style="display:flex;align-items:center;gap:6px"><div class="emb-uso"><div style="width:'+Math.min(100,pct)+'%;background:'+col+'"></div></div><b style="color:'+col+'">'+pct+' %</b></div><div style="font-size:10.5px;color:var(--muted)">'+det.join(' · ')+'</div>')+'</td>'+
      '<td>'+(lv.l===3?'<span class="emb-chip r">⛔ Sobrecarga</span>':lv.l===2?'<span class="emb-chip y">Alta</span>':lv.l===-1?'<span class="emb-chip m">Sin capacidad</span>':'<span class="emb-chip g">Disponible</span>')+'</td></tr>';});
  h+='</tbody></table></div><p class="emb-nota"><b>Kg programados</b>: kg de cada subestructura repartidos en los días hábiles planeados de cada área (tareas sin terminar). En Producción solo cuenta la tarea <b>Kg Fabricados</b>; la Entrega en negro no se suma. <b>Kg Fabricados reales</b> sale de Producción diaria y es solo para comparar.</p></div>';
  return h;
}
function vQueHacer(M){
  var C=M.carga,h='',H=hoy();
  if(!C.eps.length){var libres=C.filas.map(function(f){var ws=[];for(var i=0;i<8;i++){var w=+lunesDe(addD(H,7*i));var lv=C.nivel(f,C.m[f+'#'+w]);if(lv.l>=0&&lv.l<2&&lv.cap)ws.push('S'+semISO(new Date(w)));}return ws.length?'<li><b>'+e(filaNombre(f))+'</b>: '+ws.join(', ')+'</li>':'';}).join('');
    h+='<div class="emb-alert ok"><h3>✅ Sin sobrecargas de aquí en adelante</h3><p>Ninguna área supera su capacidad configurada con las O.P. y filtros actuales.</p>'+(libres?'<p class="muted">Semanas con disponibilidad (próximas 8):</p><ul>'+libres+'</ul>':'')+'</div>';}
  C.eps.forEach(function(ep){var S=sugerencias(ep,M),p=ep.fila.split('|'),cap=capDe(p[0],p[1]==='AMBAS'?'':p[1]);
    var sem=ep.w0===ep.w1?'la semana '+semISO(new Date(ep.w0))+' ('+dm(new Date(ep.w0))+')':'las semanas '+semISO(new Date(ep.w0))+' a '+semISO(new Date(ep.w1))+' ('+dm(new Date(ep.w0))+' – '+dm(addD(new Date(ep.w1),6))+')';
    var que=[];if(S.porOps)que.push('hasta <b>'+S.maxOps+' O.P. al tiempo</b> (capacidad '+cap.capOps+')');if(cap&&cap.capKg&&S.maxKg>cap.capKg)que.push('hasta <b>'+kgF(S.maxKg)+' kg</b> en una semana (capacidad '+kgF(cap.capKg)+')');
    h+='<div class="emb-alert"><h3>⛔ '+e(filaNombre(ep.fila))+' sobre su capacidad en '+sem+'</h3><p>Tiene '+que.join(' y ')+'.'+(cap&&/validar/i.test(cap.estado||'')?' <span class="emb-chip y">capacidad por validar</span>':'')+'</p>'+
      '<p><b>O.P. involucradas</b> (por fecha de entrega): '+S.ops.map(function(x,i){return '<b>'+e(x.op)+'</b>'+(x.entrega?' (entrega '+dm(x.entrega)+')':' (sin entrega)')+(i<(S.porOps?cap.capOps:0)?' <span class="emb-chip g">prioridad</span>':'');}).join(', ')+'</p>';
    if(S.mover.length){h+='<p><b>Alternativa a evaluar — correr:</b></p><ul>'+S.mover.map(function(m){return '<li>O.P. <b>'+e(m.x.op)+'</b>: iniciar '+e(nomA(p[0]).toLowerCase())+' <b>'+m.dias+' días hábiles</b> después ('+e(m.por)+'). Su plan terminaría el '+dmy(m.nf)+(m.x.entrega?(m.nf>m.x.entrega?' → <b style="color:var(--red)">pasaría la entrega ('+dmy(m.x.entrega)+')</b>':' → sigue antes de la entrega ('+dmy(m.x.entrega)+')'):'')+'.</li>';}).join('')+'</ul>';}
    var ref=[];if(S.porOps)ref.push('atender '+S.maxOps+' O.P. a la vez (hoy '+cap.capOps+')');if(cap&&cap.capKg&&S.maxKg>cap.capKg)ref.push('procesar '+kgF(S.maxKg-cap.capKg)+' kg más esa semana');
    h+='<p><b>Otra alternativa:</b> reforzar '+e(filaNombre(ep.fila))+' (turno extra, personal o tercerizar) para '+ref.join(' y ')+'.</p><p class="muted">Recomendación informativa: no cambia ninguna fecha. Los cambios se hacen en los cronogramas, como siempre.</p></div>';});
  var tarde=M.ops.filter(function(x){return x.tarde;});
  if(tarde.length)h+='<div class="emb-alert w"><h3>🏁 '+tarde.length+' O.P. con el plan terminando después de la entrega</h3><ul>'+tarde.sort(function(a,b){return a.entrega-b.entrega;}).map(function(x){return '<li><b>'+e(x.op)+'</b> '+(x.planta?plantaBadge(x.planta):'')+' '+e(x.nombre)+': plan hasta '+dmy(x.fin)+', entrega '+dmy(x.entrega)+' ('+(nHabiles(addD(x.entrega,1),x.fin))+' días hábiles después). <button class="emb-btn" onclick="embInd(\''+e(x.op)+'\')">Ver</button></li>';}).join('')+'</ul><p class="muted">Revisar con las áreas si se puede adelantar o si hay que reprogramar la entrega (con su motivo, en Comercial).</p></div>';
  var atr=[];M.ops.forEach(function(x){x.areas.forEach(function(A){if(A.retrasada)atr.push({x:x,A:A});});});
  if(atr.length)h+='<div class="emb-alert w"><h3>⏰ '+atr.length+' áreas con el plan vencido sin terminar</h3><ul>'+atr.slice(0,40).map(function(r){return '<li>O.P. <b>'+e(r.x.op)+'</b> · '+e(nomA(r.A.area))+': debía terminar el '+dmy(r.A.fin)+' · '+r.A.term+'/'+r.A.tot+' tareas terminadas</li>';}).join('')+(atr.length>40?'<li>… y '+(atr.length-40)+' más</li>':'')+'</ul></div>';
  return '<div class="card">'+h+sinPlanHtml(M)+'</div>';
}
function sugerencias(ep,M){
  var p=ep.fila.split('|'),a=p[0],cap=capDe(a,p[1]==='AMBAS'?'':p[1])||{},ids={};
  ep.cel.forEach(function(c){Object.keys(c.c.ops).forEach(function(id){ids[id]=1;});});
  var ops=Object.keys(ids).map(function(id){return M.ops.find(function(x){return x.op===id;});}).filter(Boolean)
    .sort(function(x,y){return (x.entrega||Infinity)-(y.entrega||Infinity)||(x.fin-y.fin);});
  var maxOps=Math.max.apply(null,ep.cel.map(function(c){return Object.keys(c.c.ops).length;})),maxKg=Math.max.apply(null,ep.cel.map(function(c){return c.c.kg;}));
  var porOps=!!(cap.capOps&&maxOps>cap.capOps),mover=[];
  var areaDe=function(x){return x.areas.find(function(A){return A.area===a;});};
  if(porOps){var keep=ops.slice(0,cap.capOps),move=ops.slice(cap.capOps),fins=keep.map(areaDe).filter(Boolean).map(function(A){return A.fin;}).sort(function(x,y){return x-y;});
    move.forEach(function(x,i){var A=areaDe(x);if(!A||!A.ini||!fins.length)return;var libre=fins[Math.min(i,fins.length-1)],ns=sigHabil(addD(libre,1));if(ns<=A.ini)return;
      var dias=nHabiles(A.ini,addD(ns,-1));if(dias<=0)return;var k=keep[Math.min(i,keep.length-1)];
      mover.push({x:x,dias:dias,nf:sumarHabiles(x.fin,dias),por:'libera cupo cuando la O.P. '+(k?k.op:'')+' termine '+nomA(a).toLowerCase()+' el '+dmy(libre)});});}
  else{var x=ops[ops.length-1],A=x&&areaDe(x);if(A&&A.ini){var ns=sigHabil(addD(new Date(ep.w1),7));if(ns>A.ini){var dias=nHabiles(A.ini,addD(ns,-1));mover.push({x:x,dias:dias,nf:sumarHabiles(x.fin,dias),por:'es la de entrega más lejana; arrancaría después del pico'});}}}
  return {ops:ops,maxOps:maxOps,maxKg:maxKg,porOps:porOps,mover:mover};
}
function vPlantilla(M){
  var cs=caps(),ar={};filtTareas().forEach(function(t){var a=normA(t.area);if(!a)return;(ar[a]=ar[a]||{})[t.tarea||'—']=1;});
  var h='<div class="card"><p class="emb-nota" style="margin-top:0">Las capacidades se leen de la hoja <b>CAPACIDAD_AREAS</b> de la Maestra (protegida; la editan los administradores). Celda vacía = sin capacidad, y esa área no marca sobrecargas. Aquí solo se consultan: la App no las cambia.</p>';
  if(!cs.length)h+='<div class="emb-alert w"><h3>⚙️ Aún no hay capacidades configuradas</h3><p>En la Maestra, menú <b>🚀 Torre de Control → 📊 Crear / proteger hoja de capacidades (Embudo)</b>. Mientras tanto la carga se muestra, pero no se marcan sobrecargas.</p></div>';
  h+='<div class="table-wrap"><table><thead><tr><th>Orden</th><th>Área</th><th>Planta</th><th>Máx. O.P. simultáneas</th><th>Kg por semana</th><th>Estado</th><th>Tareas en los cronogramas</th></tr></thead><tbody>';
  var areas=ordenarAreas(Object.keys(ar).concat(cs.map(function(c){return c.area;})).filter(function(v,i,s){return s.indexOf(v)===i;}));
  areas.forEach(function(a){var cc=cs.filter(function(c){return c.area===a;});if(!cc.length)cc=[{area:a,planta:'',capOps:null,capKg:null,estado:'Sin configurar'}];
    cc.forEach(function(c,i){h+='<tr><td>'+(posArea(a)<99?posArea(a)+1:'—')+'</td><td><span style="color:'+(COLOR_AREA[a]||'#64748b')+'">●</span> <b>'+e(nomA(a))+'</b></td><td>'+e(c.planta==='AMBAS'?'Ambas':c.planta||'—')+'</td><td>'+(c.capOps||'—')+'</td><td>'+(c.capKg?kgF(c.capKg):'—')+'</td><td>'+(/validar/i.test(c.estado||'')?'<span class="emb-chip y">'+e(c.estado)+'</span>':e(c.estado||'—'))+'</td>'+
      (i===0?'<td rowspan="'+cc.length+'" style="font-size:11.5px;color:var(--muted);white-space:normal;max-width:420px">'+e(Object.keys(ar[a]||{}).join(' · ')||'—')+'</td>':'')+'</tr>';});});
  h+='</tbody></table></div><p class="emb-nota">El orden de las áreas y sus tareas vienen de la Torre (Comercial y cronogramas), así no hay dos configuraciones distintas. Cambiar una capacidad no modifica ningún cronograma ni dato histórico: solo cambia cómo se colorea la carga.</p></div>';
  return h;
}
/* arrastrar el Gantt con el mouse */
function arrastre(){document.querySelectorAll('#page-embudo .emb-gs').forEach(function(s){if(s._drag)return;s._drag=1;var x0=0,l0=0,on=false;
  s.addEventListener('mousedown',function(ev){if(ev.target.closest('button,.emb-bar-op'))return;on=true;x0=ev.pageX;l0=s.scrollLeft;s.classList.add('drag');});
  window.addEventListener('mouseup',function(){on=false;s.classList.remove('drag');});
  s.addEventListener('mousemove',function(ev){if(!on)return;ev.preventDefault();s.scrollLeft=l0-(ev.pageX-x0);});});}

/* ── exportar a Excel (respeta los filtros) ── */
window.embExportar=function(){
  var btn=document.getElementById('embExportar'),t0=btn.textContent;btn.disabled=true;btn.textContent='Preparando…';
  rtCargarXLSX().then(function(){
    var M=EMB.cache||modelo(),C=M.carga;
    var g=[['O.P.','Nombre','Cliente','Comercial','Planta','Estado','Situación','Inicio plan','Fin plan','Días hábiles plan','Inicio real','Fin real','Entrega al cliente','Termina después de la entrega','Avance real %','Áreas']];
    M.ops.concat(M.sinPlan).forEach(function(x){g.push([isNaN(+x.op)?x.op:+x.op,x.nombre,x.cliente,x.comercial,x.planta,x.estado,x.sit,x.ini?dmy(x.ini):'',x.fin?dmy(x.fin):'',x.dur||'',x.iniR?dmy(x.iniR):'',x.finR?dmy(x.finR):'',x.entrega?dmy(x.entrega):'',x.tarde?'Sí':'No',x.avance,x.areas.map(function(A){return nomA(A.area);}).join(', ')]);});
    var d=[['O.P.','Planta','Subestructura','Área','Tarea','Inicio plan','Fin plan','Días plan (cronograma)','Inicio real','Fin real','Estado','Kg subestructura']];
    M.ops.concat(M.sinPlan).forEach(function(x){x.tareas.slice().sort(function(a,b){return posArea(a.area)-posArea(b.area);}).forEach(function(t){d.push([isNaN(+x.op)?x.op:+x.op,normPlanta(t.sede)||x.planta,t.subEstructura||'',nomA(normA(t.area)),t.tarea||'',t.fechaIniPlan||'',t.fechaFinPlan||'',t.durPlan||'',t.fechaIniReal||'',t.fechaFinReal||'',verEstado(t.estado||''),cN(t.pesoKgSub)||'']);});});
    var c=[['Área','Planta','Semana','Desde','Hasta','O.P. simultáneas','O.P.','Kg programados','Capacidad O.P.','Capacidad kg/semana','% uso','Sobrecarga']];
    C.filas.forEach(function(f){var p=f.split('|');Object.keys(C.m).filter(function(k){return k.split('#')[0]===f;}).map(function(k){return +k.split('#')[1];}).sort(function(a,b){return a-b;}).forEach(function(w){
      var cc=C.m[f+'#'+w],lv=C.nivel(f,cc),dd=new Date(w),ids=Object.keys(cc.ops);
      c.push([nomA(p[0]),p[1]==='AMBAS'?'Ambas':p[1],'S'+semISO(dd)+' '+dd.getFullYear(),dmy(dd),dmy(addD(dd,6)),ids.length,ids.join(', '),Math.round(cc.kg),lv.cap&&lv.cap.capOps||'',lv.cap&&lv.cap.capKg||'',lv.l>=0&&lv.cap?Math.round(lv.r*100):'',lv.l===3?'Sí':'No']);});});
    var wb=XLSX.utils.book_new(),add=function(rows,n,w){var ws=XLSX.utils.aoa_to_sheet(rows);ws['!cols']=w.map(function(x){return {wch:x};});ws['!autofilter']={ref:XLSX.utils.encode_range({s:{r:0,c:0},e:{r:Math.max(rows.length-1,1),c:rows[0].length-1}})};XLSX.utils.book_append_sheet(wb,ws,n);};
    add(g,'General',[8,28,24,22,13,12,14,11,11,10,11,11,12,10,9,40]);add(d,'Detalle por tarea',[8,13,24,14,26,11,11,10,11,11,11,12]);add(c,'Carga por semana',[14,13,11,11,11,9,30,12,10,12,8,10]);
    var gv=function(id){var x=document.getElementById(id);return x&&x.value?(x.options?x.options[x.selectedIndex].text:x.value):'';};
    var fl=[['Embudo de O.P. — Torre de Control Polyuprotec'],['Exportado',fmtDMY(new Date())+' '+new Date().toTimeString().slice(0,5)],[''],['Filtro','Valor'],
      ['Planta',currentSede==='all'?'Todas':currentSede],['Comercial',currentComercial==='all'?'Todos':currentComercial],['O.P.',currentOP==='all'?'Todas':currentOP],['Subestructura',currentSub==='all'?'Todas':currentSub],
      ['Cliente',gv('embCli')||'Todos'],['Estado',gv('embEst')||'Todos'],['Área',gv('embArea')||'Todas'],['Búsqueda',(document.getElementById('embTxt')||{}).value||'—'],['Incluye terminadas',(document.getElementById('embTerm')||{}).checked?'Sí':'No'],
      [''],['Notas'],['Fechas planeadas y reales tal como están en los cronogramas; no se estiman fechas.'],['Kg programados: kg de la subestructura repartidos en los días hábiles planeados del área (sin tareas terminadas). Producción: solo Kg Fabricados.'],['Capacidades: hoja CAPACIDAD_AREAS de la Maestra.']];
    var wf=XLSX.utils.aoa_to_sheet(fl);wf['!cols']=[{wch:20},{wch:90}];XLSX.utils.book_append_sheet(wb,wf,'Filtros');
    var h=new Date();XLSX.writeFile(wb,'Embudo_OP_'+h.getFullYear()+'-'+('0'+(h.getMonth()+1)).slice(-2)+'-'+('0'+h.getDate()).slice(-2)+'.xlsx');
    btn.disabled=false;btn.textContent=t0;
  }).catch(function(){btn.disabled=false;btn.textContent='❌ No se pudo cargar el exportador';setTimeout(function(){btn.textContent=t0;},4000);});
};
})();
