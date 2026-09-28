import '@servicenow/sdk/global'
import { UiPage } from '@servicenow/sdk/core'
import noviqboardPage from '../../client/index.html'

/**
 * Delivery mechanism: React bundled into static content and served by a UI Page.
 * main.tsx is a thin mount so the board can later be wrapped as a UI Builder
 * component without touching anything below it.
 */
UiPage({
    $id: Now.ID['noviqboard-page'],
    endpoint: 'x_nold_nvqbrd_noviqboard.do',
    description: 'Configuration-driven NoviqBoard board.',
    category: 'general',
    html: noviqboardPage,
    direct: true,
})
