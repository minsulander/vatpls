import { Router, Request, Response } from 'express';

// Used during development if there is no need to interact with the database.
// This code needs refactoring, this will be unreadable in a couple of weeks.

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

let predefinedControllers = [
  { name: 'Max Mustermann', sign: 'T1', cid: '821932', rating: 'S1', callsign: 'CTR1', frequency: '123.45', position: 'Ground', timestamp: new Date().toISOString() },
  { name: 'Max Kuhla', sign: 'MK', cid: '1157126', rating: 'S1', callsign: '', frequency: '', position: '', timestamp: new Date().toISOString() },
  { name: 'Test Testsson', sign: 'T2', cid: '931204', rating: 'C1', callsign: 'CTR2', frequency: '123.90', position: 'Ground', timestamp: new Date().toISOString() }
]

export const getAllControllers = () => {
  return { activeControllers, availableControllers, awayControllers };
};

devRoute.get('/controllers', (req: Request, res: Response) => {
  res.json(getAllControllers());
});

/** Fetch saved/predefined controllers  */
devRoute.get('/controller/saved', (req, res) => {
  res.status(200).json({Controllers: predefinedControllers});
});

devRoute.post('/controller', (req, res) => {
  const { controller } = req.body;
  const isValidController = checkControllerValid(controller);

  if (!isValidController) { 
    res.status(400).json({ error: "Please enter valid controller." });
    return;
  }
  
  // remove controller from the current state.
  removeControllerFromCurrentList(isValidController.cid);
  addControllerToList(controller);

  res.status(201).json({ update: isValidController });
});

devRoute.post('/controller/new', (req, res) => {
  const { Controller } = req.body;
  const isValidController = checkControllerValid(Controller);

  if (!isValidController) { 
    res.status(400).json({ error: "Please enter valid controller." });
    return;
  }

  isValidController.position = "paus";
  isValidController.callsign = "paus";
  
  addControllerToList(isValidController);

  res.status(201).json({ update: isValidController });
});

devRoute.delete('/controller/remove', (req, res) => {
  const { cid } = req.body;
  if (cid) {
    removeControllerFromCurrentList(cid);
    res.status(200).json({msg: "Controller removed"});
  } else {
    res.status(400).json({ error: "include cid in body"});
  }
});

const checkControllerValid = (controllerObj: any): Controller | undefined => {
  if (
    typeof controllerObj.name === 'string' &&
    typeof controllerObj.sign === 'string' &&
    typeof controllerObj.cid === 'string' &&
    ['S1', 'S2', 'S3', 'C1', 'C3'].includes(controllerObj.rating) &&
    typeof controllerObj.callsign === 'string' &&
    typeof controllerObj.frequency === 'string' &&
    typeof controllerObj.timestamp === 'string' &&
    (typeof controllerObj.position === 'undefined' || typeof controllerObj.position === 'string')
  ) {
    // Return the controller object as valid
    return {
      name: controllerObj.name,
      sign: controllerObj.sign,
      cid: controllerObj.cid,
      rating: controllerObj.rating,
      callsign: controllerObj.callsign,
      frequency: controllerObj.frequency,
      position: controllerObj.position,
      timestamp: controllerObj.timestamp
    };
  }

  // If validation fails, return undefined
  return undefined;
};


const addControllerToList = (controllerToAdd: Controller) => {
  if (controllerToAdd.position == "paus") {
    availableControllers.push({ ...controllerToAdd, position: "paus", callsign: "paus", timestamp: new Date().toISOString() });
  } else if (controllerToAdd.position == "other") {
    awayControllers.push({ ...controllerToAdd, position: "other", callsign: "other", timestamp: new Date().toISOString() });
  } else {
    // position is an active position
    activeControllers.push({ ...controllerToAdd, position: controllerToAdd.position, callsign: controllerToAdd.callsign, timestamp: new Date().toISOString() });
  }
};

const removeControllerFromCurrentList = (cidOfController: string) => {
  activeControllers = activeControllers.filter((ctrl) => ctrl.cid != cidOfController);
  availableControllers = availableControllers.filter((ctrl) => ctrl.cid != cidOfController);
  awayControllers = awayControllers.filter((ctrl) => ctrl.cid != cidOfController);
};

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

// POST route to update controllers
/** deprecated, use /controller instead to move 1 controller */
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

export default devRoute;
