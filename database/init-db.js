import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const schemaPath = resolve(import.meta.dirname, 'schema.sql');
const databasePath = resolve(import.meta.dirname, 'app.db');
const schema = readFileSync(schemaPath, 'utf8');

const database = new DatabaseSync(databasePath);
database.exec(schema);
database.close();

console.log(`Banco criado em: ${databasePath}`);
