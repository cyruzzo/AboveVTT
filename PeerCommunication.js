/* PeerCommunication.js - Game logic for communicating with peers */

//#region helper functions

/** a convenience function that stores peer preferences and creates window.PEER_PREFERENCES if it doesn't already exist
 * @param {object} preferences a {@link PeerEvent.preferencesChange} event */
function store_peer_preferences(preferences) {
  if (!window.PEER_PREFERENCES) {
    window.PEER_PREFERENCES = {};
  }
  window.PEER_PREFERENCES[preferences.playerId] = preferences;
}

/** Logs that are super noisy should be sent through here.
 * This allows us to enable these logs on the fly when we need to debug things that would otherwise flood the console */
function noisy_log(...message) {
  if (window.enableNoisyLogs === true) {
    console.debug(...message);
  }
}

function is_peer_connected(playerId) {
  if (!playerId) return false;
  return !!window.PeerManager?.connectedPlayerIds?.includes(playerId.toString());
}

//#endregion helper functions

//#region PeerEvent declaration and documentation

/** The various events that can be sent/received via window.PeerManager.send
 * these are static string declarations to avoid typos */
class PeerEventType {
  static hello = "hello";
  static goodbye = "goodbye";
  static cursor = "cursor";
  static preferencesChange = "preferencesChange"; // we send the current color in cursor events, but we don't want to add extra processing of those events because they're very numerous
}

/** Documented constructors for objects that get sent through PeerManager */
class PeerEvent {

  /** A message that helps identify ourselves to other peers
   * This message is sent directly to the peer we connected to as soon as a connection is opened.
   * {@link peer_connected} */
  static hello() {
    return {
      message: PeerEventType.hello,
      peerId: window.PeerManager.peer.id,
      playerId: my_player_id(),
      color: window.color
    };
  }

  /** A message that helps others know that we disconnected.
   * This message is sent to all peers before the page closes from {@link window.onbeforeunload} and {@link disable_peer_manager}
   * When this message is received any connections to the peer are closed and cleaned up in {@link peer_said_goodbye} */
  static goodbye() {
    return {
      message: PeerEventType.goodbye,
      peerId: window.PeerManager.peer.id,
      playerId: my_player_id()
    };
  }

  /** A message that shares our cursor position with all other peers that is sent from {@link sendCursorPositionToPeers}
   * When this message is received, we update the location of that players cursor on our screen from {@link update_peer_cursor}
   * This is enabled/disabled using {@link start_sending_cursor_to_peers} and {@link stop_sending_cursor_to_peers}
   * Users can enable/disable this from the settings sidebar panel
   * This event includes color data which is only used to update the cursor element.
   * We neither use this color for anything, nor pull this data from anywhere because we want to limit the amount of processing this event causes.
   * This event is very chatty so we want to keep processing of this event to a minimum.
   * @param {number} mouseX the x coordinate of the cursor position
   * @param {number} mouseY the y coordinate of the cursor position
   * @param {string|undefined} draggedTokenId the id of the token object being dragged; undefined if not being dragged
   * @param {boolean|undefined} includeRuler true if we should send WaypointManager.coords along with the event */
  static cursor(mouseX, mouseY, draggedTokenId, includeRuler) {
    return {
      message: PeerEventType.cursor,
      playerId: my_player_id(),
      x: mouseX,
      y: mouseY,
      color: window.color,
      sceneId: window.CURRENT_SCENE_DATA ? window.CURRENT_SCENE_DATA.id : "",
      coords: includeRuler === true ? WaypointManager.coords : [],
      tokenId: typeof draggedTokenId === "string" ? draggedTokenId : ""
    };
  }

  /** A message that tells other peers that we've changed preferences.
   * This message is sent when we change our color so others know what color to display when representing us
   * This message is sent when we enable/disable cursor events so others know whether they should send cursor events to us
   * When this message is received, the online indicator in the players panel is updated from {@link peer_changed_preferences}
   * Even though, the {@link cursor} event includes color data, we don't
   */
  static preferencesChange() {
    return {
      message: PeerEventType.preferencesChange,
      peerId: window.PeerManager.peer.id,
      playerId: my_player_id(),
      color: window.color,
      receiveCursorFromPeers: get_avtt_setting_value("receiveCursorFromPeers"),
      receiveRulerFromPeers: get_avtt_setting_value("receiveRulerFromPeers")
    };
  }
}

