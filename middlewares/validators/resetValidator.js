const { body, param, validationResult } = require("express-validator"),
    User = require("./../../models/user");

const VIEW_PREFIX = "auth/";

module.exports = [
    param("token").notEmpty().withMessage("Reset token is required."),
    body("password")
        .notEmpty()
        .withMessage("Password is required.")
        .bail()
        .isStrongPassword()
        .withMessage("Invalid password format.")
        .bail()
        .custom((password, { req }) => {
            if (password !== req.body.passwordConfirm) {
                throw new Error("Password confirmation doesn't match.");
            }
            return true;
        }),

    // get validation result
    (req, res, next) => {
        const validationErr = validationResult(req);
        // if there's error in validation, don't pass the middleware and render the signup page with errors
        if (!validationErr.isEmpty()) {
            let token = req.params.token;
            if (token) {
                return res.redirect(`/confirm_reset/${token}`);
            }
            return res.redirect("/reset_password");
        }

        // if there's no errors in validation, go to the next middleware
        next();
    },
];
