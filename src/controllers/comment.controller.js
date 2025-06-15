import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
	const { videoId } = req.params;
	const { page = 1, limit = 10 } = req.query;

	if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid videoId");

	const options = {
		page: parseInt(page),
		limit: parseInt(limit),
	};

	const pipeline = [
		{
			$match: {
				video: videoId,
			},
		},
		{
			$lookup: {
				from: "users",
				localField: "owner",
				foreignField: "_id",
				as: "owner",
				pipeline: [
					{
						$project: {
							_id: 0,
							username: 1,
							avatar: 1,
						},
					},
				],
			},
		},
		{
			$unwind: "$owner",
		},
	];

	const comments = await Comment.aggregatePaginate(
		Comment.aggregate(pipeline),
		options,
	);

	return res
		.status(200)
		.json(new ApiResponse(200, comments, "Comments fetched successfully"));
});

const addComment = asyncHandler(async (req, res) => {
	const { videoId } = req.params;
	const { content } = req.body;

	if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid videoId");
	if (!content) throw new ApiError(400, "Content is required");

	const comment = await Comment.create({
		content,
		video: videoId,
		owner: req.user._id,
	});

	if (!comment) throw new ApiError(400, "cant create comment");

	return res
		.status(200)
		.json(new ApiResponse(200, comment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
	const { commentId } = req.params;
	const { content } = req.body;

	if (!content) throw new ApiError(400, "Content is required");

	if (!isValidObjectId(commentId))
		throw new ApiError(400, "Invalid commentId");

	const comment = await Comment.findByIdAndUpdate(
		commentId,
		{
			$set: {
				content,
			},
		},
		{ new: true },
	);

	if (!comment) throw new ApiError(404, "Comment not found or couldn't be updated");

	return res
		.status(200)
		.json(new ApiResponse(200, comment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
	const { commentId } = req.params;

	if (!isValidObjectId(commentId))
		throw new ApiError(400, "Invalid commentId");

	const comment = await Comment.findByIdAndDelete(commentId);

	if (!comment) throw new ApiError(404, "Comment not found or couldn't be deleted");


	return res
		.status(200)
		.json(new ApiResponse(200, comment, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
