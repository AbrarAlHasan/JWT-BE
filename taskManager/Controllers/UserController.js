import User from "../../models/user.model.js";

export const addUser = async (req, res) => {
  try {
    const { name, email, password, isVerified } = req.body;
    const newUser = new User({ name, email, password, isVerified });
    const user = await newUser.save();
    return res.status(200).json(user);
  } catch (err) {
    return res.status(500).json(err.message);
  }
};

export const getUser = async (req, res) => {
  console.log(req.body);
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    return res.status(200).json(user);
  } catch (err) {
    return res.status(500).json(err.message);
  }
};
