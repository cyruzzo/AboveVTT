function createElementFromHTML(htmlString) {
  var div = document.createElement('div');
  div.innerHTML = htmlString.trim();

  // Change this to div.childNodes to support multiple top-level nodes
  return div.firstChild; 
}

function isHidden(el) {
    var style = window.getComputedStyle(el);
    return (style.display === 'none')
}

function add_hide_self_button()
{
	var extensionPath = "";
	chrome.runtime.sendMessage({command: "getExtensionURL"}, function(response) {
		extensionPath = response.data;
		let hideSelfButton = createElementFromHTML("<div id='vtt_jitsi_buttons'><button id='jitsi_hide_self_view' class='hasTooltip button-icon jitsi-internal-button' data-name='Hide Self View'><img id='hide_self_view_img' src='"+ extensionPath + "assets/hide_self_view.png"+"' class='jitsi-internal-image ' /></button></div>");
		document.getElementById("layout_wrapper").appendChild(hideSelfButton);
		document.getElementById("vtt_jitsi_buttons").style.position = "absolute";
		document.getElementById("vtt_jitsi_buttons").style.top = "0px";
		document.getElementById("vtt_jitsi_buttons").style.left = "64px";
		document.getElementById("vtt_jitsi_buttons").addEventListener("click", function() {
			let selfView = document.getElementById("localVideo_container");
			let selfViewWrapper = document.getElementById("localVideoWrapper");
			if(!isHidden(selfView))
			{
				selfView.style.display = "none";
				let hiddenPanel = createElementFromHTML("<div id='hide_self_view_panel' class='jitsi-self-view-panel'>Self View Hidden</div>");
				selfViewWrapper.append(hiddenPanel);
				document.querySelector('#hide_self_view_img').setAttribute('src', extensionPath + "assets/show_self_view.png");
				document.getElementById("vtt_jitsi_buttons").dataset.name = "Show Self View";
				
			}
			else
			{
				selfView.style.display = "initial";
				document.getElementById("hide_self_view_panel").remove();
				document.getElementById("hide_self_view_img").setAttribute('src', extensionPath + "assets/hide_self_view.png");
				document.getElementById("vtt_jitsi_buttons").dataset.name = "Hide Self View";
				
				// selfView.show();
				// $("#hide_self_view_panel").remove();
				// $("img", this).attr("src", extensionPath + "assets/hide_self_view.png");
				// $("#jitsi_hide_self_view").attr("data-name","Hide Self View");
			}
		});	
		
	});
}

add_hide_self_button();


