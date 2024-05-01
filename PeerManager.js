/* PeerManager.js - peerjs connection management */

class PeerManager {

  /** Whether the PeerManager is allowed to make connections or communicate with other peers */
  enabled = false;

  /** @return {Peer} - our private reference to the peerjs object */
  peer = new Peer(`AboveVTT-${window.gameId}-${uuid()}`);

  /** @return {PeerConnection[]} List of peers that we are connecting/connected to */
  connections = [];

  /** The id of the stale connection loop. We monitor for stale connections and try to clean them up. This tracks that loop */
  staleConnectionTimerId = undefined;

  /** a list of ids to avoid sending cursor events to */
  skipCursorEvents = [];

  /** a list of ids to avoid sending cursor events to */
  skipRulerEvents = [];

  /** a way to temporarily stop streaming cursor and ruler events */
  allowCursorAndRulerStreaming = true;

  /** stop sending cursor events to the specified player
   * @param {string} playerId the DDB id of the player to stop sending cursor events to */
  addToSkipCursorEvents(playerId) {
    if (!window.PeerManager.skipCursorEvents.includes(playerId)) {
      console.debug("PeerManager.addToSkipCursorEvents", playerId);
      window.PeerManager.skipCursorEvents.push(playerId);
    }
  }

  /** start sending cursor events to the specified player
   * @param {string} playerId the DDB id of the player to start sending cursor events to */
  removeFromSkipCursorEvents(playerId) {
    const index = window.PeerManager.skipCursorEvents.indexOf(playerId);
    if (index >= 0) {
      console.debug("PeerManager.removeFromSkipCursorEvents", playerId);
      window.PeerManager.skipCursorEvents.splice(index, 1);
    }
  }

  /** prevent sending ruler events to the specified player
   * @param {string} playerId the DDB id of the player to stop sending ruler events to */
  addToSkipRulerEvents(playerId) {
    if (!window.PeerManager.skipRulerEvents.includes(playerId)) {
      console.debug("PeerManager.addToSkipRulerEvents", playerId);
      window.PeerManager.skipRulerEvents.push(playerId);
    }
  }

  /** start sending ruler events to the specified player
   * @param {string} playerId the DDB id of the player to start sending ruler events to */
  removeFromSkipRulerEvents(playerId) {
    const index = window.PeerManager.skipRulerEvents.indexOf(playerId);
    if (index >= 0) {
      console.debug("PeerManager.removeFromSkipRulerEvents", playerId);
      window.PeerManager.skipRulerEvents.splice(index, 1);
    }
  }

  /** @return {String[]} - the list of playerIds that we are currently connected to */
  get connectedPlayerIds() {
    return this.connections.filter(pc => pc.isOpen).map(pc => pc.playerId);
  }

  constructor() {
    this.peer.on('connection', function(conn) {
      conn.on("open", () => {
        console.log("PeerManager connection opened", conn.open, conn);
        window.PeerManager.receivedPeerConnectedEvent(conn.peer);
      });
      conn.on("close", () => {
        console.log("PeerManager connection closed", conn);
        window.PeerManager.disconnectFromPeer(conn.peer);
      });
      conn.on("data", (data) => {
        noisy_log("PeerManager connection data", data);
        handle_peer_event(data);
      });
      conn.on("error", (error) => {
        console.error("PeerManager connection error", error);
        // should we call rebuild_peerManager() here?
      });
    });
    this.peer.on('error', function (error) {
      console.error("PeerManager peer error", error);
      rebuild_peerManager();
    });
  }

  tearDown() {
    this.disconnectAllPeers();
    this.peer.disconnect();
    this.peer.destroy();
    this.connections = [];
  }

  /** handles the peerjs connection.open event */
  receivedPeerConnectedEvent(peerId) {
    // a connection to this peer was opened, but our stored connection doesn't seem to be open right away
    const pc = window.PeerManager.findConnectionByPeerId(peerId);
    if (!pc) return;
    if (pc.isOpen) {
      peer_connected(pc.peerId, pc.playerId);
    } else {
      // try again every second until peerjs opens our connection
      setTimeout(function () {
        window.PeerManager.receivedPeerConnectedEvent(peerId);
      }, 1000);
    }
  }

