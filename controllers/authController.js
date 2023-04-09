const User = require("./../models/user"),
    bcrypt = require("bcryptjs");
exports.getLogin = (req, res, next) => {
    if (req.session.user) {
        res.redirect("/");
    } else {
        res.render("login", {
            pageTitle: "Login",
            error: req.flash("loginErr"),
        });
    }
};

exports.postLogin = (req, res, next) => {
    const username = req.body.username,
        password = req.body.password;
    if (username && password) {
        let foundUser;
        User.findOne({
            username: { $regex: new RegExp(username, "i") },
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
    let signupErr = req.flash("signupErr");
    if (req.session.user) {
        res.redirect("/");
    } else {
        res.render("signup", {
            pageTitle: "Sign Up",
            errors: signupErr,
        });
    }
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
            username: { $regex: new RegExp(responseObj.data.username, "i") },
        });

        if (usernameExists) {
            responseObj.errors.push("Username already exists.");
        }
    }

    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i.test(responseObj.data.email)) {
        responseObj.errors.push("Invalid email format.");
    } else {
        let isEmailExists = await User.findOne({
            email: { $regex: new RegExp(responseObj.data.email, "i") },
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
            } else {
                req.flash("signupErr", validator);
                res.redirect("/signup");
            }
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
