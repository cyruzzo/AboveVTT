function createMoveableTextWrapper(x, y, width, height) {
    wrapper = $("<div id='draw_text_wrapper'/>");
    wrapper.css({
        "position": "fixed",
        "left": `${x}px`,
        "top": `${y - 25}px`,
        "z-index": 1000,
        "width": width,
        "height": height,

    });

    $(wrapper).addClass("moveableWindow");
    $(wrapper).draggable({
        handle: "#combat_tracker_title_bar",
        addClasses: false,
        scroll: false,
        containment: "#fog_overlay",
        distance: 10,
        drag: function( event, ui ) {
            mousex = Math.round(((event.pageX - 200) * (1.0 / window.ZOOM)));
            mousey = Math.round(((event.pageY - 200) * (1.0 / window.ZOOM)));
            ui.position.left = mousex;
            ui.position.top = mousey;
          }
    });

    const titleBar = $(
        "<div id='combat_tracker_title_bar' class='restored'></div>"
    );
    const closeCross = $(
        '<div id="combat_tracker_title_bar_exit"><svg class="" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g transform="rotate(-45 50 50)"><rect></rect></g><g transform="rotate(45 50 50)"><rect></rect></g></svg></div>'
    );
    $(closeCross).on("click", function () {
        $(this).parent().parent().remove();
    });
    titleBar.append(closeCross);
    wrapper.append(titleBar);

    return wrapper;
}

//Function to dynamically add an input box:
function addInput([shape, drawType, color, x, y, width, height, linewidth]) {
    // do something to figure out if the rect was drawn from the any corner that isn't top left

    const wrapper = createMoveableTextWrapper(x, y, width, height);

    const input = $(
        `<textarea id='drawing_text' type="text" autocomplete="off"/>`
    );
    wrapper.append(input);
    // do more style here
    input.css({
        "position": "relative",
        "width": "100%",
        "height": "100%",
        "text-align": window.DRAWDATA.alignment,
        "color": window.DRAWDATA.font_color,
        "background-color": color,
        "font-family": window.DRAWDATA.text_font,
        "font-size": `${window.DRAWDATA.text_size}px`,
        "font-weight": window.DRAWDATA.bold || "normal",
        "font-style": window.DRAWDATA.italic || "normal",
        "text-decoration": window.DRAWDATA.underline || "normal",
        // this text shadow is shit
        "-webkit-text-stroke-color": window.DRAWDATA.stroke_color,
        "-webkit-text-stroke-width": `${window.DRAWDATA.stroke_size}px`,
    });
    $("#VTT").append(wrapper);
    $(input).on("keyup", handleKeyPress);
    $(input).focus();

    const myObserver = new ResizeObserver((entries) => {
        entries.forEach((entry) => {
            // get the title bar and resize it to match the box
            const wrapper = $(entry.target).parent();
            // no idea why but the textArea is 6 pixels larger than the bar
            $(wrapper).css("width", entry.contentRect.width + 6);
        });
    });

    const inputEle = document.querySelector("#drawing_text");
    myObserver.observe(inputEle);
}

//Key handler for input box:
function handleKeyPress(e) {
    if (e.key === "Enter" && !e.shiftKey) {
        // do more stuff here so make drawText generic enough I can call it from 
        // redraw_drawings
        drawText(
            this,
            parseInt($(this).parent().css("left")),
            parseInt($(this).parent().css("top")) + 25
        );
        $(this).parent().remove();
    } else if (e.key == "Escape") $(this).parent().remove();
}

