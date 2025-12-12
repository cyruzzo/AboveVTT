console.log("DMScreen.js is loading");

/**
 * Initialize the DM_SCREEN array for the current campaign
 * Should be called on startup
 */

function initDmScreen() {
    console.log("initDmScreen called");

    let cont = $(`<div id='dmScreenContainer'>
            <div class='dmScreenheader'>
                <h2 class='dmScreenTitle'>
                    Conditions <span>▼</span>
                </h2>
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
    const conditions = [
        {
            name: "Blinded", definition: `
            While you have the Blinded condition, you experience the following effects.<br>
            <strong><em>Can't See. </em></strong>You can't see and automatically fail any ability check that requires sight.<br>
            <strong><em>Attacks Affected. </em></strong>Attack rolls against you have Advantage and your attack rolls have Disadvantage.<br>
            `
        },
        {
            name: "Charmed", definition: `
            While you have the Charmed condition, you experience the following effects.<br>
            <strong><em>Can't Harm the Charmer. </em></strong>You can't attack the charmer or target the charmer with damaging abilities or magical effects.<br>
            <strong><em>Social Advantage. </em></strong>The charmer has Advantage on any ability check to interact with you socially.<br>
            `
        },
        {
            name: "Deafened", definition: `
            While you have the Deafened condition, you experience the following effect.<br>
            <strong><em>Can't Hear. </em></strong>You can't hear and automatically fail any ability check that requires hearing.<br>
            `
        },
        {
            name: "Exhaustion", definition: `
            While you have the Exhaustion condition, you experience the following effects.<br>
            <strong><em>Exhaustion Levels. </em></strong> This condition is cumulative. Each time you receive it, you gain 1 Exhaustion level. You die if your Exhaustion level is 6.<br>
            <strong><em>D20 Tests Affected. </em></strong> When you make a D20 Test, the roll is reduced by 2 times your Exhaustion level.<br>
            <strong><em>Speed Reduced. </em></strong> Your Speed is reduced by a number of feet equal to 5 times your Exhaustion level.<br>
            <strong><em>Removing Exhaustion Levels. </em></strong> Finishing a Long Rest removes 1 of your Exhaustion levels. When your Exhaustion level reaches 0, the condition ends.<br>
            `
        },
        {
            name: "Frightened", definition: `
            While you have the Frightened condition, you experience the following effects.<br>
            <strong><em>Ability Checks and Attacks Affected. </em></strong> You have Disadvantage on ability checks and attack rolls while the source of fear is within line of sight.<br>
            <strong><em>Can't Approach. </em></strong> You can't willingly move closer to the source of fear.<br>
            `
        },
        {
            name: "Grappled", definition: `
            While you have the Grappled condition, you experience the following effects.<br>
            <strong><em>Speed 0. </em></strong> Your Speed is 0 and can't increase.<br>
            <strong><em>Attacks Affected. </em></strong> You have Disadvantage on attack rolls against any target other than the grappler.<br>
            <strong><em>Movable. </em></strong> The grappler can drag or carry you when it moves, but every foot of movement costs it 1 extra foot unless you are Tiny or two or more sizes smaller than it.<br>
            `
        },
        {
            name: "Incapacitated", definition: `
            While you have the Incapacitated condition, you experience the following effects.<br>
            <strong><em>Inactive. </em></strong> You can't take any action, Bonus Action, or Reaction.<br>
            <strong><em>No Concentration. </em></strong> Your Concentration is broken.<br>
            <strong><em>Speechless. </em></strong> You can't speak.<br>
            <strong><em>Surprised. </em></strong> If you're Incapacitated when you roll Initiative, you have Disadvantage on the roll.<br>
            `
        },
        {
            name: "Invisible", definition: `
            While you have the Invisible condition, you experience the following effects.<br>
            <strong><em>Surprise. </em></strong> If you're Invisible when you roll Initiative, you have Advantage on the roll.<br>
            <strong><em>Concealed. </em></strong> You aren't affected by any effect that requires its target to be seen unless the effect's creator can somehow see you. Any equipment you are wearing or carrying is also concealed.<br>
            <strong><em>Attacks Affected. </em></strong> Attack rolls against you have Disadvantage, and your attack rolls have Advantage. If a creature can somehow see you, you don't gain this benefit against that creature.<br>
            `
        },
        {
            name: "Paralyzed", definition: `
            While you have the Paralyzed condition, you experience the following effects.<br>
            <strong><em>Incapacitated. </em></strong> You have the Incapacitated condition.<br>
            <strong><em>Speed 0. </em></strong> Your Speed is 0 and can't increase.<br>
            <strong><em>Saving Throws Affected. </em></strong> You automatically fail Strength and Dexterity saving throws.<br>
            <strong><em>Attacks Affected. </em></strong> Attack rolls against you have Advantage.<br>
            <strong><em>Automatic Critical Hits. </em></strong> Any attack roll that hits you is a Critical Hit if the attacker is within 5 feet of you.<br>
            `
        },
        {
            name: "Petrified", definition: `
            While you have the Petrified condition, you experience the following effects.<br>
            <strong><em>Turned to Inanimate Substance. </em></strong> You are transformed, along with any nonmagical objects you are wearing and carrying, into a solid inanimate substance (usually stone). Your weight increases by a factor of ten, and you cease aging.<br>
            <strong><em>Incapacitated. </em></strong> You have the Incapacitated condition.<br>
            <strong><em>Speed 0. </em></strong> Your Speed is 0 and can't increase.<br>
            <strong><em>Attacks Affected. </em></strong> Attack rolls against you have Advantage.<br>
            <strong><em>Saving Throws Affected. </em></strong> You automatically fail Strength and Dexterity saving throws.<br>
            <strong><em>Resist Damage. </em></strong> You have Resistance to all damage.<br>
            <strong><em>Poison Immunity. </em></strong> You have Immunity to the Poisoned condition.<br>
            `
        },
        {
            name: "Poisoned", definition: `
            While you have the Poisoned condition, you experience the following effect.<br>
            <strong><em>Ability Checks and Attacks Affected. </em></strong> You have Disadvantage on attack rolls and ability checks.<br>
            `
        },
        {
            name: "Prone", definition: `
            While you have the Prone condition, you experience the following effects.<br>
            <strong><em>Restricted Movement. </em></strong> Your only movement options are to crawl or to spend an amount of movement equal to half your Speed (round down) to right yourself and thereby end the condition. If your Speed is 0, you can't right yourself.<br>
            <strong><em>Attacks Affected. </em></strong> You have Disadvantage on attack rolls. An attack roll against you has Advantage if the attacker is within 5 feet of you. Otherwise, that attack roll has Disadvantage.<br>
            `
        },
        {
            name: "Restrained", definition: `
            While you have the Restrained condition, you experience the following effects.<br>
            <strong><em>Speed 0. </em></strong> Your Speed is 0 and can't increase.<br>
            <strong><em>Attacks Affected. </em></strong> Attack rolls against you have Advantage, and your attack rolls have Disadvantage.<br>
            <strong><em>Saving Throws Affected. </em></strong> You have Disadvantage on Dexterity saving throws.<br>
            `
        },
        {
            name: "Stunned", definition: `
            While you have the Stunned condition, you experience the following effects.<br>
            <strong><em>Incapacitated. </em></strong> You have the Incapacitated condition.<br>
            <strong><em>Saving Throws Affected. </em></strong> You automatically fail Strength and Dexterity saving throws.<br>
            <strong><em>Attacks Affected. </em></strong> Attack rolls against you have Advantage.<br>
            `
        },
        {
            name: "Unconscious", definition: `
            While you have the Unconscious condition, you experience the following effects.<br>
            <strong><em>Inert. </em></strong> You have the Incapacitated and Prone conditions, and you drop whatever you're holding. When this condition ends, you remain Prone.<br>
            <strong><em>Speed 0. </em></strong> Your Speed is 0 and can't increase.<br>
            <strong><em>Attacks Affected. </em></strong> Attack rolls against you have Advantage.<br>
            <strong><em>Saving Throws Affected. </em></strong> You automatically fail Strength and Dexterity saving throws.<br>
            <strong><em>Automatic Critical Hits. </em></strong> Any attack roll that hits you is a Critical Hit if the attacker is within 5 feet of you.<br>
            <strong><em>Unaware. </em></strong> You're unaware of your surroundings.<br>
            `
        },
    ];

    const block = $(`<div class='dmScreenBlock' id='dmScreenChunks'>
        <div class='dmScreenColumns'></div>
    </div>`);

    const columnsContainer = block.find('.dmScreenColumns');

    conditions.forEach(condition => {
        const conditionDiv = $(`
            <div class='dmScreenChunk'>
                <h3>${condition.name}</h3>
                <div class='dmScreenChunkDefinition'>
                    ${condition.definition}
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
    const skills = [
        { name: "Acrobatics (Dex)", description: "Stay on your feet in a tricky situation, or perform an acrobatic stunt." },
        { name: "Animal Handling (Wis)", description: "Calm or train an animal, or get an animal to behave in a certain way." },
        { name: "Arcana (Int)", description: "Recall lore about spells, magic items, and the planes of existence." },
        { name: "Athletics (Str)", description: "Jump farther than normal, stay afloat in rough water, or break something." },
        { name: "Deception (Cha)", description: "Tell a convincing lie, or wear a disguise convincingly." },
        { name: "History (Int)", description: "Recall lore about historical events, people, nations, and cultures." },
        { name: "Insight (Wis)", description: "Discern a person's mood and intentions." },
        { name: "Intimidation (Cha)", description: "Awe or threaten someone into doing what you want." },
        { name: "Investigation (Int)", description: "Find obscure information in books, or deduce how something works." },
        { name: "Medicine (Wis)", description: "Diagnose an illness, or determine what killed the recently slain." },
        { name: "Nature (Int)", description: "Recall lore about terrain, plants, animals, and weather." },
        { name: "Perception (Wis)", description: "Using a combination of senses, notice something that's easy to miss." },
        { name: "Performance (Cha)", description: "Act, tell a story, perform music, or dance." },
        { name: "Persuasion (Cha)", description: "Honestly and graciously convince someone of something." },
        { name: "Religion (Int)", description: "Recall lore about gods, religious rituals, and holy symbols." },
        { name: "Sleight of Hand (Dex)", description: "Pick a pocket, conceal a handheld object, or perform legerdemain." },
        { name: "Stealth (Dex)", description: "Escape notice by moving quietly and hiding behind things." },
        { name: "Survival (Wis)", description: "Follow tracks, forage, find a trail, or avoid natural hazards." }
    ];

    const actions = [
        { name: "Attack", description: "When you take the Attack action, you can make one attack roll with a weapon or an Unarmed Strike.<br><strong>Equipping and Unequipping Weapons.</strong> You can either equip or unequip one weapon when you make an attack as part of this action. You do so either before or after the attack. If you equip a weapon before an attack, you don't need to use it for that attack. Equipping a weapon includes drawing it from a sheath or picking it up. Unequipping a weapon includes sheathing, stowing, or dropping it.<br><strong>Moving between Attacks.</strong> If you move on your turn and have a feature, such as Extra Attack, that gives you more than one attack as part of the Attack action, you can use some or all of that movement to move between those attacks." },
        { name: "Dash", description: "When you take the Dash action, you gain extra movement for the current turn. The increase equals your Speed after applying any modifiers. With a Speed of 30 feet, for example, you can move up to 60 feet on your turn if you Dash. If your Speed of 30 feet is reduced to 15 feet, you can move up to 30 feet this turn if you Dash.<br>If you have a special speed, such as a Fly Speed or Swim Speed, you can use that speed instead of your Speed when you take this action. You choose which speed to use each time you take it." },
        { name: "Disengage", description: "If you take the Disengage action, your movement doesn't provoke Opportunity Attacks for the rest of the current turn." },
        { name: "Dodge", description: "If you take the Dodge action, you gain the following benefits: until the start of your next turn, any attack roll made against you has Disadvantage if you can see the attacker, and you make Dexterity saving throws with Advantage.<br>You lose these benefits if you have the Incapacitated condition or if your Speed is 0." },
        { name: "Grapple", description:  `A creature can grapple another creature. Characters typically grapple by using an Unarmed Strike. Many monsters have special attacks that allow them to quickly grapple prey. However a grapple is initiated, it follows these rules.<br><strong>Grapple.</strong> The target must succeed on a Strength or Dexterity saving throw (it chooses which), or it has the Grappled condition. The DC for the saving throw and any escape attempts equals 8 plus your Strength modifier and Proficiency Bonus. This grapple is possible only if the target is no more than one size larger than you and if you have a hand free to grab it.<br><strong>Grappled Condition.</strong> Successfully grappling a creature gives it the Grappled condition.<br><strong>One Grapple per Hand.</strong> A creature must have a hand free to grapple another creature. Some stat blocks and game effects allow a creature to grapple using a tentacle, a maw, or another body part. Whatever part a grappler uses, it can grapple only one creature at a time with that part, and the grappler can't use that part to target another creature unless it ends the grapple.<br><strong>Escaping a Grapple.</strong> A Grappled creature can use its action to make a Strength (Athletics) or Dexterity (Acrobatics) check against the grapple's escape DC, ending the condition on itself on a success. The condition also ends if the grappler has the Incapacitated condition or if the distance between the Grappled target and the grappler exceeds the grapple's range.` },
        { name: "Help", description: "When you take the Help action, you do one of the following.<br><strong>Assist an Ability Check.</strong> Choose one of your skill or tool proficiencies and one ally who is near enough for you to assist verbally or physically when they make an ability check. That ally has Advantage on the next ability check they make with the chosen skill or tool. This benefit expires if the ally doesn't use it before the start of your next turn. The DM has final say on whether your assistance is possible.<br><strong>Assist an Attack Roll.</strong> You momentarily distract an enemy within 5 feet of you, giving Advantage to the next attack roll by one of your allies against that enemy. This benefit expires at the start of your next turn." },
        { name: "Hide", description: "With the Hide action, you try to conceal yourself. To do so, you must succeed on a DC 15 Dexterity (Stealth) check while you're Heavily Obscured or behind Three-Quarters Cover or Total Cover, and you must be out of any enemy's line of sight; if you can see a creature, you can discern whether it can see you.<br>On a successful check, you have the Invisible condition. Make note of your check's total, which is the DC for a creature to find you with a Wisdom (Perception) check.<br>The condition ends on you immediately after any of the following occurs: you make a sound louder than a whisper, an enemy finds you, you make an attack roll, or you cast a spell with a Verbal component." },
        { name: "Improvise", description: "Player characters and monsters can also do things not covered by these actions. Many class features and other abilities provide additional action options, and you can improvise other actions. When you describe an action not detailed elsewhere in the rules, the Dungeon Master tells you whether that action is possible and what kind of D20 Test you need to make, if any." },
        { name: "Influence", description: "With the Influence action, you urge a monster to do something. Describe or roleplay how you're communicating with the monster. Are you trying to deceive, intimidate, amuse, or gently persuade? The DM then determines whether the monster feels willing, unwilling, or hesitant due to your interaction; this determination establishes whether an ability check is necessary." },
        { name: "Magic", description: "When you take the Magic action, you cast a spell that has a casting time of an action or use a feature or magic item that requires a Magic action to be activated.<br>If you cast a spell that has a casting time of 1 minute or longer, you must take the Magic action on each turn of that casting, and you must maintain Concentration while you do so. If your Concentration is broken, the spell fails, but you don't expend a spell slot." },
        { name: "Ready", description: "You take the Ready action to wait for a particular circumstance before you act. To do so, you take this action on your turn, which lets you act by taking a Reaction before the start of your next turn.<br>First, you decide what perceivable circumstance will trigger your Reaction. Then, you choose the action you will take in response to that trigger, or you choose to move up to your Speed in response to it. Examples include \"If the cultist steps on the trapdoor, I'll pull the lever that opens it,\" and \"If the zombie steps next to me, I move away.\"<br>When the trigger occurs, you can either take your Reaction right after the trigger finishes or ignore the trigger.<br>When you Ready a spell, you cast it as normal (expending any resources used to cast it) but hold its energy, which you release with your Reaction when the trigger occurs. To be readied, a spell must have a casting time of an action, and holding on to the spell's magic requires Concentration, which you can maintain up to the start of your next turn. If your Concentration is broken, the spell dissipates without taking effect." },
        { name: "Search", description: "When you take the Search action, you make a Wisdom check to discern something that isn't obvious. The Search table suggests which skills are applicable when you take this action, depending on what you're trying to detect." },
        { name: "Shove", description: "The target must succeed on a Strength or Dexterity saving throw (it chooses which), or you either push it 5 feet away or cause it to have the Prone condition. The DC for the saving throw equals 8 plus your Strength modifier and Proficiency Bonus. This shove is possible only if the target is no more than one size larger than you." },
        { name: "Study", description: "When you take the Study action, you make an Intelligence check to study your memory, a book, a clue, or another source of knowledge and call to mind an important piece of information about it." },
        { name: "Utilize", description: "You normally interact with an object while doing something else, such as when you draw a sword as part of the Attack action. When an object requires an action for its use, you take the Utilize action." }
    ];

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
            Some spells require Concentration to maintain. If you lose Concentration, the spell ends.<br>
            <strong><em>Breaking Concentration.</em></strong> You lose Concentration on a spell if you cast another spell that requires Concentration, you take damage (DC 10 or half the damage taken, whichever is higher), you have the Incapacitated condition, or you die.<br>
            <strong><em>Environmental Phenomena.</em></strong> The DM might rule that other phenomena can break Concentration, such as a wave crashing over you.
            `
        },
    ];

    // Add Skills section
    const skillsSection = $(`<div class='dmScreenChunk'><h3>Skills</h3></div>`);
    skills.forEach(skill => {
        skillsSection.append(`<div><strong>${skill.name}:</strong> ${skill.description}</div>`);
    });
    columnsContainer.append(skillsSection);

    // Add Vision section
    const visionSection = $(`
        <div class='dmScreenChunk'>
            <h3>Light</h3>
            <div class='dmScreenChunkDefinition'>
                The presence or absence of light determines the category of illumination in an area, as defined below.<br>
                <strong>Bright Light.</strong> Bright Light lets most creatures see normally. Even gloomy days provide Bright Light, as do torches, lanterns, fires, and other sources of illumination within a specific radius.<br>
                <strong>Dim Light.</strong> Dim Light, also called shadows, creates a Lightly Obscured area. An area of Dim Light is usually a boundary between Bright Light and surrounding Darkness. The soft light of twilight and dawn also counts as Dim Light. A full moon might bathe the land in Dim Light.<br>
                <strong>Darkness.</strong> Darkness creates a Heavily Obscured area. Characters face Darkness outdoors at night (even most moonlit nights), within the confines of an unlit dungeon, or in an area of magical Darkness.<br>
            </div>
            <div class='dmScreenChunkDefinition'>
            <h3>Visibility</h3>
                <strong>Lightly Obscured</strong><br>
                You have Disadvantage on Wisdom (Perception) checks to see something in a Lightly Obscured space.<br>
                <strong>Heavily Obscured</strong><br>
                You have the Blinded condition while trying to see something in a Heavily Obscured space.
            </div>
            <div class='dmScreenChunkDefinition'>
            <h3>Cover</h3>
                Cover provides a degree of protection to a target behind it. There are three degrees of cover, each of which provides a different benefit to a target. If behind more than one degree of cover, a target benefits only from the most protective degree.<br>
                <strong>Half Cover:</strong> +2 bonus to AC and Dexterity saving throws<br>
                <strong>Three-Quarters Cover:</strong> +5 bonus to AC and Dexterity saving throws<br>
                <strong>Total Cover:</strong> can't be targeted directly.
            </div>
        </div>
    `);
    columnsContainer.append(visionSection);

    // Add Mechanics section
    mechanics.forEach(mechanic => {
        const mechanicDiv = $(`
            <div class='dmScreenChunk'>
                <h3>${mechanic.name}</h3>
                <div class='dmScreenChunkDefinition'>
                    ${mechanic.description}
                </div>
            </div>
        `);
        columnsContainer.append(mechanicDiv);
    });

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
            <h3>Mob Attacks</h3>
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

    const actions = [
        { name: "Attack", description: "When you take the Attack action, you can make one attack roll with a weapon or an Unarmed Strike.<br><strong>Equipping and Unequipping Weapons.</strong> You can either equip or unequip one weapon when you make an attack as part of this action. You do so either before or after the attack. If you equip a weapon before an attack, you don't need to use it for that attack. Equipping a weapon includes drawing it from a sheath or picking it up. Unequipping a weapon includes sheathing, stowing, or dropping it.<br><strong>Moving between Attacks.</strong> If you move on your turn and have a feature, such as Extra Attack, that gives you more than one attack as part of the Attack action, you can use some or all of that movement to move between those attacks." },
        { name: "Dash", description: "When you take the Dash action, you gain extra movement for the current turn. The increase equals your Speed after applying any modifiers. With a Speed of 30 feet, for example, you can move up to 60 feet on your turn if you Dash. If your Speed of 30 feet is reduced to 15 feet, you can move up to 30 feet this turn if you Dash.<br>If you have a special speed, such as a Fly Speed or Swim Speed, you can use that speed instead of your Speed when you take this action. You choose which speed to use each time you take it." },
        { name: "Disengage", description: "If you take the Disengage action, your movement doesn't provoke Opportunity Attacks for the rest of the current turn." },
        { name: "Dodge", description: "If you take the Dodge action, you gain the following benefits: until the start of your next turn, any attack roll made against you has Disadvantage if you can see the attacker, and you make Dexterity saving throws with Advantage.<br>You lose these benefits if you have the Incapacitated condition or if your Speed is 0." },
        { name: "Grapple", description:  `A creature can grapple another creature. Characters typically grapple by using an Unarmed Strike. Many monsters have special attacks that allow them to quickly grapple prey. However a grapple is initiated, it follows these rules.<br><strong>Grapple.</strong> The target must succeed on a Strength or Dexterity saving throw (it chooses which), or it has the Grappled condition. The DC for the saving throw and any escape attempts equals 8 plus your Strength modifier and Proficiency Bonus. This grapple is possible only if the target is no more than one size larger than you and if you have a hand free to grab it.<br><strong>Grappled Condition.</strong> Successfully grappling a creature gives it the Grappled condition.<br><strong>One Grapple per Hand.</strong> A creature must have a hand free to grapple another creature. Some stat blocks and game effects allow a creature to grapple using a tentacle, a maw, or another body part. Whatever part a grappler uses, it can grapple only one creature at a time with that part, and the grappler can't use that part to target another creature unless it ends the grapple.<br><strong>Escaping a Grapple.</strong> A Grappled creature can use its action to make a Strength (Athletics) or Dexterity (Acrobatics) check against the grapple's escape DC, ending the condition on itself on a success. The condition also ends if the grappler has the Incapacitated condition or if the distance between the Grappled target and the grappler exceeds the grapple's range.` },
        { name: "Help", description: "When you take the Help action, you do one of the following.<br><strong>Assist an Ability Check.</strong> Choose one of your skill or tool proficiencies and one ally who is near enough for you to assist verbally or physically when they make an ability check. That ally has Advantage on the next ability check they make with the chosen skill or tool. This benefit expires if the ally doesn't use it before the start of your next turn. The DM has final say on whether your assistance is possible.<br><strong>Assist an Attack Roll.</strong> You momentarily distract an enemy within 5 feet of you, giving Advantage to the next attack roll by one of your allies against that enemy. This benefit expires at the start of your next turn." },
        { name: "Hide", description: "With the Hide action, you try to conceal yourself. To do so, you must succeed on a DC 15 Dexterity (Stealth) check while you're Heavily Obscured or behind Three-Quarters Cover or Total Cover, and you must be out of any enemy's line of sight; if you can see a creature, you can discern whether it can see you.<br>On a successful check, you have the Invisible condition. Make note of your check's total, which is the DC for a creature to find you with a Wisdom (Perception) check.<br>The condition ends on you immediately after any of the following occurs: you make a sound louder than a whisper, an enemy finds you, you make an attack roll, or you cast a spell with a Verbal component." },
        { name: "Improvise", description: "Player characters and monsters can also do things not covered by these actions. Many class features and other abilities provide additional action options, and you can improvise other actions. When you describe an action not detailed elsewhere in the rules, the Dungeon Master tells you whether that action is possible and what kind of D20 Test you need to make, if any." },
        { name: "Influence", description: "With the Influence action, you urge a monster to do something. Describe or roleplay how you're communicating with the monster. Are you trying to deceive, intimidate, amuse, or gently persuade? The DM then determines whether the monster feels willing, unwilling, or hesitant due to your interaction; this determination establishes whether an ability check is necessary." },
        { name: "Magic", description: "When you take the Magic action, you cast a spell that has a casting time of an action or use a feature or magic item that requires a Magic action to be activated.<br>If you cast a spell that has a casting time of 1 minute or longer, you must take the Magic action on each turn of that casting, and you must maintain Concentration while you do so. If your Concentration is broken, the spell fails, but you don't expend a spell slot." },
        { name: "Ready", description: "You take the Ready action to wait for a particular circumstance before you act. To do so, you take this action on your turn, which lets you act by taking a Reaction before the start of your next turn.<br>First, you decide what perceivable circumstance will trigger your Reaction. Then, you choose the action you will take in response to that trigger, or you choose to move up to your Speed in response to it. Examples include \"If the cultist steps on the trapdoor, I'll pull the lever that opens it,\" and \"If the zombie steps next to me, I move away.\"<br>When the trigger occurs, you can either take your Reaction right after the trigger finishes or ignore the trigger.<br>When you Ready a spell, you cast it as normal (expending any resources used to cast it) but hold its energy, which you release with your Reaction when the trigger occurs. To be readied, a spell must have a casting time of an action, and holding on to the spell's magic requires Concentration, which you can maintain up to the start of your next turn. If your Concentration is broken, the spell dissipates without taking effect." },
        { name: "Search", description: "When you take the Search action, you make a Wisdom check to discern something that isn't obvious. The Search table suggests which skills are applicable when you take this action, depending on what you're trying to detect." },
        { name: "Shove", description: "The target must succeed on a Strength or Dexterity saving throw (it chooses which), or you either push it 5 feet away or cause it to have the Prone condition. The DC for the saving throw equals 8 plus your Strength modifier and Proficiency Bonus. This shove is possible only if the target is no more than one size larger than you." },
        { name: "Study", description: "When you take the Study action, you make an Intelligence check to study your memory, a book, a clue, or another source of knowledge and call to mind an important piece of information about it." },
        { name: "Utilize", description: "You normally interact with an object while doing something else, such as when you draw a sword as part of the Attack action. When an object requires an action for its use, you take the Utilize action." }
    ];

    // Add Actions section
    actions.forEach(action => {
        const actionDiv = $(`
            <div class='dmScreenChunk'>
                <h3>${action.name}</h3>
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
            <h3>Improvising Damage</h3>
            <table style='width: 100%; border-collapse: collapse; margin-bottom: 20px;'>
                <thead>
                    <tr>
                        <th style='text-align: left; padding: 8px; border-bottom: 2px solid #ccc;'>Dice</th>
                        <th style='text-align: left; padding: 8px; border-bottom: 2px solid #ccc;'>Examples</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
            
            <h3>Damage Severity and Level</h3>
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
            <h3>Object Armor Class</h3>
            <table style='width: 100%; border-collapse: collapse; margin-bottom: 20px;'>
                <thead>
                    <tr>
                        <th style='text-align: left; padding: 8px; border-bottom: 2px solid #ccc;'>Material</th>
                        <th style='text-align: left; padding: 8px; border-bottom: 2px solid #ccc;'>AC</th>
                    </tr>
                </thead>
                <tbody id='objectACTableBody'></tbody>
            </table>
            
            <h3>Object Hit Points</h3>
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
            <h3>Huge and Gargantuan Objects</h3>
            <div class='dmScreenChunkDefinition'>
                Normal weapons are of little use against many Huge and Gargantuan objects, such as a colossal statue, towering column of stone, or massive boulder. That said, one torch can burn a Huge tapestry, and an earthquake spell can reduce a colossus to rubble. You can track a Huge or Gargantuan object's hit points if you like, or you can simply decide how long the object can withstand whatever weapon or force is acting against it. If you track hit points for the object, divide it into Large or smaller sections, and track each section's hit points separately. Destroying one of those sections could ruin the entire object. For example, a Gargantuan statue of a human might topple over when one of its Large legs is reduced to 0 hit points.
            </div>
        </div>
    `);

    columnsContainer.append(additionalObjectSection);

    const objectDamageTypesSection = $(`
        <div class='dmScreenChunk'>
            <h3>Objects and Damage Types</h3>
            <div class='dmScreenChunkDefinition'>
                Objects are immune to poison and psychic damage. You might decide that some damage types are more effective against a particular object or substance than others. For example, bludgeoning damage works well for smashing things but not for cutting through rope or leather. Paper or cloth objects might be vulnerable to fire and lightning damage. A pick can chip away stone but can't effectively cut down a tree. As always, use your best judgment.
            </div>
        </div>
    `);

    columnsContainer.append(objectDamageTypesSection);

    const damageThresholdSection = $(`
        <div class='dmScreenChunk'>
            <h3>Damage Threshold</h3>
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
            <h3>Journey Stages</h3>
            <div class='dmScreenChunkDefinition'>
                It can be helpful to break up a journey into stages, with each stage representing anything from a few hours' journey to ten days or so of travel. A journey might have only a single stage if the trip is a matter of following a clear path to a well-known destination. A journey consisting of three stages makes for a satisfying trek. For example, the characters might travel along a river to the forest's edge (stage 1), follow a trail into the heart of the woods (stage 2), and then search the woods for an ancient ruin (stage 3). A long journey might involve even more stages and occupy several game sessions.
            </div>
        </div>
    `);

    columnsContainer.append(journeyStagesSection);

    // Travel Pace
    const travelPaceSection = $(`
        <div class='dmScreenChunk'>
            <h3>Travel Pace</h3>
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
            <h3>Travel Terrain</h3>
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
            <h3>Weather</h3>
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