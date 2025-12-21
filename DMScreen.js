console.log("DMScreen.js is loading");

/**
 * Initialize the DM_SCREEN array for the current campaign
 * Should be called on startup
 */

function initDmScreen() {
    console.log("initDmScreen called");
    console.log(window.ddbConfigJson);

    let cont = $(`<div id='dmScreenContainer'>
            <div class='dmScreenheader'>
                <h1 class='dmScreenTitle'>
                    Conditions <span>▼</span>
                </h1>
                <div class='dmScreenDropdown' style='display: none;'>
                    <div class='dmScreenDropdownItem' data-block='conditions'>Conditions</div>
                    <div class='dmScreenDropdownItem' data-block='damage'>Improvising Objects and Damage</div>
                    <div class='dmScreenDropdownItem' data-block='actions'>Actions</div>
                    <div class='dmScreenDropdownItem' data-block='skills'>Skills and Mechanics</div>
                    <div class='dmScreenDropdownItem' data-block='travel'>Travel</div>
                    <div class='dmScreenDropdownItem' data-block='names'>Name Improvisation</div>
                    <div class='dmScreenDropdownItem' data-block='spellcasting'>Spellcasting</div>
                    <div class='dmScreenDropdownItem' data-block='weapons'>Weapons</div>
                    <div class='dmScreenDropdownItem' data-block='services'>Services</div>
                </div>
            </div>
			<div id='dmScreenBlocks'>
				
			</div>
		</div>`);

    $(window.document.body).append(cont);

    const dmScreenBlocks = $("#dmScreenBlocks");

    // Set up dropdown functionality
    $('.dmScreenTitle').click(function (e) {
        e.stopPropagation();
        $('.dmScreenDropdown').toggle();
    });

    // Close dropdown when clicking outside
    $(document).click(function () {
        $('.dmScreenDropdown').hide();
    });

    // Prevent dropdown from closing when clicking inside it
    $('.dmScreenDropdown').click(function (e) {
        e.stopPropagation();
    });

    // Handle dropdown item selection
    $('.dmScreenDropdownItem').click(function () {
        const blockType = $(this).attr('data-block');
        const blockTitle = $(this).text();

        $('.dmScreenTitle').html(`${blockTitle} <span>▼</span>`);
        $('.dmScreenDropdown').hide();

        // Clear current blocks and load the selected one
        dmScreenBlocks.empty();
        switch (blockType) {
            case 'conditions':
                dmScreenBlocks.append(buildConditionsBlock());
                break;
            case 'damage':
                dmScreenBlocks.append(buildDamageImprovisationBlock());
                break;
            case 'actions':
                dmScreenBlocks.append(buildActionsBlock());
                break;
            case 'skills':
                dmScreenBlocks.append(buildSkillsAndMechanicsBlock());
                break;
            case 'travel':
                dmScreenBlocks.append(buildTravelBlock());
                break;
            case 'names':
                dmScreenBlocks.append(buildNameImprovisationBlock());
                break;
            case 'spellcasting':
                dmScreenBlocks.append(buildSpellcastingBlock());
                break;
            case 'weapons':
                dmScreenBlocks.append(buildWeaponsBlock());
                break;
            case 'services':
                dmScreenBlocks.append(buildServicesBlock());
                break;
        }
    });

    // Load initial block
    dmScreenBlocks.append(buildConditionsBlock());

    // Handle Escape key to hide dmScreenContainer
    $(document).on('keydown', function (e) {
        if (e.key === 'Escape' && $('#dmScreenContainer').is(':visible')) {
            $('#dmScreenContainer').hide();
        }
    });
}

/**
 * Build the Conditions reference block
 * @returns {jQuery} The conditions block element
 */
function buildConditionsBlock() {
    const conditions = window.ddbConfigJson.conditions;

    const block = $(`<div class='dmScreenBlock' id='dmScreenChunks'>
        <div class='dmScreenColumns'></div>
    </div>`);

    const columnsContainer = block.find('.dmScreenColumns');

    conditions.forEach(condition => {
        const conditionDiv = $(`
            <div class='dmScreenChunk'>
                <h2>${condition.definition.name}</h2>
                <div class='dmScreenChunkDefinition'>
                    ${condition.definition.description}
                </div>
            </div>
        `);
        columnsContainer.append(conditionDiv);
    });

    // Add roll buttons to all dice notation in the travel block
    add_journal_roll_buttons(block, undefined, undefined, "DM");

    return block;
}

/**
 * Build the Skills and Mechanics reference block
 * @returns {jQuery} The skills and mechanics block element
 */
function buildSkillsAndMechanicsBlock() {
    const block = $(`<div class='dmScreenBlock' id='dmScreenSkillsAndMechanics'>
        <div class='dmScreenColumns'></div>
    </div>`);

    const columnsContainer = block.find('.dmScreenColumns');

    // Skills
    const skills = window.ddbConfigJson.abilitySkills.sort((a, b) => a.name.localeCompare(b.name));
    const rules = window.ddbConfigJson.rules;

    const mechanics = [
        {
            name: "Long Jump", description: `
            <strong><em>With Movement.</em></strong> You leap a number of feet up to your Strength score if you move at least 10 feet immediately before the jump. When you make a standing Long Jump, you can leap only half that distance.<br>
            <strong><em>Landing.</em></strong> Either way, each foot you clear costs a foot of movement. You land Prone if you don't clear the distance.
            `
        },
        {
            name: "High Jump", description: `
            <strong><em>With Movement.</em></strong> You leap into the air a number of feet equal to 3 + your Strength modifier if you move at least 10 feet immediately before the jump. When you make a standing High Jump, you can jump only half that distance.<br>
            <strong><em>Reach.</em></strong> You can extend your arms half your height above yourself during the jump. Thus, you can reach a distance equal to the height of the jump plus 1½ times your height.<br>
            <strong><em>Landing.</em></strong> Each foot you clear costs a foot of movement.
            `
        },
        {
            name: "Concentration", description: `
            ${rules.find(rule => rule.name === "Concentration").description}
            `
        },
    ];

    // Add Skills section
    const skillsSection = $(`<div class='dmScreenChunk'><h2>Skills</h2></div>`);
    skills.forEach(skill => {
        skillsSection.append(`<div><strong>${skill.name}:</strong> ${skill.description}</div>`);
    });
    columnsContainer.append(skillsSection);

    // Add Vision section
    const visionSection = $(`
        <div class='dmScreenChunk'>
            <h2>Light</h2>
            <div class='dmScreenChunkDefinition'>
                The presence or absence of light determines the category of illumination in an area, as defined below.<br>
                <strong>Bright Light.</strong> Bright Light lets most creatures see normally. Even gloomy days provide Bright Light, as do torches, lanterns, fires, and other sources of illumination within a specific radius.<br>
                <strong>Dim Light.</strong> Dim Light, also called shadows, creates a Lightly Obscured area. An area of Dim Light is usually a boundary between Bright Light and surrounding Darkness. The soft light of twilight and dawn also counts as Dim Light. A full moon might bathe the land in Dim Light.<br>
                <strong>Darkness.</strong> Darkness creates a Heavily Obscured area. Characters face Darkness outdoors at night (even most moonlit nights), within the confines of an unlit dungeon, or in an area of magical Darkness.<br>
            </div>
            <div class='dmScreenChunkDefinition'>
            <h2>Visibility</h2>
                <strong>Lightly Obscured</strong><br>
                ${rules.find(rule => rule.name === "Lightly Obscured").description}<br>
                <strong>Heavily Obscured</strong><br>
                ${rules.find(rule => rule.name === "Heavily Obscured").description}
            </div>
            <div class='dmScreenChunkDefinition'>
            <h2>Cover</h2>
                Cover provides a degree of protection to a target behind it. There are three degrees of cover, each of which provides a different benefit to a target. If behind more than one degree of cover, a target benefits only from the most protective degree.<br>
                <strong>Half Cover:</strong> ${rules.find(rule => rule.name === "Half Cover").description}<br>
                <strong>Three-Quarters Cover:</strong> ${rules.find(rule => rule.name === "Three-Quarters Cover").description}<br>
                <strong>Total Cover:</strong> ${rules.find(rule => rule.name === "Total Cover").description}
            </div>
        </div>
    `);
    columnsContainer.append(visionSection);

    // Add Mechanics section
    const mechanicsChunk = $(`<div class='dmScreenChunk'></div>`);
    mechanics.forEach(mechanic => {
        const mechanicDiv = $(`
            <h2>${mechanic.name}</h2>
            <div class='dmScreenChunkDefinition'>
                ${mechanic.description}
            </div>
        `);
        mechanicsChunk.append(mechanicDiv);
    });
    columnsContainer.append(mechanicsChunk);

    // Add Mob Attacks table
    const mobAttacksData = [
        { roll: "1-5", attackers: "1" },
        { roll: "6-12", attackers: "2" },
        { roll: "13-14", attackers: "3" },
        { roll: "15-16", attackers: "4" },
        { roll: "17-18", attackers: "5" },
        { roll: "19", attackers: "10" },
        { roll: "20", attackers: "20" }
    ];

    const mobAttacksSection = $(`
        <div class='dmScreenChunk'>
            <h2>Mob Attacks</h2>
            <div class='dmScreenChunkDefinition'>
                Speed up combat with large groups by skipping attack rolls. Calculate the minimum d20 roll needed (target AC minus attack bonus), then use the table below to determine how many attackers are needed for one hit. Assume the highest damage dealer hits. Switch back to individual rolls when numbers dwindle.
            </div>
            <table style='width: 100%; border-collapse: collapse; margin-top: 10px;'>
                <thead>
                    <tr>
                        <th style='text-align: left; padding: 8px; border-bottom: 2px solid #ccc;'>d20 Roll Needed</th>
                        <th style='text-align: left; padding: 8px; border-bottom: 2px solid #ccc;'>Attackers Needed for One to Hit</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
            <div class='dmScreenChunkDefinition'>
                As an example, say 10 bandits (+3 to hit) are attacking a player character with 18 AC. The bandits need to roll a 15 or higher to hit. According to the table, 4 attackers are needed for one hit. Since there are 10 bandits, you can expect two hits on average. From there, roll damage as normal.
            </div>
        </div>
    `);

    const mobAttacksTbody = mobAttacksSection.find('tbody');
    mobAttacksData.forEach(row => {
        mobAttacksTbody.append(`
            <tr>
                <td style='padding: 8px; border-bottom: 1px solid #eee;'><strong>${row.roll}</strong></td>
                <td style='padding: 8px; border-bottom: 1px solid #eee;'>${row.attackers}</td>
            </tr>
        `);
    });

    columnsContainer.append(mobAttacksSection);

    // Add roll buttons to all dice notation in the travel block
    add_journal_roll_buttons(block, undefined, undefined, "DM");

    return block;
}

