// https://data.nba.net/10s/prod/v1/20220103/0022100552_boxscore.json

const axios = require('axios').default;
const _ = require('lodash')
const BB = require("bluebird");
const snoowrap = require('snoowrap');
require('dotenv').config();

const IDS = [
  '0022100562',
  '0022100563',
  '0022100564',
  '0022100565',
  '0022100566',
]

const DATE = "20220104"
const COMMENT_ID = 'hrai3jp'
const URLS = IDS.map(id => `https://data.nba.net/10s/prod/v1/${DATE}/${id}_boxscore.json`);

const formatStats = (players, teams, gameOver) => {
  return players.map(player => {
    return {
      name: `${player.firstName} ${player.lastName}`,
      ast: player.assists,
      to: player.turnovers,
      ratio: Number(player.assists || 0) - Number(player.turnovers || 0),
      teams: teams,
      gameOver: gameOver
    }
  })
}

const runFunction = async () => {
  let remainingGames= 0;

  const results =await BB.map(URLS, async url => {
    return axios.get(url)
      .then(response => {
        const players = response.data.stats.activePlayers;
        const vTeam = response.data.basicGameData.vTeam.triCode
        const hTeam = response.data.basicGameData.hTeam.triCode
        const gameOver = !response.data.basicGameData.isGameActivated
        const teams = [vTeam, hTeam].join('-')
        return formatStats(players, teams, gameOver)
      })
      .catch(function (error) {
        // handle error
        remainingGames++
        return []
        // console.log('Game has Not started yet');
      })
  })

  // const allPlayers = results.flat();
  const sortedList = results.map(game => {
    const sortedGame = game.sort((a,b) => b.ratio - a.ratio).filter(r => r.name != "Keifer Sykes");
    if(sortedGame.length && sortedGame[0].gameOver){
      return sortedGame.slice(0,1)
    }else{
      return sortedGame.slice(0,3)
    }
  })


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

  const markdown = `## Ast-Turnover Leaders \n
${sortedList.map((teamArr) => {
  return teamArr.map((player, idx) => {
    if(idx === 0){
      return `**${player.teams}**\n\n${player.name}: ${player.ratio}`
    }
    return `${player.name}: ${player.ratio}`
  }).join('\n\n')
}).join('\n\n')}
  `

//   const markdown = `## Ast - To Leaders \n
// ${topPlayers.map((player, idx) => {
//   if(idx === 5){
//     return `-------------\n**${player.join(": ")}**`
//   }
//   return `**${player.join(": ")}**`
// }).join('\n\n')}
//   `

  console.log(markdown)


  r.getComment(COMMENT_ID).edit(markdown)

}

setInterval(runFunction, 20000)
// runFunction()




// console.log(r)
// r.getHot().map(post => post.title).then(console.log);





