
/**
 * Returns the game id or throws an error
 * @returns {string} game id
 */
function gameID() {
    const id = (new URLSearchParams(window.location.search)).get('cid');
    if (!id) {
        throw 'Failed to get game id'
    }
    return id;
}

/**
 * Returns the player id or throws an error
 * @returns {string} player id
 */
function playerID() {
    const parts = window.location.pathname.split('/').filter(i => i);
    switch (parts[0]) {
        case 'encounters':
        case 'campaigns':
            return 'DM';
        case 'characters':
            if (!parts[1]) {
                throw 'Failed to get player id from url'
            }
            return parts[1];
        default:
            throw `Unknown page: ${window.location.href}`;
    };
}

/**
 * Logs a message to the console with the [audio] prefix
 * @param  {...any} msg
 */
function log(...msg) {
    console.log('[audio]', ...msg);
}

export { log, gameID, playerID }
