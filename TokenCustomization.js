
class ItemType {
    static Folder = "folder";
    static MyToken = "myToken";
    static PC = "pc";
    static Monster = "monster";
    static BuiltinToken = "builtinToken";
    static Encounter = "encounter";
    static Scene = "scene";
}

class RootFolder {
    static Root = { name: "", path: "/", id: "root" };
    static Players = { name: "Players", path: "/Players", id: "playersFolder" };
    static Monsters = { name: "Monsters", path: "/Monsters", id: "monstersFolder" };
    static MyTokens = { name: "My Tokens", path: "/My Tokens", id: "myTokensFolder" };
    static AboveVTT = { name: "AboveVTT Tokens", path: "/AboveVTT Tokens", id: "builtinTokensFolder" };
    static Encounters = { name: "Encounters", path: "/Encounters", id: "encountersFolder" };
    static Scenes = { name: "Scenes", path: "/Scenes", id: "scenesFolder" };
    static allValues() {
           return [
               RootFolder.Root,
               RootFolder.Players,
               RootFolder.Monsters,
               RootFolder.MyTokens,
               RootFolder.AboveVTT,
               RootFolder.Encounters,
               RootFolder.Scenes
           ]
    }
    static allNames() {
        return RootFolder.allValues().map(f => f.name);
    }
    static allPaths() {
        return RootFolder.allValues().map(f => f.path);
    }
    static allIds() {
        return RootFolder.allValues().map(f => f.id);
    }
    static findById(id) {
        return RootFolder.allValues().find(folder => folder.id === id);
    }
    static findByName(name) {
        return RootFolder.allValues().find(folder => folder.name === name);
    }
    static findByPath(path) {
        return RootFolder.allValues().find(folder => folder.path === path);
    }
}

/**
 * @param name {string} the name displayed to the user
 * @param image {string} the src of the img tag
 * @param type {string} the type of item this represents. One of [folder, myToken, monster, pc]
 * @param folderPath {string} the folder this item is in */
class TokenCustomization {

    /** {string} The id of the TokenCustomization object. Typically, an uuid */
    id;

    /** {string} The type of item this TokenCustomization represents. See `validTypes` for possible options */
    type;

    /** {string} The id of the folder this object is in. Typically, an uuid or one of the options in RootFolder.*.id */
    parentId;

    /** {object} The same object structure as Token.options. This gets set on token.options during token creation */
    tokenOptions;

    /** Used internally during TokenCustomization construction to ensure data integrety */
    static validTypes = [ItemType.PC, ItemType.Monster, ItemType.MyToken, ItemType.Folder];

    /**
     * @param playerSheet {string} the id of the DDB character
     * @param tokenOptions {object} the overrides for token.options
     * @returns {TokenCustomization} the token customization for the player
     * @constructor
     */
    static PC(playerSheet, tokenOptions) {
        return new TokenCustomization(playerSheet, ItemType.PC, RootFolder.Players.id, tokenOptions);
    }

    /**
     * @param monsterId {number|string} the id of the DDB monster
     * @param tokenOptions {object} the overrides for token.options
     * @returns {TokenCustomization} the token customization for the monster
     * @constructor
     */
    static Monster(monsterId, tokenOptions) {
        return new TokenCustomization(`${monsterId}`, ItemType.Monster, RootFolder.Monsters.id, tokenOptions);
    }

    /**
     * @param id {string} the id of the MyToken object. eg: uuid()
     * @param parentId {string} the id of the Folder this belongs to. eg: uuid() or one of the options in RootFolder.*.id
     * @param tokenOptions {object} the overrides for token.options
     * @returns {TokenCustomization} the token customization for the MyToken
     * @constructor
     */
    static MyToken(id, parentId, tokenOptions) {
        return new TokenCustomization(id, ItemType.MyToken, parentId, tokenOptions);
    }

