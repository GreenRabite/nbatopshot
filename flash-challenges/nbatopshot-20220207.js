// https://data.nba.net/10s/prod/v1/20220103/0022100552_boxscore.json

const axios = require('axios').default;
const _ = require('lodash')
const fs = require('fs')
const BB = require("bluebird");
const snoowrap = require('snoowrap');
require('dotenv').config();

const IDS = [
  '0022100810',
  '0022100811',
  '0022100812',
  '0022100813',
  '0022100814',
]

const COMMENT_ID = 'hw04cvo'
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

const renderSortedObject = (sortedObj) => {
  const result = []
  for(const person in sortedObj){
    result.push(`* ${person}: ${sortedObj[person]}`)
    // console.log(`- ${person}: ${sortedObj[person]}`)
  }

  // console.log(result)

  return result.slice(0,3)
}

const runFunction = async () => {
  let remainingGames= 0;
  // console.log(`## Final`)

  const results =await BB.map(URLS, async url => {
    return axios.get(url)
      .then(response => {
        const plays = response.data.game.actions;
        const teams = _.uniq(plays.map(play => play.teamTricode).filter(x => x))
        if(teams.length === 0) return [];
        return teams.map(team => {
          const reboundsPlays = plays.filter(play => play.actionType === 'rebound' && play.teamTricode === team);
          return findFirstToReb(5, reboundsPlays);
        })
        // return findFirstToPoints(15, plays)
        // return findFirstToAst(5, plays);
        
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

  // console.log(results.flat())

  const finalResults = results.flat().filter(r => r?.length && r!= undefined).map((result, idx) => {
    return [`**${result[2]}**`, `* **${result.slice(0,1).join(' ')}**`].join("\n\n")
  })

  const gamesInProgress = results.flat().filter(r => !r?.length && r!= undefined).map((res, idx) => {
    // return [`**${res.teams}**`, renderSortedObject(res.sorted)]
    if(idx===0) return [`## Ongoing Games`,`**${res.teams}**`, renderSortedObject(res.sorted).join("\n\n")].join("\n\n")
    return [`**${res.teams}**`, renderSortedObject(res.sorted).join("\n\n")].join("\n\n")
  })

  // const testGamesInProgress = [`## Ongoing Games`,`**${dummy.teams}**`, renderSortedObject(dummy.sorted).join("\n\n")]

   const markdown = [
    `## Race to Rebounds Leaders`,
    ...finalResults,
    ...gamesInProgress,
    `**Update: ${new Date().toLocaleString()}**`,
    `There are ${remainingGames} games that have not started yet.`
  ].join("\n\n")

  console.log(markdown)

  r.getComment(COMMENT_ID).edit(markdown)
  
}



setInterval(runFunction, 30000)
// runFunction()
