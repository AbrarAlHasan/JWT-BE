import mongoose from "mongoose";
import ProjectMember from "../Models/ProjectMembersModel.js";
import Task from "../Models/TaskModel.js";
import { checkAccess } from "./AccessController.js";
import Config from "../Config/index.js";

export const addTask = async (req, res) => {
  try {
    const {
      projectId,
      name,
      description,
      startDate,
      endDate,
      assignedTo,
      priority,
      tags,
      progress,
      memberId,
    } = req.body;
    const newTask = new Task({
      projectId,
      name,
      description,
      startDate,
      endDate,
      assignedTo,
      priority,
      tags,
      progress,
    });

    const checkForWriteAccess = await checkAccess(
      memberId,
      Config.taskModuleId
    );
    console.log(memberId,Config.taskModuleId)
    console.log(checkForWriteAccess)
    if (!checkForWriteAccess.writeAccess) {
      return res.status(400).json("Access Denied Please contact the Owner");
    }

    const task = await newTask.save();
    return res.status(200).json(task);
  } catch (err) {
    console.log(err);
    return res.status(500).json(err._message);
  }
};

export const getTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status } = req.query;
    let query = { projectId };
    if (status === "pending") {
      query.progress = { $lt: 100 }; // Tasks with progress < 100
    } else if (status === "completed") {
      query.progress = 100; // Tasks with progress = 100
    } else if (status === "breached") {
      const today = new Date();
      query.endDate = { $lt: today }; // Tasks with endDate less than today's date
    }
    const tasks = await Task.find(query).populate("assignedTo", "name");
    console.log(tasks);

    return res.status(200).json(tasks);
  } catch (err) {
    return res.status(500).json(err.message);
  }
};

export const getMyTasks = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;

    let query = { assignedTo: userId }; // Default query for all tasks assigned to the user

    if (status === "pending") {
      query.progress = { $lt: 100 }; // Tasks with progress < 100
    } else if (status === "completed") {
      query.progress = 100; // Tasks with progress = 100
    } else if (status === "breached") {
      const today = new Date();
      query.endDate = { $lt: today }; // Tasks with endDate less than today's date
    }

    const tasks = await Task.find(query);

    return res.status(200).json(tasks);
  } catch (err) {
    return res.status(500).json(err.message);
  }
};

export const getTaskDetails = async (req, res) => {
  try {
    const { taskId } = req.params;
    const taskDetails = await Task.findById(taskId).populate({
      path: "assignedTo",
      select: "_id name",
    });

    return res.status(200).json(taskDetails);
  } catch (err) {
    return res.status(500).json(err.message);
  }
};

export const getProjects = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name } = req.query;

    const query = [
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: "projects", // The name of the 'Project' collection in the database
          localField: "projectId",
          foreignField: "_id",
          as: "projectDetails",
        },
      },
    ];
    if (name) {
      query.push({
        $match: {
          projectDetails: {
            $elemMatch: {
              name: { $regex: name, $options: "i" },
            },
          },
        },
      });
    }

    query.push(
      {
        $unwind: "$projectDetails", // Unwind the 'projectDetails' array
      },
      {
        $replaceRoot: {
          newRoot: "$projectDetails", // Replace the root with 'projectDetails'
        },
      }
    );

    const projectList = await ProjectMember.aggregate([query]);

    return res.status(200).json(projectList);
  } catch (err) {
    return res.status(500).json(err.message);
  }
};

export const getMembers = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name } = req.query;

    const query = [
      { $match: { projectId: new mongoose.Types.ObjectId(projectId) } },
      {
        $lookup: {
          from: "users", // The name of the 'users' collection in the database
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
    ];

    if (name) {
      query.push({
        $match: {
          "userDetails.name": { $regex: name, $options: "i" }, // Case-insensitive search
        },
      });
    }
    query.push(
      {
        $unwind: "$userDetails",
      },
      {
        $project: {
          name: "$userDetails.name",
          _id: "$userDetails._id",
          role: 1, // Include the 'role' field as it is
        },
      }
    );

    const projectMembers = await ProjectMember.aggregate(query);

    return res.status(200).json(projectMembers);
  } catch (err) {
    return res.status(500).json(err.message);
  }
};
