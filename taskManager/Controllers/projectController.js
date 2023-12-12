import mongoose from "mongoose";
import ProjectMember from "../Models/ProjectMembersModel.js";
import Project from "../Models/ProjectModel.js";
import Task from "../Models/TaskModel.js";
import Module from "../Models/ModulesModel.js";
import AccessControl from "../Models/AccessControlModel.js";

export const createProject = async (req, res) => {
  try {
    const { name, description, createdBy } = req.body;
    const modules = await Module.find();

    const newProject = new Project({ name, description, createdBy });
    const project = await newProject.save();
    const newMember = new ProjectMember({
      userId: createdBy,
      projectId: project._id,
      role: "owner",
    });
    const projectMember = await newMember.save();

    const accessControl = await Promise.all(
      modules.map(async (data) => {
        const newAccessControl = new AccessControl({
          memberId: projectMember?._id,
          moduleId: data?._id,
          readAccess: 1,
          writeAccess: 1,
          updateAccess: 1,
          deleteAccess: 1,
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

    console.log(accessControlSaved, project, projectMember);
    return res
      .status(200)
      .json({ project, projectMember, accessControl: accessControlSaved });
    // return res.status(200).json('Project Created')
  } catch (err) {
    return res.status(500).json(err.message);
  }
};

export const getProjects = async (req, res) => {
  try {
    const { userId } = req.params;
    const projectList = await ProjectMember.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: "users", // The name of the 'Project' collection in the database
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: "$userDetails", // If you expect only one project per member, otherwise skip this stage
      },
      {
        $lookup: {
          from: "projects", // The name of the 'Project' collection in the database
          localField: "projectId",
          foreignField: "_id",
          as: "projectDetails",
        },
      },

      {
        $unwind: "$projectDetails", // If you expect only one project per member, otherwise skip this stage
      },
      {
        $lookup: {
          from: "users", // The name of the 'User' collection in the database
          localField: "projectDetails.createdBy",
          foreignField: "_id",
          as: "projectDetails.createdBy",
        },
      },
      {
        $unwind: "$projectDetails.createdBy", // If you expect only one project per member, otherwise skip this stage
      },
      {
        $lookup: {
          from: "tasks", // The name of the 'Task' collection in the database
          localField: "projectDetails._id",
          foreignField: "projectId",
          as: "tasks",
        },
      },
      {
        $addFields: {
          totalTasks: { $size: "$tasks" }, // Count the total tasks for each project
          completedTasks: {
            $size: {
              $filter: {
                input: "$tasks",
                as: "task",
                cond: { $eq: ["$$task.progress", 100] },
              },
            },
          },
        },
      },

      {
        $group: {
          _id: "$_id",
          userId: { $first: "$userId" },
          role: { $first: "$role" },
          projectDetails: { $push: "$projectDetails" }, // Group back the projectDetails array
          userDetails: { $first: "$userDetails" },
          totalTasks: { $first: "$totalTasks" },
          completedTasks: { $first: "$completedTasks" },
        },
      },
      {
        $unwind: "$projectDetails", // If you expect only one project per member, otherwise skip this stage
      },
      { $sort: { "projectDetails.createdAt": -1 } },
    ]);

    return res.status(200).json(projectList);
  } catch (err) {
    return res.status(500).json(err.message);
  }
};

export const getProjectDetails = async (req, res) => {
  try {
    const { projectId, userId } = req.params;
    const projectPromise = Project.findById(projectId).lean();

    const totalTasksPromise = Task.countDocuments({ projectId }).exec();
    const completedTasksPromise = Task.countDocuments({
      projectId,
      progress: 100,
    }).exec();
    const totalMembersPromise = ProjectMember.countDocuments({ projectId });

    const pendingTasksPromise = Task.countDocuments({
      projectId,
      progress: { $lt: 100 }, // Get tasks with progress less than 100
    }).exec();

    const memberDetailsPromise = ProjectMember.findOne({ projectId, userId });

    const [
      project,
      totalTasks,
      completedTasks,
      totalMembers,
      pendingTasks,
      memberDetails,
    ] = await Promise.all([
      projectPromise,
      totalTasksPromise,
      completedTasksPromise,
      totalMembersPromise,
      pendingTasksPromise,
      memberDetailsPromise,
    ]);

    return res.status(200).json({
      ...project,
      totalTasks,
      completedTasks,
      totalMembers,
      pendingTasks,
      memberDetails,
    });
  } catch (err) {
    return res.status(500).json(err);
  }
};
