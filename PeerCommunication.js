/* PeerCommunication.js - Game logic for communicating with peers */

//#region helper functions

/** The string "THE DM" has been used in a lot of places.
 * This prevents typos or case sensitivity in strings.
 * @return {String} "THE DM" */
const dm_id = "THE DM";

/** @return {string} The id of the player as a string, {@link dm_id} for the dm */
function my_player_id() {
  if (window.DM) {
    return dm_id;
  } else {
    return `${window.PLAYER_ID}`;
  }
}

/** @return {object} The window.pcs object that matches the playerId */
function find_pc_by_player_id(playerId) {
  return window.pcs.find(pc => playerId === dm_id ? pc.sheet === '' : pc.sheet.includes(playerId));
}

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

//#endregion helper functions

//#region PeerEvent declaration and documentation

/** The various events that can be sent/received via window.PeerManager.send
 * these are static string declarations to avoid typos */
class PeerEventType {
  static hello = "hello";
  static goodbye = "goodbye";
  static playerData = "playerData";
  static cursor = "cursor";
  static preferencesChange = "preferencesChange"; // we send the current color in cursor events, but we don't want to add extra processing of those events because they're very numerous
  static ruler = "ruler";
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

  /** A message that shares player data with all peers. This data is used to populate the players panel
   * This message is sent from the DM to all players any time window.PLAYER_STATS is updated
   * @param {object} playerData the data or that player see window.PLAYER_STATS for more details on the structure */
  static playerData(playerData) {
    return {
      message: PeerEventType.playerData,
      playerData: playerData
    };
  }

  /** A message that shares our cursor position with all other peers that is sent from {@link sendCursorPositionToPeers}
   * When this message is received, we update the location of that players cursor on our screen from {@link update_peer_cursor}
   * This is enabled/disabled using {@link start_sending_cursor_to_peers} and {@link stop_sending_cursor_to_peers}
   * Users can enable/disable this from the settings sidebar panel
   * This event includes color data which is only used to update the cursor element.
   * We neither use this color for anything, nor pull this data from anywhere because we want to limit the amount of processing this event causes.
   * This event is very chatty so we want to keep processing of this event to a minimum.
   * @param mouseX the x coordinate of the cursor position
   * @param mouseY the y coordinate of the cursor position */
  static cursor(mouseX, mouseY) {
    return {
      message: PeerEventType.cursor,
      playerId: my_player_id(),
      x: mouseX,
      y: mouseY,
      color: window.color,
      sceneId: window.CURRENT_SCENE_DATA ? window.CURRENT_SCENE_DATA.id : ""
    }
  }

  /** A message that shares our ruler coordinates with all other peers that is sent from {@link send_ruler_to_peers}
   * When this message is received, we draw that player's ruler on our screen from {@link update_peer_ruler}
   * This is enabled/disabled using {@link start_sending_cursor_to_peers} and {@link stop_sending_cursor_to_peers}
   * Users can enable/disable this from the settings sidebar panel
   * This event includes color data which is only used to update the ruler element.
   * We neither use this color for anything, nor pull this data from anywhere because we want to limit the amount of processing this event causes.
   * This event is very chatty so we want to keep processing of this event to a minimum. */
  static ruler() {
    return {
      message: PeerEventType.ruler,
      playerId: my_player_id(),
      numWaypoints: WaypointManager.numWaypoints,
      coords: WaypointManager.coords,
      mouseDownCoords: WaypointManager.mouseDownCoords,
      color: window.color,
      sceneId: window.CURRENT_SCENE_DATA ? window.CURRENT_SCENE_DATA.id : ""
    }
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
      case PeerEventType.cursor:            update_peer_cursor(eventData); break;
      case PeerEventType.goodbye:           peer_said_goodbye(eventData); break;
      case PeerEventType.hello:             peer_said_hello(eventData); break;
      case PeerEventType.playerData:        update_player_data_from_peer(eventData.playerData); break;
      case PeerEventType.preferencesChange: peer_changed_preferences(eventData); break;
      case PeerEventType.ruler:             update_peer_ruler(eventData); break;
      default: console.debug("handle_peer_event is ignoring event", eventData); // using console.debug because we don't want to spam the console with warning or errors.
    }
  } catch (error) {
    // using console.debug because we don't want to spam the console with warnings or errors
    console.debug("handle_peer_event failed to handle event", eventData, error);
  }
}

