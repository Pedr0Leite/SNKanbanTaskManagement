import React from 'react'
import { KanbanError } from '../types'

/**
 * Last line of defence. Without this, any render-time exception unmounts the
 * tree and leaves a white page with nothing to diagnose from.
 */
export class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { error: Error | null }
> {
    constructor(props: { children: React.ReactNode }) {
        super(props)
        this.state = { error: null }
    }

    static getDerivedStateFromError(error: Error): { error: Error } {
        return { error }
    }

    override componentDidCatch(error: Error, info: React.ErrorInfo): void {
        console.error('[Kanban] render failed', error, info.componentStack)
    }

    override render(): React.ReactNode {
        if (!this.state.error) return this.props.children
        return (
            <div className="kanban-root" data-theme="light" style={{ display: 'block', padding: 24 }}>
                <div className="state-panel" role="alert">
                    <span className="glyph" aria-hidden="true">
                        &#9888;
                    </span>
                    <h2>The board crashed while rendering</h2>
                    <p>{this.state.error.message}</p>
                    <p>The full stack is in the browser console.</p>
                    <button type="button" className="chip-btn" onClick={() => window.location.reload()}>
                        Reload
                    </button>
                </div>
            </div>
        )
    }
}

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

export function NoBoards(): React.JSX.Element {
    return (
        <div className="state-panel">
            <span className="glyph" aria-hidden="true">
                &#128204;
            </span>
            <h2>No boards are available to you</h2>
            <p>
                Either no Kanban board has been configured yet, or none of them are active and open to your
                roles.
            </p>
            <p>
                An administrator can create one in the <strong>Kanban Board</strong> table, pointing it at any
                table that extends <code>task</code>.
            </p>
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
