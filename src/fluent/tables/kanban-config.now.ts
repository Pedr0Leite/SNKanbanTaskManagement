import '@servicenow/sdk/global'
import {
    BooleanColumn,
    ChoiceColumn,
    ConditionsColumn,
    FieldNameColumn,
    IntegerColumn,
    ListColumn,
    ReferenceColumn,
    Role,
    StringColumn,
    TableNameColumn,
    Table,
} from '@servicenow/sdk/core'

/**
 * Kanban configuration model.
 *
 * Nothing here names a business table, field or state. A board is described
 * entirely by these records, so the same code renders any child of `task`.
 */

export const kanbanAdmin = Role({
    $id: Now.ID['role-kanban-admin'],
    name: 'x_335329_sn_ktm.kanban_admin',
    description: 'Can create and maintain Kanban board configuration.',
})

export const x_335329_sn_ktm_board = Table({
    $id: Now.ID['tbl-board'],
    name: 'x_335329_sn_ktm_board',
    label: 'Kanban Board',
    display: 'name',
    audit: true,
    createAccessControls: true,
    userRole: kanbanAdmin,
    actions: ['read', 'create', 'update', 'delete'],
    schema: {
        name: StringColumn({
            label: 'Name',
            maxLength: 100,
            mandatory: true,
            hint: 'Display name shown in the board picker.',
        }),
        table: TableNameColumn({
            label: 'Table',
            maxLength: 80,
            mandatory: true,
            hint: 'Any table that extends task. Validated on save.',
        }),
        lane_field: FieldNameColumn({
            label: 'Lane field',
            maxLength: 80,
            default: 'state',
            mandatory: true,
            dependent: 'table',
            hint: 'Choice field whose values become the columns. Must be a choice field.',
        }),
        filter: ConditionsColumn({
            label: 'Filter',
            dependent: 'table',
            hint: 'Base query for the board. Empty means every record the user can read.',
        }),
        max_records: IntegerColumn({
            label: 'Max records',
            default: 200,
            hint: 'Hard server-side cap on cards fetched, whatever the client asks for.',
        }),
        card_title_field: FieldNameColumn({
            label: 'Card title field',
            maxLength: 80,
            default: 'number',
            mandatory: true,
            dependent: 'table',
            hint: 'Field rendered as the card heading.',
        }),
        card_subtitle_field: FieldNameColumn({
            label: 'Card subtitle field',
            maxLength: 80,
            default: 'short_description',
            dependent: 'table',
            hint: 'Field rendered under the heading. Optional.',
        }),
        journal_field: FieldNameColumn({
            label: 'Journal field',
            maxLength: 80,
            default: 'comments',
            dependent: 'table',
            hint: 'Journal field the modal writes to by default.',
        }),
        allow_journal_choice: BooleanColumn({
            label: 'Allow journal choice',
            default: false,
            hint: 'Let the user pick between comments and work notes in the modal.',
        }),
        roles: ListColumn({
            label: 'Roles',
            referenceTable: 'sys_user_role',
            hint: 'Who may open this board. Empty means anyone who can read the table.',
        }),
        active: BooleanColumn({
            label: 'Active',
            default: true,
        }),
        order: IntegerColumn({
            label: 'Order',
            default: 100,
            hint: 'Board picker ordering.',
        }),
    },
    index: [{ name: 'idx_active_order', unique: false, element: ['active', 'order'] }],
})

export const x_335329_sn_ktm_field = Table({
    $id: Now.ID['tbl-field'],
    name: 'x_335329_sn_ktm_field',
    label: 'Kanban Field',
    display: 'element',
    createAccessControls: true,
    userRole: kanbanAdmin,
    actions: ['read', 'create', 'update', 'delete'],
    schema: {
        board: ReferenceColumn({
            label: 'Board',
            referenceTable: 'x_335329_sn_ktm_board',
            mandatory: true,
            cascadeRule: 'delete',
        }),
        element: FieldNameColumn({
            label: 'Field',
            maxLength: 80,
            mandatory: true,
            hint: 'Field on the board table to display.',
        }),
        label_override: StringColumn({
            label: 'Label override',
            maxLength: 100,
            hint: 'Blank uses the translated dictionary label.',
        }),
        show_on_card: BooleanColumn({ label: 'Show on card', default: false }),
        show_in_modal: BooleanColumn({ label: 'Show in modal', default: true }),
        order: IntegerColumn({ label: 'Order', default: 100 }),
        display_as: ChoiceColumn({
            label: 'Display as',
            maxLength: 20,
            default: 'text',
            dropdown: 'dropdown_without_none',
            choices: {
                text: { label: 'Text', sequence: 1 },
                badge: { label: 'Badge', sequence: 2 },
                avatar: { label: 'Avatar', sequence: 3 },
                date: { label: 'Date', sequence: 4 },
                link: { label: 'Link', sequence: 5 },
            },
            hint: 'Drives how the client renders the value.',
        }),
    },
    index: [{ name: 'idx_board_order', unique: false, element: ['board', 'order'] }],
})

export const x_335329_sn_ktm_lane = Table({
    $id: Now.ID['tbl-lane'],
    name: 'x_335329_sn_ktm_lane',
    label: 'Kanban Lane Override',
    display: 'value',
    createAccessControls: true,
    userRole: kanbanAdmin,
    actions: ['read', 'create', 'update', 'delete'],
    schema: {
        board: ReferenceColumn({
            label: 'Board',
            referenceTable: 'x_335329_sn_ktm_board',
            mandatory: true,
            cascadeRule: 'delete',
        }),
        value: StringColumn({
            label: 'Value',
            maxLength: 40,
            mandatory: true,
            hint: 'Raw choice value of the lane field. Lanes exist without this record; it only overrides.',
        }),
        label_override: StringColumn({ label: 'Label override', maxLength: 100 }),
        hidden: BooleanColumn({
            label: 'Hidden',
            default: false,
            hint: 'Hide this state from the board entirely.',
        }),
        order: IntegerColumn({
            label: 'Order',
            hint: 'Overrides the choice sequence. Leave empty to keep the platform order.',
        }),
        wip_limit: IntegerColumn({
            label: 'WIP limit',
            default: 0,
            hint: '0 means no limit.',
        }),
        accent_colour: StringColumn({
            label: 'Accent colour',
            maxLength: 40,
            hint: 'CSS colour for the lane dot, e.g. #49C4E5.',
        }),
    },
    index: [{ name: 'idx_board_value', unique: false, element: ['board', 'value'] }],
})
