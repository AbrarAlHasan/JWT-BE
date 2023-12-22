import mongoose from "mongoose";

const Schema = mongoose.Schema;

const TaskSchema = new Schema(
  {
    projectId: {
      type: mongoose.Schema.ObjectId,
      required: true,
      ref:'Project'
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.ObjectId,
      required: true,
      ref: "User",
    },
    priority: {
      type: String,
      required: true,
    },
    tags: {
      type: String,
    },
    progress: {
      type: Number,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      required: true,
      ref: "User",
    },
  },
  { timestamps: true }
);

const Task = mongoose.model("Task", TaskSchema);

export default Task;
