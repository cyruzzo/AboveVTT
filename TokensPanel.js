
mytokens = [];
emptyfolders = []; // a list of strings. not sure how to do this yet, but this will be a temporary place to store empty folders
rootfolders = [];

/**
 * @param dirtyPath {string} the path to sanitize
 * @returns {string} the sanitized path
 */
function sanitize_folder_path(dirtyPath) {
    let cleanPath = dirtyPath.replaceAll("//", "/");
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
    if (mytokens.length > 0) {
        // we already did this. no need to continue
        return;
    }

    console.groupCollapsed("migrate_to_my_tokens");

    const migrateFolderAtPath = function(oldFolderPath) {
        let currentFolderPath = sanitize_folder_path(oldFolderPath);
        let folder = convert_path(currentFolderPath);
        if (folder.tokens) {
            for(let tokenKey in folder.tokens) {
                let token = folder.tokens[tokenKey];
                token['data-folderpath'] = currentFolderPath;
                token['data-oldFolderKey'] = tokenKey; // not sure if we'll need this, but hopefully not
                if (token['data-name'] === undefined) {
                    token['data-name'] = tokenKey;
                }
                mytokens.push(token);
            }
        } else {
            emptyfolders.push(currentFolderPath);
        }
        if (folder.folders) {
            for (let folderKey in folder.folders) {
                migrateFolderAtPath(`${currentFolderPath}/${folderKey}`);
            }
        }
    }

    migrateFolderAtPath(TokenListItem.PathRoot);
    console.groupEnd()
}

