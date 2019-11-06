import { expect } from 'chai'

import processRecordset from './processRecordset'

it('should process single existing node id', () => {
  const actualSearchResults = processRecordset({
    recordset: [{
      NetNumber: 6671,
      NodeId: 1,
      NodeName: 'test1_node',
      UserId: 2,
      UserName: 'test1_user',
    }],
    idsOrder: ['0x1a0f0001'],
    searchUsers: false,
    names: [],
  })
  const expectedSearchResults = [{
    nodeId: '0x1a0f0001',
    userId: '0x1a0f0002',
    nodeName: 'test1_node',
    userName: 'test1_user',
  }]

  expect(actualSearchResults).to.deep.equal(expectedSearchResults)
})

it('should process single existing user id', () => {
  const actualSearchResults = processRecordset({
    recordset: [{
      NetNumber: 6671,
      NodeId: 1,
      NodeName: 'test1_node',
      UserId: 2,
      UserName: 'test1_user',
    }],
    idsOrder: ['0x1a0f0002'],
    searchUsers: true,
    names: [],
  })
  const expectedSearchResults = [{
    nodeId: '0x1a0f0001',
    userId: '0x1a0f0002',
    nodeName: 'test1_node',
    userName: 'test1_user',
  }]

  expect(actualSearchResults).to.deep.equal(expectedSearchResults)
})

it('should process several existing different node ids', () => {
  const actualSearchResults = processRecordset({
    recordset: [
      {
        NetNumber: 6671,
        NodeId: 1,
        NodeName: 'test1_node',
        UserId: 2,
        UserName: 'test1_user',
      }, {
        NetNumber: 6671,
        NodeId: 2,
        NodeName: 'test2_node',
        UserId: 3,
        UserName: 'test2_user',
      }
    ],
    idsOrder: ['0x1a0f0001', '0x1a0f0002'],
    searchUsers: false,
    names: [],
  })
  const expectedSearchResults = [
    {
      nodeId: '0x1a0f0001',
      userId: '0x1a0f0002',
      nodeName: 'test1_node',
      userName: 'test1_user',
    }, {
      nodeId: '0x1a0f0002',
      userId: '0x1a0f0003',
      nodeName: 'test2_node',
      userName: 'test2_user',
    }
  ]

  expect(actualSearchResults).to.deep.equal(expectedSearchResults)
})

it('should process several existing different user ids', () => {
  const actualSearchResults = processRecordset({
    recordset: [
      {
        NetNumber: 6671,
        NodeId: 1,
        NodeName: 'test1_node',
        UserId: 2,
        UserName: 'test1_user',
      }, {
        NetNumber: 6671,
        NodeId: 2,
        NodeName: 'test2_node',
        UserId: 3,
        UserName: 'test2_user',
      }
    ],
    idsOrder: ['0x1a0f0002', '0x1a0f0003'],
    searchUsers: true,
    names: [],
  })
  const expectedSearchResults = [
    {
      nodeId: '0x1a0f0001',
      userId: '0x1a0f0002',
      nodeName: 'test1_node',
      userName: 'test1_user',
    }, {
      nodeId: '0x1a0f0002',
      userId: '0x1a0f0003',
      nodeName: 'test2_node',
      userName: 'test2_user',
    }
  ]

  expect(actualSearchResults).to.deep.equal(expectedSearchResults)
})

it('should process several existing same node ids', () => {
  const actualSearchResults = processRecordset({
    recordset: [{
      NetNumber: 6671,
      NodeId: 1,
      NodeName: 'test1_node',
      UserId: 2,
      UserName: 'test1_user',
    }],
    idsOrder: ['0x1a0f0001', '0x1a0f0001'],
    searchUsers: false,
    names: [],
  })
  const expectedSearchResults = [
    {
      nodeId: '0x1a0f0001',
      userId: '0x1a0f0002',
      nodeName: 'test1_node',
      userName: 'test1_user',
    }, {
      nodeId: '0x1a0f0001',
      userId: '0x1a0f0002',
      nodeName: 'test1_node',
      userName: 'test1_user',
      isDuplicate: true,
    }
  ]

  expect(actualSearchResults).to.deep.equal(expectedSearchResults)
})

