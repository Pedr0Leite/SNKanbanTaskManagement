import '@servicenow/sdk/global'
import { BusinessRule, RestApi, ScriptInclude } from '@servicenow/sdk/core'

ScriptInclude({
    $id: Now.ID['si-choice-util'],
    name: 'KanbanChoiceUtil',
    description: 'Table hierarchy walking and choice-list resolution for Kanban lanes.',
    script: Now.include('../server/KanbanChoiceUtil.js'),
    accessibleFrom: 'package_private',
    active: true,
})

ScriptInclude({
    $id: Now.ID['si-board-service'],
    name: 'KanbanBoardService',
    description: 'Board contract, lane resolution and ACL-safe card queries.',
    script: Now.include('../server/KanbanBoardService.js'),
    accessibleFrom: 'package_private',
    active: true,
})

ScriptInclude({
    $id: Now.ID['si-record-service'],
    name: 'KanbanRecordService',
    description: 'Record detail, verified lane moves and journal writes.',
    script: Now.include('../server/KanbanRecordService.js'),
    accessibleFrom: 'package_private',
    active: true,
})

ScriptInclude({
    $id: Now.ID['si-admin-service'],
    name: 'KanbanAdminService',
    description: 'Board authoring: table discovery, field discovery and board creation.',
    script: Now.include('../server/KanbanAdminService.js'),
    accessibleFrom: 'package_private',
    active: true,
})

ScriptInclude({
    $id: Now.ID['si-api'],
    name: 'KanbanApi',
    description: 'Response envelope, error mapping and user preference storage.',
    script: Now.include('../server/KanbanApi.js'),
    accessibleFrom: 'package_private',
    active: true,
})

/**
 * Refuse a board configured against anything that is not a child of task, or a
 * lane field that has no resolvable choices. A board that renders the wrong
 * columns is worse than a board that refuses to save.
 */
BusinessRule({
    $id: Now.ID['br-validate-board'],
    name: 'Kanban board must extend task',
    table: 'x_335329_sn_ktm_board',
    when: 'before',
    action: ['insert', 'update'],
    order: 100,
    active: true,
    description: 'Validates table extends task and the lane field resolves to a choice list.',
    script: `(function executeRule(current, previous) {
    var util = new KanbanChoiceUtil();
    var table = current.getValue('table');

    if (!table) {
        gs.addErrorMessage(gs.getMessage('Choose a table for this board.'));
        current.setAbortAction(true);
        return;
    }

    if (!util.extendsTable(table, 'task')) {
        gs.addErrorMessage(gs.getMessage(
            'Table "{0}" does not extend task, so it cannot be used as a Kanban board.', table));
        current.setAbortAction(true);
        return;
    }

    var laneField = current.getValue('lane_field');
    var resolved = util.getChoices(table, laneField);
    if (!resolved.ok) {
        gs.addErrorMessage(gs.getMessage('Lane field is not usable: {0}', resolved.error));
        current.setAbortAction(true);
        return;
    }

    var titleField = current.getValue('card_title_field');
    var template = new GlideRecord(table);
    template.initialize();
    if (titleField && !util.describeField(template, titleField)) {
        gs.addErrorMessage(gs.getMessage('Card title field "{0}" does not exist on {1}.', [titleField, table]));
        current.setAbortAction(true);
    }
})(current, previous);`,
})

