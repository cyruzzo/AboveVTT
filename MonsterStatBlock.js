
function build_and_display_stat_block_with_id(monsterId, container, tokenId, callback, open5e=false) {


    let cachedMonsterItem = open5e ? cached_open5e_items[monsterId] : cached_monster_items[monsterId];
    if (cachedMonsterItem) {
      display_stat_block_in_container(new MonsterStatBlock(cachedMonsterItem.monsterData), container, tokenId);
      if (callback) {
          callback();
      }
    } else {
        fetch_and_cache_monsters([monsterId], function (open5e = false) {
            if(!open5e){

              display_stat_block_in_container(new MonsterStatBlock(cached_monster_items[monsterId].monsterData), container, tokenId);
            }
            else{
              display_stat_block_in_container(new MonsterStatBlock(cached_open5e_items[monsterId].monsterData), container, tokenId);
            }
            if (callback) {
                callback();
            }
        }, open5e);
    }
}

function build_and_display_stat_block_with_data(monsterData, container, tokenId, open5e=false) {
    let cachedMonsterItem = cached_monster_items[monsterData.id];
    if (cachedMonsterItem) {
        // we have a cached monster. this data is the best data we have so display that instead of whatever we were given
        display_stat_block_in_container(new MonsterStatBlock(cachedMonsterItem.monsterData), container, tokenId);
    } else {
        // the monster data that we get from searching monsters (everything in the sidebar)
        // is not as good as the data we get from fetching the monster directly so
        // build with what the listItem has on it, then fetch more details, then re-render it with the updated details
        display_stat_block_in_container(new MonsterStatBlock(monsterData), container, tokenId);
        let monsterId = (monsterData.slug) ? monsterData.slug : monsterData.id
        fetch_and_cache_monsters([monsterId], function (open5e = false) {
          if(!open5e){
            display_stat_block_in_container(new MonsterStatBlock(cached_monster_items[monsterId].monsterData), container, tokenId);
          }
          else{
            display_stat_block_in_container(new MonsterStatBlock(cached_open5e_items[monsterId].monsterData), container, tokenId);}
        }, open5e);
    }
}

function build_stat_block_for_copy(listItem, options){
  const monsterData = listItem.monsterData;
  let cachedMonsterItem = cached_monster_items[monsterData.id];
    if (cachedMonsterItem) {
        // we have a cached monster. this data is the best data we have so display that instead of whatever we were given
        create_token_inside(find_sidebar_list_item_from_path(RootFolder.MyTokens.path), undefined, undefined, undefined, options, build_monster_copy_stat_block(new MonsterStatBlock(cachedMonsterItem.monsterData)));
    } else {
       let monsterId = (monsterData.slug) ? monsterData.slug : monsterData.id
        fetch_and_cache_monsters([monsterId], function () {
           create_token_inside(find_sidebar_list_item_from_path(RootFolder.MyTokens.path), undefined, undefined, undefined, options, build_monster_copy_stat_block(new MonsterStatBlock(cached_monster_items[monsterId].monsterData)));
        }, false);
    }
}

function display_stat_block_in_container(statBlock, container, tokenId, customStatBlock = undefined) {
    const token = window.TOKEN_OBJECTS[tokenId];
    const html = (customStatBlock) ? $(`
    <div class="container avtt-stat-block-container custom-stat-block">${customStatBlock}</div>`) : build_monster_stat_block(statBlock, token);
    container.find("#noAccessToContent").remove(); // in case we're re-rendering with better data
    container.find(".avtt-stat-block-container").remove(); // in case we're re-rendering with better data
    container.append(html);
    if(customStatBlock){
      window.JOURNAL.translateHtmlAndBlocks(html)
      add_journal_roll_buttons(html, tokenId);
      window.JOURNAL.add_journal_tooltip_targets(html);

      
      $(container).find('.add-input').each(function(){
        let numberFound = $(this).attr('data-number');
        const spellName = $(this).attr('data-spell');
        const remainingText = $(this).hasClass('each') ? '' : `${spellName} slots remaining`

        if (token.options.abilityTracker?.[spellName]>= 0){
          numberFound = token.options.abilityTracker[spellName]
        } else{
          token.track_ability(spellName, numberFound)
        }
        let input = createCountTracker(token, spellName, numberFound, remainingText, "");
        $(this).find('p').remove();
        $(this).after(input)
      })
      container.find(`.avtt-stat-block-container`).append(`<div class="image" style="display: block;"><${(token.options.videoToken == true || ['.mp4', '.webm','.m4v'].some(d => token.options.imgsrc.includes(d))) ? 'video disableremoteplayback muted' : 'img'}
            src="${token.options.imgsrc}"
            class="monster-image"
            style="max-width: 100%;">
            </div>
            <div style="display:flex;flex-direction:row;width:100%;justify-content:space-between;padding:10px;">
                <a id="monster-image-to-gamelog-link" class="ddbeb-button monster-details-link" href="${token.options.imgsrc}" target='_blank' >Send Image To Gamelog</a>
            </div>`)
    }
    container.find("#monster-image-to-gamelog-link").on("click", function (e) {
        e.stopPropagation();
        e.preventDefault();
        const imgContainer = $(e.target).parent().prev();
        imgContainer.find("img, video").attr("href", imgContainer.find("img, video").attr("src"));
        imgContainer.find("img, video").addClass("magnify");
        send_html_to_gamelog(imgContainer[0].outerHTML);
    });

   
    container.find("p>em>strong, p>strong>em").off("contextmenu.sendToGamelog").on("contextmenu.sendToGamelog", function (e) {
      e.preventDefault();
      if(e.altKey || e.shiftKey || e.ctrlKey || e.metaKey)
        return;
      let outerP = event.target.closest('p').outerHTML;
      const regExFeature = new RegExp(`<p(.+)?>.+(${event.target.outerHTML.replace(/([\(\)])/g,"\\$1")}.+?)(</p>|<br ?/?>|<p>)`, 'gi');
      let matched = `<p>${outerP.matchAll(regExFeature).next().value[2]}</p>`;
      send_html_to_gamelog(matched);
    })

    container.find("p>em>strong, p>strong>em").off("click.roll").on("click.roll", function (e) {
      e.preventDefault();
      if($(event.target).text().includes('Recharge'))
        return;
      let rollButtons = $(event.target.closest('p')).find('.avtt-roll-button');
      const displayName = window.TOKEN_OBJECTS[tokenId] ? window.TOKEN_OBJECTS[tokenId].options?.revealname == true ? window.TOKEN_OBJECTS[tokenId].options.name : `` : target.find(".mon-stat-block__name-link").text(); // Wolf, Owl, etc
      const creatureAvatar = window.TOKEN_OBJECTS[tokenId]?.options.imgsrc || statBlock.data.avatarUrl;

      for(let i = 0; i<rollButtons.length; i++){      
        let data = getRollData(rollButtons[i]);
        let diceRoll;

        if(data.expression != undefined){
          if (/^1d20[+-]([0-9]+)/g.test(data.expression)) {
             if(e.altKey){
                if(e.shiftKey){
                  diceRoll = new DiceRoll(`3d20kh1${data.modifier}`, data.rollTitle, data.rollType, displayName, creatureAvatar, "monster");
                 }
                 else if(e.ctrlKey || e.metaKey){
                  diceRoll = new DiceRoll(`3d20kl1${data.modifier}`, data.rollTitle, data.rollType, displayName, creatureAvatar, "monster");
                 }
             }
             else if(e.shiftKey){
              diceRoll = new DiceRoll(`2d20kh1${data.modifier}`, data.rollTitle, data.rollType, displayName, creatureAvatar, "monster");
             }
             else if(e.ctrlKey || e.metaKey){
              diceRoll = new DiceRoll(`2d20kl1${data.modifier}`, data.rollTitle, data.rollType, displayName, creatureAvatar, "monster");
             }else{
              diceRoll = new DiceRoll(data.expression, data.rollTitle, data.rollType, displayName, creatureAvatar, "monster")
             }
          }
          else{
            diceRoll = new DiceRoll(data.expression, data.rollTitle, data.rollType, displayName, creatureAvatar, "monster")
          }
        

 
          window.diceRoller.roll(diceRoll, true, undefined, undefined, undefined, data.damageType);

        }
      }
    })


    if(!customStatBlock)
      container.find("div.image").append(statBlock.imageHtml(token));
    container.find("a").attr("target", "_blank"); // make sure we only open links in new tabs
    if(!customStatBlock)
      scan_monster(container, statBlock, tokenId);
    else
      add_ability_tracker_inputs(container, tokenId)
    // scan_creature_pane(container, statBlock.name, statBlock.image);
    add_stat_block_hover(container);

    let abilities = container.find("p>em>strong, p>strong>em");
    for(let i = 0; i<abilities.length; i++){
      if($(abilities[i]).closest('p').find('.avtt-roll-button').length>0 && !$(abilities[i]).closest('p').text().includes('Recharge')){
        $(abilities[i]).toggleClass('avtt-ability-roll-button', true);
      }
    }
    $("span.hideme").parent().parent().hide();
}

