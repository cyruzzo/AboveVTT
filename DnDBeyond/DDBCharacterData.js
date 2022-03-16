const rulesUrls = ["https://character-service.dndbeyond.com/character/v4/rule-data", "https://gamedata-service.dndbeyond.com/vehicles/v3/rule-data"];
const charJSONurlBase = "https://character-service.dndbeyond.com/character/v4/character/";

const gameCollectionUrl = { prefix: "https://character-service.dndbeyond.com/character/v4/game-data/", postfix: "/collection" }
const optionalRules = {
    "optionalOrigins": { category: "racial-trait", id: "racialTraitId" },
    "optionalClassFeatures": { category: "class-feature", id: "classFeatureId" },
};

var rulesData = {};

//onload(charIDs);


function get_pclist_player_data(retrying=false) {

    if((window.moduleExport === undefined) && retrying){
        console.error("get_pclist_player_data: FAILED LOADING DDB CHARACTER MODULES :( ")
        return;
    }

    if(window.moduleExport === undefined){
        console.warn("get_pclist_player_data: DDB CHARACTER MODULES ARE NOT LOADED. RETRYING IN 15 sec")
        loadModules(initalModules);
        setTimeout(()=>{get_pclist_player_data(true)},15000);
        return;
    }
    console.log("get_pclist_player_data: ddb character modules are loaded. grabbing data")

    var processedPlayers = [];
    window.pcs.forEach(function (pc) {
        getPlayerData(pc.sheet, function (playerData) {
            window.PLAYER_STATS[playerData.id] = playerData;
            window.MB.sendTokenUpdateFromPlayerData(playerData);
            processedPlayers.push(playerData.id);
            let players = Object.keys(window.PLAYER_STATS);
            if (areArraysEqualSets(processedPlayers, players)) {
                update_pclist();
            }
        })
    });
}


function getDDBCharData(charID, callback) {
    let charState = generateSingleCharState(charID);
    updateSingleCharData(charState, function (updatedState) {
        if (callback) {
            callback(charState.data);
        }
    });
}

function getPlayerData(sheet_url, callback) {
    let charID = getPlayerIDFromSheet(sheet_url);
    getDDBCharData(charID, function (charData) {

        let conditions = [];
        for (var i = 0; i < charData.conditions.length; i++) {
            let condition = charData.conditions[i];
            let conditionString = condition.definition.name;
            if (condition.level) {
                conditionString += " (Level " + condition.level + ")";
            }
            conditions.push(conditionString);
        }

        let abilities = [];
        for (var i = 0; i < charData.abilities.length; i++) {
            let modifier = "0";
            if (charData.abilities[i].modifier > 0) {
                modifier = "+" + charData.abilities[i].modifier;
            }
            else {
                modifier = charData.abilities[i].modifier;
            }
            let ability = {
                abilityName: charData.abilities[i].label,
                abilityAbbr: charData.abilities[i].name,
                modifier: modifier,
                score: charData.abilities[i].totalScore,
                save: charData.abilities[i].save,
            }
            abilities.push(ability);
        }
        let walkspeed = 30;
        for (var i = 0; i < charData.speeds.length; i++) {
            if (charData.speeds[i].key == "walk") {
                walkspeed = charData.speeds[i].distance;
            }
        }

        var playerdata = {
            id: sheet_url,
            hp: charData.hitPointInfo.remainingHp,
            max_hp: charData.hitPointInfo.totalHp,
            temp_hp: charData.hitPointInfo.tempHp,
            ac: charData.armorClass, 
            pp: charData.passivePerception,
            conditions: conditions,
            abilities: abilities,
            walking: walkspeed+ "ft.",
            inspiration: charData.inspiration,
        };
        if (callback) {
            callback(playerdata);
        }
    });

}

