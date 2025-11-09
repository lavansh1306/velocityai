'use client'
import React, { useEffect, useMemo, useRef, useState } from 'react'

export type Task = {
  id: string
  name: string
  project: string
  assignees: string[]
  start: string  // ISO
  due: string    // ISO (current due; after “complete” this is actual close)
  baselineDays: number
  slackDays: number
  codPerDay: number
  mvi: number
  status: 'open' | 'closed'
  allocatedMinutes?: number
  capability?: boolean
  dependsOn?: string       // predecessor id (for arrows)
  // the two below are optional fields the page sets
  predictedDaysSaved?: number     // from allocation (ghost shorten)
  plannedDue?: string             // original scheduled due; draw tick when changed
}

export type CapEvent = {
  dayOffset: number        // days from first visible day
  label: string            // “Copilot: shorter meeting”
  hours: number
  project?: string
}

type Row = Task & {
  // weekly layout
  startWeek: number        // start column (week index)
  spanWeeks: number        // number of week columns the current bar spans
  plannedSpanWeeks?: number// span for plannedDue (tick)
  rowIndex: number
}

type Props = {
  tasks: Task[] | undefined
  capacity: CapEvent[]
  onAllocate: (taskId: string, hours: number) => void
  onComplete: (taskId: string, actualCloseISO: string) => void
  onView?: (taskId: string) => void
  projects?: string[]
  currentProject?: 'All' | string
  onProjectChange?: (p: 'All' | string) => void
  showAllocateButton?: boolean
  onAllocateClick?: (taskId: string, projectName: string) => void
}

// Hydration‑safe date formatting (fixed locale + UTC)
const dtf = new Intl.DateTimeFormat('en-US', { month:'short', day:'numeric', timeZone:'UTC' })
const fmt = (d: Date) => dtf.format(d)
const daysBetween = (a: Date, b: Date) => Math.max(1, Math.round((b.getTime() - a.getTime()) / 86400000))

