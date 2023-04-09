const { Router } = require("express");
const router = Router();
const authController = require("../controllers/authController");

router.get("/login", authController.getLogin);
router.post("/login", authController.postLogin);
router.get("/signup", authController.getSignup);
router.post("/signup", authController.postSignup);
router.get("/logout", authController.postLogout);

module.exports = router;
