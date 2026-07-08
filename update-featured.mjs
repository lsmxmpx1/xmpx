import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'dev.db');

const db = new DatabaseSync(dbPath);

const featuredSlugs = [
  'xdf-siming', 'xes-huli', 'gys-xm',
  'ht-xm', 'tarena-xm', 'jm-coding', 'xhd-xm'
];

// Set featured = 1 for selected institutions
const placeholders = featuredSlugs.map(() => '?').join(',');
db.prepare(`UPDATE Institution SET featured = 1 WHERE slug IN (${placeholders})`)
  .run(...featuredSlugs);

// Set featured = 0 for others
db.prepare(`UPDATE Institution SET featured = 0 WHERE slug NOT IN (${placeholders})`)
  .run(...featuredSlugs);

// Verify
const rows = db.prepare('SELECT id, name, featured FROM Institution').all();
rows.forEach(r => console.log(`${r.featured ? '★' : ' '} ${r.name}`));

console.log(`\nDone: ${featuredSlugs.length} institutions marked as featured`);
db.close();
