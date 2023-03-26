const express = require("express");
const bodyParser = require("body-parser");
const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");
const path = require("path");
const app = express();
const errorController = require("./controllers/errorController");

app.set("view engine", "ejs");
app.set("views", "views");

app.use(bodyParser.urlencoded({ extended: false })); // PARSE INCOMING REQUESTS BODIES

app.use(express.static(path.join(__dirname, "public"))); // SERVE PUBLIC FOLDER SO THAT IT'S ALL INSIDE FILES AND FOLDERS ARE AVAILABLE TO ACCESS FROM ANYWHERE
app.use(express.static(path.join(__dirname, "node_modules"))); // SERVE PUBLIC FOLDER SO THAT IT'S ALL INSIDE FILES AND FOLDERS ARE AVAILABLE TO ACCESS FROM ANYWHERE

app.use("/admin", adminRoutes); // MAKE PREFIX /admin TO ALL ROUTES IN THIS FILE
app.use(authRoutes);
app.use(shopRoutes);

// IF ALL UPPER MIDDLEWARES NOT MATCHED, THEN THIS MIDDLEWARE WILL BE ACTIVATED AS 404 ERROR PAGE
app.use("/", errorController.get404);

app.listen(8000); // LISTEN FOR INCOMING REQUESTS ON THIS PORT
