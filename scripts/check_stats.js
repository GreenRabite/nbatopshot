const events = require('events');
const fs = require('fs');
const readline = require('readline');
const data = require('../data/league_stats_20220116.json');
const { count } = require('../db/models/moment');

(async function processLineByLine() {
  try {
    const rl = readline.createInterface({
      input: fs.createReadStream('./data/needed_moments.txt'),
      crlfDelay: Infinity
    });

    const leagueLeaders = JSON.parse(JSON.stringify(data));

    const dataObject = leagueLeaders.resultSets[0]
    const headers = dataObject.headers;
    // console.log(headers)
    // console.log('reb', headers[22])
    // console.log('ast', headers[23])
    // console.log('stl', headers[25])
    // console.log('blk', headers[26])
    // console.log('pts', headers[30])
    // console.log(dataObject.rowSet[0])
    const playerData = dataObject.rowSet.reduce((accum, row) => {
      accum[row[1]] = {
        name: row[1],
        minutes: row[10],
        reb: row[22],
        ast: row[23],
        stl: row[25],
        blk: row[26],
        pts: row[30],
      }
      return accum;
    }, {})

    //   const missingNames = ["Victor Oladipo",
    //   "Glenn Robinson III",
    //   "Sean McDermott",
    //   "Dwayne Bacon",
    //   "Markelle Fultz",
    //   "Edmond Sumner",
    //   "Michael Carter-Williams",
    //   "Juancho Hernangómez",
    //   "JJ Redick",
    //   "JaKarr Sampson",
    //   "Kevin Knox",
    //   "PJ Dozier",
    //   "Mike James",
    //   "E'Twaun Moore",
    //   "Dario Saric",
    //   "Aron Baynes",
    //   "Nico Mannion"].map(name => name.split(" ")[0])
    // missingNames.forEach(missingName => {
    //   console.log(
    //     Object.keys(playerData).some(word => word.toLowerCase().includes(`${missingName}`))
    //   )
    // })

    rl.on('line', (line) => {
      // console.log(`Line from file: ${line}`);
      const name = line.split(": ")[0]
      const count = line.split(": ")[1]
      if(playerData[name]){
        playerData[name] = {...playerData[name], ...{count: count}}
        // console.log(playerData[name])
      }else{
        // console.log(name)
      }
    });
    // console.log(Object.values(playerData))
    // console.log(Object.values(playerData).flat().find(x => x.name === 'Jalen Green'))
    await events.once(rl, 'close');
    const sortedMinutes = Object.values(playerData).filter(player =>console.log(player) || player['count']).sort((a,b) => b.minutes - a.minutes);

    fs.writeFile('data/bested_needed_value.csv', sortedMinutes.map(player => [player.name, player.minutes, player.count].join(',')).join('\n'), err => {
        if (err) {
        console.error(err)
        return
      }
    })

    console.log('Reading file line by line with readline done.');
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(`The script uses approximately ${Math.round(used * 100) / 100} MB`);
  } catch (err) {
    console.error(err);
  }
})();