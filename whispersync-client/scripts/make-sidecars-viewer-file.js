const fs = require('fs')
const path = require('path')

const main = async () => {
  const directory = process.argv[2]
  const sidecarFiles = fs
    .readdirSync(directory)
    .filter(filename => filename.endsWith('.sidecar'))
    .map(filename => path.join(directory, filename))
  const sidecars = sidecarFiles.map(filepath => {
    const data = fs.readFileSync(filepath).toString('base64')
    const basename = path.basename(filepath)
    return {
      data: data,
      name: basename
    }
  })
  console.log(JSON.stringify(sidecars, null, 2))
}

if (require.main === module) {
  main().catch(e => {
    console.error(e)
    process.exit(1)
  })
}
