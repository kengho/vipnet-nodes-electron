import React from 'react'

import demoData from './demoData.json'

function DemoFooter() {
  return (
    <div id="demo-footer-container">
      <span>
      NOTE: by setting <code>"demo: true"</code> in <code>"config.json"</code> you entered limited demo mode.
      <br />
      Available search queries (also works with "Search users" switch):
      </span>
      <ul>
        <li>{demoData['DEMO1_QUERY']}</li>
        <li>{demoData['DEMO2_QUERY']}</li>
        <li>{demoData['DEMO3_QUERY']}</li>
      </ul>
    </div>
  )
}

export default DemoFooter
