import React, { useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  ArrowRight, ShieldCheck, ScanLine, BrainCircuit, Smartphone, LockKeyhole,
  TriangleAlert, CheckCircle2, Search, Menu, X, Bell, Activity, QrCode,
  MessageSquareText, History, ChevronRight, Zap, Eye, Fingerprint, WifiOff
} from 'lucide-react'
import './styles.css'

const scenarios = {
  kyc: {
    vpa: 'hdfc-kyc@upi', amount: 2499, source: 'SMS link',
    purpose: 'KYC verification', familiarity: 'New payee',
    score: 94, level: 'HIGH RISK',
    reason: 'Look-alike bank handle combined with an urgent KYC payment request.',
    signals: ['Bank-name look-alike', 'KYC language', 'SMS payment origin', 'New payee', 'Unusual purpose'],
  },
  qr: {
    vpa: 'quickmart.247@upi', amount: 850, source: 'QR code',
    purpose: 'Shop purchase', familiarity: 'New payee',
    score: 67, level: 'SUSPICIOUS',
    reason: 'The QR destination does not match the trusted merchant profile.',
    signals: ['Merchant mismatch', 'New destination', 'QR-origin transaction'],
  },
  friend: {
    vpa: 'arjun@upi', amount: 500, source: 'Saved contact',
    purpose: 'Personal transfer', familiarity: 'Known payee',
    score: 8, level: 'SAFE',
    reason: 'Known payee, normal amount and no suspicious context detected.',
    signals: ['Known payee', 'Normal amount', 'Trusted source'],
  }
}

function scorePayment(vpa, amount, source, purpose, familiarity) {
  let score = 0
  const signals = []
  const x = vpa.toLowerCase()
  if (/(hdfc|sbi|icici|axis|bank|paytm|phonepe)/.test(x) && /kyc|verification|refund/.test(purpose.toLowerCase())) {
    score += 38; signals.push('Bank-name look-alike')
  }
  if (source === 'SMS link') { score += 20; signals.push('SMS payment origin') }
  if (familiarity === 'New payee') { score += 14; signals.push('New payee') }
  if (Number(amount) >= 5000) { score += 12; signals.push('High transaction amount') }
  if (Number(amount) >= 1500 && /kyc|refund/.test(purpose.toLowerCase())) {
    score += 12; signals.push('Unusual purpose amount')
  }
  if (source === 'QR code') { score += 9; signals.push('QR destination requires verification') }
  if (/quickmart/.test(x)) { score += 18; signals.push('Merchant mismatch') }
  if (familiarity === 'Known payee') score = Math.max(0, score - 35)
  score = Math.min(100, score)
  const level = score >= 71 ? 'HIGH RISK' : score >= 31 ? 'SUSPICIOUS' : 'SAFE'
  return { score, level, signals, reason: signals.length ? signals.join('. ') + '.' : 'No significant suspicious signals detected.' }
}

function Logo() {
  return <div className="brand"><span className="brand-mark"><ShieldCheck size={18}/></span><span>Pay<span className="brand-accent">Sentinel</span></span></div>
}

function RiskBadge({level}) {
  const cls = level === 'HIGH RISK' ? 'risk-high' : level === 'SUSPICIOUS' ? 'risk-mid' : 'risk-safe'
  return <span className={`risk-badge ${cls}`}>{level}</span>
}

