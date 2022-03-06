// https://data.nba.net/10s/prod/v1/20220103/0022100552_boxscore.json

const axios = require('axios').default;
const _ = require('lodash')
const fs = require('fs')
const BB = require("bluebird");
const snoowrap = require('snoowrap');
require('dotenv').config();

const DATE_1 = '20220304'
const DATE_2 = '20220305'
const DATE_3 = '20220306'

const FRIDAY_IDS = [
  [DATE_1, '0022100458'],
  [DATE_1, '0022100951'],
  [DATE_1, '0022100946'],
  [DATE_1, '0022100949'],
  [DATE_1, '0022100947'],
  [DATE_1, '0022100948'],
  [DATE_1, '0022100950'],
  [DATE_1, '0022100952'],
  [DATE_1, '0022100953'],
]

const SATURDAY_IDS = [
  [DATE_2, '0022100954'],
  [DATE_2, '0022100955'],
  [DATE_2, '0022100956'],
  [DATE_2, '0022100957'],
  [DATE_2, '0022100958'],
  [DATE_2, '0022100959'],
]

const SUNDAY_IDS = [
  [DATE_3,'0022100960'],
  [DATE_3,'0022100961'],
  [DATE_3,'0022100963'],
  [DATE_3,'0022100964'],
  [DATE_3,'0022100965'],
  [DATE_3,'0022100962'],
  [DATE_3,'0022100967'],
  [DATE_3,'0022100966'],
]

const COMMENT_ID = 'hze1dhp'
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
    const points = Number(player.points);
    const rebs = Number(player.totReb);
    const blks = Number(player.blocks);
    const steals = Number(player.steals);
    const assists = Number(player.assists);
    const tripleDoubleValues = [points,rebs, blks, steals, assists].sort((a,b) => b-a).slice(0,3)
    const doubleDoubleValues = [points,rebs, blks, steals, assists].sort((a,b) => b-a).slice(0,2)
    const isTripleDouble = tripleDoubleValues.every(number => number >= 10)
    const isDoubleDouble = !isTripleDouble && doubleDoubleValues.every(number => number >= 10)
    
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
      fgm: Number(player.fgm),
      fgmFtm: Number(player.ftm) + Number(player.fgm),
      teams: gameData.teams,
      team: gameData[player.teamId].code,
      gameOver: gameData.gameOver,
      teamMargin: gameData[player.teamId].margin,
      plusMinus: Number(player.plusMinus),
      secondsPlayed: calculateSeconds(player.min),
      timeLeft: gameData.timeLeft,
      isTripleDouble,
      isDoubleDouble,
      doubleDoublePoints: doubleDoubleValues.reduce((accum,curr) => accum + curr),
      tripleDoublePoints: tripleDoubleValues.reduce((accum,curr) => accum + curr),
      doubleDoubleOffTracker: doubleDoubleValues.reduce((accum,curr) => {
        if(curr > 10) return accum + 10;
        return accum + curr;
      }, 0)
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

