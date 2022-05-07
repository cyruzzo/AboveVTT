var altHeld = false;
var ctrlHeld = false;
var shiftHeld = false;
var toggleSnap=false;

function unhide_interface() {
    if ($('#hide_interface_button').hasClass('unhidden')) {
        $('#hide_interface_button').hide().removeClass('unhidden');
        $('.hideable').show();
        $(".dice-toolbar").show();
    } else {
        if ($('#hide_rightpanel').hasClass('point-right')) {
            $('#hide_rightpanel').click();
        }
        if (is_characters_page()) {
            hide_player_sheet();
        }
        $(".dice-toolbar").hide();
        $('#hide_interface_button').show().addClass('unhidden');
        $('.hideable').hide();
    }
}

function init_keypress_handler(){


Mousetrap.bind('c', function () {       //combat tracker
        $('#combat_button').click()
});


Mousetrap.bind('d', function () {       //draw menu
    if (window.DM){
        $('#draw_button').click()
    }
});

Mousetrap.bind('a', function () {       //aoe menu
    $('#aoe_button').click()
    return false;
});

Mousetrap.bind('f', function () {       //fog menu
    if (window.DM){
        $('#fog_button').click()
    }
});


Mousetrap.bind('n', function () {   //while combat menu is open, press n to cycle next in initiative order
    if(window.DM && $('#combat_tracker_inside').attr('style') == 'display: block;') {
        $('#combat_next_button').click()
    }
});

Mousetrap.bind('r', function () {       //ruler
    $('#measure-button').click()
});


Mousetrap.bind('s', function () {       //video fullscreen toggle
    $('#select-button').click()
});


Mousetrap.bind('v', function () {       //video fullscreen toggle
    $('#jitsi_switch').click()
});

Mousetrap.bind('=', function () {       //zoom plus
    $('#zoom_plus').click()
});

Mousetrap.bind('+', function () {       //zoom plus
    $('#zoom_plus').click()
});

Mousetrap.bind('-', function () {       //zoom minus
    $('#zoom_minus').click()
});

Mousetrap.bind('0', function () {
    $('#zoom_fit').click()
});

Mousetrap.bind('space', function (e) {     //collapse/show character sheet
	e.preventDefault();
    if(!window.DM) {
        $('#sheet_button').click()
    }
});


Mousetrap.bind('q', function () {       //collapse/show sidebar. (q is next to tab, also used to show/hide elements)
    $('#hide_rightpanel').click()
});

Mousetrap.bind('esc', function () {     //deselect all buttons
    stop_drawing();
    $(".drawbutton").removeClass('button-enabled button-selected');
    $(".drawbutton").removeClass('ddbc-tab-options__header-heading--is-active');
    $(".top_menu").removeClass('visible');
    $("#fog_overlay").css("z-index", "20");
    $('#select-button').click();
    $("#tokenOptionsClickCloseDiv").click();
});



//menu specific shortcuts, select the nth element of menu when it's open
Mousetrap.bind('1', function () {
    if ($("#fog_menu").hasClass('visible')) {
        $("#fog_menu .menu-option:eq(0)").click()
    }
    if ($("#draw_menu").hasClass('visible')) {
        $("#draw_menu .menu-option:eq(0)").click()
    }
});

Mousetrap.bind('2', function () {
    if ($("#fog_menu").hasClass('visible')) {
        $("#fog_menu .menu-option:eq(1)").click()
    }
    if ($("#draw_menu").hasClass('visible')) {
        $("#draw_menu .menu-option:eq(1)").click()
    }
});

Mousetrap.bind('3', function () {
    if ($("#fog_menu").hasClass('visible')) {
        $("#fog_menu .menu-option:eq(2)").click()
    }
    if ($("#draw_menu").hasClass('visible')) {
        $("#draw_menu .menu-option:eq(2)").click()
    }
});

Mousetrap.bind('4', function () {
    if ($("#fog_menu").hasClass('visible')) {
        $("#fog_menu .menu-option:eq(3)").click()
    }
    if ($("#draw_menu").hasClass('visible')) {
        $("#draw_menu .menu-option:eq(3)").click()
    }
});

Mousetrap.bind('5', function () {
    if ($("#fog_menu").hasClass('visible')) {
        $("#fog_menu .menu-option:eq(4)").click()
    }
    if ($("#draw_menu").hasClass('visible')) {
        $("#draw_menu .menu-option:eq(4)").click()
    }
});

Mousetrap.bind('6', function () {
    if ($("#fog_menu").hasClass('visible')) {
        $("#fog_menu .menu-option:eq(5)").click()
    }
    if ($("#draw_menu").hasClass('visible')) {
        $("#draw_menu .menu-option:eq(5)").click()
    }
});

Mousetrap.bind('up', function () {
    if ($("#fog_menu").hasClass('visible')) {
        $("#fog_menu .remembered-selection").parent().prevAll('div').children('.menu-option:first').click()
        return false;
    }
    if ($("#draw_menu").hasClass('visible')) {
        $("#draw_menu .remembered-selection").parent().prevAll('div').children('.menu-option:first').click()
        return false;
    }
    if ($("#aoe_menu").hasClass('visible')) {
        if ($(".aoeshape").is(":focus")) {
            $("#aoe_menu .aoeshape:focus").parent().prevAll('div').children('.aoeshape:first').focus();
        } else {
            $("#aoe_menu .remembered-selection").parent().prevAll('div').children('.menu-option:first').click();
        }
        return false;
    }
    if ($("#select-button").hasClass("button-enabled") || !window.DM) {
        for (let i = 0; i < window.CURRENTLY_SELECTED_TOKENS.length; i++) {
            let id = window.CURRENTLY_SELECTED_TOKENS[i];
            let token = window.TOKEN_OBJECTS[id];
            token.moveUp();
        }
        return false;
    }
});

Mousetrap.bind('down', function () {
    if ($("#fog_menu").hasClass('visible')) {
        $("#fog_menu .remembered-selection").parent().nextAll('div').children('.menu-option:first').click()
        return false;
    }
    if ($("#draw_menu").hasClass('visible')) {
        $("#draw_menu .remembered-selection").parent().nextAll('div').children('.menu-option:first').click()
        return false;
    }
    if ($("#aoe_menu").hasClass('visible')) {
        if ($(".aoeshape").is(":focus")) {
            $("#aoe_menu .aoeshape:focus").parent().nextAll('div').children('.aoeshape:first').focus();
        } else {
            $("#aoe_menu .remembered-selection").parent().nextAll('div').children('.menu-option:first').click();
        }
        return false;
    }
    if ($("#select-button").hasClass("button-enabled") || !window.DM) {
        for (let i = 0; i < window.CURRENTLY_SELECTED_TOKENS.length; i++) {
            let id = window.CURRENTLY_SELECTED_TOKENS[i];
            let token = window.TOKEN_OBJECTS[id];
            token.moveDown();
        }
        return false;
    }
});

Mousetrap.bind('tab', function () {
    if ($("#aoe_menu").hasClass('visible')) {
        if ($(".aoeshape").is(":focus")) {
            $("#aoe_feet").focus();
        } else {
            $(".aoeshape").first().focus();
        }
        return false;
    }
});

Mousetrap.bind('shift+tab', function () {
    if ($("#aoe_menu").hasClass('visible')) {
        if ($(".aoeshape").is(":focus")) {
            $(".aoeshape").blur();
        } else {
            $("#aoe_feet").focus();
        }
        return false;
    }
});

Mousetrap.bind('left', function () {
    if ($("#select-button").hasClass("button-enabled") || !window.DM) {
        for (let i = 0; i < window.CURRENTLY_SELECTED_TOKENS.length; i++) {
            let id = window.CURRENTLY_SELECTED_TOKENS[i];
            let token = window.TOKEN_OBJECTS[id];
            token.moveLeft();
        }
        return false;
    }
});

Mousetrap.bind('right', function () {
    if ($("#select-button").hasClass("button-enabled") || !window.DM) {
        for (let i = 0; i < window.CURRENTLY_SELECTED_TOKENS.length; i++) {
            let id = window.CURRENTLY_SELECTED_TOKENS[i];
            let token = window.TOKEN_OBJECTS[id];
            token.moveRight();
        }
        return false;
    }
});

Mousetrap.bind('alt', function () {
    if (altHeld) {
        return;
    } else {
        altHeld = true;
    }
    if (!($('#measure-button').hasClass('button-enabled'))) {
        $('#measure-button').click()
    }
}, 'keydown');

Mousetrap.bind('alt', function () {
    if ($('#measure-button').hasClass('button-enabled')) {
        $('#measure-button').click()
    }
    altHeld = false;
}, 'keyup');



Mousetrap.bind('shift', function () {
    if (shiftHeld == true) {
        return;
    } else {
        shiftHeld = true;
    }
}, 'keydown');

Mousetrap.bind('shift', function () {
    shiftHeld = false;
}, 'keyup');


Mousetrap.bind('ctrl', function () {
	ctrlHeld=true;
	window.toggleSnap=true;
}, 'keydown');

Mousetrap.bind('ctrl', function () {
	ctrlHeld=false;
	window.toggleSnap=false;
}, 'keyup');

Mousetrap.bind('shift+h', function () {
    unhide_interface();
});

Mousetrap.bind('ctrl+c', function(e) {
    if (window.navigator.userAgent.indexOf("Mac") != -1) return; // Mac/iOS use command
    copy_selected_tokens();
});
Mousetrap.bind('command+c', function(e) {
    copy_selected_tokens();
});

Mousetrap.bind('ctrl+v', function(e) {
    if (window.navigator.userAgent.indexOf("Mac") != -1) return; // Mac/iOS use command
    paste_selected_tokens();
});
Mousetrap.bind('command+v', function(e) {
    paste_selected_tokens();
});

Mousetrap.bind(['backspace', 'del'], function(e) {
    delete_selected_tokens();
});
Mousetrap.bind('ctrl+z', function(e) {
    if (window.navigator.userAgent.indexOf("Mac") != -1) return; // Mac/iOS use command
    if (Object.keys(window.TOKEN_OBJECTS_RECENTLY_DELETED).length != 0) {
        undo_delete_tokens();
    }
});
Mousetrap.bind('command+z', function(e) {
    if (Object.keys(window.TOKEN_OBJECTS_RECENTLY_DELETED).length != 0) {
        undo_delete_tokens();
    }
});

var rotationKeyPresses = [];
window.addEventListener("keydown", async (event) => {
    const arrowKeys = [ 'ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown' ];
    if (event.shiftKey && arrowKeys.includes(event.key) ) {
        rotationKeyPresses.push(event.key)
    }
});
window.addEventListener("keyup", async (event) => {
    if (!event.shiftKey) {
        rotationKeyPresses = [];
        return;
    }
    if (rotationKeyPresses.includes('ArrowDown') && rotationKeyPresses.includes('ArrowLeft')) {
        rotate_selected_tokens(45, true);
    } else if (rotationKeyPresses.includes('ArrowLeft') && rotationKeyPresses.includes('ArrowUp')) {
        rotate_selected_tokens(135, true);
    } else if (rotationKeyPresses.includes('ArrowUp') && rotationKeyPresses.includes('ArrowRight')) {
        rotate_selected_tokens(225, true);
    } else if (rotationKeyPresses.includes('ArrowRight') && rotationKeyPresses.includes('ArrowDown')) {
        rotate_selected_tokens(315, true);
    } else if (rotationKeyPresses.includes('ArrowDown')) {
        rotate_selected_tokens(0, true);
    } else if (rotationKeyPresses.includes('ArrowLeft')) {
        rotate_selected_tokens(90, true);
    } else if (rotationKeyPresses.includes('ArrowUp')) {
        rotate_selected_tokens(180, true);
    } else if (rotationKeyPresses.includes('ArrowRight')) {
        rotate_selected_tokens(270, true);
    }

    rotationKeyPresses = [];
});

}