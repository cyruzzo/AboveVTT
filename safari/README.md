To Setup up TestFlight and App store building:

- Have a apple developer account (about $100/yr)
- Need to replace the "Team ID" from that account in 'project.pbxproj' file everywhere
  there is a DEVELOPMENT_TEAM = specified
- Also put into `safari/env`
- Decide on bundle identifier
  - replace in `project.pbxproj` file and `safari/env`
- Do a build in Xcode to local mac and local iOS device
  - This will bring in our Developer cert and add the bundle IDs to dev site
- Create AppStore Apple Distribution Cert
  - Create Certificate - Apple Distribution -> Continue
  - Generate CSR and upload file -> Download
  - double-click/open the .cer file in Finder (this adds to keychain)
- Create provisioning profiles:
  - https://developer.apple.com/account/resources/profiles/list
  - click + Profile
  - choose Distribution - App Store Connect -> Continue
  - Select the AboveVTT app id from pulldown -> Continue
     Note: be sure you choose bundle id WITHOUT `.Extension` at the end
  - Select the distribution cert -> Continue
  - "AboveVTTProvisionProfile" for name -> Generate
  - Download and move to `safari/AboveVTTProvisionProfile.mobileprovision` directory
  - Repeat the above for the extension:
  - This time: "AboveVTTProvisionProfileExtension" for name
  - Download and move to `safari/AboveVTTProvisionProfileExtension.mobileprovision` directory  
- Create App Store slot:
- Go to: https://appstoreconnect.apple.com/apps
- Click "+ -> New App" next to Apps
  - Choose iOS and MacOS as platform
  - Give it a name "AboveVTT"
  - Select the bundle id (it will appear if you've already used XCode to establish certs)
  - Put in an SKU (it doesn't really matter)
  - Choose Full Access
  - Click "Create"
  - There is a fair bit of meta data to add...privacy policy...encryption declaration etc
  (TODO)
  
Set Up Your App Store Connect API Key (Allows CI to upload to TestFlight)

You’ll need an API key to authenticate with App Store Connect.
 - Go to App Store Connect → Users and Access → Integrations
     `https://appstoreconnect.apple.com/access/integrations/api`
 - Generate a new API key with “App Manager” role (a Team Key will be convenient).
 - Collect the "Issuer ID" and "Key ID" from this page and update safari/env
 - Download the .p8 file and store it securely (this is really the only sensitive thing here).
 - For local build script execute this:
     `cd safari; source appconnect_setup.sh FILENAME_YOU_DOWNLOADED`
 - For github actions: put the contents of that file into github secrets:
     `base64 P8FILE_YOU_DOWNLOADED | pbcopy` and paste to github
        
Note about building locally for testing on Mac (not iOS):

Safari seems to get confused with multiple versions of extensions with
the same Bundle Identifier.  To alleviate weirdness - if you temporarily change
the bundle ids of the app and extension each time you build to
something with a random number in it (eg.  foo.bar.AboveVTT.debug33
and foo.bar.AboveVTT.debug33.Extension) then it will work better.  The
alternative is a lot of clearing of Safari Library caches.

This is what you need to put in github secrets for safari-release-build.yml.
 - Choose a password (eg "p12pass123") - this goes into github secret `P12_PASSWORD`
 - List the signing certs on your mac with:
     `security find-identity -p codesigning -v`
 - Ensure there is at least one "Apple Development" and one "Apple Distribution" cert
 - There should be a keychain called "distributionbackups"
 - Export the keychain and base64 encode to clipboard.  Use the password above to encrypt it.
   `security export -k ~/Library/Keychains/disributionbackups.keychain -t certs -f pkcs12 -o certs.p12| base64 | pbcopy`
 - paste that value into the github secret `BUILD_CERTIFICATE_BASE64`
 - If that doesn't work - you can do this instead - but value might be too large for secrets
   `security export -k ~/Library/Keychains/login.keychain-db -t certs -f pkcs12 -o certs.p12| base64 | pbcopy`

Things that some people might consider sensitive but really are not:
  Team ID - this can be found through various means including app store presence.
  Provisioning Profiles - they are actually extractable directly from the .ipa file hosted by the store
  
   
