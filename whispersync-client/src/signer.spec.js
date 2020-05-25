const fs = require('fs')
const path = require('path')
const RequestSigner = require('./signer')
const { parseRegisterResponse } = require('./parse')

it('should sign a request correctly', () => {
  const registerResponseData = fs
    .readFileSync(path.join(__dirname, './tests/register-response.xml'))
    .toString()
  const date = '2020-04-10T14:21:40Z'
  const requestPath = '/FirsProxy/getStoreCredentials'
  const registerData = parseRegisterResponse(registerResponseData)

  const signer = new RequestSigner(
    registerData.privateKey,
    registerData.adpToken
  )
  const sig = signer.digestHeaderForRequest('GET', requestPath, '', date)
  expect(sig).toBe(
    'czUzgbTkzXs2/esqFMcbGuIAdVkRPBzYJFsOnHNep0sW/xyW5hCtOgphRAqZGnUP4jXVvHTf+dRsRg5wdSzcp8CG5POxXZ6Qi+0KeKWiraMNmdRP7+L1RLXJ5cgd/HLbrBqGYAK5+VEpNDRitNXBm4KJOysPWyvf5mU6tu0KoHCfEm0biNNjTEn54J+FaQlB0xYIb8WHct/vqTQGmKoKhZGsPe1L5HwzTZfg5Wdld9SjujgaW8uQmWJ7QpDJ0dw5Fv1W0x6fK+pM/rM/rPQ5XrbPYIeXSSPL6KKoqeIPpbwNrVHdgpeZAU/1BMIF7+zXQKv4L8IjFizgf+L2tqa6Yg==:2020-04-10T14:21:40Z'
  )
})
