"user strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class File extends Model {
    static associate(models) {
      this.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    }
  }

  File.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      path: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        references: {
          model: "Users",
          key: "id",
        },
        allowNull: true, // Adjust based on your requirements
      },
    },
    {
      sequelize,
      paranoid: true,
      modelName: "File",
      hooks: {
        beforeCreate: async (file) => {
          console.log("File is being created:", file.name);
        },
        beforeUpdate: async (file) => {
          console.log("File is being updated:", file.name);
        },
      },
    }
  );

  return File;
};
