const aboveVTT_jitsi_url = "https://meet.jit.si/aboveVTT*";

function set_options()
{
	var jitsi_permissions = {
		permissions:["webNavigation"],
		origins: [aboveVTT_jitsi_url]
	};
	chrome.permissions.contains(jitsi_permissions, (result) => {
		if(result)
		{
			document.getElementById('jitsi_access').innerText = "Remove Jitsi Access";
			document.getElementById('jitsi_access').dataset.giveAccess = "false";
		}
		else
		{
			document.getElementById('jitsi_access').innerText = "Give Jitsi Access";
			document.getElementById('jitsi_access').dataset.giveAccess = "true";
		}
	});
}

// function add_jitsi_access()
// {
	// var jitsi_permissions = {
		// origins: [aboveVTT_jitsi_url]
	// };
	
// }

// function remove_jitsi_access()
// {
	// var jitsi_permissions = {
		// origins: [aboveVTT_jitsi_url]
	// };
	// browser.permissions.remove(jitsi_permissions);
	
// }

document.addEventListener('DOMContentLoaded', set_options);
document.getElementById('jitsi_access').addEventListener('click', function(){
	var jitsi_permissions = {
		permissions:["webNavigation"],
		origins: [aboveVTT_jitsi_url]
	};
	if(document.getElementById('jitsi_access').dataset.giveAccess == "true")
	{
		
		chrome.permissions.request(jitsi_permissions,(granted) => {
			if (granted) {
				chrome.runtime.sendMessage({command:"addJitsiContentListner"});
				// const registeredScript = await registerContentScript({
					// matches: [aboveVTT_jitsi_url],
					// js: [{file: 'JitsiLoad.js'}],
					// allFrames: true
					// });
				// browser.contentScripts.register({
					// matches: [aboveVTT_jitsi_url],
					// js: [{file: 'LoadJitsi.js'}],
					// allFrames: true
					// });
			}
			set_options();
		});
	}
	else{
		chrome.permissions.remove(jitsi_permissions, set_options);
	}
});