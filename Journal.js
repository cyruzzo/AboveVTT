/**
 * JournalManager (WIP)
 * Is the tab on the sidebar that allows you to write notes
 		* Requires journalPanel = new Sidebar();
		* All of its DOM elements attach to journalPanel tree 
 * Also holds notes attached to tokens
 * 
 */

class JournalManager{
	
	
	constructor(gameid){
		this.gameid=gameid;
		
		if (window.DM && (localStorage.getItem('Journal' + gameid) != null)) {
			this.notes = $.parseJSON(localStorage.getItem('Journal' + gameid));
		}
		else{
			this.notes={};
		}
		if (window.DM && (localStorage.getItem('JournalChapters' + gameid) != null)) {
			this.chapters = $.parseJSON(localStorage.getItem('JournalChapters' + gameid));
		}
		else{
			this.chapters=[];
		}
	}
	
	persist(){
		if(window.DM){
			localStorage.setItem('Journal' + this.gameid, JSON.stringify(this.notes));
			localStorage.setItem('JournalChapters' + this.gameid, JSON.stringify(this.chapters));
		}
	}
	
	
	
	sync(){
		let self=this;
		if(window.DM){
			window.MB.sendMessage('custom/myVTT/JournalChapters',{
				chapters: self.chapters
				});
			
			for(let i in self.notes){
				if(self.notes[i].player)
					window.MB.sendMessage('custom/myVTT/note',{
						id: i,
						note:self.notes[i]
					});
			}
		}
	}
	
