// https://data.nba.net/10s/prod/v1/20220103/0022100552_boxscore.json

const axios = require('axios').default;
const _ = require('lodash')
const fs = require('fs')
const BB = require("bluebird");
const snoowrap = require('snoowrap');
require('dotenv').config();

const DATE_1 = '20220311'
const DATE_2 = '20220312'
const DATE_3 = '20220313'

const FRIDAY_IDS = [
  [DATE_1, '0022100995'],
  [DATE_1, '0022100996'],
  [DATE_1, '0022100997'],
  [DATE_1, '0022100998'],
  [DATE_1, '0022100999'],
  [DATE_1, '0022101000'],
  [DATE_1, '0022101001'],
  [DATE_1, '0022101002'],
  [DATE_1, '0022101003'],
  [DATE_1, '0022101004'],
]

const SATURDAY_IDS = [
  [DATE_2, '0022101005'],
  [DATE_2, '0022101006'],
  [DATE_2, '0022101007'],
  [DATE_2, '0022101008'],
  [DATE_2, '0022101009'],
  [DATE_2, '0022101010'],
  [DATE_2, '0022101011'],
]

const SUNDAY_IDS = [
  [DATE_3, '0022101012'],
  [DATE_3, '0022101013'],
  [DATE_3, '0022101014'],
  [DATE_3, '0022101015'],
  [DATE_3, '0022101016'],
  [DATE_3, '0022101017'],
  [DATE_3, '0022101018'],
  [DATE_3, '0022101019'],
]

const COMMENT_ID = 'i0b0hi2'
const COMMENT_2_ID = 'i0b0fe5'
const genUrls = (date_and_ids) => date_and_ids.map(date_and_id => `https://data.nba.net/10s/prod/v1/${date_and_id[0]}/${date_and_id[1]}_boxscore.json`);

const FRIDAY_URLS = genUrls(FRIDAY_IDS)
const SATURDAY_URLS = genUrls(SATURDAY_IDS)

const zeroPad = (num, places) => String(num).padStart(places, '0')

const calculateSeconds = (time) => {
  if(!time) return 0;

  const timeArray = time.split(":");
  return Number(timeArray[0])*60 + Number(timeArray[1])
}

const formatStats = (players, gameData) => {
  return players.map(player => {
    const points = Number(player.points);
    const rebs = Number(player.totReb);
    const blks = Number(player.blocks);
    const steals = Number(player.steals);
    const assists = Number(player.assists);
    const fgm = Number(player.fgm);
    
    return {
      playerId: player.personId,
      name: `${player.firstName} ${player.lastName}`,
      points,
      rebs,
      blks,
      steals,
      fga: Number(player.fga),
      ftm: Number(player.ftm),
      tpm: Number(player.tpm),
      assists,
      fgm,
      fgmFtm: Number(player.ftm) + Number(player.fgm),
      teams: gameData.teams,
      team: gameData[player.teamId].code,
      gameOver: gameData.gameOver,
      teamMargin: gameData[player.teamId].margin,
      plusMinus: Number(player.plusMinus),
      secondsPlayed: calculateSeconds(player.min),
      timeLeft: gameData.timeLeft,
      stlBlks: steals + blks,
      rebAsts: rebs + assists,
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
  if(players.length === 0) return ['No games have started yet']
  return players.map((player, idx) => {
    const playerInfo = player.gameOver ? `* **${player.name}: ${player[attribute]}**` : `${player.name}: ${player[attribute]}`

    if(idx===2) return `${playerInfo} ${player.timeLeft}\n\n-------------------------`
    if(idx >= 3 && player.gameOver) return undefined;
    return `${playerInfo} ${player.timeLeft}`
  }).filter(x => !!x).slice(0,6)
}

const runFunction = async () => {

  const {results:fridayResults, remainingGames: fridayRemainingGames} = await fetchGameResults(FRIDAY_URLS)
  const {results:saturdayResults, remainingGames: saturdayRemainingGames} = await fetchGameResults(SATURDAY_URLS)
  const {results:sundayResults, remainingGames: sundayRemainingGames} = await fetchGameResults(SUNDAY_URLS)

  const fridayPlayers = fridayResults.flat();
  const saturdayPlayers = saturdayResults.flat();
  const fridayStealsAndBlockLeader = sortPlayersByAttribute(_.clone(fridayPlayers), 'stlBlks')
  const saturdayRebsAndAstLeader = sortPlayersByAttribute(_.clone(saturdayPlayers), 'rebAsts')
  const sundayScoringLeaders = sortPlayersByAttribute(_.clone(sundayPlayers), 'points')


  const r = new snoowrap({
    userAgent: 'KobeBot',
    clientId: process.env.REDDIT_CLIENT_ID,
    clientSecret: process.env.REDDIT_SECRET_ID,
    refreshToken: process.env.REDDIT_REFRESH_TOKEN,
  });

  const markdown = [
    `# Around The Bend Challenge`,
    `## Friday`,
    `### Steals and Blocks`,
    ...standingsByAttribute(fridayStealsAndBlockLeader, 'stlBlks'),
    `## Saturday`,
    `### Rebounds and Assists`,
    ...standingsByAttribute(saturdayRebsAndAstLeader, 'rebAsts'),
    `## Sunday`,
    `### Scoring Leaders`,
    ...standingsByAttribute(sundayScoringLeaders, 'points'),
    `There are ${sundayRemainingGames} Sunday games that have not started yet.`,
    `**Update: ${new Date().toLocaleString("en-US", {timeZone: "America/Los_Angeles"})} PST**`,
    `**Bolded players** are done for the challenge`,
    `[Numbers] in bracket show time left in regulation for the game`,
    `Tiebreakers: Team Margin / Player's ± / Minutes Played`,
  ].join("\n\n")

  console.clear()
  console.log(markdown)

  r.getComment(COMMENT_ID).edit(markdown)
  setTimeout(()=>{
    r.getComment(COMMENT_2_ID).edit(markdown)
  }, 15000)

}



setInterval(runFunction, 30000)
// runFunction()
