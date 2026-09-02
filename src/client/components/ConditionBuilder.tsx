import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import { FieldOption } from '../types'

/** One row of the builder. `join` is how it attaches to the row above it. */
export interface Condition {
    id: number
    join: 'AND' | 'OR'
    field: string
    operator: string
    value: string
}

interface Operator {
    /** Encoded-query operator, or a sentinel handled in buildQuery. */
    op: string
    label: string
    /** Operators that stand alone — no value input. */
    unary?: boolean
}

const TEXT_OPS: Operator[] = [
    { op: '=', label: 'is' },
    { op: '!=', label: 'is not' },
    { op: 'LIKE', label: 'contains' },
    { op: 'NOTLIKE', label: 'does not contain' },
    { op: 'STARTSWITH', label: 'starts with' },
    { op: 'ENDSWITH', label: 'ends with' },
    { op: 'ISEMPTY', label: 'is empty', unary: true },
    { op: 'ISNOTEMPTY', label: 'is not empty', unary: true },
]

const NUMBER_OPS: Operator[] = [
    { op: '=', label: 'is' },
    { op: '!=', label: 'is not' },
    { op: '>', label: 'is greater than' },
    { op: '>=', label: 'is at least' },
    { op: '<', label: 'is less than' },
    { op: '<=', label: 'is at most' },
    { op: 'ISEMPTY', label: 'is empty', unary: true },
    { op: 'ISNOTEMPTY', label: 'is not empty', unary: true },
]

const CHOICE_OPS: Operator[] = [
    { op: '=', label: 'is' },
    { op: '!=', label: 'is not' },
    { op: 'IN', label: 'is one of' },
    { op: 'NOT IN', label: 'is none of' },
    { op: 'ISEMPTY', label: 'is empty', unary: true },
    { op: 'ISNOTEMPTY', label: 'is not empty', unary: true },
]

const DATE_OPS: Operator[] = [
    { op: '=', label: 'on' },
    { op: '!=', label: 'not on' },
    { op: '>', label: 'after' },
    { op: '<', label: 'before' },
    { op: 'ISEMPTY', label: 'is empty', unary: true },
    { op: 'ISNOTEMPTY', label: 'is not empty', unary: true },
]

const BOOLEAN_OPS: Operator[] = [
    { op: '=', label: 'is' },
    { op: '!=', label: 'is not' },
]

const REFERENCE_OPS: Operator[] = [
    { op: '=', label: 'is' },
    { op: '!=', label: 'is not' },
    { op: 'ISEMPTY', label: 'is empty', unary: true },
    { op: 'ISNOTEMPTY', label: 'is not empty', unary: true },
]

const DATE_TYPES = ['glide_date', 'glide_date_time', 'due_date']
const NUMBER_TYPES = ['integer', 'decimal', 'float', 'longint', 'price', 'currency']

function operatorsFor(type: string): Operator[] {
    if (type === 'boolean') return BOOLEAN_OPS
    if (type === 'reference') return REFERENCE_OPS
    if (type === 'choice') return CHOICE_OPS
    if (DATE_TYPES.includes(type)) return DATE_OPS
    if (NUMBER_TYPES.includes(type)) return NUMBER_OPS
    return TEXT_OPS
}

function isUnary(type: string, op: string): boolean {
    return operatorsFor(type).some((o) => o.op === op && o.unary === true)
}

/**
 * Encoded query from the rows.
 *
 * `^` is AND and `^OR` is OR, and ServiceNow binds `^OR` to the preceding
 * condition only — so a row's own join is what precedes it, never what follows.
 */
export function buildQuery(conditions: Condition[], fields: FieldOption[]): string {
    const parts: string[] = []

    for (const c of conditions) {
        if (!c.field || !c.operator) continue
        const type = fields.find((f) => f.name === c.field)?.type ?? 'string'
        const unary = isUnary(type, c.operator)
        if (!unary && c.value === '') continue

        const fragment = unary ? `${c.field}${c.operator}` : `${c.field}${c.operator}${c.value}`
        parts.push(parts.length === 0 ? fragment : `${c.join === 'OR' ? '^OR' : '^'}${fragment}`)
    }

    return parts.join('')
}

