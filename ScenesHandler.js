// Helper functions to check max map size - data from https://github.com/jhildenbiddle/canvas-size
function get_canvas_max_length() {
	var browser = get_browser();

	if (browser.mozilla) {
		// Firefox
		return 32767;		
	} else if (browser.msie) {
		// IE
		if (browser >= '11.0') {
			return 16384;
		} else {
			return 8192;
		}
	} else if (!browser.opera) {
		// Chrome
		if (browser.version >= '73.0') {
			return 65535;
		} else {
			return 32767;
		}
	} else {
		// Unsupported
		return 32767;
	}
}

function get_canvas_max_area() {
	var browser = get_browser();
	var max_area = 0;

	if (browser.mozilla) {
		// Firefox
		max_area = (11180 * 11180);
	} else if (browser.msie) {
		// IE
		max_area = (8192 * 8192);		
	} else if (!browser.opera) {
		// Chrome
		max_area = (16384 * 16384);
	} else {
		// Unsupported
		max_area = (16384 * 16384);
	}

	console.log("Browser detected as " + browser.name + " with version " + browser.version);
	return max_area;
}

class ScenesHandler { // ONLY THE DM USES THIS OBJECT

	reload(callback = null) { //This is still used for grid wizard loading since we load so many times.
		this.switch_scene(this.current_scene_id, null);
	}

