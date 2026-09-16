 "use client";
import {useEffect,useMemo,useState} from "react";

const initialDebts=[
 {id:"bordado",name:"Máquina de bordado",original:12500,prior:1600,balance:10900,special:false},
 {id:"dtf",name:"Máquina DTF",original:5400,prior:0,balance:5400,special:false},
 {id:"liquidacion",name:"Liquidación socios anteriores",original:4700,prior:0,balance:4700,special:true},
 {id:"victor",name:"Deuda con Víctor",original:2500,prior:0,balance:2500,special:true},
];
const initialAssets=[
 ["Activos fijos originales",14521.06],["Base inicial (efectivo)",1000],
 ["Ecosolvente",3800],["Máquina de ojete",100],["Convertidor 220",245],
 ["Máquina de broche",100],["Pistola de calor",50],["Pago previo bordado",1600]
];
const money=n=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(n||0);
const pct=n=>`${Number(n).toFixed(2)}%`;

export default function Home(){
 const [tab,setTab]=useState("resumen");
 const [payments,setPayments]=useState([]);
 const [form,setForm]=useState({date:new Date().toISOString().slice(0,10),debt:"bordado",amount:"",note:""});
 useEffect(()=>{try{setPayments(JSON.parse(localStorage.getItem("sociedad-payments")||"[]"))}catch{}},[]);
 const save=x=>{setPayments(x);localStorage.setItem("sociedad-payments",JSON.stringify(x))};
 const paidByDebt=id=>payments.filter(p=>p.debt===id).reduce((a,p)=>a+Number(p.amount),0);
 const debts=initialDebts.map(d=>({...d,current:Math.max(0,d.balance-paidByDebt(d.id))}));
 const totalDebt=debts.reduce((a,d)=>a+d.current,0);
 const specialTotalPaid=payments.filter(p=>["liquidacion","victor"].includes(p.debt)).reduce((a,p)=>a+Number(p.amount),0);
 const carlosPaid=Math.min(3600,specialTotalPaid/2);
 const earned=(carlosPaid/3600)*20;
 const carlos=Math.min(40,20+earned), victor=100-carlos;
 const addPayment=e=>{
   e.preventDefault(); const amt=Number(form.amount); const d=debts.find(x=>x.id===form.debt);
   if(!amt||amt<=0)return alert("Ingresa un pago válido.");
   if(amt>d.current)return alert("El pago no puede ser mayor que el saldo pendiente.");
   save([{id:Date.now(),...form,amount:amt},...payments]); setForm({...form,amount:"",note:""});
 };
 const remove=id=>save(payments.filter(p=>p.id!==id));
 return <main>
  <header><div><h1>Sociedad 50/50</h1><p>Control financiero · Víctor & Carlos</p></div><div className="badge">Participación contractual de ganancias: 50% / 50%</div></header>
  <nav>{[["resumen","Resumen"],["deudas","Deudas y pagos"],["participacion","Participación"],["inversion","Inversión"]].map(([k,n])=><button className={tab===k?"active":""} onClick={()=>setTab(k)} key={k}>{n}</button>)}</nav>

  {tab==="resumen"&&<section>
   <div className="cards">
    <Card title="Deuda pendiente" value={money(totalDebt)} sub="Todas las obligaciones actuales"/>
    <Card title="Víctor · participación económica" value={pct(victor)} sub="Baja dinámicamente hasta 60%"/>
    <Card title="Carlos · participación económica" value={pct(carlos)} sub="Sube dinámicamente de 20% a 40%"/>
    <Card title="Aporte Carlos reconocido" value={money(carlosPaid)} sub={`Meta: ${money(3600)}`}/>
   </div>
   <h2>Estado de deudas</h2><DebtTable debts={debts} paidByDebt={paidByDebt}/>
   <div className="notice"><b>Acuerdo operativo:</b> desde ahora las ganancias se distribuyen 50% Víctor / 50% Carlos. Para el avance patrimonial de Carlos solo cuentan los pagos aplicados a <b>Liquidación socios anteriores</b> y <b>Deuda con Víctor</b>. Cada pago de esas dos deudas se reconoce 50% a Víctor y 50% a Carlos.</div>
  </section>}

  {tab==="deudas"&&<section><h2>Registrar pago normal</h2>
   <form onSubmit={addPayment} className="form">
    <label>Fecha<input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></label>
    <label>Deuda<select value={form.debt} onChange={e=>setForm({...form,debt:e.target.value})}>{debts.map(d=><option key={d.id} value={d.id}>{d.name} — {money(d.current)}</option>)}</select></label>
    <label>Monto US$<input type="number" min="0.01" step="0.01" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/></label>
    <label>Nota<input value={form.note} onChange={e=>setForm({...form,note:e.target.value})} placeholder="Opcional"/></label>
    <button className="primary">Registrar pago</button>
   </form>
   <h2>Historial</h2><div className="table"><table><thead><tr><th>Fecha</th><th>Deuda</th><th>Pago</th><th>Víctor</th><th>Carlos</th><th>Nota</th><th></th></tr></thead><tbody>
   {payments.length?payments.map(p=>{let d=initialDebts.find(x=>x.id===p.debt);return <tr key={p.id}><td>{p.date}</td><td>{d?.name}</td><td>{money(p.amount)}</td><td>{d?.special?money(p.amount/2):"—"}</td><td>{d?.special?money(p.amount/2):"—"}</td><td>{p.note||"—"}</td><td><button className="delete" onClick={()=>remove(p.id)}>Eliminar</button></td></tr>}):<tr><td colSpan="7">Todavía no hay pagos registrados.</td></tr>}
   </tbody></table></div>
  </section>}

  {tab==="participacion"&&<section>
   <h2>Avance dinámico de participación</h2>
   <div className="split"><div className="partner"><span>Víctor</span><strong>{pct(victor)}</strong><small>Inicio 80% · objetivo 60%</small></div><div className="partner"><span>Carlos</span><strong>{pct(carlos)}</strong><small>Inicio 20% · objetivo 40%</small></div></div>
   <div className="progress"><div style={{width:`${(carlosPaid/3600)*100}%`}}></div></div><p>{money(carlosPaid)} de {money(3600)} aportados por Carlos para adquirir sus 20 puntos adicionales.</p>
   <div className="notice"><b>Fórmula:</b> Carlos = 20% + (aporte acumulado de Carlos ÷ $3,600 × 20 puntos), con máximo de 40%. Víctor = 100% − participación de Carlos. Al completar Carlos los $3,600: Víctor 60% / Carlos 40%. La cesión posterior de 10 puntos de Víctor se mostrará como el paso final a 50/50.</div>
   <h2>Pagos que afectan participación</h2><div className="table"><table><thead><tr><th>Fecha</th><th>Deuda</th><th>Pago total</th><th>Víctor 50%</th><th>Carlos 50%</th><th>Aumento Carlos</th></tr></thead><tbody>
   {payments.filter(p=>["liquidacion","victor"].includes(p.debt)).map(p=><tr key={p.id}><td>{p.date}</td><td>{initialDebts.find(d=>d.id===p.debt)?.name}</td><td>{money(p.amount)}</td><td>{money(p.amount/2)}</td><td>{money(p.amount/2)}</td><td>{pct((p.amount/2/3600)*20)}</td></tr>)}
   {!payments.some(p=>["liquidacion","victor"].includes(p.debt))&&<tr><td colSpan="6">Aún no hay pagos aplicables.</td></tr>}</tbody></table></div>
  </section>}

  {tab==="inversion"&&<section><h2>Base e inversión registrada</h2><div className="table"><table><thead><tr><th>Concepto</th><th>Valor US$</th></tr></thead><tbody>{initialAssets.map(([n,v])=><tr key={n}><td>{n}</td><td>{money(v)}</td></tr>)}</tbody></table></div>
  <div className="notice">Los US$1,600 de “Pago previo bordado” forman parte del costo total de US$12,500 de la bordadora; no se vuelven a sumar como una máquina distinta al calcular su deuda.</div></section>}
 </main>
}
function Card({title,value,sub}){return <div className="card"><span>{title}</span><strong>{value}</strong><small>{sub}</small></div>}
function DebtTable({debts,paidByDebt}){return <div className="table"><table><thead><tr><th>Deuda</th><th>Valor original</th><th>Pagado antes</th><th>Pagos registrados</th><th>Saldo</th></tr></thead><tbody>{debts.map(d=><tr key={d.id}><td>{d.name}{d.special&&<em> Afecta %</em>}</td><td>{money(d.original)}</td><td>{money(d.prior)}</td><td>{money(paidByDebt(d.id))}</td><td><b>{money(d.current)}</b></td></tr>)}</tbody></table></div>}
