
function setup_template_button() {
	template_button = $("<button style='display:inline;width:100px' id='template_button' class='drawbutton menu-button hideable'><u>T</u>EMPLATE</button>");
    if (window.DM){
		buttons.append(template_button);
		draw_menu.css("left",template_button.position().left);
	}
}