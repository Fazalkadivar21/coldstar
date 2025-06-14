import mongoose from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
	const { content } = req.body;
	const { _id: owner } = req.user;

	if (!content) throw new ApiError(400, "content is required");

	const tweet = await Tweet.create({
		owner,
		content,
	});

	if (!tweet) throw new ApiError(404, "Invalid user");

	return res
		.status(200)
		.json(new ApiResponse(200, tweet, "Tweet created successfully."));
});

const getUserTweets = asyncHandler(async (req, res) => {
	const { userId } = req.params;
	const {
		page = 1,
		limit = 15,
		sortBy = "createdAt",
		sortType = -1,
	} = req.query;

	const pipeline = [
		{
			$match: { owner: new mongoose.Types.ObjectId(userId) },
		},
		{
			$sort: {
				[sortBy]: parseInt(sortType),
			},
		},
	];

	const options = {
		page: parseInt(page),
		limit: parseInt(limit),
	};

	const result = await Tweet.aggregatePaginate(
		Tweet.aggregate(pipeline),
		options,
	);

	if (!result.docs.length)
		throw new ApiError(404, "No tweets found for this user");

	return res
		.status(200)
		.json(new ApiResponse(200, result, "tweets fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
	const { tweetId } = req.params;
	const { content } = req.body;

	if (!content) throw new ApiError(400, "Content required");

	const tweet = await Tweet.findByIdAndUpdate(
		tweetId,
		{
			$set: { content },
		},
		{ new: true },
	);

	if (!tweet) throw new ApiError(400, "tweet not found");

	return res
		.status(200)
		.json(new ApiResponse(200, tweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
	const { tweetId } = req.params;

	const tweet = await Tweet.findByIdAndUpdate(tweetId);

	if (!tweet) throw new ApiError(400, "tweet not found");

	return res
		.status(200)
		.json(new ApiResponse(200, {}, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
