var KanbanChoiceUtil = Class.create()

KanbanChoiceUtil.prototype = {
    initialize: function () {
        this.language = gs.getSession().getLanguage() || 'en'
        this._warned = {}
    },

    /**
     * Table hierarchy for a table, most specific first.
     *
     * TableUtils is NOT reachable from a scoped application (verified on
     * Australia patch 3, 2026-09-01: ReferenceError "TableUtils" is not defined),
     * so this walks sys_db_object.super_class, which IS readable from scope.
     *
     * @param {string} table table name
     * @returns {string[]} e.g. ['incident', 'task'] — empty if the table is unknown
     */
    getHierarchy: function (table) {
        var chain = []
        var name = table
        for (var guard = 0; guard < 20 && name; guard++) {
            var t = new GlideRecord('sys_db_object')
            t.addQuery('name', name)
            t.setLimit(1)
            t.query()
            if (!t.next()) break
            chain.push(name)
            var superId = t.getValue('super_class')
            if (!superId) break
            var parent = new GlideRecord('sys_db_object')
            name = parent.get(superId) ? parent.getValue('name') : ''
        }
        return chain
    },

    /**
     * @param {string} table
     * @param {string} ancestor
     * @returns {boolean} true if table is ancestor or extends it
     */
    extendsTable: function (table, ancestor) {
        return this.getHierarchy(table).indexOf(ancestor) > -1
    },

    /**
     * Resolve the choice list for a field, in the session language.
     *
     * Why this does not use GlideElement.getChoices(): on Australia patch 3 that
     * API returned the BASE table's list for a child table — asked for
     * incident.state it returned task's values (-5,1,2,3,4,7) rather than
     * incident's (1,2,3,6,7,8). Building lanes on it produces a board whose
     * columns do not exist on the record. Verified 2026-09-01.
     *
     * The platform's real rule is REPLACE, not merge: the most specific table in
     * the hierarchy that owns any active choice for the element supplies the
     * whole list. Merging per-value across levels invents lanes the native form
     * never offers (an incident board would sprout "Pending" and
     * "Closed Incomplete" from task).
     *
     * @param {string} table
     * @param {string} element
     * @returns {{ok: boolean, choices: Array, source: string, error: string}}
     *   choices: [{value, label, sequence}] ordered by sequence then label
     */
    getChoices: function (table, element) {
        var hierarchy = this.getHierarchy(table)
        if (!hierarchy.length) {
            return { ok: false, choices: [], source: '', error: 'Table "' + table + '" does not exist.' }
        }

        for (var i = 0; i < hierarchy.length; i++) {
            var owned = this._choicesOwnedBy(hierarchy[i], element)
            if (owned.dependent) {
                return {
                    ok: false,
                    choices: [],
                    source: hierarchy[i],
                    error:
                        'Field "' + element + '" on ' + hierarchy[i] +
                        ' is a dependent choice field. Dependent lane fields are not supported.',
                }
            }
            if (owned.choices.length) {
                return { ok: true, choices: owned.choices, source: hierarchy[i], error: '' }
            }
        }

        return {
            ok: false,
            choices: [],
            source: '',
            error: 'No active choices found for "' + element + '" anywhere in ' + hierarchy.join(' -> ') + '.',
        }
    },

    /**
     * Active choices declared directly on one table, session language, with an
     * English fallback so a partially translated instance still renders lanes.
     *
     * Dependent choice lists are detected by the presence of a dependent_value on
     * any row — sys_dictionary is not readable from a scoped app (verified
     * 2026-09-01), so its dependent_on_field cannot be consulted directly.
     *
     * @param {string} table
     * @param {string} element
     * @returns {{choices: Array, dependent: boolean}}
     */
    _choicesOwnedBy: function (table, element) {
        var choices = []
        var dependent = false
        var languages = this.language === 'en' ? ['en'] : [this.language, 'en']

        for (var l = 0; l < languages.length; l++) {
            var c = new GlideRecord('sys_choice')
            c.addQuery('name', table)
            c.addQuery('element', element)
            c.addQuery('inactive', false)
            c.addQuery('language', languages[l])
            c.orderBy('sequence')
            c.orderBy('label')
            c.setLimit(200)
            c.query()
            while (c.next()) {
                if (c.getValue('dependent_value')) dependent = true
                choices.push({
                    value: String(c.getValue('value')),
                    label: String(c.getValue('label')),
                    sequence: parseInt(c.getValue('sequence'), 10) || 0,
                })
            }
            if (choices.length) break
        }

        return { choices: choices, dependent: dependent }
    },

    /**
     * Field metadata without sys_dictionary, which a scoped app cannot read
     * (verified 2026-09-01). GlideElementDescriptor works and is translated.
     *
     * @param {GlideRecord} templateRecord an initialize()d record of the table
     * @param {string} element
     * @returns {{label: string, type: string, reference: string}|null} null if the field does not exist
     */
    describeField: function (templateRecord, element) {
        if (!element) return null

        // Existence is decided by isValidField alone. GlideElementDescriptor is
        // the "Glide API: table metadata" scriptable, which a scoped app may be
        // refused access to; treating that refusal as "field does not exist"
        // silently emptied every card and failed board load with a misleading
        // 'Lane field "state" does not exist on incident'.
        try {
            if (!templateRecord.isValidField(element)) return null
        } catch (e) {
            this._warnOnce('isValidField', 'Kanban: isValidField unavailable (' + String(e) + ')')
            // Fall through — better to render with a fallback label than to drop
            // a field the administrator explicitly configured.
        }

        var label = ''
        var type = ''
        var reference = ''

        try {
            var ed = templateRecord.getElement(element).getED()
            label = String(ed.getLabel() || '')
            type = String(ed.getInternalType() || '')
            // getReference() throws on non-reference fields, so it is guarded
            // separately rather than voiding the whole descriptor.
            try {
                if (typeof ed.getReference === 'function') reference = String(ed.getReference() || '')
            } catch (refError) {
                reference = ''
            }
        } catch (e) {
            this._warnOnce(
                'descriptor',
                'Kanban: field metadata unavailable, falling back to derived labels (' + String(e) + ')'
            )
        }

        return {
            label: label || this._humanise(element),
            type: type || 'string',
            reference: reference,
        }
    },

    /** "short_description" -> "Short description". Used when the dictionary is unreachable. */
    _humanise: function (element) {
        var text = String(element).replace(/_/g, ' ').trim()
        return text.charAt(0).toUpperCase() + text.slice(1)
    },

    /** Log a given problem once per request rather than once per field. */
    _warnOnce: function (key, message) {
        if (this._warned[key]) return
        this._warned[key] = true
        gs.warn(message)
    },

    type: 'KanbanChoiceUtil',
}
