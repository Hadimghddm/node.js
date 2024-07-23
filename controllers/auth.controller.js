const User = require("../models").User;
const UserRole = require("../models").UserRole;
const OtpHistory = require("../models").OtpHistory;
const Role = require("../models").Role;
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../config/app");
const generateOtp = require("../utils/otpGenerator");
const { Sequelize, QueryTypes, Op, where } = require("sequelize");
const otphistory = require("../models/otphistory");
const { SendEmail } = require("../utils/sendEmail");
const { sequelize } = require("../models/index"); // Adjust the path according to your project structure
//Login Controller
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({
      where: {
        email: email,
      },
    });
    if (!user) {
      return res.status(401).send({
        status: "Error",
        message: "Invalid credentials",
      });
    }
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).send({
        status: "Error",
        message: "Invalid credentials",
      });
    }
    const token = jwt.sign({ id: user.id }, config.appKey, {
      expiresIn: "1h",
    });
    return res.status(200).send({
      status: "Success",
      message: "Login successfully!",
      token: token,
    });
  } catch (err) {
    return res.status(500).send({
      status: "Error",
      message: err.message,
    });
  }
};

//Register Controller
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    const user = await User.findOne({
      where: {
        email: email,
      },
    });
    if (user) {
      return res.status(403).send({
        status: "Error",
        message: "Email already exists",
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      email: email,
      password: hashedPassword,
      firstName: firstName,
      lastName: lastName,
    });

    const memberRole = await Role.findOne({
      where: {
        title: "Member",
      },
    });
    await UserRole.create({
      userId: newUser.id,
      roleId: memberRole.id,
    });

    const token = jwt.sign({ id: newUser.id }, config.appKey, {
      expiresIn: "1h",
    });
    return res.status(200).send({
      status: "Success",
      message: "Register successfully!",
      token: token,
    });
  } catch (err) {
    return res.status(500).send({
      status: "Error",
      message: err.message,
    });
  }
};

//Refresh Token Controller
exports.refreshToken = async (req, res) => {
  try {
    const token = jwt.sign({ id: req.user.id }, config.appKey, {
      expiresIn: "1h",
    });
    res.send({
      status: "Success",
      token: token,
    });
  } catch (err) {
    return res.status(500).send({
      status: "Error",
      message: err.message,
    });
  }
};

exports.generateOtp = async (req, res) => {
  const { email } = req.body;

  try {
    console.log(`Finding user with email: ${email}`);
    const user = await User.findOne({ where: { email } });

    if (!user) {
      console.log("User not found");
      return res.status(401).json({
        status: "Error",
        message: "Invalid credentials",
      });
    }

    const oneHourAgo = new Date(new Date() - 60 * 60 * 1000);
    console.log(`Counting OTP requests in the last hour for user ${user.id}`);
    const count = await OtpHistory.count({
      where: {
        createdAt: {
          [Op.gt]: oneHourAgo,
        },
      },
    });

    if (count > 5) {
      console.log("More than 5 OTP requests in the last hour");
      return res.status(400).json({
        status: "Error",
        message: "Error: More than 5 requests in the last hour.",
      });
    }

    const otp = generateOtp();
    const otpExpireTime = new Date(Date.now() + 5 * 60 * 1000);
    const userId = user.id;

    console.log(`Setting OTP for user ${userId}`);
    user.otpCode = otp;
    user.otpExpireTime = otpExpireTime;

    await user.save();
    console.log(`Saved OTP for user ${userId}`);

    await OtpHistory.create({ userId: userId, otp: otp, type: "otp" });
    console.log(`Inserted OTP history for user ${userId}`);

    const emailStatus = await SendEmail(otp, "OTP Code", email);
    console.log(`Email status for user ${userId}: ${emailStatus}`);

    if (emailStatus) {
      return res.status(200).json({ message: "OTP generated successfully" });
    } else {
      throw new Error("Failed to send email");
    }
  } catch (error) {
    console.error("Error generating OTP:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
exports.loginWithOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.otpCode !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.otpExpireTime < new Date()) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    user.otp = null;
    user.otpExpireTime = null;

    const token = jwt.sign({ id: user.id }, config.appKey, {
      expiresIn: "1h",
    });
    return res.status(200).send({
      status: "Success",
      message: "Login successfully!",
      token: token,
    });
  } catch (err) {
    return res.status(500).send({
      status: "Error",
      message: err.message,
    });
  }
};
exports.refreshOtp = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({
        status: "Error",
        message: "Invalid credentials",
      });
    }

    if (user.otpExpireTime && user.otpExpireTime > new Date() - 2 * 60 * 1000) {
      const remainingTime = Math.ceil(
        (user.otpExpireTime - new Date() - 2 * 60 * 1000) / 1000
      );
      return res.status(400).json({
        status: "Error",
        message: `OTP is still valid. Please try again in ${remainingTime} seconds.`,
      });
    }

    const oneHourAgo = new Date(new Date() - 60 * 60 * 1000);
    const count = await OtpHistory.count({
      where: {
        createdAt: {
          [Op.gt]: oneHourAgo,
        },
      },
    });
    if (count > 100) {
      return res.status(400).json({
        status: "Error",
        message: "Error: More than 5 requests in the last hour.",
      });
    }

    const otp = generateOtp();
    const otpExpireTime = new Date(Date.now() + 5 * 60 * 1000);
    user.otpCode = otp;
    user.otpExpireTime = otpExpireTime;
    const id = user.id;
    await user.save();

    const otpCode = await OtpHistory.create({
      userId: id,
      otp: otp,
      type: "otp",
    });
    const emailStatus = await SendEmail(otp, "OTP Code", email);
    console.log(`Email status for user ${userId}: ${emailStatus}`);

    if (emailStatus) {
      return res.status(200).json({ message: "OTP generated successfully" });
    } else {
      throw new Error("Failed to send email");
    }
  } catch (error) {
    console.error("Error generating OTP:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
exports.getOtp = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.otpExpireTime < new Date()) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    const otpCode = user.otpCode; // Corrected retrieval of OTP code from the user object

    return res.status(200).json({
      otpCode,
    });
  } catch (err) {
    return res.status(500).json({
      status: "Error",
      message: err.message,
    });
  }
};
exports.findOneUser = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    } else {
      return res.status(200).json({ message: "Valid user" });
    }
  } catch (err) {
    return res.status(500).json({
      status: "Error",
      message: err.message,
    });
  }
};

