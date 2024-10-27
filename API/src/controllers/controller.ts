import { Request, Response } from 'express';
import { query_database } from '../db/database';
import { 
    activeControllersService,
    predefinedControllersService, 
    changeStateService, 
    getControllerByCIDService,
    getControllerStateService 
} from '../services/controllerServices';
import { Controller } from '../types/types';

export async function getAllControllersHandler(req: Request, res: Response) {
    try {
        const data = await activeControllersService();
        res.status(200).json(data);
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        } else {
            res.status(500).json({ error: "Unkown error"});
        }
    }
};

export async function getPredefinedControllersHandler(req: Request, res: Response) {
    try {
        const data = await predefinedControllersService();
        res.status(200).json(data);
    } catch (error) {
        const { customCode, errorObj } = retrieveError(500, error);
        res.status(customCode).json(errorObj);
    }
}

/** 
 * Changes state of given controller
 * @postcondition must be an active controller in any of the three lists (position, break, other).
 */
export async function postController(req: Request, res: Response) {
    // Check if the given body is valid.
    //      It can be the full body.
    //      It can be the shortened version.

    const InputReadable = validateInputControllerData(req.body);
    if (!InputReadable) {
        res.status(400).json({ 
            error: "Body does not include the needed information"
        });
        return;
    }

    // validPrompt - The given input links to a controller in the database. 
    const validPrompt = await getControllerByCIDService(req.body.Controller.cid);

    // validController - Controller type
    const validController = convertDBResponseToController(validPrompt);

    if (validPrompt == undefined || validController == undefined) {
        res.status(500).json({ error: "Controller was not found in the database."})
        return;
    }

    // Control that the controller is in a active state (Position, break or other).
    // Also check that the controller is not already in the state that we move that controller too.
    const {isActive, activeState} = await getActiveStatus(validController.cid);
    if (!isActive && activeState == validController.position) {
        res.status(400).json({ error: "Controller is either not active or in same state." });
        return;
    }

    // Validation complete -> change the state.

    try {
        const updatedController = changeStateService(validController)
        res.status(201).json({ updated: updatedController});

    } catch (Error) {
        const {customCode, errorObj } = retrieveError(500, Error);
        res.status(customCode).json({ error: errorObj.message });
    }

}

export async function getOneController(req: Request, res: Response) {
    try {
        const result = await query_database(
            "SELECT * FROM Controller WHERE cid = $1",
            [req.params.id.toString()]
        );

        return res.json({ rowCount: result.rowCount, rows: result.rows });
    } catch (error: any) {
        return res.status(500).json({error: error.message });
    }   
}

/** Add controller, old way */
export async function addController(req: Request, res: Response) {

    const {cid, name, sign, rating} = req.body;

    if (!cid && !name) return res.status(400).json({ error: "Include CID and name in the body."})
       // cid   |  controller_name  | sign | controller_rating
    try {
        const result = await query_database(`
            INSERT INTO Controller (cid, controller_name, sign, controller_rating)
            VALUES ($1, $2, $3, $4);
        `, [cid, name, sign, rating]);

        console.log("Added user: ", cid);
        return res.json({ rowCount: result.rowCount, rows: result.rows });
    } catch (error: any) {
        return res.status(500).json({error: error.message });
    }
}

/** Edit a controller */
export async function editController(req: Request, res: Response) {
    const {name, rating, sign}: {name?: string; rating?: string, sign?: string} = req.body;
    const cid = req.params.id;
    
    try {
        // Check that the given CID actually exists, can't edit a controller that does not exist.
        if (!checkControllerExists(cid)) return res.status(400).json({ error: "Controller CID does not exist"})

        // Dynamic query, only adding those values that was provided in the request to the query.
        const {query, values } = buildUpdateQuery(name, sign, rating, cid);
        if (values.length == 1) return res.status(400).json({ error: "No fields to update."});
        values.push(cid);

        const result = await query_database(query, values);

        return res.json({  rowCount: result.rowCount, rows: result.rows  });
    } catch (error: any) {
        return res.status(500).json({error: error.message });
    }
}

const buildUpdateQuery = (name: string | undefined, sign: string | undefined, rating: string | undefined, cid: string) => {
    const values: string[] = [];
    const updateString: string[] = [];
    let index = 1;

    if (name) {
        updateString.push(`controller_name = $${index++}`);
        values.push(name);
    }
    if (sign) {
        updateString.push(`sign = $${index++}`);
        values.push(sign);
    }
    if (rating) {
        updateString.push(`controller_rating = $${index++}`);
        values.push(rating);
    }

    const query =`  
        UPDATE Controller SET
        ${updateString.join(", ")}
        WHERE cid = $${index}  
        `;
    return { query, values }
};

const checkControllerExists = async (cid: string) => {
    const controller = await query_database(
        "SELECT * FROM Controller WHERE cid = $1",
        [cid]
    );
    
    if (!isNaN(Number(controller.rowCount)) && Number(controller.rowCount) == 0) {
        return false;
    }

    return true;
};

const retrieveError = (code: number, error: unknown): {customCode: number, errorObj: Error | { message: string}} => {
    if (error instanceof Error) {
        return { customCode: code, errorObj: error};
    } else {
        const err = {
            message: "Unknown error"
        };

        return { customCode: code, errorObj: err}
    }
}

/** Uses the provided CID to retrieve controller information + appends position, callsign information */
export function validateInputControllerData(requestBody: any): boolean {
    const { Controller } = requestBody;

    if (!Controller || !Controller.cid) {
        return false;
    }

    return true;
}

export const convertDBResponseToController = (dbResponse: any): Controller | undefined => {
    
    if (!dbResponse) return undefined;


    return {
        name: "test",
        sign: "TT",
        cid: "1122334",
        rating: "S3",
        callsign: "na",
        position: "na",
        frequency: "123.45",
        timestamp: new Date().toISOString()
    };

};

const checkControllerNewState = (controller: Controller): boolean => {
    return false;
};

const getActiveStatus = async (cid: string): Promise<{isActive: boolean, activeState: string}> => {
    const databaseResponse = await getControllerStateService(cid);

    if (databaseResponse) {
        return { isActive: true, activeState: ""};
    }

    return {isActive: false, activeState: ""}

}