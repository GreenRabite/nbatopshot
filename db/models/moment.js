const { Sequelize, DataTypes, Model } = require('sequelize');
const sequelize = require('./sequelize');

class Moment extends Model {}

Moment.init({
  // Model attributes are defined here
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true
	},
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  team: {
    type: DataTypes.STRING
    // allowNull defaults to true
  },
  setName: {
    type: DataTypes.STRING,
    field: 'set'
    // allowNull defaults to true
  },
  series: {
    type: DataTypes.STRING
    // allowNull defaults to true
  },
  tier: {
    type: DataTypes.STRING
    // allowNull defaults to true
  },
  play: {
    type: DataTypes.STRING
    // allowNull defaults to true
  },
  date: {
    type: DataTypes.DATE
    // allowNull defaults to true
  },
  circulation: {
    type: DataTypes.NUMBER
    // allowNull defaults to true
  },
  topShotDebut: {
    type: DataTypes.BOOLEAN,
		field: 'top_shot_debut'
    // allowNull defaults to true
  },
  rookiePremiere: {
    type: DataTypes.BOOLEAN,
		field: 'rookie_premiere'
    // allowNull defaults to true
  },
  rookieMint: {
    type: DataTypes.BOOLEAN,
		field: 'rookie_mint'
    // allowNull defaults to true
  },
  rookieYear: {
    type: DataTypes.BOOLEAN,
		field: 'rookie_year'
    // allowNull defaults to true
  },
  createdAt: {
		type: Sequelize.DATE,
		defaultValue: Sequelize.NOW,
		allowNull: false,
		field: 'created_at',
	},
  updatedAt: {
		type: Sequelize.DATE,
		defaultValue: Sequelize.NOW,
		allowNull: false,
		field: 'updated_at',
	}
}, {
  // Other model options go here
  sequelize, // We need to pass the connection instance
  tableName: 'moments' // We need to choose the model name
});

module.exports =  Moment;