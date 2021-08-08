var altHeld = false;
var ctrlHeld = false;
var shiftHeld = false;
var savedSnapState;


function init_keypress_handler(){


Mousetrap.bind('c', function () {       //combat tracker
        $('#combat_button').click()
});


Mousetrap.bind('d', function () {       //draw menu
    if (window.DM){
        $('#draw_button').click()
    }
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

Mousetrap.bind('-', function () {       //zoom minus
    $('#zoom_minus').click()
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
    $(".top_menu").removeClass('visible');
    $("#fog_overlay").css("z-index", "20");
    $('#select-button').click();
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
    if (ctrlHeld) {
        return;
    } else {
        ctrlHeld = true;
    }
    savedSnapState = window.CURRENT_SCENE_DATA.snap; 
    window.CURRENT_SCENE_DATA.snap = (savedSnapState == 0 ? 1 : 0);
}, 'keydown');

Mousetrap.bind('ctrl', function () {
    window.CURRENT_SCENE_DATA.snap = (window.CURRENT_SCENE_DATA.snap == 0 ? 1 : 0);
    ctrlHeld = false;
}, 'keyup');

Mousetrap.bind('shift+h', function () {
    $('#scene_selector_toggle, #combat_button, #measure-button, #fog_button, #draw_button, #select-button, #zoom_buttons, #hide_rightpanel').toggle();
    $("button:contains('CONNECT VIDEO')").toggle();
});

}