	build_journal(){
		let self=this;

		journalPanel.body.empty();
		if (journalPanel.header.find(".panel-warning").length == 0) {
			journalPanel.header.append("<div class='panel-warning'>WARNING/WORKINPROGRESS THE JOURNAL IS CURRENTLY STORED IN YOUR BROWSER STORAGE. DON'T DELETE BROWSER HISTORY</div>");
		}
		
		const row_add_chapter=$("<div class='row-add-chapter'></div>");
		const input_add_chapter=$("<input type='text' placeholder='New chapter name' class='input-add-chapter'>");
		
		input_add_chapter.on('keypress',function(e){
			if (e.which==13 && input_add_chapter.val() !== ""){
				self.chapters.push({
					title: input_add_chapter.val(),
					collapsed: false,
					notes: [],
				});
				self.persist();
				self.build_journal();
				window.MB.sendMessage('custom/myVTT/JournalChapters',{
					chapters: self.chapters
				});
				$(this).val('');
			}
		});

		const btn_add_chapter=$("<button id='btn_add_chapter'>Add Chapter</button>");

		btn_add_chapter.click(function() {
			if (input_add_chapter.val() == "") {
				
				return;
			}

			self.chapters.push({
				title: input_add_chapter.val(),
				collapsed: false,
				notes: [],
			});
			self.persist();
			self.build_journal();
			window.MB.sendMessage('custom/myVTT/JournalChapters',{
				chapters: self.chapters
			});
		});
		
		if(window.DM) {
			row_add_chapter.append(input_add_chapter);
			row_add_chapter.append(btn_add_chapter);
			journalPanel.body.append(row_add_chapter);
		}
		
		// Create a chapter list that sorts journal-chapters with drag and drop
		const chapter_list=$(`<ul class='folder-item-list'></ul>`);
		chapter_list.sortable({
			items: '.folder',
			update: function(event, ui) {
				// Find the old index of the dragged element
				const old_index = self.chapters.findIndex(function(chapter) {
					return chapter.title == ui.item.find(".journal-chapter-title").text();
				});
				// Find the new index of the dragged element
				const new_index = ui.item.index();
				// Move the dragged element to the new index
				self.chapters.splice(new_index, 0, self.chapters.splice(old_index, 1)[0]);
				self.persist();
				window.MB.sendMessage('custom/myVTT/JournalChapters',{
					chapters: self.chapters
				});
				self.build_journal();
			}
		});

		journalPanel.body.append(chapter_list);

		for(let i=0; i<self.chapters.length;i++){
			console.log('xxx');
			// A chapter title can be clicked to expand/collapse the chapter notes
			let section_chapter=$(`
				<div data-index='${i}' class='sidebar-list-item-row list-item-identifier folder ${self.chapters[i]?.collapsed ? 'collapsed' : ''}'></div>
			`);

			// Create a sortale list of notes
			const note_list=$("<ul class='note-list'></ul>");

			var sender;
			// Make the section_chapter sortable
			section_chapter.sortable({
				connectWith: ".folder",
				items: '.sidebar-list-item-row',
		        receive: function(event, ui) {
		            // Called only in case B (with !!sender == true)
		            sender = ui.sender;
		           	let sender_index = sender.attr('data-index');
		           	let new_folder_index = ui.item.parent().closest('.folder').attr('data-index');
		          	const old_index = self.chapters[sender_index].notes.findIndex(function(note) {
						return note == ui.item.attr('data-id');
					});
					// Find the new index of the dragged element
					const new_index = ui.item.index();
					// Move the dragged element to the new index
					self.chapters[new_folder_index].notes.splice(new_index, 0, self.chapters[sender_index].notes.splice(old_index, 1)[0]);
					self.persist();
					window.MB.sendMessage('custom/myVTT/JournalChapters',{
						chapters: self.chapters
					});
					self.build_journal();
		            event.preventDefault();
		        },
				update: function(event, ui) {
					// Find the old index of the dragged element
					if(sender==undefined){
						const old_index = self.chapters[i].notes.findIndex(function(note) {
							return note == ui.item.attr('data-id')
						});
						// Find the new index of the dragged element
						const new_index = ui.item.index();
						// Move the dragged element to the new index
						self.chapters[i].notes.splice(new_index, 0, self.chapters[i].notes.splice(old_index, 1)[0]);
						self.persist();
						window.MB.sendMessage('custom/myVTT/JournalChapters',{
							chapters: self.chapters
						});
						self.build_journal();
					}

				}
			});
			let folderIcon = $(`<div class="sidebar-list-item-row-img"><img src="${window.EXTENSION_PATH}assets/folder.svg" class="token-image"></div>`)
				
			let row_chapter_title=$("<div class='row-chapter'></div>");
			let btn_edit_chapter=$(`
				<button style='height: 27px' class='token-row-button'>
					<img  src='${window.EXTENSION_PATH}assets/icons/rename-icon.svg'>
				</button>
			`);

			btn_edit_chapter.click(function(){
				// Convert the chapter title to an input field and focus it
				let input_chapter_title=$(`
					<input type='text' class='input-add-chapter' value='${self.chapters[i].title}'>
				`);
				
				input_chapter_title.keypress(function(e){
					
					if (e.which == 13 && input_chapter_title.val() !== "") {
						self.chapters[i].title = input_chapter_title.val();
						window.MB.sendMessage('custom/myVTT/JournalChapters',{
							chapters: self.chapters
						});
						self.persist();
						self.build_journal();
					}

					// If the user presses escape, cancel the edit
					if (e.which == 27) {
						self.build_journal();
					}
				});

				input_chapter_title.blur(function(){		
					let e = $.Event('keypress');
				    e.which = 13;
				    input_chapter_title.trigger(e);
				});

				row_chapter_title.empty();
				row_chapter_title.append(btn_edit_chapter);
				row_chapter_title.append(input_chapter_title);
				input_chapter_title.focus();

				// Convert the edit button to a save button
				btn_edit_chapter.empty();
				btn_edit_chapter.append(`
					<img src='${window.EXTENSION_PATH}assets/icons/save.svg'>
				`);
				btn_edit_chapter.css('z-index', '5');
			});
			
			let chapter_title=$("<div class='journal-chapter-title'/>");
			chapter_title.text(self.chapters[i].title);

			// If the user clicks the chapter title, expand/collapse the chapter notes
			chapter_title.click(function(){
				section_chapter.toggleClass('collapsed');
				self.chapters[i].collapsed = !self.chapters[i].collapsed;
				self.persist();
				window.MB.sendMessage('custom/myVTT/JournalChapters',{
					chapters: self.chapters
				});
			});
			
			let btn_del_chapter=$("<button class='btn-chapter-icon'><img height=10 src='"+window.EXTENSION_PATH+"assets/icons/delete.svg'></button>");
			
			btn_del_chapter.click(function(){
				// TODO: Make this better but default dialog is good enough for now
				if(confirm("Delete this chapter and all the contained notes?")){

					for(let k=0;k<self.chapters[i].notes.length;k++){
						let nid=self.chapters[i].notes[k];
						delete self.notes[nid];
					}

					self.chapters.splice(i,1);
					window.MB.sendMessage('custom/myVTT/JournalChapters',{
						chapters: self.chapters
					});
					self.persist();
					self.build_journal();
				}
			});

			let add_note_btn=$("<button class='token-row-button' ><img style='height: 20px' src='"+window.EXTENSION_PATH+"assets/icons/add_note.svg'></button>");

			add_note_btn.click(function(){
				let new_noteid=uuid();

				const input_add_note=$("<input type='text' class='input-add-chapter' placeholder='New note title'>");
				let note_added = false;
				input_add_note.keydown(function(e){
					if(e.keyCode == 13 && input_add_note.val() !== ""){
						note_added = true;
						let new_note_title=input_add_note.val();
						self.notes[new_noteid]={
							title: new_note_title,
							text: "",
							player: false,
							plain: ""
						};
						self.chapters[i].notes.push(new_noteid);
						window.MB.sendMessage('custom/myVTT/JournalChapters',{
							chapters: self.chapters
						});
						self.edit_note(new_noteid);
						self.persist();
						self.build_journal();
					}
					if(e.keyCode==27){
						self.build_journal();
					}
				});

				input_add_note.blur(function(event){	
					if(!note_added)	{
						let e = $.Event('keydown');
					    e.keyCode = 13;
					    input_add_note.trigger(e);
					}
					
				});

				row_notes_entry.empty();

				const save_note_btn=$("<button class='btn-chapter-icon'><img src='"+window.EXTENSION_PATH+"assets/icons/save.svg'></button>");

				
				row_notes_entry.append(save_note_btn);
				row_notes_entry.append(input_add_note);

				input_add_note.focus();
			});
				row_chapter_title.append(folderIcon);	
				row_chapter_title.append(chapter_title);
				if(window.DM) {
					row_chapter_title.append(add_note_btn);
					row_chapter_title.append(btn_edit_chapter);
					row_chapter_title.append(btn_del_chapter);	
				}	
				section_chapter.append(row_chapter_title);
				chapter_list.append(section_chapter);
				journalPanel.body.append(chapter_list);
		

			for(let n=0; n<self.chapters[i].notes.length;n++){
				
				let note_id=self.chapters[i].notes[n];
				
				if(! (note_id in self.notes))
					continue;
					
				if( (! window.DM) && (! self.notes[note_id].player) )
					continue;
				
				let entry=$(`<div class='sidebar-list-item-row-item sidebar-list-item-row' data-id='${note_id}'></div>`);
				let entry_title=$(`<div class='sidebar-list-item-row-details sidebar-list-item-row-details-title'></div>`);

				entry_title.text(self.notes[note_id].title);
				entry_title.click(function(){
					self.display_note(note_id);
				});

				let rename_btn = $("<button class='token-row-button'><img src='"+window.EXTENSION_PATH+"assets/icons/rename-icon.svg'></button>");
				
				rename_btn.click(function(){
					//Convert the note title to an input field and focus it
					const input_note_title=$(`
						<input type='text' class='input-add-chapter' value='${self.notes[note_id].title}'>
					`);

					input_note_title.keypress(function(e){
						if (e.which == 13 && input_note_title.val() !== "") {
							self.notes[note_id].title = input_note_title.val();
							window.MB.sendMessage('custom/myVTT/JournalNotes',{
								notes: self.notes
							});
							self.persist();
							self.build_journal();
						}

						// If the user presses escape, cancel the edit
						if (e.which == 27) {
							self.build_journal();
						}
					});

					input_note_title.blur(function(){		
						let e = $.Event('keypress');
					    e.which = 13;
					    input_note_title.trigger(e);
					});

					entry_title.empty();
					
					entry_title.append(input_note_title);
					entry_title.append(edit_btn);

					input_note_title.focus();

					// Convert the edit button to a save button
					rename_btn.empty();
					rename_btn.append(`
						<img src='${window.EXTENSION_PATH}assets/icons/save.svg'>
					`);
				});



				let edit_btn=$("<button class='token-row-button'><img src='"+window.EXTENSION_PATH+"assets/conditons/note.svg'></button>");
				edit_btn.click(function(){
					window.JOURNAL.edit_note(note_id);	
				});
				let note_index=n;
				let delete_btn=$("<button class='btn-chapter-icon delete-journal-chapter'><img src='"+window.EXTENSION_PATH+"assets/icons/delete.svg'></button>");
				delete_btn.click(function(){
					if(confirm("Delete this note?")){
						console.log("deleting note_index"+note_index);
						self.chapters[i].notes.splice(note_index,1);
						delete self.notes[note_id];
						self.build_journal();
						self.persist();
						window.MB.sendMessage('custom/myVTT/JournalChapters', {
							chapters: self.chapters
						});
					}
				});
								

				entry.append(entry_title);

				if(window.DM)
					entry.append(edit_btn);
					entry.append(rename_btn);
					entry.append(delete_btn);

				note_list.append(entry);
			}

			// Create an add note button, when clicked, insert an input field above the button.
			// When the user presses enter, create a new note and insert it into the chapter.
			// If the user presses escape, cancel the edit.
			// If the user clicks outside the input field, cancel the edit.
			const row_notes_entry = $("<div class='row-notes-entry'/>");

			

			if(window.DM){
				
				let entry=$("<div class='journal-note-entry'></div>");
				entry.append(row_notes_entry);
				note_list.append(entry);
			}
			section_chapter.append(note_list);
		}	

		if(!window.journalsortable)
			$('#journal-panel .ui-sortable').sortable('disable'); 

		let sort_button = $(`<button class="token-row-button reorder-button" title="Reorder Journal"><span class="material-icons">reorder</span></button>`);

		sort_button.on('click', function(){
			if($('#journal-panel .ui-sortable-disabled').length > 0){
				$('#journal-panel .ui-sortable').sortable('enable'); 
				window.journalsortable = true;
			}
			else{
				$('#journal-panel .ui-sortable').sortable('disable'); 
				window.journalsortable = false;
				
			}
		});
		if(window.DM)
			$('#journal-panel .sidebar-panel-body').prepend(sort_button);
	}
	
	
	display_note(id){
		let self=this;
		let note=$("<div class='note'></div>");
		
		note.attr('title',self.notes[id].title);
		if(window.DM){
			let visibility_container=$("<div class='visibility-container'/>");
			let visibility_toggle=$("<input type='checkbox'>");
			
			visibility_toggle.prop("checked",self.notes[id].player);
				
			visibility_toggle.change(function(){
				window.JOURNAL.note_visibility(id,visibility_toggle.is(":checked"));
			});
			visibility_container.append(visibility_toggle);
			visibility_container.append(" visible to players");
			
			let popup_btn=$("<button>Force Open by Players</button>");
			
			popup_btn.click(function(){
				window.MB.sendMessage('custom/myVTT/note',{
						id: id,
						note:self.notes[id],
						popup: true,
					});
			});
			
			visibility_container.append(popup_btn);
			
			let edit_btn=$("<button>Edit</button>");
			edit_btn.click(function(){
				note.remove();
				window.JOURNAL.edit_note(id);
			});
			
			visibility_container.append(edit_btn);
			
			note.append(visibility_container);
			
		}
		let note_text=$("<div class='note-text'/>");
		note_text.append(DOMPurify.sanitize(self.notes[id].text,{ADD_TAGS: ['img','div','p', 'b', 'button', 'span', 'style', 'path', 'svg','iframe','a','video','ul','ol','li'], ADD_ATTR: ['allowfullscreen', 'allow', 'scrolling','src','frameborder','width','height']}));
		note.append(note_text);
		note.find("a").attr("target","_blank");
		note.dialog({
			draggable: true,
			width: 800,
			height: 600,
			position:{
			   my: "center",
			   at: "center-200",
			   of: window
			},
			close: function( event, ui ) {
				$(this).remove();
				}
			});	
		$("[role='dialog']").draggable({
			containment: "#windowContainment",
			start: function () {
				$("#resizeDragMon").append($('<div class="iframeResizeCover"></div>'));			
				$("#sheet").append($('<div class="iframeResizeCover"></div>'));
			},
			stop: function () {
				$('.iframeResizeCover').remove();			
			}
		});
		$("[role='dialog']").resizable({
			start: function () {
				$("#resizeDragMon").append($('<div class="iframeResizeCover"></div>'));			
				$("#sheet").append($('<div class="iframeResizeCover"></div>'));
			},
			stop: function () {
				$('.iframeResizeCover').remove();			
			}
		});
		if(!window.DM)
			$("[role='dialog']").css("height", "calc(100vh - 80px)")	
		note.parent().mousedown(function() {
			frame_z_index_when_click($(this));
		});		
		let btn_popout=$(`<div class="popout-button journal-button"><svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 0 24 24" width="18px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"></path><path d="M18 19H6c-.55 0-1-.45-1-1V6c0-.55.45-1 1-1h5c.55 0 1-.45 1-1s-.45-1-1-1H5c-1.11 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-6c0-.55-.45-1-1-1s-1 .45-1 1v5c0 .55-.45 1-1 1zM14 4c0 .55.45 1 1 1h2.59l-9.13 9.13c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L19 6.41V9c0 .55.45 1 1 1s1-.45 1-1V4c0-.55-.45-1-1-1h-5c-.55 0-1 .45-1 1z"></path></svg></div>"`);
		note.parent().append(btn_popout);
		btn_popout.click(function(){	
			let uiId = $(this).siblings(".note").attr("id");
			let journal_text = $(`#${uiId}.note .note-text`)
			popoutWindow(self.notes[id].title, note, journal_text.width(), journal_text.height());
			removeFromPopoutWindow(self.notes[id].title, ".visibility-container");
			removeFromPopoutWindow(self.notes[id].title, ".ui-resizable-handle");
			$(window.childWindows[self.notes[id].title].document).find(".note").attr("style", "overflow:visible; max-height: none !important; height: auto; min-height: 100%;");
			$(this).siblings(".ui-dialog-titlebar").children(".ui-dialog-titlebar-close").click();
		});
	}
	
