import { useState, useCallback, useRef, useEffect } from 'react'
import {
  Upload, FileText, Calculator, CheckCircle2, AlertCircle,
  ChevronDown, ChevronUp, Pencil, RefreshCw, TrendingDown,
  DollarSign, Hash, Percent, Sparkles, ArrowRight, BarChart3,
  LogOut, Lock, ShieldCheck, Search
} from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'https://statement-analyzer-ap.onrender.com'

const fmt  = (n, d=2) => n==null ? '—' : Number(n).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d})
const fmtC = n => n==null ? '—' : '$'+fmt(n)
const fmtP = n => n==null ? '—' : fmt(n,4)+'%'

const T = {
  navy:'#0a1628', navyMid:'#0f2044', navyLight:'#162d5a',
  teal:'#00c8b4', tealDim:'#00a896', blue:'#2563eb',
  white:'#ffffff', muted:'#94a3b8',
  border:'rgba(255,255,255,.1)', card:'rgba(255,255,255,.05)',
  success:'#10b981', danger:'#ef4444',
  grad:'linear-gradient(135deg,#00c8b4 0%,#2563eb 100%)',
}

// ── Design atoms ─────────────────────────────────────────────────────────────
function GlassCard({children,style,id}) {
  return (
    <div id={id} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:18,
      backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',padding:'1.75rem',...style}}>
      {children}
    </div>
  )
}

function TealBadge({children}) {
  return (
    <span style={{display:'inline-flex',alignItems:'center',gap:6,
      background:'rgba(0,200,180,.12)',border:'1px solid rgba(0,200,180,.3)',
      color:T.teal,borderRadius:100,padding:'4px 14px',
      fontSize:'.72rem',fontWeight:700,letterSpacing:'.08em',
      textTransform:'uppercase',fontFamily:'var(--font-head)'}}>
      {children}
    </span>
  )
}

function SectionLabel({icon:Icon,children}) {
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,marginBottom:'1.25rem'}}>
      <div style={{width:34,height:34,borderRadius:10,background:T.grad,
        display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
        <Icon size={16} color="#fff"/>
      </div>
      <span style={{fontFamily:'var(--font-head)',fontWeight:600,fontSize:'1rem',color:T.white}}>
        {children}
      </span>
    </div>
  )
}

function Field({label,value,onChange,type='text',step,suffix,prefix,hint}) {
  const [hover,setHover]=useState(false)
  return (
    <div style={{display:'flex',flexDirection:'column',gap:'.4rem'}}>
      <label style={{fontSize:'.72rem',fontWeight:700,color:T.muted,
        textTransform:'uppercase',letterSpacing:'.07em',fontFamily:'var(--font-head)'}}>
        {label}
      </label>
      <div onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
        style={{display:'flex',alignItems:'stretch',
          border:`1px solid ${hover?'rgba(0,200,180,.4)':T.border}`,
          borderRadius:10,overflow:'hidden',background:'rgba(255,255,255,.04)',transition:'border-color .2s'}}>
        {prefix&&<span style={{padding:'0 .75rem',color:T.teal,fontWeight:700,fontSize:'.95rem',
          borderRight:`1px solid ${T.border}`,background:'rgba(0,200,180,.08)',
          display:'flex',alignItems:'center'}}>{prefix}</span>}
        <input type={type} value={value} onChange={e=>onChange(e.target.value)} step={step}
          style={{flex:1,border:'none',background:'transparent',padding:'.6rem .85rem',
            fontSize:'.95rem',outline:'none',color:T.white,fontFamily:'var(--font-body)'}}/>
        {suffix&&<span style={{padding:'0 .75rem',color:T.muted,fontSize:'.85rem',
          borderLeft:`1px solid ${T.border}`,background:'rgba(255,255,255,.03)',
          display:'flex',alignItems:'center'}}>{suffix}</span>}
      </div>
      {hint&&<p style={{fontSize:'.72rem',color:T.muted,marginTop:'.1rem'}}>{hint}</p>}
    </div>
  )
}

// ── Login Page ─────────────────────────────────────────────────────────────
function LoginPage({error}) {
  const [hovered,setHovered]=useState(false)
  const errMsg = error==='unauthorized_domain'
    ? 'Only @adit.com email addresses are allowed. Please sign in with your Adit work account.'
    : error==='auth_failed'
    ? 'Authentication failed. Please try again.'
    : null

  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',
      alignItems:'center',justifyContent:'center',padding:'2rem',position:'relative'}}>

      <div style={{position:'fixed',inset:0,pointerEvents:'none',
        background:'radial-gradient(ellipse 60% 60% at 50% 40%,rgba(0,200,180,.1) 0%,transparent 70%)'}}/> 

      <div style={{width:'100%',maxWidth:420,position:'relative',zIndex:1}}>
        <div style={{
  display:'flex',
  flexDirection:'column',
  alignItems:'center',
  justifyContent:'center',
  marginBottom:'2.5rem',
  textAlign:'center'
}}>
  <img
    src="https://adit.com/storage/settings/logo.png"
    alt="Adit Logo"
    style={{height:50, marginBottom:'0.75rem'}}
    onError={(e)=>{e.target.style.display='none'}}
  />

  <div style={{display:'flex', justifyContent:'center'}}>
    <TealBadge>
      <ShieldCheck size={11}/> Internal Tool
    </TealBadge>
  </div>
