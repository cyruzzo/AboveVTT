function updateColorAlpha(element){
    return
}

function setup_text_button_handlers() {
    $("#text_button").on("click", function () {
        // close other menus, make other menu buttons not look selected
        $(".top_menu").removeClass('visible');
        $(".draw-button").removeClass("button-selected button-enabled ddbc-tab-options__header-heading--is-active")
        // make text menu visible
        $("#text_menu").addClass('visible');
        
        // add the classes that make it look selected
        $(this).addClass("button-selected")
        $(this).addClass('button-enabled');
        $(this).addClass('ddbc-tab-options__header-heading--is-active');
    });
}

function setup_text_button(buttons) {
    availableFonts = ["Roboto Condensed", "Arial Narrow", "Helvetica Neue", "Helvetica", "Arial", "sans-serif","Gloria Hallelujah"];
    textButton = $(
        "<div style='display:inline' id='text_button' class='menu-button hideable ddbc-tab-options__header-heading'><u>T</u>ext</div>"
    );
    textMenu = $("<div id='text_menu' class='top_menu' style='position:fixed; top:25px; width:75px'></div>");
    textMenu.append("<div class='menu-subtitle'>Font</div>");
    textMenu.append(`<select id='text_font' name='font' style='width:inherit; margin:0px; text-align:center'>
        ${availableFonts.map((font) => {
        return `<option style='font-family:${font}'value=${font}>${font}</option>`;
    })}
    </select>`);
    textMenu.append(
        "<input title='Text size' id='text_size' value='20' style='width:inherit; margin:0px; text-align:center' maxlength='3' type='number' step='1'>");


    textMenu.append("<div class='menu-subtitle'>Font Style</div>");
    textMenu.append(
        "<div class='ddbc-tab-options--layout-pill'>\
            <div tabindex='1' id='text_bold' class='text-option ddbc-tab-options__header-heading menu-option '> \
                <span class='material-icons' style='font-size: 12px'>format_bold</span>\
            </div> \
        </div>");
    textMenu.append(
        "<div class='ddbc-tab-options--layout-pill'>\
            <div tabindex='2' id='text_italic' class='text-option ddbc-tab-options__header-heading menu-option '> \
                <span class='material-icons' style='font-size: 12px'>format_italic</span>\
            </div> \
        </div>");
    textMenu.append(
        "<div class='ddbc-tab-options--layout-pill'>\
            <div tabindex='3' id='text_underline' class='text-option ddbc-tab-options__header-heading menu-option '> \
                <span class='material-icons' style='font-size: 12px'>format_underlined</span>\
            </div> \
        </div>");


    textMenu.append("<div class='menu-subtitle'>Alignment</div>");
    textMenu.append(
        "<div class='ddbc-tab-options--layout-pill'>\
            <div tabindex='1' id='text_left' class='text-option ddbc-tab-options__header-heading menu-option remembered-selection'> \
                <span class='material-icons' style='font-size: 12px'>format_align_left</span>\
            </div> \
        </div>");
    textMenu.append(
        "<div class='ddbc-tab-options--layout-pill'>\
            <div tabindex='2' id='text_center' class='text-option ddbc-tab-options__header-heading menu-option '> \
                <span class='material-icons' style='font-size: 12px'>format_align_center</span>\
            </div> \
        </div>");
    textMenu.append(
        "<div class='ddbc-tab-options--layout-pill'>\
            <div tabindex='3' id='text_right' class='text-option ddbc-tab-options__header-heading menu-option '> \
                <span class='material-icons' style='font-size: 12px'>format_align_right</span>\
            </div> \
        </div>");


    textMenu.append(`<div class='menu-subtitle'>Font</div> \
        <input title='Text colour' class='ddbc-tab-options--layout-pill' type='color' id='font_colour' name='Font' value='#e66465'></input> \
        <input title='Text transparency' type='range' style='width:inherit' 
            id='text_alpha' onchange=${updateColorAlpha(this)} min='0' max='1' step='0.1' value='1'>
        `);


    textMenu.append(`<div class='menu-subtitle'>Background</div> \
        <input title='Background colour' type='color' id='text_bg_colour' name='backgroundColour' value='#ffffff'></input>
        <input title='Background transparency' type='range' style='width:inherit' \
            id='text_bg_alpha' onchange=${updateColorAlpha(this)} min='0' max='1' step='0.1' value='0'>
        `)


    textMenu.append(`<div class='menu-subtitle'>Stroke</div> \
        <input title='Stroke size' id='stroke_size' value='1' style='width:inherit; margin:0px; text-align:center' maxlength='3' type='number' step='1'>"
        <input title='Stroke colour' type='color' id='stroke_colour' name='strokeColour' value='#e66465'></input>
        <input title='Stroke transparency' type='range' style='width:inherit' \
            id='stroke_alpha' onchange=${updateColorAlpha(this)} min='0' max='1' step='0.1' value='0'>
        `)
    $("body").append(textMenu);

    buttons.append(textButton);
    textMenu.css("left", textButton.position().left);
    
    setup_text_button_handlers()
}
