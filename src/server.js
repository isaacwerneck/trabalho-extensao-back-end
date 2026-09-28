import { createHash, randomBytes, randomInt, scryptSync, timingSafeEqual } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createDatabase, defaultDatabasePath } from './database.js';

const SESSION_COOKIE = 'session';
const SESSION_DAYS = 30;
const publicDirectory = resolve(import.meta.dirname, '..', 'public');

function normalizedText(value) {
    return typeof value === 'string' ? value.trim() : '';
}

function hashPassword(password) {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    return `scrypt$${salt}$${hash}`;
}

function passwordMatches(password, storedValue) {
    const [algorithm, salt, storedHash] = String(storedValue).split('$');
    if (algorithm !== 'scrypt' || !salt || !storedHash) return false;

    const receivedHash = scryptSync(password, salt, 64);
    const expectedHash = Buffer.from(storedHash, 'hex');
    return receivedHash.length === expectedHash.length
        && timingSafeEqual(receivedHash, expectedHash);
}

function hashToken(token) {
    return createHash('sha256').update(token).digest('hex');
}

function readCookie(header, name) {
    if (!header) return null;
    for (const part of header.split(';')) {
        const [key, ...valueParts] = part.trim().split('=');
        if (key === name) return decodeURIComponent(valueParts.join('='));
    }
    return null;
}

function sessionCookieOptions() {
    return {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
        path: '/'
    };
}

function createSession(database, response, userId) {
    const token = randomBytes(32).toString('base64url');
    database.prepare(`
        INSERT INTO sessions (token_hash, user_id, expires_at)
        VALUES (?, ?, datetime('now', '+' || ? || ' days'))
    `).run(hashToken(token), userId, SESSION_DAYS);
    response.cookie(SESSION_COOKIE, token, sessionCookieOptions());
}

function generateInviteCode() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 8 }, () => alphabet[randomInt(alphabet.length)]).join('');
}

function groupResponse(group) {
    return {
        id: group.id,
        name: group.name,
        inviteCode: group.invite_code
    };
}

function taskResponse(task) {
    return {
        id: task.id,
        title: task.title,
        isCompleted: Boolean(task.is_completed),
        createdBy: task.created_by_username,
        createdAt: task.created_at,
        completedAt: task.completed_at
    };
}

