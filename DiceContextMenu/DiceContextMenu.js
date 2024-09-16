
function gamelog_send_to_text() {
    // TODO: track characters page in window.sendTo so we know what they have set even if the gamelog is not on the screen
    let expectedButtonText = $(".glc-game-log [class*='-SendToLabel']").parent().find("button").text();
    if (expectedButtonText !== undefined && expectedButtonText.length > 0) {
        return expectedButtonText.replace(/\s+/g, '');
    }
    if (is_characters_page()) {
        return "Everyone"
    }
    return "Self"
}

function standard_dice_context_menu(expression, modifierString = "", action = undefined, rollType = undefined, name = undefined, avatarUrl = undefined, entityType = undefined, entityId = undefined) {
    if (typeof modifierString !== "string") {
        modifierString = "";
    }
    let menu = new DiceContextMenu();
    
    menu.sendToSection();
   
    if (expression === "1d20" || /^1d20[+-]([0-9]+)/g.test(expression)) {
        // only add advantage/disadvantage options if rolling 1d20
        menu.section("ROLL WITH:", s => s
            .row("Advantage", svg_advantage(), false)
            .row("Flat (One Die)", svg_flat(), true)
            .row("Disadvantage", svg_disadvantage(), false)
        )
    }
    menu.onRollClick(dcm => {

        let rollWithIndex = dcm.checkedRowIndex(1);

        let diceRoll;
        if (rollWithIndex === 0) { // advantage
            diceRoll = new DiceRoll(`2d20kh1${modifierString}`);
        } else if (rollWithIndex === 1) {
            diceRoll = new DiceRoll(`1d20${modifierString}`);
        } else if (rollWithIndex === 2) { // disadvantage
            diceRoll = new DiceRoll(`2d20kl1${modifierString}`);
        } else { // advantage/disadvantage options were not displayed. This will happen any time the expression is not 1d20
            diceRoll = new DiceRoll(`${expression}${modifierString}`);
        }

        diceRoll.action = action;
        diceRoll.rollType = rollType;
        diceRoll.name = name;
        diceRoll.avatarUrl = avatarUrl;
        diceRoll.entityType = entityType;
        diceRoll.entityId = entityId;
        diceRoll.sendToOverride = dcm.checkedRow(0)?.title?.replace(/\s+/g, "");
     
        window.diceRoller.roll(diceRoll);
        
    });

    return menu;
}

function damage_dice_context_menu(diceExpression, modifierString = "", action = undefined, rollType = undefined, name = undefined, avatarUrl = undefined, entityType = undefined, entityId = undefined, damageType = undefined) {
    if (typeof modifierString !== "string") {
        modifierString = "";
    }
    let menu = new DiceContextMenu()
   
        
        menu.sendToSection()
        
        menu.section("ROLL AS:", s => s
            .row("Crit Damage", "", false)
            .row("Flat Roll", "", true)
        )
        menu.onRollClick(dcm => {

            let rollAsIndex = dcm.checkedRowIndex(1);

            let diceRoll;
            if (rollAsIndex === 0) {
                // crit damage
                let expressionParts = diceExpression.split("d");
                let numberOfDice = parseInt(expressionParts[0]) * 2;
                diceRoll = new DiceRoll(`${numberOfDice}d${expressionParts[1].split(/(?=[+-])|(?<=[+-])/g)[0]}${modifierString}`)
            } else if (rollAsIndex === 1) {
                // flat roll
                diceRoll = new DiceRoll(`${diceExpression}`);
            } else { // not possible
                console.warn("DiceContextMenu unexpectedly gave an invalid row index for section 1! rollAsIndex: ", rollAsIndex, ", dcm: ", dcm);
            }


            diceRoll.sendToOverride = dcm.checkedRow(0)?.title?.replace(/\s+/g, "");
            diceRoll.action = action;
            diceRoll.rollType = rollType;
            diceRoll.name = name;
            diceRoll.avatarUrl = avatarUrl;
            diceRoll.entityType = entityType;
            diceRoll.entityId = entityId;
           
            window.diceRoller.roll(diceRoll, undefined, undefined, undefined, undefined, damageType);
            
        });

    return menu;
}

