import { useState, useCallback, useRef, useEffect } from 'react'
import {
  Upload, FileText, Calculator, CheckCircle2, AlertCircle,
  ChevronDown, ChevronUp, Pencil, RefreshCw, TrendingDown,
  DollarSign, Hash, Percent, Sparkles, ArrowRight, BarChart3,
  LogOut, Lock, ShieldCheck
} from 'lucide-react'

const API = ''

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

// ── Design atoms ──────────────────────────────────────────────────────────────

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
    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:'1.25rem'}}>
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

function StatBox({icon:Icon,label,value,accent=T.teal,delay=0}) {
  return (
    <div style={{animationDelay:`${delay}s`}}>
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,
        padding:'1.1rem 1.25rem',display:'flex',alignItems:'center',gap:'1rem',
        position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:accent}}/>
        <div style={{width:40,height:40,borderRadius:10,flexShrink:0,
          background:`linear-gradient(135deg,${accent}22,${accent}11)`,
          border:`1px solid ${accent}33`,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <Icon size={18} color={accent}/>
        </div>
        <div>
          <p style={{fontSize:'.7rem',fontWeight:700,color:T.muted,textTransform:'uppercase',
            letterSpacing:'.07em',fontFamily:'var(--font-head)'}}>{label}</p>
          <p style={{fontSize:'1.2rem',fontWeight:800,color:T.white,
            fontFamily:'var(--font-head)',marginTop:1}}>{value}</p>
        </div>
      </div>
    </div>
  )
}

// ── Login Page ─────────────────────────────────────────────────────────────────
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

      {/* Background glow */}
      <div style={{position:'fixed',inset:0,pointerEvents:'none',
        background:'radial-gradient(ellipse 60% 60% at 50% 40%,rgba(0,200,180,.1) 0%,transparent 70%)'}}/> 

      <div style={{width:'100%',maxWidth:420,position:'relative',zIndex:1}}>

        {/* Logo */}
        <div style={{textAlign:'center',marginBottom:'2.5rem'}}>
          <div style={{fontFamily:'var(--font-head)',fontWeight:800,fontSize:'2.2rem',
            background:T.grad,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',
            letterSpacing:'-.02em',marginBottom:'.5rem'}}>
            Adit
          </div>
          <TealBadge><ShieldCheck size={11}/> Internal Tool</TealBadge>
        </div>

        {/* Card */}
        <div style={{background:'rgba(255,255,255,.05)',border:`1px solid ${T.border}`,
          borderRadius:20,backdropFilter:'blur(16px)',WebkitBackdropFilter:'blur(16px)',
          padding:'2.25rem 2rem'}}>

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
              Sign in with your <span style={{color:T.teal,fontWeight:700}}>@adit.com</span> Google account.
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

          {/* Google SSO button */}
          <a href="/auth/login"
            onMouseEnter={()=>setHovered(true)}
            onMouseLeave={()=>setHovered(false)}
            style={{display:'flex',alignItems:'center',justifyContent:'center',gap:12,
              width:'100%',padding:'.85rem',borderRadius:12,textDecoration:'none',
              border:`1px solid ${hovered?'rgba(0,200,180,.5)':T.border}`,
              background:hovered?'rgba(0,200,180,.1)':'rgba(255,255,255,.06)',
              transition:'all .2s',cursor:'pointer'}}>
            {/* Google icon */}
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span style={{fontFamily:'var(--font-head)',fontWeight:700,fontSize:'.92rem',color:T.white}}>
              Continue with Google
            </span>
          </a>

          <p style={{textAlign:'center',fontSize:'.72rem',color:T.muted,marginTop:'1.25rem',lineHeight:1.6}}>
            Only <strong style={{color:T.teal}}>@adit.com</strong> accounts will be granted access.<br/>
            Non-Adit accounts will be rejected automatically.
          </p>
        </div>

        <p style={{textAlign:'center',fontSize:'.72rem',color:T.muted,marginTop:'1.25rem'}}>
          © {new Date().getFullYear()} Adit Communications, Inc.
        </p>
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
      const res=await fetch(`${API}/api/upload`,{method:'POST',body:fd})
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
        style={{border:`2px dashed ${drag?T.teal:T.border}`,borderRadius:14,
          padding:'2.75rem 1.5rem',textAlign:'center',cursor:'pointer',
          background:drag?'rgba(0,200,180,.06)':'rgba(255,255,255,.02)',
          transition:'all .25s',position:'relative',overflow:'hidden'}}>
        {drag&&<div style={{position:'absolute',inset:0,pointerEvents:'none',
          background:'radial-gradient(ellipse 60% 60% at 50% 50%,rgba(0,200,180,.08),transparent)'}}/>}
        <div style={{width:56,height:56,borderRadius:16,margin:'0 auto 1rem',
          background:drag?T.grad:'rgba(255,255,255,.06)',border:`1px solid ${drag?'transparent':T.border}`,
          display:'flex',alignItems:'center',justifyContent:'center',transition:'all .25s'}}>
          <Upload size={24} color={drag?'#fff':T.teal}/>
        </div>
        {fileName&&!loading ? (
          <><p style={{fontWeight:700,fontSize:'1rem',color:T.teal,fontFamily:'var(--font-head)'}}>{fileName}</p>
          <p style={{fontSize:'.82rem',color:T.muted,marginTop:'.35rem'}}>Extracted — review figures below ↓</p></>
        ) : loading ? (
          <><p style={{fontWeight:700,color:T.white,fontFamily:'var(--font-head)'}}>Extracting data…</p>
          <p style={{fontSize:'.82rem',color:T.muted,marginTop:'.35rem'}}>Running OCR on your statement</p></>
        ) : (
          <><p style={{fontWeight:700,fontSize:'1rem',color:T.white,fontFamily:'var(--font-head)'}}>
            Drop your bank statement here</p>
          <p style={{fontSize:'.82rem',color:T.muted,marginTop:'.4rem'}}>
            PDF or scanned image (PNG, JPG, TIFF) · Click to browse</p></>
        )}
        <input ref={ref} type="file" accept=".pdf,.png,.jpg,.jpeg,.tiff,.bmp,.webp"
          style={{display:'none'}} onChange={e=>handleFile(e.target.files[0])}/>
      </div>
      {error&&(
        <div style={{marginTop:'.85rem',display:'flex',gap:'.6rem',alignItems:'flex-start',
          color:'#fca5a5',background:'rgba(239,68,68,.12)',border:'1px solid rgba(239,68,68,.25)',
          borderRadius:10,padding:'.65rem 1rem',fontSize:'.85rem'}}>
          <AlertCircle size={16} style={{flexShrink:0,marginTop:1}}/>{error}
        </div>
      )}
      <p style={{fontSize:'.76rem',color:T.muted,textAlign:'center',marginTop:'1rem'}}>
        No statement yet? Fill in the figures manually below ↓
      </p>
    </div>
  )
}

