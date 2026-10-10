Scripts, short version:

dev — runs your server with tsx, auto-restarting on file changes (watch), loading env vars from .env natively via Node's --env-file flag. Your everyday command while coding.
start — same thing, no watch mode. What you'd run in production — you don't want the process restarting itself on every file write.
contract:emit — compiles your .prisma file into contract.json + contract.d.ts, the generated artifacts your db.ts client reads. Run this after every schema edit.
db:init — one-time: creates the tables in your database from the contract, for a database that has none yet. What you ran to stand up your local DB the first time.
db:update — pushes schema changes straight to the database, no migration history recorded. Your everyday "I tweaked a model, sync my local DB" command.
migrate — generates and applies a real, saved migration file (a .sql record of exactly what changed). Used when the change needs to be reproducible and applied to other environments (staging, prod) in the same order.
migration:status — shows which migrations have been applied vs. which are still pending on the current database.
typecheck — runs the TypeScript compiler in check-only mode (--noEmit = verify types, don't output JS files). Catches type errors tsx silently ignores, since tsx never type-checks, it just strips types and runs.
postinstall — runs automatically after pnpm install; syncs Prisma's AI-agent skill files (the ones Claude Code/Cursor read) to match your installed package version. || exit 0 means if it fails, don't fail your whole install over it.
