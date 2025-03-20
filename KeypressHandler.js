let altHeld = false;
let ctrlHeld = false;
let shiftHeld = false;
let cursor_x = -1;
let cursor_y = -1;
let arrowKeysHeld = [0, 0, 0, 0];

const sb_scroll_style = "avtt-scroll-hidden"
function hide_scrollbar() {
    if (!document.getElementById(sb_scroll_style)) {
        const style = document.createElement("style");
        style.id = sb_scroll_style
        style.textContent = `
    body::-webkit-scrollbar {
        width: 0px;
        height: 0px;
    }
    body::-webkit-scrollbar-track {
        background: transparent !important;
    }
    body::-webkit-scrollbar-thumb {
        background-color: transparent;
        border-radius: 6px;
        border: none;
    }
    body::-webkit-scrollbar-corner {
        background: transparent;
    }
    .sidebar__pane-content {
        box-shadow: none;
    }
    html {
        scrollbar-width: none;
    }
        `;
        document.head.appendChild(style);
    }
}
function allow_scrollbar() {
    e = document.getElementById(sb_scroll_style);
    if(e) e.remove();
}
function hide_or_unhide_scrollbar() {
    if (get_avtt_setting_value("alwaysHideScrollbar")) {
        hide_scrollbar();
    } else {
        allow_scrollbar();        
    }
}
function unhide_interface() {
    if ($('#hide_interface_button').hasClass('unhidden')) {
        $('#hide_interface_button').hide().removeClass('unhidden');
        $('.hideable').show();
        $(".dice-toolbar").css({'visibility': '', 'pointer-events': ''});
        hide_scrollbar();
    } else {
        if ($('#hide_rightpanel').hasClass('point-right')) {
            $('#hide_rightpanel').click();
        }
        if (is_characters_page()) {
            hide_player_sheet();
        }
        $(".dice-toolbar").css({'visibility': 'hidden', 'pointer-events': 'none'});
        $('#hide_interface_button').show().addClass('unhidden');
        $('.hideable').hide();
        if (!get_avtt_setting_value("alwaysHideScrollbar")) {        
            allow_scrollbar();        
        }
    }
}