    /**
     * @param id {string} the id of the Folder object. eg: uuid()
     * @param parentId {string} the id of the Folder this belongs to. eg: uuid() or one of the options in RootFolder.*.id
     * @param tokenOptions {object} the overrides for token.options
     * @returns {TokenCustomization} the token customization for the Folder
     * @constructor
     */
    static Folder(id, parentId, tokenOptions) {
        return new TokenCustomization(id, ItemType.Folder, parentId, tokenOptions);
    }

    /**
     * @param obj {object} the raw JSON object with the same structure as a TokenCustomization object
     * @returns {TokenCustomization} a typed object instead of the raw JSON object that was given
     */
    static fromJson(obj) {
        return new TokenCustomization(obj.id, obj.tokenType, obj.parentId, obj.tokenOptions);
    }

    // never call this directly! use the static functions above
    constructor(id, tokenType, parentId, tokenOptions) {
        if (typeof id !== "string" || id.length === 0) {
            throw `Invalid id ${id}`;
        }
        if (!TokenCustomization.validTypes.includes(tokenType)) {
            throw `Invalid Type ${tokenType}`;
        }
        if (typeof parentId !== "string" || parentId.length === 0) {
            throw `Invalid parentId ${parentId}`;
        }
        this.id = id;
        this.tokenType = tokenType;
        this.parentId = parentId;
        if (typeof tokenOptions === "object") {
            this.tokenOptions = {...tokenOptions}; // copy it
        } else {
            this.tokenOptions = {};
        }
    }

    setTokenOption(key, value) {
        console.debug("setTokenOption", key, value);
        if (value === undefined) {
            delete this.tokenOptions[key];
        } else if (value === true || value === "true") {
            this.tokenOptions[key] = true;
        } else if (value === false || value === "false") {
            this.tokenOptions[key] = false;
        } else if (!isNaN(parseFloat(value)) && typeof value === "string") {
            if (value.includes(".")) {
                this.tokenOptions[key] = parseFloat(value);
            } else {
                this.tokenOptions[key] = parseInt(value);
            }
        } else {
            this.tokenOptions[key] = value;
        }
    }

    addAlternativeImage(imageUrl) {
        if (imageUrl.startsWith("data:")) {
            return;
        }
        if (this.tokenOptions.alternativeImages === undefined) {
            this.tokenOptions.alternativeImages = [];
        }
        const parsed = parse_img(imageUrl);
        if (!this.tokenOptions.alternativeImages.includes(parsed)) {
            this.tokenOptions.alternativeImages.push(parsed);
        }
    }
    removeAlternativeImage(imageUrl) {
        if (this.tokenOptions.alternativeImages === undefined) {
            return;
        }
        let index = this.tokenOptions.alternativeImages.findIndex(i => i === imageUrl);
        if (typeof index === "number" && index >= 0) {
            this.tokenOptions.alternativeImages.splice(index, 1);
        }
        const parsed = parse_img(imageUrl);
        let parsedIndex = this.tokenOptions.alternativeImages.findIndex(i => i === parsed);
        if (typeof parsedIndex === "number" && parsedIndex >= 0) {
            this.tokenOptions.alternativeImages.splice(parsedIndex, 1);
        }
    }
    removeAllAlternativeImages() {
        this.tokenOptions.alternativeImages = [];
    }
    randomImage() {
        if (this.tokenOptions.alternativeImages && this.tokenOptions.alternativeImages.length > 0) {
            let randomIndex = getRandomInt(0, this.tokenOptions.alternativeImages.length);
            return this.tokenOptions.alternativeImages[randomIndex];
        }
        return undefined;
    }
    alternativeImages() {
        if (Array.isArray(this.tokenOptions.alternativeImages)) {
            return this.tokenOptions.alternativeImages;
        }
        return [];
    }

