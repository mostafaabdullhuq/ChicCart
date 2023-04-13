const { body, param, validationResult } = require("express-validator"),
    User = require("./../../models/user");
const VIEW_PREFIX = "auth/";

exports.confirmResetValidator = [
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

exports.signupValidator = [
    // Validate email address
    body("email")
        .notEmpty()
        .withMessage("Email address is required.")
        .bail() // STOP EXECUTING THE NEXT VALIDATIONS IF THE CURRENT IS FAILED
        .isEmail()
        .withMessage("Invalid email address format.")
        .bail()
        .custom((email) => {
            return User.findOne({
                email: { $regex: new RegExp(`^${email}$`, "i") },
            }).then((user) => {
                if (user) {
                    return Promise.reject("Email address already exists.");
                }
            });
        })
        .normalizeEmail(),

    // Validate first name
    body("firstName")
        .notEmpty()
        .withMessage("First name is required.")
        .bail()
        .isLength({
            min: 3,
            max: 20,
        })
        .withMessage("Invalid first name format.")
        .bail()
        .isAlpha("en-US", { ignore: " " })
        .withMessage("Invalid first name format."),

    // Validate last name
    body("lastName")
        .notEmpty()
        .withMessage("Last name is required.")
        .bail()
        .isLength({
            min: 3,
            max: 20,
        })
        .withMessage("Invalid last name format.")
        .bail()
        .isAlpha("en-US", { ignore: " " })
        .withMessage("Invalid last name format."),

    // Validate username
    body("username")
        .notEmpty()
        .withMessage("Username is required.")
        .bail()
        .matches(/^[a-zA-Z]{1}([a-zA-Z0-9_.]){3,16}$/i)
        .withMessage("Invalid username format.")
        .bail()
        .custom((username) => {
            return User.findOne({
                username: { $regex: new RegExp(`^${username}$`, "i") },
            }).then((user) => {
                if (user) {
                    return Promise.reject("Username already exists.");
                }
            });
        }),
    body("password")
        .notEmpty()
        .withMessage("Password is required.")
        .bail()
        .isStrongPassword()
        .withMessage("Password doesn't meet the requirements.")
        .custom((password, { req }) => {
            if (password !== req.body.passwordConfirm) {
                throw new Error("Password confirmation does not match password.");
            }
            return true;
        }),

    // get validation result
    (req, res, next) => {
        const validationErr = validationResult(req);
        // if there's error in validation, don't pass the middleware and render the signup page with errors
        if (!validationErr.isEmpty()) {
            const firstName = req.body.firstName,
                lastName = req.body.lastName,
                email = req.body.email,
                username = req.body.username,
                password = req.body.password;
            passwordConfirm = req.body.passwordConfirm;
            return res.status(422).render(`${VIEW_PREFIX}signup`, {
                pageTitle: "Sign Up",
                errors: validationErr.array(),
                data: {
                    firstName: firstName,
                    lastName: lastName,
                    email: email,
                    username: username,
                    password: password,
                    passwordConfirm: passwordConfirm,
                },
            });
        }

        // if there's no errors in validation, go to the next middleware
        next();
    },
];

exports.loginValidator = [
    // Validate username
    body("username").notEmpty().withMessage("Invalid username or password."),
    body("password").notEmpty().withMessage("Invalid username or password."),
    // get validation result
    (req, res, next) => {
        const validationErr = validationResult(req);
        // if there's error in validation, don't pass the middleware and render the signup page with errors
        if (!validationErr.isEmpty()) {
            req.flash("loginErr", {
                error: "Invalid username or password.",
                data: {
                    username: req.body.username,
                    password: req.body.password,
                },
            });
            return res.redirect("/login");
        }

        // if there's no errors in validation, go to the next middleware
        next();
    },
];

exports.resetValidator = [
    // Validate username
    body("email")
        .notEmpty()
        .withMessage("Email address is required.")
        .bail() // STOP EXECUTING THE NEXT VALIDATIONS IF THE CURRENT IS FAILED
        .isEmail()
        .withMessage("Invalid email address format.")
        .bail()
        .normalizeEmail(),
    // get validation result
    (req, res, next) => {
        const validationErr = validationResult(req);
        // if there's error in validation, don't pass the middleware and render the signup page with errors
        if (!validationErr.isEmpty()) {
            req.flash("forgetErr", validationErr.array()[0].msg);
            return res.redirect("/reset_password");
        }

        // if there's no errors in validation, go to the next middleware
        next();
    },
];

exports.resetPasswordResendValidator = [
    // Validate username
    body("token").notEmpty().withMessage("Reset token is required."),
    // get validation result
    (req, res, next) => {
        const validationErr = validationResult(req);
        // if there's error in validation, don't pass the middleware and render the signup page with errors
        if (!validationErr.isEmpty()) {
            req.flash("forgetErr", validationErr.array()[0].msg);
            return res.redirect("/reset_password");
        }

        // if there's no errors in validation, go to the next middleware
        next();
    },
];