//#endregion PeerManager event handling

//#region PeerManager connect/disconnect logic

function local_peer_setting_changed(settingName, newValue) {
  switch (settingName) {
    case "peerStreaming":
      if (newValue === true) {
        enable_peer_manager();
      } else {
        disable_peer_manager();
      }
      break;
    case "receiveCursorFromPeers": // explicitly letting this fall through
    case "receiveRulerFromPeers":
      let eventData = PeerEvent.preferencesChange();
      store_peer_preferences(eventData); // faster access to our own preferences instead of reading from localStorage every time
      window.PeerManager.send(eventData);
      break;
  }
}

/** show/hide settings UI based as needed
 * @param {boolean} peerStreamingValue the value of the "peerStreaming" setting */
function toggle_peer_settings_visibility(peerStreamingValue) {
  if (peerStreamingValue) {
    $(`.token-image-modal-footer-select-wrapper[data-option-name="receiveCursorFromPeers"]`).show();
    $(`.token-image-modal-footer-select-wrapper[data-option-name="receiveRulerFromPeers"]`).show();
    $("#cursor_ruler_toggle").css("visibility", "visible");
  } else {
    $(`.token-image-modal-footer-select-wrapper[data-option-name="receiveCursorFromPeers"]`).hide();
    $(`.token-image-modal-footer-select-wrapper[data-option-name="receiveRulerFromPeers"]`).hide();
    $("#cursor_ruler_toggle").css("visibility", "collapse");
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

    // send them any player data that we have
    if (window.DM) {
      for (const id in window.PLAYER_STATS) {
        send_player_data_to(peerId, window.PLAYER_STATS[id]);
      }
    }

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

/** used by {@link start_sending_cursor_to_peers} to avoid doubling up on even listeners */
let isTrackingCursor = false;

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

  const pc = find_pc_by_player_id(eventData.playerId);
  if (!pc){
    console.debug("peer_changed_preferences no pc", eventData, window.pcs);
    return;
  }
  pc.color = eventData.color;
  update_player_online_indicator(eventData.playerId, pc.p2pConnected, eventData.color);
}

/** updates the online indicator in the tokens panel, and call {@link update_old_player_card} to update the online indicator in the players panel if necessary
 * @param {string} playerId the DDB id of the player
 * @param {boolean} isConnected true if the player is connected, else false
 * @param {string} peerColor a valid CSS color string that represents the player, defaults to gray which indicates offline */
function update_player_online_indicator(playerId, isConnected, peerColor) {
  const color = peerColor ? peerColor : "gray";
  const pc = find_pc_by_player_id(playerId);
  console.debug("update_player_online_indicator", playerId, isConnected, color, pc);
  if (pc) {
    pc.p2pConnected = isConnected;
    pc.color = color;
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
  flash_tokens_tab(color);
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
    window.pcs.forEach(pc => init_peer_fade_function(getPlayerIDFromSheet(pc.sheet)));
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
    });
  }
  if (!window.PEER_FADE_RULER_FUNCTIONS[playerId]) {
    window.PEER_FADE_RULER_FUNCTIONS[playerId] = mydebounce(() => {
      noisy_log("executing PEER_FADE_RULER_FUNCTIONS", playerId);
      const waypointManager = get_peer_waypoint_manager(playerId, undefined);
      waypointManager.clearWaypoints();
      redraw_peer_rulers();
    });
  }
}

/** a debounced function that will send {@link PeerEvent.cursor} event to all peers */
const sendCursorPositionToPeers = mydebounce( (mouseMoveEvent) => {
  try {
    if (is_player_sheet_open()) {
      noisy_log("sendCursorPositionToPeers is_player_sheet_open");
      return;  // ideally, we would add the event listener to the map only, but I couldn't find a clean way to do that without restructuring things
    }

    const [mouseX, mouseY] = get_event_cursor_position(mouseMoveEvent);
    noisy_log("sendCursorPositionToPeers", mouseX, mouseY);
    window.PeerManager.send(PeerEvent.cursor(mouseX, mouseY));
  } catch (error) {
    console.log("Failed to sendCursorPositionToPeers", error);
  }
}, 0);

