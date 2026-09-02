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
import { BoardConfig, BoardSummary, Card as CardModel, KanbanError, Settings } from './types'
import { Card } from './components/Card'
import { Lane } from './components/Lane'
import { Sidebar, Toast, Toasts, Toolbar } from './components/Chrome'
import { RecordModal } from './components/RecordModal'
import { Empty, Failed, Loading, NoAccess, NoBoards } from './components/States'

type Theme = 'light' | 'dark'

const FALLBACK_SETTINGS: Settings = {
    title: 'Kanban',
    accent: '#635fc7',
    accent_dark: '#7b77e0',
    default_theme: 'system',
    lane_width: 288,
    show_table_chip: true,
    density: 'comfortable',
    refresh_seconds: 30,
}

/** User's saved choice wins, then the administrator's default, then the OS. */
function preferredTheme(stored: string | undefined, fallback: Settings['default_theme']): Theme {
    if (stored === 'dark' || stored === 'light') return stored
    if (fallback === 'dark' || fallback === 'light') return fallback
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

    const [settings, setSettings] = useState<Settings>(FALLBACK_SETTINGS)
    const [theme, setTheme] = useState<Theme>('light')
    const [sidebarHidden, setSidebarHidden] = useState(false)
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [assignedToMe, setAssignedToMe] = useState(false)

    // Bumped by the retry button so a failed board-config fetch can be re-run,
    // not just the card fetch (which is a no-op while board is null).
    const [reloadKey, setReloadKey] = useState(0)
    const [openRecord, setOpenRecord] = useState<string | null>(null)
    const [draggingId, setDraggingId] = useState<string | null>(null)
    const [toasts, setToasts] = useState<Toast[]>([])
    const [announcement, setAnnouncement] = useState('')

    const toastSeq = useRef(0)
    const lastFocused = useRef<HTMLElement | null>(null)

    // Read by the polling timer without making it a dependency, so the interval
    // is not torn down and recreated on every card change.
    const cardsRef = useRef<CardModel[]>([])
    useEffect(() => {
        cardsRef.current = cards
    }, [cards])

    const pushToast = useCallback((title: string, body: string, tone: Toast['tone'] = 'info') => {
        const id = ++toastSeq.current
        setToasts((prev) => [...prev, { id, title, body, tone }])
        window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 9000)
    }, [])

    // ---- settings + preferences + board list -------------------------------
    useEffect(() => {
        let live = true
        Promise.all([
            api.getPreferences().catch(() => ({}) as Record<string, string>),
            api.settings().catch(() => FALLBACK_SETTINGS),
            api.boards(),
        ])
            .then(([prefs, appSettings, list]) => {
                if (!live) return
                setSettings(appSettings)
                setTheme(preferredTheme(prefs.theme, appSettings.default_theme))
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
    }, [boardId, reloadKey])

    // ---- cards -------------------------------------------------------------
    // Bumped on every board/filter change so a slow in-flight response cannot
    // overwrite the results of a newer request.
    const requestSeq = useRef(0)

    const loadCards = useCallback(
        (showSpinner: boolean) => {
            if (!boardId || !board) return
            const ticket = ++requestSeq.current
            if (showSpinner) setRefreshing(true)
            api.cards(boardId, { search: debouncedSearch, assignedToMe })
                .then((payload) => {
                    if (ticket !== requestSeq.current) return
                    setCards(payload.cards)
                    setCapped(payload.capped)
                    setError(null)
                })
                .catch((e: unknown) => {
                    if (ticket !== requestSeq.current) return
                    setError(e instanceof KanbanError ? e : null)
                })
                .finally(() => {
                    if (ticket !== requestSeq.current) return
                    setLoading(false)
                    setRefreshing(false)
                })
        },
        [boardId, board, debouncedSearch, assignedToMe]
    )

    useEffect(() => {
        loadCards(false)
    }, [loadCards])

    // Keep the board in step with the table. Records change from the native
    // form, from other people's boards and from business rules, so a board that
    // only refetched on demand would show a stale picture within minutes.
    //
    // Paused while a drag is in progress, while the modal is open and whenever
    // the tab is hidden — refetching under any of those either fights the user
    // or burns instance capacity on a board nobody is watching.
    useEffect(() => {
        if (!board || settings.refresh_seconds <= 0) return
        if (draggingId || openRecord) return

        const tick = window.setInterval(() => {
            if (document.visibilityState !== 'visible') return
            if (cardsRef.current.some((c) => c.pending)) return
            loadCards(false)
        }, settings.refresh_seconds * 1000)

        return () => window.clearInterval(tick)
    }, [board, settings.refresh_seconds, draggingId, openRecord, loadCards])

    // Refetch immediately on return to the tab, so someone coming back from the
    // native form sees their change rather than waiting out the interval.
    useEffect(() => {
        if (!board) return
        const onVisible = (): void => {
            if (document.visibilityState === 'visible' && !draggingId && !openRecord) loadCards(false)
        }
        document.addEventListener('visibilitychange', onVisible)
        return () => document.removeEventListener('visibilitychange', onVisible)
    }, [board, draggingId, openRecord, loadCards])

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
        const overId = String(over.id)
        if (!overId.startsWith('lane:')) return
        const toLane = overId.slice('lane:'.length)
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
        content = <Failed error={error} onRetry={() => setReloadKey((k) => k + 1)} />
    } else if (!loading && boards.length === 0) {
        // Without this the skeleton renders forever: board stays null because
        // there is nothing to select, and !board kept us in the loading branch.
        content = <NoBoards />
    } else if (loading || !board) {
        content = <Loading />
    } else if (cards.length === 0 && hasFilters) {
        // Only take over the whole surface when a filter is what emptied it.
        // An unfiltered empty board still renders its lanes, so cards can be
        // dropped into them and the configured columns stay visible.
        content = <Empty hasFilters onClear={clearFilters} />
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

    // Administrator-controlled appearance, injected as token overrides rather
    // than hardcoded anywhere. Values are validated server-side.
    const rootStyle = {
        '--purple': theme === 'dark' ? settings.accent_dark : settings.accent,
        '--lane-width': `${settings.lane_width}px`,
    } as React.CSSProperties

    return (
        <div className="kanban-root" data-theme={theme} data-density={settings.density} style={rootStyle}>
            {!sidebarHidden ? (
                <Sidebar
                    boards={boards}
                    brand={settings.title}
                    activeBoardId={boardId}
                    theme={theme}
                    onSelect={setBoardId}
                    onToggleTheme={toggleTheme}
                    onHide={() => hideSidebar(true)}
                />
            ) : null}

            <div className="main">
                <Toolbar
                    title={board?.name ?? settings.title}
                    table={settings.show_table_chip ? (board?.table ?? '') : ''}
                    search={search}
                    assignedToMe={assignedToMe}
                    assignedToMeSupported={board?.capabilities.assigned_to_me_supported ?? false}
                    refreshing={refreshing}
                    sidebarHidden={sidebarHidden}
                    onSearch={setSearch}
                    onToggleAssigned={() => setAssignedToMe((v) => !v)}
                    onRefresh={() => (board ? loadCards(true) : setReloadKey((k) => k + 1))}
                    onShowSidebar={() => hideSidebar(false)}
                />

                {capped && board ? (
                    <p className="meta-text" style={{ padding: '10px 24px 0' }}>
                        Showing the {board.max_records} most recently updated records. Narrow the search to see
                        others.
                    </p>
                ) : null}

                {board && !loading && !error && cards.length === 0 && !hasFilters ? (
                    <p className="meta-text" style={{ padding: '10px 24px 0' }}>
                        No records match this board’s filter yet. Its columns are shown so work can be dropped
                        into them.
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
