import '@servicenow/sdk/global'
import { CrossScopePrivilege } from '@servicenow/sdk/core'

/**
 * Cross-scope privileges.
 *
 * A scoped app reaching Global tables and APIs needs these. An INTERACTIVE
 * admin session auto-grants them on first use and quietly records the grant,
 * which is why the board worked from a Fix Script but returned nothing over
 * REST — a REST transaction is refused instead of auto-granted.
 *
 * Granted-at-runtime records live outside the application, so they are lost on
 * reinstall and never travel to another instance. Declaring them here makes
 * them app metadata.
 *
 * NOTE FOR ADMINISTRATORS: the board table entries below cover `task` and the
 * seeded `incident` board. Pointing a board at a different Task child needs a
 * matching read/write pair for that table. See docs/CONFIG.md.
 */

// ---- Platform tables the board reads --------------------------------------

CrossScopePrivilege({
    $id: Now.ID['xs-sys-db-object-read'],
    targetName: 'sys_db_object',
    targetType: 'sys_db_object',
    targetScope: 'global',
    operation: 'read',
    status: 'allowed',
})

CrossScopePrivilege({
    $id: Now.ID['xs-sys-choice-read'],
    targetName: 'sys_choice',
    targetType: 'sys_db_object',
    targetScope: 'global',
    operation: 'read',
    status: 'allowed',
})

CrossScopePrivilege({
    $id: Now.ID['xs-sys-journal-read'],
    targetName: 'sys_journal_field',
    targetType: 'sys_db_object',
    targetScope: 'global',
    operation: 'read',
    status: 'allowed',
})

// Field discovery for board authoring reads the dictionary directly.
CrossScopePrivilege({
    $id: Now.ID['xs-sys-dictionary-read'],
    targetName: 'sys_dictionary',
    targetType: 'sys_db_object',
    targetScope: 'global',
    operation: 'read',
    status: 'allowed',
})

CrossScopePrivilege({
    $id: Now.ID['xs-sys-user-read'],
    targetName: 'sys_user',
    targetType: 'sys_db_object',
    targetScope: 'global',
    operation: 'read',
    status: 'allowed',
})

CrossScopePrivilege({
    $id: Now.ID['xs-sys-user-role-read'],
    targetName: 'sys_user_role',
    targetType: 'sys_db_object',
    targetScope: 'global',
    operation: 'read',
    status: 'allowed',
})

// ---- Board tables ----------------------------------------------------------

CrossScopePrivilege({
    $id: Now.ID['xs-task-read'],
    targetName: 'task',
    targetType: 'sys_db_object',
    targetScope: 'global',
    operation: 'read',
    status: 'allowed',
})

CrossScopePrivilege({
    $id: Now.ID['xs-task-write'],
    targetName: 'task',
    targetType: 'sys_db_object',
    targetScope: 'global',
    operation: 'write',
    status: 'allowed',
})

CrossScopePrivilege({
    $id: Now.ID['xs-incident-read'],
    targetName: 'incident',
    targetType: 'sys_db_object',
    targetScope: 'global',
    operation: 'read',
    status: 'allowed',
})

CrossScopePrivilege({
    $id: Now.ID['xs-incident-write'],
    targetName: 'incident',
    targetType: 'sys_db_object',
    targetScope: 'global',
    operation: 'write',
    status: 'allowed',
})

// Added for the Case board created on this instance. Every new board table
// needs a pair like this — see docs/CONFIG.md.

CrossScopePrivilege({
    $id: Now.ID['xs-case-read'],
    targetName: 'sn_customerservice_case',
    targetType: 'sys_db_object',
    targetScope: 'global',
    operation: 'read',
    status: 'allowed',
})

CrossScopePrivilege({
    $id: Now.ID['xs-case-write'],
    targetName: 'sn_customerservice_case',
    targetType: 'sys_db_object',
    targetScope: 'global',
    operation: 'write',
    status: 'allowed',
})

// ---- Scriptable APIs -------------------------------------------------------

