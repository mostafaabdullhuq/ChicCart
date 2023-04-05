const { ObjectId } = require("mongodb"),
    { mongoDB } = require("./../database/database");

class PromoCode {
    constructor(id = null, code, discountType, discountValue, maxDiscount, maxUseCount, perUserMaxUse, expireDate) {
        this._id = id ? new ObjectId(id) : null;
        this.code = code.toLowerCase();
        this.discountType = +discountType === 1 ? 1 : 2;
        this.discountValue = +discountValue;
        this.maxDiscount = maxDiscount;
        this.maxUseCount = maxUseCount;
        this.perUserMaxUse = perUserMaxUse;
        this.expireDate = new Date(expireDate).toISOString() ?? new Date().toISOString();
    }

    save() {
        return mongoDB().collection("promocodes").insertOne(this);
    }

    static getAllPromoCodes() {
        return mongoDB().collection("promocodes").find().toArray();
    }

    static getOrders(promoCode) {
        return mongoDB()
            .collection("orders")
            .find({
                promoCode: promoCode.code.toLowerCase(),
            })
            .toArray();
    }

    static getPromo(promoCode) {
        return mongoDB().collection("promocodes").findOne({
            code: promoCode.toLowerCase(),
        });
    }

    // static getUserPromoUsage(promoID) {
    //     return mongoDB()
    //         .collection("orders")
    //         .findOne({
    //             _id: new ObjectId(promoID),
    //         });
    // }

    static isAvailable(promoCode, userID) {
        return PromoCode.getPromo(promoCode)
            .then(async (promo) => {
                let promoOrders = await PromoCode.getOrders(promo);
                if (promoOrders.length >= promo.maxUseCount) {
                    return false;
                }
                return promo;
            })
            .then(async (promo) => {
                if (promo) {
                    let userUsage = await mongoDB()
                        .collection("orders")
                        .find({
                            userID: new ObjectId(userID),
                            "promoCode._id": new ObjectId(promo._id),
                        })
                        .toArray();

                    userUsage = userUsage.length;

                    if (userUsage < promo.perUserMaxUse) {
                        return promo;
                    }
                    return false;
                }

                return false;
            })
            .catch((err) => {
                console.log("Cannot check for promocode availability", err);
                return false;
            });
    }
}

module.exports = PromoCode;
