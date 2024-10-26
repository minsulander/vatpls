import { Router } from "express";
import { 
    getAllControllers,
    addController,
    editController,
    getOneController
} from "../controllers/controller";


const controllersRoute = Router();

// Returns all of the active controllers controllers.
controllersRoute.get("/controllers", (req, res) => {
    getAllControllers(req, res);
});

/** Returns list of all predefinned controllers */
controllersRoute.post("/controller/saved", (req, res) => {
    addController(req, res);
});


controllersRoute.post('/controller', (req, res) => {

    return;
});

controllersRoute.post('/controller/new', (req, res) => {

    return;
});

controllersRoute.delete('/controller/remove', (req, res) => {

    return;
});


export default controllersRoute;