import { useState, useCallback, useRef, useEffect } from 'react'
import {
  Upload, FileText, Calculator, CheckCircle2, AlertCircle,
  ChevronDown, ChevronUp, Pencil, RefreshCw, TrendingDown,
  DollarSign, Hash, Percent, Sparkles, ArrowRight, BarChart3,
  LogOut, Lock, ShieldCheck, LayoutDashboard, Search
} from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'https://statement-analyzer-ap.onrender.com'

const fmt  = (n, d=2) => n==null ? '—' : Number(n).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d})
const fmtC = n => n==null ? '—' : '$'+fmt(n)
const fmtP = n => n==null ? '—' : fmt(n,4)+'%'

// ── Dark Theme Tokens ─────────────────────────────────────────────────────────
const T = {
  bg: '#0a1628',
  card: 'rgba(255,255,255,.05)',
  navy: '#ffffff', // primary text
  navyMid: '#cbd5e1', // secondary text
  text: '#f8fafc',
  muted: '#94a3b8',
  border: 'rgba(255,255,255,.1)',
  teal: '#00c8b4',
  tealDark: '#00a896',
  blue: '#2563eb',
  success: '#10b981',
  danger: '#ef4444',
  grad: 'linear-gradient(135deg, #00c8b4 0%, #2563eb 100%)',
}

// ── Shared UI Components ──────────────────────────────────────────────────────
function Card({children,style,id}) {
  return (
    <div id={id} className="fade-up" style={{background:T.card, border:`1px solid ${T.border}`, borderRadius:16, 
      backdropFilter:'blur(10px)', padding:'2rem', ...style}}>
      {children}
    </div>
  )
}

function SectionTitle({icon:Icon,children}) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:'1.5rem'}}>
      <div style={{width:36,height:36,borderRadius:10,background:'rgba(0,200,180,.1)',
        display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
        <Icon size={18} color={T.teal}/>
      </div>
      <h2 style={{fontFamily:'var(--font-head)',fontWeight:700,fontSize:'1.1rem',color:T.navy}}>
        {children}
      </h2>
    </div>
  )
}

function Field({label,value,onChange,type='text',step,prefix,hint}) {
  const [focus,setFocus]=useState(false)
  return (
    <div style={{display:'flex',flexDirection:'column',gap:'.4rem'}}>
      <label style={{fontSize:'.75rem',fontWeight:700,color:T.navyMid,
        textTransform:'uppercase',letterSpacing:'.05em',fontFamily:'var(--font-head)'}}>
        {label}
      </label>
      <div style={{display:'flex',alignItems:'stretch',
          border:`1px solid ${focus?T.teal:T.border}`,
          borderRadius:10,overflow:'hidden',background:focus?'rgba(255,255,255,.05)':'rgba(255,255,255,.02)',
          transition:'all .2s', boxShadow: focus ? '0 0 0 3px rgba(0,200,180,.1)' : 'none'}}>
        {prefix&&<span style={{padding:'0 .85rem',color:T.muted,fontWeight:600,fontSize:'.95rem',
          borderRight:`1px solid ${T.border}`,background:'rgba(255,255,255,.05)',
          display:'flex',alignItems:'center'}}>{prefix}</span>}
        <input type={type} value={value} onChange={e=>onChange(e.target.value)} step={step}
          onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)}
          style={{flex:1,border:'none',background:'transparent',padding:'.7rem .85rem',
            fontSize:'.95rem',outline:'none',color:'#fff',fontFamily:'var(--font-body)', fontWeight:500}}/>
      </div>
      {hint&&<p style={{fontSize:'.75rem',color:T.muted}}>{hint}</p>}
    </div>
  )
}

