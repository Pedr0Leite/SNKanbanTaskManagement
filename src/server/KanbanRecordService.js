var KanbanRecordService = Class.create()

KanbanRecordService.JOURNAL_LIMIT = 50

KanbanRecordService.prototype = {
    initialize: function () {
        this.boardService = new KanbanBoardService()
        this.choiceUtil = new KanbanChoiceUtil()
        this._authorCache = {}
    },

    /**
     * Modal payload: configured modal fields plus the activity stream.
     *
     * @param {string} boardId
     * @param {string} table
     * @param {string} sysId
     * @returns {{ok: boolean, code: string, message: string, data: object}}
     */
    getRecord: function (boardId, table, sysId) {
        var ctx = this._context(boardId, table)
        if (!ctx.ok) return ctx

        var rec = new GlideRecordSecure(table)
        if (!rec.get(sysId)) {
            return this._err('not_found', 'That record does not exist, or you cannot read it.')
        }

        var template = new GlideRecord(table)
        template.initialize()
        var defs = this.boardService._fieldDefs(ctx.board, template, 'show_in_modal')

        var fields = []
        for (var i = 0; i < defs.length; i++) {
            var def = defs[i]
            var el = rec.getElement(def.name)
            if (el && typeof el.canRead === 'function' && !el.canRead()) continue
            fields.push({
                name: def.name,
                label: def.label,
                type: def.type,
                display_as: def.display_as,
                value: String(rec.getValue(def.name) || ''),
                display_value: String(rec.getDisplayValue(def.name) || ''),
                reference_sys_id: def.reference ? String(rec.getValue(def.name) || '') : '',
            })
        }

        var stream = this.getJournal(sysId)

        return {
            ok: true,
            data: {
                sys_id: rec.getUniqueValue(),
                table: table,
                title: String(rec.getDisplayValue(ctx.board.getValue('card_title_field')) || ''),
                lane_value: String(rec.getValue(ctx.board.getValue('lane_field')) || ''),
                sys_updated_on: String(rec.getValue('sys_updated_on') || ''),
                can_write: typeof rec.canWrite === 'function' ? rec.canWrite() : false,
                fields: fields,
                journal: stream.entries,
                journal_has_more: stream.has_more,
            },
        }
    },

    /**
     * Activity stream, newest first.
     *
     * Filtered by element_id alone. sys_journal_field.name holds the table that
     * DECLARES the journal field, not the record's own class — on this instance
     * the same journal table carries rows named both 'incident' and 'task'
     * (verified 2026-09-01). Filtering on the board's table therefore silently
     * hides entries. element_id is a sys_id and already unique.
     *
     * @param {string} sysId
     * @returns {{entries: Array, has_more: boolean}}
     */
    getJournal: function (sysId, offset) {
        var start = parseInt(offset, 10)
        if (isNaN(start) || start < 0) start = 0

        var entries = []
        var j = new GlideRecord('sys_journal_field')
        j.addQuery('element_id', sysId)
        j.orderByDesc('sys_created_on')
        j.chooseWindow(start, start + KanbanRecordService.JOURNAL_LIMIT + 1, false)
        j.setLimit(KanbanRecordService.JOURNAL_LIMIT + 1)
        j.query()
        while (j.next()) {
            var author = this._author(String(j.getValue('sys_created_by')))
            entries.push({
                sys_id: j.getUniqueValue(),
                field: String(j.getValue('element')),
                value: String(j.getValue('value')),
                created_on: String(j.getValue('sys_created_on')),
                created_on_display: String(j.getDisplayValue('sys_created_on')),
                author: author.name,
                initials: author.initials,
            })
        }
        var hasMore = entries.length > KanbanRecordService.JOURNAL_LIMIT
        if (hasMore) entries.pop()
        return { entries: entries, has_more: hasMore, offset: start, next_offset: start + entries.length }
    },

    /**
     * One page of the activity stream, for "show older" in the modal.
     *
     * @param {string} boardId
     * @param {string} table
     * @param {string} sysId
     * @param {number} offset
     * @returns {{ok: boolean, data: object}}
     */
    getJournalPage: function (boardId, table, sysId, offset) {
        var ctx = this._context(boardId, table)
        if (!ctx.ok) return ctx

        // Read access to the record gates access to its activity.
        var rec = new GlideRecordSecure(table)
        if (!rec.get(sysId)) {
            return this._err('not_found', 'That record does not exist, or you cannot read it.')
        }

        return { ok: true, data: this.getJournal(sysId, offset) }
    },

    /**
     * Move a record to another lane.
     *
     * A truthy return from update() is NOT proof the write happened: on Australia
     * patch 3 a scoped GlideRecordSecure.update() against a Global table returned
     * the sys_id while changing nothing at all (verified 2026-09-01). Every write
     * is therefore confirmed by re-reading the record through a fresh GlideRecord
     * and comparing the value.
     *
     * @param {string} boardId
     * @param {string} table
     * @param {string} sysId
     * @param {string} toLane
     * @param {string} expectedUpdatedOn optimistic concurrency token
     * @returns {{ok: boolean, code: string, message: string, data: object}}
     *   code 'stale' returns the fresh card; 'rejected' means the platform refused.
     */
    moveLane: function (boardId, table, sysId, toLane, expectedUpdatedOn) {
        var ctx = this._context(boardId, table)
        if (!ctx.ok) return ctx

        var laneField = ctx.board.getValue('lane_field')
        var lanes = this.boardService._resolveLanes(ctx.board, table, laneField)
        if (!lanes.ok) return lanes

        var allowed = false
        for (var i = 0; i < lanes.lanes.length; i++) {
            if (lanes.lanes[i].value === String(toLane)) allowed = true
        }
        if (!allowed) {
            return this._err('bad_request', '"' + toLane + '" is not a visible lane on this board.')
        }

        var rec = new GlideRecordSecure(table)
        if (!rec.get(sysId)) {
            return this._err('not_found', 'That record does not exist, or you cannot read it.')
        }
        if (typeof rec.canWrite === 'function' && !rec.canWrite()) {
            return this._err('no_write', 'You do not have permission to change this record.')
        }
        var laneEl = rec.getElement(laneField)
        if (laneEl && typeof laneEl.canWrite === 'function' && !laneEl.canWrite()) {
            return this._err('no_write', 'You do not have permission to change the ' + laneField + ' field.')
        }

        var currentUpdatedOn = String(rec.getValue('sys_updated_on') || '')
        if (expectedUpdatedOn && expectedUpdatedOn !== currentUpdatedOn) {
            return {
                ok: false,
                code: 'stale',
                message: 'Someone else changed this record. The board has been refreshed with their version.',
                data: { card: this._freshCard(ctx.board, table, sysId, laneField) },
            }
        }

        var from = String(rec.getValue(laneField) || '')
        if (from === String(toLane)) {
            return { ok: true, data: { card: this._freshCard(ctx.board, table, sysId, laneField) } }
        }

        var correlationId = gs.generateGUID()
        rec.setValue(laneField, toLane)
        var result = rec.update()

        // Confirm against storage, never against the writer's own copy.
        var verify = new GlideRecord(table)
        var readable = verify.get(sysId)
        var landed = readable ? String(verify.getValue(laneField)) : ''

        if (landed !== String(toLane)) {
            gs.error(
                '[' + correlationId + '] KanbanRecordService.moveLane refused: ' + table + '/' + sysId +
                ' ' + laneField + ' ' + from + ' -> ' + toLane +
                '; update() returned ' + (result === null ? 'null' : String(result)) +
                '; stored value is now ' + landed
            )
            return {
                ok: false,
                code: 'rejected',
                message:
                    'The platform refused that move. A business rule, workflow or mandatory field is ' +
                    'blocking the change — open the record to see what it needs.',
                correlation_id: correlationId,
                data: { card: this._freshCard(ctx.board, table, sysId, laneField) },
            }
        }

        return { ok: true, data: { card: this._freshCard(ctx.board, table, sysId, laneField) } }
    },

    /**
     * Append a journal entry through GlideRecord.update() so notifications and
     * business rules fire. Never writes sys_journal_field directly.
     *
     * @param {string} boardId
     * @param {string} table
     * @param {string} sysId
     * @param {string} field journal field name, must be permitted by the board
     * @param {string} value
     * @returns {{ok: boolean, code: string, message: string, data: object}}
     */
    addJournal: function (boardId, table, sysId, field, value) {
        var ctx = this._context(boardId, table)
        if (!ctx.ok) return ctx

        var text = String(value == null ? '' : value).trim()
        if (!text) return this._err('bad_request', 'Type something before posting.')
        if (text.length > 4000) return this._err('bad_request', 'That entry is too long (4000 characters maximum).')

        var template = new GlideRecord(table)
        template.initialize()
        var config = this.boardService._journalConfig(ctx.board, table, template)

        var permitted = null
        for (var i = 0; i < config.options.length; i++) {
            if (config.options[i].name === field) permitted = config.options[i]
        }
        if (!permitted) {
            return this._err('bad_request', '"' + field + '" is not a journal field enabled on this board.')
        }

        var rec = new GlideRecordSecure(table)
        if (!rec.get(sysId)) {
            return this._err('not_found', 'That record does not exist, or you cannot read it.')
        }

        // Authoritative check is against THIS record, not the blank template the
        // board config was described from — field ACLs can be record-conditional.
        var journalEl = rec.getElement(field)
        if (journalEl && typeof journalEl.canWrite === 'function' && !journalEl.canWrite()) {
            return this._err('no_write', 'You do not have permission to write to ' + permitted.label + '.')
        }

        var before = this.getJournal(sysId)
        var newestBefore = before.entries.length > 0 ? before.entries[0].sys_id : ''
        var correlationId = gs.generateGUID()
        rec.setValue(field, text)
        var result = rec.update()

        var after = this.getJournal(sysId)
        var newestAfter = after.entries.length > 0 ? after.entries[0].sys_id : ''
        if (!newestAfter || newestAfter === newestBefore) {
            gs.error(
                '[' + correlationId + '] KanbanRecordService.addJournal wrote nothing: ' + table + '/' + sysId +
                ' field ' + field + '; update() returned ' + (result === null ? 'null' : String(result))
            )
            return {
                ok: false,
                code: 'rejected',
                message: 'The platform refused that entry. Open the record to see what it needs.',
                correlation_id: correlationId,
            }
        }

        return { ok: true, data: { entry: after.entries[0], sys_updated_on: this._updatedOn(table, sysId) } }
    },

    /** Board context plus the guarantee that the table belongs to this board. */
    _context: function (boardId, table) {
        var board = this.boardService._loadBoard(boardId)
        if (!board.ok) return board
        if (String(board.record.getValue('table')) !== String(table)) {
            return this._err('bad_request', 'That record is not on this board\'s table.')
        }
        return { ok: true, board: board.record }
    },

    _freshCard: function (boardRec, table, sysId, laneField) {
        var rec = new GlideRecordSecure(table)
        if (!rec.get(sysId)) return null
        var template = new GlideRecord(table)
        template.initialize()
        var defs = this.boardService._fieldDefs(boardRec, template, 'show_on_card')
        return this.boardService.buildCard(
            rec,
            String(rec.getValue(laneField) || ''),
            defs,
            boardRec.getValue('card_title_field'),
            boardRec.getValue('card_subtitle_field')
        )
    },

    _updatedOn: function (table, sysId) {
        var gr = new GlideRecord(table)
        return gr.get(sysId) ? String(gr.getValue('sys_updated_on')) : ''
    },

    /**
     * Display name and initials for a user_name, cached for the life of this
     * service instance. Without the cache a 50-entry stream costs 50 queries.
     *
     * @param {string} userName sys_journal_field.sys_created_by
     * @returns {{name: string, initials: string}}
     */
    _author: function (userName) {
        var key = userName || '?'
        if (this._authorCache[key]) return this._authorCache[key]

        var display = key
        var u = new GlideRecord('sys_user')
        u.addQuery('user_name', key)
        u.setLimit(1)
        u.query()
        if (u.next()) display = String(u.getValue('name') || key)

        var parts = display.split(' ').filter(function (p) {
            return p.length > 0
        })
        var first = parts.length > 0 ? parts[0].charAt(0) : '?'
        var last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : ''

        this._authorCache[key] = { name: display, initials: (first + last).toUpperCase() }
        return this._authorCache[key]
    },

    _err: function (code, message) {
        return { ok: false, code: code, message: message }
    },

    type: 'KanbanRecordService',
}
