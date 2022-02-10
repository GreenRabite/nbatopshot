// https://data.nba.net/10s/prod/v1/20220103/0022100552_boxscore.json

const axios = require('axios').default;
const _ = require('lodash')
const fs = require('fs')
const BB = require("bluebird");
const snoowrap = require('snoowrap');
require('dotenv').config();

const DATE_1 = '20220207'
const DATE_2 = '20220208'
const DATE_3 = '20220209'
const DATE_4 = '20220210'
const DATE_5 = '20220211'
const DATE_6 = '20220212'
const DATE_7 = '20220213'

const MONDAY_IDS = [
  [DATE_1,'0022100810'],
  [DATE_1,'0022100811'],
  [DATE_1,'0022100812'],
  [DATE_1,'0022100813'],
  [DATE_1,'0022100814'],
]

const TUESDAY_IDS = [
  [DATE_2,'0022100815'],
  [DATE_2,'0022100816'],
  [DATE_2,'0022100817'],
  [DATE_2,'0022100818'],
  [DATE_2,'0022100819'],
  [DATE_2,'0022100820'],
  [DATE_2,'0022100821'],
  [DATE_2,'0022100822'],
  [DATE_2,'0022100823'],
  [DATE_2,'0022100824'],
]

const WEDNESDAY_IDS = [
  [DATE_3,'0022100825'],
  [DATE_3,'0022100826'],
  [DATE_3,'0022100827'],
  [DATE_3,'0022100828'],
  [DATE_3,'0022100829'],
  [DATE_3,'0022100830'],
]

const COMMENT_ID = 'hw04ca0'
const genUrls = (date_and_ids) => date_and_ids.map(date_and_id => `https://data.nba.net/10s/prod/v1/${date_and_id[0]}/${date_and_id[1]}_boxscore.json`);

const MONDAY_URLS = genUrls(MONDAY_IDS)
const TUESDAY_URLS = genUrls(TUESDAY_IDS)
const WEDNESDAY_URLS = genUrls(WEDNESDAY_IDS)


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
        const timeLeft = calculateTimeLeft(period, response.data.basicGameData.clock)
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
        // console.log(hTeam.code, vTeam.code)

        const gameData = {
          teams: [vTeam.code, hTeam.code].join('-'),
          gameOver: gameOver,
          [response.data.basicGameData.hTeam.teamId]: hTeam,
          [response.data.basicGameData.vTeam.teamId]: vTeam,
          vTeam,
          hTeam,
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
     }),
     remainingGames
  }
}

const sortPlayersByAttribute = (players, attribute) => {
  return players.sort((a,b) => {
    if(a[attribute] != b[attribute]){
      return b[attribute] - a[attribute]
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

const standingsByAttribute = (players, attribute) => {
  return players.map((player, idx) => {
    const playerInfo = player.gameOver ? `* **${player.name}: ${player[attribute]}**` : `${player.name}: ${player[attribute]}`

    if(idx===0) return `${playerInfo} ${player.timeLeft}\n\n-------------------------`
    if(idx >= 1 && player.gameOver) return undefined;
    return `${playerInfo} ${player.timeLeft}`
  }).filter(x => !!x).slice(0,4)
}

const runFunction = async () => {

  const {results:mondayResults, remainingGames: mondayRemainingGames} = await fetchGameResults(MONDAY_URLS)
  const {results:tuesdayResults, remainingGames: tuesdayRemainingGames} = await fetchGameResults(TUESDAY_URLS)
  const {results:wednesdayResults, remainingGames: wednesdayRemainingGames} = await fetchGameResults(WEDNESDAY_URLS)

  const mondayPlayers = mondayResults.flat();
  const mondayPointLeaders = sortPlayersByAttribute(_.clone(mondayPlayers), 'points')

  const tuesdayPlayers = tuesdayResults.flat();
  const tuesdayPointLeaders = sortPlayersByAttribute(_.clone(tuesdayPlayers), 'points')

  const wednesdayPlayers = wednesdayResults.flat();
  const wednesdayPointLeaders = sortPlayersByAttribute(_.clone(wednesdayPlayers), 'assists')

  const r = new snoowrap({
    userAgent: 'KobeBot',
    clientId: process.env.REDDIT_CLIENT_ID,
    clientSecret: process.env.REDDIT_SECRET_ID,
    refreshToken: process.env.REDDIT_REFRESH_TOKEN,
  });

  const markdown = [
    `## Monday Leaders`,
    `### Points Leaders`,
    ...standingsByAttribute(mondayPointLeaders, 'points'),
    `There are ${mondayRemainingGames} Monday games that have not started yet.`,
    `## Tuesday Leaders`,
    `### Points Leaders`,
    ...standingsByAttribute(tuesdayPointLeaders, 'points'),
    `There are ${tuesdayRemainingGames} Tuesday games that have not started yet.`,
    `## Wednesday Leaders`,
    `### Points Leaders`,
    ...standingsByAttribute(wednesdayPointLeaders, 'assists'),
    `There are ${wednesdayRemainingGames} Wednesday games that have not started yet.`,
    `## Thursday Leaders`,
    `The games have not started yet`,
    `## Friday Leaders`,
    `The games have not started yet`,
    `## Saturday Leaders`,
    `The games have not started yet`,
    `## Sunday Leaders`,
    `The games have not started yet`,
    `**Update: ${new Date().toLocaleString()} PST**`,
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



setInterval(runFunction, 60000)
// runFunction()
