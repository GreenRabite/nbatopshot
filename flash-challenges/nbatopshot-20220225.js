// https://data.nba.net/10s/prod/v1/20220103/0022100552_boxscore.json

const axios = require('axios').default;
const _ = require('lodash')
const fs = require('fs')
const BB = require("bluebird");
const snoowrap = require('snoowrap');
require('dotenv').config();

const DATE_1 = '20220225'
const DATE_2 = '20220226'
const DATE_3 = '20220227'

const FRIDAY_IDS = [
  [DATE_1, '0022100896'],
  [DATE_1, '0022100897'],
  [DATE_1, '0022100898'],
  [DATE_1, '0022100899'],
  [DATE_1, '0022100900'],
  [DATE_1, '0022100901'],
  [DATE_1, '0022100902'],
  [DATE_1, '0022100903'],
  [DATE_1, '0022100904'],
]

const SATURDAY_IDS = [
  [DATE_2, '0022100905'],
  [DATE_2, '0022100906'],
  [DATE_2, '0022100907'],
  [DATE_2, '0022100908'],
  [DATE_2, '0022100909'],
  [DATE_2, '0022100910'],
  [DATE_2, '0022100911'],
]

const SUNDAY_IDS = [
  [DATE_3,'0022100912'],
  [DATE_3,'0022100913'],
  [DATE_3,'0022100914'],
  [DATE_3,'0022100915'],
  [DATE_3,'0022100916'],
  [DATE_3,'0022100917'],
  [DATE_3,'0022100918'],
  [DATE_3,'0022100919'],
]

const COMMENT_ID = 'hyfu1ca'
const genUrls = (date_and_ids) => date_and_ids.map(date_and_id => `https://data.nba.net/10s/prod/v1/${date_and_id[0]}/${date_and_id[1]}_boxscore.json`);

const FRIDAY_URLS = genUrls(FRIDAY_IDS)
const SATURDAY_URLS = genUrls(SATURDAY_IDS)
const SUNDAY_URLS = genUrls(SUNDAY_IDS)


const zeroPad = (num, places) => String(num).padStart(places, '0')

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
      steals: Number(player.steals),
      fga: Number(player.fga),
      ftm: Number(player.ftm),
      tpm: Number(player.tpm),
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

  return `[Q${period}: ${zeroPad(minutes,2)}:${zeroPad(seconds,2)}]`
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
  const {results:saturdayResults, remainingGames: saturdayRemainingGames} = await fetchGameResults(SATURDAY_URLS)
  const {results:sundayResults, remainingGames: sundayRemainingGames} = await fetchGameResults(SUNDAY_URLS)

  const fridayPlayers = fridayResults.flat().filter(player => player.name != 'Isaiah Jackson');
  const fridayStealsLeaders = sortPlayersByAttribute(_.clone(fridayPlayers), 'steals')
  const fridayBlocksLeaders = sortPlayersByAttribute(_.clone(fridayPlayers), 'blks')
  const friday3pmLeaders = sortPlayersByAttribute(_.clone(fridayPlayers), 'tpm')

  const saturdayPlayers = saturdayResults.flat();
  const saturdayStealsLeaders = sortPlayersByAttribute(_.clone(saturdayPlayers), 'steals')
  const saturdayBlocksLeaders = sortPlayersByAttribute(_.clone(saturdayPlayers), 'blks')
  const saturday3pmLeaders = sortPlayersByAttribute(_.clone(saturdayPlayers), 'tpm')

  const sundayPlayers = sundayResults.flat();
  const sundayStealsLeaders = sortPlayersByAttribute(_.clone(sundayPlayers), 'steals')
  const sundayBlocksLeaders = sortPlayersByAttribute(_.clone(sundayPlayers), 'blks')
  const sunday3pmLeaders = sortPlayersByAttribute(_.clone(sundayPlayers), 'tpm')

  const r = new snoowrap({
    userAgent: 'KobeBot',
    clientId: process.env.REDDIT_CLIENT_ID,
    clientSecret: process.env.REDDIT_SECRET_ID,
    refreshToken: process.env.REDDIT_REFRESH_TOKEN,
  });

  const markdown = [
    `# Drain and Defend`,
    `## Friday Leaders`,
    `### Steals Leaders`,
    ...standingsByAttribute(fridayStealsLeaders, 'steals'),
    `### Blocks Leaders`,
    ...standingsByAttribute(fridayBlocksLeaders, 'blks'),
    `### 3PM Leaders`,
    ...standingsByAttribute(friday3pmLeaders, 'tpm'),
    `There are ${fridayRemainingGames} Friday games that have not started yet.`,
    `## Saturday Leaders`,
    `### Steals Leaders`,
    ...standingsByAttribute(saturdayStealsLeaders, 'steals'),
    `### Blocks Leaders`,
    ...standingsByAttribute(saturdayBlocksLeaders, 'blks'),
    `### 3PM Leaders`,
    ...standingsByAttribute(saturday3pmLeaders, 'tpm'),
    `There are ${saturdayRemainingGames} Saturday games that have not started yet.`,
    `## Sunday Leaders`,
    `### Steals Leaders`,
    ...standingsByAttribute(sundayStealsLeaders, 'steals'),
    `### Blocks Leaders`,
    ...standingsByAttribute(sundayBlocksLeaders, 'blks'),
    `### 3PM Leaders`,
    ...standingsByAttribute(sunday3pmLeaders, 'tpm'),
    `There are ${sundayRemainingGames} Sunday games that have not started yet.`,
    `**Update: ${new Date().toLocaleString()} PST**`,
    `**Bolded players** are done for the challenge`,
    `[Numbers] in bracket show time left in regulation for the game`,
    `Tiebreakers: Team Margin / Player's ± / Minutes Played`,
  ].join("\n\n")

  console.clear()
  console.log(markdown)

  r.getComment(COMMENT_ID).edit(markdown)

}



setInterval(runFunction, 45000)
// runFunction()
