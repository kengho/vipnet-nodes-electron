# Summary

Goal was to create standalone app for smart querying ViPNet™ MSSQL database for ViPNet™ administrators that already have full access to that database. Solution was supposed to require minimal setup on the database side.

And it does exactly that.

# Setup

App requires to setup databases users at least with read permissions.


## Dev

```
yarn install
cp config.example.json config.json
// then setup config

yarn electron-dev

// test
yarn test

// build
yarn electron-pack
```

## Production

Just run app.

# Known issues

* super-huge bundle size (not an issue for target users, won't be fixed)
* insecure sql connection (ViPNet™ administrators should be using ViPNet™ Client that secures connections anyway, won't be fixed)
* state management is little messy
* couldn't link nodejs `mssql` package with React despite `nodeIntegration` was set to `true`. As workaround, there's global object `global.sql` that is accessed from React code in order to make queries
* after quick search when you search something heavy search icon badge is bugging

# TODO

* add MobX/Redux/etc or just refactor thoroughly
* add "register global hotkey" button for Windows
* add "search for user" button in every row
* describe database tables and fields that could be red
* add screenshots and/or demos
* add tests for UI (at least using actual words, not necessary code)
* i18n
* handle electron warnings in console
* consider using "mssql" module built-in SQL injection protection instead of "sqlstring"
* figure out how to hide app menu and toggle it by pressing Alt button

# License

vipnet-nodes-electron is distributed under the MIT-LICENSE.

ViPNet™ is registered trademark of InfoTeCS Gmbh, Russia.
