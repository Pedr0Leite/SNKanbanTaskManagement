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
    const [pickerOpen, setPickerOpen] = useState(false)
    const [fieldFilter, setFieldFilter] = useState('')
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

    // An empty query matches nothing, rather than dumping every table on the
    // instance into the dropdown.
    const visibleTables = useMemo(() => {
        const q = tableFilter.trim().toLowerCase()
        if (!q) return []
        return tables
            .filter((t) => t.label.toLowerCase().includes(q) || t.name.toLowerCase().includes(q))
            .slice(0, 300)
    }, [tables, tableFilter])

    const selectedTable = tables.find((t) => t.name === table)
    const laneOptions = fields.filter((f) => f.lane_capable)

    const labelOf = (fieldName: string): string =>
        fields.find((f) => f.name === fieldName)?.label ?? fieldName

    // Selected fields stay pinned at the top, so they never scroll out of sight
    // behind a search that no longer matches them. An empty query matches
    // nothing, so what is left is exactly what you have already picked.
    const pickableFields = useMemo(() => {
        const q = fieldFilter.trim().toLowerCase()
        const candidates = fields.filter((f) => f.name !== titleField && f.name !== subtitleField)
        const matches = q
            ? candidates.filter(
                  (f) => f.label.toLowerCase().includes(q) || f.name.toLowerCase().includes(q)
              )
            : []
        const selected = candidates.filter((f) => cardFields.includes(f.name))
        const rest = matches.filter((f) => !cardFields.includes(f.name))
        return [...selected, ...rest]
    }, [fields, fieldFilter, titleField, subtitleField, cardFields])

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

    // Only an explicit "these lanes cannot resolve" blocks submission. A preview
    // that merely failed to load must not lock the button — the server validates
    // the lane field again on create, so the worst case is a clear error there.
    const lanesBroken = lanes !== null && !lanes.resolvable
    const canCreate = step1Done && titleField.length > 0 && !lanesBroken && !loadingLanes

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

                                    {selectedTable && !pickerOpen ? (
                                        <div className="ref-chosen">
                                            <span className="ref-icon" aria-hidden="true">
                                                &#9636;
                                            </span>
                                            <span className="ref-chosen-label">
                                                {selectedTable.label}
                                                <code>{selectedTable.name}</code>
                                            </span>
                                            <button
                                                type="button"
                                                className="ref-clear"
                                                aria-label="Choose a different table"
                                                onClick={() => {
                                                    setPickerOpen(true)
                                                    setTableFilter('')
                                                }}
                                            >
                                                Change
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="ref-field">
                                            {/* The magnifier is drawn by the
                                                input's background image now. */}
                                            <input
                                                id="nb-table-filter"
                                                type="text"
                                                role="combobox"
                                                aria-expanded={pickerOpen}
                                                aria-controls="nb-table-results"
                                                aria-autocomplete="list"
                                                autoComplete="off"
                                                value={tableFilter}
                                                placeholder={
                                                    loadingTables
                                                        ? 'Loading tables…'
                                                        : 'Type to search tables that extend task'
                                                }
                                                onFocus={() => setPickerOpen(true)}
                                                onChange={(e) => {
                                                    setTableFilter(e.target.value)
                                                    setPickerOpen(true)
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Escape' && pickerOpen) {
                                                        e.stopPropagation()
                                                        setPickerOpen(false)
                                                    }
                                                    if (e.key === 'Enter' && visibleTables[0]) {
                                                        e.preventDefault()
                                                        setTable(visibleTables[0].name)
                                                        setPickerOpen(false)
                                                    }
                                                }}
                                            />
                                            {pickerOpen ? (
                                                <ul
                                                    className="ref-results"
                                                    id="nb-table-results"
                                                    role="listbox"
                                                    aria-label="Tables"
                                                >
                                                    {visibleTables.map((t) => (
                                                        <li key={t.name}>
                                                            <button
                                                                type="button"
                                                                role="option"
                                                                aria-selected={t.name === table}
                                                                className={t.name === table ? 'selected' : ''}
                                                                onClick={() => {
                                                                    setTable(t.name)
                                                                    setPickerOpen(false)
                                                                }}
                                                            >
                                                                <span className="nb-table-label">{t.label}</span>
                                                                <code>{t.name}</code>
                                                            </button>
                                                        </li>
                                                    ))}
                                                    {visibleTables.length === 0 && !loadingTables ? (
                                                        <li className="nb-tables-empty">
                                                            {tableFilter.trim()
                                                                ? `No table matches “${tableFilter}”.`
                                                                : 'Type to search tables.'}
                                                        </li>
                                                    ) : null}
                                                </ul>
                                            ) : null}
                                        </div>
                                    )}
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
                                    <label htmlFor="nb-field-search">Extra fields on the card</label>
                                    <input
                                        id="nb-field-search"
                                        type="search"
                                        value={fieldFilter}
                                        placeholder="Search fields"
                                        onChange={(e) => setFieldFilter(e.target.value)}
                                    />
                                    <p className="nb-picked">
                                        <span>
                                            {cardFields.length === 0
                                                ? 'None selected'
                                                : `${cardFields.length} selected`}
                                        </span>
                                        {cardFields.length > 0 ? (
                                            <button type="button" onClick={() => setCardFields([])}>
                                                Clear
                                            </button>
                                        ) : null}
                                    </p>
                                    <ul className="nb-chips">
                                        {pickableFields.map((f) => (
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
                                        {pickableFields.length === 0 ? (
                                            <li className="nb-chips-empty">
                                                {fieldFilter.trim()
                                                    ? `No field matches “${fieldFilter}”.`
                                                    : 'Type to search fields.'}
                                            </li>
                                        ) : null}
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
                                            <span className="nb-preview-title-line">
                                                {labelOf(titleField) || 'Card heading'}
                                            </span>
                                            {subtitleField ? (
                                                <span className="nb-preview-sub-line">
                                                    {labelOf(subtitleField)}
                                                </span>
                                            ) : null}
                                            {cardFields.length > 0 ? (
                                                <span className="nb-preview-meta">
                                                    {cardFields.map((f) => (
                                                        <span className="nb-preview-pill" key={f}>
                                                            {labelOf(f)}
                                                        </span>
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
