var KanbanApi = Class.create()

/** Single namespaced preference holding a JSON object of all board settings. */
KanbanApi.PREF_KEY = 'x_335329_sn_ktm.prefs'

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
     * All Kanban preferences for the caller.
     *
     * Everything lives in ONE preference holding a JSON object, because the
     * scoped API can only get and set a preference by name — it cannot enumerate
     * them, and writing sys_user_preference directly is impossible (see
     * setPreferences).
     *
     * @returns {{ok: boolean, data: object}}
     */
    getPreferences: function () {
        var raw = ''
        try {
            raw = String(gs.getUser().getPreference(KanbanApi.PREF_KEY) || '')
        } catch (e) {
            raw = ''
        }
        if (!raw) return { ok: true, data: { preferences: {} } }

        try {
            var parsed = JSON.parse(raw)
            return { ok: true, data: { preferences: parsed && typeof parsed === 'object' ? parsed : {} } }
        } catch (e) {
            gs.warn('Kanban: discarding unparseable user preference blob for ' + gs.getUserName())
            return { ok: true, data: { preferences: {} } }
        }
    },

    /**
     * Persist preferences so they follow the user across devices. No browser
     * storage is used anywhere in this app.
     *
     * Writing sys_user_preference with GlideRecord does NOT work from a scoped
     * app: the platform refuses setValue on user/name/value under its cross-scope
     * access policy, and a "Sync System Preference" business rule aborts the
     * operation — while insert() still reports success (verified on Australia
     * patch 3, 2026-09-01). gs.getUser().savePreference() is the supported path.
     *
     * @param {object} pairs unprefixed key -> value; merged over what is stored
     * @returns {{ok: boolean, data: object}}
     */
    setPreferences: function (pairs) {
        if (!pairs || typeof pairs !== 'object') {
            return { ok: false, code: 'bad_request', message: 'No preferences supplied.' }
        }

        var current = this.getPreferences().data.preferences
        var written = 0
        for (var key in pairs) {
            if (!Object.prototype.hasOwnProperty.call(pairs, key)) continue
            if (!/^[A-Za-z0-9_.-]{1,120}$/.test(key)) continue
            current[key] = String(pairs[key] == null ? '' : pairs[key]).substring(0, 500)
            written++
        }

        var blob = JSON.stringify(current)
        if (blob.length > 8000) {
            return { ok: false, code: 'bad_request', message: 'Too many preferences stored for this board.' }
        }

        var user = gs.getUser()
        if (typeof user.savePreference !== 'function') {
            return {
                ok: false,
                code: 'internal',
                message: 'Preferences cannot be saved on this instance.',
            }
        }
        user.savePreference(KanbanApi.PREF_KEY, blob)

        // Confirm rather than assume — the direct-write path used to report
        // success while the platform silently discarded everything.
        var readBack = this.getPreferences().data.preferences
        var confirmed = true
        for (var check in pairs) {
            if (!Object.prototype.hasOwnProperty.call(pairs, check)) continue
            if (!/^[A-Za-z0-9_.-]{1,120}$/.test(check)) continue
            if (readBack[check] !== current[check]) confirmed = false
        }
        if (!confirmed) {
            var correlationId = gs.generateGUID()
            gs.error('[' + correlationId + '] Kanban: preference write did not persist for ' + gs.getUserName())
            return {
                ok: false,
                code: 'internal',
                message: 'Your preference could not be saved.',
                correlation_id: correlationId,
            }
        }

        return { ok: true, data: { written: written } }
    },

    /**
     * Appearance settings from system properties, so an administrator can
     * rebrand the board from /system_properties_ui.do?sysparm_category=Kanban
     * without a deploy. Every value is validated here rather than trusted by
     * the client — a property is free text an admin can mistype.
     *
     * @returns {{ok: boolean, data: object}}
     */
    getSettings: function () {
        var theme = gs.getProperty('x_335329_sn_ktm.default_theme', 'system')
        if (['system', 'light', 'dark'].indexOf(theme) === -1) theme = 'system'

        var density = gs.getProperty('x_335329_sn_ktm.density', 'comfortable')
        if (['comfortable', 'compact'].indexOf(density) === -1) density = 'comfortable'

        var laneWidth = parseInt(gs.getProperty('x_335329_sn_ktm.lane_width', '288'), 10)
        if (isNaN(laneWidth)) laneWidth = 288
        laneWidth = Math.max(200, Math.min(560, laneWidth))

        var chip = String(gs.getProperty('x_335329_sn_ktm.show_table_chip', 'true'))

        return {
            ok: true,
            data: {
                title: String(gs.getProperty('x_335329_sn_ktm.title', 'Kanban') || 'Kanban').substring(0, 60),
                accent: this._colour(gs.getProperty('x_335329_sn_ktm.accent', ''), '#635fc7'),
                accent_dark: this._colour(gs.getProperty('x_335329_sn_ktm.accent_dark', ''), '#7b77e0'),
                default_theme: theme,
                lane_width: laneWidth,
                show_table_chip: chip === 'true' || chip === '1',
                density: density,
            },
        }
    },

    /**
     * Accept only colours that cannot break out of a CSS custom property.
     * Hex, rgb()/rgba(), hsl()/hsla() and plain colour keywords.
     *
     * @param {string} value
     * @param {string} fallback
     * @returns {string}
     */
    _colour: function (value, fallback) {
        var v = String(value || '').trim()
        if (!v) return fallback
        var ok =
            /^#[0-9a-f]{3}$/i.test(v) ||
            /^#[0-9a-f]{6}$/i.test(v) ||
            /^#[0-9a-f]{8}$/i.test(v) ||
            /^rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*(,\s*[\d.]+\s*)?\)$/i.test(v) ||
            /^hsla?\(\s*[\d.]+\s*,\s*[\d.]+%\s*,\s*[\d.]+%\s*(,\s*[\d.]+\s*)?\)$/i.test(v) ||
            /^[a-z]{3,20}$/i.test(v)
        if (!ok) {
            gs.warn('Kanban: ignoring unusable colour property value "' + v + '"')
            return fallback
        }
        return v
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
