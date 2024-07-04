'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class OtpHistory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.User, { foreignKey: 'userId' });


    }
  }
  OtpHistory.init({
    userId: DataTypes.INTEGER,
    otp: DataTypes.STRING,
    createdAt: DataTypes.DATE,
    type: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'OtpHistory',
  });
  return OtpHistory;
};