  /** Sends a peerReady event over the websocket.
   * Any connected players will respond with their connection details which will call {@link receivedPeerConnect} */
  readyToConnect() {
    if (!this.enabled) {
      console.log("PeerManager.readyToConnect is returning early because enabled =", this.enabled);
      return;
    }
    try {
      console.debug("PeerManager.readyToConnect");
      const peerId = this.peer.id;
      const playerId = my_player_id();
      if (!peerId || !playerId) {
        console.warn("PeerManager.readyToConnect is missing ids", peerId, playerId);
        return;
      }
      window.MB.sendMessage("custom/myVTT/peerReady", { peerId: peerId, playerId: playerId });
    } catch (error) {
      console.warn("PeerManager.readyToConnect failed", error);
    }
  }

  /** Creates a peer connection in response to a peerReady event {@link readyToConnect}.
   * Sends a peerConnect event over the websocket back to the peer that sent the peerReady event. */
  receivedPeerReady(msg) {
    if (!this.enabled) {
      console.log("PeerManager.receivedPeerReady is returning early because enabled =", this.enabled);
      return;
    }
    try {
      console.debug("PeerManager.receivedPeerReady", msg);
      // This user just joined. Initiate the connection.
      window.PeerManager.connectTo(msg.data.peerId, msg.data.playerId);
      // now let them know that how to connect to us
      window.MB.sendMessage("custom/myVTT/peerConnect", {
        initiator: msg.data.peerId,
        peerId: window.PeerManager.peer.id,
        playerId: my_player_id()
      });
    } catch (error) {
      console.warn("PeerManager.receivedPeerReady failed to handle peerReady event", msg);
    }
  }

  /** Connects to the peer that just opened a connection for us */
  receivedPeerConnect(msg) {
    if (!this.enabled) {
      console.log("PeerManager.receivedPeerConnect is returning early because enabled =", this.enabled);
      return;
    }
    try {
      console.debug("PeerManager.receivedPeerConnect", msg);
      if (msg.data.initiator === window.PeerManager.peer.id) { // make sure they're sending it to us
        window.PeerManager.connectTo(msg.data.peerId, msg.data.playerId);
      }
    } catch (error) {
      console.warn("PeerManager.receivedPeerConnect failed to handle peerConnect event", msg);
    }
  }

  /** Creates a peerjs connection to the specified player.
   * This must be called on both sides for the connection to be completed
   * successful connections will call {@link peer_connected} when the connection is open and stable
   * @param {string} peerId - the id of the peerjs peer
   * @param {string} playerId - the DDB id of the player */
  connectTo(peerId, playerId) {
    console.debug("PeerManager.connectTo", peerId, playerId);
    try {
      if (!peerId || !playerId) {
        console.warn("PeerManager.connectTo cannot connect with missing id", peerId, playerId);
        return;
      }

      // try to clean up any stale connections in case the connection closed, but we haven't been notified.
      // This could happen if the other player refreshes and their goodbye event was dropped.
      this.cleanUpStalePeerConnections(peerId);
      this.cleanUpStalePlayerConnections(playerId);

      let existingConnections = this.connections.filter(pc => pc.peerId === peerId || pc.playerId === playerId);
      if (existingConnections.length > 1) {
        // this might not be a recoverable state, but try to remove all peer connections before connecting.
        console.warn("PeerManager.connectTo found multiple active connections. Attempting to close them", existingConnections);
        existingConnections.forEach(pc => {
          this.disconnectAndRemoveConnection(pc);
        });
      } else if (existingConnections.length === 1) {
        if (existingConnections[0].isStale) {
          // clean it up first
          console.debug("PeerManager.connectTo found an existing connection that is stale", existingConnections[0]);
          this.disconnectAndRemoveConnection(existingConnections[0]);
        } else {
          // we have an existing connection that isn't stale. No need to connect
          console.debug("PeerManager.connectTo found an existing connection that isn't stale", existingConnections[0]);
          return;
        }
      }

      console.log("PeerManager.connectTo is attempting to connect to", peerId, playerId);
      const connection = this.peer.connect(peerId);
      this.connections.push(new PeerConnection(peerId, playerId, connection));
      console.debug("PeerManager.connectTo added connection", connection, this.connections);
      this.startMonitoringStaleConnections();
    } catch (error) {
      console.error("PeerManager.connectTo failed to connect to", peerId, playerId, error);
    }
  }

  /** looks for any stale connections to the given peerjs peerId and attempts to disconnect them
   * @param {string} peerId the id of the peerjs peer */
  cleanUpStalePeerConnections(peerId) {
    console.debug("PeerManager.cleanUpStalePeerConnections", peerId)
    this.connections
      .filter(pc => pc.peerId === peerId)
      .forEach(pc => {
        if (pc.isStale) {
          this.disconnectAndRemoveConnection(pc);
        }
      });
  }

