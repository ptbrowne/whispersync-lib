#!/bin/bash

set -euxo pipefail

cat $1 | jq.node 'get("log.entries") | filter(entry => any(h => h.value == "application/x-mobipocket-sidecar", entry.response.headers)) | map(x => x.response.content.text)'

