import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleLike = asyncHandler(async (req, res, field) => {
	const contentId = req.params[field];

	if (!isValidObjectId(contentId)) {
		throw new ApiError(400, `Invalid ${field}`);
	}

	const existingLike = await Like.findOne({
		[field]: contentId,
		likedBy: req.user._id,
	});

	if (existingLike) {
		await Like.findByIdAndDelete(existingLike._id);

		return res
			.status(200)
			.json(new ApiResponse(200, false, `${field} unliked`));
	} else {
		await Like.create({
			[field]: contentId,
			likedBy: req.user._id,
		});

		return res
			.status(200)
			.json(new ApiResponse(200, true, `${field} liked`));
	}
});

const toggleVideoLike = asyncHandler(async (req, res) => {
	const { videoId } = req.params;
    
	toggleLike(req, res, videoId);
});

const toggleCommentLike = asyncHandler(async (req, res) => {
	const { commentId } = req.params;
    
	toggleLike(req, res, commentId);
});

const toggleTweetLike = asyncHandler(async (req, res) => {
	const { tweetId } = req.params;
    
	toggleLike(req, res, tweetId);
});

const getLikedVideos = asyncHandler(async (req, res) => {

	const {
		page = 1,
		limit = 15,
		sortBy = "createdAt",
		sortType = -1,
	} = req.query;

	const options = {
		page: parseInt(page),
		limit: parseInt(limit),
	};

	const pipeline = [
		{
			$match: {
				likedBy: req.user._id,
			},
		},
		{
			$lookup: {
				from: "videos",
				localField: "video",
				foreignField: "_id",
				as: "video",
			},
		},
		{
			$unwind: "$video",
		},
		{
			$replaceRoot: {
				newRoot: "$video", // ✅ Replaces the whole doc with the video
			},
		},
		{
			$project: {
				video: 1,
			},
		},
		{
			$sort: {
				[sortBy]: parseInt(sortType),
			},
		},
	];

	const likes = await Like.mongooseAggregatePaginate(
		Like.aggregate(pipeline),
		options,
	);

	return res
		.status(200)
		.json(new ApiResponse(200, likes, "Liked videos fetched"));
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