  /** looks for any stale connections to the given DDB playerId and attempts to disconnect them
   * @param {string} playerId the id of the DDB player */
  cleanUpStalePlayerConnections(playerId) {
    console.debug("PeerManager.cleanUpStalePlayerConnections", playerId)
    this.connections
      .filter(pc => pc.playerId === playerId)
      .forEach(pc => {
        if (pc.isStale) {
          this.disconnectAndRemoveConnection(pc);
        }
      });
  }

  /** disconnects all peers */
  disconnectAllPeers() {
    console.debug("PeerManager.disconnectAllPeers");
    this.connections
      .map(pc => pc) // map to a new list to avoid removing items form the list while iterating over it
      .forEach(pc => this.disconnectAndRemoveConnection(pc));
  }

  /** disconnects from the specified peerjs peer
   * @param {string} peerId the id of the peerjs peer */
  disconnectFromPeer(peerId) {
    console.debug("PeerManager.disconnectFromPeer", peerId);
    this.disconnectAndRemoveConnection(this.findConnectionByPeerId(peerId));
  }

  /** disconnects from the specified DDB player
   * @param {string} playerId the id of the DDB player */
  disconnectFromPlayer(playerId) {
    console.debug("PeerManager.disconnectFromPlayer", playerId);
    this.disconnectAndRemoveConnection(this.findConnectionByPlayerId(playerId))
  }

  /** disconnects the given peerConnection, and removes it from our list of connections
   * @param {PeerConnection} peerConnection the connection to disconnect and remove */
  disconnectAndRemoveConnection(peerConnection) {
    try {
      if (!peerConnection) {
        return;
      }
      console.debug("PeerManager.disconnectAndRemoveConnection", peerConnection);
      const index = this.connections.indexOf(peerConnection);
      this.connections.splice(index, 1);
      peerConnection.connection.close();
      peer_disconnected(peerConnection.peerId, peerConnection.playerId);
    } catch(error) {
      console.error("PeerManager failed to disconnect from", peerConnection, error);
    }
  }

  /** Finds the connection for the given playerId
   *  @param {string} playerId - the DDB id of the character
   *  @return {PeerConnection|undefined} the PeerConnection for the player if it exists, else undefined */
  findConnectionByPlayerId(playerId) {
    noisy_log("PeerManager.findConnectionByPlayerId", playerId);
    const playerIdString = `${playerId}`; // in case we get a number
    return this.connections.find(pc => pc.playerId === playerIdString);
  }

  /** Finds the connection for the given peerId
   *  @param {string} peerId - the id of the peerjs peer
   *  @return {PeerConnection|undefined} the PeerConnection for the peer if it exists, else undefined */
  findConnectionByPeerId(peerId) {
    noisy_log("PeerManager.findConnectionByPeerId", peerId);
    return this.connections.find(pc => pc.peerId === peerId);
  }

  /** Attempts to send data to all connected peers
   * @param {Object} data the data to send to all peers */
  send(data) {
    if (!this.enabled) return;
    let connectionsToSendTo;
    switch (data.message) {
      case PeerEventType.cursor:
        if (this.allowCursorAndRulerStreaming) {
          if (data.coords.length > 0) {
            connectionsToSendTo = this.connections.filter(pc => !this.skipRulerEvents.includes(pc.playerId));
            noisy_log("PeerManager.send filtering ruler event", this.skipRulerEvents, connectionsToSendTo);
          } else {
            connectionsToSendTo = this.connections.filter(pc => !this.skipCursorEvents.includes(pc.playerId));
            noisy_log("PeerManager.send filtering cursor event", this.skipCursorEvents, connectionsToSendTo);
          }
        } else {
          connectionsToSendTo = [];
        }
        break;
      default:
        noisy_log("PeerManager.send not filtering", data.message);
        connectionsToSendTo = this.connections;
      break;
    }
    connectionsToSendTo.forEach(pc => {
      try {
        pc.connection.send(data);
      } catch (error) {
        console.warn("PeerManager failed to send data to player", data)
      }
    });
  }

  /** Attempts to send data to only the specified peer
   * @param {string} peerId the peer to send to
   * @param {Object} data the data to send */
  sendToPeer(peerId, data) {
    if (!this.enabled) return;
    try {
      const pc = this.findConnectionByPeerId(peerId);
      if (pc.isOpen) {
        console.debug("PeerManager is sending to peer", pc, data);
      } else {
        console.debug("PeerManager is not sending to a connection that is not open", pc.connection.open, pc);
      }
      pc.connection.send(data);
    } catch (error) {
      console.warn("PeerManager failed to send data to peer", peerId, data)
    }
  }

