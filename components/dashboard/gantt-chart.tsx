"use client"

const tasks = [
  {
    name: "Freed capacity",
    baseline: "+112h",
    cod: "—",
    color: "#22c55e",
    width: 85,
  },
  {
    name: "Design QA",
    baseline: "12d",
    cod: "8.5",
    color: "#ef4444",
    width: 65,
  },
  {
    name: "Field Pilot Synthe...",
    baseline: "18d",
    cod: "12.3",
    color: "#ef4444",
    width: 55,
  },
  {
    name: "Email Copy v1",
    baseline: "5d",
    cod: "3.2",
    color: "#f59e0b",
    width: 70,
  },
  {
    name: "Design Build",
    baseline: "20d",
    cod: "14.1",
    color: "#f59e0b",
    width: 60,
  },
  {
    name: "SEO QA",
    baseline: "8d",
    cod: "5.6",
    color: "#ef4444",
    width: 75,
  },
]

export function GanttChart() {
  return (
    <div style={{padding:'16px',background:'var(--card)',border:'1px solid #253041',borderRadius:'8px'}}>
      {/* Legend */}
      <div style={{display:'flex',gap:'24px',marginBottom:'20px',flexWrap:'wrap'}}>
        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
          <div style={{width:'16px',height:'16px',background:'#ef4444',borderRadius:'50%'}}></div>
          <span style={{fontSize:'13px',fontWeight:'500',color:'var(--text)'}}>Critical</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
          <div style={{width:'16px',height:'16px',background:'#f59e0b',borderRadius:'50%'}}></div>
          <span style={{fontSize:'13px',fontWeight:'500',color:'var(--text)'}}>Near-critical</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
          <div style={{width:'16px',height:'16px',background:'#22c55e',borderRadius:'50%'}}></div>
          <span style={{fontSize:'13px',fontWeight:'500',color:'var(--text)'}}>On-track</span>
        </div>
      </div>

      {/* Tasks */}
      <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
        {tasks.map((task, index) => (
          <div key={index} style={{display:'flex',alignItems:'center',gap:'16px'}}>
            <div style={{width:'160px',minWidth:'160px'}}>
              <p style={{fontSize:'13px',fontWeight:'500',color:'var(--text)',margin:'0'}}>{task.name}</p>
            </div>
            <div style={{flex:1}}>
              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <div style={{flex:1,height:'24px',background:'#1f2937',borderRadius:'12px',overflow:'hidden'}}>
                  <div
                    style={{
                      width:`${task.width}%`,
                      height:'100%',
                      background:task.color,
                      display:'flex',
                      alignItems:'center',
                      justifyContent:'center',
                      color:'white',
                      fontSize:'11px',
                      fontWeight:'600',
                    }}
                  >
                    {task.baseline}
                  </div>
                </div>
                <span style={{fontSize:'12px',fontWeight:'500',color:'var(--muted)',width:'60px',textAlign:'right'}}>
                  CoD: {task.cod}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
