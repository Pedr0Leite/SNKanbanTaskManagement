import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import { FieldOption, KanbanError, TableOption } from '../types'

export interface NewBoardDialogProps {
    onClose: () => void
    onCreated: (boardId: string) => void
}

export function NewBoardDialog({ onClose, onCreated }: NewBoardDialogProps): React.JSX.Element {
    const [tables, setTables] = useState<TableOption[]>([])
    const [tableFilter, setTableFilter] = useState('')
    const [fields, setFields] = useState<FieldOption[]>([])

    const [name, setName] = useState('')
    const [table, setTable] = useState('')
    const [laneField, setLaneField] = useState('state')
    const [filter, setFilter] = useState('active=true')
    const [titleField, setTitleField] = useState('number')
    const [subtitleField, setSubtitleField] = useState('short_description')
    const [journalField, setJournalField] = useState('comments')
    const [allowJournalChoice, setAllowJournalChoice] = useState(true)
    const [cardFields, setCardFields] = useState<string[]>([])
    const [modalFields, setModalFields] = useState<string[]>([])

    const [loadingTables, setLoadingTables] = useState(true)
    const [loadingFields, setLoadingFields] = useState(false)
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

    // Field list follows the chosen table, so the pickers can never offer a
    // field that does not exist on it.
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
                setModalFields((prev) => prev.filter(has))
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
        // laneField/titleField are intentionally excluded: they are corrected
        // here, and depending on them would restart the fetch on every fix.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [table])

    const visibleTables = useMemo(() => {
        const q = tableFilter.trim().toLowerCase()
        if (!q) return tables.slice(0, 200)
        return tables
            .filter((t) => t.label.toLowerCase().includes(q) || t.name.toLowerCase().includes(q))
            .slice(0, 200)
    }, [tables, tableFilter])

    const laneOptions = fields.filter((f) => f.lane_capable)

    function toggle(list: string[], setList: (v: string[]) => void, fieldName: string): void {
        setList(list.includes(fieldName) ? list.filter((f) => f !== fieldName) : [...list, fieldName])
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
                modal_fields: Array.from(new Set([...modalFields, ...cardFields])),
            })
            onCreated(result.sys_id)
        } catch (e: unknown) {
            setError(e instanceof KanbanError ? `${e.message} ${e.suggestedAction}` : 'The board could not be created.')
        } finally {
            setSaving(false)
        }
    }

    const ready = name.trim().length > 0 && table.length > 0 && laneField.length > 0 && titleField.length > 0

    return (
        <div
            className="modal-backdrop"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose()
            }}
        >
            <div
                className="modal wide"
                role="dialog"
                aria-modal="true"
                aria-labelledby="new-board-title"
                onKeyDown={(e) => {
                    if (e.key === 'Escape') onClose()
                }}
            >
                <header className="modal-header">
                    <h2 id="new-board-title">New board</h2>
                    <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
                        &#10005;
                    </button>
                </header>

                <div className="modal-body">
                    {error ? (
                        <p className="form-error" role="alert">
                            {error}
                        </p>
                    ) : null}

                    <div className="form-row">
                        <label htmlFor="nb-name">Board name</label>
                        <input
                            id="nb-name"
                            type="text"
                            value={name}
                            placeholder="e.g. Change requests"
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="form-row">
                        <label htmlFor="nb-table-filter">Table</label>
                        <div>
                            <input
                                id="nb-table-filter"
                                type="search"
                                value={tableFilter}
                                placeholder={loadingTables ? 'Loading tables…' : 'Search tables…'}
                                onChange={(e) => setTableFilter(e.target.value)}
                            />
                            <select
                                className="table-select"
                                size={6}
                                value={table}
                                onChange={(e) => setTable(e.target.value)}
                                aria-label="Tables extending task"
                            >
                                {visibleTables.map((t) => (
                                    <option key={t.name} value={t.name}>
                                        {t.label} ({t.name})
                                    </option>
                                ))}
                            </select>
                            <p className="hint">Only tables that extend task are listed.</p>
                        </div>
                    </div>

                    {table ? (
                        <>
                            <div className="form-row">
                                <label htmlFor="nb-lane">Lane field</label>
                                <div>
                                    <select
                                        id="nb-lane"
                                        value={laneField}
                                        onChange={(e) => setLaneField(e.target.value)}
                                        disabled={loadingFields}
                                    >
                                        {laneOptions.map((f) => (
                                            <option key={f.name} value={f.name}>
                                                {f.label} ({f.name})
                                            </option>
                                        ))}
                                    </select>
                                    <p className="hint">
                                        Its choice values become the columns. Rejected on save if it has none.
                                    </p>
                                </div>
                            </div>

                            <div className="form-row">
                                <label htmlFor="nb-filter">Filter</label>
                                <div>
                                    <input
                                        id="nb-filter"
                                        type="text"
                                        value={filter}
                                        placeholder="active=true^priority&lt;=2"
                                        onChange={(e) => setFilter(e.target.value)}
                                    />
                                    <p className="hint">
                                        Encoded query. Leave empty for every record the user can read.
                                    </p>
                                </div>
                            </div>

                            <div className="form-row">
                                <label htmlFor="nb-title">Card title</label>
                                <select
                                    id="nb-title"
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

                            <div className="form-row">
                                <label htmlFor="nb-subtitle">Card subtitle</label>
                                <select
                                    id="nb-subtitle"
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

                            <div className="form-row">
                                <label htmlFor="nb-journal">Journal field</label>
                                <div>
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
                                        Let users choose between comments and work notes
                                    </label>
                                </div>
                            </div>

                            <div className="form-row">
                                <span className="label-as-text">Fields</span>
                                <div>
                                    <p className="hint">
                                        Tick <strong>card</strong> to show it on the card, <strong>modal</strong>{' '}
                                        to show it when the card is opened.
                                    </p>
                                    <ul className="field-picker">
                                        {fields.map((f) => (
                                            <li key={f.name}>
                                                <span className="field-name">{f.label}</span>
                                                <label className="checkbox">
                                                    <input
                                                        type="checkbox"
                                                        checked={cardFields.includes(f.name)}
                                                        onChange={() => toggle(cardFields, setCardFields, f.name)}
                                                    />
                                                    card
                                                </label>
                                                <label className="checkbox">
                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            modalFields.includes(f.name) ||
                                                            cardFields.includes(f.name)
                                                        }
                                                        disabled={cardFields.includes(f.name)}
                                                        onChange={() => toggle(modalFields, setModalFields, f.name)}
                                                    />
                                                    modal
                                                </label>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </>
                    ) : null}
                </div>

                <div className="compose">
                    <div className="compose-actions">
                        <button type="button" className="chip-btn" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="btn-primary"
                            disabled={!ready || saving}
                            onClick={() => void save()}
                        >
                            {saving ? 'Creating…' : 'Create board'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
