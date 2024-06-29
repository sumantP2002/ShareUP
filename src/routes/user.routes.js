import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { loginUser, logoutUser, refreshAccessToken, registerUser } from "../controllers/user.controller.js";
import JWTverify from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]), 
    registerUser
)

router.route("/login").post(loginUser)

router.route("/logout").post(JWTverify , logoutUser);

router.route("/refreshToken").post(refreshAccessToken)

export default router