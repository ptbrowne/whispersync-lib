/* eslint-disable no-console */

const fs = require('fs')
const path = require('path')
const { parseSidecarBytes } = require('./sidecar')

const TEST_FOLDER = path.join(__dirname, 'tests')

const sidebarFilenames = fs
  .readdirSync(TEST_FOLDER)
  .filter(filename => filename.endsWith('.sidecar'))

for (let sidebarFilename of sidebarFilenames) {
  it(`should parse ${sidebarFilename}`, () => {
    const bytes = fs.readFileSync(path.join(TEST_FOLDER, sidebarFilename))
    expect(() => {
      const parsed = parseSidecarBytes(bytes)
    }).not.toThrow()
  })
}
