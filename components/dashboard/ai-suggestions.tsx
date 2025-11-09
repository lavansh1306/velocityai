"use client"

import { useState } from "react"

const suggestionsByProject: Record<string, any[]> = {
  'Q4 Sales Enablement': [
    {
      id: 1,
      employee: "Arjun Patel",
      recommendation: "Reassign UI Revamp",
      reason: "Subtask #15 to Arjun",
      initials: "AP",
    },
    {
      id: 2,
      employee: "James Wilson",
      recommendation: "Assign Sales Strategy",
      reason: "Task to James",
      initials: "JW",
    },
  ],
  'Q4 Campaign Email Sprint': [
    {
      id: 3,
      employee: "Sarah Chen",
      recommendation: "Copy Review & Optimization",
      reason: "Email copy refinement task",
      initials: "SC",
    },
    {
      id: 4,
      employee: "Michael Brown",
      recommendation: "Design System Integration",
      reason: "Template design task",
      initials: "MB",
    },
  ],
  'Website Refresh': [
    {
      id: 5,
      employee: "Emma Davis",
      recommendation: "SEO Optimization",
      reason: "Website SEO audit task",
      initials: "ED",
    },
    {
      id: 6,
      employee: "Alex Kumar",
      recommendation: "Performance Testing",
      reason: "Site performance review",
      initials: "AK",
    },
  ],
}

const defaultSuggestions = [
  {
    id: 1,
    employee: "Arjun Patel",
    recommendation: "Reassign UI Revamp",
    reason: "Subtask #15 to Arjun",
    initials: "AP",
  },
  {
    id: 2,
    employee: "James Wilson",
    recommendation: "Assign AI Integration",
    reason: "Task to James",
    initials: "JW",
  },
]

export function AISuggestions({ selectedProject }: { selectedProject?: string | null }) {
  const [accepted, setAccepted] = useState<number[]>([])

  const suggestions = selectedProject && suggestionsByProject[selectedProject] 
    ? suggestionsByProject[selectedProject] 
    : defaultSuggestions

  const handleAccept = (id: number) => {
    if (!accepted.includes(id)) {
      setAccepted([...accepted, id])
    }
  }

  const handleDecline = (id: number) => {
    setAccepted(accepted.filter(a => a !== id))
  }

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
        <div>
          <h3 style={{fontSize:'16px',fontWeight:'600',color:'var(--text)',margin:'0 0 4px 0'}}>AI Suggestions</h3>
          {selectedProject ? (
            <p style={{fontSize:'13px',color:'var(--muted)',margin:'0'}}>Smart recommendations for {selectedProject}</p>
          ) : (
            <p style={{fontSize:'13px',color:'var(--muted)',margin:'0'}}>Smart task recommendations based on team capacity and skills</p>
          )}
        </div>
      </div>
      {suggestions.map((suggestion) => (
        <div
          key={suggestion.id}
          style={{
            padding:'12px',
            borderRadius:'8px',
            border:`1px solid ${accepted.includes(suggestion.id) ? '#22c55e' : '#253041'}`,
            background:accepted.includes(suggestion.id) ? '#0c2e1a' : 'var(--card)',
            transition:'all 0.2s',
          }}
        >
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'12px'}}>
            <div style={{flex:1}}>
              <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                <div style={{width:'32px',height:'32px',borderRadius:'50%',background:'#3b82f6',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:'600',color:'#fff',flexShrink:0}}>
                  {suggestion.initials}
                </div>
                <div>
                  <p style={{fontSize:'14px',fontWeight:'600',color:'var(--text)',margin:'0 0 2px 0'}}>{suggestion.employee}</p>
                  <p style={{fontSize:'13px',color:'var(--muted)',margin:'0 0 2px 0'}}>{suggestion.recommendation}</p>
                  <p style={{fontSize:'12px',color:'#a7b1bd',margin:'0'}}>{suggestion.reason}</p>
                </div>
              </div>
            </div>
            <div style={{display:'flex',gap:'8px',flexShrink:0}}>
              <button
                onClick={() => handleAccept(suggestion.id)}
                style={{
                  padding:'6px 12px',
                  borderRadius:'6px',
                  border:'none',
                  fontSize:'12px',
                  fontWeight:'600',
                  cursor:'pointer',
                  background:accepted.includes(suggestion.id) ? '#22c55e' : '#1f2937',
                  color:accepted.includes(suggestion.id) ? '#fff' : '#e6edf3',
                }}
              >
                Accept
              </button>
              <button
                onClick={() => handleDecline(suggestion.id)}
                style={{
                  padding:'6px 12px',
                  borderRadius:'6px',
                  border:'1px solid #253041',
                  fontSize:'12px',
                  fontWeight:'600',
                  cursor:'pointer',
                  background:'transparent',
                  color:'#e6edf3',
                }}
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
