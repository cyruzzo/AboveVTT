
mytokens = [];
mytokensfolders = [];
tokens_rootfolders = [];
monster_search_filters = {};
encounter_monster_items = {}; // encounterId: SidebarTokenItem[]
cached_monster_items = {}; // monsterId: SidebarTokenItem

/** Reads in tokendata, and writes to mytokens and mytokensfolders; marks tokendata objects with didMigrateToMyToken = false; */
function migrate_to_my_tokens() {
    if (tokendata.didMigrateToMyToken === true) {
        console.log("migrate_to_my_tokens has already been run. returning early");
        return;
    }

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
        }
        if (folder.folders) {
            for (let folderKey in folder.folders) {
                mytokensfolders.push({ name: folderKey, folderPath: currentFolderPath, collapsed: true });
                migrateFolderAtPath(`${currentFolderPath}/${folderKey}`);
            }
        }
    }

    migrateFolderAtPath(SidebarListItem.PathRoot);
    tokendata.didMigrateToMyToken = true;
    persist_my_tokens();
    persist_customtokens();
    console.groupEnd();
}

/** erases mytokens and mytokensfolders; marks tokendata objects with didMigrateToMyToken = false; */
function rollback_from_my_tokens() {
    console.groupCollapsed("rollback_from_my_tokens");
    tokendata.didMigrateToMyToken = false;
    mytokens = [];
    mytokensfolders = [];
    persist_my_tokens();
    const rollbackFolderAtPath = function(oldFolderPath) {
        let currentFolderPath = sanitize_folder_path(oldFolderPath);
        let folder = convert_path(currentFolderPath);
        console.log("attempting to roll back all tokens in folder", currentFolderPath, folder);
        if (folder.tokens) {
            for (let tokenKey in folder.tokens) {
                let oldToken = folder.tokens[tokenKey];
                oldToken.didMigrateToMyToken = false;
                console.log("rolling back oldToken", oldToken);
            }
        }
        for (let folderName in folder.folders) {
            let nextFolderPath = `${currentFolderPath}/${folderName}`;
            rollbackFolderAtPath(nextFolderPath);
        }
    };
    rollbackFolderAtPath(SidebarListItem.PathRoot);
    persist_customtokens();
    console.groupEnd();
}

function list_item_from_monster_id(monsterId) {
    let found = cached_monster_items[monsterId];
    if (found === undefined) {
        found = window.monsterListItems.find(i => i.monsterData.id === monsterId);
    }
    if (found === undefined) {
        for (let encounterId in encounter_monster_items) {
            if (found === undefined) {
                let encounterMonsters = encounter_monster_items[encounterId];
                found = encounterMonsters.find(i => i.monsterData.id === monsterId);
            }
        }
    }
    return found;
}

function list_item_from_player_id(playerId) {
    let pc = window.pcs.find(p => p.sheet = playerId);
    if (pc === undefined) return undefined;
    let fullPath = sanitize_folder_path(`${SidebarListItem.PathPlayers}/${pc.name}`);
    return find_sidebar_list_item_from_path(fullPath);
}

function list_item_from_token(placedToken) {
    let listItemPath = placedToken.options.listItemPath;
    if (listItemPath !== undefined && listItemPath.length > 0) {
        // this token was placed after we unified tokens
        return find_sidebar_list_item_from_path(listItemPath);
    }

    if (placedToken.isMonster()) {
        // we can't figure this one out synchronously
        return list_item_from_monster_id(placedToken.options.monster);
    } else if (placedToken.isPlayer()) {
        return list_item_from_player_id(placedToken.options.id);
    } else {
        // need to migrate from the old custom_tokens
        let tokenDataPath = placedToken.options.tokendatapath !== undefined ? placedToken.options.tokendatapath : "";
        let tokenDataName = placedToken.options.tokendataname !== undefined ? placedToken.options.tokendataname : placedToken.options.name;
        if (tokenDataPath.startsWith("/AboveVTT BUILTIN")) {
            let convertedPath = tokenDataPath.replace("/AboveVTT BUILTIN", SidebarListItem.PathAboveVTT);
            let fullPath = sanitize_folder_path(`${convertedPath}/${tokenDataName}`);
            return find_sidebar_list_item_from_path(fullPath);
        } else {
            let fullPath = sanitize_folder_path(`${SidebarListItem.PathMyTokens}/${tokenDataPath}/${tokenDataName}`);
            return find_sidebar_list_item_from_path(fullPath);
        }
    }
}

/**
 * Finds a "My Token" that matches the given path
 * @param fullPath {string} the path of the "My Token" you're looking for
 * @returns {undefined|*} the "My Token" object if found; else undefined
 */
function find_my_token(fullPath) {
    if (!fullPath.startsWith(SidebarListItem.PathMyTokens)) {
        console.warn("find_my_token was called with the wrong token type.", fullPath, "should start with", SidebarListItem.PathMyTokens);
        return undefined;
    }
    console.groupCollapsed("find_my_token");
    let found = mytokens.find(t => {
        let dirtyPath = `${SidebarListItem.PathMyTokens}${t.folderPath}/${t.name}`;
        let fullTokenPath = sanitize_folder_path(dirtyPath);
        console.debug("looking for: ", fullPath, fullTokenPath, fullTokenPath === fullPath, t);
        return fullTokenPath === fullPath;
    });
    console.debug("found: ", found);
    console.groupEnd();
    return found;
}

/**
 * Finds a "My Token" Folder that matches the given path
 * @param fullPath {string} the path of the "My Token" Folder you're looking for
 * @returns {undefined|*} the Folder object if found; else undefined
 */
function find_my_token_folder(fullPath) {
    if (!fullPath.startsWith(SidebarListItem.PathMyTokens)) {
        console.warn("find_my_token was called with the wrong token type.", fullPath, "should start with", SidebarListItem.PathMyTokens);
        return undefined;
    }
    console.groupCollapsed("find_my_token_folder");
    let found = mytokensfolders.find(f => {
        let dirtyPath = `${SidebarListItem.PathMyTokens}${f.folderPath}/${f.name}`;
        let fullFolderPath = sanitize_folder_path(dirtyPath);
        console.debug("looking for: ", fullPath, dirtyPath, fullFolderPath, fullFolderPath === fullPath, f);
        return fullFolderPath === fullPath;
    });
    console.debug("found: ", found);
    console.groupEnd();
    return found;
}

/**
 * Finds a "Builtin Token" that matches the given path
 * @param fullPath {string} the path of the "Builtin Token" you're looking for
 * @returns {undefined|*} the "Builtin Token" object if found; else undefined
 */
function find_builtin_token(fullPath) {
    if (!fullPath.startsWith(SidebarListItem.PathAboveVTT)) {
        console.warn("find_builtin_token was called with the wrong token type.", fullPath, "should start with", SidebarListItem.PathAboveVTT);
        return undefined;
    }
    console.groupCollapsed("find_builtin_token");
    let found = builtInTokens.find(t => {
        let dirtyPath = `${SidebarListItem.PathAboveVTT}${t.folderPath}/${t.name}`;
        let fullTokenPath = sanitize_folder_path(dirtyPath);
        console.debug("looking for: ", fullPath, dirtyPath, fullTokenPath, fullTokenPath === fullPath, t);
        return fullTokenPath === fullPath;
    });
    console.debug("found: ", found);
    console.groupEnd();
    return found;
}

function backfill_mytoken_folders() {
    mytokens.forEach(myToken => {
        if (myToken.folderPath !== SidebarListItem.PathRoot) {
            // we split the path and backfill empty every folder along the way if needed. This is really important for folders that hold subfolders, but not items
            let parts = myToken.folderPath.split("/");
            let backfillPath = "";
            parts.forEach(part => {
                let fullBackfillPath = sanitize_folder_path(`${backfillPath}/${part}`);
                if (fullBackfillPath !== SidebarListItem.PathRoot && !mytokensfolders.find(fi => sanitize_folder_path(`${fi.folderPath}/${fi.name}`) === fullBackfillPath)) {
                    // we don't have this folder yet so add it
                    let newFolder = { folderPath: sanitize_folder_path(backfillPath), name: part, collapsed: true };
                    console.log("adding folder", newFolder);
                    mytokensfolders.push(newFolder);
                } else {
                    console.log("not adding folder", fullBackfillPath);
                }
                backfillPath = fullBackfillPath;
            });
        }
    });
}

/**
 * iterates over all the token sources and replaces window.tokenListItems with new objects.
 * token sources are window.pcs, mytokens, mytokensfolders, and builtInTokens
 */
function rebuild_token_items_list() {
    console.groupCollapsed("rebuild_token_items_list");

    backfill_mytoken_folders(); // just in case we're missing any folders

    // Players
    let tokenItems = window.pcs
        .filter(pc => pc.sheet !== undefined && pc.sheet !== "")
        .map(pc => SidebarListItem.PC(pc.sheet, pc.name, pc.image));

    // My Tokens Folders
    for (let i = 0; i < mytokensfolders.length; i++) {
        let folder = mytokensfolders[i];
        let myTokensPath = sanitize_folder_path(`${SidebarListItem.PathMyTokens}${folder.folderPath}`);
        tokenItems.push(SidebarListItem.Folder(myTokensPath, folder.name, folder.collapsed));
    }

    // My Tokens
    for (let i = 0; i < mytokens.length; i++) {
        let myToken = mytokens[i];
        tokenItems.push(SidebarListItem.MyToken(myToken));
    }

    // AboveVTT Tokens
    let allBuiltinPaths = builtInTokens
        .filter(item => item.folderPath !== SidebarListItem.PathRoot && item.folderPath !== "" && item.folderPath !== undefined)
        .map(item => item.folderPath);
    let builtinPaths = [...new Set(allBuiltinPaths)];
    for (let i = 0; i < builtinPaths.length; i++) {
        let path = builtinPaths[i];
        let pathComponents = path.split("/");
        let folderName = pathComponents.pop();
        let folderPath = pathComponents.join("/");
        let builtinFolderPath = `${SidebarListItem.PathAboveVTT}/${folderPath}`;
        tokenItems.push(SidebarListItem.Folder(builtinFolderPath, folderName, true));
    }
    for (let i = 0; i < builtInTokens.length; i++) {
        tokenItems.push(SidebarListItem.BuiltinToken(builtInTokens[i]));
    }

    // Encounters and Encounter Monsters
    for (const encounterId in window.EncounterHandler.encounters) {
        let encounter = window.EncounterHandler.encounters[encounterId];
        if (encounter.name === "AboveVTT") continue; // don't display our backing encounter
        tokenItems.push(SidebarListItem.Encounter(encounter));
        // encounter_monster_items[encounterId]?.forEach(monsterItem => tokenItems.push(monsterItem));
    }

    window.tokenListItems = tokenItems;
    console.groupEnd();
}

/**
 * replaces window.monsterListItems with a list of items where the item.name matches the searchTerm (case-insensitive)
 * @param searchTerm {string} the search term that the user typed into the search input
 */
function filter_token_list(searchTerm) {

    if (typeof searchTerm !== "string") {
        searchTerm = "";
    }

    console.log("filter_token_list searchTerm", searchTerm)

    redraw_token_list(searchTerm);

    if (searchTerm.length > 0) {
        let allFolders = tokensPanel.body.find(".folder");
        allFolders.removeClass("collapsed"); // auto expand all folders
        for (let i = 0; i < allFolders.length; i++) {
            let currentFolder = $(allFolders[i]);
            if (matches_full_path(currentFolder, SidebarListItem.PathMonsters)) {
                // we always want the monsters folder to be open when searching
                continue;
            }
            let nonFolderDescendents = currentFolder.find(".sidebar-list-item-row:not(.folder)");
            if (nonFolderDescendents.length === 0) {
                // hide folders without results in them
                currentFolder.hide();
            }
        }
    }

    console.log("filter_token_list about to call inject_monster_tokens");

    window.monsterListItems = []; // don't let this grow unbounded
    inject_monster_tokens(searchTerm, 0);
}

