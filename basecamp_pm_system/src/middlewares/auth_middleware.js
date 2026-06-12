import { User } from "../models/user-info_model.js";
import { apierror } from "../utils/apierror.js";
import { asynchandler } from "../utils/asynchandler.js";
import { projectmember } from "../models/project_member_models.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

/**
 * Middleware to verify JWT access token.
 * Looks for token in cookies (accesstoken) or Authorization header (Bearer <token>).
 * Attaches the user document to req.user if valid.
 */
export const verifyjwt = asynchandler(async (req, res, next) => {
  const token =
    req.cookies?.accesstoken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ success: false, message: "Access token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded?._id).select(
      "-password -refreshtoken -emailverifcationtoken -emailverifcationexpiry"
    );

    if (!user) {
      throw new apierror(401, "Invalid access token");
    }

    req.user = user;
    next();
  } catch (err) {
    throw new apierror(401, "Invalid or expired token");
  }
});

export const validateprojectpermission = (roles = []) =>
  asynchandler(async (req, res, next) => {
    const { projectid } = req.params;
    if (!projectid) {
      throw new apierror(400, "Project ID is required");
    }
    const project = await projectmember.findOne({
      project: new mongoose.Types.ObjectId(projectid),
      user: new mongoose.Types.ObjectId(req.user._id),
    });
    if (!project) {
      throw new apierror(404, "Project not found");
    }
    const userRole = project.role;
    req.user.role = userRole;
    if (roles.length && !roles.includes(userRole)) {
      throw new apierror(403, "Forbidden: insufficient role");
    }
    next();
  });