// ── Login Page ────────────────────────────────────────────────────────────────
function LoginPage({error}) {
  const errMsg = error==='unauthorized_domain'
    ? 'Only @adit.com email addresses are allowed. Please sign in with your Adit work account.'
    : error==='auth_failed'
    ? 'Authentication failed. Please try again.'
    : null

  return (
    <div style={{minHeight:'100vh',background:T.bg,display:'flex',flexDirection:'column',
      alignItems:'center',justifyContent:'center',padding:'2rem'}}>
      <div style={{width:'100%',maxWidth:440}}>
        <div style={{textAlign:'center',marginBottom:'2rem'}}>
          <img src="https://adit.com/storage/settings/logo.png" alt="Adit Logo" style={{height:40,marginBottom:'1rem', filter:'brightness(0) invert(1)'}} onError={(e)=>{e.target.style.display='none'}}/>
          <h1 style={{fontFamily:'var(--font-head)',fontWeight:800,fontSize:'1.8rem',color:T.navy,letterSpacing:'-.02em'}}>
            Statement Analyzer
          </h1>
        </div>

        <Card style={{padding:'2.5rem 2rem'}}>
          <div style={{textAlign:'center',marginBottom:'2rem'}}>
            <div style={{width:56,height:56,borderRadius:16,background:'rgba(37,99,235,.15)',
              display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 1rem'}}>
              <Lock size={24} color={'#60a5fa'}/>
            </div>
            <h2 style={{fontFamily:'var(--font-head)',fontWeight:700,fontSize:'1.2rem',color:T.navy,marginBottom:'.5rem'}}>
              Internal Tool Access
            </h2>
            <p style={{fontSize:'.9rem',color:T.muted,lineHeight:1.6}}>
              Sign in with your <strong style={{color:'#fff'}}>@adit.com</strong> Google account.
            </p>
          </div>

          {errMsg&&(
            <div style={{marginBottom:'1.5rem',display:'flex',gap:'.6rem',alignItems:'flex-start',
              background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.3)',borderRadius:12,padding:'1rem',fontSize:'.85rem',color:'#fca5a5'}}>
              <AlertCircle size={16} style={{flexShrink:0,marginTop:2}}/> {errMsg}
            </div>
          )}

          <a href={`${API}/auth/login`}
            style={{display:'flex',alignItems:'center',justifyContent:'center',gap:12,
              width:'100%',padding:'.85rem',borderRadius:12,textDecoration:'none',
              border:`1px solid rgba(255,255,255,.2)`,background:'rgba(255,255,255,.1)',
              transition:'all .2s',cursor:'pointer',color:'#fff',fontWeight:600}}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.15)'}
            onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,.1)'}>
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </a>
        </Card>
      </div>
    </div>
  )
}

// ── Upload Zone ───────────────────────────────────────────────────────────────
function UploadZone({onExtracted,setLoading,loading}) {
  const [drag,setDrag]=useState(false)
  const [error,setError]=useState(null)
  const [fileName,setFileName]=useState(null)
  const ref=useRef()

  const handleFile=useCallback(async(file)=>{
    if(!file)return
    setError(null); setFileName(file.name); setLoading(true)
    const fd=new FormData(); fd.append('file',file)
    try {
      const res=await fetch(`${API}/api/upload`,{method:'POST',body:fd,credentials:'include'})
      const data=await res.json()
      if(!res.ok) throw new Error(data.detail||'Upload failed')
      onExtracted(data.extracted)
    } catch(e){ setError(e.message); setFileName(null) }
    finally { setLoading(false) }
  },[onExtracted,setLoading])

  return (
    <div>
      <div onClick={()=>ref.current.click()}
        onDragOver={e=>{e.preventDefault();setDrag(true)}}
        onDragLeave={()=>setDrag(false)}
        onDrop={e=>{e.preventDefault();setDrag(false);handleFile(e.dataTransfer.files[0])}}
        style={{border:`2px dashed ${drag?T.teal:T.border}`,borderRadius:16,
          padding:'3rem 2rem',textAlign:'center',cursor:'pointer',
          background:drag?'rgba(0,200,180,.05)':'rgba(255,255,255,.02)',
          transition:'all .2s'}}>
        
        <div style={{width:64,height:64,borderRadius:20,margin:'0 auto 1.25rem',
          background:drag?T.grad:'rgba(255,255,255,.05)',border:`1px solid ${drag?'transparent':T.border}`,
          boxShadow:drag?'0 10px 25px rgba(0,200,180,.2)':'none',
          display:'flex',alignItems:'center',justifyContent:'center',transition:'all .25s'}}>
          <Upload size={28} color={drag?'#fff':T.teal}/>
        </div>

        {fileName&&!loading ? (
          <><p style={{fontWeight:800,fontSize:'1.1rem',color:T.navy,fontFamily:'var(--font-head)'}}>{fileName}</p>
          <p style={{fontSize:'.9rem',color:T.success,marginTop:'.4rem',fontWeight:600}}>Extracted successfully ↓</p></>
        ) : loading ? (
          <><p style={{fontWeight:800,color:T.navy,fontSize:'1.1rem',fontFamily:'var(--font-head)'}}>Extracting data…</p>
          <p style={{fontSize:'.9rem',color:T.muted,marginTop:'.4rem'}}>Running secure OCR</p></>
        ) : (
          <><p style={{fontWeight:800,fontSize:'1.1rem',color:T.navy,fontFamily:'var(--font-head)'}}>
            Drop statement PDF here</p>
          <p style={{fontSize:'.9rem',color:T.muted,marginTop:'.4rem'}}>
            Click to browse for a PDF or image file.</p></>
        )}
        <input ref={ref} type="file" accept=".pdf,.png,.jpg,.jpeg,.tiff,.bmp,.webp"
          style={{display:'none'}} onChange={e=>handleFile(e.target.files[0])}/>
      </div>
      
      {error&&(
        <div style={{marginTop:'1rem',display:'flex',gap:'.6rem',alignItems:'flex-start',
          color:'#fca5a5',background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.3)',
          borderRadius:12,padding:'1rem',fontSize:'.85rem'}}>
          <AlertCircle size={16} style={{flexShrink:0,marginTop:1}}/>{error}
        </div>
      )}
    </div>
  )
}