CrossScopePrivilege({
    $id: Now.ID['xs-api-table-metadata'],
    targetName: 'Glide API: table metadata',
    targetType: 'scriptable',
    targetScope: 'global',
    operation: 'execute',
    status: 'allowed',
})

CrossScopePrivilege({
    $id: Now.ID['xs-api-string-utils'],
    targetName: 'Glide API: string utilities',
    targetType: 'scriptable',
    targetScope: 'global',
    operation: 'execute',
    status: 'allowed',
})

CrossScopePrivilege({
    $id: Now.ID['xs-api-properties'],
    targetName: 'Glide API: properties',
    targetType: 'scriptable',
    targetScope: 'global',
    operation: 'execute',
    status: 'allowed',
})

CrossScopePrivilege({
    $id: Now.ID['xs-grs-getvalue'],
    targetName: 'GlideRecordSecure.getValue',
    targetType: 'scriptable',
    targetScope: 'global',
    operation: 'execute',
    status: 'allowed',
})

CrossScopePrivilege({
    $id: Now.ID['xs-grs-addencodedquery'],
    targetName: 'GlideRecordSecure.addEncodedQuery',
    targetType: 'scriptable',
    targetScope: 'global',
    operation: 'execute',
    status: 'allowed',
})

CrossScopePrivilege({
    $id: Now.ID['xs-grs-orderby'],
    targetName: 'GlideRecordSecure.orderBy',
    targetType: 'scriptable',
    targetScope: 'global',
    operation: 'execute',
    status: 'allowed',
})

// The Scripted REST response builder itself — without these every endpoint
// fails to write its body, which looks exactly like a dead API.

CrossScopePrivilege({
    $id: Now.ID['xs-result-setbody'],
    targetName: 'ScriptableServiceResultBuilder.setBody',
    targetType: 'scriptable',
    targetScope: 'global',
    operation: 'execute',
    status: 'allowed',
})

CrossScopePrivilege({
    $id: Now.ID['xs-result-setstatus'],
    targetName: 'ScriptableServiceResultBuilder.setStatus',
    targetType: 'scriptable',
    targetScope: 'global',
    operation: 'execute',
    status: 'allowed',
})

// GlideRecordSecure methods are fenced separately from GlideRecord ones.
// Writes go through GlideRecord for exactly that reason, but the read side
// still needs these.

CrossScopePrivilege({
    $id: Now.ID['xs-grs-setvalue'],
    targetName: 'GlideRecordSecure.setValue',
    targetType: 'scriptable',
    targetScope: 'global',
    operation: 'execute',
    status: 'allowed',
})

CrossScopePrivilege({
    $id: Now.ID['xs-grs-update'],
    targetName: 'GlideRecordSecure.update',
    targetType: 'scriptable',
    targetScope: 'global',
    operation: 'execute',
    status: 'allowed',
})

CrossScopePrivilege({
    $id: Now.ID['xs-grs-getdisplayvalue'],
    targetName: 'GlideRecordSecure.getDisplayValue',
    targetType: 'scriptable',
    targetScope: 'global',
    operation: 'execute',
    status: 'allowed',
})

CrossScopePrivilege({
    $id: Now.ID['xs-scoped-gliderecord'],
    targetName: 'ScopedGlideRecord',
    targetType: 'scriptable',
    targetScope: 'global',
    operation: 'execute',
    status: 'allowed',
})

CrossScopePrivilege({
    $id: Now.ID['xs-scoped-glideelement'],
    targetName: 'ScopedGlideElement',
    targetType: 'scriptable',
    targetScope: 'global',
    operation: 'execute',
    status: 'allowed',
})

CrossScopePrivilege({
    $id: Now.ID['xs-gr-setvalue'],
    targetName: 'GlideRecord.setValue',
    targetType: 'scriptable',
    targetScope: 'global',
    operation: 'execute',
    status: 'allowed',
})

CrossScopePrivilege({
    $id: Now.ID['xs-gr-update'],
    targetName: 'GlideRecord.update',
    targetType: 'scriptable',
    targetScope: 'global',
    operation: 'execute',
    status: 'allowed',
})
