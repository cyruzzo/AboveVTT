
function init_sidebar_tabs() {
  console.log("init_sidebar_tabs");

  let sidebarContent = is_characters_page() ? $(".ct-sidebar__inner [class*='styles_content']>div:first-of-type") : $(".sidebar__pane-content");

  // Journal needs to load before scenes for scene  notes
  if (window.JOURNAL === undefined) {
    init_journal(find_game_id());
  }
  if (window.DM) {
    startup_step(`Loading Token Panel`);
    $("#tokens-panel").remove();
    tokensPanel = new SidebarPanel("tokens-panel", false);
    sidebarContent.append(tokensPanel.build());
    init_tokens_panel();
    startup_step(`Loading Scenes Panel`);
    $("#scenes-panel").remove();
    scenesPanel = new SidebarPanel("scenes-panel", false);
    sidebarContent.append(scenesPanel.build());
    init_scenes_panel();

  } else {
    startup_step(`Loading Players Panel`);
    $("#players-panel").remove();
    playersPanel = new SidebarPanel("players-panel", false);
    sidebarContent.append(playersPanel.build());
    update_pclist();
  }

  startup_step(`Loading Sounds Panel`);
  $("#sounds-panel").remove();
  soundsPanel = new SidebarPanel("sounds-panel", false);
  sidebarContent.append(soundsPanel.build());
  window.draw_audio_sidepanel();

  startup_step(`Loading Journal Panel`);
  $("#journal-panel").remove();
  journalPanel = new SidebarPanel("journal-panel", false);
  sidebarContent.append(journalPanel.build());
  if (window.JOURNAL === undefined) {
    init_journal(find_game_id());
  } else if(window.JOURNAL.chapters?.length > 0){
    window.JOURNAL.build_journal()
  }
  startup_step(`Loading Settings Panel`);
  $("#settings-panel").remove();
  settingsPanel = new SidebarPanel("settings-panel", false);
  sidebarContent.append(settingsPanel.build());
  init_settings();

  observe_hover_text($(".sidebar__inner"));
  observe_hover_text($(".sidebar-panel-content"));
}

function sidebar_modal_is_open() {
	return $("#VTTWRAPPER .sidebar-modal").length > 0;
}

function close_sidebar_modal() {
	$("#VTTWRAPPER .sidebar-modal").remove();
    window.current_sidebar_modal = undefined;
}

function display_sidebar_modal(sidebarPanel) {
  $("#VTTWRAPPER").append(sidebarPanel.build());
  window.current_sidebar_modal = sidebarPanel;
  observe_hover_text(sidebarPanel.container);
}

function observe_hover_text(sidebarPanelContent) {
  sidebarPanelContent.off("mouseenter mouseleave").on("mouseenter mouseleave", ".sidebar-hover-text:not(.chat-text-wrapper)", function(hoverEvent) {
    const displayText = $(hoverEvent.currentTarget).attr("data-hover");
    if (typeof displayText === "string" && displayText.length > 0) {
      if (hoverEvent.type === "mouseenter") {
        build_and_display_sidebar_flyout(hoverEvent.clientY, function (flyout) {
          flyout.append(`<div class="sidebar-hover-text-flyout">${displayText}</div>`);
          if(sidebarPanelContent.hasClass('context-menu-flyout'))
            position_flyout_right_of(sidebarPanelContent, flyout);
          else
            position_flyout_left_of(sidebarPanelContent, flyout);
        });
      } else {
        // only remove hover text flyouts. Don't remove other types of flyouts that may or may not be up
        $(".sidebar-hover-text-flyout").closest(".sidebar-flyout").remove();
      }
    }
  });
}

class SidebarPanel {

  //#region Class construction and variables

  id = "#unknown_panel"; // String: the unique element id of this panel. Examples: #player_panel, #monsters_panel, etc
  is_modal = true;       // Boolean: true if this panel will be displayed as a modal, false if this panel will be permanently fixed in a sidebar tab

  constructor(id, is_modal) {
    this.id = id.startsWith("#") ? id.substring(1) : id;
    if (is_modal == false) {
      // this.is_modal defaults to true. If anything other than false is passed in (such as undefined), just leave it as the default.
      this.is_modal = is_modal;
    }
  }

  get container() {
    return $(`#${this.id}`);
  }

  get header() {
    return $(`#${this.id} .sidebar-panel-header`);
  }

  get body() {
    return $(`#${this.id} .sidebar-panel-body`);
  }

  get footer() {
    return $(`#${this.id} .sidebar-panel-footer`);
  }

  // input wrapper is where all inputs should go. When building a sidebar panel with inputs, be sure to add them here
  // inputWrapper stacks everything vertically so if you need things side by side, wrap them in a div, and do that there. See build_image_url_input for an example.
  get inputWrapper() {
    return $(`#${this.id} .sidebar-panel-footer .footer-input-wrapper`);
  }

  //#endregion Class construction and variables
  //#region Class functions

  hide() {
    this.container.hide();
  }

  show() {
    this.container.show();
  }

  updateHeader(title = "", subtitle = "", explanationText = "") {
    let header = this.header;
    header.find(".sidebar-panel-header-title").text(title);
    header.find(".sidebar-panel-header-subtitle").text(subtitle);
    header.find(".sidebar-panel-header-explanation").text(explanationText);
  }

  display_sidebar_loading_indicator(subtext) {
    let loadingIndicator = $(`
      <div class="sidebar-panel-loading-indicator">
        <svg class="beholder-dm-screen loading-status-indicator__svg animate" viewBox="0 0 285 176" fill="none" xmlns="http://www.w3.org/2000/svg" style="overflow:overlay;margin-top:100px;width:100%;position:relative;padding:0 10%;"><defs><path id="beholder-eye-move-path" d="M0 0 a 15 5 0 0 0 15 0 a 15 5 0 0 1 -15 0 z"></path><clipPath id="beholder-eye-socket-clip-path"><path id="eye-socket" fill-rule="evenodd" clip-rule="evenodd" d="M145.5 76c-8.562 0-15.5-7.027-15.5-15.694 0-8.663 6.938-1.575 15.5-1.575 8.562 0 15.5-7.088 15.5 1.575C161 68.973 154.062 76 145.5 76z"></path></clipPath></defs><g class="beholder-dm-screen__beholder"><path fill-rule="evenodd" clip-rule="evenodd" d="M145.313 77.36c-10.2 0-18.466-8.27-18.466-18.47 0-10.197 8.266-1.855 18.466-1.855 10.199 0 18.465-8.342 18.465 1.855 0 10.2-8.266 18.47-18.465 18.47m59.557 4.296l-.083-.057c-.704-.5-1.367-1.03-1.965-1.59a12.643 12.643 0 0 1-1.57-1.801c-.909-1.268-1.51-2.653-1.859-4.175-.355-1.521-.461-3.179-.442-4.977.007-.897.049-1.835.087-2.827.038-.995.079-2.032.053-3.194-.031-1.158-.11-2.445-.519-3.97a10.494 10.494 0 0 0-1.014-2.43 8.978 8.978 0 0 0-1.938-2.32 9.64 9.64 0 0 0-2.468-1.54l-.314-.137-.299-.114-.609-.212c-.382-.105-.787-.227-1.151-.298-1.495-.315-2.819-.383-4.065-.39-1.248-.004-2.407.087-3.534.2a56.971 56.971 0 0 0-3.18.44c-6.271.646-12.648 1.559-13.689-.837-1.079-2.487-3.35-8.058 3.115-12.19 4.076.154 8.141.347 12.179.62 1.461.098 2.914.212 4.36.34-4.614.924-9.314 1.7-14.019 2.43h-.015a2.845 2.845 0 0 0-2.388 3.066 2.84 2.84 0 0 0 3.088 2.574c5.125-.462 10.25-.973 15.416-1.696 2.592-.378 5.17-.776 7.88-1.42a29.7 29.7 0 0 0 2.108-.59c.181-.06.363-.117.56-.193.197-.072.378-.136.594-.227.208-.09.405-.17.643-.291l.345-.174.394-.235c.064-.042.124-.076.196-.125l.235-.174.235-.174.117-.099.148-.136c.098-.094.189-.189.283-.287l.137-.152a3.44 3.44 0 0 0 .166-.22c.114-.154.224-.317.318-.484l.072-.125.038-.064.042-.09a5.06 5.06 0 0 0 .367-1.154c.045-.308.06-.63.045-.944a4.322 4.322 0 0 0-.042-.458 5.19 5.19 0 0 0-.386-1.207 5.356 5.356 0 0 0-.499-.799l-.091-.117-.072-.083a5.828 5.828 0 0 0-.303-.318l-.155-.151-.083-.076-.057-.05a9.998 9.998 0 0 0-.503-.382c-.152-.102-.28-.178-.424-.265l-.205-.124-.181-.091-.36-.186a18.713 18.713 0 0 0-.643-.28l-.591-.23c-1.521-.538-2.853-.856-4.197-1.159a83.606 83.606 0 0 0-3.951-.772c-2.604-.45-5.185-.829-7.763-1.166-4.273-.564-8.531-1.029-12.785-1.46 0-.004-.004-.004-.004-.004a38.55 38.55 0 0 0-4.81-3.1v-.004c.397-.223.965-.424 1.688-.549 1.135-.208 2.551-.242 4.05-.185 3.024.11 6.366.59 10.022.662 1.832.02 3.781-.056 5.84-.56a12.415 12.415 0 0 0 3.081-1.188 10.429 10.429 0 0 0 2.702-2.135 2.841 2.841 0 0 0-3.774-4.205l-.208.152c-.825.594-1.76.87-2.956.942-1.188.068-2.566-.09-4.004-.367-2.907-.553-6.003-1.556-9.5-2.32-1.763-.371-3.644-.7-5.802-.73a16.984 16.984 0 0 0-3.455.298 13.236 13.236 0 0 0-3.774 1.333 13.065 13.065 0 0 0-3.376 2.615 14.67 14.67 0 0 0-1.646 2.154h-.004a41.49 41.49 0 0 0-8.436-.863c-1.518 0-3.017.079-4.489.238-1.79-1.563-3.444-3.198-4.833-4.913a21.527 21.527 0 0 1-1.4-1.903 15.588 15.588 0 0 1-1.094-1.893c-.606-1.241-.905-2.422-.893-3.22a3.38 3.38 0 0 1 .038-.55c.034-.155.06-.31.121-.446.106-.273.276-.534.571-.776.579-.496 1.681-.81 2.884-.689 1.207.114 2.487.629 3.615 1.476 1.135.848 2.111 2.044 2.868 3.444l.038.076a2.848 2.848 0 0 0 3.471 1.329 2.843 2.843 0 0 0 1.714-3.641c-.768-2.135-1.96-4.235-3.675-6.003-1.71-1.76-3.924-3.18-6.502-3.872a12.604 12.604 0 0 0-4.076-.416 11.248 11.248 0 0 0-4.284 1.128 10.405 10.405 0 0 0-3.702 3.054c-.499.655-.901 1.37-1.237 2.104-.318.73-.568 1.488-.731 2.237-.337 1.503-.356 2.96-.238 4.315.125 1.362.405 2.63.764 3.822.36 1.196.803 2.317 1.298 3.373a31.9 31.9 0 0 0 1.605 3.043c.458.768.935 1.506 1.427 2.233h-.004a39.13 39.13 0 0 0-4.515 2.384c-3.111-.344-6.2-.76-9.242-1.294-2.033-.364-4.043-.769-6.007-1.26-1.96-.485-3.876-1.045-5.662-1.726a24.74 24.74 0 0 1-2.528-1.102c-.772-.393-1.48-.829-1.987-1.234a4.916 4.916 0 0 1-.56-.507c-.02-.015-.03-.03-.046-.045.288-.28.761-.621 1.314-.905.719-.382 1.566-.711 2.456-.984 1.79-.556 3.762-.9 5.76-1.098l.046-.007a2.843 2.843 0 0 0 2.547-2.805 2.846 2.846 0 0 0-2.824-2.868c-2.301-.02-4.628.11-7.028.567-1.2.231-2.418.538-3.671 1.022-.628.246-1.26.526-1.911.901a10.12 10.12 0 0 0-1.96 1.446c-.648.62-1.307 1.438-1.757 2.524-.114.261-.197.56-.284.844a7.996 7.996 0 0 0-.166.909c-.061.609-.05 1.237.049 1.809.189 1.162.632 2.12 1.109 2.891a11.265 11.265 0 0 0 1.529 1.942c1.056 1.082 2.127 1.88 3.194 2.6a33.287 33.287 0 0 0 3.21 1.855c2.142 1.093 4.284 1.979 6.434 2.774a98.121 98.121 0 0 0 6.464 2.112c.511.147 1.018.291 1.529.435a36.8 36.8 0 0 0-4.458 7.089v.004c-1.908-2.014-3.876-3.997-6.022-5.931a52.386 52.386 0 0 0-3.471-2.888 31.347 31.347 0 0 0-2.028-1.408 17.575 17.575 0 0 0-2.574-1.378 11.177 11.177 0 0 0-1.888-.616c-.761-.16-1.73-.31-3.02-.107a6.543 6.543 0 0 0-1.007.254 6.508 6.508 0 0 0-2.79 1.84 6.7 6.7 0 0 0-.594.783c-.083.129-.174.269-.238.39a7.248 7.248 0 0 0-.681 1.692 9.383 9.383 0 0 0-.3 2.02c-.022.584 0 1.09.038 1.568.084.953.231 1.786.401 2.577l.39 1.764c.027.14.065.268.087.408l.057.428.121.855.065.428.033.443.072.886c.061.586.061 1.196.076 1.801.05 2.426-.11 4.92-.435 7.407a50.6 50.6 0 0 1-1.503 7.35c-.17.594-.367 1.17-.548 1.76a55.283 55.283 0 0 1-.632 1.684l-.352.791c-.061.129-.114.276-.178.39l-.193.356-.186.355c-.064.121-.129.246-.193.326-.129.185-.257.375-.378.575l-.303.485a2.813 2.813 0 0 0 4.462 3.387c.295-.322.59-.655.878-.988.155-.17.265-.333.382-.496l.349-.488.344-.492c.117-.166.2-.325.303-.492l.583-.98a53.92 53.92 0 0 0 1.018-1.964c.295-.659.61-1.321.89-1.984a58.231 58.231 0 0 0 2.69-8.114 58.405 58.405 0 0 0 1.51-8.493c.068-.73.152-1.454.167-2.203l.045-1.12.02-.56-.012-.568-.004-.205c.167.186.333.371.496.557 1.608 1.84 3.179 3.838 4.708 5.889a181.94 181.94 0 0 1 4.481 6.328c.14.2.311.428.477.617.284.33.594.62.924.874 0 .216.003.424.015.636-2.661 2.861-5.265 5.821-7.748 9.034-1.567 2.06-3.096 4.19-4.485 6.715-.685 1.267-1.347 2.645-1.854 4.363-.246.879-.454 1.851-.496 3.02l-.007.44.022.473c.012.159.02.314.038.477.023.166.05.337.076.503.113.666.333 1.385.65 2.07.16.337.356.67.557.992.212.299.44.613.681.878a8.075 8.075 0 0 0 1.54 1.328c1.05.697 2.04 1.06 2.938 1.31 1.79.466 3.292.519 4.723.507 2.842-.053 5.367-.48 7.853-.98 4.943-1.022 9.618-2.434 14.243-3.948a2.845 2.845 0 0 0 1.911-3.236 2.842 2.842 0 0 0-3.323-2.267h-.015c-4.648.878-9.322 1.635-13.864 1.965-2.252.155-4.511.208-6.46-.027a10.954 10.954 0 0 1-1.685-.322c.004-.015.012-.026.015-.037.133-.273.322-.606.534-.954.235-.36.477-.73.768-1.117 1.14-1.548 2.619-3.164 4.183-4.723a83.551 83.551 0 0 1 2.585-2.468 35.897 35.897 0 0 0 2.312 4.16c.125.2.261.405.397.602 3.747-.413 7.415-1.06 10.356-1.617l.037-.007a7.47 7.47 0 0 1 8.702 5.957 7.491 7.491 0 0 1-4.724 8.38C132.172 94.372 138.542 96 145.313 96c20.358 0 37.087-14.708 38.994-33.514.193-.05.386-.098.576-.144a23.261 23.261 0 0 1 2.354-.458c.726-.102 1.393-.14 1.847-.125.125-.004.193.015.299.012.03.003.064.007.098.007h.053c.008.004.015.004.027.004.106 0 .094-.019.09-.068-.007-.05-.022-.125.019-.117.038.007.125.083.216.26.087.19.186.443.269.761.079.33.159.69.219 1.102.129.806.216 1.745.307 2.725.091.984.178 2.02.306 3.1.262 2.138.682 4.435 1.533 6.683.837 2.245 2.154 4.406 3.812 6.15.825.871 1.725 1.655 2.66 2.336.943.677 1.919 1.26 2.911 1.782a2.848 2.848 0 0 0 3.641-.874 2.848 2.848 0 0 0-.674-3.966" fill="#0398F3"></path><g clip-path="url(#beholder-eye-socket-clip-path)"><circle cx="137.5" cy="60" r="7" fill="#1B9AF0"><animateMotion dur="2.3s" repeatCount="indefinite"><mpath xlink:href="#beholder-eye-move-path"></mpath></animateMotion></circle></g></g><g class="beholder-dm-screen__screen"><path fill="#EAEEF0" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" d="M76 76h136v97H76z"></path><path d="M218 170.926V74.282l64-35.208v96.644l-64 35.208zM70 171.026V74.318L3 38.974v96.708l67 35.344z" fill="#F3F6F9" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"></path></g></svg>
        <div class="loading-status-indicator__subtext">${subtext}</div>
      </div>
    `);
    this.container.find(".sidebar-panel-loading-indicator").remove(); // just in case there was already one shown we don't want to add a second one
    this.container.append(loadingIndicator);
  }

  remove_sidebar_loading_indicator() {
    $(`#${this.id} .sidebar-panel-loading-indicator`).animate({
      "left": "400px"
    }, 500, function() {
      $(".sidebar-panel-loading-indicator").remove();
    });
  }



  //#endregion Class functions
  //#region UI Construction

  build() {
    let panelContainer = $(`
      <div id='${this.id}' class='sidebar-panel-content'>
        <div class="sidebar-panel-header">
          <div class="sidebar-panel-header-title"></div>
          <div class="sidebar-panel-header-subtitle"></div>
          <div class="sidebar-panel-header-explanation"></div>
        </div>
        <div class="sidebar-panel-body"></div>
        <div class="sidebar-panel-footer">
          <div class="footer-input-wrapper"></div>
        </div>
      </div>
    `);

    if (this.is_modal) {
      let closeButton = build_close_button();
      closeButton.click(close_sidebar_modal);
      panelContainer.find(".sidebar-panel-header").prepend(closeButton);

      let modalWrapper = this.build_modal_wrapper();
      modalWrapper.append(panelContainer)

      return modalWrapper;
    } else {
      return panelContainer;
    }
  }

  build_modal_wrapper() {
    return $(`
      <div class="sidebar-modal">
        <div class="sidebar-modal-background"></div>
      </div>
    `);
  }


  // imageUrlEntered is a function that takes a string in the form of a url
  build_image_url_input(titleText, imageUrlEntered) {

    if (typeof imageUrlEntered !== 'function') {
      imageUrlEntered = function(newImageUrl) {
        console.warn(`Failed to provide a valid function to handle ${newImageUrl}`);
      };
    }

    return build_text_input_wrapper(
        titleText,
        `<input title="${titleText}" placeholder="https://..." name="addCustomImage" type="text" />`,
        `<button>Add</button>`,
        async function(imageUrl, input, event) {
          if(imageUrl.startsWith("data:")){
            alert("You cannot use urls starting with data:");
          } else {
            let imageUrlSplit = imageUrl.split(', ');
            for(let i = 0; i < imageUrlSplit.length; i++){
              imageUrlEntered(await parse_img(imageUrlSplit[i]));
            }      
          }
        }
    );
  }
}

function build_close_button() {
  let closeButton = $(`<button class="ddbeb-modal__close-button qa-modal_close" title="Close Modal"><svg class="" xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><g transform="rotate(-45 50 50)"><rect x="0" y="45" width="100" height="10"></rect></g><g transform="rotate(45 50 50)"><rect x="0" y="45" width="100" height="10"></rect></g></svg></button>`);
  closeButton.css({
    "align-items": "center",
    "-webkit-appearance": "none",
    "-o-appearance": "none",
    "appearance": "none",
    "background": "none",
    "border": 0,
    "display": "flex",
    "height": "20px",
    "justify-content": "center",
    "padding": 0,
    "position": "absolute",
    "right": "4px",
    "top": "4px",
    "width": "20px",
    "z-index": 1
  });
  return closeButton;
}

/**
 * @param titleText {string} the text to be displayed above the input
 * @param input {string} the text input to build a wrapper for. eg: `<input type="text" name="someUniqueName" title="this is an input" placeholder="https://..." />`
 * @param sideButton {string|undefined} the button to the right of the label, undefined if you don't want a button. eg: `<button>Add</button>`
 * @param inputSubmitCallback {function|undefined} the function to be called when the user presses enter, or clicks the button. function(inputValue, input, event) { ... }
 * @param submitOnFocusout {boolean|undefined} whether to call inputSubmitCallback when the input loses focus
 * @returns {*|jQuery|HTMLElement}
 */
