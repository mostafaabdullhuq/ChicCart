const User = require("./../models/user"),
    bcrypt = require("bcryptjs"),
    env = require("dotenv"),
    PasswordReset = require("./../models/password_reset");

const envVars = env.config().parsed;

const nodemailer = require("nodemailer");
const sendgridMailer = require("nodemailer-sendgrid-transport");

const VIEW_PREFIX = "auth/";

const transporter = nodemailer.createTransport(
    sendgridMailer({
        auth: {
            api_key: envVars.SENDGRID_API_KEY,
        },
    })
);

exports.getLogin = (req, res, next) => {
    res.render(`${VIEW_PREFIX}login`, {
        pageTitle: "Login",
        error: req.flash("loginErr"),
    });
};

exports.postLogin = (req, res, next) => {
    const username = req.body.username,
        password = req.body.password;
    if (username && password) {
        let foundUser;
        User.findOne({
            username: { $regex: new RegExp(`^${username}$`, "i") },
        })
            .then((user) => {
                if (user) {
                    foundUser = user;
                    return bcrypt.compare(password, user.password);
                }
                return null;
            })
            .then((isPassMatches) => {
                if (isPassMatches) {
                    req.session.user = foundUser;
                    req.session.save(() => {
                        res.redirect("/");
                    });
                } else {
                    req.flash("loginErr", {
                        error: "Invalid username or password.",
                        data: {
                            username: username,
                            password: password,
                        },
                    });
                    res.redirect("/login");
                }
            })
            .catch((err) => {
                req.session.user = false;
                req.flash("loginErr", {
                    error: "Something went wrong, Please try again later.",
                    data: {
                        username: username,
                        password: password,
                    },
                });

                res.redirect("/login");
                console.log("Cannot login user", err);
            });
    } else {
        req.flash("loginErr", {
            error: "Invalid username or password.",
            data: {
                username: username,
                password: password,
            },
        });
        res.redirect("/login");
    }
};

exports.getSignup = (req, res, next) => {
    res.render(`${VIEW_PREFIX}signup`, {
        pageTitle: "Sign Up",
        errors: req.flash("signupErr"),
    });
};

async function signupValidator(requestBody) {
    const responseObj = {
        isValid: true,
        errors: [],
        data: {
            firstName: requestBody.firstName,
            lastName: requestBody.lastName,
            username: requestBody.username,
            email: requestBody.email,
            password: requestBody.password,
            passwordConfirm: requestBody.passwordConfirm,
        },
    };

    if (!/^[\p{Letter}\p{Mark}\s]{2,20}$/u.test(responseObj.data.firstName)) {
        responseObj.errors.push("Invalid first name format.");
    }

    if (!/^[\p{Letter}\p{Mark}\s]{2,20}$/u.test(responseObj.data.lastName)) {
        responseObj.errors.push("Invalid last name format.");
    }

    if (!/^[a-zA-Z]{1}([a-zA-Z0-9_.]){4,16}$/i.test(responseObj.data.username)) {
        responseObj.errors.push("Invalid username format.");
    } else {
        let usernameExists = await User.findOne({
            username: { $regex: new RegExp(`^${responseObj.data.username}$`, "i") },
        });
        if (usernameExists) {
            responseObj.errors.push("Username already exists.");
        }
    }

    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i.test(responseObj.data.email)) {
        responseObj.errors.push("Invalid email format.");
    } else {
        let isEmailExists = await User.findOne({
            email: { $regex: new RegExp(`^${responseObj.data.email}$`, "i") },
        });

        if (isEmailExists) {
            responseObj.errors.push("Email address already exists.");
        }
    }

    if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[._\-\!\@\&\#\$])[A-Za-z\d._\-\!\@\&\#\$]{8,24}$/.test(responseObj.data.password)) {
        responseObj.errors.push("Invalid password format.");
    }

    if (responseObj.data.password !== responseObj.data.passwordConfirm) {
        responseObj.errors.push("Password confirmation mismatch.");
    }

    if (responseObj.errors.length) {
        responseObj.isValid = false;
    }

    return responseObj;
}

exports.postSignup = (req, res, next) => {
    let validator;
    signupValidator(req.body)
        .then((validationResult) => {
            validator = validationResult;
            if (validationResult.isValid) {
                return bcrypt.hash(validationResult.data.password, 12);
            }
            return null;
        })
        .then((hashedPassword) => {
            if (hashedPassword) {
                let user = new User({
                    firstName: validator.data.firstName,
                    lastName: validator.data.lastName,
                    email: validator.data.email,
                    username: validator.data.username,
                    password: hashedPassword,
                    isAdmin: false,
                });
                return user.save();
            }
            return null;
        })
        .then((user) => {
            if (user) {
                res.redirect("/login");
                return transporter.sendMail({
                    to: user.email,
                    from: envVars.MAIL_FROM_ADDRESS,
                    subject: "Thank you for your signup!",
                    html: "<h1>You have completed your signup process. thanks!</h1>",
                });
            } else {
                req.flash("signupErr", validator);
                res.redirect("/signup");
                return null;
            }
        })
        .then((sendMail) => {
            console.log(sendMail);
        })
        .catch((err) => {
            console.log("Cannot signup", err);
            return res.redirect("/signup");
        });
};

