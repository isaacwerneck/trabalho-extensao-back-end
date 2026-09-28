import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const schema = readFileSync(
    resolve(import.meta.dirname, '..', 'database', 'schema.sql'),
    'utf8'
);

export function createDatabase(path) {
    const database = new DatabaseSync(path);
    database.exec(schema);
    return database;
}

export function defaultDatabasePath() {
    return resolve(import.meta.dirname, '..', 'database', 'app.db');
}
