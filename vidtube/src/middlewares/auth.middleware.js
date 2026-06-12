import jwt from "jsonwebtoken";
import { ApiError } from "../utils/apierror.js";
import { User } from "../models/user.model.js";
import { asynchandler } from "../utils/asynchandler.js";

export const verifyjwt = asynchandler(async(req,_,next) =>{
    const token = req.cookies.accessToken ||  req.header("authorization")?.replace("Bearer", "")
    if(!token){
        throw new ApiError(401,"unauthorized");
    }
    try {
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)

         const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
         if(!user){
            throw new ApiError(401,"unauthorized")
         }
         req.user = user
         next();
    } catch (error) {
            throw new ApiError(401,error?.message || "invalid access token ")
    }
})