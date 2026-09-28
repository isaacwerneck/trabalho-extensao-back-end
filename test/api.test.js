import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createDatabase } from '../src/database.js';
import { createApp } from '../src/server.js';

const database = createDatabase(':memory:');
const app = createApp(database);
const server = await new Promise(resolve => {
    const instance = app.listen(0, () => resolve(instance));
});
const baseUrl = `http://127.0.0.1:${server.address().port}`;

after(() => {
    server.close();
    database.close();
});

async function api(path, { cookie, body, ...options } = {}) {
    const response = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers: {
            ...(body ? { 'Content-Type': 'application/json' } : {}),
            ...(cookie ? { Cookie: cookie } : {})
        },
        body: body ? JSON.stringify(body) : undefined
    });
    const data = response.status === 204 ? null : await response.json();
    const setCookie = response.headers.get('set-cookie');
    return {
        status: response.status,
        data,
        cookie: setCookie ? setCookie.split(';', 1)[0] : cookie
    };
}

async function register(username) {
    const response = await api('/api/auth/register', {
        method: 'POST',
        body: { username, password: 'senha-segura' }
    });
    assert.equal(response.status, 201);
    assert.ok(response.cookie);
    return response;
}

test('fluxo completo do MVP com autorização', async () => {
    const isaac = await register('Isaac');
    const duplicate = await api('/api/auth/register', {
        method: 'POST',
        body: { username: 'isaac', password: 'outra-senha' }
    });
    assert.equal(duplicate.status, 409);

    const createdGroup = await api('/api/groups', {
        method: 'POST',
        cookie: isaac.cookie,
        body: { name: 'Projeto de Extensão' }
    });
    assert.equal(createdGroup.status, 201);
    assert.equal(createdGroup.data.group.inviteCode.length, 8);
    const group = createdGroup.data.group;

    const createdTask = await api(`/api/groups/${group.id}/tasks`, {
        method: 'POST',
        cookie: isaac.cookie,
        body: { title: 'Concluir o MVP' }
    });
    assert.equal(createdTask.status, 201);
    assert.equal(createdTask.data.task.isCompleted, false);

    const tassia = await register('Tassia');
    const joined = await api('/api/groups/join', {
        method: 'POST',
        cookie: tassia.cookie,
        body: { inviteCode: group.inviteCode.toLowerCase() }
    });
    assert.equal(joined.status, 200);

    const groupView = await api(`/api/groups/${group.id}`, { cookie: tassia.cookie });
    assert.equal(groupView.status, 200);
    assert.deepEqual(
        groupView.data.group.members.map(member => member.username),
        ['Isaac', 'Tassia']
    );
    assert.equal(groupView.data.group.tasks.length, 1);

    const completed = await api(`/api/groups/${group.id}/tasks/${createdTask.data.task.id}`, {
        method: 'PATCH',
        cookie: tassia.cookie,
        body: { isCompleted: true }
    });
    assert.equal(completed.status, 200);
    assert.equal(completed.data.task.isCompleted, true);
    assert.ok(completed.data.task.completedAt);

    const outsider = await register('Visitante');
    const forbidden = await api(`/api/groups/${group.id}`, { cookie: outsider.cookie });
    assert.equal(forbidden.status, 403);

    const loggedOut = await api('/api/auth/logout', {
        method: 'POST',
        cookie: isaac.cookie
    });
    assert.equal(loggedOut.status, 204);

    const afterLogout = await api('/api/auth/me', { cookie: isaac.cookie });
    assert.equal(afterLogout.status, 401);
});
