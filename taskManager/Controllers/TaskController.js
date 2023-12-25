import mongoose from "mongoose";
import ProjectMember from "../Models/ProjectMembersModel.js";
import Task from "../Models/TaskModel.js";
import { checkAccess } from "./AccessController.js";
import Config from "../Config/index.js";
import TaskHistory from "../Models/TaskHistory.js";
import User from "../../models/user.model.js";
import { taskKeyDescription } from "../../Utils/descriptionHandling.js";
import { formatDateTimeTimezone } from "../../Utils/FormatDateTime.js";
import { customMailGenerator } from "../../controllers/mailer.js";
import {
  taskCreatedTemplate,
  taskDueDateRemainderTemplate,
} from "../../Utils/Htmltemplate.js";
import Project from "../Models/ProjectModel.js";

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

    const assigneDetails = await User.findById(assignedTo).select("-password");
    const projectDetails = await Project.findById(projectId);
    const userDetails = await User.findById(createdBy);
    const html = taskCreatedTemplate({
      assigneDetails,
      projectDetails,
      userDetails,
      taskDetails: req.body,
    });

    customMailGenerator(
      assigneDetails.email,
      html,
      `New Task has been Assigned to you - ${projectDetails?.name}`,
      "HTML"
    );

    const checkForWriteAccess = await checkAccess(
      memberId,
      Config.taskModuleId
    );

    if (!checkForWriteAccess.writeAccess) {
      return res.status(400).json("Access Denied Please contact the Owner");
    }
    const task = await newTask.save();
    const taskHistory = new TaskHistory({
      taskId: task?._id,
      createdBy,
      description: `The Task has been Created by ${userDetails?.name}`,
      type: "history",
    });
    await taskHistory.save();

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
      const currentDate = new Date().toISOString().split("T")[0];
      query.endDate = { $lt: new Date(`${currentDate}T00:00:00.000Z`) }; // Tasks with endDate less than today's date
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
      const currentDate = new Date().toISOString().split("T")[0];
      query.endDate = { $lt: new Date(`${currentDate}T23:59:59.999Z`) }; // Tasks with endDate less than today's date
    }

    const tasks = await Task.find(query);

    console.log(tasks);

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
        type: "history",
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

export const getDailyDueTask = async () => {
  try {
    const currentDate = new Date().toISOString().split("T")[0];

    const dueForDay = await Task.aggregate([
      {
        $match: {
          endDate: {
            $gte: new Date(currentDate),
            $lt: new Date(`${currentDate}T23:59:59.999Z`),
          },
        },
      },

      {
        $lookup: {
          from: "projects",
          localField: "projectId",
          foreignField: "_id",
          as: "projectDetails",
        },
      },
      { $unwind: "$projectDetails" },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "createdBy",
        },
      },
      { $unwind: "$createdBy" },
      {
        $group: {
          _id: "$assignedTo",
          tasks: {
            $push: "$$ROOT", // Push the entire document into the tasks array
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "assignedToDetails",
        },
      },
      { $unwind: "$assignedToDetails" },
    ]);
    dueForDay?.map((data) => {
      const html = taskDueDateRemainderTemplate(data);
      customMailGenerator(
        data?.assignedToDetails.email,
        html,
        `REMINDER - THERE ARE TASKS DUE FOR THE DAY`,
        "HTML"
      );
    });
  } catch (error) {
    console.log(error);
  }
};

export const addComments = async (req, res) => {
  try {
    const { taskId, comments, userId } = req.body;
    const taskDetails = await Task.findById(taskId);
    const assignedToDetails = await User.findById(taskDetails.assignedTo);
    const createdBy = await User.findById(taskDetails.createdBy);
    // console.log({ taskDetails, assignedToDetails, createdBy });

    customMailGenerator(
      assignedToDetails.email,
      "A New Comment has Added",
      `New Comment has been Added - ${taskDetails?.name}`,
      createdBy.email
    );

    const newComment = new TaskHistory({
      taskId,
      comments,
      createdBy: userId,
      type: "comment",
    });

    const savedComment = await newComment.save();
    return res.status(200).json(savedComment);
  } catch (error) {
    return res.status(500).json(error.message);
  }
};
