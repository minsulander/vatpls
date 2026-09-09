import { readFileSync, readdirSync } from "fs"
import { join } from "path"
import { query_database } from "./database"

/**
 * easy migration runner, just runs all .sql files not very good system...
 */
export const runMigrations = async (): Promise<void> => {
    try {
        // create table to keep track, OBS ta bort gamla tabellen...
        await query_database(`
            CREATE TABLE IF NOT EXISTS _migrations_run (
                filename VARCHAR(255) PRIMARY KEY,
                run_at TIMESTAMP DEFAULT NOW()
            );
        `)

        console.log("Running migrations...")

        // get all sql files
        const migrationsDir = join(process.cwd(), "src/migrations")
        const migrationFiles = readdirSync(migrationsDir)
            .filter((file) => file.endsWith(".sql"))
            .sort()

        // check database what has been run
        const result = await query_database("SELECT filename FROM _migrations_run")
        const runMigrations = new Set(result.rows.map((row: any) => row.filename))

        // Run each migration not runned  already
        let newMigrationsCount = 0
        for (const file of migrationFiles) {
            if (runMigrations.has(file)) {
                console.log(`Skipping migration (already run): ${file}`)
                continue
            }

            console.log(`Running migration: ${file}`)
            const filePath = join(migrationsDir, file)
            const sql = readFileSync(filePath, "utf-8")

            try {
                await query_database(sql, [], true)
                await query_database("INSERT INTO _migrations_run (filename) VALUES ($1)", [file])
                console.log(`${file} completed`)
                newMigrationsCount++
            } catch (error: any) {
                // TODO this is not very good, implement a better migration system or use something that already works...
                if (
                    error.code === "42710" ||
                    error.code === "42P07" ||
                    error.code === "42P06" ||
                    error.code === "23505" ||
                    sql.includes("IF NOT EXISTS")
                ) {
                    console.log(` ${file} - exists, skipping`)
                } else {
                    throw error
                }
            }
        }

        console.log(`${newMigrationsCount} new migration(s) completed successfully`)
    } catch (error) {
        console.error("Migration failed:", error)
        throw error
    }
}