function generateSingleCharState(charID) {
    var stateTemplate = {
        appEnv: {
            authEndpoint: "https://auth-service.dndbeyond.com/v1/cobalt-token", characterEndpoint: "", characterId: 0, characterServiceBaseUrl: null, diceEnabled: true, diceFeatureConfiguration: {
                apiEndpoint: "https://dice-service.dndbeyond.com", assetBaseLocation: "https://www.dndbeyond.com/dice", enabled: true, menu: true, notification: false, trackingId: ""
            }, dimensions: { sheet: { height: 0, width: 1200 }, styleSizeType: 4, window: { height: 571, width: 1920 } }, isMobile: false, isReadonly: false, redirect: undefined, username: "example"
        },
        appInfo: { error: null },
        character: {},
        characterEnv: { context: "SHEET", isReadonly: false, loadingStatus: "LOADED" },
        confirmModal: { modals: [] },
        modal: { open: {} },
        ruleData: rulesData.ruleset,
        serviceData: { classAlwaysKnownSpells: {}, classAlwaysPreparedSpells: {}, definitionPool: {}, infusionsMappings: [], knownInfusionsMappings: [], ruleDataPool: rulesData.vehiclesRuleset, vehicleComponentMappings: [], vehicleMappings: [] },
        sheet: { initError: null, initFailed: false },
        sidebar: { activePaneId: null, alignment: "right", isLocked: false, isVisible: false, panes: [], placement: "overlay", width: 340 },
        syncTransaction: { active: false, initiator: null },
        toastMessage: {}
    }

    //console.debug("Generating char: " + charID);
    var charState = {
        url: charJSONurlBase + charID,
        state: stateTemplate,
        data: {}
    }
    charState.state.appEnv.characterId = charID;

    for (let ruleID in optionalRules) {
        charState.state.serviceData.definitionPool[optionalRules[ruleID].category] = {
            accessTypeLookup: {},
            definitionLookup: {},
        };
    }

    return charState
}

function getCharacterJSON(charID, callback) {
    if (charID < 0) {
        return;
    }
    get_cobalt_token(function (token) {
        $.ajax({
            url: charJSONurlBase + charID,
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + token);
            },
            xhrFields: {
                withCredentials: true
            },
            success: function (data) {
                // self.playerCache[playerid] = data;
                callback(data);
            }
        });
    });
}


function updateSingleCharData(charState, callback) {
    if (charState === undefined || window.moduleExport === undefined) {
        return;
    }
    //console.log("Retriving Char Data");
    var charURLs = [];
    charURLs.push(charState.url);
    getCharacterJSON(charState.state.appEnv.characterId, function (charJSON) {
        if (charJSON.success == null || charJSON.lenth < 1 || charJSON.success != true) {
            console.warn("charJSON " + charState.state.appEnv.characterId + " is null, empty or fail");
        }
        var charId = charJSON.data.id;
        //console.debug("Processing Char: " + charId);
        charState.state.character = charJSON.data;
        let promises = retriveCharacterRules(charState)
        Promise.all(promises).then(() => {
            var charData = window.moduleExport.getCharData(charState.state);
            charState.data = charData;
            if (callback) {
                callback(charState);
            }
        });
    });
}


function retriveRules() {
    return new Promise(function (resolve, reject) {
        console.log("Retriving Rules Data");
        getJSONfromURLs(rulesUrls).then((js) => {
            //console.log("Rules Data Processing Start");
            js.forEach(function (rule, index) {
                if (rule.success == null || rule.lenth < 1 || rule.success != true) {
                    console.warn("ruleset " + index + " is null, empty or fail");
                }
            });
            rulesData = {
                ruleset: js[0].data,
                vehiclesRuleset: js[1].data
            }
            //console.debug("Rules Data:");
            //console.debug(rulesData);
            resolve();
        }).catch((error) => {
            reject(error);
        });
    });
}

function retriveCharacterRules(charState) {
    let promises = [];
    //console.log("Looking for optional rules for " + charactersData[charId].data.name);
    for (let ruleID in optionalRules) {
        if (ruleID in charState.state.character && charState.state.character[ruleID].length > 0) {
            console.log("Optional ruleset for " + ruleID + " found.");
            promises.push(retriveCharacterRule(charState, ruleID));
        }
    }
    return promises;
}

