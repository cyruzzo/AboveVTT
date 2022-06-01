const slashCommandRegex = /\/(r|roll|save|hit|dmg|skill|w)\s/;
const allowedExpressionCharactersRegex = /^(\d+d\d+|kh\d+|kl\d+|\+|-|\d+|\s+)*/; // this is explicitly different from validExpressionRegex. This matches an expression at the beginning of a string while validExpressionRegex requires the entire string to match.

class ChatObserver {

    //#region PUBLIC

    observe(input) {
        let self = this;
        input.off("keydown").on('keydown', function (e) {
            let input = $(e.target);
            if (e.key === "a" && e.metaKey) {
                input.select();
                return;
            }
            let value = input.val().trim();
            if (e.key === "Enter") {
                if (value.length === 0) {
                    self.#currentIndex = -1;
                    self.#currentValue = "";
                    input.val("");
                    return;
                }
                let slashCommandMatch = value.match(slashCommandRegex);
                if (slashCommandMatch?.index === 0) {
                    if (self.#parseSlashCommand(value)) {
                        self.#didSubmit(input, value);
                    } else {
                        self.#shake(input);
                    }
                } else {
                    self.#sendChatMessage(value);
                    self.#didSubmit(input, value);
                }
            } else if (e.key === "ArrowUp") {
                self.#displayIndex(input, self.#currentIndex + 1)
            } else if (e.key === "ArrowDown") {
                self.#displayIndex(input, self.#currentIndex - 1)
            } else {
                self.#currentIndex = -1;
                self.#currentValue = value;
            }
        });
    }

    stopObserving(input) {
        input.off("keypress");
    }

    //#endregion PUBLIC
    //#region PRIVATE

    #chatHistory = [];
    #currentIndex = -1; // -1 is typing a new thing. any number greater than -1 is navigating through #chatHistory
    #currentValue = ""; // the current value of the input. We hold this separately in case the user navigates through history and then returns back to a new entry

    #didSubmit(input, text) {
        this.#chatHistory.unshift(text);
        this.#chatHistory = this.#chatHistory.slice(0, 100); // only keep the last 100 commands... that already seems like too many
        this.#currentIndex = -1;
        this.#currentValue = "";
        input.val("");
    }

    #parseSlashCommand(text) {
        let slashCommand = text.match(slashCommandRegex)?.[0];
        let expression = text.replace(slashCommandRegex, "").match(allowedExpressionCharactersRegex)?.[0];
        let action = text.replace(slashCommandRegex, "").replace(allowedExpressionCharactersRegex, "");
        console.debug("ChatObserver#parseSlashCommand text: ", text, ", slashCommand:", slashCommand, ", expression: ", expression, ", action: ", action);
        let rollType = undefined;
        if (slashCommand.startsWith("/r")) {
            // /r and /roll allow users to set both the action and the rollType by separating them with `:` so try to parse that out
            [action, rollType] = action.split(":") || [undefined, undefined];
        } else if (slashCommand.startsWith("/hit")) {
            rollType = "to hit";
        } else if (slashCommand.startsWith("/dmg")) {
            rollType = "damage";
        } else if (slashCommand.startsWith("/skill")) {
            rollType = "check";
        } else if (slashCommand.startsWith("/save")) {
            rollType = "save";
        }

        let diceRoll = new DiceRoll(expression, action, rollType);
        let didSend = window.diceRoller.roll(diceRoll);
        if (didSend === false) {
            // it was too complex so try to send it through rpgDiceRoller
            didSend = send_rpg_dice_to_ddb(expression, window.pc.name, window.pc.image, rollType, undefined, action);
        }

        return didSend;
    }

    #sendChatMessage(text) {
        let data = {
            player: window.PLAYER_NAME,
            img: window.PLAYER_IMG,
            dmonly: false
        };

        if (text.startsWith("/w")) {
            let matches = text.match(/\[(.*?)] (.*)/);
            if (matches.length === 3) {
                data.whisper = matches[1]
                data.text = `<div class="custom-gamelog-message"><b>&#8594;${matches[1]}</b>&nbsp;${matches[2]}</div>`;
            }
        } else if (validateUrl(text)) {
            data.text = `
                <a class='chat-link' href='${text}' target='_blank' rel='noopener noreferrer'>${text}</a>
                <img width=200 class='magnify' src='${parse_img(text)}' href='${parse_img(text)}' alt='Chat Image' style='display: none'/>
            `; // `href` is not valid on `img` tags, but magnific uses it so make sure it's there
        } else {
            data.text = `<div class="custom-gamelog-message">${text}</div>`
        }

        window.MB.inject_chat(data);
    }

    #displayIndex(input, index) {
        if (this.#chatHistory.length === 0) {
            this.#shake(input);
            return;
        }
        if (index >= this.#chatHistory.length || index < -1) {
            this.#shake(input);
            return;
        }

        this.#currentIndex = index;

        if (this.#currentIndex === -1) {
            input.val(this.#currentValue);
        } else {
            input.val(this.#chatHistory[this.#currentIndex]);
        }
    }

    #shake(input) {
        input.addClass("chat-error-shake");
        setTimeout(function () {
            input.removeClass("chat-error-shake");
        }, 50);
    }

    //#endregion PRIVATE
}
