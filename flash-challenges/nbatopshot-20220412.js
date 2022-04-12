const apiServices = require('../api/apiServices')
const sortServices = require('../api/sortServices')
const standingsServices = require('../api/standingsServices')
const statsServices = require('../api/statsServices')
const timeServices = require('../api/timeServices')
const playByPlayServices = require('../api/playByPlayServices')
const markdownServices = require('../api/markdownServices')
const _ = require('lodash')

const DATE_1 = "20220412"

const TUESDAY_IDS = [ 
  '0052100101',
  '0052100121' 
]

// const SATURDAY_IDS = [ 
//  '0022101214',
//  '0022101213',
//  '0022101215',
//  '0022101212',
// ]

// const SUNDAY_IDS = [
//   '0022101216',
//   '0022101217',
//   '0022101218',
//   '0022101221',
//   '0022101223',
//   '0022101226',
//   '0022101227',
//   '0022101228',
//   '0022101224',
//   '0022101219',
//   '0022101220',
//   '0022101222',
//   '0022101225',
//   '0022101229',
//   '0022101230',
// ]

const COMMENT_ID = 'i4hmzkx'

const runFunction = async () => {
  const { redditBot, fetchGameResults, fetchTeamResults, fetchTeamStatsResults, fetchPlayByPlays } = apiServices;
  const { sortPlayersByAttribute, filterPlayersByThreshold, onGoingLeaders, sortTeamsByAttribute } = sortServices;
  const { standingsByAttribute, standingsByTeamAttribute } = standingsServices;
  const { firstToStat, lastMadeShot, firstMadeShot } = playByPlayServices;
  const { renderLastShot, renderFirstShot } = markdownServices;

  const TUESDAY_URLS = apiServices.generateBoxScoreUrls(TUESDAY_IDS,DATE_1);
  // const SATURDAY_BOXSCORE_URLS = apiServices.generateBoxScoreUrls(SATURDAY_IDS, DATE_2);
  // const SUNDAY_BOXSCORE_URLS = apiServices.generateBoxScoreUrls(SUNDAY_IDS, DATE_3);

  const {results:tuesdayResults, remainingGames: tuesdayRemainingGames} = await fetchTeamResults(TUESDAY_URLS, {type: 'combined'})
  // const {results:saturdayResults, remainingGames: saturdayRemainingGames} = await fetchTeamResults(SATURDAY_BOXSCORE_URLS, {type: 'combined'})
  // const {results:sundayResults, remainingGames: sundayRemainingGames} = await fetchTeamResults(SUNDAY_BOXSCORE_URLS, {type: 'combined'})

  const tuesdaySortedTeamPlayers = tuesdayResults.map(teamPlayers => sortPlayersByAttribute(_.clone(teamPlayers), 'points'))

  const allTeams = [...tuesdaySortedTeamPlayers]
  const teamDisplay = allTeams.map(sortTeam => {
    return [
      `**${sortTeam[0].teams}**`,
      standingsByAttribute(sortTeam, 'points', {dividers:[2], limit: 5}).join('\n\n')
    ].join('\n\n')
  })

  const markdown = [
    `# Earn Your Spot Flash Challenge`,
    `## Most Points`,
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

setInterval(runFunction, 30000)
// runFunction()