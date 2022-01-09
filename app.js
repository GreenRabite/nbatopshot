const express = require('express');
const { Client } = require('pg');
const fs = require('fs')
const { Sequelize, DataTypes, Model } = require('sequelize');
const _ = require('lodash')
require('dotenv').config()

const client = new Client({
    connectionString: process.env.LOCALHOST_DB_CONNECTION
});

const sequelize = new Sequelize('nbatopshot', process.env.PSQL_NAME, process.env.PSQL_PW, {
    host: 'localhost',
    dialect: 'postgres'
})

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
  set: {
    type: DataTypes.STRING
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

const run = async () => {
	const moments = await Moment.findAll();
	const commonMoments = moments.filter(moment =>moment.tier === 'Common' && moment.series != '1' )
															 .filter(m => m.set != "WNBA: Best of 2021" && m.set != 'Archive Set' && m.set != 'Run It Back 2005-06')
	const momentsHash = commonMoments.reduce((accum,moment) => {
		if(accum[moment.name]){
			accum[moment.name].push({
				id: moment.id,
				count: moment.circulation,
			})
			return accum;
		}else{
			accum[moment.name] = [{
				id: moment.id,
				count: moment.circulation,
			}]
			return accum;
		}
	}, {})

	const ownedMoments = _.uniq([
		[undefined, 'Pascal Siakam', 'Dwyane Wade ', 'Mike Conley', 'Terence Davis', 'Kyle Kuzma', 'Kemba Walker', 'Montrezl Harrell', 'Eric Paschall', 'Anthony Davis', 'Andrew Wiggins', 'Montrezl Harrell', 'Avery Bradley ', 'Gary Trent Jr. ', 'Buddy Hield', 'Patty Mills', 'Russell Westbrook', 'Tim Hardaway Jr.', 'Carmelo Anthony', 'Harrison Barnes', 'Marc Gasol', 'Myles Turner', 'T.J. McConnell', 'Anthony Edwards  ', 'Immanuel Quickley  ', 'Nicolas Batum '],
		[undefined, 'Terry Rozier', 'Malik Beasley', 'Steven Adams', 'Deandre Ayton', 'Anthony Edwards  ', 'James Harden', 'Kelsey Mitchell ', 'Russell Westbrook', 'Evan Fournier', 'Kahleah Copper ', 'Kyle Lowry', "Devonte' Graham", 'Lonzo Ball ', 'Anthony Davis', 'Kelly Oubre Jr.', 'Russell Westbrook', 'Nicolas Claxton ', 'Steph Curry', 'Sue Bird ', 'DeMar DeRozan', 'Kevin Durant', 'Candace Parker ', 'P.J. Washington', 'Lou Williams', 'K. Caldwell-Pope'],
		[undefined, 'T.J. Warren', 'Seth Curry', 'Ben McLemore', 'Julius Randle', 'G. Antetokounmpo ', 'Dennis Schröder', 'Anthony Davis', 'Kenyon Martin Jr.  ', 'Domantas Sabonis', 'Devin Booker', 'Tomáš Satoranský', 'LeBron James', 'Clint Capela', 'Kyrie Irving', 'Payton Pritchard  ', 'Isaac Okoro  ', 'Derrick Rose', 'Khris Middleton ', 'Ja Morant', 'Marcus Morris', 'Josh Jackson', 'Luka Dončić', 'Dāvis Bertāns', 'Cameron Johnson', 'Luguentz Dort', undefined],
		[undefined, 'Ja Morant', 'Kenrich Williams ', 'Markieff Morris', 'Onyeka Okongwu  ', 'Danilo Gallinari', 'Gordon Hayward', 'Isaiah Stewart  ', 'Talen Horton-Tucker', 'Christian Wood', 'Xavier Tillman  ', 'Cameron Payne', 'Alex Len ', 'Justise Winslow ', 'Michael Porter Jr.', 'Obi Toppin  ', 'Mikal Bridges', 'Dwight Howard', 'Alex Caruso', 'Skylar Mays   ', 'Ivica Zubac', 'Tobias Harris', 'Domantas Sabonis', 'Chris Paul', 'Cedi Osman', 'Josh Hart'],
		[undefined, 'James Wiseman  ', 'Malcolm Brogdon', 'Joel Embiid', 'Kendrick Nunn', 'Trae Young', 'Patrick Beverley', 'Cody Zeller', "Devonte' Graham", 'Karl-Anthony Towns', 'Evan Fournier', 'CJ McCollum', 'Damian Lillard', 'Draymond Green', 'Eric Gordon', 'Miles Bridges', 'Jusuf Nurkić', 'Jae Crowder', 'Tyrese Haliburton  ', 'P.J. Tucker', 'Goran Dragić', 'Jrue Holiday ', 'Mike Conley', 'Shake Milton', 'Paul George', "De'Anthony Melton"],
		[undefined, 'Kyle Anderson', 'Bogdan Bogdanović', 'Donovan Mitchell', 'Obi Toppin  ', 'Isaac Okoro ', 'Tiffany Mitchell ', 'Layshia Clarendon ', 'Amanda Zahui B ', 'Breanna Stewart ', 'Crystal Dangerfield ', 'Isabelle Harrison ', 'Brittney Griner ', 'Erica Wheeler ', 'Chelsea Gray ', 'Satou Sabally ', 'Marina Mabrey ', 'Michael Finley ', 'Rajon Rondo', 'Luke Walton ', 'Jarrett Jack  ', 'Al Harrington ', 'Alonzo Mourning  ', 'Chris Bosh ', 'James Bouknight   ', 'Max Strus'],
		[undefined, 'Jaren Jackson Jr.', 'Aaron Gordon', 'Danilo Gallinari', 'Damian Jones', 'DeAndre Jordan', 'Talen Horton-Tucker', 'Al Horford', 'Draymond Green', 'P.J. Tucker', 'Andre Drummond', 'Bojan Bogdanović', 'Jordan Clarkson', 'Devin Booker', 'Keldon Johnson', 'Mo Bamba', 'Trey Lyles', 'Jayson Tatum', 'JaVale McGee', 'Anfernee Simons', 'Ish Smith', 'Reggie Jackson', 'Bradley Beal', 'Alex Caruso', 'Jalen Brunson', 'Svi Mykhailiuk'],
		[undefined, 'Christian Wood', 'Jeff Green', 'Jordan Poole', 'Cam Reddish', 'Javonte Green', 'Malik Monk', 'Jimmy Butler', 'Jonas Valančiūnas', 'Tyler Herro', 'Facundo Campazzo', 'Jarrett Allen', 'Harrison Barnes', 'Daniel Gafford', 'Richaun Holmes', 'Kyle Kuzma', 'Eric Bledsoe', 'Dennis Schröder', 'Spencer Dinwiddie', 'Ricky Rubio', 'Patrick Beverley', 'Obi Toppin ', 'Carmelo Anthony ', 'Fred VanVleet', 'Kemba Walker ', 'Jaylen Brown'],
		[undefined, 'Zach LaVine', "A'ja Wilson ", 'Draymond Green', 'Nikola Jokić', 'Nikola Vučević', 'Brook Lopez ', 'Gerald Wallace', 'Kristaps Porziņģis', 'Darius Garland'],
	].flat().filter(a=>a).map(b => b.trim()))

	const keys = Object.keys(momentsHash).filter(key => momentsHash[key].length < 2)
	
	const needed = keys.filter(key => !ownedMoments.includes(key))

	console.log(needed)
	fs.writeFile('data/needed_moments.txt', needed.join('\n'), err => {
  if (err) {
    console.error(err)
    return
  }
  //file written successfully
})

	
}

run()