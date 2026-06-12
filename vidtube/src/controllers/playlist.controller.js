import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.models.js"
import {ApiError} from "../utils/apierror.js"
import {ApiResponse} from "../utils/apiresponse.js"
import {asynchandler} from "../utils/asynchandler.js"

const createPlaylist = asynchandler(async (req, res) => {
    const {name, description} = req.body
    if (!name?.trim()) throw new ApiError(400, "Name is required")
    
    const playlist = await Playlist.create({
        name,
        description: description || "",
        owner: req.user._id,
        videos: []
    })

    return res.status(201).json(new ApiResponse(201, playlist, "Playlist created successfully"))
})

const getUserPlaylists = asynchandler(async (req, res) => {
    const {userId} = req.params
    if (!isValidObjectId(userId)) throw new ApiError(400, "Invalid user ID")

    const playlists = await Playlist.find({ owner: userId }).populate("videos")
    return res.status(200).json(new ApiResponse(200, playlists, "User playlists fetched successfully"))
})

const getPlaylistById = asynchandler(async (req, res) => {
    const {playlistId} = req.params
    if (!isValidObjectId(playlistId)) throw new ApiError(400, "Invalid playlist ID")

    const playlist = await Playlist.findById(playlistId).populate("videos")
    if (!playlist) throw new ApiError(404, "Playlist not found")

    return res.status(200).json(new ApiResponse(200, playlist, "Playlist fetched successfully"))
})

const addVideoToPlaylist = asynchandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID")
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) throw new ApiError(404, "Playlist not found")

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You don't have permission to modify this playlist")
    }

    if (!playlist.videos.includes(videoId)) {
        playlist.videos.push(videoId)
        await playlist.save({ validateBeforeSave: false })
    }

    return res.status(200).json(new ApiResponse(200, playlist, "Added video to playlist"))
})

const removeVideoFromPlaylist = asynchandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID")
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) throw new ApiError(404, "Playlist not found")

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You don't have permission to modify this playlist")
    }

    playlist.videos = playlist.videos.filter(v => v.toString() !== videoId)
    await playlist.save({ validateBeforeSave: false })

    return res.status(200).json(new ApiResponse(200, playlist, "Removed video from playlist"))
})

const deletePlaylist = asynchandler(async (req, res) => {
    const {playlistId} = req.params
    if (!isValidObjectId(playlistId)) throw new ApiError(400, "Invalid playlist ID")

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) throw new ApiError(404, "Playlist not found")

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You don't have permission to delete this playlist")
    }

    await Playlist.findByIdAndDelete(playlistId)
    return res.status(200).json(new ApiResponse(200, {}, "Playlist deleted successfully"))
})

const updatePlaylist = asynchandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    if (!isValidObjectId(playlistId)) throw new ApiError(400, "Invalid playlist ID")

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) throw new ApiError(404, "Playlist not found")

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You don't have permission to update this playlist")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId, {
        $set: { name, description }
    }, { new: true })

    return res.status(200).json(new ApiResponse(200, updatedPlaylist, "Playlist updated successfully"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
