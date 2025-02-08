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
		let promises = [];

		let objectStore = gameIndexedDb.transaction(["journalData"]).objectStore(`journalData`)
		
		
	   	promises.push(new Promise((resolve) => { 
		   	objectStore.get(`Journal`).onsuccess = (event) => {
			 	if(event?.target?.result?.journalData){
			 		this.notes = event?.target?.result?.journalData	
				}
				else {
				  	if (window.DM && (localStorage.getItem('Journal' + gameid) != null)) {
				  		this.notes = $.parseJSON(localStorage.getItem('Journal' + gameid));
				  	}
				  	else{
				  		this.notes={};
				  	}
				}
				let statBlockPromise = new Promise((resolve) => {
					let globalObjectStore = globalIndexedDB.transaction(["journalData"]).objectStore(`journalData`)
					if(window.DM){
				  		globalObjectStore.get(`JournalStatblocks`).onsuccess = (event) => {
						 	if(event?.target?.result?.journalData){
							 	this.notes = {
									...this.notes,
									...event?.target?.result?.journalData
								}			
							}
							else {
								if((localStorage.getItem('JournalStatblocks') != null && localStorage.getItem('JournalStatblocks') != 'undefined')){
							  		this.notes = {
							  			...this.notes,
							  			...$.parseJSON(localStorage.getItem('JournalStatblocks'))
							  		}
							  	}
							}
							resolve(true);
						}
					}

					else{
				  		globalObjectStore.get(`JournalStatblocks_${window.CAMPAIGN_INFO.dmId}`).onsuccess = (event) => {
						 	if(event?.target?.result?.journalData){
							 	this.notes = {
									...this.notes,
									...event?.target?.result?.journalData
								}			
							}
							resolve(true);
						}
					}
				})

				statBlockPromise.then(()=>{resolve(true)});
				
			}
		}))

		promises.push(new Promise((resolve) => {
			objectStore.get(`JournalChapters`).onsuccess = (event) => {
			 	if(event?.target?.result?.journalData){
			 		this.chapters = event?.target?.result?.journalData; 		
				}
				else{
				  	if (window.DM && (localStorage.getItem('JournalChapters' + gameid) != null)) {
				  		this.chapters = $.parseJSON(localStorage.getItem('JournalChapters' + gameid));
				  	}
				  	else{
				  		this.chapters=[];
				  	}
			   	}
				resolve(true);
			}
		}))




		Promise.all(promises).then(() => {
		  if(is_abovevtt_page()){
		  	this.build_journal();
		  }
		    if(window.DM && !is_gamelog_popout()){
			  	// also sync the journal
			    window.JOURNAL?.sync();
			}
		});
	}

	
	
	persist(allowPlayerPersist=false){
		if(window.DM || allowPlayerPersist){ 

			let statBlocks = Object.fromEntries(Object.entries(this.notes).filter(([key, value]) => this.notes[key].statBlock == true));
			let chapters = this.chapters
			let journal = Object.fromEntries(Object.entries(this.notes).filter(([key, value]) => this.notes[key].statBlock != true));


			let storeImage = gameIndexedDb.transaction([`journalData`], "readwrite")
			let objectStore = storeImage.objectStore(`journalData`)

			let globalObjectStore = globalIndexedDB.transaction(["journalData"], "readwrite").objectStore(`journalData`)

			if(window.DM){ // store your own statblocks as DM
				let deleteRequest = globalObjectStore.delete(`JournalStatblocks`);
				deleteRequest.onsuccess = (event) => {
				  const objectStoreRequest = globalObjectStore.add({journalId: `JournalStatblocks`, 'journalData': statBlocks});
				};
				deleteRequest.onerror = (event) => {
				  const objectStoreRequest = globalObjectStore.add({journalId: `JournalStatblocks`, 'journalData': statBlocks});
				};
			}
			else{ // store other DMs statblocks for use when DM isn't online; We keep these seperate so we don't override our own statblocks with another DMs statblock set.
				let deleteRequest = globalObjectStore.delete(`JournalStatblocks_${window.CAMPAIGN_INFO.dmId}`);
				deleteRequest.onsuccess = (event) => {
				  const objectStoreRequest = globalObjectStore.add({journalId: `JournalStatblocks_${window.CAMPAIGN_INFO.dmId}`, 'journalData': statBlocks});
				};
				deleteRequest.onerror = (event) => {
				  const objectStoreRequest = globalObjectStore.add({journalId: `JournalStatblocks_${window.CAMPAIGN_INFO.dmId}`, 'journalData': statBlocks});
				};
			}


			let journalDeleteRequest = objectStore.delete(`Journal`);
			journalDeleteRequest.onsuccess = (event) => {
			  const objectStoreRequest = objectStore.add({journalId: `Journal`, 'journalData': journal});
			};
			journalDeleteRequest.onerror = (event) => {
			  const objectStoreRequest = objectStore.add({journalId: `Journal`, 'journalData': journal});
			};

	
			let chapterDeleteRequest = objectStore.delete(`JournalChapters`);
			chapterDeleteRequest.onsuccess = (event) => {
			  const objectStoreRequest = objectStore.add({journalId: `JournalChapters`, 'journalData': chapters});
			};
			journalDeleteRequest.onerror = (event) => {
			  const objectStoreRequest = objectStore.add({journalId: `JournalChapters`, 'journalData': chapters});
			};
			if(window.DM){ // old storage kept as backup for now. 
				try{
					/*
					Stop saving this here in 1.30 - remove at later date once confirmed migrated. 

					localStorage.setItem('JournalStatblocks', JSON.stringify(statBlocks));   
					localStorage.setItem('Journal' + this.gameid, JSON.stringify(journal));
					localStorage.setItem('JournalChapters' + this.gameid, JSON.stringify(chapters));

					*/ 
				}
				catch(e){
					console.warn('localStorage Journal Storage Failed', e) // prevent errors from stopping code when local storage is full.
				}
			}

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
		if(sendNotes.length > 1 && JSON.stringify(sendNotes).length > 120000) {
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
		const input_add_chapter=$("<input type='text' placeholder='New folder name' class='input-add-chapter'>");
		
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

		const btn_add_chapter=$("<button id='btn_add_chapter'>Add Folder</button>");

		btn_add_chapter.click(function() {
			if (input_add_chapter.val() == "") {
				
				return;
			}

			self.chapters.push({
				title: input_add_chapter.val(),
				collapsed: false,
				notes: []
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
			
	

			let add_note_btn=$("<button class='token-row-button' ><span class='material-symbols-outlined'>add_notes</span></button>");

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
			let add_fold_btn=$("<button class='token-row-button'><span class='material-icons'>create_new_folder</span></button>");
			add_fold_btn.click(function(){

				self.chapters.push({
					title: "New Folder",
					collapsed: false,
					notes: [],
					parentID: $(this).closest('.folder[data-id]').attr('data-id')
				});
				self.persist();
				self.build_journal();
				window.MB.sendMessage('custom/myVTT/JournalChapters',{
					chapters: self.chapters
				});

			});
			row_chapter_title.append(folderIcon);	
			row_chapter_title.append(chapter_title);
			if(window.DM) {
				row_chapter_title.append(add_note_btn, add_fold_btn);
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
							self.sendNotes([self.notes[note_id]]);
							self.persist();
							self.build_journal();
						}

						// If the user presses escape, cancel the edit
						if (e.which == 27) {
							self.build_journal();
						}
					});
					input_note_title.off('click').on('click', function(e){
						e.stopPropagation();
					})
					input_note_title.blur(function(event){	
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



				let edit_btn=$("<button class='token-row-button'><span class='material-symbols-outlined'>edit_note</span></button>");
				edit_btn.click(function(){
					window.JOURNAL.edit_note(note_id);	
				});
				let note_index=n;

								
				entry.append(prependIcon);
				entry.append(entry_title);

				if(window.DM){
					if(!self.notes[note_id].ddbsource){
						entry.append(edit_btn);	
					}
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
			
			for(let source in window.ddbConfigJson.sources){
				const currentSource = window.ddbConfigJson.sources[source]
				if(currentSource.sourceURL == '' || currentSource.name == 'HotDQ' || currentSource.name == 'RoT')
					continue;
				const sourcetitle = currentSource.description;
				const sourceValue = currentSource.sourceURL.replaceAll(/sources\//gi, '');

				chapterImport.append($(`<option value='${sourceValue}'>${sourcetitle}</option>`));
			}
			
			
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
						title: window.ddbConfigJson.sources.find(d=> d.sourceURL.includes(source))?.description,
						collapsed: false,
						notes: [],
					});	

					window.ScenesHandler.build_adventures(function() {
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
					});
				}
			})

			$('#journal-panel .sidebar-panel-body').prepend(sort_button, chapterImport);

			$.contextMenu({
		        selector: "#journal-panel .row-chapter",
		        build: function(element, e) {

		            let menuItems = {};

		           	let i = window.JOURNAL.chapters.findIndex(d=>d.id==$(element).closest('[data-id]').attr('data-id'))
							

		            menuItems["rename"] = {
		                name: "Rename",
		                callback: function(itemKey, opt, originalEvent) {
		                    let input_chapter_title=$(`<input type='text' class='input-add-chapter' value='${self.chapters[i].title}'>`);
	
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
							input_chapter_title.off('click.prevent').on('click.prevent', function(e){
								e.stopPropagation();
							})
							input_chapter_title.blur(function(){		
								let e = $.Event('keypress');
							    e.which = 13;
							    input_chapter_title.trigger(e);
							});
							let row_chapter_title = $(element).find('.journal-chapter-title');
							row_chapter_title.empty();
							row_chapter_title.append(input_chapter_title);
							input_chapter_title.focus();

			            }   
	            	};     
	            	menuItems['export'] = {
	                    name: "Export Folder",
	                    callback: function (itemKey, opt, e) {
	                        let folder_export = function(notes, chapters) {
	                            build_import_loading_indicator('Preparing Export File');
	                            let DataFile = {
	                                version: 2,
	                                scenes: [{}],
	                                tokencustomizations: [],
	                                notes: {},
	                                journalchapters: [],
	                                soundpads: {}
	                            };
	                            let currentdate = new Date(); 
	                            let datetime = `${currentdate.getFullYear()}-${(currentdate.getMonth()+1)}-${currentdate.getDate()}`
	                         
	                            DataFile.notes = notes;
	                            DataFile.journalchapters = chapters;
	                            download(b64EncodeUnicode(JSON.stringify(DataFile,null,"\t")),`${window.CAMPAIGN_INFO.name}-${datetime}-note.abovevtt`,"text/plain");
	                                
	                            $(".import-loading-indicator").remove();        
	                        }
	                        let exportNoteChapters = function(chapterId, chaptertoExport){


	                            for(let i = 0; i<self.chapters.length; i++){
	                                if(self.chapters[i].parentID == chapterId){
	                                   exportNoteChapters(self.chapters[i].id, chaptertoExport);
	                                   chaptertoExport.push(self.chapters[i]);
	                                }
	                            }
	                        };

	                        let notesToExport = function(chapters, notes){
	                        	for(let k in chapters){
	                                for(let j in chapters[k].notes){
	                                	let noteId = chapters[k].notes[j];
	                                	notes[noteId] = self.notes[chapters[k].notes[j]];
	                                }
	                            }
	                        }
	                        let currentChapter = {...window.JOURNAL.chapters[i]};
	                        delete currentChapter.parentID;
	                        let chaptersArray = [currentChapter];
	                        exportNoteChapters(window.JOURNAL.chapters[i].id, chaptersArray)
	                       	
	                        
	                        let notesObject = {};
	                        notesToExport(chaptersArray, notesObject);

	                       

	                        folder_export(notesObject, chaptersArray);
	                      
	                    }
	                };
	                
	                menuItems["delete"] = {
	                    name: "Delete",
	                    callback: function(itemKey, opt, originalEvent) {
                        	if(confirm("Delete this chapter and all the contained notes?")){
                        		
                        		for(let k=0;k<self.chapters[i].notes.length;k++){
									let nid=self.chapters[i].notes[k];
									delete self.notes[nid];
								}
								
								self.chapters = self.chapters.filter(d => d.id != self.chapters[i].id)
								
								$(element).closest('.folder').find('.folder').each(function(){
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
	                    }
	                };

		            if (Object.keys(menuItems).length === 0) {
		                menuItems["not-allowed"] = {
		                    name: "You are not allowed to configure this item",
		                    disabled: true
		                };
		            }
		            return { items: menuItems };
		        }
		    });
			$.contextMenu({
		        selector: "#journal-panel .note-list .sidebar-list-item-row",
		        build: function(element, e) {

		            let menuItems = {};

		           	let note_id = $(element).closest('[data-id]').attr('data-id');
					let i = window.JOURNAL.chapters.findIndex(d=>d.id==$(element).closest('.folder[data-id]').attr('data-id'))
					let note_index =window.JOURNAL.chapters[i].notes.indexOf(note_id)
							

		            menuItems["rename"] = {
		                name: "Rename",
		                callback: function(itemKey, opt, originalEvent) {
		                    //Convert the note title to an input field and focus it
		                    const input_note_title=$(`
		                    	<input type='text' class='input-add-chapter' value='${self.notes[note_id].title}'>
		                    `);

		                    input_note_title.keypress(function(e){
		                    	if (e.which == 13 && input_note_title.val() !== "") {
		                    		self.notes[note_id].title = input_note_title.val();
		                    		self.sendNotes([self.notes[note_id]]);
		                    		self.persist();
		                    		self.build_journal();
		                    	}

		                    	// If the user presses escape, cancel the edit
		                    	if (e.which == 27) {
		                    		self.build_journal();
		                    	}
		                    });
		                    input_note_title.off('click').on('click', function(e){
		                    	e.stopPropagation();
		                    })
		                    input_note_title.blur(function(event){	
		                    	let e = $.Event('keypress');
		                        e.which = 13;
		                        input_note_title.trigger(e);
		                    });
		              
		                    let entry_title = $(element).find('.sidebar-list-item-row-details-title');
							
		                    entry_title.append(input_note_title);
		                    input_note_title.focus();

			            }   
	            	};   
	            	menuItems["copyLink"] = {
		                name: "Copy Note Link",
		                callback: function(itemKey, opt, originalEvent) {
		                	let copyLink = `[note]${note_id};${self.notes[note_id].title}[/note]`
		                    navigator.clipboard.writeText(copyLink);
			            }   
	            	};   
            		menuItems['export'] = {
            	        name: "Export Note",
            	        callback: function (itemKey, opt, e) {
      
            	            let note_export = function(notes, chapters) {
            	                build_import_loading_indicator('Preparing Export File');
            	                let DataFile = {
            	                    version: 2,
            	                    scenes: [{}],
            	                    tokencustomizations: [],
            	                    notes: {},
            	                    journalchapters: [],
            	                    soundpads: {}
            	                };
            	                let currentdate = new Date(); 
            	                let datetime = `${currentdate.getFullYear()}-${(currentdate.getMonth()+1)}-${currentdate.getDate()}`
            	             
            	                DataFile.notes = notes;
            	                DataFile.journalchapters = chapters;
            	                download(b64EncodeUnicode(JSON.stringify(DataFile,null,"\t")),`${window.CAMPAIGN_INFO.name}-${datetime}-note.abovevtt`,"text/plain");
            	                    
            	                $(".import-loading-indicator").remove();        
            	            }

            	            let exportNote = {};
            	            exportNote[note_id] = self.notes[note_id];

            	            let currentChapter = {...window.JOURNAL.chapters[i]};
	                        delete currentChapter.parentID;
	                        let chapterToExport = [currentChapter];
	                        

            	            note_export(exportNote, chapterToExport);
            	          
            	        }
            	    };
	                
	                menuItems["delete"] = {
	                    name: "Delete",
	                    callback: function(itemKey, opt, originalEvent) {
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
	                    }
	                };

		            if (Object.keys(menuItems).length === 0) {
		                menuItems["not-allowed"] = {
		                    name: "You are not allowed to configure this item",
		                    disabled: true
		                };
		            }
		            return { items: menuItems };
		        }
		    });
		}
	}
	
	
	display_note(id, statBlock = false){
		let self=this;
		let note=$(`<div class='note' data-id='${id}'></div>`);
		
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
		add_journal_roll_buttons(note_text);
		this.add_journal_tooltip_targets(note_text);
		this.block_send_to_buttons(note_text);
		add_stat_block_hover(note_text);
		$(note_text).find('.add-input').each(function(){
		    let numberFound = $(this).attr('data-number');
		    const spellName = $(this).attr('data-spell');
		    const remainingText = $(this).hasClass('each') ? '' : `${spellName} slots remaining`
		    const track_ability = function(key, updatedValue){	    	
				if (self.notes[id].abilityTracker === undefined) {
					self.notes[id].abilityTracker = {};
				}
				const asNumber = parseInt(updatedValue); 
				self.notes[id].abilityTracker[key] = asNumber;
				window.JOURNAL.persist();
				debounceSendNote(id, self.notes[id])
	    	}
		    if (self.notes[id].abilityTracker?.[spellName]>= 0){
	    		numberFound = self.notes[id].abilityTracker[spellName]
	    	} 
	    	else{
		    	track_ability(spellName, numberFound)
		    }

		    let input = createCountTracker(self.notes[id], spellName, numberFound, remainingText, "", track_ability);
		    $(this).find('p').remove();
		    $(this).after(input)
	    })
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
			let title = self.notes[id]?.title?.trim() || $("#resizeDragMon .avtt-stat-block-container .mon-stat-block__name-link").text();
			popoutWindow(title, note, journal_text.width(), journal_text.height());
			removeFromPopoutWindow(title, ".visibility-container");
			removeFromPopoutWindow(title, ".ui-resizable-handle");
			$(window.childWindows[title].document).find("head").append(`<style id='noteStyles'>
				body div.note[id^="ui-id"]{
					height: 100% !important;
				    max-height: 100% !important;
				    overflow: auto !important;
				}
			</stlye>`);
			
			
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
			if($(self).hasClass('note-tooltip')){
					let noteId = $(self).attr('data-id');
					if(noteId.replace(/[-+*&<>]/gi, '') == $(self).text().replace(/[-+*&<>\s]/gi, '')){
						noteId = Object.keys(window.JOURNAL.notes).filter(d=> window.JOURNAL.notes[d]?.title?.trim()?.toLowerCase()?.replace(/[-+*&<>\s]/gi, '')?.includes($(self).text()?.trim()?.toLowerCase()?.replace(/[-+*&<>\s]/gi, '')))[0]
					}
					
				$(self).off('click.openNote').on('click.openNote', function(event){
					event.preventDefault();
					event.stopPropagation();
					if(noteId != undefined)
						window.JOURNAL.display_note(noteId);		
				})
				if(window.JOURNAL.notes[noteId] != undefined){
					let noteHover = `<div>
						<div class="tooltip-header">
				       	 	<div class="tooltip-header-icon">
				            
					        	</div>
					        <div class="tooltip-header-text">
					            ${window.JOURNAL.notes[noteId].title}
					        </div>
					        <div class="tooltip-header-identifier tooltip-header-identifier-condition">
					           Note
					        </div>
			    		</div>
				   		<div class="tooltip-body note-text">
					        <div class="tooltip-body-description">
					            <div class="tooltip-body-description-text note-text">
					                ${window.JOURNAL.notes[noteId].text}
					            </div>
					        </div>
					    </div>
					</div>`

			
					let hoverNoteTimer;
					$(self).on({
						'mouseover': function(e){
							hoverNoteTimer = setTimeout(function () {
				            	build_and_display_sidebar_flyout(e.clientY, function (flyout) {
						            flyout.addClass("prevent-sidebar-modal-close"); // clicking inside the tooltip should not close the sidebar modal that opened it
						            flyout.addClass('note-flyout');
						            const tooltipHtml = $(noteHover);
									window.JOURNAL.translateHtmlAndBlocks(tooltipHtml);	
									add_journal_roll_buttons(tooltipHtml);
									window.JOURNAL.add_journal_tooltip_targets(tooltipHtml);
									add_stat_block_hover(tooltipHtml);
						            flyout.append(tooltipHtml);
						            let sendToGamelogButton = $(`<a class="ddbeb-button" href="#">Send To Gamelog</a>`);
						            sendToGamelogButton.css({ "float": "right" });
						            sendToGamelogButton.on("click", function(ce) {
						                ce.stopPropagation();
						                ce.preventDefault();
										
						                send_html_to_gamelog(noteHover);
						            });
						            let flyoutLeft = e.clientX+20
						            if(flyoutLeft + 400 > window.innerWidth){
						            	flyoutLeft = window.innerWidth - 420
						            }
						            flyout.css({
						            	left: flyoutLeft,
						            	width: '400px'
						            })

						            const buttonFooter = $("<div></div>");
						            buttonFooter.css({
						                height: "40px",
						                width: "100%",
						                position: "relative",
						                background: "#fff"
						            });
						            window.JOURNAL.block_send_to_buttons(flyout);
						            flyout.append(buttonFooter);
						            buttonFooter.append(sendToGamelogButton);
						            flyout.find("a").attr("target","_blank");
						      		flyout.off('click').on('click', '.int_source_link', function(event){
										event.preventDefault();
										render_source_chapter_in_iframe(event.target.href);
									});
									

						            flyout.hover(function (hoverEvent) {
						                if (hoverEvent.type === "mouseenter") {
						                    clearTimeout(removeToolTipTimer);
						                    removeToolTipTimer = undefined;
						                } else {
						                    remove_tooltip(500);
						                }
						            });

						            flyout.css("background-color", "#fff");
						        });
				        	}, 500);		
						
						},
						'mouseout': function(e){
							clearTimeout(hoverNoteTimer)
							remove_tooltip(500, false);
						}
				
				    });
				}
				

				return;	
			}
			if(!$(self).attr('data-tooltip-href'))

			if(self.href.match(/\/spells\/[0-9]|\/magic-items\/[0-9]|\/monsters\/[0-9]/gi)){
				$(self).attr('data-moreinfo', `${self.href}/more-info`);
			}	

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
				   




    translateHtmlAndBlocks(target) {
    	let pastedButtons = target.find('.avtt-roll-button').add(target.find('.integrated-dice__container'));

		for(let i=0; i<pastedButtons.length; i++){
			$(pastedButtons[i]).replaceWith($(pastedButtons[i]).text());
		}
		const trackerSpans = target.find('.note-tracker');
		for(let i=0; i<trackerSpans.length; i++){
			$(trackerSpans[i]).replaceWith(`[track]${$(trackerSpans[i]).text()}[/track]`);
		}
		const iframes = target.find('.journal-site-embed')
		for(let i=0; i<iframes.length; i++){
			$(iframes[i]).replaceWith(`<iframe class='journal-site-embed' src='${$(iframes[i]).text()}'></iframe>`);
		}
    	let data = $(target).clone().html();

        let lines = data.split(/(<br \/>|<br>|<p>|\n|<strong>)/g);
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
                let parts = input.split(/(:\s(?<!left:\s?)|:(?<!left:\s?)<\/strong>(\s)?)/g);
                let i = parts.length - 1;
                parts[i] = parts[i].split(/,\s(?![^(]*\))/gm);
                for (let p in parts[i]) {
                	parts[i][p] = parts[i][p].replace(/<(\/)?em>|<(\/)?b>|<(\/)?strong>/gi, '')
                	let spellName = (parts[i][p].startsWith('<a')) ? $(parts[i][p]).text() : parts[i][p].replace(/<\/?p[a-zA-z'"0-9\s]+?>/g, '').replace(/\s?\[spell\]\s?|\s?\[\/spell\]\s?/g, '').replace('[/spell]', '').replace(/\s|&nbsp;/g, '');

                   	if( !(parts[i][p].startsWith('<') || parts[i][p].startsWith('[spell]')) && parts[i][p] && typeof parts[i][p] === 'string') {
                        parts[i][p] = parts[i][p].split('<')[0]
                            .replace(/^/gm, `[spell]`)
                            .replace(/( \(|(?<!\))$)/gm, '[/spell]');
                    }

                    if(eachNumberFound){
                    	parts[i][p] = `<span class="add-input each" data-number="${eachNumberFound}" data-spell="${spellName}">${parts[i][p]}</span>`
                    }
                }

                parts[i] = parts[i].join(', ');
               	input = parts.join('');
                if(slotsNumberFound){
                	input = `<span class="add-input slots" data-number="${slotsNumberFound}" data-spell="${spellLevelFound}">${input}</span>`
                }
            }

            input = input.replace(/\[language=(.*?)\](.*?)\[\/language\]/g, function(m, language, languageText){
            	languageText = languageText.replace(/<\/?p>/g, '');   	


            	if (!window.DM && language != undefined) {
					const knownLanguages = get_my_known_languages().map(language => language.toLowerCase())
					if (!knownLanguages.includes(language.toLowerCase())) {
						const container = $("<div>").html(languageText);
						const elements = container.find("*").add(container);
						const textNodes = elements.contents().not(elements);
						textNodes.each(function () {
							let newText = this.nodeValue.replaceAll(/[\w\d]/gi, (n) => String.fromCharCode(97 + Math.floor(Math.random() * 26)));
							$(document.createTextNode(newText)).insertBefore(this);
							$(this).remove();
						});
						languageText = container.html();
					}
				}

                return `${languageText}`
            })
            input = input.replace(/\[note\](.*?)\[\/note\]/g, function(m){
            	let note = m.replace(/<\/?p>/g, '').replace(/\s?\[note\]\s?|\s?\[\/note\]\s?/g, '').replace('[/note]', '');   	
            	const noteId = note.replace(/\s/g, '-').split(';')[0];
            	note = (note.split(';')[1]) ? note.split(';')[1] : note;
                return `<a class="tooltip-hover note-tooltip" data-id=${noteId}>${note}</a>`
            })
            input = input.replace(/\[spell\](.*?)\[\/spell\]/g, function(m){
            	let spell = m.replace(/<\/?p>/g, '').replace(/\s?\[spell\]\s?|\s?\[\/spell\]\s?/g, '').replace('[/spell]', '');   	
            	const spellUrl = spell.replace(/\s/g, '-').split(';')[0];
            	const spellMoreInfo = spell;
            	spell = (spell.split(';')[1]) ? spell.split(';')[1] : spell;
                return `<a class="tooltip-hover spell-tooltip" href="https://www.dndbeyond.com/spells/${spellUrl}" ${spellMoreInfo.includes(';') ? `data-moreinfo="https://www.dndbeyond.com/spells/${spellMoreInfo.split(';')[0]}/more-info"` : ''} aria-haspopup="true" target="_blank">${spell}</a>`
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
            	const spellUrl = spell.replace(/\s/g, '-').split(';')[0];
            	const spellMoreInfo = spell;
            	spell = (spell.split(';')[1]) ? spell.split(';')[1] : spell;
                return `<a class="tooltip-hover monster-tooltip" href="https://www.dndbeyond.com/monsters/${spellUrl}" ${spellMoreInfo.includes(';') ? `data-moreinfo="https://www.dndbeyond.com/spells/${spellMoreInfo.split(';')[0]}/more-info"` : ''}  aria-haspopup="true" target="_blank">${spell}</a>`
            })

            input = input.replace(/\[magicItem\](.*?)\[\/magicItem\]/g, function(m){
            	let spell = m.replace(/<\/?p>/g, '').replace(/\s?\[magicItem\]\s?|\s?\[\/magicItem\]\s?/g, '').replace('[/magicItem]', '');   	
            	const spellUrl = spell.replace(/\s/g, '-').split(';')[0];
            	const spellMoreInfo = spell;
            	spell = (spell.split(';')[1]) ? spell.split(';')[1] : spell;
                return `<a class="tooltip-hover magic-item-tooltip" href="https://www.dndbeyond.com/magic-items/${spellUrl}" ${spellMoreInfo.includes(';') ? `data-moreinfo="https://www.dndbeyond.com/spells/${spellMoreInfo.split(';')[0]}/more-info"` : ''} aria-haspopup="true" target="_blank">${spell}</a>`
            })

            input = input.replace(/\[track\]([a-zA-Z\s]+)([\d]+)\[\/track\]/g, function(m, m1, m2){
                return `<span>${m1}</span><span class="add-input each" data-number="${m2}" data-spell="${m1}"></span>`
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
			tinyMCE.get(taid)?.execCommand('mceSave');
			$(this).closest(".note")?.dialog("close");
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
		
		const debounceNoteSave = mydebounce(function(e, editor){
		    if(editor.isDirty()){
		    	self.notes[id].text = editor.getContent();
		    	self.notes[id].plain= editor.getContent({ format: 'text' });
		    	self.notes[id].statBlock=statBlock;
		    	self.persist();
		    }
		}, 800)

		const contentStyles = `
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
			.note-tracker{
				 border: 1px dotted #bb5600;
			}
			.journal-site-embed{
			    border: 1px dotted #5656bb;
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
				 background-color: var(--compendium-quote-box-color, #FAF8EC) !important;
				/*Fallback: if the variable isn't declared, it'll default to pale yellow*/
				 padding: 20px 25px 15px 25px !important;
				 position: relative !important;
				 width: auto !important;
				 display: flex !important;
				 flex-direction: column !important;
				 overflow: visible !important;
				 border-radius: 0 !important;
				 border-left: 1px solid !important;
				 border-right: 1px solid !important;
				 border-color: var(--compendium-quote-box-border, #620000) !important;
				/*Fallback: if the variable isn't declared, it'll default to dark red*/
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
			.text--quote-box p:first-of-type::before, .text--quote-box p:last-of-type::after {
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
				 background-color: var(--compendium-rules-sidebar-color, #DAE4C1) !important;
				/*Fallback: if the variable isn't declared, it'll default to pale-green*/
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
				 border-left: 1.5px solid #b3b3b3 !important;
				 border-right: 1.5px solid #b3b3b3 !important;
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
			/* END - CSS header variables */
			/* START - Underlines compendium links */
			a:not(.ddb-lightbox-outer, h3 > a):hover, a:not(.ddb-lightbox-outer, h3 > a):focus {
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
				 background-image: url(https://media.dndbeyond.com/encounter-builder/static/media/stat-block-top-texture.70eb7c244ee206f35cc0.png),url(https://media.dndbeyond.com/encounter-builder/static/media/paper-texture.88243187e307464c5837.png) !important;
				 background-size: 100%, cover !important;
			}
			.stat-block-background:after,.stat-block-background:before {
				 content: "";
			     display: block;
			     background: url(https://www.dndbeyond.com/Content/Skins/Waterdeep/images/mon-summary/stat-bar-book.png) 50%;
			     background-size: 100% 100%;
			     height: 6px;
			     position: absolute;
			     left: -3px;
			     right: -3px;
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
			.custom-avghp.custom-stat {
				 color: #F00;
			}
			.custom-hp-roll.custom-stat {
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
				 margin-block-end:0
			}
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
				 font-size: var(--monster-trait-header-size,22px);
				 font-family: var(--monster-trait-header-font,"Roboto Condensed",Helvetica,sans-serif);
				 border-bottom: 2px solid var(--monster-header-underline,#7a3c2f);
				 font-variant: small-caps; 
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
			.ability-block {
			    font-size: 14px;
			    display: flex;
			    flex-wrap: wrap;
			    margin: 10px 0;
			    color: #4f1300;
			}
			.ability-block__stat {
			    width: 30%;
			    padding: 5px 0;
			    text-align: center;
			}

			.ability-block__heading {
			    font-weight: bold;
			}

			.ability-block__data {
			    display: flex;
			    flex-direction: row;
			    align-items: center;
			    justify-content: center;
			}

			.ability-block__modifier {
			    margin-left: 2px;
			}
			.mon-stat-block__meta {
			    font-style: italic;
			    margin-bottom: 15px;
			}
			.mon-stat-block__name {
			    color: #822000;
			    font-family: MrsEavesSmallCaps,Roboto,Open Sans,Helvetica,sans-serif;
			    font-size: 34px;
			    font-weight: 700;
			}
			.mon-stat-block__attribute, .mon-stat-block__feature {
			    color: #822000;
			    line-height: 1.2;
			    margin: 5px 0;
			}
			.mon-stat-block__name .mon-stat-block__name-link, 
			.mon-stat-block__name .mon-stat-block__name-link:active, 
			.mon-stat-block__name .mon-stat-block__name-link:hover, 
			.mon-stat-block__name .mon-stat-block__name-link:visited {
			    color: #822000;
			}
			.mon-stat-block__attribute-label, 
			.mon-stat-block__feature-label{
			        font-weight: 700;
			}
			.mon-stat-block{
			    padding: 15px 10px;
			}
			.more-info footer{
			    padding: 0px;
			}
			.mon-stat-block{
			    padding: 15px 10px;
			  
			}
			.ddbc-creature-block__name {
			    font-size: 30px;
			}
			.monster-details .more-info footer{
			    padding: 0px;
			    height: 20px;
			}

			.monster-details .more-info footer .source.monster-source {
			    font-size: inherit;
			    font-family: inherit;
			    font-style: inherit;
			    margin-top: 0px;
			    float:left;
			}
			.monster-details .more-info.details-more-info:after {
			    display:none
			}
			.monster-details .more-info-content{
			    padding: 0px !important;
			}
			.monster-details,
			.detail-content .image{
			    margin-bottom:0px;
			}
			.mon-stat-block__description-block h3, .mon-stat-block__description-block-heading {
			    border-bottom: 1px solid #822000;
			    color: #822000;
			    font-family: Scala Sans Offc,Roboto,Open Sans,Helvetica,sans-serif;
			    font-size: 24px;
			    font-weight: 400;
			    line-height: 1.4;
			    margin-bottom: 15px;
			    margin-top: 20px;
			}
			.mon-stat-block__name *{
			    color: #822000;
			    font-family: MrsEavesSmallCaps,Roboto,Open Sans,Helvetica,sans-serif;
			    font-size: 34px;
			    font-weight: 700;
			}		
			.ddbc-creature-block {
			    background: url(https://www.dndbeyond.com/Content/Skins/Waterdeep/images/mon-summary/stat-block-top-texture.png),url(https://www.dndbeyond.com/Content/Skins/Waterdeep/images/mon-summary/paper-texture.png);
			    background-size: 100% auto;
			    background-position: top;
			    background-repeat: no-repeat,repeat;
			    position: relative;
			    box-shadow: 0 0 5px #979aa4;
			    border: 1px solid #d4d0ce;
			    padding: 15px 10px;
			    font-family: Scala Sans Offc,Roboto,Helvetica,sans-serif;
			    font-size: 15px
			}

			.ddbc-creature-block:after,.ddbc-creature-block:before {
			    content: "";
			    display: block;
			    background: url(https://www.dndbeyond.com/Content/Skins/Waterdeep/images/mon-summary/stat-bar-book.png) 50%;
			    background-size: 100% 100%;
			    height: 6px;
			    position: absolute;
			    left: -3px;
			    right: -3px
			}

			.ddbc-creature-block:before {
			    top: -3px
			}

			.ddbc-creature-block:after {
			    bottom: -3px
			}
			@font-face {
			    font-family: Scala Sans Offc;
			    font-style: normal;
			    font-weight: 700;
			    src: url(https://media.dndbeyond.com/encounter-builder/static/media/ScalaSansOffc-Bold.048d2d142baf798dc56f.ttf) format("truetype")
			}

			@font-face {
			    font-family: Scala Sans Offc;
			    font-style: normal;
			    font-weight: 400;
			    src: url(https://media.dndbeyond.com/encounter-builder/static/media/ScalaSansOffc.0eea070d2279b1a6be23.ttf) format("truetype")
			}

			@font-face {
			    font-family: Scala Sans Offc;
			    font-style: italic;
			    font-weight: 700;
			    src: url(https://media.dndbeyond.com/encounter-builder/static/media/ScalaSansOffc-BoldIta.740e4d6d85a09a9cd0a0.ttf) format("truetype")
			}

			@font-face {
			    font-family: Scala Sans Offc;
			    font-style: italic;
			    font-weight: 400;
			    src: url(https://media.dndbeyond.com/encounter-builder/static/media/ScalaSansOffc-Ita.86c4513e1c4b869189c2.ttf) format("truetype")
			}

			@font-face {
			    font-family: MrsEavesSmallCaps;
			    font-style: normal;
			    font-weight: 100;
			    src: url(https://media.dndbeyond.com/encounter-builder/static/media/MrsEavesSmallCaps.1744d7a566b5a2ccca6c.ttf) format("truetype")
			}
			@font-face {
			  font-family: "Tiamat Condensed SC Regular";
			  src: url("https://www.dndbeyond.com/fonts/tiamatcondensedsc-regular-webfont.woff2") format("woff2");
			}
			@font-face {
			    font-family: "Roboto";
			    src: url("https://www.dndbeyond.com/fonts/roboto-regular.woff2") format("woff2")
			}

			@font-face {
			    font-family: "Roboto Condensed";
			    src: url("https://www.dndbeyond.com/fonts/robotocondensed-regular-webfont.woff2") format("woff2")
			}
			@import url("//fonts.googleapis.com/css?family=Roboto+Condensed:400,700|Roboto:400,500,700|Gloria+Hallelujah:400,700");@font-face {
			    font-family: 'Roboto Regular';
			    src: url("https://www.dndbeyond.com/fonts/roboto-regular.woff2") format("woff2")
			}

			@font-face {
			    font-family: 'Tiamat Condensed SC Regular';
			    src: url("https://www.dndbeyond.com/fonts/tiamatcondensedsc-regular-webfont.woff2") format("woff2")
			}

			@font-face {
			    font-family: 'Scala Sans Offc';
			    src: url("../fonts/ScalaSansOffc-Bold.ttf") format("truetype");
			    font-weight: bold;
			    font-style: normal
			}

			@font-face {
			    font-family: 'Scala Sans Offc';
			    src: url("../fonts/ScalaSansOffc.ttf") format("truetype");
			    font-weight: normal;
			    font-style: normal
			}

			@font-face {
			    font-family: 'Scala Sans Offc';
			    src: url("../fonts/ScalaSansOffc-BoldIta.ttf") format("truetype");
			    font-weight: bold;
			    font-style: italic
			}

			@font-face {
			    font-family: 'Scala Sans Offc';
			    src: url("../fonts/ScalaSansOffc-Ita.ttf") format("truetype");
			    font-weight: normal;
			    font-style: italic
			}

			@font-face {
			    font-family: 'Scala Sans SC Offc';
			    src: url("../fonts/ScalaSansScOffc.ttf") format("truetype");
			    font-weight: normal;
			    font-style: normal
			}

			@font-face {
			    font-family: 'Scala Sans SC Offc';
			    src: url("../fonts/ScalaSansScOffc-Bold.ttf") format("truetype");
			    font-weight: bold;
			    font-style: normal
			}

			@font-face {
			    font-family: 'MrsEavesSmallCaps';
			    src: url("../fonts/MrsEavesSmallCaps.ttf") format("truetype");
			    font-weight: 100;
			    font-style: normal
			}

			@font-face {
			    font-family: 'DearSarahPro';
			    src: url("../fonts/DearSarahPro.ttf") format("truetype");
			    font-weight: 100;
			    font-style: normal
			}
			
			/***** END NEW STAT BLOCKS ****/
		`

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
			      { title: 'Add Ability Tracker; Format: "Wild Shape 2"', inline: 'span', wrapper:true, classes: 'note-tracker'},
			      { title: 'Ignore AboveVTT auto formating', inline: 'span', wrapper: true, classes: 'ignore-abovevtt-formating' },
			      { title: 'Embed Site in Journal', inline: 'span', wrapper: true, classes: 'journal-site-embed'}
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
			      "content": `<style>${contentStyles}</style><div class="Basic-Text-Frame stat-block-background one-column-stat" style="font-family: 'Scala Sans Offc', Roboto, Helvetica, sans-serif;">
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
			    	"content": `<style>${contentStyles}</style><div class="stat-block">
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
			    	"content": `<style>${contentStyles}</style><p>Spellcasting. The mage is a 9th-level spellcaster. Its spellcasting ability is Intelligence (spell save DC 14, +6 to hit with spell attacks). The mage has the following wizard spells prepared:</p>
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
				editor.on('change keyup', async function(e){
				    if(editor.isDirty()){
				    	debounceNoteSave(e, editor);
				    }
				});
			},
			relative_urls : false,
			remove_script_host : false,
			convert_urls : true,
			media_alt_source: false,
			media_poster: false,
			statusbar: false,
			content_style: contentStyles,
			save_onsavecallback: function(e) {
				// @todo !IMPORTANT grab the id somewhere from the form, so that you can use this safely
				let note_id = $(this.getElement()).attr('data-note-id');
				self.notes[note_id].text =tinymce.activeEditor.getContent();
				self.notes[note_id].plain=tinymce.activeEditor.getContent({ format: 'text' });
				self.notes[note_id].statBlock=statBlock;
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
