import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { Card } from './Card'
import { Card as CardModel, Lane as LaneModel } from '../types'

export interface LaneProps {
    lane: LaneModel
    cards: CardModel[]
    onOpen: (sysId: string) => void
}

export function Lane({ lane, cards, onOpen }: LaneProps): React.JSX.Element {
    const { setNodeRef, isOver } = useDroppable({ id: lane.value })
    const overLimit = lane.wip_limit > 0 && cards.length > lane.wip_limit
    const headingId = `lane-${lane.value}-heading`

    return (
        <section
            ref={setNodeRef}
            className={`lane${isOver ? ' is-over' : ''}`}
            aria-labelledby={headingId}
        >
            <h2 className="lane-header" id={headingId}>
                <span
                    className="lane-dot"
                    style={lane.accent ? { background: lane.accent } : undefined}
                    aria-hidden="true"
                />
                {lane.label}
                <span className="count">({cards.length})</span>
                {overLimit ? (
                    <span className="wip-warn" title={`WIP limit is ${lane.wip_limit}`}>
                        over limit
                    </span>
                ) : null}
            </h2>

            {cards.length === 0 ? (
                <p className="lane-empty">{isOver ? 'Drop here' : 'Nothing here'}</p>
            ) : (
                <ul className="lane-cards">
                    {cards.map((card) => (
                        <Card key={card.sys_id} card={card} laneLabel={lane.label} onOpen={onOpen} />
                    ))}
                </ul>
            )}
        </section>
    )
}
