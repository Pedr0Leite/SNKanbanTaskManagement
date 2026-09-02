import React from 'react'
import { BoardSummary } from '../types'

export interface Toast {
    id: number
    title: string
    body: string
    tone: 'info' | 'error'
}

export interface SidebarProps {
    boards: BoardSummary[]
    /** Product name, from the x_335329_sn_ktm.title system property. */
    brand: string
    activeBoardId: string
    theme: 'light' | 'dark'
    onSelect: (boardId: string) => void
    onToggleTheme: () => void
    onHide: () => void
    onNewBoard: () => void
}

export function Sidebar({
    boards,
    brand,
    activeBoardId,
    theme,
    onSelect,
    onToggleTheme,
    onHide,
    onNewBoard,
}: SidebarProps): React.JSX.Element {
    return (
        <nav className="sidebar" aria-label="Boards">
            <div className="sidebar-brand">
                <span className="mark" aria-hidden="true" />
                {brand}
            </div>

            <p className="sidebar-heading" id="board-list-heading">
                All boards ({boards.length})
            </p>
            <ul className="board-list" aria-labelledby="board-list-heading">
                {boards.map((board) => (
                    <li key={board.sys_id}>
                        <button
                            type="button"
                            className={`board-btn${board.sys_id === activeBoardId ? ' active' : ''}`}
                            aria-current={board.sys_id === activeBoardId ? 'true' : undefined}
                            onClick={() => onSelect(board.sys_id)}
                        >
                            <span className="board-icon" aria-hidden="true" />
                            {board.name}
                        </button>
                    </li>
                ))}
            </ul>

            <button type="button" className="new-board-btn" onClick={onNewBoard}>
                + New board
            </button>

            <div className="sidebar-footer">
                <button
                    type="button"
                    className="theme-toggle"
                    onClick={onToggleTheme}
                    aria-pressed={theme === 'dark'}
                >
                    <span aria-hidden="true">&#9728;</span>
                    <span className="switch" aria-hidden="true" />
                    <span aria-hidden="true">&#9789;</span>
                    <span className="visually-hidden">
                        {theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                    </span>
                </button>
                <button type="button" className="sidebar-toggle" onClick={onHide}>
                    <span aria-hidden="true">&#9668;</span> Hide sidebar
                </button>
            </div>
        </nav>
    )
}

export interface ToolbarProps {
    title: string
    table: string
    search: string
    query: string
    queryOpen: boolean
    assignedToMe: boolean
    assignedToMeSupported: boolean
    refreshing: boolean
    sidebarHidden: boolean
    onSearch: (value: string) => void
    onQuery: (value: string) => void
    onToggleQuery: () => void
    onToggleAssigned: () => void
    onRefresh: () => void
    onShowSidebar: () => void
}

export function Toolbar({
    title,
    table,
    search,
    query,
    queryOpen,
    assignedToMe,
    assignedToMeSupported,
    refreshing,
    sidebarHidden,
    onSearch,
    onQuery,
    onToggleQuery,
    onToggleAssigned,
    onRefresh,
    onShowSidebar,
}: ToolbarProps): React.JSX.Element {
    return (
        <>
        <header className="topbar">
            {sidebarHidden ? (
                <button type="button" className="icon-btn" onClick={onShowSidebar} aria-label="Show sidebar">
                    &#9776;
                </button>
            ) : null}
            <h1>{title}</h1>
            {table ? <span className="table-chip">{table}</span> : null}
            <span className="spacer" />

            <div className="search">
                <label className="visually-hidden" htmlFor="kanban-search">
                    Search this board
                </label>
                <input
                    id="kanban-search"
                    type="search"
                    value={search}
                    placeholder="Search…"
                    onChange={(e) => onSearch(e.target.value)}
                />
            </div>

            <button
                type="button"
                className="chip-btn"
                aria-pressed={queryOpen || query.length > 0}
                aria-expanded={queryOpen}
                onClick={onToggleQuery}
            >
                Query{query ? ' •' : ''}
            </button>

            {assignedToMeSupported ? (
                <button type="button" className="chip-btn" aria-pressed={assignedToMe} onClick={onToggleAssigned}>
                    Assigned to me
                </button>
            ) : null}

            <button
                type="button"
                className="icon-btn"
                onClick={onRefresh}
                data-busy={refreshing}
                aria-label="Refresh board"
            >
                &#8635;
            </button>
        </header>

        {queryOpen ? (
            <div className="query-bar">
                <label htmlFor="kanban-query">Encoded query</label>
                <input
                    id="kanban-query"
                    type="text"
                    value={query}
                    spellCheck={false}
                    placeholder="priority&lt;=2^assigned_toISNOTEMPTY"
                    onChange={(e) => onQuery(e.target.value)}
                />
                {query ? (
                    <button type="button" className="chip-btn" onClick={() => onQuery('')}>
                        Clear
                    </button>
                ) : null}
                <p className="hint">
                    Narrows the board’s own filter — it can never widen it. Copy one from a list’s
                    “Copy query”.
                </p>
            </div>
        ) : null}
        </>
    )
}

export function Toasts({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }): React.JSX.Element {
    return (
        <div className="toasts">
            {toasts.map((toast) => (
                <div className="toast" key={toast.id} data-tone={toast.tone} role="status">
                    <div className="toast-body">
                        <strong>{toast.title}</strong>
                        <p>{toast.body}</p>
                    </div>
                    <button type="button" onClick={() => onDismiss(toast.id)} aria-label="Dismiss">
                        &#10005;
                    </button>
                </div>
            ))}
        </div>
    )
}