export default function Gantt({ tasks, capacity, onAllocate, onComplete, onView, projects, currentProject, onProjectChange, showAllocateButton = false, onAllocateClick }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [gridW, setGridW] = useState<number | null>(null) // null until measured (avoid hydration warnings)

  // weekly grid — make left/right columns and row heights responsive using measured gridW
  const MIN_WEEKS = 5
  const defaultLeft = 280
  const defaultRight = 280
  const midLeft = 200
  const midRight = 160
  const smallLeft = 160
  const smallRight = 120
  const ROW_H = gridW && gridW < 640 ? 30 : 36
  const HEADER_H = gridW && gridW < 640 ? 28 : 30
  const CAP_ROW_H = gridW && gridW < 640 ? 32 : 36
  const LEFT_COL = gridW ? (gridW < 640 ? smallLeft : gridW < 900 ? midLeft : defaultLeft) : defaultLeft
  const RIGHT_COL = gridW ? (gridW < 640 ? smallRight : gridW < 900 ? midRight : defaultRight) : defaultRight

  // measure container width after mount (for arrow anchors)
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const measure = () => setGridW(el.clientWidth)
    measure()
    const obs = new ResizeObserver(measure)
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const { start, spanWeeks, rows, capByWeek } = useMemo(() => {
    const open = (tasks ?? []).filter(t => t.status === 'open')
    let minStart = new Date()
    let maxDue = new Date()
    if (open.length > 0) {
      minStart = new Date(Math.min(...open.map(t => new Date(t.start).getTime())))
      maxDue   = new Date(Math.max(...open.map(t => new Date(t.due).getTime())))
    }
    const start = new Date(minStart); start.setDate(start.getDate() - 1) // pad one day
    const end   = new Date(maxDue);   end.setDate(end.getDate() + 1)
    const spanDays  = Math.max(1, daysBetween(start, end))
    const spanWeeks = Math.max(MIN_WEEKS, Math.ceil(spanDays / 7))

    const rows: Row[] = open.map((t, idx) => {
      const s = new Date(t.start)
      const d = new Date(t.due)
      const offsetDays   = daysBetween(start, s)
      const durationDays = daysBetween(s, d)
      const startWeek    = Math.floor(offsetDays / 7)
      const spanW        = Math.max(1, Math.ceil(durationDays / 7))
      let plannedSpanWeeks: number | undefined
      if (t.plannedDue) {
        const pd = new Date(t.plannedDue)
        const pdDays = daysBetween(s, pd)
        plannedSpanWeeks = Math.max(1, Math.ceil(pdDays / 7))
      }
      return { ...t, startWeek, spanWeeks: spanW, plannedSpanWeeks, rowIndex: idx }
    })

    // capacity aggregated weekly (top labels available in labels array if you want to show in a tooltip)
    const capByWeek: Record<number, {hours:number; labels:string[]}> = {}
    capacity.forEach(ev => {
      const wk = Math.floor(ev.dayOffset / 7)
      if (wk < 0 || wk > spanWeeks-1) return
      capByWeek[wk] = capByWeek[wk] || {hours:0, labels:[]}
      capByWeek[wk].hours += ev.hours
      if (capByWeek[wk].labels.length < 3) capByWeek[wk].labels.push(ev.label)
    })

    return { start, spanWeeks, rows, capByWeek }
  }, [tasks, capacity])

  // Week headers
  const header = Array.from({ length: spanWeeks }, (_, i) => (
    <div key={i} className="cell">Week {i + 1}</div>
  ))

  // bar refs for anchor-based arrows
  const barRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const setBarRef = (id: string) => (el: HTMLDivElement | null) => { barRefs.current[id] = el }

  // compute elbow arrows using measured bar positions
  const [paths, setPaths] = useState<string[]>([])
  useEffect(() => {
    if (gridW === null || !wrapRef.current) return
    const wrapRect = wrapRef.current.getBoundingClientRect()
    const p: string[] = []
    rows.forEach(r => {
      if (!r.dependsOn) return
      const fromEl = barRefs.current[r.dependsOn]
      const toEl   = barRefs.current[r.id]
      if (!fromEl || !toEl) return
      const a = fromEl.getBoundingClientRect()
      const b = toEl.getBoundingClientRect()
      const x1 = a.right - wrapRect.left
      const y1 = a.top + a.height / 2 - wrapRect.top
      const x2 = b.left - wrapRect.left
      const y2 = b.top + b.height / 2 - wrapRect.top
      const midX = x1 + (x2 - x1) * 0.5
      p.push(`M ${x1} ${y1} H ${midX} V ${y2} H ${x2}`)
    })
    setPaths(p)
  }, [rows, gridW])

  // Render
  return (
    <div className="gantt" ref={wrapRef}>
      {/* Top header: title + project filters */}
      <div className="ganttTop" style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 16px',borderBottom:'1px solid #253041'}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <span className="small" style={{marginRight:'4px'}}>Project filters:</span>
          <div className="projectFilters">
            {(['All', ...(projects ?? [])] as Array<'All'|string>).map(p => {
              const active = currentProject === p
              return (
                <button
                  key={p}
                  className={`filterBtn ${active ? 'active' : ''}`}
                  onClick={() => onProjectChange?.(p)}
                >
                  {p}
                </button>
              )
            })}
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <span className="small">Time filters</span>
          <select
            className="filterDropdown"
            onChange={(e) => {
              const selectedValue = e.target.value;
              // Add logic to filter tasks based on the selected time range
              console.log('Selected time filter:', selectedValue);
            }}
          >
            <option value="none">No filters</option>
            {Array.from({ length: spanWeeks }, (_, i) => (
              <option key={i} value={`Week ${i + 1}`}>Week {i + 1}</option>
            ))}
          </select>
        </div>
      </div>
      {/* Legend */}
      <div className="legend">
        <div className="legendItem"><div className="legendColor red"></div> Critical (slack = 0)</div>
        <div className="legendItem"><div className="legendColor yellow"></div> Near‑crit (slack &le; 1 week)</div>
        <div className="legendItem"><div className="legendColor green"></div> On track (slack &gt; 1 week)</div>
      </div>

      {/* Arrows */}
      {gridW !== null && (
        <svg className="depsSvg" width="100%" height={HEADER_H + CAP_ROW_H + rows.length * ROW_H}>
          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L8,3 L0,6 Z" fill="#6aa7ff" />
            </marker>
          </defs>
          {paths.map((d, i) => (
            <path key={i} d={d} fill="none" stroke="#6aa7ff" strokeWidth="2" markerEnd="url(#arrow)" />
          ))}
        </svg>
      )}

      {/* Grid */}
  <div className="ganttGrid" style={{ gridTemplateColumns: `${LEFT_COL}px repeat(${spanWeeks}, 1fr) ${RIGHT_COL}px` }}>
        <div className="ganttHeader">
          <div className="cell headT">Task</div>
          {header}
          <div className="cell headA">Actions</div>
        </div>

        {/* Weekly capacity summary row */}
        <div className="taskCell">Freed capacity (weekly)</div>
        {Array.from({ length: spanWeeks }).map((_, i) => {
          const wk = capByWeek[i]
          return (
            <div key={i} className="dayCell">
              {wk && wk.hours > 0 && (
                <div className="capacityBlock">+{wk.hours}h freed</div>
              )}
            </div>
          )
        })}
        <div className="actionCell"><span className="small">Weekly totals (tool details in the table below)</span></div>

        {/* Task rows */}
        {rows.map(r => {
          const allocHrs = Math.round(((r.allocatedMinutes || 0) / 60) * 10) / 10
          const slackW = r.slackDays / 7
          const state = slackW <= 0 ? 'hot' : (slackW <= 1 ? 'amber' : 'ok')
          const label = state === 'hot' ? 'Critical' : state === 'amber' ? 'Near' : 'On‑track'

          // predicted ghost shorten (from allocation): convert days → week fraction
          const predDays = Math.max(0, r.predictedDaysSaved || 0)
          const predFrac = Math.min(r.spanWeeks, predDays / 7) // weeks to shorten (fraction ok)

          return (
            <div key={r.id} className="ganttRow">
              <div className="taskCell">
                <div className="tName">{r.name}</div>
                <div className="small">
                  {r.project} • Baseline {r.baselineDays}d • CoD ${r.codPerDay.toLocaleString()}
                  {r.capability ? ' • Capability' : ''}
                </div>
              </div>

              {Array.from({ length: spanWeeks }).map((_, i) => {
                const isStart = i === r.startWeek
                return (
                  <div key={i} className="dayCell">
                    {isStart && (
                      <div
                        ref={setBarRef(r.id)}
                        className={`bar ${state}`}
                        style={{ left: 0, width: `calc(${r.spanWeeks}00% / ${spanWeeks})` }}
                      >
                        <span>{label}</span>
                        {allocHrs > 0 && <span className="allocPill">{allocHrs}h allocated</span>}

                        {/* Ghost shorten overlay (predicted) */}
                        {predFrac > 0 && (
                          <div
                            className="ghostBar"
                            style={{
                              // Show the fraction of this task's own bar predicted to be saved.
                              left: `${100 - (predFrac / r.spanWeeks) * 100}%`,
                              width: `${(predFrac / r.spanWeeks) * 100}%`
                            }}
                            title={`Predicted shorten: ${predDays}d`}
                          />
                        )}

                        {/* Old due tick (if we have plannedDue and due was moved earlier) */}
                        {r.plannedSpanWeeks && r.plannedSpanWeeks > r.spanWeeks && (
                          <div
                            className="oldDueTick"
                            style={{ left: `calc(${r.plannedSpanWeeks} * 100% / ${spanWeeks} - 2px)` }}
                            title="Original due date"
                          />
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

              <div className="actionCell">
                {showAllocateButton ? (
                  <div className="actionBox" style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <button
                      className="btn"
                      style={{ minWidth: 140, padding: '10px 18px' }}
                      onClick={() => onAllocateClick?.(r.id, r.project)}
                    >
                      Allocate
                    </button>
                  </div>
                ) : (
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <span className="small">{r.project}</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
