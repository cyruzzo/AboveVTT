function create_moveable_text_wrapper(x, y, width, height) {
    wrapper = $("<div id='draw_text_wrapper'/>");
    wrapper.css({
        position: "fixed",
        left: `${x}px`,
        top: `${y - 25}px`,
        "z-index": 1000,
        width: width,
        height: height,
        "min-width": "55px",
    });

    $(wrapper).addClass("moveableWindow");
    $(wrapper).draggable({
        handle: "#draw_text_title_bar",
        addClasses: false,
        scroll: false,
        containment: "#fog_overlay",
        distance: 10,
        drag: function (event, ui) {
            mousex = Math.round((event.pageX - 200) * (1.0 / window.ZOOM));
            mousey = Math.round((event.pageY - 200) * (1.0 / window.ZOOM));
            ui.position.left = mousex;
            ui.position.top = mousey;
        },
    });

    const titleBar = $("<div id='draw_text_title_bar' class='restored'></div>");
    const closeCross = $(
        '<div id="draw_text_title_bar_exit"><svg class="" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g transform="rotate(-45 50 50)"><rect></rect></g><g transform="rotate(45 50 50)"><rect></rect></g></svg></div>'
    );
    const submitButton = $(
        `<div id="draw_text_title_bar_enter">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
        </div>
        `
    );
    $(closeCross).on("click", function () {
        $(this).parent().parent().remove();
    });
    $(submitButton).on("click", handle_draw_text_submit);
    titleBar.append(closeCross);
    titleBar.append(submitButton);
    wrapper.append(titleBar);

    return wrapper;
}

//Function to dynamically add an input box:
function add_text_drawing_input([
    shape,
    drawType,
    color,
    x,
    y,
    width,
    height,
    linewidth,
    align,
]) {
    // do something to figure out if the rect was drawn from the any corner that isn't top left

    const wrapper = create_moveable_text_wrapper(x, y, width, height);

    const input = $(
        `<textarea id='drawing_text' title="Input your text, this is an approximation of your final text. Press Enter to submit" type="text" autocomplete="off"/>`
    );
    wrapper.append(input);
    // do more style here
    input.css({
        position: "relative",
        width: "100%",
        height: "100%",
        "text-align": window.DRAWDATA.alignment,
        color: window.DRAWDATA.font_color,
        "background-color": color,
        "font-family": window.DRAWDATA.text_font,
        "font-size": `${window.DRAWDATA.text_size}px`,
        "font-weight": window.DRAWDATA.bold || "normal",
        "font-style": window.DRAWDATA.italic || "normal",
        "text-decoration": window.DRAWDATA.underline || "normal",
        // this text shadow is shit
        "-webkit-text-stroke-color": window.DRAWDATA.stroke_color,
        "-webkit-text-stroke-width": `${window.DRAWDATA.stroke_size}px`,
        "min-height": "30px",
        "min-width": "55px",
    });
    $("#VTT").append(wrapper);
    $(input).on("keyup", handle_key_press);
    $(input).focus();

    const myObserver = new ResizeObserver((entries) => {
        entries.forEach((entry) => {
            // get the title bar and resize it to match the box
            const bar = $(entry.target).parent().find("#draw_text_title_bar");
            // no idea why but the textArea is 6 pixels larger than the bar
            // scroll bar is approx 18px
            if (entry.target.clientHeight < entry.target.scrollHeight) {
                $(bar).css("width", entry.contentRect.width + 25);
            } else {
                $(bar).css("width", entry.contentRect.width + 7);
            }
        });
    });

    const inputEle = document.querySelector("#drawing_text");
    myObserver.observe(inputEle);
}

