
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





function setup_aoe_button(buttons) {
    
    const aoeButton = $("<div style='display:inline-block;width:fit-content;' id='aoe_button' data-name='AoE Templates (A)' class='drawbutton hasTooltip menu-button hideable ddbc-tab-options__header-heading'><span class='button-text'><u>A</u>OE</span></div>");
    const aoeMenu = $("<div id='aoe_menu' class='top_menu'></div>");
    const aoeSubMenu = $("<div id='aoe_sub_menu' class='top_menu'></div>");
    
    aoeMenu.append("<div class='menu-subtitle'>Size</div>");
    
    aoeMenu.append(`<div><input min='5' onclick='$(this).select()'
        tabindex='2' id='aoe_feet_in_menu' value='20' style='width:75px;margin:0px;text-align:center' maxlength='10' type='number' step='5'></div>`);
    aoeMenu.append("<div class='menu-subtitle'>Line Width</div>");
    aoeMenu.append(`<div><input min='5' onclick='$(this).select()'
        tabindex='2' id='aoe_line_feet_in_menu' value='5' style='width:75px;margin:0px;text-align:center' maxlength='10' type='number' step='5'></div>`);
    aoeMenu.append("<div class='menu-subtitle'>Style</div>");
    aoeMenu.append(
        `<div class='ddbc-tab-options--layout-pill'>
            <div id='aoe_styles_dropdown' class='aoe-style-dropdown'>
                <input type='hidden' id='aoe_styles' value='' />
                <div class='aoe-style-dropdown-toggle ddbc-tab-options__header-heading'></div>
               
            </div>
        </div>
            `)
    aoeSubMenu.append(`<div class='aoe-style-dropdown-list'></div>`);
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
    aoeMenu.find("button, select, .aoe-style-dropdown-toggle").css("width", "69px")
    aoeMenu.css("position", "fixed");
    aoeMenu.css("top", "25px");
    aoeMenu.css("width", "75px");
    aoeMenu.css('background', "url('/content/1-0-1487-0/skins/waterdeep/images/mon-summary/paper-texture.png')");

    aoeSubMenu.css({
        "position": "fixed", 
        "top": "25px", 
        "width": "fit-content", 
        'background': "url('/content/1-0-1487-0/skins/waterdeep/images/mon-summary/paper-texture.png')",
        'text-transform': 'uppercase',
        'font-weight': 'bold',
        'font-size': '12px',
        'transition': 'none'
    });

    $("body").append(aoeMenu, aoeSubMenu);

    setup_aoe_style_dropdown();


    buttons.append(aoeButton);
    aoeMenu.css("left", aoeButton.position().left);
    aoeSubMenu.css("left", aoeButton.position().left + 80);    

    $("#aoe_feet_in_menu").keydown(function(e) {
        if (e.key === "Escape") {
            $('#select-button').click();
        }
    });

    $("#aoe_menu button").click(function (e) {
       
        const size = $("#aoe_feet_in_menu").val() / window.CURRENT_SCENE_DATA.fpsq;
        const lineSize= $("#aoe_line_feet_in_menu").val() / window.CURRENT_SCENE_DATA.fpsq;

        const shape = $(e.currentTarget).attr("data-shape") 
        const style = $("#aoe_styles").val().toLowerCase()
        const options = build_aoe_token_options(style, shape, size, '', lineSize)

        //if single token selected, place there:
        if(window.CURRENTLY_SELECTED_TOKENS.length == 1) {
            place_aoe_token_at_token(options, window.TOKEN_OBJECTS[window.CURRENTLY_SELECTED_TOKENS[0]]);
        } else {
            place_aoe_token_in_centre(options);
        }
        $('#select-button').click();

    });
}

