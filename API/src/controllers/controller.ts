import { Request, Response } from 'express';
import { query_database } from '../db/database';

export async function getAllControllers(req: Request, res: Response) {
    try {
        const result = await query_database(
            `
            SELECT 
            cid, controller_name as name, sign, controller_rating as rating 
            FROM controller;
            `);

        return res.json({ Controllers: result.rows });

    } catch (error: any) {
        return res.status(500).json({error: error.message });
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