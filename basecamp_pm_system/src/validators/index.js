import {body} from "express-validator";
import { availableuserrole } from "../utils/constants.js";
// these are the validators required for the project
const userRegisterValidator = () =>{
    return[
        body("email")
            .trim()
            .notEmpty()
            .withMessage("email is required")
            .isEmail()
            .withMessage("email is invalid"),
        body("username")
            .trim()
            .notEmpty()
            .withMessage("username is required")
            .isLowercase()
            .withMessage("Username must be in lower c")
            .isLength({min:3})
            .withMessage("username must be atleast three characters long"),
        body("password")
            .trim()
            .notEmpty()
            .withMessage("password is required "),
        body("fullname")
            .trim()
            .optional()
    ];
};

const userloginvalidator = () => {
    return[
        body("email")
            .optional()
            .isEmail()
            .withMessage("email is required"),
        body("password")
            .notEmpty()
            .withMessage("password is required"),
    ]
}
const userchangecurentpasswordvalidator = () =>{
    return[
        body("oldpassword")
            .notEmpty()
            .withMessage("old password is required"),
        body("newpassword")
            .notEmpty()
            .withMessage("new password is required"),
    ]
}
const userforgotpasswordvalidator = () =>{
    return[
        body("email")
            .trim()
            .notEmpty()
            .withMessage("email is required")
            .isEmail()
            .withMessage("email is invalid"),
    ]
}
const userresetforgotpasswordvalidator = () =>{
  
            return[
        body("newpassword")
            .notEmpty()
            .withMessage("newpassword is required"),
    ]
        
}

const createprojectvalidator = () =>{
    return[
        body("name")
            .notEmpty()
            .withMessage("name is required"),
        body("description")
            .optional(),
    ]
}
const addmemberstoprojectvalidator = () => {
  return [
    body("email")
      .notEmpty()
      .withMessage("email is required")
      .isEmail()
      .withMessage("email is not valid"),
    body("role")
      .notEmpty()
      .withMessage("role is required")
      .isIn(availableuserrole)
      .withMessage("role is invalid"),
  ];
};

export { 
    userRegisterValidator , 
    userloginvalidator,
    userchangecurentpasswordvalidator,
    userforgotpasswordvalidator,
    userresetforgotpasswordvalidator,
    createprojectvalidator, 
    addmemberstoprojectvalidator};