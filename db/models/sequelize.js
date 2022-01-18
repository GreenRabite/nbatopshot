const { Sequelize, DataTypes, Model } = require('sequelize');
require('dotenv').config()

const sequelize = new Sequelize('nbatopshot', process.env.PSQL_NAME, process.env.PSQL_PW, {
    host: 'localhost',
    dialect: 'postgres'
})

module.exports = sequelize;