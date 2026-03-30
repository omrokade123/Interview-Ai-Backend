const {Router} =require("express");
const authController = require("../controllers/auth.controller.js");
const authRouter = Router();
const authMiddleware = require("../middlewares/auth.middleware.js");

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
authRouter.post("/register",authController.registerUserController);

/**
 * @route POST /api/auth/login
 * @description Login user with email and password
 * @access Public
 */
authRouter.post("/login",authController.loginUserController);

/**
 * @route GET /api/auth/logout
 * @description Clear token from cookie to logout user
 * @access Public
 */
authRouter.get("/logout",authController.logoutUserController);

/**
 * @route GET /api/auth/get-me
 * @description get the current loggedIn user
 * @access Public
 */
authRouter.get("/get-me",authMiddleware.authUser,authController.getMeController);


module.exports = authRouter;