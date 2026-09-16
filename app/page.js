"use client";
import {useEffect,useMemo,useState} from "react";
import {supabase} from "../lib/supabase";
const money=n=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(Number(n)||0);
const pct=n=>`${Number(n).toFixed(2)}%`;
export default function Home(){
 const [tab,setTab]=useState("resumen"),[debts,setDebts]=useState([]),[payments,setPayments]=useState([]),[investments,setInvestments]=useState([]),[loading,setLoading]=useState(true);
 const [form,setForm]=useState({payment_date:new Date().toISOString().slice(0,10),debt_id:"",amount:"",note:""});
 const [debtForm,setDebtForm]=useState({name:"",original_amount:"",prior_paid:"0",affects_participation:false});
 async function load(){
  if(!supabase){setLoading(false);return}
  setLoading(true);
  const [d,p,i]=await Promise.all([
   supabase.from("debts").select("*").order("sort_order"),
   supabase.from("payments").select("*").order("payment_date",{ascending:false}).order("created_at",{ascending:false}),
   supabase.from("investments").select("*").order("sort_order")
  ]);
  setDebts(d.data||[]);setPayments(p.data||[]);setInvestments(i.data||[]);
  if(!form.debt_id&&d.data?.[0])setForm(x=>({...x,debt_id:d.data[0].id}));
  setLoading(false);
 }
 useEffect(()=>{load()},[]);
 const paid=id=>payments.filter(p=>p.debt_id===id).reduce((a,p)=>a+Number(p.amount),0);
 const rows=debts.map(d=>({...d,current:Math.max(0,Number(d.opening_balance)-paid(d.id))}));
 const total=rows.reduce((a,d)=>a+d.current,0);
 const specialPaid=payments.filter(p=>debts.find(d=>d.id===p.debt_id)?.affects_participation).reduce((a,p)=>a+Number(p.amount),0);
 const carlosContribution=Math.min(3600,specialPaid/2), earned=(carlosContribution/3600)*20;
 const carlos=Math.min(40,20+earned),victor=100-carlos;
 async function addDebt(e){
  e.preventDefault();
  const original=Number(debtForm.original_amount), prior=Number(debtForm.prior_paid||0);
  if(!debtForm.name.trim()||!original||original<=0)return alert("Completa el nombre y monto de la deuda.");
  if(prior<0||prior>original)return alert("El pago previo debe estar entre $0 y el valor original.");
  const id=("deuda-"+debtForm.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")+"-"+Date.now());
  const maxSort=debts.reduce((m,d)=>Math.max(m,Number(d.sort_order)||0),0);
  const {error}=await supabase.from("debts").insert({
   id,name:debtForm.name.trim(),original_amount:original,prior_paid:prior,
   opening_balance:original-prior,affects_participation:debtForm.affects_participation,sort_order:maxSort+1
  });
  if(error)return alert(error.message);
  setDebtForm({name:"",original_amount:"",prior_paid:"0",affects_participation:false});
  await load(); alert("Nueva deuda registrada.");
 }
 async function add(e){e.preventDefault();let amount=Number(form.amount),d=rows.find(x=>x.id===form.debt_id);if(!amount||amount<=0)return alert("Monto inválido");if(amount>d.current)return alert("El pago supera el saldo");
  let {error}=await supabase.from("payments").insert({debt_id:form.debt_id,payment_date:form.payment_date,amount,note:form.note||null});if(error)return alert(error.message);setForm(x=>({...x,amount:"",note:""}));load()}
 async function del(id){if(!confirm("¿Eliminar este pago?"))return;let {error}=await supabase.from("payments").delete().eq("id",id);if(error)return alert(error.message);load()}
 if(!supabase)return <main><div className="notice"><b>Falta conectar Supabase.</b><br/>Copia .env.example a .env.local y agrega la URL y Publishable Key de tu proyecto nuevo.</div></main>;
 return <main><header><div><h1>Sociedad 50/50</h1><p>Víctor & Carlos · Datos sincronizados con Supabase</p></div><div className="badge">Ganancias actuales: 50% / 50%</div></header>
 <nav>{[["resumen","Resumen"],["deudas","Deudas y pagos"],["participacion","Participación"],["inversion","Inversión"]].map(x=><button key={x[0]} className={tab===x[0]?"active":""} onClick={()=>setTab(x[0])}>{x[1]}</button>)}</nav>
 {loading?<p>Cargando...</p>:<>
 {tab==="resumen"&&<section>
 <div className="hero">
   <div><span className="eyebrow">CONTROL DE SOCIEDAD</span><h2>Resumen financiero</h2><p>Deudas, pagos y avance de participación en un solo lugar.</p></div>
   <div className="heroPeople"><div><b>Víctor</b><strong>{pct(victor)}</strong></div><div><b>Carlos</b><strong>{pct(carlos)}</strong></div></div>
 </div>
 <div className="cards proCards">
  <Card t="Deuda pendiente" v={money(total)} icon="◈"/>
  <Card t="Total pagado" v={money(debts.reduce((a,d)=>a+Number(d.prior_paid||0),0)+payments.reduce((a,p)=>a+Number(p.amount),0))} icon="✓"/>
  <Card t="Carlos reconocido" v={`${money(carlosContribution)} / $3,600`} icon="↗"/>
  <Card t="Progreso participación" v={pct(Math.min(100,carlosContribution/36))} icon="%"/>
 </div>
 <div className="dashboardGrid">
  <div className="panel">
   <div className="panelHead"><div><h2>Participación dinámica</h2><p>Carlos sube de 20% a 40%; Víctor baja de 80% a 60%.</p></div><span className="pill">En progreso</span></div>
   <div className="peopleGrid">
    <div className="person victor"><span>V</span><div><small>Víctor</small><strong>{pct(victor)}</strong><p>Meta previa: 60%</p></div></div>
    <div className="person carlos"><span>C</span><div><small>Carlos</small><strong>{pct(carlos)}</strong><p>Meta previa: 40%</p></div></div>
   </div>
   <div className="bigProgress"><div style={{width:`${Math.min(100,carlosContribution/36)}%`}}></div></div>
   <div className="progressLabels"><span>{money(carlosContribution)} reconocido a Carlos</span><b>Faltan {money(Math.max(0,3600-carlosContribution))}</b></div>
  </div>
  <div className="panel">
   <div className="panelHead"><div><h2>Progreso de deudas</h2><p>Porcentaje pagado y cuánto falta.</p></div></div>
   <div className="debtProgressList">{rows.map(d=>{const done=Number(d.original_amount)-d.current;const progress=Math.max(0,Math.min(100,done/Number(d.original_amount)*100));return <div className="debtProgress" key={d.id}><div><b>{d.name}</b><span>{pct(progress)} pagado</span></div><div className="miniProgress"><i style={{width:`${progress}%`}}/></div><small>{money(d.current)} por pagar</small></div>})}</div>
  </div>
 </div>
 <div className="panel debtPanel"><div className="panelHead"><div><h2>Detalle de deudas</h2><p>Seguimiento individual en tiempo real.</p></div><button className="quick" onClick={()=>setTab("deudas")}>＋ Nueva deuda</button></div>
 <div className="table"><table><thead><tr><th>Deuda</th><th>Total</th><th>Pagado</th><th>Restante</th><th>% pagado</th><th>Participación</th></tr></thead><tbody>{rows.map(d=>{const done=Number(d.original_amount)-d.current;const pr=Math.max(0,Math.min(100,done/Number(d.original_amount)*100));return <tr key={d.id}><td><b>{d.name}</b></td><td>{money(d.original_amount)}</td><td>{money(done)}</td><td><b>{money(d.current)}</b></td><td><div className="tableProgress"><i style={{width:`${pr}%`}}/></div><small>{pct(pr)}</small></td><td>{d.affects_participation?<span className="yes">Sí, 50/50</span>:<span className="no">No</span>}</td></tr>})}</tbody></table></div></div>
 </section>}
 {tab==="deudas"&&<section>
 <h2>Registrar nueva deuda</h2>
 <form className="form debtform" onSubmit={addDebt}>
  <label>Nombre de la deuda<input value={debtForm.name} onChange={e=>setDebtForm({...debtForm,name:e.target.value})} placeholder="Ej. Nueva máquina"/></label>
  <label>Valor original US$<input type="number" min="0.01" step=".01" value={debtForm.original_amount} onChange={e=>setDebtForm({...debtForm,original_amount:e.target.value})}/></label>
  <label>Pagado anteriormente US$<input type="number" min="0" step=".01" value={debtForm.prior_paid} onChange={e=>setDebtForm({...debtForm,prior_paid:e.target.value})}/></label>
  <label className="check"><input type="checkbox" checked={debtForm.affects_participation} onChange={e=>setDebtForm({...debtForm,affects_participation:e.target.checked})}/> Afecta cálculo de participación</label>
  <button className="primary">Registrar deuda</button>
 </form>
 <div className="notice"><b>Importante:</b> normalmente las nuevas deudas del negocio no deben afectar el porcentaje de Carlos/Víctor. Marca “Afecta cálculo de participación” solamente si esa deuda forma parte del acuerdo especial de adquisición de participación.</div>
 <h2>Registrar pago</h2><form className="form" onSubmit={add}><label>Fecha<input type="date" value={form.payment_date} onChange={e=>setForm({...form,payment_date:e.target.value})}/></label><label>Deuda<select value={form.debt_id} onChange={e=>setForm({...form,debt_id:e.target.value})}>{rows.map(d=><option value={d.id} key={d.id}>{d.name} — {money(d.current)}</option>)}</select></label><label>Monto<input type="number" step=".01" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/></label><label>Nota<input value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/></label><button className="primary">Guardar en Supabase</button></form><h2>Historial</h2><div className="table"><table><thead><tr><th>Fecha</th><th>Deuda</th><th>Pago</th><th>Víctor</th><th>Carlos</th><th>Nota</th><th></th></tr></thead><tbody>{payments.map(p=>{let d=debts.find(x=>x.id===p.debt_id);return <tr key={p.id}><td>{p.payment_date}</td><td>{d?.name}</td><td>{money(p.amount)}</td><td>{d?.affects_participation?money(p.amount/2):"—"}</td><td>{d?.affects_participation?money(p.amount/2):"—"}</td><td>{p.note||"—"}</td><td><button className="delete" onClick={()=>del(p.id)}>Eliminar</button></td></tr>})}</tbody></table></div></section>}
 {tab==="participacion"&&<section><h2>Participación económica dinámica</h2><div className="split"><div className="partner"><span>Víctor</span><strong>{pct(victor)}</strong><small>80% → 60%</small></div><div className="partner"><span>Carlos</span><strong>{pct(carlos)}</strong><small>20% → 40%</small></div></div><div className="progress"><div style={{width:`${carlosContribution/36}%`}}/></div><p>Carlos reconocido: <b>{money(carlosContribution)}</b> de <b>$3,600</b>.</p><div className="notice">Solo cuentan Liquidación socios anteriores y Deuda con Víctor. Cada pago se divide 50% Víctor / 50% Carlos. Carlos sube de 20% a 40%; Víctor baja de 80% a 60%. Después se contempla la cesión final de 10 puntos de Víctor a Carlos para 50/50.</div></section>}
 {tab==="inversion"&&<section><h2>Inversión registrada</h2><div className="table"><table><thead><tr><th>Concepto</th><th>Valor</th><th>Nota</th></tr></thead><tbody>{investments.map(i=><tr key={i.id}><td>{i.concept}</td><td>{money(i.amount_usd)}</td><td>{i.notes||"—"}</td></tr>)}</tbody></table></div></section>}
 </>}</main>}
function Card({t,v,icon}){return <div className="card"><div className="cardIcon">{icon||"◆"}</div><span>{t}</span><strong>{v}</strong><small>Actualizado con Supabase</small></div>}
function DebtTable({rows,paid}){return <div className="table"><table><thead><tr><th>Deuda</th><th>Original</th><th>Pagado antes</th><th>Pagos app</th><th>Saldo</th></tr></thead><tbody>{rows.map(d=><tr key={d.id}><td>{d.name}{d.affects_participation&&<em> Afecta %</em>}</td><td>{money(d.original_amount)}</td><td>{money(d.prior_paid)}</td><td>{money(paid(d.id))}</td><td><b>{money(d.current)}</b></td></tr>)}</tbody></table></div>}
