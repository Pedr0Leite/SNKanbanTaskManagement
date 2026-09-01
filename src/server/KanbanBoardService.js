var KanbanBoardService = Class.create()

KanbanBoardService.BOARD = 'x_335329_sn_ktm_board'
KanbanBoardService.FIELD = 'x_335329_sn_ktm_field'
KanbanBoardService.LANE = 'x_335329_sn_ktm_lane'
KanbanBoardService.HARD_CAP = 500

KanbanBoardService.prototype = {
    initialize: function () {
        this.choiceUtil = new KanbanChoiceUtil()
    },

    /**
     * Boards the caller may open. Drives the board picker.
     * @returns {Array} [{sys_id, name, table, order}]
     */
    getBoards: function () {
        var boards = []
        var gr = new GlideRecord(KanbanBoardService.BOARD)
        gr.addQuery('active', true)
        gr.orderBy('order')
        gr.orderBy('name')
        gr.setLimit(100)
        gr.query()
        while (gr.next()) {
            if (!this._hasBoardRoles(gr)) continue
            boards.push({
                sys_id: gr.getUniqueValue(),
                name: gr.getValue('name'),
                table: gr.getValue('table'),
                order: parseInt(gr.getValue('order'), 10) || 0,
            })
        }
        return boards
    },

    /**
     * Full board contract: metadata, lanes, card/modal field definitions,
     * journal configuration and the caller's capabilities.
     *
     * @param {string} boardId sys_id of the board config
     * @returns {{ok: boolean, code: string, message: string, data: object}}
     */
    getBoard: function (boardId) {
        var board = this._loadBoard(boardId)
        if (!board.ok) return board
        var gr = board.record
        var table = gr.getValue('table')
        var laneField = gr.getValue('lane_field')

        if (!this._canReadTable(table)) {
            return this._err('no_access', 'You do not have permission to read records on this board.')
        }

        var lanes = this._resolveLanes(gr, table, laneField)
        if (!lanes.ok) return lanes

        var template = new GlideRecord(table)
        template.initialize()

        var laneMeta = this.choiceUtil.describeField(template, laneField)
        if (!laneMeta) {
            return this._err('bad_config', 'Lane field "' + laneField + '" does not exist on ' + table + '.')
        }

        return {
            ok: true,
            data: {
                sys_id: gr.getUniqueValue(),
                name: gr.getValue('name'),
                table: table,
                lane_field: laneField,
                lane_field_label: laneMeta.label,
                max_records: this._cap(gr),
                title_field: gr.getValue('card_title_field'),
                subtitle_field: gr.getValue('card_subtitle_field'),
                lanes: lanes.lanes,
                card_fields: this._fieldDefs(gr, template, 'show_on_card'),
                modal_fields: this._fieldDefs(gr, template, 'show_in_modal'),
                journal: this._journalConfig(gr, table, template),
                capabilities: {
                    can_write_lane: this._canWriteField(table, laneField),
                    assigned_to_me_supported: !!this.choiceUtil.describeField(template, 'assigned_to'),
                },
            },
        }
    },

    /**
     * Cards for a board.
     *
     * Counts are derived from what GlideRecordSecure actually returned, never
     * from GlideAggregate — an aggregate ignores ACLs and would tell the user
     * how many records exist that they are not allowed to see.
     *
     * @param {string} boardId
     * @param {{filter: string, assigned_to_me: boolean, search: string, limit: number}} opts
     * @returns {{ok: boolean, code: string, message: string, data: object}}
     */
    getCards: function (boardId, opts) {
        opts = opts || {}
        var board = this._loadBoard(boardId)
        if (!board.ok) return board
        var gr = board.record
        var table = gr.getValue('table')
        var laneField = gr.getValue('lane_field')

        if (!this._canReadTable(table)) {
            return this._err('no_access', 'You do not have permission to read records on this board.')
        }

        var lanes = this._resolveLanes(gr, table, laneField)
        if (!lanes.ok) return lanes

        var visible = {}
        for (var l = 0; l < lanes.lanes.length; l++) visible[lanes.lanes[l].value] = true

        var template = new GlideRecord(table)
        template.initialize()
        var cardFields = this._fieldDefs(gr, template, 'show_on_card')
        var cap = this._cap(gr)

        var q = new GlideRecordSecure(table)
        var baseFilter = gr.getValue('filter')
        if (baseFilter) q.addEncodedQuery(baseFilter)
        if (opts.filter) q.addEncodedQuery(opts.filter)

        if (opts.assigned_to_me && this.choiceUtil.describeField(template, 'assigned_to')) {
            q.addQuery('assigned_to', gs.getUserID())
        }

        var search = String(opts.search || '').trim()
        if (search) {
            var titleField = gr.getValue('card_title_field')
            var subtitleField = gr.getValue('card_subtitle_field')
            var or = q.addQuery(titleField, 'CONTAINS', search)
            if (subtitleField) or.addOrCondition(subtitleField, 'CONTAINS', search)
        }

        // Only ever ask for lanes the board actually shows.
        q.addQuery(laneField, 'IN', Object.keys(visible).join(','))
        q.orderByDesc('sys_updated_on')
        q.setLimit(cap)
        q.query()

        var cards = []
        var counts = {}
        while (q.next()) {
            var laneValue = String(q.getValue(laneField))
            if (!visible[laneValue]) continue
            counts[laneValue] = (counts[laneValue] || 0) + 1
            cards.push(
                this.buildCard(q, laneValue, cardFields, gr.getValue('card_title_field'), gr.getValue('card_subtitle_field'))
            )
        }

        return {
            ok: true,
            data: {
                cards: cards,
                counts: counts,
                capped: cards.length >= cap,
                limit: cap,
            },
        }
    },

    /**
     * Compact card payload. Never a raw GlideRecord dump.
     *
     * @param {GlideRecord} rec positioned record (must be GlideRecordSecure for card lists)
     * @param {string} laneValue
     * @param {Array} fieldDefs from _fieldDefs
     * @param {string} titleField
     * @param {string} subtitleField
     * @returns {object}
     */
    buildCard: function (rec, laneValue, fieldDefs, titleField, subtitleField) {
        var values = []
        for (var i = 0; i < fieldDefs.length; i++) {
            var def = fieldDefs[i]
            var el = rec.getElement(def.name)
            if (el && typeof el.canRead === 'function' && !el.canRead()) continue
            values.push({
                name: def.name,
                label: def.label,
                type: def.type,
                display_as: def.display_as,
                value: String(rec.getValue(def.name) || ''),
                display_value: String(rec.getDisplayValue(def.name) || ''),
            })
        }
        return {
            sys_id: rec.getUniqueValue(),
            lane_value: laneValue,
            title: titleField ? String(rec.getDisplayValue(titleField) || '') : '',
            subtitle: subtitleField ? String(rec.getDisplayValue(subtitleField) || '') : '',
            fields: values,
            sys_updated_on: String(rec.getValue('sys_updated_on') || ''),
            can_write: typeof rec.canWrite === 'function' ? rec.canWrite() : false,
        }
    },

    /**
     * Lanes = resolved choices, filtered and reordered by lane override records.
     * @returns {{ok: boolean, lanes: Array, code: string, message: string}}
     */
    _resolveLanes: function (boardRec, table, laneField) {
        var resolved = this.choiceUtil.getChoices(table, laneField)
        if (!resolved.ok) return this._err('bad_config', resolved.error)

        var overrides = {}
        var ov = new GlideRecord(KanbanBoardService.LANE)
        ov.addQuery('board', boardRec.getUniqueValue())
        ov.setLimit(200)
        ov.query()
        while (ov.next()) {
            overrides[String(ov.getValue('value'))] = {
                label: ov.getValue('label_override'),
                hidden: ov.getValue('hidden') === '1' || ov.getValue('hidden') === 'true',
                order: ov.getValue('order') === '' ? null : parseInt(ov.getValue('order'), 10),
                wip_limit: parseInt(ov.getValue('wip_limit'), 10) || 0,
                accent: ov.getValue('accent_colour'),
            }
        }

        var lanes = []
        for (var i = 0; i < resolved.choices.length; i++) {
            var choice = resolved.choices[i]
            var o = overrides[choice.value] || {}
            if (o.hidden) continue
            lanes.push({
                value: choice.value,
                label: o.label || choice.label,
                order: o.order === null || o.order === undefined ? choice.sequence : o.order,
                wip_limit: o.wip_limit || 0,
                accent: o.accent || '',
            })
        }
        lanes.sort(function (a, b) {
            return a.order - b.order
        })

        if (!lanes.length) {
            return this._err('bad_config', 'Every lane on this board is hidden.')
        }
        return { ok: true, lanes: lanes }
    },

    /**
     * Card or modal field definitions, dropping anything the caller cannot read
     * and anything that no longer exists on the table.
     * @param {GlideRecord} boardRec
     * @param {GlideRecord} template initialize()d record of the board table
     * @param {string} flag 'show_on_card' | 'show_in_modal'
     * @returns {Array} [{name, label, type, display_as, order}]
     */
    _fieldDefs: function (boardRec, template, flag) {
        var defs = []
        var f = new GlideRecord(KanbanBoardService.FIELD)
        f.addQuery('board', boardRec.getUniqueValue())
        f.addQuery(flag, true)
        f.orderBy('order')
        f.setLimit(60)
        f.query()
        while (f.next()) {
            var element = f.getValue('element')
            var meta = this.choiceUtil.describeField(template, element)
            if (!meta) continue
            defs.push({
                name: element,
                label: f.getValue('label_override') || meta.label,
                type: meta.type,
                reference: meta.reference,
                display_as: f.getValue('display_as') || 'text',
                order: parseInt(f.getValue('order'), 10) || 0,
            })
        }
        return defs
    },

    /**
     * @returns {{field: string, allow_choice: boolean, options: Array}}
     */
    _journalConfig: function (boardRec, table, template) {
        var configured = boardRec.getValue('journal_field') || ''
        var allowChoice = boardRec.getValue('allow_journal_choice') === '1' ||
            boardRec.getValue('allow_journal_choice') === 'true'

        var candidates = allowChoice ? ['comments', 'work_notes'] : [configured]
        var options = []
        for (var i = 0; i < candidates.length; i++) {
            var name = candidates[i]
            if (!name) continue
            var meta = this.choiceUtil.describeField(template, name)
            if (!meta) continue
            options.push({
                name: name,
                label: meta.label,
                can_write: this._canWriteField(table, name),
            })
        }
        return { field: configured, allow_choice: allowChoice, options: options }
    },

    /**
     * @returns {{ok: boolean, record: GlideRecord, code: string, message: string}}
     */
    _loadBoard: function (boardId) {
        if (!boardId) return this._err('bad_request', 'No board specified.')
        var gr = new GlideRecord(KanbanBoardService.BOARD)
        if (!gr.get(boardId)) return this._err('not_found', 'That board does not exist.')
        if (gr.getValue('active') !== '1' && gr.getValue('active') !== 'true') {
            return this._err('not_found', 'That board is not active.')
        }
        if (!this._hasBoardRoles(gr)) {
            return this._err('no_access', 'You do not have a role required to open this board.')
        }
        return { ok: true, record: gr }
    },

    _hasBoardRoles: function (boardRec) {
        var roles = String(boardRec.getValue('roles') || '').trim()
        if (!roles) return true
        var ids = roles.split(',')
        for (var i = 0; i < ids.length; i++) {
            var r = new GlideRecord('sys_user_role')
            if (r.get(ids[i]) && gs.hasRole(r.getValue('name'))) return true
        }
        return false
    },

    /**
     * True when the caller may read the table at all. An empty table is still
     * readable — only an ACL refusal or a missing table counts as "no".
     */
    _canReadTable: function (table) {
        try {
            var probe = new GlideRecordSecure(table)
            if (!probe.isValid()) return false
            probe.setLimit(1)
            probe.query()
            if (!probe.next()) return true
            return typeof probe.canRead === 'function' ? probe.canRead() : true
        } catch (e) {
            return false
        }
    },

    _canWriteField: function (table, element) {
        try {
            var gr = new GlideRecordSecure(table)
            gr.initialize()
            var el = gr.getElement(element)
            return !!(el && typeof el.canWrite === 'function' && el.canWrite())
        } catch (e) {
            return false
        }
    },

    /** Board max_records, clamped to a hard server-side ceiling. */
    _cap: function (boardRec) {
        var configured = parseInt(boardRec.getValue('max_records'), 10) || 200
        return Math.max(1, Math.min(configured, KanbanBoardService.HARD_CAP))
    },

    _err: function (code, message) {
        return { ok: false, code: code, message: message }
    },

    type: 'KanbanBoardService',
}
