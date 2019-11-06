import { escape } from 'sqlstring'
import VipnetParser from 'vipnet-parser'

import demoData from './demoData.json'

export default ({ searchQuery, searchUsers = false, demo, currentNetworkNumber }) => {
  // Handle "!top 10 6670"-type queries first.
  const topQueryRegexp = /!top\s(\d+)(\s)?(\d+)?/
  const match = searchQuery.match(topQueryRegexp)
  if (match) {
    const topNumber = match[1]
    let networkNumber
    if (match[3]) {
      networkNumber = match[3]
    } else {
      networkNumber = currentNetworkNumber
    }

    return buildSqlTopQuery({ topNumber, networkNumber })
  }

  const [allIdsArray, namesArray] = splitIdsAndNamesQueries(searchQuery)
  const idsByNetworks = splitIdsByNetworks(allIdsArray)

  if (demo) {
    const result = {
      sqlQuery: '',
      idsOrder: allIdsArray,
      names: namesArray,
    }

    if (searchQuery === demoData['DEMO1_QUERY']) {
      if (searchUsers) {
        result.sqlQuery = 'DEMO1_USERS'
      } else {
        result.sqlQuery = 'DEMO1_NODES'
      }
    }

    if (searchQuery === demoData['DEMO2_QUERY']) {
      if (searchUsers) {
        result.sqlQuery = 'DEMO2_USERS'
      } else {
        result.sqlQuery = 'DEMO2_NODES'
      }
    }

    if (searchQuery === demoData['DEMO3_QUERY']) {
      if (searchUsers) {
        result.sqlQuery = 'DEMO3_USERS'
      } else {
        result.sqlQuery = 'DEMO3_NODES'
      }
    }

    return result
  }

  return buildSqlWhereIdsInLists({
    idsByNetworks,
    namesArray,
    searchUsers,
    allIdsArray,
  })
}

// "1a0e000a,1A0E000b,lul,0x1a0f000c"
// =>
// ["0x1a0e000a", "0x1a0e000b", "0x1a0f000c"] // allIdsArray
// ["lul"] // namesArray
const splitIdsAndNamesQueries = (searchQuery) => {
  const searchArray = searchQuery.split(',')
  const allIdsArray = []
  const namesArray = []

  searchArray.forEach((searchItem) => {
    if (searchItem.length === 0) {
      return
    }

    const parsedIds = VipnetParser.id({ string: searchItem, threshold: 0 })

    if (parsedIds.length > 0) {
      allIdsArray.push(...parsedIds)
    } else {
      namesArray.push(searchItem)
    }
  })

  return [allIdsArray, namesArray]
}

// ["0x1a0e000a", "0x1a0e000b", "0x1a0f000c"]
// =>
// { "6670": ["0x1a0e000a", "0x1a0e000b"], "6671": ["0x1a0f000c"] } // idsByNetworks
const splitIdsByNetworks = (allIdsArray) => {
  const idsByNetworks = {}
  allIdsArray.forEach((id) => {
    const currentNetworkNumber = VipnetParser.network(id)
    const currentNetworkidsArray = idsByNetworks[currentNetworkNumber]
    if (!currentNetworkidsArray) {
      idsByNetworks[currentNetworkNumber] = [id]
    } else {
      idsByNetworks[currentNetworkNumber].push(id)
    }
  })

  return idsByNetworks
}

const getSqlId = (id) => {
  //       6
  // 0123456789
  // 0x1a0eabcd  <== id
  // =>    abcd  <== sql id
  const sqlIdIndexA = 6
  return parseInt(id.substring(sqlIdIndexA), 16)
}