</div>

        <div style={{background:'rgba(255,255,255,.05)',border:`1px solid ${T.border}`,
          borderRadius:20,backdropFilter:'blur(16px)',padding:'2.25rem 2rem'}}>
          <div style={{textAlign:'center',marginBottom:'1.75rem'}}>
            <div style={{width:52,height:52,borderRadius:14,background:T.grad,
              display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto .9rem'}}>
              <Lock size={22} color="#fff"/>
            </div>
            <h1 style={{fontFamily:'var(--font-head)',fontWeight:800,fontSize:'1.35rem',
              color:T.white,letterSpacing:'-.01em',marginBottom:'.45rem'}}>
              Sign in to continue
            </h1>
            <p style={{fontSize:'.85rem',color:T.muted,lineHeight:1.6}}>
              This tool is restricted to Adit team members.<br/>
              Sign in with your <span style={{color:T.teal,fontWeight:700}}>@adit.com</span> account.
            </p>
          </div>

          {errMsg&&(
            <div style={{marginBottom:'1.25rem',display:'flex',gap:'.6rem',alignItems:'flex-start',
              background:'rgba(239,68,68,.12)',border:'1px solid rgba(239,68,68,.25)',
              borderRadius:10,padding:'.75rem 1rem',fontSize:'.83rem',color:'#fca5a5'}}>
              <AlertCircle size={15} style={{flexShrink:0,marginTop:1}}/>
              {errMsg}
            </div>
          )}

          <a
  href={`${API}/auth/login`}
  onMouseEnter={()=>setHovered(true)}
  onMouseLeave={()=>setHovered(false)}
  style={{
    display:'flex',
    alignItems:'center',
    justifyContent:'center',
    gap:12,
    width:'100%',
    padding:'0.95rem',
    borderRadius:12,
    textDecoration:'none',
    border:'none',
    background:T.grad,
    transition:'all .25s',
    cursor:'pointer',
    boxShadow: hovered
      ? '0 6px 20px rgba(0,200,180,.4)'
      : '0 4px 14px rgba(0,200,180,.25)',
    transform: hovered ? 'translateY(-1px)' : 'translateY(0)'
  }}
>
  <a ...>
  
  <div style={{
  background:'#fff',
  borderRadius:'50%',
  padding:6, // 👈 updated
  display:'flex',
  alignItems:'center',
  justifyContent:'center',
  boxShadow:'0 2px 6px rgba(0,0,0,.2)' // 👈 added
}}>
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  </div>

  <span>Continue with Google</span>

</a>
        </div>
      </div>
    </div>
  )
}

// ── Upload Zone ─────────────────────────────────────────────────────────────
// Purely handles file selection — does NOT auto-trigger analysis.
// Calls onFileReady(file) so the parent can drive the Analyze button.
function UploadZone({onFileReady, pendingFile, loading}) {
  const [drag,setDrag]=useState(false)
  const ref=useRef()

  const handleSelect=(file)=>{
    if(!file)return
    onFileReady(file)
  }

  const ready = !!pendingFile && !loading

  return (
    <div
      onClick={()=>!loading&&ref.current.click()}
      onDragOver={e=>{e.preventDefault();if(!loading)setDrag(true)}}
      onDragLeave={()=>setDrag(false)}
      onDrop={e=>{e.preventDefault();setDrag(false);handleSelect(e.dataTransfer.files[0])}}
      style={{border:`2px dashed ${drag?T.teal:ready?'rgba(0,200,180,.5)':T.border}`,borderRadius:14,
        padding:'2.5rem 1.5rem',textAlign:'center',cursor:loading?'default':'pointer',
        background:drag?'rgba(0,200,180,.06)':ready?'rgba(0,200,180,.04)':'rgba(255,255,255,.02)',
        transition:'all .25s',position:'relative',overflow:'hidden'}}>
      {drag&&<div style={{position:'absolute',inset:0,pointerEvents:'none',
        background:'radial-gradient(ellipse 60% 60% at 50% 50%,rgba(0,200,180,.08),transparent)'}}/>}
      <div style={{width:52,height:52,borderRadius:16,margin:'0 auto .9rem',
        background:ready?T.grad:drag?T.grad:'rgba(255,255,255,.06)',
        border:`1px solid ${ready||drag?'transparent':T.border}`,
        display:'flex',alignItems:'center',justifyContent:'center',transition:'all .25s'}}>
        {loading
          ? <RefreshCw size={22} color="#fff" className="spin"/>
          : <Upload size={22} color={ready||drag?'#fff':T.teal}/>}
      </div>
      {loading ? (
        <><p style={{fontWeight:700,color:T.white,fontFamily:'var(--font-head)',fontSize:'1rem'}}>Reading with AI…</p>
        <p style={{fontSize:'.82rem',color:T.muted,marginTop:'.35rem'}}>This may take 15–30 seconds</p></>
      ) : ready ? (
        <><p style={{fontWeight:700,fontSize:'1rem',color:T.teal,fontFamily:'var(--font-head)'}}>{pendingFile.name}</p>
        <p style={{fontSize:'.82rem',color:T.muted,marginTop:'.35rem'}}>Ready — click "Analyze the Statement" below ↓</p></>
      ) : (
        <><p style={{fontWeight:700,fontSize:'1rem',color:T.white,fontFamily:'var(--font-head)'}}>Drop your processor statement here</p>
        <p style={{fontSize:'.82rem',color:T.muted,marginTop:'.4rem'}}>
          Supports any processor — PDF, PNG, JPG, TIFF · Click to browse</p></>
      )}
      <input ref={ref} type="file" accept=".pdf,.png,.jpg,.jpeg,.tiff,.bmp,.webp"
        style={{display:'none'}} onChange={e=>handleSelect(e.target.files[0])}/>
    </div>
  )
}

