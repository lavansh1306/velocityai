"use client"

const metrics = [
  {
    label: "Total Work",
    value: "120 hrs",
    symbol: "⏱",
    // KPI palette: blue
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.08)',
    border: '#3b82f6'
  },
  {
    label: "Early Completion",
    value: "9 days",
    symbol: "📅",
    // KPI palette: green
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.08)',
    border: '#22c55e'
  },
  {
    label: "Efficiency Gain",
    value: "+75%",
    symbol: "📈",
    // use a purple for emphasis (matches previous styling and screenshot)
    color: '#7e22ce',
    bg: 'rgba(126,34,206,0.06)',
    border: '#7e22ce'
  },
  {
    label: "Overall Utilization",
    value: "82%",
    symbol: "⚙",
    // KPI palette: orange
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.06)',
    border: '#f59e0b'
  },
]

export function ProjectTimeline() {
  return (
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))',gap:'16px'}}>
      {metrics.map((metric, index) => (
        <div
          key={index}
          style={{
            padding:'16px',
            borderRadius:'8px',
            border:`2px solid ${metric.border}`,
            backgroundColor:metric.bg,
            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
            <div>
              <p style={{fontSize:'13px',fontWeight:'500',color:'var(--muted)',margin:'0 0 8px 0'}}>{metric.label}</p>
              <p style={{fontSize:'24px',fontWeight:'800',margin:'0',color:metric.color}}>{metric.value}</p>
            </div>
            <span style={{fontSize:'22px',opacity:0.9,color:'rgba(255,255,255,0.16)'}}>{metric.symbol}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
