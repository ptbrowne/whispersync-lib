#!/bin/bash

set -euo pipefail

infile=$1
outfile=$2

openssl pkcs8 -in $infile -inform der -outform pem -out $outfile -nocrypt
