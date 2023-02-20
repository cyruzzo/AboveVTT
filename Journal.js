

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
		
		let btn_add_chapter=$("<button id='btn_add_chapter'>Add Chapter</button>");
		
		btn_add_chapter.click(
			function(){
				let t=prompt("Insert the Chapter Name");
				self.chapters.push({
					title:t,
					notes: [],
				});
				self.build_journal();
				self.persist();
				window.MB.sendMessage('custom/myVTT/JournalChapters',{
				chapters: self.chapters
				});
			}
		);
		
		if(window.DM)
			journalPanel.body.append(btn_add_chapter);
		
		for(let i=0; i<self.chapters.length;i++){
			console.log('xxx');
			let c=$("<div class='journal-chapter'></div>")
			let t=$("<div class='journal-chapter-title'/>");
			c.append(t);
			
			t.text(self.chapters[i].title);
			journalPanel.body.append(c);
			
			let del_chapter_btn=$("<button class='btn-del-chapter'><img height=10 src='"+window.EXTENSION_PATH+"assets/icons/delete.svg'></button>");
			
			del_chapter_btn.click(function(){
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

			if(window.DM)
				t.append(del_chapter_btn);
			



			for(let n=0; n<self.chapters[i].notes.length;n++){
				
				let note_id=self.chapters[i].notes[n];
				
				if(! (note_id in self.notes))
					continue;
					
				if( (! window.DM) && (! self.notes[note_id].player) )
					continue;
				
				let entry=$("<div class='journal-note-entry'></div>");
				let entry_title=$("<div class='journal-note-entry-title'></div>");
				let entry_buttons=$("<div class='journal-entry-buttons'/>")
				entry_title.text(self.notes[note_id].title);
				let display_btn=$("<button><img height=10 src='"+window.EXTENSION_PATH+"assets/icons/view.svg'></button>");
				display_btn.click(function(){
					self.display_note(note_id);
				});
				
				let edit_btn=$("<button><img height=10 src='"+window.EXTENSION_PATH+"assets/icons/edit.svg'></button>");
				edit_btn.click(function(){
					self.edit_note(note_id);
				});
				let note_index=n;
				let delete_btn=$("<button><img height=10 src='"+window.EXTENSION_PATH+"assets/icons/delete.svg'></button>");
				delete_btn.click(function(){
					console.log("deleting note_index"+note_index);
					self.chapters[i].notes.splice(note_index,1);
					delete self.notes[note_id];
					self.build_journal();
					self.persist();
					window.MB.sendMessage('custom/myVTT/JournalChapters', {
						chapters: self.chapters
					});
				});
				
				entry_buttons.append(display_btn);
				if(window.DM)
					entry_buttons.append(edit_btn);
				if(window.DM)
					entry_buttons.append(delete_btn);
				entry.append(entry_title);
				entry.append(entry_buttons);
				
				
				c.append(entry);
			}

			// 

			let add_note_btn=$("<button class='journal-add-note'><img height=10 src='"+window.EXTENSION_PATH+"assets/conditons/note.svg'></button>");

			add_note_btn.click(function(){
				let new_noteid=uuid();
				let note_title=prompt("Insert the note title");
				self.notes[new_noteid]={
					text: "",
					plain: "",
					title: note_title,
					player: false,
				};
				
				self.chapters[i].notes.push(new_noteid);
				window.MB.sendMessage('custom/myVTT/JournalChapters',{
					chapters: self.chapters
				});
				self.edit_note(new_noteid);
				self.persist();
				self.build_journal();
			});

			if(window.DM){
				let entry=$("<div class='journal-note-entry'></div>");
				entry.append(add_note_btn);
				entry.append("<b>Add New Note</b>");
				c.append(entry);
			}

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
			      { title: 'Quote Box', block: 'blockquote', wrapper: true, classes: 'text--quote-box'},
			      { title: 'Rules Text', block: 'aside', wrapper: true, classes: 'rules-text' },
			      { title: 'Ripped Paper', block: 'aside', wrapper: true, classes: 'block-torn-paper' },
			      { title: 'Read Aloud Text', block: 'aside', wrapper: true, classes: 'read-aloud-text' },
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

		
				aside.rules-text a {
				    color: #129b54!important;
				    transition: .3s
				}

				aside.rules-text p:first-child {
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


				aside.block-torn-paper,aside.epigraph,aside.epigraph--with-author {
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

				aside.epigraph--with-author p:last-child {
				    font-style: italic;
				    text-align: right
				}

				aside.rules-text {
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

				aside.rules-text p:first-child {
				    text-transform: uppercase;
				    font-weight: 700
				}

				aside.read-aloud-text {
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

