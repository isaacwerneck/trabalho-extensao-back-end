import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const schema = readFileSync(resolve(import.meta.dirname, 'schema.sql'), 'utf8');
const database = new DatabaseSync(':memory:');
database.exec(schema);

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
    0,
    'As tarefas devem ser removidas junto com o grupo.'
);
assert.equal(
    database.prepare('SELECT count(*) AS total FROM group_members').get().total,
    0,
    'Os vínculos de participantes devem ser removidos junto com o grupo.'
);

database.close();
console.log('Banco de dados validado com sucesso.');
