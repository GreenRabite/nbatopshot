// https://data.nba.net/10s/prod/v1/20220103/0022100552_boxscore.json

const axios = require('axios').default;
const _ = require('lodash')
const fs = require('fs')
const BB = require("bluebird");
const snoowrap = require('snoowrap');
require('dotenv').config();

const IDS = [
  '0022100831',
  '0022100832',
  '0022100833',
  '0022100834',
  '0022100835',
  '0022100836',
  '0022100837',
]

const COMMENT_ID = 'hwfeaf1'
const URLS = IDS.map(id => `https://cdn.nba.com/static/json/liveData/playbyplay/playbyplay_${id}.json`);

const findFirstToReb = (targetReb, reboundsPlays) => {
  const results = {}
  // const reboundsPlays = plays.filter(play => play.actionType === 'rebound')
  const teams = _.uniq(reboundsPlays.map(play => play.teamTricode)).join('-')
  let someReachedTargedRebounds = false
  let winner;
  reboundsPlays.forEach(play => {
    const playerName = play.playerNameI
    if(playerName){
      if(results[playerName]){
        results[playerName] += 1
      }else{
        results[playerName] = 1
      }
    }

    if(!someReachedTargedRebounds && results[playerName] >= targetReb){
      someReachedTargedRebounds = true
      winner = [playerName, play.teamTricode, teams]
      // console.log(winner)
    }
  })

  if(!someReachedTargedRebounds){
    const sorted = 
      Object.keys(results)
      .sort((a,b) =>results[b] - results[a] )
      .slice(0,4)
      .reduce(
        (_sortedObj, key) => ({
          ..._sortedObj,
          [key]: results[key]
        }),
        {}
      );
    if(sorted){
      winner = {
        teams: _.uniq(reboundsPlays.map(play => play.teamTricode)).join('-'),
        sorted,
      }
    }
  }

  return winner;
}

const timeLeft = (period, timeString) => {
  // "PT00M51.00S",
  const zeroPad = (num, places) => String(num).padStart(places, '0')
  const minute = timeString?.split('M') && timeString?.split('M')[0]?.slice(2,4)
  const seconds = timeString?.split('M') && timeString?.split('M')[1]?.slice(0,2)

  if(Number(minute) ===0 && Number(seconds)===0 && period > 3) return ''

  const minuteDisplay = zeroPad(Number(minute), 2)
  const secondsDisplay = zeroPad(Number(seconds), 2)

  return `[Q${period} ${minuteDisplay}:${secondsDisplay}]`
}

const firstAndLastFT = (plays, hasGameEnd, time) => {
  const freeThrowPlays = plays.filter(play => play.actionType === 'freethrow' && play.shotResult === 'Made')
  const teams = _.uniq(plays.map(play => play.teamTricode).filter(x=>x)).join('-')
  let winner = {
    first: null,
    last: null,
    teams,
    hasGameEnd,
    time
  };

  if(freeThrowPlays.length > 0){
    winner = {
      first: freeThrowPlays[0].playerNameI, 
      last: freeThrowPlays[freeThrowPlays.length - 1].playerNameI,
      teams,
      hasGameEnd,
      time
    }
  }

  return winner;
}

const runFunction = async () => {
  let remainingGames= 0;

  const results =await BB.mapSeries(URLS, async url => {
    return axios.get(url)
      .then(response => {
        const plays = response.data.game.actions;
        const lastPlay = plays[plays.length - 1]
        const hasGameEnd = lastPlay.actionType === 'game' && lastPlay.subType === 'end'
        const time = timeLeft(lastPlay.period, lastPlay.clock)
        // return findFirstToPoints(15, plays)
        // return findFirstToAst(5, plays);
        return firstAndLastFT(plays, hasGameEnd, time);
      })
      .catch(function (error) {
        // handle error
        remainingGames++
        return undefined;
        // console.log(error.response.data);
        // console.log('Game has Not started yet');
      })
  })

  const r = new snoowrap({
    userAgent: 'KobeBot',
    clientId: process.env.REDDIT_CLIENT_ID,
    clientSecret: process.env.REDDIT_SECRET_ID,
    refreshToken: process.env.REDDIT_REFRESH_TOKEN,
  });

  const standings = results.filter(x => x).map((result) => {
    const {first, last, teams, hasGameEnd, time } = result;
    
    if(!first) return [
      `**${teams}**`,
      'No one has made a free throw for this game yet'
    ]

    const lastPlayerInfo = hasGameEnd ? `**${last}**` : 'TBD'
    const currentPlayerInfo = hasGameEnd ? undefined : `Current: _${last}_`;

    return [
      `**${teams}** ${time}`,
      `* First FTM: **${first}**`,
      `* Last FTM: ${lastPlayerInfo}`,
      currentPlayerInfo
    ].filter(x=> x)
  }).flat()

  // const testGamesInProgress = [`## Ongoing Games`,`**${dummy.teams}**`, renderSortedObject(dummy.sorted).join("\n\n")]

   const markdown = [
    `## First/Last Free Throws Made`,
    ...standings,
    `**Update: ${new Date().toLocaleString()}**`,
    `There are ${remainingGames} games that have not started yet.`,
    `Players in **bold** is final for the challenge`
  ].join("\n\n")

  console.clear()
  console.log(markdown)

  r.getComment(COMMENT_ID).edit(markdown)
  
}



setInterval(runFunction, 60000)
// runFunction()
