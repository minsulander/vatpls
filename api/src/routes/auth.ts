import { Router } from "express";
import dotenv from "dotenv";

dotenv.config()

const authRouter = Router();

const pw = process.env.PLS_PASSWORD || "test";

authRouter.post("/auth", (req, res) => {
    if (req.body.password === pw) {
        res.json({ authorized: true });
    } else {
        res.status(401).json({ msg: "not authorized"});
    }
});

export default authRouter;