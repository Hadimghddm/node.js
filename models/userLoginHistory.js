"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class UserLoginHistory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Define association here
      UserLoginHistory.belongsTo(models.User, {
        foreignKey: "userId",
        as: "user",
      });
    }
  }

  UserLoginHistory.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      loginTime: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      ipAddress: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      userAgent: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      paranoid: true, // Enables soft deletes
      modelName: "UserLoginHistory",
      timestamps: true, // Automatically adds `createdAt` and `updatedAt` fields
    }
  );

  return UserLoginHistory;
};
