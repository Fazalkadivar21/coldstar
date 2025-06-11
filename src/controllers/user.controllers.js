import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import bcrypt from "bcrypt";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { generateAndSetTokens } from "../utils/genrateTokens.js";

const registerUser = asyncHandler(async (req, res) => {
	// get user details from frontend
	const { fullName, email, username, password } = req.body;

	// validation - not empty
	if (
		[fullName, email, username, password].some(
			(field) => field?.trim() === "",
		)
	) {
		throw new ApiError(400, "All fields are required");
	}

	// check if user already exists: username, email
	const existedUser = await User.findOne({
		$or: [{ username }, { email }],
	});

	if (existedUser) {
		throw new ApiError(409, "User with email or username already exists");
	}

	// check for images, check for avatar
	//console.log(req.files);

	const avatarLocalPath = req.files?.avatar[0]?.path;
	//const coverImageLocalPath = req.files?.coverImage[0]?.path;

	let coverImageLocalPath;
	if (
		req.files &&
		Array.isArray(req.files.coverImage) &&
		req.files.coverImage.length > 0
	) {
		coverImageLocalPath = req.files.coverImage[0].path;
	}

	if (!avatarLocalPath) {
		throw new ApiError(400, "Avatar file is required");
	}

	// upload them to cloudinary, avatar
	const avatar = await uploadOnCloudinary(avatarLocalPath);
	const coverImage = await uploadOnCloudinary(coverImageLocalPath);

	if (!avatar) {
		throw new ApiError(400, "Avatar file is required");
	}

	// create user object - create entry in db
	const hashed = await bcrypt.hash(password, 10);

	const user = await User.create({
		fullName,
		avatar: avatar.url,
		coverImage: coverImage?.url || "",
		email,
		password: hashed,
		username: username.toLowerCase(),
	});

	const { accessToken, refreshToken } = await generateAndSetTokens(user);

	// remove password and refresh token field from response
	const createdUser = await User.findById(user._id, {
		password: 0,
		refreshToken: 0,
	});

	// check for user creation
	if (!createdUser) {
		throw new ApiError(
			500,
			"Something went wrong while registering the user",
		);
	}

	// return res
	const options = {
		httpOnly: true,
		secure: true,
	};

	return res
		.status(200)
		.cookie("accessToken", accessToken, options)
		.cookie("refreshToken", refreshToken, options)
		.json(new ApiResponse(201, createdUser, "User created Successfully"));
});

const login = asyncHandler(async (req, res) => {
	const { username, email, password } = req.body;

	if (!((username || email) && password))
		throw new ApiError(400, "All fields are required.");

	const findUser = await User.findOne(
		{
			$or: [{ email }, { username }],
		},
		{ refreshToken: 0 },
	);

	if (!findUser) throw new ApiError(404, "Invalid username or password");

	const isPasswordValid = await bcrypt.compare(password, findUser.password);
	if (!isPasswordValid) throw new ApiError(409, "Invalid login credentials.");

	const { accessToken, refreshToken } = await generateAndSetTokens(findUser);

	const { password: _p, ...safeUser } = findUser.toObject(); // remove password

	const options = {
		httpOnly: true,
		secure: true,
	};

	return res
		.status(200)
		.cookie("accessToken", accessToken, options)
		.cookie("refreshToken", refreshToken, options)
		.json(new ApiResponse(201, safeUser, "Logged in Successfully"));
});

const logout = asyncHandler(async (req, res) => {
	const user = req.body;

	await User.findByIdAndUpdate(user, {
		$unset: {
			refreshToken: 1, // this removes the field from document
		},
	});

	const options = {
		httpOnly: true,
		secure: true,
	};

	return res
		.status(200)
		.clearCookie("accessToken", options)
		.clearCookie("refreshToken", options)
		.json(new ApiResponse(200, {}, "User logged Out"));
});

const refreshTokens = asyncHandler(async (req, res) => {
	const incomingRefreshToken = req.cookie?.refreshToken;
	if (!incomingRefreshToken) throw new ApiError(401, "Unauthorized request");

	const decodedToken = jwt.verify(
		incomingRefreshToken,
		process.env.REFRESH_TOKEN_SECRET,
	);

	const user = await User.findById(decodedToken.userId, {
		password: 0,
		refreshToken: 0,
	});
	if (!user) throw new ApiError(404, "Invalid token");

	const { accessToken, refreshToken } = await generateAndSetTokens(user);
	const options = {
		httpOnly: true,
		secure: true,
	};

	return res
		.status(200)
		.clearCookie("accessToken", accessToken, options)
		.clearCookie("refreshToken", refreshToken, options)
		.json(new ApiResponse(200, {}, "Token Refreshed"));
});

const changePassword = asyncHandler(async (req, res) => {
	const { currentPassword, newPassword } = req.body;
	const user = req.user;

	if (!(currentPassword && newPassword))
		throw new ApiError(400, "All fields are required");

	const passDoc = await User.findById(user._id).select("+password");

	const isPasswordValid = await bcrypt.compare(currentPassword,passDoc.password);
	
	if (!isPasswordValid) throw new ApiError(401, "Invalid current password");

	if (currentPassword === newPassword)
		throw new ApiError(
			400,
			"New password must be diffrent than old password.",
		);

	const hashed = await bcrypt.hash(newPassword, 10);
	const updatedUser = await User.findByIdAndUpdate(
		user._id,
		{ $set: { password: hashed } },
		{ new: true },
	).select("-password -refreshToken");

	return res
		.status(200)
		.json(new ApiResponse(200, updatedUser, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req,res) => {
	const user = req.user
	return res
		.status(200)
		.json(
			new ApiResponse(200,user,"User fetched successfully")
		)
})

export { registerUser, login, logout, refreshTokens, changePassword, getCurrentUser };
