import { Router } from "express";
import { 
    getAllControllers,
    addController,
    editController,
    getOneController
} from "../controllers/controller";


const controllersRoute = Router();

// Returns all of the available controllers.
controllersRoute.get("/controllers", (req, res) => {
    getAllControllers(req, res);
});

controllersRoute.post("/controllers", (req, res) => {
    addController(req, res);
});

controllersRoute.put("/controller/:id", (req, res) => {
    editController(req, res);
});

// Get a specific controller by CID.
controllersRoute.get("/controller/:id", (req, res) => {
    getOneController(req, res);
});


export default controllersRoute;