/**
 * Calls the DDB API to search for monsters matching the given searchTerm and injects the results into the sidebar panel
 * @param searchTerm {string} the search term that the user typed into the search input
 * @param skip {number} the pagination offset. This function will inject a "Load More" button with the skip details embedded. You don't need to pass anything for this.
 */
function inject_monster_tokens(searchTerm, skip) {
    console.log("inject_monster_tokens about to call search_monsters");
    search_monsters(searchTerm, skip, function (monsterSearchResponse) {
        let listItems = [];

        for (let i = 0; i < monsterSearchResponse.data.length; i++) {
            let m = monsterSearchResponse.data[i];
            let item = SidebarListItem.Monster(m)
            window.monsterListItems.push(item);
            listItems.push(item);
        }
        console.log("search_monsters converted", listItems);
        let monsterFolder = find_html_row_from_path(SidebarListItem.PathMonsters, tokensPanel.body);
        inject_monster_list_items(listItems);
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
            monsterFolder.find(`> .folder-item-list`).append(loadMoreButton);
        }
    });
}

function inject_monster_list_items(listItems) {
    let monsterFolder = find_html_row_from_path(SidebarListItem.PathMonsters, tokensPanel.body);
    if (monsterFolder === undefined || monsterFolder.length === 0) {
        console.warn("inject_monster_list_items failed to find the monsters folder");
        return;
    }
    let list = monsterFolder.find(`> .folder-item-list`);
    for (let i = 0; i < listItems.length; i++) {
        let item = listItems[i];
        let row = build_sidebar_list_row(item);
        enable_draggable_token_creation(row);
        list.append(row);
    }
}

/** Called on startup. It reads from localStorage, and initializes all the things needed for the TokensPanel to function properly */
function init_tokens_panel() {

    console.log("init_tokens_panel");

    tokens_rootfolders = [
        SidebarListItem.Folder(SidebarListItem.PathRoot, SidebarListItem.NamePlayers, false),
        SidebarListItem.Folder(SidebarListItem.PathRoot, SidebarListItem.NameMonsters, false),
        SidebarListItem.Folder(SidebarListItem.PathRoot, SidebarListItem.NameMyTokens, false),
        SidebarListItem.Folder(SidebarListItem.PathRoot, SidebarListItem.NameAboveVTT, false),
        SidebarListItem.Folder(SidebarListItem.PathRoot, SidebarListItem.NameEncounters, false)
    ];

    if(localStorage.getItem('MyTokens') != null){
        mytokens = $.parseJSON(localStorage.getItem('MyTokens'));
    }
    if(localStorage.getItem('MyTokensFolders') != null){
        mytokensfolders = $.parseJSON(localStorage.getItem('MyTokensFolders'));
    }
    if(localStorage.getItem('CustomTokens') != null){
        tokendata=$.parseJSON(localStorage.getItem('CustomTokens'));
    }

    migrate_to_my_tokens();
    migrate_token_customizations();
    rebuild_token_items_list();
    update_token_folders_remembered_state();

    let header = tokensPanel.header;
    // TODO: remove this warning once tokens are saved in the cloud
    tokensPanel.updateHeader("Tokens");
    add_expand_collapse_buttons_to_header(tokensPanel);
    header.append("<div class='panel-warning'>WARNING/WORKINPROGRESS. THIS TOKEN LIBRARY IS CURRENTLY STORED IN YOUR BROWSER STORAGE. IF YOU DELETE YOUR HISTORY YOU LOOSE YOUR LIBRARY</div>");

    let searchInput = $(`<input name="token-search" type="text" style="width:96%;margin:2%" placeholder="search tokens">`);
    searchInput.off("input").on("input", mydebounce(() => {
        let textValue = tokensPanel.header.find("input[name='token-search']").val();
        filter_token_list(textValue);
    }, 500));
    header.append(searchInput);

    register_token_row_context_menu();          // context menu for each row
    register_custom_token_image_context_menu(); // context menu for images within the customization modal

    read_local_monster_search_filters();

    window.monsterListItems = []; // don't let this grow unbounded
    setTimeout(function () {
        // give it a couple of second to make sure everything is rendered before fetching the base monsters
        // this isn't ideal, but the loading screen is up for much longer anyway...
        filter_token_list("");
    }, 2000);
}

/**
 * clears and redraws the list of tokens in the sidebar
 * @param searchTerm {string} the search term used to filter the list of tokens
 */
function redraw_token_list(searchTerm, enableDraggable = true) {
    if (!window.tokenListItems) {
        // don't do anything on startup
        return;
    }
    console.groupCollapsed("redraw_token_list");
    let list = $(`<div class="custom-token-list"></div>`);
    tokensPanel.body.empty();
    tokensPanel.body.append(list);

    let nameFilter = "";
    if (searchTerm !== undefined && typeof searchTerm === "string") {
        nameFilter = searchTerm.toLowerCase();
    }

    // first let's add our root folders
    for (let i = 0; i < tokens_rootfolders.length; i++) {
        let row = build_sidebar_list_row(tokens_rootfolders[i]);
        list.append(row);
    }

    // now let's add all other folders without filtering by searchTerm because we need the folder to exist in order to add items into it
    window.tokenListItems
        .filter(item => item.isTypeFolder())
        .sort(SidebarListItem.folderDepthComparator)
        .forEach(item => {
            let row = build_sidebar_list_row(item);
            console.debug("appending item", item);
            find_html_row_from_path(item.folderPath, list).find(` > .folder-item-list`).append(row);
        });

    // now let's add all the other items
    window.tokenListItems
        .filter(item =>
            !item.isTypeFolder() // we already added all folders so don't include them in this loop
            && item.nameOrContainingFolderMatches(nameFilter)
        )
        .sort(SidebarListItem.sortComparator)
        .forEach(item => {
            let row = build_sidebar_list_row(item);
            if (enableDraggable === true && !item.isTypeEncounter()) {
                enable_draggable_token_creation(row);
            }
            console.debug("appending item", item);
            find_html_row_from_path(item.folderPath, list).find(` > .folder-item-list`).append(row);
        });

    update_pc_token_rows();
    inject_encounter_monsters();
    console.groupEnd()
}

/**
 * Enables dragging the given html and dropping it on a scene to create a token.
 * The given html MUST be a decendent of an item marked with the class .list-item-identifier which is set by calling {set_full_path}
 * @param html {*|jQuery|HTMLElement} the html that corresponds to an item (like a row in the list of tokens)
 * @param specificImage {string} the url of the image to use. If nothing is provided, an image will be selected at random from the token's specified alternative-images.
 */
function enable_draggable_token_creation(html, specificImage = undefined) {
    html.draggable({
        appendTo: "#VTTWRAPPER",
        zIndex: 100000,
        cursorAt: {top: 0, left: 0},
        cancel: '.token-row-gear ',
        helper: function(event) {
            console.log("enable_draggable_token_creation helper");
            let draggedRow = $(event.target).closest(".list-item-identifier");
            let draggedItem = find_sidebar_list_item(draggedRow);
            let helper = draggedRow.find("img.token-image").clone();
            if (specificImage !== undefined) {
                helper.attr("src", specificImage);
            } else {
                let randomImage = random_image_for_item(draggedItem);
                helper.attr("src", randomImage);
            }
            helper.addClass("draggable-token-creation");
            return helper;
        },
        start: function (event, ui) {
            console.log("enable_draggable_token_creation start");
            let draggedRow = $(event.target).closest(".list-item-identifier");
            let draggedItem = find_sidebar_list_item(draggedRow);
            let tokenSize = token_size_for_item(draggedItem);
            let width = Math.round(window.CURRENT_SCENE_DATA.hpps) * tokenSize;
            let helperWidth = width / (1.0 / window.ZOOM);
            $(ui.helper).css('width', `${helperWidth}px`);
            $(this).draggable('instance').offset.click = {
                left: Math.floor(ui.helper.width() / 2),
                top: Math.floor(ui.helper.height() / 2)
            };
        },
        drag: function (event, ui) {
            if (event.shiftKey) {
                $(ui.helper).css("opacity", 0.5);
            } else {
                $(ui.helper).css("opacity", 1);
            }
        },
        stop: function (event, ui) {
            event.stopPropagation(); // prevent the mouseup event from closing the modal
            if ($(ui.helper).hasClass("drag-cancelled")) {
                console.log("enable_draggable_token_creation cancelled");
                return;
            }

            let droppedOn = document.elementFromPoint(event.clientX, event.clientY);
            console.log("droppedOn", droppedOn);
            if (droppedOn?.closest("#VTT")) {
                // place a token where this was dropped
                console.log("enable_draggable_token_creation stop");
                let draggedRow = $(event.target).closest(".list-item-identifier");
                let draggedItem = find_sidebar_list_item(draggedRow);
                let hidden = event.shiftKey || window.TOKEN_SETTINGS["hidden"];
                let src = $(ui.helper).attr("src");
                create_and_place_token(draggedItem, hidden, src, event.pageX, event.pageY);
            } else {
                console.log("Not dropping over element", droppedOn);
            }
        }
    });
}

/** When new PC data comes in, this updates the rows with the data found in window.PLAYER_STATS */
function update_pc_token_rows() {
    window.tokenListItems?.filter(listItem => listItem.isTypePC()).forEach(listItem => {
        let row = find_html_row(listItem, tokensPanel.body);
        if (listItem.sheet in window.TOKEN_OBJECTS) {
            row.addClass("on-scene");
            row.find("button.token-row-add").attr("title", `Locate Token on Scene`);
        } else {
            row.removeClass("on-scene");
            row.find("button.token-row-add").attr("title", `Add Token to Scene`);
        }

        let playerData = window.PLAYER_STATS[listItem.sheet];
        if (playerData !== undefined) {
            playerData.abilities.forEach(a => {
                let abilityValue = row.find(`[data-ability='${a.abilityAbbr}']`);
                abilityValue.find(".ability_modifier").text(a.modifier);
                abilityValue.find(".ability_score").text(a.score);

            });
            row.find(".pp-value").text(playerData.pp);
            row.find(".walking-value").text(playerData.walking);
            if (playerData.inspiration) {
                row.find(".inspiration").show();
            } else {
                row.find(".inspiration").hide();
            }
        }
    });
}

/**
 * Creates a {Token} object and places it on the scene.
 * @param listItem {SidebarListItem} the item to create a token from
 * @param hidden {boolean} whether or not the created token should be hidden. Passing undefined will use whatever the global token setting is.
 * @param specificImage {string} the image to use. if undefined, a random image will be used
 * @param eventPageX {number} MouseEvent.pageX if supplied, the token will be placed at this x coordinate, else centered in the view
 * @param eventPageY {number} MouseEvent.pageY if supplied, the token will be placed at this y coordinate, else centered in the view
 * @param disableSnap {boolean} if true, tokens will not snap to the grid. This is false by default and only used when placing multiple tokens
 */
