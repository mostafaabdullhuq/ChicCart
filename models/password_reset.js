const { Schema, model, Types } = require("mongoose");

const PasswordResetSchema = new Schema({
    userID: {
        type: Types.ObjectId,
        required: true,
        ref: "User",
    },
    token: {
        type: String,
        required: true,
        unique: true,
    },
    expire: {
        type: Date,
        required: true,
        default: new Date().setDate(new Date().getDate() + 1), // ADD 1 DAY TO THE CURRENT DATE
    },
});

module.exports = model("password-reset", PasswordResetSchema);
