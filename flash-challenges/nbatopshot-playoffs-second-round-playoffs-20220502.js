const apiServices = require('../api/apiServices')
const sortServices = require('../api/sortServices')
const standingsServices = require('../api/standingsServices')
const statsServices = require('../api/statsServices')
const timeServices = require('../api/timeServices')
const playByPlayServices = require('../api/playByPlayServices')
const markdownServices = require('../api/markdownServices')
const _ = require('lodash')

const DATE_1 = "20220501"
const DATE_2 = "20220502"
const DATE_3 = "20220503"
const DATE_4 = "20220504"
const DATE_6 = "20220506"
const DATE_7 = "20220507"
const DATE_8 = "20220508"
const DATE_10 = "20220509"
const DATE_11 = "20220510"
const DATE_12 = "20220511"
// const DATE_13 = "20220428"
// const DATE_14 = "20220429"


const MIL_VS_BOS_IDS = [
  [DATE_1, '0042100211'],
  [DATE_3, '0042100212'],
  [DATE_7, '0042100213'],
  [DATE_10, '0042100214'],
  [DATE_12, '0042100215'],
]

const GSW_VS_MEM_IDS = [
  [DATE_1, '0042100231'],
  [DATE_3, '0042100232'],
  [DATE_7, '0042100233'],
  [DATE_10, '0042100234'],
  [DATE_12, '0042100235'],
]

const PHI_VS_MIA_IDS = [
  [DATE_2, '0042100201'],
  [DATE_4, '0042100202'],
  [DATE_6, '0042100203'],
  [DATE_8, '0042100204'],
  [DATE_11, '0042100205'],
]

const DAL_VS_PHX_IDS = [
  [DATE_2, '0042100221'],
  [DATE_4, '0042100222'],
  [DATE_6, '0042100223'],
  [DATE_8, '0042100224'],
  [DATE_11, '0042100225'],
]

const COMMENT_ID = 'i73dhx4'

const runFunction = async () => {
  const { redditBot, fetchGameResults, fetchTeamResults, fetchTeamStatsResults, fetchPlayByPlays } = apiServices;
  const { sortPlayersByAttribute, filterPlayersByThreshold, onGoingLeaders, sortTeamsByAttribute } = sortServices;
  const { standingsByAttribute, standingsByTeamAttribute } = standingsServices;
  const { firstToStat, lastMadeShot, firstMadeShot } = playByPlayServices;
  const { renderLastShot, renderFirstShot } = markdownServices;
  const { combineStats } = statsServices;

  const MIL_VS_BOS_URLS = MIL_VS_BOS_IDS.map(date_and_id => apiServices.generateBoxScoreUrl(date_and_id[1], date_and_id[0]))
  const GSW_VS_MEM_URLS = GSW_VS_MEM_IDS.map(date_and_id => apiServices.generateBoxScoreUrl(date_and_id[1], date_and_id[0]))
  const PHI_VS_MIA_URLS = PHI_VS_MIA_IDS.map(date_and_id => apiServices.generateBoxScoreUrl(date_and_id[1], date_and_id[0]))
  const DAL_VS_PHX_URLS = DAL_VS_PHX_IDS.map(date_and_id => apiServices.generateBoxScoreUrl(date_and_id[1], date_and_id[0]))
  

  const {results:milBosResults, remainingGames: _x1} = await fetchGameResults(MIL_VS_BOS_URLS)
  const {results:gswMemResults, remainingGames: _x2} = await fetchGameResults(GSW_VS_MEM_URLS)
  const {results:phiMiaResults, remainingGames: _x3} = await fetchGameResults(PHI_VS_MIA_URLS)
  const {results:dalPhxResults, remainingGames: _x4} = await fetchGameResults(DAL_VS_PHX_URLS)
  
  const milBosSort = sortPlayersByAttribute(_.clone(combineStats(milBosResults.flat())), 'fgm');
  const gswMemSort = sortPlayersByAttribute(_.clone(combineStats(gswMemResults.flat())), 'rebs');
  const phiMiaSort = sortPlayersByAttribute(_.clone(combineStats(phiMiaResults.flat())), 'blks');
  const dalPhxSort = sortPlayersByAttribute(_.clone(combineStats(dalPhxResults.flat())), 'assists');

  const markdown = [
    `# The Wheel 🏀 Round 2 NBA Playoffs`,
    `## MILWAUKEE-BOSTON: Most FGM`,
    ...standingsByAttribute(milBosSort, 'fgm', {dividers: [4], limit: 8, dontHideFinished: true} ),
    `## GOLDEN STATE-MEMPHIS: Most Rebs`,
    ...standingsByAttribute(gswMemSort, 'rebs', {dividers: [4], limit: 8, dontHideFinished: true} ),
    `## PHILADEPHIA-MIAMI: Most Blocks`,
    ...standingsByAttribute(phiMiaSort, 'blks', {dividers: [4], limit: 8, dontHideFinished: true} ),
    `## DALLAS-PHOENIX: Most Assists`,
    ...standingsByAttribute(dalPhxSort, 'assists', {dividers: [4], limit: 8, dontHideFinished: true} ),
    // `There are ${fridayRemainingGames} games that have not started yet.`,
    `**Update: ${new Date().toLocaleString("en-US", {timeZone: "America/Los_Angeles"})} PST**`,
    `**Bolded players** are done for the challenge`,
    `[Numbers] in bracket show time left in regulation for the game`,
    `Tiebreakers: Team Margin / Player's ± / Minutes Played`,
  ].join("\n\n")

  console.clear()
  console.log(markdown)

  redditBot.getComment(COMMENT_ID).edit(markdown)

}

setInterval(runFunction, 15000)
// runFunction()