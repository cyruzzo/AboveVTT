/**
 * Simple check if the Beyond20 browser extension is enabled.
 * 
 * This function currently checks for the presence of any DOM element with a class starting with "beyond20". 
 * @returns Boolean
 */
export default function isEnabled() {
	return $("[class^=beyond20]").length > 0;
};