const sortPlayersByTripleDouble = (players, string) => {
  let sort;
  if(string === 'td'){
    sort = 'tripleDoublePoints'
  }else if(string === 'dd'){
    sort = 'doubleDoublePoints'
  }
  
  return players.sort((a,b) => {
    
    if(a[sort] != b[sort]){
      return b[sort] - a[sort]
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
  })
}

const standingsByAttribute = (players, attribute) => {
  if(players.length === 0) return ['No Players Reached This Threshold']
  return players.map((player, idx) => {
    // const playerInfo = player.gameOver ? `* **${player.name}: ${player[attribute]}**` : `${player.name}: ${player[attribute]}`
    const playerInfo = player.gameOver ? `* **${player.name}: ${player[attribute]}**` : `${player.name}: ${player[attribute]}`

    // if(idx===0) return `${playerInfo} ${player.timeLeft}\n\n-------------------------`
    // if(idx >= 1 && player.gameOver) return undefined;
    return `${playerInfo} ${player.timeLeft}`
  }).filter(x => !!x)
}

const standingsByOngoingAttribute = (players, attribute) => {
  return players.map((player, idx) => {
    if(players.length === 0) return ['No Players Reached This Threshold']
    // const playerInfo = player.gameOver ? `* **${player.name}: ${player[attribute]}**` : `${player.name}: ${player[attribute]}`
    const playerInfo = `${player.name}: ${player.points}pts / ${player.rebs}rebs / ${player.assists}asts / ${player.blks}blks / ${player.steals}stls`

    // if(idx===0) return `${playerInfo} ${player.timeLeft}\n\n-------------------------`
    // if(idx >= 1 && player.gameOver) return undefined;
    return player.gameOver ? undefined : `${playerInfo} ${player.timeLeft}`
  }).filter(x => !!x).slice(0,4)
}

const standingsByTripleDoubles = (players) => {
  return players.map((player, idx) => {
    // const playerInfo = player.gameOver ? `* **${player.name}: ${player[attribute]}**` : `${player.name}: ${player[attribute]}`
    const stats = `${player.isTripleDouble ? 'td' : 'dd'} | [${player.teams}] | ${player.isTripleDouble ? player.tripleDoublePoints : player.doubleDoublePoints} tiebreaker points`;
    const playerInfo = player.gameOver ?  `* **${player.name}**: ${stats}` : `${player.name} ${stats}`;

    if(idx===9) return `${playerInfo}\n\n-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+`
    if(idx >= 10 && player.gameOver) return undefined;
    return  `${playerInfo}`
  }).filter(x => !!x).slice(0,15)
}



const runFunction = async () => {

  const {results:fridayResults, remainingGames: fridayRemainingGames} = await fetchGameResults(FRIDAY_URLS)
  const {results:saturdayResults, remainingGames: saturdayRemainingGames} = await fetchGameResults(SATURDAY_URLS)
  const {results:sundayResults, remainingGames: sundayRemainingGames} = await fetchGameResults(SUNDAY_URLS)

  const fridayPlayers = fridayResults.flat();
  const fridayTripleDoubleLeaders = sortPlayersByAttribute(_.clone(fridayPlayers.filter(player => player.isTripleDouble)), 'tripleDoublePoints')
  const fridayDoubleDoubleLeaders = sortPlayersByAttribute(_.clone(fridayPlayers.filter(player => player.isDoubleDouble)), 'doubleDoublePoints')
  const fridayOngoingLeaders = sortPlayersByAttribute(_.clone(fridayPlayers.filter(player => !player.isDoubleDouble && !player.isTripleDouble)), 'doubleDoubleOffTracker')

  
  const saturdayPlayers = saturdayResults.flat();
  const saturdayTripleDoubleLeaders = sortPlayersByAttribute(_.clone(saturdayPlayers.filter(player => player.isTripleDouble)), 'tripleDoublePoints')
  const saturdayDoubleDoubleLeaders = sortPlayersByAttribute(_.clone(saturdayPlayers.filter(player => player.isDoubleDouble)), 'doubleDoublePoints')
  const saturdayOngoingLeaders = sortPlayersByAttribute(_.clone(saturdayPlayers.filter(player => !player.isDoubleDouble && !player.isTripleDouble)), 'doubleDoubleOffTracker')

  const sundayPlayers = sundayResults.flat();
  const sundayTripleDoubleLeaders = sortPlayersByAttribute(_.clone(sundayPlayers.filter(player => player.isTripleDouble)), 'tripleDoublePoints')
  const sundayDoubleDoubleLeaders = sortPlayersByAttribute(_.clone(sundayPlayers.filter(player => player.isDoubleDouble)), 'doubleDoublePoints')
  const sundayOngoingLeaders = sortPlayersByAttribute(_.clone(sundayPlayers.filter(player => !player.isDoubleDouble && !player.isTripleDouble)), 'doubleDoubleOffTracker')

  const lebron = {
    name: 'LeBron James',
    teams: 'LAL-GSW',
    gameOver: true,
    isTripleDouble: false,
    isDoubleDouble: true,
    doubleDoublePoints: 66,
  }

  const tripleDoubles = [...fridayTripleDoubleLeaders, ...saturdayTripleDoubleLeaders, ...sundayTripleDoubleLeaders]
  const doubleDoubles = [lebron,...fridayDoubleDoubleLeaders, ...saturdayDoubleDoubleLeaders, ...sundayDoubleDoubleLeaders]

  const results = [
    ...sortPlayersByTripleDouble(tripleDoubles, 'td'),
    ...sortPlayersByTripleDouble(doubleDoubles, 'dd'),
  ]

  const r = new snoowrap({
    userAgent: 'KobeBot',
    clientId: process.env.REDDIT_CLIENT_ID,
    clientSecret: process.env.REDDIT_SECRET_ID,
    refreshToken: process.env.REDDIT_REFRESH_TOKEN,
  });

  const markdown = [
    `# Doubles`,
    `## Weekend Leader`,
    ...standingsByTripleDoubles(results),
    `## Sunday Leaders`,
    `### Sunday Triple Dubs`,
    ...standingsByAttribute(sundayTripleDoubleLeaders, 'tripleDoublePoints'),
    `### Sunday Double Dubs`,
    ...standingsByAttribute(sundayDoubleDoubleLeaders, 'doubleDoublePoints'),
    `### Sunday Ongoing Games`,
    ...standingsByOngoingAttribute(sundayOngoingLeaders, 'doubleDoublePoints'),
    `There are ${sundayRemainingGames} Saturday games that have not started yet.`,
    `**Update: ${new Date().toLocaleString("en-US", {timeZone: "America/Los_Angeles"})} PST**`,
    `**Bolded players** are done for the challenge`,
    `[Numbers] in bracket show time left in regulation for the game`,
    `_dd_ denotes Double Double / _td_ denotes Triple Double`,
    `Tiebreakers: TieBreaker Pts / Team Margin / Player's ± / Minutes Played`,
  ].join("\n\n")

  console.clear()
  console.log(markdown)

  r.getComment(COMMENT_ID).edit(markdown)

}



// setInterval(runFunction, 45000)
runFunction()
