#!/bin/bash

set -euxo pipefail

infile=$1
outfile=$2

mitmdump -vvv -n -r $infile  -s $HAR_DUMP_PY_PATH --set hardump=./$outfile