// { "6670": ["0x1a0e000a", "0x1a0e000b"], "6671": ["0x1a0f000c"] } // idsByNetworks
// =>
// [
//   {
//    networkNumber: 6670,
//    listName: "@list_0",
//    sqlIdsList: [10, 11],
//   }, {
//    networkNumber: 6671,
//    listName: "@list_1",
//    sqlIdsList: [12],
//   },
// ]
const buildSqlDataLists = (idsByNetworks) =>
  Object.keys(idsByNetworks).map((networkNumber, networkIndex) => {
    const currentIdsArray = idsByNetworks[networkNumber]
    const listName = `list_${networkIndex}`
    const sqlIdsList = currentIdsArray.map((nodeId) => getSqlId(nodeId))

    return {
      networkNumber,
      listName,
      sqlIdsList,
    }
  })

// See queryBuilder.test.js for example output.
const buildSqlWhereIdsInLists = ({
  idsByNetworks,
  namesArray,
  searchUsers,
  allIdsArray,
}) => {
  if ((allIdsArray.length === 0) && (namesArray.length === 0)) {
    return { sqlQuery: undefined }
  }

  const sqlDataLists = buildSqlDataLists(idsByNetworks)

  let sqlQuery =
`
${sqlDataLists.map((sqlDataList) =>
`DECLARE @${sqlDataList.listName} TABLE (Id int)
INSERT INTO @${sqlDataList.listName} VALUES ${sqlDataList.sqlIdsList.map((sqlId) => `(${sqlId})`).join(', ')}`
).join("\n")}
SELECT
\tOffice.vw_LoadNodes.NetNumber as NetNumber,
\tOffice.vw_LoadNodes.NodeVipnetInnerId as NodeId,
\tOffice.vw_LoadNodes.Name as NodeName,
\tNcc.[User].InnerNetworkIdentifier as UserId,
\tNcc.[User].Name as UserName
FROM Office.vw_LoadNodes
INNER JOIN Ncc.NetworkNode
\tON Office.vw_LoadNodes.NetworkNodeId = Ncc.NetworkNode.ID
INNER JOIN Ncc.[User]
\tON Office.vw_LoadNodes.UserId = Ncc.[User].ID
WHERE
${(sqlDataLists.length > 0) ? sqlDataLists.map((sqlDataList) =>
`\t(
\t\t(Ncc.${searchUsers ? '[User]' : 'NetworkNode'}.InnerNetworkIdentifier IN (SELECT Id FROM @${sqlDataList.listName}))
\t\tAND
\t\t(Office.vw_LoadNodes.NetNumber = ${sqlDataList.networkNumber})
\t)`
).join("\n\tOR\n") : ''}
${(namesArray.length > 0 && sqlDataLists.length > 0) ? "\tOR" : ''}
${namesArray.map((name) =>
`\t(${searchUsers ? 'Ncc.[User].Name' : 'Office.vw_LoadNodes.Name'} LIKE ${escape(`%${name}%`)})`
).join("\n\tOR\n")}
`

  // Remove double newlines (can't get rid of them in
  //   order to make code above at least somehow readable).
  sqlQuery = sqlQuery.replace(/[\r\n]{2,}/g, "\n")

  return {
    sqlQuery,
    idsOrder: allIdsArray,
    names: namesArray,
  }
}

const buildSqlTopQuery = ({ topNumber, networkNumber }) => {
  let sqlQuery =
`
SELECT TOP ${topNumber}
\tOffice.vw_LoadNodes.NetNumber as NetNumber,
\tOffice.vw_LoadNodes.NodeVipnetInnerId as NodeId,
\tOffice.vw_LoadNodes.Name as NodeName,
\tNcc.[User].InnerNetworkIdentifier as UserId,
\tNcc.[User].Name as UserName
FROM Office.vw_LoadNodes
INNER JOIN Ncc.NetworkNode
\tON Office.vw_LoadNodes.NetworkNodeId = Ncc.NetworkNode.ID
INNER JOIN Ncc.[User]
\tON Office.vw_LoadNodes.UserId = Ncc.[User].ID
WHERE Office.vw_LoadNodes.NetNumber = ${networkNumber}
ORDER BY Office.vw_LoadNodes.NodeVipnetInnerId DESC
`

  sqlQuery = sqlQuery.replace(/[\r\n]{2,}/g, "\n")

  return { sqlQuery }
}
