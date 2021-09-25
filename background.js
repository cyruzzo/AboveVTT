/* const add_hide_self_button_code = `let hideSelfButton = $(`<div id='vtt_jitsi_buttons'><button id='jitsi_hide_self_view' class='hasTooltip button-icon jitsi-internal-button' data-name='Hide Self View'><img id='hide_self_view_img' src="${window.EXTENSION_PATH + "assets/hide_self_view.png"}" class='jitsi-internal-image ' /></button></div>`);
	$("#layout_wrapper").append(hideSelfButton);
	$("#vtt_jitsi_buttons").css("position", "absolute").css("top", "0px").css("left", "64px")
	$("#jitsi_hide_self_view").click(
	function() {
		let selfView = $("#localVideo_container");
		let selfViewWrapper = $("#localVideoWrapper");
		if(selfView.is(":visible"))
		{
			selfView.hide();
			let hiddenPanel = $("<div id='hide_self_view_panel' class='jitsi-self-view-panel'>Self View Hidden</div>");
			selfViewWrapper.append(hiddenPanel);
			$("img", this).attr("src", $("#extensionpath").attr('data-path') + "assets/show_self_view.png");
			$("#jitsi_hide_self_view").attr("data-name","Show Self View");
			
		}
		else
		{
			selfView.show();
			$("#hide_self_view_panel").remove();
			$("img", this).attr("src", $("#extensionpath").attr('data-path') + "assets/hide_self_view.png");
			$("#jitsi_hide_self_view").attr("data-name","Hide Self View");
		}
	});	` */

const aboveVTT_jitsi_url = "https://meet.jit.si/aboveVTT*";
const jitsi_url = "https://meet.jit.si/*";

function url_domain(data) {
  var    a      = document.createElement('a');
         a.href = data;
  return a.hostname;
}

function addJitsiContentScript()
{
	chrome.contentScripts.register({
		matches: [aboveVTT_jitsi_url],
		js: [{file: 'LoadJitsi.js'}],
		allFrames: true
		});
}

function JitsiOncompleteListener(details)
{
	if(details.url)
	{
		const { hostname } = new URL(details.url);
		if(hostname == "meet.jit.si")
		{
			let injectCSSDetails =
			{
				allFrames: (details.frameId > 0),
				file: "abovevtt_jitsi.css",
				// code: add_hide_self_button_code,
				frameId: details.frameId				
			}
			chrome.tabs.insertCSS(details.tabId, injectCSSDetails);
			
			//start with jquery
			let injectJQueryDetails =
			{
				allFrames: (details.frameId > 0),
				file: "jquery.min.js",
				// code: add_hide_self_button_code,
				frameId: details.frameId				
			}
			chrome.tabs.executeScript(details.tabId, injectJQueryDetails, function() {
				let injectCodeDetails =
				{
					allFrames: (details.frameId > 0),
					file: "JitsiInternal.js",
					// code: add_hide_self_button_code,
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
		origins: [aboveVTT_jitsi_url]
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