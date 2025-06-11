import { Router } from "express";
import { upload } from "../middleware/multer.middleware.js";
import { registerUser,login, logout} from "../controllers/user.controllers.js";
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

export default router;
