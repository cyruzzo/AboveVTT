
mytokens = [];
emptyfolders = []; // a list of strings. not sure how to do this yet, but this will be a temporary place to store empty folders
rootfolders = [];

/**
 * @param dirtyPath {string} the path to sanitize
 * @returns {string} the sanitized path
 */
function sanitize_folder_path(dirtyPath) {
    let cleanPath = dirtyPath.replaceAll("///", "/").replaceAll("//", "/");
    // remove trailing slashes before adding one at the beginning. Otherwise, we return an empty string
    if (cleanPath.endsWith("/")) {
        cleanPath = cleanPath.slice(0, -1);
    }
    if (!cleanPath.startsWith("/")) {
        cleanPath = `/${cleanPath}`;
    }
    return cleanPath;
}

function migrate_to_my_tokens() {

    console.groupCollapsed("migrate_to_my_tokens");

    const migrateFolderAtPath = function(oldFolderPath) {
        let currentFolderPath = sanitize_folder_path(oldFolderPath);
        let folder = convert_path(currentFolderPath);
        if (folder.tokens) {
            for(let tokenKey in folder.tokens) {
                let oldToken = folder.tokens[tokenKey];
                if (oldToken.didMigrateToMyToken === true) {
                    // this token has already been migrated no need to migrate it again
                    continue;
                }
                let newToken = {};
                for (let k in oldToken) {
                    let v = oldToken[k];
                    if (k === "data-token-size") {
                        newToken.tokenSize = v;
                    } else if (k === "data-alternative-images") {
                        newToken.alternativeImages = v;
                    } else if (k.startsWith("data-")) {
                        newToken[k.replace("data-", "")] = v;
                    } else {
                        newToken[k] = v;
                    }
                }
                if (newToken.name === undefined) {
                    newToken.name = tokenKey;
                }
                newToken.folderPath = currentFolderPath;
                newToken.image = parse_img(newToken.img);
                delete newToken.img;
                let existing = mytokens.find(t => t.name === newToken.name && t.folderPath === newToken.folderPath)
                if (existing !== undefined) {
                    console.log("not adding duplicate token", newToken);
                } else {
                    console.log("successfully migrated token", newToken, "from", oldToken);
                    mytokens.push(newToken);
                }
                oldToken.didMigrateToMyToken = true;
            }
        } else {
            if (emptyfolders.includes(currentFolderPath)) {
                console.log("not adding duplicate empty folder", currentFolderPath);
            } else {
                emptyfolders.push(currentFolderPath);
            }
        }
        if (folder.folders) {
            for (let folderKey in folder.folders) {
                migrateFolderAtPath(`${currentFolderPath}/${folderKey}`);
            }
        }
    }

    migrateFolderAtPath(TokenListItem.PathRoot);
    persist_my_tokens();
    persist_customtokens();
    console.groupEnd();
}

function rollback_from_my_tokens() {
    mytokens = [];
    emptyfolders = [];
    persist_my_tokens();
    const rollbackFolderAtPath = function(oldFolderPath) {
        let currentFolderPath = sanitize_folder_path(oldFolderPath);
        let folder = convert_path(currentFolderPath);
        if (folder.tokens) {
            for (let tokenKey in folder.tokens) {
                let oldToken = folder.tokens[tokenKey];
                oldToken.didMigrateToMyToken = false;
            }
        }
    };
    rollbackFolderAtPath(TokenListItem.PathRoot);
}

/**
 * A ViewModel that represents a token (or folder) listed in the sidebar.
 * This is a transient object and is not intended to be used as a data source. Instead, each {type} determines where the data source is.
 * This is not a token that has been placed on a scene; that is an instance of {Token} and is
 * represented as a many {Token} to one {TokenListItem} relationship.
 * For example:
 *   This could represent a "Goblin" monster. Placing this on the scene several times would create several {Token} instances.
 *   Each of those {Token}s would be of type "monster".
 */
class TokenListItem {

    static TypeFolder = "folder";
    static TypeMyToken = "myToken";
    static TypePC = "pc";
    static TypeMonster = "monster";
    static TypeBuiltinToken = "builtinToken";

    static PathRoot = "/";
    static PathPlayers = "/Players";
    static PathMonsters = "/Monsters";
    static PathMyTokens = "/My Tokens";
    static PathAboveVTT = "/AboveVTT Tokens";

    static NamePlayers = "Players";
    static NameMonsters = "Monsters";
    static NameMyTokens = "My Tokens";
    static NameAboveVTT = "AboveVTT Tokens";

    /** Generic constructor for a TokenListItem. Do not call this directly. Use one of the static functions instead.
     * @param name {string} the name displayed to the user
     * @param image {string} the src of the img tag
     * @param type {string} the type of item this represents. One of [folder, myToken, monster, pc]
     * @param folderPath {string} the folder this token is in
     */
    constructor(name, image, type, folderPath = TokenListItem.PathRoot) {
        this.name = name;
        this.image = image;
        this.type = type;
        this.folderPath = sanitize_folder_path(folderPath);
    }
    static Folder(folderPath, name) {
        console.debug(`TokenListItem.Folder ${folderPath}/${name}`);
        return new TokenListItem(name, `${window.EXTENSION_PATH}assets/folder.svg`, TokenListItem.TypeFolder, folderPath);
    }
    static MyToken(tokenData) {
        console.debug("TokenListItem.MyToken", tokenData);
        return new TokenListItem(tokenData.name, tokenData.image, TokenListItem.TypeMyToken, `${TokenListItem.PathMyTokens}/${tokenData.folderPath}`);
    }
    static BuiltinToken(tokenData) {
        console.debug("TokenListItem.BuiltinToken", tokenData);
        return new TokenListItem(tokenData.name, tokenData.image, TokenListItem.TypeBuiltinToken, `${TokenListItem.PathAboveVTT}/${tokenData.folderPath}`);
    }
    static Monster(monsterData) {
        console.debug("TokenListItem.Monster", monsterData);
        let item = new TokenListItem(monsterData.name, monsterData.avatarUrl, TokenListItem.TypeMonster, TokenListItem.PathMonsters);
        item.monsterData = monsterData;
        return item;
    }
    static PC(sheet, name, image) {
        console.debug("TokenListItem.PC", sheet, name, image);
        let item = new TokenListItem(name, image, TokenListItem.TypePC, TokenListItem.PathPlayers);
        item.sheet = sheet;
        return item;
    }

    /**
     * A comparator for sorting by folder, then alphabetically.
     * @param lhs {TokenListItem}
     * @param rhs {TokenListItem}
     * @returns {number}
     */
    static sortComparator(lhs, rhs) {
        // always folders before tokens
        if (lhs.isTypeFolder() && !rhs.isTypeFolder()) { return -1; }
        if (!lhs.isTypeFolder() && rhs.isTypeFolder()) { return 1; }
        // alphabetically by name
        if (lhs.name.toLowerCase() < rhs.name.toLowerCase()) { return -1; }
        if (lhs.name.toLowerCase() > rhs.name.toLowerCase()) { return 1; }
        // equal
        return 0;
    }

    /**
     * A comparator for sorting by folder depth, then by folder, then alphabetically.
     * @param lhs {TokenListItem}
     * @param rhs {TokenListItem}
     * @returns {number}
     */
    static folderDepthComparator(lhs, rhs) {
        if (lhs.isTypeFolder() && rhs.isTypeFolder()) {
            if (lhs.folderDepth() < rhs.folderDepth()) { return -1; }
            if (lhs.folderDepth() > rhs.folderDepth()) { return 1; }
        }
        return TokenListItem.sortComparator(lhs, rhs);
    }

    /** @returns {string} path + name */
    fullPath() {
        return sanitize_folder_path(`${this.folderPath}/${this.name}`);
    }

    /** @returns {boolean} whether or not this item represents a Folder */
    isTypeFolder() { return this.type === TokenListItem.TypeFolder }

    /** @returns {boolean} whether or not this item represents a "My Token" */
    isTypeMyToken() { return this.type === TokenListItem.TypeMyToken }

    /** @returns {boolean} whether or not this item represents a Player */
    isTypePC() { return this.type === TokenListItem.TypePC }

    /** @returns {boolean} whether or not this item represents a Monster */
    isTypeMonster() { return this.type === TokenListItem.TypeMonster }

    /** @returns {boolean} whether or not this item represents a Builtin Token */
    isTypeBuiltinToken() { return this.type === TokenListItem.TypeBuiltinToken }

    canEdit() {
        switch (this.type) {
            case TokenListItem.TypeFolder:
                return this.folderPath.startsWith(TokenListItem.PathMyTokens);
            case TokenListItem.TypeMyToken:
            case TokenListItem.TypePC:
            case TokenListItem.TypeMonster:
                return true;
            case TokenListItem.TypeBuiltinToken:
            default:
                return false;
        }
    }

    canDelete() {
        switch (this.type) {
            case TokenListItem.TypeFolder:
                return this.folderPath.startsWith(TokenListItem.PathMyTokens);
            case TokenListItem.TypeMyToken:
                return true;
            case TokenListItem.TypePC:
            case TokenListItem.TypeMonster:
            case TokenListItem.TypeBuiltinToken:
            default:
                return false;
        }
    }

    folderDepth() {
        return this.fullPath().split("/").length;
    }
}