exports.postLogout = (req, res, next) => {
    req.session.destroy((err) => {
        console.log(err);
        return res.redirect("/");
    });
};

exports.getResetPassword = (req, res, next) => {
    res.render(`${VIEW_PREFIX}reset_password`, {
        pageTitle: "Reset your password",
        error: req.flash("forgetErr"),
    });
};

exports.postResetPassword = (req, res, next) => {
    const userEmail = req.body.email;
    if (userEmail) {
        return User.findOne({
            email: new RegExp(`^${userEmail}$`, "i"),
        })
            .then((user) => {
                if (user) {
                    const crypto = require("crypto");
                    return crypto.randomBytes(32, (err, buffer) => {
                        if (err) {
                            console.log("Error generating token for reset password", err);
                            req.flash("forgetErr", "Technical error occurred, Please try again later.");
                        }
                        const token = buffer.toString("hex");
                        let reset = new PasswordReset({
                            userID: user._id,
                            token: token,
                        });
                        return reset
                            .save()
                            .then((result) => {
                                transporter.sendMail({
                                    from: envVars.MAIL_FROM_ADDRESS,
                                    to: userEmail,
                                    subject: "Your password reset link",
                                    html: `
                                    <h1>You have requested a \password \reset link \for your account ${userEmail}</h1>
                                    <p>Click the link below to reset your password</p>
                                    <a href="http://localhost:8000/confirm_reset/${token}">Reset your password</a>
                                    `,
                                });
                                return res.redirect("/");
                            })
                            .catch((err) => {
                                console.log("Cannot save reset password", err);
                                req.flash("forgetErr", "Technical error occurred, Please try again later.");
                                return res.redirect("/reset_password");
                            });
                    });
                }
                req.flash("forgetErr", "Email address not found.");
                return res.redirect("/reset_password");
            })
            .catch((err) => {
                console.log("Error resetting password", err);
            });
    }
    req.flash("forgetErr", "Email address is required.");
    return res.redirect("/reset_password");
};

exports.getConfirmReset = (req, res, next) => {
    const token = req.params.token;
    if (token) {
        return PasswordReset.findOne({
            token: token,
            expire: { $gt: new Date() },
        })
            .then((passwordReset) => {
                if (passwordReset) {
                    return res.render(`${VIEW_PREFIX}confirm_reset`, {
                        pageTitle: "Confirm password reset",
                        error: req.flash("confirmResetErr"),
                        resetToken: token,
                    });
                }
                return res.redirect("/reset_password");
            })
            .catch((err) => {
                console.log("Error finding reset token", err);
                res.redirect("/reset_password");
            });
    }
    return res.redirect("/reset_password");
};

exports.postConfirmReset = (req, res, next) => {
    const token = req.params.token,
        password = req.body.password,
        passwordConfirm = req.body.passwordConfirm;
    let resetToken;
    if (token) {
        if (password && passwordConfirm) {
            if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[._\-\!\@\&\#\$])[A-Za-z\d._\-\!\@\&\#\$]{8,24}$/.test(password) || password !== passwordConfirm) {
                req.flash("confirmResetErr", "Invalid password format.");
                return res.redirect(`confirm_reset/${token}`);
            }
            return PasswordReset.findOne({
                token: token,
            })
                .then((passwordReset) => {
                    if (passwordReset) {
                        resetToken = passwordReset;
                        return User.findById(passwordReset.userID);
                    }
                    return null;
                })
                .then(async (user) => {
                    if (user) {
                        let hashedPassword = await bcrypt.hash(password, 12);
                        if (hashedPassword) {
                            user.password = hashedPassword;
                            return user.save();
                        }
                        return null;
                    }
                    return null;
                })
                .then((newUser) => {
                    if (newUser) {
                        PasswordReset.findByIdAndRemove(resetToken._id);
                        req.session.user = newUser;
                        return req.session.save(() => {
                            res.redirect("/");
                        });
                    }
                    console.log("here");
                    return res.redirect(`/confirm_reset/${token}`);
                })
                .catch((err) => {
                    console.log("Error finding reset token", err);
                    return res.redirect("/reset_password");
                });
        }
        req.flash("confirmResetErr", "Password is required.");
        return res.redirect(`confirm_reset/${token}`);
    }
    return res.redirect("/reset_password");
};
