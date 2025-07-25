import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function getDB() {
    return open({
        filename: path.join(__dirname, 'gastos.db'),
        driver: sqlite3.Database
    });
}