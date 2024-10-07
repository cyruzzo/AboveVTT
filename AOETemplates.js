
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

function get_available_styles(){
    return [
        "Acid",
        "Bludgeoning",
        "Darkness",
        "Default",
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
}



function setup_aoe_button(buttons) {
    
    const aoeButton = $("<div style='display:inline-block;width:fit-content;' id='aoe_button' class='drawbutton menu-button hideable ddbc-tab-options__header-heading'><u>A</u>OE</div>");
    const aoeMenu = $("<div id='aoe_menu' class='top_menu'></div>");

    aoeMenu.append("<div class='menu-subtitle'>Size</div>");
    
    aoeMenu.append(`<div><input min='5' onclick='$(this).select()'
        tabindex='2' id='aoe_feet_in_menu' value='20' style='width:75px;margin:0px;text-align:center' maxlength='10' type='number' step='5'></div>`);

    aoeMenu.append("<div class='menu-subtitle'>Style</div>");
    aoeMenu.append(
        `<div class='ddbc-tab-options--layout-pill'>
            <select id='aoe_styles' class="ddbc-select ddbc-tab-options__header-heading" >
                ${get_available_styles().map((aoeStyle) => {
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
            </button>
        </div>`);
    aoeMenu.append(`
        <div class='ddbc-tab-options--layout-pill'>
            <button id='aoe_line' data-shape='line' class='ddbc-tab-options__header-heading'>
                Line
            </button>
        </div>`);
    aoeMenu.append(`
        <div class='ddbc-tab-options--layout-pill'>
            <button id='aoe_circle' data-shape='circle' class='ddbc-tab-options__header-heading'>
                Circle
            </button>
        </div>`);
    aoeMenu.append(`
        <div class='ddbc-tab-options--layout-pill'>
            <button id='aoe_cone' data-shape='cone' class='ddbc-tab-options__header-heading'>
                Cone 
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
       
        const size = $("#aoe_feet_in_menu").val() / window.CURRENT_SCENE_DATA.fpsq

        const shape = $(e.currentTarget).attr("data-shape") 
        const style = $("#aoe_styles").val().toLowerCase()
        const options = build_aoe_token_options(style, shape, size)

        place_aoe_token_in_centre(options)
        $('#select-button').click();

    });
}

function place_aoe_token_in_centre(options){
    if(window.DM){
        place_token_in_center_of_view(options)
    }
    else{
        const center = center_of_view();
        let mapPosition = convert_point_from_view_to_map(center.x, center.y);
        options.left = mapPosition.x;
        options.top = mapPosition.y;
        window.MB.sendMessage("custom/myVTT/createtoken",options);
    }
}

function restyle_aoe_class(cls, style){
    return cls.replace(/aoe-style-\w+ /gm, style)
}
function sanitize_aoe_shape(shape){
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
    return shape
}

function set_spell_override_style(spellName){
    const spells = ["hypnotic pattern", "web", "fog cloud", "stinking cloud", "darkness"]
    if (typeof spellName === "string" && spells.includes(spellName.toLowerCase())){
        return `aoe-style-${spellName.toLowerCase().replace(" ","-")}`
    }
    else if (typeof spellName === "string" && spellName == 'Maddening Darkness'){
        return `aoe-style-darkness`
    }
    return ""
}

// This is a list of spells that probably have a default style. We may want to create specific aoe styles for some of these
// or more generic styles, such as a wind style for a bunch of things in here.

// https://www.dndbeyond.com/spells/antilife-shell
// https://www.dndbeyond.com/spells/antimagic-field
// https://www.dndbeyond.com/spells/antipathy-sympathy
// https://www.dndbeyond.com/spells/aura-of-life
// https://www.dndbeyond.com/spells/aura-of-purity
// https://www.dndbeyond.com/spells/aura-of-vitality
// https://www.dndbeyond.com/spells/calm-emotions
// https://www.dndbeyond.com/spells/circle-of-power
// https://www.dndbeyond.com/spells/color-spray
// https://www.dndbeyond.com/spells/confusion
// https://www.dndbeyond.com/spells/conjure-barrage
// https://www.dndbeyond.com/spells/conjure-volley
// https://www.dndbeyond.com/spells/control-flames
// https://www.dndbeyond.com/spells/control-weather
// https://www.dndbeyond.com/spells/control-winds
// https://www.dndbeyond.com/spells/create-or-destroy-water
// https://www.dndbeyond.com/spells/creation
// https://www.dndbeyond.com/spells/darkness
// https://www.dndbeyond.com/spells/daylight
// https://www.dndbeyond.com/spells/detect-evil-and-good
// https://www.dndbeyond.com/spells/detect-magic
// https://www.dndbeyond.com/spells/detect-poison-and-disease
// https://www.dndbeyond.com/spells/distort-value
// https://www.dndbeyond.com/spells/druid-grove
// https://www.dndbeyond.com/spells/entangle
// https://www.dndbeyond.com/spells/fabricate
// https://www.dndbeyond.com/spells/faerie-fire
// https://www.dndbeyond.com/spells/fear
// https://www.dndbeyond.com/spells/fog-cloud
// https://www.dndbeyond.com/spells/forcecage
// https://www.dndbeyond.com/spells/globe-of-invulnerability
// https://www.dndbeyond.com/spells/grease
// https://www.dndbeyond.com/spells/guards-and-wards
// https://www.dndbeyond.com/spells/hallow
// https://www.dndbeyond.com/spells/hallucinatory-terrain
// https://www.dndbeyond.com/spells/healing-spirit
// https://www.dndbeyond.com/spells/holy-aura
// https://www.dndbeyond.com/spells/hypnotic-pattern
// https://www.dndbeyond.com/spells/leomunds-tiny-hut
// https://www.dndbeyond.com/spells/light
// https://www.dndbeyond.com/spells/magic-circle
// https://www.dndbeyond.com/spells/magnificent-mansion
// https://www.dndbeyond.com/spells/major-image
// https://www.dndbeyond.com/spells/mass-cure-wounds
// https://www.dndbeyond.com/spells/minor-illusion
// https://www.dndbeyond.com/spells/mirage-arcane
// https://www.dndbeyond.com/spells/mold-earth
// https://www.dndbeyond.com/spells/mordenkainens-private-sanctum
// https://www.dndbeyond.com/spells/nathairs-mischief
// https://www.dndbeyond.com/spells/private-sanctum
// https://www.dndbeyond.com/spells/programmed-illusion
// https://www.dndbeyond.com/spells/purify-food-and-drink
// https://www.dndbeyond.com/spells/pyrotechnics
// https://www.dndbeyond.com/spells/resilient-sphere
// https://www.dndbeyond.com/spells/reverse-gravity
// https://www.dndbeyond.com/spells/shape-water
// https://www.dndbeyond.com/spells/silence
// https://www.dndbeyond.com/spells/silent-image
// https://www.dndbeyond.com/spells/sleep
// https://www.dndbeyond.com/spells/sleet-storm
// https://www.dndbeyond.com/spells/slow
// https://www.dndbeyond.com/spells/spike-growth
// https://www.dndbeyond.com/spells/stinking-cloud
// https://www.dndbeyond.com/spells/tiny-hut
// https://www.dndbeyond.com/spells/warding-wind
// https://www.dndbeyond.com/spells/watery-sphere
// https://www.dndbeyond.com/spells/web
// https://www.dndbeyond.com/spells/zone-of-truth

function get_aoe_default_options(){
    let options = {
        disablestat: true,
        hidestat: true,
        disableborder: true,
        square: true,
        restrictPlayerMove: false,
        locked: false,
        disableaura: true,
        legacyaspectratio: false,
        deleteableByPlayers: true,
        lockRestrictDrop: 'none',
        auraVisible: false,
        auraislight: false,
        revealInFog: true,
        hidden: false
    }
    return options
}

function build_aoe_class_name(style, shape, name) {
    if (!style.startsWith("aoe-style-")) {
        style = `aoe-style-${style}`;
    }
    if (!shape.startsWith("aoe-shape")) {
        shape = `aoe-shape-${shape}`;
    }
    return `aoe-token-tileable ${style} ${shape} ${name ? set_spell_override_style(name) : ""}`;
}
function build_aoe_img_name(style, shape, name) {
    return `class=${build_aoe_class_name(style, shape, name)}`;
}
function build_aoe_token_options(style, shape, countGridSquares, name = "") {
    shape = sanitize_aoe_shape(shape)
    let size = Math.round(window.CURRENT_SCENE_DATA.hpps * countGridSquares)

    // circles are always by radius
    if (shape == 'circle') {
        size = size * 2;
    }

    let options = get_aoe_default_options()
    options.name = name
    
    options.size = shape !== "line" ? size : ""
    options.gridHeight = shape === "line" ? countGridSquares : ""
    options.gridWidth = shape === "line" ? 1 : ""

    if(style == 'darkness'){
        options = {
            ...options,
            darkness: true
        }
    }
    options = {
        ...options,
        ...find_or_create_token_customization('aoe', `_Area_of_Effects_${shape}_AoE`, 'aoeFolder', 'aoeFolder').allCombinedOptions()
    }
    
    options.imgsrc = build_aoe_img_name(style, shape, name);
    return options
}

function build_aoe_token_image(token, scale, rotation){
    let tokenImageContainer = $(`<div class=token-image style='transform:scale(var(--token-scale)) rotate(var(--token-rotation))'>`);
    let aoeClassName = token.options.imgsrc.replace("class=","").trim();
    console.debug("build_aoe_token_image aoeClassName", aoeClassName);
    let tokenImage = $(`<div data-img="true" class='${aoeClassName}'></div>`);

    if (token.options.imgsrc.includes("cone")){
        tokenImageContainer.append(`<div class='aoe-border aoe-border-cone'></div>`)
    }
    else {
        $(tokenImage).addClass("aoe-border-basic")
    }
    tokenImageContainer.append(tokenImage)
    return tokenImageContainer;
}
