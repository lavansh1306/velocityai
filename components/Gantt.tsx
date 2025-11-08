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
}

// Hydration‑safe date formatting (fixed locale + UTC)
const dtf = new Intl.DateTimeFormat('en-US', { month:'short', day:'numeric', timeZone:'UTC' })
const fmt = (d: Date) => dtf.format(d)
const daysBetween = (a: Date, b: Date) => Math.max(1, Math.round((b.getTime() - a.getTime()) / 86400000))

export default function Gantt({ tasks, capacity, onAllocate, onComplete, onView }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [gridW, setGridW] = useState<number | null>(null) // null until measured (avoid hydration warnings)

  // weekly grid
  const LEFT_COL = 280
  const RIGHT_COL = 280
  const ROW_H = 36
  const HEADER_H = 30
  const CAP_ROW_H = 36
  const MIN_WEEKS = 5

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
                              left: `calc((${r.spanWeeks} - ${predFrac}) * 100% / ${spanWeeks})`,
                              width: `calc(${predFrac} * 100% / ${spanWeeks})`
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
                <input className="input" style={{ width: 80 }} type="number" min={1} defaultValue={8} id={`alloc-${r.id}`} />
                <button className="btn" onClick={() => {
                  const el = document.getElementById(`alloc-${r.id}`) as HTMLInputElement | null
                  const v = (el?.valueAsNumber ?? 0) || 4
                  onAllocate(r.id, v)
                }}>Allocate</button>
                <button className="btn secondary" onClick={() => {
                  const val = prompt('Actual close date (YYYY-MM-DD):', new Date().toISOString().slice(0, 10))
                  if (val) onComplete(r.id, new Date(val).toISOString())
                }}>Mark complete</button>
                {onView && <button className="btn ghost" onClick={() => onView(r.id)}>View</button>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
