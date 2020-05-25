const xpath = require('xpath')
const dom = require('xmldom').DOMParser
const Book = require('./book')
const { parseSidecarBytes } = require('./sidecar')

/**
 * Parses meta_data elements from metadata response.
 * Returns Books objects.
 */
const parseBooksFromMetadataResponse = bookNodes => {
  const books = []
  for (const bookNode of bookNodes) {
    const asin = xpath.select1('ASIN/text()', bookNode).nodeValue
    const title = xpath.select1('title/text()', bookNode).nodeValue
    const authors = xpath.select('./authors//author/text()', bookNode).map(x => x.nodeValue)
    const publishers = xpath.select('./publishers//publisher/text()', bookNode).map(x => x.nodeValue)
    const publicationDate = xpath.select1('./publication_date/text()', bookNode)

    const book = new Book({
      asin,
      title,
      authors,
      publishers,
      publicationDate: publicationDate ? publicationDate.nodeValue : null
    })
    books.push(book)
  }
  return books
}

/**
 * Parses the response that Amazon sends when syncing metadata.
 * Contains informations on books.
 */
const parseMetadataResponse = metadataResponseText => {
  let xml = new dom().parseFromString(metadataResponseText)

  const syncType = xpath.select1('/response/@syncType', xml).nodeValue

  const syncTime = xpath
    .select1('/response/sync_time/text()', xml)
    .nodeValue.split(';')[0]
  const addNodes = xpath.select('//add_update_list//meta_data', xml)
  const removeNodes = xpath.select('//removal_list//meta_data', xml)

  const booksToAdd = parseBooksFromMetadataResponse(addNodes)
  const booksToRemove = parseBooksFromMetadataResponse(removeNodes)

  return {
    booksToAdd,
    booksToRemove,
    syncType,
    syncTime
  }
}

/**
 * Parses the response that Amazon sends when registering a device.
 * This response contains the privateKey and adpToken that will server
 * to sign later requests to the API.
 */
const parseRegisterResponse = xmlText => {
  const xml = new dom().parseFromString(xmlText)
  const storeAuthenticationCookie = xpath.select(
    'string(/response/store_authentication_cookie)',
    xml
  )
  const privateKey = xpath.select('string(/response/device_private_key)', xml)
  const adpToken = xpath.select('string(/response/adp_token)', xml)
  const deviceType = xpath.select('string(/response/device_type)', xml)
  const givenName = xpath.select('string(/response/given_name)', xml)
  const name = xpath.select('string(/response/name)', xml)
  const accountPool = xpath.select('string(/response/account_pool)', xml)
  const preferredMarketplace = xpath.select(
    'string(/response/preferred_marketplace)',
    xml
  )
  const userDirectedId = xpath.select('string(/response/user_directed_id)', xml)

  const userDeviceName = xpath.select('string(/response/user_device_name)', xml)

  return {
    storeAuthenticationCookie,
    privateKey,
    adpToken,
    deviceType,
    givenName,
    name,
    accountPool,
    preferredMarketplace,
    userDirectedId,
    userDeviceName
  }
}

const parseLastReadResponse = xmlText => {
  const xml = new dom().parseFromString(xmlText)
  const lastReadNode = xpath.select1('/book/last_read', xml)
  const pos = xpath.select1('@pos', lastReadNode).nodeValue
  const method = xpath.select1('@method', lastReadNode).nodeValue
  const text = xpath.select1('text()', lastReadNode).nodeValue
  return {
    pos,
    method,
    text
  }
}

const parseSidecarResponse = resp => {
  const buf = Buffer.from(resp, 'binary')
  return parseSidecarBytes(buf)
}

module.exports = {
  parseRegisterResponse,
  parseMetadataResponse,
  parseSidecarResponse,
  parseLastReadResponse
}
