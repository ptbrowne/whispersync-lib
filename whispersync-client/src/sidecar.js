/* eslint-disable no-console */

var Parser = require('binary-parser').Parser

var pointerParser = new Parser().uint32('id').uint32('location')

var formatBuf = buf => buf.toString('base64')

var annotationParser = new Parser().string('type', { length: 4 }).choice({
  tag: function() {
    if (this.type === 'DATA') {
      return 1
    } else if (this.type === 'BKMK') {
      return 2
    }
  },
  choices: {
    1: new Parser()
      .uint16('meta1')
      .uint16('numCodePoints')
      .string('text', { encoding: 'utf-16be', greedy: true }),
    2: new Parser().buffer('data', { length: 60, formatter: formatBuf })
  },
  defaultChoice: new Parser().buffer('data', {
    readUntil: 'eof',
    formatter: formatBuf
  })
})

const originalSetNextParser = Parser.prototype.setNextParser
Parser.prototype.setNextParser = function(type, varName) {
  if (type !== 'saveOffset' && type !== 'seek') {
    this.saveOffset('before_' + varName)
  }
  originalSetNextParser.apply(this, arguments)
  if (type !== 'saveOffset' && type !== 'seek') {
    this.saveOffset('after_' + varName)
  }
  return this
}

var annotationMetaParser = new Parser().uint16('meta1').uint16('meta2')

var sidecarParser = new Parser()
  .endianess('big')
  .string('guid', { length: 32, stripNull: true })
  .seek(4)
  .buffer('v1', { length: 4 })
  .buffer('v2', { length: 4 })
  .buffer('v3', { length: 4 })
  .seek(function() {
    if (this.v3[0] === 0) {
      return -4
    }
    return 0
  })
  .buffer('v4', { length: 4 })
  .seek(function() {
    if (this.v4[0] === 0) {
      return -4
    }
    return 0
  })
  .seek(16)
  .string('bparmobi', {
    length: 8,
    assert: function(x) {
      return x === 'BPARMOBI'
    }
  })
  .seek(2)
  .uint16('next_id')
  .seek(4)
  .uint16('index_count')
  .seek(2)
  .uint16('bpar_ptr')
  .saveOffset('bpar_ptr_index_')
  .array('pointers', {
    type: pointerParser,
    length: function () {
      return this.index_count - 1
    }
  })
  .seek(function() {
    return this.bpar_ptr - this.after_pointers
  })
  .string('bpar', {
    length: 4,
    // assert: function(x) {
    //   return x === 'BPAR'
    // }
  })
  .uint32('bpar_length')
  .seek(4)
  .uint32('last_read_begin')
  .uint32('last_read_page')
  .uint32('last_read_ptr_index')
  .seek(4) // ff * 4
  .seek(4) // 00 * 3 , 7f
  .uint32('guid2')
  .uint32('time_mark')
  .seek(16) // ff * 16
  .seek(8) // 00 * 16
  .seek(function() {
    if (this.last_read_ptr_index) {
      return 4
    }
    return 0
  })

// It should be possible to encode the following logic directly
// into the Parser but I could not see how to easily express the logic
// below:
//
// - For each pointer, go to the pointer and perform a different logic
//   based on the 4 bytes at the pointer destination
//   - If it is DATA, we can read the number of code point
//   - If it is BKMK, we have 60 bytes to read
//   - Otherwise only 4 bytes to read
//
// Writing this, I think it should be possible to do via a combination of
// pointer() and choice().
const parseSidecarBytes = bytes => {
  const parsed = sidecarParser.parse(bytes)
  parsed.pointers = parsed.pointers || []
  const pointers = parsed.pointers
  const cuts = pointers.slice(0, -1).map((p, i) => {
    const start = p.location
    const end = Math.min(pointers[i + 1].location, bytes.length)
    return [start, end]
  })
  const slices = cuts.map(([start, end]) => bytes.slice(start, end))
  parsed.annotations = slices.map(x => {
    if (x.length > 4) {
      return annotationParser.parse(x)
    } else if (x.length > 0) {
      try {
        return annotationMetaParser.parse(x)
      } catch (e) {
        return { error: e.message, raw: x }
      }
    } else {
      return { empty: true }
    }
  })
  return parsed
}

module.exports = {
  parseSidecarBytes
}