function rollback_from_my_tokens() {
    mytokens = [];
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
     * @param subtitle {string} the string displayed under the name
     * @param folderPath {string} the folder this token is in
     */
    constructor(name, image, type, subtitle, folderPath = TokenListItem.PathRoot) {
        this.name = name;
        this.image = image;
        this.type = type;
        this.subtitle = subtitle;
        this.folderPath = sanitize_folder_path(folderPath);
    }
    static Folder(folderPath, name, subtitle) {
        console.debug(`TokenListItem.Folder ${folderPath}/${name}`);
        return new TokenListItem(name, `${window.EXTENSION_PATH}assets/folder.svg`, TokenListItem.TypeFolder, subtitle, folderPath);
    }
    static MyToken(tokenData, subtitle) {
        let name = tokenData["data-name"];
        console.debug("TokenListItem.MyToken", tokenData);
        let myTokenPath = tokenData["data-folderpath"];
        return new TokenListItem(name, tokenData["data-img"], TokenListItem.TypeMyToken, subtitle, `${TokenListItem.PathMyTokens}/${myTokenPath}`);
    }
    static BuiltinToken(tokenData, subtitle) {
        let name = tokenData.name;
        console.debug("TokenListItem.BuiltinToken", tokenData);
        return new TokenListItem(name, tokenData.imgsrc, TokenListItem.TypeBuiltinToken, subtitle, `${TokenListItem.PathAboveVTT}/${tokenData.folderPath}`);
    }
    static Monster(monsterData, subtitle) {
        console.debug("TokenListItem.Monster", monsterData);
        let item = new TokenListItem(monsterData.name, monsterData.avatarUrl, TokenListItem.TypeMonster, subtitle, TokenListItem.PathMonsters);
        item.monsterData = monsterData;
        return item;
    }
    static PC(sheet, name, imgSrc, subtitle) {
        console.debug("TokenListItem.PC", sheet, name, imgSrc);
        let item = new TokenListItem(name, imgSrc, TokenListItem.TypePC, subtitle, TokenListItem.PathPlayers);
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
    return html.attr("data-full-path", encode_full_path(fullPath));
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
    let found = mytokens.find(t => {
        let dirtyPath = `${TokenListItem.PathMyTokens}${t["data-folderpath"]}/${t["data-name"]}`;
        let fullTokenPath = sanitize_folder_path(dirtyPath);
        console.log("find_my_token looking for: ", fullPath, dirtyPath, fullTokenPath, fullTokenPath === fullPath, t);
        return fullTokenPath === fullPath;
    });
    console.log("find_my_token found: ", found);
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
        let path = myToken['data-folderpath'];
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
        tokenItems.push(TokenListItem.Folder(myTokensFolderPath, folderName, "EMPTY FOLDER"));
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

    rootfolders = [
        TokenListItem.Folder(TokenListItem.PathRoot, TokenListItem.NamePlayers),
        TokenListItem.Folder(TokenListItem.PathRoot, TokenListItem.NameMyTokens),
        TokenListItem.Folder(TokenListItem.PathRoot, TokenListItem.NameAboveVTT),
        TokenListItem.Folder(TokenListItem.PathRoot, TokenListItem.NameMonsters)
    ];

    if(localStorage.getItem('CustomTokens') != null){
        tokendata = $.parseJSON(localStorage.getItem('CustomTokens'));
        // mytokens = $.parseJSON(localStorage.getItem('MyTokens'));
    }
    // tokendata.folders['AboveVTT BUILTIN'] = tokenbuiltin; // TODO: migrate this to the new way, but don't store it to localStorage
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

    // TODO: save this to use on folder rows
    // let addTokenButton = $(`<button id="add-token-btn" class="sidebar-panel-footer-button">Add Token</button>`);
    // addTokenButton.click(function(event) {
    //     let path = $(event.target).attr("data-folder-path");
    //     if (path === undefined) {
    //         path = "";
    //     }
    //     display_custom_token_form(path);
    // });
    // let addFolderButton = $(`<button id="add-folder-btn" class="sidebar-panel-footer-button">Add Folder</button>`);
    // addFolderButton.click(function(event) {
    //     var newfoldername = prompt("Enter the name of the new folder");
    //     if (newfoldername === undefined || newfoldername === "") {
    //         // don't add folders when cancel is pressed or if they didn't enter a folder name at all
    //         return;
    //     }
    //     let path = window.CURRENT_TOKEN_PATH;
    //     if (path === undefined) {
    //         path = "";
    //     }
    //     let folder = convert_path(path);
    //     if(!folder.folders) {
    //         folder.folders = {};
    //     }
    //     folder.folders[newfoldername] = {};
    //     persist_customtokens();
    // });
    //
    // let buttonWrapper = $(`<div class="sidebar-panel-footer-horizontal-wrapper"></div>`)
    // buttonWrapper.append(addTokenButton);
    // buttonWrapper.append(addFolderButton);
    // tokensPanel.footer.append(buttonWrapper);

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
            // list.find(`[data-full-path='${item.folderPath}'] > .folder-token-list`).append(row);
        });

    // now let's add all the other items
    window.tokenListItems
        .filter(item => !item.isTypeFolder() && item.name.toLowerCase().includes(nameFilter))
        .sort(TokenListItem.sortComparator)
        .forEach(item => {
            let row = build_token_row(item);
            console.debug("appending item", item);
            find_html_row_from_path(item.folderPath, list).find(` > .folder-token-list`).append(row);
            // list.find(`[data-full-path='${item.folderPath}'] > .folder-token-list`).append(row);
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
    let img = $(`<img src="${parse_img(listItem.image)}" alt="${listItem.name} image" />`);
    imgHolder.append(img);

    let details = $(`<div class="tokens-panel-row-details"></div>`);
    rowItem.append(details);
    let title = $(`<div class="tokens-panel-row-details-title">${listItem.name}</div>`);
    details.append(title);
    let subtitle = $(`<div class="tokens-panel-row-details-subtitle"></div>`);
    details.append(subtitle);
    if (listItem.subtitle !== undefined) {
        subtitle.text(listItem.subtitle);
    }

    if (!listItem.isTypeFolder()) {
        let addButton = $(`
            <button class="token-row-button token-row-add" title="${listItem.name}" data-name="${listItem.name}" data-img="${listItem.image}">
                <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M7.2 10.8V18h3.6v-7.2H18V7.2h-7.2V0H7.2v7.2H0v3.6h7.2z"></path></svg>
            </button>
        `);
        rowItem.append(addButton);
        addButton.on("click", did_click_add_button);
    }

    switch (listItem.type) {
        case TokenListItem.TypeFolder:
            if (listItem.subtitle === undefined || listItem.subtitle.length === 0) {
                subtitle.hide();
            }
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
                    let clickedRow = $(clickEvent.target).closest(".tokens-panel-row");
                    let clickedItem = find_token_list_item(clickedRow);
                    create_folder_inside(clickedItem);
                });
                let addToken = $(`<button class="token-row-button"><span class="material-icons">person_add_alt_1</span></button>`);
                rowItem.append(addToken);
                addToken.on("click", function(clickEvent) {
                    let clickedRow = $(clickEvent.target).closest(".tokens-panel-row");
                    let clickedItem = find_token_list_item(clickedRow);
                    create_token_inside(clickedItem);
                });
            }
            break;
        case TokenListItem.TypeMyToken:
            // TODO: Style specifically for My Tokens
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

            if (listItem.subtitle === undefined || listItem.subtitle.length === 0) {
                subtitle.append(`<div class="subtitle-attibute"><span class="plain-text">CR</span>${convert_challenge_rating_id(listItem.monsterData.challengeRatingId)}</div>`);
                if (listItem.monsterData.isHomebrew === true) {
                    subtitle.append(`<div class="subtitle-attibute"><span class="material-icons">alt_route</span>Homebrew</div>`);
                } else if (listItem.monsterData.isReleased === false) {
                    subtitle.append(`<div class="subtitle-attibute"><span class="material-icons" style="color:darkred">block</span>No Access</div>`);
                }
            }

            break;
        case TokenListItem.TypeBuiltinToken:
            // TODO: Style specifically for Builtin
            break;
    }

    if (listItem.canEdit()) {
        let settingsButton = $(`
            <div class="token-row-gear">
                <img src="${window.EXTENSION_PATH}assets/icons/cog.svg" style="width:100%;height:100%;"  alt="settings icon"/>
            </div>
    	`);
        rowItem.append(settingsButton);
        settingsButton.on("click", did_click_row_gear);
    }

    if (enableDrag && !listItem.isTypeFolder()) {
        rowItem.draggable({
            appendTo: "#VTTWRAPPER",
            zIndex: 100000,
            cursorAt: {top: 0, left: 0},
            cancel: '.token-row-gear',
            helper: function(event) {
                let draggedRow = $(event.target).closest(".tokens-panel-row");
                let draggedItem = find_token_list_item(draggedRow);
                let randomImage = random_image_for_item(draggedItem);
                let helper = draggedRow.find(".tokens-panel-row-img img").clone();
                helper.attr("src", randomImage);
                return helper;
            },
            start: function (event, ui) {
                console.log("row-item drag start");
                let draggedRow = $(event.target).closest(".tokens-panel-row");
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
                // place a token where this was dropped
                console.log("row-item drag stop");
                let draggedRow = $(event.target).closest(".tokens-panel-row");
                let draggedItem = find_token_list_item(draggedRow);
                let hidden = event.shiftKey || window.TOKEN_SETTINGS["hidden"];
                let src = $(ui.helper).attr("src");
                create_and_place_token(draggedItem, hidden, src, event.pageX, event.pageY);
            }
        });
    }
    return row;
}