function build_monster_stat_block(statBlock, token) {
    if (!statBlock.userHasAccess) {
        return `<div id='noAccessToContent' style='height: 100%;text-align: center;width: 100%;padding: 10px;font-weight: bold;color: #944;'>You do not have access to this content on DndBeyond.</div>`;
    }
    return `
<div class="container avtt-stat-block-container ${(statBlock.data.slug) ? 'open5eMonster' : ''}">
  <div id="content" class="main content-container" style="padding:0!important">
    <section class="primary-content" role="main">

      <div class="monster-details">

        <div class="more-info details-more-info" style="padding: 2px;">
          <div class="detail-content">

            <div class="mon-stat-block ddbc-creature-block" style="column-count: 1;margin:0;">
              <div class="mon-stat-block__header ddbc-creature-block__header">
                <div class="mon-stat-block__name ddbc-creature-block__name">
                  <a class="mon-stat-block__name-link ddbc-creature-block__name-link" href="${statBlock.data.url}" target="_blank">
                    ${statBlock.data.name}
                  </a>
                </div>

                <div class="mon-stat-block__meta ddbc-creature-block__meta">${statBlock.sizeName} ${statBlock.monsterTypeHtml}, ${statBlock.alignmentName}</div>
              </div>
              <div class="mon-stat-block__separator ddbc-creature-block__separator">
                <img class="mon-stat-block__separator-img ddbc-creature-block__separator-img" alt="" src="https://media-waterdeep.cursecdn.com/file-attachments/0/579/stat-block-header-bar.svg">
              </div>
              <div class="mon-stat-block__attributes">
                <div class="mon-stat-block__attribute ddbc-creature-block__attribute">
                  <span class="mon-stat-block__attribute-label ddbc-creature-block__attribute-label">Armor Class</span>
                  <span class="mon-stat-block__attribute-value">
                    <span class="mon-stat-block__attribute-data-value">
                        ${statBlock.data.armorClass}
                    </span>
                    <span class="mon-stat-block__attribute-data-extra ddbc-creature-block__attribute-data-extra">
                        ${statBlock.data.armorClassDescription}
                    </span>
                  </span>
                </div>
                <div class="mon-stat-block__attribute ddbc-creature-block__attribute">
                  <span class="mon-stat-block__attribute-label ddbc-creature-block__attribute-label">Hit Points</span>
                  <span class="mon-stat-block__attribute-data">
                    <span class="mon-stat-block__attribute-data-value">
                        ${statBlock.data.averageHitPoints}
                    </span>
                    <span class="mon-stat-block__attribute-data-extra ddbc-creature-block__attribute-data-extra">
                        (${statBlock.data.hitPointDice.diceString})
                    </span>
                  </span>
                </div>
                <div class="mon-stat-block__attribute ddbc-creature-block__attribute">
                  <span class="mon-stat-block__attribute-label">Speed</span>
                  <span class="mon-stat-block__attribute-data">
                    <span class="mon-stat-block__attribute-data-value">
                        ${statBlock.speedDescription}
                    </span>
                  </span>
                </div>
              </div>
              <div class="mon-stat-block__stat-block">
                <div class="mon-stat-block__separator">
                  <img class="mon-stat-block__separator-img" alt="" src="https://media-waterdeep.cursecdn.com/file-attachments/0/579/stat-block-header-bar.svg">
                </div>
                <div class="ability-block ddbc-creature-block__abilities">
                  <div class="ability-block__stat ability-block__stat--str ddbc-creature-block__ability-stat">
                    <div class="ability-block__heading ddbc-creature-block__ability-heading">STR</div>
                    <div class="ability-block__data">
                      <span class="ability-block__score">${statBlock.str}</span>
                      <span class="ability-block__modifier ddbc-creature-block__ability-modifier">${statBlock.statButton(statBlock.str, "STR")}</span>
                    </div>
                  </div>
                  <div class="ability-block__stat ability-block__stat--dex ddbc-creature-block__ability-stat">
                    <div class="ability-block__heading ddbc-creature-block__ability-heading">DEX</div>
                    <div class="ability-block__data">
                      <span class="ability-block__score">${statBlock.dex}</span>
                      <span class="ability-block__modifier ddbc-creature-block__ability-modifier">${statBlock.statButton(statBlock.dex, "DEX")}</span>
                    </div>
                  </div>
                  <div class="ability-block__stat ability-block__stat--con ddbc-creature-block__ability-stat">
                    <div class="ability-block__heading ddbc-creature-block__ability-heading">CON</div>
                    <div class="ability-block__data">
                      <span class="ability-block__score">${statBlock.con}</span>
                      <span class="ability-block__modifier ddbc-creature-block__ability-modifier">${statBlock.statButton(statBlock.con, "CON")}</span>
                    </div>
                  </div>
                  <div class="ability-block__stat ability-block__stat--int ddbc-creature-block__ability-stat">
                    <div class="ability-block__heading ddbc-creature-block__ability-heading">INT</div>
                    <div class="ability-block__data">
                      <span class="ability-block__score">${statBlock.int}</span>
                      <span class="ability-block__modifier ddbc-creature-block__ability-modifier">${statBlock.statButton(statBlock.int, "INT")}</span>
                    </div>
                  </div>
                  <div class="ability-block__stat ability-block__stat--wis ddbc-creature-block__ability-stat">
                    <div class="ability-block__heading ddbc-creature-block__ability-heading">WIS</div>
                    <div class="ability-block__data">
                      <span class="ability-block__score">${statBlock.wis}</span>
                      <span class="ability-block__modifier ddbc-creature-block__ability-modifier">${statBlock.statButton(statBlock.wis, "WIS")}</span>
                    </div>
                  </div>
                  <div class="ability-block__stat ability-block__stat--cha ddbc-creature-block__ability-stat">
                    <div class="ability-block__heading ddbc-creature-block__ability-heading">CHA</div>
                    <div class="ability-block__data">
                      <span class="ability-block__score">${statBlock.cha}</span>
                      <span class="ability-block__modifier ddbc-creature-block__ability-modifier">${statBlock.statButton(statBlock.cha, "CHA")}</span>
                    </div>
                  </div>
                </div>
                <div class="mon-stat-block__separator">
                  <img class="mon-stat-block__separator-img" alt="" src="https://media-waterdeep.cursecdn.com/file-attachments/0/579/stat-block-header-bar.svg">
                </div>
              </div>
              <div class="mon-stat-block__tidbits">

                <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                  <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Saving Throws</span>
                  <span class="mon-stat-block__tidbit-data">
                    ${statBlock.savingThrowsHtml}
                  </span>
                </div>

                <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                  <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Skills</span>
                  <span class="mon-stat-block__tidbit-data">
                    ${statBlock.skillsHtml}
                  </span>
                </div>
                <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                  <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Damage Vulnerabilities</span>
                  <span class="mon-stat-block__tidbit-data">
                    ${statBlock.damageVulnerabilitiesHtml}
                  </span>
                </div>
                <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                  <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Damage Resistances</span>
                  <span class="mon-stat-block__tidbit-data">
                    ${statBlock.damageResistancesHtml}
                  </span>
                </div>

                <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                  <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Damage Immunities</span>
                  <span class="mon-stat-block__tidbit-data">
                    ${statBlock.damageImmunitiesHtml}
                  </span>
                </div>

                <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                  <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Condition Immunities</span>
                  <span class="mon-stat-block__tidbit-data">
                    ${statBlock.conditionImmunitiesHtml}
                  </span>
                </div>

                <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                  <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Senses</span>
                  <span class="mon-stat-block__tidbit-data">
                    ${statBlock.sensesHtml}
                  </span>
                </div>

                <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                  <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Languages</span>
                  <span class="mon-stat-block__tidbit-data">
                    ${statBlock.languagesHtml}
                  </span>
                </div>

                <div class="mon-stat-block__tidbit-container">
                  <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                    <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Challenge</span>
                    <span class="mon-stat-block__tidbit-data">
                      ${statBlock.challengeRatingHtml}
                    </span>
                  </div>

                  <div class="mon-stat-block__tidbit-spacer"></div>
                  <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                    <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Proficiency Bonus</span>
                    <span class="mon-stat-block__tidbit-data">
                        ${statBlock.proficiencyBonusHtml}
                    </span>
                  </div>

                </div>

              </div>

              <div class="mon-stat-block__separator">
                <img class="mon-stat-block__separator-img" alt="" src="https://media-waterdeep.cursecdn.com/file-attachments/0/579/stat-block-header-bar.svg">
              </div>
              
              <div class="mon-stat-block__description-blocks ddbc-creature-block__description-blocks">

                <div class="mon-stat-block__description-block ddbc-creature-block__description-block">
                  <div class="mon-stat-block__description-block-content">
                    ${statBlock.specialTraitsDescription}
                  </div>
                </div>

                <div class="mon-stat-block__description-block ddbc-creature-block__description-block">
                  <div class="mon-stat-block__description-block-heading ddbc-creature-block__description-block-heading">Actions</div>
                  <div class="mon-stat-block__description-block-content">
                    ${statBlock.actionsDescription}
                  </div>
                </div>
                
                <div class="mon-stat-block__description-block ddbc-creature-block__description-block">
                    <div class="mon-stat-block__description-block-heading ddbc-creature-block__description-block-heading">Bonus Actions</div>
                    <div class="mon-stat-block__description-block-content">
                      ${statBlock.bonusActionsDescription}
                    </div>
                </div>

                <div class="mon-stat-block__description-block ddbc-creature-block__description-block">
                    <div class="mon-stat-block__description-block-heading ddbc-creature-block__description-block-heading">Reactions</div>
                    <div class="mon-stat-block__description-block-content">
                      ${statBlock.reactionsDescription}
                    </div>
                </div>

                <div class="mon-stat-block__description-block ddbc-creature-block__description-block">
                    <div class="mon-stat-block__description-block-heading ddbc-creature-block__description-block-heading">Legendary Actions</div>
                    <div class="mon-stat-block__description-block-content">
                      ${statBlock.legendaryActionsDescription}
                    </div>
                </div>

                <div class="mon-stat-block__description-block ddbc-creature-block__description-block">
                    <div class="mon-stat-block__description-block-heading ddbc-creature-block__description-block-heading">Mythic Actions</div>
                    <div class="mon-stat-block__description-block-content">
                      ${statBlock.mythicActionsDescription}
                    </div>
                </div>


              </div>
            </div>




            <div class="image" style="display: block;"></div>
            <div style="display:flex;flex-direction:row;width:100%;justify-content:space-between;padding:10px;">
                <a class="ddbeb-button monster-details-link" href="${statBlock.data.url}" target='_blank' >View Details Page</a>
                <a id="monster-image-to-gamelog-link" class="ddbeb-button monster-details-link" href="${token?.options?.imgsrc == statBlock.data.avatarUrl || token?.options?.imgsrc == undefined ? statBlock.data.largeAvatarUrl : token.options.imgsrc}" target='_blank' >Send Image To Gamelog</a>
            </div>


            <div class="more-info-content" style="padding:10px;">

              <div class="mon-details__description-block">
                <h3 class="mon-details__description-block-heading">Description</h3>
                <div class="mon-details__description-block-content">
                    ${statBlock.characteristicsDescription}
                </div>
              </div>
              
              <div class="mon-details__description-block">
                <div class="mon-details__description-block-content">
                    ${statBlock.lairDescription}
                </div>
              </div>
              
              

            </div>

            <footer>
                ${statBlock.sourceBookHtml}
            </footer>

          </div>
        </div>
      </div>
    </section>
  </div>
</div>
`;
}
function build_monster_copy_stat_block(statBlock) {
    if (!statBlock.userHasAccess) {
        return `<div id='noAccessToContent' style='height: 100%;text-align: center;width: 100%;padding: 10px;font-weight: bold;color: #944;'>You do not have access to this content on DndBeyond.</div>`;
    }
    return `
<div class="container ${(statBlock.data.slug) ? 'open5eMonster' : ''}">
  <div id="content" class="main content-container" style="padding:0!important">
    <section class="primary-content" role="main">

      <div class="monster-details">

        <div class="more-info details-more-info" style="padding: 2px;">
          <div class="detail-content">

            <div class="mon-stat-block ddbc-creature-block" style="column-count: 1;margin:0;">
              <div class="mon-stat-block__header ddbc-creature-block__header">
                <div class="mon-stat-block__name ddbc-creature-block__name">
                  <a class="mon-stat-block__name-link ddbc-creature-block__name-link" href="${statBlock.data.url}" target="_blank">
                    ${statBlock.data.name}
                  </a>
                </div>

                <div class="mon-stat-block__meta ddbc-creature-block__meta">${statBlock.sizeName} ${statBlock.monsterTypeHtml}, ${statBlock.alignmentName}</div>
              </div>
              <div class="mon-stat-block__separator ddbc-creature-block__separator">
                <img class="mon-stat-block__separator-img ddbc-creature-block__separator-img" alt="" src="https://media-waterdeep.cursecdn.com/file-attachments/0/579/stat-block-header-bar.svg">
              </div>
              <div class="mon-stat-block__attributes">
                <div class="mon-stat-block__attribute ddbc-creature-block__attribute">
                  <span class="mon-stat-block__attribute-label ddbc-creature-block__attribute-label">Armor Class</span>
                  <span class="mon-stat-block__attribute-value">
                    <span class="mon-stat-block__attribute-data-value">
                        ${statBlock.data.armorClass}
                    </span>
                    <span class="mon-stat-block__attribute-data-extra ddbc-creature-block__attribute-data-extra">
                        ${statBlock.data.armorClassDescription}
                    </span>
                  </span>
                </div>
                <div class="mon-stat-block__attribute ddbc-creature-block__attribute">
                  <span class="mon-stat-block__attribute-label ddbc-creature-block__attribute-label">Hit Points</span>
                  <span class="mon-stat-block__attribute-data">
                    <span class="mon-stat-block__attribute-data-value">
                        ${statBlock.data.averageHitPoints}
                    </span>
                    <span class="mon-stat-block__attribute-data-extra ddbc-creature-block__attribute-data-extra">
                        (${statBlock.data.hitPointDice.diceString})
                    </span>
                  </span>
                </div>
                <div class="mon-stat-block__attribute ddbc-creature-block__attribute">
                  <span class="mon-stat-block__attribute-label">Speed</span>
                  <span class="mon-stat-block__attribute-data">
                    <span class="mon-stat-block__attribute-data-value">
                        ${statBlock.speedDescription}
                    </span>
                  </span>
                </div>
              </div>
              <div class="mon-stat-block__stat-block">
                <div class="mon-stat-block__separator">
                  <img class="mon-stat-block__separator-img" alt="" src="https://media-waterdeep.cursecdn.com/file-attachments/0/579/stat-block-header-bar.svg">
                </div>
                <div class="ability-block ddbc-creature-block__abilities">
                  <div class="ability-block__stat ability-block__stat--str ddbc-creature-block__ability-stat">
                    <div class="ability-block__heading ddbc-creature-block__ability-heading">STR</div>
                    <div class="ability-block__data">
                      <span class="ability-block__score">${statBlock.str}</span>
                      <span class="ability-block__modifier ddbc-creature-block__ability-modifier">${statBlock.statButton(statBlock.str, "STR")}</span>
                    </div>
                  </div>
                  <div class="ability-block__stat ability-block__stat--dex ddbc-creature-block__ability-stat">
                    <div class="ability-block__heading ddbc-creature-block__ability-heading">DEX</div>
                    <div class="ability-block__data">
                      <span class="ability-block__score">${statBlock.dex}</span>
                      <span class="ability-block__modifier ddbc-creature-block__ability-modifier">${statBlock.statButton(statBlock.dex, "DEX")}</span>
                    </div>
                  </div>
                  <div class="ability-block__stat ability-block__stat--con ddbc-creature-block__ability-stat">
                    <div class="ability-block__heading ddbc-creature-block__ability-heading">CON</div>
                    <div class="ability-block__data">
                      <span class="ability-block__score">${statBlock.con}</span>
                      <span class="ability-block__modifier ddbc-creature-block__ability-modifier">${statBlock.statButton(statBlock.con, "CON")}</span>
                    </div>
                  </div>
                  <div class="ability-block__stat ability-block__stat--int ddbc-creature-block__ability-stat">
                    <div class="ability-block__heading ddbc-creature-block__ability-heading">INT</div>
                    <div class="ability-block__data">
                      <span class="ability-block__score">${statBlock.int}</span>
                      <span class="ability-block__modifier ddbc-creature-block__ability-modifier">${statBlock.statButton(statBlock.int, "INT")}</span>
                    </div>
                  </div>
                  <div class="ability-block__stat ability-block__stat--wis ddbc-creature-block__ability-stat">
                    <div class="ability-block__heading ddbc-creature-block__ability-heading">WIS</div>
                    <div class="ability-block__data">
                      <span class="ability-block__score">${statBlock.wis}</span>
                      <span class="ability-block__modifier ddbc-creature-block__ability-modifier">${statBlock.statButton(statBlock.wis, "WIS")}</span>
                    </div>
                  </div>
                  <div class="ability-block__stat ability-block__stat--cha ddbc-creature-block__ability-stat">
                    <div class="ability-block__heading ddbc-creature-block__ability-heading">CHA</div>
                    <div class="ability-block__data">
                      <span class="ability-block__score">${statBlock.cha}</span>
                      <span class="ability-block__modifier ddbc-creature-block__ability-modifier">${statBlock.statButton(statBlock.cha, "CHA")}</span>
                    </div>
                  </div>
                </div>
                <div class="mon-stat-block__separator">
                  <img class="mon-stat-block__separator-img" alt="" src="https://media-waterdeep.cursecdn.com/file-attachments/0/579/stat-block-header-bar.svg">
                </div>
              </div>
              <div class="mon-stat-block__tidbits">
                ${$(`<div>${statBlock.savingThrowsHtml}</div>`).text() != '' ? `
                 <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                  <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Saving Throws</span>
                  <span class="mon-stat-block__tidbit-data">
                    ${statBlock.savingThrowsHtml}
                  </span>
                </div>
                `: ''}  
               
                ${$(`<div>${statBlock.skillsHtml}</div>`).text() != '' ? `
                  <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                    <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Skills</span>
                    <span class="mon-stat-block__tidbit-data">
                      ${statBlock.skillsHtml}
                    </span>
                  </div>
                `: ''}

                ${$(`<div>${statBlock.damageVulnerabilitiesHtml}</div>`).text() != '' ? `
                  <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                    <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Damage Vulnerabilities</span>
                    <span class="mon-stat-block__tidbit-data">
                      ${statBlock.damageVulnerabilitiesHtml}
                    </span>
                  </div>
                `: ''}

                ${$(`<div>${statBlock.damageResistancesHtml}</div>`).text() != '' ? `
                  <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                    <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Damage Resistances</span>
                    <span class="mon-stat-block__tidbit-data">
                      ${statBlock.damageResistancesHtml}
                    </span>
                  </div>
                `: ''}

                ${$(`<div>${statBlock.damageImmunitiesHtml}</div>`).text() != '' ? `
                  <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                    <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Damage Immunities</span>
                    <span class="mon-stat-block__tidbit-data">
                      ${statBlock.damageImmunitiesHtml}
                    </span>
                  </div>
                `: ''}

                ${$(`<div>${statBlock.conditionImmunitiesHtml}</div>`).text() != '' ? `
                  <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                    <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Condition Immunities</span>
                    <span class="mon-stat-block__tidbit-data">
                      ${statBlock.conditionImmunitiesHtml}
                    </span>
                  </div>
                `: ''}

                ${$(`<div>${statBlock.sensesHtml}</div>`).text() ? `
                  <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                    <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Senses</span>
                    <span class="mon-stat-block__tidbit-data">
                      ${statBlock.sensesHtml}
                    </span>
                  </div>
                `: ''}


                <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                  <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Languages</span>
                  <span class="mon-stat-block__tidbit-data">
                    ${statBlock.languagesHtml}
                  </span>
                </div>

                <div class="mon-stat-block__tidbit-container">
                  <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                    <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Challenge</span>
                    <span class="mon-stat-block__tidbit-data">
                      ${statBlock.challengeRatingHtml}
                    </span>
                  </div>

                  <div class="mon-stat-block__tidbit-spacer"></div>
                  <div class="mon-stat-block__tidbit ddbc-creature-block__tidbit">
                    <span class="mon-stat-block__tidbit-label ddbc-creature-block__tidbit-label">Proficiency Bonus</span>
                    <span class="mon-stat-block__tidbit-data">
                        ${statBlock.proficiencyBonusHtml}
                    </span>
                  </div>

                </div>

              </div>

              <div class="mon-stat-block__separator">
                <img class="mon-stat-block__separator-img" alt="" src="https://media-waterdeep.cursecdn.com/file-attachments/0/579/stat-block-header-bar.svg">
              </div>
              
              <div class="mon-stat-block__description-blocks ddbc-creature-block__description-blocks">
                ${$(`<div>${statBlock.specialTraitsDescription}</div>`).text() != '' ? `
                  <div class="mon-stat-block__description-block ddbc-creature-block__description-block">
                    <div class="mon-stat-block__description-block-content">
                      ${statBlock.specialTraitsDescription}
                    </div>
                  </div>
                `: ''}

                ${$(`<div>${statBlock.actionsDescription}</div>`).text() != '' ? `
                  <div class="mon-stat-block__description-block ddbc-creature-block__description-block">
                    <div class="mon-stat-block__description-block-heading ddbc-creature-block__description-block-heading">Actions</div>
                    <div class="mon-stat-block__description-block-content">
                      ${statBlock.actionsDescription}
                    </div>
                  </div>
                `: ''}

                ${$(`<div>${statBlock.bonusActionsDescription}</div>`).text() != '' ? `
                  <div class="mon-stat-block__description-block ddbc-creature-block__description-block">
                      <div class="mon-stat-block__description-block-heading ddbc-creature-block__description-block-heading">Bonus Actions</div>
                      <div class="mon-stat-block__description-block-content">
                        ${statBlock.bonusActionsDescription}
                      </div>
                  </div>
                `: ''} 
    
                ${$(`<div>${statBlock.reactionsDescription}</div>`).text() != '' ? `
                  <div class="mon-stat-block__description-block ddbc-creature-block__description-block">
                      <div class="mon-stat-block__description-block-heading ddbc-creature-block__description-block-heading">Reactions</div>
                      <div class="mon-stat-block__description-block-content">
                        ${statBlock.reactionsDescription}
                      </div>
                  </div>
                `: ''}

                ${$(`<div>${statBlock.legendaryActionsDescription}</div>`).text() != '' ? `
                  <div class="mon-stat-block__description-block ddbc-creature-block__description-block">
                      <div class="mon-stat-block__description-block-heading ddbc-creature-block__description-block-heading">Legendary Actions</div>
                      <div class="mon-stat-block__description-block-content">
                        ${statBlock.legendaryActionsDescription}
                      </div>
                  </div>
                `: ''}

                ${$(`<div>${statBlock.mythicActionsDescription}</div>`).text() != '' ? `
                  <div class="mon-stat-block__description-block ddbc-creature-block__description-block">
                      <div class="mon-stat-block__description-block-heading ddbc-creature-block__description-block-heading">Mythic Actions</div>
                      <div class="mon-stat-block__description-block-content">
                        ${statBlock.mythicActionsDescription}
                      </div>
                  </div>
                `: ''}

              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</div>
`;
}
class MonsterStatBlock {
    constructor(data) {
        this.data = data;
    }

