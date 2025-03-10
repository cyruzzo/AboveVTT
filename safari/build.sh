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

#exit on errors
set -e

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
xcodebuild -exportArchive -archivePath ./build/AboveVTT-ios.xcarchive -exportPath ./build -exportOptionsPlist ExportOptions.plist -verbose $FIRST_TIME_OPTION

echo "----Notarizing iOS"
xcrun notarytool submit ./build/AboveVTT.ipa --keychain-profile "appstoreconnect" --wait

if [ "$1" == "UPLOAD" ]; then
    if [ -z "${!FIRST_TIME_OPTION}" ]; then
        echo "----Uploading iOS"
        xcrun altool --upload-app -f ./build/AboveVTT.ipa -t ios --apiKey $APP_STORE_CONNECT_API_KEY_ID --apiIssuer $APP_STORE_CONNECT_API_ISSUER_ID
    else
        echo "Skipping upload"
    fi
fi

echo "----Export macOS"
xcodebuild -exportArchive -archivePath ./build/AboveVTT-mac.xcarchive -exportPath ./build -exportOptionsPlist ExportOptions.plist -verbose  $FIRST_TIME_OPTION

echo "----Notarizing macOS"
xcrun notarytool submit ./build/AboveVTT.pkg --keychain-profile "appstoreconnect" --wait

if [ "$1" == "UPLOAD" ]; then
    if [ -z "${!FIRST_TIME_OPTION}" ]; then
        echo "----Uploading macOS"
        xcrun altool --upload-app -f ./build/AboveVTT.pkg -t macos --apiKey $APP_STORE_CONNECT_API_KEY_ID --apiIssuer $APP_STORE_CONNECT_API_ISSUER_ID
    else
        echo "Skipping upload"
    fi
fi
echo "Completed"


