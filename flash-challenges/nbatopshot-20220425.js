const apiServices = require('../api/apiServices')
const sortServices = require('../api/sortServices')
const standingsServices = require('../api/standingsServices')
const statsServices = require('../api/statsServices')
const timeServices = require('../api/timeServices')
const _ = require('lodash')
const exec = require('child_process').exec;
const file = require('./nbatopshot-playoffs-first-round-20220417.js')

const DATE_1 = '20220425'

const MONDAY_IDS = [
  '0042100114',
  '0042100135',
  '0042100175'
]

const COMMENT_ID = 'i66xiyx'

const runFunction = async () => {
  const { redditBot, fetchGameResults, fetchTeamResults } = apiServices;
  const { sortPlayersByAttribute, filterPlayersByThreshold, onGoingLeaders } = sortServices;
  const { standingsByAttribute } = standingsServices;

  const MONDAY_URLS = apiServices.generateBoxScoreUrls(MONDAY_IDS, DATE_1);

  const {results:mondayResults, remainingGames: mondayRemainingGames} = await fetchGameResults(MONDAY_URLS)

  const players = mondayResults.flat()
  const sortedPlayers = sortPlayersByAttribute(_.clone(players), 'points');
  const finishedPlayers = filterPlayersByThreshold(_.clone(sortedPlayers), 'points', 25)

  const onGoingSorted = sortPlayersByAttribute(_.clone(sortedPlayers.filter(player => player.points < 25 && !player.gameOver)), 'points');

  const markdown = [
    `# 🏀 Lean On Me Flash Challenge`,
    `## ⭐️ Lean On Me Leaders - Points (Rookie)`,
    `### 25+ Scorers`,
    ...standingsByAttribute(finishedPlayers, 'points', {hasThreshold: false, hasDividers: false, showTeams: true} ),
    `### Ongoing Players`,
    ...standingsByAttribute(onGoingSorted, 'specialMsg', {limit: 5} ),
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