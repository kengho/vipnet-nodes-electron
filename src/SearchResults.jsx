import { clipboard } from 'electron'
import { SelectableGroup, SelectAll, DeselectAll } from 'react-selectable-fast'
import Button from '@material-ui/core/Button'
import ButtonGroup from '@material-ui/core/ButtonGroup'
import Paper from '@material-ui/core/Paper'
import React, { useState, useRef, useEffect, memo } from 'react'
import SelectableSearchResultsRow from './SearchResultsRow'
import Snackbar from '@material-ui/core/Snackbar'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'

const areEqual = (prevProps, nextProps) => prevProps.searchResults === nextProps.searchResults

function SearchResults({
  searchFieldInputEl,
  liftKeyDownHandler,
  searchResults,
  okResultsNumber,
  searchUsers,
}) {
  const [selectedRowsProps, setSelectedRowsProps] = useState([])
  const [snackbarOpen, setSnackbarOpen] = useState(false)

  const selectableGroupEl = useRef(null)

  const keyDownHandler = (evt) => {
    // Ctrl+A
    if (evt.ctrlKey && evt.code === 'KeyA') {
      evt.preventDefault()
      if (selectableGroupEl.current) {
        selectableGroupEl.current.selectAll()
      }
    }

    // Ctlr+C
    if (evt.ctrlKey && evt.code === 'KeyC') {
      // Allow selection text in duplicate and not found rows.
      const currentSelection = window.getSelection().toString()
      if (currentSelection.length > 0) {
        return
      }

      evt.preventDefault()
      handleCopyToClipboardButtonClick()
    }
  }

  useEffect(() => {
    liftKeyDownHandler(keyDownHandler)
  })

  const handleSelectionFinish = (selectedReactComponents) => {
    setSelectedRowsProps(
      selectedReactComponents
        .sort((a, b) => a.props.orderNumber - b.props.orderNumber)
        .map(component => component.props)
    )

    // This code loses focus from search field after row click.
    // TODO: consider removing this after this issue is resolved:
    //   https://github.com/valerybugakov/react-selectable-fast/issues/31
    if (searchFieldInputEl) {
      searchFieldInputEl.querySelector('input').blur()
    }
  }

  const handleCopyToClipboardButtonClick = () => {
    setSnackbarOpen(true)

    const { exportedSelectedRecords } = exportSelectedRecords()
    clipboard.writeText(exportedSelectedRecords)
  }

  const handleCopyWithHeadersButtonClick = () => {
    setSnackbarOpen(true)

    const { exportedSelectedRecords, exportedHeaders } = exportSelectedRecords()
    clipboard.writeText(`${exportedHeaders}\n${exportedSelectedRecords}`)
  }

  const exportSelectedRecords = () => {
    const exportedSelectedRecords = selectedRowsProps.map((searchResultProps) => {
      let text = `${searchResultProps.nodeId}\t${searchResultProps.nodeName}`
      if (searchUsers) {
        text += `\t${searchResultProps.userId}\t${searchResultProps.userName}`
      }

      return text
    }).join("\n")

    const exportedHeaders = [
      tableHeadersAliases.nodeId,
      tableHeadersAliases.nodeName,
      ...(searchUsers ? [
        tableHeadersAliases.userId,
      ] : []),
      ...(searchUsers ? [
        tableHeadersAliases.userName,
      ] : []),
    ].join("\t")

    return { exportedSelectedRecords, exportedHeaders }
  }

  const tableHeadersAliases = {
    'nodeId': 'Node ID',
    'nodeName': 'Node name',
    'userId': 'User ID',
    'userName': 'User name',
  }

  const displayUsers = searchUsers

  return (
    <div id="search-results-container">
      <SelectableGroup
        allowClickWithoutSelected={true}
        className="search-results-selectable-wrapper"
        enableDeselect
        globalMouse={false}
        mixedDeselect
        onSelectionFinish={handleSelectionFinish}
        tolerance={1 /* 0 = could select 2 lines at once; 10 = sometimes couldn't any; 1 = can't select exactly at border */}
        ignoreList={[
          '#search-results-button-group',
          '.not-found',
          '.duplicate',
        ]}
        ref={selectableGroupEl}
      >
        <ButtonGroup
          id="search-results-button-group"
          fullWidth
          variant="contained"
        >
          <SelectAll
            component={Button}
            id="select-all-button"
          >
            {/* \u00A0 - nbsp*/}{`select all\u00A0(${okResultsNumber})`}
          </SelectAll>
          <Button
            disabled={selectedRowsProps.length === 0}
            id="copy-to-clipboard-button"
            onClick={handleCopyToClipboardButtonClick}
            variant="contained"
          >
            copy to clipboard
          </Button>
          <Button
            disabled={selectedRowsProps.length === 0}
            id="copy-with-headers-button"
            onClick={handleCopyWithHeadersButtonClick}
            variant="contained"
          >
            copy with headers
          </Button>
          <DeselectAll
            component={Button}
            disabled={selectedRowsProps.length === 0}
            id="deselect-all-button"
          >
            {`clear selection\u00A0(${selectedRowsProps.length})`}
          </DeselectAll>
        </ButtonGroup>
        <Paper id="search-results-paper">
          <Table size="small">
            <TableHead id="search-results-table-head">
              <TableRow>
                <TableCell align="center">№</TableCell>
                <TableCell>{tableHeadersAliases['nodeId']}</TableCell>
                <TableCell>{tableHeadersAliases['nodeName']}</TableCell>
                {displayUsers && <TableCell>{tableHeadersAliases['userId']}</TableCell>}
                {displayUsers && <TableCell>{tableHeadersAliases['userName']}</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {searchResults.map((searchResult, i) =>
                <SelectableSearchResultsRow
                  nodeId={searchResult.nodeId}
                  nodeName={searchResult.nodeName}
                  userId={searchResult.userId}
                  userName={searchResult.userName}
                  displayUsers={displayUsers}
                  isDuplicate={searchResult.isDuplicate}
                  key={`${searchResult.nodeId}-${i}`}
                  orderNumber={i + 1}
                />
              )}
            </TableBody>
          </Table>
        </Paper>
      </SelectableGroup>
      <div id="click-away-space" onClick={() => selectableGroupEl.current.clearSelection()} />
      <div id="footer" />
      <Snackbar
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        autoHideDuration={2000}
        id="search-results-snackbar"
        message="Data copied to clipboard"
        onClose={() => {console.log('here');setSnackbarOpen(false)}}
        open={snackbarOpen}
      />
    </div>
  )
}

export default memo(SearchResults, areEqual)
