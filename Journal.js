/**
 * JournalManager (WIP)
 * Is the tab on the sidebar that allows you to write notes
 		* Requires journalPanel = new Sidebar();
		* All of its DOM elements attach to journalPanel tree 
 * Also holds notes attached to tokens
 * 
 */
cached_journal_items = {};

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
		if(window.DM && (localStorage.getItem('JournalStatblocks') != null && localStorage.getItem('JournalStatblocks') != 'undefined')){
			this.notes = {
				...this.notes,
				...$.parseJSON(localStorage.getItem('JournalStatblocks'))
			}
		}
	}
	
	persist(){
		if(window.DM){
			if(!this.statBlocks)
				this.statBlocks = Object.fromEntries(Object.entries(this.notes).filter(([key, value]) => this.notes[key].statBlock == true));
			localStorage.setItem('JournalStatblocks', JSON.stringify(this.statBlocks));
			localStorage.setItem('Journal' + this.gameid, JSON.stringify(Object.fromEntries(Object.entries(this.notes).filter(([key, value]) => this.notes[key].statBlock != true))));
			localStorage.setItem('JournalChapters' + this.gameid, JSON.stringify(this.chapters));
		}
	}
	
	
	
	sync(){
		let self=this;

		if(window.DM){
			window.MB.sendMessage('custom/myVTT/JournalChapters',{
				chapters: self.chapters
			});
			let sendNotes = [];
			for(let i in self.notes){
				if(self.notes[i].player){
					self.notes[i].id = i;
					sendNotes.push(self.notes[i])
				}
			}

			self.sendNotes(sendNotes)
			
		}
	}

	sendNotes(sendNotes){
		let self=this;
		if(sendNotes.length > 1 && JSON.stringify(sendNotes).length > 128000) {
			let sendNotes1 = sendNotes.slice(0, parseInt(sendNotes.length/2))
      		let sendNotes2 = sendNotes.slice(parseInt(sendNotes.length/2), sendNotes.length)
      		self.sendNotes(sendNotes1);
      		self.sendNotes(sendNotes2);
		}
		else{
			window.MB.sendMessage('custom/myVTT/notesSync',{
				notes: sendNotes
			});
		}


	}
	
	build_journal(){
		console.log('build_journal');
		let self=this;

		journalPanel.body.empty();

		
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
			refreshPositions: true,
			update: function(event, ui) {
				

				// Find the old index of the dragged element
				const old_index = self.chapters.findIndex(function(chapter) {
					return chapter.id == ui.item.attr('data-id')
				});
				// Find the new index of the dragged element

				const new_index = (old_index != -1) ? ui.item.index() : self.chapters.length-1;
				// Move the dragged element to the new index
				self.chapters.splice(new_index, 0, self.chapters.splice(old_index, 1)[0]);
				self.persist();
				window.MB.sendMessage('custom/myVTT/JournalChapters',{
					chapters: self.chapters
				});
				self.build_journal();
			}
		});

		chapter_list.droppable({
		    accept: '#journal-panel .folder>.folder',
		    greedy: true,
			tolerance: 'pointer',
		    drop: function(e,ui) {
		    	let folderIndex = ui.draggable.attr('data-index');
		    	if(self.chapters[folderIndex].parentID){
		    		delete self.chapters[folderIndex].parentID;
		    	}else{			
					// Find the new index of the dragged element

					const new_index = (folderIndex != -1) ? ui.item.index() : self.chapters.length-1;
					// Move the dragged element to the new index
					self.chapters.splice(new_index, 0, self.chapters.splice(folderIndex, 1)[0]);
		    	}
				self.persist();
				window.MB.sendMessage('custom/myVTT/JournalChapters',{
					chapters: self.chapters
				});
				self.build_journal();

		    }
		});



		journalPanel.body.append(chapter_list);
		let chaptersWithLaterParents = [];
		for(let i=0; i<self.chapters.length;i++){
	
			if(!self.chapters[i].id){
				self.chapters[i].id = uuid();
			}
			// A chapter title can be clicked to expand/collapse the chapter notes
			let section_chapter=$(`
				<div data-index='${i}' data-id='${self.chapters[i].id}' class='sidebar-list-item-row list-item-identifier folder ${self.chapters[i]?.collapsed ? 'collapsed' : ''}'></div>
			`);

			// Create a sortale list of notes
			const note_list=$("<ul class='note-list'></ul>");
			section_chapter.droppable({
			    accept: '#journal-panel .folder',
			    greedy: true,
				tolerance: 'pointer',
			    drop: function(e,ui) {
			    	let targetID = $(this).attr('data-id');
			    	let targetIndex = $(this).attr('data-index');
			    	let folderIndex = ui.draggable.attr('data-index');
			    	if(self.chapters[folderIndex].id == targetID)
			    		return;
			    	self.chapters[folderIndex].parentID = targetID;
			    	const new_index = targetIndex+1;
					// Move the dragged element to the new index
					self.chapters.splice(new_index, 0, self.chapters.splice(folderIndex, 1)[0]);
					
					self.persist();
					window.MB.sendMessage('custom/myVTT/JournalChapters',{
						chapters: self.chapters
					});
					self.build_journal();

			    }
			})
			let sender;
			// Make the section_chapter sortable
			section_chapter.sortable({
				refreshPositions: true,
				connectWith: "#journal-panel .folder",
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
					const new_index = (old_index != -1) ? ui.item.index() : self.chapters.length-1;
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
						if(ui.item.hasClass('folder')){
							
							const old_index = self.chapters.findIndex(function(chapter) {
								return chapter.id == ui.item.attr('data-id')
							});

							const new_index = ui.item.next().hasClass('folder') ? ui.item.next().attr('data-index') : ui.item.prev().attr('data-index') ;
							self.chapters.splice(new_index, 0, self.chapters.splice(old_index, 1)[0]);
						}
						else{
							const old_index = self.chapters[i].notes.findIndex(function(note) {
								return note == ui.item.attr('data-id')
							});
							// Find the new index of the dragged element
							const new_index = ui.item.index();
							// Move the dragged element to the new index
							self.chapters[i].notes.splice(new_index, 0, self.chapters[i].notes.splice(old_index, 1)[0]);
						}
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
			
			let chapter_title=$(`<div class='journal-chapter-title' title='${self.chapters[i].title}'/>`);
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
			
			let btn_del_chapter=$("<button class='btn-chapter-icon btn-delete-chapter'><img height=10 src='"+window.EXTENSION_PATH+"assets/icons/delete.svg'></button>");
			
			btn_del_chapter.click(function(){
				// TODO: Make this better but default dialog is good enough for now
				if(confirm("Delete this chapter and all the contained notes?")){

					for(let k=0;k<self.chapters[i].notes.length;k++){
						let nid=self.chapters[i].notes[k];
						delete self.notes[nid];
					}
					
					self.chapters = self.chapters.filter(d => d.id != self.chapters[i].id)
					
					$(this).closest('.folder').find('.folder').each(function(){
						let folderId = $(this).attr('data-id');
						let chapter = self.chapters.filter(d => d.id == folderId)[0];


						for(let k=0;k<chapter.notes.length;k++){
							let nid=chapter.notes[k];
							delete self.notes[nid];
						}

						self.chapters = self.chapters.filter(d => d.id != folderId)

					})
					
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

				let containsPlayerNotes = false;
				for(let n=0; n<self.chapters[i].notes.length;n++){
					let note_id=self.chapters[i].notes[n];
					if(self.notes[note_id]?.player == true || (self.notes[note_id]?.player instanceof Array && self.notes[note_id].player?.includes(`${window.myUser}`))){
						containsPlayerNotes = true;
					} 
				}

				if(window.DM || containsPlayerNotes) {
					section_chapter.append(row_chapter_title);
				} else {
					section_chapter.append(row_chapter_title);
					section_chapter.hide();
				}

				

				if(!self.chapters[i].parentID){
					chapter_list.append(section_chapter);
				}
				else{		
					let parentFolder = chapter_list.find(`.folder[data-id='${self.chapters[i].parentID}']`);
					let parentID = self.chapters[i]?.parentID
					if(self.chapters[i].id == self.chapters.filter(d => d.id == parentID)[0].parentID){
						delete self.chapters[i].parentID
					}
					if(parentFolder.length == 0){
						self.chapters.splice(self.chapters.length-1, 0, self.chapters.splice(i, 1)[0]);
						i -= 1; 
						continue;
					}	
					let containsPlayerNotes = false;
					for(let n=0; n<self.chapters[i].notes.length;n++){
						let note_id=self.chapters[i].notes[n];
						if(self.notes[note_id]?.player == true || (self.notes[note_id]?.player instanceof Array && self.notes[note_id]?.player.includes(`${window.myUser}`))){
							containsPlayerNotes = true;
						} 
					}

					if(window.DM || containsPlayerNotes) {
						parentFolder.append(section_chapter);
						parentFolder.show();
						parentFolder.parents().show();
					} else {
						parentFolder.append(section_chapter);
						section_chapter.hide();
					}
				}

			journalPanel.body.append(chapter_list);


			for(let n=0; n<self.chapters[i].notes.length;n++){
				
				let note_id=self.chapters[i].notes[n];
				
				if(! (note_id in self.notes))
					continue;
					
				if( (! window.DM) && (self.notes[note_id]?.player == false || (self.notes[note_id]?.player instanceof Array && !self.notes[note_id]?.player.includes(`${window.myUser}`))) )
					continue;
				
				let prependIcon = (self.notes[note_id].player && window.DM) ? $(`<span class="material-symbols-outlined" style='font-size:12px'>share</span>`) : '';
				let entry=$(`<div class='sidebar-list-item-row-item sidebar-list-item-row' data-id='${note_id}'></div>`);
				let entry_title=$(`<div class='sidebar-list-item-row-details sidebar-list-item-row-details-title' title='${self.notes[note_id].title}'></div>`);


				entry_title.text(self.notes[note_id].title);
				if(!self.notes[note_id].ddbsource){
					entry_title.click(function(){
						self.display_note(note_id);
					});
				}
				else{
					entry_title.click(function(){
						render_source_chapter_in_iframe(self.notes[note_id].ddbsource);
					});
				}
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
				let delete_btn=$("<button class='btn-chapter-icon'><img src='"+window.EXTENSION_PATH+"assets/icons/delete.svg'></button>");
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
								
				entry.append(prependIcon);
				entry.append(entry_title);

				if(window.DM){
					if(!self.notes[note_id].ddbsource){
						entry.append(edit_btn);
						entry.append(rename_btn);		
					}
					entry.append(delete_btn);
				}

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
		if(window.DM){
			let chapterImport = $(`<select id='ddb-source-journal-import'><option value=''>Select a source to import</option></select>`);
			chapterImport.append($(`<option value='/magic-items'>Magic Items</option>`));
			chapterImport.append($(`<option value='/feats'>Feats</option>`));
			chapterImport.append($(`<option value='/spells'>Spells</option>`));
			window.ScenesHandler.build_adventures(function(){
				for(let source in window.ScenesHandler.sources){
					let sourcetitle = window.ScenesHandler.sources[source].title;
					sourcetitle = sourcetitle.replaceAll(/\n.*\<span.*span>[\s]+?\n|[\n]|\s\s/gi, '');
					window.ScenesHandler.sources[source].title = sourcetitle;
					chapterImport.append($(`<option value='${source}'>${sourcetitle}</option>`));
				}
			});
			chapterImport.on('change', function(){
				let source = this.value;
				
				if (source == '/magic-items' || source == '/feats' || source == '/spells'){
					let new_noteid=uuid();
					let new_note_title = source.replaceAll(/-/g, ' ')
											.replaceAll(/\//g, '')
											.replaceAll(/\b\w/g, l => l.toUpperCase());

					self.notes[new_noteid]={
						title: new_note_title,
						text: "",
						player: false,
						plain: "",
						ddbsource: `https://dndbeyond.com${source}`
					};
					let chapter = self.chapters.find(x => x.title == 'Compendium')
					if(!chapter){
						self.chapters.push({
							title: 'Compendium',
							collapsed: false,
							notes: [],
						});
						chapter = self.chapters[self.chapters.length-1];
					}
					
					chapter.notes.push(new_noteid);
					self.persist();
					self.build_journal();
				}
				else{
					self.chapters.push({
						title: window.ScenesHandler.sources[source].title,
						collapsed: false,
						notes: [],
					});
					window.ScenesHandler.build_chapters(source, function(){
						for(let chapter in window.ScenesHandler.sources[source].chapters){
							let new_noteid=uuid();
							let new_note_title = window.ScenesHandler.sources[source].chapters[chapter].title;
							self.notes[new_noteid]={
								title: new_note_title,
								text: "",
								player: false,
								plain: "",
								ddbsource: window.ScenesHandler.sources[source].chapters[chapter].url
							};
							self.chapters[self.chapters.length-1].notes.push(new_noteid);
						}
						self.persist();
						self.build_journal();
					});
				}
			})

			$('#journal-panel .sidebar-panel-body').prepend(sort_button, chapterImport);
		}
	}
	
	
	display_note(id, statBlock = false){
		let self=this;
		let note=$("<div class='note'></div>");
		
		note.attr('title',self.notes[id].title);
		if(window.DM){
			let visibility_container=$("<div class='visibility-container'/>");

		

			let toggle_container = $(`<div class='visibility-toggle-container'></div`)

			let visibility_toggle=$("<input type='checkbox' name='allPlayers'/>");
			let visibility_row = $(`<div class='visibility_toggle_row'><label for='allPlayers'>All Players</label></div>`)
			visibility_row.append(visibility_toggle)
			toggle_container.append(visibility_row);
			visibility_toggle.change(function(){

				window.JOURNAL.note_visibility(id,visibility_toggle.is(":checked"));
				window.JOURNAL.build_journal();
				toggle_container.find(`input:not([name='allPlayers'])`).prop('disabled', visibility_toggle.is(":checked"));
				toggle_container.find(`input:not([name='allPlayers'])`).prop('checked', visibility_toggle.is(":checked"));
				
			
			});


			for(let i in window.playerUsers){
				if(toggle_container.find(`input[name='${window.playerUsers[i].userId}']`).length == 0){
					let visibility_toggle=$(`<input type='checkbox' name='${window.playerUsers[i].userId}'/>`);
					let visibility_row = $(`<div class='visibility_toggle_row'><label for='${window.playerUsers[i].userId}'>${window.playerUsers[i].userName}</label></div>`)
					
					visibility_row.append(visibility_toggle)

					visibility_toggle.prop("checked",(self.notes[id]?.player instanceof Array && self.notes[id]?.player.includes(`${window.playerUsers[i].userId}`)));
					
					visibility_toggle.change(function(){
						let sharedUsers = toggle_container.find(`input:checked:not([name='allPlayers'])`).toArray().map(d => d.name);
						if(sharedUsers.length == 0)
							sharedUsers = false;
						window.JOURNAL.note_visibility(id,sharedUsers);
						window.JOURNAL.build_journal();
					});
					
					toggle_container.append(visibility_row);
				}
			}
			
			visibility_toggle.prop("checked",self.notes[id].player == true);
				
			if(visibility_toggle.is(":checked"))
				toggle_container.find(`input:not([name='allPlayers'])`).prop('disabled', true);
			else
				toggle_container.find(`input:not([name='allPlayers'])`).prop('disabled', false);
			
			
			let shareWithPlayer = $("<button class='share-player-visibility'>Share with players</button>");
			shareWithPlayer.append(toggle_container);
			visibility_container.append(shareWithPlayer);
			
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
				window.JOURNAL.edit_note(id, statBlock);
			});
			
			visibility_container.append(edit_btn);
			
			note.append(visibility_container);
			
		}
		let note_text=$("<div class='note-text'/>");
		note_text.append(self.notes[id].text); // valid tags are controlled by tinyMCE.init()
		
		this.translateHtmlAndBlocks(note_text);	
		this.add_journal_roll_buttons(note_text);
		this.add_journal_tooltip_targets(note_text);
		this.block_send_to_buttons(note_text);
		add_stat_block_hover(note_text);
		
		note.append(note_text);
		note.find("a").attr("target","_blank");
		note.dialog({
			draggable: true,
			width: 860,
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
		note.off('click').on('click', '.int_source_link', function(event){
			event.preventDefault();
			render_source_chapter_in_iframe(event.target.href);
		});

	}
	add_journal_tooltip_targets(target){
		$(target).find('.tooltip-hover').each(function(){
			let self = this;
			if(!$(self).attr('data-tooltip-href'))
			window.JOURNAL.getDataTooltip(self.href, function(url, typeClass){
				$(self).attr('data-tooltip-href', url);
				$(self).toggleClass(`${typeClass}-tooltip`, true);
			});
		});
	}

	async getDataTooltip(url, callback){
		if(window.spellIdCache == undefined){
			window.spellIdCache = {};
		}
		const urlRegex = /www\.dndbeyond\.com\/[a-zA-Z\-]+\/([0-9]+)/g;
		const urlType = /www\.dndbeyond\.com\/([a-zA-Z\-]+)/g;
		let itemId = (url.matchAll(urlRegex).next().value) ? url.matchAll(urlRegex).next().value[1] : 0;
		let itemType = url.matchAll(urlType).next().value[1];
		url = url.toLowerCase();
		if(itemId == 0 || itemType == 'equipment'){
			if(window.spellIdCache[url]){
				callback(`www.dndbeyond.com/${window.spellIdCache[url].type}/${window.spellIdCache[url].id}-tooltip?disable-webm=1`, itemType.slice(0, -1));	
			}
			else{
				if(url.includes('weapon-properties')){
					let splitUrl = url.split('/');
					let name = splitUrl[splitUrl.length-1];
					itemId = window.ddbConfigJson.weaponProperties.filter(d=> d.name.toLowerCase() == name.toLowerCase())[0]?.id
				}
				else{
							
					let itemPage = await $.get(url)		
					if($(itemPage).find('.b-breadcrumb-wrapper>.b-breadcrumb-item:last-of-type a').length>0){
						let splitUrl = $(itemPage).find('.b-breadcrumb-wrapper>.b-breadcrumb-item:last-of-type a').attr('href').split('/');
						itemId = parseInt(splitUrl[splitUrl.length-1]);
						itemType = $(itemPage).find('.details-container-content-description-text span:first-of-type')?.text()?.toLowerCase()?.includes('weapon') ? 'weapons' : url.includes('equipment') ? 'adventuring-gear' : itemType
					    
					}
					else {
						const regex = /window\.cobaltVcmList\.push\(\{.+id\:([0-9]+)/g;
						itemId = itemPage.matchAll(regex).next().value[1];	
					}
				}
				window.spellIdCache[url] = {id: itemId, type: itemType};
				callback(`www.dndbeyond.com/${itemType}/${itemId}-tooltip?disable-webm=1`, itemType.slice(0, -1));
			}	
		}
		else{
			callback(`www.dndbeyond.com/${itemType}/${itemId}-tooltip?disable-webm=1`, itemType.slice(0, -1));	
		}
		
	}
	async getNotes(){
	for(let note in window.JOURNAL.notes){
	        if(window.JOURNAL.notes[note].ddbsource){
            	await $.get(window.JOURNAL.notes[note].ddbsource, function(data){
            		cached_journal_items[note] = data.replace(/<style[^>]*>.*<\/style>/g, '').replace(/<script[^>]*>.*<\/script>/g, '').replace(/<[^>]+>/g, '').replace(/([\r\n]+ +)+/g, '');;                	
                });
	        }
	    }
	}
	block_send_to_buttons(target){
		let blocks = target.find('img:not(.mon-stat-block__separator-img), .text--quote-box, .rules-text, .block-torn-paper, .read-aloud-text')

		let sendToGamelogButton = $('<button class="block-send-to-game-log"><span class="material-symbols-outlined">login</span></button>')
		let container = $(`<div class='note-text' style='position:relative; width:'></div>`)
		sendToGamelogButton.off('click').on("click", function(e) {
	        e.stopPropagation();
	        e.preventDefault();
	        let targetBlock = $(e.currentTarget).parent().clone();
	        targetBlock.find('button').remove();
	        targetBlock.find('img').removeAttr('width height style').toggleClass('magnify', true);
	        send_html_to_gamelog(targetBlock[0].outerHTML);
	    });
		blocks.wrap(function(){
			if(this instanceof HTMLImageElement){
				container.css('width', 'fit-content');
				$(this).attr('href', $(this).attr('src'));
			}
			return container;
		});
		blocks.after(sendToGamelogButton); 

		let tables = target.find('table');
		
		const allDiceRegex = /(\d+)?d(?:100|20|12|10|8|6|4)(?:kh\d+|kl\d+|ro(<|<=|>|>=|=)\d+)*/g; // ([numbers]d[diceTypes]kh[numbers] or [numbers]d[diceTypes]kl[numbers]) or [numbers]d[diceTypes]
       
		if(allDiceRegex.test($(tables).find('tr:first-of-type>:first-child').text())){
			let result = $(tables).find(`tbody > tr td:last-of-type`);
			result.append(sendToGamelogButton); 
		}
	}
				   


	add_journal_roll_buttons(target, tokenId=undefined){
		console.group("add_journal_roll_buttons")
		
		let pastedButtons = target.find('.avtt-roll-button').add(target.find('.integrated-dice__container'));

		for(let i=0; i<pastedButtons.length; i++){
			$(pastedButtons[i]).replaceWith($(pastedButtons[i]).text());
		}

		const rollImage = (tokenId) ? window.TOKEN_OBJECTS[tokenId].options.imgsrc : window.PLAYER_IMG
		const rollName = (tokenId) ? window.TOKEN_OBJECTS[tokenId].options.revealname == true || window.TOKEN_OBJECTS[tokenId].options.player_owned ? window.TOKEN_OBJECTS[tokenId].options.name : '' : window.PLAYER_NAME

		const clickHandler = function(clickEvent) {
			roll_button_clicked(clickEvent, rollName, rollImage, tokenId ? "monster" : undefined, tokenId)
		};

		const rightClickHandler = function(contextmenuEvent) {
			roll_button_contextmenu_handler(contextmenuEvent, rollName, rollImage, tokenId ? "monster" : undefined, tokenId);
		}

		// replace all "to hit" and "damage" rolls
	
		let currentElement = $(target).clone()

		// apply most specific regex first matching all possible ways to write a dice notation
		// to account for all the nuances of DNDB dice notation.
		// numbers can be swapped for any number in the following comment
		// matches "1d10", " 1d10 ", "1d10+1", " 1d10+1 ", "1d10 + 1" " 1d10 + 1 "
		const damageRollRegexBracket = /(\()(([0-9]+d[0-9]+)\s?([+-]\s?[0-9]+)?)(\))/gi
		const damageRollRegex = /([:\s>])(([0-9]+d[0-9]+)\s?([+-]\s?[0-9]+)?)([:\s<,])/gi
		// matches " +1 " or " + 1 "
		const hitRollRegexBracket = /(?<![0-9]+d[0-9]+)(\()([+-]\s?[0-9]+)(\))/gi
		const hitRollRegex = /(?<![0-9]+d[0-9]+)([:\s>])([+-]\s?[0-9]+)([:\s<,])/gi
		const dRollRegex = /\s(\s?d[0-9]+)\s/gi
		const tableNoSpaceRollRegex = />(\s?d[0-9]+\s?)</gi
		const rechargeRegEx = /(Recharge [0-6]?\s?[–-]?\s?[0-6])/gi
		const actionType = "roll"
		const rollType = "AboveVTT"
		const updated = currentElement.html()
			.replaceAll(damageRollRegexBracket, `<button data-exp='$3' data-mod='$4' data-rolltype='damage' data-actiontype='${actionType}' class='avtt-roll-button' title='${actionType}'> $1$2$5</button>`)
			.replaceAll(damageRollRegex, `$1<button data-exp='$3' data-mod='$4' data-rolltype='damage' data-actiontype='${actionType}' class='avtt-roll-button' title='${actionType}'> $2</button>$5`)
			.replaceAll(hitRollRegexBracket, `<button data-exp='1d20' data-mod='$2' data-rolltype='to hit' data-actiontype=${actionType} class='avtt-roll-button' title='${actionType}'> $1$2$3</button>`)
			.replaceAll(hitRollRegex, `$1<button data-exp='1d20' data-mod='$2' data-rolltype='to hit' data-actiontype=${actionType} class='avtt-roll-button' title='${actionType}'> $2</button>$3`)
			.replaceAll(dRollRegex, ` <button data-exp='1$1' data-mod='0' data-rolltype='to hit' data-actiontype=${actionType} class='avtt-roll-button' title='${actionType}'> $1</button> `)
			.replaceAll(tableNoSpaceRollRegex, `><button data-exp='1$1' data-mod='0' data-rolltype='to hit' data-actiontype=${actionType} class='avtt-roll-button' title='${actionType}'> $1</button><`)
			.replaceAll(rechargeRegEx, `<button data-exp='1d6' data-mod='' data-rolltype='recharge' data-actiontype='Recharge' class='avtt-roll-button' title='${actionType}'> $1</button>`)
			
		
		let ignoreFormatting = $(currentElement).find('.ignore-abovevtt-formating');

		let slashCommandElements = $(currentElement).find('.abovevtt-slash-command-journal')
	
		let $newHTML = $(updated);
	    $newHTML.find('.ignore-abovevtt-formating').each(function(index){
			$(this).empty().append(ignoreFormatting[index].innerHTML);
	    })

	    $newHTML.find('.abovevtt-slash-command-journal').each(function(index){			
			const slashCommands = [...slashCommandElements[index].innerHTML.matchAll(multiDiceRollCommandRegex)];
			if (slashCommands.length === 0) return;
			console.debug("inject_dice_roll slashCommands", slashCommands);
			let updatedInnerHtml = slashCommandElements[index].innerHTML;
			try {
			  const diceRoll = DiceRoll.fromSlashCommand(slashCommands[0][0], window.PLAYER_NAME, window.PLAYER_IMG, "character", window.PLAYER_ID); // TODO: add gamelog_send_to_text() once that's available on the characters page without avtt running
			  updatedInnerHtml = updatedInnerHtml.replace(slashCommands[0][0], `<button class='avtt-roll-formula-button integrated-dice__container' title="${diceRoll.action?.toUpperCase() ?? "CUSTOM"}: ${diceRoll.rollType?.toUpperCase() ?? "ROLL"}" data-slash-command="${slashCommands[0][0]}">${diceRoll.expression}</button>`);
			} catch (error) {
			  console.warn("inject_dice_roll failed to parse slash command. Removing the command to avoid infinite loop", slashCommands, slashCommands[0][0]);
			  updatedInnerHtml = updatedInnerHtml.replace(slashCommands[0][0], '');
			}
			$(this).empty().append(updatedInnerHtml);
	    })

		
		
		


		$(target).html($newHTML);



		$(target).find('button.avtt-roll-button[data-rolltype]').each(function(){
			let rollAction = $(this).prevUntil('em>strong').find('strong').last().text().replace('.', '');
			rollAction = (rollAction == '') ? $(this).prev('strong').last().text().replace('.', '') : rollAction;
			rollAction = (rollAction == '') ? $(this).prevUntil('strong').last().prev().text().replace('.', '') : rollAction;
			rollAction = (rollAction == '') ? $(this).parent().prevUntil('em>strong').find('strong').last().text().replace('.', '') : rollAction;
			let rollType = $(this).attr('data-rolltype')
			let newStatBlockTables = $(this).closest('table').find('tbody tr:first th').text().toLowerCase();
			if(newStatBlockTables.includes('str') || newStatBlockTables.includes('int')){
				rollAction =  $(this).closest('tr').find('th').text();
				rollType = $(this).closest('td').index() == 2 ? 'Check' : 'Save'
			}
			else if($(this).closest('table').find('tr:first').text().toLowerCase().includes('str')){
				let statIndex = $(this).closest('table').find('tr button').index($(this));
				let stats = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']
				rollAction = stats[statIndex];
				rollType = 'Check'
			}

			if(rollAction == ''){
				rollAction = 'Roll';
			}	
			else if(rollAction.replace(' ', '').toLowerCase() == 'savingthrows'){	
				rollAction = $(this)[0].previousSibling.nodeValue.replace(/[\W]+/gi, '');
				rollAction = (rollAction == '') ? $(this).prev().text().replace(/[\W]+/gi, '') : rollAction;
				rollType = 'Save';	
			}
			else if(rollAction.replace(' ', '').toLowerCase() == 'skills'){
				rollAction = $(this)[0].previousSibling.nodeValue.replace(/[\W]+/gi, '');
				rollAction = (rollAction == '') ? $(this).prev().text().replace(/[\W]+/gi, '') : rollAction;
				rollType = 'Check';	
			}
			else if(rollAction.replace(' ', '').toLowerCase() == 'proficiencybonus'){
				rollAction = 'Proficiency Bonus';
				rollType = 'Roll';	
			}
			else if(rollAction.replace(' ', '').toLowerCase() == 'hp' || rollAction.replace(' ', '').toLowerCase() == 'hitpoints'){
				rollAction = 'Hit Points';
				rollType = 'Roll';	
			}
			else if(rollAction.replace(' ', '').toLowerCase() == 'initiative'){
				rollType = 'Roll';
			}
			
			$(this).attr('data-actiontype', rollAction);
			$(this).attr('data-rolltype', rollType);

			const followingText = $(this)[0].nextSibling?.textContent?.trim()?.split(' ')[0]
			
			const damageType = followingText && window.ddbConfigJson.damageTypes.some(d => d.name.toLowerCase() == followingText.toLowerCase()) ? followingText : undefined
			if(damageType != undefined){
				$(this).attr('data-damagetype', damageType);
			}
		})

		const tokenName = window.TOKEN_OBJECTS[tokenId]?.options?.name ? window.TOKEN_OBJECTS[tokenId]?.options?.name  : window.PLAYER_NAME
		const tokenImage = window.TOKEN_OBJECTS[tokenId]?.options?.imgsrc ? window.TOKEN_OBJECTS[tokenId]?.options?.imgsrc : window.PLAYER_IMG
		const entityType = tokenId ? "monster" : "character";

		// terminate the clones reference, overkill but rather be safe when it comes to memory
		currentElement = null


		
		$(target).find(".avtt-roll-button").click(clickHandler);
		$(target).find(".avtt-roll-button").on("contextmenu", rightClickHandler);

		$(target).find("button.avtt-roll-formula-button").off('click.avttRoll').on('click.avttRoll', function(clickEvent) {
		clickEvent.stopPropagation();

			const slashCommand = $(clickEvent.currentTarget).attr("data-slash-command");
			const followingText = $(clickEvent.currentTarget)[0].nextSibling?.textContent?.trim()?.split(' ')[0]
			const damageType = followingText && window.ddbConfigJson.damageTypes.some(d => d.name.toLowerCase() == followingText.toLowerCase()) ? followingText : undefined			
			const diceRoll = DiceRoll.fromSlashCommand(slashCommand, tokenName, tokenImage, entityType, tokenId, damageType); // TODO: add gamelog_send_to_text() once that's available on the characters page without avtt running
			window.diceRoller.roll(diceRoll, undefined, undefined, undefined, undefined, damageType);
		});
		$(target).find(`button.avtt-roll-formula-button`).off('contextmenu.rpg-roller').on('contextmenu.rpg-roller', function(e){
		  e.stopPropagation();
		  e.preventDefault();
		  let rollData = {}
		  if($(this).hasClass('avtt-roll-formula-button')){
		     rollData = DiceRoll.fromSlashCommand($(this).attr('data-slash-command'))
		     rollData.modifier = `${Math.sign(rollData.calculatedConstant) == 1 ? '+' : ''}${rollData.calculatedConstant}`
		  }
		  else{
		     rollData = getRollData(this)
		  }
		  
		  
		  if (rollData.rollType === "damage") {
		    damage_dice_context_menu(rollData.expression, rollData.modifier, rollData.rollTitle, rollData.rollType, tokenName, tokenImage, entityType, tokenId, damageType)
		      .present(e.clientY, e.clientX) // TODO: convert from iframe to main window
		  } else {
		    standard_dice_context_menu(rollData.expression, rollData.modifier, rollData.rollTitle, rollData.rollType, tokenName, tokenImage, entityType, tokenId)
		      .present(e.clientY, e.clientX) // TODO: convert from iframe to main window
		  }
		})


		console.groupEnd()
	}

    translateHtmlAndBlocks(target) {
    	let pastedButtons = target.find('.avtt-roll-button').add(target.find('.integrated-dice__container'));

		for(let i=0; i<pastedButtons.length; i++){
			$(pastedButtons[i]).replaceWith($(pastedButtons[i]).text());
		}
    	let data = $(target).clone().html();

        let lines = data.split(/(<br \/>|<br>|<p>|\n)/g);
        lines = lines.map((line, li) => {
            let input = line;
            input = input.replace(/&nbsp;/g,' ')


            // Remove space between letter ranges
            // e.g. a- b
            input = input.replace(/([a-z])- ([a-z])/gi, '$1$2');
            // Replace with right single quote
            input = input.replace(/'/g, '’');
            // e.g. Divine Touch. Melee Spell Attack:
            input = input.replace(
                /^(([a-z0-9]+([\s])?){1,7}\.)( (Melee|Ranged|Melee or Ranged) (Weapon|Spell) Attack:)?/gim,
                /(lair|legendary) actions/g.test(data)
                    ? '<strong>$1</strong>'
                    : '<em><strong>$1</strong>$4</em>'
            );
            // Emphasize hit
            input = input.replace(/Hit:/g, '<em>Hit:</em>');
            // Emphasize hit or miss
            input = input.replace(/Hit or Miss:/g, '<em>Hit or Miss:</em>');
  
        
            // Find cover rules
            input = input.replace(
                /(?<!]|;|#|\w|\-|<[^>]+)(hit dice|temporary hit points|inspiration|half cover|three-quarters cover|total cover|difficult terrain|falling|suffocating|lightly obscured|heavily obscured|climbing swimming crawling|surprise|flying|underwater|concentration)(?![^<]+>|\-|\w|\[)/gi,
                function(m){
                	if(m.startsWith('#') || m.startsWith('>'))
                		return m;
                	
                	let rulesId = window.ddbConfigJson.rules.filter((d) => d.name.localeCompare(m, undefined, { sensitivity: 'base' }) == 0)[0].id;
               		return `<a class="tooltip-hover condition-tooltip" href="/compendium/rules/basic-rules/combat#${m}" aria-haspopup="true" data-tooltip-href="//www.dndbeyond.com/rules/${rulesId}-tooltip" data-tooltip-json-href="//www.dndbeyond.com/conditions/${rulesId}/tooltip-json" target="_blank">${m}</a>`
                }
            );
            // Find conditions
            input = input.replace(
                /(?<!]|;|#|\w|<[^>]+)(blinded|charmed|deafened|exhaustion|frightened|grappled|incapacitated|invisible|paralyzed|petrified|poisoned|prone|restrained|stunned|unconscious)(?![^<]+>|\-|\w|\[)/gi,
                function(m){
                	if(m.startsWith('#') || m.startsWith('>'))
                		return m;
                	
                	let conditionId = window.ddbConfigJson.conditions.filter((d) => d.definition.name.localeCompare(m, undefined, { sensitivity: 'base' }) == 0)[0].definition.id;
               		return `<a class="tooltip-hover condition-tooltip" href="/compendium/rules/free-rules/rules-glossary${m}Condition" aria-haspopup="true" data-tooltip-href="//www.dndbeyond.com/conditions/${conditionId}-tooltip" data-tooltip-json-href="//www.dndbeyond.com/conditions/${conditionId}/tooltip-json" target="_blank">${m}</a>`
                }
            );
            // Find skills
            input = input.replace(
                /(?<!]|;|#|\-|\w|<[^>]+)(athletics|acrobatics|sleight of hand|stealth|arcana|history|investigation|nature|religion|animal handling|insight|medicine|perception|survival|deception|intimidation|performance|persuasion)(?![^<]+>|\-|\w|\[)/gi,
                function(m){

                	
                	let skillId = window.ddbConfigJson.abilitySkills.filter((d) => d.name.localeCompare(m, undefined, { sensitivity: 'base' }) == 0)[0].id;
               		return `<a class="tooltip-hover skill-tooltip" href="/compendium/rules/basic-rules/using-ability-scores#${m}" aria-haspopup="true" data-tooltip-href="//www.dndbeyond.com/skills/${skillId}-tooltip" data-tooltip-json-href="//www.dndbeyond.com/skills/${skillId}/tooltip-json" target="_blank">${m}</a>`
                }

            );
            // Find opportunity attacks
            input = input.replace(
                /(?<!]|;|#|\-|\w|<[^>]+)(opportunity attack)s(?![^<]+>|\[)|(?<!\]|;|#|<[^>]+)(opportunity attack)(?![^<]+>|\-|\w|\[)/gi,
                function(m){
               		return `<a class="tooltip-hover skill-tooltip" href="" aria-haspopup="true" data-tooltip-href="//www.dndbeyond.com/actions/1001-tooltip" data-tooltip-json-href="//www.dndbeyond.com/skills/1001/tooltip-json" target="_blank">${m}</a>`
                }
            );

            // Find senses
            input = input.replace(
                /(?<!]|;|#|\w|\-|<[^>]+)(truesight|blindsight|darkvision|tremorsense)(?![^<]+>|\-|\w|\[)/gi,
                 function(m){
                	
                	let senseId = window.ddbConfigJson.senses.filter((d) => d.name.localeCompare(m, undefined, { sensitivity: 'base' }) == 0)[0].id;
               		return `<a class="tooltip-hover skill-tooltip" href="" aria-haspopup="true" data-tooltip-href="//www.dndbeyond.com/senses/${senseId}-tooltip" data-tooltip-json-href="//www.dndbeyond.com/skills/${senseId}/tooltip-json" target="_blank">${m}</a>`
                }
            );

            // Find actions
            input = input.replace(
                /(?<!]|;|#|\w|\-|<[^>]+)(attack action|magic action|dash|disengage|dodge|help|hide|ready|search|utilize|opportunity attack|grapple|shove|improvise|two-weapon fighting|interact with an object|study|influence)(?![^<]+>|\-|\w|\[)/gim,
                function(m){
                	let compare = m;
     				if(m.toLowerCase().includes(' action'))
     					compare = m.toLowerCase().replace(' action', '');
                	
                	let actionId = window.ddbConfigJson.basicActions.filter((d) => d.name.localeCompare(compare, undefined, { sensitivity: 'base' }) == 0)[0].id;
               		return `<a class="tooltip-hover skill-tooltip" href="" aria-haspopup="true" data-tooltip-href="//www.dndbeyond.com/actions/${actionId}-tooltip" data-tooltip-json-href="//www.dndbeyond.com/skills/${actionId}/tooltip-json" target="_blank">${m}</a>`
                }
            );

            // Add parens for escape dc
            input = input.replace(/ escape DC/g, ' (escape DC');
            input = input.replace(/(DC )(\d+) (\:|\.|,)/g, '$1$2)$3');
            // Fix parens for dice
            // e.g. (3d6 + 12) thunder
            input = input.replace(/\(?(\d+d\d+( \+ \d+)?)\)? ? (\w)/g, '($1) $3');
            // Try to find spells
            input = input.replace(
                / (the|a|an) (([\w]+ ?){1,4}) spell(\.|\:|,)/g,
                ' $1 [spell]$2[/spell] spell$4'
            );
            // another spell attempt
            input = input.replace(
                /casts (([\w]+ ?){1,4}),/g,
                'casts [spell]$1[/spell],'
            );
            // Search for spell casting section
            const spellcasting = lines.findIndex((l) =>
                l.match(/Spellcasting([^.]+)?./g)
            );
            // If we find the section, loop through the levels
            if (
                spellcasting >= 0 &&
                spellcasting < li &&
                (input.startsWith('At will:') ||
                    input.startsWith('Cantrips (at will):') ||
                    input.match(/(\d+\/day( each)?|\d+\w+ level \(\d slots?\))\:/gi))
            ) {
            	let eachNumberFound = (input.match(/\d+\/day( each)?/gi)) ? parseInt(input.match(/[0-9]+(?![0-9]?px)/gi)[0]) : undefined;
            	let slotsNumberFound = (input.match(/\d+\w+ level \(\d slots?\)\:/gi)) ? parseInt(input.match(/[0-9]+/gi)[1]) : undefined;
            	let spellLevelFound = (slotsNumberFound) ? input.match(/\d+\w+ level/gi)[0] : undefined;
                let parts = input.split(/:\s(?<!left:\s?)/g);
                parts[1] = parts[1].split(/,\s(?![^(]*\))/gm);
                for (let p in parts[1]) {
                	let spellName = (parts[1][p].startsWith('<a')) ? $(parts[1][p]).text() : parts[1][p].replace(/<\/?p[a-zA-z'"0-9\s]+?>/g, '').replace(/\s?\[spell\]\s?|\s?\[\/spell\]\s?/g, '').replace('[/spell]', '').replace(/\s|&nbsp;/g, '');

                	if(parts[1][p].startsWith('<') || parts[1][p].startsWith('[spell]') ){
						parts[1][p] = parts[1][p]
                            .replace(/^/gm, ``)
                            .replace(/( \(|(?<!\))$)/gm, '');
                	}
                   	else if(parts[1][p] && typeof parts[1][p] === 'string') {
                        parts[1][p] = parts[1][p].split('<')[0]
                            .replace(/^/gm, `[spell]`)
                            .replace(/( \(|(?<!\))$)/gm, '[/spell]');
                    }

                    if(eachNumberFound){
                    	parts[1][p] = `<span class="add-input each" data-number="${eachNumberFound}" data-spell="${spellName}">${parts[1][p]}</span>`
                    }
                }
                parts[1] = parts[1].join(', ');
                input = parts.join(': ');
                if(slotsNumberFound){
                	input = `<span class="add-input slots" data-number="${slotsNumberFound}" data-spell="${spellLevelFound}">${input}</span>`
                }
            }

            input = input.replace(/\[spell\](.*?)\[\/spell\]/g, function(m){
            	let spell = m.replace(/<\/?p>/g, '').replace(/\s?\[spell\]\s?|\s?\[\/spell\]\s?/g, '').replace('[/spell]', '');   	
            	const spellUrl = spell.replace(/\s/g, '-').split(';')[0];;
            	spell = (spell.split(';')[1]) ? spell.split(';')[1] : spell;
                return `<a class="tooltip-hover spell-tooltip" href="https://www.dndbeyond.com/spells/${spellUrl}" aria-haspopup="true" target="_blank">${spell}</a>`
            })
             input = input.replace(/\[item\](.*?)\[\/item\]/g, function(m){
            	let item = m.replace(/<\/?p>/g, '').replace(/\s?\[item\]\s?|\s?\[\/item\]\s?/g, '').replace('[/item]', '');   	
            	const itemUrl = item.replace(/\s/g, '-').split(';')[0];;
            	item = (item.split(';')[1]) ? item.split(';')[1] : item;
                return `<a class="tooltip-hover item-tooltip" href="https://www.dndbeyond.com/equipment/${itemUrl}" aria-haspopup="true" target="_blank">${item}</a>`
            })
               input = input.replace(/\[wprop\](.*?)\[\/wprop\]/g, function(m){
            	let wprop = m.replace(/<\/?p>/g, '').replace(/\s?\[wprop\]\s?|\s?\[\/wprop\]\s?/g, '').replace('[/wprop]', '');   	
            	const wpropUrl = wprop.replace(/\s/g, '-').split(';')[0];;
            	wprop = (wprop.split(';')[1]) ? wprop.split(';')[1] : wprop;
                return `<a class="tooltip-hover wprop-tooltip" href="https://www.dndbeyond.com/weapon-properties/${wpropUrl}" aria-haspopup="true" target="_blank">${wprop}</a>`
            })
            input = input.replace(/\[roll\](.*?)\[\/roll\]/g, function(m){
            	let roll = m.replace(/<\/?p>/g, '').replace(/\s?\[roll\]\s?|\s?\[\/roll\]\s?/g, '').replace('[/roll]', '');   	
                return `<span class="abovevtt-slash-command-journal">${roll}</span>`
            })

            

            input = input.replace(/\[monster\](.*?)\[\/monster\]/g, function(m){
            	let spell = m.replace(/<\/?p>/g, '').replace(/\s?\[monster\]\s?|\s?\[\/monster\]\s?/g, '').replace('[/monster]', '');   	
            	const spellUrl = spell.replace(/\s/g, '-').split(';')[0];;
            	spell = (spell.split(';')[1]) ? spell.split(';')[1] : spell;
                return `<a class="tooltip-hover monster-tooltip" href="https://www.dndbeyond.com/monsters/${spellUrl}" aria-haspopup="true" target="_blank">${spell}</a>`
            })

            input = input.replace(/\[magicItem\](.*?)\[\/magicItem\]/g, function(m){
            	let spell = m.replace(/<\/?p>/g, '').replace(/\s?\[magicItem\]\s?|\s?\[\/magicItem\]\s?/g, '').replace('[/magicItem]', '');   	
            	const spellUrl = spell.replace(/\s/g, '-').split(';')[0];
            	spell = (spell.split(';')[1]) ? spell.split(';')[1] : spell;
                return `<a class="tooltip-hover magic-item-tooltip" href="https://www.dndbeyond.com/magic-items/${spellUrl}" aria-haspopup="true" target="_blank">${spell}</a>`
            })


 
            input = input.replace(/\&nbsp\;/g, ' ');
            // Replace quotes to entity
            input = input.replace(/\'/g, '&rsquo;');
            return input;
        });

	    let newHtml = lines.join('');
	    let ignoreFormatting = $(data).find('.ignore-abovevtt-formating');
	
		let $newHTML = $(newHtml);
	    $newHTML.find('.ignore-abovevtt-formating').each(function(index){
			$(this).empty().append(ignoreFormatting[index].innerHTML);
	    })


        $(target).html($newHTML);
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

	edit_note(id, statBlock = false){
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
			width: 860,
			height: 600,
			position: {
			   my: "center",
			   at: "center-200",
			   of: window
			},
			open: function(event, ui){
				let btn_view=$(`<button class='journal-view-button journal-button'><img height="10" src="${window.EXTENSION_PATH}assets/icons/view.svg"></button>"`);
				$(this).siblings('.ui-dialog-titlebar').prepend(btn_view);
				btn_view.click(function(){	
					self.close_all_notes();
					self.display_note(id, statBlock);
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
			      { title: 'Stat Block Paper (1 Column)', block: 'div', wrapper: true, classes: 'Basic-Text-Frame stat-block-background one-column-stat' },
			      { title: 'Stat Block Paper (2 Column)', block: 'div', wrapper: true, classes: 'Basic-Text-Frame stat-block-background' },
			      { title: 'For DM Eyes Online', block: 'div', wrapper: true, classes: 'dm-eyes-only' },
			      { title: 'Ignore AboveVTT auto formating', inline: 'span', wrapper: true, classes: 'ignore-abovevtt-formating' },
			    ] },
			    { title: 'Custom Statblock Stats', items: [
			      { title: 'AC', inline: 'b', classes: 'custom-ac custom-stat'},
			      { title: 'Average HP', inline: 'b',classes: 'custom-avghp custom-stat' },
			      { title: 'HP Roll', inline: 'b', classes: 'custom-hp-roll custom-stat' },
			      { title: 'Initiative', inline: 'b', classes: 'custom-initiative custom-stat' },
			      { title: 'Custom PC Sheet Link', inline: 'b', classes: 'custom-pc-sheet custom-stat' },
			      { title: 'AboveVTT Slash Command Roll Button', inline: 'span', classes: 'abovevtt-slash-command-journal custom-stat' }
			   	]}
			],
			plugins: 'save,hr,image,link,lists,media,paste,tabfocus,textcolor,colorpicker,autoresize, code, table, template',
			add_toolbar: "template",
			templates: [
			    {
			      "title": "2014 Monster Sheet",
			      "description": "Add a monster sheet template",
			      "content": `<div class="Basic-Text-Frame stat-block-background one-column-stat" style="font-family: 'Scala Sans Offc', Roboto, Helvetica, sans-serif;">
								<div class="mon-stat-block__name"><span class="mon-stat-block__name-link"> Bandit Captain <br /></span></div>
								<div class="mon-stat-block__meta">Medium Humanoid (Any Race), Any Non-Lawful Alignment</div>
								<p><img class="mon-stat-block__separator-img" src="https://www.dndbeyond.com/file-attachments/0/579/stat-block-header-bar.svg" alt="" /></p>
								<p><strong>Armor Class</strong>&nbsp;15&nbsp;(studded leather)<br /><strong>Hit Points</strong>&nbsp;65&nbsp;(10d8 + 20)<br /><strong>Speed</strong>&nbsp;30 ft</p>
								<p><img class="mon-stat-block__separator-img" src="https://www.dndbeyond.com/file-attachments/0/579/stat-block-header-bar.svg" alt="" /></p>
								<table style="height: 61px;" width="364" cellspacing="0" cellpadding="0">
								<tbody>
								<tr>
								<td style="text-align: center;"><strong>STR</strong></td>
								<td style="text-align: center;"><strong>DEX</strong></td>
								<td style="text-align: center;"><strong>CON</strong></td>
								<td style="text-align: center;"><strong>INT</strong></td>
								<td style="text-align: center;"><strong>WIS</strong></td>
								<td style="text-align: center;"><strong>CHA</strong></td>
								</tr>
								<tr>
								<td style="text-align: center;"><span style="font-size: 10pt;">15&nbsp;</span></td>
								<td style="text-align: center;"><span style="font-size: 10pt;">16&nbsp;</span></td>
								<td style="text-align: center;"><span style="font-size: 10pt;">14&nbsp;</span></td>
								<td style="text-align: center;"><span style="font-size: 10pt;">14&nbsp;</span></td>
								<td style="text-align: center;"><span style="font-size: 10pt;">11</span></td>
								<td style="text-align: center;"><span style="font-size: 10pt;">14&nbsp;</span></td>
								</tr>
								<tr>
								<td style="text-align: center;"><span style="font-size: 10pt;">(+2)</span></td>
								<td style="text-align: center;"><span style="font-size: 10pt;">(+3)</span></td>
								<td style="text-align: center;"><span style="font-size: 10pt;">(+2)</span></td>
								<td style="text-align: center;"><span style="font-size: 10pt;">(+2)</span></td>
								<td style="text-align: center;"><span style="font-size: 10pt;">(+0)</span></td>
								<td style="text-align: center;"><span style="font-size: 10pt;">(+2)</span></td>
								</tr>
								</tbody>
								</table>
								<p><img class="mon-stat-block__separator-img" src="https://www.dndbeyond.com/file-attachments/0/579/stat-block-header-bar.svg" alt="" /></p>
								<p><strong>Saving Throws</strong>&nbsp;STR +4, DEX +5, WIS +2<br /><strong>Skills&nbsp;</strong>Athletics&nbsp;+4,&nbsp;Deception&nbsp;+4<br /><strong>Senses&nbsp;</strong>Passive Perception 10<br /><strong>Languages&nbsp;</strong>Any two languages<br /><strong>Challenge&nbsp;</strong>2 (450 XP)&nbsp; &nbsp;<strong>Proficiency Bonus</strong>&nbsp;+2<br /><br /><img class="mon-stat-block__separator-img" src="https://www.dndbeyond.com/file-attachments/0/579/stat-block-header-bar.svg" alt="" /><br />&nbsp;</p>
								<div class="mon-stat-block__description-block-heading">Actions</div>
								<p><br />Multiattack.&nbsp;The captain makes three melee attacks: two with its scimitar and one with its dagger. Or the captain makes two ranged attacks with its daggers.</p>
								<p>Scimitar.&nbsp;Melee Weapon Attack:&nbsp;DC 17 |&nbsp;+5&nbsp;to hit, reach 5 ft., one target.&nbsp;Hit:&nbsp;6&nbsp;(1d6 + 3)&nbsp;slashing damage.</p>
								<p>Dagger.&nbsp;Melee or&nbsp;Ranged Weapon Attack:&nbsp;DC 17 |&nbsp;+5&nbsp;to hit, reach 5 ft. or range 20/60 ft., one target.&nbsp;Hit:&nbsp;5&nbsp;(1d4 + 3)&nbsp;piercing damage.</p>
								<p><img class="mon-stat-block__separator-img" src="https://www.dndbeyond.com/file-attachments/0/579/stat-block-header-bar.svg" alt="" /></p>
								<div class="mon-stat-block__description-block-heading">Reactions</div>
								<p><br />Parry.&nbsp;The captain adds 2 to its AC against one melee attack that would hit it. To do so, the captain must see the attacker and be wielding a melee weapon.</p>
					</div>`
			    },
			    {
			    	"title": "2024 Monster Sheet",
			    	"description": "Add a monster sheet template",
			    	"content": `<div class="stat-block">
						<div class="monster-header">Skeleton</div>
						<p>Medium Undead, Lawful Evil</p>
						<p><strong>AC</strong> 13 <strong>Initiative</strong> +3 (13)</p>
						<p><strong>HP</strong> 13 (2d8 + 4)</p>
						<p><strong>Speed</strong> 30 ft.</p>
						<div class="stats">
						<div class="table-overflow-wrapper">
						<table class="physical abilities-saves">
						<thead>
						<tr>
						<th>&nbsp;</th>
						<th>&nbsp;</th>
						<th>Mod</th>
						<th>Save</th>
						</tr>
						</thead>
						<tbody>
						<tr>
						<th>STR</th>
						<td>10</td>
						<td>+0</td>
						<td>+0</td>
						</tr>
						<tr>
						<th>DEX</th>
						<td>16</td>
						<td>+3</td>
						<td>+3</td>
						</tr>
						<tr>
						<th>CON</th>
						<td>15</td>
						<td>+2</td>
						<td>+2</td>
						</tr>
						</tbody>
						</table>
						</div>
						<div class="table-overflow-wrapper">
						<table class="mental abilities-saves">
						<thead>
						<tr>
						<th>&nbsp;</th>
						<th>&nbsp;</th>
						<th>Mod</th>
						<th>Save</th>
						</tr>
						</thead>
						<tbody>
						<tr>
						<th>INT</th>
						<td>6</td>
						<td>-2</td>
						<td>-2</td>
						</tr>
						<tr>
						<th>WIS</th>
						<td>8</td>
						<td>-1</td>
						<td>-1</td>
						</tr>
						<tr>
						<th>CHA</th>
						<td>5</td>
						<td>-3</td>
						<td>-3</td>
						</tr>
						</tbody>
						</table>
						</div>
						</div>
						<p><strong>Vulnerabilities</strong> Bludgeoning</p>
						<p><strong>Immunities</strong> Poison; Exhaustion, Poisoned</p>
						<p><strong>Gear</strong> Shortbow, Shortsword</p>
						<p><strong>Senses&nbsp;</strong>Darkvision 60 ft., Passive Perception 9</p>
						<p><strong>Languages</strong> Understands the languages it knew in life but can&rsquo;t speak</p>
						<p><strong>CR</strong> 1/4 (XP 50; PB +2)</p>
						<p class="monster-header">Actions</p>
						<p><strong><em>Shortsword.</em></strong> <em>Melee Attack Roll:</em> +5, reach 5 ft. <em>Hit:</em> 6 (1d6 + 3) Piercing damage.</p>
						<p><strong><em>Shortbow.</em></strong> <em>Ranged Attack Roll:</em> +5, range 80/320 ft. <em>Hit:</em> 6 (1d6 + 3) Piercing damage.</p>
						</div>`
			    },
			    {
			    	"title": "Caster Spell List",
			    	"description": "Add a spell block for casters.",
			    	"content": `<p>Spellcasting. The mage is a 9th-level spellcaster. Its spellcasting ability is Intelligence (spell save DC 14, +6 to hit with spell attacks). The mage has the following wizard spells prepared:</p>
<p>Cantrips (at will): fire bolt, light, mage hand, prestidigitation</p>
<p>1st level (4 slots): detect magic, mage armor, magic missile, shield</p>
<p>2nd level (3 slots): misty step, suggestion</p>
<p>3rd level (3 slots): counterspell, fireball, fly</p>
<p>4th level (3 slots): greater invisibility, ice storm</p>
<p>5th level (1 slot): cone of cold</p>`
			    },
			],
			toolbar1: 'undo styleselect template | horizontalrules | bold italic underline strikethrough | alignleft aligncenter alignright justify| outdent indent | bullist numlist | forecolor backcolor | fontsizeselect | link unlink | image media | table | code',
			image_class_list: [
				{title: 'Magnify', value: 'magnify'},
			],
			external_plugins: {
				'image': "/content/1-0-1688-0/js/tinymce/tiny_mce/plugins/image/plugin.min.js",
			},
			link_class_list: [
			   {title: 'External Link', value: 'ext_link'},
			   {title: 'DDB Sourcebook Link', value: 'int_source_link'},
			   {title: 'DDB Tooltip Link (Spells, Monsters, Magic Items)', value: 'tooltip-hover'}
			],
			valid_children : '+body[style]',
			setup: function (editor) { 
				editor.addButton('horizontalrules', {
					  type: 'splitbutton',
				      text: '',
				      icon: 'hr',
				      tooltip: 'Horizontal Rules',
				      menu: [
				          {			     
				            icon: 'hr',
				            text: 'Statblock Seperator',
				            onclick: (e) => {e.preventDefault(); e.stopPropagation(); editor.insertContent(`<img class="mon-stat-block__separator-img" alt="" src="https://www.dndbeyond.com/file-attachments/0/579/stat-block-header-bar.svg"/>`)},
				      
				          },
				          {
				            icon: 'hr',
				            text: 'Horizontal Rule',
				            onclick: (e) => {e.preventDefault(); e.stopPropagation(); editor.insertContent(`<hr>`)},
				          }
				        ],
				      onclick: (e) => {e.preventDefault(); e.stopPropagation(); editor.insertContent(`<img class="mon-stat-block__separator-img" alt="" src="https://www.dndbeyond.com/file-attachments/0/579/stat-block-header-bar.svg"/>`)},
				    });
				editor.on('NodeChange', async function (e) {
					// When an image is inserted into the editor
				    if (e.element.tagName === "IMG") { 
				    	let url = e.element.getAttribute('src');
				    	if (url.startsWith("https://drive.google.com") && url.indexOf("uc?id=") < 0) {
		                    const parsed = 'https://drive.google.com/uc?id=' + url.split('/')[5];
		                    console.log("parse drive audio is converting", url, "to", parsed);
		                    url = parsed;
		                }
		                else if(url.includes('dropbox.com')){       
		                    const splitUrl = url.split('dropbox.com');
		                    const parsed = `https://dl.dropboxusercontent.com${splitUrl[splitUrl.length-1]}`
		                    console.log("parse dropbox audio is converting", url, "to", parsed);
		                    url = parsed;
		                }

				        e.element.setAttribute("src", await getGoogleDriveAPILink(url));
				        return; 
				    }
				    return;
				});
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
				.abovevtt-mon-stat-block__separator{
		    		max-width: 100%;
				    min-height: 30px;
				    margin: 0px;
				    background: url('https://media-waterdeep.cursecdn.com/file-attachments/0/579/stat-block-header-bar.svg') center center no-repeat
				}
				.dm-eyes-only{
				    border: 1px solid #000;
				    border-radius: 5px;
				    background: #f5f5f5;
				    padding: 0px 5px;
				    margin: 9px 10px;
					display: ${window.DM ? 'block' : 'none'};
					position: relative;
				}
				.dm-eyes-only:before {
				    display:block;
				    position:absolute;
				    content:'DM Eyes Only';
				    top: -10px;
				    right: 2px;
				    float:right;
				    border:1px #000 solid;
				    border-radius:5px;
				    background: #f5f5f5;
				    font-weight: bold;
				    font-size:10px;
				    padding:0px 4px;
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
				.one-column-stat {
					-webkit-column-count:1;
					column-count: 1;
				}
				.Basic-Text-Frame-2 {
				    border: 1px solid #d4d0ce;
				    background: white;
				    padding: 15px
				}
				.ignore-abovevtt-formating{
					border: 2px dotted #b100ff;
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
				  .custom-stat{
				  	font-weight:bold;
				  	border: 1px dotted #666;
				  }
				  .custom-avghp.custom-stat
			      {

			      	color: #F00;
			      }
			      
			      .custom-hp-roll.custom-stat
			      {
			      	color: #8f03b3;
			      }
			      
			      .custom-initiative.custom-stat{
			      	color: #007900;
			      }

			      .custom-pc-sheet.custom-stat{
			      	color: #08a1e3;
			      }

			      .abovevtt-slash-command-journal{
			      	color: #b43c35;
			      }
				  
			      .custom-ac.custom-stat{
			      	color: #00F;
			      }
			      /***** NEW STAT BLOCKS ****/


			      .stat-block {
			          --compendium-p-bottom: 0;
			          border: 1px solid #a7a3a0;
			          background-color: #fefcef;
			          padding: 10px;
			          position: relative;
			          background-repeat: no-repeat;
			          box-shadow: 0 5px 8px 0 var(--stat-block-shadow,#aaa);
			          background-position: top;
			          background: var(--stat-block-bg-override,#f6f3ee);
			          font-size: 16px;
			          line-height: 19.6px;
			          border-radius: 8px;
			          outline: 1px solid #a7a3a0;
			          outline-offset: -4px;
			          font-family: var(--stat-block-font,Roboto,Helvetica,sans-serif);
			          columns: 384px 2
			      }

			      .stat-block :is(h2,h3,h4,h5) {
			          --header-font-override: 22px;
			          font-family: Roboto Condensed;
			          text-transform: uppercase;
			          font-weight: 700;
			          margin-right: 8px;
			          margin-block-end:0}

			      .stat-block :is(h2,h3,h4,h5):after {
			          content: "";
			          display: block;
			          width: 100%;
			          margin: 2px auto 8px;
			          height: 1px;
			          background: var(--monster-header-underline,#7a3c2f);
			          column-span: all
			      }

			      .stat-block p {
			          break-inside: avoid;
			          font-size: 15px;
			          line-height: 1.4
			      }

			      .stat-block p+p {
			          --compendium-p-top: 10px
			      }

			       .stat-block p:first-of-type {
			          margin-top: 0;
			          font-style: italic;
			          opacity: .8
			      }

			      .stat-block p:first-of-type+p {
			          --compendium-p-top: 16px
			      }

			      .stat-block :is(ol,ul,dl) {
			          margin-bottom: 0;
			          padding-top: 0
			      }

			      .stat-block .monster-header {
			          padding-top: 4px;
			          letter-spacing: .35px;
			          font-weight: 500;
			          color: var(--monster-header-color,#5b160c);
			          font-size: var(--monster-trait-header-size,18px);
			          font-family: var(--monster-trait-header-font,"Roboto Condensed",Helvetica,sans-serif);
			          border-bottom: 2px solid var(--monster-header-underline,#7a3c2f)
			      }

			      .stat-block .monster-header+p {
			          break-before: avoid
			      }

			      .stat-block .stats {
			          display: flex;
			          gap: 10px
			      }

			      .stat-block .stats+p {
			          margin-top: 10px
			      }

			      .stat-block .stats table.abilities-saves {
			          --theme-table-row-color: transparent;
			          flex: 1 1 auto;
			          line-height: 24px;
			          background: revert;
			          border: none;
			          font-size: 16px;
			          break-inside: avoid
			      }

			      .stat-block .stats table.abilities-saves.physical {
			          --stats-score: #ede6d9;
			          --stats-mods: #ded4cc;
			          --stats-score-hover: rgba(153,127,109,0.49019607843137253);
			          --stats-mods-hover: rgba(153,109,114,0.49019607843137253)
			      }

			      .stat-block .stats table.abilities-saves.mental {
			          --stats-score: #d8dad1;
			          --stats-mods: #d0caca;
			          --stats-score-hover: rgba(109,141,153,0.49019607843137253);
			          --stats-mods-hover: rgba(117,109,153,0.49019607843137253)
			      }

			      .stat-block .stats table.abilities-saves thead {
			          border: none;
			          height: revert;
			          min-height: 45px
			      }

			      .stat-block .stats table.abilities-saves thead tr {
			          height: revert;
			          min-height: 45px
			      }

			      .stat-block .stats table.abilities-saves thead tr th {
			          padding: 5px 2px 0!important;
			          background: inherit;
			          color: inherit;
			          vertical-align: bottom;
			          border: none;
			          text-transform: uppercase;
			          font-weight: 500;
			          font-size: 14px
			      }

			      .stat-block .stats table.abilities-saves tbody {
			          border: none
			      }

			      .stat-block .stats table.abilities-saves tbody tr {
			          background-color: var(--theme-table-row-color,#fdfdfd);
			          color: var(--theme-table-header-fg-color,#222)
			      }

			      .stat-block .stats table.abilities-saves tbody tr:hover {
			          background-color: var(--stats-hover)
			      }

			      .stat-block .stats table.abilities-saves tbody tr:hover :nth-child(-n+3) {
			          background-color: var(--stats-score-hover)
			      }

			      .stat-block .stats table.abilities-saves tbody tr:hover :nth-child(n+3) {
			          background-color: var(--stats-mods-hover)
			      }

			      .stat-block .stats table.abilities-saves tbody tr :nth-child(-n+3) {
			          background-color: var(--stats-score)
			      }

			      .stat-block .stats table.abilities-saves tbody tr :nth-child(n+3) {
			          background-color: var(--stats-mods)
			      }

			      .stat-block .stats table.abilities-saves tbody th {
			          text-transform: uppercase;
			          font-weight: 700;
			          border: none;
			          padding-left: 6px;
			          font-size: 16px
			      }

			      .stat-block .stats table.abilities-saves tbody td {
			          min-width: revert;
			          padding: 5px 10px!important;
			          border: none;
			          font-size: 16px
			      }

			      .stat-block .stats table.abilities-saves tr :is(th,td) {
			          transition: .3s
			      }

			      .stat-block p:nth-of-type(2) strong+strong {
			          margin-left: 30px
			      }
			      .stat-block figure {
			          position: static;
			          margin: 0 auto
			      }

			      .stat-block figure .artist-credit {
			          text-align: end;
			          right: 0;
			          left: 0;
			          bottom: -6px;
			          top: unset
			      }

			      *+.stat-block {
			          margin-top: 24px
			      }

			      /***** END NEW STAT BLOCKS ****/
				`,
			save_onsavecallback: function(e) {
				// @todo !IMPORTANT grab the id somewhere from the form, so that you can use this safely
				let note_id = $(this.getElement()).attr('data-note-id');
				self.notes[note_id].text =tinymce.activeEditor.getContent();
				self.notes[note_id].plain=tinymce.activeEditor.getContent({ format: 'text' });
				self.notes[note_id].statBlock=statBlock;
				self.statBlocks = Object.fromEntries(Object.entries(self.notes).filter(([key, value]) => self.notes[key].statBlock == true))
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


function tinyWrapper(){

}
function init_journal(gameid){
	
	["/content/1-0-1688-0/js/tinymce/tiny_mce/tinymce.min.js"].forEach(function(value) {
		let s = document.createElement('script');
		s.src = value;
		(document.head || document.documentElement).appendChild(s);
	});

	["https://www.dndbeyond.com/content/1-0-1697-0/js/tinymce/custom_skin/skin.min.css"].forEach(function(value){
		let l = document.createElement('link');
		
		l.href = value;
		l.rel = "stylesheet";
		(document.head || document.documentElement).appendChild(l);
	});
	
	
	
	window.JOURNAL=new JournalManager(gameid);

	window.JOURNAL.build_journal();
	
	
}

function render_source_chapter_in_iframe(url) {
	const sourceChapter = url.startsWith('https://www.dndbeyond.com/sources/') || url.startsWith('/sources/');
	const compendiumChapter = url.startsWith('https://www.dndbeyond.com/compendium/') || url.startsWith('/compendium/');
	const attachmentChapter = url.startsWith('https://www.dndbeyond.com/attachments/') || url.startsWith('/attachments/');
	const rulesChapter = url.startsWith('https://dndbeyond.com/magic-items') || url.startsWith('https://dndbeyond.com/feats') || url.startsWith('https://dndbeyond.com/spells')
	if (typeof url !== "string" ||  (!sourceChapter && !compendiumChapter && !attachmentChapter && !rulesChapter)) {
		console.error(`render_source_chapter_in_iframe was given an invalid url`, url);
		showError(new Error(`Unable to render a DDB chapter. This url does not appear to be a valid DDB chapter ${url}`));
	}
	if(rulesChapter == true){
		if(url.includes('?')){
			url = `${url}&filter-partnered-content=t`
		}
		else{
			url = `${url}?filter-partnered-content=t`
		}
	}
	const chapterHash = url.split("#")?.[1];
	const iframeId = 'sourceChapterIframe';
	const containerId = `${iframeId}_resizeDrag`;
	const container = find_or_create_generic_draggable_window(containerId, 'Source Book', true, true, `#${iframeId}`);

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
			"height": "calc(100% - 15px)",
			"position": "absolute",
			"top": "15px",
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
		$(event.target).contents().find("body[class*='marketplace']").replaceWith($("<div id='noAccessToContent' style='height: 100%;text-align: center;width: 100%;padding: 10px;font-weight: bold;color: #944;'>You do not have access to this content on DndBeyond.</div>"));
		const iframeContents = $(event.target).contents();

		iframeContents.find(".site-bar").hide();

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
			iframeContents.find("#content .secondary-content").hide();
			iframeContents.find("article .p-article-header").hide();
			iframeContents.find("body").css('background', '#f9f9f9 url(../images/background_texture.png) repeat');
		}

		iframeContents.find("body").append($(`<style id='ddbSourceStyles'>

		body, html body.responsive-enabled{
			background: var(--theme-page-bg-image-1024, url('')) no-repeat center 0px, var(--theme-page-bg-color,#f9f9f9) !important;
			background-position: center 0px !important;
		}
		#site-main header.main[role="banner"]{
			display:none;
		}
		</style>`))

		$(this).siblings('.sidebar-panel-loading-indicator').remove();
	});

	iframe.attr('src', url);
}