function handle_draw_text_submit(event) {
    // do more stuff here so make drawText generic enough I can call it from
    // redraw_drawings
    textBox = $(this).parent().parent().find("textarea");
    // no text in box, return early
    if (!textBox.val()) return;

    const height = Math.max(
        parseInt($(textBox).css("height")),
        parseInt($(textBox).css("min-height"))
    );
    const width = Math.max(
        parseInt($(textBox).css("width")),
        parseInt($(textBox).css("min-width"))
    );
    // textbox doesn't have left or top so use the wrapper
    // with 25 being the bar height
    const rectX = parseInt($(textBox).parent().css("left"));
    const rectY = parseInt($(textBox).parent().css("top")) + 25;

    const text = textBox.val();
    let fontWeight = $(textBox).css("font-weight") || "normal";
    let fontStyle = $(textBox).css("font-style") || "normal";

    const font = {
        font: $(textBox).css("font-family"),
        size: parseInt($(textBox).css("font-size")),
        weight: fontWeight,
        style: fontStyle,
        underline: $(textBox).css("text-decoration")?.includes("underline"),
        align: $(textBox).css("text-align"),
        color: $(textBox).css("color"),
    };

    const stroke = {
        size: parseInt($(textBox).css("-webkit-text-stroke-width")),
        color: $(textBox).css("-webkit-text-stroke-color"),
    };
    // only draw a rect if it's not fully transparent
    let data = [];
    if (!isRGBATransparent(window.DRAWCOLOR)) {
        data = [
            "rect",
            "filled",
            window.DRAWCOLOR,
            rectX,
            rectY,
            width,
            height,
            window.LINEWIDTH,
        ];
        window.DRAWINGS.push(data);
    }
    // data should match params in draw_text
    // push the starting position of y south based on the font size
    data = ["text", rectX, rectY + font.size, text, font, stroke, width];
    // make a function for the following like 6 lines as it's all over the place
    window.DRAWINGS.push(data);
    redraw_canvas();
    redraw_drawings();
    window.ScenesHandler.persist();
    if (window.CLOUD) sync_drawings();
    else window.MB.sendMessage("custom/myVTT/drawing", data);
    $("#draw_text_title_bar_exit").click();
}

//Key handler for input box:
function handle_key_press(e) {
    if (e.key === "Enter" && !e.shiftKey) {
    } else if (e.key == "Escape") $(this).parent().remove();
}

function get_x_start_and_width_of_text(x, width, text, font, stroke) {
    // do a thing to get the client width of the text via a span
    //https://stackoverflow.com/questions/14852925/get-string-length-in-pixels-using-javascript

    const placeholder = $(`<span id="text_measure">${text}</span>`);
    placeholder.css({
        "text-align": font.align,
        "font-family": font.font,
        "font-size": `${font.size}px`,
        "font-weight": font.bold || "normal",
        "font-style": font.italic || "normal",
        // this text shadow is shit
        "-webkit-text-stroke-color": stroke.color,
        "-webkit-text-stroke-width": `${stroke.size}px`,
    });
    $("body").append(placeholder);
    const textWidth = $("#text_measure").width();
    placeholder.remove();
    if (font.align === "left") {
        return [x, textWidth];
    }
    if (font.align === "center") {
        // pull out the details from the font
        return [x + width / 2 - textWidth / 2, textWidth];
    } else {
        return [x + width - textWidth, textWidth];
    }
}

//Draw the text onto canvas:
function draw_text(
    context,
    type,
    startingX,
    startingY,
    text,
    font,
    stroke,
    width
) {
    // TODO BAIN change font and stroke to objects for easier accessing,
    // only compile into the drawn font style once we're drawing
    // ctx, startx, starty, width, height, style, fill=true, drawStroke = false, lineWidth = 6)
    // draw the background rectangle
    // will look like "bold italic 24px Arial"
    context.font = `${font.weight} ${font.style} ${font.size}px ${font.font}`;
    context.strokeStyle = stroke.color;
    context.lineWidth = stroke.size;
    context.fillStyle = font.color;

    const lines = text.split(/\r?\n/);

    let x = startingX;
    let y = startingY;

    lines.forEach((line) => {
        // do some fuckery per line to try get right starting x position
        const [textX, textWidth] = get_x_start_and_width_of_text(
            x,
            width,
            line,
            font,
            stroke
        );
        context.strokeText(line, textX, y);
        // TODO BAIN this underline is shit make it better
        if (font.underline) {
            drawLine(
                context,
                textX,
                y + font.size / 10,
                textX + textWidth,
                y + font.size / 10,
                stroke.color,
                font.size / 10
            );
        }

        y += font.size;
    });
    // reset any modifications to these as we are going to go around the loop again
    x = startingX;
    y = startingY;
    lines.forEach((line) => {
        // loop the lines again as large stroke size will overlap the fill text
        // so add fill text in last
        const [textX, textWidth] = get_x_start_and_width_of_text(
            x,
            width,
            line,
            font,
            stroke
        );
        context.fillText(line, textX, y);
        y += font.size;
    });
}

function init_text_button(buttons) {
    availableFonts = [
        "Arial",
        "Verdana",
        "Helvetica",
        "Tahoma",
        "Trebuchet MS",
        "Times New Roman",
        "Georgia",
        "Garamond",
        "Courier New",
        "Brush Script MT",
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