	note_visibility(id,visibility){
		this.notes[id].player=visibility;
		window.MB.sendMessage("custom/myVTT/note", {
			note: this.notes[id],
			id: id
		})
		this.persist();
	}
	
	close_all_notes(){
		$("textarea[data-note-id]").each(function(){
			let taid=$(this).attr('id')
			tinyMCE.get(taid).execCommand('mceSave');
			$(this).closest(".note").dialog("close");
		});
	}

	edit_note(id){
		this.close_all_notes();
		let self=this;
		
		let note=$("<div class='note'></div>");
		let form=$("<form></form>");
		let tmp=uuid();
		let ta=$("<textarea id='"+tmp+"' name='ajax_text' class='j-wysiwyg-editor text-editor' data-note-id='"+id+"'></textarea>");
		ta.css('width','100%');
		ta.css('height','100%');
		form.append(ta);
		
		note.append(form);
		
		if(self.notes[id]){
			ta.text(self.notes[id].text);
		}
		
		note.attr('title',self.notes[id].title);
		
		$("#site-main").append(note);
		note.dialog({
			draggable: true,
			width: 800,
			height: 600,
			position: {
			   my: "center",
			   at: "center-200",
			   of: window
			},
			open: function(event, ui){
				let btn_view=$(`<button class='journal-view-button journal-button'><img height="10" src="chrome-extension://kkemdlbhcdjeammninnkkaclnflbodmj/assets/icons/view.svg"></button>"`);
				$(this).siblings('.ui-dialog-titlebar').prepend(btn_view);
				btn_view.click(function(){	
					self.close_all_notes();
					self.display_note(id);
				});
			},
			close: function( event, ui ) {
				// console.log(event);
				let taid=$(event.target).find("textarea").attr('id');
				tinyMCE.get(taid).execCommand('mceSave');
				$(this).remove();
			}
		});

		$("[role='dialog']").draggable({
			containment: "#windowContainment",
			start: function () {
				$("#resizeDragMon").append($('<div class="iframeResizeCover"></div>'));			
				$("#sheet").append($('<div class="iframeResizeCover"></div>'));
			},
			stop: function () {
				$('.iframeResizeCover').remove();			
			}
		});
		$("[role='dialog']").resizable({
			start: function () {
				$("#resizeDragMon").append($('<div class="iframeResizeCover"></div>'));			
				$("#sheet").append($('<div class="iframeResizeCover"></div>'));
			},
			stop: function () {
				$('.iframeResizeCover').remove();			
			}
		});
		note.parent().mousedown(function() {
			frame_z_index_when_click($(this));
		});
		
		
		tinyMCE.init({
			selector: '#' + tmp,
			menubar: false,
			style_formats:  [
				 { title: 'Headers', items: [
			      { title: 'h1', block: 'h1' },
			      { title: 'h2', block: 'h2' },
			      { title: 'h3', block: 'h3' },
			      { title: 'h4', block: 'h4' },
			      { title: 'h5', block: 'h5' },
			      { title: 'h6', block: 'h6' }
			    ] },
				{ title: 'Containers', items: [
			      { title: 'Quote Box', block: 'div', wrapper: true, classes: 'text--quote-box'},
			      { title: 'Rules Text', block: 'div', wrapper: true, classes: 'rules-text' },
			      { title: 'Ripped Paper', block: 'div', wrapper: true, classes: 'block-torn-paper' },
			      { title: 'Read Aloud Text', block: 'div', wrapper: true, classes: 'read-aloud-text' },
			      { title: 'Stat Block Paper', block: 'div', wrapper: true, classes: 'Basic-Text-Frame stat-block-background' },
			    ] }
			],
			plugins: 'save,hr,image,link,lists,media,paste,tabfocus,textcolor,colorpicker,autoresize, code, table',
			toolbar1: 'undo styleselect | hr | bold italic underline strikethrough | alignleft aligncenter alignright justify| outdent indent | bullist numlist | forecolor backcolor | fontsizeselect | link unlink | image media | table | code',
			image_class_list: [
				{title: 'None', value: ''},
				{title: 'Magnify', value: 'magnify'},
			],
			external_plugins: {
				'image': "/content/1-0-1688-0/js/tinymce/tiny_mce/plugins/image/plugin.min.js",
			},
			relative_urls : false,
			remove_script_host : false,
			convert_urls : true,
			media_alt_source: false,
			media_poster: false,
			statusbar: false,
			content_style: `
				/* START LRKP CSS fixes */

				/* COMPENDIUM IMPROVEMENTS */
				/* START - Default text color */

				:root {
					--theme-page-fg-color: #242527;
				}
				/* END - Default text color */
				*{
					font-family: Roboto, Helvetica, sans-serif;
				}

				.Basic-Text-Frame {
				    clear: both;
				    border: 1px solid #d4d0ce;
				    background: white;
				    padding: 15px
				}

				@media(min-width: 768px) {
				    .Basic-Text-Frame {
				        -webkit-column-count:2;
				        column-count: 2
				    }
				}

				.Basic-Text-Frame-2 {
				    border: 1px solid #d4d0ce;
				    background: white;
				    padding: 15px
				}

				@media(min-width: 768px) {
				    .Basic-Text-Frame-2 {
				        float:right;
				        margin: 30px 0 15px 20px;
				        width: 410px
				    }
				}

				.Basic-Text-Frame-2 .compendium-image-center {
				    margin-bottom: 20px;
				    display: block
				}

				.Basic-Text-Frame-3 {
				    border: 1px solid #d4d0ce;
				    background: white;
				    padding: 15px
				}

				@media(min-width: 768px) {
				    .Basic-Text-Frame-3 {
				        float:left;
				        margin: 30px 20px 15px 0;
				        width: 410px
				    }
				}

				.Basic-Text-Frame-3 .compendium-image-center {
				    margin-bottom: 20px;
				    display: block
				}

				.Basic-Text-Frame,.Basic-Text-Frame-2,.Basic-Text-Frame-3 {
				    position: relative;
				    box-shadow: 0 0 5px #979AA4
				}

				.Basic-Text-Frame::before,.Basic-Text-Frame::after,.Basic-Text-Frame-2::before,.Basic-Text-Frame-2::after,.Basic-Text-Frame-3::before,.Basic-Text-Frame-3::after {
				    content: '';
				    background-image: url("../images/MMStatBar_lrg.jpg");
				    background-size: 100% 100%;
				    background-position: center;
				    height: 4px;
				    display: inline-block;
				    position: absolute
				}

				.Basic-Text-Frame::before,.Basic-Text-Frame-2::before,.Basic-Text-Frame-3::before {
				    left: -3px;
				    top: -3px;
				    right: -3px
				}

				.Basic-Text-Frame::after,.Basic-Text-Frame-2::after,.Basic-Text-Frame-3::after {
				    left: -3px;
				    bottom: -3px;
				    right: -3px
				}

				.Stat-Block-Styles_Stat-Block-Title {
				    font-size: 18px!important;
				    font-family: "Roboto Condensed",Roboto,Helvetica,sans-serif;
				    text-transform: uppercase;
				    font-weight: bold;
				    line-height: 1.4!important;
				    margin-bottom: 0!important;
				    display: inline;
				    margin-right: 8px
				}

				.Stat-Block-Styles_Stat-Block-Metadata {
				    font-style: italic;
				    font-size: 14px!important;
				    line-height: 1.4!important;
				    margin-bottom: 8px!important
				}

				.Stat-Block-Styles_Stat-Block-Metadata::after {
				    content: "";
				    display: block;
				    border-bottom: 2px solid #bc0f0f;
				    padding-top: 5px
				}

				.Stat-Block-Styles_Stat-Block-Bar-Object-Space,.Stat-Block-Styles_Stat-Block-Bar-Object-Space-Last {
				    display: none
				}

				.Stat-Block-Styles_Stat-Block-Data,.Stat-Block-Styles_Stat-Block-Data-Last,.Stat-Block-Styles_Stat-Block-Body,.Stat-Block-Styles_Stat-Block-Hanging,.Stat-Block-Styles_Stat-Block-Hanging-Last,.Stat-Block-Styles_Stat-Block-Body-Last--apply-before-heading- {
				    font-size: 14px!important;
				    line-height: 1.4!important;
				    margin-bottom: 10px!important
				}

				.Stat-Block-Styles_Stat-Block-Heading,.Stat-Block-Styles_Stat-Block-Heading--after-last-bar- {
				    font-size: 16px!important;
				    font-weight: bold;
				    font-family: "Roboto Condensed",Roboto,Helvetica,sans-serif
				}

				.Stat-Block-Styles_Stat-Block-Heading::after,.Stat-Block-Styles_Stat-Block-Heading--after-last-bar-::after {
				    content: "";
				    display: block;
				    border-bottom: 1px solid #bc0f0f;
				    padding-top: 2px
				}

				.Stat-Block-Styles_Stat-Block-Data-Last {
				    border-bottom: 2px solid #bc0f0f;
				    padding-bottom: 10px
				}

				.stat-block-ability-scores {
				    display: -webkit-flex;
				    display: -ms-flexbox;
				    display: flex;
				    -webkit-flex-wrap: wrap;
				    -ms-flex-wrap: wrap;
				    flex-wrap: wrap;
				    border-top: 2px solid #bc0f0f;
				    border-bottom: 2px solid #bc0f0f;
				    margin: 10px 0
				}

				.stat-block-ability-scores-stat {
				    width: 33.33333%;
				    padding: 10px 5px;
				    text-align: center
				}
				/* START - New quote box implementation */
				.text--quote-box {
				    display: block !important;
				    background-color: var(--compendium-quote-box-color, #FAF8EC) !important; /*Fallback: if the variable isn't declared, it'll default to pale yellow*/
				    padding: 20px 25px 15px 25px !important;
				    position: relative !important;
				    width: auto !important;
				    display: flex !important;
				    flex-direction: column !important;
				    overflow: visible !important;
				    border-radius: 0 !important;
				    border-left: 1px solid !important;
				    border-right: 1px solid !important;
				    border-color: var(--compendium-quote-box-border, #620000) !important; /*Fallback: if the variable isn't declared, it'll default to dark red*/
				    border-top: 0;
				    border-bottom: 0;
				    color: var(--theme-page-fg-color, #242527) !important;
				    margin: 40px 20px !important;
				    line-height: 1.6 !important;
				    font-size: 14px !important;
				}
				.text--quote-box::before {
				    top: -4px !important;
				}
				.text--quote-box::before, .text--quote-box::after {
				    content: '';
				    border-radius: 50%;
				    background-position: left !important;
				    background-size: contain !important;
				    background-repeat: no-repeat !important;
				    height: 8px !important;
				    width: 8px !important;
				    left: -4px !important;
				    position: absolute !important;
				    background-color: var(--compendium-quote-box-corner, #620000);
				}
				 .text--quote-box::after {
				    bottom: -4px !important;
				}
				 .text--quote-box p:first-of-type::before {
				    top: -4px !important;
				}
				 .text--quote-box p:first-of-type::before,  .text--quote-box p:last-of-type::after {
				    content: '';
				    border-radius: 50%;
				    background-position: right !important;
				    background-size: contain !important;
				    background-repeat: no-repeat !important;
				    height: 8px !important;
				    width: 8px !important;
				    right: -4px !important;
				    position: absolute !important;
				    background-color: var(--compendium-quote-box-corner, #620000);
				}
				 .text--quote-box p:last-of-type::after {
				    bottom: -4px !important;
				}
				 .text--quote-box p:last-of-type {
				    margin-bottom: 5px !important;
				}
				/* END - New quote box implementation */

				/* START - New rules sidebar implementation */
				.text--rules-sidebar {
				    display: block !important;
				    background-color: var(--compendium-rules-sidebar-color, #DAE4C1) !important; /*Fallback: if the variable isn't declared, it'll default to pale-green*/
				    position: relative !important;
				    width: auto !important;
				    display: flex !important;
				    flex-direction: column !important;
				    overflow: visible !important;
				    margin: 30px 5px !important;
				    line-height: 1.6 !important;
				    font-size: 14px !important;
				    padding: 25px 28px 15px 30px !important;
				    border-radius: 0 !important;
				    border-top: 3px solid #231f20 !important;
				    border-bottom: 3px solid #231f20 !important;
				    border-left: 1.5px solid  #b3b3b3 !important;
				    border-right: 1.5px solid  #b3b3b3 !important;
				    color: var(--theme-page-fg-color, #242527) !important;
				    filter: drop-shadow(0px 5px 8px #ccc);
				}

				.text--rules-sidebar p:first-of-type {
				    text-transform: uppercase;
				    font-weight: bold;
				    font-size: 16px;
				}

				.text--rules-sidebar .action-tooltip, .text--rules-sidebar .condition-tooltip, .text--rules-sidebar .item-tooltip, .text--rules-sidebar .rule-tooltip, .text--rules-sidebar .sense-tooltip, .text--rules-sidebar .skill-tooltip, .text--rules-sidebar .weapon-properties-tooltip, .text--rules-sidebar .action-tooltip {
				    color: #129b54 !important;
				}

				.text--rules-sidebar::before {
				    top: -13px !important;
				    right: 0.1px !important;
				    left: 0.1px !important;
				}

				.text--rules-sidebar::before {
				    content: '';
				    background-image: url("https://media.dndbeyond.com/compendium-images/components/--right-rules.svg"),url("https://media.dndbeyond.com/compendium-images/components/--left-rules.svg") !important;
				    background-position: left, right !important;
				    background-size: contain !important;
				    background-repeat: no-repeat !important;
				    height: 11px !important;
				    position: absolute !important;
				    z-index: -1;
				}

				.text--rules-sidebar::after {
				    bottom: -13px !important;
				    right: -0.1px !important;
				    left: 0.1px !important;
				}
				.text--rules-sidebar::after {
				    content: '';
				    background-image: url("https://media.dndbeyond.com/compendium-images/components/--right-rules.svg"),url("https://media.dndbeyond.com/compendium-images/components/--left-rules.svg") !important;
				    background-position: left, right !important;
				    background-size: contain !important;
				    background-repeat: no-repeat !important;
				    height: 11px !important;
				    position: absolute !important;
				    z-index: -1;
				    transform: scaleY(-1);
				}
				/* END - New rules sidebar implementation */

				/* START - CSS header variables */
				h1::after {
				    background-color: var(--h1-underline, var(--header-underline, #47D18C));
				}
				h2::after {
				    background-color: var(--h2-underline, var(--header-underline, #47D18C));
				}
				h3::after {
				    background-color: var(--h3-underline, var(--header-underline, #47D18C));
				}
				/* END -  CSS header variables */

				/* START - Underlines compendium links */
				a:not(.ddb-lightbox-outer, h3 > a):hover,
				a:not(.ddb-lightbox-outer, h3 > a):focus {
				    text-decoration: underline;
				}
				/* END - Underlines Compendium links */

				
				/** TEMP new .text--quote-box type for compendium content - needs to be added to compiled **/

				.text--quote-box.compendium-indented-callout-.text--quote-box {
				    background: transparent !important;
				    font-size: 16px !important;
				    border-left: 4px solid #e0dcdc !important;
				    border-right: none !important;
				    padding: 10px 20px !important;
				    margin: 30px 0 !important;
				}

				.text--quote-box.compendium-indented-callout-.text--quote-box::before {
				    content: none !important;
				}

				.text--quote-box.compendium-indented-callout-.text--quote-box::after {
				    content: none !important;
				}  

				/** END TEMP new .text--quote-box type **/

				
				h6 {
				    font-size: 14px !important;
				    font-weight: bold !important;
				}


				h1 {
				    font-size: 32px!important;
				    font-weight: 400!important
				}

				h2 {
				    font-size: 26px!important;
				    font-weight: 400!important;
				    clear: both
				}

				h3 {
				    font-size: 22px!important;
				    font-weight: 400!important;
				    clear: both
				}

				h4 {
				    font-size: 18px!important;
				    font-weight: 700!important
				}

				h5 {
				    font-size: 16px!important;
				    font-weight: 700!important
				}

		
				.rules-text a {
				    color: #129b54!important;
				    transition: .3s
				}

				.rules-text p:first-child {
				    font-size: 16px
				}


				.stat-block-background {
				    background-repeat: no-repeat;
				    -webkit-box-shadow: 0 5px 8px 0 #aaa;
				    -moz-box-shadow: 0 5px 8px 0 #aaa;
				    box-shadow: 0 5px 8px 0 #aaa;
				    background-position: top!important;
				    background-image: url(https://media-stg.dndbeyond.com/compendium-images/tcoe/0gqawlEa2tjXGxpc/mm_statbg_sm.jpg)!important
				}

				.stat-block-background:after,.stat-block-background:before {
				    background-image: url(https://media-stg.dndbeyond.com/compendium-images/cm/c43LH2y2Gcaxb3V2/MMStatBar_lrg.png)!important
				}


				.block-torn-paper,.epigraph,.epigraph--with-author {
				    overflow: auto;
				    background: var(--theme-quote-bg-color,#fff);
				    color: var(--theme-quote-fg-color,#242527);
				    margin: 40px 0;
				    line-height: 1.6;
				    font-size: 14px;
				    border: solid transparent;
				    border-width: 20px 10px;
				    border-image-source: var(--theme-quote-border,url(https://media.dndbeyond.com/ddb-compendium-client/5f1f1d66d16be68cf09d6ca172f8df92.png));
				    border-image-repeat: repeat;
				    border-image-slice: 20 10 20 10 fill;
				    padding: 10px;
				    position: relative
				}

				.epigraph--with-author p:last-child {
				    font-style: italic;
				    text-align: right
				}

				.rules-text {
				    overflow: auto;
				    display: block;
				    margin: 30px 0;
				    line-height: 1.6;
				    font-size: 14px;
				    color: var(--theme-rules-text-fg-color,#242527);
				    border-color: transparent;
				    border-style: solid;
				    border-width: 15px 20px;
				    border-image-repeat: repeat;
				    border-image-slice: 21 30 21 30 fill;
				    background-color: transparent;
				    padding: 20px 10px 10px;
				    position: relative;
				    border-image-source: var(--theme-rules-text-border,url(https://media.dndbeyond.com/ddb-compendium-client/463d4668370589a1a73886611645df7e.png));
				    -webkit-filter: drop-shadow(0 5px 8px #ccc);
				    filter: drop-shadow(0 5px 8px #ccc)
				}

				.rules-text p:first-child {
				    text-transform: uppercase;
				    font-weight: 700
				}

				.read-aloud-text {
				    overflow: auto;
				    display: block;
				    margin: 30px 0;
				    line-height: 1.6;
				    font-size: 14px;
				    color: var(--theme-read-aloud-fg-color,#242527);
				    border: 8px solid transparent;
				    border-image-repeat: repeat;
				    border-image-slice: 8 8 8 8 fill;
				    background-color: transparent;
				    padding: 20px 20px 10px!important;
				    position: relative;
				    border-image-source: var(--theme-read-aloud-border,url(https://media.dndbeyond.com/ddb-compendium-client/146117d0758df55ed5ff299b916e9bd1.png))
				}
				`,
			save_onsavecallback: function(e) {
				// @todo !IMPORTANT grab the id somewhere from the form, so that you can use this safely
				let note_id = $(this.getElement()).attr('data-note-id');
				self.notes[note_id].text =tinymce.activeEditor.getContent();
				self.notes[note_id].plain=tinymce.activeEditor.getContent({ format: 'text' });
				self.persist();
				if(note_id in window.TOKEN_OBJECTS){
					window.TOKEN_OBJECTS[note_id].place(); // trigger display of the "note" condition
				}
				if(self.notes[note_id].player){
					window.MB.sendMessage('custom/myVTT/note',{
						id: note_id,
						note:self.notes[note_id]
					});
				}
				
			}
		});
				
	}
}