exports.findAllUsers = async (req, res) => {
  try {
    // Extract pagination parameters from query string
    const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
    const pageSize = parseInt(req.query.pageSize) || 5; // Default to 10 records per page if not provided

    const offset = (page - 1) * pageSize;
    const limit = pageSize;

    // Fetch paginated users
    const { count, rows: userList } = await User.findAndCountAll({
      offset,
      limit
    });

    res.status(200).send({
      status: "Success",
      message: "Found all users successfully!",
      data: userList,
      meta: {
        totalItems: count,
        totalPages: Math.ceil(count / pageSize),
        currentPage: page
      }
    });
  } catch (err) {
    return res.status(500).send({
      status: "Error",
      message: err.message,
    });
  }
};

exports.checkToken = async (req, res) => {
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (req.user.id) {
      const id = req.user.id;

      const user = await User.findOne({
        where: { id },
      });

      return res.status(200).send({ user });
    } else {
      return res.status(400).send({
        status: "Error",
        message: "Id Missing",
      });
    }
  } catch (err) {
    return res.status(500).send({
      status: "Error",
      message: err.message,
    });
  }
};


exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!userId || isNaN(userId)) {
      return res.status(400).send({
        status: "Error",
        message: "Invalid or missing user ID",
      });
    }

    // Log the received userId for debugging purposes
    console.log("Received user ID for deletion:", userId);

    // Find the user by ID
    const user = await User.findOne({
      attributes: ["firstName", "lastName"],
      where: {
        id: userId,
      },
    });

    // Check if the user exists
    if (!user) {
      return res.status(404).send({
        status: "Error",
        message: "User not found",
      });
    }

    // Log the user details for debugging purposes
    console.log("User details:", user);

    // Delete the user by ID
    const data = await User.destroy({
      where: {
        id: userId,
      },
    });

    return res.status(200).send({
      status: "Success",
      message: "User deleted successfully",
      data: data,
    });
  } catch (err) {
    console.error("Error in deleteUser:", err);
    return res.status(500).send({
      status: "Error",
      message: err.message,
    });
  }
};
exports.updateUser = async (req, res) => {
  try {
    const data = await User.update(req.body, {
      where: {
        id: req.params.id,
      },
    });
    res.status(200).send({
      status: "Success",
      message:"User updated",
      data: data,
    });
  } catch (err) {
    return res.status(500).send({
      status: "Error",
      message: err.message,
    });
  }
};


exports.filtterUsers = async (req, res) => {
  try {


  const filterData = req.body.Date;
  if(filterData){
    const userList = await User.findAll({
      where: {
        [Op.or]: [{ firstName: filterData }, { lastName: filterData },{email: filterData}],
      },
    });
    console.log("::::::::::::::::::::::::::::::::::::",userList)
   if(userList.length>0){
    res.status(200).send({
      status: "Success",
      message: "Found filter users successfully!",
      data: userList,
     
    });
   }else{
    res.status(400).send({
      status:"Error",
      message:"not finde user !",
    })
   }
  }else{
    res.status(404).send({
      status:"Error!",
      message: "incorrect data!"
    })
  }

 
  } catch (err) {
    return res.status(500).send({
      status: "Error",
      message: err.message,
    });
  }
};