/**
 * Build the Actions reference block
 * @returns {jQuery} The actions block element
 */
function buildActionsBlock() {
    const block = $(`<div class='dmScreenBlock' id='dmScreenActions'>
        <div class='dmScreenColumns'></div>
    </div>`);

    const columnsContainer = block.find('.dmScreenColumns');
    const actions = window.ddbConfigJson.basicActions.sort((a, b) => a.name.localeCompare(b.name));

    // Add Actions section
    actions.forEach(action => {
        const actionDiv = $(`
            <div class='dmScreenChunk'>
                <h2>${action.name}</h2>
                <div class='dmScreenChunkDefinition'>
                    ${action.description}
                </div>
            </div>
        `);
        columnsContainer.append(actionDiv);
    });

    // Add roll buttons to all dice notation in the travel block
    add_journal_roll_buttons(block, undefined, undefined, "DM");

    return block;
}

/**
 * Build the Improvising Objects and Damage reference block
 * @returns {jQuery} The damage block element
 */
function buildDamageImprovisationBlock() {
    const block = $(`<div class='dmScreenBlock' id='dmScreenDamageImprovisation'>
        <div class='dmScreenColumns'></div>
    </div>`);

    const columnsContainer = block.find('.dmScreenColumns');

    const damageData = [
        { dice: "1d10", examples: "Burned by coals, hit by a falling bookcase, pricked by a poison needle" },
        { dice: "2d10", examples: "Struck by lightning, stumbling into a firepit" },
        { dice: "4d10", examples: "Hit by falling rubble in a collapsing tunnel, tumbling into a vat of acid" },
        { dice: "10d10", examples: "Crushed by compacting walls, hit by whirling steel blades, wading through lava" },
        { dice: "18d10", examples: "Submerged in lava, hit by a crashing flying fortress" },
        { dice: "24d10", examples: "Tumbling into a vortex of fire on the Elemental Plane of Fire, crushed in the jaws of a godlike creature or a moon-size monster" }
    ];

    // Add Damage Severity and Level table
    const severityData = [
        { levels: "1-4", nuisance: "5 (1d10)", deadly: "11 (2d10)" },
        { levels: "5-10", nuisance: "11 (2d10)", deadly: "22 (4d10)" },
        { levels: "11-16", nuisance: "22 (4d10)", deadly: "55 (10d10)" },
        { levels: "17-20", nuisance: "55 (10d10)", deadly: "99 (18d10)" }
    ];

    const damageSection = $(`
        <div class='dmScreenChunk'>
            <h2>Improvising Damage</h2>
            <table style='width: 100%; border-collapse: collapse; margin-bottom: 20px;'>
                <thead>
                    <tr>
                        <th style='text-align: left; padding: 8px; border-bottom: 2px solid #ccc;'>Dice</th>
                        <th style='text-align: left; padding: 8px; border-bottom: 2px solid #ccc;'>Examples</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
            
            <h2>Damage Severity and Level</h2>
            <table style='width: 100%; border-collapse: collapse;'>
                <thead>
                    <tr>
                        <th style='text-align: left; padding: 8px; border-bottom: 2px solid #ccc;'>Character Levels</th>
                        <th style='text-align: left; padding: 8px; border-bottom: 2px solid #ccc;'>Nuisance</th>
                        <th style='text-align: left; padding: 8px; border-bottom: 2px solid #ccc;'>Deadly</th>
                    </tr>
                </thead>
                <tbody id='severityTableBody'></tbody>
            </table>
        </div>
    `);

    const tbody = damageSection.find('tbody').first();
    damageData.forEach(row => {
        tbody.append(`
            <tr>
                <td style='padding: 8px; border-bottom: 1px solid #eee;'><strong>${row.dice}</strong></td>
                <td style='padding: 8px; border-bottom: 1px solid #eee;'>${row.examples}</td>
            </tr>
        `);
    });

    const severityTbody = damageSection.find('#severityTableBody');
    severityData.forEach(row => {
        severityTbody.append(`
            <tr>
                <td style='padding: 8px; border-bottom: 1px solid #eee;'><strong>${row.levels}</strong></td>
                <td style='padding: 8px; border-bottom: 1px solid #eee;'>${row.nuisance}</td>
                <td style='padding: 8px; border-bottom: 1px solid #eee;'>${row.deadly}</td>
            </tr>
        `);
    });

    columnsContainer.append(damageSection);

    // Add Object AC and HP tables in same section
    const objectACData = [
        { material: "Cloth, paper, rope", ac: "11" },
        { material: "Crystal, glass, ice", ac: "13" },
        { material: "Wood, bone", ac: "15" },
        { material: "Stone", ac: "17" },
        { material: "Iron, steel", ac: "19" },
        { material: "Mithral", ac: "21" },
        { material: "Adamantine", ac: "23" }
    ];

    const objectHPData = [
        { size: "Tiny", fragilehp: "2 (1d4)", resilienthp: "5 (2d4)" },
        { size: "Small", fragilehp: "3 (1d6)", resilienthp: "10 (3d6)" },
        { size: "Medium", fragilehp: "4 (1d8)", resilienthp: "18 (4d8)" },
        { size: "Large", fragilehp: "5 (1d10)", resilienthp: "27 (5d10)" },
    ];

    const objectStatsSection = $(`
        <div class='dmScreenChunk'>
            <h2>Object Armor Class</h2>
            <table style='width: 100%; border-collapse: collapse; margin-bottom: 20px;'>
                <thead>
                    <tr>
                        <th style='text-align: left; padding: 8px; border-bottom: 2px solid #ccc;'>Material</th>
                        <th style='text-align: left; padding: 8px; border-bottom: 2px solid #ccc;'>AC</th>
                    </tr>
                </thead>
                <tbody id='objectACTableBody'></tbody>
            </table>
            
            <h2>Object Hit Points</h2>
            <table style='width: 100%; border-collapse: collapse;'>
                <thead>
                    <tr>
                        <th style='text-align: left; padding: 8px; border-bottom: 2px solid #ccc;'>Size</th>
                        <th style='text-align: left; padding: 8px; border-bottom: 2px solid #ccc;'>Hit Points (Fragile)</th>
                        <th style='text-align: left; padding: 8px; border-bottom: 2px solid #ccc;'>Hit Points (Resilient)</th>
                    </tr>
                </thead>
                <tbody id='objectHPTableBody'></tbody>
            </table>
        </div>
    `);

    const acTbody = objectStatsSection.find('#objectACTableBody');
    objectACData.forEach(row => {
        acTbody.append(`
            <tr>
                <td style='padding: 8px; border-bottom: 1px solid #eee;'>${row.material}</td>
                <td style='padding: 8px; border-bottom: 1px solid #eee;'><strong>${row.ac}</strong></td>
            </tr>
        `);
    });

    const hpTbody = objectStatsSection.find('#objectHPTableBody');
    objectHPData.forEach(row => {
        hpTbody.append(`
            <tr>
                <td style='padding: 8px; border-bottom: 1px solid #eee;'><strong>${row.size}</strong></td>
                <td style='padding: 8px; border-bottom: 1px solid #eee;'>${row.fragilehp}</td>
                <td style='padding: 8px; border-bottom: 1px solid #eee;'>${row.resilienthp}</td>
            </tr>
        `);
    });

    columnsContainer.append(objectStatsSection);

    const additionalObjectSection = $(`
        <div class='dmScreenChunk'>
            <h2>Huge and Gargantuan Objects</h2>
            <div class='dmScreenChunkDefinition'>
                Normal weapons are of little use against many Huge and Gargantuan objects, such as a colossal statue, towering column of stone, or massive boulder. That said, one torch can burn a Huge tapestry, and an earthquake spell can reduce a colossus to rubble. You can track a Huge or Gargantuan object's hit points if you like, or you can simply decide how long the object can withstand whatever weapon or force is acting against it. If you track hit points for the object, divide it into Large or smaller sections, and track each section's hit points separately. Destroying one of those sections could ruin the entire object. For example, a Gargantuan statue of a human might topple over when one of its Large legs is reduced to 0 hit points.
            </div>
        </div>
    `);

    columnsContainer.append(additionalObjectSection);

    const objectDamageTypesSection = $(`
        <div class='dmScreenChunk'>
            <h2>Objects and Damage Types</h2>
            <div class='dmScreenChunkDefinition'>
                Objects are immune to poison and psychic damage. You might decide that some damage types are more effective against a particular object or substance than others. For example, bludgeoning damage works well for smashing things but not for cutting through rope or leather. Paper or cloth objects might be vulnerable to fire and lightning damage. A pick can chip away stone but can't effectively cut down a tree. As always, use your best judgment.
            </div>
        </div>
    `);

    columnsContainer.append(objectDamageTypesSection);

    const damageThresholdSection = $(`
        <div class='dmScreenChunk'>
            <h2>Damage Threshold</h2>
            <div class='dmScreenChunkDefinition'>
                Big objects such as castle walls often have extra resilience represented by a damage threshold. An object with a damage threshold has immunity to all damage unless it takes an amount of damage from a single attack or effect equal to or greater than its damage threshold, in which case it takes damage as normal. Any damage that fails to meet or exceed the object's damage threshold is considered superficial and doesn't reduce the object's hit points.
            </div>
        </div>
    `);

    columnsContainer.append(damageThresholdSection);

    // Add roll buttons to all dice notation in the travel block
    add_journal_roll_buttons(block, undefined, undefined, "DM");

    return block;
}

