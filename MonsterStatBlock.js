
function build_and_display_stat_block_with_id(monsterId, container, tokenId, callback) {
    let cachedMonsterItem = cached_monster_items[monsterId];
    if (cachedMonsterItem) {
        display_stat_block_in_container(new MonsterStatBlock(cachedMonsterItem.monsterData), container, tokenId);
        if (callback) {
            callback();
        }
    } else {
        fetch_and_cache_monsters([monsterId], function () {
            display_stat_block_in_container(new MonsterStatBlock(cached_monster_items[monsterId].monsterData), container, tokenId);
            if (callback) {
                callback();
            }
        });
    }
}

function build_and_display_stat_block_with_data(monsterData, container, tokenId) {
    let cachedMonsterItem = cached_monster_items[monsterData.id];
    if (cachedMonsterItem) {
        // we have a cached monster. this data is the best data we have so display that instead of whatever we were given
        display_stat_block_in_container(new MonsterStatBlock(cachedMonsterItem.monsterData), container, tokenId);
    } else {
        // the monster data that we get from searching monsters (everything in the sidebar)
        // is not as good as the data we get from fetching the monster directly so
        // build with what the listItem has on it, then fetch more details, then re-render it with the updated details
        display_stat_block_in_container(new MonsterStatBlock(monsterData), container, tokenId);
        fetch_and_cache_monsters([monsterData.id], function () {
            display_stat_block_in_container(new MonsterStatBlock(cached_monster_items[monsterData.id].monsterData), container, tokenId);
        });
    }
}

function display_stat_block_in_container(statBlock, container, tokenId) {
    const html = build_monster_stat_block(statBlock);
    container.find("#noAccessToContent").remove(); // in case we're re-rendering with better data
    container.find(".avtt-stat-block-container").remove(); // in case we're re-rendering with better data
    container.append(html);
    container.find("#monster-image-to-gamelog-link").on("click", function (e) {
        e.stopPropagation();
        e.preventDefault();
        const imgContainer = $(e.target).parent().prev();
        imgContainer.find("img").attr("href", imgContainer.find("img").attr("src"));
        imgContainer.find("img").addClass("magnify");
        send_html_to_gamelog(imgContainer[0].outerHTML);
    });
    container.find("div.image").append(statBlock.imageHtml());
    container.find("a").attr("target", "_blank"); // make sure we only open links in new tabs
    scan_monster(container, statBlock, tokenId);
    // scan_creature_pane(container, statBlock.name, statBlock.image);
    add_stat_block_hover(container);
    $("span.hideme").parent().parent().hide();
}

