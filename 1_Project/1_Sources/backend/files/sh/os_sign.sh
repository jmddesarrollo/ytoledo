#!/bin/bash
openssl dgst -sign $1/key.pem -keyform PEM -sha256 -out $2/dataSHA256.sign -binary $2/data.json
echo "$?" > $2/resultSign.dat