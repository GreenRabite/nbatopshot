const apiServices = require('../api/apiServices')
const sortServices = require('../api/sortServices')
const standingsServices = require('../api/standingsServices')
const statsServices = require('../api/statsServices')
const timeServices = require('../api/timeServices')
const playByPlayServices = require('../api/playByPlayServices')
const markdownServices = require('../api/markdownServices')
const _ = require('lodash')
const exec = require('child_process').exec;
const file = require('./nbatopshot-playoffs-first-round-20220417.js')

const DATE_1 = '20220420'
const DATE_2 = '20220421'

const FRIDAY_IDS = [
  '0042100123',
  '0042100103',
  '0042100143'
]

const SATURDAY_IDS = [
  '0042100134',
  '0042100174',
  '0042100113',
  '0042100154',
 ]

const COMMENT_ID = 'i5tmz0y'

const runFunction = async () => {
  const { redditBot, fetchGameResults, fetchTeamResults, fetchTeamStatsResults, fetchPlayByPlays } = apiServices;
  const { sortPlayersByAttribute, filterPlayersByThreshold, onGoingLeaders, sortTeamsByAttribute } = sortServices;
  const { standingsByAttribute, standingsByTeamAttribute } = standingsServices;
  const { firstToStat, lastMadeShot, firstMadeShot } = playByPlayServices;
  const { renderLastShot, renderFirstShot } = markdownServices;

  const FRIDAY_URLS = apiServices.generatePlayByPlayUrls(FRIDAY_IDS);
  const SATURDAY_URLS = apiServices.generatePlayByPlayUrls(SATURDAY_IDS);

  const {results:fridayResults, remainingGames: fridayRemainingGames} = await fetchPlayByPlays(FRIDAY_URLS)
  const {results:saturdayResults, remainingGames: saturdayRemainingGames} = await fetchPlayByPlays(SATURDAY_URLS)

  const allPlayers = [...fridayResults, ...saturdayResults]
  const lastMadeResults = allPlayers.map(result => {
    return lastMadeShot(result, 'fgm')
  })

  const lastMadeMarkdown = lastMadeResults.map(game => renderLastShot(game, {stat: 'fgm', showOnlyPlayer: false}))?.filter(x=>x?.length)

  const markdown = [
    `# 🏀 Closing Time Flash Challenge`,
    `## ⭐️ Closing Time Leaders - Rebs (Rookie/Hero)`,
    ...lastMadeMarkdown,
    `There are ${fridayRemainingGames} games that have not started yet.`,
    `**Update: ${new Date().toLocaleString("en-US", {timeZone: "America/Los_Angeles"})} PST**`,
    // `**Bolded players** are done for the challenge`,
    // `[Numbers] in bracket show time left in regulation for the game`,
    // `Tiebreakers: Points Scored / Player's ± / Minutes Played`,
  ].join("\n\n")

  console.clear()
  console.log(markdown)

  redditBot.getComment(COMMENT_ID).edit(markdown)
}

exec('./nbatopshot-playoffs-first-round-20220417.js')
setInterval(runFunction, 30000)
// runFunction()