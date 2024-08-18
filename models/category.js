'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Category extends Model {
    static associate(models) {
      this.belongsTo(models.Category, { foreignKey: 'parent_id', as: 'parent' });
      this.hasMany(models.Category, { foreignKey: 'parent_id', as: 'subcategories' });
    }
  }

  Category.init(
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      parent_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Categories', // Self-referencing for parent-child hierarchy
          key: 'id',
        },
        allowNull: true, 
      },
    },
    {
      sequelize,
      paranoid: true, // Enables soft deletes
      modelName: 'Category',
      hooks: {
        beforeCreate: async (category) => {
          console.log('Category is being created:', category.title);
        },
        beforeUpdate: async (category) => {
          console.log('Category is being updated:', category.title);
        },
      },
    }
  );

  return Category;
};
