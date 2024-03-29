const apiServices = require('../api/apiServices')
const sortServices = require('../api/sortServices')
const standingsServices = require('../api/standingsServices')
const statsServices = require('../api/statsServices')
const timeServices = require('../api/timeServices')
const playByPlayServices = require('../api/playByPlayServices')
const markdownServices = require('../api/markdownServices')
const fetchStartersService = require('../helpers/fetchStartingLineupLog.js')
const _ = require('lodash')

const DATE_1 = '20220520'
const DATE_2 = '20220521'
const DATE_3 = '20220522'
const DATE_4 = '20220523'
const DATE_5 = '20220524'

const FRIDAY_IDS = [
  // DAL-GSW
  '0042100312',
]

const SATURDAY_IDS = [
  // MIA-BOS
  '0042100303',
]

const SUNDAY_IDS = [
  // DAL-GSW
  '0042100313',
]

const MONDAY_IDS = [
  // MIA-BOS
  '0042100304',
]

const TUESDAY_IDS = [
  // DAL-GSW
  '0042100314',
]

const COMMENT_ID = 'i9e8zk3'

const runFunction = async () => {
  const { redditBot, fetchGameResults, fetchTeamResults, fetchPlayByPlays } = apiServices;
  const { sortPlayersByAttribute, filterPlayersByThreshold, onGoingLeaders } = sortServices;
  const { firstToStat, lastMadeShot, firstMadeShot } = playByPlayServices;
  const { standingsByAttribute } = standingsServices;
  const { renderLastShot, renderFirstShot, renderFirstToStat } = markdownServices;

  const FRIDAY_URLS = apiServices.generateBoxScoreUrls(FRIDAY_IDS, DATE_1);
  const SATURDAY_URLS = apiServices.generateBoxScoreUrls(SATURDAY_IDS, DATE_2);
  const SUNDAY_URLS = apiServices.generateBoxScoreUrls(SUNDAY_IDS, DATE_3);
  const MONDAY_URLS = apiServices.generateBoxScoreUrls(MONDAY_IDS, DATE_4);
  const TUESDAY_URLS = apiServices.generateBoxScoreUrls(TUESDAY_IDS, DATE_5);

  const {results:fridayResults, remainingGames: fridayRemainingGames} = await fetchTeamResults(FRIDAY_URLS, {type: 'combined'})
  const {results:saturdayResults, remainingGames: saturdayRemainingGames} = await fetchTeamResults(SATURDAY_URLS, {type: 'combined'})
  const {results:sundayResults, remainingGames: sundayRemainingGames} = await fetchTeamResults(SUNDAY_URLS, {type: 'combined'})
  const {results:mondayResults, remainingGames: mondayRemainingGames} = await fetchTeamResults(MONDAY_URLS, {type: 'combined'})
  const {results:tuesdayResults, remainingGames: tuesdayRemainingGames} = await fetchTeamResults(TUESDAY_URLS, {type: 'combined'})

  const fridayTpmSorted = fridayResults.map(teamPlayers => sortPlayersByAttribute(_.clone(teamPlayers), 'tpm', {customSort: ['points', 'plusMinus', 'secondsPlayed']}))
  const saturdayDefenderSorted = saturdayResults.map(teamPlayers => sortPlayersByAttribute(_.clone(teamPlayers), 'blkStls', {customSort: ['points', 'plusMinus', 'secondsPlayed']}))
  const sundayTpmSorted = sundayResults.map(teamPlayers => sortPlayersByAttribute(_.clone(teamPlayers), 'tpm', {customSort: ['points', 'plusMinus', 'secondsPlayed']}))
  const mondayDefenderSorted = mondayResults.map(teamPlayers => sortPlayersByAttribute(_.clone(teamPlayers), 'blkStls', {customSort: ['points', 'plusMinus', 'secondsPlayed']}))
  const tuesdayTpmSorted = tuesdayResults.map(teamPlayers => sortPlayersByAttribute(_.clone(teamPlayers), 'tpm', {customSort: ['points', 'plusMinus', 'secondsPlayed']}))

  const gswVsDal = [...fridayTpmSorted, ...sundayTpmSorted, ...tuesdayTpmSorted]
  const miaVsBos = [...saturdayDefenderSorted, ...mondayDefenderSorted]
  
  const gswVsDalDisplay = gswVsDal.map(sortTeam => {
    return [
      `**${sortTeam[0].teams}**`,
      standingsByAttribute(sortTeam, 'tpm', {dividers:[2], limit: 5}).join('\n\n')
    ].join('\n\n')
  })

  const miaVsBosDisplay = miaVsBos.map(sortTeam => {
    return [
      `**${sortTeam[0].teams}**`,
      standingsByAttribute(sortTeam, 'blkStls', {dividers:[2], limit: 5}).join('\n\n')
    ].join('\n\n')
  })

  const markdown = [
    `# 🏀 Crowd Control Flash Challenge`,
    `## ⭐️ Crowd Control Leaders (Rookie/Vet)`,
    `### Marksman (tpm)`,
    ...gswVsDalDisplay,
    `### Defender (blocks + steals)`,
    ...miaVsBosDisplay,
    `There are ${sundayRemainingGames} games that have not started yet.`,
    `**Update: ${new Date().toLocaleString("en-US", {timeZone: "America/Los_Angeles"})} PST**`,
    `**Bolded players** are done for the challenge`,
    `[Numbers] in bracket show time left in regulation for the game`,
    `Tiebreakers: Points Scored / Player's ± / Minutes Played`,
  ].join("\n\n")

  console.clear()
  console.log(markdown)

  redditBot.getComment(COMMENT_ID).edit(markdown)

}

setInterval(runFunction, 30000)
// runFunction()