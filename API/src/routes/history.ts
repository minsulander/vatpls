import { Router, Request, Response } from "express"
import { getHistory } from "../controllers/history"
const historyRoute = Router()

historyRoute.get("/history", (req: Request, res: Response) => {
    Promise.resolve(getHistory(req, res))
})

export default historyRoute