//#endregion PeerEvent declaration and documentation

//#region PeerManager event handling

/** Every time PeerManager receives an event on a connection, it sends it here to be handled. Nothing else should call this function */
function handle_peer_event(eventData) {
  try {
    noisy_log("handle_peer_event", eventData);
    switch (eventData.message) {
      case PeerEventType.cursor:            handle_peer_cursor_event(eventData); break;
      case PeerEventType.goodbye:           peer_said_goodbye(eventData); break;
      case PeerEventType.hello:             peer_said_hello(eventData); break;
      case PeerEventType.preferencesChange: peer_changed_preferences(eventData); break;
      default: console.debug("handle_peer_event is ignoring event", eventData); // using console.debug because we don't want to spam the console with warning or errors.
    }
  } catch (error) {
    // using console.debug because we don't want to spam the console with warnings or errors
    console.debug("handle_peer_event failed to handle event", eventData, error);
  }
}

//#endregion PeerManager event handling

//#region PeerManager connect/disconnect logic

function configure_peer_manager_from_settings() {
  console.log("configure_peer_manager_from_settings")
  // configure the cursor/ruler settings first
  const cursorSettings = get_avtt_setting_value("receiveCursorFromPeers");
  local_peer_setting_changed("receiveCursorFromPeers", cursorSettings)
  const rulerSettings = get_avtt_setting_value("receiveRulerFromPeers");
  local_peer_setting_changed("receiveRulerFromPeers", rulerSettings)
  // then enable or disable the PeerManager
  const enabled = get_avtt_setting_value("peerStreaming");
  local_peer_setting_changed("peerStreaming", enabled);
}

function local_peer_setting_changed(settingName, newValue) {
  switch (settingName) {
    case "peerStreaming":
      if (newValue === true) {
        enable_peer_manager();
      } else {
        disable_peer_manager();
        return; // don't send our preferences. We're done.
      }
      break;
    case "receiveCursorFromPeers":
      window.receiveCursorFromPeers = newValue; // faster access to our own settings
      break;
    case "receiveRulerFromPeers":
      window.receiveRulerFromPeers = newValue; // faster access to our own settings
      break;
  }
  window.PeerManager.send(PeerEvent.preferencesChange());
}

/** show/hide settings UI based as needed
 * @param {boolean} peerStreamingValue the value of the "peerStreaming" setting */
function toggle_peer_settings_visibility(peerStreamingValue) {
  if (peerStreamingValue) {
    $(`.token-image-modal-footer-select-wrapper[data-option-name="receiveCursorFromPeers"]`).show();
    $(`.token-image-modal-footer-select-wrapper[data-option-name="receiveRulerFromPeers"]`).show();
    $("#cursor_ruler_toggle").css("display", "block");
  } else {
    $(`.token-image-modal-footer-select-wrapper[data-option-name="receiveCursorFromPeers"]`).hide();
    $(`.token-image-modal-footer-select-wrapper[data-option-name="receiveRulerFromPeers"]`).hide();
    $("#cursor_ruler_toggle").css("display", "none");
  }
}

/** Enables the PeerManager once it is ready, then calls {@link PeerManager.readyToConnect} */
function enable_peer_manager() {
  if (!window.PeerManager.peer.id) {
    // peerjs does not have a peer.id when it's constructed. Wait for peerjs to be ready
    if (!window.peerTimeout) {
      window.peerTimeout = 1;
    } else {
      window.peerTimeout += 1; // wait a little longer each time so we don't just hammer it
    }
    console.log(`enable_peer_manager no peer id yet. Trying again in ${window.peerTimeout} seconds`);
    setTimeout(function() {
      enable_peer_manager()
    }, window.peerTimeout * 1000);
    return;
  }
  delete window.peerTimeout; // we're ready to go. We no longer need this hanging around;

  console.log("enable_peer_manager starting");

  window.PeerManager.enabled = true;
  window.PeerManager.readyToConnect();

  try {
    // any game logic that needs to be set up for peer communication should go in this try/catch block.

    // update our online indicator
    update_player_online_indicator(my_player_id(), true, window.color);

    // make sure we're ready to handle other peer cursors and rulers
    init_peer_fade_functions();
    window.PEER_TOKEN_DRAGGING = {};
    window.receiveCursorFromPeers = get_avtt_setting_value("receiveCursorFromPeers");
    window.receiveRulerFromPeers = get_avtt_setting_value("receiveRulerFromPeers");

    // start observing out cursor position and send it to all connected peers
    start_sending_cursor_to_peers();

  } catch (error) {
    console.warn("enable_peer_manager caught", error);
  }
}

