import Badge from '@material-ui/core/Badge'
import Checkbox from '@material-ui/core/Checkbox'
import CircularProgress from '@material-ui/core/CircularProgress'
import CloseIcon from '@material-ui/icons/Close'
import IconButton from '@material-ui/core/IconButton'
import InputAdornment from '@material-ui/core/InputAdornment'
import LogoutIcon from '@material-ui/icons/ExitToApp'
import PersonIcon from '@material-ui/icons/Person'
import PersonOutlineIcon from '@material-ui/icons/PersonOutline'
import React, { useRef, useState, useEffect } from 'react'
import SearchIcon from '@material-ui/icons/Search'
import TextField from '@material-ui/core/TextField'
import Tooltip from '@material-ui/core/Tooltip'

import './App.css'
import { version } from './../package.json';
import LoginForm from './LoginForm'
import processRecordset from './processRecordset'
import queryBuilder from './queryBuilder'
import SearchResults from './SearchResults'

function App() {
  const [config, setConfig] = useState(undefined)
  const [configErrors, setConfigErrors] = useState([])
  const [currentNetworkNumber, setCurrentNetworkNumber] = useState(undefined)
  const [isLogged, setIsLogged] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [pool, setPool] = useState(undefined)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(undefined)
  const [searchUsers, setSearchUsers] = useState(false)

  // REVIEW: could it be done better?
  const handleLogout = () => {
    global.sql.close()
    setCurrentNetworkNumber(undefined)
    setIsLogged(false)
    setIsSearching(false)
    setPool(undefined)
    setSearchQuery('')
    setSearchResults(undefined)
    setSearchUsers(false)
  }

  const inputEl = useRef(null)

  // HACK (?): was unable to pass useState setter as prop so it puts searchResultsKeyDownHandler() function to state.
  //   Need te read docs careful and figure out, maybe that's intended way to do it.
  const searchResultsKeyDownHandler = useRef(null)

  // componentDidMount
  useEffect(() => {
    document.title = `ViPNet Nodes ${version}`

    // Read config.
    const fs = require('fs')
    const configPath = 'config.json'
    try {
      const rawConfig = fs.readFileSync(configPath)
      const config = JSON.parse(rawConfig)
      setConfig(config)
    } catch (e) {
      setConfigErrors([e])
      console.log(e)
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', keyDownHandler)

    return () => {
      window.removeEventListener('keydown', keyDownHandler)
    }
  })

  useEffect(() => {
    if (pool) { // Shouldn't run on component mount.
      handleSearch()
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchUsers])

  const keyDownHandler = (evt) => {
    if (searchResultsKeyDownHandler.current) {
      searchResultsKeyDownHandler.current(evt)
    }

    // Ctrl+F
    if (evt.ctrlKey && evt.code === 'KeyF') {
      evt.preventDefault()
      if (inputEl.current) {
        const inputHTMLElement = inputEl.current.querySelector('input')
        if (inputHTMLElement && inputHTMLElement.focus) {
          inputHTMLElement.focus()
        }
      }
    }
  }

  const handleSearch = (evt) => {
    if (evt) {
      evt.preventDefault()
    }

    setSearchResults(undefined)

    if (searchQuery.length === 0) {
      return
    }

    if (!pool) {
      // TODO: print error.
      return
    }

    const { sqlQuery, idsOrder, names } = queryBuilder({ searchQuery, searchUsers })
    if (!sqlQuery) {
      return
    }

    setIsSearching(true)

    // TODO: reject promise if user cancels search.
    //   Couldn't even test this scenario because our DB is too fast.
    pool.request().query(sqlQuery)
      .then((results) => {
        const searchResults = processRecordset({
          recordset: results.recordset,
          idsOrder,
          searchUsers: searchUsers,
          names,
        })
        setSearchResults(searchResults)
        setIsSearching(false)
      }).catch((e) => console.log(e))
  }

  if (!config) {
    return ''
  }

  if (configErrors.length > 0) {
    return (
      <div id="config-error-wrapper">
        <div className="error">
          Error reading config.json
        </div>
      </div>
    )
  }

  if (!isLogged) {
    return(
      <LoginForm
        config={config}
        handleLogout={handleLogout}
        onSuccessfulLogin={({ pool, isLogged, currentNetworkNumber }) => {
          setPool(pool)
          setIsLogged(true)
          setCurrentNetworkNumber(currentNetworkNumber)
        }}
      />
    )
  } else {
    let okResultsNumber
    if (typeof searchResults === 'object') {
      okResultsNumber = searchResults.filter((searchResult) => searchResult.nodeName && !searchResult.isDuplicate).length
    }

    return (
      <div id="app-container">
        <div id="input-container">
          <form onSubmit={handleSearch} id="input-form">
            <TextField
              autoFocus
              label={`Seach in ${currentNetworkNumber}`}
              placeholder="Search for IDs and names (separate items by commas)"
              margin="dense"
              onChange={(evt) => setSearchQuery(evt.target.value)}
              onKeyDown={(evt) => evt.nativeEvent.stopImmediatePropagation() /* allow Ctlr+A and other hotkeys in search field */}
              value={searchQuery}
              variant="outlined"
              ref={inputEl}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Badge
                      badgeContent={typeof searchResults === 'object' ? okResultsNumber.toString() : undefined}
                      color="primary"
                      max={Infinity}
                      overlap="circle"
                    >
                      <IconButton
                        disabled={isSearching || searchQuery.length === 0}
                        edge="end"
                        onClick={handleSearch}
                        type="submit"
                      >
                        <SearchIcon />
                      </IconButton>
                    </Badge>
                    <Tooltip title="Search users instead of nodes (default: off)">
                      <Checkbox
                        disabled={isSearching}
                        checked={searchUsers}
                        checkedIcon={<PersonIcon />}
                        color="default"
                        edge="end"
                        icon={<PersonOutlineIcon />}
                        onClick={() => setSearchUsers(!searchUsers)}
                      />
                    </Tooltip>
                    <Tooltip title="Clear search query">
                      <div>
                        <IconButton
                          disabled={searchQuery.length === 0}
                          edge="end"
                          onClick={() => {
                            setSearchResults(undefined)
                            setSearchQuery('')
                            setIsSearching(false)
                          }}
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
              onClick={handleLogout}
            >
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </div>
        {isSearching && <CircularProgress />}
        {!isSearching && searchResults && searchResults.length > 0 &&
          <SearchResults
            liftKeyDownHandler={(f) => searchResultsKeyDownHandler.current = f}
            okResultsNumber={okResultsNumber}
            searchFieldInputEl={inputEl.current}
            searchResults={searchResults}
            searchUsers={searchUsers}
          />
        }
      </div>
    )
  }
}

export default App
