import { User } from "../models/user-info_model.js";
import { project } from "../models/project_model.js";
import { projectmember } from "../models/project_member_models.js";
import { apierror } from "../utils/apierror.js";
import { asynchandler } from "../utils/asynchandler.js";
import { apiresponse } from "../utils/api_response.js";
import { userrolesenum } from "../utils/constants.js";
import mongoose from "mongoose";

const getprojects = asynchandler(async (req, res) => {
  // Fetch all projects the user is a member of, with member count and role
  const projects = await projectmember.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "projects",
        localField: "project",
        foreignField: "_id",
        as: "projects",
        pipeline: [
          {
            $lookup: {
              from: "projectmembers",
              localField: "_id",
              foreignField: "project",
              as: "projectmembers",
            },
          },
          {
            $addFields: {
              members: { $size: "$projectmembers" },
            },
          },
        ],
      },
    },
    { $unwind: "$projects" },
    {
      $project: {
        _id: "$projects._id",
        name: "$projects.name",
        description: "$projects.description",
        createdAt: "$projects.createdAt",
        createdBy: "$projects.createdby",
        role: "$role",
        members: "$projects.members",
      },
    },
  ]);
  return res.status(200).json(new apiresponse(200, projects, "Projects fetched successfully"));
});
const getprojectsbyid = asynchandler(async (req, res) => {
  const projectid = req.params.projectid || req.params.id;
  if (!projectid) {
    throw new apierror(400, "Project ID is required");
  }
  try {
    const proj = await project.findById(projectid);
    if (!proj) {
      throw new apierror(404, "Project not found");
    }
    // Return standard data format matching the frontend expectations
    return res.status(200).json(new apiresponse(200, proj, "Project fetched successfully"));
  } catch (err) {
    throw new apierror(500, err.message);
  }
});
const createprojects = asynchandler(async (req, res) => {
  const { name, description } = req.body;
  // Assume the creator is the currently authenticated user (req.user._id) or passed in body
  const createdBy = req.user?._id || req.body.createdBy;

  if (!name) {
    throw new apierror(400, "Project name is required");
  }

  try {
    const newProject = await project.create({ name, description, createdby: createdBy });
    
    // Add creator as project admin
    await projectmember.create({
      project: newProject._id,
      user: createdBy,
      role: userrolesenum.ADMIN
    });

    return res.status(201).json(
      new apiresponse(201, { project: newProject }, "Project created successfully")
    );
  } catch (err) {
    // Handle duplicate name error
    if (err.code === 11000) {
      throw new apierror(409, "Project name already exists");
    }
    throw new apierror(500, err.message);
  }
});

const updateprojects = asynchandler(async (req, res) => {
  const projectid = req.params.projectid || req.params.id;
  const { name, description } = req.body;

  if (!projectid) {
    throw new apierror(400, "Project ID is required");
  }

  try {
    const updatedProject = await project.findByIdAndUpdate(
      projectid,
      { name, description },
      { new: true }
    );
    if (!updatedProject) {
      throw new apierror(404, "Project not found");
    }
    return res.status(200).json(
      new apiresponse(200, { project: updatedProject }, "Project updated successfully")
    );
  } catch (err) {
    throw new apierror(500, err.message);
  }
});

const deleteprojects = asynchandler(async (req, res) => {
  const projectid = req.params.projectid || req.params.id;

  if (!projectid) {
    throw new apierror(400, "Project ID is required");
  }

  try {
    const deletedProject = await project.findByIdAndDelete(projectid);
    if (!deletedProject) {
      throw new apierror(404, "Project not found");
    }
    // Also delete members of this project
    await projectmember.deleteMany({ project: projectid });
    return res.status(200).json(
      new apiresponse(200, null, "Project deleted successfully")
    );
  } catch (err) {
    throw new apierror(500, err.message);
  }
});

const addmemberstoproject = asynchandler(async (req, res) => {
  const { email, role } = req.body;
  const projectid = req.params.projectid || req.body.projectId;
  if (!email || !projectid) {
    throw new apierror(400, "email and projectid are required");
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      throw new apierror(404, "User not found with this email");
    }
    const existing = await projectmember.findOne({ project: projectid, user: user._id });
    if (existing) {
      throw new apierror(409, "User is already a member of the project");
    }
    const newMember = await projectmember.create({ project: projectid, user: user._id, role: role || "member" });
    return res.status(201).json(new apiresponse(201, { member: newMember }, "Member added to project"));
  } catch (err) {
    throw new apierror(err.statusCode || 500, err.message);
  }
});
const getprojectmemebers = asynchandler(async (req, res) => {
  const projectid = req.params.projectid || req.params.projectId;
  if (!projectid) {
    throw new apierror(400, "Project ID parameter is required");
  }
  try {
    const members = await projectmember.aggregate([
      { $match: { project: new mongoose.Types.ObjectId(projectid) } },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },
      {
        $project: {
          _id: 0,
          userId: "$userInfo._id",
          username: "$userInfo.username",
          email: "$userInfo.email",
          role: 1,
        },
      },
    ]);
    return res.status(200).json(new apiresponse(200, members, "Project members fetched"));
  } catch (err) {
    throw new apierror(500, err.message);
  }
});
const updateprojectmembersroles = asynchandler(async (req, res) => {
  const projectid = req.params.projectid || req.body.projectId;
  const userId = req.params.userId || req.body.memberId;
  const { role } = req.body;
  
  if (!projectid || !userId || !role) {
    throw new apierror(400, "projectid, userId and role are required");
  }
  try {
    const updated = await projectmember.findOneAndUpdate(
      { project: projectid, user: userId },
      { role },
      { new: true }
    );
    if (!updated) {
      throw new apierror(404, "Project member not found");
    }
    return res.status(200).json(new apiresponse(200, { member: updated }, "Member role updated"));
  } catch (err) {
    throw new apierror(500, err.message);
  }
});
const deletemember = asynchandler(async (req, res) => {
  const projectid = req.params.projectid || req.body.projectId;
  const userId = req.params.userId || req.body.memberId;
  if (!projectid || !userId) {
    throw new apierror(400, "projectid and userId are required");
  }
  try {
    const removed = await projectmember.findOneAndDelete({ project: projectid, user: userId });
    if (!removed) {
      throw new apierror(404, "Project member not found");
    }
    return res.status(200).json(new apiresponse(200, null, "Member removed from project"));
  } catch (err) {
    throw new apierror(500, err.message);
  }
});

export{
    addmemberstoproject,
    createprojects,
    updateprojectmembersroles,
    updateprojects,
    getprojectmemebers,
    getprojects,
    getprojectsbyid,
    deleteprojects,
    deletemember
};