import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.models.js"
import {ApiError} from "../utils/apierror.js"
import {ApiResponse} from "../utils/apiresponse.js"
import {asynchandler} from "../utils/asynchandler.js"

const toggleVideoLike = asynchandler(async (req, res) => {
    const {videoId} = req.params
    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID")

    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: req.user._id
    })

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id)
        return res.status(200).json(new ApiResponse(200, { isLiked: false }, "Removed like from video"))
    } else {
        await Like.create({
            video: videoId,
            likedBy: req.user._id
        })
        return res.status(200).json(new ApiResponse(200, { isLiked: true }, "Liked video"))
    }
})

const toggleCommentLike = asynchandler(async (req, res) => {
    const {commentId} = req.params
    if (!isValidObjectId(commentId)) throw new ApiError(400, "Invalid comment ID")

    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: req.user._id
    })

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id)
        return res.status(200).json(new ApiResponse(200, { isLiked: false }, "Removed like from comment"))
    } else {
        await Like.create({
            comment: commentId,
            likedBy: req.user._id
        })
        return res.status(200).json(new ApiResponse(200, { isLiked: true }, "Liked comment"))
    }
})

const toggleTweetLike = asynchandler(async (req, res) => {
    const {tweetId} = req.params
    if (!isValidObjectId(tweetId)) throw new ApiError(400, "Invalid tweet ID")

    const existingLike = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user._id
    })

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id)
        return res.status(200).json(new ApiResponse(200, { isLiked: false }, "Removed like from tweet"))
    } else {
        await Like.create({
            tweet: tweetId,
            likedBy: req.user._id
        })
        return res.status(200).json(new ApiResponse(200, { isLiked: true }, "Liked tweet"))
    }
})

const getLikedVideos = asynchandler(async (req, res) => {
    const likes = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user._id),
                video: { $exists: true }
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video"
            }
        },
        { $unwind: "$video" },
        {
            $lookup: {
                from: "users",
                localField: "video.owner",
                foreignField: "_id",
                as: "video.owner"
            }
        },
        { $unwind: "$video.owner" },
        {
            $project: {
                "video.title": 1,
                "video.description": 1,
                "video.thumbnail": 1,
                "video.videoFile": 1,
                "video.views": 1,
                "video.duration": 1,
                "video.owner.fullname": 1,
                "video.owner.username": 1,
                "video.owner.avatar": 1
            }
        }
    ])

    return res.status(200).json(new ApiResponse(200, likes, "Liked videos fetched successfully"))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}
