import { clipboard } from 'electron'
import { SelectableGroup, SelectAll, DeselectAll } from 'react-selectable-fast'
import Button from '@material-ui/core/Button'
import ButtonGroup from '@material-ui/core/ButtonGroup'
import Paper from '@material-ui/core/Paper'
import React from 'react'
import SelectableSearchResultsRow from './SearchResultsRow'
import Snackbar from '@material-ui/core/Snackbar'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'

class SearchResults extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      selectedRowsProps: [],
      snackbarOpen: false,
    }

    this.handleSelectionFinish = this.handleSelectionFinish.bind(this)
    this.handleCopyToClipboardButtonClick = this.handleCopyToClipboardButtonClick.bind(this)
    this.handleCopyWithHeadersButtonClick = this.handleCopyWithHeadersButtonClick.bind(this)
    this.handleSnackbarClose = this.handleSnackbarClose.bind(this)
    this.exportSelectedRecords = this.exportSelectedRecords.bind(this)
    this.keyDownHandler = this.keyDownHandler.bind(this)

    this.selectableGroupRef = undefined
  }

  componentDidMount() {
    this.props.keyDownHandlerGetter(this.keyDownHandler)
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (
      (nextProps.searchResults !== this.props.searchResults) ||
      (nextState !== this.state)
    )
  }

  keyDownHandler(evt) {
    // Ctrl+A
    if (evt.ctrlKey && evt.code === 'KeyA') {
      evt.preventDefault()
      if (this.selectableGroupRef) {
        this.selectableGroupRef.selectAll()
      }
    }

    // Ctlr+C
    if (evt.ctrlKey && evt.code === 'KeyC') {
      evt.preventDefault()
      this.handleCopyToClipboardButtonClick()
    }
  }

  handleSelectionFinish(selectedReactComponents) {
    this.setState({ selectedRowsProps: selectedReactComponents.map(component => component.props) })

    // This code loses focus from search field after row click.
    // TODO: consider removing this after this issue is resolved:
    //   https://github.com/valerybugakov/react-selectable-fast/issues/31
    if (this.props.searchFieldInputRef) {
      this.props.searchFieldInputRef.querySelector('input').blur()
    }
  }

  handleCopyToClipboardButtonClick() {
    this.setState({ snackbarOpen: true })

    const { exportedSelectedRecords } = this.exportSelectedRecords()
    clipboard.writeText(exportedSelectedRecords)
  }

  handleCopyWithHeadersButtonClick() {
    this.setState({ snackbarOpen: true })

    const { exportedSelectedRecords, exportedHeaders } = this.exportSelectedRecords()
    clipboard.writeText(`${exportedHeaders}\n${exportedSelectedRecords}`)
  }

  handleSnackbarClose() {
    this.setState({ snackbarOpen: false })
  }

  exportSelectedRecords() {
    const exportedSelectedRecords = this.state.selectedRowsProps.map((searchResultProps) => {
      let text = `${searchResultProps.nodeId}\t${searchResultProps.nodeName}`
      if (this.props.searchUsers) {
        text += `\t${searchResultProps.userId}\t${searchResultProps.userName}`
      }

      return text
    }).join("\n")

    const exportedHeaders = [
      this.tableHeadersAliases.nodeId,
      this.tableHeadersAliases.nodeName,
      ...(this.props.searchUsers ? [
        this.tableHeadersAliases.userId,
      ] : []),
      ...(this.props.searchUsers ? [
        this.tableHeadersAliases.userName,
      ] : []),
    ].join("\t")

    return { exportedSelectedRecords, exportedHeaders }
  }

  tableHeadersAliases = {
    'nodeId': 'Node ID',
    'nodeName': 'Node name',
    'userId': 'User ID',
    'userName': 'User name',
  }

  render() {
    const {
      searchResults,
      searchUsers,
    } = this.props
    const displayUsers = searchUsers

    return (
      <div id="search-results-container">
        <SelectableGroup
          allowClickWithoutSelected={true}
          className="search-results-selectable-wrapper"
          enableDeselect
          globalMouse={false}
          mixedDeselect
          onSelectionFinish={this.handleSelectionFinish}
          tolerance={10}
          ignoreList={[
            '#copy-to-clipboard-button',
            '#copy-with-headers-button',
            '.not-found',
            '.duplicate',
          ]}
          ref={(ref) => this.selectableGroupRef = ref}
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
              select all
            </SelectAll>
            <Button
              disabled={this.state.selectedRowsProps.length === 0}
              id="copy-to-clipboard-button"
              onClick={this.handleCopyToClipboardButtonClick}
              variant="contained"
            >
              copy to clipboard
            </Button>
            <Button
              disabled={this.state.selectedRowsProps.length === 0}
              id="copy-with-headers-button"
              onClick={this.handleCopyWithHeadersButtonClick}
              variant="contained"
            >
              copy with headers
            </Button>
            <DeselectAll
              component={Button}
              disabled={this.state.selectedRowsProps.length === 0}
              id="deselect-all-button"
            >
              clear selection
            </DeselectAll>
          </ButtonGroup>
          <Paper id="search-results-paper">
            <Table size="small">
              <TableHead id="search-results-table-head">
                <TableRow>
                  <TableCell align="center">№</TableCell>
                  <TableCell>{this.tableHeadersAliases['nodeId']}</TableCell>
                  <TableCell>{this.tableHeadersAliases['nodeName']}</TableCell>
                  {displayUsers && <TableCell>{this.tableHeadersAliases['userId']}</TableCell>}
                  {displayUsers && <TableCell>{this.tableHeadersAliases['userName']}</TableCell>}
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
        <div id="click-away-space" onClick={() => this.selectableGroupRef.clearSelection()} />
        <div id="footer" />
        <Snackbar
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          autoHideDuration={2000}
          id="search-results-snackbar"
          message="Data copied to clipboard"
          onClose={this.handleSnackbarClose}
          open={this.state.snackbarOpen}
        />
      </div>
    )
  }
}

export default SearchResults
