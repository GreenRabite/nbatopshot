// https://data.nba.net/10s/prod/v1/20220103/0022100552_boxscore.json

const axios = require('axios').default;
const _ = require('lodash')
const fs = require('fs')
const BB = require("bluebird");
const snoowrap = require('snoowrap');
require('dotenv').config();

const DATE_1 = '20220121'
const DATE_2 = '20220122'
const DATE_3 = '20220123'

const DATE_AND_IDS = [
  [DATE_1,'0022100684'],
  [DATE_1,'0022100685'],
  [DATE_1,'0022100686'],
  [DATE_1,'0022100687'],
  [DATE_1,'0022100688'],
  [DATE_1,'0022100689'],
  [DATE_1,'0022100690'],
  [DATE_1,'0022100691'],
  [DATE_1,'0022100692'],
  [DATE_1,'0022100693'],
  [DATE_1,'0022100694'],
  [DATE_2,'0022100695'],
  [DATE_2,'0022100696'],
  [DATE_2,'0022100697'],
  [DATE_3,'0022100698'],
  [DATE_3,'0022100699'],
  [DATE_3,'0022100700'],
  [DATE_3,'0022100701'],
  [DATE_3,'0022100702'],
  [DATE_3,'0022100703'],
  [DATE_3,'0022100704'],
  [DATE_3,'0022100705'],
  [DATE_3,'0022100706'],
  [DATE_3,'0022100707'],
  [DATE_3,'0022100708'],
]


// const DATE = "20220113"
const COMMENT_ID = 'htnq2hj'
const URLS = DATE_AND_IDS.map(date_and_id => `https://data.nba.net/10s/prod/v1/${date_and_id[0]}/${date_and_id[1]}_boxscore.json`);



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
      team: gameData[player.teamId].code,
      timeLeft: gameData.timeLeft,
    }
  })
}

const calculateTimeLeft = (period, clock) => {
  // if(period ===)
  if(!clock && period > 3) return ''

  let minutes;
  let seconds;
  if(clock?.length){
    minutes = Number(clock.split(":")[0])
    seconds = clock.split(":")[1] || 0
  }else{
    minutes=0;
    seconds=0;
  }

  return `[Q${period}: ${minutes}:${seconds}]`
}

const runFunction = async () => {
  let remainingGames= 0;

  const results =await BB.map(URLS, async url => {
    return axios.get(url)
      .then(response => {
        const players = response.data.stats.activePlayers;
        const clockRunning = !!response.data.basicGameData.clock
        const period = response.data.basicGameData?.period?.current
        const gameOver = !clockRunning && period > 3;
        const timeLeft = calculateTimeLeft(period, response.data.basicGameData.clock)

        // update series tracker
        // update this
        // ([response.data.basicGameData.hTeam.triCode, response.data.basicGameData.vTeam.triCode]).forEach(code => {
        //   if(newGameCounter[code]){
        //     newGameCounter[code] = newGameCounter[code] - 1
        //   }
        // })

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
          gameOver,
          [response.data.basicGameData.hTeam.teamId]: hTeam,
          [response.data.basicGameData.vTeam.teamId]: vTeam,
          timeLeft,
        }

        return formatStats(players, gameData)
      })
      .catch(function (error) {
        // console.log(error)
        remainingGames++
        return []
        // console.log('Game has Not started yet');
      })
  })

  const allPlayers = results.flat();
  // combine existing players into one entry

  // const combinePlayers = allPlayers.reduce((combined, player) => {
  //   if(combined[player.name]){
  //     const existingPlayer = combined[player.name];
  //     combined[player.name] = {
  //       ...existingPlayer,
  //       ...{
  //         points: existingPlayer.points + player.points,
  //         teamMargin: existingPlayer.teamMargin + player.teamMargin,
  //         plusMinus: existingPlayer.plusMinus + player.plusMinus,
  //         secondsPlayed: existingPlayer.secondsPlayed + player.secondsPlayed,
  //       }
  //     }
  //     return combined
  //   }else{
  //     combined[player.name] = {...player, ...{flashSeriesOver: player.flashSeriesOver && (newGameCounter[player.team] === 0 || newGameCounter[player.team] === undefined)}};
  //     return combined;
  //   }
  // }, {})

  // const combinedPlayersList = Object.values(combinePlayers)

  const allPlayersSorted = allPlayers.sort((a,b) => {
    if(a.points != b.points){
      return b.points - a.points
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
  })
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

  const sortedPlayerList = allPlayersSorted

  const standings = sortedPlayerList.map((player, idx)=> {
    // const tieBreaker = `[Margin: ${player.teamMargin} / +/-: ${player.plusMinus} / Min: ${Math.round(player.secondsPlayed / 60)}]`
    const matchup = `[${player.teams}]`;
    // const playerInfo = flashSeriesOver ? `**${player.name}: ${player.points}** ${extraData}` : `${player.name}: ${player.points} ${extraData}`
    const playerInfo = player.gameOver ? `**${player.name}: ${player.points}** ${matchup}` : `${player.name}: ${player.points}`
    // remove players if they have no shot
    if(idx >= 9 && player.gameOver) return undefined
    if(idx===8) return `* ${playerInfo} ${player.timeLeft}\n\n-------------------------`
    return `* ${playerInfo} ${player.timeLeft}`
  }).filter(x => !!x).slice(0,15)

  const markdown = [
    `## Points Leaders`,
    ...standings,
    `**Update: ${new Date().toLocaleString()}**`,
    `There are ${remainingGames} games that have not started yet.`,
    `**Bolded players** are done for that game`,
    `Team Margin / Player's ± / Minutes Played`,
  ].join("\n\n")

  console.log(markdown)

  r.getComment(COMMENT_ID).edit(markdown)

}

setInterval(runFunction, 60000)
// runFunction()