RestApi({
    $id: Now.ID['rest-kanban'],
    name: 'Kanban',
    serviceId: 'kanban',
    active: true,
    produces: 'application/json',
    consumes: 'application/json',
    shortDescription: 'Configuration-driven Kanban board API.',
    versions: [{ $id: Now.ID['rest-kanban-v1'], version: 1, isDefault: true, active: true }],
    routes: [
        {
            $id: Now.ID['route-boards'],
            name: 'List boards',
            method: 'GET',
            path: '/boards',
            version: 1,
            shortDescription: 'Boards the caller may open.',
            script: `(function (request, response) {
    var api = new KanbanApi();
    api.guard(response, function () {
        return { ok: true, data: { boards: new KanbanBoardService().getBoards() } };
    });
})(request, response);`,
        },
        {
            $id: Now.ID['route-board'],
            name: 'Get board',
            method: 'GET',
            path: '/board/{boardId}',
            version: 1,
            shortDescription: 'Board contract: lanes, field definitions, journal config, capabilities.',
            script: `(function (request, response) {
    var api = new KanbanApi();
    api.guard(response, function () {
        return new KanbanBoardService().getBoard(request.pathParams.boardId);
    });
})(request, response);`,
        },
        {
            $id: Now.ID['route-cards'],
            name: 'Get cards',
            method: 'GET',
            path: '/board/{boardId}/cards',
            version: 1,
            shortDescription: 'Cards for a board, ACL filtered and capped server-side.',
            script: `(function (request, response) {
    var api = new KanbanApi();
    api.guard(response, function () {
        var q = request.queryParams || {};
        var first = function (key) {
            var v = q[key];
            if (v === undefined || v === null) return '';
            return String(Array.isArray(v) ? (v[0] || '') : v);
        };
        return new KanbanBoardService().getCards(request.pathParams.boardId, {
            filter: first('filter'),
            search: first('search'),
            assigned_to_me: first('assigned_to_me') === 'true'
        });
    });
})(request, response);`,
        },
        {
            $id: Now.ID['route-record'],
            name: 'Get record',
            method: 'GET',
            path: '/record/{table}/{sysId}',
            version: 1,
            shortDescription: 'Modal payload: configured fields plus the activity stream.',
            script: `(function (request, response) {
    var api = new KanbanApi();
    api.guard(response, function () {
        var q = request.queryParams || {};
        var board = q.board;
        if (Array.isArray(board)) board = board[0];
        return new KanbanRecordService().getRecord(
            String(board || ''), request.pathParams.table, request.pathParams.sysId);
    });
})(request, response);`,
        },
        {
            $id: Now.ID['route-lane'],
            name: 'Move lane',
            method: 'PATCH',
            path: '/record/{table}/{sysId}/lane',
            version: 1,
            shortDescription: 'Move a record to another lane, with optimistic concurrency.',
            script: `(function (request, response) {
    var api = new KanbanApi();
    api.guard(response, function () {
        var body = request.body ? request.body.data : {};
        body = body || {};
        return new KanbanRecordService().moveLane(
            String(body.board || ''),
            request.pathParams.table,
            request.pathParams.sysId,
            String(body.to_lane === undefined ? '' : body.to_lane),
            String(body.expected_updated_on || '')
        );
    });
})(request, response);`,
        },
        {
            $id: Now.ID['route-journal'],
            name: 'Add journal entry',
            method: 'POST',
            path: '/record/{table}/{sysId}/journal',
            version: 1,
            shortDescription: 'Append a comment or work note through GlideRecord.update().',
            script: `(function (request, response) {
    var api = new KanbanApi();
    api.guard(response, function () {
        var body = request.body ? request.body.data : {};
        body = body || {};
        return new KanbanRecordService().addJournal(
            String(body.board || ''),
            request.pathParams.table,
            request.pathParams.sysId,
            String(body.field || ''),
            body.value
        );
    });
})(request, response);`,
        },
        {
            $id: Now.ID['route-tables'],
            name: 'List task tables',
            method: 'GET',
            path: '/tables',
            version: 1,
            shortDescription: 'Every table that extends task, for the board creation picker.',
            script: `(function (request, response) {
    var api = new KanbanApi();
    api.guard(response, function () { return new KanbanAdminService().listTaskTables(); });
})(request, response);`,
        },
        {
            $id: Now.ID['route-fields'],
            name: 'List table fields',
            method: 'GET',
            path: '/tables/{table}/fields',
            version: 1,
            shortDescription: 'Displayable fields on a task child, for board configuration.',
            script: `(function (request, response) {
    var api = new KanbanApi();
    api.guard(response, function () {
        return new KanbanAdminService().listFields(request.pathParams.table);
    });
})(request, response);`,
        },
        {
            $id: Now.ID['route-create-board'],
            name: 'Create board',
            method: 'POST',
            path: '/boards',
            version: 1,
            shortDescription: 'Create a board over any table that extends task.',
            script: `(function (request, response) {
    var api = new KanbanApi();
    api.guard(response, function () {
        var body = request.body ? request.body.data : {};
        return new KanbanAdminService().createBoard(body || {});
    });
})(request, response);`,
        },
        {
            $id: Now.ID['route-journal-page'],
            name: 'Get activity page',
            method: 'GET',
            path: '/record/{table}/{sysId}/journal',
            version: 1,
            shortDescription: 'A page of the activity stream, for loading older entries.',
            script: `(function (request, response) {
    var api = new KanbanApi();
    api.guard(response, function () {
        var q = request.queryParams || {};
        var first = function (key) {
            var v = q[key];
            if (v === undefined || v === null) return '';
            return String(Array.isArray(v) ? (v[0] || '') : v);
        };
        return new KanbanRecordService().getJournalPage(
            first('board'), request.pathParams.table, request.pathParams.sysId, first('offset'));
    });
})(request, response);`,
        },
        {
            $id: Now.ID['route-settings'],
            name: 'Get settings',
            method: 'GET',
            path: '/settings',
            version: 1,
            shortDescription: 'Appearance settings from the Kanban system properties.',
            script: `(function (request, response) {
    var api = new KanbanApi();
    api.guard(response, function () { return api.getSettings(); });
})(request, response);`,
        },
        {
            $id: Now.ID['route-prefs-get'],
            name: 'Get preferences',
            method: 'GET',
            path: '/preferences',
            version: 1,
            shortDescription: 'Namespaced user preferences (theme, collapsed lanes).',
            script: `(function (request, response) {
    var api = new KanbanApi();
    api.guard(response, function () { return api.getPreferences(); });
})(request, response);`,
        },
        {
            $id: Now.ID['route-prefs-put'],
            name: 'Set preferences',
            method: 'PUT',
            path: '/preferences',
            version: 1,
            shortDescription: 'Persist user preferences to sys_user_preference.',
            script: `(function (request, response) {
    var api = new KanbanApi();
    api.guard(response, function () {
        var body = request.body ? request.body.data : {};
        return api.setPreferences((body && body.preferences) || {});
    });
})(request, response);`,
        },
    ],
})
