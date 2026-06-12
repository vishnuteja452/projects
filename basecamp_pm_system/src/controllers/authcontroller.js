import { User } from "../models/user-info_model.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { apierror } from "../utils/apierror.js";
import { asynchandler } from "../utils/asynchandler.js";
import { apiresponse } from "../utils/api_response.js";
import { emailVerificationContent, forgotPasswordBaseCampContent, sendEmail } from "../utils/mail.js"
import { validate } from "../middlewares/validator_middleware.js";

const gereratedaccessandrefreshtoken = async (userId) =>{
    try {
        const user = await User.findById(userId)
        const accesstoken = user.generateaccesstoken();
        const refreshtoken = user.generaterefreshtoken();
        
        user.refreshtoken = refreshtoken;
        await user.save({validateBeforeSave:false})
        
        return { accesstoken, refreshtoken }
    } catch (error) {
        throw new apierror(
            500,
            "something is wrong please try again: " + error.message
        )
    }
}

const registeruser = asynchandler(async(req,res) => {
    const {fullname,email,username,password,role} = req.body

    if (!fullname || !email || !username || !password) {
        throw new apierror(400, "All fields are required (fullname, email, username, password)");
    }

    const existeduser = await User.findOne({
        $or:[{username},{email}]
    })
    if(existeduser){
        throw new apierror(409,"user already exists",[]);  
    }
    const user = await User.create({
        fullname,
        email,
        password,
        username,
        isemailverifed:false
    })
    const {unhashedtoken,hashedtoken,token_expiry} = user.generatetemparorytoken();
    
    user.emailverifcationtoken = hashedtoken;
    user.emailverifcationexpiry = token_expiry;

    await user.save({validateBeforeSave:false});

    await sendEmail({
        email:user?.email,
        subject:"please verify your email",
        mailgencontent:emailVerificationContent(
            user.username,
            `${req.protocol}://${req.get("host")}/api/v1/auth/verify-email/${unhashedtoken}`
        ),

    });

    const createduser = await User.findById(user._id).select(
        "-password -refreshtoken -emailverifcationtoken -emailverifcationexpiry"
    );
    if(!createduser){
        throw new apierror (500,"something is wrong for registering a new user")
    }
    return res
    .status(201)
    .json(
        new apiresponse(
            200,
            {user:createduser},
            "User registered successfully"
        )
    )
});

const verifyEmail = asynchandler(async(req, res) => {
    const { token } = req.params;

    const hashedtoken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
        emailverifcationtoken: hashedtoken,
        emailverifcationexpiry: { $gt: Date.now() }
    });

    if (!user) {
        throw new apierror(400, "Invalid or expired verification token");
    }

    user.isemailverifed = true;
    user.emailverifcationtoken = undefined;
    user.emailverifcationexpiry = undefined;

    await user.save({ validateBeforeSave: false });

    return res.status(200).json(
        new apiresponse(200, {}, "Email verified successfully")
    );
});

const login = asynchandler(async (req,res) => {
   const {email,password,username} = req.body
    if(!email){
        throw new apierror(400,"email is required")
    }

const user = await User.findOne({email});

if(!user){
    throw new apierror(400,"User doesnt exist");

}
const isPassswordValid = await user.ispasswordcorrect(password);

if(!isPassswordValid){
    throw new apierror(400,"Passowrd is invalid");
}

const {accesstoken,refreshtoken} = await gereratedaccessandrefreshtoken(user._id)
const loggedinuser = await User.findById(user._id).select(
        "-password -refreshtoken -emailverifcationtoken -emailverifcationexpiry"
    );
const options = {
    httpOnly:true,
    secure:true,
}
return res
    .status(200)
    .cookie("accesstoken",accesstoken,options)
    .cookie("refreshtoken",refreshtoken,options)
    .json(
        new apiresponse(
            200,
          {
            user:loggedinuser,
            accesstoken,
            refreshtoken
          },
          "user logged in sucessfully" 
        )
    )
})

const logoutuser =  asynchandler(async(req,res) => {
    await User.findByIdAndUpdate(
        req.user._id,{
            $set:{
                refreshtoken:""
            },
        },
    );
const options = {
    httpOnly:true,
    secure:true
}
return res  
    .status(200)
    .clearCookie("accesstoken",options)
    .clearCookie("refreshtoken",options)
    .json(new apiresponse(200,{},"user logged out"));
});


const getcurrentuser = asynchandler(async(req,res) => {
    return res 
        .status(200)
        .json(new apiresponse(200,req.user,"current user fetched sucessfully"));
});