/**
 * Build the Travel reference block
 * @returns {jQuery} The travel block element
 */
function buildTravelBlock() {
    const block = $(`<div class='dmScreenBlock' id='dmScreenTravel'>
        <div class='dmScreenColumns'></div>
    </div>`);

    const columnsContainer = block.find('.dmScreenColumns');

    // Journey Stages
    const journeyStagesSection = $(`
        <div class='dmScreenChunk'>
            <h2>Journey Stages</h2>
            <div class='dmScreenChunkDefinition'>
                It can be helpful to break up a journey into stages, with each stage representing anything from a few hours' journey to ten days or so of travel. A journey might have only a single stage if the trip is a matter of following a clear path to a well-known destination. A journey consisting of three stages makes for a satisfying trek. For example, the characters might travel along a river to the forest's edge (stage 1), follow a trail into the heart of the woods (stage 2), and then search the woods for an ancient ruin (stage 3). A long journey might involve even more stages and occupy several game sessions.
            </div>
        </div>
    `);

    columnsContainer.append(journeyStagesSection);

    // Travel Pace
    const travelPaceSection = $(`
        <div class='dmScreenChunk'>
            <h2>Travel Pace</h2>
            <div class='dmScreenChunkDefinition'>
                A group of characters can travel overland at a Normal, Fast, or Slow pace, as described in the Player's Handbook. During any journey stage, the predominant terrain determines the characters' maximum travel pace, as shown in the Maximum Pace column of the Travel Terrain table. Certain factors can affect a group's travel pace.<br><br>
                <strong>Good Roads.</strong> The presence of a good road increases the group's maximum pace by one step (from Slow to Normal or from Normal to Fast).<br><br>
                <strong>Slower Travelers.</strong> The group must move at a Slow pace if any group member's Speed is reduced to half or less of normal.<br><br>
                <strong>Extended Travel.</strong> Characters can push themselves to travel for more than 8 hours per day, at the risk of tiring. At the end of each additional hour of travel beyond 8 hours, each character must succeed on a Constitution saving throw or gain 1 Exhaustion level. The DC is 10 plus 1 for each hour past 8 hours.<br><br>
                <strong>Special Movement.</strong> If a party can travel at a high Speed for an extended time, as with a spell such as Wind Walk or a magic item such as a Carpet of Flying, translate the party's Speed into travel rates using these rules:<br>
                <ul>
                    <li>Miles per hour = Speed ÷ 10</li>
                    <li>Miles per day (Normal pace) = Miles per hour x number of hours traveled (typically 8)</li>
                    <li>Fast pace = Miles per day x 1⅓ (round down)</li>
                    <li>Slow pace = Miles per day x 2/3 (round down)</li>
                </ul>
                If the characters are flying or their special movement allows them to ignore Difficult Terrain, they can move at a Fast pace regardless of the terrain.<br><br>
                <strong>Vehicles.</strong> Characters traveling in a vehicle use the vehicle's speed in miles per hour (as shown in <a href="https://www.dndbeyond.com/sources/dnd/phb-2024/equipment#MountsandVehicles" target="_blank">chapter 6 of the Player's Handbook</a>) to determine their rate of travel, and they don't choose a travel pace.
            </div>
        </div>
    `);

    columnsContainer.append(travelPaceSection);

    // Travel Terrain Table
    const terrainData = [
        { terrain: "Arctic", maxPace: "Fast*", encounterDistance: "6d6 x 10 feet", foragingDC: "20", navigationDC: "10", searchDC: "10" },
        { terrain: "Coastal", maxPace: "Normal", encounterDistance: "2d10 x 10 feet", foragingDC: "10", navigationDC: "5", searchDC: "15" },
        { terrain: "Desert", maxPace: "Normal", encounterDistance: "6d6 x 10 feet", foragingDC: "20", navigationDC: "10", searchDC: "10" },
        { terrain: "Forest", maxPace: "Normal", encounterDistance: "2d8 x 10 feet", foragingDC: "10", navigationDC: "15", searchDC: "15" },
        { terrain: "Grassland", maxPace: "Fast", encounterDistance: "6d6 x 10 feet", foragingDC: "15", navigationDC: "5", searchDC: "15" },
        { terrain: "Hill", maxPace: "Normal", encounterDistance: "2d10 x 10 feet", foragingDC: "15", navigationDC: "10", searchDC: "15" },
        { terrain: "Mountain", maxPace: "Slow", encounterDistance: "4d10 x 10 feet", foragingDC: "20", navigationDC: "15", searchDC: "20" },
        { terrain: "Swamp", maxPace: "Slow", encounterDistance: "2d8 x 10 feet", foragingDC: "10", navigationDC: "15", searchDC: "20" },
        { terrain: "Underdark", maxPace: "Normal", encounterDistance: "2d6 x 10 feet", foragingDC: "20", navigationDC: "10", searchDC: "20" },
        { terrain: "Urban", maxPace: "Normal", encounterDistance: "2d6 x 10 feet", foragingDC: "20", navigationDC: "15", searchDC: "15" },
        { terrain: "Waterborne", maxPace: "Special†", encounterDistance: "6d6 x 10 feet", foragingDC: "15", navigationDC: "10", searchDC: "15" }
    ];

    const terrainSection = $(`
        <div class='dmScreenChunk'>
            <h2>Travel Terrain</h2>
            <table style='width: 100%; border-collapse: collapse;'>
                <thead>
                    <tr>
                        <th style='text-align: left; padding: 8px; border-bottom: 2px solid #ccc;'>Terrain</th>
                        <th style='text-align: left; padding: 8px; border-bottom: 2px solid #ccc;'>Max Pace</th>
                        <th style='text-align: left; padding: 8px; border-bottom: 2px solid #ccc;'>Encounter Distance</th>
                        <th style='text-align: left; padding: 8px; border-bottom: 2px solid #ccc;'>Foraging DC</th>
                        <th style='text-align: left; padding: 8px; border-bottom: 2px solid #ccc;'>Navigation DC</th>
                        <th style='text-align: left; padding: 8px; border-bottom: 2px solid #ccc;'>Search DC</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
    `);

    const terrainTbody = terrainSection.find('tbody');
    terrainData.forEach(row => {
        terrainTbody.append(`
            <tr>
                <td style='padding: 8px; border-bottom: 1px solid #eee;'><strong>${row.terrain}</strong></td>
                <td style='padding: 8px; border-bottom: 1px solid #eee;'>${row.maxPace}</td>
                <td style='padding: 8px; border-bottom: 1px solid #eee;'>${row.encounterDistance}</td>
                <td style='padding: 8px; border-bottom: 1px solid #eee;'>${row.foragingDC}</td>
                <td style='padding: 8px; border-bottom: 1px solid #eee;'>${row.navigationDC}</td>
                <td style='padding: 8px; border-bottom: 1px solid #eee;'>${row.searchDC}</td>
            </tr>
        `);
    });

    // Add footnotes
    terrainSection.append(`
        <div style='margin-top: 10px; font-size: 0.9em;'>
            <p style='margin: 5px 0;'>*Appropriate equipment (such as skis) is necessary to keep up a Fast pace in Arctic terrain.</p>
            <p style='margin: 5px 0;'>†Characters' rate of travel while waterborne depends on the vehicle carrying them; see "Vehicles."</p>
        </div>
    `);

    columnsContainer.append(terrainSection);

    // Weather
    const weatherData = [
        { range: "1-14", result: "Normal for the season" },
        { range: "15-17", result: "1d4 x 10 degrees Fahrenheit colder" },
        { range: "18-20", result: "1d4 x 10 degrees Fahrenheit hotter" }
    ];

    const weatherSection = $(`
        <div class='dmScreenChunk'>
            <h2>Weather</h2>
            <div class='dmScreenChunkDefinition'>
                During each stage of the characters' journey, you can determine what the weather is like by rolling on the Weather table, adjusting for the terrain and season as appropriate. Roll 1d20 three times to determine the temperature, the wind, and the precipitation.<br><br>
                Weather has no significant game effect most of the time, but see <a href="https://www.dndbeyond.com/sources/dnd/dmg-2024/dms-toolbox#EnvironmentalEffects" target="_blank">"Environmental Effects"</a> in chapter 3 for the effects of extreme weather. Adding weather details to your descriptions of the characters' journey can make it more memorable.
            </div>
            <table style='width: 100%; border-collapse: collapse; margin-top: 10px;'>
                <thead>
                    <tr>
                        <th style='text-align: left; padding: 8px; border-bottom: 2px solid #ccc;'>1d20</th>
                        <th style='text-align: left; padding: 8px; border-bottom: 2px solid #ccc;'>Temperature</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
    `);

    const weatherTbody = weatherSection.find('tbody');
    weatherData.forEach(row => {
        weatherTbody.append(`
            <tr>
                <td style='padding: 8px; border-bottom: 1px solid #eee;'><strong>${row.range}</strong></td>
                <td style='padding: 8px; border-bottom: 1px solid #eee;'>${row.result}</td>
            </tr>
        `);
    });

    // Add Wind/Precipitation table
    const windPrecipData = [
        { range: "1-12", wind: "None", precipitation: "None" },
        { range: "13-17", wind: "Light", precipitation: "Light rain or light snowfall" },
        { range: "18-20", wind: "Strong", precipitation: "Heavy rain or heavy snowfall" }
    ];

    const windPrecipTable = $(`
        <table style='width: 100%; border-collapse: collapse; margin-top: 20px;'>
            <thead>
                <tr>
                    <th style='text-align: left; padding: 8px; border-bottom: 2px solid #ccc;'>1d20</th>
                    <th style='text-align: left; padding: 8px; border-bottom: 2px solid #ccc;'>Wind</th>
                    <th style='text-align: left; padding: 8px; border-bottom: 2px solid #ccc;'>Precipitation</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    `);

    const windPrecipTbody = windPrecipTable.find('tbody');
    windPrecipData.forEach(row => {
        windPrecipTbody.append(`
            <tr>
                <td style='padding: 8px; border-bottom: 1px solid #eee;'><strong>${row.range}</strong></td>
                <td style='padding: 8px; border-bottom: 1px solid #eee;'>${row.wind}</td>
                <td style='padding: 8px; border-bottom: 1px solid #eee;'>${row.precipitation}</td>
            </tr>
        `);
    });

    weatherSection.append(windPrecipTable);

    columnsContainer.append(weatherSection);

    // Add roll buttons to all dice notation in the travel block
    add_journal_roll_buttons(block, undefined, undefined, "DM");

    return block;
}

