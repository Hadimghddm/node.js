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
        const filterData = req.body.data;
        
    const page = parseInt(req.query.page) || 1; 
      const pageSize = parseInt(req.query.pageSize) || 5; 
  
      const offset = (page - 1) * pageSize;
      const limit = pageSize;
  
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
  
  
  exports.deleteUser = async (req, res) => {
    try {
      const userId = req.params.id;
      if (!userId || isNaN(userId)) {
        return res.status(400).send({
          status: "Error",
          message: "Invalid or missing user ID",
        });
      }
  
      console.log("Received user ID for deletion:", userId);
  
      const user = await User.findOne({
        attributes: ["firstName", "lastName"],
        where: {
          id: userId,
        },
      });
  
      if (!user) {
        return res.status(404).send({
          status: "Error",
          message: "User not found",
        });
      }
  
      console.log("User details:", user);
  
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
  
  exports.getUsers = async (req, res) => {
    try {
      const filterData = req.body.data;
      const filterDate = req.body.date; // Assuming the date filter is provided in the request body
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 5;
      const offset = (page - 1) * pageSize;
      const limit = pageSize;
  
      let queryOptions = {
        offset,
        limit,
      };
  
      let whereConditions = [];
  
      // Add filtering conditions
      if (filterData) {
        whereConditions.push({
          [Op.or]:[
            { firstName: { [Op.contains]: filterData } },
            { lastName: { [Op.contains]: filterData } },
            { email: { [Op.contains]: filterData } },
          ],
        });
      }
  
      if (filterDate) {
        if (filterDate.startDate && filterDate.endDate) {
          whereConditions.push({
            createdAt: {
              [Op.between]: [new Date(filterDate.startDate), new Date(filterDate.endDate)],
            },
          });
        } else if (filterDate.startDate) {
          whereConditions.push({
            createdAt: {
              [Op.gte]: new Date(filterDate.startDate),
            },
          });
        } else if (filterDate.endDate) {
          whereConditions.push({
            createdAt: {
              [Op.lte]: new Date(filterDate.endDate),
            },
          });
        }
      }
  
      if (whereConditions.length > 0) {
        queryOptions.where = {
          [Op.and]: whereConditions,
        };
      }
  
      const { count, rows: userList } = await User.findAndCountAll(queryOptions);
  
      res.status(200).send({
        status: "Success",
        message: filterData || filterDate ? "Found filtered users successfully!" : "Found all users successfully!",
        data: userList,
        meta: {
          totalItems: count,
          totalPages: Math.ceil(count / pageSize),
          currentPage: page,
        },
      });
    } catch (err) {
      return res.status(500).send({
        status: "Error",
        message: err.message,
      });
    }
  };

  exports.createUser = async (req, res) => {
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