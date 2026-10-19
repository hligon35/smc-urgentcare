import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";

/** Execute the actual migrations and auth SQL, with D1's prepared-statement shape. */
export function testDatabase(migrated = true) {
  const sqlite = new DatabaseSync(":memory:");
  if (migrated) {
    for (const name of ["0001_portal_auth.sql", "0002_portal_roles.sql"])
      sqlite.exec(readFileSync(new URL(`../../migrations/${name}`, import.meta.url), "utf8"));
  }
  const db = {
    prepare(sql) {
      const statement = {
        values: [],
        bind(...values) { return { ...statement, values }; },
        async run() { const result = sqlite.prepare(sql).run(...this.values); return { success: true, meta: { changes: Number(result.changes) } }; },
        async first() { return sqlite.prepare(sql).get(...this.values) || null; },
        async all() { return { results: sqlite.prepare(sql).all(...this.values) }; },
      };
      return statement;
    },
    async batch(statements) { return Promise.all(statements.map(s => s.all())); },
  };
  return { db, sqlite };
}