it('should found duplicates across entire list', () => {
  const actualSearchResults = processRecordset({
    recordset: [
      {
        NetNumber: 6671,
        NodeId: 1,
        NodeName: 'test1_node',
        UserId: 2,
        UserName: 'test1_user',
      }, {
        NetNumber: 6671,
        NodeId: 2,
        NodeName: 'test2_node',
        UserId: 3,
        UserName: 'test2_user',
      }, {
        NetNumber: 6671,
        NodeId: 1,
        NodeName: 'test1_node',
        UserId: 2,
        UserName: 'test1_user',
      },
    ],
    idsOrder: ['0x1a0f0002', '0x1a0f0003', '0x1a0f0002'],
    searchUsers: true,
    names: [],
  })
  const expectedSearchResults = [
    {
      nodeId: '0x1a0f0001',
      userId: '0x1a0f0002',
      nodeName: 'test1_node',
      userName: 'test1_user',
    }, {
      nodeId: '0x1a0f0002',
      userId: '0x1a0f0003',
      nodeName: 'test2_node',
      userName: 'test2_user',
    }, {
      nodeId: '0x1a0f0001',
      userId: '0x1a0f0002',
      nodeName: 'test1_node',
      userName: 'test1_user',
      isDuplicate: true,
    },
  ]

  expect(actualSearchResults).to.deep.equal(expectedSearchResults)
})

it('should process several existing same user ids', () => {
  const actualSearchResults = processRecordset({
    recordset: [{
      NetNumber: 6671,
      NodeId: 1,
      NodeName: 'test1_node',
      UserId: 2,
      UserName: 'test1_user',
    }],
    idsOrder: ['0x1a0f0002', '0x1a0f0002'],
    searchUsers: true,
    names: [],
  })
  const expectedSearchResults = [
    {
      nodeId: '0x1a0f0001',
      userId: '0x1a0f0002',
      nodeName: 'test1_node',
      userName: 'test1_user',
    }, {
      nodeId: '0x1a0f0001',
      userId: '0x1a0f0002',
      nodeName: 'test1_node',
      userName: 'test1_user',
      isDuplicate: true,
    }
  ]

  expect(actualSearchResults).to.deep.equal(expectedSearchResults)
})

it('should create dummy records for not existing node ids', () => {
  const actualSearchResults = processRecordset({
    recordset: [{
      NetNumber: 6671,
      NodeId: 1,
      NodeName: 'test1_node',
      UserId: 2,
      UserName: 'test1_user',
    }],
    idsOrder: ['0x1a0f0003'],
    searchUsers: false,
    names: [],
  })
  const expectedSearchResults = [{
    nodeId: '0x1a0f0003',
    userId: '',
    nodeName: '',
    userName: '',
  }]

  expect(actualSearchResults).to.deep.equal(expectedSearchResults)
})

it('should create dummy records for not existing user ids', () => {
  const actualSearchResults = processRecordset({
    recordset: [{
      NetNumber: 6671,
      NodeId: 1,
      NodeName: 'test1_node',
      UserId: 2,
      UserName: 'test1_user',
    }],
    idsOrder: ['0x1a0f0003'],
    searchUsers: true,
    names: [],
  })
  const expectedSearchResults = [{
    nodeId: '',
    userId: '0x1a0f0003',
    nodeName: '',
    userName: '',
  }]

  expect(actualSearchResults).to.deep.equal(expectedSearchResults)
})

it('should return just normalized data if there are names in search query', () => {
  const actualSearchResults = processRecordset({
    recordset: [
      {
        NetNumber: 6671,
        NodeId: 1,
        NodeName: 'test1_node',
        UserId: 2,
        UserName: 'test1_user',
      }, {
        NetNumber: 6671,
        NodeId: 2,
        NodeName: 'test2_node',
        UserId: 3,
        UserName: 'test2_user',
      }
    ],
    idsOrder: ['0x1a0f0002'],
    searchUsers: true,
    names: ['test2_node'],
  })
  const expectedSearchResults = [
    {
      nodeId: '0x1a0f0001',
      userId: '0x1a0f0002',
      nodeName: 'test1_node',
      userName: 'test1_user',
    }, {
      nodeId: '0x1a0f0002',
      userId: '0x1a0f0003',
      nodeName: 'test2_node',
      userName: 'test2_user',
    }
  ]

  expect(actualSearchResults).to.deep.equal(expectedSearchResults)
})

it('should return just normalized data if there are no names or ids in query (!top queries)', () => {
  const actualSearchResults = processRecordset({
    recordset: [
      {
        NetNumber: 6671,
        NodeId: 1,
        NodeName: 'test1_node',
        UserId: 2,
        UserName: 'test1_user',
      }, {
        NetNumber: 6671,
        NodeId: 2,
        NodeName: 'test2_node',
        UserId: 3,
        UserName: 'test2_user',
      }
    ],
    idsOrder: [],
    names: [],
  })
  const expectedSearchResults = [
    {
      nodeId: '0x1a0f0001',
      userId: '0x1a0f0002',
      nodeName: 'test1_node',
      userName: 'test1_user',
    }, {
      nodeId: '0x1a0f0002',
      userId: '0x1a0f0003',
      nodeName: 'test2_node',
      userName: 'test2_user',
    }
  ]

  expect(actualSearchResults).to.deep.equal(expectedSearchResults)
})
