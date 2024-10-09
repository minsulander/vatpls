import { Router } from "express";
import { 
    getControllers,
    addController,
    editController,
    getController
} from "../controllers/controller";

const controllersRoute = Router();


controllersRoute.get("/controllers", (req, res) => {
    getControllers(req, res);
});


controllersRoute.post("/controller/add", (req, res) => {
    addController(req, res);
});


controllersRoute.put("/controller/:id", (req, res) => {
    editController(req, res);
});


controllersRoute.get("/controller/:id", (req, res) => {
    getController(req, res);
});


export default controllersRoute;