class DiceContextMenu {

    constructor() {
        this.sections = [];
    }

    section(sectionTitle, builderCallback) {
        let newSection = new DiceContextMenuSection(sectionTitle, this.sections.length);
        this.sections.push(newSection);
        builderCallback(newSection);
        return this;
    }

    sendToSection() {
        let sendToText = gamelog_send_to_text();
        return this.section("SEND TO:", s => {
            s.row("Everyone", svg_everyone(), sendToText === "Everyone");
            s.row("Self", svg_self(), sendToText === "Self");
            if (!window.DM && window.EXPERIMENTAL_SETTINGS['rpgRoller'] == true) {
                s.row("Dungeon Master", svg_dm(), sendToText === "Dungeon Master");
            }
        })
    }

    onRollClick(callback) {
        this.callback = callback;
        return this;
    }

    build() {
        let html = $(`
        	<div role="presentation" class="dcm-backdrop">
                <div class="dcm-container">
                    <ul class="dcm-section-list"></ul>
                </div>
	        </div>
        `);
        html.on("click", function (clickEvent) {
            $(".dcm-backdrop").remove();
        });
        let sectionList = html.find("ul");
        this.sections.forEach(s => {
            let li = $(`<li></li>`);
            li.append(s.build());
            sectionList.append(li);
            sectionList.append(`<hr class="dcm-hr">`);
        });

        let rollButton = $(`<button class="dcm-roll-button" tabIndex="0" type="button">Roll</button>`);
        rollButton.on("click", function(rollButtonClick) {
            window.dcm.rollDice();
        });
        sectionList.after(rollButton)
        return html;
    }

    present(top, left) {
        $(".dcm-backdrop").remove();
        let html = this.build(top, left);
        $("body").append(html);

        let container = html.find(".dcm-container");
        if (top < 0) {
            top = 0;
        } else if (top >= (window.innerHeight - container.height())) {
            top = (window.innerHeight - container.height());
        }
        if (left < 0) {
            left = 0;
        } else if (left >= (window.innerWidth - container.width())) {
            left = (window.innerWidth - container.width());
        }
        html.find(".dcm-container").css({ top: top, left: left });

        window.dcm = this;
    }

    didClickRow(sectionIndex, rowIndex) {
        this.sections[sectionIndex].didClickRow(rowIndex);
    }

    rollDice() {
        if (typeof this.callback === 'function') {
            this.callback(this);
        } else {
            console.warn("onRollClick was not set");
        }
    }

    checkedRowIndex(sectionIndex) {
        return this.sections[sectionIndex]?.checkedIndex();
    }

    checkedRow(sectionIndex) {
        return this.sections[sectionIndex]?.checkedRow();
    }
}

class DiceContextMenuSection {
    constructor(title, index) {
        this.title = title;
        this.rows = [];
        this.index = index;
    }
    row(rowTitle, iconHtml, isChecked) {
        let row = new DiceContextMenuRow(iconHtml, rowTitle, isChecked, this.index, this.rows.length);
        this.rows.push(row);
        return this;
    }
    build() {
        let sectionHtml = $(`
            <ul class="dcm-section" data-index="${this.index}">
                <li class="dcm-section-header">${this.title}</li>
            </ul>
        `);
        this.rows.forEach(r => sectionHtml.append(r.build()))
        return sectionHtml;
    }
    didClickRow(index) {
        this.rows.forEach(row => {
            row.isChecked = (index == row.index); // explicitly not using `===` because this is often comparing a number and a string
        });
    }
    checkedIndex() {
        return this.rows.findIndex(r => r.isChecked === true);
    }
    checkedRow() {
        return this.rows[this.checkedIndex()];
    }
}