function App() {
  const [page, setPage] = useState('home')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [demo, setDemo] = useState('kyc')
  const [analysis, setAnalysis] = useState(scenarios.kyc)
  const [toast, setToast] = useState('')
  const [history, setHistory] = useState([
    {time:'09:41', vpa:'hdfc-kyc@upi', amount:'₹2,499', level:'HIGH RISK', reason:'Look-alike VPA + KYC context'},
    {time:'09:39', vpa:'quickmart.247@upi', amount:'₹850', level:'SUSPICIOUS', reason:'Merchant mismatch'},
    {time:'09:36', vpa:'arjun@upi', amount:'₹500', level:'SAFE', reason:'Known payee'}
  ])

  const notify = (message) => {
    setToast(message)
    window.clearTimeout(window.__psToast)
    window.__psToast = window.setTimeout(() => setToast(''), 2200)
  }

  const runScenario = (name) => {
    setDemo(name)
    setAnalysis(scenarios[name])
    setPage('demo')
    setMobileOpen(false)
  }

  const addHistory = (a) => {
    setHistory(h => [{time:new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}), vpa:a.vpa, amount:`₹${Number(a.amount).toLocaleString()}`, level:a.level, reason:a.reason}, ...h].slice(0,8))
  }

  const nav = [
    ['home','Home'], ['demo','Live Demo'], ['analyze','Analyze'], ['sms','SMS Lens'], ['history','History'], ['architecture','Architecture']
  ]

  return <div className="site">
    <header className="topbar">
      <div className="top-inner">
        <Logo/>
        <nav className="desktop-nav">
          {nav.slice(0,4).map(([id,label]) => <button key={id} className={page===id?'active':''} onClick={()=>setPage(id)}>{label}</button>)}
        </nav>
        <div className="top-actions">
          <span className="privacy-chip"><WifiOff size={13}/> local-first</span>
          <button className="menu-btn" onClick={()=>setMobileOpen(!mobileOpen)}>{mobileOpen?<X/>:<Menu/>}</button>
          <button className="sign-btn" onClick={()=>{setPage('demo');notify('Live protection demo opened')}}>Try Demo <ArrowRight size={15}/></button>
        </div>
      </div>
      {mobileOpen && <div className="mobile-nav">{nav.map(([id,label])=><button key={id} onClick={()=>{setPage(id);setMobileOpen(false)}}>{label}</button>)}</div>}
    </header>

    {page === 'home' && <Home setPage={setPage} runScenario={runScenario}/>}
    {page === 'demo' && <LiveDemo demo={demo} setDemo={setDemo} analysis={analysis} setAnalysis={setAnalysis} notify={notify} addHistory={addHistory}/>}
    {page === 'analyze' && <Analyze notify={notify} addHistory={addHistory}/>}
    {page === 'sms' && <SmsLens notify={notify}/>}
    {page === 'history' && <HistoryPage history={history}/>}
    {page === 'architecture' && <Architecture/>}

    <footer className="footer">
      <Logo/><span>Detect. Warn. Protect.</span><span>Prototype for hackathon demonstration. Core risk engine is simulated locally.</span>
    </footer>
    {toast && <div className="toast"><CheckCircle2 size={17}/>{toast}</div>}
  </div>
}