/** Disconnects all connections, and disables the PeerManager */
function disable_peer_manager() {
  console.log("disable_peer_manager");
  try {
    // Any game logic that needs to be cleaned up before disconnecting should go in this try/catch. It may be overkill, but we definitely want the disconnect logic to execute no matter what happens here.

    stop_sending_cursor_to_peers();

  } catch (error) {
    console.warn("disable_peer_manager failed to clean up before disconnecting", error);
  }

  // let everyone know we're leaving so they can quickly clean up their side
  window.PeerManager.send(PeerEvent.goodbye());
  window.PeerManager.disconnectAllPeers();
  window.PeerManager.enabled = false;
}

/** when we receive catastrophic errors, we need to tear down and rebuild PeerManager */
function rebuild_peerManager() {
  //DO NOT REBUILD - CAUSES MESSAGE SPAM through websocket
  // Can maybe add limited retries.
  return;
  /*
    console.log("rebuild_peerManager starting");
    disable_peer_manager();
    window.PeerManager.tearDown();
    window.PeerManager = new PeerManager();
    enable_peer_manager();
    console.log("rebuild_peerManager finished");
  */
}

/** Called when a new connection is opened
 * @param {string} peerId the id of the peerjs peer that we connected to
 * @param {string} playerId the id of the DDB player that we connected to */
function peer_connected(peerId, playerId) {
  console.log("peer_connected", peerId, playerId);
  try {
    // We just connected to this peer. Let's send them any data that they need right away

    // Say hello to them.
    window.PeerManager.sendToPeer(peerId, PeerEvent.hello());

    // let them know our preferences
    window.PeerManager.sendToPeer(peerId, PeerEvent.preferencesChange());

    init_peer_fade_function(playerId);

  } catch (error) {
    console.warn("peer_connected caught an error", error);
  }
}

/** Called when a connection to a peer was closed
 * @param {string} peerId the id of the peerjs peer that we disconnected from
 * @param {string} playerId the id of the DDB player that we disconnected from */
function peer_disconnected(peerId, playerId) {
  console.log("peer_disconnected", peerId, playerId);
  try {
    // update online indicator
    update_player_online_indicator(playerId, false, "gray");
  } catch (error) {
    console.warn("peer_disconnected caught an error", error);
  }
}

//#endregion PeerManager connect/disconnect logic

//#region game logic

var peer_animation_timout = 20;

/** Set this to true to avoid sending cursor events and ruler events at the same time
 * Don't forget to unpause it */
var pauseCursorEventListener = false;

/** used by {@link start_sending_cursor_to_peers} to avoid doubling up on even listeners */
var isTrackingCursor = false;

/** adds an event listener that calls {@link sendCursorPositionToPeers} */
function start_sending_cursor_to_peers() {
  if (isTrackingCursor) {
    return;
  }
  isTrackingCursor = true;
  window.PeerManager.send(PeerEvent.preferencesChange()) // this includes isTrackingCursor
  console.log("start_sending_cursor_to_peers");
  addEventListener('mousemove', sendCursorPositionToPeers);
}

/** removes the event listener that calls {@link sendCursorPositionToPeers} */
function stop_sending_cursor_to_peers() {
  console.log("stop_sending_cursor_to_peers");
  removeEventListener('mousemove', sendCursorPositionToPeers);
  isTrackingCursor = false;
  window.PeerManager.send(PeerEvent.preferencesChange())
}

