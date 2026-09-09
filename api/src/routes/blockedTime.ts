import { Router, Request, Response } from "express"
import { createBlockedTimeHandler, getBlockedTimesHandler, deleteBlockedTimeHandler } from "../controllers/blockedTime"

const blockedTimeRoute = Router()

// Get all blocked times, optionally filtered by day
blockedTimeRoute.get("/blocked-time", (req: Request, res: Response) => {
    Promise.resolve(getBlockedTimesHandler(req, res))
})

// Create a new blocked time
blockedTimeRoute.post("/blocked-time", (req: Request, res: Response) => {
    Promise.resolve(createBlockedTimeHandler(req, res))
})

// Delete a blocked time by ID
blockedTimeRoute.delete("/blocked-time/:id", (req: Request, res: Response) => {
    Promise.resolve(deleteBlockedTimeHandler(req, res))
})

export default blockedTimeRoute
