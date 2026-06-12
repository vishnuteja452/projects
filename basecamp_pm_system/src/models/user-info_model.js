import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken"
import mongoose, { SchemaType } from "mongoose";
import { Schema } from "mongoose";

const userschema = new Schema({
    avatar:{
        type:{
            url:String,
            localpath:String,
        },
        default:{
            url:`https://placehold.co/600x400`,
            localpath:``,
        },},
        username:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
            index:true,
        },
        email:
        {
            type:String,
            required:true,
            trim:true,
            lowercase:true,
            unique:true,
        },
        fullname:{
            type:String,
            required:true,
            unique:false,
            lowercase:true
        },
        password:{
            type:String,
            required:[true,"password is required"]
        },
        isemailverifed:{
            type:Boolean,
            default:false,
        },
        refreshtoken:{
            type:String,
        },
        forgotpasswordtoken:{
            type:String,
        },
        forgotpasswordexpiry:{
            type:Date,
        },
        emailverifcationtoken:{
            type:String,
        },
        emailverifcationexpiry:{
            type:Date,
        }
    },{
    timestamps:true,
});

userschema.pre("save", async function(){
        if(!this.isModified("password")) return;
        this.password = await bcrypt.hash(this.password, 10);
    })
userschema.methods.ispasswordcorrect = async function(password){
        return await bcrypt.compare(password,this.password)
    }

userschema.methods.generateaccesstoken = function(){
     return jwt.sign({
        _id:this._id,
        email:this.email,
        username:this.username,
    },
process.env.ACCESS_TOKEN_SECRET,
{expiresIn:process.env.ACCESS_TOKEN_EXPIRY})
}

userschema.methods.generaterefreshtoken = function(){
    return jwt.sign({
        _id:this._id,
        email:this.email,
        username:this.username,
    },
process.env.REFRESH_TOKEN_SECRET,
{expiresIn:process.env.REFRESH_TOKEN_EXPIRY})
};

userschema.methods.generatetemparorytoken = function(){
    const unhashedtoken = crypto.randomBytes(20).toString("hex")

    const hashedtoken = crypto
        .createHash("sha256")
        .update(unhashedtoken)
        .digest("hex")

    const token_expiry = Date.now()+(20*60*1000)
    return {unhashedtoken,hashedtoken,token_expiry}

};

export const User = mongoose.model("user",userschema) 