const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(bodyParser.json());
app.use(cors());

// Set UTF-8 encoding for all responses
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    next();
});

// In-memory storage for controllers
let activeControllers = [];
let availableControllers = [
    { name: 'Controller One', sign: 'CO', CID: '123456', rating: 'S1', callsign: 'CTR1', frequency: '123.45', position: 'Ground', timestamp: new Date().toISOString() },
    { name: 'Controller Two', sign: 'CT', CID: '654321', rating: 'S2', callsign: 'CTR2', frequency: '124.45', position: 'Tower', timestamp: new Date().toISOString() },
    { name: 'Controller Three', sign: 'CT', CID: '789012', rating: 'S3', callsign: 'CTR3', frequency: '125.45', position: 'Approach', timestamp: new Date().toISOString() },
];
let awayControllers = [];

// Define existing controllers that are already added
let predefinedControllers = [
    { name: 'Test1', sign: 'T1', CID: '821932', rating: 'S1', callsign: 'CTR1', frequency: '123.45', position: 'Ground', timestamp: new Date().toISOString() },
    { name: 'Test2', sign: 'T2', CID: '931204', rating: 'C1', callsign: 'CTR2', frequency: '123.90', position: 'Ground', timestamp: new Date().toISOString() }
]

// GET route to retrieve controllers
app.get('/api/controllers', (req, res) => {
    res.json({
        activeControllers,
        availableControllers,
        awayControllers,
    });
});

app.get('/api/predefined', (req, res) => {
    res.json(predefinedControllers)
});

// POST route to update controllers
app.post('/api/controllers', (req, res) => {
    const {
        activeControllers: newActiveControllers,
        availableControllers: newAvailableControllers, 
        awayControllers: newAwayControllers,
        moved: movedController
    } = req.body;

    if (Array.isArray(newActiveControllers) 
        && Array.isArray(newAvailableControllers) 
        && Array.isArray(newAwayControllers)
    ) {
        // Update the controller data
        activeControllers = newActiveControllers.map((controller) => {
            // Only update thte timestamp of the movedController, otherwise we just keep it as it was.

            return controller.CID === movedController.CID
            ? {...controller, timestamp: new Date().toISOString() } // Reset timestamp when moving to active
            : controller;
        });
        availableControllers = newAvailableControllers.map(controller => {
            // Only update thte timestamp of the movedController, otherwise we just keep it as it was.

            return controller.CID === movedController.CID
            ? {...controller, timestamp: new Date().toISOString() } // Reset timestamp when moving to paus
            : controller;
        });
        awayControllers = newAwayControllers.map(controller => {
            // Only update thte timestamp of the movedController, otherwise we just keep it as it was.

            return controller.CID === movedController.CID
            ? {...controller, timestamp: new Date().toISOString() } // Reset timestamp when moving to other
            : controller;
        });

        res.status(200).send('Controllers updated successfully');
    } else {
        res.status(400).send('Invalid data');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