    findObj(key, id) {
        return window.ddbConfigJson[key]?.find(obj => obj.id === id);
    }

    get userHasAccess() {
        return this.data.isReleased || this.data.isHomebrew;
    }

    get hitPointDiceString() {
        return this.data.hitPointDice?.diceString || "";
    }

    get sizeObj() {
        return this.findObj("creatureSizes", this.data.sizeId);
    }
    get sizeName() {
        return this.data.size || this.sizeObj?.name || "";
    }
    get typeObj() {
        return this.findObj("monsterTypes", this.data.typeId);
    }
    get typeName() {
        return this.data.type || this.typeObj?.name || "";
    }
    get monsterTypeHtml() {
        if (!this.data.subTypes || this.data.subTypes.length === 0) {
            return this.typeName;
        }
        const subtypeString = this.data.subTypes.map(id => this.findObj("monsterSubTypes", id).name).join(", ");
        return `${this.typeName} (${subtypeString})`
    }

    get alignmentObj() {
        return this.findObj("alignments", this.data.alignmentId);
    }
    get alignmentName() {
        return this.data.alignment || this.alignmentObj?.name || "";
    }

    get speedDescription() {
        return this.data.movements.map(m => {
            const obj = this.findObj("movements", m.movementId);
            if (obj.name === "Walk") {
                return `${m.speed} ft.`; // DDB doesn't display the "walk" label
            } else {
                return `${obj.name.toLowerCase()} ${m.speed} ft.`;
            }
        }).join(", ");
    }

