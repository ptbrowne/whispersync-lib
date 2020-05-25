const fionaRequest = require('./request')
const {
  parseMetadataResponse,
  parseSidecarResponse,
  parseLastReadResponse
} = require('./parse')

class Client {
  constructor(uid, device) {
    this.uid = uid
    this.device = device
  }

  request(url, path, options) {
    return fionaRequest(url, path, this.device, options)
  }

  async fetchMetadata(options = {}) {
    const { isFull } = options
    let path

    if (isFull) {
      path = '/FionaTodoListProxy/syncMetaData'
    } else if (this.device.lastSync != '') {
      let time = encodeURIComponent(this.device.lastSync)
      path = `/FionaTodoListProxy/syncMetaData?last_sync_time=${time}`
    } else {
      path = '/FionaTodoListProxy/syncMetaData'
    }

    const url = `https://${Client.TODO_SERVER}`
    const resp = await this.request(url, path)
    return options.parse === false ? resp : parseMetadataResponse(resp)
  }

  async fetchBooks() {
    const metadata = await this.fetchMetadata()
    return metadata.booksToAdd
  }

  async fetchSidecar(bookId, options = {}) {
    const resp = await this.request(
      'https://' + Client.CDE_SERVER,
      `/FionaCDEServiceEngine/sidecar?type=EBOK&key=${bookId}`,
      {
        encoding: null
      }
    )
    return options.parse === false
      ? resp.toString('base64')
      : parseSidecarResponse(resp)
  }

  async fetchLastRead(bookId, options) {
    const sidecar = await this.fetchSidecar(bookId)
    const guid = sidecar.guid
    const resp = await this.request(
      'https://' + Client.CDE_SERVER,
      `/FionaCDEServiceEngine/getAnnotations?filter=last_read&type=EBOK&key=${bookId}&guid=${guid}`
    )
    return options.parse === false ? resp : parseLastReadResponse(resp)
  }
}

Client.TODO_SERVER = 'todo-ta-g7g.amazon.com'
Client.FIRS_SERVER = 'firs-ta-g7g.amazon.com'
Client.CDE_SERVER = 'cde-ta-g7g.amazon.com'

module.exports = Client