function create_and_place_token(listItem, hidden = undefined, specificImage= undefined, eventPageX = undefined, eventPageY = undefined, disableSnap = false) {

    if (listItem === undefined) {
        console.warn("create_and_place_token was called without a listItem");
        return;
    }

    if (listItem.isTypeFolder() || listItem.isTypeEncounter()) {

        let tokensToPlace = [];

        if (listItem.isTypeFolder()) {
            let fullPath = listItem.fullPath();
            // find and place all items in this folder... but not subfolders
            tokensToPlace = (listItem.fullPath().startsWith(SidebarListItem.PathMonsters) ? window.monsterListItems : window.tokenListItems)
                .filter(item => !item.isTypeFolder()) // if we ever want to add everything at every subfolder depth, remove this line
                .filter(item => item.folderPath === fullPath);
        } else if (listItem.isTypeEncounter()) {
            let encounterId = listItem.encounterId;
            let encounterMonsterItems = encounter_monster_items[encounterId];
            if (encounterMonsterItems === undefined || encounterMonsterItems.length === 0) {
                let encounterRow = tokensPanel.body.find(`[data-encounter-id='${encounterId}']`);
                encounterRow.find(".sidebar-list-item-row-item").addClass("button-loading");
                refresh_encounter(encounterRow, listItem, function (response) {
                    encounterRow.find(".sidebar-list-item-row-item").removeClass("button-loading");
                    if (response === true) {
                        create_and_place_token(listItem, hidden, specificImage, eventPageX, eventPageY);
                    }
                })
                return;
            }
            window.EncounterHandler.encounters[encounterId].monsters.forEach(shortMonster => {
                let matchingItem = encounterMonsterItems.find(item => item.monsterData.id === shortMonster.id);
                // we only have one of each monster so make new ones
                tokensToPlace.push(SidebarListItem.Monster(matchingItem.monsterData))
            });
        }

        // What's the threshold we should prompt for?
        if (tokensToPlace.length < 10 || confirm(`This will add ${tokensToPlace.length} tokens which could lead to unexpected results. Are you sure you want to add all of these tokens?`)) {
            // place all tokens fanned out from the center of the view
            let center = center_of_view();
            let mapPoint = convert_point_from_view_to_map(center.x, center.y, false); // do our math on the map coordinate space
            let gridSize = Math.min(window.CURRENT_SCENE_DATA.hpps, window.CURRENT_SCENE_DATA.vpps);
            let distanceFromCenter = gridSize * Math.ceil(tokensToPlace.length / 8); // this creates a pretty decent spacing that grows with the size of the token list
            tokensToPlace.forEach((item, index) => {
                let radius = index / tokensToPlace.length;
                let left = mapPoint.x + (distanceFromCenter * Math.cos(2 * Math.PI * radius));
                let top = mapPoint.y + (distanceFromCenter * Math.sin(2 * Math.PI * radius));
                let viewPoint = convert_point_from_map_to_view(left, top); // convert back to view coordinate space because `create_and_place_token` expects view coordinates to be passed in
                create_and_place_token(item, hidden, undefined, viewPoint.x, viewPoint.y, true);
            });
        }
        return;
    }

    // set up whatever you need to. We'll override a few things after
    let options = {...window.TOKEN_SETTINGS};
    options.name = listItem.name;

    switch (listItem.type) {
        case SidebarListItem.TypeFolder:
            console.log("TODO: place all tokens in folder?", listItem);
            break;
        case SidebarListItem.TypeMyToken:
            options = {...options, ...find_token_options_for_list_item(listItem)};
            let tokenSizeSetting = myToken.tokenSize;
            let tokenSize = parseInt(tokenSizeSetting);
            if (tokenSizeSetting === undefined || typeof tokenSizeSetting !== 'number') {
                tokenSize = 1;
                // TODO: handle custom sizes
            }
            options.tokenSize = tokenSize;
            break;
        case SidebarListItem.TypePC:
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
            options.color = "#" + get_player_token_border_color(pc.sheet);
            options = {...options, ...find_token_options_for_list_item(listItem)};
            break;
        case SidebarListItem.TypeMonster:
            options.sizeId = listItem.monsterData.sizeId;
            options.hp = listItem.monsterData.averageHitPoints;
            options.max_hp = listItem.monsterData.averageHitPoints;
            options.ac = listItem.monsterData.armorClass;
            options = {...options, ...find_token_options_for_list_item(listItem)};
            options.monster = listItem.monsterData.id;
            options.stat = listItem.monsterData.id;
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
        case SidebarListItem.TypeBuiltinToken:
            options = {...options, ...find_token_options_for_list_item(listItem)};
            options.disablestat = true;
            break;
    }

    options.listItemPath = listItem.fullPath();
    options.hidden = hidden;
    options.imgsrc = random_image_for_item(listItem, specificImage);

    console.log("create_and_place_token about to place token with options", options);

    if (eventPageX === undefined || eventPageY === undefined) {
        place_token_in_center_of_view(options);
    } else {
        let mapPosition = convert_point_from_view_to_map(eventPageX, eventPageY, disableSnap);
        place_token_at_map_point(options, mapPosition.x, mapPosition.y);
    }
}

/**
 * determines the size of the token the given item represents
 * @param listItem {SidebarListItem} the item representing a token
 * @returns {number} the tokenSize that corresponds to the token you're looking for
 */
function token_size_for_item(listItem) {
    switch (listItem.type) {
        case SidebarListItem.TypeFolder:
            return 1;
        case SidebarListItem.TypeMyToken:
            let myToken = find_my_token(listItem.fullPath());
            let tokenSizeSetting = myToken.tokenSize;
            let tokenSize = parseInt(tokenSizeSetting);
            if (tokenSizeSetting === undefined || typeof tokenSizeSetting !== 'number') {
                tokenSize = 1; // TODO: handle custom sizes
            }
            return tokenSize;
        case SidebarListItem.TypePC:
            return 1;
        case SidebarListItem.TypeMonster:
            switch (listItem.monsterData.sizeId) {
                case 5: return 2;
                case 6: return 3;
                case 7: return 4;
                default: return 1;
            }
        case SidebarListItem.TypeBuiltinToken:
            return 1;
    }
}

function alternative_images_for_item(listItem) {
    let alternativeImages;
    switch (listItem.type) {
        case SidebarListItem.TypeMyToken:
            alternativeImages = find_my_token(listItem.fullPath())?.alternativeImages;
            break;
        case SidebarListItem.TypePC:
            alternativeImages = get_player_image_mappings(listItem.sheet);
            break;
        case SidebarListItem.TypeMonster:
            alternativeImages = get_custom_monster_images(listItem.monsterData.id);
            break;
        case SidebarListItem.TypeBuiltinToken:
            alternativeImages = builtInTokens.find(bt => listItem.fullPath() === sanitize_folder_path(`${SidebarListItem.PathAboveVTT}${bt.folderPath}/${bt.name}`) )?.alternativeImages;
            break;
    }

    if (alternativeImages === undefined) {
        alternativeImages = [];
    }

    return alternativeImages;
}

/**
 * finds a random image for the given item
 * @param listItem {SidebarListItem} the item you need a random image for
 * @param specificImage {string|undefined} the url of an image to use if it properly parses; if undefined or unparsable, a random image will be returned instead
 * @returns {string} the url an image associated with the provided listItem
 */
function random_image_for_item(listItem, specificImage) {
    let validSpecifiedImage = parse_img(specificImage);
    if (validSpecifiedImage !== undefined && validSpecifiedImage.length > 0) {
        console.debug("random_image_for_item validSpecifiedImage", validSpecifiedImage);
        return validSpecifiedImage
    }

    let alternativeImages = alternative_images_for_item(listItem);
    if (alternativeImages !== undefined && alternativeImages.length > 0) {
        let randomIndex = getRandomInt(0, alternativeImages.length);
        console.debug("random_image_for_item", alternativeImages, randomIndex);
        return alternativeImages[randomIndex];
    } else {
        console.debug("random_image_for_item alternativeImages empty, returning", listItem.image);
        return listItem.image;
    }
}

/**
 * queues an API request to DDB that searches for monsters
 * @param searchTerm {string} the search term used to search for monsters
 * @param skip {number} the pagination offset. (This is used with the "load more" button)
 * @param callback {function} a function that takes the JSON object returned by the DDB API
 */
function search_monsters(searchTerm, skip, callback) {
    console.log("search_monsters starting");
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
        searchParam += `&search=${encodeURIComponent(searchTerm)}`;
    }
    let filterParams = monster_search_filter_query_param();
    if (filterParams.length > 0) {
        searchParam += `&${filterParams}`;
    }
    console.log(`search_monsters calling API https://monster-service.dndbeyond.com/v1/Monster?skip=${offset}&take=10${searchParam}`);
    window.ajaxQueue.addDDBRequest({
        url: `https://monster-service.dndbeyond.com/v1/Monster?skip=${offset}&take=10${searchParam}`,
        success: function (responseData) {
            console.log(`search_monsters succeeded`, responseData);
            callback(responseData);
        },
        failure: function (errorMessage) {
            console.warn(`search_monsters failed`, errorMessage);
            callback(false);
        }
    });
}

