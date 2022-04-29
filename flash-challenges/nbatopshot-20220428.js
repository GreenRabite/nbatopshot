const apiServices = require('../api/apiServices')
const sortServices = require('../api/sortServices')
const standingsServices = require('../api/standingsServices')
const statsServices = require('../api/statsServices')
const timeServices = require('../api/timeServices')
const _ = require('lodash')
const exec = require('child_process').exec;
const file = require('./nbatopshot-playoffs-first-round-20220417.js')

const DATE_1 = '20220428'
const DATE_2 = '20220429'

const THURSDAY_IDS = [
  '0042100136',
  '0042100146',
  '0042100176',
]

const FRIDAY_IDS = [
  '0042100156',
]

const COMMENT_ID = 'i6la5hv'

const runFunction = async () => {
  const { redditBot, fetchGameResults, fetchTeamResults } = apiServices;
  const { sortPlayersByAttribute, filterPlayersByThreshold, onGoingLeaders } = sortServices;
  const { standingsByAttribute } = standingsServices;

  const THURSDAY_URLS = apiServices.generateBoxScoreUrls(THURSDAY_IDS, DATE_1);
  const FRIDAY_URLS = apiServices.generateBoxScoreUrls(FRIDAY_IDS, DATE_2);

  const {results:thursdayResults, remainingGames: thursdayRemainingGames} = await fetchTeamResults(THURSDAY_URLS, {type: 'combined'})
  const {results:fridayResults, remainingGames: fridayRemainingGames} = await fetchTeamResults(FRIDAY_URLS, {type: 'combined'})

  const thursdaySorted = thursdayResults.map(teamPlayers => sortPlayersByAttribute(_.clone(teamPlayers), 'pointAst'))
  const fridaySorted = fridayResults.map(teamPlayers => sortPlayersByAttribute(_.clone(teamPlayers), 'pointAst'))

  const allPlayers = [...thursdaySorted, ...fridaySorted]

  const teamDisplay = allPlayers.map(sortTeam => {
    return [
      `**${sortTeam[0].teams}**`,
      standingsByAttribute(sortTeam, 'specialMsg', {dividers:[0], limit: 5}).join('\n\n')
    ].join('\n\n')
  })

  const markdown = [
    `# 🏀 You Get What You Give Flash Challenge`,
    `## ⭐️ You Get What You Give Leaders - Points/Ast`,
    ...teamDisplay,
    `There are ${fridayRemainingGames} games that have not started yet.`,
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