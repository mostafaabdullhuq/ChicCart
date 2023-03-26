const { Router } = require("express");
const router = Router();
const authController = require("../controllers/authController");

router.get("/login", authController.getLogin);
router.get("/signup", authController.getSignup);

module.exports = router;
