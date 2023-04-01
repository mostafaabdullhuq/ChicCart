const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("./../database/database");

const User = sequelize.define("user", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    firstName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            is: {
                test: /^(?=.*[a-zA-Z])[a-zA-Z0-9._-]{5,20}$/i,
                msg: "Username doesn't meet the requirements.",
            },
        },
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        },
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    isAdmin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    city: DataTypes.STRING,
    address: DataTypes.STRING,
    postal: DataTypes.STRING,
    building: DataTypes.STRING,
    state: DataTypes.STRING,
    phoneNumber: DataTypes.STRING,
});

module.exports = User;