function init_journal(gameid){
	
	["/content/1-0-1688-0/js/tinymce/tiny_mce/tinymce.min.js"].forEach(function(value) {
		var s = document.createElement('script');
		s.src = value;
		(document.head || document.documentElement).appendChild(s);
	});

	["https://www.dndbeyond.com/content/1-0-1697-0/js/tinymce/custom_skin/skin.min.css"].forEach(function(value){
		var l = document.createElement('link');
		
		l.href = value;
		l.rel = "stylesheet";
		(document.head || document.documentElement).appendChild(l);
	});
	
	
	
	window.JOURNAL=new JournalManager(gameid);

	window.JOURNAL.build_journal();
	
	
}

function render_source_chapter_in_iframe(url) {
	if (typeof url !== "string" || !url.startsWith('https://www.dndbeyond.com/sources/')) {
		console.error(`render_source_chapter_in_iframe was given an invalid url`, url);
		showError(new Error(`Unable to render a DDB chapter. This url does not appear to be a valid DDB chapter ${url}`));
	}
	const chapterHash = url.split("#")?.[1];
	const iframeId = 'sourceChapterIframe';
	const containerId = `${iframeId}_resizeDrag`;
	const container = find_or_create_generic_draggable_window(containerId, 'Source Book');

	let iframe = $(`#${iframeId}`);
	if (iframe.length > 0) {

		// TODO: any clean up tasks before redirecting?

		if (chapterHash) {
			iframe.attr("data-chapter-hash", chapterHash);
		} else {
			iframe.attr("data-chapter-hash", '');
		}

		iframe.attr('src', url);
		return;

	} else {
		iframe = $(`<iframe id=${iframeId}>`);
		if (chapterHash) {
			iframe.attr("data-chapter-hash", chapterHash);
		} else {
			iframe.attr("data-chapter-hash", '');
		}
		iframe.css({
			"display": "block",
			"width": "100%",
			"height": "100%",
			"position": "absolute",
			"top": "0",
			"left": "0"
		});
		container.append(iframe);
	}

	iframe.on("load", function(event) {
		console.log(`render_source_chapter_in_iframe is loading ${this.src}`, $(event.target), this);
		if (!this.src) {
			// it was just created. no need to do anything until it actually loads something
			return;
		}
		const iframeContents = $(event.target).contents();

		iframeContents.find(".site-bar").hide();
		iframeContents.find("#site-main > header").hide();
		iframeContents.find("#mega-menu-target").hide();
		iframeContents.find(".ad-container").hide();
		iframeContents.find("#site > footer").hide();

		const hash = $(event.target).attr('data-chapter-hash');
		if (hash) {
			const headerId = `#${hash}`;
			const sectionHeader = iframeContents.find(headerId);
			const tagName = sectionHeader.prop("tagName");
			let boundaryTags = [];
			// we are explicitly allowing everything to fall through to the next statement
			// because we want everything that matches tagName and above
			// for example, if tagName is H3, we want our boundaryTags to include H3, H2, and H1
			switch (tagName) {
				case "H4": boundaryTags.push("H4");
				case "H3": boundaryTags.push("H3");
				case "H2": boundaryTags.push("H2");
				case "H1": boundaryTags.push("H1");
			}

			sectionHeader.prevAll().remove();
			boundaryTags.forEach((tag, idx) => {
				const nextHeader = sectionHeader.nextAll(`${tag}:first`);
				nextHeader.nextAll().remove();
				nextHeader.remove();
			});
		}

		$(this).siblings('.sidebar-panel-loading-indicator').remove();
	});

	iframe.attr('src', url);
}

