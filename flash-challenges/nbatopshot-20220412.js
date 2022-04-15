const apiServices = require('../api/apiServices')
const sortServices = require('../api/sortServices')
const standingsServices = require('../api/standingsServices')
const statsServices = require('../api/statsServices')
const timeServices = require('../api/timeServices')
const playByPlayServices = require('../api/playByPlayServices')
const markdownServices = require('../api/markdownServices')
const _ = require('lodash')

const DATE_1 = "20220412"
const DATE_2 = "20220413"
const DATE_3 = "20220415"

const TUESDAY_IDS = [ 
  '0052100101',
  '0052100121' 
]

const WEDNESDAY_IDS = [ 
 '0052100111',
 '0052100131',
]

const FRIDAY_IDS = [
  '0052100201',
  '0052100211' 
]

const COMMENT_ID = 'i4hmzkx'

const runFunction = async () => {
  const { redditBot, fetchGameResults, fetchTeamResults, fetchTeamStatsResults, fetchPlayByPlays } = apiServices;
  const { sortPlayersByAttribute, filterPlayersByThreshold, onGoingLeaders, sortTeamsByAttribute } = sortServices;
  const { standingsByAttribute, standingsByTeamAttribute } = standingsServices;
  const { firstToStat, lastMadeShot, firstMadeShot } = playByPlayServices;
  const { renderLastShot, renderFirstShot } = markdownServices;

  const TUESDAY_URLS = apiServices.generateBoxScoreUrls(TUESDAY_IDS,DATE_1);
  const WEDNESDAY_URLS = apiServices.generateBoxScoreUrls(WEDNESDAY_IDS, DATE_2);
  const FRIDAY_URLS = apiServices.generateBoxScoreUrls(FRIDAY_IDS, DATE_3);

  const {results:tuesdayResults, remainingGames: tuesdayRemainingGames} = await fetchTeamResults(TUESDAY_URLS, {type: 'combined'})
  const {results:wednesdayResults, remainingGames: wednesdayRemainingGames} = await fetchTeamResults(WEDNESDAY_URLS, {type: 'combined'})
  const {results:fridayResults, remainingGames: fridayRemainingGames} = await fetchTeamResults(FRIDAY_URLS, {type: 'combined'})

  const tuesdaySortedTeamPlayers = tuesdayResults.map(teamPlayers => sortPlayersByAttribute(_.clone(teamPlayers), 'points'))
  const wednesdaySortedTeamPlayers = wednesdayResults.map(teamPlayers => sortPlayersByAttribute(_.clone(teamPlayers), 'points'))
  const fridaySortedTeamPlayers = fridayResults.map(teamPlayers => sortPlayersByAttribute(_.clone(teamPlayers), 'points'))

  const allTeams = [...tuesdaySortedTeamPlayers, ...wednesdaySortedTeamPlayers, ...fridaySortedTeamPlayers]
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
    `There are ${fridayRemainingGames} games that have not started yet.`,
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