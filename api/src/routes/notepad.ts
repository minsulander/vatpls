import { Router } from "express"

const router = Router()

// just local for now
let notepadContent = "Detta är en placeholder text för WS meddelanden.\n\nDenna data ska senare sparas i databasen."

router.get("/notepad", (req, res) => {
    res.json({
        content: notepadContent,
    })
})

router.post("/notepad", (req, res) => {
    const { content } = req.body

    if (content === undefined) {
        res.status(400).json({ error: "Content is required" })
    } else {
        notepadContent = content
        res.json({
            success: true,
            content: notepadContent,
        })
    }
})

export default router
