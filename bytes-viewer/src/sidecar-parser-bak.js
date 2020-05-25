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

var annotationMetaParser = new Parser().uint16('meta1').uint16('meta2')

var sidecarParser = new Parser()
  .endianess('big')
  .string('header', { length: 32, stripNull: true })
  .buffer('fill1', { length: 4 })
  .buffer('created', { length: 4 })
  .buffer('updated', { length: 4 })
  .seek(function() {
    if (this.created.toString() !== this.updated.toString()) {
      return 4
    }
    return 0
  })
  .buffer('empty1', { length: 4 })
  .buffer('empty2', { length: 12 })
  .string('field5', { length: 8 })
  .uint32('next_id')
  .buffer('empty', { length: 2 })
  .uint32('index_count')
  .uint32('bpar_ptr')
  .array('pointers', {
    type: pointerParser,
    length: 'index_count'
  })
  .saveOffset('currentOffset')
  // finally, use the saved offset to figure out
  // how many bytes we need to skip
  .seek(function() {
    return this.bpar_ptr - this.currentOffset
  })
  .saveOffset('bparOffset')
  .string('bpar', { length: 4 })
  .buffer('empty', { length: 3})
  .uint8('bpar_length')
  .buffer('empty', { length: 4 })
  .uint32('last_read_begin')
  .uint32('last_read_page')
  .uint32('last_read_ptr_index')
  .buffer('empty', { length: 4 }) // ff * 4
  .buffer('empty', { length: 3 }) // 00 * 2
  .buffer('empty', { length: 1 }) // 7f
  .uint32('guid')
  .uint32('time_mark')
  .buffer('empty', { length: 16 }) // ff * 16
  .buffer('empty', { length: 8 }) // 00 * 16
  .seek(function() {
    if (this.last_read_ptr_index) {
      return 4
    }
    return 0
  })
  .saveOffset('lastOffset')

const parseSidecarBytes = bytes => {
  const parsed = sidecarParser.parse(bytes)

  return parsed
}

module.exports = {
  parse: parseSidecarBytes
}
