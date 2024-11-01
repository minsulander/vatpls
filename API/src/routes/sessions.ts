import { Router } from 'express';
import { getSessions, postSession } from '../controllers/session';

const sessionsRoute = Router();

/** Get the session threshold */
sessionsRoute.get("/session", (req, res) => {
    getSessions(req, res);
});

sessionsRoute.post("/session", (req, res) => {
    postSession(req, res);
});

export default sessionsRoute;