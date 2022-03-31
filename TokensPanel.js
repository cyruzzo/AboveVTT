
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

    console.group("migrate_to_my_tokens");

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
    static Folder(folderPath, name, subtitle = "FOLDER") {
        console.debug("TokenListItem.Folder", folderPath, name);
        return new TokenListItem(name, `${window.EXTENSION_PATH}assets/folder.svg`, TokenListItem.TypeFolder, subtitle, folderPath);
    }
    static MyToken(tokenData, subtitle = "MyToken") {
        let name = tokenData["data-name"];
        console.debug("TokenListItem.MyToken", tokenData);
        let myTokenPath = tokenData["data-folderpath"];
        return new TokenListItem(name, tokenData["data-img"], TokenListItem.TypeMyToken, subtitle, `${TokenListItem.PathMyTokens}/${myTokenPath}`);
    }
    static BuiltinToken(tokenData, subtitle = "Builtin") {
        let name = tokenData.name;
        console.debug("TokenListItem.BuiltinToken", tokenData);
        return new TokenListItem(name, tokenData.image, TokenListItem.TypeBuiltinToken, subtitle, `${TokenListItem.PathAboveVTT}/${tokenData.folderPath}`);
    }
    static Monster(monsterId, monsterName, imgsrc, isReleased, isHomebrew, subtitle = "MONSTER") {
        console.debug("TokenListItem.Monster", monsterId, monsterName, imgsrc, isReleased, isHomebrew);
        let item = new TokenListItem(monsterName, imgsrc, TokenListItem.TypeMonster, subtitle, TokenListItem.PathMonsters);
        item.monsterId = monsterId;
        item.isReleased = isReleased;
        item.isHomebrew = isHomebrew;
        return item;
    }
    static PC(sheet, name, imgSrc, subtitle = "PLAYER") {
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
        if (lhs.isFolder() && !rhs.isFolder()) { return -1; }
        if (!lhs.isFolder() && rhs.isFolder()) { return 1; }
        // alphabetically by name
        if (lhs.name < rhs.name) { return -1; }
        if (lhs.name > rhs.name) { return 1; }
        // equal
        return 0;
    }

    /** @returns {boolean} whether or not this item represents a folder */
    isFolder() {
        return this.type === TokenListItem.TypeFolder;
    }

    /** @returns {string} path + name */
    fullPath() {
        return sanitize_folder_path(`${this.folderPath}/${this.name}`);
    }
}

/**
 * @param fullPath {string} the full path of the item.
 * @returns {TokenListItem|undefined} if found, else undefined
 */
function find_token_list_item(fullPath) {
    let foundItem = rootfolders.find(item => item.fullPath() === fullPath);
    if (foundItem === undefined) {
        foundItem = window.tokenListItems.find(item => item.fullPath() === fullPath);
    }
    if (foundItem === undefined) {
        foundItem = window.monsterListItems.find(item => item.fullPath() === fullPath);
    }
    return foundItem;
}

