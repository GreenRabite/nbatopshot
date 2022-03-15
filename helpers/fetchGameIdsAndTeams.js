const axios = require('axios').default;
const _ = require('lodash')

const TODAY_SCOREBOARD_URL = 'https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json'

axios.get(TODAY_SCOREBOARD_URL)
  .then(response => {
    const games = response.data.scoreboard.games;
    
    console.log(games.map(game => {
      const teams = [game.awayTeam.teamTricode, game.homeTeam.teamTricode].join('-')
      return [teams, game.gameId]
    }))
  })