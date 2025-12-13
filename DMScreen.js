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
                dmScreenBlocks.append(buildImprovisationBlock());
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
        }
    });

    // Load initial block
    dmScreenBlocks.append(buildConditionsBlock());

    // Handle Escape key to hide dmScreenContainer
    $(document).on('keydown', function(e) {
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
function buildImprovisationBlock() {
    const block = $(`<div class='dmScreenBlock' id='dmScreenImprovisation'>
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

    const objectArmorClassData = [
        { substance: "Cloth, paper, rope", ac: "11" },
        { substance: "Crystal, ice, glass", ac: "13" },
        { substance: "Wood, bone", ac: "15" },
        { substance: "Stone", ac: "17" },
        { substance: "Iron, steel", ac: "19" },
        { substance: "Mithral", ac: "21" },
        { substance: "Adamantine", ac: "23" }
    ];

    const objectHitPointsData = [
        { size: "Tiny", fragile: "2 (1d4)",resilient: "5 (2d4)" },
        { size: "Small", fragile: "3 (1d6)",resilient: "10 (3d6)" },
        { size: "Medium", fragile: "4 (1d8)",resilient: "15 (4d8)" },
        { size: "Large", fragile: "6 (1d10)",resilient: "20 (5d10)" },
    ]

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
        { size: "Tiny", hp: "2 (1d4)" },
        { size: "Small", hp: "3 (1d6)" },
        { size: "Medium", hp: "4 (1d8)" },
        { size: "Large", hp: "5 (1d10)" },
        { size: "Huge", hp: "6 (1d12)" },
        { size: "Gargantuan", hp: "7 (2d6)" }
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
                        <th style='text-align: left; padding: 8px; border-bottom: 2px solid #ccc;'>Hit Points</th>
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
                <td style='padding: 8px; border-bottom: 1px solid #eee;'>${row.hp}</td>
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
                <strong>Vehicles.</strong> Characters traveling in a vehicle use the vehicle's speed in miles per hour (as shown in chapter 6 of the Player's Handbook) to determine their rate of travel, and they don't choose a travel pace.
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
                Weather has no significant game effect most of the time, but see "Environmental Effects" in chapter 3 for the effects of extreme weather. Adding weather details to your descriptions of the characters' journey can make it more memorable.
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