import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.models.js"
import {ApiError} from "../utils/apierror.js"
import {ApiResponse} from "../utils/apiresponse.js"
import {asynchandler} from "../utils/asynchandler.js"

const toggleSubscription = asynchandler(async (req, res) => {
    const { channelId } = req.params
    if (!isValidObjectId(channelId)) throw new ApiError(400, "Invalid channel ID")

    const existingSubscription = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId
    })

    if (existingSubscription) {
        await Subscription.findByIdAndDelete(existingSubscription._id)
        return res.status(200).json(new ApiResponse(200, { subscribed: false }, "Unsubscribed successfully"))
    } else {
        const newSubscription = await Subscription.create({
            subscriber: req.user._id,
            channel: channelId
        })
        return res.status(200).json(new ApiResponse(200, { subscribed: true }, "Subscribed successfully"))
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asynchandler(async (req, res) => {
    const { channelId } = req.params
    if (!isValidObjectId(channelId)) throw new ApiError(400, "Invalid channel ID")

    const subscribers = await Subscription.aggregate([
        {
            $match: { channel: new mongoose.Types.ObjectId(channelId) }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriberInfo"
            }
        },
        {
            $unwind: "$subscriberInfo"
        },
        {
            $project: {
                "subscriberInfo.fullname": 1,
                "subscriberInfo.username": 1,
                "subscriberInfo.avatar": 1
            }
        }
    ])

    return res.status(200).json(new ApiResponse(200, subscribers, "Subscribers fetched successfully"))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asynchandler(async (req, res) => {
    const { subscriberId } = req.params
    if (!isValidObjectId(subscriberId)) throw new ApiError(400, "Invalid subscriber ID")

    const channels = await Subscription.aggregate([
        {
            $match: { subscriber: new mongoose.Types.ObjectId(subscriberId) }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channelInfo"
            }
        },
        {
            $unwind: "$channelInfo"
        },
        {
            $project: {
                "channelInfo.fullname": 1,
                "channelInfo.username": 1,
                "channelInfo.avatar": 1
            }
        }
    ])

    return res.status(200).json(new ApiResponse(200, channels, "Subscribed channels fetched successfully"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}
