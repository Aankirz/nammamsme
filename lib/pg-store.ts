import { neon } from "@neondatabase/serverless";
import type { DocumentStore, StoredRow } from "./db";

const TABLE = "documents";

export function createPgStore(url: string, seed: readonly StoredRow[]): DocumentStore {
  const sql = neon(url);
  let ready: Promise<void> | null = null;

  async function ensure(): Promise<void> {
    ready ??= (async () => {
      await sql`create table if not exists documents (
        id text primary key,
        row jsonb not null,
        created_at timestamptz not null default now()
      )`;

      const [{ count }] = (await sql`select count(*)::int as count from documents`) as Array<{
        count: number;
      }>;

      if (count === 0) await seedRows();
    })();

    return ready;
  }

  async function seedRows(): Promise<number> {
    for (const row of seed) {
      await sql`insert into documents (id, row) values (${row.id}, ${JSON.stringify(row)}::jsonb)
                on conflict (id) do update set row = excluded.row`;
    }
    return seed.length;
  }

  return {
    async listDocuments() {
      await ensure();
      const rows = (await sql`select row from documents order by created_at asc`) as Array<{
        row: StoredRow;
      }>;
      return rows.map((r) => r.row);
    },

    async getDocument(id) {
      await ensure();
      const rows = (await sql`select row from documents where id = ${id}`) as Array<{
        row: StoredRow;
      }>;
      return rows[0]?.row ?? null;
    },

    async insertDocument(row) {
      await ensure();
      await sql`insert into documents (id, row) values (${row.id}, ${JSON.stringify(row)}::jsonb)
                on conflict (id) do update set row = excluded.row`;
      return row;
    },

    async updateDocument(id, patch) {
      await ensure();
      const current = await this.getDocument(id);
      if (!current) return null;

      const updated = { ...current, ...patch };
      await sql`update documents set row = ${JSON.stringify(updated)}::jsonb where id = ${id}`;
      return updated;
    },

    async reset() {
      await ensure();
      await sql`delete from documents`;
      return seedRows();
    },
  };
}