    getStatById(id) {
        return this.data.stats.find(s => s.statId === id);
    }
    getStatValueById(id) {
        return this.getStatById(id)?.value || 10;
    }

    get str() { return this.getStatValueById(1); }
    get dex() { return this.getStatValueById(2); }
    get con() { return this.getStatValueById(3); }
    get int() { return this.getStatValueById(4); }
    get wis() { return this.getStatValueById(5); }
    get cha() { return this.getStatValueById(6); }

    get strMod() { return this.modInt(this.str); }
    get dexMod() { return this.modInt(this.dex); }
    get conMod() { return this.modInt(this.con); }
    get intMod() { return this.modInt(this.int); }
    get wisMod() { return this.modInt(this.wis); }
    get chaMod() { return this.modInt(this.cha); }

    get strModString() { return this.modString(this.str); }
    get dexModString() { return this.modString(this.dex); }
    get conModString() { return this.modString(this.con); }
    get intModString() { return this.modString(this.int); }
    get wisModString() { return this.modString(this.wis); }
    get chaModString() { return this.modString(this.cha); }

    modInt(value) {
        if (isNaN(value)) {
            return 0; // not sure what to do here... send a number
        }
        return Math.floor( (value - 10) / 2);
    }
    modString(value) {
        const m = this.modInt(value);
        if (m < 0) {
            return `${m}`;
        } else {
            return `+${m}`;
        }
    }
    statButton(value, stat) {
        return this.rollButton("1d20", this.modString(value), "check", stat, true);
    }

