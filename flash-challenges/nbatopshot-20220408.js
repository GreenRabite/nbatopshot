const apiServices = require('../api/apiServices')
const sortServices = require('../api/sortServices')
const standingsServices = require('../api/standingsServices')
const statsServices = require('../api/statsServices')
const timeServices = require('../api/timeServices')
const playByPlayServices = require('../api/playByPlayServices')
const markdownServices = require('../api/markdownServices')
const _ = require('lodash')

// const DATE_1 = "20220408"
const DATE_2 = "20220409"
const DATE_3 = "20220410"

const FRIDAY_IDS = [
  '0022101203',
  '0022101204',
  '0022101205',
  '0022101206',
  '0022101207',
  '0022101208',
  '0022101209',
  '0022101210',
  '0022101211'
]

const SATURDAY_IDS = [ 
 '0022101214',
 '0022101213',
 '0022101215',
 '0022101212',
]

const SUNDAY_IDS = [
  '0022101216',
  '0022101217',
  '0022101218',
  '0022101221',
  '0022101223',
  '0022101226',
  '0022101227',
  '0022101228',
  '0022101224',
  '0022101219',
  '0022101220',
  '0022101222',
  '0022101225',
  '0022101229',
  '0022101230',
]

const COMMENT_ID = 'i3yiga5'

const runFunction = async () => {
  const { redditBot, fetchGameResults, fetchTeamResults, fetchTeamStatsResults, fetchPlayByPlays } = apiServices;
  const { sortPlayersByAttribute, filterPlayersByThreshold, onGoingLeaders, sortTeamsByAttribute } = sortServices;
  const { standingsByAttribute, standingsByTeamAttribute } = standingsServices;
  const { firstToStat, lastMadeShot, firstMadeShot } = playByPlayServices;
  const { renderLastShot, renderFirstShot } = markdownServices;

  const FRIDAY_URLS = apiServices.generatePlayByPlayUrls(FRIDAY_IDS);
  const SATURDAY_BOXSCORE_URLS = apiServices.generateBoxScoreUrls(SATURDAY_IDS, DATE_2);
  const SUNDAY_BOXSCORE_URLS = apiServices.generateBoxScoreUrls(SUNDAY_IDS, DATE_3);

  const {results:fridayResults, remainingGames: fridayRemainingGames} = await fetchPlayByPlays(FRIDAY_URLS)
  const {results:saturdayResults, remainingGames: saturdayRemainingGames} = await fetchTeamResults(SATURDAY_BOXSCORE_URLS, {type: 'combined'})
  const {results:sundayResults, remainingGames: sundayRemainingGames} = await fetchTeamResults(SUNDAY_BOXSCORE_URLS, {type: 'combined'})

  const lastMadeResults = fridayResults.map(result => {
    const finalResult = result.filter(play => play.playerNameI !== 'I. Thomas')
    return lastMadeShot(finalResult, 'tpm')
  })
  const lastMadeMarkdown = lastMadeResults.map(game => renderLastShot(game, {stat: 'tpm', showOnlyPlayer: true}))?.filter(x=>x?.length)

  const saturdaySortedTeamPlayers = saturdayResults.map(teamPlayers => sortPlayersByAttribute(_.clone(teamPlayers), 'steals'))
  const saturdayTeamDisplay = saturdaySortedTeamPlayers.map(sortTeam => {
    const filterTeam = sortTeam.filter(player => player.name != "Jared Harper")
    return [
      `**${filterTeam[0].teams}**`,
      standingsByAttribute(filterTeam, 'steals', {dividers:[0], limit: 3}).join('\n\n')
    ].join('\n\n')
  })

  const sundaySortedTeamPlayers = sundayResults.map(teamPlayers => sortPlayersByAttribute(_.clone(teamPlayers), 'fgm'))
  const sundayTeamDisplay = sundaySortedTeamPlayers.map(sortTeam => {
    return [
      `**${sortTeam[0].teams}**`,
      standingsByAttribute(sortTeam, 'fgm', {dividers:[0], limit: 3}).join('\n\n')
    ].join('\n\n')
  })

  const markdown = [
    `# Season End Wheel Challenge Flash Challenge`,
    `## Season End Wheel Challenge Leaders (Rookie/Vet)`,
    `### Friday: Last Made 3PM`,
    ...lastMadeMarkdown,
    `### Saturday: Most Steals`,
    ...saturdayTeamDisplay,
    `### Sunday: Most FGM`,
    ...sundayTeamDisplay,
    `There are ${sundayRemainingGames} games that have not started yet.`,
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