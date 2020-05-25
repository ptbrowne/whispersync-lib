const forge = require('node-forge')
const NodeRSA = require('node-rsa')

class RequestSigner {
  constructor(privateKey, adpToken) {
    this.privateKey = this.decodeKey(privateKey)
    this.adpToken = adpToken.replace(/\n/g, '')
  }

  static getSigningDate() {
    // removes milliseconds
    const d = new Date().toISOString().slice(0, -5) + 'Z'
    return d
  }

  decodeKey(keyBase64Str) {
    const asn1 = forge.asn1.fromDer(forge.util.decode64(keyBase64Str))
    const pk = forge.pki.privateKeyFromAsn1(asn1)
    const pem = forge.pki.privateKeyToPem(pk)
    const key = new NodeRSA(pem, {
      scheme: 'pkcs1-sha256'
    })
    return key
  }

  makeDigestDataForRequest(method, url, postdata, signingDate) {
    signingDate = signingDate || RequestSigner.getSigningDate()

    const sigData = `${method}
${url}
${signingDate}
${postdata}
${this.adpToken}`

    return Buffer.from(sigData, 'utf8')
  }

  digestHeaderForRequest(method, url, postdata, signingDate) {
    const sigData = this.makeDigestDataForRequest(
      method,
      url,
      postdata,
      signingDate
    )
    const digest = forge.sha256
      .create()
      .update(sigData)
      .digest()
      .getBytes()
    const encryptedBytes = this.privateKey.encryptPrivate(
      digest,
      'buffer',
      'binary'
    )
    const bytes64 = Buffer.from(encryptedBytes, 'utf-8').toString('base64')
    return `${bytes64}:${signingDate}`
  }
}

const main = async () => {
  const fs = require('fs')
  const path = require('path')
  const Device = require('./device')

  const registerResponseData = fs
    .readFileSync(path.join(__dirname, './tests/register-response.xml'))
    .toString()
  const date = '2020-04-10T14:21:40Z'
  const url = '/FirsProxy/getStoreCredentials'
  const registerData = Device.parseRegisterSuccessResponse(registerResponseData)
  const signer = new RequestSigner(
    registerData.privateKey,
    registerData.adpToken
  )
  const sig = signer.digestHeaderForRequest(
    'GET',
    '/FirsProxy/getStoreCredentials',
    '',
    '2020-04-10T14:21:40Z'
  )
  console.log(sig.toString())
}

module.exports = RequestSigner

if (require.main === module) {
  main().catch(e => {
    console.error(e)
    process.exit(1)
  })
}
