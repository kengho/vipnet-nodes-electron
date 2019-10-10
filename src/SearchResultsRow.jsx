import { createSelectable } from 'react-selectable-fast'
import React from 'react'
import TableCell from '@material-ui/core/TableCell'
import TableRow from '@material-ui/core/TableRow'

const SearchResultsRow = (props) => {
  const {
    displayUsers,
    isDuplicate,
    isSelected,
    isSelecting,
    nodeId,
    nodeName,
    orderNumber,
    selectableRef,
    userId,
    userName,
  } = props

  const classNames = [
    'search-results-row',
    isSelecting && 'selecting',
    isSelected && 'selected',
    (nodeName === '') && 'not-found',
    isDuplicate && 'duplicate',
  ].filter(Boolean).join(' ')

  let effectiveNodeName
  if (nodeName === '') {
    effectiveNodeName = 'NODE NOT FOUND'
  } else if (!displayUsers && isDuplicate) {
    effectiveNodeName = 'DUPLICATE'
  } else {
    effectiveNodeName = nodeName
  }

  let effectiveUserName
  if (nodeName === '') {
    effectiveUserName = 'USER NOT FOUND'
  } else if (displayUsers && isDuplicate) {
    effectiveUserName = 'DUPLICATE'
  } else {
    effectiveUserName = userName
  }

  return (
    <TableRow ref={selectableRef} className={classNames}>
      <TableCell align="center">{orderNumber}</TableCell>
      <TableCell>{nodeId}</TableCell>
      <TableCell>{effectiveNodeName}</TableCell>
      {displayUsers && <TableCell>{userId}</TableCell>}
      {displayUsers && <TableCell>{effectiveUserName}</TableCell>}
    </TableRow>
  )
}

export default createSelectable(SearchResultsRow)
