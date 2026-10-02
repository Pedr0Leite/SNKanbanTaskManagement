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
    /** Product name, from the x_nold_nvqbrd.title system property. */
    brand: string
    activeBoardId: string
    theme: 'light' | 'dark'
    /** Drives the slide/fade transition; the nav stays mounted either way so the
     *  collapse can animate instead of popping in and out. */
    collapsed: boolean
    onSelect: (boardId: string) => void
    onToggleTheme: () => void
    onHide: () => void
    onNewBoard: () => void
}

/** First letter of each word, capped at two, for the board-list tile. */
function boardInitials(name: string): string {
    const parts = name.trim().split(/\s+/)
    if (!parts[0]) return '?'
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase()
}

export function Sidebar({
    boards,
    brand,
    activeBoardId,
    theme,
    collapsed,
    onSelect,
    onToggleTheme,
    onHide,
    onNewBoard,
}: SidebarProps): React.JSX.Element {
    return (
        <nav
            className={`sidebar${collapsed ? ' is-collapsed' : ''}`}
            aria-label="Boards"
            aria-hidden={collapsed}
        >
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
                            tabIndex={collapsed ? -1 : undefined}
                            onClick={() => onSelect(board.sys_id)}
                        >
                            <span className="board-icon" aria-hidden="true">
                                {boardInitials(board.name)}
                            </span>
                            {board.name}
                        </button>
                    </li>
                ))}
            </ul>

            <button
                type="button"
                className="new-board-btn"
                tabIndex={collapsed ? -1 : undefined}
                onClick={onNewBoard}
            >
                + New board
            </button>

            <div className="sidebar-footer">
                <button
                    type="button"
                    className="icon-btn"
                    tabIndex={collapsed ? -1 : undefined}
                    onClick={onToggleTheme}
                    aria-pressed={theme === 'dark'}
                    aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                >
                    <span aria-hidden="true">{theme === 'dark' ? '☾' : '☀'}</span>
                </button>
                <button
                    type="button"
                    className="icon-btn"
                    tabIndex={collapsed ? -1 : undefined}
                    onClick={onHide}
                    aria-label="Hide sidebar"
                >
                    <span aria-hidden="true">&#8676;</span>
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
    onToggleQuery,
    onToggleAssigned,
    onRefresh,
    onShowSidebar,
}: ToolbarProps): React.JSX.Element {
    return (
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
                <label className="visually-hidden" htmlFor="noviqboard-search">
                    Search this board
                </label>
                <input
                    id="noviqboard-search"
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
