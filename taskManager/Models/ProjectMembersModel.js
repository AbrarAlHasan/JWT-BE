import mongoose from "mongoose";

const Schema = mongoose.Schema;

const ProjectMemberSchema = new Schema(
  {
    projectId: {
      type: mongoose.Schema.ObjectId,
      required: true,
      ref: "Project",
    },
    userId: {
      type: mongoose.Schema.ObjectId,
      required: true,
      ref: "User",
    },
    role: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const ProjectMember = mongoose.model("ProjectMember", ProjectMemberSchema);

export default ProjectMember;