/** called when we receive a {@link PeerEvent.hello} event */
function peer_said_hello(eventData) {
  console.debug("peer_said_hello", eventData);
  update_player_online_indicator(eventData.playerId, true, eventData.color);
  window.PeerManager.send(PeerEvent.preferencesChange())
}

/** called when we receive a {@link PeerEvent.goodbye} event */
function peer_said_goodbye(eventData) {
  console.debug("peer_said_goodbye", eventData);
  window.PeerManager.disconnectFromPeer(eventData.peerId)
  update_player_online_indicator(eventData.playerId, false, undefined);
}

/** called when we receive a {@link PeerEvent.preferencesChange} event */
function peer_changed_preferences(eventData) {
  console.debug("peer_changed_preferences", eventData);

  store_peer_preferences(eventData);

  switch (eventData.receiveCursorFromPeers) {
    case "all":
      window.PeerManager.removeFromSkipCursorEvents(eventData.playerId);
      break;
    case "none":
      window.PeerManager.addToSkipCursorEvents(eventData.playerId);
      break;
    case "dm":
      if (window.DM) {
        window.PeerManager.removeFromSkipCursorEvents(eventData.playerId);
      } else {
        window.PeerManager.addToSkipCursorEvents(eventData.playerId);
      }
      break;
    case "combatTurn":
      // do we need to check current combat tracker, and call combat_tracker_updated?
      break;
  }
  switch (eventData.receiveRulerFromPeers) {
    case "all":
      window.PeerManager.removeFromSkipRulerEvents(eventData.playerId);
      break;
    case "none":
      window.PeerManager.addToSkipRulerEvents(eventData.playerId);
      break;
    case "dm":
      if (window.DM) {
        window.PeerManager.removeFromSkipRulerEvents(eventData.playerId);
      } else {
        window.PeerManager.addToSkipRulerEvents(eventData.playerId);
      }
      break;
    case "combatTurn":
      // do we need to check current combat tracker, and call combat_tracker_updated?
      break;
  }

  let ruler = get_peer_waypoint_manager(eventData.playerId);
  if (ruler) {
    ruler.drawStyle.color = eventData.color;
  }

  update_player_online_indicator(eventData.playerId, true, eventData.color);
}

/** updates the online indicator in the tokens panel, and call {@link update_old_player_card} to update the online indicator in the players panel if necessary
 * @param {string} playerId the DDB id of the player
 * @param {boolean} isConnected true if the player is connected, else false
 * @param {string} peerColor a valid CSS color string that represents the player, defaults to gray which indicates offline */
function update_player_online_indicator(playerId, isConnected, peerColor) {
  const color = peerColor ? peerColor : "gray";
  const pc = find_pc_by_player_id(playerId, false);
  console.debug("update_player_online_indicator", playerId, isConnected, color, pc);
  if (pc) {
    if (window.DM) {
      const playerListItem = window.tokenListItems.find(li => li.type === ItemType.PC && li.id === pc.sheet);
      const rowHtml = find_html_row(playerListItem, tokensPanel.body);
      if (rowHtml) {
        rowHtml.css("--player-border-color",  color);
        if (isConnected) {
          rowHtml.addClass("peerConnected");
        } else {
          rowHtml.removeClass("peerConnected");
        }
      }
    } else {
      update_old_player_card(playerId, isConnected, color);
    }
  } else if (playerId.toUpperCase() === dm_id) {
    update_old_player_card(playerId, isConnected, color);
  }
  // flash_tokens_tab(color);
}

/** updates the online indicator in the old players panel
 * @param {string} playerId the DDB id of the player
 * @param {boolean} isConnected true if the player is connected, else false
 * @param {string} peerColor a valid CSS color string that represents the player, defaults to gray which indicates offline */
function update_old_player_card(playerId, isConnected, peerColor) {
  // eventually this will go away once the PC tokens tab gets updated
  const color = peerColor ? peerColor : "gray";
  $(".player-card").each(function() {
    if (playerId === dm_id) {
      if ($(this).find(".player-name").text() === dm_id) {
        $(this).css("--player-border-color",  color);
        if (isConnected) {
          $(this).addClass("peerConnected")
        } else {
          $(this).removeClass("peerConnected")
        }
      }
    } else {
      const playerIdData = $(this).data("player-id");
      if (playerIdData && playerIdData.includes(playerId)) {
        $(this).css("--player-border-color",  color);
        if (isConnected) {
          $(this).addClass("peerConnected")
        } else {
          $(this).removeClass("peerConnected")
        }
        $(this).find(".player-token > img").css("border", `3px solid ${color}`);
      }
    }
  });
}