/**
 * @param html {*|jQuery|HTMLElement} the full path of the item.
 * @returns {TokenListItem|undefined} if found, else undefined
 */
function find_token_list_item(html) {
    if (html === undefined) return undefined;
    let foundItem;
    let fullPath = harvest_full_path(html);
    if (html.attr("data-monster") !== undefined) {
        // explicitly using '==' instead of '===' to allow (33253 == '33253') to return true
        foundItem = window.monsterListItems.find(item => item.monsterData.id == html.attr("data-monster"));
    }
    if (foundItem === undefined) {
        foundItem = rootfolders.find(item => item.fullPath() === fullPath);
    }
    if (foundItem === undefined) {
        foundItem = window.tokenListItems.find(item => item.fullPath() === fullPath);
    }
    if (foundItem === undefined) {
        foundItem = window.monsterListItems.find(item => item.fullPath() === fullPath);
    }
    if (foundItem === undefined && emptyfolders.includes(fullPath)) {
        let pathComponents = fullPath.split("/");
        let folderName = pathComponents.pop();
        let folderPath = pathComponents.join("/");
        let myTokensFolderPath = `${TokenListItem.PathMyTokens}/${folderPath}`;
        foundItem = TokenListItem.Folder(myTokensFolderPath, folderName);
    }
    if (foundItem === undefined) {
        console.warn(`find_token_list_item found nothing at path: ${fullPath}`);
    }
    return foundItem;
}

function find_html_row(item, container = tokensPanel.body) {
    if (item === undefined) return undefined;
    if (item.isTypeMonster()) {
        return container?.find(`[data-monster='${item.monsterData.id}']`);
    }
    return find_html_row_from_path(item.fullPath(), container);
}
function find_html_row_from_path(fullPath, container = tokensPanel.body) {
    if (fullPath === undefined) return undefined;
    return container?.find(`[data-full-path='${encode_full_path(fullPath)}']`);
}
function harvest_full_path(htmlRow) {
    if (htmlRow === undefined) return "";
    return decode_full_path(htmlRow.attr("data-full-path"));
}
function set_full_path(html, fullPath) {
    if (html === undefined) return;
    return html.attr("data-full-path", encode_full_path(fullPath)).addClass("list-item-identifier");
}
function encode_full_path(fullPath) {
    if (fullPath === undefined) return "";
    if (fullPath.startsWith("base64")) {
        // already encoded. just return it
        return fullPath;
    }
    return `base64${btoa(fullPath)}`;
}
function decode_full_path(fullPath) {
    if (fullPath === undefined) return "";
    if (fullPath.startsWith("base64")) {
        return atob(fullPath.replace("base64", ""));
    }
    // no need to decode
    return fullPath;
}
function matches_full_path(html, fullPath) {
    if (html === undefined || fullPath === undefined) return false;
    return html.attr("data-full-path") === encode_full_path(fullPath);
}


function find_my_token(fullPath) {
    if (!fullPath.startsWith(TokenListItem.PathMyTokens)) {
        console.warn("find_my_token was called with the wrong token type.", fullPath, "should start with", TokenListItem.PathMyTokens);
        return undefined;
    }
    console.groupCollapsed("find_my_token");
    let found = mytokens.find(t => {
        let dirtyPath = `${TokenListItem.PathMyTokens}${t.folderPath}/${t.name}`;
        let fullTokenPath = sanitize_folder_path(dirtyPath);
        console.debug("looking for: ", fullPath, dirtyPath, fullTokenPath, fullTokenPath === fullPath, t);
        return fullTokenPath === fullPath;
    });
    console.debug("found: ", found);
    console.groupEnd();
    return found;
}
function find_builtin_token(fullPath) {
    if (!fullPath.startsWith(TokenListItem.PathAboveVTT)) {
        console.warn("find_builtin_token was called with the wrong token type.", fullPath, "should start with", TokenListItem.PathAboveVTT);
        return undefined;
    }
    console.groupCollapsed("find_builtin_token");
    let found = builtInTokens.find(t => {
        let dirtyPath = `${TokenListItem.PathAboveVTT}${t.folderPath}/${t.name}`;
        let fullTokenPath = sanitize_folder_path(dirtyPath);
        console.debug("looking for: ", fullPath, dirtyPath, fullTokenPath, fullTokenPath === fullPath, t);
        return fullTokenPath === fullPath;
    });
    console.debug("found: ", found);
    console.groupEnd();
    return found;
}

function rebuild_token_items_list() {
    console.groupCollapsed("rebuild_token_items_list");

    // Players
    let tokenItems = window.pcs.map(pc => TokenListItem.PC(pc.sheet, pc.name, pc.image));

    // My Tokens
    let knownPaths = [];
    for (let i = 0; i < mytokens.length; i++) {
        let myToken = mytokens[i];
        let path = myToken.folderPath;
        if (path !== TokenListItem.PathRoot && !knownPaths.includes(path)) {
            // we haven't built this folder item yet so do that now
            let pathComponents = path.split("/");
            let folderName = pathComponents.pop();
            let folderPath = pathComponents.join("/");
            let myTokensFolderPath = `${TokenListItem.PathMyTokens}/${folderPath}`;
            tokenItems.push(TokenListItem.Folder(myTokensFolderPath, folderName));
            knownPaths.push(path);
        }
        tokenItems.push(TokenListItem.MyToken(myToken));
    }
    for (let i = 0; i < emptyfolders.length; i++) {
        let emptyFolderPath = emptyfolders[i];
        let components = emptyFolderPath.split("/");
        let folderName = components.pop();
        let folderPath = components.join("/");
        let myTokensFolderPath = `${TokenListItem.PathMyTokens}/${folderPath}`;
        tokenItems.push(TokenListItem.Folder(myTokensFolderPath, folderName));
    }

    // AboveVTT Tokens
    let allBuiltinPaths = builtInTokens
        .filter(item => item.folderPath !== TokenListItem.PathRoot && item.folderPath !== "" && item.folderPath !== undefined)
        .map(item => item.folderPath);
    let builtinPaths = [...new Set(allBuiltinPaths)];
    for (let i = 0; i < builtinPaths.length; i++) {
        let path = builtinPaths[i];
        let pathComponents = path.split("/");
        let folderName = pathComponents.pop();
        let folderPath = pathComponents.join("/");
        let builtinFolderPath = `${TokenListItem.PathAboveVTT}/${folderPath}`;
        tokenItems.push(TokenListItem.Folder(builtinFolderPath, folderName));
    }
    for (let i = 0; i < builtInTokens.length; i++) {
        tokenItems.push(TokenListItem.BuiltinToken(builtInTokens[i]));
    }

    window.tokenListItems = tokenItems;
    console.groupEnd();
}

function filter_token_list(searchTerm) {

    if (searchTerm === undefined || typeof searchTerm !== "string") {
        searchTerm = "";
    }

    redraw_token_list(searchTerm);

    let allFolders = tokensPanel.body.find(".folder");
    if (searchTerm.length > 0) {
        allFolders.removeClass("collapsed"); // auto expand all folders
        for (let i = 0; i < allFolders.length; i++) {
            let currentFolder = $(allFolders[i]);
            if (matches_full_path(currentFolder, TokenListItem.PathMonsters)) {
                // we always want the monsters folder to be open when searching
                continue;
            }
            let nonFolderDescendents = currentFolder.find(".tokens-panel-row:not(.folder)");
            if (nonFolderDescendents.length === 0) {
                // hide folders without results in them
                currentFolder.hide();
            }
        }
    }

    window.monsterListItems = []; // don't let this grow unbounded
    inject_monster_tokens(searchTerm, 0);
}

function inject_monster_tokens(searchTerm, skip) {
    search_monsters(searchTerm, skip, function (monsterSearchResponse) {
        let listItems = [];

        for (let i = 0; i < monsterSearchResponse.data.length; i++) {
            let m = monsterSearchResponse.data[i];
            let item = TokenListItem.Monster(m)
            window.monsterListItems.push(item);
            listItems.push(item);
        }
        console.log("converted", listItems);
        let monsterFolder = find_html_row_from_path('/Monsters');
        for (let i = 0; i < listItems.length; i++) {
            let item = listItems[i];
            let row = build_token_row(item);
            row.click();
            monsterFolder.find(`> .folder-token-list`).append(row);
        }
        if (searchTerm.length > 0) {
            monsterFolder.removeClass("collapsed");
        }
        console.log("search_monster pagination ", monsterSearchResponse.pagination.total, monsterSearchResponse.pagination.skip, monsterSearchResponse.pagination.total > monsterSearchResponse.pagination.skip);
        monsterFolder.find(".load-more-button").remove();
        if (monsterSearchResponse.pagination.total > (monsterSearchResponse.pagination.skip + 10)) {
            // add load more button
            let loadMoreButton = $(`<button class="ddbeb-button load-more-button" data-skip="${monsterSearchResponse.pagination.skip}">Load More</button>`);
            loadMoreButton.click(function(loadMoreClickEvent) {
                console.log("load more!", loadMoreClickEvent);
                let previousSkip = parseInt($(loadMoreClickEvent.currentTarget).attr("data-skip"));
                inject_monster_tokens(searchTerm, previousSkip + 10);
            });
            monsterFolder.find(`> .folder-token-list`).append(loadMoreButton);
        }
    });
}

