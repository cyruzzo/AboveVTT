#!/bin/bash
REPO=cyruzzo/AboveVTT
set -e
base64 -i appkey.p8 | gh secret set APP_STORE_CONNECT_API_KEY -R $REPO 
base64 -i cert1.p12 | gh secret set BUILD_CERTIFICATE_BASE64 -R $REPO 
base64 -i cert2.p12 | gh secret set BUILD_CERTIFICATE2_BASE64 -R $REPO 
base64 -i cert3.p12 | gh secret set BUILD_CERTIFICATE3_BASE64 -R $REPO 
echo
echo "---------"
echo "Type the same password you used for saving the p12 files"
gh secret set P12_PASSWORD

echo
echo
echo "You may now: 'rm appkey.p8 cert1.p12 cert2.p12 cert3.p12'"
echo "You may wish to securely save appkey.p8 somewhere"
