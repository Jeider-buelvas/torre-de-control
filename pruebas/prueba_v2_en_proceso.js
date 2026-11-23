process.env.TZ='America/Bogota';
const {Spreadsheet,entorno,cargar}=require('./gsim_rep.js');const fs=require('fs');
const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ FALLA ')+m); if(!c) process.exitCode=1;};
const V46='/home/claude/trabajo/PRODUCCION_V2_v4_6.gs',V47='/home/claude/trabajo/PRODUCCION_V2_v4_7.gs';
const abrir=gs=>{const ss=new Spreadsheet('V',JSON.parse(fs.readFileSync('v2_base.json')),'PLANTILLA_LOOKER_PRODUCCION_V2');const env=entorno({},ss,{docProps:{}});
  env.G.LockService={getDocumentLock:()=>({tryLock:()=>true,releaseLock(){}}),getScriptLock:()=>({tryLock:()=>true,waitLock(){},releaseLock(){}})};
  const F=cargar(gs,env,['sincronizarDiarioACronograma','layoutDeHoja_']);
  // producción real: 4103_2 parcial (100 kg) y 4095_1 completa (su peso)
  const m=ss.getSheetByName('NOVIEMBRE 2026'),lay=F.layoutDeHoja_(m);
  m.getRange(3,lay.primerDia).setValue(100);m.getRange(6,lay.primerDia).setValue(m.getRange(6,7).getValue());
  return {ss,F};};
const a=abrir(V46),b=abrir(V47);a.F.sincronizarDiarioACronograma();b.F.sincronizarDiarioACronograma();
const C=x=>x.ss.getSheetByName('Cronograma');const n=C(a).getLastRow();
const dif={estado:[],otras:0};
for(let r=1;r<=n;r++)for(let c=1;c<=45;c++){const va=C(a).getRange(r,c).getValue(),vb=C(b).getRange(r,c).getValue();const s=v=>v instanceof Date?+v:String(v);
  if(s(va)!==s(vb)){if(c===16)dif.estado.push([r,va,vb,C(b).getRange(r,19).getValue(),C(b).getRange(r,14).getValue()]);else dif.otras++;}}
console.log('     cambios de estado v4.6 → v4.7:');dif.estado.forEach(d=>console.log('       fila',d[0],d[4],':',JSON.stringify(d[1]),'→',JSON.stringify(d[2]),'kg',d[3]));
ok(dif.otras===0,'Kg, fechas y demás columnas idénticas a v4.6');
ok(dif.estado.length>0&&dif.estado.every(d=>d[2]==='En Proceso'&&+d[3]>0),'Solo cambia el estado de tareas con kg parciales: queda "En Proceso" (antes "Abierto")');
const term=r=>C(b).getRange(r,16).getValue();
ok([...Array(n).keys()].map(i=>i+1).every(r=>C(a).getRange(r,16).getValue()!=='Terminado'||term(r)==='Terminado'),'Ningún Terminado baja');
