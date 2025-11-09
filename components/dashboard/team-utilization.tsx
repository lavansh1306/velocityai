"use client"

const teamData = [
  {
    name: "Sarah Johnson",
    role: "Senior Dev",
    tasks: 8,
    utilization: 92,
    estimated: "40h",
    actual: "39h",
    status: "good",
  },
  {
    name: "Michael Chen",
    role: "Product Designer",
    tasks: 5,
    utilization: 68,
    estimated: "35h",
    actual: "24h",
    status: "warning",
  },
  {
    name: "Emily Rodriguez",
    role: "Backend Eng",
    tasks: 12,
    utilization: 105,
    estimated: "40h",
    actual: "42h",
    status: "critical",
  },
  {
    name: "Ravi DK",
    role: "QA Eng",
    tasks: 7,
    utilization: 85,
    estimated: "40h",
    actual: "34h",
    status: "good",
  },
  {
    name: "Lisa Anderson",
    role: "Frontend Dev",
    tasks: 4,
    utilization: 55,
    estimated: "40h",
    actual: "22h",
    status: "critical",
  },
  {
    name: "James Wilson",
    role: "DevOps",
    tasks: 9,
    utilization: 88,
    estimated: "40h",
    actual: "35h",
    status: "good",
  },
]

function getUtilizationColor(utilization: number) {
  if (utilization >= 90) return "#22c55e"
  if (utilization >= 75) return "#f59e0b"
  return "#ef4444"
}

function getStatusColor(utilization: number) {
  if (utilization >= 90) return "#22c55e"
  if (utilization >= 75) return "#f59e0b"
  return "#ef4444"
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
}

export function TeamUtilization() {
  return (
    <div style={{borderRadius:'8px',border:'1px solid #253041',background:'var(--card)'}}>
      <div style={{padding:'16px',borderBottom:'1px solid #253041'}}>
        <h3 style={{fontSize:'16px',fontWeight:'600',color:'var(--text)',margin:'0 0 4px 0'}}>Team Utilization Details</h3>
        <p style={{fontSize:'12px',color:'var(--muted)',margin:'0'}}>Current workload and capacity analysis</p>
      </div>
      <div style={{padding:'16px',overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:'13px'}}>
          <thead>
            <tr style={{borderBottom:'1px solid #253041'}}>
              <th style={{textAlign:'left',padding:'10px 8px',fontWeight:'600',color:'var(--muted)'}}>Employee</th>
              <th style={{textAlign:'left',padding:'10px 8px',fontWeight:'600',color:'var(--muted)'}}>Role</th>
              <th style={{textAlign:'center',padding:'10px 8px',fontWeight:'600',color:'var(--muted)'}}>Tasks</th>
              <th style={{textAlign:'center',padding:'10px 8px',fontWeight:'600',color:'var(--muted)'}}>Utilization</th>
              <th style={{textAlign:'center',padding:'10px 8px',fontWeight:'600',color:'var(--muted)'}}>Est / Actual</th>
            </tr>
          </thead>
          <tbody>
            {teamData.map((employee) => (
              <tr key={employee.name} style={{borderBottom:'1px solid #1f2937',transition:'background-color 0.2s'}} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1f2937'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                <td style={{padding:'10px 8px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <div style={{width:'32px',height:'32px',borderRadius:'50%',background:'#0284c7',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:'600',color:'#fff'}}>
                      {getInitials(employee.name)}
                    </div>
                    <span style={{fontWeight:'500',color:'var(--text)'}}>{employee.name}</span>
                  </div>
                </td>
                <td style={{padding:'10px 8px',color:'var(--muted)'}}>{employee.role}</td>
                <td style={{textAlign:'center',padding:'10px 8px',color:'var(--text)'}}>{employee.tasks}</td>
                <td style={{padding:'10px 8px'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}>
                    <div style={{width:'64px',background:'#1f2937',borderRadius:'12px',height:'16px',overflow:'hidden'}}>
                      <div
                        style={{
                          background:getUtilizationColor(employee.utilization),
                          height:'100%',
                          width:`${Math.min(employee.utilization, 100)}%`,
                          transition:'width 0.2s'
                        }}
                      ></div>
                    </div>
                    <span style={{fontSize:'12px',fontWeight:'600',color:getStatusColor(employee.utilization)}}>
                      {employee.utilization}%
                    </span>
                  </div>
                </td>
                <td style={{textAlign:'center',padding:'10px 8px',color:'var(--muted)'}}>
                  {employee.estimated} / {employee.actual}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
