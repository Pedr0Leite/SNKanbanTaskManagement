import {
    BoardConfig,
    BoardSummary,
    Card,
    CardsPayload,
    FieldChoices,
    FieldOption,
    JournalEntry,
    JournalPage,
    KanbanError,
    NewBoard,
    RecordDetail,
    Settings,
    TableOption,
} from './types'

declare global {
    interface Window {
        g_ck?: string
    }
}

// The version segment sits BEFORE the service id — the platform registers
// /api/{namespace}/{version}/{service_id}/..., not /{service_id}/{version}/...
const BASE = '/api/x_335329_sn_ktm/v1/kanban'
const TIMEOUT_MS = 15000

interface Envelope<T> {
    status: 'ok' | 'error'
    data?: T
    error?: { code: string; message: string; suggested_action: string; correlation_id: string }
}

/**
 * Pull our envelope out of the platform's.
 *
 * A Scripted REST endpoint wraps whatever response.setBody() is given inside a
 * `result` property, so the wire format is {"result":{"status":"ok","data":…}}
 * rather than the {"status":"ok","data":…} the handlers write. Reading status
 * off the top level therefore found `undefined` and rejected every successful
 * response as malformed.
 *
 * Both shapes are accepted so the client keeps working if the endpoint is ever
 * served through something that does not wrap (a stream writer, a proxy).
 */
function unwrap<T>(raw: unknown): Envelope<T> {
    if (!raw || typeof raw !== 'object') return {} as Envelope<T>

    const outer = raw as { result?: unknown; status?: unknown }
    if (outer.status === undefined && outer.result && typeof outer.result === 'object') {
        return outer.result as Envelope<T>
    }
    return raw as Envelope<T>
}

/**
 * Single fetch wrapper. Validates the envelope at the boundary so no component
 * ever has to guess whether it received data or an error, and enforces the 15s
 * ceiling the optimistic-move contract depends on.
 */
async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS)

    let response: Response
    try {
        response = await fetch(`${BASE}${path}`, {
            ...init,
            signal: controller.signal,
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-UserToken': window.g_ck ?? '',
                ...(init.headers ?? {}),
            },
        })
    } catch (cause) {
        window.clearTimeout(timer)
        const aborted = cause instanceof DOMException && cause.name === 'AbortError'
        throw new KanbanError(
            {
                code: aborted ? 'timeout' : 'network',
                message: aborted
                    ? 'The board took too long to respond.'
                    : 'Could not reach the board service.',
                suggested_action: 'Check your connection and refresh.',
                correlation_id: '',
            },
            null
        )
    } finally {
        window.clearTimeout(timer)
    }

    let raw: unknown
    try {
        raw = await response.json()
    } catch {
        throw new KanbanError(
            {
                code: 'malformed',
                message: `The board service returned something unreadable (HTTP ${response.status}).`,
                suggested_action: 'Refresh. If it persists, contact an administrator.',
                correlation_id: '',
            },
            null
        )
    }

    const body = unwrap<T>(raw)

    if (body.status === 'ok' && body.data !== undefined) return body.data

    throw new KanbanError(
        body.error ?? {
            code: 'malformed',
            message: `Unexpected response from the board service (HTTP ${response.status}).`,
            suggested_action: 'Refresh and try again.',
            correlation_id: '',
        },
        body.data
    )
}

export const api = {
    boards: () => call<{ boards: BoardSummary[] }>('/boards').then((d) => d.boards),

    board: (boardId: string) => call<BoardConfig>(`/board/${encodeURIComponent(boardId)}`),

    cards: (boardId: string, opts: { search?: string; assignedToMe?: boolean; filter?: string }) => {
        const params = new URLSearchParams()
        if (opts.search) params.set('search', opts.search)
        if (opts.assignedToMe) params.set('assigned_to_me', 'true')
        if (opts.filter) params.set('filter', opts.filter)
        const qs = params.toString()
        return call<CardsPayload>(`/board/${encodeURIComponent(boardId)}/cards${qs ? `?${qs}` : ''}`)
    },

    record: (boardId: string, table: string, sysId: string) =>
        call<RecordDetail>(
            `/record/${encodeURIComponent(table)}/${encodeURIComponent(sysId)}?board=${encodeURIComponent(boardId)}`
        ),

    moveLane: (boardId: string, table: string, sysId: string, toLane: string, expectedUpdatedOn: string) =>
        call<{ card: Card }>(`/record/${encodeURIComponent(table)}/${encodeURIComponent(sysId)}/lane`, {
            method: 'PATCH',
            body: JSON.stringify({ board: boardId, to_lane: toLane, expected_updated_on: expectedUpdatedOn }),
        }),

    addJournal: (boardId: string, table: string, sysId: string, field: string, value: string) =>
        call<{ entry: JournalEntry; sys_updated_on: string }>(
            `/record/${encodeURIComponent(table)}/${encodeURIComponent(sysId)}/journal`,
            { method: 'POST', body: JSON.stringify({ board: boardId, field, value }) }
        ),

    settings: () => call<Settings>('/settings'),

    tables: () => call<{ tables: TableOption[] }>('/tables').then((d) => d.tables),

    tableFields: (table: string) =>
        call<{ table: string; fields: FieldOption[] }>(
            `/tables/${encodeURIComponent(table)}/fields`
        ).then((d) => d.fields),

    fieldChoices: (table: string, field: string) =>
        call<FieldChoices>(
            `/tables/${encodeURIComponent(table)}/fields/${encodeURIComponent(field)}/choices`
        ),

    createBoard: (board: NewBoard) =>
        call<{ sys_id: string; name: string; table: string; lanes: number; fields_created: number }>(
            '/boards',
            { method: 'POST', body: JSON.stringify(board) }
        ),

    journalPage: (boardId: string, table: string, sysId: string, offset: number) =>
        call<JournalPage>(
            `/record/${encodeURIComponent(table)}/${encodeURIComponent(sysId)}/journal` +
                `?board=${encodeURIComponent(boardId)}&offset=${offset}`
        ),

    getPreferences: () =>
        call<{ preferences: Record<string, string> }>('/preferences').then((d) => d.preferences),

    setPreferences: (preferences: Record<string, string>) =>
        call<{ written: number }>('/preferences', {
            method: 'PUT',
            body: JSON.stringify({ preferences }),
        }),
}
