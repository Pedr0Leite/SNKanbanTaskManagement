import React from 'react'
import { useDraggable } from '@dnd-kit/core'
import { Card as CardModel, FieldValue } from '../types'

/** Priority-style badges read better with a tone; everything else stays neutral. */
function toneFor(field: FieldValue): string | undefined {
    const v = field.display_value.toLowerCase()
    if (v.includes('critical') || v.includes('1 -') || v === 'high') return 'high'
    if (v.includes('high') || v.includes('2 -') || v === 'medium') return 'medium'
    return undefined
}

function initialsOf(name: string): string {
    const parts = name.trim().split(/\s+/)
    if (!parts[0]) return '?'
    const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
    return (parts[0][0] + last).toUpperCase()
}

function FieldChip({ field }: { field: FieldValue }): React.JSX.Element | null {
    if (!field.display_value) return null

    switch (field.display_as) {
        case 'badge':
            return (
                <span className="badge" data-tone={toneFor(field)} title={field.label}>
                    {field.display_value}
                </span>
            )
        case 'avatar':
            return (
                <span className="avatar" title={`${field.label}: ${field.display_value}`}>
                    <span className="initials" aria-hidden="true">
                        {initialsOf(field.display_value)}
                    </span>
                    {field.display_value}
                </span>
            )
        default:
            return (
                <span className="meta-text" title={field.label}>
                    {field.display_value}
                </span>
            )
    }
}

export interface CardProps {
    card: CardModel
    laneLabel: string
    /** Lane accent colour, shown as the card's left edge. */
    accent?: string
    onOpen: (sysId: string) => void
    /** Rendered inside the DragOverlay — no drag listeners, no click handler. */
    overlay?: boolean
}

export function Card({ card, laneLabel, accent, onOpen, overlay = false }: CardProps): React.JSX.Element {
    const locked = !card.can_write
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: card.sys_id,
        disabled: overlay || locked || card.pending === true,
        data: { laneValue: card.lane_value },
    })

    const lockReason = locked
        ? 'You do not have permission to move this record, so it cannot be dragged.'
        : undefined

    const className = [
        'card',
        card.pending ? 'pending' : '',
        locked ? 'locked' : '',
        isDragging ? 'dragging' : '',
        overlay ? 'overlay' : '',
    ]
        .filter(Boolean)
        .join(' ')

    return (
        <li>
            <button
                type="button"
                ref={overlay ? undefined : setNodeRef}
                className={className}
                style={accent ? { borderLeftColor: accent } : undefined}
                title={lockReason}
                aria-label={`${card.title}. ${laneLabel}.${locked ? ' Read only.' : ''}`}
                onClick={overlay ? undefined : () => onOpen(card.sys_id)}
                {...(overlay ? {} : attributes)}
                {...(overlay ? {} : listeners)}
            >
                <span className="card-title">{card.title || card.sys_id}</span>
                {card.subtitle ? <span className="card-subtitle">{card.subtitle}</span> : null}
                {card.fields.length > 0 || locked ? (
                    <span className="card-meta">
                        {card.fields.map((f) => (
                            <FieldChip key={f.name} field={f} />
                        ))}
                        {locked ? (
                            <span className="lock-hint" aria-hidden="true">
                                &#128274; read only
                            </span>
                        ) : null}
                    </span>
                ) : null}
            </button>
        </li>
    )
}