function find_or_create_generic_draggable_window(id, titleBarText, addLoadingIndicator = true, addPopoutButton = false) {
	console.log(`find_or_create_generic_draggable_window id: ${id}, titleBarText: ${titleBarText}, addLoadingIndicator: ${addLoadingIndicator}, addPopoutButton: ${addPopoutButton}`);
	const existing = id.startsWith("#") ? $(id) : $(`#${id}`);
	if (existing.length > 0) {
		return existing;
	}

	const container = $(`<div class="resize_drag_window" id="${id}"></div>`);
	container.css({
		"left": "10%",
		"top": "10%",
		"max-width": "100%",
		"max-height": "100%",
		"position": "fixed",
		"height": "80%",
		"width": "80%",
		"z-index": "10000",
		"display": "none"
	});

	$("#site").append(container);

	if (addLoadingIndicator) {
		container.append(build_combat_tracker_loading_indicator(`Loading ${titleBarText}`));
		const loadingIndicator = container.find(".sidebar-panel-loading-indicator");
		loadingIndicator.css("top", "25px");
		loadingIndicator.css("height", "calc(100% - 25px)");
	}

	container.show("slow")
	container.resize(function(e) {
		e.stopPropagation();
	});

	const titleBar = $("<div class='title_bar restored'></div>");
	container.append(titleBar);

	/*Set draggable and resizeable on monster sheets for players. Allow dragging and resizing through iFrames by covering them to avoid mouse interaction*/
	const close_title_button = $(`<div class="title_bar_close_button"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g transform="rotate(-45 50 50)"><rect></rect></g><g transform="rotate(45 50 50)"><rect></rect></g></svg></div>`);
	titleBar.append(close_title_button);
	close_title_button.on("click", function (event) {
		close_and_cleanup_generic_draggable_window($(event.currentTarget).closest('.resize_drag_window').attr('id'));
	});

	if (addPopoutButton) {
		container.append(`<div class="popout-button"><svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 0 24 24" width="18px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M18 19H6c-.55 0-1-.45-1-1V6c0-.55.45-1 1-1h5c.55 0 1-.45 1-1s-.45-1-1-1H5c-1.11 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-6c0-.55-.45-1-1-1s-1 .45-1 1v5c0 .55-.45 1-1 1zM14 4c0 .55.45 1 1 1h2.59l-9.13 9.13c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L19 6.41V9c0 .55.45 1 1 1s1-.45 1-1V4c0-.55-.45-1-1-1h-5c-.55 0-1 .45-1 1z"/></svg></div>`);
	}

	container.addClass("moveableWindow");

	container.resizable({
		addClasses: false,
		handles: "all",
		containment: "#windowContainment",
		start: function (event, ui) {
			$(event.currentTarget).append($('<div class="iframeResizeCover"></div>'));
		},
		stop: function (event, ui) {
			$('.iframeResizeCover').remove();
		},
		minWidth: 200,
		minHeight: 200
	});

	container.on('mousedown', function(event) {
		frame_z_index_when_click($(event.currentTarget));
	});

	container.draggable({
		addClasses: false,
		scroll: false,
		containment: "#windowContainment",
		start: function(event, ui) {
			$(event.currentTarget).append($('<div class="iframeResizeCover"></div>'));
		},
		stop: function(event, ui) {
			$('.iframeResizeCover').remove();
		}
	});

	titleBar.on('dblclick', function(event) {
		const titleBar = $(event.currentTarget);
		if (titleBar.hasClass("restored")) {
			titleBar.data("prev-height", titleBar.height());
			titleBar.data("prev-width", titleBar.width() - 3);
			titleBar.data("prev-top", titleBar.css("top"));
			titleBar.data("prev-left", titleBar.css("left"));
			titleBar.css("top", titleBar.data("prev-minimized-top"));
			titleBar.css("left", titleBar.data("prev-minimized-left"));
			titleBar.height(23);
			titleBar.width(200);
			titleBar.addClass("minimized");
			titleBar.removeClass("restored");
			titleBar.prepend(`<div class="title_bar_text">${titleBarText}</div>`);
		} else if(titleBar.hasClass("minimized")) {
			titleBar.data("prev-minimized-top", titleBar.css("top"));
			titleBar.data("prev-minimized-left", titleBar.css("left"));
			titleBar.height(titleBar.data("prev-height"));
			titleBar.width(titleBar.data("prev-width"));
			titleBar.css("top", titleBar.data("prev-top"));
			titleBar.css("left", titleBar.data("prev-left"));
			titleBar.addClass("restored");
			titleBar.removeClass("minimized");
			titleBar.find(".title_bar_text").remove();
		}
	});

	return container;
}

function close_and_cleanup_generic_draggable_window(id) {
	const container = id.startsWith("#") ? $(id) : $(`#${id}`);
	container.off('dblclick');
	container.off('mousedown');
	container.draggable('destroy');
	container.resizable('destroy');
	container.find('.title_bar_close_button').off('click');
	container.find('.popout-button').off('click');
	container.remove();
}