    rollButton(expression, modifier, rollType, actionType, parenthesis = false) {
        const displayText = parenthesis ? `(${modifier})` : modifier;
        return `<button 
            data-exp="${expression}"
            data-mod="${modifier}"
            data-rolltype="${rollType}"
            data-actiontype="${actionType}"
            class="avtt-roll-button">${displayText}</button>`;
    }

    get proficiencyBonus() {
        return this.findObj("challengeRatings", this.data.challengeRatingId)?.proficiencyBonus || 2;
    }

    get savingThrowsHtml() {
        if (!this.data.savingThrows || this.data.savingThrows.length === 0) {
            return "<span class='hideme'></span>";
        }
        return this.data.savingThrows.map(st => {
            const statDefinition = this.findObj("stats", st.statId);
            const statValue = this.getStatValueById(st.statId);
            const bonusMod = st.bonusModifier || 0;
            const statModInt = this.modInt(statValue) + this.proficiencyBonus + bonusMod;
            const statModString = statModInt >= 0 ? `+${statModInt}` : `${statModInt}`;
            console.debug(`savingThrowsHtml`, statValue, bonusMod, statModString, statDefinition);
            return `${statDefinition.key} ${this.rollButton("1d20", statModString, "save", statDefinition.key)}`
        }).join(", ");
    }

