import React, { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../api'
import { BoardConfig, KanbanError, RecordDetail } from '../types'

export interface RecordModalProps {
    board: BoardConfig
    sysId: string
    onClose: () => void
    /** Called after a journal write, so the board can pick up the new sys_updated_on. */
    onRecordChanged: (sysId: string, sysUpdatedOn: string) => void
}

export function RecordModal({ board, sysId, onClose, onRecordChanged }: RecordModalProps): React.JSX.Element {
    const [detail, setDetail] = useState<RecordDetail | null>(null)
    const [error, setError] = useState<KanbanError | null>(null)
    const [text, setText] = useState('')
    const [field, setField] = useState(board.journal.field)
    const [posting, setPosting] = useState(false)
    const [postError, setPostError] = useState<string | null>(null)

    const dialogRef = useRef<HTMLDivElement>(null)
    const closeRef = useRef<HTMLButtonElement>(null)

    useEffect(() => {
        let live = true
        api.record(board.sys_id, board.table, sysId)
            .then((d) => {
                if (live) setDetail(d)
            })
            .catch((e: unknown) => {
                if (live) setError(e instanceof KanbanError ? e : null)
            })
        return () => {
            live = false
        }
    }, [board.sys_id, board.table, sysId])

    // Focus the dialog on open; focus returns to the originating card via App.
    useEffect(() => {
        closeRef.current?.focus()
    }, [])

    const onKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLDivElement>) => {
            if (event.key === 'Escape') {
                event.stopPropagation()
                onClose()
                return
            }
            if (event.key !== 'Tab') return

            const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
                'button:not([disabled]), textarea, select, a[href], input:not([disabled])'
            )
            if (!focusables || focusables.length === 0) return
            const first = focusables[0]
            const last = focusables[focusables.length - 1]
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault()
                last.focus()
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault()
                first.focus()
            }
        },
        [onClose]
    )

    const writable = board.journal.options.filter((o) => o.can_write)

    async function post(): Promise<void> {
        const value = text.trim()
        if (!value || posting) return
        setPosting(true)
        setPostError(null)
        try {
            const result = await api.addJournal(board.sys_id, board.table, sysId, field, value)
            setDetail((prev) =>
                prev ? { ...prev, journal: [result.entry, ...prev.journal] } : prev
            )
            setText('')
            onRecordChanged(sysId, result.sys_updated_on)
        } catch (e: unknown) {
            setPostError(e instanceof KanbanError ? e.message : 'That entry could not be saved.')
        } finally {
            setPosting(false)
        }
    }

    return (
        <div
            className="modal-backdrop"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose()
            }}
        >
            <div
                className="modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="kanban-modal-title"
                ref={dialogRef}
                onKeyDown={onKeyDown}
            >
                <header className="modal-header">
                    <h2 id="kanban-modal-title">{detail ? detail.title : 'Loading record'}</h2>
                    <button type="button" className="icon-btn" onClick={onClose} ref={closeRef} aria-label="Close">
                        &#10005;
                    </button>
                </header>

                <div className="modal-body">
                    {error ? (
                        <p role="alert">
                            {error.message} {error.suggestedAction}
                        </p>
                    ) : null}

                    {!detail && !error ? <p className="section-title">Loading…</p> : null}

                    {detail ? (
                        <>
                            {detail.fields.length > 0 ? (
                                <dl className="field-grid">
                                    {detail.fields.map((f) => (
                                        <React.Fragment key={f.name}>
                                            <dt>{f.label}</dt>
                                            <dd>{f.display_value || '—'}</dd>
                                        </React.Fragment>
                                    ))}
                                </dl>
                            ) : null}

                            <div>
                                <h3 className="section-title">Activity</h3>
                                {detail.journal.length === 0 ? (
                                    <p className="entry-text" style={{ color: 'var(--text-muted)' }}>
                                        Nothing has been posted on this record yet.
                                    </p>
                                ) : (
                                    <ul className="stream" style={{ marginTop: 12 }}>
                                        {detail.journal.map((entry) => (
                                            <li className="entry" key={entry.sys_id}>
                                                <span className="initials" aria-hidden="true">
                                                    {entry.initials}
                                                </span>
                                                <div className="entry-body">
                                                    <div className="entry-head">
                                                        <span className="who">{entry.author}</span>
                                                        <span>{entry.field.replace('_', ' ')}</span>
                                                        <span>{entry.created_on_display}</span>
                                                    </div>
                                                    <p className="entry-text">{entry.value}</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {detail.journal_has_more ? (
                                    <p className="meta-text" style={{ marginTop: 10 }}>
                                        Older entries are not shown. Open the record for the full history.
                                    </p>
                                ) : null}
                            </div>
                        </>
                    ) : null}
                </div>

                {detail && writable.length > 0 ? (
                    <div className="compose">
                        <label className="visually-hidden" htmlFor="kanban-journal-text">
                            New entry
                        </label>
                        <textarea
                            id="kanban-journal-text"
                            value={text}
                            placeholder="Add a note…"
                            onChange={(e) => setText(e.target.value)}
                        />
                        {postError ? (
                            <p className="meta-text" role="alert" style={{ color: 'var(--red)' }}>
                                {postError}
                            </p>
                        ) : null}
                        <div className="compose-actions">
                            {board.journal.allow_choice && writable.length > 1 ? (
                                <>
                                    <label className="visually-hidden" htmlFor="kanban-journal-field">
                                        Post as
                                    </label>
                                    <select
                                        id="kanban-journal-field"
                                        value={field}
                                        onChange={(e) => setField(e.target.value)}
                                    >
                                        {writable.map((o) => (
                                            <option key={o.name} value={o.name}>
                                                {o.label}
                                            </option>
                                        ))}
                                    </select>
                                </>
                            ) : (
                                <span className="meta-text">{writable[0].label}</span>
                            )}
                            <button
                                type="button"
                                className="btn-primary"
                                disabled={posting || text.trim().length === 0}
                                onClick={() => void post()}
                            >
                                {posting ? 'Posting…' : 'Post'}
                            </button>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    )
}