function did_click_row(clickEvent) {
    console.log("did_click_row", clickEvent);
    let clickedRow = $(clickEvent.target).closest(".tokens-panel-row");
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

            break;
    }
}

function did_click_row_gear(clickEvent) {
    clickEvent.stopPropagation();
    console.log("did_click_row_gear", clickEvent);
    let clickedRow = $(clickEvent.target).closest(".tokens-panel-row");
    let clickedItem = find_token_list_item(clickedRow);
    console.log("did_click_row_gear", clickedItem);
    display_token_item_configuration_modal(clickedItem);
}

function did_click_add_button(clickEvent) {
    clickEvent.stopPropagation();
    console.log("did_click_add_button", clickEvent);
    let clickedRow = $(clickEvent.target).closest(".tokens-panel-row");
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
            options.square = myToken['data-square'];
            options.disableborder = myToken['data-disableborder'];
            options.legacyaspectratio = myToken['data-legacyaspectratio'];
            options.disablestat = true;
            let tokenSizeSetting = myToken['data-token-size'];
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
            let imgsrc = options.imgsrc; // don't overwrite the imgsrc... we already went through the hassle of finding a random one
            options = {...options, ...builtinToken}
            options.imgsrc = imgsrc;
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
            let tokenSizeSetting = myToken['data-token-size'];
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
            let myTokenAltImages = myToken["data-alternative-images"];
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
        let clickedRow = $(event.target).closest(".tokens-panel-row");
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
            console.warn("Not allowed to edit build in tokens");
            break;
        case TokenListItem.TypeMyToken:
            // TODO: rebuild custom token form to use the new structure
            break;
        case TokenListItem.TypePC:
            display_player_token_customization_modal(listItem.sheet);
            break;
        case TokenListItem.TypeMonster:
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

function display_my_token_configure_modal(listItem) {
    if (listItem === undefined || !listItem.isTypeMyToken()) {
        console.warn("display_my_token_configure_modal was called with an incorrect type", listItem);
        return;
    }

}

function path_exists(folderPath) {
    if (mytokens.filter(token => token['data-folderpath'] === folderPath).length > 0) {
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
        console.debug(`filtering ${token['data-name']} folderpath`, token['data-folderpath'], adjustedPath);
        return token['data-folderpath'] === adjustedPath
    }).forEach(token => {
        console.debug(`changing ${token.name} folderpath`);
        token['data-folderpath'] = toFullPath;
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
        console.debug(`filtering ${token['data-name']} folderpath`, token['data-folderpath'], adjustedPath);
        return token['data-folderpath'] === adjustedPath;
    }).forEach(token => {
        console.debug(`deleting ${token['data-name']}`, token);
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
        if (token['data-folderpath'] === adjustedPath) {
            console.debug(`moving ${token['data-name']} up one level`, token);
            token['data-folderpath'] = oneLevelUp;
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
    console.error("TODO: create a mytoken inside", listItem);
}

function persist_mytokens() {
    console.error("TODO: persist_mytokens");
}

function did_change_items() {
    persist_mytokens();
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