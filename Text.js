//Function to dynamically add an input box: 
function addInput([shape, drawType, color, x, y, width, height, linewidth]) {
// do something to figure out if the rect was drawn from the any corner that isn't top left
    const input = $(`<input id='drawing_text' type="text">`)
    // do more style here
    input.css({
        "position":"fixed",
        "left":`${x}px`,
        "top":`${y}px`,
        "z-index":1000,
        "width": width,
        "height":height,
        "text-align": window.DRAWDATA.text_align,
        "color":window.DRAWDATA.font_color,
        "background-color": color,
        "font-family": window.DRAWDATA.text_font,
        "font-size": `${window.DRAWDATA.text_size}px`,
        "font-weight": window.DRAWDATA.bold || "normal",
        "font-style": window.DRAWDATA.italic || "normal",
        "text-decoration": window.DRAWDATA.underline || "normal"

    })
    $("#VTT").append(input)
    $(input).on("keypress", handleEnter)

    $(input).focus()

}

//Key handler for input box:
function handleEnter(e) {
    var keyCode = e.keyCode;
    if (keyCode === 13) {
        drawText(this.value, parseInt(this.style.left, 10), parseInt(this.style.top, 10));
        $(this).remove()
    }
}

//Draw the text onto canvas:
function drawText(txt, x, y) {
    var canvas = document.getElementById("fog_overlay");
    const context = canvas.getContext("2d");
    context.font = "Roboto Condensed";
    context.fillText(txt, x, y);
}

function init_text_button(buttons) {
    availableFonts = ["Roboto Condensed", "Arial Narrow", "Helvetica Neue", "Helvetica", "Arial", "sans-serif","Gloria Hallelujah"];
    textButton = $(
        "<div style='display:inline' id='text_button' class='drawbutton menu-button hideable ddbc-tab-options__header-heading'><u>T</u>ext</div>"
    );
    textMenu = $("<div id='text_menu' class='top_menu' style='position:fixed; top:25px; width:75px'></div>");
    textMenu.append("<div class='menu-subtitle'>Font</div>");
    textMenu.append(`<select id='text_font' data-required="text_font" name='font' style='width:inherit; margin:0px; text-align:center'>
        ${availableFonts.map((font) => {
        return `<option  style='font-family:${font}'value=${font}>${font}</option>`;
    })}
    </select>`);
    textMenu.append(
        `<input title='Text size' data-required="text_size" id='text_size' min='1' value='20' style='width:inherit; margin:0px; text-align:center' maxlength='3' type='number' step='1'>`);


    textMenu.append("<div class='menu-subtitle'>Font Style</div>");
    textMenu.append(
        `<div class='ddbc-tab-options--layout-pill'>
            <div tabindex='1' id='text_bold' data-value="text_bold" class='drawbutton text-option ddbc-tab-options__header-heading menu-option '>
                <span class='material-icons' style='font-size: 12px'>format_bold</span>
            </div>
        </div>`);
    textMenu.append(
        `<div class='ddbc-tab-options--layout-pill'>
            <div tabindex='2' id='text_italic' data-value="text_italic" class='drawbutton text-option ddbc-tab-options__header-heading menu-option '> 
                <span class='material-icons' style='font-size: 12px'>format_italic</span>
            </div>
        </div>`);
    textMenu.append(
        `<div class='ddbc-tab-options--layout-pill'>
            <div tabindex='3' id='text_underline' data-value="text_underline" class='drawbutton text-option ddbc-tab-options__header-heading menu-option '> 
                <span class='material-icons' style='font-size: 12px'>format_underlined</span>
            </div> 
        </div>`);


    textMenu.append("<div class='menu-subtitle'>Alignment</div>");
    textMenu.append(
        `<div class='ddbc-tab-options--layout-pill'>
            <div tabindex='1' id='text_left' data-key="alignment" data-value="text_left" class='drawbutton text-option ddbc-tab-options__header-heading menu-option button-enabled ddbc-tab-options__header-heading--is-active' data-unique-with='text_alignment'> 
                <span class='material-icons' style='font-size: 12px'>format_align_left</span>
            </div>
        </div>`);
    textMenu.append(
        `<div class='ddbc-tab-options--layout-pill'>
            <div tabindex='2' id='text_center' data-key="alignment" data-value="text_center" class='drawbutton text-option ddbc-tab-options__header-heading menu-option' data-unique-with='text_alignment'>
                <span class='material-icons' style='font-size: 12px'>format_align_center</span>
            </div>
        </div>`);
    textMenu.append(
        `<div class='ddbc-tab-options--layout-pill'>
            <div tabindex='3' id='text_right' data-key="alignment" data-value="text_right" class='drawbutton text-option ddbc-tab-options__header-heading menu-option' data-unique-with='text_alignment'>
                <span class='material-icons' style='font-size: 12px'>format_align_right</span>
            </div>
        </div>`);


    textMenu.append(`<div class='menu-subtitle'>Font</div>
        <input title='Text color' data-required="text_color" class='spectrum'
            id='font_color' name='Font' value='black' />
        `);


    textMenu.append(`<div class='menu-subtitle'>Background</div> 
        <input title='Background color' data-required="background_color" class='spectrum'
            id='background_color' name='backgroundColor' value='rgba(17, 17, 17, 0.505)' />
        `)


    textMenu.append(`<div class='menu-subtitle'>Stroke</div> 
        <input title='Stroke size' id='stroke_size' data-required="stroke_size" min='0'
            value='1' style='width:inherit; margin:0px; text-align:center' maxlength='3' type='number' step='1'/>
        <input title='Stroke color' data-required="stroke_color" class='spectrum'
            id='stroke_color' name='strokeColor' value='white' />
        `)
    $("body").append(textMenu);


    let colorPickers = textMenu.find('input.spectrum');
	colorPickers.spectrum({
		type: "color",
		showInput: true,
		showInitial: true,
		clickoutFiresChange: false
	});

    const colorPickerChange = function(e, tinycolor) {
		let color = `rgba(${tinycolor._r}, ${tinycolor._g}, ${tinycolor._b}, ${tinycolor._a})`;
        $(e.target).val(color)

	};
	colorPickers.on('move.spectrum', colorPickerChange);   // update the token as the player messes around with colors
	colorPickers.on('change.spectrum', colorPickerChange); // commit the changes when the user clicks the submit button
	colorPickers.on('hide.spectrum', colorPickerChange);   // the hide event includes the original color so let's change it back when we get it

    buttons.append(textButton);
    textMenu.css("left", textButton.position().left);
    
}