/**
 * Build the Name Improvisation reference block
 * @returns {jQuery} The name improvisation block element
 */
function buildNameImprovisationBlock() {
    const block = $(`<div class='dmScreenBlock' id='dmScreenNameImprovisation'>
        <div class='dmScreenColumns'></div>
    </div>`);

    const columnsContainer = block.find('.dmScreenColumns');

    // Common Names
    const commonNamesData = [
        { roll: 1, givenName: "Adrik", surname: "Brightsun" },
        { roll: 2, givenName: "Alvyn", surname: "Dundragon" },
        { roll: 3, givenName: "Aurora", surname: "Frostbeard" },
        { roll: 4, givenName: "Eldeth", surname: "Garrick" },
        { roll: 5, givenName: "Eldon", surname: "Goodbarrel" },
        { roll: 6, givenName: "Farris", surname: "Greycastle" },
        { roll: 7, givenName: "Kathra", surname: "Ironfist" },
        { roll: 8, givenName: "Kellen", surname: "Jaerin" },
        { roll: 9, givenName: "Lily", surname: "Merryweather" },
        { roll: 10, givenName: "Nissa", surname: "Redthorn" },
        { roll: 11, givenName: "Xinli", surname: "Stormriver" },
        { roll: 12, givenName: "Zorra", surname: "Wren" }
    ];

    // Guttural Names
    const gutturalNamesData = [
        { roll: 1, givenName: "Abzug", surname: "Burska" },
        { roll: 2, givenName: "Bajok", surname: "Gruuthok" },
        { roll: 3, givenName: "Bharash", surname: "Hrondl" },
        { roll: 4, givenName: "Grovis", surname: "Jarzzok" },
        { roll: 5, givenName: "Gruuna", surname: "Kraltus" },
        { roll: 6, givenName: "Hokrun", surname: "Shamog" },
        { roll: 7, givenName: "Mardred", surname: "Skrangval" },
        { roll: 8, givenName: "Rhogar", surname: "Ungart" },
        { roll: 9, givenName: "Skuldark", surname: "Uuthrakt" },
        { roll: 10, givenName: "Thokk", surname: "Vrakir" },
        { roll: 11, givenName: "Urzul", surname: "Yuldra" },
        { roll: 12, givenName: "Varka", surname: "Zulrax" }
    ];

    // Lyrical Names
    const lyricalNamesData = [
        { roll: 1, givenName: "Arannis", surname: "Arvannis" },
        { roll: 2, givenName: "Damaia", surname: "Brawnanvil" },
        { roll: 3, givenName: "Darsis", surname: "Daardendrian" },
        { roll: 4, givenName: "Dweomer", surname: "Drachedandion" },
        { roll: 5, givenName: "Evabeth", surname: "Endryss" },
        { roll: 6, givenName: "Jhessail", surname: "Meliamne" },
        { roll: 7, givenName: "Keyleth", surname: "Mishann" },
        { roll: 8, givenName: "Netheria", surname: "Silverfrond" },
        { roll: 9, givenName: "Orianna", surname: "Snowmantle" },
        { roll: 10, givenName: "Sorcyl", surname: "Summerbreeze" },
        { roll: 11, givenName: "Umarion", surname: "Thunderfoot" },
        { roll: 12, givenName: "Velissa", surname: "Zashir" }
    ];

    // Monosyllabic Names
    const monosyllabicNamesData = [
        { roll: 1, givenName: "Chen", surname: "Dench" },
        { roll: 2, givenName: "Creel", surname: "Drog" },
        { roll: 3, givenName: "Dain", surname: "Dusk" },
        { roll: 4, givenName: "Dorn", surname: "Holg" },
        { roll: 5, givenName: "Flint", surname: "Horn" },
        { roll: 6, givenName: "Glim", surname: "Imsh" },
        { roll: 7, givenName: "Henk", surname: "Jask" },
        { roll: 8, givenName: "Krusk", surname: "Keth" },
        { roll: 9, givenName: "Nox", surname: "Ku" },
        { roll: 10, givenName: "Nyx", surname: "Kung" },
        { roll: 11, givenName: "Rukh", surname: "Mott" },
        { roll: 12, givenName: "Shan", surname: "Quaal" }
    ];

    // Sinister Names
    const sinisterNamesData = [
        { roll: 1, givenName: "Arachne", surname: "Doomwhisper" },
        { roll: 2, givenName: "Axyss", surname: "Dreadfield" },
        { roll: 3, givenName: "Carrion", surname: "Gallows" },
        { roll: 4, givenName: "Grinnus", surname: "Hellstryke" },
        { roll: 5, givenName: "Melkhis", surname: "Killraven" },
        { roll: 6, givenName: "Morthos", surname: "Nightblade" },
        { roll: 7, givenName: "Nadir", surname: "Norixius" },
        { roll: 8, givenName: "Scandal", surname: "Shadowfang" },
        { roll: 9, givenName: "Skellendyre", surname: "Valtar" },
        { roll: 10, givenName: "Thaltus", surname: "Winterspell" },
        { roll: 11, givenName: "Valkora", surname: "Xandros" },
        { roll: 12, givenName: "Vexander", surname: "Zarkynzorn" }
    ];

    // Whimsical Names
    const whimsicalNamesData = [
        { roll: 1, givenName: "Cricket", surname: "Borogove" },
        { roll: 2, givenName: "Daisy", surname: "Goldjoy" },
        { roll: 3, givenName: "Dimble", surname: "Hoddypeak" },
        { roll: 4, givenName: "Ellywick", surname: "Huddle" },
        { roll: 5, givenName: "Erky", surname: "Jollywind" },
        { roll: 6, givenName: "Fiddlestyx", surname: "Oneshoe" },
        { roll: 7, givenName: "Fonkin", surname: "Scramblewise" },
        { roll: 8, givenName: "Golly", surname: "Sunnyhill" },
        { roll: 9, givenName: "Mimsy", surname: "Tallgrass" },
        { roll: 10, givenName: "Pumpkin", surname: "Timbers" },
        { roll: 11, givenName: "Quarrel", surname: "Underbough" },
        { roll: 12, givenName: "Sybilwick", surname: "Wimbly" }
    ];

    // Tavern Names
    const tavernNamesData = [
        { roll: 1, first: "The Golden", second: "Lyre" },
        { roll: 2, first: "The Silver", second: "Dolphin" },
        { roll: 3, first: "The Beardless", second: "Dwarf" },
        { roll: 4, first: "The Laughing", second: "Pegasus" },
        { roll: 5, first: "The Dancing", second: "Hut" },
        { roll: 6, first: "The Gilded", second: "Rose" },
        { roll: 7, first: "The Stumbling", second: "Stag" },
        { roll: 8, first: "The Wolf and", second: "Duck" },
        { roll: 9, first: "The Fallen", second: "Lamb" },
        { roll: 10, first: "The Leering", second: "Demon" },
        { roll: 11, first: "The Drunken", second: "Goat" },
        { roll: 12, first: "The Wine and", second: "Spirit" },
        { roll: 13, first: "The Roaring", second: "Horde" },
        { roll: 14, first: "The Frowning", second: "Jester" },
        { roll: 15, first: "The Barrel and", second: "Bucket" },
        { roll: 16, first: "The Thirsty", second: "Crow" },
        { roll: 17, first: "The Wandering", second: "Satyr" },
        { roll: 18, first: "The Barking", second: "Dog" },
        { roll: 19, first: "The Happy", second: "Spider" },
        { roll: 20, first: "The Witch and", second: "Dragon" }
    ];

    // Helper function to create name table
    function createNameTable(title, data) {
        const section = $(`
            <div class='dmScreenChunk'>
                <h2>${title}</h2>
                <table style='width: 100%; border-collapse: collapse;'>
                    <thead>
                        <tr>
                            <th style='text-align: left; padding: 8px; border-bottom: 2px solid #ccc;'>1d12</th>
                            <th style='text-align: left; padding: 8px; border-bottom: 2px solid #ccc;'>Given Name</th>
                            <th style='text-align: left; padding: 8px; border-bottom: 2px solid #ccc;'>Surname</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        `);

        const tbody = section.find('tbody');
        data.forEach(row => {
            tbody.append(`
                <tr>
                    <td style='padding: 8px; border-bottom: 1px solid #eee;'><strong>${row.roll}</strong></td>
                    <td style='padding: 8px; border-bottom: 1px solid #eee;'>${row.givenName}</td>
                    <td style='padding: 8px; border-bottom: 1px solid #eee;'>${row.surname}</td>
                </tr>
            `);
        });

        return section;
    }

    // Add all name tables
    columnsContainer.append(createNameTable("Common Names", commonNamesData));
    columnsContainer.append(createNameTable("Guttural Names", gutturalNamesData));
    columnsContainer.append(createNameTable("Lyrical Names", lyricalNamesData));
    columnsContainer.append(createNameTable("Monosyllabic Names", monosyllabicNamesData));
    columnsContainer.append(createNameTable("Sinister Names", sinisterNamesData));
    columnsContainer.append(createNameTable("Whimsical Names", whimsicalNamesData));

    // Add Tavern Names table
    const tavernSection = $(`
        <div class='dmScreenChunk'>
            <h2>Tavern Names</h2>
            <table style='width: 100%; border-collapse: collapse; margin-top: 10px;'>
                <thead>
                    <tr>
                        <th style='text-align: left; padding: 8px; border-bottom: 2px solid #ccc;'>1d20</th>
                        <th style='text-align: left; padding: 8px; border-bottom: 2px solid #ccc;'>First Part</th>
                        <th style='text-align: left; padding: 8px; border-bottom: 2px solid #ccc;'>Second Part</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
    `);

    const tavernTbody = tavernSection.find('tbody');
    tavernNamesData.forEach(row => {
        tavernTbody.append(`
            <tr>
                <td style='padding: 8px; border-bottom: 1px solid #eee;'><strong>${row.roll}</strong></td>
                <td style='padding: 8px; border-bottom: 1px solid #eee;'>${row.first}</td>
                <td style='padding: 8px; border-bottom: 1px solid #eee;'>${row.second}</td>
            </tr>
        `);
    });

    columnsContainer.append(tavernSection);

    // Add roll buttons to all dice notation
    add_journal_roll_buttons(block, undefined, undefined, "DM");

    return block;
}