class DiceContextMenuRow {
    constructor(iconHtml, title, isChecked, sectionIndex, index) {
        this.iconHtml = iconHtml;
        this.title = title;
        this.isChecked = isChecked;
        this.sectionIndex = sectionIndex;
        this.index = index;
    }
    build() {
        let rowHtml = $(`
            <div class="dcm-row" role="button" tabIndex="0" data-index="${this.index}" data-section-index="${this.sectionIndex}">
                <div class="dcm-row-icon">
                    ${this.iconHtml || ''}
                </div>
                <div class="dcm-row-title">
                    <span>${this.title}</span>
                </div>
            </div>
        `);
        if (this.isChecked) {
            rowHtml.append(svg_checkmark());
        }
        rowHtml.on("click", function(rowClickEvent) {
            rowClickEvent.stopPropagation();
            let clickedRow = $(rowClickEvent.currentTarget);
            let clickedRowIndex = clickedRow.attr("data-index");
            let clickedSectionIndex = clickedRow.attr("data-section-index");
            clickedRow.parent().find(".dcm-checkmark").remove();
            clickedRow.append(svg_checkmark());
            window.dcm.didClickRow(clickedSectionIndex, clickedRowIndex);
        });
        return rowHtml;
    }
}

function svg_checkmark() {
    return `<svg class="dcm-checkmark dcm-svg" focusable="false" aria-hidden="true" viewBox="0 0 24 24"><path fill-rule="evenodd" clip-rule="evenodd" d="M6.00025 16C5.74425 16 5.48825 15.902 5.29325 15.707L0.29325 10.707C-0.09775 10.316 -0.09775 9.68401 0.29325 9.29301C0.68425 8.90201 1.31625 8.90201 1.70725 9.29301L6.00025 13.586L16.2932 3.29301C16.6842 2.90201 17.3162 2.90201 17.7073 3.29301C18.0983 3.68401 18.0983 4.31601 17.7073 4.70701L6.70725 15.707C6.51225 15.902 6.25625 16 6.00025 16Z" fill="#1B9AF0"></path></svg>`;
}
function svg_everyone() {
    return `<svg class="dcm-svg" focusable="false" aria-hidden="true" viewBox="0 0 24 24"><path d="M9 13.75c-2.34 0-7 1.17-7 3.5V19h14v-1.75c0-2.33-4.66-3.5-7-3.5zM4.34 17c.84-.58 2.87-1.25 4.66-1.25s3.82.67 4.66 1.25H4.34zM9 12c1.93 0 3.5-1.57 3.5-3.5S10.93 5 9 5 5.5 6.57 5.5 8.5 7.07 12 9 12zm0-5c.83 0 1.5.67 1.5 1.5S9.83 10 9 10s-1.5-.67-1.5-1.5S8.17 7 9 7zm7.04 6.81c1.16.84 1.96 1.96 1.96 3.44V19h4v-1.75c0-2.02-3.5-3.17-5.96-3.44zM15 12c1.93 0 3.5-1.57 3.5-3.5S16.93 5 15 5c-.54 0-1.04.13-1.5.35.63.89 1 1.98 1 3.15s-.37 2.26-1 3.15c.46.22.96.35 1.5.35z" fill="#A7B6C2"></path></svg>`;
}
function svg_self() {
    return `<svg class="dcm-svg" focusable="false" aria-hidden="true" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM7.07 18.28C7.5 17.38 10.12 16.5 12 16.5C13.88 16.5 16.51 17.38 16.93 18.28C15.57 19.36 13.86 20 12 20C10.14 20 8.43 19.36 7.07 18.28ZM18.36 16.83C16.93 15.09 13.46 14.5 12 14.5C10.54 14.5 7.07 15.09 5.64 16.83C4.62 15.49 4 13.82 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 13.82 19.38 15.49 18.36 16.83ZM12 6C10.06 6 8.5 7.56 8.5 9.5C8.5 11.44 10.06 13 12 13C13.94 13 15.5 11.44 15.5 9.5C15.5 7.56 13.94 6 12 6ZM12 11C11.17 11 10.5 10.33 10.5 9.5C10.5 8.67 11.17 8 12 8C12.83 8 13.5 8.67 13.5 9.5C13.5 10.33 12.83 11 12 11Z" fill="#A7B6C2"></path></svg>`;
}
function svg_advantage() {
    return `<svg class="dcm-svg" focusable="false" aria-hidden="true" viewBox="0 0 48 48"><g><polygon fill="#fff" points="33 6 38 36 10 36 16 6"></polygon><polygon fill="#2C9400" points="24 14 28 26 20 26 24 14"></polygon><path fill="#2C9400" d="M44.39,12.1,23.89.39,3.5,12.29,3.61,35.9l20.5,11.71L44.5,35.71ZM31,36l-2-6H19l-2,6H10L21,8h6L38,36Z"></path></g></svg>`;
}
function svg_disadvantage() {
    return `<svg class="dcm-svg" focusable="false" aria-hidden="true" viewBox="0 0 48 48"><g><polygon fill="#fff" points="35 8 36 39 12 39 14 8"></polygon><path fill="#b00000" d="M27.38,17.75a9.362,9.362,0,0,1,1.44,5.68v1.12a9.4423,9.4423,0,0,1-1.44,5.71A5.21983,5.21983,0,0,1,23,32H21V16h2A5.19361,5.19361,0,0,1,27.38,17.75Z"></path><path fill="#b00000" d="M44.39,12.1,23.89.39,3.5,12.29,3.61,35.9l20.5,11.71L44.5,35.71ZM35.21,24.55a13.50293,13.50293,0,0,1-1.5,6.41,11.09308,11.09308,0,0,1-4.25,4.42A12.00926,12.00926,0,0,1,23.34,37H15V11h8.16a12.35962,12.35962,0,0,1,6.2,1.56,10.97521,10.97521,0,0,1,4.29,4.41,13.31084,13.31084,0,0,1,1.56,6.39Z"></path></g></svg>`;
}
function svg_flat() {
    return `<svg class="dcm-svg" focusable="false" aria-hidden="true" viewBox="0 0 16 18"><path d="M8 0L0 4.28571V12.9714L8 17.2571L15.4286 13.2571L16 12.9143V4.28571L8 0ZM6.85714 4.74286L3.48571 9.77143L1.37143 5.2L6.85714 4.74286ZM4.57143 10.2857L8 5.08571L11.4286 10.2857H4.57143ZM12.4571 9.77143L9.14286 4.74286L14.5714 5.14286L12.4571 9.77143ZM8.57143 1.6L12.8 3.88571L8.57143 3.54286V1.6ZM7.42857 1.6V3.54286L3.2 3.88571L7.42857 1.6ZM1.14286 7.31429L2.68571 10.7429L1.14286 11.6571V7.31429ZM1.71429 12.6286L3.25714 11.7143L5.77143 14.8571L1.71429 12.6286ZM4.57143 11.4286H10.8571L8 15.7143L4.57143 11.4286ZM10.2286 14.8L12.7429 11.6571L14.2857 12.5714L10.2286 14.8ZM13.4286 10.8L13.3143 10.7429L14.8571 7.31429V11.6571L13.4286 10.8Z" fill="#8A9BA8"></path></svg>`;
}
function svg_dm() {
    return `<svg class="dcm-svg" focusable="false" aria-hidden="true" viewBox="0 0 24 24"><path fill-rule="evenodd" clip-rule="evenodd" d="M3 17V7h4a2 2 0 012 2v6a2 2 0 01-2 2H3zm4-8H5v6h2V9zm4.586-1.414A2 2 0 0113 7h6a2 2 0 012 2v8h-2V9h-2v7h-2V9h-2v8h-2V9a2 2 0 01.586-1.414z" fill="#A7B6C2"></path></svg>`;
}
