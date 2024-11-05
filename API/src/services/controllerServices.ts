import { QueryResult } from "pg";
import { activeControllers, addController, cid_query, deleteState, query_database, stateChange } from "../db/database";
import { IActivity, OActivity, SkeletonController, State, Rating, Endorsement, NewController, Controller } from "../types/types";

/** Returns all Active controllers,
 * returns { Controller: row } (row is db rows)
 */
export async function activeControllersService(): Promise<{ Controllers: Controller[], length: number | null}> {
    try {
        const result = await activeControllers();
        const len = result.rowCount;

        // Convert to Controller interface
        const fin = result.rows.map((ctrl) => {
            if (ctrl.callsign == undefined) {
                ctrl.callsign = "pause";
            } if (ctrl.in_list == "PAUSE" || ctrl.in_list == "OTHER") {
                ctrl.position = ctrl.in_list;
            }

            return {
                name: ctrl.name,
                sign: ctrl.sign,
                cid: ctrl.cid,
                rating: ctrl.rating,
                callsign: ctrl.callsign,
                frequency: '123.45',
                position: ctrl.position,
                timestamp: ctrl.timestamp,
                endorsment: ctrl.endorsements
            };
        });

        return ({ Controllers: fin, length: len});

    } catch (error: any) {
        // TODO
        return error;
    }   
}

export async function predefinedControllersService() { 
    return await query_database(
        "SELECT cid, controller_name as name, sign, controller_rating as rating FROM controller;"
    );
}

export async function getControllerStateService(cid: string): Promise<QueryResult<OActivity>> {
    return await query_database(
            "SELECT * FROM active WHERE cid = $1;",
            [cid]
    );
}

export async function getControllerByCIDService(cid: string): Promise<QueryResult<SkeletonController> | undefined> {
    try {
        const result = await cid_query(cid);
        if (result.rowCount == null || result.rowCount == 0 ) {
            return undefined;
        }
        return result;
    } catch(error: any) {
        // TODO
        return undefined;
    }
}

export function determineStateService(position: string): State {
    if (!position) {
        throw Error("Position was undefined.");
    }
    if (position.toUpperCase() == "PAUSE" || position.toUpperCase() == "BREAK") {
        return "PAUSE";
    } else if (position.toUpperCase() == "OTHER") {
        return "OTHER";
    } else {
        return "ACTIVE";
    }
}

/** 
 * Changes the state of a given controller.
 * It will also make sure to "save" the old session.
 **/
export async function changeStateService(cidToMove: string, position: string, callsign: string) {
    const ctrl: IActivity = {
        cid: cidToMove,
        position: position,
        callsign: callsign,
        in_list: determineStateService(position)
    };

    await deleteState(ctrl.cid);
    return await stateChange(ctrl);
}

/** Add new controller + moves it to pause state */
export async function createControllerService(cid: string, name: string, sign: string, rating: Rating, endorsement: string) {
    // check cid.
    if (6 > cid.length && cid.length > 8) {
        // TODO add error msg.
        console.error(cid, "CID not valid. The length of cid: ", cid.length);
        return undefined; // not valid cid must be between 6-7 numbers.
    }
    
    const endorsements = parseEndorsement(endorsement);

    const newctrl: NewController = {
        cid: cid,
        name: name,
        sign: sign,
        rating: rating,
        endorsement: endorsements
    }
    // add controller to controller table.
    let createControllerResult;
    try {
        createControllerResult = await addController(newctrl);
    } catch {
        console.error("controller", cid, "already exists.");
        return undefined;
    }
    if (createControllerResult.rowCount == null || createControllerResult.rowCount < 0) {
        console.error("failed to add", cid , "not valid.");
        return undefined;
    }

    // change state to pause.

    const firstActivity: IActivity = {
        cid: cid,
        in_list: "PAUSE"
    };

    const movePauseResult = await stateChange(firstActivity);
    if (movePauseResult.rowCount == null || movePauseResult.rowCount < 0) {
        console.error("failed to move", cid , " to pause");
        return undefined;
    }

    return {created: newctrl};

}

/** Parses endorsement string to list of Endorsements. Will return empty if no endorsement given */
export const parseEndorsement = (endorsement: string | string[]): Endorsement[]  => {
    let endorsementls: Endorsement[] = [];
    if (typeof(endorsement) === 'string') {
        if (endorsement.match('T2 APS')?.length == 1) {
            endorsementls.push("T2 APS");
        }
        if (endorsement.match('T1 TWR')?.length == 1) {
            endorsementls.push("T1 TWR");
        }
        if (endorsement.match('T1 APP')?.length == 1) {
            endorsementls.push("T1 APP");
        }
    } else {
        if (endorsement.includes("T2 APS")) {
            endorsementls.push("T2 APS");
        } 
        if (endorsement.includes("T1 TWR")) {
            endorsementls.push("T1 TWR");
        }
        if (endorsement.includes("T1 APP")) {
            endorsementls.push("T1 APP");
        }
    }

    return endorsementls;
};

/** Removes controller as active. CID is checked that its already active */
export async function removeControllerAsActiveService(removeCID: string) {
    return deleteState(removeCID);
}