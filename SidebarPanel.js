
function init_sidebar_tabs() {
  // gamelog doesn't use it yet, maybe never
  // players doesn't use it yet
  // monsters doesn't use it yet, maybe never
  // scenesPanel = SidebarPanel("#scenes-panel", false);
  
  tokensPanel = new SidebarPanel("tokens-panel", false);
  $(".sidebar__pane-content").append(tokensPanel.build());
  tokensPanel.hide();
  
  soundsPanel = new SidebarPanel("sounds-panel", false);
  $(".sidebar__pane-content").append(soundsPanel.build());
  soundsPanel.hide();

  // sounds doesn't use it yet
  
  journalPanel = new SidebarPanel("journal-panel", false);
  $(".sidebar__pane-content").append(journalPanel.build());
  journalPanel.hide();  

  // settings doesn't use it yet
  settingsPanel = new SidebarPanel("settings-panel", false);
  $(".sidebar__pane-content").append(settingsPanel.build());
  settingsPanel.hide();


}

function sidebar_modal_is_open() {
	return $("#VTTWRAPPER .sidebar-modal").length > 0;
}

function close_sidebar_modal() {
	$("#VTTWRAPPER .sidebar-modal").remove();
}

function display_sidebar_modal(sidebarPanel) {
  $("#VTTWRAPPER").append(sidebarPanel.build());
}

function current_modal() {
  $("#VTTWRAPPER .sidebar-modal");
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
      let closeButton = $(`<button class="ddbeb-modal__close-button qa-modal_close" title="Close Modal"><svg class="" xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><g transform="rotate(-45 50 50)"><rect x="0" y="45" width="100" height="10"></rect></g><g transform="rotate(45 50 50)"><rect x="0" y="45" width="100" height="10"></rect></g></svg></button>`); 
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
    let sidebarContent = $(".sidebar__pane-content");
    let width = parseInt(sidebarContent.width());
    let top = parseInt(sidebarContent.position().top) + 10;
    let height = parseInt(sidebarContent.height());
    return $(`
      <div class="sidebar-modal" style="width:${width}px;top:${top}px;right:0px;left:auto;height:${height}px;position:fixed;">
        <div class="sidebar-modal-background"></div>
      </div>
    `);
  }

  // imageUrlEntered is a function that takes a string in the form of a url
  build_image_url_input(titleText, imageUrlEntered) {

    /* This is the general layout of what we're building. A label above an input, both of which are to the left of an "Add" button that spans the entire height
      |--------------------|
      | Label     |  Add   |
      | Input     | Button |
      |--------------------|
    */

    if (typeof imageUrlEntered !== 'function') {
      imageUrlEntered = function(newImageUrl) {
        console.warn(`Failed to provide a valid function to handle ${newImageUrl}`);
      };
    }
    
    let inputLabel = $(`<div class="token-image-modal-footer-title">${titleText}</div>`)
    let urlInput = $(`<input title="${titleText}" placeholder="https://..." name="addCustomImage" type="text" />`);
    urlInput.on('keyup', function(event) {
      let imageUrl = event.target.value;
      if (event.key == "Enter" && imageUrl != undefined && imageUrl.length > 0) {
        if(imageUrl.startsWith("data:")){
          alert("You cannot use urls starting with data:");
          return;
        }	
        imageUrlEntered(imageUrl);
      }
    });
  
    let addButton = $(`<button class="sidebar-panel-footer-button token-image-modal-add-button">Add</button>`);
    addButton.click(function(event) {
      let imageUrl = $(event.target).closest(".token-image-modal-url-label-add-wrapper").find(`input[name="addCustomImage"]`)[0].value;
      if (imageUrl != undefined && imageUrl.length > 0) {
        if(imageUrl.startsWith("data:")){
          alert("You cannot use urls starting with data:");
          return;
        }	
        imageUrlEntered(imageUrl);
      }
    });

    
    let labelAndUrlWrapper = $(`<div class="token-image-modal-url-label-wrapper"></div>`); // this is to keep the label and input stacked vertically
    labelAndUrlWrapper.append(inputLabel);                  // label above input
    labelAndUrlWrapper.append(urlInput);                    // input below label
    
    let addButtonAndLabelUrlWrapper = $(`<div class="token-image-modal-url-label-add-wrapper"></div>`); // this is to keep the add button on the right side of the label and input
    addButtonAndLabelUrlWrapper.append(labelAndUrlWrapper); // label/input on the left
    addButtonAndLabelUrlWrapper.append(addButton);          // add button on the right
    
    return addButtonAndLabelUrlWrapper;
  }

  //#endregion UI Construction
}
