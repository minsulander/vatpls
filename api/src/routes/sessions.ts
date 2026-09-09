import { Router } from 'express';
import { getSessions, postSession } from '../controllers/session';

const sessionsRoute = Router();

/** Get the session threshold */
sessionsRoute.get("/sessionthreshold", (req, res) => {
    const result = {
        info: 90,
        warning: 120
    };
    res.status(200).json(result);
});

sessionsRoute.post("/session", (req, res) => {
    postSession(req, res);
});

export default sessionsRoute;