  /** Attempts to send data to only the specified player
   * @param {string|number} playerId the player to send to
   * @param {Object} data the data to send */
  sendToPlayer(playerId, data) {
    if (!this.enabled) return;
    try {
      const pc = this.findConnectionByPlayerId(playerId);
      if (pc.isOpen) {
        pc.connection.send(data);
      } else {
        console.debug("PeerManager is not sending to a connection that is not open", pc);
      }
    } catch (error) {
      console.warn("PeerManager failed to send data to player", playerId, data)
    }
  }

  /** Starts a periodic loop that checks for and cleans up stale connections */
  startMonitoringStaleConnections() {
    if (this.staleConnectionTimerId) {
      return; // we're already monitoring this so no need to double up
    }
    this.staleConnectionTimerId = setInterval(function() {
      window.PeerManager.checkForStaleConnections();
    }, 10 * 1000); // check every 10 seconds. This probably doesn't need to run this frequently, but to start with let's be more aggressive
  }

  /** Checks for and cleans up stale connections */
  checkForStaleConnections() {
    try {
      let attemptReconnect = false;
      // first let's clean up everything that we actually know about
      this.connections.forEach(pc => {
        if (pc.isStale) {
          window.PeerManager.disconnectAndRemoveConnection(pc);
          attemptReconnect = true;
        }
      });

      // now let's check deep within peerjs for any that we don't know about
      for (const peerId in this.peer.connections) {
        const connections = this.peer.connections[peerId];
        noisy_log(`PeerManager.checkForStaleConnections this.peer.connections[${peerId}]`, connections)
        connections.forEach(conn => {
          if (!conn.open) {
            try {
              console.debug("PeerManager.checkForStaleConnections attempting to close an already closed connection");
              conn.close();
            } catch (error) {
              console.debug("PeerManager.checkForStaleConnections failed to close an already closed connection", error);
            }
            try {
              console.debug("PeerManager.checkForStaleConnections attempting to destroy a closed connection");
              conn.destroy();
            } catch (error) {
              console.debug("PeerManager.checkForStaleConnections failed to destroy a closed connection", error);
            }
            attemptReconnect = true;
          } else if (!this.findConnectionByPeerId(peerId)) {
            // We have an abandoned connection. Close it, and try to reconnect
            try {
              console.debug("PeerManager.checkForStaleConnections attempting to close an abandoned connection");
              conn.close();
            } catch (error) {
              console.debug("PeerManager.checkForStaleConnections failed to close an abandoned connection", error);
            }
            try {
              console.debug("PeerManager.checkForStaleConnections attempting to destroy an abandoned connection");
              conn.destroy();
            } catch (error) {
              console.debug("PeerManager.checkForStaleConnections failed to destroy an abandoned connection", error);
            }
            attemptReconnect = true;
          }
        });
      }

      if (attemptReconnect) {
        this.readyToConnect();
      } else if (this.connections.length === 0) {
        clearInterval(this.staleConnectionTimerId); // we're not connected to anything
        this.staleConnectionTimerId = undefined;
      }
    } catch (error) {
      console.warn("checkForStaleConnections failed", error);
    }
  }

}

/** A wrapper class that PeerManager uses internally for managing peer connections */
class PeerConnection {

  constructor(peerId, playerId, connection) {
    this.peerId = peerId;
    this.playerId = playerId;
    this.connection = connection;
  }

  /** {string} the id of the peer we are connecting/connected to */
  peerId;

  /** {string} the DDB id of the player we are connecting/connected to */
  playerId;

  /** {DataConnection} the peerjs connection object that we maintain with the other player */
  connection;

  /** @return {string} the readyState of the dataChannel */
  get readyState() {
    try {
      return this.connection.dataChannel.readyState;
    } catch (error) {
      console.warn("PeerConnection.connectionState caught an error", error);
      return "unknown";
    }
  }

  /** @return {boolean} true if the connection is open, else false */
  get isOpen() {
    try {
      return this.connection.open;
    } catch (error) {
      console.warn("PeerConnection.isOpen caught an error", error);
      return false;
    }
  }

  /** @return {boolean} true if the connection readyState returns anything other than "connecting" or "open", else false  */
  get isStale() {
    try {
      const rs = this.readyState;
      return rs !== "connecting" && rs !== "open"; // if we are connecting/connected then we are not stale; otherwise we are stale
    } catch (error) {
      console.warn("PeerConnection.isStale caught an error", error);
      return true;
    }
  }
}


