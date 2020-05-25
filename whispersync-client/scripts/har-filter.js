/* eslint-disable no-console */

const fs = require('fs')

const main = () => {
  const dump = fs.readFileSync('dump.har')
  const data = JSON.parse(dump)
  const entries = data.log.entries
  data.log.entries = entries.filter(x => {
    console.log(x.response.content.text.slice(0, 10))
    if (x.response.content.text == 'success\n') {
      return false
    }
    if (x.request.url.includes('images/P')) {
      return false
    }
    return true
  })

  console.log(`had ${entries.length}, now ${data.log.entries.length}`)

  fs.writeFileSync('newdump.har', JSON.stringify(data, null, 2))
}
main()
