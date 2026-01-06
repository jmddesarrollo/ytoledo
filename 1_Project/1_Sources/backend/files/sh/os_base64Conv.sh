#!/bin/bash
openssl base64 -in $1/dataSHA256.sign -out $1/dataB64.sign
echo "$?" > $1/resultB64Conv.dat