const axios = require('axios').default;
const _ = require('lodash')
const BB = require("bluebird");
const snoowrap = require('snoowrap');
require('dotenv').config();

const IDS = [
  '0022100454',
  '0022100714',
  '0022100715',
  '0022100716',
  '0022100717',
  '0022100718',
  '0022100719',
  '0022100720',
  '0022100721',
]

const URLS = IDS.map(id => `https://cdn.nba.com/static/json/liveData/playbyplay/playbyplay_${id}.json`);

const COMMENT_ID = 'hu7rzfv'
const MADE = 'Made'

const findFirstToPoints = (targetPoints, plays) => {
  const results = {}
  const shootingPlays = plays.filter(play => scoringPlays[play.actionType] && play.shotResult === MADE)
  const teams = _.uniq(shootingPlays.map(play => play.teamTricode)).join('-')
  let someoneReachedTargetedPoints = false
  let winner;
  shootingPlays.forEach(play => {
    if(!someoneReachedTargetedPoints && play.pointsTotal >= targetPoints){
      someoneReachedTargetedPoints = true
      // console.log(play.playerNameI, play.teamTricode)
      winner = [play.playerNameI, play.teamTricode, teams]
    }
    results[play.playerNameI] = play.pointsTotal
  })

  if(!someoneReachedTargetedPoints){
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
        teams: _.uniq(shootingPlays.map(play => play.teamTricode)).join('-'),
        sorted,
      }
    }
  }

  return winner;
}

const findFirstToAst = (targetAst, plays) => {
  const results = {}
  const assistedPlays = plays.filter(play => play.assistTotal)
  const teams = _.uniq(assistedPlays.map(play => play.teamTricode)).join('-')
  let someoneReachedTargetedAssists = false
  let winner;
  assistedPlays.forEach(play => {
    if(!someoneReachedTargetedAssists && play.assistTotal >= targetAst){
      someoneReachedTargetedAssists = true
      winner = [play.assistPlayerNameInitial, play.teamTricode, teams]
    }
    results[play.assistPlayerNameInitial] = play.assistTotal
  })

  if(!someoneReachedTargetedAssists){
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
        teams: _.uniq(assistedPlays.map(play => play.teamTricode)).join('-'),
        sorted,
      }
    }
  }

  return winner;
}

const findFirstTo3PM = (target3PM, plays) => {
  const results = {}
  const threePointsPlays = plays.filter(play => play.actionType === '3pt' && play.shotResult === 'Made')
  const teams = _.uniq(threePointsPlays.map(play => play.teamTricode)).join('-')
  let someoneReached3PMTarget = false
  let winner;
  // console.log(threePointsPlays.map(p => p.playerNameI))
  threePointsPlays.forEach(play => {
    const playerName = play.playerNameI
    if(results[playerName]){
      results[playerName] += 1
    }else{
      results[playerName] = 1
    }

    if(!someoneReached3PMTarget && results[playerName] >= target3PM){
      someoneReached3PMTarget = true
      // console.log(play.playerNameI, play.teamTricode)
      winner = [playerName, play.teamTricode, teams]
      // console.log(winner)
    }
  })

  if(!someoneReached3PMTarget){
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
        teams: _.uniq(threePointsPlays.map(play => play.teamTricode)).join('-'),
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
        // return findFirstToPoints(15, plays)
        // return findFirstToAst(5, plays);
        return findFirstTo3PM(3, plays);
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

  const finalResults = results.filter(r => r?.length).map((result, idx) => {
    return [`${result[2]}`, `**${result.slice(0,1).join(' ')}**`].join("\n\n")
  })

  // const dummy = {
  //   teams: "teams",
  //   sorted: {
  //     "A.Luo": 3,
  //     "B. Throton": 2
  //   }
  // }

  const gamesInProgress = results.filter(r => !r?.length && r!= undefined).map((res, idx) => {
    // return [`**${res.teams}**`, renderSortedObject(res.sorted)]
    if(idx===0) return [`## Ongoing Games`,`**${res.teams}**`, renderSortedObject(res.sorted).join("\n\n")].join("\n\n")
    return [`**${res.teams}**`, renderSortedObject(res.sorted).join("\n\n")].join("\n\n")
  })

  // const testGamesInProgress = [`## Ongoing Games`,`**${dummy.teams}**`, renderSortedObject(dummy.sorted).join("\n\n")]

   const markdown = [
    `## Race to 3PM Leaders`,
    ...finalResults,
    ...gamesInProgress,
    `**Update: ${new Date().toLocaleString()}**`,
    `There are ${remainingGames} games that have not started yet.`
  ].join("\n\n")

  console.log(markdown)

  r.getComment(COMMENT_ID).edit(markdown)
  
}

setInterval(runFunction, 45000)
// runFunction()



