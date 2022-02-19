const axios = require('axios').default;
const _ = require('lodash')
const BB = require("bluebird");
const snoowrap = require('snoowrap');
require('dotenv').config();

const IDS = [
  '0032100004',
  '0032100005',
  '0032100006',
]

const URLS = IDS.map(id => `https://cdn.nba.com/static/json/liveData/playbyplay/playbyplay_${id}.json`);

const COMMENT_ID = 'hxj3q9m'
const MADE = 'Made'

const scoringPlays = {
  '2pt': true,
  '3pt': true,
  'freethrow': true
}

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

const findFirstToValentine = (plays) => {
  const results = {}
  const valentinePlays = plays.filter(play =>{
    const isScoringPlay = scoringPlays[play.actionType] && play.shotResult === MADE
    const isReboundPlay = play.actionType === 'rebound'
    return isScoringPlay || isReboundPlay
  })
  const teams = _.uniq(plays.map(play => play.teamTricode).filter(x=>x)).join('-')
  let someoneReachedValentineTarget = false
  let winner;
  // console.log(threePointsPlays.map(p => p.playerNameI))
  valentinePlays.forEach(play => {
    const isScoringPlay = scoringPlays[play.actionType] && play.shotResult === MADE
    const isReboundPlay = play.actionType === 'rebound'
    const playerName = play.playerNameI;
    const astPlayerName = play.assistPlayerNameInitial

    if(!results[playerName]){
      results[playerName] = {
        points: 0,
        rebs: 0,
        ast: 0,
        sum: 0
      }
    }
    if(astPlayerName && !results[astPlayerName]){
      results[astPlayerName] = {
        points: 0,
        rebs: 0,
        ast: 0,
        sum: 0
      }
    }

    if(isReboundPlay){
      results[playerName]['rebs'] = Number(play.reboundTotal)
    }else if(isScoringPlay){
      results[playerName]['points'] = Number(play.pointsTotal)
      if(play.assistTotal){
        results[astPlayerName]['ast'] = Number(play.assistTotal)
      }
    }

    const isPlayerFinish = results[playerName] && results[playerName].points >= 10 && results[playerName].rebs >= 2 && results[playerName].ast >= 2
    const isAstPlayerFinish = results[astPlayerName] && results[astPlayerName].points >= 10 && results[astPlayerName].rebs >= 2 && results[astPlayerName].ast >= 2
    
    if(!someoneReachedValentineTarget && isPlayerFinish){
      someoneReachedValentineTarget = true
      // console.log(play.playerNameI, play.teamTricode)
      winner = [playerName, play.teamTricode, teams]
      // console.log(winner)
    }else if(!someoneReachedValentineTarget && isAstPlayerFinish){
      someoneReachedValentineTarget = true
      winner = [astPlayerName, play.teamTricode, teams]
    }

    Object.keys(results).filter(x=>x).forEach(key => {
      results[key].sum = Number(results[key].points) + Number(results[key].rebs) + Number(results[key].ast)
    })
  })

  if(!someoneReachedValentineTarget){
    const sorted = 
      Object.keys(results)
      .filter(x=>x)
      .sort((a,b) =>results[b].sum - results[a].sum )
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
        teams: _.uniq(valentinePlays.map(play => play.teamTricode)).join('-'),
        sorted,
      }
    }
  }

  return winner;
}

const findLastMadeShot = (plays) => {
  const teams = _.uniq(plays.map(play => play.teamTricode).filter(x=>x)).join('-')
  const lastPlay = plays[plays.length - 1]
  const scoringPlays = plays.filter(play => play?.shotResult === MADE);
  const winningShot = scoringPlays[scoringPlays.length - 1]
  let winner;
  if(lastPlay.actionType === 'game' && lastPlay.subType === 'end'){
    const playerName = winningShot.playerNameI
    winner = [playerName, winningShot.teamTricode, teams]
    return winner;
  }



  console.log(scoringPlays)
  return {
    teams,
    currentLastShot: winningShot.playerNameI
  };
}

const renderSortedObject = (sortedObj) => {
  const result = []
  console.log(sortedObj)
  for(const person in sortedObj){
    console.log(person)
    if(person != 'undefined'){
      result.push(`* ${person}: ${sortedObj[person].points}pts / ${sortedObj[person].rebs}rebs / ${sortedObj[person].ast}ast`)
    }
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
        return findLastMadeShot(plays);
      })
      .catch(function (error) {
        // handle error
        // console.log(error)
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

  console.log(results)

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
    // if(idx===0) return [`## Ongoing Games`,`**${res.teams}**`, renderSortedObject(res.sorted).join("\n\n")].join("\n\n")
    // return [`**${res.teams}**`, renderSortedObject(res.sorted).join("\n\n")].join("\n\n")
    return [`## Ongoing Games`,`**${res.teams}**`, 'Status: TBD', `Last bucket: _${res.currentLastShot}_`].join("\n\n")
  })

  // const testGamesInProgress = [`## Ongoing Games`,`**${dummy.teams}**`, renderSortedObject(dummy.sorted).join("\n\n")]

   const markdown = [
    `## Winning Shots`,
    ...finalResults,
    ...gamesInProgress,
    `**Update: ${new Date().toLocaleString()}**`,
    `There are ${remainingGames} games that have not started yet.`
  ].join("\n\n")

  console.clear()
  console.log(markdown)

  r.getComment(COMMENT_ID).edit(markdown)
}

// setInterval(runFunction, 30000)
runFunction()



