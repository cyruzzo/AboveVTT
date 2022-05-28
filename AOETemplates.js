
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
    aoe_button = $("<div style='display:inline;width:75px' id='aoe_button' class='drawbutton menu-button hideable ddbc-tab-options__header-heading'><u>A</u>OE</div>");
    aoe_menu = $("<div id='aoe_menu' class='top_menu'></div>");

    aoe_menu.append("<div class='menu-subtitle'>Size</div>");
    
    aoe_menu.append(`<div><input min='5' tabindex='2' id='aoe_feet_height' value='20' style='width:75px;margin:0px;text-align:center' maxlength='10' type='number' step='5'></div>`);

    aoe_menu.append("<div class='menu-subtitle'>Style</div>");
    // ddbc-tab-options__header-heading--is-active remembered-selection
    aoe_menu.append("<div class='ddbc-tab-options--layout-pill'><div id='aoe_acid' data-type='acid' class='ddbc-tab-options__header-heading drawbutton menu-option aoe-option aoecolor'>Acid</div></div>");
    aoe_menu.append("<div class='ddbc-tab-options--layout-pill'><div id='aoe_bludgeoning' data-type='bludgeoning' class='ddbc-tab-options__header-heading drawbutton menu-option aoe-option aoecolor'>Bludgeoning</div></div>");
    aoe_menu.append("<div class='ddbc-tab-options--layout-pill'><div id='aoe_fire' data-type='fire' class='ddbc-tab-options__header-heading drawbutton menu-option aoe-option aoecolor'>Fire</div></div>");
    aoe_menu.append("<div class='ddbc-tab-options--layout-pill'><div id='aoe_force' data-type='force' class='ddbc-tab-options__header-heading drawbutton menu-option aoe-option aoecolor'>Force</div></div>");
    aoe_menu.append("<div class='ddbc-tab-options--layout-pill'><div id='aoe_ice' data-type='ice' class='ddbc-tab-options__header-heading drawbutton menu-option aoe-option aoecolor'>Ice</div></div>");
    aoe_menu.append("<div class='ddbc-tab-options--layout-pill'><div id='aoe_lightning' data-type='lightning' class='ddbc-tab-options__header-heading drawbutton menu-option aoe-option aoecolor'>Lightning</div></div>");
    aoe_menu.append("<div class='ddbc-tab-options--layout-pill'><div id='aoe_nature' data-type='nature' class='ddbc-tab-options__header-heading drawbutton menu-option aoe-option aoecolor'>Nature</div></div>");
    aoe_menu.append("<div class='ddbc-tab-options--layout-pill'><div id='aoe_necrotic' data-type='necrotic' class='ddbc-tab-options__header-heading drawbutton menu-option aoe-option aoecolor'>Necrotic</div></div>");
    aoe_menu.append("<div class='ddbc-tab-options--layout-pill'><div id='aoe_piercing' data-type='piercing' class='ddbc-tab-options__header-heading drawbutton menu-option aoe-option aoecolor'>Piercing</div></div>");
    aoe_menu.append("<div class='ddbc-tab-options--layout-pill'><div id='aoe_poison' data-type='poison' class='ddbc-tab-options__header-heading drawbutton menu-option aoe-option aoecolor'>Poison</div></div>");
    aoe_menu.append("<div class='ddbc-tab-options--layout-pill'><div id='aoe_psychic' data-type='psychic' class='ddbc-tab-options__header-heading drawbutton menu-option aoe-option aoecolor'>Psychic</div></div>");
    aoe_menu.append("<div class='ddbc-tab-options--layout-pill'><div id='aoe_radiant' data-type='radiant' class='ddbc-tab-options__header-heading drawbutton menu-option aoe-option aoecolor'>Radiant</div></div>");
    aoe_menu.append("<div class='ddbc-tab-options--layout-pill'><div id='aoe_slashing' data-type='slashing' class='ddbc-tab-options__header-heading drawbutton menu-option aoe-option aoecolor'>Slashing</div></div>");
    aoe_menu.append("<div class='ddbc-tab-options--layout-pill'><div id='aoe_thunder' data-type='thunder' class='ddbc-tab-options__header-heading drawbutton menu-option aoe-option aoecolor'>Thunder</div></div>");
    aoe_menu.append("<div class='ddbc-tab-options--layout-pill'><div id='aoe_water' data-type='water' class='ddbc-tab-options__header-heading drawbutton menu-option aoe-option aoecolor'>Water</div></div>");

    aoe_menu.append("<div class='menu-subtitle'>Shape</div>");

    aoe_menu.append("<div class='ddbc-tab-options--layout-pill'><div id='aoe_square' data-shape='square' class='aoeshape ddbc-tab-options__header-heading'>Square</div></div>");
    aoe_menu.append("<div class='ddbc-tab-options--layout-pill'><div id='aoe_line' data-shape='line' class='aoeshape ddbc-tab-options__header-heading'>Line</div></div>");
    aoe_menu.append("<div class='ddbc-tab-options--layout-pill'><div id='aoe_circle' data-shape='circle' class='aoeshape ddbc-tab-options__header-heading'>Circle</div></div>");
    aoe_menu.append("<div class='ddbc-tab-options--layout-pill'><div id='aoe_cone' data-shape='cone' class='aoeshape ddbc-tab-options__header-heading'>Cone</div></div>");

    aoe_menu.css("position", "fixed");
    aoe_menu.css("top", "25px");
    aoe_menu.css("width", "75px");
    aoe_menu.css('background', "url('/content/1-0-1487-0/skins/waterdeep/images/mon-summary/paper-texture.png')");

    $("body").append(aoe_menu);


    buttons.append(aoe_button);
    aoe_menu.css("left", aoe_button.position().left);


    $("#aoe_feet").keydown(function(e) {
        if (e.key === "Escape") {
            $('#select-button').click();
        }
    });

    $(".aoeshape").click(function (e) {
       
        const feet = aoe_menu.find("#aoe_feet_height").val()

        const shape = $(this).attr("data-shape") 
        const style = $(".aoe-option.remembered-selection").attr("data-type")
        drop_aoe_token(style, shape, feet);

        if(window.DM){
            $('#select-button').click();
        }
        else{
            $('#aoe_button').click();
        }
    });
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

    const image = [`class=aoe-token-tileable aoe-style-${style} aoe-shape-${shape}`, `class=aoe-border-basic`]

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