function retriveCharacterRule(charState, ruleID) {
    let url = gameCollectionUrl.prefix + optionalRules[ruleID].category + gameCollectionUrl.postfix;

    let ruleIds = []
    for (let item of charState.state.character[ruleID]) {
        ruleIds.push(item[optionalRules[ruleID].id]);
    }

    let body = { "campaignId": null, "sharingSetting": 2, "ids": ruleIds };
    return new Promise(function (resolve, reject) {
        getJSONfromURLs([url], body).then((js) => {
            js.forEach(function (charJSON, index) {
                console.log("Retrived " + ruleID + " data, processing.");
                console.log(charJSON);
                if (charJSON.success && charJSON.data.definitionData != undefined) {
                    for (let data of charJSON.data.definitionData) {
                        charState.state.serviceData.definitionPool[optionalRules[ruleID].category].definitionLookup[data.id] = data;
                        charState.state.serviceData.definitionPool[optionalRules[ruleID].category].accessTypeLookup[data.id] = 1;
                    }
                }
                console.log(ruleID + " finished processing.");
            });
            resolve();

        }).catch((error) => {
            console.log(error);
            reject();
        });
    });
}

//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//        Custom additonal modules to be loaded with D&DBeyond's module loader
//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

var initalModules = {
    2080: function (module, __webpack_exports__, __webpack_require__) {
        "use strict";
        __webpack_require__.r(__webpack_exports__);
        console.log("Module 2080: start");
        // Unused modules:
        // var react = __webpack_require__(0);
        // var react_default = __webpack_require__.n(react);
        // var react_dom = __webpack_require__(84);
        // var react_dom_default = __webpack_require__.n(react_dom);
        // var es = __webpack_require__(10);
        //var dist = __webpack_require__(710);
        //var dist_default = __webpack_require__.n(dist);
        var Core = __webpack_require__(5);
        var character_rules_engine_lib_es = __webpack_require__(1);
        var character_rules_engine_web_adapter_es = __webpack_require__(136);

        var crk = "js";
        var ktl = "U";
        var cmov = "ab";

        var key = "";

        for (key in character_rules_engine_lib_es) {
            if (typeof character_rules_engine_lib_es[key].getAbilities === 'function') {
                crk = key;
                console.log("crk found: " + key);
            }
            if (typeof character_rules_engine_lib_es[key].getSenseTypeModifierKey === 'function') {
                ktl = key;
                console.log("ktl found: " + key);
            }
        }

        for (key in Core) {
            if (typeof Core[key].WALK !== 'undefined' && typeof Core[key].SWIM !== 'undefined' && typeof Core[key].CLIMB !== 'undefined' && typeof Core[key].FLY !== 'undefined' && typeof Core[key].BURROW !== 'undefined') {
                cmov = key;
                console.log("cmov found: " + key);
            }
        }

        var charf1 = character_rules_engine_lib_es[crk];
        var charf2 = character_rules_engine_lib_es[ktl];
        var coref1 = character_rules_engine_lib_es[cmov];

        //function getAuthHeaders() {
        //    return dist_default.a.makeGetAuthorizationHeaders({});

        //}

        function getCharData(state) {
            /*
                All parts of the following return are from http://media.dndbeyond.com/character-tools/characterTools.bundle.71970e5a4989d91edc1e.min.js, they are found in functions that have: '_mapStateToProps(state)' in the name, like function CharacterManagePane_mapStateToProps(state)
                Any return that uses the function character_rules_engine_lib_es or character_rules_engine_web_adapter_es can be added to this for more return values as this list is not comprehensive.
                Anything with selectors_appEnv is unnessisary,as it just returns values in state.appEnv.
            */
            console.log("Module 2080: Processing State Info Into Data");

            var ruleData = charf1.getRuleData(state);

            function getSenseData(senses) { // finds returns the label
                return Object.keys(senses).map(function (index) {
                    let indexInt = parseInt(index);
                    return {
                        id: indexInt,
                        key: charf2.getSenseTypeModifierKey(indexInt),
                        name: charf2.getSenseTypeLabel(indexInt),
                        distance: senses[indexInt]
                    }
                })
            }

            function getSpeedData(speeds) { // finds returns the label
                let halfSpeed = roundDown(divide(speeds[Core[cmov].WALK], 2));
                return Object.keys(speeds).map(function (index) {
                    let distance = speeds[index];
                    if (Core[cmov].SWIM === index || Core[cmov].CLIMB === index) {
                        // swim speed is essentiall half walking speed rounded down if character doesn't have a set swim speed:
                        // source https://www.dndbeyond.com/sources/basic-rules/adventuring#ClimbingSwimmingandCrawling
                        distance = speeds[index] <= 0 ? halfSpeed : speeds[index];
                    }
                    return {
                        id: charf2.getMovementTypeBySpeedMovementKey(index),
                        key: index,
                        name: charf2.getSpeedMovementKeyLabel(index, ruleData),
                        distance: distance
                    }
                });
            }

            return {
                name: charf1.getName(state),
                avatarUrl: charf1.getAvatarUrl(state),
                //spellCasterInfo: charf1.getSpellCasterInfo(state),
                hitPointInfo: charf1.getHitPointInfo(state),
                armorClass: charf1.getAcTotal(state),
                conditions: charf1.getActiveConditions(state),
                initiative: charf1.getProcessedInitiative(state),
                hasInitiativeAdvantage: charf1.getHasInitiativeAdvantage(state),
                resistances: charf1.getActiveGroupedResistances(state),
                immunities: charf1.getActiveGroupedImmunities(state),
                vulnerabilities: charf1.getActiveGroupedVulnerabilities(state),
                fails: charf1.getDeathSavesFailCount(state),
                successes: charf1.getDeathSavesSuccessCount(state),
                abilities: charf1.getAbilities(state),
                passivePerception: charf1.getPassivePerception(state),
                passiveInvestigation: charf1.getPassiveInvestigation(state),
                passiveInsight: charf1.getPassiveInsight(state),
                inspiration: charf1.getInspiration(state),
                speeds: getSpeedData(charf1.getCurrentWeightSpeed(state)),
                size: charf1.getSize(state),
                equipped: {
                    armorItems: charf1.getEquippedArmorItems(state),
                    weaponItems: charf1.getEquippedWeaponItems(state),
                    gearItems: charf1.getEquippedGearItems(state)
                },

                //originRefRaceData: charf1.getDataOriginRefRaceData(state),
                //optionalOrigins: charf1.getOptionalOrigins(state),

                //choiceInfo: charf1.getChoiceInfo(state),
                //classes: charf1.getClasses(state),
                //feats: charf1.getBaseFeats(state),
                //race: charf1.getRace(state),
                //currentXp: charf1.getCurrentXp(state),
                //preferences: charf1.getCharacterPreferences(state),
                //totalClassLevel: charf1.getTotalClassLevel(state),
                //spellCasterInfo: charf1.getSpellCasterInfo(state),
                //startingClass: charf1.getStartingClass(state),
                //background: charf1.getBackgroundInfo(state),
                //notes: charf1.getCharacterNotes(state),
                //totalWeight: charf1.getTotalWeight(state),
                //carryCapacity: charf1.getCarryCapacity(state),
                //pushDragLiftWeight: charf1.getPushDragLiftWeight(state),
                //encumberedWeight: charf1.getEncumberedWeight(state),
                //heavilyEncumberedWeight: charf1.getHeavilyEncumberedWeight(state),
                //preferences: charf1.getCharacterPreferences(state),
                //currencies: charf1.getCurrencies(state),
                //attunedSlots: charf1.getAttunedSlots(state),
                //attunableArmor: charf1.getAttunableArmor(state),
                //attunableGear: charf1.getAttunableGear(state),
                //attunableWeapons: charf1.getAttunableWeapons(state),
                //startingClass: charf1.getStartingClass(state),
                //background: charf1.getBackgroundInfo(state),
                //unequipped: {
                //    armorItems: charf1.getUnequippedArmorItems(state),
                //    weaponItems: charf1.getUnequippedWeaponItems(state),
                //    gearItems: charf1.getUnequippedGearItems(state)
                //},// not sure what the difference is between this and abilityLookup, seems to be one is a object, the other an array...
                //abilityLookup: charf1.getAbilityLookup(state),
                //proficiencyBonus: charf1.getProficiencyBonus(state),
                //preferences: charf1.getCharacterPreferences(state),
                //senses: getSenseData(charf1.getSenseInfo(state)), //has to be further processed
                //skills: charf1.getSkills(state),
                //customSkills: charf1.getCustomSkills(state),
                //savingThrowDiceAdjustments: charf1.getSavingThrowDiceAdjustments(state),
                //situationalBonusSavingThrowsLookup: charf1.getSituationalBonusSavingThrowsLookup(state),
                //deathSaveInfo: charf1.getDeathSaveInfo(state),
                //proficiencyGroups: charf1.getProficiencyGroups(state),
                //background: charf1.getBackgroundInfo(state),
                //alignment: charf1.getAlignment(state),
                //height: charf1.getHeight(state),
                //weight: charf1.getWeight(state),
                //faith: charf1.getFaith(state),
                //skin: charf1.getSkin(state),
                //eyes: charf1.getEyes(state),
                //hair: charf1.getHair(state),
                //age: charf1.getAge(state),
                //gender: charf1.getGender(state),
                //traits: charf1.getCharacterTraits(state),
                //notes: charf1.getCharacterNotes(state),
                //levelSpells: charf1.getLevelSpells(state),
                //spellCasterInfo: charf1.getSpellCasterInfo(state),
                //ruleData: charf1.getRuleData(state),
                //xpInfo: charf1.getExperienceInfo(state),
                //spellSlots: charf1.getSpellSlots(state),
                //pactMagicSlots: charf1.getPactMagicSlots(state),
                //attunedSlots: charf1.getAttunedSlots(state),
                //hasMaxAttunedItems: charf1.hasMaxAttunedItems(state),
                //weaponSpellDamageGroups: charf1.getWeaponSpellDamageGroups(state),
                //inventory: charf1.getInventory(state),
                //creatures: charf1.getCreatures(state),
                //customItems: charf1.getCustomItems(state),
                //weight: charf1.getTotalWeight(state),
                //weightSpeedType: charf1.getCurrentWeightType(state),
                //notes: charf1.getCharacterNotes(state),
                //currencies: charf1.getCurrencies(state),
                //activatables: charf1.getActivatables(state),
                //attacks: charf1.getAttacks(state),
                //weaponSpellDamageGroups: charf1.getWeaponSpellDamageGroups(state),
                //attacksPerActionInfo: charf1.getAttacksPerActionInfo(state),
                //ritualSpells: charf1.getRitualSpells(state),
                //spellCasterInfo: charf1.getSpellCasterInfo(state),
                //hasSpells: charf1.hasSpells(state),
            }
        }
        window.moduleExport = {
            getCharData: getCharData,
            //getAuthHeaders: getAuthHeaders,
        }
        console.log("Module 2080: end");
    }
};