    findParent() {
        return window.TOKEN_CUSTOMIZATIONS.find(tc => tc.id === this.parentId);
    }
    findAncestors(found = []) {
        found.push(this);
        let parent = this.findParent();
        if (parent) {
            return parent.findAncestors(found);
        } else {
            let root = RootFolder.findById(this.parentId);
            if (root === undefined) {
                root = RootFolder.allValues().find(f => path_to_html_id(f.path) === this.parentId);
            }
            if (root !== undefined && root.id !== RootFolder.Root.id) {
                try {
                    let rootCustomization = find_or_create_token_customization(ItemType.Folder, root.id, RootFolder.Root.path);
                    found.push(rootCustomization);
                } catch (error) {
                    console.warn("Failed to create root customization for", this, error);
                }
            }
            return found;
        }
    }
    folderPath() {
        const parent = this.findParent();
        if (parent) {
            return sanitize_folder_path(parent.findAncestors().reverse().map(tc => tc.name()).join("/"));
        }
        return RootFolder.findById(this.parentId).path;
    }
    fullPath() {
        return sanitize_folder_path(this.findAncestors().reverse().map(tc => tc.name()).join("/"));
    }
    // folderPath() {
    //     if (RootFolder.allIds().includes(this.id)) {
    //         return RootFolder.Root.path;
    //     }
    //     if (RootFolder.allIds().includes(this.parentId)) {
    //         return RootFolder.allValues().find(f => f.id === this.parentId)?.path;
    //     }
    //     const parent = this.findParent();
    //     if (parent) {
    //         return parent.fullPath();
    //     } else {
    //         return undefined; // idk what do here yet... I wouldn't expect this to ever happen
    //     }
    // }
    // fullPath() {
    //     return sanitize_folder_path(`${this.folderPath()}/${this.name()}`);
    // }
    name() {
        let n;
        if (this.tokenType === ItemType.PC) {
            let pc = window.pcs.find(pc => pc.sheet === this.id);
            n = pc?.name;
            if (!n) {
                console.warn("Failed to find pc name for token customization. This might happen if this pc is not part of this campaign", pc, this);
            }
        } else if (RootFolder.allIds().includes(this.id)) {
            n = RootFolder.findById(this.id).name;
        } else if (RootFolder.allPaths().map(p => path_to_html_id(p)).includes(this.id)) {
            n = RootFolder.allPaths().map(p => path_to_html_id(p)).name;
        } else {
            n = this.tokenOptions?.name;
            if (!n) {
                console.warn("Failed to find the name of a token customization", this);
            }
        }
        return n || "undefined";
    }
    isTypeMyToken() {
        return this.tokenType === ItemType.MyToken;
    }
    isTypeFolder() {
        return this.tokenType === ItemType.Folder;
    }
    isTypePC() {
        return this.tokenType === ItemType.PC;
    }
    isTypeMonster() {
        return this.tokenType === ItemType.Monster;
    }

    allCombinedOptions() {
        let combinedOptions = {};
        this.findAncestors().reverse().forEach(option => {
            combinedOptions = {...combinedOptions, ...option};
        });
        return combinedOptions;
    }
}

/**
 * @param type {string} the type of customization you're looking for. EX: ItemType.Monster
 * @param id {string|number} the id of the customization you're looking for. EX: pc.sheet, monsterData.id, etc
 * @returns {TokenCustomization|undefined} a token customization for the item if found, else undefined
 */
function find_token_customization(type, id) {
    return window.TOKEN_CUSTOMIZATIONS.find(c => c.tokenType === type && c.id === `${id}`); // convert it to a string just to be safe. DDB monsters use numbers for ids, but we use strings for everything
}

/**
 * @param type {string} the type of customization you're looking for. EX: ItemType.Monster
 * @param id {string|number} the id of the customization you're looking for. EX: pc.sheet, monsterData.id, etc
 * @param parentId {string|number} the id of the parent that will be created. EX: pc.sheet, monsterData.id, etc
 * @returns {TokenCustomization|undefined} a token customization for the item if found. If not found, a new TokenCustomization object will be created and returned.
 * @throws an error if a customization object cannot be created
 */
