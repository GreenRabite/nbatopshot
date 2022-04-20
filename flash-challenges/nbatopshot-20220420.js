const apiServices = require('../api/apiServices')
const sortServices = require('../api/sortServices')
const standingsServices = require('../api/standingsServices')
const statsServices = require('../api/statsServices')
const timeServices = require('../api/timeServices')
const _ = require('lodash')
const exec = require('child_process').exec;
const file = require('./nbatopshot-playoffs-first-round-20220417.js')

const DATE_1 = '20220420'

const WEDNESDAY_IDS = [ 
  '0042100112',
  '0042100133',
  '0042100122' 
]

const COMMENT_ID = 'i5jpnng'

const runFunction = async () => {
  const { redditBot, fetchGameResults, fetchTeamResults } = apiServices;
  const { sortPlayersByAttribute, filterPlayersByThreshold, onGoingLeaders } = sortServices;
  const { standingsByAttribute } = standingsServices;

  const WEDNESDAY_URLS = apiServices.generateBoxScoreUrls(WEDNESDAY_IDS, DATE_1);

  const {results:wednesdayResults, remainingGames: wednesdayRemainingGames} = await fetchTeamResults(WEDNESDAY_URLS, {type: 'separate'})

  const wednesdayPlayers = wednesdayResults.flat(1);
  const wednesdaySorted = wednesdayPlayers.map(teamPlayers => sortPlayersByAttribute(_.clone(teamPlayers), 'rebs', {customSort: ['teamMargin', 'points', 'plusMinus', 'secondsPlayed']}))

  const wednesdayTeamDisplay = wednesdaySorted.map(sortTeam => {
    return [
      `**${sortTeam[0].ownTeam}**`,
      standingsByAttribute(sortTeam, 'rebs', {dividers:[0], limit: 3}).join('\n\n')
    ].join('\n\n')
  })

  const markdown = [
    `# 🏀 Heroic Hustle Flash Challenge`,
    `## ⭐️ Heroic Hustle Leaders - Rebs (Rookie/Hero)`,
    ...wednesdayTeamDisplay,
    `There are ${wednesdayRemainingGames} games that have not started yet.`,
    `**Update: ${new Date().toLocaleString("en-US", {timeZone: "America/Los_Angeles"})} PST**`,
    `**Bolded players** are done for the challenge`,
    `[Numbers] in bracket show time left in regulation for the game`,
    `Tiebreakers: Points Scored / Player's ± / Minutes Played`,
  ].join("\n\n")

  console.clear()
  console.log(markdown)

  redditBot.getComment(COMMENT_ID).edit(markdown)

}

exec('./nbatopshot-playoffs-first-round-20220417.js')
setInterval(runFunction, 30000)
// runFunction()