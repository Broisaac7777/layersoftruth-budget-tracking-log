import React, { useState } from "react";

const CATS = ["Maintenance","Repair","Utilities","Supplies","Security","Cleaning","Landscaping","Admin","Other"];
const METHODS = ["Cash","Transfer","Cheque","POS","Online"];
const STATUSES = ["Pending","Paid","Overdue","Cancelled"];
const PERIODS = ["All","January","February","March","April","May","June","July","August","September","October","November","December"];

const fmt = (n) => new Intl.NumberFormat("en-NG",{style:"currency",currency:"NGN",maximumFractionDigits:0}).format(n||0);

const badge = (s) => {
  const m = {Pending:{bg:"#fef3c7",c:"#92400e"},Paid:{bg:"#d1fae5",c:"#065f46"},Overdue:{bg:"#fee2e2",c:"#991b1b"},Cancelled:{bg:"#f3f4f6",c:"#6b7280"}};
  const v = m[s]||{bg:"#e5e7eb",c:"#374151"};
  return <span style={{background:v.bg,color:v.c,padding:"2px 9px",borderRadius:10,fontSize:11,fontWeight:600,display:"inline-block"}}>{s}</span>;
};

const Cell = ({val,onChange,type="text",opts}) => {
  const s={width:"100%",border:"none",background:"transparent",fontSize:12,padding:"2px 0",outline:"none",fontFamily:"inherit",color:"inherit"};
  if(opts) return <select value={val} onChange={e=>onChange(e.target.value)} style={{...s,cursor:"pointer"}}>{opts.map(o=><option key={o}>{o}</option>)}</select>;
  return <input type={type} value={val} onChange={e=>onChange(e.target.value)} style={s}/>;
};

const StatCard = ({label,value,accent,sub}) => (
  <div style={{flex:1,minWidth:120,background:"#fff",border:"1px solid #e5e7eb",borderLeft:`4px solid ${accent}`,borderRadius:8,padding:"11px 14px"}}>
    <div style={{fontSize:18,fontWeight:700,color:"#1f2937"}}>{value}</div>
    <div style={{fontSize:10,color:"#6b7280",marginTop:2,textTransform:"uppercase",letterSpacing:"0.06em"}}>{label}</div>
    {sub && <div style={{fontSize:10,color:accent,marginTop:3,fontWeight:600}}>{sub}</div>}
  </div>
);

const exportCSV = (rows,filename) => {
  const keys=["id","date","category","description","allocated","actual","variance","method","vendor","receipt","status","notes"];
  const lines=[keys.join(","),...rows.map(r=>keys.map(k=>`"${(r[k]||"").toString().replace(/"/g,'""')}"`).join(","))];
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([lines.join("\n")],{type:"text/csv"}));
  a.download=filename; a.click();
};

