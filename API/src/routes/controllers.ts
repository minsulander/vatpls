import { Router } from "express";
import { 
    addController,
    editController,
    getOneController,
    getAllControllersHandler,
    getPredefinedControllersHandler,
    postController
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


controllersRoute.post('/controller', (req, res) => {
    postController(req, res);
});

controllersRoute.post('/controller/new', (req, res) => {

    return;
});

controllersRoute.delete('/controller/remove', (req, res) => {

    return;
});


export default controllersRoute;