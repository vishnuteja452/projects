import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.models.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/apierror.js"
import {ApiResponse} from "../utils/apiresponse.js"
import {asynchandler} from "../utils/asynchandler.js"
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudiinary.js"

const getAllVideos = asynchandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId } = req.query
    const pipeline = []

    if (query) {
        pipeline.push({
            $match: {
                title: { $regex: query, $options: "i" }
            }
        })
    }

    if (userId && isValidObjectId(userId)) {
        pipeline.push({
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        })
    }

    pipeline.push({
        $match: { isPublished: true }
    })

    const sortStage = {}
    sortStage[sortBy] = sortType === "asc" ? 1 : -1
    pipeline.push({ $sort: sortStage })

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    }

    const videos = await Video.aggregatePaginate(Video.aggregate(pipeline), options)
    return res.status(200).json(new ApiResponse(200, videos, "Videos fetched successfully"))
})

const publishAVideo = asynchandler(async (req, res) => {
    const { title, description} = req.body
    
    if ([title, description].some(x => !x || x.trim() === "")) {
        throw new ApiError(400, "Title and description are required")
    }

    const videoFileLocalPath = req.files?.videoFile?.[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path

    if (!videoFileLocalPath || !thumbnailLocalPath) {
        throw new ApiError(400, "Video file and thumbnail are required")
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!videoFile?.url || !thumbnail?.url) {
        throw new ApiError(500, "Error uploading to cloudinary")
    }

    const video = await Video.create({
        title,
        description,
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        duration: videoFile.duration || 0,
        owner: req.user._id
    })

    return res.status(201).json(new ApiResponse(201, video, "Video published successfully"))
})

const getVideoById = asynchandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID")

    const video = await Video.findById(videoId).populate("owner", "fullname username avatar")
    if (!video) throw new ApiError(404, "Video not found")

    // Optional: increment view count
    video.views += 1;
    await video.save({ validateBeforeSave: false })

    // Optional: Add to watch history
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { watchHistory: videoId } })

    return res.status(200).json(new ApiResponse(200, video, "Video fetched successfully"))
})

const updateVideo = asynchandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body
    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID")

    const video = await Video.findById(videoId)
    if (!video) throw new ApiError(404, "Video not found")
    
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You don't have permission to update this video")
    }

    const thumbnailLocalPath = req.file?.path
    let thumbnailUrl = video.thumbnail

    if (thumbnailLocalPath) {
        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
        if (thumbnail?.url) {
            thumbnailUrl = thumbnail.url
        }
    }

    const updatedVideo = await Video.findByIdAndUpdate(videoId, {
        $set: { title, description, thumbnail: thumbnailUrl }
    }, { new: true })

    return res.status(200).json(new ApiResponse(200, updatedVideo, "Video updated successfully"))
})

const deleteVideo = asynchandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID")

    const video = await Video.findById(videoId)
    if (!video) throw new ApiError(404, "Video not found")

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You don't have permission to delete this video")
    }

    await Video.findByIdAndDelete(videoId)
    return res.status(200).json(new ApiResponse(200, {}, "Video deleted successfully"))
})

const togglePublishStatus = asynchandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID")

    const video = await Video.findById(videoId)
    if (!video) throw new ApiError(404, "Video not found")

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You don't have permission")
    }

    video.isPublished = !video.isPublished
    await video.save({ validateBeforeSave: false })

    return res.status(200).json(new ApiResponse(200, video, "Publish status toggled"))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