function find_or_create_token_customization(type, id, parentId) {
    return find_token_customization(type, id) || new TokenCustomization(id, type, parentId, {});
}

/**
 * @param playerSheet {string} the id of the DDB character
 * @returns {TokenCustomization|undefined} a token customization for the monster or undefined if not found
 */
function find_player_token_customization(playerSheet) {
    return window.TOKEN_CUSTOMIZATIONS.find(c => c.tokenType === ItemType.PC && c.id === playerSheet);
}

/**
 * @param playerSheet {string} the id of the DDB character
 * @returns {TokenCustomization} a token customization for the player. If it doesn't already exist, a new one will be created and returned
 */
function get_player_token_customization(playerSheet) {
    return find_player_token_customization(playerSheet) || TokenCustomization.PC(playerSheet, {});
}

function migrate_token_customizations() {
    load_custom_monster_image_mapping();
    if (window.CUSTOM_TOKEN_IMAGE_MAP.didMigrate === true) {
        console.log("migrate_token_customizations has already completed");
        return;
    }
    try {
        let newCustomizations = [];

        // PC customizations migration
        console.log("migrate_token_customizations starting to migrate player customizations");
        // converting from a map with the id as the key to a list of objects with the id inside the object
        let oldCustomizations = read_player_token_customizations();
        for (let playerId in oldCustomizations) {
            if (typeof playerId === "string" && playerId.length > 0) {
                let tokenOptions = {...oldCustomizations[playerId]};
                if (tokenOptions.images) {
                    // Note: Spread syntax effectively goes one level deep while copying an array/object. Therefore, it may be unsuitable for copying multidimensional arrays/objects
                    // images should be the only non-primitive. We need to make sure it's properly copied and not referencing the old objet in any way
                    tokenOptions.alternativeImages = [...tokenOptions.images];
                    delete tokenOptions.images;
                }
                delete tokenOptions.didMigrate;
                const newCustomization = TokenCustomization.PC(playerId, tokenOptions);
                newCustomizations.push(newCustomization);
                oldCustomizations[playerId].didMigrate = true;
                console.debug("migrate_token_customizations migrated", oldCustomizations[playerId], "to", newCustomization);
            } else {
                console.debug("migrate_token_customizations did not migrate", oldCustomizations[playerId]);
            }
        }
        console.log("migrate_token_customizations finished migrating player customizations");

        // Monster customizations migration
        let monsterIdsToFetch = new Set();
        console.log("migrate_token_customizations starting to migrate monster customizations");
        for(let monsterIdNumber in window.CUSTOM_TOKEN_IMAGE_MAP) {
            const images = window.CUSTOM_TOKEN_IMAGE_MAP[monsterIdNumber];
            if (Array.isArray(images)) {
                const monsterId = `${monsterIdNumber}`; // monster ids are numbers, but we want it to be a string to be consistent with other ids
                const newCustomization = TokenCustomization.Monster(monsterId, { alternativeImages: [...images] });
                newCustomizations.push(newCustomization);
                console.debug("migrate_token_customizations migrated", monsterIdNumber, images, "to", newCustomization);
                monsterIdsToFetch.add(monsterIdNumber);
            }
        }
        console.log("migrate_token_customizations finished migrating monster customizations");

        // MyToken and MyToken folders migration
        backfill_mytoken_folders(); // just in case
        let easyFolderReference = {};
        mytokensfolders.forEach(folder => {
            // old structure: { name: folderKey, folderPath: currentFolderPath, collapsed: true }
            folder.id = uuid();
            let fullPath = sanitize_folder_path(`${folder.folderPath}/${folder.name}`);
            easyFolderReference[fullPath] = folder;
        });

        console.log("migrate_token_customizations starting to migrate mytokenfolders customizations");
        mytokensfolders.forEach(folder => {
            // old structure: { name: folderKey, folderPath: currentFolderPath, collapsed: true }
            let parentPath = sanitize_folder_path(folder.folderPath);
            let parentId = easyFolderReference[parentPath]?.id;
            if (typeof parentId !== "string" || parentId.length === 0) {
                parentId = RootFolder.MyTokens.id;
            }
            let newCustomization = TokenCustomization.Folder(folder.id, parentId, { name: folder.name });
            newCustomizations.push(newCustomization);
            console.debug("migrate_token_customizations migrated", sanitize_folder_path(`${folder.folderPath}/${folder.name}`), "to", newCustomization);
        });
        console.log("migrate_token_customizations finished migrating mytokenfolders customizations");

        // MyToken migration
        console.log("migrate_token_customizations starting to migrate mytokens customizations");
        mytokens.forEach(myToken => {
            let parentPath = sanitize_folder_path(myToken.folderPath);
            let parentId = easyFolderReference[parentPath]?.id;
            if (typeof parentId !== "string" || parentId.length === 0) {
                parentId = RootFolder.MyTokens.id;
            }
            let tokenOptions = {...myToken};
            if (myToken.alternativeImages) {
                // Note: Spread syntax effectively goes one level deep while copying an array/object. Therefore, it may be unsuitable for copying multidimensional arrays/objects
                // alternativeImages should be the only non-primitive. We need to make sure it's properly copied and not referencing the old objet in any way
                tokenOptions.alternativeImages = [...myToken.alternativeImages]; //
            }
            delete tokenOptions.image;
            delete tokenOptions.folderpath;
            delete tokenOptions.folderPath;
            delete tokenOptions.didMigrateToMyToken;
            delete tokenOptions.oldFolderKey;
            let newCustomization = TokenCustomization.MyToken(uuid(), parentId, tokenOptions);
            newCustomizations.push(newCustomization);
            console.debug("migrate_token_customizations migrated", sanitize_folder_path(`${myToken.folderPath}/${myToken.name}`), "to", newCustomization);
        });
        console.log("migrate_token_customizations finished migrating mytokens customizations");


        // fetch monsters so we can get the monster names
        console.log("migrate_token_customizations starting to fetch monsters to fill names");
        window.EncounterHandler.fetch_monsters([...monsterIdsToFetch], function (response) {
            if (typeof response === "object") {
                response.forEach(m => {
                    let found = newCustomizations.find(c => c.tokenType === ItemType.Monster && c.id === `${m.id}`);
                    console.debug("migrate_token_customizations", found, m);
                    if (found && found.tokenOptions) {
                        found.tokenOptions.name = m.name;
                    }
                });
                console.log("migrate_token_customizations updated monsters with names");
                console.log("migrate_token_customizations attempting to persist all customizations");
                // Persist everything
                persist_all_token_customizations(newCustomizations, function (success, errorType) {
                    if (success === true) {
                        // TODO: remove them entirely at some point
                        write_player_token_customizations(oldCustomizations);
                        window.CUSTOM_TOKEN_IMAGE_MAP.didMigrate = true;
                        save_custom_monster_image_mapping();
                        console.log("migrate_token_customizations successfully persisted migrated customizations", newCustomizations);
                        did_change_mytokens_items();
                    } else {
                        console.error("migrate_token_customizations failed to persist new customizations", newCustomizations, errorType);
                    }
                });
            } else {
                console.error("migrate_token_customizations failed", error);
                console.log("migrate_token_customizations attempting to rollback the migration");
                rollback_token_customizations_migration();
            }
        });
    } catch (error) {
        console.error("migrate_token_customizations failed", error);
        console.log("migrate_token_customizations attempting to rollback the migration");
        rollback_token_customizations_migration();
    }
}

