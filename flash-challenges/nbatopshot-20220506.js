const apiServices = require('../api/apiServices')
const sortServices = require('../api/sortServices')
const standingsServices = require('../api/standingsServices')
const statsServices = require('../api/statsServices')
const timeServices = require('../api/timeServices')
const playByPlayServices = require('../api/playByPlayServices')
const markdownServices = require('../api/markdownServices')
const _ = require('lodash')
const exec = require('child_process').exec;
const file = require('./nbatopshot-playoffs-second-round-playoffs-20220502.js')

const DATE_1 = '20220506'
const DATE_2 = '20220507'
// const DATE_3 = '20220504'

const FRIDAY_IDS = [
  '0042100223',
  '0042100203'
]

const SATURDAY_IDS = [
  '0042100213',
  '0042100233'
]

// const WEDNESDAY_IDS = [
//   '0042100202',
//   '0042100222',
// ]

const FRIDAY_STARTING_LINEUP = [
  '101108',  '200768',  '200782',
  '201935',  '201980',  '202699',
  '202710',  '203109',  '203493',
  '203939',  '203954',  '1626164',
  '1627827', '1628389', '1628969',
  '1628973', '1629028', '1629029',
  '1629622', '1630178'
]

const SATURDAY_STARTING_LINEUP = [
  '201143',  '201572',  '201939',
  '201950',  '202083',  '202691',
  '203110',  '203507',  '203935',
  '203952',  '1627759', '1628369',
  '1628960', '1628991', '1629057',
  '1629630', '1629673', '1630214',
  '1630217', '1630533'
]

const COMMENT_ID = 'i7mrht8'

const runFunction = async () => {
  const { redditBot, fetchGameResults, fetchTeamResults, fetchPlayByPlays } = apiServices;
  const { sortPlayersByAttribute, filterPlayersByThreshold, onGoingLeaders } = sortServices;
  const { firstToStat, lastMadeShot, firstMadeShot } = playByPlayServices;
  const { standingsByAttribute } = standingsServices;
  const { renderLastShot, renderFirstShot, renderFirstToStat } = markdownServices;

  const FRIDAY_URLS = apiServices.generateBoxScoreUrls(FRIDAY_IDS, DATE_1);
  const FRIDAY_PLAY_URLS = apiServices.generatePlayByPlayUrls(FRIDAY_IDS);
  const SATURDAY_URLS = apiServices.generateBoxScoreUrls(SATURDAY_IDS, DATE_2);
  const SATURDAY_PLAY_URLS = apiServices.generatePlayByPlayUrls(FRIDAY_IDS);
  // const TUESDAY_URLS = apiServices.generateBoxScoreUrls(TUESDAY_IDS, DATE_2);
  // const WEDNESDAY_URLS = apiServices.generateBoxScoreUrls(WEDNESDAY_IDS, DATE_3);

  const {results:fridayResults, remainingGames: fridayRemainingGames} = await fetchTeamResults(FRIDAY_URLS, {type: 'combined'})
  const {results:fridayPlayResults, remainingGames: _x1} = await fetchPlayByPlays(FRIDAY_PLAY_URLS)
  const {results:saturdayResults, remainingGames: saturdayRemainingGames} = await fetchTeamResults(SATURDAY_URLS, {type: 'combined'})
  const {results:saturdayPlayResults, remainingGames: _x2} = await fetchPlayByPlays(SATURDAY_PLAY_URLS)

  const fridaySorted = fridayResults.map(teamPlayers => sortPlayersByAttribute(_.clone(teamPlayers), 'points'))
  const fridayFilterSorted = fridaySorted.map(teamPlayers => teamPlayers.filter(player => !FRIDAY_STARTING_LINEUP.includes(String(player.playerId))))
  const saturdaySorted = saturdayResults.map(teamPlayers => sortPlayersByAttribute(_.clone(teamPlayers), 'points'))
  const saturdayFilterSorted = saturdaySorted.map(teamPlayers => teamPlayers.filter(player => !SATURDAY_STARTING_LINEUP.includes(String(player.playerId))))
  
  allTeamPlayers = [...fridayFilterSorted, ...saturdayFilterSorted]
  
  const teamDisplay = allTeamPlayers.map(sortTeam => {
    return [
      `**${sortTeam[0].teams}**`,
      standingsByAttribute(sortTeam, 'points', {dividers:[0], limit: 3}).join('\n\n')
    ].join('\n\n')
  })

  const allResults = [...fridayPlayResults]
  
  const firstReachedResults = allResults.map(result => {
    return firstToStat(result, 'points', 15)
  })

  const firstReachedMarkdown = firstReachedResults.map(game => renderFirstToStat(game, {stat: 'points', target:15}))

  const markdown = [
    `# 🏀 Sparks Will Fly Flash Challenge`,
    `## ⭐️ Sparks Will Fly Leaders`,
    `### Bench Scorers`,
    ...teamDisplay,
    `### First to 15`,
    ...firstReachedMarkdown,
    `There are ${fridayRemainingGames} games that have not started yet.`,
    `**Update: ${new Date().toLocaleString("en-US", {timeZone: "America/Los_Angeles"})} PST**`,
    `**Bolded players** are done for the challenge`,
    `[Numbers] in bracket show time left in regulation for the game`,
    `Tiebreakers: Team Margin / Player's ± / Minutes Played`,
  ].join("\n\n")

  // console.clear()
  console.log(markdown)

  redditBot.getComment(COMMENT_ID).edit(markdown)

}

exec('./nbatopshot-playoffs-second-round-playoffs-20220502.js')
setInterval(runFunction, 30000)
// runFunction()