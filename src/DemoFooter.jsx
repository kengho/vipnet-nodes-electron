import React from 'react'

import demoData from './demoData.json'

function DemoFooter() {
  // NOTE: TODO: demos wasn't intended to have complicated handlers,
  //   thus simple fat structure and strange code to deal with it.
  //   demoData.json format probably could be optimized.
  const demosNumber = Object.keys(demoData).length / 3 // query, nodes, users

  return (
    <div id="demo-footer-container">
      <span>
      NOTE: by setting <code>"demo: true"</code> in <code>"config.json"</code> you entered limited demo mode.
      <br />
      Available search queries (also works with "Search users" switch):
      </span>
      <ul>
        {
          /* NOTE: React doesn't like regular loops in render, hence this. */
          Array.from(Array(demosNumber)).map((_, demoNumber) =>
            <li key={demoNumber}>{demoData[`DEMO${demoNumber + 1}_QUERY`]}</li>
          )
        }
      </ul>
    </div>
  )
}

export default DemoFooter
