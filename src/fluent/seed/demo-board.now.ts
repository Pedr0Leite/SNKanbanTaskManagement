import '@servicenow/sdk/global'
import { Record } from '@servicenow/sdk/core'

/**
 * Seeded demo board.
 *
 * This is the ONLY place in the source tree where a business table, field or
 * state value is named, and it is configuration data rather than logic. Point a
 * board at sc_task or change_request by creating records like these — no code
 * changes are needed anywhere.
 *
 * Fluent source files are declarative only: no helper functions, no loops.
 * Hence the repetition below.
 */

Record({
    $id: Now.ID['board-demo'],
    table: 'x_335329_sn_ktm_board',
    data: {
        name: 'Incidents',
        table: 'incident',
        lane_field: 'state',
        filter: 'active=true',
        max_records: 200,
        card_title_field: 'number',
        card_subtitle_field: 'short_description',
        journal_field: 'comments',
        allow_journal_choice: true,
        active: true,
        order: 100,
    },
})

Record({
    $id: Now.ID['fld-priority'],
    table: 'x_335329_sn_ktm_field',
    data: {
        board: Now.ID['board-demo'],
        element: 'priority',
        show_on_card: true,
        show_in_modal: true,
        display_as: 'badge',
        order: 100,
    },
})

Record({
    $id: Now.ID['fld-assigned'],
    table: 'x_335329_sn_ktm_field',
    data: {
        board: Now.ID['board-demo'],
        element: 'assigned_to',
        show_on_card: true,
        show_in_modal: true,
        display_as: 'avatar',
        order: 200,
    },
})

Record({
    $id: Now.ID['fld-caller'],
    table: 'x_335329_sn_ktm_field',
    data: {
        board: Now.ID['board-demo'],
        element: 'caller_id',
        show_on_card: false,
        show_in_modal: true,
        display_as: 'text',
        order: 300,
    },
})

Record({
    $id: Now.ID['fld-category'],
    table: 'x_335329_sn_ktm_field',
    data: {
        board: Now.ID['board-demo'],
        element: 'category',
        show_on_card: false,
        show_in_modal: true,
        display_as: 'text',
        order: 400,
    },
})

Record({
    $id: Now.ID['fld-opened'],
    table: 'x_335329_sn_ktm_field',
    data: {
        board: Now.ID['board-demo'],
        element: 'opened_at',
        show_on_card: false,
        show_in_modal: true,
        display_as: 'date',
        order: 500,
    },
})

Record({
    $id: Now.ID['fld-description'],
    table: 'x_335329_sn_ktm_field',
    data: {
        board: Now.ID['board-demo'],
        element: 'description',
        show_on_card: false,
        show_in_modal: true,
        display_as: 'text',
        order: 600,
    },
})

// Lane overrides. Accent colours follow the reference design's column dots.
// Lanes exist without these records; they only override label, order and colour.

Record({
    $id: Now.ID['lane-new'],
    table: 'x_335329_sn_ktm_lane',
    data: {
        board: Now.ID['board-demo'],
        value: '1',
        accent_colour: '#49C4E5',
        order: 100,
        wip_limit: 0,
        hidden: false,
    },
})

Record({
    $id: Now.ID['lane-progress'],
    table: 'x_335329_sn_ktm_lane',
    data: {
        board: Now.ID['board-demo'],
        value: '2',
        accent_colour: '#8471F2',
        order: 200,
        wip_limit: 5,
        hidden: false,
    },
})

Record({
    $id: Now.ID['lane-hold'],
    table: 'x_335329_sn_ktm_lane',
    data: {
        board: Now.ID['board-demo'],
        value: '3',
        accent_colour: '#F2C94C',
        order: 300,
        wip_limit: 0,
        hidden: false,
    },
})

Record({
    $id: Now.ID['lane-resolved'],
    table: 'x_335329_sn_ktm_lane',
    data: {
        board: Now.ID['board-demo'],
        value: '6',
        accent_colour: '#67E2AE',
        order: 400,
        wip_limit: 0,
        hidden: false,
    },
})

Record({
    $id: Now.ID['lane-closed'],
    table: 'x_335329_sn_ktm_lane',
    data: {
        board: Now.ID['board-demo'],
        value: '7',
        accent_colour: '#828FA3',
        order: 500,
        wip_limit: 0,
        hidden: false,
    },
})

// Cancelled records add noise to a working board; hidden by default.
Record({
    $id: Now.ID['lane-cancelled'],
    table: 'x_335329_sn_ktm_lane',
    data: {
        board: Now.ID['board-demo'],
        value: '8',
        order: 600,
        wip_limit: 0,
        hidden: true,
    },
})
