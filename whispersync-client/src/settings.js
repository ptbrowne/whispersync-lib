const fs = require('fs')
const path = require('path')
const get = require('lodash/get')
const set = require('lodash/set')

const getSettingsPath = () => {
  return path.join(process.env.HOME, '.fiona-client-rc')
}

const readSettings = async () => {
  try {
    return JSON.parse(fs.readFileSync(getSettingsPath()))
  } catch (e) {
    return {}
  }
}

const writeSettings = async updatedSettings => {
  fs.writeFileSync(getSettingsPath(), JSON.stringify(updatedSettings, null, 2))
}

const readSettingsValue = async valPath => {
  const settings = await readSettings()
  return get(settings, valPath)
}

const writeSettingsValue = async (valPath, value) => {
  const currentSettings = await readSettings()
  set(currentSettings, valPath, value)
  writeSettings(currentSettings)
}

const DATA_FOLDER = path.join(__dirname, '../../data')

module.exports = {
  readValue: readSettingsValue,
  writeValue: writeSettingsValue,
  DATA_FOLDER
}
