"use client";
import {useEffect,useState} from "react";
import {supabase} from "../lib/supabase";
const money=n=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(Number(n)||0);
const pct=n=>`${Number(n||0).toFixed(1)}%`;

export default function Home(){
 const [tab,setTab]=useState("inicio"),[debts,setDebts]=useState([]),[payments,setPayments]=useState([]),[investments,setInvestments]=useState([]),[loading,setLoading]=useState(true);
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

 const paidApp=id=>payments.filter(p=>p.debt_id===id).reduce((a,p)=>a+Number(p.amount),0);
 const rows=debts.map(d=>({...d,current:Math.max(0,Number(d.opening_balance)-paidApp(d.id))}));
 const originalTotal=debts.reduce((a,d)=>a+Number(d.original_amount||0),0);
 const totalPending=rows.reduce((a,d)=>a+d.current,0);
 const totalPaid=Math.max(0,originalTotal-totalPending);
 const investmentTotal=investments.reduce((a,i)=>a+Number(i.amount_usd||0),0);
 const debtProgress=originalTotal?Math.min(100,totalPaid/originalTotal*100):0;

 const specialPaid=payments.filter(p=>debts.find(d=>d.id===p.debt_id)?.affects_participation).reduce((a,p)=>a+Number(p.amount),0);
 const carlosContribution=Math.min(3600,specialPaid/2);
 const earned=(carlosContribution/3600)*20;
 const carlos=Math.min(40,20+earned), victor=100-carlos;
 const participationProgress=Math.min(100,carlosContribution/36);

 async function addDebt(e){
  e.preventDefault();
  const original=Number(debtForm.original_amount), prior=Number(debtForm.prior_paid||0);
  if(!debtForm.name.trim()||!original||original<=0)return alert("Completa el nombre y monto.");
  if(prior<0||prior>original)return alert("El pago previo no es válido.");
  const id="deuda-"+Date.now();
  const maxSort=debts.reduce((m,d)=>Math.max(m,Number(d.sort_order)||0),0);
  const {error}=await supabase.from("debts").insert({id,name:debtForm.name.trim(),original_amount:original,prior_paid:prior,opening_balance:original-prior,affects_participation:debtForm.affects_participation,sort_order:maxSort+1});
  if(error)return alert(error.message);
  setDebtForm({name:"",original_amount:"",prior_paid:"0",affects_participation:false}); await load(); setTab("inicio");
 }
 async function add(e){
  e.preventDefault(); const amount=Number(form.amount),d=rows.find(x=>x.id===form.debt_id);
  if(!amount||amount<=0)return alert("Monto inválido");
  if(amount>d.current)return alert("El pago supera el saldo");
  const {error}=await supabase.from("payments").insert({debt_id:form.debt_id,payment_date:form.payment_date,amount,note:form.note||null});
  if(error)return alert(error.message); setForm(x=>({...x,amount:"",note:""})); await load(); setTab("inicio");
 }
 async function del(id){if(!confirm("¿Eliminar este pago?"))return;const {error}=await supabase.from("payments").delete().eq("id",id);if(error)return alert(error.message);load()}

 if(!supabase)return <div className="missing"><b>Falta conectar Supabase.</b><br/>Agrega las variables de Supabase en Vercel.</div>;

 const nav=[["inicio","⌂","Inicio"],["deudas","▣","Deudas y Pagos"],["nueva","＋","Registrar nueva deuda"],["inversion","⌁","Aportes e Inversiones"],["historial","◷","Historial"],["config","⚙","Configuración"]];
 return <div className="appShell">
  <aside>
   <div className="brand"><div className="brandIcon">🤝</div><div><b>Sociedad <i>50/50</i></b><small>Control de Deudas y Aportes</small></div></div>
   <div className="navList">{nav.map(n=><button key={n[0]} className={tab===n[0]?"navActive":""} onClick={()=>setTab(n[0])}><span>{n[1]}</span>{n[2]}{n[0]==="nueva"&&<em>Nuevo</em>}</button>)}</div>
   <div className="sideQuote"><div>▲</div><p>Grandes metas<br/>se logran con<br/>buenas decisiones</p></div>
  </aside>

  <div className="mainArea">
   <header>
    <div className="mobileBrand">Sociedad <i>50/50</i></div>
    <div className="quote">“Juntos es más fácil,<br/>juntos es mejor”</div>
    <div className="date">▣ {new Date().toLocaleDateString("es-ES",{day:"2-digit",month:"long",year:"numeric"})}</div>
    <div className="topPartners"><div className="topPerson blue"><span>●</span><b>Víctor<small>{pct(victor)}</small></b></div><div className="topPerson purple"><span>●</span><b>Carlos<small>{pct(carlos)}</small></b></div></div>
   </header>

   {loading?<div className="loading">Cargando datos...</div>:<>
   {tab==="inicio"&&<Dashboard rows={rows} originalTotal={originalTotal} totalPaid={totalPaid} totalPending={totalPending} investmentTotal={investmentTotal} debtProgress={debtProgress} victor={victor} carlos={carlos} participationProgress={participationProgress} carlosContribution={carlosContribution} payments={payments} debts={debts} setTab={setTab}/>}
   {tab==="deudas"&&<section className="contentPage"><h1>Deudas y Pagos</h1><div className="formCard"><h2>Registrar pago</h2><form className="form" onSubmit={add}><label>Fecha<input type="date" value={form.payment_date} onChange={e=>setForm({...form,payment_date:e.target.value})}/></label><label>Deuda<select value={form.debt_id} onChange={e=>setForm({...form,debt_id:e.target.value})}>{rows.map(d=><option value={d.id} key={d.id}>{d.name} — {money(d.current)}</option>)}</select></label><label>Monto<input type="number" step=".01" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/></label><label>Nota<input value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/></label><button className="primary">Registrar pago</button></form></div><PaymentHistory payments={payments} debts={debts} del={del}/></section>}
   {tab==="nueva"&&<section className="contentPage"><h1>Registrar nueva deuda</h1><div className="formCard"><form className="form debtForm" onSubmit={addDebt}><label>Descripción<input value={debtForm.name} onChange={e=>setDebtForm({...debtForm,name:e.target.value})} placeholder="Ej. Nueva máquina"/></label><label>Total US$<input type="number" min=".01" step=".01" value={debtForm.original_amount} onChange={e=>setDebtForm({...debtForm,original_amount:e.target.value})}/></label><label>Pagado previamente<input type="number" min="0" step=".01" value={debtForm.prior_paid} onChange={e=>setDebtForm({...debtForm,prior_paid:e.target.value})}/></label><label className="toggleLabel"><input type="checkbox" checked={debtForm.affects_participation} onChange={e=>setDebtForm({...debtForm,affects_participation:e.target.checked})}/> Afecta porcentaje de participación</label><button className="primary greenBtn">＋ Registrar nueva deuda</button></form></div></section>}
   {tab==="inversion"&&<section className="contentPage"><h1>Aportes e Inversiones</h1><div className="dataTable"><table><thead><tr><th>Concepto</th><th>Valor</th><th>Nota</th></tr></thead><tbody>{investments.map(i=><tr key={i.id}><td>{i.concept}</td><td>{money(i.amount_usd)}</td><td>{i.notes||"—"}</td></tr>)}</tbody></table></div></section>}
   {tab==="historial"&&<section className="contentPage"><h1>Historial</h1><PaymentHistory payments={payments} debts={debts} del={del}/></section>}
   {tab==="config"&&<section className="contentPage"><h1>Configuración</h1><div className="formCard"><h2>Regla actual de participación</h2><p>Carlos comienza en 20% y avanza hasta 40% con su parte de los pagos especiales. Víctor baja de 80% a 60%. Después se contempla la cesión final de 10 puntos para quedar 50/50.</p></div></section>}
   </>}
  </div>
 </div>
}

