var KanbanAdminService = Class.create()

KanbanAdminService.ADMIN_ROLE = 'x_335329_sn_ktm.kanban_admin'

/** Field types that make sense as a card/modal field. Everything else is noise. */
KanbanAdminService.DISPLAYABLE = [
    'string',
    'integer',
    'decimal',
    'float',
    'boolean',
    'reference',
    'glide_date',
    'glide_date_time',
    'due_date',
    'glide_duration',
    'choice',
    'translated_field',
    'translated_text',
    'sys_class_name',
    'domain_id',
    'email',
    'url',
    'phone_number',
    'longint',
    'price',
    'currency',
]

KanbanAdminService.prototype = {
    initialize: function () {
        this.choiceUtil = new KanbanChoiceUtil()
    },

    /**
     * Every table that extends task, for the board creation picker.
     *
     * Walks DOWN from task rather than testing every table in the instance:
     * sys_db_object has thousands of rows and checking each one's ancestry
     * would be a query per table.
     *
     * @returns {{ok: boolean, data: object}} [{name, label}] sorted by label
     */
    listTaskTables: function () {
        var guard = this._requireAdmin()
        if (guard) return guard

        var root = new GlideRecord('sys_db_object')
        root.addQuery('name', 'task')
        root.setLimit(1)
        root.query()
        if (!root.next()) {
            return { ok: false, code: 'bad_config', message: 'The task table does not exist on this instance.' }
        }

        var tables = [{ name: 'task', label: String(root.getValue('label') || 'Task') }]
        var frontier = [root.getUniqueValue()]

        // Depth-limited breadth-first descent. Task hierarchies are shallow;
        // the cap stops a malformed super_class loop from spinning forever.
        for (var depth = 0; depth < 8 && frontier.length > 0; depth++) {
            var children = new GlideRecord('sys_db_object')
            children.addQuery('super_class', 'IN', frontier.join(','))
            children.setLimit(500)
            children.query()

            var next = []
            while (children.next()) {
                var name = String(children.getValue('name'))
                if (!name) continue
                tables.push({ name: name, label: String(children.getValue('label') || name) })
                next.push(children.getUniqueValue())
            }
            frontier = next
        }

        tables.sort(function (a, b) {
            return a.label.toLowerCase() < b.label.toLowerCase() ? -1 : 1
        })
        return { ok: true, data: { tables: tables } }
    },

    /**
     * Fields on a table that are worth showing on a board, plus which of them
     * are usable as the lane field.
     *
     * @param {string} table
     * @returns {{ok: boolean, data: object}}
     */
    listFields: function (table) {
        // Deliberately not admin-only: the condition builder needs field labels
        // for every user. Labels are not sensitive, and record visibility is
        // still decided by GlideRecordSecure when the query actually runs.
        if (!table) return this._err('bad_request', 'No table specified.')

        var hierarchy = this.choiceUtil.getHierarchy(table)
        if (!hierarchy.length) return this._err('bad_request', 'Table "' + table + '" does not exist.')
        if (hierarchy.indexOf('task') === -1) {
            return this._err('bad_request', '"' + table + '" does not extend task.')
        }

        var seen = {}
        var fields = []
        var template = new GlideRecord(table)
        template.initialize()

        var d = new GlideRecord('sys_dictionary')
        d.addQuery('name', 'IN', hierarchy.join(','))
        d.addQuery('active', true)
        d.addNotNullQuery('element')
        d.orderBy('column_label')
        d.setLimit(600)
        d.query()

        while (d.next()) {
            var element = String(d.getValue('element'))
            if (!element || seen[element]) continue
            var type = String(d.getValue('internal_type'))
            if (KanbanAdminService.DISPLAYABLE.indexOf(type) === -1) continue
            seen[element] = true

            fields.push({
                name: element,
                label: String(d.getValue('column_label') || this.choiceUtil._humanise(element)),
                type: type,
                // A lane field must resolve to a usable choice list.
                lane_capable: type === 'choice' || type === 'integer' || type === 'string',
            })
        }

        if (!fields.length) {
            // sys_dictionary unreadable — fall back to the fields we know every
            // task child has, so board creation is still possible.
            var fallback = ['state', 'number', 'short_description', 'priority', 'assigned_to', 'description']
            for (var i = 0; i < fallback.length; i++) {
                var meta = this.choiceUtil.describeField(template, fallback[i])
                if (!meta) continue
                fields.push({
                    name: fallback[i],
                    label: meta.label,
                    type: meta.type,
                    lane_capable: true,
                })
            }
        }

        return { ok: true, data: { table: table, fields: fields } }
    },

    /**
     * Resolved choices for one field. Serves both the condition builder's value
     * dropdown and the new-board dialog's live lane preview, which are the same
     * question asked twice.
     *
     * @param {string} table
     * @param {string} element
     * @returns {{ok: boolean, data: object}}
     */
    fieldChoices: function (table, element) {
        if (!table || !element) return this._err('bad_request', 'Table and field are both required.')
        if (!this.choiceUtil.extendsTable(table, 'task')) {
            return this._err('bad_request', '"' + table + '" does not extend task.')
        }

        var resolved = this.choiceUtil.getChoices(table, element)
        return {
            ok: true,
            data: {
                table: table,
                field: element,
                resolvable: resolved.ok,
                source: resolved.source,
                reason: resolved.error,
                choices: resolved.choices,
            },
        }
    },

    /**
     * Create a board plus its card/modal field configuration.
     *
     * The lane field is proven to resolve to a real choice list BEFORE the board
     * is written, so a board that cannot render is never persisted.
     *
     * @param {object} payload {name, table, lane_field, filter, card_title_field,
     *   card_subtitle_field, journal_field, allow_journal_choice, card_fields[], modal_fields[]}
     * @returns {{ok: boolean, data: object}} the new board sys_id
     */
    createBoard: function (payload) {
        var guard = this._requireAdmin()
        if (guard) return guard

        payload = payload || {}
        var name = String(payload.name || '').trim()
        var table = String(payload.table || '').trim()
        var laneField = String(payload.lane_field || 'state').trim()

        if (!name) return this._err('bad_request', 'Give the board a name.')
        if (!table) return this._err('bad_request', 'Choose a table for the board.')

        if (!this.choiceUtil.extendsTable(table, 'task')) {
            return this._err('bad_request', '"' + table + '" does not extend task, so it cannot be a Kanban board.')
        }

        var lanes = this.choiceUtil.getChoices(table, laneField)
        if (!lanes.ok) {
            return this._err('bad_request', 'That lane field will not work: ' + lanes.error)
        }

        var template = new GlideRecord(table)
        template.initialize()

        var titleField = String(payload.card_title_field || 'number').trim()
        if (!this.choiceUtil.describeField(template, titleField)) {
            return this._err('bad_request', 'Card title field "' + titleField + '" does not exist on ' + table + '.')
        }

        var subtitleField = String(payload.card_subtitle_field || '').trim()
        if (subtitleField && !this.choiceUtil.describeField(template, subtitleField)) {
            return this._err('bad_request', 'Card subtitle field "' + subtitleField + '" does not exist on ' + table + '.')
        }

        var filter = String(payload.filter || '').trim()
        if (filter && !this._filterParses(table, filter)) {
            return this._err('bad_request', 'That filter is not a valid encoded query for ' + table + '.')
        }

        var board = new GlideRecord(KanbanBoardService.BOARD)
        board.initialize()
        board.setValue('name', name)
        board.setValue('table', table)
        board.setValue('lane_field', laneField)
        board.setValue('filter', filter)
        board.setValue('card_title_field', titleField)
        board.setValue('card_subtitle_field', subtitleField)
        board.setValue('journal_field', String(payload.journal_field || 'comments'))
        board.setValue('allow_journal_choice', payload.allow_journal_choice ? true : false)
        board.setValue('max_records', parseInt(payload.max_records, 10) || 200)
        board.setValue('active', true)
        board.setValue('order', 100)

        var boardId = board.insert()
        if (!boardId) {
            var correlationId = gs.generateGUID()
            gs.error('[' + correlationId + '] KanbanAdminService.createBoard insert returned null for ' + table)
            return {
                ok: false,
                code: 'rejected',
                message: 'The board could not be saved.',
                correlation_id: correlationId,
            }
        }

        var created = this._createFields(boardId, template, payload)

        return {
            ok: true,
            data: {
                sys_id: String(boardId),
                name: name,
                table: table,
                lanes: lanes.choices.length,
                fields_created: created,
            },
        }
    },

    /**
     * @returns {number} how many field configuration records were written
     */
    _createFields: function (boardId, template, payload) {
        var onCard = this._asArray(payload.card_fields)
        var inModal = this._asArray(payload.modal_fields)

        var all = {}
        var i
        for (i = 0; i < onCard.length; i++) all[onCard[i]] = { card: true, modal: false }
        for (i = 0; i < inModal.length; i++) {
            if (all[inModal[i]]) all[inModal[i]].modal = true
            else all[inModal[i]] = { card: false, modal: true }
        }

        var order = 100
        var created = 0
        for (var element in all) {
            if (!Object.prototype.hasOwnProperty.call(all, element)) continue
            var meta = this.choiceUtil.describeField(template, element)
            if (!meta) continue

            var row = new GlideRecord(KanbanBoardService.FIELD)
            row.initialize()
            row.setValue('board', boardId)
            row.setValue('element', element)
            row.setValue('show_on_card', all[element].card)
            row.setValue('show_in_modal', all[element].modal)
            row.setValue('display_as', this._displayAs(meta.type))
            row.setValue('order', order)
            if (row.insert()) created++
            order += 100
        }
        return created
    },

    /** Sensible default rendering for a dictionary type. */
    _displayAs: function (type) {
        if (type === 'reference') return 'avatar'
        if (type === 'glide_date' || type === 'glide_date_time' || type === 'due_date') return 'date'
        if (type === 'choice' || type === 'integer') return 'badge'
        return 'text'
    },

    /**
     * Does this encoded query actually parse against the table? An invalid query
     * is silently ignored by GlideRecord, which would give the admin a board
     * showing everything while they believe it is filtered.
     */
    _filterParses: function (table, filter) {
        try {
            var probe = new GlideRecordSecure(table)
            probe.addEncodedQuery(filter)
            probe.setLimit(1)
            probe.query()
            return String(probe.getEncodedQuery() || '').length > 0
        } catch (e) {
            return false
        }
    },

    _asArray: function (value) {
        if (!value) return []
        if (Object.prototype.toString.call(value) === '[object Array]') return value
        return [value]
    },

    _requireAdmin: function () {
        if (gs.hasRole(KanbanAdminService.ADMIN_ROLE) || gs.hasRole('admin')) return null
        return this._err('no_access', 'Only a Kanban administrator can create or change boards.')
    },

    _err: function (code, message) {
        return { ok: false, code: code, message: message }
    },

    type: 'KanbanAdminService',
}
