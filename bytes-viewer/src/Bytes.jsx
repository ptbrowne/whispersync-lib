import React from 'react'
import padStart from 'lodash/padStart'

const Byte = ({ byte, onMouseEnter }) => {
  const bg = `hsl(${byte}, 50%, 50%)`
  return (
    <div onMouseEnter={onMouseEnter} className="byte" style={{ background: bg }}>
      {padStart(byte.toString(16), 2, '0')}
    </div>
  )
}

const wrapToCatchError = fn => {
  return function () {
    try {
      return fn.apply(this, arguments)
    } catch (e) {
      return `Error: ${e.message}`
    }
  }
}


const Bytes = ({ bytes, start, end, size, fmt }) => {
  // assert(end || size, 'Must put end or size as Bytes prop')
  if (!end && !size) {
    return <div class='bytes bytes--error'>Bad bytes, no start or end</div>
  }
  end = end || start + size
  const viewBytes = end ? bytes.slice(start, end) : bytes.slice(start)
  fmt = fmt ? wrapToCatchError(fmt) : null

  const handleMouseEnter = (i, ev) => {
    const { top, left } = ev.target.getBoundingClientRect()
    const inspector = document.querySelector('#positionInspector')
    const style = { top: (top - 16) + 'px', left: left + 'px' }
    // console.log('style', style)
    Object.assign(inspector.style, style)
    inspector.innerHTML = start + i
  }
  return (
    <div className="bytes">
      <div style={{ fontFamily: 'monospace' }}>
        {start} → {end}, length: {end - start}
      </div>
      {Array.from(viewBytes).map((byte, i) => (
        <Byte onMouseEnter={ev => handleMouseEnter(i, ev)} key={i} byte={byte} />
      ))}{' '}
      {fmt && <div className="fmtted">{fmt(viewBytes)}</div>}
    </div>
  )
}

const Repr = ({ data }) => {
  if (data instanceof Uint8Array) {
    return <>{data.constructor.name}: <pre>{ data.toString() }</pre></>
  }
  return <>{typeof data}: <pre>{ JSON.stringify(data, null, 2) }</pre></>
}

const ParsedBytes = ({ parsed, bytes, shouldRepr }) =>  {
  const fields = Object.keys(parsed).filter(fieldName => {
    return fieldName.startsWith('before_')
  }).map(x => x.replace(/^before_/, ''))
  const cuts = fields.map(x => ({
    start: parsed[`before_${x}`],
    end: parsed[`after_${x}`],
    fieldName: x
  })).filter(x => !isNaN(x.start) && !isNaN(x.end))
  return <>
    {
      cuts.map(({ start, end, fieldName }) =>
        <div key={fieldName} className='card'>
          <div className='field-label'>{ fieldName }</div>
          { shouldRepr(fieldName) ? <><Repr data={parsed[fieldName]} /><br/></> : null }
          <Bytes bytes={bytes} label={fieldName} start={start} end={end} />
        </div>
      )
    }
  </>
}

export {
  Byte,
  Bytes,
  ParsedBytes,
  Repr
}
