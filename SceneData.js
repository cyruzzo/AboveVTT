//Used for adding to scene data files.
async function export_scene_import_data(){
	let currentSceneData = await export_scene_data();
	let uuid = currentSceneData.uuid
	
	let DataFile = {}

	DataFile = currentSceneData.data

	let tokensObject = {}
	for(let token in DataFile[uuid].tokens){

		let tokenId = DataFile[uuid].tokens[token].id;
		let statBlockID = DataFile[uuid].tokens[token].statBlock
		if(statBlockID != undefined && window.JOURNAL.notes[statBlockID] != undefined){
			if(DataFile[uuid].notes == undefined)
				DataFile[uuid].notes = {};
			DataFile[uuid].notes[statBlockID] = window.JOURNAL.notes[statBlockID];
		}
		if(window.JOURNAL.notes[tokenId] != undefined){
			if(DataFile[uuid].notes == undefined)
				DataFile[uuid].notes = {};
			DataFile[uuid].notes[tokenId] = window.JOURNAL.notes[tokenId];
		}
		tokensObject[tokenId] = DataFile[uuid].tokens[token];		
	}	
	DataFile[uuid].tokens = tokensObject;

	let currentdate = new Date(); 
	let datetime = `${currentdate.getFullYear()}-${(currentdate.getMonth()+1)}-${currentdate.getDate()}`
	download(JSON.stringify(DataFile,null,"\t"),`${window.CURRENT_SCENE_DATA.title}-${datetime}.json`,"application/json");
	$(".import-loading-indicator").remove();
}
async function export_scene_data(){
	
	let scene = await AboveApi.getScene(window.CURRENT_SCENE_DATA.id);
	let data = {
		 ...scene.data
	} 
	
	let removeArray = ['scale_check', 'daylightColor', 'undefined', 'isnewscene', 'disableSceneVision', 'snap', 'fog_of_war', 'folderPath', 'id', 'itemType', 'order', 'parentId', 'playlist', 'uuid', 'visionTrail', 'height', 'width']
	let removeDdbArray = ['dm_map', 'player_map', 'map', 'thumb', 'dm_map_is_video', 'map', 'player_map_is_video']
	
	for(let i=0; i<removeArray.length; i++){
		delete data[removeArray[i]];
	}

	if(data?.dm_map?.includes('dndbeyond.com') || data?.map?.includes('dndbeyond.com') || data?.player_map?.includes('dndbeyond.com') ){
		for(let i=0; i<removeDdbArray.length; i++){
			delete data[removeDdbArray[i]];
		}
	}

	let defaultSceneData = window.default_scene_data();
	for(let i in defaultSceneData){
		if(data[i] == defaultSceneData[i]){
			delete data[i];
		}
	}

	let dataObject = {}
	dataObject[window.CURRENT_SCENE_DATA.uuid] = data;
	return {'data': dataObject, 'uuid': window.CURRENT_SCENE_DATA.uuid};
}