export function createApp(database) {
    const app = express();
    app.disable('x-powered-by');
    app.use(express.json({ limit: '10kb' }));

    database.prepare("DELETE FROM sessions WHERE expires_at <= CURRENT_TIMESTAMP").run();

    function requireAuthentication(request, response, next) {
        const token = readCookie(request.headers.cookie, SESSION_COOKIE);
        if (!token) return response.status(401).json({ error: 'Faça login para continuar.' });

        const user = database.prepare(`
            SELECT users.id, users.username
            FROM sessions
            JOIN users ON users.id = sessions.user_id
            WHERE sessions.token_hash = ?
              AND sessions.expires_at > CURRENT_TIMESTAMP
        `).get(hashToken(token));

        if (!user) {
            response.clearCookie(SESSION_COOKIE, sessionCookieOptions());
            return response.status(401).json({ error: 'Sua sessão expirou. Entre novamente.' });
        }

        request.user = user;
        request.sessionTokenHash = hashToken(token);
        next();
    }

    function requireGroupAccess(request, response, next) {
        const groupId = Number(request.params.groupId);
        if (!Number.isInteger(groupId) || groupId < 1) {
            return response.status(404).json({ error: 'Grupo não encontrado.' });
        }

        const group = database.prepare(`
            SELECT id, name, invite_code
            FROM groups
            WHERE id = ?
        `).get(groupId);

        if (!group) return response.status(404).json({ error: 'Grupo não encontrado.' });

        const membership = database.prepare(`
            SELECT 1
            FROM group_members
            WHERE group_id = ? AND user_id = ?
        `).get(groupId, request.user.id);

        if (!membership) {
            return response.status(403).json({ error: 'Você não participa deste grupo.' });
        }

        request.group = group;
        next();
    }

    app.post('/api/auth/register', (request, response) => {
        const username = normalizedText(request.body?.username);
        const password = typeof request.body?.password === 'string' ? request.body.password : '';

        if (username.length < 3 || username.length > 30) {
            return response.status(400).json({ error: 'O usuário deve ter entre 3 e 30 caracteres.' });
        }
        if (password.length < 8 || password.length > 128) {
            return response.status(400).json({ error: 'A senha deve ter entre 8 e 128 caracteres.' });
        }

        const existingUser = database.prepare(
            'SELECT 1 FROM users WHERE username = ?'
        ).get(username);
        if (existingUser) {
            return response.status(409).json({ error: 'Este nome de usuário já está em uso.' });
        }

        const result = database.prepare(`
            INSERT INTO users (username, password_hash)
            VALUES (?, ?)
        `).run(username, hashPassword(password));

        const user = { id: Number(result.lastInsertRowid), username };
        createSession(database, response, user.id);
        return response.status(201).json({ user });
    });

    app.post('/api/auth/login', (request, response) => {
        const username = normalizedText(request.body?.username);
        const password = typeof request.body?.password === 'string' ? request.body.password : '';
        const user = database.prepare(`
            SELECT id, username, password_hash
            FROM users
            WHERE username = ?
        `).get(username);

        if (!user || !passwordMatches(password, user.password_hash)) {
            return response.status(401).json({ error: 'Usuário ou senha inválidos.' });
        }

        createSession(database, response, user.id);
        return response.json({ user: { id: user.id, username: user.username } });
    });

    app.get('/api/auth/me', requireAuthentication, (request, response) => {
        response.json({ user: request.user });
    });

    app.post('/api/auth/logout', requireAuthentication, (request, response) => {
        database.prepare('DELETE FROM sessions WHERE token_hash = ?')
            .run(request.sessionTokenHash);
        response.clearCookie(SESSION_COOKIE, sessionCookieOptions());
        response.status(204).end();
    });

    app.get('/api/groups', requireAuthentication, (request, response) => {
        const groups = database.prepare(`
            SELECT groups.id, groups.name, groups.invite_code
            FROM groups
            JOIN group_members ON group_members.group_id = groups.id
            WHERE group_members.user_id = ?
            ORDER BY groups.created_at DESC, groups.id DESC
        `).all(request.user.id);
        response.json({ groups: groups.map(groupResponse) });
    });

    app.post('/api/groups', requireAuthentication, (request, response) => {
        const name = normalizedText(request.body?.name);
        if (name.length < 1 || name.length > 80) {
            return response.status(400).json({ error: 'O nome do grupo deve ter entre 1 e 80 caracteres.' });
        }

        let inviteCode;
        do {
            inviteCode = generateInviteCode();
        } while (database.prepare('SELECT 1 FROM groups WHERE invite_code = ?').get(inviteCode));

        database.exec('BEGIN IMMEDIATE');
        try {
            const result = database.prepare(`
                INSERT INTO groups (name, invite_code, created_by)
                VALUES (?, ?, ?)
            `).run(name, inviteCode, request.user.id);
            const groupId = Number(result.lastInsertRowid);
            database.prepare(`
                INSERT INTO group_members (group_id, user_id)
                VALUES (?, ?)
            `).run(groupId, request.user.id);
            database.exec('COMMIT');
            return response.status(201).json({
                group: { id: groupId, name, inviteCode }
            });
        } catch (error) {
            database.exec('ROLLBACK');
            throw error;
        }
    });

    app.post('/api/groups/join', requireAuthentication, (request, response) => {
        const inviteCode = normalizedText(request.body?.inviteCode).toUpperCase();
        const group = database.prepare(`
            SELECT id, name, invite_code
            FROM groups
            WHERE invite_code = ?
        `).get(inviteCode);

        if (!group) return response.status(404).json({ error: 'Código de grupo inválido.' });

        const membership = database.prepare(`
            SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?
        `).get(group.id, request.user.id);
        if (membership) {
            return response.status(409).json({ error: 'Você já participa deste grupo.' });
        }

        database.prepare(`
            INSERT INTO group_members (group_id, user_id)
            VALUES (?, ?)
        `).run(group.id, request.user.id);
        return response.json({ group: groupResponse(group) });
    });

    app.get(
        '/api/groups/:groupId',
        requireAuthentication,
        requireGroupAccess,
        (request, response) => {
            const members = database.prepare(`
                SELECT users.id, users.username
                FROM group_members
                JOIN users ON users.id = group_members.user_id
                WHERE group_members.group_id = ?
                ORDER BY users.username COLLATE NOCASE
            `).all(request.group.id);

            const tasks = database.prepare(`
                SELECT tasks.*, users.username AS created_by_username
                FROM tasks
                JOIN users ON users.id = tasks.created_by
                WHERE tasks.group_id = ?
                ORDER BY tasks.is_completed, tasks.created_at DESC, tasks.id DESC
            `).all(request.group.id);

            response.json({
                group: {
                    ...groupResponse(request.group),
                    members,
                    tasks: tasks.map(taskResponse)
                }
            });
        }
    );

    app.post(
        '/api/groups/:groupId/tasks',
        requireAuthentication,
        requireGroupAccess,
        (request, response) => {
            const title = normalizedText(request.body?.title);
            if (title.length < 1 || title.length > 120) {
                return response.status(400).json({ error: 'A tarefa deve ter entre 1 e 120 caracteres.' });
            }

            const result = database.prepare(`
                INSERT INTO tasks (group_id, title, created_by)
                VALUES (?, ?, ?)
            `).run(request.group.id, title, request.user.id);

            const task = database.prepare(`
                SELECT tasks.*, users.username AS created_by_username
                FROM tasks
                JOIN users ON users.id = tasks.created_by
                WHERE tasks.id = ?
            `).get(Number(result.lastInsertRowid));
            return response.status(201).json({ task: taskResponse(task) });
        }
    );

    app.patch(
        '/api/groups/:groupId/tasks/:taskId',
        requireAuthentication,
        requireGroupAccess,
        (request, response) => {
            if (typeof request.body?.isCompleted !== 'boolean') {
                return response.status(400).json({ error: 'Informe um estado válido para a tarefa.' });
            }

            const taskId = Number(request.params.taskId);
            const taskExists = Number.isInteger(taskId) && database.prepare(`
                SELECT 1 FROM tasks WHERE id = ? AND group_id = ?
            `).get(taskId, request.group.id);
            if (!taskExists) return response.status(404).json({ error: 'Tarefa não encontrada.' });

            const completed = request.body.isCompleted ? 1 : 0;
            database.prepare(`
                UPDATE tasks
                SET is_completed = ?,
                    completed_at = CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE NULL END
                WHERE id = ?
            `).run(completed, completed, taskId);

            const task = database.prepare(`
                SELECT tasks.*, users.username AS created_by_username
                FROM tasks
                JOIN users ON users.id = tasks.created_by
                WHERE tasks.id = ?
            `).get(taskId);
            return response.json({ task: taskResponse(task) });
        }
    );

    app.use('/api', (request, response) => {
        response.status(404).json({ error: 'Rota não encontrada.' });
    });

    app.use(express.static(publicDirectory));

    app.use((error, request, response, next) => {
        console.error(error);
        if (response.headersSent) return next(error);
        return response.status(500).json({ error: 'Não foi possível concluir a operação.' });
    });

    return app;
}

const isMainModule = process.argv[1]
    && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
    const database = createDatabase(process.env.DATABASE_PATH || defaultDatabasePath());
    const port = Number(process.env.PORT) || 3000;
    const app = createApp(database);
    const server = app.listen(port, () => {
        console.log(`Servidor disponível em http://localhost:${port}`);
    });

    function shutdown() {
        server.close(() => {
            database.close();
            process.exit(0);
        });
    }

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}
