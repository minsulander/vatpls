import { afterAll, beforeAll, describe, it, expect } from "@jest/globals"
import { activeControllers, addController, deleteState, query_database, stateChange } from "../src/db/database"
import { IActivity, NewController } from "../src/types/types"

/** Common objects + fn */
const testTestson: NewController = {
    cid: "999999",
    name: "Test Testson",
    sign: "TT",
    rating: "S3",
    endorsement: ["T1 APP", "T2 APS", "T1 TWR"],
}

async function addTestTestson() {
    return await addController(testTestson)
}

async function clearDatabase() {
    await query_database("DELETE FROM active where cid = $1", ["999999"])
    await query_database("DELETE FROM session where cid = $1", ["999999"])
    await query_database("DELETE FROM endorsements where cid = $1", ["999999"])
    await query_database("DELETE FROM controller where cid = $1", ["999999"])
}

async function activeTestControllers() {
    const result = await activeControllers()
    return result.rows.filter((controller) => controller.cid === testTestson.cid)
}

async function testSessionCount() {
    const result = await query_database("SELECT COUNT(*)::int AS count FROM session WHERE cid = $1", [testTestson.cid])
    return result.rows[0].count as number
}

/** Tests start here */

describe("Database", () => {
    it("connects", async () => {
        const result = await query_database("SELECT NOW();")
        expect(result.rowCount).toBe(1)
        expect(Date.parse(result.rows[0].now)).toBeGreaterThan(new Date().valueOf() - 1000) // should not take more than 1000ms to connect..
    })
})

describe("Database", () => {
    beforeAll(async () => {
        await clearDatabase()
    })

    afterAll(async () => {
        await clearDatabase()
    })

    it("saves controller Test Testson in database", async () => {
        await expect(addTestTestson()).resolves.toStrictEqual({ rowCount: 1 })
    })

    it("Can't add Test Testson again", async () => {
        expect(addTestTestson()).rejects.toThrow("999999")
    })
})

const statechangetoACC4: IActivity = {
    cid: "999999",
    callsign: "OS3",
    position: "ACC 4",
    in_list: "ACTIVE",
}

const statechangetoOther: IActivity = {
    cid: "999999",
    callsign: "Buying Thai food",
    in_list: "OTHER",
}

const statechangetoPause: IActivity = {
    cid: "999999",
    in_list: "PAUSE",
}

describe("Active table", () => {
    beforeAll(async () => {
        await clearDatabase()
    })
    afterAll(async () => {
        await clearDatabase()
    })

    // no controllers
    it("has no active", async () => {
        expect((await activeTestControllers()).length).toBe(0)
    })

    // add test testson
    it("has Test Testson in ACTIVE state", async () => {
        await addController(testTestson)
        expect((await stateChange(statechangetoACC4)).rowCount).toBe(1)
        // check that its the right controller.
        const currentActiveControllers = await activeTestControllers()
        expect(currentActiveControllers).toHaveLength(1)
        expect(currentActiveControllers[0].cid).toBe("999999")
        expect(currentActiveControllers[0].position).toBe("ACC 4")
        expect(currentActiveControllers[0].callsign).toBe("OS3")
        expect(currentActiveControllers[0].in_list).toBe("ACTIVE")
    })
    it("removed Test Testson as ACTIVE", async () => {
        expect((await deleteState(statechangetoACC4.cid)).rowCount).toBe(1)
        expect((await activeTestControllers()).length).toBe(0)
    })

    it("has Test Testson in PAUSE state", async () => {
        expect((await stateChange(statechangetoPause)).rowCount).toBe(1)
        const currentActiveControllers = await activeTestControllers()
        expect(currentActiveControllers).toHaveLength(1)
        expect(currentActiveControllers[0].cid).toBe("999999")
        expect(currentActiveControllers[0].position).toBe(" ")
        expect(currentActiveControllers[0].in_list).toBe("PAUSE")
    })
    it("removed Test Testson as PAUSE", async () => {
        expect((await deleteState(statechangetoPause.cid)).rowCount).toBe(1)
        expect((await activeTestControllers()).length).toBe(0)
    })

    it("has Test Testson in OTHER state", async () => {
        expect((await stateChange(statechangetoOther)).rowCount).toBe(1)
        const currentActiveControllers = await activeTestControllers()
        expect(currentActiveControllers).toHaveLength(1)
        expect(currentActiveControllers[0].cid).toBe("999999")
        expect(currentActiveControllers[0].callsign).toBe("Buying Thai food")
        expect(currentActiveControllers[0].in_list).toBe("OTHER")
    })
    it("removed Test Testson as OTHER", async () => {
        expect((await deleteState(statechangetoOther.cid)).rowCount).toBe(1)
        expect((await activeTestControllers()).length).toBe(0)
    })
})

describe("Session table", () => {
    // Reset state
    beforeAll(async () => {
        await clearDatabase()
        await addTestTestson()
    })

    /** reset state to what it had previously. */
    afterAll(async () => {
        await clearDatabase()
    })

    it("has 0 entry after 1 move", async () => {
        expect((await stateChange(statechangetoOther)).rowCount).toBe(1)
        expect(await testSessionCount()).toBe(0)
        expect((await deleteState(statechangetoOther.cid)).rowCount).toBe(1)
    })

    it("has 1 entry after 2 move", async () => {
        expect((await stateChange(statechangetoPause)).rowCount).toBe(1)
        expect(await testSessionCount()).toBe(1)
        expect((await deleteState(statechangetoPause.cid)).rowCount).toBe(1)
    })

    it("has 2 entry after 3 move", async () => {
        expect((await stateChange(statechangetoACC4)).rowCount).toBe(1)
        expect(await testSessionCount()).toBe(2)
        expect((await deleteState(statechangetoACC4.cid)).rowCount).toBe(1)
        expect(await testSessionCount()).toBe(3)
    })
})
