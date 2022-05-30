
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

    aoeMenu.append("<div class='ddbc-tab-options--layout-pill'><button id='aoe_square' data-shape='square' class='ddbc-tab-options__header-heading'>Square</button></div>");
    aoeMenu.append("<div class='ddbc-tab-options--layout-pill'><button id='aoe_line' data-shape='line' class='ddbc-tab-options__header-heading'>Line</button></div>");
    aoeMenu.append("<div class='ddbc-tab-options--layout-pill'><button id='aoe_circle' data-shape='circle' class='ddbc-tab-options__header-heading'>Circle</button></div>");
    aoeMenu.append("<div class='ddbc-tab-options--layout-pill'><button id='aoe_cone' data-shape='cone' class='ddbc-tab-options__header-heading'>Cone</button></div>");
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
       
        const feet = aoeMenu.find("#aoe_feet_height").val()

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
         class='${token.options.imgsrc.replace("class=","").trim()}'
         </div>
        `)

    const borders = []
        // cone aoe tokens
        if (token.options.imgsrc.includes("cone")){
            const fullBorder = $(`<div class='aoe-border aoe-border-cone'></div>`)
            borders.push(fullBorder)
        }
        else if (token.options.imgsrc.includes("circle")){
            $(tokenImage).addClass("aoe-border-circle")
        }
        else{
            if(token.options.size !== "" && token.options.gridWidth === "" && token.options.gridHeight === ""){
                // square
                const bottomBorder = $(`<div class='aoe-border aoe-border-bottom aoe-border-basic' ></div>`)
                const topBorder = $(`<div class='aoe-border aoe-border-top aoe-border-basic' ></div>`)
                const leftBorder = $(`<div class='aoe-border aoe-border-left aoe-border-basic' ></div>`)
                const rightBorder = $(`<div class='aoe-border aoe-border-right aoe-border-basic' ></div>`)
                borders.push(bottomBorder, leftBorder, rightBorder, topBorder)
            }else{
                // line aoe tokens
                if(token.options.gridWidth < token.options.gridHeight){
                    // swap them around for styling of a line token
                    // let tempWidth = token.options.gridWidth
                    // token.options.gridWidth = token.options.gridHeight
                    // token.options.gridHeight = tempWidth
                }
                const leftBorder = $(`<div class='aoe-border aoe-border-top aoe-border-basic' ></div>`)
                const rightBorder = $(`<div class='aoe-border aoe-border-bottom aoe-border-basic' ></div>`)
                borders.push(leftBorder, rightBorder)
            }
        }
        tokenImageContainer.append(tokenImage)
        tokenImageContainer.append([...borders])
    return tokenImageContainer
}