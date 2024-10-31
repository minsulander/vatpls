import { Router } from "express";
import { 
    getAllControllersHandler,
    getPredefinedControllersHandler,
    postController,
    addNewController,
    removeControllerAsActive
} from "../controllers/controller";


const controllersRoute = Router();

// Returns all of the active controllers controllers.
controllersRoute.get("/controllers", (req, res) => {
    getAllControllersHandler(req, res);
});

/** Returns list of all predefinned controllers */
controllersRoute.get("/controller/saved", (req, res) => {
    getPredefinedControllersHandler(req, res);
});

/** Move controller to a state */
controllersRoute.post('/controller', (req, res) => {
    postController(req, res);
});

/** Add a new controller, also adds to pause state */
controllersRoute.post('/controller/new', (req, res) => {
    addNewController(req, res);
});

// Remove controller as active controller. But not the controller.
controllersRoute.delete('/controller/remove', (req, res) => {
    removeControllerAsActive(req, res);
});


export default controllersRoute;