import '@servicenow/sdk/global'
import { Property, Record } from '@servicenow/sdk/core'

/**
 * Appearance settings, held as system properties so they can be changed without
 * a deploy, and surfaced as a proper configuration page at:
 *
 *   /system_properties_ui.do?sysparm_category=Kanban
 *
 * Board CONTENT (table, lanes, fields, filters) stays in the config tables —
 * these are only for how the board looks and what it is called.
 */

Property({
    $id: Now.ID['prop-title'],
    name: 'x_335329_sn_ktm.title',
    type: 'string',
    value: 'Kanban',
    description: 'Name shown in the sidebar and the browser tab.',
    ignoreCache: false,
})

Property({
    $id: Now.ID['prop-accent'],
    name: 'x_335329_sn_ktm.accent',
    type: 'string',
    value: '#635fc7',
    description: 'Primary accent colour in light theme. Any CSS colour, e.g. #635fc7.',
    ignoreCache: false,
})

Property({
    $id: Now.ID['prop-accent-dark'],
    name: 'x_335329_sn_ktm.accent_dark',
    type: 'string',
    value: '#7b77e0',
    description: 'Primary accent colour in dark theme. Needs to stay readable on a dark surface.',
    ignoreCache: false,
})

Property({
    $id: Now.ID['prop-default-theme'],
    name: 'x_335329_sn_ktm.default_theme',
    type: 'choicelist',
    value: 'system',
    choices: ['system', 'light', 'dark'],
    description:
        'Theme for users who have not chosen one. "system" follows the operating system setting.',
    ignoreCache: false,
})

Property({
    $id: Now.ID['prop-lane-width'],
    name: 'x_335329_sn_ktm.lane_width',
    type: 'integer',
    value: 288,
    description: 'Column width in pixels. Clamped to 200-560.',
    ignoreCache: false,
})

Property({
    $id: Now.ID['prop-show-table-chip'],
    name: 'x_335329_sn_ktm.show_table_chip',
    type: 'boolean',
    value: true,
    description: 'Show the source table name next to the board title.',
    ignoreCache: false,
})

Property({
    $id: Now.ID['prop-density'],
    name: 'x_335329_sn_ktm.density',
    type: 'choicelist',
    value: 'comfortable',
    choices: ['comfortable', 'compact'],
    description: 'Card padding and spacing.',
    ignoreCache: false,
})

Property({
    $id: Now.ID['prop-refresh'],
    name: 'x_335329_sn_ktm.refresh_seconds',
    type: 'integer',
    value: 30,
    description: 'How often the board refetches records, in seconds. 0 turns auto-refresh off. Non-zero values are clamped to 10-600.',
    ignoreCache: false,
})

/**
 * The configuration page itself. A properties category renders every property
 * below it as an editable form, so no custom admin UI is needed.
 */
Record({
    $id: Now.ID['prop-category'],
    table: 'sys_properties_category',
    data: {
        name: 'Kanban',
        title: 'Kanban board appearance',
    },
})

// Membership of the category, in the order they appear on the page.

Record({
    $id: Now.ID['cat-title'],
    table: 'sys_properties_category_m2m',
    data: {
        category: Now.ref('sys_properties_category', 'prop-category'),
        property: Now.ref('sys_properties', 'prop-title'),
        order: 100,
    },
})

Record({
    $id: Now.ID['cat-accent'],
    table: 'sys_properties_category_m2m',
    data: {
        category: Now.ref('sys_properties_category', 'prop-category'),
        property: Now.ref('sys_properties', 'prop-accent'),
        order: 200,
    },
})

Record({
    $id: Now.ID['cat-accent-dark'],
    table: 'sys_properties_category_m2m',
    data: {
        category: Now.ref('sys_properties_category', 'prop-category'),
        property: Now.ref('sys_properties', 'prop-accent-dark'),
        order: 300,
    },
})

Record({
    $id: Now.ID['cat-default-theme'],
    table: 'sys_properties_category_m2m',
    data: {
        category: Now.ref('sys_properties_category', 'prop-category'),
        property: Now.ref('sys_properties', 'prop-default-theme'),
        order: 400,
    },
})

Record({
    $id: Now.ID['cat-lane-width'],
    table: 'sys_properties_category_m2m',
    data: {
        category: Now.ref('sys_properties_category', 'prop-category'),
        property: Now.ref('sys_properties', 'prop-lane-width'),
        order: 500,
    },
})

Record({
    $id: Now.ID['cat-show-table-chip'],
    table: 'sys_properties_category_m2m',
    data: {
        category: Now.ref('sys_properties_category', 'prop-category'),
        property: Now.ref('sys_properties', 'prop-show-table-chip'),
        order: 600,
    },
})

Record({
    $id: Now.ID['cat-density'],
    table: 'sys_properties_category_m2m',
    data: {
        category: Now.ref('sys_properties_category', 'prop-category'),
        property: Now.ref('sys_properties', 'prop-density'),
        order: 700,
    },
})

Record({
    $id: Now.ID['cat-refresh'],
    table: 'sys_properties_category_m2m',
    data: {
        category: Now.ref('sys_properties_category', 'prop-category'),
        property: Now.ref('sys_properties', 'prop-refresh'),
        order: 800,
    },
})
