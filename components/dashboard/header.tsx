"use client"

export function DashboardHeader() {
  return (
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'24px'}}>
      <div>
        <h1 style={{fontSize:'32px',fontWeight:'bold',margin:'0 0 8px 0',color:'var(--text)'}}>WorkX Agent Dashboard</h1>
        <p style={{margin:'0',color:'var(--muted)',fontSize:'14px'}}>AI-powered project management showing real-time productivity gains</p>
      </div>
      <button style={{padding:'8px 16px',background:'var(--card)',border:'1px solid #253041',borderRadius:'8px',color:'var(--text)',fontSize:'13px',cursor:'pointer'}}>
        This Week
      </button>
    </div>
  )
}
