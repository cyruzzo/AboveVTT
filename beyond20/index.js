import isEnabled from "./detect.js";
import showNotification from "./notification.js";

(function() {

    // Check if browser extension is enabled
    if(isEnabled()){
        showNotification();
    }

})();


