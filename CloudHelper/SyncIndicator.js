/**
 * A visual indicator to show syncing activities.
 */
export class SyncIndicator {
    isSyncInProgress = false;
    #domElement;
    #syncIndicatorTimeout;

    constructor() {
        // Try to fetch DOM element (may fail on init, since DOM is not ready)
        this.#domElement = $("#switch_settings .sidebar-tab-image div");

        // Hook into Ajax
        this.#patchAjax();
    }

    /**
     * Starts the syncing animation
     */
    show() {
        this.#updateUI(true);
    }

    /**
     * Starts and auto stops the animation
     * @param {number} [timeoutInMs] - auto stop after x milliseconds
     */
    showTimed(timeoutInMs) {
        clearTimeout(this.#syncIndicatorTimeout);
        this.#syncIndicatorTimeout = setTimeout(
            this.hide.bind(this),
            timeoutInMs || 500
        );
        this.show();
    }

    /**
     * Stops the syncing animation
     */
    hide() {
        this.#updateUI(false);
    }

    /**
     * Updates the DOM element
     * @param {boolean} isSyncing state indication
     */
    #updateUI(isSyncing) {
        this.isSyncInProgress = isSyncing;

        // Refetch DOM element if not already set
        if (this.#domElement.length === 0) {
            this.#domElement = $("#switch_settings .sidebar-tab-image div");
        }

        // Update animation state
        this.#domElement.css({
            animationPlayState: isSyncing ? "running" : "paused",
        });
    }

    /**
     * Hooks animation into all JQuery Ajax requests
     */
    #patchAjax() {
        $.ajaxSetup({
            beforeSend: function () {
                this.show("beforeSend");
            }.bind(this),
            complete: function () {
                this.hide("beforeSend");
            }.bind(this),
        });
    }
}
