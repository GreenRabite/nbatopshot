const axios = require('axios').default;
const cheerio = require('cheerio').default;
const _ = require('lodash')

const TODAY_LINEUP = 'https://www.nba.com/players/todays-lineups'

const results = {}

const fetchStartingLineup = async () => {
  return axios.get(TODAY_LINEUP)
    .then(response => {
      const $ = cheerio.load(response.data)
      const teams = $('[class^="my-5 LineupsSingle_Lineup"]')
      teams.each((index, team) => {
        team.lastChild.children.forEach(individualTeam => {
          const teamName = individualTeam.children[0].children[0].children[1].firstChild.data;
          const teamLink = individualTeam.children[0].attribs.href
          const teamId = teamLink.split('/')[teamLink.split('/').length - 1]
          // Starting Lineup - FIrst 5 players listed
          const players = individualTeam.children.slice(2,7).map(player => {
            const playerLink = player.attribs.href;
            const playerName = player.firstChild.lastChild.firstChild.data
            const playerId = playerLink.split('/')[playerLink.split('/').length - 1]
            return {
              id: playerId,
              name: playerName,
            }
          })
    
          players.forEach(player => {
            results[player.id] = player
          })
          // results[teamId] = {
          //   teamId,
          //   teamName,
          //   players
          // }
        })
      })
  
      // console.log(Object.values(results).map(x => x.id))
      // console.log(Object.values(results))
      // return results
      return Object.values(results).map(x => x.id)
    })
}

// fetchStartingLineup()

exports.fetchStartingLineup = fetchStartingLineup;
