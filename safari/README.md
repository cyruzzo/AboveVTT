To Setup up TestFlight and App store building:

- Need a mac with Xcode and command line tools installed and selected
- Have a apple developer account (about $100/yr)
- Need to replace the "Team ID" (MY_DEV_TEAM) from that account in 'project.pbxproj' file everywhere
  there is a DEVELOPMENT_TEAM = MY_DEV_TEAM.  eg. 	DEVELOPMENT_TEAM = TXXXP583P0;
- Also put into `safari/env`
- Decide on bundle identifier (eg com.foo.AboveVTT)
  - replace `org.something` in `project.pbxproj` file and `safari/env`
- Create AppStore Apple Distribution Cert
  - Create Certificate - Apple Distribution -> Continue
  - Generate CSR and upload file -> Download
  - double-click/open the .cer file in Finder (this adds to keychain)
- Create bundle ID for app
  - https://developer.apple.com/account/resources/identifiers/list
  - hit "+", Choose "App IDs" -> Continue
  - App -> Continue
  - Verify Team ID, Enter Description and (explicit) Bundle ID (eg com.foo.AboveVTT) 
  - No other capabilities/App Service necessary -> Click Continue
  - Click Register
- Create App Store slot:
- Go to: https://appstoreconnect.apple.com/apps
- Click "+ -> New App" next to Apps
  - Choose iOS and MacOS as platform
  - Give it a name "AboveVTT"
  - Select the bundle id we made in previous step
  - Put in an SKU (it doesn't really matter)
  - Choose Full Access
  - Click "Create"
  - There is a fair bit of meta data to add...privacy policy...encryption declaration etc
  (TODO... also set up TestFlight for testing - not necessary just to build)

- Set Up Your App Store Connect API Key (Allows CI to upload to TestFlight)
  - You’ll need an API key to authenticate with App Store Connect.
  - Go to App Store Connect → Users and Access → Integrations
     `https://appstoreconnect.apple.com/access/integrations/api`
  - Generate a new API key with “App Manager” role (a Team Key will be convenient).
  - Collect the "Issuer ID" and "Key ID" from this page and update safari/env
  - Download the .p8 file and store it securely (this is really the only sensitive thing here).
  - For local build script execute this:
      `cd safari; source appconnect_setup.sh FILENAME_YOU_DOWNLOADED`
 - For github actions: put the contents of that file into github secrets:
      `base64 P8FILE_YOU_DOWNLOADED | pbcopy` and paste to github

- We need to collect the relevant Provisioning Profiles.  Easiest way is to delete
  all that exist on local machine (or move temporarily) and then do builds of ONLY
  AboveVTT to pull/generate profiles we need. So...
  - optionally `rm ~/Library/Developer/Xcode/UserData/Provisioning\ Profiles/*`
  - or backup that dir before
  - but maybe you don't have anything there anyway (if you are not a mac dev)

- Execute initial build on Mac (this will create provisioning profiles)
  - `cd safari; ./build_init_profile.sh`
  - Copy all those profiles to Safari (and commit them for GitHub build)
  - `cp ~/Library/Developer/Xcode/UserData/Provisioning\ Profiles/* .`

-This is what you need to put in github secrets for safari-release-build.yml.
 - Choose a password (eg "p12pass123") - this goes into github secret `P12_PASSWORD`
 - List the signing certs on your mac with:
     `security find-identity -p codesigning -v`
 - Ensure there is at least one "Apple Development" and one "Apple Distribution" cert
 - Need to get this certificates into github secrets.
 - Easiest way:
    - open XCode -> Settings -> Accounts
    - Choose your account on left (prob only 1), choose the org (NOT PERSONAL) on right
    - Click "Manage Certificates"
    -   Hopefully we see the certs there.  Need to right-click "Export Certificate" on
        one each of "Apple Dev Cert" and "Apple Dist Cert". Use the P12_PASSWORD above to 
        encrypt.  Save as two WHATEVER.p12 files
 - Get those .p12 files into github secrets (order doesn't matter):
 - `BUILD_CERTIFICATE_BASE64` and  `BUILD_CERTIFICATE2_BASE64`
 - `base64 -i WHATEVER.p12 | pbcopy` and paste into github `BUILD_CERTIFICATE_BASE64`
 - `base64 -i WHATEVER_2.p12 | pbcopy` and paste into github `BUILD_CERTIFICATE2_BASE64`

- probably should do one local build and full push to TestFlight before running in Github
  - `cd safari; ./build.sh`
- Go ahead and git add all the profiles and push the changes
- Not sure how we should configure the workflow triggers...


Things that some people might consider sensitive but really are not:
  Team ID - this can be found through various means including app store presence.
  Provisioning Profiles - they are actually extractable directly from the .ipa file hosted by the store

Note about building locally for testing on Mac Safari (not iOS):

Safari seems to get confused with multiple versions of extensions with
the same Bundle Identifier.  To alleviate weirdness - if you temporarily change
the bundle ids of the app and extension each time you build to
something with a random number in it (eg.  foo.bar.AboveVTT.debug33
and foo.bar.AboveVTT.debug33.Extension) then it will work better.  The
alternative is a lot of clearing of Safari Library caches.

----------------
hopefully don't need these instructions anymore given automatic provisioning.
This doesn't actually completely work anyway since there are many profiles during the build,
not just these final 2 for distribution.  Automatic provisioning is about the only sane
option given the Apple complexity here...


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
  

  
   
  
  
  
- Create provisioning profiles:
  - https://developer.apple.com/account/resources/profiles/list
  - click + Profile
  - choose Distribution - App Store Connect -> Continue
  - Select the AboveVTT app id from pulldown -> Continue
     Note: be sure you choose bundle id WITHOUT `.Extension` at the end
  - Select the distribution cert you made above -> Continue
  - "AboveVTTProvisionProfile" for name -> Generate
  - Download and move to `safari/AboveVTTProvisionProfile.mobileprovision` directory
  - Repeat the above for the extension:
  - This time: "AboveVTTProvisionProfileExtension" for name
  - Download and move to `safari/AboveVTTProvisionProfileExtension.mobileprovision` directory  
