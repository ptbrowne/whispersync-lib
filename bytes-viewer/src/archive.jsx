const findDataCuts = (bytes, start, end) => {
  const cuts = []
  let cutStart = start
  for (let i = start; i < end; i++) {
    // console.log(bytes[i], bytes[i + 1], bytes[i + 2], bytes[i + 3]);
    if (
      i < end - 4 &&
      ((bytes[i] === 68 &&
        bytes[i + 1] === 65 &&
        bytes[i + 2] === 84 &&
        bytes[i + 3] === 65) ||
        (bytes[i] === 63 &&
          bytes[i + 1] === 66 &&
          bytes[i + 2] === 75 &&
          bytes[i + 3] === 77))
    ) {
      cuts.push([cutStart, i])
      cutStart = i
    }
  }
  if (cutStart !== end) {
    cuts.push([cutStart, end])
  }
  return cuts
}

const find0Cuts = (bytes, start, end) => {
  let cuts = []
  let isInFF = false
  let cutStart = start
  for (let i = start; i < end; i++) {
    const b = bytes[i]
    if ((isInFF && b !== 255) || (!isInFF && b === 255)) {
      cuts.push([cutStart, i])
      cutStart = i
      isInFF = !isInFF
    }
  }
  if (cutStart !== end) {
    cuts.push([cutStart, end])
  }
  return cuts
}

const ascii = bytes => {
  const charCodes = Array.from(bytes).map(b => {
    return String.fromCharCode(b)
  })
  return charCodes.join('')
}

const fmtText = bytes => {
  return ascii(bytes.slice(8, -3))
}

const Sidecar = ({ sidecar }) => {
  const hexBytes = Buffer.from(sidecar, 'base64')

  const ff1 = hexBytes.indexOf(255)

  const endHeader = ff1 + 16
  const cuts = find0Cuts(hexBytes, endHeader, hexBytes.length)

  return (
    <>
      base64: <input defaultValue={sidecar} type="text" />
      <Bytes label="title" hexBytes={hexBytes} start={0} end={32} fmt={ascii} />
      <br />
      <Bytes hexBytes={hexBytes} start={32} end={36} />
      <br />
      <Bytes
        label="created"
        hexBytes={hexBytes}
        start={36}
        end={40}
        fmt={ascii}
      />
      <br />
      <Bytes
        label="updated"
        hexBytes={hexBytes}
        start={40}
        end={44}
        fmt={ascii}
      />
      <br />
      <Bytes hexBytes={hexBytes} start={44} end={60} />
      <br />
      <Bytes hexBytes={hexBytes} start={60} end={68} fmt={ascii} /> <br />
      <br />
      <Bytes hexBytes={hexBytes} start={68} end={cuts[0][0]} />
      <br />
      {cuts.map(([start, end], i) => {
        if (i === 4) {
          const cuts = findDataCuts(hexBytes, start, end)
          return (
            <>
              {cuts.map(([start, end], i) => (
                <Bytes
                  hexBytes={hexBytes}
                  start={start}
                  end={end}
                  fmt={i > 0 ? fmtText : null}
                />
              ))}
            </>
          )
        } else {
          return <Bytes hexBytes={hexBytes} start={start} end={end} />
        }
      })}
    </>
  )
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