	switch_scene(sceneid, callback = null) { //This is still used for grid wizard loading since we load so many times. -- THIS FUNCTION SHOULD DIE AFTER EVERYTHING IS IN THE CLOUD
		this.current_scene_id = sceneid;
		var self = this;
		var scene = this.scenes[sceneid];
		this.scene = scene;
		if(!scene.id){
			scene.id=uuid();
		}

		if (typeof scene.player_map_is_video === 'undefined') {
			scene.player_map_is_video = "0";
		}
		if (typeof scene.dm_map_is_video === 'undefined') {
			scene.dm_map_is_video = "0";
		}

		window.CURRENT_SCENE_DATA = scene;

		$(".VTTToken").each(function() {
			$("#aura_" + $(this).attr("data-id").replaceAll("/", "")).remove();
			$("#light_" + $(this).attr("data-id").replaceAll("/", "")).remove();
			$(`.aura-element-container-clip[id='${$(this).attr("data-id")}']`).remove();
		});
		$(".VTTToken").remove();

		for (var i in window.TOKEN_OBJECTS) {
			delete window.TOKEN_OBJECTS[i];
		}
		window.lineOfSightPolygons = {};

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
			scene.upsq = 'ft'

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

		$("#tokens").show();
		$("#grid_overlay").show();


		if (self.scene.fog_of_war == 1) {
			window.FOG_OF_WAR = true;
			//$("#fog_overlay").show();
			window.REVEALED = [[0, 0, 0, 0, 2, 0]].concat(self.scene.reveals);
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
		var map_is_video = false;
		if ((scene.dm_map != "") && (scene.dm_map_usable == "1") && (window.DM)) {
			map_url = scene.dm_map;
			map_is_video = (scene.dm_map_is_video === "1");
		}
		else {
			map_url = scene.player_map;
			map_is_video = (scene.player_map_is_video === "1");
		}


		//This is still used for grid wizard loading since we load so many times -- it is not used for other scene loading though. You can find that in message broker handleScene
		load_scenemap(map_url, map_is_video, null, null, window.CURRENT_SCENE_DATA.UVTTFile, function() {
			window.CURRENT_SCENE_DATA.scale_factor = 1;
			scene.scale_factor = 1;


			let mapHeight = $("#scene_map").height();
			let mapWidth = $("#scene_map").width();

			if(scene.scale_check && !scene.UVTTFile && !scene.is_video && (mapHeight > 2500 || mapWidth > 2500)){
				let conversion = 2;
				if(mapWidth >= mapHeight){
					conversion = 1980 / mapWidth;
				}
				else{
					conversion = 1980 / mapHeight;
				}
				mapHeight = mapHeight*conversion;
				mapWidth = mapWidth*conversion;
				$("#scene_map").css({
					'height': mapHeight,
					'width': mapWidth
				});
				scene.scale_factor = scene.scale_factor / conversion		
				window.CURRENT_SCENE_DATA.scale_factor = scene.scale_factor;
			}
			var owidth = mapHeight;
			var oheight = mapWidth;
			var max_length = get_canvas_max_length();
			var max_area = get_canvas_max_area();
			console.log("Map size is " + owidth + "x" + oheight + " (with scale factor of " + scene.scale_factor + ") and browser supports max length of " + max_length + "px and max area of " + max_area + "px");

			// Check if the map size is too large
			if (owidth > max_length || oheight > max_length || (owidth * oheight) > max_area) {
				alert("Your map is too large! Your browser supports max width and height of " + max_length + " and a max area (width*height) of " + max_area);
			} else if (scene.scale_factor > 1) {
				var scaled_owidth = (owidth * scene.scale_factor);
				var scaled_oheight = (oheight * scene.scale_factor);
				if (scaled_owidth > max_length || scaled_oheight > max_length || (scaled_owidth * scaled_oheight) > max_area) {
					alert("Your grid size is too large! We try to keep grid squares at least 50px for nice looking token.\nWe had to scale the map size, making it unsupported on your browser.\nTry to re-grid your map and reduce the number of grid squares.");
				}
			}
		
			$("#scene_map").off("load");
			reset_canvas();
			$("#VTT").css("transform", "scale(" + window.ZOOM + ")");

			set_default_vttwrapper_size()

			let found_data_tokens=false;
			for (const property in scene.tokens) {
				self.create_update_token(scene.tokens[property]);
				if(scene.tokens[property].imgsrc.startsWith("data:"))
					found_data_tokens=true;
			}

			if(found_data_tokens){
				alert('WARNING. This scene contains token with data: urls as images. Please only use http:// or https:// urls for images');
			}

			if (callback != null)
				callback();

			if (window.EncounterHandler !== undefined) {
				fetch_and_cache_scene_monster_items();
			} else {
				console.log("Not updating avtt encounter");
			}
		});

		// some things can't be done correctly until after the scene finishes loading
		redraw_settings_panel_token_examples();
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
				//chapter, subchapter (eg icewind), chapter, handouts and maps (eg. Curse of Strahd)
				iframe.contents().find("h3 > a, h3 ~ ul strong a, h4 > a, h3.adventure-chapter-header:contains('Appendices') ~ ul a").each(function(idx) {
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
				//map sections that are just links to maps not always found in other chapters (eg wildemount/eberron)
				iframe.contents().find("h3.adventure-chapter-header:contains('Map') ~ ul a").each(function(idx) {
					if(!(/\.(jpg|jpeg|png|webp|avif|gif|svg)$/.test($(this).attr('href'))))
						return;
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
		if(/\.(jpg|jpeg|png|webp|avif|gif|svg)$/.test(chapter_url)){
			//'Maps' chapter maps at the end of books - individual images
			var dm_map = '';
			var player_map = chapter_url;
			var header = self.sources[source_keyword].chapters[chapter_keyword].title;
			var thumb = chapter_url;
			var id = self.sources[source_keyword].chapters[chapter_keyword].title;
			var title = self.sources[source_keyword].chapters[chapter_keyword].title;

			self.sources[source_keyword].chapters[chapter_keyword].scenes.push({
				id: id,
				uuid: source_keyword + "/" + chapter_keyword + "/" + id,
				title: title,
				dm_map: dm_map,
				player_map: player_map,
				player_map_is_video: "0",
				dm_map_is_video: "0",
				scale: "100",
				dm_map_usable: "0",
				thumb: thumb,
				tokens: {},
			});		
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
					player_map_is_video: "0",
					dm_map_is_video: "0",
					thumb: thumb,
					scale: "100",
					dm_map_usable: "0",
					tokens: {},
				});
			});

			// COMPENDIUM IMAGES
			let compendiumWithSubtitle = iframe.contents().find(".compendium-image-with-subtitle-center,.compendium-image-with-subtitle-right,.compendium-image-with-subtitle-left");
			let compendiumWithoutSubtitle = iframe.contents().find(".compendium-image-center");

			if (compendiumWithSubtitle.length > 0) {
				compendiumWithSubtitle.each(function(idx) {
					if ($(this).parent().is('figure') || $(this).is('figure'))
						return;
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
					else if ($(this).find(".compendium-image-view-player a").length > 0) {
						dm_map = img1;
						player_map = $(this).find(".compendium-image-view-player a").attr("href");
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
						player_map_is_video: "0",
						dm_map_is_video: "0",
						scale: "100",
						dm_map_usable: "0",
						thumb: thumb,
						tokens: {},
					});
				});
			} else if (compendiumWithoutSubtitle.length > 0) {
				compendiumWithoutSubtitle.each(function(idx) {
					// import it only if there's a player version

					if ($(this).parent().is('figure') || $(this).is('figure'))
						return;
					let playerMapContainer;
					if ($(this).parent().next().is(".compendium-image-view-player")) {
						playerMapContainer = $(this).parent().next().find(".compendium-image-center");
					} else if ($(this).parent().next().find(".compendium-image-center a").length > 0) {
						playerMapContainer = $(this).parent().next().find(".compendium-image-center a");
					} else if($(this).parent().not('.compendium-image-view-player').length > 0){
						playerMapContainer = $(this);
					}
					if (playerMapContainer === undefined || playerMapContainer.length === 0) {
						return;
					}


					var dm_map = $(this).attr('href');
					var player_map = playerMapContainer.attr("href");
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
						player_map_is_video: "0",
						dm_map_is_video: "0",
						scale: "100",
						dm_map_usable: "0",
						thumb: thumb,
						tokens: {},
					});

				});
			}

