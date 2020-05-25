import React, { useState } from 'react'
import './styles.css'
import sidecars from './sidecars.json'
import { parseSidecarBytes } from './sidecar-parser'
import useStickyState from './useStickyState'
import { Bytes, ParsedBytes } from './Bytes'

const sidecarParser = {
  parse: parseSidecarBytes
}

const useRange = (v, min, max, customUseState) => {
  const useStater = customUseState || useState
  const [current, setRawCurrent] = useStater(v)
  const setCurrent = v => setRawCurrent(Math.max(Math.min(max, v), min))

  const setPrev = () => setCurrent(current - 1)
  const setNext = () => setCurrent(current + 1)

  return [current, setCurrent, setPrev, setNext]
}

function swapEndianess(arr) {
  if (arr.length % 2 !== 0) {
    throw new Error('Array length must be pair')
  }
  for (let i = 0; i < arr.length; i = i + 2) {
    const a = arr[i]
    const b = arr[i + 1]
    arr[i] = b
    arr[i + 1] = a
  }
}

const chooseFormatter = (hexBytes, start, end) => {
  if (end - start == 4) {
    return bytes => {
      const [, maybeLocation] = new Uint16Array(bytes.buffer)
      return `${bytes.slice(0, 2).toString()} - ${maybeLocation}`
    }
  } else {
    return bytes => {
      const type = String.fromCharCode(...bytes.slice(0, 4))
      if (type === 'DATA') {
        const data = Uint8Array.from(bytes)
        const text = Uint8Array.from(data.slice(8))
        swapEndianess(text)
        return String.fromCharCode(...text)
      } else {
        return `type: ${type}`
      }
    }
  }
}

const Pointers = ({ parsed, bytes }) => {
  return (
    <div className='pointers'>
      {Array(parsed.pointers.length)
        .fill(null)
        .map((v, i) => (
          <Bytes bytes={bytes} start={parsed.bpar_ptr_index + i * 4} size={4} />
        ))}
    </div>
  )
}

const Annotations = ({ parsed, bytes }) => {
  const pointers = parsed.pointers || []
  return (
    <div className='annotations'>
      {parsed.pointers.slice(0, -1).map((p, i) => {
        const start = p.location
        const end = Math.min(pointers[i + 1].location, bytes.length)
        return (
          <Bytes
            key={i}
            bytes={bytes}
            start={start}
            fmt={chooseFormatter(bytes, start, end)}
            end={end}
          />
        )
      })}
    </div>
  )
}

const useCurrent = initVal => useStickyState(initVal, 'current')

const START_SIDECAR = 0
export default function App() {
  const [current, , setPrev, setNext] = useRange(
    START_SIDECAR,
    0,
    sidecars.length - 1,
    useCurrent
  )

  const sidecar = sidecars[current]
  const bytes = Buffer.from(sidecar.data, 'base64')
  const parsed = sidecarParser.parse(bytes)

  const {
    bpar_ptr_index
  } = parsed

  return (
    <div className="App">
      <div id='positionInspector'>
      </div>
      <div>
        <button disabled={0} onClick={setPrev}>prev</button>
        {current} ({sidecar.name})
        <button disabled={current === sidecars.length - 1} onClick={setNext}>next</button>
      </div>
      <Bytes bytes={bytes} start={parsed.before_bpar} size={parsed.bpar_length} />
      <div>
        <h3>Parsed</h3>
        {/*<Annotations bytes={bytes} parsed={parsed} />*/}
        <AutoFormatBytes
          shouldRepr={fieldName => fieldName !== 'pointers'} 
          parsed={parsed}
          bytes={bytes} />
      </div>
      <div>
        <h3>Annotations</h3>
        <Annotations bytes={bytes} parsed={parsed} />
      </div>
    </div>
  )
}
