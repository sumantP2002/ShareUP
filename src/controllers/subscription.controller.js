import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

//toggle the Subscription
const toggleSubscription = asyncHandler(async (req, res)=> {
    const channelId = req.params.channelId
    console.log(new mongoose.Types.ObjectId(channelId));
    console.log(req.user._id);
    const subscribedDocument = await Subscription.findOne(
        {
            subscriber: req.user._id,
            channel: new mongoose.Types.ObjectId(channelId)
        }
    )

    console.log(subscribedDocument);

    //not subscribed yet so do the subscription
    if(subscribedDocument === null){
        const subsData = await Subscription.create({
            subscriber: req.user._id,
            channel: channelId
        });
        return res.status(200).json(new ApiResponse(200, {subsData} , "Subscribed Successfully"))
    }

    //else already subscribed so delete that doc
    await Subscription.deleteOne({
        subscriber: req.user._id,
        channel: channelId
    });

    return res.status(200).json(new ApiResponse(200, "Unsubscribed Successfully"))

})

//controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const channelId = new mongoose.Types.ObjectId(req.params.channelId);
    console.log(channelId)
    const data = await Subscription.aggregate([
        {
            $match: {
                channel: channelId
            }
        },
        {
            $group: {
                _id: channelId,
                subscribers: {
                    $addToSet: "$subscriber"
                }
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, {data} , "Subscribers list found Successfully"))

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const subscriberId = new mongoose.Types.ObjectId(req.params.subscriberId);

    const data = await Subscription.aggregate([
        {
            $match: {
                subscriber: subscriberId
            }
        },
        {
            $group: {
                _id: subscriberId,
                subscribedTo: {
                    $addToSet: "$channel"
                }
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, {data} , "Channel List Found Successfully"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}