// ── Step 3: Analysis Dashboard (Dark Theme Revert) ─────────────────────────
function AnalysisDashboard({result}) {
  const pos = result.savings >= 0
  const isStrong = result.diff_pct > 5

  return (
    <div style={{background:'rgba(10,22,40,0.8)', borderRadius:16, border:`1px solid rgba(255,255,255,.1)`, overflow:'hidden', color:'#fff', fontFamily:'var(--font-head)'}}>
      {/* Header */}
      <div style={{padding:'1.5rem 2rem', borderBottom:'1px solid rgba(255,255,255,.1)', display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
        <div>
          <h2 style={{fontSize:'1.4rem', fontWeight:900, textTransform:'uppercase', color:'#fff', letterSpacing:'.03em', marginBottom:'.2rem'}}>
            {result.existing_merchant || 'UNNAMED MERCHANT'}
          </h2>
          <p style={{fontSize:'.85rem', color:'#94a3b8', fontWeight:500}}>
            Statement Date • Saved Today
          </p>
        </div>
      </div>

      <div style={{padding:'2rem'}}>
        {/* AI Summary Block */}
        <div style={{background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:16, padding:'1.5rem', marginBottom:'2rem', boxShadow:'0 10px 25px rgba(0,0,0,0.2)'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
            <span style={{fontSize:'.75rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'.1em', color:'#94a3b8'}}>
              AI Summary
            </span>
            {isStrong && (
              <span style={{background:'rgba(16,185,129,0.2)', color:'#34d399', fontSize:'.7rem', fontWeight:800, padding:'4px 10px', borderRadius:100, textTransform:'uppercase', letterSpacing:'.05em'}}>
                ● Strong Opportunity
              </span>
            )}
          </div>
          
          <p style={{fontSize:'.95rem', lineHeight:1.6, color:'#f1f5f9', fontWeight:400, marginBottom:'2rem'}}>
            <strong style={{fontWeight:800, color:'#fff'}}>{result.existing_merchant || 'The merchant'}</strong> currently pays{' '}
            <strong style={{color:'#fbbf24'}}>${fmt(result.total_fees_paid)}/month</strong> to their existing processor at a{' '}
            <strong style={{color:'#fbbf24'}}>{fmt(result.existing_avg_fee_pct)}% effective rate</strong>. Switching to Adit Pay's flat-rate pricing brings that down to{' '}
            <strong style={{color:'#34d399'}}>${fmt(result.adit_total_fee)}/month</strong> — a{' '}
            <strong style={{color:'#34d399'}}>{fmt(result.diff_pct)}% reduction</strong> worth{' '}
            <strong style={{color:'#34d399'}}>${fmt(result.savings)}/month</strong> in real cash back to the practice.
          </p>

          <div style={{display:'flex', gap:'2rem', marginBottom:'2rem'}}>
            <div style={{flex:1}}>
              <p style={{fontSize:'.7rem', fontWeight:800, textTransform:'uppercase', color:'#94a3b8', marginBottom:'.5rem', letterSpacing:'.05em'}}>Current Fees</p>
              <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'.4rem'}}>
                <span style={{fontSize:'1.1rem', fontWeight:800}}>${fmt(result.total_fees_paid)} <span style={{fontSize:'.75rem', color:'#94a3b8', fontWeight:600}}>({fmt(result.existing_avg_fee_pct)}%)</span></span>
              </div>
              <div style={{height:6, background:'rgba(255,255,255,0.1)', borderRadius:3, overflow:'hidden'}}>
                <div style={{width:'100%', height:'100%', background:'#fbbf24', borderRadius:3}}/>
              </div>
            </div>
            
            <div style={{flex:1}}>
              <p style={{fontSize:'.7rem', fontWeight:800, textTransform:'uppercase', color:'#94a3b8', marginBottom:'.5rem', letterSpacing:'.05em'}}>Adit Pay Fees</p>
              <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'.4rem'}}>
                <span style={{fontSize:'1.1rem', fontWeight:800}}>${fmt(result.adit_total_fee)} <span style={{fontSize:'.75rem', color:'#94a3b8', fontWeight:600}}>({fmt(result.adit_avg_fee_pct)}%)</span></span>
              </div>
              <div style={{height:6, background:'rgba(255,255,255,0.1)', borderRadius:3, overflow:'hidden'}}>
                <div style={{width:`${Math.max(10, 100 - result.diff_pct)}%`, height:'100%', background:'#34d399', borderRadius:3}}/>
              </div>
            </div>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'1rem'}}>
            <div style={{background:'rgba(255,255,255,0.04)', borderRadius:12, padding:'1rem', textAlign:'center'}}>
              <p style={{fontSize:'1.2rem', fontWeight:800, color:'#34d399'}}>${fmt(result.savings_1_yr, 0)}</p>
              <p style={{fontSize:'.7rem', fontWeight:800, textTransform:'uppercase', color:'#94a3b8', letterSpacing:'.05em', marginTop:'.2rem'}}>1 Year Savings</p>
            </div>
            <div style={{background:'rgba(255,255,255,0.04)', borderRadius:12, padding:'1rem', textAlign:'center'}}>
              <p style={{fontSize:'1.2rem', fontWeight:800, color:'#34d399'}}>${fmt(result.savings_3_yr, 0)}</p>
              <p style={{fontSize:'.7rem', fontWeight:800, textTransform:'uppercase', color:'#94a3b8', letterSpacing:'.05em', marginTop:'.2rem'}}>3 Years Savings</p>
            </div>
            <div style={{background:'rgba(255,255,255,0.04)', borderRadius:12, padding:'1rem', textAlign:'center'}}>
              <p style={{fontSize:'1.2rem', fontWeight:800, color:'#34d399'}}>${fmt(result.savings_5_yr, 0)}</p>
              <p style={{fontSize:'.7rem', fontWeight:800, textTransform:'uppercase', color:'#94a3b8', letterSpacing:'.05em', marginTop:'.2rem'}}>5 Years Savings</p>
            </div>
          </div>
        </div>

        {/* Summary Bar */}
        <div style={{background:'rgba(0,0,0,0.2)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:16, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1.5rem 2rem', marginBottom:'2rem', color:'#fff'}}>
          <div>
            <p style={{fontSize:'.75rem', fontWeight:800, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.05em'}}>Total Volume</p>
            <p style={{fontSize:'1.5rem', fontWeight:900, marginTop:'.2rem'}}>${fmt(result.total_amount)}</p>
          </div>
          <div>
            <p style={{fontSize:'.75rem', fontWeight:800, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.05em'}}>Transactions</p>
            <p style={{fontSize:'1.5rem', fontWeight:900, marginTop:'.2rem'}}>{fmt(result.total_count, 0)}</p>
          </div>
          <div>
            <p style={{fontSize:'.75rem', fontWeight:800, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.05em'}}>Fees Paid</p>
            <p style={{fontSize:'1.5rem', fontWeight:900, color:'#fbbf24', marginTop:'.2rem'}}>${fmt(result.total_fees_paid)}</p>
          </div>
          <div>
            <p style={{fontSize:'.75rem', fontWeight:800, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.05em'}}>Adit Pay Fees</p>
            <p style={{fontSize:'1.5rem', fontWeight:900, color:'#34d399', marginTop:'.2rem'}}>${fmt(result.adit_total_fee)}</p>
          </div>
          <div>
            <p style={{fontSize:'.75rem', fontWeight:800, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.05em'}}>Monthly Savings</p>
            <p style={{fontSize:'1.5rem', fontWeight:900, color:'#34d399', marginTop:'.2rem'}}>${fmt(result.savings)}</p>
          </div>
        </div>

        {/* Detailed Component Tables */}
        <div style={{border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, marginBottom:'2rem', overflow:'hidden'}}>
          <div style={{background:'rgba(255,255,255,0.05)', padding:'1rem 1.5rem', borderBottom:'1px solid rgba(255,255,255,0.1)', display:'flex', alignItems:'center', gap:'.5rem'}}>
            <FileText size={16} color="#94a3b8"/>
            <span style={{fontSize:'.9rem', fontWeight:800, color:'#fff'}}>Existing Merchant</span>
          </div>
          <table style={ltbl}>
            <thead><tr><ThL>Merchant</ThL><ThL>Trn Amt</ThL><ThL>Count</ThL><ThL>Fee Paid</ThL><ThL>Avg %</ThL><ThL>% of Trn</ThL></tr></thead>
            <tbody>
              <tr><TdL bold>{result.existing_merchant}</TdL><TdL>${fmt(result.total_amount)}</TdL><TdL>{fmt(result.total_count, 0)}</TdL><TdL bold color="#fbbf24">${fmt(result.total_fees_paid)}</TdL><TdL>{fmt(result.existing_avg_fee_pct)}%</TdL><TdL>100%</TdL></tr>
            </tbody>
          </table>
        </div>

        <div style={{border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, marginBottom:'2rem', overflow:'hidden'}}>
          <div style={{background:'rgba(245,158,11,0.15)', borderTop:'2px solid rgba(245,158,11,0.5)', padding:'1rem 1.5rem', borderBottom:'1px solid rgba(255,255,255,0.1)', display:'flex', alignItems:'center', gap:'.5rem'}}>
            <Sparkles size={16} color="#fbbf24"/>
            <span style={{fontSize:'.9rem', fontWeight:800, color:'#fbbf24'}}>Adit Pay Target Pricing</span>
          </div>
          <table style={ltbl}>
            <thead><tr><ThL>Type</ThL><ThL>Trn Amt</ThL><ThL>Count</ThL><ThL>Fee Paid</ThL><ThL>Rate</ThL><ThL>% of Trn</ThL></tr></thead>
            <tbody>
              {result.adit_rows.map((r,i)=>(
                <tr key={i} style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                  <TdL>{r.type}</TdL>
                  <TdL>${fmt(r.amount)}</TdL>
                  <TdL>{fmt(r.count, 1)}</TdL>
                  <TdL>${fmt(r.total_fee)}</TdL>
                  <TdL><span style={{background:'rgba(255,255,255,0.1)', padding:'2px 8px', borderRadius:100, fontSize:'.8rem'}}>{r.rate_label}</span></TdL>
                  <TdL>{i===0?'90%':'10%'}</TdL>
                </tr>
              ))}
              <tr style={{background:'rgba(255,255,255,0.03)'}}>
                <TdL bold>Total</TdL>
                <TdL bold>${fmt(result.total_amount)}</TdL>
                <TdL bold>{fmt(result.total_count, 0)}</TdL>
                <TdL bold color="#34d399">${fmt(result.adit_total_fee)}</TdL>
                <TdL bold>{fmt(result.adit_avg_fee_pct)}%</TdL>
                <TdL bold>100%</TdL>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Hero Savings Block */}
        <div style={{background:pos ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border:pos ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(239,68,68,0.3)', borderRadius:16, padding:'2.5rem', display:'flex', justifyContent:'space-between', alignItems:'flex-end'}}>
          <div>
            <p style={{fontSize:'.85rem', fontWeight:800, textTransform:'uppercase', color:pos ? '#34d399' : '#f87171', letterSpacing:'.05em'}}>
              Total {pos ? 'Savings' : 'Cost'} with Adit Pay
            </p>
            <p style={{fontSize:'4.5rem', fontWeight:900, color:pos ? '#34d399' : '#f87171', lineHeight:1, marginTop:'.5rem', letterSpacing:'-.03em'}}>
              ${fmt(Math.abs(result.savings))}
            </p>
            <p style={{fontSize:'.95rem', color:pos ? '#34d399' : '#f87171', fontWeight:600, marginTop:'.5rem'}}>
              this month • ${fmt(Math.abs(result.savings_1_yr))} annually
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}

const ltbl = { width:'100%', borderCollapse:'collapse', fontSize:'.9rem', textAlign:'left' }
const ThL = ({children}) => <th style={{padding:'1rem 1.5rem', color:'#94a3b8', fontWeight:800, fontSize:'.75rem', textTransform:'uppercase', letterSpacing:'.05em', borderBottom:'1px solid rgba(255,255,255,.1)'}}>{children}</th>
const TdL = ({children, bold, color}) => <td style={{padding:'1rem 1.5rem', color: color || '#fff', fontWeight: bold ? 800 : 500, fontFamily:'monospace', fontSize:'.95rem'}}>{children}</td>

// ── Global History Dashboard Tab ──────────────────────────────────────────────
function HistoryDashboard() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/api/history`, {credentials: 'include'})
      .then(r => r.json())
      .then(d => { setHistory(d.history || []); setLoading(false) })
  }, [])

  if (loading) return <div style={{textAlign:'center', padding:'4rem', color:T.muted}}>Loading history database...</div>
  if (history.length === 0) return (
    <Card style={{textAlign:'center', padding:'4rem 2rem'}}>
      <Search size={48} color="rgba(255,255,255,.1)" style={{margin:'0 auto 1rem'}}/>
      <h3 style={{fontSize:'1.2rem', fontWeight:800, color:'#fff'}}>No analyses found</h3>
      <p style={{color:T.muted, marginTop:'.5rem'}}>Upload a statement on the Analyzer tab to begin tracking history.</p>
    </Card>
  )

  const wins = history.filter(h => h.savings >= 0)
  const totalSavings = wins.reduce((acc, h) => acc + h.savings, 0)
  const winRate = history.length > 0 ? (wins.length / history.length) * 100 : 0

  return (
    <div style={{display:'flex', flexDirection:'column', gap:'1.5rem'}}>
      {/* Global KPIs */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'1.5rem'}}>
        <Card style={{padding:'1.75rem'}}>
          <p style={{fontSize:'.8rem', fontWeight:800, color:T.muted, textTransform:'uppercase'}}>Total Pitches</p>
          <p style={{fontSize:'2.5rem', fontWeight:900, color:'#fff', marginTop:'.2rem'}}>{history.length}</p>
        </Card>
        <Card style={{padding:'1.75rem'}}>
          <p style={{fontSize:'.8rem', fontWeight:800, color:T.muted, textTransform:'uppercase'}}>Win Rate</p>
          <p style={{fontSize:'2.5rem', fontWeight:900, color:'#60a5fa', marginTop:'.2rem'}}>{fmt(winRate, 0)}%</p>
        </Card>
        <Card style={{padding:'1.75rem', background:'rgba(16,185,129,.1)', borderColor:'rgba(16,185,129,.3)'}}>
          <p style={{fontSize:'.8rem', fontWeight:800, color:'#34d399', textTransform:'uppercase'}}>Total Monthly Savings Found</p>
          <p style={{fontSize:'2.5rem', fontWeight:900, color:'#34d399', marginTop:'.2rem'}}>${fmt(totalSavings, 0)}</p>
        </Card>
      </div>

      <Card style={{padding:0, overflow:'hidden'}}>
        <div style={{padding:'1.5rem 2rem', borderBottom:`1px solid rgba(255,255,255,.1)`}}>
          <h3 style={{fontSize:'1.1rem', fontWeight:800, color:'#fff'}}>Historical Log</h3>
        </div>
        <table style={ltbl}>
          <thead>
            <tr><ThL>Date</ThL><ThL>Merchant</ThL><ThL>Volume</ThL><ThL>Savings</ThL><ThL>Status</ThL></tr>
          </thead>
          <tbody>
            {history.map(h => (
              <tr key={h.id} style={{borderBottom:`1px solid rgba(255,255,255,.05)`}}>
                <TdL color={T.muted}>{new Date(h.created_at).toLocaleDateString()}</TdL>
                <TdL bold>{h.merchant || 'Unknown'}</TdL>
                <TdL>${fmt(h.total_amount)}</TdL>
                <TdL bold color={h.savings >= 0 ? '#34d399' : '#f87171'}>${fmt(h.savings)}</TdL>
                <TdL>
                  <span style={{
                    padding:'4px 10px', borderRadius:100, fontSize:'.75rem', fontWeight:800,
                    background: h.savings >= 0 ? 'rgba(16,185,129,.2)' : 'rgba(239,68,68,.2)',
                    color: h.savings >= 0 ? '#34d399' : '#fca5a5'
                  }}>
                    {h.savings >= 0 ? 'WON' : 'FAILED'}
                  </span>
                </TdL>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

// ── User Menu ─────────────────────────────────────────────────────────────────
function UserMenu({user}) {
  const [open,setOpen]=useState(false)
  
  return (
    <div style={{position:'relative'}}>
      <button onClick={()=>setOpen(!open)}
        style={{display:'flex',alignItems:'center',gap:8,background:'rgba(255,255,255,.1)',
          border:`1px solid rgba(255,255,255,.2)`,lineHeight:'1.2',borderRadius:100,padding:'6px 12px',
          cursor:'pointer', fontWeight:600, color:'#fff'}}>
        {user.name} <ChevronDown size={14} color={T.muted}/>
      </button>
      {open&&(
        <>
          <div onClick={()=>setOpen(false)} style={{position:'fixed',inset:0,zIndex:50}}/>
          <div style={{position:'absolute',right:0,top:'calc(100% + 8px)',zIndex:100,
            background:'#0f172a',border:`1px solid rgba(255,255,255,.1)`,borderRadius:12,
            padding:'8px',minWidth:220,boxShadow:'0 10px 25px rgba(0,0,0,.5)'}}>
            <div style={{padding:'8px 12px',borderBottom:`1px solid rgba(255,255,255,.1)`,marginBottom:4}}>
              <p style={{fontSize:'.85rem',fontWeight:700,color:'#fff'}}>{user.name}</p>
              <p style={{fontSize:'.75rem',color:T.muted,marginTop:2}}>{user.email}</p>
            </div>
            <a href={`${API}/auth/logout`} style={{display:'flex',alignItems:'center',gap:8,
              padding:'8px 12px',borderRadius:8,textDecoration:'none',color:'#ef4444',
              fontSize:'.85rem',fontWeight:600}}
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

// ── Main App Routing ──────────────────────────────────────────────────────────
export default function App() {
  const [authState,setAuthState]=useState({loading:true,authenticated:false,user:null})
  const [tab, setTab] = useState('analyzer') // 'analyzer' | 'dashboard'
  
  // Analyzer Form State
  const [uploadLoading,setUploadLoading]=useState(false)
  const [calcLoading,setCalcLoading]=useState(false)
  const [result,setResult]=useState(null)
  const [form,setForm]=useState({
    existing_merchant:'',total_amount:'',total_count:'',
    total_fees_paid:'',card_present_pct:'90',mode:'template'
  })
  const set=key=>val=>setForm(f=>({...f,[key]:val}))

  useEffect(()=>{
    fetch(`${API}/api/me`, {credentials: 'include'}).then(r=>r.json()).then(data=>{
      setAuthState({loading:false,authenticated:data.authenticated,user:data.user||null})
    }).catch(()=>setAuthState({loading:false,authenticated:false,user:null}))
  },[])

  const onExtracted=extracted=>{
    setForm(f=>({...f,
      existing_merchant:extracted.merchant||f.existing_merchant,
      total_amount:extracted.total_amount??f.total_amount,
      total_count:extracted.total_count??f.total_count,
      total_fees_paid:extracted.total_fees??f.total_fees_paid,
    }))
    setResult(null)
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

  if(authState.loading) return <div style={{padding:'4rem',textAlign:'center'}}>Loading...</div>
  if(!authState.authenticated) return <LoginPage error={new URLSearchParams(window.location.search).get('error')}/>

  const canCalc=form.total_amount&&form.total_count&&form.total_fees_paid

  return (
    <div style={{minHeight:'100vh', display:'flex', flexDirection:'column', fontFamily:'var(--font-body)'}}>
      
      {/* Top Navigation */}
      <header style={{background:'rgba(10,22,40,0.8)', backdropFilter:'blur(10px)', borderBottom:`1px solid rgba(255,255,255,.1)`, padding:'0 2rem', 
        height:72, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100}}>
        
        <div style={{display:'flex', alignItems:'center', gap:'2.5rem'}}>
          <img src="https://adit.com/storage/settings/logo.png" alt="Adit Logo" style={{height:28, filter:'brightness(0) invert(1)'}} onError={(e)=>{e.target.style.display='none'}}/>
          
          <nav style={{display:'flex', gap:'1rem'}}>
            <button onClick={()=>setTab('analyzer')} style={{
              background:tab==='analyzer'?'rgba(255,255,255,.1)':'transparent', color:tab==='analyzer'?'#fff':T.muted,
              border:'none', padding:'8px 16px', borderRadius:8, fontWeight:700, cursor:'pointer', fontSize:'.95rem'
            }}>Analyzer</button>
            <button onClick={()=>setTab('dashboard')} style={{
              background:tab==='dashboard'?'rgba(255,255,255,.1)':'transparent', color:tab==='dashboard'?'#fff':T.muted,
              border:'none', padding:'8px 16px', borderRadius:8, fontWeight:700, cursor:'pointer', fontSize:'.95rem'
            }}>History Dashboard</button>
          </nav>
        </div>

        <UserMenu user={authState.user}/>
      </header>

      {/* Main Content Area */}
      <main style={{maxWidth:1080, margin:'0 auto', padding:'3rem 1.5rem', width:'100%', flex:1}}>
        
        {tab === 'dashboard' ? (
          <HistoryDashboard />
        ) : (
          <div style={{display:'flex', flexDirection:'column', gap:'1.5rem'}}>
            <div style={{textAlign:'center', marginBottom:'1.5rem'}}>
              <h1 style={{fontSize:'2.2rem', fontWeight:900, color:'#fff', letterSpacing:'-.02em'}}>Adit Statement Analysis</h1>
              <p style={{color:T.muted, fontSize:'1.05rem', marginTop:'.5rem'}}>Extract statements and prepare a compelling Adit Pay pitch.</p>
            </div>

            <Card>
              <SectionTitle icon={FileText}>Step 1 — Upload Statement</SectionTitle>
              <UploadZone onExtracted={onExtracted} setLoading={setUploadLoading} loading={uploadLoading}/>
            </Card>

            <Card>
              <SectionTitle icon={Pencil}>Step 2 — Review & Edit Figures</SectionTitle>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:'1.5rem',marginBottom:'2rem'}}>
                <Field label="Original Merchant" value={form.existing_merchant} onChange={set('existing_merchant')} />
                <Field label="Gross Transaction Volume" value={form.total_amount} onChange={set('total_amount')} type="number" step="0.01" prefix="$" />
                <Field label="Total Transactions" value={form.total_count} onChange={set('total_count')} type="number" step="1" />
                <Field label="Total Fees Assessed" value={form.total_fees_paid} onChange={set('total_fees_paid')} type="number" step="0.01" prefix="$" />
              </div>

              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:`1px solid ${T.border}`, paddingTop:'1.5rem'}}>
                <div>
                  <p style={{fontWeight:700, color:'#fff', fontSize:'.9rem'}}>Ready to verify?</p>
                  <p style={{fontSize:'.8rem', color:T.muted}}>Ensure numbers match the source DB before proceeding.</p>
                </div>
                <button onClick={calculate} disabled={calcLoading||!canCalc}
                  style={{display:'flex',alignItems:'center',gap:'.6rem', background:canCalc?'#00c8b4':'rgba(255,255,255,.1)', 
                    color:'#fff',border:'none', padding:'.85rem 2.5rem',borderRadius:100,fontWeight:700,fontSize:'.95rem',
                    cursor:canCalc?'pointer':'not-allowed', transition:'all .2s', boxShadow:canCalc?'0 4px 14px rgba(0,200,180,.3)':'none'}}>
                  {calcLoading?<RefreshCw size={18} className="spin"/>:<Calculator size={18}/>}
                  {calcLoading?'Running Audit':'Generate Proposal'}
                </button>
              </div>
            </Card>

            {result&&(
              <div id="results-anchor" style={{marginTop:'1.5rem'}}>
                <AnalysisDashboard result={result}/>
              </div>
            )}
          </div>
        )}
      </main>
      
      <footer style={{textAlign:'center', padding:'2rem', color:T.muted, fontSize:'.85rem'}}>
        © {new Date().getFullYear()} Adit Communications, Inc. All rights reserved.
      </footer>
    </div>
  )
}
