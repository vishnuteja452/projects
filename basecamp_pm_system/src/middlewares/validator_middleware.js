import { validationResult } from "express-validator";
import { apierror } from "../utils/apierror.js";

export const validate = (req,res,next) =>{
    const errors = validationResult(req)
        if(errors.isEmpty()){
            return next();
        }
    const extractederror = []
    errors.array().map((err) => extractederror.push(
        {
        [err.path]:err.msg, 
        }
    ),);
throw new apierror(422,"recieved data is not valid",extractederror);};