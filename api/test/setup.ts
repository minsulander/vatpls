import { afterAll } from "@jest/globals"
import { closeDatabase } from "../src/db/database"

afterAll(async () => {
    await closeDatabase()
})
