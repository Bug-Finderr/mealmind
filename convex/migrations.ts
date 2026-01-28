/**
 * Database migrations using @convex-dev/migrations
 *
 * Usage:
 *   bunx convex run migrations:<name> '{"fn": "migrations:<name>"}'
 *
 * Dry run:
 *   bunx convex run migrations:<name>
 *
 * See: https://github.com/get-convex/migrations
 */
import { Migrations } from "@convex-dev/migrations";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";

export const migrations = new Migrations<DataModel>(components.migrations);
export const run = migrations.runner();

// Example migration template:
// export const exampleMigration = migrations.define({
//   table: "tableName",
//   migrateOne: (_ctx, doc) => {
//     // Return partial update object, or undefined to skip
//     // Use ctx.db.replace(doc._id, {...}) to remove fields
//     return { newField: "value" };
//   },
// });
