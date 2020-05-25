const fs = require('fs')
const path = require('path')
const request = require('request-promise')
const { parseRegisterResponse } = require('./parse')
const FionaClient = require('./client')
const { DATA_FOLDER } = require('./settings')

class Device {
  constructor({ privateKey, adpToken, ...rest }) {
    this.privateKey = privateKey
    this.adpToken = adpToken
    Object.assign(this, rest)
  }
}

class NotFoundException extends Error {}

Device.NotFoundException = NotFoundException

const getFilename = uid => path.join(DATA_FOLDER, `./devices/device-${uid}.json`)

Device.writeDevice = device => {
  fs.writeFileSync(getFilename(device.userDirectedId), JSON.stringify(device))
}

Device.list = () => {
  const uids = fs
    .readdirSync('devices')
    .map(deviceFilename =>
      deviceFilename.replace(/^device-/, '').replace(/\.json$/, '')
    )
  return uids.map(Device.deviceForUid)
}

const touch = function(syncTime, uid) {
  const device = Device.deviceForUid(uid)
  device.lastSync = syncTime
  Device.writeDevice(device)
}

const deviceForUid = function(uid) {
  if (!Device.exists(uid)) {
    throw new Device.NotFoundException(`Could not find device ${uid}`)
  }
  return new Device(JSON.parse(fs.readFileSync(getFilename(uid))))
}

const exists = function(uid) {
  return fs.existsSync(getFilename(uid))
}

const register = async (email, password) => {
  const url = 'https://54.239.22.185/FirsProxy/registerDevice'
  const headers = {
    'Accept-Language': 'en-US',
    'Content-Type': 'text/xml',
    'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 5.0; Nexus 1)',
    Host: FionaClient.FIRS_SERVER,
    Connection: 'Keep-Alive'
  }

  const data = `
<request>
  <parameters>
        <deviceType>A3VNNDO1I14V03</deviceType>
        <deviceSerialNumber>73b4b15e87ac4159258a06c5572e22c258721590</deviceSerialNumber>
        <email>${email}</email>
        <password>${password}</password>
        <deviceName>%FIRST_NAME%%FIRST_NAME_POSSESSIVE_STRING%%DUPE_STRATEGY_1ST% Android</deviceName>
        <pid>510FD7ED</pid>
        <softwareVersion>1124597795</softwareVersion>
        <os_version>5.0</os_version>
        <device_model>Android Phone</device_model>
    </parameters>
    <softwareVersions>
        <softwareVersion name="oem_vendor" value="Kindle"/>
        <softwareVersion name="oem_platform" value="Redding"/>
        <softwareVersion name="oem_version" value="kindle-android-20"/>
    </softwareVersions>
</request>`.replace(/\n/g, '')

  const resp = await request({
    url,
    body: data,
    method: 'POST',
    headers,
    gzip: true
  })

  return parseRegisterResponse(resp)
}

Device.touch = touch
Device.deviceForUid = deviceForUid
Device.exists = exists
Device.register = register

module.exports = Device
