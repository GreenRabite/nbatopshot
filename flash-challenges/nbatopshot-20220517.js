const apiServices = require('../api/apiServices')
const sortServices = require('../api/sortServices')
const standingsServices = require('../api/standingsServices')
const statsServices = require('../api/statsServices')
const timeServices = require('../api/timeServices')
const playByPlayServices = require('../api/playByPlayServices')
const markdownServices = require('../api/markdownServices')
const fetchStartersService = require('../helpers/fetchStartingLineupLog.js')
const _ = require('lodash')

const DATE_1 = '20220517'
// const DATE_2 = '20220507'
// const DATE_3 = '20220508'

const TUESDAY_IDS = [
  '0042100301',
]

// const SATURDAY_IDS = [
//   '0042100213',
//   '0042100233'
// ]

// const SUNDAY_IDS = [
//   '0042100224',
//   '0042100204',
// ]

const COMMENT_ID = 'i90330l'

const runFunction = async () => {
  const { redditBot, fetchGameResults, fetchTeamResults, fetchPlayByPlays } = apiServices;
  const { sortPlayersByAttribute, filterPlayersByThreshold, onGoingLeaders } = sortServices;
  const { firstToStat, lastMadeShot, firstMadeShot } = playByPlayServices;
  const { standingsByAttribute } = standingsServices;
  const { renderLastShot, renderFirstShot, renderFirstToStat } = markdownServices;
  const { fetchStartingLineup } = fetchStartersService;

  const TUESDAY_URLS = apiServices.generateBoxScoreUrls(TUESDAY_IDS, DATE_1);
  const TUESDAY_PLAY_URLS = apiServices.generatePlayByPlayUrls(TUESDAY_IDS);
  // const SATURDAY_URLS = apiServices.generateBoxScoreUrls(SATURDAY_IDS, DATE_2);
  // const SATURDAY_PLAY_URLS = apiServices.generatePlayByPlayUrls(SATURDAY_IDS);
  // const SUNDAY_URLS = apiServices.generateBoxScoreUrls(SUNDAY_IDS, DATE_3);
  // const SUNDAY_PLAY_URLS = apiServices.generatePlayByPlayUrls(SUNDAY_IDS);

  const {results:tuesdayResults, remainingGames: tuesdayRemainingGames} = await fetchTeamResults(TUESDAY_URLS, {type: 'combined'})
  const {results:tuesdayPlayResults, remainingGames: _x1} = await fetchPlayByPlays(TUESDAY_PLAY_URLS)
  // const {results:saturdayResults, remainingGames: saturdayRemainingGames} = await fetchTeamResults(SATURDAY_URLS, {type: 'combined'})
  // const {results:saturdayPlayResults, remainingGames: _x2} = await fetchPlayByPlays(SATURDAY_PLAY_URLS)
  // const {results:sundayResults, remainingGames: sundayRemainingGames} = await fetchTeamResults(SUNDAY_URLS, {type: 'combined'})
  // const {results:sundayPlayResults, remainingGames: _x3} = await fetchPlayByPlays(SUNDAY_PLAY_URLS)

  const tuesdaySorted = tuesdayResults.map(teamPlayers => sortPlayersByAttribute(_.clone(teamPlayers), 'assists'))
  const tuesdayHeroSorted = tuesdayResults.map(teamPlayers => sortPlayersByAttribute(_.clone(teamPlayers), 'points'))
  // const saturdaySorted = saturdayResults.map(teamPlayers => sortPlayersByAttribute(_.clone(teamPlayers), 'points'))
  // const saturdaySorted = saturdayResults.map(teamPlayers => sortPlayersByAttribute(_.clone(teamPlayers), 'points'))
  // const saturdayFilterSorted = saturdaySorted.map(teamPlayers => teamPlayers.filter(player => !SATURDAY_STARTING_LINEUP.includes(String(player.playerId))))
  // const sundaySorted = sundayResults.map(teamPlayers => sortPlayersByAttribute(_.clone(teamPlayers), 'points'))
  // const sundayFilterSorted = sundaySorted.map(teamPlayers => teamPlayers.filter(player => !startingLineups.includes(String(player.playerId))))

  const allTeamsSorted = [...tuesdaySorted]
  const allTeamsHeroSorted = [...tuesdayHeroSorted]
  
  const teamDisplay = allTeamsSorted.map(sortTeam => {
    return [
      `**${sortTeam[0].teams}**`,
      standingsByAttribute(sortTeam, 'assists', {dividers:[0], limit: 3}).join('\n\n')
    ].join('\n\n')
  })

  const heroTeamDisplay = allTeamsHeroSorted.map(sortTeam => {
    return [
      `**${sortTeam[0].teams}**`,
      standingsByAttribute(sortTeam, 'points', {dividers:[0], limit: 3}).join('\n\n')
    ].join('\n\n')
  })

  const allPlayResults = [...tuesdayPlayResults]
  
  const firstReachedResults = allPlayResults.map(result => {
    return firstToStat(result, 'rebs', 5)
  })

  const finalReachedResults = allPlayResults.map(result => {
    return lastMadeShot(result, 'tpm')
  })

  const firstReachedMarkdown = firstReachedResults.map(game => renderFirstToStat(game, {stat: 'rebs', target:5}))
  const finalReachedMarkdown = finalReachedResults.map(game => renderLastShot(game, {stat: 'tpm'}))

  const markdown = [
    `# 🏀 Come Together Flash Challenge`,
    `## ⭐️ Come Together Leaders`,
    `### Tuesday Challenges (Rookie)`,
    `### Assists`,
    ...teamDisplay,
    `### First to 5 Rebs`,
    ...firstReachedMarkdown,
    `### Last Made 3PM`,
    ...finalReachedMarkdown,
    `### Tuesday Challenges (Hero)`,
    ...heroTeamDisplay,
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