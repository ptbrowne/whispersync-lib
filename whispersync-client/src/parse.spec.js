const fs = require('fs')
const path = require('path')

const { parseMetadataResponse, parseRegisterResponse } = require('./parse')

const registerResponse = fs
  .readFileSync(path.join(__dirname, './tests/register-response.xml'))
  .toString()
const metadataResponse = fs
  .readFileSync(path.join(__dirname, './tests/metadata-response.xml'))
  .toString()


describe('register metadata response', () => {
  it('should parse adp token and private key', () => {
    const parsed = parseRegisterResponse(registerResponse)
    expect(parsed.adpToken).toMatchSnapshot()
    expect(parsed.privateKey).toMatchSnapshot()
  })
})

describe('parse metadata response', () => {
  it('should parse books', () => {
    const parsed = parseMetadataResponse(metadataResponse)
    expect(parsed).toMatchSnapshot()
  })
})
