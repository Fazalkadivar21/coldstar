import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
	const channelId = req.user._id;

	const stats = await Video.aggregate([
		{
			$match: {
				owner: channelId,
			},
		},
		{
			$lookup: {
				from: "likes",
				localField: "_id",
				foreignField: "video",
				as: "likes",
			},
		},
		{
			$lookup: {
				from: "subscriptions",
				localField: "owner",
				foreignField: "channel",
				as: "subs",
			},
		},
		{
			$lookup: {
				from: "tweets",
				localField: "owner",
				foreignField: "owner",
				as: "tweets",
			},
		},
		{
			$group: {
				_id: null,
				totalVideos: { $sum: 1 },
				totalViews: { $sum: "$views" },
				totalLikes: { $sum: { $size: "$likes" } },
				totalSubs: { $first: { $size: "$subs" } },
				totalTweets: { $first: { $size: "$tweets" } },
			},
		},
		{
			$project: {
				_id: 0,
				totalVideos: 1,
				totalViews: 1,
				totalLikes: 1,
				totalSubs: 1,
				totalTweets: 1,
			},
		},
	]);

	return res
		.status(200)
		.json(new ApiResponse(200, stats[0], "Stats fetched successfully"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
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
				owner: req.user._id,
			},
		},
		{
			$sort: {
				[sortBy]: parseInt(sortType),
			},
		},
	];

	const allVideos = await Video.aggregatePaginate(
		Video.aggregate(pipeline),
		options,
	);

	return res
		.status(200)
		.json(new ApiResponse(200, allVideos, "Videos fetched successfully"));
});

export { getChannelStats, getChannelVideos };