function init_tokens_panel() {

    console.log("init_tokens_panel");

    rootfolders = [
        TokenListItem.Folder(TokenListItem.PathRoot, TokenListItem.NamePlayers),
        TokenListItem.Folder(TokenListItem.PathRoot, TokenListItem.NameMyTokens),
        TokenListItem.Folder(TokenListItem.PathRoot, TokenListItem.NameAboveVTT),
        TokenListItem.Folder(TokenListItem.PathRoot, TokenListItem.NameMonsters)
    ];

    if(localStorage.getItem('MyTokens') != null){
        mytokens = $.parseJSON(localStorage.getItem('MyTokens'));
    }
    if(localStorage.getItem('MyTokensEmptyFolders') != null){
        emptyfolders = $.parseJSON(localStorage.getItem('MyTokensEmptyFolders'));
    }
    if(localStorage.getItem('CustomTokens') != null){
        tokendata=$.parseJSON(localStorage.getItem('CustomTokens'));
    }

    migrate_to_my_tokens();
    rebuild_token_items_list();
    filter_token_list();

    let header = tokensPanel.header;
    // TODO: remove this warning once tokens are saved in the cloud
    header.append("<div class='panel-warning'>WARNING/WORKINPROGRESS. THIS TOKEN LIBRARY IS CURRENTLY STORED IN YOUR BROWSER STORAGE. IF YOU DELETE YOUR HISTORY YOU LOOSE YOUR LIBRARY</div>");

    let searchInput = $(`<input name="token-search" type="text" style="width:96%;margin:2%" placeholder="search tokens">`);
    searchInput.off("input").on("input", mydebounce(() => {
        let textValue = tokensPanel.header.find("input[name='token-search']").val();
        filter_token_list(textValue)
    }, 500));
    header.append(searchInput);

    register_token_row_context_menu();             // context menu for each row
    register_custom_monster_image_context_menu();  // context menu for images within the customization modal
}

function redraw_token_list(searchTerm) {
    if (!window.tokenListItems) {
        // don't do anything on startup
        return;
    }
    console.groupCollapsed("redraw_token_list");
    let list = $(`<div class="custom-token-list"></div>`);

    let nameFilter = "";
    if (searchTerm !== undefined && typeof searchTerm === "string") {
        nameFilter = searchTerm;
    }

    // first let's add our root folders
    for (let i = 0; i < rootfolders.length; i++) {
        list.append(build_token_row(rootfolders[i]));
    }

    // now let's add all other folders without filtering by searchTerm because we need the folder to exist in order to add items into it
    window.tokenListItems
        .filter(item => item.isTypeFolder())
        .sort(TokenListItem.folderDepthComparator)
        .forEach(item => {
            let row = build_token_row(item);
            console.debug("appending item", item);
            find_html_row_from_path(item.folderPath, list).find(` > .folder-token-list`).append(row);
        });

    // now let's add all the other items
    window.tokenListItems
        .filter(item => !item.isTypeFolder() && item.name.toLowerCase().includes(nameFilter))
        .sort(TokenListItem.sortComparator)
        .forEach(item => {
            let row = build_token_row(item);
            console.debug("appending item", item);
            find_html_row_from_path(item.folderPath, list).find(` > .folder-token-list`).append(row);
        });

    tokensPanel.body.empty();
    tokensPanel.body.append(list);
    update_pc_token_rows();
    console.groupEnd()
}

/**
 * @param listItem {TokenListItem} the list item that this row will represent
 * @param enableDrag {Boolean} whether or not this row can be dragged onto a scene to place a {Token} on the scene
 * @returns {*|jQuery|HTMLElement} that represents a row in the list of tokens in the sidebar
 */
function build_token_row(listItem, enableDrag = true) {

    let row = $(`<div class="tokens-panel-row"></div>`);
    set_full_path(row, listItem.fullPath());

    let rowItem = $(`<div class="tokens-panel-row-item"></div>`);
    row.append(rowItem);
    rowItem.on("click", did_click_row);

    let imgHolder = $(`<div class="tokens-panel-row-img"></div>`);
    rowItem.append(imgHolder);
    let img = $(`<img src="${parse_img(listItem.image)}" alt="${listItem.name} image" class="token-image" />`);
    imgHolder.append(img);

    let details = $(`<div class="tokens-panel-row-details"></div>`);
    rowItem.append(details);
    let title = $(`<div class="tokens-panel-row-details-title">${listItem.name}</div>`);
    details.append(title);
    let subtitle = $(`<div class="tokens-panel-row-details-subtitle"></div>`);
    details.append(subtitle);

    if (!listItem.isTypeFolder()) {
        let addButton = $(`
            <button class="token-row-button token-row-add" title="${listItem.name}">
                <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M7.2 10.8V18h3.6v-7.2H18V7.2h-7.2V0H7.2v7.2H0v3.6h7.2z"></path></svg>
            </button>
        `);
        rowItem.append(addButton);
        addButton.on("click", did_click_add_button);
    }

    switch (listItem.type) {
        case TokenListItem.TypeFolder:
            subtitle.hide();
            row.append(`<div class="folder-token-list"></div>`);
            row.addClass("folder");
            if (!rootfolders.includes(listItem)) {
                row.addClass("collapsed"); // only expand root folders by default
            }
            if (listItem.folderPath.startsWith(TokenListItem.PathMyTokens)) {
                // add buttons for creating subfolders and tokens
                let addFolder = $(`<button class="token-row-button"><span class="material-icons">create_new_folder</span></button>`);
                rowItem.append(addFolder);
                addFolder.on("click", function(clickEvent) {
                    clickEvent.stopPropagation();
                    let clickedRow = $(clickEvent.target).closest(".list-item-identifier");
                    let clickedItem = find_token_list_item(clickedRow);
                    create_folder_inside(clickedItem);
                });
                let addToken = $(`<button class="token-row-button"><span class="material-icons">person_add_alt_1</span></button>`);
                rowItem.append(addToken);
                addToken.on("click", function(clickEvent) {
                    let clickedRow = $(clickEvent.target).closest(".list-item-identifier");
                    let clickedItem = find_token_list_item(clickedRow);
                    create_token_inside(clickedItem);
                });
            }
            break;
        case TokenListItem.TypeMyToken:
            subtitle.hide();
            // TODO: Style specifically for My Tokens
            row.css("cursor", "default");
            break;
        case TokenListItem.TypePC:
            let playerData = window.PLAYER_STATS[listItem.sheet];
            if (playerData === undefined) {
                subtitle.text("loading character details");
                playerData = {
                    abilities: [
                        {abilityName: 'Strength', abilityAbbr: 'str', modifier: '?', score: '?', save: '?' },
                        {abilityName: 'Dexterity', abilityAbbr: 'dex', modifier: '?', score: '?', save: '?' },
                        {abilityName: 'Constitution', abilityAbbr: 'con', modifier: '?', score: '?', save: '?' },
                        {abilityName: 'Intelligence', abilityAbbr: 'int', modifier: '?', score: '?', save: '?' },
                        {abilityName: 'Wisdom', abilityAbbr: 'wis', modifier: '?', score: '?', save: '?' },
                        {abilityName: 'Charisma', abilityAbbr: 'cha', modifier: '?', score: '?', save: '?' }
                    ],
                    pp: '?',
                    inspiration: false,
                    walking: '?'
                };
            }
            row.addClass("player-row");
            let abilities = $(`<div class="player-card-footer">`);
            abilities.hide();
            abilities.append(playerData.abilities.map(a => `
                <div class="ability_value" data-ability="${a.abilityAbbr}">
                    <div class="ability_name">${a.abilityAbbr.toUpperCase()}</div>
                    <div class="ability_modifier">${a.modifier}</div>
                    <div class="ability_score">${a.score}</div>
                </div>
            `).join(''));
            row.append(abilities);
            let expandButton = $(`<div class="player-expansion-button"><span class="material-icons">expand_more</span></div>`);
            row.append(expandButton);
            expandButton.on("click", function (clickEvent) {
                clickEvent.stopPropagation();
                let r = $(clickEvent.target).closest(".tokens-panel-row");
                console.log(r);
                if (r.hasClass("expanded")) {
                    r.removeClass("expanded");
                    r.find(".player-card-footer").hide();
                    r.find(".player-expansion-button .material-icons").text("expand_more");
                } else {
                    r.addClass("expanded");
                    r.find(".player-card-footer").show();
                    r.find(".player-expansion-button .material-icons").text("expand_less");
                }
            });

            subtitle.text("");
            subtitle.show();
            subtitle.append(`<div class="subtitle-attibute"><span class="material-icons">visibility</span><span class="pp-value">${playerData.pp}</span></div>`);
            subtitle.append(`<div class="subtitle-attibute"><span class="material-icons">directions_run</span><span class="walking-value"">${playerData.walking}</span></div>`);
            subtitle.append(`<div class="subtitle-attibute inspiration"><img src="${window.EXTENSION_PATH}assets/inspiration.svg" title="Inspiration"  alt="inspiration"/></div>`);
            if (playerData.inspiration) {
                subtitle.find(".inspiration").show();
            } else {
                subtitle.find(".inspiration").hide();
            }

            row.find(".token-row-add").append(`<span class="material-icons">place</span>`);

            break;
        case TokenListItem.TypeMonster:
            row.attr("data-monster", listItem.monsterData.id);
            subtitle.append(`<div class="subtitle-attibute"><span class="plain-text">CR</span>${convert_challenge_rating_id(listItem.monsterData.challengeRatingId)}</div>`);
            if (listItem.monsterData.isHomebrew === true) {
                subtitle.append(`<div class="subtitle-attibute"><span class="material-icons">alt_route</span>Homebrew</div>`);
            } else if (listItem.monsterData.isReleased === false) {
                subtitle.append(`<div class="subtitle-attibute"><span class="material-icons" style="color:darkred">block</span>No Access</div>`);
            }

            break;
        case TokenListItem.TypeBuiltinToken:
            subtitle.hide();
            // TODO: Style specifically for Builtin
            row.css("cursor", "default");
            break;
    }

    if (listItem.canEdit() || listItem.isTypeBuiltinToken()) { // can't edit builtin, but need access to the list of images for drag and drop reasons.
        let settingsButton = $(`
            <div class="token-row-gear">
                <img src="${window.EXTENSION_PATH}assets/icons/cog.svg" style="width:100%;height:100%;"  alt="settings icon"/>
            </div>
    	`);
        rowItem.append(settingsButton);
        settingsButton.on("click", did_click_row_gear);
    }

    if (enableDrag && !listItem.isTypeFolder()) {
        enable_draggable_token_creation(rowItem);
    }
    return row;
}

