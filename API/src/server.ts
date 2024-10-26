import cors from "cors";
import express from "express";

import controllersRoute from './routes/controllers';
import activityRoute from "./routes/activity";
import sessionsRoute from "./routes/sessions";
import devRoute from "./routes/development";

import { getAllControllers } from "./routes/development";

const DEV_MODE = true; // set to true if use system without database, otherwise set false.

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
    app.use("/api", devRoute)
} else {
    app.use("/api", controllersRoute);
    //app.use("/api", activityRoute);
    //app.use("/api", sessionsRoute);
}

/** Synchronizing controller cards */
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

    let idx = 0;
    while (true) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const ctrlData = getAllControllers();


        res.write(`data: ${JSON.stringify(ctrlData)}\n\n`);


        if (connection == "closed") break;
    }

});

// Start the server
app.listen(port, async () => {
    console.log(`Server is running on http://localhost:${port}`);

});
