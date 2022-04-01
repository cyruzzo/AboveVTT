
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
        return new TokenListItem(name, tokenData.imgsrc, TokenListItem.TypeBuiltinToken, subtitle, `${TokenListItem.PathAboveVTT}/${tokenData.folderPath}`);
    }
    static Monster(monsterData, subtitle = "MONSTER") {
        console.debug("TokenListItem.Monster", monsterData);
        let item = new TokenListItem(monsterData.name, monsterData.avatarUrl, TokenListItem.TypeMonster, subtitle, TokenListItem.PathMonsters);
        item.monsterData = monsterData;
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
        if (lhs.isTypeFolder() && !rhs.isTypeFolder()) { return -1; }
        if (!lhs.isTypeFolder() && rhs.isTypeFolder()) { return 1; }
        // alphabetically by name
        if (lhs.name < rhs.name) { return -1; }
        if (lhs.name > rhs.name) { return 1; }
        // equal
        return 0;
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
    if (foundItem === undefined) {
        console.warn(`find_token_list_item found nothing at path: ${fullPath}`);
    }
    return foundItem;
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
            let item = TokenListItem.Monster(m)
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
        TokenListItem.Folder(TokenListItem.PathRoot, TokenListItem.NamePlayers),
        TokenListItem.Folder(TokenListItem.PathRoot, TokenListItem.NameMonsters),
        TokenListItem.Folder(TokenListItem.PathRoot, TokenListItem.NameMyTokens),
        TokenListItem.Folder(TokenListItem.PathRoot, TokenListItem.NameAboveVTT)
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
            if (listItem.folderPath.startsWith(TokenListItem.PathMyTokens)) {
                // add buttons for creating subfolders and tokens
            } else {
                handle.remove(); // only allow configuration of "My Tokens" folders
            }
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

    if (enableDrag && !listItem.isTypeFolder()) {
        rowItem.draggable({
            appendTo: "#VTTWRAPPER",
            zIndex: 100000,
            cursorAt: {top: 0, left: 0},
            cancel: '.custom-token-image-row-handle',
            helper: function(event) {
                let draggedRow = $(event.target).closest(".custom-token-image-row");
                let draggedItem = find_token_list_item(draggedRow.attr("data-full-path"));
                let randomImage = random_image_for_item(draggedItem);
                let helper = draggedRow.find(".custom-token-image-row-img img").clone();
                helper.attr("src", randomImage);
                return helper;
            },
            start: function (event, ui) {
                console.log("row-item drag start");
                let draggedRow = $(event.target).closest(".custom-token-image-row");
                let draggedItem = find_token_list_item(draggedRow.attr("data-full-path"));
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
                let draggedRow = $(event.target).closest(".custom-token-image-row");
                let draggedItem = find_token_list_item(draggedRow.attr("data-full-path"));
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
    let clickedRow = $(clickEvent.target).closest(".custom-token-image-row");
    let clickedItem = find_token_list_item(clickedRow.attr("data-full-path"));
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
    let clickedItem = find_token_list_item(clickedRow.attr("data-full-path"));
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
    let clickedItem = find_token_list_item(clickedRow.attr("data-full-path"));
    console.log("did_click_add_button", clickedItem);
    let hidden = clickEvent.shiftKey || window.TOKEN_SETTINGS["hidden"];
    create_and_place_token(clickedItem, hidden, undefined, undefined, undefined);
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
    tokensPanel.body.find(".custom-token-image-row").on("contextmenu", ".custom-token-image-row-add", function(event) {
        event.preventDefault();
        event.stopPropagation();
        let clickedRow = $(event.target).closest(".custom-token-image-row");
        let clickedItem = find_token_list_item(clickedRow.attr("data-full-path"));
        create_and_place_token(clickedItem, true);
    });

    $.contextMenu({
        selector: ".custom-token-image-row",
        build: function(element, e) {

            let menuItems = {};

            let rowItem = find_token_list_item($(element).attr("data-full-path"));
            if (rowItem === undefined) {
                console.warn("register_token_row_context_menu failed to find row item", element, e)
                menuItems["no-delete"] = {
                    name: "An unexpected error occurred",
                    disabled: true
                };
                return { items: menuItems };
            }

            if (!rowItem.isTypeFolder()) {
                // add non-folder items

                menuItems["place"] = {
                    name: "Place Token",
                    callback: function(itemKey, opt, originalEvent) {
                        let itemToPlace = find_token_list_item(opt.$trigger.attr("data-full-path"));
                        create_and_place_token(itemToPlace);
                    }
                };

                menuItems["placeHidden"] = {
                    name: "Place Hidden Token",
                    callback: function(itemKey, opt, originalEvent) {
                        let itemToPlace = find_token_list_item(opt.$trigger.attr("data-full-path"));
                        create_and_place_token(itemToPlace, true);
                    }
                };

                menuItems["copyUrl"] = {
                    name: "Copy Url",
                    callback: function(itemKey, opt, originalEvent) {
                        let itemToCopy = find_token_list_item(opt.$trigger.attr("data-full-path"));
                        copy_to_clipboard(itemToCopy.image);
                    }
                };
            }

            // add delete menu option
            if (rowItem.isTypeBuiltinToken() || rootfolders.includes(rowItem)) {
                menuItems["no-delete"] = {
                    name: "Folders and Tokens provided by AboveVTT cannot be edited or deleted",
                    disabled: true
                };
            } else {

                menuItems["edit"] = {
                    name: "Edit",
                    callback: function(itemKey, opt, originalEvent) {
                        let itemToEdit = find_token_list_item(opt.$trigger.attr("data-full-path"));
                        if (itemToEdit.isTypeFolder()) {
                            // TODO: build a modal for this instead of using prompt
                            let newfoldername = prompt("Enter the name of the folder", itemToEdit.name);
                            rename_folder(itemToEdit, newfoldername);
                        } else {
                            display_token_item_edit_modal(itemToEdit);
                        }
                    }
                };

                menuItems["border"] = "---";

                // not a built in folder or token, add an option to delete
                menuItems["delete"] = {
                    name: "Delete",
                    callback: function(itemKey, opt, originalEvent) {
                        let itemToDelete = find_token_list_item(opt.$trigger.attr("data-full-path"));
                        delete_item(itemToDelete);
                    }
                };
            }
            return { items: menuItems };
        }
    });
}

function display_token_item_edit_modal(listItem) {
    console.error("TODO: display_token_item_edit_modal");
    switch (listItem.type) {
        case TokenListItem.TypeFolder:
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

function path_exists(folderPath) {
    if (mytokens.filter(token => token['data-folderpath'] === folderPath).length > 0) {
        return true;
    }
    return emptyfolders.includes(folderPath);
}

function rename_folder(item, newName) {
    console.group("rename_folder");

    let fromFullPath = item.fullPath();
    let toFullPath = sanitize_folder_path(`${item.folderPath}/${newName}`);
    if (path_exists(toFullPath)) {
        console.warn(`Attempted to rename folder to ${newName}, which would be have a path: ${toFullPath} but a folder with that path already exists`);
        return;
    }

    console.log(`updating tokens from ${fromFullPath} to ${toFullPath}`);
    let didUpdateTokens = false;
    mytokens.filter(token => token['data-folderpath'] === fromFullPath).forEach(token => {
        console.debug(`changing ${token.name} folderpath`);
        token['data-folderpath'] = toFullPath;
        didUpdateTokens = true;
    });

    // if we updated a token with this path, that means that path is not empty so it's safe to remove it form our list
    // if the folder is empty, we want to replace it with toFullPath so we have to remove it anyway.
    array_remove_index_by_value(emptyfolders, fromFullPath);

    if (!didUpdateTokens) {
        // no tokens were updated which means fromFullPath was an empty folder
        emptyfolders.push(fromFullPath);
    }

    did_change_items();

    console.groupEnd();
}

function delete_item(item) {
    console.error("TODO: delete_item", item);
    did_change_items();
}

function persist_mytokens() {
    console.error("TODO: persist_mytokens");
}

function did_change_items() {
    persist_mytokens()
    rebuild_token_items_list();
    redraw_token_list()
    // filter_token_list(tokensPanel.body.find(".token-search").val());
}