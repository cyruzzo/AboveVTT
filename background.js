const aboveVTT_jitsi_url = "https://meet.jit.si/aboveVTT";
const jitsi_url = "https://meet.jit.si/*";

function url_domain(data) {
  var    a      = document.createElement('a');
         a.href = data;
  return a.hostname;
}

function addJitsiContentScript()
{
	chrome.contentScripts.register({
		matches: [aboveVTT_jitsi_url+"*"],
		js: [{file: 'LoadJitsi.js'}],
		allFrames: true
		});
}

function JitsiOncompleteListener(details)
{
	if(details.url)
	{
		if(details.url.search(aboveVTT_jitsi_url) > -1)
		{
			let injectCSSDetails =
			{
				file: "abovevtt_jitsi.css",
				frameId: details.frameId				
			}
			chrome.tabs.insertCSS(details.tabId, injectCSSDetails);
			
			//start with jquery
			let injectJQueryDetails =
			{
				file: "jquery.min.js",
				frameId: details.frameId				
			}
			chrome.tabs.executeScript(details.tabId, injectJQueryDetails, function() {
				let injectCodeDetails =
				{
					file: "JitsiInternal.js",
					frameId: details.frameId				
				}
				
				chrome.tabs.executeScript(details.tabId, injectCodeDetails);
			});
			
		}
	}
	
}

function addJitsiContentListner()
{
	var jitsi_permissions = {
		permissions:["webNavigation"],
		origins: [aboveVTT_jitsi_url+"*"]
	};
	chrome.permissions.contains(jitsi_permissions, (result) => {
		if(result)
		{
			chrome.webNavigation.onCompleted.addListener(JitsiOncompleteListener);
		}
	});
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
    if (request.command == "addJitsiContentListner"){
		addJitsiContentListner();
      // addJitsiContentScript();
	}
	if(request.command == "getExtensionURL")
	{
		sendResponse({data: chrome.runtime.getURL("/")});
		
	}
  }
);

addJitsiContentListner();
