import { Router } from "express";
import { changepassword, forgotpassword, getcurrentuser, login, logoutuser, refreshaccesstoken, registeruser, resetemailverfication, resetforgotpassword, verifyEmail } from "../controllers/authcontroller.js";
import { validate } from "../middlewares/validator_middleware.js";
import { userchangecurentpasswordvalidator, userforgotpasswordvalidator, userRegisterValidator,  userresetforgotpasswordvalidator } from "../validators/index.js";
import { userloginvalidator } from "../validators/index.js";
import { verifyjwt } from "../middlewares/auth_middleware.js";
const router = Router();

// these are the unsecured routes
router.route("/register").post(userRegisterValidator(),validate, registeruser)
router.route("/verify-email/:token").get(verifyEmail)
router.route("/login").post(userloginvalidator(),validate,login);
router.route("/refresh_token").post(refreshaccesstoken);
router.route("/forgotpassword").post(userforgotpasswordvalidator(),validate,forgotpassword);
router.route("/resetforgotpassword/:resettoken").post(userresetforgotpasswordvalidator(),validate,resetforgotpassword)
// this is a secure route
router.route("/logout").post(verifyjwt,logoutuser);
router.route("/current-user").post(verifyjwt,getcurrentuser);
router.route("/change-password").post(verifyjwt,userchangecurentpasswordvalidator,validate,changepassword);
router.route("/email-verification").post(verifyjwt,resetemailverfication)

export default router;