function get_avtt_scene_import_data() {
	return [
		{
			"title": "Above VTT",
			"logo": "https://raw.githubusercontent.com/cyruzzo/AboveVTT/main/assets/avtt-logo.png",
			"scenes": [
				{
					"category": "Tutorial",
					"description": "<p>Learn the basics of AboveVTT by exploring The Tavern!<br><strong>This Tutorial Covers:</strong></p><p class=\"characters-statblock\" style=\"font-family: Roboto Condensed; font-size: 14px\">&bull; Tools<br>&bull; Tokens<br>&bull; Scene Creation</p>",
					"tags": ["Tools", "Tokens", "Scenes"],
					"thumb": "https://i.pinimg.com/originals/a2/04/d4/a204d4a2faceb7f4ae93e8bd9d146469.jpg",
					"gridSubdividedToggle": "0",
					"reveals": [
						[
							0,
							0,
							5992,
							4944,
							0,
							0,
							"4"
						]
					],
					"gridStrokeNumberInput": "0.5",
					"scale": "100",
					"vpps": 72,
					"darkness_filter_number": "0",
					"title": "The Tavern",
					"fog_of_war": "1",
					"uuid": "",
					"player_map": "https://i.pinimg.com/originals/a2/04/d4/a204d4a2faceb7f4ae93e8bd9d146469.jpg",
					"upsq": "",
					"drawings": [
						[
							"line",
							"wall",
							"rgba(0, 255, 0, 1)",
							1115,
							1164,
							1118,
							1160,
							null,
							1
						],
						[
							"line",
							"wall",
							"rgba(0, 255, 0, 1)",
							86,
							100,
							84,
							1155,
							null,
							1
						],
						[
							"line",
							"wall",
							"rgba(0, 255, 0, 1)",
							84,
							1155,
							1118,
							1148,
							null,
							1
						],
						[
							"line",
							"wall",
							"rgba(0, 255, 0, 1)",
							84,
							1155,
							1118,
							1148,
							null,
							1
						],
						[
							"line",
							"wall",
							"rgba(0, 255, 0, 1)",
							1118,
							1148,
							1115,
							1160,
							null,
							1
						],
						[
							"line",
							"wall",
							"rgba(0, 255, 0, 1)",
							1118,
							1148,
							1115,
							1160,
							null,
							1
						],
						[
							"line",
							"wall",
							"rgba(0, 255, 0, 1)",
							1115,
							1160,
							1115,
							1164,
							null,
							1
						],
						[
							"line",
							"wall",
							"rgba(0, 255, 0, 1)",
							1297,
							1146,
							1288,
							1143,
							null,
							1
						],
						[
							"line",
							"wall",
							"rgba(0, 255, 0, 1)",
							1248,
							1174,
							1253,
							1136,
							null,
							1
						],
						[
							"line",
							"wall",
							"rgba(0, 255, 0, 1)",
							1253,
							1136,
							1297,
							1146,
							null,
							1
						],
						[
							"line",
							"wall",
							"rgba(0, 255, 0, 1)",
							1085,
							77,
							1085,
							77,
							null,
							1
						],
						[
							"line",
							"wall",
							"rgba(0, 255, 0, 1)",
							1050,
							98,
							1041,
							86,
							null,
							1
						],
						[
							"line",
							"wall",
							"rgba(0, 255, 0, 1)",
							1297,
							1143,
							1425,
							1148,
							null,
							1
						],
						[
							"line",
							"wall",
							"rgba(0, 255, 0, 1)",
							1425,
							1148,
							1414,
							105,
							null,
							1
						],
						[
							"line",
							"wall",
							"rgba(0, 255, 0, 1)",
							1425,
							1148,
							1414,
							105,
							null,
							1
						],
						[
							"line",
							"wall",
							"rgba(0, 255, 0, 1)",
							1414,
							105,
							1041,
							112,
							null,
							1
						],
						[
							"line",
							"wall",
							"rgba(0, 255, 0, 1)",
							1414,
							105,
							1041,
							112,
							null,
							1
						],
						[
							"line",
							"wall",
							"rgba(0, 255, 0, 1)",
							1041,
							112,
							1046,
							86,
							null,
							1
						],
						[
							"line",
							"wall",
							"rgba(0, 255, 0, 1)",
							1041,
							112,
							1046,
							86,
							null,
							1
						],
						[
							"line",
							"wall",
							"rgba(0, 255, 0, 1)",
							1046,
							86,
							1050,
							98,
							null,
							1
						],
						[
							"line",
							"wall",
							"rgba(0, 255, 0, 1)",
							87,
							107,
							85,
							107,
							null,
							1
						],
						[
							"line",
							"wall",
							"rgba(0, 255, 0, 1)",
							885,
							86,
							883,
							112,
							null,
							1
						],
						[
							"line",
							"wall",
							"rgba(0, 255, 0, 1)",
							1423,
							771,
							1423,
							771,
							null,
							1
						],
						[
							"line",
							"wall",
							"rgba(0, 255, 0, 1)",
							82,
							771,
							1428,
							771,
							null,
							1
						],
						[
							"line",
							"wall",
							"rgba(0, 255, 0, 1)",
							1428,
							771,
							1423,
							771,
							null,
							1
						],
						[
							"line",
							"wall",
							"rgba(0, 255, 0, 1)",
							1108,
							766,
							1113,
							1156,
							null,
							1
						],
						[
							"line",
							"wall",
							"rgba(0, 255, 0, 1)",
							536,
							766,
							543,
							1154,
							null,
							1
						],
						[
							"line",
							"wall",
							"rgba(0, 255, 0, 1)",
							325,
							1156,
							322,
							1154,
							null,
							1
						],
						[
							"line",
							"wall",
							"rgba(0, 255, 0, 1)",
							538,
							982,
							320,
							984,
							null,
							1
						],
						[
							"line",
							"wall",
							"rgba(0, 255, 0, 1)",
							320,
							984,
							320,
							766,
							null,
							1
						],
						[
							"line",
							"wall",
							"rgba(0, 255, 0, 1)",
							320,
							766,
							327,
							807,
							null,
							1
						],
						[
							"line",
							"wall",
							"rgba(0, 255, 0, 1)",
							327,
							807,
							322,
							1154,
							null,
							1
						],
						[
							"line",
							"wall",
							"rgba(0, 255, 0, 1)",
							327,
							807,
							322,
							1154,
							null,
							1
						],
						[
							"line",
							"wall",
							"rgba(0, 255, 0, 1)",
							322,
							1154,
							325,
							1156,
							null,
							1
						],
						[
							"line",
							"wall",
							"rgba(0, 255, 0, 1)",
							1108,
							924,
							1108,
							924,
							null,
							1
						],
						[
							"line",
							"wall",
							"rgba(0, 255, 0, 1)",
							538,
							924,
							1110,
							926,
							null,
							1
						],
						[
							"line",
							"wall",
							"rgba(0, 255, 0, 1)",
							1110,
							926,
							1108,
							924,
							null,
							1
						],
						[
							"line",
							"wall",
							"rgba(0, 255, 0 ,1)",
							348,
							428,
							2159,
							439,
							null,
							"4"
						],
						[
							"line",
							"wall",
							"rgba(0, 255, 0, 1)",
							3532,
							448,
							2825,
							443,
							null,
							"4"
						],
						[
							"line",
							"wall",
							"rgba(0, 255, 0, 1)",
							2125,
							446,
							2931,
							440,
							null,
							"4"
						],
						[
							"text",
							776,
							152,
							221.7028779963875,
							81.29105526534208,
							"This token has a note on\n it. Double click the note\n icon here to open it. ⬇️",
							{
								"size": 17.736230239711002,
								"color": "rgb(255, 255, 255)",
								"shadow": "none",
								"underline": false,
								"weight": "400",
								"style": "normal",
								"align": "center",
								"font": "Arial"
							},
							{
								"size": 4.4340575599277505,
								"color": "rgb(0, 0, 0)"
							},
							"rgba(0, 0, 0, 0)",
							"47cbc2c8-692b-4ef7-955d-f42266a823bd",
							"1",
							false
						],
						[
							"text",
							97.57894736842104,
							136.8815789473684,
							337.4605263157894,
							149.07894736842104,
							"⬆️There are walls set up\n for vision here. The DM can see and \nedit these walls by clicking the wall button\n in the tools at the top left of the screen.\n\nHolding shift while drawing walls or right \nclicking will create wall segments. ",
							{
								"size": 17.61842105263158,
								"color": "rgb(255, 255, 255)",
								"shadow": "none",
								"underline": false,
								"weight": "400",
								"style": "normal",
								"align": "center",
								"font": "Arial"
							},
							{
								"size": 4.065789473684211,
								"color": "rgb(0, 0, 0)"
							},
							"rgba(0, 0, 0, 0)",
							"8f19b902-9689-491c-ba6d-17f98573ccec",
							"1",
							false
						],
						[
							"text",
							32,
							420,
							187.1642278904695,
							51.6796748652789,
							"This is also a token\n⬇️",
							{
								"font": "Arial",
								"size": 16.760975631982344,
								"weight": "400",
								"style": "normal",
								"underline": false,
								"align": "center",
								"color": "rgb(255, 255, 255)",
								"shadow": "none"
							},
							{
								"size": 4.190243907995586,
								"color": "rgb(0, 0, 0)"
							},
							"rgba(0, 0, 0, 0)",
							"60dc3899-4be2-4131-a5cc-a462a9c4d553",
							"1",
							false
						],
						[
							"text",
							491,
							618,
							445.90654080318063,
							95.3206011137234,
							"This text is hidden from players. And these tokens \nhave their movement restrict. Players will not be able to move them",
							{
								"font": "Arial",
								"size": 17.77163749577894,
								"weight": "400",
								"style": "normal",
								"underline": false,
								"align": "center",
								"color": "rgb(255, 255, 255)",
								"shadow": "none"
							},
							{
								"size": 4.846810226121529,
								"color": "rgb(0, 0, 0)"
							},
							"rgba(0, 0, 0, 0)",
							"bc1e48cd-c614-41bb-979e-66dc0550932e",
							"1",
							true
						]
					],
					"fpsq": "5",
					"tokens": {
						"0d4e97ca-6592-4882-93f2-dd9692258d89": {
							"auraVisible": false,
							"itemType": "builtinToken",
							"color": "#006000",
							"disablestat": true,
							"hidestat": false,
							"gridSquares": 1,
							"custom_conditions": [],
							"hp": "",
							"max_hp": "",
							"legacyaspectratio": true,
							"folderPath": "/Letters",
							"restrictPlayerMove": false,
							"listItemPath": "/AboveVTT Tokens/Letters/? - Question Mark",
							"top": "200px",
							"hidehpbar": false,
							"light1": {
								"color": "rgba(255, 255, 255, 1)",
								"feet": "1000"
							},
							"id": "0d4e97ca-6592-4882-93f2-dd9692258d89",
							"imgsrc": "https://abovevtt-assets.s3.eu-central-1.amazonaws.com/letters/QUESTION.png",
							"locked": true,
							"light2": {
								"color": "rgba(255, 255, 255, 0.5)",
								"feet": "1000"
							},
							"image": "https://abovevtt-assets.s3.eu-central-1.amazonaws.com/letters/QUESTION.png",
							"ac": "",
							"aura2": {
								"color": "rgba(255, 255, 0, 0.1)",
								"feet": "0"
							},
							"aura1": {
								"color": "rgba(255, 129, 0, 0.3)",
								"feet": "0"
							},
							"tokenStyleSelect": "circle",
							"revealname": false,
							"lockRestrictDrop": "lock",
							"player_owned": false,
							"tokenBaseStyleSelect": "default",
							"itemId": "_AboveVTT_Tokens_Letters_____Question_Mark",
							"square": false,
							"healthauratype": "aura",
							"size": 72,
							"left": "960px",
							"auraOwned": false,
							"name": "Token Notes",
							"zindexdiff": 17,
							"defaultmaxhptype": "average",
							"disableborder": true,
							"auraislight": false,
							"disableaura": false,
							"conditions": [],
							"enablepercenthpbar": false,
							"revealInFog": false
						},
						"2dfec1cf-58a1-415e-b23c-1373ea9e2668": {
							"auraVisible": false,
							"itemType": "builtinToken",
							"color": "#F032E6",
							"disablestat": true,
							"hidestat": false,
							"gridSquares": 1,
							"custom_conditions": [],
							"hp": "",
							"max_hp": "",
							"legacyaspectratio": true,
							"folderPath": "/NPCs",
							"restrictPlayerMove": true,
							"listItemPath": "/AboveVTT Tokens/NPCs/Drow [F]",
							"top": "523px",
							"hidehpbar": false,
							"light1": {
								"color": "rgba(255, 255, 255, 1)",
								"feet": "1000"
							},
							"id": "2dfec1cf-58a1-415e-b23c-1373ea9e2668",
							"imgsrc": "https://i.imgur.com/lwPqseX.png",
							"locked": false,
							"light2": {
								"color": "rgba(255, 255, 255, 0.5)",
								"feet": "1000"
							},
							"image": "https://i.imgur.com/lwPqseX.png",
							"ac": "",
							"aura2": {
								"color": "rgba(255, 255, 0, 0.1)",
								"feet": "0"
							},
							"aura1": {
								"color": "rgba(255, 129, 0, 0.3)",
								"feet": "0"
							},
							"alternativeImages": [
								"https://i.imgur.com/lwPqseX.png",
								"https://i.imgur.com/cVaeAum.png",
								"https://i.imgur.com/2qHM12W.png",
								"https://i.imgur.com/apqxuLf.png",
								"https://i.imgur.com/OkdFTrq.png",
								"https://i.imgur.com/W4NtBsW.png",
								"https://i.imgur.com/yoIYDKO.png",
								"https://i.imgur.com/d4baR5O.png",
								"https://i.imgur.com/hpxtRYf.png",
								"https://i.imgur.com/SwxOZEX.png",
								"https://i.imgur.com/wGyXG6h.png",
								"https://i.imgur.com/ZolhnEc.png",
								"https://i.imgur.com/ROnLoAj.png",
								"https://i.imgur.com/PM09pdy.png",
								"https://i.imgur.com/6c8FF5q.png",
								"https://i.imgur.com/aqjKtH5.png",
								"https://i.imgur.com/v49Gd3r.png",
								"https://i.imgur.com/FHMszi4.png",
								"https://i.imgur.com/Lom5T9S.png"
							],
							"tokenStyleSelect": "circle",
							"revealname": false,
							"lockRestrictDrop": "restrict",
							"player_owned": false,
							"tokenBaseStyleSelect": "default",
							"itemId": "_AboveVTT_Tokens_NPCs_Drow__F_",
							"square": false,
							"healthauratype": "aura",
							"size": 72,
							"left": "673px",
							"auraOwned": false,
							"name": "Drow [F]",
							"zindexdiff": 17,
							"defaultmaxhptype": "average",
							"disableborder": false,
							"auraislight": true,
							"disableaura": false,
							"conditions": [],
							"enablepercenthpbar": false,
							"revealInFog": false
						},
						"36c11cd0-45b1-46bf-bd54-adb31d51ed2a": {
							"auraVisible": false,
							"itemType": "builtinToken",
							"color": "#008080",
							"disablestat": true,
							"hidestat": false,
							"gridSquares": 1,
							"custom_conditions": [],
							"hp": "",
							"max_hp": "",
							"legacyaspectratio": true,
							"folderPath": "/NPCs",
							"restrictPlayerMove": true,
							"listItemPath": "/AboveVTT Tokens/NPCs/Commoner",
							"top": "672px",
							"hidehpbar": false,
							"light1": {
								"color": "rgba(255, 255, 255, 1)",
								"feet": "10"
							},
							"id": "36c11cd0-45b1-46bf-bd54-adb31d51ed2a",
							"imgsrc": "https://i.pinimg.com/236x/d5/9b/e6/d59be622749ea74ccbc88485783e679c.jpg",
							"locked": false,
							"light2": {
								"color": "rgba(255, 255, 255, 0.5)",
								"feet": "10"
							},
							"image": "https://drive.google.com/file/d/1H-5cCt03oIB43CnhmdaHM6P2Aw8T2n60/view?usp=sharing",
							"ac": "",
							"aura2": {
								"color": "rgba(255, 255, 0, 0.1)",
								"feet": "0"
							},
							"aura1": {
								"color": "rgba(255, 129, 0, 0.3)",
								"feet": "0"
							},
							"alternativeImages": [
								"https://drive.google.com/file/d/1H-5cCt03oIB43CnhmdaHM6P2Aw8T2n60/view?usp=sharing",
								"https://drive.google.com/file/d/14sNpLcJlzOfL4A5Qb_zdrYmOTZk51GTM/view?usp=sharing",
								"https://i.pinimg.com/564x/fa/93/fb/fa93fbf94a90d2068af62b5a34b48d2d.jpg",
								"https://i.pinimg.com/564x/b1/88/10/b18810e3a419fe6c9666ec64c67fdb4f.jpg",
								"https://i.pinimg.com/564x/b1/61/18/b16118b557ed8cd55a72631ff763fa97.jpg",
								"https://i.pinimg.com/564x/f7/6c/e5/f76ce511507ceb4be5003507c4b3190e.jpg",
								"https://i.pinimg.com/564x/d5/9b/e6/d59be622749ea74ccbc88485783e679c.jpg",
								"https://i.pinimg.com/564x/55/22/96/55229604ec385c8c1bf442a187a3aeeb.jpg",
								"https://i.pinimg.com/564x/da/56/f5/da56f50ba711df5b7c80e2fc240d9786.jpg",
								"https://i.pinimg.com/236x/62/45/8e/62458effd9b3901aa220954d50410988.jpg",
								"https://i.pinimg.com/236x/dc/39/e3/dc39e3e0edf1204d128565084146e221.jpg",
								"https://i.pinimg.com/236x/5a/13/5f/5a135f30617868eb35a78c0c268bd069.jpg",
								"https://i.pinimg.com/236x/6a/e2/51/6ae25147759cdf023dac43cdfeb68ef7.jpg",
								"https://i.pinimg.com/236x/d5/9b/e6/d59be622749ea74ccbc88485783e679c.jpg",
								"https://i.pinimg.com/236x/ec/24/81/ec2481a73c161cbbb70622e485bba1ae.jpg"
							],
							"tokenStyleSelect": "circle",
							"revealname": false,
							"lockRestrictDrop": "restrict",
							"player_owned": false,
							"tokenBaseStyleSelect": "default",
							"itemId": "_AboveVTT_Tokens_NPCs_Commoner",
							"square": false,
							"healthauratype": "aura",
							"size": 72,
							"left": "651px",
							"auraOwned": false,
							"name": "Commoner",
							"zindexdiff": 17,
							"defaultmaxhptype": "average",
							"disableborder": false,
							"auraislight": true,
							"disableaura": false,
							"conditions": [],
							"enablepercenthpbar": false,
							"revealInFog": false
						},
						"669e4d9b-b8e2-43c4-b81b-29e8bfe42177": {
							"auraVisible": false,
							"itemType": "builtinToken",
							"color": "#FFD433",
							"disablestat": true,
							"hidestat": false,
							"gridSquares": 1,
							"custom_conditions": [],
							"hp": "",
							"max_hp": "",
							"legacyaspectratio": false,
							"folderPath": "/Overlays",
							"restrictPlayerMove": true,
							"listItemPath": "/AboveVTT Tokens/Overlays/Flame 2",
							"top": "438px",
							"hidehpbar": false,
							"light1": {
								"color": "rgba(244.494, 175.341683781, 24.96283739999999, 1)",
								"feet": "10"
							},
							"id": "669e4d9b-b8e2-43c4-b81b-29e8bfe42177",
							"imgsrc": "https://abovevtt-assets.s3.eu-central-1.amazonaws.com/tokens/flame2.gif",
							"locked": true,
							"light2": {
								"color": "rgba(255, 156.649424, 92.61599999999999, 0.5)",
								"feet": "10"
							},
							"image": "https://abovevtt-assets.s3.eu-central-1.amazonaws.com/tokens/flame2.gif",
							"ac": "",
							"aura2": {
								"color": "rgba(255, 255, 0, 0.1)",
								"feet": "0"
							},
							"aura1": {
								"color": "rgba(255, 129, 0, 0.3)",
								"feet": "0"
							},
							"tokenStyleSelect": "definitelyNotAToken",
							"revealname": false,
							"lockRestrictDrop": "lock",
							"player_owned": false,
							"tokenBaseStyleSelect": "default",
							"square": true,
							"itemId": "_AboveVTT_Tokens_Overlays_Flame_2",
							"healthauratype": "aura",
							"size": 72,
							"left": "91px",
							"auraOwned": false,
							"name": "Flame 2",
							"zindexdiff": 17,
							"defaultmaxhptype": "average",
							"disableborder": true,
							"auraislight": true,
							"disableaura": false,
							"conditions": [],
							"enablepercenthpbar": false,
							"revealInFog": false
						}
					},
					"darkness_filter": "0",
					"grid_line_width": "0.5",
					"order": 1666357432982,
					"grid_subdivided": "",
					"scale_factor": "1",
					"offsetx": 29,
					"dm_map_usable": "0",
					"offsety": 54,
					"dm_map_is_video": "0",
					"grid": "0",
					"dm_map": "",
					"player_map_is_video": "0",
					"hpps": 72,
					"grid_color": "rgba(0, 0, 0, 0.5)",
					"snap": "0",
					"map": "https://i.pinimg.com/originals/a2/04/d4/a204d4a2faceb7f4ae93e8bd9d146469.jpg",
					"width": 1498,
					"height": 1236,
					"notes": {
						"0d4e97ca-6592-4882-93f2-dd9692258d89": {
							"title": "? - Question Mark",
							"text": "<aside class=\"rules-text\">\n<p>Token Notes</p>\n<p>This is a token note. You can edit this note above. To add a token note to a token, right click it - it will open a menu of token options. You'll find the note options under 'TOKEN NOTE' in the menu.</p>\n</aside>\n<aside class=\"block-torn-paper\">\n<p>You can find some DnD style blocks in the formats button in the containers section. We suggest adding an extra line below where you want to put the container before adding it. This will allow you to click out of the box below it.</p>\n</aside>",
							"plain": "Token NotesThis is a token note. You can edit this note above. To add a token note to a token, right click it - it will open a menu of token options. You'll find the note options under 'TOKEN NOTE' in the menu.You can find some DnD style blocks in the formats button in the containers section. We suggest adding an extra line below where you want to put the container before adding it. This will allow you to click out of the box below it.",
							"player": false
						},
						"669e4d9b-b8e2-43c4-b81b-29e8bfe42177": {
							"title": "Flame 2",
							"text": "<blockquote class=\"text--quote-box\">\n<p>&nbsp;This token is locked. Neither DMs or Players will be able to move it. You can find options to restrict player movement or lock tokens under the right click menu in the Token Options section.</p>\n</blockquote>\n<p>&nbsp;</p>",
							"plain": " This token is locked. Neither DMs or Players will be able to move it. You can find options to restrict player movement or lock tokens under the right click menu in the Token Options section. ",
							"player": false
						}
					}
				}
			]
		},
		{
			"title": "Basic Maps",
			"logo": "https://raw.githubusercontent.com/cyruzzo/AboveVTT/main/assets/avtt-logo.png",
			"scenes": [
				{
					"thumb": "https://i.imgur.com/yXntstQ.png",
					"player_map": "https://i.imgur.com/yXntstQ.png",
					"dm_map": "",
					"title": "Stone",
					"scale_factor": 2,
					"hpps": 80,
					"vpps": 80,
					"grid": 1,
					"snap": "1",
					"fpsq": "5",
				},
				{
					"thumb": "https://i.imgur.com/EVHWm2v.png",
					"player_map": "https://i.imgur.com/EVHWm2v.png",
					"title": "Grass",
					"scale": 100,
					"dm_map": "",
					"scale_factor": 2,
					"hpps": 80,
					"vpps": 80,
					"grid": 1,
					"snap": "1",
					"fpsq": "5",
				},
				{
					"thumb": "https://i.imgur.com/ieZPZ9M.png",
					"player_map": "https://i.imgur.com/ieZPZ9M.png",
					"title": "Sand",
					"scale": 100,
					"dm_map": "",
					"scale_factor": 2,
					"hpps": 80,
					"vpps": 80,
					"grid": 1,
					"snap": "1",
					"fpsq": "5",
				},
				{
					"thumb": "https://i.imgur.com/yE66bBd.png",
					"player_map": "https://i.imgur.com/yE66bBd.png",
					"title": "Water",
					"scale": 100,
					"dm_map": "",
					"scale_factor": 2,
					"hpps": 80,
					"vpps": 80,
					"grid": 1,
					"snap": "1",
					"fpsq": "5",
				},
				{
					"thumb": "https://i.imgur.com/lWoMoxo.png",
					"player_map": "https://i.imgur.com/lWoMoxo.png",
					"title": "Wood",
					"scale": 100,
					"dm_map": "",
					"scale_factor": 2,
					"hpps": 80,
					"vpps": 80,
					"grid": 1,
					"snap": "1",
					"fpsq": "5",
				},
			]
		},
		{
			"title": "Neutral Party",
			"logo": "https://64.media.tumblr.com/050c0ef73569acdb456e0af208eb28d0/fe5cf0a5a09312d7-d7/s512x512u_c1/855f891ee23774c047d85185b9ea7ecbf656428f.pnj",
			"scenes": [
				{
					"thumb": "https://64.media.tumblr.com/e72f50f8293128ba33d9fed21248fa02/bbf6e5afdd7edd15-58/s250x400/8afa10cbe54f0a4cffc5f3bead266cd03a86b9c0.jpg",
					"player_map": "https://64.media.tumblr.com/e72f50f8293128ba33d9fed21248fa02/bbf6e5afdd7edd15-58/s2048x3072/1030bb7ed7e28cdcd9f728be2e3fc84e04d884f0.jpg",
					"title": "Neutral Party Maps 0",
					"scale": 100,
					"dm_map": "",
					snap: "1",
					hpps: "75",
					vpps: "75",
					fpqs: "5",
					offsetx: "0",
					offsety: "0",
					grid_subdivided: "0",
				},
				{
					"thumb": "https://64.media.tumblr.com/7e2b31d972be865bfe27cefde5b64778/2b89f6eb49fbb8c2-8e/s250x400/6b2f253bc1c7165c08d4bfcfed38467d022b7724.jpg",
					"player_map": "https://64.media.tumblr.com/7e2b31d972be865bfe27cefde5b64778/2b89f6eb49fbb8c2-8e/s2048x3072/57951d093663e18430a4b3c34bfc32eb29eb8d5c.jpg",
					"title": "Neutral Party Maps 1",
					"scale": 100,
					"dm_map": "",
					snap: "1",
					hpps: "68.33333333333333",
					vpps: "68.33333333333333",
					fpsq: "5",
					offsetx: "67.00000000000006",
					offsety: "67.00000000000007",
					grid_subdivided: "0",
				},
				{
					"thumb": "https://64.media.tumblr.com/32f3cb6238acc22d24324f4c27d9dd2f/8597e21b7a1e20bb-39/s250x400/48d898215924ec956160faeaf250e7295c22529e.jpg",
					"player_map": "https://64.media.tumblr.com/32f3cb6238acc22d24324f4c27d9dd2f/8597e21b7a1e20bb-39/s2048x3072/61251cef74684224ad3421df3ddc5d2eeb7156c6.jpg",
					"title": "Neutral Party Maps 2",
					"scale": 100,
					"dm_map": "",
					snap: "1",
					hpps: "58.666666666666664",
					vpps: "58.666666666666664",
					fpsq: "5",
					offsetx: "55.66666666666671",
					offsety: "55.00000000000005",
					grid_subdivided: "0",
				},
				{
					"thumb": "https://64.media.tumblr.com/45de4ac22b2a24f4242710ca47a03cf0/e594769a4b4d9399-53/s250x400/72c70be80d1feee05f5708a4cb0c149e649b7a0d.jpg",
					"player_map": "https://64.media.tumblr.com/45de4ac22b2a24f4242710ca47a03cf0/e594769a4b4d9399-53/s2048x3072/b6aea1b40ff71a07aeb4f31b73272f8386051e68.jpg",
					"title": "Neutral Party Maps 3",
					"scale": 100,
					"dm_map": "",
					snap: "1",
					hpps: "75",
					vpps: "75",
					fpsq: "5",
					offsetx: "0",
					offsety: "1",
					grid_subdivided: "0",
				},
				{
					"thumb": "https://64.media.tumblr.com/c8faee82760c09c7f1b42ae5649ac0d9/21354850de5927b6-33/s250x400/5a8acb1101bd6bc3fd9cc32a1113d64e6d0ace41.jpg",
					"player_map": "https://64.media.tumblr.com/c8faee82760c09c7f1b42ae5649ac0d9/21354850de5927b6-33/s2048x3072/8218678291880293d70e620230896d97307a882f.jpg",
					"title": "Neutral Party Maps 4",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/87fa250c60a576bfb9ca543b248d8226/04b5f57d73d4c17e-a6/s250x400/d89da679206e80304b63e907f4f25ab17782effb.jpg",
					"player_map": "https://64.media.tumblr.com/87fa250c60a576bfb9ca543b248d8226/04b5f57d73d4c17e-a6/s2048x3072/4e20aaaf3058235b69aa23f95a10aa0b5c064a0e.jpg",
					"title": "Neutral Party Maps 5",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/559db1ec3e1ca334196fbc0eb89e615f/f6c03d8f9a0fd500-99/s250x400/a5ae60b4b38ff3daae93b8a785bd11ae496aae2e.jpg",
					"player_map": "https://64.media.tumblr.com/559db1ec3e1ca334196fbc0eb89e615f/f6c03d8f9a0fd500-99/s2048x3072/57dfdba2dd09e9c1afc199b4a7a097844262913b.jpg",
					"title": "Neutral Party Maps 6",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/f825cb81ce4ad02defb28bbfa80462f3/aea42fffdc7096b5-84/s250x400/703cc6f3694d47a6fc988f9e8432a47b07fd367d.jpg",
					"vpps": 68.26666666666667,
					"title": "Neutral Party Maps 7 - Desert Ziggurat",
					"player_map": "https://64.media.tumblr.com/f825cb81ce4ad02defb28bbfa80462f3/aea42fffdc7096b5-84/s2048x3072/67a03001cbc50a0b68e3d939b641c1a158b1ba3e.jpg",
					"hpps": 68.26666666666667,
				},
				{
					"thumb": "https://64.media.tumblr.com/2f709b0d6fa4987fcd27da2cef3f87e7/0a5021170181330f-66/s250x400/61c8a28206c1d21144a6affc330b8d8ae9b0f339.jpg",
					"player_map": "https://64.media.tumblr.com/2f709b0d6fa4987fcd27da2cef3f87e7/0a5021170181330f-66/s2048x3072/b3ab8d952bade2a4db6d9e6eac9a90e00d9d3c72.jpg",
					"title": "Neutral Party Maps 8",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/4f6da4eff95ea505e9587092def0109b/677bae12f0710519-df/s250x400/08a5a19fe6a1794b210bf464da5e0858b385dc07.jpg",
					"player_map": "https://64.media.tumblr.com/4f6da4eff95ea505e9587092def0109b/677bae12f0710519-df/s2048x3072/b6fb01e4707249886fbe9ab55f36c96296484d9e.jpg",
					"title": "Neutral Party Maps 9",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/8f9b5467a1ad0edd0e9f6d4332af4891/5727cc2e2a9c1603-d7/s250x400/8bfebcd5ec04806323aeb0a66f91c0064b9ea77f.jpg",
					"player_map": "https://64.media.tumblr.com/8f9b5467a1ad0edd0e9f6d4332af4891/5727cc2e2a9c1603-d7/s2048x3072/73e4aa8863763b6d7aec8a1ab03e11371da66c47.jpg",
					"title": "Neutral Party Maps 10",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/49924191f0d46e9d9e9c8173b9fe93c5/4b7a2b0a7abdc5ea-bd/s250x400/eb7d3583f3be7e28e2d6df29bf16647f33660feb.jpg",
					"player_map": "https://64.media.tumblr.com/49924191f0d46e9d9e9c8173b9fe93c5/4b7a2b0a7abdc5ea-bd/s2048x3072/c38347d8e244a409eb5354d330c9fb572a1c58dd.jpg",
					"title": "Neutral Party Maps 11",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/948c85d1414d4b48bd1bd8dba9e41f88/41b0348daadae1ed-ed/s250x400/0eb93984c8414e89f2c43b535c1017c1a1161698.jpg",
					"player_map": "https://64.media.tumblr.com/948c85d1414d4b48bd1bd8dba9e41f88/41b0348daadae1ed-ed/s2048x3072/a7aff4dc85e3a9e67ba37e126782af84c892cadf.jpg",
					"title": "Neutral Party Maps 12",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/a0b4566b74524273d7244fe699796811/01c2def364cffe44-e7/s250x400/95ece0710abed897201e93e95bc30adc686f108b.jpg",
					"player_map": "https://64.media.tumblr.com/a0b4566b74524273d7244fe699796811/01c2def364cffe44-e7/s2048x3072/30c5193f01de243be69c2161c400dc967beee9c5.jpg",
					"title": "Neutral Party Maps 13",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/cf8b039e44a7539bee3cb1620f78517b/13e0eb29ea3b152d-4c/s250x400/afb9fefe99e5eac01cca3289805739a53b9dbf09.jpg",
					"player_map": "https://64.media.tumblr.com/cf8b039e44a7539bee3cb1620f78517b/13e0eb29ea3b152d-4c/s2048x3072/9b958a196900a4aac266088d3fc52ea65a8b269f.jpg",
					"title": "Neutral Party Maps 14",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/c4f2d1585f9a857ecf64b84720fd8cee/b09db5ced5909e3a-97/s250x400/6ef3857c19233a31b2adb051cf64c9dfd19ff5d9.jpg",
					"player_map": "https://64.media.tumblr.com/c4f2d1585f9a857ecf64b84720fd8cee/b09db5ced5909e3a-97/s2048x3072/1942876b7203901831797f1a99ea0fe9a0fb00cd.jpg",
					"title": "Neutral Party Maps 15",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/f7befa861af4f7dc61d29fb1e2431eb7/10fcb58e7e52864e-89/s250x400/893433004970d2f71bfa4a879c41d5aeb2058622.jpg",
					"vpps": 75,
					"title": "Neutral Party Maps 16 - Rocky Scrubland",
					"player_map": "https://64.media.tumblr.com/f7befa861af4f7dc61d29fb1e2431eb7/10fcb58e7e52864e-89/s2048x3072/b0cc61a650a9d278428ccd0fc16cf8c5ebb0c1e6.jpg",
					"hpps": 75,
					"conversion": 0.6
				},
				{
					"thumb": "https://64.media.tumblr.com/03e41b1bf15119a0445704ea67af3e85/b3ff174c7a2b705e-51/s250x400/7a46753273f59fc6455794b983b391a1afb5c5e7.jpg",
					"player_map": "https://64.media.tumblr.com/03e41b1bf15119a0445704ea67af3e85/b3ff174c7a2b705e-51/s2048x3072/68806a254036a7a5dcbd2b0463b8e7677762f408.jpg",
					"title": "Neutral Party Maps 17",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/fda960421f0f4e19141f70a797496577/cffe4a6e50db442a-ae/s250x400/c813371cbd8de9a4bbf29439f3f1b6a1d0003a54.jpg",
					"player_map": "https://64.media.tumblr.com/fda960421f0f4e19141f70a797496577/cffe4a6e50db442a-ae/s2048x3072/18cf8d820b07e69695e2314d31ea969606a8bf1d.jpg",
					"title": "Neutral Party Maps 18",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/957af15494cd2598de3cb66c2a39b690/a82e2390fbf10268-d3/s250x400/5b653f14e4bf1370dbb8b1d108fe2a383ca8aa8f.jpg",
					"player_map": "https://64.media.tumblr.com/957af15494cd2598de3cb66c2a39b690/a82e2390fbf10268-d3/s2048x3072/b5957cc5c1233373ade9fe43a29a6d6607274e11.jpg",
					"title": "Neutral Party Maps 19",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/65adf2f035faf2e189c0ad9aa1c5d76a/5d6aabc5c550557d-16/s250x400/ddf7caaa6d46b2dd7e3d1a0e20c49f98bc30a138.jpg",
					"player_map": "https://64.media.tumblr.com/65adf2f035faf2e189c0ad9aa1c5d76a/5d6aabc5c550557d-16/s2048x3072/ac184be7596241a253deb223134f78207e34db0b.jpg",
					"title": "Neutral Party Maps 20",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/cfed91f5e9246f35c5e1ab69d1cdd923/6f7544c766acae2b-b4/s250x400/6c1635a4eeaf85ce9bd6bd2b632d4b534071521c.jpg",
					"player_map": "https://64.media.tumblr.com/cfed91f5e9246f35c5e1ab69d1cdd923/6f7544c766acae2b-b4/s2048x3072/059fb617bd654835386c693410a5ccfbe483ce07.jpg",
					"title": "Neutral Party Maps 21",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/3c512ecec7aea09a93263816176849e5/6a7d514733166d93-d2/s250x400/a5f3c056b295634bd9cbc547eff42f6aee17f326.jpg",
					"vpps": 68.26666666666667,
					"title": "Neutral Party Maps 22 - Winding Alley",
					"player_map": "https://64.media.tumblr.com/3c512ecec7aea09a93263816176849e5/6a7d514733166d93-d2/s2048x3072/32a0e54e93de2dd48663deab3370887216cc55ee.jpg",
					"hpps": 68.26666666666667
				},
				{
					"thumb": "https://64.media.tumblr.com/0bf8ddee127817ddb8aa1081cd01f2e7/091f6c3842067a3f-44/s250x400/c029c1bd27d705f56baeaa5f6366e5d00ffeec87.jpg",
					"player_map": "https://64.media.tumblr.com/0bf8ddee127817ddb8aa1081cd01f2e7/091f6c3842067a3f-44/s2048x3072/c9b25221ba9693067bd7b4aea86477ee622b568b.jpg",
					"title": "Neutral Party Maps 23",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/df4798857dcac23a0e9c7727ba83b591/tumblr_pzmrc7X3qM1y548mzo1_400.jpg",
					"player_map": "https://64.media.tumblr.com/df4798857dcac23a0e9c7727ba83b591/tumblr_pzmrc7X3qM1y548mzo1_1280.jpg",
					"title": "Neutral Party Maps 24",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/8dcc44ec17ea759005cb9de8354f6b74/tumblr_pxh01gp0l11y548mzo1_400.jpg",
					"player_map": "https://64.media.tumblr.com/8dcc44ec17ea759005cb9de8354f6b74/tumblr_pxh01gp0l11y548mzo1_1280.jpg",
					"title": "Neutral Party Maps 25",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/3a709a0cdfa9a85642662f30c223fd08/3931dff7fb648503-be/s250x400/d5ba9f9f89edea66add9f0600badf43668ba53ac.jpg",
					"player_map": "https://64.media.tumblr.com/3a709a0cdfa9a85642662f30c223fd08/3931dff7fb648503-be/s2048x3072/f8a733e3489d7f47f92be6dcaaf9d536e355273a.jpg",
					"title": "Neutral Party Maps 26",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/bf6ba508ad56ccb9f9585988f9c817b4/tumblr_pynluuUvqD1y548mzo1_400.jpg",
					"player_map": "https://64.media.tumblr.com/bf6ba508ad56ccb9f9585988f9c817b4/tumblr_pynluuUvqD1y548mzo1_1280.jpg",
					"title": "Neutral Party Maps 27",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/4078388110f31a818591d7fa16c7d25c/c98f49c6dd11eba1-82/s250x400/4ee566ba07d9e4b7209cc028b934df19d7ba4d2a.jpg",
					"player_map": "https://64.media.tumblr.com/4078388110f31a818591d7fa16c7d25c/c98f49c6dd11eba1-82/s2048x3072/e624bcf0d78077a0be2a2077696b723900faccb3.jpg",
					"title": "Neutral Party Maps 28",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/3c5cda469bf51ace750dd1660f59e391/a8e2da07d9f7828e-83/s250x400/8b5296d4a21d9a2c4a9e20db9e6e8dca7acf0a1b.jpg",
					"player_map": "https://64.media.tumblr.com/3c5cda469bf51ace750dd1660f59e391/a8e2da07d9f7828e-83/s2048x3072/3c38537e5010b2ec759b0dfeb8e95e3df759670e.jpg",
					"title": "Neutral Party Maps 29",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/5614391bdd55017d1023ea1ab1ccab3a/tumblr_ptiav8t6gI1y548mzo1_400.jpg",
					"player_map": "https://64.media.tumblr.com/5614391bdd55017d1023ea1ab1ccab3a/tumblr_ptiav8t6gI1y548mzo1_1280.jpg",
					"title": "Neutral Party Maps 30",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/f75dfb02f5b1ea9faac4ae95456e5bc2/tumblr_pvmo4i6npv1y548mzo1_400.jpg",
					"vpps": 42.78,
					"title": "Neutral Party Maps 31 - Big City Dock",
					"player_map": "https://64.media.tumblr.com/f75dfb02f5b1ea9faac4ae95456e5bc2/tumblr_pvmo4i6npv1y548mzo1_1280.jpg",
					"scale_factor": 2,
					"hpps": 42.666666666666664,
				},
				{
					"thumb": "https://64.media.tumblr.com/d40c1ed4cea7057a5028ec83dbf42bc6/94a6bd2bfca6f0c5-32/s250x400/258d601281cece3f76e663e490bc6661e51b6be3.jpg",
					"player_map": "https://64.media.tumblr.com/d40c1ed4cea7057a5028ec83dbf42bc6/94a6bd2bfca6f0c5-32/s2048x3072/c8d7f85953cc5eba53ad0f0315743b8ca2da1665.jpg",
					"title": "Neutral Party Maps 32",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/e0055eefd4a40caf08d9a2f52627febf/tumblr_pnjrichRf91y548mzo1_400.jpg",
					"vpps": 42.666666666666664,
					"title": "Neutral Party Maps 33 - Desert Ruins",
					"player_map": "https://64.media.tumblr.com/e0055eefd4a40caf08d9a2f52627febf/tumblr_pnjrichRf91y548mzo1_1280.jpg",
					"scale_factor": 2,
					"hpps": 42.666666666666664
				},
				{
					"thumb": "https://64.media.tumblr.com/5134a073793a48fe654c44b2fadd53de/tumblr_pwup11Tp0D1y548mzo1_400.jpg",
					"player_map": "https://64.media.tumblr.com/5134a073793a48fe654c44b2fadd53de/tumblr_pwup11Tp0D1y548mzo1_1280.jpg",
					"title": "Neutral Party Maps 34",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/825124207d8a33c856314c2e5cbae2a4/tumblr_pvbd5qFYcg1y548mzo1_400.jpg",
					"player_map": "https://64.media.tumblr.com/825124207d8a33c856314c2e5cbae2a4/tumblr_pvbd5qFYcg1y548mzo1_1280.jpg",
					"title": "Neutral Party Maps 35",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/eb76d33e36f9d3852fd469ef552dd7d0/tumblr_prch88yxSl1y548mzo1_400.jpg",
					"player_map": "https://64.media.tumblr.com/eb76d33e36f9d3852fd469ef552dd7d0/tumblr_prch88yxSl1y548mzo1_1280.jpg",
					"title": "Neutral Party Maps 36",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/a0e50a205b1f1c25be79287d107dc168/6dba377dc50f8f46-59/s250x400/71b5d2f92c5ca050ba0d72343bb099b0681c5338.jpg",
					"player_map": "https://64.media.tumblr.com/a0e50a205b1f1c25be79287d107dc168/6dba377dc50f8f46-59/s2048x3072/9617c5ef81ac3877906cfb9288807f951542a6c6.jpg",
					"title": "Neutral Party Maps 37",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/21fccbf1c91bc135aac715834e1a803c/0b4fd6dc649828ab-53/s250x400/45da9fae250bb2cfe10cd3919e7f5924ab6d40fe.jpg",
					"player_map": "https://64.media.tumblr.com/21fccbf1c91bc135aac715834e1a803c/0b4fd6dc649828ab-53/s2048x3072/683f0b6c7858eb0a700232693502288520e6227a.jpg",
					"title": "Neutral Party Maps 38",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/b6d2f1e51ff464a055336d24ab6348e9/f4a532f419ac58e2-15/s250x400/80c963e5c18ba8493070a65b9045c74582c69d2e.jpg",
					"player_map": "https://64.media.tumblr.com/b6d2f1e51ff464a055336d24ab6348e9/f4a532f419ac58e2-15/s2048x3072/8c11bb4d1ee707c41dcf21a1bfc7f5648f5358af.jpg",
					"title": "Neutral Party Maps 39",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/4fe4784dceac46ac166eacb7934becb9/c73e8c408bf54984-e5/s250x400/0def137d62e76eaee1b344dff3ea85f10bc645bb.jpg",
					"player_map": "https://64.media.tumblr.com/4fe4784dceac46ac166eacb7934becb9/c73e8c408bf54984-e5/s2048x3072/3245be14a1a2a0f6a7c13110a78fce85052df616.jpg",
					"title": "Neutral Party Maps 40",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/63c7a1139948d933f6ceb9170a5d0372/tumblr_pywvm1JIHy1y548mzo1_400.jpg",
					"player_map": "https://64.media.tumblr.com/63c7a1139948d933f6ceb9170a5d0372/tumblr_pywvm1JIHy1y548mzo1_1280.jpg",
					"title": "Neutral Party Maps 41",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/5dca2006544c8c54bd522e51e3df4daf/5da416e6cbf66771-ba/s250x400/8b5dd8305c0d82185e163ce76f3ec9ecf4ba0568.jpg",
					"player_map": "https://64.media.tumblr.com/5dca2006544c8c54bd522e51e3df4daf/5da416e6cbf66771-ba/s2048x3072/a7b595f40e6d92d91b35d9381298b1d50a90289c.jpg",
					"title": "Neutral Party Maps 42",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/da95044ee5fac8a790834a9d3485e164/tumblr_pnjrknzXDG1y548mzo1_400.jpg",
					"player_map": "https://64.media.tumblr.com/da95044ee5fac8a790834a9d3485e164/tumblr_pnjrknzXDG1y548mzo1_1280.jpg",
					"title": "Neutral Party Maps 43",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/4c9be3f4f91d1bd4f2826f58eee5c0fd/tumblr_prpi9yQNi21y548mzo1_400.jpg",
					"player_map": "https://64.media.tumblr.com/4c9be3f4f91d1bd4f2826f58eee5c0fd/tumblr_prpi9yQNi21y548mzo1_1280.jpg",
					"title": "Neutral Party Maps 44",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/4d47a4b96cb0d55c645b9a8c1a050865/64ecd0be6fbb32c3-b3/s250x400/6066fde30d582b35233bb1e00f1826230ed3a2f3.jpg",
					"player_map": "https://64.media.tumblr.com/4d47a4b96cb0d55c645b9a8c1a050865/64ecd0be6fbb32c3-b3/s2048x3072/2e1c63db2b834215d25f8b312512a1206082f978.jpg",
					"title": "Neutral Party Maps 45",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/3562659f3185108cdaa84eab99b84bb4/tumblr_pqxp9wCWIo1y548mzo1_400.jpg",
					"player_map": "https://64.media.tumblr.com/3562659f3185108cdaa84eab99b84bb4/tumblr_pqxp9wCWIo1y548mzo1_1280.jpg",
					"title": "Neutral Party Maps 46",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/5b471ed2c7919f068bfc44399ed48dac/tumblr_pq9mxrXs7s1y548mzo1_400.jpg",
					"player_map": "https://64.media.tumblr.com/5b471ed2c7919f068bfc44399ed48dac/tumblr_pq9mxrXs7s1y548mzo1_1280.jpg",
					"title": "Neutral Party Maps 47",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/b583fbc090be1da5112c4256d52a0817/0789c9587b764704-66/s250x400/39f55270aca1dc2045ae87c19c7df992f8bf3cde.jpg",
					"player_map": "https://64.media.tumblr.com/b583fbc090be1da5112c4256d52a0817/0789c9587b764704-66/s2048x3072/2da54edfb3ba27b9adc3fc47e23a5787ca846dfa.jpg",
					"title": "Neutral Party Maps 48",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/9a4a2a5f19598d8f2759bc36fd6d17d8/tumblr_pwqylfZkVq1y548mzo1_400.jpg",
					"vpps": 51.2,
					"title": "Neutral Party Maps 49 - Rocky Switchbacks",
					"player_map": "https://64.media.tumblr.com/9a4a2a5f19598d8f2759bc36fd6d17d8/tumblr_pwqylfZkVq1y548mzo1_1280.jpg",
					"scale_factor": 2,
					"hpps": 51.2
				},
				{
					"thumb": "https://64.media.tumblr.com/23af9de9511e0339190894006f008570/tumblr_pt3f0qpiPK1y548mzo1_400.jpg",
					"player_map": "https://64.media.tumblr.com/23af9de9511e0339190894006f008570/tumblr_pt3f0qpiPK1y548mzo1_1280.jpg",
					"title": "Neutral Party Maps 50",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/c311011289df8b36f1b0a1695d17712a/tumblr_ppwkfgVHzu1y548mzo1_400.jpg",
					"player_map": "https://64.media.tumblr.com/c311011289df8b36f1b0a1695d17712a/tumblr_ppwkfgVHzu1y548mzo1_1280.jpg",
					"title": "Neutral Party Maps 51",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/d6e4af4f21b76257380880a859c3316f/a8cb2e151dbc430c-e9/s250x400/ed8ed19201a52994a8dfc2681622a10302690044.jpg",
					"player_map": "https://64.media.tumblr.com/d6e4af4f21b76257380880a859c3316f/a8cb2e151dbc430c-e9/s2048x3072/8ec644f77276502f6780ab4341c02e57bad7896c.jpg",
					"title": "Neutral Party Maps 52",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/7ae621a0cdc372d9e1a37c23cea8a490/tumblr_puy8lhbTCH1y548mzo1_400.jpg",
					"player_map": "https://64.media.tumblr.com/7ae621a0cdc372d9e1a37c23cea8a490/tumblr_puy8lhbTCH1y548mzo1_1280.jpg",
					"title": "Neutral Party Maps 53",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/60ff197f41fb8002e61f78b22c5d3800/tumblr_pobh7yhF3s1y548mzo1_400.jpg",
					"player_map": "https://64.media.tumblr.com/60ff197f41fb8002e61f78b22c5d3800/tumblr_pobh7yhF3s1y548mzo1_1280.jpg",
					"title": "Neutral Party Maps 54",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/3062a0181d888d39dfdadd62454a25e8/tumblr_pssc1tKy7H1y548mzo1_400.jpg",
					"player_map": "https://64.media.tumblr.com/3062a0181d888d39dfdadd62454a25e8/tumblr_pssc1tKy7H1y548mzo1_1280.jpg",
					"title": "Neutral Party Maps 55",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/d4a62de7a28759bb8eaedacb5f7c288f/5e1c47ae9c7de26b-bf/s250x400/f76721516cb29161c7c73b5d6698a5cd62c57922.jpg",
					"player_map": "https://64.media.tumblr.com/d4a62de7a28759bb8eaedacb5f7c288f/5e1c47ae9c7de26b-bf/s2048x3072/ff41afd29e2405cdaeb52838985c607c1e777ae7.jpg",
					"title": "Neutral Party Maps 56",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/83fdf3c00676d3ce541ae65376aa6558/tumblr_pp6rt2b5lv1y548mzo1_400.jpg",
					"player_map": "https://64.media.tumblr.com/83fdf3c00676d3ce541ae65376aa6558/tumblr_pp6rt2b5lv1y548mzo1_1280.jpg",
					"title": "Neutral Party Maps 57",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/3503d201c2797b61328ec30f3710d3d5/tumblr_plc0lbJ7j41y548mzo1_400.jpg",
					"vpps": 45.666666666666664,
					"title": "Neutral Party 58 - Wooded Ravine",
					"player_map": "https://64.media.tumblr.com/3503d201c2797b61328ec30f3710d3d5/tumblr_plc0lbJ7j41y548mzo1_1280.jpg",
					"scale_factor": 2,
					"offsetx": 0.6666666666666998,
					"offsety": 1.3333333333333783,
					"hpps": 45.666666666666664,
				},
				{
					"thumb": "https://64.media.tumblr.com/80deef7c0f2da76463e0916d33b999e7/tumblr_pohb06iJK01y548mzo1_400.jpg",
					"player_map": "https://64.media.tumblr.com/80deef7c0f2da76463e0916d33b999e7/tumblr_pohb06iJK01y548mzo1_1280.jpg",
					"title": "Neutral Party Maps 59",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/eefae6d6642866528320e65d52172a9a/tumblr_plc65ldBTR1y548mzo1_400.jpg",
					"player_map": "https://64.media.tumblr.com/eefae6d6642866528320e65d52172a9a/tumblr_plc65ldBTR1y548mzo1_1280.jpg",
					"title": "Neutral Party Maps 60",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/f578b25abebcf72a96f9f6ca385d1aef/tumblr_plc4zrbisI1y548mzo1_400.jpg",
					"player_map": "https://64.media.tumblr.com/f578b25abebcf72a96f9f6ca385d1aef/tumblr_plc4zrbisI1y548mzo1_1280.jpg",
					"title": "Neutral Party Maps 61",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/6101a74273726c3dd37ed6bbd0837456/tumblr_plc2i6iKHB1y548mzo1_400.jpg",
					"player_map": "https://64.media.tumblr.com/6101a74273726c3dd37ed6bbd0837456/tumblr_plc2i6iKHB1y548mzo1_1280.jpg",
					"title": "Neutral Party Maps 62",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/ee6361548ac004095c1ebfac2dac8a41/tumblr_plc5j77M3h1y548mzo1_400.jpg",
					"player_map": "https://64.media.tumblr.com/ee6361548ac004095c1ebfac2dac8a41/tumblr_plc5j77M3h1y548mzo1_1280.jpg",
					"title": "Neutral Party Maps 63",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/8d2c9331aaa10640119abbd9e7510e79/tumblr_plc225b7XT1y548mzo1_400.jpg",
					"player_map": "https://64.media.tumblr.com/8d2c9331aaa10640119abbd9e7510e79/tumblr_plc225b7XT1y548mzo1_1280.jpg",
					"title": "Neutral Party Maps 64",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/0461f79b5ee2649c0fd784cf2fe45396/tumblr_plc59uE19K1y548mzo1_400.jpg",
					"player_map": "https://64.media.tumblr.com/0461f79b5ee2649c0fd784cf2fe45396/tumblr_plc59uE19K1y548mzo1_1280.jpg",
					"title": "Neutral Party Maps 65",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/70e3a3a28605a18874e149814f687dbf/tumblr_plc1k2aOt01y548mzo1_400.jpg",
					"player_map": "https://64.media.tumblr.com/70e3a3a28605a18874e149814f687dbf/tumblr_plc1k2aOt01y548mzo1_1280.jpg",
					"title": "Neutral Party Maps 66",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/6664877fdbab8ef8f9477eb3ac3c24cf/tumblr_plc15atdEw1y548mzo1_400.jpg",
					"player_map": "https://64.media.tumblr.com/6664877fdbab8ef8f9477eb3ac3c24cf/tumblr_plc15atdEw1y548mzo1_1280.jpg",
					"title": "Neutral Party Maps 67",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/ee94a5f811137616259c1e5debb9bcd1/tumblr_plc5fbIy9U1y548mzo1_400.jpg",
					"player_map": "https://64.media.tumblr.com/ee94a5f811137616259c1e5debb9bcd1/tumblr_plc5fbIy9U1y548mzo1_1280.jpg",
					"title": "Neutral Party Maps 68",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/1efece3bdf78d5753f7e48beefadebfa/tumblr_plc2od403K1y548mzo1_400.jpg",
					"player_map": "https://64.media.tumblr.com/1efece3bdf78d5753f7e48beefadebfa/tumblr_plc2od403K1y548mzo1_1280.jpg",
					"title": "Neutral Party Maps 69",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/b6da20a4ae43fc44a28b86cc59f5d9c8/tumblr_px4027AFbz1y548mzo1_400.jpg",
					"vpps": 42.666666666666664,
					"title": "Neutral Party Maps 70 - Desert Canyon Falls",
					"player_map": "https://64.media.tumblr.com/b6da20a4ae43fc44a28b86cc59f5d9c8/tumblr_px4027AFbz1y548mzo1_1280.jpg",
					"scale_factor": 2,
					"hpps": 42.666666666666664,
				},
				{
					"thumb": "https://64.media.tumblr.com/4ebfeda9f885fcae76c4fd9e016211eb/tumblr_pnjrfzxV4l1y548mzo1_400.jpg",
					"player_map": "https://64.media.tumblr.com/4ebfeda9f885fcae76c4fd9e016211eb/tumblr_pnjrfzxV4l1y548mzo1_1280.jpg",
					"title": "Neutral Party Maps 71",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/c3e95f79ac8cdaab351e220d568886bc/tumblr_plc1cvOW2e1y548mzo1_400.jpg",
					"player_map": "https://64.media.tumblr.com/c3e95f79ac8cdaab351e220d568886bc/tumblr_plc1cvOW2e1y548mzo1_1280.jpg",
					"title": "Neutral Party Maps 72",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/3a5d373926b4de84fa0f4b0731385a2c/41f7f32787f3e897-89/s250x400/83e7a06cc75eaac0d36542139a40934870aa9aa8.jpg",
					"player_map": "https://64.media.tumblr.com/3a5d373926b4de84fa0f4b0731385a2c/41f7f32787f3e897-89/s2048x3072/b3f34ba0ae25e86b6323be2bcf48c2482636e99a.jpg",
					"title": "Neutral Party Maps 73",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/6935cfb8fddb37efdcccfbca55cbee07/tumblr_pnjrd9JPxa1y548mzo1_400.jpg",
					"player_map": "https://64.media.tumblr.com/6935cfb8fddb37efdcccfbca55cbee07/tumblr_pnjrd9JPxa1y548mzo1_1280.jpg",
					"title": "Neutral Party Maps 74",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/4e8145591b9ab99a11adcf102685905c/tumblr_plc2d2lv3t1y548mzo1_400.jpg",
					"player_map": "https://64.media.tumblr.com/4e8145591b9ab99a11adcf102685905c/tumblr_plc2d2lv3t1y548mzo1_1280.jpg",
					"title": "Neutral Party Maps 75",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/9ce8a33cba332d6f4f5d8df0828ce1d7/tumblr_plc2ystMki1y548mzo1_400.jpg",
					"player_map": "https://64.media.tumblr.com/9ce8a33cba332d6f4f5d8df0828ce1d7/tumblr_plc2ystMki1y548mzo1_1280.jpg",
					"title": "Neutral Party Maps 76",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/9880bcd03e4ab765e1d6e02c5f1d9b8d/tumblr_pljku3azfK1y548mzo1_400.jpg",
					"player_map": "https://64.media.tumblr.com/9880bcd03e4ab765e1d6e02c5f1d9b8d/tumblr_pljku3azfK1y548mzo1_1280.jpg",
					"title": "Neutral Party Maps 77",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/4d7232f3dd50b92cf1e6a1ba2b48ed87/tumblr_plc603n5aV1y548mzo1_400.jpg",
					"player_map": "https://64.media.tumblr.com/4d7232f3dd50b92cf1e6a1ba2b48ed87/tumblr_plc603n5aV1y548mzo1_1280.jpg",
					"title": "Neutral Party Maps 78",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/196e16d3ff91703b08f560e17dc81ceb/tumblr_pm2eebB7221y548mzo1_400.jpg",
					"vpps": 45.72727272727273,
					"title": "Neutral Party Maps 79 - Desert Crypt",
					"player_map": "https://64.media.tumblr.com/196e16d3ff91703b08f560e17dc81ceb/tumblr_pm2eebB7221y548mzo1_1280.jpg",
					"scale_factor": 2,
					"hpps": 45.714285714285715,
				},
				{
					"thumb": "https://64.media.tumblr.com/fe8806b7fcb5da54bbffd6a8f4dcdea9/tumblr_pqmkynsHGW1y548mzo1_400.jpg",
					"player_map": "https://64.media.tumblr.com/fe8806b7fcb5da54bbffd6a8f4dcdea9/tumblr_pqmkynsHGW1y548mzo1_1280.jpg",
					"title": "Neutral Party Maps 80",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/b254bf6effb8ab0b2b6bf84a366782f3/tumblr_plc5rsEg8F1y548mzo1_400.jpg",
					"vpps": 36.57142857142857,
					"title": "Neutral Party Maps 81 - Desert Chasm",
					"player_map": "https://64.media.tumblr.com/b254bf6effb8ab0b2b6bf84a366782f3/tumblr_plc5rsEg8F1y548mzo1_1280.jpg",
					"scale_factor": 2,
					"hpps": 36.57142857142857
				},
				{
					"thumb": "https://64.media.tumblr.com/9e2c2bfe0724db3bcb673b70cec4fbac/tumblr_plc5vj5nRd1y548mzo1_400.jpg",
					"player_map": "https://64.media.tumblr.com/9e2c2bfe0724db3bcb673b70cec4fbac/tumblr_plc5vj5nRd1y548mzo1_1280.jpg",
					"title": "Neutral Party Maps 82",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/a7f1e1b42b4060db3fc4d22532b2cdd5/tumblr_plc565xEZe1y548mzo1_400.jpg",
					"player_map": "https://64.media.tumblr.com/a7f1e1b42b4060db3fc4d22532b2cdd5/tumblr_plc565xEZe1y548mzo1_1280.jpg",
					"title": "Neutral Party Maps 83",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/956514e9897304f870307a69ae7f56ea/tumblr_plc1s0x7HN1y548mzo1_400.jpg",
					"player_map": "https://64.media.tumblr.com/956514e9897304f870307a69ae7f56ea/tumblr_plc1s0x7HN1y548mzo1_1280.jpg",
					"title": "Neutral Party Maps 84",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/fe3204200584e51c4cb126eb67bcdd09/tumblr_po8094iNaF1y548mzo1_400.jpg",
					"player_map": "https://64.media.tumblr.com/fe3204200584e51c4cb126eb67bcdd09/tumblr_po8094iNaF1y548mzo1_1280.jpg",
					"title": "Neutral Party Maps 85",
					"scale": 100,
					"dm_map": ""
				},
			]
		},
		{
			"title": "DiceGrimorium",
			"logo": "https://dicegrimorium.com/wp-content/uploads/2019/07/logofooter.png",
			"scenes": [
				{
					"thumb": "https://64.media.tumblr.com/ccb08c78812f5efc42198b4107188b39/f725e8edd4f055aa-1d/s250x400/f7ed4351220e3b613ae53ce9f6bc26022a5c0b53.jpg",
					"player_map": "https://64.media.tumblr.com/ccb08c78812f5efc42198b4107188b39/f725e8edd4f055aa-1d/s2048x3072/43d7ae81a15a718b5251290466f76c8c5816dc21.jpg",
					"title": "DiceGrimorium 0",
					"scale": 100,
					"dm_map": "",
					snap: "1",
					hpps: "72",
					vpps: "72",
					fpqs: "5",
					offsetx: "0",
					offsety: "0",
					grid_subdivided: "0",
				},
				{
					"thumb": "https://64.media.tumblr.com/d823a4d20f4327f40e7257685e0dfb7f/85e0f5d402580656-ce/s250x400/7d8b427be7f224ea8137b332e85d9d9bc8b39613.jpg",
					"player_map": "https://64.media.tumblr.com/d823a4d20f4327f40e7257685e0dfb7f/85e0f5d402580656-ce/s2048x3072/4f5d9f0f75f4fff51e2d09ec6d8f1d504e737cfc.jpg",
					"title": "DiceGrimorium 1",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/7467733866ea9bab0b485ecca6bfa4c8/ce3dddb5232d9a94-a5/s250x400/66fe785446073f41f741793a334c01dce7deb9fa.jpg",
					"player_map": "https://64.media.tumblr.com/7467733866ea9bab0b485ecca6bfa4c8/ce3dddb5232d9a94-a5/s2048x3072/c025fcb938254964253320b1a350d68dfd2c4307.jpg",
					"title": "DiceGrimorium 2",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/8509fce5324b3b244b6df2f90bb1374f/2eb1e782de5e1e85-43/s250x400/3907339838008fe30936c69d7ebc59ed3c70d59e.jpg",
					"player_map": "https://64.media.tumblr.com/8509fce5324b3b244b6df2f90bb1374f/2eb1e782de5e1e85-43/s2048x3072/ecc37a988dd3b4b82babb3dedd4f55424b172b3b.jpg",
					"title": "DiceGrimorium 3",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/a85778eab93477fac218b590bbceeb1b/f9ca59e211d1354a-73/s250x400/98b21b4a271de4415167f7793f14c3b513ca3498.jpg",
					"player_map": "https://64.media.tumblr.com/a85778eab93477fac218b590bbceeb1b/f9ca59e211d1354a-73/s2048x3072/530bd09691fdc4b869e3a22acad9dacd4695968a.jpg",
					"title": "DiceGrimorium 4",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/a8b3741ad738b0c4132eb958bb0eb6c1/826bb1ccc91c29ac-78/s250x400/62294f0c767ee489c593cac381eeb2e31d61b2ca.jpg",
					"player_map": "https://64.media.tumblr.com/a8b3741ad738b0c4132eb958bb0eb6c1/826bb1ccc91c29ac-78/s2048x3072/c8d96fb9df95ef7e5c474af51172ade1e4d28a91.jpg",
					"title": "DiceGrimorium 5",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/92869637a98cdd534f1c1f0ed9541916/a92ef7baa5a00931-05/s250x400/b0441137351349dccb1cca823b51d0d3c6ec6d0f.jpg",
					"player_map": "https://64.media.tumblr.com/92869637a98cdd534f1c1f0ed9541916/a92ef7baa5a00931-05/s2048x3072/4c9dd51e8039760905854636e8096054718ebe3a.jpg",
					"title": "DiceGrimorium 6",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/ace2490dedfe5750fcc4aba7a7c8c835/5b7b802c2793dd17-f0/s250x400/2ea2119247c60ff014b1b558a9cc64c3febaf808.jpg",
					"player_map": "https://64.media.tumblr.com/ace2490dedfe5750fcc4aba7a7c8c835/5b7b802c2793dd17-f0/s2048x3072/2c2bb712c25405f22b466ebafa5208a06a9bd14a.jpg",
					"title": "DiceGrimorium 7",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/b0fb84f6fb46d9d747594ea0acfc2af1/5afa3b66147da92e-f7/s250x400/9325e432083f5c48d8ef47847b6fa72cccc99200.jpg",
					"player_map": "https://64.media.tumblr.com/b0fb84f6fb46d9d747594ea0acfc2af1/5afa3b66147da92e-f7/s2048x3072/a74395efcd787c5b97be103de4c20889c805da8e.jpg",
					"title": "DiceGrimorium 8",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/ff6a6c630601d636ac8cbc07a1073838/09870660a730896b-55/s250x400/b9fa6cbcfcdb9d065d5d8291a3ce0be3ca347eb2.jpg",
					"player_map": "https://64.media.tumblr.com/ff6a6c630601d636ac8cbc07a1073838/09870660a730896b-55/s2048x3072/27a4c12dd197919e613597155c8b5074d66a6570.jpg",
					"title": "DiceGrimorium 9",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/2df5b180a1c67b5f9e64e18f4984b065/f095bb13880f5c7c-7c/s250x400/ff1088ee5f5f99ecb5b059bb3e7d3f046d048f93.jpg",
					"player_map": "https://64.media.tumblr.com/2df5b180a1c67b5f9e64e18f4984b065/f095bb13880f5c7c-7c/s2048x3072/6e22f54cb94f5905580dd4ee6f29b85640b73823.jpg",
					"title": "DiceGrimorium 10",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/f2c6d7cf6836b5177a2ad5f7a39d1c92/e65d547988a558ef-36/s250x400/28dbeff976602693d9ef60a50637e35de7430c4e.jpg",
					"player_map": "https://64.media.tumblr.com/f2c6d7cf6836b5177a2ad5f7a39d1c92/e65d547988a558ef-36/s2048x3072/cb23bf096eb1969497464d1c6b8c338e6497f2d9.jpg",
					"title": "DiceGrimorium 11",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/b549acb2bca119dc925a3a20a8b38c7a/c7671ceff2ce711a-ea/s250x400/0fe64a316f10001eafd454795c725c36bfcdc7a4.jpg",
					"player_map": "https://64.media.tumblr.com/b549acb2bca119dc925a3a20a8b38c7a/c7671ceff2ce711a-ea/s2048x3072/1fd9fa935f0f4a6ed1d970a66a6cb724035b634f.jpg",
					"title": "DiceGrimorium 12",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/9f682b9c26c7d49ef20782ae9efd1619/d2c68a5dbbf87d83-9b/s250x400/c76367dfb733048bbd31c1f66ede6d9c5eaff33d.jpg",
					"player_map": "https://64.media.tumblr.com/9f682b9c26c7d49ef20782ae9efd1619/d2c68a5dbbf87d83-9b/s2048x3072/fb1e537ccb2e6d97507eed4fabf078386bbcec71.jpg",
					"title": "DiceGrimorium 13",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/0432a530d197e36bb975883a0925cc6d/104d36eff47a2cac-3a/s250x400/ed83eb019c677827a9a9ee2dbe711e0d80aa8b37.jpg",
					"player_map": "https://64.media.tumblr.com/0432a530d197e36bb975883a0925cc6d/104d36eff47a2cac-3a/s2048x3072/c05ba100237a19766b02a647985f5e8535c2cddf.jpg",
					"title": "DiceGrimorium 14",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/de1ab021543af09be6341644af0c0888/4c8fad1db30a17fc-1c/s250x400/b20ba26f8ebb05289d1682fcecacea0184737606.jpg",
					"player_map": "https://64.media.tumblr.com/de1ab021543af09be6341644af0c0888/4c8fad1db30a17fc-1c/s2048x3072/fd6d69b7fc1a4f2db84346e0b4f6613b73071402.jpg",
					"title": "DiceGrimorium 15",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/f60dc210a8e61a669417c2381741f894/4730b8bebbc349e6-9a/s250x400/a55f25ee6bd71048430cdf7a6903fa5304159264.jpg",
					"player_map": "https://64.media.tumblr.com/f60dc210a8e61a669417c2381741f894/4730b8bebbc349e6-9a/s2048x3072/7669872029abbc20c9c5fa2df6873ce0e2766632.jpg",
					"title": "DiceGrimorium 16",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/722f5661bdd926ae07a69c5e31911727/15d99998253150ea-3d/s250x400/8bc52abc44d69af48e17be6c0b66e8498ffb30a5.jpg",
					"player_map": "https://64.media.tumblr.com/722f5661bdd926ae07a69c5e31911727/15d99998253150ea-3d/s2048x3072/a1e91f70043c91f06d31e9f48e0f2d4b49d4a471.jpg",
					"title": "DiceGrimorium 17",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/2ef13f34f6f0333005a8241c7c1368e3/10afa0e1e5f0f392-bb/s250x400/e10e8eb5704aacb7f9d20dde389c3ceb339f1dc8.jpg",
					"player_map": "https://64.media.tumblr.com/2ef13f34f6f0333005a8241c7c1368e3/10afa0e1e5f0f392-bb/s2048x3072/7fccf6226488a5832fc256f2a6e5f3e653f0618b.jpg",
					"title": "DiceGrimorium 18",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/207c7cd4641a071fcf5872a7a132dcbd/3f93917fe872b05c-e5/s250x400/a555ed4c442f0234c4840f216969c6cc9cdd1631.jpg",
					"player_map": "https://64.media.tumblr.com/207c7cd4641a071fcf5872a7a132dcbd/3f93917fe872b05c-e5/s2048x3072/eb86291619a42d05887ba937c41bd0a3c2f846cb.jpg",
					"title": "DiceGrimorium 19",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/a7f7cea52251af285d3fbc89bcaca5ec/3cab80332d6eb1dc-65/s250x400/2b54a7c374d44e1d7ed5c7def4b663ff5fc95814.jpg",
					"player_map": "https://64.media.tumblr.com/a7f7cea52251af285d3fbc89bcaca5ec/3cab80332d6eb1dc-65/s2048x3072/bae78c4af42d177ebd17b40d6b85105c438564fd.jpg",
					"title": "DiceGrimorium 20",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/97e62f95e6a3d6a736d9075b493dd695/28d15530171e9bda-11/s250x400/36e0bfd3b2ec85c1d84e10c33a242ec9165b6421.jpg",
					"player_map": "https://64.media.tumblr.com/97e62f95e6a3d6a736d9075b493dd695/28d15530171e9bda-11/s2048x3072/05d36439e1d9ed3759e7daaa04afd58c6bcf4054.jpg",
					"title": "DiceGrimorium 21",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/3e4392a26d9462085df881db89a44609/d05872da106cec59-eb/s250x400/6e76f9df66c6198578d0671e1560672399c01f52.jpg",
					"player_map": "https://64.media.tumblr.com/3e4392a26d9462085df881db89a44609/d05872da106cec59-eb/s2048x3072/c2751ef677dd7e10b4e09b09428ece47b25af404.jpg",
					"title": "DiceGrimorium 22",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/c118df0efd3c72760fd177f0097791ef/97a3a4f03f3355cb-86/s250x400/ce55eab3f17160dacf23f64f83b315c28fdc7426.jpg",
					"player_map": "https://64.media.tumblr.com/c118df0efd3c72760fd177f0097791ef/97a3a4f03f3355cb-86/s2048x3072/6ff0f17a4cee463b8423875b1a37261bd5e53ca8.jpg",
					"title": "DiceGrimorium 23",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/e0f6eced7e6ad16d31605b0849e3ce34/fc5b5a8e4588c276-23/s250x400/9db2ee5f6d6aea49c4a1f8f0af6873a2a1f2effe.jpg",
					"player_map": "https://64.media.tumblr.com/e0f6eced7e6ad16d31605b0849e3ce34/fc5b5a8e4588c276-23/s2048x3072/129389ef40599950dfc2460b5a14549f4189492c.jpg",
					"title": "DiceGrimorium 24",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/6869a98900bfa159b16e7161b3a5892b/01193025b2b768ef-2e/s250x400/d9bf9fab82685f498e77a8d6a2f8ee3719f58402.jpg",
					"player_map": "https://64.media.tumblr.com/6869a98900bfa159b16e7161b3a5892b/01193025b2b768ef-2e/s2048x3072/80177fd87261f2caf80e24ee8b5d324308a6d0b7.jpg",
					"title": "DiceGrimorium 25",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/61d4b3a4450e88ce9be7011ffba28445/53267382bb25e285-99/s250x400/5f7030f0cf458fb92ad37219f106549d28c3ce92.jpg",
					"player_map": "https://64.media.tumblr.com/61d4b3a4450e88ce9be7011ffba28445/53267382bb25e285-99/s2048x3072/c8427e9663b9d9cb844e333088f73e90d1ed8a61.jpg",
					"title": "DiceGrimorium 26",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/c2285c2760957bff3d6695021d01980c/840a136033b21fc6-99/s250x400/0fcace9aaa0f686ccc52e5ac3a26934b6c9b0ad3.jpg",
					"player_map": "https://64.media.tumblr.com/c2285c2760957bff3d6695021d01980c/840a136033b21fc6-99/s2048x3072/5df23ba1a5d8ab10b2dd03b61c581d9df499b3a1.jpg",
					"title": "DiceGrimorium 27",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/1f1fa85d2239658f8ee85a5e00a61d04/cf7a461d47c6f7fe-05/s250x400/db51a82220439e99945280806c41357afa474cbb.jpg",
					"player_map": "https://64.media.tumblr.com/1f1fa85d2239658f8ee85a5e00a61d04/cf7a461d47c6f7fe-05/s2048x3072/c7c2871f7e164a6fae597d7f5d89003e5df19efa.jpg",
					"title": "DiceGrimorium 28",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/3f3169db203e3cf4cbe87b17d4f29ed3/542b462d50512151-bd/s250x400/1c9ce61528d81e5b879c1ea96fa79f3e1d101e86.jpg",
					"player_map": "https://64.media.tumblr.com/3f3169db203e3cf4cbe87b17d4f29ed3/542b462d50512151-bd/s2048x3072/c3f836a49809073d9020147a1023175edd709f36.jpg",
					"title": "DiceGrimorium 29",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/18b452e22e19e2fd890ef7c0c620f020/85dd7c549b360177-e2/s250x400/01842eb7b088055a690ff3cdfeb4c1841b80d9ea.jpg",
					"player_map": "https://64.media.tumblr.com/18b452e22e19e2fd890ef7c0c620f020/85dd7c549b360177-e2/s2048x3072/2260474d923b25ff847d8fdcb4ce19cdc4339fbe.jpg",
					"title": "DiceGrimorium 30",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/bb8a1acd62658dcd25e4d17294dc8209/627153aa4744cb6b-e0/s250x400/eb51815424595d38ab8a9023d0ef34d2ce9c32d6.jpg",
					"player_map": "https://64.media.tumblr.com/bb8a1acd62658dcd25e4d17294dc8209/627153aa4744cb6b-e0/s2048x3072/35f231ae2ffe692eb7c25a672d46c856efcfba2d.jpg",
					"title": "DiceGrimorium 31",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/a9eb87a2b470e1e855dec98eaf67308f/517019c54fbc8dfa-a0/s250x400/7a00fe74d20f9647cf60fd5e4bdb89c9468e5f3d.jpg",
					"player_map": "https://64.media.tumblr.com/a9eb87a2b470e1e855dec98eaf67308f/517019c54fbc8dfa-a0/s2048x3072/1696657c23b32fc9ee5e04c019248606b884ac9f.jpg",
					"title": "DiceGrimorium 32",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/f530099ceb369fb7923286949ae6fa77/c956a55f7b86e607-d8/s250x400/e8daaca7ee67537e2f8375535fdbc4bd9846a001.jpg",
					"player_map": "https://64.media.tumblr.com/f530099ceb369fb7923286949ae6fa77/c956a55f7b86e607-d8/s2048x3072/be312984374772b4fe738b2568c18d891dc9f4e3.jpg",
					"title": "DiceGrimorium 33",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/2dbc41d070b17663c436f87dc82d73a4/dd28dac5fc126d4a-2b/s250x400/4db99d43498026588e26651139c9f203f0970af6.jpg",
					"player_map": "https://64.media.tumblr.com/2dbc41d070b17663c436f87dc82d73a4/dd28dac5fc126d4a-2b/s2048x3072/38a9d9299c40db861eb53e401dddd2b60b09488d.jpg",
					"title": "DiceGrimorium 34",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/2d258e72988f77ef2e8b2141dc3ecd7b/7f0123ecfc708e69-45/s250x400/0f5363773232b037bef24098a4309e11d6fef306.jpg",
					"player_map": "https://64.media.tumblr.com/2d258e72988f77ef2e8b2141dc3ecd7b/7f0123ecfc708e69-45/s2048x3072/50af6e3cf1ffca83b05c2670d2ba82f48a6dce88.jpg",
					"title": "DiceGrimorium 35",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/c0079c4d8872ecfcb3f1443ab8cfbd0e/1fb9cfe8fd7e90e1-5b/s250x400/8f3c17f016881ab96d5aca28a1e87ffe2f8cac3b.jpg",
					"player_map": "https://64.media.tumblr.com/c0079c4d8872ecfcb3f1443ab8cfbd0e/1fb9cfe8fd7e90e1-5b/s2048x3072/6307a74a5b4b5a8e04108a4d8481426a7660a462.jpg",
					"title": "DiceGrimorium 36",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/382505e1e1e59840e73c21fa1e179d6d/7dc26201c0741eba-e3/s250x400/0d5f47117e13acb004754972064465477ea6c019.jpg",
					"player_map": "https://64.media.tumblr.com/382505e1e1e59840e73c21fa1e179d6d/7dc26201c0741eba-e3/s2048x3072/44b642c8d8793007e8ac5a4fd0b461513a3e9ff5.jpg",
					"title": "DiceGrimorium 37",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/236aebbbb113934a155ae76e3823aee5/de25c7de87b5d998-ab/s250x400/f6b8c204e1a79af3379a3583ab2d63a8cc81af0f.jpg",
					"player_map": "https://64.media.tumblr.com/236aebbbb113934a155ae76e3823aee5/de25c7de87b5d998-ab/s2048x3072/605489a3619ab076fe776265b320cbdc63818b1b.jpg",
					"title": "DiceGrimorium 38",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/6921ed1cf08f9f58fcb633cb0a741645/a55947438d626cbe-52/s250x400/d8f4775b4a77e29fb38a04fef60300e6a3f6047b.jpg",
					"player_map": "https://64.media.tumblr.com/6921ed1cf08f9f58fcb633cb0a741645/a55947438d626cbe-52/s2048x3072/fb3b4ce172838b6f94cfccdb1b4498f5eef778b5.jpg",
					"title": "DiceGrimorium 39",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/85ec24f1b84467acee147fb70a993c80/108fb0f8b85fde72-52/s250x400/4546e05380f52ffc3cd35d33e51555a17c0f31f1.jpg",
					"player_map": "https://64.media.tumblr.com/85ec24f1b84467acee147fb70a993c80/108fb0f8b85fde72-52/s2048x3072/bfcbda0c47a9dc2f089a4657b235cfcd23c47084.jpg",
					"title": "DiceGrimorium 40",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/7af7152a318756b16d4b872ddaa25f61/2517ce8adc0b8842-bd/s250x400/81dc9636fd3dac134405c1f36299dccfb29ddb6e.jpg",
					"player_map": "https://64.media.tumblr.com/7af7152a318756b16d4b872ddaa25f61/2517ce8adc0b8842-bd/s2048x3072/5828ff2e8b380f31861cfaae32d960ea65c70acb.jpg",
					"title": "DiceGrimorium 41",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/c59e9774547c7e131a6e8b116d12b690/74eaa43a6280b429-21/s250x400/c46e8c63ad6623793938a1c0455c225cadfc59c0.jpg",
					"player_map": "https://64.media.tumblr.com/c59e9774547c7e131a6e8b116d12b690/74eaa43a6280b429-21/s2048x3072/c5701eba48da57e7998cc0086b8e1d0f933d036e.jpg",
					"title": "DiceGrimorium 42",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/f6d88817e9487f7e90ee43eb9c11fae6/e25bf61f071e71d2-80/s250x400/49633d6ec47fd56ef9e46a688e0b8f44c8bfd600.jpg",
					"player_map": "https://64.media.tumblr.com/f6d88817e9487f7e90ee43eb9c11fae6/e25bf61f071e71d2-80/s2048x3072/01a0bd64d554442cd5e0a7a253958a08e2e7a87e.jpg",
					"title": "DiceGrimorium 43",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/dd6410e78918a1c045d9e84201bd734e/cf1d46cd8e98aac3-39/s250x400/07f704f514ceb205ae90a6fd3952103500ea1dc9.jpg",
					"player_map": "https://64.media.tumblr.com/dd6410e78918a1c045d9e84201bd734e/cf1d46cd8e98aac3-39/s2048x3072/bfbc63dee24aaf235f272ccee4340d5529fdb89d.jpg",
					"title": "DiceGrimorium 44",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/38aa8742d238734a1bc03d6d975aeff3/34b8ec1f1dfc74fe-bb/s250x400/02acbf7f5719fac673098324d349887b56a110f7.jpg",
					"player_map": "https://64.media.tumblr.com/38aa8742d238734a1bc03d6d975aeff3/34b8ec1f1dfc74fe-bb/s2048x3072/6aac8a8ba0b0377175ed5a51d87f33b977882115.jpg",
					"title": "DiceGrimorium 45",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/5e605c1be2ee32cd1643a256ab4c3e4d/3b3966528679d625-dc/s250x400/7c95b30f053df119c297e030583b6828a2f79c9a.jpg",
					"player_map": "https://64.media.tumblr.com/5e605c1be2ee32cd1643a256ab4c3e4d/3b3966528679d625-dc/s2048x3072/ab7c59f0122d22e811733e84bd8e7907ae6fa2d2.jpg",
					"title": "DiceGrimorium 46",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/48f33bbf38d9de48790058092cb797db/d93241a63e64b11f-14/s250x400/1a84be5d8d6cc2ab76b4a288a0b80d8c1b6dc394.jpg",
					"player_map": "https://64.media.tumblr.com/48f33bbf38d9de48790058092cb797db/d93241a63e64b11f-14/s2048x3072/e03551dbf13a8dcc14b842d861226d930735b182.jpg",
					"title": "DiceGrimorium 47",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/31994884698a19fbcb6741d4030049ec/0f7e753b499d17f9-ee/s250x400/921df412fbe72510cf3d4b25c1d6b2f44630f7fb.jpg",
					"player_map": "https://64.media.tumblr.com/31994884698a19fbcb6741d4030049ec/0f7e753b499d17f9-ee/s2048x3072/897cf132a6ac9068978ecd4d6e693b1ce0a77ae4.jpg",
					"title": "DiceGrimorium 48",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/7e7c28ff8e57207377c5444595a32abd/75a6cf2d103cf36d-17/s250x400/c6f4330bf8fb7444cdd0fd8572c2963fcde29d53.jpg",
					"player_map": "https://64.media.tumblr.com/7e7c28ff8e57207377c5444595a32abd/75a6cf2d103cf36d-17/s2048x3072/c04223e9ed22a8c4ad36926e552e391fbf86ba7a.jpg",
					"title": "DiceGrimorium 49",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/e190bd67ad8c1e5529d6bd6eb09bf2ee/88f53b5c76abd375-03/s250x400/61c2c694c0550a6c14498aec0ed322f7f5186712.jpg",
					"player_map": "https://64.media.tumblr.com/e190bd67ad8c1e5529d6bd6eb09bf2ee/88f53b5c76abd375-03/s2048x3072/155ede182e398bb9c3fcef27b41c3ba02810e782.jpg",
					"title": "DiceGrimorium 50",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/c9aa90126d3b8d210ead9fee4a53b5b7/81f5fb7ea11b64e9-0b/s250x400/d4c4c3ea9f2a36addcc2003b550578885dfdb275.jpg",
					"player_map": "https://64.media.tumblr.com/c9aa90126d3b8d210ead9fee4a53b5b7/81f5fb7ea11b64e9-0b/s2048x3072/d993e26d4e9e16cdb529715e51bdfd8351b93e89.jpg",
					"title": "DiceGrimorium 51",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/5f95812d19ae826b9878d167c119b756/9012fafcf4bf54d9-de/s250x400/9451823ce17988011f2174226e4db703e35f16b2.jpg",
					"player_map": "https://64.media.tumblr.com/5f95812d19ae826b9878d167c119b756/9012fafcf4bf54d9-de/s2048x3072/8ccfcb56e86e29829b16afc3cbcc1a105c716e48.jpg",
					"title": "DiceGrimorium 52",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/3dcdc8721b41f8353783e701c8225eac/4e1b07757d51fe08-c6/s250x400/31c6aec30df85a34bb38e5204887e8dd843a871b.jpg",
					"player_map": "https://64.media.tumblr.com/3dcdc8721b41f8353783e701c8225eac/4e1b07757d51fe08-c6/s2048x3072/c09d9aea980bf59ce641a1e446729e9df6a02545.jpg",
					"title": "DiceGrimorium 53",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/77def703c29fd416dac351acb320a473/ac4bfa6804a6ef6b-63/s250x400/c95156fb3ab525289d2bdcaf73b3e72e467eb753.jpg",
					"player_map": "https://64.media.tumblr.com/77def703c29fd416dac351acb320a473/ac4bfa6804a6ef6b-63/s2048x3072/2dec01f396486893db1b143ac4bdf643e5583d7c.jpg",
					"title": "DiceGrimorium 54",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/42bd2c4818e0947d8a8b8495ebee2512/f7ad5ee43e79b671-76/s250x400/50a9323eadc57c17b4459c2be73ff1371746991c.jpg",
					"player_map": "https://64.media.tumblr.com/42bd2c4818e0947d8a8b8495ebee2512/f7ad5ee43e79b671-76/s2048x3072/fb5d3d3f9a4e8c8397e4448b77d33b41197febb5.jpg",
					"title": "DiceGrimorium 55",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/dfd0943d64e18ba50cc77cfabbf8b2b7/0aa2d1adbd571f9a-ad/s250x400/6bcab26ad1b650c1930b037e0287696ba7d34192.jpg",
					"player_map": "https://64.media.tumblr.com/dfd0943d64e18ba50cc77cfabbf8b2b7/0aa2d1adbd571f9a-ad/s2048x3072/ecc4f721e14454f877b88730a5d244201eef72c7.jpg",
					"title": "DiceGrimorium 56",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/d3e10b9730836b0e054457859fed714e/9e6a1c2a863de29b-10/s250x400/60f46168f1e07991e5a498341fdd9c82ebbb531e.jpg",
					"player_map": "https://64.media.tumblr.com/d3e10b9730836b0e054457859fed714e/9e6a1c2a863de29b-10/s2048x3072/5ad8b9b62594e050479dab668602f0ac444031e7.jpg",
					"title": "DiceGrimorium 57",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/47762d496826aedec3a5fda07c888eb0/a3c0144017096bdd-4b/s250x400/5a3f059c90a85f1e9adc1d6613bcb295ab25d6b3.jpg",
					"player_map": "https://64.media.tumblr.com/47762d496826aedec3a5fda07c888eb0/a3c0144017096bdd-4b/s2048x3072/87360b1404af44c77ffbbf840af0f608c0c311ee.jpg",
					"title": "DiceGrimorium 58",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/0d02311614f8a32fd6b4e7703c9eb772/eea2088c32cd8348-a9/s250x400/c756fd478b81fc2e84e7c9d47ec1e1606792223d.jpg",
					"player_map": "https://64.media.tumblr.com/0d02311614f8a32fd6b4e7703c9eb772/eea2088c32cd8348-a9/s2048x3072/18c6850c0310327c3040ef22190cd7e55e60fce5.jpg",
					"title": "DiceGrimorium 59",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/ddb179c891885ce0da06ee461f46b209/76b67a7c7bee8331-fb/s250x400/42fb036f3cebb624fa20093c1c855133ca98259b.jpg",
					"player_map": "https://64.media.tumblr.com/ddb179c891885ce0da06ee461f46b209/76b67a7c7bee8331-fb/s2048x3072/f8f6063bf4a041cc11e065df1227d7358e691921.jpg",
					"title": "DiceGrimorium 60",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/de6251645b41bf0df8ae25896b5900b5/01fe489e9e8fabc7-c2/s250x400/9d69070a7b9aca4e535a774109336f9a39a040db.jpg",
					"player_map": "https://64.media.tumblr.com/de6251645b41bf0df8ae25896b5900b5/01fe489e9e8fabc7-c2/s2048x3072/7bdffa52dc765b939260b4f38e972aea2a5f70dd.jpg",
					"title": "DiceGrimorium 61",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/0f2d661670854430e0e1e7ba2a9e5588/9be932699c081344-f9/s250x400/66958cf4c7eb7891e67ada068c61818068cade99.jpg",
					"player_map": "https://64.media.tumblr.com/0f2d661670854430e0e1e7ba2a9e5588/9be932699c081344-f9/s2048x3072/edd40b3d5d45d9733249834c086431c82cb01915.jpg",
					"title": "DiceGrimorium 62",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/42a7775283b541dc282c1c3da94805b0/041e72fc485f7af6-64/s250x400/d78e4df35cdd8e3925ad51cda1c7b8fb4862c4b4.jpg",
					"player_map": "https://64.media.tumblr.com/42a7775283b541dc282c1c3da94805b0/041e72fc485f7af6-64/s2048x3072/05041f26d06c56415f10c950fa9ecddde4984fe5.jpg",
					"title": "DiceGrimorium 63",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/8ee968fd027c06d8a384fc0c7247dbc2/b0731c15a2f8e73f-0a/s250x400/58afae42a35e5d1bf5bbdbad50a6c5cb1e728566.jpg",
					"player_map": "https://64.media.tumblr.com/8ee968fd027c06d8a384fc0c7247dbc2/b0731c15a2f8e73f-0a/s2048x3072/eb413ad36f899c807c4b4bd8fbc5235e4ead794f.jpg",
					"title": "DiceGrimorium 64",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/7fc6cd5fdedf0842f5e9cd11656ea8c6/e81c17d813a1bb89-c5/s250x400/9b6d11b783f7e18e468e3d1938932165993da8e9.jpg",
					"player_map": "https://64.media.tumblr.com/7fc6cd5fdedf0842f5e9cd11656ea8c6/e81c17d813a1bb89-c5/s2048x3072/99dafbb209f57f28fe5a05776885ea9b28d3dacf.jpg",
					"title": "DiceGrimorium 65",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/68441af6b5558314944c4dd30dbe43d3/2991ef5eb3d1c68d-96/s250x400/d11a094c5d996558b351f169b5fb2f3595aa3bad.jpg",
					"player_map": "https://64.media.tumblr.com/68441af6b5558314944c4dd30dbe43d3/2991ef5eb3d1c68d-96/s2048x3072/4dd1464d34eb2f52fefd80cd1e5b23b6da64f19e.jpg",
					"title": "DiceGrimorium 66",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/17b778160b3c5512e8fc1382ae1d07c0/a48de58323c658e3-87/s250x400/0181d93b508daf65032f9fb00d46c2ddedb009e5.jpg",
					"player_map": "https://64.media.tumblr.com/17b778160b3c5512e8fc1382ae1d07c0/a48de58323c658e3-87/s2048x3072/76d2516a2c21da76613c88022aad41a40a380d22.jpg",
					"title": "DiceGrimorium 67",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/b1fc4796f76e7a68f0f7ca91e84f9ebe/tumblr_pxeth9nRJ31y74m69o1_400.jpg",
					"player_map": "https://64.media.tumblr.com/b1fc4796f76e7a68f0f7ca91e84f9ebe/tumblr_pxeth9nRJ31y74m69o1_1280.jpg",
					"title": "DiceGrimorium 68",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/a6f3fc451d834bc62138572edf351ec1/tumblr_pwljreOo3G1y74m69o1_400.jpg",
					"player_map": "https://64.media.tumblr.com/a6f3fc451d834bc62138572edf351ec1/tumblr_pwljreOo3G1y74m69o1_1280.jpg",
					"title": "DiceGrimorium 69",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/51782a6765621957f7e80d515c681ac2/tumblr_pxvjrn3r1p1y74m69o1_400.jpg",
					"player_map": "https://64.media.tumblr.com/51782a6765621957f7e80d515c681ac2/tumblr_pxvjrn3r1p1y74m69o1_1280.jpg",
					"title": "DiceGrimorium 70",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/5796b27809c31c15c80a1bf2608ede38/ebabfd4957c1e347-9c/s250x400/fad101c3f8138f62c114b325942d43b73e805731.jpg",
					"player_map": "https://64.media.tumblr.com/5796b27809c31c15c80a1bf2608ede38/ebabfd4957c1e347-9c/s2048x3072/639ecab3525c6e1bdb0194fda8539d136f4ec184.jpg",
					"title": "DiceGrimorium 71",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/a7e1cf4f9ff854f7f775e34e20d240ce/tumblr_pzguu6tG5Z1y74m69o1_400.jpg",
					"player_map": "https://64.media.tumblr.com/a7e1cf4f9ff854f7f775e34e20d240ce/tumblr_pzguu6tG5Z1y74m69o1_1280.jpg",
					"title": "DiceGrimorium 72",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/8d18eef3c2939bc986dda63da7a4e1ae/93b0ed8d19d3b000-0f/s250x400/6e6e53cfa77024b5a63b7035d3f093b7d1c20421.jpg",
					"player_map": "https://64.media.tumblr.com/8d18eef3c2939bc986dda63da7a4e1ae/93b0ed8d19d3b000-0f/s2048x3072/1fff735897c78c35d4283ed66cbecca784ed4371.jpg",
					"title": "DiceGrimorium 73",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/7cea11e3f7edf1b293ea5eb3215f9846/006c311b6dcf31cb-cf/s250x400/eb881d8a43aeb2ac53307f68830cc5e623b1e224.jpg",
					"player_map": "https://64.media.tumblr.com/7cea11e3f7edf1b293ea5eb3215f9846/006c311b6dcf31cb-cf/s2048x3072/2bc4bd33497b8ff7ed060f72d922910f7db20546.jpg",
					"title": "DiceGrimorium 74",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/17a5185da20b8bc08731acf025feadd8/2294eef5dbb2d0f1-7b/s250x400/84bd9e8cc3f32306611059111c08dff1676687dc.jpg",
					"player_map": "https://64.media.tumblr.com/17a5185da20b8bc08731acf025feadd8/2294eef5dbb2d0f1-7b/s2048x3072/7af49e26778aa6773d9eb54f6ff31e39c37060c7.jpg",
					"title": "DiceGrimorium 75",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/7d094c87d9539ad101ddf9955aea55b5/f19dc8308caeeb49-8a/s250x400/fcecc944b8e80cc260c0e052ffb608e064da807a.jpg",
					"player_map": "https://64.media.tumblr.com/7d094c87d9539ad101ddf9955aea55b5/f19dc8308caeeb49-8a/s2048x3072/9c4afca7db1646598ac0238c8203c21bd98d05b3.jpg",
					"title": "DiceGrimorium 76",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/97552598dd523386e797960ce956b521/tumblr_pylgj653ke1y74m69o1_400.jpg",
					"player_map": "https://64.media.tumblr.com/97552598dd523386e797960ce956b521/tumblr_pylgj653ke1y74m69o1_1280.jpg",
					"title": "DiceGrimorium 77",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/b9b541ae30be2cf6ffc82662bc269be6/tumblr_pyyi1yc4o51y74m69o1_400.jpg",
					"player_map": "https://64.media.tumblr.com/b9b541ae30be2cf6ffc82662bc269be6/tumblr_pyyi1yc4o51y74m69o1_1280.jpg",
					"title": "DiceGrimorium 78",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/06ddb8213d03a9fdb71fc6049ab147db/tumblr_py8il7zB7D1y74m69o1_400.jpg",
					"player_map": "https://64.media.tumblr.com/06ddb8213d03a9fdb71fc6049ab147db/tumblr_py8il7zB7D1y74m69o1_1280.jpg",
					"title": "DiceGrimorium 79",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/afabf3a2a27dbc97c546b685e86d4a02/tumblr_pvppk2MBog1y74m69o1_400.jpg",
					"player_map": "https://64.media.tumblr.com/afabf3a2a27dbc97c546b685e86d4a02/tumblr_pvppk2MBog1y74m69o1_1280.jpg",
					"title": "DiceGrimorium 80",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/1c4615252981063f3990ab2432858274/tumblr_pvcqv7QmsQ1y74m69o1_400.png",
					"player_map": "https://64.media.tumblr.com/1c4615252981063f3990ab2432858274/tumblr_pvcqv7QmsQ1y74m69o1_1280.png",
					"title": "DiceGrimorium 81",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/dc52635f797b12a7554f18a02bcd7514/tumblr_pwfnxuaoin1y74m69o1_400.jpg",
					"player_map": "https://64.media.tumblr.com/dc52635f797b12a7554f18a02bcd7514/tumblr_pwfnxuaoin1y74m69o1_1280.jpg",
					"title": "DiceGrimorium 82",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/6092af0cc6e76ac6584dfccf8d82d4f0/4fd1c7234f4bac8c-e4/s250x400/65c536f1e47ff9f0d3356b6aa3fb0c4388e97ed9.jpg",
					"player_map": "https://64.media.tumblr.com/6092af0cc6e76ac6584dfccf8d82d4f0/4fd1c7234f4bac8c-e4/s2048x3072/35fdee9b424c615a87fb7d8822b96b691d926bad.jpg",
					"title": "DiceGrimorium 83",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/49998ade580de33b09f9182e8ecc5b97/4d8b46ac10ba216c-50/s250x400/12c49f9cfdd3e44ac73bcb161f49f0650b44c22e.jpg",
					"player_map": "https://64.media.tumblr.com/49998ade580de33b09f9182e8ecc5b97/4d8b46ac10ba216c-50/s2048x3072/43c4cbb33892d4d2c765d9bd5ab73b33d1827f0c.jpg",
					"title": "DiceGrimorium 84",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/07bfc094c390b91403e11f894990ac38/2734e1d0791e27ad-46/s250x400/3a9a365da56a03dfd4df8bc81a3782132cb7b1b8.jpg",
					"player_map": "https://64.media.tumblr.com/07bfc094c390b91403e11f894990ac38/2734e1d0791e27ad-46/s1280x1920/d2d80e291b5ffb8e7395e0d0badba01bc74b33a2.jpg",
					"title": "DiceGrimorium 85",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/08411450141e77a1607601e60038e93f/ee41641af9060984-fc/s250x400/0d9eb8457ae3d5add9f7b4a5c4e1e7a5b74379e6.jpg",
					"player_map": "https://64.media.tumblr.com/08411450141e77a1607601e60038e93f/ee41641af9060984-fc/s2048x3072/2596586bd5e79b30d6fbd00b45e49e6da421e07b.jpg",
					"title": "DiceGrimorium 86",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/e34e2c0ff0f4ccaacfb76b057b539b55/tumblr_po28wn9dXv1y74m69o1_400.png",
					"player_map": "https://64.media.tumblr.com/e34e2c0ff0f4ccaacfb76b057b539b55/tumblr_po28wn9dXv1y74m69o1_1280.png",
					"title": "DiceGrimorium 87",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/22886dac09488f882e87ec6cca179131/tumblr_psqbm1Wbon1y74m69o1_400.png",
					"player_map": "https://64.media.tumblr.com/22886dac09488f882e87ec6cca179131/tumblr_psqbm1Wbon1y74m69o1_1280.png",
					"title": "DiceGrimorium 88",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/4a7ffeac63eff24c6b2a55fbe95aae5c/tumblr_pu65rzhABu1y74m69o1_400.png",
					"player_map": "https://64.media.tumblr.com/4a7ffeac63eff24c6b2a55fbe95aae5c/tumblr_pu65rzhABu1y74m69o1_1280.png",
					"title": "DiceGrimorium 89",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/745bcc43465034a3b6efb1dead899a49/tumblr_pvm9igN7el1y74m69o1_400.png",
					"player_map": "https://64.media.tumblr.com/745bcc43465034a3b6efb1dead899a49/tumblr_pvm9igN7el1y74m69o1_1280.png",
					"title": "DiceGrimorium 90",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/100e2bc6b357eb9909ce215f8d2c72ba/tumblr_pnntf9OfBJ1y74m69o1_400.png",
					"player_map": "https://64.media.tumblr.com/100e2bc6b357eb9909ce215f8d2c72ba/tumblr_pnntf9OfBJ1y74m69o1_1280.png",
					"title": "DiceGrimorium 91",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/4dc4437ba1b1de0e9063efb3f58631eb/tumblr_pu0tmoT6xZ1y74m69o1_400.png",
					"player_map": "https://64.media.tumblr.com/4dc4437ba1b1de0e9063efb3f58631eb/tumblr_pu0tmoT6xZ1y74m69o1_1280.png",
					"title": "DiceGrimorium 92",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/2ee0f6a7592baf2ea5875f763c0dc821/tumblr_pnntbsvAaW1y74m69o1_400.png",
					"player_map": "https://64.media.tumblr.com/2ee0f6a7592baf2ea5875f763c0dc821/tumblr_pnntbsvAaW1y74m69o1_1280.png",
					"title": "DiceGrimorium 93",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/51c816d37d88351eebd0cac7e49e4578/tumblr_ppi1nj813d1y74m69o1_400.png",
					"player_map": "https://64.media.tumblr.com/51c816d37d88351eebd0cac7e49e4578/tumblr_ppi1nj813d1y74m69o1_1280.png",
					"title": "DiceGrimorium 94",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/dcf3a66e1d8f9ee59d198fb29454ba4a/tumblr_pw2oznXKvA1y74m69o1_400.jpg",
					"player_map": "https://64.media.tumblr.com/dcf3a66e1d8f9ee59d198fb29454ba4a/tumblr_pw2oznXKvA1y74m69o1_1280.jpg",
					"title": "DiceGrimorium 95",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/46bbd2483f0129aa97544356cc09ecdf/tumblr_pwslloCGah1y74m69o1_400.jpg",
					"player_map": "https://64.media.tumblr.com/46bbd2483f0129aa97544356cc09ecdf/tumblr_pwslloCGah1y74m69o1_1280.jpg",
					"title": "DiceGrimorium 96",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/89fd96192dc424ae883dd7f06fd3a68e/tumblr_puj3767I0w1y74m69o1_400.png",
					"player_map": "https://64.media.tumblr.com/89fd96192dc424ae883dd7f06fd3a68e/tumblr_puj3767I0w1y74m69o1_1280.png",
					"title": "DiceGrimorium 97",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/89e974d60bb4a69fab3b56db82139dd4/tumblr_pnntdfhyPV1y74m69o1_400.png",
					"player_map": "https://64.media.tumblr.com/89e974d60bb4a69fab3b56db82139dd4/tumblr_pnntdfhyPV1y74m69o1_1280.png",
					"title": "DiceGrimorium 98",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/5ec75ed2c70467c7f271e755d3f546f7/tumblr_pqh91qnspY1y74m69o1_400.jpg",
					"player_map": "https://64.media.tumblr.com/5ec75ed2c70467c7f271e755d3f546f7/tumblr_pqh91qnspY1y74m69o1_1280.jpg",
					"title": "DiceGrimorium 99",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/13d9fb60999d64bf14baf5fb875982ca/tumblr_pt3a5wRBWO1y74m69o1_400.png",
					"player_map": "https://64.media.tumblr.com/13d9fb60999d64bf14baf5fb875982ca/tumblr_pt3a5wRBWO1y74m69o1_1280.png",
					"title": "DiceGrimorium 100",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/d67a7494795e2927d656a01271d54058/tumblr_psddu4GOAD1y74m69o1_400.png",
					"player_map": "https://64.media.tumblr.com/d67a7494795e2927d656a01271d54058/tumblr_psddu4GOAD1y74m69o1_1280.png",
					"title": "DiceGrimorium 101",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/6b32e2ad3346d0b5c42e4084a04e0c0d/tumblr_puw3owu0pZ1y74m69o1_400.png",
					"player_map": "https://64.media.tumblr.com/6b32e2ad3346d0b5c42e4084a04e0c0d/tumblr_puw3owu0pZ1y74m69o1_1280.png",
					"title": "DiceGrimorium 102",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/198c864a6c42beb4026713761ac919da/tumblr_ptg8672hUb1y74m69o1_400.png",
					"player_map": "https://64.media.tumblr.com/198c864a6c42beb4026713761ac919da/tumblr_ptg8672hUb1y74m69o1_1280.png",
					"title": "DiceGrimorium 103",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/c52b4449e8e0ffc7d1a909636d6a564a/tumblr_ptt7pbQ8O71y74m69o1_400.png",
					"player_map": "https://64.media.tumblr.com/c52b4449e8e0ffc7d1a909636d6a564a/tumblr_ptt7pbQ8O71y74m69o1_1280.png",
					"title": "DiceGrimorium 104",
					"scale": 100,
					"dm_map": ""
				},
				{
					"thumb": "https://64.media.tumblr.com/59911c5411910dfa9229489cfe03c094/tumblr_prlxqhhUNb1y74m69o1_400.png",
					"player_map": "https://64.media.tumblr.com/59911c5411910dfa9229489cfe03c094/tumblr_prlxqhhUNb1y74m69o1_1280.png",
					"title": "DiceGrimorium 105",
					"scale": 100,
					"dm_map": ""
				}
			]
		},
		{
			"title": "Weasel Wargaming",
			"logo": `https://abovevtt-assets.s3.eu-central-1.amazonaws.com/menu-images/warweasel.png`,
			"scenes": [
				{
					player_map: "https://www.youtube.com/watch?v=ErBd9sPBAZc",
					title: "Warpstone cave 1 (Descent into the mines) Battlemap",
					thumb: "https://i.ytimg.com/vi/ErBd9sPBAZc/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=ChKqW9JM24c",
					title: "Warpstone cave 2 (Boiling pool) Battlemap",
					thumb: "https://i.ytimg.com/vi/ChKqW9JM24c/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=rs_f59mRN2w",
					title: "Warpstone cave 3 (Monstrous encounter) Battlemap",
					thumb: "https://i.ytimg.com/vi/rs_f59mRN2w/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=6ctnnbXZXsg",
					title: "Warpstone cave 4 (Grim discovery) Battlemap",
					thumb: "https://i.ytimg.com/vi/6ctnnbXZXsg/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=Rk87Pp9ceXs",
					title: "Warpstone cave 5 (Y-junction) Battlemap (Gridless)",
					thumb: "https://i.ytimg.com/vi/Rk87Pp9ceXs/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=wc7O9tRb304",
					title: "Warpstone Cave 6 (Throne room) Battlemap (Gridless)",
					thumb: "https://i.ytimg.com/vi/wc7O9tRb304/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=2bl8eE4Y1HA",
					title: "Warpstone cave 7 (cells) Battlemap",
					thumb: "https://i.ytimg.com/vi/2bl8eE4Y1HA/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=4rOSmiccu-Y",
					title: "Warpstone Cave 8 (Pillar) Battlemap (Gridless)",
					thumb: "https://i.ytimg.com/vi/4rOSmiccu-Y/hqdefault.jpg",
				},

			]
		},
		{
			"title": "YOUTUBE (experimental)",
			"logo": "",
			"scenes": [
				{
					player_map: "https://www.youtube.com/watch?v=IkKPw3C3L9A",
					title: "3 Hour Living Battle Map (No Grid) - Temple Ruins, Night",
					thumb: "https://i.ytimg.com/vi/IkKPw3C3L9A/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=DOMt5M8IPFE",
					title: "3 Hour Living Battle Map - Temple Ruins, Night",
					thumb: "https://i.ytimg.com/vi/DOMt5M8IPFE/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=ahwMlwJXPPs",
					title: "3 Hour Living Battle Map (No Grid) - Plains Village and Tavern, Mid Day",
					thumb: "https://i.ytimg.com/vi/ahwMlwJXPPs/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=Eg_k4dB6EOs",
					title: "3 Hour Living Battle Map - Plains Village and Tavern, Mid Day",
					thumb: "https://i.ytimg.com/vi/Eg_k4dB6EOs/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=ePDq2nNW1sc",
					title: "3 Hour Living Battle Map (No Grid) - Forest, Mid Day",
					thumb: "https://i.ytimg.com/vi/ePDq2nNW1sc/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=DtsP5f_fYmk",
					title: "3 Hour Living Battle Map (No Grid) - Waterfall and Ruins, Mid Day",
					thumb: "https://i.ytimg.com/vi/DtsP5f_fYmk/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=3Z6Mkfetay8",
					title: "3 Hour Living Battle Map - Waterfall and Ruins, Mid Day",
					thumb: "https://i.ytimg.com/vi/3Z6Mkfetay8/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=c0a2_C3Fqo8",
					title: "3 Hour Living Battle Map - Forest, Mid Day",
					thumb: "https://i.ytimg.com/vi/c0a2_C3Fqo8/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=lo7-cAuGFVI",
					title: "Broken Bridge 00 Daytime",
					thumb: "https://i.ytimg.com/vi/lo7-cAuGFVI/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=E732CHbbI5g",
					title: "Bridge Nightime with Lights",
					thumb: "https://i.ytimg.com/vi/E732CHbbI5g/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=To9XgSd7iYI",
					title: "Broken Bridge Daytime 03",
					thumb: "https://i.ytimg.com/vi/To9XgSd7iYI/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=veq9PZBOV7E",
					title: "Dynamic Dungeons: Goblin ambush - animated RPG map",
					thumb: "https://i.ytimg.com/vi/veq9PZBOV7E/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=htWlukhguGE",
					title: "Mountain Ruins animated action scene",
					thumb: "https://i.ytimg.com/vi/htWlukhguGE/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=hYwqCZBCjyk",
					title: "LIVING BATTLEMAPS",
					thumb: "https://i.ytimg.com/vi/hYwqCZBCjyk/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=WzySwJy2qtQ",
					title: "Icelands 06 Tundra Nightime",
					thumb: "https://i.ytimg.com/vi/WzySwJy2qtQ/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=MguO-LJ3Zn4",
					title: "City Gates Bridge Daytime",
					thumb: "https://i.ytimg.com/vi/MguO-LJ3Zn4/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=9e7drzYrAQU",
					title: "Forest Road 09 River Crossing Nightime",
					thumb: "https://i.ytimg.com/vi/9e7drzYrAQU/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=4qXq-_xVmsM",
					title: "Forest Road 07 Nightime",
					thumb: "https://i.ytimg.com/vi/4qXq-_xVmsM/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=ZYsFNhVeJYk",
					title: "Coastal Path 06 Cliff Daytime",
					thumb: "https://i.ytimg.com/vi/ZYsFNhVeJYk/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=QLgqb8fQu-U",
					title: "Coastal Path 07 Daytime",
					thumb: "https://i.ytimg.com/vi/QLgqb8fQu-U/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=1FuqW53Lmmw",
					title: "Forest Camp Nightime",
					thumb: "https://i.ytimg.com/vi/1FuqW53Lmmw/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=X8el8C_OtPY",
					title: "Forest Clearing 04 Daytime",
					thumb: "https://i.ytimg.com/vi/X8el8C_OtPY/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=n6GvxPcZZsc",
					title: "Forest Road 06 Bridge Daytime",
					thumb: "https://i.ytimg.com/vi/n6GvxPcZZsc/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=PvCceyzceHw",
					title: "Coastal Path 05 Cliff Daytime",
					thumb: "https://i.ytimg.com/vi/PvCceyzceHw/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=GyFMVOpqZyc",
					title: "Rural 06 Ruined Circle Daytime",
					thumb: "https://i.ytimg.com/vi/GyFMVOpqZyc/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=cVXJg90wtTM",
					title: "Icelands 05 Tundra Daytime",
					thumb: "https://i.ytimg.com/vi/cVXJg90wtTM/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=MU1BY0ftEMo",
					title: "Coastal Village Nightime",
					thumb: "https://i.ytimg.com/vi/MU1BY0ftEMo/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=5T7po_Nw9qc",
					title: "Forest Campsite Daytime",
					thumb: "https://i.ytimg.com/vi/5T7po_Nw9qc/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=7ycdDD_pWgs",
					title: "Forest Ruined Tower Daytime",
					thumb: "https://i.ytimg.com/vi/7ycdDD_pWgs/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=b3-348Yriso",
					title: "Forest Trails Daytime",
					thumb: "https://i.ytimg.com/vi/b3-348Yriso/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=GGPkV3rhkrY",
					title: "Village 02 Gatehouse Daytime",
					thumb: "https://i.ytimg.com/vi/GGPkV3rhkrY/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=5yX7WpeKz7U",
					title: "The Red Road 07 Night",
					thumb: "https://i.ytimg.com/vi/5yX7WpeKz7U/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=9QyxYmAklko",
					title: "The Red Road 08 Night",
					thumb: "https://i.ytimg.com/vi/9QyxYmAklko/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=c8fQ-G9IrzQ",
					title: "Village 01 Gate Nightime",
					thumb: "https://i.ytimg.com/vi/c8fQ-G9IrzQ/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=TpsEWAETnZ8",
					title: "Temple Ward 01 Nightime",
					thumb: "https://i.ytimg.com/vi/TpsEWAETnZ8/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=QWHsfD2gUcQ",
					title: "Swamp Marsh 02 Daytime",
					thumb: "https://i.ytimg.com/vi/QWHsfD2gUcQ/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=Xcd5Rw5y9BM",
					title: "Rural 05 Village Outskirts Daytime",
					thumb: "https://i.ytimg.com/vi/Xcd5Rw5y9BM/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=h5d0G5PT8l0",
					title: "Rural 01 Fields Daytime",
					thumb: "https://i.ytimg.com/vi/h5d0G5PT8l0/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=j3uj6iRhT18",
					title: "Pretty Village 07 Nightime",
					thumb: "https://i.ytimg.com/vi/j3uj6iRhT18/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=WIX3HlNVH3k",
					title: "Pretty Village 06 Nightime",
					thumb: "https://i.ytimg.com/vi/WIX3HlNVH3k/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=xL4hKCPoNnw",
					title: "Pretty Village 03 Daytime",
					thumb: "https://i.ytimg.com/vi/xL4hKCPoNnw/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=9I0NGlGNu3Y",
					title: "Misc 01 Arena",
					thumb: "https://i.ytimg.com/vi/9I0NGlGNu3Y/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=yHXCm84E7BU",
					title: "forest road",
					thumb: "https://i.ytimg.com/vi/yHXCm84E7BU/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=buwUtI-Gqdg",
					title: "forest road day2",
					thumb: "https://i.ytimg.com/vi/buwUtI-Gqdg/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=J7LFc-fci0c",
					title: "forest road 5",
					thumb: "https://i.ytimg.com/vi/J7LFc-fci0c/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=T-iMkmiBKwI",
					title: "forest path past hut day",
					thumb: "https://i.ytimg.com/vi/T-iMkmiBKwI/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=L8pKPMqNK1s",
					title: "forest day6",
					thumb: "https://i.ytimg.com/vi/L8pKPMqNK1s/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=EA9kaq-smI8",
					title: "forest day2",
					thumb: "https://i.ytimg.com/vi/EA9kaq-smI8/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=yIcGWi1HYK8",
					title: "forest day1",
					thumb: "https://i.ytimg.com/vi/yIcGWi1HYK8/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=oeXdizGzCqw",
					title: "Fighting Pit 02 Daytime",
					thumb: "https://i.ytimg.com/vi/oeXdizGzCqw/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=r4fLDt6XhpM",
					title: "Fighting Pit 01 Daytime",
					thumb: "https://i.ytimg.com/vi/r4fLDt6XhpM/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=AFCAicfpMJQ",
					title: "Countryside 12 Small House and Grounds Daytime",
					thumb: "https://i.ytimg.com/vi/AFCAicfpMJQ/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=_9PHhi5EQlc",
					title: "Countryside 05 River Crossing Daytime",
					thumb: "https://i.ytimg.com/vi/_9PHhi5EQlc/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=s4_PaTJ9WVU",
					title: "Country Road 17 Rest Stop Nightime",
					thumb: "https://i.ytimg.com/vi/s4_PaTJ9WVU/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=zjp35fvTDp4",
					title: "Country Road 11 Small House Daytime",
					thumb: "https://i.ytimg.com/vi/zjp35fvTDp4/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=OcL5bsE8cLg",
					title: "Country Road 10 Vendors Tents Daytime",
					thumb: "https://i.ytimg.com/vi/OcL5bsE8cLg/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=XyhXNkmwUA0",
					title: "Coastal Beach 03 Desert Daytime",
					thumb: "https://i.ytimg.com/vi/XyhXNkmwUA0/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=F7JON54Brus",
					title: "Coastal Path 02 Pier Daytime",
					thumb: "https://i.ytimg.com/vi/F7JON54Brus/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=58dqSbV5nQg",
					title: "City Streets 24 Outside of Building Nightime",
					thumb: "https://i.ytimg.com/vi/58dqSbV5nQg/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=pEsk0_v8RV0",
					title: "City Streets 16 Docks Bridge Daytime",
					thumb: "https://i.ytimg.com/vi/pEsk0_v8RV0/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=7qH98ZY1-JU",
					title: "City Streets 17 Docks Nighttime",
					thumb: "https://i.ytimg.com/vi/7qH98ZY1-JU/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=n4izvNgIDtI",
					title: "City Streets 15 Docks Bridge Daytime",
					thumb: "https://i.ytimg.com/vi/n4izvNgIDtI/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=UbTZWb2IXlQ",
					title: "City Streets 21 Walled Garden Daytime",
					thumb: "https://i.ytimg.com/vi/UbTZWb2IXlQ/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=RiVl_cTSU9g",
					title: "City Streets 10 Nightime",
					thumb: "https://i.ytimg.com/vi/RiVl_cTSU9g/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=N3j_zcrllUA",
					title: "City Streets 11 Market Nightime",
					thumb: "https://i.ytimg.com/vi/N3j_zcrllUA/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=GAnwyMVeCTU",
					title: "City Market Daytime 01",
					thumb: "https://i.ytimg.com/vi/GAnwyMVeCTU/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=1swyJZAZrNw",
					title: "Desert - Motion map Pack 4KUHD",
					thumb: "https://i.ytimg.com/vi/1swyJZAZrNw/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=4IdufWmn_6o",
					title: "City Part 1: Docks and Marketplace",
					thumb: "https://i.ytimg.com/vi/4IdufWmn_6o/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=1NclUESZ_Kw",
					title: "Undead graveyard",
					thumb: "https://i.ytimg.com/vi/1NclUESZ_Kw/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=Xlh6dWAgmvY",
					title: "City Street Nightime with lights",
					thumb: "https://i.ytimg.com/vi/Xlh6dWAgmvY/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=vC1JzSAutRU",
					title: "Forest Road 08 Nightime",
					thumb: "https://i.ytimg.com/vi/vC1JzSAutRU/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=qSU9sbTCRao",
					title: "Icelands 07 Tundra Daytime",
					thumb: "https://i.ytimg.com/vi/qSU9sbTCRao/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=GxV0hS0VkAw",
					title: "Coastal Path 08 Hut Daytime",
					thumb: "https://i.ytimg.com/vi/GxV0hS0VkAw/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=mwNeMz2ogmE",
					title: "Misc 08 seascape",
					thumb: "https://i.ytimg.com/vi/mwNeMz2ogmE/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=BZe1r65-Tio",
					title: "Misc 06 Seascape",
					thumb: "https://i.ytimg.com/vi/BZe1r65-Tio/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=-Qg5FL9_Yrc",
					title: "Icelands 04 Tundra Daytime",
					thumb: "https://i.ytimg.com/vi/-Qg5FL9_Yrc/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=Web3KxYPC8M",
					title: "Icelands 03 Tundra Daytime",
					thumb: "https://i.ytimg.com/vi/Web3KxYPC8M/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=EmVnkqFhgaA",
					title: "Icelands 02 Tundra Daytime",
					thumb: "https://i.ytimg.com/vi/EmVnkqFhgaA/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=qDjcwPwlP88",
					title: "Forest Trails Nightime",
					thumb: "https://i.ytimg.com/vi/qDjcwPwlP88/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=NIK6gW01vBc",
					title: "The Red Road 06 Night",
					thumb: "https://i.ytimg.com/vi/NIK6gW01vBc/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=rP64XcqLB_Y",
					title: "The Red Road 05 Night",
					thumb: "https://i.ytimg.com/vi/rP64XcqLB_Y/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=h4vwNrNpxMI",
					title: "The Red Road 04 Night",
					thumb: "https://i.ytimg.com/vi/h4vwNrNpxMI/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=Boelfqg9BcY",
					title: "The Red Road 03 Night",
					thumb: "https://i.ytimg.com/vi/Boelfqg9BcY/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=zC9qpXRqIGk",
					title: "The Red Road 02 Night",
					thumb: "https://i.ytimg.com/vi/zC9qpXRqIGk/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=QLsF9ql3gSI",
					title: "The Red Road 01 Night",
					thumb: "https://i.ytimg.com/vi/QLsF9ql3gSI/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=U-PeYDw7L0Q",
					title: "Swamp Marsh 01 Daytime",
					thumb: "https://i.ytimg.com/vi/U-PeYDw7L0Q/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=PkNmh_zUV7Q",
					title: "Rural 04 Village Nightime",
					thumb: "https://i.ytimg.com/vi/PkNmh_zUV7Q/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=9FnfQYLSICA",
					title: "Rural 03 Path Daytime",
					thumb: "https://i.ytimg.com/vi/9FnfQYLSICA/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=JAGxl6sqWc0",
					title: "Rural 02 River Crossing Daytime",
					thumb: "https://i.ytimg.com/vi/JAGxl6sqWc0/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=3lOVLhsowrE",
					title: "Pretty Village 11 Nightime",
					thumb: "https://i.ytimg.com/vi/3lOVLhsowrE/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=axL-70Ns7Vs",
					title: "Pretty Village 08 Nightime",
					thumb: "https://i.ytimg.com/vi/axL-70Ns7Vs/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=JeUfEeqVHuc",
					title: "Pretty Village 09 Nightime",
					thumb: "https://i.ytimg.com/vi/JeUfEeqVHuc/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=CwN42n8E-Z8",
					title: "Pretty Village 10 Nightime",
					thumb: "https://i.ytimg.com/vi/CwN42n8E-Z8/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=fCQAdkfD6bo",
					title: "Pretty Village 01 Daytime",
					thumb: "https://i.ytimg.com/vi/fCQAdkfD6bo/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=Qo9qobii6Wc",
					title: "Pretty Village 02 Bridge Daytime",
					thumb: "https://i.ytimg.com/vi/Qo9qobii6Wc/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=jqdQ-BTdRDs",
					title: "Pretty Village 05 Daytime",
					thumb: "https://i.ytimg.com/vi/jqdQ-BTdRDs/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=pS-o69YFQpE",
					title: "Pretty Village 04 Daytime",
					thumb: "https://i.ytimg.com/vi/pS-o69YFQpE/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=aFwzDK9wyH8",
					title: "Icelands 01 Ice Dragon Lair",
					thumb: "https://i.ytimg.com/vi/aFwzDK9wyH8/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=EnAXNHGlsuE",
					title: "Misc 04 Sea",
					thumb: "https://i.ytimg.com/vi/EnAXNHGlsuE/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=k5mtCrNUeL4",
					title: "Grassland 02 Daytime",
					thumb: "https://i.ytimg.com/vi/k5mtCrNUeL4/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=RpUE3GNW3b4",
					title: "Grassland 01 Daytime",
					thumb: "https://i.ytimg.com/vi/RpUE3GNW3b4/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=FKFQ2Qqj1uk",
					title: "forest road night",
					thumb: "https://i.ytimg.com/vi/FKFQ2Qqj1uk/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=T11PXRLAW6A",
					title: "forestrural path",
					thumb: "https://i.ytimg.com/vi/T11PXRLAW6A/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=9OVCUm_Vtrc",
					title: "forestclearing3",
					thumb: "https://i.ytimg.com/vi/9OVCUm_Vtrc/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=04kFssLjK-o",
					title: "forestclearing2",
					thumb: "https://i.ytimg.com/vi/04kFssLjK-o/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=po-Q7a_cVgU",
					title: "forestclearing",
					thumb: "https://i.ytimg.com/vi/po-Q7a_cVgU/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=7meu9Val5SI",
					title: "forest road day5",
					thumb: "https://i.ytimg.com/vi/7meu9Val5SI/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=C2-CaYLyeF4",
					title: "forest road day4",
					thumb: "https://i.ytimg.com/vi/C2-CaYLyeF4/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=kyOmY9582iQ",
					title: "forest road day3",
					thumb: "https://i.ytimg.com/vi/kyOmY9582iQ/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=S5DOvgtDN18",
					title: "forest road 4",
					thumb: "https://i.ytimg.com/vi/S5DOvgtDN18/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=9yWzOxS1Yn4",
					title: "forest path2",
					thumb: "https://i.ytimg.com/vi/9yWzOxS1Yn4/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=4JEy6kTrnDo",
					title: "forest path day2",
					thumb: "https://i.ytimg.com/vi/4JEy6kTrnDo/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=oxGnlVFV0b0",
					title: "forest path day1",
					thumb: "https://i.ytimg.com/vi/oxGnlVFV0b0/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=363F7Io-HQ4",
					title: "forest night1",
					thumb: "https://i.ytimg.com/vi/363F7Io-HQ4/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=7Hyc5BdSx4o",
					title: "forest night bonfire1",
					thumb: "https://i.ytimg.com/vi/7Hyc5BdSx4o/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=1p2hpEezZ6s",
					title: "forest day5",
					thumb: "https://i.ytimg.com/vi/1p2hpEezZ6s/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=CZGxl2UNmKM",
					title: "forest day4",
					thumb: "https://i.ytimg.com/vi/CZGxl2UNmKM/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=OJE9_Xwf6mw",
					title: "Forest Clearing Daytime",
					thumb: "https://i.ytimg.com/vi/OJE9_Xwf6mw/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=_XngvrIbElU",
					title: "forest clearing day3",
					thumb: "https://i.ytimg.com/vi/_XngvrIbElU/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=Kf5wGmEmfgA",
					title: "forest clearing day2",
					thumb: "https://i.ytimg.com/vi/Kf5wGmEmfgA/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=N_BDQi2EZlM",
					title: "forest clearing day1",
					thumb: "https://i.ytimg.com/vi/N_BDQi2EZlM/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=OIzx9KRBwiY",
					title: "Country Road 02 Daytime",
					thumb: "https://i.ytimg.com/vi/OIzx9KRBwiY/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=MIZNlImgfeo",
					title: "City Streets 20 Daytime",
					thumb: "https://i.ytimg.com/vi/MIZNlImgfeo/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=mL8Mm_h4wI4",
					title: "City Streets 14 Docks Bridge Nightime",
					thumb: "https://i.ytimg.com/vi/mL8Mm_h4wI4/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=4XfhXnGmLUA",
					title: "City Streets 08 Nightime",
					thumb: "https://i.ytimg.com/vi/4XfhXnGmLUA/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=HjqhpDMLmYE",
					title: "City Streets 07 Nightime",
					thumb: "https://i.ytimg.com/vi/HjqhpDMLmYE/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=JZFZith9fTg",
					title: "City Streets 06 Nightime",
					thumb: "https://i.ytimg.com/vi/JZFZith9fTg/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=93QSeCIJAAA",
					title: "City Streets 05 Bridge Nightime",
					thumb: "https://i.ytimg.com/vi/93QSeCIJAAA/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=Fcb52TwABIw",
					title: "City Streets 04 Nightime",
					thumb: "https://i.ytimg.com/vi/Fcb52TwABIw/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=C2X-puD4eM0",
					title: "City Streets 03 Nightime",
					thumb: "https://i.ytimg.com/vi/C2X-puD4eM0/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=-V-zHTrh7Ks",
					title: "Countryside 11 Walled Garden Daytime",
					thumb: "https://i.ytimg.com/vi/-V-zHTrh7Ks/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=YLPTPEKltxY",
					title: "Countryside 10 Walled House Nightime",
					thumb: "https://i.ytimg.com/vi/YLPTPEKltxY/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=vZkzMm6dABU",
					title: "Countryside 09 Ambush Site Daytime",
					thumb: "https://i.ytimg.com/vi/vZkzMm6dABU/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=Q9ZpXEXGXbA",
					title: "Countryside 08 River Crossing Daytime",
					thumb: "https://i.ytimg.com/vi/Q9ZpXEXGXbA/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=lzQCMn9twCM",
					title: "Countryside 07 River Crossing Daytime",
					thumb: "https://i.ytimg.com/vi/lzQCMn9twCM/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=fqpp1zgnjrQ",
					title: "Countryside 06 River Crossing Daytime",
					thumb: "https://i.ytimg.com/vi/fqpp1zgnjrQ/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=6aKT2S-F-Bo",
					title: "Countryside 04 Small House Daytime",
					thumb: "https://i.ytimg.com/vi/6aKT2S-F-Bo/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=5XcYm4Vqxkg",
					title: "Countryside 03 Daytime",
					thumb: "https://i.ytimg.com/vi/5XcYm4Vqxkg/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=qd8zdjemr6E",
					title: "Countryside 02 Daytime",
					thumb: "https://i.ytimg.com/vi/qd8zdjemr6E/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=2cbEqVlzhSM",
					title: "Countryside 01 Daytime",
					thumb: "https://i.ytimg.com/vi/2cbEqVlzhSM/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=Nz--j7VxW3g",
					title: "Country Road 18 Under the Bridge Daytime",
					thumb: "https://i.ytimg.com/vi/Nz--j7VxW3g/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=G_Z6fySrIvM",
					title: "Country Road 16 Ruined Huts Daytime",
					thumb: "https://i.ytimg.com/vi/G_Z6fySrIvM/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=feWrrxSemIs",
					title: "Country Road 15 Bridge River Crossing Daytime",
					thumb: "https://i.ytimg.com/vi/feWrrxSemIs/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=xq1f35UYd9k",
					title: "Country Road 14 Broken Bridge Daytime",
					thumb: "https://i.ytimg.com/vi/xq1f35UYd9k/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=mhtNCN_oySc",
					title: "Country Road 13 Ambush Site",
					thumb: "https://i.ytimg.com/vi/mhtNCN_oySc/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=uFgqqDRyuPc",
					title: "Country Road 12 Ambush Site",
					thumb: "https://i.ytimg.com/vi/uFgqqDRyuPc/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=2m7ifK8xw_E",
					title: "Country Road 09 Vendors Tents Daytime",
					thumb: "https://i.ytimg.com/vi/2m7ifK8xw_E/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=H00EvOWJkmA",
					title: "Country Road 08 Bridge Daytime crazyriver",
					thumb: "https://i.ytimg.com/vi/H00EvOWJkmA/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=JuMAzL0W5_U",
					title: "Country Road 07 Bridge Daytime",
					thumb: "https://i.ytimg.com/vi/JuMAzL0W5_U/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=ae_r50RmY7E",
					title: "Country Road 06 Daytime",
					thumb: "https://i.ytimg.com/vi/ae_r50RmY7E/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=1xGV2PSO8LE",
					title: "Country Road 05 Daytime",
					thumb: "https://i.ytimg.com/vi/1xGV2PSO8LE/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=eRDT3jq8pGg",
					title: "Country Road 04 Daytime",
					thumb: "https://i.ytimg.com/vi/eRDT3jq8pGg/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=zJaG2QEnTD0",
					title: "Country Road 03 Daytime",
					thumb: "https://i.ytimg.com/vi/zJaG2QEnTD0/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=3fgHRVTBbUc",
					title: "Country Road 01 Daytime",
					thumb: "https://i.ytimg.com/vi/3fgHRVTBbUc/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=M2FTZpfvSTU",
					title: "Just Cruisin",
					thumb: "https://i.ytimg.com/vi/M2FTZpfvSTU/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=GYfYDdPYZcs",
					title: "Coastal Beach 02 Nightime",
					thumb: "https://i.ytimg.com/vi/GYfYDdPYZcs/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=C60NYVYx8Zc",
					title: "Coastal Beach 01 Daytime",
					thumb: "https://i.ytimg.com/vi/C60NYVYx8Zc/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=L_K3TFgJtAo",
					title: "Coastal Path 04 Nightime",
					thumb: "https://i.ytimg.com/vi/L_K3TFgJtAo/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=ny_XrjC3F9Q",
					title: "Coastal Path 03 Pier Daytime",
					thumb: "https://i.ytimg.com/vi/ny_XrjC3F9Q/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=uDmjwLRxpLo",
					title: "Coastal Path 01 Nightime",
					thumb: "https://i.ytimg.com/vi/uDmjwLRxpLo/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=kZp7Zfq1iqg",
					title: "City Streets 23 Tavern Forecourt Daytime",
					thumb: "https://i.ytimg.com/vi/kZp7Zfq1iqg/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=Oxl4y3LJ0h4",
					title: "City Streets 22 Docks Ship Daytime",
					thumb: "https://i.ytimg.com/vi/Oxl4y3LJ0h4/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=FW5TDl7pJzA",
					title: "City Streets 19 Daytime",
					thumb: "https://i.ytimg.com/vi/FW5TDl7pJzA/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=8NFvO3sjRDQ",
					title: "City Streets 18 Daytime",
					thumb: "https://i.ytimg.com/vi/8NFvO3sjRDQ/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=ohjLmLJ9zUk",
					title: "City Streets 13 Nightime",
					thumb: "https://i.ytimg.com/vi/ohjLmLJ9zUk/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=7eCs4nKcC-Y",
					title: "City Streets 12 Nightime",
					thumb: "https://i.ytimg.com/vi/7eCs4nKcC-Y/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=z8_nwMf4Ryc",
					title: "City Streets 09 Nightime",
					thumb: "https://i.ytimg.com/vi/z8_nwMf4Ryc/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=NPArKMtOpPo",
					title: "City Streets 01 Nightime",
					thumb: "https://i.ytimg.com/vi/NPArKMtOpPo/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=2LWZwAcVWT0",
					title: "City Gate Nightime with lights",
					thumb: "https://i.ytimg.com/vi/2LWZwAcVWT0/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=fvjNR2BHQMs",
					title: "City Gate Bridge Nightime with lights",
					thumb: "https://i.ytimg.com/vi/fvjNR2BHQMs/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=GF9nP2W_45I",
					title: "campfire1",
					thumb: "https://i.ytimg.com/vi/GF9nP2W_45I/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=BwVTRcBA7b4",
					title: "Broken Bridge Daytime 02",
					thumb: "https://i.ytimg.com/vi/BwVTRcBA7b4/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=a1hA9RoMhKU",
					title: "Broken Bridge 01 Daytime",
					thumb: "https://i.ytimg.com/vi/a1hA9RoMhKU/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=0BoIkVj4bS0",
					title: "Living Battlemap Goblin Ambush Mid Day (1H)",
					thumb: "https://i.ytimg.com/vi/0BoIkVj4bS0/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=IbK81_6KeNU",
					title: "Living Battlemap Cragmaw Hideout Entrance Mid Day (1H)",
					thumb: "https://i.ytimg.com/vi/IbK81_6KeNU/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=WNvLGFwARQU",
					title: "Living Battlemap Campsite Mid Day (1H)",
					thumb: "https://i.ytimg.com/vi/WNvLGFwARQU/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=4YUtwPr9lf8",
					title: "Living Battlemap Campsite Night (1H)",
					thumb: "https://i.ytimg.com/vi/4YUtwPr9lf8/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=xEzvBJOUlv4",
					title: "Living Maps A split in the road",
					thumb: "https://i.ytimg.com/vi/xEzvBJOUlv4/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=bJK_50Zvb10",
					title: "Living Maps - Rainy Jungle",
					thumb: "https://i.ytimg.com/vi/bJK_50Zvb10/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=_lq9AoBMdSU",
					title: "Living map woodland path",
					thumb: "https://i.ytimg.com/vi/_lq9AoBMdSU/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=IKNA8dM-iR0",
					title: "BlackSmith D&D Animated Map",
					thumb: "https://i.ytimg.com/vi/IKNA8dM-iR0/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=39ow4NbFkSY",
					title: "Animated Dungeon Maps - Cave campsite near a chasm (remastered)",
					thumb: "https://i.ytimg.com/vi/39ow4NbFkSY/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=P6WgRkpzA2Q",
					title: "Animated Dungeon Maps - Cave campsite near a chasm",
					thumb: "https://i.ytimg.com/vi/P6WgRkpzA2Q/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=KfkNcAziPdg",
					title: "Abyssal action scene",
					thumb: "https://i.ytimg.com/vi/KfkNcAziPdg/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=Qqv7tB3q4iQ",
					title: "Dungeon of Skulls",
					thumb: "https://i.ytimg.com/vi/Qqv7tB3q4iQ/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=YTybN8tScn4",
					title: "Camp in the woods + new forest scene free giveaway by:Dynamic Dungeons",
					thumb: "https://i.ytimg.com/vi/YTybN8tScn4/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=DQXOiGKhI2k",
					title: "Dynamic Battle Map - The Black Dog Tavern",
					thumb: "https://i.ytimg.com/vi/DQXOiGKhI2k/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=O8GFnIcvORk",
					title: "dnd Map Animated (river crossing, Birds)",
					thumb: "https://i.ytimg.com/vi/O8GFnIcvORk/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=18pRUdKNlGw",
					title: "Animated Battle map (wooden bridge)",
					thumb: "https://i.ytimg.com/vi/18pRUdKNlGw/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=zhpcmBp0kFM",
					title: "Animated Battle map",
					thumb: "https://i.ytimg.com/vi/zhpcmBp0kFM/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=Jpf8USA_kp0",
					title: "Animated Battlemap Snowy Road",
					thumb: "https://i.ytimg.com/vi/Jpf8USA_kp0/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=-ozrv5VD4F8",
					title: "DAI Burning Fort 02",
					thumb: "https://i.ytimg.com/vi/-ozrv5VD4F8/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=276B35MSIvc",
					title: "DAI waterfall 01",
					thumb: "https://i.ytimg.com/vi/276B35MSIvc/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=ZRUi7cmpZ20",
					title: "animated Battle map ( dirt road )",
					thumb: "https://i.ytimg.com/vi/ZRUi7cmpZ20/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=mqv8rKZr2ZI",
					title: "dnd battlemap - sand dune by the ocean",
					thumb: "https://i.ytimg.com/vi/mqv8rKZr2ZI/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=78k6Wy_c_t0",
					title: "Naval Action - Sea of Thieves / Naval Battle Music /Backround Atmosphere Music",
					thumb: "https://i.ytimg.com/vi/78k6Wy_c_t0/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=y8PiTfwMGak",
					title: "Dnd battle map - night at the swamp",
					thumb: "https://i.ytimg.com/vi/y8PiTfwMGak/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=ley1JCnYEk4",
					title: "Dnd Battlemap - Camp",
					thumb: "https://i.ytimg.com/vi/ley1JCnYEk4/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=uC_kLfTgxmk",
					title: "Battlemap for dnd campaign - fort on a cliff",
					thumb: "https://i.ytimg.com/vi/uC_kLfTgxmk/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=tZPPO-pgmwo",
					title: "Animated Battle Map for dnd ( beach, Pirate bury treasure gone wrong)",
					thumb: "https://i.ytimg.com/vi/tZPPO-pgmwo/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=mXOHi7o0Wyw",
					title: "(battlefield) animated battlemaps roll",
					thumb: "https://i.ytimg.com/vi/mXOHi7o0Wyw/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=flp6s33XQNs",
					title: "Living Battlemap Cragmaw Hideout Final Room (1H)",
					thumb: "https://i.ytimg.com/vi/flp6s33XQNs/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=07gRhaRgn-c",
					title: "Living Battlemap Cragmaw Hideout Pools (1H)",
					thumb: "https://i.ytimg.com/vi/07gRhaRgn-c/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=-gG89ezFHZo",
					title: "Living Battlemap Cragmaw Hideout Goblin Room (1H)",
					thumb: "https://i.ytimg.com/vi/-gG89ezFHZo/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=uG5fKGfQgUY",
					title: "[Skyrim - Vanilla] Animated Battlemap - Waterfall roadside",
					thumb: "https://i.ytimg.com/vi/uG5fKGfQgUY/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=IHioBjUZwmo",
					title: "Campfire [Dark Wood] - D&D living maps (without grid)",
					thumb: "https://i.ytimg.com/vi/IHioBjUZwmo/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=0p66tedVg4w",
					title: "CJG",
					thumb: "https://i.ytimg.com/vi/0p66tedVg4w/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=1azkRvJrOKA",
					title: "2019 01 06 15 58 45",
					thumb: "https://i.ytimg.com/vi/1azkRvJrOKA/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=7FFy6YXPqkI",
					title: "Animated Maps in D20PRO",
					thumb: "https://i.ytimg.com/vi/7FFy6YXPqkI/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=Y6-vLFlP7No",
					title: "Living Battle Map, Looping Beach Test (WIP Learning)",
					thumb: "https://i.ytimg.com/vi/Y6-vLFlP7No/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=wB2FliqY78Y",
					title: "Living Battle Map - Woods 1 (no grid, 1 hr, 1440p)",
					thumb: "https://i.ytimg.com/vi/wB2FliqY78Y/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=XudvtxER6zM",
					title: "Living Battle Map - Bog 0 (no grid, 1 hr, 1440p)",
					thumb: "https://i.ytimg.com/vi/XudvtxER6zM/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=rcpyR4V_roQ",
					title: "Living Battle Map - Swamp 1",
					thumb: "https://i.ytimg.com/vi/rcpyR4V_roQ/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=nl5ojJiTPuI",
					title: "Living Battle Map - Woods 0",
					thumb: "https://i.ytimg.com/vi/nl5ojJiTPuI/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=Uu10ZamLWHo",
					title: "How to make a living battlemap out of a video game",
					thumb: "https://i.ytimg.com/vi/Uu10ZamLWHo/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=Zjhu1tg7CN8",
					title: "City Streets 02 Nightime",
					thumb: "https://i.ytimg.com/vi/Zjhu1tg7CN8/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=pEi7904cXP4",
					title: "Dungeon of Skulls",
					thumb: "https://i.ytimg.com/vi/pEi7904cXP4/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=TeyHcpz0G1s",
					title: "Red rocks Conifer, Desert and Underdark versions",
					thumb: "https://i.ytimg.com/vi/TeyHcpz0G1s/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=dPksluV3p88",
					title: "forest stream foggy day",
					thumb: "https://i.ytimg.com/vi/dPksluV3p88/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=yUoYNWEyMs4",
					title: "river bridge night raining",
					thumb: "https://i.ytimg.com/vi/yUoYNWEyMs4/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=L5ibz83_mC4",
					title: "river bridge midday",
					thumb: "https://i.ytimg.com/vi/L5ibz83_mC4/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=yd_xMLCcrk8",
					title: "river bridge day snow",
					thumb: "https://i.ytimg.com/vi/yd_xMLCcrk8/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=SpheBUliu_A",
					title: "river bridge night snowing",
					thumb: "https://i.ytimg.com/vi/SpheBUliu_A/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=ylDtX4VBlYE",
					title: "river bridge day",
					thumb: "https://i.ytimg.com/vi/ylDtX4VBlYE/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=TzAdDDTYsvs",
					title: "river bridge night",
					thumb: "https://i.ytimg.com/vi/TzAdDDTYsvs/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=rIbDhEhB63M",
					title: "village street day snowing nosound",
					thumb: "https://i.ytimg.com/vi/rIbDhEhB63M/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=crr4aYa5nMg",
					title: "village street day nosound",
					thumb: "https://i.ytimg.com/vi/crr4aYa5nMg/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=93A6mOjhXEM",
					title: "village street midday nosound mp4",
					thumb: "https://i.ytimg.com/vi/93A6mOjhXEM/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=0xzJqjul1UI",
					title: "village street night nosound",
					thumb: "https://i.ytimg.com/vi/0xzJqjul1UI/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=zcSJnYF8n_w",
					title: "village street night snowing nosound",
					thumb: "https://i.ytimg.com/vi/zcSJnYF8n_w/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=cm6ZncW5uYc",
					title: "cathedral road raining",
					thumb: "https://i.ytimg.com/vi/cm6ZncW5uYc/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=PvUwwd_VeUQ",
					title: "cathedral road night",
					thumb: "https://i.ytimg.com/vi/PvUwwd_VeUQ/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=drMjAleiyok",
					title: "cathedral road midday",
					thumb: "https://i.ytimg.com/vi/drMjAleiyok/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=lcJL_9xlRmM",
					title: "cathedral road raining thunder",
					thumb: "https://i.ytimg.com/vi/lcJL_9xlRmM/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=isKm4EKzVc4",
					title: "cathedral road morning",
					thumb: "https://i.ytimg.com/vi/isKm4EKzVc4/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=TfA8jLqGseU",
					title: "swamp raining thunder",
					thumb: "https://i.ytimg.com/vi/TfA8jLqGseU/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=iCelOolFZk4",
					title: "swamp night foggy",
					thumb: "https://i.ytimg.com/vi/iCelOolFZk4/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=SGiYFZxythM",
					title: "swamp day",
					thumb: "https://i.ytimg.com/vi/SGiYFZxythM/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=w3mjfKJVL20",
					title: "swamp night",
					thumb: "https://i.ytimg.com/vi/w3mjfKJVL20/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=McpvYTio-LA",
					title: "village road night",
					thumb: "https://i.ytimg.com/vi/McpvYTio-LA/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=EyHI1qx8J-c",
					title: "village road night raining",
					thumb: "https://i.ytimg.com/vi/EyHI1qx8J-c/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=nagvxWQ_Qbc",
					title: "village road morning",
					thumb: "https://i.ytimg.com/vi/nagvxWQ_Qbc/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=T3HpFOe1Xt8",
					title: "village road midday",
					thumb: "https://i.ytimg.com/vi/T3HpFOe1Xt8/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=WmOOG9_net8",
					title: "village road foggy",
					thumb: "https://i.ytimg.com/vi/WmOOG9_net8/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=4oSkKN1nAOc",
					title: "village road dusk",
					thumb: "https://i.ytimg.com/vi/4oSkKN1nAOc/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=Rpw4cQW0YWI",
					title: "bridge foggy night",
					thumb: "https://i.ytimg.com/vi/Rpw4cQW0YWI/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=Krde6rEVm_A",
					title: "bridge rain",
					thumb: "https://i.ytimg.com/vi/Krde6rEVm_A/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=U0OdsKtB59w",
					title: "bridge rain night",
					thumb: "https://i.ytimg.com/vi/U0OdsKtB59w/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=A7NefEGewFw",
					title: "bridge night",
					thumb: "https://i.ytimg.com/vi/A7NefEGewFw/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=SAtmpRyzYuI",
					title: "bridge dusk",
					thumb: "https://i.ytimg.com/vi/SAtmpRyzYuI/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=cqplpxaSve8",
					title: "bridge day",
					thumb: "https://i.ytimg.com/vi/cqplpxaSve8/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=3SY-ya3trvM",
					title: "bridge day humid",
					thumb: "https://i.ytimg.com/vi/3SY-ya3trvM/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=4YBJC55lo0w",
					title: "house by water night",
					thumb: "https://i.ytimg.com/vi/4YBJC55lo0w/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=8kpyUff7VeQ",
					title: "house by water lightning night",
					thumb: "https://i.ytimg.com/vi/8kpyUff7VeQ/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=zqZxvKrl-FY",
					title: "house by water night raining",
					thumb: "https://i.ytimg.com/vi/zqZxvKrl-FY/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=D8_hrs5w02E",
					title: "house by water dusk",
					thumb: "https://i.ytimg.com/vi/D8_hrs5w02E/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=UFuuPRbQsOk",
					title: "house by water dusk raining",
					thumb: "https://i.ytimg.com/vi/UFuuPRbQsOk/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=lC8pWf-M-Ww",
					title: "house by water day",
					thumb: "https://i.ytimg.com/vi/lC8pWf-M-Ww/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=ZcoLObi_KCE",
					title: "Jungle Day Clear",
					thumb: "https://i.ytimg.com/vi/ZcoLObi_KCE/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=mALmICNF9Ic",
					title: "Jungle Night Foggy",
					thumb: "https://i.ytimg.com/vi/mALmICNF9Ic/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=S88yAbKawmI",
					title: "Jungle Night Clear",
					thumb: "https://i.ytimg.com/vi/S88yAbKawmI/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=w0akIgs1uAk",
					title: "Archipelago Dusk",
					thumb: "https://i.ytimg.com/vi/w0akIgs1uAk/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=OoRUQ5BCiZk",
					title: "Archipelego Day",
					thumb: "https://i.ytimg.com/vi/OoRUQ5BCiZk/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=_fAW0ufeH_Y",
					title: "Lakeside Dusk",
					thumb: "https://i.ytimg.com/vi/_fAW0ufeH_Y/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=ODFsfZk0-ak",
					title: "Lakeside Day",
					thumb: "https://i.ytimg.com/vi/ODFsfZk0-ak/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=YBicTWSP5zk",
					title: "Cathedral",
					thumb: "https://i.ytimg.com/vi/YBicTWSP5zk/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=nuvuAJaq0SI",
					title: "Winter Road Wide 1",
					thumb: "https://i.ytimg.com/vi/nuvuAJaq0SI/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=O9QO35IifRI",
					title: "Winter Road 2",
					thumb: "https://i.ytimg.com/vi/O9QO35IifRI/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=LOXAqWWzj4o",
					title: "Winter Road 1",
					thumb: "https://i.ytimg.com/vi/LOXAqWWzj4o/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=yclC7zEsj58",
					title: "Winter Forest Road Bend Square 2",
					thumb: "https://i.ytimg.com/vi/yclC7zEsj58/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=1y7U3bgtZrU",
					title: "Winter Hillside",
					thumb: "https://i.ytimg.com/vi/1y7U3bgtZrU/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=dO0_3rAr7iM",
					title: "Winter Forest Square 1",
					thumb: "https://i.ytimg.com/vi/dO0_3rAr7iM/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=Kek_c1PtYoc",
					title: "Winter Forest Road Straight Square 3",
					thumb: "https://i.ytimg.com/vi/Kek_c1PtYoc/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=d-4ohU2DBHs",
					title: "Winter Forest Road Bend Square 1",
					thumb: "https://i.ytimg.com/vi/d-4ohU2DBHs/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=TQ2YOm-y6A4",
					title: "Forest",
					thumb: "https://i.ytimg.com/vi/TQ2YOm-y6A4/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=sf4b8Zdo_MM",
					title: "Forest Wide 2",
					thumb: "https://i.ytimg.com/vi/sf4b8Zdo_MM/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=-6qMDdEt9wY",
					title: "Forest Wide 1",
					thumb: "https://i.ytimg.com/vi/-6qMDdEt9wY/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=uVcLeud0764",
					title: "Forest Pathway",
					thumb: "https://i.ytimg.com/vi/uVcLeud0764/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=wFkenD6XbVY",
					title: "Forest Clearing",
					thumb: "https://i.ytimg.com/vi/wFkenD6XbVY/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=fjrdJYlN7PA",
					title: "Winter Road Wide 2",
					thumb: "https://i.ytimg.com/vi/fjrdJYlN7PA/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=9TnY-rSA_Nc",
					title: "Las Vegas Top Left Rotated Night",
					thumb: "https://i.ytimg.com/vi/9TnY-rSA_Nc/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=RNF0jdkTCVI",
					title: "Las Vegas Top Left Rotated Day",
					thumb: "https://i.ytimg.com/vi/RNF0jdkTCVI/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=nL9dvmkQc7w",
					title: "Las Vegas Top Left Night",
					thumb: "https://i.ytimg.com/vi/nL9dvmkQc7w/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=HNPqA5kukfw",
					title: "Las Vegas Top Left Day",
					thumb: "https://i.ytimg.com/vi/HNPqA5kukfw/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=i7kDuY90iPE",
					title: "Ghomorrah Road",
					thumb: "https://i.ytimg.com/vi/i7kDuY90iPE/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=m0uudILe5vs",
					title: "prison camp bottom right",
					thumb: "https://i.ytimg.com/vi/m0uudILe5vs/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=SA-HrjlKN9g",
					title: "prison camp top left",
					thumb: "https://i.ytimg.com/vi/SA-HrjlKN9g/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=QI6eZIlMlZk",
					title: "prison camp bottom left",
					thumb: "https://i.ytimg.com/vi/QI6eZIlMlZk/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=wpBBeJMdlYw",
					title: "prison camp birdseye",
					thumb: "https://i.ytimg.com/vi/wpBBeJMdlYw/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=ijOrsrfU-lM",
					title: "prison camp top right",
					thumb: "https://i.ytimg.com/vi/ijOrsrfU-lM/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=y6sZCNa5eNI",
					title: "playground 1",
					thumb: "https://i.ytimg.com/vi/y6sZCNa5eNI/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=d8KzmK0K5n8",
					title: "Rubble",
					thumb: "https://i.ytimg.com/vi/d8KzmK0K5n8/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=1GLdTjRtsQ8",
					title: "Radar Station",
					thumb: "https://i.ytimg.com/vi/1GLdTjRtsQ8/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=Kt7oVvdhLd0",
					title: "Road Bridge",
					thumb: "https://i.ytimg.com/vi/Kt7oVvdhLd0/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=QlamyVSFJVg",
					title: "River Bridge",
					thumb: "https://i.ytimg.com/vi/QlamyVSFJVg/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=gVT1BPSge2I",
					title: "Jungle Road",
					thumb: "https://i.ytimg.com/vi/gVT1BPSge2I/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=K-F2P7JgXxk",
					title: "Jungle Fort",
					thumb: "https://i.ytimg.com/vi/K-F2P7JgXxk/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=PA7nP7qwEo0",
					title: "Antennae tower",
					thumb: "https://i.ytimg.com/vi/PA7nP7qwEo0/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=jKSStH3z8Ag",
					title: "Docks",
					thumb: "https://i.ytimg.com/vi/jKSStH3z8Ag/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=gI92wgZfB-s",
					title: "Temple",
					thumb: "https://i.ytimg.com/vi/gI92wgZfB-s/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=7xXv_lA-zs0",
					title: "Castle Courtyard",
					thumb: "https://i.ytimg.com/vi/7xXv_lA-zs0/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=Rn2zyCmFTII",
					title: "Castle Courtyard East",
					thumb: "https://i.ytimg.com/vi/Rn2zyCmFTII/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=e4Wre1whFhc",
					title: "Castle Courtyard West",
					thumb: "https://i.ytimg.com/vi/e4Wre1whFhc/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=W7vU-EQzPiM",
					title: "Cave Entrance",
					thumb: "https://i.ytimg.com/vi/W7vU-EQzPiM/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=QEoATRI9Hgg",
					title: "Hut",
					thumb: "https://i.ytimg.com/vi/QEoATRI9Hgg/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=UkT9yqqH5QA",
					title: "Bravil 4",
					thumb: "https://i.ytimg.com/vi/UkT9yqqH5QA/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=ZOeYhAqtBD8",
					title: "Bravil 3",
					thumb: "https://i.ytimg.com/vi/ZOeYhAqtBD8/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=6yTxqpw4lZQ",
					title: "Bravil 2",
					thumb: "https://i.ytimg.com/vi/6yTxqpw4lZQ/hqdefault.jpg",
				},
				{
					player_map: "https://www.youtube.com/watch?v=d_2F98P0y2E",
					title: "Bravil 1",
					thumb: "https://i.ytimg.com/vi/d_2F98P0y2E/hqdefault.jpg",
				},
			]
		},
	];
}






