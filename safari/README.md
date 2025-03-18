To do a test build for personal use:

-- open the Xcode project
-- Choose iOS or Mac at the top and one of your devices
-- Go to each target (4 of them) in build settings and choose your Personal Dev Team for "Team"
-- Build and Run
-- You will need to "trust" your personal team on each device as well

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
  - Download the .p8 file and store it as `safari/appkey.p8`
  - For local build script execute this (securely stores credentials for local build):
      `cd safari; source appconnect_setup.sh appkey.p8`

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
  - `git add *.*profile*`

-This is what you need to put in github secrets for safari-release-build.yml.
 - Choose a password (eg "p12pass123") - this later goes into github secret `P12_PASSWORD`
 - List the signing certs on your mac with:
     `security find-identity -p codesigning -v`
 - Ensure there is at least one each of "Apple Development","Apple Distribution", and
   "Mac Installer Distribution"
 - Need to get this certificates into github secrets.
 - Easiest way:
    - open XCode -> Settings -> Accounts
    - Choose your account on left (prob only 1), choose the org (NOT PERSONAL) on right
    - Click "Manage Certificates"
    -   Hopefully we see the certs there.  Need to right-click 
        "Export Certificate" on one each of "Apple Dev Cert", 
        "Apple Dist Cert", "Mac Installer Dist". 
        Use the P12_PASSWORD above to encrypt.  Save the files as cert[1-3].p12
        
        
- Use `gh auth login` and `upload_secrets.sh` script to get those and the app 
  connect key from earlier to github secrets (or do it manually)

- probably should do one local build and full push to TestFlight before running in Github
  - `cd safari; ./build.sh UPLOAD`
  
- Go ahead and `git commit` and push (the profiles, env, and project file changes)


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
