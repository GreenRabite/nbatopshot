// https://data.nba.net/10s/prod/v1/20220103/0022100552_boxscore.json

const axios = require('axios').default;
const _ = require('lodash')
const BB = require("bluebird");
const snoowrap = require('snoowrap');
require('dotenv').config();

const IDS = [
  '0022100627',
  '0022100628',
  '0022100629',
  '0022100630',
  '0022100631',
]

const DATE = "20220113"
const COMMENT_ID = 'hsjtgr0'
const URLS = IDS.map(id => `https://data.nba.net/10s/prod/v1/${DATE}/${id}_boxscore.json`);

const calculateSeconds = (time) => {
  if(!time) return 0;

  const timeArray = time.split(":");
  return Number(timeArray[0])*60 + Number(timeArray[1])
}

const formatStats = (players, gameData) => {
  return players.map(player => {
    return {
      name: `${player.firstName} ${player.lastName}`,
      points: Number(player.points),
      rebs: Number(player.totReb),
      blks: Number(player.blocks),
      rebsBlks: Number(player.totReb) + Number(player.blocks),
      teams: gameData.teams,
      gameOver: gameData.gameOver,
      teamMargin: gameData[player.teamId].margin,
      plusMinus: Number(player.plusMinus),
      secondsPlayed: calculateSeconds(player.min),
    }
  })
}

const runFunction = async () => {
  let remainingGames= 0;

  const results =await BB.map(URLS, async url => {
    return axios.get(url)
      .then(response => {
        const players = response.data.stats.activePlayers;
        const vTeam = {
          code: response.data.basicGameData.vTeam.triCode,
          margin: Number(response.data.basicGameData.vTeam.score) - Number(response.data.basicGameData.hTeam.score),
        }

        const hTeam = {
          code: response.data.basicGameData.hTeam.triCode,
          margin: Number(response.data.basicGameData.hTeam.score) - Number(response.data.basicGameData.vTeam.score),
        }
        const gameData = {
          teams: [vTeam.code, hTeam.code].join('-'),
          gameOver: !(!!response.data.basicGameData.clock),
          [response.data.basicGameData.hTeam.teamId]: hTeam,
          [response.data.basicGameData.vTeam.teamId]: vTeam,
        }

        return formatStats(players, gameData)
      })
      .catch(function (error) {
        // handle error
        remainingGames++
        return []
        // console.log('Game has Not started yet');
      })
  })

  const allPlayers = results.flat();
  const allPlayersSorted = allPlayers.sort((a,b) => {
    if(a.rebsBlks != b.rebsBlks){
      return b.rebsBlks - a.rebsBlks
    }

    // First tiebreaker
    if(a.teamMargin != b.teamMargin){
      return b.teamMargin - a.teamMargin
    }

    // Second tiebreaker
    if(a.plusMinus != b.plusMinus){
      return b.plusMinus - a.plusMinus
    }

    // Third tiebreaker
    if(a.secondsPlayed != b.secondsPlayed){
      return b.secondsPlayed - a.secondsPlayed
    }

    return 0;
  }).slice(0,15)
  // const sortedList = results.map(game => {
  //   const sortedGame = game.sort((a,b) => {
  //     // Main Sort
  //     if(a.points != b.points){
  //       return b.points - a.points
  //     }

  //     // First tiebreaker
  //     if(a.teamMargin != b.teamMargin){
  //       return b.teamMargin - a.teamMargin
  //     }

  //     // Second tiebreaker
  //     if(a.plusMinus != b.plusMinus){
  //       return b.plusMinus - a.plusMinus
  //     }

  //     // Third tiebreaker
  //     if(a.secondsPlayed != b.secondsPlayed){
  //       return b.secondsPlayed - a.secondsPlayed
  //     }

  //     return 0;
  //   });

  //   if(sortedGame.length && sortedGame[0].gameOver){
  //     return sortedGame.slice(0,1)
  //   }else{
  //     return sortedGame.slice(0,3)
  //   }
  // })


  // const sortedList = allPlayers.sort((a,b) => b.ratio - a.ratio)
  // console.log(sortedList.slice(0,6))

  const r = new snoowrap({
    userAgent: 'KobeBot',
    clientId: process.env.REDDIT_CLIENT_ID,
    clientSecret: process.env.REDDIT_SECRET_ID,
    refreshToken: process.env.REDDIT_REFRESH_TOKEN,
  });

  // const topPlayers = sortedList.map(player => {
  //   return [player.name, player.ratio, player.teams]
  // })

  // const standings = sortedList.map(teamArr => {
  //   return teamArr.map((player, idx) => {
  //     if(idx === 0){
  //       return `**${player.teams}**\n\n* ${player.name}: ${player.points}`;
  //     }

  //     return `* ${player.name}: ${player.points}`;
  //   }).join("\n\n")
  // })

  const standings = allPlayersSorted.map((player, idx)=> {
    if(idx===10) return `-------------------------\n\n${player.name}: ${player.rebsBlks}`
    return `${player.name}: ${player.rebsBlks}`
  })

  const markdown = [
    `## Block/Reb Leaders`,
    ...standings,
    `**Update: ${new Date().toLocaleString()}**`,
    `There are ${remainingGames} games that have not started yet.`
  ].join("\n\n")

  console.log(markdown)

  r.getComment(COMMENT_ID).edit(markdown)

}

setInterval(runFunction, 45000)
// runFunction()