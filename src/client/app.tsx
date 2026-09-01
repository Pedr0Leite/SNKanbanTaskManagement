import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    KeyboardSensor,
    PointerSensor,
    closestCorners,
    useSensor,
    useSensors,
} from '@dnd-kit/core'

import './theme.css'
import './app.css'

import { api } from './api'
import { BoardConfig, BoardSummary, Card as CardModel, KanbanError } from './types'
import { Card } from './components/Card'
import { Lane } from './components/Lane'
import { Sidebar, Toast, Toasts, Toolbar } from './components/Chrome'
import { RecordModal } from './components/RecordModal'
import { Empty, Failed, Loading, NoAccess } from './components/States'

type Theme = 'light' | 'dark'

function preferredTheme(stored: string | undefined): Theme {
    if (stored === 'dark' || stored === 'light') return stored
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default function App(): React.JSX.Element {
    const [boards, setBoards] = useState<BoardSummary[]>([])
    const [boardId, setBoardId] = useState('')
    const [board, setBoard] = useState<BoardConfig | null>(null)
    const [cards, setCards] = useState<CardModel[]>([])
    const [capped, setCapped] = useState(false)

    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState<KanbanError | null>(null)

    const [theme, setTheme] = useState<Theme>('light')
    const [sidebarHidden, setSidebarHidden] = useState(false)
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [assignedToMe, setAssignedToMe] = useState(false)

    const [openRecord, setOpenRecord] = useState<string | null>(null)
    const [draggingId, setDraggingId] = useState<string | null>(null)
    const [toasts, setToasts] = useState<Toast[]>([])
    const [announcement, setAnnouncement] = useState('')

    const toastSeq = useRef(0)
    const lastFocused = useRef<HTMLElement | null>(null)

    const pushToast = useCallback((title: string, body: string, tone: Toast['tone'] = 'info') => {
        const id = ++toastSeq.current
        setToasts((prev) => [...prev, { id, title, body, tone }])
        window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 9000)
    }, [])

    // ---- preferences + board list -----------------------------------------
    useEffect(() => {
        let live = true
        Promise.all([api.getPreferences().catch(() => ({}) as Record<string, string>), api.boards()])
            .then(([prefs, list]) => {
                if (!live) return
                setTheme(preferredTheme(prefs.theme))
                setSidebarHidden(prefs.sidebar === 'hidden')
                setBoards(list)
                setBoardId((current) => current || (list.length > 0 ? list[0].sys_id : ''))
                if (list.length === 0) setLoading(false)
            })
            .catch((e: unknown) => {
                if (!live) return
                setError(e instanceof KanbanError ? e : null)
                setLoading(false)
            })
        return () => {
            live = false
        }
    }, [])

    const savePreference = useCallback((key: string, value: string) => {
        void api.setPreferences({ [key]: value }).catch(() => {
            /* a preference that fails to persist must not break the board */
        })
    }, [])

    // ---- debounce search ---------------------------------------------------
    useEffect(() => {
        const timer = window.setTimeout(() => setDebouncedSearch(search), 300)
        return () => window.clearTimeout(timer)
    }, [search])

    // ---- board config ------------------------------------------------------
    useEffect(() => {
        if (!boardId) return
        let live = true
        setLoading(true)
        setError(null)
        setBoard(null)
        setCards([])
        api.board(boardId)
            .then((config) => {
                if (live) setBoard(config)
            })
            .catch((e: unknown) => {
                if (!live) return
                setError(e instanceof KanbanError ? e : null)
                setLoading(false)
            })
        return () => {
            live = false
        }
    }, [boardId])

    // ---- cards -------------------------------------------------------------
    const loadCards = useCallback(
        (showSpinner: boolean) => {
            if (!boardId || !board) return
            if (showSpinner) setRefreshing(true)
            api.cards(boardId, { search: debouncedSearch, assignedToMe })
                .then((payload) => {
                    setCards(payload.cards)
                    setCapped(payload.capped)
                    setError(null)
                })
                .catch((e: unknown) => setError(e instanceof KanbanError ? e : null))
                .finally(() => {
                    setLoading(false)
                    setRefreshing(false)
                })
        },
        [boardId, board, debouncedSearch, assignedToMe]
    )

    useEffect(() => {
        loadCards(false)
    }, [loadCards])

    // ---- drag and drop -----------------------------------------------------
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor)
    )

    const byLane = useMemo(() => {
        const map = new Map<string, CardModel[]>()
        for (const lane of board?.lanes ?? []) map.set(lane.value, [])
        for (const card of cards) map.get(card.lane_value)?.push(card)
        return map
    }, [board, cards])

    const draggingCard = draggingId ? cards.find((c) => c.sys_id === draggingId) : undefined

    function onDragStart(event: DragStartEvent): void {
        setDraggingId(String(event.active.id))
    }

    async function onDragEnd(event: DragEndEvent): Promise<void> {
        setDraggingId(null)
        const { active, over } = event
        if (!over || !board) return

        const sysId = String(active.id)
        const toLane = String(over.id)
        const card = cards.find((c) => c.sys_id === sysId)
        if (!card || card.lane_value === toLane) return

        const fromLane = card.lane_value
        const laneLabel = board.lanes.find((l) => l.value === toLane)?.label ?? toLane

        // 1. move locally and mark pending
        setCards((prev) =>
            prev.map((c) => (c.sys_id === sysId ? { ...c, lane_value: toLane, pending: true } : c))
        )
        setAnnouncement(`${card.title} moved to ${laneLabel}`)

        try {
            const result = await api.moveLane(board.sys_id, board.table, sysId, toLane, card.sys_updated_on)
            setCards((prev) => prev.map((c) => (c.sys_id === sysId ? { ...result.card, pending: false } : c)))
        } catch (e: unknown) {
            const err = e instanceof KanbanError ? e : null
            const fresh = (err?.data as { card?: CardModel } | undefined)?.card

            if (err?.code === 'stale' && fresh) {
                setCards((prev) => prev.map((c) => (c.sys_id === sysId ? { ...fresh, pending: false } : c)))
                pushToast('Changed elsewhere', err.message, 'info')
                setAnnouncement(`${card.title} was changed by someone else and has been refreshed`)
                return
            }

            // rollback — including the case where the server sent a fresh card
            setCards((prev) =>
                prev.map((c) =>
                    c.sys_id === sysId
                        ? fresh
                            ? { ...fresh, pending: false }
                            : { ...c, lane_value: fromLane, pending: false }
                        : c
                )
            )
            pushToast(
                'Move refused',
                err ? `${err.message} ${err.suggestedAction}` : 'That move could not be saved.',
                'error'
            )
            setAnnouncement(`${card.title} returned to its previous column`)
        }
    }

    // ---- theme -------------------------------------------------------------
    function toggleTheme(): void {
        const next: Theme = theme === 'dark' ? 'light' : 'dark'
        setTheme(next)
        savePreference('theme', next)
    }

    function hideSidebar(hidden: boolean): void {
        setSidebarHidden(hidden)
        savePreference('sidebar', hidden ? 'hidden' : 'shown')
    }

    function openCard(sysId: string): void {
        lastFocused.current = document.activeElement as HTMLElement | null
        setOpenRecord(sysId)
    }

    function closeModal(): void {
        setOpenRecord(null)
        lastFocused.current?.focus()
    }

    const hasFilters = debouncedSearch.length > 0 || assignedToMe

    function clearFilters(): void {
        setSearch('')
        setAssignedToMe(false)
    }

    // ---- render ------------------------------------------------------------
    let content: React.JSX.Element
    if (error && (error.code === 'no_access' || error.code === 'no_write')) {
        content = <NoAccess error={error} />
    } else if (error) {
        content = <Failed error={error} onRetry={() => loadCards(true)} />
    } else if (loading || !board) {
        content = <Loading />
    } else if (cards.length === 0) {
        content = <Empty hasFilters={hasFilters} onClear={clearFilters} />
    } else {
        content = (
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={onDragStart}
                onDragEnd={(e) => void onDragEnd(e)}
                onDragCancel={() => setDraggingId(null)}
            >
                <div className="board">
                    {board.lanes.map((lane) => (
                        <Lane
                            key={lane.value}
                            lane={lane}
                            cards={byLane.get(lane.value) ?? []}
                            onOpen={openCard}
                        />
                    ))}
                </div>
                <DragOverlay>
                    {draggingCard ? (
                        <ul style={{ listStyle: 'none', width: 'var(--lane-width)' }}>
                            <Card card={draggingCard} laneLabel="" onOpen={() => undefined} overlay />
                        </ul>
                    ) : null}
                </DragOverlay>
            </DndContext>
        )
    }

    return (
        <div className="kanban-root" data-theme={theme}>
            {!sidebarHidden ? (
                <Sidebar
                    boards={boards}
                    activeBoardId={boardId}
                    theme={theme}
                    onSelect={setBoardId}
                    onToggleTheme={toggleTheme}
                    onHide={() => hideSidebar(true)}
                />
            ) : null}

            <div className="main">
                <Toolbar
                    title={board?.name ?? 'Kanban'}
                    table={board?.table ?? ''}
                    search={search}
                    assignedToMe={assignedToMe}
                    assignedToMeSupported={board?.capabilities.assigned_to_me_supported ?? false}
                    refreshing={refreshing}
                    sidebarHidden={sidebarHidden}
                    onSearch={setSearch}
                    onToggleAssigned={() => setAssignedToMe((v) => !v)}
                    onRefresh={() => loadCards(true)}
                    onShowSidebar={() => hideSidebar(false)}
                />

                {capped && board ? (
                    <p className="meta-text" style={{ padding: '10px 24px 0' }}>
                        Showing the {board.max_records} most recently updated records. Narrow the search to see
                        others.
                    </p>
                ) : null}

                {content}
            </div>

            <p className="visually-hidden" role="status" aria-live="polite">
                {announcement}
            </p>

            <Toasts toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

            {openRecord && board ? (
                <RecordModal
                    board={board}
                    sysId={openRecord}
                    onClose={closeModal}
                    onRecordChanged={(sysId, sysUpdatedOn) =>
                        setCards((prev) =>
                            prev.map((c) => (c.sys_id === sysId ? { ...c, sys_updated_on: sysUpdatedOn } : c))
                        )
                    }
                />
            ) : null}
        </div>
    )
}