//Draw the text onto canvas:
function drawText(textInput, x, y) {
    const canvas = document.getElementById("fog_overlay");
    const fontSize = $(textInput).css("font-size")
    const fontSizeAsNum = parseInt($(textInput).css("font-size"))

    // calc drawline, that being where we will draw the text
    const verticalStartPos = y + 10 + fontSizeAsNum;
    let horizontalStartPos = x
    // do some fuckery to try figure out where to draw if centered/right aligned
    if ($(textInput).css("text-align") === "center") {
        // get the centre point of the box then minus off approx the length of text /2 as 
        // it appears partially left and right of centre point
        horizontalStartPos = (x + parseInt($(textInput).css("width")) / 2) - (textInput.value.length / 2 * fontSizeAsNum / 2)
    }
    if ($(textInput).css("text-align") === "right") {
        // get the right edge and minus off the approx length of text
        horizontalStartPos = (x + parseInt($(textInput).css("width"))) - (textInput.value.length * fontSizeAsNum / 2)
    }

    const font = $(textInput).css("font-family");
    let fontStyle = "normal";
    // build the font styles that will look like "bold italic" if they're not normal
    if ($(textInput).css("font-weight") !== "normal") {
        fontStyle = $(textInput).css("font-weight");
    }
    if ($(textInput).css("font-style") !== "normal") {
        fontStyle = fontStyle.concat(" ", $(textInput).css("font-style"));
    }
    const context = canvas.getContext("2d");
    // draw the background rectangle
    // will look like "bold italic 24px Arial"
    context.font = `${fontStyle} ${fontSize} ${font}`;
    console.log("drawing font", context.font);

    context.strokeStyle = $(textInput).css("-webkit-text-stroke-color");
    context.lineWidth = parseInt($(textInput).css("-webkit-text-stroke-width"));

    context.fillStyle = $(textInput).css("color");
    context.fillText(textInput.value, horizontalStartPos, verticalStartPos);
    context.strokeText(textInput.value, horizontalStartPos, verticalStartPos);
    if ($(textInput).css("text-decoration")?.includes("underline")) {
        // canvas doesn't have an underline feature so draw underscores for each string char
        var underscored = textInput.value
            .split("")
            .map(function (char) {
                return (char = "_");
            })
            .join("");
        context.fillText(underscored, horizontalStartPos, verticalStartPos);
    }

    // data = ['eraser', window.DRAWTYPE, window.DRAWCOLOR, window.BEGIN_MOUSEX, window.BEGIN_MOUSEY, width, height];
    // 	window.DRAWINGS.push(data);
    // 	redraw_canvas();
    // 	redraw_drawings();
    // 	window.ScenesHandler.persist();
    // 	if(window.CLOUD)
    // 		sync_drawings();
    // 	else
    // 		window.MB.sendMessage('custom/myVTT/drawing', data);
}




