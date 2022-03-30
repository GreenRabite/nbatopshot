const renderLiveStanding = (sorted) => {
  return sorted.map((player, idx) => {
    if(idx===0) return `${player.name} ${player.sum}\n\n-------------------------`
    return `${player.name} ${player.sum}`
  }).slice(0,4)
}

const renderFirstToStat = (result, {stat, target}) => {
  const header = `_First to ${target} ${stat}_`;
  if(result.status === 'finished'){
    return [
      header,
      `* **${result.name}**`
    ].join('\n\n')
  }else if(result.status === 'in_progress'){
    return [
      header,
      ...renderLiveStanding(result.sorted)
    ].join('\n\n')
  }
}

const renderLastShot = (result, {stat}) => {
  if(!result) return [];
  if(result.status === 'finished'){
    return [`**${result.teams}**`,`Last Shot(${stat}):`, `* **${result.name}**`].join('\n\n')
  }else if(result.status === 'in_progress'){
    return [`**${result.teams}**`, `Current Last Shot(${stat}):`, `${result.currentLastShot}`].join('\n\n')
  }
}

exports.renderLiveStanding = renderLiveStanding
exports.renderFirstToStat = renderFirstToStat
exports.renderLastShot = renderLastShot