module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
      'Files',
      'userId',
      {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users', // Ensure this matches the name of your User model
          key: 'id',
        },
        allowNull: true, // or false if you want to make it mandatory
      }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Files', 'userId');
  }
};