function enable_draggable_token_creation(html, specificImage = undefined) {
    html.draggable({
        appendTo: "#VTTWRAPPER",
        zIndex: 100000,
        cursorAt: {top: 0, left: 0},
        cancel: '.token-row-gear',
        helper: function(event) {
            console.log("enable_draggable_token_creation helper");
            let draggedRow = $(event.target).closest(".list-item-identifier");
            let draggedItem = find_token_list_item(draggedRow);
            let helper = draggedRow.find("img.token-image").clone();
            if (specificImage !== undefined) {
                helper.attr("src", specificImage);
            } else {
                let randomImage = random_image_for_item(draggedItem);
                helper.attr("src", randomImage);
            }
            return helper;
        },
        start: function (event, ui) {
            console.log("enable_draggable_token_creation start");
            let draggedRow = $(event.target).closest(".list-item-identifier");
            let draggedItem = find_token_list_item(draggedRow);
            let tokenSize = token_size_for_item(draggedItem);
            let width = Math.round(window.CURRENT_SCENE_DATA.hpps) * tokenSize;
            let helperWidth = width / (1.0 / window.ZOOM);
            $(ui.helper).css('width', `${helperWidth}px`);
            $(this).draggable('instance').offset.click = {
                left: Math.floor(ui.helper.width() / 2),
                top: Math.floor(ui.helper.height() / 2)
            };
        },
        stop: function (event, ui) {
            event.stopPropagation(); // prevent the mouseup event from closing the modal
            // place a token where this was dropped
            console.log("enable_draggable_token_creation stop");
            let draggedRow = $(event.target).closest(".list-item-identifier");
            let draggedItem = find_token_list_item(draggedRow);
            let hidden = event.shiftKey || window.TOKEN_SETTINGS["hidden"];
            let src = $(ui.helper).attr("src");
            create_and_place_token(draggedItem, hidden, src, event.pageX, event.pageY);
        }
    });
}

function did_click_row(clickEvent) {
    console.log("did_click_row", clickEvent);
    let clickedRow = $(clickEvent.target).closest(".list-item-identifier");
    let clickedItem = find_token_list_item(clickedRow);
    console.log("did_click_row", clickedItem);

    switch (clickedItem.type) {
        case TokenListItem.TypeFolder:
            if (clickedRow.hasClass("collapsed")) {
                clickedRow.removeClass("collapsed");
            } else {
                clickedRow.addClass("collapsed");
            }
            break;
        case TokenListItem.TypeMyToken:
            // display_token_item_configuration_modal(clickedItem);
            break;
        case TokenListItem.TypePC:
            open_player_sheet(clickedItem.sheet);
            break;
        case TokenListItem.TypeMonster:
            if (clickedItem.monsterData.isReleased === true || clickedItem.monsterData.isHomebrew === true) {
                console.log(`Opening monster with id ${clickedItem.monsterData.id}, url ${clickedItem.monsterData.url}`);
                open_monster_item(clickedItem);
            } else {
                console.log(`User does not have access to monster with id ${clickedItem.monsterData.id}. Opening ${clickedItem.monsterData.url}`);
                window.open(clickedItem.monsterData.url, '_blank');
            }
            break;
        case TokenListItem.TypeBuiltinToken:
            // display_builtin_token_details_modal(clickedItem);
            break;
    }
}

function did_click_row_gear(clickEvent) {
    clickEvent.stopPropagation();
    console.log("did_click_row_gear", clickEvent);
    let clickedRow = $(clickEvent.target).closest(".list-item-identifier");
    let clickedItem = find_token_list_item(clickedRow);
    console.log("did_click_row_gear", clickedItem);
    display_token_item_configuration_modal(clickedItem);
}

function did_click_add_button(clickEvent) {
    clickEvent.stopPropagation();
    console.log("did_click_add_button", clickEvent);
    let clickedRow = $(clickEvent.target).closest(".list-item-identifier");
    let clickedItem = find_token_list_item(clickedRow);
    console.log("did_click_add_button", clickedItem);
    let hidden = clickEvent.shiftKey || window.TOKEN_SETTINGS["hidden"];
    create_and_place_token(clickedItem, hidden, undefined, undefined, undefined);
    update_pc_token_rows();
}

function update_pc_token_rows() {
    window.tokenListItems?.filter(listItem => listItem.isTypePC()).forEach(listItem => {
        let row = find_html_row(listItem);
        if (listItem.sheet in window.TOKEN_OBJECTS) {
            row.addClass("on-scene");
        } else {
            row.removeClass("on-scene");
        }

        let playerData = window.PLAYER_STATS[listItem.sheet];
        if (playerData !== undefined) {
            playerData.abilities.forEach(a => {
                let abilityValue = row.find(`[data-ability='${a.abilityAbbr}']`);
                abilityValue.find(".ability_modifier").text(a.modifier);
                abilityValue.find(".ability_score").text(a.score);

            });
            row.find(".tokens-panel-row-details-subtitle .pp-value").text(playerData.pp);
            row.find(".tokens-panel-row-details-subtitle .walking-value").text(playerData.pp);
            if (playerData.inspiration) {
                row.find(".tokens-panel-row-details-subtitle .inspiration").show();
            } else {
                row.find(".tokens-panel-row-details-subtitle .inspiration").hide();
            }
        }
    });
}

/**
 * Creates a {Token} object and places it on the scene.
 * @param listItem {TokenListItem} the item to create a token from
 * @param hidden {boolean} whether or not the created token should be hidden. Passing undefined will use whatever the global token setting is.
 * @param specificImage {string} the image to use. if undefined, a random image will be used
 * @param eventPageX {MouseEvent.pageX} if supplied, the token will be placed at this x coordinate, else centered in the view
 * @param eventPageY {MouseEvent.pageY} if supplied, the token will be placed at this y coordinate, else centered in the view
 */
function create_and_place_token(listItem, hidden = undefined, specificImage= undefined, eventPageX = undefined, eventPageY = undefined) {

    if (listItem === undefined) {
        console.warn("create_and_place_token was called without a listItem");
        return;
    }

    if (listItem.isTypeFolder()) {
        // find and place all items in this folder... but not subfolders
        (listItem.folderPath.startsWith(TokenListItem.PathMonsters) ? window.monsterListItems : window.tokenListItems)
            .filter(item => !item.isTypeFolder()) // if we ever want to add everything at every subfolder depth, remove this line
            .forEach(item => create_and_place_token(item, hidden));
        return;
    }

    let options = {
        name: listItem.name,
        listItemPath: listItem.fullPath(),
        hidden: hidden,
        imgsrc: random_image_for_item(listItem, specificImage)
    };

    switch (listItem.type) {
        case TokenListItem.TypeFolder:
            console.log("TODO: place all tokens in folder?", listItem);
            break;
        case TokenListItem.TypeMyToken:
            let myToken = find_my_token(listItem.fullPath());
            options.square = myToken.square;
            options.disableborder = myToken.disableborder;
            options.legacyaspectratio = myToken.legacyaspectratio;
            options.disablestat = true;
            let tokenSizeSetting = myToken.tokenSize;
            let tokenSize = parseInt(tokenSizeSetting);
            if (tokenSizeSetting === undefined || typeof tokenSizeSetting !== 'number') {
                tokenSize = 1;
                // TODO: handle custom sizes
            }
            options.tokenSize = tokenSize;
            break;
        case TokenListItem.TypePC:
            let pc = window.pcs.find(pc => pc.sheet === listItem.sheet);
            let playerData = window.PLAYER_STATS[listItem.sheet];
            if (pc === undefined) {
                console.warn(`failed to find pc for id ${listItem.sheet}`);
                return;
            }
            options.id = listItem.sheet;
            options.tokenSize = 1;
            options.hp = playerData ? playerData.hp : '';
            options.ac = playerData ? playerData.ac : '';
            options.max_hp = playerData ? playerData.max_hp : '';
            options.square = window.TOKEN_SETTINGS["square"];
            options.disableborder = window.TOKEN_SETTINGS['disableborder'];
            options.legacyaspectratio = window.TOKEN_SETTINGS['legacyaspectratio'];
            options.disablestat = window.TOKEN_SETTINGS['disablestat'];
            options.color = "#" + get_player_token_border_color(pc.sheet);
            break;
        case TokenListItem.TypeMonster:
            options.monster = listItem.monsterData.id;
            options.stat = listItem.monsterData.id;
            options.sizeId = listItem.monsterData.sizeId;
            options.hp = listItem.monsterData.averageHitPoints;
            options.max_hp = listItem.monsterData.averageHitPoints;
            options.ac = listItem.monsterData.armorClass;
            let placedCount = 1;
            for (let tokenId in window.TOKEN_OBJECTS) {
                if (window.TOKEN_OBJECTS[tokenId].options.monster === listItem.monsterData.id) {
                    placedCount++;
                }
            }
            if (placedCount > 1) {
                let color = TOKEN_COLORS[(placedCount - 1) % 54];
                console.log(`updating monster name with count: ${placedCount}, and setting color: ${color}`);
                options.name = `${listItem.name} ${placedCount}`;
                options.color = `#${color}`;
            }
            break;
        case TokenListItem.TypeBuiltinToken:
            let builtinToken = builtInTokens.find(t => t.name === listItem.name);
            console.log("create_and_place_token TokenListItem.TypeBuiltinToken options before", options, builtinToken);
            options = {...options, ...builtinToken}
            options.disablestat = true;
            break;
    }

    console.log("create_and_place_token about to place token with options", options);

    if (eventPageX === undefined || eventPageY === undefined) {
        place_token_in_center_of_map(options);
    } else {
        place_token_under_cursor(options, eventPageX, eventPageY);
    }
}

