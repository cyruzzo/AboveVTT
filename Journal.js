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
						return self.notes[note].title == ui.item.find(".sidebar-list-item-row-details-title").text();
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
							return self.notes[note].title == ui.item.find(".sidebar-list-item-row-details-title").text();
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
				
				let entry=$("<div class='sidebar-list-item-row-item sidebar-list-item-row'></div>");
				let entry_title=$("<div class='sidebar-list-item-row-details sidebar-list-item-row-details-title'></div>");

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
			$("[role='dialog']").css("height", "calc(100vh - 35px)")	
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
			plugins: 'save,hr,image,link,lists,media,paste,tabfocus,textcolor,colorpicker,autoresize, code, table',
			toolbar1: 'undo,|,paste,|,bold,|,italic,|,underline,|,strikethrough,|,blockquote,|,alignleft,|,aligncenter,|,alignright,|,outdent,|,indent,|,bullist,|,numlist,|,forecolor,|,backcolor,|,fontselect,|,fontsizeselect,|,formatselect,|,removeformat,|,hr,link,|,unlink,|,image,|,media,|,table,|,code',
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

