
// Lines are not supported yet
const AOE_TEMPLATES = {
    'dark-circle': 'https://drive.google.com/file/d/1XmBXPCjN-FIqujF_1S9kBSbtNAL3Rpap/view?usp=sharing',
    'dark-cone': 'https://drive.google.com/file/d/164YeP9QAXkjc6IdAAviBYCu_n2mOPu4k/view?usp=sharing',
    //'dark-line': 'https://drive.google.com/file/d/16G3T1cdyrOkn3TYrol855yXtR122VkTe/view?usp=sharing',
    'dark-square': 'https://drive.google.com/file/d/1vYvUx6Lp6IkYLirYK2Z3TeGQRG-T8oAF/view?usp=sharing',
    'default-circle': 'https://drive.google.com/file/d/1x9WpNCQO95mJSHFGXC8K29B4x_qFmdbn/view?usp=sharing',
    'default-cone': 'https://drive.google.com/file/d/1kp9rS0QNwX9KE8PxuunwjV_rKwfcYmhN/view?usp=sharing',
    //'default-line': 'https://drive.google.com/file/d/1GfstCLPWsIpZ8wz8O1MVv0658XlM0i2p/view?usp=sharing',
    'default-square': 'https://drive.google.com/file/d/1Mn1HWAn6ZekqBmaio1IN5UkzX6zv1Vm8/view?usp=sharing',
    'fire-circle': 'https://drive.google.com/file/d/18OaIupHGba1j9GwpNL2b9om9iZUga-Ld/view?usp=sharing',
    'fire-cone': 'https://drive.google.com/file/d/1ApVI2b3L8K_nGe8Qvc_KN9sHwTBJQmRo/view?usp=sharing',
    //'fire-line': 'https://drive.google.com/file/d/1TEyhC5c_syyY_gnfB2fIFZK6djdWw9qg/view?usp=sharing',
    'fire-square': 'https://drive.google.com/file/d/1kpOykZzXzWGCM00_qlqgCu5Q-5bvGcLi/view?usp=sharing',
    'green-circle': 'https://drive.google.com/file/d/14TIQ9qJ2El9M_k8D2basime7xKrog3dk/view?usp=sharing',
    'green-cone': 'https://drive.google.com/file/d/1si0aJ66D7zFnYx_-UPN2hva_xSGtbUt4/view?usp=sharing',
    //'green-line': 'https://drive.google.com/file/d/1LNIBQAMJhrjFaOJk-iPioaUaFFvX3EUP/view?usp=sharing',
    'green-square': 'https://drive.google.com/file/d/1vv_sDY7-bahgVbu-bDGrHCZnnJFA7aPD/view?usp=sharing',
}

function setup_aoe_button() {
    aoe_button = $("<button style='display:inline;width:75px' id='aoe_button' class='drawbutton menu-button hideable'><u>A</u>OE</button>");
    aoe_menu = $("<div id='aoe_menu' class='top_menu'></div>");

    aoe_menu.append("<div style='font-weight:bold'>Feet</div>");
    aoe_menu.append("<div><input id='aoe_size' style='width:75px;margin:0px;text-align:center' maxlength='10'></div>");

    aoe_menu.append("<div style='font-weight:bold'>Color</div>");
    aoe_menu.append("<div><button id='aoe_default' class='drawbutton menu-option aoe-option aoecolor remembered-selection' style='width:75px'>Default</button></div>");
    aoe_menu.append("<div><button id='aoe_fire' class='drawbutton menu-option aoe-option aoecolor' style='width:75px'>Fire</button></div>");
    aoe_menu.append("<div><button id='aoe_dark' class='drawbutton menu-option aoe-option aoecolor' style='width:75px'>Dark</button></div>");
    aoe_menu.append("<div><button id='aoe_green' class='drawbutton menu-option aoe-option aoecolor' style='width:75px'>Green</button></div>");

    aoe_menu.append("<div style='font-weight:bold'>Shape</div>");
    aoe_menu.append("<div><button id='aoe_cone' class='aoeshape' style='width:75px'>Cone</button></div>");
    aoe_menu.append("<div><button id='aoe_square' class='aoeshape' style='width:75px'>Square</button></div>");
    aoe_menu.append("<div><button id='aoe_circle'class='aoeshape' style='width:75px'>Circle</button></div>");

    aoe_menu.css("position", "fixed");
    aoe_menu.css("top", "25px");
    aoe_menu.css("width", "75px");
    aoe_menu.css('background', "url('/content/1-0-1487-0/skins/waterdeep/images/mon-summary/paper-texture.png')");

    $("body").append(aoe_menu);

    if (window.DM) {
        buttons.append(aoe_button);
        aoe_menu.css("left", aoe_button.position().left);
    }

    $("#aoe_size").keydown(function(e) {
        if (e.key === "Escape") {
            $('#select-button').click();
        }
    });

    $(".aoeshape").click(function (e) {
        const color = $(".aoe-option.remembered-selection").attr('id').split('_')[1];
        const shape = this.id.split("_")[1];
        let size = Math.round(window.CURRENT_SCENE_DATA.hpps * (document.getElementById("aoe_size").value / window.CURRENT_SCENE_DATA.fpsq));

        // don't create a token if the size is 0
        if (size == 0) {
            return;
        }

        // circles are always by radius
        if (shape == 'circle') {
            size = size * 2;
        }

        const atts = {
            'data-disablestat': true,
            'data-hidestat': true,
            'data-disableborder': true,
            'data-square': 1,
            'data-img': AOE_TEMPLATES[`${color}-${shape}`],
            'data-size': size,
        };
        $(this).attr(atts);
        token_button(e);
        $(this).removeAttr(Object.keys(atts).join(' '));
        $('#select-button').click();
    });
}
