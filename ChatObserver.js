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
                let slashCommandMatch = value.match(diceRollCommandRegex);
                if (slashCommandMatch !== null) {
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
        let diceRoll = DiceRoll.fromSlashCommand(text);
     
        let didSend = window.diceRoller.roll(diceRoll); // TODO: update this with more details?
        if (didSend === false) {
            // it was too complex so try to send it through rpgDiceRoller
            let expression = text.replace(diceRollCommandRegex, "").match(allowedExpressionCharactersRegex)?.[0];
            didSend = send_rpg_dice_to_ddb(expression, window.pc.name, window.pc.image, rollType, undefined, action);
        }
        return didSend;
        

    }

    async #sendChatMessage(text) {
        let player = window.PLAYER_NAME;
        let image = window.PLAYER_IMG;
        if(window.DM && window.CURRENTLY_SELECTED_TOKENS.length > 0) {
            let id = window.CURRENTLY_SELECTED_TOKENS[0];
            let firstToken = window.TOKEN_OBJECTS[id];
            image = firstToken.options.imgsrc;
            player = window.CURRENTLY_SELECTED_TOKENS.map(id => window.TOKEN_OBJECTS[id].options.name).join(", ");
        }
        let data = {
            player: player,
            img: image,
            dmonly: false,
            language: $('#chat-language').val()

        };

        if (text.startsWith("/w")) {
            let matches = text.match(/\[(.*?)] (.*)/);
            if (matches.length === 3) {
                data.whisper = matches[1]
                data.text = `<div class="custom-gamelog-message"style="position: relative;margin-bottom: 12px;"><span style='font-size: 9px;position: absolute;bottom: -18px;left: 0px;opacity: 0.5;margin-top: 10px;'><b>To: ${matches[1]}</b></span>${matches[2]}</div>`;
            }
        } 
        else if(text.startsWith("/dm")){     
            data.whisper = "THE DM"
            data.text = `<div class="custom-gamelog-message"style="position: relative;margin-bottom: 12px;"><span style='font-size: 9px;position: absolute;bottom: -18px;left: 0px;opacity: 0.5;margin-top: 10px;'><b>To: THE DM</b></span>&nbsp;${text.replace('/dm', '')}</div>`;  
        }else if (validateUrl(text)) {
            data.text = `
                <a class='chat-link' href='${text}' target='_blank' rel='noopener noreferrer'>${text}</a>
                <img width=100% class='magnify' src='${await parse_img(text)}' href='${await parse_img(text)}' alt='Chat Image' style='display: none'/>
                <video width=100% class='magnify' autoplay muted loop src='${await parse_img(text)}' href='${await parse_img(text)}' alt='Chat Video' style='display: none'/>
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
