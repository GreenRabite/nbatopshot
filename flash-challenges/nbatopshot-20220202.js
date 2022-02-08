// https://data.nba.net/10s/prod/v1/20220103/0022100552_boxscore.json

const axios = require('axios').default;
const _ = require('lodash')
const fs = require('fs')
const BB = require("bluebird");
const snoowrap = require('snoowrap');
require('dotenv').config();

const IDS = [
  '0022100773',
  '0022100774',
  '0022100775',
  '0022100776',
  '0022100777',
  '0022100778',
  '0022100779',
  '0022100780',
  '0022100781',
]

const DATE = "20220202"
const COMMENT_ID = 'hvc636w'
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
      fga: Number(player.fga),
      ftm: Number(player.ftm),
      assists: Number(player.assists),
      fgm: Number(player.fgm),
      fgmFtm: Number(player.ftm) + Number(player.fgm),
      teams: gameData.teams,
      team: gameData[player.teamId].code,
      gameOver: gameData.gameOver,
      teamMargin: gameData[player.teamId].margin,
      plusMinus: Number(player.plusMinus),
      secondsPlayed: calculateSeconds(player.min),
      timeLeft: gameData.timeLeft,
    }
  })
}

const calculateTimeLeft = (period, clock) => {
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
        const vTeam = {
          code: response.data.basicGameData.vTeam.triCode,
          margin: Number(response.data.basicGameData.vTeam.score) - Number(response.data.basicGameData.hTeam.score),
        }

        const hTeam = {
          code: response.data.basicGameData.hTeam.triCode,
          margin: Number(response.data.basicGameData.hTeam.score) - Number(response.data.basicGameData.vTeam.score),
        }
        // console.log(hTeam.code, vTeam.code)

        const gameData = {
          teams: [vTeam.code, hTeam.code].join('-'),
          gameOver: gameOver,
          [response.data.basicGameData.hTeam.teamId]: hTeam,
          [response.data.basicGameData.vTeam.teamId]: vTeam,
          timeLeft,
        }

        return formatStats(players, gameData)
      })
      .catch(function (error) {
        // handle error
        remainingGames++
        // console.log('Game has Not started yet');
        return []
      })
  })

  const allPlayers = results.flat();
  const allPlayersSorted = allPlayers.sort((a,b) => {
    if(a.ftm != b.ftm){
      return b.ftm - a.ftm
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

  const sortedList = results.map(game => {
    const sortedGame = game.filter(player => player.name != 'Terry Taylor').sort((a,b) => {
      // Main Sort
      if(a.fgmFtm != b.fgmFtm){
        return b.fgmFtm - a.fgmFtm
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
    });

    if(sortedGame.length && sortedGame[0].gameOver){
      return sortedGame.slice(0,1);
    }else{
      return sortedGame.slice(0,5);
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

  // const standings = sortedList.map(teamArr => {
  //   return teamArr.map((player, idx) => {
  //     if(idx === 0){
  //       return `**${player.teams}**\n\n* ${player.name}: ${player.points}`;
  //     }

  //     return `* ${player.name}: ${player.points}`;
  //   }).join("\n\n")
  // })

  // console.log(sortedPlayerList)

  // const standings = sortedPlayerList.map((player, idx)=> {
  //   // const tieBreaker = `[Margin: ${player.teamMargin} / +/-: ${player.plusMinus} / Min: ${Math.round(player.secondsPlayed / 60)}]`
  //   const playerInfo = player.gameOver ? `* **${player.name}: ${player.totalCat}**` : `${player.name}: ${player.totalCat}`

  //   if(idx===4) return `${playerInfo} ${player.timeLeft}\n\n-------------------------`
  //   if(idx >= 5 && player.gameOver) return undefined;
  //   return `${playerInfo} ${player.timeLeft}`
  // }).filter(x => !!x).slice(0,10)

  const standings = sortedList.map(teamArr => {
    return teamArr.map((player, idx, list) => {
      if(idx === 0){
        return `**${player.teams}** ${player.timeLeft}\n\n* ${list.length === 1 ? `**${player.name}**` : player.name}: ${player.fgmFtm}`;
      }

      return `* ${player.name}: ${player.fgmFtm}`;
    }).join("\n\n")
  })

  const markdown = [
    `## Field Goals Made / Free Throws Made Leaders`,
    ...standings,
    `**Update: ${new Date().toLocaleString()} PST**`,
    `There are ${remainingGames} games that have not started yet.`,
    `**Bolded players** are done for the challenge`,
    `[Numbers] in bracket show time left in regulation for the game`,
    `Tiebreakers: Team Margin / Player's ± / Minutes Played`,
  ].join("\n\n")

  console.log(markdown)

  r.getComment(COMMENT_ID).edit(markdown)
  // setTimeout(()=>{
  //   r.getComment(COMMENT_ID_2).edit(markdown)
  // }, 15000)

}



setInterval(runFunction, 45000)
// runFunction()
