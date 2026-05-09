import { useState, useReducer } from "react";

const DEPTS = [
  { id:"WM",  name:"Winepress Media",                    pin:"1001", color:"#7c3aed" },
  { id:"USH", name:"Ushering",                            pin:"1002", color:"#0369a1" },
  { id:"LPT", name:"Light & Power / Transport & Logistics",pin:"1003", color:"#b45309" },
  { id:"FU",  name:"Follow-Up",                           pin:"1004", color:"#0f766e" },
  { id:"TS",  name:"Taste and See",                       pin:"1005", color:"#be185d" },
  { id:"SE",  name:"Sweet and Eternal",                   pin:"1006", color:"#c2410c" },
  { id:"SC",  name:"Security and Compliance",             pin:"1007", color:"#1d4ed8" },
  { id:"WEL", name:"Welfare",                             pin:"1008", color:"#15803d" },
  { id:"CD",  name:"Children's Department",               pin:"1009", color:"#d97706" },
  { id:"PC",  name:"Pastoral Care",                       pin:"1010", color:"#6d28d9" },
];

const ADMIN_PIN = "0000";
const CATS = ["Maintenance","Repair","Utilities","Supplies","Security","Cleaning","Landscaping","Admin","Other"];
const METHODS = ["Cash","Transfer","Cheque","POS","Online"];
const STATUSES = ["Pending","Paid","Overdue","Cancelled"];
const PERIODS = ["All","January","February","March","April","May","June","July","August","September","October","November","December"];

const fmt = (n) => new Intl.NumberFormat("en-NG",{style:"currency",currency:"NGN",maximumFractionDigits:0}).format(n||0);

const badge = (s) => {
  const m={Pending:{bg:"#fef3c7",c:"#92400e"},Paid:{bg:"#d1fae5",c:"#065f46"},Overdue:{bg:"#fee2e2",c:"#991b1b"},Cancelled:{bg:"#f3f4f6",c:"#6b7280"}};
  const v=m[s]||{bg:"#e5e7eb",c:"#374151"};
  return <span style={{background:v.bg,color:v.c,padding:"2px 9px",borderRadius:10,fontSize:11,fontWeight:600,display:"inline-block"}}>{s}</span>;
};

const Cell = ({val,onChange,type="text",opts}) => {
  const s={width:"100%",border:"none",background:"transparent",fontSize:12,padding:"2px 0",outline:"none",fontFamily:"inherit",color:"inherit"};
  if(opts) return <select value={val} onChange={e=>onChange(e.target.value)} style={{...s,cursor:"pointer"}}>{opts.map(o=><option key={o}>{o}</option>)}</select>;
  return <input type={type} value={val} onChange={e=>onChange(e.target.value)} style={s}/>;
};

const StatCard = ({label,value,accent,sub}) => (
  <div style={{flex:1,minWidth:110,background:"#fff",border:"1px solid #e5e7eb",borderLeft:`4px solid ${accent}`,borderRadius:8,padding:"10px 14px"}}>
    <div style={{fontSize:17,fontWeight:700,color:"#1f2937"}}>{value}</div>
    <div style={{fontSize:10,color:"#6b7280",marginTop:2,textTransform:"uppercase",letterSpacing:"0.06em"}}>{label}</div>
    {sub&&<div style={{fontSize:10,color:accent,marginTop:3,fontWeight:600}}>{sub}</div>}
  </div>
);

const initDeptData = () => {
  const d={};
  DEPTS.forEach(dep=>{ d[dep.id]=[]; });
  return d;
};

function budgetReducer(state, action) {
  const {deptId,type,payload} = action;
  const rows = [...(state[deptId]||[])];
  if(type==="ADD") return {...state,[deptId]:[...rows,payload]};
  if(type==="UPDATE") { rows[payload.i]={...rows[payload.i],[payload.k]:payload.v}; const r=rows[payload.i]; r.variance=((parseFloat(r.allocated)||0)-(parseFloat(r.actual)||0)).toFixed(0); return {...state,[deptId]:rows}; }
  if(type==="DELETE") return {...state,[deptId]:rows.filter((_,j)=>j!==payload.i)};
  return state;
}