/**
 * Build the Spellcasting reference block
 * @returns {jQuery} The spellcasting block element
 */
function buildSpellcastingBlock() {
    const spellComponents = window.ddbConfigJson.spellComponents;
    const block = $(`<div class='dmScreenBlock' id='dmScreenSpellcasting'>
        <div class='dmScreenColumns'></div>
    </div>`);

    const columnsContainer = block.find('.dmScreenColumns');

    // One Spell with a Spell Slot per Turn
    const oneSpellSection = $(`
        <div class='dmScreenChunk'>
            <h2>One Spell with a Spell Slot per Turn</h2>
            <div class='dmScreenChunkDefinition'>
                On a turn, you can expend only one spell slot to cast a spell. This rule means you can't, for example, cast a spell with a spell slot using the Magic action and another one using a Bonus Action on the same turn.
            </div>
        </div>
    `);
    columnsContainer.append(oneSpellSection);

    // Longer Casting Times
    const longerCastingSection = $(`
        <div class='dmScreenChunk'>
            <h2>Longer Casting Times</h2>
            <div class='dmScreenChunkDefinition'>
                Certain spells - including a spell cast as a Ritual - require more time to cast: minutes or even hours. While you cast a spell with a casting time of 1 minute or more, you must take the Magic action on each of your turns, and you must maintain Concentration (see the rules glossary) while you do so. If your Concentration is broken, the spell fails, but you don't expend a spell slot. To cast the spell again, you must start over.
            </div>
        </div>
    `);
    columnsContainer.append(longerCastingSection);

    // Components
    const componentsSection = $(`
        <div class='dmScreenChunk'>
            <h2>Components</h2>
            <div class='dmScreenChunkDefinition'>
                A spell's components are physical requirements the spellcaster must meet to cast the spell. Each spell's description indicates whether it requires Verbal (V), Somatic (S), or Material (M) components. If the spellcaster can't provide one or more of a spell's components, the spellcaster can't cast the spell.<br><br>
                <strong>Verbal (V):</strong> ${spellComponents.find((component) => component.name === "Verbal").description}<br><br>
                <strong>Somatic (S):</strong> ${spellComponents.find((component) => component.name === "Somatic").description}<br><br>
                <strong>Material (M):</strong> ${spellComponents.find((component) => component.name === "Material").description}<br><br>
                If a spell doesn't consume its materials and doesn't specify a cost for them, a spellcaster can use a Component Pouch (see chapter 6) instead of providing the materials specified in the spell, or the spellcaster can substitute a Spellcasting Focus if the caster has a feature that allows that substitution. To use a Component Pouch, you must have a hand free to reach into it, and to use a Spellcasting Focus, you must hold it unless its description says otherwise (see chapter 6 for descriptions).
            </div>
        </div>
    `);
    columnsContainer.append(componentsSection);

    // Duration
    const durationSection = $(`
        <div class='dmScreenChunk'>
            <h2>Duration</h2>
            <div class='dmScreenChunkDefinition'>
                A spell's duration is the length of time the spell persists after it is cast. A duration typically takes one of the following forms:<br><br>
                <strong>Concentration:</strong> A duration that requires Concentration follows the Concentration rules (see the rules glossary).<br><br>
                <strong>Instantaneous:</strong> An instantaneous duration means the spell's magic appears only for a moment and then disappears.<br><br>
                <strong>Time Span:</strong> A duration that provides a time span specifies how long the spell lasts in rounds, minutes, hours, or the like. For example, a Duration entry might say "1 minute," meaning the spell ends after 1 minute has passed. While a time-span spell that you cast is ongoing, you can dismiss it (no action required) if you don't have the Incapacitated condition.
            </div>
        </div>
    `);
    columnsContainer.append(durationSection);

    // Targets
    const targetsSection = $(`
        <div class='dmScreenChunk'>
            <h2>Targets</h2>
            <div class='dmScreenChunkDefinition'>
                A typical spell requires the caster to pick one or more targets to be affected by the spell's magic. A spell's description says whether the spell targets creatures, objects, or something else.<br><br>
                <strong>A Clear Path to the Target:</strong> To target something with a spell, a caster must have a clear path to it, so it can't be behind Total Cover.<br><br>
                <strong>Targeting Yourself:</strong> If a spell targets a creature of your choice, you can choose yourself unless the creature must be Hostile or specifically a creature other than you.<br><br>
                <strong>Areas of Effect:</strong> Some spells, such as Thunderwave, cover an area called an area of effect, which is defined in the rules glossary. The area determines what the spell targets. The description of a spell specifies whether it has an area of effect, which is typically one of these shapes: Cone, Cube, Cylinder, Emanation, Line, or Sphere.<br><br>
                <strong>Awareness of Being Targeted:</strong> Unless a spell has a perceptible effect, a creature doesn't know it was targeted by the spell. An effect like lightning is obvious, but a more subtle effect, such as an attempt to read thoughts, goes unnoticed unless a spell's description says otherwise.<br><br>
                <strong>Invalid Targets:</strong> If you cast a spell on someone or something that can't be affected by it, nothing happens to that target, but if you used a spell slot to cast the spell, the slot is still expended.<br><br>
                If the spell normally has no effect on a target that succeeds on a saving throw, the invalid target appears to have succeeded on its saving throw, even though it didn't attempt one (giving no hint that the creature is an invalid target). Otherwise, you perceive that the spell did nothing to the target.
            </div>
        </div>
    `);
    columnsContainer.append(targetsSection);

    // Areas of Effect
    const aoeTypes = window.ddbConfigJson.aoeTypes.filter(aoe => aoe.description && aoe.description.trim() !== '');
    const aoeSection = $(`
        <div class='dmScreenChunk'>
            <h2>Areas of Effect</h2>
        </div>
    `);

    aoeTypes.forEach(aoe => {
        aoeSection.append(`
            <div class='dmScreenChunkDefinition'>
                <strong>${aoe.name}:</strong> ${aoe.description}
            </div>
        `);
    });

    columnsContainer.append(aoeSection);

    // Add roll buttons to all dice notation
    add_journal_roll_buttons(block, undefined, undefined, "DM");

    return block;
}

