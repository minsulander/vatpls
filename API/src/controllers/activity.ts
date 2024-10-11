import { Request, Response } from 'express';
import { query_database } from '../db/database';

type State = "ACTIVE" | "PAUSE" | "OTHER";

export async function getActivityList(req: Request, res: Response) {
    try {
        const { list } = req.query;
        const state = isState(list);
        
        if (!state) {
            const result = await getAllLists();
            console.log(result);
            return res.status(200).json(result);
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
 * Adds the given controller in the activity table.
 * @param req 
 * @param res 
 * @returns 
 */
export async function addActivityList(req: Request, res: Response) {
    const { cid, position } = req.body;
    if (!cid || !position) return res.status(400).json({ error: "Please include cid and position field." });
    const active_state = determineState(position);

    try {
        await removeActivityFromList(cid);
        let result;

        if (active_state != "ACTIVE") {
            const values = [cid, active_state];
            result = await query_database(
                `
                    INSERT INTO active 
                    (cid, session_start, in_list) VALUES
                    ($1, NOW(), $2)
                `, values);

        } else {
            const values = [cid, position, active_state];
            result = await query_database(
                `
                    INSERT INTO active VALUES
                    ($1, $2, NOW(), $3)
                `, values);
        }
        return res.status(200).json({ result });

        
    } catch (error: any) {
        return res.status(500).json({error: error.message });
    }   
}

const getAllLists = async () => {
    const result = await query_database(
        `SELECT * FROM active`
    );

    console.log(result);
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

const isState = (str: any): State | undefined => {
    if (!str) return undefined;
    str = str.toString().toUpperCase();

    if (str === "ACTIVE" || str === "PAUSE" || str === "OTHER") {
        return str as State;
    }
    return undefined;
};

// Position will be paus or other, if moving to that state.. otherwise ACTIVE position.
const determineState = (str: string): State => {
    if(str.toLowerCase() === "paus") return "PAUSE";
    if(str.toLowerCase() === "other") return "OTHER";
    else return "ACTIVE"
};