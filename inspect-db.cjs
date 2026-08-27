// Dev helper: inspect the SQLite DB state from the CLI.
// Run: `node inspect-db.cjs` from the project root. Read-only.
const { DatabaseSync } = require("node:sqlite");
const db = new DatabaseSync("./rentease.db");

function table(name) {
  const rows = db.prepare(`SELECT * FROM ${name}`).all();
  console.log(`\n=== ${name} (${rows.length} rows) ===`);
  console.log(rows);
}

console.log("seedVersion:", db.prepare(`SELECT value FROM meta WHERE key = 'seedVersion'`).get()?.value);
table("listings");
table("reports");