function rollback_token_customizations_migration() {
    try {
        localStorage.setItem("TokenCustomizations", JSON.stringify([]));
        let playerCustomizations = read_player_token_customizations();
        for (let playerId in playerCustomizations) {
            playerCustomizations[playerId].didMigrate = false;
        }
        write_player_token_customizations(playerCustomizations);
        window.CUSTOM_TOKEN_IMAGE_MAP.didMigrate = false;
        save_custom_monster_image_mapping();
    } catch (error) {
        console.error("Failed to rollback token customization", error);
    }
}

function persist_all_token_customizations(customizations, callback) {
    if (typeof callback !== 'function') {
        callback = function(){};
    }
    console.log("persist_all_token_customizations starting");
    // TODO: send to cloud instead of storing locally
    localStorage.setItem("TokenCustomizations", JSON.stringify(customizations));
    window.TOKEN_CUSTOMIZATIONS = customizations;
    callback(true);

    return; // TODO: remove everything above, and just do this instead

    let http_api_gw="https://services.abovevtt.net";
    let searchParams = new URLSearchParams(window.location.search);
    if(searchParams.has("dev")){
        http_api_gw="https://jiv5p31gj3.execute-api.eu-west-1.amazonaws.com";
    }

    window.ajaxQueue.addRequest({
        url: `${http_api_gw}/services?action=setTokenCustomizations&userId=todo`, // TODO: figure this out
        success: function (response) {
            console.log(`persist_all_token_customizations succeeded`, response);
            window.TOKEN_CUSTOMIZATIONS = customizations;
            callback(true);
        },
        error: function (errorMessage) {
            console.warn(`persist_all_token_customizations failed`, errorMessage);
            callback(false, errorMessage?.responseJSON?.type);
        }
    })
}

