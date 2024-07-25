const router = require("express").Router();

const {
    getUsers ,
  findAllUsers,
  findOneUser,
  deleteUser,
  updateUser,
  createUser,
} = require("../controllers/user.controller");

router.get("/findOneUser", findOneUser);
router.get("/findAllUsers", findAllUsers);
router.delete("/delete/:id", deleteUser);
router.put("/update/:id", updateUser);
router.get("/filter", getUsers );
router.get("/createUser", createUser );


module.exports = router;