const resetemailverfication = asynchandler(async(req,res) =>{
    const user = await User.findById(req.user?._id);
    if(!user){
        throw new apierror(404,"user doesnot exist");
    }
    if(user.isemailverifed){
        throw new apierror(404,"email is already verified")
    }
    const {unhashedtoken,hashedtoken,token_expiry} = user.generatetemparorytoken();

    user.emailverifcationtoken = hashedtoken;
    user.emailverifcationexpiry = token_expiry;

    await user.save({validateBeforeSave:false});

    await sendEmail({
        email:user?.email,
        subject:"please verify your email",
        mailgencontent:emailVerificationContent(
            user.username,
            `${req.protocol}://${req.get("host")}/api/v1/auth/verify-email/${unhashedtoken}`
        ),

    });

    return res
        .status(200)
        .json(
            new apiresponse(
                200,
                {},
                "mail has been sent to your account"
            ))
});

const refreshaccesstoken = asynchandler(async(req,res) =>{
    const incomingrefreshtoken = req.cookies.refreshtoken ||
    req.body.refreshtoken

    if(!incomingrefreshtoken){
        throw new apierror(401,"unauthorized access");
    }
    try {
        const decodedToken = jwt.verify(incomingrefreshtoken,process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id);
        if(!user){
            throw new apierror(401,"refresh token not found")
        }
        if(incomingrefreshtoken !== user?.refreshtoken){
            throw new apierror(401,"refresh token is expired or used")
        }
        const options = {
            httpOnly:true,
            secure:true
        }
        const {accesstoken,refreshtoken} = await gereratedaccessandrefreshtoken(user._id)

        return res
            .status(200)
            .cookie("accesstoken",accesstoken,options)
            .cookie("refreshtoken",refreshtoken,options)
            .json(new apiresponse(
                200,
                {accesstoken,refreshtoken},
                "access token refreshed"
            ))
    } catch (error) {
            throw new apierror(401,error?.message || "invalid refresh token");
    }
})

const forgotpassword = asynchandler(async(req,res) =>{
   const {email} = req.body
   
   const user = await User.findOne({email})
   if(!user){
    throw new apierror(404,"user does not exist");
   }
   const {unhashedtoken,hashedtoken,token_expiry} = user.generatetemparorytoken()

   user.forgotpasswordtoken = hashedtoken
   user.forgotpasswordexpiry = token_expiry

   await user.save({validateBeforeSave:false})

   await sendEmail({
        email:user?.email,
        subject:"please verify your email",
        mailgencontent:forgotPasswordBaseCampContent(
            user.username,
            `${process.env.FORGOT_PASSWORD_REDIRECT || process.env.FORGOT_PASSWORD_REDRIRECT || 'http://localhost:8000/#reset-password'}/${unhashedtoken}`
        ),

    })
    return res
        .status(200)
        .json( new apiresponse(200
            ,{},"password reset mail has been sent to mail"
        ))
});
const resetforgotpassword = asynchandler(async(req,res) =>{
    const {resettoken} = req.params
    const {newpassword} = req.body

    let hashedtoken = crypto
        .createHash("sha256")
        .update(resettoken)
        .digest("hex")

    const user = await User.findOne({
        forgotpasswordtoken:hashedtoken,
        forgotpasswordexpiry:{$gt:Date.now()}
    })
     if(!user){
        throw new apierror(489,"token is invalid or expired")
    }
    user.forgotpasswordexpiry = undefined
    user.forgotpasswordtoken = undefined

    user.password = newpassword
    await user.save({validateBeforeSave:false})

    return res
        .status(200)
        .json(
            new apiresponse(200,{},"password reset successfully")
        )
});
const changepassword = asynchandler(async(req,res) =>{
    const {oldpassword,newpassword} = req.body

    const user = await User.findById(req.user?._id);
    if (!user) {
        throw new apierror(404, "User not found");
    }
    
   const ispasswordvalid = await user.ispasswordcorrect(oldpassword)

   if(!ispasswordvalid){
    throw new apierror(400,"invalid old password")
   }
   user.password = newpassword
   await user.save({validateBeforeSave:false})

   return res
        .status(200)
        .json(
            new apiresponse(200, {}, "Password changed successfully")
        )
})
export {
    registeruser,
    verifyEmail,
    login ,
    logoutuser,
    getcurrentuser,
    resetemailverfication,
    refreshaccesstoken,
    resetforgotpassword,
    forgotpassword,
    changepassword};