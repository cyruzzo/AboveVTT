

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
		let note_text=$("<div/>");
		note_text.append(DOMPurify.sanitize(self.notes[id].text,{ADD_TAGS: ['img','div','p', 'b', 'button', 'span', 'style', 'path', 'svg','iframe','a','video','ul','ol','li'], ADD_ATTR: ['allowfullscreen', 'allow', 'scrolling','src','frameborder','width','height']}));
		note.append(note_text);
		note.find("a").attr("target","_blank");
		note.dialog({
			draggable: true,
			width: 800,
			height: 600,
			position: [200,100],
			close: function( event, ui ) {
				$(this).remove();
				}
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
			position: [200,100],
			close: function( event, ui ) {
				console.log(event);
				let taid=$(event.target).find("textarea").attr('id');
				tinyMCE.get(taid).execCommand('mceSave');
				$(this).remove();
			}
		});
		
		tinyMCE.init({
			selector: '#' + tmp,
			menu: {},
			plugins: 'save,hr,image,link,lists,media,paste,tabfocus,textcolor,videoembed',
			toolbar: 'undo,|,paste,|,bold,|,italic,|,underline,|,strikethrough,|,blockquote,|,code,|,formatselect,|,alignleft,|,aligncenter,|,alignright,|,fontselect,|,fontsizeselect,|,forecolor,|,bullist,|,numlist,|,hr,|,removeformat,|,outdent,|,indent,|,spoiler,|,link,|,unlink,|,image,|,videoembed,|,|,codeBlock,|,dieroller',
			image_class_list: [
				{title: 'None', value: ''},
				{title: 'Magnify', value: 'magnify'},
			],
			external_plugins: {
				'image': "/content/1-0-1688-0/js/tinymce/tiny_mce/plugins/image/plugin.min.js",
				'videoembed': "/content/1-0-1688-0/js/tinymce/custom_plugins/videoembed/plugin.js",
			},
			relative_urls : false,
			remove_script_host : false,
			convert_urls : true,
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

