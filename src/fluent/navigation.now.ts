import '@servicenow/sdk/global'
import { ApplicationMenu, Record } from '@servicenow/sdk/core'
import { noviqboardAdmin } from './tables/noviqboard-config.now'

const menu = ApplicationMenu({
    $id: Now.ID['menu-noviqboard'],
    title: 'NoviqBoard',
    hint: 'NoviqBoard boards and configuration',
    description: 'Configuration-driven boards for any task table.',
    active: true,
})

// Opens the React UI page; visible to every user.
Record({
    $id: Now.ID['module-board'],
    table: 'sys_app_module',
    data: {
        title: 'Board',
        application: menu,
        link_type: 'DIRECT',
        query: 'x_nold_nvqbrd_noviqboard.do',
        hint: 'Open the NoviqBoard board',
        active: true,
        order: 100,
    },
})

Record({
    $id: Now.ID['module-config-separator'],
    table: 'sys_app_module',
    data: {
        title: 'Configuration',
        application: menu,
        link_type: 'SEPARATOR',
        roles: [noviqboardAdmin],
        active: true,
        order: 200,
    },
})

Record({
    $id: Now.ID['module-boards'],
    table: 'sys_app_module',
    data: {
        title: 'Boards',
        application: menu,
        link_type: 'LIST',
        name: 'x_nold_nvqbrd_board',
        roles: [noviqboardAdmin],
        active: true,
        order: 300,
    },
})

Record({
    $id: Now.ID['module-fields'],
    table: 'sys_app_module',
    data: {
        title: 'Card Fields',
        application: menu,
        link_type: 'LIST',
        name: 'x_nold_nvqbrd_field',
        roles: [noviqboardAdmin],
        active: true,
        order: 400,
    },
})

Record({
    $id: Now.ID['module-lanes'],
    table: 'sys_app_module',
    data: {
        title: 'Lanes',
        application: menu,
        link_type: 'LIST',
        name: 'x_nold_nvqbrd_lane',
        roles: [noviqboardAdmin],
        active: true,
        order: 500,
    },
})
