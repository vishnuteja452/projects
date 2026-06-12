import mongoose, {isValidObjectId} from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/apierror.js"
import {ApiResponse} from "../utils/apiresponse.js"
import {asynchandler} from "../utils/asynchandler.js"

const getVideoComments = asynchandler(async (req, res) => {
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID")

    const aggregateQuery = Comment.aggregate([
        {
            $match: { video: new mongoose.Types.ObjectId(videoId) }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        { $unwind: "$owner" },
        {
            $project: {
                content: 1,
                createdAt: 1,
                "owner.fullname": 1,
                "owner.username": 1,
                "owner.avatar": 1
            }
        },
        { $sort: { createdAt: -1 } }
    ])

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    }

    const comments = await Comment.aggregatePaginate(aggregateQuery, options)
    return res.status(200).json(new ApiResponse(200, comments, "Comments fetched successfully"))
})

const addComment = asynchandler(async (req, res) => {
    const { videoId } = req.params
    const { content } = req.body

    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID")
    if (!content?.trim()) throw new ApiError(400, "Content is required")

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id
    })

    return res.status(201).json(new ApiResponse(201, comment, "Comment added successfully"))
})

const updateComment = asynchandler(async (req, res) => {
    const { commentId } = req.params
    const { content } = req.body

    if (!isValidObjectId(commentId)) throw new ApiError(400, "Invalid comment ID")
    if (!content?.trim()) throw new ApiError(400, "Content is required")

    const comment = await Comment.findById(commentId)
    if (!comment) throw new ApiError(404, "Comment not found")

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You don't have permission to update this comment")
    }

    const updatedComment = await Comment.findByIdAndUpdate(commentId, {
        $set: { content }
    }, { new: true })

    return res.status(200).json(new ApiResponse(200, updatedComment, "Comment updated successfully"))
})

const deleteComment = asynchandler(async (req, res) => {
    const { commentId } = req.params

    if (!isValidObjectId(commentId)) throw new ApiError(400, "Invalid comment ID")

    const comment = await Comment.findById(commentId)
    if (!comment) throw new ApiError(404, "Comment not found")

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You don't have permission to delete this comment")
    }

    await Comment.findByIdAndDelete(commentId)
    return res.status(200).json(new ApiResponse(200, {}, "Comment deleted successfully"))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
}
