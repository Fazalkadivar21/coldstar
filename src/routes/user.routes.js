import { Router } from "express";
import { upload } from "../middleware/multer.middleware.js";
import { registerUser,login, logout,refreshTokens,changePassword,getCurrentUser} from "../controllers/user.controllers.js";
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
router.route("/login").post(login)
router.route("/logout").post(verifyJWT,logout)
router.route("/refreshToken").post(refreshTokens)
router.route("/changePassword").post(verifyJWT,changePassword)
router.route("/getcurrentuser").get(verifyJWT,getCurrentUser)


export default router;
