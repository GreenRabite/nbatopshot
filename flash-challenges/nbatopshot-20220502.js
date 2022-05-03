const apiServices = require('../api/apiServices')
const sortServices = require('../api/sortServices')
const standingsServices = require('../api/standingsServices')
const statsServices = require('../api/statsServices')
const timeServices = require('../api/timeServices')
const _ = require('lodash')
const exec = require('child_process').exec;
const file = require('./nbatopshot-playoffs-first-round-20220417.js')

const DATE_1 = '20220502'
// const DATE_2 = '20220427'

const MONDAY_IDS = [
  '0042100201',
  '0042100221'
]

// const WEDNESDAY_IDS = [
//   '0042100125',
//   '0042100165',
// ]

const COMMENT_ID = 'i73d4a1'

const runFunction = async () => {
  const { redditBot, fetchGameResults, fetchTeamResults } = apiServices;
  const { sortPlayersByAttribute, filterPlayersByThreshold, onGoingLeaders } = sortServices;
  const { standingsByAttribute } = standingsServices;

  const MONDAY_URLS = apiServices.generateBoxScoreUrls(MONDAY_IDS, DATE_1);
  // const WEDNESDAY_URLS = apiServices.generateBoxScoreUrls(WEDNESDAY_IDS, DATE_2);

  const {results:mondayResults, remainingGames: mondayRemainingGames} = await fetchGameResults(MONDAY_URLS)
  // const {results:wednesdayResults, remainingGames: wednesdayRemainingGames} = await fetchGameResults(WEDNESDAY_URLS)

  const mondayPlayers = mondayResults.flat()
  // const wednesdayPlayers = wednesdayResults.flat()
  const players = [...mondayPlayers]
  const sortedPlayers = sortPlayersByAttribute(_.clone(players), 'points');
  const finishedPlayers = sortedPlayers.filter(player => player.fiveCat)

  const onGoingSorted = sortPlayersByAttribute(_.clone(sortedPlayers.filter(player => !player.fiveCat && !player.gameOver)), 'offTracker');

  const markdown = [
    `# 🏀 It’s Gonna Be Me Flash Challenge`,
    `## ⭐️ It’s Gonna Be Me Leaders`,
    `### 1+ Points/Rebs/Asts/Blks/Steals`,
    ...standingsByAttribute(finishedPlayers, 'specialMsg2', {hasThreshold: false, hasDividers: false, showTeams: true} ),
    `### Ongoing Players`,
    ...standingsByAttribute(onGoingSorted, 'specialMsg', {limit: 8} ),
    `There are ${mondayRemainingGames} games that have not started yet.`,
    `**Update: ${new Date().toLocaleString("en-US", {timeZone: "America/Los_Angeles"})} PST**`,
    `**Bolded players** are done for the challenge`,
    `[Numbers] in bracket show time left in regulation for the game`,
    // `Tiebreakers: Points Scored / Player's ± / Minutes Played`,
  ].join("\n\n")

  console.clear()
  console.log(markdown)

  redditBot.getComment(COMMENT_ID).edit(markdown)

}

setInterval(runFunction, 30000)
// runFunction()