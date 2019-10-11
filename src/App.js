import Badge from '@material-ui/core/Badge'
import Checkbox from '@material-ui/core/Checkbox'
import CircularProgress from '@material-ui/core/CircularProgress'
import CloseIcon from '@material-ui/icons/Close'
import IconButton from '@material-ui/core/IconButton'
import InputAdornment from '@material-ui/core/InputAdornment'
import LogoutIcon from '@material-ui/icons/ExitToApp'
import PersonIcon from '@material-ui/icons/Person'
import PersonOutlineIcon from '@material-ui/icons/PersonOutline'
import React from 'react'
import SearchIcon from '@material-ui/icons/Search'
import TextField from '@material-ui/core/TextField'
import Tooltip from '@material-ui/core/Tooltip'

import './App.css'
import LoginForm from './LoginForm'
import processRecordset from './processRecordset'
import queryBuilder from './queryBuilder'
import SearchResults from './SearchResults'

class App extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      config: {},
      configErrors: [],
      currentNetworkNumber: undefined,
      isConfigRed: false,
      logged: false,
      logging: false,
      pool: undefined,
      searching: false,
      searchQuery: '',
      searchResults: undefined,
      searchUsers: false,
      sqlErrors: [],
    }

    this.handleLoginAttempt = this.handleLoginAttempt.bind(this)
    this.handleLogout = this.handleLogout.bind(this)
    this.handleSearch = this.handleSearch.bind(this)
    this.handleSearchUsersCheckboxClick = this.handleSearchUsersCheckboxClick.bind(this)
    this.handleClearSearchQueryButtonClick = this.handleClearSearchQueryButtonClick.bind(this)
    this.keyDownHandler = this.keyDownHandler.bind(this)
    this.readConfig = this.readConfig.bind(this)

    this.selectableGroupRef = undefined
    this.inputRef = undefined
  }

  componentDidMount() {
    window.addEventListener('keydown', this.keyDownHandler)
    document.title = 'ViPNet Nodes'

    this.readConfig()
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.keyDownHandler)
  }

  readConfig() {
    const fs = require('fs')
    const configPath = 'config.json'
    try {
      const rawConfig = fs.readFileSync(configPath)
      const config = JSON.parse(rawConfig)
      this.setState({ config, isConfigRed: true })
    } catch (e) {
      this.setState({ configErrors: [e] })
      console.log(e)
    }
  }

  keyDownHandler(evt) {
    if (this.searchKeyDownHandler) {
      this.searchKeyDownHandler(evt)
    }

    // Ctrl+F
    if (evt.ctrlKey && evt.code === 'KeyF') {
      evt.preventDefault()
      if (this.inputRef) {
        const inputHTMLElement = this.inputRef.querySelector('input')
        if (inputHTMLElement && inputHTMLElement.focus) {
          inputHTMLElement.focus()
        }
      }
    }
  }

  handleLoginAttempt(evt, selectedDatabaseIndex) {
    evt.preventDefault()
    const config = this.state.config

    this.setState({ logging: true, sqlErrors: [] })

    const sqlConnectConfig = {
      user: evt.target.elements.user.value,
      password: evt.target.elements.password.value,
      server: config.sql.databases[selectedDatabaseIndex].server,
      database: config.sql.databases[selectedDatabaseIndex].database,
    }

    const currentNetworkNumber = config.sql.databases[selectedDatabaseIndex].networkNumber

    global.sql.login(sqlConnectConfig)
      .then((results) => {
        if (results.errors) {
          console.log(results.errors)
          this.setState({ logging: false, sqlErrors: results.errors })

          return Promise.reject()
        } else {
          const pool = results
          this.setState({ logging: false, logged: true, pool, currentNetworkNumber })

          setTimeout(this.handleLogout, config.sql.sessionTTL * 1000)
        }
      })
  }

  handleLogout() {
    global.sql.close()
    this.setState({ pool: undefined, logged: false })
  }

  handleInputOnChange(evt) {
    this.setState({ searchQuery: evt.target.value })
  }

  handleSearch(evt) {
    evt.preventDefault()

    this.setState({ searchResults: undefined })

    if (this.state.searchQuery.length === 0) {
      return
    }

    this.setState({ searching: true })

    const {
      sqlQuery,
      idsOrder,
      names,
    } = queryBuilder({
      searchQuery: this.state.searchQuery,
      searchUsers: this.state.searchUsers,
    })

    if (!this.state.pool) {
      // TODO: print error.
      return
    }

    this.state.pool.request().query(sqlQuery)
      .then((results) => {
        // Could happen if user cleares search query while app is handeling request.
        if (!this.state.searching) {
          return
        }

        const searchResults = processRecordset({
          recordset: results.recordset,
          idsOrder,
          searchUsers: this.state.searchUsers,
          names,
        })

        this.setState({ searchResults, searching: false })

      }).catch((e) => console.log(e))
  }

  handleSearchUsersCheckboxClick(evt) {
    evt.persist()
    this.setState({ searchUsers: !this.state.searchUsers }, () => this.handleSearch(evt))
  }

  handleClearSearchQueryButtonClick() {
    this.setState({ searchResults: undefined, searchQuery: '', searching: false })
  }

  onSearchFieldKeyPressed(evt) {
    // Allow Ctlr+A and other hotkeys in search field.
    evt.nativeEvent.stopImmediatePropagation()
  }

  render() {
    const {
      config,
      configErrors,
      currentNetworkNumber,
      isConfigRed,
      logged,
      logging,
      searching,
      searchQuery,
      searchResults,
      searchUsers,
      sqlErrors,
    } = this.state

    if (configErrors.length > 0) {
      return (
        <div id="config-error-wrapper">
          <div className="error">
            Error reading config.json
          </div>
        </div>
      )
    }

    if (!isConfigRed) {
      return ''
    }
// if (config) {console.log(config)}
    if (!logged) {
      return(
        <LoginForm
          handleLoginAttempt={this.handleLoginAttempt}
          errors={sqlErrors}
          logging={logging}
          config={config}
        />
      )
    } else {
      return (
        <div id="app-container">
          <div id="input-container">
            <form onSubmit={this.handleSearch} id="input-form">
              <TextField
                autoFocus
                label={`Seach in ${currentNetworkNumber}`}
                placeholder="Search for IDs and names (separate items by commas)"
                margin="dense"
                onChange={(evt) => this.handleInputOnChange(evt)}
                onKeyDown={this.onSearchFieldKeyPressed}
                value={searchQuery}
                variant="outlined"
                ref={(r) => this.inputRef = r}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Badge
                        badgeContent={typeof searchResults === 'object' ? searchResults.length.toString() : undefined}
                        color="primary"
                        max={9999}
                        overlap="circle"
                      >
                        <IconButton
                          disabled={searchQuery.length === 0}
                          edge="end"
                          onClick={this.handleSearch}
                          type="submit"
                        >
                          <SearchIcon />
                        </IconButton>
                      </Badge>
                      <Tooltip title="Search users instead of nodes (default: off)">
                        <Checkbox
                          checked={searchUsers}
                          checkedIcon={<PersonIcon />}
                          color="default"
                          edge="end"
                          icon={<PersonOutlineIcon />}
                          onClick={this.handleSearchUsersCheckboxClick}
                        />
                      </Tooltip>
                      <Tooltip title="Clear search query">
                        <div>
                          <IconButton
                            disabled={searchQuery.length === 0}
                            edge="end"
                            onClick={this.handleClearSearchQueryButtonClick}
                            type="submit"
                          >
                            <CloseIcon />
                          </IconButton>
                        </div>
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
                fullWidth
              />
            </form>
            <Tooltip title="Logout">
              <IconButton
                id="logout-button"
                onClick={this.handleLogout}
              >
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </div>
          {searching && <CircularProgress />}
          {!searching && searchResults && searchResults.length > 0 &&
            <React.Fragment>
              <SearchResults
                keyDownHandlerGetter={(f) => this.searchKeyDownHandler = f}
                searchResults={searchResults}
                searchUsers={searchUsers}
                searchFieldInputRef={this.inputRef}
              />
            </React.Fragment>
          }
        </div>
      )
    }
  }
}

export default App
