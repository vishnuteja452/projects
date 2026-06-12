import mongoose, { Schema } from "mongoose";
// importing bcrypt
import bcrypt from "bcrypt"
// importing jwt from json web token
import jwt from "jsonwebtoken"
const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    fullname: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      required: [true, "password is required"],
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.isPasswordCorrect = async function(password){
  return bcrypt.compare(password,this.password)
}

userSchema.methods.GenerateAccessToken = function(){
  // this is a short lived jwt token
  return jwt.sign({
    _id: this._id,
    email:this.email,
    fullname:this.fullname
  },process.env.ACCESS_TOKEN_SECRET,{expiresIn:process.env.ACCESS_TOKEN_EXPIRY})
}

userSchema.methods.GenerateRefreshToken = function(){
  // this is a long lived jwt token
  return jwt.sign({
    _id: this._id,
  },process.env.REFRESH_TOKEN_SECRET,{expiresIn:process.env.REFRESH_TOKEN_EXPIRY})
}

export const User = mongoose.model("User", userSchema);