			iframe.remove();
			console.log('INVOKO CALLBACK');
			callback();
		});
	}

	create_update_token(options, save = true) {
		console.log("create_update_token");
		let self = this;
		let id = options.id;
		this.scene.tokens[id]=options;

		if (!(id in window.TOKEN_OBJECTS)) {

			window.TOKEN_OBJECTS[id] = new Token(options);

			window.TOKEN_OBJECTS[id].sync = mydebounce(function() {
				window.MB.sendMessage('custom/myVTT/token', window.TOKEN_OBJECTS[id].options);
			}, 500);
		}

		window.TOKEN_OBJECTS[id].place();
		this.scene.hasTokens = true;
	}


	persist_scene(scene_index,isnew=false){ // CLOUD ONLY FUNCTION
		let sceneData=Object.assign({},this.scenes[scene_index]);
		sceneData.reveals=[];
		sceneData.drawings=[];
		sceneData.tokens={};
		if(isnew)
			sceneData.isnewscene=true;

		window.MB.sendMessage("custom/myVTT/update_scene",sceneData);
	}

	persist_current_scene(dontswitch=false){
		let sceneData=Object.assign({},this.scene);
		sceneData.reveals=[];
		sceneData.drawings=[];
		sceneData.tokens={};
		window.MB.sendMessage("custom/myVTT/update_scene",sceneData,dontswitch);
	}

	delete_scene(sceneId, reloadUI = true) { // not the index, but the actual id
		window.MB.sendMessage("custom/myVTT/delete_scene",{ id: sceneId });
		let sceneIndex = window.ScenesHandler.scenes.findIndex(s => s.id === sceneId);
		window.ScenesHandler.scenes.splice(sceneIndex, 1);
		if (reloadUI) {
			did_update_scenes();
		}
	}

	persist() {
		console.error("ScenesHandler.persist is no longer a function. Stop calling it!");
	}

	sync() {
		console.error("ScenesHandler.sync is no longer a function. Stop calling it!");
	}

	constructor() {
		this.sources = {};
		this.scenes = [];
		this.current_scene_id = null;
	}
}

function folder_path_of_scene(scene) {
	const parent = find_parent_of_scene(scene);
	if (parent) {
		const ancestors = find_ancestors_of_scene(parent);
		let ancestorPath = ancestors.reverse().map(s => s.title).join("/")
		if (!ancestorPath.startsWith(RootFolder.Scenes.path)) {
			ancestorPath = `${RootFolder.Scenes.path}/${ancestorPath}`;
		}
		return sanitize_folder_path(ancestorPath);
	} else {
		return RootFolder.Scenes.path;
	}
}
function find_parent_of_scene(scene) {
	return window.ScenesHandler.scenes.find(s => s.id === scene.parentId);
}
function find_ancestors_of_scene(scene, found = []) {
	found.push(scene);
	let parent = find_parent_of_scene(scene);
	if (parent) {
		return find_ancestors_of_scene(parent, found)
	} else {
		// TODO: anything special for parentId === RootFolder.Scene.id?
		return found;
	}
}

function find_descendants_of_scene_id(sceneId) {
	const scene = window.ScenesHandler.scenes.find(s => s.id === sceneId);
	return find_descendants_of_scene(scene);
}

function find_descendants_of_scene(scene, found = []) {
	if (!scene) {
		return found;
	}
	found.push(scene);
	window.ScenesHandler.scenes.forEach(s => {
		if (s.parentId === scene.id) {
			// this is a child, so process it
			found = find_descendants_of_scene(s, found);
		}
	});
	return found;
}