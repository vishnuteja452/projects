import mongoose from "mongoose";

import { ApiError } from "../utils/apierror.js";

const errorhandler = (err,req,res,next) =>{
    let error = err
    if(!(error instanceof ApiError)){
        const statuscode = error.statusCode || error.statuscode || (error instanceof mongoose.Error ? 400 : 500)
        const message = error.message || "something went wrong"
        error = new ApiError(statuscode,message,error?.errors || [],err.stack)
    }
    const response = {
        message:error.message,
        ...(process.env.NODE_ENV === "development" && {stack:error.stack})
    }
    const finalStatusCode = error.statusCode || error.statuscode || 500;
    return res.status(finalStatusCode).json(response)
}

export default errorhandler;