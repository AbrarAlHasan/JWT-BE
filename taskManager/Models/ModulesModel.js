import mongoose from "mongoose";

const Schema = mongoose.Schema;

const ModuleSchema = new Schema({
  moduleName: {
    type: String,
    required: true,
  },
});

const Module = mongoose.model("Module", ModuleSchema);

export default Module;