function rebuild_token_items_list() {

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
            if (currentFolder.attr("data-full-path") !== "/Monsters" && currentFolder.find("> .folder-token-list").is(':empty')) {
                // TODO: figure out how to hide empty folders that have empty subfolders
                currentFolder.hide(); // don't show any that are empty when searching
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
            let item = TokenListItem.Monster(m.id, m.name, m.avatarUrl, m.isReleased, m.isHomebrew)
            window.monsterListItems.push(item);
            listItems.push(item);
        }
        console.log("converted", listItems);
        let list = tokensPanel.body.find(".custom-token-list");
        let monsterFolder = list.find(`[data-full-path='/Monsters']`);
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

// https://davidwalsh.name/javascript-debounce-function
// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
function debounce(func, wait, immediate) {
    var timeout;
    return function() {
        var context = this, args = arguments;
        var later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

// function debounce(fn, duration) {
// 	var timer;
// 	return function() {
// 		clearTimeout(timer);
// 		timer = setTimeout(fn, duration)
// 	}
// }

function init_tokens_panel() {

    rootfolders = [
        TokenListItem.Folder(TokenListItem.PathRoot, TokenListItem.PathPlayers.replaceAll("/", "")),
        TokenListItem.Folder(TokenListItem.PathRoot, TokenListItem.PathMonsters.replaceAll("/", "")),
        TokenListItem.Folder(TokenListItem.PathRoot, TokenListItem.PathMyTokens.replaceAll("/", "")),
        TokenListItem.Folder(TokenListItem.PathRoot, TokenListItem.PathAboveVTT.replaceAll("/", ""))
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
    searchInput.off("input").on("input", debounce(() => {
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
    console.group("redraw_token_list");
    let list = $(`<div class="custom-token-list"></div>`);

    let nameFilter = "";
    if (searchTerm !== undefined && typeof searchTerm === "string") {
        nameFilter = searchTerm;
    }

    // first let's add our root folders
    for (let i = 0; i < rootfolders.length; i++) {
        list.append(build_token_row(rootfolders[i]));
    }

    // now let's add all the other items
    window.tokenListItems
        .filter(item => item.name.toLowerCase().includes(nameFilter))
        .sort(TokenListItem.sortComparator)
        .forEach(item => {
            let row = build_token_row(item);
            console.log("hey! appending item", item);
            list.find(`[data-full-path='${item.folderPath}'] > .folder-token-list`).append(row);
        });

    tokensPanel.body.empty();
    tokensPanel.body.append(list);
    console.groupEnd()
}

/**
 * @param listItem {TokenListItem} the list item that this row will represent
 * @param enableDrag {Boolean} whether or not this row can be dragged onto a scene to place a {Token} on the scene
 * @returns {*|jQuery|HTMLElement} that represents a row in the list of tokens in the sidebar
 */
function build_token_row(listItem, enableDrag = true) {

    let row = $(`<div class="custom-token-image-row"></div>`);
    row.attr('data-full-path', listItem.fullPath());

    let rowItem = $(`<div class="custom-token-image-row-item"></div>`);
    row.append(rowItem);

    let imgHolder = $(`<div class="custom-token-image-row-img"></div>`);
    let img = $(`<img src="${parse_img(listItem.image)}" alt="${listItem.name} image" />`);
    imgHolder.append(img);

    let details = $(`<div class="custom-token-image-row-details"></div>`);
    let title = $(`<div class="custom-token-image-row-details-title">${listItem.name}</div>`);
    details.append(title);
    if (listItem.subtitle !== undefined) {
        let subtitle = $(`<div class="custom-token-image-row-details-subtitle">${listItem.subtitle}</div>`);
        details.append(subtitle);
    }

    let addButton = $(`
		<button class="custom-token-image-row-add" title="${listItem.name}" data-name="${listItem.name}" data-img="${listItem.image}">
			<svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M7.2 10.8V18h3.6v-7.2H18V7.2h-7.2V0H7.2v7.2H0v3.6h7.2z"></path></svg>
		</button>
	`);
    let handle = $(`
		<div class="custom-token-image-row-handle">
			<img src="${window.EXTENSION_PATH}assets/icons/cog.svg" style="width:100%;height:100%;"  alt="settings icon"/>
		</div>
	`);

    rowItem.append(imgHolder);
    rowItem.append(details);
    rowItem.append(addButton);
    rowItem.append(handle);

    rowItem.on("click", did_click_row);
    handle.on("click", did_click_row_gear);
    addButton.on("click", did_click_add_button);

    switch (listItem.type) {
        case TokenListItem.TypeFolder:
            row.addClass("folder collapsed");
            row.append(`<div class="folder-token-list"></div>`);
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

    addButton.on("click", function(clickEvent) {
        let itemPath = $(clickEvent.currentTarget).closest(".custom-token-image-row").attr("data-full-path");
        let item = find_token_list_item(itemPath);
        console.log("addButton clicked", itemPath, item);
    });

    if (enableDrag) {
        // rowItem.draggable({
        //     appendTo: "#VTTWRAPPER",
        //     zIndex: 100000,
        //     cursorAt: {top: 0, left: 0},
        //     cancel: '.custom-token-image-row-handle',
        //     helper: function(event) {
        //         let helper = $(event.currentTarget).find(".custom-token-image-row-img img").clone();
        //         let addButton = $(event.currentTarget).find(".custom-token-image-row-add");
        //         let path = addButton.attr("data-tokendatapath");
        //         let name = addButton.attr("data-tokendataname");
        //         helper.attr("src", random_image_for_token(path, name));
        //         return helper;
        //     },
        //     start: function (event, ui) {
        //         console.log("row-item drag start");
        //         let addButton = $(event.currentTarget).find(".custom-token-image-row-add");
        //         let tokenSize = addButton.data('token-size');
        //         if (tokenSize === undefined) {
        //             tokenSize = 1;
        //         }
        //         let width = Math.round(window.CURRENT_SCENE_DATA.hpps) * tokenSize;
        //         let helperWidth = width / (1.0 / window.ZOOM);
        //         $(ui.helper).css('width', `${helperWidth}px`);
        //         $(this).draggable('instance').offset.click = {
        //             left: Math.floor(ui.helper.width() / 2),
        //             top: Math.floor(ui.helper.height() / 2)
        //         };
        //     },
        //     stop: function (event, ui) {
        //         // place a token where this was dropped
        //         console.log("row-item drag stop");
        //         let src = $(ui.helper).attr("src");
        //         let addButton = $(event.target).find(".custom-token-image-row-add");
        //         let path = addButton.attr("data-tokendatapath");
        //         let name = addButton.attr("data-tokendataname");
        //         let hidden = event.shiftKey || window.TOKEN_SETTINGS["hidden"];
        //         place_token_from_modal(path, name, hidden, src, event.pageX, event.pageY);
        //     }
        // });
    }
    return row;
}

function did_click_row(clickEvent) {
    console.log("did_click_row", clickEvent);
    let clickedRow = $(clickEvent.target).closest(".custom-token-image-row");
    let clickedRowPath = clickedRow.attr("data-full-path");
    let clickedItem = find_token_list_item(clickedRowPath);
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

            break;
        case TokenListItem.TypeBuiltinToken:

            break;
    }
}

function did_click_row_gear(clickEvent) {
    clickEvent.stopPropagation();
    console.log("did_click_row_gear", clickEvent);
    let clickedRow = $(clickEvent.target).closest(".custom-token-image-row");
    let clickedRowPath = clickedRow.attr("data-full-path");
    let clickedItem = find_token_list_item(clickedRowPath);
    console.log("did_click_row_gear", clickedItem);
    switch (clickedItem.type) {
        case TokenListItem.TypeFolder:
            console.log("TODO: handle folder editing")
            break;
        case TokenListItem.TypeBuiltinToken:
        case TokenListItem.TypeMyToken:
            // TODO: rebuild custom token form to use the new structure
            break;
        case TokenListItem.TypePC:
            display_player_token_customization_modal(clickedItem.sheet);
            break;
        case TokenListItem.TypeMonster:
            display_monster_customization_modal(undefined, clickedItem.monsterId, clickedItem.name, clickedItem.image);
            break;
    }
}

function did_click_add_button(clickEvent) {
    clickEvent.stopPropagation();
    console.log("did_click_add_button", clickEvent);
    let clickedRow = $(clickEvent.target).closest(".custom-token-image-row");
    let clickedRowPath = clickedRow.attr("data-full-path");
    let clickedItem = find_token_list_item(clickedRowPath);
    console.log("did_click_add_button", clickedItem);
    create_and_place_token(clickedItem);
}

/** @param listItem {TokenListItem} */
function create_and_place_token(listItem) {
    console.log("TODO: create_and_place_token", listItem);
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