function Home({setPage,runScenario}) {
  return <main>
    <section className="hero section">
      <div className="hero-copy">
        <div className="eyebrow"><span></span> PAYMENT SECURITY, REIMAGINED</div>
        <h1>Stop the scam at the <em>payment moment.</em></h1>
        <p className="hero-sub">PaySentinel analyzes payment context on the phone and warns users before a suspicious UPI transaction is confirmed.</p>
        <div className="hero-buttons">
          <button className="lime-btn" onClick={()=>setPage('demo')}>Explore live demo <ArrowRight size={17}/></button>
          <button className="outline-btn" onClick={()=>setPage('architecture')}>See architecture</button>
        </div>
        <div className="micro-proof">
          <span><LockKeyhole size={14}/> Local-first analysis</span>
          <span><Zap size={14}/> Fast risk decision</span>
          <span><Eye size={14}/> Explainable verdict</span>
        </div>
      </div>
      <div className="hero-art">
        <div className="orb orb-a"></div><div className="orb orb-b"></div>
        <div className="phone-card">
          <div className="phone-top"><span>UPI PAYMENT</span><span>9:41</span></div>
          <div className="phone-amount">₹2,499</div>
          <div className="phone-payee">hdfc-kyc@upi</div>
          <div className="risk-panel">
            <div className="risk-panel-head"><span className="danger-dot"></span><b>HIGH RISK</b><strong>94</strong></div>
            <p>Look-alike bank handle and KYC payment context detected.</p>
            <button onClick={()=>runScenario('kyc')}>Review before paying <ArrowRight size={14}/></button>
          </div>
          <div className="phone-details"><span>Source</span><b>SMS link</b></div>
          <div className="phone-details"><span>Purpose</span><b>KYC verification</b></div>
        </div>
        <div className="floating-card fc-one"><ShieldCheck size={17}/><div><b>On-device</b><small>No cloud call</small></div></div>
        <div className="floating-card fc-two"><Activity size={17}/><div><b>94 / 100</b><small>Risk detected</small></div></div>
      </div>
    </section>

    <section className="section intro-band">
      <div><div className="eyebrow">BUILT FOR THE LAST SECOND</div><h2>Don't just check the payment. <span>Understand the context.</span></h2></div>
      <p>Fraud often arrives through a story: an urgent KYC request, a fake customer-care message, or a QR code swapped at a shop. PaySentinel combines these signals before the user commits.</p>
    </section>

    <section className="section feature-section">
      <div className="section-heading"><div><div className="eyebrow">THE PROTECTION LAYER</div><h2>Everything important, before you tap Pay.</h2></div><button className="text-btn" onClick={()=>setPage('architecture')}>How it works <ArrowRight size={15}/></button></div>
      <div className="feature-grid">
        <Feature icon={<ScanLine/>} title="Scan the destination" text="Analyze VPA, QR destination, amount and payment source." tone="cream"/>
        <Feature icon={<BrainCircuit/>} title="Score the context" text="Combine identity, behavior and social-engineering signals locally." tone="lime"/>
        <Feature icon={<MessageSquareText/>} title="Explain the risk" text="Turn an opaque score into a reason a normal user can understand." tone="lavender"/>
        <Feature icon={<ShieldCheck/>} title="Shield the payment" text="Allow safe payments, warn suspicious ones and block high-risk flows." tone="mint"/>
      </div>
    </section>

    <section className="section journey-section">
      <div className="eyebrow">SIMPLE BY DESIGN</div><h2>From suspicious message to a clear decision.</h2>
      <div className="journey">
        {[
          ['01','Context arrives','SMS, QR, VPA or payment request'],
          ['02','Signals combine','Multiple indicators are evaluated'],
          ['03','Risk is explained','User sees what triggered the warning'],
          ['04','Action happens','Allow, warn or block before payment']
        ].map((x,i)=><div className="journey-card" key={x[0]}><span>{x[0]}</span><h3>{x[1]}</h3><p>{x[2]}</p>{i<3&&<ChevronRight className="journey-arrow"/>}</div>)}
      </div>
    </section>

    <section className="cta section">
      <div><div className="eyebrow">SEE IT IN ACTION</div><h2>Test a fake KYC payment in seconds.</h2><p>Experience the same decision flow a user would see at the payment moment.</p></div>
      <button className="dark-btn" onClick={()=>setPage('demo')}>Open live demo <ArrowRight size={17}/></button>
    </section>
  </main>
}

function Feature({icon,title,text,tone}) {
  return <article className={`feature ${tone}`}><div className="icon-box">{icon}</div><h3>{title}</h3><p>{text}</p><ArrowRight className="feature-arrow" size={18}/></article>
}

