import { Router, Request, Response, json } from 'express';

// Used during development if there is no need to interact with the database.

interface Controller {
  name: string;
  sign: string;
  cid: string;
  rating: "S1" | "S2" | "S3" | "C1" | "C3";
  callsign: string;
  frequency: string;
  position?: string;
  timestamp: string;
};

const devRoute = Router();

// In-memory storage for controllers
let activeControllers: Controller[] = [];
let availableControllers: Controller[] = [
  { name: 'Controller One', sign: 'CO', cid: '123456', rating: 'S1', callsign: 'CTR1', frequency: '123.45', position: 'Ground', timestamp: new Date().toISOString() },
  { name: 'Controller Two', sign: 'CT', cid: '654321', rating: 'S2', callsign: 'CTR2', frequency: '124.45', position: 'Tower', timestamp: new Date().toISOString() },
  { name: 'Controller Three', sign: 'CT', cid: '789012', rating: 'S3', callsign: 'CTR3', frequency: '125.45', position: 'Approach', timestamp: new Date().toISOString() },
];
let awayControllers: Controller[] = [];

devRoute.get('/controllers', (req: Request, res: Response) => {
  res.json(getAllControllers());
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

    console.log("Now im expecting a list of all..")
    // Update the controller data
    activeControllers = newActiveControllers.map((controller) => {
      // Only update thte timestamp of the movedController, otherwise we just keep it as it was.

      return controller.cid === movedController.cid
        ? { ...controller, timestamp: new Date().toISOString() } // Reset timestamp when moving to active
        : controller;
    });
    availableControllers = newAvailableControllers.map(controller => {
      // Only update the timestamp of the movedController, otherwise we just keep it as it was.

      return controller.cid === movedController.cid
        ? { ...controller, timestamp: new Date().toISOString() } // Reset timestamp when moving to paus
        : controller;
    });
    awayControllers = newAwayControllers.map(controller => {
      // Only update the timestamp of the movedController, otherwise we just keep it as it was.

      return controller.cid === movedController.cid
        ? { ...controller, timestamp: new Date().toISOString() } // Reset timestamp when moving to other
        : controller;
    });

    res.status(200).send('Controllers updated successfully');
  } else if (movedController) {
    // if only moved exists this should change that
    // check that cid actually exists...
    let fetchAlldata = true;
    let {
      position: newposition,
      callsign: newcallsign,
      name,
      sign,
      rating,
      frequency,
      cid
    } = movedController;
    if (!name || !sign || !rating || !frequency) {
      const res = retrieveControllerInformation(cid);
      if (!res) { fetchAlldata = false } else {
        const { savedName, savedSign, savedRating, savedFreq } = res;
        movedController.name = savedName;
        movedController.sign = savedSign;
        movedController.rating = savedRating;
        movedController.frequency = savedFreq;
      }
    }
    console.log(fetchAlldata);
    if (fetchAlldata == false) {
      res.status(400).send("failed");
      return;
    };
    
    removeControllerFromCurrentList(movedController);

    if (newposition == "paus") {
      availableControllers.push({ ...movedController, position: "paus", callsign: "paus", timestamp: new Date().toISOString() });
    } else if (newposition == "other") {
      awayControllers.push({ ...movedController, position: "other", callsign: "other", timestamp: new Date().toISOString() });
    } else {
      // position is an active position
      activeControllers.push({ ...movedController, position: newposition, callsign: newcallsign, timestamp: new Date().toISOString() });
    }
    res.status(200).send('Controllers updated successfully');
  } else {
    res.status(400).send('Invalid data');
  }
});

const retrieveControllerInformation = (cid: string) => {
  const tempactive = activeControllers.filter((ctrl) => ctrl.cid == cid);
  const tempavail = availableControllers.filter((ctrl) => ctrl.cid == cid);
  const tempaway = awayControllers.filter((ctrl) => ctrl.cid == cid);

  let ctrl = undefined;
  if (tempactive.length == 1) {
    ctrl = tempactive.pop();
  } else if (tempavail.length == 1) {
    ctrl = tempavail.pop();
  } else if (tempaway.length == 1) {
    ctrl = tempaway.pop();
  } else {
    return undefined;
  }

  if (!ctrl) return undefined;

  const savedName = ctrl.name;
  const savedSign = ctrl.sign;
  const savedRating = ctrl.rating;
  const savedFreq = ctrl.frequency;
  return { savedName, savedSign, savedRating, savedFreq }
}

const removeControllerFromCurrentList = (ctrl_to_remove: any) => {
  console.log("rmving", ctrl_to_remove.cid);
  console.log(availableControllers);
  activeControllers = activeControllers.filter((ctrl) => ctrl.cid != ctrl_to_remove.cid);
  availableControllers = availableControllers.filter((ctrl) => ctrl.cid != ctrl_to_remove.cid);
  console.log(availableControllers);
  awayControllers = awayControllers.filter((ctrl) => ctrl.cid != ctrl_to_remove.cid);
};

export const getAllControllers = () => {
  return { activeControllers, availableControllers, awayControllers };
};

export default devRoute;