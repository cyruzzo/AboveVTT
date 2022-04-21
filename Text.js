//Function to dynamically add an input box: 
function addInput([shape, drawType, color, x, y, width, height, linewidth]) {
// do something to figure out if the rect was drawn from the any corner that isn't top left
    //  25px is the height of the move/close bar
    ct_inside=$("<div id='draw_text_wrapper'/>");
    ct_inside.css({"position":"fixed",
                   "left":`${x}px`,
                   "top":`${y-25}px`,
                   "z-index":1000,
                   "width": width,
                   "height":height})

    const ct_title_bar=$("<div id='combat_tracker_title_bar' class='restored'></div>")
    const ct_title_bar_exit=$('<div id="combat_tracker_title_bar_exit"><svg class="" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g transform="rotate(-45 50 50)"><rect></rect></g><g transform="rotate(45 50 50)"><rect></rect></g></svg></div>')
    $(ct_title_bar_exit).on("click", function () {
        $(this).parent().parent().remove()
    });
    ct_title_bar.append(ct_title_bar_exit);
	ct_inside.append(ct_title_bar);

    $(ct_title_bar).data("prev-minimized-top", $("#combat_tracker_inside").css("top"));
    $(ct_title_bar).data("prev-minimized-left", $("#combat_tracker_inside").css("left"));
    $("#combat_tracker_inside").height($(ct_title_bar).data("prev-height"));
    $("#combat_tracker_inside").width($(ct_title_bar).data("prev-width"));
    $("#combat_tracker_inside").css("top", $(ct_title_bar).data("prev-top"));
    $("#combat_tracker_inside").css("left", $(ct_title_bar).data("prev-left"));
    $(ct_title_bar).addClass("restored");
    $(ct_title_bar).removeClass("minimized");
    $("#combat_tracker_inside").css("visibility", "visible");
    
    const input = $(`<input id='drawing_text' type="text" autocomplete="off">`)
    ct_inside.append(input)
    // do more style here
    input.css({
        "position": "relative",
        "width": "100%",
        "height": "100%",
        "text-align": window.DRAWDATA.alignment,
        "color":window.DRAWDATA.font_color,
        "background-color": color,
        "font-family": window.DRAWDATA.text_font,
        "font-size": `${window.DRAWDATA.text_size}px`,
        "font-weight": window.DRAWDATA.bold || "normal",
        "font-style": window.DRAWDATA.italic || "normal",
        "text-decoration": window.DRAWDATA.underline || "normal",
        "text-shadow": `-${window.DRAWDATA.stroke_size}px 0 ${window.DRAWDATA.stroke_color},
                        0 ${window.DRAWDATA.stroke_size}px ${window.DRAWDATA.stroke_color},
                        ${window.DRAWDATA.stroke_size}px 0 ${window.DRAWDATA.stroke_color},
                        0 -${window.DRAWDATA.stroke_size}px ${window.DRAWDATA.stroke_color}`

    })
    $("#VTT").append(ct_inside)
    $(input).on("keypress", handleEnter)

    $(input).focus()

}

//Key handler for input box:
function handleEnter(e) {
    var keyCode = e.keyCode;
    if (keyCode === 13) {
        drawText(this,
                 parseInt($(this).parent().css("left")),
                 parseInt($(this).parent().css("top")))
        $(this).parent().remove()
    }
}

//Draw the text onto canvas:
function drawText(textInput, x, y) {
    var canvas = document.getElementById("fog_overlay");
    const context = canvas.getContext("2d");
    // context.strokeStyle = window.DRAWDATA.stroke_color
    context.font = `${$(textInput).css("font-size")} ${$(textInput).css("font-family")}`

    context.font = "128px sans-serif";
    context.textBaseline = "top";
    context.lineJoin = "round";
    context.strokeStyle = "#fff";
    context.lineWidth = 11;

    context.strokeText(textInput.value, x, y);
    context.globalCompositeOperation = "destination-out";
    context.fillText(textInput.value, x, y);
    context.globalCompositeOperation = "source-over";      // normal comp. mode
    context.fillStyle = "rgba(0,0,0,0.5)";                 // draw in target fill/color
    context.fillText("MY TEXT", 10, 10);
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
            <div tabindex='1' id='text_bold' data-key="bold" data-value="bold" class='drawbutton text-option ddbc-tab-options__header-heading menu-option '>
                <span class='material-icons' style='font-size: 12px'>format_bold</span>
            </div>
        </div>`);
    textMenu.append(
        `<div class='ddbc-tab-options--layout-pill'>
            <div tabindex='2' id='text_italic' data-key="italic" data-value="italic" class='drawbutton text-option ddbc-tab-options__header-heading menu-option '> 
                <span class='material-icons' style='font-size: 12px'>format_italic</span>
            </div>
        </div>`);
    textMenu.append(
        `<div class='ddbc-tab-options--layout-pill'>
            <div tabindex='3' id='text_underline' data-key="underline" data-value="underline" class='drawbutton text-option ddbc-tab-options__header-heading menu-option '> 
                <span class='material-icons' style='font-size: 12px'>format_underlined</span>
            </div> 
        </div>`);


    textMenu.append("<div class='menu-subtitle'>Alignment</div>");
    textMenu.append(
        `<div class='ddbc-tab-options--layout-pill'>
            <div tabindex='1' id='text_left' data-key="alignment" data-value="left" class='drawbutton text-option ddbc-tab-options__header-heading menu-option button-enabled ddbc-tab-options__header-heading--is-active' data-unique-with='text_alignment'> 
                <span class='material-icons' style='font-size: 12px'>format_align_left</span>
            </div>
        </div>`);
    textMenu.append(
        `<div class='ddbc-tab-options--layout-pill'>
            <div tabindex='2' id='text_center' data-key="alignment" data-value="center" class='drawbutton text-option ddbc-tab-options__header-heading menu-option' data-unique-with='text_alignment'>
                <span class='material-icons' style='font-size: 12px'>format_align_center</span>
            </div>
        </div>`);
    textMenu.append(
        `<div class='ddbc-tab-options--layout-pill'>
            <div tabindex='3' id='text_right' data-key="alignment" data-value="right" class='drawbutton text-option ddbc-tab-options__header-heading menu-option' data-unique-with='text_alignment'>
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