//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//        D&DBeyond Module Loader
//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

function loadModules(modules) {
    /*
        A near direct copy of the function from http://media.dndbeyond.com/character-tools/characterTools.bundle.71970e5a4989d91edc1e.min.js
        This basically loads in the modules in https://media.dndbeyond.com/character-tools/vendors~characterTools.bundle.f8b53c07d1796f1d29cb.min.js and similar module based scripts
        these are stored in window.jsonpDDBCT and can be loaded by this script and interacted with by active modules
    */
    console.log("Loading modules");
    function webpackJsonpCallback(data) {
        /*
            This allows additonal modules to be added run, the input format needs to be at least a two dimentional array,
            e.g. [[2],[function (module, exports, __webpack_require__) {...},...]] or [2],{34: function (module, exports, __webpack_require__) {...},...}] if you want to have set module id's
            you can also run modules by adding a third element to the argument data, e.g. [4],{69: function (module, __webpack_exports__, __webpack_require__) {...},...}, [69,4]] which will run the module 69 in chunk 4
            I am not 100% on the logic of this, so feel free to expand on this and futher comment to help out!
        */
        var chunkIds = data[0];
        var moreModules = data[1];
        var executeModules = data[2];
        var moduleId,
            chunkId,
            i = 0,
            resolves = [];
        for (; i < chunkIds.length; i++) {
            chunkId = chunkIds[i];
            if (Object.prototype.hasOwnProperty.call(installedChunks, chunkId) && installedChunks[chunkId]) {
                resolves.push(installedChunks[chunkId][0])
            }
            installedChunks[chunkId] = 0
        }
        for (moduleId in moreModules) {
            if (Object.prototype.hasOwnProperty.call(moreModules, moduleId)) {
                modules[moduleId] = moreModules[moduleId]
            }
        }
        if (parentJsonpFunction) parentJsonpFunction(data);
        while (resolves.length) {
            resolves.shift()()
        }
        deferredModules.push.apply(deferredModules, executeModules || []);
        return checkDeferredModules()
    }
    function checkDeferredModules() {
        var result;
        for (var i = 0; i < deferredModules.length; i++) {
            var deferredModule = deferredModules[i];
            var fulfilled = true;
            for (var j = 1; j < deferredModule.length; j++) {
                var depId = deferredModule[j];
                if (installedChunks[depId] !== 0) fulfilled = false
            }
            if (fulfilled) {
                deferredModules.splice(i--, 1);
                result = __webpack_require__(__webpack_require__.s = deferredModule[0])
            }
        }
        return result
    }
    var installedModules = {};
    var installedChunks = {
        0: 0
    };
    var deferredModules = [];
    function __webpack_require__(moduleId) {
        if (installedModules[moduleId]) {
            return installedModules[moduleId].exports
        }
        var module = installedModules[moduleId] = {
            i: moduleId,
            l: false,
            exports: {}
        };
        modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
        module.l = true;
        return module.exports
    }
    __webpack_require__.m = modules;
    __webpack_require__.c = installedModules;
    __webpack_require__.d = function (exports, name, getter) {
        if (!__webpack_require__.o(exports, name)) {
            Object.defineProperty(exports, name, {
                enumerable: true,
                get: getter
            })
        }
    };
    __webpack_require__.r = function (exports) {
        if (typeof Symbol !== "undefined" && Symbol.toStringTag) {
            Object.defineProperty(exports, Symbol.toStringTag, {
                value: "Module"
            })
        }
        Object.defineProperty(exports, "__esModule", {
            value: true
        })
    };
    __webpack_require__.t = function (value, mode) {
        if (mode & 1) value = __webpack_require__(value);
        if (mode & 8) return value;
        if (mode & 4 && typeof value === "object" && value && value.__esModule) return value;
        var ns = Object.create(null);
        __webpack_require__.r(ns);
        Object.defineProperty(ns, "default", {
            enumerable: true,
            value: value
        });
        if (mode & 2 && typeof value != "string") {
            for (var key in value) {
                __webpack_require__.d(ns, key, function (key) {
                    return value[key]
                }.bind(null, key));
            }
        }

        return ns
    };
    __webpack_require__.n = function (module) {
        var getter = module && module.__esModule ? function getDefault() {
            return module.default
        }
            : function getModuleExports() {
                return module
            };
        __webpack_require__.d(getter, "a", getter);
        return getter
    };
    __webpack_require__.o = function (object, property) {
        return Object.prototype.hasOwnProperty.call(object, property)
    };
    __webpack_require__.p = "";
    var jsonpArray = window.jsonpDDBCT = window.jsonpDDBCT || [];
    var oldJsonpFunction = jsonpArray.push.bind(jsonpArray); //This allows additonal modules to be added and run by using window.jsonpDDBCT.push(modules) which calls webpackJsonpCallback(modules) above
    jsonpArray.push2 = webpackJsonpCallback;
    jsonpArray = jsonpArray.slice();
    for (var i = 0; i < jsonpArray.length; i++) webpackJsonpCallback(jsonpArray[i]);
    var parentJsonpFunction = oldJsonpFunction;
    deferredModules.push([2080, 2]); //This sets module 2080 as an active module and is run after the other modules are loaded
    checkDeferredModules();
    console.log("Finished loading modules");
}

