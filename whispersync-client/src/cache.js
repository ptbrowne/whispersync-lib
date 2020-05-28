/**
 * Exports functions to read saved data if available
 * or fetch data from Amazon
 */

const fs = require('fs').promises
const path = require('path')
const keyBy = require('lodash/keyBy')

const Device = require('./device')
const Client = require('./client')
const { readValue: readSettingsValue, DATA_FOLDER } = require('./settings')

const exists = async filename => {
  try {
    await fs.stat(filename)
    return true
  } catch (e) {
    return false
  }
}

const memoizeAsFile = options => {
  return async function() {
    const filename = options.getFilename.apply(this, arguments)
    const shouldRefresh =
      options.shouldRefresh.apply(this, arguments) || !(await exists(filename))
    let result
    if (shouldRefresh) {
      result = await options.fn.apply(this, arguments)
      await fs.writeFile(filename, JSON.stringify(result, null, 2))
    } else {
      result = JSON.parse(await fs.readFile(filename))
    }
    return result
  }
}

const getClient = async () => {
  const uid = await readSettingsValue('currentDevice')
  const device = Device.deviceForUid(uid)
  return new Client(uid, device)
}

const fetchBooks = memoizeAsFile({
  fn: async () => {
    const client = await getClient()
    const books = await client.fetchBooks()
    return books
  },

  shouldRefresh: (options = {}) => options.force,

  getFilename: () => path.join(DATA_FOLDER, 'books.json')
})

const fetchSidecar = memoizeAsFile({
  fn: async asin => {
    const client = await getClient()
    const sidecar = await client.fetchSidecar(asin)
    return sidecar
  },

  shouldRefresh: (asin, options = {}) => options.force,

  getFilename: asin => path.join(DATA_FOLDER, `sidecars/${asin}.json`)
})

const fetchBook = async asin => {
  const books = await fetchBooks()
  const byAsin = keyBy(books, book => book.asin)
  const sidecar = await fetchSidecar(asin)
  return {
    ...byAsin[asin],
    sidecar
  }
}

module.exports = {
  fetchBooks,
  fetchBook
}
