
function init_sidebar_tabs() {
  console.log("init_sidebar_tabs");

  let sidebarContent = is_characters_page() ? $(".ct-sidebar__pane-content") : $(".sidebar__pane-content");
  
  // gamelog doesn't use it yet, maybe never

  if (window.DM) {
    $("#tokens-panel").remove();
    tokensPanel = new SidebarPanel("tokens-panel", false);
    sidebarContent.append(tokensPanel.build());
    init_tokens_panel();

    if (window.CLOUD) {
      $("#scenes-panel").remove();
      scenesPanel = new SidebarPanel("scenes-panel", false);
      sidebarContent.append(scenesPanel.build());
      init_scenes_panel();
    }

  } else {
    $("#players-panel").remove();
    playersPanel = new SidebarPanel("players-panel", false);
    sidebarContent.append(playersPanel.build());
    update_pclist();
  }

  $("#sounds-panel").remove();
  soundsPanel = new SidebarPanel("sounds-panel", false);
  sidebarContent.append(soundsPanel.build());
  init_audio();

  $("#journal-panel").remove();
  journalPanel = new SidebarPanel("journal-panel", false);
  sidebarContent.append(journalPanel.build());
  if (window.JOURNAL === undefined) {
    init_journal(find_game_id());
  } else {
    window.JOURNAL.build_journal()
  }

  if (window.DM) {
    $("#settings-panel").remove();
    settingsPanel = new SidebarPanel("settings-panel", false);
    sidebarContent.append(settingsPanel.build());
    init_settings();
  }

  observe_hover_text($(".sidebar__inner"));
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
  sidebarPanelContent.off("mouseenter mouseleave").on("mouseenter mouseleave", ".sidebar-hover-text", function(hoverEvent) {
    const displayText = $(hoverEvent.currentTarget).attr("data-hover");
    if (typeof displayText === "string" && displayText.length > 0) {
      if (hoverEvent.type === "mouseenter") {
        build_and_display_sidebar_flyout(hoverEvent.clientY, function (flyout) {
          flyout.append(`<div class="sidebar-hover-text-flyout">${displayText}</div>`);
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

    return build_text_input_wrapper(titleText,
        `<input title="${titleText}" placeholder="https://..." name="addCustomImage" type="text" />`,
        `<button>Add</button>`,
        function(imageUrl, input, event) {
          if(imageUrl.startsWith("data:")){
            alert("You cannot use urls starting with data:");
          } else {
            imageUrlEntered(imageUrl);
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
 * @returns {*|jQuery|HTMLElement}
 */
function build_text_input_wrapper(titleText, input, sideButton, inputSubmitCallback) {
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

function build_toggle_input(name, labelText, enabled, enabledHoverText, disabledHoverText, changeHandler) {
  if (typeof changeHandler !== 'function') {
    changeHandler = function(){};
  }
  let wrapper = $(`
    <div class="token-image-modal-footer-select-wrapper">
      <div class="token-image-modal-footer-title">${labelText}</div>
    </div>
  `);
  let input = $(`<button name="${name}" type="button" role="switch" class="rc-switch"><span class="rc-switch-inner"></span></button>`);
  if (enabled === null) {
    input.addClass("rc-switch-unknown");
    update_hover_text(wrapper, "This has multiple values. Clicking this will enable it for all.");
  } else if (enabled === true) {
    input.addClass("rc-switch-checked");
    update_hover_text(wrapper, enabledHoverText);
  } else {
    update_hover_text(wrapper, disabledHoverText);
  }
  wrapper.append(input);
  input.click(function(clickEvent) {
    if ($(clickEvent.currentTarget).hasClass("rc-switch-checked")) {
      // it was checked. now it is no longer checked
      $(clickEvent.currentTarget).removeClass("rc-switch-checked");
      update_hover_text(wrapper, disabledHoverText);
      changeHandler(name, false);
    } else {
      // it was not checked. now it is checked
      $(clickEvent.currentTarget).removeClass("rc-switch-unknown");
      $(clickEvent.currentTarget).addClass("rc-switch-checked");
      update_hover_text(wrapper, enabledHoverText);
      changeHandler(name, true);
    }
  });
  return wrapper;
}

function build_dropdown_input(name, labelText, currentValue, options, changeHandler) {
   if (typeof changeHandler !== 'function') {
    changeHandler = function(){};
  }
  
  let wrapper = $(`<div id='tokenWrapper__${name}' class="token-image-modal-footer-title">${labelText}</div>`);
  let tokenSelect = $(`<select id="tokenSelect__${name}" class='token-select-dropdown'></select>`)

  for(let i=0; i<options.length; i++){
    tokenSelect.append(options[i]);
  }
  tokenSelect.val(currentValue);

  tokenSelect.change(function(clickEvent) {
    changeHandler(name, $(`#tokenSelect__${name} option:selected`).val());
    if(name == "tokenStyleSelect"){
      $(`#tokenWrapper__tokenBaseStyleSelect`).hide();
      if($(`#tokenSelect__${name} option:selected`).val() == 4 || $(`#tokenSelect__${name} option:selected`).val() == 5){
         $(`#tokenWrapper__tokenBaseStyleSelect`).show();
      }
    }
  });
  
  wrapper.append(tokenSelect);

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

  // the types of items that are supported
  static TypeFolder = "folder";
  static TypeMyToken = "myToken";
  static TypePC = "pc";
  static TypeMonster = "monster";
  static TypeBuiltinToken = "builtinToken";
  static TypeEncounter = "encounter";
  static TypeScene = "scene";

  static PathRoot = "/";
  static PathPlayers = "/Players";
  static PathMonsters = "/Monsters";
  static PathMyTokens = "/My Tokens";
  static PathAboveVTT = "/AboveVTT Tokens";
  static PathEncounters = "/Encounters";
  static PathScenes = "/Scenes";

  // folder names within the tokens panel
  static NamePlayers = "Players";
  static NameMonsters = "Monsters";
  static NameMyTokens = "My Tokens";
  static NameAboveVTT = "AboveVTT Tokens";
  static NameEncounters = "Encounters";

  /** Do not call this directly! It is a generic constructor for a SidebarListItem. Use one of the static functions instead.
   * @param name {string} the name displayed to the user
   * @param image {string} the src of the img tag
   * @param type {string} the type of item this represents. One of [folder, myToken, monster, pc]
   * @param folderPath {string} the folder this item is in
   */
  constructor(name, image, type, folderPath = SidebarListItem.PathRoot) {
    this.name = name;
    this.image = image;
    this.type = type;
    this.folderPath = sanitize_folder_path(folderPath);
  }

  /**
   * Creates a Folder list item.
   * @param folderPath {string} the path that the folder is in (not including the name of this folder)
   * @param name {string} the name of the folder
   * @param collapsed {boolean} whether or not the folder is open or closed.
   * @param subtitle {string|undefined} a subtitle to be displayed. defaults to undefined
   * @returns {SidebarListItem} the list item this creates
   * @constructor
   */
  static Folder(folderPath, name, collapsed, subtitle = undefined) {
    console.debug(`SidebarListItem.Folder ${folderPath}/${name}, collapsed: ${collapsed}`);
    let item = new SidebarListItem(name, `${window.EXTENSION_PATH}assets/folder.svg`, SidebarListItem.TypeFolder, folderPath);
    item.collapsed = collapsed;
    item.subtitle = subtitle;
    return item;
  }

  /**
   * Creates a "My Token" list item.
   * @param tokenData {object} an object that represents the "My Token". The object is an updated version of legacy tokendata objects, and mostly translates to the {Token}.options object
   * @returns {SidebarListItem} the list item this creates
   * @constructor
   */
  static MyToken(tokenData) {
    console.debug("SidebarListItem.MyToken", tokenData);
    return new SidebarListItem(tokenData.name, tokenData.image, SidebarListItem.TypeMyToken, `${SidebarListItem.PathMyTokens}/${tokenData.folderPath}`);
  }

  /**
   * Creates a Builtin list item.
   * @param tokenData {object} an object that represents the "Builtin Token". The object is an updated version of legacy tokendata objects, and mostly translates to the {Token}.options object
   * @returns {SidebarListItem} the list item this creates
   * @constructor
   */
  static BuiltinToken(tokenData) {
    console.debug("SidebarListItem.BuiltinToken", tokenData);
    return new SidebarListItem(tokenData.name, tokenData.image, SidebarListItem.TypeBuiltinToken, `${SidebarListItem.PathAboveVTT}/${tokenData.folderPath}`);
  }

  /**
   * Creates a Monster list item.
   * @param monsterData {object} the object returned by the DDB API call that searches for monsters
   * @returns {SidebarListItem} the list item this creates
   * @constructor
   */
  static Monster(monsterData) {
    console.debug("SidebarListItem.Monster", monsterData);
    let item = new SidebarListItem(monsterData.name, monsterData.avatarUrl, SidebarListItem.TypeMonster, SidebarListItem.PathMonsters);
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
  static PC(sheet, name, image) {
    console.debug("SidebarListItem.PC", sheet, name, image);
    let item = new SidebarListItem(name, image, SidebarListItem.TypePC, SidebarListItem.PathPlayers);
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
    console.debug(`SidebarListItem.Encounter ${SidebarListItem.PathEncounters}/${name}, collapsed: ${collapsed}`);
    let item = new SidebarListItem(name, `${window.EXTENSION_PATH}assets/folder.svg`, SidebarListItem.TypeEncounter, SidebarListItem.PathEncounters);
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
    let scenePath = sceneData.folderPath || "";
    let item = new SidebarListItem(name, sceneData.player_map, SidebarListItem.TypeScene, sanitize_folder_path(`${SidebarListItem.PathScenes}/${scenePath}`));
    console.debug(`SidebarListItem.Scene ${item.fullPath()}`);
    item.sceneId = sceneData.id;
    item.isVideo = sceneData.player_map_is_video == "1"; // explicity using `==` instead of `===` in case it's ever `1` or `"1"`
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
  isTypeFolder() { return this.type === SidebarListItem.TypeFolder }

  /** @returns {boolean} whether or not this item represents a "My Token" */
  isTypeMyToken() { return this.type === SidebarListItem.TypeMyToken }

  /** @returns {boolean} whether or not this item represents a Player */
  isTypePC() { return this.type === SidebarListItem.TypePC }

  /** @returns {boolean} whether or not this item represents a Monster */
  isTypeMonster() { return this.type === SidebarListItem.TypeMonster }

  /** @returns {boolean} whether or not this item represents a Builtin Token */
  isTypeBuiltinToken() { return this.type === SidebarListItem.TypeBuiltinToken }

  /** @returns {boolean} whether or not this item represents an Encounter */
  isTypeEncounter() { return this.type === SidebarListItem.TypeEncounter }

  /** @returns {boolean} whether or not this item represents a Scene */
  isTypeScene() { return this.type === SidebarListItem.TypeScene }

  /** @returns {boolean} whether or not this item is listed in the tokens panel */
  isTokensPanelItem() {
    if (this.isTypeFolder()) {
      if (this.folderPath === SidebarListItem.PathRoot) {
        return this.name === SidebarListItem.NamePlayers || this.name === SidebarListItem.NameMonsters || this.name === SidebarListItem.NameMyTokens || this.name === SidebarListItem.NameAboveVTT || this.name === SidebarListItem.NameEncounters;
      } else {
        return this.folderPath.startsWith(SidebarListItem.PathPlayers) || this.folderPath.startsWith(SidebarListItem.PathMonsters) || this.folderPath.startsWith(SidebarListItem.PathMyTokens) || this.folderPath.startsWith(SidebarListItem.PathAboveVTT) || this.folderPath.startsWith(SidebarListItem.PathEncounters);
      }
    }
    return this.isTypeMyToken() || this.isTypePC() || this.isTypeMonster() || this.isTypeBuiltinToken()
  }

  /** @returns {boolean} whether or not this item represents an object that can be edited by the user */
  canEdit() {
    switch (this.type) {
      case SidebarListItem.TypeFolder:
        return this.folderPath.startsWith(SidebarListItem.PathMyTokens) || this.folderPath.startsWith(SidebarListItem.PathScenes);
      case SidebarListItem.TypeMyToken:
      case SidebarListItem.TypePC:
      case SidebarListItem.TypeMonster:
      case SidebarListItem.TypeEncounter:
      case SidebarListItem.TypeScene:
        return true;
      case SidebarListItem.TypeBuiltinToken:
      default:
        return false;
    }
  }

  /** @returns {boolean} whether or not this item represents an object that can be deleted by the user */
  canDelete() {
    switch (this.type) {
      case SidebarListItem.TypeFolder:
        // TODO: allow deleting scenes folders
        return this.folderPath.startsWith(SidebarListItem.PathMyTokens) || this.folderPath.startsWith(SidebarListItem.PathScenes);
      case SidebarListItem.TypeMyToken:
      case SidebarListItem.TypeScene:
        return true;
      case SidebarListItem.TypePC:
      case SidebarListItem.TypeMonster:
      case SidebarListItem.TypeBuiltinToken:
      case SidebarListItem.TypeEncounter: // we technically could support this, but I don't think we should
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
    return this.name.toLowerCase().includes(searchTerm.toLowerCase()) // any item with a partially matching name
    || this.containingFolderName().toLowerCase().includes(searchTerm.toLowerCase()) // all items within a folder with a partially matching name
  }

  backingId() {
    switch (this.type) {
      case SidebarListItem.TypePC:
        return this.sheet;
      case SidebarListItem.TypeMonster:
        return this.monsterData.id;
      case SidebarListItem.TypeFolder:
      case SidebarListItem.TypeMyToken:
      case SidebarListItem.TypeScene:
      case SidebarListItem.TypeBuiltinToken:
      case SidebarListItem.TypeEncounter:
      default:
        return this.id; // could be undefined
    }
  }
}

/**
 * @param dirtyPath {string} the path to sanitize
 * @returns {string} the sanitized path
 */
function sanitize_folder_path(dirtyPath) {
  if (dirtyPath === undefined) {
    return SidebarListItem.PathRoot;
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
      return foundItem;
    }
  }

  let sceneId = html.attr("data-scene-id");
  if (typeof sceneId === "string" && sceneId.length > 0) {
    foundItem = window.sceneListItems.find(item => item.sceneId == sceneId);
    if (foundItem !== undefined) {
      return foundItem;
    }
  }

  if (html.attr("data-monster") !== undefined) {
    // explicitly using '==' instead of '===' to allow (33253 == '33253') to return true
    foundItem = window.monsterListItems.find(item => item.monsterData.id == html.attr("data-monster"));
    if (foundItem !== undefined) {
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
  if (fullPath.startsWith(SidebarListItem.PathScenes)) {
    foundItem = window.sceneListItems.find(matchingPath);
    if (foundItem === undefined) {
      foundItem = window.sceneListFolders.find(matchingPath);
    }
    if (foundItem !== undefined) {
      return foundItem;
    }
  }

  // check all the tokens items
  foundItem = tokens_rootfolders.find(matchingPath);
  if (foundItem === undefined) {
    foundItem = window.tokenListItems.find(matchingPath);
  }
  if (foundItem === undefined) {
    foundItem = window.monsterListItems.find(matchingPath);
  }
  if (foundItem === undefined) {
    foundItem = Object.values(cached_monster_items).find(matchingPath);
  }
  if (foundItem === undefined) {
    console.warn(`find_sidebar_list_item found nothing at path: ${fullPath}`);
  }
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

/**
 * @param listItem {SidebarListItem} the list item that this row will represent
 * @returns {*|jQuery|HTMLElement} that represents a row in the list of items in the sidebar
 */
function build_sidebar_list_row(listItem) {

  let row = $(`<div class="sidebar-list-item-row" title="${listItem.name}"></div>`);
  set_full_path(row, listItem.fullPath());

  let rowItem = $(`<div class="sidebar-list-item-row-item"></div>`);
  row.append(rowItem);
  rowItem.on("click", did_click_row);

  let imgHolder = $(`<div class="sidebar-list-item-row-img"></div>`);
  rowItem.append(imgHolder);
  let img = $(`<img src="${parse_img(listItem.image)}" alt="${listItem.name} image" class="token-image" />`);
  imgHolder.append(img);

  let details = $(`<div class="sidebar-list-item-row-details"></div>`);
  rowItem.append(details);
  let title = $(`<div class="sidebar-list-item-row-details-title">${listItem.name}</div>`);
  details.append(title);
  let subtitle = $(`<div class="sidebar-list-item-row-details-subtitle"></div>`);
  details.append(subtitle);

  if (!listItem.isTypeFolder() && !listItem.isTypeScene()) {
    let addButton = $(`
        <button class="token-row-button token-row-add" title="Add Token to Scene">
            <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M7.2 10.8V18h3.6v-7.2H18V7.2h-7.2V0H7.2v7.2H0v3.6h7.2z"></path></svg>
        </button>
    `);
    rowItem.append(addButton);
    addButton.on("click", did_click_add_button);
  }

  switch (listItem.type) {
    case SidebarListItem.TypeEncounter: // explicitly allowing encounter to fall through because we want them to be treated like folders
    case SidebarListItem.TypeFolder:
      subtitle.hide();
      row.append(`<div class="folder-item-list"></div>`);
      row.addClass("folder");
      console.log(`folder.collapsed: ${listItem.collapsed}`, listItem);
      if (listItem.collapsed === true) {
        row.addClass("collapsed");
      }
      if (listItem.fullPath().startsWith(SidebarListItem.PathMyTokens)) {
        // add buttons for creating subfolders and tokens
        let addFolder = $(`<button class="token-row-button" title="Create New Folder"><span class="material-icons">create_new_folder</span></button>`);
        rowItem.append(addFolder);
        addFolder.on("click", function (clickEvent) {
          clickEvent.stopPropagation();
          let clickedRow = $(clickEvent.target).closest(".list-item-identifier");
          let clickedItem = find_sidebar_list_item(clickedRow);
          create_folder_inside(clickedItem);
        });
        let addToken = $(`<button class="token-row-button" title="Create New Token"><span class="material-icons">person_add_alt_1</span></button>`);
        rowItem.append(addToken);
        addToken.on("click", function (clickEvent) {
          let clickedRow = $(clickEvent.target).closest(".list-item-identifier");
          let clickedItem = find_sidebar_list_item(clickedRow);
          create_token_inside(clickedItem);
        });
        if (listItem.isRootFolder()) {
          let reorderButton = $(`<button class="token-row-button reorder-button" title="Reorder Scenes"><span class="material-icons">reorder</span></button>`);
          rowItem.append(reorderButton);
          reorderButton.on("click", function (clickEvent) {
            clickEvent.stopPropagation();
            if ($(clickEvent.currentTarget).hasClass("active")) {
              disable_draggable_change_folder(SidebarListItem.TypeMyToken);
            } else {
              enable_draggable_change_folder(SidebarListItem.TypeMyToken);
            }
          });
        }
      } else if (listItem.fullPath().startsWith(SidebarListItem.PathScenes)) {
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
          let clickedRow = $(clickEvent.target).closest(".list-item-identifier");
          let clickedItem = find_sidebar_list_item(clickedRow);
          create_scene_inside(clickedItem.fullPath());
        });
      } else if (listItem.fullPath() === SidebarListItem.PathMonsters) {
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
    case SidebarListItem.TypeMyToken:
      subtitle.hide();
      // TODO: Style specifically for My Tokens
      row.css("cursor", "default");
      break;
    case SidebarListItem.TypePC:
      let playerData = window.PLAYER_STATS[listItem.sheet];
      if (playerData === undefined) {
        subtitle.text("loading character details");
        playerData = {
          abilities: [
            {abilityName: 'Strength', abilityAbbr: 'str', modifier: '?', score: '?', save: '?' },
            {abilityName: 'Dexterity', abilityAbbr: 'dex', modifier: '?', score: '?', save: '?' },
            {abilityName: 'Constitution', abilityAbbr: 'con', modifier: '?', score: '?', save: '?' },
            {abilityName: 'Intelligence', abilityAbbr: 'int', modifier: '?', score: '?', save: '?' },
            {abilityName: 'Wisdom', abilityAbbr: 'wis', modifier: '?', score: '?', save: '?' },
            {abilityName: 'Charisma', abilityAbbr: 'cha', modifier: '?', score: '?', save: '?' }
          ],
          pp: '?',
          inspiration: false,
          walking: '?'
        };
      }
      row.addClass("player-row");
      let abilities = $(`<div class="player-card-footer">`);
      abilities.hide();
      abilities.append(playerData.abilities.map(a => `
                <div class="ability_value" data-ability="${a.abilityAbbr}">
                    <div class="ability_name">${a.abilityAbbr.toUpperCase()}</div>
                    <div class="ability_modifier">${a.modifier}</div>
                    <div class="ability_score">${a.score}</div>
                </div>
            `).join(''));
      row.append(abilities);
      let expandButton = $(`<div class="player-expansion-button"><span class="material-icons">expand_more</span></div>`);
      row.append(expandButton);
      expandButton.on("click", function (clickEvent) {
        clickEvent.stopPropagation();
        let r = $(clickEvent.target).closest(".sidebar-list-item-row");
        console.log(r);
        if (r.hasClass("expanded")) {
          r.removeClass("expanded");
          r.find(".player-card-footer").hide();
          r.find(".player-expansion-button .material-icons").text("expand_more");
        } else {
          r.addClass("expanded");
          r.find(".player-card-footer").show();
          r.find(".player-expansion-button .material-icons").text("expand_less");
        }
      });

      subtitle.text("");
      subtitle.show();
      subtitle.append(`<div class="subtitle-attibute" title="Passive Perception"><span class="material-icons">visibility</span><span class="pp-value">${playerData.pp}</span></div>`);
      subtitle.append(`<div class="subtitle-attibute" title="Speed"><span class="material-icons">directions_run</span><span class="walking-value"">${playerData.walking}</span></div>`);
      subtitle.append(`<div class="subtitle-attibute inspiration" title="Player Has Inspiration"><img src="${window.EXTENSION_PATH}assets/inspiration.svg" title="Inspiration"  alt="inspiration"/></div>`);
      if (playerData.inspiration) {
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
    case SidebarListItem.TypeMonster:
      row.attr("data-monster", listItem.monsterData.id);
      subtitle.append(`<div class="subtitle-attibute"><span class="plain-text">CR</span>${convert_challenge_rating_id(listItem.monsterData.challengeRatingId)}</div>`);
      if (listItem.monsterData.isHomebrew === true) {
        subtitle.append(`<div class="subtitle-attibute"><span class="material-icons">alt_route</span>Homebrew</div>`);
      } else if (listItem.monsterData.isReleased === false) {
        subtitle.append(`<div class="subtitle-attibute"><span class="material-icons" style="color:darkred">block</span>No Access</div>`);
      }

      if (listItem.monsterData.isLegacy === true) {
        subtitle.append(`<div class="legacy-monster"><span>Legacy</span></div>`);
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
    case SidebarListItem.TypeBuiltinToken:
      subtitle.hide();
      // TODO: Style specifically for Builtin
      row.css("cursor", "default");
      break;
    case SidebarListItem.TypeScene:
      row.attr("data-scene-id", listItem.sceneId);
      row.addClass("scene-item");
      imgHolder.remove(); // we don't want the overhead of full images loading in. Clicking the row displays a preview of the image
      row.css("cursor", "pointer");
      row.attr("title", `${listItem.name}\nclick to preview`);
      let switch_dm = $(`<button class='dm_scenes_button token-row-button' title="Move DM To This Scene"></button>`);
      switch_dm.append(svg_dm());
      if(window.CURRENT_SCENE_DATA && window.CURRENT_SCENE_DATA.id === listItem.sceneId){
        switch_dm.addClass("selected-scene");
      }
      switch_dm.on("click", function(clickEvent) {
        clickEvent.stopPropagation();
        $("#scenes-panel .dm_scenes_button.selected-scene").removeClass("selected-scene");
        $(clickEvent.currentTarget).addClass("selected-scene");
        window.MB.sendMessage("custom/myVTT/switch_scene", { sceneId: listItem.sceneId, switch_dm: true });
        add_zoom_to_storage();
      });
      let switch_players = $(`<button class='player_scenes_button token-row-button' title="Move Players To This Scene"></button>`);
      switch_players.append(svg_everyone());
      if(window.PLAYER_SCENE_ID === listItem.sceneId){
        switch_players.addClass("selected-scene");
      }
      switch_players.on("click", function(clickEvent) {
        clickEvent.stopPropagation();
        window.PLAYER_SCENE_ID = listItem.sceneId;
        $("#scenes-panel .player_scenes_button.selected-scene").removeClass("selected-scene");
        $(clickEvent.currentTarget).addClass("selected-scene");
        window.MB.sendMessage("custom/myVTT/switch_scene", { sceneId: listItem.sceneId });
        add_zoom_to_storage()
      });
      rowItem.append(switch_dm);
      rowItem.append(switch_players);
      break;
  }

  if (listItem.canEdit() || listItem.isTypeBuiltinToken()) { // can't edit builtin, but need access to the list of images for drag and drop reasons.
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

  switch (clickedItem.type) {
    case SidebarListItem.TypeEncounter:
    case SidebarListItem.TypeFolder:
      if (clickedRow.hasClass("collapsed")) {
        clickedRow.removeClass("collapsed");
        clickedItem.collapsed = false;
      } else {
        clickedRow.addClass("collapsed");
        clickedItem.collapsed = true;
      }
      if (clickedItem.folderPath.startsWith(SidebarListItem.PathMyTokens)) {
        let backingObject = find_my_token_folder(clickedItem.fullPath());
        if (backingObject !== undefined) {
          backingObject.collapsed = clickedItem.collapsed;
          persist_my_tokens();
        }
      }
      if (clickedItem.isTokensPanelItem()) {
        persist_token_folders_remembered_state();
      }
      if (clickedItem.isTypeEncounter()) {
        // we explicitly allowed it to pass through and be treated like a folder so now we need to act on it
        fetch_encounter_monsters_if_necessary(clickedRow, clickedItem);
      }
      break;
    case SidebarListItem.TypeMyToken:
      // display_sidebar_list_item_configuration_modal(clickedItem);
      break;
    case SidebarListItem.TypePC:
      open_player_sheet(clickedItem.sheet);
      break;
    case SidebarListItem.TypeMonster:
      if (clickedItem.monsterData.isReleased === true || clickedItem.monsterData.isHomebrew === true) {
        console.log(`Opening monster with id ${clickedItem.monsterData.id}, url ${clickedItem.monsterData.url}`);
        open_monster_item(clickedItem);
      } else {
        console.log(`User does not have access to monster with id ${clickedItem.monsterData.id}. Opening ${clickedItem.monsterData.url}`);
        window.open(clickedItem.monsterData.url, '_blank');
      }
      break;
    case SidebarListItem.TypeBuiltinToken:
      // display_builtin_token_details_modal(clickedItem);
      break;
    case SidebarListItem.TypeScene:
      // show the preview
      remove_sidebar_flyout();
      let flyout = $(`<div class='sidebar-flyout'></div>`);
      $("body").append(flyout);
      if (clickedItem.isVideo) {
        flyout.append(`<div style="background:lightgray;padding:10px;">This map is a video. We don't currently support previewing videos.</div>`);
      } else {
        flyout.append(`<img class='list-item-image-flyout' src="${clickedItem.image}" alt="scene map preview" />`);
      }
      let height = flyout.height();
      let halfHeight = (height / 2);
      let top = clickEvent.clientY - halfHeight;
      if (top < 30) { // make sure it's always below the main UI buttons
        top = 30;
      } else if (clickEvent.clientY + halfHeight > window.innerHeight - 30) {
        top = window.innerHeight - height - 30;
      }
      flyout.css({
        "top": top
      });
      clickedRow.off("mouseleave").on("mouseleave", function (mouseleaveEvent) {
        $(mouseleaveEvent.currentTarget).off("mouseleave");
        remove_sidebar_flyout();
      });
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
function did_click_add_button(clickEvent) {
  clickEvent.stopPropagation();
  console.log("did_click_add_button", clickEvent);
  let clickedRow = $(clickEvent.target).closest(".list-item-identifier");
  let clickedItem = find_sidebar_list_item(clickedRow);
  console.log("did_click_add_button", clickedItem);
  let hidden = clickEvent.shiftKey || window.TOKEN_SETTINGS["hidden"];
  create_and_place_token(clickedItem, hidden, undefined, undefined, undefined);
  update_pc_token_rows();
}

/**
 * Displays a SidebarPanel as a modal that allows the user to configure the given listItem
 * @param listItem {SidebarListItem} the item to configure
 */
function display_sidebar_list_item_configuration_modal(listItem) {
  switch (listItem?.type) {
    case SidebarListItem.TypeEncounter:
      // TODO: support editing in an iframe on the page?
      window.open(`https://www.dndbeyond.com/encounters/${listItem.encounterId}/edit`, '_blank');
      break;
    case SidebarListItem.TypeFolder:
      if (listItem.folderPath.startsWith(SidebarListItem.PathMyTokens) || listItem.folderPath.startsWith(SidebarListItem.PathScenes)) {
        display_folder_configure_modal(listItem);
      } else {
        console.warn("Only allowed to folders within the My Tokens folder and Scenes");
        return;
      }
      break;
    case SidebarListItem.TypeBuiltinToken:
      display_builtin_token_details_modal(listItem);
      break;
    case SidebarListItem.TypeMyToken:
    case SidebarListItem.TypePC:
    case SidebarListItem.TypeMonster:
      display_token_configuration_modal(listItem);
      break;
    case SidebarListItem.TypeScene:
      let index = window.ScenesHandler.scenes.findIndex(s => s.id === listItem.sceneId);
      if (index >= 0) {
        edit_scene_dialog(index);
      } else {
        console.error("Failed to find scene index for scene with id", listItem.sceneId);
        alert("An unexpected error occurred");
      }
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

  if (listItem.fullPath().startsWith(SidebarListItem.PathMyTokens)) {
    create_mytoken_folder_inside(listItem);
  } else if (listItem.fullPath().startsWith(SidebarListItem.PathScenes)) {
    create_scene_folder_inside(listItem.fullPath());
  } else {
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

  let sidebarId = "folder-configuration-modal";
  let sidebarModal = new SidebarPanel(sidebarId, true);
  let listItemFullPath = listItem.fullPath();
  let container;
  if (listItemFullPath.startsWith(SidebarListItem.PathScenes)) {
    container = scenesPanel.body;
  } else {
    container = tokensPanel.body;
  }

  display_sidebar_modal(sidebarModal);

  sidebarModal.updateHeader(listItem.name, listItem.fullPath(), "Edit or delete this folder.");

  const renameFolder = function(newFolderName, input, event) {
    let oldPath = harvest_full_path(input);
    if (oldPath.endsWith(`/${newFolderName}`)) {
      // It did not change. Nothing to do here.
      return undefined;
    }
    let foundItem = find_sidebar_list_item(input);
    let updatedFullPath = rename_folder(foundItem, newFolderName, true);
    if (updatedFullPath) {
      // the name has been changed. Update the input so we know it has been changed later
      set_full_path(input, updatedFullPath);
      return updatedFullPath;
    } else {
      // there was a naming conflict, and the user has been alerted. select the entire text so they can easily change it
      input.select();
      return false;
    }
  }

  let folderNameInput = $(`<input type="text" title="Folder Name" name="folderName" value="${listItem.name}" />`);
  set_full_path(folderNameInput, listItemFullPath);
  sidebarModal.body.append(build_text_input_wrapper("Folder Name", folderNameInput, undefined, renameFolder));

  // Coming Soon...
  // let folderOptions = {};
  // let folderOptionsButton = build_override_token_options_button(sidebarModal, listItem, undefined, folderOptions, function () {
  //   if (value === true || value === false) {
  //     folderOptions[name] = value;
  //   } else {
  //     delete folderOptions[name];
  //   }
  // }, function () {
  //
  // });
  // sidebarModal.body.append(folderOptionsButton);

  let saveButton = $(`<button class="sidebar-panel-footer-button" style="width:100%;padding:8px;margin-top:8px;margin-left:0px;">Save Folder</button>`);
  saveButton.on("click", function (clickEvent) {
    let nameInput = $(clickEvent.currentTarget).closest(".sidebar-panel-body").find("input[name='folderName']");
    let renameResult = renameFolder(nameInput.val(), nameInput, clickEvent);
    if (renameResult !== false) {
      close_sidebar_modal();
      if (typeof renameResult === "string") {
        expand_all_folders_up_to(renameResult, container);
      }
    }
  });
  sidebarModal.body.append(saveButton);

  let deleteFolderAndMoveChildrenButton = $(`<button class="token-image-modal-remove-all-button" title="Delete this folder">Delete folder and<br />move items up one level</button>`);
  set_full_path(deleteFolderAndMoveChildrenButton, listItemFullPath);
  sidebarModal.footer.append(deleteFolderAndMoveChildrenButton);
  deleteFolderAndMoveChildrenButton.on("click", function(event) {
    let fullPath = harvest_full_path($(event.currentTarget));
    let foundItem = find_sidebar_list_item($(event.currentTarget));
    delete_folder_and_move_children_up_one_level(foundItem);
    close_sidebar_modal();
    expand_all_folders_up_to(fullPath, container);
  });
  let deleteFolderAndChildrenButton = $(`<button class="token-image-modal-remove-all-button" title="Delete this folder and everything in it">Delete folder and<br />everything in it</button>`);
  set_full_path(deleteFolderAndChildrenButton, listItemFullPath);
  sidebarModal.footer.append(deleteFolderAndChildrenButton);
  deleteFolderAndChildrenButton.on("click", function(event) {
    let fullPath = harvest_full_path($(event.currentTarget));
    let foundItem = find_sidebar_list_item($(event.currentTarget));
    delete_folder_and_delete_children(foundItem);
    close_sidebar_modal();
    expand_all_folders_up_to(fullPath, container);
  });

  sidebarModal.body.find(`input[name="folderName"]`).select();
}

function rename_folder(item, newName, alertUser = true) {
  if (!item.isTypeFolder()) {
    console.warn("rename_folder called with an incorrect item type", item);
    if (alertUser !== false) {
      alert("An unexpected error occurred");
    }
    return undefined;
  }

  if (item.folderPath.startsWith(SidebarListItem.PathMyTokens)) {
    return rename_mytoken_folder(item, newName, alertUser);
  } else if (item.folderPath.startsWith(SidebarListItem.PathScenes)) {
    return rename_scene_folder(item, newName, alertUser);
  } else if (alertUser !== false) {
    alert("An unexpected error occurred");
  }
  return undefined;
}

/**
 * deletes the object represented by the given item if that object can be deleted. (pretty much only My Tokens)
 * @param listItem {SidebarListItem} the item to delete
 */
function delete_item(listItem) {
  if (!listItem.canDelete()) {
    console.warn("Not allowed to delete item", listItem);
    return;
  }

  switch (listItem.type) {
    case SidebarListItem.TypeFolder:
      delete_folder_and_delete_children(listItem);
      break;
    case SidebarListItem.TypeMyToken:
      let myToken = find_my_token(listItem.fullPath());
      array_remove_index_by_value(mytokens, myToken);
      did_change_mytokens_items();
      break;
    case SidebarListItem.TypeScene:
      if (confirm(`Are you sure that you want to delete the scene named "${listItem.name}"?`)) {
        window.ScenesHandler.delete_scene(listItem.sceneId);
        did_update_scenes();
      }
      break;
    case SidebarListItem.TypePC:
      console.warn("Not allowed to delete player", listItem);
      break;
    case SidebarListItem.TypeMonster:
      console.warn("Not allowed to delete monster", listItem);
      break;
    case SidebarListItem.TypeBuiltinToken:
      console.warn("Not allowed to delete builtin token", listItem);
      break;
  }
}

/**
 * removes the .collapsed class from all folders leading up to the specified path
 * @param fullPath {string} the path to expand
 * @param container {*|jQuery|HTMLElement} the element that contains the folder structure. EX: tokensPanel.body
 */
function expand_all_folders_up_to(fullPath, container) {
  console.groupCollapsed("expand_all_folders_up_to", fullPath);
  console.debug(`fullPath: ${fullPath}`);
  let folderElement = find_html_row_from_path(fullPath, container);
  console.debug(folderElement);
  let parents = folderElement.parents(".collapsed")
  console.debug(parents);
  parents.removeClass("collapsed");
  console.debug(parents);
  console.groupEnd();
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

  if (listItem.folderPath.startsWith(SidebarListItem.PathMyTokens)) {
    delete_mytokens_within_folder(listItem);
    delete_mytokens_folder(listItem);
    did_change_mytokens_items();
    expand_all_folders_up_to(listItem.folderPath, tokensPanel.body);
  } else if (listItem.folderPath.startsWith(SidebarListItem.PathScenes)) {
    delete_scenes_within_folder(listItem);
    delete_scenes_folder(listItem);
    did_update_scenes();
    expand_all_folders_up_to(listItem.folderPath, scenesPanel.body);
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

  if (listItem.folderPath.startsWith(SidebarListItem.PathMyTokens)) {
    move_mytokens_to_parent_folder(listItem);
    delete_mytokens_folder(listItem);
    did_change_mytokens_items();
    expand_all_folders_up_to(listItem.folderPath, tokensPanel.body);
  } else if (listItem.folderPath.startsWith(SidebarListItem.PathScenes)) {
    move_scenes_to_parent_folder(listItem);
    delete_scenes_folder(listItem);
    did_update_scenes();
    expand_all_folders_up_to(listItem.folderPath, scenesPanel.body);
  } else {
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

function position_flyout_left_of(container, flyout) {
  flyout.css("left", container[0].getBoundingClientRect().left - flyout.width());
}

function position_flyout_right_of(container, flyout) {
  flyout.css("left", container[0].getBoundingClientRect().left + container.width());
}

function remove_sidebar_flyout() {
  $(`.sidebar-flyout`).remove();
}

function list_item_image_flyout(hoverEvent) {
  console.log("list_item_image_flyout", hoverEvent);
  $(`#list-item-image-flyout`).remove(); // never duplicate
  if (hoverEvent.type === "mouseenter") {
    let imgsrc = $(hoverEvent.currentTarget).find("img").attr("src");
    let flyout = $(`<img id='list-item-image-flyout' src="${imgsrc}" alt="image preview" />`);
    flyout.css({
      "top": hoverEvent.clientY - 75,
    });
    $("body").append(flyout);
  }
}

function disable_draggable_change_folder(listItemType) {
  $(".token-row-drag-handle").remove();
  switch (listItemType) {
    case SidebarListItem.TypeMyToken:
      tokensPanel.body.find(".token-row-button").show();
      tokensPanel.body.find(".token-row-button.reorder-button").show();
      tokensPanel.body.find(".reorder-button").removeClass("active");
      tokensPanel.body.find(" > .custom-token-list > .folder").show();
      tokensPanel.body.removeClass("folder");
      tokensPanel.header.find("input[name='token-search']").show();
      tokensPanel.updateHeader("Tokens");
      add_expand_collapse_buttons_to_header(tokensPanel);
      try {
        tokensPanel.body.find(".sidebar-list-item-row").draggable("destroy");
      } catch (e) {} // don't care if it fails, just try
      try {
        tokensPanel.body.find(".sidebar-list-item-row").droppable("destroy");
      } catch (e) {} // don't care if it fails, just try
      break;
    case SidebarListItem.TypeScene:
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
        scenesPanel.body.find(".sidebar-list-item-row").draggable("destroy");
      } catch (e) {} // don't care if it fails, just try
      try {
        scenesPanel.body.find(".sidebar-list-item-row").droppable("destroy");
      } catch (e) {} // don't care if it fails, just try
      break;
  }
}

function add_expand_collapse_buttons_to_header(sidebarPanel) {
  let expandAll = $(`<button class="token-row-button expand-collapse-button" title="Expand All Folders" style=""><span class="material-icons">expand</span></button>`);
  expandAll.on("click", function (clickEvent) {
    $(clickEvent.target).closest(".sidebar-panel-content").find(".sidebar-panel-body .folder:not(.not-collapsible)").removeClass("collapsed");
  });
  let collapseAll = $(`<button class="token-row-button expand-collapse-button" title="Collapse All Folders" style=""><span class="material-icons">vertical_align_center</span></button>`);
  collapseAll.on("click", function (clickEvent) {
    $(clickEvent.target).closest(".sidebar-panel-content").find(".sidebar-panel-body .folder:not(.not-collapsible)").addClass("collapsed");
  });
  let buttonWrapper = $("<div class='expand-collapse-wrapper'></div>");
  sidebarPanel.header.find(".sidebar-panel-header-title").append(buttonWrapper);
  buttonWrapper.append(expandAll);
  buttonWrapper.append(collapseAll);
}

/**
 * allows you to drag items from one folder to another
 * @param listItemType {string} SidebarListItem.TypeMyTokens || SidebarListItem.TypeScene
 */
function enable_draggable_change_folder(listItemType) {

  disable_draggable_change_folder(listItemType);

  const droppableOptions = {
    greedy: true,
    tolerance: "pointer",
    accept: ".draggable-sidebar-item-reorder:not(.drag-cancelled)",
    drop: function (dropEvent, ui) {
      let draggedRow = $(ui.helper);
      let draggedItem = find_sidebar_list_item(draggedRow);
      let droppedFolder = $(dropEvent.target);
      if (droppedFolder.hasClass("sidebar-panel-body")) {
        // they dropped it on the header so find the root folder
        if (listItemType === SidebarListItem.TypeScene) {
          move_item_into_folder(draggedItem, SidebarListItem.PathScenes);
        } else if (listItemType === SidebarListItem.TypeMyToken) {
          move_item_into_folder(draggedItem, SidebarListItem.PathMyTokens);
        } else {
          console.warn("Unable to reorder item by dropping it on the body", listItemType, draggedItem);
        }
      } else {
        let folderItem = find_sidebar_list_item(droppedFolder);
        console.log("enable_draggable_change_folder dropped", draggedItem, folderItem);
        move_item_into_folder(draggedItem, folderItem.fullPath());
      }
    }
  };

  switch (listItemType) {
    case SidebarListItem.TypeMyToken:

      redraw_token_list("", false);

      tokensPanel.body.find(".token-row-gear").hide();
      tokensPanel.body.find(".token-row-button").hide();
      // tokensPanel.body.find(".folder").removeClass("collapsed");
      tokensPanel.body.find(" > .custom-token-list > .folder").hide();
      tokensPanel.body.find(".reorder-button").show();
      tokensPanel.body.find(".reorder-button").addClass("active");
      tokensPanel.header.find("input[name='token-search']").hide();
      tokensPanel.updateHeader("Tokens", "", "Drag items to move them between folders");
      add_expand_collapse_buttons_to_header(tokensPanel);

      let myTokensRootItem = tokens_rootfolders.find(i => i.name === SidebarListItem.NameMyTokens);
      let myTokensRootFolder = find_html_row(myTokensRootItem, tokensPanel.body);
      // make sure we expand all folders that can be dropped on
      myTokensRootFolder.show();
      myTokensRootFolder.removeClass("collapsed");
      // myTokensRootFolder.find(".folder").removeClass("collapsed");

      // TODO: disable the draggable that was added here enable_draggable_token_creation
      // tokensPanel.body.find(".sidebar-list-item-row").draggable("destroy");
      tokensPanel.body.find(".sidebar-list-item-row").draggable({
        container: tokensPanel.body,
        opacity: 0.7,
        revert: true,
        scroll: false, // jQuery UI has a bug where scrolling changes the offset of the helper. If we can figure out how to work around that bug, then we can change this to true
        // axis: "y",  // this helps if we set scroll: true
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
            enable_draggable_change_folder(SidebarListItem.TypeMyToken);
          }
        }
      });

      myTokensRootFolder.droppable(droppableOptions); // allow dropping on root MyTokens folder
      myTokensRootFolder.find(".folder").droppable(droppableOptions);  // allow dropping on folders within MyTokens folder
      tokensPanel.body.addClass("folder").addClass("not-collapsible");  // allow dropping on folders within MyTokens folder
      tokensPanel.body.droppable(droppableOptions);  // allow dropping on folders within MyTokens folder

      break;
    case SidebarListItem.TypeScene:
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
            enable_draggable_change_folder(SidebarListItem.TypeScene);
          }
        }
      });

      scenesPanel.container.find(".folder").droppable(droppableOptions);

      break;
    default:
      console.warn("enable_draggable_change_folder was called with an invalid type");
      return;
  }

}

function move_item_into_folder(listItem, folderPath) {
  if (listItem.isTypeMyToken()) {
    move_mytoken_to_folder(listItem, folderPath);
    persist_my_tokens();
    rebuild_token_items_list();
    enable_draggable_change_folder(SidebarListItem.TypeMyToken);
  } else if (listItem.isTypeScene()) {
    move_scene_to_folder(listItem, folderPath);
    did_update_scenes();
    enable_draggable_change_folder(SidebarListItem.TypeScene);
  } else if (listItem.isTypeFolder() && listItem.folderPath.startsWith(SidebarListItem.PathMyTokens)) {
    move_mytokens_folder(listItem, folderPath);
    persist_my_tokens();
    rebuild_token_items_list();
    enable_draggable_change_folder(SidebarListItem.TypeMyToken);
  } else if (listItem.isTypeFolder() && listItem.folderPath.startsWith(SidebarListItem.PathScenes)) {
    move_scenes_folder(listItem, folderPath);
    did_update_scenes();
    enable_draggable_change_folder(SidebarListItem.TypeScene);
  } else {
    console.warn("move_item_into_folder was called with invalid item type", listItem)
  }
}
