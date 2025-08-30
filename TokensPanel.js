
mytokens = [];
mytokensfolders = [];
tokens_rootfolders = [];
monster_search_filters = {};
encounter_monster_items = {}; // encounterId: SidebarTokenItem[]
cached_monster_items = {}; // monsterId: SidebarTokenItem
aoe_items = [];
open5e_monsters = [];
open5e_next = '';
cached_open5e_items = {};



async function getOpen5e(results = [], search = ''){
    let ddbMonsterTypes = {
        1: 'Aberration',
        2: 'Beast',
        3: 'Celestial',
        4: 'Construct',
        6: 'Dragon',
        7: 'Elemental',
        8: 'Fey',
        9: 'Fiend',
        10: 'Giant',
        11: 'Humanoid',
        13: 'Monstrosity',
        14: 'Ooze',
        15: 'Plant',
        16: 'Undead'
    }
    const maxCR = (monster_search_filters?.challengeRatingMax) ? monster_search_filters?.challengeRatingMax : '';
    const minCR = (monster_search_filters?.challengeRatingMin) ? monster_search_filters?.challengeRatingMin : '';
    const monsterTypes = (monster_search_filters?.monsterTypes) ? monster_search_filters.monsterTypes.map(item=> item = ddbMonsterTypes[item]).toString() : '';
    

    let api_url = `https://api.open5e.com/monsters/?slug__in=&slug__iexact=&slug=&name__iexact=&name=&cr=&cr__range=&cr__gt=${minCR}&cr__gte=&cr__lt=${maxCR}&cr__lte=&armor_class=&armor_class__range=&armor_class__gt=&armor_class__gte=&armor_class__lt=&armor_class__lte=&type__iexact=&type=&type__in=${monsterTypes}&type__icontains=&page_no=&page_no__range=&page_no__gt=&page_no__gte=&page_no__lt=&page_no__lte=&document__slug__iexact=&document__slug=&document__slug__in=&document__slug__not_in=&name__icontains=${search}&limit=10`
    let jsonData = {}
    await $.getJSON(api_url, function(data){
        jsonData = data;

    });
    for (let i = 0; i < jsonData.results.length; i++) {
        jsonData.results[i] = convert_open5e_monsterData(jsonData.results[i])
    }
    results = results.concat(jsonData.results)
    open5e_monsters = results;
    open5e_next = jsonData.next;
    inject_open5e_monster_list_items(open5e_monsters); 

    return open5e_monsters;
}
async function getGroupOpen5e(slugin){
    let api_url = `https://api.open5e.com/monsters/?ordering=name&slug__in=${slugin}&slug__iexact=&slug=&name__iexact=&name=&cr=&cr__range=&cr__gt=&cr__gte=&cr__lt=&cr__lte=&armor_class=&armor_class__range=&armor_class__gt=&armor_class__gte=&armor_class__lt=&armor_class__lte=&type__iexact=&type=&type__in=&type__icontains=&page_no=&page_no__range=&page_no__gt=&page_no__gte=&page_no__lt=&page_no__lte=&document__slug__iexact=&document__slug=&document__slug__in=&document__slug__not_in=&limit=10`
    let jsonData = {}
    await $.getJSON(api_url, function(data){
        jsonData = data;
    });
    for (let i = 0; i < jsonData.results.length; i++) {
        jsonData.results[i] = convert_open5e_monsterData(jsonData.results[i])
    }
    return jsonData.results;
}
async function getNextOpen5e(results = open5e_monsters, nextPage){ 
    let jsonData = {}
    await $.getJSON(nextPage, function(data){
        jsonData = data;
    });

    results = results.concat(jsonData.results)
    for (let i = 0; i < jsonData.results.length; i++) {
        jsonData.results[i] = convert_open5e_monsterData(jsonData.results[i])
    }
    open5e_monsters = results;
    open5e_next = jsonData.next;
    return open5e_monsters;
}

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

    console.group("rollback_from_my_tokens");
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
    // TODO: use find find_pc_by_player_id here? It would add an "unknown player" to the list. This would be useful when allowing players to guest DM when other players have a private character sheet
    let pc = window.pcs.find(p => p.sheet.includes(playerId));
    if (pc === undefined) return undefined;
    let fullPath = sanitize_folder_path(`${RootFolder.Players.path}/${pc.name}`);
    const pcCustomization = window.TOKEN_CUSTOMIZATIONS.find(d => d.id.includes(playerId))
    if(pcCustomization){
        fullPath = sanitize_folder_path(pcCustomization.fullPath());
    }
    else{
        fullPath = sanitize_folder_path(`${RootFolder.Players.path}/${pc.name}`);
    }
   
    
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
    console.group("find_builtin_token");
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
    if (!window.DM) return;
    console.group("rebuild_token_items_list");
    try {

    //bring old players folder data up to current structure to support players folders
    const playersFolder = window.TOKEN_CUSTOMIZATIONS.find(tc=> tc.id == RootFolder.Players.id)
    if(playersFolder !== undefined){
        playersFolder.parentId = '_';
        playersFolder.rootId = 'playersFolder';
    }

    backfill_mytoken_folders(); // just in case we're missing any folders

    // Players
    let tokenItems = window.pcs
        .filter(pc => pc.sheet !== undefined && pc.sheet !== "")
        .map(pc => {
            const playerCustomization = window.TOKEN_CUSTOMIZATIONS.find(tc => tc.id == pc.sheet);
            //adjust old data structure
            if([RootFolder.Monsters.id, RootFolder.MyTokens.id].includes(playerCustomization?.parentId))
                playerCustomization.parentId = RootFolder.Players.id;
            if([RootFolder.Monsters.id, RootFolder.MyTokens.id].includes(playerCustomization?.rootId))
                playerCustomization.rootId = RootFolder.Players.id;
            let folderPath = playerCustomization?.folderPath();
            let parentId = playerCustomization?.parentId; 
            return SidebarListItem.PC(pc.sheet, pc.name, pc.image, folderPath, parentId);
        });
    // Players Folders
    window.TOKEN_CUSTOMIZATIONS
        .filter(tc => tc.tokenType === ItemType.Folder && tc.fullPath().startsWith(RootFolder.Players.path))
        .forEach(tc => {
            tokenItems.push(SidebarListItem.Folder(tc.id, tc.folderPath(), tc.name(), tc.tokenOptions.collapsed, tc.parentId, ItemType.PC, tc.color))
        })
    // My Tokens Folders
    window.TOKEN_CUSTOMIZATIONS
        .filter(tc => tc.tokenType === ItemType.Folder && tc.fullPath().startsWith(RootFolder.MyTokens.path))
        .forEach(tc => {
            tokenItems.push(SidebarListItem.Folder(tc.id, tc.folderPath(), tc.name(), tc.tokenOptions.collapsed, tc.parentId, ItemType.MyToken, tc.color))
        })

    // Encounter Folders
    window.TOKEN_CUSTOMIZATIONS
        .filter(tc => tc.tokenType === ItemType.Folder && tc.fullPath().startsWith(RootFolder.Encounters.path))
        .forEach(tc => {
            const newFolder = SidebarListItem.Folder(tc.id, tc.folderPath(), tc.name(), tc.tokenOptions.collapsed, tc.parentId, ItemType.Encounter, tc.color)
            if(tc.encounterData != undefined)
                newFolder.encounterData = tc.encounterData;
            tokenItems.push(newFolder);
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
            builtinFolderPath === RootFolder.AboveVTT.path ? RootFolder.AboveVTT.id : path_to_html_id(builtinFolderPath),
              ItemType.BuiltinToken
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

    if(window.reorderState == ItemType.PC || window.reorderState == ItemType.MyToken)
       enable_draggable_change_folder(window.reorderState)
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
    $('.custom-token-list').hide();
    redraw_token_list(searchTerm, true, true);

    if (searchTerm.length > 0) {
        let allFolders = tokensPanel.body.find(".folder");
        allFolders.removeClass("collapsed"); // auto expand all folders
        for (let i = 0; i < allFolders.length; i++) {
            let currentFolder = $(allFolders[i]);
            if (matches_full_path(currentFolder, RootFolder.Monsters.path) || matches_full_path(currentFolder, RootFolder.Open5e.path) ) {
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
    window.open5eListItems = [];
    open5e_monsters = [];
    inject_monster_tokens(searchTerm, 0);
    getOpen5e(open5e_monsters, searchTerm);
     $('.custom-token-list').show();
}

/**
 * Calls the DDB API to search for monsters matching the given searchTerm and injects the results into the sidebar panel
 * @param searchTerm {string} the search term that the user typed into the search input
 * @param skip {number} the pagination offset. This function will inject a "Load More" button with the skip details embedded. You don't need to pass anything for this.
 */
function inject_monster_tokens(searchTerm, skip, addedList=[]) {
    console.log("inject_monster_tokens about to call search_monsters");
    search_monsters(searchTerm, skip, function (monsterSearchResponse) {
        let listItems = addedList;
        let remainderItems = 0;

        for (let i = 0; i < monsterSearchResponse.data.length; i++) {
            if(listItems.length == 10){
                remainderItems = 10 - i;
                break;
            }
            let m = monsterSearchResponse.data[i];
            let item = SidebarListItem.Monster(m)
            if(window.ownedMonstersOnly && !item.monsterData.isReleased && item.monsterData.homebrewStatus == 0){
                continue;   
            }
            window.monsterListItems.push(item);
            listItems.push(item);
        }
        console.log("search_monsters converted", listItems);
        let monsterFolder = find_html_row_from_path(RootFolder.Monsters.path, tokensPanel.body);
        if(listItems.length < 10 && monsterSearchResponse.pagination.total > (monsterSearchResponse.pagination.skip + 10)){
           inject_monster_tokens(searchTerm, skip + 10, listItems);
        }
        else{
            inject_monster_list_items(listItems);
            if (searchTerm.length > 0) {
                monsterFolder.removeClass("collapsed");
            }     
            console.log("search_monster pagination ", monsterSearchResponse.pagination.total, monsterSearchResponse.pagination.skip, monsterSearchResponse.pagination.total > monsterSearchResponse.pagination.skip);
            monsterFolder.find(".load-more-button").remove();
            if (monsterSearchResponse.pagination.total > (monsterSearchResponse.pagination.skip - remainderItems + 10)) {
                // add load more button
                let loadMoreButton = $(`<button class="ddbeb-button load-more-button" data-skip="${monsterSearchResponse.pagination.skip}">Load More</button>`);
                loadMoreButton.click(function(loadMoreClickEvent) {
                    console.log("load more!", loadMoreClickEvent);
                    let previousSkip = parseInt($(loadMoreClickEvent.currentTarget).attr("data-skip"));
                    inject_monster_tokens(searchTerm, previousSkip - remainderItems + 10);
                });
                monsterFolder.find(`> .folder-item-list`).append(loadMoreButton);
            }
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

function inject_open5e_monster_list_items(listItems = open5e_monsters) {
    let monsterFolder = find_html_row_from_path(RootFolder.Open5e.path, tokensPanel.body);
    if (monsterFolder === undefined || monsterFolder.length === 0) {
        console.warn("inject_monster_list_items failed to find the monsters folder");
        return;
    }
    let list = monsterFolder.find(`> .folder-item-list`);
    for (let i = 0; i < listItems.length; i++) {
        let item = SidebarListItem.open5eMonster(listItems[i]);
        window.open5eListItems.push(item);
        let row = build_sidebar_list_row(item);
        enable_draggable_token_creation(row);
        list.append(row);
    }
    if(open5e_next){
        // add load more button
        let loadMoreButton = $(`<button class="ddbeb-button open5e-load-more load-more-button">Load More</button>`);
        loadMoreButton.click(async function(loadMoreClickEvent) {
            console.log("load more!", loadMoreClickEvent);   
            open5e_monsters = await getNextOpen5e(open5e_monsters, open5e_next);
            $('.open5e-load-more').remove();
            monsterFolder.find('.folder-item-list').empty();
            inject_open5e_monster_list_items(open5e_monsters);
        });
        
        monsterFolder.find(`> .folder-item-list`).append(loadMoreButton);
    }

}

/** Called on startup. It reads from localStorage, and initializes all the things needed for the TokensPanel to function properly */
function init_tokens_panel() {
    console.log("init_tokens_panel");

    tokens_rootfolders = [
        SidebarListItem.Folder(RootFolder.Players.id, RootFolder.Root.path, RootFolder.Players.name, false, path_to_html_id(RootFolder.Root.path), ItemType.PC),
        SidebarListItem.Folder(RootFolder.Monsters.id, RootFolder.Root.path, RootFolder.Monsters.name, false, path_to_html_id(RootFolder.Root.path), ItemType.Monster),
        SidebarListItem.Folder(RootFolder.Open5e.id, RootFolder.Root.path, RootFolder.Open5e.name, false, path_to_html_id(RootFolder.Root.path), ItemType.Open5e),
        SidebarListItem.Folder(RootFolder.MyTokens.id, RootFolder.Root.path, RootFolder.MyTokens.name, false, path_to_html_id(RootFolder.Root.path), ItemType.MyToken),
        SidebarListItem.Folder(RootFolder.AboveVTT.id, RootFolder.Root.path, RootFolder.AboveVTT.name, false, path_to_html_id(RootFolder.Root.path), ItemType.BuiltinToken),
        SidebarListItem.Folder(RootFolder.DDB.id, RootFolder.Root.path, RootFolder.DDB.name, false, path_to_html_id(RootFolder.Root.path), ItemType.DDBToken),
        SidebarListItem.Folder(RootFolder.Encounters.id, RootFolder.Root.path, RootFolder.Encounters.name, false, path_to_html_id(RootFolder.Root.path), ItemType.Encounter),
        SidebarListItem.Folder(RootFolder.Aoe.id, RootFolder.Root.path, RootFolder.Aoe.name, false, path_to_html_id(RootFolder.Root.path), ItemType.Aoe)
    ];

    aoe_items = [
        SidebarListItem.Aoe("square", 1, "acid"),
        SidebarListItem.Aoe("circle", 1, "acid"),
        SidebarListItem.Aoe("cone", 1, "acid"),
        SidebarListItem.Aoe("line", 1, "acid")
    ]
    hiddenFolderItems = (JSON.parse(localStorage.getItem(`${window.gameId}.hiddenFolderItems`)) != null) ? JSON.parse(localStorage.getItem(`${window.gameId}.hiddenFolderItems`)) : [];


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
    add_expand_collapse_buttons_to_header(tokensPanel, true);

    let searchInput = $(`<input name="token-search" type="search" style="width:93%;margin:2%" placeholder="search tokens">`);
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
    window.open5eListItems = [];
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
function redraw_token_list(searchTerm, enableDraggable = true, leaveEmpty=false) {
    if (!window.DM) return;
    if (!window.tokenListItems) {
        // don't do anything on startup
        return;
    }
    console.group("redraw_token_list");
    update_token_folders_remembered_state();
    let list = $(`<div class="custom-token-list"></div>`);
    tokensPanel.body.find('.custom-token-list').remove();
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

            if(item.encounterData?.tokenItems != undefined){
                for(let i in item.encounterData.tokenItems){
                    if(item.encounterData.tokenItems[i].type != 'pc'){
                        if(item.encounterData.tokenItems[i].quantity != undefined){
                            for(let j = 0; j<item.encounterData.tokenItems[i].quantity; j++){
                                const newRow = build_sidebar_list_row(SidebarListItem.fromJson(item.encounterData.tokenItems[i]));
                                row.find('.folder-item-list').append(newRow);
                            }
                        }
                        else{
                            const newRow = build_sidebar_list_row(SidebarListItem.fromJson(item.encounterData.tokenItems[i]));
                            row.find('.folder-item-list').append(newRow);
                        }
                    }
                    
                }

            }
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
    if(!leaveEmpty){
        inject_monster_tokens(nameFilter);
        inject_open5e_monster_list_items();
    }

    if(!$('.reveal-hidden-button').hasClass('clicked')){
        $(".sidebar-panel-content").find(".sidebar-panel-body .hidden-sidebar-item").toggleClass("temporary-visible", false);
    }
    else{
        $(".sidebar-panel-content").find(".sidebar-panel-body .hidden-sidebar-item").toggleClass("temporary-visible", true);
    }  
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
        cancel: '.token-row-gear, .change-token-image-item, #context-menu-layer',
        distance: 25,
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
                let helper = draggedRow.find(".token-image").clone();
                if (specificImage !== undefined) {
                    helper.attr("src", specificImage);
                } else {         
                    helper.attr("src", random_image_for_item(draggedItem));
                    
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
                $(ui.helper).css({
                    'width': `${helperWidth}px`,
                    'max-width': `${helperWidth}px`,
                    'max-height': `${helperWidth}px`,
                    'min-width': `${helperWidth}px`,
                    'min-height': `${helperWidth}px`
                });
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
                create_and_place_token(draggedItem, hidden, src, event.pageX, event.pageY, false);
                // create_and_place_token(draggedItem, hidden, src, event.pageX - ui.helper.width() / 2, event.pageY - ui.helper.height() / 2, false, ui.helper.attr("data-name-override"));
                
            } 
            else if(droppedOn?.closest("#encounterWindow")){
                const droppedOnWindow = $(droppedOn?.closest("#encounterWindow"));
                const encounterId = droppedOnWindow.attr('data-encounter-id');
                console.log("enable_draggable_token_creation stop");
                let draggedRow = $(event.target).closest(".list-item-identifier");
                if ($(event.target).hasClass("list-item-identifier")) {
                    draggedRow = $(event.target);
                }
                let draggedItem = find_sidebar_list_item(draggedRow);

                const customization = find_or_create_token_customization(ItemType.Folder, encounterId);
                if(customization.encounterData == undefined)
                    customization.encounterData = {}
                if(customization.encounterData.tokenItems == undefined)
                    customization.encounterData.tokenItems = {};

                if(customization.encounterData.tokenItems[draggedItem.id] != undefined){
                    customization.encounterData.tokenItems[draggedItem.id].quantity += 1;
                }
                else{
                    customization.encounterData.tokenItems[draggedItem.id] = draggedItem;
                    customization.encounterData.tokenItems[draggedItem.id].quantity = 1; 
                }
                if(draggedItem.type == 'pc'){
                    customization.encounterData.tokenItems[draggedItem.id].isAlly = true;
                }
                persist_token_customization(customization)
                droppedOnWindow.trigger('redrawListing');
                

                console.log(`Dropped on encounter: ${draggedItem}`);

            }else {
                console.log("Not dropping over element", droppedOn);
            }
        }
    });
}

/** When new PC data comes in, this updates the rows with the data found in window.PLAYER_STATS */
function update_pc_token_rows() {
    window.tokenListItems?.filter(listItem => listItem.isTypePC()).forEach(listItem => {
        let row = find_html_row(listItem, tokensPanel.body);
        if(childWindows['Players']){
            let popoutPC = find_html_row(listItem, $(childWindows['Players'].document).find('body'));
            if(popoutPC != false)
                row = row.add(popoutPC);
        }
        
        if (listItem.sheet in window.TOKEN_OBJECTS) {
            row.addClass("on-scene");
            row.find("button.token-row-add").attr("title", `Locate Token on Scene`);
        } else {
            row.removeClass("on-scene");
            row.find("button.token-row-add").attr("title", `Add Token to Scene`);
        }

        const playerId = getPlayerIDFromSheet(listItem.sheet);
        const pc = find_pc_by_player_id(playerId, false);

        if (pc !== undefined) {
            const color = color_from_pc_object(pc);
            pc.abilities.forEach(a => {
                let abilityValue = row.find(`[data-ability='${a.name}']`);
                abilityValue.find(".ability_modifier").text(a.modifier);
                abilityValue.find(".ability_score").text(a.score);
            });    
            let customizations = find_token_customization(listItem.type, listItem.id);
            row.find(".token-image").attr('src', (customizations?.tokenOptions?.alternativeImages?.length>0) ? customizations?.tokenOptions?.alternativeImages[0] : pc.image);
            row.find(".pinv-value").text(pc.passiveInvestigation);
            row.find(".pins-value").text(pc.passiveInsight);
            row.find(".walking-value").text(speed_from_pc_object(pc));
            row.find(".ac-value").text(pc.armorClass);
            row.find(".hp-value").text(pc.hitPointInfo.current || 0);
            row.find(".max-hp-value").text(pc.hitPointInfo.maximum || 0);
            let flyingSpeed = speed_from_pc_object(pc, "Flying");
            row.find(".fly-value").text(flyingSpeed);
            let climbingSpeed = speed_from_pc_object(pc, "Climbing");
            row.find(".climb-value").text(climbingSpeed);
            let swimmingSpeed = speed_from_pc_object(pc, "Swimming");
            row.find(".swim-value").text(swimmingSpeed);
            if(climbingSpeed > 0) {
                row.find(".subtitle-attibute[title='Climb Speed']").show()
            } else {
                row.find(".subtitle-attibute[title='Climb Speed']").hide()
            }
            if(flyingSpeed > 0) {
                row.find(".subtitle-attibute[title='Fly Speed']").show()
            } else{
                row.find(".subtitle-attibute[title='Fly Speed']").hide()
            }
            if(flyingSpeed > 0) {
                row.find(".subtitle-attibute[title='Swim Speed']").show()
            } else {
                row.find(".subtitle-attibute[title='Swim Speed']").hide()
            }

            row.find(".player-card-footer").css("--player-border-color",  color);
            row.css("--player-border-color",  color);

            row.find(".subtitle-attibute .exhaustion-pip").toggleClass("filled", false);
            if(pc.hitPointInfo.current > 0) {
                row.find(".subtitle-attibute.hp-attribute").show();
                row.find(".hp-attribute.death-saves.ct-health-summary__data").hide();
            } else{
                row.find(".hp-attribute.death-saves.ct-health-summary__data").show();
                row.find(".subtitle-attibute.hp-attribute").hide();
                row.find(`.ct-health-summary__deathsaves-mark`).toggleClass('ct-health-summary__deathsaves-mark--inactive', true);
                row.find(`.ct-health-summary__deathsaves-mark`).toggleClass('ct-health-summary__deathsaves-mark--active', false);
                for(let i = 0; i <= pc.deathSaveInfo.failCount; i++){
                    row.find(`.ct-health-summary__deathsaves--fail .ct-health-summary__deathsaves-mark:nth-of-type(${i})`).toggleClass("ct-health-summary__deathsaves-mark--active", true);
                }
                for(let i = 0; i <= pc.deathSaveInfo.successCount; i++){
                    row.find(`.ct-health-summary__deathsaves--success .ct-health-summary__deathsaves-mark:nth-of-type(${i})`).toggleClass("ct-health-summary__deathsaves-mark--active", true);
                }
            }

            const exhaustionLevel = pc.conditions.find(c => c.name === "Exhaustion")?.level || 0;
            for(let i = 0; i <= exhaustionLevel; i++){
                 row.find(`.subtitle-attibute .exhaustion-pip:nth-of-type(${i})`).toggleClass("filled", true);
            }
            if (pc.inspiration) {
                row.find(".inspiration").show();
            } else {
                row.find(".inspiration").hide();
            }

            row.find('.moreInfo').remove();
            let moreInfo = $(`<div class='moreInfo' style='font-size:12px;'>
                 ${pc.castingInfo.saveDcs.length>0 ? `<div style='margin-top:5px'><strong style='margin-left:5px;'>Spell Save DCs</strong>${pc.castingInfo.saveDcs.map(a => `<div style='margin-left:15px'>${a.sources[0]}: ${a.value}</div>`).join('')}` : ``}
                 ${pc.resistances.length>0 ? `<div style='margin-top:5px'><strong style='margin-left:5px;'>Resistances</strong><div style='margin-left:15px'>${pc.resistances.map(a => `${a.name}`).join(', ')}</div></div>` : ``}
                 ${pc.immunities.length>0 ? `<div style='margin-top:5px'><strong style='margin-left:5px;'>Immunities</strong><div style='margin-left:15px'>${pc.immunities.map(a => `${a.name}`).join(', ')}</div></div>` : ``}
                 ${pc.vulnerabilities.length>0 ? `<div style='margin-top:5px'><strong style='margin-left:5px;'>Vulnerabilities</strong><div style='margin-left:15px'>${pc.vulnerabilities.map(a => `${a.name}`).join(', ')}</div></div>` : ``}
                 ${pc.senses.length>0 ? `<div style='margin-top:5px'><strong style='margin-left:5px;'>Senses</strong><div style='margin-left:15px'>${pc.senses.map(a => `${a.name} ${a.distance}`).join(', ')}</div></div>` : ``}
                 ${pc.proficiencyGroups.length>0 ? `<div style='margin-top:5px'><strong style='margin-left:5px;'>Proficiencies</strong> ${pc.proficiencyGroups.map(a => `<div style='margin-left:15px'><strong>${a.group}:</strong> ${a.values == "" ? `None` : a.values}</div>`).join('')}</div>` : ``}  
               </div>`)
            row.append(moreInfo);

            update_player_online_indicator(playerId, pc.p2pConnected, color);
            row.css("--player-border-color",  color);
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


function create_and_place_token(listItem, hidden = undefined, specificImage= undefined, eventPageX = undefined, eventPageY = undefined, disableSnap = false, nameOverride = "", mapPoint=false, extraOptions=undefined) {


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

            if(listItem.encounterData?.tokenItems != undefined){
                for(let i in listItem.encounterData.tokenItems){
                    if(listItem.encounterData.tokenItems[i].type != 'pc'){
                        if(listItem.encounterData.tokenItems[i].quantity != undefined){
                            for(let j = 0; j<listItem.encounterData.tokenItems[i].quantity; j++){
                                tokensToPlace.push(SidebarListItem.fromJson(listItem.encounterData.tokenItems[i])); 
                            }
                        }
                        else{
                            tokensToPlace.push(SidebarListItem.fromJson(listItem.encounterData.tokenItems[i])); 
                        }                    
                    }
                }
            }
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
    let options = {...window.TOKEN_SETTINGS}
    // set up whatever you need to. We'll override a few things after
    let foundOptions = find_token_options_for_list_item(listItem);
    options = {...options, ...foundOptions}; // we may need to put this in specific places within the switch statement below
    const chosenImage = random_image_for_item(listItem, specificImage);
    options.imgsrc = chosenImage;


    if(options.alternativeImagesCustomizations != undefined && options.alternativeImagesCustomizations[options.imgsrc] != undefined){
        const visionOptions = {
            'vision': {...options.vision},
            'light1': {...options.light1},
            'light2': {...options.light2}
        }
        options = {
            ...options,
            ...options.alternativeImagesCustomizations[options.imgsrc],
            imgsrc: options.imgsrc
        }
        if(options.vision != undefined && options.vision?.feet == undefined && visionOptions?.vision?.feet != undefined){
            options.vision.feet = visionOptions.vision.feet;
        }
         if(options.light1 != undefined && options.light1?.feet == undefined && visionOptions?.light1?.feet != undefined){
            options.light1.feet = visionOptions.light1.feet;
        }
         if(options.light2 != undefined && options.light2?.feet == undefined && visionOptions?.light2?.feet != undefined){
            options.light2.feet = visionOptions.light2.feet;
        }
    }

    options.name = listItem.name;


    let tokenSizeSetting;
    let tokenSize;
    let hpVal;
    let placedCount;
    let color;
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
            placedCount = 1;
            for (let tokenId in window.TOKEN_OBJECTS) {
                if (window.TOKEN_OBJECTS[tokenId].options.itemId === listItem.id) {
                    placedCount++;
                }
            }
            color = TOKEN_COLORS[(placedCount - 1) % 54];
            options.color = `#${color}`;
            switch (options['placeType']) {
                case 'personality':
                    let personailityTrait = getPersonailityTrait()
                    console.log(`updating monster name with trait: ${personailityTrait}, and setting color: ${color}`);
                    options.name = ` ${personailityTrait} ${listItem.name}`;
                    break;
                case 'none':
                    break;
                case 'count': 
                default:    
                    if (placedCount > 1) {
                        console.log(`updating monster name with count: ${placedCount}, and setting color: ${color}`);
                        options.name = `${listItem.name} ${placedCount}`; 
                    }
                    break;
            }
            
            break;
        case ItemType.PC:
            let pc = window.pcs.find(pc => pc.sheet.includes(listItem.sheet));
            if (pc === undefined) {
                console.warn(`failed to find pc for id ${listItem.sheet}`);
                return;
            }
            options.id = listItem.sheet;
            if(window.all_token_objects[options.id] != undefined){           
                options = {...options, ...window.all_token_objects[options.id].options}
                if(specificImage)
                    options.imgsrc = chosenImage;
            }
            tokenSizeSetting = options.tokenSize;
            tokenSize = parseInt(tokenSizeSetting);
            if (tokenSizeSetting === undefined || typeof tokenSizeSetting !== 'number') {
                tokenSize = 1;
                // TODO: handle custom sizes
            }
            if (tokenSize <= 0.5) {
                options.tokenSize = 0.5;
            } else {
                options.tokenSize = tokenSize;
            }
            options.hitPointInfo = pc.hitPointInfo || {
                current: 0,
                maximum: 0,
                temp: 0
            };
            options.armorClass = pc.armorClass;
            options = {...options, ...foundOptions, name: listItem.name};
            break;
        case ItemType.Monster:
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
            options.hitPointInfo = {
                current: hpVal,
                maximum: hpVal,
                temp: 0
            };
            tokenSizeSetting = options.tokenSize;
            tokenSize = parseInt(tokenSizeSetting);
            if (tokenSizeSetting === undefined || typeof tokenSizeSetting !== 'number') {
                options.sizeId = listItem.monsterData.sizeId;
                // TODO: handle custom sizes
            }
            options.armorClass = listItem.monsterData.armorClass;
            options.monster = listItem.monsterData.id;
            options.stat = listItem.monsterData.id;

            placedCount = 1;
            for (let tokenId in window.TOKEN_OBJECTS) {
                if (window.TOKEN_OBJECTS[tokenId].options.monster === listItem.monsterData.id) {
                    placedCount++;
                }
            }
            color = TOKEN_COLORS[(placedCount - 1) % 54];
            options.color = `#${color}`;
            switch (options['placeType']) {
                case 'personality':
                    let personailityTrait = getPersonailityTrait()
                    console.log(`updating monster name with trait: ${personailityTrait}, and setting color: ${color}`);
                    options.name = ` ${personailityTrait} ${listItem.name}`;
                    break;
                case 'none':
                    break;
                case 'count': 
                default:    
                    if (placedCount > 1) {
                        console.log(`updating monster name with count: ${placedCount}, and setting color: ${color}`);
                        options.name = `${listItem.name} ${placedCount}`; 
                    }
                    break;
            }
            if(listItem.monsterData.senses.length > 0 && foundOptions.vision == undefined){
                let darkvision = 0;
                for(let i=0; i < listItem.monsterData.senses.length; i++){
                    const ftPosition = listItem.monsterData.senses[i].notes.indexOf('ft.')
                    const range = parseInt(listItem.monsterData.senses[i].notes.slice(0, ftPosition));
                    if(range > darkvision)
                        darkvision = range;
                }
                options.vision = {
                    feet: darkvision.toString(),
                    color: (window.TOKEN_SETTINGS?.vision?.color) ? window.TOKEN_SETTINGS.vision.color : 'rgba(142, 142, 142, 1)'
                }
            }
            break;
        case ItemType.Open5e:
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
            options.hitPointInfo = {
                current: hpVal,
                maximum: hpVal,
                temp: 0
            };
            tokenSizeSetting = options.tokenSize;
            tokenSize = parseInt(tokenSizeSetting);
            if (tokenSizeSetting === undefined || typeof tokenSizeSetting !== 'number') {
                options.sizeId = listItem.monsterData.sizeId;
                // TODO: handle custom sizes
            }
            options.armorClass = listItem.monsterData.armorClass;
            options.monster = "open5e";
            options.stat = listItem.monsterData.slug;
            placedCount = 1;
            for (let tokenId in window.TOKEN_OBJECTS) {
                if (window.TOKEN_OBJECTS[tokenId].options.monster === listItem.monsterData.id) {
                    placedCount++;
                }
            }
            color = TOKEN_COLORS[(placedCount - 1) % 54];
            options.color = `#${color}`;
            switch (options['placeType']) {
           
                case 'personality':
                    let personailityTrait = getPersonailityTrait()
                    console.log(`updating monster name with trait: ${personailityTrait}, and setting color: ${color}`);
                    options.name = ` ${personailityTrait} ${listItem.name}`;
                    break;
                case 'none':
                    break;
                case 'count': 
                default:    
                    if (placedCount > 1) {
                        console.log(`updating monster name with count: ${placedCount}, and setting color: ${color}`);
                        options.name = `${listItem.name} ${placedCount}`; 
                    }
                    break;
            }
            break;
        case ItemType.BuiltinToken:
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
            placedCount = 1;
            for (let tokenId in window.TOKEN_OBJECTS) {
                if (window.TOKEN_OBJECTS[tokenId].options.itemId === listItem.id) {
                    placedCount++;
                }
            }
            color = TOKEN_COLORS[(placedCount - 1) % 54];
            options.color = `#${color}`;
            switch (options['placeType']) {
                case 'personality':
                    let personailityTrait = getPersonailityTrait()
                    console.log(`updating monster name with trait: ${personailityTrait}, and setting color: ${color}`);
                    options.name = ` ${personailityTrait} ${listItem.name}`;
                    break;
                case 'none':
                    break;
                case 'count': 
                default:    
                    if (placedCount > 1) {
                        console.log(`updating monster name with count: ${placedCount}, and setting color: ${color}`);
                        options.name = `${listItem.name} ${placedCount}`; 
                    }
                    break;
            }
            
            break;
        case ItemType.Aoe:
            // we don't want to allow other options for aoe so this is a full replacement of options
            options = build_aoe_token_options(listItem.style, listItem.shape, listItem.size, nameOverride);
            // specificImage = options.imgsrc; // force it to use what we just built
            break;
    }
    if(options.statBlock && window.JOURNAL.notes[options.statBlock]){
        let statText = $(`<div>${window.JOURNAL.notes[options.statBlock].text}</div>`);
        statText.find('style').remove();
        statText=statText[0].innerHTML;
        let hitDiceData =  $(statText).find('.custom-hp-roll.custom-stat').text();
        let averageHP = $(statText).find('.custom-avghp.custom-stat').text();
        let searchText = statText.replaceAll('mon-stat-block-2024', '').replaceAll(/\&nbsp\;/g,' ')
        if(averageHP == ''){
            let match = searchText.matchAll(/(Hit Points|hp)[\s\S]*?[\s>]([0-9]+)/gi).next()
            if(match.value != undefined){
                averageHP = match.value[2] 
            }
        }
        if(hitDiceData == ''){
            const hpRollRegex = /(Hit Points|hp)[\s\S]+?\((([0-9]+d[0-9]+)\s?([+-]\s?[0-9]+)?)\)|Hit Points[\s\S]+?\(([0-9]+\s?([+-]\s?([0-9]+d[0-9]+))?)\)/gi
            let match = searchText.matchAll(hpRollRegex).next()
            if(match.value != undefined){
                if(match.value[2] != undefined)
                    hitDiceData = match.value[2] 
                else if(match.value[5] != undefined)
                    hitDiceData = match.value[5] 
            }
        }
         switch (options['defaultmaxhptype']) {
            case 'max':
                if(hitDiceData != ''){
                    hpVal = new rpgDiceRoller.DiceRoll(hitDiceData).maxTotal;
                }else if(averageHP && averageHP != ''){
                    hpVal = averageHP;          
                }
                break;
            case 'roll':
                if(hitDiceData && hitDiceData != ''){
                    hpVal = new rpgDiceRoller.DiceRoll(hitDiceData).total;
                }else if(averageHP && averageHP != ''){
                    hpVal = averageHP;          
                }
                break;
            case 'average':
            default:
                if(averageHP && averageHP != ''){
                    hpVal = averageHP;          
                }
                break;
        }
        if(hpVal){
            options.hitPointInfo = {
                current: hpVal,
                maximum: hpVal,
                temp: 0
            };
        }
        let newStatBlockInit = searchText.matchAll(/Initiative[\s\S]*?[\s>]([+-][0-9]+)/gi).next()

        if(newStatBlockInit.value != undefined){
            if(newStatBlockInit.value[1] != undefined)
                options.customInit = newStatBlockInit.value[1];
        }        

        const newInit = $(searchText).find('.custom-initiative.custom-stat').text();
        if(newInit){
            options.customInit = newInit
        }


        if($(searchText).find('table.abilities-saves, table.stat-table').length>0){
             let physicalStats = $(searchText).find('table.abilities-saves.physical, table.stat-table.physical');
             let mentalStats = $(searchText).find('table.abilities-saves.mental, table.stat-table.mental');
             options.customStat = {
                '0': {
                    mod: physicalStats.find('tr:nth-of-type(1) td:nth-of-type(2)').text(),
                    save: physicalStats.find('tr:nth-of-type(1) td:nth-of-type(3)').text()
                },
                '1': {
                    mod: physicalStats.find('tr:nth-of-type(2) td:nth-of-type(2)').text(),
                    save: physicalStats.find('tr:nth-of-type(2) td:nth-of-type(3)').text()
                },
                '2': {
                    mod: physicalStats.find('tr:nth-of-type(3) td:nth-of-type(2)').text(),
                    save: physicalStats.find('tr:nth-of-type(3) td:nth-of-type(3)').text()
                },
                '3': {
                    mod: mentalStats.find('tr:nth-of-type(1) td:nth-of-type(2)').text(),
                    save: mentalStats.find('tr:nth-of-type(1) td:nth-of-type(3)').text(),
                },
                '4': {
                    mod: mentalStats.find('tr:nth-of-type(2) td:nth-of-type(2)').text(),
                    save: mentalStats.find('tr:nth-of-type(2) td:nth-of-type(3)').text()
                },
                '5': {
                    mod: mentalStats.find('tr:nth-of-type(3) td:nth-of-type(2)').text(),
                    save: mentalStats.find('tr:nth-of-type(3) td:nth-of-type(3)').text()
                }
            }
        }

        if(options.customStat == undefined){
            let match = searchText.matchAll(/STR[<\s][\s\S]+?\(([+-][0-9]+)\)[\s\S]+?\(([+-][0-9]+)\)[\s\S]+?\(([+-][0-9]+)\)[\s\S]+?\(([+-][0-9]+)\)[\s\S]+?\(([+-][0-9]+)\)[\s\S]+?\(([+-][0-9]+)\)/gi).next()
            if(match.value != undefined){
                const str = match.value[1] != undefined ? match.value[1] : '+0'
                const dex = match.value[2] != undefined ? match.value[2] : '+0'
                const con = match.value[3] != undefined ? match.value[3] : '+0'
                const int = match.value[4] != undefined ? match.value[4] : '+0'
                const wis = match.value[5] != undefined ? match.value[5] : '+0'
                const cha = match.value[6] != undefined ? match.value[6] : '+0'

                options.customStat ={
                    '0': {
                        mod: str
                    },
                    '1': {
                        mod: dex
                    },
                    '2': {
                        mod: con
                    },
                    '3': {
                        mod: int
                    },
                    '4': {
                        mod: wis
                    },
                    '5': {
                        mod: cha
                    }
                }
            }

            let matchStrSave = searchText.matchAll(/Saving Throw[\s\S]+?str[\s]?([+-][0-9]+)?/gi).next()
            let matchDexSave = searchText.matchAll(/Saving Throw[\s\S]+?dex[\s]?([+-][0-9]+)?/gi).next()
            let matchConSave = searchText.matchAll(/Saving Throw[\s\S]+?con[\s]?([+-][0-9]+)?/gi).next()
            let matchIntSave = searchText.matchAll(/Saving Throw[\s\S]+?int[\s]?([+-][0-9]+)?/gi).next()
            let matchWisSave = searchText.matchAll(/Saving Throw[\s\S]+?wis[\s]?([+-][0-9]+)?/gi).next()
            let matchChaSave = searchText.matchAll(/Saving Throw[\s\S]+?cha[\s]?([+-][0-9]+)?/gi).next()

            
            if(options.customStat == undefined){
                options.customStat = {
                    '0': {
                        mod: '+0'
                    },
                    '1': {
                        mod: '+0'
                    },
                    '2': {
                        mod: '+0'
                    },
                    '3': {
                        mod: '+0'
                    },
                    '4': {
                        mod: '+0'
                    },
                    '5': {
                        mod: '+0'
                    }
                }
            }
            options.customStat[0]['save'] = (matchStrSave.value && matchStrSave.value[1] != undefined) ? matchStrSave.value[1] : options.customStat[0]['mod'];
            options.customStat[1]['save'] = (matchDexSave.value && matchDexSave.value[1] != undefined) ? matchDexSave.value[1] : options.customStat[1]['mod'];
            options.customStat[2]['save'] = (matchConSave.value && matchConSave.value[1] != undefined) ? matchConSave.value[1] : options.customStat[2]['mod'];
            options.customStat[3]['save'] = (matchIntSave.value && matchIntSave.value[1] != undefined) ? matchIntSave.value[1] : options.customStat[3]['mod'];
            options.customStat[4]['save'] = (matchWisSave.value && matchWisSave.value[1] != undefined) ? matchWisSave.value[1] : options.customStat[4]['mod'];
            options.customStat[5]['save'] = (matchChaSave.value && matchChaSave.value[1] != undefined) ? matchChaSave.value[1] : options.customStat[5]['mod'];
        }

        let newAC = $(searchText).find('.custom-ac.custom-stat').text();

        if(newAC == ''){
            let match = searchText.matchAll(/(Armor Class|ac)[\s\S]*?[\s>]([0-9]+)[<\.\s]/gi).next()
            if(match.value != undefined && match.value[2] != undefined){
                newAC = match.value[2]
            }
        }


        options.armorClass = (newAC) ? newAC : options.armorClass;
        options.monster = 'customStat'
    }
    if(foundOptions.color != undefined){
        options.color = foundOptions.color;
    }





    options.itemType = listItem.type;
    options.itemId = listItem.id;
    options.listItemPath = listItem.fullPath();
    if (hidden === true || hidden === false) {
        options.hidden = hidden;
    }
    



    if(extraOptions != undefined){
        options = {
            ...options,
            ...extraOptions
        }
    }

    // TODO: figure out if we still need to do this, and where they are coming from
    delete options.undefined;
    delete options[""];
    console.log("create_and_place_token about to place token with options", options, hidden);

    if (eventPageX === undefined || eventPageY === undefined) {
        place_token_in_center_of_view(options);
    } else if(mapPoint==false){
        let mapPosition = convert_point_from_view_to_map(eventPageX, eventPageY, disableSnap);
        place_token_at_map_point(options, mapPosition.x, mapPosition.y);
    }
    else{
        place_token_at_map_point(options, eventPageX, eventPageY);
    }
}

/**
 * determines the size of the token the given item represents
 * @param listItem {SidebarListItem} the item representing a token
 * @returns {number} the tokenSize that corresponds to the token you're looking for
 */
function token_size_for_item(listItem, selectedTokenImage) {
    let options;
    let tokenSizeSetting;
    let tokenSize;
    switch (listItem.type) {
        case ItemType.Folder:
            return 1;
        case ItemType.MyToken:
            options = find_token_options_for_list_item(listItem);
            if(selectedTokenImage){
                options = {
                    ...options,
                    ...options.alternativeImagesCustomizations[selectedTokenImage]
                }
            }
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
             if(selectedTokenImage){
                options = {
                    ...options,
                    ...options.alternativeImagesCustomizations[selectedTokenImage]
                }
            }
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
            options = find_token_options_for_list_item(listItem);
            if(selectedTokenImage){
                options = {
                    ...options,
                    ...options.alternativeImagesCustomizations[selectedTokenImage]
                }
            }
            tokenSizeSetting = parseFloat(options.tokenSize);
            if (isNaN(tokenSizeSetting)) {
                return 1;
            }
            tokenSize = Math.round(tokenSizeSetting * 2) / 2; // round to the nearest 0.5; ex: everything between 0.25 and 0.74 round to 0.5; below .025 rounds to 0, and everything above 0.74 rounds to 1
            if (tokenSize < 0.5) {
                return 0.5;
            }
            return tokenSize;
        case ItemType.Monster:
        case ItemType.Open5e:
            options = find_token_options_for_list_item(listItem);
            if(selectedTokenImage){
                options = {
                    ...options,
                    ...options.alternativeImagesCustomizations[selectedTokenImage]
                }
            }
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
            options = find_token_options_for_list_item(listItem);
            if(selectedTokenImage){
                options = {
                    ...options,
                    ...options.alternativeImagesCustomizations[selectedTokenImage]
                }
            }
            tokenSizeSetting = parseFloat(options.tokenSize);
            if (isNaN(tokenSizeSetting)) {
                return 1;
            }
            tokenSize = Math.round(tokenSizeSetting * 2) / 2; // round to the nearest 0.5; ex: everything between 0.25 and 0.74 round to 0.5; below .025 rounds to 0, and everything above 0.74 rounds to 1
            if (tokenSize < 0.5) {
                return 0.5;
            }
            return tokenSize;
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
    let customization;
    switch (listItem.type) {
        case ItemType.MyToken:
        case ItemType.PC:
        case ItemType.Monster:
        case ItemType.Open5e:
            customization = find_token_customization(listItem.type, listItem.id);
            if (customization) {
                alternativeImages = customization.alternativeImages();
            }
            break;
        case ItemType.BuiltinToken:
            customization = find_token_customization(listItem.type, listItem.id);
            alternativeImages = listItem.tokenOptions.alternativeImages;
            break
        case ItemType.DDBToken:
            customization = find_token_customization(listItem.type, listItem.id);
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
        return parse_img(alternativeImages[randomIndex]);
    } else {
        console.debug("random_image_for_item alternativeImages empty, returning", listItem.image);
        return parse_img(listItem.image);
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
                menuItems["sendToGamelog"] = {
                    name: "Send to Gamelog",
                    callback: function(itemKey, opt, originalEvent) {
                        let imgHtml = $(rowHtml).find('.sidebar-list-item-row-img').clone();
                        imgHtml.find('img, video').addClass('magnify');
                        imgHtml.find('img, video').attr('href', imgHtml.find('img, video').attr('src'));
                        imgHtml = imgHtml.html();
                        imgHtml = imgHtml.replace('video-listing', '');
                        imgHtml = imgHtml.replace('disableremoteplayback', 'disableremoteplayback autoplay loop');

                        let msgdata = {
                            player: window.PLAYER_NAME,
                            img: window.PLAYER_IMG, 
                            text: imgHtml,
                        };
                        window.MB.inject_chat(msgdata)
                    }
                };
            }
            if(rowItem.isTypePC()){
                menuItems["pullToScene"] = {
                    name: "Pull to Current Scene",
                    callback: async function(itemKey, opt, originalEvent){
                        let itemToEdit = await find_sidebar_list_item(opt.$trigger);
                        let currentScene = await AboveApi.getCurrentScene();
                        let sceneIds = {}
                        let playerId = itemToEdit.id.split('/')[4];
                        if(currentScene.playerscene && currentScene.playerscene.players){
                            sceneIds = {
                                ...currentScene.playerscene,         
                            };
                            sceneIds[playerId] = window.CURRENT_SCENE_DATA.id
                        }
                        else if(typeof currentScene.playerscene == 'string'){
                            sceneIds = {
                                players: currentScene.playerscene,
                            };
                            sceneIds[playerId] = window.CURRENT_SCENE_DATA.id
                        }
                        window.splitPlayerScenes = sceneIds;
                        window.MB.sendMessage("custom/myVTT/switch_scene", { sceneId: sceneIds});
                        did_update_scenes();
                    }
                }
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
            if((find_token_customization(rowItem.type, rowItem.id) != undefined || rowItem.isTypeFolder()) && !rowItem.isTypeEncounter() && rowItem.folderType != 'encounter'){
                menuItems['export'] = {
                    name: rowItem.isTypeFolder() ? "Export Folder" : "Export Token",
                    callback: function (itemKey, opt, e) {
                        let customization_export = function(tokenCustomizations) {
                            build_import_loading_indicator('Preparing Export File');
                            let DataFile = {
                                version: 2,
                                scenes: [{}],
                                tokencustomizations: [],
                                notes: {},
                                journalchapters: [],
                                soundpads: {}
                            };
                            let currentdate = new Date(); 
                            let datetime = `${currentdate.getFullYear()}-${(currentdate.getMonth()+1)}-${currentdate.getDate()}`
                                        
                            DataFile.tokencustomizations = tokenCustomizations;

                            DataFile.notes = Object.fromEntries(Object.entries(window.JOURNAL.notes).filter(([key, value]) => window.JOURNAL.notes[key].statBlock == true && tokenCustomizations.filter(d => d?.id == key)[0] != undefined));
                            download(b64EncodeUnicode(JSON.stringify(DataFile,null,"\t")),`${window.CAMPAIGN_INFO.name}-${datetime}-token.abovevtt`,"text/plain");
                                
                            $(".import-loading-indicator").remove();        
                        }
                        let exportTokenFolder = function(exportItems, toExport){                        
                            for(let i = 0; i<exportItems.length; i++){
                                if(exportItems[i].tokenType == 'folder'){
                                    let subExportItems = window.TOKEN_CUSTOMIZATIONS.filter(d => d.parentId == exportItems[i].id) 
                                    exportTokenFolder(subExportItems, toExport);
                                }
                                toExport.push(exportItems[i]);
                            }
                        };

                        let findAncestor = function(exportItem, found=[]) {           
                            if(exportItem ==undefined){
                                return found; 
                            }
                            let parent = window.TOKEN_CUSTOMIZATIONS.find(d => exportItem.parentId == d.id);
                            if (parent) {
                                found.push(parent);
                                return findAncestor(parent, found);
                            } else {
                                return found;
                            }
                        };
                       
                        if(rowItem.isTypeFolder()){
                            let toExport = [];
                            let exportItems = window.TOKEN_CUSTOMIZATIONS.filter(d => (d.parentId == rowItem.id && d.rootId == "myTokensFolder") || (d.tokenType == rowItem.folderType && rowItem.parentId == "_" && d.rootId != "myTokensFolder"));         
                            exportTokenFolder(exportItems, toExport);
                            
                            let selectedExportItem = window.TOKEN_CUSTOMIZATIONS.find(d => d.id == rowItem.id);
                            if(selectedExportItem != undefined)
                                toExport.push(selectedExportItem)
                            
                            
                            
                            let ancestors = findAncestor(selectedExportItem); 
                            if(ancestors.length>0)
                                toExport = toExport.concat(ancestors);

                            customization_export(toExport);
                        }
                        else{
                           let exportItems = window.TOKEN_CUSTOMIZATIONS.find(d => d.id == rowItem.id)
                           let ancestors = findAncestor(exportItems); 
                           exportItems = [exportItems].concat(ancestors);
                           customization_export(exportItems);
                        }
                    }
                };
            }
            if(rowItem.isTypeMonster() || rowItem.isTypeOpen5eMonster()){
                menuItems["copyDDBToken"] = {
                    name: 'Copy to My Tokens',
                    callback: function(itemKey, opt, originalEvent) {
                        let itemToPlace = find_sidebar_list_item(opt.$trigger);
                        create_token_copy_inside(itemToPlace, rowItem.isTypeOpen5eMonster());
                    }
                }
            }
            if(rowItem.isTypeMyToken() || rowItem.isTypeBuiltinToken() || rowItem.isTypeDDBToken()){
                menuItems["duplicateMyToken"] = {
                    name: rowItem.isTypeMyToken()  ? 'Duplicate' : 'Copy to My Tokens',
                    callback: function(itemKey, opt, originalEvent) {
                        let itemToPlace = find_sidebar_list_item(opt.$trigger);
                        duplicate_my_token(itemToPlace);
                    }
                }
            }
            if(rowItem.isTypeFolder() || rowItem.isTypePC() || rowItem.isTypeEncounter()){
                menuItems["border"] = "---";

                menuItems['Hide/Reveal'] = {
                    name: (window.hiddenFolderItems.indexOf(rowItem.id) > -1) ? "Reveal in menu" : "Hide in menu",
                    callback: function(itemKey, opt, originalEvent) {
                        let itemToHide = find_sidebar_list_item(opt.$trigger);
                    
                        const index = window.hiddenFolderItems.indexOf(itemToHide.id);
                        if (index > -1) { 
                            window.hiddenFolderItems.splice(index, 1); 
                        }
                        else{
                            window.hiddenFolderItems.push(itemToHide.id);
                        }
                           
                        localStorage.setItem(`${window.gameId}.hiddenFolderItems`, JSON.stringify(window.hiddenFolderItems));
                        let buttonClicked = $('.temporary-visible').length>0;
                        redraw_token_list($('[name="token-search"]').val());
                        if(buttonClicked){
                            $('.sidebar-panel-body .hidden-sidebar-item').toggleClass('temporary-visible', true);
                        }
                    }
                }
            }

            if (rowItem.canDelete()) {

                if((!rowItem.isTypeFolder() && !rowItem.isTypeEncounter()))
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
 * Creates an "Encounter" folder within another "Encounter" folder
 * @param listItem {SidebarListItem} The folder to create a new folder within
 */
function create_encounter_folder_inside(listItem) {
    if (!listItem.isTypeFolder() || !listItem.fullPath().startsWith(RootFolder.Encounters.path)) {
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
    let newFolder = TokenCustomization.Folder(uuid(), listItem.id, RootFolder.Encounters.id, { name: newFolderName });
    persist_token_customization(newFolder, function(didSucceed, errorType) {
        if (didSucceed) {
                did_change_mytokens_items();
                let newListItem = window.tokenListItems.find(li => li.type === ItemType.Folder && li.id === newFolder.id);
                display_folder_configure_modal(newListItem);
                expand_all_folders_up_to_item(newListItem);
        } else {
            showError(errorType, "create_mytoken_folder_inside failed to create a new folder");
        }
    });
}
/**
 * Creates a "Players" folder within another "Players" folder
 * @param listItem {SidebarListItem} The folder to create a new folder within
 */
function create_player_folder_inside(listItem) {
    if (!listItem.isTypeFolder() || !listItem.fullPath().startsWith(RootFolder.Players.path)) {
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
    let newFolder = TokenCustomization.Folder(uuid(), listItem.id, RootFolder.Players.id, { name: newFolderName });
    persist_token_customization(newFolder, function(didSucceed, errorType) {
        if (didSucceed) {
                did_change_mytokens_items();
                let newListItem = window.tokenListItems.find(li => li.type === ItemType.Folder && li.id === newFolder.id);
                display_folder_configure_modal(newListItem);
                expand_all_folders_up_to_item(newListItem);
        } else {
            showError(errorType, "create_mytoken_folder_inside failed to create a new folder");
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
            showError(errorType, "create_mytoken_folder_inside failed to create a new folder");
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
                    showError(deletedFolderErrorType, "delete_mytokens_folder_and_everything_in_it failed to delete the folder with id", listItem.id);
                }
            });
        } else {
            did_change_mytokens_items();
            expand_all_folders_up_to_item(listItem);
            showError(deletedChildrenErrorType, "delete_mytokens_within_folder failed to delete token customizations");
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
            showError(errorType, "move_mytokens_to_parent_folder_and_delete_folder failed to move all items out of", listItem.id);
        }
        callback(didSucceed, errorType);
    });
}

/**
 * Creates a new "My Token" object within a folder
 * @param listItem {SidebarListItem} the folder item to create a token in
 */
function create_token_inside(listItem, tokenName = "New Token", tokenImage = '', type='', options = undefined, statBlock = undefined) {
    if (!listItem.isTypeFolder() || !listItem.fullPath().startsWith(RootFolder.MyTokens.path)) {
        console.warn("create_token_inside called with an incorrect item type", listItem);
        return;
    }

    let newTokenName = tokenName;
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
        { name: newTokenName,
          alternativeImages: tokenImage != '' ? [tokenImage] : []
        },
    );

    if(['.mp4', '.webm', '.m4v'].some(d => type.includes(d))){
        customization.tokenOptions.videoToken = true;
    }
    if(options != undefined){
        customization.tokenOptions = {
            ...customization.tokenOptions,
            ...options,
            alternativeImages: options.alternativeImages?.length > 0 ? options.alternativeImages : options.imgsrc != '' ? [options.imgsrc] : []
        }
    }

    if(statBlock != undefined){
        window.JOURNAL.notes[customization.id] = {
            id: customization.id,
            plain: statBlock,
            player: true,
            statBlock: true,
            text: statBlock
        };
        window.JOURNAL.persist();
        customization.tokenOptions.statBlock = customization.id;
    }

    persist_token_customization(customization, function (didSucceed, error) {
        console.log("create_token_inside created a new item", customization);
        did_change_mytokens_items();
        const newItem = window.tokenListItems.find(li => li.type === ItemType.MyToken && li.id === customization.id);
        if (didSucceed && newItem) {
            if(tokenImage == ''){
                display_token_configuration_modal(newItem);
            } 
        } else {    
            showError(error, "Failed to create My Token", customization);
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
    let customization;
    try {
        customization = find_or_create_token_customization(listItem.type, listItem.id, RootFolder.Monsters.id, RootFolder.Monsters.id);
    } catch (error) {
        showError(error, "display_token_configuration_modal failed to create a customization object for listItem:", listItem);
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
        // token options override
    let tokenOptionsButton = build_override_token_options_button(sidebarPanel, listItem, placedToken, customization.tokenOptions, function(name, value) {
        customization.setTokenOption(name, value);
    }, function () {
        display_aoe_token_configuration_modal(listItem, placedToken);
        persist_token_customization(customization);
    });

    sidebarPanel.inputWrapper.append(tokenOptionsButton);
    sidebarPanel.inputWrapper.append(`<br />`);
    redraw_token_images_in_modal(sidebarPanel, listItem, placedToken);
}

/**
 * presents a SidebarPanel modal for configuring the given item
 * @param listItem {SidebarListItem} the item to configure
 * @param placedToken {undefined|Token} the token object that is on the scene
 */
 function display_token_configuration_modal(listItem, placedToken, selectedTokenImage, redrawPanel) {
    switch (listItem?.type) {
        case ItemType.MyToken:
        case ItemType.Monster:
        case ItemType.Open5e:
        case ItemType.BuiltinToken:
        case ItemType.DDBToken:
        case ItemType.PC:
            break;
        default:
            console.warn("display_token_configuration_modal was called with incorrect item type", listItem);
            return;
    }

    let customization;
    try {
        let rootId = RootFolder.allValues().find(d => listItem.folderPath.includes(d.path) && d.name != '')?.id;
        customization = find_or_create_token_customization(listItem.type, listItem.id, listItem.parentId, rootId);
    } catch (error) {
        showError(error, "display_token_configuration_modal failed to create a customization object for listItem:", listItem);
        return;
    }

    customization.parentId = listItem.parentId;
    listItem.rootId = listItem.rootId;
    // close any that are already open just to be safe
    let sidebarPanel;
    if(!selectedTokenImage && !redrawPanel){ // we just want to redraw the panel options not the images since we selected a token image to edit
        close_sidebar_modal();
        sidebarPanel = new SidebarPanel("token-configuration-modal");
        display_sidebar_modal(sidebarPanel);
        let name = listItem.name;

        sidebarPanel.updateHeader(name, "", "When placing tokens, one of these images will be chosen at random. Right-click an image for more options.");
        redraw_token_images_in_modal(sidebarPanel, listItem, placedToken, undefined, selectedTokenImage);
    
        // add a "remove all" button between the body and the footer
        if(!listItem?.isTypeBuiltinToken() && !listItem?.isTypeDDBToken()){
            let removeAllButton = build_remove_all_images_button(sidebarPanel, listItem, placedToken);
            sidebarPanel.body.after(removeAllButton);
            if (alternative_images_for_item(listItem).length === 0) {
                $('#token-configuration-modal .token-image-modal-remove-all-button').hide();
            }
        }

    }
    else{
        sidebarPanel = redrawPanel;
    }
   
     let targetOptions = customization.tokenOptions;
    if(selectedTokenImage){
        if(customization.tokenOptions.alternativeImagesCustomizations == undefined)
            customization.tokenOptions.alternativeImagesCustomizations = {};
        targetOptions = {
            ...customization.tokenOptions,
            ...customization.tokenOptions.alternativeImagesCustomizations[selectedTokenImage]
        }
    }

    let inputWrapper = sidebarPanel.inputWrapper;
    inputWrapper.empty();

    // we want this as a function so we can easily update the label as the user adds/removes images
    const determineLabelText = function() {
        if (alternative_images_for_item(listItem).length === 0) {
            return "Replace The Default Image";
        } else {
            return "Add More Custom Images";
        }
    }
    const debounceRedrawToken = mydebounce((sidebarPanel, listItem, placedToken) => {
        redraw_token_images_in_modal(sidebarPanel, listItem, placedToken);
    }, 100)
    // images
    let addImageUrl = async function (newImageUrl, type='') {
        const redraw = await customization.alternativeImages().length === 0;  // if it's the first custom image we need to redraw the entire body; else we can just append new ones
        const didAdd = await customization.addAlternativeImage(newImageUrl);
        if (!didAdd) {
            return; // no need to do anything if the image wasn't added. This can happen if they accidentally hit enter a few times which would try to add the same url multiple times
        }
        if(listItem.type == ItemType.PC ){
            const id = customization.tokenOptions.id;
            let token = window.all_token_objects[id]
            if (token)
                window.all_token_objects[id].options.alternativeImages = customization.tokenOptions.alternativeImages;
           
            token = window.TOKEN_OBJECTS[id]
            if (token){
                token.options.alternativeImages = customization.tokenOptions.alternativeImages;
                token.sync($.extend(true, {}, window.TOKEN_OBJECTS[id].options))
            }
        }
        if(['.mp4', '.webm', '.m4v'].some(d => type.includes(d))){
            customization.tokenOptions.videoToken = true;
        }
        persist_token_customization(customization);
        if (redraw) {
            debounceRedrawToken(sidebarPanel, listItem, placedToken);
            let listingImage = (customization.tokenOptions?.alternativeImages && customization.tokenOptions?.alternativeImages[0] != undefined) ? customization.tokenOptions?.alternativeImages[0] : listItem.image;     
           

            let rowImage;
            let alt = $(`.sidebar-list-item-row[id='${listItem.id}'] .token-image`).attr('alt')
            let video = false;
            if(customization?.tokenOptions?.videoToken == true || (['.mp4', '.webm', '.m4v'].some(d => newImageUrl.includes(d)))){
                rowImage = $(`<video disableRemotePlayback muted loading='lazy' class='token-image video-listing' alt='${alt}'>`);
                video = true;
            } 
            else{
                rowImage = $(`<img loading='lazy' class='token-image' alt='${alt}'>`);
            }      
            $(`.sidebar-list-item-row[id='${listItem.id}'] .token-image`).replaceWith(rowImage);
            updateTokenSrc(newImageUrl, rowImage, video);
        } else {
            sidebarPanel.body.append(build_token_div_for_sidebar_modal(newImageUrl, listItem, placedToken));
        }
        $('#token-configuration-modal .token-image-modal-remove-all-button').show();
        inputWrapper.find(".token-image-modal-url-label-add-wrapper > .token-image-modal-url-label-wrapper > .token-image-modal-footer-title").text(determineLabelText());
    };

    // MyToken name input handler
    const rename = async function(newName) {
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

    if(!listItem?.isTypeBuiltinToken() && !listItem?.isTypeDDBToken()){
        let imageUrlInput = sidebarPanel.build_image_url_input(determineLabelText(), addImageUrl);
        inputWrapper.append(imageUrlInput);
        const dropboxOptions = dropBoxOptions(function(links){
            for(let i = 0; i<links.length; i++){
               addImageUrl(links[i].link)
            }
        }, true);
        const dropboxButton = createCustomDropboxChooser('', dropboxOptions);
        const oneDriveButton = createCustomOnedriveChooser('', function(links){
            for(let i = 0; i<links.length; i++){
               addImageUrl(links[i].link, links[i].type)
            }    
        }, 'multiple')
        dropboxButton.toggleClass('token-row-button', true);
        oneDriveButton.toggleClass('token-row-button', true);
        inputWrapper.append(dropboxButton, oneDriveButton);
    }



    if(!listItem?.isTypeBuiltinToken() && !listItem?.isTypeDDBToken()){
        const videoTokenSetting = {
            name: "videoToken",
            label: "Video Token",
            type: 'toggle',
            options: [
                { value: true, label: 'Enabled', description: "Token is using a video file for an image. Use this if the URL does not have the file extention at the end (webm, mp4, m4v, etc.)." },
                { value: false, label: 'Disabled', description: "The Token is using an image file for it's image (png, jpg, gif, etc.)" }
            ],
            defaultValue: false
        };
        const isVideoToken = (customization?.tokenOptions?.videoToken === true);
        const videoToggle =  build_toggle_input(videoTokenSetting, isVideoToken, function (isVideoKey, isVideoValue) {
            customization.setTokenOption(isVideoKey, isVideoValue);
            persist_token_customization(customization);     
            redraw_token_images_in_modal(sidebarPanel, listItem, placedToken);
            
            let rowImage;
            let alt = $(`.sidebar-list-item-row[id='${listItem.id}'] .token-image`).attr('alt')
            let listingImage = (customization.tokenOptions?.alternativeImages && customization.tokenOptions?.alternativeImages[0] != undefined) ? customization.tokenOptions?.alternativeImages[0] : listItem.image;
            
            let video=false;
            if(isVideoValue || (['.mp4', '.webm', '.m4v'].some(d => listingImage.includes(d)))){
                rowImage = $(`<video disableRemotePlayback muted loading='lazy' class='token-image video-listing' alt='${alt}'>`);
                video = true;
            } 
            else{
                rowImage = $(`<img loading='lazy' class='token-image' alt='${alt}'>`);
            }      
            $(`.sidebar-list-item-row[id='${listItem.id}'] .token-image`).replaceWith(rowImage);         
            updateTokenSrc(listingImage, rowImage, video);
        });
        inputWrapper.append(videoToggle);
    }



    if(!listItem.isTypePC()){
        let has_note = (customization.id in window.JOURNAL.notes);

        let editNoteButton = $(`<button class="custom-stat-buttons icon-note material-icons">
                <span style='font-family:Roboto,Open Sans,Helvetica,sans-serif;'>
                    Create Custom Statblock
                </span>
            </button>`)
        if(has_note){
            let viewNoteButton = $(`<button class="custom-stat-buttons icon-view-note material-icons"><span style='font-family:Roboto,Open Sans,Helvetica,sans-serif;'>View Custom Statblock</span></button>`)      
            let deleteNoteButton = $(`<button class="custom-stat-buttons icon-note-delete material-icons"><span style='font-family:Roboto,Open Sans,Helvetica,sans-serif;'>Delete Custom Statblock</span></button>`)
            editNoteButton = $(`<button class="custom-stat-buttons icon-note material-icons"><span style='font-family:Roboto,Open Sans,Helvetica,sans-serif;'>Edit Custom Statblock</span></button>`)
            inputWrapper.append(viewNoteButton);
            inputWrapper.append(editNoteButton);        
            inputWrapper.append(deleteNoteButton);  
            viewNoteButton.off().on("click", function(){
                window.JOURNAL.display_note(customization.id, true);
            });
            deleteNoteButton.off().on("click", function(){
                if (window.confirm(`Are you sure you want to delete this custom statblock?`)) {
                    if(customization.id in window.JOURNAL.notes){
                        delete window.JOURNAL.notes[customization.id];
                        window.JOURNAL.persist();
                    }
                    delete customization.tokenOptions.statBlock; 
                    persist_token_customization(customization);
                    display_token_configuration_modal(listItem, placedToken)
                }
            });
        }
        else {
            inputWrapper.append(editNoteButton);
        }

        editNoteButton.off().on("click", function(){
            if (!(customization.id in window.JOURNAL.notes)) {
                window.JOURNAL.notes[customization.id] = {
                    title: customization.tokenOptions.name,
                    text: '',
                    plain: '',
                    player: true
                }     
            }
            if(customization.tokenOptions.statBlock != customization.id){
                customization.tokenOptions.statBlock = customization.id;
                persist_token_customization(customization);
                display_token_configuration_modal(listItem, placedToken);
            }
            window.JOURNAL.edit_note(customization.id, true);
        });
    }
   
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
        tokenSizes.push(token_size_for_item(listItem, selectedTokenImage))
    }
    let tokenSizeInput = build_token_size_input(tokenSizes, function (newSize) {
        customization.setTokenOption("tokenSize", newSize);
        persist_token_customization(customization);
        decorate_modal_images(sidebarPanel, listItem, placedToken);
    });
    inputWrapper.append(tokenSizeInput);

    // image scale
    let startingScale = targetOptions.imageSize || 1;
    let imageScaleWrapper = build_token_image_scale_input(startingScale, false, function (imageSize) {
        customization.setTokenOption("imageSize", imageSize);
        persist_token_customization(customization);
        decorate_modal_images(sidebarPanel, listItem, placedToken);
    });
    inputWrapper.append(imageScaleWrapper);

    let startingOffsetX = targetOptions.offset?.x || 0;
    let offsetXWrapper = build_token_num_input(startingOffsetX, false, 'Image Offset X', "", "", 1, function (offsetX) {

        if(targetOptions.offset == undefined)
            customization.setTokenOption('offset', {x: 0, y: 0})
        customization.setTokenOption('offset.x', offsetX)
        persist_token_customization(customization);
        decorate_modal_images(sidebarPanel, listItem, placedToken);
    });
    inputWrapper.append(offsetXWrapper);

    let startingOffsetY = targetOptions.offset?.y || 0;
    let offsetYWrapper = build_token_num_input(startingOffsetY, false, 'Image Offset Y', "", "", 1, function (offsetY) {
        if(targetOptions.offset == undefined)
            customization.setTokenOption('offset', {x: 0, y: 0})
        customization.setTokenOption('offset.y', offsetY)
        persist_token_customization(customization);
        decorate_modal_images(sidebarPanel, listItem, placedToken);
    });
    inputWrapper.append(offsetYWrapper);


    let startingImageZoom = targetOptions.imageZoom || 0;
    let imageZoomWrapper = build_token_num_input(startingImageZoom, false, 'Image Zoom %', -100, '', 5, function (imageZoom) { 
        customization.setTokenOption("imageZoom", imageZoom);
        persist_token_customization(customization);
        decorate_modal_images(sidebarPanel, listItem, placedToken);  
    });
    inputWrapper.append(imageZoomWrapper);

    let startingOpacity = targetOptions.imageOpacity || 1;
    let opacityWrapper = build_token_num_input(startingOpacity, tokens,  'Image Opacity', 0, 1, 0.1, function (opacity) {
        customization.setTokenOption("imageOpacity", opacity);
        persist_token_customization(customization);
        decorate_modal_images(sidebarPanel, listItem, placedToken);
    });
    inputWrapper.append(opacityWrapper);

    // border color
    if(listItem.isTypePC() && targetOptions.playerThemeBorder != false){
        customization.setTokenOption('color', color_from_pc_object(find_pc_by_player_id(listItem.id)));
    }

    const color = targetOptions.color || random_token_color();
    const borderColorWrapper = build_token_border_color_input(color, function (newColor, eventType) {
        customization.setTokenOption("color", newColor);
        persist_token_customization(customization);
        decorate_modal_images(sidebarPanel, listItem, placedToken);
    });
    borderColorWrapper.removeClass("border-color-wrapper"); // sets display:block!important; but we want to be able to hide this one

    const specificBorderColorValue = (typeof targetOptions.color === "string" && targetOptions.color.length > 0);
    if(listItem.isTypePC()){
        const playerThemeColorSetting = {
            name: 'playerThemeBorderColor',
            label: 'Player Border Color',
            type: 'dropdown',
            options: [
                { value: true, label: "Player Theme Color", description: "The token will use the player theme color." },
                { value: false, label: "Custom Color", description: "The token will use a specified border color." }
            ],
            defaultValue: true
        };
        const borderColorDropdown = build_dropdown_input(playerThemeColorSetting, specificBorderColorValue, function (useSpecificColorKey, newValue) {
            customization.setTokenOption("playerThemeBorder", newValue)
            if (newValue == 'true') {
                customization.setTokenOption("color", color_from_pc_object(find_pc_by_player_id(listItem.id)));
                persist_token_customization(customization);
                borderColorWrapper.hide();
                redraw_settings_panel_token_examples(customization.tokenOptions);
                decorate_modal_images(sidebarPanel, listItem, placedToken);
            } else {
                customization.setTokenOption("color", color);
                persist_token_customization(customization);
                borderColorWrapper.show();
            }
        });
        inputWrapper.append(borderColorDropdown);
    }
    else{
        const specificBorderColorSetting = {
            name: 'specificBorderColor',
            label: 'Specify Border Color',
            type: 'toggle',
            options: [
                { value: true, label: "Specific Color", description: "The token will use the specified color." },
                { value: false, label: "Round", description: "The token will use a random border color." }
            ],
            defaultValue: false
        };

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
    }

    inputWrapper.append(borderColorWrapper);
    if (!specificBorderColorValue || (listItem.isTypePC() && targetOptions.playerThemeBorder != false)) {
        borderColorWrapper.hide();
    }

    if(customization.tokenOptions.vision?.feet == undefined){
        if(listItem.isTypePC()){
            let pcData = find_pc_by_player_id(listItem.id);
            let darkvision = 0;
            if(pcData.senses.length > 0)
            {
                for(let i=0; i < pcData.senses.length; i++){
                    const ftPosition = pcData.senses[i].distance.indexOf('ft.');
                    const range = parseInt(pcData.senses[i].distance.slice(0, ftPosition));
                    if(range > darkvision)
                        darkvision = range;
                }
            }
            customization.tokenOptions.vision = {
                feet: darkvision.toString(),
                color: window.TOKEN_SETTINGS?.vision?.color ? window.TOKEN_SETTINGS?.vision?.color : 'rgba(142, 142, 142, 1)'
            }
        }
        else if(listItem.isTypeMonster() || listItem.isTypeOpen5eMonster()){
            let darkvision = 0;
            if(listItem.monsterData.senses.length > 0)
            {
                for(let i=0; i < listItem.monsterData.senses.length; i++){
                    const ftPosition = listItem.monsterData.senses[i].notes.indexOf('ft.')
                    const range = parseInt(listItem.monsterData.senses[i].notes.slice(0, ftPosition));
                    if(range > darkvision)
                        darkvision = range;
                }
            }

            customization.tokenOptions.vision = {
                feet: darkvision.toString(),
                color: window.TOKEN_SETTINGS?.vision?.color ? window.TOKEN_SETTINGS?.vision?.color : 'rgba(142, 142, 142, 1)'
            }
        }
        else{
            customization.tokenOptions.vision = {
                feet: '60',
                color: window.TOKEN_SETTINGS?.vision?.color ? window.TOKEN_SETTINGS?.vision?.color : 'rgba(142, 142, 142, 1)'
            }
        }
    }
    if(customization.tokenOptions.light1?.feet == undefined){
        customization.tokenOptions.light1 = {
            feet: '0',
            color: window.TOKEN_SETTINGS?.light1?.color ? window.TOKEN_SETTINGS?.light1?.color : 'rgba(255, 255, 255, 1)'
        }
    }
    if(customization.tokenOptions.light2?.feet == undefined){
        customization.tokenOptions.light2 = {
            feet: '0',
            color: window.TOKEN_SETTINGS?.light2?.color ? window.TOKEN_SETTINGS?.light2?.color : 'rgba(142, 142, 142, 1)'
        }
    }


    let uniqueVisionFeet = customization.tokenOptions.vision.feet;
    let uniqueVisionColor = customization.tokenOptions.vision.color;
    let uniqueLight1Feet = customization.tokenOptions.light1.feet;
    let uniqueLight2Feet = customization.tokenOptions.light2.feet;
    let uniqueLight1Color = customization.tokenOptions.light1.color;
    let uniqueLight2Color = customization.tokenOptions.light2.color;

    const lightOption = {
    name: "auraislight",
    label: "Enable Token Vision/Light",
    type: "toggle",
    options: [
        { value: true, label: "Enable", description: "Token has light/vision." },
        { value: false, label: "Disable", description: "Token has no light/vision." }
    ],
    defaultValue: false
    };
    let auraIsLightEnabled = (customization.tokenOptions.auraislight != undefined) ? customization.tokenOptions.auraislight : true;
    let enabledLightInput = build_toggle_input( lightOption, auraIsLightEnabled, function(name, newValue) {
        console.log(`${name} setting is now ${newValue}`);
        customization.setTokenOption("auraislight", newValue);
        persist_token_customization(customization);
        if (newValue) {
            inputWrapper.find(".token-config-aura-wrapper.light").show();
        } else {
            inputWrapper.find(".token-config-aura-wrapper.light").hide();
        }
    });
   
    inputWrapper.append(enabledLightInput);


    let lightInputs = `<div class="token-config-aura-wrapper light"><div class="menu-vision-aura">
                    <h3 style="margin-bottom:0px;">Darkvision</h3>
                    <div class="token-image-modal-footer-select-wrapper" style="padding-left: 2px">
                        <div class="token-image-modal-footer-title">Radius (${window.CURRENT_SCENE_DATA.upsq})</div>
                        <input class="vision-radius" name="vision" type="text" value="${uniqueVisionFeet}" style="width: 3rem" />
                    </div>
                    <div class="token-image-modal-footer-select-wrapper" style="padding-left: 2px">
                        <div class="token-image-modal-footer-title">Color</div>
                        <input class="spectrum" name="visionColor" value="${uniqueVisionColor}" >
                    </div>
                </div>
                <div class="menu-inner-aura">
                    <h3 style="margin-bottom:0px;">Inner Light</h3>
                    <div class="token-image-modal-footer-select-wrapper" style="padding-left: 2px">
                        <div class="token-image-modal-footer-title">Radius (${window.CURRENT_SCENE_DATA.upsq})</div>
                        <input class="light-radius" name="light1" type="text" value="${uniqueLight1Feet}" style="width: 3rem" />
                    </div>
                    <div class="token-image-modal-footer-select-wrapper" style="padding-left: 2px">
                        <div class="token-image-modal-footer-title">Color</div>
                        <input class="spectrum" name="light1Color" value="${uniqueLight1Color}" >
                    </div>
                </div>
                <div class="menu-outer-aura">
                    <h3 style="margin-bottom:0px;">Outer Light</h3>
                    <div class="token-image-modal-footer-select-wrapper" style="padding-left: 2px">
                        <div class="token-image-modal-footer-title">Radius (${window.CURRENT_SCENE_DATA.upsq})</div>
                        <input class="light-radius" name="light2" type="text" value="${uniqueLight2Feet}" style="width: 3rem" />
                    </div>
                    <div class="token-image-modal-footer-select-wrapper" style="padding-left: 2px">
                        <div class="token-image-modal-footer-title">Color</div>
                        <input class="spectrum" name="light2Color" value="${uniqueLight2Color}" >
                    </div>
                </div></div>`;

    inputWrapper.append(lightInputs);



    const revealvisionOption = {
        name: "share_vision",
        label: "Share vision",
        type: "toggle",
        options: [
            { value: false, label: "Disabled", description: "Token vision is not shared." },
            { value: true, label: "All Players", description: "Token vision is shared with all players." },
        ],
        defaultValue: false
    };
    let auraRevealVisionEnabled = (customization.tokenOptions.share_vision != undefined) ? customization.tokenOptions.share_vision : false;
    for(let i=0; i<window.playerUsers.length; i++){
        if(!revealvisionOption.options.some(d => d.value == window.playerUsers[i].userId)){
            let option = {value: window.playerUsers[i].userId, label: window.playerUsers[i].userName, desciption: `Token vision is shared with ${window.playerUsers[i].userName}`};
            revealvisionOption.options.push(option);
        }

    }
    let revealVisionInput = build_dropdown_input(revealvisionOption, auraRevealVisionEnabled, function(name, newValue) {
        customization.setTokenOption(name, newValue);
        persist_token_customization(customization); 
    });



    inputWrapper.find(".token-config-aura-wrapper.light").prepend(revealVisionInput);
    

    inputWrapper.find("h3.token-image-modal-footer-title").after(enabledLightInput);
    if (auraIsLightEnabled) {
        inputWrapper.find(".token-config-aura-wrapper.light").show();
    } else {
        inputWrapper.find(".token-config-aura-wrapper.light").hide();
    }

    let radiusInputs = inputWrapper.find('input.light-radius, input.vision-radius');
    radiusInputs.on('keyup', function(event) {
        let newRadius = event.target.value;
        if (event.key == "Enter" && newRadius !== undefined && newRadius.length > 0) {  
            customization.setTokenOption(`${event.target.name}.feet`, newRadius)
            persist_token_customization(customization);
        }
    });
    radiusInputs.on('focusout', function(event) {
        let newRadius = event.target.value;
        if (newRadius !== undefined && newRadius.length > 0) {
            customization.setTokenOption(`${event.target.name}.feet`, newRadius)
            persist_token_customization(customization);
        }
    });


    if(customization.tokenOptions.aura1?.feet == undefined){
        customization.tokenOptions.aura1 = {
            feet: '0',
            color: window.TOKEN_SETTINGS?.aura1?.color ? window.TOKEN_SETTINGS?.aura1?.color : 'rgba(255, 255, 100, 0.5)'
        }
    }
    if(customization.tokenOptions.aura2?.feet == undefined){
        customization.tokenOptions.aura2 = {
            feet: '0',
            color: window.TOKEN_SETTINGS?.aura2?.color ? window.TOKEN_SETTINGS?.aura2?.color : 'rgba(255, 255, 100, 0.5)'
        }
    }


    let uniqueAura1Feet = customization.tokenOptions.aura1.feet;
    let uniqueAura2Feet = customization.tokenOptions.aura2.feet;
    let uniqueAura1Color = customization.tokenOptions.aura1.color;
    let uniqueAura2Color = customization.tokenOptions.aura2.color;

    const auraOption = {
        name: "auraVisible",
        label: "Enable Token Auras",
        type: "toggle",
        options: [
            { value: true, label: "Visible", description: "Token Auras are visible." },
            { value: false, label: "Hidden", description: "Token Auras are hidden." }
        ],
        defaultValue: false
    };
    let auraIsEnabled = (customization.tokenOptions.auraVisible != undefined) ? customization.tokenOptions.auraVisible : false;
    let enabledAuraInput = build_toggle_input( auraOption, auraIsEnabled, function(name, newValue) {
        console.log(`${name} setting is now ${newValue}`);
        customization.setTokenOption("auraVisible", newValue);
        persist_token_customization(customization);
        if (newValue) {
            inputWrapper.find(".token-config-aura-wrapper.aura").show();
        } else {
            inputWrapper.find(".token-config-aura-wrapper.aura").hide();
        }
    });
   
    inputWrapper.append(enabledAuraInput);
      let auraInputs = `
        <div class="token-config-aura-wrapper aura">
            <div class="menu-inner-aura">
                <h3 style="margin-bottom:0px;">Inner Aura</h3>
                <div class="token-image-modal-footer-select-wrapper" style="padding-left: 2px">
                    <div class="token-image-modal-footer-title">Radius (${window.CURRENT_SCENE_DATA.upsq})</div>
                    <input class="aura-radius" name="aura1" type="text" value="${uniqueAura1Feet}" style="width: 3rem" />
                </div>
                <div class="token-image-modal-footer-select-wrapper" style="padding-left: 2px">
                    <div class="token-image-modal-footer-title">Color</div>
                    <input class="spectrum" name="aura1Color" value="${uniqueAura1Color}" >
                </div>
            </div>
            <div class="menu-outer-aura">
                <h3 style="margin-bottom:0px;">Outer Aura</h3>
                <div class="token-image-modal-footer-select-wrapper" style="padding-left: 2px">
                    <div class="token-image-modal-footer-title">Radius (${window.CURRENT_SCENE_DATA.upsq})</div>
                    <input class="aura-radius" name="aura2" type="text" value="${uniqueAura2Feet}" style="width: 3rem" />
                </div>
                <div class="token-image-modal-footer-select-wrapper" style="padding-left: 2px">
                    <div class="token-image-modal-footer-title">Color</div>
                    <input class="spectrum" name="aura2Color" value="${uniqueAura2Color}" >
                </div>
            </div>
        </div>`;

       inputWrapper.append(auraInputs);


    inputWrapper.find("h3.token-image-modal-footer-title").after(enabledAuraInput);
    if (auraIsEnabled) {
        inputWrapper.find(".token-config-aura-wrapper.aura").show();
    } else {
        inputWrapper.find(".token-config-aura-wrapper.aura").hide();
    }

    let auraRadiusInputs = inputWrapper.find('input.aura-radius');
    auraRadiusInputs.on('keyup', function(event) {
        let newRadius = event.target.value;
        if (event.key == "Enter" && newRadius !== undefined && newRadius.length > 0) {
            customization.setTokenOption(`${event.target.name}.feet`, newRadius)
            persist_token_customization(customization);
        }
    });
    auraRadiusInputs.on('focusout', function(event) {
        let newRadius = event.target.value;
        if (newRadius !== undefined && newRadius.length > 0) {
            customization.setTokenOption(`${event.target.name}.feet`, newRadius)
            persist_token_customization(customization);
        }
    });

    let colorPickers = inputWrapper.find('input.spectrum');
    colorPickers.spectrum({
        type: "color",
        showInput: true,
        showInitial: true,
        containerClassName: 'prevent-sidebar-modal-close',
        clickoutFiresChange: true,
        appendTo: "parent"
    });

    inputWrapper.find("input[name='aura1Color']").spectrum("set", uniqueAura1Color);
    inputWrapper.find("input[name='aura2Color']").spectrum("set", uniqueAura2Color);
    inputWrapper.find("input[name='light1Color']").spectrum("set", uniqueLight1Color);
    inputWrapper.find("input[name='light2Color']").spectrum("set", uniqueLight2Color);
    const colorPickerChange = function(e, tinycolor) {
        let auraName = e.target.name.replace("Color", "");
        let color = `rgba(${tinycolor._r}, ${tinycolor._g}, ${tinycolor._b}, ${tinycolor._a})`;
        console.log(auraName, e, tinycolor);
        customization.setTokenOption(`${auraName}.color`, color)
        persist_token_customization(customization);
        
    };
    colorPickers.on('dragstop.spectrum', colorPickerChange);   // update the token as the player messes around with colors
    colorPickers.on('change.spectrum', colorPickerChange); // commit the changes when the user clicks the submit button
    colorPickers.on('hide.spectrum', colorPickerChange);   // the hide event includes the original color so let's change it back when we get it



    // token options override
    let tokenOptionsButton = build_override_token_options_button(sidebarPanel, listItem, placedToken, targetOptions, function(name, value) {
        customization.setTokenOption(name, value);
    }, function () {
        let visionInput = $("input[name='visionColor']").spectrum("get");
        let light1Input = $("input[name='light1Color']").spectrum("get");
        let light2Input = $("input[name='light2Color']").spectrum("get");
        customization.setTokenOption('vision.color', `rgba(${visionInput._r}, ${visionInput._g}, ${visionInput._b}, ${visionInput._a})`);
        customization.setTokenOption(`light1.color`, `rgba(${light1Input._r}, ${light1Input._g}, ${light1Input._b}, ${light1Input._a})`);
        customization.setTokenOption(`light2.color`, `rgba(${light2Input._r}, ${light2Input._g}, ${light2Input._b}, ${light2Input._a})`);

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
            const options = find_token_customization(listItem.type, listItem.id)?.tokenOptions;
            const overrideOptions = listItem.isTypeAoe() ? 
                token_setting_options().filter(option=> availableToAoe.includes(option.name))
                 .map(option => convert_option_to_override_dropdown(option)) 
                : (listItem.type === ItemType.PC || listItem.folderType === ItemType.PC)
                ? token_setting_options().filter(option => !['player_owned'].includes(option.name)).map(option => convert_option_to_override_dropdown(option))
                : token_setting_options().map(option => convert_option_to_override_dropdown(option));
            let optionsContainer = build_sidebar_token_options_flyout(overrideOptions, options, function(name, value) {
                updateValue(name, value);
            }, didChange);
            optionsContainer.prepend(`<div class="sidebar-panel-header-explanation">Every time you place this token on the scene, these settings will be used. Setting the value to "Default" will use the global settings which are found in the settings tab.</div>`);
            flyout.append(optionsContainer);
            position_flyout_left_of(sidebarPanel.container, flyout);
            if(!listItem.isTypeAoe()){
                redraw_settings_panel_token_examples(options);
                decorate_modal_images(sidebarPanel, listItem, placedToken);
            }

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
    if(options.alternativeImagesCustomizations != undefined && options.alternativeImagesCustomizations[parsedImage] != undefined){
        options = {
            ...options,
            ...options.alternativeImagesCustomizations[parsedImage]
        }
    }

    let tokenDiv = build_alternative_image_for_modal(parsedImage, options, placedToken, listItem);
    if (placedToken?.isMonster()) {
        tokenDiv.attr("data-monster", placedToken.options.monster);
    }
    set_list_item_identifier(tokenDiv, listItem);
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
function redraw_token_images_in_modal(sidebarPanel, listItem, placedToken, drawInline = false, selectedTokenImage) {
    if (sidebarPanel === undefined) {
        console.warn("redraw_token_images_in_modal was called without a sidebarPanel");
        return;
    }
    if (listItem === undefined && placedToken === undefined) {
        console.warn("redraw_token_images_in_modal was called without proper items");
        return;
    }
    let currentlySelectedToken = $('.example-token.selected .div-token-image')?.attr('src');
    let modalBody = sidebarPanel.body
    modalBody.empty();
    modalBody.off('click.select').on('click.select', function(e){
        $('.example-token')?.toggleClass('selected', false);
        if($(e.target).closest('.example-token').length > 0){
            $(e.target).closest('.example-token')?.toggleClass('selected', true);
        } 
        let src = $(e.target).closest('.example-token')?.find('.div-token-image')?.attr('src');

        display_token_configuration_modal(listItem, placedToken, src, sidebarPanel)
    })
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
        if((currentlySelectedToken != undefined && tokenDiv.find('.div-token-image')?.attr('src') == currentlySelectedToken) || (selectedTokenImage != undefined && tokenDiv.find('.div-token-image')?.attr('src') == selectedTokenImage))
            tokenDiv.toggleClass('selected', true);
        modalBody.append(tokenDiv);
    }

    if (alternativeImages.length === 0 && placedImg !== parse_img(listItem?.image)) {
        // if we don't have any alternative images, show the default image
        if(listItem.type == 'pc'){
            const playerId = getPlayerIDFromSheet(listItem.sheet);
            const pc = find_pc_by_player_id(playerId, false)
            listItem.image = pc.image;
        }
        let tokenDiv = build_token_div_for_sidebar_modal(listItem?.image, listItem, placedToken);
        if((currentlySelectedToken != undefined && tokenDiv.find('.div-token-image')?.attr('src') == currentlySelectedToken) || (selectedTokenImage != undefined && tokenDiv.find('.div-token-image')?.attr('src') == selectedTokenImage))
            tokenDiv.toggleClass('selected', true);
        modalBody.append(tokenDiv);
    }
    if (listItem?.type === ItemType.Aoe) {
        const withoutDefault = get_available_styles().filter(aoeStyle => aoeStyle !== "Default")
        alternativeImages = withoutDefault.map(aoeStyle => {
          return `class=aoe-token-tileable aoe-style-${aoeStyle.toLowerCase()} aoe-shape-${listItem.shape}`
        })
    }

    function* addExampleToken(index) {
        
        while(index < index+8 && index<alternativeImages.length){
            setTimeout(function(){
                if(index < alternativeImages.length){
                    let tokenDiv = build_token_div_for_sidebar_modal(alternativeImages[index], listItem, placedToken);
                    if((currentlySelectedToken != undefined && tokenDiv.find('.div-token-image')?.attr('src') == currentlySelectedToken) || (selectedTokenImage != undefined && tokenDiv.find('.div-token-image')?.attr('src') == selectedTokenImage))
                        tokenDiv.toggleClass('selected', true);
                    modalBody.append(tokenDiv);
                    index++;
                }
            })
            yield
        }
       
    }
    let buildToken = addExampleToken(0);
    const debounceExampleToken = mydebounce(() => {
        if (modalBody.scrollTop() + 300 >=
            modalBody[0].scrollHeight) {
            for (let i = 0; i < 8; i++) {
                buildToken.next()
            }
        }
    }, 50)
    modalBody.off('scroll.exampleToken').on('scroll.exampleToken', debounceExampleToken);
    for (let i = 0; i < alternativeImages.length; i++) {
        if (drawInline) {
            let tokenDiv = build_token_div_for_sidebar_modal(alternativeImages[i], listItem, placedToken);
            modalBody.append(tokenDiv);
        } else {
            if(i<13){
                buildToken.next();
            }
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
    const options = find_token_options_for_list_item(listItem);
    let items = sidebarPanel.body.find(".example-token");
    for (let i = 0; i < items.length; i++) {
        let combinedOptions = options;
        let item = $(items[i]);
        let imgsrc = item.find(".div-token-image").attr("src");
        if(options.alternativeImagesCustomizations != undefined && options.alternativeImagesCustomizations[imgsrc] != undefined){
            combinedOptions = {
                ...options,
                ...options.alternativeImagesCustomizations[imgsrc]
            }
        }
        
        let tokenDiv = build_alternative_image_for_modal(imgsrc, combinedOptions, placedToken, listItem);
        if(item.hasClass('selected'))
            tokenDiv.addClass('selected');
        item.replaceWith(tokenDiv);
        set_list_item_identifier(tokenDiv, listItem);
        enable_draggable_token_creation(tokenDiv, imgsrc);
    }
}

/** writes mytokens and mytokensfolders to localStorage */
function persist_my_tokens() {
    // this hasn't been a thing for a long time so let's clean up old data if it exists
    localStorage.removeItem("MyTokens");
    localStorage.removeItem("MyTokensFolders");
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
    window.EncounterHandler.fetch_encounter_monsters(clickedItem.encounterId, async function (response, errorType) {
        clickedItem.activelyFetchingMonsters = false;
        clickedRow.find(".sidebar-list-item-row-item").removeClass("button-loading");
        if (response === false) {
            console.warn("Failed to fetch encounter monsters", errorType);
            callback(false);
        } else {
            let monsterItems = response
                .map(monsterData => SidebarListItem.Monster(monsterData))
                .sort(SidebarListItem.sortComparator);
            encounter_monster_items[clickedItem.encounterId] = monsterItems;
            update_monster_item_cache(monsterItems, function(){
                inject_encounter_monsters();
                callback(true);
            }); // let's cache these so we won't have to fetch them again if the user places them on the scene
            
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
                monsterItem.folderPath = RootFolder.Encounters.path;
                monsterItem.rootId = RootFolder.Encounters.id;
                monsterItem.parentId = RootFolder.Encounters.id;
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
    filter_token_list($('[name="token-search"]').val() ? $('[name="token-search"]').val() : "");
}

/**
 * creates an iframe that loads a monster stat block for the given item
 * @param listItem {SidebarListItem} the list item representing the monster that you want to display a stat block for
 */
function open_monster_item(listItem, open5e=false) {
    if (should_use_iframes_for_monsters() && !open5e) {
        // in case we need a way to fallback quickly
        open_monster_item_iframe(listItem);
        return;
    }
    if (!listItem.isTypeMonster() && !listItem.isTypeOpen5eMonster()) {
        console.warn("open_monster_item was called with the wrong item type", listItem);
        return;
    }
    let sidebarModal = new SidebarPanel("monster-stat-block", true);
    display_sidebar_modal(sidebarModal);
    try {
        build_and_display_stat_block_with_data(listItem.monsterData, sidebarModal.body, undefined, open5e);
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
        "width": "1920px",
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

        console.group("observe_filters")
        let mutation_target = $(event.target).contents()[0];
        let mutation_config = { attributes: false, childList: true, characterData: false, subtree: true };

        let filter_observer = new MutationObserver(function() {
            let filterButton = $(event.target).contents().find(".monster-listing__header button");
            let monsterListing = $(event.target).contents().find(".qa-monster-filters:not('above-loaded')")
            if (filterButton.length > 0 || monsterListing.length>0){
                filter_observer.disconnect();
                $(event.target).contents().find("head").append(
                `<style>
                    .input-select .input-select__dropdown-wrapper {
                        transition: max-height 0.5s ease 0.1s;
                    }
                    .is-open {
                        z-index:10000000 !important;
                    }
                    .monster-filters.qa-monster-filters.monster-listing__sidebar-filters {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        z-index: 100000;
                        width: 340px;
                        overflow: auto;
                    }
                </style>`
                );
                $(event.target).contents().find("body").addClass("prevent-sidebar-modal-close");

                $(event.target).contents().find(".monster-listing__header button").click();
                $(event.target).contents().find('.qa-monster-filters').toggleClass('above-loaded', true);
                $(event.target).contents().find(".popup-overlay").css("background", "rgb(235, 241, 245)");
                $(event.target).contents().find(".popup-content").css({
                    "width": "100%",
                    "height": "100%",
                    "max-width": "100%",
                    "max-height": "100%",
                    "margin": 0
                });


              $(`<label class="input-checkbox input-checkbox-label qa-input-checkbox_label qa-monster-filters_accessible-content" title="Only show content I have access to">
                <input class="input-checkbox__input qa-input-checkbox_input" tabindex="0" type="checkbox" ${(localStorage.getItem(`${gameId}-ownedMonsterFilter`) != 'undefined' && $.parseJSON(localStorage.getItem(`${gameId}-ownedMonsterFilter`)) == true) ? 'checked="checked"' : ''}>
                    <div class="input-checkbox__focus-indicator"></div>
                    <svg class="input-checkbox__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" overflow="visible" focusable="false">
                        <path class="svg-border" d="M5.63636382,2.00000055 C3.62805456,2.00000064 2,3.62805509 2,5.63636419 C2,5.63636419 2,9.87878843 2,18.3636369 C1.9999997,20.3719455 3.62805456,22 5.63636367,22 L18.3636365,22 C20.3719454,22.0000001 22,20.3719455 22,18.3636364 L22,5.63636364 C22,3.62805455 20.3719454,2 18.3636363,2 L5.63636382,2.00000055 Z M19,17.25 C19,18.2164987 18.2164979,19 17.25,19 L6.75000007,19 C5.78350125,19 5,18.2164979 5,17.25 C5,17.25 5,17.25 5,17.25 L5,6.74999977 L5,6.75000003 C4.99999985,5.78350126 5.78350125,5 6.74999999,5 L17.2499999,5 C18.2164986,4.99999996 18.9999998,5.78350126 18.9999998,6.75000003 L19,17.25 Z"></path>
                        <path class="svg-center" d="M10.9545457,13.4909096 L8.00000021,11.2727278 C7.5983384,10.9714815 7.0285184,11.0528842 6.72727294,11.454546 C6.42602658,11.8562078 6.5074293,12.4260278 6.90909113,12.7272733 L11.227273,15.9636369 L17.2363639,8.95454602 C17.562714,8.57296782 17.5179421,7.99908236 17.136364,7.67272782 C16.7547858,7.34637782 16.1809003,7.39114963 15.8545458,7.77272782 L10.9545457,13.4909096 Z"></path>
                    </svg>
                    <span class="input-checkbox__text">Only show monsters I have access to</span>
                </label>`).insertAfter($(event.target).contents().find(".qa-monster-filters_remember"));
                    
                let closeButton = build_close_button();
                closeButton.css({
                    "position": "absolute",
                    "top": "10px",
                    "right": "10px",
                    "box-shadow": "rgb(51 51 51) 0px 0px 60px 0px"
                });
                closeButton.on("click", function (clickEvent) {
                    clickEvent.stopPropagation();
                    close_monster_filter_iframe();
                });
                $(event.target).contents().find(".qa-monster-filters").prepend(closeButton);

                tokensPanel.remove_sidebar_loading_indicator();
                iframe.css({ "z-index": 10 });
            }
        });
        filter_observer.observe(mutation_target,mutation_config);
        console.groupEnd()
    });
    iframe.attr("src", `https://www.dndbeyond.com/encounter-builder`);

}

function close_monster_filter_iframe() {
    let sidebarMonsterFilter = $("#monster-filter-iframe");
    let ownedFilter = sidebarMonsterFilter.contents().find('.qa-monster-filters_accessible-content input')[0]?.checked 
   
    if(localStorage.getItem('DDBEB-monster-filters') != null) {
        // the user has the "remember filters" option checked... let's grab our data and move on
        if(ownedFilter != undefined)
            localStorage.setItem(`${gameId}-ownedMonsterFilter`, ownedFilter);
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
            localStorage.removeItem(`${gameId}-ownedMonsterFilter`, ownedFilter);
            window.ownedMonstersOnly = ownedFilter; 
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
        monster_search_filters = $.parseJSON(localStorage.getItem('DDBEB-monster-filters'))    
        if(localStorage.getItem(`${gameId}-ownedMonsterFilter`) != 'undefined' && $.parseJSON(localStorage.getItem(`${gameId}-ownedMonsterFilter`)) != null)
            window.ownedMonstersOnly = $.parseJSON(localStorage.getItem(`${gameId}-ownedMonsterFilter`));
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
        selector: ".custom-token-image-item, #token-change-image-modal .example-token",
        build: function(element, e) {
            let items = {};
            let foundElement = find_sidebar_list_item(element)
            let tokenChangeImage = element.parents().find('#token-change-image-modal').length>0
            if (!element.hasClass("change-token-image-item") && !tokenChangeImage) {
                items.place = {
                    name: "Place Token",
                    callback: function (itemKey, opt, originalEvent) {
                        let itemToPlace = find_sidebar_list_item(opt.$trigger);
                        let specificImage = undefined;
                        let imgSrc = opt.$trigger.find(".token-image").attr("src");
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
                        let imgSrc = opt.$trigger.find(".token-image").attr("src");
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
                        let imgSrc = selectedItem.find(".token-image").attr("src");
                        if(tokenChangeImage){
                            imgSrc = selectedItem.attr("src");
                        }
                        copy_to_clipboard(imgSrc); 
                }
            };
            items.sendToGamelog = {
                name: "Send to Gamelog",
                callback: function (itemKey, opt, e) {
                    let imgHtml = $(opt.$trigger[0]).find('.token-image').clone()
                    if(imgHtml.length == 0 && $(opt.$trigger[0]).hasClass('example-token')){
                        imgHtml = $(opt.$trigger[0]).clone()
                    }
                    imgHtml.removeAttr('style class');
                    imgHtml.addClass('magnify');                         
                    imgHtml.attr('href', imgHtml.attr('src'));
                    imgHtml = imgHtml[0].outerHTML;
                    imgHtml = imgHtml.replace('disableremoteplayback', 'disableremoteplayback autoplay loop').replace('div', 'img');
                    let msgdata = {
                        player: window.PLAYER_NAME,
                        img: window.PLAYER_IMG, 
                        text: imgHtml,
                    };
                    window.MB.inject_chat(msgdata)
                }
            };
            if (!$('.token-image-modal-url-label-add-wrapper .token-image-modal-footer-title').text().includes('Replace') && !element.hasClass("change-token-image-item") && foundElement?.type !== 'builtinToken' && foundElement?.type !== 'ddbToken') {
                items.border = "---";
                items.remove = {
                    name: "Remove",
                    callback: async function (itemKey, opt, originalEvent) {
                        let selectedItem = $(opt.$trigger[0]);
                        let imgSrc = selectedItem.find(".token-image").attr("src");
                        if(tokenChangeImage){
                            imgSrc = selectedItem.attr("src");
                        }
                        
                        let listItem = find_sidebar_list_item(opt.$trigger);
                        

                        // if they are removing the image that is set on a token, ask them if they really want to remove it
                        let placedTokenId = selectedItem.attr("data-token-id");
                        let placedToken = window.TOKEN_OBJECTS[placedTokenId];
                        if(placedToken !== undefined){
                            placedToken.options.alternativeImages = placedToken.options.alternativeImages.filter(d => d !== imgSrc);
                        }
                        if (placedToken !== undefined && placedToken.options.imgsrc === imgSrc) {
                            let continueRemoving = confirm("This image is set on the token. Removing it will remove the image on the token as well. Are you sure you want to remove this image?")
                            if (!continueRemoving) {
                                return;
                            }
                            placedToken.options.imgsrc = "";
                            placedToken.place_sync_persist();
                        }

                        if (!tokenChangeImage && listItem?.isTypeMyToken() || listItem?.isTypeMonster() || listItem?.isTypePC() || listItem?.isTypeOpen5eMonster()) {
                            let customization = find_token_customization(listItem.type, listItem.id);
                            if (!customization) {
                                showError("register_custom_token_image_context_menu Remove failed to find a token customization object matching listItem: ", listItem);
                                return;
                            }
                            await customization.removeAlternativeImage(imgSrc);
                            persist_token_customization(customization, function(){
                                let listingImage = (customization.tokenOptions?.alternativeImages && customization.tokenOptions?.alternativeImages[0] != undefined) ? customization.tokenOptions?.alternativeImages[0] : listItem.image;     
                                $(`.sidebar-list-item-row[id='${listItem.id}'] .token-image`).attr('src', listingImage);
                                redraw_token_images_in_modal(window.current_sidebar_modal, listItem, placedToken);
                            });
     
                        } else if (!tokenChangeImage) {
                            showError("register_custom_token_image_context_menu Remove attempted to remove a custom image with an invalid type. listItem:", listItem);
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
            showError("build_remove_all_images_button failed to find token customization for listItem:", listItem, ", placedToken:", placedToken);
            return;
        }
        if (window.confirm(`Are you sure you want to remove all custom images for ${tokenName}?\nThis will reset the token images back to the default`)) {
            customization.removeAllAlternativeImages();
            persist_token_customization(customization);
            let listingImage = (customization.tokenOptions?.alternativeImages && customization.tokenOptions?.alternativeImages[0] != undefined) ? customization.tokenOptions?.alternativeImages[0] : listItem.image;     
           
            let fileExtention = listingImage.split('.')[listingImage.split('.').length-1];

            let rowImage;
            let alt = $(`.sidebar-list-item-row[id='${listItem.id}'] .token-image`).attr('alt')
            let video = false;
            if(customization?.tokenOptions?.videoToken == true || (['.mp4', '.webm', '.m4v'].some(d => listingImage.includes(d)))){
                rowImage = $(`<video disableRemotePlayback muted loading='lazy' class='token-image video-listing' alt='${alt}'>`);
                video = true;
            } 
            else{
                rowImage = $(`<img loading='lazy' class='token-image' alt='${alt}'>`);
            }      
            $(`.sidebar-list-item-row[id='${listItem.id}'] .token-image`).replaceWith(rowImage);

            updateTokenSrc(listingImage, rowImage, video);
            redraw_token_images_in_modal(sidebarPanel, listItem, placedToken);
            $(event.currentTarget).hide();
        }
    });
    return removeAllButton;
}

function find_token_options_for_list_item(listItem) {
    if (!listItem) return {};
    let rootId = RootFolder.allValues().find(d => listItem.folderPath.includes(d.path) && d.name !='')?.id;
    if (listItem.isTypeBuiltinToken() || listItem.isTypeDDBToken()) {
        return {...listItem.tokenOptions, ...find_or_create_token_customization(listItem.type, listItem.id, listItem.parentId, rootId)?.allCombinedOptions()};
    } else {
        return find_or_create_token_customization(listItem.type, listItem.id, listItem.parentId, rootId)?.allCombinedOptions() || {};
    }
}
function duplicate_my_token(listItem){
    if (!listItem) return {};
    let foundOptions = $.extend(true, {}, find_token_options_for_list_item(listItem));
    if(foundOptions.image){
        foundOptions.imgsrc = foundOptions.image;
        delete foundOptions.image;
    }
    delete foundOptions.id;
    const folder = listItem.isTypeMyToken() ? find_sidebar_list_item_from_path(listItem.folderPath) : find_sidebar_list_item_from_path(RootFolder.MyTokens.path)
    if(window.JOURNAL.notes[listItem.id] != undefined){
        create_token_inside(folder, undefined, undefined, undefined, foundOptions, window.JOURNAL.notes[listItem.id].text);
    }
    else{
        create_token_inside(folder, undefined, undefined, undefined, foundOptions);
    }
}
function create_token_copy_inside(listItem, open5e = false){
    if (!listItem) return {};

    // set up whatever you need to. We'll override a few things after
    let foundOptions = find_token_options_for_list_item(listItem);
    let options = {...foundOptions}; // we may need to put this in specific places within the switch statement below
  
    options.name = listItem.name;
    
    let tokenSizeSetting;
    let tokenSize;

    tokenSizeSetting = options.tokenSize;
    tokenSize = parseInt(tokenSizeSetting);
    if (tokenSizeSetting === undefined || typeof tokenSizeSetting !== 'number') {
        options.sizeId = listItem.monsterData.sizeId;
        // TODO: handle custom sizes
    }

    let darkvision = 0;
    if(window.monsterListItems){
        let monsterSidebarListItem = open5e ? window.open5eListItems.filter((d) => listItem.id == d.id)[0] : window.monsterListItems.filter((d) => listItem.id == d.id)[0]; 
        if(!monsterSidebarListItem){
            for(let i in encounter_monster_items){
                if(encounter_monster_items[i].some((d) => options.monster == d.id)){
                    monsterSidebarListItem = encounter_monster_items[i].filter((d) => listItem.id == d.id)[0]
                    break;
                }
            }
        }
           
        if(monsterSidebarListItem){
            if(monsterSidebarListItem.monsterData.senses.length > 0){
                for(let i=0; i < monsterSidebarListItem.monsterData.senses.length; i++){
                    const ftPosition = monsterSidebarListItem.monsterData.senses[i].notes.indexOf('ft.')
                    const range = parseInt(monsterSidebarListItem.monsterData.senses[i].notes.slice(0, ftPosition));
                    if(range > darkvision)
                        darkvision = range;
                }
            }
        }
    } 
    options.vision = {
        feet: darkvision.toString(),
        color: (window.TOKEN_SETTINGS?.vision?.color) ? window.TOKEN_SETTINGS.vision.color : 'rgba(142, 142, 142, 1)'
    }
    
    options.monster = 'customStat'
    
    if(foundOptions.color != undefined){
        options.color = foundOptions.color;
    }

    options.imgsrc = random_image_for_item(listItem);

    // TODO: figure out if we still need to do this, and where they are coming from
    delete options.undefined;
    delete options[""];
    const statBlock = build_stat_block_for_copy(listItem, options, open5e)

    
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
    let alternativeImages = placedToken.options.imgsrc != '' ? [placedToken.options.imgsrc] : [];
    if (placedToken.options.alternativeImages) {
        alternativeImages = alternativeImages.concat(placedToken.options.alternativeImages);
    }
    if (listItem?.alternativeImages) {
        alternativeImages = alternativeImages.concat(listItem.alternativeImages);
    }
    if (listItem != undefined){
        let customization = find_token_customization(listItem.type, listItem.id);
        if (customization) {
            alternativeImages = alternativeImages.concat(customization.alternativeImages());
        }
    }
    alternativeImages = [...new Set(alternativeImages)]; // clear out any duplicates
    console.log("display_change_image_modal", alternativeImages);
    alternativeImages.forEach(imgUrl => {
        let html;
        let video = false;
        if(placedToken?.options.videoToken == true || (['.mp4', '.webm', '.m4v'].some(d => imgUrl.includes(d)))){
            html = $(`<video disableRemotePlayback muted autoplay='false' class="example-token" data-token-id='${placedToken?.options.id}' loading="lazy" alt="alternative image" />`);  
            video = true;   
        } else{
            html = $(`<img class="example-token" loading="lazy" data-token-id='${placedToken?.options.id}' alt="alternative image" />`);
        }
        updateImgSrc(imgUrl, html, video);
        // the user is changing their token image, allow them to simply click an image
        // we don't want to allow drag and drop from this modal
        html.on("click", function (imgClickEvent) {

            const imgSrc = parse_img(imgUrl);
            if(placedToken.options.alternativeImagesCustomizations != undefined){
                placedToken.options ={
                    ...placedToken.options,
                    ...placedToken.options.alternativeImagesCustomizations[imgSrc],
                }
                const tokenMultiplierAdjustment = (!window.CURRENT_SCENE_DATA.scaleAdjustment) ? 1 : (window.CURRENT_SCENE_DATA.scaleAdjustment.x > window.CURRENT_SCENE_DATA.scaleAdjustment.y) ? window.CURRENT_SCENE_DATA.scaleAdjustment.x : window.CURRENT_SCENE_DATA.scaleAdjustment.y;
                const hpps = window.CURRENT_SCENE_DATA.hpps * tokenMultiplierAdjustment;
                const newSize = placedToken.options.tokenSize * hpps
                placedToken.size(newSize);
            }
            placedToken.options.imgsrc = imgSrc;
           
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
       
        if(!placedToken.options.alternativeImages){
           placedToken.options.alternativeImages =[];
        }
        if(!placedToken.options.alternativeImages.includes(placedToken.options.imgsrc)){
           placedToken.options.alternativeImages = placedToken.options.alternativeImages.concat([placedToken.options.imgsrc])
        }
        placedToken.options.imgsrc = parse_img(imageUrl);
        if(!placedToken.options.alternativeImages.includes(placedToken.options.imgsrc)){
            placedToken.options.alternativeImages = placedToken.options.alternativeImages.concat([placedToken.options.imgsrc])
        }
        close_sidebar_modal();
        placedToken.place_sync_persist();
    };
   
    let imageUrlInput = sidebarPanel.build_image_url_input("Use a different image", add_token_customization_image);
    sidebarPanel.inputWrapper.append(imageUrlInput);
    //dropbox button
    const dropboxOptions = dropBoxOptions(function(links){
        for(let i = 0; i<links.length; i++){
            if(!placedToken.options.alternativeImages){
               placedToken.options.alternativeImages =[];
            }
            if(!placedToken.options.alternativeImages.includes(placedToken.options.imgsrc)){
               placedToken.options.alternativeImages = placedToken.options.alternativeImages.concat([placedToken.options.imgsrc])
            }
            placedToken.options.imgsrc = parse_img(links[i].link);
            if(!placedToken.options.alternativeImages.includes(placedToken.options.imgsrc)){
                placedToken.options.alternativeImages = placedToken.options.alternativeImages.concat([placedToken.options.imgsrc])
            }
        }
        close_sidebar_modal();
        placedToken.place_sync_persist();       
    }, true);
    const dropboxButton = createCustomDropboxChooser('', dropboxOptions);
    dropboxButton.toggleClass('token-row-button', true);

    const oneDriveButton = createCustomOnedriveChooser('', function(links){
        for(let i = 0; i<links.length; i++){
            if(!placedToken.options.alternativeImages){
               placedToken.options.alternativeImages =[];
            }
            if(!placedToken.options.alternativeImages.includes(placedToken.options.imgsrc)){
               placedToken.options.alternativeImages = placedToken.options.alternativeImages.concat([placedToken.options.imgsrc])
            }
            placedToken.options.imgsrc = parse_img(links[i].link);
            if(!placedToken.options.alternativeImages.includes(placedToken.options.imgsrc)){
                placedToken.options.alternativeImages = placedToken.options.alternativeImages.concat([placedToken.options.imgsrc])
            }
        }
        close_sidebar_modal();
        placedToken.place_sync_persist();      
    }, 'multiple')
    oneDriveButton.toggleClass('token-row-button', true);
    sidebarPanel.inputWrapper.append(dropboxButton, oneDriveButton);

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

const fetch_and_cache_scene_monster_items = mydebounce( () => {
    console.log("fetch_and_cache_scene_monster_items");
    let monsterIds = [];
    let open5emonsterIds = []
    for (let id in window.TOKEN_OBJECTS) {
        let token = window.TOKEN_OBJECTS[id];
        if (token.isMonster()) {
            if(token.options.monster == 'open5e'){
                let alreadyCached = cached_open5e_items[token.options.stat];
                if (alreadyCached === undefined && token.options.monster != 'customStat') {
                    // we only want monsters that we haven't already cached. no need to keep fetching the same things
                    open5emonsterIds.push(token.options.stat);
                }
            }
            else{
                let alreadyCached = cached_monster_items[token.options.monster];
                if (alreadyCached === undefined && token.options.monster != 'customStat') {
                    // we only want monsters that we haven't already cached. no need to keep fetching the same things
                    monsterIds.push(token.options.monster);
                }
            }
           
        }
    }
    if (monsterIds.length === 0 && open5emonsterIds === 0) {
        console.log("fetch_and_cache_scene_monster_items no monsters to fetch");
        return;
    }
    console.log("fetch_and_cache_scene_monster_items calling fetch_monsters with ids: ", monsterIds);
    fetch_monsters(monsterIds, async function (response) {
        if (response !== false) {
            update_monster_item_cache(response.map(m => SidebarListItem.Monster(m)));
        }
    });
});

const fetch_and_cache_monsters = mydebounce( (monsterIds, callback, open5e) => {
    if(open5e){
        const cachedIds = Object.keys(cached_open5e_items);
        const monstersToFetch = monsterIds.filter(id => !cachedIds.includes(id) && id != 'customStat');
        fetch_monsters(monstersToFetch, function (response) {
            if (response !== false) {
                update_open5e_item_cache(response.map(m => SidebarListItem.open5eMonster(m)), function(){callback(open5e)});
            }
        }, open5e);
    }   
    else{
        const cachedIds = Object.keys(cached_monster_items);
        const monstersToFetch = monsterIds.filter(id => !cachedIds.includes(id) && id != 'customStat');
        fetch_monsters(monstersToFetch, function (response) {
            if (response !== false) {
                update_monster_item_cache(response.map(m => SidebarListItem.Monster(m)), function(){callback()});
            }
 
        });
    }
    
});

function update_monster_item_cache(newItems, callback=()=>{}) {
   
   const promise = new Promise((resolve, reject) =>{
        newItems.forEach(async (item, index, array) => {
            cached_monster_items[item.monsterData.id] = item 
            if(index === array.length-1) {
              resolve();
            }
        });
    });

    promise.then(function(){callback()});
}
function update_open5e_item_cache(newItems, callback=()=>{}) {
   
   const promise = new Promise((resolve, reject) =>{
        newItems.forEach(async (item, index, array) => {
            cached_open5e_items[item.monsterData.slug] = item
            if(index === array.length-1) {
              resolve();
            }
        });
    });

    promise.then(function(){callback()});
}
function convert_open5e_monsterData(monsterData){
        monsterData.isHomebrew = true;
        monsterData.stats = [
        {
            "statId": 1,
            "name": null,
            "value": monsterData.strength
        },
        {
            "statId": 2,
            "name": null,
            "value": monsterData.dexterity
        },
        {
            "statId": 3,
            "name": null,
            "value": monsterData.constitution
        },
        {
            "statId": 4,
            "name": null,
            "value": monsterData.intelligence
        },
        {
            "statId": 5,
            "name": null,
            "value": monsterData.wisdom
        },
        {
            "statId": 6,
            "name": null,
            "value": monsterData.charisma
        }];

        monsterData.passivePerception = monsterData.perception + 10;
   

        if(monsterData.special_abilities?.length>0){
            monsterData.specialTraitsDescription = monsterData.special_abilities.map(action => {
                let desc = ``
                if(action.desc == undefined && action.description != undefined){
                    action.desc = action.description;
                }else if(action.desc == undefined){
                    action.desc ='';
                }
                if(action.name == 'Spellcasting'){
                    actionDesc = action.desc.replace(/Cantrips|[0-9]+[A-Za-z][A-Za-z]-level|[0-9]+[A-Za-z][A-Za-z]\slevel/g, '</p><p>$&');
                    desc = `<p><em><strong>${action.name}.</strong></em> ${actionDesc}</p>`;
                }
                else{
                    desc = `<p><em><strong>${action.name}.</strong></em> ${action.desc.replace(/\n/g, `<br />`)}</p>`
                }
                desc = desc.replace(/\d\dd\d\d\s[+-]\s\d|\d\dd\d\s[+-]\s\d|\dd\d\d\s[+-]\s\d|\dd\d\s[+-]\s\d|\d\dd\d\d|\d\dd\d|\dd\d\d|\dd\d/g, `<span data-dicenotation='$&' data-rolltype='damage' data-rollaction='damage'>$&</span>`);
                desc = desc.replace(/\s[+-]\d\d\s|\s[+-]\d\s/g, `<span data-dicenotation='1d20$&' data-rollaction='attack'>$&</span> `);
                desc = desc.replace(`(<span`, `<span`).replace(`span>)`, `span>`);
                return desc;
            }).join("");
        }
               
        if(monsterData.actions?.length>0){
            monsterData.actionsDescription = monsterData.actions.map(action => {
                if(action.desc == undefined && action.description != undefined){
                    action.desc = action.description;
                }else if(action.desc == undefined){
                    action.desc ='';
                }
                let desc = `<p><em><strong>${action.name}.</strong></em> ${action.desc}</p>`
                desc = desc.replace(/\d\dd\d\d\s[+-]\s\d|\d\dd\d\s[+-]\s\d|\dd\d\d\s[+-]\s\d|\dd\d\s[+-]\s\d|\d\dd\d\d|\d\dd\d|\dd\d\d|\dd\d/g, `<span data-dicenotation='$&' data-rolltype='damage' data-rollaction='damage'>$&</span>`);
                desc = desc.replace(/\s[+-]\d\d\s|\s[+-]\d\s/g, `<span data-dicenotation='1d20$&' data-rollaction='attack'>$&</span> `);
                desc = desc.replace(`(<span`, `<span`).replace(`span>)`, `span>`);
                return desc;
            }).join("");
        }
    
        if(monsterData.bonus_actions?.length>0){
            monsterData.bonusActionsDescription = monsterData.bonus_actions.map(action => {
                if(action.desc == undefined && action.description != undefined){
                    action.desc = action.description;
                }else if(action.desc == undefined){
                    action.desc ='';
                }
                let desc = `<p><em><strong>${action.name}.</strong></em> ${action.desc}</p>`
                desc = desc.replace(/\d\dd\d\d\s[+-]\s\d|\d\dd\d\s[+-]\s\d|\dd\d\d\s[+-]\s\d|\dd\d\s[+-]\s\d|\d\dd\d\d|\d\dd\d|\dd\d\d|\dd\d/g, `<span data-dicenotation='$&' data-rolltype='damage' data-rollaction='damage'>$&</span>`);
                desc = desc.replace(/\s[+-]\d\d\s|\s[+-]\d\s/g, `<span data-dicenotation='1d20$&' data-rollaction='attack'>$&</span> `);
                desc = desc.replace(`(<span`, `<span`).replace(`span>)`, `span>`);
                return desc;
            }).join("");
        }
   
        if(monsterData.reactions?.length>0){
            monsterData.reactionsDescription = monsterData.reactions.map(action => {
                if(action.desc == undefined && action.description != undefined){
                    action.desc = action.description;
                }else if(action.desc == undefined){
                    action.desc ='';
                }
                let desc = `<p><em><strong>${action.name}.</strong></em> ${action.desc}</p>`
                desc = desc.replace(/\d\dd\d\d\s[+-]\s\d|\d\dd\d\s[+-]\s\d|\dd\d\d\s[+-]\s\d|\dd\d\s[+-]\s\d|\d\dd\d\d|\d\dd\d|\dd\d\d|\dd\d/g, `<span data-dicenotation='$&' data-rolltype='damage' data-rollaction='damage'>$&</span>`);
                desc = desc.replace(/\s[+-]\d\d\s|\s[+-]\d\s/g, `<span data-dicenotation='1d20$&' data-rollaction='attack'>$&</span> `);
                desc = desc.replace(`(<span`, `<span`).replace(`span>)`, `span>`);
                return desc;
            }).join("");
        }
 
        if(monsterData.legendary_actions?.length>0){
            monsterData.legendaryActionsDescription = monsterData.legendary_actions.map(action => {
                if(action.desc == undefined && action.description != undefined){
                    action.desc = action.description;
                }else if(action.desc == undefined){
                    action.desc ='';
                }
                let desc = `<p><em><strong>${action.name}.</strong></em> ${action.desc}</p>`
                desc = desc.replace(/\d\dd\d\d\s[+-]\s\d|\d\dd\d\s[+-]\s\d|\dd\d\d\s[+-]\s\d|\dd\d\s[+-]\s\d|\d\dd\d\d|\d\dd\d|\dd\d\d|\dd\d/g, `<span data-dicenotation='$&' data-rollaction='damage'>$&</span>`);
                desc = desc.replace(/\s[+-]\d\d\s|\s[+-]\d\s/g, `<span data-dicenotation='1d20$&' data-rollaction='attack'>$&</span> `);
                desc = desc.replace(`(<span`, `<span`).replace(`span>)`, `span>`);
                return desc;
            }).join("");
        }
       
        let convertedSkills = [];
        Object.entries(monsterData.skills).forEach(([key, value]) => {
          console.log(`${key}: ${value}`)     
            if(key == "athletics"){
                convertedSkills.push({skillId: 2, value: value, additionalBonus: null})
            }
            else if(key == "acrobatics"){
                convertedSkills.push({skillId: 3, value: value, additionalBonus: null})
            }
            else if(key == "sleight of hand"){
                convertedSkills.push({skillId: 4, value: value, additionalBonus: null})
            }
            else if(key == "stealth"){
                convertedSkills.push({skillId: 5, value: value, additionalBonus: null})
            }
            else if(key == "arcana"){
                convertedSkills.push({skillId: 6, value: value, additionalBonus: null})
            }
            else if(key == "hHistory"){
                convertedSkills.push({skillId: 7, value: value, additionalBonus: null})
            }
            else if(key == "investigation"){
               convertedSkills.push({skillId: 8, value: value, additionalBonus: null})
            }
            else if(key == "nature"){
                convertedSkills.push({skillId: 9, value: value, additionalBonus: null})
            }
            else if(key == "religion"){
                convertedSkills.push({skillId: 10, value: value, additionalBonus: null})
            }
            else if(key == "animal handling"){
                convertedSkills.push({skillId: 11, value: value, additionalBonus: null})
            }
            else if(key == "insight"){
                convertedSkills.push({skillId: 12, value: value, additionalBonus: null})
            }
            else if(key == "medicine"){
                convertedSkills.push({skillId: 13, value: value, additionalBonus: null})
            }
            else if(key == "perception"){
                convertedSkills.push({skillId: 14, value: value, additionalBonus: null})
            }
            else if(key == "survival"){
                convertedSkills.push({skillId: 15, value: value, additionalBonus: null})
            }
            else if(key == "deception"){
                convertedSkills.push({skillId: 16, value: value, additionalBonus: null})
            }
            else if(key == "intimidation"){
                convertedSkills.push({skillId: 17, value: value, additionalBonus: null})
            }
            else if(key == "performance"){
                convertedSkills.push({skillId: 18, value: value, additionalBonus: null})
            }
            else if(key == "persuation"){
                convertedSkills.push({skillId: 19, value: value, additionalBonus: null})
            }       
        });
        monsterData.skills = convertedSkills;


        let convertedSenses = [];

        monsterData.senses = monsterData.senses.split(', ');
        let sensesArray = [];
        for(let i = 0; i < monsterData.senses.length; i++){
            let currentSense = monsterData.senses[i].split(' ');
            if(currentSense[0] == "blindsight"){
                convertedSenses.push({senseId: 1, notes: `${currentSense[1]} ${currentSense[2]}`})
            }
            else if(currentSense[0] == "darkvision"){
                convertedSenses.push({senseId: 2, notes: `${currentSense[1]} ${currentSense[2]}`})
            }
            else if(currentSense[0] == "tremorsense"){
                convertedSenses.push({senseId: 3, notes: `${currentSense[1]} ${currentSense[2]}`})
            }        
            else if(currentSense[0] == "truesight"){
                convertedSenses.push({senseId: 4, notes: `${currentSense[1]} ${currentSense[2]}`})
            }  

        }
        monsterData.senses = convertedSenses;

        if(monsterData.cr >= 1){
          monsterData.challengeRatingId = monsterData.cr + 4
        }
        else if(monsterData.cr == 0){
          monsterData.challengeRatingId = 1
        }
        else if(monsterData.cr == 0.125){
          monsterData.challengeRatingId = 2
        }
        else if(monsterData.cr == 0.25){
          monsterData.challengeRatingId = 3
        }
        else if(monsterData.cr == 0.5){
          monsterData.challengeRatingId = 4
        }
        monsterData.sourceId = monsterData.document__title;    
        monsterData.sourcePageNumber = monsterData.page_no;
        monsterData.hitPointDice = {};
        monsterData.hitPointDice.diceString = monsterData.hit_dice;
        monsterData.averageHitPoints = monsterData.hit_points;
        monsterData.armorClass = monsterData.armor_class;
        monsterData.armorClassDescription = monsterData.armor_desc;  

        if(monsterData.size == 'Tiny'){
            monsterData.sizeId = 2
        }
        else if(monsterData.size == 'Small' ){
            monsterData.sizeId = 3
        }
        else if(monsterData.size == 'Medium' ){
            monsterData.sizeId = 4
        }
        else if(monsterData.size == 'Large' ){
            monsterData.sizeId = 5
        }
        else if(monsterData.size == 'Huge' ){
            monsterData.sizeId = 6
        }
        else if(monsterData.size == 'Gargantuan' ){
            monsterData.sizeId = 7
        }

        monsterData.savingThrows = [];
        if(monsterData.strength_save != null){
            monsterData.savingThrows.push({statId: 1, bonusModifier: null})
        }
        if(monsterData.dexterity_save != null){
            monsterData.savingThrows.push({statId: 2, bonusModifier: null})
        }
        if(monsterData.constitution_save != null){
            monsterData.savingThrows.push({statId: 3, bonusModifier: null})
        }
        if(monsterData.intelligence_save != null){
            monsterData.savingThrows.push({statId: 4, bonusModifier: null})
        }
        if(monsterData.wisdom_save != null){
            monsterData.savingThrows.push({statId: 5, bonusModifier: null})
        }
        if(monsterData.charisma_save != null){
            monsterData.savingThrows.push({statId: 6, bonusModifier: null})
        }
        
        

        monsterData.movements = [];
        Object.entries(monsterData.speed).forEach(([key, value]) => {
          console.log(`${key}: ${value}`)
          key = key.replace(/\b[a-z]/g, function(letter) {
            return letter.toUpperCase();
          });
          if(key == 'Walk'){
            monsterData.movements.push({movementId: 1, speed: value, name: key})
          }
          else if(key == 'Burrow'){
            monsterData.movements.push({movementId: 2, speed: value, name: key})
          }
          else if(key == 'Climb'){
            monsterData.movements.push({movementId: 3, speed: value, name: key})
          }
          else if(key == 'Fly'){
            monsterData.movements.push({movementId: 4, speed: value, name: key})
          }
          else if(key == 'Swim'){
            monsterData.movements.push({movementId: 5, speed: value, name: key})
          }
        });



        return monsterData;
}
function getPersonailityTrait(){
    let tokenPersonality = {
        1: "Accessible",
        2: "Active",
        3: "Adaptable",
        4: "Admirable",
        5: "Adventurous",
        6: "Agreeable",
        7: "Alert",
        8: "Allocentric",
        9: "Amiable",
        10: "Anticipative",
        11: "Appreciative",
        12: "Articulate",
        13: "Aspiring",
        14: "Athletic",
        15: "Attractive",
        16: "Balanced",
        17: "Benevolent",
        18: "Brilliant",
        19: "Calm",
        20: "Capable",
        21: "Captivating",
        22: "Caring",
        23: "Challenging",
        24: "Charismatic",
        25: "Charming",
        26: "Cheerful",
        27: "Clean",
        28: "Clear-headed",
        29: "Clever",
        30: "Colorful",
        31: "Companionly",
        32: "Compassionate",
        33: "Conciliatory",
        34: "Confident",
        35: "Conscientious",
        36: "Considerate",
        37: "Constant",
        38: "Contemplative",
        39: "Cooperative",
        40: "Courageous",
        41: "Courteous",
        42: "Creative",
        43: "Cultured",
        44: "Curious",
        45: "Daring",
        46: "Debonair",
        47: "Decent",
        48: "Decisive",
        49: "Dedicated",
        50: "Deep",
        51: "Dignified",
        52: "Directed",
        53: "Disciplined",
        54: "Discreet",
        55: "Dramatic",
        56: "Dutiful",
        57: "Dynamic",
        58: "Earnest",
        59: "Ebullient",
        60: "Educated",
        61: "Efficient",
        62: "Elegant",
        63: "Eloquent",
        64: "Empathetic",
        65: "Energetic",
        66: "Enthusiastic",
        67: "Esthetic",
        68: "Exciting",
        69: "Extraordinary",
        70: "Fair",
        71: "Faithful",
        72: "Farsighted",
        73: "Felicific",
        74: "Firm",
        75: "Flexible",
        76: "Focused",
        77: "Forecful",
        78: "Forgiving",
        79: "Forthright",
        80: "Freethinking",
        81: "Friendly",
        82: "Fun-loving",
        83: "Gallant",
        84: "Generous",
        85: "Gentle",
        86: "Genuine",
        87: "Good-natured",
        88: "Gracious",
        89: "Hardworking",
        90: "Healthy",
        91: "Hearty",
        92: "Helpful",
        93: "Herioc",
        94: "High-minded",
        95: "Honest",
        96: "Honorable",
        97: "Humble",
        98: "Humorous",
        99: "Idealistic",
        100: "Imaginative",
        101: "Impressive",
        102: "Incisive",
        103: "Incorruptible",
        104: "Independent",
        105: "Individualistic",
        106: "Innovative",
        107: "Inoffensive",
        108: "Insightful",
        109: "Insouciant",
        110: "Intelligent",
        111: "Intuitive",
        112: "Invulnerable",
        113: "Kind",
        114: "Knowledge",
        115: "Leaderly",
        116: "Leisurely",
        117: "Liberal",
        118: "Logical",
        119: "Lovable",
        120: "Loyal",
        121: "Lyrical",
        122: "Magnanimous",
        123: "Many-sided",
        124: "Masculine  (Manly)",
        125: "Mature",
        126: "Methodical",
        127: "Maticulous",
        128: "Moderate",
        129: "Modest",
        130: "Multi-leveled",
        131: "Neat",
        132: "Nonauthoritarian",
        133: "Objective",
        134: "Observant",
        135: "Open",
        136: "Optimistic",
        137: "Orderly",
        138: "Organized",
        139: "Original",
        140: "Painstaking",
        141: "Passionate",
        142: "Patient",
        143: "Patriotic",
        144: "Peaceful",
        145: "Perceptive",
        146: "Perfectionist",
        147: "Personable",
        148: "Persuasive",
        149: "Planful",
        150: "Playful",
        151: "Polished",
        152: "Popular",
        153: "Practical",
        154: "Precise",
        155: "Principled",
        156: "Profound",
        157: "Protean",
        158: "Protective",
        159: "Providential",
        160: "Prudent",
        161: "Punctual",
        162: "Purposeful",
        163: "Rational",
        164: "Realistic",
        165: "Reflective",
        166: "Relaxed",
        167: "Reliable",
        168: "Resourceful",
        169: "Respectful",
        170: "Responsible",
        171: "Responsive",
        172: "Reverential",
        173: "Romantic",
        174: "Rustic",
        175: "Sage",
        176: "Sane",
        177: "Scholarly",
        178: "Scrupulous",
        179: "Secure",
        180: "Selfless",
        181: "Self-critical",
        182: "Self-defacing",
        183: "Self-denying",
        184: "Self-reliant",
        185: "Self-sufficent",
        186: "Sensitive",
        187: "Sentimental",
        188: "Seraphic",
        189: "Serious",
        190: "Sexy",
        191: "Sharing",
        192: "Shrewd",
        193: "Simple",
        194: "Skillful",
        195: "Sober",
        196: "Sociable",
        197: "Solid",
        198: "Sophisticated",
        199: "Spontaneous",
        200: "Sporting",
        201: "Stable",
        202: "Steadfast",
        203: "Steady",
        204: "Stoic",
        205: "Strong",
        206: "Studious",
        207: "Suave",
        208: "Subtle",
        209: "Sweet",
        210: "Sympathetic",
        211: "Systematic",
        212: "Tasteful",
        213: "Teacherly",
        214: "Thorough",
        215: "Tidy",
        216: "Tolerant",
        217: "Tractable",
        218: "Trusting",
        219: "Uncomplaining",
        220: "Understanding",
        221: "Undogmatic",
        222: "Unfoolable",
        223: "Upright",
        224: "Urbane",
        225: "Venturesome",
        226: "Vivacious",
        227: "Warm",
        228: "Well-bred",
        229: "Well-read",
        230: "Well-rounded",
        231: "Winning",
        232: "Wise",
        233: "Witty",
        234: "Youthful",
        235: "Absentminded",
        236: "Aggressive",
        237: "Ambitious",
        238: "Amusing",
        239: "Artful",
        240: "Ascetic",
        241: "Authoritarian",
        242: "Big-thinking",
        243: "Boyish",
        244: "Breezy",
        245: "Businesslike",
        246: "Busy",
        247: "Casual",
        248: "Cerebral",
        249: "Chummy",
        250: "Circumspect",
        251: "Competitive",
        252: "Complex",
        253: "Confidential",
        254: "Conservative",
        255: "Contradictory",
        256: "Crisp",
        257: "Cute",
        258: "Deceptive",
        259: "Determined",
        260: "Dominating",
        261: "Dreamy",
        262: "Driving",
        263: "Droll",
        264: "Dry",
        265: "Earthy",
        266: "Effeminate",
        267: "Emotional",
        268: "Enigmatic",
        269: "Experimental",
        270: "Familial",
        271: "Folksy",
        272: "Formal",
        273: "Freewheeling",
        274: "Frugal",
        275: "Glamorous",
        276: "Guileless",
        277: "High-spirited",
        278: "Huried",
        279: "Hypnotic",
        280: "Iconoclastic",
        281: "Idiosyncratic",
        282: "Impassive",
        283: "Impersonal",
        284: "Impressionable",
        285: "Intense",
        286: "Invisible",
        287: "Irreligious",
        288: "Irreverent",
        289: "Maternal",
        290: "Mellow",
        291: "Modern",
        292: "Moralistic",
        293: "Mystical",
        294: "Neutral",
        295: "Noncommittal",
        296: "Noncompetitive",
        297: "Obedient",
        298: "Old-fashioned",
        299: "Ordinary",
        300: "Outspoken",
        301: "Paternalistic",
        302: "Physical",
        303: "Placid",
        304: "Political",
        305: "Predictable",
        306: "Preoccupied",
        307: "Private",
        308: "Progressive",
        309: "Proud",
        310: "Pure",
        311: "Questioning",
        312: "Quiet",
        313: "Religious",
        314: "Reserved",
        315: "Restrained",
        316: "Retiring",
        317: "Sarcastic",
        318: "Self-conscious",
        319: "Sensual",
        320: "Skeptical",
        321: "Smooth",
        322: "Soft",
        323: "Solemn",
        324: "Solitary",
        325: "Stern",
        326: "Stolid",
        327: "Strict",
        328: "Stubborn",
        329: "Stylish",
        330: "Subjective",
        331: "Surprising",
        332: "Soft",
        333: "Tough",
        334: "Unaggressive",
        335: "Unambitious",
        336: "Unceremonious",
        337: "Unchanging",
        338: "Undemanding",
        339: "Unfathomable",
        340: "Unhurried",
        341: "Uninhibited",
        342: "Unpatriotic",
        343: "Unpredicatable",
        344: "Unreligious",
        345: "Unsentimental",
        346: "Whimsical",
        347: "Abrasive",
        348: "Abrupt",
        349: "Agonizing",
        350: "Aimless",
        351: "Airy",
        352: "Aloof",
        353: "Amoral",
        354: "Angry",
        355: "Anxious",
        356: "Apathetic",
        357: "Arbitrary",
        358: "Argumentative",
        359: "Arrogantt",
        360: "Artificial",
        361: "Asocial",
        362: "Assertive",
        363: "Astigmatic",
        364: "Barbaric",
        365: "Bewildered",
        366: "Bizarre",
        367: "Bland",
        368: "Blunt",
        369: "Boisterous",
        370: "Brittle",
        371: "Brutal",
        372: "Calculating",
        373: "Callous",
        374: "Cantakerous",
        375: "Careless",
        376: "Cautious",
        377: "Charmless",
        378: "Childish",
        379: "Clumsy",
        380: "Coarse",
        381: "Cold",
        382: "Colorless",
        383: "Complacent",
        384: "Complaintive",
        385: "Compulsive",
        386: "Conceited",
        387: "Condemnatory",
        388: "Conformist",
        389: "Confused",
        390: "Contemptible",
        391: "Conventional",
        392: "Cowardly",
        393: "Crafty",
        394: "Crass",
        395: "Crazy",
        396: "Criminal",
        397: "Critical",
        398: "Crude",
        399: "Cruel",
        400: "Cynical",
        401: "Decadent",
        402: "Deceitful",
        403: "Delicate",
        404: "Demanding",
        405: "Dependent",
        406: "Desperate",
        407: "Destructive",
        408: "Devious",
        409: "Difficult",
        410: "Dirty",
        411: "Disconcerting",
        412: "Discontented",
        413: "Discouraging",
        414: "Discourteous",
        415: "Dishonest",
        416: "Disloyal",
        417: "Disobedient",
        418: "Disorderly",
        419: "Disorganized",
        420: "Disputatious",
        421: "Disrespectful",
        422: "Disruptive",
        423: "Dissolute",
        424: "Dissonant",
        425: "Distractible",
        426: "Disturbing",
        427: "Dogmatic",
        428: "Domineering",
        429: "Dull",
        430: "Easily Discouraged",
        431: "Egocentric",
        432: "Enervated",
        433: "Envious",
        434: "Erratic",
        435: "Escapist",
        436: "Excitable",
        437: "Expedient",
        438: "Extravagant",
        439: "Extreme",
        440: "Faithless",
        441: "False",
        442: "Fanatical",
        443: "Fanciful",
        444: "Fatalistic",
        445: "Fawning",
        446: "Fearful",
        447: "Fickle",
        448: "Fiery",
        449: "Fixed",
        450: "Flamboyant",
        451: "Foolish",
        452: "Forgetful",
        453: "Fraudulent",
        454: "Frightening",
        455: "Frivolous",
        456: "Gloomy",
        457: "Graceless",
        458: "Grand",
        459: "Greedy",
        460: "Grim",
        461: "Gullible",
        462: "Hateful",
        463: "Haughty",
        464: "Hedonistic",
        465: "Hesitant",
        466: "Hidebound",
        467: "High-handed",
        468: "Hostile",
        469: "Ignorant",
        470: "Imitative",
        471: "Impatient",
        472: "Impractical",
        473: "Imprudent",
        474: "Impulsive",
        475: "Inconsiderate",
        476: "Incurious",
        477: "Indecisive",
        478: "Indulgent",
        479: "Inert",
        480: "Inhibited",
        481: "Insecure",
        482: "Insensitive",
        483: "Insincere",
        484: "Insulting",
        485: "Intolerant",
        486: "Irascible",
        487: "Irrational",
        488: "Irresponsible",
        489: "Irritable",
        490: "Lazy",
        491: "Libidinous",
        492: "Loquacious",
        493: "Malicious",
        494: "Mannered",
        495: "Mannerless",
        496: "Mawkish",
        497: "Mealymouthed",
        498: "Mechanical",
        499: "Meddlesome",
        500: "Melancholic",
        501: "Meretricious",
        502: "Messy",
        503: "Miserable",
        504: "Miserly",
        505: "Misguided",
        506: "Mistaken",
        507: "Money-minded",
        508: "Monstrous",
        509: "Moody",
        510: "Morbid",
        511: "Muddle-headed",
        512: "Naive",
        513: "Narcissistic",
        514: "Narrow",
        515: "Narrow-minded",
        516: "Natty",
        517: "Negativistic",
        518: "Neglectful",
        519: "Neurotic",
        520: "Nihilistic",
        521: "Obnoxious",
        522: "Obsessive",
        523: "Obvious",
        524: "Odd",
        525: "Offhand",
        526: "One-dimensional",
        527: "One-sided",
        528: "Opinionated",
        529: "Opportunistic",
        530: "Oppressed",
        531: "Outrageous",
        532: "Overimaginative",
        533: "Paranoid",
        534: "Passive",
        535: "Pedantic",
        536: "Perverse",
        537: "Petty",
        538: "Pharisaical",
        539: "Phlegmatic",
        540: "Plodding",
        541: "Pompous",
        542: "Possessive",
        543: "Power-hungry",
        544: "Predatory",
        545: "Prejudiced",
        546: "Presumptuous",
        547: "Pretentious",
        548: "Prim",
        549: "Procrastinating",
        550: "Profligate",
        551: "Provocative",
        552: "Pugnacious",
        553: "Puritanical",
        554: "Quirky",
        555: "Reactionary",
        556: "Reactive",
        557: "Regimental",
        558: "Regretful",
        559: "Repentant",
        560: "Repressed",
        561: "Resentful",
        562: "Ridiculous",
        563: "Rigid",
        564: "Ritualistic",
        565: "Rowdy",
        566: "Ruined",
        567: "Sadistic",
        568: "Sanctimonious",
        569: "Scheming",
        570: "Scornful",
        571: "Secretive",
        572: "Sedentary",
        573: "Selfish",
        574: "Self-indulgent",
        575: "Shallow",
        576: "Shortsighted",
        577: "Shy",
        578: "Silly",
        579: "Single-minded",
        580: "Sloppy",
        581: "Slow",
        582: "Sly",
        583: "Small-thinking",
        584: "Softheaded",
        585: "Sordid",
        586: "Steely",
        587: "Stiff",
        588: "Strong-willed",
        589: "Stupid",
        590: "Submissive",
        591: "Superficial",
        592: "Superstitious",
        593: "Suspicious",
        594: "Tactless",
        595: "Tasteless",
        596: "Tense",
        597: "Thievish",
        598: "Thoughtless",
        599: "Timid",
        600: "Transparent",
        601: "Treacherous",
        602: "Trendy",
        603: "Troublesome",
        604: "Unappreciative",
        605: "Uncaring",
        606: "Uncharitable",
        607: "Unconvincing",
        608: "Uncooperative",
        609: "Uncreative",
        610: "Uncritical",
        611: "Unctuous",
        612: "Undisciplined",
        613: "Unfriendly",
        614: "Ungrateful",
        615: "Unhealthy",
        616: "Unimaginative",
        617: "Unimpressive",
        618: "Unlovable",
        619: "Unpolished",
        620: "Unprincipled",
        621: "Unrealistic",
        622: "Unreflective",
        623: "Unreliable",
        624: "Unrestrained",
        625: "Unself-critical",
        626: "Unstable",
        627: "Vacuous",
        628: "Vague",
        629: "Venal",
        630: "Venomous",
        631: "Vindictive",
        632: "Vulnerable",
        633: "Weak",
        634: "Weak-willed",
        635: "Well-meaning",
        636: "Willful",
        637: "Wishful",
        638: "Zany",
    }

    return tokenPersonality[Math.floor(Math.random() * 638) + 1];

}