function build_text_input_wrapper(titleText, input, sideButton, inputSubmitCallback, submitOnFocusout = true) {
  let inputLabel = $(`<div class="token-image-modal-footer-title">${titleText}</div>`);
  let textInput = $(input);
  let submitButton = (sideButton !== undefined && sideButton.length > 0) ? $(sideButton) : $(`<button style="display:none;">Add</button>`);
  submitButton.addClass("sidebar-panel-footer-button token-image-modal-add-button");

  if (typeof inputSubmitCallback !== 'undefined') {
    textInput.on('keyup', function(event) {
      let inputValue = event.target.value;
      if (event.key === "Enter" && inputValue !== undefined && inputValue.length > 0) {
        inputSubmitCallback(inputValue, $(event.target), event);
      } else if (event.key === "Escape") {
        $(event.target).blur();
      }
    });

    if (submitOnFocusout) {
      textInput.on('focusout', function(event) {
        let inputValue = event.target.value;
        if (inputValue !== undefined && inputValue.length > 0) {
          inputSubmitCallback(inputValue, $(event.target), event);
        }
      });
    }

    let inputName = textInput.attr("name");
    submitButton.on("click", function(event) {
      let inputElement = $(event.target).closest(".token-image-modal-url-label-add-wrapper").find(`input[name="${inputName}"]`);
      let inputValue = inputElement[0].value;
      if (inputElement.length > 0 && inputValue !== undefined && inputValue.length > 0) {
        inputSubmitCallback(inputValue, inputElement, event);
        inputElement.val("")
      }
    });
  }

  /* This is the general layout of what we're building. A label above an input, both of which are to the left of an "Add" button that spans the entire height
  |--------------------|
  | Label     |  Add   |
  | Input     | Button |
  |--------------------|
  */
  let labelAndUrlWrapper = $(`<div class="token-image-modal-url-label-wrapper"></div>`); // this is to keep the label and input stacked vertically
  labelAndUrlWrapper.append(inputLabel);                  // label above input
  labelAndUrlWrapper.append(textInput);                   // input below label
  let addButtonAndLabelUrlWrapper = $(`<div class="token-image-modal-url-label-add-wrapper"></div>`); // this is to keep the add button on the right side of the label and input
  addButtonAndLabelUrlWrapper.append(labelAndUrlWrapper); // label/input on the left
  addButtonAndLabelUrlWrapper.append(submitButton);       // add button on the right
  return addButtonAndLabelUrlWrapper;
}

function build_select_input(labelText, input) {
  let wrapper = $(`
    <div class="token-image-modal-footer-select-wrapper">
      <div class="token-image-modal-footer-title">${labelText}</div>
    </div>
  `);
  wrapper.append(input);
  return wrapper;
}

function update_hover_text(hoverElement, hoverText) {
  if (hoverText !== undefined && hoverText.length > 0) {
    hoverElement.addClass("sidebar-hover-text");
    hoverElement.attr("data-hover", hoverText);
    let hoverFlyout = $(".sidebar-flyout .sidebar-hover-text-flyout");
    if (hoverFlyout.length > 0) {
      // update the flyout text and reposition it
      let flyout = hoverFlyout.closest(".sidebar-flyout");
      let previousWidth = flyout.width();
      hoverFlyout.text(hoverText);
      let newWidth = flyout.width();
      let oldPosition = flyout.position().left;
      flyout.css("left", oldPosition + (previousWidth - newWidth));
    }
  } else {
    hoverElement.removeClass("sidebar-hover-text");
    hoverElement.removeAttr("data-hover");
  }
}

/// changeHandler: function(name, newValue) // newValue will be one of [true, false, undefined], where `undefined` means "default"
function build_token_option_select_input(option, currentValue, changeHandler) {
  if (typeof changeHandler !== 'function') {
    changeHandler = function(){};
  }
  let wrapper = $(`
    <div class="token-image-modal-footer-select-wrapper">
      <div class="token-image-modal-footer-title">${option.label}</div>
    </div>
  `);
  let inputElement = $(`
      <select name="${option.name}">
          <option value="default">Default</option>
          <option value="disabled">${option.disabledValue}</option>
          <option value="enabled">${option.enabledValue}</option>
      </select>
  `);
  wrapper.append(inputElement);

  // explicitly look for true/false because the default value is undefined
  if (currentValue === true) {
    inputElement.val("enabled");
    update_hover_text(wrapper, option.enabledDescription);
  } else if (currentValue === false) {
    inputElement.val("disabled");
    update_hover_text(wrapper, option.disabledDescription);
  } else {
    inputElement.val("default");
    if (window.TOKEN_SETTINGS[option.name] === true) {
      update_hover_text(wrapper, option.enabledDescription);
    } else {
      update_hover_text(wrapper, option.disabledDescription);
    }
  }
  inputElement.change(function (event) {
    console.log("update", event.target.name, "to", event.target.value);
    if (event.target.value === "enabled") {
      changeHandler(option.name, true);
      update_hover_text(wrapper, option.enabledDescription);
    } else if (event.target.value === "disabled") {
      changeHandler(option.name, false);
      update_hover_text(wrapper, option.disabledDescription);
    } else {
      changeHandler(option.name, undefined);
      if (window.TOKEN_SETTINGS[option.name] === true) {
        update_hover_text(wrapper, option.enabledDescription);
      } else {
        update_hover_text(wrapper, option.disabledDescription);
      }
    }
  });

  return wrapper;
}

function build_toggle_input(settingOption, currentValue, changeHandler) {
  if (typeof changeHandler !== 'function') {
    changeHandler = function(){};
  }
  let wrapper = $(`
    <div class="token-image-modal-footer-select-wrapper" data-option-name="${settingOption.name}">
      <div class="token-image-modal-footer-title">${settingOption.label}</div>
    </div>
  `);
  let input = $(`<button name="${settingOption.name}" type="button" role="switch" class="rc-switch"><span class="rc-switch-inner"></span></button>`);
  if (currentValue === null) {
    input.addClass("rc-switch-unknown");
    update_hover_text(wrapper, "This has multiple values. Clicking this will enable it for all.");
  } else {
    const currentlySetOption = settingOption.options.find(o => o.value === currentValue) || settingOption.options.find(o => o.value === settingOption.defaultValue);
    if(currentlySetOption.value == true){
     input.addClass("rc-switch-checked");
    }
    update_hover_text(wrapper, currentlySetOption?.description);
  }
  wrapper.append(input);
  input.click(function(clickEvent) {
    if ($(clickEvent.currentTarget).hasClass("rc-switch-checked")) {
      // it was checked. now it is no longer checked
      $(clickEvent.currentTarget).removeClass("rc-switch-checked");
      changeHandler(settingOption.name, false);
      const disabledOption = settingOption.options.find(o => o.value === false);
      update_hover_text(wrapper, disabledOption?.description);
    } else {
      // it was not checked. now it is checked
      $(clickEvent.currentTarget).removeClass("rc-switch-unknown");
      $(clickEvent.currentTarget).addClass("rc-switch-checked");
      changeHandler(settingOption.name, true);
      const disabledOption = settingOption.options.find(o => o.value === true);
      update_hover_text(wrapper, disabledOption?.description);
    }
  });
  return wrapper;
}

function build_dropdown_input(settingOption, currentValue, changeHandler) {
  if (typeof changeHandler !== 'function') {
    changeHandler = function(){};
  }
  let wrapper = $(`
     <div class="token-image-modal-footer-select-wrapper" data-option-name="${settingOption.name}">
       <div class="token-image-modal-footer-title">${settingOption.label}</div>
     </div>
   `);

  let input = $(`<select name="${settingOption.name}"></select>`);
  wrapper.append(input);
  for (const option of settingOption.options) {
    if(!window.DM && option.dmOnly)
      continue;
    
    input.append(`<option value="${option.value}">${option.label}</option>`);
  }
  if (currentValue !== undefined) {
    input.find(`option[value='${currentValue}']`).attr('selected','selected');
  } else {
    input.find(`option[value='${settingOption.defaultValue}']`).attr('selected','selected');
  }

  const currentlySetOption = settingOption.options.find(o => o.value === currentValue) || settingOption.options.find(o => o.value === settingOption.defaultValue);
  update_hover_text(wrapper, currentlySetOption?.description);
  input.change(function(event) {
    let newValue = event.target.value;
    changeHandler(settingOption.name, newValue);
    const updatedOption = settingOption.options.find(o => o.value === newValue) || settingOption.options.find(o => o.value === settingOption.defaultValue);
    update_hover_text(wrapper, updatedOption?.description);
    update_token_base_visibility(wrapper.parent());
  });
  return wrapper;
}
function build_flyout_input(settingOption, currentValue, changeHandler){
    if (typeof changeHandler !== 'function') {
    changeHandler = function(){};
  }
  let wrapper = $(`
   <div class="token-image-modal-footer-select-wrapper" data-option-name="${settingOption.name}">
     <div class="token-image-modal-footer-title">${settingOption.label}</div>
   </div>
 `);
  let flyoutButton = $(`<button class='sidebar-panel-footer-button avtt-small-settings-edit'>Edit</button>`);
    flyoutButton.on("click", function (clickEvent) {
        build_and_display_sidebar_flyout(clickEvent.clientY, function (flyout) {
          let currentValue = get_avtt_setting_value(settingOption.name);
            let optionsContainer = build_sidebar_token_options_flyout(settingOption.options, currentValue, function(name, value) {
                currentValue[name] = value;
            }, function(){changeHandler(settingOption.name, currentValue)}, false, true);
            flyout.append(optionsContainer);
            position_flyout_left_of($('#settings-panel .sidebar-panel-body'), flyout);
        });
    });
    wrapper.append(flyoutButton)
    return wrapper;
}
function build_custom_button_input(settingOption) {
  if (typeof clickHandler !== 'function') {
    changeHandler = function(){};
  }
  let wrapper = $(`
     <div class="token-image-modal-footer-select-wrapper" data-option-name="${settingOption.name}">
       <div class="token-image-modal-footer-title">${settingOption.label}</div>
     </div>
  `);
  let flyoutButton = $(`<button class='sidebar-panel-footer-button avtt-small-settings-edit'>${settingOption.buttonText}</button>`);
  flyoutButton.on("click", function(e){settingOption.customFunction(e, $('#settings-panel .sidebar-panel-body'))});
  wrapper.append(flyoutButton)
  return wrapper;
}
function build_text_input(settingOption, currentValue, changeHandler) {
  if (typeof changeHandler !== 'function') {
    changeHandler = function(){};
  }
  let wrapper = $(`
     <div class="token-image-modal-footer-select-wrapper" data-option-name="${settingOption.name}">
       <div class="token-image-modal-footer-title">${settingOption.label}</div>
     </div>
  `);
  const input = $(`<input class='flyout-text-input' type="text" name="${settingOption.name}" value="${currentValue != undefined ? currentValue : settingOption.defaultValue}" size="30"/>`);
  input.on('blur',function() { 
    changeHandler(settingOption.name, $(this).val()) 
  });
  wrapper.append(input);
  return wrapper;
}
function build_rangeInput_input(settingOption, currentValue, changeHandler){
  if (typeof changeHandler !== 'function') {
    changeHandler = function(){};
  }
    const min = settingOption.options[0].min;
    const max = settingOption.options[0].max;
    const step = settingOption.options[0].step;


    let wrapper = $(`
       <div class="token-image-modal-footer-select-wrapper" data-option-name="${settingOption.name}">
         <div class="token-image-modal-footer-title">${settingOption.label}</div>
       </div>
    `);
    const range = $(`<input name="${settingOption.name}" class="input-range" type="range" value="${currentValue}" min="${min}" max="${max}" step="${step}"/>`);
    const input = $(`<input name='${settingOption.name}' class='styled-number-input' type='number' min="${min}" max="${max}" step="${step}" value='${currentValue}'/>`)
    
    range.on('input change', function(){
   
      const rangeValue = parseFloat(range.val());
      input.val(rangeValue);
      changeHandler(settingOption.name, rangeValue);
    });


    range.on('mouseup', function(){
      const rangeValue = parseFloat(range.val());
        changeHandler(settingOption.name, rangeValue);
    });

    input.on('input change', function(){
      $("#darkness_layer").toggleClass("smooth-transition", true);
      const inputValue = parseFloat(input.val());
      range.val(inputValue);
      changeHandler(settingOption.name, inputValue);
    });
    wrapper.append(input, range);
    return wrapper;
}
function build_color_select_input(settingOption, currentValue, changeHandler){
  if (typeof changeHandler !== 'function') {
    changeHandler = function(){};
  }
    

    let wrapper = $(`
       <div class="token-image-modal-footer-select-wrapper" data-option-name="${settingOption.name}">
         <div class="token-image-modal-footer-title">${settingOption.label}</div>
       </div>
    `);
    let input = $(`<input class="spectrum" name="${settingOption.name}" value="${currentValue ? currentValue : 'rgba(255, 255, 255, 1)'}" >`);
    wrapper.append(input);
    const colorPickers = wrapper.find(`input[name='${settingOption.name}']`)
    colorPickers.spectrum({
        type: "color",
        showInput: true,
        showInitial: true,
        containerClassName: 'prevent-sidebar-modal-close',
        clickoutFiresChange: true,
        appendTo: "parent"
    });


    colorPickers.spectrum("set", currentValue);
    const colorPickerChange = function(e, tinycolor) {
      changeHandler(settingOption.name, `rgba(${tinycolor._r}, ${tinycolor._g}, ${tinycolor._b}, ${tinycolor._a})`);
    };
    colorPickers.on('dragstop.spectrum', colorPickerChange);   // update the token as the player messes around with colors
    colorPickers.on('change.spectrum', colorPickerChange); // commit the changes when the user clicks the submit button
    colorPickers.on('hide.spectrum', colorPickerChange);   // the hide event includes the original color so let's change it back when we get it

    
    return wrapper;
}

//#endregion UI Construction


/**
 * A ViewModel that represents a some object (or folder) listed in the sidebar such as a token.
 * This is a transient object and is not intended to be used as a data source. Instead, each {type} determines where the data source is.
 * This is not a token that has been placed on a scene; that is an instance of {Token} and is
 * represented as a many {Token} to one {SidebarListItem} relationship.
 * For example:
 *   This could represent a "Goblin" monster. Placing this on the scene several times would create several {Token} instances.
 *   Each of those {Token}s would be of type "monster".
 */
class SidebarListItem {

  /** Do not call this directly! It is a generic constructor for a SidebarListItem. Use one of the static functions instead.
   * @param id {string} a unique identifier for the backing item
   * @param name {string} the name displayed to the user
   * @param image {string} the src of the img tag
   * @param type {string} the type of item this represents. One of [folder, myToken, monster, pc]
   * @param folderPath {string} the folder this item is in
   * @param parentId {string|undefined} a string id of the folder this item is in
   */
  constructor(id, name, image, type, folderPath = RootFolder.Root.path, parentId = "root", color = undefined, monsterData=undefined) {
    this.id = id;
    this.name = name;
    this.image = image;
    this.type = type;
    this.folderPath = sanitize_folder_path(folderPath);
    this.parentId = parentId;
    this.color = color;
    if (typeof monsterData === "object") {
      this.monsterData = {...monsterData};
    }
  }

  static fromJson(obj){
    return new SidebarListItem(obj.id, obj.name, obj.image, obj.type, obj.folderPath, obj.parentId, obj.color, obj.monsterData);
  }

  /**
   * Creates a Folder list item.
   * @param id {string} a unique identifier for the backing item
   * @param folderPath {string} the path that the folder is in (not including the name of this folder)
   * @param name {string} the name of the folder
   * @param collapsed {boolean} whether or not the folder is open or closed.
   * @param parentId {string|undefined} a string id of the folder this item is in
   * @param folderType {string} the ItemType that this folder contains
   * @returns {SidebarListItem} the list item this creates
   */
  static Folder(id, folderPath, name, collapsed, parentId, folderType, color = '#F4B459') {
    if(parentId == undefined && folderPath == RootFolder.Scenes.path){
        parentId = RootFolder.Scenes.id
    }
    let item = new SidebarListItem(id, name, `${window.EXTENSION_PATH}assets/folder.svg`, ItemType.Folder, folderPath, parentId, color);

    if (collapsed === true || collapsed === false) {
      item.collapsed = collapsed;
    } else {
      item.collapsed = true;
    }
    item.folderType = folderType
    return item;
  }

  /**
   * Creates a "My Token" list item.
   * @param tokenCustomization {TokenCustomization} an object that represents the "My Token". The object is an updated version of legacy tokendata objects, and mostly translates to the {Token}.options object
   * @returns {SidebarListItem} the list item this creates
   * @constructor
   */
  static MyToken(tokenCustomization) {
    let image = "";
    if (typeof tokenCustomization.tokenOptions?.alternativeImages === "object" && tokenCustomization.tokenOptions.alternativeImages.length > 0) {
      image = tokenCustomization.tokenOptions.alternativeImages[0];
    }
    return new SidebarListItem(
        tokenCustomization.id,
        tokenCustomization.tokenOptions.name,
        image,
        ItemType.MyToken,
        tokenCustomization.folderPath(),
        tokenCustomization.parentId
    );
  }

  /**
   * Creates a Builtin list item.
   * @param tokenData {object} an object that represents the "Builtin Token". The object is an updated version of legacy tokendata objects, and mostly translates to the {Token}.options object
   * @param parentId {string|undefined} a string id of the folder this item is in
   * @returns {SidebarListItem} the list item this creates
   * @constructor
   */
  static BuiltinToken(tokenData) {
    let folderPath = sanitize_folder_path(`${RootFolder.AboveVTT.path}/${tokenData.folderPath}`);
    let item = new SidebarListItem(path_to_html_id(folderPath, tokenData.name), tokenData.name, tokenData.image, ItemType.BuiltinToken, folderPath, path_to_html_id(folderPath));
    item.tokenOptions = tokenData;
    return item
  }
  static DDBToken(tokenData) {
    let folderPath = sanitize_folder_path(`${RootFolder.DDB.path}/${tokenData.folderPath}`);
    let item = new SidebarListItem(path_to_html_id(folderPath, tokenData.name), tokenData.name, tokenData.alternativeImages[0], ItemType.DDBToken, folderPath, path_to_html_id(folderPath));
    item.tokenOptions = tokenData;
    return item
  }

  /**
   * Creates a Monster list item.
   * @param monsterData {object} the object returned by the DDB API call that searches for monsters
   * @returns {SidebarListItem} the list item this creates
   * @constructor
   */
  static Monster(monsterData) {
    let item = new SidebarListItem(monsterData.id, monsterData.name, monsterData.avatarUrl, ItemType.Monster, RootFolder.Monsters.path, RootFolder.Monsters.id);
    item.monsterData = monsterData;
    return item;
  }
    /**
   * Creates a Monster list item.
   * @param monsterData {object} the object returned by the DDB API call that searches for monsters
   * @returns {SidebarListItem} the list item this creates
   * @constructor
   */
  static open5eMonster(monsterData) {
    if(monsterData.img_main == null || monsterData.img_main == "http://api.open5e.com/"){
      monsterData.img_main = 'https://www.dndbeyond.com/avatars/4675/675/636747837794884984.jpeg'
    }
    let item = new SidebarListItem(monsterData.slug, monsterData.name, monsterData.img_main, ItemType.Open5e, RootFolder.Open5e.path, RootFolder.Open5e.id);
    item.monsterData = monsterData;
    return item;
  }

  /**
   * Creates a PC list item.
   * @param sheet {string} the url path for the character that this represents
   * @param name {string} the name of the character
   * @param image {string} the url for the image of this character
   * @returns {SidebarListItem} the list item this creates
   * @constructor
   */
  static PC(sheet, name, image, folderPath=RootFolder.Players.path, parentId=RootFolder.Players.id) {
    let item = new SidebarListItem(sheet, name, image, ItemType.PC, folderPath, parentId);
    item.sheet = sheet;
    return item;
  }

  /**
   * Creates a Encounter list item. These act like folders but with extra behaviors specific to Encounters
   * @param encounter {object} the Encounter object this item represents. These are stored in window.EncounterHandler.encounters
   * @param collapsed {boolean} whether or not the folder is open or closed. defaults to true
   * @returns {SidebarListItem} the list item this creates
   * @constructor
   */
  static Encounter(encounter, collapsed = true) {
    let name = "Untitled Encounter";
    if ((typeof encounter.name == 'string') && encounter.name.length > 0) {
      name = encounter.name;
    }
    let item = new SidebarListItem(encounter.id, name, `${window.EXTENSION_PATH}assets/folder.svg`, ItemType.Encounter, RootFolder.Encounters.path, RootFolder.Encounters.id);
    if ((typeof encounter.flavorText == 'string') && encounter.flavorText.length > 0) {
      item.description = encounter.flavorText;
    }
    item.collapsed = collapsed;
    item.encounterId = encounter.id;
    return item;
  }

  static Scene(sceneData) {
    let name = "Untitled Scene";
    if ((typeof sceneData.title == 'string') && sceneData.title.length > 0) {
      name = sceneData.title;
    }
    let folderPath = folder_path_of_scene(sceneData);
    let parentId = sceneData.parentId || RootFolder.Scenes.id;
    let item = new SidebarListItem(sceneData.id, name, sceneData.player_map, ItemType.Scene, folderPath, parentId);
    item.isVideo = sceneData.player_map_is_video == "1"; // explicity using `==` instead of `===` in case it's ever `1` or `"1"`
    item.isUvtt = sceneData.UVTTFile == 1;
    item.noteData = sceneData.noteData || undefined;
    return item;
  }

  // size is number of squares, not feet
  static Aoe(shape, size, style, name=undefined) {
    if (typeof name !== "string" || name.length === 0) {
      name = `${shape} AoE`;
    }
    const image = `class=aoe-token-tileable aoe-style-${style} aoe-shape-${shape} ${name ? set_spell_override_style(name) : ""}`
    let item = new SidebarListItem(path_to_html_id(RootFolder.Aoe.path, name), name, image, ItemType.Aoe, RootFolder.Aoe.path, RootFolder.Aoe.id);
    item.shape = shape;
    let parsedSize = parseInt(size);
    if (isNaN(parsedSize)) {
      item.size = parsedSize;
    } else {
      item.size = 1;
    }
    item.style = style;
    return item;
  }

