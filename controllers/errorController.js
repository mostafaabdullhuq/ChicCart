exports.get404 = (req, res, next) => {
    res.statusCode = 404;
    res.render("404", {
        pageTitle: "Page Not Found",
        path: null,
    });
};

exports.get500 = (error, req, res, next) => {
    res.statusCode = 500;
    res.render("500", {
        pageTitle: "Unexpected error",
        path: null,
    });
};
