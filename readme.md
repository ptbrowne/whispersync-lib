<!-- MarkdownTOC autolink=True -->

- [Communication between Amazon and Kindle](#communication-between-amazon-and-kindle)
    - [Registration flow](#registration-flow)
- [Get a trace](#get-a-trace)
- [Explore a trace](#explore-a-trace)
- [Download a sidecar and store it for tests](#download-a-sidecar-and-store-it-for-tests)
- [Resources](#resources)
    - [Whispersync API](#whispersync-api)
- [TODO](#todo)
- [Miscellanous](#miscellanous)
    - [Vocabulary](#vocabulary)
    - [mitmproxy](#mitmproxy)
    - [Server vs CLI](#server-vs-cli)
    - [Anecdotes](#anecdotes)

<!-- /MarkdownTOC -->

## Communication between Amazon and Kindle

### Registration flow

1. receive register response containing ADP token and private key
2. extract private key in pem
    * it is a pkcs8 private key in der format encoded in base64
    * cat key.base64 | base64 --decode > key.der
    * openssl pkcs8 -in key.der -inform der -outform pem -out key.pem -nocrypt

The private key and ADP token are used to sign every subsequent request
between Amazon and the Kindle.

## Get a trace

```bash
ssh pi@192.168.50.10
tmux a -t 0
# launch mitmdump and write request/response to outfile
mitmdump --mode transparent -w outfile
# ctrl-c to stop the proxy
exit #  

# Extract the dump from the kindle
rsync -aPrs pi@192.168.50.10:outfile dump.mitmproxy

# Here $(PWD)/mitmproxy refers to a clone of the mitmproxy repository
export HAR_DUMP_PY_PATH=$PWD/mitmproxy/examples/complex/har_dump.py

# Convert mitmproxy format to HAR format (JSON based format)
./scripts/mitmdump-to-har.sh dump.mitmproxy dump.har
```

## Explore a trace

`jq` is very useful to explore a trace

```bash
# Unique URLS
cat dumps/dump5.har | jq '.log.entries | map(.request.url) | sort | unique'

# Select all requests with a particular URL
cat dumps/dump5.har | jq '.log.entries | map(select(.request.url == "<MY_URL>"))'
```

## Download a sidecar and store it for tests

```
node cli.js fetch sidecar B071WSTMHK --no-parse | base64 --decode > ./tests/les-miserables.sidecar
node make-sidecars-viewer-file.js tests/ > ../viewer/src/sidecars.json
```

## Resources

Several resources were of great help when building this project.

### Whispersync API

* Lolsborn's repos

- https://github.com/lolsborn/readsync
- https://github.com/lolsborn/fiona-client

Useful for 

- registration
- request signing 

* KSP 

- https://github.com/pwr/KSP

- Implentation of a middleware server for Kindle, seamlessly connecting Calibre and Kindle
- Recreates the sidecar, useful to understand how the format of the sidecar 

Reverse engineering a file format: https://en.wikibooks.org/wiki/Reverse_Engineering/File_Formats

## TODO

- Add a database
    - Store books
    - Store sidecars

## Miscellanous

### Vocabulary

- Fix sidecar parsing
    - On some books, the sidecar parsing is broken. It seems to break on the pointer parsing implementation.
- sidecar: used by amazon to store ebook user information
    - annotations
    - last page read

It is stored in a custom binary format.

### mitmproxy

To install the certificate via mitmproxy.it, mitmdump should not be run in transprent mode

### Server vs CLI

At some point, to be able to explore annotations, it seemed to me that it was preferable to add
an HTTP server serving an index of the books and a book page showing the annotations. The content
is fetched from Amazon if it is not on disk, and it is then saved in JSON format for later
access.

### Anecdotes

While writing the parser, I downloaded sidecards through the fiona client I was building and
dumped their contents in the test folder. When trying to parse them there was a lot of errors
and also of a lot of "EF BF BD" bytes that were really weird. After some time trying to figure
out what it was, I searched for "EF BF BD" on Google and discovered they were bytes used for
data corruption.

> EF BF BD is UTF-8 for FFFD, which is the the Unicode replacement character (used for data corruption, when characters cannot be converted to a certain code page).

https://stackoverflow.com/questions/47484039/java-charset-decode-issue-in-converting-string-to-hex-code

I figured out that the request JS library used to fetch HTTP responses tried to decode the
data as UTF-8 by default and failed (as sidecars are transmitted as binary data over the
network). Solution was to put `{ encoding: null }` as the request options so that `requests`
returns a Buffer that we can encode in base64 to print it to the console. Then we can
`base64 --decode` it before dumping it to disk (console.logging the buffer would try to
decode the data as utf-8).
