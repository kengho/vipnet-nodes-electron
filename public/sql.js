// REVIEW: how to do it right? Placing sql code in React component leads to
//   "require is undefined" error despite "nodeIntegration" is set to "true" in electron.js.
global.sql = {
  login: function (config, demoData) {
    if (config.demo) {
      global.sql.close = () => {}
      return new Promise((resolve) => resolve(
        {
          request: () => {
            return {
              query: (sqlQuery) => new Promise((resolve) => {
                resolve({ recordset: demoData[sqlQuery] })
              })
            }
          },
        }
      ))
    }

    const sql = require('mssql')

    // REVIEW: should we close sql connection anywhere in electron.js and how to test it?
    global.sql.close = sql.close
    return sql.connect(config)
      .catch((e) => {
        sql.close()
        return { errors: [e] }
      })
  },
}
