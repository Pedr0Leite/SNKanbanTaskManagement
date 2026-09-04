import '@servicenow/sdk/global'
import { UiPage } from '@servicenow/sdk/core'
import kanbanPage from '../../client/index.html'

/**
 * Delivery mechanism: React bundled into static content and served by a UI Page.
 * main.tsx is a thin mount so the board can later be wrapped as a UI Builder
 * component without touching anything below it.
 */
UiPage({
    $id: Now.ID['kanban-page'],
    endpoint: 'x_335329_sn_ktm_kanban.do',
    description: 'Configuration-driven Kanban board.',
    category: 'general',
    html: kanbanPage,
    direct: true,
})
