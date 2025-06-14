import { Video } from "../models/video.model";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
	const {
		page = 1,
		limit = 15,
		query,
		sortBy = "createdAt",
		sortType = -1,
		username,
	} = req.query;

	// Step 1: Match by video fields (before lookup)
	const matchStage = {};

	if (query) {
		const regex = new RegExp(query, "i");
		matchStage.$or = [
			{ title: { $regex: regex } },
			{ description: { $regex: regex } },
		];
	}

	const pipeline = [];

	if (Object.keys(matchStage).length > 0) {
		pipeline.push({ $match: matchStage });
	}

	// Step 2: Lookup and unwind user info
	pipeline.push(
		{
			$lookup: {
				from: "users",
				localField: "owner",
				foreignField: "_id",
				as: "owner",
				pipeline: [
					{
						$project: {
							avatar: 1,
							username: 1,
						},
					},
				],
			},
		},
		{ $unwind: "$owner" },
	);

	// Step 3: Match by username (after lookup)
	if (username) {
		pipeline.push({
			$match: {
				"owner.username": username,
			},
		});
	}

	// Step 4: Final projection
	pipeline.push({
		$project: {
			videoFile: 1,
			thumbnail: 1,
			title: 1,
			description: 1,
			duration: 1,
			views: 1,
			owner: 1,
		},
	});

	// Step 5: Sorting
	pipeline.push({
		$sort: {
			[sortBy]: parseInt(sortType),
		},
	});

	// Step 6: Pagination
	const options = {
		page: parseInt(page),
		limit: parseInt(limit),
	};

	const result = await Video.aggregatePaginate(
		Video.aggregate(pipeline),
		options,
	);

	return res
		.status(200)
		.json(new ApiResponse(200, result, "Videos fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
	const { title, description } = req.body;
	// TODO: get video, upload to cloudinary, create video

	if (!(title && description))
		throw new ApiError(400, "Title and description required.");

	const videoLocalPath = req.files?.video[0]?.path;
	const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

	const { url: videoUrl, duration } =
		await uploadOnCloudinary(videoLocalPath);
	console.log(videoUrl);

	const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
	if (!videoUrl) throw new ApiError(404, "Video is required");
	if (!thumbnail.url) throw new ApiError(404, "Thumbnail is required");

	const video = await Video.create({
		videoFile: videoUrl,
		thumbnail: thumbnail.url,
		title,
		description,
		duration: duration,
		owner: req.user?._id,
	});

	return res
		.status(200)
		.json(new ApiResponse(200, video, "Video uploaded successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
	const { videoId } = req.params;
	//TODO: get video by id
	const video = await Video.findById(videoId);
	if (!video) throw new ApiError(404, "video not found");

	return res
		.status(200)
		.json(new ApiResponse(200, video, "video fetched successfully."));
});

const updateVideo = asyncHandler(async (req, res) => {
	const { videoId } = req.params;
	//TODO: update video details like title, description, thumbnail

});

const deleteVideo = asyncHandler(async (req, res) => {
	const { videoId } = req.params;
	//TODO: delete video
});

const togglePublishStatus = asyncHandler(async (req, res) => {
	const { videoId } = req.params;
});

export {
	getAllVideos,
	publishAVideo,
	getVideoById,
	updateVideo,
	deleteVideo,
	togglePublishStatus,
};