function token_size_for_item(listItem) {
    switch (listItem.type) {
        case TokenListItem.TypeFolder:
            return 1;
        case TokenListItem.TypeMyToken:
            let myToken = find_my_token(listItem.fullPath());
            let tokenSizeSetting = myToken.tokenSize;
            let tokenSize = parseInt(tokenSizeSetting);
            if (tokenSizeSetting === undefined || typeof tokenSizeSetting !== 'number') {
                tokenSize = 1; // TODO: handle custom sizes
            }
            return tokenSize;
        case TokenListItem.TypePC:
            return 1;
        case TokenListItem.TypeMonster:
            switch (listItem.monsterData.sizeId) {
                case 5: return 2;
                case 6: return 3;
                case 7: return 4;
                default: return 1;
            }
        case TokenListItem.TypeBuiltinToken:
            return 1;
    }
}

function random_image_for_item(listItem, specificImage) {
    let validSpecifiedImage = parse_img(specificImage);
    if (validSpecifiedImage !== undefined && validSpecifiedImage.length > 0) {
        console.debug("random_image_for_item validSpecifiedImage", validSpecifiedImage);
        return validSpecifiedImage
    }
    switch (listItem.type) {
        case TokenListItem.TypeMyToken:
            let myToken = find_my_token(listItem.fullPath());
            let myTokenAltImages = myToken.alternativeImages;
            if (myTokenAltImages !== undefined && myTokenAltImages.length > 0) {
                let randomIndex = getRandomInt(0, myTokenAltImages.length);
                console.debug("random_image_for_item myTokenAltImages", myTokenAltImages, randomIndex);
                return myTokenAltImages[randomIndex];
            } else {
                console.debug("random_image_for_item myTokenAltImages empty, returning", listItem.image);
                return listItem.image;
            }
        case TokenListItem.TypePC:
            console.debug("random_image_for_item calling random_image_for_player_token with", listItem.sheet);
            let randomPlayerImage = parse_img(random_image_for_player_token(listItem.sheet));
            if (randomPlayerImage !== undefined && randomPlayerImage.length > 0) {
                console.debug("random_image_for_item randomPlayerImage", randomPlayerImage);
                return randomPlayerImage;
            } else {
                console.debug("random_image_for_item randomPlayerImage not found, returning", listItem.image);
                return listItem.image;
            }
        case TokenListItem.TypeMonster:
            let randomMonsterImage = get_random_custom_monster_image(listItem.monsterData.id);
            if (randomMonsterImage !== undefined && randomMonsterImage.length > 0) {
                console.debug("random_image_for_item randomMonsterImage", randomMonsterImage);
                return randomMonsterImage;
            } else {
                console.debug("random_image_for_item randomMonsterImage not found, returning", listItem.image);
                return listItem.image;
            }
        case TokenListItem.TypeBuiltinToken:
            let bt = builtInTokens.find(bt => {
                console.log("random_image_for_item TypeBuiltinToken", listItem.fullPath(), sanitize_folder_path(`${TokenListItem.PathAboveVTT}${bt.folderPath}/${bt.name}`), listItem, bt);
                return listItem.fullPath() === sanitize_folder_path(`${TokenListItem.PathAboveVTT}${bt.folderPath}/${bt.name}`)
            })
            console.log("random_image_for_item TypeBuiltinToken found", bt);
            if (bt?.alternativeImages !== undefined && bt.alternativeImages.length > 0) {
                let randomIndex = getRandomInt(0, bt.alternativeImages.length);
                console.debug("random_image_for_item listItem.alternativeImages", bt.alternativeImages, randomIndex, bt.alternativeImages[randomIndex]);
                return bt.alternativeImages[randomIndex];
            } else {
                console.debug("random_image_for_item listItem.alternativeImages not found, returning", listItem.image);
                return listItem.image;
            }
        case TokenListItem.TypeFolder:
            console.debug("random_image_for_item folder returning", listItem.image);
            return listItem.image;
        default:
            console.warn("random_image_for_item unknown item type", listItem);
            return listItem.image;
    }
}

function search_monsters(searchTerm, skip, callback) {
    if (typeof callback !== 'function') {
        callback = function(){};
    }
    let offset = 0;
    let skipInt = parseInt(skip);
    if (!isNaN(skipInt)) {
        offset = skipInt;
    }
    let searchParam = "";
    if (searchTerm !== undefined && searchTerm.length > 0) {
        searchParam = `&search=${encodeURIComponent(searchTerm)}`;
    }
    window.ajaxQueue.addDDBRequest({
        url: `https://monster-service.dndbeyond.com/v1/Monster?skip=${offset}&take=10${searchParam}`,
        success: function (responseData) {
            console.log(`search_monsters succeeded`, responseData);
            callback(responseData); // TODO: return normalized data vs raw data?
        },
        failure: function (errorMessage) {
            console.warn(`search_monsters failed`, errorMessage);
            callback(false);
        }
    });
}

function register_token_row_context_menu() {

    // don't allow the context menu when right clicking on the add button since that adds a hidden token
    tokensPanel.body.find(".tokens-panel-row").on("contextmenu", ".token-row-add", function(event) {
        event.preventDefault();
        event.stopPropagation();
        let clickedRow = $(event.target).closest(".list-item-identifier");
        let clickedItem = find_token_list_item(clickedRow);
        create_and_place_token(clickedItem, true);
    });

    $.contextMenu({
        selector: ".tokens-panel-row",
        build: function(element, e) {

            let menuItems = {};

            let rowItem = find_token_list_item($(element));
            if (rowItem === undefined) {
                console.warn("register_token_row_context_menu failed to find row item", element, e)
                menuItems["unexpected-error"] = {
                    name: "An unexpected error occurred",
                    disabled: true
                };
                return { items: menuItems };
            }

            menuItems["place"] = {
                name: rowItem.isTypeFolder() ? "Place Tokens" : "Place Token",
                callback: function(itemKey, opt, originalEvent) {
                    let itemToPlace = find_token_list_item(opt.$trigger);
                    create_and_place_token(itemToPlace);
                }
            };

            menuItems["placeHidden"] = {
                name: rowItem.isTypeFolder() ? "Place Hidden Tokens" : "Place Hidden Token",
                callback: function(itemKey, opt, originalEvent) {
                    let itemToPlace = find_token_list_item(opt.$trigger);
                    create_and_place_token(itemToPlace, true);
                }
            };

            if (!rowItem.isTypeFolder()) {
                // copy url doesn't make sense for folders
                menuItems["copyUrl"] = {
                    name: "Copy Url",
                    callback: function(itemKey, opt, originalEvent) {
                        let itemToCopy = find_token_list_item(opt.$trigger);
                        copy_to_clipboard(itemToCopy.image);
                    }
                };
            }

            if (rowItem.canEdit() ) {
                menuItems["edit"] = {
                    name: "Edit",
                    callback: function(itemKey, opt, originalEvent) {
                        let itemToEdit = find_token_list_item(opt.$trigger);
                        display_token_item_configuration_modal(itemToEdit);
                    }
                };
            }

            if (rowItem.canDelete() ) {

                menuItems["border"] = "---";

                // not a built in folder or token, add an option to delete
                menuItems["delete"] = {
                    name: "Delete",
                    callback: function(itemKey, opt, originalEvent) {
                        let itemToDelete = find_token_list_item(opt.$trigger);
                        delete_item(itemToDelete);
                    }
                };
            }

            if (Object.keys(menuItems).length === 0) {
                menuItems["not-allowed"] = {
                    name: "You are not allowed to configure this item",
                    disabled: true
                };
            }
            return { items: menuItems };
        }
    });
}

