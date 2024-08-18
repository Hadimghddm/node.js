const router = require("express").Router();

const {
    getUsers ,
  findAllUsers,
  findOneUser,
  deleteUser,
  updateUser,
  createUser,
  assignmentRole,
  updateAssignmentRole,
  getUserLoginHistory
} = require("../controllers/user.controller");
const { auth, isAdmin } = require("../middlewares/auth");
const { validate } = require('../validators');


router.get("/findOneUser", findOneUser);
router.get("/findAllUsers", findAllUsers);
router.delete("/delete/:id", deleteUser);
router.put("/update/:id", updateUser);
router.get("/filter", getUsers );
router.post("/createUser", createUser );
router.post("/assignment",assignmentRole );
router.put("/updateRole",updateAssignmentRole );
router.get("/logHistory/:id",getUserLoginHistory );




module.exports = router;
