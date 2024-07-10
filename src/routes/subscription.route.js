import { Router } from "express";
import { getSubscribedChannels, getUserChannelSubscribers, toggleSubscription } from "../controllers/subscription.controller.js";
import JWTverify from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/toggleSubscription/:channelId").post(JWTverify , toggleSubscription)

router.route("/getUserChannelSubscribers/:channelId").get(JWTverify, getUserChannelSubscribers)

router.route("/getSubscribedChannels/:subscriberId").get(JWTverify, getSubscribedChannels)

export default router;