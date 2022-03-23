const apiServices = require('../api/apiServices')
const sortServices = require('../api/sortServices')
const standingsServices = require('../api/standingsServices')
const statsServices = require('../api/statsServices')
const timeServices = require('../api/timeServices')
const _ = require('lodash')

const DATE_1 = '20220323'

const WEDNESDAY_IDS = [
  '0022101046',
  '0022101047',
  '0022101048',
  '0022101049',
  '0022101050',
  '0022101051',
  '0022101052',
  '0022101053',
  '0022101054',
  '0022101055',
  '0022101056',
  '0022101057',
]

const COMMENT_ID = 'i1ulc8k'

const runFunction = async () => {
  const { redditBot, fetchGameResults, fetchTeamResults } = apiServices;
  const { sortPlayersByAttribute, filterPlayersByThreshold, onGoingLeaders } = sortServices;
  const { standingsByAttribute } = standingsServices;

  const WEDNESDAY_URLS = apiServices.generateBoxScoreUrls(WEDNESDAY_IDS, DATE_1);

  const {results:wednesdayResults, remainingGames: wednesdayRemainingGames} = await fetchGameResults(WEDNESDAY_URLS)
  const {results:wednesdayTeamResults, remainingGames: _wednesdayRemainingGames} = await fetchTeamResults(WEDNESDAY_URLS)

  const wednesdayPlayers = wednesdayResults.flat();
  const wednesdaySortedRookie = sortPlayersByAttribute(_.clone(wednesdayPlayers), 'points');

  const wednesdayTeamPlayers = wednesdayTeamResults.flat(1)
  const wednesdaySortedTeamPlayers = wednesdayTeamPlayers.map(teamPlayers => sortPlayersByAttribute(_.clone(teamPlayers), 'points'))

  // TODO: move to service
  const wednesdayTeamDisplay = wednesdaySortedTeamPlayers.map(sortTeam => {
    //TODO: add no players
    return [
      `**${sortTeam[0].ownTeam}**`,
      standingsByAttribute(sortTeam, 'points', {dividers:[0], limit: 3}).join('\n\n')
    ].join('\n\n')
  })

  const markdown = [
    `# Mayhem Flash Challenge`,
    `## Scoring Leaders (Rookie/Hero)`,
    ...standingsByAttribute(wednesdaySortedRookie, 'points', {dividers: [10]} ),
    `## Scoring Leaders (Vet)`,
    ...wednesdayTeamDisplay,
    `There are ${wednesdayRemainingGames} games that have not started yet.`,
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