/**
 * Build the Weapons reference block
 * @returns {jQuery} The weapons block element
 */
function buildWeaponsBlock() {
    const block = $(`<div class='dmScreenBlock' id='dmScreenWeapons'>
        <div class='dmScreenColumns'></div>
    </div>`);

    const columnsContainer = block.find('.dmScreenColumns');

    const proficiencySection = $(`
        <div class='dmScreenChunk'>
            <h2>Weapon Proficiencies</h2>
            <div class='dmScreenChunkDefinition'>
                Anyone can wield a weapon, but you must have proficiency with it to add your Proficiency Bonus to an attack roll you make with it. A player character's features can provide weapon proficiencies. A monster is proficient with any weapon in its stat block.
            </div>
        </div>
    `);
    columnsContainer.append(proficiencySection);

    const weaponMasteries = window.ddbConfigJson.weaponProperties.filter(property => property.name === "Cleave" || property.name === "Graze" || property.name === "Nick" || property.name === "Push" || property.name === "Sap" || property.name === "Slow" || property.name === "Topple" || property.name === "Vex");

    // Weapon Masteries
    const masteriesSection = $(`
        <div class='dmScreenChunk'>
            <h2>Weapon Masteries</h2>
        </div>
    `);

    weaponMasteries.forEach(prop => {
        masteriesSection.append(`
            <div class='dmScreenChunkDefinition'>
                <strong>${prop.name}:</strong> ${prop.description}
            </div>
        `);
    });

    columnsContainer.append(masteriesSection);

    const weaponProperties = window.ddbConfigJson.weaponProperties.filter(property => property.name === "Ammunition" || property.name === "Finesse" || property.name === "Heavy" || property.name === "Light" || property.name === "Loading" || property.name === "Range" || property.name === "Reach" || property.name === "Special" || property.name === "Thrown" || property.name === "Two-Handed" || property.name === "Versatile");

    // Weapon Properties
    const propertiesSection = $(`
        <div class='dmScreenChunk'>
            <h2>Weapon Properties</h2>
        </div>
    `);
    weaponProperties.forEach(prop => {
        propertiesSection.append(`
            <div class='dmScreenChunkDefinition'>
                <strong>${prop.name}:</strong> ${prop.description}
            </div>
        `);
    });

    columnsContainer.append(propertiesSection);

    // Building out the weapons tables manually because the ddbConfigJSON data is incomplete - it lacks damage, weight, and cost info

    // Simple Melee Weapons
    const simpleMeleeData = [
        { name: "Club", damage: "1d4 Bludgeoning", properties: "Light", mastery: "Slow", cost: "1 SP" },
        { name: "Dagger", damage: "1d4 Piercing", properties: "Finesse, Light, Thrown (Range 20/60)", mastery: "Nick", cost: "2 GP" },
        { name: "Greatclub", damage: "1d8 Bludgeoning", properties: "Two-Handed", mastery: "Push", cost: "2 SP" },
        { name: "Handaxe", damage: "1d6 Slashing", properties: "Light, Thrown (Range 20/60)", mastery: "Vex", cost: "5 GP" },
        { name: "Javelin", damage: "1d6 Piercing", properties: "Thrown (Range 30/120)", mastery: "Slow", cost: "5 SP" },
        { name: "Light Hammer", damage: "1d4 Bludgeoning", properties: "Light, Thrown (Range 20/60)", mastery: "Nick", cost: "2 GP" },
        { name: "Mace", damage: "1d6 Bludgeoning", properties: " - ", mastery: "Sap", cost: "5 GP" },
        { name: "Quarterstaff", damage: "1d6 Bludgeoning", properties: "Versatile (1d8)", mastery: "Topple", cost: "2 SP" },
        { name: "Sickle", damage: "1d4 Slashing", properties: "Light", mastery: "Nick", cost: "1 GP" },
        { name: "Spear", damage: "1d6 Piercing", properties: "Thrown (Range 20/60), Versatile (1d8)", mastery: "Sap", cost: "1 GP" }
    ];

    // Simple Ranged Weapons
    const simpleRangedData = [
        { name: "Dart", damage: "1d4 Piercing", properties: "Finesse, Thrown (Range 20/60)", mastery: "Vex", cost: "5 CP" },
        { name: "Light Crossbow", damage: "1d8 Piercing", properties: "Ammunition (Range 80/320; Bolt), Loading, Two-Handed", mastery: "Slow", cost: "25 GP" },
        { name: "Shortbow", damage: "1d6 Piercing", properties: "Ammunition (Range 80/320; Arrow), Two-Handed", mastery: "Vex", cost: "25 GP" },
        { name: "Sling", damage: "1d4 Bludgeoning", properties: "Ammunition (Range 30/120; Bullet)", mastery: "Slow", cost: "1 SP" }
    ];

    // Martial Melee Weapons
    const martialMeleeData = [
        { name: "Battleaxe", damage: "1d8 Slashing", properties: "Versatile (1d10)", mastery: "Topple", cost: "10 GP" },
        { name: "Flail", damage: "1d8 Bludgeoning", properties: " - ", mastery: "Sap", cost: "10 GP" },
        { name: "Glaive", damage: "1d10 Slashing", properties: "Heavy, Reach, Two-Handed", mastery: "Graze", cost: "20 GP" },
        { name: "Greataxe", damage: "1d12 Slashing", properties: "Heavy, Two-Handed", mastery: "Cleave", cost: "30 GP" },
        { name: "Greatsword", damage: "2d6 Slashing", properties: "Heavy, Two-Handed", mastery: "Graze", cost: "50 GP" },
        { name: "Halberd", damage: "1d10 Slashing", properties: "Heavy, Reach, Two-Handed", mastery: "Cleave", cost: "20 GP" },
        { name: "Lance", damage: "1d10 Piercing", properties: "Heavy, Reach, Two-Handed (unless mounted)", mastery: "Topple", cost: "10 GP" },
        { name: "Longsword", damage: "1d8 Slashing", properties: "Versatile (1d10)", mastery: "Sap", cost: "15 GP" },
        { name: "Maul", damage: "2d6 Bludgeoning", properties: "Heavy, Two-Handed", mastery: "Topple", cost: "10 GP" },
        { name: "Morningstar", damage: "1d8 Piercing", properties: " - ", mastery: "Sap", cost: "15 GP" },
        { name: "Pike", damage: "1d10 Piercing", properties: "Heavy, Reach, Two-Handed", mastery: "Push", cost: "5 GP" },
        { name: "Rapier", damage: "1d8 Piercing", properties: "Finesse", mastery: "Vex", cost: "25 GP" },
        { name: "Scimitar", damage: "1d6 Slashing", properties: "Finesse, Light", mastery: "Nick", cost: "25 GP" },
        { name: "Shortsword", damage: "1d6 Piercing", properties: "Finesse, Light", mastery: "Vex", cost: "10 GP" },
        { name: "Trident", damage: "1d8 Piercing", properties: "Thrown (Range 20/60), Versatile (1d10)", mastery: "Topple", cost: "5 GP" },
        { name: "Warhammer", damage: "1d8 Bludgeoning", properties: "Versatile (1d10)", mastery: "Push", cost: "15 GP" },
        { name: "War Pick", damage: "1d8 Piercing", properties: "Versatile (1d10)", mastery: "Sap", cost: "5 GP" },
        { name: "Whip", damage: "1d4 Slashing", properties: "Finesse, Reach", mastery: "Slow", cost: "2 GP" }
    ];

    // Martial Ranged Weapons
    const martialRangedData = [
        { name: "Blowgun", damage: "1 Piercing", properties: "Ammunition (Range 25/100; Needle), Loading", mastery: "Vex", cost: "10 GP" },
        { name: "Hand Crossbow", damage: "1d6 Piercing", properties: "Ammunition (Range 30/120; Bolt), Light, Loading", mastery: "Vex", cost: "75 GP" },
        { name: "Heavy Crossbow", damage: "1d10 Piercing", properties: "Ammunition (Range 100/400; Bolt), Heavy, Loading, Two-Handed", mastery: "Push", cost: "50 GP" },
        { name: "Longbow", damage: "1d8 Piercing", properties: "Ammunition (Range 150/600; Arrow), Heavy, Two-Handed", mastery: "Slow", cost: "50 GP" },
        { name: "Musket", damage: "1d12 Piercing", properties: "Ammunition (Range 40/120; Bullet), Loading, Two-Handed", mastery: "Slow", cost: "500 GP" },
        { name: "Pistol", damage: "1d10 Piercing", properties: "Ammunition (Range 30/90; Bullet), Loading", mastery: "Vex", cost: "250 GP" }
    ];

    // Helper function to create weapon table
    function createWeaponTable(title, weaponData) {
        const section = $(`
            <div class='dmScreenChunk'>
                <h2>${title}</h2>
                <table style='width: 100%; border-collapse: collapse;'>
                    <thead>
                        <tr>
                            <th style='text-align: left; padding: 8px; border-bottom: 2px solid #ccc;'>Name</th>
                            <th style='text-align: left; padding: 8px; border-bottom: 2px solid #ccc;'>Damage</th>
                            <th style='text-align: left; padding: 8px; border-bottom: 2px solid #ccc;'>Properties</th>
                            <th style='text-align: left; padding: 8px; border-bottom: 2px solid #ccc;'>Mastery</th>
                            <th style='text-align: left; padding: 8px; border-bottom: 2px solid #ccc;'>Cost</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        `);

        const tbody = section.find('tbody');
        weaponData.forEach(weapon => {
            tbody.append(`
                <tr>
                    <td style='padding: 8px; border-bottom: 1px solid #eee;'><strong>${weapon.name}</strong></td>
                    <td style='padding: 8px; border-bottom: 1px solid #eee;'>${weapon.damage}</td>
                    <td style='padding: 8px; border-bottom: 1px solid #eee;'>${weapon.properties}</td>
                    <td style='padding: 8px; border-bottom: 1px solid #eee;'>${weapon.mastery}</td>
                    <td style='padding: 8px; border-bottom: 1px solid #eee;'>${weapon.cost}</td>
                </tr>
            `);
        });

        return section;
    }

    // Add all weapon tables
    columnsContainer.append(createWeaponTable("Simple Melee Weapons", simpleMeleeData));
    columnsContainer.append(createWeaponTable("Simple Ranged Weapons", simpleRangedData));
    columnsContainer.append(createWeaponTable("Martial Melee Weapons", martialMeleeData));
    columnsContainer.append(createWeaponTable("Martial Ranged Weapons", martialRangedData));

    // Add roll buttons to all dice notation
    add_journal_roll_buttons(block, undefined, undefined, "DM");

    return block;
}