function setup_aoe_style_dropdown() {
    const dropdown = $("#aoe_styles_dropdown");
    const aoeSubMenu = $("#aoe_sub_menu");
    dropdown.on("click", ".aoe-style-dropdown-toggle", function(clickEvent) {
        clickEvent.stopPropagation();
        if (aoeSubMenu.hasClass("visible")) {
            aoeSubMenu.removeClass("visible");
            return;
        }
        aoeSubMenu.addClass("visible");
        const list = aoeSubMenu.find(".aoe-style-dropdown-list");
        const listTop = list[0].getBoundingClientRect().top;
        list.css("max-height", `${Math.max(60, window.innerHeight - listTop - 100)}px`);
        list.find(".aoe-style-dropdown-item.selected")[0]?.scrollIntoView({ block: "nearest" });
    });

    aoeSubMenu.on("click", ".aoe-style-dropdown-item", function(clickEvent) {
        clickEvent.stopPropagation();
        set_aoe_style_dropdown_value($(clickEvent.currentTarget).attr("data-value"));
        aoeSubMenu.removeClass("visible");
    });

    $(document).off("click.aoeStyleDropdown").on("click.aoeStyleDropdown", function() {
        aoeSubMenu.removeClass("visible");
    });

    refresh_aoe_style_menu();
}

function set_aoe_style_dropdown_value(style) {
    const dropdown = $("#aoe_styles_dropdown");
    dropdown.find("#aoe_styles").val(style);
    dropdown.find(".aoe-style-dropdown-toggle").text(style);
    const aoeSubMenu = $("#aoe_sub_menu");
    aoeSubMenu.find(".aoe-style-dropdown-item").removeClass("selected");
    aoeSubMenu.find(`.aoe-style-dropdown-item[data-value="${style}"]`).addClass("selected");
}

function refresh_aoe_style_menu() {
    const aoeSubMenu = $("#aoe_sub_menu");
    if (aoeSubMenu.length === 0) return;

    const styles = get_available_styles();
    const currentStyle = $("#aoe_styles").val();
    const list = aoeSubMenu.find(".aoe-style-dropdown-list").empty();
    styles.forEach(function(style) {
        list.append($(`<div class="aoe-style-dropdown-item ddbc-tab-options__header-heading"></div>`).attr("data-value", style).text(style));
    });
    set_aoe_style_dropdown_value(styles.includes(currentStyle) ? currentStyle : styles[0]);
}

