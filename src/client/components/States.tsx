import React from 'react'
import { KanbanError } from '../types'

export function Loading(): React.JSX.Element {
    return (
        <div className="skeleton-board" role="status" aria-live="polite">
            <span className="visually-hidden">Loading board</span>
            {[0, 1, 2].map((lane) => (
                <div className="skeleton-lane" key={lane} aria-hidden="true">
                    <div className="skeleton-bar" />
                    {[0, 1, 2].map((card) => (
                        <div className="skeleton-card" key={card} />
                    ))}
                </div>
            ))}
        </div>
    )
}

export function Empty({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }): React.JSX.Element {
    return (
        <div className="state-panel">
            <span className="glyph" aria-hidden="true">
                &#128203;
            </span>
            <h2>{hasFilters ? 'Nothing matches those filters' : 'This board is empty'}</h2>
            <p>
                {hasFilters
                    ? 'No records match your search on this board. Widen the filter to see more.'
                    : 'No records match this board’s configured filter yet. When one appears it will show up here.'}
            </p>
            {hasFilters ? (
                <button type="button" className="chip-btn" onClick={onClear}>
                    Clear filters
                </button>
            ) : null}
        </div>
    )
}

export function NoAccess({ error }: { error: KanbanError }): React.JSX.Element {
    return (
        <div className="state-panel">
            <span className="glyph" aria-hidden="true">
                &#128274;
            </span>
            <h2>You cannot open this board</h2>
            <p>{error.message}</p>
            <p>{error.suggestedAction}</p>
        </div>
    )
}

export function Failed({ error, onRetry }: { error: KanbanError; onRetry: () => void }): React.JSX.Element {
    return (
        <div className="state-panel" role="alert">
            <span className="glyph" aria-hidden="true">
                &#9888;
            </span>
            <h2>The board could not load</h2>
            <p>{error.message}</p>
            <p>{error.suggestedAction}</p>
            <button type="button" className="chip-btn" onClick={onRetry}>
                Try again
            </button>
            {error.correlationId ? <p className="correlation">Reference: {error.correlationId}</p> : null}
        </div>
    )
}