    get skillsHtml() {
        if (typeof this.data.skillsHtml === "string" && this.data.skillsHtml.length > 0) {
            return this.data.skillsHtml; // data.skills isn't always correct. Or at least wasn't correct for Vecna
        }
        // we do this instead of using `data.skillsHtml` so we can alphabetize, but more importantly so we can inject the specific roll buttons
        if (!this.data.skills || this.data.skills.length === 0) {
            return "<span class='hideme'></span>";
        }
        return this.data.skills
            .map(s => {
                const definition = this.findObj("abilitySkills", s.skillId);
                const bonus = s.additionalBonus || 0;
                const total = s.value + bonus;
                const modifierString = total >= 0 ? `+${total}` : `${total}`;
                return { id: definition.id, modifierString: modifierString, name: definition.name };
            })
            .sort((lhs, rhs) => lhs.name.localeCompare(rhs.name))
            .map(obj => {
                const link = `<a class="tooltip-hover" href="/compendium/rules/basic-rules/using-ability-scores#${obj.name}" data-tooltip-href="//www.dndbeyond.com/skills/${obj.id}-tooltip?disable-webm=1&amp;disable-webm=1" target="_blank">${obj.name}</a>`
                const button = this.rollButton("1d20", obj.modifierString, "check", obj.name);
                return `${link} ${button}`;
            })
            .join(", ");
    }

    damageAdjustmentsHtml(damageAdjustmentType) {
        if (!this.data.damageAdjustments || this.data.damageAdjustments.length === 0) {
            return "<span class='hideme'></span>";
        }
        const objects = this.data.damageAdjustments
            .map(id => this.findObj("damageAdjustments", id))
            .filter(obj => obj.type === damageAdjustmentType)
            .sort((lhs, rhs) => lhs.displayOrder - rhs.displayOrder);
        if (!objects || objects.length === 0) {
            return "<span class='hideme'></span>";
        }
        return objects.map(obj => obj.name).join(", ");
    }
    get damageVulnerabilitiesHtml() {
        if(this.data.damage_vulnerabilities){
          return this.data.damage_vulnerabilities.replace(/(?:^|\s)\w/g, function(match) {
              return match.toUpperCase();
          });
        }
        return this.damageAdjustmentsHtml(DAMAGE_ADJUSTMENT_TYPE_VULNERABILITIES);
    }
    get damageResistancesHtml() {
        if(this.data.damage_resistances){
          return this.data.damage_resistances.replace(/(?:^|\s)\w/g, function(match) {
              return match.toUpperCase();
          });
        }
        return this.damageAdjustmentsHtml(DAMAGE_ADJUSTMENT_TYPE_RESISTANCE);
    }
    get damageImmunitiesHtml() {
        if(this.data.damage_immunities){
          return this.data.damage_immunities.replace(/(?:^|\s)\w/g, function(match) {
              return match.toUpperCase();
          });
        }
        return this.damageAdjustmentsHtml(DAMAGE_ADJUSTMENT_TYPE_IMMUNITY);
    }

