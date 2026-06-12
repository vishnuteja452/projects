import { Router } from "express";
import { addmemberstoproject,
    createprojects,
    updateprojectmembersroles,
    updateprojects,
    getprojectmemebers,
    getprojects,
    getprojectsbyid,
    deleteprojects,
    deletemember} from "../controllers/project_controllers.js";
import {
    createtasks,
    gettasks,
    gettasksbyid,
    updatetask,
    deletetasks
} from "../controllers/taskscontroller.js";
import { validate } from "../middlewares/validator_middleware.js";
import { createprojectvalidator,addmemberstoprojectvalidator } from "../validators/index.js";
import { verifyjwt, validateprojectpermission} from "../middlewares/auth_middleware.js";
import { availableuserrole, userrolesenum } from "../utils/constants.js";
const router = Router()
router.use(verifyjwt)

router
    .route("/")
    .get(getprojects)
    .post(createprojectvalidator(),validate,createprojects)

router
    .route("/:projectid")
    .get(validateprojectpermission(availableuserrole), getprojectsbyid)
    .put(
        validateprojectpermission([userrolesenum.ADMIN]),
        createprojectvalidator(),
        validate,
        updateprojects,
    )
    .delete(validateprojectpermission([userrolesenum.ADMIN]), deleteprojects);

router
    .route("/:projectid/members")
    .get(validateprojectpermission(availableuserrole), getprojectmemebers)
    .post(validateprojectpermission([userrolesenum.ADMIN]), addmemberstoprojectvalidator(), validate, addmemberstoproject);

router
    .route("/:projectid/members/:userId")
    .put(validateprojectpermission([userrolesenum.ADMIN]),
     updateprojectmembersroles)
    .delete(validateprojectpermission([userrolesenum.ADMIN]), deletemember)

// Task routes nested under projects
router
    .route("/:projectid/tasks")
    .get(validateprojectpermission(availableuserrole), gettasks)
    .post(validateprojectpermission(availableuserrole), createtasks);

router
    .route("/:projectid/tasks/:taskId")
    .get(validateprojectpermission(availableuserrole), gettasksbyid)
    .put(validateprojectpermission(availableuserrole), updatetask)
    .delete(validateprojectpermission(availableuserrole), deletetasks);

export default router