import { expect } from 'chai'

import queryBuilder from './queryBuilder'

it('should get build query for just nodenames (1)', () => {
  const { sqlQuery: actualQuery } = queryBuilder({ searchQuery: 'lul1' })
  const expectedQuery =
`
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
\t(Office.vw_LoadNodes.Name LIKE '%lul1%')
`

  expect(actualQuery).to.equal(expectedQuery)
})

it('should ignore empty names', () => {
  const { sqlQuery: actualQuery } = queryBuilder({ searchQuery: 'lul1,,' })
  const expectedQuery =
`
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
\t(Office.vw_LoadNodes.Name LIKE '%lul1%')
`

  expect(actualQuery).to.equal(expectedQuery)
})

it('should not break on multiple commas', () => {
  const { sqlQuery: actualQuery } = queryBuilder({ searchQuery: ',,,,' })
  const expectedQuery = undefined

  expect(actualQuery).to.equal(expectedQuery)
})

it('should get build query for just nodenames (2)', () => {
  const { sqlQuery: actualQuery } = queryBuilder({ searchQuery: 'lul1,lul2' })
  const expectedQuery =
`
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
\t(Office.vw_LoadNodes.Name LIKE '%lul1%')
\tOR
\t(Office.vw_LoadNodes.Name LIKE '%lul2%')
`

  expect(actualQuery).to.equal(expectedQuery)
})

it('should get build complex query for nodes and also ids order and also names', () => {
  const {
    sqlQuery: actualQuery,
    idsOrder: actualIdsOrder,
    names: actualNames,
  } = queryBuilder({ searchQuery: '1A0E000b,1a0e000a,0x1a0f000c,lul' })
  const expectedQuery =
`
DECLARE @list_0 TABLE (Id int)
INSERT INTO @list_0 VALUES (11), (10)
DECLARE @list_1 TABLE (Id int)
INSERT INTO @list_1 VALUES (12)
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
\t(
\t\t(Ncc.NetworkNode.InnerNetworkIdentifier IN (SELECT Id FROM @list_0))
\t\tAND
\t\t(Office.vw_LoadNodes.NetNumber = 6670)
\t)
\tOR
\t(
\t\t(Ncc.NetworkNode.InnerNetworkIdentifier IN (SELECT Id FROM @list_1))
\t\tAND
\t\t(Office.vw_LoadNodes.NetNumber = 6671)
\t)
\tOR
\t(Office.vw_LoadNodes.Name LIKE '%lul%')
`
  const expectedIdsOrder = ['0x1a0e000b', '0x1a0e000a', '0x1a0f000c']
  const expectedNames = ['lul']

  expect(actualQuery).to.equal(expectedQuery)
  expect(actualIdsOrder).to.deep.equal(expectedIdsOrder)
  expect(expectedNames).to.deep.equal(expectedNames)
})

it('should get build complex query for users', () => {
  const { sqlQuery: actualQuery } = queryBuilder({ searchQuery: '1A0E000b,1a0e000a,0x1a0f000c,lul', searchUsers: true })
  const expectedQuery =
`
DECLARE @list_0 TABLE (Id int)
INSERT INTO @list_0 VALUES (11), (10)
DECLARE @list_1 TABLE (Id int)
INSERT INTO @list_1 VALUES (12)
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
\t(
\t\t(Ncc.[User].InnerNetworkIdentifier IN (SELECT Id FROM @list_0))
\t\tAND
\t\t(Office.vw_LoadNodes.NetNumber = 6670)
\t)
\tOR
\t(
\t\t(Ncc.[User].InnerNetworkIdentifier IN (SELECT Id FROM @list_1))
\t\tAND
\t\t(Office.vw_LoadNodes.NetNumber = 6671)
\t)
\tOR
\t(Ncc.[User].Name LIKE '%lul%')
`

  expect(actualQuery).to.equal(expectedQuery)
})

it('shouldn\'t unfold ids ranges in order to protect sql server from idiots', () => {
  const { sqlQuery: actualQuery } = queryBuilder({ searchQuery: '0x1a0f0000-0x1a0f00ff' })

  // Ranges should be interpreted like names.
  const expectedQuery =
`
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
\t(Office.vw_LoadNodes.Name LIKE '%0x1a0f0000-0x1a0f00ff%')
`

  expect(actualQuery).to.equal(expectedQuery)
})

// NOTE: we know that in app that requires credentials to DB
//   sql-injection checks are futile, but we do them anyway
//   in case something bad will appear in the search field by accident.
// NOTE: ids are parsed with lib that checks them using
//   regexps, so they should be perfectly safe already.
it('should escape strings', () => {
  const { sqlQuery: actualQuery } = queryBuilder({ searchQuery: 'lul\0lul' })
  const expectedQuery =
`
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
\t(Office.vw_LoadNodes.Name LIKE '%lul\\0lul%')
`

  expect(actualQuery).to.equal(expectedQuery)
})

it('should query top from current network', () => {
  const { sqlQuery: actualQuery } = queryBuilder({ searchQuery: '!top 10', currentNetworkNumber: 6671 })
  const expectedQuery =
`
SELECT TOP 10
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
WHERE Office.vw_LoadNodes.NetNumber = 6671
ORDER BY Office.vw_LoadNodes.NodeVipnetInnerId DESC
`

  expect(actualQuery).to.equal(expectedQuery)
})

it('should query top from specified network', () => {
  const { sqlQuery: actualQuery } = queryBuilder({ searchQuery: '!top 10 6670', currentNetworkNumber: 6671 })
  const expectedQuery =
`
SELECT TOP 10
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
WHERE Office.vw_LoadNodes.NetNumber = 6670
ORDER BY Office.vw_LoadNodes.NodeVipnetInnerId DESC
`

  expect(actualQuery).to.equal(expectedQuery)
})
