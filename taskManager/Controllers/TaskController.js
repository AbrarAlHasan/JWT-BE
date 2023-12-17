import mongoose from "mongoose";
import ProjectMember from "../Models/ProjectMembersModel.js";
import Task from "../Models/TaskModel.js";
import { checkAccess } from "./AccessController.js";
import Config from "../Config/index.js";
import TaskHistory from "../Models/TaskHistory.js";
import User from "../../models/user.model.js";
import { taskKeyDescription } from "../../Utils/descriptionHandling.js";
import { formatDateTimeTimezone } from "../../Utils/FormatDateTime.js";

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
      createdBy,
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
      createdBy,
    });

    const checkForWriteAccess = await checkAccess(
      memberId,
      Config.taskModuleId
    );

    if (!checkForWriteAccess.writeAccess) {
      return res.status(400).json("Access Denied Please contact the Owner");
    }
    const task = await newTask.save();
    const userDetails = await User.findById(createdBy);
    const taskHistory = new TaskHistory({
      taskId: task?._id,
      createdBy,
      description: `The Task has been Created by ${userDetails?.name}`,
    });
    await taskHistory.save();
    return res.status(200).json(task);
  } catch (err) {
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

export const editTask = async (req, res) => {
  try {
    const { _id, memberId, userId, ...updateFields } = req.body;

    
    const updateKeys = Object.keys(updateFields);
    if (!memberId) {
      return res
        .status(400)
        .json("Missing Member ID (memberId) in the request body");
    }

    const checkForUpdateAccess = await checkAccess(
      memberId,
      Config.taskModuleId
    );

    if (!checkForUpdateAccess.updateAccess) {
      return res.status(400).json("Access Denied Please contact the Owner");
    }

    if (!_id) {
      return res.status(400).json("Task Id Not Found");
    }

    const taskDetails = await Task.findById(_id);

    if (!taskDetails) {
      return res.status(404).json({ error: "Task not found" });
    }

    const userDetails = await User.findById(userId);

    const taskHistoryPostDetails = updateKeys?.map((keyName) => {
      return {
        taskId: _id,
        createdBy: userId,
        description:
          updateFields[keyName] === "startDate" ||
          updateFields[keyName] === "endDate"
            ? `${userDetails?.name} changed the ${
                taskKeyDescription[keyName]
              } to ${formatDateTimeTimezone(updateFields[keyName])}`
            : `${userDetails?.name} changed the ${taskKeyDescription[keyName]} to ${updateFields[keyName]}`,
      };
    });

    const newTaskHistory = await Promise.all(
      taskHistoryPostDetails?.map(async (data) => {
        const newTaskHistory = new TaskHistory(data);
        try {
          await newTaskHistory.validate();
          return newTaskHistory;
        } catch (err) {
          throw new Error(`Task History Post Failed: ${err.message}`);
        }
      })
    );

    const taskHistorySaved = await TaskHistory.insertMany(newTaskHistory);

    const updatedTask = await Task.findOneAndUpdate({ _id }, updateFields, {
      new: true,
    });

    return res.status(200).json(updatedTask);
  } catch (err) {
    return res.status(500).json(err.message);
  }
};

export const getTaskHistory = async (req, res) => {
  try {
    const { taskId } = req.params;
    const taskHistory = await TaskHistory.find({ taskId })
      .sort({
        createdAt: -1,
      })
      .populate("createdBy", "name _id email");

    return res.status(200).json(taskHistory);
  } catch (error) {
    return res.status(500).json(error.message);
  }
};
