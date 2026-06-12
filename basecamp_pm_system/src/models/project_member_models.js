import mongoose from "mongoose";
import { availableuserrole, userrolesenum } from "../utils/constants.js";

const projectMemberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "project", required: true },
  role: { type: String, enum: availableuserrole, default: userrolesenum.MEMBER }
}, { timestamps: true });

export const projectmember = mongoose.model("ProjectMember", projectMemberSchema);
