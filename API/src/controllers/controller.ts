import { Request, Response } from 'express';
import { query_database } from '../db/database';

// getting all controllers in list.
export async function getControllers(req: Request, res: Response) {
    try {
        const result = await query_database("SELECT * FROM Controller;");

        return res.json({ rowCount: result.rowCount, rows: result.rows });
    } catch (error: any) {
        return res.status(500).json({error: error.message });
    }   
}

// getting singular controller
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

export async function addController(req: Request, res: Response) {
    try {
        const result = await query_database(`
            INSERT INTO Controller VALUES
            ('1234567', 'Controller One', 'CO', 'S3')
        `);
        return res.json({ result });
    } catch (error: any) {
        return res.status(500).json({error: error.message });
    }
}

export async function editController(req: Request, res: Response) {
    const {name, rating, sign} = req.body;
    const cid = req.params.id;

    try {
        const controller = await query_database(
            "SELECT * FROM Controller WHERE cid = $1",
            [req.params.id.toString()]
        );
        
        if (!isNaN(Number(controller.rowCount)) && Number(controller.rowCount) == 0) {
            return res.status(400).json({error: "Controller cid does not exist."})
        }
        let result;

        if (name) {
            result = await query_database(
                `
                UPDATE Controller
                SET controller_name = $1
                WHERE cid = $2
                `,
                [name, cid.toString()]  // Pass `name` and `cid` as parameters
            );
        }
        if (sign) {
            result = await query_database(
                `
                UPDATE Controller
                SET sign = $1
                WHERE cid = $2
                `,
                [sign, cid.toString()]  // Pass `name` and `cid` as parameters
            );
        }
        if (rating) {
            result = await query_database(
                `
                UPDATE Controller
                SET controller_rating = $1
                WHERE cid = $2
                `,
                [rating, cid.toString()]  // Pass `name` and `cid` as parameters
            );
        }

        return res.json({ result });
    } catch (error: any) {
        return res.status(500).json({error: error.message });
    }
}
