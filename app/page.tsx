'use client'
import React, { useEffect, useMemo, useState } from 'react'
import Gantt, { CapEvent, Task } from '../components/Gantt'
import Tour, { TourStep } from '../components/Tour'
import { DashboardHeader } from '../components/dashboard/header'
import { ProjectTimeline } from '../components/dashboard/project-timeline'
import { GanttChart } from '../components/dashboard/gantt-chart'
import { AISuggestions } from '../components/dashboard/ai-suggestions'
import { TeamUtilization } from '../components/dashboard/team-utilization'

type Evidence = { taskId?: string; label?: string; daysSaved?: number; value: number; tier: 'H'|'M'|'L'; details: string }
type Token = { minutes:number; source:string; confidence:'High'|'Medium'|'Low' }
function d(offset:number){ const dt=new Date(); dt.setDate(dt.getDate()+offset); return dt.toISOString() }
function daysBetweenISO(a:string,b:string){ return Math.max(1, Math.round((new Date(b).getTime()-new Date(a).getTime())/86400000)) }
const toIntHrs = (m:number)=> Math.round(m/60)

// valuation constants for the demo
const HOURLY_VALUE = 135 // $/freed hr shown in Capacity sources

const STC = {
  perZapRun: 90,
  weeklyStatus: 90,
  makerMinutesPerDay: 60,
  rpaMinutesPerTxn: 1.2,
  serviceMinPerTicket: 7,
  realization: 0.8,
}

// dependsOn is a single string to match Gantt props
const seeded: Task[] = [
  { id:'t1', name:'Design QA', project:'Q4 Sales Enablement', assignees:['u1'], start:d(-12), due:d(+10), baselineDays:4, slackDays:0, codPerDay:7500, mvi:0.84, status:'open', allocatedMinutes:0 },
  { id:'t2', name:'Field Pilot Synthesis', project:'Q4 Sales Enablement', assignees:['u2'], start:d(-10), due:d(+14), baselineDays:3, slackDays:0, codPerDay:3500, mvi:0.77, status:'open', allocatedMinutes:0, capability:true, dependsOn:'t1' },
  { id:'t3', name:'Email Copy v1', project:'Q4 Campaign Email Sprint', assignees:['u3'], start:d(-9), due:d(+7), baselineDays:3, slackDays:1, codPerDay:2500, mvi:0.6, status:'open', allocatedMinutes:0, dependsOn:'t2' },
  { id:'t4', name:'Design Build', project:'Q4 Campaign Email Sprint', assignees:['u4'], start:d(-7), due:d(+20), baselineDays:5, slackDays:2, codPerDay:3000, mvi:0.65, status:'open', allocatedMinutes:0, dependsOn:'t3' },
  { id:'t5', name:'SEO QA', project:'Website Refresh', assignees:['u1'], start:d(-11), due:d(+15), baselineDays:4, slackDays:0, codPerDay:4000, mvi:0.7, status:'open', allocatedMinutes:0, dependsOn:'t4' },
]

