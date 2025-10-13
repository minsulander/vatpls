import { query, Request, Response } from "express"
import { query_database } from "../db/database"

export async function getHistory(req: Request, res: Response) {
    const { day } = req.query

    if (!day) {
        return res.status(400).json({ error: "Day of requested history is required." })
    }

    try {
        // session_id |   cid   | position | callsign |       session_start        |        session_end
        // ------------+---------+----------+----------+----------------------------+----------------------------
        //           1 | 1122334 |          |          | 2025-10-01 06:08:10.350161 | 2025-10-01 06:08:52.789032
        //           2 | 1234567 | pause    | pause    | 2025-10-01 06:07:35.099932 | 2025-10-01 06:09:00.065021
        //           3 | 1122334 | GG APP   | GG APP   | 2025-10-01 06:08:52.791562 | 2025-10-02 06:05:04.16611
        //           4 | 1283706 |          |          | 2025-10-01 06:07:26.321178 | 2025-10-02 06:05:08.945744

        const result = await query_database(
            `
                SELECT 
                    session_id,
                    cid,
                    position,
                    callsign,
                    session_start AT TIME ZONE 'UTC' as session_start,
                    session_end AT TIME ZONE 'UTC' as session_end
                FROM session 
                WHERE session_start::date = $1::date OR session_end::date = $1::date;
            `,
            [day]
        )

        // Force UTC formatting to prevent timezone issues
        const sessions = result.rows.map((row) => ({
            ...row,
            session_start: new Date(row.session_start).toISOString(),
            session_end: new Date(row.session_end).toISOString(),
        }))

        return res.status(200).json({ sessions, length: result.rowCount })
    } catch (error: any) {
        return res.status(500).json({ error: error.message })
    }
}
