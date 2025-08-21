import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../../.env.local') });

const url = new URL(process.env.DIRECT_URL!);
const client = new Client({
  host: url.hostname,
  port: parseInt(url.port),
  database: url.pathname.substring(1),
  user: url.username,
  password: url.password,
  ssl: { rejectUnauthorized: false }
});

(async () => {
  await client.connect();
  const result = await client.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'project'
    ORDER BY ordinal_position
  `);
  console.log('Project columns:', result.rows.map(r => r.column_name));
  await client.end();
})();