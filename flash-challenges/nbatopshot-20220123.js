// https://data.nba.net/10s/prod/v1/20220103/0022100552_boxscore.json

const axios = require('axios').default;
const _ = require('lodash')
const fs = require('fs')
const BB = require("bluebird");
const snoowrap = require('snoowrap');
require('dotenv').config();

const IDS = [
'0022100698',
'0022100699',
'0022100700',
'0022100701',
'0022100702',
'0022100703',
'0022100704',
'0022100705',
'0022100706',
'0022100707',
'0022100708',
]

const DATE = "20220121"
const COMMENT_ID = 'htt05zo'
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
      fgm: Number(player.fgm),
      assists: Number(player.assists),
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
    if(a.assists != b.assists){
      return b.assists - a.assists
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

  const lakersPlayers = allPlayers.filter(player => player.team === 'LAL')
  const clippersPlayers = allPlayers.filter(player => player.team === 'LAC')
  const knicksPlayers = allPlayers.filter(player => player.team === 'NYK')
  const netsPlayers = allPlayers.filter(player => player.team === 'BKN')

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

  const sortByPoints = (players) => {
    return players.sort((a,b) => {
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
  }

  const sortedPlayerList = allPlayersSorted.filter(player => player.name != 'Kessler Edwards');
  const lakersSorted = sortByPoints(lakersPlayers)
  const clippersSorted = sortByPoints(clippersPlayers)
  const knicksSorted = sortByPoints(knicksPlayers)
  const netsSorted = sortByPoints(netsPlayers)

  const teamStandings = (players) => {
    if(players.length ===0) return ['The game has not started yet']

    return players.map((player, idx) => {
      const playerInfo = player.gameOver ? `* **${player.name}: ${player.points}**` : `${player.name}: ${player.points}`
  
      if(idx === 0) return `${playerInfo} ${player.timeLeft}\n\n-------------------------`
      if(idx >= 1 && player.gameOver) return undefined;
      return `${playerInfo} ${player.timeLeft}`
    }).filter(x => !!x).slice(0,3)
  }

  const standings = sortedPlayerList.map((player, idx)=> {
    // const tieBreaker = `[Margin: ${player.teamMargin} / +/-: ${player.plusMinus} / Min: ${Math.round(player.secondsPlayed / 60)}]`
    const playerInfo = player.gameOver ? `* **${player.name}: ${player.assists}**` : `${player.name}: ${player.assists}`

    if(idx === 2) return `${playerInfo} ${player.timeLeft}\n\n-------------------------`
    if(idx >= 3 && player.gameOver) return undefined;
    return `${playerInfo} ${player.timeLeft}`
  }).filter(x => !!x).slice(0,15)


  const markdown = [
    '### LA Lakers Top Scorers',
    ...teamStandings(lakersSorted),
    '### LA Clippers Top Scorers',
    ...teamStandings(clippersSorted),
    '### New York Knicks Top Scorers',
    ...teamStandings(knicksSorted),
    '### Brooklyn Nets Top Scorers',
    ...teamStandings(netsSorted),
    `### Assists Leaders`,
    ...standings,
    `**Update: ${new Date().toLocaleString()} PST**`,
    `There are ${remainingGames} games that have not started yet.`,
    `**Bolded players** are done for the challenge`,
    `[Numbers] in bracket show time left in regulation for the game`,
    `Tiebreakers: Team Margin / Player's ± / Minutes Played`
  ].join("\n\n")

  console.log(markdown)

  r.getComment(COMMENT_ID).edit(markdown)

}



setInterval(runFunction, 120000)
// runFunction()
