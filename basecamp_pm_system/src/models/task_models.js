import mongoose from "mongoose";
const { Schema, model } = mongoose;

// Subtask schema (used by Task)
const subtaskSchema = new Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String },
  completed: { type: Boolean, default: false },
  dueDate: { type: Date }
}, { timestamps: true });

export const Subtask = model("Subtask", subtaskSchema);

// Task schema
const taskSchema = new Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String },
  project: { type: Schema.Types.ObjectId, ref: "Project", required: true },
  status: {
    type: String,
    enum: ["todo", "in_progress", "done"],
    default: "todo"
  },
  dueDate: { type: Date },
  assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  subtasks: [{ type: Schema.Types.ObjectId, ref: "Subtask" }],
  attachments: [{
    filename: { type: String, required: true },
    url: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true }
  }],
}, { timestamps: true });

export const Task = model("Task", taskSchema);