// ── Table helpers ─────────────────────────────────────────────────────────────
const ltbl = { width:'100%', borderCollapse:'collapse', fontSize:'.9rem', textAlign:'left', background:'rgba(255,255,255,.01)' }
const ThD = ({children}) => <th style={{padding:'1rem 1.5rem',color:'#94a3b8',fontWeight:800,fontSize:'.72rem',textTransform:'uppercase',borderBottom:'1px solid rgba(255,255,255,.1)',letterSpacing:'.05em'}}>{children}</th>
const TdD = ({children,bold,color}) => <td style={{padding:'1rem 1.5rem',color:color||'#ffffff',fontWeight:bold?800:500,fontFamily:'monospace',fontSize:'.9rem'}}>{children}</td>

// ── Analysis Dashboard (Step 3) ─────────────────────────────────────────────
function AnalysisDashboard({result}) {
  const pos = result.savings >= 0
  const isStrong = result.diff_pct > 5

  return (
    <div style={{background:'rgba(255,255,255,.04)',borderRadius:18,border:'1px solid rgba(255,255,255,.1)',backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',overflow:'hidden',color:'#ffffff',fontFamily:'var(--font-head)'}}>

      {/* Header */}
      <div style={{padding:'1.5rem 2rem',borderBottom:'1px solid rgba(255,255,255,.1)',display:'flex',justifyContent:'space-between',alignItems:'flex-start',background:'rgba(255,255,255,.02)'}}>
        <div>
          <h2 style={{fontSize:'1.4rem',fontWeight:900,textTransform:'uppercase',color:'#ffffff',letterSpacing:'.03em',marginBottom:'.2rem'}}>
            {result.existing_merchant || 'UNNAMED MERCHANT'}
          </h2>
          <p style={{fontSize:'.85rem',color:'#94a3b8',fontWeight:500}}>
            Statement Analysis • Adit Pay Comparison
          </p>
        </div>
        {isStrong && (
          <span style={{background:'rgba(16,185,129,.15)',border:'1px solid rgba(16,185,129,.35)',color:'#34d399',fontSize:'.7rem',fontWeight:800,padding:'6px 14px',borderRadius:100,textTransform:'uppercase',letterSpacing:'.06em',alignSelf:'center'}}>
            ● Strong Opportunity
          </span>
        )}
      </div>

      <div style={{padding:'2rem',display:'flex',flexDirection:'column',gap:'1.5rem'}}>

        {/* AI Summary */}
        <div style={{background:'rgba(0,200,180,.06)',border:'1px solid rgba(0,200,180,.2)',borderRadius:16,padding:'1.75rem'}}>
          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:'1rem'}}>
            <Sparkles size={13} color="#00c8b4"/>
            <span style={{fontSize:'.72rem',fontWeight:800,textTransform:'uppercase',letterSpacing:'.1em',color:'#00c8b4'}}>
              AI Summary
            </span>
          </div>
          <p style={{fontSize:'.95rem',lineHeight:1.7,color:'#ffffff',fontWeight:400,fontFamily:'var(--font-body)'}}>
            {result.ai_summary}
          </p>
        </div>

        {/* Fee Comparison Bars */}
        <div style={{display:'flex',gap:'1.25rem',flexWrap:'wrap'}}>
          <div style={{flex:1,minWidth:200,background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.1)',borderRadius:14,padding:'1.25rem'}}>
            <p style={{fontSize:'.7rem',fontWeight:800,textTransform:'uppercase',color:'#94a3b8',marginBottom:'.7rem',letterSpacing:'.05em'}}>Current Fees</p>
            <p style={{fontSize:'1.3rem',fontWeight:800,color:'#ffffff',marginBottom:'.6rem'}}>
              ${fmt(result.total_fees_paid)} <span style={{fontSize:'.78rem',color:'#94a3b8',fontWeight:600}}>({fmt(result.existing_avg_fee_pct)}%)</span>
            </p>
            <div style={{height:6,background:'rgba(255,255,255,.1)',borderRadius:3,overflow:'hidden'}}>
              <div style={{width:'100%',height:'100%',background:'#fbbf24',borderRadius:3}}/>
            </div>
          </div>
          <div style={{flex:1,minWidth:200,background:'rgba(0,200,180,.06)',border:'1px solid rgba(0,200,180,.22)',borderRadius:14,padding:'1.25rem'}}>
            <p style={{fontSize:'.7rem',fontWeight:800,textTransform:'uppercase',color:'#00c8b4',marginBottom:'.7rem',letterSpacing:'.05em'}}>Adit Pay Fees</p>
            <p style={{fontSize:'1.3rem',fontWeight:800,color:'#ffffff',marginBottom:'.6rem'}}>
              ${fmt(result.adit_total_fee)} <span style={{fontSize:'.78rem',color:'#94a3b8',fontWeight:600}}>({fmt(result.adit_avg_fee_pct)}%)</span>
            </p>
            <div style={{height:6,background:'rgba(255,255,255,.1)',borderRadius:3,overflow:'hidden'}}>
              <div style={{width:`${Math.max(10, 100 - result.diff_pct)}%`,height:'100%',background:'#00c8b4',borderRadius:3}}/>
            </div>
          </div>
        </div>

        {/* Savings Projections */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1rem'}}>
          {[['1 Yr Savings', result.savings_1_yr],['3 Yr Savings', result.savings_3_yr],['5 Yr Savings', result.savings_5_yr]].map(([label,val])=>(
            <div key={label} style={{background:'rgba(16,185,129,.08)',border:'1px solid rgba(16,185,129,.22)',borderRadius:12,padding:'1.1rem',textAlign:'center'}}>
              <p style={{fontSize:'1.25rem',fontWeight:800,color:'#34d399'}}>${fmt(val, 0)}</p>
              <p style={{fontSize:'.7rem',fontWeight:800,textTransform:'uppercase',color:'#94a3b8',letterSpacing:'.05em',marginTop:'.25rem'}}>{label}</p>
            </div>
          ))}
        </div>

        {/* Stats Bar */}
        <div style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.1)',borderRadius:14,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'1.25rem 2rem',flexWrap:'wrap',gap:'1.5rem'}}>
          {[
            ['Total Volume',`$${fmt(result.total_amount)}`,'#ffffff'],
            ['Transactions',fmt(result.total_count, 0),'#ffffff'],
            ['Avg Fee %',`${fmt(result.existing_avg_fee_pct)}%`,'#fbbf24'],
            ['Monthly Savings',`$${fmt(result.savings)}`,'#34d399']
          ].map(([lbl,val,clr])=>(
            <div key={lbl}>
              <p style={{fontSize:'.72rem',fontWeight:800,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.05em'}}>{lbl}</p>
              <p style={{fontSize:'1.5rem',fontWeight:900,color:clr,marginTop:'.15rem'}}>{val}</p>
            </div>
          ))}
        </div>

        {/* Existing Merchant Table */}
        <div style={{border:'1px solid rgba(255,255,255,.1)',borderRadius:14,overflow:'hidden'}}>
          <div style={{background:'rgba(255,255,255,.04)',padding:'1rem 1.5rem',borderBottom:'1px solid rgba(255,255,255,.1)',display:'flex',alignItems:'center',gap:'.5rem'}}>
            <FileText size={15} color="#00c8b4"/>
            <span style={{fontSize:'.88rem',fontWeight:800,color:'#ffffff'}}>Existing Merchant</span>
          </div>
          <table style={ltbl}>
            <thead><tr><ThD>Merchant</ThD><ThD>Trn Amt</ThD><ThD>Count</ThD><ThD>Fee Paid</ThD><ThD>Avg %</ThD><ThD>% of Trn</ThD></tr></thead>
            <tbody>
              <tr>
                <TdD bold>{result.existing_merchant}</TdD>
                <TdD>${fmt(result.total_amount)}</TdD>
                <TdD>{fmt(result.total_count, 0)}</TdD>
                <TdD bold color="#fbbf24">${fmt(result.total_fees_paid)}</TdD>
                <TdD>{fmt(result.existing_avg_fee_pct)}%</TdD>
                <TdD>100%</TdD>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Adit Pay Table */}
        <div style={{border:'1px solid rgba(0,200,180,.25)',borderRadius:14,overflow:'hidden'}}>
          <div style={{background:'linear-gradient(135deg,#00c8b4 0%,#2563eb 100%)',padding:'1rem 1.5rem',display:'flex',alignItems:'center',gap:'.5rem'}}>
            <Sparkles size={15} color="#fff"/>
            <span style={{fontSize:'.88rem',fontWeight:800,color:'#fff'}}>Adit Pay Pricing</span>
          </div>
          <table style={ltbl}>
            <thead><tr><ThD>Type</ThD><ThD>Trn Amt</ThD><ThD>Count</ThD><ThD>Fee</ThD><ThD>Rate</ThD></tr></thead>
            <tbody>
              {result.adit_rows.map((r,i)=>(
                <tr key={i} style={{borderBottom:'1px solid rgba(255,255,255,.07)'}}>
                  <TdD>{r.type}</TdD>
                  <TdD>${fmt(r.amount)}</TdD>
                  <TdD>{fmt(r.count, 1)}</TdD>
                  <TdD>${fmt(r.total_fee)}</TdD>
                  <TdD>{r.rate_label}</TdD>
                </tr>
              ))}
              <tr style={{background:'rgba(0,200,180,.06)'}}>
                <TdD bold>Total</TdD>
                <TdD bold>${fmt(result.total_amount)}</TdD>
                <TdD bold>{fmt(result.total_count, 0)}</TdD>
                <TdD bold color="#34d399">${fmt(result.adit_total_fee)}</TdD>
                <TdD bold>{fmt(result.adit_avg_fee_pct)}%</TdD>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Hero Savings Block */}
        <div style={{
          background: pos
            ? 'linear-gradient(135deg,rgba(16,185,129,.15) 0%,rgba(0,200,180,.08) 100%)'
            : 'linear-gradient(135deg,rgba(239,68,68,.15) 0%,rgba(239,68,68,.06) 100%)',
          border: pos ? '1px solid rgba(16,185,129,.35)' : '1px solid rgba(239,68,68,.35)',
          borderRadius:16,padding:'2.25rem 2.5rem',
          display:'flex',justifyContent:'space-between',alignItems:'flex-end'
        }}>
          <div>
            <p style={{fontSize:'.82rem',fontWeight:800,textTransform:'uppercase',letterSpacing:'.06em',color:pos?'#34d399':'#f87171'}}>
              Total {pos ? 'Savings' : 'Cost'} with Adit Pay
            </p>
            <p style={{fontSize:'4rem',fontWeight:900,color:pos?'#34d399':'#f87171',lineHeight:1,marginTop:'.4rem',fontFamily:'var(--font-head)'}}>
              ${fmt(Math.abs(result.savings))}
            </p>
            <p style={{fontSize:'.85rem',color:'#94a3b8',marginTop:'.5rem'}}>per month vs. current processor</p>
          </div>
          <div style={{textAlign:'right'}}>
            <p style={{fontSize:'.72rem',fontWeight:800,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:'.35rem'}}>Fee Reduction</p>
            <p style={{fontSize:'2rem',fontWeight:900,color:pos?'#00c8b4':'#f87171'}}>{fmt(result.diff_pct)}%</p>
          </div>
        </div>

      </div>
    </div>
  )
}

// ── Global History Dashboard Tab ──────────────────────────────────────────────
function HistoryDashboard() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  fetch(`${API}/api/history`, {
  credentials: "include",
})
  .then((r) => {
    if (!r.ok) throw new Error("Failed to load history");
    return r.json();
  })
  .then((d) => {
    setHistory(d.history || []);
    setLoading(false);
  })
  .catch(() => setLoading(false));

  if (loading) return <div style={{textAlign:'center', padding:'4rem', color:'#94a3b8'}}>Loading history database...</div>
  if (history.length === 0) return (
    <GlassCard style={{textAlign:'center', padding:'4rem 2rem'}}>
      <Search size={48} color="rgba(255,255,255,.1)" style={{margin:'0 auto 1rem'}}/>
      <h3 style={{fontSize:'1.2rem', fontWeight:800, color:'#fff'}}>No analyses found</h3>
      <p style={{color:'#94a3b8', marginTop:'.5rem'}}>Upload a statement on the Analyzer tab to begin tracking history.</p>
    </GlassCard>
  )

  const wins = history.filter(h => h.savings >= 0)
  const totalSavings = wins.reduce((acc, h) => acc + h.savings, 0)
  const winRate = history.length > 0 ? (wins.length / history.length) * 100 : 0

  return (
    <div style={{display:'flex', flexDirection:'column', gap:'1.5rem'}}>
      {/* Global KPIs */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'1.5rem'}}>
        <GlassCard style={{padding:'1.75rem'}}>
          <p style={{fontSize:'.8rem', fontWeight:800, color:'#94a3b8', textTransform:'uppercase'}}>Total Pitches</p>
          <p style={{fontSize:'2.5rem', fontWeight:900, color:'#fff', marginTop:'.2rem'}}>{history.length}</p>
        </GlassCard>
        <GlassCard style={{padding:'1.75rem'}}>
          <p style={{fontSize:'.8rem', fontWeight:800, color:'#94a3b8', textTransform:'uppercase'}}>Win Rate</p>
          <p style={{fontSize:'2.5rem', fontWeight:900, color:'#60a5fa', marginTop:'.2rem'}}>{fmt(winRate, 0)}%</p>
        </GlassCard>
        <GlassCard style={{padding:'1.75rem', background:'rgba(16,185,129,.1)', borderColor:'rgba(16,185,129,.3)'}}>
          <p style={{fontSize:'.8rem', fontWeight:800, color:'#34d399', textTransform:'uppercase'}}>Total Monthly Savings</p>
          <p style={{fontSize:'2.5rem', fontWeight:900, color:'#34d399', marginTop:'.2rem'}}>${fmt(totalSavings, 0)}</p>
        </GlassCard>
      </div>

      <GlassCard style={{padding:0, overflow:'hidden'}}>
        <div style={{padding:'1.5rem 2rem', borderBottom:'1px solid rgba(255,255,255,.1)'}}>
          <h3 style={{fontSize:'1.1rem', fontWeight:800, color:'#fff'}}>Historical Log</h3>
        </div>
        <table style={{...ltbl, color:'#fff'}}>
          <thead>
            <tr>
              <th style={{padding:'1rem 1.5rem', color:'#94a3b8', fontWeight:800, fontSize:'.75rem', textTransform:'uppercase', borderBottom:'1px solid rgba(255,255,255,.1)'}}>Date</th>
              <th style={{padding:'1rem 1.5rem', color:'#94a3b8', fontWeight:800, fontSize:'.75rem', textTransform:'uppercase', borderBottom:'1px solid rgba(255,255,255,.1)'}}>Merchant</th>
              <th style={{padding:'1rem 1.5rem', color:'#94a3b8', fontWeight:800, fontSize:'.75rem', textTransform:'uppercase', borderBottom:'1px solid rgba(255,255,255,.1)'}}>Volume</th>
              <th style={{padding:'1rem 1.5rem', color:'#94a3b8', fontWeight:800, fontSize:'.75rem', textTransform:'uppercase', borderBottom:'1px solid rgba(255,255,255,.1)'}}>Savings</th>
              <th style={{padding:'1rem 1.5rem', color:'#94a3b8', fontWeight:800, fontSize:'.75rem', textTransform:'uppercase', borderBottom:'1px solid rgba(255,255,255,.1)'}}>Status</th>
            </tr>
          </thead>
          <tbody>
            {history.map(h => (
              <tr key={h.id} style={{borderBottom:'1px solid rgba(255,255,255,.05)'}}>
                <td style={{padding:'1rem 1.5rem', color:'#94a3b8', fontFamily:'monospace'}}>{new Date(h.created_at).toLocaleDateString()}</td>
                <td style={{padding:'1rem 1.5rem', fontWeight:800, color:'#fff'}}>{h.merchant || 'Unknown'}</td>
                <td style={{padding:'1rem 1.5rem', fontFamily:'monospace', color:'#fff'}}>${fmt(h.total_amount)}</td>
                <td style={{padding:'1rem 1.5rem', fontWeight:800, fontFamily:'monospace', color: h.savings >= 0 ? '#34d399' : '#f87171'}}>${fmt(h.savings)}</td>
                <td style={{padding:'1rem 1.5rem'}}>
                  <span style={{
                    padding:'4px 10px', borderRadius:100, fontSize:'.75rem', fontWeight:800,
                    background: h.savings >= 0 ? 'rgba(16,185,129,.2)' : 'rgba(239,68,68,.2)',
                    color: h.savings >= 0 ? '#34d399' : '#fca5a5'
                  }}>
                    {h.savings >= 0 ? 'WON' : 'FAILED'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  )
}

// ── User Dropdown ────────────────────────────────────────────────────────────
function UserMenu({user}) {
  const [open,setOpen]=useState(false)
  const initials=user.name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)
  return (
    <div style={{position:'relative'}}>
      <button onClick={()=>setOpen(o=>!o)}
        style={{display:'flex',alignItems:'center',gap:8,background:'rgba(255,255,255,.08)',
          border:`1px solid rgba(255,255,255,.1)`,borderRadius:100,padding:'5px 10px 5px 5px',
          cursor:'pointer',transition:'background .2s'}}
        onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.13)'}
        onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,.08)'}>
        {user.picture
          ? <img src={user.picture} alt={user.name} style={{width:28,height:28,borderRadius:'50%',objectFit:'cover'}}/>
          : <div style={{width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,#00c8b4 0%,#2563eb 100%)',
              display:'flex',alignItems:'center',justifyContent:'center',
              fontSize:'.72rem',fontWeight:800,color:'#fff',fontFamily:'var(--font-head)'}}>
              {initials}
            </div>
        }
        <span style={{fontSize:'.8rem',fontWeight:600,color:'#ffffff',fontFamily:'var(--font-head)'}}>
          {user.name}
        </span>
        <ChevronDown size={13} color="#94a3b8"/>
      </button>
      {open&&(
        <>
          <div onClick={()=>setOpen(false)} style={{position:'fixed',inset:0,zIndex:50}}/>
          <div style={{position:'absolute',right:0,top:'calc(100% + 8px)',zIndex:100,
            background:'#0f2044',border:'1px solid rgba(255,255,255,.1)',borderRadius:12,
            padding:'6px',minWidth:220,boxShadow:'0 8px 32px rgba(0,0,0,.4)'}}>
            <div style={{padding:'10px 12px',borderBottom:'1px solid rgba(255,255,255,.1)',marginBottom:4}}>
              <p style={{fontSize:'.82rem',fontWeight:700,color:'#ffffff',fontFamily:'var(--font-head)'}}>{user.name}</p>
              <p style={{fontSize:'.75rem',color:'#00c8b4',marginTop:2}}>{user.email}</p>
            </div>
            <a href={`${API}/auth/logout`} style={{display:'flex',alignItems:'center',gap:8,
              padding:'8px 12px',borderRadius:8,textDecoration:'none',color:'#fca5a5',
              fontSize:'.82rem',fontWeight:600,fontFamily:'var(--font-head)'}}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(239,68,68,.1)'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <LogOut size={14}/> Sign out
            </a>
          </div>
        </>
      )}
    </div>
  )
}

