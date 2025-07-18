
class ItemType {
    static Folder = "folder";
    static MyToken = "myToken";
    static PC = "pc";
    static Monster = "monster";
    static BuiltinToken = "builtinToken";
    static DDBToken = "ddbToken";
    static Encounter = "encounter";
    static Scene = "scene";
    static Aoe = "aoe";
    static Open5e = "open5e"
}

class RootFolder {
    static Root = { name: "", path: "/", id: "root" };
    static Players = { name: "Players", path: "/Players", id: "playersFolder" };
    static Monsters = { name: "Monsters", path: "/Monsters", id: "monstersFolder" };
    static Open5e = { name: "Open5e Monsters", path: "/Open5e Monsters", id: "open5eFolder" };
    static MyTokens = { name: "My Tokens", path: "/My Tokens", id: "myTokensFolder" };
    static AboveVTT = { name: "AboveVTT Tokens", path: "/AboveVTT Tokens", id: "builtinTokensFolder" };
    static DDB = { name: "D&D Beyond Tokens", path: "/DDB", id: "_DDB" };
    static Encounters = { name: "Encounters", path: "/Encounters", id: "encountersFolder" };
    static Scenes = { name: "Scenes", path: "/Scenes", id: "scenesFolder" };
    static Aoe = { name: "Area of Effects", path: "/Area of Effects", id: "aoeFolder" };
    static allValues() {
           return [
               RootFolder.Root,
               RootFolder.Players,
               RootFolder.Monsters,
               RootFolder.Open5e,
               RootFolder.MyTokens,
               RootFolder.AboveVTT,
               RootFolder.Encounters,
               RootFolder.Scenes,
               RootFolder.DDB,
               RootFolder.Aoe
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

    /** {string} The id of the root folder this object is in. One of the options in RootFolder.*.id. This is most important for Folder types */
    rootId;

    /** {object} The same object structure as Token.options. This gets set on token.options during token creation */
    tokenOptions;

    /** Used internally during TokenCustomization construction to ensure data integrety */
    static validTypes = [ItemType.PC, ItemType.Monster, ItemType.Open5e, ItemType.MyToken, ItemType.BuiltinToken, ItemType.DDBToken, ItemType.Folder, ItemType.Aoe];

    /**
     * @param playerSheet {string} the id of the DDB character
     * @param tokenOptions {object} the overrides for token.options
     * @returns {TokenCustomization} the token customization for the player
     * @constructor
     */
    static PC(playerSheet, tokenOptions) {
        return new TokenCustomization(playerSheet, ItemType.PC, RootFolder.Players.id, RootFolder.Players.id, tokenOptions);
    }

    /**
     * @param monsterId {number|string} the id of the DDB monster
     * @param tokenOptions {object} the overrides for token.options
     * @returns {TokenCustomization} the token customization for the monster
     * @constructor
     */
    static Monster(monsterId, tokenOptions) {
        return new TokenCustomization(monsterId, ItemType.Monster, RootFolder.Monsters.id, RootFolder.MyTokens.id, tokenOptions);
    }

    /**
     * @param monsterId {number|string} the slug of the open 5e monster
     * @param tokenOptions {object} the overrides for token.options
     * @returns {TokenCustomization} the token customization for the monster
     * @constructor
     */
    static open5eMonster(monsterId, tokenOptions) {
        return new TokenCustomization(monsterId, ItemType.Open5e, RootFolder.Open5e.id, RootFolder.MyTokens.id, tokenOptions);
    }

    /**
     * @param id {string} the id of the MyToken object. eg: uuid()
     * @param parentId {string} the id of the Folder this belongs to. eg: uuid() or one of the options in RootFolder.*.id
     * @param tokenOptions {object} the overrides for token.options
     * @returns {TokenCustomization} the token customization for the MyToken
     * @constructor
     */
    static MyToken(id, parentId, tokenOptions) {
        return new TokenCustomization(id, ItemType.MyToken, parentId, RootFolder.MyTokens.id, tokenOptions);
    }

    /**
     * @param id {string} the id of the Folder object. eg: uuid()
     * @param parentId {string} the id of the Folder this belongs to. eg: uuid() or one of the options in RootFolder.*.id
     * @param tokenOptions {object} the overrides for token.options
     * @returns {TokenCustomization} the token customization for the Folder
     * @constructor
     */
    static Folder(id, parentId, rootId, tokenOptions) {
        return new TokenCustomization(id, ItemType.Folder, parentId, rootId, tokenOptions);
    }

    /**
     * @param obj {object} the raw JSON object with the same structure as a TokenCustomization object
     * @returns {TokenCustomization} a typed object instead of the raw JSON object that was given
     */
    static fromJson(obj) {
        return new TokenCustomization(obj.id, obj.tokenType, obj.parentId, obj.rootId, obj.tokenOptions, obj.color, obj.encounterData);
    }

    // never call this directly! use the static functions above
    constructor(id, tokenType, parentId, rootId, tokenOptions, color=undefined, encounterData = undefined) {
        if (tokenType === ItemType.Monster) {
            id = `${id}`; // DDB uses numbers for monster ids, but we want to use strings to keep everything consistent
        }
        if (typeof id !== "string" || id.length === 0) {
            throw new Error(`Invalid id ${id}`);
        }
        if ((typeof rootId !== "string" || rootId.length === 0) && parentId != '_') {
            throw new Error(`Invalid rootId ${rootId}`);
        }
        if (!TokenCustomization.validTypes.includes(tokenType)) {
            throw new Error(`Invalid Type ${tokenType}`);
        }
        if (typeof parentId !== "string" || parentId.length === 0) {
            throw new Error(`Invalid parentId ${parentId}`);
        }
        this.id = id;
        this.tokenType = tokenType;
        this.parentId = parentId;
        this.rootId = rootId;
        this.color = color;
        if (typeof tokenOptions === "object") {
            this.tokenOptions = {...tokenOptions}; // copy it
        } else {
            this.tokenOptions = {};
        }
        if (typeof encounterData === "object") {
            this.encounterData = {...encounterData};
        }
    }

    setTokenOption(key, value) {
        let currSrc = $('.sidebar-panel-body .example-token.selected .div-token-image')?.attr('src')
        let target = this.tokenOptions;
        if(currSrc != undefined){
            if(this.tokenOptions.alternativeImagesCustomizations == undefined)
                this.tokenOptions.alternativeImagesCustomizations = {};
            if(this.tokenOptions.alternativeImagesCustomizations[currSrc] == undefined)
                this.tokenOptions.alternativeImagesCustomizations[currSrc] ={};
            target = this.tokenOptions.alternativeImagesCustomizations[currSrc]
        }

        console.debug("setTokenOption", key, value);
        if (value === undefined) {
            delete target[key];
        } else if (key === "name") { // we want to special case "name" because we want to guarantee that it's a string
            if (typeof value === "string") {
                target[key] = value;
            } else {
                target[key] = `${value}`;
            }
        } else if (value === true || value === "true") {
            target[key] = true;
        } else if (value === false || value === "false") {
            target[key] = false;
        } else if (!isNaN(parseFloat(value)) && typeof value === "string") {
            if(key.includes(".")){
                const keys = key.split('.');
                if(keys.length == 2){
                    if(target[keys[0]] == undefined)
                        target[keys[0]] = {};
                    if (value.includes(".")) {
                        target[keys[0]][keys[1]] = parseFloat(value);
                    } else {
                        target[keys[0]][keys[1]] = parseInt(value);
                    } 
                }
            }
            else{
                if (value.includes(".")) {
                    target[key] = parseFloat(value);
                } else {
                    target[key] = parseInt(value);
                }
            }
        } else {
            if(key.includes(".")){
                const keys = key.split('.');
                if(keys.length == 2){
                    if(target[keys[0]] == undefined)
                        target[keys[0]] = {};
                    target[keys[0]][keys[1]] = value;
                }
            }
            else{
                target[key] = value;
            }
            
        }
    }

    async addAlternativeImage(imageUrl) {
        if (imageUrl.startsWith("data:")) {
            return false;
        }
        if (this.tokenOptions.alternativeImages === undefined) {
            this.tokenOptions.alternativeImages = [];
        }
        const parsed = await parse_img(imageUrl);
        if (!this.tokenOptions.alternativeImages.includes(parsed)) {
            this.tokenOptions.alternativeImages.push(parsed);
            return true;
        } else {
            return false;
        }
    }
    async removeAlternativeImage(imageUrl) {
        if (this.tokenOptions.alternativeImages === undefined) {
            return;
        }
        let index = this.tokenOptions.alternativeImages.findIndex(i => i === imageUrl);
        if (typeof index === "number" && index >= 0) {
            if(this.tokenOptions.alternativeImagesCustomizations != undefined)
                delete this.tokenOptions.alternativeImagesCustomizations[this.tokenOptions.alternativeImages[index]];
            this.tokenOptions.alternativeImages.splice(index, 1);
        }
        const parsed = await parse_img(imageUrl);
        let parsedIndex = this.tokenOptions.alternativeImages.findIndex(i => parse_img(i) === parsed);
        if (typeof parsedIndex === "number" && parsedIndex >= 0) {
            if(this.tokenOptions.alternativeImagesCustomizations != undefined)
                delete this.tokenOptions.alternativeImagesCustomizations[this.tokenOptions.alternativeImages[parsedIndex]];
            this.tokenOptions.alternativeImages.splice(parsedIndex, 1);
        }
    }
    removeAllAlternativeImages() {
        this.tokenOptions.alternativeImages = [];
        this.tokenOptions.alternativeImagesCustomizations = {};
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
        if (parent && parent.parentId != this.id && parent.parentId != '') {
            let rootId = parent.rootId || RootFolder.allValues().find(d => parent.folderPath().includes(d.path) && d.name != '')?.id;
            let parentCustomization = find_or_create_token_customization(parent.tokenType, parent.id, parent.parentId, rootId);
            return parent.findAncestors(found);
        } else {
            let root = RootFolder.findById(this.parentId);
            if (root === undefined) {
                root = RootFolder.allValues().find(f => path_to_html_id(f.path) === this.parentId);
            }
            if (root !== undefined && root.id !== RootFolder.Root.id) {
                try {
                    let rootCustomization = find_or_create_token_customization(ItemType.Folder, root.id, RootFolder.Root.path, RootFolder.Root.path);
                    found.push(rootCustomization);
                } catch (error) {
                    console.warn("Failed to create root customization for", this, error);
                }
            }
            return found;
        }
    }
    folderPath() {
        if(this.parentId == '_'){
            return '/';
        }
        const parent = this.findParent();
        if (parent && parent.parentId != this.id && parent.parentId != '') {
            return sanitize_folder_path(parent.findAncestors().reverse().map(tc => tc.name()).join("/"));
        }
        const root = RootFolder.findById(this.parentId) || RootFolder.findById(this.rootId);
        if (root) {
            return root.path;
        } else {
            console.warn("TokenCustomization.folderPath() could not find the root!", this);
            return RootFolder.MyTokens.path;
        }
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
    isTypeOpen5eMonster() {
        return this.tokenType === ItemType.Open5e;
    }
    isTypeBuiltinToken() {
        return this.tokenType === ItemType.BuiltinToken;
    }
    isTypeDDBToken() {
        return this.tokenType === ItemType.DDBToken;
    }

    allCombinedOptions() {
        let combinedOptions = {};
        this.findAncestors().reverse().forEach(tc => {
            if (typeof tc.tokenOptions === "object") {
                combinedOptions = {...combinedOptions, ...tc.tokenOptions};
            }
        });
        return combinedOptions;
    }

    // this does not change tokenOptions.name or tokenOptions.alternativeImages. Everything else will be removed.
    clearTokenOptions() {
        let clearedOptions = {};
        if (this.tokenOptions.name !== undefined) {
            clearedOptions.name = this.tokenOptions.name;
        }
        if (Array.isArray(this.tokenOptions.alternativeImages)) {
            clearedOptions.alternativeImages = [...this.tokenOptions.alternativeImages];
        }
        if (this.tokenOptions.statBlock !== undefined) {
            clearedOptions.statBlock = this.tokenOptions.statBlock;
        }
        this.tokenOptions = clearedOptions;
    }

    rootFolder() {
        return RootFolder.findById(this.rootId);
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
 * @param rootId {string|number} the id of the RootFolder that will be created. EX: RootFolder.Player.id, RootFolder.Monster.id
 * @returns {TokenCustomization|undefined} a token customization for the item if found. If not found, a new TokenCustomization object will be created and returned.
 * @throws an error if a customization object cannot be created
 */
function find_or_create_token_customization(type, id, parentId, rootId) {
    return find_token_customization(type, id) || new TokenCustomization(id, type, parentId, rootId, {});
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
    if (!window.TOKEN_CUSTOMIZATIONS) {
        fetch_token_customizations(function() {
            if (!window.TOKEN_CUSTOMIZATIONS) {
                window.TOKEN_CUSTOMIZATIONS = [];
            }
            migrate_token_customizations();
        })
        return;
    }
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
                const existing = window.TOKEN_CUSTOMIZATIONS.find(tc => tc.tokenType === ItemType.PC && tc.id === playerId);
                if (existing) {
                    if (tokenOptions.images) {
                        tokenOptions.images.forEach(img => existing.addAlternativeImage(img));
                    }
                } else {
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
                }
            } else {
                console.debug("migrate_token_customizations did not migrate", oldCustomizations[playerId]);
            }
        }
        console.log("migrate_token_customizations finished migrating player customizations");

        // Monster customizations migration
        let monsterIdsToFetch = new Set();
        console.log("migrate_token_customizations starting to migrate monster customizations");
        for(let monsterIdNumber in window.CUSTOM_TOKEN_IMAGE_MAP) {
            const monsterId = `${monsterIdNumber}`; // monster ids are numbers, but we want it to be a string to be consistent with other ids
            let images = window.CUSTOM_TOKEN_IMAGE_MAP[monsterIdNumber];
            if (!Array.isArray(images)) {
                images = [];
            }
            const existing = window.TOKEN_CUSTOMIZATIONS.find(tc => tc.tokenType === ItemType.Monster && tc.id === monsterId);
            if (existing) {
                // already have one so just update it
                images.forEach(img => existing.addAlternativeImage(img));
            } else {
                const newCustomization = TokenCustomization.Monster(monsterId, { alternativeImages: [...images] });
                newCustomizations.push(newCustomization);
                console.debug("migrate_token_customizations migrated", monsterIdNumber, images, "to", newCustomization);
                monsterIdsToFetch.add(monsterIdNumber);
            }
        }
        console.log("migrate_token_customizations finished migrating monster customizations");

        const migratedFromMyTokens = migrate_convert_mytokens_to_customizations(mytokensfolders, mytokens);
        newCustomizations = newCustomizations.concat(migratedFromMyTokens);

        // fetch monsters so we can get the monster names
        console.log("migrate_token_customizations starting to fetch monsters to fill names");
        fetch_monsters([...monsterIdsToFetch], function (response) {
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
                console.error("migrate_token_customizations received a response that isn't an object", response);
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

function migrate_convert_mytokens_to_customizations(listOfMyTokenFolders, listOfMyTokens) {

    let easyFolderReference = {};
    window.TOKEN_CUSTOMIZATIONS.forEach(tc => {
        if (tc.tokenType === ItemType.Folder && tc.rootId === RootFolder.MyTokens.id) {
            const fullPath = tc.fullPath();
            easyFolderReference[fullPath] = tc.id;
        } 
    });
    listOfMyTokenFolders.forEach(folder => {
        const fullPath = sanitize_folder_path(`${RootFolder.MyTokens.path}/${folder.folderPath}/${folder.name}`);
        if (!easyFolderReference[fullPath]) {
            easyFolderReference[fullPath] = uuid();
        }
    });

    let newCustomizations = [];

    console.log("migrate_token_customizations starting to migrate mytokenfolders customizations");
    listOfMyTokenFolders.forEach(folder => {
        let fullPath = sanitize_folder_path(`${RootFolder.MyTokens.path}/${folder.folderPath}/${folder.name}`);
        const existing = window.TOKEN_CUSTOMIZATIONS.find(tc => tc.tokenType === ItemType.Folder && (tc.id === folder.id || tc.fullPath() === fullPath));
        if (existing) {
            console.debug("migrate_token_customizations path already exists", fullPath);
        } else {
            // old structure: { name: folderKey, folderPath: currentFolderPath, collapsed: true }
            let parentPath = sanitize_folder_path(`${RootFolder.MyTokens.path}/${folder.folderPath}`);
            let parentId = easyFolderReference[parentPath];
            if (typeof parentId !== "string" || parentId.length === 0) {
                parentId = RootFolder.MyTokens.id;
            }
            if (!folder.id) {
                folder.id = uuid();
                easyFolderReference[fullPath] = folder.id;
            }
            let newCustomization = TokenCustomization.Folder(folder.id, parentId, RootFolder.MyTokens.id, { name: folder.name });
            newCustomizations.push(newCustomization);
            console.debug("migrate_token_customizations migrated", sanitize_folder_path(`${folder.folderPath}/${folder.name}`), "to", newCustomization);
        }
    });
    console.log("migrate_token_customizations finished migrating mytokenfolders customizations");

    // newCustomizations.forEach(tc => existingPaths.add(tc.fullPath()));

    // MyToken migration
    console.log("migrate_token_customizations starting to migrate mytokens customizations");
    listOfMyTokens.forEach(async myToken => {
        let fullPath = sanitize_folder_path(`${RootFolder.MyTokens.path}/${myToken.folderPath}/${myToken.name}`);
        const existing = window.TOKEN_CUSTOMIZATIONS.find(tc => tc.tokenType === ItemType.MyToken && (tc.id === myToken.customizationId || tc.fullPath() === fullPath));
        if (existing) {
            console.debug("migrate_token_customizations path already exists", fullPath);
        } else {
            let parentPath = sanitize_folder_path(`${RootFolder.MyTokens.path}/${myToken.folderPath}`);
            let parentId = easyFolderReference[parentPath];
            if (typeof parentId !== "string" || parentId.length === 0) {
                parentId = RootFolder.MyTokens.id;
            }
            let tokenOptions = {...myToken};
            if (myToken.alternativeImages) {
                // Note: Spread syntax effectively goes one level deep while copying an array/object. Therefore, it may be unsuitable for copying multidimensional arrays/objects
                // alternativeImages should be the only non-primitive. We need to make sure it's properly copied and not referencing the old objet in any way
                tokenOptions.alternativeImages = [...myToken.alternativeImages]; //
            }
            else if(myToken.image){
                tokenOptions.alternativeImages = [await parse_img(myToken.image)]
            }
            delete tokenOptions.image;
            delete tokenOptions.folderpath;
            delete tokenOptions.folderPath;
            delete tokenOptions.didMigrateToMyToken;
            delete tokenOptions.oldFolderKey;
            let newCustomization = TokenCustomization.MyToken(uuid(), parentId, tokenOptions);
            newCustomizations.push(newCustomization);
            myToken.customizationId = newCustomization.id; // track the migration
            console.debug("migrate_token_customizations migrated", fullPath, "to", newCustomization);
        }
    });
    console.log("migrate_token_customizations finished migrating mytokens customizations");

    persist_my_tokens(); // we added ids to myTokens so we need to save that

    return newCustomizations;
}

function rollback_token_customizations_migration() {
    try {

        let storeImage = window.globalIndexedDB.transaction([`customizationData`], "readwrite")
        let objectStore = storeImage.objectStore(`customizationData`)


        let deleteRequest = objectStore.delete(`TokenCustomizations`);
        deleteRequest.onsuccess = (event) => {
          const objectStoreRequest = objectStore.add({customizationId: `TokenCustomizations`, 'customizationData': []});
        };
        deleteRequest.onerror = (event) => {
          const objectStoreRequest = objectStore.add({customizationId: `TokenCustomizations`, 'customizationData': []});
        };


        localStorage.setItem("TokenCustomizations", JSON.stringify([]));



        let playerCustomizations = read_player_token_customizations();
        for (let playerId in playerCustomizations) {
            playerCustomizations[playerId].didMigrate = false;
        }
        write_player_token_customizations(playerCustomizations);
        delete window.CUSTOM_TOKEN_IMAGE_MAP.didMigrate;
        save_custom_monster_image_mapping();
    } catch (error) {
        console.error("Failed to rollback token customization", error);
    }
}

function persist_all_token_customizations(customizations, callback) {
    if (typeof callback !== 'function') {
        callback = function(){};
    }
    console.log("persist_all_token_customizations starting", customizations, JSON.stringify(customizations));

 
            

    let storeImage = globalIndexedDB.transaction([`customizationData`], "readwrite")
    let objectStore = storeImage.objectStore(`customizationData`)


    let deleteRequest = objectStore.delete(`TokenCustomizations`);
    deleteRequest.onsuccess = (event) => {
      const objectStoreRequest = objectStore.add({customizationId: `TokenCustomizations`, 'customizationData': customizations});
    };
    deleteRequest.onerror = (event) => {
      const objectStoreRequest = objectStore.add({customizationId: `TokenCustomizations`, 'customizationData': customizations});
    };

            
    try{
        /*stop saving this here in 1.30 - clear out at later date
        localStorage.setItem("TokenCustomizations", JSON.stringify(customizations));
        */
    }    
    catch(e){
        console.warn('localStorage saving Token Customizations Failed', e)
    }





    window.TOKEN_CUSTOMIZATIONS = customizations;
    callback(true);
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


        customization.tokenOptions = Object.fromEntries(Object.entries(customization.tokenOptions).filter(([key, value]) => value != 'undefined'))
        let existingIndex = window.TOKEN_CUSTOMIZATIONS.findIndex(c => c.tokenType === customization.tokenType && c.id === customization.id);
        if (existingIndex >= 0) {
            window.TOKEN_CUSTOMIZATIONS[existingIndex] = customization;
        } else {
            window.TOKEN_CUSTOMIZATIONS.push(customization);
        } 


        if(customization.tokenType == 'pc'){
            if(window.all_token_objects[customization.id]){
                window.all_token_objects[customization.id].options = {
                    ...window.all_token_objects[customization.id].options,
                    ...customization.tokenOptions,
                }
                if(customization.tokenOptions.tokenSize) {
                    window.all_token_objects[customization.id].options = {
                        ...window.all_token_objects[customization.id].options,
                        size: customization.tokenOptions.tokenSize * window.CURRENT_SCENE_DATA.hpps,
                        gridSquares: customization.tokenOptions.tokenSize
                    }
                }
            }
        }
        
       

        // TODO: call the API with a single object instead of persisting everything
        persist_all_token_customizations(window.TOKEN_CUSTOMIZATIONS, callback);

    } catch (error) {
        console.error("failed to persist customization", customization, error);
        callback(false);
    }
}

function fetch_token_customizations(callback) {
    if (!window.DM) return;
    if (typeof callback !== 'function') {
        callback = function(){};
    }
    try {
        console.log("fetch_token_customizations starting");
        // TODO: fetch from the cloud instead of storing locally

          
        let objectStore = globalIndexedDB.transaction(["customizationData"]).objectStore(`customizationData`)
        let promises = [];
        promises.push(new Promise((resolve) => { 
            let customMappingData = undefined;
            objectStore.get(`TokenCustomizations`).onsuccess = (event) => {
                if(event?.target?.result?.customizationData){
                   customMappingData = event?.target?.result?.customizationData
                }
                else {
                    let localCustomizations = localStorage.getItem('TokenCustomizations');
                    if(localCustomizations != null && localCustomizations !== undefined && localCustomizations !== "undefined")
                        customMappingData = $.parseJSON(localCustomizations)
                }
                let parsedCustomizations = [];


                
                if (customMappingData != undefined) {
                    console.debug("fetch_token_customizations customMappingData", customMappingData, typeof customMappingData);
                    customMappingData.forEach(obj => {
                        try {
                            let parsed = TokenCustomization.fromJson(obj);
                            parsedCustomizations.push(parsed);
                        } catch (error) {
                            // this one failed, but keep trying to parse the others
                            console.error("fetch_token_customizations failed to parse customization object", obj, error);
                        }
                    });
                }
                window.TOKEN_CUSTOMIZATIONS = parsedCustomizations;
                resolve(true);
            }
        }))
        Promise.all(promises).then((values) => {          
            callback(window.TOKEN_CUSTOMIZATIONS);
        })

        
    } catch (error) {
        console.error("fetch_token_customizations failed", error);
        callback(false);
    }
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
    let tokensToBeDeleted = window.TOKEN_CUSTOMIZATIONS.filter(tc => tc.parentId == parentId);
    for(i = 0; i < tokensToBeDeleted.length; i++){
        let statBlockID = tokensToBeDeleted[i].tokenOptions?.statBlock;
        if(statBlockID){
            delete window.JOURNAL.notes[statBlockID]
            if(window.JOURNAL.statBlocks)
                delete window.JOURNAL.statBlocks[statBlockID]
            window.JOURNAL.persist();
        }
    }


    window.TOKEN_CUSTOMIZATIONS = window.TOKEN_CUSTOMIZATIONS.filter(tc => tc.parentId !== parentId);

    persist_all_token_customizations(window.TOKEN_CUSTOMIZATIONS, callback);
}

function delete_token_customization_by_type_and_id(itemType, id, callback) {
    if (typeof callback !== 'function') {
        callback = function(){};
    }
    let index = window.TOKEN_CUSTOMIZATIONS.findIndex(tc => tc.tokenType === itemType && tc.id === id);

    if (index >= 0) {
        let statBlockID = window.TOKEN_CUSTOMIZATIONS[index]?.tokenOptions?.statBlock;
        if(statBlockID){
            delete window.JOURNAL.notes[statBlockID]
            if(window.JOURNAL.statBlocks)
                delete window.JOURNAL.statBlocks[statBlockID]
            window.JOURNAL.persist();
        }
        window.TOKEN_CUSTOMIZATIONS.splice(index, 1);
    }
    persist_all_token_customizations(window.TOKEN_CUSTOMIZATIONS, callback);
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

function rebuild_ddb_npcs(redrawList = false) {
    if (!window.DM) {
        return;
    }
    if (!window.ddbPortraits) {
        fetch_ddb_portraits();
        return;
    }

    // remove any DDB items because we're about to rebuild them.
    window.tokenListItems = window.tokenListItems.filter(li => li.type !== ItemType.DDBToken);

    // Unfortunately, window.ddbConfigJson.raceGroups do not match the portrait ids. Those must be for monsters?
    // Anyway, this is how I collected the race ids. Navigate to https://www.dndbeyond.com/races and enter the following into the console
    /*
    let playableRaces = [];
    $("a.listing-card__link").each(function() {
        playableRaces.push( $(this).attr("href").match(/[^\/]+$/)[0] );
    })
    JSON.stringify(playableRaces)
    */
    // then copy the output and paste it into the JSON.parse here. Everything else is taken care of

    //"1121697-hadozee" is removed due to ddb removing the images.
    const playableRaceIds = JSON.parse('["1751436-dwarf","1751437-elf","1751440-halfling","1751441-human","1751434-aasimar","1751435-dragonborn","1751438-gnome","1751439-goliath","1751442-orc","1751443-tiefling","1026377-aarakocra","1026378-aasimar","1026379-air-genasi","1026380-bugbear","1026381-centaur","1026382-changeling","1026383-deep-gnome","1026384-duergar","1026385-earth-genasi","1026386-eladrin","814913-fairy","1026387-firbolg","1026388-fire-genasi","1026389-githyanki","1026390-githzerai","1026391-goblin","1026392-goliath","814914-harengon","1026393-hobgoblin","1026394-kenku","1026395-kobold","1026396-lizardfolk","1026397-minotaur","1026398-orc","1026399-satyr","1026400-sea-elf","1026401-shadar-kai","1026402-shifter","1026403-tabaxi","1026404-tortle","1026405-triton","1026406-water-genasi","1026407-yuan-ti","1214237-kender","1121694-astral-elf","1121695-autognome","1121696-giff","1121698-plasmoid","1121699-thri-kreen","883673-owlin","706719-lineages","410992-leonin","410993-satyr","260666-changeling","260720-kalashtar","260758-shifter","260828-warforged","169862-verdan","67624-centaur","67607-loxodon","67599-minotaur","67585-simic-hybrid","67582-vedalken","40-feral-tiefling","41-tortle","229754-locathah","302384-grung","25294-gith","24-aasimar","32-bugbear","25-firbolg","33-goblin","34-hobgoblin","28-kenku","516426-kobold","29-lizardfolk","516433-orc","30-tabaxi","31-triton","37-yuan-ti-pureblood","4-aarakocra","23-genasi","22-goliath","16-dragonborn","13-dwarf","3-elf","18-gnome","20-half-elf","14-halfling","2-half-orc","1-human","7-tiefling","1726258-bearfolk","1726259-darakhul","1726260-erina","1726261-quickstep","1726262-ratatosk","1726263-ravenfolk","1726264-satarre","1726265-shade","1726266-shadow-goblin","1726267-umbral-human","1699132-the-disembodied","1699133-wechselkind","1891766-dara","1891767-elf","1891768-nakudama","1592465-cervan","1592466-corvum","1592467-gallus","1592468-hedge","1592469-jerbeen","1592470-luma","1592471-mapach","1592472-raptor","1592473-strig","1592474-vulpin","1882284-cnidaran","1882285-cyclopian","1882286-gobboc","1882287-golynn","1882288-rakin","1816644-barding","1816645-dwarf","1816646-elf","1816647-hobbit","1816648-man-of-bree","1816649-ranger-of-the-north","1830523-etherean","1830524-geleton"]');

    const uglyCapitalization = function(str) {
        let capitalizeNext = true;
        let newString = "";
        for (let i = 0; i < str.length; i++) {
            let currentChar = str[i];
            if (capitalizeNext) {
                newString += currentChar.toUpperCase();
                capitalizeNext = false;
            } else {
                newString += currentChar;
                capitalizeNext = (currentChar === "-");
            }
        }
        return newString;
    }

    // process the list of ids into objects that can be parsed and matched to window.ddbPortraits
    // { "Aarakocra": [4, 1026377], "Human": [1] } // legacy and non-legacy get merged into the same list of portraits. I manually merge orc and orc-of-exandria as well
    let playableRaces = {};
    playableRaceIds.forEach(id => {
        let portraitId = parseInt(id);
        let name = uglyCapitalization(id.replace(`${portraitId}-`, ""));
        if (name.startsWith("Orc")) {
            name = "Orc"; // merge orc-of-exandria into orc.
        } else if (name.includes("Genasi") || name.includes("Simic")) { // Most names have hyphens, but Simic Hybrid and all the Genasi variants have spaces.
            name = name.replaceAll("-", " ");
        }
        console.debug("rebuild_ddb_npcs Adding playable race", name, portraitId);
        if (playableRaces[name]) {
            playableRaces[name].push(portraitId);
        } else {
            playableRaces[name] = [portraitId];
        }
    });

    for (let playableRaceName in playableRaces) {
        const portraitIds = playableRaces[playableRaceName];
        let altImages = [];
        portraitIds.forEach(pId => {
            altImages = altImages.concat(window.ddbPortraits.filter(p => p.raceId === pId).map(p => p.avatarUrl));
        });
        if (altImages.length > 0) { // no need to add it if DDB doesn't have any images for it
            window.tokenListItems.push(SidebarListItem.DDBToken({
                folderPath: "/",
                name: playableRaceName,
                alternativeImages: altImages
            }));
        } else {
            console.log("rebuild_ddb_npcs DDB doesn't have any images for", playableRaceName);
        }
    }

    if (redrawList) {
        redraw_token_list("", true, true);
    }
}

/*{
    "id": 2,
    "name": null,
    "avatarId": 10064,
    "avatarUrl": "https://www.dndbeyond.com/avatars/10/64/636339379309450725.png?width=150&height=150&fit=crop&quality=95&auto=webp",
    "raceId": 16,
    "subRaceId": null,
    "classId": null,
    "tags": [],
    "decorationKey": "2"
},*/
function fetch_ddb_portraits() {
    if (window.DM && !window.ddbPortraits) {
        window.ajaxQueue.addDDBRequest({
            url: "https://character-service.dndbeyond.com/character/v5/game-data/portraits?sharingSetting=2",
            success: function (responseData) {
                console.log("Successfully fetched config/json from DDB API");
                window.ddbPortraits = responseData.data;
                rebuild_ddb_npcs(true); // this is the first time we've had enough data to draw the list so do it
            },
            error: function (errorMessage) {
                console.warn("Failed to fetch config json from DDB API", errorMessage);
            }
        });
    }
}