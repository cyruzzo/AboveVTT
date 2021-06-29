class ScenesHandler { // ONLY THE DM USES THIS OBJECT

	reload(callback = null) {
		this.switch_scene(this.current_scene_id, null);
	}

	switch_scene(sceneid, callback = null) {
		this.current_scene_id = sceneid;
		var self = this;
		var scene = this.scenes[sceneid];
		this.scene = scene;
		window.CURRENT_SCENE_DATA = scene;

		$(".VTTToken").each(function() {
			$("#aura_" + $(this).attr("data-id").replaceAll("/", "")).remove();
		});
		$(".VTTToken").remove();

		for (var i in window.TOKEN_OBJECTS) {
			delete window.TOKEN_OBJECTS[i];
		}



		if (scene.grid_subdivided == "1")
			scene.grid = "1";


		if (!scene.hpps) { // THIS IS OLD DATA FROM < 0.0.20!!! WE NEED TO COMPLETE WHAT IS MISSING and TRY TO FIX IT :()
			console.log("converting pre 0.0.20 scene.... Good lock to you, oh brave adventurer")
			scene.hpps = Math.round((6000.0 / scene.scale));
			scene.vpps = scene.hpps;
			scene.offsetx = 0;
			scene.offsety = 0;
			scene.grid = 0;
			scene.snap = 0;
			scene.fpsq = 5;

			for (var id in scene.tokens) { // RESCALE ALL THE TOKENS
				var tok_options = scene.tokens[id];
				tok_options.size = (tok_options.size / 60) * scene.hpps;
				tok_options.top = Math.round(parseInt(tok_options.top) / (scene.scale / 100.0)) + "px";
				tok_options.left = Math.round(parseInt(tok_options.left) / (scene.scale / 100.0)) + "px";
			}

			// RESCALE THE REVEALS
			for (var i = 0; i < scene.reveals.length; i++) {
				scene.reveals[i][0] = Math.round((scene.reveals[i][0] / 60.0) * scene.hpps);
				scene.reveals[i][1] = Math.round((scene.reveals[i][1] / 60.0) * scene.hpps);
				scene.reveals[i][2] = Math.round((scene.reveals[i][2] / 60.0) * scene.hpps);
				scene.reveals[i][3] = Math.round((scene.reveals[i][3] / 60.0) * scene.hpps);
			}


		}

		scene.vpps = parseFloat(scene.vpps);
		scene.hpps = parseFloat(scene.hpps);
		scene.offsetx = parseFloat(scene.offsetx);
		scene.offsety = parseFloat(scene.offsety);

		// CALCOLI DI SCALA non dovrebbero servire piu''
		scene['scale'] = (60.0 / parseInt(scene['hpps'])) * 100; // for backward compatibility, this will be horizonat scale
		scene['scaleX'] = (60.0 / parseInt(scene['hpps'])); // for backward compatibility, this will be horizonat scale
		scene['scaleY'] = (60.0 / parseInt(scene['vpps'])); // for backward compatibility, this will be horizonat sca

		// SET AND RESCALE



		// YOUTUBE TEST HACK!
		/*$("#scene_map").attr('id','tobedeleted');
		//var newimage=$('<iframe style="position:absolute,top:0,left:0,z-index:10" id="scene_map" width="1920" height="1080" src="https://www.youtube.com/embed/ny_XrjC3F9Q?controls=0&autoplay=1&loop=1&playlist=ny_XrjC3F9Q" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>');
		var newimage=$('<div style="position:absolute,top:0,left:0,z-index:10" id="scene_map" />');
		$("#tobedeleted").replaceWith(
				newimage
			);
			
		 var player = new YT.Player('scene_map', {
		  height: '1080',
		  width: '1920',
		  videoId: 'ny_XrjC3F9Q',
		  playerVars: { 'autoplay': 1, 'controls': 0 },
		  events: {
			'onStateChange': function(event){if(event.data==0)player.playVideo();}
		  }
		});*/

		// END


		/*if(scene.width && scene.width!="0"){
				$("#scene_map").width(scene.width);
				$("#scene_map").height(scene.height);
			}
			else{
				scene.width="0";
				scene.height="0";
				scene.upscaled="0";
				
				this.persist();	
			}*/

		$("#tokens").show();
		$("#grid_overlay").show();


		if (self.scene.fog_of_war == 1) {
			window.FOG_OF_WAR = true;
			//$("#fog_overlay").show();
			window.REVEALED = [].concat(self.scene.reveals);
		}
		else {
			window.FOG_OF_WAR = false;
			window.REVEALED = [];
			//$("#fog_overlay").hide();
		}

		if (typeof self.scene.drawings !== 'undefined') {
			window.DRAWINGS = self.scene.drawings;
		}
		else {
			window.DRAWINGS = [];
		}

		var map_url = "";
		if ((scene.dm_map != "") && (scene.dm_map_usable == "1") && (window.DM)) {
			map_url = scene.dm_map;
		}
		else {
			map_url = scene.player_map;
		}



		load_scenemap(map_url, null, null, function() {
			var owidth = $("#scene_map").width();
			var oheight = $("#scene_map").height();

			if (scene.scale_factor) {
				$("#scene_map").width(owidth * scene.scale_factor);
				$("#scene_map").height(oheight * scene.scale_factor);
			}

			$("#scene_map").off("load");
			reset_canvas();
			redraw_canvas();
			redraw_drawings();
			window.ZOOM = (60.0 / window.CURRENT_SCENE_DATA.hpps);
			$("#VTT").css("transform", "scale(" + window.ZOOM + ")");

			window.scrollTo(200, 200);

			$("#VTTWRAPPER").width($("#scene_map").width() * window.ZOOM + 400);
			$("#VTTWRAPPER").height($("#scene_map").height() * window.ZOOM + 400);
			$("#black_layer").width($("#scene_map").width() * window.ZOOM + 400);
			$("#black_layer").height($("#scene_map").height() * window.ZOOM + 400)

			for (const property in scene.tokens) {
				console.log("Carico TOKEN " + $(scene.tokens[property]));
				self.create_update_token(scene.tokens[property]);
			}

			self.sync();
			if (callback != null)
				callback();
		});




		this.persist();



	}

	sync() {
		console.log('inviooooooooooooooooooooooooooooooooooooooooooo');

		$("#scene_map").width();

		var data = {};

		data.grid = window.CURRENT_SCENE_DATA.grid;
		data.snap = window.CURRENT_SCENE_DATA.snap;
		data.grid = window.CURRENT_SCENE_DATA.grid;
		//data.scale=window.CURRENT_SCENE_DATA.scaleX;
		data.hpps = window.CURRENT_SCENE_DATA.hpps;
		data.vpps = window.CURRENT_SCENE_DATA.vpps;
		data.fpsq = window.CURRENT_SCENE_DATA.fpsq;
		data.grid_subdivded = window.CURRENT_SCENE_DATA.grid_subdivided;
		data.offsetx = window.CURRENT_SCENE_DATA.offsetx;
		data.offsety = window.CURRENT_SCENE_DATA.offsety;

		data.map = this.scene.player_map;
		data.width = $("#scene_map").width();
		data.height = $("#scene_map").height();
		data.tokens = [];
		data.fog_of_war = this.scene.fog_of_war;
		data.reveals = window.REVEALED;
		data.drawings = window.DRAWINGS;
		for (var id in window.TOKEN_OBJECTS) {
			data.tokens.push(window.TOKEN_OBJECTS[id].options);
		}

		window.MB.sendMessage('custom/myVTT/scene', data); // issue with message size ??
	}


	display_scene_properties(scene_id) {
		console.log('inizio....');
		var self = this;
		var scene = this.scenes[scene_id];
		var container = $("#scene_properties");
	}

	build_adventures(callback) {
		var self = this;
		if(Object.keys(self.sources).length!=0){
			setTimeout(callback,1000);
			return;
		}
		
		var f = $("<iframe src='/sources'></iframe");
		f.hide();
		$("#site").append(f);
		
		
		var scraped_sources={};

		f.on("load", function(event) {
			console.log('iframe pronto..');
			var iframe = $(event.target);
			iframe.contents().find(".sources-listing--item--title").each(function(idx) {
				var ddbtype=$(this).closest(".sources-listing").attr('id'); // get Sourcebooks of Adventures
				var title = $(this).html();
				var url = $(this).parent().attr("href");
				var keyword = url.replace('https://www.dndbeyond.com', '').replace('sources/', '');

				if (keyword in self.sources){ // OBJECT ALREADY EXISTS... evito di riscrivere per non perdere i dati
					scraped_sources[keyword]=self.sources.keyword;
					return;
				}
				scraped_sources[keyword] = {
					type: 'dnb',
					ddbtype:ddbtype,
					title: title,
					url: url,
					chapters: {},
				};
			});
			iframe.remove();
			//self.persist();
			
			// SORT
			self.sources = Object.keys(scraped_sources)
				.sort(
					function(a, b) {
						if (scraped_sources[a].ddbtype == scraped_sources[b].ddbtype) {
							return ((scraped_sources[a].title == scraped_sources[b].title) ? 0 : ((scraped_sources[a].title > scraped_sources[b].title) ? 1 : -1));
						}
						else {
							return (a.ddbtype == "Adventures") ? 1 : -1;
						}
					}
				)
				.reduce((acc, key) => ({
					...acc, [key]: scraped_sources[key]
				}), {})
			
			
			callback();
		});
	}


	build_chapters(keyword, callback) {
		var self = this;
		console.log('scansiono ' + keyword);
		//var target_list = $("#" + $(event.target).attr('data-target'));
		//var adventure_url = 'https://www.dndbeyond.com/sources/' + keyword;
		var adventure_url="https://www.dndbeyond.com/"+self.sources[keyword].url;

		if (self.sources[keyword].type != 'dnb') {
			callback();
			return;
		}

		// EVITO DI RISCANSIONARE UN OGGETTO CHE HO GIA'
		if (Object.keys(self.sources[keyword].chapters).length > 0) {
			console.log('no.... non scansiono')
			callback();
			return;
		}

		//if($(event.target).attr('data-status')==0){
		var f = $("<iframe name='scraper' src='" + adventure_url + "'></iframe>");
		f.hide();
		$("#site").append(f);
		f.on("load", function(event) {
			var iframe = $(event.target);
			console.log('caricato ' + window.frames['scraper'].location.href);

			if (window.frames['scraper'].location.href != adventure_url) {
				console.log('rilevato cambio url');
				var title = "Single Chapter";
				var url = window.frames['scraper'].location.href;
				var ch_keyword = url.replace('https://www.dndbeyond.com', '').replace('/sources/' + keyword + "/", '');
				self.sources[keyword].chapters[ch_keyword] = {
					type: 'dnb',
					title: title,
					url: url,
					scenes: [],
				}
			}
			else {
				iframe.contents().find(".adventure-chapter-header a,li >strong>a").each(function(idx) {
					var title = $(this).html();
					var url = $(this).attr('href');
					var ch_keyword = url.replace('https://www.dndbeyond.com', '').replace('/sources/' + keyword + "/", '');
					self.sources[keyword].chapters[ch_keyword] = {
						type: 'dnb',
						title: title,
						url: url,
						scenes: [],
					};
				});
			}
			iframe.remove();
			self.persist();
			callback();
		});
	}

	build_scenes(source_keyword, chapter_keyword, callback) {
		var self = this;
		console.log("cerco scene source: " + source_keyword + " | chapter: " + chapter_keyword);
		//var chapter_url='https://www.dndbeyond.com/sources/'+source_keyword+'/'+chapter_keyword;
		var chapter_url = self.sources[source_keyword].chapters[chapter_keyword].url;
		console.log("checking for scenes in " + chapter_url);

		if (self.sources[source_keyword].chapters[chapter_keyword].type != 'dnb') {
			callback();
			return;
		}

		if (Object.keys(self.sources[source_keyword].chapters[chapter_keyword].scenes).length > 0) { // EVITO DI SCANSIONARE DI NUOVO OGGETTI CHE HO GIA
			callback();
			return;
		}

		var f = $("<iframe src='" + chapter_url + "'></iframe>");

		f.hide();
		$("#site").append(f);


		f.on("load", function(event) {
			var iframe = $(event.target);
			iframe.contents().find("figure").each(function(idx) { // FIGURE + FIGCAPTION. 
				var id = $(this).attr('id');
				if (typeof id == typeof undefined)
					return;
				var img1 = $(this).find(".compendium-image-center").attr("href");
				var links = $(this).find("figcaption a");
				var player_map = '';
				var dm_map = '';
				var figure_caption = $(this).find('figcaption');
				var title = figure_caption.clone()    //clone the element
					.children() //select all the children
					.remove()   //remove all the children
					.end()  //again go back to selected element
					.text();

				var thumb = $(this).find("img").attr('src');


				if (links.length > 0) {
					player_map = links.attr('href');
					dm_map = img1;
				}
				else {
					player_map = img1;
				}
				self.sources[source_keyword].chapters[chapter_keyword].scenes.push({
					id: id,
					uuid: source_keyword + "/" + chapter_keyword + "/" + id,
					title: title,
					dm_map: dm_map,
					player_map: player_map,
					thumb: thumb,
					scale: "100",
					dm_map_usable: "0",
					fog_of_war: "0",
					tokens: {},
					reveals: [],
				});
			});
			// COMPENDIUM IMAGE WITH SUBTITLE
			iframe.contents().find(".compendium-image-with-subtitle-center,.compendium-image-with-subtitle-right,.compendium-image-with-subtitle-left").each(function(idx) {
				var id = $(this).attr('id');
				if (typeof id == typeof undefined) {
					id = $(this).attr('data-content-chunk-id');
				}
				var thumb = $(this).find("img").attr('src');
				var img1 = $(this).find(".compendium-image-center,.compendium-image-right,.compendium-image-left").attr("href");
				var title = $(this).find(".compendium-image-subtitle").text();
				var player_map;
				var dm_map;

				if ($(this).next().hasClass("compendium-image-view-player")) {
					dm_map = img1;
					player_map = $(this).next().find(".compendium-image-center").attr("href");
				}
				else {
					player_map = img1;
				}

				self.sources[source_keyword].chapters[chapter_keyword].scenes.push({
					id: id,
					uuid: source_keyword + "/" + chapter_keyword + "/" + id,
					title: title,
					dm_map: dm_map,
					player_map: player_map,
					scale: "100",
					dm_map_usable: "0",
					fog_of_war: "0",
					thumb: thumb,
					tokens: {},
					reveals: [],
				});
			});

			// AND HERE WE START TO HANDLE EXCEPTIONS.

			if (["gos", "wdh", "wdotmm", "llok"].includes(source_keyword)) {
				iframe.contents().find(".compendium-image-center").each(function(idx) {
					// import it only if there's a player version

					if (!$(this).parent().next().is(".compendium-image-view-player"))
						return;


					var dm_map = $(this).attr('href');
					var player_map = $(this).parent().next().find(".compendium-image-center").attr("href");
					var header = $(this).parent().prevAll("[id]:first");
					var thumb = $(this).find("img").attr('src');
					var id = header.attr("id");
					var title = header.text();

					self.sources[source_keyword].chapters[chapter_keyword].scenes.push({
						id: id,
						uuid: source_keyword + "/" + chapter_keyword + "/" + id,
						title: title,
						dm_map: dm_map,
						player_map: player_map,
						scale: "100",
						dm_map_usable: "0",
						fog_of_war: "0",
						thumb: thumb,
						tokens: {},
						reveals: [],
					});

				});
			}

			iframe.remove();
			self.persist();
			console.log('INVOKO CALLBACK');
			callback();
		});
	}


	create_update_token(options, save = true) {
		console.log("create_update_token");
		let self = this;
		let id = options.id;
		////this.scene.tokens[id]=options;

		if (!(id in window.TOKEN_OBJECTS)) {

			window.TOKEN_OBJECTS[id] = new Token(options);

			window.TOKEN_OBJECTS[id].persist = function() {
				self.persist();
			}

			window.TOKEN_OBJECTS[id].sync = function() {
				window.MB.sendMessage('custom/myVTT/token', window.TOKEN_OBJECTS[id].options);
			}
		}

		window.TOKEN_OBJECTS[id].place();
		this.scene.hasTokens = true;
		if (save)
			this.persist();
	}

	persist() {
		console.log("persisting");
		if (window.STARTING)
			return;

		for (var id in window.TOKEN_OBJECTS) {
			this.scene.tokens[id] = window.TOKEN_OBJECTS[id].options;
		}

		if (typeof this.scene !== "undefined") {
			this.scene.reveals = [].concat(window.REVEALED); // USE A CLONE OF THE CURRENT REVEALED ARRAY...
			this.scene.drawings = [].concat(window.DRAWINGS);
		}

		localStorage.setItem("ScenesHandler" + this.gameid, JSON.stringify(this.scenes));
		localStorage.setItem("CurrentScene" + this.gameid, this.current_scene_id);
	}

	constructor(gameid) {
		this.gameid = gameid;

		this.sources = {};


		if (localStorage.getItem('ScenesHandler' + gameid) != null) {
			this.scenes = $.parseJSON(localStorage.getItem('ScenesHandler' + gameid));
			this.current_scene_id = localStorage.getItem("CurrentScene" + gameid);
		}
		else {
			this.scenes = [];
			this.scenes.push({
				title: "The Tavern",
				dm_map: "",
				player_map: "https://i.pinimg.com/originals/a2/04/d4/a204d4a2faceb7f4ae93e8bd9d146469.jpg",
				scale: "100",
				dm_map_usable: "0",
				fog_of_war: "1",
				tokens: {},
				grid: "0",
				hpps: "60",
				vpps: "60",
				snap: "0",
				offsetx: 0,
				offsety: 0,
				reveals: [[0, 0, 0, 0, 2, 0]],
			});
			this.current_scene_id = 0;
		}
	}
}
