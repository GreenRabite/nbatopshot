require('dotenv').config();
const snoowrap = require('snoowrap');
const axios = require('axios').default;
const BB = require("bluebird");
const timeServices = require('./timeServices');
const statsServices = require('./statsServices');

const redditBot = new snoowrap({
  userAgent: 'KobeBot',
  clientId: process.env.REDDIT_CLIENT_ID,
  clientSecret: process.env.REDDIT_SECRET_ID,
  refreshToken: process.env.REDDIT_REFRESH_TOKEN,
});

const fetchGameResults = async (urls) => {
  let remainingGames= 0;

  return {
    results: await BB.mapSeries(urls, async url => {
    return axios.get(url)
      .then(response => {
        const players = response.data.stats.activePlayers;
        const clockRunning = !!response.data.basicGameData.clock
        const period = response.data.basicGameData?.period?.current
        const gameOver = !clockRunning && period > 3;
        const timeLeft = timeServices.calculateTimeLeft(period, response.data.basicGameData.clock)
        const vTeam = {
          code: response.data.basicGameData.vTeam.triCode,
          margin: Number(response.data.basicGameData.vTeam.score) - Number(response.data.basicGameData.hTeam.score),
          assists: Number(response.data.stats.vTeam.totals.assists),
        }

        const hTeam = {
          code: response.data.basicGameData.hTeam.triCode,
          margin: Number(response.data.basicGameData.hTeam.score) - Number(response.data.basicGameData.vTeam.score),
          assists: Number(response.data.stats.hTeam.totals.assists),
        }

        const gameData = {
          teams: [vTeam.code, hTeam.code].join('-'),
          gameOver: gameOver,
          [response.data.basicGameData.hTeam.teamId]: hTeam,
          [response.data.basicGameData.vTeam.teamId]: vTeam,
          vTeam,
          hTeam,
          timeLeft,
        }

        return statsServices.formatStats(players, gameData)
      })
      .catch(function (error) {
        // handle error
        // console.log(error)
        remainingGames++
        return undefined
      })
     }).filter(x=>!!x),
     remainingGames
  }
}

const fetchPlayByPlay = async (url) => {
  return axios.get(url)
      .then(response => {
        const plays = response.data.game.actions;
        return plays;
      })
      .catch(function (error) {
        return [];
      })
}

const generateBoxScoreUrls = async (ids, date) => {
  return ids.map(id => generateBoxScoreUrl(id, date))
};

const generateBoxScoreUrl = (id, date) => `https://data.nba.net/10s/prod/v1/${date}/${id}_boxscore.json`;


exports.redditBot = redditBot;
exports.fetchGameResults = fetchGameResults;
exports.fetchPlayByPlay = fetchPlayByPlay;
exports.generateBoxScoreUrls = generateBoxScoreUrls;
exports.generateBoxScoreUrl = generateBoxScoreUrl;