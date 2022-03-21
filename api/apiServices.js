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

const fetchGameResult = async (url) => {
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
        return []
      })
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

const generatePlayByPlayUrl = (gameId)  => `https://cdn.nba.com/static/json/liveData/playbyplay/playbyplay_${gameId}.json`;

const fetchMixScoreResults = async (teamsAndGameIds, date, map) => {
  return teamsAndGameIds.reduce((groups, teamAndId) => {
    const [teams, gameId] = teamAndId;
    const config = map[teams];
    if(config.type === 'box_score'){
      config['url'] = generateBoxScoreUrl(gameId, date)
      groups['box_score']= [...groups['box_score'], config]
    }else if(config.type === 'play_by_play'){
      config['url'] = generatePlayByPlayUrl(gameId)
      groups['play_by_play']= [...groups['play_by_play'], config]
    }

    return groups;
  }, {
    'box_score': [],
    'play_by_play': []
  })
}


exports.redditBot = redditBot;
exports.fetchGameResults = fetchGameResults;
exports.fetchGameResult = fetchGameResult;
exports.fetchPlayByPlay = fetchPlayByPlay;
exports.fetchMixScoreResults = fetchMixScoreResults;
exports.generateBoxScoreUrls = generateBoxScoreUrls;
exports.generateBoxScoreUrl = generateBoxScoreUrl;