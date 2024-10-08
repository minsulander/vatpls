import { Router, Request, Response, json } from "express";
import { 
    getControllers,
    addController,
    editController,
    getController
} from "../controllers/controller";

const controllersRoute = Router();

// TODO get all controllers in database.
controllersRoute.get("/controllers", (req, res) => {
    getControllers(req, res);
});

// TODO add controller.
controllersRoute.post("/controller/add", (req, res) => {
    addController(req, res);
});

// TODO Edit controller name, sign, rating. 
controllersRoute.put("/controller/:id", (req, res) => {
    editController(req, res);
});

// TODO get controller with cid.
controllersRoute.get("/controller/:id", (req, res) => {
    getController(req, res);
});


export default controllersRoute;