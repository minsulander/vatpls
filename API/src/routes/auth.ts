import { Router } from "express";
import dotenv from "dotenv";

dotenv.config()

const authRouter = Router();

authRouter.post("/auth", (req, res) => {
    const pw = process.env.PLS_PASSWORD || "test";
    if (req.body.password === pw) {
        console.log("authorized");
        res.status(200).json({ authorized: true});
    } else {
        // TODO
        res.status(200).json({ authorized: true});
        res.status(401).json({ msg: "not authorized"});
    }
});


export default authRouter;