function display_token_item_configuration_modal(listItem) {
    switch (listItem.type) {
        case TokenListItem.TypeFolder:
            if (listItem.folderPath.startsWith(TokenListItem.PathMyTokens)) {
                console.log("TODO: handle folder editing")
                display_folder_configure_modal(listItem);
            } else {
                console.warn("Only allowed to folders within the My Tokens folder");
                return;
            }
            break;
        case TokenListItem.TypeBuiltinToken:
            display_builtin_token_details_modal(listItem);
            break;
        case TokenListItem.TypeMyToken:
            display_my_token_configuration_modal(listItem);
            break;
        case TokenListItem.TypePC:
            display_player_token_customization_modal(listItem.sheet);
            break;
        case TokenListItem.TypeMonster:
            // TODO: rebuild this to use listItem like the others do
            display_monster_customization_modal(undefined, listItem.monsterData.id, listItem.name, listItem.image);
            break;
    }
}

function display_folder_configure_modal(listItem) {
    if (listItem === undefined || !listItem.isTypeFolder()) {
        console.warn("display_folder_configure_modal was called with an incorrect type", listItem);
        return;
    }

    let sidebarId = "token-folder-configuration-modal";
    let sidebarModal = new SidebarPanel(sidebarId, true);
    let listItemFullPath = listItem.fullPath();

    display_sidebar_modal(sidebarModal);

    sidebarModal.updateHeader(listItem.name, listItem.fullPath(), "Edit or delete this folder.");

    let folderNameInput = $(`<input type="text" title="Folder Name" name="folderName" value="${listItem.name}" />`);
    set_full_path(folderNameInput, listItemFullPath);
    sidebarModal.body.append(build_text_input_wrapper("Folder Name",
        folderNameInput,
        `<button>Save</button>`,
        function(newFolderName, input, event) {
            let foundItem = find_token_list_item($(input));
            let updateFullPath = rename_folder(foundItem, newFolderName);
            close_sidebar_modal();
            expand_all_folders_up_to(updateFullPath);
        }
    ));

    let deleteFolderAndMoveChildrenButton = $(`<button class="token-image-modal-remove-all-button" title="Delete this folder">Delete folder and<br />move items up one level</button>`);
    set_full_path(deleteFolderAndMoveChildrenButton, listItemFullPath);
    sidebarModal.footer.append(deleteFolderAndMoveChildrenButton);
    deleteFolderAndMoveChildrenButton.on("click", function(event) {
        let fullPath = harvest_full_path($(event.currentTarget));
        let foundItem = find_token_list_item($(event.currentTarget));
        delete_folder_and_move_children_up_one_level(foundItem);
        close_sidebar_modal();
        expand_all_folders_up_to(fullPath);
    });
    let deleteFolderAndChildrenButton = $(`<button class="token-image-modal-remove-all-button" title="Delete this folder and everything in it">Delete folder and<br />everything in it</button>`);
    set_full_path(deleteFolderAndChildrenButton, listItemFullPath);
    sidebarModal.footer.append(deleteFolderAndChildrenButton);
    deleteFolderAndChildrenButton.on("click", function(event) {
        let fullPath = harvest_full_path($(event.currentTarget));
        let foundItem = find_token_list_item($(event.currentTarget));
        delete_folder_and_delete_children(foundItem);
        close_sidebar_modal();
        expand_all_folders_up_to(fullPath);
    });

    sidebarModal.body.find(`input[name="folderName"]`).select();
}

function path_exists(folderPath) {
    if (mytokens.filter(token => token.folderPath === folderPath).length > 0) {
        return true;
    }
    return emptyfolders.includes(folderPath);
}

function create_folder_inside(listItem) {
    if (!listItem.isTypeFolder() || !listItem.folderPath.startsWith(TokenListItem.PathMyTokens)) {
        console.warn("create_folder_inside called with an incorrect item type", listItem);
        return;
    }

    let adjustedPath = listItem.fullPath().replace(TokenListItem.PathMyTokens, "");
    let newListItem = TokenListItem.Folder(adjustedPath, "New Folder");
    emptyfolders.push(newListItem.fullPath());
    did_change_items();
    // expand_all_folders_up_to(newListItem.fullPath());
    display_folder_configure_modal(newListItem);
}

function rename_folder(item, newName) {
    if (!item.isTypeFolder() || !item.folderPath.startsWith(TokenListItem.PathMyTokens)) {
        console.warn("rename_folder called with an incorrect item type", listItem);
        return;
    }
    console.groupCollapsed("rename_folder");
    if (!item.canEdit()) {
        console.warn("Not allowed to rename folder", item);
        console.groupEnd();
        return;
    }

    let fromFullPath = item.fullPath();
    let adjustedFolderPath = item.folderPath.replace(TokenListItem.PathMyTokens, "");
    let toFullPath = sanitize_folder_path(`${adjustedFolderPath}/${newName}`);
    if (path_exists(toFullPath)) {
        console.warn(`Attempted to rename folder to ${newName}, which would be have a path: ${toFullPath} but a folder with that path already exists`);
        console.groupEnd();
        return;
    }

    console.log(`updating tokens from ${fromFullPath} to ${toFullPath}`);
    let didUpdateTokens = false;
    let adjustedPath = fromFullPath.replace(TokenListItem.PathMyTokens, "");
    mytokens.filter(token => {
        console.debug(`filtering ${token.name} folderPath`, token.folderPath, adjustedPath);
        return token.folderPath === adjustedPath
    }).forEach(token => {
        console.debug(`changing ${token.name} folderpath`);
        token.folderPath = toFullPath;
        didUpdateTokens = true;
    });

    // if we updated a token with this path, that means that path is not empty so it's safe to remove it from our list
    // if the folder is empty, we want to replace it with toFullPath so we have to remove it anyway.
    array_remove_index_by_value(emptyfolders, adjustedPath);

    if (!didUpdateTokens) {
        // no tokens were updated which means fromFullPath was an empty folder
        emptyfolders.push(toFullPath);
    }

    console.debug(emptyfolders);
    emptyfolders = emptyfolders.map(f => {
        let oldName = f;
        let newName = f.replace(adjustedPath, toFullPath);
        console.debug(`changing empty folder ${oldName} to ${newName}`);
        return newName;
    });
    console.debug(emptyfolders);

    did_change_items();

    console.groupEnd();
    return toFullPath;
}

function delete_folder_and_delete_children(listItem) {
    if (!listItem.isTypeFolder() || !listItem.folderPath.startsWith(TokenListItem.PathMyTokens)) {
        console.warn("delete_folder_and_delete_children called with an incorrect item type", listItem);
        return;
    }
    if (!confirm(`Are you sure you want to delete "${listItem.name}"?\nAll items within it will also be deleted`)) {
        console.debug("delete_folder_and_delete_children was canceled by user", listItem);
        return;
    }

    console.groupCollapsed("delete_folder_and_delete_children");

    let adjustedPath = listItem.fullPath().replace(TokenListItem.PathMyTokens, "");
    console.log("about to delete folder and everything in", adjustedPath);

    mytokens.filter(token => {
        console.debug(`filtering ${token.name} folderPath`, token.folderPath, adjustedPath);
        return token.folderPath === adjustedPath;
    }).forEach(token => {
        console.debug(`deleting ${token.name}`, token);
        array_remove_index_by_value(mytokens, token);
    });

    console.debug("before deleting emptyfolders", emptyfolders);
    emptyfolders = emptyfolders.filter(f => !f.startsWith(adjustedPath));
    console.debug("after deleting emptyfolders", emptyfolders);

    did_change_items();
    let oneLevelUp = sanitize_folder_path(listItem.folderPath);
    expand_all_folders_up_to(oneLevelUp);

    console.groupEnd();
}

function delete_folder_and_move_children_up_one_level(listItem) {
    if (!listItem.isTypeFolder() || !listItem.folderPath.startsWith(TokenListItem.PathMyTokens)) {
        console.warn("delete_folder_and_move_children_up_one_level called with an incorrect item type", listItem);
        return;
    }
    if (!confirm(`Are you sure you want to delete "${listItem.name}"?\nAll items within it will be moved up one level.`)) {
        console.debug("delete_folder_and_move_children_up_one_level was canceled by user", listItem);
        return;
    }
    console.groupCollapsed("delete_folder_and_move_children_up_one_level");

    let adjustedPath = sanitize_folder_path(listItem.fullPath().replace(TokenListItem.PathMyTokens, ""));
    let oneLevelUp = sanitize_folder_path(listItem.folderPath.replace(TokenListItem.PathMyTokens, ""));
    console.log(`about to delete folder ${adjustedPath} and move its children up one level to ${oneLevelUp}`);

    mytokens.forEach(token => {
        if (token.folderPath === adjustedPath) {
            console.debug(`moving ${token.name} up one level`, token);
            token.folderPath = oneLevelUp;
        }
    });


    console.debug("before moving emptyfolders", emptyfolders);
    array_remove_index_by_value(emptyfolders, adjustedPath);
    emptyfolders = emptyfolders.map(f => {
        if (f.startsWith(adjustedPath)) {
            return f.replace(adjustedPath, oneLevelUp);
        } else {
            return f;
        }
    });
    console.debug("after moving emptyfolders", emptyfolders);

    did_change_items();
    expand_all_folders_up_to(oneLevelUp);

    console.groupEnd();
}

