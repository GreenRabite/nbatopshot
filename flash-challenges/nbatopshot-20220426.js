const apiServices = require('../api/apiServices')
const sortServices = require('../api/sortServices')
const standingsServices = require('../api/standingsServices')
const statsServices = require('../api/statsServices')
const timeServices = require('../api/timeServices')
const _ = require('lodash')
const exec = require('child_process').exec;
const file = require('./nbatopshot-playoffs-first-round-20220417.js')

const DATE_1 = '20220426'

const TUESDAY_IDS = [
  '0042100105',
  '0042100155',
  '0042100145'
]

const COMMENT_ID = 'i6bilhl'

const runFunction = async () => {
  const { redditBot, fetchGameResults, fetchTeamResults } = apiServices;
  const { sortPlayersByAttribute, filterPlayersByThreshold, onGoingLeaders } = sortServices;
  const { standingsByAttribute } = standingsServices;

  const TUESDAY_URLS = apiServices.generateBoxScoreUrls(TUESDAY_IDS, DATE_1);

  const {results:tuesdayResults, remainingGames: tuesdayRemainingGames} = await fetchGameResults(TUESDAY_URLS)

  const players = tuesdayResults.flat()
  const sortedPlayers = sortPlayersByAttribute(_.clone(players), 'tpm');
  const finishedPlayers = filterPlayersByThreshold(_.clone(sortedPlayers), 'tpm', 4)

  const onGoingSorted = sortPlayersByAttribute(_.clone(sortedPlayers.filter(player => player.tpm < 4 && !player.gameOver)), 'tpm');

  const markdown = [
    `# 🏀 Downtown Flash Challenge`,
    `## ⭐️ Downtown Leaders - Points (Rookie/Hero)`,
    `### 4+ Triples`,
    ...standingsByAttribute(finishedPlayers, 'tpm', {hasThreshold: false, hasDividers: false, showTeams: true} ),
    `### Ongoing Players`,
    ...standingsByAttribute(onGoingSorted, 'tpm', {limit: 5} ),
    `There are ${tuesdayRemainingGames} games that have not started yet.`,
    `**Update: ${new Date().toLocaleString("en-US", {timeZone: "America/Los_Angeles"})} PST**`,
    `**Bolded players** are done for the challenge`,
    `[Numbers] in bracket show time left in regulation for the game`,
    // `Tiebreakers: Points Scored / Player's ± / Minutes Played`,
  ].join("\n\n")

  console.clear()
  console.log(markdown)

  redditBot.getComment(COMMENT_ID).edit(markdown)

}

exec('./nbatopshot-playoffs-first-round-20220417.js')
setInterval(runFunction, 30000)
// runFunction()