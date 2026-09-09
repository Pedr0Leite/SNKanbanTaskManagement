/** Types mirroring the /api/x_335329_sn_ktm/kanban/v1 contract in docs/API.md. */

export type DisplayAs = 'text' | 'badge' | 'avatar' | 'date' | 'link'

export interface FieldValue {
    name: string
    label: string
    type: string
    display_as: DisplayAs
    value: string
    display_value: string
    reference_sys_id?: string
}

export interface Lane {
    value: string
    label: string
    order: number
    accent: string
}

export interface JournalOption {
    name: string
    label: string
    can_write: boolean
}

export interface BoardConfig {
    sys_id: string
    name: string
    table: string
    lane_field: string
    lane_field_label: string
    max_records: number
    title_field: string
    subtitle_field: string
    lanes: Lane[]
    card_fields: FieldDef[]
    modal_fields: FieldDef[]
    journal: { field: string; allow_choice: boolean; options: JournalOption[] }
    capabilities: { can_write_lane: boolean; assigned_to_me_supported: boolean }
}

export interface FieldDef {
    name: string
    label: string
    type: string
    reference: string
    display_as: DisplayAs
    order: number
}

export interface Card {
    sys_id: string
    lane_value: string
    title: string
    subtitle: string
    fields: FieldValue[]
    sys_updated_on: string
    can_write: boolean
    /** Client-only: set while a move is in flight. */
    pending?: boolean
}

export interface CardsPayload {
    cards: Card[]
    counts: Record<string, number>
    capped: boolean
    limit: number
}

/** Appearance settings, from the Kanban system properties category. */
export interface Settings {
    title: string
    accent: string
    accent_dark: string
    default_theme: 'system' | 'light' | 'dark'
    lane_width: number
    show_table_chip: boolean
    density: 'comfortable' | 'compact'
    /** Auto-refresh interval in seconds. 0 disables polling. */
    refresh_seconds: number
}

export interface BoardSummary {
    sys_id: string
    name: string
    table: string
    order: number
}

export interface JournalEntry {
    sys_id: string
    field: string
    value: string
    created_on: string
    created_on_display: string
    author: string
    initials: string
}

export interface TableOption {
    name: string
    label: string
}

export interface FieldOption {
    name: string
    label: string
    type: string
    lane_capable: boolean
}

export interface FieldChoices {
    table: string
    field: string
    resolvable: boolean
    source: string
    reason: string
    choices: { value: string; label: string; sequence: number }[]
}

export interface NewBoard {
    name: string
    table: string
    lane_field: string
    filter: string
    card_title_field: string
    card_subtitle_field: string
    journal_field: string
    allow_journal_choice: boolean
    card_fields: string[]
    modal_fields: string[]
}

export interface JournalPage {
    entries: JournalEntry[]
    has_more: boolean
    offset: number
    next_offset: number
}

export interface RecordDetail {
    sys_id: string
    table: string
    title: string
    lane_value: string
    sys_updated_on: string
    can_write: boolean
    fields: FieldValue[]
    journal: JournalEntry[]
    journal_has_more: boolean
    /** Evaluated against this record, not a blank template. */
    journal_options: JournalOption[]
}

export interface ApiError {
    code: string
    message: string
    suggested_action: string
    correlation_id: string
}

/** Thrown by the api client for every non-ok envelope. */
export class KanbanError extends Error {
    readonly code: string
    readonly suggestedAction: string
    readonly correlationId: string
    readonly data: unknown

    constructor(error: ApiError, data: unknown) {
        super(error.message)
        this.name = 'KanbanError'
        this.code = error.code
        this.suggestedAction = error.suggested_action
        this.correlationId = error.correlation_id
        this.data = data
    }
}
