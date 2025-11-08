import { Request, Response } from "express"
import { createBlockedTime, getBlockedTimes, deleteBlockedTime } from "../db/database"
import { NewBlockedTime } from "../types/types"

export async function createBlockedTimeHandler(req: Request, res: Response) {
    const { cid, position, blocked_start, blocked_end, reason, notes } = req.body

    if (!cid || !position || !blocked_start || !blocked_end || !reason) {
        return res.status(400).json({
            error: "Missing required fields: cid, position, blocked_start, blocked_end, and reason are required.",
        })
    }

    const startTime = new Date(blocked_start)
    const endTime = new Date(blocked_end)

    if (endTime <= startTime) {
        return res.status(400).json({
            error: "blocked_end must be after blocked_start",
        })
    }

    try {
        const newBlockedTime: NewBlockedTime = {
            cid,
            position,
            blocked_start,
            blocked_end,
            reason,
            notes,
        }

        const result = await createBlockedTime(newBlockedTime)

        const blockedTime = {
            ...result.rows[0],
            blocked_start: new Date(result.rows[0].blocked_start).toISOString(),
            blocked_end: new Date(result.rows[0].blocked_end).toISOString(),
            created_at: new Date(result.rows[0].created_at).toISOString(),
        }

        return res.status(201).json({ blockedTime })
    } catch (error: any) {
        console.error("Error creating blocked time:", error)

        if (error.code === "23503") {
            return res.status(400).json({ error: "Invalid CID: Controller does not exist" })
        }

        return res.status(500).json({ error: error.message })
    }
}

export async function getBlockedTimesHandler(req: Request, res: Response) {
    const { day } = req.query

    try {
        const result = await getBlockedTimes(day as string | undefined)

        // Format timestamps for response
        const blockedTimes = result.rows.map((row) => ({
            ...row,
            blocked_start: new Date(row.blocked_start).toISOString(),
            blocked_end: new Date(row.blocked_end).toISOString(),
            created_at: new Date(row.created_at).toISOString(),
        }))

        return res.status(200).json({ blockedTimes, count: result.rowCount })
    } catch (error: any) {
        console.error("Error fetching blocked times:", error)
        return res.status(500).json({ error: error.message })
    }
}

export async function deleteBlockedTimeHandler(req: Request, res: Response) {
    const { id } = req.params

    if (!id) {
        return res.status(400).json({ error: "Block ID is required" })
    }

    try {
        const result = await deleteBlockedTime(parseInt(id, 10))

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Blocked time not found" })
        }

        return res.status(200).json({ message: "Blocked time deleted successfully" })
    } catch (error: any) {
        console.error("Error deleting blocked time:", error)
        return res.status(500).json({ error: error.message })
    }
}
