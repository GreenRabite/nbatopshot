/** 
 * Function that will take in an array of sorted players stats and return an 
 * array prepared for markdown.
 * @param {object} players player stats to be prepared for markdown
 * @param {string} attribute attribute to be rendered for the markdown
 * @param {object} options optional object to help put in dividers
 * @returns {string[]} Converted markdown
*/
const defaultOptions = {
  hasThreshold: true,
  hasDividers: true,
}

const standingsByAttribute = (players, attribute, options = {}) => {
  options = {...defaultOptions, ...options}
  
  if(players.length === 0 && options.onGoing) return ["No games going on right now"]
  if(players.length === 0) return ['No Players Have Reached This Threshold']
  let dividers = []
  let threshold;
  let limit = 5;

  if(options.hasDividers){
    dividers = [4];
  }

  
  if(options.dividers){
    dividers = options.dividers
  }

  if(options.hasThreshold){
    threshold = dividers.length > 0 ? dividers[dividers.length - 1] + 1 : 5;
  }

  if(options.threshold){
    threshold = options.threshold
  }

  if(options.limit){
    limit = options.limit;
  }

  return players.map((player, idx) => {
    const showTeams = options.showTeams ? `[${player.teams}]` : '';
    const playerInfo = player.gameOver ? `* **${player.name}: ${player[attribute]}** ${showTeams}` : `${player.name}: ${player[attribute]} ${showTeams}`

    if(dividers.includes(idx)) return `${playerInfo} ${player.timeLeft}\n\n---------------------`
    if(idx >= threshold && player.gameOver) return undefined;
    return `${playerInfo} ${player.timeLeft}`;
  }).filter(x => !!x).slice(0, limit)
}

exports.standingsByAttribute = standingsByAttribute;