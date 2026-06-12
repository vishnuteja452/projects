import mongoose from "mongoose";
const { Schema, model } = mongoose;

const projectSchema = new Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String },
  createdby: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

export const project = model("Project", projectSchema);