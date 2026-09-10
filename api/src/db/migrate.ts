import { readFileSync, readdirSync } from "fs"
import { createHash } from "crypto"
import { join } from "path"
import { TransactionClient, withTransaction } from "./database"

type AppliedMigration = {
    filename: string
    checksum: string | null
}

type MigrationOptions = {
    migrationsDirectory?: string
    transaction?: typeof withTransaction
}

const checksum = (sql: string): string => createHash("sha256").update(sql).digest("hex")

const migrationFilesIn = (directory: string): string[] =>
    readdirSync(directory)
        .filter((file) => file.endsWith(".sql"))
        .sort()

const migrate = async (client: TransactionClient, migrationsDirectory: string): Promise<number> => {
    // Only one application instance may inspect and update migration history at a time.
    await client.query("SELECT pg_advisory_xact_lock(hashtext('vatpls:migrations'))")

    await client.query(`
        CREATE TABLE IF NOT EXISTS _migrations_run (
            filename VARCHAR(255) PRIMARY KEY,
            run_at TIMESTAMP DEFAULT NOW(),
            checksum CHAR(64)
        );
    `)
    await client.query("ALTER TABLE _migrations_run ADD COLUMN IF NOT EXISTS checksum CHAR(64)")

    const result = await client.query<AppliedMigration>("SELECT filename, checksum FROM _migrations_run")
    const appliedMigrations = new Map(result.rows.map((row) => [row.filename, row.checksum]))

    let newMigrationsCount = 0
    for (const file of migrationFilesIn(migrationsDirectory)) {
        const filePath = join(migrationsDirectory, file)
        const sql = readFileSync(filePath, "utf-8")
        const currentChecksum = checksum(sql)

        if (appliedMigrations.has(file)) {
            const appliedChecksum = appliedMigrations.get(file)
            if (appliedChecksum && appliedChecksum !== currentChecksum) {
                throw new Error(`Migration ${file} has changed since it was applied`)
            }

            // Databases created by the old runner have no checksums. Anchor them now.
            if (!appliedChecksum) {
                await client.query("UPDATE _migrations_run SET checksum = $2 WHERE filename = $1", [file, currentChecksum])
            }

            console.log(`Skipping migration (already run): ${file}`)
            continue
        }

        console.log(`Running migration: ${file}`)
        await client.query(sql)
        await client.query("INSERT INTO _migrations_run (filename, checksum) VALUES ($1, $2)", [file, currentChecksum])
        console.log(`${file} completed`)
        newMigrationsCount++
    }

    return newMigrationsCount
}

export const runMigrations = async (options: MigrationOptions = {}): Promise<void> => {
    const migrationsDirectory = options.migrationsDirectory ?? join(process.cwd(), "src/migrations")
    const transaction = options.transaction ?? withTransaction

    try {
        console.log("Running migrations...")
        const newMigrationsCount = await transaction((client) => migrate(client, migrationsDirectory))
        console.log(`${newMigrationsCount} new migration(s) completed successfully`)
    } catch (error) {
        console.error("Migration failed:", error)
        throw error
    }
}
