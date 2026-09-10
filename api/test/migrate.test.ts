import { createHash } from "crypto"
import { mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals"
import { TransactionClient } from "../src/db/database"
import { runMigrations } from "../src/db/migrate"

type TestQuery = (statement: string, params?: unknown[]) => Promise<{ rows: unknown[] }>

describe("runMigrations", () => {
    let migrationsDirectory: string

    beforeEach(() => {
        migrationsDirectory = mkdtempSync(join(tmpdir(), "vatpls-migrations-"))
        jest.spyOn(console, "log").mockImplementation(() => undefined)
        jest.spyOn(console, "error").mockImplementation(() => undefined)
    })

    afterEach(() => {
        rmSync(migrationsDirectory, { recursive: true, force: true })
        jest.restoreAllMocks()
    })

    const transactionUsing =
        (query: TestQuery) =>
        async <T>(operation: (client: TransactionClient) => Promise<T>): Promise<T> =>
            operation({ query: query as TransactionClient["query"] })

    it("does not hide a migration error just because the SQL contains IF NOT EXISTS", async () => {
        const sql = "CREATE TABLE IF NOT EXISTS broken("
        writeFileSync(join(migrationsDirectory, "001_broken.sql"), sql)

        const query = jest.fn(async (statement: string) => {
            if (statement.includes("SELECT filename, checksum FROM _migrations_run")) {
                return { rows: [] }
            }
            if (statement === sql) {
                throw Object.assign(new Error("syntax error"), { code: "42601" })
            }
            return { rows: [] }
        })

        await expect(runMigrations({ migrationsDirectory, transaction: transactionUsing(query) })).rejects.toThrow("syntax error")
        expect(query.mock.calls.some(([statement]) => statement.includes("INSERT INTO _migrations_run"))).toBe(false)
    })

    it("records a checksum only after a migration succeeds", async () => {
        const sql = "CREATE TABLE example(id INTEGER);"
        const filename = "001_example.sql"
        writeFileSync(join(migrationsDirectory, filename), sql)

        const query = jest.fn(async (statement: string) => {
            if (statement.includes("SELECT filename, checksum FROM _migrations_run")) {
                return { rows: [] }
            }
            return { rows: [] }
        })

        await runMigrations({ migrationsDirectory, transaction: transactionUsing(query) })

        const expectedChecksum = createHash("sha256").update(sql).digest("hex")
        expect(query).toHaveBeenCalledWith("INSERT INTO _migrations_run (filename, checksum) VALUES ($1, $2)", [filename, expectedChecksum])
        expect(query.mock.calls.findIndex(([statement]) => statement === sql)).toBeLessThan(
            query.mock.calls.findIndex(([statement]) => statement.includes("INSERT INTO _migrations_run")),
        )
    })

    it("rejects a migration file that changed after it was applied", async () => {
        const sql = "SELECT 2;"
        const filename = "001_example.sql"
        writeFileSync(join(migrationsDirectory, filename), sql)

        const query = jest.fn(async (statement: string) => {
            if (statement.includes("SELECT filename, checksum FROM _migrations_run")) {
                return { rows: [{ filename, checksum: createHash("sha256").update("SELECT 1;").digest("hex") }] }
            }
            return { rows: [] }
        })

        await expect(runMigrations({ migrationsDirectory, transaction: transactionUsing(query) })).rejects.toThrow(
            "has changed since it was applied",
        )
        expect(query).not.toHaveBeenCalledWith(sql)
    })

    it("adds a checksum to history created by the legacy runner without replaying SQL", async () => {
        const sql = "SELECT 1;"
        const filename = "001_example.sql"
        writeFileSync(join(migrationsDirectory, filename), sql)

        const query = jest.fn(async (statement: string) => {
            if (statement.includes("SELECT filename, checksum FROM _migrations_run")) {
                return { rows: [{ filename, checksum: null }] }
            }
            return { rows: [] }
        })

        await runMigrations({ migrationsDirectory, transaction: transactionUsing(query) })

        const expectedChecksum = createHash("sha256").update(sql).digest("hex")
        expect(query).toHaveBeenCalledWith("UPDATE _migrations_run SET checksum = $2 WHERE filename = $1", [filename, expectedChecksum])
        expect(query).not.toHaveBeenCalledWith(sql)
    })
})
