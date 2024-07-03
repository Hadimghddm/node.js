'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
      'Users', // table name
      'otpExpireTime', // column name
      {
        type: Sequelize.DATE, // column data type
        allowNull: true // allow null values
      }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Users', 'otpExpireTime');
  }
};