  /**
   * A comparator for sorting by folder, then alphabetically.
   * @param lhs {SidebarListItem}
   * @param rhs {SidebarListItem}
   * @returns {number}
   */
  static sortComparator(lhs, rhs) {
    // always folders before tokens
    if (lhs.isTypeFolder() && !rhs.isTypeFolder()) { return -1; }
    if (!lhs.isTypeFolder() && rhs.isTypeFolder()) { return 1; }
    // alphabetically by name
    if (lhs.name.toLowerCase() < rhs.name.toLowerCase()) { return -1; }
    if (lhs.name.toLowerCase() > rhs.name.toLowerCase()) { return 1; }
    // equal
    return 0;
  }

  /**
   * A comparator for sorting by folder depth, then by folder, then alphabetically.
   * @param lhs {SidebarListItem}
   * @param rhs {SidebarListItem}
   * @returns {number}
   */
  static folderDepthComparator(lhs, rhs) {
    if (lhs.isTypeFolder() && rhs.isTypeFolder()) {
      if (lhs.folderDepth() < rhs.folderDepth()) { return -1; }
      if (lhs.folderDepth() > rhs.folderDepth()) { return 1; }
    }
    return SidebarListItem.sortComparator(lhs, rhs);
  }

  /** @returns {string} path + name */
  fullPath() {
    return sanitize_folder_path(`${this.folderPath}/${this.name}`);
  }

  /** @returns {boolean} whether or not this item represents a Folder */
  isTypeFolder() { return this.type === ItemType.Folder }

  /** @returns {boolean} whether or not this item represents a Folder meant for holding Scenes */
  isTypeSceneFolder() { return this.type === ItemType.Folder && this.folderType === ItemType.Scene }

  /** @returns {boolean} whether or not this item represents a Folder meant for holding Scenes */
  isTypeMyTokenFolder() { return this.type === ItemType.Folder && this.folderType === ItemType.MyToken }

  /** @returns {boolean} whether or not this item represents a "My Token" */
  isTypeMyToken() { return this.type === ItemType.MyToken }

  /** @returns {boolean} whether or not this item represents a Player */
  isTypePC() { return this.type === ItemType.PC }

  /** @returns {boolean} whether or not this item represents a Monster */
  isTypeMonster() { return this.type === ItemType.Monster }

  /** @returns {boolean} whether or not this item represents a Monster */
  isTypeOpen5eMonster() { return this.type === ItemType.Open5e }

  /** @returns {boolean} whether or not this item represents a Builtin Token */
  isTypeBuiltinToken() { return this.type === ItemType.BuiltinToken }

  /** @returns {boolean} whether or not this item represents a Builtin Token */
  isTypeDDBToken() { return this.type === ItemType.DDBToken }

  /** @returns {boolean} whether or not this item represents an Encounter */
  isTypeEncounter() { return this.type === ItemType.Encounter }

  /** @returns {boolean} whether or not this item represents a Scene */
  isTypeScene() { return this.type === ItemType.Scene }

  /** @returns {boolean} whether or not this item represents an AoE */
  isTypeAoe() { return this.type === ItemType.Aoe }

  /** @returns {boolean} whether or not this item is listed in the tokens panel */
  isTokensPanelItem() {
    if (this.isTypeFolder()) {
      if (this.folderPath === RootFolder.Root.path) {
        return this.name === RootFolder.Players.name || this.name === RootFolder.Monsters.name || this.name === RootFolder.MyTokens.name || this.name === RootFolder.AboveVTT.name || this.name === RootFolder.Encounters.name;
      } else {
        return this.folderPath.startsWith(RootFolder.Players.path) || this.folderPath.startsWith(RootFolder.Monsters.path) || this.folderPath.startsWith(RootFolder.MyTokens.path) || this.folderPath.startsWith(RootFolder.AboveVTT.path) || this.folderPath.startsWith(RootFolder.Encounters.path);
      }
    }
    return this.isTypeMyToken() || this.isTypePC() || this.isTypeMonster() || this.isTypeBuiltinToken() || this.isTypeDDBToken()
  }

  /** @returns {boolean} whether or not this item represents an object that can be edited by the user */
  canEdit() {
    switch (this.type) {
      case ItemType.Folder:
        return true;
      case ItemType.MyToken:
      case ItemType.PC:
      case ItemType.Monster:
      case ItemType.Open5e:
      case ItemType.Encounter:
      case ItemType.Scene:
      case ItemType.Aoe:
        return true;
      case ItemType.BuiltinToken:
      default:
        return false;
    }
  }

  /** @returns {boolean} whether or not this item represents an object that can be deleted by the user */
  canDelete() {
    switch (this.type) {
      case ItemType.Folder:
        switch (this.folderType) {
          case ItemType.MyToken:
          case ItemType.Scene:
          case ItemType.PC:
          case ItemType.Encounter:
            if(this.encounterId == undefined)
              return true;
          default:
            return false;
        }
      case ItemType.MyToken:
      case ItemType.Scene:
        return true;
      case ItemType.PC:
      case ItemType.Monster:
      case ItemType.isTypeOpen5eMonster:
      case ItemType.BuiltinToken:
      case ItemType.Encounter:
        if(this.encounterId != undefined)
          return false;
        else
          return true;
      case ItemType.Aoe: // we technically could support this, but I don't think we should
      default:
        return false;
    }
  }

  /** @returns {number} how deeply nested is this object */
  folderDepth() {
    return this.fullPath().split("/").length;
  }
  isRootFolder() {
    // "/foo".split("/").length === 2; if the logic in folderDepth() changes, make sure this changes, too
    return this.folderDepth() === 2;
  }

  /** @returns {string} the name of the folder that contains this item. Returns an empty string if the item is not in any folder */
  containingFolderName() {
    let folderParts = this.folderPath.split("/");
    if (folderParts === undefined || folderParts.length === 0) {
      return "";
    }
    return folderParts[folderParts.length - 1];
  }


  /** @returns {boolean} true if the name partially matches the searchTerm or if the containing folder name partially matches the searchTerm */
  nameOrContainingFolderMatches(searchTerm) {
    if (typeof this.name !== "string") return false;
    let fullPath = this.fullPath().replace(/^(\/Scenes)/i, '')
    return fullPath.match(new RegExp(searchTerm, 'i')) != null;
  }
}

/**
 * @param dirtyPath {string} the path to sanitize
 * @returns {string} the sanitized path
 */
function sanitize_folder_path(dirtyPath) {
  if (dirtyPath === undefined) {
    return RootFolder.Root.path;
  }
  let cleanPath = dirtyPath.replaceAll("///", "/").replaceAll("//", "/");
  // remove trailing slashes before adding one at the beginning. Otherwise, we return an empty string
  if (cleanPath.endsWith("/")) {
    cleanPath = cleanPath.slice(0, -1);
  }
  if (!cleanPath.startsWith("/")) {
    cleanPath = `/${cleanPath}`;
  }
  return cleanPath;
}

const AVTT_TOKEN_ALLOWED_EXTENSIONS = new Set(["jpeg", "jpg", "png", "gif", "bmp", "webp", "mp4", "mov", "avi", "mkv", "wmv", "flv", "webm"]);

function avttTokenSafeDecode(value) {
  if (typeof avttScenesSafeDecode === "function") {
    return avttScenesSafeDecode(value);
  }
  if (typeof value !== "string") {
    return value;
  }
  try {
    return decodeURIComponent(value);
  } catch (error) {
    return value;
  }
}

function avttTokenNormalizeRelativePath(path) {
  if (typeof path !== "string") {
    return "";
  }
  const normalized = path.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!normalized) {
    return "";
  }
  return normalized.endsWith("/") ? normalized : `${normalized}/`;
}

function avttTokenRelativePathFromLink(link) {
  const prefix = `above-bucket-not-a-url/${window.PATREON_ID}/`;
  if (typeof link === "string" && link.startsWith(prefix)) {
    return link.slice(prefix.length);
  }
  return "";
}

async function avttTokenFetchFolderListing(relativePath) {
  const targetPath = typeof relativePath === "string" ? relativePath : "";
  return await avttGetFolderListingCached(targetPath);
}

async function avttTokenCollectAssets(folderRelativePath) {
  const normalizedBase = avttTokenNormalizeRelativePath(folderRelativePath);
  if (!normalizedBase) {
    return { files: [], folders: [] };
  }
  const stack = [normalizedBase];
  const visited = new Set();
  const files = [];
  const folderPaths = new Set();
  folderPaths.add("");

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || visited.has(current)) {
      continue;
    }
    visited.add(current);
    let entries;
    try {
      entries = await avttTokenFetchFolderListing(current);
    } catch (error) {
      console.warn("Failed to load AVTT folder listing", current, error);
      continue;
    }
    if (!Array.isArray(entries)) {
      continue;
    }
    for (const entry of entries) {
      const keyValue = typeof entry === "string" ? entry : entry?.Key || entry?.key || "";
      if (!keyValue) {
        continue;
      }
      let relativeKey = keyValue;
      if (typeof avttExtractRelativeKey === "function") {
        relativeKey = avttExtractRelativeKey(keyValue);
      } else {
        const prefix = `${window.PATREON_ID}/`;
        relativeKey = keyValue.startsWith(prefix) ? keyValue.slice(prefix.length) : keyValue;
      }
      if (!relativeKey || !relativeKey.startsWith(normalizedBase)) {
        continue;
      }
      if (relativeKey.endsWith("/")) {
        if (relativeKey.length > normalizedBase.length) {
          const relativeWithin = relativeKey.slice(normalizedBase.length).replace(/\/+$/, "");
          if (relativeWithin) {
            folderPaths.add(relativeWithin);
          }
        }
        if (!visited.has(relativeKey)) {
          stack.push(relativeKey);
        }
        continue;
      }
      const extension = typeof getFileExtension === "function"
        ? getFileExtension(relativeKey)
        : (relativeKey.split(".").pop() || "").toLowerCase();
      if (!AVTT_TOKEN_ALLOWED_EXTENSIONS.has(String(extension).toLowerCase())) {
        continue;
      }
      files.push({ relativePath: relativeKey });
    }
  }
  return { files, folders: Array.from(folderPaths) };
}

function avttTokenDeriveName(relativePath) {
  const fileName = (relativePath || "").split("/").filter(Boolean).pop() || relativePath || "Token";
  const decoded = avttTokenSafeDecode(fileName);
  return decoded.replace(/\.[^.]+$/, "") || decoded;
}

async function importAvttTokens(links, baseFolderItem) {
  if (!Array.isArray(links) || links.length === 0) {
    $('body>.import-loading-indicator').remove();
    return;
  }
  if (
    !baseFolderItem ||
    typeof baseFolderItem.isTypeFolder !== "function" ||
    !baseFolderItem.isTypeFolder() ||
    baseFolderItem.folderType !== ItemType.MyToken
  ) {
    console.warn("importAvttTokens called with invalid base folder", baseFolderItem);
    $('body>.import-loading-indicator').remove();
    return;
  }
 
  const baseFullPath = sanitize_folder_path(baseFolderItem.fullPath());

  const folderSet = new Set();
  const folderPathRemap = new Map();
  const tokenPlans = [];

  const registerTokenPlan = (folderPath, name, link, extension) => {
    if (!link) {
      return;
    }
    const safeName = avttTokenDeriveName(name);
    let tokenType = "";
    if (typeof extension === "string" && extension.length > 0) {
      tokenType = extension.startsWith(".") ? extension : `.${extension}`;
    }
    tokenPlans.push({
      folderPath: sanitize_folder_path(folderPath),
      name: safeName,
      link,
      type: tokenType,
    });
  };

  const addFolderPath = (fullPath) => {
    const sanitized = sanitize_folder_path(fullPath);
    if (!sanitized || sanitized === baseFullPath) {
      return;
    }
    const relativePart = sanitized.startsWith(`${baseFullPath}/`)
      ? sanitized.slice(baseFullPath.length + 1)
      : sanitized;
    const segments = relativePart.split("/").filter(Boolean);
    let currentPath = baseFullPath;
    for (const segment of segments) {
      currentPath = sanitize_folder_path(`${currentPath}/${segment}`);
      if (currentPath !== baseFullPath) {
        folderSet.add(currentPath);
      }
    }
  };

  const directFiles = [];
  const folderEntries = [];
  for (const link of links) {
    if (!link) {
      continue;
    }
    if (link.isFolder) {
      folderEntries.push(link);
    } else {
      directFiles.push(link);
    }
  }

  for (const link of directFiles) {
    const relativePathRaw = typeof link.path === "string" ? link.path : link.name;
    const normalizedRelative = (relativePathRaw || "").replace(/\\/g, "/");
    const parts = normalizedRelative.split("/").filter(Boolean);
    const fileName = parts.pop() || link.name;
    const extension = (typeof getFileExtension === "function"
      ? getFileExtension(relativePathRaw || fileName)
      : (fileName.split(".").pop() || "")) || link.extension || "";
    registerTokenPlan(baseFullPath, fileName, link.link, extension);
  }

  for (const folderLink of folderEntries) {
    const folderPathRaw = folderLink.path || avttTokenRelativePathFromLink(folderLink.link);
    const normalizedRelative = avttTokenNormalizeRelativePath(folderPathRaw);
    if (!normalizedRelative) {
      continue;
    }
    const rootSegments = normalizedRelative.replace(/\/$/, "").split("/").filter(Boolean);
    const removeBeforeIndex = rootSegments.indexOf(folderLink.name)
    rootSegments.splice(0, removeBeforeIndex)
    if (!rootSegments.length) {
      continue;
    }
    const rootFullPath = sanitize_folder_path(`${baseFullPath}/${rootSegments.join("/")}`);
    addFolderPath(rootFullPath);

    let assets;
    try {
      assets = await avttTokenCollectAssets(normalizedRelative);
    } catch (error) {
      console.warn("Failed to enumerate AVTT token folder", folderLink, error);
      assets = { files: [], folders: [] };
    }

    for (const folderRelative of assets.folders || []) {
      if (!folderRelative) {
        continue;
      }
      const subSegments = folderRelative.split("/").filter(Boolean);
      const fullSegments = [...rootSegments, ...subSegments];
      if (!fullSegments.length) {
        continue;
      }
      const folderFullPath = sanitize_folder_path(`${baseFullPath}/${fullSegments.join("/")}`);
      addFolderPath(folderFullPath);
    }

    for (const asset of assets.files || []) {
      const relativePath = asset.relativePath;
      if (!relativePath) {
        continue;
      }
      const relativeWithinFolder = relativePath.slice(normalizedRelative.length);
      const subSegments = relativeWithinFolder.split("/").filter(Boolean);
      const fileName = avttTokenDeriveName(relativePath);
      const folderSegments = [...rootSegments, ...subSegments.slice(0, -1)];
      const targetFolderPath = folderSegments.length
        ? sanitize_folder_path(`${baseFullPath}/${folderSegments.join("/")}`)
        : baseFullPath;
      addFolderPath(targetFolderPath);
      const linkUrl = `above-bucket-not-a-url/${window.PATREON_ID}/${relativePath}`;
      const extension = typeof getFileExtension === "function" ? getFileExtension(relativePath) : (relativePath.split(".").pop() || "");
      registerTokenPlan(targetFolderPath, fileName, linkUrl, extension);
    }
  }

  const folderCache = new Map();
  folderCache.set(baseFullPath, baseFolderItem);

  const orderedFolders = Array.from(folderSet).sort((a, b) => {
    const depthDiff = a.split("/").length - b.split("/").length;
    if (depthDiff !== 0) {
      return depthDiff;
    }
    return a.localeCompare(b);
  });

  for (const folderPath of orderedFolders) {
    const resolvedFolderPath = folderPathRemap.get(folderPath) || folderPath;
    const segments = resolvedFolderPath.replace(`${baseFullPath}/`, "").split("/").filter(Boolean);
    if (!segments.length) {
      continue;
    }
    const folderName = avttTokenSafeDecode(segments[segments.length - 1]);
    const parentPathOriginal = segments.length > 1
      ? sanitize_folder_path(`${baseFullPath}/${segments.slice(0, -1).join("/")}`)
      : baseFullPath;
    const parentPath = folderPathRemap.get(parentPathOriginal) || parentPathOriginal;
    const parentItem = folderCache.get(parentPath) || find_sidebar_list_item_from_path(parentPath);
    if (!parentItem) {
      console.warn("Unable to locate parent folder for AVTT import", parentPath);
      continue;
    }
    let existingFolderItem = find_sidebar_list_item_from_path(resolvedFolderPath);
    if (!existingFolderItem) {
      const created = create_mytoken_folder_inside(parentItem, { name: folderName, skipModal: true, skipDidChange: true, skipPersist: true });
      const newFolder = SidebarListItem.Folder(created.id, created.folderPath(), created.name(), created.tokenOptions.collapsed, created.parentId, ItemType.Encounter, created.color)
      window.tokenListItems.push(newFolder);
      const expectedPath = sanitize_folder_path(`${parentItem.fullPath()}/${created?.tokenOptions?.name || folderName}`);
      existingFolderItem = find_sidebar_list_item_from_path(expectedPath);
    }
    if (existingFolderItem) {
      const effectivePath = typeof existingFolderItem.fullPath === "function"
        ? existingFolderItem.fullPath()
        : folderPathRemap.get(folderPath) || folderPath;
      folderCache.set(effectivePath, existingFolderItem);
      folderPathRemap.set(folderPath, effectivePath);
    }
  }

  for (const plan of tokenPlans) {
    const resolvedFolderPath = folderPathRemap.get(plan.folderPath) || plan.folderPath;
    const parentItem = folderCache.get(resolvedFolderPath) || find_sidebar_list_item_from_path(resolvedFolderPath);
    if (!parentItem) {
      console.warn("Unable to locate target folder for token import", plan.folderPath);
      continue;
    }
    create_token_inside(parentItem, plan.name, plan.link, plan.type, undefined, undefined, true, true);
  }
  persist_all_token_customizations(window.TOKEN_CUSTOMIZATIONS, function () {
    if (tokenPlans.length > 0) {
      did_change_mytokens_items();
      $('body>.import-loading-indicator').remove();
    }
  })

}
/**
 * @param html {*|jQuery|HTMLElement} the html representation of the item
 * @returns {SidebarListItem|undefined} SidebarListItem.Aoe if found, else undefined
 */
function is_html_aoe(html) {
  let shape = html.attr("data-shape");
  let style = html.attr("data-style");
  let size = html.attr("data-size");
  if (shape && style && size) { // TODO: be more thorough with data validation here
    return SidebarListItem.Aoe(shape, size, style);
  }
  return undefined
}

/**
 * @param html {*|jQuery|HTMLElement} the html representation of the item
 * @returns {SidebarListItem|undefined} SidebarListItem if found, else undefined
 */
function find_sidebar_list_item(html) {
  if (html === undefined) return undefined;

  let foundItem;

  let encounterId = html.attr("data-encounter-id");
  if (encounterId !== undefined && encounterId !== null && encounterId !== "") {
    foundItem = window.tokenListItems.find(item => item.isTypeEncounter() && item.encounterId === encounterId);
    if (foundItem !== undefined) {
      console.log('find_sidebar_list_item', foundItem);
      return foundItem;
    }
  }

  let sceneId = html.attr("data-scene-id");
  if (typeof sceneId === "string" && sceneId.length > 0) {
    foundItem = window.sceneListItems.find(item => item.id === sceneId);
    if (foundItem !== undefined) {
      console.log('find_sidebar_list_item', foundItem);
      return foundItem;
    }
  }

  if (html.attr("data-monster") !== undefined) {
    // explicitly using '==' instead of '===' to allow (33253 == '33253') to return true
    foundItem = window.monsterListItems.find(item => item.monsterData.id == html.attr("data-monster"));
    if (foundItem !== undefined) {
      console.log('find_sidebar_list_item', foundItem);
      return foundItem;
    }
  }

  let htmlId = html.attr("data-id") || html.attr("id") || html.attr("data-token-id");
  if (typeof htmlId === "string" && htmlId.length > 0) {
    foundItem = window.tokenListItems.find(li => li.id === htmlId);
    if (foundItem !== undefined) {
      console.log('find_sidebar_list_item', foundItem);
      return foundItem;
    }
    foundItem = window.sceneListItems.find(li => li.id === htmlId);
    if (foundItem !== undefined) {
      console.log('find_sidebar_list_item', foundItem);
      return foundItem;
    }
    foundItem = window.sceneListFolders.find(li => li.id === htmlId);
    if (foundItem !== undefined) {
      console.log('find_sidebar_list_item', foundItem);
      return foundItem;
    }
    // explicitly using '==' instead of '===' to allow (33253 == '33253') to return true
    foundItem = window.monsterListItems.find(item => item.monsterData.id == html.attr("data-monster"));
    if (foundItem !== undefined) {
      console.log('find_sidebar_list_item', foundItem);
      return foundItem;
    }
    foundItem = window.open5eListItems.find(item => item.id == htmlId);
    if (foundItem !== undefined) {
      console.log('find_sidebar_list_item', foundItem);
      return foundItem;
    }
  }


  let fullPath = harvest_full_path(html);
  return find_sidebar_list_item_from_path(fullPath);
}

/**
 * @param fullPath {string} the full path of the item
 * @returns {SidebarListItem|undefined} SidebarListItem if found, else undefined
 */
function find_sidebar_list_item_from_path(fullPath) {

  const matchingPath = function(item) { return item.fullPath() === fullPath };

  let foundItem;
  if (fullPath.startsWith(RootFolder.Scenes.path)) {
    foundItem = window.sceneListItems?.find(matchingPath);
    console.log('find_sidebar_list_item_from_path sceneListItems', foundItem);
    if (foundItem === undefined) {
      foundItem = window.sceneListFolders?.find(matchingPath);
      console.log('find_sidebar_list_item_from_path sceneListFolders', foundItem);
    }
    if (foundItem !== undefined) {
      console.log('find_sidebar_list_item_from_path', foundItem);
      return foundItem;
    }
  }

  // check all the tokens items
  foundItem = tokens_rootfolders.find(matchingPath);
  if (foundItem === undefined) {
    foundItem = window.tokenListItems?.find(matchingPath);
  }
  if (foundItem === undefined) {
    foundItem = window.monsterListItems?.find(matchingPath);
  }
  if (foundItem === undefined) {
    foundItem = Object.values(cached_monster_items).find(matchingPath);
  }
  if (foundItem === undefined) {
    console.warn(`find_sidebar_list_item found nothing at path: ${fullPath}`);
  }
  console.log('find_sidebar_list_item_from_path', foundItem);
  return foundItem;
}


