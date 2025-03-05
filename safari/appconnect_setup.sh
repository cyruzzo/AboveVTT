#!/bin/sh
#
# requires AuthKey.p8 file as argument
source ./env
mkdir ~/.private_keys
cp $1 ~/.private_keys/AuthKey_$APP_STORE_CONNECT_API_KEY_ID.p8
xcrun notarytool store-credentials "appstoreconnect" --key $1 --key-id $APP_STORE_CONNECT_API_KEY_ID --issuer $APP_STORE_CONNECT_API_ISSUER_ID

