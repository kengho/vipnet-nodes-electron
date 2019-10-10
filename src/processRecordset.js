export default ({ recordset, idsOrder, names, searchUsers }) => {
  const searchResults = []

  if (names.length === 0) {
    const idsDuplicatesCache = {}

    idsOrder.forEach((ordersNormalId, i) => {
      let correspondingRecordnodeId
      let correspondingRecorduserId
      const correspondingRecord = recordset.find((record) => { // eslint-disable-line array-callback-return
        if (searchUsers) {
          const recorduserId = getNormalId(record.NetNumber, record.UserId)
          if (ordersNormalId === recorduserId) {
            correspondingRecordnodeId = getNormalId(record.NetNumber, record.NodeId)
            correspondingRecorduserId = recorduserId
            return true
          }
        } else {
          const recordnodeId = getNormalId(record.NetNumber, record.NodeId)
          if (ordersNormalId === recordnodeId) {
            correspondingRecordnodeId = recordnodeId
            correspondingRecorduserId = getNormalId(record.NetNumber, record.UserId)
            return true
          }
        }
      })

      let currentSearchResult
      if (correspondingRecord) {
        currentSearchResult = {
          nodeId: correspondingRecordnodeId,
          userId: correspondingRecorduserId,
          nodeName: correspondingRecord.NodeName,
          userName: correspondingRecord.UserName,
        }
      } else {
        if (searchUsers) {
          currentSearchResult = {
            nodeId: '',
            userId: ordersNormalId,
            nodeName: '',
            userName: '',
          }
        } else {
          currentSearchResult = {
            nodeId: ordersNormalId,
            userId: '',
            nodeName: '',
            userName: '',
          }
        }
      }

      if (idsDuplicatesCache[ordersNormalId]) {
        currentSearchResult.isDuplicate = true
      } else {
        idsDuplicatesCache[ordersNormalId] = true
      }

      searchResults.push(currentSearchResult)
    })
  } else {
    recordset.forEach((record) => {
      searchResults.push({
        nodeId: getNormalId(record.NetNumber, record.NodeId),
        userId: getNormalId(record.NetNumber, record.UserId),
        nodeName: record.NodeName,
        userName: record.UserName,
      })
    })
  }

  return searchResults
}

// Modified leftJustify() from here:
// https://gist.github.com/biesiad/889139#file-stringjustify-js
const rjust = (string, length, char) => {
  var fill = []
  while (fill.length + string.length < length) {
    fill[fill.length] = char
  }
  return fill.join('') + string
}

const getNormalId = (netNumber, id) => {
  return `0x${rjust((netNumber * 0x10000 + id).toString(16), 8, '0')}`
}