function LiveDemo({demo,setDemo,analysis,setAnalysis,notify,addHistory}) {
  const run=(key)=>{setDemo(key);setAnalysis(scenarios[key])}
  return <main className="app-main section">
    <div className="page-title"><div><div className="eyebrow">LIVE PROTECTION LAB</div><h1>Watch PaySentinel decide.</h1><p>Three realistic payment contexts. One local decision engine.</p></div><span className="status"><span></span> simulation running</span></div>
    <div className="scenario-tabs">{Object.entries(scenarios).map(([k,v])=><button className={demo===k?'selected':''} key={k} onClick={()=>run(k)}><RiskBadge level={v.level}/><b>{k==='kyc'?'Fake KYC':k==='qr'?'Swapped QR':'Known friend'}</b></button>)}</div>
    <div className="demo-grid">
      <div className="phone-stage">
        <div className="abstract-ring r1"></div><div className="abstract-ring r2"></div>
        <div className="demo-phone">
          <div className="demo-phone-bar"><span>Pay</span><span>9:41</span></div>
          <div className="demo-phone-body">
            <small>PAYMENT REQUEST</small><div className="demo-amount">₹{Number(analysis.amount).toLocaleString()}</div>
            <div className="demo-vpa">{analysis.vpa}</div>
            <div className={`demo-alert ${analysis.level==='HIGH RISK'?'danger':analysis.level==='SUSPICIOUS'?'warning':'safe'}`}>
              <div className="alert-title">{analysis.level==='HIGH RISK'?<TriangleAlert/>:<CheckCircle2/>}<b>{analysis.level}</b><strong>{analysis.score}</strong></div>
              <p>{analysis.reason}</p>
              <button onClick={()=>notify(analysis.level==='HIGH RISK'?'Demo: payment blocked':'Demo: '+(analysis.level==='SUSPICIOUS'?'warning shown':'payment allowed'))}>{analysis.level==='HIGH RISK'?'Block payment':analysis.level==='SUSPICIOUS'?'Warn and review':'Pay securely'}</button>
            </div>
            <div className="phone-row"><span>Source</span><b>{analysis.source}</b></div>
            <div className="phone-row"><span>Purpose</span><b>{analysis.purpose}</b></div>
          </div>
        </div>
      </div>
      <div className="analysis-card">
        <div className="analysis-top"><div><span className="muted-label">LOCAL RISK SCORE</span><div className="big-score">{analysis.score}<small>/100</small></div></div><RiskBadge level={analysis.level}/></div>
        <div className="score-line"><span style={{width:`${analysis.score}%`}}></span></div>
        <h3>Signals detected</h3>
        <div className="signal-list">{analysis.signals.map((s,i)=><div key={s}><span>{String(i+1).padStart(2,'0')}</span><b>{s}</b><i>detected</i></div>)}</div>
        <div className="reason-box"><Eye size={17}/><div><b>Why this matters</b><p>{analysis.reason}</p></div></div>
        <div className="demo-stats"><div><span>Inference</span><b>&lt;100ms</b></div><div><span>Cloud calls</span><b>0</b></div><div><span>Decision</span><b>{analysis.level==='HIGH RISK'?'BLOCK':analysis.level==='SUSPICIOUS'?'WARN':'ALLOW'}</b></div></div>
      </div>
    </div>
  </main>
}

function Analyze({notify,addHistory}) {
  const [form,setForm]=useState(scenarios.kyc)
  const [result,setResult]=useState(scenarios.kyc)
  const update=(k,v)=>setForm({...form,[k]:k==='amount'?Number(v):v})
  const run=(e)=>{e.preventDefault();const r=scorePayment(form.vpa,form.amount,form.source,form.purpose,form.familiarity);const a={...form,...r};setResult(a);addHistory(a);notify('Local risk analysis completed')}
  return <main className="app-main section"><div className="page-title"><div><div className="eyebrow">PAYMENT ANALYZER</div><h1>Build your own scenario.</h1><p>Change the transaction context and see which signals move the decision.</p></div></div>
    <div className="analyze-grid">
      <form className="form-card" onSubmit={run}>
        <Field label="Payee / VPA"><input value={form.vpa} onChange={e=>update('vpa',e.target.value)}/></Field>
        <Field label="Amount"><input type="number" min="1" value={form.amount} onChange={e=>update('amount',e.target.value)}/></Field>
        <Field label="Payment source"><select value={form.source} onChange={e=>update('source',e.target.value)}><option>SMS link</option><option>QR code</option><option>Saved contact</option><option>Manual VPA</option></select></Field>
        <Field label="Purpose"><select value={form.purpose} onChange={e=>update('purpose',e.target.value)}><option>KYC verification</option><option>Shop purchase</option><option>Personal transfer</option><option>Refund</option></select></Field>
        <Field label="Payee familiarity"><select value={form.familiarity} onChange={e=>update('familiarity',e.target.value)}><option>New payee</option><option>Known payee</option></select></Field>
        <button className="lime-btn full">Run local analysis <ArrowRight size={16}/></button>
      </form>
      <div className="result-card"><div className="result-head"><div><span className="muted-label">RISK VERDICT</span><div className="result-score">{result.score}<small>/100</small></div></div><RiskBadge level={result.level}/></div><div className="score-line"><span style={{width:`${result.score}%`}}></span></div><p className="result-reason">{result.reason}</p><div className="signal-list">{result.signals.map((s,i)=><div key={s}><span>0{i+1}</span><b>{s}</b><i>signal</i></div>)}</div></div>
    </div>
  </main>
}