/** called when we receive a {@link PeerEvent.cursor} event */
function update_peer_cursor(eventData) {
  noisy_log("update_peer_cursor", eventData);
  fade_peer_cursor(eventData.playerId);
  // check receiveCursorFromPeers?
  if (window.CURRENT_SCENE_DATA && window.CURRENT_SCENE_DATA.id !== eventData.sceneId) return; // they're on a different scene so don't show their cursor

  const playerId = eventData.playerId === dm_id ? "DM" : eventData.playerId; // dm_id has whitespace in it which messes with html selectors
  let cursorPosition = $(`#cursorPosition-${playerId}`);
  if (cursorPosition.length === 0) {
    cursorPosition = $(`<div class="peerCursorPosition" id="cursorPosition-${playerId}"></div>`);
    $("#VTT").append(cursorPosition);
    cursorPosition.css("transform", "scale(" + 1/window.ZOOM + ")");
  }
  cursorPosition.css({
    top: eventData.y,
    left: eventData.x,
    background: eventData.color
  });
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
  }
}

/** Sends a {@link PeerEvent.playerData} event to a specific peer
 * @param {string} peerId the id of the peerjs peer to send to
 * @param {object} playerData the player data to send */
function send_player_data_to(peerId, playerData) {
  if (typeof playerData === "object") {
    window.PeerManager.send(PeerEvent.playerData(playerData));
  }
}

/** Sends a {@link PeerEvent.playerData} event to all connected peers
 * @param {object} playerData the player data to send */
function send_player_data_to_all_peers(playerData) {
  if (typeof playerData === "object") {
    window.PeerManager.send(PeerEvent.playerData(playerData));
  }
}

/** called when we receive a {@link PeerEvent.playerData} event */
function update_player_data_from_peer(playerData) {
  if (!window.PLAYER_STATS) {
    window.PLAYER_STATS = {};
  }
  window.PLAYER_STATS[playerData.id] = playerData;
  refreshTokensSidebarList();
}

/** a debounced function that updates the tokens panel.
 * It is debounced to reduce the number of times we update the tokens panel.
 * This is expected to be called once per pc that the DM knows about */
const refreshTokensSidebarList = mydebounce( () => { // we want to debounce this because we might get a bunch in a row, and we only need to update the list once
  rebuild_token_items_list();
  redraw_token_list();
}, 2000);

/** a debounced function that will send {@link PeerEvent.ruler} event to all peers */
const send_ruler_to_peers = mydebounce( () => {
  noisy_log("send_ruler_to_peers");
  window.PeerManager.send(PeerEvent.ruler());
}, 0);

/** called when we receive a {@link PeerEvent.ruler} event */
function update_peer_ruler(eventData) {
  noisy_log("update_peer_ruler", eventData)
  fade_peer_ruler(eventData.playerId);
  if (window.CURRENT_SCENE_DATA && window.CURRENT_SCENE_DATA.id !== eventData.sceneId) return; // they're on a different scene
  const waypointManager = get_peer_waypoint_manager(eventData.playerId, eventData.color);
  clear_peer_canvas()
  waypointManager.clearWaypoints()
  waypointManager.numWaypoints = eventData.numWaypoints;
  waypointManager.coords = eventData.coords;
  waypointManager.mouseDownCoords = eventData.mouseDownCoords;
  redraw_peer_rulers();
}

/** clears other player's rulers from our screen */
function clear_peer_canvas() {
  const canvas = document.getElementById("peer_overlay");
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
}

/** iterates over window.PEER_RULERS and draws any rulers that need to be drawn */
function redraw_peer_rulers() {
  clear_peer_canvas(); // make sure we clear the canvas first. Otherwise, we'll see every previous position of every ruler
  for (const playerId in window.PEER_RULERS) {
    const waypointManager = window.PEER_RULERS[playerId];
    waypointManager.draw(false);
  }
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