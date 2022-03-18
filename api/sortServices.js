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
    if(a.plusMinus != b.plusMinus){
      return b.plusMinus - a.plusMinus
    }

    // Third tiebreaker
    if(a.secondsPlayed != b.secondsPlayed){
      return b.secondsPlayed - a.secondsPlayed
    }

    return 0;
  })
}

exports.sortPlayersByAttribute = sortPlayersByAttribute;