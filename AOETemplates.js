
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
    aoe_button = $("<button style='display:inline;width:75px' id='aoe_button' class='drawbutton menu-button hideable'><u>A</u>OE</button>");
    aoe_menu = $("<div id='aoe_menu' class='top_menu'></div>");

    aoe_menu.append("<div style='font-weight:bold'>Size</div>");
    aoe_menu.append("<div><input tabindex='2' id='aoe_feet' value='20' style='width:75px;margin:0px;text-align:center' maxlength='10'></div>");

    aoe_menu.append("<div style='font-weight:bold'>Color</div>");
    aoe_menu.append("<div><button tabindex='3' id='aoe_default' class='drawbutton menu-option aoe-option aoecolor remembered-selection' style='width:75px'>Default</button></div>");
    aoe_menu.append("<div><button tabindex='3' id='aoe_fire' class='drawbutton menu-option aoe-option aoecolor' style='width:75px'>Fire</button></div>");
    aoe_menu.append("<div><button tabindex='3' id='aoe_dark' class='drawbutton menu-option aoe-option aoecolor' style='width:75px'>Dark</button></div>");
    aoe_menu.append("<div><button tabindex='3' id='aoe_green' class='drawbutton menu-option aoe-option aoecolor' style='width:75px'>Green</button></div>");

    aoe_menu.append("<div style='font-weight:bold'>Shape</div>");
    aoe_menu.append("<div><button tabindex='1' id='aoe_cone' class='aoeshape' style='width:75px'>Cone</button></div>");
    aoe_menu.append("<div><button tabindex='1' id='aoe_square' class='aoeshape' style='width:75px'>Square</button></div>");
    aoe_menu.append("<div><button tabindex='1' id='aoe_circle'class='aoeshape' style='width:75px'>Circle</button></div>");

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
        const color = $(".aoe-option.remembered-selection").attr('id').split('_')[1];
        const shape = this.id.split("_")[1];
        let feet = document.getElementById("aoe_feet").value

        // refocus size box if size is 0
        if (!is_feet_valid(feet)) {
            $("#aoe_feet").focus();
            return;
        }

        drop_aoe_token(color, shape, feet);

        if(window.DM){
            $('#select-button').click();
        }
        else{
            $('#aoe_button').click();
        }
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
        'data-disablestat': true,
        'data-hidestat': true,
        'data-disableborder': true,
        'data-square': 1,
        'data-img': AOE_TEMPLATES[`${color}-${shape}`],
        'data-size': Math.round(size),
    };

    if(window.DM){
        let fake=$("<div/>");
        fake.attr(atts);
        token_button({target:fake.get(0)});
        fake.remove();
    }
    else{
        let centerX = $(window).scrollLeft() + Math.round(+$(window).width() / 2) - 200;
        let centerY = $(window).scrollTop() + Math.round($(window).height() / 2) - 200;
        centerX = Math.round(centerX * (1.0 / window.ZOOM));
        centerY = Math.round(centerY * (1.0 / window.ZOOM));
        atts['data-left']=centerX;
        atts['data-top']=centerY;
        window.MB.sendMessage("custom/myVTT/createtoken",atts);
    }
}