    get conditionImmunitiesHtml() {
        if(this.data.condition_immunities){
          return this.data.condition_immunities.replace(/(?:^|\s)\w/g, function(match) {
              return match.toUpperCase();
          });
        }
        if (this.data.conditionImmunitiesHtml === "string" && this.data.conditionImmunitiesHtml.length > 0) {
            return this.data.conditionImmunitiesHtml;
        }
        if (!this.data.conditionImmunities || this.data.conditionImmunities.length === 0) {
            return "<span class='hideme'></span>";
        }
        const objects = this.data.conditionImmunities.map(id => window.ddbConfigJson.conditions?.find(obj => obj?.definition?.id === id).definition); // these objects are nested in a `definition` block for some reason
        if (!objects || objects.length === 0) {
            return "<span class='hideme'></span>";
        }
        return objects
            .map(definition => `<a class="tooltip-hover" href="/compendium/rules/basic-rules/appendix-a-conditions#${definition.name}" data-tooltip-href="//www.dndbeyond.com/conditions/${definition.id}-tooltip?disable-webm=1&amp;disable-webm=1" target="_blank">${definition.name}</a>`)
            .join(", ");
    }

    get sensesHtml() {
        // if (typeof this.data.sensesHtml === "string" && this.data.sensesHtml.length > 0) {
        //     return this.data.sensesHtml;
        // }
        const ppString = `Passive Perception ${this.data.passivePerception}`;
        if (!this.data.senses || this.data.senses.length === 0) {
            return ppString;
        }
        const sensesLinks = this.data.senses.map(sense => {
            const definition = this.findObj("senses", sense.senseId);
            const senseNotes = sense.notes || "";
            return `<a class="tooltip-hover sense-tooltip" href="/compendium/rules/basic-rules/monsters#${definition.name}" data-tooltip-href="//www.dndbeyond.com/senses/${definition.id}-tooltip?disable-webm=1&amp;disable-webm=1" target="_blank">${definition.name}</a> ${senseNotes}`
        }).join(", ");
        return `${sensesLinks}, ${ppString}`;
    }

    get languagesHtml() {
        if (!this.data.languages || this.data.languages.length === 0) {
            return "<span class='hideme'></span>";
        }
        if(typeof this.data.languages === "string"){
          return this.data.languages
        }
        return this.data.languages
            .map(l => {
                const definition = this.findObj("languages", l.languageId);
                if (typeof l.notes === "string" && l.notes.length > 0) {
                    return `${definition.name} ${l.notes}`;
                }
                return definition.name;
            })
            .sort((lhs, rhs) => lhs.localeCompare(rhs))
            .join(", ");
    }

    get challengeRatingHtml() {
      const definition = this.findObj("challengeRatings", this.data.challengeRatingId);  
      let crString = parseInt(definition.value);
      if(definition.value == 0.125){
        crString = `1/8`
      }
      else if(definition.value == 0.25){
        crString = `1/4`
      }
      else if(definition.value == 0.5){
        crString = `1/2`
      }
      return `${crString} (${definition.xp.toLocaleString()} XP)`;
    }

    get proficiencyBonusHtml() {
        const pb = this.proficiencyBonus;
        const modifier = pb >= 0 ? `+${pb}` : `${pb}`;
        return this.rollButton("1d20", modifier, "roll", "Proficiency Bonus");
    }

    get sourceBookHtml() {
        let html = `<p class="source monster-source">`;
        if (this.data.sourceId) {
            if(!this.data.document__title){
              const definition = this.findObj("sources", this.data.sourceId);
              html += definition.description;
            }
            else{
              html += this.data.document__title;
            }
            
            if (this.data.sourcePageNumber) {
                html += `, pg. ${this.data.sourcePageNumber}`;
            }
        }
        html += `</p>`;
        return html;
    }

    get specialTraitsDescription() {
        return this.stringOrHideMeHack(this.data.specialTraitsDescription);
    }

    get actionsDescription() {
        return this.stringOrHideMeHack(this.data.actionsDescription);
    }

    get bonusActionsDescription() {
        return this.stringOrHideMeHack(this.data.bonusActionsDescription);
    }

    get reactionsDescription() {
        return this.stringOrHideMeHack(this.data.reactionsDescription);
    }

    get legendaryActionsDescription() {
        return this.stringOrHideMeHack(this.data.legendaryActionsDescription);
    }

    get mythicActionsDescription() {
        return this.stringOrHideMeHack(this.data.mythicActionsDescription);
    }

    get characteristicsDescription() {
        return this.stringOrHideMeHack(this.data.characteristicsDescription);
    }

    get lairDescription() {
        return this.stringOrHideMeHack(this.data.lairDescription);
    }

    stringOrHideMeHack(str) {
        if (typeof str === "string" && str.length > 0) {
            return str;
        }
        return hidemeHack;
    }

    imageHtml(token) {
        // const url = this.findBestAvatarUrl();
        let img = $(`<${(token?.options?.videoToken != undefined && (token?.options?.videoToken == true || ['.mp4', '.webm','.m4v'].some(d => token?.options?.imgsrc.includes(d)))) ? 'video disableremoteplayback muted' : 'img'}
            src="${token?.options?.videoToken == undefined || token?.options?.imgsrc == this.data.avatarUrl ? this.data.largeAvatarUrl : token.options.imgsrc}"
            alt="${this.data.name}"
            class="monster-image"
            style="max-width: 100%;"
            data-large-avatar-url="${this.data.largeAvatarUrl}"
            data-avatar-url="${this.data.avatarUrl}"
            data-basic-avatar-url="${this.data.basicAvatarUrl}"
            data-current-avatar-url="largeAvatarUrl"
        />`);
        img.on("error", function (e) {
            let el = $(e.target)
            let cur = el.attr("data-current-avatar-url");
            let nextUrl;
            if (cur === "largeAvatarUrl") {
                nextUrl = el.attr("data-large-avatar-url");
                try {
                    let parts = nextUrl.split("/");
                    parts[parts.length - 2] = "1000";
                    parts[parts.length - 3] = "1000";
                    nextUrl = parts.join("/");
                    el.attr("data-current-avatar-url", "hacky");
                } catch (error) {
                    console.warn("imageHtml failed to hack the largeAvatarUrl", el, e);
                    nextUrl = el.attr("data-avatar-url");
                    el.attr("data-current-avatar-url", "avatarUrl");
                }
            } else if (cur === "hacky") {
                nextUrl = el.attr("data-avatar-url");
                el.attr("data-current-avatar-url", "avatarUrl");
            } else if (cur === "avatarUrl") {
                nextUrl = el.attr("data-basic-avatar-url");
                el.attr("data-current-avatar-url", "basicAvatarUrl");
            } else {
                console.warn("imageHtml failed to load image", el, e);
                return;
            }
            console.log("imageHtml failed to load image. Trying nextUrl", nextUrl, el, e);
            el.attr("src", nextUrl);
            el.parent().attr("href", nextUrl);
            el.parent().attr("data-title", `<a target='_blank' href='${nextUrl}' class='link link-full'>View Full Image</a>`);
        });


        let html = $(`<a href="${token?.options?.videoToken == undefined || token?.options?.imgsrc == this.data.avatarUrl ? this.data.largeAvatarUrl : token.options.imgsrc}" data-title="<a target='_blank' href='${token?.options?.videoToken == undefined || token?.options?.imgsrc == this.data.avatarUrl ? this.data.largeAvatarUrl : token.options.imgsrc}' class='link link-full'>View Full Image</a>"
           target="_blank"></a>`);
        html.append(img);
        return html;
    }
}