//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//        Generic Functions
//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

function isSuccessfulJSON(js, name) {
    let success = true;
    if (js.length < 1 || js.success == undefined) {
        console.warn("JSON " + name + " is malformed");
        return false;
    } else if (js.success == false) {
        console.warn("JSON " + name + "'s retrieval was unsuccessful");
        return false;
    } else if (js.success != true) {
        console.warn("JSON " + name + "'s retrieval was unsuccessful and is malformed");
        return false;
    } else if (js.data == undefined || js.data.length < 1) {
        console.warn("JSON " + name + "'s data is malformed");
        return false;
    }
    return true;
}

function getJSONfromURLs(urls, body, headers, cookies) {
    return new Promise(function (resolve, reject) {
        console.log("Fetching: ", urls);
        var proms = urls.map(d => fetchRequest(d, body, cookies));
        Promise.all(proms)
            .then(ps => Promise.all(ps.map(p => p.json()))) // p.json() also returns a promise
            .then(jsons => {
                console.log("JSON Data Retrived");
                resolve(jsons);
            })
            .catch((error) => {
                reject(error);
            });
    });
}
function fetchRequest(url, body, headers, cookies) {
    let options = {};
    let myHeaders = new Headers({
        'X-Custom-Header': 'hello world',
    });
    //for (let id in authHeaders) {
    //    myHeaders.append(id, authHeaders[id]);
    //}
    if (body != undefined && body != '') {
        options.method = 'POST'
        myHeaders.append('Accept', 'application/json');
        myHeaders.append('Content-Type', 'application/json');
        options.body = JSON.stringify(body);
    }
    if (cookies != undefined && cookies != '') {
        options.cookies = cookies;
    }
    options.credentials = 'include';
    options.headers = myHeaders;
    console.log(options);
    return fetch(url, options);
}

