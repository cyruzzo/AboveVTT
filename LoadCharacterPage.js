/*
* This Script gets called both in the "My Characters" (dndbeyond.com/characters)
* and also in the character sheet. 
* The main purpose is to add the "JOIN ABOVEVTT" buttons near the character pages
* WE NEED TO BE VERY CAREFUL ABOUT WHAT WE DO.
*/
if(!window.location.search.includes("abovevtt=true")) {
    // WE SHOULD WAIT FOR PAGE LOAD ANYWAY
    console.warn("ABOVEVTT. WE SHOULD SOON ADD 'JOIN ABOVEVTT BUTTONS HERE' FOR CHARACTER IS IN A CAMPAIGN");

    // WE SHOULD CHECK IF WE ARE IN A CHARACTER PAGE OR IN THE CHARACTER LIST!
}
