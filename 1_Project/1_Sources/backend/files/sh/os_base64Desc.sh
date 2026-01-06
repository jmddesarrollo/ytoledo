#!/bin/bash
openssl base64 -d -in $1/dataB64.sign -out $1/dataSHA256.sign
echo "$?" > $1/resultB64Desc.dat