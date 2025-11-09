'use client'

type ProjectKPI = {
  label: string
  value: string | number
  color: string
  icon: string
}

export function ProjectKPIs() {
  const kpis: ProjectKPI[] = [
    {
      label: 'On-Time Delivery',
      value: '92%',
      color: '#22c55e',
      icon: '✓'
    },
    {
      label: 'Critical Path Tasks',
      value: '3',
      color: '#ef4444',
      icon: '⚠'
    },
    {
      label: 'Avg Task Duration',
      value: '8.2d',
      color: '#3b82f6',
      icon: '⏱'
    },
    {
      label: 'Resource Utilization',
      value: '85%',
      color: '#f59e0b',
      icon: '📊'
    },
    {
      label: 'Baseline vs Actual',
      value: '-2.1d',
      color: '#10b981',
      icon: '📈'
    },
    {
      label: 'Risk Level',
      value: 'Medium',
      color: '#f59e0b',
      icon: '🎯'
    },
  ]

  return (
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))',gap:'12px',padding:'16px',background:'var(--card)',border:'1px solid #253041',borderRadius:'8px'}}>
      {kpis.map((kpi, idx) => (
        <div 
          key={idx}
          style={{
            padding:'12px',
            background:'#0b1420',
            border:`2px solid ${kpi.color}`,
            borderRadius:'6px',
            display:'flex',
            flexDirection:'column',
            gap:'4px'
          }}
        >
          <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
            <span style={{fontSize:'16px'}}>{kpi.icon}</span>
            <span style={{fontSize:'11px',color:'var(--muted)',fontWeight:'500'}}>{kpi.label}</span>
          </div>
          <div style={{fontSize:'16px',fontWeight:'700',color:kpi.color}}>{kpi.value}</div>
        </div>
      ))}
    </div>
  )
}
