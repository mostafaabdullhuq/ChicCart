const sequelize = require("./../database/database"),
    { DataTypes } = require("sequelize");

const PromoCode = sequelize.define("promocode", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    code: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    discountType: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
    discountValue: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    maxDiscount: DataTypes.DECIMAL(10, 2),
    maxUseCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
    perUserMaxUse: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
    expireDate: {
        type: DataTypes.DATE,
        allowNull: false,
    },
});

module.exports = PromoCode;