function Dashboard({rows,originalTotal,totalPaid,totalPending,investmentTotal,debtProgress,victor,carlos,participationProgress,carlosContribution,payments,debts,setTab}){
 const recent=payments.slice(0,4);
 return <main className="dashboard">
  <div className="stats">
   <Stat icon="▣" title="Total de Deudas" value={money(originalTotal)} sub={`${rows.length} deudas activas`} cls="sBlue"/>
   <Stat icon="◆" title="Ya Pagado" value={money(totalPaid)} sub={`${pct(debtProgress)} del total`} cls="sGreen" progress={debtProgress}/>
   <Stat icon="▰" title="Por Pagar" value={money(totalPending)} sub={`${pct(100-debtProgress)} del total`} cls="sOrange" progress={100-debtProgress}/>
   <Stat icon="⌁" title="Total de Inversiones" value={money(investmentTotal)} sub={`${rows.length?"Inversiones registradas":"Sin inversiones"}`} cls="sPurple"/>
  </div>

  <div className="middle">
   <div className="panel participationPanel"><div className="panelTitle"><span>👥</span><div><h2>Porcentaje de participación</h2><p>Así avanza la participación entre ambos.</p></div></div>
    <div className="participationBody">
     <PersonCard name="Víctor" percent={victor} cls="blue"/>
     <Donut victor={victor} carlos={carlos} center={`${pct(carlosContribution?participationProgress:0)} avance`}/>
     <PersonCard name="Carlos" percent={carlos} cls="purple"/>
    </div>
   </div>

   <div className="panel debtGauge"><div className="panelTitle"><span>🎯</span><div><h2>Progreso de las deudas</h2><p>¿Cuánto falta para terminar?</p></div></div>
    <div className="gaugeBody"><div className="gauge" style={{"--p":`${debtProgress*3.6}deg`}}><div><b>{pct(debtProgress)}</b><small>Pagado</small></div></div>
     <div className="legend"><p><i className="greenDot"/>Pagado <b>{money(totalPaid)}</b><strong>{pct(debtProgress)}</strong></p><p><i className="orangeDot"/>Por pagar <b>{money(totalPending)}</b><strong>{pct(100-debtProgress)}</strong></p></div>
    </div>
    <div className="longProgress"><i style={{width:`${debtProgress}%`}}/></div><div className="motivation">🎯 <b>¡Cada pago cuenta!</b><small>Vas muy bien, sigue así.</small></div>
   </div>

   <div className="actions">
    <button className="action greenAction" onClick={()=>setTab("nueva")}><span>＋</span><b>Registrar nueva deuda<small>Agrega una deuda al sistema</small></b><i>›</i></button>
    <button className="action blueAction" onClick={()=>setTab("deudas")}><span>▣</span><b>Registrar pago<small>Realiza un pago de una deuda</small></b><i>›</i></button>
    <button className="action purpleAction" onClick={()=>setTab("inversion")}><span>⌁</span><b>Agregar inversión<small>Consulta tus inversiones</small></b><i>›</i></button>
    <div className="recent"><h3>◷ Últimos movimientos <button onClick={()=>setTab("historial")}>Ver todos</button></h3>{recent.length?recent.map(p=>{const d=debts.find(x=>x.id===p.debt_id);return <div className="movement" key={p.id}><span>▣</span><div><b>Pago - {d?.name||"Deuda"}</b><small>{p.payment_date}</small></div><strong>{money(p.amount)}</strong></div>}):<p className="empty">Aún no hay movimientos.</p>}</div>
   </div>
  </div>

  <div className="panel debtsList"><div className="panelTitle"><span>▣</span><div><h2>Lista de Deudas</h2></div></div><div className="dataTable"><table><thead><tr><th>Descripción</th><th>Total</th><th>Pagado</th><th>Restante</th><th>% Pagado</th><th>Afecta %</th></tr></thead><tbody>{rows.map(d=>{const paid=Number(d.original_amount)-d.current, pr=Number(d.original_amount)?paid/Number(d.original_amount)*100:0;return <tr key={d.id}><td><span className="debtIcon">▣</span><b>{d.name}</b></td><td>{money(d.original_amount)}</td><td>{money(paid)}</td><td>{money(d.current)}</td><td><div className="rowProgress"><i style={{width:`${pr}%`}}/></div>{pct(pr)}</td><td><span className={d.affects_participation?"switch yes":"switch"}>{d.affects_participation?"Sí":"No"}</span></td></tr>})}</tbody></table></div></div>
 </main>
}
function Stat({icon,title,value,sub,cls,progress}){return <div className={`stat ${cls}`}><span className="statIcon">{icon}</span><div><small>{title}</small><strong>{value}</strong>{progress!==undefined&&<div className="statProgress"><i style={{width:`${progress}%`}}/></div>}<p>{sub}</p></div></div>}
function PersonCard({name,percent,cls}){return <div className={`personCard ${cls}`}><span>●</span><b>{name}</b><strong>{pct(percent)}</strong></div>}
function Donut({victor,carlos,center}){return <div className="donut" style={{background:`conic-gradient(#a934ff 0 ${carlos}%,#1494ff ${carlos}% 100%)`}}><div><small>Participación</small><b>{pct(victor)} / {pct(carlos)}</b><em>{center}</em></div></div>}
function PaymentHistory({payments,debts,del}){return <div className="dataTable historyTable"><table><thead><tr><th>Fecha</th><th>Deuda</th><th>Pago</th><th>Víctor</th><th>Carlos</th><th>Nota</th><th></th></tr></thead><tbody>{payments.map(p=>{let d=debts.find(x=>x.id===p.debt_id);return <tr key={p.id}><td>{p.payment_date}</td><td>{d?.name}</td><td>{money(p.amount)}</td><td>{d?.affects_participation?money(p.amount/2):"—"}</td><td>{d?.affects_participation?money(p.amount/2):"—"}</td><td>{p.note||"—"}</td><td><button className="trash" onClick={()=>del(p.id)}>🗑</button></td></tr>})}</tbody></table></div>}
