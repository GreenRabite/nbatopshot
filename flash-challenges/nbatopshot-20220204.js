// https://data.nba.net/10s/prod/v1/20220103/0022100552_boxscore.json

const axios = require('axios').default;
const _ = require('lodash')
const fs = require('fs')
const BB = require("bluebird");
const snoowrap = require('snoowrap');
require('dotenv').config();

const DATE_1 = '20220204'
const DATE_2 = '20220205'
const DATE_3 = '20220206'

const FRIDAY_IDS = [
  [DATE_1,'0022100787'],
  [DATE_1,'0022100788'],
  [DATE_1,'0022100789'],
  [DATE_1,'0022100790'],
  [DATE_1,'0022100791'],
  [DATE_1,'0022100792'],
  [DATE_1,'0022100793'],
  [DATE_1,'0022100794'],
  [DATE_1,'0022100795'],
]

const SAT_IDS = [
  [DATE_2,'0022100796'],
  [DATE_2,'0022100797'],
  [DATE_2,'0022100798'],
  [DATE_2,'0022100799'],
  [DATE_2,'0022100800'],
  [DATE_2,'0022100801'],
]

const SUNDAY_IDS = [
  [DATE_3,'0022100802'],
  [DATE_3,'0022100803'],
  [DATE_3,'0022100804'],
  [DATE_3,'0022100805'],
  [DATE_3,'0022100806'],
  [DATE_3,'0022100807'],
  [DATE_3,'0022100808'],
  [DATE_3,'0022100809'],
]

const COMMENT_ID = 'hvmrgjs'
const COMMENT_ID_2 = 'hvnw0me'
const genUrls = (date_and_ids) => date_and_ids.map(date_and_id => `https://data.nba.net/10s/prod/v1/${date_and_id[0]}/${date_and_id[1]}_boxscore.json`);

const FRIDAY_URLS = genUrls(FRIDAY_IDS)
const SATURSDAY_URLS = genUrls(SAT_IDS)
const SUNDAY_URLS = genUrls(SUNDAY_IDS)


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

  const {results:fridayResults, remainingGames: fridayRemainingGames} = await fetchGameResults(FRIDAY_URLS)
  const {results:satResults, remainingGames: satRemainingGames} = await fetchGameResults(SATURSDAY_URLS)
  const {results:sundayResults, remainingGames: sundayRemainingGames} = await fetchGameResults(SUNDAY_URLS)

  const fridayPlayers = fridayResults.flat();
  const fridayPointLeaders = sortPlayersByAttribute(_.clone(fridayPlayers), 'points')
  const fridayReboundsLeaders = sortPlayersByAttribute(_.clone(fridayPlayers), 'rebs')
  const fridayAssistsLeaders = sortPlayersByAttribute(_.clone(fridayPlayers), 'assists')

  const satPlayers = satResults.flat();
  const satPointLeaders = sortPlayersByAttribute(_.clone(satPlayers), 'points')
  const satReboundsLeaders = sortPlayersByAttribute(_.clone(satPlayers), 'rebs')
  const satAssistsLeaders = sortPlayersByAttribute(_.clone(satPlayers), 'assists')

  const sundayPlayers = sundayResults.flat();
  const sundayPointLeaders = sortPlayersByAttribute(_.clone(sundayPlayers), 'points')
  const sundayReboundsLeaders = sortPlayersByAttribute(_.clone(sundayPlayers), 'rebs')
  const sundayAssistsLeaders = sortPlayersByAttribute(_.clone(sundayPlayers), 'assists')


  const r = new snoowrap({
    userAgent: 'KobeBot',
    clientId: process.env.REDDIT_CLIENT_ID,
    clientSecret: process.env.REDDIT_SECRET_ID,
    refreshToken: process.env.REDDIT_REFRESH_TOKEN,
  });

  const markdown = [
    `## Friday Leaders`,
    `### Points Leaders`,
    ...standingsByAttribute(fridayPointLeaders, 'points'),
    `### Rebound Leaders`,
    ...standingsByAttribute(fridayReboundsLeaders, 'rebs'),
    `### Assists Leaders`,
    ...standingsByAttribute(fridayAssistsLeaders, 'assists'),
    `There are ${fridayRemainingGames} Friday games that have not started yet.`,
    `## Saturday Leaders`,
    `### Points Leaders`,
    ...standingsByAttribute(satPointLeaders, 'points'),
    `### Rebound Leaders`,
    ...standingsByAttribute(satReboundsLeaders, 'rebs'),
    `### Assists Leaders`,
    ...standingsByAttribute(satAssistsLeaders, 'assists'),
    `There are ${satRemainingGames} Saturday games that have not started yet.`,
    `## Sunday Leaders`,
    `### Points Leaders`,
    ...standingsByAttribute(sundayPointLeaders, 'points'),
    `### Rebound Leaders`,
    ...standingsByAttribute(sundayReboundsLeaders, 'rebs'),
    `### Assists Leaders`,
    ...standingsByAttribute(sundayAssistsLeaders, 'assists'),
    `There are ${sundayRemainingGames} Sunday games that have not started yet.`,
    `**Update: ${new Date().toLocaleString()} PST**`,
    `**Bolded players** are done for the challenge`,
    `[Numbers] in bracket show time left in regulation for the game`,
    `Tiebreakers: Team Margin / Player's ± / Minutes Played`,
  ].join("\n\n")

  console.log(markdown)

  r.getComment(COMMENT_ID).edit(markdown)
  setTimeout(()=>{
    r.getComment(COMMENT_ID_2).edit(markdown)
  }, 15000)

}



setInterval(runFunction, 45000)
// runFunction()