function delete_item(listItem) {
    if (!listItem.canDelete()) {
        console.warn("Not allowed to delete item", listItem);
        return;
    }
    console.error("TODO: delete_item", listItem);

    switch (listItem.type) {
        case TokenListItem.TypeFolder:
            delete_folder_and_delete_children(listItem);
            break;
        case TokenListItem.TypeMyToken:
            break;
        case TokenListItem.TypePC:
            break;
        case TokenListItem.TypeMonster:
            break;
        case TokenListItem.TypeBuiltinToken:
            break;
    }
}

function create_token_inside(listItem) {
    if (!listItem.isTypeFolder() || !listItem.folderPath.startsWith(TokenListItem.PathMyTokens)) {
        console.warn("create_token_inside called with an incorrect item type", listItem);
        return;
    }

    let newItem = TokenListItem.MyToken({
        name: "New Token",
        folderPath: listItem.fullPath()
    });
    console.log("create_token_inside created a new item", newItem);

    display_my_token_configuration_modal(newItem);
}

function display_my_token_configuration_modal(listItem, placedToken) {
    if (!listItem?.isTypeMyToken()) {
        console.warn("display_my_token_configuration_modal was called with incorrect item type", listItem);
        return;
    }

    // close any that are already open just to be safe
    close_sidebar_modal();
    let sidebarPanel = new SidebarPanel("mytokens-customization-modal");
    display_sidebar_modal(sidebarPanel);

    let name = listItem.name;
    let tokenSize = listItem.tokenSize;
    if (placedToken !== undefined) {
        if (placedToken.options.tokenSize !== undefined) {
            tokenSize = placedToken.options.tokenSize;
        }
        if (placedToken.options.name !== undefined && placedToken.options.name !== listItem.name) {
            // this token has a different name than the saved object
            name = placedToken.options.name;
        }
    }
    if (tokenSize === undefined) {
        // we haven't figured out the tokenSize yet so default to 1
        tokenSize = 1;
    }

    sidebarPanel.updateHeader(name, "", "When placing tokens, one of these images will be chosen at random. Right-click an image for more options.");
    redraw_token_images_in_modal(sidebarPanel, listItem, placedToken);

    // MyToken footer form

    let myToken = find_my_token(listItem.fullPath());

    const buildOptionSelect = function(name, disabledLabel, enabledLabel) {
        let inputElement = $(`
            <select name="${name}">
                <option value="default">Default</option>
                <option value="disabled">${disabledLabel}</option>
                <option value="enabled">${enabledLabel}</option>
            </select>
        `);

        // explicitly look for true/false because the default value is undefined
        let configuredValue = myToken[name];
        if (placedToken?.options[name] === true || placedToken?.options[name] === false) {
            configuredValue = placedToken.options[name];
        }
        if (configuredValue === true) {
            inputElement.val("enabled");
        } else if (configuredValue === false) {
            inputElement.val("disabled");
        } else {
            inputElement.val("default");
        }
        inputElement.change(function(event) {
            console.log("update", event.target.name , "to", event.target.value);
            switch (event.target.value) {
                case "enabled":
                    if (placedToken !== undefined) {
                        placedToken.options[name] = true;
                    } else {
                        myToken[name] = true;
                    }
                    break;
                case "disabled":
                    if (placedToken !== undefined) {
                        placedToken.options[name] = false;
                    } else {
                        myToken[name] = false;
                    }
                    break;
                default:
                    if (placedToken !== undefined) {
                        delete placedToken.options[name];
                    } else {
                        delete myToken[name];
                    }
                    break;
            }
            // is there a way to update all the images instead of redrawing them?
            if (placedToken !== undefined) {
                placedToken.place_sync_persist();
            } else {
                persist_my_tokens();
            }
            redraw_token_images_in_modal(sidebarPanel, listItem, placedToken);
        });
       return inputElement;
    };

    // token name
    let inputWrapper = sidebarPanel.inputWrapper;
    inputWrapper.append($(`<div class="token-image-modal-footer-title" style="width:100%;padding-left:0px">Token Name</div>`));
    let nameInput = $(`<input data-previous-name="${name}" title="token name" placeholder="my token name" name="addCustomName" type="text" style="width:100%" value="${name === undefined ? '' : name}" />`);
    nameInput.on('keyup', function(event) {
        if (event.key === "Enter" && event.target.value !== undefined && event.target.value.length > 0) {
            console.log("update token name to", event.target.value);
            if (placedToken !== undefined) {
                placedToken.options.name = event.target.value;
                placedToken.place_sync_persist();
            } else {
                let renameSucceeded = rename_my_token(myToken, event.target.value, true);
                if (renameSucceeded) {
                    persist_my_tokens();
                    rebuild_token_items_list();
                } else {
                    $(event.target).select();
                    return;
                }
            }
            listItem.name = event.target.value;
            sidebarPanel.updateHeader(event.target.value, "", "When placing tokens, one of these images will be chosen at random. Right-click an image for more options.");
            redraw_token_images_in_modal(sidebarPanel, listItem, placedToken);
        }
    });
    inputWrapper.append(nameInput);

    // token size
    let tokenSizeInput = temp_build_token_size_input(tokenSize, function (newSize) {
        console.log("do something with new token size", newSize)
    });
    inputWrapper.append(tokenSizeInput);
    inputWrapper.append(`<div class="sidebar-panel-header-explanation" style="padding-bottom:6px;">The following will override global settings for this token. Global settings can be changed in the settings tab.</div>`)

    // token type
    let tokenTypeInput = buildOptionSelect("square", "Round", "Square");
    let tokenTypeInputWrapper = build_select_input("Token Shape", tokenTypeInput);
    inputWrapper.append(tokenTypeInputWrapper);        // adds class token-round

    // token border
    let hideBorderInput = buildOptionSelect("disableborder", "Border", "No Border");
    let hideBorderInputWrapper = build_select_input("Border Visibility", hideBorderInput);
    inputWrapper.append(hideBorderInputWrapper); // sets border-width: 4

    // token aspect ratio
    let aspectRatioInput = buildOptionSelect("legacyaspectratio", "Maintain", "Stretch")
    let aspectRatioInputWrapper = build_select_input("Aspect Ratio", aspectRatioInput);
    inputWrapper.append(aspectRatioInputWrapper);     // adds class preserve-aspect-ratio

    // submit form button
    let saveButton = $(`<button class="sidebar-panel-footer-button" style="width:100%;padding:8px;margin-top:8px;margin-left:0px;">Save Token</button>`);
    saveButton.on("click", function(event) {
        console.log("submit token form?", event);
        let nameInput = $(event.target).parent().find("input[name='addCustomName']");
        let updatedName = nameInput.val();
        if (placedToken !== undefined) {
            placedToken.options.name = updatedName;
            listItem.name = updatedName;
            close_sidebar_modal();
        } else {
            let renameSucceeded = rename_my_token(myToken, updatedName, true);
            if (renameSucceeded) {
                listItem.name = updatedName;
                persist_my_tokens();
                rebuild_token_items_list();
                redraw_token_list();
                close_sidebar_modal();
            } else {
                nameInput.select();
            }
        }
    });
    inputWrapper.append(saveButton);
}

function rename_my_token(myToken, newName, alertUser) {
    let newPath = sanitize_folder_path(`${myToken.folderPath}/${newName}`);
    let newFullPath = sanitize_folder_path(`${TokenListItem.PathMyTokens}${newPath}`);
    let existing = find_my_token(newFullPath);
    if (existing !== undefined) {
        if (alertUser !== false) {
            alert(`A Token with the name "${newName}" already exists at "${newFullPath}"`);
        }
        console.warn(`A Token with the name ${newName} already exists in the folder "${TokenListItem.PathMyTokens}${myToken.folderPath}"`);
        return false;
    }
    myToken.name = newName;
    return true;
}

function display_builtin_token_details_modal(listItem) {
    if (!listItem?.isTypeBuiltinToken()) {
        console.warn("display_builtin_token_details_modal was called with incorrect item type", listItem);
        return;
    }

    // close any that are already open just to be safe
    close_sidebar_modal();

    let sidebarPanel = new SidebarPanel("builtin-token-details-modal");
    display_sidebar_modal(sidebarPanel);
    sidebarPanel.updateHeader(listItem.name, "", "When placing tokens, one of these images will be chosen at random. Right-click an image for more options.");

    redraw_token_images_in_modal(sidebarPanel, listItem);
}

function redraw_token_images_in_modal(sidebarPanel, listItem, placedToken) {
    sidebarPanel.body.empty();

    let image = parse_img(listItem.image);

    // clone our images array instead of using a reference so we don't accidentally change the current images for all tokens
    // we also need to parse and compare every image to know if we need to add the placedToken image
    let images = alternative_images(listItem).map(image => parse_img(image));

    if (image !== undefined && !images.includes(image)) {
        // the main image somehow isn't in the list so put it at the front. This can happen when you update the image for a placed token but not saving it
        images.unshift(image);
    }

    if (placedToken !== undefined) {
        let placedImg = parse_img(placedToken.options.imgsrc);
        if (placedImg !== undefined && placedImg !== "" && !images.includes(placedImg)) {
            // the placedToken image has been changed by the user so put it at the front
            images.unshift(placedImg);
        }
    }

    for (let i = 0; i < images.length; i++) {
        let imageUrl = images[i];
        let tokenDiv = build_alternative_image_for_modal(imageUrl, placedToken);
        set_full_path(tokenDiv, listItem.fullPath());
        enable_draggable_token_creation(tokenDiv, imageUrl);
        sidebarPanel.body.append(tokenDiv);
    }
}

