import { Router, Request, Response } from 'express';

// Used during development if there is no need to interact with the database.

const devRoute = Router();

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

// In-memory storage for controllers
let activeControllers: Controller[] = [];
let availableControllers: Controller[] = [
  { name: 'Controller One', sign: 'CO', CID: '123456', rating: 'S1', callsign: 'CTR1', frequency: '123.45', position: 'Ground', timestamp: new Date().toISOString() },
  { name: 'Controller Two', sign: 'CT', CID: '654321', rating: 'S2', callsign: 'CTR2', frequency: '124.45', position: 'Tower', timestamp: new Date().toISOString() },
  { name: 'Controller Three', sign: 'CT', CID: '789012', rating: 'S3', callsign: 'CTR3', frequency: '125.45', position: 'Approach', timestamp: new Date().toISOString() },
];
let awayControllers: Controller[] = [];

devRoute.get('/controllers', (req: Request, res: Response) => {
    res.json({
      activeControllers,
      availableControllers,
      awayControllers,
    });
  });
  
  // POST route to update controllers
  devRoute.post('/controllers', (req: Request, res: Response) => {
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

  export default devRoute;