function persist_token_customization(customization, callback) {
    if (typeof callback !== 'function') {
        callback = function(){};
    }
    try {
        if (
            customization === undefined
            || typeof customization.id !== "string" || customization.id.length === 0
            || !TokenCustomization.validTypes.includes(customization.tokenType)
            || !customization.tokenOptions
        ) {
            console.warn("Not persisting invalid customization", customization);
            callback(false, "Invalid Customization");
            return;
        }

        let existingIndex = window.TOKEN_CUSTOMIZATIONS.findIndex(c => c.tokenType === customization.tokenType && c.id === customization.id);
        if (existingIndex >= 0) {
            window.TOKEN_CUSTOMIZATIONS[existingIndex] = customization;
        } else {
            window.TOKEN_CUSTOMIZATIONS.push(customization);
        }

        // TODO: call the API with a single object instead of persisting everything
        persist_all_token_customizations(window.TOKEN_CUSTOMIZATIONS, callback);

    } catch (error) {
        console.error("failed to persist customization", customization, error);
        callback(false);
    }
}

function fetch_token_customizations(callback) {
    if (typeof callback !== 'function') {
        callback = function(){};
    }
    try {
        console.log("persist_token_customizations starting");
        // TODO: fetch from the cloud instead of storing locally
        let customMappingData = localStorage.getItem('TokenCustomizations');
        let parsedCustomizations = [];
        if (customMappingData !== undefined && customMappingData != null) {
            $.parseJSON(customMappingData).forEach(obj => {
                try {
                    parsedCustomizations.push(TokenCustomization.fromJson(obj));
                } catch (error) {
                    // this one failed, but keep trying to parse the others
                    console.error("persist_token_customizations failed to parse customization object", obj);
                }
            });
        }
        window.TOKEN_CUSTOMIZATIONS = parsedCustomizations;
        callback(window.TOKEN_CUSTOMIZATIONS);
    } catch (error) {
        console.error("persist_token_customizations failed");
        callback(false);
    }

    return; // TODO: remove everything above, and just do this instead

    let http_api_gw="https://services.abovevtt.net";
    let searchParams = new URLSearchParams(window.location.search);
    if(searchParams.has("dev")){
        http_api_gw="https://jiv5p31gj3.execute-api.eu-west-1.amazonaws.com";
    }

    window.ajaxQueue.addRequest({
        url: `${http_api_gw}/services?action=getTokenCustomizations&userId=todo`, // TODO: figure this out
        success: function (response) {
            console.warn(`persist_token_customizations succeeded`, response);
            callback(response); // TODO: grabe the actual list of objects from the response
        },
        error: function (errorMessage) {
            console.warn(`persist_token_customizations failed`, errorMessage);
            callback(false, errorMessage?.responseJSON?.type);
        }
    });
}

