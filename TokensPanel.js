
mytokens = [];
mytokensfolders = [];
tokens_rootfolders = [];
monster_search_filters = {};
encounter_monster_items = {}; // encounterId: SidebarTokenItem[]
cached_monster_items = {}; // monsterId: SidebarTokenItem
aoe_items = [];

/** Reads in tokendata, and writes to mytokens and mytokensfolders; marks tokendata objects with didMigrateToMyToken = false; */
function migrate_tokendata() {

    let migratedFolders = [];
    let migratedTokens = [];

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
                let existing = migratedTokens.find(t => t.name === newToken.name && t.folderPath === newToken.folderPath)
                if (existing !== undefined) {
                    console.log("migrate_to_my_tokens not adding duplicate token", newToken);
                } else {
                    console.log("migrate_to_my_tokens successfully migrated token", newToken, "from", oldToken);
                    migratedTokens.push(newToken);
                }
                oldToken.didMigrateToMyToken = true;
            }
        }
        if (folder.folders) {
            for (let folderKey in folder.folders) {
                if (folderKey.includes("AboveVTT BUILTIN")) {
                    continue; // not migrating built in tokens
                }
                migratedFolders.push({ name: folderKey, folderPath: currentFolderPath, collapsed: true });
                migrateFolderAtPath(`${currentFolderPath}/${folderKey}`);
            }
        }
    }

    migrateFolderAtPath(RootFolder.Root.path);
    return migrate_convert_mytokens_to_customizations(migratedFolders, migratedTokens);
}

/** erases mytokens and mytokensfolders; marks tokendata objects with didMigrateToMyToken = false; */
function rollback_from_my_tokens() {
    console.warn("rollback_from_my_tokens is no longer supported");
    return;

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
    rollbackFolderAtPath(RootFolder.Root.path);
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
    let fullPath = sanitize_folder_path(`${RootFolder.Players.path}/${pc.name}`);
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
            let convertedPath = tokenDataPath.replace("/AboveVTT BUILTIN", RootFolder.AboveVTT.path);
            let fullPath = sanitize_folder_path(`${convertedPath}/${tokenDataName}`);
            return find_sidebar_list_item_from_path(fullPath);
        } else {
            let fullPath = sanitize_folder_path(`${RootFolder.MyTokens.path}/${tokenDataPath}/${tokenDataName}`);
            return find_sidebar_list_item_from_path(fullPath);
        }
    }
}

/**
 * Finds a "Builtin Token" that matches the given path
 * @param fullPath {string} the path of the "Builtin Token" you're looking for
 * @returns {undefined|*} the "Builtin Token" object if found; else undefined
 */
