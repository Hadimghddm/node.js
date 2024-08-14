const express = require("express");
const {createFile,getAll,get,update,deleteFile} = require("../controllers/file.controller");
const { auth} = require("../middlewares/auth");

const router = express.Router();

router.post("/",[auth],createFile );
router.get("/all",[], getAll);
router.get("/:id", get);
router.put("/:id", update);
router.delete("/:id",deleteFile);

module.exports = router;
