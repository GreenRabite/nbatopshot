const apiServices = require('../api/apiServices')
const sortServices = require('../api/sortServices')
const standingsServices = require('../api/standingsServices')
const statsServices = require('../api/statsServices')
const timeServices = require('../api/timeServices')
const playByPlayServices = require('../api/playByPlayServices')
const markdownServices = require('../api/markdownServices')
const _ = require('lodash')

const THURSDAY_IDS = [
  '0022101196',
  '0022101197',
  '0022101198',
  '0022101199',
  '0022101200',
  '0022101201',
  '0022101202'
]

const COMMENT_ID = 'i3tfo7g'

const runFunction = async () => {
  const { redditBot, fetchGameResults, fetchTeamResults, fetchTeamStatsResults, fetchPlayByPlays } = apiServices;
  const { sortPlayersByAttribute, filterPlayersByThreshold, onGoingLeaders, sortTeamsByAttribute } = sortServices;
  const { standingsByAttribute, standingsByTeamAttribute } = standingsServices;
  const { firstToStat, lastMadeShot, firstMadeShot } = playByPlayServices;
  const { renderLastShot, renderFirstShot } = markdownServices;

  const THURSDAY_URLS = apiServices.generatePlayByPlayUrls(THURSDAY_IDS);

  const {results:thursdayResults, remainingGames: thursdayRemainingGames} = await fetchPlayByPlays(THURSDAY_URLS)

  const firstMadeResults = thursdayResults.map(result => {
    return firstMadeShot(result, 'fgm')
  })

  const lastMadeResults = thursdayResults.map(result => {
    return lastMadeShot(result, 'fgm')
  })

  const firstMadeMarkdown = firstMadeResults.map(game => renderFirstShot(game, {stat: 'fgm', showOnlyPlayer: true}))?.filter(x=>x?.length)
  const lastMadeMarkdown = lastMadeResults.map(game => renderLastShot(game, {stat: 'fgm', showOnlyPlayer: true}))?.filter(x=>x?.length)

  const markdown = [
    `# Starter and Finisher Flash Challenge`,
    `## Starter and Finisher Leaders (Vert)`,
    `### First Made Shots`,
    ...firstMadeMarkdown,
    `### Last Made Shots`,
    ...lastMadeMarkdown,
    `There are ${thursdayRemainingGames} games that have not started yet.`,
    `**Update: ${new Date().toLocaleString("en-US", {timeZone: "America/Los_Angeles"})} PST**`,
    // `**Bolded players** are done for the challenge`,
    // `[Numbers] in bracket show time left in regulation for the game`,
    // `Tiebreakers: Team Margin / Player's ± / Minutes Played`,
  ].join("\n\n")

  console.clear()
  console.log(markdown)

  redditBot.getComment(COMMENT_ID).edit(markdown)

}

// setInterval(runFunction, 30000)
runFunction()