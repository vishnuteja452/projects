import { project } from "../models/project_model.js";
import { Task, Subtask } from "../models/task_models.js";
import { apierror } from "../utils/apierror.js";
import { apiresponse } from "../utils/api_response.js";
import { asynchandler } from "../utils/asynchandler.js";
// Added validation and enhancements
import mongoose from "mongoose"; // ensure mongoose is imported for ObjectId validation

import { availableuserrole, userrolesenum } from "../utils/constants.js";

// Create a new task
const createtasks = asynchandler(async (req, res) => {
  const { title, description, assignedTo, status, dueDate } = req.body;
  const projectId = req.body.projectId || req.body.project;
  if (!title) throw new apierror(400, "Title is required");
  const proj = await project.findById(projectId);
  if (!proj) throw new apierror(404, "Project not found");
  
  let attachments = [];
  if (req.body.attachments && Array.isArray(req.body.attachments)) {
    attachments = req.body.attachments;
  } else if (req.files && req.files.length) {
    attachments = req.files.map((file) => ({
      filename: file.originalname,
      url: `${process.env.SERVER_URL}/images/${file.originalname}`,
      mimetype: file.mimetype,
      size: file.size,
    }));
  }

  const task = await Task.create({
    title,
    description,
    project: proj._id,
    assignedTo: assignedTo ? new mongoose.Types.ObjectId(assignedTo) : undefined,
    status: status || "todo",
    dueDate,
    attachments,
    createdBy: req.user?._id,
  });
  return res.status(201).json(new apiresponse(201, task, "Task created successfully"));
});

// Get all tasks for a project
const gettasks = asynchandler(async (req, res) => {
  const { projectid } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const proj = await project.findById(projectid);
  if (!proj) throw new apierror(404, "Project not found");
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const tasks = await Task.find({ project: proj._id })
    .populate("assignedTo", "avatar username fullname")
    .populate("project", "name")
    .skip(skip)
    .limit(parseInt(limit));
  const total = await Task.countDocuments({ project: proj._id });
  return res.status(200).json(new apiresponse(200, { tasks, total, page: parseInt(page), limit: parseInt(limit) }, "Tasks fetched successfully"));
});

// Get a single task by its ID
const gettasksbyid = asynchandler(async (req, res) => {
  const { taskId } = req.params;
  const task = await Task.aggregate([
  { $match: { _id: new mongoose.Types.ObjectId(taskId) } },
  { $lookup: {
      from: "users",
      localField: "assignedTo",
      foreignField: "_id",
      as: "assignedToInfo"
    } },
  { $unwind: { path: "$assignedToInfo", preserveNullAndEmptyArrays: true } },
  { $lookup: {
      from: "projects",
      localField: "project",
      foreignField: "_id",
      as: "projectInfo"
    } },
  { $unwind: { path: "$projectInfo", preserveNullAndEmptyArrays: true } },
  { $project: {
      title: 1,
      description: 1,
      status: 1,
      dueDate: 1,
      attachments: 1,
      assignedTo: {
        _id: "$assignedToInfo._id",
        username: "$assignedToInfo.username",
        email: "$assignedToInfo.email",
        avatar: "$assignedToInfo.avatar"
      },
      project: {
        _id: "$projectInfo._id",
        name: "$projectInfo.name"
      }
    }
  }
]);
if (!task || task.length === 0) throw new apierror(404, "Task not found");
const result = task[0];
return res.status(200).json(new apiresponse(200, result, "Task fetched successfully"));
});

// Update a task
const updatetask = asynchandler(async (req, res) => {
  const { taskId } = req.params;
  const updates = req.body;
  const task = await Task.findByIdAndUpdate(taskId, updates, { new: true });
  if (!task) throw new apierror(404, "Task not found");
  return res.status(200).json(new apiresponse(200, task, "Task updated successfully"));
});

// Delete a task
const deletetasks = asynchandler(async (req, res) => {
  const { taskId } = req.params;
  const task = await Task.findByIdAndDelete(taskId);
  if (!task) throw new apierror(404, "Task not found");
  return res.status(200).json(new apiresponse(200, null, "Task deleted successfully"));
});

// Create a subtask under a task
const createsubtasks = asynchandler(async (req, res) => {
  const { taskId } = req.params;
  const { title, description, dueDate } = req.body;
  const parent = await Task.findById(taskId);
  if (!parent) throw new apierror(404, "Parent task not found");
  const subtask = await Subtask.create({ title, description, dueDate });
  parent.subtasks = parent.subtasks ? [...parent.subtasks, subtask._id] : [subtask._id];
  await parent.save();
  return res.status(201).json(new apiresponse(201, subtask, "Subtask created successfully"));
});

// Update a subtask
const updatesubtasks = asynchandler(async (req, res) => {
  const { subtaskId } = req.params;
  const updates = req.body;
  const subtask = await Subtask.findByIdAndUpdate(subtaskId, updates, { new: true });
  if (!subtask) throw new apierror(404, "Subtask not found");
  return res.status(200).json(new apiresponse(200, subtask, "Subtask updated successfully"));
});

// Delete a subtask (and remove reference from parent task)
const deletesubtasks = asynchandler(async (req, res) => {
  const { subtaskId, taskId } = req.params;
  const subtask = await Subtask.findByIdAndDelete(subtaskId);
  if (!subtask) throw new apierror(404, "Subtask not found");
  await Task.findByIdAndUpdate(taskId, { $pull: { subtasks: subtaskId } });
  return res.status(200).json(new apiresponse(200, null, "Subtask deleted successfully"));
});

export {
  createtasks,
  gettasks,
  gettasksbyid,
  updatetask,
  deletetasks,
  createsubtasks,
  updatesubtasks,
  deletesubtasks,
};