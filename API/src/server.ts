import cors from "cors";
import express from "express";

import controllersRoute from './routes/controllers';

interface Controller {
  name: string;
  sign: string;
  CID: string;
  rating: "S1" | "S2" | "S3" | "C1" | "C3";
  callsign: string;
  frequency: string;
  position?: string;
  timestamp: string;
};

const USE_PG_DATABASE = true;

const app = express();
const port = 3001;

app.use(express.json());
app.use(cors());

// Set UTF-8 encoding for all responses
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// In-memory storage for controllers
let activeControllers: Controller[] = [];
let availableControllers: Controller[] = [
  { name: 'Controller One', sign: 'CO', CID: '123456', rating: 'S1', callsign: 'CTR1', frequency: '123.45', position: 'Ground', timestamp: new Date().toISOString() },
  { name: 'Controller Two', sign: 'CT', CID: '654321', rating: 'S2', callsign: 'CTR2', frequency: '124.45', position: 'Tower', timestamp: new Date().toISOString() },
  { name: 'Controller Three', sign: 'CT', CID: '789012', rating: 'S3', callsign: 'CTR3', frequency: '125.45', position: 'Approach', timestamp: new Date().toISOString() },
];
let awayControllers: Controller[] = [];

// GET route to retrieve controllers
app.use("/v2", controllersRoute);
app.get('/api/controllers', (req: express.Request, res: express.Response) => {
  if (USE_PG_DATABASE) {
    // return getControllers(req, res);
  }
  res.json({
    activeControllers,
    availableControllers,
    awayControllers,
  });
});

// POST route to update controllers
app.post('/api/controllers', (req: express.Request, res: express.Response) => {
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
        ? { ...controller, timestamp: new Date().toISOString() } // Reset timestamp when moving to active
        : controller;
    });
    availableControllers = newAvailableControllers.map(controller => {
      // Only update the timestamp of the movedController, otherwise we just keep it as it was.

      return controller.CID === movedController.CID
        ? { ...controller, timestamp: new Date().toISOString() } // Reset timestamp when moving to paus
        : controller;
    });
    awayControllers = newAwayControllers.map(controller => {
      // Only update the timestamp of the movedController, otherwise we just keep it as it was.

      return controller.CID === movedController.CID
        ? { ...controller, timestamp: new Date().toISOString() } // Reset timestamp when moving to other
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