function build_alternative_image_for_modal(image, placedToken) {
    let tokenDiv = $(`
		    <div class="custom-token-image-item">
			    <div class="token-image-sizing-dummy"></div>
			    <img alt="token-img" class="token-image token-round" src="${image}" />
	    	</div>
    	`);
    if (placedToken !== undefined) {
        // the user is changing their token image, allow them to simply click an image
        // we don't want to allow drag and drop from this modal
        tokenDiv.on("click", function() {
            placedToken.options.imgsrc = parse_img(image);
            close_sidebar_modal();
            placedToken.place_sync_persist();
        });
    }
    return tokenDiv;
}

function alternative_images(listItem) {
    let alternativeImages = [];
    switch (listItem.type) {
        case TokenListItem.TypeBuiltinToken:
            let builtin = find_builtin_token(listItem.fullPath());
            alternativeImages = builtin?.alternativeImages;
            break;
        case TokenListItem.TypeMyToken:
            let myToken = find_my_token(listItem.fullPath());
            alternativeImages = myToken?.alternativeImages;
            break;
        case TokenListItem.TypePC:
            alternativeImages = get_player_image_mappings(listItem.sheet);
            break;
        case TokenListItem.TypeMonster:
            alternativeImages = get_custom_monster_images(listItem.monsterData.id);
            break;
        case TokenListItem.TypeFolder:
            break;
    }
    if (alternativeImages === undefined) {
        alternativeImages = [];
    }
    return alternativeImages;
}

function persist_my_tokens() {
    localStorage.setItem("MyTokens", JSON.stringify(mytokens));
    localStorage.setItem("MyTokensEmptyFolders", JSON.stringify(emptyfolders));
}

function did_change_items() {
    persist_my_tokens();
    rebuild_token_items_list();
    redraw_token_list();
    // filter_token_list(tokensPanel.body.find(".token-search").val());
}

function expand_all_folders_up_to(fullPath) {
    console.group("expand_all_folders_up_to");
    if (!fullPath.startsWith(TokenListItem.PathMyTokens)) {
        let myTokensPath = sanitize_folder_path(TokenListItem.PathMyTokens + fullPath);
        console.log(`fullPath: ${fullPath}, myTokensPath: ${myTokensPath}`);
        let folderElement = find_html_row_from_path(myTokensPath);
        console.log(folderElement);
        let parents = folderElement.parents(".collapsed")
        console.log(parents);
        parents.removeClass("collapsed");
        console.log(parents);
    } else {
        console.log(`fullPath: ${fullPath}`);
        let folderElement = find_html_row_from_path(fullPath);
        console.log(folderElement);
        let parents = folderElement.parents(".collapsed")
        console.log(parents);
        parents.removeClass("collapsed");
        console.log(parents);
    }
    console.groupEnd();
}

function open_monster_item(listItem) {
    if (!listItem.isTypeMonster()) {
        console.warn("open_monster_item was called with the wrong item type", listItem);
        return;
    }

    let iframe = $(`<iframe id='monster-details-page-iframe'></iframe>`);
    iframe.css({
        "width": "100%",
        "height": "100%",
        "top": "0px",
        "left": "0px",
        "position": "absolute",
        "border": "none",
        "z-index": 10
    });
    tokensPanel.container.append(iframe);

    let rowHtml = find_html_row(listItem);
    console.log(listItem.fullPath(), rowHtml);
    rowHtml.addClass("button-loading");
    iframe.on("load", function(event) {
        rowHtml.removeClass("button-loading");
        if (!this.src) {
            // it was just created. no need to do anything until it actually loads something
            return;
        }

        let contents = $(event.target).contents();
        contents.find("#site > footer").hide();
        contents.find("#site-main > header.main").hide();
        contents.find("#site-main").css("padding-top", 0);
        contents.find(".site-bar").hide();
        contents.find(".ad-container").hide();
        contents.find(".homebrew-comments").hide();

        // move the image below the stat block
        let image = contents.find(".detail-content > .image");
        let statBlock = contents.find(".detail-content > .mon-stat-block");
        statBlock.after(image);


        let closeButton = $(`
            <button title="Close stat block" type="button">
                <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
                    <g transform="rotate(-45 50 50)"><rect x="0" y="40" width="100" height="20"></rect></g>
                    <g transform="rotate(45 50 50)"><rect x="0" y="40" width="100" height="20"></rect></g>
                </svg>
            </button>
        `);
        closeButton.css({
            "align-items": "center",
            "-webkit-appearance": "none",
            "-o-appearance": "none",
            "appearance": "none",
            "background": "#fff",
            "border": "1px solid #d8e1e8",
            "border-radius": "50%",
            "display": "flex",
            "justify-content": "center",
            "padding": "8px",
            "position": "fixed",
            "right": "8px",
            "top": "8px",
            "height": "40px",
            "width": "40px"
        });
        contents.find(".page-header__primary > .page-heading").append(closeButton);
        closeButton.on("click", function () {
            $("#monster-details-page-iframe").remove();
        });

        contents.find(".main.content-container").attr("style", "padding:0!important");
        contents.find(".more-info.details-more-info").css("padding", "8");
        contents.find("a").attr("target", "_blank");
    });


    iframe.attr("src", listItem.monsterData.url);
}

function fetch_characters() {

    // TODO: figure out the CORS errors here. This exact API is called from the page we're trying to call this from, and it works for them, but not for us :(

    console.log("fetch_characters starting");
    let pcIds = window.pcs
        .filter(pc => pc.sheet.includes("/")) // only pcs that have a valid sheet structure
        .map(pc => parseInt(pc.sheet.split("/").pop())) // grab the id which is the last component of the path
        .filter(id => id !== undefined); // ignore any ids that failed to parse
    let body = JSON.stringify({"characterIds": pcIds});
    console.log("fetch_characters", body);
    window.ajaxQueue.addDDBRequest({
        type: "POST",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        url: `https://character-service-scds.dndbeyond.com/v1/characters`,
        data: body,
        success: function (responseData) {
            console.log("fetch_characters success", responseData);
        },
        failure: function (errorMessage) {
            console.log("fetch_characters failure", errorMessage);
        }
    });
}

function convert_challenge_rating_id(crId) {
    switch (crId) {
        case 0: return "0"; // ???
        case 1: return "0";
        case 2: return "1/8";
        case 3: return "1/4";
        default: return crId - 4;
    }
}

/// this is a duplicate from a different PR that will be replaced once https://github.com/cyruzzo/AboveVTT/pull/314 is merged
function temp_build_token_size_input(currentTokenSize, changeHandler) {
    let sizeNumber = parseInt(currentTokenSize); // 0, 1, 2, 3, 4, 5, etc
    if (isNaN(sizeNumber)) {
        sizeNumber = 1;
    }

    let upsq = window.CURRENT_SCENE_DATA.upsq;
    if (upsq === undefined || upsq.length === 0) {
        upsq = "ft";
    }

    let customStyle = sizeNumber > 4 ? "display:flex;" : "display:none;"

    let output = $(`
 		<div class="token-image-modal-footer-select-wrapper">
 			<div class="token-image-modal-footer-title">Token Size</div>
 			<select name="data-token-size">
 				<option value="0">Tiny (2.5${upsq})</option>
 				<option value="1">Small/Medium (5${upsq})</option>
 				<option value="2">Large (10${upsq})</option>
 				<option value="3">Huge (15${upsq})</option>
 				<option value="4">Gargantuan (20${upsq})</option>
 				<option value="custom">Custom</option>
 			</select>
 		</div>
 		<div class="token-image-modal-footer-select-wrapper" style="${customStyle}">
 			<div class="token-image-modal-footer-title">Number Of Squares</div>
 			<input type="text" name="data-token-size-custom" placeholder="5" style="width: 3rem;">
 		</div>
 	`);

    let tokenSizeInput = output.find("select");
    let customSizeInput = output.find("input");
    if (sizeNumber > 4) {
        tokenSizeInput.val("custom");
        customSizeInput.val(`${sizeNumber}`);
    } else {
        tokenSizeInput.val(`${sizeNumber}`);
    }

    tokenSizeInput.change(function(changeEvent) {
        let selectInput = $(changeEvent.target);
        let newValue = selectInput.val();
        let customInputWrapper = selectInput.parent().next();
        console.log("tokenSizeInput changed");
        if (newValue === "custom") {
            customInputWrapper.show();
        } else {
            customInputWrapper.hide();
            changeHandler(parseInt(newValue));
        }
    });

    customSizeInput.change(function(changeEvent) {
        console.log("customSizeInput changed");
        let textInput = $(changeEvent.target);
        let numberOfSquares = parseInt(textInput.val());
        if (!isNaN(numberOfSquares)) {
            changeHandler(numberOfSquares);
        }
    });

    return output;
}
