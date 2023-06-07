import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import {
  generateTokens,
  signToken,
  verifyJWT,
} from "../middlewares/jwtHandler.js";
import { config } from "dotenv";
import otpGenerator from "otp-generator";
import { mailGenerator } from "./mailer.js";

config();

export async function generateOTP(req, userId) {
  req.app.locals.userId = userId;
  const otp = await otpGenerator.generate(6, {
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });
  req.app.locals.OTP = otp;
  return otp;
}

export const sendEmail = async (otp, email, firstName) => {
  try {
    const mailResponse = mailGenerator(email, otp);
  } catch (err) {
    return err;
  }
};

export const signup = async (req, res) => {
  try {
    const { name, password, email } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(409).json(`${email} already Exists`);
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });
    const userResponse = await newUser.save();

    const userResponseWithoutPassword = await User.findById(
      userResponse._id
    ).select("-password");
    const otp = await generateOTP(req, userResponse?._id);
    mailGenerator(email, otp);

    return res.status(200).json(userResponseWithoutPassword);
  } catch (err) {
    return res.status(500).json(err.message);
  }
};

export const login = async (req, res) => {
  try {
    console.log(req.body);
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json("Please Provide Email and Password");
    }
    const user = await User.findOne({ email });
    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(402).json("Incorrect Email or Password");
    }

    if (!user.isVerified) {
      const otp = await generateOTP(req, user?._id);
      sendEmail(otp, user.email, user.firstName);
      return res
        .status(401)
        .json("Email is sent to the Registered Mail Address. Please Verify It");
    }

    user.password = undefined;
    const { accessToken, refreshToken } = generateTokens(user);
    return res.status(200).json({ accessToken, refreshToken });
  } catch (err) {
    console.log(err);
    return res.status(500).json(err.message);
  }
};

export const checkCurrentSession = (req, res) => {
  try {
    const { refreshToken } = req.body;
    const decoded = verifyJWT(refreshToken, "refresh");
    if (decoded.error) {
      return res.status(401).json(decoded.error);
    }
    const user = decoded.details;
    const accessToken = signToken(user, "access");
    return res.status(200).json({ accessToken: accessToken });
  } catch (err) {
    return res.status(500).json(err.message);
  }
};

export async function verifyOTP(req, res, next) {
  try {
    const { otp } = req.body;
    if (parseInt(req.app.locals.OTP) === parseInt(otp)) {
      next();
    } else {
      return res.status(401).json("Invalid OTP");
    }
  } catch (err) {
    return res.status(500).json(err.message);
  }
}

export const verifyUser = async (req, res) => {
  try {
    const userVerified = await User.findOneAndUpdate(
      { _id: req.app.locals.userId },
      { isVerified: true },
      { new: true }
    );
    req.app.locals.OTP = null;
    req.app.locals.resetSession = true;
    return res.status(200).json(userVerified);
  } catch (err) {
    return res.status(500).json(err.message);
  }
};

export const forgetPass = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(402).json("Incorrect Email or Password");
    }
    const otp = await generateOTP(req, user?._id);
    mailGenerator(email, otp);
    return res
      .status(200)
      .json("Email is sent to the Registered Mail Address. Please Verify It");
  } catch (err) {
    return res.status(500).json(err.message);
  }
};

export const changePassword = async (req, res) => {
  try {
    const { password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const userUpdated = await User.findOneAndUpdate(
      { _id: req.app.locals.userId },
      { password: hashedPassword },
      { new: true }
    );
    return res.status(200).json(userUpdated);
  } catch (err) {
    return res.status(500).json(err.message);
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    return res.status(200).json(users);
  } catch (err) {
    return res.status(500).json(err.message);
  }
};