function Field({label,children}) { return <label className="field"><span>{label}</span>{children}</label> }

function SmsLens({notify}) {
  const [text,setText]=useState('URGENT: Your HDFC KYC will expire today. Pay ₹2,499 using the secure verification link to avoid account suspension. Customer care.')
  const [signals,setSignals]=useState([])
  const run=()=>{const t=text.toLowerCase();const rules=[['Urgency language',/urgent|immediately|today|expire|within/.test(t)],['KYC / verification',/kyc|verify|verification/.test(t)],['Payment request',/pay|payment|transfer|₹|rs\\.?\\s*\\d+/.test(t)],['Account threat',/block|suspend|deactivate|penalty/.test(t)],['Impersonation cue',/customer care|support|bank/.test(t)]];setSignals(rules);notify('SMS context analyzed')}
  return <main className="app-main section"><div className="page-title"><div><div className="eyebrow">SMS LENS</div><h1>Find the story behind the payment.</h1><p>Extract social-engineering cues before they become payment intent.</p></div></div>
    <div className="sms-grid"><div className="form-card"><label className="field"><span>Message content</span><textarea value={text} onChange={e=>setText(e.target.value)}/></label><button className="lime-btn" onClick={run}>Analyze message <ArrowRight size={16}/></button></div>
    <div className="result-card"><div className="muted-label">EXTRACTED CONTEXT</div>{signals.length===0?<div className="empty">Run the analyzer to extract signals.</div>:signals.map(([name,found])=><div className="sms-row" key={name}><div><b>{name}</b><small>{found?'Pattern matched in message':'No strong match'}</small></div><span className={`tag ${found?'found':'clear'}`}>{found?'DETECTED':'CLEAR'}</span></div>)}</div></div>
  </main>
}

function HistoryPage({history}) {
  return <main className="app-main section"><div className="page-title"><div><div className="eyebrow">LOCAL ACTIVITY</div><h1>Risk history.</h1><p>Recent demonstration decisions that would remain on-device in the intended Android product.</p></div></div>
    <div className="table-card"><div className="table-head"><b>Recent decisions</b><span>Local demo store</span></div>{history.map((r,i)=><div className="history-row" key={i}><span>{r.time}</span><b>{r.vpa}</b><span>{r.amount}</span><RiskBadge level={r.level}/><small>{r.reason}</small></div>)}</div>
  </main>
}

function Architecture() {
  const blocks=[['INPUT LAYER','QR / VPA','Payment destination and merchant identity'],['CONTEXT LAYER','SMS + SOURCE','Social engineering and payment origin'],['FEATURE ENGINE','MULTI-SIGNAL','Identity, amount, behavior and history'],['AI LAYER','ON-DEVICE MODEL','Rules + quantized model for low latency'],['DECISION LAYER','RISK 0–100','Explainable score and confidence'],['ACTION LAYER','ALLOW / WARN / BLOCK','Only risky payments create friction']]
  return <main className="app-main section"><div className="page-title"><div><div className="eyebrow">TECHNICAL ARCHITECTURE</div><h1>Context in. Protection out.</h1><p>The prototype mirrors the intended phone-first pipeline.</p></div></div>
    <div className="architecture-flow">{blocks.map((b,i)=><React.Fragment key={b[0]}><div className="arch-block"><span>{b[0]}</span><b>{b[1]}</b><small>{b[2]}</small></div>{i<blocks.length-1&&<ArrowRight className="arch-arrow"/>}</React.Fragment>)}</div>
    <div className="arch-notes"><div><Smartphone/><h3>Phone as security boundary</h3><p>Keep the core risk decision local to minimize latency and reduce sensitive data movement.</p></div><div><BrainCircuit/><h3>Explainable intelligence</h3><p>Every verdict can show which signals contributed to the decision instead of presenting a black-box label.</p></div><div><LockKeyhole/><h3>Privacy-first design</h3><p>The web prototype uses simulated data; the Android build can keep analysis and history on-device.</p></div></div>
  </main>
}

createRoot(document.getElementById('root')).render(<App/>)
