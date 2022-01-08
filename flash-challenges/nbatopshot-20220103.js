const axios = require('axios').default;
const _ = require('lodash')
const BB = require("bluebird");

const IDS = [
  '0022100552',
  '0022100553',
  '0022100554',
  '0022100555',
  '0022100556',
  '0022100557',
  '0022100558',
  '0022100559',
  '0022100560',
  '0022100561',
]

const URLS = IDS.map(id => `https://cdn.nba.com/static/json/liveData/playbyplay/playbyplay_${id}.json`);

const scoringPlays = {
  '2pt': true,
  '3pt': true,
  'freethrow': true
}

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

const runFunction = async () => {
  let remainingGames= 0;
  console.log(`## Final`)

  const results =await BB.map(URLS, async url => {
    return axios.get(url)
      .then(response => {
        const plays = response.data.game.actions;
        return findFirstToPoints(15, plays)
      })
      .catch(function (error) {
        // handle error
        remainingGames++
        // console.log(error.response.data);
        // console.log('Game has Not started yet');
      })
  })
  results.filter(r => r?.length).forEach(result => {
    console.log(`- ${result[2]}`)
    console.log(
      `**${result.slice(0,1).join(' ')}**`
    )
    console.log('\n')
  })
  console.log('Games That Have Not Started Yet:', remainingGames)
  console.log('\n')
  console.log(`## Ongoing Games`)
  console.log('\n')
  results.filter(r => !r?.length && r!= undefined).forEach(res => {
    console.log(`**${res.teams}**`)
    console.log('\n')
    for(const person in res.sorted){

      console.log(`- ${person}: ${res.sorted[person]}`)
      console.log('\n')
    }
  })
  console.log('\n')
}

setInterval(runFunction, 10000)



