import User from "../../models/user.model.js";
import Config from "../Config/index.js";
import AccessControl from "../Models/AccessControlModel.js";
import ProjectMember from "../Models/ProjectMembersModel.js";
import { checkAccess, checkMemberAccess } from "./AccessController.js";

export const addProjectMember = async (req, res) => {
  try {
    const { userId, projectId, role, createdBy, accessDetails, memberId } =
      req.body;
    console.log({
      userId,
      projectId,
      role,
      createdBy,
      accessDetails,
      memberId,
    });
    const checkForWriteAccess = await checkAccess(
      memberId,
      Config.memberModuleId
    );
    if (!checkForWriteAccess.writeAccess) {
      return res.status(400).json("Access Denied Please contact the Owner");
    }
    const checkMember = await ProjectMember.findOne({ userId, projectId });
    if (checkMember) {
      return res
        .status(400)
        .json("This user is already a Member in this Project");
    }
    const newMember = new ProjectMember({ userId, projectId, role, createdBy });
    const member = await newMember.save();

    const accessControl = await Promise.all(
      accessDetails.map(async (data) => {
        const newAccessControl = new AccessControl({
          memberId: member?._id,
          moduleId: data?._id,
          readAccess: data?.readAccess,
          writeAccess: data?.writeAccess,
          updateAccess: data?.updateAccess,
          deleteAccess: data?.deleteAccess,
        });

        try {
          await newAccessControl.validate();
          return newAccessControl;
        } catch (error) {
          throw new Error(`AccessControl validation failed: ${error.message}`);
        }
      })
    );

    const accessControlSaved = await AccessControl.insertMany(accessControl);
    console.log(accessControlSaved)

    return res.status(200).json("Member Added Successfully");
  } catch (err) {
    return res.status(500).json(err.message);
  }
};

export const checkUser = async (req, res) => {
  try {
    const { email } = req.query;
    const userDetails = await User.findOne({ email: email });
    return res.status(200).json(userDetails);
  } catch (err) {
    return res.status(500).json(err.message);
  }
};

export const getMembers = async (req, res) => {
  try {
    const { projectId, memberId } = req.params;
    const { name } = req.query;

    const accessControl = await checkAccess(memberId, Config.memberModuleId);
    if (!accessControl?.readAccess) {
      return res.status(400).json(`Access Denied Please contact the Owner`);
    }

    let query = { projectId };

    if (name && typeof name === "string" && name.trim() !== "") {
      query.userId = { $regex: new RegExp(name.trim(), "i") };
    }

    const projectMembers = await ProjectMember.find(query).populate("userId");
    // console.log(projectMembers);
    return res.status(200).json(projectMembers);
  } catch (err) {
    return res.status(500).json(err.message);
  }
};

export const getMemberDetails = async (req, res) => {
  try {
    const { projectId, userId } = req.body;
    const memberDetails = await ProjectMember.findOne({ projectId, userId });
    return res.status(200).json(memberDetails);
  } catch (err) {
    return res.status(500).json(err.message);
  }
};
