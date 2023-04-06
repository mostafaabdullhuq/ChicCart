const { Schema, model } = require("mongoose"),
    Types = Schema.Types,
    Order = require("./order");

const PromoCodeSchema = new Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    discountType: {
        type: Number,
        enum: [1, 2],
        required: true,
    },
    discountValue: {
        type: Number,
        required: true,
    },
    maxDiscount: {
        type: Number,
        required: true,
    },
    maxUseCount: {
        type: Number,
        default: 1,
    },
    perUserMaxUse: {
        type: Number,
        default: 1,
    },
    expiresAt: {
        type: Date,
        default: Date.now(),
    },
});

PromoCodeSchema.statics.isAvailable = function (promoCode, userID) {
    return model("PromoCode")
        .findOne({
            code: promoCode.toLowerCase(),
            expiresAt: {
                $gt: new Date(),
            },
        })
        .then(async (promoCode) => {
            if (promoCode) {
                let usersUsage = await Order.find({
                    promoCode: promoCode._id,
                }).count();
                let currentUserUsage = await Order.find({
                    promoCode: promoCode._id,
                    userID: userID,
                }).count();
                if (promoCode.perUserMaxUse > currentUserUsage && promoCode.maxUseCount > usersUsage) {
                    return promoCode;
                } else {
                    return false;
                }
            }
            return false;
        })
        .catch((err) => {
            console.log("Cannot check for promocode avaliability", err);
            return false;
        });
};

module.exports = model("PromoCode", PromoCodeSchema);