/** Human-readable summary, in the spirit of ServiceNow's filter breadcrumb. */
function describe(conditions: Condition[], fields: FieldOption[]): string {
    const readable = conditions
        .filter((c) => c.field && c.operator)
        .map((c, index) => {
            const field = fields.find((f) => f.name === c.field)
            const type = field?.type ?? 'string'
            const label = field?.label ?? c.field
            const opLabel = operatorsFor(type).find((o) => o.op === c.operator)?.label ?? c.operator
            const value = isUnary(type, c.operator) ? '' : ` ${c.value}`
            const join = index === 0 ? '' : `${c.join === 'OR' ? 'or' : 'and'} `
            return `${join}${label} ${opLabel}${value}`.trim()
        })
    return readable.length > 0 ? readable.join(' › ') : 'All records on this board'
}

export interface ConditionBuilderProps {
    table: string
    /** Current encoded query, owned by the caller. */
    value: string
    onChange: (encodedQuery: string) => void
    onClose: () => void
}

export function ConditionBuilder({
    table,
    value,
    onChange,
    onClose,
}: ConditionBuilderProps): React.JSX.Element {
    const [fields, setFields] = useState<FieldOption[]>([])
    const [conditions, setConditions] = useState<Condition[]>([])
    const [choices, setChoices] = useState<Record<string, { value: string; label: string }[]>>({})
    // An existing query was not necessarily built here, and parsing arbitrary
    // encoded queries back into rows is a losing game. Show it as text instead
    // of silently claiming the board is unfiltered.
    const [showRaw, setShowRaw] = useState(value.trim().length > 0)
    const [raw, setRaw] = useState(value)
    const [seq, setSeq] = useState(1)

    useEffect(() => {
        let live = true
        api.tableFields(table)
            .then((list) => {
                if (live) setFields(list)
            })
            .catch(() => undefined)
        return () => {
            live = false
        }
    }, [table])

    // Choice values are fetched only for the fields actually used, so opening
    // the builder does not pull every choice list on the table.
    useEffect(() => {
        const needed = conditions
            .map((c) => c.field)
            .filter((name) => {
                if (!name || choices[name]) return false
                const type = fields.find((f) => f.name === name)?.type
                return type === 'choice' || type === 'integer'
            })

        for (const name of Array.from(new Set(needed))) {
            void api
                .fieldChoices(table, name)
                .then((result) => {
                    if (!result.resolvable) return
                    setChoices((prev) => ({ ...prev, [name]: result.choices }))
                })
                .catch(() => undefined)
        }
    }, [conditions, fields, table, choices])

    const summary = useMemo(() => describe(conditions, fields), [conditions, fields])
    const encoded = useMemo(() => buildQuery(conditions, fields), [conditions, fields])

    function addCondition(join: 'AND' | 'OR'): void {
        const first = fields[0]
        setConditions((prev) => [
            ...prev,
            {
                id: seq,
                join,
                field: first?.name ?? '',
                operator: operatorsFor(first?.type ?? 'string')[0].op,
                value: '',
            },
        ])
        setSeq((n) => n + 1)
    }

    function update(id: number, patch: Partial<Condition>): void {
        setConditions((prev) =>
            prev.map((c) => {
                if (c.id !== id) return c
                const next = { ...c, ...patch }
                // Changing the field can invalidate the operator, and always
                // invalidates the value.
                if (patch.field !== undefined && patch.field !== c.field) {
                    const type = fields.find((f) => f.name === patch.field)?.type ?? 'string'
                    next.operator = operatorsFor(type)[0].op
                    next.value = ''
                }
                return next
            })
        )
    }

    function remove(id: number): void {
        setConditions((prev) => prev.filter((c) => c.id !== id))
    }

    function apply(): void {
        onChange(showRaw ? raw.trim() : encoded)
        onClose()
    }

    function clearAll(): void {
        setConditions([])
        setRaw('')
        onChange('')
    }

    return (
        <section className="qb" aria-label="Filter conditions">
            <div className="qb-breadcrumb">
                <span className="qb-crumb-label">Showing</span>
                <p className="qb-crumb">{showRaw ? raw || 'All records on this board' : summary}</p>
            </div>

            {showRaw ? (
                <div className="qb-raw">
                    <label htmlFor="qb-raw-input">Encoded query</label>
                    <input
                        id="qb-raw-input"
                        type="text"
                        value={raw}
                        spellCheck={false}
                        placeholder="priority&lt;=2^assigned_toISNOTEMPTY"
                        onChange={(e) => setRaw(e.target.value)}
                    />
                    <p className="hint">
                        Paste one from a list’s <strong>Copy query</strong>. It narrows the board’s own
                        filter and can never widen it.
                    </p>
                </div>
            ) : (
                <ol className="qb-rows">
                    {conditions.map((c, index) => {
                        const type = fields.find((f) => f.name === c.field)?.type ?? 'string'
                        const ops = operatorsFor(type)
                        const unary = isUnary(type, c.operator)
                        const fieldChoices = choices[c.field]

                        return (
                            <li className="qb-row" key={c.id}>
                                <span className="qb-join">
                                    {index === 0 ? (
                                        'Where'
                                    ) : (
                                        <select
                                            value={c.join}
                                            aria-label="Join with previous condition"
                                            onChange={(e) =>
                                                update(c.id, { join: e.target.value as 'AND' | 'OR' })
                                            }
                                        >
                                            <option value="AND">and</option>
                                            <option value="OR">or</option>
                                        </select>
                                    )}
                                </span>

                                <select
                                    className="qb-field"
                                    value={c.field}
                                    aria-label="Field"
                                    onChange={(e) => update(c.id, { field: e.target.value })}
                                >
                                    {fields.map((f) => (
                                        <option key={f.name} value={f.name}>
                                            {f.label}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    className="qb-op"
                                    value={c.operator}
                                    aria-label="Operator"
                                    onChange={(e) => update(c.id, { operator: e.target.value })}
                                >
                                    {ops.map((o) => (
                                        <option key={o.op} value={o.op}>
                                            {o.label}
                                        </option>
                                    ))}
                                </select>

                                {unary ? (
                                    <span className="qb-value qb-value-none" aria-hidden="true">
                                        —
                                    </span>
                                ) : type === 'boolean' ? (
                                    <select
                                        className="qb-value"
                                        value={c.value}
                                        aria-label="Value"
                                        onChange={(e) => update(c.id, { value: e.target.value })}
                                    >
                                        <option value="">Choose…</option>
                                        <option value="true">true</option>
                                        <option value="false">false</option>
                                    </select>
                                ) : fieldChoices ? (
                                    <select
                                        className="qb-value"
                                        value={c.value}
                                        aria-label="Value"
                                        onChange={(e) => update(c.id, { value: e.target.value })}
                                    >
                                        <option value="">Choose…</option>
                                        {fieldChoices.map((choice) => (
                                            <option key={choice.value} value={choice.value}>
                                                {choice.label}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        className="qb-value"
                                        type={DATE_TYPES.includes(type) ? 'date' : 'text'}
                                        value={c.value}
                                        aria-label="Value"
                                        placeholder="Value"
                                        onChange={(e) => update(c.id, { value: e.target.value })}
                                    />
                                )}

                                <button
                                    type="button"
                                    className="qb-remove"
                                    onClick={() => remove(c.id)}
                                    aria-label="Remove condition"
                                >
                                    &#10005;
                                </button>
                            </li>
                        )
                    })}

                    {conditions.length === 0 ? (
                        <li className="qb-empty">
                            No conditions yet. Add one to narrow what the board shows.
                        </li>
                    ) : null}
                </ol>
            )}

            <div className="qb-actions">
                {!showRaw ? (
                    <>
                        <button type="button" className="chip-btn" onClick={() => addCondition('AND')}>
                            + And
                        </button>
                        <button
                            type="button"
                            className="chip-btn"
                            disabled={conditions.length === 0}
                            onClick={() => addCondition('OR')}
                        >
                            + Or
                        </button>
                    </>
                ) : null}

                <button
                    type="button"
                    className="chip-btn"
                    onClick={() => {
                        if (!showRaw) setRaw(encoded)
                        setShowRaw((v) => !v)
                    }}
                >
                    {showRaw ? 'Use conditions' : 'Edit as text'}
                </button>

                <span className="qb-spacer" />

                <button type="button" className="chip-btn" onClick={clearAll}>
                    Clear
                </button>
                <button type="button" className="btn-primary" onClick={apply}>
                    Run filter
                </button>
            </div>

            {!showRaw && encoded ? <code className="qb-encoded">{encoded}</code> : null}
        </section>
    )
}