//for number key binds that aren't enabled yet
function hotkeyDice(nthDice){

    if (!$(".dice-toolbar__dropdown").hasClass("dice-toolbar__dropdown-selected")) {
        $(".dice-toolbar__dropdown-die").click();
    }
    const dieButton = $(`.dice-toolbar__dropdown-top>.dice-die-button:nth-of-type(${8-nthDice})`); 
    if(ctrlHeld){
        dieButton.triggerHandler('contextmenu');
            let element = dieButton[0];
            let e = element.ownerDocument.createEvent('MouseEvents');
            e.initMouseEvent('contextmenu', true, true,
                    element.ownerDocument.defaultView, 1, 0, 0, 0, 0, false,
                    false, false, false, 2, null);
            element.dispatchEvent(e);
    }
    else{
        dieButton.click();
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

Mousetrap.bind('t', function () {       //draw menu
    if (window.DM){
        $('#text_button').click()
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
    $('#ruler_button').click()
});


Mousetrap.bind('s', function () {       //select
    $('#select-button').click()
});

Mousetrap.bind('e', function () {       //elev
    $('#elev_button').click()
});

Mousetrap.bind('v', function () {       //video toggle 
    if(shiftHeld)
        return;

    $('#peerVideo_switch').click()
});

Mousetrap.bind('shift+v', function () {       //check token vision
    if(window.SelectedTokenVision == true && $('#selected_token_vision .ddbc-tab-options__header-heading--is-active').length==0)
        window.SelectedTokenVision = false;
    else
        window.SelectedTokenVision = true;

   redraw_light();
});

Mousetrap.bind('=', function () {       //zoom plus
    if($('.roll-mod-container').hasClass('show'))
        $('.roll-button-mod.plus').click();
    else
        $('#zoom_plus').click()
});

Mousetrap.bind(["1","2","3","4","5","6","7","mod+1","mod+2","mod+3","mod+4","mod+5","mod+6","mod+7",], function (e, combo) {
    e.preventDefault();  
    let numberPressed = parseInt(combo.replace('mod+',''));
    hotkeyDice(numberPressed);
});

Mousetrap.bind("n", function (e) {
    $('#combat_next_button').click();
});
Mousetrap.bind("p", function (e) {
    $('#combat_prev_button').click();
});
/*menu specific shortcuts, select the nth element of menu when it's open
function handle_menu_number_press(e) {
    const visibleMenuId = `#${$('[id*="_menu"].visible').attr("id")}`
    const button = $(`${visibleMenuId} .menu-option:eq(${parseInt(e.key) -1})`)
    $(button).click()
    $(button).children().first().focus()
}
Mousetrap.bind(["1","2","3","4","5","6","7","8","9"], function (e) {
    handle_menu_number_press(e)
});*/

Mousetrap.bind('+', function () {       //zoom plus
    if($('.roll-mod-container').hasClass('show'))
        $('.roll-button-mod.plus').click(); 
    else
        $('#zoom_plus').click()
});

Mousetrap.bind('-', function () {       //zoom minus
    if($('.roll-mod-container').hasClass('show'))
        $('.roll-button-mod.minus').click();
    else
        $('#zoom_minus').click()
});
Mousetrap.bind('enter', function () {       //zoom minus
    if(!$('.roll-mod-container').hasClass('show'))
        return;
    $('.roll-mod-container>.roll-button').click(); 
});

Mousetrap.bind('ctrl+space', function (e) {    
    e.preventDefault();
    $('#combat_area tr[data-current=1] .findTokenCombatButton').click();
});

Mousetrap.bind('0', function () {   
    $('#zoom_fit').click()
});

Mousetrap.bind('space', function (e) {     //collapse/show character sheet
	e.preventDefault();
    if(shiftHeld)
        return;
    if(!window.DM) {
        $('#sheet_button').click()
    }
    else{
        $('#pause_players').click()
    }
});
Mousetrap.bind('shift+space', function (e) {     //collapse/show character sheet
    e.preventDefault();
    if(!window.DM) {
        let tokenId = $(`.token[data-id*='${window.PLAYER_ID}']`).attr('data-id');
        if(tokenId != undefined)
            window.TOKEN_OBJECTS[tokenId].highlight();   
    }
});
Mousetrap.bind('shift+s', function (e) { 
    e.preventDefault();
    if ($('#grid_snap_drawings .ddbc-tab-options__header-heading').hasClass('ddbc-tab-options__header-heading--is-active')) {
        $('#grid_snap_drawings .ddbc-tab-options__header-heading').toggleClass('ddbc-tab-options__header-heading--is-active', false)
        window.toggleDrawingSnap = false;
    } else {
        $('#grid_snap_drawings .ddbc-tab-options__header-heading').toggleClass('ddbc-tab-options__header-heading--is-active', true)
        window.toggleDrawingSnap = true;
    }
});
           

Mousetrap.bind('q', function () {       //collapse/show sidebar. (q is next to tab, also used to show/hide elements)
    $('#hide_rightpanel').click()
});

Mousetrap.bind('w', function () {
    if(shiftHeld)
        return;
    $('#wall_button').click()   
});
Mousetrap.bind('shift+w', function () {
    if(window.DM){
        $('#show_walls').toggleClass(['button-enabled', 'ddbc-tab-options__header-heading--is-active']);
        redraw_light_walls();
    }
       
});
Mousetrap.bind('l', function () {
    if(shiftHeld)
        return;
    $('#vision_button').click()
});
Mousetrap.bind('shift+l', function () {
     if(window.DM){
        $('#select_locked').click();
    }
});

Mousetrap.bind('esc', function () {     //deselect all buttons
    stop_drawing();

    if(!$("#wall_button").hasClass("button-enabled")){
        $('#select-button').click();
    }
    else{
        redraw_light_walls();
    }

    close_token_context_menu();
    $(".draggable-token-creation").addClass("drag-cancelled");
    $(".draggable-sidebar-item-reorder").addClass("drag-cancelled");
    try {
        $( '.ui-draggable-dragging' ).draggable("option", { revert: true }).trigger( 'mouseup' ).draggable("option", {revert: false })
    } catch (whoCares) { }
    let elementPreventingSidebarClose = $(".prevent-sidebar-modal-close");
    if (elementPreventingSidebarClose.length > 0) {
        if (elementPreventingSidebarClose.hasClass("sidebar-flyout") || elementPreventingSidebarClose.closest(".sidebar-flyout").length > 0) {
            // it's a flyout... close it
            elementPreventingSidebarClose.remove();
        }
        // any others that we want to close on esc?
    } else {
        // only close the sidebar if there isn't something on the screen explicitly trying to keep it open
        close_sidebar_modal();
    }
    remove_tooltip();
    removeError();
});


const moveLoop = function(callback = function(){}){
    for (let i = 0; i < window.CURRENTLY_SELECTED_TOKENS.length; i++) {
        let id = window.CURRENTLY_SELECTED_TOKENS[i];
        let token = window.TOKEN_OBJECTS[id];
        callback(token);
    }
    return true;
}

//Throttle so the token doesn't immediately fly off map if button is held and set trailing only we can register diagonal movement as 1 move.
const throttleMoveRequest = throttle(() => {
    requestAnimationFrame(moveKeyWatch);
}, 5, {leading: false, trailing: true})


//setTimeout so we can be sure diagonal key combos are pressed or not.
function moveKeyWatch() {
    if (arrowKeysHeld[0] && arrowKeysHeld[2]) {
        moveLoop(function(token){token.moveUpLeft()});
    } 
    else if (arrowKeysHeld[0] && arrowKeysHeld[3]) {
       moveLoop(function(token){token.moveUpRight()});
    } 
    else if (arrowKeysHeld[1] && arrowKeysHeld[2]) {
       moveLoop(function(token){token.moveDownLeft()});
    } 
    else if (arrowKeysHeld[1] && arrowKeysHeld[3]) {
       moveLoop(function(token){token.moveDownRight()});
    } 
    else if (arrowKeysHeld[0]) {
       moveLoop(function(token){token.moveUp()});
    } 
    else if (arrowKeysHeld[1]) {
       moveLoop(function(token){token.moveDown()});
    }
    else if (arrowKeysHeld[2]) {
      moveLoop(function(token){token.moveLeft()});
    }
    else if (arrowKeysHeld[3]) {
       moveLoop(function(token){token.moveRight()});
    }  
}


Mousetrap.bind('up', function (e) {
    arrowKeysHeld[0] = 1;
    const visibleMenuId = `#${$('[id*="_menu"].visible').attr("id")}`
    if (visibleMenuId){
        // prevent scrolling the window
        e.preventDefault();
        $(`${visibleMenuId} .ddbc-tab-options__header-heading--is-active`).first().parent().prevAll().not("[data-skip='true']").first().children().first().click()
    }
    throttleMoveRequest();
}, 'keydown');
Mousetrap.bind('down', function (e) {
    arrowKeysHeld[1] = 1;
    const visibleMenuId = `#${$('[id*="_menu"].visible').attr("id")}`
    if (visibleMenuId){
        // prevent scrolling the window
        e.preventDefault();
        $(`${visibleMenuId} .ddbc-tab-options__header-heading--is-active`).first().parent().nextAll().not("[data-skip='true']").first().children().first().click()
    }
    throttleMoveRequest();
}, 'keydown');
Mousetrap.bind('left', function (e) {
    arrowKeysHeld[2] = 1;
    if ($("#select-button").hasClass("button-enabled") || !window.DM) {
        e.preventDefault();
    }
    throttleMoveRequest();
}, 'keydown');
Mousetrap.bind('right', function (e) {
    arrowKeysHeld[3] = 1;
    if ($("#select-button").hasClass("button-enabled") || !window.DM) {
        e.preventDefault();    
    }
    throttleMoveRequest();
}, 'keydown');

Mousetrap.bind('up', function (e) {
    setTimeout(()=>{
     arrowKeysHeld[0] = 0;   
    },50)
}, 'keyup');
Mousetrap.bind('down', function (e) {
    setTimeout(()=>{
     arrowKeysHeld[1] = 0;     
    },50)  
}, 'keyup');
Mousetrap.bind('left', function (e) {
    setTimeout(()=>{
     arrowKeysHeld[2] = 0;     
    },50) 
}, 'keyup');
Mousetrap.bind('right', function (e) {
    setTimeout(()=>{
     arrowKeysHeld[3] = 0;   
    },50)          
}, 'keyup');

Mousetrap.bind('alt', function () {
    if (altHeld) 
        return;
    
    altHeld = true;
    window.selectedMenuButton = $('#VTTWRAPPER ~ .ddbc-tab-options--layout-pill>button.button-enabled')
    if (!($('#ruler_button').hasClass('button-enabled'))) {
        $('#ruler_button').click()
    }

    $(window).off('blur.altCheck').one('blur.altCheck', function(){
      altHeld = false;
        if ($('#ruler_button').hasClass('button-enabled')) {
            window.selectedMenuButton.click()
        }
    })
    return false
}, 'keydown');

Mousetrap.bind('alt', function () {
    if ($('#ruler_button').hasClass('button-enabled')) {
        window.selectedMenuButton.click()
    }
    altHeld = false;
    return false
}, 'keyup');



Mousetrap.bind('shift', function () {
    if (shiftHeld == true) 
        return;
    
    shiftHeld = true;   
    $(window).off('blur.shiftCheck').one('blur.shiftCheck', function(){
      shiftHeld = false;
    })
}, 'keydown');

Mousetrap.bind('shift', function () {
    shiftHeld = false;
}, 'keyup');


Mousetrap.bind('mod', function () {
    if (ctrlHeld == true && window.toggleSnap == true) 
        return;
    
    ctrlHeld=true;
    window.toggleSnap=true;
    $(window).off('blur.ctrlCheck').one('blur.ctrlCheck', function(){
      ctrlHeld = false;
      window.toggleSnap = false;
    })
}, 'keydown');

Mousetrap.bind('mod', function () {
    ctrlHeld=false;
    window.toggleSnap=false;
}, 'keyup');

Mousetrap.bind(['mod+shift', 'shift+mod'], function () {
    ctrlHeld=true;
    shiftHeld=true;
    $(window).off('blur.shiftCheck').one('blur.shiftCheck', function(){
      shiftHeld = false;
    })
    window.toggleSnap=true;
}, 'keydown');



Mousetrap.bind('shift+h', function () {
    unhide_interface();
});

Mousetrap.bind('mod+c', function(e) {
    copy_selected_tokens();
});


Mousetrap.bind('mod+v', function(e) {
    if($('#temp_overlay:hover').length>0){
        paste_selected_tokens(window.cursor_x, window.cursor_y);
    } 
    else {
        let center = center_of_view();
        paste_selected_tokens(center.x, center.y);
    }
});


document.onmousemove = function(event)
{
 window.cursor_x = event.pageX;
 window.cursor_y = event.pageY;
}

Mousetrap.bind(['backspace', 'del'], function(e) {
    delete_selected_tokens();
});
Mousetrap.bind('mod+z', function(e) {
    if($('input:focus').length ==0){
        e.preventDefault();
    }
    handle_undo();
});

Mousetrap.bind(']', function(e) {
    select_next_tab();
});
Mousetrap.bind('[', function(e) {
    select_prev_tab();
});

function handle_undo(){
    const buttonSelectedClasses = "button-enabled ddbc-tab-options__header-heading--is-active"

    if ($("#select-button").hasClass(buttonSelectedClasses)){
        undo_delete_tokens();
    }
    else if(($("#fog_button").hasClass(buttonSelectedClasses))){
        $("#fog_undo").click()
    }
    else if($("#draw_button").hasClass(buttonSelectedClasses)){
        $("#draw_undo").click()
    }
    else if($("#vision_button").hasClass(buttonSelectedClasses)){
        $("#light_undo").click()
    }
    else if(($("#text_button").hasClass(buttonSelectedClasses))){
        $("#text_undo").click()
    }
    else if(($("#wall_button").hasClass(buttonSelectedClasses))){
        $("#wall_undo").click()
    }
    else if(($("#elev_button").hasClass(buttonSelectedClasses))){
        $("#elev_undo").click()
    }

}

let rotationKeyPresses = [];
window.addEventListener("keydown", async (event) => {
    const arrowKeys = [ 'ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown' ];
    if (event.shiftKey && arrowKeys.includes(event.key) ) {
        rotationKeyPresses.push(event.key)
    }
    if((event.ctrlKey || event.metaKey) && event.key == 'a' && event.target.tagName == 'INPUT'){
        event.target.select();
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
