import cors from "cors"
import express from "express"

import controllersRoute from "./routes/controllers"
import activityRoute from "./routes/activity"
import sessionsRoute from "./routes/sessions"
import devRoute from "./routes/development"

import { getAllControllers } from "./routes/development"
import { activeControllersService } from "./services/controllerServices"
import { sortControllers } from "./controllers/controller"

import { query_database } from "./db/database"
import { runMigrations } from "./db/migrate"
import authRouter from "./routes/auth"
import historyRoute from "./routes/history"
import blockedTimeRoute from "./routes/blockedTime"
import notepadRoute from "./routes/notepad"

const DEV_MODE = false // set to true if use system without database, otherwise set false.

const app = express()
const port = 3001

app.use(express.json())
app.use(cors())

// Set UTF-8 encoding for all responses
app.use((req, res, next) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8")
    next()
})

if (DEV_MODE) {
    app.use("/api", devRoute, authRouter)
} else {
    console.log("database in use")

    app.use("/api", controllersRoute, authRouter)
    app.use("/api", sessionsRoute)
    app.use("/api", historyRoute)
    app.use("/api", blockedTimeRoute)
    app.use("/api", notepadRoute)
    //app.use("/api", activityRoute);
}

export const initializeDatabase = async (): Promise<void> => {
    await query_database("SELECT 1;")
    console.log("Connected to database")
    await runMigrations()
}

/**
 * Synchronizing controller cards
 * TODO: only send updates when updates happen.
 */
app.get("/subscribe", async (req, res) => {
    res.set({
        "Cache-Control": "no-cache",
        "Content-Type": "text/event-stream",
        Connection: "keep-alive",
    })

    let connection = "open"
    console.log("Client connected.")
    req.on("close", () => {
        console.log("Client disconnect.")
        connection = "closed"
        res.end()
    })

    res.write("retry: 10000\n\n")

    while (true) {
        await new Promise((resolve) => setTimeout(resolve, 5000))

        const ctrlData = sortControllers(await activeControllersService())
        if (ctrlData) {
            res.write(`data: ${JSON.stringify(ctrlData)}\n\n`)
        }

        if (connection == "closed") break
    }
})

app.get("/subscribe-long", async (req, res) => {
    res.set({
        "Cache-Control": "no-cache",
        "Content-Type": "text/event-stream",
        Connection: "keep-alive",
    })

    let connection = "open"
    console.log("Long client connected.")
    req.on("close", () => {
        console.log("Long client disconnect.")
        connection = "closed"
        res.end()
    })

    res.write("retry: 10000\n\n")

    while (true) {
        await new Promise((resolve) => setTimeout(resolve, 10000))

        const ctrlData = sortControllers(await activeControllersService())
        if (ctrlData) {
            res.write(`data: ${JSON.stringify(ctrlData)}\n\n`)
        }

        if (connection == "closed") break
    }
})

export const startServer = async (): Promise<void> => {
    if (!DEV_MODE) {
        await initializeDatabase()
    }

    await new Promise<void>((resolve, reject) => {
        const server = app.listen(port)
        server.once("error", reject)
        server.once("listening", () => {
            server.off("error", reject)
            console.log(`Server is running on http://localhost:${port}`)
            resolve()
        })
    })
}

if (require.main === module) {
    void startServer().catch((error) => {
        console.error("Server startup failed:", error)
        process.exit(1)
    })
}
