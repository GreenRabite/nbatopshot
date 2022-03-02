// https://data.nba.net/10s/prod/v1/20220103/0022100552_boxscore.json

const axios = require('axios').default;
const _ = require('lodash')
const fs = require('fs')
const BB = require("bluebird");
const cheerio = require('cheerio').default;
const snoowrap = require('snoowrap');
require('dotenv').config();

const DATE_1 = '20220301'

const TUESDAY_IDS = [
  [DATE_1, '0022100926'],
  [DATE_1, '0022100927'],
  [DATE_1, '0022100928'],
  [DATE_1, '0022100929'],
  [DATE_1, '0022100930'],
  [DATE_1, '0022100931'],
]

const COMMENT_ID = 'hyzhi8n'
const genUrls = (date_and_ids) => date_and_ids.map(date_and_id => `https://data.nba.net/10s/prod/v1/${date_and_id[0]}/${date_and_id[1]}_boxscore.json`);

const TUESDAY_URLS = genUrls(TUESDAY_IDS)

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

const formatTeamStats = (gameData) => {
  return [gameData.vTeam, gameData.hTeam]
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
          teamId: response.data.basicGameData.vTeam.teamId,
          margin: Number(response.data.basicGameData.vTeam.score) - Number(response.data.basicGameData.hTeam.score),
          assists: Number(response.data.stats.vTeam.totals.assists),
          points: Number(response.data.stats.vTeam.totals.points),
          timeLeft,
          gameOver
        }

        const hTeam = {
          code: response.data.basicGameData.hTeam.triCode,
          teamId: response.data.basicGameData.hTeam.teamId,
          margin: Number(response.data.basicGameData.hTeam.score) - Number(response.data.basicGameData.vTeam.score),
          assists: Number(response.data.stats.hTeam.totals.assists),
          points: Number(response.data.stats.hTeam.totals.points),
          timeLeft,
          gameOver
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

        // return formatStats(players, gameData)
        return formatTeamStats(gameData);
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

const fetchLineups = async () => {
  const TODAY_LINEUP = 'https://www.nba.com/players/todays-lineups'

  const results = {}

  await axios.get(TODAY_LINEUP)
    .then(response => {
      const $ = cheerio.load(response.data)
      const teams = $('[class^="my-5 LineupsSingle_Lineup"]')
      teams.each((index, team) => {
        team.lastChild.children.forEach(individualTeam => {
          const teamName = individualTeam.children[0].children[0].children[1].firstChild.data;
          const teamLink = individualTeam.children[0].attribs.href
          const teamId = teamLink.split('/')[teamLink.split('/').length - 1]
          const players = individualTeam.children.slice(2,7).map(player => {
            const playerLink = player.attribs.href;
            const playerName = player.firstChild.lastChild.firstChild.data
            const playerId = playerLink.split('/')[playerLink.split('/').length - 1]
            return {
              id: playerId,
              name: playerName,
            }
          })
    
          results[teamId] = {
            teamId,
            teamName,
            players
          }
        })
      })

      return results
    })

  return results;
}

const runFunction = async () => {

  const {results:tuesdayResults, remainingGames: tuesdayRemainingGames} = await fetchGameResults(TUESDAY_URLS)

  const tuesdayPlayers = tuesdayResults.flat().sort((a,b) => b.points - a.points);


  const players = await fetchLineups()
  

  const displayTeamStats = tuesdayPlayers.map((team, idx) => {
    const teamInfo = team.gameOver ? `* **${team.code}: ${team.points}** points` : `${team.code}: ${team.points} points`
    
    if(idx===0) return `${teamInfo} ${team.timeLeft}\n\n-------------------------`
    return `${teamInfo} ${team.timeLeft}`
  })

  const displayPlayers = () => {
    const teamId = tuesdayPlayers[0].teamId;
    const playerLineup = players[teamId]
    return playerLineup.players.map(player => `_${player.name}_`);
  }

  const r = new snoowrap({
    userAgent: 'KobeBot',
    clientId: process.env.REDDIT_CLIENT_ID,
    clientSecret: process.env.REDDIT_SECRET_ID,
    refreshToken: process.env.REDDIT_REFRESH_TOKEN,
  });

  const markdown = [
    `# Starting 5`,
    ...displayTeamStats,
    `**Current Leading Players**`,
    ...displayPlayers(),
    `**Update: ${new Date().toLocaleString()} PST**`,
    `**Bolded teams** are done for the challenge`,
    `[Numbers] in bracket show time left in regulation for the game`,
  ].join("\n\n")

  console.clear()
  console.log(markdown)

  r.getComment(COMMENT_ID).edit(markdown)

}



setInterval(runFunction, 45000)
// runFunction()
