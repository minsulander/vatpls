import { Request, Response } from 'express';
import { query_database } from '../db/database';

type State = "ACTIVE" | "PAUSE" | "OTHER";

export async function getActivityList(req: Request, res: Response) {
    try {
        // This can handle multiple different queries:
        // ?list=active, ?list=paused, ?list=other
        const { list } = req.query;
        const state = isState(list);
        
        if (!state) {
            const result = await getAllLists();

            if (!result || !result.rowCount) {
                return res.status(400).json({error: "Failed getting all lists"});
            }    

            const orderedresult = orderIntoSeperateLists(result.rowCount, result.rows);

            return res.status(200).json(orderedresult);
        }

        // We have a valid state, list querry was filled with valid value -> 
        // Therefore only get list with controllers in that given state.

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
// Maybe not? Should be used when a controller 'logs off'.
export async function deleteActivityList(req: Request, res: Response) {
    const { cid } = req.body;

    if (!cid) {
        return res.status(400).json(
            { error: "Please include cid field in the body."}
        );
    }
    
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

    const { activeControllers, availableControllers, awayControllers, moved } = req.body;

    // if (!moved.cid || !moved.position ) return res.status(400).json({ error: "Please include cid and position field." });

    //This is the state where we move the controller.
    const listToPlaceIn = determineState(
        activeControllers, 
        availableControllers, 
        awayControllers, 
        moved
    );

    if (!listToPlaceIn){ 
        return res.status(500).json(
            { error: "internal server error in finding state"}
        );
    }
    const updatedController = findUpdatedController(
        activeControllers, 
        availableControllers, 
        awayControllers, 
        moved, 
        listToPlaceIn
    );

    try {
        // Only one entry per controller is allowed, so try we remove the old entry first.
        // It does not matter if the controller has no active state, nothing will happen.
        await removeActivityFromList(updatedController.cid);
        let result;

        if (listToPlaceIn != "ACTIVE") {
            // We don't place into an active position here, so we only need CID and position.
            if (!updatedController.callsign) updatedController.callsign = listToPlaceIn.toString().toLocaleLowerCase();
            if (!updatedController.position) updatedController.position = listToPlaceIn.toString().toLocaleLowerCase();

            const values = [updatedController.cid, updatedController.position, listToPlaceIn];

            result = await query_database(
                `
                    INSERT INTO active 
                    (cid, position, session_start, in_list) VALUES
                    ($1, $2, NOW(), $3)

                `, values);

        } else {
            const values = [
                updatedController.cid, 
                updatedController.callsign, 
                updatedController.position, 
                listToPlaceIn
            ];
            
            
            result = await query_database(
                `
                    INSERT INTO active VALUES
                    ($1, $2, $3, NOW(), $4)
                `, values);
        }
        
        console.log("Successfully moved: ", updatedController.cid, " -> ", listToPlaceIn);

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
        coalesce (active.callsign, 'N/A') as callsign,
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
/** Organizes all table rows into lists like the frontend expects it. */
const orderIntoSeperateLists = (rowCount: number, rows: any[]) => {
    let activeControllers: any = [];
    let availableControllers:any = [];
    let awayControllers:any = [];

    rows.map((ctrl) => {
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
const determineState = (
    active: any[], 
    avail: any[], 
    away: any[], 
    moved: any
): State  | undefined => {

    if (active || avail || away) {
        if (active.find((ctrl) => ctrl.cid === moved.cid)) { 
            return 'ACTIVE';
        } else if (avail.find((ctrl) => ctrl.cid === moved.cid)) {
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

/** Helper function for findUpdatedController */
const findNewController = (
    activeControllers:any , 
    availableControllers: any, 
    awayControllers: any, 
    moved: any
) => {
    return (
        activeControllers.find((ctrl: any) => ctrl.cid === moved.cid) ||
        availableControllers.find((ctrl:any) => ctrl.cid === moved.cid) ||
        awayControllers.find((ctrl: any) => ctrl.cid === moved.cid)
    );
}

const findUpdatedController = (
    activeControllers: any, 
    availableControllers: any, 
    awayControllers: any, 
    moved: any, 
    newState: State) => {
    
    return (!activeControllers || !availableControllers || !awayControllers 
        ? moved 
        : findNewController(activeControllers, availableControllers, awayControllers, moved));
}