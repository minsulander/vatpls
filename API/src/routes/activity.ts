import { Router } from 'express';
import { addActivityList, getActivityList, deleteActivityList } from '../controllers/activity';


const activityRoute = Router();
/** 
 *  Return a json with activeControllers, availableControllers, awayControllers if 
 *  no query was given otherwise give only that list.
 */
activityRoute.get("/activity", (req, res) => {
    // This can handle multiple different queries:
    // ?list=active, ?list=paused, ?list=other
    getActivityList(req, res);
});

activityRoute.post("/activity", (req, res) => {
    addActivityList(req, res);
});

activityRoute.delete("/activity", (req, res) => {
    deleteActivityList(req, res);
});

export default activityRoute;