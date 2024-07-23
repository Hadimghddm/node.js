const router = require("express").Router();
const {
  login,
  refreshToken,
  register,
  getOtp,
  generateOtp,
  loginWithOtp,
  refreshOtp,
  findOneUser,
  findAllUsers,
  checkToken,
  deleteUser,
  updateUser,
  filtterUsers
} = require("../controllers/auth.controller");
const { auth, isAdmin } = require("../middlewares/auth");

const { validate } = require('../validators');
const { rules: loginRules } = require('../validators/auth/login')
const { rules: registerRules } = require('../validators/auth/register')


/**
 * @swagger
 * /api/v1.0/auth/login:
 *  post:
 *   tags: [Auth]
 *   description: Login user
 *   produces: [application/json]
 *   parameters: [{name: "body", in: "body", example: {email: "test@gmail.com", password: "123456"}}]
 *   responses: { 200: {status:"Success",message: "Login successfully!"}, 400: {status:"Error",message: "Email and password are required!"} , 500: {status:"Error",message: "Internal server error"}}
 * /api/v1.0/auth/register:
 *  post:
 *   tags: [Auth]
 *   description: Register user
 *   produces: [application/json]
 *   parameters: [{name: "body", in: "body", example: {firstName:"John","lastName":"Doe",email: "test@gmail.com", password: "123456",gender:",male",dateOfBirth:"1009-09-09",nationalCode:"4276656542",phone:"09129876543"}}]
 *   responses: { 200: {status:"Success",message: "Register successfully!"}, 400: {status:"Error",message: "Email and password are required!"} , 500: {status:"Error",message: "Internal server error"}}
 * /api/v1.0/auth/refreshToken:
 *  get:
 *   tags: [Auth]
 *   description: Get Refresh Token
 *   produces: [application/json]
 *   responses: { 200: {status:"Success",token:"82eqkjshdajkshdjaksd6asdausjkdhasdm,ansdmasjhdgaiusgjhkasdjashjfdgjhasd"}, 400: {status:"Error",message: "Refresh token is required!"} , 500: {status:"Error",message: "Internal server error"}}     
 * /api/v1.0/auth/get-otp:
 *  post:
 *   tags: [otp]
 *   description: get otp code
 *   produces: [application/json]
 *   parameters: [{name: "body", in: "body", example: {email: "test@gmail.com"}}]
 *   responses: { 200: {status:"Success",message: "opt generated successfully!"}, 400: {status:"Error",message: "Email are required!"} , 500: {status:"Error",message: "Internal server error"}}
 * /api/v1.0/auth/login-otp:
 *  post:
 *   tags: [otp]
 *   description: login with otp code
 *   produces: [application/json]
 *   parameters: [{name: "body", in: "body", example: {email: "test@gmail.com",otp:"123456"}}]
 *   responses: { 200: {status:"Success",message: "login with opt generated successfully!"}, 400: {status:"Error",message: "Email our otp are required!"} , 500: {status:"Error",message: "Internal server error"}}
 * /api/v1.0/auth/refresh-otp:
 *  post:
 *   tags: [otp]
 *   description: refresh otp code
 *   produces: [application/json]
 *   parameters: [{name: "body", in: "body", example: {email: "test@gmail.com"}}]
 *   responses: { 200: {status:"Success",message: "opt refresh successfully!"}, 400: {status:"Error",message: "Email are required!"} , 500: {status:"Error",message: "Internal server error"}}
 *
 */

router.post("/login",[loginRules() , validate], login);
router.post('/generate-otp', generateOtp);
router.get('/get-otp', getOtp);
router.post('/login-otp', loginWithOtp);
router.post('/refresh-otp', refreshOtp);
router.post("/register", [registerRules() , validate], register);
router.get("/refreshToken", [auth], refreshToken);
router.post("/findOneUser",  findOneUser);
router.get("/findAllUsers",  findAllUsers);
router.get('/checkToken',[auth],checkToken);
router.delete('/delete/:id',deleteUser);
router.put('/update/:id',updateUser);
router.get('/filter',filtterUsers)




module.exports = router;
