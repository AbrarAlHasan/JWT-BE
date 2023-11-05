import mongoose from "mongoose";

const Schema = mongoose.Schema;

const AccessControlSchema = new Schema(
  {
    memberId: {
      type: mongoose.Schema.ObjectId,
      required: true,
      ref: "ProjectMembers",
    },
    readAccess: {
      type: Number,
      required: true,
    },
    writeAccess: {
      type: Number,
      required: true,
    },
    updateAccess: {
      type: Number,
      required: true,
    },
    deleteAccess: {
      type: Number,
      required: true,
    },
    moduleId:{
      type: mongoose.Schema.ObjectId,
      required: true,
      ref: "Module",
    }
  },
  { timestamps: true }
);

const AccessControl = mongoose.model("AccessControl", AccessControlSchema);

export default AccessControl;