/**
 * Build the Services reference block
 * @returns {jQuery} The services block element
 */
function buildServicesBlock() {
    const block = $(`<div class='dmScreenBlock' id='dmScreenServices'>
        <div class='dmScreenColumns'></div>
    </div>`);

    const columnsContainer = block.find('.dmScreenColumns');

    // Introduction
    const introSection = $(`
        <div class='dmScreenChunk'>
        </div>
    `);
    columnsContainer.append(introSection);

    // Lifestyle Expenses
    const lifestyleSection = $(`
        <div class='dmScreenChunk'>
            <h2>Lifestyle Expenses</h2>
            <div class='dmScreenChunkDefinition'>
                Lifestyle expenses summarize the cost of living in a fantasy world. They cover lodging, food, equipment maintenance, and other necessities.<br><br>
                At the start of each week or month, players can choose a lifestyle below - Wretched, Squalid, Poor, Modest, Comfortable, Wealthy, or Aristocratic - and pay the price to sustain that lifestyle.<br><br>
                Lifestyles have no inherent consequences, but the DM might take them into account when determining risks or how others perceive your character.<br><br>
                <strong>Wretched (Free):</strong> You survive via chance and charity. You're often exposed to natural dangers as a result of sleeping outside.<br><br>
                <strong>Squalid (1 SP per Day):</strong> You spend the bare minimum for your necessities. You might be exposed to unhealthy conditions and opportunistic criminals.<br><br>
                <strong>Poor (2 SP per Day):</strong> You spend frugally for your necessities.<br><br>
                <strong>Modest (1 GP per Day):</strong> You support yourself at an average level.<br><br>
                <strong>Comfortable (2 GP per Day):</strong> You spend modestly for your necessities and enjoy a few luxuries.<br><br>
                <strong>Wealthy (4 GP per Day):</strong> You're accustomed to the finer things in life and might have servants.<br><br>
                <strong>Aristocratic (10 GP per Day):</strong> You pay for the best and might have a staff that supports your lifestyle. Others notice your wealth and might encourage you to share it, either legally or otherwise.
            </div>
        </div>
    `);
    columnsContainer.append(lifestyleSection);

    // Food, Drink, and Lodging
    const foodLodgingData = [
        { item: "Ale (mug)", cost: "4 CP" },
        { item: "Bread (loaf)", cost: "2 CP" },
        { item: "Cheese (wedge)", cost: "1 SP" },
        { item: "<strong>Inn Stay per Day</strong>", cost: "" },
        { item: "&nbsp;&nbsp;Squalid", cost: "7 CP" },
        { item: "&nbsp;&nbsp;Poor", cost: "1 SP" },
        { item: "&nbsp;&nbsp;Modest", cost: "5 SP" },
        { item: "&nbsp;&nbsp;Comfortable", cost: "8 SP" },
        { item: "&nbsp;&nbsp;Wealthy", cost: "2 GP" },
        { item: "&nbsp;&nbsp;Aristocratic", cost: "4 GP" },
        { item: "<strong>Meal</strong>", cost: "" },
        { item: "&nbsp;&nbsp;Squalid", cost: "1 CP" },
        { item: "&nbsp;&nbsp;Poor", cost: "2 CP" },
        { item: "&nbsp;&nbsp;Modest", cost: "1 SP" },
        { item: "&nbsp;&nbsp;Comfortable", cost: "2 SP" },
        { item: "&nbsp;&nbsp;Wealthy", cost: "3 SP" },
        { item: "&nbsp;&nbsp;Aristocratic", cost: "6 SP" },
        { item: "<strong>Wine (bottle)</strong>", cost: "" },
        { item: "&nbsp;&nbsp;Common", cost: "2 SP" },
        { item: "&nbsp;&nbsp;Fine", cost: "10 GP" }
    ];

    const foodLodgingSection = $(`
        <div class='dmScreenChunk'>
            <h2>Food, Drink, and Lodging</h2>
            <div class='dmScreenChunkDefinition'>
                The Food, Drink, and Lodging table gives prices for food and a single night's lodging. Prices for daily lodging and meals are included in lifestyle's expenses.
            </div>
            <table style='width: 100%; border-collapse: collapse; margin-top: 10px;'>
                <thead>
                    <tr>
                        <th style='text-align: left; padding: 8px; border-bottom: 2px solid #ccc;'>Item</th>
                        <th style='text-align: left; padding: 8px; border-bottom: 2px solid #ccc;'>Cost</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
    `);

    const foodLodgingTbody = foodLodgingSection.find('tbody');
    foodLodgingData.forEach(row => {
        foodLodgingTbody.append(`
            <tr>
                <td style='padding: 8px; border-bottom: 1px solid #eee;'>${row.item}</td>
                <td style='padding: 8px; border-bottom: 1px solid #eee;'>${row.cost}</td>
            </tr>
        `);
    });
    columnsContainer.append(foodLodgingSection);

    // Travel
    const travelData = [
        { service: "Coach ride between towns", cost: "3 CP per mile" },
        { service: "Coach ride within a city", cost: "1 CP per mile" },
        { service: "Road or gate toll", cost: "1 CP" },
        { service: "Ship's passage", cost: "1 SP per mile" }
    ];

    const travelSection = $(`
        <div class='dmScreenChunk'>
            <h2>Travel</h2>
            <div class='dmScreenChunkDefinition'>
                Drivers or crew hired to conduct passengers to their destinations charge the rates on the Travel table, plus any tolls or additional expenses.
            </div>
            <table style='width: 100%; border-collapse: collapse; margin-top: 10px;'>
                <thead>
                    <tr>
                        <th style='text-align: left; padding: 8px; border-bottom: 2px solid #ccc;'>Service</th>
                        <th style='text-align: left; padding: 8px; border-bottom: 2px solid #ccc;'>Cost</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
    `);

    const travelTbody = travelSection.find('tbody');
    travelData.forEach(row => {
        travelTbody.append(`
            <tr>
                <td style='padding: 8px; border-bottom: 1px solid #eee;'>${row.service}</td>
                <td style='padding: 8px; border-bottom: 1px solid #eee;'>${row.cost}</td>
            </tr>
        `);
    });
    columnsContainer.append(travelSection);

    // Hirelings
    const hirelingsData = [
        { service: "Skilled hireling", cost: "2 GP per day" },
        { service: "Untrained hireling", cost: "2 SP per day" },
        { service: "Messenger", cost: "2 CP per mile" }
    ];

    const hirelingsSection = $(`
        <div class='dmScreenChunk'>
            <h2>Hirelings</h2>
            <div class='dmScreenChunkDefinition'>
                Skilled hirelings include anyone hired to perform a service that involves a proficiency (including weapon, tool, or skill): a mercenary, an artisan, a scribe, or the like. The pay shown on the Hirelings table is a minimum; some expert hirelings require more pay. Untrained hirelings are hired for work that requires no particular proficiencies; they include laborers and porters.
            </div>
            <table style='width: 100%; border-collapse: collapse; margin-top: 10px;'>
                <thead>
                    <tr>
                        <th style='text-align: left; padding: 8px; border-bottom: 2px solid #ccc;'>Service</th>
                        <th style='text-align: left; padding: 8px; border-bottom: 2px solid #ccc;'>Cost</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
    `);

    const hirelignsTbody = hirelingsSection.find('tbody');
    hirelingsData.forEach(row => {
        hirelignsTbody.append(`
            <tr>
                <td style='padding: 8px; border-bottom: 1px solid #eee;'>${row.service}</td>
                <td style='padding: 8px; border-bottom: 1px solid #eee;'>${row.cost}</td>
            </tr>
        `);
    });
    columnsContainer.append(hirelingsSection);

    // Spellcasting Services
    const spellcastingData = [
        { level: "Cantrip", availability: "Village, town, or city", cost: "30 GP" },
        { level: "1", availability: "Village, town, or city", cost: "50 GP" },
        { level: "2", availability: "Village, town, or city", cost: "200 GP" },
        { level: "3", availability: "Town or city only", cost: "300 GP" },
        { level: "4–5", availability: "Town or city only", cost: "2,000 GP" },
        { level: "6–8", availability: "City only", cost: "20,000 GP" },
        { level: "9", availability: "City only", cost: "100,000 GP" }
    ];

    const spellcastingSection = $(`
        <div class='dmScreenChunk'>
            <h2>Spellcasting</h2>
            <div class='dmScreenChunkDefinition'>
                Most settlements contain individuals who are willing to cast spells in exchange for payment. If a spell has expensive components, add the cost of those components to the cost listed in the Spellcasting Services table. The higher the level of a desired spell, the harder it is to find someone to cast it.
            </div>
            <table style='width: 100%; border-collapse: collapse; margin-top: 10px;'>
                <thead>
                    <tr>
                        <th style='text-align: left; padding: 8px; border-bottom: 2px solid #ccc;'>Spell Level</th>
                        <th style='text-align: left; padding: 8px; border-bottom: 2px solid #ccc;'>Availability</th>
                        <th style='text-align: left; padding: 8px; border-bottom: 2px solid #ccc;'>Cost</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
    `);

    const spellcastingTbody = spellcastingSection.find('tbody');
    spellcastingData.forEach(row => {
        spellcastingTbody.append(`
            <tr>
                <td style='padding: 8px; border-bottom: 1px solid #eee;'><strong>${row.level}</strong></td>
                <td style='padding: 8px; border-bottom: 1px solid #eee;'>${row.availability}</td>
                <td style='padding: 8px; border-bottom: 1px solid #eee;'>${row.cost}</td>
            </tr>
        `);
    });
    columnsContainer.append(spellcastingSection);

    // Add roll buttons to all dice notation
    add_journal_roll_buttons(block, undefined, undefined, "DM");

    return block;
}

