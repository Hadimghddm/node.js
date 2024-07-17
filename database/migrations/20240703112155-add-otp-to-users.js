'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
      'Users', // table name
      'otpCode', // column name
      {
        type: Sequelize.STRING, // column data type
        allowNull: true // allow null values
      }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Users', 'otpCode');
  }
};
