/* eslint-disable no-console */

const fs = require('fs')
const { build } = require('@cozy/cli-tree')
const Device = require('./device')
const FionaClient = require('./client')
const { parseRegisterResponse, parseSidecarResponse } = require('./parse')
const {
  readValue: readSettingsValue,
  writeValue: writeSettingsValue
} = require('./settings')

const output = (data, args) => {
  if (args.json) {
    data = JSON.stringify(data, null, 2)
  }
  console.log(data)
}

const registerDevice = async () => {
  const email = process.env.EMAIL
  const password = process.env.PASSWORD
  if (!email || !password) {
    throw new Error(
      'To register a new device, you must pass EMAIL and PASSWORD via env variables'
    )
  }
  const resp = await Device.register(email, password)
  const data = parseRegisterResponse(resp)
  Device.writeDevice(data)
}

const addDeviceFromFile = args => {
  const registerResponse = fs.readFileSync(args.filename).toString()
  const data = parseRegisterResponse(registerResponse)
  Device.writeDevice(data)
}

const listDevices = async () => {
  const devices = await Device.list()
  for (const device of devices) {
    console.log(`- ${device.userDeviceName} ${device.userDirectedId}`)
  }
}

const useDevice = async args => {
  const device = Device.deviceForUid(args.uid)
  console.log(`Now using ${device.userDeviceName}`)
  await writeSettingsValue('currentDevice', args.uid)
}

const showCurrentDevice = async () => {
  const uid = await readSettingsValue('currentDevice')
  const device = Device.deviceForUid(uid)
  console.log(`Current device: ${device.userDeviceName}`)
}

const fetchBooks = async args => {
  const uid = await readSettingsValue('currentDevice')
  const device = Device.deviceForUid(uid)
  const client = new FionaClient(uid, device)
  const metadata = await client.fetchMetadata({
    parse: args.parse
  })
  const books = metadata.booksToAdd
  output(books, args)
}

const fetchSidecar = async args => {
  const uid = await readSettingsValue('currentDevice')
  const device = Device.deviceForUid(uid)
  const client = new FionaClient(uid, device)
  const sidecar = await client.fetchSidecar(args.bookId, {
    parse: args.parse
  })
  output(sidecar, args)
}

const fetchLastRead = async args => {
  const uid = await readSettingsValue('currentDevice')
  const device = Device.deviceForUid(uid)
  const client = new FionaClient(uid, device)
  const data = await client.fetchLastRead(args.bookId, {
    parse: args.parse
  })
  output(data, args)
}

const parseSidecarHandler = async args => {
  const sidecar = fs.readFileSync(args.sidecarFilename)
  const parsed = parseSidecarResponse(sidecar)
  console.log(parsed)
}

const commonArgs = {
  noParse: {
    argument: '--no-parse',
    action: 'storeFalse',
    dest: 'parse'
  },
  json: {
    argument: '--json',
    action: 'storeTrue'
  }
}

const main = async () => {
  const [parser] = build({
    devices: {
      register: {
        handler: registerDevice,
        help: `Register a device on Amazon.com and saves its credentials for further requests. Use process.env.EMAIL and process.env.PASSWORD.`
      },
      addFromFile: {
        arguments: ['filename'],
        handler: addDeviceFromFile,
        help:
          'Register from a XML response (useful if you already have a response)'
      },
      list: {
        handler: listDevices,
        help: 'List available devices'
      },
      use: {
        arguments: ['uid'],
        handler: useDevice,
        help: 'Choose which device to use for requests'
      },
      current: {
        handler: showCurrentDevice,
        help: 'Show current device'
      }
    },
    parse: {
      sidecar: {
        handler: parseSidecarHandler,
        help: 'Parse a sidecar binary file',
        arguments: ['sidecarFilename']
      }
    },
    fetch: {
      books: {
        handler: fetchBooks,
        help: 'Fetch list of books',
        arguments: [
          commonArgs.noParse,
          commonArgs.json
        ]
      },
      sidecar: {
        handler: fetchSidecar,
        help: 'Fetch sidecar for a book',
        arguments: [
          'bookId',
          commonArgs.noParse,
          commonArgs.json
        ]
      },
      lastRead: {
        handler: fetchLastRead,
        arguments: [
          'bookId',
          commonArgs.noParse,
          commonArgs.json
        ]
      }
    }
  })
  const args = parser.parseArgs()
  await args.handler(args)
}

if (require.main === module) {
  main().catch(e => {
    console.error(e)
    process.exit(1)
  })
}
