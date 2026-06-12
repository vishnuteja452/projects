import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/apierror.js"
import {ApiResponse} from "../utils/apiresponse.js"
import {asynchandler} from "../utils/asynchandler.js"

const createTweet = asynchandler(async (req, res) => {
    const { content } = req.body
    if (!content?.trim()) throw new ApiError(400, "Content is required")

    const tweet = await Tweet.create({
        content,
        owner: req.user._id
    })

    return res.status(201).json(new ApiResponse(201, tweet, "Tweet created successfully"))
})

const getUserTweets = asynchandler(async (req, res) => {
    const { userId } = req.params
    if (!isValidObjectId(userId)) throw new ApiError(400, "Invalid user id")

    const tweets = await Tweet.find({ owner: userId }).sort({ createdAt: -1 })
    return res.status(200).json(new ApiResponse(200, tweets, "Tweets fetched successfully"))
})

const updateTweet = asynchandler(async (req, res) => {
    const { content } = req.body
    const { tweetId } = req.params

    if (!content?.trim()) throw new ApiError(400, "Content is required")
    if (!isValidObjectId(tweetId)) throw new ApiError(400, "Invalid tweet id")

    const tweet = await Tweet.findById(tweetId)
    if (!tweet) throw new ApiError(404, "Tweet not found")

    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You do not have permission to edit this tweet")
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(tweetId, {
        $set: { content }
    }, { new: true })

    return res.status(200).json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"))
})

const deleteTweet = asynchandler(async (req, res) => {
    const { tweetId } = req.params
    if (!isValidObjectId(tweetId)) throw new ApiError(400, "Invalid tweet id")

    const tweet = await Tweet.findById(tweetId)
    if (!tweet) throw new ApiError(404, "Tweet not found")

    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You do not have permission to delete this tweet")
    }

    await Tweet.findByIdAndDelete(tweetId)
    return res.status(200).json(new ApiResponse(200, {}, "Tweet deleted successfully"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
