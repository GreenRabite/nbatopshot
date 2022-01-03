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
  console.log(_.uniq(shootingPlays.map(play => play.teamTricode)).join('-'))
  let someoneReachedTargetedPoints = false
  shootingPlays.forEach(play => {
    if(!someoneReachedTargetedPoints && play.pointsTotal >= targetPoints){
      someoneReachedTargetedPoints = true
      console.log(play.playerNameI, play.teamTricode)
    }
    results[play.playerNameI] = play.pointsTotal
  })

  if(!someoneReachedTargetedPoints){
    const sorted = 
      Object.keys(results)
      .sort((a,b) =>results[b] - results[a] )
      .slice(0,6)
      .reduce(
        (_sortedObj, key) => ({
          ..._sortedObj,
          [key]: results[key]
        }),
        {}
      );
    console.log(sorted)
  }
}

const runFunction = () => {
  BB.map(URLS, async url => {
    await axios.get(url)
      .then(response => {
        const plays = response.data.game.actions;
        findFirstToPoints(15, plays)
      })
      .catch(function (error) {
        // handle error
        // console.log(error.response.data);
        console.log('Game has Not started yet');
      })
  })
  console.log('\n')
}

setInterval(runFunction, 20000)