/**
 * locates the html the given item represents in the list of items
 * @param item {SidebarListItem} the item to find in the list
 * @param container {HTMLElement|undefined} the specific HTML element to search within. Example: {tokensPanel.body}
 * @returns {*|jQuery|HTMLElement} the row that corresponds to the {item} you're looking for
 */
function find_html_row(item, container) {
  if (item === undefined) return undefined;
  if (item.isTypeMonster()) {
    return container?.find(`[data-monster='${item.monsterData.id}']`);
  }
  return find_html_row_from_path(item.fullPath(), container);
}

/**
 *
 * @param fullPath {string} the full path of the item you're looking for
 * @param container {HTMLElement|undefined} the specific HTML element to search within. Example: {tokensPanel.body}
 * @returns {*|jQuery|HTMLElement} the row that corresponds to the {item} you're looking for
 */
function find_html_row_from_path(fullPath, container) {
  if (fullPath === undefined) return undefined;
  return container?.find(`[data-full-path='${encode_full_path(fullPath)}']`);
}

/**
 * decodes and returns the path of the item this HTML element represents
 * @param htmlRow {*|jQuery|HTMLElement} the html that corresponds to an item (like a row in the list of tokens)
 * @returns {string|string|*} the full path of the given element represents
 */
function harvest_full_path(htmlRow) {
  if (htmlRow === undefined) return "";
  return decode_full_path(htmlRow.attr("data-full-path"));
}

/**
 * encodes and sets the full path of an item on an html element
 * @param html {*|jQuery|HTMLElement} the html that corresponds to an item (like a row in the list of tokens)
 * @param fullPath {string} the full path of an item that the html corresponds to
 */
function set_full_path(html, fullPath) {
  if (html === undefined) return;
  return html.attr("data-full-path", encode_full_path(fullPath)).addClass("list-item-identifier");
}

/**
 * sets the id of an item on an html element
 * @param html {*|jQuery|HTMLElement} the html that corresponds to an item (like a row in the list of tokens)
 * @param listItem {SidebarListItem} the item to set the id with
 */
function set_list_item_identifier(html, listItem) {
  if (html === undefined || listItem === undefined) return;
  if (listItem.isTypeScene() || listItem.isTypeSceneFolder()) {
    html.attr("data-scene-id", listItem.id).addClass("list-item-identifier");
  } else if (listItem.isTypeEncounter()) {
    html.attr("data-encounter-id", listItem.id).addClass("list-item-identifier");
  } else if (listItem.isTypeMonster()) {
    html.attr("data-monster", listItem.id).addClass("list-item-identifier");
  }
  html.attr("data-id", listItem.id).addClass("list-item-identifier");
  html.attr("data-full-path", encode_full_path(listItem.fullPath())).addClass("list-item-identifier");
}

function path_to_html_id(path, name) {
  if (name === undefined) {
    return path.replace(/\W/g,'_');
  } else {
    return sanitize_folder_path(`${path}/${name}`).replace(/\W/g,'_');
  }
}

/**
 * encodes the path of an item so it can be safely stored on an html object
 * @param fullPath {string} the path to encode
 * @returns {string} the encoded path
 */
function encode_full_path(fullPath) {
  try {
    if (fullPath === undefined) return "";
    if (fullPath.startsWith("base64")) {
      // already encoded. just return it
      return fullPath;
    }
    return `base64${b64EncodeUnicode(fullPath)}`;
  } catch (e) {
    console.error("encode_full_path failed", fullPath, e);
    return "";
  }
}

/**
 * decodes the path of an item that was stored on an html object
 * @param fullPath {string} the encoded path to decode
 * @returns {string} the decoded path
 */
function decode_full_path(fullPath) {
  try {
    if (fullPath === undefined) return "";
    if (fullPath.startsWith("base64")) {
      return b64DecodeUnicode(fullPath.replace("base64", ""));
    }
    // no need to decode
    return fullPath;
  } catch (e) {
    console.error("decode_full_path failed", fullPath, e);
    return ""; // not sure what to do here
  }
}

/**
 * determines if the encoded path on the html matches the unencoded path provided
 * @param html {*|jQuery|HTMLElement} the html that corresponds to an item (like a row in the list of tokens)
 * @param fullPath {string} the path of the item you are looking for
 * @returns {boolean} whether or not the path matches the encded path on the html
 */
function matches_full_path(html, fullPath) {
  if (html === undefined || fullPath === undefined) return false;
  return html.attr("data-full-path") === encode_full_path(fullPath);
}

function avttSidebarGetThumbnailPrefix() {
  if (typeof avttGetThumbnailPrefix === "function") {
    return avttGetThumbnailPrefix();
  }
  const rawId =
    typeof window !== "undefined" && window && typeof window.PATREON_ID === "string" && window.PATREON_ID
      ? window.PATREON_ID
      : "anonymous";
  const sanitizedId = String(rawId).replace(/[\\/]/g, "_");
  return `thumbnails_${sanitizedId}/`;
}

