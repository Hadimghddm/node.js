"use strict";

const { where } = require("sequelize");
const { Category } = require("../models");

exports.CreateCategory = async (req, res) => {
  try {
    const title = req.body.title;
    const parentTitle = req.body.parentTitle;

    if (!title) {
      return res.status(400).send({
        status: "error",
        message: "Category title is required.",
      });
    }

    const checkCategory = await Category.findOne({
      where: { title: title },
    });

    if (checkCategory) {
      return res.status(401).send({
        status: "error",
        message: "Category with this title already exists.",
      });
    }

    let parent = null;
    if (parentTitle) {
      parent = await Category.findOne({
        where: { title: parentTitle },
      });

      if (!parent) {
        return res.status(400).send({
          status: "error",
          message: "Parent category does not exist.",
        });
      }
    }

    const generatCategory = await Category.create({
      title: title,
      parent_id: parent ? parent.id : null,
    });

    return res.status(200).send({
      status: "success",
      message: "Category created successfully!",
      title: generatCategory.title,
    });
  } catch (err) {
    return res.status(500).send({
      status: "error",
      message: err.message,
    });
  }
};

exports.getAll = async (req, res) => {
  try {
    const data = await Category.findAll();
    res.status(200).send({
      status: "Success",
      messages: "Data retrieved",
      data: data,
    });
  } catch (err) {
    return res.status(500).send({
      status: "error",
      message: err.message,
    });
  }
};
exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);
    console.log("Category retrieved:", category);

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.status(200).json({
      status: "Success",
      message: "Category retrieved successfully",
      data: category,
    });
  } catch (err) {
    return res.status(500).send({
      status: "error",
      message: err.message,
    });
  }
};
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const parentTitle = req.body.parent;

    const category = await Category.findOne({
      where: { id: id },
    });

    if (!category) {
      return res.status(404).send({
        status: "error",
        message: "Category not found",
      });
    }

    if (parentTitle) {
      const parent = await Category.findOne({
        where: { title: parentTitle },
        attributes: ["id"],
      });

      if (!parent) {
        return res.status(404).json({ error: "Parent category not found" });
      }

      req.body.parent_id = parent.id;
    }

    await Category.update(req.body, {
      where: { id: id },
    });

    const updatedCategory = await Category.findOne({
      where: { id: id },
    });

    res.status(200).send({
      status: "Success",
      message: "Category updated successfully",
      data: updatedCategory,
    });
  } catch (err) {
    return res.status(500).send({
      status: "error",
      message: err.message,
    });
  }
};

exports.deleteCategory = async (req, res) => {
 try {
    const { id } = req.params;
    const CheckNotParent = await Category.findAll({
      where: {
        parent_id: id,
      },
    });
    if(CheckNotParent){
      return res.status(403).send({
          status:"error",
          message:"can`t delete parent category !"
      })
    }
    const data = await Category.destroy({
      where: {
        id: req.params.id,
      },
    });
   return res.status(200).send({
      status: "Success",
      message:"category deleted",
      data: data,
    });
 }catch (err) {
    return res.status(500).send({
      status: "errorrrr",
      message: err.message,
    });
  }
};
