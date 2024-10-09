import { Request, Response } from 'express';
import { query_database } from '../db/database';


export async function getSessions(req: Request, res: Response) {
    try {
        return res.status(501).json({ error: "not yet implemented" });

    } catch (error: any) {
        return res.status(500).json({error: error.message });
    }   
}
export async function postSession(req: Request, res: Response) {
    try {
        return res.status(501).json({ error: "not yet implemented" });

    } catch (error: any) {
        return res.status(500).json({error: error.message });
    }   
}