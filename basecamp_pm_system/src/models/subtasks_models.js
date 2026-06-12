import mongoose from "mongoose";
const { Schema, model } = mongoose;

/**
 * Subtask schema – represents a smaller unit of work belonging to a Task.
 * Fields:
 *   - title: required string, trimmed
 *   - description: optional string
 *   - completed: boolean flag (default false)
 *   - dueDate: optional Date
 *   - timestamps: automatically adds createdAt & updatedAt
 */
const subtask = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    completed: { type: Boolean, default: false },
    dueDate: { type: Date },
  },
  { timestamps: true }
);

// Export the Subtask model for use in other modules (e.g., task_models.js)
export const Subtask = model("Subtask", subtaskSchema);