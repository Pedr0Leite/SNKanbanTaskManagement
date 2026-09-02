import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import { FieldChoices, FieldOption, KanbanError, TableOption } from '../types'

export interface NewBoardDialogProps {
    onClose: () => void
    onCreated: (boardId: string) => void
}

/** Reused for the preview dots so a new board looks like the seeded one. */
const PREVIEW_ACCENTS = ['#49C4E5', '#8471F2', '#F2C94C', '#67E2AE', '#828FA3', '#E58A49']

export function NewBoardDialog({ onClose, onCreated }: NewBoardDialogProps): React.JSX.Element {
    const [step, setStep] = useState<1 | 2>(1)

    const [tables, setTables] = useState<TableOption[]>([])
    const [tableFilter, setTableFilter] = useState('')
    const [fields, setFields] = useState<FieldOption[]>([])
    const [lanes, setLanes] = useState<FieldChoices | null>(null)

    const [name, setName] = useState('')
    const [table, setTable] = useState('')
    const [laneField, setLaneField] = useState('state')
    const [filter, setFilter] = useState('active=true')
    const [titleField, setTitleField] = useState('number')
    const [subtitleField, setSubtitleField] = useState('short_description')
    const [journalField, setJournalField] = useState('comments')
    const [allowJournalChoice, setAllowJournalChoice] = useState(true)
    const [cardFields, setCardFields] = useState<string[]>([])

    const [loadingTables, setLoadingTables] = useState(true)
    const [loadingFields, setLoadingFields] = useState(false)
    const [loadingLanes, setLoadingLanes] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let live = true
        api.tables()
            .then((list) => {
                if (live) setTables(list)
            })
            .catch((e: unknown) => {
                if (live) setError(e instanceof KanbanError ? e.message : 'Could not load the table list.')
            })
            .finally(() => {
                if (live) setLoadingTables(false)
            })
        return () => {
            live = false
        }
    }, [])

    useEffect(() => {
        if (!table) {
            setFields([])
            return
        }
        let live = true
        setLoadingFields(true)
        setError(null)
        api.tableFields(table)
            .then((list) => {
                if (!live) return
                setFields(list)
                const has = (n: string): boolean => list.some((f) => f.name === n)
                if (!has(laneField)) setLaneField(list.find((f) => f.lane_capable)?.name ?? '')
                if (!has(titleField)) setTitleField(list[0]?.name ?? '')
                if (!has(subtitleField)) setSubtitleField('')
                setCardFields((prev) => prev.filter(has))
            })
            .catch((e: unknown) => {
                if (live) setError(e instanceof KanbanError ? e.message : 'Could not load fields for that table.')
            })
            .finally(() => {
                if (live) setLoadingFields(false)
            })
        return () => {
            live = false
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [table])

    // The preview: resolve the real lanes for this table and lane field, so the
    // columns shown are the columns the board will actually have.
    useEffect(() => {
        if (!table || !laneField) {
            setLanes(null)
            return
        }
        let live = true
        setLoadingLanes(true)
        api.fieldChoices(table, laneField)
            .then((result) => {
                if (live) setLanes(result)
            })
            .catch(() => {
                if (live) setLanes(null)
            })
            .finally(() => {
                if (live) setLoadingLanes(false)
            })
        return () => {
            live = false
        }
    }, [table, laneField])

    const visibleTables = useMemo(() => {
        const q = tableFilter.trim().toLowerCase()
        if (!q) return tables.slice(0, 300)
        return tables
            .filter((t) => t.label.toLowerCase().includes(q) || t.name.toLowerCase().includes(q))
            .slice(0, 300)
    }, [tables, tableFilter])

    const selectedTable = tables.find((t) => t.name === table)
    const laneOptions = fields.filter((f) => f.lane_capable)

    function toggleCardField(fieldName: string): void {
        setCardFields((prev) =>
            prev.includes(fieldName) ? prev.filter((f) => f !== fieldName) : [...prev, fieldName]
        )
    }

    async function save(): Promise<void> {
        if (saving) return
        setSaving(true)
        setError(null)
        try {
            const result = await api.createBoard({
                name: name.trim(),
                table,
                lane_field: laneField,
                filter: filter.trim(),
                card_title_field: titleField,
                card_subtitle_field: subtitleField,
                journal_field: journalField,
                allow_journal_choice: allowJournalChoice,
                card_fields: cardFields,
                modal_fields: cardFields,
            })
            onCreated(result.sys_id)
        } catch (e: unknown) {
            setError(
                e instanceof KanbanError ? `${e.message} ${e.suggestedAction}` : 'The board could not be created.'
            )
        } finally {
            setSaving(false)
        }
    }

    const step1Done = name.trim().length > 0 && table.length > 0 && laneField.length > 0
    const canCreate = step1Done && titleField.length > 0 && lanes?.resolvable === true

    return (
        <div
            className="modal-backdrop"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose()
            }}
        >
            <div
                className="modal nb"
                role="dialog"
                aria-modal="true"
                aria-labelledby="nb-title"
                onKeyDown={(e) => {
                    if (e.key === 'Escape') onClose()
                }}
            >
                <header className="nb-header">
                    <div>
                        <p className="nb-eyebrow">New board</p>
                        <h2 id="nb-title">{name.trim() || 'Untitled board'}</h2>
                    </div>
                    <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
                        &#10005;
                    </button>
                </header>

                <nav className="nb-steps" aria-label="Steps">
                    <button
                        type="button"
                        className="nb-step"
                        aria-current={step === 1 ? 'step' : undefined}
                        onClick={() => setStep(1)}
                    >
                        <span className="nb-step-num">1</span>
                        <span>
                            <strong>Source</strong>
                            <em>{selectedTable ? selectedTable.label : 'Pick a table'}</em>
                        </span>
                    </button>
                    <button
                        type="button"
                        className="nb-step"
                        aria-current={step === 2 ? 'step' : undefined}
                        disabled={!step1Done}
                        onClick={() => setStep(2)}
                    >
                        <span className="nb-step-num">2</span>
                        <span>
                            <strong>Cards</strong>
                            <em>{cardFields.length > 0 ? `${cardFields.length} fields` : 'Title and subtitle'}</em>
                        </span>
                    </button>
                </nav>

                <div className="nb-body">
                    <div className="nb-form">
                        {error ? (
                            <p className="form-error" role="alert">
                                {error}
                            </p>
                        ) : null}

                        {step === 1 ? (
                            <>
                                <div className="nb-field">
                                    <label htmlFor="nb-name">Board name</label>
                                    <input
                                        id="nb-name"
                                        type="text"
                                        value={name}
                                        placeholder="Change requests"
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>

                                <div className="nb-field">
                                    <label htmlFor="nb-table-filter">Table</label>
                                    <input
                                        id="nb-table-filter"
                                        type="search"
                                        value={tableFilter}
                                        placeholder={loadingTables ? 'Loading tables…' : 'Search tables that extend task'}
                                        onChange={(e) => setTableFilter(e.target.value)}
                                    />
                                    <ul className="nb-tables" role="listbox" aria-label="Tables">
                                        {visibleTables.map((t) => (
                                            <li key={t.name}>
                                                <button
                                                    type="button"
                                                    role="option"
                                                    aria-selected={t.name === table}
                                                    className={t.name === table ? 'selected' : ''}
                                                    onClick={() => setTable(t.name)}
                                                >
                                                    <span className="nb-table-label">{t.label}</span>
                                                    <code>{t.name}</code>
                                                </button>
                                            </li>
                                        ))}
                                        {visibleTables.length === 0 && !loadingTables ? (
                                            <li className="nb-tables-empty">No table matches “{tableFilter}”.</li>
                                        ) : null}
                                    </ul>
                                </div>

                                {table ? (
                                    <>
                                        <div className="nb-field">
                                            <label htmlFor="nb-lane">Columns come from</label>
                                            <select
                                                id="nb-lane"
                                                value={laneField}
                                                disabled={loadingFields}
                                                onChange={(e) => setLaneField(e.target.value)}
                                            >
                                                {laneOptions.map((f) => (
                                                    <option key={f.name} value={f.name}>
                                                        {f.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="nb-field">
                                            <label htmlFor="nb-filter">Only show records where</label>
                                            <input
                                                id="nb-filter"
                                                type="text"
                                                value={filter}
                                                spellCheck={false}
                                                placeholder="active=true"
                                                onChange={(e) => setFilter(e.target.value)}
                                            />
                                            <p className="hint">
                                                Encoded query. Leave empty to show every record the viewer can
                                                read.
                                            </p>
                                        </div>
                                    </>
                                ) : null}
                            </>
                        ) : (
                            <>
                                <div className="nb-field">
                                    <label htmlFor="nb-title-field">Card heading</label>
                                    <select
                                        id="nb-title-field"
                                        value={titleField}
                                        onChange={(e) => setTitleField(e.target.value)}
                                    >
                                        {fields.map((f) => (
                                            <option key={f.name} value={f.name}>
                                                {f.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="nb-field">
                                    <label htmlFor="nb-subtitle-field">Card subheading</label>
                                    <select
                                        id="nb-subtitle-field"
                                        value={subtitleField}
                                        onChange={(e) => setSubtitleField(e.target.value)}
                                    >
                                        <option value="">None</option>
                                        {fields.map((f) => (
                                            <option key={f.name} value={f.name}>
                                                {f.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="nb-field">
                                    <label htmlFor="nb-journal">Notes go to</label>
                                    <select
                                        id="nb-journal"
                                        value={journalField}
                                        onChange={(e) => setJournalField(e.target.value)}
                                    >
                                        <option value="comments">Comments</option>
                                        <option value="work_notes">Work notes</option>
                                    </select>
                                    <label className="checkbox">
                                        <input
                                            type="checkbox"
                                            checked={allowJournalChoice}
                                            onChange={(e) => setAllowJournalChoice(e.target.checked)}
                                        />
                                        Let people choose which one
                                    </label>
                                </div>

                                <div className="nb-field">
                                    <span className="nb-label-text">Extra fields on the card</span>
                                    <ul className="nb-chips">
                                        {fields
                                            .filter((f) => f.name !== titleField && f.name !== subtitleField)
                                            .map((f) => (
                                                <li key={f.name}>
                                                    <button
                                                        type="button"
                                                        className={`nb-chip${cardFields.includes(f.name) ? ' on' : ''}`}
                                                        aria-pressed={cardFields.includes(f.name)}
                                                        onClick={() => toggleCardField(f.name)}
                                                    >
                                                        {f.label}
                                                    </button>
                                                </li>
                                            ))}
                                    </ul>
                                </div>
                            </>
                        )}
                    </div>

                    <aside className="nb-preview" aria-label="Board preview">
                        <p className="nb-preview-title">
                            Preview
                            {loadingLanes ? <span className="nb-preview-busy">resolving…</span> : null}
                        </p>

                        {!table ? (
                            <p className="nb-preview-hint">
                                Choose a table and its columns appear here, exactly as the board will show them.
                            </p>
                        ) : lanes && !lanes.resolvable ? (
                            <p className="nb-preview-warn" role="alert">
                                {lanes.reason || 'That field has no choices, so it cannot make columns.'}
                            </p>
                        ) : (
                            <div className="nb-preview-board">
                                {(lanes?.choices ?? []).map((lane, index) => (
                                    <div className="nb-preview-lane" key={lane.value}>
                                        <p className="nb-preview-lane-head">
                                            <span
                                                className="lane-dot"
                                                style={{
                                                    background: PREVIEW_ACCENTS[index % PREVIEW_ACCENTS.length],
                                                }}
                                                aria-hidden="true"
                                            />
                                            {lane.label}
                                        </p>
                                        <div className="nb-preview-card">
                                            <span className="nb-preview-line w70" />
                                            {subtitleField ? <span className="nb-preview-line w90 dim" /> : null}
                                            {cardFields.length > 0 ? (
                                                <span className="nb-preview-meta">
                                                    {cardFields.slice(0, 3).map((f) => (
                                                        <span className="nb-preview-pill" key={f} />
                                                    ))}
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {lanes?.resolvable && lanes.source && lanes.source !== table ? (
                            <p className="nb-preview-note">
                                Columns are inherited from <code>{lanes.source}</code>.
                            </p>
                        ) : null}
                    </aside>
                </div>

                <footer className="nb-footer">
                    <button type="button" className="chip-btn" onClick={onClose}>
                        Cancel
                    </button>
                    <span className="qb-spacer" />
                    {step === 1 ? (
                        <button
                            type="button"
                            className="btn-primary"
                            disabled={!step1Done}
                            onClick={() => setStep(2)}
                        >
                            Next: cards
                        </button>
                    ) : (
                        <>
                            <button type="button" className="chip-btn" onClick={() => setStep(1)}>
                                Back
                            </button>
                            <button
                                type="button"
                                className="btn-primary"
                                disabled={!canCreate || saving}
                                onClick={() => void save()}
                            >
                                {saving ? 'Creating…' : 'Create board'}
                            </button>
                        </>
                    )}
                </footer>
            </div>
        </div>
    )
}
