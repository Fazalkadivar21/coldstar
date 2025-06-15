import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
	const { name, description } = req.body;

	if (!(name && description))
		throw new ApiError(400, "Name and description required");

	const playlist = await Playlist.create({
		name,
		description,
	});

	if (!playlist) throw new ApiError(400, "Cant create playlist");

	return res
		.status(200)
		.json(new ApiResponse(200, playlist, "Playlist created successfully."));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
	const { userId } = req.params;

	if (!isValidObjectId(userId)) throw new ApiError(400, "Invalid userId");

	const userPlaylists = await Playlist.find({ owner: userId });

	return res
		.status(200)
		.json(
			new ApiResponse(
				200,
				userPlaylists,
				"User playlists fetched successfully.",
			),
		);
});

const getPlaylistById = asyncHandler(async (req, res) => {
	const { playlistId } = req.params;

	if (!isValidObjectId(playlistId))
		throw new ApiError(400, "Invalid playlistId");

	const playlist = await Playlist.findById(playlistId);

	if (!playlist) throw new ApiError(404, "Playlist not found");

	return res
		.status(200)
		.json(new ApiResponse(200, playlist, "Playlist fetched successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
	const { playlistId, videoId } = req.params;

	if (!isValidObjectId(playlistId))
		throw new ApiError(400, "Invalid playlistId");

	if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid videoId");

	const updatedPlaylist = await Playlist.findByIdAndUpdate(
		playlistId,
		{
			$push: { video: videoId },
		},
		{ new: true },
	);

	if (!updatedPlaylist) throw new ApiError(404, "Playlist not found");

	return res
		.status(200)
		.json(
			new ApiResponse(200, updatedPlaylist, "Video added successfully"),
		);
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
	const { playlistId, videoId } = req.params;

	if (!isValidObjectId(playlistId))
		throw new ApiError(400, "Invalid playlistId");

	if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid videoId");

	const updatedPlaylist = await Playlist.findByIdAndUpdate(
		playlistId,
		{
			$pull: { video: videoId },
		},
		{ new: true },
	);

	if (!updatedPlaylist) throw new ApiError(404, "Playlist not found");

	return res
		.status(200)
		.json(
			new ApiResponse(200, updatedPlaylist, "Video deleted successfully"),
		);
});

const deletePlaylist = asyncHandler(async (req, res) => {
	const { playlistId } = req.params;

	if (!isValidObjectId(playlistId))
		throw new ApiError(400, "Invalid playlistId");

	const deletePlaylist = await Playlist.findByIdAndDelete(playlistId);

	if (!deletePlaylist) throw new ApiError(404, "Playlist not found");

	return res
		.status(200)
		.json(
			new ApiResponse(
				200,
				deletePlaylist,
				"Playlist deleted successfully",
			),
		);
});

const updatePlaylist = asyncHandler(async (req, res) => {
	const { playlistId } = req.params;
	const { name, description } = req.body;

	if (!isValidObjectId(playlistId))
		throw new ApiError(400, "Invalid playlistId");

	if (!(name || description))
		throw new ApiError(400, "Name or description required");

	const dataToUpdate = {};
	if (name) dataToUpdate.name = name;
	if (description) dataToUpdate.description = description;

	const updatePlaylist = await Playlist.findByIdAndUpdate(
		playlistId,
		{
			$set: dataToUpdate,
		},
		{ new: true },
	);

	if (!updatePlaylist) throw new ApiError(404, "Playlist not found");

	return res
		.status(200)
		.json(new ApiResponse(200, updatePlaylist, "Playlist updated"));
});

export {
	createPlaylist,
	getUserPlaylists,
	getPlaylistById,
	addVideoToPlaylist,
	removeVideoFromPlaylist,
	deletePlaylist,
	updatePlaylist,
};