function avttSidebarApplyThumbnailPrefix(path) {
  if (typeof avttApplyThumbnailPrefixToAboveBucket === "function") {
    return avttApplyThumbnailPrefixToAboveBucket(path);
  }
  if (typeof path !== "string") {
    return path;
  }
  const rewritten = path.replace(/^(above-bucket-not-a-url\/([^/]+)\/)(.*)$/i, (match, bucketPrefix, userSegment, rest) => {
    const sanitizedUser = String(userSegment || "anonymous").replace(/[\\\/]/g, "_") || "anonymous";
    const thumbnailFolder = `thumbnails_${sanitizedUser}`;
    const remaining = rest
      .replace(/^thumbnails_[^/]*\//i, "")
      .replace(/^thumbnails\//i, "")
      .replace(/^\/+/, "");
    const base = `${bucketPrefix}${thumbnailFolder}`;
    return remaining ? `${base}/${remaining}` : `${base}/`;
  });
  if (rewritten !== path) {
    return rewritten;
  }
  const thumbnailPrefix = avttSidebarGetThumbnailPrefix();
  return path.replace(/^(above-bucket-not-a-url\/.*?\/)(.*)$/i, (match, bucketPrefix, rest) => {
    const remaining = rest
      .replace(/^thumbnails_[^/]*\//i, "")
      .replace(/^thumbnails\//i, "")
      .replace(/^\/+/, "");
    const base = `${bucketPrefix}${thumbnailPrefix}`.replace(/\/+$/, "");
    return remaining ? `${base}/${remaining}` : `${base}/`;
  });
}

/**
 * @param listItem {SidebarListItem} the list item that this row will represent
 * @returns {*|jQuery|HTMLElement} that represents a row in the list of items in the sidebar
 */
function build_sidebar_list_row(listItem) {

  let row = $(`<div id="${listItem.id}" class="sidebar-list-item-row" title="${listItem.name}"></div>`);
  set_list_item_identifier(row, listItem);
  
  if (window.hiddenFolderItems.indexOf(listItem.id) > -1) {
    row.toggleClass('hidden-sidebar-item', true);
  }
  let rowItem = $(`<div class="sidebar-list-item-row-item"></div>`);
  row.append(rowItem);
  rowItem.on("click", did_click_row);

  let imgHolder = $(`<div class="sidebar-list-item-row-img"></div>`);
  rowItem.append(imgHolder);
  if (listItem.type !== "aoe" && !listItem.isTypeScene()){
    let tokenCustomizations = find_token_customization(listItem.type, listItem.id);
    let listingImage = (tokenCustomizations?.tokenOptions?.alternativeImages && tokenCustomizations.tokenOptions?.alternativeImages?.[0] != undefined) ? tokenCustomizations.tokenOptions.alternativeImages[0] : listItem.image; 
    let img;
    let video = false;
    let isAvttBucketFile = listingImage?.startsWith('above-bucket-not-a-url');
    if (isAvttBucketFile) {
      listingImage = avttSidebarApplyThumbnailPrefix(listingImage);
    }
    if(listingImage?.includes != undefined && listingImage.includes('folder.svg')){
    img = $(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Layer_1" x="0px" y="0px" viewBox="0 0 309.267 309.267" style="enable-background:new 0 0 309.267 309.267;" xml:space="preserve">
        <g>
          <path style="fill:${tokenCustomizations?.color ? `${tokenCustomizations?.color}` : listItem.color ? listItem.color : '#D0994B'};" d="M260.944,43.491H125.64c0,0-18.324-28.994-28.994-28.994H48.323c-10.67,0-19.329,8.65-19.329,19.329   v222.286c0,10.67,8.659,19.329,19.329,19.329h212.621c10.67,0,19.329-8.659,19.329-19.329V62.82   C280.273,52.15,271.614,43.491,260.944,43.491z"/>
          <path style="fill:#E4E7E7;" d="M28.994,72.484h251.279v77.317H28.994V72.484z"/>
          <path style="fill:${tokenCustomizations?.color ? tokenCustomizations?.color : listItem.color ? listItem.color : '#F4B459'};" d="M19.329,91.814h270.609c10.67,0,19.329,8.65,19.329,19.329l-19.329,164.298   c0,10.67-8.659,19.329-19.329,19.329H38.658c-10.67,0-19.329-8.659-19.329-19.329L0,111.143C0,100.463,8.659,91.814,19.329,91.814z   "/>
        </g>
    </svg>`)
    }
    else if (!isAvttBucketFile && (tokenCustomizations?.tokenOptions?.videoToken == true || ['.mp4', '.webm','.mkv'].some(d => listingImage?.includes(d)))){
        img = $(`<video disableRemotePlayback muted src="" loading="lazy" alt="${listItem.name} image" class="token-image video-listing" />`);   
        video = true;
    } else{
        img = $(`<img src="" loading="lazy" alt="${listItem.name} image" class="token-image" />`);
    }
    updateImgSrc(listingImage, img, video, false);
    imgHolder.append(img);
  }
  else{
    // possibly change the background-image-size so it looks nicer as a small image
    let img = $(`<div data-img="true" class="aoe-token-tileable aoe-style-${listItem.style} aoe-shape-${listItem.shape}"></div>`);
    imgHolder.append(img);
  }

  let details = $(`<div class="sidebar-list-item-row-details"></div>`);
  rowItem.append(details);
  let title = $(`<div class="sidebar-list-item-row-details-title">${listItem.name}</div>`);
  details.append(title);
  let subtitle = $(`<div class="sidebar-list-item-row-details-subtitle"></div>`);
  details.append(subtitle);

  const isCustomEncounterFolder = !listItem.isRootFolder() && listItem.folderType == ItemType.Encounter;

  if ((!listItem.isTypeFolder() && !listItem.isTypeScene()) || isCustomEncounterFolder) {
    if(isCustomEncounterFolder){
      let editEncounter = $(`<button class="token-row-button token-row-edit-encounter" title="Edit Encounter">
         <span class="material-symbols-outlined">
           person_edit
         </span>
       </button>`)
      rowItem.append(editEncounter);
      editEncounter.on("click", edit_encounter);
    }
    let addButton = $(`
        <button class="token-row-button token-row-add" title="Add Token to Scene">
            <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M7.2 10.8V18h3.6v-7.2H18V7.2h-7.2V0H7.2v7.2H0v3.6h7.2z"></path></svg>
        </button>
    `);
    rowItem.append(addButton);
    addButton.on("click", did_click_add_button);
  }

  switch (listItem.type) {
    case ItemType.Encounter: // explicitly allowing encounter to fall through because we want them to be treated like folders
    case ItemType.Folder:
      subtitle.hide();
      row.append(`<div class="folder-item-list"></div>`);
      row.addClass("folder");
      if (listItem.collapsed === true) {
        row.addClass("collapsed");
      }
      if(listItem.id == RootFolder.Players.id){


        let popoutButton = $(`<div class="players-popout-button"><svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 0 24 24" width="18px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M18 19H6c-.55 0-1-.45-1-1V6c0-.55.45-1 1-1h5c.55 0 1-.45 1-1s-.45-1-1-1H5c-1.11 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-6c0-.55-.45-1-1-1s-1 .45-1 1v5c0 .55-.45 1-1 1zM14 4c0 .55.45 1 1 1h2.59l-9.13 9.13c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L19 6.41V9c0 .55.45 1 1 1s1-.45 1-1V4c0-.55-.45-1-1-1h-5c-.55 0-1 .45-1 1z"/></svg></div>`);
        row.append(popoutButton);
        popoutButton.off('click.popout').on('click.popout', function(){      
          popoutWindow('Players', row, '325px');
          let playersWindow = $(childWindows['Players'].document)
          playersWindow.find('#playersFolder > .sidebar-list-item-row-item, .players-popout-button').remove();
          playersWindow.find('body').append($(`
            <style id='playersPopoutCSS'>
              .folder-item-list > .sidebar-list-item-row {
                max-width:310px;
                min-width:285px;
                display: inline-block;
                margin-right:5px;
                cursor: pointer;
                flex-shrink: 0;
              }
              #playersFolder{
                border: none;
                padding-right:8px;
              }
              #playersFolder > .folder-item-list{
                  display: flex;
                  width: 100%;
                  flex-wrap: wrap;
              }
              .ability_score,
              .ability_name{
                margin-top: 3px;
              }
            </style>`))

          playersWindow.find('.ui-draggable').draggable('disable')
          redraw_token_list($('[name="token-search"]').val());
        });

        if (listItem.isRootFolder()) {
          
          let addFolder = $(`<button class="token-row-button" title="Create New Folder"><span class="material-icons">create_new_folder</span></button>`);
          rowItem.append(addFolder);
          addFolder.on("click", function (clickEvent) {
            clickEvent.stopPropagation();
            let clickedRow = $(clickEvent.target).closest(".list-item-identifier");
            let clickedItem = find_sidebar_list_item(clickedRow);
            create_folder_inside(clickedItem);
          });
        
        
          let reorderButton = $(`<button class="token-row-button reorder-button" title="Reorder Tokens"><span class="material-icons">reorder</span></button>`);
          rowItem.append(reorderButton);
          reorderButton.on("click", function (clickEvent) {
            clickEvent.stopPropagation();
            if ($(clickEvent.currentTarget).hasClass("active")) {
              disable_draggable_change_folder();
            } else {
              enable_draggable_change_folder(ItemType.PC);
            }
          });               
        }      
      }
     
      
      if (listItem.isRootFolder() && listItem.id == RootFolder.Encounters.id) {
        let addFolder = $(`<button class="token-row-button" title="Create New Folder"><span class="material-icons">create_new_folder</span></button>`);
        rowItem.append(addFolder);
        addFolder.on("click", function (clickEvent) {
          clickEvent.stopPropagation();
          let clickedRow = $(clickEvent.target).closest(".list-item-identifier");
          let clickedItem = find_sidebar_list_item(clickedRow);
          create_folder_inside(clickedItem);
        });     
      }
      
      if(listItem.folderType === ItemType.PC && listItem.id !== RootFolder.Players.id){
        let popoutButton = $(`<div class="players-popout-button subfolder-popout"><svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 0 24 24" width="18px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M18 19H6c-.55 0-1-.45-1-1V6c0-.55.45-1 1-1h5c.55 0 1-.45 1-1s-.45-1-1-1H5c-1.11 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-6c0-.55-.45-1-1-1s-1 .45-1 1v5c0 .55-.45 1-1 1zM14 4c0 .55.45 1 1 1h2.59l-9.13 9.13c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L19 6.41V9c0 .55.45 1 1 1s1-.45 1-1V4c0-.55-.45-1-1-1h-5c-.55 0-1 .45-1 1z"/></svg></div>`);
        row.append(popoutButton);
        popoutButton.off('click.popout').on('click.popout', function(){      
          popoutWindow('Players', row.find(`>.folder-item-list`), '325px');
          let playersWindow = $(childWindows['Players'].document)
          playersWindow.find(`body>.folder-item-list`).wrap(`<div id='playersFolder' class='sidebar-list-item-row list-item-identifier folder'></div>`);
          playersWindow.find('#playersFolder > .sidebar-list-item-row-item, .players-popout-button').remove();


          playersWindow.find('body').append($(`
            <style id='playersPopoutCSS'>
              .folder-item-list > .sidebar-list-item-row {
                max-width:310px;
                min-width:285px;
                display: inline-block;
                margin-right:5px;
                cursor: pointer;
                flex-shrink: 0;
              }
              #playersFolder{
                border: none;
                padding-right:8px;
              }
              #playersFolder > .folder-item-list{
                  display: flex;
                  width: 100%;
                  flex-wrap: wrap;
              }
              .ability_score,
              .ability_name{
                margin-top: 3px;
              }
            </style>`))

          playersWindow.find('.ui-draggable').draggable('disable')
          redraw_token_list($('[name="token-search"]').val());
        });
      }
      if (listItem.folderType === ItemType.MyToken) {
        // add buttons for creating subfolders and tokens
        let addFolder = $(`<button class="token-row-button" title="Create New Folder"><span class="material-icons">create_new_folder</span></button>`);
        rowItem.append(addFolder);
        addFolder.on("click", function (clickEvent) {
          clickEvent.stopPropagation();
          let clickedRow = $(clickEvent.target).closest(".list-item-identifier");
          let clickedItem = find_sidebar_list_item(clickedRow);
          create_folder_inside(clickedItem);
        });
        //import dropbox
        const dropboxOptions = dropBoxOptions(function(links){
            for(let i = 0; i<links.length; i++){
              create_token_inside(listItem, links[i].name, links[i].link, undefined, undefined, undefined, true);
            }   
            did_change_mytokens_items();       
        }, true);
        const dropboxButton = createCustomDropboxChooser('', dropboxOptions);

        dropboxButton.toggleClass('token-row-button', true);     
        dropboxButton.attr('title', 'Create token from Dropbox'); 

        const oneDriveButton = createCustomOnedriveChooser('', function(links){
            for(let i = 0; i<links.length; i++){
              create_token_inside(listItem, links[i].name, links[i].link, links[i].type, undefined, undefined, undefined, true);
            }   
            did_change_mytokens_items();       
        }, 'multiple', ['photo', '.webp'])
        oneDriveButton.toggleClass('token-row-button one-drive-button', true);
        oneDriveButton.attr('title', 'Create token from Onedrive'); 
        
        const avttButton = createCustomAvttChooser('', function (links) { 
          build_import_loading_indicator("Importing Tokens...");
          setTimeout(function(){importAvttTokens(links, listItem)}, 30);
        }, [avttFilePickerTypes.VIDEO, avttFilePickerTypes.IMAGE, avttFilePickerTypes.FOLDER]);
        avttButton.toggleClass('token-row-button avtt-file-button', true);
        avttButton.attr('title', "Create token from Azmoria's AVTT File Picker"); 

        let addTokenMenu = $(`<div class='addTokenMenu'></div>`)

        
       
        let addToken = $(`<button class="token-row-button hover-add-button" title="Create New Token"><span class="material-icons">person_add_alt_1</span></button>`);

        addTokenMenu.append(addToken, dropboxButton, avttButton, oneDriveButton);


       
        rowItem.append(addTokenMenu);
        addToken.on("click", function (clickEvent) {
          clickEvent.stopPropagation();
          let clickedRow = $(clickEvent.target).closest(".list-item-identifier");
          let clickedItem = find_sidebar_list_item(clickedRow);
          create_token_inside(clickedItem);
        });
        if (listItem.isRootFolder()) {
          let reorderButton = $(`<button class="token-row-button reorder-button" title="Reorder Tokens"><span class="material-icons">reorder</span></button>`);
          rowItem.append(reorderButton);
          reorderButton.on("click", function (clickEvent) {
            clickEvent.stopPropagation();
            if ($(clickEvent.currentTarget).hasClass("active")) {
              disable_draggable_change_folder();
            } else {
              enable_draggable_change_folder(ItemType.MyToken);
            }
          });
        }
      } else if (listItem.folderType === ItemType.Scene) {
        // add buttons for creating subfolders and scenes
        let addFolder = $(`<button class="token-row-button" title="Create New Folder"><span class="material-icons">create_new_folder</span></button>`);
        rowItem.append(addFolder);
        addFolder.on("click", function (clickEvent) {
          clickEvent.stopPropagation();
          let clickedRow = $(clickEvent.target).closest(".list-item-identifier");
          let clickedItem = find_sidebar_list_item(clickedRow);
          create_folder_inside(clickedItem);
        });
        let addScene = $(`<button class="token-row-button" title="Create New Scene"><span class="material-icons">add_photo_alternate</span></button>`);
        rowItem.append(addScene);
        addScene.on("click", function (clickEvent) {
          clickEvent.stopPropagation();
          let clickedRow = $(clickEvent.target).closest(".list-item-identifier");
          let clickedItem = find_sidebar_list_item(clickedRow);
          create_scene_root_container(clickedItem.fullPath(), listItem.id);
        });
      } else if (listItem.folderType === ItemType.Monster) {
        // add monster filter button on the root monsters folder
        let filterMonsters = $(`<button class="token-row-button monster-filter-button" title="Filter Monsters"><span class="material-icons">filter_alt</span></button>`);
        if (Object.keys(monster_search_filters).length > 0) {
          filterMonsters.css("color", "#1b9af0");
        } else {
          filterMonsters.css("color", "#838383");
        }
        rowItem.append(filterMonsters);
        filterMonsters.on("click", function(clickEvent) {
          clickEvent.stopPropagation();
          display_monster_filter_modal();
        });
      } else if (listItem.isTypeEncounter()) {
        // we explicitly allowed encounter types to fall through as folders. now we want to do encounter customizations here
        row.addClass("encounter").removeClass("folder");
        row.attr("data-encounter-id", listItem.encounterId);
        if (listItem.description !== undefined) {
          subtitle.show();
          subtitle.text(listItem.description);
        }
      }
      break;
    case ItemType.MyToken:
      subtitle.hide();
      // TODO: Style specifically for My Tokens
      row.css("cursor", "default");
      break;
    case ItemType.PC:
      const pc = find_pc_by_player_id(listItem.sheet, false);
      if (pc === undefined) {
        subtitle.text("loading character details");
        break;
      }
      const color = color_from_pc_object(pc);
      const hpValue = hp_from_pc_object(pc);
      const maxHp = max_hp_from_pc_object(pc);
      const walkingSpeed = speed_from_pc_object(pc);
      const climbingSpeed = speed_from_pc_object(pc, "Climbing");
      const flySpeed = speed_from_pc_object(pc, "Flying");
      const swimSpeed = speed_from_pc_object(pc, "Swimming");
      row.append(`<div class="subtitle-attibute hp-attribute" title="HP"><span class="subtitle-title">Hit Points</span><span class='hp-containter'><span class="hp-value">${hpValue}</span><span> / </span><span class='max-hp-value'>${maxHp}</span></span></div>`);
      row.append(`<div class="subtitle-attibute exhaustion-attribute" title="HP"><span class="subtitle-title">Exhaustion</span><div class="ddbc-number-bar"><span class='first exhaustion-pip'></span><span class='exhaustion-pip'></span><span class='exhaustion-pip'></span><span class='exhaustion-pip'></span><span class='exhaustion-pip'></span><span class='last exhaustion-pip'></span></div></div>`);
      row.append(`<div style='display: none;' class="hp-attribute death-saves ct-health-summary__data ct-health-summary__deathsaves"><div class="ct-health-summary__deathsaves-content"><div class="ct-health-summary__deathsaves-group ct-health-summary__deathsaves--fail"><span class="ct-health-summary__deathsaves-label ">Failure</span><span class="ct-health-summary__deathsaves-marks"><span class="ct-health-summary__deathsaves-mark ct-health-summary__deathsaves-mark--inactive"></span><span class="ct-health-summary__deathsaves-mark ct-health-summary__deathsaves-mark--inactive"></span><span class="ct-health-summary__deathsaves-mark ct-health-summary__deathsaves-mark--inactive"></span></span></div><div class="ct-health-summary__deathsaves-group ct-health-summary__deathsaves--success"><span class="ct-health-summary__deathsaves-label ">Success</span><span class="ct-health-summary__deathsaves-marks"><span class="ct-health-summary__deathsaves-mark ct-health-summary__deathsaves-mark--inactive"></span><span class="ct-health-summary__deathsaves-mark ct-health-summary__deathsaves-mark--inactive"></span><span class="ct-health-summary__deathsaves-mark ct-health-summary__deathsaves-mark--inactive"></span></span></div></div></div>`);


      let playerInfo = $(`<div class='player-card-info'></div>`);
      playerInfo.append(`<div class="subtitle-attibute" title="Passive Perception"><span class="subtitle-title">Passive Perception</span><span class="pp-value">${pc.passivePerception}</span></div>`);
      playerInfo.append(`<div class="subtitle-attibute" title="Passive Investigation"><span class="subtitle-title">Passive Investigation</span><span class="pinv-value">${pc.passiveInvestigation}</span></div>`);
      playerInfo.append(`<div class="subtitle-attibute" title="Passive Insight"><span class="subtitle-title">Passive Insight</span><span class="pins-value">${pc.passiveInsight}</span></div>`);
      playerInfo.append(`<div class="subtitle-attibute" title="Armor Class"><span class="subtitle-title">Armor Class</span><span class="ac-value">${pc.armorClass}</span></div>`);
      row.append(playerInfo);

      row.addClass("player-row");
      let abilities = $(`<div class="player-card-footer">`);
      abilities.append(pc.abilities.map(a => `
         <div class="ability_value" data-ability="${a.name}">
              <div class="ddbc-box-background "><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 81 95" class="ddbc-svg ddbc-ability-score-box-svg "><path d="M4.52,13.62A34.66,34.66,0,0,1,3.08,6.26l0-.42.63-.2C5.22,5.18,9.41,3.35,9.41,1V0H71.59V1c0,2.37,4.19,4.2,5.66,4.66l.63.2,0,.42a35.34,35.34,0,0,1-1.44,7.36L76,7.3C74.42,6.71,70.47,5,69.74,2H11.26C10.52,5,6.58,6.71,5,7.3ZM2.32,79.46H2.6c.08-1.12.16-2.38.24-3.76A13,13,0,0,1,.63,69.83,9.4,9.4,0,0,1,3.21,62.6V61.43S1.83,35.67.56,31.56L.4,31l.47-.29a12.31,12.31,0,0,0,2.2-1.87,6.23,6.23,0,0,0,1.55-2.24A5.08,5.08,0,0,0,5,23.27c0-.11-.58-1.35-1.12-3l-.26,2.85c.27.79.5,1.63.71,2.49a5.17,5.17,0,0,1-1.56,2A33.13,33.13,0,0,0,1.74,23.6l-.07-.2L2.91,9.63c0,2,1.38,6.53,1.38,6.53a36.23,36.23,0,0,0,2.1,6.67A7.13,7.13,0,0,1,5,28.71C6.68,38,5.08,71,4.87,74.89A15.6,15.6,0,0,1,3,71.41c.08-2,.13-4.16.16-6.41a7.57,7.57,0,0,0-1.15,4.71,12,12,0,0,0,2.1,5.41l.15.22.45.64.06.07h0a29.64,29.64,0,0,0,5.74,5.66A39.48,39.48,0,0,1,14,83.83h0l.26.18c.79.54,1.55,1.09,2.29,1.65l.18.13h0c1.42,1.09,2.71,2.17,3.78,3.11,1.39,0,2.75.11,4,.22a16.4,16.4,0,0,1-3.19-3.33H17.91l-2.49-2h2.32a16.19,16.19,0,0,1-.88-4.16,4.31,4.31,0,0,1-5.21,1.79c.59.18,3,.53,5.24-4.08v0a8.24,8.24,0,0,1,2.52-5.32,13.54,13.54,0,0,0-1,10.29A1.76,1.76,0,0,0,19.8,83,11.36,11.36,0,0,1,19,78.77c0-8.55,9.66-15.51,21.54-15.51S62,70.22,62,78.77A11.36,11.36,0,0,1,61.2,83a1.76,1.76,0,0,0,1.34-.64,13.54,13.54,0,0,0-1-10.29A8.24,8.24,0,0,1,64.1,77.4v0c2.2,4.61,4.64,4.26,5.24,4.08a4.31,4.31,0,0,1-5.21-1.79,16.19,16.19,0,0,1-.88,4.16h2.32l-2.49,2H59.68a16.4,16.4,0,0,1-3.19,3.33c1.2-.11,2.57-.21,4-.22,1.07-.94,2.36-2,3.78-3.11h0l.18-.13c.74-.56,1.5-1.11,2.29-1.65l.26-.18h0a39.48,39.48,0,0,1,3.49-2.11,29.64,29.64,0,0,0,5.74-5.66h0l.06-.07.45-.64.15-.22A12,12,0,0,0,79,69.71,7.64,7.64,0,0,0,77.8,65c0,2.25.08,4.41.16,6.41a15.6,15.6,0,0,1-1.83,3.48C75.92,71,74.32,38,76,28.71a7.1,7.1,0,0,1-1.34-5.88,38.28,38.28,0,0,0,2.09-6.67s1.4-4.48,1.38-6.53L79.33,23.4l-.07.2a33.13,33.13,0,0,0-1.07,4.08,5.39,5.39,0,0,1-1.57-2c.22-.86.45-1.7.71-2.49l-.25-2.85c-.54,1.61-1.07,2.85-1.12,3a5.08,5.08,0,0,0,.42,3.36,6.23,6.23,0,0,0,1.55,2.24,12.31,12.31,0,0,0,2.2,1.87l.48.29-.17.53c-1.26,4.11-2.64,29.87-2.64,29.87,0,.39,0,.79,0,1.17a9.4,9.4,0,0,1,2.58,7.23,13.37,13.37,0,0,1-2.2,5.89c.07,1.38.15,2.64.23,3.76h.28c1.49-.12,2.79.71,2.16,1.75a2.46,2.46,0,0,1-1.72,1.15,2.58,2.58,0,0,0,.75-.85c.17-.3,0-.44-.14-.51l-.38,0h0a7.86,7.86,0,0,0-.84,0c.18,2.31.32,3.71.33,3.79L79,85.79H66.64c-1.46,1-2.84,2.15-4,3.15a11.85,11.85,0,0,1,7,2.12l-2.75,1.09h0a30,30,0,0,1-5.35,1.74h0l-.33,0L61,94c-9.66,1.67-10.67.75-10.67.75A10.09,10.09,0,0,0,57.11,92l.23-.24c.1-.1.62-.62,1.46-1.4-.62,0-1.22.07-1.81.12h0l-.44,0a8.82,8.82,0,0,0-1.18.23,7.12,7.12,0,0,0-.87.27l-.14,0a6.24,6.24,0,0,0-1,.44l-.11.07a5.63,5.63,0,0,0-.77.54l-.22.19a4.82,4.82,0,0,0-.75.86l-7.89.9.06,0a26.18,26.18,0,0,1-6.46,0l.06,0-7.89-.9a4.5,4.5,0,0,0-.76-.86l-.22-.2a7,7,0,0,0-.79-.55l-.09-.06a8.88,8.88,0,0,0-.95-.44L26.45,91c-.3-.11-.59-.2-.86-.27-.46-.11-.86-.17-1.14-.21l-.44,0h0c-.59,0-1.19-.09-1.81-.12.84.78,1.36,1.3,1.45,1.4l.24.24a10.09,10.09,0,0,0,6.78,2.71s-1,.92-10.67-.75l-.24,0-.33,0h0a29.76,29.76,0,0,1-5.35-1.74h0l-2.75-1.09a11.85,11.85,0,0,1,7-2.12c-1.2-1-2.58-2.1-4-3.15H2l.12-1.08c0-.08.15-1.48.33-3.79a7.86,7.86,0,0,0-.84,0h0l-.38,0c-.17.07-.31.21-.14.51a2.5,2.5,0,0,0,.74.85A2.47,2.47,0,0,1,.16,81.21c-.63-1,.67-1.87,2.16-1.75ZM76.78,49.11c.53-5.66,1.25-14.21,2.15-17.46a15.6,15.6,0,0,1-1.28-1,144.6,144.6,0,0,0-.87,18.5ZM74.63,80a11.89,11.89,0,0,1,1.8-.35c0-.46-.07-1-.1-1.48-.57.67-1.15,1.28-1.7,1.83Zm-5,3.82h7.17c-.06-.66-.15-1.61-.24-2.76a18.56,18.56,0,0,0-6.93,2.76ZM58.69,92.48l.07,0c1.06.59,4.54-.45,7.31-1.59a17.09,17.09,0,0,0-5.08-.6c-1.07,1-1.88,1.72-2.3,2.14ZM40.5,92.14c7,0,13-2.55,16.48-6.35.27-.3.53-.62.78-.94a.61.61,0,0,1,.07-.1,9.16,9.16,0,0,0,.61-.92,9.74,9.74,0,0,0,1.46-5.06c0-7.37-8.7-13.37-19.4-13.37s-19.4,6-19.4,13.37a9.83,9.83,0,0,0,1.45,5.06c.19.32.4.62.62.92l.08.1c.24.32.5.64.77.94,3.43,3.8,9.52,6.35,16.48,6.35ZM20,90.34a17.09,17.09,0,0,0-5.08.6c2.78,1.14,6.25,2.18,7.31,1.59l.07,0c-.42-.42-1.22-1.18-2.3-2.14ZM4.57,79.66a12.14,12.14,0,0,1,1.8.35c-.55-.55-1.13-1.16-1.7-1.83,0,.52-.07,1-.1,1.48Zm-.35,4.17h7.17a18.62,18.62,0,0,0-6.93-2.76c-.09,1.15-.18,2.1-.24,2.76Zm0-34.72a144.6,144.6,0,0,0-.87-18.5,15.6,15.6,0,0,1-1.28,1C3,34.9,3.68,43.45,4.22,49.11Z"></path></svg></div>
              <div class="ability_name">${a.name.toUpperCase()}</div>
              <div class="ability_modifier">${a.modifier}</div>
              <div class="ability_score">${a.score}</div>
          </div>
      `).join(''));
      row.append(abilities);
      let moreInfo = $(`<div class='moreInfo' style='font-size:12px;'>
         ${pc.castingInfo.saveDcs.length>0 ? `<div style='margin-top:5px'><strong style='margin-left:5px;'>Spell Save DCs</strong>${pc.castingInfo.saveDcs.map(a => `<div style='margin-left:15px'>${a.sources[0]}: ${a.value}</div>`).join('')}` : ``}
         ${pc.resistances.length>0 ? `<div style='margin-top:5px'><strong style='margin-left:5px;'>Resistances</strong><div style='margin-left:15px'>${pc.resistances.map(a => `${a.name}`).join(', ')}</div></div>` : ``}
         ${pc.immunities.length>0 ? `<div style='margin-top:5px'><strong style='margin-left:5px;'>Immunities</strong><div style='margin-left:15px'>${pc.immunities.map(a => `${a.name}`).join(', ')}</div></div>` : ``}
         ${pc.vulnerabilities.length>0 ? `<div style='margin-top:5px'><strong style='margin-left:5px;'>Vulnerabilities</strong><div style='margin-left:15px'>${pc.vulnerabilities.map(a => `${a.name}`).join(', ')}</div></div>` : ``}
         ${pc.senses.length>0 ? `<div style='margin-top:5px'><strong style='margin-left:5px;'>Senses</strong><div style='margin-left:15px'>${pc.senses.map(a => `${a.name} ${a.distance}`).join(', ')}</div></div>` : ``}
         ${pc.proficiencyGroups.length>0 ? `<div style='margin-top:5px'><strong style='margin-left:5px;'>Proficiencies</strong> ${pc.proficiencyGroups.map(a => `<div style='margin-left:15px'><strong>${a.group}:</strong> ${a.values == "" ? `None` : a.values}</div>`).join('')}</div>` : ``}  
       </div>`)
      row.append(moreInfo);
      let expandButton = $(`<div class="player-expansion-button"><span class="material-icons">expand_more</span></div>`);
      row.append(expandButton);
      expandButton.on("click", function (clickEvent) {
        clickEvent.stopPropagation();
        let r = $(clickEvent.target).closest(".sidebar-list-item-row");
        console.log(r);
        if (r.hasClass("expanded")) {
          r.removeClass("expanded");
          r.find(".player-expansion-button .material-icons").text("expand_more");
        } else {
          r.addClass("expanded");
          r.find(".player-expansion-button .material-icons").text("expand_less");
        }
      });

      subtitle.text("");
      subtitle.show();
      subtitle.append(`<div class="subtitle-attibute inspiration" title="Player Has Inspiration"><img src="${window.EXTENSION_PATH}assets/inspiration.svg" title="Inspiration"  alt="inspiration"/></div>`);
      subtitle.append(`<div class="subtitle-attibute" title="Walk Speed"><span class="material-icons">directions_run</span><span class="walking-value"">${walkingSpeed}</span></div>`);

      let climbingSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Layer_1" x="0px" y="0px" viewBox="0 0 100 100" width:"16px" xml:space="preserve">
      <style type="text/css">
        .climb-svg .st0{fill:#738694;}
      </style>
      <path class="st0" d="M46.1,24.9c4.1,0,7.4-3.3,7.4-7.3c0-4.1-3.3-7.4-7.4-7.4c-4.1,0-7.4,3.3-7.4,7.4C38.7,21.6,42,24.9,46.1,24.9z   M59.7,44.2c0,0,0,3.1,0,3.1C79.9,37.2,87.7,2.9,87.7,0H85C83.9,7.2,75.2,35.9,59.7,44.2z M53.5,100h3.1V66.9l-3.1,1.5V100z   M27.4,41.4l10.7-4.2V52h18.5V34.8L73.1,8.3c1.2-1.9,0.7-4.5-1.3-5.7c-1.9-1.2-4.5-0.7-5.6,1.2L52.2,26.4l-8.5,0  c-0.5,0-1.1,0.1-1.6,0.3l-14.6,5.7L19.9,21c-1.2-1.9-3.8-2.5-5.7-1.2c-1.9,1.2-2.5,3.8-1.3,5.8l9.4,14.3  C23.4,41.4,25.5,42.2,27.4,41.4z M72.2,51.1c-0.7-2.6-3.8-4.6-6.3-3.4L56.6,52v3.1H38.1L23.6,88.3c-1.1,2.5,0.1,5.7,2.7,7.1  c2.6,1.5,5.6,0.6,6.6-1.9l11.8-27.2c1,0.3,2.2,0.4,3.3,0.4c1.1,0,2.1-0.2,3-0.5l13.3-6.2l2.9,11.7c0.7,2.6,3.3,4.2,5.9,3.5  s4.2-3.3,3.5-5.9L72.2,51.1z"/>
      </svg>`;
       let flyingSvg = `    
      <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Layer_1" x="0px" y="0px" width:"16px" viewBox="0 0 147.1918 306.252" enable-background="new 0 0 147.1918 306.252" xml:space="preserve">
      <g>
        <path d="M8.0042,101.7569c0.8867,0,1.7881-0.1485,2.6719-0.4619c8.1865-2.9209,14.958-8.1631,20.6826-14.0489   c6.1074-6.3056,11.0987-13.4463,15.1934-19.997v42.2343c0,0.2681,0.0137,0.5327,0.04,0.794c-0.0049,0.498,0.0108,1,0.0664,1.5078   l11,99.999c0.7051,6.3975,6.1192,11.1338,12.4102,11.1338c0.457,0,0.918-0.0244,1.3828-0.0762   c0.707-0.0776,1.3867-0.226,2.0488-0.4135c0.6621,0.1875,1.3428,0.3359,2.0498,0.4135c0.4649,0.0518,0.9258,0.0762,1.3828,0.0762   c6.2911,0,11.7051-4.7363,12.4092-11.1338l11.001-99.999c0.0088-0.0806,0.0068-0.1597,0.0146-0.2402   c0.1817-0.6573,0.2862-1.3467,0.2862-2.0616V67.2696c1.832,2.9248,3.8408,5.9648,6.0312,8.9775   c7.3838,10.0586,16.8135,20.334,29.8428,25.0469c0.8828,0.3125,1.7852,0.4609,2.6709,0.4609   c3.293,0.001,6.3779-2.0469,7.541-5.3301c1.4766-4.164-0.7031-8.7353-4.8672-10.2119c-4.9785-1.748-9.9453-5.3525-14.5498-10.1103   c-6.9258-7.1114-12.8525-16.5987-17.374-24.4356c-2.2764-3.9316-4.1963-7.4209-5.9355-10.2295   c-0.8907-1.4189-1.6934-2.6533-2.7686-3.9228c-0.5576-0.6387-1.1689-1.3067-2.1914-2.0635   c-0.7149-0.4961-1.7402-1.1621-3.2578-1.5303c-0.1446-0.0576-0.294-0.105-0.4434-0.1543   c-4.0859,7.8535-12.2959,13.2325-21.7451,13.2325c-9.4482,0-17.6582-5.3794-21.7441-13.2325   c-0.1573,0.0523-0.3155,0.1031-0.4688,0.1651c-0.7988,0.2021-1.4765,0.4795-2.0068,0.7558   c-1.8369,1.0127-2.6016,1.9287-3.3516,2.7451c-1.3096,1.5372-2.2422,3.0342-3.3398,4.8262   c-3.6905,6.1279-8.6426,15.7031-15.127,24.6055C21.1302,75.7862,13.2406,83.503,5.3304,86.2119   c-4.166,1.4766-6.3437,6.0489-4.8691,10.2139C1.6253,99.7061,4.7113,101.7559,8.0042,101.7569z"/>
        <path d="M73.597,44.9991c12.4268,0,22.5-10.0743,22.5-22.4991c0-12.4277-10.0732-22.5-22.5-22.5c-12.4258,0-22.5,10.0723-22.5,22.5   C51.097,34.9248,61.1712,44.9991,73.597,44.9991z"/>
        <rect x="63.18" y="235.752" width="3.333" height="40"/>
        <rect x="80.68" y="235.752" width="3.332" height="40"/>
        <rect x="71.93" y="242.252" width="3.333" height="64"/>
      </g>
      </svg>`;
      subtitle.append(`<div class="subtitle-attibute" title="Climb Speed"><span class="climb-svg">${climbingSvg}</span><span class="climb-value"">${climbingSpeed}</span></div>`);
      subtitle.append(`<div class="subtitle-attibute" title="Fly Speed"><span class="fly-svg">${flyingSvg}</span><span class="fly-value"">${flySpeed}</span></div>`);
      subtitle.append(`<div class="subtitle-attibute" title="Swim Speed"><span class="material-icons">pool</span><span class="swim-value"">${swimSpeed}</span></div>`);




      if (pc.inspiration) {
        subtitle.find(".inspiration").show();
      } else {
        subtitle.find(".inspiration").hide();
      }

      row.find(".token-row-add").append(`<span class="material-icons">place</span>`);

      let whisperButton = $(`
          <button class="token-row-button token-row-whisper" title="Whisper to this player">
              <span class="material-icons">spatial_audio</span>
          </button>
      `);
      row.find(".token-row-add").before(whisperButton);
      whisperButton.on("click", function(clickEvent) {
        clickEvent.stopPropagation();
        let clickedRow = $(clickEvent.target).closest(".list-item-identifier");
        let clickedItem = find_sidebar_list_item(clickedRow);
        $("#switch_gamelog").click();
        $("#chat-text").val(`/whisper [${clickedItem.name}] `);
        $("#chat-text").focus();
      });

      break;
    case ItemType.Monster:
      row.attr("data-monster", listItem.monsterData.id);
      subtitle.append(`<div class="subtitle-attibute"><span class="plain-text">CR</span>${convert_challenge_rating_id(listItem.monsterData.challengeRatingId)}</div>`);
      if (listItem.monsterData.isHomebrew === true) {
        subtitle.append(`<div class="subtitle-attibute"><span class="material-icons">alt_route</span>Homebrew</div>`);
      } else if (listItem.monsterData.isReleased === false) {
        subtitle.append(`<div class="subtitle-attibute"><span class="material-icons" style="color:darkred">block</span>No Access</div>`);
      }
      if (window.ddbConfigJson?.sources?.find(source => source.id == listItem.monsterData.sourceId)) {
        subtitle.append(`<div class="subtitle-attibute"><span class="material-icons" style="width: 15px;font-family: 'Material Symbols Outlined'; font-size:15px;">book_2</span><span>${window.ddbConfigJson?.sources?.find(source => source.id == listItem.monsterData.sourceId)?.name}</span></div>`);
      }
      if (listItem.monsterData.isLegacy === true) {
        subtitle.append(`<div class="subtitle-attibute legacy-attribute"><div class="legacy-monster"><span>Legacy</span></div></div>`);
      }

      if ((typeof listItem.monsterData.quantity == "number") && listItem.monsterData.quantity > 1 && title.find(".monster-quantity").length === 0) {
        title.prepend(`
            <div class="monster-quantity">
              <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><g transform="rotate(-45 50 50)"><rect x="0" y="40" width="100" height="20"></rect></g><g transform="rotate(45 50 50)"><rect x="0" y="40" width="100" height="20"></rect></g></svg>
              <span aria-label="quantity">${listItem.monsterData.quantity}</span>
            </div>
        `);
      }

      break;
    case ItemType.Open5e:
      row.attr("data-monster", listItem.monsterData.id);
      subtitle.append(`<div class="subtitle-attibute"><span class="plain-text">CR</span>${convert_challenge_rating_id(listItem.monsterData.challengeRatingId)}</div>`);
      if (listItem.monsterData.isHomebrew === true) {
        subtitle.append(`<div class="subtitle-attibute"><span class="material-icons" style="width: 15px;font-family: 'Material Symbols Outlined'; font-size:15px;">book_2</span>${listItem.monsterData.document__slug}</div>`);
      } 
      break;
    case ItemType.BuiltinToken:
    case ItemType.DDBToken:
      subtitle.hide();
      row.css("cursor", "default");
      break;
    case ItemType.Scene:
      row.addClass("scene-item");
      imgHolder.remove(); // we don't want the overhead of full images loading in. Clicking the row displays a preview of the image
      row.css("cursor", "pointer");
      row.attr("title", `${listItem.name}\nclick to preview`);
      let switch_dm = $(`<button class='dm_scenes_button token-row-button' title="Move DM To This Scene"></button>`);
      switch_dm.append(svg_dm());
      if(window.CURRENT_SCENE_DATA && window.CURRENT_SCENE_DATA.id === listItem.id){
        switch_dm.addClass("selected-scene");
      }
      switch_dm.on("click", function(clickEvent) {
        clickEvent.stopPropagation();
        $("#scenes-panel .dm_scenes_button.selected-scene").removeClass("selected-scene");
        $(clickEvent.currentTarget).addClass("selected-scene");
        window.MB.sendMessage("custom/myVTT/switch_scene", { sceneId: listItem.id, switch_dm: true });
        add_zoom_to_storage();
      });
      let switch_players = $(`<button class='player_scenes_button token-row-button' title="Move Players To This Scene"></button>`);
      switch_players.append(svg_everyone());
      if(window.PLAYER_SCENE_ID === listItem.id){
        switch_players.addClass("selected-scene");
      }
      switch_players.on("click", function(clickEvent) {
        clickEvent.stopPropagation();
        window.PLAYER_SCENE_ID = listItem.id;
        $("#scenes-panel .player_scenes_button.selected-scene").removeClass("selected-scene");
        $(clickEvent.currentTarget).addClass("selected-scene");
        window.MB.sendMessage("custom/myVTT/switch_scene", { sceneId: listItem.id });
        let playerScene = window.ScenesHandler.scenes.filter(d => d.id == listItem.id)[0];
        if(playerScene.playlist != undefined  && playerScene.playlist != 0 && window.MIXER.state().playlists[playerScene.playlist] != undefined){
          window.MIXER.setPlaylist(playerScene.playlist)
        }
        window.splitPlayerScenes = {};
        $('#scenes-panel .sidebar-list-item-row-details~img').remove();
        add_zoom_to_storage()
      });
      rowItem.append(switch_dm);
      rowItem.append(switch_players);
      break;
    case ItemType.Aoe:
      row.attr("data-shape", listItem.shape);
      let size = listItem.size
      if (window.CURRENT_SCENE_DATA?.fpsq > 0){
          size =  size * window.CURRENT_SCENE_DATA.fpsq
      }else{
        // when this is initialised current scene data won't exist.
        size = 5
      }
      row.attr("data-size", listItem.size);
      row.attr("data-style", listItem.style);
      subtitle.append(`<div class="subtitle-attibute">${listItem.style}</div>`);
      subtitle.append(`<div class="subtitle-attibute">${size}ft</div>`);

      break;
  }

  if (listItem.canEdit() || listItem.isTypeBuiltinToken() || listItem.isTypeDDBToken() || listItem.isTypeOpen5eMonster()) { // can't edit builtin or DDB, but need access to the list of images for drag and drop reasons.
    let settingsButton = $(`
        <div class="token-row-gear" title="configure">
            <img src="${window.EXTENSION_PATH}assets/icons/cog.svg" style="width:100%;height:100%;"  alt="settings icon"/>
        </div>
    `);
    rowItem.append(settingsButton);
    settingsButton.on("click", did_click_row_gear);
  }

  return row;
}

/**
 * When a row in the sidebar is clicked, this handles that click based on the item represented byt the row. Not all item types are clickable.
 * This should only be called with someElement.on("click", did_click_row);
 * @param clickEvent {Event} the click event
 */
function did_click_row(clickEvent) {
  clickEvent.stopPropagation();

  console.log("did_click_row", clickEvent);
  let clickedRow = $(clickEvent.target).closest(".list-item-identifier");
  let clickedItem = find_sidebar_list_item(clickedRow);
  console.log("did_click_row", clickedItem);

  let rowId = clickedRow.attr('data-id');


  switch (clickedItem.type) {
    case ItemType.Scene:
    case ItemType.MyToken:
    case ItemType.PC:
      if (ctrlHeld && rowId != undefined) {
        clickedRow.toggleClass('selected');
      }
      else if (shiftHeld && rowId != undefined) {
        if ($('.list-item-identifier.selected.selected').length > 0) {
          if (clickedRow.nextAll('.selected').length > 0) {
            const nextRows = clickedRow.nextUntil('.selected').addBack();
            nextRows.toggleClass('selected', true);
          } else if (clickedRow.prevAll('.selected').length > 0) {
            const nextRows = clickedRow.prevUntil('.selected').addBack();
            nextRows.toggleClass('selected', true);
          }
        }
      }
      else if(window.reorderState == clickedItem.type){
          $('.list-item-identifier.selected').toggleClass('selected', false);
          clickedRow.toggleClass('selected', true);
      }
      else if(clickedItem.type == ItemType.PC){
        open_player_sheet(clickedItem.sheet, undefined, clickedItem.name);
      }
      else if(clickedItem.type == ItemType.Scene){
        // show the preview
        build_and_display_sidebar_flyout(clickEvent.clientY, async function (flyout) {
          if (clickedItem.isVideo || clickedItem.isUvtt) {
            flyout.append(`<div style="background:lightgray;padding:10px;">This map is a ${clickedItem.isVideo ? 'video' : 'UVTT scene'}. We don't currently support previewing ${clickedItem.isVideo ? 'videos' : 'UVTT scenes' }.</div>`);
          } 
          else {
            const src = clickedItem.image.startsWith('above-bucket-not-a-url') 
              ? await getAvttStorageUrl(clickedItem.image, true) 
              : clickedItem.image;
            flyout.append(`<img class='list-item-image-flyout' src="${src}" alt="scene map preview" />`);
          }
          flyout.css("right", "340px");
        });
        clickedRow.off("mouseleave").on("mouseleave", function (mouseleaveEvent) {
          $(mouseleaveEvent.currentTarget).off("mouseleave");
          remove_sidebar_flyout();
        });
      }   
      break;
    case ItemType.Encounter:
    case ItemType.Folder:
      if (clickedRow.hasClass("collapsed")) {
        clickedRow.removeClass("collapsed");
        clickedItem.collapsed = false;
      } else {
        clickedRow.addClass("collapsed");
        clickedItem.collapsed = true;
      }
      persist_folders_remembered_state();
      if (clickedItem.isTypeEncounter()) {
        // we explicitly allowed it to pass through and be treated like a folder so now we need to act on it
        fetch_encounter_monsters_if_necessary(clickedRow, clickedItem);
      }
      break;
    case ItemType.MyToken:
      // display_sidebar_list_item_configuration_modal(clickedItem);
      break;
    case ItemType.Monster:
      if (ctrlHeld && rowId != undefined) {
        clickedRow.toggleClass('selected');
      }
      else if (shiftHeld && rowId != undefined) {
        if ($('.list-item-identifier.selected.selected').length > 0) {
          if (clickedRow.nextAll('.selected').length > 0) {
            const nextRows = clickedRow.nextUntil('.selected').addBack();
            nextRows.toggleClass('selected', true);
          } else if (clickedRow.prevAll('.selected').length > 0) {
            const nextRows = clickedRow.prevUntil('.selected').addBack();
            nextRows.toggleClass('selected', true);
          }
        }
      }
      else if (clickedItem.monsterData.isReleased === true || clickedItem.monsterData.isHomebrew === true) {
        console.log(`Opening monster with id ${clickedItem.monsterData.id}, url ${clickedItem.monsterData.url}`);
        open_monster_item(clickedItem);
      } else {
        console.log(`User does not have access to monster with id ${clickedItem.monsterData.id}. Opening ${clickedItem.monsterData.url}`);
        window.open(clickedItem.monsterData.url, '_blank');
      }
      break;
    case ItemType.Open5e: 
      if (ctrlHeld && rowId != undefined) {
        clickedRow.toggleClass('selected');
      }
      else if (shiftHeld && rowId != undefined) {
        if ($('.list-item-identifier.selected.selected').length > 0) {
          if (clickedRow.nextAll('.selected').length > 0) {
            const nextRows = clickedRow.nextUntil('.selected').addBack();
            nextRows.toggleClass('selected', true);
          } else if (clickedRow.prevAll('.selected').length > 0) {
            const nextRows = clickedRow.prevUntil('.selected').addBack();
            nextRows.toggleClass('selected', true);
          }
        }
      }
      else {
        console.log(`Opening open5e monster with id ${clickedItem.monsterData.slug}`);
        open_monster_item(clickedItem, true);
      }
      break;
    case ItemType.BuiltinToken:
      if (ctrlHeld && rowId != undefined) {
        clickedRow.toggleClass('selected');
      }
      else if (shiftHeld && rowId != undefined) {
        if ($('.list-item-identifier.selected.selected').length > 0) {
          if (clickedRow.nextAll('.selected').length > 0) {
            const nextRows = clickedRow.nextUntil('.selected').addBack();
            nextRows.toggleClass('selected', true);
          } else if (clickedRow.prevAll('.selected').length > 0) {
            const nextRows = clickedRow.prevUntil('.selected').addBack();
            nextRows.toggleClass('selected', true);
          }
        }
      }
      // display_builtin_token_details_modal(clickedItem);
      break;
    case ItemType.Aoe:
      // bain todo open context menu to choose style / size
    break;
  }
}

/**
 * When a configuration (gear) button on a row in the sidebar is clicked, this handles that click based on the item represented by the row, and presents the configuration modal for that item.
 * This should only be called with someElement.on("click", did_click_row_gear);
 * @param clickEvent {Event} the click event
 */
function did_click_row_gear(clickEvent) {
  clickEvent.stopPropagation();
  console.log("did_click_row_gear", clickEvent);
  let clickedRow = $(clickEvent.target).closest(".list-item-identifier");
  let clickedItem = find_sidebar_list_item(clickedRow);
  console.log("did_click_row_gear", clickedItem);
  display_sidebar_list_item_configuration_modal(clickedItem);
}



/**
 * When an AddToken (plus) button on a row in the sidebar is clicked, this handles that click based on the item represented by the row, and adds a token to the scene for that item.
 * This should only be called with someElement.on("click", did_click_add_button);
 * @param clickEvent {Event} the click event
 */
function edit_encounter(clickEvent) {
  $('#encounterWindow .title_bar_close_button').click();
  const xpTable2024 = {
      '1':{
        'low': 50,
        'mid': 75,
        'high': 100 
      },
      '2':{
        'low': 100,
        'mid': 150,
        'high': 200
      },
      '3':{
        'low': 150,
        'mid': 225,
        'high': 400
      },
      '4':{
        'low': 250,
        'mid': 375,
        'high': 500
      },
      '5':{
        'low': 500,
        'mid': 750,
        'high': 1100
      },
      '6':{
        'low': 600,
        'mid': 1000,
        'high': 1400
      },
      '7':{
        'low': 750,
        'mid': 1300,
        'high': 1700
      },
      '8':{
        'low': 1000,
        'mid': 1700,
        'high': 2100
      },
      '9':{
        'low': 1300,
        'mid': 2000,
        'high': 2600
      },
      '10':{
        'low': 1600,
        'mid': 2300,
        'high': 3100
      },
      '11':{
        'low': 1900,
        'mid': 2900,
        'high': 4100
      },
      '12':{
        'low': 2200,
        'mid': 3700,
        'high': 4700
      },
      '13':{
        'low': 2600,
        'mid': 4200,
        'high': 5400
      },
      '14':{
        'low': 2900,
        'mid': 4900,
        'high': 6200
      },
      '15':{
        'low': 3300,
        'mid': 5400,
        'high': 7800
      },
      '16':{
        'low': 3800,
        'mid': 6100,
        'high': 9800
      },
      '17':{
        'low': 4500,
        'mid': 7200,
        'high': 11700
      },
      '18':{
        'low': 5000,
        'mid': 8700,
        'high': 14200
      },
      '19':{
        'low': 5500,
        'mid': 10700,
        'high': 17200
      },
      '20':{
        'low': 6400,
        'mid': 13200,
        'high': 22000
      }
  }

  const xpTable2014 = {
      '1':{
        'low': 25,
        'mid': 50,
        'high': 75,
        'deadly': 100 
      },
      '2':{
        'low': 50,
        'mid': 100,
        'high': 150,
        'deadly': 200
      },
      '3':{
        'low': 75,
        'mid': 150,
        'high': 225,
        'deadly': 400
      },
      '4':{
        'low': 125,
        'mid': 250,
        'high': 375,
        'deadly': 500
      },
      '5':{
        'low': 250,
        'mid': 500,
        'high': 750,
        'deadly': 1100
      },
      '6':{
        'low': 300,
        'mid': 600,
        'high': 900,
        'deadly': 1400
      },
      '7':{
        'low': 350,
        'mid': 750,
        'high': 1100,
        'deadly': 1700
      },
      '8':{
        'low': 450,
        'mid': 900,
        'high': 1400,
        'deadly': 2100
      },
      '9':{
        'low': 550,
        'mid': 1100,
        'high': 1600,
        'deadly': 2400
      },
      '10':{
        'low': 600,
        'mid': 1200,
        'high': 1900,
        'deadly': 2800
      },
      '11':{
        'low': 800,
        'mid': 1600,
        'high': 2400,
        'deadly': 3600
      },
      '12':{
        'low': 1000,
        'mid': 2000,
        'high': 3000,
        'deadly': 4500
      },
      '13':{
        'low': 1100,
        'mid': 2200,
        'high': 3400,
        'deadly': 5100
      },
      '14':{
        'low': 1250,
        'mid': 2500,
        'high': 3800,
        'deadly': 5700
      },
      '15':{
        'low': 1400,
        'mid': 2800,
        'high': 4300,
        'deadly': 6400
      },
      '16':{
        'low': 1600,
        'mid': 3200,
        'high': 4800,
        'deadly': 7200
      },
      '17':{
        'low': 2000,
        'mid': 3900,
        'high': 5900,
        'deadly': 8800
      },
      '18':{
        'low': 2100,
        'mid': 4200,
        'high': 6300,
        'deadly': 9500
      },
      '19':{
        'low': 2400,
        'mid': 4900,
        'high': 7300,
        'deadly': 10900
      },
      '20':{
        'low': 2800,
        'mid': 5700,
        'high': 8500,
        'deadly': 12700
      }
  }
  const crXpTable = {
    "0":0,
    "0.125":25,
    "0.25":50,
    "0.5":100,
    "1":200,
    "2":450,
    "3":700,
    "4":1100,
    "5":1800,
    "6":2300,
    "7":2900,
    "8":3900,
    "9":5000,
    "10":5900,
    "11":7200,
    "12":8400,
    "13":10000,
    "14":11500,
    "15":13000,
    "16":15000,
    "17":18000,
    "18":20000,
    "19":22000,
    "20":25000,
    "21":33000,
    "22":41000,
    "23":50000,
    "24":62000,
    "25":75000,
    "26":90000,
    "27":105000,
    "28":120000,
    "29":135000,
    "30":155000
  }

  clickEvent.stopPropagation();
  const clickedRow = $(clickEvent.target).closest(".list-item-identifier");
  const clickedItem = find_sidebar_list_item(clickedRow);
  console.log('edit encounter clicked');

  const customization = find_or_create_token_customization(ItemType.Folder, clickedItem.id);

  const encounterContainer = find_or_create_generic_draggable_window(`encounterWindow`, clickedItem.name, false, false, undefined, '350px', undefined, undefined, 'calc(100% - 700px)', false);

  encounterContainer.attr('data-encounter-id', clickedItem.id)
  encounterContainer.find('.title_bar_close_button').off('click.save').on('click.save', function(){
    rebuild_token_items_list();
    redraw_token_list($('[name="token-search"]').val() ? $('[name="token-search"]').val() : "");
  })
 function form_toggle(name, hoverText, defaultOn, callback){
    const toggle = $(
      `<button id="${name}_toggle" name=${name} type="button" role="switch" data-hover="${hoverText}"
      class="rc-switch sidebar-hovertext"><span class="rc-switch-inner" /></button>`)
    if (!hoverText) toggle.removeClass("sidebar-hovertext")
    toggle.on("click", callback)
    if (defaultOn){
      toggle.addClass("rc-switch-checked")
    }
    return toggle
  }

  const encounterBody = $(`<div class="encounter-body"></div>`)
  const encounterListing = $(`<div class="encounter-listing"></div>`);

  const rulesToggle = form_toggle('Rules Version', 'Rules Version', customization.encounterData?.rules != undefined ? customization.encounterData.rules : true, function(){
    const customization = find_or_create_token_customization(ItemType.Folder, clickedItem.id);
    if(customization.encounterData == undefined)
      customization.encounterData = {}
    const enabled = $(this).hasClass("rc-switch-checked")

    $(this).toggleClass('rc-switch-checked', !enabled);
    customization.encounterData.rules = !enabled;
    persist_token_customization(customization);
    encounterContainer.trigger('redrawListing');
  }); 

  const rulesLine = $(`<div id='encounterRulesLine'><span>2014</span><span class='toggle'></span><span>2024</span></div>`)
  rulesLine.find('.toggle').append(rulesToggle);

  const difficultyLine = $(`<div id='encounterDifficultyLine'>

     <div class='xpLine low'>
      <span>Low XP:</span>
      <span class='lowDifficulty'></span>
    </div>
    <div class='xpLine mid'>
      <span>Moderate XP:</span>
      <span class='midDifficulty'></span>
    </div>
    <div class='xpLine high'>
      <span>High XP:</span>
      <span class='highDifficulty'></span>
    </div>
    <div class='xpLine deadly'>
      <span>Deadly XP:</span>
      <span class='deadlyDifficulty'></span>
    </div>
    <div class='xpLine multiplier'>
      <span>XP Multiplier:</span>
      <span class='difficultyMulti'></span>
    </div>

    <div class='xpLine current'>
      <span>XP:</span>
      <span class='encounterXp'>0</span>
    </div>
    <div class='difficultyLine'>
      <span>Difficulty:</span>
      <span class='encounterDifficulty'>Low</span>
    </div>
    </div>`)

  const allyTitle = $(`<div id='allyTitle'>
      Is Ally
    </div>`)
  

  encounterContainer.off('redrawListing').on('redrawListing',function() {
    encounterListing.empty();

    if(customization.encounterData?.tokenItems != undefined){
      let xp = 0;
      let xpLowMax = 0;
      let xpMidMax = 0;
      let xpHighMax = 0;
      let xpDeadlyMax = 0;
      const isOldrules = customization.encounterData.rules == false;
      const xpTable = isOldrules ? xpTable2014 : xpTable2024;



      for (let i in customization.encounterData.tokenItems){
        const item = customization.encounterData.tokenItems[i];
        const itemCustomization = find_token_customization(customization.encounterData.tokenItems[i].type, customization.encounterData.tokenItems[i].id);
        const hasCustomStatBlock = itemCustomization?.tokenOptions?.statBlock != undefined;
        let statBlock = hasCustomStatBlock ? $(`<div>${window.JOURNAL.notes[itemCustomization.tokenOptions.statBlock].text}</div>`) : new MonsterStatBlock(item.monsterData);       
        let cr;
        if(!hasCustomStatBlock && item.monsterData != undefined){
          const foundCR = statBlock.findObj("challengeRatings", statBlock.data.challengeRatingId).value;
          cr = foundCR;
        }
        else if(hasCustomStatBlock){
          if(window.JOURNAL.notes[itemCustomization.tokenOptions.statBlock] != undefined){
           
            statBlock.find('style').remove();
            statBlock=statBlock[0].innerHTML;
            let crText = $(statBlock).find('.custom-challenge-rating.custom-stat').text();
            if(crText == '' || crText == undefined){
              let searchText = statBlock.replaceAll('mon-stat-block-2024', '').replaceAll(/\&nbsp\;/g,' ')

              let statBlockCR = searchText.matchAll(/[\s>]CR[\s]+([0-9]+(\/[0-9])?)/gi).next()
              if(statBlockCR.value != undefined){
                if(statBlockCR.value[1] != undefined)
                    crText = statBlockCR.value[1];
              } 
              else{
                statBlockCR = searchText.matchAll(/[\s>](CR[\W]|challenge)[\s\S]*?[\s>]([0-9]+(\/[0-9])?)/gi).next()

                if(statBlockCR.value != undefined){
                    if(statBlockCR.value[2] != undefined)
                        crText = statBlockCR.value[2];
                }  
              }

                    
            }
            if(crText != '' && crText != undefined)
              cr = eval(crText);   
            else
              cr = 0;
          }
        }
        for(let j = 0; j<item.quantity; j++ ){
          if(item.type != 'pc'){
            if((item.isAllyQuantity == undefined && item.isAlly == true) || item.isAllyQuantity > j){                
              cr = Math.min(30, cr);
              xpLowMax += isOldrules ? crXpTable[cr]/4 :crXpTable[cr]/2;
              xpMidMax += isOldrules ? crXpTable[cr]/2 : crXpTable[cr]*3/4;
              xpHighMax += isOldrules ? crXpTable[cr]*3/4 : crXpTable[cr];
              if(isOldrules){
                xpDeadlyMax += crXpTable[cr];
              } 
            }
            else{
              const xpValue = hasCustomStatBlock ? crXpTable[cr]: statBlock.data != undefined ? statBlock.findObj("challengeRatings", statBlock.data.challengeRatingId).xp : 0;
              xp += xpValue;
            }
          } else if(item.type == 'pc' && ((item.isAllyQuantity == undefined && item.isAlly == true) || item.isAllyQuantity > j)){
            const pc = find_pc_by_player_id(item.id);
            const pcLevel = pc.level
            xpLowMax += xpTable[pcLevel].low;
            xpMidMax += xpTable[pcLevel].mid;
            xpHighMax += xpTable[pcLevel].high;
            if(isOldrules){
              xpDeadlyMax += xpTable[pcLevel].deadly;
            }
          }
          else if(item.type == 'pc' && (item.isAlly == false || item.isAllyQuantity <= j)){
            const pc = find_pc_by_player_id(item.id);
            const pcLevel = pc.level
            xp += crXpTable[pcLevel];
          }
          let row = build_sidebar_list_row(SidebarListItem.fromJson(item));
          const removeButton = $('<button class="removeItem" style="font-size:24px;"><svg class="delSVG" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"></path><path d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1zM18 7H6v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7z"></path></svg></button>')
          removeButton.off('click.removeItem').on('click.removeItem', function(){
            const customization = find_or_create_token_customization(ItemType.Folder, clickedItem.id);

            if(item.quantity>1){
              customization.encounterData.tokenItems[i].quantity-=1;
            }
            else{
              delete customization.encounterData.tokenItems[i];
            }
            persist_token_customization(customization);
            encounterContainer.trigger('redrawListing');
          })

          const allyToggle = form_toggle('isAlly', 'Is Ally', ((item.isAllyQuantity == undefined && item.isAlly == true) || item.isAllyQuantity > j) ? true : item.type == 'pc' ? item.isAlly : false, function(){
              const customization = find_or_create_token_customization(ItemType.Folder, clickedItem.id);      
              const enabled = $(this).hasClass("rc-switch-checked")
              const item = customization.encounterData.tokenItems[i];
              $(this).toggleClass('rc-switch-checked', !enabled);
              item.isAlly = !enabled;
              if(item.quantity != undefined){
                if(item.isAllyQuantity == undefined){
                  if(!enabled)
                    item.isAllyQuantity = 1;
                  else
                    item.isAllyQuantity = 0
                }
                else{
                  item.isAllyQuantity = !enabled ? item.isAllyQuantity + 1 : item.isAllyQuantity - 1;
                }
              }
              persist_token_customization(customization)
              encounterContainer.trigger('redrawListing');
            }); 
          $(encounterListing).append(row);
          row.find('.sidebar-list-item-row-item').append(removeButton, allyToggle);
        }
      }
      difficultyLine.find('.lowDifficulty').text(Math.round(xpLowMax));
      difficultyLine.find('.midDifficulty').text(Math.round(xpMidMax));
      difficultyLine.find('.highDifficulty').text(Math.round(xpHighMax));

      if(!isOldrules){
        difficultyLine.find('.xpLine.deadly, .xpLine.multiplier').css('visibility', 'hidden');
      }
      else{
        difficultyLine.find('.xpLine.deadly, .xpLine.multiplier').css('visibility', '');
        difficultyLine.find('.deadlyDifficulty').text(Math.round(xpDeadlyMax));
      }
      if(!isOldrules){
        if(xp <= xpLowMax){
          difficultyLine.find('.encounterDifficulty').text('Low');
          difficultyLine.find('.difficultyLine').toggleClass('low', true);
          difficultyLine.find('.difficultyLine').toggleClass(['mid', 'high', 'deadly'], false);
        }
        else if(xp > xpLowMax && xp <= xpMidMax){
          difficultyLine.find('.encounterDifficulty').text('Moderate');
          difficultyLine.find('.difficultyLine').toggleClass('mid', true);
          difficultyLine.find('.difficultyLine').toggleClass(['low', 'high', 'deadly'], false);
        }else if(xp > xpMidMax && xp <= xpHighMax){
          difficultyLine.find('.encounterDifficulty').text('High');
          difficultyLine.find('.difficultyLine').toggleClass('high', true);
          difficultyLine.find('.difficultyLine').toggleClass(['mid', 'low', 'deadly'], false);
        }
        else{
          difficultyLine.find('.encounterDifficulty').text('Greater than High');
          difficultyLine.find('.difficultyLine').toggleClass('deadly', true)
          difficultyLine.find('.difficultyLine').toggleClass(['mid', 'high', 'low'], false)
        }
      }else{
        const numberOfEnemies = encounterListing.find('.rc-switch:not(.rc-switch-checked)').length;
        const xpMultipler = numberOfEnemies >= 15 ? 4 : numberOfEnemies >= 11 ? 3 : numberOfEnemies >= 7 ? 2.5 : numberOfEnemies >= 3 ? 2 : numberOfEnemies == 2 ? 1.5 : 1;

        xp = xp*xpMultipler;

        if(xp <= xpMidMax){
          difficultyLine.find('.encounterDifficulty').text('Low');
          difficultyLine.find('.difficultyLine').toggleClass('low', true)
          difficultyLine.find('.difficultyLine').toggleClass(['mid', 'high', 'deadly'], false)
        }
        else if(xp > xpMidMax && xp <= xpHighMax){
          difficultyLine.find('.encounterDifficulty').text('Moderate');
          difficultyLine.find('.difficultyLine').toggleClass('mid', true)
          difficultyLine.find('.difficultyLine').toggleClass(['low', 'high', 'deadly'], false)
        }else if(xp > xpHighMax && xp <= xpDeadlyMax){
          difficultyLine.find('.encounterDifficulty').text('High');
          difficultyLine.find('.difficultyLine').toggleClass('high', true)
          difficultyLine.find('.difficultyLine').toggleClass(['mid', 'low', 'deadly'], false)
        }
        else{
          difficultyLine.find('.encounterDifficulty').text('Deadly');
          difficultyLine.find('.difficultyLine').toggleClass('deadly', true)
          difficultyLine.find('.difficultyLine').toggleClass(['mid', 'high', 'low'], false)
        }
        difficultyLine.find('.difficultyMulti').text(`x${xpMultipler}`);
        
      }
      difficultyLine.find('.encounterXp').text(Math.round(xp));


     
    }
    encounterListing.children('.sidebar-list-item-row').sort(function(a, b) {
      const aAlly = $(a).find('.rc-switch-checked').length>0;
      if (aAlly) {
        return -1;
      } else {
        return 1;
      }
    }).appendTo(encounterListing);
    
   
  });
  

   

  encounterBody.append(rulesLine, difficultyLine, allyTitle, encounterListing);
  encounterContainer.append(encounterBody);
  encounterContainer.trigger('redrawListing');

}
/**
 * When an AddToken (plus) button on a row in the sidebar is clicked, this handles that click based on the item represented by the row, and adds a token to the scene for that item.
 * This should only be called with someElement.on("click", did_click_add_button);
 * @param clickEvent {Event} the click event
 */
function did_click_add_button(clickEvent) {
  clickEvent.stopPropagation();
  console.log("did_click_add_button", clickEvent);
  let clickedRow = $(clickEvent.target).closest(".list-item-identifier");
  let clickedItem = find_sidebar_list_item(clickedRow);
  console.log("did_click_add_button", clickedItem);
  let hidden = clickEvent.shiftKey ? true : undefined; // we only want to force hidden if the shift key is help. otherwise let the global and override settings handle it
  create_and_place_token(clickedItem, hidden, undefined, undefined, undefined);
  update_pc_token_rows();
}

/**
 * Displays a SidebarPanel as a modal that allows the user to configure the given listItem
 * @param listItem {SidebarListItem} the item to configure
 */
function display_sidebar_list_item_configuration_modal(listItem) {
  switch (listItem?.type) {
    case ItemType.Encounter:
      // TODO: support editing in an iframe on the page?
      window.open(`https://www.dndbeyond.com/encounters/${listItem.encounterId}/edit`, '_blank');
      break;
    case ItemType.Folder:
      if (listItem.canEdit()) {
        display_folder_configure_modal(listItem);
      } else {
        console.warn("Only allowed to folders within the My Tokens folder and Scenes");
        return;
      }
      break;
    case ItemType.BuiltinToken:
    case ItemType.DDBToken:
      display_token_configuration_modal(listItem);
      break;
    case ItemType.MyToken:
      display_token_configuration_modal(listItem);
      break;
    case ItemType.PC:
    case ItemType.Monster:
      display_token_configuration_modal(listItem);
      break;
    case ItemType.Open5e:
      display_token_configuration_modal(listItem);
      break;
    case ItemType.Scene:
      let index = window.ScenesHandler.scenes.findIndex(s => s.id === listItem.id);
      if (index >= 0) {
        edit_scene_dialog(index);
      } else {
        showError("Failed to find scene index for scene with id", listItem.id);
      }
      break;
    case ItemType.Aoe:
      display_aoe_token_configuration_modal(listItem);
      break;
    default:
      console.warn("display_sidebar_list_item_configuration_modal not supported for listItem", listItem);
  }
}

function create_folder_inside(listItem) {
  if (!listItem.isTypeFolder()) {
    console.warn("create_folder_inside called with an incorrect item type", listItem);
    return;
  }

  if (listItem.folderType === ItemType.MyToken) {
    create_mytoken_folder_inside(listItem);
  } else if (listItem.folderType === ItemType.Scene) {
    create_scene_folder_inside(listItem);
  } else if(listItem.folderType == ItemType.PC){
    create_player_folder_inside(listItem);
  } else if(listItem.folderType == ItemType.Encounter){
    create_encounter_folder_inside(listItem);
  }else {
    console.warn("create_folder_inside called with an incorrect item type", listItem);
  }
}

/**
 * Displays a SidebarPanel as a modal that allows the user to configure a folder
 * @param listItem {SidebarListItem} the item to configure
 */
function display_folder_configure_modal(listItem) {
  if (listItem === undefined || !listItem.isTypeFolder()) {
    console.warn("display_folder_configure_modal was called with an incorrect type", listItem);
    return;
  }
  console.log('display_folder_configure_modal', listItem);

  let sidebarId = "folder-configuration-modal";
  let sidebarModal = new SidebarPanel(sidebarId, true);
  let itemType = listItem.folderType;

  display_sidebar_modal(sidebarModal);

  sidebarModal.updateHeader(listItem.name, listItem.fullPath(), "Edit or delete this folder.");

  const renameFolder = function(newFolderName, input, event) {
    let oldPath = harvest_full_path(input);
    console.log(`renameFolder oldPath: ${oldPath}, newFolderName: ${newFolderName}`);
    if (oldPath.endsWith(`/${newFolderName}`)) {
      // It did not change. Nothing to do here.
      return undefined;
    }
    let foundItem = find_sidebar_list_item(input);
    console.log(`before renameFolder foundItem id: ${foundItem.id}, name: ${foundItem.name}, folderPath: ${foundItem.folderPath}`);
    let updatedFullPath = rename_folder(foundItem, newFolderName, true);
    console.log(`after  renameFolder foundItem id: ${foundItem.id}, name: ${foundItem.name}, folderPath: ${foundItem.folderPath}, updatedFullPath: ${updatedFullPath}`);
    if (updatedFullPath) {
      // the name has been changed. Update the input so we know it has been changed later
      set_full_path(input, updatedFullPath);
      console.log('inside updatedFullPath');      
      sidebarModal.updateHeader(newFolderName, updatedFullPath, "Edit or delete this folder.");
      console.log('returning updatedFullPath');
      return updatedFullPath;
    } else {
      console.log('else updatedFullPath');
      // there was a naming conflict, and the user has been alerted. select the entire text so they can easily change it
      input.select();
      return false;
    }
  }

  

  let folderNameInput = $(`<input type="text" title="Folder Name" name="folderName" value="${listItem.name}" />`);
  set_list_item_identifier(folderNameInput, listItem);
  if (itemType === ItemType.MyToken || itemType === ItemType.Scene || (itemType === ItemType.PC && listItem.id !== RootFolder.Players.id) || (itemType === ItemType.Encounter && listItem.id !== RootFolder.Encounters.id)){
    sidebarModal.body.append(build_text_input_wrapper("Folder Name", folderNameInput, undefined, renameFolder, false));
  }

  let tokenCustomizations = find_token_customization(listItem.type, listItem.id);
  let folderColor = tokenCustomizations?.color ? tokenCustomizations?.color : listItem.color ? listItem.color : '#F4B459';

  let folderColorInput = `<div class="token-image-modal-footer-select-wrapper">
              <div class="token-image-modal-footer-select-wrapper">
                 <div class="token-image-modal-footer-title">Folder Color</div>
                  <div style="padding-left: 2px">
                      <input class="spectrum" name="folderColor" value="${folderColor}" >
                  </div>
              </div>`;

  sidebarModal.body.append(folderColorInput);
  let colorPickers = sidebarModal.body.find('input.spectrum');
  colorPickers.spectrum({
      type: "color",
      showInput: true,
      showInitial: true,
      containerClassName: 'prevent-sidebar-modal-close',
      clickoutFiresChange: true,
      appendTo: "parent"
  });
  sidebarModal.body.find("input[name='folderColor']").spectrum("set", folderColor);
  const colorPickerChange = function(e, tinycolor) {
      listItem.color = `rgba(${tinycolor._r}, ${tinycolor._g}, ${tinycolor._b}, ${tinycolor._a})`;
  };
  colorPickers.on('dragstop.spectrum', colorPickerChange);   // update the token as the player messes around with colors
  colorPickers.on('change.spectrum', colorPickerChange); // commit the changes when the user clicks the submit button
  colorPickers.on('hide.spectrum', colorPickerChange);   // the hide event includes the original color so let's change it back when we get it

  if (itemType === ItemType.MyToken || (listItem.isTypeFolder() && itemType !== ItemType.Scene)) {
    let customization = find_or_create_token_customization(ItemType.Folder, listItem.id, listItem.parentId, RootFolder.MyTokens.id);
    let folderOptionsButton = build_override_token_options_button(sidebarModal, listItem, undefined, customization.tokenOptions, function (key, value) {
      customization.setTokenOption(key, value);
    }, function () {
      persist_token_customization(customization);
    });
    sidebarModal.body.append(folderOptionsButton);
  }

  let saveButton = $(`<button class="sidebar-panel-footer-button" style="width:100%;padding:8px;margin-top:8px;margin-left:0px;">Save Folder</button>`);
  saveButton.on("click", function (clickEvent) {
    if (itemType === ItemType.MyToken || itemType === ItemType.Scene || (itemType === ItemType.PC && listItem.id !== RootFolder.Players.id) || (itemType === ItemType.Encounter && listItem.id !== RootFolder.Encounters.id)){
      let nameInput = $(clickEvent.currentTarget).closest(".sidebar-panel-body").find("input[name='folderName']");
      console.log(`saveButton nameInput`, nameInput);
      let renameResult = renameFolder(nameInput.val(), nameInput, clickEvent);
    }
    close_sidebar_modal();
    if(itemType === ItemType.MyToken || (listItem.isTypeFolder() && itemType !== ItemType.Scene) || itemType === ItemType.PC){
      let customization = find_or_create_token_customization(ItemType.Folder, listItem.id, listItem.parentId, RootFolder.MyTokens.id);
      customization.color = listItem.color;
      persist_token_customization(customization);
      rebuild_token_items_list();
      filter_token_list($('[name="token-search"]').val() ? $('[name="token-search"]').val() : "");   
    }
    else{ 
      let sceneIndex = window.ScenesHandler.scenes.findIndex( d => d.id == listItem.id);
      window.ScenesHandler.scenes[sceneIndex].color = listItem.color;
      window.ScenesHandler.persist_scene(sceneIndex);
      did_update_scenes();
    }
    
    expand_all_folders_up_to_id(listItem.id);

  });
  sidebarModal.body.append(saveButton);
  if(!RootFolder.allValues().some(d => d.id == listItem.id) && itemType !== ItemType.BuiltinToken){
    if(itemType !== ItemType.Encounter){
      let deleteFolderAndMoveChildrenButton = $(`<button class="token-image-modal-remove-all-button" title="Delete this folder">Delete folder and<br />move items up one level</button>`);
      set_list_item_identifier(deleteFolderAndMoveChildrenButton, listItem);
      sidebarModal.footer.append(deleteFolderAndMoveChildrenButton);
      deleteFolderAndMoveChildrenButton.on("click", function(event) {
        let foundItem = find_sidebar_list_item($(event.currentTarget));
        delete_folder_and_move_children_up_one_level(foundItem);
        close_sidebar_modal();
        expand_all_folders_up_to_item(foundItem);
      });
    }
    
    if(itemType !== ItemType.PC){
      let deleteFolderAndChildrenButton = $(`<button class="token-image-modal-remove-all-button" title="Delete this folder and everything in it">Delete folder and<br />everything in it</button>`);
      set_list_item_identifier(deleteFolderAndChildrenButton, listItem);
      sidebarModal.footer.append(deleteFolderAndChildrenButton);
      deleteFolderAndChildrenButton.on("click", function(event) {
        let foundItem = find_sidebar_list_item($(event.currentTarget));
        delete_folder_and_delete_children(foundItem);
        close_sidebar_modal();
        expand_all_folders_up_to_item(foundItem);
      });
    }

  }


  sidebarModal.body.find(`input[name="folderName"]`).select();
}

function rename_folder(item, newName, alertUser = true) {
  if (!item || !item.isTypeFolder()) {
    console.warn("rename_folder called with an incorrect item type", item);
    if (alertUser !== false) {
      showError("Failed to rename folder", item);
    }
    return undefined;
  }

  if (item.folderPath.startsWith(RootFolder.MyTokens.path) || item.folderPath.startsWith(RootFolder.Players.path) || item.folderPath.startsWith(RootFolder.Encounters.path)) {
    let customization = find_token_customization(item.type, item.id);
    customization.setTokenOption("name", newName);
    persist_token_customization(customization);
    
    return customization.fullPath();
  } else if (item.isTypeSceneFolder()) {
    return rename_scene_folder(item, newName, alertUser);
  } else if (alertUser !== false) {
    showError("Failed to find folder path", item);
  }
  return undefined;
}

/**
 * deletes the object represented by the given item if that object can be deleted. (pretty much only My Tokens)
 * @param listItem {SidebarListItem} the item to delete
 */
function delete_item(listItem, refresh = true, skipConfirmation = false) {
  if (!listItem.canDelete()) {
    console.warn("Not allowed to delete item", listItem);
    return;
  }

  switch (listItem.type) {
    case ItemType.Folder:
      switch (listItem.folderType) {
        case ItemType.PC:  
          delete_folder_and_move_children_up_one_level(listItem);
          break;
        default:
          delete_folder_and_delete_children(listItem)
          break;
      }
      break;
    case ItemType.MyToken:
      delete_token_customization_by_type_and_id(listItem.type, listItem.id);
      if (refresh)
        did_change_mytokens_items();
      break;
    case ItemType.Scene:
      if (skipConfirmation || confirm(`Are you sure that you want to delete the scene named "${listItem.name}"?`)) {
        window.ScenesHandler.delete_scene(listItem.id, refresh);
      }
      break;
    case ItemType.PC:

      console.warn("Not allowed to delete player", listItem);
      break;
    case ItemType.Monster:
      console.warn("Not allowed to delete monster", listItem);
      break;
    case ItemType.BuiltinToken:
      console.warn("Not allowed to delete builtin token", listItem);
      break;
  }
}

/**
 * removes the .collapsed class from all folders leading up to the specified path
 * @param listItem {SidebarListItem|undefined} the item to expand up to
 */
function expand_all_folders_up_to_item(listItem) {
  expand_all_folders_up_to_id(listItem?.id);
}

/**
 * removes the .collapsed class from all folders leading up to the specified path
 * @param id {string|undefined} the id of the element to expand up to
 */
function expand_all_folders_up_to_id(id) {
  if (typeof id !== "string" || id.length === 0) return;
  let element = $(`#${id}`)
  if (element.length === 0) {
    element = $(`[data-id="${id}"]`);
  }
  if (element.length === 0) {
    console.warn(`expand_all_folders_up_to_id failed to find a folder with id ${id}`);
    return;
  }
  element.parents(".collapsed").removeClass("collapsed");
  element.removeClass("collapsed");
}

/**
 * deletes a folder and all items/folders within it. "items" refers to the mytokens, scenes, etc. that the item represents
 * @param listItem {SidebarListItem} the item representing the folder you want to delete
 */
function delete_folder_and_delete_children(listItem) {
  if (!listItem.isTypeFolder()) {
    console.warn("delete_folder_and_delete_children called with an incorrect item type", listItem);
    return;
  }
  if (!confirm(`Are you sure you want to delete "${listItem.name}"?\nAll items within it will also be deleted`)) {
    console.debug("delete_folder_and_delete_children was canceled by user", listItem);
    return;
  }

  if (listItem.folderType === ItemType.MyToken || listItem.folderType === ItemType.Encounter) {
    delete_mytokens_folder_and_everything_in_it(listItem);
  } else if (listItem.folderType === ItemType.Scene) {
    delete_folder_and_all_scenes_within_it(listItem);
    did_update_scenes();
    expand_all_folders_up_to_item(listItem);
  } else {
    console.warn("delete_folder_and_delete_children called with an incorrect item type", listItem);
  }

}

/**
 * deletes a folder and moves all items/folders within it to the given folder's parent. "items" refers to the mytokens, scenes, etc. that the item represents
 * @param listItem {SidebarListItem} the item representing the folder you want to delete
 */
function delete_folder_and_move_children_up_one_level(listItem) {
  if (!listItem.isTypeFolder()) {
    console.warn("delete_folder_and_move_children_up_one_level called with an incorrect item type", listItem);
    return;
  }
  if (!confirm(`Are you sure you want to delete "${listItem.name}"?\nAll items within it will be moved up one level.`)) {
    console.debug("delete_folder_and_move_children_up_one_level was canceled by user", listItem);
    return;
  }

  if (listItem.folderType === ItemType.MyToken || listItem.folderType === ItemType.PC) {
    move_mytokens_to_parent_folder_and_delete_folder(listItem, function (didSucceed, errorType) {
      did_change_mytokens_items();
      expand_all_folders_up_to_id(listItem.parentId);
    });
  } else if (listItem.folderType === ItemType.Scene) {
    move_scenes_to_parent_folder(listItem);
    delete_scenes_folder(listItem);
    did_update_scenes();
    expand_all_folders_up_to_id(listItem.parentId);
  } 
  else {
    console.warn("delete_folder_and_move_children_up_one_level called with an incorrect item type", listItem);
  }
}

function build_and_display_sidebar_flyout(clientY, buildFunction) {
  let flyout = $(`<div class='sidebar-flyout'></div>`);
  $("body").append(flyout);

  buildFunction(flyout); // we want this built here so we can position the flyout based on the height of it

  let height = flyout.height();
  let halfHeight = (height / 2);
  let top = clientY - halfHeight;
  if (top < 30) { // make sure it's always below the main UI buttons
    top = 30;
  } else if (clientY + halfHeight > window.innerHeight - 30) {
    top = window.innerHeight - height - 30;
  }

  flyout.css({
    "top": top
  });
}

function position_flyout_on_best_side_of(container, flyout, resizeFlyoutToFit = true) {
  let didResize = false;
  if (!container || container.length === 0 || !flyout || flyout.length === 0) {
    console.warn("position_flyout_on_best_side_of received an empty object", container, flyout);
    return didResize;
  }
  const distanceFromLeft = container[0].getBoundingClientRect().left;
  const distanceFromRight = window.innerWidth - distanceFromLeft - container.width();
  if (distanceFromLeft > distanceFromRight) {
    if (resizeFlyoutToFit && (flyout.width() > distanceFromLeft)) {
      flyout.css("width", distanceFromLeft);
      didResize = true;
    }
    position_flyout_left_of(container, flyout);
  } else {
    if (resizeFlyoutToFit && (flyout.width() > distanceFromRight)) {
      flyout.css("width", distanceFromRight);
      didResize = true;
    }
    position_flyout_right_of(container, flyout);
  }
  return didResize;
}

function position_flyout_left_of(container, flyout) {
  if (!container || container.length === 0 || !flyout || flyout.length === 0) {
    console.warn("position_flyout_left_of received an empty object", container, flyout);
    return;
  }
  flyout.css("left", container[0].getBoundingClientRect().left - flyout.width());
}

function position_flyout_right_of(container, flyout) {
  if (!container || container.length === 0 || !flyout || flyout.length === 0) {
    console.warn("position_flyout_right_of received an empty object", container, flyout);
    return;
  }
  flyout.css("left", container[0].getBoundingClientRect().left + container.width());
}

function remove_sidebar_flyout(removeHoverNote) {
  console.log("remove_sidebar_flyout");
  let flyouts = $(`.sidebar-flyout`)
  let hovered = $(`.tooltip-flyout:hover`).length>0 == true;
  if(removeHoverNote == false){
    flyouts = $(`.sidebar-flyout:not('.note-flyout')`)
  }
  if(!hovered)
    flyouts.remove();
}

async function list_item_image_flyout(hoverEvent) {
  console.log("list_item_image_flyout", hoverEvent);
  $(`#list-item-image-flyout`).remove(); // never duplicate
  if (hoverEvent.type === "mouseenter") {
    const imgsrc = $(hoverEvent.currentTarget).find("img").attr("src");
    const src = imgsrc.startsWith('above-bucket-not-a-url') ? await getAvttStorageUrl(avttSidebarApplyThumbnailPrefix(imgsrc)) : imgsrc;
    const flyout = $(`<img id='list-item-image-flyout' src="${src}" alt="image preview" />`);
    flyout.css({
      "top": hoverEvent.clientY - 75,
    });
    $("body").append(flyout);
  }
}

function  disable_draggable_change_folder() {

  $(document).off("click.clearSelectScenes").on('click.clearSelectScenes', function(e) { 
    const target = $(e.target);
    if(!target.closest('#scenes-panel').length){
      $('#scenes-panel .selected').toggleClass('selected', false);
    }
  });
    
  if(window.reorderState != undefined){
    window.reorderState = undefined;
    $(".token-row-drag-handle").remove();

    // MyToken
    if (typeof tokensPanel !== 'undefined') {
        tokensPanel.body.find(".token-row-gear").show();
        tokensPanel.body.find(".token-row-button").show();
        tokensPanel.body.find(".token-row-button.reorder-button").show();
        tokensPanel.body.find(".reorder-button").removeClass("active");
        tokensPanel.body.find(" > .custom-token-list > .folder").show();
        tokensPanel.body.removeClass("folder");
        tokensPanel.header.find("input[name='token-search']").show();
        tokensPanel.updateHeader("Tokens");
        
        add_expand_collapse_buttons_to_header(tokensPanel, true);

        try {
          tokensPanel.body.find(".ui-draggable").draggable("destroy");
        } catch (e) {} // don't care if it fails, just try
        try {
          tokensPanel.body.find(".ui-droppable").droppable("destroy");
        } catch (e) {} // don't care if it fails, just try
        try {
          tokensPanel.body.droppable("destroy");
        } catch (e) {} // don't care if it fails, just try
        tokensPanel.body.find('.list-item-identifier.selected').toggleClass('selected', false)
        redraw_token_list($('[name="token-search"]').val());
    }

    // Scenes
    if (typeof scenesPanel !== 'undefined') {
        scenesPanel.body.find(".token-row-gear").show();
        scenesPanel.body.find(".token-row-button").show();
        scenesPanel.header.find(".token-row-gear").show();
        scenesPanel.header.find(".token-row-button").show();
        scenesPanel.header.find(".scenes-panel-add-buttons-wrapper input").show();
        scenesPanel.header.find(".scenes-panel-add-buttons-wrapper")
        scenesPanel.header.find(".reorder-button").removeClass("active");
        scenesPanel.header.find(".scenes-panel-add-buttons-wrapper .reorder-explanation").hide();
        scenesPanel.body.removeClass("folder");

        try {
          scenesPanel.body.find(".ui-draggable").draggable("destroy");
        } catch (e) {} // don't care if it fails, just try
        try {
          scenesPanel.body.find(".ui-droppable").droppable("destroy");
        } catch (e) {} // don't care if it fails, just try
        try {
          scenesPanel.body.droppable("destroy");
        } catch (e) {} // don't care if it fails, just try

        scenesPanel.body.find('.list-item-identifier.selected').toggleClass('selected', false)
    }
  }
  return true;
  
}

function add_expand_collapse_buttons_to_header(sidebarPanel, addHideButton=false) {

  let expandAll = $(`<button class="token-row-button expand-collapse-button" title="Expand All Folders" style=""><span class="material-icons">expand</span></button>`);
  expandAll.on("click", function (clickEvent) {
    const panel = $(clickEvent.target).closest(".sidebar-panel-content")
    panel.find(".sidebar-panel-body .folder:not(.not-collapsible)").removeClass("collapsed");
    const panelId = panel.attr('id'); 
    const options = panelId.includes('tokens') ? { token: false } : panelId.includes('scenes') ? { scene: false } : {};
    persist_folders_remembered_state(options);
  });
  let collapseAll = $(`<button class="token-row-button expand-collapse-button" title="Collapse All Folders" style=""><span class="material-icons">vertical_align_center</span></button>`);
  collapseAll.on("click", function (clickEvent) {
    const panel = $(clickEvent.target).closest(".sidebar-panel-content")
    panel.find(".sidebar-panel-body .folder:not(.not-collapsible)").addClass("collapsed");
    const panelId = panel.attr('id');
    const options = panelId.includes('tokens') ? { token: true } : panelId.includes('scenes') ? { scene: true } : {};
    persist_folders_remembered_state(options);
  });
  let buttonWrapper = $("<div class='expand-collapse-wrapper'></div>");
  sidebarPanel.header.find(".sidebar-panel-header-title").append(buttonWrapper);
  if(addHideButton){
    let hideButton = $(`<button class="token-row-button reveal-hidden-button" title="Reveal hidden folders/tokens" style=""><span class="material-icons">disabled_visible</span></button>`);
    hideButton.on("click", function (clickEvent) {
      if($(this).hasClass('clicked')){
        $(clickEvent.target).closest(".sidebar-panel-content").find(".sidebar-panel-body .hidden-sidebar-item").toggleClass("temporary-visible", false);
        $(this).toggleClass('clicked', false);
      }
      else{
        $(clickEvent.target).closest(".sidebar-panel-content").find(".sidebar-panel-body .hidden-sidebar-item").toggleClass("temporary-visible", true);
        $(this).toggleClass('clicked', true);
      }  
    });
    if($('.temporary-visible').length>0){
      $(hideButton).toggleClass('clicked', true);
    }
    buttonWrapper.append(hideButton);
  }
  buttonWrapper.append(expandAll);
  buttonWrapper.append(collapseAll);
}

/**
 * allows you to drag items from one folder to another
 * @param listItemType {string} ItemType.MyTokens || ItemType.Scene
 */
async function enable_draggable_change_folder(listItemType) {

  await disable_draggable_change_folder();
  window.reorderState = listItemType; // if you move the current scene, it will reload. When that happens, we need to know to re-enter this state.
  const droppableOptions = {
    greedy: true,
    tolerance: "pointer",
    accept: ".draggable-sidebar-item-reorder:not(.drag-cancelled)",
    drop: function (dropEvent, ui) {
      dropEvent.stopPropagation();
      let draggedRow = $(ui.helper);
      draggedRow.toggleClass('selected', true);
      let draggedItem = find_sidebar_list_item(draggedRow);
      let selectedItems = $(`.list-item-identifier.selected`)

      let droppedFolder = $(dropEvent.target);
      if (droppedFolder.hasClass("sidebar-panel-body") || droppedFolder.attr("id") === RootFolder.Scenes.id) {
        // they dropped it on the header so find the root folder
        if (window.reorderState === ItemType.Scene) {
          for(let i=0; i<selectedItems.length; i++){
            draggedRow = $(selectedItems[i]);
            draggedItem = find_sidebar_list_item(draggedRow);
            move_item_into_folder_item(draggedItem, RootFolder.Scenes.id);
          }
          did_update_scenes();
        } else if (window.reorderState === ItemType.MyToken) {
          for(let i=0; i<selectedItems.length; i++){
            draggedRow = $(selectedItems[i]);
            draggedItem = find_sidebar_list_item(draggedRow);
            let customization = find_token_customization(draggedItem.type, draggedItem.id);
            customization.parentId = RootFolder.MyTokens.id;
            persist_token_customization(customization);
          }
          rebuild_token_items_list();

        } else if (window.reorderState === ItemType.PC) {   
          for(let i=0; i<selectedItems.length; i++){
            draggedRow = $(selectedItems[i]);
            draggedItem = find_sidebar_list_item(draggedRow);
            let customization = find_or_create_token_customization(draggedItem.type, draggedItem.id);
            customization.parentId = RootFolder.Players.id;
            persist_token_customization(customization);
          }
          rebuild_token_items_list();
          enable_draggable_change_folder(ItemType.PC);
        } else {
          console.warn("Unable to reorder item by dropping it on the body", window.reorderState, draggedItem);
        }
      } else {
        let folderItem = find_sidebar_list_item(droppedFolder);
        console.log("enable_draggable_change_folder dropped", draggedItem, folderItem);
        
        for(let i=0; i<selectedItems.length; i++){
          draggedRow = $(selectedItems[i]);
          draggedItem = find_sidebar_list_item(draggedRow);
          move_item_into_folder_item(draggedItem, folderItem);
        }

        if(window.reorderState === ItemType.Scene){
          did_update_scenes();
        }else if(window.reorderState === ItemType.PC ||window.reorderState === ItemType.MyToken){
          rebuild_token_items_list();
        }  

        
        
        expand_all_folders_up_to_item(folderItem);
      }
    }
  };

  switch (window.reorderState) {
    case ItemType.MyToken:

      await redraw_token_list("", false)
      tokensPanel.body.find(".token-row-gear").hide();
      tokensPanel.body.find(".token-row-button").hide();
      // tokensPanel.body.find(".folder").removeClass("collapsed");
      tokensPanel.body.find(" > .custom-token-list > .folder").hide();
      tokensPanel.body.find(".reorder-button").show();
      tokensPanel.body.find(".reorder-button").addClass("active");
      tokensPanel.header.find("input[name='token-search']").hide();
      tokensPanel.updateHeader("Tokens", "", "Drag items to move them between folders");
      add_expand_collapse_buttons_to_header(tokensPanel);

      let myTokensRootItem = tokens_rootfolders.find(i => i.name === RootFolder.MyTokens.name);
      let myTokensRootFolder = find_html_row(myTokensRootItem, tokensPanel.body);
      // make sure we expand all folders that can be dropped on
      myTokensRootFolder.show();
      myTokensRootFolder.removeClass("collapsed");
      // myTokensRootFolder.find(".folder").removeClass("collapsed");

      // TODO: disable the draggable that was added here enable_draggable_token_creation
      // tokensPanel.body.find(".sidebar-list-item-row").draggable("destroy");
      let offsetStart = {};
      tokensPanel.body.find(".sidebar-list-item-row").draggable({
        containment: tokensPanel.body,
        appendTo: tokensPanel.body,
        revert: true,
        scroll: true,
        distance: 10,
        start: function(e, ui){
          offsetStart= tokensPanel.body.scrollTop();
        },
        drag: function(e, ui){
          ui.position.top = ui.position.top - tokensPanel.body.scrollTop() + offsetStart
        },
        helper: function (event) {
          let draggedRow = $(event.target).closest(".list-item-identifier");
          let draggedItem = find_sidebar_list_item(draggedRow);
          if (draggedItem.isTypeFolder()) {
            draggedRow.addClass("collapsed");
          }

          draggedRow.addClass("draggable-sidebar-item-reorder");
          return draggedRow;
        },
        stop: function (event, ui) {
          let draggedRow = $(event.target).closest(".list-item-identifier");
          draggedRow.removeClass("draggable-sidebar-item-reorder");
          if (draggedRow.hasClass("drag-cancelled")) {
            draggedRow.removeClass("drag-cancelled");
            redraw_token_list("", false);
          }
        }
      });

      myTokensRootFolder.droppable(droppableOptions); // allow dropping on root MyTokens folder
      myTokensRootFolder.find(".folder").droppable(droppableOptions);  // allow dropping on folders within MyTokens folder
      tokensPanel.body.addClass("folder").addClass("not-collapsible");  // allow dropping on folders within MyTokens folder
      tokensPanel.body.droppable(droppableOptions);  // allow dropping on folders within MyTokens folder
      

     

      break;
    case ItemType.Scene:
      scenesPanel.header.find(".token-row-button").hide();
      scenesPanel.header.find(".scenes-panel-add-buttons-wrapper input").hide();
      scenesPanel.header.find(".scenes-panel-add-buttons-wrapper .reorder-explanation").show();
      scenesPanel.header.find(".reorder-button").show();
      scenesPanel.header.find(".reorder-button").addClass("active");
      scenesPanel.body.find(".token-row-gear").hide();
      scenesPanel.body.find(".token-row-button").hide();
      scenesPanel.body.addClass("folder").addClass("not-collapsible"); // we want the root to act like a folder, but we don't want to allow it to collapse

      scenesPanel.body.find(".sidebar-list-item-row").draggable({
        container: scenesPanel.body,
        opacity: 0.7,
        revert: true,
        scroll: false, // jQuery UI has a bug where scrolling changes the offset of the helper. If we can figure out how to work around that bug, then we can change this to true
        // axis: "y",  // this helps if we set scroll: true
        distance: 10,
        helper: function (event) {
          let draggedRow = $(event.target).closest(".list-item-identifier");
          let draggedItem = find_sidebar_list_item(draggedRow);
          if (draggedItem.isTypeFolder()) {
            draggedRow.addClass("collapsed");
          }
          draggedRow.addClass("draggable-sidebar-item-reorder");
          return draggedRow;
        },
        stop: function (event, ui) {
          let draggedRow = $(event.target).closest(".list-item-identifier");
          draggedRow.removeClass("draggable-sidebar-item-reorder");
          if (draggedRow.hasClass("drag-cancelled")) {
            draggedRow.removeClass("drag-cancelled");
            redraw_scene_list("");
          }
        }
      });

      scenesPanel.container.find(".folder").droppable(droppableOptions);

      break;
    case ItemType.PC:

      await redraw_token_list("", false)
      tokensPanel.body.find(".token-row-gear").hide();
      tokensPanel.body.find(".token-row-button").hide();
      // tokensPanel.body.find(".folder").removeClass("collapsed");
      tokensPanel.body.find(" > .custom-token-list > .folder").hide();
      tokensPanel.body.find(".reorder-button").show();
      tokensPanel.body.find(".reorder-button").addClass("active");
      tokensPanel.body.find('.player-row[id^="/profile/"]').off('click');
      tokensPanel.header.find("input[name='token-search']").hide();
      tokensPanel.updateHeader("Tokens", "", "Drag items to move them between folders");
      add_expand_collapse_buttons_to_header(tokensPanel);

      let playersRootItem = tokens_rootfolders.find(i => i.name === RootFolder.Players.name);
      let playersRootFolder = find_html_row(playersRootItem, tokensPanel.body);
      // make sure we expand all folders that can be dropped on
      playersRootFolder.show();
      playersRootFolder.removeClass("collapsed");
      // myTokensRootFolder.find(".folder").removeClass("collapsed");

      // TODO: disable the draggable that was added here enable_draggable_token_creation
      // tokensPanel.body.find(".sidebar-list-item-row").draggable("destroy");
      let playerOffsetStart = {};
      tokensPanel.body.find(".sidebar-list-item-row:not([id*='playersFolder']").draggable({
        containment: tokensPanel.body,
        appendTo: tokensPanel.body,
        revert: true,
        scroll: true,
        start: function(e, ui){
          playerOffsetStart= tokensPanel.body.scrollTop();
        },
        distance: 10,
        drag: function(e, ui){
          ui.position.top = ui.position.top - tokensPanel.body.scrollTop() + playerOffsetStart
        },
        helper: function (event) {
          let playerDraggedRow = $(event.target).closest(".list-item-identifier");
          let playerDraggedItem = find_sidebar_list_item(playerDraggedRow);
          if (playerDraggedItem.isTypeFolder()) {
            playerDraggedRow.addClass("collapsed");
          }

          playerDraggedRow.addClass("draggable-sidebar-item-reorder");
          return playerDraggedRow;
        },
        stop: function (event, ui) {
          let playerDraggedRow = $(event.target).closest(".list-item-identifier");
          playerDraggedRow.removeClass("draggable-sidebar-item-reorder");
          if (playerDraggedRow.hasClass("drag-cancelled")) {
            playerDraggedRow.removeClass("drag-cancelled");
            redraw_token_list("", false);
          }
        }
      });

      playersRootFolder.droppable(droppableOptions); // allow dropping on root MyTokens folder
      playersRootFolder.find(".folder").droppable(droppableOptions);  // allow dropping on folders within MyTokens folder
      tokensPanel.body.addClass("folder").addClass("not-collapsible");  // allow dropping on folders within MyTokens folder
      tokensPanel.body.droppable(droppableOptions);  // allow dropping on folders within MyTokens folder
      break;
    default:
      console.warn("enable_draggable_change_folder was called with an invalid type");
      return;
  }

}

function move_item_into_folder_item(listItem, folderItem) {
  if (listItem.isTypeMyToken() || (listItem.isTypeFolder() && listItem.fullPath().startsWith(RootFolder.MyTokens.path))) {
    let customization = find_token_customization(listItem.type, listItem.id);
    customization.parentId = folderItem.id;    persist_token_customization(customization);

  } else if (listItem.isTypeScene() || listItem.isTypeSceneFolder()) {
    move_scene_to_folder(listItem, folderItem.id);
  } else if(listItem.isTypePC() || (listItem.isTypeFolder() && listItem.fullPath().startsWith(RootFolder.Players.path))){
    let customization = find_or_create_token_customization(listItem.type, listItem.id, listItem.parentId, RootFolder.Players.id);
    customization.parentId = folderItem.id;
    persist_token_customization(customization);
  } else {
    console.warn("move_item_into_folder_item was called with invalid item type", listItem);
  }
}
