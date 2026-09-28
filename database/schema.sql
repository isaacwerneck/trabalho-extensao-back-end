PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL COLLATE NOCASE UNIQUE
        CHECK (length(trim(username)) BETWEEN 3 AND 30),
    password_hash TEXT NOT NULL
        CHECK (length(password_hash) > 0),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
) STRICT;

CREATE TABLE IF NOT EXISTS groups (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL
        CHECK (length(trim(name)) BETWEEN 1 AND 80),
    invite_code TEXT NOT NULL COLLATE NOCASE UNIQUE
        CHECK (length(invite_code) = 8),
    created_by INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) STRICT;

CREATE TABLE IF NOT EXISTS group_members (
    group_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, user_id),
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) STRICT;

CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY,
    group_id INTEGER NOT NULL,
    title TEXT NOT NULL
        CHECK (length(trim(title)) BETWEEN 1 AND 120),
    is_completed INTEGER NOT NULL DEFAULT 0
        CHECK (is_completed IN (0, 1)),
    created_by INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TEXT,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    CHECK (
        (is_completed = 0 AND completed_at IS NULL)
        OR (is_completed = 1 AND completed_at IS NOT NULL)
    )
) STRICT;

CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY
        CHECK (length(token_hash) > 0),
    user_id INTEGER NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) STRICT;

CREATE INDEX IF NOT EXISTS idx_group_members_user
    ON group_members(user_id);

CREATE INDEX IF NOT EXISTS idx_tasks_group_status
    ON tasks(group_id, is_completed);

CREATE INDEX IF NOT EXISTS idx_sessions_user
    ON sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_sessions_expires
    ON sessions(expires_at);
