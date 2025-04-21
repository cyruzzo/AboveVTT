function apply_settings_from_storage(applyFromWindow = false){
    const buttonSelectedClasses = "button-enabled ddbc-tab-options__header-heading--is-active"
    const settings = (applyFromWindow) ? window.TEXTDATA : JSON.parse(localStorage.getItem('textSettings'));
    window.TEXTDATA = settings
    $(`#text_controller_inside button[id^='text_']`).removeClass(buttonSelectedClasses);
    $(`#text_font option`).removeAttr('selected');
    $(`#text_font option[value="${settings.text_font}"]`).attr("selected", "selected");
    $("#text_size").val(settings.text_size)
    $("#text_color").val(settings.text_color)
    $("#text_color").next().find(".sp-preview-inner").css("background-color", settings.text_color)
    $("#text_bold").toggleClass(buttonSelectedClasses, settings.text_bold)
    $("#text_italic").toggleClass(buttonSelectedClasses, settings.text_italic)
    $("#text_underline").toggleClass(buttonSelectedClasses, settings.text_underline)
    $(`#text_${settings.text_alignment}`).addClass(buttonSelectedClasses)
    $("#stroke_size").val(settings.stroke_size)
    $("#stroke_color").val(settings.stroke_color),
    $("#stroke_color").next().find(".sp-preview-inner").css("background-color", settings.stroke_color)
    $("#text_background_color").val(settings.text_background_color)
    $("#text_background_color").next().find(".sp-preview-inner").css("background-color", settings.text_background_color)
    $('#hide_text').toggleClass(buttonSelectedClasses, settings.text_hide == true)
    if (settings.text_shadow){
        $("#text_shadow").addClass(buttonSelectedClasses)
    } 
}

function store_text_settings(){
    const buttonSelectedClasses = "button-enabled ddbc-tab-options__header-heading--is-active"
    const storageObject = {
        "text_font": $("#text_font").find(":selected").text(),
        "text_size": $("#text_size").val(),
        "text_color": $("#text_color").val(),
        "text_bold": $("#text_bold").hasClass(buttonSelectedClasses),
        "text_italic": $("#text_italic").hasClass(buttonSelectedClasses),
        "text_underline": $("#text_underline").hasClass(buttonSelectedClasses),
        "text_alignment": $("#text_controller_inside").find(`.${buttonSelectedClasses.replace(" ",".")}[data-key="alignment"]`).attr("data-value"),
        "stroke_size": $("#stroke_size").val(),
        "stroke_color": $("#stroke_color").val(),
        "text_background_color":  $("#text_background_color").val(),
        "text_shadow": $("#text_shadow").hasClass(buttonSelectedClasses),
        "text_hide":  $('#hide_text').hasClass(buttonSelectedClasses),
    }
    window.TEXTDATA = storageObject
    localStorage.setItem('textSettings', JSON.stringify(storageObject));
}

function apply_settings_to_boxes(){
    $(".drawing-text-box").css({
        "text-align": window.TEXTDATA.text_alignment,
        "color": window.TEXTDATA.text_color,
        "background-color": window.TEXTDATA.text_background_color,
        "font-family": window.TEXTDATA.text_font,
        "font-size": `calc(${window.TEXTDATA.text_size}px * var(--window-zoom))`,
        "line-height": `calc(${window.TEXTDATA.text_size}px * var(--window-zoom))`,
        "font-weight": window.TEXTDATA.text_bold ? "bold" : "normal",
        "font-style": window.TEXTDATA.text_italic ? "italic" : "normal",
        "text-decoration": window.TEXTDATA.text_underline ? `underline ${window.TEXTDATA.text_color}` : "none",
        "-webkit-text-stroke-color": window.TEXTDATA.stroke_color,
        "-webkit-text-stroke-width": `calc(${window.TEXTDATA.stroke_size}px * var(--window-zoom))`,
        "text-shadow": window.TEXTDATA.text_shadow ? "black 5px 5px 5px" : "none",
        "padding": '0px'
    })
    $(".drawing-text-box").attr('data-text-size', window.TEXTDATA.text_size);
    $(".drawing-text-box").attr('data-stroke-size', window.TEXTDATA.stroke_size);
    $(".text-input-inside").css({
        "--text-align": window.TEXTDATA.text_alignment,
        "--color": window.TEXTDATA.text_color, 
        "--text-decoration-color": window.TEXTDATA.text_color,
        "--font-family": window.TEXTDATA.text_font,
        "--font-size": `calc(${window.TEXTDATA.text_size}px * var(--window-zoom))`,
        "--line-height": `calc(${window.TEXTDATA.text_size}px * var(--window-zoom))`,
        "--font-weight": window.TEXTDATA.text_bold ? "bold" : "normal",
        "--font-style": window.TEXTDATA.text_italic ? "italic" : "normal"
    })
    
}

