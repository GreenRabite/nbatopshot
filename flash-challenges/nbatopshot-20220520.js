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
// const DATE_2 = '20220518'
// const DATE_3 = '20220519'

const FRIDAY_IDS = [
  '0042100312',
]

// const WEDNESDAY_IDS = [
//   '0042100311',
// ]

// const THURSDAY_IDS = [
//   '0042100302',
// ]

const COMMENT_ID = 'i9e8zk3'

const runFunction = async () => {
  const { redditBot, fetchGameResults, fetchTeamResults, fetchPlayByPlays } = apiServices;
  const { sortPlayersByAttribute, filterPlayersByThreshold, onGoingLeaders } = sortServices;
  const { firstToStat, lastMadeShot, firstMadeShot } = playByPlayServices;
  const { standingsByAttribute } = standingsServices;
  const { renderLastShot, renderFirstShot, renderFirstToStat } = markdownServices;
  const { fetchStartingLineup } = fetchStartersService;

  const FRIDAY_URLS = apiServices.generateBoxScoreUrls(FRIDAY_IDS, DATE_1);
  // const WEDNESDAY_URLS = apiServices.generateBoxScoreUrls(WEDNESDAY_IDS, DATE_2);
  // const THURSDAY_URLS = apiServices.generateBoxScoreUrls(THURSDAY_IDS, DATE_3);

  const {results:fridayResults, remainingGames: fridayRemainingGames} = await fetchTeamResults(FRIDAY_URLS, {type: 'combined'})
  // const {results:wednesdayResults, remainingGames: wednesdayRemainingGames} = await fetchTeamResults(WEDNESDAY_URLS, {type: 'combined'})
  // const {results:thursdayResults, remainingGames: thursdayRemainingGames} = await fetchTeamResults(THURSDAY_URLS, {type: 'combined'})

  const fridayTpmSorted = fridayResults.map(teamPlayers => sortPlayersByAttribute(_.clone(teamPlayers), 'tpm'))
  // const wednesdaySorted = wednesdayResults.map(teamPlayers => sortPlayersByAttribute(_.clone(teamPlayers), 'blkStls'))
  // const thursdaySorted = thursdayResults.map(teamPlayers => sortPlayersByAttribute(_.clone(teamPlayers), 'assists'))

  const gswVsDal = [...fridayTpmSorted]
  const miaVsBos = []
  
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
    'No Games have started yet',
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