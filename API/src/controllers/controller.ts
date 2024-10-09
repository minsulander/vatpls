import { Request, Response } from 'express';
import { query_database } from '../db/database';

// Is there something more interesting that we should return instead of rows & rowcount?


// Getting all controllers in list.
export async function getControllers(req: Request, res: Response) {
    try {
        const result = await query_database("SELECT * FROM Controller;");

        return res.json({ rowCount: result.rowCount, rows: result.rows });
    } catch (error: any) {
        return res.status(500).json({error: error.message });
    }   
}

// Getting singular controller
export async function getController(req: Request, res: Response) {
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

// Add controller.
// TODO take request parameters.
export async function addController(req: Request, res: Response) {

    const {cid, name} = req.body;

    if (!cid && !name) return res.status(400).json({ error: "Include CID and name in the body."})

    try {
        const result = await query_database(`
            INSERT INTO Controller (cid, controller_name)
            VALUES ($1, $2);
        `, [cid, name]);
        return res.json({ rowCount: result.rowCount, rows: result.rows });
    } catch (error: any) {
        return res.status(500).json({error: error.message });
    }
}

// Edit a controller.
export async function editController(req: Request, res: Response) {
    const {name, rating, sign} = req.body;
    const cid = req.params.id;
    
    // TODO make this try clause smaller (extract code)
    try {
        // Check that the given CID actually exists, can't edit a controller that does not exist.
        const controller = await query_database(
            "SELECT * FROM Controller WHERE cid = $1",
            [req.params.id.toString()]
        );
        
        if (!isNaN(Number(controller.rowCount)) && Number(controller.rowCount) == 0) {
            return res.status(400).json({error: "Controller cid does not exist."})
        }

        // Dynamic query, only adding those values that was provided in the request to the query.
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

        if (values.length == 0) return res.status(400).json({ error: "No fields to update."});

        values.push(cid.toString());

        const query =`  UPDATE Controller SET
                        ${updateString.join(", ")}
                        WHERE cid = $${index}   `

        const result = await query_database(query, values);

        return res.json({  rowCount: result.rowCount, rows: result.rows  });
    } catch (error: any) {
        return res.status(500).json({error: error.message });
    }
}