export default function Page(){
  const [tasks, setTasks] = useState<Task[]>(seeded)
  const [tokens, setTokens] = useState<Token[]>([])
  const [cap, setCap] = useState<CapEvent[]>([])
  const [evidence, setEvidence] = useState<Evidence[]>([
    { label:'RPA contractor reduction', value:4560, tier:'H', details: 'Reduced contractors by 48h @ $95/h.' },
    { label:'AI Agent cost avoided', value:2847, tier:'H', details: '437 deflected x $6.5/ticket.' },
    { label:'More qualified deals (strategic)', value:67200, tier:'L', details: '12 deals x $5,600 value/deal.' },
  ])

  const [simRPA, setSimRPA] = useState(true)
  const [simSVC, setSimSVC] = useState(true)
  const [project, setProject] = useState<'All'|string>('All')
  const [seededOnce, setSeededOnce] = useState(false)
  const [viewMode, setViewMode] = useState<'executive' | 'product'>('executive')
  const [activeHarvest, setActiveHarvest] = useState<'rpa' | 'service' | 'growth'>('rpa')
  const [selectedProjectForSuggestions, setSelectedProjectForSuggestions] = useState<string | null>(null)
  const [showDownloadPopup, setShowDownloadPopup] = useState(false)

  // Guided tour
  const [tourOpen, setTourOpen] = useState(false)
  const [tourIdx, setTourIdx]   = useState(0)

  useEffect(()=>{ mintCapacity() },[simRPA, simSVC])

  // Initialize with default RPA evidence
  useEffect(()=>{
    const rpa = tokens.find(t=>t.source.includes('RPA'))
    if(rpa && evidence.length === 0){
      const hours = rpa.minutes/60
      const contractorHours = hours * 0.3
      const dollars = contractorHours * 95
      setEvidence([
        { label:'RPA contractor reduction', value:dollars, tier:'H', details: `Reduced contractors by ${Math.round(contractorHours)}h @ $95/h.` }
      ])
    }
  },[tokens, evidence.length])

  // Capacity minting → tokens + weekly capacity pills
  function mintCapacity(){
    const events = [
      { label: 'HubSpot Workflows: automated routing', minutes: 600 * STC.perZapRun, dayOffset: 1, conf: 'High' as const, project: 'Q4 Campaign Email Sprint' },
      { label: 'Microsoft Copilot: shorter weekly meeting', minutes: 30 * 6, dayOffset: 0, conf: 'High' as const, project: 'Q4 Sales Enablement' },
      { label: 'Asana AI: auto-status created', minutes: 6 * STC.weeklyStatus, dayOffset: 2, conf: 'High' as const, project: 'Q4 Sales Enablement' },
      { label: 'Copilot: first draft faster', minutes: 7 * 1 * STC.makerMinutesPerDay, dayOffset: 3, conf: 'Medium' as const, project: 'Q4 Campaign Email Sprint' },
      ...(simRPA ? [{
        label: 'UiPath RPA: data entry automated',
        minutes: 10_000 * STC.rpaMinutesPerTxn * STC.realization,
        dayOffset: 1,
        conf: 'High' as const,
        project: 'Website Refresh'
      }] : []),
      ...(simSVC ? [{
        label: 'Service AI Agent: routine questions resolved',
        minutes: 400 * STC.serviceMinPerTicket,
        dayOffset: 4,
        conf: 'High' as const,
        project: 'Service'
      }] : []),
    ]

    setTokens(events.map(e => ({ minutes: e.minutes, source: e.label, confidence: e.conf })))
    setCap(events.map(e => ({ dayOffset: e.dayOffset, label: e.label, hours: Math.round(e.minutes/60), project: e.project })))
  }

  // Allocate pooled capacity to a task
 function allocate(taskId: string, hours: number){
  let minsNeeded = hours * 60
  const order: Array<'High'|'Medium'|'Low'> = ['High','Medium','Low']
  const newTokens = [...tokens]
  for (const tier of order){
    for (let i=0;i<newTokens.length;i++){
      const t = newTokens[i]
      if (t.confidence !== tier || t.minutes <= 0) continue
      const take = Math.min(t.minutes, minsNeeded)
      newTokens[i] = { ...t, minutes: t.minutes - take }
      minsNeeded -= take
      if (minsNeeded <= 0) break
    }
    if (minsNeeded <= 0) break
  }
  setTokens(newTokens)

  // 8h ≈ 1 day predicted shorten (demo logic)
  setTasks(ts => ts.map(t => {
    if (t.id !== taskId) return t
    const predicted = Math.ceil(hours / 8)
    return { ...t, allocatedMinutes: (t.allocatedMinutes || 0) + hours * 60, predictedDaysSaved: (t.predictedDaysSaved || 0) + predicted }
  }))
}
  


  // Close task with earlier actual date → Operational dollars and ghost tick
function closeTask(taskId: string, iso: string){
  setTasks(ts => {
    const t = ts.find(x => x.id === taskId)
    if (!t) return ts

    // 1) Compare to scheduled due date (what execs expect)
    const schedDur  = Math.max(1, daysBetweenISO(t.start, t.due))      // planned start→due
    const actualDur = Math.max(1, daysBetweenISO(t.start, iso))        // start→actual close
    const daysSaved = Math.max(0, schedDur - actualDur)                // if iso < due → positive
    const value     = daysSaved * t.codPerDay
  const tier: 'H'|'M'|'L' = (t.slackDays <= 0 && daysSaved > 0) ? 'M' : 'L'

    // 2) Optional capability credit (from allocated minutes)
    if (t.capability && t.allocatedMinutes) {
      const capHrs = t.allocatedMinutes / 60
      setEvidence(ev => [
        { label: 'Capability growth', value: capHrs * 120, tier: 'L', details: `${capHrs.toFixed(1)}h x $120/h (proxy)` },
        ...ev
      ])
    }

    // 3) Operational evidence: realized days saved vs due
    setEvidence(ev => [
      { taskId: t.id, daysSaved, value, tier, details: `Closed ${daysSaved.toFixed(1)}d earlier than due; CoD/day $${t.codPerDay.toLocaleString()}.` },
      ...ev
    ])

    // 4) Write back: keep a copy of the original due for the ghost tick; move due earlier; clear prediction
    const plannedDue = t.plannedDue ?? t.due
    return ts.map(x => x.id === taskId
      ? { ...x, status: 'closed', plannedDue, predictedDaysSaved: 0, due: iso }
      : x
    )
  })
}

  // Harvest hard savings
  function harvestRPA(){
    const rpa = tokens.find(t=>t.source.includes('RPA'))
    if(!rpa) return
    const hours = rpa.minutes/60
    const contractorHours = hours * 0.3
    const dollars = contractorHours * 95
    setEvidence(prev=>[
      { label:'RPA contractor reduction', value:dollars, tier:'H', details: `Reduced contractors by ${Math.round(contractorHours)}h @ $95/h.` },
      ...prev.filter(e=>e.label!=='RPA contractor reduction').slice(0,2)
    ])
  }
  function harvestService(){
    const svc = tokens.find(t=>t.source.includes('Service'))
    if(!svc) return
    const tickets = Math.round(svc.minutes / STC.serviceMinPerTicket)
    const dollars = tickets * 6.5
    setEvidence(prev=>[
      { label:'AI Agent cost avoided', value:dollars, tier:'H', details: `${tickets} deflected x $6.5/ticket.` },
      ...prev.filter(e=>e.label!=='AI Agent cost avoided').slice(0,2)
    ])
  }
  function recordSQLLift(n=12){
    setEvidence(prev=>[
      { label:'More qualified deals (strategic)', value:n*5600, tier:'L', details: `${n} deals x $5,600 value/deal.` },
      ...prev.filter(e=>e.label!=='More qualified deals (strategic)').slice(0,2)
    ])
  }

  // 30‑sec demo: allocate → close (earlier than planned due) → harvest → growth
  function runDemo(){
    if(!seededOnce){
      allocate('t1', 8)
      const t1 = tasks.find(t=>t.id==='t1')
      if(t1){
        const earlier = new Date(t1.due); earlier.setDate(earlier.getDate()-1) // 1 day earlier than planned
        closeTask('t1', earlier.toISOString())
      }
      if(simRPA) harvestRPA()
      if(simSVC) harvestService()
      recordSQLLift(12)
      setSeededOnce(true)
    }
    document.getElementById('evidence')?.scrollIntoView({behavior:'smooth'})
  }

  // Guided tour (Next/Back)
  const executiveTourSteps: TourStep[] = [
    { id:'welcome', title:'Welcome to VelocityAI', text:'We turn AI time saved into dollars by mapping high‑value work, redeploying freed time, and booking value only when outcomes are realized.', targetId:'start-guided-demo' },
    { id:'roi-summary', title:'What we measure', text:'Operational (days saved × CoD/day), Cost avoided (hard savings), Strategic (growth/capability).', targetId:'roi-summary' },
    { id:'capacity-toggles', title:'Where time came from', text:'These drivers created free hours this week. Turn them on to populate the capacity ledger and harvestable savings.', targetId:'capacity-toggles', run:()=>{ setSimRPA(true); setSimSVC(true) } },
    { id:'gantt-hotspot', title:'Aim at the current constraint', text:'We score milestones by cost‑of‑delay and slack. Design QA is critical. Let\'s route time here.', targetId:'task-design-qa', run:()=>allocate('t1', 8) },
    { id:'redeploy-panel', title:'Redeploy freed time to high‑value work', text:'We\'ll redeploy 8h from Design to Design QA. That predicts ≈ 1 day earlier finish.', targetId:'redeploy-panel' },
    { id:'operational-realization', title:'Realize dollars on early completion', text:'We count dollars only when outcomes happen. Close this milestone 1 day earlier than scheduled due.', targetId:'task-design-qa', run:()=>{ const t1 = tasks.find(t=>t.id==='t1'); if(t1){ const earlier = new Date(t1.due); earlier.setDate(earlier.getDate()-1); closeTask('t1', earlier.toISOString().split('T')[0]); } } },
    { id:'harvest-cards', title:'Book hard savings', text:'Count contractor hours removed and AI‑answered tickets.', targetId:'harvest-cards', run:()=>{ harvestRPA(); harvestService(); } },
    { id:'growth-recognition', title:'Record strategic lift', text:'Add 12 more qualified deals to recognize growth dollars.', targetId:'harvest-cards', run:()=>{ recordSQLLift(12) } },
    { id:'evidence-log', title:'Audit‑ready evidence', text:'Every dollar has an event chain, tier, and value mapping. Export this report for finance.', targetId:'evidence-log' },
  ]

  const managerTourSteps: TourStep[] = [
    { id:'pm-progress', title:'See the week at a glance', text:'Work in flight, early completion days, and team utilization; your "is the plan working?" snapshot.', targetId:'pm-progress' },
    { id:'pm-timeline', title:'Focus the timeline', text:'Filter to "Q4 Campaign Email Sprint."', targetId:'pm-gantt', run:()=>setProject('Q4 Campaign Email Sprint') },
    { id:'pm-redeploy', title:'Redeploy Content hours', text:'Content team has 85h freed this week. Allocate 6h to Email Copy v1 (near-critical).', targetId:'pm-gantt', run:()=>allocate('t2', 6) },
    { id:'pm-suggestions', title:'Approve smart reassignments', text:'Accept this suggestion to move a task from an overloaded designer to an available one.', targetId:'pm-suggestions', run:()=>setSelectedProjectForSuggestions('Q4 Campaign Email Sprint') },
    { id:'pm-utilization', title:'Fix bottlenecks quickly', text:'Reassign 4h from a low‑utilization engineer to an overloaded one.', targetId:'pm-utilization' },
    { id:'pm-close', title:'Close earlier, book dollars', text:'Mark Email Copy v1 complete 1 day earlier than due.', targetId:'pm-gantt', run:()=>{ const t2 = tasks.find(t=>t.id==='t2'); if(t2){ const earlier = new Date(t2.due); earlier.setDate(earlier.getDate()-1); closeTask('t2', earlier.toISOString().split('T')[0]); } } },
    { id:'pm-wrap', title:'Share the weekly summary', text:'This week\'s early completion, $ booked, and redeploy rate; export to stakeholders.', targetId:'pm-progress' },
  ]

  const steps = useMemo(() => {
    const selectedSteps = viewMode === 'executive' ? executiveTourSteps : managerTourSteps
    console.log('Steps updated for view:', viewMode, 'Total steps:', selectedSteps.length, 'Steps:', selectedSteps.map(s => s.title))
    return selectedSteps
  }, [viewMode])
  function startTour(){ 
    console.log('Tour started, current view:', viewMode, 'steps count:', steps?.length)
    setTourIdx(0)
    setTourOpen(true) 
  }
  function nextStep(){
    const s = steps[tourIdx]; if(s?.run) s.run()
    if(tourIdx < steps.length-1) setTourIdx(tourIdx+1); else setTourOpen(false)
  }
  function prevStep(){ if(tourIdx>0) setTourIdx(tourIdx-1) }

  // Metrics
  const capturedMin = tokens.reduce((a,b)=>a+b.minutes,0)
  const capturedHrs = toIntHrs(capturedMin)
  const allocatedHrs = Math.round(tasks.reduce((a,b)=>a+(b.allocatedMinutes||0),0)/60)
  const redeployRate = capturedHrs>0 ? Math.round(allocatedHrs/capturedHrs*100) : 0

  const opValue = evidence.filter(e=>e.taskId).reduce((a,b)=>a+b.value,0)
  const costAvoided = evidence.filter(e=>e.label?.includes('RPA') || e.label?.includes('Agent')).reduce((a,b)=>a+b.value,0)
  const strategic = evidence.filter(e=>e.label?.includes('qualified') || e.label?.includes('Capability')).reduce((a,b)=>a+b.value,0)
  const total = opValue + costAvoided + strategic
  const dollarsPerFreedHr = capturedHrs>0 ? Math.round(total/capturedHrs) : 0

  const tierSum = (t:'H'|'M'|'L') => evidence.filter(e=>e.tier===t).reduce((a,b)=>a+b.value,0)

  // Project filter
  const projects = Array.from(new Set(tasks.map(t=>t.project)))
  const tasksFiltered = project==='All' ? tasks : tasks.filter(t=>t.project===project)
  const capFiltered = project==='All' ? cap : cap.filter(e=>e.project===project)

  // Grouped capacity sources (table) → hours + $ value/hr
  const groupedSources = useMemo(()=>{
    const map: Record<string,{source:string;confidence:'High'|'Medium'|'Low'; minutes:number}> = {}
    tokens.forEach(t=>{
      const key = t.source
      if(!map[key]) map[key] = { source:key, confidence:t.confidence, minutes:0 }
      map[key].minutes += t.minutes
      if(t.confidence==='Medium' && map[key].confidence==='High') map[key].confidence='Medium'
    })
    return Object.values(map)
  },[tokens])

  return (
    <div className="container">
      {viewMode === 'executive' ? (
        // EXECUTIVE VIEW
        <div style={{minHeight:'100vh',background:'#0a1420'}}>
          {/* Header with Velocity AI branding and demo button */}
          <div style={{background:'linear-gradient(135deg, #0a1420 0%, #101c2c 100%)',padding:'40px 32px',borderBottom:'1px solid #1e3a5f'}} id="start-guided-demo">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',maxWidth:'1400px',margin:'0 auto'}}>
              <div>
                <h1 style={{fontSize:'36px',fontWeight:'800',color:'#ffffff',margin:'0 0 8px 0'}}>Velocity AI</h1>
                <p style={{fontSize:'15px',color:'#9ca3af',margin:'0'}}>Turn AI into dollars</p>
              </div>
              <button 
                className="btn" 
                onClick={startTour}
                style={{padding:'12px 28px',background:'#2563eb',color:'#ffffff',border:'none',borderRadius:'8px',fontSize:'16px',fontWeight:'700',cursor:'pointer',transition:'background 0.2s'}}
              >
                Start a guided demo
              </button>
            </div>
          </div>

          {/* Turn AI time into dollars section with toggle */}
          <div style={{padding:'32px 32px',borderBottom:'1px solid #1e3a5f',maxWidth:'1400px',margin:'0 auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
              <div>
                <h2 style={{fontSize:'24px',fontWeight:'700',color:'#ffffff',margin:'0 0 8px 0'}}>Turn AI time into dollars</h2>
                <p style={{fontSize:'14px',color:'#9ca3af',margin:'0',maxWidth:'700px',lineHeight:'1.6'}}>We connect your AI tools (Copilot, Asana AI, Workflows, RPA, AI Agents), capture the time they create, redeploy it to priority work, and prove dollars—Operational, Cost avoided, Strategic. No forecasts. No timesheets.</p>
              </div>
              {/* View Mode Toggle */}
              <div style={{display:'flex',gap:'12px',alignItems:'center',flexShrink:0,marginLeft:'32px'}}>
                <span style={{fontSize:'13px',color:(viewMode as string) === 'executive' ? '#ffffff' : '#9ca3af'}}>Executive View</span>
                <div 
                  style={{width:'48px',height:'24px',background:'#2563eb',borderRadius:'12px',position:'relative',cursor:'pointer',display:'flex',alignItems:'center',padding:'2px',transition:'all 0.3s ease'}}
                  onClick={() => setViewMode((viewMode as string) === 'executive' ? 'product' : 'executive')}
                >
                  <div style={{width:'20px',height:'20px',background:'#ffffff',borderRadius:'10px',position:'absolute',left:(viewMode as string) === 'executive' ? '2px' : '26px',transition:'left 0.3s ease'}} />
                </div>
                <span style={{fontSize:'13px',color:(viewMode as string) === 'product' ? '#ffffff' : '#9ca3af',cursor:'pointer'}} onClick={() => setViewMode('product')}>Project Manager view</span>
              </div>
            </div>
            {/* Download Reports Button */}
            <div style={{marginTop:'16px',display:'flex',justifyContent:'flex-end'}}>
              <button 
                onClick={() => setShowDownloadPopup(true)}
                style={{
                  padding:'8px 16px',
                  background:'#2563eb',
                  color:'#ffffff',
                  border:'none',
                  borderRadius:'6px',
                  fontSize:'13px',
                  fontWeight:'600',
                  cursor:'pointer',
                  transition:'background 0.2s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#1d4ed8')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#2563eb')}
              >
                Download Reports
              </button>
            </div>
          </div>

          {/* ROI Summary with gradient container and three cards */}
          <div style={{padding:'48px 32px',maxWidth:'1400px',margin:'0 auto'}}>
            <h2 style={{fontSize:'24px',fontWeight:'700',color:'#ffffff',margin:'0 0 32px 0'}}>ROI Summary</h2>
            <div style={{background:'linear-gradient(135deg, #0a1420 0%, #101c2c 100%)',border:'1px solid #1e3a5f',borderRadius:'16px',padding:'40px',display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))',gap:'40px'}} id="roi-summary">
              {/* Operational Card */}
              <div style={{display:'flex',flexDirection:'column'}}>
                <h3 style={{fontSize:'16px',fontWeight:'600',color:'#ffffff',margin:'0 0 12px 0'}}>Operational (velocity)</h3>
                <div style={{fontSize:'40px',fontWeight:'700',color:'#ffffff',margin:'0 0 8px 0'}}>$40,000</div>
                <p style={{fontSize:'13px',color:'#9ca3af',margin:'0'}}>Tiers corresponding to $ realization</p>
              </div>
              {/* Cost Avoided Card */}
              <div style={{display:'flex',flexDirection:'column'}}>
                <h3 style={{fontSize:'16px',fontWeight:'600',color:'#ffffff',margin:'0 0 12px 0'}}>Cost avoided (Saved)</h3>
                <div style={{fontSize:'40px',fontWeight:'700',color:'#ffffff',margin:'0 0 8px 0'}}>800 hours</div>
                <p style={{fontSize:'13px',color:'#9ca3af',margin:'0'}}>Contractor/licence/time reductions tied to AI automation</p>
              </div>
              {/* Strategic Card */}
              <div style={{display:'flex',flexDirection:'column'}}>
                <h3 style={{fontSize:'16px',fontWeight:'600',color:'#ffffff',margin:'0 0 12px 0'}}>Strategic (growth/capability)</h3>
                <div style={{fontSize:'40px',fontWeight:'700',color:'#ffffff',margin:'0 0 8px 0'}}>200 hours</div>
                <p style={{fontSize:'13px',color:'#9ca3af',margin:'0'}}>More qualified deals and skill hours invested</p>
              </div>
            </div>
          </div>

          {/* Gantt Chart Section */}
          <div style={{padding:'32px',maxWidth:'1400px',margin:'0 auto'}}>
            <div style={{background:'#0f1b2d',border:'1px solid #1e3a5f',borderRadius:'12px',overflow:'hidden'}} id="gantt">
              <div style={{padding:'24px',borderBottom:'1px solid #1e3a5f'}}>
                <h2 style={{fontSize:'16px',fontWeight:'700',color:'#ffffff',margin:'0'}}>Gantt — weekly freed time + critical path hotspots</h2>
              </div>
              <div style={{padding:'24px'}}>
                <Gantt
                  tasks={tasksFiltered}
                  capacity={capFiltered}
                  onAllocate={allocate}
                  onComplete={closeTask}
                  projects={projects}
                  currentProject={project}
                  onProjectChange={(p) => setProject(p)}
                  showAllocateButton={false}
                  onAllocateClick={(taskId, projectName) => setSelectedProjectForSuggestions(projectName)}
                />
              </div>
            </div>
          </div>

          {/* Capacity Sources Section */}
          <div style={{padding:'32px',maxWidth:'1400px',margin:'0 auto'}}>
            <div style={{background:'#0f1b2d',border:'1px solid #1e3a5f',borderRadius:'12px',overflow:'hidden'}} id="capacity-toggles">
              <div style={{padding:'24px',borderBottom:'1px solid #1e3a5f'}}>
                <h3 style={{fontSize:'16px',fontWeight:'600',color:'#ffffff',margin:'0 0 16px 0'}}>Capacity sources (summary)</h3>
                {/* Inline simulation toggles */}
                <div style={{display:'flex',gap:'24px',alignItems:'center',flexWrap:'wrap'}}>
                  <label style={{display:'flex',alignItems:'center',gap:'8px',cursor:'pointer',fontSize:'14px',color:'#9ca3af'}}>
                    <input type="checkbox" checked={simRPA} onChange={e=>setSimRPA(e.target.checked)} style={{width:'16px',height:'16px',cursor:'pointer',accentColor:'#2563eb'}}/>
                    RPA back‑office automation
                  </label>
                  <label style={{display:'flex',alignItems:'center',gap:'8px',cursor:'pointer',fontSize:'14px',color:'#9ca3af'}}>
                    <input type="checkbox" checked={simSVC} onChange={e=>setSimSVC(e.target.checked)} style={{width:'16px',height:'16px',cursor:'pointer',accentColor:'#2563eb'}}/>
                    AI Agent resolves routine questions
                  </label>
                </div>
                <p style={{fontSize:'12px',color:'#9ca3af',margin:'12px 0 0 0'}}>Toggling changes capacity sources and harvestable savings.</p>
              </div>
              <div style={{padding:'24px',overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:'14px'}}>
                  <thead>
                    <tr style={{borderBottom:'1px solid #1e3a5f'}}>
                      <th style={{textAlign:'left',padding:'8px 0',color:'#9ca3af',fontWeight:'600',fontSize:'12px'}}>AI tool → Outcome</th>
                      <th style={{textAlign:'right',padding:'8px 0',color:'#9ca3af',fontWeight:'600',fontSize:'12px'}}>Hours</th>
                      <th style={{textAlign:'right',padding:'8px 0',color:'#9ca3af',fontWeight:'600',fontSize:'12px'}}>Value ($)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedSources.map((s,i)=>{
                      const hrs = toIntHrs(s.minutes)
                      return (
                        <tr key={i} style={{borderBottom:'1px solid #1e3a5f'}}>
                          <td style={{padding:'12px 0',color:'#ffffff'}}>{s.source}</td>
                          <td style={{textAlign:'right',padding:'12px 0',color:'#ffffff'}}>{hrs}</td>
                          <td style={{textAlign:'right',padding:'12px 0',color:'#ffffff'}}>${(hrs*HOURLY_VALUE).toLocaleString()}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Harvest / Strategic Actions + Evidence Log Section (Combined) */}
          <div style={{padding:'32px',maxWidth:'1400px',margin:'0 auto'}} id="harvest">
            <div style={{background:'#0f1b2d',border:'1px solid #1e3a5f',borderRadius:'12px',overflow:'hidden'}}>
              {/* Header */}
              <div style={{padding:'24px',borderBottom:'1px solid #1e3a5f'}}>
                <h3 style={{fontSize:'16px',fontWeight:'600',color:'#ffffff',margin:'0'}}>Harvest / Strategic actions</h3>
              </div>
              
              {/* Harvest Cards */}
              <div style={{padding:'20px',borderBottom:'1px solid #1e3a5f',display:'grid',gridTemplateColumns:'repeat(3, 1fr)',gap:'16px'}} id="harvest-cards">
                {/* RPA Card */}
                <div 
                  onClick={() => { setActiveHarvest('rpa'); harvestRPA(); }}
                  style={{background:'#0a1420',border:activeHarvest === 'rpa' ? '2px solid #2563eb' : '1px solid #1e3a5f',borderRadius:'12px',padding:'16px',cursor:'pointer',transition:'all 0.2s',minHeight:'90px',display:'flex',flexDirection:'column',justifyContent:'flex-start'}}
                >
                  <h4 style={{fontSize:'13px',fontWeight:'600',color:'#ffffff',margin:'0 0 6px 0'}}>RPA contractor reduction</h4>
                  <p style={{fontSize:'13px',color:'#9ca3af',margin:'0'}}>Counted only when POs/seats/contracts are reduced.</p>
                </div>
                {/* AI Agent Card */}
                <div 
                  onClick={() => { setActiveHarvest('service'); harvestService(); }}
                  style={{background:'#0a1420',border:activeHarvest === 'service' ? '2px solid #2563eb' : '1px solid #1e3a5f',borderRadius:'12px',padding:'16px',cursor:'pointer',transition:'all 0.2s',minHeight:'90px',display:'flex',flexDirection:'column',justifyContent:'flex-start'}}
                >
                  <h4 style={{fontSize:'13px',fontWeight:'600',color:'#ffffff',margin:'0 0 6px 0'}}>AI Agent cost avoided</h4>
                  <p style={{fontSize:'13px',color:'#9ca3af',margin:'0'}}>Cost avoided from automating service tasks.</p>
                </div>
                {/* Record Growth Card */}
                <div 
                  onClick={() => { setActiveHarvest('growth'); recordSQLLift(12); }}
                  style={{background:'#0a1420',border:activeHarvest === 'growth' ? '2px solid #2563eb' : '1px solid #1e3a5f',borderRadius:'12px',padding:'16px',cursor:'pointer',transition:'all 0.2s',minHeight:'90px',display:'flex',flexDirection:'column',justifyContent:'flex-start'}}
                >
                  <h4 style={{fontSize:'13px',fontWeight:'600',color:'#ffffff',margin:'0 0 6px 0'}}>Record growth</h4>
                  <p style={{fontSize:'13px',color:'#9ca3af',margin:'0'}}>Add qualified deals to recognize growth revenue.</p>
                </div>
              </div>

              {/* Evidence Log Section */}
              <div style={{padding:'24px'}} id="evidence-log">
                <h3 style={{fontSize:'16px',fontWeight:'600',color:'#ffffff',margin:'0 0 16px 0'}}>Evidence log (realized)</h3>
                <div style={{overflowX:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:'13px'}}>
                    <thead>
                      <tr style={{borderBottom:'1px solid #1e3a5f'}}>
                        <th style={{textAlign:'left',padding:'8px 0',color:'#9ca3af',fontWeight:'600',fontSize:'12px'}}>Item</th>
                        <th style={{textAlign:'right',padding:'8px 0',color:'#9ca3af',fontWeight:'600',fontSize:'12px'}}>Days saved</th>
                        <th style={{textAlign:'right',padding:'8px 0',color:'#9ca3af',fontWeight:'600',fontSize:'12px'}}>$ value</th>
                        <th style={{textAlign:'center',padding:'8px 0',color:'#9ca3af',fontWeight:'600',fontSize:'12px'}}>Tier</th>
                        <th style={{textAlign:'left',padding:'8px 0',color:'#9ca3af',fontWeight:'600',fontSize:'12px'}}>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evidence.map((e,i)=>(
                        <tr key={i} style={{borderBottom:'1px solid #1e3a5f'}}>
                          <td style={{padding:'12px 0',color:'#ffffff'}}>{e.taskId ? (tasks.find(x=>x.id===e.taskId)?.name || e.taskId) : (e.label || 'Item')}</td>
                          <td style={{textAlign:'right',padding:'12px 0',color:'#ffffff'}}>{e.daysSaved!==undefined ? e.daysSaved.toFixed(1) : '—'}</td>
                          <td style={{textAlign:'right',padding:'12px 0',color:'#ffffff'}}>${Math.round(e.value).toLocaleString()}</td>
                          <td style={{textAlign:'center',padding:'12px 0'}}>
                            <span style={{display:'inline-block',padding:'4px 8px',borderRadius:'4px',fontSize:'11px',fontWeight:'600',background:e.tier==='H'?'#10b981':e.tier==='M'?'#f59e0b':'#ef4444',color:'#ffffff'}}>{e.tier}</span>
                          </td>
                          <td style={{padding:'12px 0',color:'#9ca3af',fontSize:'12px'}}>{e.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Guided tour overlay */}
          <Tour
            open={tourOpen}
            index={tourIdx}
            steps={steps}
            onNext={nextStep}
            onPrev={prevStep}
            onClose={()=>setTourOpen(false)}
          />
        </div>
      ) : (
        // PRODUCT MANAGER VIEW
        <div style={{minHeight:'100vh',background:'#0a1420'}} id="manager-header">
          {/* Top Header with Velocity AI branding and demo button */}
          <div style={{background:'linear-gradient(135deg, #0a1420 0%, #101c2c 100%)',padding:'40px 32px',borderBottom:'1px solid #1e3a5f'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',maxWidth:'1400px',margin:'0 auto'}}>
              <div>
                <h1 style={{fontSize:'36px',fontWeight:'800',color:'#ffffff',margin:'0 0 8px 0'}}>Velocity AI</h1>
                <p style={{fontSize:'15px',color:'#9ca3af',margin:'0'}}>Turn AI into dollars</p>
              </div>
              <button 
                className="btn" 
                onClick={startTour}
                style={{padding:'12px 28px',background:'#2563eb',color:'#ffffff',border:'none',borderRadius:'8px',fontSize:'16px',fontWeight:'700',cursor:'pointer',transition:'background 0.2s'}}
              >
                Start a guided demo
              </button>
            </div>
          </div>

          {/* Turn AI time into dollars section with toggle */}
          <div style={{padding:'32px 32px',borderBottom:'1px solid #1e3a5f',maxWidth:'1400px',margin:'0 auto'}} id="manager-filter">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
              <div>
                <h2 style={{fontSize:'24px',fontWeight:'700',color:'#ffffff',margin:'0 0 8px 0'}}>Turn AI time into dollars</h2>
                <p style={{fontSize:'14px',color:'#9ca3af',margin:'0',maxWidth:'700px',lineHeight:'1.6'}}>We connect your AI tools (Copilot, Asana AI, Workflows, RPA, AI Agents), capture the time they create, redeploy it to priority work, and prove dollars—Operational, Cost avoided, Strategic. No forecasts. No timesheets.</p>
              </div>
              {/* View Mode Toggle */}
              <div style={{display:'flex',gap:'12px',alignItems:'center',flexShrink:0,marginLeft:'32px'}}>
                <span style={{fontSize:'13px',color:(viewMode as string) === 'executive' ? '#ffffff' : '#9ca3af'}}>Executive View</span>
                <div 
                  style={{width:'48px',height:'24px',background:'#2563eb',borderRadius:'12px',position:'relative',cursor:'pointer',display:'flex',alignItems:'center',padding:'2px',transition:'all 0.3s ease'}}
                  onClick={() => setViewMode((viewMode as string) === 'executive' ? 'product' : 'executive')}
                >
                  <div style={{width:'20px',height:'20px',background:'#ffffff',borderRadius:'10px',position:'absolute',left:(viewMode as string) === 'executive' ? '2px' : '26px',transition:'left 0.3s ease'}} />
                </div>
                <span style={{fontSize:'13px',color:(viewMode as string) === 'product' ? '#ffffff' : '#9ca3af',cursor:'pointer'}} onClick={() => setViewMode('product')}>Project Manager view</span>
              </div>
            </div>
          </div>

          <div style={{padding:'32px'}}>
            {/* Project Metrics Timeline */}
          <div style={{background:'var(--card)',padding:'16px',borderRadius:'8px',border:'1px solid #253041',marginBottom:'32px'}} id="pm-progress">
            <h2 style={{fontSize:'18px',fontWeight:'700',color:'var(--text)',marginBottom:'12px'}}>This Week's Progress</h2>
            <ProjectTimeline />
          </div>

          {/* Main Grid: Gantt + AI Suggestions Sidebar */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:'24px',marginBottom:'32px'}}>
            {/* Left: Gantt Chart */}
            <div style={{background:'var(--card)',borderRadius:'8px',border:'1px solid #253041',overflow:'hidden'}} id="pm-gantt">
              <div style={{padding:'16px',borderBottom:'1px solid #253041'}}>
                <h2 style={{fontSize:'16px',fontWeight:'700',color:'var(--text)',margin:'0'}}>Project Timeline & Status</h2>
              </div>
              <GanttChart 
                tasks={tasksFiltered}
                capacity={capFiltered}
                onAllocate={allocate}
                onComplete={closeTask}
                projects={projects}
                currentProject={project}
                onProjectChange={(p) => setProject(p)}
                showAllocateButton={true}
                onAllocateClick={(taskId, projectName) => setSelectedProjectForSuggestions(projectName)}
              />
            </div>

            {/* Right: AI Suggestions Sidebar */}
            <div style={{background:'var(--card)',borderRadius:'8px',border:'1px solid #253041',padding:'16px',height:'100%',position:'sticky',top:'24px'}} id="pm-suggestions">
              <div style={{marginBottom:'16px'}}>
                <h3 style={{fontSize:'16px',fontWeight:'700',color:'var(--text)',margin:'0 0 8px 0'}}></h3>
                <p style={{fontSize:'12px',color:'var(--muted)',margin:'0'}}></p>
              </div>
              <AISuggestions selectedProject={selectedProjectForSuggestions} />
            </div>
          </div>

          {/* Team Utilization */}
          <div style={{background:'var(--card)',borderRadius:'8px',border:'1px solid #253041',overflow:'hidden'}} id="pm-utilization">
            <TeamUtilization />
          </div>

          {/* Guided tour overlay */}
          <Tour
            open={tourOpen}
            index={tourIdx}
            steps={steps}
            onNext={nextStep}
            onPrev={prevStep}
            onClose={()=>setTourOpen(false)}
          />
          </div>
        </div>
      )}

      {/* Download Reports Popup Modal - Outside view sections */}
      {showDownloadPopup && (
        <div style={{
          position:'fixed',
          top:0,
          left:0,
          width:'100%',
          height:'100%',
          background:'rgba(0,0,0,0.5)',
          display:'flex',
          alignItems:'center',
          justifyContent:'center',
          zIndex:10000
        }} onClick={() => setShowDownloadPopup(false)}>
          <div style={{
            background:'#1a2a3a',
            border:'1px solid #2563eb',
            borderRadius:'12px',
            padding:'32px',
            maxWidth:'400px',
            boxShadow:'0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{fontSize:'18px',fontWeight:'700',color:'#ffffff',margin:'0 0 16px 0'}}>Download Reports</h2>
            <p style={{fontSize:'14px',color:'#d1d5db',margin:'0 0 24px 0',lineHeight:'1.6'}}>Report consolidation in progress. This will help you summarize all dashboard data.</p>
            <div style={{display:'flex',gap:'12px',justifyContent:'flex-end'}}>
              <button 
                onClick={() => setShowDownloadPopup(false)}
                style={{
                  padding:'8px 16px',
                  background:'#374151',
                  color:'#ffffff',
                  border:'none',
                  borderRadius:'6px',
                  fontSize:'13px',
                  fontWeight:'600',
                  cursor:'pointer',
                  transition:'background 0.2s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#4b5563')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#374151')}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
