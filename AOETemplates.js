function setup_aoe_button() {
    const availableStyle = [
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