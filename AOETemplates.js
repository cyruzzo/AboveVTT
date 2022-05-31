
// Lines are not supported yet
const AOE_TEMPLATES = {
    'dark-circle': 'https://abovevtt-assets.s3.eu-central-1.amazonaws.com/aoe/SpellToken_DarkCircle.png',
    'dark-cone': 'https://abovevtt-assets.s3.eu-central-1.amazonaws.com/aoe/Spelltoken_DarkCone.png',
    //'dark-line': 'https://drive.google.com/file/d/16G3T1cdyrOkn3TYrol855yXtR122VkTe/view?usp=sharing',
    'dark-square': 'https://abovevtt-assets.s3.eu-central-1.amazonaws.com/aoe/Spelltoken_DarkSquare.png',
    'default-circle': 'https://abovevtt-assets.s3.eu-central-1.amazonaws.com/aoe/Spelltoken_DefaultCircle.png',
    'default-cone': 'https://abovevtt-assets.s3.eu-central-1.amazonaws.com/aoe/SpellToken_DefaultCone.png',
    //'default-line': 'https://drive.google.com/file/d/1GfstCLPWsIpZ8wz8O1MVv0658XlM0i2p/view?usp=sharing',
    'default-square': 'https://abovevtt-assets.s3.eu-central-1.amazonaws.com/aoe/SpellToken_DefaultSquare.png',
    'fire-circle': 'https://abovevtt-assets.s3.eu-central-1.amazonaws.com/aoe/SpellToken_FireCircle.png',
    'fire-cone': 'https://abovevtt-assets.s3.eu-central-1.amazonaws.com/aoe/Spelltoken_FireCone.png',
    //'fire-line': 'https://drive.google.com/file/d/1TEyhC5c_syyY_gnfB2fIFZK6djdWw9qg/view?usp=sharing',
    'fire-square': 'https://abovevtt-assets.s3.eu-central-1.amazonaws.com/aoe/SpellToken_FireSquare.png',
    'green-circle': 'https://abovevtt-assets.s3.eu-central-1.amazonaws.com/aoe/Spelltoken_GreenCircle.png',
    'green-cone': 'https://abovevtt-assets.s3.eu-central-1.amazonaws.com/aoe/Spelltoken_GreenCone.png',
    //'green-line': 'https://drive.google.com/file/d/1LNIBQAMJhrjFaOJk-iPioaUaFFvX3EUP/view?usp=sharing',
    'green-square': 'https://abovevtt-assets.s3.eu-central-1.amazonaws.com/aoe/Spelltoken_GreenSquare.png',
}




