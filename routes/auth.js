const { Router } = require("express"),
    router = Router(),
    authController = require("../controllers/authController"),
    notAuthed = require("./../middlewares/notAuthed"),
    authed = require("./../middlewares/auth"),
    { body, validationResult } = require("express-validator"),
    signupValidator = require("./../middlewares/validators/signupValidator"),
    resetValidator = require("./../middlewares/validators/resetValidator");

router.get("/login", notAuthed, authController.getLogin);
router.post("/login", notAuthed, authController.postLogin);
router.get("/signup", notAuthed, authController.getSignup);
router.post("/signup", notAuthed, signupValidator, authController.postSignup);
router.get("/reset_password", notAuthed, authController.getResetPassword);
router.post("/reset_password", notAuthed, authController.postResetPassword);
router.get("/confirm_reset/:token", notAuthed, authController.getConfirmReset);
router.post("/confirm_reset/:token", notAuthed, resetValidator, authController.postConfirmReset);
router.get("/logout", authed, authController.postLogout);

module.exports = router;
