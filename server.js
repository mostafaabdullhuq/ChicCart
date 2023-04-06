const express = require("express"),
    bodyParser = require("body-parser"),
    adminRoutes = require("./routes/admin"),
    shopRoutes = require("./routes/shop"),
    authRoutes = require("./routes/auth"),
    path = require("path"),
    errorController = require("./controllers/errorController"),
    // { mongoConnection, mongoDB } = require("./database/database"),
    Product = require("./models/product"),
    User = require("./models/user"),
    PromoCode = require("./models/promocode");

const app = express();

//! SETUP VIEWS !//
app.set("view engine", "ejs");
app.set("views", "views");

//! SETUP PARSER !//
app.use(bodyParser.urlencoded({ extended: false })); // PARSE INCOMING REQUESTS BODIES

//! SETUP PUBLIC FOLDERS TO ACCESS WITHOUT ACCESS RESTRICTIONS !//
app.use(express.static(path.join(__dirname, "public"))); // SERVE PUBLIC FOLDER SO THAT IT'S ALL INSIDE FILES AND FOLDERS ARE AVAILABLE TO ACCESS FROM ANYWHERE
app.use(express.static(path.join(__dirname, "node_modules"))); // SERVE PUBLIC FOLDER SO THAT IT'S ALL INSIDE FILES AND FOLDERS ARE AVAILABLE TO ACCESS FROM ANYWHERE

// //! SET DEFAULT USER #FOR DEVELOPMENT PURPOSES ONLY, REMOVE IN PRODUCTION# !//

// SET REQUEST USER TO THE TEST USER CREATED
app.use((req, res, next) => {
    User.findOne()
        .then(async (user) => {
            if (user) {
                req.user = user;
                res.locals.loginUser = user.username;
                let userCart = await user.getCart();
                res.locals.cartItemsCount = userCart.itemsCount;
            } else {
                req.user = null;
            }
            next();
        })
        .catch((err) => {
            req.user = null;
            console.log("Cannot get user from database", err);
            next();
        });
});

// MIDDLEWARE TO CHECK IF USER IS ADMIN FOR PRODUCTS CONTROL AUTHORIZATION
app.use("/admin", (req, res, next) => {
    if (req.user?.isAdmin) {
        next();
    } else {
        res.redirect("/");
    }
});

// //! ROUTES !//

// UPDATE PROMOCODE DISCOUNT WHEN UPDATING CART OR CHECKOUT
app.use(["/checkout", "/cart"], (req, res, next) => {
    let promoCode = req.app.get("promoCode") ?? null;
    if (promoCode) {
        req.user
            .getCart()
            .then((cart) => {
                let discountValue = req.user.calculateCartDiscount(promoCode, cart);
                req.app.set("promoDiscountValue", discountValue);
                next();
            })
            .catch((err) => {
                console.log("Cannot calculate cart discount", err);
                next();
            });
    } else {
        req.app.set("promoCode", null);
        req.app.set("promoDiscountValue", 0);
        next();
    }
});

app.use("/admin", adminRoutes); // MAKE PREFIX /admin TO ALL ROUTES IN THIS FILE
app.use(authRoutes);
app.use(shopRoutes);

app.use("/", errorController.get404); // IF ALL UPPER MIDDLEWARES NOT MATCHED, THEN THIS MIDDLEWARE WILL BE ACTIVATED AS 404 ERROR PAGE

const mongoose = require("mongoose");

mongoose
    .connect("mongodb://localhost:27017/ChicCart_mongoose")
    .then((connection) => {
        // CHECK IF TEST USER ALREADY EXISTS IN CART, IF NOT CREATE A ONE
        User.findOne()
            .then((user) => {
                if (!user) {
                    const initUser = new User({
                        firstName: "Super",
                        lastName: "Admin",
                        username: "admin",
                        email: "admin@example.com",
                        password: "Admin123",
                        isAdmin: true,
                        city: "Arizona",
                        address: "Hanko Street",
                        postalCode: "21291",
                        building: "1234",
                        state: "New York",
                        phoneNumber: "+201293837292",
                    });
                    initUser.save();
                    console.log("Test user created successfully.");
                }
                // get all products count in database
                Product.find()
                    .count()
                    .then((count) => {
                        // if not already generated
                        if (!count) {
                            // generate some dummy products
                            let products = Product.generateProducts(200, user._id);
                            // loop through generated products and create a product instance for each product, then add it to the database
                            products.forEach((product) => {
                                let createdProd = new Product({
                                    title: product.title,
                                    description: product.description,
                                    price: product.price,
                                    shippingPrice: Math.floor(Math.random() * 20),
                                    images: product.images,
                                    rating: product.rating,
                                    userID: user,
                                });
                                createdProd.save();
                            });
                        }
                    })
                    .catch((err) => {
                        console.log("Cannot get products count", err);
                    });

                PromoCode.find()
                    .count()
                    .then((count) => {
                        if (!count) {
                            let promoCode = new PromoCode({
                                code: "WELCOME20",
                                discountType: 1,
                                discountValue: 20,
                                maxDiscount: 1000,
                                maxUseCount: 5,
                                perUserMaxUse: 2,
                                expiresAt: new Date("2023-05-1"),
                            });
                            return promoCode.save();
                        }
                    })
                    .then((createdPromo) => {
                        if (createdPromo) {
                            console.log("Promocode created successfully");
                            console.log(createdPromo);
                        }
                    })
                    .catch((err) => {
                        console.log("Error creating promocode", err);
                    });
            })
            .catch((err) => {
                console.log("Error finding user in database", err);
            });
        app.listen(8000);
    })
    .catch((err) => {
        console.log("Cannot connect to database", err);
    });
