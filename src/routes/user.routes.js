import { Router } from "express";
import { upload } from "../middleware/multer.middleware.js";
import {
	registerUser,
	login,
	logout,
	refreshTokens,
	changePassword,
	getCurrentUser,
	updateAccountDetails,
	updateAvatar,
	updateCoverImage,
	getUserChannelProfile,
	getWatchHistory,
} from "../controllers/user.controllers.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/register").post(
	upload.fields([
		{
			name: "avatar",
			maxcount: 1,
		},
		{
			name: "coverImage",
			maxcount: 1,
		},
	]),
	registerUser,
);
router.route("/login").post(login);
router.route("/logout").post(verifyJWT, logout);
router.route("/refreshToken").post(refreshTokens);
router.route("/changePassword").post(verifyJWT, changePassword);
router.route("/@me").get(verifyJWT, getCurrentUser);
router.route("/update-account").patch(verifyJWT, updateAccountDetails);
router.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), updateAvatar);
router.route("/update-coverimage").patch(verifyJWT, upload.single("coverImage"), updateCoverImage);
router.route("/c/:username").get(verifyJWT, getUserChannelProfile);
router.route("/history").get(verifyJWT, getWatchHistory);

export default router;
