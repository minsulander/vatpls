import cors from "cors";
import express from "express";

import controllersRoute from './routes/controllers';
import activityRoute from "./routes/activity";
import sessionsRoute from "./routes/sessions";
import devRoute from "./routes/development";

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
    app.use("/api", activityRoute);
    app.use("/api", sessionsRoute);
}

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