// ── Results Table ─────────────────────────────────────────────────────────────
function ResultsTable({result}) {
  const pos=result.savings>=0
  return (
    <div style={{display:'flex',flexDirection:'column',gap:'1.5rem'}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:'1rem'}}>
        <StatBox icon={DollarSign}  label="Total Trn Amount"    value={fmtC(result.total_amount)}        accent={T.teal}    delay={0}/>
        <StatBox icon={Hash}        label="Total Trn Count"     value={fmt(result.total_count,0)}         accent={T.blue}    delay={.06}/>
        <StatBox icon={Percent}     label="Existing Avg Fee"    value={fmtP(result.existing_avg_fee_pct)} accent="#818cf8"   delay={.12}/>
        <StatBox icon={TrendingDown} label="Savings with Adit"  value={fmtC(result.savings)}
          accent={pos?T.success:T.danger} delay={.18}/>
      </div>

      <div>
        <p style={{fontSize:'.72rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',
          color:T.teal,marginBottom:'.65rem',fontFamily:'var(--font-head)'}}>Existing Merchant</p>
        <div style={{overflowX:'auto'}}>
          <table style={tblStyle}>
            <thead><tr>{['Merchant','Total Trn Amt','No. of Trn','Total Fee Paid','Avg Fee %','% of Type'].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
            <tbody>
              <tr>
                <Td bold>{result.existing_merchant}</Td>
                <Td>{fmtC(result.total_amount)}</Td>
                <Td>{fmt(result.total_count,0)}</Td>
                <Td>{fmtC(result.total_fees_paid)}</Td>
                <Td>{fmtP(result.existing_avg_fee_pct)}</Td>
                <Td>100%</Td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <p style={{fontSize:'.72rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',
          color:T.teal,marginBottom:'.65rem',fontFamily:'var(--font-head)'}}>Adit Pay Comparison</p>
        <div style={{overflowX:'auto'}}>
          <table style={tblStyle}>
            <thead><tr>{['Type','Total Trn Amt','No. of Trn','Trn Fee','Auth Fee','Total Fee','Rate','% of Type'].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
            <tbody>
              {result.adit_rows.map((row,i)=>(
                <tr key={i} style={{background:i%2===0?'rgba(255,255,255,.03)':'transparent'}}>
                  <Td>{row.type}</Td><Td>{fmtC(row.amount)}</Td><Td>{fmt(row.count,1)}</Td>
                  <Td>{fmtC(row.trn_fee)}</Td><Td>{fmtC(row.auth_fee)}</Td>
                  <Td bold teal>{fmtC(row.total_fee)}</Td>
                  <Td><span style={{background:'rgba(0,200,180,.12)',color:T.teal,borderRadius:100,
                    padding:'2px 10px',fontSize:'.78rem',fontWeight:700}}>{row.rate_label}</span></Td>
                  <Td>—</Td>
                </tr>
              ))}
              <tr style={{background:'rgba(0,200,180,.06)',borderTop:'1px solid rgba(0,200,180,.2)'}}>
                <Td bold teal>Total</Td><Td bold>{fmtC(result.total_amount)}</Td>
                <Td bold>{fmt(result.total_count,0)}</Td><Td>—</Td><Td>—</Td>
                <Td bold teal>{fmtC(result.adit_total_fee)}</Td>
                <Td bold>{fmtP(result.adit_avg_fee_pct)}</Td><Td bold>100%</Td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div style={{borderRadius:14,padding:'1.25rem 1.5rem',
        background:pos?'rgba(16,185,129,.1)':'rgba(239,68,68,.1)',
        border:`1px solid ${pos?'rgba(16,185,129,.3)':'rgba(239,68,68,.3)'}`,
        display:'flex',alignItems:'center',gap:'1rem'}}>
        <div style={{width:44,height:44,borderRadius:12,flexShrink:0,
          background:pos?'rgba(16,185,129,.2)':'rgba(239,68,68,.2)',
          display:'flex',alignItems:'center',justifyContent:'center'}}>
          {pos?<CheckCircle2 size={22} color={T.success}/>:<AlertCircle size={22} color={T.danger}/>}
        </div>
        <div>
          <p style={{fontWeight:800,fontSize:'1.05rem',color:pos?T.success:T.danger,fontFamily:'var(--font-head)'}}>
            {pos?`Total savings with Adit Pay: ${fmtC(result.savings)}`
               :`Adit Pay costs ${fmtC(Math.abs(result.savings))} more in this scenario`}
          </p>
          <p style={{fontSize:'.8rem',color:T.muted,marginTop:'.2rem'}}>
            Current fees {fmtC(result.total_fees_paid)} → Adit Pay fees {fmtC(result.adit_total_fee)}
          </p>
        </div>
      </div>
    </div>
  )
}

const tblStyle={width:'100%',borderCollapse:'collapse',fontSize:'.84rem',
  border:`1px solid ${T.border}`,borderRadius:12}
const Th=({children})=>(
  <th style={{background:'rgba(255,255,255,.06)',color:T.muted,padding:'.55rem .85rem',
    textAlign:'left',fontWeight:700,fontSize:'.72rem',textTransform:'uppercase',
    letterSpacing:'.06em',whiteSpace:'nowrap',fontFamily:'var(--font-head)',
    borderBottom:`1px solid ${T.border}`}}>{children}</th>)
const Td=({children,bold,teal})=>(
  <td style={{padding:'.5rem .85rem',borderBottom:'1px solid rgba(255,255,255,.05)',
    whiteSpace:'nowrap',color:teal?T.teal:T.white,fontWeight:bold?700:400}}>{children}</td>)

// ── User avatar / dropdown ────────────────────────────────────────────────────
function UserMenu({user}) {
  const [open,setOpen]=useState(false)
  const initials=user.name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)
  return (
    <div style={{position:'relative'}}>
      <button onClick={()=>setOpen(o=>!o)}
        style={{display:'flex',alignItems:'center',gap:8,background:'rgba(255,255,255,.08)',
          border:`1px solid ${T.border}`,borderRadius:100,padding:'5px 10px 5px 5px',
          cursor:'pointer',transition:'background .2s'}}
        onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.13)'}
        onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,.08)'}>
        {user.picture
          ? <img src={user.picture} alt={user.name} style={{width:28,height:28,borderRadius:'50%',objectFit:'cover'}}/>
          : <div style={{width:28,height:28,borderRadius:'50%',background:T.grad,
              display:'flex',alignItems:'center',justifyContent:'center',
              fontSize:'.72rem',fontWeight:800,color:'#fff',fontFamily:'var(--font-head)'}}>
              {initials}
            </div>
        }
        <span style={{fontSize:'.8rem',fontWeight:600,color:T.white,fontFamily:'var(--font-head)',
          maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
          {user.name}
        </span>
        <ChevronDown size={13} color={T.muted}/>
      </button>
      {open&&(
        <>
          <div onClick={()=>setOpen(false)} style={{position:'fixed',inset:0,zIndex:50}}/>
          <div style={{position:'absolute',right:0,top:'calc(100% + 8px)',zIndex:100,
            background:'#0f2044',border:`1px solid ${T.border}`,borderRadius:12,
            padding:'6px',minWidth:220,boxShadow:'0 8px 32px rgba(0,0,0,.4)'}}>
            <div style={{padding:'10px 12px',borderBottom:`1px solid ${T.border}`,marginBottom:4}}>
              <p style={{fontSize:'.82rem',fontWeight:700,color:T.white,fontFamily:'var(--font-head)'}}>{user.name}</p>
              <p style={{fontSize:'.75rem',color:T.teal,marginTop:2}}>{user.email}</p>
              <div style={{display:'inline-flex',alignItems:'center',gap:4,marginTop:6,
                background:'rgba(16,185,129,.12)',border:'1px solid rgba(16,185,129,.25)',
                borderRadius:100,padding:'2px 8px',fontSize:'.65rem',fontWeight:700,
                color:T.success,fontFamily:'var(--font-head)',textTransform:'uppercase',letterSpacing:'.06em'}}>
                <ShieldCheck size={10}/> Adit Verified
              </div>
            </div>
            <a href="/auth/logout" style={{display:'flex',alignItems:'center',gap:8,
              padding:'8px 12px',borderRadius:8,textDecoration:'none',color:'#fca5a5',
              fontSize:'.82rem',fontWeight:600,fontFamily:'var(--font-head)',
              transition:'background .15s'}}
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

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [authState,setAuthState]=useState({loading:true,authenticated:false,user:null})
  const [uploadLoading,setUploadLoading]=useState(false)
  const [calcLoading,setCalcLoading]=useState(false)
  const [result,setResult]=useState(null)
  const [showRaw,setShowRaw]=useState(false)

  const [form,setForm]=useState({
    existing_merchant:'',total_amount:'',total_count:'',
    total_fees_paid:'',card_present_pct:'90',mode:'template'
  })
  const set=key=>val=>setForm(f=>({...f,[key]:val}))

  // Check auth on mount
  useEffect(()=>{
    fetch('/api/me').then(r=>r.json()).then(data=>{
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
    window._rawText=extracted.raw_text
  }

  const calculate=async()=>{
    setCalcLoading(true)
    try {
      const res=await fetch(`${API}/api/calculate`,{
        method:'POST',headers:{'Content-Type':'application/json'},
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

  // Loading spinner
  if(authState.loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'1rem'}}>
        <div style={{width:42,height:42,borderRadius:'50%',border:`3px solid rgba(0,200,180,.2)`,
          borderTopColor:T.teal,animation:'spin .8s linear infinite'}}/>
        <p style={{color:T.muted,fontSize:'.85rem',fontFamily:'var(--font-head)'}}>Loading…</p>
      </div>
    </div>
  )

  // Not authenticated → login page
  if(!authState.authenticated) {
    const params=new URLSearchParams(window.location.search)
    return <LoginPage error={params.get('error')}/>
  }

  // Authenticated → main app
  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column'}}>

      {/* Header */}
      <header style={{background:'rgba(10,22,40,.85)',backdropFilter:'blur(16px)',
        WebkitBackdropFilter:'blur(16px)',borderBottom:`1px solid ${T.border}`,
        position:'sticky',top:0,zIndex:100,padding:'0 2rem',height:68,
        display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:'.85rem'}}>
          <div style={{fontFamily:'var(--font-head)',fontWeight:800,fontSize:'1.35rem',
            background:T.grad,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',
            letterSpacing:'-.01em'}}>Adit</div>
          <div style={{width:1,height:22,background:T.border}}/>
          <span style={{fontFamily:'var(--font-head)',fontWeight:500,fontSize:'.9rem',color:T.muted}}>
            Pay — Statement Analyser
          </span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
          <a href="https://adit.com/dental-billing-software" target="_blank" rel="noreferrer"
            style={{display:'flex',alignItems:'center',gap:6,background:T.grad,color:'#fff',
              border:'none',padding:'.45rem 1.1rem',borderRadius:100,fontWeight:700,
              fontSize:'.8rem',cursor:'pointer',fontFamily:'var(--font-head)',
              textDecoration:'none',letterSpacing:'.02em'}}>
            Adit Pay <ArrowRight size={13}/>
          </a>
          <UserMenu user={authState.user}/>
        </div>
      </header>

      {/* Hero */}
      <div style={{textAlign:'center',padding:'3.5rem 1.5rem 2rem'}}>
        <TealBadge><Sparkles size={11}/> Adit Pay Pricing Tool</TealBadge>
        <h1 style={{fontFamily:'var(--font-head)',fontWeight:800,
          fontSize:'clamp(1.8rem,4vw,2.8rem)',lineHeight:1.15,marginTop:'1rem',letterSpacing:'-.02em'}}>
          See how much you could save<br/>
          <span style={{background:T.grad,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
            switching to Adit Pay
          </span>
        </h1>
        <p style={{color:T.muted,fontSize:'1rem',maxWidth:520,margin:'.9rem auto 0',lineHeight:1.7}}>
          Upload a bank or processor statement and instantly calculate your savings with Adit Pay's transparent pricing.
        </p>
      </div>

      {/* Main */}
      <main style={{maxWidth:980,margin:'0 auto',padding:'0 1.25rem 4rem',width:'100%',
        display:'flex',flexDirection:'column',gap:'1.5rem'}}>

        <GlassCard>
          <SectionLabel icon={FileText}>Step 1 — Upload Statement</SectionLabel>
          <UploadZone onExtracted={onExtracted} setLoading={setUploadLoading} loading={uploadLoading}/>
        </GlassCard>

        <GlassCard>
          <SectionLabel icon={Pencil}>Step 2 — Review &amp; Edit Figures</SectionLabel>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:'1rem',marginBottom:'1.5rem'}}>
            <Field label="Existing Merchant / Processor" value={form.existing_merchant} onChange={set('existing_merchant')} hint="Name shown on your statement"/>
            <Field label="Total Transaction Amount" value={form.total_amount} onChange={set('total_amount')} type="number" step="0.01" prefix="$" hint="Gross sales"/>
            <Field label="Transaction Count" value={form.total_count} onChange={set('total_count')} type="number" step="1" hint="Number of transactions"/>
            <Field label="Total Fees Paid (Current)" value={form.total_fees_paid} onChange={set('total_fees_paid')} type="number" step="0.01" prefix="$" hint="Processing fees from statement"/>
          </div>

          <div style={{marginBottom:'1.25rem'}}>
            <p style={{fontSize:'.72rem',fontWeight:700,color:T.muted,textTransform:'uppercase',
              letterSpacing:'.07em',marginBottom:'.65rem',fontFamily:'var(--font-head)'}}>Transaction Mix</p>
            <div style={{display:'flex',gap:'.75rem',flexWrap:'wrap'}}>
              {[{val:'template',label:'Card Present + Online'},{val:'card_present_only',label:'Card Present Only'}].map(opt=>{
                const sel=form.mode===opt.val
                return (
                  <button key={opt.val} onClick={()=>set('mode')(opt.val)}
                    style={{padding:'.5rem 1.1rem',borderRadius:100,cursor:'pointer',
                      fontFamily:'var(--font-head)',fontWeight:600,fontSize:'.83rem',
                      border:sel?'1px solid rgba(0,200,180,.5)':`1px solid ${T.border}`,
                      background:sel?'rgba(0,200,180,.12)':'rgba(255,255,255,.04)',
                      color:sel?T.teal:T.muted,transition:'all .18s'}}>
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {form.mode==='template'&&(
            <div style={{marginBottom:'1.5rem'}}>
              <p style={{fontSize:'.72rem',fontWeight:700,color:T.muted,textTransform:'uppercase',
                letterSpacing:'.07em',marginBottom:'.55rem',fontFamily:'var(--font-head)'}}>
                Card Present Split —{' '}
                <span style={{color:T.teal}}>{form.card_present_pct}% Card Present</span>
                {' '}/ {100-Number(form.card_present_pct)}% Online
              </p>
              <input type="range" min="0" max="100" step="1"
                value={form.card_present_pct} onChange={e=>set('card_present_pct')(e.target.value)}
                style={{width:'100%',accentColor:T.teal,cursor:'pointer',height:4}}/>
            </div>
          )}

          <button onClick={calculate} disabled={calcLoading||!canCalc}
            style={{display:'inline-flex',alignItems:'center',gap:'.6rem',
              background:canCalc?T.grad:'rgba(255,255,255,.08)',color:'#fff',border:'none',
              padding:'.75rem 2rem',borderRadius:100,fontWeight:700,fontSize:'.95rem',
              cursor:canCalc?'pointer':'not-allowed',fontFamily:'var(--font-head)',
              opacity:!canCalc?.5:1,transition:'opacity .2s',letterSpacing:'.02em'}}
            onMouseDown={e=>{if(canCalc)e.currentTarget.style.transform='scale(.97)'}}
            onMouseUp={e=>e.currentTarget.style.transform='scale(1)'}>
            {calcLoading?<RefreshCw size={16} className="spin"/>:<Calculator size={16}/>}
            {calcLoading?'Calculating…':'Calculate My Savings'}
          </button>
          {!canCalc&&<p style={{fontSize:'.78rem',color:T.muted,marginTop:'.65rem'}}>
            Fill in Total Amount, Count, and Fees to calculate.
          </p>}
        </GlassCard>

        {result&&(
          <GlassCard id="results-anchor">
            <SectionLabel icon={BarChart3}>Step 3 — Comparison Results</SectionLabel>
            <ResultsTable result={result}/>
          </GlassCard>
        )}

        {window._rawText&&(
          <GlassCard style={{padding:'1rem 1.5rem'}}>
            <button onClick={()=>setShowRaw(r=>!r)}
              style={{display:'flex',alignItems:'center',gap:'.5rem',background:'none',border:'none',
                cursor:'pointer',color:T.muted,fontSize:'.82rem',fontWeight:600,fontFamily:'var(--font-body)'}}>
              {showRaw?<ChevronUp size={14}/>:<ChevronDown size={14}/>} View extracted raw text
            </button>
            {showRaw&&<pre style={{marginTop:'.85rem',fontSize:'.72rem',color:T.muted,
              background:'rgba(255,255,255,.03)',border:`1px solid ${T.border}`,
              borderRadius:10,padding:'1rem',whiteSpace:'pre-wrap',maxHeight:260,overflow:'auto',
              fontFamily:'monospace'}}>{window._rawText}</pre>}
          </GlassCard>
        )}
      </main>

      <footer style={{borderTop:`1px solid ${T.border}`,padding:'1.5rem 2rem',
        display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'1rem',
        background:'rgba(10,22,40,.6)'}}>
        <div style={{fontFamily:'var(--font-head)',fontWeight:800,fontSize:'1rem',
          background:T.grad,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Adit</div>
        <p style={{fontSize:'.78rem',color:T.muted}}>
          © {new Date().getFullYear()} Adit Communications, Inc. ·{' '}
          <a href="https://adit.com/privacy-policy" target="_blank" rel="noreferrer"
            style={{color:T.muted,textDecoration:'underline'}}>Privacy Policy</a>
        </p>
        <a href="https://adit.com/dental-billing-software" target="_blank" rel="noreferrer"
          style={{fontSize:'.78rem',color:T.teal,textDecoration:'none',fontWeight:600,
            fontFamily:'var(--font-head)'}}>Learn about Adit Pay →</a>
      </footer>
    </div>
  )
}
