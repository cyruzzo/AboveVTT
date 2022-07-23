import { SyncIndicator } from "./SyncIndicator.js";

/**
 * Helper class for cloud functionality.
 */
class CloudHelper {
    syncIndicator;

    constructor() {
        this.syncIndicator = new SyncIndicator();
    }
}

window.CLOUD_HELPER = new CloudHelper();