/** sets up the contextMenu for token rows in the sidebar */
function register_token_row_context_menu() {

    // don't allow the context menu when right clicking on the add button since that adds a hidden token
    tokensPanel.body.find(".sidebar-list-item-row").on("contextmenu", ".token-row-add", function(event) {
        event.preventDefault();
        event.stopPropagation();
        let clickedRow = $(event.target).closest(".list-item-identifier");
        let clickedItem = find_sidebar_list_item(clickedRow);
        create_and_place_token(clickedItem, true);
    });

    $.contextMenu({
        selector: "#tokens-panel .sidebar-list-item-row",
        build: function(element, e) {

            let menuItems = {};

            let rowHtml = $(element);
            let rowItem = find_sidebar_list_item(rowHtml);
            if (rowItem === undefined) {
                console.warn("register_token_row_context_menu failed to find row item", element, e)
                menuItems["unexpected-error"] = {
                    name: "An unexpected error occurred",
                    disabled: true
                };
                return { items: menuItems };
            }

            menuItems["place"] = {
                name: (rowItem.isTypeFolder() || rowItem.isTypeEncounter()) ? "Place Tokens" : "Place Token",
                callback: function(itemKey, opt, originalEvent) {
                    let itemToPlace = find_sidebar_list_item(opt.$trigger);
                    create_and_place_token(itemToPlace);
                }
            };

            menuItems["placeHidden"] = {
                name: (rowItem.isTypeFolder() || rowItem.isTypeEncounter()) ? "Place Hidden Tokens" : "Place Hidden Token",
                callback: function(itemKey, opt, originalEvent) {
                    let itemToPlace = find_sidebar_list_item(opt.$trigger);
                    create_and_place_token(itemToPlace, true);
                }
            };

            if (!rowItem.isTypeFolder() && !rowItem.isTypeEncounter()) {
                // copy url doesn't make sense for folders
                menuItems["copyUrl"] = {
                    name: "Copy Url",
                    callback: function(itemKey, opt, originalEvent) {
                        let itemToCopy = find_sidebar_list_item(opt.$trigger);
                        copy_to_clipboard(itemToCopy.image);
                    }
                };
            }

            if (rowItem.canEdit() ) {
                menuItems["edit"] = {
                    name: "Edit",
                    callback: function(itemKey, opt, originalEvent) {
                        let itemToEdit = find_sidebar_list_item(opt.$trigger);
                        display_sidebar_list_item_configuration_modal(itemToEdit);
                    }
                };
            }

            if (rowItem.isTypeEncounter()) {
                menuItems["refresh"] = {
                    name: "Refresh",
                    callback: function(itemKey, opt, originalEvent) {
                        refresh_encounter(rowHtml, rowItem);
                    }
                };
            }

            if (rowItem.canDelete()) {

                menuItems["border"] = "---";

                // not a built in folder or token, add an option to delete
                menuItems["delete"] = {
                    name: "Delete",
                    callback: function(itemKey, opt, originalEvent) {
                        let itemToDelete = find_sidebar_list_item(opt.$trigger);
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

/**
 * determines if the given path exists or not.
 * @param folderPath {string} the path you are looking for
 * @returns {boolean} whether or not the path exists
 */
function my_token_path_exists(folderPath) {
    return mytokensfolders.find(token => token.folderPath === folderPath) !== undefined || mytokensfolders.find(folder => folder.folderPath === folderPath || sanitize_folder_path(`${folder.folderPath}/${folder.name}`) === folderPath) !== undefined
}

/**
 * Creates a "My Tokens" folder within another "My Tokens" folder
 * @param listItem {SidebarListItem} The folder to create a new folder within
 */
function create_mytoken_folder_inside(listItem) {
    if (!listItem.isTypeFolder() || !listItem.fullPath().startsWith(SidebarListItem.PathMyTokens)) {
        console.warn("create_mytoken_folder_inside called with an incorrect item type", listItem);
        return;
    }

    let adjustedPath = sanitize_folder_path(listItem.fullPath().replace(SidebarListItem.PathMyTokens, ""));
    let newFolderName = "New Folder";
    let newFolderCount = mytokensfolders.filter(f => f.folderPath === adjustedPath && f.name.startsWith(newFolderName)).length;
    console.log("newFolderCount", newFolderCount);
    if (newFolderCount > 0) {
        newFolderName += ` ${newFolderCount + 1}`;
    }
    let newFolder = { folderPath: adjustedPath, name: newFolderName, collapsed: true };
    mytokensfolders.push(newFolder);
    let newFolderFullPath = sanitize_folder_path(`${SidebarListItem.PathMyTokens}${newFolder.folderPath}/${newFolder.name}`);
    did_change_mytokens_items();
    expand_all_folders_up_to(newFolderFullPath, tokensPanel.body);
    let newListItem = window.tokenListItems.find(i => i.fullPath() === newFolderFullPath);
    display_folder_configure_modal(newListItem);
}

/**
 * renames a "My Tokens" folder and updates any children within that folder
 * @param item {SidebarListItem} the folder item to update
 * @param newName {string} the new name of the folder
 * @param alertUser {boolean} whether or not to alert the user if an error occurs. The most common error is naming conflicts
 * @returns {string|undefined} the path of the newly created folder; undefined if the folder could not be created.
 */
function rename_mytoken_folder(item, newName, alertUser = true) {
    if (!item.isTypeFolder() || !item.folderPath.startsWith(SidebarListItem.PathMyTokens)) {
        console.warn("rename_folder called with an incorrect item type", item);
        if (alertUser !== false) {
            alert("An unexpected error occurred");
        }
        return;
    }
    console.groupCollapsed("rename_folder");
    if (!item.canEdit()) {
        console.warn("Not allowed to rename folder", item);
        console.groupEnd();
        if (alertUser !== false) {
            alert("An unexpected error occurred");
        }
        return;
    }

    let fromFullPath = sanitize_folder_path(item.fullPath().replace(SidebarListItem.PathMyTokens, ""));
    let fromFolderPath = sanitize_folder_path(item.folderPath.replace(SidebarListItem.PathMyTokens, ""));
    let toFullPath = sanitize_folder_path(`${fromFolderPath}/${newName}`);
    if (my_token_path_exists(toFullPath)) {
        console.warn(`Attempted to rename folder to ${newName}, which would be have a path: ${toFullPath} but a folder with that path already exists`);
        console.groupEnd();
        if (alertUser !== false) {
            alert(`A Folder with the name "${newName}" already exists at "${toFullPath}"`);
        }
        return;
    }

    console.log(`updating tokens from ${fromFullPath} to ${toFullPath}`);
    mytokens.forEach(token => {
        if (token.folderPath.startsWith(fromFullPath)) {
            let newFolderPath = sanitize_folder_path(token.folderPath.replace(fromFullPath, toFullPath));
            console.debug(`changing token ${token.name} folderpath from ${token.folderPath} to ${newFolderPath}`);
            token.folderPath = newFolderPath;
        } else {
            console.debug("not moving token", token);
        }
    });

    console.debug("before renaming folder", mytokensfolders);
    mytokensfolders.forEach(folder => {
        if (folder.folderPath === fromFolderPath && folder.name === item.name) {
            console.debug(`changing folder from ${folder.name} to ${newName}`);
            folder.name = newName;
        } else if (folder.folderPath.startsWith(fromFullPath)) {
            let newFolderPath = sanitize_folder_path(folder.folderPath.replace(fromFullPath, toFullPath));
            console.debug(`changing folder ${folder.name} folderPath from ${folder.folderPath} to ${newFolderPath}`);
            folder.folderPath = newFolderPath;
        } else {
            console.debug("not moving folder", folder);
        }
    });
    console.debug("after renaming folder", mytokensfolders);

    did_change_mytokens_items();

    console.groupEnd();
    return toFullPath;
}

function delete_mytokens_within_folder(listItem) {
    console.groupCollapsed(`delete_mytokens_within_folder`);
    let adjustedPath = sanitize_folder_path(listItem.fullPath().replace(SidebarListItem.PathMyTokens, ""));

    console.log("about to delete all tokens within", adjustedPath);
    console.debug("before deleting from mytokens", mytokens);
    mytokens = mytokens.filter(token => !token.folderPath.startsWith(adjustedPath));
    console.debug("after deleting from mytokens", mytokens);

    console.log("about to delete all folders within", adjustedPath);
    console.debug("before deleting from mytokensfolders", mytokensfolders);
    mytokensfolders = mytokensfolders.filter(folder => !folder.folderPath.startsWith(adjustedPath))
    console.debug("after deleting from mytokensfolders", mytokensfolders);

    console.groupEnd();
}

function move_mytokens_to_parent_folder(listItem) {
    // this is different from move_mytokens_folder in that it moved everything out of listItem
    console.groupCollapsed(`move_mytokens_to_parent_folder`);
    let adjustedPath = sanitize_folder_path(listItem.fullPath().replace(SidebarListItem.PathMyTokens, ""));
    let oneLevelUp = sanitize_folder_path(listItem.folderPath.replace(SidebarListItem.PathMyTokens, ""));

    console.debug("before moving mytokens", mytokens);
    mytokens.forEach(token => {
        if (token.folderPath.startsWith(adjustedPath)) {
            let newFolderPath = sanitize_folder_path(token.folderPath.replace(adjustedPath, oneLevelUp));
            console.log(`moving ${token.name} up one level to ${newFolderPath}`, token);
            token.folderPath = newFolderPath;
        } else {
            console.debug(`not moving token up one level`, token);
        }
    });
    console.debug("after moving mytokens", mytokens);

    console.debug("before moving mytokensfolders", mytokensfolders);
    mytokensfolders = mytokensfolders.filter(folder => sanitize_folder_path(`${folder.folderPath}/${folder.name}`) !== adjustedPath); // remove the folder itself
    mytokensfolders.forEach(f => {
        if (f.folderPath.startsWith(adjustedPath)) {
            let newFolderPath = sanitize_folder_path(f.folderPath.replace(adjustedPath, oneLevelUp));
            console.log("moving folder up to", newFolderPath, f);
            f.folderPath = newFolderPath;
        } else {
            console.debug("not moving folder up", f);
        }
    });
    console.debug("after moving mytokensfolders", mytokensfolders);

    console.groupEnd();
}

function delete_mytokens_folder(listItem) {
    console.log("delete_mytokens_folder", listItem);
    let adjustedPath = sanitize_folder_path(listItem.fullPath().replace(SidebarListItem.PathMyTokens, ""));
    console.debug("before deleting from mytokensfolders", mytokensfolders);
    mytokensfolders = mytokensfolders.filter(folder => sanitize_folder_path(`${folder.folderPath}/${folder.name}`) !== adjustedPath);
    console.debug("after deleting from mytokensfolders", mytokensfolders);
}

/**
 * Creates a new "My Token" object within a folder
 * @param listItem {SidebarListItem} the folder item to create a token in
 */
function create_token_inside(listItem) {
    if (!listItem.isTypeFolder() || !listItem.fullPath().startsWith(SidebarListItem.PathMyTokens)) {
        console.warn("create_token_inside called with an incorrect item type", listItem);
        return;
    }

    let folderPath = listItem.fullPath().replace(SidebarListItem.PathMyTokens, "");
    let newTokenName = "New Token";
    let newTokenCount = mytokens.filter(t => t.folderPath === folderPath && t.name.startsWith(newTokenName)).length;
    console.log("newTokenCount", newTokenCount);
    if (newTokenCount > 0) {
        newTokenName += ` ${newTokenCount + 1}`;
    }

    let myToken = {
        name: newTokenName,
        folderPath: folderPath
    };
    let newItem = SidebarListItem.MyToken(myToken);

    let justInCase = find_my_token(newItem.fullPath())
    if (justInCase !== undefined) {
        console.error("Failed to create My Token", myToken, "found existing token", justInCase)
        alert("An unexpected Error Occurred!");
        return;
    }

    console.log("create_token_inside created a new item", newItem);
    mytokens.push(myToken);
    did_change_mytokens_items()
    display_token_configuration_modal(newItem)
}

/**
 * presents a SidebarPanel modal for configuring the given item
 * @param listItem {SidebarListItem} the item to configure
 * @param placedToken {undefined|Token} the token object that is on the scene
 */
function display_token_configuration_modal(listItem, placedToken = undefined) {
    switch (listItem?.type) {
        case SidebarListItem.TypeMyToken:
        case SidebarListItem.TypeMonster:
        case SidebarListItem.TypePC:
            break;
        default:
            console.warn("display_token_configuration_modal was called with incorrect item type", listItem);
            return;
    }

    // close any that are already open just to be safe
    close_sidebar_modal();
    let sidebarPanel = new SidebarPanel("token-configuration-modal");
    display_sidebar_modal(sidebarPanel);

    let name = listItem.name;
    let tokenSize = token_size_for_item(listItem);

    sidebarPanel.updateHeader(name, "", "When placing tokens, one of these images will be chosen at random. Right-click an image for more options.");
    redraw_token_images_in_modal(sidebarPanel, listItem, placedToken);

    // add a "remove all" button between the body and the footer
    let removeAllButton = build_remove_all_images_button(sidebarPanel, listItem, placedToken);
    sidebarPanel.body.after(removeAllButton);
    if (alternative_images_for_item(listItem).length === 0) {
        removeAllButton.hide();
    }

    let inputWrapper = sidebarPanel.inputWrapper;


    // we want this as a function so we can easily update the label as the user adds/removes images
    const determineLabelText = function() {
        if (alternative_images_for_item(listItem).length === 0) {
            return "Replace The Default Image";
        } else {
            return "Add More Custom Images";
        }
    }

    // images
    let addImageUrl = function (newImageUrl) {
        if (listItem.isTypeMonster()) {
            add_custom_monster_image_mapping(listItem.monsterData.id, parse_img(newImageUrl));
        } else if (listItem.isTypePC()) {
            add_player_image_mapping(listItem.sheet, parse_img(newImageUrl));
        } else if (listItem.isTypeMyToken()) {
            let myToken = find_my_token(listItem.fullPath());
            if (myToken.image === undefined || myToken.image === "") {
                // this is a new token. Replace the default image
                myToken.image = newImageUrl;
                listItem.image = newImageUrl;
            }
            if (myToken.alternativeImages === undefined) {
                myToken.alternativeImages = [];
            }
            myToken.alternativeImages.push(newImageUrl);
            did_change_mytokens_items();
        }
        redraw_token_images_in_modal(sidebarPanel, listItem, placedToken);
        removeAllButton.show();
        inputWrapper.find(".token-image-modal-footer-title").text(determineLabelText())
    };

    let imageUrlInput = sidebarPanel.build_image_url_input(determineLabelText(), addImageUrl);
    inputWrapper.append(imageUrlInput);

    if (listItem.isTypeMyToken()) {

        // MyToken footer form
        let myToken = find_my_token(listItem.fullPath());

        // token name
        inputWrapper.append($(`<div class="token-image-modal-footer-title" style="width:100%;padding-left:0px">Token Name</div>`));
        let nameInput = $(`<input data-previous-name="${name}" title="token name" placeholder="my token name" name="addCustomName" type="text" style="width:100%" value="${name === undefined ? '' : name}" />`);
        nameInput.on('keyup', function (event) {
            if (event.key === "Enter" && event.target.value !== undefined && event.target.value.length > 0) {
                console.log("update token name to", event.target.value);
                let renameSucceeded = rename_my_token(myToken, event.target.value, true);
                if (renameSucceeded) {
                    did_change_mytokens_items();
                    listItem.name = event.target.value;
                    sidebarPanel.updateHeader(event.target.value, "", "When placing tokens, one of these images will be chosen at random. Right-click an image for more options.");
                    redraw_token_images_in_modal(sidebarPanel, listItem, placedToken);
                } else {
                    $(event.target).select();
                }
            } else if (event.key === "Escape") {
                $(event.target).blur();
            }
        });
        inputWrapper.append(nameInput);

        // token size
        let tokenSizeInput = build_token_size_input(tokenSize, function (newSize) {
            myToken.tokenSize = newSize;
            persist_my_tokens();
        });
        inputWrapper.append(tokenSizeInput);

        // image scale
        let imageScaleWrapper = build_token_image_scale_input(myToken.imageSize, function (imageSize) {
            myToken.imageSize = imageSize;
            persist_my_tokens();
            decorate_modal_images(sidebarPanel, listItem, placedToken);
        });
        inputWrapper.append(imageScaleWrapper);

        // override options
        let tokenOptionsButton = build_override_token_options_button(sidebarPanel, listItem, placedToken, myToken, function(name, value) {
            if (value === true || value === false || typeof value === 'string') {
                myToken[name] = value;
            } else {
                delete myToken[name];
            }
        }, function () {
            persist_my_tokens();
            redraw_settings_panel_token_examples(myToken);
            decorate_modal_images(sidebarPanel, listItem, placedToken);
        });
        inputWrapper.append(tokenOptionsButton);
        inputWrapper.append(`<br />`);

        // submit form button
        let saveButton = $(`<button class="sidebar-panel-footer-button" style="width:100%;padding:8px;margin-top:8px;margin-left:0px;">Save Token</button>`);
        saveButton.on("click", function (event) {
            let nameInput = $(event.target).parent().find("input[name='addCustomName']");
            let updatedName = nameInput.val();
            let previousName = nameInput.attr("data-previous-name");
            if (updatedName !== previousName) {
                let renameSucceeded = rename_my_token(myToken, updatedName, true);
                if (renameSucceeded) {
                    listItem.name = updatedName;
                } else {
                    // we can't save this token until they change the name
                    nameInput.select();
                    return;
                }
            }

            // just in case, they pasted a url, but didn't press the enter key or click the Add button, we should grab the url and save it
            if (listItem.image === undefined || listItem.image.length === 0) {
                let imageUrl = $(event.target).parent().find(`input[name='addCustomImage']`)[0].value;
                if (imageUrl !== undefined && imageUrl.length > 0) {
                    addImageUrl(imageUrl);
                }
            }

            did_change_mytokens_items();
            close_sidebar_modal();
        });
        inputWrapper.append(saveButton);
    } else if (listItem.isTypePC() || listItem.isTypeMonster()) {

        let customization;
        try {
             customization = find_or_create_token_customization(listItem.type, listItem.backingId());
        } catch (error) {
            console.error("Failed to find_or_create TokenCustomization object from listItem", listItem);
            return;
        }

        if (typeof customization !== "object") {
            console.error("Ummm... we somehow don't have a TokenCustomization object?", customization, listItem);
            return;
        }

        // token size
        let tokenSizeInput = build_token_size_input(tokenSize, function (newSize) {
            customization.setTokenOption("tokenSize", newSize);
            persist_token_customization(customization);
            decorate_modal_images(sidebarPanel, listItem, placedToken);
        });
        inputWrapper.append(tokenSizeInput);

        // image scale
        let startingScale = customization.tokenOptions.imageSize || 1;
        let imageScaleWrapper = build_token_image_scale_input(startingScale, function (imageSize) {
            customization.setTokenOption("imageSize", imageSize);
            persist_token_customization(customization);
            decorate_modal_images(sidebarPanel, listItem, placedToken);
        });
        inputWrapper.append(imageScaleWrapper);

        let tokenOptionsButton = build_override_token_options_button(sidebarPanel, listItem, placedToken, customization.tokenOptions, function(name, value) {
            if (value === true || value === false || typeof value === 'string') {
                customization.setTokenOption(name, value);
            } else {
                customization.removeTokenOption(name);
            }
        }, function () {
            persist_token_customization(customization);
            redraw_settings_panel_token_examples(customization.tokenOptions);
            decorate_modal_images(sidebarPanel, listItem, placedToken);
        });
        inputWrapper.append(tokenOptionsButton);
        inputWrapper.append(`<br />`);
    }
}

function build_override_token_options_button(sidebarPanel, listItem, placedToken, options, updateValue, didChange) {
    let tokenOptionsButton = $(`<button class="sidebar-panel-footer-button" style="margin: 10px 0px 10px 0px;">Override Token Options</button>`);
    tokenOptionsButton.on("click", function (clickEvent) {
        build_and_display_sidebar_flyout(clickEvent.clientY, function (flyout) {
            let optionsContainer = build_sidebar_token_options_flyout(token_setting_options, options, TOKEN_OPTIONS_INPUT_TYPE_SELECT, function(name, value) {
                updateValue(name, value);
            }, didChange);
            optionsContainer.prepend(`<div class="sidebar-panel-header-explanation">Every time you place this token on the scene, these settings will be used. Setting the value to "Default" will use the global settings which are found in the settings tab.</div>`);
            flyout.append(optionsContainer);
            position_flyout_left_of(sidebarPanel.container, flyout);
            redraw_settings_panel_token_examples(options);
            decorate_modal_images(sidebarPanel, listItem, placedToken);
        });
    });
    return tokenOptionsButton;
}

/**
 * Renames the given "My Token" object
 * @param myToken {*} The "My Token" object to rename
 * @param newName {string} the new name
 * @param alertUser {boolean} whether or not to alert the user if an error occurs. The most common error is naming conflicts
 * @returns {boolean} whether or not object was successfully renamed
 */
function rename_my_token(myToken, newName, alertUser) {
    let newPath = sanitize_folder_path(`${myToken.folderPath}/${newName}`);
    let newFullPath = sanitize_folder_path(`${SidebarListItem.PathMyTokens}${newPath}`);
    let existing = find_my_token(newFullPath);
    if (existing !== undefined) {
        if (alertUser !== false) {
            alert(`A Token with the name "${newName}" already exists at "${newFullPath}"`);
        }
        console.warn(`A Token with the name ${newName} already exists in the folder "${SidebarListItem.PathMyTokens}${myToken.folderPath}"`);
        return false;
    }
    myToken.name = newName;
    return true;
}

/**
 * displays a SidebarPanel modal with the details of the given Builtin token. This is not editable, but shows multiple images, that can be drag and dropped onto the scene
 * @param listItem {SidebarListItem} the builtin item to display a modal for
 * @param placedToken {Token|undefined} undefined if this modal does not represnet a token that is placed on the scene; else the Token object that corresponds to a token that is placed on the scene
 */
function display_builtin_token_details_modal(listItem, placedToken) {
    if (!listItem?.isTypeBuiltinToken()) {
        console.warn("display_builtin_token_details_modal was called with incorrect item type", listItem);
        return;
    }

    // close any that are already open just to be safe
    close_sidebar_modal();

    let sidebarPanel = new SidebarPanel("builtin-token-details-modal");
    display_sidebar_modal(sidebarPanel);
    sidebarPanel.updateHeader(listItem.name, "", "When placing tokens, one of these images will be chosen at random. Right-click an image for more options.");

    redraw_token_images_in_modal(sidebarPanel, listItem, placedToken);
}

/**
 * Clears the body of the given sidebarPanel and adds a new element for every alternative image the listItem has
 * @param sidebarPanel {SidebarPanel} the modal to display objects in
 * @param listItem {SidebarListItem} the list item the modal represents
 * @param placedToken {Token|undefined} undefined if this modal does not represnet a token that is placed on the scene; else the Token object that corresponds to a token that is placed on the scene
 */
function redraw_token_images_in_modal(sidebarPanel, listItem, placedToken) {
    if (sidebarPanel === undefined) {
        console.warn("redraw_token_images_in_modal was called without a sidebarPanel");
        return;
    }
    if (listItem === undefined) {
        console.warn("redraw_token_images_in_modal was called without a listItem");
        return;
    }

    sidebarPanel.body.empty();
    let modalBody = sidebarPanel.body

    const buildTokenDiv = function(imageUrl) {
        let parsedImage = parse_img(imageUrl);
        let tokenDiv = build_alternative_image_for_modal(parsedImage, find_token_options_for_list_item(listItem), placedToken);
        if (placedToken?.isMonster()) {
            tokenDiv.attr("data-monster", placedToken.options.monster);
        }
        set_full_path(tokenDiv, listItem.fullPath());
        enable_draggable_token_creation(tokenDiv, parsedImage);
        return tokenDiv;
    }

    // clone our images array instead of using a reference so we don't accidentally change the current images for all tokens
    // we also need to parse and compare every image to know if we need to add the placedToken image
    let alternativeImages = alternative_images(listItem).map(image => parse_img(image));

    let placedImg = parse_img(placedToken?.options?.imgsrc);
    if (placedImg.length > 0 && !alternativeImages.includes(placedImg)) {
        // the placedToken image has been changed by the user so put it at the front
        let tokenDiv = buildTokenDiv(placedImg);
        tokenDiv.attr("data-token-id", placedToken.options.id);
        modalBody.append(tokenDiv);
    }

    if (alternativeImages.length === 0 && placedImg !== parse_img(listItem.image)) {
        // if we don't have any alternative images, show the default image
        let tokenDiv = buildTokenDiv(listItem.image);
        modalBody.append(tokenDiv);
    }

    for (let i = 0; i < alternativeImages.length; i++) {
        let tokenDiv = buildTokenDiv(alternativeImages[i]);
        modalBody.append(tokenDiv);
    }

    if (alternative_images_for_item(listItem).length === 0) {
        sidebarPanel.footer.find(".token-image-modal-url-label-add-wrapper .token-image-modal-url-label-wrapper .token-image-modal-footer-title").text("Replace The Default Image");
    } else {
        sidebarPanel.footer.find(".token-image-modal-url-label-add-wrapper .token-image-modal-url-label-wrapper .token-image-modal-footer-title").text("Add More Custom Images");
    }
}

/**
 * builds an HTML element for the given image
 * @param image {string} the url to display in the image
 * @param placedToken {Token} the Token object that as been placed on the scene; else undefined
 * @returns {*|jQuery|HTMLElement} the HTML that you can add to a sidebarPanel modal
 */
function build_alternative_image_for_modal(image, options, placedToken) {
    let mergedOptions = {};
    if (options !== undefined) {
        mergedOptions = {...mergedOptions, ...options};
    }
    if (placedToken !== undefined) {
        mergedOptions = {...mergedOptions, ...placedToken.options};
    }
    mergedOptions.imgsrc = image;
    let tokenDiv = build_example_token(mergedOptions);
    if (placedToken !== undefined) {
        // the user is changing their token image, allow them to simply click an image
        // we don't want to allow drag and drop from this modal
        tokenDiv.attr("data-token-id", placedToken.options.id);
        tokenDiv.on("click", function() {
            placedToken.options.imgsrc = parse_img(image);
            close_sidebar_modal();
            placedToken.place_sync_persist();
        });
    }
    tokenDiv.addClass("custom-token-image-item");
    return tokenDiv;
}

/**
 * iterates over all the images in a sidebarPanel modal and udpates them to match the settings of the given listItem.
 * @param sidebarPanel {SidebarPanel} the modal to update
 * @param listItem {SidebarListItem|undefined} the item the modal represents
 * @param placedToken {Token|undefined} the token on the scene
 */
function decorate_modal_images(sidebarPanel, listItem, placedToken) {
    if (listItem === undefined && placedToken === undefined) {
        console.warn("decorate_modal_images was called without a listItem or a placedToken");
        return;
    }
    let options = find_token_options_for_list_item(listItem);
    let items = sidebarPanel.body.find(".example-token");
    for (let i = 0; i < items.length; i++) {
        let item = $(items[i]);
        let imgsrc = item.find("img.token-image").attr("src");
        let tokenDiv = build_alternative_image_for_modal(imgsrc, options, placedToken);
        item.replaceWith(tokenDiv);
        set_full_path(tokenDiv, listItem.fullPath());
        enable_draggable_token_creation(tokenDiv, imgsrc);
    }
}

/**
 * finds and returns alternative images for the given listItem.
 * @param listItem {SidebarListItem} the item you need a random image for
 * @returns {string[]} a list of url strings
 */
function alternative_images(listItem) {
    let alternativeImages = [];
    switch (listItem.type) {
        case SidebarListItem.TypeBuiltinToken:
            let builtin = find_builtin_token(listItem.fullPath());
            alternativeImages = builtin?.alternativeImages;
            break;
        case SidebarListItem.TypeMyToken:
            let myToken = find_my_token(listItem.fullPath());
            alternativeImages = myToken?.alternativeImages;
            break;
        case SidebarListItem.TypePC:
            alternativeImages = get_player_image_mappings(listItem.sheet);
            break;
        case SidebarListItem.TypeMonster:
            alternativeImages = get_custom_monster_images(listItem.monsterData.id);
            break;
        case SidebarListItem.TypeFolder:
            break;
    }
    if (alternativeImages === undefined) {
        alternativeImages = [];
    }
    return alternativeImages;
}

/** writes mytokens and mytokensfolders to localStorage */
function persist_my_tokens() {
    localStorage.setItem("MyTokens", JSON.stringify(mytokens));
    localStorage.setItem("MyTokensFolders", JSON.stringify(mytokensfolders));
    persist_token_folders_remembered_state();
}

function persist_token_folders_remembered_state() {
    if (window.tokenListItems === undefined) return;
    let rememberedFolderState = {};
    let foldersToRemember = window.tokenListItems
        .filter(item => item.isTypeFolder() && item.fullPath().startsWith(SidebarListItem.PathAboveVTT))
        .concat(tokens_rootfolders);
    foldersToRemember.forEach(f => {
        rememberedFolderState[f.fullPath()] = f.collapsed
    });
    localStorage.setItem("TokensFolderRememberedState", JSON.stringify(rememberedFolderState));
}

function update_token_folders_remembered_state() {
    let tokenItems = window.tokenListItems.concat(tokens_rootfolders);
    if(localStorage.getItem('TokensFolderRememberedState') != null){
        let rememberedStates = JSON.parse(localStorage.getItem('TokensFolderRememberedState'));
        tokenItems.forEach(item => {
            let state = rememberedStates[item.fullPath()];
            if (state === true || state === false) {
                item.collapsed = state;
            }
        });
    }
}

function fetch_encounter_monsters_if_necessary(clickedRow, clickedItem) {
    if (clickedItem.isTypeEncounter() && clickedRow.find(".folder-item-list").is(":empty") && !clickedItem.activelyFetchingMonsters && clickedItem.encounterId !== undefined) {
        fetch_and_inject_encounter_monsters(clickedRow, clickedItem);
    }
}

function refresh_encounter(clickedRow, clickedItem, callback) {
    if (typeof callback !== 'function') {
        callback = function(){};
    }
    window.EncounterHandler.fetch_encounter(clickedItem.encounterId, function(response) {
        if (response === false) {
            console.warn("Failed to refresh encounter", response);
            callback(false);
        } else {
            clickedItem.name = response.name;
            clickedItem.description = response.flavorText;
            clickedRow.find(".sidebar-list-item-row-details-title").text(response.name);
            clickedRow.find(".sidebar-list-item-row-details-subtitle").text(response.flavorText);
            fetch_and_inject_encounter_monsters(clickedRow, clickedItem, callback);
        }
    });
}

function fetch_and_inject_encounter_monsters(clickedRow, clickedItem, callback) {
    if (typeof callback !== 'function') {
        callback = function(){};
    }
    clickedItem.activelyFetchingMonsters = true;
    clickedRow.find(".sidebar-list-item-row-item").addClass("button-loading");
    window.EncounterHandler.fetch_encounter_monsters(clickedItem.encounterId, function (response, errorType) {
        clickedItem.activelyFetchingMonsters = true;
        clickedRow.find(".sidebar-list-item-row-item").removeClass("button-loading");
        if (response === false) {
            console.warn("Failed to fetch encounter monsters", errorType);
            callback(false);
        } else {
            let monsterItems = response
                .map(monsterData => SidebarListItem.Monster(monsterData))
                .sort(SidebarListItem.sortComparator);
            encounter_monster_items[clickedItem.encounterId] = monsterItems;
            update_monster_item_cache(monsterItems); // let's cache these so we won't have to fetch them again if the user places them on the scene
            inject_encounter_monsters();
            callback(true);
        }
    });
}

function inject_encounter_monsters() {
    for (const encounterId in encounter_monster_items) {
        let monsterItems = encounter_monster_items[encounterId];
        let encounter = window.EncounterHandler.encounters[encounterId];
        let encounterRow = tokensPanel.body.find(`[data-encounter-id='${encounterId}']`);
        let encounterMonsterList = encounterRow.find(`> .folder-item-list`);
        if (encounter?.groups === undefined || encounter.groups === null || encounterMonsterList.length === 0 || encounterRow.length === 0 || monsterItems === undefined) {
            continue;
        }
        encounterMonsterList.empty();
        encounter.groups.sort((lhs, rhs) => lhs.order - rhs.order).forEach(encounterGroup => {
            let groupDiv = $(`<div class="encounter-monster-group"></div>`);
            encounterMonsterList.append(groupDiv);

            let monsters = encounter.monsters
                .filter(m => m.groupId === encounterGroup.id)
                .sort((lhs, rhs) => lhs.order - rhs.order);

            if (monsters.length > 1) {
                groupDiv.addClass("grouped");
                if (typeof encounterGroup.name == "string" && encounter.name.length > 0) {
                    groupDiv.append(`<div>${encounterGroup.name}</div>`);
                }
            }

            monsters.forEach(shortMonster => {
                let monsterItem = monsterItems.find(item => item.monsterData.id === shortMonster.id);
                let monsterRow = build_sidebar_list_row(monsterItem);
                enable_draggable_token_creation(monsterRow);
                groupDiv.append(monsterRow);
            });
        });
    }
}

/** A convenience function to be called after any "My Tokens" are updated */
function did_change_mytokens_items() {
    persist_my_tokens();
    rebuild_token_items_list();
    update_token_folders_remembered_state();
    redraw_token_list();
    // filter_token_list(tokensPanel.body.find(".token-search").val());
}

/**
 * creates an iframe that loads a monster stat block for the given item
 * @param listItem {SidebarListItem} the list item representing the monster that you want to display a stat block for
 */
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

    let rowHtml = find_html_row(listItem, tokensPanel.body);
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

        let closeButton = build_close_button();
        contents.find(".page-header__primary > .page-heading").append(closeButton);
        closeButton.css({
            "position": "fixed",
            "top": "10px",
            "right": "10px",
            "box-shadow": "rgb(51 51 51) 0px 0px 60px 0px"
        });
        closeButton.on("click", function () {
            $("#monster-details-page-iframe").remove();
        });

        contents.find(".main.content-container").attr("style", "padding:0!important");
        contents.find(".more-info.details-more-info").css("padding", "8");
        contents.find(".mon-stat-block").css("column-count", "1");
        contents.find("a").attr("target", "_blank");

        scan_creature_pane(contents, listItem.monsterData.name, listItem.monsterData.avatarUrl);

        contents.find("body").append(`<style>
            button.avtt-roll-button {
                /* lifted from DDB encounter stat blocks  */
                color: #b43c35;
                border: 1px solid #b43c35;
                border-radius: 4px;
                background-color: #fff;
                white-space: nowrap;
                font-size: 14px;
                font-weight: 600;
                font-family: Roboto Condensed,Open Sans,Helvetica,sans-serif;
                line-height: 18px;
                letter-spacing: 1px;
                padding: 1px 4px 0;
            }
            </style>
        `);

    });


    iframe.attr("src", listItem.monsterData.url);
}

/** calls the DDB API to fetch all PCs in the campaign... It currently throws a CORS error */
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

/**
 * translates a DDB challenge rating identifier to a human-readable string
 * @param crId {number} the challenge rating identifier to translate
 * @returns {string} a human-readable challenge rating
 */
function convert_challenge_rating_id(crId) {
    switch (crId) {
        case 0: return "0"; // ???
        case 1: return "0";
        case 2: return "1/8";
        case 3: return "1/4";
        case 4: return "1/2";
        default: return `${crId - 4}`;
    }
}

function display_monster_filter_modal() {

    let iframe = $(`<iframe id='monster-filter-iframe'></iframe>`);
    iframe.css({
        "width": "100%",
        "height": "100%",
        "top": "0px",
        "left": "0px",
        "position": "absolute",
        "border": "none",
        "z-index": -10
    });
    tokensPanel.display_sidebar_loading_indicator("Fetching Filters");
    tokensPanel.container.append(iframe);
    iframe.attr("scrolling", "no");
    iframe.on("load", function(event) {

        if (!this.src) {
            // it was just created. no need to do anything until it actually loads something
            return;
        }

        $(event.target).contents().find("body").addClass("prevent-sidebar-modal-close");
        $(event.target).contents().find(".monster-listing__header button").click();
        $(event.target).contents().find(".popup-overlay").css("background", "rgb(235, 241, 245)");
        $(event.target).contents().find(".popup-content").css({
            "width": "100%",
            "height": "100%",
            "max-width": "100%",
            "max-height": "100%",
            "margin": 0
        });
        $(event.target).contents().find(".popup-overlay").on("click", function (e) {
            if ($(e.target).hasClass("popup-overlay")) {
                e.stopPropagation();
            }
        });

        let closeButton = build_close_button();
        closeButton.css({
            "position": "fixed",
            "top": "10px",
            "right": "10px",
            "box-shadow": "rgb(51 51 51) 0px 0px 60px 0px"
        });
        closeButton.on("click", function (clickEvent) {
            clickEvent.stopPropagation();
            close_monster_filter_iframe();
        });
        $(event.target).contents().find(".popup-content").prepend(closeButton);

        tokensPanel.remove_sidebar_loading_indicator();
        iframe.css({ "z-index": 10 });
    });
    iframe.attr("src", `https://www.dndbeyond.com/encounters/${window.EncounterHandler.avttId}/edit`);

}

function close_monster_filter_iframe() {
    let sidebarMonsterFilter = $("#monster-filter-iframe");

    if(localStorage.getItem('DDBEB-monster-filters') != null) {
        // the user has the "remember filters" option checked... let's grab our data and move on
        read_local_monster_search_filters();
        sidebarMonsterFilter.remove();
        tokensPanel.remove_sidebar_loading_indicator(); // if the user double clicks, we might remove iframe before dismissing the loading indicator
        let textValue = tokensPanel.header.find("input[name='token-search']").val();
        filter_token_list(textValue);
    } else {
        // we need to enable the "remember filters" option, grab our data, then disable the "remember filters" option
        sidebarMonsterFilter.hide(); // don't let them see us messing with the UI
        let rememberButton = $(sidebarMonsterFilter[0].contentDocument.body).find(".qa-monster-filters_remember");
        rememberButton.click();
        setTimeout(function() { // make sure we let the "remember filter" click propagate before we harvest that data
            read_local_monster_search_filters();
            rememberButton.click();
            sidebarMonsterFilter.remove();
            tokensPanel.remove_sidebar_loading_indicator(); // if the user double clicks, we might remove iframe before dismissing the loading indicator
            let textValue = tokensPanel.header.find("input[name='token-search']").val();
            filter_token_list(textValue);
        });
    }
}

function read_local_monster_search_filters() {
    if(localStorage.getItem('DDBEB-monster-filters') != null){
        monster_search_filters = $.parseJSON(localStorage.getItem('DDBEB-monster-filters'));
    } else {
        monster_search_filters = {};
    }
    if (Object.keys(monster_search_filters).length > 0) {
        $(".monster-filter-button").css("color", "#1b9af0");
    } else {
        $(".monster-filter-button").css("color", "#838383");
    }
    console.log("monster_search_filters", monster_search_filters);
}

/** @returns {string} the query params to use when searching for monsters via the DDB API */
function monster_search_filter_query_param() {
    let queryParams = []; // a list of strings in the format `key=value`
    for (let filterKey in monster_search_filters) {
        let filterValue = monster_search_filters[filterKey];
        if (Array.isArray(filterValue)) {
            for (let i = 0; i < filterValue.length; i++) {
                let currentValue = filterValue[i];
                queryParams.push(`${filterKey}=${currentValue}`);
            }
        } else {
            queryParams.push(`${filterKey}=${filterValue}`);
        }
    }
    return queryParams.join("&");
}

function register_custom_token_image_context_menu() {
    $.contextMenu({
        selector: ".custom-token-image-item",
        items: {
            place: {
                name: "Place Token",
                callback: function (itemKey, opt, originalEvent) {
                    let itemToPlace = find_sidebar_list_item(opt.$trigger);
                    let specificImage = undefined;
                    let imgSrc = opt.$trigger.find("img.token-image").attr("src");
                    if (imgSrc !== undefined && imgSrc.length > 0) {
                        specificImage = imgSrc;
                    }
                    create_and_place_token(itemToPlace, false, specificImage);
                }
            },
            placeHidden: {
                name: "Place Hidden Token",
                callback: function (itemKey, opt, originalEvent) {
                    let itemToPlace = find_sidebar_list_item(opt.$trigger);
                    let specificImage = undefined;
                    let imgSrc = opt.$trigger.find("img.token-image").attr("src");
                    if (imgSrc !== undefined && imgSrc.length > 0) {
                        specificImage = imgSrc;
                    }
                    create_and_place_token(itemToPlace, true, specificImage);
                }
            },
            copy: {
                name: "Copy Url",
                callback: function (itemKey, opt, e) {
                    let selectedItem = $(opt.$trigger[0]);
                    let imgSrc = selectedItem.find("img").attr("src");
                    copy_to_clipboard(imgSrc);
                }
            },
            border: "---",
            remove: {
                name: "Remove",
                callback: function (itemKey, opt, originalEvent) {
                    let selectedItem = $(opt.$trigger[0]);
                    let imgSrc = selectedItem.find("img").attr("src");
                    let listItem = find_sidebar_list_item(opt.$trigger);

                    // if they are removing the image that is set on a token, ask them if they really want to remove it
                    let placedTokenId = selectedItem.attr("data-token-id");
                    let placedToken = window.TOKEN_OBJECTS[placedTokenId];
                    if (placedToken !== undefined && placedToken.options.imgsrc === imgSrc) {
                        let continueRemoving = confirm("This image is set on the token. Removing it will remove the image on the token as well. Are you sure you want to remove this image?")
                        if (!continueRemoving) {
                            return;
                        }
                        placedToken.options.imgsrc = "";
                        placedToken.place_sync_persist();
                    }

                    if (listItem?.isTypeMyToken()) {
                        let myToken = find_my_token(listItem.fullPath());
                        if (myToken.alternativeImages !== undefined) {
                            array_remove_index_by_value(myToken.alternativeImages, imgSrc);
                        }
                        if (myToken.image === imgSrc) {
                            if (myToken.alternativeImages !== undefined && myToken.alternativeImages.length > 0) {
                                myToken.image = myToken.alternativeImages[0];
                            } else {
                                myToken.image = "";
                            }
                        }
                        did_change_mytokens_items();
                    } else if (listItem?.isTypeMonster()) {
                        let monsterId = listItem.monsterData.id;
                        remove_custom_monster_image(monsterId, imgSrc);
                        redraw_token_images_in_modal(window.current_sidebar_modal, listItem, placedToken);
                    } else if (listItem?.isTypePC()) {
                        let playerId = listItem.sheet;
                        remove_player_image_mapping(playerId, imgSrc);
                        if (get_player_image_mappings(playerId).length === 0) {
                            redraw_token_images_in_modal(window.current_sidebar_modal, listItem, placedToken);
                        }
                    } else {
                        alert("An unexpected error occurred");
                    }

                    selectedItem.remove();
                }
            }
        }
    });
}

function remove_all_images_for_my_token(listItem) {
    if (!listItem.isTypeMyToken()) {
        console.warn("remove_all_images_for_my_token was called with the wrong item type", listItem);
        return;
    }
    let myToken = find_my_token(listItem.fullPath());
    if (myToken === undefined) {
        console.warn("remove_all_images_for_my_token could not find mytoken matching item", listItem);
        return;
    }
    myToken.alternativeImages = [];
    myToken.image = "";
    did_change_mytokens_items();
}

function build_remove_all_images_button(sidebarPanel, listItem, placedToken) {
    // add a "remove all" button between the body and the footer
    let removeAllButton = $(`<button class="token-image-modal-remove-all-button" title="Reset this token back to the default image.">Remove All Custom Images</button>`);
    removeAllButton.on("click", function(event) {
        let tokenName = listItem !== undefined ? listItem.name : placedToken.options.name
        if (window.confirm(`Are you sure you want to remove all custom images for ${tokenName}?\nThis will reset the token images back to the default`)) {
            if (listItem?.isTypeMonster() || placedToken?.isMonster()) {
                let monsterId = listItem !== undefined ? listItem.monsterData.id : placedToken.options.monster;
                remove_all_custom_monster_images(monsterId);
            } else if (listItem?.isTypePC() || placedToken?.isPlayer()) {
                let playerId = listItem !== undefined ? listItem.sheet : placedToken.options.id;
                remove_all_player_image_mappings(playerId);
            } else if (listItem.isTypeMyToken()) {
                remove_all_images_for_my_token(listItem);
                listItem.image = "";
            } else {
                alert("An unexpected error occurred");
            }
            redraw_token_images_in_modal(sidebarPanel, listItem, placedToken);
            $(event.currentTarget).hide();
        }
    });
    return removeAllButton;
}

function find_token_options_for_list_item(listItem) {
    if (listItem.isTypeMyToken()) {
        // TODO: soon to use find_token_customization as well
        return find_my_token(listItem.fullPath());
    } else if (listItem.isTypeBuiltinToken()) {
        return find_builtin_token(listItem.fullPath());
    } else {
        return find_token_customization(listItem.type, listItem.sheet)?.tokenOptions || {};
    }
}

function display_change_image_modal(placedToken) {
    if (placedToken === undefined) {
        console.warn("Attempted to call display_change_image_modal without a token");
        return;
    }

    close_sidebar_modal();
    let sidebarPanel = new SidebarPanel("token-change-image-modal");
    display_sidebar_modal(sidebarPanel);
    let modalBody = sidebarPanel.body;

    /// update the modal header
    sidebarPanel.updateHeader(placedToken.options.name, "Token Images", "Click an image below to update your token or enter a new image URL at the bottom.");

    /// draw tokens in the body
    let listItem = list_item_from_token(placedToken);
    redraw_token_images_in_modal(sidebarPanel, listItem, placedToken);

    // add a "remove all" button between the body and the footer
    let removeAllButton = build_remove_all_images_button(sidebarPanel, listItem, placedToken);
    modalBody.after(removeAllButton);

    /// build the footer

    // we want this as a function so we can easily get the updated list as the user adds/removes images
    const findAlternativeImages = function() {
        let alternativeImages;
        if (placedToken.isMonster()) {
            alternativeImages = get_custom_monster_images(placedToken.options.monster);
        } else if (placedToken.isPlayer()) {
            alternativeImages = get_player_image_mappings(placedToken.options.id);
        } else {
            alternativeImages = alternative_images_for_item(listItem);
        }
        if (alternativeImages === undefined) {
            alternativeImages = [];
        }
        return alternativeImages;
    };

    // we want this as a function so we can easily update the label as the user adds/removes images
    const determineLabelText = function() {
        if (findAlternativeImages().length === 0) {
            return "Replace The Default Image";
        } else {
            return "Add More Custom Images";
        }
    }

    // this will be called when the user enters a new url
    const add_token_customization_image = function(imageUrl) {
        if(imageUrl.startsWith("data:")){
            alert("You cannot use urls starting with data:");
            return;
        }
        if (findAlternativeImages().length === 0) {
            // this is the first custom image so remove the default image before appending the new one
            sidebarPanel.body.empty();
        }
        if (placedToken.isMonster()) {
            add_custom_monster_image_mapping(placedToken.options.monster, parse_img(imageUrl));
        } else if (placedToken.isPlayer()) {
            add_player_image_mapping(placedToken.options.id, parse_img(imageUrl));
        } else if (listItem?.isTypeMyToken()) {
            let myToken = find_my_token(listItem.fullPath());
            if (myToken.image === undefined || myToken.image === "") {
                myToken.image = parse_img(imageUrl);
            }
            myToken.alternativeImages.push(parse_img(imageUrl));
            did_change_mytokens_items();
        }
        let tokenDiv = build_alternative_image_for_modal(imageUrl, find_token_options_for_list_item(listItem), placedToken);
        modalBody.append(tokenDiv);
        footerLabel.text(determineLabelText())
        removeAllButton.show();
    };
    if (alternative_images_for_item(listItem).length === 0) {
        removeAllButton.hide();
    }

    let imageUrlInput = sidebarPanel.build_image_url_input(determineLabelText(), add_token_customization_image);
    sidebarPanel.inputWrapper.append(imageUrlInput);
    let footerLabel = imageUrlInput.find("div.token-image-modal-footer-title");

    let inputWrapper = sidebarPanel.inputWrapper;
    sidebarPanel.footer.find(`.token-image-modal-add-button`).remove();
    // allow them to use the new url for the placed token without saving the url for all future tokens
    let onlyForThisTokenButton = $(`<button class="sidebar-panel-footer-button" title="This url will be used for this token only. New tokens will continue to use the images shown above.">Set for this token only</button>`);
    onlyForThisTokenButton.on("click", function(event) {
        let imageUrl = $(`input[name='addCustomImage']`)[0].value;
        if (imageUrl !== undefined && imageUrl.length > 0) {
            placedToken.options.imgsrc = parse_img(imageUrl);
            close_sidebar_modal();
            placedToken.place_sync_persist();
        }
    });
    inputWrapper.append(onlyForThisTokenButton);
    let addForAllButton = $(`<button class="sidebar-panel-footer-button" title="New tokens will use this new image instead of the default image. If you have more than one custom image, one will be chosen at random when you place a new token.">Add for all future tokens</button>`);
    addForAllButton.on("click", function(event) {
        let imageUrl = $(`input[name='addCustomImage']`)[0].value;
        if (imageUrl !== undefined && imageUrl.length > 0) {
            add_token_customization_image(parse_img(imageUrl));
        }
    });
    inputWrapper.append(addForAllButton);
    inputWrapper.append($(`<div class="sidebar-panel-header-explanation" style="padding:4px;">You can access this modal from the Tokens tab by clicking the gear button on the right side of the token row.</div>`));
}

const fetch_and_cache_scene_monster_items = mydebounce( (clearCache = false) => {
    console.log("fetch_and_cache_scene_monster_items");
    if (clearCache) {
        cached_monster_items = {};
    }
    let monsterIds = [];
    for (let id in window.TOKEN_OBJECTS) {
        let token = window.TOKEN_OBJECTS[id];
        if (token.isMonster()) {
            let alreadyCached = cached_monster_items[token.options.monster];
            if (alreadyCached === undefined) {
                // we only want monsters that we haven't already cached. no need to keep fetching the same things
                monsterIds.push(token.options.monster);
            }
        }
    }
    if (monsterIds.length === 0) {
        console.log("fetch_and_cache_scene_monster_items no monsters to fetch");
        return;
    }
    console.log("fetch_and_cache_scene_monster_items calling fetch_monsters with ids: ", monsterIds);
    window.EncounterHandler.fetch_monsters(monsterIds, function (response) {
        if (response !== false) {
            update_monster_item_cache(response.map(m => SidebarListItem.Monster(m)));
        }
    });
});

function update_monster_item_cache(newItems) {
    newItems.forEach(item => cached_monster_items[item.monsterData.id] = item);
}

function move_mytoken_to_folder(listItem, folderPath) {
    if (!listItem.isTypeMyToken()) {
        console.warn("move_mytoken_to_folder was called with the wrong item type", listItem);
        return;
    }
    let myToken = find_my_token(listItem.fullPath());
    if (!myToken) {
        console.warn("move_mytoken_to_folder could not find myToken for listItem", listItem);
        return;
    }
    myToken.folderPath = sanitize_folder_path(folderPath.replace(SidebarListItem.PathMyTokens, ""));
}

function move_mytokens_folder(listItem, folderPath) {
    // this is different from move_mytokens_to_parent_folder in that it moves the listItem keeping everything within the folder intact
    if (listItem.isTypeFolder() && listItem.folderPath.startsWith(SidebarListItem.PathMyTokens)) {
        console.groupCollapsed("move_mytokens_folder");

        let fromPath = sanitize_folder_path(listItem.fullPath().replace(SidebarListItem.PathMyTokens, ""));

        let folderObject = find_my_token_folder(listItem.fullPath());
        let newFolderPath = sanitize_folder_path(folderPath.replace(SidebarListItem.PathMyTokens, ""));
        if (folderObject) {
            folderObject.folderPath = newFolderPath;
        }
        listItem.folderPath = newFolderPath;

        let toPath = sanitize_folder_path(listItem.fullPath().replace(SidebarListItem.PathMyTokens, ""));

        console.debug("before moving mytokens", mytokens);
        mytokens.forEach(token => {
            if (token.folderPath.startsWith(fromPath)) {
                let newFolderPath = sanitize_folder_path(token.folderPath.replace(fromPath, toPath));
                console.log(`moving ${token.name} up one level to ${newFolderPath}`, token);
                token.folderPath = newFolderPath;
            } else {
                console.debug(`not moving token up one level`, token);
            }
        });
        console.debug("after moving mytokens", mytokens);

        console.debug("before moving mytokensfolders", mytokensfolders);
        mytokensfolders.forEach(f => {
            if (f.folderPath.startsWith(fromPath)) {
                let newFolderPath = sanitize_folder_path(f.folderPath.replace(fromPath, toPath));
                console.log("moving folder up to", newFolderPath, f);
                f.folderPath = newFolderPath;
            } else {
                console.debug("not moving folder up", f);
            }
        });
        console.debug("after moving mytokensfolders", mytokensfolders);

        console.groupEnd();
    } else {
        console.warn("move_mytoken_to_folder was called with the wrong item type", listItem);
    }
}

function migrate_token_customizations() {
    load_custom_monster_image_mapping();
    if (window.CUSTOM_TOKEN_IMAGE_MAP.didMigrate === true) {
        console.log("migrate_token_customizations has already completed");
        return;
    }
    try {
        let newCustomizations = [];

        console.log("migrate_token_customizations starting to migrate player customizations");
        // converting from a map with the id as the key to a list of objects with the id inside the object
        let oldCustomizations = read_player_token_customizations();
        for (let playerId in oldCustomizations) {
            if (typeof playerId === "string" && playerId.length > 0) {
                const newCustomization = TokenCustomization.PC(playerId, oldCustomizations[playerId]);
                newCustomizations.push(newCustomization);
                oldCustomizations[playerId].didMigrate = true;
                console.debug("migrate_token_customizations migrated", oldCustomizations[playerId], "to", newCustomization);
            } else {
                console.debug("migrate_token_customizations did not migrate", oldCustomizations[playerId]);
            }
        }
        console.log("migrate_token_customizations finished migrating player customizations");

        if (window.CUSTOM_TOKEN_IMAGE_MAP.didMigrate !== true) {
            console.log("migrate_token_customizations starting to migrate monster customizations");
            for(let monsterIdNumber in window.CUSTOM_TOKEN_IMAGE_MAP) {
                const images = window.CUSTOM_TOKEN_IMAGE_MAP[monsterIdNumber];
                const monsterId = `${monsterIdNumber}`; // monster ids are numbers, but we want it to be a string to be consistent with other ids
                const newCustomization = TokenCustomization.Monster(monsterId, { alternativeImages: images });
                newCustomizations.push(newCustomization);
                console.debug("migrate_token_customizations migrated", monsterIdNumber, images, "to", newCustomization);
            }
            console.log("migrate_token_customizations finished migrating monster customizations");
        }

        persist_all_token_customizations(newCustomizations, function (success, errorType) {
            if (success === true) {
                // TODO: remove them entirely at some point
                write_player_token_customizations(oldCustomizations);
                window.CUSTOM_TOKEN_IMAGE_MAP.didMigrate = true;
                save_custom_monster_image_mapping();
                console.log("migrate_token_customizations successfully persisted migrated customizations", newCustomizations);
            } else {
                console.error("migrate_token_customizations failed to persist new customizations", newCustomizations, errorType);
            }
        });

    } catch (error) {
        console.error("migrate_token_customizations failed", error);
    }
}

function rollback_token_customizations_migration() {
    localStorage.setItem("TokenCustomizations", JSON.stringify([]));
    let playerCustomizations = read_player_token_customizations();
    for (let playerId in playerCustomizations) {
        playerCustomizations[playerId].didMigrate = false;
    }
    write_player_token_customizations(playerCustomizations);
    window.CUSTOM_TOKEN_IMAGE_MAP.didMigrate = false;
    save_custom_monster_image_mapping();
}

function persist_all_token_customizations(customizations, callback) {
    console.log("persist_all_token_customizations starting");
    // TODO: send to cloud instead of storing locally
    localStorage.setItem("TokenCustomizations", JSON.stringify(customizations));
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
            console.warn(`persist_all_token_customizations succeeded`, response);
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
        if (existingIndex) {
            window.TOKEN_CUSTOMIZATIONS[existingIndex] = customization;
        } else {
            window.TOKEN_CUSTOMIZATIONS.push(customization);
        }

        window.persist_all_token_customizations(window.TOKEN_CUSTOMIZATIONS);


    } catch (error) {
        console.error("failed to persist customization", customization);
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


// these are what the cloud data will look like
// const tokenCustomizationExamples = [
//     {
//         id: "/userid/characterId",
//         type: "pc",
//         tokenOptions: {
//           alternativeImages: [],
//           square: true,
//           ...
//         }
//     },
//     {
//         id: "17001",
//         type: "monster",
//         tokenOptions: { ... }
//     },
//     // probably don't need to do any of the below, but we could
//     {
//         id: "playersFolder",
//         type: "folder",
//         alternativeImages: [], // will always be empty because folders don't have images
//         tokenOptions: {}
//     },
//     {
//         id: "monstersFolder",
//         type: "folder",
//         alternativeImages: [], // will always be empty because folders don't have images
//         tokenOptions: {}
//     },
//     {
//         id: "myTokensFolder",
//         type: "folder",
//         alternativeImages: [], // will always be empty because folders don't have images
//         tokenOptions: {}
//     }
// ];
//
// const myTokenExamples = [
//     {
//         id: uuid(),
//         name: "Wagon",
//         type: "myToken",
//         folderPath: "/Vehicles",
//         alternativeImages: [],
//         tokenOptions: {}
//     },
//     {
//         id: uuid(),
//         name: "Vehicles",
//         type: "Folder",
//         folderPath: "/",
//         alternativeImages: [],
//         tokenOptions: {}
//     }
// ];

class TokenCustomization {

    /**
     * @param playerSheet {string} the id of the DDB character
     * @param tokenOptions {object} the overrides for token.options
     * @returns {TokenCustomization} the token customization for the player
     * @constructor
     */
    static PC(playerSheet, tokenOptions) {
        return new TokenCustomization(playerSheet, SidebarListItem.TypePC, tokenOptions);
    }

    /**
     * @param monsterId {number|string} the id of the DDB monster
     * @param tokenOptions {object} the overrides for token.options
     * @returns {TokenCustomization} the token customization for the monster
     * @constructor
     */
    static Monster(monsterId, tokenOptions) {
        return new TokenCustomization(`${monsterId}`, SidebarListItem.TypeMonster, tokenOptions);
    }

    static MyToken(id, tokenOptions) {
        return new TokenCustomization(id, SidebarListItem.TypeMyToken, tokenOptions);
    }

    static Folder(id, tokenOptions) {
        return new TokenCustomization(id, SidebarListItem.TypeFolder, tokenOptions);
    }

    /**
     * @param obj {object} the raw JSON object with the same structure as a TokenCustomization object
     * @returns {TokenCustomization} a typed object instead of the raw JSON object that was given
     */
    static fromJson(obj) {
        return new TokenCustomization(obj.id, obj.tokenType, obj.tokenOptions);
    }

    static validTypes = [SidebarListItem.TypePC, SidebarListItem.TypeMonster, SidebarListItem.TypeMyToken, SidebarListItem.TypeFolder];
    // never call this directly! use the static functions above
    constructor(id, tokenType, tokenOptions) {
        if (!TokenCustomization.validTypes.includes(tokenType)) {
            throw `Invalid Type ${tokenType}`;
        }
        if (typeof id !== "string" || id.length === 0) {
            throw `Invalid id ${id}`;
        }
        this.id = id;
        this.tokenType = tokenType;
        if (typeof tokenOptions === "object") {
            this.tokenOptions = tokenOptions;
        } else {
            this.tokenOptions = {};
        }
    }

    setTokenOption(key, value) {
        this.tokenOptions[key] = value;
    }
    removeTokenOption(key) {
        delete this.tokenOptions[key];
    }

    addAlternativeImage(imageUrl) {
        if (imageUrl.startsWith("data:")) {
            return;
        }
        if (this.tokenOptions.alternativeImages === undefined) {
            this.tokenOptions.alternativeImages = [];
        }
        const parsed = parse_img(imageUrl);
        if (!this.tokenOptions.includes(parsed)) {
            this.tokenOptions.push(parsed);
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
}

/**
 * @param type {string} the type of customization you're looking for. EX: SidebarListItem.TypeMonster
 * @param id {string|number} the id of the customization you're looking for. EX: pc.sheet, monsterData.id, etc
 * @returns {TokenCustomization|undefined} a token customization for the item if found, else undefined
 */
function find_token_customization(type, id) {
    return window.TOKEN_CUSTOMIZATIONS.find(c => c.tokenType === type && c.id === `${id}`); // convert it to a string just to be safe. DDB monsters use numbers for ids, but we use strings for everything
}

/**
 * @param type {string} the type of customization you're looking for. EX: SidebarListItem.TypeMonster
 * @param id {string|number} the id of the customization you're looking for. EX: pc.sheet, monsterData.id, etc
 * @returns {TokenCustomization|undefined} a token customization for the item if found. If not found, a new TokenCustomization object will be created and returned.
 * @throws an error if a customization object cannot be created
 */
function find_or_create_token_customization(type, id) {
    return find_token_customization(type, id) || new TokenCustomization(id, type, {});
}



/**
 * @param playerSheet {string} the id of the DDB character
 * @returns {TokenCustomization|undefined} a token customization for the monster or undefined if not found
 */
function find_player_token_customization(playerSheet) {
    return window.TOKEN_CUSTOMIZATIONS.find(c => c.tokenType === SidebarListItem.TypePC && c.id === playerSheet);
}

/**
 * @param playerSheet {string} the id of the DDB character
 * @returns {TokenCustomization} a token customization for the player. If it doesn't already exist, a new one will be created and returned
 */
function get_player_token_customization(playerSheet) {
    return find_player_token_customization(playerSheet) || TokenCustomization.PC(playerSheet, {});
}