function BudgetTracker({dept, data, dispatch, accentColor}) {
  const [period,setPeriod]=useState("All");
  const [catFilter,setCatFilter]=useState("All");
  const [showReport,setShowReport]=useState(false);

  const entries = data[dept.id]||[];

  const filtered = entries.filter(r=>{
    const mok=period==="All"||(r.date&&new Date(r.date).toLocaleString("en",{month:"long"})===period);
    const cok=catFilter==="All"||r.category===catFilter;
    return mok&&cok;
  });

  const totalAlloc=filtered.reduce((s,r)=>s+(parseFloat(r.allocated)||0),0);
  const totalActual=filtered.reduce((s,r)=>s+(parseFloat(r.actual)||0),0);
  const variance=totalAlloc-totalActual;
  const paidCount=filtered.filter(r=>r.status==="Paid").length;
  const overdueCount=filtered.filter(r=>r.status==="Overdue").length;

  const catTotals=CATS.map(c=>({cat:c,alloc:filtered.filter(r=>r.category===c).reduce((s,r)=>s+(parseFloat(r.allocated)||0),0),actual:filtered.filter(r=>r.category===c).reduce((s,r)=>s+(parseFloat(r.actual)||0),0)})).filter(x=>x.alloc||x.actual);

  const addRow=()=>dispatch({deptId:dept.id,type:"ADD",payload:{
    id:`BT-${String(entries.length+1).padStart(3,"0")}`,
    date:new Date().toISOString().slice(0,10),
    category:"Maintenance",description:"",allocated:"",actual:"",variance:"",
    method:"Transfer",vendor:"",receipt:"",status:"Pending",notes:""
  }});

  const upd=(i,k,v)=>dispatch({deptId:dept.id,type:"UPDATE",payload:{i,k,v}});
  const del=(i)=>dispatch({deptId:dept.id,type:"DELETE",payload:{i}});

  const exportCSV=()=>{
    const keys=["id","date","category","description","allocated","actual","variance","method","vendor","receipt","status","notes"];
    const lines=[keys.join(","),...filtered.map(r=>keys.map(k=>`"${(r[k]||"").toString().replace(/"/g,'""')}"`).join(","))];
    const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([lines.join("\n")],{type:"text/csv"})); a.download=`${dept.id}_budget.csv`; a.click();
  };

  const th={background:accentColor,color:"#fff",padding:"9px 10px",textAlign:"left",fontSize:11,fontWeight:600,whiteSpace:"nowrap"};
  const td={padding:"7px 10px",borderBottom:"1px solid #f3f4f6",fontSize:12,verticalAlign:"middle"};

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
        <div style={{fontSize:14,fontWeight:700,color:accentColor}}>{dept.name} — Budget Tracking Log</div>
        <button onClick={()=>setShowReport(!showReport)} style={{background:accentColor,color:"#fff",border:"none",borderRadius:6,padding:"6px 14px",fontSize:12,fontWeight:600,cursor:"pointer"}}>
          {showReport?"◀ Back to Log":"📊 View Report"}
        </button>
      </div>

      <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>
        <StatCard label="Allocated"   value={fmt(totalAlloc)}  accent={accentColor}/>
        <StatCard label="Spent"       value={fmt(totalActual)} accent="#1a3a5c"/>
        <StatCard label={variance>=0?"Surplus":"Overspend"} value={fmt(Math.abs(variance))} accent={variance>=0?"#16a34a":"#dc2626"} sub={variance>=0?"✓ Surplus":"⚠ Overspend"}/>
        <StatCard label="Paid"        value={paidCount}  accent="#16a34a"/>
        <StatCard label="Overdue"     value={overdueCount} accent="#dc2626"/>
      </div>

      <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:12,color:"#6b7280",fontWeight:600}}>FILTER:</span>
        <select value={period} onChange={e=>setPeriod(e.target.value)} style={{fontSize:12,padding:"5px 10px",borderRadius:6,border:"1px solid #d1d5db",background:"#fff"}}>
          {PERIODS.map(p=><option key={p}>{p}</option>)}
        </select>
        <select value={catFilter} onChange={e=>setCatFilter(e.target.value)} style={{fontSize:12,padding:"5px 10px",borderRadius:6,border:"1px solid #d1d5db",background:"#fff"}}>
          {["All",...CATS].map(c=><option key={c}>{c}</option>)}
        </select>
        <span style={{fontSize:11,color:"#9ca3af"}}>{filtered.length} of {entries.length} entries</span>
      </div>

      {!showReport ? (
        <>
          <div style={{background:"#fff",borderRadius:8,border:"1px solid #e5e7eb",overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr>{["Entry ID","Date","Category","Description","Allocated (₦)","Actual (₦)","Variance (₦)","Method","Vendor / Payee","Receipt No.","Status","Notes",""].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {filtered.length===0
                  ? <tr><td colSpan={13} style={{...td,textAlign:"center",color:"#9ca3af",padding:36,fontSize:13}}>No entries yet — click <strong>"+ Add Entry"</strong> to start.</td></tr>
                  : filtered.map((r,fi)=>{
                    const ri=entries.indexOf(r);
                    const v=(parseFloat(r.allocated)||0)-(parseFloat(r.actual)||0);
                    return (
                      <tr key={fi} style={{background:fi%2===0?"#fff":"#f9fafb"}}>
                        <td style={{...td,color:"#9ca3af",fontSize:11,fontWeight:600}}>{r.id}</td>
                        <td style={td}><Cell val={r.date} onChange={v=>upd(ri,"date",v)} type="date"/></td>
                        <td style={td}><Cell val={r.category} onChange={v=>upd(ri,"category",v)} opts={CATS}/></td>
                        <td style={{...td,minWidth:140}}><Cell val={r.description} onChange={v=>upd(ri,"description",v)}/></td>
                        <td style={td}><Cell val={r.allocated} onChange={v=>upd(ri,"allocated",v)} type="number"/></td>
                        <td style={td}><Cell val={r.actual} onChange={v=>upd(ri,"actual",v)} type="number"/></td>
                        <td style={{...td,fontWeight:700,color:v>=0?"#16a34a":"#dc2626"}}>{r.allocated||r.actual?fmt(v):""}</td>
                        <td style={td}><Cell val={r.method} onChange={v=>upd(ri,"method",v)} opts={METHODS}/></td>
                        <td style={td}><Cell val={r.vendor} onChange={v=>upd(ri,"vendor",v)}/></td>
                        <td style={td}><Cell val={r.receipt} onChange={v=>upd(ri,"receipt",v)}/></td>
                        <td style={td}>
                          <div style={{display:"flex",flexDirection:"column",gap:3}}>
                            <select value={r.status} onChange={e=>upd(ri,"status",e.target.value)} style={{border:"none",background:"transparent",fontSize:11,cursor:"pointer"}}>
                              {STATUSES.map(o=><option key={o}>{o}</option>)}
                            </select>
                            {badge(r.status)}
                          </div>
                        </td>
                        <td style={{...td,minWidth:110}}><Cell val={r.notes} onChange={v=>upd(ri,"notes",v)}/></td>
                        <td style={td}><button onClick={()=>del(ri)} style={{background:"none",border:"none",cursor:"pointer",color:"#dc2626",fontSize:14}}>✕</button></td>
                      </tr>
                    );
                  })
                }
              </tbody>
              {filtered.length>0&&(
                <tfoot><tr style={{background:"#f0f4f8"}}>
                  <td colSpan={4} style={{...td,fontWeight:700}}>TOTALS</td>
                  <td style={{...td,fontWeight:700}}>{fmt(totalAlloc)}</td>
                  <td style={{...td,fontWeight:700}}>{fmt(totalActual)}</td>
                  <td style={{...td,fontWeight:700,color:variance>=0?"#16a34a":"#dc2626"}}>{fmt(variance)}</td>
                  <td colSpan={6} style={td}></td>
                </tr></tfoot>
              )}
            </table>
          </div>
          <div style={{marginTop:10,display:"flex",gap:8}}>
            <button onClick={addRow} style={{background:accentColor,color:"#fff",border:"none",borderRadius:6,padding:"7px 14px",fontSize:12,fontWeight:600,cursor:"pointer"}}>+ Add Entry</button>
            <button onClick={exportCSV} style={{background:"#1a3a5c",color:"#fff",border:"none",borderRadius:6,padding:"7px 14px",fontSize:12,fontWeight:600,cursor:"pointer"}}>⬇ Export CSV</button>
          </div>
        </>
      ) : (
        <div style={{background:"#fff",borderRadius:8,border:"1px solid #e5e7eb",padding:20}}>
          <div style={{fontSize:14,fontWeight:700,color:accentColor,marginBottom:4}}>Budget Summary — {dept.name}</div>
          <div style={{fontSize:11,color:"#6b7280",marginBottom:16}}>Period: {period} | Category: {catFilter} | {new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"long",year:"numeric"})}</div>
          <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:16}}>
            <StatCard label="Allocated"   value={fmt(totalAlloc)}  accent={accentColor}/>
            <StatCard label="Spent"       value={fmt(totalActual)} accent="#1a3a5c"/>
            <StatCard label={variance>=0?"Surplus":"Overspend"} value={fmt(Math.abs(variance))} accent={variance>=0?"#16a34a":"#dc2626"}/>
            <StatCard label="Utilisation" value={totalAlloc?`${Math.round((totalActual/totalAlloc)*100)}%`:"—"} accent={accentColor}/>
          </div>
          {catTotals.length===0
            ? <p style={{fontSize:12,color:"#9ca3af"}}>No data for selected filters.</p>
            : <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead><tr>
                  {["Category","Allocated (₦)","Actual (₦)","Variance (₦)","% Used"].map(h=><th key={h} style={{...th,padding:"8px 10px"}}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {catTotals.map((x,i)=>{
                    const v=x.alloc-x.actual, pct=x.alloc?Math.round((x.actual/x.alloc)*100):0;
                    return <tr key={i} style={{background:i%2===0?"#fff":"#f9fafb"}}>
                      <td style={{...td,fontWeight:600}}>{x.cat}</td>
                      <td style={td}>{fmt(x.alloc)}</td>
                      <td style={td}>{fmt(x.actual)}</td>
                      <td style={{...td,fontWeight:600,color:v>=0?"#16a34a":"#dc2626"}}>{fmt(v)}</td>
                      <td style={td}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <div style={{flex:1,background:"#e5e7eb",borderRadius:4,height:6}}>
                            <div style={{width:`${Math.min(pct,100)}%`,background:pct>100?"#dc2626":accentColor,height:6,borderRadius:4}}/>
                          </div>
                          <span style={{minWidth:32,textAlign:"right",fontWeight:600,color:pct>100?"#dc2626":"#374151"}}>{pct}%</span>
                        </div>
                      </td>
                    </tr>;
                  })}
                </tbody>
              </table>
          }
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [screen,setScreen] = useState("home"); // home | dept-login | admin-login | dept | admin | pins
  const [selectedDept,setSelectedDept] = useState(null);
  const [pin,setPin] = useState("");
  const [pinError,setPinError] = useState("");
  const [adminTab,setAdminTab] = useState(DEPTS[0].id);
  const [data,dispatch] = useReducer(budgetReducer, null, initDeptData);
  const [showPins,setShowPins] = useState(false);

  const handleDeptLogin = () => {
    if(pin===selectedDept.pin){ setScreen("dept"); setPin(""); setPinError(""); }
    else { setPinError("Incorrect PIN. Try again."); setPin(""); }
  };

  const handleAdminLogin = () => {
    if(pin===ADMIN_PIN){ setScreen("admin"); setPin(""); setPinError(""); }
    else { setPinError("Incorrect admin PIN. Try again."); setPin(""); }
  };

  const goHome = () => { setScreen("home"); setSelectedDept(null); setPin(""); setPinError(""); setShowPins(false); };

  const hdr = (title,sub,accent="#1a3a5c") => (
    <div style={{background:accent,color:"#fff",padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div>
        <div style={{fontSize:16,fontWeight:700}}>⛪ Layers of Truth</div>
        <div style={{fontSize:11,opacity:0.7,marginTop:2}}>{title}{sub&&` — ${sub}`}</div>
      </div>
      <button onClick={goHome} style={{background:"rgba(255,255,255,0.2)",color:"#fff",border:"none",borderRadius:6,padding:"6px 12px",fontSize:11,cursor:"pointer"}}>🏠 Home</button>
    </div>
  );

  // HOME
  if(screen==="home") return (
    <div style={{
  fontFamily:"'Segoe UI',system-ui,sans-serif",
  background:"#f5f7fa",
  minHeight:"100vh",
  width:"100%",
  overflowX:"hidden"
}}>
      <div style={{background:"#1a3a5c",color:"#fff",padding:"20px",textAlign:"center"}}>
        <div style={{fontSize:22,fontWeight:800,letterSpacing:"-0.5px"}}>⛪ Layers of Truth</div>
        <div style={{fontSize:12,opacity:0.7,marginTop:4}}>Department Budget Tracking System</div>
      </div>
      <div style={{padding:20,maxWidth:560,margin:"0 auto"}}>
        <div style={{fontSize:13,fontWeight:700,color:"#6b7280",marginBottom:12,textTransform:"uppercase",letterSpacing:"0.06em"}}>Select Your Department</div>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20}}>
          {DEPTS.map(d=>(
            <button key={d.id} onClick={()=>{setSelectedDept(d);setScreen("dept-login");}}
              style={{background:"#fff",border:`2px solid #e5e7eb`,borderLeft:`5px solid ${d.color}`,borderRadius:8,padding:"12px 16px",textAlign:"left",cursor:"pointer",fontSize:13,fontWeight:600,color:"#1f2937",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              {d.name}
              <span style={{fontSize:11,color:"#9ca3af"}}>Enter PIN →</span>
            </button>
          ))}
        </div>
        <div style={{borderTop:"1px solid #e5e7eb",paddingTop:16,textAlign:"center"}}>
          <button onClick={()=>setScreen("admin-login")} style={{background:"#1a3a5c",color:"#fff",border:"none",borderRadius:8,padding:"10px 24px",fontSize:13,fontWeight:600,cursor:"pointer"}}>
            🔐 Admin Login (Facility Manager)
          </button>
        </div>
      </div>
    </div>
  );

  // DEPT LOGIN
  if(screen==="dept-login" && selectedDept) return (
    <div style={{fontFamily:"'Segoe UI',system-ui,sans-serif",background:"#f5f7fa",minHeight:"100vh"}}>
      {hdr("Department Access",selectedDept.name,selectedDept.color)}
      <div style={{display:"flex",justifyContent:"center",alignItems:"center",padding:40}}>
        <div style={{background:"#fff",borderRadius:12,padding:32,width:300,boxShadow:"0 4px 20px rgba(0,0,0,0.08)",textAlign:"center"}}>
          <div style={{width:56,height:56,borderRadius:"50%",background:selectedDept.color,color:"#fff",fontSize:22,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>🔒</div>
          <div style={{fontSize:15,fontWeight:700,color:"#1f2937",marginBottom:4}}>{selectedDept.name}</div>
          <div style={{fontSize:12,color:"#6b7280",marginBottom:20}}>Enter your department PIN to continue</div>
          <input type="password" value={pin} onChange={e=>setPin(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleDeptLogin()}
            placeholder="Enter PIN" maxLength={4}
            style={{width:"100%",border:`2px solid ${pinError?"#dc2626":"#e5e7eb"}`,borderRadius:8,padding:"10px 14px",fontSize:18,textAlign:"center",letterSpacing:8,outline:"none",boxSizing:"border-box",marginBottom:8}}/>
          {pinError && <div style={{fontSize:11,color:"#dc2626",marginBottom:8}}>{pinError}</div>}
          <button onClick={handleDeptLogin} style={{width:"100%",background:selectedDept.color,color:"#fff",border:"none",borderRadius:8,padding:"10px",fontSize:13,fontWeight:600,cursor:"pointer",marginTop:4}}>Unlock</button>
          <button onClick={goHome} style={{width:"100%",background:"none",border:"none",color:"#6b7280",fontSize:12,cursor:"pointer",marginTop:10}}>← Back</button>
        </div>
      </div>
    </div>
  );

  // ADMIN LOGIN
  if(screen==="admin-login") return (
    <div style={{fontFamily:"'Segoe UI',system-ui,sans-serif",background:"#f5f7fa",minHeight:"100vh"}}>
      {hdr("Admin Access","Facility Manager")}
      <div style={{display:"flex",justifyContent:"center",alignItems:"center",padding:40}}>
        <div style={{background:"#fff",borderRadius:12,padding:32,width:300,boxShadow:"0 4px 20px rgba(0,0,0,0.08)",textAlign:"center"}}>
          <div style={{width:56,height:56,borderRadius:"50%",background:"#1a3a5c",color:"#fff",fontSize:22,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>🛡️</div>
          <div style={{fontSize:15,fontWeight:700,color:"#1f2937",marginBottom:4}}>Admin Login</div>
          <div style={{fontSize:12,color:"#6b7280",marginBottom:20}}>Enter your master PIN to access all departments</div>
          <input type="password" value={pin} onChange={e=>setPin(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleAdminLogin()}
            placeholder="Master PIN" maxLength={4}
            style={{width:"100%",border:`2px solid ${pinError?"#dc2626":"#e5e7eb"}`,borderRadius:8,padding:"10px 14px",fontSize:18,textAlign:"center",letterSpacing:8,outline:"none",boxSizing:"border-box",marginBottom:8}}/>
          {pinError && <div style={{fontSize:11,color:"#dc2626",marginBottom:8}}>{pinError}</div>}
          <button onClick={handleAdminLogin} style={{width:"100%",background:"#1a3a5c",color:"#fff",border:"none",borderRadius:8,padding:"10px",fontSize:13,fontWeight:600,cursor:"pointer",marginTop:4}}>Login</button>
          <button onClick={goHome} style={{width:"100%",background:"none",border:"none",color:"#6b7280",fontSize:12,cursor:"pointer",marginTop:10}}>← Back</button>
        </div>
      </div>
    </div>
  );

  // DEPT VIEW
  if(screen==="dept" && selectedDept) return (
    <div style={{fontFamily:"'Segoe UI',system-ui,sans-serif",background:"#f5f7fa",minHeight:"100vh"}}>
      {hdr("Budget Tracking Log",selectedDept.name,selectedDept.color)}
      <div style={{padding:16}}>
        <BudgetTracker dept={selectedDept} data={data} dispatch={dispatch} accentColor={selectedDept.color}/>
      </div>
    </div>
  );

  // ADMIN VIEW
  if(screen==="admin") return (
    <div style={{fontFamily:"'Segoe UI',system-ui,sans-serif",background:"#f5f7fa",minHeight:"100vh"}}>
      {hdr("Admin Dashboard","All Departments")}
      <div style={{background:"#fff",borderBottom:"1px solid #e5e7eb",padding:"8px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:12,color:"#6b7280"}}>Viewing as: <strong style={{color:"#1a3a5c"}}>Facility Manager</strong></div>
        <button onClick={()=>setShowPins(!showPins)} style={{background:"#f3f4f6",border:"1px solid #e5e7eb",borderRadius:6,padding:"5px 12px",fontSize:11,cursor:"pointer",fontWeight:600}}>
          {showPins?"🙈 Hide PINs":"🔑 View Dept PINs"}
        </button>
      </div>

      {showPins && (
        <div style={{margin:"12px 16px",background:"#fff",border:"1px solid #fbbf24",borderRadius:8,padding:16}}>
          <div style={{fontSize:12,fontWeight:700,color:"#92400e",marginBottom:10}}>⚠️ Department PINs — Keep Confidential</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:8}}>
            {DEPTS.map(d=>(
              <div key={d.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#fffbeb",borderRadius:6,padding:"8px 12px",border:"1px solid #fde68a"}}>
                <span style={{fontSize:12,color:"#1f2937",fontWeight:600}}>{d.name}</span>
                <span style={{fontSize:14,fontWeight:800,color:d.color,letterSpacing:3}}>{d.pin}</span>
              </div>
            ))}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#eff6ff",borderRadius:6,padding:"8px 12px",border:"1px solid #bfdbfe"}}>
              <span style={{fontSize:12,color:"#1f2937",fontWeight:600}}>Admin (You)</span>
              <span style={{fontSize:14,fontWeight:800,color:"#1d4ed8",letterSpacing:3}}>{ADMIN_PIN}</span>
            </div>
          </div>
        </div>
      )}

      {/* Dept Tabs */}
      <div style={{display:"flex",overflowX:"auto",background:"#fff",borderBottom:"2px solid #e5e7eb",paddingLeft:8}}>
        {DEPTS.map(d=>(
          <div key={d.id} onClick={()=>setAdminTab(d.id)}
            style={{padding:"10px 14px",fontSize:12,fontWeight:adminTab===d.id?700:500,color:adminTab===d.id?d.color:"#6b7280",borderBottom:adminTab===d.id?`3px solid ${d.color}`:"3px solid transparent",cursor:"pointer",whiteSpace:"nowrap"}}>
            {d.name}
          </div>
        ))}
      </div>

      <div style={{padding:16}}>
        {DEPTS.filter(d=>d.id===adminTab).map(d=>(
          <BudgetTracker key={d.id} dept={d} data={data} dispatch={dispatch} accentColor={d.color}/>
        ))}
      </div>
    </div>
  );

  return null;
}