// ── Main App Component ───────────────────────────────────────────────────────
export default function App() {
  const [authState,setAuthState]=useState({loading:true,authenticated:false,user:null})
  const [uploadLoading,setUploadLoading]=useState(false)
  const [calcLoading,setCalcLoading]=useState(false)
  const [result,setResult]=useState(null)
  const [pendingFile,setPendingFile]=useState(null)
  const [uploadError,setUploadError]=useState(null)
  const [retryCountdown,setRetryCountdown]=useState(0)
  const countdownRef=useRef(null)

  const [tab, setTab] = useState('analyzer')

  const [form,setForm]=useState({
    existing_merchant:'',total_amount:'',total_count:'',
    total_fees_paid:'',card_present_pct:'90',mode:'template'
  })
  const set=key=>val=>setForm(f=>({...f,[key]:val}))

  useEffect(() => {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 8000); // 8 sec timeout

  const hasSession = sessionStorage.getItem("sessionActive");

  // 🔐 Force fresh login on new tab
  if (!hasSession) {
    fetch(`${API}/auth/logout`, {
      credentials: "include",
    }).finally(() => {
      sessionStorage.setItem("sessionActive", "true");
      setAuthState({ loading: false, authenticated: false, user: null });
    });
    return;
  }

  fetch(`${API}/api/me`, {
    credentials: "include",
    signal: controller.signal,
  })
    .then((r) => {
      if (!r.ok) throw new Error("Auth failed");
      return r.json();
    })
    .then((data) => {
      setAuthState({
        loading: false,
        authenticated: data.authenticated,
        user: data.user || null,
      });
    })
    .catch((err) => {
      console.error("Auth error or timeout:", err);
      setAuthState({ loading: false, authenticated: false, user: null });
    })
    .finally(() => {
      clearTimeout(timeout);
    });
}, []);

  const onExtracted=extracted=>{
    setForm(f=>({...f,
      existing_merchant:extracted.merchant||f.existing_merchant,
      total_amount:extracted.total_amount??f.total_amount,
      total_count:extracted.total_count??f.total_count,
      total_fees_paid:extracted.total_fees??f.total_fees_paid,
    }))
    setResult(null)
    // Scroll to Step 2 after extraction
    setTimeout(()=>document.getElementById('step2-anchor')?.scrollIntoView({behavior:'smooth'}),120)
  }

  const analyzeStatement=async()=>{
    if(!pendingFile)return
    setUploadError(null)
    setRetryCountdown(0)
    if(countdownRef.current) clearInterval(countdownRef.current)
    setUploadLoading(true)
    const fd=new FormData(); fd.append('file',pendingFile)
    try {
      const res=await fetch(`${API}/api/upload`,{method:'POST',body:fd,credentials:'include'})
      const data=await res.json()
      if(!res.ok) throw new Error(data.detail||'Upload failed')
      onExtracted(data.extracted)
    } catch(e){
      const msg=e.message||'Unknown error'
      setUploadError(msg)
      // If rate-limited, start a 30-second countdown then auto-retry
      if(msg.toLowerCase().includes('rate-limit')||msg.includes('429')||msg.includes('temporarily')){
        let secs=30
        setRetryCountdown(secs)
        countdownRef.current=setInterval(()=>{
          secs-=1
          setRetryCountdown(secs)
          if(secs<=0){
            clearInterval(countdownRef.current)
            setRetryCountdown(0)
            setUploadError(null)
          }
        },1000)
      }
    } finally {
      setUploadLoading(false)
    }
  }

  const calculate=async()=>{
    setCalcLoading(true)
    try {
      const res=await fetch(`${API}/api/calculate`,{
        method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',
        body:JSON.stringify({...form,
          total_amount:Number(form.total_amount),
          total_count:Number(form.total_count),
          total_fees_paid:Number(form.total_fees_paid),
          card_present_pct:Number(form.card_present_pct)})
      })
      const data=await res.json()
      if(!res.ok) throw new Error(data.detail||'Calculation failed')
      setResult(data)
      setTimeout(()=>document.getElementById('results-anchor')?.scrollIntoView({behavior:'smooth'}),80)
    } catch(e){ alert(e.message) }
    finally { setCalcLoading(false) }
  }

  const canCalc=form.total_amount&&form.total_count&&form.total_fees_paid

  if(authState.loading) return <div style={{padding:'4rem',textAlign:'center',color:'#fff'}}>Loading...</div>
  if(!authState.authenticated) return <LoginPage error={new URLSearchParams(window.location.search).get('error')}/>

  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column'}}>

      <header style={{background:'rgba(10,22,40,.85)',backdropFilter:'blur(16px)',
        borderBottom:'1px solid rgba(255,255,255,.1)', position:'sticky',top:0,zIndex:100,
        padding:'0 2rem',height:72, display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        
        <div style={{display:'flex',alignItems:'center',gap:'2rem'}}>
          <div style={{display:'flex',alignItems:'center',gap:'.85rem'}}>
            <img src="https://adit.com/storage/settings/logo.png" alt="Adit Logo" style={{height:28}} onError={(e)=>{e.target.style.display='none'}}/>
          </div>

          <nav style={{display:'flex', gap:'.5rem'}}>
            <button onClick={()=>setTab('analyzer')} style={{
              background:tab==='analyzer'?'rgba(255,255,255,.1)':'transparent', color:tab==='analyzer'?'#fff':'#94a3b8',
              border:'none', padding:'8px 16px', borderRadius:8, fontWeight:700, cursor:'pointer', fontSize:'.95rem', fontFamily:'var(--font-head)'
            }}>Analyzer</button>
            <button onClick={()=>setTab('dashboard')} style={{
              background:tab==='dashboard'?'rgba(255,255,255,.1)':'transparent', color:tab==='dashboard'?'#fff':'#94a3b8',
              border:'none', padding:'8px 16px', borderRadius:8, fontWeight:700, cursor:'pointer', fontSize:'.95rem', fontFamily:'var(--font-head)'
            }}>History Dashboard</button>
          </nav>
        </div>

        <UserMenu user={authState.user}/>
      </header>

      <main style={{maxWidth:720,margin:'0 auto',padding:'3rem 1.5rem 4rem',width:'100%',
        display:'flex',flexDirection:'column',gap:'1.5rem', flex:1}}>

        {tab === 'dashboard' ? (
          <HistoryDashboard />
        ) : (
          <>
            <div style={{textAlign:'center', marginBottom:'1rem'}}>
              <h1 style={{fontFamily:'var(--font-head)',fontWeight:800, fontSize:'2.4rem', color:'#fff'}}>
                Adit Statement Analysis
              </h1>
              <p style={{color:'#94a3b8',fontSize:'1rem',marginTop:'.5rem'}}>
                Upload a processor statement and instantly extract figures with AI.
              </p>
            </div>

            <GlassCard>
              <SectionLabel icon={FileText}>Step 1 — Upload Statement</SectionLabel>
              <UploadZone onFileReady={f=>{setPendingFile(f);setUploadError(null)}} pendingFile={pendingFile} loading={uploadLoading}/>

              {/* Analyze button */}
              <div style={{marginTop:'1.25rem',display:'flex',flexDirection:'column',gap:'.75rem'}}>
                <button
                  id="analyze-btn"
                  onClick={analyzeStatement}
                  disabled={!pendingFile||uploadLoading}
                  style={{
                    display:'inline-flex',alignItems:'center',justifyContent:'center',gap:'.65rem',
                    width:'100%',padding:'1rem',borderRadius:12,border:'none',fontFamily:'var(--font-head)',
                    fontWeight:800,fontSize:'1.05rem',cursor:(!pendingFile||uploadLoading)?'not-allowed':'pointer',
                    background:(!pendingFile||uploadLoading)?'rgba(255,255,255,.08)':T.grad,
                    color:'#fff',transition:'opacity .2s, transform .15s',
                    opacity:(!pendingFile||uploadLoading)?0.5:1,
                    boxShadow:(!pendingFile||uploadLoading)?'none':'0 4px 20px rgba(0,200,180,.3)'
                  }}
                  onMouseEnter={e=>{if(pendingFile&&!uploadLoading)e.currentTarget.style.transform='translateY(-1px)'}}
                  onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)'}}
                >
                  {uploadLoading
                    ? <><RefreshCw size={18} className="spin"/> Reading statement with AI…</>
                    : <><Sparkles size={18}/> Analyze the Statement</>}
                </button>
                {uploadError&&(
                  <div style={{display:'flex',flexDirection:'column',gap:'.5rem',
                    background:'rgba(239,68,68,.12)',border:'1px solid rgba(239,68,68,.25)',
                    borderRadius:10,padding:'.85rem 1rem'}}>
                    <div style={{display:'flex',gap:'.6rem',alignItems:'flex-start',color:'#fca5a5',fontSize:'.85rem'}}>
                      <AlertCircle size={16} style={{flexShrink:0,marginTop:1}}/>
                      <span>
                        {retryCountdown>0
                          ? <><strong>Rate limited.</strong> Auto-retrying in <strong style={{color:'#fbbf24'}}>{retryCountdown}s</strong> — the AI service is busy. You can also click Retry now.</>
                          : <><strong>Extraction failed:</strong> {uploadError}</>}
                      </span>
                    </div>
                    {retryCountdown>0&&(
                      <button onClick={()=>{clearInterval(countdownRef.current);setRetryCountdown(0);setUploadError(null);analyzeStatement()}}
                        style={{alignSelf:'flex-start',background:'rgba(251,191,36,.15)',border:'1px solid rgba(251,191,36,.35)',
                          color:'#fbbf24',padding:'4px 14px',borderRadius:8,fontSize:'.8rem',fontWeight:700,cursor:'pointer',fontFamily:'var(--font-head)'}}>
                        Retry Now
                      </button>
                    )}
                  </div>
                )}
              </div>
            </GlassCard>

            <GlassCard id="step2-anchor">
              <SectionLabel icon={Pencil}>Step 2 — Review &amp; Edit Figures</SectionLabel>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:'1rem',marginBottom:'1.5rem'}}>
                <Field label="Merchant Name" value={form.existing_merchant} onChange={set('existing_merchant')}/>
                <Field label="Total Volume" value={form.total_amount} onChange={set('total_amount')} type="number" prefix="$"/>
                <Field label="Transactions" value={form.total_count} onChange={set('total_count')} type="number"/>
                <Field label="Total Fees Paid" value={form.total_fees_paid} onChange={set('total_fees_paid')} type="number" prefix="$"/>
              </div>

              <div style={{display:'flex',justifyContent:'center',marginTop:'.5rem'}}>
                <button onClick={calculate} disabled={calcLoading||!canCalc}
                  style={{display:'inline-flex',alignItems:'center',gap:'.6rem',
                    background:canCalc?'linear-gradient(135deg,#00c8b4 0%,#2563eb 100%)':'rgba(255,255,255,.08)',color:'#fff',border:'none',
                    padding:'.85rem 2.5rem',borderRadius:100,fontWeight:700,fontSize:'1rem',
                    cursor:canCalc?'pointer':'not-allowed',fontFamily:'var(--font-head)',
                    boxShadow:canCalc?'0 4px 20px rgba(0,200,180,.25)':'none'}}>
                  {calcLoading?<RefreshCw size={16} className="spin"/>:<Calculator size={16}/>}
                  Generate Proposal
                </button>
              </div>
            </GlassCard>

            {result&&(
              <GlassCard id="results-anchor" style={{padding:0, overflow:'hidden'}}>
                <AnalysisDashboard result={result}/>
              </GlassCard>
            )}
          </>
        )}
      </main>
      
      <footer style={{borderTop:'1px solid rgba(255,255,255,.1)',padding:'1.5rem 2rem',textAlign:'center'}}>
        <p style={{fontSize:'.8rem',color:'#94a3b8'}}>© {new Date().getFullYear()} Adit Communications, Inc.</p>
      </footer>
    </div>
  )
}
