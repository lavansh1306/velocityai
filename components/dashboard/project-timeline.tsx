"use client"

const metrics = [
  {
    label: "Total Work",
    value: "120 hrs",
    symbol: "⏱",
    bgColor: "#e0f2fe",
    textColor: "#0284c7",
    borderColor: "#0284c7"
  },
  {
    label: "Early Completion",
    value: "9 days",
    symbol: "📅",
    bgColor: "#dcfce7",
    textColor: "#15803d",
    borderColor: "#15803d"
  },
  {
    label: "Efficiency Gain",
    value: "+75%",
    symbol: "📈",
    bgColor: "#f3e8ff",
    textColor: "#7e22ce",
    borderColor: "#7e22ce"
  },
  {
    label: "Overall Utilization",
    value: "82%",
    symbol: "⚙",
    bgColor: "#fef3c7",
    textColor: "#b45309",
    borderColor: "#b45309"
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
            border:`2px solid ${metric.borderColor}`,
            backgroundColor:metric.bgColor,
          }}
        >
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
            <div>
              <p style={{fontSize:'13px',fontWeight:'500',color:'var(--muted)',margin:'0 0 8px 0'}}>{metric.label}</p>
              <p style={{fontSize:'24px',fontWeight:'bold',margin:'0',color:metric.textColor}}>{metric.value}</p>
            </div>
            <span style={{fontSize:'24px',opacity:0.6}}>{metric.symbol}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
