const User = require("../models").User;
const UserRole = require("../models").UserRole;
const Role = require("../models").Role;
const UserLoginHistory = require("../models").UserLoginHistory;
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../config/app");
const { Sequelize, QueryTypes, Op, where } = require("sequelize");

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
      limit,
      include: [
        {
          model: UserRole,
          include: [
            {
              model: Role,
              attributes: ["id", "title"],
            },
          ],
          attributes: ["roleId"],
        },
      ],
    });

    const usersWithRoles = userList.map((user) => {
      const role =
        user.UserRoles.length > 0 && user.UserRoles[0].Role
          ? user.UserRoles[0].Role.title
          : null;
      const { UserRoles, ...userWithoutUserRoles } = user.toJSON();
      return {
        ...userWithoutUserRoles,
        role: role,
      };
    });

    res.status(200).send({
      status: "Success",
      message: "Found all users successfully!",
      data: usersWithRoles,
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
      message: "User updated",
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
    const filterDate = req.body.date;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
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
        [Op.or]: [
          { firstName: { [Op.substring]: filterData } },
          { lastName: { [Op.substring]: filterData } },
          { email: { [Op.substring]: filterData } },
        ],
      });
    }

    if (filterDate) {
      if (filterDate.startDate && filterDate.endDate) {
        whereConditions.push({
          createdAt: {
            [Op.between]: [
              new Date(filterDate.startDate),
              new Date(filterDate.endDate),
            ],
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
      message:
        filterData || filterDate
          ? "Found filtered users successfully!"
          : "Found all users successfully!",
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

    // Check if user already exists
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

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new user
    const newUser = await User.create({
      email: email,
      password: hashedPassword,
      firstName: firstName,
      lastName: lastName,
    });

    // Assign the "Member" role to the new user
    const memberRole = await Role.findOne({
      where: {
        title: "Member",
      },
    });
    await UserRole.create({
      userId: newUser.id,
      roleId: memberRole.id,
    });

    // Generate a token
    const token = jwt.sign({ id: newUser.id }, config.appKey, {
      expiresIn: "1h",
    });

    // Send the response
    return res.status(200).send({
      status: "Success",
      message: "Register successfully!",
      token: token,
    });
  } catch (err) {
    // Handle errors
    return res.status(500).send({
      status: "Error",
      message: err.message,
    });
  }
};
exports.assignmentRole = async (req, res) => {
  try {
  } catch (err) {
    // Handle errors
    return res.status(500).send({
      status: "Error",
      message: err.message,
    });
  }
};

exports.assignmentRole = async (req, res) => {
  try {
    const { title, userName } = req.body;

    if (title && userName) {
      const role = await Role.findOne({
        where: { title: title },
        attributes: ["id"],
      });
      console.log(role, "role:::::::::::::::::::::");
      const user = await User.findOne({
        where: { firstName: userName },
        attributes: ["id"],
      });
      console.log(user, "user:::::::::::::::::::::");

      if (role && user) {
        const assignmentRole = await UserRole.create({
          userId: user.id,
          roleId: role.id,
        });

        res.status(200).send({
          status: "Success",
          message: "Role assigned successfully!",
          data: assignmentRole,
        });
      } else {
        res.status(404).send({
          status: "Error",
          message: "Role not found",
        });
      }
    } else {
      res.status(400).send({
        status: "Error",
        message: "Title and userId are required",
      });
    }
  } catch (err) {
    res.status(500).send({
      status: "Error",
      message: err.message,
    });
  }
};

exports.updateAssignmentRole = async (req, res) => {
  try {
    const id = req.body.userId;
    const { title } = req.body;
    const roleId = await UserRole.findOne({
      where: { userId: id },
      attributes: ["roleId"],
    });
const X = roleId.dataValues.roleId
    if (X === 1) {
      res.status(403).send({
        status: "Error",
        message: "can not Update user role is Admin ",
      });
    }
    if (title && id) {
      const role = await Role.findOne({
        where: { title: title },
        attributes: ["id"],
      });

      if (role) {
        const assignmentRole = await UserRole.update(
          { roleId: role.id },
          { where: { userId: id } } // شرط به‌روزرسانی اضافه شده است
        );

        res.status(200).send({
          status: "Success",
          message: "Role updated successfully!",
          data: assignmentRole,
        });
      } else {
        res.status(404).send({
          status: "Error",
          message: "Role not found",
        });
      }
    } else {
      res.status(400).send({
        status: "Error",
        message: "Title and userId are required",
      });
    }
  } catch (err) {
    res.status(500).send({
      status: "Error",
      message: err.message,
    });
  }
};

exports.getUserLoginHistory = async (req, res) => {
  const userId = req.params.id;

  try {
    const count = await UserLoginHistory.count();
    const loginHistories = await UserLoginHistory.findAll({
      where: { userId },
      limit: 5,
      // order: [['createdAt', 'ASC']],
      order: [["loginTime", "DESC"]],
      attributes: ["loginTime"],
    });

    return res.json({ status: "Success", data: loginHistories, count: count });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
