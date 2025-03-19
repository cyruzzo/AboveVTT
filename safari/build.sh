#!/bin/sh

# for first time build:
# FIRST_TIME_OPTION=-allowProvisioningUpdates
# if you actually want to upload to testflight:
# ./build.sh UPLOAD

source ./env
cat <<EOF | envsubst > ./ExportOptions.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store-connect</string>
    <key>teamID</key>
    <string>$TEAM_ID</string>
    <key>signingCertificate</key>
    <string>Apple Distribution</string>
    <key>uploadBitcode</key>
    <true/>
    <key>uploadSymbols</key>
    <true/>
</dict>
</plist>
EOF


echo "----Clean"
rm -r build/*.pkg build/*.ipa build/*.xcarchive build/*.log build/*.plist

xcodebuild clean -project AboveVTT.xcodeproj -scheme "AboveVTT (iOS)" -destination 'generic/platform=iOS' -configuration Release
xcodebuild clean -project AboveVTT.xcodeproj -scheme "AboveVTT (macOS)" -destination 'generic/platform=macOS' -configuration Release

# I would love it if this worked - but it doesn't.  For some reason
# github checkout is not fetching the tags - even when we ask it to
# get from git tag if there is a nearby version tag
if [ -z "$MARKETING_VERSION" ]; then
    V="`git describe --tags --abbrev=0`"
    [[ $V =~ ^[0-9]+\.[0-9]+.*$ ]] && MARKETING_VERSION="$V"
fi

#exit on errors
set -e

# now always from manifest
# Apple doesn't like the "-betaN" on Testflight
#if [ -z "$MARKETING_VERSION" ]; then
    echo "Using Manifest version...."
    MARKETING_VERSION=`python -c 'import json; print(json.loads(open("../manifest.json").read()).get("version"))'`
#fi

# revert to default
git checkout -- ../environment.js        
case $AVTT_BUILD in
    "prod")
        echo "--------production build-------------"
        sed -i '' 's/-local//g' ../environment.js        
        ;;
    "beta")
        echo "--------beta build-------------------"
        sed -i '' 's/-local/-beta/g' ../environment.js        
        ;;
    *)
        echo "-----default to local build----------"
        ;;
esac

echo "----Set marketing version to ${MARKETING_VERSION}"
echo "MARKETING_VERSION=${MARKETING_VERSION}" > Config.xcconfig

echo "----Building iOS"
xcodebuild build -project AboveVTT.xcodeproj -scheme "AboveVTT (iOS)" -destination 'generic/platform=iOS' -configuration Release $FIRST_TIME_OPTION
xcodebuild archive -project AboveVTT.xcodeproj -scheme "AboveVTT (iOS)" -archivePath ./build/AboveVTT-ios.xcarchive -destination 'generic/platform=iOS' -configuration Release $FIRST_TIME_OPTION

echo "----Building macOS"
xcodebuild build -project AboveVTT.xcodeproj -scheme "AboveVTT (macOS)" -destination 'generic/platform=macOS' -configuration Release $FIRST_TIME_OPTION
xcodebuild archive -project AboveVTT.xcodeproj -scheme "AboveVTT (macOS)" -archivePath ./build/AboveVTT-mac.xcarchive -destination 'generic/platform=macOS' -configuration Release $FIRST_TIME_OPTION

echo "----DEBUG: Check what signing"
security find-identity -v -p codesigning
echo "Export plist:"
cat ExportOptions.plist

echo "----Export iOS"
xcodebuild -exportArchive -archivePath ./build/AboveVTT-ios.xcarchive -exportPath ./build -exportOptionsPlist ExportOptions.plist $FIRST_TIME_OPTION

echo "----Notarizing iOS"
# this has to "upload" to get the file notarized -
# however this is NOT the upload to the store/testflight yet.
xcrun notarytool submit ./build/AboveVTT.ipa --keychain-profile "appstoreconnect" --wait

if [ "$1" == "UPLOAD" ]; then
    if [ -z "${!FIRST_TIME_OPTION}" ]; then
        # this is the actual upload that matters for testflight/store
        echo "----Uploading iOS"
        xcrun altool --upload-app -f ./build/AboveVTT.ipa -t ios --apiKey $APP_STORE_CONNECT_API_KEY_ID --apiIssuer $APP_STORE_CONNECT_API_ISSUER_ID
    else
        echo "Skipping upload"
    fi
fi

echo "----Export macOS"
xcodebuild -exportArchive -archivePath ./build/AboveVTT-mac.xcarchive -exportPath ./build -exportOptionsPlist ExportOptions.plist $FIRST_TIME_OPTION

# this has to "upload" to get the file notarized -
# however this is NOT the upload to the store/testflight yet.
echo "----Notarizing macOS"
xcrun notarytool submit ./build/AboveVTT.pkg --keychain-profile "appstoreconnect" --wait

if [ "$1" == "UPLOAD" ]; then
    if [ -z "${!FIRST_TIME_OPTION}" ]; then
        # this is the actual upload that matters for testflight/store        
        echo "----Uploading macOS"
        xcrun altool --upload-app -f ./build/AboveVTT.pkg -t macos --apiKey $APP_STORE_CONNECT_API_KEY_ID --apiIssuer $APP_STORE_CONNECT_API_ISSUER_ID
    else
        echo "Skipping upload"
    fi
fi
echo "Completed"


