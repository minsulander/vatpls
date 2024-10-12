import { Request, Response } from 'express';
import { query_database } from '../db/database';

type State = "ACTIVE" | "PAUSE" | "OTHER";

export async function getActivityList(req: Request, res: Response) {
    try {
        const { list } = req.query;
        const state = isState(list);
        
        if (!state) {
            const result = await getAllLists();
            if (!result || !result.rowCount) return res.status(400).json({error: "Failed getting all lists"});
            const orderedresult = orderIntoSeperateLists(result.rowCount, result.rows);
            console.log(orderedresult);
            return res.status(200).json(orderedresult);
        };

        const result = await query_database(
            `SELECT cid FROM active WHERE in_list = $1`,
            [state]
        );
        
        return res.status(200).json({ result: result });
        
    } catch (error: any) {
        return res.status(500).json({error: error.message });
    }   
}

// This might be unnessecery, but keeping until further.
/**
 * Delete an activity from the active table in database.
 * It expects a VALID cid in request body. If not valid
 * returns an error.
 * @param req 
 * @param res 
 * @returns status code + json.
 */
export async function deleteActivityList(req: Request, res: Response) {
    const { cid } = req.body;

    if (!cid) return res.status(400).json({ error: "Please include cid field in the body."})
    try {

        const success = await removeActivityFromList(cid);

        return res.status(200).json({ 
            removed: success,
            user: cid
         });
        
    } catch (error: any) {
        return res.status(500).json({error: error.message });
    }   
}

/**
 * Adds the given controller in the activity table
 * requires cid, 
 */
export async function addActivityList(req: Request, res: Response) {

    // Either we move controller to an active, paus or away list.
    // We require the cid, position and callsign.
    // Position is GG AD3 for example if its to be placed on active list.
    // If position is "paus" or "other" controller will be moved to that list instead.
    const { activeControllers, availableControllers, awayControllers, moved } = req.body;
    // if (!moved.cid || !moved.position ) return res.status(400).json({ error: "Please include cid and position field." });

    //This is the state where we move the controller.
    const listToPlaceIn = determineState(activeControllers, availableControllers, awayControllers, moved);
    if (!listToPlaceIn) return res.status(500).json({ error: "internal server error in finding state"});
    let updatedController;
    if (!activeControllers || !availableControllers || !awayControllers) {
        updatedController = moved;
    } else {
      updatedController = findNewController(activeControllers, availableControllers, awayControllers, moved); 
    }

    try {
        // Only one entry per controller is allowed, so we remove the old entry first.
        await removeActivityFromList(updatedController.cid);
        let result;

        if (listToPlaceIn != "ACTIVE") {
            // We don't place into an active position here, so we only need CID and position.
            const values = [updatedController.cid, updatedController.position, listToPlaceIn];
            result = await query_database(
                `
                    INSERT INTO active 
                    (cid, position, session_start, in_list) VALUES
                    ($1, $2, NOW(), $3)

                `, values);

        } else {
            const values = [updatedController.cid, updatedController.callsign, updatedController.position, listToPlaceIn, ];
            
            result = await query_database(
                `
                    INSERT INTO active VALUES
                    ($1, $2, $3, NOW(), $4)
                `, values);
        }
        return res.status(200).json({ result });

        
    } catch (error: any) {
        return res.status(500).json({error: error.message });
    }   
}

const getAllLists = async () => {
    return await query_database(
        `
        select 
        controller.controller_name as name,
        controller.sign,
        active.cid,
        active.callsign,
        '123.45' as frequency,
        active.position,
        controller.controller_rating as rating,
        active.session_start as timestamp,
        active.in_list
        from controller, active
        WHERE controller.cid = active.cid;
    `
    );
};

const removeActivityFromList = async (cid: string): Promise<boolean> => {
    try {
        const result = await query_database(
            `
                DELETE FROM active
                WHERE cid = $${1};
            `,
            [cid]
        );

        // No changes were made 
        if (result.rowCount == 0) {
            return false;
        }

        return true;
        
    } catch (error) {
        throw error;
    }
};

const orderIntoSeperateLists = (rowCount: number, rows: any[]) => {
    let activeControllers: any = [];
    let availableControllers:any = [];
    let awayControllers:any = [];
    rows.map((ctrl, idx) => {
       if (ctrl.in_list === 'ACTIVE') {
        activeControllers.push(ctrl);
       } else if (ctrl.in_list === 'PAUSE') {
        availableControllers.push(ctrl);
       } else {
        awayControllers.push(ctrl);
       }
    });
    return {activeControllers, availableControllers, awayControllers};
};

const isState = (str: any): State | undefined => {
    if (!str) return undefined;
    str = str.toString().toUpperCase();

    if (str === "ACTIVE" || str === "PAUSE" || str === "OTHER") {
        return str as State;
    }
    return undefined;
};

// Position will be paus or other, if moving to that state.. otherwise ACTIVE position.
const determineState = (active: any[], avail: any[], away: any[], moved: any): State  | undefined => {

    if (active || avail || away) {
        if (active.find((ctrl) => ctrl.cid === moved.cid)) { 
            return 'ACTIVE';
        } else if (avail.find((ctrl) => ctrl.cid === moved.cid)) {
            console.log("should be here in pause")
            return "PAUSE";
        } else if (away.find((ctrl) => ctrl.cid === moved.cid)){
            return "OTHER";
        }
    } else {
       if(moved.position.toString().toUpperCase() == "OTHER") return "OTHER";
       else if (moved.position.toString().toUpperCase() == "PAUSE") return "PAUSE";
       else return "ACTIVE";
    }
};

const findNewController = (activeControllers:any , availableControllers: any, awayControllers: any, moved: any) => {
    return (
        activeControllers.find((ctrl: any) => ctrl.cid === moved.cid) ||
        availableControllers.find((ctrl:any) => ctrl.cid === moved.cid) ||
        awayControllers.find((ctrl: any) => ctrl.cid === moved.cid)
    );
}