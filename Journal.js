/**
 * JournalManager (WIP)
 * Is the tab on the sidebar that allows you to write notes
 		* Requires journalPanel = new Sidebar();
		* All of its DOM elements attach to journalPanel tree 
 * Also holds notes attached to tokens
 * 
 */
cached_journal_items = {};

const AVTT_JOURNAL_CHUNK_SIZE = 100000;
const AVTT_JOURNAL_CHUNK_STRATEGY = "chunked-json";

function avttPromisifyIdbRequest(request) {
	if (!request) {
		return Promise.reject(new Error("Missing IDB request"));
	}
	return new Promise((resolve, reject) => {
		request.onsuccess = (event) => resolve(event?.target?.result);
		request.onerror = (event) => reject(event?.target?.error || event);
	});
}

function avttResolveDefaultValue(dataType) {
	return dataType === "array" ? [] : {};
}

async function avttSaveChunkedJson(objectStore, baseKey, data, options = {}) {
	if (!objectStore || !baseKey) {
		return;
	}
	const chunkSize = Number.isFinite(options?.chunkSize)
		? Math.max(1, options.chunkSize)
		: AVTT_JOURNAL_CHUNK_SIZE;
	const dataType = options?.dataType === "array" ? "array" : "object";
	const normalizedData =
		data !== undefined && data !== null ? data : avttResolveDefaultValue(dataType);

	let serialized;
	try {
		serialized = JSON.stringify(normalizedData);
	} catch (error) {
		console.warn("Failed to serialize journal payload for", baseKey, error);
		return;
	}

	let existingManifest = null;
	try {
		existingManifest = await avttPromisifyIdbRequest(objectStore.get(baseKey));
	} catch (error) {
		console.warn("Failed to read existing manifest for", baseKey, error);
	}
	const previousChunkKeys = Array.isArray(existingManifest?.journalData?.chunkKeys)
		? existingManifest.journalData.chunkKeys
		: [];
	for (const previousKey of previousChunkKeys) {
		try {
			await avttPromisifyIdbRequest(objectStore.delete(previousKey));
		} catch (error) {
			console.warn("Failed to delete stale journal chunk", previousKey, error);
		}
	}
	const newChunkKeys = [];
	for (let offset = 0, index = 0; offset < serialized.length; offset += chunkSize, index += 1) {
		const chunkValue = serialized.slice(offset, offset + chunkSize);
		const chunkKey = `${baseKey}::chunk::${index}`;
		newChunkKeys.push(chunkKey);
		try {
			await avttPromisifyIdbRequest(
				objectStore.put({ journalId: chunkKey, journalData: chunkValue }),
			);
		} catch (error) {
			console.error("Failed to store journal chunk", chunkKey, error);
			return;
		}
	}

	const manifestPayload = {
		version: 2,
		strategy: AVTT_JOURNAL_CHUNK_STRATEGY,
		chunkSize,
		chunkCount: newChunkKeys.length,
		chunkKeys: newChunkKeys,
		dataType,
		totalLength: serialized.length,
		updatedAt: Date.now(),
	};
	try {
		await avttPromisifyIdbRequest(
			objectStore.put({ journalId: baseKey, journalData: manifestPayload }),
		);
	} catch (error) {
		console.error("Failed to store journal manifest for", baseKey, error);
	}
}

async function avttLoadChunkedJson(objectStore, baseKey, options = {}) {
	if (!objectStore || !baseKey) {
		return options?.defaultValue !== undefined
			? options.defaultValue
			: avttResolveDefaultValue(options?.dataType === "array" ? "array" : "object");
	}
	let record;
	try {
		record = await avttPromisifyIdbRequest(objectStore.get(baseKey));
	} catch (error) {
		console.warn("Failed to read journal record for", baseKey, error);
		return options?.defaultValue !== undefined
			? options.defaultValue
			: avttResolveDefaultValue(options?.dataType === "array" ? "array" : "object");
	}

	const payload = record?.journalData;
	if (
		payload &&
		payload.strategy === AVTT_JOURNAL_CHUNK_STRATEGY &&
		Array.isArray(payload.chunkKeys)
	) {
		const chunks = [];
		for (const chunkKey of payload.chunkKeys) {
			try {
				const chunkRecord = await avttPromisifyIdbRequest(objectStore.get(chunkKey));
				if (typeof chunkRecord?.journalData === "string") {
					chunks.push(chunkRecord.journalData);
				}
			} catch (error) {
				console.warn("Failed to load journal chunk", chunkKey, error);
			}
		}
		const combined = chunks.join("");
		if (!combined) {
			return options?.defaultValue !== undefined
				? options.defaultValue
				: avttResolveDefaultValue(payload.dataType === "array" ? "array" : "object");
		}
		try {
			return JSON.parse(combined);
		} catch (error) {
			console.warn("Failed to parse chunked journal payload for", baseKey, error);
			return options?.defaultValue !== undefined
				? options.defaultValue
				: avttResolveDefaultValue(payload.dataType === "array" ? "array" : "object");
		}
	}

	if (payload !== undefined) {
		return payload;
	}
	if (options?.defaultValue !== undefined) {
		return options.defaultValue;
	}
	return undefined;
}