function getSign(input){
    if (input == null){
        input = 0;
    }
    return input >= 0 ? positiveSign : negativeSign
}

function roundDown(input){
    let number = parseInt(input);
    if (isNaN(number)) {
        return NaN;
    }
    return Math.floor(input);
}

function roundUp(input){
    let number = parseInt(input);
    if (isNaN(number)) {
        return NaN;
    }
    return Math.ceil(input);
}

function divide(numeratorInput, denominatorInput){
    let numerator = parseInt(numeratorInput);
    let denominator = parseInt(denominatorInput);
    if (isNaN(numerator) || isNaN(denominator)) {
        return NaN;
    }
    return numerator/denominator;
}

function distanceUnit(input){
    let number = parseInt(input);
    if (isNaN(number)) {
        number = 0;
    }
    let unit = 'ft.';
    if (number && number % FEET_IN_MILES === 0) {
        number = number / FEET_IN_MILES;
        unit = 'mile' + (Math.abs(number) === 1 ? '' : 's');
    }
    return unit;
}

function parseIntSafe(input) {
    let number = parseInt(input);
    if (isNaN(number)) {
        number = 0;
    }
    return number;
}

function parseBool(x) {
    return x ? true : false;
}

function areArraysEqualSets(a1, a2) {
    // canbax, https://stackoverflow.com/a/55614659
    const superSet = {};
    for (const i of a1) {
        const e = i + typeof i;
        superSet[e] = 1;
    }

    for (const i of a2) {
        const e = i + typeof i;
        if (!superSet[e]) {
            return false;
        }
        superSet[e] = 2;
    }

    for (let e in superSet) {
        if (superSet[e] === 1) {
            return false;
        }
    }

    return true;
}
