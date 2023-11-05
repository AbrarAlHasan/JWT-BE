import mongoose from "mongoose";
import AccessControl from "../Models/AccessControlModel.js";

export const addAccessControlForMember = async (req, res) => {
  try {
    const { memberId, read, write, update, remove } = req.body;
    const newAccess = new AccessControl({
      memberId,
      read,
      write,
      update,
      remove,
    });
    await newAccess.save();

    return res.status(200).json("Access Control is Assigned");
  } catch (err) {
    return res.status(500).json(err.message);
  }
};

export const checkAccess = async (memberId, moduleId) => {
  try {
    const accessDetails = await AccessControl.findOne({ memberId, moduleId });
    return accessDetails;
  } catch (err) {
    return err.message;
  }
};

export const checkMemberAccess = async (req, res) => {
  const { memberId } = req.body;
  try {
    const accessDetails = await AccessControl.find({ memberId });

    return res.status(200).json(accessDetails);
  } catch (err) {
    return res.status(500).json(err.message);
  }
};
