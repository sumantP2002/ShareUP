import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    firstName: {
        type: String,
        required: true
    },
    watchHistory: {
        type: Schema.Types.ObjectId,
        ref: "Video",
    },
    avatar: {
        type: String,
        required: true
    },
    coverImage: {
        type: String,
        required: true
    },
    refreshToken: {
        type: String
    }
}, {timestamps: true});

UserSchema.pre("save", async(next) => {
    if(!this.isModified("password")){
        return next();
    }
    this.password = await bcrypt.hash(this.password, 10);
    next();
})

export const User = mongoose.model("User", UserSchema);