/** Sets up the peer fade functions. See {@link init_peer_fade_function} */
function init_peer_fade_functions() {
  if (!window.PEER_FADE_CURSOR_FUNCTIONS) {
    window.PEER_FADE_CURSOR_FUNCTIONS = {};
  }
  if (!window.PEER_FADE_RULER_FUNCTIONS) {
    window.PEER_FADE_RULER_FUNCTIONS = {};
  }
  if (window.pcs) {
    window.pcs.forEach(pc => {
      if (pc.characterId) {
        init_peer_fade_function(pc.characterId.toString())
      }
    });
  }
}

/** Creates and stores a debounce function for fading cursor and ruler streams for the playerId.
 * We hold a separate function for each peer to ensure that every peer cursor/ruler fades out.
 * With a single function, only the last playerId would get cleared which leaves other peer cursors and rulers on screen.
 * An alternative could be to track timestamps from every peer event, and then fade them out within a setInterval function.
 * The reason I went with separate debounce functions, is because setTimeout is significantly more efficient than date parsing.
 * So while this sets a few different setTimeout functions, it's still more efficient than setting Date.now() for every event.
 * @param {string} playerId the playerId that may stream their cursor or ruler */
function init_peer_fade_function(playerId) {
  if (typeof playerId !== "string" || playerId.length === 0) return;
  if (!window.PEER_FADE_CURSOR_FUNCTIONS[playerId]) {
    window.PEER_FADE_CURSOR_FUNCTIONS[playerId] = mydebounce(() => {
      noisy_log("executing PEER_FADE_CURSOR_FUNCTIONS", playerId);
      if (playerId === dm_id) {
        $(`#cursorPosition-DM`).fadeOut();

      } else {
        $(`#cursorPosition-${playerId}`).fadeOut();
      }
      if (window.PEER_TOKEN_DRAGGING != undefined && window.PEER_TOKEN_DRAGGING[playerId]) {
        const html = window.PEER_TOKEN_DRAGGING[playerId];
        delete window.PEER_TOKEN_DRAGGING[playerId];
        $(html).remove();
      }
    });
  }
  if (!window.PEER_FADE_RULER_FUNCTIONS[playerId]) {
    window.PEER_FADE_RULER_FUNCTIONS[playerId] = mydebounce(() => {
      noisy_log("executing PEER_FADE_RULER_FUNCTIONS", playerId);
      const waypointManager = get_peer_waypoint_manager(playerId, undefined);
      waypointManager.clearWaypoints();
    });
  }
}

/** a debounced function that will send {@link PeerEvent.cursor} event to all peers */
const sendRulerPositionToPeers = throttle( () => {
  noisy_log("sendRulerPositionToPeers");
  window.PeerManager.send(PeerEvent.cursor(undefined, undefined, undefined, true));
}, peer_animation_timout);

/** a debounced function that will send {@link PeerEvent.cursor} event to all peers */
const sendTokenPositionToPeers = throttle( (tokenX, tokenY, tokenId, includeRuler) => {
  noisy_log("sendTokenPositionToPeers", tokenX, tokenY, tokenId, includeRuler);
  window.PeerManager.send(PeerEvent.cursor(tokenX, tokenY, tokenId, includeRuler));
}, peer_animation_timout);

/** a debounced function that will send {@link PeerEvent.cursor} event to all peers */
const sendCursorPositionToPeers = throttle( (mouseMoveEvent) => {
  try {
    if (pauseCursorEventListener) return;
    if (is_player_sheet_open()) {
      noisy_log("sendCursorPositionToPeers is_player_sheet_open");
      return;  // ideally, we would add the event listener to the map only, but I couldn't find a clean way to do that without restructuring things
    }

    let [mouseX, mouseY] = get_event_cursor_position(mouseMoveEvent, true);
    noisy_log("sendCursorPositionToPeers", mouseX, mouseY);
    window.PeerManager.send(PeerEvent.cursor(mouseX, mouseY, undefined, false));
  } catch (error) {
    console.log("Failed to sendCursorPositionToPeers", error);
  }
}, peer_animation_timout);

