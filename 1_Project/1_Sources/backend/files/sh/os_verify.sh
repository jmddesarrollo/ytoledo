#!/bin/bash
openssl dgst -verify $1/key.public.pem -keyform PEM -sha256 -signature $2/dataSHA256.sign -binary $2/data.json
echo "$?" > $2/resultVerify.dat