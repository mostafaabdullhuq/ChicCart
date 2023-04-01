const sequelize = require("./../database/database");
const { DataTypes } = require("sequelize");

const Product = sequelize.define("product", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    price: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: false,
    },
    shippingPrice: {
        type: DataTypes.DECIMAL(6, 2),
        defaultValue: 0,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            len: [10, 5000],
        },
    },
});

module.exports = Product;