function init_text_button(buttons) {
    availableFonts = [
        "Roboto Condensed",
        "Arial Narrow",
        "Helvetica Neue",
        "Helvetica",
        "Arial",
        "sans-serif",
        "Gloria Hallelujah",
    ];
    textButton = $(
        "<div style='display:inline' id='text_button' class='drawbutton menu-button hideable ddbc-tab-options__header-heading'><u>T</u>ext</div>"
    );
    textMenu = $(
        "<div id='text_menu' class='top_menu' style='position:fixed; top:25px; width:75px'></div>"
    );
    textMenu.append("<div class='menu-subtitle'>Font</div>");
    textMenu.append(`<select id='text_font' data-required="text_font" name='font' style='width:inherit; margin:0px; text-align:center'>
        ${availableFonts.map((font) => {
        return `<option  style='font-family:${font}'value=${font}>${font}</option>`;
    })}
    </select>`);
    textMenu.append(
        `<input title='Text size' data-required="text_size" id='text_size' min='1' value='20' style='width:inherit; margin:0px; text-align:center' maxlength='3' type='number' step='1'>`
    );

    textMenu.append("<div class='menu-subtitle'>Font Style</div>");
    textMenu.append(
        `<div class='ddbc-tab-options--layout-pill'>
            <div tabindex='1' id='text_bold' data-toggle="true" data-key="bold" data-value="bold" class='drawbutton text-option ddbc-tab-options__header-heading menu-option '>
                <span class='material-icons' style='font-size: 12px'>format_bold</span>
            </div>
        </div>`
    );
    textMenu.append(
        `<div class='ddbc-tab-options--layout-pill'>
            <div tabindex='2' id='text_italic' data-toggle="true" data-key="italic" data-value="italic" class='drawbutton text-option ddbc-tab-options__header-heading menu-option '> 
                <span class='material-icons' style='font-size: 12px'>format_italic</span>
            </div>
        </div>`
    );
    textMenu.append(
        `<div class='ddbc-tab-options--layout-pill'>
            <div tabindex='3' id='text_underline' data-toggle="true" data-key="underline" data-value="underline" class='drawbutton text-option ddbc-tab-options__header-heading menu-option '> 
                <span class='material-icons' style='font-size: 12px'>format_underlined</span>
            </div> 
        </div>`
    );

    textMenu.append("<div class='menu-subtitle'>Alignment</div>");
    textMenu.append(
        `<div class='ddbc-tab-options--layout-pill'>
            <div tabindex='1' id='text_left' data-key="alignment" data-value="left" class='drawbutton text-option ddbc-tab-options__header-heading menu-option button-enabled ddbc-tab-options__header-heading--is-active' data-unique-with='text_alignment'> 
                <span class='material-icons' style='font-size: 12px'>format_align_left</span>
            </div>
        </div>`
    );
    textMenu.append(
        `<div class='ddbc-tab-options--layout-pill'>
            <div tabindex='2' id='text_center' data-key="alignment" data-value="center" class='drawbutton text-option ddbc-tab-options__header-heading menu-option' data-unique-with='text_alignment'>
                <span class='material-icons' style='font-size: 12px'>format_align_center</span>
            </div>
        </div>`
    );
    textMenu.append(
        `<div class='ddbc-tab-options--layout-pill'>
            <div tabindex='3' id='text_right' data-key="alignment" data-value="right" class='drawbutton text-option ddbc-tab-options__header-heading menu-option' data-unique-with='text_alignment'>
                <span class='material-icons' style='font-size: 12px'>format_align_right</span>
            </div>
        </div>`
    );

    textMenu.append(`<div class='menu-subtitle'>Font</div>
        <input title='Text color' data-required="text_color" class='spectrum'
            id='font_color' name='Font' value='black' />
        `);

    textMenu.append(`<div class='menu-subtitle'>Background</div> 
        <input title='Background color' data-required="background_color" class='spectrum'
            id='background_color' name='backgroundColor' value='rgba(17, 17, 17, 0.505)' />
        `);

    textMenu.append(`<div class='menu-subtitle'>Stroke</div> 
        <input title='Stroke size' id='stroke_size' data-required="stroke_size" min='0'
            value='1' style='width:inherit; margin:0px; text-align:center' maxlength='3' type='number' step='1'/>
        <input title='Stroke color' data-required="stroke_color" class='spectrum'
            id='stroke_color' name='strokeColor' value='white' />
        `);
    $("body").append(textMenu);

    let colorPickers = textMenu.find("input.spectrum");
    colorPickers.spectrum({
        type: "color",
        showInput: true,
        showInitial: true,
        clickoutFiresChange: false,
    });

    const colorPickerChange = function (e, tinycolor) {
        let color = `rgba(${tinycolor._r}, ${tinycolor._g}, ${tinycolor._b}, ${tinycolor._a})`;
        $(e.target).val(color);
    };
    colorPickers.on("move.spectrum", colorPickerChange); // update the token as the player messes around with colors
    colorPickers.on("change.spectrum", colorPickerChange); // commit the changes when the user clicks the submit button
    colorPickers.on("hide.spectrum", colorPickerChange); // the hide event includes the original color so let's change it back when we get it

    buttons.append(textButton);
    textMenu.css("left", textButton.position().left);
}
