var KanbanApi = Class.create()

KanbanApi.PREFIX = 'x_335329_sn_ktm.'

/** Service result code -> HTTP status. */
KanbanApi.STATUS = {
    bad_request: 400,
    no_access: 403,
    no_write: 403,
    not_found: 404,
    stale: 409,
    rejected: 422,
    bad_config: 500,
    internal: 500,
}

KanbanApi.prototype = {
    initialize: function () {},

    /**
     * Write a service result into the response using the single envelope every
     * endpoint shares. Never returns an empty object on failure.
     *
     * @param {*} response RESTAPIResponse
     * @param {{ok: boolean, data: object, code: string, message: string, correlation_id: string}} result
     */
    respond: function (response, result) {
        if (result && result.ok) {
            response.setStatus(200)
            response.setBody({ status: 'ok', data: result.data === undefined ? {} : result.data })
            return
        }

        var code = (result && result.code) || 'internal'
        var correlationId = (result && result.correlation_id) || gs.generateGUID()
        response.setStatus(KanbanApi.STATUS[code] || 500)
        response.setBody({
            status: 'error',
            data: (result && result.data) || {},
            error: {
                code: code,
                message: (result && result.message) || 'Something went wrong. Quote the correlation id when reporting it.',
                suggested_action: this._suggestion(code),
                correlation_id: correlationId,
            },
        })
    },

    /**
     * Run a handler, turning any thrown error into a logged, structured failure.
     * @param {*} response
     * @param {function} fn returns a service result
     */
    guard: function (response, fn) {
        try {
            this.respond(response, fn())
        } catch (e) {
            var correlationId = gs.generateGUID()
            gs.error('[' + correlationId + '] Kanban API failure: ' + (e.message || e) + ' | ' + (e.stack || ''))
            this.respond(response, {
                ok: false,
                code: 'internal',
                message: 'The board hit an unexpected error. Quote ' + correlationId + ' when reporting it.',
                correlation_id: correlationId,
            })
        }
    },

    /**
     * All Kanban preferences for the caller, namespaced.
     * @returns {{ok: boolean, data: object}}
     */
    getPreferences: function () {
        var prefs = {}
        var p = new GlideRecord('sys_user_preference')
        p.addQuery('user', gs.getUserID())
        p.addQuery('name', 'STARTSWITH', KanbanApi.PREFIX)
        p.setLimit(100)
        p.query()
        while (p.next()) {
            prefs[String(p.getValue('name')).substring(KanbanApi.PREFIX.length)] = String(p.getValue('value'))
        }
        return { ok: true, data: { preferences: prefs } }
    },

    /**
     * Persist preferences to sys_user_preference so they follow the user across
     * devices. No browser storage is used anywhere in this app.
     *
     * gs.getUser().setPreference() does not exist in a scoped app (verified on
     * Australia patch 3, 2026-09-01), so this writes the record directly.
     *
     * @param {object} pairs unprefixed key -> value
     * @returns {{ok: boolean, data: object}}
     */
    setPreferences: function (pairs) {
        if (!pairs || typeof pairs !== 'object') {
            return { ok: false, code: 'bad_request', message: 'No preferences supplied.' }
        }
        var written = 0
        for (var key in pairs) {
            if (!Object.prototype.hasOwnProperty.call(pairs, key)) continue
            if (!/^[A-Za-z0-9_.-]{1,120}$/.test(key)) continue
            var name = KanbanApi.PREFIX + key
            var value = String(pairs[key] == null ? '' : pairs[key]).substring(0, 500)

            var p = new GlideRecord('sys_user_preference')
            p.addQuery('user', gs.getUserID())
            p.addQuery('name', name)
            p.setLimit(1)
            p.query()
            if (p.next()) {
                p.setValue('value', value)
                p.update()
            } else {
                p.initialize()
                p.setValue('user', gs.getUserID())
                p.setValue('name', name)
                p.setValue('value', value)
                p.insert()
            }
            written++
        }
        return { ok: true, data: { written: written } }
    },

    _suggestion: function (code) {
        switch (code) {
            case 'no_access':
                return 'Ask an administrator for access to this board or table.'
            case 'no_write':
                return 'Open the record in the platform to see who can change it.'
            case 'not_found':
                return 'Refresh the board — the record or board may have been removed.'
            case 'stale':
                return 'Review the refreshed card, then try again.'
            case 'rejected':
                return 'Open the record and complete whatever the platform is asking for.'
            case 'bad_config':
                return 'A Kanban administrator needs to correct this board\'s configuration.'
            case 'bad_request':
                return 'Correct the request and try again.'
            default:
                return 'Try again. If it keeps happening, quote the correlation id to support.'
        }
    },

    type: 'KanbanApi',
}
