import { activeControllersService, changeStateService, determineStateService, getControllerStateService } from "../src/services/controllerServices";
import { addController, cid_query, query_database, removeController } from "../src/db/database";
import { NewController } from "../src/types/types";

/** Common objects + fn */
const testTestson: NewController = {
    cid: "999999",
    name: "Test Testson",
    sign: "TT",
    rating: "S3",
    endorsement: ['T1 APP', 'T2 APS', 'T1 TWR']
};

const rudolfRudolfson: NewController = {
    cid: "999998",
    name: "Rudolf Rudolfson",
    sign: "RR",
    rating: "S2",
    endorsement: ['T2 APS', 'T1 TWR']
};

const puttePersson: NewController = {
    cid: "999997",
    name: "Putte Persson",
    sign: "PP",
    rating: "C1",
    endorsement: ['T1 APP', 'T2 APS', 'T1 TWR']
};

const ctrlList = [testTestson, rudolfRudolfson, puttePersson];


async function clearDatabase() {
    const cids = ['999999', '999998', '999997'];
    const placeholders = cids.map((_, i) => `$${i + 1}`).join(", ");
    await query_database(`DELETE FROM endorsements WHERE cid IN (${placeholders});`, cids);
    await query_database(`DELETE FROM session WHERE cid IN (${placeholders});`, cids);
    await query_database(`DELETE FROM active WHERE cid IN (${placeholders});`, cids);
    
}

/**
 * TEST START HERE
 */

describe("ChangeStateService", () => {
    beforeAll(async () => {
        await clearDatabase();
    });
    afterAll(async () => {
        await clearDatabase();
        removeController(puttePersson.cid);
    })

    it("Putte Persson is now ACC4", async () => {
        expect((await cid_query(puttePersson.cid)).rowCount).toBe(0);
        await addController(puttePersson);
        expect((await cid_query(puttePersson.cid)).rowCount).toBe(1);
        expect((await changeStateService(puttePersson.cid, "ACC4", "OS3")).rowCount).toBe(1);
    
        const response = await getControllerStateService(puttePersson.cid);
        expect(response.rowCount).toBe(1);
        const activityObj = response.rows[0];
        expect(activityObj.cid).toBe(puttePersson.cid);
        expect(activityObj.position).toBe("ACC4");

        //expect(((await removeController(puttePersson.cid)).rowCount)).toBe(1);
    });
});


describe("DetermineStateService", () => {
    it("returns pause", () => {
        expect(determineStateService("pause")).toBe("PAUSE");
        expect(determineStateService("PAuSe")).toBe("PAUSE");
        expect(determineStateService("PAUSE")).toBe("PAUSE");
        expect(determineStateService("Break")).toBe("PAUSE");
        expect(determineStateService("break")).toBe("PAUSE");
        expect(determineStateService("BREAK")).toBe("PAUSE");
    });
    it("returns other", () => {
        expect(determineStateService("other")).toBe("OTHER");
        expect(determineStateService("OtHer")).toBe("OTHER");
        expect(determineStateService("OTHER")).toBe("OTHER");
    });
    it("returns active", () => {
        expect(determineStateService("GG AD")).toBe("ACTIVE");
        expect(determineStateService("ACC4")).toBe("ACTIVE");
        expect(determineStateService("ACC 4")).toBe("ACTIVE");
        expect(determineStateService("ACC 1")).toBe("ACTIVE");
        expect(determineStateService("SA AD")).toBe("ACTIVE");
        expect(determineStateService("GG APP")).toBe("ACTIVE");
        expect(determineStateService("Ö")).toBe("ACTIVE");
        expect(determineStateService("WS")).toBe("ACTIVE");
    });
});



describe("activeControllersService", () => {
    beforeAll(async () => {
        await clearDatabase();
        await addController(puttePersson);
        await addController(testTestson);
        await addController(rudolfRudolfson);
    });

    afterAll(async () => {
        clearDatabase();
        await removeController(puttePersson.cid);
        await removeController(testTestson.cid);
        await removeController(rudolfRudolfson.cid);
    })
    it("returns with 0 active", async () => {
        expect((await activeControllersService()).Controllers.length).toBe(0);
    });
    it("returns with 1 active", async () => {
        await changeStateService(puttePersson.cid, "ACC4", "OS3");
        expect((await activeControllersService()).Controllers.length).toBe(1);
    });
    it("returns with 2 active", async () => {
        await changeStateService(rudolfRudolfson.cid, "SA AD", "ESSA TWR");
        expect((await activeControllersService()).Controllers.length).toBe(2);
    });
});