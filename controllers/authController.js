exports.getLogin = (req, res, next) => {
    return res.render("login", {
        pageTitle: "Login",
    });
};

exports.getSignup = (req, res, next) => {
    return res.render("signup", {
        pageTitle: "Sign Up",
    });
};