function setup_aoe_button() {
    const availabllStyle = [
        "Acid",
        "Bludgeoning",
        "Fire",
        "Force",
        "Ice",
        "Lightning",
        "Nature",
        "Necrotic",
        "Piercing",
        "Poison",
        "Psychic",
        "Radiant",
        "Slashing",
        "Thunder",
        "Water"
    ]
    const aoeButton = $("<div style='display:inline;width:75px' id='aoe_button' class='drawbutton menu-button hideable ddbc-tab-options__header-heading'><u>A</u>OE</div>");
    const aoeMenu = $("<div id='aoe_menu' class='top_menu'></div>");

    aoeMenu.append("<div class='menu-subtitle'>Size</div>");
    
    aoeMenu.append(`<div><input min='5' tabindex='2' id='aoe_feet_height' value='20' style='width:75px;margin:0px;text-align:center' maxlength='10' type='number' step='5'></div>`);

    aoeMenu.append("<div class='menu-subtitle'>Style</div>");
    aoeMenu.append(
        `<div class='ddbc-tab-options--layout-pill'>
            <select id='aoe_styles' class="ddbc-select ddbc-tab-options__header-heading" >
                ${availabllStyle.map((aoeStyle) => {
                    return `<option class="ddbc-tab-options__header-heading" value="${aoeStyle}">${aoeStyle}</option>`;
                })}
            </select>
        </div>
            `)
    aoeMenu.append("<div class='menu-subtitle'>Shape</div>");

    aoeMenu.append(`
        <div class='ddbc-tab-options--layout-pill'>
            <button id='aoe_square' data-shape='square' class='ddbc-tab-options__header-heading'>
                Square
                <span class="material-icons aoe-button-moveable">open_with</span>
            </button>
        </div>`);
    aoeMenu.append(`
        <div class='ddbc-tab-options--layout-pill'>
            <button id='aoe_line' data-shape='line' class='ddbc-tab-options__header-heading'>
                Line
                <span class="material-icons aoe-button-moveable">open_with</span>
            </button>
        </div>`);
    aoeMenu.append(`
        <div class='ddbc-tab-options--layout-pill'>
            <button id='aoe_circle' data-shape='circle' class='ddbc-tab-options__header-heading'>
                Circle
                <span class="material-icons aoe-button-moveable">open_with</span>
            </button>
        </div>`);
    aoeMenu.append(`
        <div class='ddbc-tab-options--layout-pill'>
            <button id='aoe_cone' data-shape='cone' class='ddbc-tab-options__header-heading'>
                Cone 
                <span class="material-icons aoe-button-moveable">open_with</span>
            </button>
        </div>`);
    aoeMenu.find("button, select").css("width", "69px")
    aoeMenu.css("position", "fixed");
    aoeMenu.css("top", "25px");
    aoeMenu.css("width", "75px");
    aoeMenu.css('background', "url('/content/1-0-1487-0/skins/waterdeep/images/mon-summary/paper-texture.png')");

    $("body").append(aoeMenu);


    buttons.append(aoeButton);
    aoeMenu.css("left", aoeButton.position().left);


    $("#aoe_feet").keydown(function(e) {
        if (e.key === "Escape") {
            $('#select-button').click();
        }
    });

    $("#aoe_menu button").click(function (e) {
       
        const feet = $("#aoe_feet_height").val()

        const shape = $(e.currentTarget).attr("data-shape") 
        const style = $("#aoe_styles").val().toLowerCase()
        drop_aoe_token(style, shape, feet);

        if(window.DM){
            $('#select-button').click();
        }
        else{
            $('#aoe_button').click();
        }
    });
    $("#aoe_menu button").draggable({
        appendTo: "#VTTWRAPPER",
        zIndex: 100000,
        cursorAt: {top: 0, left: 0},
        // cancel:false is required when dragging buttons
        cancel:false,
        helper: function(event) {
            console.log("enable_draggable_token_creation helper");
            // let draggedRow = $(event.target).closest(".list-item-identifier");
            // let draggedItem = find_sidebar_list_item(draggedRow);
            // let helper = draggedRow.find("img.token-image").clone();
            // if (specificImage !== undefined) {
            //     helper.attr("src", specificImage);
            // } else {
            //     let randomImage = random_image_for_item(draggedItem);
            //     helper.attr("src", randomImage);
            // }
            // let helper = $(`
            // <div class="token-image" style="max-width:50px; max-height:50px" >
            //     <div data-image="true" class=aoe-token-tileable aoe-style-acid aoe-shape-cone />
            // </div>`)
            let helper = $(`<div style=background-color:white; width:50px; height:50px>`)
            helper.addClass("draggable-token-creation");

            return helper;
        },
        start: function (event, ui) {
            console.log("enable_draggable_token_creation start");
            $(ui.helper).css('width', `50px`);
            $(this).draggable('instance').offset.click = {
                left: Math.floor(ui.helper.width() / 2),
                top: Math.floor(ui.helper.height() / 2)
            };
        },
        drag: function (event, ui) {
            if (event.shiftKey) {
                $(ui.helper).css("opacity", 0.5);
            } else {
                $(ui.helper).css("opacity", 1);
            }
        },
        stop: function (event, ui) {
            event.stopPropagation(); // prevent the mouseup event from closing the modal
            // if ($(ui.helper).hasClass("drag-cancelled")) {
            //     console.log("enable_draggable_token_creation cancelled");
            //     return;
            // }

            let droppedOn = document.elementFromPoint(event.clientX, event.clientY);
            console.log("droppedOn", droppedOn);
            // if (droppedOn?.closest("#VTT")) {
            //     // place a token where this was dropped
            //     console.log("enable_draggable_token_creation stop");
            //     let draggedRow = $(event.target).closest(".list-item-identifier");
            //     let draggedItem = find_sidebar_list_item(draggedRow);
            //     let hidden = event.shiftKey || window.TOKEN_SETTINGS["hidden"];
            //     let src = $(ui.helper).attr("src");
            //     create_and_place_token(draggedItem, hidden, src, event.pageX, event.pageY);
            // } else {
            //     console.log("Not dropping over element", droppedOn);
            // }
            drop_aoe_token( 
                $("#aoe_styles").val().toLowerCase(),
                $(event.target).attr("data-shape"),
                $("#aoe_feet_height").val())
        }
    })

}

function drop_aoe_token(style, shape, feet) {
   
    // normalize shape
    switch(shape) {
        case "cube":
            shape = "square";
            break;
        case "sphere":
            shape = "circle";
            break;
        case "cylinder":
            shape = "circle";
    }
    let size = window.CURRENT_SCENE_DATA.hpps * (feet / window.CURRENT_SCENE_DATA.fpsq);

    const height =  parseInt(feet / window.CURRENT_SCENE_DATA.fpsq);
    // circles are always by radius
    if (shape == 'circle') {
        size = size * 2;
    }

    const image = `class=aoe-token-tileable aoe-style-${style} aoe-shape-${shape}`

    let atts = {
        disablestat: true,
        hidestat: true,
        disableborder: true,
        square: true,
        imgsrc: image,
        size: shape !== "line" ? size : "",
        gridHeight: shape === "line" ? Math.round(height) : "",
        gridWidth: shape === "line" ? 1 : "",
        restrictPlayerMove: false,
        hidden: false,
        locked: false,
        disableaura: true,
        legacyaspectratio: false,
        deleteableByPlayers: true
    };

    if(window.DM){
        place_token_in_center_of_view(atts);
    }
    else{
        let center = center_of_view();
        atts.left = center.x;
        atts.top = center.y;
        window.MB.sendMessage("custom/myVTT/createtoken",atts);
    }
}

function build_aoe_token_image(token){
    tokenImageContainer = $(`<div class=token-image>`)
    tokenImage = $(
        `<div data-img="true" style='transform:scale(1) rotate(0)'; 
         class='${token.options.imgsrc.replace("class=","").trim()}'>
         </div>
        `)

    if (token.options.imgsrc.includes("cone")){
        tokenImageContainer.append(`<div class='aoe-border aoe-border-cone'></div>`)
    }
    else {
        $(tokenImage).addClass("aoe-border-basic")
    }
    tokenImageContainer.append(tokenImage)
    return tokenImageContainer
}