/** called when we receive a {@link PeerEvent.cursor} event */
function handle_peer_cursor_event(eventData) {
  try {
    if (window.CURRENT_SCENE_DATA && window.CURRENT_SCENE_DATA.id !== eventData.sceneId) return; // they're on a different scene so don't show their cursor
    if(eventData.tokenId){
      const token = $(`.token[data-id='${eventData.tokenId}']:not(.underDarkness), #token_map_items .token[data-id='${eventData.tokenId}']`);
      if(token.length>0 && (token.css('display') == 'none' || token.css('visibility') == 'hidden'))
        return;
    }
    // if they're drawing a ruler, don't bother drawing the cursor. For these cases, we return;
    // if we don't draw the ruler, see if we want to draw the cursor. For these cases, we break;
    if (eventData.coords && eventData.coords.length > 0) {
      switch (window.receiveRulerFromPeers) {
        case "none":
          break; // not allowing rulers. check if we allow cursors below
        case "all":
          update_peer_ruler(eventData);
          return; // we're handling the ruler data. No need to check cursors below
        case "dm":
          if (eventData.playerId === dm_id) {
            update_peer_ruler(eventData);
            return; // we're handling the ruler data. No need to check cursors below
          }
          break; // we only want dm rulers. check if we allow cursors below
        case "combatTurn":
          if (eventData.playerId === dm_id) { // we always allow dm
            update_peer_ruler(eventData);
            return; // we're handling the ruler data. No need to check cursors below
          }
          const currentTurn = ct_current_turn();
          if (!currentTurn) break; // combat is not active, and this player only wants to see the ruler of the current turn
          if (!currentTurn.includes(eventData.playerId)) break; // combat is active, but this ruler does not match the current turn
          update_peer_ruler(eventData);
          return; // we're handling the ruler data. No need to check cursors below
      }
    }

    // if we handle the cursor, return;
    switch (window.receiveCursorFromPeers) {
      case "none":
        break; // not allowing cursors
      case "all":
        update_peer_cursor(eventData);
        return; // we're handling the cursor data
      case "dm":
        if (eventData.playerId === dm_id) {
          update_peer_cursor(eventData);
          return; // we're handling the cursor data
        }
        break; // we only want dm cursors
      case "combatTurn":
        if (eventData.playerId === dm_id) { // we always allow dm
          update_peer_cursor(eventData);
          return; // we're handling the cursor data
        }
        const currentTurn = ct_current_turn();
        if (!currentTurn) break; // combat is not active, and this player only wants to see the cursor of the current turn
        if (!currentTurn.includes(eventData.playerId)) break; // combat is active, but this cursor does not match the current turn
        update_peer_cursor(eventData);
        return; // we're handling the ruler data. No need to check cursors below
    }
  } catch (error) {
    noisy_log("handle_peer_cursor_event", eventData, error);
  }
}

/** update the cursor position that matches the {@link PeerEvent.cursor} event
 * this should only be called from {@link handle_peer_cursor_event} */
function update_peer_cursor(eventData) {
  fade_peer_cursor(eventData.playerId);

  if (typeof eventData.tokenId === "string" && eventData.tokenId.length > 0) {
    peer_is_dragging_token(eventData); 
    return;
  }

  // we're not checking receiveCursorFromPeers === "none" because we did that in handle_peer_cursor_event
  if (window.receiveCursorFromPeers === "combatTurn" && eventData.playerId !== dm_id) { // we always allow the DM
    const currentTurn = ct_current_turn();
    if (!currentTurn) return; // combat is not active, and this player only wants to see the cursor of the current turn
    if (!currentTurn.includes(eventData.playerId)) return; // combat is active, but this cursor does not match the current turn
  }

  noisy_log("update_peer_cursor", eventData);

  const playerId = eventData.playerId === dm_id ? "DM" : eventData.playerId; // dm_id has whitespace in it which messes with html selectors
  let cursorPosition = $(`#cursorPosition-${playerId}`);
  if (cursorPosition.length === 0) {
    cursorPosition = $(`<div class="peerCursorPosition" id="cursorPosition-${playerId}"></div>`);
    $("#VTT").append(cursorPosition);
    cursorPosition.css("transform", "scale(" + 1/window.ZOOM + ")");
  }
  cursorPosition.css('background', eventData.color);
  cursorPosition.stop();
  cursorPosition.animate({
    top: eventData.y-cursorPosition.width()/2,
    left: eventData.x-cursorPosition.height()/2
  }, peer_animation_timout, "linear");
  cursorPosition.fadeIn();
}

