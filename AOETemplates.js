
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
    aoe_button = $("<button style='display:inline;width:75px' id='aoe_button' class='drawbutton menu-button hideable ddbc-tab-options__header-heading'><u>A</u>OE</button>");
    aoe_menu = $("<div id='aoe_menu' class='top_menu'></div>");

    aoe_menu.append("<div class='menu-subtitle data-skip='true''>Size</div>");
    aoe_menu.append("<div><input id='aoe_feet' value='20' min=5 style='width:75px;margin:0px;text-align:center' maxlength='10' type='number' step='5' autofocus></div>");

    aoe_menu.append("<div class='menu-subtitle data-skip='true''>Color</div>");
    aoe_menu.append(
        `<div class='ddbc-tab-options--layout-pill'>
            <button id='aoe_default'
             class='ddbc-tab-options__header-heading drawbutton menu-option aoe-option aoecolor ddbc-tab-options__header-heading--is-active'
                data-unique-with="aoe_color">
                Default
            </button>
        </div>`);
    aoe_menu.append(
        `<div class='ddbc-tab-options--layout-pill'>
            <button id='aoe_fire' class='ddbc-tab-options__header-heading drawbutton menu-option aoe-option aoecolor'
                data-unique-with="aoe_color">
                Fire
            </button>
        </div>`);
    aoe_menu.append(
        `<div class='ddbc-tab-options--layout-pill'>
            <button id='aoe_dark' class='ddbc-tab-options__header-heading drawbutton menu-option aoe-option aoecolor'
                data-unique-with="aoe_color">
                Dark
            </button>
        </div>`);
    aoe_menu.append(
        `<div class='ddbc-tab-options--layout-pill'>
            <button id='aoe_green' class='ddbc-tab-options__header-heading drawbutton menu-option aoe-option aoecolor'
                data-unique-with="aoe_color">
                Green
            </button>
        </div>`);

    aoe_menu.append("<div class='menu-subtitle' data-skip='true'>Shape</div>");
    aoe_menu.append(
        `<div class='ddbc-tab-options--layout-pill' data-skip='true'>
            <button id='aoe_cone' class='aoeshape ddbc-tab-options__header-heading menu-option'>
                Cone
            </button>
        </div>`);
    aoe_menu.append(
        `<div class='ddbc-tab-options--layout-pill' data-skip='true'>
            <button id='aoe_square' class='aoeshape ddbc-tab-options__header-heading menu-option'>
                Square
            </button>
        </div>`);
    aoe_menu.append(`
        <div class='ddbc-tab-options--layout-pill' data-skip='true'>
            <button id='aoe_circle' class='aoeshape ddbc-tab-options__header-heading menu-option'>
                Circle
            </button>
        </div>`);

    aoe_menu.css("position", "fixed");
    aoe_menu.css("top", "25px");
    aoe_menu.css("width", "75px");
    aoe_menu.css('background', "url('/content/1-0-1487-0/skins/waterdeep/images/mon-summary/paper-texture.png')");

    $("body").append(aoe_menu);


    buttons.append(aoe_button);
    aoe_menu.css("left", aoe_button.position().left);

    $(".aoeshape").click(function (e) {
        const thisMenu = $(this).closest("[id*='menu']")
        const color = thisMenu.find(
            ".ddbc-tab-options__header-heading--is-active").attr("id").replace("aoe_", "");
        const shape = this.id.replace("aoe_", "");
        let feet = document.getElementById("aoe_feet").value

        drop_aoe_token(color, shape, feet);
    });
}

function is_feet_valid(feet) {
    return parseInt(feet) > 0;
}

function drop_aoe_token(color, shape, feet) {

    // support 13 damage types, for now most things will be default,
    // but this should make it easier to add more template colors as they come in
    switch(color) {
        case "slashing":
            color = "default";
            break;
        case "piercing":
            color = "default";
            break;
        case "bludgeoning":
            color = "default";
            break;
        case "poison":
            color = "green";
            break;
        case "acid":
            color = "green";
            break;
        case "fire":
            color = "fire";
            break;
        case "cold":
            color = "default";
            break;
        case "radiant":
            color = "fire";
            break;
        case "necrotic":
            color = "dark";
            break;
        case "lightning":
            color = "default";
            break;
        case "thunder":
            color = "default";
            break;
        case "force":
            color = "default";
            break;
        case "psychic":
            color = "default";
            break;
    }

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

    // don't create a token if the size isn't valid
    if (!is_feet_valid(feet)) {
        throw "failed to create aoe token, feet is invalid: " + feet;
    }

    // convert feet into pixels
    let size = window.CURRENT_SCENE_DATA.hpps * (feet / window.CURRENT_SCENE_DATA.fpsq);

    // circles are always by radius
    if (shape == 'circle') {
        size = size * 2;
    }

    console.log(`dropping aoe token: color ${color}, shape ${shape}, feet ${feet}`);

    let atts = {
        disablestat: true,
        hidestat: true,
        disableborder: true,
        square: true,
        imgsrc: AOE_TEMPLATES[`${color}-${shape}`],
        size: Math.round(size),
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