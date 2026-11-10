
import assert from 'node:assert/strict';
import { createDatabase } from '../src/database.js';

const database = createDatabase(':memory:');

const insertUser = database.prepare(`
    INSERT INTO users (username, password_hash)
    VALUES (?, ?)
`);

const isaacId = Number(insertUser.run('Isaac', 'hash-isaac').lastInsertRowid);
const tassiaId = Number(insertUser.run('Tassia', 'hash-tassia').lastInsertRowid);

assert.throws(
    () => insertUser.run('isaac', 'outro-hash'),
    undefined,
    'O nome de usuário deve ser único sem diferenciar maiúsculas.'
);

const groupId = Number(database.prepare(`
    INSERT INTO groups (name, invite_code, created_by)
    VALUES (?, ?, ?)
`).run('Projeto de Extensão', 'ABC12345', isaacId).lastInsertRowid);

const insertMember = database.prepare(`
    INSERT INTO group_members (group_id, user_id)
    VALUES (?, ?)
`);

insertMember.run(groupId, isaacId);
insertMember.run(groupId, tassiaId);

assert.throws(
    () => insertMember.run(groupId, tassiaId),
    undefined,
    'Um usuário não pode participar duas vezes do mesmo grupo.'
);

const taskId = Number(database.prepare(`
    INSERT INTO tasks (group_id, title, created_by)
    VALUES (?, ?, ?)
`).run(groupId, 'Documentar o banco de dados', isaacId).lastInsertRowid);

const insertAssignee = database.prepare(`
    INSERT INTO task_assignees (task_id, group_id, user_id)
    VALUES (?, ?, ?)
`);

insertAssignee.run(taskId, groupId, isaacId);
insertAssignee.run(taskId, groupId, tassiaId);

assert.throws(
    () => insertAssignee.run(taskId, groupId, tassiaId),
    undefined,
    'Um integrante não pode ser atribuído duas vezes à mesma tarefa.'
);

const outroUsuarioId = Number(insertUser.run(
    'OutroUsuario',
    'hash-outro'
).lastInsertRowid);

assert.throws(
    () => insertAssignee.run(taskId, groupId, outroUsuarioId),
    undefined,
    'Não deve ser possível atribuir tarefa a integrante de outro grupo.'
);

database.prepare(`
    UPDATE tasks
    SET is_completed = 1, completed_at = CURRENT_TIMESTAMP
    WHERE id = ?
`).run(taskId);

const task = database.prepare(`
    SELECT title, is_completed, completed_at
    FROM tasks
    WHERE id = ?
`).get(taskId);

assert.equal(task.title, 'Documentar o banco de dados');
assert.equal(task.is_completed, 1);
assert.ok(task.completed_at);

assert.throws(
    () => database.prepare(`
        INSERT INTO tasks (group_id, title, created_by)
        VALUES (9999, 'Grupo inexistente', ?)
    `).run(isaacId),
    undefined,
    'Não deve ser possível criar tarefa para um grupo inexistente.'
);

database.prepare('DELETE FROM groups WHERE id = ?').run(groupId);

assert.equal(
    database.prepare('SELECT count(*) AS total FROM tasks').get().total,
    0
);

assert.equal(
    database.prepare('SELECT count(*) AS total FROM group_members').get().total,
    0
);

assert.equal(
    database.prepare('SELECT count(*) AS total FROM task_assignees').get().total,
    0
);

database.close();

console.log('Banco de dados validado com sucesso.');
