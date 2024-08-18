const express = require("express");
const {CreateCategory,getAll,getOne,update,deleteCategory} = require("../controllers/category.controller");
const { auth,isAdmin} = require("../middlewares/auth");

const router = express.Router();

router.post("/",CreateCategory );
router.get("/",[], getAll);
router.get("/:id", getOne);
router.put("/:id", update);
router.delete("/:id",[],deleteCategory);

module.exports = router;
