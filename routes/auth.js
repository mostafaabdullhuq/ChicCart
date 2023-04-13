const { Router } = require("express"),
    router = Router(),
    // controller middlewares
    {
        getLogin,
        postLogin,
        getSignup,
        postSignup,
        getResetPassword,
        getConfirmReset,
        postResetPassword,
        postConfirmReset,
        postLogout,
        getResetPasswordResend,
    } = require("../controllers/authController"),
    isNotAuthed = require("./../middlewares/notAuthed"),
    // middlewares to check user auth status
    isAuthed = require("./../middlewares/authed"),
    // middlewares for validation
    { signupValidator, confirmResetValidator, loginValidator, resetValidator, resetPasswordResendValidator } = require("./../middlewares/validators/authValidator");

// ROUTES
router.get("/login", isNotAuthed, getLogin);
router.post("/login", isNotAuthed, loginValidator, postLogin);
router.get("/signup", isNotAuthed, getSignup);
router.post("/signup", isNotAuthed, signupValidator, postSignup);
router.get("/reset_password", isNotAuthed, getResetPassword);
router.post("/reset_password", isNotAuthed, resetValidator, postResetPassword);
router.post("/password_reset_resend", isNotAuthed, resetPasswordResendValidator, getResetPasswordResend);
router.get("/confirm_reset/:token", isNotAuthed, getConfirmReset);
router.post("/confirm_reset/:token", isNotAuthed, confirmResetValidator, postConfirmReset);
router.get("/logout", isAuthed, postLogout);

module.exports = router;