function build_monster_stat_block(statBlock) {
    if (!statBlock.userHasAccess) {
        return `<div id='noAccessToContent' style='height: 100%;text-align: center;width: 100%;padding: 10px;font-weight: bold;color: #944;'>You do not have access to this content on DndBeyond.</div>`;
    }
    return `
<div class="container avtt-stat-block-container">
  <div id="content" class="main content-container" style="padding:0!important">
    <section class="primary-content" role="main">

      <div class="monster-details">

        <div class="more-info details-more-info" style="padding: 2px;">
          <div class="detail-content">

            <div class="mon-stat-block" style="column-count: 1;margin:0;">
              <div class="mon-stat-block__header">
                <div class="mon-stat-block__name">
                  <a class="mon-stat-block__name-link" href="${statBlock.data.url}" target="_blank">
                    ${statBlock.data.name}
                  </a>
                </div>

                <div class="mon-stat-block__meta">${statBlock.sizeName} ${statBlock.monsterTypeHtml}, ${statBlock.alignmentName}</div>
              </div>
              <div class="mon-stat-block__separator">
                <img class="mon-stat-block__separator-img" alt="" src="https://media-waterdeep.cursecdn.com/file-attachments/0/579/stat-block-header-bar.svg">
              </div>
              <div class="mon-stat-block__attributes">
                <div class="mon-stat-block__attribute">
                  <span class="mon-stat-block__attribute-label">Armor Class</span>
                  <span class="mon-stat-block__attribute-value">
                    <span class="mon-stat-block__attribute-data-value">
                        ${statBlock.data.armorClass}
                    </span>
                    <span class="mon-stat-block__attribute-data-extra">
                        ${statBlock.data.armorClassDescription}
                    </span>
                  </span>
                </div>
                <div class="mon-stat-block__attribute">
                  <span class="mon-stat-block__attribute-label">Hit Points</span>
                  <span class="mon-stat-block__attribute-data">
                    <span class="mon-stat-block__attribute-data-value">
                        ${statBlock.data.averageHitPoints}
                    </span>
                    <span class="mon-stat-block__attribute-data-extra">
                        (${statBlock.data.hitPointDice.diceString})
                    </span>
                  </span>
                </div>
                <div class="mon-stat-block__attribute">
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
                <div class="ability-block">
                  <div class="ability-block__stat ability-block__stat--str">
                    <div class="ability-block__heading">STR</div>
                    <div class="ability-block__data">
                      <span class="ability-block__score">${statBlock.str}</span>
                      <span class="ability-block__modifier">${statBlock.statButton(statBlock.str, "STR")}</span>
                    </div>
                  </div>
                  <div class="ability-block__stat ability-block__stat--dex">
                    <div class="ability-block__heading">DEX</div>
                    <div class="ability-block__data">
                      <span class="ability-block__score">${statBlock.dex}</span>
                      <span class="ability-block__modifier">${statBlock.statButton(statBlock.dex, "DEX")}</span>
                    </div>
                  </div>
                  <div class="ability-block__stat ability-block__stat--con">
                    <div class="ability-block__heading">CON</div>
                    <div class="ability-block__data">
                      <span class="ability-block__score">${statBlock.con}</span>
                      <span class="ability-block__modifier">${statBlock.statButton(statBlock.con, "CON")}</span>
                    </div>
                  </div>
                  <div class="ability-block__stat ability-block__stat--int">
                    <div class="ability-block__heading">INT</div>
                    <div class="ability-block__data">
                      <span class="ability-block__score">${statBlock.int}</span>
                      <span class="ability-block__modifier">${statBlock.statButton(statBlock.int, "INT")}</span>
                    </div>
                  </div>
                  <div class="ability-block__stat ability-block__stat--wis">
                    <div class="ability-block__heading">WIS</div>
                    <div class="ability-block__data">
                      <span class="ability-block__score">${statBlock.wis}</span>
                      <span class="ability-block__modifier">${statBlock.statButton(statBlock.wis, "WIS")}</span>
                    </div>
                  </div>
                  <div class="ability-block__stat ability-block__stat--cha">
                    <div class="ability-block__heading">CHA</div>
                    <div class="ability-block__data">
                      <span class="ability-block__score">${statBlock.cha}</span>
                      <span class="ability-block__modifier">${statBlock.statButton(statBlock.cha, "CHA")}</span>
                    </div>
                  </div>
                </div>
                <div class="mon-stat-block__separator">
                  <img class="mon-stat-block__separator-img" alt="" src="https://media-waterdeep.cursecdn.com/file-attachments/0/579/stat-block-header-bar.svg">
                </div>
              </div>
              <div class="mon-stat-block__tidbits">

                <div class="mon-stat-block__tidbit">
                  <span class="mon-stat-block__tidbit-label">Saving Throws</span>
                  <span class="mon-stat-block__tidbit-data">
                    ${statBlock.savingThrowsHtml}
                  </span>
                </div>

                <div class="mon-stat-block__tidbit">
                  <span class="mon-stat-block__tidbit-label">Skills</span>
                  <span class="mon-stat-block__tidbit-data">
                    ${statBlock.skillsHtml}
                  </span>
                </div>
                <div class="mon-stat-block__tidbit">
                  <span class="mon-stat-block__tidbit-label">Damage Vulnerabilities</span>
                  <span class="mon-stat-block__tidbit-data">
                    ${statBlock.damageVulnerabilitiesHtml}
                  </span>
                </div>
                <div class="mon-stat-block__tidbit">
                  <span class="mon-stat-block__tidbit-label">Damage Resistances</span>
                  <span class="mon-stat-block__tidbit-data">
                    ${statBlock.damageResistancesHtml}
                  </span>
                </div>

                <div class="mon-stat-block__tidbit">
                  <span class="mon-stat-block__tidbit-label">Damage Immunities</span>
                  <span class="mon-stat-block__tidbit-data">
                    ${statBlock.damageImmunitiesHtml}
                  </span>
                </div>

                <div class="mon-stat-block__tidbit">
                  <span class="mon-stat-block__tidbit-label">Condition Immunities</span>
                  <span class="mon-stat-block__tidbit-data">
                    ${statBlock.conditionImmunitiesHtml}
                  </span>
                </div>

                <div class="mon-stat-block__tidbit">
                  <span class="mon-stat-block__tidbit-label">Senses</span>
                  <span class="mon-stat-block__tidbit-data">
                    ${statBlock.sensesHtml}
                  </span>
                </div>

                <div class="mon-stat-block__tidbit">
                  <span class="mon-stat-block__tidbit-label">Languages</span>
                  <span class="mon-stat-block__tidbit-data">
                    ${statBlock.languagesHtml}
                  </span>
                </div>

                <div class="mon-stat-block__tidbit-container">
                  <div class="mon-stat-block__tidbit">
                    <span class="mon-stat-block__tidbit-label">Challenge</span>
                    <span class="mon-stat-block__tidbit-data">
                      ${statBlock.challengeRatingHtml}
                    </span>
                  </div>

                  <div class="mon-stat-block__tidbit-spacer"></div>
                  <div class="mon-stat-block__tidbit">
                    <span class="mon-stat-block__tidbit-label">Proficiency Bonus</span>
                    <span class="mon-stat-block__tidbit-data">
                        ${statBlock.proficiencyBonusHtml}
                    </span>
                  </div>

                </div>

              </div>

              <div class="mon-stat-block__separator">
                <img class="mon-stat-block__separator-img" alt="" src="https://media-waterdeep.cursecdn.com/file-attachments/0/579/stat-block-header-bar.svg">
              </div>
              
              <div class="mon-stat-block__description-blocks">

                <div class="mon-stat-block__description-block">
                  <div class="mon-stat-block__description-block-content">
                    ${statBlock.specialTraitsDescription}
                  </div>
                </div>

                <div class="mon-stat-block__description-block">
                  <div class="mon-stat-block__description-block-heading">Actions</div>
                  <div class="mon-stat-block__description-block-content">
                    ${statBlock.actionsDescription}
                  </div>
                </div>
                
                <div class="mon-stat-block__description-block">
                    <div class="mon-stat-block__description-block-heading">Bonus Actions</div>
                    <div class="mon-stat-block__description-block-content">
                      ${statBlock.bonusActionsDescription}
                    </div>
                </div>

                <div class="mon-stat-block__description-block">
                    <div class="mon-stat-block__description-block-heading">Reactions</div>
                    <div class="mon-stat-block__description-block-content">
                      ${statBlock.reactionsDescription}
                    </div>
                </div>

                <div class="mon-stat-block__description-block">
                    <div class="mon-stat-block__description-block-heading">Legendary Actions</div>
                    <div class="mon-stat-block__description-block-content">
                      ${statBlock.legendaryActionsDescription}
                    </div>
                </div>

                <div class="mon-stat-block__description-block">
                    <div class="mon-stat-block__description-block-heading">Mythic Actions</div>
                    <div class="mon-stat-block__description-block-content">
                      ${statBlock.mythicActionsDescription}
                    </div>
                </div>


              </div>
            </div>




            <div class="image" style="display: block;"></div>
            <div style="display:flex;flex-direction:row;width:100%;justify-content:space-between;padding:10px;">
                <a class="ddbeb-button monster-details-link" href="${statBlock.data.url}" target='_blank' >View Details Page</a>
                <a id="monster-image-to-gamelog-link" class="ddbeb-button monster-details-link" href="${statBlock.data.largeAvatarUrl}" target='_blank' >Send Image To Gamelog</a>
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

function fetch_config_json() {
    window.ajaxQueue.addDDBRequest({
        url: "https://www.dndbeyond.com/api/config/json",
        success: function (responseData) {
            console.log("Successfully fetched config/json from DDB API");
            window.ddbConfigJson = responseData;
        },
        error: function (errorMessage) {
            console.warn("Failed to fetch config json from DDB API", errorMessage);
        }
    })
}

$(function() {
    fetch_config_json();
})

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
        return this.sizeObj?.name || "";
    }

    get typeObj() {
        return this.findObj("monsterTypes", this.data.typeId);
    }
    get typeName() {
        return this.typeObj?.name || "";
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
        return this.alignmentObj?.name || "";
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
        return this.damageAdjustmentsHtml(DAMAGE_ADJUSTMENT_TYPE_VULNERABILITIES);
    }
    get damageResistancesHtml() {
        return this.damageAdjustmentsHtml(DAMAGE_ADJUSTMENT_TYPE_RESISTANCE);
    }
    get damageImmunitiesHtml() {
        return this.damageAdjustmentsHtml(DAMAGE_ADJUSTMENT_TYPE_IMMUNITY);
    }

    get conditionImmunitiesHtml() {
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
            const definition = this.findObj("sources", this.data.sourceId);
            html += definition.description;
            if (this.data.sourcePageNumber) {
                html += `<span class="page-number">, pg. ${this.data.sourcePageNumber}</span>`;
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

    imageHtml() {
        // const url = this.findBestAvatarUrl();
        let img = $(`<img
            src="${this.data.largeAvatarUrl}"
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
                    var parts = nextUrl.split("/");
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


        let html = $(`<a href="${this.data.largeAvatarUrl}" data-title="<a target='_blank' href='${this.data.largeAvatarUrl}' class='link link-full'>View Full Image</a>"
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
        remove_tooltip();

        console.log("container", container)
        const tooltipHtmlString = tooltipJson.Tooltip;

        build_and_display_sidebar_flyout(clientY, function (flyout) {
            flyout.addClass("prevent-sidebar-modal-close"); // clicking inside the tooltip should not close the sidebar modal that opened it
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
function remove_tooltip(delay = 0) {
    if (delay > 0) {
        removeToolTipTimer = setTimeout(remove_sidebar_flyout, delay);
    } else {
        clearTimeout(removeToolTipTimer);
        removeToolTipTimer = undefined;
        remove_sidebar_flyout();
    }
}

function add_stat_block_hover(statBlockContainer) {
    const tooltip = $(statBlockContainer).find(".tooltip-hover");
    tooltip.hover(function (hoverEvent) {
        if (hoverEvent.type === "mouseenter") {
            const dataTooltipHref = $(hoverEvent.currentTarget).attr("data-tooltip-href");
            if (typeof dataTooltipHref === "string") {
                fetch_tooltip(dataTooltipHref, function (tooltipJson) {
                    let container = $(hoverEvent.target).closest("#resizeDragMon");
                    if (container.length === 0) {
                        container = $(hoverEvent.target).closest(".sidebar-modal");
                    }
                    if (container.length === 0) {
                        container = is_characters_page() ? $(".ct-sidebar__pane-content") : $(".sidebar__pane-content");
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
    let html = window.MB.encode_message_text(outerHtml);
    const data = {
        player: window.PLAYER_NAME,
        img: window.PLAYER_IMG,
        text: html
    };
    window.MB.inject_chat(data);
    notify_gamelog();
}
