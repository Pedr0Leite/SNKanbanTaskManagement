import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app'
import { ErrorBoundary } from './components/States'

// Thin mount on purpose: everything below is host-agnostic, so the same App can
// later be wrapped as a UI Builder component without touching it.
const rootElement = document.getElementById('root')

if (!rootElement) {
    console.error('[Kanban] #root not found — the UI Page markup did not render.')
} else {
    try {
        ReactDOM.createRoot(rootElement).render(
            <React.StrictMode>
                <ErrorBoundary>
                    <App />
                </ErrorBoundary>
            </React.StrictMode>
        )
    } catch (error) {
        // A throw here means React never mounted, so the boundary cannot help.
        console.error('[Kanban] failed to mount', error)
        rootElement.textContent =
            'The Kanban board failed to start. See the browser console for details.'
    }
}
