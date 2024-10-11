import { Router } from "express";
import { 
    getControllers,
    addController,
    editController,
    getController
} from "../controllers/controller";


const controllersRoute = Router();

// Returns all of the available controllers.
controllersRoute.get("/controllers", (req, res) => {
    getControllers(req, res);
});

controllersRoute.post("/controllers", (req, res) => {
    addController(req, res);
});

controllersRoute.put("/controller/:id", (req, res) => {
    editController(req, res);
});

// Get a specific controller by CID.
controllersRoute.get("/controller/:id", (req, res) => {
    getController(req, res);
});


export default controllersRoute;