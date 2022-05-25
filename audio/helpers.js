
/**
 * Returns the game id of throws an error
 * @returns {string} game id
 */
function gameID() {
    const gameID = (new URLSearchParams(window.location.search)).get('cid');
    if (gameID === null) {
        throw 'Failed to get game id'
    }
    return gameID;
}

/**
 * Logs a message to the console with the [audio] prefix
 * @param  {...any} msg
 */
function log(...msg) {
    console.log('[audio]', ...msg);
}

export { log, gameID }
