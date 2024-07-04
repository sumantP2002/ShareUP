import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { changeCurrentPassword, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateAvatar, updateCoverImage } from "../controllers/user.controller.js";
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

router.route("/changeCurrentPassword").post(JWTverify, changeCurrentPassword);

router.route("/updateAccountDetail").post(JWTverify, updateAccountDetails)

router.route("/updateAvatar").post(
    upload.single("avatar"),
    JWTverify,
    updateAvatar
)

router.route("/updateCoverImage").post(
    upload.single("coverImage"),
    JWTverify,
    updateCoverImage
)

export default router