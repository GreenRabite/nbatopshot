const apiServices = require('../api/apiServices')
const sortServices = require('../api/sortServices')
const standingsServices = require('../api/standingsServices')
const statsServices = require('../api/statsServices')
const timeServices = require('../api/timeServices')
const playByPlayServices = require('../api/playByPlayServices')
const markdownServices = require('../api/markdownServices')
const fetchStartersService = require('../helpers/fetchStartingLineupLog.js')
const _ = require('lodash')
const exec = require('child_process').exec;
const file = require('./nbatopshot-playoffs-second-round-playoffs-20220502.js')

const DATE_1 = '20220509'
const DATE_2 = '20220510'
// const DATE_3 = '20220508'

const MONDAY_IDS = [
  '0042100214',
  '0042100234'
]

const TUESDAY_IDS = [
  '0042100205',
  '0042100225'
]

const COMMENT_ID = 'i7zdsdc'

const runFunction = async () => {
  const { redditBot, fetchGameResults, fetchTeamResults, fetchPlayByPlays } = apiServices;
  const { sortPlayersByAttribute, filterPlayersByThreshold, onGoingLeaders } = sortServices;
  const { firstToStat, lastMadeShot, firstMadeShot } = playByPlayServices;
  const { standingsByAttribute } = standingsServices;
  const { renderLastShot, renderFirstShot, renderFirstToStat } = markdownServices;
  const { fetchStartingLineup } = fetchStartersService;

  const MONDAY_URLS = apiServices.generateBoxScoreUrls(MONDAY_IDS, DATE_1);
  const TUESDAY_URLS = apiServices.generateBoxScoreUrls(TUESDAY_IDS, DATE_2);

  const startingLineups = await fetchStartingLineup()

  const {results:mondayResults, remainingGames: mondayRemainingGames} = await fetchTeamResults(MONDAY_URLS, {type: 'separate'})
  const {results:tuesdayResults, remainingGames: tuesdayRemainingGames} = await fetchTeamResults(TUESDAY_URLS, {type: 'separate'})

  const mondayPlayers = mondayResults.flat(1)
  const tuesdayPlayers = tuesdayResults.flat(1)
  
  const mondaySorted = mondayPlayers.map(teamPlayers => sortPlayersByAttribute(_.clone(teamPlayers), 'rebStlBlk'))
  const tuesdaySorted = tuesdayPlayers.map(teamPlayers => sortPlayersByAttribute(_.clone(teamPlayers), 'rebStlBlk'))
  
  const allTeamPlayers = [...mondaySorted, ...tuesdaySorted]

  const teamDisplay = allTeamPlayers.map(sortTeam => {
    return [
      `**${sortTeam[0].ownTeam}**`,
      standingsByAttribute(sortTeam, 'rebStlBlk', {dividers:[0], limit: 3}).join('\n\n')
    ].join('\n\n')
  })


  const markdown = [
    `# 🏀 Welcome to the Jungle Flash Challenge`,
    `## ⭐️ Welcome to the Jungle Leaders`,
    `### Reb + Steals + Blks Leaders`,
    ...teamDisplay,
    `There are ${tuesdayRemainingGames} games that have not started yet.`,
    `**Update: ${new Date().toLocaleString("en-US", {timeZone: "America/Los_Angeles"})} PST**`,
    `**Bolded players** are done for the challenge`,
    `[Numbers] in bracket show time left in regulation for the game`,
    `Tiebreakers: Team Margin / Player's ± / Minutes Played`,
  ].join("\n\n")

  console.clear()
  console.log(markdown)

  redditBot.getComment(COMMENT_ID).edit(markdown)

}

exec('./nbatopshot-playoffs-second-round-playoffs-20220502.js')
setInterval(runFunction, 30000)
// runFunction()