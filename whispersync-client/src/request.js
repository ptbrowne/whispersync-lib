const request = require('request-promise')
const RequestSigner = require('./signer')

const fionaRequest = (url, path, device, options={}) => {
  let signer = new RequestSigner(device.privateKey, device.adpToken)
  let sig = signer.digestHeaderForRequest(
    'GET',
    path,
    '',
    '2020-04-10T14:21:40Z'
  )

  const headers = {
    Connection: 'Keep-Alive',
    'User-Agent': 'Dalvik/1.2.0',
    'x-adp-authentication-token': device.adpToken,
    'x-adp-request-digest': sig
  }

  return request({ url: url + path, headers, ...options })
}

module.exports = fionaRequest
