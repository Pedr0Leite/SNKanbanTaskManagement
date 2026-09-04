import '@servicenow/sdk/global'
import { Record } from '@servicenow/sdk/core'

// THROWAWAY — end-to-end verification of the server stack. Deleted once green.
// Read back with:
//   now-sdk query syslog -q "messageLIKEKANBAN_VERIFY^ORDERBYDESCsys_created_on"

const script = `
(function () {
    var out = function (key, obj) { gs.info('KANBAN_VERIFY|' + key + '|' + JSON.stringify(obj)); };
    var attempt = function (key, fn) {
        try { out(key, fn()); } catch (e) { out(key, { ERROR: String(e), stack: String(e.stack || '') }); }
    };

    var boardId = '';
    var table = '';
    var firstCardId = '';

    attempt('1_getBoards', function () {
        var boards = new KanbanBoardService().getBoards();
        if (boards.length) { boardId = boards[0].sys_id; table = boards[0].table; }
        return { count: boards.length, boards: boards };
    });

    attempt('2_getBoard', function () {
        var r = new KanbanBoardService().getBoard(boardId);
        if (!r.ok) return { ok: false, code: r.code, message: r.message };
        return {
            ok: true,
            name: r.data.name,
            table: r.data.table,
            lane_field: r.data.lane_field,
            lanes: r.data.lanes,
            card_fields: r.data.card_fields.map(function (f) { return f.name + '/' + f.label + '/' + f.display_as; }),
            modal_fields: r.data.modal_fields.length,
            journal: r.data.journal,
            capabilities: r.data.capabilities
        };
    });

    attempt('3_getCards', function () {
        var r = new KanbanBoardService().getCards(boardId, {});
        if (!r.ok) return { ok: false, code: r.code, message: r.message };
        if (r.data.cards.length) firstCardId = r.data.cards[0].sys_id;
        return {
            ok: true,
            count: r.data.cards.length,
            capped: r.data.capped,
            counts: r.data.counts,
            sample: r.data.cards.slice(0, 2)
        };
    });

    attempt('4_getCards_search', function () {
        var r = new KanbanBoardService().getCards(boardId, { search: 'a' });
        return r.ok ? { ok: true, count: r.data.cards.length } : { ok: false, code: r.code, message: r.message };
    });

    attempt('5_getCards_assignedToMe', function () {
        var r = new KanbanBoardService().getCards(boardId, { assigned_to_me: true });
        return r.ok ? { ok: true, count: r.data.cards.length } : { ok: false, code: r.code, message: r.message };
    });

    attempt('6_getRecord', function () {
        if (!firstCardId) return { skipped: 'no cards' };
        var r = new KanbanRecordService().getRecord(boardId, table, firstCardId);
        if (!r.ok) return { ok: false, code: r.code, message: r.message };
        return {
            ok: true,
            title: r.data.title,
            can_write: r.data.can_write,
            fields: r.data.fields.length,
            journal_entries: r.data.journal.length,
            first_entry: r.data.journal[0] || null
        };
    });

    attempt('7_preferences', function () {
        var api = new KanbanApi();
        var write = api.setPreferences({ theme: 'dark', sidebar: 'shown' });
        var read = api.getPreferences();
        return { write: write, read: read.data.preferences };
    });

    attempt('8_moveLane_roundtrip', function () {
        if (!firstCardId) return { skipped: 'no cards' };
        var svc = new KanbanRecordService();
        var board = new GlideRecord('x_335329_sn_ktm_board');
        board.get(boardId);
        var laneField = board.getValue('lane_field');

        var rec = new GlideRecord(table);
        rec.get(firstCardId);
        var original = String(rec.getValue(laneField));
        var updatedOn = String(rec.getValue('sys_updated_on'));

        var lanes = new KanbanBoardService()._resolveLanes(board, table, laneField);
        var target = '';
        for (var i = 0; i < lanes.lanes.length; i++) {
            if (lanes.lanes[i].value !== original) { target = lanes.lanes[i].value; break; }
        }
        if (!target) return { skipped: 'no alternate lane' };

        var moved = svc.moveLane(boardId, table, firstCardId, target, updatedOn);
        var after = new GlideRecord(table);
        after.get(firstCardId);
        var landed = String(after.getValue(laneField));

        var restored = 'not attempted';
        if (landed === target) {
            var back = svc.moveLane(boardId, table, firstCardId, original, String(after.getValue('sys_updated_on')));
            restored = back.ok ? 'ok' : (back.code + ': ' + back.message);
        }

        return {
            original: original,
            target: target,
            moveResult: moved.ok ? 'ok' : (moved.code + ': ' + moved.message),
            landed: landed,
            writeActuallyWorks: landed === target,
            restored: restored
        };
    });

    attempt('9_staleToken', function () {
        if (!firstCardId) return { skipped: 'no cards' };
        var r = new KanbanRecordService().moveLane(boardId, table, firstCardId, '1', '2000-01-01 00:00:00');
        return { code: r.ok ? 'ok(unexpected)' : r.code, message: r.message || '' };
    });

    attempt('10_badLane', function () {
        if (!firstCardId) return { skipped: 'no cards' };
        var r = new KanbanRecordService().moveLane(boardId, table, firstCardId, 'not-a-lane', '');
        return { code: r.ok ? 'ok(unexpected)' : r.code, message: r.message || '' };
    });

    attempt('11_hiddenLaneRejected', function () {
        if (!firstCardId) return { skipped: 'no cards' };
        // '8' (Cancelled) is seeded hidden, so it must be refused as a target.
        var r = new KanbanRecordService().moveLane(boardId, table, firstCardId, '8', '');
        return { code: r.ok ? 'ok(LEAK - hidden lane accepted)' : r.code, message: r.message || '' };
    });

    attempt('12_wrongTable', function () {
        if (!firstCardId) return { skipped: 'no cards' };
        var r = new KanbanRecordService().getRecord(boardId, 'sys_user', firstCardId);
        return { code: r.ok ? 'ok(unexpected)' : r.code, message: r.message || '' };
    });

    attempt('13_journalWrite', function () {
        if (!firstCardId) return { skipped: 'no cards' };
        var r = new KanbanRecordService().addJournal(
            boardId, table, firstCardId, 'comments', 'KANBAN_VERIFY test comment');
        return r.ok
            ? { ok: true, entry: r.data.entry }
            : { ok: false, code: r.code, message: r.message };
    });

    attempt('14_journalEmptyRejected', function () {
        if (!firstCardId) return { skipped: 'no cards' };
        var r = new KanbanRecordService().addJournal(boardId, table, firstCardId, 'comments', '   ');
        return { code: r.ok ? 'ok(unexpected)' : r.code, message: r.message || '' };
    });

    attempt('15_choiceResolution', function () {
        var util = new KanbanChoiceUtil();
        return {
            hierarchy: util.getHierarchy(table),
            extendsTask: util.extendsTable(table, 'task'),
            extendsTaskForSysUser: util.extendsTable('sys_user', 'task'),
            choices: util.getChoices(table, 'state')
        };
    });

    attempt('16_settings', function () {
        return new KanbanApi().getSettings();
    });

    attempt('17_laneOverridesApplied', function () {
        var board = new GlideRecord('x_335329_sn_ktm_board');
        board.get(boardId);
        var lanes = new KanbanBoardService()._resolveLanes(board, table, board.getValue('lane_field'));
        return {
            ok: lanes.ok,
            lanes: lanes.lanes,
            hiddenLaneAbsent: lanes.ok && lanes.lanes.filter(function (l) { return l.value === '8'; }).length === 0,
            accentsApplied: lanes.ok && lanes.lanes.filter(function (l) { return !!l.accent; }).length
        };
    });

    // Test 11 in the previous run moved INC0007001 to Canceled before hidden-lane
    // filtering worked. Put it back where it started.
    attempt('18_restoreDemoRecord', function () {
        var inc = new GlideRecord('incident');
        if (!inc.get('f12ca184735123002728660c4cf6a7ef')) return { skipped: 'not found' };
        var was = String(inc.getValue('state'));
        if (was === '1') return { alreadyCorrect: true };
        inc.setValue('state', '1');
        inc.setValue('active', true);
        inc.update();
        var check = new GlideRecord('incident');
        check.get('f12ca184735123002728660c4cf6a7ef');
        return { was: was, now: String(check.getValue('state')) };
    });

    attempt('19_journalOptionsOnRecord', function () {
        if (!firstCardId) return { skipped: 'no cards' };
        var r = new KanbanRecordService().getRecord(boardId, table, firstCardId);
        if (!r.ok) return { ok: false, code: r.code, message: r.message };
        return {
            record_can_write: r.data.can_write,
            journal_options: r.data.journal_options,
            composeWouldShow: (r.data.journal_options || []).filter(function (o) { return o.can_write; }).length > 0
        };
    });

    attempt('20_boardAuthoring', function () {
        var admin = new KanbanAdminService();
        var tables = admin.listTaskTables();
        var fieldsResult = admin.listFields('sc_task');
        var choices = admin.fieldChoices('sc_task', 'state');

        // Create a throwaway board, prove it renders, then remove it.
        var created = admin.createBoard({
            name: 'KANBAN_VERIFY temp board',
            table: 'sc_task',
            lane_field: 'state',
            filter: '',
            card_title_field: 'number',
            card_subtitle_field: 'short_description',
            journal_field: 'comments',
            allow_journal_choice: true,
            card_fields: ['priority'],
            modal_fields: ['priority']
        });

        var rendered = null;
        if (created.ok) {
            var check = new KanbanBoardService().getBoard(created.data.sys_id);
            rendered = check.ok
                ? { lanes: check.data.lanes.length, card_fields: check.data.card_fields.length }
                : { error: check.code + ': ' + check.message };

            var cleanupFields = new GlideRecord('x_335329_sn_ktm_field');
            cleanupFields.addQuery('board', created.data.sys_id);
            cleanupFields.deleteMultiple();
            var cleanup = new GlideRecord('x_335329_sn_ktm_board');
            if (cleanup.get(created.data.sys_id)) cleanup.deleteRecord();
        }

        return {
            tableCount: tables.ok ? tables.data.tables.length : ('ERR ' + tables.message),
            scTaskFields: fieldsResult.ok ? fieldsResult.data.fields.length : ('ERR ' + fieldsResult.message),
            scTaskLaneChoices: choices.ok ? choices.data.choices.length : ('ERR ' + choices.message),
            created: created.ok ? created.data : (created.code + ': ' + created.message),
            renderedAfterCreate: rendered,
            cleanedUp: created.ok
        };
    });

    out('zz_done', { at: new GlideDateTime().getDisplayValue() });
})();
`

Record({
    $id: Now.ID['kanban-verify'],
    table: 'sys_script_fix',
    data: {
        name: 'KANBAN_VERIFY',
        description: 'Throwaway end-to-end verification of the Kanban server stack.',
        unloadable: false,
        script: script,
    },
})
