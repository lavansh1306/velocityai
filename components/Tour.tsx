'use client'
import React, { useEffect } from 'react'

export type TourStep = {
  id: string
  title: string
  text: string
  targetId?: string          // element to highlight/scroll to
  run?: () => void           // action to execute when Next is clicked
}

type Props = {
  open: boolean
  index: number
  steps: TourStep[]
  onNext: () => void
  onPrev: () => void
  onClose: () => void
}

export default function Tour({ open, index, steps, onNext, onPrev, onClose }: Props) {
  useEffect(() => {
    if (!open) return
    // highlight target and scroll into view
    const step = steps[index]
    // remove old highlight
    document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'))
    if (step?.targetId) {
      const el = document.getElementById(step.targetId)
      if (el) {
        el.classList.add('tour-highlight')
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
    return () => {
      document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'))
    }
  }, [open, index, steps])

  if (!open) return null
  const step = steps[index]
  const total = steps.length

  return (
    <div className="tourOverlay">
      <div className="tourCard">
        <div className="tourTitle">{step.title}</div>
        <div className="tourText">{step.text}</div>
        <div className="tourBtns">
          <button className="btn secondary" onClick={onPrev} disabled={index===0}>Back</button>
          <button className="btn" onClick={onNext}>{index===total-1 ? 'Finish' : 'Next'}</button>
          <button className="btn ghost" onClick={onClose}>Skip</button>
        </div>
        <div className="tourProgress">Step {index+1} of {total}</div>
      </div>
    </div>
  )
}
