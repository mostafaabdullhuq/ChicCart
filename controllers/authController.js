const User = require("./../models/user"),
    bcrypt = require("bcryptjs"),
    env = require("dotenv"),
    PasswordReset = require("./../models/password_reset"),
    nodemailer = require("nodemailer"),
    sendgridMailer = require("nodemailer-sendgrid-transport"),
    crypto = require("crypto");

const envVars = env.config().parsed,
    VIEW_PREFIX = "auth/",
    transporter = nodemailer.createTransport(
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
            const error = new Error(`Cannot login user: ${err}`);
            return next(error);
        });
};

exports.getSignup = (req, res, next) => {
    res.render(`${VIEW_PREFIX}signup`, {
        pageTitle: "Sign Up",
        errors: req.flash("signupErr"),
    });
};

exports.postSignup = (req, res, next) => {
    const firstName = req.body.firstName,
        lastName = req.body.lastName,
        email = req.body.email,
        username = req.body.username,
        password = req.body.password;
    return bcrypt
        .hash(password, 12)
        .then((hashedPassword) => {
            if (hashedPassword) {
                let user = new User({
                    firstName: firstName,
                    lastName: lastName,
                    email: email,
                    username: username,
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
                req.flash("signupErr", "Technical error, Please try again later.");
                res.redirect("/signup");
                return null;
            }
        })
        .then((sendMail) => {
            console.log(sendMail);
        })
        .catch((err) => {
            const error = new Error(`Error signup: ${err}`);
            return next(error);
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
exports.getResetPasswordResend = (req, res, next) => {
    let token = req.body.token;
    return PasswordReset.findOne({
        token: token,
    })
        .populate("userID")
        .then((reset) => {
            if (reset) {
                let userEmail = reset.userID.email;
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
                return res.render(`${VIEW_PREFIX}reset_password_sent`, {
                    pageTitle: "Reset your password",
                    error: req.flash("forgetErr"),
                    emailAddress: userEmail,
                    resetToken: token,
                });
            }
            req.flash("forgetErr", "Reset token expired.");

            return res.redirect("/reset_password");
        })
        .catch((err) => {
            const error = new Error(`Error resending reset: ${err}`);
            return next(error);
        });
};

exports.postResetPassword = (req, res, next) => {
    const userEmail = req.body.email;
    return User.findOne({
        email: new RegExp(`^${userEmail}$`, "i"),
    })
        .then((user) => {
            if (user) {
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
                            return res.render(`${VIEW_PREFIX}reset_password_sent`, {
                                pageTitle: "Reset your password",
                                error: req.flash("forgetErr"),
                                emailAddress: userEmail,
                                resetToken: token,
                            });
                        })
                        .catch((err) => {
                            const error = new Error(`Cannot save reset password: ${err}`);
                            return next(error);
                        });
                });
            }
            req.flash("forgetErr", "Email address not found.");
            return res.redirect("/reset_password");
        })
        .catch((err) => {
            const error = new Error(`Error resetting password: ${err}`);
            return next(error);
        });
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
                const error = new Error(`Error finding reset token: ${err}`);
                return next(error);
            });
    }
    return res.redirect("/reset_password");
};

exports.postConfirmReset = (req, res, next) => {
    const token = req.params.token,
        password = req.body.password;

    return PasswordReset.findOne({
        token: token,
    })
        .then((passwordReset) => {
            if (passwordReset) {
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
                PasswordReset.deleteMany({ userID: newUser._id })
                    .then((res) => {
                        return;
                    })
                    .catch((err) => {
                        console.log("Cannot delete user reset tokens", err);
                    });
                req.session.user = newUser;
                return req.session.save(() => {
                    res.redirect("/");
                });
            }
            return res.redirect(`/confirm_reset/${token}`);
        })
        .catch((err) => {
            const error = new Error(`Error finding reset token: ${err}`);
            return next(error);
        });
};
