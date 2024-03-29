/** 
 * Function that will take in an array of sorted players stats and return an 
 * array prepared for markdown.
 * @param {object} players player stats to be prepared for markdown
 * @param {string} attribute attribute to be rendered for the markdown
 * @param {object} options optional object to sort by additional filters
 * @returns {string[]} Converted markdown
*/

const sortPlayersByAttribute = (players, attribute, options = {}) => {
  return players.sort((a,b) => {
    if(a[attribute] != b[attribute]){
      return b[attribute] - a[attribute]
    }

    // custom tiebreakers
    if(options.customSort?.length > 0){
      for(let i=0; i < options.customSort.length; i++){
        const sortVar = options.customSort[i];
        if(a[sortVar] != b[sortVar]){
          return b[sortVar] - a[sortVar]
        }
      }
    }

    // First tiebreaker
    if(a.teamMargin != b.teamMargin){
      return b.teamMargin - a.teamMargin
    }

    // Second tiebreaker
    // if(a.points != b.points){
    //   return b.points - a.points
    // }

    // Third tiebreaker
    if(a.plusMinus != b.plusMinus){
      return b.plusMinus - a.plusMinus
    }

    // Fourth tiebreaker
    if(a.secondsPlayed != b.secondsPlayed){
      return b.secondsPlayed - a.secondsPlayed
    }

    return 0;
  })
}

const filterPlayersByThreshold = (players, attribute, target, options = {}) => {
  const leaders = players.filter(player => player[attribute] >= target);
  // If there is a threshold (for like a rookie challenge) and not enough participants, default to regular list
  if(options.threshold && options.threshold > leaders.length){
    return players.slice(0, options.threshold);
  }

  return leaders;
};

const onGoingLeaders = (players, attribute, target, options = {}) => {
  const leaders =  players.filter(player => player[attribute] < target && !player.gameOver)
  if(options.limit){
    return leaders.slice(0, options.limit)
  }else{
    return leaders;
  }
}

const sortTeamsByAttribute = (teams, attribute, options = {}) => {
  return teams.sort((a,b) => {
    if(a[attribute] != b[attribute]){
      return b[attribute] - a[attribute]
    }

    // custom tiebreakers
    if(options.customSort?.length > 0){
      for(let i=0; i < options.customSort.length; i++){
        const sortVar = options.customSort[i];
        if(a[sortVar] != b[sortVar]){
          return b[sortVar] - a[sortVar]
        }
      }
    }

    // First tiebreaker
    if(a.points != b.points){
      return b.points - a.points
    }

    return 0;
  })
}

exports.sortPlayersByAttribute = sortPlayersByAttribute;
exports.filterPlayersByThreshold = filterPlayersByThreshold;
exports.onGoingLeaders = onGoingLeaders;
exports.sortTeamsByAttribute = sortTeamsByAttribute;