const hidemeHack = "<span class='hideme'></span>";

// not sure where to find these, but I've reversed engineered it by looking at this.data.damageAdjustments and window.ddbConfigJson.damageAdjustments
const DAMAGE_ADJUSTMENT_TYPE_RESISTANCE = 1;
const DAMAGE_ADJUSTMENT_TYPE_IMMUNITY = 2;
const DAMAGE_ADJUSTMENT_TYPE_VULNERABILITIES = 3;


const validRollTypes = ["to hit", "damage", "save", "check", "heal", undefined]; // undefined is in the list to allow clearing it

const fetch_tooltip = mydebounce((dataTooltipHref, callback) => {
    // dataTooltipHref will look something like this `//www.dndbeyond.com/spells/2329-tooltip?disable-webm=1&disable-webm=1`
    // we only want the `spells/2329` part of that
    try {
        if (window.tooltipCache === undefined) {
            window.tooltipCache = {};
        }
        console.log("fetch_tooltip starting for ", dataTooltipHref);

        const parts = dataTooltipHref.split("/");
        const idIndex = parts.findIndex(p => p.includes("-tooltip"));
        const id = parseInt(parts[idIndex]);
        const type = parts[idIndex - 1];
        const typeAndId = `${type}/${id}`;

        const existingJson = window.tooltipCache[typeAndId];
        if (existingJson !== undefined) {
            console.log("fetch_tooltip existingJson", existingJson);
            callback(existingJson);
            return;
        }

        window.ajaxQueue.addRequest({
            url: `https://www.dndbeyond.com/${typeAndId}/tooltip-json`,
            beforeSend: function() {
                // only make the call if we don't have it cached.
                // This prevents the scenario where a user triggers `mouseenter`, and `mouseleave` multiple times before the first network request finishes
                const alreadyFetched = window.tooltipCache[typeAndId];
                if (alreadyFetched) {
                    callback(alreadyFetched);
                    return false;
                }
                return true;
            },
            success: function (response) {
                console.log("fetch_tooltip success", response);
                window.tooltipCache[typeAndId] = response;
                callback(response);
            },
            error: function (error) {
                console.warn("fetch_tooltip error", error);
            }
        });
    } catch(error) {
        console.warn("Failed to find tooltip info in", dataTooltipHref, error);
    }
}, 200);

function display_tooltip(tooltipJson, container, clientY) {
    if (typeof tooltipJson?.Tooltip === "string") {
        remove_tooltip(0, false);

        console.log("container", container)
        const tooltipHtmlString = tooltipJson.Tooltip;

        build_and_display_sidebar_flyout(clientY, function (flyout) {
            flyout.addClass("prevent-sidebar-modal-close"); // clicking inside the tooltip should not close the sidebar modal that opened it
            flyout.addClass("tooltip-flyout")
            const tooltipHtml = $(tooltipHtmlString);
            flyout.append(tooltipHtml);
            let sendToGamelogButton = $(`<a class="ddbeb-button" href="#">Send To Gamelog</a>`);
            sendToGamelogButton.css({ "float": "right" });
            sendToGamelogButton.on("click", function(ce) {
                ce.stopPropagation();
                ce.preventDefault();
                const tooltipWithoutButton = $(tooltipHtmlString);
                tooltipWithoutButton.css({
                    "width": "100%",
                    "max-width": "100%",
                    "min-width": "100%"
                });
                send_html_to_gamelog(tooltipWithoutButton[0].outerHTML);
            });

            const buttonFooter = $("<div></div>");
            buttonFooter.css({
                height: "40px",
                width: "100%",
                position: "relative",
                background: "#fff"
            });
            flyout.append(buttonFooter);
            buttonFooter.append(sendToGamelogButton);

            const didResize = position_flyout_on_best_side_of(container, flyout);
            if (didResize) {
                // only mess with the html that DDB gave us if we absolutely have to
                tooltipHtml.css({
                    "width": "100%",
                    "max-width": "100%",
                    "min-width": "100%"
                });
            }

            flyout.hover(function (hoverEvent) {
                if (hoverEvent.type === "mouseenter") {
                    clearTimeout(removeToolTipTimer);
                    removeToolTipTimer = undefined;
                } else {
                    remove_tooltip(500);
                }
            });
            flyout.css("background-color", "#fff");
        });
    }
}

let removeToolTipTimer = undefined;
function remove_tooltip(delay = 0, removeHoverNote = true) {
    if (delay > 0) {
        removeToolTipTimer = setTimeout(function(){remove_sidebar_flyout(removeHoverNote)}, delay);
    } else {
        clearTimeout(removeToolTipTimer);
        removeToolTipTimer = undefined;
        remove_sidebar_flyout(removeHoverNote);
    }
}

function add_stat_block_hover(statBlockContainer) {
    const tooltip = $(statBlockContainer).find(".tooltip-hover");
    tooltip.hover(function (hoverEvent) {
        if (hoverEvent.type === "mouseenter") {
            const dataTooltipHref = $(hoverEvent.currentTarget).attr("data-tooltip-href");
            if (typeof dataTooltipHref === "string") {
                fetch_tooltip(dataTooltipHref, function (tooltipJson) {

                    let container = $(hoverEvent.target).closest(".sidebar-flyout");
                    if(container.find('.tooltip-header').length === 0){
                      container = $(hoverEvent.target).closest("#resizeDragMon");
                    }
                    if (container.length === 0) {
                        container = $(hoverEvent.target).closest(".sidebar-modal");
                    }
                    if (container.length === 0) {
                        container = is_characters_page() ? $(".ct-sidebar__inner [class*='styles_content']") : $(".sidebar__pane-content");
                    }

                    display_tooltip(tooltipJson, container, hoverEvent.clientY);
                });
            }
        } else {
            remove_tooltip(500);
        }
    });
}

function send_html_to_gamelog(outerHtml) {
    console.log("send_html_to_gamelog", outerHtml);
    outerHtml = outerHtml.replace('disableremoteplayback', 'disableremoteplayback autoplay loop');
    let html = window.MB.encode_message_text(outerHtml);
    const data = {
        player: window.PLAYER_NAME,
        img: window.PLAYER_IMG,
        text: html
    };
    window.MB.inject_chat(data);
    notify_gamelog();
}
