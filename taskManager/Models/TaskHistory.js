import mongoose from "mongoose";

const Schema = mongoose.Schema;

const TaskHistorySchema = new Schema(
  {
    taskId: {
      type: mongoose.Schema.ObjectId,
      required: true,
      ref: "Task",
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      required: true,
      ref: "User",
    },
    description: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const TaskHistory = mongoose.model("TaskHistory", TaskHistorySchema);

export default TaskHistory;