function create_text_controller(applyFromWindow = false) {
    if ($("#text_controller_inside").length > 0) {
        $("#text_controller_inside").show()
        apply_settings_from_storage(applyFromWindow)
        return
    }
    const textControllerInside = $("<div id='text_controller_inside'/>");
    $('#site').append(textControllerInside);
    const textControllerTitleBar = $("<div id='text_controller_title_bar' class='restored'></div>")
    const textControllerTitleBarExit = $('<div id="text_controller_title_bar_exit"><svg class="" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g transform="rotate(-45 50 50)"><rect></rect></g><g transform="rotate(45 50 50)"><rect></rect></g></svg></div>')
    textControllerTitleBarExit.click(function () {
        $(this).parent().parent().hide()
        $("select-button").click();
    });
    textControllerTitleBar.append(textControllerTitleBarExit);
    textControllerInside.append(textControllerTitleBar);

    $(textControllerTitleBar).dblclick(function () {
        if ($(textControllerTitleBar).hasClass("restored")) {
            $(textControllerTitleBar).data("prev-height", $("#text_controller_inside").height());
            $(textControllerTitleBar).data("prev-width", $("#text_controller_inside").width());
            $(textControllerTitleBar).data("prev-top", $("#text_controller_inside").css("top"));
            $(textControllerTitleBar).data("prev-left", $("#text_controller_inside").css("left"));
            $("#text_controller_inside").css("top", $(textControllerTitleBar).data("prev-minimized-top"));
            $("#text_controller_inside").css("left", $(textControllerTitleBar).data("prev-minimized-left"));
            $("#text_controller_inside").height(25);
            $("#text_controller_inside").width(200);
            $("#text_controller_inside").css("visibility", "hidden");
            $(textControllerTitleBar).css("visibility", "visible");
            $(textControllerTitleBar).addClass("minimized");
            $(textControllerTitleBar).removeClass("restored");
            $(textControllerTitleBar).prepend("<div id='text_controller_title'>Text Settings</div>")
        }
        else if ($(textControllerTitleBar).hasClass("minimized")) {
            $(textControllerTitleBar).data("prev-minimized-top", $("#text_controller_inside").css("top"));
            $(textControllerTitleBar).data("prev-minimized-left", $("#text_controller_inside").css("left"));
            $("#text_controller_inside").height($(textControllerTitleBar).data("prev-height"));
            $("#text_controller_inside").width($(textControllerTitleBar).data("prev-width"));
            $("#text_controller_inside").css("top", $(textControllerTitleBar).data("prev-top"));
            $("#text_controller_inside").css("left", $(textControllerTitleBar).data("prev-left"));
            $(textControllerTitleBar).addClass("restored");
            $(textControllerTitleBar).removeClass("minimized");
            $("#text_controller_inside").css("visibility", "visible");
            $("#text_controller_title").remove();
        }
    });
    const flexDiv = $(`<div style="display: flex; flex-direction: row; flex-wrap: wrap;"/>`);
    const availableFonts = [
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

    flexDiv.append(
        `<div class='ddbc-tab-options--layout-pill'>
            <select id='text_font' data-required="text_font" name='font' style='text-align:center'>
                ${availableFonts.map((font) => {
            return `<option  style='font-family:${font};' value="${font}">${font}</option>`;
        })}
            </select>
        </div>
            `)
    flexDiv.append(
        `<div class='ddbc-tab-options--layout-pill'>
            <input title='Text size' data-required="text_size" id='text_size'
            min='1' value='20' style='text-align:center' maxlength='3' type='number' step='1'/>
         </div>   
        `)

    flexDiv.append(
        `<div class='ddbc-tab-options--layout-pill'>
            <input title='Text color' data-required="text_color" 
            class='spectrum'id='text_color' name='Font' value='black' />
        </div>`)
    flexDiv.append(
        `<div class='ddbc-tab-options--layout-pill'>
           <button id='text_bold' title="Text bold" style="height:20px" data-toggle="true" data-key="bold" data-value="bold" class='drawbutton text-option ddbc-tab-options__header-heading menu-option '>
                <span class='material-icons' style='font-size: 12px'>format_bold</span>
            </button>
        </div>
        <div class='ddbc-tab-options--layout-pill'>
            <button id='text_italic' title="Text italic" style="height:20px" data-toggle="true" data-key="italic" data-value="italic" class='drawbutton text-option ddbc-tab-options__header-heading menu-option '> 
                <span class='material-icons' style='font-size: 12px'>format_italic</span>
            </button>
        </div>
        <div class='ddbc-tab-options--layout-pill'>
            <button id='text_underline' title="Text underline" style="height:20px" data-toggle="true" data-key="underline" data-value="underline" class='drawbutton text-option ddbc-tab-options__header-heading menu-option '> 
                <span class='material-icons' style='font-size: 12px'>format_underlined</span>
            </button>
        </div> `
    );

    flexDiv.append(
        `<div class='ddbc-tab-options--layout-pill'>
            <button id='text_left' title="Align left" style="height:20px" data-key="alignment" data-value="left" class='drawbutton text-option ddbc-tab-options__header-heading menu-option button-enabled ddbc-tab-options__header-heading--is-active' data-unique-with='text_alignment'> 
                <span class='material-icons' style='font-size: 12px'>format_align_left</span>
            </button>
        </div>
        <div class='ddbc-tab-options--layout-pill'>
            <button id='text_center' title="Align center" style="height:20px" data-key="alignment" data-value="center" class='drawbutton text-option ddbc-tab-options__header-heading menu-option' data-unique-with='text_alignment'>
                <span class='material-icons' style='font-size: 12px'>format_align_center</span>
            </button>
        </div>
        <div class='ddbc-tab-options--layout-pill'>
            <button id='text_right' title="Align right" style="height:20px" data-key="alignment" data-value="right" class='drawbutton text-option ddbc-tab-options__header-heading menu-option' data-unique-with='text_alignment'>
                <span class='material-icons' style='font-size: 12px'>format_align_right</span>
            </button>
        </div>`
    );
    flexDiv.append(`
    <div class='ddbc-tab-options--layout-pill'>
        <input title='Stroke size' id='stroke_size' data-required="stroke_size" min='0'
            value='1' style='width:inherit; margin:0px; text-align:center' maxlength='3' type='number' step='1'/>
    </div>
    <div class='ddbc-tab-options--layout-pill'>
        <input title='Stroke color' data-required="stroke_color" class='spectrum'
            id='stroke_color' name='strokeColor' value='white' />
    </div>
    `);
    flexDiv.append(
        `<div class='ddbc-tab-options--layout-pill'>
            <input title='Background color' data-required="text_background_color" class='spectrum'
            id='text_background_color' name='backgroundColor' value='rgba(17, 17, 17, 0.505)' />
        </div>
    `);
    flexDiv.append(
        `<div class='ddbc-tab-options--layout-pill'>
            <button id='text_shadow' title="drop shadow" style="height:20px" data-toggle="true" data-key="shadow" data-value="shadow" class='drawbutton text-option ddbc-tab-options__header-heading menu-option'>
                <span class='material-icons' style='font-size: 12px'>gradient</span>
            </button>
        </div>
    `);
      flexDiv.append(
        `<div class='ddbc-tab-options--layout-pill'>
            <button id='hide_text' title="hide text" style="height:20px" data-toggle="true" data-key="hide" data-value="hide" class='drawbutton text-option ddbc-tab-options__header-heading menu-option'>
                    <span class="material-icons">
                        visibility_off
                    </span>
            </button>
        </div>
    `);

    let colorPickers = flexDiv.find("input.spectrum");
    colorPickers.spectrum({
        type: "color",
        showInput: true,
        showInitial: true,
        clickoutFiresChange: false,
    });

    const colorPickerChange = function (e, tinycolor) {
        let color = `rgba(${tinycolor._r}, ${tinycolor._g}, ${tinycolor._b}, ${tinycolor._a})`;
        $(e.target).val(color);
        store_text_settings()
        apply_settings_to_boxes()
    };
    colorPickers.on("move.spectrum", colorPickerChange); // update the token as the player messes around with colors
    colorPickers.on("change.spectrum", colorPickerChange); // commit the changes when the user clicks the submit button
    colorPickers.on("hide.spectrum", colorPickerChange); // the hide event includes the original color so let's change it back when we get it

    textControllerInside.append(flexDiv)

    $("#text_font, #text_size, #stroke_size").on("change", function (event) {
        store_text_settings()
        apply_settings_to_boxes()
    });

    flexDiv.find("button").on("click", function (event){
        // handle toggle buttons
        const buttonSelectedClasses = "button-enabled ddbc-tab-options__header-heading--is-active"
        if ($(this).attr(("data-toggle"))){
            $(this).toggleClass(buttonSelectedClasses);
        }
        // handle unique selection buttons
        if($(this).attr("data-unique-with")){
            const uniqueWith = $(this).attr("data-unique-with")
            flexDiv.find(`[data-unique-with=${uniqueWith}]`).removeClass(`${buttonSelectedClasses}` )
            $(this).addClass(buttonSelectedClasses)            
        }
        store_text_settings()
        apply_settings_to_boxes()
    })

    $(".sp-replacer.sp-light").each(function () {
        console.log(this)
        console.log($(this).prev().title)
        $(this).attr("title", $(this).prev().attr("title"))
    });

    $("#text_controller_inside").addClass("moveableWindow");
    $("#text_controller_inside").draggable({
        addClasses: false,
        scroll: false,
        containment: "#windowContainment",
        start: function () {
            $("#resizeDragMon").append($('<div class="iframeResizeCover"></div>'));
            $("#sheet").append($('<div class="iframeResizeCover"></div>'));
        },
        stop: function () {
            $('.iframeResizeCover').remove();

        }
    });
    $("#text_controller_inside").resizable({
        addClasses: false,
        handles: "all",
        containment: "#windowContainment",
        start: function () {
            $("#resizeDragMon").append($('<div class="iframeResizeCover"></div>'));
            $("#sheet").append($('<div class="iframeResizeCover"></div>'));
        },
        stop: function () {
            $('.iframeResizeCover').remove();
        },
        resize: function (event) {
            let controllerWidth = parseInt($(this).css("width"));
            if(controllerWidth<100) {
                $(this).css("min-height", "165px")
            }
            if(controllerWidth<301) {
                $(this).css("min-height", "165px")
            }
            else if(controllerWidth<378){
                $(this).css("min-height", "140px")
            }
            else if(controllerWidth<527){
                $(this).css("min-height", "113px")
            }
            else if(controllerWidth<975){
                $(this).css("min-height", "81px")
            }
            else{
                $(this).css("min-height", "55px")
            }
        },
        minWidth: 80,
        minHeight: 55
    });

    $("#text_controller_inside").mousedown(function () {
        frame_z_index_when_click($(this));
    });
    // on first render check if settings in storage
    if (localStorage.getItem("textSettings") === null) {
        store_text_settings()
    }
    else{
        apply_settings_from_storage(applyFromWindow)
    }
    
    
}

/**
 * Creates a moveable and resizable text area with a close and submit button
 * @param {Number} width width text area
 * @param {Number} height height of text area
 * @returns a div which has the title bar with submit/close buttons and a text area
 */
function create_moveable_text_box(x,y,width, height, text = undefined) {
    let htmlText;
    if(typeof text == 'string')
        htmlText = text.replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/'/g, "&apos;")


    const textInputInside = $(`<div class="text-input-inside" data-text='${htmlText ? htmlText : ''}'/>`);
    textInputInside.css({
        "position": "fixed",
        "z-index": 1000,
        "left": `${x}px`,
        "top": `${y}px`,
        "width": width,
        "height": height,
        "min-height": "55px",
        "min-width": "55px"
    });
    $('#VTTWRAPPER').append(textInputInside);
    const titleBar = $("<div class='text-input-title-bar'></div>");
    const closeCross = $(
        `<div class='text-input-title-bar-exit'>
            <svg class="" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                <g transform="rotate(-45 50 50)">
                    <rect></rect>
                </g>
                <g transform="rotate(45 50 50)">
                    <rect></rect>
                </g>
            </svg>
        </div>`
    );
    const submitButton = $(
        `<div class='text-input-title-bar-enter'>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
            </svg>
        </div>
        `
    );
    $(closeCross).on("click", function () {
        $(this).parent().parent().remove();
    });

    $(submitButton).on("click", handle_draw_text_submit);

    titleBar.append(closeCross);
    titleBar.append(submitButton);
    textInputInside.append(titleBar);

    $(textInputInside).addClass("moveableWindow");
    $(textInputInside).draggable({
        addClasses: false,
        scroll: false,
        containment: "#windowContainment",
        start: function () {
            $("#resizeDragMon").append($('<div class="iframeResizeCover"></div>'));
            $("#sheet").append($('<div class="iframeResizeCover"></div>'));
        },
        stop: function () {
            $('.iframeResizeCover').remove();

        }
    });
    $(textInputInside).resizable({
        addClasses: false,
        handles: "all",
        containment: "#windowContainment",
        start: function () {
            $("#resizeDragMon").append($('<div class="iframeResizeCover"></div>'));
            $("#sheet").append($('<div class="iframeResizeCover"></div>'));
        },
        stop: function () {
            $('.iframeResizeCover').remove();
        },
        minWidth: 55,
        minHeight: 55
    });

    document.querySelectorAll('.menu-button')
    .forEach(occurence => {
        let id = occurence.id;
        if (id && (!id.includes("text") || id === "text_button"))
        occurence.addEventListener('click', function() {
            document.getElementById("text_controller_inside")?.remove();
        }, { once: true});
      });

    $(textInputInside).mousedown(function () {
        frame_z_index_when_click($(this));
    });
    const input = $(
        `<textarea class="drawing-text-box" 
        title="Input your text, this is an approximation of your final text"
        type="text" autocomplete="off"/>`
    );
    if(text != undefined)
        input.val(text)
    textInputInside.append(input)
    $(input).css({
        "white-space": "pre-wrap",
        "overflow": "hidden"
    });
    
    apply_settings_to_boxes()
    $(input).on("keyup", handle_key_press);
    $(input).on("input onchange", handle_auto_resize);
    $(input).focus();
}

function handle_auto_resize(e){
    $(this).parent().css("height", this.scrollHeight +25 +2 + "px")
    $(this).parent().css("width", this.scrollWidth + 2 +"px")
    $(this).closest('.text-input-inside').attr('data-text', this.value)
}

/**
 * Creates a text area input styled in the same way as specified
 * by the font menu data
 * @param {Array} data the rectangle data
 */
 function add_text_drawing_input([
    shape,
    drawType,
    color,
    x,
    y,
    width,
    height,
    linewidth,
    editTextID = undefined
]) {
    create_text_controller()
    create_moveable_text_box(x,y,width, height);
}


/**
 * Bakes the text into the text_div layer
 * @param {Event} event 
 * @returns 
 */
function handle_draw_text_submit(event) {
    textBox = $(this).parent().parent().find("textarea");
    // no text in box, return early
    if (!textBox.val()) return;

    const height = Math.max(
        parseInt($(textBox).css("height")) * (1.0 / window.ZOOM),
        parseInt($(textBox).css("min-height")) * (1.0 / window.ZOOM)
    );
    const width = Math.max(
        parseInt($(textBox).css("width")) * (1.0 / window.ZOOM),
        parseInt($(textBox).css("min-width"))  * (1.0 / window.ZOOM)
    );
    // textbox doesn't have left or top so use the wrapper
    // with 25 being the bar height
    const rectX = Math.round(((parseInt($(textBox).parent().css("left"))-window.VTTMargin+window.scrollX))) * (1.0 / window.ZOOM);
    const rectY = Math.round(((parseInt($(textBox).parent().css("top"))-window.VTTMargin+window.scrollY)) + 25) * (1.0 / window.ZOOM);
    const rectColor = $(textBox).css("background-color")

    const text = textBox.val();
    let fontWeight = $(textBox).css("font-weight") || "normal";
    let fontStyle = $(textBox).css("font-style") || "normal";

    const font = {
        font: $(textBox).css("font-family").replaceAll(/['"]+/g, ''),
        size: parseInt($(".drawing-text-box").attr('data-text-size')),
        weight: fontWeight,
        style: fontStyle,
        underline: $(textBox).css("text-decoration")?.includes("underline"),
        align: $(textBox).css("text-align"),
        color: $(textBox).css("color"),
        shadow: $(textBox).css("text-shadow")
    };

    const stroke = {
        size: parseInt($(".drawing-text-box").attr('data-stroke-size')),
        color: $(textBox).css("-webkit-text-stroke-color"),
    };
    const hidden = $('#text_controller_inside #hide_text.button-enabled').length>0;
    // data should match params in draw_text
    // push the starting position of y south based on the font size
    let textid = uuid();
    data = ["text",
        rectX,
        rectY + Math.ceil(parseFloat($(textBox).css("font-size")) / window.ZOOM),
        width,
        height,
        text,
        font,
        stroke,
        rectColor,
        textid,
        window.CURRENT_SCENE_DATA.scale_factor,
        hidden
    ];
    // bake this data and redraw all text
    window.DRAWINGS.push(data);
    $(this).parent().find(".text-input-title-bar-exit").click();
    redraw_text();
    sync_drawings();

}

/**
 * Closes the text box if you press escape while focusing it
 * @param {Event} e 
 */
function handle_key_press(e) {
    if (e.key == "Escape") {
        $(this).parent().remove();
        document.getElementById("text_controller_inside")?.remove();
    }
    else{
        $(this).closest('.text-input-inside').attr('data-text', this.value)
    }
}

/**
 * Gets the starting position of text based off it's true width, style, alignment
 * Creates a span with the style of font/stroke with the text input and gets it's width
 * @param {Number} x 
 * @param {Number} width 
 * @param {String} text 
 * @param {Object} font 
 * @param {Object} stroke 
 * @returns {Array} [x, width] x being where to start drawing text, width being the true width of text
 */
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


/**
 * Draw the text to the text overlay using the data in window.DRAWINGS
 * @param {*} This is no longer used will clean up later - was text canvas ctx but canvas is no longer used
 * @param {String} type aka shape, not used
 * @param {Number} startingX starting position text background
 * @param {Number} startingY starting positon text background
 * @param {Number} width width of text background
 * @param {Number} height height of text background
 * @param {String} text the value to be drawn
 * @param {Object} font font styling object
 * @param {Object} stroke stroke styling object
 * @param {String} text unique id
 */
function draw_text(
    context,
    type,
    startingX,
    startingY,
    width,
    height,
    text,
    font,
    stroke,
    rectColor = 'transparent',
    id = '',
    scale = (window.CURRENT_SCENE_DATA.scale_factor == "") ? 1 : window.CURRENT_SCENE_DATA.scale_factor,
    hidden = false,
    wallText = false
) {

    if($(`svg[id='${id}']`).length>0)
        return;
    if(rectColor == null)
        rectColor = 'transparent';
    if(!window.DM && hidden)
        return;

    divideScale = (window.CURRENT_SCENE_DATA.scale_factor == "") ? 1 : window.CURRENT_SCENE_DATA.scale_factor;

    let adjustScale = (scale/divideScale);   

    font.size = Math.ceil(font.size / adjustScale)
    stroke.size = Math.ceil(stroke.size / adjustScale)
    width = Math.ceil(width / adjustScale) 
    height = Math.ceil(height / adjustScale) 
    startingX = Math.ceil(startingX / adjustScale) 
    startingY = Math.ceil(startingY / adjustScale)

    let shadowStyle ='';
    if (font.shadow && font.shadow !== "none"){
        const shadowRegex = /(rgb\(.*\))\s(\d+px)\s(\d+px)\s(\d+px)/
        const [_, shadowColor, shadowOffsetX, shadowOffsetY, shadowBlur ] = font.shadow.match(shadowRegex)
        shadowStyle = `drop-shadow(${shadowOffsetX} ${shadowOffsetY} ${shadowBlur} ${shadowColor})`
    }
    
    let x = (font.align == 'right') ? '100%' : ((font.align=='center') ? '50%' : '0');
    let anchor = (font.align == 'right') ? 'end' : ((font.align=='center') ? 'middle' : 'start');
    let underline = (font.underline == true) ? 'underline' : 'none';

    let fontSize=font.size; 
    let lineHeight=12;  


    
    let hiddenOpacity = (hidden) ? 0.5 : 1;
    let textSVG = $(`
        <svg id='${id}' width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="opacity:${hiddenOpacity}; left: ${startingX}px; top: ${startingY-font.size}px; position:absolute; z-index: 500">
            <title>${text}</title>
            <rect x="0" y="0" width="${width}" height="${height}" style="fill:${rectColor}"/>
            <g x="0.5" y="${font.size*-0.14}" style="text-anchor: ${anchor}; font-size:${font.size}px; font-style:${font.style}; font-weight: ${font.weight}; font-family: ${font.font};">
                <text x="${x}" y="0" style="fill: ${font.color}; stroke: ${stroke.color}; stroke-width: ${stroke.size}; text-decoration: ${underline} ${font.color}; filter:${shadowStyle};stroke-linecap:butt;stroke-linejoin:round;paint-order:stroke;stroke-opacity:1;"></text>
            </g>
         </svg>
    `);

 
    $('#text_div').append(textSVG);

    if(wallText == true){
        let element = $(`svg#${id} text`)[0];
        const wallHeights = text?.trim()?.split(' \n ')?.reverse();
        element.innerHTML += wallHeights[0] ? `<tspan x="${x}" y="${font.size+0*font.size}">${wallHeights[0]}</tspan>` : '';
        element.innerHTML += wallHeights[1] ? `<tspan x="${x}" y="${font.size+1*font.size}">${wallHeights[1]}</tspan>` : '';
    }
    else{
        let words = text.split(/(\s)/g);

        let line = '';
        let element = $(`svg#${id} text`)[0];
        element.innerHTML = '<tspan id="PROCESSING"></tspan>';
        let lineNumber = 0;
        for (let n = 0; n < words.length; n++) {
            let testLine = line + words[n] + ' ';
            let testElem = document.getElementById('PROCESSING');
            /*  Add line in testElement */
            testElem.innerHTML = testLine;
            /* Messure textElement */
            let metrics = testElem.getBoundingClientRect();
            testWidth = metrics.width;
           
            if(words[n].includes('\n')  && n > 0){
                let splitNewLines = words[n].split(/(\n)/g);
                for(let i = 0; i < splitNewLines.length; i++){
                    if(splitNewLines[i] == '\n'){
                        element.innerHTML += `<tspan x="${x}" y="${font.size+lineNumber*font.size}">${line}</tspan>`;
                        lineNumber++;

                        line = splitNewLines[i] + ' ';
                    }
                }
              
            }
            else if (testWidth / window.ZOOM > width && n > 0) {
                element.innerHTML += `<tspan x="${x}" y="${font.size+lineNumber*font.size}">${line}</tspan>`;
                lineNumber++
                line = words[n] + ' ';
            } else {
                line = testLine;
            }
        }
        element.innerHTML += `<tspan x="${x}" y="${font.size+lineNumber*font.size}">${line}</tspan>`;
        document.getElementById("PROCESSING").remove();

        textSVG.draggable({
            distance: 5,
            start: function () {
                $("#resizeDragMon").append($('<div class="iframeResizeCover"></div>'));
                $("#sheet").append($('<div class="iframeResizeCover"></div>'));
            },
            drag: function(event,ui)
            {
                ui.position.top = Math.round((ui.position.top - window.VTTMargin) / window.ZOOM );
                ui.position.left = Math.round((ui.position.left - window.VTTMargin) / window.ZOOM );

            },  
            stop: function (event, ui) {
                $('.iframeResizeCover').remove();
                
                for(let drawing in window.DRAWINGS){
                    if(window.DRAWINGS[drawing][9] != id)
                        continue;
                    window.DRAWINGS[drawing][1] = parseInt($(this).css('left'))*adjustScale;
                    window.DRAWINGS[drawing][2] = parseInt($(this).css('top'))*adjustScale + parseInt(font.size)*adjustScale;    
                }          
                sync_drawings();
            }
        });


        textSVG.on('contextmenu', function(e){
            $(this).remove();
            for(let drawing in window.DRAWINGS){
                if(window.DRAWINGS[drawing][9] == this.id){
                    if(!window.DRAWINGS[drawing][11]){
                        window.DRAWINGS[drawing][11] = true;
                    }
                    else{
                        window.DRAWINGS[drawing][11] = false;
                    }
                }
            }
            redraw_text();
            sync_drawings();
            return false;
        });
        textSVG.on('dblclick', function(){
            let text_data = window.DRAWINGS.filter(d => d[9] == this.id)[0];
            if(window.TEXTDATA == undefined){
                window.TEXTDATA = {};
            }
            let scaleConversion = text_data[10]/window.CURRENT_SCENE_DATA.scale_factor
            window.TEXTDATA.text_alignment = text_data[6].align;
            window.TEXTDATA.text_color = text_data[6].color;
            window.TEXTDATA.text_background_color = text_data[8];
            window.TEXTDATA.text_font = text_data[6].font;
            window.TEXTDATA.text_size = text_data[6].size / scaleConversion;
            window.TEXTDATA.text_bold = (parseInt(text_data[6].weight) == 700) ? true : false;
            window.TEXTDATA.text_italic = (text_data[6].style == 'italic') ? true : false;
            window.TEXTDATA.text_underline = text_data[6].underline;
            window.TEXTDATA.stroke_color = text_data[7].color;
            window.TEXTDATA.stroke_size = text_data[7].size / scaleConversion;
            window.TEXTDATA.text_shadow = (text_data[6].shadow != 'none') ? true : false;
            window.TEXTDATA.text_hide = text_data[11];
            create_text_controller(true)

            let bounds = $(this)[0].getBoundingClientRect();
            create_moveable_text_box(bounds.left, bounds.top-25, bounds.width, bounds.height+25, text)
            apply_settings_to_boxes();
            store_text_settings();
            
           window.DRAWINGS = window.DRAWINGS.filter((d) => d[9] != $(this)[0].id);
            $(this).remove();
            sync_drawings();
        });
    }
}


/**
 * Creates the elements and events for some buttons within the draw text menu
 * Those events include "undo" & "clear" as these function differently from all
 * other selections that can be made
 * @param {$} buttons the buttons in which this text button is appended to
 */
function init_text_button(buttons) {
    textButton = $(
        "<button style='display:inline;width:75px' id='text_button' class='drawbutton menu-button hideable ddbc-tab-options__header-heading'><u>T</u>ext</button>"
    );

    textMenu = $(
        "<div id='text_menu' class='top_menu' style='position:fixed; top:25px; width:75px'></div>"
    );
     textMenu.append(
        `<div class='ddbc-tab-options--layout-pill'>
                <button id='text_select' class='drawbutton menu-option draw-option ddbc-tab-options__header-heading ddbc-tab-options__header-heading--is-active'
                   data-unique-with="control" data-function="edit_text">
                        Move/Edit
                </button>
            </div>`
    );
    textMenu.append(
        `<div class='ddbc-tab-options--layout-pill'>
                <button id='text_draw' class='drawbutton menu-option draw-option ddbc-tab-options__header-heading'
                    data-shape='rect' data-unique-with="control" data-function="draw_text">
                        Draw
                </button>
            </div>`
    );

    textMenu.append(
        `<div class='ddbc-tab-options--layout-pill'>
                <button id='text_erase' class='drawbutton menu-option draw-option ddbc-tab-options__header-heading'
                    data-shape='text_erase' data-unique-with="control" data-function="eraser">
                        Erase
                </button>
            </div>`
    );
    textMenu.append(`
            <div class='ddbc-tab-options--layout-pill'>
                <button class='ddbc-tab-options__header-heading menu-option' id='text_undo'>
                    UNDO
                </button>
            </div>`);
    textMenu.append(
        `<div class='ddbc-tab-options--layout-pill'>
                <button class='ddbc-tab-options__header-heading menu-option' id='text_clear'>
                    CLEAR
                </button>
            </div>`
    );

    textMenu.find("#text_clear").click(function () {
        r = confirm("DELETE ALL TEXT? (cannot be undone!)");
        if (r === true) {
            // keep anything that isn't text
            window.DRAWINGS = window.DRAWINGS.filter(
                (d) => !d[0].includes("text")
            );
            $("#text_div svg").empty();
            redraw_text();
            sync_drawings();
            document.getElementById("text_controller_inside")?.remove();
        }
    });

    textMenu.find("#text_undo").click(function () {
        let currentElement = window.DRAWINGS.length;
        // loop from the last element and remove if it's text
        while (currentElement--) {
            if (window.DRAWINGS[currentElement][0].includes("text")) {
                // text may or may not have a box behind it
                // be safe by using math.max
                if (
                    window.DRAWINGS[Math.max(currentElement - 1, 0)][0] ===
                    "text-rect"
                ) {
                    // remove 2 elements
                    window.DRAWINGS.splice(Math.max(currentElement - 1, 0), 2);
                } else {
                    window.DRAWINGS.splice(currentElement, 1);
                }
                redraw_text();
                sync_drawings()
                break;
            }
        }
    });

    $("body").append(textMenu);
    buttons.append(textButton);
    textMenu.css("left", textButton.position().left);
}