function find_builtin_token(fullPath) {
    if (!fullPath.startsWith(RootFolder.AboveVTT.path)) {
        console.warn("find_builtin_token was called with the wrong token type.", fullPath, "should start with", RootFolder.AboveVTT.path);
        return undefined;
    }
    console.groupCollapsed("find_builtin_token");
    let found = builtInTokens.find(t => {
        let dirtyPath = `${RootFolder.AboveVTT.path}${t.folderPath}/${t.name}`;
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
        if (myToken.folderPath !== RootFolder.Root.path) {
            // we split the path and backfill empty every folder along the way if needed. This is really important for folders that hold subfolders, but not items
            let parts = myToken.folderPath.split("/");
            let backfillPath = "";
            parts.forEach(part => {
                let fullBackfillPath = sanitize_folder_path(`${backfillPath}/${part}`);
                if (fullBackfillPath !== RootFolder.Root.path && !mytokensfolders.find(fi => sanitize_folder_path(`${fi.folderPath}/${fi.name}`) === fullBackfillPath)) {
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
    try {


    backfill_mytoken_folders(); // just in case we're missing any folders

    // Players
    let tokenItems = window.pcs
        .filter(pc => pc.sheet !== undefined && pc.sheet !== "")
        .map(pc => SidebarListItem.PC(pc.sheet, pc.name, pc.image));

    // My Tokens Folders
    window.TOKEN_CUSTOMIZATIONS
        .filter(tc => tc.tokenType === ItemType.Folder && tc.fullPath().startsWith(RootFolder.MyTokens.path))
        .forEach(tc => {
            tokenItems.push(SidebarListItem.Folder(tc.id, tc.folderPath(), tc.name(), tc.tokenOptions.collapsed, tc.parentId))
        })

    // My Tokens
    window.TOKEN_CUSTOMIZATIONS
        .filter(tc => tc.tokenType === ItemType.MyToken)
        .forEach(tc => tokenItems.push(SidebarListItem.MyToken(tc)))

    // AboveVTT Tokens
    let allBuiltinPaths = builtInTokens
        .filter(item => item.folderPath !== RootFolder.Root.path && item.folderPath !== "" && item.folderPath !== undefined)
        .map(item => item.folderPath);
    let builtinPaths = [...new Set(allBuiltinPaths)];
    for (let i = 0; i < builtinPaths.length; i++) {
        let path = builtinPaths[i];
        let pathComponents = path.split("/");
        let folderName = pathComponents.pop();
        let folderPath = pathComponents.join("/");
        let builtinFolderPath = sanitize_folder_path(`${RootFolder.AboveVTT.path}/${folderPath}`);
        tokenItems.push(
            SidebarListItem.Folder(path_to_html_id(builtinFolderPath, folderName),
                builtinFolderPath,
                folderName,
                true,
            builtinFolderPath === RootFolder.AboveVTT.path ? RootFolder.AboveVTT.id : path_to_html_id(builtinFolderPath)
            )
        );
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

    window.tokenListItems = tokenItems.concat(aoe_items);
    rebuild_ddb_npcs();
    update_token_folders_remembered_state();
    console.groupEnd();
    } catch (error) {
        console.groupEnd();
        console.error("rebuild_token_items_list caught an unexpected error", error);
    }
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
            if (matches_full_path(currentFolder, RootFolder.Monsters.path)) {
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
        let monsterFolder = find_html_row_from_path(RootFolder.Monsters.path, tokensPanel.body);
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
    let monsterFolder = find_html_row_from_path(RootFolder.Monsters.path, tokensPanel.body);
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
        SidebarListItem.Folder(RootFolder.Players.id, RootFolder.Root.path, RootFolder.Players.name, false, path_to_html_id(RootFolder.Root.path)),
        SidebarListItem.Folder(RootFolder.Monsters.id, RootFolder.Root.path, RootFolder.Monsters.name, false, path_to_html_id(RootFolder.Root.path)),
        SidebarListItem.Folder(RootFolder.MyTokens.id, RootFolder.Root.path, RootFolder.MyTokens.name, false, path_to_html_id(RootFolder.Root.path)),
        SidebarListItem.Folder(RootFolder.AboveVTT.id, RootFolder.Root.path, RootFolder.AboveVTT.name, false, path_to_html_id(RootFolder.Root.path)),
        SidebarListItem.Folder(RootFolder.DDB.id, RootFolder.Root.path, RootFolder.DDB.name, false, path_to_html_id(RootFolder.Root.path)),
        SidebarListItem.Folder(RootFolder.Encounters.id, RootFolder.Root.path, RootFolder.Encounters.name, false, path_to_html_id(RootFolder.Root.path)),
        SidebarListItem.Folder(RootFolder.Aoe.id, RootFolder.Root.path, RootFolder.Aoe.name, false, path_to_html_id(RootFolder.Root.path))
    ];

    aoe_items = [
        SidebarListItem.Aoe("square", 1, "acid"),
        SidebarListItem.Aoe("circle", 1, "acid"),
        SidebarListItem.Aoe("cone", 1, "acid"),
        SidebarListItem.Aoe("line", 1, "acid")
    ]


    if(localStorage.getItem('MyTokens') != null){
        mytokens = $.parseJSON(localStorage.getItem('MyTokens'));
    }
    if(localStorage.getItem('MyTokensFolders') != null){
        mytokensfolders = $.parseJSON(localStorage.getItem('MyTokensFolders'));
    }
    if(localStorage.getItem('CustomTokens') != null){
        tokendata=$.parseJSON(localStorage.getItem('CustomTokens'));
    }
    $("#switch_tokens").click()


    migrate_tokendata(tokendata);
    migrate_token_customizations();
    rebuild_token_items_list();

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
    searchInput.off("keyup").on('keyup', function(event) {
        if (event.key === "Escape") {
            $(event.target).blur();
        }
    });
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


function redraw_token_list_item(item){
    const row = build_sidebar_list_row(item);
    let oldRow = $(`#${item.id}`);
    if (oldRow.length === 0) {
        oldRow = find_html_row_from_path(item.fullPath(), tokensPanel.body)
    }
    $(oldRow).replaceWith(row);
    enable_draggable_token_creation(row);
}

/**
 * clears and redraws the list of tokens in the sidebar
 * @param searchTerm {string} the search term used to filter the list of tokens
 * @param enableDraggable {boolean} whether or not to make items draggable. Defaults to true
 */
function redraw_token_list(searchTerm, enableDraggable = true) {
    if (!window.tokenListItems) {
        // don't do anything on startup
        return;
    }
    console.groupCollapsed("redraw_token_list");
    update_token_folders_remembered_state();
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
            $(`#${item.parentId} > .folder-item-list`).append(row);
            // find_html_row_from_path(item.folderPath, list).find(` > .folder-item-list`).append(row);
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
            $(`#${item.parentId} > .folder-item-list`).append(row);
            // find_html_row_from_path(item.folderPath, list).find(` > .folder-item-list`).append(row);
        });

    update_pc_token_rows();
    inject_encounter_monsters();
    console.groupEnd()
}

function get_helper_size(draggedItem){
    const tokenSize = token_size_for_item(draggedItem);
    const width = Math.round(window.CURRENT_SCENE_DATA.hpps) * tokenSize;
    const height = Math.round(window.CURRENT_SCENE_DATA.vpps) * tokenSize;
    const helperWidth = width / (1.0 / window.ZOOM);
    const helperHeight = height / (1.0 / window.ZOOM);
    return [helperWidth, helperHeight]
}
/**
 * Enables dragging the given html and dropping it on a scene to create a token.
 * The given html MUST be a decendent of an item marked with the class .list-item-identifier which is set by calling {set_full_path}
 * @param html {*|jQuery|HTMLElement} the html that corresponds to an item (like a row in the list of tokens)
 * @param specificImage {string} the url of the image to use. If nothing is provided, an image will be selected at random from the token's specified alternative-images.
 */
function enable_draggable_token_creation(html, specificImage = undefined) {
    html.draggable({
        appendTo: "body",
        zIndex: 100000,
        cursorAt: {top: 0, left: 0},
        cancel: '.token-row-gear, .change-token-image-item',
        helper: function(event) {
            console.log("enable_draggable_token_creation helper");
            let draggedRow = $(event.target).closest(".list-item-identifier");
            let isPlayerSheetAoe = false
            let playerAoe = undefined
            if (draggedRow.hasClass("above-aoe")){
                // this dragged item is a player sheet aoe button. look up teh shape in the sidepanel
                isPlayerSheetAoe = true
                // copy the dragged row before replacing it with the sidepanel row
                playerAoe = draggedRow.clone()
                draggedRow = find_html_row_from_path(draggedRow.attr("data-full-path"), tokensPanel.body)
            }
            let helper
            if ($(event.target).hasClass("list-item-identifier")) {
                draggedRow = $(event.target);
            }
            let draggedItem = find_sidebar_list_item(draggedRow);
            if (!draggedItem.isTypeAoe()) {
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
            }

            let [helperWidth, helperHeight] = get_helper_size(draggedItem)

            // update the token menu with the dragged out of the modal
            if (draggedRow.closest(".sidebar-modal").length > 0) {
                draggedItem.style = draggedRow.attr("data-style").replaceAll("aoe-style-", "");
                draggedItem.size = parseInt($("#aoe_feet_height").val()) / window.CURRENT_SCENE_DATA.fpsq;
                redraw_token_list_item(draggedItem);
            }

            helper = draggedRow.find("[data-img]").clone();
            [helperWidth, helperHeight] = get_helper_size(draggedItem)

            if (isPlayerSheetAoe) {
                let aoeItem = SidebarListItem.Aoe(
                    $(playerAoe).attr("data-shape"),
                    $(playerAoe).attr("data-size"),
                    $(playerAoe).attr("data-style")
                )
                $(helper).attr("data-style", aoeItem.style);
                $(helper).attr("data-size", aoeItem.size);
                $(helper).attr("class", `aoe-token-tileable aoe-style-${aoeItem.style} aoe-shape-${aoeItem.shape}`);
                [helperWidth, helperHeight] = get_helper_size(aoeItem);
                $(helper).attr("data-name-override", $(playerAoe).attr("data-name"));
            } else {
                const style = draggedRow.attr("data-style");
                const shape = draggedRow.attr("data-shape");
                $(helper).attr("data-style", style);
                $(helper).attr("data-shape", shape);
                $(helper).attr("data-size", draggedRow.attr("data-size"));
                $(helper).attr("class", build_aoe_class_name(style, shape, ""));
            }

             // perform specific resizing based on shape
             if (draggedItem.shape === "circle"){
                helperWidth = helperWidth * 2
                helperHeight = helperHeight * 2
            }
            else if (draggedItem.shape === "line"){
                helperWidth = Math.round(window.CURRENT_SCENE_DATA.hpps)  / (1.0 / window.ZOOM)
            }

            $(helper).css('width', `${helperWidth}px`);
            $(helper).css('height', `${helperHeight}px`);

            helper.addClass("draggable-token-creation");
            return helper;

        },
        start: function (event, ui) {
            console.log("enable_draggable_token_creation start");
            let draggedRow = $(event.target).closest(".list-item-identifier");
            if ($(event.target).hasClass("list-item-identifier")) {
                draggedRow = $(event.target);
            }
            let draggedItem = find_sidebar_list_item(draggedRow);
            if (!draggedItem.isTypeAoe()) {
                const tokenSize = token_size_for_item(draggedItem);
                const width = Math.round(window.CURRENT_SCENE_DATA.hpps) * tokenSize;
                const helperWidth = width / (1.0 / window.ZOOM);
                $(ui.helper).css('width', `${helperWidth}px`);
            }
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
            // $( event.originalEvent.target ).one('click', function(e){ e.stopImmediatePropagation(); } );
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
                if ($(event.target).hasClass("list-item-identifier")) {
                    draggedRow = $(event.target);
                }
                let draggedItem = find_sidebar_list_item(draggedRow);
                let hidden = event.shiftKey ? true : undefined; // we only want to force hidden if the shift key is help. otherwise let the global and override settings handle it
                let src = $(ui.helper).attr("src");
                if (ui.helper.attr("data-shape") && ui.helper.attr("data-style")) {
                    src = build_aoe_img_name(ui.helper.attr("data-style"), ui.helper.attr("data-shape"));
                }
                create_and_place_token(draggedItem, hidden, src, event.pageX - ui.helper.width() / 2, event.pageY - ui.helper.height() / 2, false);
                // create_and_place_token(draggedItem, hidden, src, event.pageX - ui.helper.width() / 2, event.pageY - ui.helper.height() / 2, false, ui.helper.attr("data-name-override"));
                close_sidebar_modal();
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
 * @param nameOverride {string} if present will override the list items name with this name. This is for dragging out player aoe tokens from sheets
 */
function create_and_place_token(listItem, hidden = undefined, specificImage= undefined, eventPageX = undefined, eventPageY = undefined, disableSnap = false, nameOverride = "") {

    if (listItem === undefined) {
        console.warn("create_and_place_token was called without a listItem");
        return;
    }

    if (listItem.isTypeFolder() || listItem.isTypeEncounter()) {

        let tokensToPlace = [];

        if (listItem.isTypeFolder()) {
            let fullPath = listItem.fullPath();
            // find and place all items in this folder... but not subfolders
            tokensToPlace = (listItem.fullPath().startsWith(RootFolder.Monsters.path) ? window.monsterListItems : window.tokenListItems)
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
    let options = {...window.TOKEN_SETTINGS, ...find_token_options_for_list_item(listItem)}; // we may need to put this in specific places within the switch statement below
    options.name = listItem.name;


    let tokenSizeSetting;
    let tokenSize;
    switch (listItem.type) {
        case ItemType.Folder:
            console.log("TODO: place all tokens in folder?", listItem);
            break;
        case ItemType.MyToken:
            tokenSizeSetting = options.tokenSize;
            tokenSize = parseInt(tokenSizeSetting);
            if (tokenSizeSetting === undefined || typeof tokenSizeSetting !== 'number') {
                tokenSize = 1;
                // TODO: handle custom sizes
            }
            if(tokenSize <= 0.5){
                options.tokenSize = 0.5;
            }
            else{
                options.tokenSize = tokenSize;
            }
            
            break;
        case ItemType.PC:
            let pc = window.pcs.find(pc => pc.sheet === listItem.sheet);
            let playerData = window.PLAYER_STATS[listItem.sheet];
            if (pc === undefined) {
                console.warn(`failed to find pc for id ${listItem.sheet}`);
                return;
            }
            options.id = listItem.sheet;
            tokenSizeSetting = options.tokenSize;
            tokenSize = parseInt(tokenSizeSetting);
            if (tokenSizeSetting === undefined || typeof tokenSizeSetting !== 'number') {
                tokenSize = 1;
                // TODO: handle custom sizes
            }
                        if(tokenSize <= 0.5){
                options.tokenSize = 0.5;
            }
            else{
                options.tokenSize = tokenSize;
            }
            options.hp = playerData ? playerData.hp : '';
            options.ac = playerData ? playerData.ac : '';
            options.max_hp = playerData ? playerData.max_hp : '';
            options.color = "#" + get_player_token_border_color(pc.sheet);
            break;
        case ItemType.Monster:
            let hpVal;
            switch (options['defaultmaxhptype']) {
                case 'max':
                    const hitDiceData = listItem.monsterData.hitPointDice;
                    hpVal = hitDiceData.diceCount * hitDiceData.diceValue + hitDiceData.fixedValue;
                    break;
                case 'roll':
                    hpVal = new rpgDiceRoller.DiceRoll(listItem.monsterData.hitPointDice.diceString).total;
                    break;
                case 'average':
                default:
                    hpVal = listItem.monsterData.averageHitPoints;
                    break;
            }
            options.hp = hpVal;
            options.max_hp = hpVal;
            tokenSizeSetting = options.tokenSize;
            tokenSize = parseInt(tokenSizeSetting);
            if (tokenSizeSetting === undefined || typeof tokenSizeSetting !== 'number') {
                options.sizeId = listItem.monsterData.sizeId;
                // TODO: handle custom sizes
            }
            options.ac = listItem.monsterData.armorClass;
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
        case ItemType.BuiltinToken:
            options.disablestat = true;
            break;
        case ItemType.Aoe:
            // we don't want to allow other options for aoe so this is a full replacement of options
            options = build_aoe_token_options(listItem.style, listItem.shape, listItem.size, nameOverride);
            // specificImage = options.imgsrc; // force it to use what we just built
            break;
    }

    options.itemType = listItem.type;
    options.itemId = listItem.id;
    options.listItemPath = listItem.fullPath();
    if (hidden === true || hidden === false) {
        options.hidden = hidden;
    }
    options.imgsrc = random_image_for_item(listItem, specificImage);
    // TODO: figure out if we still need to do this, and where they are coming from
    delete options.undefined;
    delete options[""];
    console.log("create_and_place_token about to place token with options", options, hidden);

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
    let options;
    let tokenSizeSetting;
    let tokenSize;
    switch (listItem.type) {
        case ItemType.Folder:
            return 1;
        case ItemType.MyToken:
            options = find_token_options_for_list_item(listItem);
            tokenSizeSetting = parseFloat(options.tokenSize);
            if (isNaN(tokenSizeSetting)) {
                return 1;
            }
            tokenSize = Math.round(tokenSizeSetting * 2) / 2; // round to the nearest 0.5; ex: everything between 0.25 and 0.74 round to 0.5; below .025 rounds to 0, and everything above 0.74 rounds to 1
            if (tokenSize < 0.5) {
                return 0.5;
            }
            return tokenSize;
        case ItemType.PC:
            options = find_token_options_for_list_item(listItem);
            tokenSizeSetting = parseFloat(options.tokenSize);
            if (isNaN(tokenSizeSetting)) {
                return 1;
            }
            tokenSize = Math.round(tokenSizeSetting * 2) / 2; // round to the nearest 0.5; ex: everything between 0.25 and 0.74 round to 0.5; below .025 rounds to 0, and everything above 0.74 rounds to 1
            if (tokenSize < 0.5) {
                return 0.5;
            }
            return tokenSize;
        case ItemType.DDBToken:
            return 1;
        case ItemType.Monster:
         options = find_token_options_for_list_item(listItem);
            tokenSizeSetting = parseFloat(options.tokenSize);
            if (isNaN(tokenSizeSetting)) {
                switch (listItem.monsterData.sizeId) {
                    case 5: return 2;
                    case 6: return 3;
                    case 7: return 4;
                    default: return 1;
                }
            }
            tokenSize = Math.round(tokenSizeSetting * 2) / 2; // round to the nearest 0.5; ex: everything between 0.25 and 0.74 round to 0.5; below .025 rounds to 0, and everything above 0.74 rounds to 1
            if (tokenSize < 0.5) {
                return 0.5;
            }
            return tokenSize;
            
        case ItemType.BuiltinToken:
            return 1;
        case ItemType.Aoe:
            return listItem.size;
    }
}

/**
 * finds and returns alternative images for the given listItem.
 * @param listItem {SidebarListItem} the item you need a random image for
 * @returns {string[]} a list of url strings
 */
function alternative_images_for_item(listItem) {
    if (!listItem) return [];
    let alternativeImages;
    switch (listItem.type) {
        case ItemType.MyToken:
        case ItemType.PC:
        case ItemType.Monster:
            let customization = find_token_customization(listItem.type, listItem.id);
            if (customization) {
                alternativeImages = customization.alternativeImages();
            }
            break;
        case ItemType.BuiltinToken:
        case ItemType.DDBToken:
            alternativeImages = listItem.tokenOptions.alternativeImages;
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
 * Creates a "My Tokens" folder within another "My Tokens" folder
 * @param listItem {SidebarListItem} The folder to create a new folder within
 */
function create_mytoken_folder_inside(listItem) {
    if (!listItem.isTypeFolder() || !listItem.fullPath().startsWith(RootFolder.MyTokens.path)) {
        console.warn("create_mytoken_folder_inside called with an incorrect item type", listItem);
        return;
    }

    let newFolderName = "New Folder";
    let newFolderCount = window.TOKEN_CUSTOMIZATIONS
        .filter(tc => tc.tokenType === ItemType.Folder && tc.name().startsWith(newFolderName))
        .length;
    if (newFolderCount > 0) {
        newFolderName += ` ${newFolderCount + 1}`;
    }
    let newFolder = TokenCustomization.Folder(uuid(), listItem.id, RootFolder.MyTokens.id, { name: newFolderName });
    persist_token_customization(newFolder, function(didSucceed, errorType) {
        if (didSucceed) {
            did_change_mytokens_items();
            let newListItem = window.tokenListItems.find(li => li.type === ItemType.Folder && li.id === newFolder.id);
            display_folder_configure_modal(newListItem);
            expand_all_folders_up_to_item(newListItem);
        } else {
            console.error("create_mytoken_folder_inside failed to create a new folder", errorType);
            showDebuggingAlert();
        }
    });
}

function delete_mytokens_folder_and_everything_in_it(listItem) {
    console.log("delete_mytokens_folder_and_everything_in_it about to delete all tokens with parentId", listItem.id);
    delete_token_customization_by_parent_id(listItem.id, function (deletedChildren, deletedChildrenErrorType) {
        if (deletedChildren) {
            console.log("delete_mytokens_folder_and_everything_in_it successfully deleted all children. about to delete the folder with id", listItem.id);
            delete_token_customization_by_type_and_id(listItem.type, listItem.id, function (deletedFolder, deletedFolderErrorType) {
                did_change_mytokens_items();
                expand_all_folders_up_to_item(listItem);
                if (deletedFolder) {
                    console.log("delete_mytokens_folder_and_everything_in_it successfully deleted the folder with id", listItem.id);
                } else {
                    console.error("delete_mytokens_folder_and_everything_in_it failed delete the folder with id", listItem.id, deletedFolderErrorType);
                    showDebuggingAlert();
                }
            });
        } else {
            did_change_mytokens_items();
            expand_all_folders_up_to_item(listItem);
            console.error("delete_mytokens_within_folder failed to delete token customizations", deletedChildrenErrorType);
            showDebuggingAlert();
        }
    });
}

function move_mytokens_to_parent_folder_and_delete_folder(listItem, callback) {
    // this is different from move_mytokens_folder in that it moved everything out of listItem

    console.log("move_mytokens_to_parent_folder_and_delete_folder about to move all items out of", listItem.id);
    window.TOKEN_CUSTOMIZATIONS.forEach(tc => {
        if (tc.parentId === listItem.id) {
            tc.parentId = listItem.parentId;
        }
    });
    let index = window.TOKEN_CUSTOMIZATIONS.findIndex(tc => tc.tokenType === listItem.type && tc.id === listItem.id);
    if (index >= 0) {
        console.log(window.TOKEN_CUSTOMIZATIONS.length);
        window.TOKEN_CUSTOMIZATIONS.splice(index, 1);
        console.log(window.TOKEN_CUSTOMIZATIONS.length);
    } else {
        console.log("move_mytokens_to_parent_folder_and_delete_folder could not find customization with id", listItem.id);
    }
    persist_all_token_customizations(window.TOKEN_CUSTOMIZATIONS, function (didSucceed, errorType) {
        if (didSucceed) {
            console.log("move_mytokens_to_parent_folder_and_delete_folder successfully moved all children up one level and deleted folder with id", listItem.id);
        } else {
            console.error("move_mytokens_to_parent_folder_and_delete_folder failed to move all items out of", listItem.id, errorType);
            showDebuggingAlert();
        }
        callback(didSucceed, errorType);
    });
}

/**
 * Creates a new "My Token" object within a folder
 * @param listItem {SidebarListItem} the folder item to create a token in
 */
function create_token_inside(listItem) {
    if (!listItem.isTypeFolder() || !listItem.fullPath().startsWith(RootFolder.MyTokens.path)) {
        console.warn("create_token_inside called with an incorrect item type", listItem);
        return;
    }

    let newTokenName = "New Token";
    const newTokenCount = window.TOKEN_CUSTOMIZATIONS
        .filter(tc => tc.parentId === listItem.id && tc.name().startsWith(newTokenName))
        .length;


    // let folderPath = listItem.fullPath().replace(RootFolder.MyTokens.path, "");
    // let newTokenCount = mytokens.filter(t => t.folderPath === folderPath && t.name.startsWith(newTokenName)).length;
    console.log("newTokenCount", newTokenCount);
    if (newTokenCount > 0) {
        newTokenName += ` ${newTokenCount + 1}`;
    }

    let customization = TokenCustomization.MyToken(
        uuid(),
        listItem.id,
        { name: newTokenName }
    );
    persist_token_customization(customization, function (didSucceed, error) {
        console.log("create_token_inside created a new item", customization);
        did_change_mytokens_items();
        const newItem = window.tokenListItems.find(li => li.type === ItemType.MyToken && li.id === customization.id);
        if (didSucceed && newItem) {
            display_token_configuration_modal(newItem);
        } else {
            console.error("Failed to create My Token", customization, error);
            showDebuggingAlert();
        }
    });
}

/**
 * presents a SidebarPanel modal for configuring the given item
 * @param listItem {SidebarListItem} the item to configure
 * @param placedToken {undefined|Token} the token object that is on the scene
 */
 function display_aoe_token_configuration_modal(listItem, placedToken = undefined) {
    switch (listItem?.type) {
        case ItemType.Aoe:
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
    let tokenSize = token_size_for_item(listItem) * window.CURRENT_SCENE_DATA.fpsq;
    sidebarPanel.updateHeader(name, "Select size and drag out style");


    sidebarPanel.inputWrapper.append("");
    sidebarPanel.inputWrapper.append(`
        <div class="token-image-modal-url-label-wrapper">
            <div class='token-image-modal-footer-title image-size-title'>Token Size</div>
            <input min='5' id='aoe_feet_height' value='${tokenSize}' maxlength='4' type='number' step='${window.CURRENT_SCENE_DATA.fpsq}' />
        </div>
    `);
    $("#aoe_feet_height").on("input", mydebounce(() => {
        const value = $("#aoe_feet_height").val();
        listItem.size = Math.round(parseInt(value) / window.CURRENT_SCENE_DATA.fpsq);
        redraw_token_list_item(listItem);
    }, 200));
    $("#aoe_feet_height").keydown(function(e) {
        if (e.key === "Enter") {
            close_sidebar_modal();
        } else if (e.key === "Escape") {
            $(e.target).blur();
        }
    });
    redraw_token_images_in_modal(sidebarPanel, listItem, placedToken);
}

/**
 * presents a SidebarPanel modal for configuring the given item
 * @param listItem {SidebarListItem} the item to configure
 * @param placedToken {undefined|Token} the token object that is on the scene
 */
function display_token_configuration_modal(listItem, placedToken = undefined) {
    switch (listItem?.type) {
        case ItemType.MyToken:
        case ItemType.Monster:
        case ItemType.PC:
            break;
        default:
            console.warn("display_token_configuration_modal was called with incorrect item type", listItem);
            return;
    }

    let customization;
    try {
        customization = find_or_create_token_customization(listItem.type, listItem.id, RootFolder.Monsters.id, RootFolder.Monsters.id);
    } catch (error) {
        console.error("display_token_configuration_modal failed to create a customization object for listItem:", listItem, error);
        showDebuggingAlert("Failed to create a token customization object.");
        return;
    }

    // close any that are already open just to be safe
    close_sidebar_modal();
    let sidebarPanel = new SidebarPanel("token-configuration-modal");
    display_sidebar_modal(sidebarPanel);

    let name = listItem.name;

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
        const redraw = customization.alternativeImages().length === 0;  // if it's the first custom image we need to redraw the entire body; else we can just append new ones
        const didAdd = customization.addAlternativeImage(newImageUrl);
        if (!didAdd) {
            return; // no need to do anything if the image wasn't added. This can happen if they accidentally hit enter a few times which would try to add the same url multiple times
        }
        persist_token_customization(customization);
        if (redraw) {
            redraw_token_images_in_modal(sidebarPanel, listItem, placedToken);
        } else {
            sidebarPanel.body.append(build_token_div_for_sidebar_modal(newImageUrl, listItem, placedToken));
        }
        removeAllButton.show();
        inputWrapper.find(".token-image-modal-url-label-add-wrapper > .token-image-modal-url-label-wrapper > .token-image-modal-footer-title").text(determineLabelText());
    };

    // MyToken name input handler
    const rename = function(newName) {
        if (newName !== undefined && newName.length > 0) {
            console.log("update token name to", newName);
            customization.setTokenOption("name", newName);
            persist_token_customization(customization);
            sidebarPanel.updateHeader(newName, "", "When placing tokens, one of these images will be chosen at random. Right-click an image for more options.");
            redraw_token_images_in_modal(sidebarPanel, listItem, placedToken);
            did_change_mytokens_items();
            expand_all_folders_up_to_id(customization.id);
        }
    };


    let imageUrlInput = sidebarPanel.build_image_url_input(determineLabelText(), addImageUrl);
    inputWrapper.append(imageUrlInput);

    if (listItem.isTypeMyToken()) {

        // MyToken name
        inputWrapper.append($(`<div class="token-image-modal-footer-title" style="width:100%;padding-left:0px">Token Name</div>`));
        let nameInput = $(`<input data-previous-name="${name}" title="token name" placeholder="my token name" name="addCustomName" type="text" style="width:100%" value="${name === undefined ? '' : name}" />`);
        nameInput.on('keyup', function (event) {
            if (event.key === "Enter" && event.target.value !== undefined && event.target.value.length > 0) {
                rename(event.target.value);
            } else if (event.key === "Escape") {
                $(event.target).blur();
            }
        });
        nameInput.on('focusout', function (event) {
            rename(event.target.value);
        });
        inputWrapper.append(nameInput);
    }

    if (typeof customization !== "object") {
        console.error("Ummm... we somehow don't have a TokenCustomization object?", customization, listItem);
        return;
    }

    // token size
    let tokenSizes = [];
    if (placedToken) {
        tokenSizes.push(placedToken.numberOfGridSpacesWide());
        tokenSizes.push(placedToken.numberOfGridSpacesTall());
    } else {
        tokenSizes.push(token_size_for_item(listItem))
    }
    let tokenSizeInput = build_token_size_input(tokenSizes, function (newSize) {
        customization.setTokenOption("tokenSize", newSize);
        persist_token_customization(customization);
        decorate_modal_images(sidebarPanel, listItem, placedToken);
    });
    inputWrapper.append(tokenSizeInput);

    // image scale
    let startingScale = customization.tokenOptions.imageSize || 1;
    let imageScaleWrapper = build_token_image_scale_input(startingScale, false, function (imageSize) {
        customization.setTokenOption("imageSize", imageSize);
        persist_token_customization(customization);
        decorate_modal_images(sidebarPanel, listItem, placedToken);
    });
    inputWrapper.append(imageScaleWrapper);

    // border color
    const color = customization.tokenOptions.color || random_token_color();
    const borderColorWrapper = build_token_border_color_input(color, function (newColor, eventType) {
        customization.setTokenOption("color", newColor);
        persist_token_customization(customization);
        decorate_modal_images(sidebarPanel, listItem, placedToken);
    });
    borderColorWrapper.removeClass("border-color-wrapper"); // sets display:block!important; but we want to be able to hide this one
    const specificBorderColorSetting = {
        name: 'specificBorderColor',
        label: 'Border Color',
        type: 'toggle',
        options: [
            { value: true, label: "Specific Color", description: "The token will use the specified color." },
            { value: false, label: "Round", description: "The token will use a random border color." }
        ],
        defaultValue: false
    };
    const specificBorderColorValue = (typeof customization.tokenOptions.color === "string" && customization.tokenOptions.color.length > 0);
    const borderColorToggle = build_toggle_input(specificBorderColorSetting, specificBorderColorValue, function (useSpecificColorKey, useSpecificColorValue) {
        if (useSpecificColorValue === true) {
            customization.setTokenOption("color", color);
            persist_token_customization(customization);
            borderColorWrapper.show();
        } else {
            customization.setTokenOption("color", undefined);
            persist_token_customization(customization);
            borderColorWrapper.hide();
        }
    });
    inputWrapper.append(borderColorToggle);
    inputWrapper.append(borderColorWrapper);
    if (!specificBorderColorValue) {
        borderColorWrapper.hide();
    }

    // token options override
    let tokenOptionsButton = build_override_token_options_button(sidebarPanel, listItem, placedToken, customization.tokenOptions, function(name, value) {
        customization.setTokenOption(name, value);
    }, function () {
        persist_token_customization(customization);
        redraw_settings_panel_token_examples(customization.tokenOptions);
        decorate_modal_images(sidebarPanel, listItem, placedToken);
    });
    inputWrapper.append(tokenOptionsButton);
    inputWrapper.append(`<br />`);
}

/// colorChangeCallback(borderColor, eventType)
function build_token_border_color_input(initialColor, colorChangeCallback) {
    if (typeof colorChangeCallback !== "function") {
        console.warn("build_token_border_color_input was called without a callback function");
        return;
    }
    // border color
    let borderColorInput = $(`<input class="border-color-input" type="color" value="${initialColor}"/>`);
    let borderColorWrapper = $(`
        <div class="token-image-modal-url-label-wrapper border-color-wrapper">
            <div class="token-image-modal-footer-title border-color-title">Border Color</div>
        </div>
    `);
    borderColorWrapper.append(borderColorInput);
    let colorPicker = $(borderColorInput);
    colorPicker.spectrum({
        type: "color",
        showInput: true,
        showInitial: true,
        containerClassName: 'prevent-sidebar-modal-close',
        clickoutFiresChange: true,
        color: initialColor,
        appendTo: "parent"
    });
    const borderColorPickerChange = function(event, tinycolor) {
        let borderColor = `rgba(${tinycolor._r}, ${tinycolor._g}, ${tinycolor._b}, ${tinycolor._a})`;
        colorChangeCallback(borderColor, event.type);
    };
    colorPicker.on('dragstop.spectrum', borderColorPickerChange);   // update the token as the player messes around with colors
    colorPicker.on('change.spectrum', borderColorPickerChange); // commit the changes when the user clicks the submit button
    colorPicker.on('hide.spectrum', borderColorPickerChange);   // the hide event includes the original color so let's change it back when we get it

    return borderColorWrapper;
}

function build_override_token_options_button(sidebarPanel, listItem, placedToken, options, updateValue, didChange) {
    let tokenOptionsButton = $(`<button class="sidebar-panel-footer-button" style="margin: 10px 0px 10px 0px;">Override Token Options</button>`);
    tokenOptionsButton.on("click", function (clickEvent) {
        build_and_display_sidebar_flyout(clickEvent.clientY, function (flyout) {
            const overrideOptions = token_setting_options().map(option => convert_option_to_override_dropdown(option));
            let optionsContainer = build_sidebar_token_options_flyout(overrideOptions, options, function(name, value) {
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
 * displays a SidebarPanel modal with the details of the given Builtin token. This is not editable, but shows multiple images, that can be drag and dropped onto the scene
 * @param listItem {SidebarListItem} the builtin item to display a modal for
 * @param placedToken {Token|undefined} undefined if this modal does not represnet a token that is placed on the scene; else the Token object that corresponds to a token that is placed on the scene
 */
function display_builtin_token_details_modal(listItem, placedToken) {
    if (listItem?.isTypeBuiltinToken() || listItem?.isTypeDDBToken()) {
        // close any that are already open just to be safe
        close_sidebar_modal();

        let sidebarPanel = new SidebarPanel("builtin-token-details-modal");
        display_sidebar_modal(sidebarPanel);
        sidebarPanel.updateHeader(listItem.name, "", "When placing tokens, one of these images will be chosen at random. Right-click an image for more options.");

        redraw_token_images_in_modal(sidebarPanel, listItem, placedToken);
    } else {
        console.warn("display_builtin_token_details_modal was called with incorrect item type", listItem);
    }
}

function build_token_div_for_sidebar_modal(imageUrl, listItem, placedToken) {
    let parsedImage = parse_img(imageUrl);
    let options = find_token_options_for_list_item(listItem);
    if (placedToken) {
        options = {...placedToken.options};
    }
    let tokenDiv = build_alternative_image_for_modal(parsedImage, options, placedToken, listItem);
    if (placedToken?.isMonster()) {
        tokenDiv.attr("data-monster", placedToken.options.monster);
    }
    set_full_path(tokenDiv, listItem?.fullPath());
    enable_draggable_token_creation(tokenDiv, parsedImage);
    return tokenDiv;
}

/**
 * Clears the body of the given sidebarPanel and adds a new element for every alternative image the listItem has
 * @param sidebarPanel {SidebarPanel} the modal to display objects in
 * @param listItem {SidebarListItem} the list item the modal represents
 * @param placedToken {Token|undefined} undefined if this modal does not represnet a token that is placed on the scene; else the Token object that corresponds to a token that is placed on the scene
 * @param drawInline {boolean} If you need to add elements to the body AFTER all the images have been drawn, then pass true. Otherwise, images will be drawn in their own setTimeout to avoid blocking the UI. If you're adding things to the sidebarPanle.body, you might consider adding them to the footer or between the body and the footer instead.
 */
function redraw_token_images_in_modal(sidebarPanel, listItem, placedToken, drawInline = false) {
    if (sidebarPanel === undefined) {
        console.warn("redraw_token_images_in_modal was called without a sidebarPanel");
        return;
    }
    if (listItem === undefined && placedToken === undefined) {
        console.warn("redraw_token_images_in_modal was called without proper items");
        return;
    }

    let modalBody = sidebarPanel.body
    modalBody.empty();

    // clone our images array instead of using a reference so we don't accidentally change the current images for all tokens
    // we also need to parse and compare every image to know if we need to add the placedToken image
    let alternativeImages = [];
    if (placedToken?.options?.alternativeImages) {
        alternativeImages = alternativeImages.concat(placedToken.options.alternativeImages);
    }
    alternativeImages = alternativeImages.concat(alternative_images_for_item(listItem).map(image => parse_img(image)));

    let placedImg = parse_img(placedToken?.options?.imgsrc);
    if (placedImg.length > 0 && !alternativeImages.includes(placedImg)) {
        // the placedToken image has been changed by the user so put it at the front
        let tokenDiv = build_token_div_for_sidebar_modal(placedImg, listItem, placedToken);
        tokenDiv.attr("data-token-id", placedToken.options.id);
        modalBody.append(tokenDiv);
    }

    if (alternativeImages.length === 0 && placedImg !== parse_img(listItem?.image)) {
        // if we don't have any alternative images, show the default image
        let tokenDiv = build_token_div_for_sidebar_modal(listItem?.image, listItem, placedToken);
        modalBody.append(tokenDiv);
    }
    if (listItem?.type === ItemType.Aoe) {
        const withoutDefault = get_available_styles().filter(aoeStyle => aoeStyle !== "Default")
        alternativeImages = withoutDefault.map(aoeStyle => {
          return `class=aoe-token-tileable aoe-style-${aoeStyle.toLowerCase()} aoe-shape-${listItem.shape}`
        })
    }


    for (let i = 0; i < alternativeImages.length; i++) {
        if (drawInline) {
            let tokenDiv = build_token_div_for_sidebar_modal(alternativeImages[i], listItem, placedToken);
            modalBody.append(tokenDiv);
        } else {
            setTimeout(function () {
                // JS doesn't have threads, but setTimeout allows us to execute this inefficient block of code after the rest of the modal has finished drawing.
                // This gives the appearance of a faster UI because the modal will display and then these images will pop in.
                // most of the time, this isn't needed, but if there are a lot of images (like /DDBTokens/Human), this make a pretty decent impact.
                let tokenDiv = build_token_div_for_sidebar_modal(alternativeImages[i], listItem, placedToken);
                modalBody.append(tokenDiv);
            });
        }
    }

    if (alternativeImages.length === 0) {
        sidebarPanel.footer.find(".token-image-modal-url-label-add-wrapper > .token-image-modal-url-label-wrapper > .token-image-modal-footer-title").text("Replace The Default Image");
    } else {
        sidebarPanel.footer.find(".token-image-modal-url-label-add-wrapper > .token-image-modal-url-label-wrapper > .token-image-modal-footer-title").text("Add More Custom Images");
    }

}

/**
 * builds an HTML element for the given image
 * @param image {string} the url to display in the image
 * @param options {object} the Token.options or the TokenCustomization.tokenOptions to use when drawing the element
 * @param placedToken {Token} the Token object that as been placed on the scene; else undefined
 * @param isAoe {SidebarListItem|undefined} Whether or not this is for an AoE token
 * @returns {*|jQuery|HTMLElement} the HTML that you can add to a sidebarPanel modal
 */
function build_alternative_image_for_modal(image, options, placedToken, listItem) {
    let mergedOptions = {};
    if (options !== undefined) {
        mergedOptions = {...mergedOptions, ...options};
    }
    if (placedToken !== undefined) {
        mergedOptions = {...mergedOptions, ...placedToken.options};
    }
    if (listItem?.isTypeAoe()) {
        mergedOptions = {...mergedOptions, ...build_aoe_token_options(listItem.style, listItem.shape, listItem.size, listItem.name)};
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
    if (listItem?.isTypeAoe()) {
        tokenDiv.attr("data-img", true);
        tokenDiv.attr("data-style", image.match(/aoe-style-\w+/gm)[0].replace(" aoe-style-",""));
        tokenDiv.attr("data-size", listItem.size);
        tokenDiv.attr("data-shape", listItem.shape);
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
        let tokenDiv = build_alternative_image_for_modal(imgsrc, options, placedToken, listItem);
        item.replaceWith(tokenDiv);
        set_full_path(tokenDiv, listItem.fullPath());
        enable_draggable_token_creation(tokenDiv, imgsrc);
    }
}

/** writes mytokens and mytokensfolders to localStorage */
function persist_my_tokens() {
    console.warn("persist_my_tokens no longer supported");
    // localStorage.setItem("MyTokens", JSON.stringify(mytokens));
    // localStorage.setItem("MyTokensFolders", JSON.stringify(mytokensfolders));
    // persist_folders_remembered_state();
}

function persist_folders_remembered_state() {
    if (window.tokenListItems === undefined) return;
    let rememberedFolderState = {};
    window.tokenListItems
        .filter(item => item.isTypeFolder())
        .concat(tokens_rootfolders)
        .concat(window.sceneListFolders)
        .forEach(f => {
            rememberedFolderState[f.id] = f.collapsed;
        });
    localStorage.setItem("FolderRememberedState", JSON.stringify(rememberedFolderState));
}

function update_token_folders_remembered_state() {
    if (!window.tokenListItems || !window.sceneListFolders) {
        return; // still starting up
    }

    let items = window.tokenListItems
        .filter(item => item.isTypeFolder())
        .concat(tokens_rootfolders)
        .concat(window.sceneListFolders);

    if(localStorage.getItem('FolderRememberedState') != null) {
        let rememberedStates = JSON.parse(localStorage.getItem('FolderRememberedState'));
        items.forEach(item => {
            let state = rememberedStates[item.id];
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
    rebuild_token_items_list();
    redraw_token_list();
}

/**
 * creates an iframe that loads a monster stat block for the given item
 * @param listItem {SidebarListItem} the list item representing the monster that you want to display a stat block for
 */
function open_monster_item(listItem) {
    if (should_use_iframes_for_monsters()) {
        // in case we need a way to fallback quickly
        open_monster_item_iframe(listItem);
        return;
    }
    if (!listItem.isTypeMonster()) {
        console.warn("open_monster_item was called with the wrong item type", listItem);
        return;
    }
    let sidebarModal = new SidebarPanel("monster-stat-block", true);
    display_sidebar_modal(sidebarModal);
    try {
        build_and_display_stat_block_with_data(listItem.monsterData, sidebarModal.body, undefined);
    } catch (error) {
        console.error("open_monster_item failed to build a stat block locally. Attempting to open an iFrame instead", error);
        close_sidebar_modal();
        open_monster_item_iframe(listItem);
    }
}

function open_monster_item_iframe(listItem) {

    if (!listItem.isTypeMonster()) {
        console.warn("open_monster_item_iframe was called with the wrong item type", listItem);
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
    if (window.ddbConfigJson?.challengeRatings) {
        const definition = window.ddbConfigJson.challengeRatings.find(cr => cr.id === crId);
        if (typeof definition?.value === "number") {
            switch (definition.value) {
                case 0.125: return "1/8";
                case 0.25: return "1/4";
                case 0.5: return "1/2";
                default: return `${definition.value}`;
            }
        }
    }
    // we couldn't find the official definition, but this basically how it all maps out
    switch (crId) {
        case 0: return "0"; // ???
        case 1: return "0";
        case 2: return "1/8";
        case 3: return "1/4";
        case 4: return "1/2";
        default:
            if (crId > 28) {
                return `${crId - 5}`;
            }
            return `${crId - 4}`;
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
        $(event.target).contents().find("head").append(
            `<style>
                .input-select .input-select__dropdown-wrapper {
                    transition: max-height 0.5s ease 0.1s;
                }
            </style>`
        );
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
        build: function(element, e) {
            let items = {};
            if (!element.hasClass("change-token-image-item")) {
                items.place = {
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
                };
                items.placeHidden = {
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
                };
            }
            items.copy = {
                name: "Copy Url",
                callback: function (itemKey, opt, e) {
                    let selectedItem = $(opt.$trigger[0]);
                    let imgSrc = selectedItem.find("img").attr("src");
                    copy_to_clipboard(imgSrc);
                }
            };
            if (!element.hasClass("change-token-image-item")) {
                items.border = "---";
                items.remove = {
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

                        if (listItem?.isTypeMyToken() || listItem?.isTypeMonster() || listItem?.isTypePC()) {
                            let customization = find_token_customization(listItem.type, listItem.id);
                            if (!customization) {
                                console.error("register_custom_token_image_context_menu Remove failed to find a token customization object matching listItem: ", listItem);
                                showDebuggingAlert();
                                return;
                            }
                            customization.removeAlternativeImage(imgSrc);
                            persist_token_customization(customization);
                            redraw_token_images_in_modal(window.current_sidebar_modal, listItem, placedToken);
                        } else {
                            console.error("register_custom_token_image_context_menu Remove attempted to remove a custom image with an invalid type. listItem:", listItem);
                            showDebuggingAlert();
                            return;
                        }
                        selectedItem.remove();
                    }
                };
            }
            return { items: items };
        }
    });
}

function build_remove_all_images_button(sidebarPanel, listItem, placedToken) {
    // add a "remove all" button between the body and the footer
    let removeAllButton = $(`<button class="token-image-modal-remove-all-button" title="Reset this token back to the default image.">Remove All Custom Images</button>`);
    removeAllButton.on("click", function(event) {
        let tokenName = listItem !== undefined ? listItem.name : placedToken.options.name
        let customization;
        if (listItem !== undefined) {
            customization = find_token_customization(listItem.type, listItem.id);
        }
        if (customization === undefined && placedToken !== undefined) {
            if (placedToken.isMonster()) {
                customization = find_token_customization(ItemType.Monster, placedToken.options.id);
            } else if (placedToken.isPlayer()) {
                customization = find_token_customization(ItemType.PC, placedToken.options.id);
            } else {
                customization = find_token_customization(ItemType.MyToken, placedToken.options.id);
            }
        }
        if (!customization) {
            console.error("build_remove_all_images_button failed to find token customization for listItem:", listItem, ", placedToken:", placedToken);
            showDebuggingAlert();
            return;
        }
        if (window.confirm(`Are you sure you want to remove all custom images for ${tokenName}?\nThis will reset the token images back to the default`)) {
            customization.removeAllAlternativeImages();
            persist_token_customization(customization);
            redraw_token_images_in_modal(sidebarPanel, listItem, placedToken);
            $(event.currentTarget).hide();
        }
    });
    return removeAllButton;
}

function find_token_options_for_list_item(listItem) {
    if (!listItem) return {};
    if (listItem.isTypeBuiltinToken() || listItem.isTypeDDBToken()) {
        return listItem.tokenOptions;
    } else {
        return find_token_customization(listItem.type, listItem.id)?.allCombinedOptions() || {};
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

    /// update the modal header
    sidebarPanel.updateHeader(placedToken.options.name, "Token Images", "Click an image below to update your token or enter a new image URL at the bottom.");

    /// draw tokens in the body
    let listItem = list_item_from_token(placedToken);
    let alternativeImages = [placedToken.options.imgsrc];
    if (placedToken.options.alternativeImages) {
        alternativeImages = alternativeImages.concat(placedToken.options.alternativeImages);
    }
    if (listItem?.alternativeImages) {
        alternativeImages = alternativeImages.concat(listItem.alternativeImages);
    }
    alternativeImages = [...new Set(alternativeImages)]; // clear out any duplicates
    console.log("display_change_image_modal", alternativeImages);
    alternativeImages.forEach(imgUrl => {
        const image = parse_img(imgUrl);
        const html = $(`<img class="example-token" src="${image}" alt="alternative image" />`);
        // the user is changing their token image, allow them to simply click an image
        // we don't want to allow drag and drop from this modal
        html.on("click", function (imgClickEvent) {
            placedToken.options.imgsrc = parse_img(image);
            close_sidebar_modal();
            placedToken.place_sync_persist();
        });
        sidebarPanel.body.append(html);
    });

    // this will be called when the user enters a new url
    const add_token_customization_image = function(imageUrl) {
        if(imageUrl.startsWith("data:")){
            alert("You cannot use urls starting with data:");
            return;
        }
        placedToken.options.imgsrc = parse_img(imageUrl);
        close_sidebar_modal();
        placedToken.place_sync_persist();
    };

    let imageUrlInput = sidebarPanel.build_image_url_input("Use a different image", add_token_customization_image);
    sidebarPanel.inputWrapper.append(imageUrlInput);

    let inputWrapper = sidebarPanel.inputWrapper;
    sidebarPanel.footer.find(`.token-image-modal-add-button`).remove();
    // allow them to use the new url for the placed token without saving the url for all future tokens
    let onlyForThisTokenButton = $(`<button class="sidebar-panel-footer-button" title="This url will be used for this token only. New tokens will continue to use the images shown above.">Set for this token only</button>`);
    onlyForThisTokenButton.on("click", function(event) {
        let imageUrl = $(`input[name='addCustomImage']`)[0].value;
        if (imageUrl !== undefined && imageUrl.length > 0) {
            add_token_customization_image(imageUrl);
        }
    });
    inputWrapper.append(onlyForThisTokenButton);

    inputWrapper.append($(`<div class="sidebar-panel-header-explanation" style="padding:4px;">You can change the image for all tokens of this type by clicking the gear button on the token row in the Tokens tab.</div>`));
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
    fetch_monsters(monsterIds, function (response) {
        if (response !== false) {
            update_monster_item_cache(response.map(m => SidebarListItem.Monster(m)));
        }
    });
});

const fetch_and_cache_monsters = mydebounce( (monsterIds, callback) => {
    const cachedIds = Object.keys(cached_monster_items);
    const monstersToFetch = monsterIds.filter(id => !cachedIds.includes(id));
    fetch_monsters(monstersToFetch, function (response) {
        if (response !== false) {
            update_monster_item_cache(response.map(m => SidebarListItem.Monster(m)));
        }
        if (callback) {
            callback();
        }
    });
});

function update_monster_item_cache(newItems) {
    newItems.forEach(item => cached_monster_items[item.monsterData.id] = item);
}
