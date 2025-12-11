console.log("DMScreen.js is loading");

/**
 * Initialize the DM_SCREEN array for the current campaign
 * Should be called on startup
 */

function initDmScreen() {
    console.log("initDmScreen called");

    let cont = $(`<div id='dmScreenContainer'>
			<div id='dmScreenBlocks'>
				
			</div>
		</div>`);

    $(window.document.body).append(cont);

    const dmScreenBlocks = $("#dmScreenBlocks");

    // Load each block
    dmScreenBlocks.append(buildConditionsBlock());
    // Add more blocks here as you create them
    // dmScreenBlocks.append(buildSkillsBlock());
    // dmScreenBlocks.append(buildCombatActionsBlock());
}

/**
 * Build the Conditions reference block
 * @returns {jQuery} The conditions block element
 */
function buildConditionsBlock() {
    const conditions = [
        {
            name: "Blinded", definition: `
            While you have the Blinded condition, you experience the following effects.<br><br>
            <strong><em>Can't See. </em></strong>You can't see and automatically fail any ability check that requires sight.<br>
            <strong><em>Attacks Affected. </em></strong>Attack rolls against you have Advantage and your attack rolls have Disadvantage.<br>
            `
        },
        {
            name: "Charmed", definition: `
            While you have the Charmed condition, you experience the following effects.<br><br>
            <strong><em>Can't Harm the Charmer. </em></strong>You can't attack the charmer or target the charmer with damaging abilities or magical effects.<br><br>
            <strong><em>Social Advantage. </em></strong>The charmer has Advantage on any ability check to interact with you socially.<br>
            `
        },
        {
            name: "Deafened", definition: `
            While you have the Deafened condition, you experience the following effect.<br><br>
            <strong><em>Can't Hear. </em></strong>You can't hear and automatically fail any ability check that requires hearing.<br>
            `
        },
        {
            name: "Exhaustion", definition: `
            While you have the Exhaustion condition, you experience the following effects.<br><br>
            <strong><em>Exhaustion Levels. </em></strong> This condition is cumulative. Each time you receive it, you gain 1 Exhaustion level. You die if your Exhaustion level is 6.<br>
            <strong><em>D20 Tests Affected. </em></strong> When you make a D20 Test, the roll is reduced by 2 times your Exhaustion level.<br>
            <strong><em>Speed Reduced. </em></strong> Your Speed is reduced by a number of feet equal to 5 times your Exhaustion level.<br>
            <strong><em>Removing Exhaustion Levels. </em></strong> Finishing a Long Rest removes 1 of your Exhaustion levels. When your Exhaustion level reaches 0, the condition ends.<br>
            `
        },
        {
            name: "Frightened", definition: `
            While you have the Frightened condition, you experience the following effects.<br><br>
            <strong><em>Ability Checks and Attacks Affected. </em></strong> You have Disadvantage on ability checks and attack rolls while the source of fear is within line of sight.<br>
            <strong><em>Can't Approach. </em></strong> You can't willingly move closer to the source of fear.<br>
            `
        },
        {
            name: "Grappled", definition: `
            While you have the Grappled condition, you experience the following effects.<br><br>
            <strong><em>Speed 0. </em></strong> Your Speed is 0 and can't increase.<br>
            <strong><em>Attacks Affected. </em></strong> You have Disadvantage on attack rolls against any target other than the grappler.<br>
            <strong><em>Movable. </em></strong> The grappler can drag or carry you when it moves, but every foot of movement costs it 1 extra foot unless you are Tiny or two or more sizes smaller than it.<br>
            `
        },
        {
            name: "Incapacitated", definition: `
            While you have the Incapacitated condition, you experience the following effects.<br><br>
            <strong><em>Inactive. </em></strong> You can't take any action, Bonus Action, or Reaction.<br>
            <strong><em>No Concentration. </em></strong> Your Concentration is broken.<br>
            <strong><em>Speechless. </em></strong> You can't speak.<br>
            <strong><em>Surprised. </em></strong> If you're Incapacitated when you roll Initiative, you have Disadvantage on the roll.<br>
            `
        },
        {
            name: "Invisible", definition: `
            While you have the Invisible condition, you experience the following effects.<br><br>
            <strong><em>Surprise. </em></strong> If you're Invisible when you roll Initiative, you have Advantage on the roll.<br>
            <strong><em>Concealed. </em></strong> You aren't affected by any effect that requires its target to be seen unless the effect's creator can somehow see you. Any equipment you are wearing or carrying is also concealed.<br>
            <strong><em>Attacks Affected. </em></strong> Attack rolls against you have Disadvantage, and your attack rolls have Advantage. If a creature can somehow see you, you don't gain this benefit against that creature.<br>
            `
        },
        {
            name: "Paralyzed", definition: `
            While you have the Paralyzed condition, you experience the following effects.<br><br>
            <strong><em>Incapacitated. </em></strong> You have the Incapacitated condition.<br>
            <strong><em>Speed 0. </em></strong> Your Speed is 0 and can't increase.<br>
            <strong><em>Saving Throws Affected. </em></strong> You automatically fail Strength and Dexterity saving throws.<br>
            <strong><em>Attacks Affected. </em></strong> Attack rolls against you have Advantage.<br>
            <strong><em>Automatic Critical Hits. </em></strong> Any attack roll that hits you is a Critical Hit if the attacker is within 5 feet of you.<br>
            `
        },
        {
            name: "Petrified", definition: `
            While you have the Petrified condition, you experience the following effects.<br><br>
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
            While you have the Poisoned condition, you experience the following effect.<br><br>
            <strong><em>Ability Checks and Attacks Affected. </em></strong> You have Disadvantage on attack rolls and ability checks.<br>
            `
        },
        {
            name: "Prone", definition: `
            While you have the Prone condition, you experience the following effects.<br><br>
            <strong><em>Restricted Movement. </em></strong> Your only movement options are to crawl or to spend an amount of movement equal to half your Speed (round down) to right yourself and thereby end the condition. If your Speed is 0, you can't right yourself.<br>
            <strong><em>Attacks Affected. </em></strong> You have Disadvantage on attack rolls. An attack roll against you has Advantage if the attacker is within 5 feet of you. Otherwise, that attack roll has Disadvantage.<br>
            `
        },
        {
            name: "Restrained", definition: `
            While you have the Restrained condition, you experience the following effects.<br><br>
            <strong><em>Speed 0. </em></strong> Your Speed is 0 and can't increase.<br>
            <strong><em>Attacks Affected. </em></strong> Attack rolls against you have Advantage, and your attack rolls have Disadvantage.<br>
            <strong><em>Saving Throws Affected. </em></strong> You have Disadvantage on Dexterity saving throws.<br>
            `
        },
        {
            name: "Stunned", definition: `
            While you have the Stunned condition, you experience the following effects.<br><br>
            <strong><em>Incapacitated. </em></strong> You have the Incapacitated condition.<br>
            <strong><em>Saving Throws Affected. </em></strong> You automatically fail Strength and Dexterity saving throws.<br>
            <strong><em>Attacks Affected. </em></strong> Attack rolls against you have Advantage.<br>
            `
        },
        {
            name: "Unconscious", definition: `
            While you have the Unconscious condition, you experience the following effects.<br><br>
            <strong><em>Inert. </em></strong> You have the Incapacitated and Prone conditions, and you drop whatever you're holding. When this condition ends, you remain Prone.<br>
            <strong><em>Speed 0. </em></strong> Your Speed is 0 and can't increase.<br>
            <strong><em>Attacks Affected. </em></strong> Attack rolls against you have Advantage.<br>
            <strong><em>Saving Throws Affected. </em></strong> You automatically fail Strength and Dexterity saving throws.<br>
            <strong><em>Automatic Critical Hits. </em></strong> Any attack roll that hits you is a Critical Hit if the attacker is within 5 feet of you.<br>
            <strong><em>Unaware. </em></strong> You're unaware of your surroundings.<br>
            `
        },
    ];

    const block = $(`<div class='dmScreenBlock' id='dmScreenConditions'>
        <h2>Conditions</h2>
        <div class='dmScreenConditionsColumns'></div>
    </div>`);

    const columnsContainer = block.find('.dmScreenConditionsColumns');
    
    conditions.forEach(condition => {
        const conditionDiv = $(`
            <div class='dmScreenCondition'>
                <h3>${condition.name}</h3>
                <div class='dmScreenConditionDefinition'>
                    ${condition.definition}
                </div>
            </div>
        `);
        columnsContainer.append(conditionDiv);
    });

    return block;
}

/**
 * Build the Skills reference block (example)
 * @returns {jQuery} The skills block element
 */
function buildSkillsBlock() {
    const block = $(`<div class='dmScreenBlock' id='dmScreenSkills'>
        <h2>Skills</h2>
    </div>`);

    // Add your skills content here
    block.append(`<p>Skills content goes here...</p>`);

    return block;
}

/**
 * Build the Combat Actions reference block (example)
 * @returns {jQuery} The combat actions block element
 */
function buildCombatActionsBlock() {
    const block = $(`<div class='dmScreenBlock' id='dmScreenCombat'>
        <h2>Combat Actions</h2>
    </div>`);

    // Add your combat actions content here
    block.append(`<p>Combat actions content goes here...</p>`);

    return block;
}