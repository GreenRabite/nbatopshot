const apiServices = require('../api/apiServices')
const sortServices = require('../api/sortServices')
const standingsServices = require('../api/standingsServices')
const statsServices = require('../api/statsServices')
const timeServices = require('../api/timeServices')
const _ = require('lodash')
const exec = require('child_process').exec;
const file = require('./nbatopshot-playoffs-first-round-20220417.js')

const DATE_1 = '20220418'

const MONDAY_IDS = [
  '0042100132',
  '0042100172',
  '0042100162' 
]

const COMMENT_ID = 'i59m04o'

const runFunction = async () => {
  const { redditBot, fetchGameResults, fetchTeamResults } = apiServices;
  const { sortPlayersByAttribute, filterPlayersByThreshold, onGoingLeaders } = sortServices;
  const { standingsByAttribute } = standingsServices;

  const MONDAY_URLS = apiServices.generateBoxScoreUrls(MONDAY_IDS, DATE_1);

  const {results:mondayResults, remainingGames: mondayRemainingGames} = await fetchTeamResults(MONDAY_URLS, {type: 'separate'})

  const mondayPlayers = mondayResults.flat(1);
  const mondaySorted = mondayPlayers.map(teamPlayers => sortPlayersByAttribute(_.clone(teamPlayers), 'assists', {customSort: ['points', 'plusMinus', 'secondsPlayed']}))

  const mondayTeamDisplay = mondaySorted.map(sortTeam => {
    return [
      `**${sortTeam[0].ownTeam}**`,
      standingsByAttribute(sortTeam, 'assists', {dividers:[0], limit: 3}).join('\n\n')
    ].join('\n\n')
  })

  const markdown = [
    `# Rise & Dime Flash Challenge`,
    `## Rise & Dime Leaders (Rookie/Hero)`,
    ...mondayTeamDisplay,
    `There are ${mondayRemainingGames} games that have not started yet.`,
    `**Update: ${new Date().toLocaleString("en-US", {timeZone: "America/Los_Angeles"})} PST**`,
    `**Bolded players** are done for the challenge`,
    `[Numbers] in bracket show time left in regulation for the game`,
    `Tiebreakers: Points Scored / Player's ± / Minutes Played`,
  ].join("\n\n")

  console.clear()
  console.log(markdown)

  redditBot.getComment(COMMENT_ID).edit(markdown)

}

exec('./nbatopshot-playoffs-first-round-20220417.js')
setInterval(runFunction, 30000)
// runFunction()