export default function App() {
  const [entries,setEntries] = useState([]);
  const [period,setPeriod] = useState("All");
  const [catFilter,setCatFilter] = useState("All");
  const [showReport,setShowReport] = useState(false);

  const upd = (i,k,v) => {
    const d=[...entries];
    const row={...d[i],[k]:v};
    row.variance=((parseFloat(row.allocated)||0)-(parseFloat(row.actual)||0)).toFixed(0);
    d[i]=row;
    setEntries(d);
  };

  const addRow = () => setEntries([...entries,{
    id:`BT-${String(entries.length+1).padStart(3,"0")}`,
    date:new Date().toISOString().slice(0,10),
    category:"Maintenance",description:"",
    allocated:"",actual:"",variance:"",
    method:"Transfer",vendor:"",receipt:"",
    status:"Pending",notes:""
  }]);

  const delRow = (i) => setEntries(entries.filter((_,j)=>j!==i));

  const filtered = entries.filter(r => {
    const monthMatch = period==="All" || (r.date && new Date(r.date).toLocaleString("en",{month:"long"})===period);
    const catMatch = catFilter==="All" || r.category===catFilter;
    return monthMatch && catMatch;
  });

  const totalAlloc  = filtered.reduce((s,r)=>s+(parseFloat(r.allocated)||0),0);
  const totalActual = filtered.reduce((s,r)=>s+(parseFloat(r.actual)||0),0);
  const variance    = totalAlloc - totalActual;
  const paidCount   = filtered.filter(r=>r.status==="Paid").length;
  const overdueCount= filtered.filter(r=>r.status==="Overdue").length;

  const catTotals = CATS.map(c=>({
    cat:c,
    alloc:filtered.filter(r=>r.category===c).reduce((s,r)=>s+(parseFloat(r.allocated)||0),0),
    actual:filtered.filter(r=>r.category===c).reduce((s,r)=>s+(parseFloat(r.actual)||0),0),
  })).filter(x=>x.alloc||x.actual);

  const th={background:"#1a3a5c",color:"#fff",padding:"9px 10px",textAlign:"left",fontSize:11,fontWeight:600,whiteSpace:"nowrap"};
  const td={padding:"7px 10px",borderBottom:"1px solid #f3f4f6",fontSize:12,verticalAlign:"middle"};

  return (
    <div style={{fontFamily:"'Segoe UI',system-ui,sans-serif",background:"#f5f7fa",minHeight:"100vh"}}>
      {/* Header */}
      <div style={{background:"#1a3a5c",color:"#fff",padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:17,fontWeight:700}}>⛪ Layers of Truth Budget Tracking Log</div>
          <div style={{fontSize:11,opacity:0.65,marginTop:2}}>Income · Expenditure · Reporting</div>
        </div>
        <button onClick={()=>setShowReport(!showReport)} style={{background:"#c8a84b",color:"#fff",border:"none",borderRadius:6,padding:"7px 14px",fontSize:12,fontWeight:600,cursor:"pointer"}}>
          {showReport ? "◀ Back to Log" : "📊 View Report"}
        </button>
      </div>

      <div style={{padding:16}}>
        {/* Stats */}
        <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>
          <StatCard label="Total Allocated" value={fmt(totalAlloc)} accent="#3b82f6"/>
          <StatCard label="Total Spent"     value={fmt(totalActual)} accent="#1a3a5c"/>
          <StatCard label={variance>=0?"Under Budget":"Over Budget"} value={fmt(Math.abs(variance))} accent={variance>=0?"#16a34a":"#dc2626"} sub={variance>=0?"✓ Surplus":"⚠ Overspend"}/>
          <StatCard label="Paid Entries"    value={paidCount} accent="#16a34a"/>
          <StatCard label="Overdue"         value={overdueCount} accent="#dc2626"/>
        </div>

        {/* Filters */}
        <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
          <span style={{fontSize:12,color:"#6b7280",fontWeight:600}}>FILTER:</span>
          <select value={period} onChange={e=>setPeriod(e.target.value)} style={{fontSize:12,padding:"5px 10px",borderRadius:6,border:"1px solid #d1d5db",background:"#fff"}}>
            {PERIODS.map(p=><option key={p}>{p}</option>)}
          </select>
          <select value={catFilter} onChange={e=>setCatFilter(e.target.value)} style={{fontSize:12,padding:"5px 10px",borderRadius:6,border:"1px solid #d1d5db",background:"#fff"}}>
            {["All",...CATS].map(c=><option key={c}>{c}</option>)}
          </select>
          <span style={{fontSize:11,color:"#9ca3af",marginLeft:4}}>{filtered.length} of {entries.length} entries</span>
        </div>

        {!showReport ? (
          <>
            {/* Main Table */}
            <div style={{background:"#fff",borderRadius:8,border:"1px solid #e5e7eb",overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead>
                  <tr>{["Entry ID","Date","Category","Description","Allocated (₦)","Actual (₦)","Variance (₦)","Payment Method","Vendor / Payee","Receipt No.","Status","Notes",""].map(h=>(
                    <th key={h} style={th}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {filtered.length===0 ? (
                    <tr><td colSpan={13} style={{...td,textAlign:"center",color:"#9ca3af",padding:40,fontSize:13}}>
                      No entries yet — click <strong>"+ Add Entry"</strong> below to start tracking your budget.
                    </td></tr>
                  ) : filtered.map((r,i)=>{
                    const realIdx = entries.indexOf(r);
                    const v=(parseFloat(r.allocated)||0)-(parseFloat(r.actual)||0);
                    return (
                      <tr key={i} style={{background:i%2===0?"#fff":"#f9fafb"}}>
                        <td style={{...td,color:"#9ca3af",fontSize:11,fontWeight:600}}>{r.id}</td>
                        <td style={td}><Cell val={r.date} onChange={v=>upd(realIdx,"date",v)} type="date"/></td>
                        <td style={td}><Cell val={r.category} onChange={v=>upd(realIdx,"category",v)} opts={CATS}/></td>
                        <td style={{...td,minWidth:150}}><Cell val={r.description} onChange={v=>upd(realIdx,"description",v)}/></td>
                        <td style={td}><Cell val={r.allocated} onChange={v=>upd(realIdx,"allocated",v)} type="number"/></td>
                        <td style={td}><Cell val={r.actual} onChange={v=>upd(realIdx,"actual",v)} type="number"/></td>
                        <td style={{...td,fontWeight:700,color:v>=0?"#16a34a":"#dc2626",fontSize:12}}>{r.allocated||r.actual?fmt(v):""}</td>
                        <td style={td}><Cell val={r.method} onChange={v=>upd(realIdx,"method",v)} opts={METHODS}/></td>
                        <td style={td}><Cell val={r.vendor} onChange={v=>upd(realIdx,"vendor",v)}/></td>
                        <td style={td}><Cell val={r.receipt} onChange={v=>upd(realIdx,"receipt",v)}/></td>
                        <td style={td}>
                          <select value={r.status} onChange={e=>upd(realIdx,"status",e.target.value)} style={{border:"none",background:"transparent",fontSize:11,cursor:"pointer"}}>
                            {STATUSES.map(o=><option key={o}>{o}</option>)}
                          </select>
                          {badge(r.status)}
                        </td>
                        <td style={{...td,minWidth:120}}><Cell val={r.notes} onChange={v=>upd(realIdx,"notes",v)}/></td>
                        <td style={td}><button onClick={()=>delRow(realIdx)} style={{background:"none",border:"none",cursor:"pointer",color:"#dc2626",fontSize:14,padding:"0 4px"}}>✕</button></td>
                      </tr>
                    );
                  })}
                </tbody>
                {filtered.length>0 && (
                  <tfoot>
                    <tr style={{background:"#f0f4f8"}}>
                      <td colSpan={4} style={{...td,fontWeight:700,fontSize:12}}>TOTALS</td>
                      <td style={{...td,fontWeight:700}}>{fmt(totalAlloc)}</td>
                      <td style={{...td,fontWeight:700}}>{fmt(totalActual)}</td>
                      <td style={{...td,fontWeight:700,color:variance>=0?"#16a34a":"#dc2626"}}>{fmt(variance)}</td>
                      <td colSpan={6} style={td}></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
            <div style={{marginTop:10,display:"flex",gap:8,flexWrap:"wrap"}}>
              <button onClick={addRow} style={{background:"#c8a84b",color:"#fff",border:"none",borderRadius:6,padding:"7px 14px",fontSize:12,fontWeight:600,cursor:"pointer"}}>+ Add Entry</button>
              <button onClick={()=>exportCSV(filtered,`budget_log_${period.toLowerCase()}.csv`)} style={{background:"#1a3a5c",color:"#fff",border:"none",borderRadius:6,padding:"7px 14px",fontSize:12,fontWeight:600,cursor:"pointer"}}>⬇ Export CSV</button>
            </div>
          </>
        ) : (
          /* Report View */
          <div style={{background:"#fff",borderRadius:8,border:"1px solid #e5e7eb",padding:20}}>
            <div style={{fontSize:15,fontWeight:700,color:"#1a3a5c",marginBottom:4}}>Budget Summary Report</div>
            <div style={{fontSize:12,color:"#6b7280",marginBottom:18}}>Period: {period} &nbsp;|&nbsp; Category: {catFilter} &nbsp;|&nbsp; Generated: {new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"long",year:"numeric"})}</div>

            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:10,marginBottom:20}}>
              <StatCard label="Allocated"   value={fmt(totalAlloc)}  accent="#3b82f6"/>
              <StatCard label="Spent"       value={fmt(totalActual)} accent="#1a3a5c"/>
              <StatCard label={variance>=0?"Surplus":"Overspend"} value={fmt(Math.abs(variance))} accent={variance>=0?"#16a34a":"#dc2626"}/>
              <StatCard label="Utilisation" value={totalAlloc?`${Math.round((totalActual/totalAlloc)*100)}%`:"—"} accent="#c8a84b"/>
            </div>

            <div style={{fontSize:13,fontWeight:700,color:"#374151",marginBottom:8}}>Spending by Category</div>
            {catTotals.length===0
              ? <p style={{fontSize:12,color:"#9ca3af"}}>No data to display for the selected filters.</p>
              : <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                  <thead><tr>
                    <th style={{...th,borderRadius:"4px 0 0 0"}}>Category</th>
                    <th style={th}>Allocated (₦)</th>
                    <th style={th}>Actual (₦)</th>
                    <th style={th}>Variance (₦)</th>
                    <th style={{...th,borderRadius:"0 4px 0 0"}}>% Used</th>
                  </tr></thead>
                  <tbody>
                    {catTotals.map((x,i)=>{
                      const v=x.alloc-x.actual;
                      const pct=x.alloc?Math.round((x.actual/x.alloc)*100):0;
                      return (
                        <tr key={i} style={{background:i%2===0?"#fff":"#f9fafb"}}>
                          <td style={{...td,fontWeight:600}}>{x.cat}</td>
                          <td style={td}>{fmt(x.alloc)}</td>
                          <td style={td}>{fmt(x.actual)}</td>
                          <td style={{...td,fontWeight:600,color:v>=0?"#16a34a":"#dc2626"}}>{fmt(v)}</td>
                          <td style={td}>
                            <div style={{display:"flex",alignItems:"center",gap:8}}>
                              <div style={{flex:1,background:"#e5e7eb",borderRadius:4,height:6}}>
                                <div style={{width:`${Math.min(pct,100)}%`,background:pct>100?"#dc2626":"#1a3a5c",height:6,borderRadius:4}}/>
                              </div>
                              <span style={{minWidth:32,textAlign:"right",fontWeight:600,color:pct>100?"#dc2626":"#374151"}}>{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{background:"#f0f4f8"}}>
                      <td style={{...td,fontWeight:700}}>TOTAL</td>
                      <td style={{...td,fontWeight:700}}>{fmt(totalAlloc)}</td>
                      <td style={{...td,fontWeight:700}}>{fmt(totalActual)}</td>
                      <td style={{...td,fontWeight:700,color:variance>=0?"#16a34a":"#dc2626"}}>{fmt(variance)}</td>
                      <td style={td}></td>
                    </tr>
                  </tfoot>
                </table>
            }
          </div>
        )}
      </div>
    </div>
  );
}