class JournalManager{
	
	
	constructor(gameid){
		this.gameid=gameid;
		this.notes = {};
		this.chapters = [];

		const loadJournalPromise = (async () => {
			let journalData;
			try {
				const objectStore = gameIndexedDb.transaction(["journalData"]).objectStore(`journalData`);
				if(window.DM){
					journalData = {
						...await avttLoadChunkedJson(objectStore, `Journal`, { dataType: "object" }),
						...await avttLoadChunkedJson(objectStore, `PlayerJournal`, { dataType: "object" })
					};
				}
				else{
					journalData = await avttLoadChunkedJson(objectStore, `PlayerJournal`, { dataType: "object" })
				}
				
			} catch (error) {
				console.warn("Failed to load journal entries", error);
			}

			if (journalData === undefined) {
				if (window.DM && localStorage.getItem(`Journal${gameid}`) != null) {
					try {
						journalData = $.parseJSON(localStorage.getItem(`Journal${gameid}`));
					} catch (error) {
						console.warn("Failed to parse legacy local journal storage", error);
						journalData = {};
					}
				} else {
					journalData = {};
				}
			}
			if (typeof journalData !== "object" || journalData === null) {
				journalData = {};
			}
			this.notes = journalData;
		})();

		const loadChaptersPromise = (async () => {
			let chaptersData;
			try {
				const objectStore = gameIndexedDb.transaction(["journalData"]).objectStore(`journalData`);
				chaptersData = await avttLoadChunkedJson(objectStore, `JournalChapters`, {
					dataType: "array",
				});
			} catch (error) {
				console.warn("Failed to load journal chapters", error);
			}
			if (chaptersData === undefined) {
				if (window.DM && localStorage.getItem(`JournalChapters${gameid}`) != null) {
					try {
						chaptersData = $.parseJSON(localStorage.getItem(`JournalChapters${gameid}`));
					} catch (error) {
						console.warn("Failed to parse legacy journal chapters storage", error);
						chaptersData = [];
					}
				} else {
					chaptersData = [];
				}
			}
			if (!Array.isArray(chaptersData)) {
				chaptersData = [];
			}
			this.chapters = chaptersData;
		})();

		const loadStatBlocksPromise = loadJournalPromise.then(async () => {
			let statBlocksData;
			try {
				const globalObjectStore = globalIndexedDB.transaction(["journalData"]).objectStore(`journalData`);
				if (window.DM) {
					statBlocksData = await avttLoadChunkedJson(globalObjectStore, `JournalStatblocks`, {
						dataType: "object",
					});
				} else if (window?.CAMPAIGN_INFO?.dmId) {
					statBlocksData = await avttLoadChunkedJson(
						globalObjectStore,
						`JournalStatblocks_${window.CAMPAIGN_INFO.dmId}`,
						{ dataType: "object" },
					);
				}
			} catch (error) {
				console.warn("Failed to load journal stat blocks", error);
			}

			if (statBlocksData === undefined && window.DM) {
				const legacyStatBlocks = localStorage.getItem(`JournalStatblocks`);
				if (legacyStatBlocks != null && legacyStatBlocks !== "undefined") {
					try {
						statBlocksData = $.parseJSON(legacyStatBlocks);
					} catch (error) {
						console.warn("Failed to parse legacy stat blocks", error);
						statBlocksData = {};
					}
				}
			}

			if (statBlocksData && typeof statBlocksData === "object") {
				this.notes = {
					...this.notes,
					...statBlocksData,
				};
			}
		});

		Promise.all([loadJournalPromise, loadChaptersPromise, loadStatBlocksPromise]).then(() => {
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
		if(!(window.DM || allowPlayerPersist)){
			return;
		}
		const executePersist = async () => {
			const notes = this.notes && typeof this.notes === "object" ? this.notes : {};
			const statBlocks = Object.fromEntries(
				Object.entries(notes).filter(([key]) => notes[key]?.statBlock === true)
			);
			const journal = Object.fromEntries(
				Object.entries(notes).filter(([key]) => notes[key]?.statBlock !== true && !notes[key]?.player)
			);
			const journalPlayersOnly = Object.fromEntries(
				Object.entries(notes).filter(([key]) => notes[key]?.statBlock !== true && notes[key]?.player)
			);
			
			const chapters = Array.isArray(this.chapters) ? this.chapters : [];

			
			try {
				const transaction = gameIndexedDb.transaction([`journalData`], "readwrite");
				const objectStore = transaction.objectStore(`journalData`);
				if(window.DM){
					await avttSaveChunkedJson(objectStore, `Journal`, journal, { dataType: "object" });
				}				
				await avttSaveChunkedJson(objectStore, `PlayerJournal`, journalPlayersOnly, { dataType: "object" })
				await avttSaveChunkedJson(objectStore, `JournalChapters`, chapters, {
					dataType: "array",
				});
			} catch (error) {
				console.warn("Failed to persist journal entries", error);
			}

			try {
				const globalObjectStore = globalIndexedDB
					.transaction(["journalData"], "readwrite")
					.objectStore(`journalData`);
				if (window.DM) {
					await avttSaveChunkedJson(globalObjectStore, `JournalStatblocks`, statBlocks, {
						dataType: "object",
					});
				} else if (window?.CAMPAIGN_INFO?.dmId) {
					await avttSaveChunkedJson(
						globalObjectStore,
						`JournalStatblocks_${window.CAMPAIGN_INFO.dmId}`,
						statBlocks,
						{ dataType: "object" },
					);
				}
			} catch (error) {
				console.warn("Failed to persist journal stat blocks", error);
			}

		};

		executePersist().catch((error) => {
			console.warn("Journal persist encountered an unexpected error", error);
		});
	}
	

	sync = mydebounce(() => {
		let self = this;
		const isAnyParentShared = function (chapter) {
			let parentShared = false;
			while (parentShared == false && chapter?.parentID != undefined) {
				const parentId = chapter.parentID;
				chapter = self.chapters.find(d => d.id == parentId);
				if (chapter?.shareWithPlayer)
					parentShared = true;
			}
			return parentShared;
		}
		if (window.DM) {
			window.MB.sendMessage('custom/myVTT/JournalChapters', {
				chapters: self.chapters
			});
			let sendNotes = [];


			for (let i in self.notes) {
				const parentFolder = self.chapters.find(d => d.notes.includes(i));
				if (self.notes[i].player || parentFolder?.shareWithPlayer || isAnyParentShared(parentFolder)) {
					self.notes[i].id = i;
					sendNotes.push(self.notes[i])
				}
			}

			self.sendNotes(sendNotes)

		}
	}, 5000);
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
	/**
	 * Sets the chapter to be shared with the set of players
	 * 
	 * @param {number} chapterIndex - Folder index to share
	 * @param {Array|Boolean} shareWithPlayer - Array of player userIds to share with, or true to share with all players
	 */
	share_chapter(chapterIndex, shareWithPlayer){
		const self = this;
		self.chapters[chapterIndex].shareWithPlayer = shareWithPlayer || false;
		self.persist();
		self.build_journal();
		window.MB.sendMessage('custom/myVTT/JournalChapters',{
			chapters: self.chapters
		});
		
		if(shareWithPlayer){
			const anyParentIsChapter = function (id, chapter) {
				
				let noteChapter = self.chapters.find(d => d.notes.includes(id));
				let anyParentIsChapter = noteChapter?.id == chapter.id;
				while (anyParentIsChapter == false && noteChapter?.parentID != undefined) {
					const parentId = noteChapter.parentID;
					noteChapter = self.chapters.find(d => d.id == parentId);
					if (noteChapter?.id == chapter?.id)
						anyParentIsChapter = true;
				}
				return anyParentIsChapter;
			}
			const chapter = self.chapters[chapterIndex]
			
			let sendNotes = [];


			for (let i in self.notes) {	
				if (anyParentIsChapter(i, chapter)) {
					self.notes[i].id = i;
					sendNotes.push(self.notes[i])
				}
			}
			self.sendNotes(sendNotes)
		}
		
		

	}
	build_journal(searchText){
		console.log('build_journal');
		let self=this;

		// Clear all elements from journal panel except the searchbar, which needs to stay in place between searches
		journalPanel.body.children().not('#journal-control-container, #journal-control-container *').remove();
		
		let searchInput = $(`<input name="journal-search" type="search" style="width:96%;margin:2%" placeholder="search journal">`);
		searchInput.off("input").on("input", mydebounce(() => {
			let searchElement = document.getElementsByName("journal-search")[0];
			let textValue = searchElement.value;
			this.build_journal(textValue);
		}, 500));
		searchInput.off("keyup").on('keyup', function(event) {
			if (event.key === "Escape") {
				$(event.target).blur();
			}
		});
		if(!searchText){
			let searchElement = document.getElementsByName("journal-search")[0];
			searchText = searchElement?.value || '';
		}

		let journalControlContainer = $(`<div id="journal-control-container"></div>`);
		let expandAllButton = $(`<button class="expand-all-button token-row-button expand-collapse-button" title="Expand All Folders" style=""><span class="material-icons">expand</span></button>`);
		let collapseAllButton = $(`<button class="collapse-all-button token-row-button expand-collapse-button" title="Collapse All Folders" style=""><span class="material-icons">vertical_align_center</span></button>`);
		expandAllButton.on('click', function(){
			self.chapters.forEach(chapter => {
				chapter.collapsed = false;
			});
			self.build_journal(searchText);
		});
		collapseAllButton.on('click', function(){
			self.chapters.forEach(chapter => {
				chapter.collapsed = true;
			});
			self.build_journal(searchText);
		});
		
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
				self.build_journal(searchText);
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
			self.build_journal(searchText);
			window.MB.sendMessage('custom/myVTT/JournalChapters',{
				chapters: self.chapters
			});
		});
		if (journalPanel.body.find('#journal-control-container').length === 0) {
			journalPanel.body.append(journalControlContainer);
			journalControlContainer.append(searchInput);
			journalControlContainer.append(expandAllButton);
			journalControlContainer.append(collapseAllButton);
		}
		
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
				self.build_journal(searchText);
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
				self.build_journal(searchText);

		    }
		});



		journalPanel.body.append(chapter_list);
		let chaptersWithLaterParents = [];

		console.log('window',window);
		let relevantNotes = {};
		let relevantChapters = [];

		// The idea behind what I've done below is to find all notes that contain the search text and then find 
		// all chapters that contain those notes, recursively to the root. I also find all chapters that contain
		// the search text and do the same. This builds out a list of relevant notes and chapters that I can then
		// use to determine which journal items are rendered and which aren't.

		if(searchText){
			for(const property in self.notes){
				if(!searchText || self.notes[property].title?.toLowerCase().indexOf(searchText?.toLowerCase()) > -1){
					relevantNotes[property] = self.notes[property];
				}
			}
			
			let traverseChaptersUp = function(chapter){
				if(chapter.parentID){
					let parent = self.chapters.find(c => c.id == chapter.parentID);
					if(parent){
						relevantChapters.push(parent);
						traverseChaptersUp(parent);
					}
				}
			}
			
			let traverseChaptersDown = function(chapter){
				console.log('Traverse chapters down');
				console.log(chapter);
				console.log(self.chapters);
				if(chapter.notes){
					chapter.notes.forEach(note_id => {
						if(!relevantNotes[note_id]){
							relevantNotes[note_id] = self.notes[note_id];
						}
					});
				}
				if(chapter.id){
					let childChapters = self.chapters.filter(c => c.parentID == chapter.id)
					console.log(childChapters);
					if(childChapters?.length > 0){
						childChapters.forEach((chapter)=> {
							console.log('Chapter 2', chapter);
							relevantChapters.push(chapter);
							traverseChaptersDown(chapter);
						})
					}
				}
			}
			
	
			Object.entries(relevantNotes).map(([key, value]) => ({...value, id: key})).forEach((note) => {
				let parent = self.chapters.find(chapter => chapter.notes.includes(note.id));
				if(parent){
					relevantChapters.push(parent);
					traverseChaptersUp(parent);
				}
			});
			let filteredChapters = self.chapters.filter(chapter => chapter.title?.toLowerCase().indexOf(searchText?.toLowerCase()) > -1);
			
			filteredChapters.forEach(chapter => {
				relevantChapters.push(chapter);
				traverseChaptersUp(chapter);
				traverseChaptersDown(chapter);
			});

			
			filteredChapters.forEach(chapter => {
				chapter.notes.forEach(note_id => {
					if(!relevantNotes[note_id]){
						relevantNotes[note_id] = self.notes[note_id];
					}
				});
			});
		} else {
			relevantNotes = self.notes;
			relevantChapters = self.chapters;
		}

		for(let i=0; i<self.chapters.length;i++){
			// Check if the chapter is in relevantChapters - if not, don't render it or any children of
			if(relevantChapters.find(d => d.id == self.chapters[i].id)){
		
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
						self.build_journal(searchText);

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
						self.build_journal(searchText);
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
							self.build_journal(searchText);
						}

					}
				});
				let folderIcon = $(`<div class="sidebar-list-item-row-img"><img src="${window.EXTENSION_PATH}assets/folder.svg" class="token-image"></div>`)
					
				let row_chapter_title=$("<div class='row-chapter'></div>");
				
				let prependIcon = (self.chapters[i].shareWithPlayer && window.DM) ? $(`<span class="material-symbols-outlined" style='font-size:12px; margin-right: 5px;'>share</span>`) : '';
					
				let chapter_title=$(`<div class='journal-chapter-title' title='${self.chapters[i].title}'/>`);
				chapter_title.text(self.chapters[i].title);

				// If the user clicks the chapter title, expand/collapse the chapter notes
				chapter_title.click(function(){
					section_chapter.toggleClass('collapsed');
					self.chapters[i].collapsed = !self.chapters[i].collapsed;
					self.persist();
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
							self.build_journal(searchText);
						}
						if(e.keyCode==27){
							self.build_journal(searchText);
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
					self.build_journal(searchText);
					window.MB.sendMessage('custom/myVTT/JournalChapters',{
						chapters: self.chapters
					});

				});

				
	

				
				const share_fold_btn=$("<button class='token-row-button share'><span class='material-icons'>share</span></button>");
			
				
				share_fold_btn.click(function(e){
					
			

					let toggle_container = $(`<div class='note-visibility-toggle-container'></div`)

					let visibility_toggle=$("<input type='checkbox' name='allPlayers'/>");
					let visibility_row = $(`<div class='visibility_toggle_row'><label for='allPlayers'>All Players</label></div>`)
					visibility_row.append(visibility_toggle)
					toggle_container.append(visibility_row);
					visibility_toggle.change(function(){
						
						window.JOURNAL.share_chapter(i,visibility_toggle.is(":checked"));

						toggle_container.find(`input:not([name='allPlayers'])`).prop('disabled', visibility_toggle.is(":checked"));
						toggle_container.find(`input:not([name='allPlayers'])`).prop('checked', visibility_toggle.is(":checked"));
						
					
					});


					for(let j =0; j<window.playerUsers.length; j++){
						if(toggle_container.find(`input[name='${window.playerUsers[j].userId}']`).length == 0){
							let visibility_toggle=$(`<input type='checkbox' name='${window.playerUsers[j].userId}'/>`);
							let visibility_row = $(`<div class='visibility_toggle_row'><label for='${window.playerUsers[j].userId}'>${window.playerUsers[j].userName}</label></div>`)
							
							visibility_row.append(visibility_toggle)

							visibility_toggle.prop("checked",(self.chapters[i]?.shareWithPlayer instanceof Array && self.chapters[i]?.shareWithPlayer.includes(`${window.playerUsers[j].userId}`)));
							
							visibility_toggle.change(function(){
								let sharedUsers = toggle_container.find(`input:checked:not([name='allPlayers'])`).toArray().map(d => d.name);
								if(sharedUsers.length == 0)
									sharedUsers = false;
								window.JOURNAL.share_chapter(i,sharedUsers);
							});
							
							toggle_container.append(visibility_row);
						}
					}

					visibility_toggle.prop("checked",self.chapters[i].shareWithPlayer == true);
						
					if(visibility_toggle.is(":checked"))
						toggle_container.find(`input:not([name='allPlayers'])`).prop('disabled', true);
					else
						toggle_container.find(`input:not([name='allPlayers'])`).prop('disabled', false);
					
					$('body').append(toggle_container);
					toggle_container.css({
						'top': e.clientY + 'px',
						'left': e.clientX + 'px'
					});
					create_context_background(['.note-visibility-toggle-container']);
				})

				
				
				row_chapter_title.append(folderIcon, prependIcon, chapter_title);	
				if(window.DM) {
					row_chapter_title.append(add_note_btn, add_fold_btn, share_fold_btn);
				}	

				let containsPlayerNotes = false;
				for(let n=0; n<self.chapters[i].notes.length;n++){
					let note_id=self.chapters[i].notes[n];
					if(self.notes[note_id]?.player == true || (self.notes[note_id]?.player instanceof Array && self.notes[note_id].player?.includes(`${window.myUser}`))){
						containsPlayerNotes = true;
						break;
					} 
				}
				const sharedFolder = (self.chapters[i].shareWithPlayer == true || (self.chapters[i].shareWithPlayer instanceof Array && self.chapters[i].shareWithPlayer.includes(`${window.myUser}`)));
				section_chapter.toggleClass('shared-folder', sharedFolder);
				if(window.DM || containsPlayerNotes || sharedFolder) {
					section_chapter.append(row_chapter_title);
				} else {
					section_chapter.append(row_chapter_title);
					section_chapter.hide();
				}

				let sharedParentFolder = false;

				if(!self.chapters[i].parentID){
					chapter_list.append(section_chapter);
				}
				else{		
					let parentFolder = chapter_list.find(`.folder[data-id='${self.chapters[i].parentID}']`);
					let parentID = self.chapters[i]?.parentID
					sharedParentFolder = parentFolder.closest('.shared-folder').length>0;
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

							

					if(window.DM || containsPlayerNotes || sharedFolder || sharedParentFolder) {
						parentFolder.append(section_chapter);
						parentFolder.show();
						parentFolder.parents().show();
						section_chapter.show();
					} else {
						parentFolder.append(section_chapter);
						section_chapter.hide();
					}
				}
				
				journalPanel.body.append(chapter_list);


				for(let n=0; n<self.chapters[i].notes.length;n++){

					let note_id=self.chapters[i].notes[n];
					
					// Check if the note is in relevantNotes - if not, don't render it
					if(! (note_id in self.notes && note_id in relevantNotes ))
						continue;
						
					if( (! window.DM) && (!sharedParentFolder) && (self.notes[note_id]?.player == false || (self.notes[note_id]?.player instanceof Array && !self.notes[note_id]?.player.includes(`${window.myUser}`))) && !(self.chapters[i]?.shareWithPlayer == true || (self.chapters[i]?.shareWithPlayer instanceof Array && self.chapters[i]?.shareWithPlayer.includes(`${window.myUser}`))))
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
								self.build_journal(searchText);
							}

							// If the user presses escape, cancel the edit
							if (e.which == 27) {
								self.build_journal(searchText);
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
						entry.append(rename_btn);
						
						
						const share_note_btn=$("<button class='token-row-button share'><span class='material-icons'>share</span></button>");
					
						
						share_note_btn.click(function(e){

							let toggle_container = $(`<div class='note-visibility-toggle-container'></div`)

							let visibility_toggle=$("<input type='checkbox' name='allPlayers'/>");
							let visibility_row = $(`<div class='visibility_toggle_row'><label for='allPlayers'>All Players</label></div>`)
							visibility_row.append(visibility_toggle)
							toggle_container.append(visibility_row);
							visibility_toggle.change(function(){						
								window.JOURNAL.note_visibility(note_id,visibility_toggle.is(":checked"));
								window.JOURNAL.build_journal();
								toggle_container.find(`input:not([name='allPlayers'])`).prop('disabled', visibility_toggle.is(":checked"));
								toggle_container.find(`input:not([name='allPlayers'])`).prop('checked', visibility_toggle.is(":checked"));
							});


							for(let i =0; i<window.playerUsers.length; i++){
								if(toggle_container.find(`input[name='${window.playerUsers[i].userId}']`).length == 0){
									let visibility_toggle=$(`<input type='checkbox' name='${window.playerUsers[i].userId}'/>`);
									let visibility_row = $(`<div class='visibility_toggle_row'><label for='${window.playerUsers[i].userId}'>${window.playerUsers[i].userName}</label></div>`)
									
									visibility_row.append(visibility_toggle)

									visibility_toggle.prop("checked",(self.notes[note_id].player instanceof Array && self.notes[note_id].player.includes(`${window.playerUsers[i].userId}`)));
									
									visibility_toggle.change(function(){
										let sharedUsers = toggle_container.find(`input:checked:not([name='allPlayers'])`).toArray().map(d => d.name);
										if(sharedUsers.length == 0)
											sharedUsers = false;
										window.JOURNAL.note_visibility(note_id, sharedUsers);
										window.JOURNAL.build_journal();
									});
									
									toggle_container.append(visibility_row);
								}
							}

							visibility_toggle.prop("checked",self.notes[note_id].player == true);
								
							if(visibility_toggle.is(":checked"))
								toggle_container.find(`input:not([name='allPlayers'])`).prop('disabled', true);
							else
								toggle_container.find(`input:not([name='allPlayers'])`).prop('disabled', false);
							
							$('body').append(toggle_container);
							toggle_container.css({
								'top': e.clientY + 'px',
								'left': e.clientX + 'px'
							});
							create_context_background(['.note-visibility-toggle-container']);
						})
						entry.append(share_note_btn);
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
			const sortedSources = window.ddbConfigJson.sources.sort((a, b) => a.description.localeCompare(b.description, 'en'));
			for(let source=0; source<sortedSources.length; source++){
				const currentSource = sortedSources[source]
				if(currentSource.sourceURL == '' || currentSource.name == 'HotDQ' || currentSource.name == 'RoT')
					continue;
				const sourcetitle = currentSource.description;
				const sourceValue = currentSource.sourceURL.replaceAll(/sources\//gi, '');

				chapterImport.append($(`<option value='${sourceValue}'>${sourcetitle}</option>`));
			}
			
			
			chapterImport.on('change', function(){
				let source = this.value;
				journalPanel.display_sidebar_loading_indicator('Loading Chapters');
				try{
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
							ddbsource: `https://www.dndbeyond.com${source}`
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
						self.build_journal(searchText);
						journalPanel.remove_sidebar_loading_indicator();
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
								self.build_journal(searchText);
								journalPanel.remove_sidebar_loading_indicator();
							});
						});
					}
				}
				catch {
					journalPanel.remove_sidebar_loading_indicator();
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
									self.build_journal(searchText);
								}

								// If the user presses escape, cancel the edit
								if (e.which == 27) {
									self.build_journal(searchText);
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
								self.build_journal(searchText);
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
		                    		self.build_journal(searchText);
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
	            	if(!self.notes[note_id].ddbsource){
		            	menuItems["copyLink"] = {
			                name: "Copy Tooltip Link",
			                callback: function(itemKey, opt, originalEvent) {
			                	const copyLink = `[note]${note_id};${self.notes[note_id].title}[/note]`
			                    navigator.clipboard.writeText(copyLink);
				            }   
		            	};   
		            	menuItems["copyEmbed"] = {
			                name: "Copy Embed Tags",
			                callback: function(itemKey, opt, originalEvent) {
			                	const copyLink = `[note embed]${note_id};${self.notes[note_id].title}[/note]`
			                    navigator.clipboard.writeText(copyLink);
				            }   
		            	};
	            	}
	            	
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
                        		self.build_journal(searchText);
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
	
	positionNotePins(id, note_text){
		let pins = $(note_text).find(`.note-pin`);

		if(pins.length == 0)
			return;

		pins.each(function(){
			const pinId = $(this).attr('data-id');
			let noteText = $(this).attr('data-text');
			const label = $(this).attr('data-label');
			let noteTitle = (typeof label == 'string' && label != '') ? label : 'pin';
			

			let noteId = $(this).attr('data-note');
			if(noteId.replace(/[-+*&<>]/gi, '') == noteText.replace(/[-+*&<>\s]/gi, '')){
				noteId = Object.keys(window.JOURNAL.notes).filter(d=> window.JOURNAL.notes[d]?.title?.trim()?.toLowerCase()?.replace(/[-+*&<>\s]/gi, '')?.includes(noteText?.trim()?.toLowerCase()?.replace(/[-+*&<>\s]/gi, '')))[0]
			}
		
			if(window.JOURNAL.notes[noteId] != undefined){
				noteText = window.JOURNAL.notes[noteId].text;
				noteTitle = window.JOURNAL.notes[noteId].title;
			}

			

			let noteHover = `<div>
				<div class="tooltip-header">
		       	 	<div class="tooltip-header-icon">
		            
			        	</div>
			        <div class="tooltip-header-text">
			            ${noteTitle}
			        </div>
			        <div class="tooltip-header-identifier tooltip-header-identifier-condition">
			           Note
			        </div>
	    		</div>
		   		<div class="tooltip-body note-text">
			        <div class="tooltip-body-description">
			            <div class="tooltip-body-description-text note-text">
			                ${noteText}
			            </div>
			        </div>
			    </div>
			</div>`
			if(window.JOURNAL.notes[id].pins != undefined && window.JOURNAL.notes[id].pins[pinId] != undefined){
				const left = window.JOURNAL.notes[id].pins[pinId].x
				const top = window.DM ? window.JOURNAL.notes[id].pins[pinId].y : `${parseFloat(window.JOURNAL.notes[id].pins[pinId].y) - 43}px`;

				$(this).css({
					'left': left,
					'top': top
				})
			}
			if(window.DM){
				$(this).draggable({
					containment: `div.note[data-id='${id}']`,
					start: function(){
						clearTimeout(hoverNoteTimer)
						remove_tooltip(500);
					},
					stop: function () {
						if(window.JOURNAL.notes[id].pins == undefined){
							window.JOURNAL.notes[id].pins = {};
						}
						window.JOURNAL.notes[id].pins[pinId] = {
							x: $(this).css('left'),
							y: $(this).css('top')
						}	
						window.JOURNAL.persist();
						debounceSendNote(id, window.JOURNAL.notes[id])
					}
				})
			}
			let hoverNoteTimer;
			$(this).on({
					'mouseover': function(e){
						hoverNoteTimer = setTimeout(function () {
			            	build_and_display_sidebar_flyout(e.clientY, function (flyout) {
					            flyout.addClass("prevent-sidebar-modal-close"); // clicking inside the tooltip should not close the sidebar modal that opened it
					            flyout.addClass('note-flyout');
					            const tooltipHtml = $(noteHover);
								window.JOURNAL.translateHtmlAndBlocks(tooltipHtml, noteId);	
								add_journal_roll_buttons(tooltipHtml);
								window.JOURNAL.add_journal_tooltip_targets(tooltipHtml);
								add_stat_block_hover(tooltipHtml);
								add_aoe_statblock_click(tooltipHtml);

								$(tooltipHtml).find('.add-input').each(function(){
								    let numberFound = $(this).attr('data-number');
								    const spellName = $(this).attr('data-spell');
								    const remainingText = $(this).hasClass('each') ? '' : `${spellName} slots remaining`
									
								    const track_ability = function(key, updatedValue){	    	
										if (window.JOURNAL.notes[noteId].abilityTracker === undefined) {
											window.JOURNAL.notes[noteId].abilityTracker = {};
										}
										const asNumber = parseInt(updatedValue); 
										window.JOURNAL.notes[noteId].abilityTracker[key] = asNumber;
										window.JOURNAL.persist();
										debounceSendNote(noteId, window.JOURNAL.notes[noteId])
							    	}
								    if (window.JOURNAL.notes[noteId].abilityTracker?.[spellName]>= 0){
							    		numberFound = window.JOURNAL.notes[noteId].abilityTracker[spellName]
							    	} 
							    	else{
								    	track_ability(spellName, numberFound)
								    }

								    let input = createCountTracker(window.JOURNAL.notes[noteId], spellName, numberFound, remainingText, "", track_ability);
									const playerDisabled = $(this).hasClass('player-disabled');
									if (!window.DM && playerDisabled) {
										input.prop('disabled', true);
									}
									const partyLootTable = $(this).closest('.party-item-table');
									if(partyLootTable.length > 0){
										if (partyLootTable.hasClass('shop') && numberFound > 0){
											$(this).closest('tr').find('td>.item-quantity-take-input').val(1);
										}
										else{
											$(this).closest('tr').find('td>.item-quantity-take-input').val(numberFound);
										}
									}
									$(this).find('p').remove();
								    $(this).after(input)
							    })
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
					      		flyout.off('click').on('click', '.tooltip-hover[href*="https://www.dndbeyond.com/sources/dnd/"], .int_source_link ', function(event){
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
						remove_tooltip(500);
					}
			
			    });


		})
	}
	display_note(id, statBlock = false){
		let self=this;
		let noteAlreadyOpen = $(`div.note[data-id='${id}']`).length>0;
		
		let note= noteAlreadyOpen ? $(`div.note[data-id='${id}']`) : $(`<div class='note' data-id='${id}'></div>`);
		
		if(!noteAlreadyOpen){
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


				for(let i =0; i<window.playerUsers.length; i++){
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

				let force_close_popup_btn=$("<button>Force Closed by Players</button>")

				force_close_popup_btn.click(function(){
					window.MB.sendMessage('custom/myVTT/note',{
							id: id,
							note:self.notes[id],
							popup: false,
						});
				});

				visibility_container.append(force_close_popup_btn);
				
				let edit_btn=$("<button>Edit</button>");
				edit_btn.click(function(){
					note.remove();
					window.JOURNAL.edit_note(id, statBlock);
				});
				
				visibility_container.append(edit_btn);
				
				note.append(visibility_container);
				
			}
		}
		
		let note_text= noteAlreadyOpen ? note.find('.note-text') : $("<div class='note-text'/>");
		if(noteAlreadyOpen){
			note_text.empty();
		}
		note_text.append(self.notes[id].text); // valid tags are controlled by tinyMCE.init()
		
		this.translateHtmlAndBlocks(note_text, id);	
		add_journal_roll_buttons(note_text);
		this.add_journal_tooltip_targets(note_text);
		this.block_send_to_buttons(note_text);
		add_stat_block_hover(note_text);
		add_aoe_statblock_click(note_text);
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
			const playerDisabled = $(this).hasClass('player-disabled');
			if (!window.DM && playerDisabled) {
				input.prop('disabled', true);
			}
			const partyLootTable = $(this).closest('.party-item-table');
			if (partyLootTable.hasClass('shop') && numberFound > 0) {
				$(this).closest('tr').find('td>.item-quantity-take-input').val(1);
			}
			else {
				$(this).closest('tr').find('td>.item-quantity-take-input').val(numberFound);
			}
		    $(this).find('p').remove();
		    $(this).after(input)
	    })

		if(!noteAlreadyOpen){
			note.append(note_text);
		}
		note.find("a").attr("target","_blank");
		if(!noteAlreadyOpen){
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
					$("#resizeDragMon, .note:has(iframe) form .mce-container-body, #sheet").append($('<div class="iframeResizeCover"></div>'));
				},
				stop: function () {
					$('.iframeResizeCover').remove();			
				}
			});
			$("[role='dialog']").resizable({
				start: function () {
					$("#resizeDragMon, .note:has(iframe) form .mce-container-body, #sheet").append($('<div class="iframeResizeCover"></div>'));
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
				if(!window.DM)
					$(window.childWindows[title].document).find("body").addClass('body-rpgcharacter-sheet');
				
				$(this).siblings(".ui-dialog-titlebar").children(".ui-dialog-titlebar-close").click();
			});
			note.off('click').on('click', '.tooltip-hover[href*="https://www.dndbeyond.com/sources/dnd/"], .int_source_link ', function(event){
				event.preventDefault();
				render_source_chapter_in_iframe(event.target.href);
			});
			note.parent().css('height', '600px');
		}
		this.positionNotePins(id, note_text);
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
						            $(self).toggleClass('loading-tooltip', false);
						            const tooltipHtml = $(noteHover);
									window.JOURNAL.translateHtmlAndBlocks(tooltipHtml, noteId);	
									add_journal_roll_buttons(tooltipHtml);
									window.JOURNAL.add_journal_tooltip_targets(tooltipHtml);
									add_stat_block_hover(tooltipHtml);
									add_aoe_statblock_click(tooltipHtml);
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
						      		flyout.off('click').on('click', '.tooltip-hover[href*="https://www.dndbeyond.com/sources/dnd/"], .int_source_link ', function(event){
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
			


			if(!$(self).attr('data-tooltip-href')){
				
				if(self.href.match(/\/spells\/[0-9]|\/magic-items\/[0-9]|\/monsters\/[0-9]|\/sources\//gi)){
					$(self).attr('data-moreinfo', `${self.href}`);
				}	
				window.JOURNAL.getDataTooltip(self.href, function(url, typeClass){
					$(self).attr('data-tooltip-href', url);
					$(self).toggleClass(`${typeClass}-tooltip`, true);
				});
			}
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
		if(itemType == 'sources')
			return 
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
		const blocks = target.find('img:not(.mon-stat-block__separator-img), .text--quote-box, .rules-text, .block-torn-paper, .read-aloud-text, .dmScreenChunk')

		const sendToGamelogButton = $('<button class="block-send-to-game-log"><span class="material-symbols-outlined">login</span></button>')
		const container = $(`<div class='note-text' style='position:relative; width:'></div>`)
		
	

	    const whisper_container=$("<div class='whisper-container'/>");

        for(let i=0; i<window.playerUsers.length; i++){
			if(whisper_container.find(`input[name='${window.playerUsers[i].userId}']`).length == 0){
				const randomId = uuid();
				let whisper_toggle=$(`<input type='checkbox' name='${window.playerUsers[i].userId}'/>`);
				let whisper_row = $(`<div class='whisper_toggle_row'><label>${window.playerUsers[i].userName}</label></div>`)
				whisper_toggle.off('click.toggle').on('click.toggle', function(e){

					e.stopPropagation();
				})
				whisper_row.find('label').off('click.stopProp').on('click.stopProp', function(e){
					e.stopPropagation();
					e.preventDefault();
					$(this).next('input[type=checkbox]').click();
				})
				whisper_row.append(whisper_toggle)

				
				whisper_container.append(whisper_row);
			}
		}
		sendToGamelogButton.off('contextmenu').on("contextmenu", function(e) {
			e.preventDefault();
			e.stopPropagation();
			const checkedInputs=$(this).find('.whisper-container input:checked');
	        checkedInputs.click();
			$(this).find('.whisper-container').toggleClass('visible');

			if($(this).find('.whisper-container').hasClass('visible')){
		      $(document).on('click.blurWhisperHandle', function(e){
		        if($(e.target).closest('.whisper-container').length == 0){
		          $('.whisper-container').toggleClass('visible', false)
		          $(document).off('click.blurWhisperHandle');
		        }
		      })  
		    }
		})
		$(sendToGamelogButton).append(whisper_container);
		sendToGamelogButton.off('click').on("click", function(e) {
	        e.stopPropagation();
	        e.preventDefault();
	        
	        let targetBlock = $(e.currentTarget).parent().clone();
	        targetBlock.find('button.block-send-to-game-log').remove();
	        targetBlock.find('img').removeAttr('width height style').toggleClass('magnify', true);
	       	const whisper_container=$(this).find('.whisper-container');
	        if(whisper_container.hasClass('visible')){
	        	const checkedInputs = whisper_container.find('input:checked');
	        	const whisperArray = [];
	        	checkedInputs.each(function () {
			       whisperArray.push($(this).attr('name'));
			  	});
			  	send_html_to_gamelog(`<p>${targetBlock[0].outerHTML}</p>`, whisperArray)
	        }
	        else{
	        	send_html_to_gamelog(`<p>${targetBlock[0].outerHTML}</p>`);
	        }
	        
	    });


		const tables = target.find('table');
		
		const allDiceRegex = /(\d+)?d(?:100|20|12|10|8|6|4)((?:kh|kl|ro(<|<=|>|>=|=)|min=)\d+)*/g; // ([numbers]d[diceTypes]kh[numbers] or [numbers]d[diceTypes]kl[numbers]) or [numbers]d[diceTypes]
       	
   		blocks.wrap(function(){
			if(this instanceof HTMLImageElement){
				container.css('width', 'fit-content');
				$(this).attr('href', $(this).attr('src'));
			}

			return container;
		});
		sendToGamelogButton.clone(true, true).insertAfter(blocks);
		if(allDiceRegex.test($(tables).find('tr:first-of-type>:first-child').text())){
			let result = $(tables).find(`tbody > tr td:last-of-type`);
			$(tables).find('td').css({
				'position': 'relative',
				'padding-right': '10px'
			});
			result.append(sendToGamelogButton.clone(true, true)); 
		}


		
	}
				   
	replaceNoteEmbed(text, notesIncluded=[]){

		return text.replace(/\[note embed\](.*?)\[\/note\]/gi, function(m, m1){
    		let noteId = m1.replace(/\s/g, '-').split(';')[0];
        	let noteText = (m1.split(';')[1]) ? m1.split(';')[1] : m1;
        	if(noteId.replace(/[-+*&<>]/gi, '') == noteText.replace(/[-+*&<>\s]/gi, '')){
				noteId = Object.keys(window.JOURNAL.notes).filter(d=> window.JOURNAL.notes[d]?.title?.trim()?.toLowerCase()?.replace(/[-+*&<>\s]/gi, '')?.includes(noteText?.trim()?.toLowerCase()?.replace(/[-+*&<>\s]/gi, '')))[0]
			}
		
			if(window.JOURNAL.notes[noteId] != undefined){
				if(notesIncluded.includes(noteId))
					noteText = `<em style="color:#f00 !important">Warning: Note embeds that include parent notes are not supported to avoid infinite loop.</em>`;
				else{
					notesIncluded.push(noteId);
					noteText = window.JOURNAL.replaceNoteEmbed(window.JOURNAL.notes[noteId].text, notesIncluded);
				}
			}
			noteText = noteText.replace(/\[pin(.*?)id=([\w-]+?)(.*?)?\]([\s\S]+?)\[\/pin\]/gi,`<em style="color:#F00 !important">Warning: Pins do not function inside embeds</em>`)
        	return noteText;
        });
	}



	async translateHtmlAndBlocks(target, displayNoteId, isStatBlock=true) {
    	let pastedButtons = target.find('.avtt-roll-button, [data-rolltype="recharge"], .integrated-dice__container, span[data-dicenotation]');
    	target.find('>style:first-of-type, >style#contentStyles').remove();
		
		for(let i=0; i<pastedButtons.length; i++){
			$(pastedButtons[i]).replaceWith($(pastedButtons[i]).text());
		}
		let emStrong = target.find('p>em:first-of-type:has(strong), p>strong:first-of-type:has(em)');
		for(let i=0; i<emStrong.length; i++){
			if($(emStrong[i]).text().match(/recharge/gi))
				$(emStrong[i]).replaceWith($(emStrong[i]).text());
		}
		target.find('a.ignore-abovevtt-formating').wrap('<span class="ignore-abovevtt-formating"></span>')

		const trackerSpans = target.find('.note-tracker');
		for(let i=0; i<trackerSpans.length; i++){
			$(trackerSpans[i]).replaceWith(`[track]${$(trackerSpans[i]).text()}[/track]`);
		}
		const embededIframes = target.find('iframe');
		for(let i=0; i<embededIframes.length; i++){
			if(!embededIframes[i].src.startsWith(window.EXTENSION_PATH))
				embededIframes[i].src = `${window.EXTENSION_PATH}iframe.html?src=${encodeURIComponent(embededIframes[i].src)}`;
		}



		

    	let data = $(target).clone().html();

		//remove DDB tags if loading from DDB data eg. on the DM Screen
		data = data.replace(/\[rule\]|\[\/rule\]/gi, '');
		data = data.replace(/\[condition\]|\[\/condition\]/gi, '');


        data = data.replace(/\[pin(.*?)\]([\s\S]+?)\[\/pin\]/gi, function(m, m1, m2){
          let label = '';
          let id;
          if(m1.match(/id=([\w-]+?)(\s+?|[\w]+?=|$)/gi)){
            id = m1.matchAll(/id=([\w-]+?)(\s+?|[\w]+?=|$)/gi).next().value[1]
          }
          if(id == undefined)	
            return `<p><em style="color: #F00 !important">Warning: Pin missing id. Ids should be unique Example: [pin id=idhere][/pin]<br><span style="padding-left: 20px;">Original text:${m}</span></em></p>`;
          if(m1.match(/label=(.*?)([\w]+?=|$)/gi)){
            label = m1.matchAll(/label=(.*?)([\w]+?=|$)/gi).next().value[1]
          }


        	let text = m2;
        	let noteId = '';
        	if(text.match(/\[note( embed)?\](.*?)\[\/note\]/gi)){
        		const insideText = text.matchAll(/\[note( embed)?\](.*?)\[\/note\]/gi).next().value[2];
        		noteId = insideText.replace(/\s/g, '-').split(';')[0];
            	text = (insideText.split(';')[1]) ? insideText.split(';')[1] : insideText;
        	}
        	return `<div class="note-pin" data-id="${id}" data-text="${text}" data-note="${noteId}" data-label="${label}"></div>`
        });

       	data = this.replaceNoteEmbed(data, [displayNoteId]);

        let lines = data.split(/(<br \/>|<br>|<p>|<\/p>|\n)/g);
        lines = lines.map((line, li) => {
            let input = line;

			if(isStatBlock == true)
            	input = general_statblock_formating(input);
        
            // Find cover rules
            input = input.replace(
                /(?<!]|;|#|\w|\-|<[^>]+)(hit dice|temporary hit points|inspiration|half cover|three-quarters cover|total cover|difficult terrain|falling|suffocating|lightly obscured|heavily obscured|climbing swimming crawling|surprise|flying|underwater|concentration)(?![^<]+>|\-|\w|\[)/gi,
                function(m){
                	if(m.startsWith('#') || m.startsWith('>'))
                		return m;
                	
					let rulesId = window.ddbConfigJson.rules.filter((d) => d.name.localeCompare(m, "en", { sensitivity: 'base' }) == 0)[0].id;
               		return `<a class="tooltip-hover condition-tooltip" href="/compendium/rules/basic-rules/combat#${m}" aria-haspopup="true" data-tooltip-href="//www.dndbeyond.com/rules/${rulesId}-tooltip" data-tooltip-json-href="//www.dndbeyond.com/conditions/${rulesId}/tooltip-json" target="_blank">${m}</a>`
                }
            );
            // Find conditions
            input = input.replace(
                /(?<!]|;|#|\w|<[^>]+)(blinded|charmed|deafened|exhaustion|frightened|grappled|incapacitated|invisible|paralyzed|petrified|poisoned|prone|restrained|stunned|unconscious)(?![^<]+>|\-|\w|\[)/gi,
                function(m){
                	if(m.startsWith('#') || m.startsWith('>'))
                		return m;
                	
					let conditionId = window.ddbConfigJson.conditions.filter((d) => d.definition.name.localeCompare(m, "en", { sensitivity: 'base' }) == 0)[0].definition.id;
               		return `<a class="tooltip-hover condition-tooltip" href="/compendium/rules/free-rules/rules-glossary${m}Condition" aria-haspopup="true" data-tooltip-href="//www.dndbeyond.com/conditions/${conditionId}-tooltip" data-tooltip-json-href="//www.dndbeyond.com/conditions/${conditionId}/tooltip-json" target="_blank">${m}</a>`
                }
            );
            // Find skills
            input = input.replace(
                /(?<!]|;|#|\-|\w|<[^>]+)(athletics|acrobatics|sleight of hand|stealth|arcana|history|investigation|nature|religion|animal handling|insight|medicine|perception|survival|deception|intimidation|performance|persuasion)(?![^<]+>|\-|\w|\[)/gi,
                function(m){

                	
					let skillId = window.ddbConfigJson.abilitySkills.filter((d) => d.name.localeCompare(m, "en", { sensitivity: 'base' }) == 0)[0].id;
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
                	
					 let senseId = window.ddbConfigJson.senses.filter((d) => d.name.localeCompare(m, "en", { sensitivity: 'base' }) == 0)[0].id;
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
                	
					let actionId = window.ddbConfigJson.basicActions.filter((d) => d.name.localeCompare(compare, "en", { sensitivity: 'base' }) == 0)[0].id;
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
                (input.match('At will:') ||
                    input.match(/Cantrips \(at will\):/gi) ||
                    input.match(/(\d+\/day( each)?|\d+\w+ level \(\d slots?\))\:/gi))
            ) {
            	let eachNumberFound = (input.match(/\d+\/day( each)?/gi)) ? parseInt(input.match(/[0-9]+(?![0-9]?px)/gi)[0]) : undefined;
            	let slotsNumberFound = (input.match(/\d+\w+ level \(\d slots?\)\:/gi)) ? parseInt(input.match(/[0-9]+/gi)[1]) : undefined;
            	let spellLevelFound = (slotsNumberFound) ? input.match(/\d+\w+ level/gi)[0] : undefined;
                let parts = input.split(/(:\s(?<!(left:\s?|style="[\s\S]+?))|:(?<!(left:\s?|style="[\s\S]+?))<\/strong>(\s)?)/gi);
                let i = parts.length - 1;
                parts[i] = parts[i].split(/,\s(?![^(]*\))/gm);
                for (let p in parts[i]) {

                	if(parts[i][p].match(/^((\s+?)?(<a|<span))/gi) && $(parts[i][p])?.is('a, span[data-spell]'))
                		continue;
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
            	const spellUrl = spell.replace(/\s/g, '-').split(';')[0];
            	spell = (spell.split(';')[1]) ? spell.split(';')[1] : spell;
                return `<a class="tooltip-hover monster-tooltip" href="https://www.dndbeyond.com/monsters/${spellUrl}" aria-haspopup="true" target="_blank">${spell}</a>`
            })

            input = input.replace(/\[magicItem\](.*?)\[\/magicItem\]/g, function(m){
            	let spell = m.replace(/<\/?p>/g, '').replace(/\s?\[magicItem\]\s?|\s?\[\/magicItem\]\s?/g, '').replace('[/magicItem]', '');   	
            	const spellUrl = spell.replace(/\s/g, '-').split(';')[0];
            	spell = (spell.split(';')[1]) ? spell.split(';')[1] : spell;
                return `<a class="tooltip-hover magic-item-tooltip" href="https://www.dndbeyond.com/magic-items/${spellUrl}" aria-haspopup="true" target="_blank">${spell}</a>`
            })

            input = input.replace(/\[source\](.*?)\[\/source\]/g, function(m){
            	let source = m.replace(/<\/?p>/g, '').replace(/\s?\[source\]\s?|\s?\[\/source\]\s?/g, '').replace('[/source]', '');   	
            	const sourceUrl = source.replace(/\s/g, '-').split(';')[0];
            	source = (source.split(';')[1]) ? source.split(';')[1] : source;
                return `<a class="tooltip-hover source-tooltip" href="${sourceUrl}" aria-haspopup="true" target="_blank">${source}</a>`
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
		
		
		const aboveSrc = $newHTML.find(`[src*='above-bucket']:not([src*='?src=above-bucket']), [href*='above-bucket']`);
		for (let i = 0; i < aboveSrc.length; i++) {
			const currTarget = aboveSrc[i];
			const src = decodeURI(currTarget.src);
			const href = decodeURI(currTarget.href);

			if (src?.match(/.*?above-bucket-not-a-url\/(.*?)/gi)) {
				let url = src.replace(/.*?above-bucket-not-a-url\/(.*?)/gi, '$1')
				url = await getAvttStorageUrl(url);
				if ($(currTarget).is('source') && $(currTarget).parent().is('video')) {
					const parentVideo = $(currTarget).parent('video');
					parentVideo.attr('src', url);
					$(currTarget).remove();
				}
				else{
					$(currTarget).attr('src', url);
				}
				
				
			}
			else if (href?.match(/.*?above-bucket-not-a-url\/(.*?)/gi)) {
				let url = href.replace(/.*?above-bucket-not-a-url\/(.*?)/gi, '$1')
				url = await getAvttStorageUrl(decodeURI(url));
				$(currTarget).attr('href', url);
			}
		}

		const iframes = $newHTML.find('.journal-site-embed')
		for (let i = 0; i < iframes.length; i++) {
			let url = $(iframes[i]).text();
			if (url?.includes('dropbox.com')) {
				url = url.replace('dl=0', 'raw=1')
			}
			else if (url?.match(/drive\.google\.com.*\/view\?usp=/gi)) {
				url = url.replace(/view\?usp=/gi, 'preview?usp=')
			} else if (url?.match(/youtube.com/gi)) {
				url = url.replace("youtube.com", "youtube-nocookie.com");
				url = url.replace(/watch\?v=(.*)/gi, 'embed/$1');
			} else if (url?.startsWith('above-bucket-not-a-url')) {
				url = await getAvttStorageUrl(url);
			}
			encodeURI(url);
			const newFrame = $(`<iframe class='journal-site-embed'
						src='${window.EXTENSION_PATH}iframe.html?src=${encodeURIComponent(url)}'
						allowfullscreen
						webkitallowfullscreen
						mozallowfullscreen></iframe>`)
			$(iframes[i]).replaceWith(newFrame);
		}
		const avttIframes = $newHTML.find('iframe[src*="src=above-bucket-not-a-url"]');
		for (let i = 0; i < avttIframes.length; i++) {
			const currSrc = avttIframes[i].src;
			const urlParams = new URLSearchParams(currSrc.split('?')[1]);
			const origSrc = urlParams.get('src');
			const src = await getAvttStorageUrl(origSrc, true);
			avttIframes[i].src = `${window.EXTENSION_PATH}iframe.html?src=${encodeURIComponent(src)}`;
		}
		const avttImages = $newHTML.find('img[data-src*="above-bucket-not-a-url"]')

		for(let i = 0; i < avttImages.length; i++){
			const src = await getAvttStorageUrl(avttImages[i].getAttribute('data-src'), true);
			avttImages[i].src = src;
			avttImages[i].href = src;
		}
	    $newHTML.find('.ignore-abovevtt-formating').each(function(index){
			$(this).empty().append(ignoreFormatting[index].innerHTML);
	    })


        $(target).html($newHTML);

		const partyLootTable = $(target).find('.party-item-table');
		for (let i = 0; i < partyLootTable.length; i++) {
			const currTable = $(partyLootTable[i]);
			const rows = currTable.find('tbody tr');
			rows.each(function () {
				
				const link = $(this).find('.item-link-cell a');
				const targetLink = link.length>0 ? link.attr('href') :
									$(this).find('.item-link-cell')?.text();

				const idNameMatch = targetLink?.match(/https.*\/(\d*?)\-(.*)?$/i);
			
				const itemId = link.length > 0 
								? targetLink?.match(/\/(\d*?)\-.*?$/i)?.[1] 
								: idNameMatch?.[1];

				const name = link.length > 0
								? link.text()
									: idNameMatch?.[2].replace(/\-/g, ' ').replace(/\d+$/gi, '').trim();
									
				const quantityCell = $(this).find('.item-quantity-cell');
				const quantity = parseInt($(this).find('.item-quantity-cell').text());
				const itemAddCell = $(this).find('.item-add-cell');
				if(!itemId){
					$(this).find('.item-link-cell').html(targetLink);	
					const currencies = ['cp','sp','ep','gp','pp'];
					const data ={};
					
					for(const currency of currencies){
						const currencyExists = targetLink?.toLowerCase()?.match(new RegExp(`([+-]?\\d+)([\\s]+)?${currency}([\\s,]?|$)`, 'i'))
						if(currencyExists){
							const amount = parseInt(currencyExists[1]);	
							data[currency] = amount;
						}
					}
					const descriptionCell = $(this).find('.item-description-cell');
					
					

					
					if(Object.keys(data).length == 0){
						const descriptionText = descriptionCell.text();
						const delimiters = /(notes:|cost:|weight:)/gi;
						const splitDescription = descriptionText.split(delimiters).map(s => s.trim()).filter(s => s.length > 0);
						const costIndex = splitDescription.findIndex(e => e.toLowerCase() == 'cost:');
						const cost = (costIndex >= 0 && splitDescription.length > costIndex + 1) ? splitDescription[costIndex + 1] : null;
						const weightIndex = splitDescription.findIndex(e => e.toLowerCase() == 'weight:');
						const weight = (weightIndex >= 0 && splitDescription.length > weightIndex + 1) ? splitDescription[weightIndex + 1] : null;
						const notesIndex = splitDescription.findIndex(e => e.toLowerCase() == 'notes:');
						const notes = (notesIndex >= 0 && splitDescription.length > notesIndex + 1) ? splitDescription[notesIndex + 1] : null;		
						
						splitDescription.splice(Math.min(costIndex >= 0 ? costIndex : Infinity, weightIndex >= 0 ? weightIndex : Infinity, notesIndex >= 0 ? notesIndex : Infinity), splitDescription.length);
						const description = splitDescription.join(' ').trim();
						
						const customItem = {
							name: targetLink,
							description,
							cost,
							weight,
							notes
						};
						const button = $(`<button class="item-add-button ignore-abovevtt-formating" data-custom-item='${JSON.stringify(customItem)}' title="Add ${targetLink} to Party Loot">+</button>`);
						itemAddCell.empty().append(button);
					}
					else {
						descriptionCell.html('');
						
						const button = $(`<button class="item-add-button ignore-abovevtt-formating" data-currency='${JSON.stringify(data)}' title="Add ${targetLink} to Party Loot">+</button>`);
						itemAddCell.empty().append(button);
					}
			
				}
				
				if (itemId && window.ITEMS_CACHE) {
					const itemData = find_items_in_cache_by_id_and_name([{ id:itemId, name }]);
					if (itemData.length>0) {
						const descriptionCell = $(this).find('.item-description-cell');
						descriptionCell.html(itemData[0].description);
						if(link.length == 0){
							const itemLink = $(`<a href=${targetLink?.match(/https.*\/\d*?\-.*?$/i)?.[0]}" class='tooltip-hover no-border ignore-abovevtt-formating'>${itemData[0].name}</a>`);
							$(this).find('.item-link-cell').empty().append(itemLink);
						}
						
						
						const button = $(`<button class="item-add-button ignore-abovevtt-formating" data-quantity="${quantity}" data-id="${itemId}" title="Add ${itemData[0].name} to Party Loot">+</button>`);
						itemAddCell.empty().append(button);
					}
				}
				quantityCell.html(`<span class="add-input player-disabled each" data-number="${quantity}" data-spell="${targetLink}"></span>`);
				itemAddCell.append(`<input type="number" class="item-quantity-take-input" min="0" max="${quantity}" value="${quantity}" style="width: 50px; margin-left: 5px;" />`);
			});
		}
		if (partyLootTable.length > 0){
			if(partyLootTable.hasClass('shop')){
				const ppSVG = `<span aria-label="Platinum" class="ct-currency-button__currency-item-preview"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="ddbc-svg  ddbc-ability-icon"><path d="m9.95662 3.30735c.16878-.19532.41258-.30735.66898-.30735h2.7488c.2564 0 .5002.11203.669.30735l5.7367 6.63816c.1418.16409.2199.37469.2199.59269v2.9236c0 .218-.0781.4286-.2199.5927l-5.7367 6.6382c-.1688.1953-.4126.3073-.669.3073h-2.7488c-.2564 0-.5002-.112-.66899-.3073l-5.73668-6.6382c-.14178-.1641-.21993-.3747-.21993-.5927v-2.9236c0-.218.07815-.4286.21993-.59269z" fill="#b5b5b5"></path><path d="m10.8356 18.1585-5.08818-5.8151c-.1595-.1823-.24742-.4162-.24742-.6585v1c0 .2423.08792.4762.24742.6585l5.08818 5.8151c.1899.217.4642.3415.7526.3415h.8236c.2884 0 .5627-.1245.7526-.3415l5.0882-5.8151c.1595-.1823.2474-.4162.2474-.6585v-1c0 .2423-.0879.4762-.2474.6585l-5.0882 5.8151c-.1899.217-.4642.3415-.7526.3415h-.8236c-.2884 0-.5627-.1245-.7526-.3415z" fill="#a3a3a3"></path><path clip-rule="evenodd" d="m11.5882 4.5c-.2884 0-.5627.12448-.7526.34149l-5.08818 5.81511c-.1595.1823-.24742.4163-.24742.6585v1.3698c0 .2422.08792.4762.24742.6585l5.08818 5.8151c.1899.217.4642.3415.7526.3415h.8236c.2884 0 .5627-.1245.7526-.3415l5.0882-5.8151c.1595-.1823.2474-.4163.2474-.6585v-1.3698c0-.2423-.0879-.4762-.2474-.6585l-5.0882-5.8151c-.1899-.21702-.4642-.3415-.7526-.3415zm-1.1344-2.5c-.2884 0-.56272.12448-.75261.34149l-6.45377 7.37574c-.1595.18229-.24742.41627-.24742.65847v3.2486c0 .2422.08792.4762.24742.6585l6.45377 7.3757c.18989.217.46421.3415.75261.3415h3.0924c.2884 0 .5627-.1245.7526-.3415l6.4538-7.3757c.1595-.1823.2474-.4163.2474-.6585v-3.2486c0-.2422-.0879-.47618-.2474-.65847l-6.4538-7.37573c-.1899-.21702-.4642-.3415-.7526-.3415z" fill="#949494" fill-rule="evenodd"></path><path d="m10.2929 9.12132c-.39053-.39052-.39053-1.02369 0-1.41421l1.2463-1.41422c.3905-.39052 1.0237-.39052 1.4142 0l3.6679 4.29291c.3905.3905.3905 1.0237 0 1.4142l-1.4142 1.4142c-.3905.3905-1.0237.3905-1.4142 0z" fill="#dcdcdc"></path><path d="m8.34764 10.2442c.42128-.36072 1.05967-.31674 1.42589.0983l1.25207 1.3511c.3662.415.3216 1.0439-.0997 1.4046-.4213.3608-1.05969.3168-1.4259-.0982l-1.25207-1.3511c-.36621-.415-.32157-1.0439.09971-1.4047z" fill="#ccc"></path><path d="m11.9999 2.47315c.3413-.26295 1.5-.37315 2 .02685l4 4.5c.3662.37344.3216.93932-.0997 1.26394s-1.0597.28505-1.4259-.08838c0 0-2.74-3.30604-3.5744-3.98415-.3682-.29925-.7065-.1553-.9997-.45432-.2932-.29901-.2416-1.00098.0997-1.26394z" fill="#ccc"></path><circle cx="18.6001" cy="9.25" fill="#b5b5b5" r="1"></circle></svg></span>`;
				const gpSVG = `<span aria-label="Gold" class="ct-currency-button__currency-item-preview"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="ddbc-svg  ddbc-ability-icon"><path d="m4 4.5c0-.27615.22385-.5.5-.5h15c.2761 0 .5.22385.5.5v1c0 .27615-.2239.5-.5.5 0 0-2 2.32653-2 6 0 3.6735 2 6 2 6 .2761 0 .5.2239.5.5v1c0 .2761-.2239.5-.5.5h-15c-.27615 0-.5-.2239-.5-.5v-1c0-.2761.22385-.5.5-.5 0 0 2-1.8673 2-6 0-4.13265-2-6-2-6-.27615 0-.5-.22385-.5-.5z" fill="#dd970e"></path><path d="m9.99993 12c0-.6216-.03345-1.2128-.09414-1.7735l4.11311 1.0283c-.002.04-.0039.0802-.0056.1205l-4.07254 2.0363c.03844-.4517.05917-.9222.05917-1.4116z" fill="#eca825"></path><path d="m9.79321 14.6034 4.21509-2.1076c.0516 1.5192.3351 2.8657.7046 4.0042h-5.36158c.17845-.5819.33016-1.214.44189-1.8966z" fill="#eca825"></path><path d="m14.0189 11.2548-4.11311-1.0283c-.10897-1.00676-.30575-1.91549-.55447-2.7265h5.36158c-.3492 1.07581-.6215 2.3373-.694 3.7548z" fill="#ffb72c"></path><path d="m6.26343 5.5h11.54557c-.1777.29323-.3708.64106-.5624 1.0399-.0702.14609-.1404.29953-.2097.4601h-9.99142c-.10248-.24281-.20889-.47037-.31689-.68278-.15543-.30571-.31301-.57786-.46516-.81722z" fill="#eca825"></path><path clip-rule="evenodd" d="m17.8089 5.5h-11.54556c.15215.23936.30973.51151.46516.81722.66607 1.31004 1.2715 3.19617 1.2715 5.68278 0 2.4866-.60543 4.3727-1.2715 5.6828-.15543.3057-.31301.5778-.46516.8172h11.54556c-.1777-.2932-.3708-.6411-.5624-1.0399-.6216-1.2941-1.2465-3.1649-1.2465-5.4601 0-2.29517.6249-4.166 1.2465-5.4601.1916-.39884.3847-.74667.5624-1.0399zm2.6911 12.5s-2-2.3265-2-6c0-3.67347 2-6 2-6 .2761 0 .5-.22385.5-.5v-2c0-.27615-.2239-.5-.5-.5h-17c-.27615 0-.5.22385-.5.5v2c0 .27615.22385.5.5.5 0 0 2 1.86735 2 6 0 4.1327-2 6-2 6-.27615 0-.5.2239-.5.5v2c0 .2761.22385.5.5.5h17c.2761 0 .5-.2239.5-.5v-2c0-.2761-.2239-.5-.5-.5z" fill="#c78727" fill-rule="evenodd"></path><path d="m8 4.25c0-.41421.33579-.75.75-.75h11c.4142 0 .75.33579.75.75s-.3358.75-.75.75h-11c-.41421 0-.75-.33579-.75-.75z" fill="#ffb72c"></path><circle cx="6.75" cy="4.25" fill="#eca825" r=".75"></circle></svg></span>`;
				const epSVG = `<span aria-label="Electrum" class="ct-currency-button__currency-item-preview"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="ddbc-svg  ddbc-ability-icon"><path clip-rule="evenodd" d="m7.32745 3c-.42911 0-.84556.13554-1.16546.42156-1.20722 1.07938-4.16199 4.17139-4.16199 8.57844 0 4.407 2.95477 7.4991 4.16199 8.5784.3199.2861.73635.4216 1.16547.4216h9.34504c.4292 0 .8456-.1355 1.1655-.4216 1.2072-1.0793 4.162-4.1714 4.162-8.5784 0-4.40704-2.9548-7.49906-4.162-8.57844-.3199-.28602-.7363-.42156-1.1655-.42156zm4.67255 14.25c.6904 0 1.25-.5596 1.25-1.25s-.5596-1.25-1.25-1.25-1.25.5596-1.25 1.25.5596 1.25 1.25 1.25z" fill="#8a9eac" fill-rule="evenodd"></path><path d="m7.03711 16.9284c.34586.3796.84504.5716 1.35854.5716h7.20875c.5134 0 1.0126-.192 1.3585-.5716 1.0485-1.1506 2.3552-3.0498 2.5198-5.4284.0114.1644.0173.3311.0173.5 0 2.6125-1.4162 4.6983-2.5371 5.9284-.3459.3796-.845.5716-1.3585.5716h-7.20875c-.5135 0-1.01268-.192-1.35854-.5716-1.12095-1.2301-2.53711-3.3159-2.53711-5.9284 0-.1689.00592-.3356.01729-.5.16458 2.3786 1.47133 4.2778 2.51982 5.4284z" fill="#6d7f8c"></path><path d="m14.7246 16.375c-.1829 1.3414-1.333 2.375-2.7246 2.375s-2.54175-1.0336-2.72465-2.375c-.01671.1226-.02535.2478-.02535.375 0 1.5188 1.2312 2.75 2.75 2.75s2.75-1.2312 2.75-2.75c0-.1272-.0086-.2524-.0254-.375z" fill="#6d7f8c"></path><path clip-rule="evenodd" d="m14.75 16c0 1.5188-1.2312 2.75-2.75 2.75s-2.75-1.2312-2.75-2.75 1.2312-2.75 2.75-2.75 2.75 1.2312 2.75 2.75zm-2.75 1.25c.6904 0 1.25-.5596 1.25-1.25s-.5596-1.25-1.25-1.25-1.25.5596-1.25 1.25.5596 1.25 1.25 1.25z" fill="#7c8d99" fill-rule="evenodd"></path><circle cx="12" cy="16" fill="#8697a3" fill-opacity=".5" r="1.25"></circle><path clip-rule="evenodd" d="m8.39565 5.5c-.5135 0-1.01268.19203-1.35854.57159-1.12095 1.23016-2.53711 3.31587-2.53711 5.92841 0 2.6125 1.41616 4.6983 2.53711 5.9284.34586.3796.84504.5716 1.35854.5716h7.20875c.5135 0 1.0126-.192 1.3585-.5716 1.1209-1.2301 2.5371-3.3159 2.5371-5.9284 0-2.61254-1.4162-4.69825-2.5371-5.92841-.3459-.37956-.8451-.57159-1.3585-.57159zm-1.0682-2.5c-.42911 0-.84556.13554-1.16546.42156-1.20722 1.07938-4.16199 4.17139-4.16199 8.57844 0 4.407 2.95477 7.4991 4.16199 8.5784.3199.2861.73635.4216 1.16547.4216h9.34504c.4292 0 .8456-.1355 1.1655-.4216 1.2072-1.0793 4.162-4.1714 4.162-8.5784 0-4.40704-2.9548-7.49906-4.162-8.57844-.3199-.28602-.7363-.42156-1.1655-.42156z" fill="#7c8d99" fill-rule="evenodd"></path><path d="m9.75003 9.13768c.23943.5003.03173 1.10552-.46392 1.35192l-1.62912.8597c-.49566.2463-1.09156.0404-1.33099-.4599s-.03173-1.10555.46392-1.35187l1.62912-.85971c.49566-.24633 1.09156-.04044 1.33099.45986z" fill="#7c8d99"></path><path d="m10 8c0-1.10457.8954-2 2-2h3c1.6569 0 3 1.34315 3 3v1c0 1.1046-.8954 2-2 2h-4c-1.1046 0-2-.8954-2-2z" fill="#9fb3c0"></path><path clip-rule="evenodd" d="m11.8507 3.53389c-.4997.02746-.8798.4106-.8489.85577.0308.44514.4608.78374.9604.75632l.0092-.00049.0303-.00157c.027-.00137.0673-.00336.1193-.00575.1039-.0048.6517.00093.6517.00093l1.3785-.02395s1.0448.01588 1.4768.05451c.2164.01934.3931.04327.5261.07005.1131.02275.1591.04034.1591.04034.8407.47238 1.3364 1.1415 1.969 2.07148.3071.45151.5537.87024.7234 1.17593.0846.15247.1495.27584.1927.35991.0216.04201.0377.07413.0481.09509l.0113.02287.0023.00484c.1974.40967.7304.60007 1.1904.42444.4601-.1757.6733-.65045.4761-1.0604l-.0008-.00162-.0014-.0028-.0044-.00908-.0156-.03164c-.0133-.02693-.0326-.06533-.0576-.1139-.0499-.0971-.1225-.23511-.216-.40351-.1865-.33604-.4578-.797-.7981-1.29727-.6596-.96959-1.3422-1.92667-2.5695-2.61007-.2296-.12785-.4955-.197-.7095-.24006-.2307-.04644-.4866-.07863-.7446-.10169-.5167-.04619-1.6535-.06257-1.6535-.06257s-1.0706.0119-1.4533.02517c-.1918.00665-.5643-.0051-.6749 0-.0553.00255-.0988.00469-.1288.00622l-.0347.00179z" fill="#9fb3c0" fill-rule="evenodd"></path><circle cx="9.75" cy="4.25" fill="#8a9eac" r=".75"></circle></svg></span>`;
				const spSVG = `<span aria-label="Silver" class="ct-currency-button__currency-item-preview"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="ddbc-svg  ddbc-ability-icon"><path clip-rule="evenodd" d="m2.49372 21c-.3779 0-.61528-.4138-.42875-.7473l9.50623-16.99932c.189-.33784.6686-.33784.8576 0l9.5062 16.99932c.1866.3335-.0508.7473-.4287.7473zm9.50628-5c.6904 0 1.25-.5596 1.25-1.25s-.5596-1.25-1.25-1.25-1.25.5596-1.25 1.25.5596 1.25 1.25 1.25z" fill="#a59e98" fill-rule="evenodd"></path><path clip-rule="evenodd" d="m2.06497 20.2527c-.18653.3335.05085.7473.42875.7473h19.01258c.3779 0 .6153-.4138.4287-.7473l-9.5062-16.99932c-.189-.33784-.6686-.33784-.8576 0zm10.15323-12.30742c-.0954-.17063-.341-.17063-.4364 0l-5.69332 10.18092c-.09319.1666.02727.372.21819.372h11.38663c.191 0 .3114-.2054.2182-.372z" fill="#99938d" fill-rule="evenodd"></path><path d="m12 17.25c1.3807 0 2.5-1.1193 2.5-2.5 0-.1714-.0173-.3388-.0501-.5005.1919.3752.3001.8002.3001 1.2505 0 1.5188-1.2312 2.75-2.75 2.75s-2.75-1.2312-2.75-2.75c0-.4503.10824-.8753.30011-1.2505-.03286.1617-.05011.3291-.05011.5005 0 1.3807 1.1193 2.5 2.5 2.5z" fill="#857d76"></path><circle cx="12" cy="14.75" fill="#a59e98" fill-opacity=".5" r="1.25"></circle><path d="m11.7819 7.94529c.0954-.17064.341-.17064.4364 0l5.6933 10.18091c.0932.1666-.0273.372-.2182.372h-.133l-5.3421-9.55291c-.0954-.17064-.341-.17064-.4364 0l-5.34216 9.55291h-.13298c-.19093 0-.31139-.2054-.2182-.372z" fill="#b5ada7"></path><path d="m11.6724 11.3586c-.2371-.4211.1496-1.88397.5707-2.12106.1389-.07818.7171.84136.9542 1.26246l.5249 1.1414c.2371.4211.0879.9547-.3331 1.1918-.4211.2371-.9547.0879-1.1918-.3332z" fill="#b5ada7"></path><path d="m11.4292 5.62102c-.2371-.42109.1496-1.88394.5707-2.12103.1389-.07818.7172.84137.9542 1.26246l3.0664 5.44615c.2371.4211.0879.9546-.3332 1.1917s-.9547.0879-1.1917-.3332z" fill="#cec6bf"></path></svg></span>`;
				const cpSVG = `<span aria-label="Copper" class="ct-currency-button__currency-item-preview"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="ddbc-svg  ddbc-ability-icon"><path clip-rule="evenodd" d="m6.41421 3c-.26521 0-.51957.10536-.7071.29289l-2.41422 2.41422c-.18753.18753-.29289.44189-.29289.7071v11.17159c0 .2652.10536.5196.29289.7071l2.41422 2.4142c.18753.1875.44189.2929.7071.2929h11.17159c.2652 0 .5196-.1054.7071-.2929l2.4142-2.4142c.1875-.1875.2929-.4419.2929-.7071v-11.17159c0-.26521-.1054-.51957-.2929-.7071l-2.4142-2.41422c-.1875-.18753-.4419-.29289-.7071-.29289zm5.58579 10.5c.8284 0 1.5-.6716 1.5-1.5s-.6716-1.5-1.5-1.5-1.5.6716-1.5 1.5.6716 1.5 1.5 1.5z" fill="#ab6e57" fill-rule="evenodd"></path><path d="m10 9c0-1.10457.8954-2 2-2h4c1.1046 0 2 .89543 2 2v1c0 1.1046-.8954 2-2 2h-1c0-1.6569-1.3431-3-3-3-.7684 0-1.4692.28885-2 .76389z" fill="#c2866f"></path><path d="m17.7071 7.94975-.6568-.65686c-.1876-.18753-.4419-.29289-.7072-.29289h-8.68625c-.26521 0-.51957.10536-.7071.29289l-.65686.65686c-.18753.18753-.29289.44189-.29289.7071v-1c0-.26521.10536-.51957.29289-.7071l.65686-.65686c.18753-.18753.44189-.29289.7071-.29289h8.68625c.2653 0 .5196.10536.7072.29289l.6568.65686c.1875.18753.2929.44189.2929.7071v1c0-.26521-.1054-.51957-.2929-.7071z" fill="#9f6854"></path><path d="m14.9585 12.5c-.238 1.4189-1.472 2.5-2.9585 2.5s-2.72048-1.0811-2.95852-2.5c-.02728.1626-.04148.3296-.04148.5 0 1.6569 1.3431 3 3 3s3-1.3431 3-3c0-.1704-.0142-.3374-.0415-.5z" fill="#9f6854"></path><g fill="#c2866f"><path clip-rule="evenodd" d="m15 12c0 1.6569-1.3431 3-3 3s-3-1.3431-3-3 1.3431-3 3-3 3 1.3431 3 3zm-3 1.5c.8284 0 1.5-.6716 1.5-1.5s-.6716-1.5-1.5-1.5-1.5.6716-1.5 1.5.6716 1.5 1.5 1.5z" fill-rule="evenodd"></path><circle cx="12" cy="12" fill-opacity=".5" r="1.5"></circle><path clip-rule="evenodd" d="m6.29289 6.94975c-.18753.18753-.29289.44189-.29289.7071v8.68625c0 .2653.10536.5196.29289.7072l.65686.6568c.18753.1875.44189.2929.7071.2929h8.68625c.2653 0 .5196-.1054.7072-.2929l.6568-.6568c.1875-.1876.2929-.4419.2929-.7072v-8.68625c0-.26521-.1054-.51957-.2929-.7071l-.6568-.65686c-.1876-.18753-.4419-.29289-.7072-.29289h-8.68625c-.26521 0-.51957.10536-.7071.29289zm.12132-3.94975c-.26521 0-.51957.10536-.7071.29289l-2.41422 2.41422c-.18753.18753-.29289.44189-.29289.7071v11.17159c0 .2652.10536.5196.29289.7071l2.41422 2.4142c.18753.1875.44189.2929.7071.2929h11.17159c.2652 0 .5196-.1054.7071-.2929l2.4142-2.4142c.1875-.1875.2929-.4419.2929-.7071v-11.17159c0-.26521-.1054-.51957-.2929-.7071l-2.4142-2.41422c-.1875-.18753-.4419-.29289-.7071-.29289z" fill-rule="evenodd"></path></g><path clip-rule="evenodd" d="m10.125 4.5c0-.48325.3918-.875.875-.875h6.0858c.4973 0 .9742.19754 1.3258.54917l1.4142 1.41422c.3517.35163.5492.82854.5492 1.32582v3.58579c0 .4832-.3918.875-.875.875s-.875-.3918-.875-.875v-3.58579c0-.03315-.0132-.06494-.0366-.08838l-1.4142-1.41422c-.0235-.02344-.0553-.03661-.0884-.03661h-6.0858c-.4832 0-.875-.39175-.875-.875z" fill="#e6a58c" fill-rule="evenodd"></path><circle cx="8.375" cy="4.47501" fill="#e5a48c" r=".875"></circle></svg></span>`;
				const partyCurrency = window.PARTY_INVENTORY_DATA?.currency ? window.PARTY_INVENTORY_DATA.currency : { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };
				const currencyString = `Party Currency: ${partyCurrency.pp != 0 ? `${partyCurrency.pp}${ppSVG} ` : ''}${partyCurrency.gp != 0 ? `${partyCurrency.gp}${gpSVG} ` : ''}${partyCurrency.ep != 0 ? `${partyCurrency.ep}${epSVG} ` : ''}${partyCurrency.sp != 0 ? `${partyCurrency.sp}${spSVG} ` : ''}${partyCurrency.cp != 0 ? `${partyCurrency.cp}${cpSVG} ` : ''}`;
				const currencyHeader = $(`<div class='party-currency ignore-abovevtt-formating' style="margin-bottom: 10px; font-weight: bold;">${currencyString}</div>`);
				partyLootTable.before(currencyHeader);
			}
			

			const addAllButton = $(`<button class="item-add-all-button ignore-abovevtt-formating" title="Add All Items to Party Loot">Add All</button>`);
			partyLootTable.find('>thead>tr>th:last-of-type').append(addAllButton);

			$(target).off('click.addPartyLootItem').on('click.addPartyLootItem', '.item-add-button', function (e) {
				e.preventDefault();
				e.stopPropagation();
				const quantityInput = $(this).closest('tr').find('td.item-quantity-cell>input');
				const takeInput = $(this).closest('tr').find('td>input.item-quantity-take-input');
				const currQuantity = parseInt(quantityInput.val());
				const quantity = parseInt(takeInput.val());
				if (isNaN(quantity) || quantity <= 0) {
					return;
				}
				const newQuantity = currQuantity - quantity;
				quantityInput.val(newQuantity);
				quantityInput.trigger('change');
				if (quantity > newQuantity){
					takeInput.val(newQuantity);
				}
				const costCell = $(this).closest('tr').find('td.item-cost-cell');
				
				if(costCell.length > 0){
					const costData = {};
					const currencies = ['cp', 'sp', 'ep', 'gp', 'pp'];
					const costText = costCell.text().toLowerCase();
					for (const currency of currencies) {
						const currencyExists = costText.match(new RegExp(`([+-]?\\d+)([\\s]+)?${currency}([\\s,]?|$)`, 'i'))
						if (currencyExists) {
							const amount = parseInt(currencyExists[1]);
							costData[currency] = -amount * quantity;
						}
					}
					window.partyInventoryQueue.addToQueue({
						type: 'currency',
						data: costData,
					});
				}
					
				takeInput.attr('max', Math.max(0, newQuantity));
				const currencyMatch = $(this).data('currency');
				if(currencyMatch){
					const currencyData = currencyMatch;	
					for(let i = 1; i<=quantity; i++){
						window.partyInventoryQueue.addToQueue({
							type: 'currency',
							data: currencyData,
						});
					}
					return;
				}
				const customItemMatch = $(this).data('custom-item');
				if(customItemMatch){
					const customItemData = customItemMatch;
					customItemData.quantity = quantity;
					window.partyInventoryQueue.addToQueue({
						type: 'customItem',
						data: customItemData
					});
					return;
				}
				const id = $(this).data('id');
				const name = $(this).closest('tr').find('.item-link-cell a').text();
				
				const itemData = find_items_in_cache_by_id_and_name([{id, name}]);
				
				console.log(`[PartyLoot] Adding ${quantity} of item ${name} to queue`);
				
				if (quantity > 10){
	
					let remaining = quantity;
					while(remaining > 0) {
						const batchSize = Math.min(10, remaining);
						window.partyInventoryQueue.addToQueue({
							type: 'items',
							data: [{
								...itemData[0],
								quantity: batchSize
							}]
						});
						console.log(`[PartyLoot] Queued batch of ${batchSize} items`);
						remaining -= batchSize;
					}
				} else {
					itemData[0].quantity = quantity;
					window.partyInventoryQueue.addToQueue({
						type: 'items',
						data: itemData
					});
					console.log(`[PartyLoot] Queued single batch of ${quantity} items`);
				}
			});
			$(target).off('click.addAllPartyLootItem').on('click.addAllPartyLootItem', '.item-add-all-button', function (e) {
				e.preventDefault();
				e.stopPropagation();
				const table = $(this).closest('table');
				table.find('.item-add-button').each(function(index){
					$(this).click();					
				});
			});
		}

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
	update_party_available_currency(){
		const partyLootTable = $('.note-text .party-item-table');
		if (partyLootTable.length > 0) {
			if (partyLootTable.hasClass('shop')) {
				const ppSVG = `<span aria-label="Platinum" class="ct-currency-button__currency-item-preview"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="ddbc-svg  ddbc-ability-icon"><path d="m9.95662 3.30735c.16878-.19532.41258-.30735.66898-.30735h2.7488c.2564 0 .5002.11203.669.30735l5.7367 6.63816c.1418.16409.2199.37469.2199.59269v2.9236c0 .218-.0781.4286-.2199.5927l-5.7367 6.6382c-.1688.1953-.4126.3073-.669.3073h-2.7488c-.2564 0-.5002-.112-.66899-.3073l-5.73668-6.6382c-.14178-.1641-.21993-.3747-.21993-.5927v-2.9236c0-.218.07815-.4286.21993-.59269z" fill="#b5b5b5"></path><path d="m10.8356 18.1585-5.08818-5.8151c-.1595-.1823-.24742-.4162-.24742-.6585v1c0 .2423.08792.4762.24742.6585l5.08818 5.8151c.1899.217.4642.3415.7526.3415h.8236c.2884 0 .5627-.1245.7526-.3415l5.0882-5.8151c.1595-.1823.2474-.4162.2474-.6585v-1c0 .2423-.0879.4762-.2474.6585l-5.0882 5.8151c-.1899.217-.4642.3415-.7526.3415h-.8236c-.2884 0-.5627-.1245-.7526-.3415z" fill="#a3a3a3"></path><path clip-rule="evenodd" d="m11.5882 4.5c-.2884 0-.5627.12448-.7526.34149l-5.08818 5.81511c-.1595.1823-.24742.4163-.24742.6585v1.3698c0 .2422.08792.4762.24742.6585l5.08818 5.8151c.1899.217.4642.3415.7526.3415h.8236c.2884 0 .5627-.1245.7526-.3415l5.0882-5.8151c.1595-.1823.2474-.4163.2474-.6585v-1.3698c0-.2423-.0879-.4762-.2474-.6585l-5.0882-5.8151c-.1899-.21702-.4642-.3415-.7526-.3415zm-1.1344-2.5c-.2884 0-.56272.12448-.75261.34149l-6.45377 7.37574c-.1595.18229-.24742.41627-.24742.65847v3.2486c0 .2422.08792.4762.24742.6585l6.45377 7.3757c.18989.217.46421.3415.75261.3415h3.0924c.2884 0 .5627-.1245.7526-.3415l6.4538-7.3757c.1595-.1823.2474-.4163.2474-.6585v-3.2486c0-.2422-.0879-.47618-.2474-.65847l-6.4538-7.37573c-.1899-.21702-.4642-.3415-.7526-.3415z" fill="#949494" fill-rule="evenodd"></path><path d="m10.2929 9.12132c-.39053-.39052-.39053-1.02369 0-1.41421l1.2463-1.41422c.3905-.39052 1.0237-.39052 1.4142 0l3.6679 4.29291c.3905.3905.3905 1.0237 0 1.4142l-1.4142 1.4142c-.3905.3905-1.0237.3905-1.4142 0z" fill="#dcdcdc"></path><path d="m8.34764 10.2442c.42128-.36072 1.05967-.31674 1.42589.0983l1.25207 1.3511c.3662.415.3216 1.0439-.0997 1.4046-.4213.3608-1.05969.3168-1.4259-.0982l-1.25207-1.3511c-.36621-.415-.32157-1.0439.09971-1.4047z" fill="#ccc"></path><path d="m11.9999 2.47315c.3413-.26295 1.5-.37315 2 .02685l4 4.5c.3662.37344.3216.93932-.0997 1.26394s-1.0597.28505-1.4259-.08838c0 0-2.74-3.30604-3.5744-3.98415-.3682-.29925-.7065-.1553-.9997-.45432-.2932-.29901-.2416-1.00098.0997-1.26394z" fill="#ccc"></path><circle cx="18.6001" cy="9.25" fill="#b5b5b5" r="1"></circle></svg></span>`;
				const gpSVG = `<span aria-label="Gold" class="ct-currency-button__currency-item-preview"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="ddbc-svg  ddbc-ability-icon"><path d="m4 4.5c0-.27615.22385-.5.5-.5h15c.2761 0 .5.22385.5.5v1c0 .27615-.2239.5-.5.5 0 0-2 2.32653-2 6 0 3.6735 2 6 2 6 .2761 0 .5.2239.5.5v1c0 .2761-.2239.5-.5.5h-15c-.27615 0-.5-.2239-.5-.5v-1c0-.2761.22385-.5.5-.5 0 0 2-1.8673 2-6 0-4.13265-2-6-2-6-.27615 0-.5-.22385-.5-.5z" fill="#dd970e"></path><path d="m9.99993 12c0-.6216-.03345-1.2128-.09414-1.7735l4.11311 1.0283c-.002.04-.0039.0802-.0056.1205l-4.07254 2.0363c.03844-.4517.05917-.9222.05917-1.4116z" fill="#eca825"></path><path d="m9.79321 14.6034 4.21509-2.1076c.0516 1.5192.3351 2.8657.7046 4.0042h-5.36158c.17845-.5819.33016-1.214.44189-1.8966z" fill="#eca825"></path><path d="m14.0189 11.2548-4.11311-1.0283c-.10897-1.00676-.30575-1.91549-.55447-2.7265h5.36158c-.3492 1.07581-.6215 2.3373-.694 3.7548z" fill="#ffb72c"></path><path d="m6.26343 5.5h11.54557c-.1777.29323-.3708.64106-.5624 1.0399-.0702.14609-.1404.29953-.2097.4601h-9.99142c-.10248-.24281-.20889-.47037-.31689-.68278-.15543-.30571-.31301-.57786-.46516-.81722z" fill="#eca825"></path><path clip-rule="evenodd" d="m17.8089 5.5h-11.54556c.15215.23936.30973.51151.46516.81722.66607 1.31004 1.2715 3.19617 1.2715 5.68278 0 2.4866-.60543 4.3727-1.2715 5.6828-.15543.3057-.31301.5778-.46516.8172h11.54556c-.1777-.2932-.3708-.6411-.5624-1.0399-.6216-1.2941-1.2465-3.1649-1.2465-5.4601 0-2.29517.6249-4.166 1.2465-5.4601.1916-.39884.3847-.74667.5624-1.0399zm2.6911 12.5s-2-2.3265-2-6c0-3.67347 2-6 2-6 .2761 0 .5-.22385.5-.5v-2c0-.27615-.2239-.5-.5-.5h-17c-.27615 0-.5.22385-.5.5v2c0 .27615.22385.5.5.5 0 0 2 1.86735 2 6 0 4.1327-2 6-2 6-.27615 0-.5.2239-.5.5v2c0 .2761.22385.5.5.5h17c.2761 0 .5-.2239.5-.5v-2c0-.2761-.2239-.5-.5-.5z" fill="#c78727" fill-rule="evenodd"></path><path d="m8 4.25c0-.41421.33579-.75.75-.75h11c.4142 0 .75.33579.75.75s-.3358.75-.75.75h-11c-.41421 0-.75-.33579-.75-.75z" fill="#ffb72c"></path><circle cx="6.75" cy="4.25" fill="#eca825" r=".75"></circle></svg></span>`;
				const epSVG = `<span aria-label="Electrum" class="ct-currency-button__currency-item-preview"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="ddbc-svg  ddbc-ability-icon"><path clip-rule="evenodd" d="m7.32745 3c-.42911 0-.84556.13554-1.16546.42156-1.20722 1.07938-4.16199 4.17139-4.16199 8.57844 0 4.407 2.95477 7.4991 4.16199 8.5784.3199.2861.73635.4216 1.16547.4216h9.34504c.4292 0 .8456-.1355 1.1655-.4216 1.2072-1.0793 4.162-4.1714 4.162-8.5784 0-4.40704-2.9548-7.49906-4.162-8.57844-.3199-.28602-.7363-.42156-1.1655-.42156zm4.67255 14.25c.6904 0 1.25-.5596 1.25-1.25s-.5596-1.25-1.25-1.25-1.25.5596-1.25 1.25.5596 1.25 1.25 1.25z" fill="#8a9eac" fill-rule="evenodd"></path><path d="m7.03711 16.9284c.34586.3796.84504.5716 1.35854.5716h7.20875c.5134 0 1.0126-.192 1.3585-.5716 1.0485-1.1506 2.3552-3.0498 2.5198-5.4284.0114.1644.0173.3311.0173.5 0 2.6125-1.4162 4.6983-2.5371 5.9284-.3459.3796-.845.5716-1.3585.5716h-7.20875c-.5135 0-1.01268-.192-1.35854-.5716-1.12095-1.2301-2.53711-3.3159-2.53711-5.9284 0-.1689.00592-.3356.01729-.5.16458 2.3786 1.47133 4.2778 2.51982 5.4284z" fill="#6d7f8c"></path><path d="m14.7246 16.375c-.1829 1.3414-1.333 2.375-2.7246 2.375s-2.54175-1.0336-2.72465-2.375c-.01671.1226-.02535.2478-.02535.375 0 1.5188 1.2312 2.75 2.75 2.75s2.75-1.2312 2.75-2.75c0-.1272-.0086-.2524-.0254-.375z" fill="#6d7f8c"></path><path clip-rule="evenodd" d="m14.75 16c0 1.5188-1.2312 2.75-2.75 2.75s-2.75-1.2312-2.75-2.75 1.2312-2.75 2.75-2.75 2.75 1.2312 2.75 2.75zm-2.75 1.25c.6904 0 1.25-.5596 1.25-1.25s-.5596-1.25-1.25-1.25-1.25.5596-1.25 1.25.5596 1.25 1.25 1.25z" fill="#7c8d99" fill-rule="evenodd"></path><circle cx="12" cy="16" fill="#8697a3" fill-opacity=".5" r="1.25"></circle><path clip-rule="evenodd" d="m8.39565 5.5c-.5135 0-1.01268.19203-1.35854.57159-1.12095 1.23016-2.53711 3.31587-2.53711 5.92841 0 2.6125 1.41616 4.6983 2.53711 5.9284.34586.3796.84504.5716 1.35854.5716h7.20875c.5135 0 1.0126-.192 1.3585-.5716 1.1209-1.2301 2.5371-3.3159 2.5371-5.9284 0-2.61254-1.4162-4.69825-2.5371-5.92841-.3459-.37956-.8451-.57159-1.3585-.57159zm-1.0682-2.5c-.42911 0-.84556.13554-1.16546.42156-1.20722 1.07938-4.16199 4.17139-4.16199 8.57844 0 4.407 2.95477 7.4991 4.16199 8.5784.3199.2861.73635.4216 1.16547.4216h9.34504c.4292 0 .8456-.1355 1.1655-.4216 1.2072-1.0793 4.162-4.1714 4.162-8.5784 0-4.40704-2.9548-7.49906-4.162-8.57844-.3199-.28602-.7363-.42156-1.1655-.42156z" fill="#7c8d99" fill-rule="evenodd"></path><path d="m9.75003 9.13768c.23943.5003.03173 1.10552-.46392 1.35192l-1.62912.8597c-.49566.2463-1.09156.0404-1.33099-.4599s-.03173-1.10555.46392-1.35187l1.62912-.85971c.49566-.24633 1.09156-.04044 1.33099.45986z" fill="#7c8d99"></path><path d="m10 8c0-1.10457.8954-2 2-2h3c1.6569 0 3 1.34315 3 3v1c0 1.1046-.8954 2-2 2h-4c-1.1046 0-2-.8954-2-2z" fill="#9fb3c0"></path><path clip-rule="evenodd" d="m11.8507 3.53389c-.4997.02746-.8798.4106-.8489.85577.0308.44514.4608.78374.9604.75632l.0092-.00049.0303-.00157c.027-.00137.0673-.00336.1193-.00575.1039-.0048.6517.00093.6517.00093l1.3785-.02395s1.0448.01588 1.4768.05451c.2164.01934.3931.04327.5261.07005.1131.02275.1591.04034.1591.04034.8407.47238 1.3364 1.1415 1.969 2.07148.3071.45151.5537.87024.7234 1.17593.0846.15247.1495.27584.1927.35991.0216.04201.0377.07413.0481.09509l.0113.02287.0023.00484c.1974.40967.7304.60007 1.1904.42444.4601-.1757.6733-.65045.4761-1.0604l-.0008-.00162-.0014-.0028-.0044-.00908-.0156-.03164c-.0133-.02693-.0326-.06533-.0576-.1139-.0499-.0971-.1225-.23511-.216-.40351-.1865-.33604-.4578-.797-.7981-1.29727-.6596-.96959-1.3422-1.92667-2.5695-2.61007-.2296-.12785-.4955-.197-.7095-.24006-.2307-.04644-.4866-.07863-.7446-.10169-.5167-.04619-1.6535-.06257-1.6535-.06257s-1.0706.0119-1.4533.02517c-.1918.00665-.5643-.0051-.6749 0-.0553.00255-.0988.00469-.1288.00622l-.0347.00179z" fill="#9fb3c0" fill-rule="evenodd"></path><circle cx="9.75" cy="4.25" fill="#8a9eac" r=".75"></circle></svg></span>`;
				const spSVG = `<span aria-label="Silver" class="ct-currency-button__currency-item-preview"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="ddbc-svg  ddbc-ability-icon"><path clip-rule="evenodd" d="m2.49372 21c-.3779 0-.61528-.4138-.42875-.7473l9.50623-16.99932c.189-.33784.6686-.33784.8576 0l9.5062 16.99932c.1866.3335-.0508.7473-.4287.7473zm9.50628-5c.6904 0 1.25-.5596 1.25-1.25s-.5596-1.25-1.25-1.25-1.25.5596-1.25 1.25.5596 1.25 1.25 1.25z" fill="#a59e98" fill-rule="evenodd"></path><path clip-rule="evenodd" d="m2.06497 20.2527c-.18653.3335.05085.7473.42875.7473h19.01258c.3779 0 .6153-.4138.4287-.7473l-9.5062-16.99932c-.189-.33784-.6686-.33784-.8576 0zm10.15323-12.30742c-.0954-.17063-.341-.17063-.4364 0l-5.69332 10.18092c-.09319.1666.02727.372.21819.372h11.38663c.191 0 .3114-.2054.2182-.372z" fill="#99938d" fill-rule="evenodd"></path><path d="m12 17.25c1.3807 0 2.5-1.1193 2.5-2.5 0-.1714-.0173-.3388-.0501-.5005.1919.3752.3001.8002.3001 1.2505 0 1.5188-1.2312 2.75-2.75 2.75s-2.75-1.2312-2.75-2.75c0-.4503.10824-.8753.30011-1.2505-.03286.1617-.05011.3291-.05011.5005 0 1.3807 1.1193 2.5 2.5 2.5z" fill="#857d76"></path><circle cx="12" cy="14.75" fill="#a59e98" fill-opacity=".5" r="1.25"></circle><path d="m11.7819 7.94529c.0954-.17064.341-.17064.4364 0l5.6933 10.18091c.0932.1666-.0273.372-.2182.372h-.133l-5.3421-9.55291c-.0954-.17064-.341-.17064-.4364 0l-5.34216 9.55291h-.13298c-.19093 0-.31139-.2054-.2182-.372z" fill="#b5ada7"></path><path d="m11.6724 11.3586c-.2371-.4211.1496-1.88397.5707-2.12106.1389-.07818.7171.84136.9542 1.26246l.5249 1.1414c.2371.4211.0879.9547-.3331 1.1918-.4211.2371-.9547.0879-1.1918-.3332z" fill="#b5ada7"></path><path d="m11.4292 5.62102c-.2371-.42109.1496-1.88394.5707-2.12103.1389-.07818.7172.84137.9542 1.26246l3.0664 5.44615c.2371.4211.0879.9546-.3332 1.1917s-.9547.0879-1.1917-.3332z" fill="#cec6bf"></path></svg></span>`;
				const cpSVG = `<span aria-label="Copper" class="ct-currency-button__currency-item-preview"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="ddbc-svg  ddbc-ability-icon"><path clip-rule="evenodd" d="m6.41421 3c-.26521 0-.51957.10536-.7071.29289l-2.41422 2.41422c-.18753.18753-.29289.44189-.29289.7071v11.17159c0 .2652.10536.5196.29289.7071l2.41422 2.4142c.18753.1875.44189.2929.7071.2929h11.17159c.2652 0 .5196-.1054.7071-.2929l2.4142-2.4142c.1875-.1875.2929-.4419.2929-.7071v-11.17159c0-.26521-.1054-.51957-.2929-.7071l-2.4142-2.41422c-.1875-.18753-.4419-.29289-.7071-.29289zm5.58579 10.5c.8284 0 1.5-.6716 1.5-1.5s-.6716-1.5-1.5-1.5-1.5.6716-1.5 1.5.6716 1.5 1.5 1.5z" fill="#ab6e57" fill-rule="evenodd"></path><path d="m10 9c0-1.10457.8954-2 2-2h4c1.1046 0 2 .89543 2 2v1c0 1.1046-.8954 2-2 2h-1c0-1.6569-1.3431-3-3-3-.7684 0-1.4692.28885-2 .76389z" fill="#c2866f"></path><path d="m17.7071 7.94975-.6568-.65686c-.1876-.18753-.4419-.29289-.7072-.29289h-8.68625c-.26521 0-.51957.10536-.7071.29289l-.65686.65686c-.18753.18753-.29289.44189-.29289.7071v-1c0-.26521.10536-.51957.29289-.7071l.65686-.65686c.18753-.18753.44189-.29289.7071-.29289h8.68625c.2653 0 .5196.10536.7072.29289l.6568.65686c.1875.18753.2929.44189.2929.7071v1c0-.26521-.1054-.51957-.2929-.7071z" fill="#9f6854"></path><path d="m14.9585 12.5c-.238 1.4189-1.472 2.5-2.9585 2.5s-2.72048-1.0811-2.95852-2.5c-.02728.1626-.04148.3296-.04148.5 0 1.6569 1.3431 3 3 3s3-1.3431 3-3c0-.1704-.0142-.3374-.0415-.5z" fill="#9f6854"></path><g fill="#c2866f"><path clip-rule="evenodd" d="m15 12c0 1.6569-1.3431 3-3 3s-3-1.3431-3-3 1.3431-3 3-3 3 1.3431 3 3zm-3 1.5c.8284 0 1.5-.6716 1.5-1.5s-.6716-1.5-1.5-1.5-1.5.6716-1.5 1.5.6716 1.5 1.5 1.5z" fill-rule="evenodd"></path><circle cx="12" cy="12" fill-opacity=".5" r="1.5"></circle><path clip-rule="evenodd" d="m6.29289 6.94975c-.18753.18753-.29289.44189-.29289.7071v8.68625c0 .2653.10536.5196.29289.7072l.65686.6568c.18753.1875.44189.2929.7071.2929h8.68625c.2653 0 .5196-.1054.7072-.2929l.6568-.6568c.1875-.1876.2929-.4419.2929-.7072v-8.68625c0-.26521-.1054-.51957-.2929-.7071l-.6568-.65686c-.1876-.18753-.4419-.29289-.7072-.29289h-8.68625c-.26521 0-.51957.10536-.7071.29289zm.12132-3.94975c-.26521 0-.51957.10536-.7071.29289l-2.41422 2.41422c-.18753.18753-.29289.44189-.29289.7071v11.17159c0 .2652.10536.5196.29289.7071l2.41422 2.4142c.18753.1875.44189.2929.7071.2929h11.17159c.2652 0 .5196-.1054.7071-.2929l2.4142-2.4142c.1875-.1875.2929-.4419.2929-.7071v-11.17159c0-.26521-.1054-.51957-.2929-.7071l-2.4142-2.41422c-.1875-.18753-.4419-.29289-.7071-.29289z" fill-rule="evenodd"></path></g><path clip-rule="evenodd" d="m10.125 4.5c0-.48325.3918-.875.875-.875h6.0858c.4973 0 .9742.19754 1.3258.54917l1.4142 1.41422c.3517.35163.5492.82854.5492 1.32582v3.58579c0 .4832-.3918.875-.875.875s-.875-.3918-.875-.875v-3.58579c0-.03315-.0132-.06494-.0366-.08838l-1.4142-1.41422c-.0235-.02344-.0553-.03661-.0884-.03661h-6.0858c-.4832 0-.875-.39175-.875-.875z" fill="#e6a58c" fill-rule="evenodd"></path><circle cx="8.375" cy="4.47501" fill="#e5a48c" r=".875"></circle></svg></span>`;
				const partyCurrency = window.PARTY_INVENTORY_DATA?.currency ? window.PARTY_INVENTORY_DATA.currency : { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };
				const currencyString = `Party Currency: ${partyCurrency.pp != 0 ? `${partyCurrency.pp}${ppSVG} ` : ''}${partyCurrency.gp != 0 ? `${partyCurrency.gp}${gpSVG} ` : ''}${partyCurrency.ep != 0 ? `${partyCurrency.ep}${epSVG} ` : ''}${partyCurrency.sp != 0 ? `${partyCurrency.sp}${spSVG} ` : ''}${partyCurrency.cp != 0 ? `${partyCurrency.cp}${cpSVG} ` : ''}`;
				if($('.party-currency').length) {
					$('.party-currency').remove();
				}
				const currencyHeader = $(`<div class='party-currency' style="margin-bottom: 10px; font-weight: bold;">${currencyString}</div>`);
				partyLootTable.before(currencyHeader);
			}
		}
	}
	edit_note(id, statBlock = false){
		$(`div.note[data-id='${id}']`)?.dialog("close");
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
			width: 900,
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
				$("#resizeDragMon, .note:has(iframe) form .mce-container-body, #sheet").append($('<div class="iframeResizeCover"></div>'));
			},
			stop: function () {
				$('.iframeResizeCover').remove();			
			}
		});
		$("[role='dialog']").resizable({
			start: function () {
				$("#resizeDragMon, .note:has(iframe) form .mce-container-body, #sheet").append($('<div class="iframeResizeCover"></div>'));
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
				let parser = new DOMParser()
				let html = parser.parseFromString(editor.getContent(), 'text/html');
				const body = $(html).find('body')// we do this to get rid of style tags used in templates that aren't needed to be stored - it was causing notes to be too large from message size limits
				const avttImages = body.find('img[data-src*="above-bucket-not-a-url"]');
				avttImages.attr('src', '');
				avttImages.attr('href', '');
				self.notes[id].text = body.html(); 
		    	self.notes[id].plain = editor.getContent({ format: 'text' });
		    	self.notes[id].statBlock = statBlock;
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
				 background: var(--background-color, #f5f5f5);
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
				 background: var(--background-color, #f5f5f5);
				 font-weight: bold;
				 font-size:10px;
				 padding:0px 4px;
			}
			.Basic-Text-Frame {
				 clear: both;
				 border: 1px solid #d4d0ce;
				 background: var(--background-color, white);
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
				 background: var(--background-color, white);
				 padding: 15px 
			}
			.ignore-abovevtt-formating{
				 border: 2px dotted #b100ff;
			}
			.ignore-abovevtt-formating.no-border{
				border: none;
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
				 background: var(--background-color, white);
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
				 background-color: var(--background-color, var(--compendium-rules-sidebar-color, #DAE4C1)) !important;
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
				 background-image: var(--background-color, url(https://media.dndbeyond.com/encounter-builder/static/media/stat-block-top-texture.70eb7c244ee206f35cc0.png),url(https://media.dndbeyond.com/encounter-builder/static/media/paper-texture.88243187e307464c5837.png)) !important;
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
				 background: var(--background-color, var(--theme-quote-bg-color,#fff));
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
			.custom-challenge-rating.custom-stat{
				 color: #007979;
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
				 background-color: var(--background-color, #fefcef);
				 padding: 10px;
				 position: relative;
				 background-repeat: no-repeat;
				 box-shadow: 0 5px 8px 0 var(--stat-block-shadow,#aaa);
				 background-position: top;
				 background: var(--background-color, var(--stat-block-bg-override,#f6f3ee));
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
				--image-background: url(https://www.dndbeyond.com/Content/Skins/Waterdeep/images/mon-summary/stat-block-top-texture.png),url(https://www.dndbeyond.com/Content/Skins/Waterdeep/images/mon-summary/paper-texture.png);
				background: var(--background-color, var(--image-background));
			   	background-size: 100% auto;
			    background-position: top;
			    background-repeat: no-repeat,repeat;
			    position: relative;
			    box-shadow: 0 0 5px #979aa4;
			    border: 1px solid #d4d0ce;
			    padding: 15px 10px;
			    font-family: Scala Sans Offc,Roboto,Helvetica,sans-serif;
			    font-size: 15px;

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
			end_container_on_empty_block: true,
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
			      { title: 'CR', inline: 'b', classes: 'custom-challenge-rating custom-stat' },
			      { title: 'Custom PC Sheet Link', inline: 'b', classes: 'custom-pc-sheet custom-stat' },
			      { title: 'AboveVTT Slash Command Roll Button', inline: 'span', classes: 'abovevtt-slash-command-journal custom-stat' }
			   	]}
			],
			plugins: 'save,hr,image,link,lists,media,paste,tabfocus,textcolor,colorpicker,autoresize, code, table, template',
			table_cell_advtab: true,
			add_toolbar: "template",
			templates: [
			    {
			      "title": "2014 Monster Sheet",
			      "description": "Add a monster sheet template",
			      "content": `<style id='contentStyles'>${contentStyles}</style><div class="Basic-Text-Frame stat-block-background one-column-stat" style="font-family: 'Scala Sans Offc', Roboto, Helvetica, sans-serif;">
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
			    	"content": `<style id='contentStyles'>${contentStyles}</style><div class="stat-block">
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
			    	"content": `<style id='contentStyles'>${contentStyles}</style><p>Spellcasting. The mage is a 9th-level spellcaster. Its spellcasting ability is Intelligence (spell save DC 14, +6 to hit with spell attacks). The mage has the following wizard spells prepared:</p>
<p>Cantrips (at will): fire bolt, light, mage hand, prestidigitation</p>
<p>1st level (4 slots): detect magic, mage armor, magic missile, shield</p>
<p>2nd level (3 slots): misty step, suggestion</p>
<p>3rd level (3 slots): counterspell, fireball, fly</p>
<p>4th level (3 slots): greater invisibility, ice storm</p>
<p>5th level (1 slot): cone of cold</p>`
			    },
				{
					"title": "Treasure / Loot Table",
					"description": "Add a treasure table with buttons to add to party inventory.",
					"content": `<style id='contentStyles'>${contentStyles}</style>
						<table class="party-item-table" style="width: 100%; border-collapse: collapse;" border="1">
							<thead>
								<tr>
									<th style="padding: 8px; text-align: left;">Quantity</th>
									<th style="padding: 8px; text-align: left;">Item</th>
									<th style="padding: 8px; text-align: left;">Description</th>
									<th style="padding: 8px; text-align: left;">Add to Party Inventory</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td class="item-quantity-cell" style="padding: 8px; text-align: left;">2</td>
									<td class="item-link-cell" style="padding: 8px; text-align: left;"><a class="tooltip-hover no-border ignore-abovevtt-formating" href="https://www.dndbeyond.com/magic-items/8960641-potion-of-healing">Potion of Healing</a></td>
									<td class="item-description-cell" style="padding: 8px; text-align: left;">Auto Fills</td>
									<td class="item-add-cell" style="padding: 8px; text-align: left;">Auto Fills</td>
								</tr>
								<tr>
									<td class="item-quantity-cell" style="padding: 8px; text-align: left;">1</td>
									<td class="item-link-cell" style="padding: 8px; text-align: left;">https://www.dndbeyond.com/magic-items/9228343-alchemy-jug</td>
									<td class="item-description-cell" style="padding: 8px; text-align: left;">Auto Fills</td>
									<td class="item-add-cell" style="padding: 8px; text-align: left;">Auto Fills</td>
								</tr>
								<tr>
									<td class="item-quantity-cell" style="padding: 8px; text-align: left;">1</td>
									<td class="item-link-cell" style="padding: 8px; text-align: left;">250gp, 1000sp, 3000cp</td>
									<td class="item-description-cell" style="padding: 8px; text-align: left;"><strong>&nbsp;Ignored/Emptied for coins</strong></td>
									<td class="item-add-cell" style="padding: 8px; text-align: left;">Auto Fills</td>
								</tr>
								<tr>
									<td class="item-quantity-cell" style="padding: 8px; text-align: left;">1</td>
									<td class="item-link-cell" style="padding: 8px; text-align: left;">Fireball Spell Scroll (4th Level)</td>
									<td class="item-description-cell" style="padding: 8px; text-align: left;">Fireball at 4th level.&nbsp; Cost: 250 Weight: 0.1 Notes: Dex Save DC 15 <span class="ignore-abovevtt-formating">/r 9d6 Fireball:Fire Damage</span></td>
									<td class="item-add-cell" style="padding: 8px; text-align: left;">Auto Fills</td>
								</tr>
								<tr>
									<td class="item-quantity-cell" style="padding: 8px; text-align: left;">&nbsp;</td>
									<td class="item-link-cell" style="padding: 8px; text-align: left;">&nbsp;</td>
									<td class="item-description-cell" style="padding: 8px; text-align: left;">&nbsp;</td>
									<td class="item-add-cell" style="padding: 8px; text-align: left;">&nbsp;</td>
								</tr>
							</tbody>
						</table>		
					`
				},
				{
					"title": "Item Shop Table",
					"description": "Add a treasure table with buttons to add to party inventory.",
					"content": `<style id='contentStyles'>${contentStyles}</style>
						<table class="party-item-table shop" style="width: 100%; border-collapse: collapse;" border="1">
							<thead>
								<tr>
									<th style="padding: 8px; text-align: left;">Quantity</th>
									<th style="padding: 8px; text-align: left;">Item</th>
									<th style="padding: 8px; text-align: left;">Description</th>
									<th style="padding: 8px; text-align: left;">Cost</th>
									<th style="padding: 8px; text-align: left;">Add to Party Inventory</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td class="item-quantity-cell" style="padding: 8px; text-align: left;">2</td>
									<td class="item-link-cell" style="padding: 8px; text-align: left;"><a class="tooltip-hover no-border ignore-abovevtt-formating" href="https://www.dndbeyond.com/magic-items/8960641-potion-of-healing">Potion of Healing</a></td>
									<td class="item-description-cell" style="padding: 8px; text-align: left;">Auto Fills</td>
									<td class="item-cost-cell" style="padding: 8px; text-align: left;">50gp</td>
									<td class="item-add-cell" style="padding: 8px; text-align: left;">Auto Fills</td>
								</tr>
								<tr>
									<td class="item-quantity-cell" style="padding: 8px; text-align: left;">&nbsp;</td>
									<td class="item-link-cell" style="padding: 8px; text-align: left;">&nbsp;</td>
									<td class="item-description-cell" style="padding: 8px; text-align: left;">&nbsp;</td>
									<td class="item-cost-cell" style="padding: 8px; text-align: left;"></td>
									<td class="item-add-cell" style="padding: 8px; text-align: left;">&nbsp;</td>
								</tr>
								<tr>
									<td class="item-quantity-cell" style="padding: 8px; text-align: left;">&nbsp;</td>
									<td class="item-link-cell" style="padding: 8px; text-align: left;">&nbsp;</td>
									<td class="item-description-cell" style="padding: 8px; text-align: left;">&nbsp;</td>
									<td class="item-cost-cell" style="padding: 8px; text-align: left;"></td>
									<td class="item-add-cell" style="padding: 8px; text-align: left;">&nbsp;</td>
								</tr>
								<tr>
									<td class="item-quantity-cell" style="padding: 8px; text-align: left;">&nbsp;</td>
									<td class="item-link-cell" style="padding: 8px; text-align: left;">&nbsp;</td>
									<td class="item-description-cell" style="padding: 8px; text-align: left;">&nbsp;</td>
									<td class="item-cost-cell" style="padding: 8px; text-align: left;"></td>
									<td class="item-add-cell" style="padding: 8px; text-align: left;">&nbsp;</td>
								</tr>
								<tr>
									<td class="item-quantity-cell" style="padding: 8px; text-align: left;">&nbsp;</td>
									<td class="item-link-cell" style="padding: 8px; text-align: left;">&nbsp;</td>
									<td class="item-description-cell" style="padding: 8px; text-align: left;">&nbsp;</td>
									<td class="item-cost-cell" style="padding: 8px; text-align: left;"></td>
									<td class="item-add-cell" style="padding: 8px; text-align: left;">&nbsp;</td>
								</tr>
							</tbody>
						</table>		
					`
				},
			],
		  	table_grid: false,
			toolbar: 'undo styleselect template | horizontalrules | bold italic underline strikethrough | alignleft aligncenter alignright justify| outdent indent | bullist numlist | forecolor backcolor | fontsizeselect | link unlink | image media filePickers table tableCustom | code',
			image_class_list: [
				{title: 'Magnify', value: 'magnify'},
			],
			external_plugins: {
				'image': "/content/1-0-1688-0/js/tinymce/tiny_mce/plugins/image/plugin.min.js",
			},
			link_class_list: [
			   {title: 'External Link', value: 'ext_link no-border ignore-abovevtt-formating'},
			   {title: 'DDB Tooltip Link (Spells, Monsters, Magic Items, Source)', value: 'tooltip-hover no-border ignore-abovevtt-formating'}
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

				editor.addButton('filePickers', {
					type: 'splitbutton',
					text: '',
					icon: 'upload',
					tooltip: 'Upload/Select File From File Picker',
					menu: [
						{
							text: "Azmoria's AboveVTT File Picker",
							onclick: (e) => { 
								e.preventDefault();
								e.stopPropagation(); 
								launchFilePicker(async function (files) {
									try {
										for (let i = 0; i < files.length; i++) {
											const fileType = files[i].type;
											const link = files[i].link;

											if (fileType === avttFilePickerTypes.IMAGE) {
												tinymce.activeEditor.insertContent(`<img class="magnify" alt="" data-src="${link}" />`);
											} else if (fileType === avttFilePickerTypes.VIDEO) {
												tinymce.activeEditor.insertContent(`<video controls="controls" width="100%" height="auto"><source src="${link}" /></video>`);
											} else if (fileType === avttFilePickerTypes.AUDIO) {
												tinymce.activeEditor.insertContent(`<audio controls src="${link}"></audio>`);
											} else {
												tinymce.activeEditor.insertContent(`<iframe width='100%' height='400' src='${window.EXTENSION_PATH}iframe.html?src=${link}'
												allowfullscreen
												webkitallowfullscreen
												mozallowfullscreen></iframe>`);
											}
										}
									} catch (error) {
										console.error("Failed to import from AVTT File Picker selection", error);
										alert(error?.message || "Failed to import selection from AVTT. See console for details.");
									}
								}, undefined,
								async function (files) {
									try {
										for (let i = 0; i < files.length; i++) {
											const link = files[i].link;
											tinymce.activeEditor.insertContent(`<span class="journal-site-embed">${link}</span>`);
										}
									}
									catch (error) {
										console.error("Failed to import from AVTT File Picker selection", error);
										alert(error?.message || "Failed to import selection from AVTT. See console for details.");
									}
								});
							},
						},
						{
							text: "Dropbox - Insert Image/Video/Audio",
							onclick: (e) => {
								e.preventDefault();
								e.stopPropagation();
								const dropboxOptions = dropBoxOptions(function (links) {
									for (let i = 0; i < links.length; i++) {
										const link = parse_img(links[i].link);
										const extension = links[i].link.split('?')[0].match(/.*\.(.*)?$/i)?.[1];
										if (allowedImageTypes.includes(extension)) {
											tinymce.activeEditor.insertContent(`<img class="magnify" alt="" src='${link}' />`);
										} else if (allowedVideoTypes.includes(extension)) {
											tinymce.activeEditor.insertContent(`<video controls="controls" width="100%" height="auto"><source src="${link}"/></video>`);
										} else if (allowedAudioTypes.includes(extension)) {
											tinymce.activeEditor.insertContent(`<audio controls src="${link}"></audio>`);
										}
									}
								}, true, ['images','video','audio'], false);
								Dropbox.choose(dropboxOptions)
							},
						},
						{
							text: "Dropbox - Site Embed",
							onclick: (e) => {
								e.preventDefault();
								e.stopPropagation();
								const dropboxOptions = dropBoxOptions(function (links) {
									for (let i = 0; i < links.length; i++) {
										const link = links[i].link;
										tinymce.activeEditor.insertContent(`<span class="journal-site-embed">${link}</span>`);
									}
								}, false, ['images', 'video', 'audio', 'document', 'text'], false);
								Dropbox.choose(dropboxOptions)
							},
						},
						{
							text: "OneDrive - Insert Image",
							onclick: (e) => {
								e.preventDefault();
								e.stopPropagation();
								launchPicker(e, function (links) {
									for (let i = 0; i < links.length; i++) {
										const link = parse_img(links[i].link);
										tinymce.activeEditor.insertContent(`<img class="magnify" alt="" src='${link}' />`);
									}
								}, 'multiple', ['photo', '.webp']);
							},
						},
						{
							text: "OneDrive - Site Embed",
							onclick: (e) => {
								e.preventDefault();
								e.stopPropagation();
								launchPicker(e, function (links) {
									for (let i = 0; i < links.length; i++) {
										const link = links[i].link;
										tinymce.activeEditor.insertContent(`<span class="journal-site-embed">${link}</span>`);
									}
								}, 'single', ['files']);
							},
						}
					],
					onclick: (e) => { 
						e.preventDefault();
						e.stopPropagation();
						launchFilePicker(async function (files) {
							try {
								for (let i = 0; i < files.length; i++) {
									const fileType = files[i].type;
									const link = files[i].link;

									if (fileType === avttFilePickerTypes.IMAGE) {
										tinymce.activeEditor.insertContent(`<img class="magnify" alt="" data-src="${link}" />`);
									} else if (fileType === avttFilePickerTypes.VIDEO) {
										tinymce.activeEditor.insertContent(`<video controls="controls" width="100%" height="auto"><source src="${link}" /></video>`);
									} else if (fileType === avttFilePickerTypes.AUDIO) {
										tinymce.activeEditor.insertContent(`<audio controls src="${link}"></audio>`);
									} else {
										tinymce.activeEditor.insertContent(`<iframe width='100%' height='400' src='${window.EXTENSION_PATH}iframe.html?src=${link}'
												allowfullscreen
												webkitallowfullscreen
												mozallowfullscreen></iframe>`);
									}
								}
							} catch (error) {
								console.error("Failed to import from AVTT File Picker selection", error);
								alert(error?.message || "Failed to import selection from AVTT. See console for details.");
							}
						}, undefined,
							async function (files) {
								try {
									for (let i = 0; i < files.length; i++) {
										const link = files[i].link;
										tinymce.activeEditor.insertContent(`<span class="journal-site-embed">${link}</span>`);
									}
								}
								catch (error) {
									console.error("Failed to import from AVTT File Picker selection", error);
									alert(error?.message || "Failed to import selection from AVTT. See console for details.");
								}
							});
						},
				});
				editor.addCommand('setAvttImageSrc', function (e) {
					const body = e.target.contentDocument?.body != undefined ? $(e.target.contentDocument.body) : $(e.target);
					const avttImages = body.find('img[data-src*="above-bucket-not-a-url"]:not([src^="above-bucket-not-a-url"])');
					avttImages.each(async (index, image) => {
						const src = await getAvttStorageUrl(image.getAttribute('data-src'), true);
						image.src = src;
					})
					const avttImages2 = body.find('img[src^="above-bucket-not-a-url"]');
					avttImages2.each(async (index, image) => {
						const origSrc = image.getAttribute('src');
						const src = await getAvttStorageUrl(origSrc, true);
						image.setAttribute('data-src', origSrc)
						image.src = src;
					})

					if (editor.isDirty()) {
						debounceNoteSave(e, editor);
					}
				});
				editor.on('init', function (e) {
					const body = $(e.target.contentDocument.body);
					const backgroundColor = $(':root').css('--background-color'); // support azmoria's dark mode without requiring inverse filters
					const fontColor = $(':root').css('--font-color');
					if(backgroundColor && fontColor){
						body.css({
							background: backgroundColor,
							color: fontColor,
							'--font-color': fontColor,
							'--background-color': backgroundColor
						});
					}

					editor.execCommand('setAvttImageSrc', e);
				});

				editor.on('NodeChange', async function (e) {
					// When an image is inserted into the editor
				    if (e.element.tagName === "IMG") { 
				    	let url = e.element.getAttribute('src');
				    	if (url.startsWith("https://drive.google.com") && url.indexOf("uc?id=") < 0) {
		                    const parsed = 'https://drive.google.com/uc?id=' + url.split('/')[5];
		                    url = parsed;
		                }
		                else if(url.includes('dropbox.com')){       
		                    const splitUrl = url.split('dropbox.com');
		                    const parsed = `https://dl.dropboxusercontent.com${splitUrl[splitUrl.length-1]}`
		                    url = parsed;
		                }
						else if (url.includes('above-bucket-not-a-url')) {
							const splitUrl = url.match(/above-bucket-not-a-url.*$/gi)?.[0];
							e.element.setAttribute("data-src", splitUrl);
							url = await getAvttStorageUrl(splitUrl, true);	
						}
				        e.element.setAttribute("src", await getGoogleDriveAPILink(url));
				        return; 
				    }
				    return;
				});
				editor.on('change keyup', async function(e){
					editor.execCommand('setAvttImageSrc', e);
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
				let parser = new DOMParser();
				let html = parser.parseFromString(tinymce.activeEditor.getContent(), 'text/html');
				const body = $(html).find('body')// we do this to get rid of style tags used in templates that aren't needed to be stored - it was causing notes to be too large from message size limits
				const avttImages = body.find('img[data-src*="above-bucket-not-a-url"]');
				avttImages.attr('src', '');
				avttImages.attr('href', '');
				self.notes[note_id].text = body.html(); 
				self.notes[note_id].plain = tinymce.activeEditor.getContent({ format: 'text' });
				self.notes[note_id].statBlock = statBlock;
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
		note.parent().css('height', '600px');		
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
	url = url.replace('https://dndbeyond', 'https://www.dndbeyond');
	const sourceChapter = url.startsWith('https://www.dndbeyond.com/sources/') || url.startsWith('/sources/');
	const compendiumChapter = url.startsWith('https://www.dndbeyond.com/compendium/') || url.startsWith('/compendium/');
	const attachmentChapter = url.startsWith('https://www.dndbeyond.com/attachments/') || url.startsWith('/attachments/');
	const rulesChapter = url.startsWith('https://www.dndbeyond.com/magic-items') || url.startsWith('https://www.dndbeyond.com/feats') || url.startsWith('https://www.dndbeyond.com/spells')
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
	frame_z_index_when_click(container);
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
			background: var(--theme-page-bg-color,#f9f9f9) !important;
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
