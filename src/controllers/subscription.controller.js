import mongoose from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model";
import { pipeline } from "stream";

const toggleSubscription = asyncHandler(async (req, res) => {
	const { channelId } = req.params;
	const userId = req.user._id;

	const validChannel = await User.findById(channelId);
	if (!validChannel) throw new ApiError(404, "Channel not found");

	const subscribe = asyncHandler(async (channelId, userId) => {
		await Subscription.create({
			channel: channelId,
			subscriber: userId,
		});

		return true;
	});
	const unsubscribe = asyncHandler(async (subscriptionId) => {
		await Subscription.findByIdAndDelete(subscriptionId);
		return false;
	});

	const isSubcribed = await Subscription.find({
		channel: channelId,
		subscriber: req.user._id,
	});

	const toggle = isSubcribed
		? await unsubscribe(isSubcribed._id)
		: await subscribe(channelId, userId);

	return res
		.status(200)
		.json(
			new ApiResponse(
				200,
				{ subscribed: toggle },
				"Toggled successfully",
			),
		);
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
	const { channelId } = req.params;
	const {
		page = 1,
		limit = 15,
		sortBy = "createdAt",
		sortType = -1,
	} = req.query;

	const pipeline = [
		{
			$match: {
				channel: channelId,
			},
		},
		{
			$lookup: {
				from: "users",
				localField: "subscriber",
				foreignField: "_id",
				as: "subscriber",
				pipeline: [
					{
						$project: {
							avatar,
							username,
						},
					},
				],
			},
		},
		{
			$unwind: "$subscriber",
		},
		{
			$project: {
				subscriber: 1,
			},
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

	const subList = await Subscription.aggregatePaginate(
		await Subscription.aggregate(pipeline),
		options,
	);

	res.status(200).json(
		new ApiResponse(200, subList, "Subscribers fetched successfully"),
	);
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
	const { subscriberId } = req.params;

	const {
		page = 1,
		limit = 15,
		sortBy = "createdAt",
		sortType = -1,
	} = req.query;

	const pipeline = [
		{
			$match: {
				subscriber: subscriberId,
			},
		},
		{
			$lookup: {
				from: "users",
				localField: "channel",
				foreignField: "_id",
				as: "channel",
				pipeline: [
					{
						$project: {
							avatar,
							username,
						},
					},
				],
			},
		},
		{
			$unwind: "$channel",
		},
		{
			$project: {
				channel: 1,
			},
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

	const channelList = await Subscription.aggregatePaginate(
		await Subscription.aggregate(pipeline),
		options,
	);

	res.status(200).json(
		new ApiResponse(200, channelList, "channels fetched successfully"),
	);
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