/** Calls the fade cursor debounce function for the playerId. See {@link init_peer_fade_function}
 * @param {string} playerId the playerId that is streaming their cursor */
function fade_peer_cursor(playerId) {
  try {
    // this function gets called a lot so don't bother checking if the function exists. It should.
    // If it doesn't for some reason, we'll set it up in the catch, and then this will do the right thing next time around
    window.PEER_FADE_CURSOR_FUNCTIONS[playerId]();
  } catch (error) {
    console.debug("fade_peer_cursor is missing a fade function", playerId, typeof playerId, error);
    init_peer_fade_function(playerId);
    window.PEER_FADE_CURSOR_FUNCTIONS[playerId]();
  }
}

/** Calls the fade ruler debounce function for the playerId. See {@link init_peer_fade_function}
 * @param {string} playerId the playerId that is streaming their ruler */
function fade_peer_ruler(playerId) {
  try {
    // this function gets called a lot so don't bother checking if the function exists. It should.
    // If it doesn't for some reason, we'll set it up in the catch, and then this will do the right thing next time around
    window.PEER_FADE_RULER_FUNCTIONS[playerId]();
  } catch (error) {
    console.debug("fade_peer_ruler is missing a fade function", playerId, typeof playerId, error);
    init_peer_fade_function(playerId);
    window.PEER_FADE_RULER_FUNCTIONS[playerId]();
  }
}

/** a debounced function that updates the tokens panel.
 * It is debounced to reduce the number of times we update the tokens panel.
 * This is expected to be called once per pc that the DM knows about */
const refreshTokensSidebarList = mydebounce( () => { // we want to debounce this because we might get a bunch in a row, and we only need to update the list once
  rebuild_token_items_list();
  redraw_token_list();
}, 2000);

/** called when we receive a {@link PeerEvent.cursor} event
* this should only be called from {@link handle_peer_cursor_event} */
function update_peer_ruler(eventData) {
  peer_is_dragging_token(eventData); // they allow rulers to be drawn so also show the token being dragged if applicable

  // we're not checking receiveRulerFromPeers because we did that in handle_peer_cursor_event

  noisy_log("update_peer_ruler", eventData)

  if (window.CURRENT_SCENE_DATA && window.CURRENT_SCENE_DATA.id !== eventData.sceneId) return; // they're on a different scene
  const waypointManager = get_peer_waypoint_manager(eventData.playerId, eventData.color);
  waypointManager.clearWaypoints(false);
  waypointManager.numWaypoints = eventData.numWaypoints;
  waypointManager.coords = eventData.coords;
  redraw_peer_rulers(eventData.playerId);
}

/** adds or updates the location of a mock token to show where a player is actively dragging it
 * this should only be called from {@link handle_peer_cursor_event} */
function peer_is_dragging_token(eventData) {
  if (typeof eventData.tokenId !== "string" || eventData.tokenId.length === 0) return;
  let html = window.PEER_TOKEN_DRAGGING[eventData.playerId];
  if (!html || html.length === 0) {
    noisy_log("peer_is_dragging_token no html", eventData);
    html = $(`#tokens div[data-id='${eventData.tokenId}']`).clone();
    html.attr("data-clone-id", `dragging-${eventData.tokenId}`);
    html.attr("data-id", ``);
    html.removeClass('tokenselected underDarkness ui-draggable-dragging pause_click ui-draggable ui-draggable-handle');
    html.css('opacity', '0.5')
    if (!html || html.length === 0) {
      noisy_log("peer_is_dragging_token no token on scene matching", `#tokens div[data-id='${eventData.tokenId}']`, eventData);
      return;
    }
    window.PEER_TOKEN_DRAGGING[eventData.playerId] = html;
    $("#tokens").append(html);
  }

  noisy_log("peer_is_dragging_token updating drag token css", eventData, html);
  html.css({
    top: eventData.y,
    left: eventData.x
  });
}

