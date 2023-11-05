import mongoose from "mongoose";
import Module from "../Models/ModulesModel.js";

export const addModule = async (req, res) => {
  try {
    const { moduleName } = req.body;
    const newModule = new Module({ moduleName });
    const moduleSaved = await newModule.save();

    return res.status(200).json(moduleSaved);
  } catch (err) {
    return res.status(500).json(err.message);
  }
};

export const getModule = async (req, res) => {
  try {
    const moduleList = await Module.find();

    return res.status(200).json(moduleList);
  } catch (err) {
    return res.status(500).json(err.message);
  }
};
