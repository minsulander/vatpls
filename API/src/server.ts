import cors from "cors";
import express from "express";

import controllersRoute from './routes/controllers';
import activityRoute from "./routes/activity";
import sessionsRoute from "./routes/sessions";
import devRoute from "./routes/development";

import { getAllControllers } from "./routes/development";
import { activeControllersService } from "./services/controllerServices";
import { sortControllers } from "./controllers/controller";

import { query_database } from "./db/database";
import authRouter from "./routes/auth";

const DEV_MODE = false; // set to true if use system without database, otherwise set false.

const app = express();
const port = 3001;

app.use(express.json());
app.use(cors());

// Set UTF-8 encoding for all responses
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    next();
});

if (DEV_MODE) {
    app.use("/api", devRoute, authRouter);
} else {
    console.log("database in use");
    try {
        query_database("SELECT 1;")
            .then(() => console.log("Connected to database"))
            .catch(e => console.error("Database error:", e))
    } catch (e) {
        console.error(e);
    }
    app.use("/api", controllersRoute, authRouter);
    app.use("/api", sessionsRoute);
    //app.use("/api", activityRoute);
}

/** 
 * Synchronizing controller cards
 * TODO: only send updates when updates happen.
 */
app.get('/subscribe', async (req, res) => {
    res.set({
        'Cache-Control': 'no-cache',
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive'
    });

    let connection = "open"
    console.log("Client connected.");
    req.on('close', () => {
        console.log("Client disconnect.");
        connection = "closed"
        res.end();
    });

    res.write('retry: 10000\n\n');

    while (true) {
        await new Promise(resolve => setTimeout(resolve, 5000));

        const ctrlData = sortControllers(await activeControllersService());
        if (ctrlData) {
            res.write(`data: ${JSON.stringify(ctrlData)}\n\n`);
        }

        if (connection == "closed") break;
    }
});

// Start the server
app.listen(port, async () => {
    console.log(`Server is running on http://localhost:${port}`);
});
