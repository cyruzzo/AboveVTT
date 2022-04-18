
function setup_text_button(buttons) {
    text_button = $("<div style='display:inline;width:75px' id='text_button' class='drawbutton menu-button hideable ddbc-tab-options__header-heading'><u>T</u>ext</div>");
    text_menu = $("<div id='text_menu' class='top_menu'></div>");

    text_menu.append("<div class='menu-subtitle'>Font</div>");
    text_menu.append("<div class='menu-subtitle'>Size</div>");
    text_menu.append("<div><input tabindex='2' id='text_size' value='20' style='width:75px;margin:0px;text-align:center' maxlength='10' type='number' step='5'></div>");

    
    text_menu.append("<div class='menu-subtitle'>Color</div>");



    text_menu.css("position", "fixed");
    text_menu.css("top", "25px");
    text_menu.css("width", "75px");
    text_menu.css('background', "url('/content/1-0-1487-0/skins/waterdeep/images/mon-summary/paper-texture.png')");

    $("body").append(text_menu);


    buttons.append(text_button);
    text_menu.css("left", text_button.position().left);

}

