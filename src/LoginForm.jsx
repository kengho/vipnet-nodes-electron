import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown'
import Button from '@material-ui/core/Button'
import ButtonGroup from '@material-ui/core/ButtonGroup'
import ClickAwayListener from '@material-ui/core/ClickAwayListener'
import Grow from '@material-ui/core/Grow'
import MenuItem from '@material-ui/core/MenuItem'
import MenuList from '@material-ui/core/MenuList'
import Paper from '@material-ui/core/Paper'
import Popper from '@material-ui/core/Popper'
import React from 'react'
import TextField from '@material-ui/core/TextField'

class LoginForm extends React.Component {
  constructor(props) {
    super(props)

    const defaultDatabaseIndex = this.props.config.sql.databases
      .sort((a, b) => a.networkNumber - b.networkNumber)
      .findIndex((database) => database.default === true)

    this.state = {
      loginMenuOpen: false,
      selectedDatabaseIndex: defaultDatabaseIndex || 0,
    }

    this.handleMenuToggle = this.handleMenuToggle.bind(this)
    this.handleMenuItemClick = this.handleMenuItemClick.bind(this)
    this.handleMenuClose = this.handleMenuClose.bind(this)

    this.anchorRef = undefined
  }

  handleMenuToggle() {
    this.setState({ loginMenuOpen: !this.state.loginMenuOpen })
  }

  handleMenuClose() {
    this.setState({ loginMenuOpen: false })
  }

  handleMenuItemClick(evt, optionIndex) {
    this.setState({
      selectedDatabaseIndex: optionIndex,
      loginMenuOpen: false,
    })
  }

  render() {
    const {
      loginMenuOpen,
      selectedDatabaseIndex,
    } = this.state

    const {
      config,
      errors,
      logging,
    } = this.props

    return (
      <div id="login-container">
        <form
          onSubmit={(evt) => this.props.handleLoginAttempt(evt, selectedDatabaseIndex)}
          id="login-form"
        >
          <TextField
            autoFocus
            label="User"
            margin="dense"
            name="user"
            variant="outlined"
            fullWidth
          />
          <TextField
            label="Password"
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
              disabled={logging}
              type="submit"
            >
              login to
            </Button>
            <Button
              color="primary"
              disabled={logging}
              onClick={this.handleMenuToggle}
              ref={(r) => this.anchorRef = r}
              size="small"
            >
              {config.sql.databases[selectedDatabaseIndex].networkNumber}
              <ArrowDropDownIcon />
            </Button>
          </ButtonGroup>
          <Popper open={loginMenuOpen} anchorEl={this.anchorRef} transition disablePortal>
            {({ TransitionProps }) => (
              <Grow
                {...TransitionProps}
                style={{
                  transformOrigin: 'bottom',
                }}
              >
                <Paper>
                  <ClickAwayListener onClickAway={this.handleMenuClose}>
                    <MenuList>
                      {config.sql.databases
                        .sort((a, b) => a.networkNumber - b.networkNumber)
                        .map((databaseProps, index) => (
                          <MenuItem
                            key={databaseProps.networkNumber}
                            selected={index === selectedDatabaseIndex}
                            onClick={event => this.handleMenuItemClick(event, index)}
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
            style={{ opacity: errors.length === 0 ? 0 : 1}}
          >
            Login error, try again
          </div>
        </form>
      </div>
    )
  }
}

export default LoginForm
