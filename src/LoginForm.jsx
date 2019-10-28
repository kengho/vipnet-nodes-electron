import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown'
import Button from '@material-ui/core/Button'
import ButtonGroup from '@material-ui/core/ButtonGroup'
import ClickAwayListener from '@material-ui/core/ClickAwayListener'
import Grow from '@material-ui/core/Grow'
import MenuItem from '@material-ui/core/MenuItem'
import MenuList from '@material-ui/core/MenuList'
import Paper from '@material-ui/core/Paper'
import Popper from '@material-ui/core/Popper'
import React, { useRef, useState } from 'react'
import TextField from '@material-ui/core/TextField'

import demoData from './demoData.json'

function LoginForm({
  config,
  handleLogout,
  onSuccessfulLogin,
}) {
  const defaultDatabaseIndex = config.sql.databases
    .sort((a, b) => a.networkNumber - b.networkNumber)
    .findIndex((database) => database.default === true)

  const [selectedDatabaseIndex, setSelectedDatabaseIndex] = useState(defaultDatabaseIndex || 0)
  const [loginMenuOpen, setLoginMenuOpen] = useState(false)
  const [isLogging, setIsLogging] = useState(false)
  const [sqlErrors, setSqlErrors] = useState([])

  const anchorEl = useRef(null)

  const handleLoginAttempt = (evt, config, selectedDatabaseIndex) => {
    evt.preventDefault()
    setIsLogging(true)
    setSqlErrors([])

    const sqlConnectConfig = {
      user: evt.target.elements.user.value,
      password: evt.target.elements.password.value,
      server: config.sql.databases[selectedDatabaseIndex].server,
      database: config.sql.databases[selectedDatabaseIndex].database,
      demo: config.demo,
    }

    const currentNetworkNumber = config.sql.databases[selectedDatabaseIndex].networkNumber

    global.sql.login(sqlConnectConfig, demoData)
      .then((results) => {
        if (results.errors) {
          console.log(results.errors)
          setIsLogging(false)
          setSqlErrors(results.errors)

          return Promise.reject()
        } else {
          setIsLogging(false)
          onSuccessfulLogin({ isLogged: true, pool: results, currentNetworkNumber })
          setTimeout(handleLogout, config.sql.sessionTTL * 1000)
        }
      })
  }

  return (
    <div id="login-container">
      <form
        onSubmit={(evt) => handleLoginAttempt(evt, config, selectedDatabaseIndex)}
        id="login-form"
      >
        <TextField
          autoFocus
          label={config.demo ? "User (in demo: anything)" : "User"}
          margin="dense"
          name="user"
          variant="outlined"
          fullWidth
        />
        <TextField
          label={config.demo ? "Password (also anything)" : "Password"}
          margin="dense"
          name="password"
          type="password"
          variant="outlined"
          fullWidth
        />
        <ButtonGroup
          fullWidth
          variant="contained"
          color="primary"
          id="login-button-group"
        >
          <Button
            disabled={isLogging}
            type="submit"
          >
            login to
          </Button>
          <Button
            color="primary"
            disabled={isLogging}
            onClick={() => setLoginMenuOpen(true)}
            ref={anchorEl}
            size="small"
          >
            {config.sql.databases[selectedDatabaseIndex].networkNumber}
            <ArrowDropDownIcon />
          </Button>
        </ButtonGroup>
        <Popper open={loginMenuOpen} anchorEl={anchorEl.current} transition disablePortal>
          {({ TransitionProps }) => (
            <Grow
              {...TransitionProps}
              style={{
                transformOrigin: 'bottom',
              }}
            >
              <Paper>
                <ClickAwayListener onClickAway={() => setLoginMenuOpen(false)}>
                  <MenuList>
                    {config.sql.databases
                      .sort((a, b) => a.networkNumber - b.networkNumber)
                      .map((databaseProps, index) => (
                        <MenuItem
                          key={databaseProps.networkNumber}
                          selected={index === selectedDatabaseIndex}
                          onClick={(evt) => {
                            setLoginMenuOpen(false)
                            setSelectedDatabaseIndex(index)
                          }}
                        >
                          {databaseProps.networkNumber}
                        </MenuItem>
                    ))}
                  </MenuList>
                </ClickAwayListener>
              </Paper>
            </Grow>
          )}
        </Popper>
        <div
          className="error"
          style={{ opacity: sqlErrors.length === 0 ? 0 : 1}}
        >
          Login error, try again
        </div>
      </form>
    </div>
  )
}

export default LoginForm