// deletes everything within a folder
function delete_token_customization_by_parent_id(parentId, callback) {
    if (typeof callback !== 'function') {
        callback = function(){};
    }
    if (typeof parentId !== "string" || parentId.length === 0) {
        console.warn("delete_token_customization_by_parent_id received an invalid parentId", parentId);
        callback(false);
        return;
    }

    window.TOKEN_CUSTOMIZATIONS = window.TOKEN_CUSTOMIZATIONS.filter(tc => tc.parentId !== parentId);

    persist_all_token_customizations(window.TOKEN_CUSTOMIZATIONS, callback);

    return; // TODO: remove everything above, and just do this instead

    let http_api_gw="https://services.abovevtt.net";
    let searchParams = new URLSearchParams(window.location.search);
    if(searchParams.has("dev")){
        http_api_gw="https://jiv5p31gj3.execute-api.eu-west-1.amazonaws.com";
    }

    window.ajaxQueue.addRequest({
        url: `${http_api_gw}/services?action=deleteTokenCustomizations&parentId=${parentId}&userId=todo`, // TODO: figure this out
        type: "DELETE",
        success: function (response) {
            console.warn(`delete_token_customization succeeded`, response);
            let index = window.TOKEN_CUSTOMIZATIONS.findIndex(tc => tc.tokenType === customization.tokenType && tc.id === customization.id);
            if (index >= 0) {
                window.TOKEN_CUSTOMIZATIONS.splice(index, 1);
            }
            callback(true);
        },
        error: function (errorMessage) {
            console.warn(`delete_token_customization failed`, errorMessage);
            callback(false, errorMessage?.responseJSON?.type);
        }
    });
}

function delete_token_customization_by_type_and_id(itemType, id, callback) {
    if (typeof callback !== 'function') {
        callback = function(){};
    }
    let index = window.TOKEN_CUSTOMIZATIONS.findIndex(tc => tc.tokenType === itemType && tc.id === id);
    if (index >= 0) {
        window.TOKEN_CUSTOMIZATIONS.splice(index, 1);
    }
    persist_all_token_customizations(window.TOKEN_CUSTOMIZATIONS, callback);

    return; // TODO: remove everything above, and just do this instead

    let http_api_gw="https://services.abovevtt.net";
    let searchParams = new URLSearchParams(window.location.search);
    if(searchParams.has("dev")){
        http_api_gw="https://jiv5p31gj3.execute-api.eu-west-1.amazonaws.com";
    }

    window.ajaxQueue.addRequest({
        url: `${http_api_gw}/services?action=deleteTokenCustomization&id=${id}&tokenType=${itemType}&userId=todo`, // TODO: figure this out
        type: "DELETE",
        success: function (response) {
            console.warn(`delete_token_customization succeeded`, response);
            let index = window.TOKEN_CUSTOMIZATIONS.findIndex(tc => tc.tokenType === customization.tokenType && tc.id === customization.id);
            if (index >= 0) {
                window.TOKEN_CUSTOMIZATIONS.splice(index, 1);
            }
            callback(true);
        },
        error: function (errorMessage) {
            console.warn(`delete_token_customization failed`, errorMessage);
            callback(false, errorMessage?.responseJSON?.type);
        }
    });

}

function find_customization_for_placed_token(placedToken) {
    if (placedToken.options.itemType && placedToken.options.itemId) {
        return find_token_customization(placedToken.options.itemType, placedToken.options.itemId);
    } else if (placedToken.isMonster()) {
        return find_token_customization(ItemType.Monster, placedToken.options.id);
    } else if (placedToken.isPlayer()) {
        return find_token_customization(ItemType.PC, placedToken.options.id);
    } else {
        // we don't have any other way to find the customization :(
        return undefined;
    }
}