function place_aoe_token_at_token(options, token){
    const sc = parseFloat(window.CURRENT_SCENE_DATA.hpps);
    const half = sc * token.options.gridSquares/2;
    let x = parseInt(token.options.left.slice(0,-2)) + half;
    let y = parseInt(token.options.top.slice(0,-2)) + half

    options.rotation = token.options.rotation;
    options.repositionAoe = {x: x, y: y};

    if(window.DM){
        place_token_at_map_point(options, x, y);
    }
    else{
        options.left = x;
        options.top = y;
        window.MB.sendMessage("custom/myVTT/createtoken",options);
    }
    


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

function getOrigin(token){
    let tok = $(`div.token[data-id='${token.options.id}']`);
    let tokImage = $(`div.token[data-id='${token.options.id}']>.token-image`);

    let tokenImageClientPosition = tokImage[0].getBoundingClientRect();
    let tokenImagePosition = tokImage.position();
    let tokenImageWidth = (tokenImageClientPosition.width) / (window.ZOOM);
    let tokenImageHeight = (tokenImageClientPosition.height) / (window.ZOOM);
    let tokenTop = (tok.position().top + tokenImagePosition.top) / (window.ZOOM);
    let tokenBottom = tokenTop + tokenImageHeight;
    let tokenLeft = (tok.position().left  + tokenImagePosition.left) / (window.ZOOM);
    let tokenRight = tokenLeft + tokenImageWidth;
    
    if(token.options.imgsrc.match(/aoe-shape-cone|aoe-shape-line|aoe-shape-square/gi)){
        let rayAngle = 90;
        let ray = new Ray({x: (tokenLeft + tokenRight)/2, y: (tokenTop + tokenBottom)/2}, degreeToRadian(parseFloat(tok.css('--token-rotation')) % 360 - rayAngle));   
        let dir = ray.dir;
        let tokenWidth = token.sizeWidth();
        let tokenHeight = token.sizeHeight();
        let widthAdded = tokenHeight; 

    return  {
                'x': (tokenLeft + tokenRight)/2 + (widthAdded*dir.x/2),
                'y': (tokenTop + tokenBottom)/2 + (widthAdded*dir.y/2)
            }    
    } 
    return  {
        'x': (tokenLeft + tokenRight)/2,
        'y': (tokenTop + tokenBottom)/2
    }                      
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
function build_aoe_token_options(style, shape, countGridSquares, name = "", lineWidth = 1) {
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
    options.gridWidth = shape === "line" ? lineWidth : ""
    if(shape === "line"){
        options.lineAoe = "1";
    }

    if(style == 'darkness'){
        options = {
            ...options,
            darkness: true
        }
    }
    options = $.extend(true, {}, 
        options,
        find_or_create_token_customization('aoe', `_Area_of_Effects_${shape}_AoE`, 'aoeFolder', 'aoeFolder').allCombinedOptions()
    );
    
    options.imgsrc = build_aoe_img_name(style, shape, name);
    options.aoeImage = get_aoe_style_token_image(style);
    options.aoeImageTiled = get_aoe_style_token_tiling(style);
    options.aoeImageOpacity = get_aoe_style_token_opacity(style);
    options.aoeImageBorder = get_aoe_style_token_border(style);
    options.aoeImageVideo = get_aoe_style_token_video(style);
    options.darkness = get_aoe_style_token_darkness(style);
    return options
}


function apply_aoe_style_display(element, settings, tileSize = "300px") {
    const node = element?.[0];
    if (!node) return;
    if (settings.tiled !== undefined) {
        node.style.setProperty("background-repeat", settings.tiled === false ? "no-repeat" : "repeat", "important");
        node.style.setProperty("background-size", settings.tiled === false ? "cover" : tileSize, "important");
    }

    node.style.setProperty("opacity", settings.opacity ?? 0.5, "important");
}

function is_aoe_video_image(url) {
    return typeof url === "string" && ['.mp4', '.webm', '.m4v'].some(d => url.includes(d));
}

function build_aoe_token_image(token){
    let tokenImageContainer = $(`<div class=token-image style='transform:scale(var(--token-scale)) rotate(var(--token-rotation))'>`);
    let aoeClassName = token.options.imgsrc.replace("class=","").trim();
    let tokenImage;
    if (token.options.aoeImage) {
        const shapeClass = aoeClassName.match(/aoe-shape-[\w-]+/)?.[0] || "";
        const isVideo = token.options.aoeImageVideo === true || is_aoe_video_image(token.options.aoeImage);
        tokenImage = isVideo
            ? $(`<video disableRemotePlayback autoplay loop muted data-img="true" class="aoe-token-tileable ${shapeClass} div-token-image"></video>`)
            : $(`<div data-img="true" class="aoe-token-tileable ${shapeClass} div-token-image"></div>`);
        updateTokenSrc(token.options.aoeImage, tokenImage, isVideo).then(function() {
            // a video cannot repeat, so only images take the tiling setting
            if (!isVideo) {
                apply_aoe_style_display(tokenImage, { tiled: token.options.aoeImageTiled });
            }
        });
    } else {
        tokenImage = $(`<div data-img="true" class='${aoeClassName}'></div>`);
    }

    apply_aoe_style_display(tokenImage, {
        opacity: token.options.aoeImageOpacity,
    });

    if (token.options.aoeImageBorder !== false) {
        if (token.options.imgsrc.includes("cone")){
            const border = $(`<div class='aoe-border aoe-border-cone'></div>`);
            tokenImageContainer.append(border);
            apply_aoe_style_display(border, {
                opacity: token.options.aoeImageOpacity,
            });
        }
        else {
            tokenImage.addClass("aoe-border-basic")
        }
    }
    tokenImageContainer.prepend(tokenImage)
    return tokenImageContainer;
}
