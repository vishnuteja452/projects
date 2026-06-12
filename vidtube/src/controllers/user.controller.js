import { asynchandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/apierror.js";
import { User } from "../models/user.model.js";
import {uploadOnCloudinary , deleteFromCloudinary} from "../utils/cloudiinary.js"
import { ApiResponse } from "../utils/apiresponse.js";
import  jwt  from "jsonwebtoken";
const generateAccessAndRefreshToken = async (userId) =>{
    try {
        const user = await User.findById(userId)
        if(!user){
           throw new ApiError(404,"user not found");
        }
        const accessToken = user.GenerateAccessToken()
        const refreshToken = user.GenerateRefreshToken()
    
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave:false})
        return({accessToken,refreshToken})
    } catch (error) {
        throw new ApiError(500,"something is wrong please try again")
    }
}


const registerUser = asynchandler(async (req,res,next) =>{
    const {fullname, fullName, email,username,password} = req.body
    const actualFullName = fullname || fullName;

    // validation
    if(
    [actualFullName,email,username,password].some((field) =>field?.trim()==="")
    ){
        throw new ApiError(400,"Fullname is required")
    }
    const existedUser = await User.findOne({
        $or:[{username},{email}]
    })
    if(existedUser){
        throw new ApiError(409,"Username or email already exists")
    }
    const avatarLocalPath = req.files?.avatar?.[0]?.path
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar image is required")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar) {
        throw new ApiError(400, "Error uploading avatar to cloudinary")
    }
    let coverImage = ""
    if(coverImageLocalPath){
        coverImage = await uploadOnCloudinary(coverImageLocalPath)
        if (!coverImage) {
            throw new ApiError(400, "Error uploading cover image to cloudinary")
        }
    }
    try {
        const user = await User.create({
            fullname: actualFullName,
            avatar:avatar.url,
            coverImage:coverImage?.url || "",
            email,
            password,
            username:username.toLowerCase()
        })
        const createdUser = await User.findById(user._id).select(
            "-password -refreshToken"
        )
        if(!createdUser){
            throw new ApiError(500,"something went wrong while processing the request")
        }
        return res
            .status(200)
            .json(new ApiResponse
                (201,createdUser,"user registered successfully")
            )
    
    } catch (error) {
        console.log("user creation is failed")
    }
    if(avatar){
        await deleteFromCloudinary(avatar.public_id)
    }
    if(coverImage){
        await deleteFromCloudinary(coverImage.public_id)
    }
throw new ApiError(500,"something is wrong while registering a user and images were deleted")

})

const loginUser = asynchandler(async (req,res,next) =>{
    const {email,username,password} = req.body
    if(!email && !username){
        throw new ApiError(400,"username or email is required");
    }
    if(!password){
        throw new ApiError(400,"password is required")
    }

    // query user first
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    // validate the password
    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401,"invalid credentials")
    }

    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    if(!loggedInUser){
        throw new ApiError(500,"Something went wrong logging in the user")
    }
    const options =  {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",

    }
    return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshtoken",refreshToken,options)
        .json( new ApiResponse(
            200,
            {user: loggedInUser ,accessToken ,refreshToken} ,"user logged in successfully"
        ))
})
const logOut = asynchandler(async (req,res,next) =>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined,
            }
        },
        {new : true},
    )
    const options = {httpOnly:true,
        secure:process.env.NODE_ENV === "production",
    }
    return res
        .status(200)
        .clearCookie("accessToken",options)
        .clearCookie("refreshToken",options)
        .json( new ApiResponse(200,{},"user is logged out thank you for your service"))
})
const refreshAccessToken = asynchandler(async(req,res,next) =>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401,"refresh token is not found")
    }
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        const user = await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401,"refresh token is not valid")
        }
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"invalid token creds")
        }
         const options =  {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",

    }
    const {accessToken , refreshToken :newRefreshToken} = await generateAccessAndRefreshToken(user._id)
    return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(new ApiResponse (
            200,
            {
                accessToken,refreshToken:newRefreshToken
            },
            "access token refreshed successfully"
        ));
    } catch (error) {
        
    }
})

const changeCurrentPassword = asynchandler(async(req,res) =>{
    const {oldpassword,newpassword} = req.body

    const user = await User.findById(req.user?._id)

    const isPasswordValid = await user.isPasswordCorrect(oldpassword)
    if(!isPasswordValid){
        throw new ApiError(401,"old password is incorrect")
    }
    user.password = newpassword

    await user.save({validateBeforeSave :false})
    return res
        .status(200)
        .json(new ApiResponse(200,{},"password is changed successfully"))
})

const getCurrentUser = asynchandler(async(req,res) =>{
    return res.status(200).json(new ApiResponse(200,{},"current user details"))
})

const updateAccountdetails = asynchandler(async(req,res) =>{
    const {fullname, email} = req.body

   if (!fullname || !email) {
    throw new ApiError(400, "Fullname and email are required");
}
    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
        $set: {
            fullname,
            email:email
        }
    },{new : true}
    ).select("-password -refreshToken")

    return res.status(200).json(new ApiResponse(200,updatedUser,"application details updated successfully"))

 })

 const updateUserAvatar = asynchandler(async(req,res) =>{
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"file is required")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if(!avatar.url){
        throw new ApiError(500,"something is wrong with the avatar")
    }
    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,{
            $set: {
                avatar:avatar.url
            }
        },{new:true}
    ).select("-password -refreshToken")

    return res.status(200).json(new ApiResponse(200,updatedUser,"avatar updated successfully"))
 })

 const updateUserCoverImage = asynchandler(async(req,res) =>{
    const coverImageLocalPath = req.file?.path;

    if(!coverImageLocalPath){
        throw new ApiError(400,"Cover image file is missing")
    }
    
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    
    if(!coverImage?.url){
        throw new ApiError(500,"something wrong with the upload images")
    }
    const updatedUser = await User.findByIdAndUpdate(
         req.user?._id,{
            $set: {
                coverImage:coverImage.url
            }
        },{new:true}
    ).select("-password -refreshToken")

    return res
        .status(200).json(new ApiResponse(200,updatedUser,"cover image updated successfully"))
 })

const getUserChannelProfile = asynchandler(async(req,res) =>{
    const {username} = req.params

    if(!username?.trim()){
        throw new ApiError(400,"username is required")
    }
    const channel = await User.aggregate([
        {
            $match:{
                username:username?.toLowerCase()
            }
        },{
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers",
            }
        },{
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },{
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if: {$in:[req.user?._id,"$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        },{
            $project:{
                fullname:1,
                username:1,
                avatar:1,
                coverImage:1,
                subscribersCount:1,
                channelSubscribedToCount:1,
                isSubscribed:1,
                email:1
            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, "Channel does not exist");
    }

    return res.status(200).json(new ApiResponse(200, channel[0], "User channel fetched successfully"));
})

const getWatchHistory = asynchandler(async(req,res) =>{
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullname:1,
                                        username:1,
                                        avatar:1,
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])
    return res.status(200).json(new ApiResponse(200, user[0]?.watchHistory, "watch history fetched successfully"))
})


export {
    registerUser,
    loginUser,
    refreshAccessToken,
    logOut,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountdetails,
    updateUserAvatar,
    updateUserCoverImage

}