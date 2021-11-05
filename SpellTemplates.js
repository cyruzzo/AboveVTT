
function setup_template_button() {
	template_button = $("<button style='display:inline;width:100px' id='template_button' class='drawbutton menu-button hideable'><u>T</u>EMPLATE</button>");
    template_menu = $("<div id='template_menu' class='top_menu'></div>");

    template_menu.append("<div style='font-weight:bold'>Size</div>");
	template_menu.append("<div><input id='template_size' style='width:100px;margin:0px;text-align:center' maxlength='10'></div>");

    template_menu.append("<div style='font-weight:bold'>Color</div>");
	template_menu.append("<div><button id='template_default' class='drawbutton menu-option template-option templatecolor remembered-selection' style='width:100px'>Default</button></div>");
	template_menu.append("<div><button id='template_fire' class='drawbutton menu-option template-option templatecolor' style='width:100px'>Fire</button></div>");
	template_menu.append("<div><button id='template_dark' class='drawbutton menu-option template-option templatecolor' style='width:100px'>Dark</button></div>");
	template_menu.append("<div><button id='template_green' class='drawbutton menu-option template-option templatecolor' style='width:100px'>Green</button></div>");

    template_menu.append("<div style='font-weight:bold'>Type</div>");
	template_menu.append("<div><button id='template_line' class='templatetype' style='width:100px'>Line</button></div>");
	template_menu.append("<div><button id='template_cone' class='templatetype' style='width:100px'>Cone</button></div>");
	template_menu.append("<div><button id='template_square' class='templatetype' style='width:100px'>Square</button></div>");
	template_menu.append("<div><button id='template_circle' class='templatetype' style='width:100px'>Circle</button></div>");

    template_menu.css("position", "fixed");
	template_menu.css("top", "25px");
	template_menu.css("width", "100px");
	template_menu.css('background', "url('/content/1-0-1487-0/skins/waterdeep/images/mon-summary/paper-texture.png')")

    $("body").append(template_menu);

    if (window.DM){
		buttons.append(template_button);
        template_menu.css("left",template_button.position().left);
	}
}