/** clears other player's rulers from our screen */
function clear_peer_canvas(playerId) {
  window.PEER_RULERS[playerId].throttleDraw(function(){
    window.PEER_RULERS[playerId].clearWaypointDrawings(playerId)
  })
}

/** iterates over window.PEER_RULERS and draws any rulers that need to be drawn */
function redraw_peer_rulers(playerId) {
  //clear_peer_canvas(playerId); // make sure we clear the canvas first. Otherwise, we'll see every previous position of every ruler
  const waypointManager = window.PEER_RULERS[playerId];
  waypointManager.draw(undefined, undefined, undefined, playerId);
  waypointManager.fadeoutMeasuring(playerId);
}

/** finds or creates a {@link WaypointManagerClass} for the given player
 * @param {string} playerId the playerId that we want to draw a ruler for
 * @param {string|undefined} color a valid CSS color to set on the waypoint manager
 * @return {WaypointManagerClass|undefined} a WaypointManager for the player */
function get_peer_waypoint_manager(playerId, color) {
  if (!playerId) return undefined;
  if (!window.PEER_RULERS) {
    window.PEER_RULERS = {};
  }
  if (window.PEER_RULERS[playerId]) {
    return window.PEER_RULERS[playerId];
  }
  const waypointManager = new WaypointManagerClass();
  window.PEER_RULERS[playerId] = waypointManager;
  waypointManager.resetDefaultDrawStyle();
  window.PEER_RULERS[playerId].playerId = playerId;
  if (color) {
    waypointManager.drawStyle.color = color;
  }
  const canvas = document.getElementById("peer_overlay");
  const context = canvas.getContext("2d");
  context.setLineDash([]);
  context.fillStyle = '#f50';
  waypointManager.setCanvas(canvas);
  return waypointManager;
}

/** iterates over window.PEER_PREFERENCES and either starts or stops sending cursor/ruler events to peers that only want to see cursors for the current combat turn
 * @param {object[]} ctItems the same data that the combat tracker uses */
function update_peer_communication_with_combat_tracker_data(ctItems) {
  try {
    if (!Array.isArray(ctItems)) return;
    console.debug("update_peer_communication_with_combat_tracker_data", ctItems);
    let myPlayerId = my_player_id();
    const currentTurn = ctItems.find(item => item.current === true && item.options)?.options?.id;
    const currentTurnId = currentTurn ? getPlayerIDFromSheet(currentTurn) : undefined;
    const isMyTurn = currentTurnId === myPlayerId;
    // start/stop sending events to everyone that specified "combatTurn"
    for (let playerId in window.PEER_PREFERENCES) {
      if (playerId === myPlayerId) continue; // we never send events to ourselves so there's no point tracking our own id
      const preferences = window.PEER_PREFERENCES[playerId];
      if (preferences && preferences.receiveCursorFromPeers === "combatTurn") {
        if (isMyTurn) {
          // it's our turn, send cursor events to everyone that specified combatTurn
          window.PeerManager.removeFromSkipCursorEvents(playerId);
        } else { // it's not our turn, stop sending cursor events to everyone that specified combatTurn
          window.PeerManager.addToSkipCursorEvents(playerId);
        }
      }
      if (preferences && preferences.receiveRulerFromPeers === "combatTurn") {
        if (isMyTurn) { // it's our turn, send ruler events to everyone that specified combatTurn
          window.PeerManager.removeFromSkipRulerEvents(playerId);
        } else { // it's not our turn, stop sending ruler events to everyone that specified combatTurn
          window.PeerManager.addToSkipRulerEvents(playerId);
        }
      }
    }
  } catch (error) {
    console.warn("update_peer_communication_with_combat_tracker_data caught an error", error);
  }
}

//#endregion game logic