
function export_free() {
	console.log("----" + window.CURRENT_SCENE_DATA.title + "-----");


	data = "";
	data += "\t\tsnap: \"" + window.CURRENT_SCENE_DATA.snap + "\",\n";
	data += "\t\thpps: \"" + window.CURRENT_SCENE_DATA.hpps + "\",\n";
	data += "\t\tvpps: \"" + window.CURRENT_SCENE_DATA.vpps + "\",\n";
	data += "\t\tfpsq: \"" + window.CURRENT_SCENE_DATA.fpsq + "\",\n";
	data += "\t\toffsetx: \"" + window.CURRENT_SCENE_DATA.offsetx + "\",\n";
	data += "\t\toffsety: \"" + window.CURRENT_SCENE_DATA.offsety + "\",\n";
	data += "\t\tgrid: \"" + window.CURRENT_SCENE_DATA.grid + "\",\n";
	data += "\t\tgrid_subdivided: \"" + window.CURRENT_SCENE_DATA.grid_subdivided + "\",\n";
	console.log(data);
}

function export_ddb() {

	data = "\t\"" + window.CURRENT_SCENE_DATA.uuid + "\": {\n";
	data += "\t\tdm_map_usable: \"" + window.CURRENT_SCENE_DATA.dm_map_usable + "\",\n";
	data += "\t\tsnap: \"" + window.CURRENT_SCENE_DATA.snap + "\",\n";
	data += "\t\thpps: \"" + window.CURRENT_SCENE_DATA.hpps + "\",\n";
	data += "\t\tvpps: \"" + window.CURRENT_SCENE_DATA.vpps + "\",\n";
	data += "\t\tfpsq: \"" + window.CURRENT_SCENE_DATA.fpsq + "\",\n";
	data += "\t\toffsetx: \"" + window.CURRENT_SCENE_DATA.offsetx + "\",\n";
	data += "\t\toffsety: \"" + window.CURRENT_SCENE_DATA.offsety + "\",\n";
	data += "\t\tgrid: \"" + window.CURRENT_SCENE_DATA.grid + "\",\n";
	data += "\t\tgrid_subdivided: \"" + window.CURRENT_SCENE_DATA.grid_subdivided + "\",\n";
	data += "\t\tscale_factor: \"" + window.CURRENT_SCENE_DATA.scale_factor + "\",\n";
	data += "\t},";
	console.log(data);
}


var DDB_EXTRAS =
{
	"wdh//compendium/adventures/wdh/a-friend-in-need/ZhentarimHideout": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "113.33333333333333",
		"vpps": "114",
		"fpsq": "5",
		"offsetx": "109.3333333333334",
		"offsety": "76",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "2"
	},
	"wdh//compendium/adventures/wdh/a-friend-in-need/XanatharGuildHideout": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "116.66666666666667",
		"vpps": "114",
		"fpsq": "5",
		"offsetx": "40.66666666666657",
		"offsety": "4",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "2"
	},
	"wdh//compendium/adventures/wdh/trollskull-alley/AreasintheAlley": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "53.333333333333336",
		"vpps": "52",
		"fpsq": "5",
		"offsetx": "59.99999999999983",
		"offsety": "44",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "4"
	},
	"wdh//compendium/adventures/wdh/fireball/GralhundVilla": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "108.66666666666667",
		"vpps": "108.66666666666667",
		"fpsq": "5",
		"offsetx": "83.99999999999993",
		"offsety": "102.66666666666652",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "2"
	},
	"wdh//compendium/adventures/wdh/dragon-season/AreasoftheAlley": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "106",
		"vpps": "108.66666666666667",
		"fpsq": "5",
		"offsetx": "58",
		"offsety": "83.33333333333327",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "2"
	},
	"wdh//compendium/adventures/wdh/dragon-season/AreasofMistshore": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "66.66666666666667",
		"vpps": "66.66666666666667",
		"fpsq": "5",
		"offsetx": "38.66666666666657",
		"offsety": "49.33333333333323",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "2"
	},
	"wdh//compendium/adventures/wdh/dragon-season/AreasoftheMausoleum": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "113.33333333333333",
		"vpps": "108.66666666666667",
		"fpsq": "5",
		"offsetx": "13.333333333333385",
		"offsety": "95.33333333333326",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "2"
	},
	"wdh//compendium/adventures/wdh/dragon-season/AreasoftheTheater": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "114.66666666666667",
		"vpps": "112",
		"fpsq": "5",
		"offsetx": "81.33333333333323",
		"offsety": "64",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "2"
	},
	"wdh//compendium/adventures/wdh/dragon-season/AreasoftheOldTower": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "93.33333333333333",
		"vpps": "93.33333333333333",
		"fpsq": "5",
		"offsetx": "88.00000000000013",
		"offsety": "60.66666666666673",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "2"
	},
	"wdh//compendium/adventures/wdh/dragon-season/AreasoftheCourthouse": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "110.66666666666667",
		"vpps": "106.66666666666667",
		"fpsq": "5",
		"offsetx": "97.99999999999996",
		"offsety": "42.66666666666663",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "2"
	},
	"wdh//compendium/adventures/wdh/dragon-season/AreasoftheCellarComplex": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "114.66666666666667",
		"vpps": "111.33333333333333",
		"fpsq": "5",
		"offsetx": "82.66666666666659",
		"offsety": "66.00000000000003",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "2"
	},
	"wdh//compendium/adventures/wdh/dragon-season/AreasoftheConvertedWindmill": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "106",
		"vpps": "114",
		"fpsq": "5",
		"offsetx": "98",
		"offsety": "112",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "2"
	},
	"wdh//compendium/adventures/wdh/dragon-season/AreasoftheVault": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "94",
		"vpps": "95.33333333333333",
		"fpsq": "5",
		"offsetx": "148",
		"offsety": "154.6666666666668",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "4"
	},
	"wdh//compendium/adventures/wdh/spring-madness/AreasoftheLair": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "54",
		"vpps": "52.666666666666664",
		"fpsq": "5",
		"offsetx": "4",
		"offsety": "47.33333333333351",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "2"
	},
	"wdh//compendium/adventures/wdh/hell-of-a-summer/AreasoftheVilla": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "72.66666666666667",
		"vpps": "72.66666666666667",
		"fpsq": "5",
		"offsetx": "15.3333333333332",
		"offsety": "29.333333333333087",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "2"
	},
	"wdh//compendium/adventures/wdh/hell-of-a-summer/AreasoftheTemple": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "94.66666666666667",
		"vpps": "92.66666666666667",
		"fpsq": "5",
		"offsetx": "78.66666666666656",
		"offsety": "61.33333333333323",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "2"
	},
	"wdh//compendium/adventures/wdh/maestros-fall/AreasoftheShips": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "104.66666666666667",
		"vpps": "105.33333333333333",
		"fpsq": "5",
		"offsetx": "89.99999999999991",
		"offsety": "59.33333333333351",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "2"
	},
	"wdh//compendium/adventures/wdh/maestros-fall/AreasoftheScarletMarpenoth": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "75.33333333333333",
		"vpps": "73.33333333333333",
		"fpsq": "5",
		"offsetx": "65.33333333333344",
		"offsety": "7.333333333333357",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "1"
	},
	"wdh//compendium/adventures/wdh/winter-wizardry/AreasofKolatTowers": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "96.66666666666667",
		"vpps": "81.33333333333333",
		"fpsq": "5",
		"offsetx": "26.666666666666615",
		"offsety": "56.666666666666885",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "2"
	},
	"wdh//compendium/adventures/wdh/winter-wizardry/AreasoftheSanctum": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "64",
		"vpps": "62.333333333333336",
		"fpsq": "5",
		"offsetx": "10",
		"offsety": "53.99999999999998",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "1"
	},
	"tftyp/a1/the-sunless-citadel/Map11FortressLevel": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 72.66666666666667,
		"vpps": 72.66666666666667,
		"fpsq": "5",
		"offsetx": 46.666666666666515,
		"offsety": 62.66666666666629,
		"grid_subdivided": "0",
		"scale_factor": 2
	},
	"tftyp/a1/the-sunless-citadel/Map12GroveLevel": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 94.66666666666667,
		"vpps": 95.33333333333333,
		"fpsq": "5",
		"offsetx": 36.66666666666649,
		"offsety": 42.000000000000185,
		"grid_subdivided": "0",
		"scale_factor": 2
	},
	"tftyp/a2/the-forge-of-fury/Map22TheMountainDoor": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "74",
		"vpps": "74.66666666666667",
		"fpsq": "5",
		"offsetx": "46",
		"offsety": "51.99999999999994",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "2"
	},
	"tftyp/a2/the-forge-of-fury/Map23TheGlitterhame": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "82.66666666666667",
		"vpps": "82.66666666666667",
		"fpsq": "5",
		"offsetx": "1.999999999999801",
		"offsety": "21.333333333333144",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "2"
	},
	"tftyp/a2/the-forge-of-fury/Map24TheSinkhole": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 96.66666666666667,
		"vpps": 96.66666666666667,
		"fpsq": "5",
		"offsetx": 57.99999999999986,
		"offsety": 31.999999999999915,
		"grid_subdivided": "0",
		"scale_factor": 2
	},
	"tftyp/a2/the-forge-of-fury/Map25TheFoundry": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "80.66666666666667",
		"vpps": "78.66666666666667",
		"fpsq": "5",
		"offsetx": "23.33333333333323",
		"offsety": "21.999999999999915",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "2"
	},
	"tftyp/a2/the-forge-of-fury/Map26TheBlackLake": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 80.66666666666667,
		"vpps": 80.66666666666667,
		"fpsq": "5",
		"offsetx": 75.9999999999999,
		"offsety": 65.33333333333327,
		"grid_subdivided": "0",
		"scale_factor": 2
	},
	"tftyp/a3/the-hidden-shrine-of-tamoachan/Map31TheHiddenShrineofTamoachan": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "65.33333333333333",
		"vpps": "64",
		"fpsq": "5",
		"offsetx": "4.689582056016661e-13",
		"offsety": "12",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "4"
	},
	"tftyp/a4/white-plume-mountain/Map42WhitePlumeMountain": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 90,
		"vpps": 87.33333333333333,
		"fpsq": "5",
		"offsetx": 56,
		"offsety": 148.00000000000026,
		"grid_subdivided": "1",
		"scale_factor": 4
	},
	"tftyp/a4/white-plume-mountain/Map43GeysersandChains": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "102.83333333333333",
		"vpps": "103.16666666666667",
		"fpsq": "5",
		"offsetx": "107.00000000000003",
		"offsety": "152.99999999999994",
		"grid_subdivided": "1",
		"scale_factor": 1
	},
	"tftyp/a4/white-plume-mountain/Map44BoilingLake": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 110,
		"vpps": 111.66666666666667,
		"fpsq": "5",
		"offsetx": 132,
		"offsety": 56.66666666666654,
		"grid_subdivided": "1",
		"scale_factor": 2
	},
	"tftyp/a4/white-plume-mountain/Map45AquariumandPrison": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "74.16666666666667",
		"vpps": "71.83333333333333",
		"fpsq": "5",
		"offsetx": "106.99999999999994",
		"offsety": "103.66666666666674",
		"grid_subdivided": "1",
		"scale_factor": 1
	},
	"tftyp/a5/dead-in-thay/Map51TheDoomvault": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "54.666666666666664",
		"vpps": "54.666666666666664",
		"fpsq": "5",
		"offsetx": "13.333333333333563",
		"offsety": "37.33333333333362",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "4"
	},
	"tftyp/a5/dead-in-thay/Map53AbyssalPrisons": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 73.33333333333333,
		"vpps": 73.33333333333333,
		"fpsq": "5",
		"offsetx": 61.33333333333354,
		"offsety": 102.66666666666683,
		"grid_subdivided": "1",
		"scale_factor": 4
	},
	"tftyp/a5/dead-in-thay/Map54BloodPens": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 74,
		"vpps": 74,
		"fpsq": "5",
		"offsetx": 44,
		"offsety": 12,
		"grid_subdivided": "1",
		"scale_factor": 4
	},
	"tftyp/a5/dead-in-thay/Map55MastersDomain": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "73.33333333333333",
		"vpps": "74.66666666666667",
		"fpsq": "5",
		"offsetx": "40.0000000000002",
		"offsety": "33.33333333333307",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "4"
	},
	"tftyp/a5/dead-in-thay/Map56FarRealmCysts": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "72",
		"vpps": "76",
		"fpsq": "5",
		"offsetx": "52",
		"offsety": "20",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "4"
	},
	"tftyp/a5/dead-in-thay/Map57ForestsofSlaughter": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "74.66666666666667",
		"vpps": "73.33333333333333",
		"fpsq": "5",
		"offsetx": "23.9999999999998",
		"offsety": "25.333333333333556",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "4"
	},
	"tftyp/a5/dead-in-thay/Map58OozeGrottos": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "73.33333333333333",
		"vpps": "73.33333333333333",
		"fpsq": "5",
		"offsetx": "52.000000000000185",
		"offsety": "22.666666666666842",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "4"
	},
	"tftyp/a5/dead-in-thay/Map59PredatorPools": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "73.33333333333333",
		"vpps": "73.33333333333333",
		"fpsq": "5",
		"offsetx": "1.3333333333334139",
		"offsety": "21.333333333333613",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "4"
	},
	"tftyp/a5/dead-in-thay/Map510GolemLaboratories": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "73.33333333333333",
		"vpps": "73.33333333333333",
		"fpsq": "5",
		"offsetx": "29.333333333333584",
		"offsety": "1.3333333333335702",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "4"
	},
	"tftyp/a5/dead-in-thay/Map511TemplesofExtraction": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "73.33333333333333",
		"vpps": "72",
		"fpsq": "5",
		"offsetx": "21.33333333333357",
		"offsety": "32",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "4"
	},
	"tftyp/a6/against-the-giants/Map61HillGiantStrongholdUpperLevel": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "58",
		"vpps": "58.333333333333336",
		"fpsq": "5",
		"offsetx": "74",
		"offsety": "85.33333333333321",
		"grid": "1",
		"grid_subdivided": "1",
		"scale_factor": "2"
	},
	"tftyp/a6/against-the-giants/Map62HillGiantStrongholdDungeonLevel": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "56.666666666666664",
		"vpps": "56",
		"fpsq": "5",
		"offsetx": "110.66666666666673",
		"offsety": "62",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "2"
	},
	"tftyp/a6/against-the-giants/Map63FrostGiantStrongholdUpperLevel": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "54.666666666666664",
		"vpps": "54.666666666666664",
		"fpsq": "5",
		"offsetx": "40.66666666666674",
		"offsety": "1.1368683772161603e-13",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "2"
	},
	"tftyp/a6/against-the-giants/Map64FrostGiantStrongholdLowerLevel": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "59.666666666666664",
		"vpps": "59.666666666666664",
		"fpsq": "5",
		"offsetx": "74.66666666666674",
		"offsety": "60.66666666666677",
		"grid": "1",
		"grid_subdivided": "1",
		"scale_factor": "2"
	},
	"tftyp/a6/against-the-giants/Map65HalloftheFireGiantKingEntranceLevel": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "98.66666666666667",
		"vpps": "98.66666666666667",
		"fpsq": "5",
		"offsetx": "141.33333333333312",
		"offsety": "65.33333333333312",
		"grid": "1",
		"grid_subdivided": "1",
		"scale_factor": "4"
	},
	"tftyp/a6/against-the-giants/Map66HalloftheFireGiantKingSecondLevel": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "54.666666666666664",
		"vpps": "55",
		"fpsq": "5",
		"offsetx": "97.33333333333337",
		"offsety": "40",
		"grid": "1",
		"grid_subdivided": "1",
		"scale_factor": "2"
	},
	"tftyp/a6/against-the-giants/Map67HalloftheFireGiantKingThirdLevel": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "54.666666666666664",
		"vpps": "54.666666666666664",
		"fpsq": "5",
		"offsetx": "9.333333333333442",
		"offsety": "6.666666666666799",
		"grid": "1",
		"grid_subdivided": "1",
		"scale_factor": "2"
	},
	"tftyp/a7/tomb-of-horrors/Map71TombofHorrors": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "59",
		"vpps": "59.666666666666664",
		"fpsq": "5",
		"offsetx": "24",
		"offsety": "2.6666666666667993",
		"grid": "1",
		"grid_subdivided": "1",
		"scale_factor": "2"
	},
	"cm/the-joy-of-extradimensional-spaces/MapMap201fistandiasmansion": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "96",
		"vpps": "96",
		"fpsq": "5",
		"offsetx": "66",
		"offsety": "41",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"cm/mazfroths-mighty-digressions/MapMap301amberdunehideout": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "168.33333333333334",
		"vpps": "170",
		"fpsq": "5",
		"offsetx": "131.3333333333333",
		"offsety": "139",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"cm/book-of-the-raven/MapMap401chaletbrantifax": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "67.66666666666667",
		"vpps": "67.33333333333333",
		"fpsq": "5",
		"offsetx": "13.9999999999999",
		"offsety": "26.333333333333414",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"cm/book-of-the-raven/MapMap402harrnmausoleum": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "171",
		"vpps": "170",
		"fpsq": "5",
		"offsetx": "164",
		"offsety": "54",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"cm/a-deep-and-creeping-darkness/MapMap501vermeillon": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 116.66666666666667,
		"vpps": 116,
		"fpsq": "5",
		"offsetx": 104.66666666666656,
		"offsety": 112,
		"grid_subdivided": "0",
		"scale_factor": 2
	},
	"cm/a-deep-and-creeping-darkness/MapMap502mayorduvezinshouse": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "121.33333333333333",
		"vpps": "121.66666666666667",
		"fpsq": "5",
		"offsetx": "30.33333333333337",
		"offsety": "119.66666666666659",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "1"
	},
	"cm/a-deep-and-creeping-darkness/MapMap503platinummine": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "116.66666666666667",
		"vpps": "116.66666666666667",
		"fpsq": "5",
		"offsetx": "104.6666666666665",
		"offsety": "47.99999999999987",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "2"
	},
	"cm/shemshimes-bedtime-rhyme/MapMap601fireflycellar": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "101.33333333333333",
		"vpps": "100.66666666666667",
		"fpsq": "5",
		"offsetx": "70.66666666666676",
		"offsety": "3.333333333333215",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "2"
	},
	"cm/the-price-of-beauty/MapMap701templeoftherestfullily": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "64",
		"vpps": "64.33333333333333",
		"fpsq": "5",
		"offsetx": "7",
		"offsety": "23.000000000000085",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "1"
	},
	"cm/the-price-of-beauty/MapMap702templeoftherestfullily": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "69.66666666666667",
		"vpps": "69.66666666666667",
		"fpsq": "5",
		"offsetx": "11.9999999999999",
		"offsety": "14.999999999999943",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "1"
	},
	"cm/book-of-cylinders/MapMap802temple": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "93.66666666666667",
		"vpps": "93.33333333333333",
		"fpsq": "5",
		"offsetx": "131.99999999999991",
		"offsety": "174.0000000000001",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "2"
	},
	"cm/sarah-of-yellowcrest-manor/MapMap902templeoftheburnttonguecult": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "71",
		"vpps": "70.66666666666667",
		"fpsq": "5",
		"offsetx": "30",
		"offsety": "62.333333333333286",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "1"
	},
	"cm/lore-of-lurue/MapMap1001hagshovel": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "102.33333333333333",
		"vpps": "102.33333333333333",
		"fpsq": "5",
		"offsetx": "96.33333333333337",
		"offsety": "22.6666666666667",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "1"
	},
	"cm/lore-of-lurue/MapMap1002poolofeternalspring": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "66",
		"vpps": "66",
		"fpsq": "5",
		"offsetx": "53",
		"offsety": "39",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "1"
	},
	"cm/kandlekeep-dekonstruktion/MapMap1101thebarndoor": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "84.33333333333333",
		"vpps": "85",
		"fpsq": "5",
		"offsetx": "47.333333333333414",
		"offsety": "30",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "1"
	},
	"cm/kandlekeep-dekonstruktion/MapMap1101underthebarndoor": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "110.66666666666667",
		"vpps": "110.66666666666667",
		"fpsq": "5",
		"offsetx": "18.6666666666666",
		"offsety": "33.33333333333327",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "2"
	},
	"cm/zikrans-zephyrean-tome/MapMap1201zikranslaboratory": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "97.33333333333333",
		"vpps": "97.66666666666667",
		"fpsq": "5",
		"offsetx": "96.66666666666676",
		"offsety": "69.99999999999997",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "1"
	},
	"cm/zikrans-zephyrean-tome/MapMap1202cloudgiantskeep": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "57",
		"vpps": "57",
		"fpsq": "5",
		"offsetx": "4",
		"offsety": "40",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "2"
	},
	"cm/the-curious-tale-of-wisteria-vale/MapMap1302themanor": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "80.33333333333333",
		"vpps": "80.33333333333333",
		"fpsq": "5",
		"offsetx": "13.0000000000001",
		"offsety": "9.000000000000043",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "1"
	},
	"cm/the-book-of-inner-alchemy/MapMap1401templeoftheimmortallotus": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "85.33333333333333",
		"vpps": "85.33333333333333",
		"fpsq": "5",
		"offsetx": "80.66666666666684",
		"offsety": "54.66666666666676",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "2"
	},
	"cm/the-canopic-being/MapMap1501tombofvalinsarnaster": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "78",
		"vpps": "78",
		"fpsq": "5",
		"offsetx": "100",
		"offsety": "4",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "4"
	},
	"cm/the-scriveners-tale/MapMap1601havenoftheredquill": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "61.666666666666664",
		"vpps": "61.333333333333336",
		"fpsq": "5",
		"offsetx": "50.33333333333342",
		"offsety": "47.33333333333329",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "1"
	},
	"cm/alkazaars-appendix/MapMap1701haruun": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "78.33333333333333",
		"vpps": "78.33333333333333",
		"fpsq": "5",
		"offsetx": "21.000000000000057",
		"offsety": "39.0000000000001",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "1"
	},
	"cm/alkazaars-appendix/MapMap1702necropolismastaba": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "60.666666666666664",
		"vpps": "61.333333333333336",
		"fpsq": "5",
		"offsetx": "44.00000000000003",
		"offsety": "33.333333333333165",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "2"
	},
	"cm/xanthoria/MapMap1801lykorthaexpanse": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "54.666666666666664",
		"vpps": "54.666666666666664",
		"fpsq": "5",
		"offsetx": "26.66666666666677",
		"offsety": "65.3333333333334",
		"grid": "1",
		"grid_subdivided": "1",
		"scale_factor": "2"
	},
	"idrotf/caer-dineval/MapMap14caerdinevalkeep": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 83.66666666666667,
		"vpps": 83.33333333333333,
		"fpsq": "5",
		"offsetx": 132.66666666666643,
		"offsety": 25.333333333333485,
		"grid_subdivided": "1",
		"scale_factor": 2
	},
	"idrotf/caer-konig/MapMap16duergaroutpost": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 104,
		"vpps": 104.33333333333333,
		"fpsq": "5",
		"offsetx": 132,
		"offsety": 48.000000000000114,
		"grid_subdivided": "1",
		"scale_factor": 2
	},
	"idrotf/dougans-hole/MapMap18frostgiant": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 104,
		"vpps": 104.33333333333333,
		"fpsq": "5",
		"offsetx": 132,
		"offsety": 120.00000000000011,
		"grid_subdivided": "1",
		"scale_factor": 2
	},
	"idrotf/easthaven/MapMap110cauldron": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 104,
		"vpps": 104,
		"fpsq": "5",
		"offsetx": 132,
		"offsety": 60,
		"grid_subdivided": "1",
		"scale_factor": 2
	},
	"idrotf/easthaven/MapMap111easthaventownhall": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "83.66666666666667",
		"vpps": "83.66666666666667",
		"fpsq": "5",
		"offsetx": "75.33333333333321",
		"offsety": "51.99999999999994",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"idrotf/good-mead/MapMap113verbeeglair": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "104.33333333333333",
		"vpps": "104.33333333333333",
		"fpsq": "5",
		"offsetx": "92.66666666666676",
		"offsety": "24.3333333333334",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "1"
	},
	"idrotf/lonelywood/MapMap115elventomb": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "104",
		"vpps": "104",
		"fpsq": "5",
		"offsetx": "11",
		"offsety": "30",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "1"
	},
	"idrotf/targos/MapMap117kelvinscairn": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "104.33333333333333",
		"vpps": "103.66666666666667",
		"fpsq": "5",
		"offsetx": "14.000000000000028",
		"offsety": "80.33333333333331",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"idrotf/termalaine/MapMap119gemmine": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "103.66666666666667",
		"vpps": "104",
		"fpsq": "5",
		"offsetx": "76.66666666666654",
		"offsety": "29",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"idrotf/places-of-interest/MapMap22angajuksbell": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "115.66666666666667",
		"vpps": "115.33333333333333",
		"fpsq": "5",
		"offsetx": "60.66666666666666",
		"offsety": "63.00000000000006",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"idrotf/places-of-interest/MapMap23blackcabin": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "115.66666666666667",
		"vpps": "115.33333333333333",
		"fpsq": "5",
		"offsetx": "64.99999999999997",
		"offsety": "86.66666666666674",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"idrotf/places-of-interest/MapMap24cacklingchasm": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "115.66666666666667",
		"vpps": "115.66666666666667",
		"fpsq": "5",
		"offsetx": "63.99999999999996",
		"offsety": "87.99999999999994",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"idrotf/places-of-interest/MapMap25berserkers": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 115.66666666666667,
		"vpps": 115.66666666666667,
		"fpsq": "5",
		"offsetx": 160.66666666666657,
		"offsety": 157.9999999999999,
		"grid_subdivided": "1",
		"scale_factor": 2
	},
	"idrotf/places-of-interest/MapMap26darkduchess": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "104",
		"vpps": "104",
		"fpsq": "5",
		"offsetx": "43",
		"offsety": "29",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "1"
	},
	"idrotf/places-of-interest/MapMap27idascendant": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "104",
		"vpps": "104",
		"fpsq": "5",
		"offsetx": "66",
		"offsety": "29",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"idrotf/places-of-interest/MapMap28jarlmoot": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 115.66666666666667,
		"vpps": 115.66666666666667,
		"fpsq": "5",
		"offsetx": 122.6666666666666,
		"offsety": 109.33333333333326,
		"grid_subdivided": "1",
		"scale_factor": 2
	},
	"idrotf/places-of-interest-continued/MapMap29karkolohk": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 103.66666666666667,
		"vpps": 103.66666666666667,
		"fpsq": "5",
		"offsetx": 137.3333333333331,
		"offsety": 113.33333333333317,
		"grid_subdivided": "1",
		"scale_factor": 2
	},
	"idrotf/places-of-interest-continued/MapMap210lostspire": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "103.66666666666667",
		"vpps": "104",
		"fpsq": "5",
		"offsetx": "102.99999999999994",
		"offsety": "29",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"idrotf/places-of-interest-continued/Map211reghedcamp": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 116,
		"vpps": 115.66666666666667,
		"fpsq": "5",
		"offsetx": 112,
		"offsety": 33.999999999999915,
		"grid_subdivided": "1",
		"scale_factor": 2
	},
	"idrotf/places-of-interest-continued/MapMap212revelsend": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 87.66666666666667,
		"vpps": 87.33333333333333,
		"fpsq": "5",
		"offsetx": 87.33333333333317,
		"offsety": 82.00000000000023,
		"grid_subdivided": "1",
		"scale_factor": 2
	},
	"idrotf/places-of-interest-continued/MapMap213skytowershelter": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 115.66666666666667,
		"vpps": 115.66666666666667,
		"fpsq": "5",
		"offsetx": 91.99999999999991,
		"offsety": 97.99999999999989,
		"grid_subdivided": "1",
		"scale_factor": 2
	},
	"idrotf/places-of-interest-continued/MapMap214wyrmdoomcrag": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 115.66666666666667,
		"vpps": 115.66666666666667,
		"fpsq": "5",
		"offsetx": 122.6666666666666,
		"offsety": 69.99999999999994,
		"grid_subdivided": "1",
		"scale_factor": 2
	},
	"idrotf/sunblight/MapMap31sunblight": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "87.66666666666667",
		"vpps": "87.66666666666667",
		"fpsq": "5",
		"offsetx": "110.66666666666649",
		"offsety": "117.33333333333294",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "2"
	},
	"idrotf/aurils-abode/MapMap52grimskalle": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "87.66666666666667",
		"vpps": "88",
		"fpsq": "5",
		"offsetx": "80.6666666666664",
		"offsety": "166",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "2"
	},
	"idrotf/caves-of-hunger/MapMap61cavesofhunger": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "104",
		"vpps": "106.66666666666667",
		"fpsq": "5",
		"offsetx": "78",
		"offsety": "69.99999999999974",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "2"
	},
	"idrotf/doom-of-ythryn/MapMap73spireofiriolarthas": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 104,
		"vpps": 104.66666666666667,
		"fpsq": "5",
		"offsetx": 14,
		"offsety": 36.666666666666515,
		"grid_subdivided": "0",
		"scale_factor": 2
	},
	"gos/the-sinister-secret-of-saltmarsh/GroundFloor": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "140",
		"vpps": "140.33333333333334",
		"fpsq": "5",
		"offsetx": "137",
		"offsety": "16.666666666666373",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"gos/the-sinister-secret-of-saltmarsh/TheCellar": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "150",
		"vpps": "148.66666666666666",
		"fpsq": "5",
		"offsetx": "119",
		"offsety": "68.33333333333351",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"gos/the-sinister-secret-of-saltmarsh/ShipLocations": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "166.66666666666666",
		"vpps": "163.66666666666666",
		"fpsq": "5",
		"offsetx": "59.33333333333343",
		"offsety": "112.66666666666688",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "1"
	},
	"gos/danger-at-dunwater/LairLocations": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "115.33333333333333",
		"vpps": "116.33333333333333",
		"fpsq": "5",
		"offsetx": "126.00000000000028",
		"offsety": "112.00000000000011",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "2"
	},
	"gos/salvage-operation/StateoftheShip": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 90.66666666666667,
		"vpps": 91.33333333333333,
		"fpsq": "5",
		"offsetx": 23.333333333333215,
		"offsety": 22.000000000000085,
		"grid_subdivided": "0",
		"scale_factor": 2
	},
	"gos/isle-of-the-abbey/LocationsintheRuins": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "109",
		"vpps": "108.5",
		"fpsq": "5",
		"offsetx": "6",
		"offsety": "15",
		"grid_subdivided": "1",
		"scale_factor": 1
	},
	"gos/the-final-enemy/FortressLevel1": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 112.66666666666667,
		"vpps": 113.33333333333333,
		"fpsq": "5",
		"offsetx": 115.33333333333314,
		"offsety": 198.66666666666686,
		"grid_subdivided": "1",
		"scale_factor": 2
	},
	"gos/the-final-enemy/FortressLevel2": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 114,
		"vpps": 114,
		"fpsq": "5",
		"offsetx": 84,
		"offsety": 204,
		"grid_subdivided": "1",
		"scale_factor": 2
	},
	"gos/the-final-enemy/FortressLevel3": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 91,
		"vpps": 90.66666666666667,
		"fpsq": "5",
		"offsetx": 26,
		"offsety": 118.66666666666637,
		"grid_subdivided": "1",
		"scale_factor": 2
	},
	"gos/tammerauts-fate/IslandApproachandFirstFloor": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 64.66666666666667,
		"vpps": 65,
		"fpsq": "5",
		"offsetx": 70.66666666666654,
		"offsety": 80,
		"grid_subdivided": "1",
		"scale_factor": 2
	},
	"gos/tammerauts-fate/SecondFloor": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 67.66666666666667,
		"vpps": 67.66666666666667,
		"fpsq": "5",
		"offsetx": 41.3333333333332,
		"offsety": 49.33333333333326,
		"grid_subdivided": "1",
		"scale_factor": 2
	},
	"gos/tammerauts-fate/UpperLevelsandCellar": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 67.66666666666667,
		"vpps": 67.66666666666667,
		"fpsq": "5",
		"offsetx": 5.333333333333201,
		"offsety": 35.33333333333326,
		"grid_subdivided": "1",
		"scale_factor": 2
	},
	"gos/tammerauts-fate/TheRemainsofTammeraut": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "71.66666666666667",
		"vpps": "72",
		"fpsq": "5",
		"offsetx": "54.66666666666663",
		"offsety": "47",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"gos/the-styes/MrDorysWarehouse": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 83.33333333333333,
		"vpps": 82.66666666666667,
		"fpsq": "5",
		"offsetx": 40.00000000000017,
		"offsety": 32.66666666666657,
		"grid_subdivided": "0",
		"scale_factor": 2
	},
	"gos/the-styes/TempleofTharizdun": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 106.66666666666667,
		"vpps": 107.33333333333333,
		"fpsq": "5",
		"offsetx": 105.99999999999996,
		"offsety": 86.00000000000007,
		"grid_subdivided": "0",
		"scale_factor": 2
	},
	"gos/the-styes/LandgravesFolly": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 118,
		"vpps": 118,
		"fpsq": "5",
		"offsetx": 36,
		"offsety": 24,
		"grid_subdivided": "0",
		"scale_factor": 2
	},
	"bgdia/a-tale-of-two-cities/Map12ElfsongTavern": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "216.66666666666666",
		"vpps": "216.66666666666666",
		"fpsq": "5",
		"offsetx": "60.3333333333334",
		"offsety": "57.00000000000006",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"bgdia/a-tale-of-two-cities/Map13DungeonoftheDeadThree": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "92.66666666666667",
		"vpps": "92.66666666666667",
		"fpsq": "5",
		"offsetx": "90.99999999999982",
		"offsety": "91.33333333333324",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"bgdia/a-tale-of-two-cities/Map14TheLowLantern": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "176.33333333333334",
		"vpps": "176.33333333333334",
		"fpsq": "5",
		"offsetx": "125.3333333333332",
		"offsety": "35.66666666666657",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"bgdia/a-tale-of-two-cities/Map15VanthampurVilla": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "139.33333333333334",
		"vpps": "139.66666666666666",
		"fpsq": "5",
		"offsetx": "67.99999999999983",
		"offsety": "32.33333333333346",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"bgdia/a-tale-of-two-cities/Map16UndertheVilla": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "92.66666666666667",
		"vpps": "92.66666666666667",
		"fpsq": "5",
		"offsetx": "85.33333333333319",
		"offsety": "88.66666666666657",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"bgdia/elturel-has-fallen/Map22HighHallCathedral": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "63.833333333333336",
		"vpps": "63.666666666666664",
		"fpsq": "5",
		"offsetx": "123.66666666666656",
		"offsety": "3.000000000000071",
		"grid_subdivided": "1",
		"scale_factor": 1
	},
	"bgdia/elturel-has-fallen/Map23HighHallCathedralChoirLevel": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "95",
		"vpps": "94.83333333333333",
		"fpsq": "5",
		"offsetx": "152",
		"offsety": "135.6666666666668",
		"grid_subdivided": "1",
		"scale_factor": 1
	},
	"bgdia/elturel-has-fallen/Map24HighHallCatacombs": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "70",
		"vpps": "70",
		"fpsq": "5",
		"offsetx": "64",
		"offsety": "31",
		"grid_subdivided": "1",
		"scale_factor": 1
	},
	"bgdia/elturel-has-fallen/Map25GrandCemeteryChapel": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "131.33333333333334",
		"vpps": "131.33333333333334",
		"fpsq": "5",
		"offsetx": "128.99999999999986",
		"offsety": "100.33333333333314",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"bgdia/elturel-has-fallen/Map26GrandCemeteryOssuarylevel": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "115.66666666666667",
		"vpps": "116",
		"fpsq": "5",
		"offsetx": "72.99999999999993",
		"offsety": "68",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"bgdia/avernus/Map32HellwaspNest": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "127.66666666666667",
		"vpps": "127.66666666666667",
		"fpsq": "5",
		"offsetx": "127.3333333333332",
		"offsety": "121.99999999999996",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"bgdia/avernus-path-of-demons/Map33CryptoftheHellriders": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "135.33333333333334",
		"vpps": "135.33333333333334",
		"fpsq": "5",
		"offsetx": "73.99999999999986",
		"offsety": "90.33333333333323",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"bgdia/avernus-path-of-devils/Map34BoneBrambles": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "140",
		"vpps": "140.33333333333334",
		"fpsq": "5",
		"offsetx": "7",
		"offsety": "133.66666666666654",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"bgdia/avernus-path-of-devils/Map35BelsForge": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "127.66666666666667",
		"vpps": "127.66666666666667",
		"fpsq": "5",
		"offsetx": "0.6666666666665435",
		"offsety": "122.33333333333326",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"bgdia/avernus-path-of-devils/Map36WreckedFlyingFortressCommandDeck": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "220",
		"vpps": "219.66666666666666",
		"fpsq": "5",
		"offsetx": "217",
		"offsety": "15.333333333333428",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"bgdia/avernus-other-locations/Map37StyxWatchtower": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "154.66666666666666",
		"vpps": "154.66666666666666",
		"fpsq": "5",
		"offsetx": "146.66666666666683",
		"offsety": "148.33333333333343",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"bgdia/sword-of-zariel/Map41SideViewoftheScab": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "63.833333333333336",
		"vpps": "63.833333333333336",
		"fpsq": "5",
		"offsetx": "55.333333333333215",
		"offsety": "123.33333333333324",
		"grid_subdivided": "1",
		"scale_factor": 1
	},
	"bgdia/sword-of-zariel/Map42Idyllglen": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "61.5",
		"vpps": "61.5",
		"fpsq": "5",
		"offsetx": "116",
		"offsety": "117",
		"grid_subdivided": "1",
		"scale_factor": 1
	},
	"doip/axeholm/0d2eedb7-cee0-4bcd-a445-fbd0d6fdda87": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": 87.33333333333333,
		"vpps": 87.33333333333333,
		"fpsq": "5",
		"offsetx": 5.333333333333442,
		"offsety": 3.333333333333428,
		"grid_subdivided": "0",
		"scale_factor": 2
	},
	"doip/butterskull-ranch/12eaa85d-dd64-4bbe-99c5-a660e029c07a": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 88,
		"vpps": 87.33333333333333,
		"fpsq": "5",
		"offsetx": 74,
		"offsety": 4.000000000000085,
		"grid_subdivided": "0",
		"scale_factor": 2
	},
	"doip/circle-of-thunder/4a8517d3-f5af-4c2b-8a47-f210cbdae661": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 87.33333333333333,
		"vpps": 87.33333333333333,
		"fpsq": "5",
		"offsetx": 10.666666666666828,
		"offsety": 6.0000000000000995,
		"grid_subdivided": "0",
		"scale_factor": 2
	},
	"doip/dragon-barrow/d8a69ae3-26bb-45a1-84a8-d1eab89ed4ee": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 87.33333333333333,
		"vpps": 87.33333333333333,
		"fpsq": "5",
		"offsetx": 12.666666666666828,
		"offsety": 6.666666666666771,
		"grid_subdivided": "0",
		"scale_factor": 2
	},
	"doip/dwarven-excavation/ee20f030-d55e-4a3e-8d73-11f9a72e6050": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 87.33333333333333,
		"vpps": 88,
		"fpsq": "5",
		"offsetx": 12.00000000000017,
		"offsety": 80,
		"grid_subdivided": "0",
		"scale_factor": 2
	},
	"doip/falcons-hunting-lodge/5963ce4b-3f8e-40fd-995d-d3945d5160d0": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 87.33333333333333,
		"vpps": 87.33333333333333,
		"fpsq": "5",
		"offsetx": 12.666666666666828,
		"offsety": 6.666666666666771,
		"grid_subdivided": "0",
		"scale_factor": 2
	},
	"doip/gnomengarde/042e7635-2a67-4e63-a3db-f3be2f8ef196": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 87.33333333333333,
		"vpps": 87.33333333333333,
		"fpsq": "5",
		"offsetx": 12.666666666666828,
		"offsety": 6.666666666666771,
		"grid_subdivided": "0",
		"scale_factor": 2
	},
	"doip/icespire-hold/0f2c0fab-acf0-4ead-b0bd-bbe81fe0d7bc": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 87.33333333333333,
		"vpps": 87.33333333333333,
		"fpsq": "5",
		"offsetx": 10.0000000000001,
		"offsety": 5.333333333333428,
		"grid_subdivided": "0",
		"scale_factor": 2
	},
	"doip/loggers-camp/ef6f9147-7f71-4264-9b1b-8ae71c692bee": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 87.33333333333333,
		"vpps": 87.33333333333333,
		"fpsq": "5",
		"offsetx": 12.666666666666828,
		"offsety": 6.666666666666771,
		"grid_subdivided": "0",
		"scale_factor": 2
	},
	"doip/mountains-toe-gold-mine/e5452780-b937-4daa-b691-e2eb1cef20ae": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 87.33333333333333,
		"vpps": 87.33333333333333,
		"fpsq": "5",
		"offsetx": 9.333333333333442,
		"offsety": 4.000000000000057,
		"grid_subdivided": "0",
		"scale_factor": 2
	},
	"doip/shrine-of-savras/8f88d766-e58c-4926-88ac-906a9be34a69": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 87.33333333333333,
		"vpps": 87.33333333333333,
		"fpsq": "5",
		"offsetx": 10.000000000000156,
		"offsety": 6.000000000000114,
		"grid_subdivided": "0",
		"scale_factor": 2
	},
	"doip/tower-of-storms/04ef565c-828a-4ca9-a8eb-392ffbbf7431": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 87.33333333333333,
		"vpps": 87.33333333333333,
		"fpsq": "5",
		"offsetx": 12.666666666666828,
		"offsety": 4.666666666666771,
		"grid_subdivided": "0",
		"scale_factor": 2
	},
	"doip/umbrage-hill/aba731bc-4950-4a05-886e-200f920bd687": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 87.33333333333333,
		"vpps": 87.33333333333333,
		"fpsq": "5",
		"offsetx": 12.666666666666828,
		"offsety": 6.666666666666771,
		"grid_subdivided": "0",
		"scale_factor": 2
	},
	"doip/woodland-manse/96f5f33c-db89-443a-9441-660679edc173": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 87.33333333333333,
		"vpps": 87.33333333333333,
		"fpsq": "5",
		"offsetx": 12.666666666666828,
		"offsety": 6.000000000000085,
		"grid_subdivided": "0",
		"scale_factor": 2
	},
	"slw/attack-on-the-wayside-inn/Map2WaysideInn": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "86",
		"vpps": "86",
		"fpsq": "5",
		"offsetx": "37",
		"offsety": "25",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"slw/aid-from-phandalin/Map4BacklotinTown": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "135.66666666666666",
		"vpps": "135.66666666666666",
		"fpsq": "5",
		"offsetx": "59.3333333333334",
		"offsety": "40.33333333333343",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"slw/foul-weather-at-wayside/Map5WaysideInn": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "86",
		"vpps": "86",
		"fpsq": "5",
		"offsetx": "37",
		"offsety": "25",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"slw/house-of-thalivar/Map6RuinedTowerLeilon": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "85.66666666666667",
		"vpps": "86",
		"fpsq": "5",
		"offsetx": "43.33333333333324",
		"offsety": "25",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"slw/missing-patrol/Map7LizardfolkCamp": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "86",
		"vpps": "86.33333333333333",
		"fpsq": "5",
		"offsetx": "37",
		"offsety": "22.00000000000003",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"slw/thunder-cliffs/Map8CavernsatThunderCliffs": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "85.66666666666667",
		"vpps": "86",
		"fpsq": "5",
		"offsetx": "41.99999999999993",
		"offsety": "26",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"sdw/bronze-shrine/Map3CavernswithBahamutShrine": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "86",
		"vpps": "86",
		"fpsq": "5",
		"offsetx": "37",
		"offsety": "30",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"sdw/death-knight-dreadnaught/Map5DeathknightDreadnaught": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "86",
		"vpps": "86",
		"fpsq": "5",
		"offsetx": "38",
		"offsety": "25",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"sdw/iniarvs-tower/Map6RuinsofIniarvsTower": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "86",
		"vpps": "86",
		"fpsq": "5",
		"offsetx": "36",
		"offsety": "25",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"sdw/leilon-point/Map7LeilonPointFarmingCommunity": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 86,
		"vpps": 86,
		"fpsq": "5",
		"offsetx": 74,
		"offsety": 50,
		"grid_subdivided": "1",
		"scale_factor": 2
	},
	"dc/dumathoins-gulch/Map3DumathoinsGulch": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "136",
		"vpps": "135.66666666666666",
		"fpsq": "5",
		"offsetx": "56",
		"offsety": "40.66666666666677",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"dc/ebondeaths-mausoleum/Map4EbondeathsMausoleum": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 86,
		"vpps": 86,
		"fpsq": "5",
		"offsetx": 74,
		"offsety": 50,
		"grid_subdivided": "1",
		"scale_factor": 2
	},
	"dc/icingdeath-and-twinkle/Map5IcingdeathandTwinkle": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "86",
		"vpps": "86",
		"fpsq": "5",
		"offsetx": "37",
		"offsety": "24",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"dc/storm-lords-hideout/Map6StormLordsHideout": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "86",
		"vpps": "86",
		"fpsq": "5",
		"offsetx": "37",
		"offsety": "25",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"dc/thalivars-beacon/Map7ThalivarsBeacon": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "86",
		"vpps": "86",
		"fpsq": "5",
		"offsetx": "37",
		"offsety": "25",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"ddvram/introduction/Map11TheLostDungeonofRickedness": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "61",
		"vpps": "61",
		"fpsq": "5",
		"offsetx": "56",
		"offsety": "30",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"imr/construction-of-horrors/Map31TheTombofHorrorsunderconstruction": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "64",
		"vpps": "68",
		"fpsq": "5",
		"offsetx": "12",
		"offsety": "48",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "2"
	},
	"imr/temple-of-moloch/Map41TempleofMoloch": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "115.66666666666667",
		"vpps": "116",
		"fpsq": "5",
		"offsetx": "98.66666666666652",
		"offsety": "220",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "2"
	},
	"lr/the-darkening/Map1UmberleesMaw": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "92",
		"vpps": "92",
		"fpsq": "5",
		"offsetx": "12",
		"offsety": "16",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "4"
	},
	"wa/frozen-sick/59CroakerCave": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "70",
		"vpps": "70.66666666666667",
		"fpsq": "5",
		"offsetx": "9",
		"offsety": "9.333333333333272",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "1"
	},
	"wdotmm//compendium/adventures/wdotmm/dungeon-level/ExploringThisLevel": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 52,
		"vpps": 52,
		"fpsq": "5",
		"offsetx": 72,
		"offsety": 60,
		"grid_subdivided": "1",
		"scale_factor": 4
	},
	"wdotmm//compendium/adventures/wdotmm/arcane-chambers/ExploringThisLevel": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 52,
		"vpps": 52,
		"fpsq": "5",
		"offsetx": 72,
		"offsety": 84,
		"grid_subdivided": "1",
		"scale_factor": 4
	},
	"wdotmm//compendium/adventures/wdotmm/sargauth-level/ExploringThisLevel": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 39.333333333333336,
		"vpps": 39.333333333333336,
		"fpsq": "5",
		"offsetx": 45.33333333333306,
		"offsety": 7.999999999999687,
		"grid_subdivided": "1",
		"scale_factor": 4
	},
	"wdotmm//compendium/adventures/wdotmm/wyllowwood/ExploringThisLevel": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "43.333333333333336",
		"vpps": "43.333333333333336",
		"fpsq": "5",
		"offsetx": "27.999999999999815",
		"offsety": "29.333333333333",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "4"
	},
	"wdotmm//compendium/adventures/wdotmm/twisted-caverns/ExploringThisLevel": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 68,
		"vpps": 68,
		"fpsq": "5",
		"offsetx": 76,
		"offsety": 128,
		"grid_subdivided": "1",
		"scale_factor": 4
	},
	"wdotmm//compendium/adventures/wdotmm/lost-level/ExploringThisLevel": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 68.66666666666667,
		"vpps": 68,
		"fpsq": "5",
		"offsetx": 34.6666666666664,
		"offsety": 48,
		"grid_subdivided": "1",
		"scale_factor": 4
	},
	"wdotmm//compendium/adventures/wdotmm/maddgoths-castle/TheCaverns": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 76,
		"vpps": 76,
		"fpsq": "5",
		"offsetx": 60,
		"offsety": 16,
		"grid_subdivided": "1",
		"scale_factor": 4
	},
	"wdotmm//compendium/adventures/wdotmm/slitherswamp/ExploringThisLevel": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 68.66666666666667,
		"vpps": 68.66666666666667,
		"fpsq": "5",
		"offsetx": 30.666666666666345,
		"offsety": 18.66666666666626,
		"grid_subdivided": "1",
		"scale_factor": 4
	},
	"wdotmm//compendium/adventures/wdotmm/dweomercore/ExploringThisLevel": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 68.66666666666667,
		"vpps": 68,
		"fpsq": "5",
		"offsetx": 33.33333333333306,
		"offsety": 24,
		"grid_subdivided": "1",
		"scale_factor": 4
	},
	"wdotmm//compendium/adventures/wdotmm/muirals-gauntlet/ExploringThisLevel": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "42.666666666666664",
		"vpps": "43.333333333333336",
		"fpsq": "5",
		"offsetx": "2.666666666666927",
		"offsety": "50.66666666666633",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "4"
	},
	"wdotmm//compendium/adventures/wdotmm/troglodyte-warrens/ExploringThisLevel": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 68.66666666666667,
		"vpps": 68,
		"fpsq": "5",
		"offsetx": 35.999999999999716,
		"offsety": 32,
		"grid_subdivided": "1",
		"scale_factor": 4
	},
	"wdotmm//compendium/adventures/wdotmm/maze-level/ExploringThisLevel": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 76,
		"vpps": 76,
		"fpsq": "5",
		"offsetx": 60,
		"offsety": 8,
		"grid_subdivided": "1",
		"scale_factor": 4
	},
	"wdotmm//compendium/adventures/wdotmm/trobriands-graveyard/ExploringThisLevel": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 58,
		"vpps": 58,
		"fpsq": "5",
		"offsetx": 64,
		"offsety": 56,
		"grid_subdivided": "1",
		"scale_factor": 4
	},
	"wdotmm//compendium/adventures/wdotmm/arcturiadoom/ExploringThisLevel": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 76,
		"vpps": 76,
		"fpsq": "5",
		"offsetx": 60,
		"offsety": 88,
		"grid_subdivided": "1",
		"scale_factor": 4
	},
	"wdotmm//compendium/adventures/wdotmm/obstacle-course/ExploringThisLevel": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 76,
		"vpps": 76,
		"fpsq": "5",
		"offsetx": 60,
		"offsety": 80,
		"grid_subdivided": "1",
		"scale_factor": 4
	},
	"wdotmm//compendium/adventures/wdotmm/crystal-labyrinth/CrystalDungeon": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 76,
		"vpps": 76,
		"fpsq": "5",
		"offsetx": 60,
		"offsety": 80,
		"grid_subdivided": "1",
		"scale_factor": 4
	},
	"wdotmm//compendium/adventures/wdotmm/seadeeps/ExploringThisLevel": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 76,
		"vpps": 76,
		"fpsq": "5",
		"offsetx": 60,
		"offsety": 8,
		"grid_subdivided": "1",
		"scale_factor": 4
	},
	"wdotmm//compendium/adventures/wdotmm/vanrakdoom/ExploringThisLevel": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 76,
		"vpps": 76,
		"fpsq": "5",
		"offsetx": 60,
		"offsety": 92,
		"grid_subdivided": "1",
		"scale_factor": 4
	},
	"wdotmm//compendium/adventures/wdotmm/caverns-of-ooze/ExploringThisLevel": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 76,
		"vpps": 76,
		"fpsq": "5",
		"offsetx": 60,
		"offsety": 132,
		"grid_subdivided": "1",
		"scale_factor": 4
	},
	"wdotmm//compendium/adventures/wdotmm/runestone-caverns/RunestoneCaverns": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "76",
		"vpps": "76",
		"fpsq": "5",
		"offsetx": "60",
		"offsety": "28",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "4"
	},
	"wdotmm//compendium/adventures/wdotmm/terminus-level/ExploringThisLevel": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 76,
		"vpps": 76,
		"fpsq": "5",
		"offsetx": 60,
		"offsety": 96,
		"grid_subdivided": "1",
		"scale_factor": 4
	},
	"wdotmm//compendium/adventures/wdotmm/shadowdusk-hold/ExploringThisLevel": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 76,
		"vpps": 76,
		"fpsq": "5",
		"offsetx": 60,
		"offsety": 80,
		"grid_subdivided": "1",
		"scale_factor": 4
	},
	"wdotmm//compendium/adventures/wdotmm/mad-wizards-lair/TheDungeon": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "76",
		"vpps": "76",
		"fpsq": "5",
		"offsetx": "100",
		"offsety": "80",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "4"
	},
	"toa//compendium/adventures/toa/port-nyanzaru/087caf69-49e8-42e8-a7ae-d56faa7496fc": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 77.33333333333333,
		"vpps": 77.33333333333333,
		"fpsq": "5",
		"offsetx": 39.33333333333357,
		"offsety": 19.3333333333335,
		"grid_subdivided": "0",
		"scale_factor": 2
	},
	"toa//compendium/adventures/toa/the-land-of-chult/4580d9b9-1852-4c36-b9b9-118a851d3736": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "64.66666666666667",
		"vpps": "65",
		"fpsq": "5",
		"offsetx": "17.999999999999915",
		"offsety": "5",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"toa//compendium/adventures/toa/the-land-of-chult/ed54c4e1-124e-47bf-af30-f8645f21bde9": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 116,
		"vpps": 115.33333333333333,
		"fpsq": "5",
		"offsetx": 30,
		"offsety": 58.00000000000006,
		"grid_subdivided": "0",
		"scale_factor": 2
	},
	"toa//compendium/adventures/toa/the-land-of-chult/0b979d07-bd6a-42a1-9f04-9faa28b7c59d": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 116,
		"vpps": 115.33333333333333,
		"fpsq": "5",
		"offsetx": 32,
		"offsety": 52.666666666666714,
		"grid_subdivided": "0",
		"scale_factor": 2
	},
	"toa//compendium/adventures/toa/the-land-of-chult/bc0870fb-83d9-492e-8d7c-a748dd3afa51": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 86.66666666666667,
		"vpps": 87.33333333333333,
		"fpsq": "5",
		"offsetx": 147.9999999999998,
		"offsety": 138.66666666666686,
		"grid_subdivided": "1",
		"scale_factor": 4
	},
	"toa//compendium/adventures/toa/the-land-of-chult/db63c203-a532-464c-a278-5a0dd93e5bdf": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 86,
		"vpps": 86,
		"fpsq": "5",
		"offsetx": 26,
		"offsety": 46,
		"grid_subdivided": "0",
		"scale_factor": 2
	},
	"toa//compendium/adventures/toa/the-land-of-chult/da76051f-0c8e-42cb-b849-96d68ec60a55": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "105.33333333333333",
		"vpps": "105.33333333333333",
		"fpsq": "5",
		"offsetx": "9.333333333333513",
		"offsety": "36.0000000000001",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "2"
	},
	"toa//compendium/adventures/toa/the-land-of-chult/372b7163-58f5-4f6c-8214-21cba3216090": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "86.66666666666667",
		"vpps": "87.33333333333333",
		"fpsq": "5",
		"offsetx": "151.99999999999972",
		"offsety": "140.00000000000014",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "4"
	},
	"toa//compendium/adventures/toa/the-land-of-chult/44e59e8b-f6b0-410c-b8c8-bbcf176f0751": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 94,
		"vpps": 94,
		"fpsq": "5",
		"offsetx": 70,
		"offsety": 66,
		"grid_subdivided": "0",
		"scale_factor": 2
	},
	"toa//compendium/adventures/toa/the-land-of-chult/b38ade36-5038-453c-a2e5-d458584557ed": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 55,
		"vpps": 55,
		"fpsq": "5",
		"offsetx": 56,
		"offsety": 30,
		"grid_subdivided": "1",
		"scale_factor": 2
	},
	"toa//compendium/adventures/toa/the-land-of-chult/074382c5-9162-4ca9-a14c-470af824be42": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 108,
		"vpps": 108,
		"fpsq": "5",
		"offsetx": 60,
		"offsety": 48,
		"grid_subdivided": "0",
		"scale_factor": 2
	},
	"toa//compendium/adventures/toa/the-land-of-chult/62be9739-7146-407b-9c9d-1c05f296f74c": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 104.66666666666667,
		"vpps": 104,
		"fpsq": "5",
		"offsetx": 27.333333333333286,
		"offsety": 98,
		"grid_subdivided": "0",
		"scale_factor": 2
	},
	"toa//compendium/adventures/toa/the-land-of-chult/8c811658-a658-45b7-9c25-10e5c62c6ad2": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 106,
		"vpps": 105.33333333333333,
		"fpsq": "5",
		"offsetx": 52,
		"offsety": 59.3333333333334,
		"grid_subdivided": "0",
		"scale_factor": 2
	},
	"toa//compendium/adventures/toa/the-land-of-chult/8ccbbb8f-b724-4493-850c-0d859b2fd0c6": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 90.66666666666667,
		"vpps": 91.33333333333333,
		"fpsq": "5",
		"offsetx": 75.33333333333321,
		"offsety": 84.66666666666674,
		"grid_subdivided": "0",
		"scale_factor": 2
	},
	"toa//compendium/adventures/toa/the-land-of-chult/b17416d3-95c5-46c4-851d-9554054e3694": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 118,
		"vpps": 118,
		"fpsq": "5",
		"offsetx": 40,
		"offsety": 74,
		"grid_subdivided": "0",
		"scale_factor": 2
	},
	"toa//compendium/adventures/toa/dwellers-of-the-forbidden-city/a458e5a1-c662-4867-8c4b-d2c5634ba71a": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 100,
		"vpps": 100,
		"fpsq": "5",
		"offsetx": 52,
		"offsety": 36,
		"grid_subdivided": "0",
		"scale_factor": 2
	},
	"toa//compendium/adventures/toa/fane-of-the-night-serpent/ef4daa3b-45e8-4db6-ae07-dc8300525b6e": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 104,
		"vpps": 104,
		"fpsq": "5",
		"offsetx": 44,
		"offsety": 52,
		"grid_subdivided": "0",
		"scale_factor": 2
	},
	"toa//compendium/adventures/toa/tomb-of-the-nine-gods/fc80987d-e2ff-4732-9b4c-79027a202ba8": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 84,
		"vpps": 84,
		"fpsq": "5",
		"offsetx": 70,
		"offsety": 14,
		"grid_subdivided": "0",
		"scale_factor": 2
	},
	"toa//compendium/adventures/toa/tomb-of-the-nine-gods/88a61192-e5dd-4173-8550-d976d4dc93a0": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 98,
		"vpps": 98,
		"fpsq": "5",
		"offsetx": 24,
		"offsety": 40,
		"grid_subdivided": "0",
		"scale_factor": 2
	},
	"toa//compendium/adventures/toa/tomb-of-the-nine-gods/ed7f9f13-8ee6-466e-bb45-9dad30e89adb": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 98,
		"vpps": 97.33333333333333,
		"fpsq": "5",
		"offsetx": 28,
		"offsety": 59.33333333333346,
		"grid_subdivided": "0",
		"scale_factor": 2
	},
	"toa//compendium/adventures/toa/tomb-of-the-nine-gods/8590339f-c40c-428b-a9d8-0cf3b27ccbeb": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 86.66666666666667,
		"vpps": 87.33333333333333,
		"fpsq": "5",
		"offsetx": 78.66666666666654,
		"offsety": 36.66666666666677,
		"grid_subdivided": "0",
		"scale_factor": 2
	},
	"toa//compendium/adventures/toa/tomb-of-the-nine-gods/6398ec29-308b-4a7b-bf9b-cc6a71a1a636": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 86,
		"vpps": 86.66666666666667,
		"fpsq": "5",
		"offsetx": 54,
		"offsety": 57.999999999999915,
		"grid_subdivided": "0",
		"scale_factor": 2
	},
	"toa//compendium/adventures/toa/tomb-of-the-nine-gods/862761ea-d303-40b9-9f00-8a7568d11d3a": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 98,
		"vpps": 98,
		"fpsq": "5",
		"offsetx": 24,
		"offsety": 42,
		"grid_subdivided": "0",
		"scale_factor": 2
	},
	"skt//compendium/adventures/skt/a-great-upheaval/Map11Nightstone": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 77.33333333333333,
		"vpps": 77.33333333333333,
		"fpsq": "5",
		"offsetx": 146.6666666666669,
		"offsety": 85.3333333333336,
		"grid_subdivided": "1",
		"scale_factor": 4
	},
	"skt//compendium/adventures/skt/a-great-upheaval/Map12DrippingCaves": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 105.33333333333333,
		"vpps": 105.33333333333333,
		"fpsq": "5",
		"offsetx": 96.0000000000001,
		"offsety": 84.66666666666673,
		"grid_subdivided": "0",
		"scale_factor": 2
	},
	"skt//compendium/adventures/skt/a-great-upheaval/Map13TowerofZephyros": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": 55,
		"vpps": 55.333333333333336,
		"fpsq": "5",
		"offsetx": 92,
		"offsety": 32.66666666666654,
		"grid_subdivided": "0",
		"scale_factor": 2
	},
	"skt//compendium/adventures/skt/rumblings/Map22Goldenfields": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": 71.33333333333333,
		"vpps": 78.33333333333333,
		"fpsq": "5",
		"offsetx": 11.333333333333599,
		"offsety": 114.0000000000002,
		"grid_subdivided": "0",
		"scale_factor": 2
	},
	"skt//compendium/adventures/skt/the-savage-frontier/Map314OldTower": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": 59,
		"vpps": 59.666666666666664,
		"fpsq": "5",
		"offsetx": 48,
		"offsety": 118,
		"grid_subdivided": "0",
		"scale_factor": 2
	},
	"skt//compendium/adventures/skt/the-chosen-path/Map41EyeoftheAllFather": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "44",
		"vpps": "43.666666666666664",
		"fpsq": "5",
		"offsetx": "112",
		"offsety": "28.00000000000034",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "4"
	},
	"skt//compendium/adventures/skt/the-chosen-path/Map43DragonCultAirship": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 90.66666666666667,
		"vpps": 87.33333333333333,
		"fpsq": "5",
		"offsetx": 21.3333333333333,
		"offsety": 26.666666666666686,
		"grid_subdivided": "0",
		"scale_factor": 2
	},
	"skt//compendium/adventures/skt/den-of-the-hill-giants/Map51GruddHaug": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": 48.666666666666664,
		"vpps": 49.333333333333336,
		"fpsq": "5",
		"offsetx": 48.00000000000021,
		"offsety": 5.333333333333016,
		"grid_subdivided": "0",
		"scale_factor": 4
	},
	"skt//compendium/adventures/skt/canyon-of-the-stone-giants/Map61DeadstoneCleft": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 56.666666666666664,
		"vpps": 56.666666666666664,
		"fpsq": "5",
		"offsetx": 53.33333333333351,
		"offsety": 1.3333333333335702,
		"grid_subdivided": "1",
		"scale_factor": 4
	},
	"skt//compendium/adventures/skt/berg-of-the-frost-giants/Map71Svardborg": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "26.333333333333332",
		"vpps": "26.333333333333332",
		"fpsq": "5",
		"offsetx": "82.66666666666683",
		"offsety": "69.33333333333357",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "4"
	},
	"skt//compendium/adventures/skt/berg-of-the-frost-giants/Map72SvardborgLodges": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": 52,
		"vpps": 52.666666666666664,
		"fpsq": "5",
		"offsetx": 88,
		"offsety": 12.000000000000256,
		"grid_subdivided": "0",
		"scale_factor": 4
	},
	"skt//compendium/adventures/skt/berg-of-the-frost-giants/Map73Krigvind": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": 82.66666666666667,
		"vpps": 81.33333333333333,
		"fpsq": "5",
		"offsetx": 22.666666666666416,
		"offsety": 20.000000000000156,
		"grid_subdivided": "0",
		"scale_factor": 4
	},
	"skt//compendium/adventures/skt/forge-of-the-fire-giants/Map81Ironslag": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": 53.333333333333336,
		"vpps": 53.333333333333336,
		"fpsq": "5",
		"offsetx": 15.999999999999801,
		"offsety": 21.333333333333087,
		"grid_subdivided": "0",
		"scale_factor": 4
	},
	"skt//compendium/adventures/skt/forge-of-the-fire-giants/Map82IronslagLowerLevel": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 48.666666666666664,
		"vpps": 48.666666666666664,
		"fpsq": "5",
		"offsetx": 94.66666666666688,
		"offsety": 76.00000000000011,
		"grid_subdivided": "1",
		"scale_factor": 4
	},
	"skt//compendium/adventures/skt/castle-of-the-cloud-giants/Map91LynArmaalLevel1": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": 50,
		"vpps": 50,
		"fpsq": "5",
		"offsetx": 76,
		"offsety": 92,
		"grid_subdivided": "0",
		"scale_factor": 4
	},
	"skt//compendium/adventures/skt/castle-of-the-cloud-giants/Map92LynArmaalLevels26": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "50",
		"vpps": "50.666666666666664",
		"fpsq": "5",
		"offsetx": "76",
		"offsety": "40.00000000000031",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "4"
	},
	"skt//compendium/adventures/skt/hold-of-the-storm-giants/Map101MaelstromLevels1and2": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "52.666666666666664",
		"vpps": "53.333333333333336",
		"fpsq": "5",
		"offsetx": "21.33333333333347",
		"offsety": "61.333333333333115",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "4"
	},
	"skt//compendium/adventures/skt/hold-of-the-storm-giants/Map102MaelstromLevel3": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 58.666666666666664,
		"vpps": 59.333333333333336,
		"fpsq": "5",
		"offsetx": 2.6666666666668277,
		"offsety": 97.33333333333321,
		"grid_subdivided": "1",
		"scale_factor": 4
	},
	"skt//compendium/adventures/skt/caught-in-the-tentacles/Map111TheGrandDame": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 77.33333333333333,
		"vpps": 76.66666666666667,
		"fpsq": "5",
		"offsetx": 74.66666666666677,
		"offsety": 146.6666666666666,
		"grid_subdivided": "1",
		"scale_factor": 4
	},
	"skt//compendium/adventures/skt/caught-in-the-tentacles/Map112TheMorkoth": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "81.33333333333333",
		"vpps": "78.66666666666667",
		"fpsq": "5",
		"offsetx": "38.66666666666681",
		"offsety": "63.99999999999987",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "4"
	},
	"skt//compendium/adventures/skt/doom-of-the-desert/Map121IymrithsLair": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "52.666666666666664",
		"vpps": "53.333333333333336",
		"fpsq": "5",
		"offsetx": "37.3333333333335",
		"offsety": "43.99999999999969",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "4"
	},
	"rot/the-sea-of-moving-ice/Map101ArauthatorsIcebergandLair": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "56.888888888888886",
		"vpps": "56.44444444444445",
		"fpsq": "5",
		"offsetx": "151.33333333333348",
		"offsety": "53.999999999999716",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "2"
	},
	"rot/death-to-the-wyrmspeakers/Map121NeronvainsStronghold": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "64",
		"vpps": "63.333333333333336",
		"fpsq": "5",
		"offsetx": "90",
		"offsety": "13",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "1"
	},
	"rot/death-to-the-wyrmspeakers/Map31TombofDiderius": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 94.33333333333333,
		"vpps": 88.66666666666667,
		"fpsq": "5",
		"offsetx": 40.00000000000023,
		"offsety": 157.99999999999977,
		"grid_subdivided": "1",
		"scale_factor": 2
	},
	"rot/xonthals-tower/Map151XonthalsTower": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 57.666666666666664,
		"vpps": 57,
		"fpsq": "5",
		"offsetx": 20.666666666666785,
		"offsety": 56,
		"grid_subdivided": "1",
		"scale_factor": 2
	},
	"rot/tiamats-return/Map171TheWellofDragons": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "31",
		"vpps": "31",
		"fpsq": "5",
		"offsetx": "4",
		"offsety": "0",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "4"
	},
	"rot/tiamats-return/Map172TiamatsTemple": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 54.666666666666664,
		"vpps": 54.666666666666664,
		"fpsq": "5",
		"offsetx": 93.33333333333346,
		"offsety": 26.66666666666687,
		"grid_subdivided": "1",
		"scale_factor": 4
	},
	"pota//compendium/adventures/pota/secret-of-the-sumber-hills/Map31FeathergaleSpire": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "91.66666666666667",
		"vpps": "91.33333333333333",
		"fpsq": "5",
		"offsetx": "18.666666666666572",
		"offsety": "106.66666666666688",
		"grid": "1",
		"grid_subdivided": "1",
		"scale_factor": "2"
	},
	"pota//compendium/adventures/pota/secret-of-the-sumber-hills/Map33RivergardKeep": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 92,
		"vpps": 92,
		"fpsq": "5",
		"offsetx": 36,
		"offsety": 40,
		"grid_subdivided": "1",
		"scale_factor": 4
	},
	"pota//compendium/adventures/pota/secret-of-the-sumber-hills/Map34SacredStoneMonastery": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 54.333333333333336,
		"vpps": 54.666666666666664,
		"fpsq": "5",
		"offsetx": 96.66666666666661,
		"offsety": 12.000000000000043,
		"grid_subdivided": "1",
		"scale_factor": 2
	},
	"pota//compendium/adventures/pota/secret-of-the-sumber-hills/Map35ScarletMoonHall": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 80,
		"vpps": 80,
		"fpsq": "5",
		"offsetx": 76,
		"offsety": 64,
		"grid_subdivided": "1",
		"scale_factor": 4
	},
	"pota//compendium/adventures/pota/air-earth-fire-and-water/Map41TempleofHowlingHatred": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 55,
		"vpps": 55,
		"fpsq": "5",
		"offsetx": 48,
		"offsety": 108,
		"grid_subdivided": "1",
		"scale_factor": 2
	},
	"pota//compendium/adventures/pota/air-earth-fire-and-water/Map42TempleoftheCrushingWave": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 55,
		"vpps": 55,
		"fpsq": "5",
		"offsetx": 0,
		"offsety": 0,
		"grid_subdivided": "1",
		"scale_factor": 2
	},
	"pota//compendium/adventures/pota/air-earth-fire-and-water/Map43TempleofBlackEarth": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 55,
		"vpps": 55,
		"fpsq": "5",
		"offsetx": 108,
		"offsety": 108,
		"grid_subdivided": "1",
		"scale_factor": 2
	},
	"pota//compendium/adventures/pota/air-earth-fire-and-water/Map44TempleofEternalFlame": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 55,
		"vpps": 55,
		"fpsq": "5",
		"offsetx": 82,
		"offsety": 0,
		"grid_subdivided": "1",
		"scale_factor": 2
	},
	"pota//compendium/adventures/pota/temple-of-the-elder-elemental-eye/Map55TheWeepingColossus": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 98.66666666666667,
		"vpps": 100,
		"fpsq": "5",
		"offsetx": 177.3333333333333,
		"offsety": 160,
		"grid_subdivided": "1",
		"scale_factor": 4
	},
	"pota//compendium/adventures/pota/temple-of-the-elder-elemental-eye/Map51FaneoftheEye": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 55,
		"vpps": 55,
		"fpsq": "5",
		"offsetx": 102,
		"offsety": 92,
		"grid_subdivided": "1",
		"scale_factor": 2
	},
	"pota//compendium/adventures/pota/temple-of-the-elder-elemental-eye/Map52HowlingCaves": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 65.33333333333333,
		"vpps": 65.33333333333333,
		"fpsq": "5",
		"offsetx": 44.000000000000256,
		"offsety": 92.00000000000014,
		"grid_subdivided": "1",
		"scale_factor": 4
	},
	"pota//compendium/adventures/pota/temple-of-the-elder-elemental-eye/Map53ThePlungingTorrents": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": 92,
		"vpps": 92.66666666666667,
		"fpsq": "5",
		"offsetx": 120,
		"offsety": 131.99999999999977,
		"grid_subdivided": "1",
		"scale_factor": 4
	},
	"pota//compendium/adventures/pota/temple-of-the-elder-elemental-eye/Map54TheBlackGeode": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 94,
		"vpps": 94,
		"fpsq": "5",
		"offsetx": 36,
		"offsety": 76,
		"grid_subdivided": "1",
		"scale_factor": 4
	},
	"pota//compendium/adventures/pota/alarums-and-excursions/Map62NecromancersCave": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 56.666666666666664,
		"vpps": 56.666666666666664,
		"fpsq": "5",
		"offsetx": 24.00000000000007,
		"offsety": 93.33333333333351,
		"grid_subdivided": "1",
		"scale_factor": 4
	},
	"pota//compendium/adventures/pota/alarums-and-excursions/Map63TombofMovingStones": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 66,
		"vpps": 66,
		"fpsq": "5",
		"offsetx": 120,
		"offsety": 48,
		"grid_subdivided": "1",
		"scale_factor": 4
	},
	"pota//compendium/adventures/pota/alarums-and-excursions/Map65DellmonRanch": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 55.666666666666664,
		"vpps": 55.333333333333336,
		"fpsq": "5",
		"offsetx": 21.33333333333337,
		"offsety": 85.33333333333329,
		"grid_subdivided": "1",
		"scale_factor": 2
	},
	"pota//compendium/adventures/pota/alarums-and-excursions/Map66TheBarrowMound": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 51,
		"vpps": 50.666666666666664,
		"fpsq": "5",
		"offsetx": 100,
		"offsety": 88.00000000000001,
		"grid_subdivided": "1",
		"scale_factor": 2
	},
	"pota//compendium/adventures/pota/alarums-and-excursions/Map67ShrineoftheTenderOath": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 86,
		"vpps": 86,
		"fpsq": "5",
		"offsetx": 72,
		"offsety": 12,
		"grid_subdivided": "1",
		"scale_factor": 4
	},
	"oota//compendium/adventures/oota/into-darkness/Map22TheHookHorrorLair": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "64.83333333333333",
		"vpps": "64.83333333333333",
		"fpsq": "5",
		"offsetx": "46.66666666666683",
		"offsety": "62.33333333333337",
		"grid_subdivided": "1",
		"scale_factor": 1
	},
	"oota//compendium/adventures/oota/into-darkness/Map23TheOozingTemple": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "128.66666666666666",
		"vpps": "128.66666666666666",
		"fpsq": "5",
		"offsetx": "34.00000000000014",
		"offsety": "60.33333333333343",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"oota//compendium/adventures/oota/into-darkness/Map24TheLostTomb": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "111.33333333333333",
		"vpps": "111.33333333333333",
		"fpsq": "5",
		"offsetx": "9.666666666666742",
		"offsety": "141.6666666666667",
		"grid_subdivided": "1",
		"scale_factor": 1
	},
	"oota//compendium/adventures/oota/the-darklake/Map31Sloobludop": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 71.33333333333333,
		"vpps": 71.33333333333333,
		"fpsq": "5",
		"offsetx": 62.666666666667,
		"offsety": 62.66666666666691,
		"grid_subdivided": "1",
		"scale_factor": 2
	},
	"oota//compendium/adventures/oota/gracklstugh/Map43LairoftheSpiderKing": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 90.66666666666667,
		"vpps": 90.66666666666667,
		"fpsq": "5",
		"offsetx": 43.9999999999999,
		"offsety": 58.6666666666666,
		"grid_subdivided": "0",
		"scale_factor": 4
	},
	"oota//compendium/adventures/oota/gracklstugh/Map44GrayGhostGarden": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": 66.66666666666667,
		"vpps": 66.66666666666667,
		"fpsq": "5",
		"offsetx": 46.666666666666515,
		"offsety": 23.99999999999993,
		"grid_subdivided": "0",
		"scale_factor": 4
	},
	"oota//compendium/adventures/oota/gracklstugh/Map45CultistPens": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 85.33333333333333,
		"vpps": 85.33333333333333,
		"fpsq": "5",
		"offsetx": 5.333333333333414,
		"offsety": 74.66666666666677,
		"grid_subdivided": "0",
		"scale_factor": 4
	},
	"oota//compendium/adventures/oota/gracklstugh/Map46CultistHideout": {
		"dm_map_usable": "0",
		"snap": "0",
		"hpps": "56",
		"vpps": "57.333333333333336",
		"fpsq": "5",
		"offsetx": "8",
		"offsety": "13.333333333333293",
		"grid": "0",
		"grid_subdivided": "0",
		"scale_factor": "4"
	},
	"oota//compendium/adventures/oota/gracklstugh/Map47ObeliskChamber": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 86.66666666666667,
		"vpps": 86.66666666666667,
		"fpsq": "5",
		"offsetx": 63.9999999999999,
		"offsety": 29.33333333333323,
		"grid_subdivided": "0",
		"scale_factor": 4
	},
	"oota//compendium/adventures/oota/neverlight-grove/Map51NeverlightGrove": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 112.66666666666667,
		"vpps": 112.66666666666667,
		"fpsq": "5",
		"offsetx": 107.33333333333317,
		"offsety": 106.66666666666654,
		"grid_subdivided": "1",
		"scale_factor": 2
	},
	"oota//compendium/adventures/oota/the-wormwrithings/Map131TroglodyteLair": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 87,
		"vpps": 87,
		"fpsq": "5",
		"offsetx": 56,
		"offsety": 88,
		"grid_subdivided": "1",
		"scale_factor": 2
	},
	"oota//compendium/adventures/oota/the-wormwrithings/Map132TheWormNursery": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 88.33333333333333,
		"vpps": 88.66666666666667,
		"fpsq": "5",
		"offsetx": 141.33333333333354,
		"offsety": 81.99999999999983,
		"grid_subdivided": "1",
		"scale_factor": 2
	},
	"lmop/goblin-arrows/Map11CragmawHideout": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "164.66666666666666",
		"vpps": "165.33333333333334",
		"fpsq": "5",
		"offsetx": "159.0000000000002",
		"offsety": "149.33333333333323",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"lmop/phandalin/Map22RedbrandHideout": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "164.66666666666666",
		"vpps": "164.66666666666666",
		"fpsq": "5",
		"offsetx": "6.000000000000028",
		"offsety": "158.66666666666674",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"lmop/the-spiders-web/Map31RuinsofThundertree": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "82.33333333333333",
		"vpps": "82.33333333333333",
		"fpsq": "5",
		"offsetx": "1.000000000000142",
		"offsety": "162.66666666666674",
		"grid_subdivided": "1",
		"scale_factor": 1
	},
	"lmop/the-spiders-web/Map32CragmawCastle": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "157.66666666666666",
		"vpps": "157.66666666666666",
		"fpsq": "5",
		"offsetx": "109.33333333333343",
		"offsety": "69.00000000000011",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"lmop/wave-echo-cave/Map41WaveEchoCave": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "66.5",
		"vpps": "66.5",
		"fpsq": "5",
		"offsetx": "18",
		"offsety": "16",
		"grid_subdivided": "1",
		"scale_factor": 1
	},
	"hotdq/dragon-hatchery/Map31DragonHatchery": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "66",
		"vpps": "66",
		"fpsq": "5",
		"offsetx": "54",
		"offsety": "12",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"hotdq/construction-ahead/Map51CarnathRoadhouse": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "93",
		"vpps": "92.33333333333333",
		"fpsq": "5",
		"offsetx": "55",
		"offsety": "46.666666666666714",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"hotdq/castle-naerytar/Map61CastleNaerytarGroundLevel": {
		"dm_map_usable": "0",
		"snap": "1",
		"hpps": "63.833333333333336",
		"vpps": "63.833333333333336",
		"fpsq": "5",
		"offsetx": "97.33333333333323",
		"offsety": "73.99999999999991",
		"grid": "1",
		"grid_subdivided": "0",
		"scale_factor": "2"
	},
	"hotdq/castle-naerytar/Map62CastleNaerytarLevel2": {
		"dm_map_usable": "0",
		"snap": "1",
		"hpps": "64.5",
		"vpps": "64.33333333333333",
		"fpsq": "5",
		"offsetx": "20",
		"offsety": "6.66666666666697",
		"grid": "1",
		"grid_subdivided": "0",
		"scale_factor": "2"
	},
	"hotdq/castle-naerytar/Map63CastleNaerytarLevel3": {
		"dm_map_usable": "0",
		"snap": "1",
		"hpps": "62.333333333333336",
		"vpps": "62.166666666666664",
		"fpsq": "5",
		"offsetx": "3.3333333333332575",
		"offsety": "242.66666666666674",
		"grid": "1",
		"grid_subdivided": "0",
		"scale_factor": "2"
	},
	"hotdq/castle-naerytar/Map64CastleNaerytarDungeon": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 95.33333333333333,
		"vpps": 95.66666666666667,
		"fpsq": "5",
		"offsetx": 30.6666666666668,
		"offsety": 21.33333333333323,
		"grid_subdivided": "1",
		"scale_factor": 2
	},
	"hotdq/hunting-lodge/Map71HuntingLodgeGroundFloor": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "77.66666666666667",
		"vpps": "77",
		"fpsq": "5",
		"offsetx": "54.99999999999996",
		"offsety": "73",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"hotdq/hunting-lodge/Map72HuntingLodgeUpperFloor": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "90.33333333333333",
		"vpps": "90.33333333333333",
		"fpsq": "5",
		"offsetx": "63.3333333333334",
		"offsety": "43.66666666666674",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"hotdq/castle-in-the-clouds/Map81Parnast": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 88.66666666666667,
		"vpps": 88.66666666666667,
		"fpsq": "5",
		"offsetx": 6.666666666666515,
		"offsety": 135.99999999999986,
		"grid_subdivided": "1",
		"scale_factor": 4
	},
	"hotdq/castle-in-the-clouds/Map82SkyreachCastle": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": 58.666666666666664,
		"vpps": 59.333333333333336,
		"fpsq": "5",
		"offsetx": 26.000000000000078,
		"offsety": 3.3333333333331154,
		"grid_subdivided": "0",
		"scale_factor": 2
	},
	"cos/the-lands-of-barovia/Map22TserPoolEncampment": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 66.66666666666667,
		"vpps": 66.66666666666667,
		"fpsq": "5",
		"offsetx": 5.999999999999929,
		"offsety": 40.66666666666664,
		"grid_subdivided": "0",
		"scale_factor": 2
	},
	"cos/the-village-of-barovia/Map32Church": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "71.66666666666667",
		"vpps": "71.66666666666667",
		"fpsq": "5",
		"offsetx": "57.66666666666657",
		"offsety": "1.6666666666666288",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"cos/castle-ravenloft/MapTrapsinAreaK73": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "68.33333333333333",
		"vpps": "66.33333333333333",
		"fpsq": "5",
		"offsetx": "9.333333333333357",
		"offsety": "22.6666666666667",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"cos/the-town-of-vallaki/Map52BlueWaterInnAreaN2": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "74",
		"vpps": "74.33333333333333",
		"fpsq": "5",
		"offsetx": "52",
		"offsety": "49.00000000000014",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"cos/the-town-of-vallaki/Map53BurgomastersMansionAreaN3": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "63.333333333333336",
		"vpps": "63.666666666666664",
		"fpsq": "5",
		"offsetx": "26.666666666666657",
		"offsety": "56.33333333333338",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"cos/the-town-of-vallaki/Map54WachterhausAreaN4": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "75.66666666666667",
		"vpps": "75.66666666666667",
		"fpsq": "5",
		"offsetx": "65.99999999999997",
		"offsety": "64.99999999999994",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"cos/the-town-of-vallaki/Map55CoffinMakersShopAreaN6": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 74,
		"vpps": 74.66666666666667,
		"fpsq": "5",
		"offsetx": 38,
		"offsety": 54.66666666666664,
		"grid_subdivided": "0",
		"scale_factor": 2
	},
	"cos/the-town-of-vallaki/Map56VistaniCampAreaN9": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": 69,
		"vpps": 69,
		"fpsq": "5",
		"offsetx": 116,
		"offsety": 126,
		"grid_subdivided": "1",
		"scale_factor": 2
	},
	"cos/old-bonegrinder/Map61OldBonegrinderAreaO": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "84.33333333333333",
		"vpps": "84.66666666666667",
		"fpsq": "5",
		"offsetx": "50.3333333333334",
		"offsety": "63.66666666666666",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"cos/argynvostholt/Map71ArgynvostholtAreaQ": {
		"dm_map_usable": "1",
		"snap": "0",
		"hpps": "72",
		"vpps": "71.83333333333333",
		"fpsq": "5",
		"offsetx": "99",
		"offsety": "134.33333333333346",
		"grid_subdivided": "1",
		"scale_factor": 1
	},
	"cos/argynvostholt/Map72ArgynvostholtAreaQ": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 72,
		"vpps": 72,
		"fpsq": "5",
		"offsetx": 96,
		"offsety": 128,
		"grid_subdivided": "1",
		"scale_factor": 2
	},
	"cos/the-village-of-krezk/Map82AbbeyofSaintMarkoviaGroundFloor": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 68.66666666666667,
		"vpps": 69,
		"fpsq": "5",
		"offsetx": 1.3333333333331723,
		"offsety": 132,
		"grid_subdivided": "1",
		"scale_factor": 2
	},
	"cos/the-village-of-krezk/Map83AbbeyofSaintMarkoviaUpperFloorCellar": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 68.66666666666667,
		"vpps": 69,
		"fpsq": "5",
		"offsetx": 129.9999999999999,
		"offsety": 128,
		"grid_subdivided": "1",
		"scale_factor": 2
	},
	"cos/tsolenka-pass/Map91TsolenkaPassAreaT": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 67.66666666666667,
		"vpps": 68,
		"fpsq": "5",
		"offsetx": 95.99999999999994,
		"offsety": 94,
		"grid_subdivided": "1",
		"scale_factor": 2
	},
	"cos/the-ruins-of-berez/Map102BabaLysagasCreepingHut": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "90",
		"vpps": "90.33333333333333",
		"fpsq": "5",
		"offsetx": "65",
		"offsety": "47.666666666666686",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"cos/van-richtens-tower/Map111VanRichtensTowerAreaV": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "71.66666666666667",
		"vpps": "71.66666666666667",
		"fpsq": "5",
		"offsetx": "59.333333333333314",
		"offsety": "67.99999999999991",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"cos/the-wizard-of-wines/Map121WizardofWinesWineryAreaW": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": "72.33333333333333",
		"vpps": "72.66666666666667",
		"fpsq": "5",
		"offsetx": "43.000000000000085",
		"offsety": "11.333333333333272",
		"grid_subdivided": "0",
		"scale_factor": 1
	},
	"cos/the-amber-temple/Map131AmberTempleAreaXUpperLevel": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 76.33333333333333,
		"vpps": 76.33333333333333,
		"fpsq": "5",
		"offsetx": 114.00000000000011,
		"offsety": 99.33333333333351,
		"grid_subdivided": "1",
		"scale_factor": 2
	},
	"cos/the-amber-temple/Map132AmberTempleAreaXLowerLevel": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 76.33333333333333,
		"vpps": 76.33333333333333,
		"fpsq": "5",
		"offsetx": 34.6666666666668,
		"offsety": 98.66666666666686,
		"grid_subdivided": "1",
		"scale_factor": 2
	},
	"cos/werewolf-den/Map151WerewolfDenAreaZ": {
		"dm_map_usable": "1",
		"snap": "1",
		"hpps": 74.33333333333333,
		"vpps": 74.66666666666667,
		"fpsq": "5",
		"offsetx": 23.333333333333428,
		"offsety": 44.66666666666649,
		"grid_subdivided": "1",
		"scale_factor": 2
	}
}


var PRESET = {
	'Neutral Party': [
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
			"player_map": "https://64.media.tumblr.com/f825cb81ce4ad02defb28bbfa80462f3/aea42fffdc7096b5-84/s2048x3072/67a03001cbc50a0b68e3d939b641c1a158b1ba3e.jpg",
			"title": "Neutral Party Maps 7",
			"scale": 100,
			"dm_map": ""
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
			"player_map": "https://64.media.tumblr.com/f7befa861af4f7dc61d29fb1e2431eb7/10fcb58e7e52864e-89/s2048x3072/b0cc61a650a9d278428ccd0fc16cf8c5ebb0c1e6.jpg",
			"title": "Neutral Party Maps 16",
			"scale": 100,
			"dm_map": ""
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
			"player_map": "https://64.media.tumblr.com/3c512ecec7aea09a93263816176849e5/6a7d514733166d93-d2/s2048x3072/32a0e54e93de2dd48663deab3370887216cc55ee.jpg",
			"title": "Neutral Party Maps 22",
			"scale": 100,
			"dm_map": ""
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
			"player_map": "https://64.media.tumblr.com/f75dfb02f5b1ea9faac4ae95456e5bc2/tumblr_pvmo4i6npv1y548mzo1_1280.jpg",
			"title": "Neutral Party Maps 31",
			"scale": 100,
			"dm_map": ""
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
			"player_map": "https://64.media.tumblr.com/e0055eefd4a40caf08d9a2f52627febf/tumblr_pnjrichRf91y548mzo1_1280.jpg",
			"title": "Neutral Party Maps 33",
			"scale": 100,
			"dm_map": ""
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
			"player_map": "https://64.media.tumblr.com/9a4a2a5f19598d8f2759bc36fd6d17d8/tumblr_pwqylfZkVq1y548mzo1_1280.jpg",
			"title": "Neutral Party Maps 49",
			"scale": 100,
			"dm_map": ""
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
			"player_map": "https://64.media.tumblr.com/3503d201c2797b61328ec30f3710d3d5/tumblr_plc0lbJ7j41y548mzo1_1280.jpg",
			"title": "Neutral Party Maps 58",
			"scale": 100,
			"dm_map": ""
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
			"player_map": "https://64.media.tumblr.com/b6da20a4ae43fc44a28b86cc59f5d9c8/tumblr_px4027AFbz1y548mzo1_1280.jpg",
			"title": "Neutral Party Maps 70",
			"scale": 100,
			"dm_map": ""
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
			"player_map": "https://64.media.tumblr.com/196e16d3ff91703b08f560e17dc81ceb/tumblr_pm2eebB7221y548mzo1_1280.jpg",
			"title": "Neutral Party Maps 79",
			"scale": 100,
			"dm_map": ""
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
			"player_map": "https://64.media.tumblr.com/b254bf6effb8ab0b2b6bf84a366782f3/tumblr_plc5rsEg8F1y548mzo1_1280.jpg",
			"title": "Neutral Party Maps 81",
			"scale": 100,
			"dm_map": ""
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
	],
	"Basic Maps": [
		{
			"thumb": "https://i.imgur.com/yXntstQ.png",
			"player_map": "https://i.imgur.com/yXntstQ.png",
			"dm_map": "",
			"title": "Stone",
			"scale_factor":2,
			"hpps":80,
			"vpps":80,
			"grid":1,
			"snap":"1",
			"fpsq": "5",
		},
		{
			"thumb": "https://i.imgur.com/EVHWm2v.png",
			"player_map": "https://i.imgur.com/EVHWm2v.png",
			"title": "Grass",
			"scale": 100,
			"dm_map": "",
			"scale_factor":2,
			"hpps":80,
			"vpps":80,
			"grid":1,
			"snap":"1",
			"fpsq": "5",
		},
		{
			"thumb": "https://i.imgur.com/ieZPZ9M.png",
			"player_map": "https://i.imgur.com/ieZPZ9M.png",
			"title": "Sand",
			"scale": 100,
			"dm_map": "",
			"scale_factor":2,
			"hpps":80,
			"vpps":80,
			"grid":1,
			"snap":"1",
			"fpsq": "5",
		},
		{
			"thumb": "https://i.imgur.com/yE66bBd.png",
			"player_map": "https://i.imgur.com/yE66bBd.png",
			"title": "Water",
			"scale": 100,
			"dm_map": "",
			"scale_factor":2,
			"hpps":80,
			"vpps":80,
			"grid":1,
			"snap":"1",
			"fpsq": "5",
		},
		{
			"thumb": "https://i.imgur.com/lWoMoxo.png",
			"player_map": "https://i.imgur.com/lWoMoxo.png",
			"title": "Wood",
			"scale": 100,
			"dm_map": "",
			"scale_factor":2,
			"hpps":80,
			"vpps":80,
			"grid":1,
			"snap":"1",
			"fpsq": "5",
		},
	],
	"DiceGrimorium": [
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
	],
	'YOUTUBE (experimental)': [
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
	],
	"CZEPEKU": [
		{
			"thumb": "https://64.media.tumblr.com/537e51775141c75a7a46bd0a12089ef8/61495676bc3c2a76-21/s1280x1920/71e98dbcbdf98f36267d5ed73eef7cbbfd2379c9.jpg",
			"player_map": "https://64.media.tumblr.com/537e51775141c75a7a46bd0a12089ef8/61495676bc3c2a76-21/s1280x1920/71e98dbcbdf98f36267d5ed73eef7cbbfd2379c9.jpg",
			"title": "CZEPEKU Map 1",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/cb2404b0561a7c645c50d24a1dea1203/03b5740a52dae6e4-36/s1280x1920/e2b4506416f93d25f8f2161737331c8b36b7a8c4.jpg",
			"player_map": "https://64.media.tumblr.com/cb2404b0561a7c645c50d24a1dea1203/03b5740a52dae6e4-36/s1280x1920/e2b4506416f93d25f8f2161737331c8b36b7a8c4.jpg",
			"title": "CZEPEKU Map 2",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/cdd0c20388b477b81750e3ef9582b0ce/59cf994f4619f886-11/s1280x1920/506f1b8279e05d6fb8df4f60e0077a5a67057589.jpg",
			"player_map": "https://64.media.tumblr.com/cdd0c20388b477b81750e3ef9582b0ce/59cf994f4619f886-11/s1280x1920/506f1b8279e05d6fb8df4f60e0077a5a67057589.jpg",
			"title": "CZEPEKU Map 3",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/754e1191b1531b9e687c601b9e0653c5/ce8da5f8ce59785f-be/s1280x1920/59d1b02f8675fb5c781e51a06b1d24db19c7d84e.jpg",
			"player_map": "https://64.media.tumblr.com/754e1191b1531b9e687c601b9e0653c5/ce8da5f8ce59785f-be/s1280x1920/59d1b02f8675fb5c781e51a06b1d24db19c7d84e.jpg",
			"title": "CZEPEKU Map 4",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/f31be124a41e4fa8c074e6b42d2a8716/f350ac57a38a6703-0f/s1280x1920/8219439c23655c284b7824174dd3cbcfaecc9b58.jpg",
			"player_map": "https://64.media.tumblr.com/f31be124a41e4fa8c074e6b42d2a8716/f350ac57a38a6703-0f/s1280x1920/8219439c23655c284b7824174dd3cbcfaecc9b58.jpg",
			"title": "CZEPEKU Map 5",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/6758a0de6564af49bf5e69adb0687347/337ac7749de6be3f-5c/s1280x1920/672ec84189fb05ba5cef4c179f0346a6924dea39.jpg",
			"player_map": "https://64.media.tumblr.com/6758a0de6564af49bf5e69adb0687347/337ac7749de6be3f-5c/s1280x1920/672ec84189fb05ba5cef4c179f0346a6924dea39.jpg",
			"title": "CZEPEKU Map 6",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/60d420b909ed935a27c9b62d102ba958/4704becf38c5cda2-56/s1280x1920/23b7906955ae1435801cb4c1f5b5b34b4cbae7eb.jpg",
			"player_map": "https://64.media.tumblr.com/60d420b909ed935a27c9b62d102ba958/4704becf38c5cda2-56/s1280x1920/23b7906955ae1435801cb4c1f5b5b34b4cbae7eb.jpg",
			"title": "CZEPEKU Map 7",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/83623cdb76f9dc3b4ce90c3fe5c12fcb/b64786ad070a9349-39/s1280x1920/8e7b02edea0b60cf5fcaf7834d81802d7612bdd9.jpg",
			"player_map": "https://64.media.tumblr.com/83623cdb76f9dc3b4ce90c3fe5c12fcb/b64786ad070a9349-39/s1280x1920/8e7b02edea0b60cf5fcaf7834d81802d7612bdd9.jpg",
			"title": "CZEPEKU Map 8",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/b4704ec149294b6a9452bafab03a9a30/5464149681315874-90/s1280x1920/984a0b5383c65bd4172877f352b4341feae8908b.jpg",
			"player_map": "https://64.media.tumblr.com/b4704ec149294b6a9452bafab03a9a30/5464149681315874-90/s1280x1920/984a0b5383c65bd4172877f352b4341feae8908b.jpg",
			"title": "CZEPEKU Map 9",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/0d03fad1fe54e33871f042b9986c0a4b/ab9a2c566389feec-4a/s1280x1920/9262a6deadd4fd989484119e74b72aff882fe11c.jpg",
			"player_map": "https://64.media.tumblr.com/0d03fad1fe54e33871f042b9986c0a4b/ab9a2c566389feec-4a/s1280x1920/9262a6deadd4fd989484119e74b72aff882fe11c.jpg",
			"title": "CZEPEKU Map 10",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/f6c785d8f67cc5dbc6a7f102a283fe30/fc400bbb64935f19-1a/s1280x1920/dfdb77bab09852bfac61bb8c8223c231629da977.jpg",
			"player_map": "https://64.media.tumblr.com/f6c785d8f67cc5dbc6a7f102a283fe30/fc400bbb64935f19-1a/s1280x1920/dfdb77bab09852bfac61bb8c8223c231629da977.jpg",
			"title": "CZEPEKU Map 11",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/65ad1111274697e9ccd64f6a1a641368/c9e14aae4e80c595-e7/s1280x1920/fcf946cae1f31aba31f9ce10aa963181ac5523bc.jpg",
			"player_map": "https://64.media.tumblr.com/65ad1111274697e9ccd64f6a1a641368/c9e14aae4e80c595-e7/s1280x1920/fcf946cae1f31aba31f9ce10aa963181ac5523bc.jpg",
			"title": "CZEPEKU Map 12",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/2b7ab8805d402786b687748cff5b7d46/9bb77d2dd8f69a55-0c/s1280x1920/52ab858c480ac13b2033d93660ad93d6d56debd2.jpg",
			"player_map": "https://64.media.tumblr.com/2b7ab8805d402786b687748cff5b7d46/9bb77d2dd8f69a55-0c/s1280x1920/52ab858c480ac13b2033d93660ad93d6d56debd2.jpg",
			"title": "CZEPEKU Map 13",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/424a8f15c1310ef2598913fafd601994/07800e5cbfe2a849-98/s1280x1920/07299374040927ecbfa62d0834a650ae37814daa.jpg",
			"player_map": "https://64.media.tumblr.com/424a8f15c1310ef2598913fafd601994/07800e5cbfe2a849-98/s1280x1920/07299374040927ecbfa62d0834a650ae37814daa.jpg",
			"title": "CZEPEKU Map 14",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/aefbb68b01e9dc9062b4a2cd09d6726e/4df42f4f56f89ec3-aa/s1280x1920/12397153165bb0638a6b2d5f70f8ea5ac35e49bf.jpg",
			"player_map": "https://64.media.tumblr.com/aefbb68b01e9dc9062b4a2cd09d6726e/4df42f4f56f89ec3-aa/s1280x1920/12397153165bb0638a6b2d5f70f8ea5ac35e49bf.jpg",
			"title": "CZEPEKU Map 15",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/37aa2c5e092535f1921fd7534e804064/ff9f51067490a4fb-41/s1280x1920/fbe72f98e275b238b299c397759c304c1f37a9a7.jpg",
			"player_map": "https://64.media.tumblr.com/37aa2c5e092535f1921fd7534e804064/ff9f51067490a4fb-41/s1280x1920/fbe72f98e275b238b299c397759c304c1f37a9a7.jpg",
			"title": "CZEPEKU Map 16",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/8cd73d0e5f5df9312758387a5d240288/b5f46306f7ee9f0c-9d/s1280x1920/1ea76769a0c5a3578bc3ba1703c375c7009b1148.jpg",
			"player_map": "https://64.media.tumblr.com/8cd73d0e5f5df9312758387a5d240288/b5f46306f7ee9f0c-9d/s1280x1920/1ea76769a0c5a3578bc3ba1703c375c7009b1148.jpg",
			"title": "CZEPEKU Map 17",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/871302743a288e7fceaf6813bd5086f6/ae8162cd5ea838ba-a3/s1280x1920/75253269e0d6a7d66b6f2d2fa8b539bf488f1fdf.jpg",
			"player_map": "https://64.media.tumblr.com/871302743a288e7fceaf6813bd5086f6/ae8162cd5ea838ba-a3/s1280x1920/75253269e0d6a7d66b6f2d2fa8b539bf488f1fdf.jpg",
			"title": "CZEPEKU Map 18",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/d2c9e2d0fd3b17a35ed0c402ac5a9460/51e7e26443325392-77/s1280x1920/a3f9cd9b53449ab7733f5f8da1ba074059984792.jpg",
			"player_map": "https://64.media.tumblr.com/d2c9e2d0fd3b17a35ed0c402ac5a9460/51e7e26443325392-77/s1280x1920/a3f9cd9b53449ab7733f5f8da1ba074059984792.jpg",
			"title": "CZEPEKU Map 19",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/e9e8203f9ba8c1101d41be1d876dceb6/1eb101edf65c8550-11/s1280x1920/85c4820ecde1ea351873aba1b2112f19416f6919.jpg",
			"player_map": "https://64.media.tumblr.com/e9e8203f9ba8c1101d41be1d876dceb6/1eb101edf65c8550-11/s1280x1920/85c4820ecde1ea351873aba1b2112f19416f6919.jpg",
			"title": "CZEPEKU Map 20",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/379003659bf81ff3b1333f5cdc4b2c39/8bfc37b66be081b7-af/s1280x1920/177660f4bfd5cc02842422356ff011a2fe28b349.jpg",
			"player_map": "https://64.media.tumblr.com/379003659bf81ff3b1333f5cdc4b2c39/8bfc37b66be081b7-af/s1280x1920/177660f4bfd5cc02842422356ff011a2fe28b349.jpg",
			"title": "CZEPEKU Map 21",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/a40bb02db100d3fb177e5f9dc8f98fa8/71b80e37c9ae60d0-bb/s1280x1920/aa85f57e6b9fa90865d762092abda7422d0e4fac.jpg",
			"player_map": "https://64.media.tumblr.com/a40bb02db100d3fb177e5f9dc8f98fa8/71b80e37c9ae60d0-bb/s1280x1920/aa85f57e6b9fa90865d762092abda7422d0e4fac.jpg",
			"title": "CZEPEKU Map 22",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/c0750ada211668769c306317c3402f1e/6716a99a1a5c08e8-52/s1280x1920/e6b9de2f609dc73945396eaf33cc7d64a31c6ec3.jpg",
			"player_map": "https://64.media.tumblr.com/c0750ada211668769c306317c3402f1e/6716a99a1a5c08e8-52/s1280x1920/e6b9de2f609dc73945396eaf33cc7d64a31c6ec3.jpg",
			"title": "CZEPEKU Map 23",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/0a8991b9a44d148e58a58f002d2b1b61/bf4ebb6467442833-94/s1280x1920/e9d5cc815d3394956a2530ff83d4a0790a13adef.jpg",
			"player_map": "https://64.media.tumblr.com/0a8991b9a44d148e58a58f002d2b1b61/bf4ebb6467442833-94/s1280x1920/e9d5cc815d3394956a2530ff83d4a0790a13adef.jpg",
			"title": "CZEPEKU Map 24",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/ec12c0522c9b929be895588a489c525b/74fa6293faf72684-f7/s1280x1920/97fd8bbae342261c650e8e9bf3ff59c17ae98230.jpg",
			"player_map": "https://64.media.tumblr.com/ec12c0522c9b929be895588a489c525b/74fa6293faf72684-f7/s1280x1920/97fd8bbae342261c650e8e9bf3ff59c17ae98230.jpg",
			"title": "CZEPEKU Map 25",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/b4231157d5272415e32a4c8bef05ce98/41c6288e6b394334-fb/s1280x1920/ae799cd70ea909c899827d811a70c23eb1d9fb31.jpg",
			"player_map": "https://64.media.tumblr.com/b4231157d5272415e32a4c8bef05ce98/41c6288e6b394334-fb/s1280x1920/ae799cd70ea909c899827d811a70c23eb1d9fb31.jpg",
			"title": "CZEPEKU Map 26",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/06f25d42d4e657d7d41ed49fc09aa293/a99238ef03d2c2db-d3/s1280x1920/f311125e2e6111c1c5d613d5aceaef939e4017be.jpg",
			"player_map": "https://64.media.tumblr.com/06f25d42d4e657d7d41ed49fc09aa293/a99238ef03d2c2db-d3/s1280x1920/f311125e2e6111c1c5d613d5aceaef939e4017be.jpg",
			"title": "CZEPEKU Map 27",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/066371aa549fa4521660976d3d60fb81/65b54bbfbb5ccb23-21/s1280x1920/b111306a90541c43976300a5554c494f19485210.jpg",
			"player_map": "https://64.media.tumblr.com/066371aa549fa4521660976d3d60fb81/65b54bbfbb5ccb23-21/s1280x1920/b111306a90541c43976300a5554c494f19485210.jpg",
			"title": "CZEPEKU Map 28",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/2ec7509bf94f5a58a770e526fe5ea7e0/31004822eb3ba662-18/s1280x1920/07a99f76c3719c59cdabde343532cd61ed026c83.jpg",
			"player_map": "https://64.media.tumblr.com/2ec7509bf94f5a58a770e526fe5ea7e0/31004822eb3ba662-18/s1280x1920/07a99f76c3719c59cdabde343532cd61ed026c83.jpg",
			"title": "CZEPEKU Map 29",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/7905ce98c68d506fdfbecf254a7cdb8d/31004822eb3ba662-0e/s1280x1920/83a5f161693d10174e76cbb67a327d2804684ed3.jpg",
			"player_map": "https://64.media.tumblr.com/7905ce98c68d506fdfbecf254a7cdb8d/31004822eb3ba662-0e/s1280x1920/83a5f161693d10174e76cbb67a327d2804684ed3.jpg",
			"title": "CZEPEKU Map 30",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/729d6f5cbe60eb58ae95809ddd8ebf14/e42077ba20525b67-93/s1280x1920/63f7f3fa3e88dd1a7e51ef8dc70edbbc35ccba6d.jpg",
			"player_map": "https://64.media.tumblr.com/729d6f5cbe60eb58ae95809ddd8ebf14/e42077ba20525b67-93/s1280x1920/63f7f3fa3e88dd1a7e51ef8dc70edbbc35ccba6d.jpg",
			"title": "CZEPEKU Map 31",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/cf01748cd7acd424cd9e600337408ca3/f597bf97fe39b2a4-d9/s1280x1920/46ecde74935b2dde3ff0487cf5f8c92949101cc6.jpg",
			"player_map": "https://64.media.tumblr.com/cf01748cd7acd424cd9e600337408ca3/f597bf97fe39b2a4-d9/s1280x1920/46ecde74935b2dde3ff0487cf5f8c92949101cc6.jpg",
			"title": "CZEPEKU Map 32",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/32c61e14764e0d3ad50a9f8ed89eabf0/b8060f20e8640e78-81/s1280x1920/667b51d923a5780bc93fb1cfb9d9b10d4bc7511d.jpg",
			"player_map": "https://64.media.tumblr.com/32c61e14764e0d3ad50a9f8ed89eabf0/b8060f20e8640e78-81/s1280x1920/667b51d923a5780bc93fb1cfb9d9b10d4bc7511d.jpg",
			"title": "CZEPEKU Map 33",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/7f4ecce0d25a1efa053ae36e27031316/4f35a0b6f8083c15-10/s1280x1920/cb03976d28c820cf5c6d20135e4a8ae9dd3183d8.jpg",
			"player_map": "https://64.media.tumblr.com/7f4ecce0d25a1efa053ae36e27031316/4f35a0b6f8083c15-10/s1280x1920/cb03976d28c820cf5c6d20135e4a8ae9dd3183d8.jpg",
			"title": "CZEPEKU Map 34",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/4a0cd56ff1a5742cc9374b94d75f3693/4f35a0b6f8083c15-db/s1280x1920/68f4e15c271b6630813de5b8ae53a18df2adfff0.jpg",
			"player_map": "https://64.media.tumblr.com/4a0cd56ff1a5742cc9374b94d75f3693/4f35a0b6f8083c15-db/s1280x1920/68f4e15c271b6630813de5b8ae53a18df2adfff0.jpg",
			"title": "CZEPEKU Map 35",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/320987037273cb0473b83906bc9920ab/4f35a0b6f8083c15-86/s1280x1920/c7c8eda77d5775338d76334b5720ee0e0840eb76.jpg",
			"player_map": "https://64.media.tumblr.com/320987037273cb0473b83906bc9920ab/4f35a0b6f8083c15-86/s1280x1920/c7c8eda77d5775338d76334b5720ee0e0840eb76.jpg",
			"title": "CZEPEKU Map 36",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/d625f61e4ad3e668a70ec1d623c225fd/4f35a0b6f8083c15-5f/s1280x1920/3a0a2dbcabfb2da7b996505493cd2af74fa18ff6.jpg",
			"player_map": "https://64.media.tumblr.com/d625f61e4ad3e668a70ec1d623c225fd/4f35a0b6f8083c15-5f/s1280x1920/3a0a2dbcabfb2da7b996505493cd2af74fa18ff6.jpg",
			"title": "CZEPEKU Map 37",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/edfdef14c1e749f77d6dac7f4e21d896/a431cb1d9a4b9261-bf/s1280x1920/2a62ae86692e1ad86fd1a2191265ba5dd1d8aff2.jpg",
			"player_map": "https://64.media.tumblr.com/edfdef14c1e749f77d6dac7f4e21d896/a431cb1d9a4b9261-bf/s1280x1920/2a62ae86692e1ad86fd1a2191265ba5dd1d8aff2.jpg",
			"title": "CZEPEKU Map 38",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/225191caeac6d1e2921c3f8e5c396e14/2e4ebab8af664b97-b9/s1280x1920/3eef6982016557155a3238b83219c3cbabd9e0cc.jpg",
			"player_map": "https://64.media.tumblr.com/225191caeac6d1e2921c3f8e5c396e14/2e4ebab8af664b97-b9/s1280x1920/3eef6982016557155a3238b83219c3cbabd9e0cc.jpg",
			"title": "CZEPEKU Map 39",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/0bacfc69e74572267f2bb2a6d6bdcc58/25fd4f2e5cd14892-c0/s1280x1920/9a6486e2e87035e4e41246b17d59b9d6f1b2d3b2.jpg",
			"player_map": "https://64.media.tumblr.com/0bacfc69e74572267f2bb2a6d6bdcc58/25fd4f2e5cd14892-c0/s1280x1920/9a6486e2e87035e4e41246b17d59b9d6f1b2d3b2.jpg",
			"title": "CZEPEKU Map 40",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/9b51fd663e038035a90ce27b13f16b1d/5074c5927c03dfd9-1a/s1280x1920/246d4dc42199e49f747972971d0065b8675e2b6d.jpg",
			"player_map": "https://64.media.tumblr.com/9b51fd663e038035a90ce27b13f16b1d/5074c5927c03dfd9-1a/s1280x1920/246d4dc42199e49f747972971d0065b8675e2b6d.jpg",
			"title": "CZEPEKU Map 41",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/dea07c12a16f65a74b905ceed70c9772/205e044d58ca35cd-44/s1280x1920/f3edbd2042add742107bc2e2c0b46318b7a2cd12.jpg",
			"player_map": "https://64.media.tumblr.com/dea07c12a16f65a74b905ceed70c9772/205e044d58ca35cd-44/s1280x1920/f3edbd2042add742107bc2e2c0b46318b7a2cd12.jpg",
			"title": "CZEPEKU Map 42",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/7a37bd57baaa07fc38f3f9aa02b312f6/835e7fbe5fa5d739-04/s1280x1920/c9fb7a8fbf2a07d064dcdeadcd2ba13ada45e880.jpg",
			"player_map": "https://64.media.tumblr.com/7a37bd57baaa07fc38f3f9aa02b312f6/835e7fbe5fa5d739-04/s1280x1920/c9fb7a8fbf2a07d064dcdeadcd2ba13ada45e880.jpg",
			"title": "CZEPEKU Map 43",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/4772c7b3ef2a75a6745e10f78144e3e1/c82fffde789bb47c-7c/s1280x1920/496e2bb7fedae1117a9d141ea175527ad04f2448.jpg",
			"player_map": "https://64.media.tumblr.com/4772c7b3ef2a75a6745e10f78144e3e1/c82fffde789bb47c-7c/s1280x1920/496e2bb7fedae1117a9d141ea175527ad04f2448.jpg",
			"title": "CZEPEKU Map 44",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/a13104ad1eaa16c9b29afd1796aaed05/992503aa048112cf-2c/s1280x1920/f9d9e36891ff9148308e1835447fc18854e6ddc9.jpg",
			"player_map": "https://64.media.tumblr.com/a13104ad1eaa16c9b29afd1796aaed05/992503aa048112cf-2c/s1280x1920/f9d9e36891ff9148308e1835447fc18854e6ddc9.jpg",
			"title": "CZEPEKU Map 45",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/79289800423af2f3c967fa9d6152c400/278242116a8229d9-d5/s1280x1920/d7f675190f41327e0334564f018a60ff0c9f5e61.jpg",
			"player_map": "https://64.media.tumblr.com/79289800423af2f3c967fa9d6152c400/278242116a8229d9-d5/s1280x1920/d7f675190f41327e0334564f018a60ff0c9f5e61.jpg",
			"title": "CZEPEKU Map 46",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/94034fed24bb72594eb692af444cf4b3/bd6e51f1982d890b-43/s1280x1920/b564161a35d63c6400d3ea28f70a3e32d34f9992.jpg",
			"player_map": "https://64.media.tumblr.com/94034fed24bb72594eb692af444cf4b3/bd6e51f1982d890b-43/s1280x1920/b564161a35d63c6400d3ea28f70a3e32d34f9992.jpg",
			"title": "CZEPEKU Map 47",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/c9693a4535d128e15eaee18d9a8bb099/adcdae75c89f016f-f7/s1280x1920/83fcef6113f60994a7af50810f1562ad916dd528.jpg",
			"player_map": "https://64.media.tumblr.com/c9693a4535d128e15eaee18d9a8bb099/adcdae75c89f016f-f7/s1280x1920/83fcef6113f60994a7af50810f1562ad916dd528.jpg",
			"title": "CZEPEKU Map 48",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/c9693a4535d128e15eaee18d9a8bb099/f8957d670a05f838-23/s1280x1920/1b684b1a49f18ca9408d185993e80722ebc1bea1.jpg",
			"player_map": "https://64.media.tumblr.com/c9693a4535d128e15eaee18d9a8bb099/f8957d670a05f838-23/s1280x1920/1b684b1a49f18ca9408d185993e80722ebc1bea1.jpg",
			"title": "CZEPEKU Map 49",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/03afa797deeb4f36cc91a9a9376d144e/7935d2ea7d3cdf19-0d/s1280x1920/cd03e694098a079cd7377f8c2762f1a203f93945.jpg",
			"player_map": "https://64.media.tumblr.com/03afa797deeb4f36cc91a9a9376d144e/7935d2ea7d3cdf19-0d/s1280x1920/cd03e694098a079cd7377f8c2762f1a203f93945.jpg",
			"title": "CZEPEKU Map 50",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/cd95e6f43d24c9de319d181d94929111/d6aba9bdf7c574a3-c5/s1280x1920/5228f6ccb49641dba4eb9354535ca9f689b755ce.jpg",
			"player_map": "https://64.media.tumblr.com/cd95e6f43d24c9de319d181d94929111/d6aba9bdf7c574a3-c5/s1280x1920/5228f6ccb49641dba4eb9354535ca9f689b755ce.jpg",
			"title": "CZEPEKU Map 51",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/437ec5fa863bff7b50b5b9414fe411ed/8645cb6f4d9779b7-60/s1280x1920/395f757be88231b279a5fd713e74a564621dcd8c.jpg",
			"player_map": "https://64.media.tumblr.com/437ec5fa863bff7b50b5b9414fe411ed/8645cb6f4d9779b7-60/s1280x1920/395f757be88231b279a5fd713e74a564621dcd8c.jpg",
			"title": "CZEPEKU Map 53",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/dfeeb6f995b09e265e648ef90277f63c/737fea0e3d0f3ece-12/s1280x1920/c75a84fbc7abb5c8d758bb294e1875e626361077.jpg",
			"player_map": "https://64.media.tumblr.com/dfeeb6f995b09e265e648ef90277f63c/737fea0e3d0f3ece-12/s1280x1920/c75a84fbc7abb5c8d758bb294e1875e626361077.jpg",
			"title": "CZEPEKU Map 54",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/5a4b1fa102df1ba17652dfc397997a8b/aba419a1572f5443-4d/s640x960/cb32dba21894e8dcb626a74fa275b78b986c4f6b.jpg",
			"player_map": "https://64.media.tumblr.com/5a4b1fa102df1ba17652dfc397997a8b/aba419a1572f5443-4d/s640x960/cb32dba21894e8dcb626a74fa275b78b986c4f6b.jpg",
			"title": "CZEPEKU Map 55",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/ba61482a80371bf9bebc1710c21c7569/aba419a1572f5443-ad/s1280x1920/7134b838598004916380847bcde91e0b94dfd373.jpg",
			"player_map": "https://64.media.tumblr.com/ba61482a80371bf9bebc1710c21c7569/aba419a1572f5443-ad/s1280x1920/7134b838598004916380847bcde91e0b94dfd373.jpg",
			"title": "CZEPEKU Map 56",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/682da7fb1c98c48b5819e87722e5764e/aba419a1572f5443-28/s1280x1920/dac23e559f37f878f8a6e5bdd28f5635fff4922a.jpg",
			"player_map": "https://64.media.tumblr.com/682da7fb1c98c48b5819e87722e5764e/aba419a1572f5443-28/s1280x1920/dac23e559f37f878f8a6e5bdd28f5635fff4922a.jpg",
			"title": "CZEPEKU Map 57",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/1230855a37d25fcb09ab4ebfeb24ee39/aba419a1572f5443-55/s1280x1920/3fb70c5c055afa2aaa5e0f800bf232c9acca5275.jpg",
			"player_map": "https://64.media.tumblr.com/1230855a37d25fcb09ab4ebfeb24ee39/aba419a1572f5443-55/s1280x1920/3fb70c5c055afa2aaa5e0f800bf232c9acca5275.jpg",
			"title": "CZEPEKU Map 58",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/57002e279ae269338eb40e3c3dad1caa/a3120c4f9db1fd54-58/s1280x1920/69d773cfa50654dbf8d17f04867f34cd2beaee6c.jpg",
			"player_map": "https://64.media.tumblr.com/57002e279ae269338eb40e3c3dad1caa/a3120c4f9db1fd54-58/s1280x1920/69d773cfa50654dbf8d17f04867f34cd2beaee6c.jpg",
			"title": "CZEPEKU Map 59",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/ddfeb3c6e3d58a41ed386ed651497f41/1b8faa47ac3a8cd6-c4/s1280x1920/6e556ecf4460ed9146018114c8810a745c59006e.jpg",
			"player_map": "https://64.media.tumblr.com/ddfeb3c6e3d58a41ed386ed651497f41/1b8faa47ac3a8cd6-c4/s1280x1920/6e556ecf4460ed9146018114c8810a745c59006e.jpg",
			"title": "CZEPEKU Map 60",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/585e1eed009012ff0aa05e1e3592bce2/cb7ccbd5fe4e5564-c1/s1280x1920/a8fe679c97a3aa44546194bda73a9a65e9158eb7.jpg",
			"player_map": "https://64.media.tumblr.com/585e1eed009012ff0aa05e1e3592bce2/cb7ccbd5fe4e5564-c1/s1280x1920/a8fe679c97a3aa44546194bda73a9a65e9158eb7.jpg",
			"title": "CZEPEKU Map 61",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/a7e83a1e528be6a2e0bda3f68711d46c/60920db5d6f893d2-d3/s1280x1920/2f96dad928508f98b4a0e60298816c6632299c65.jpg",
			"player_map": "https://64.media.tumblr.com/a7e83a1e528be6a2e0bda3f68711d46c/60920db5d6f893d2-d3/s1280x1920/2f96dad928508f98b4a0e60298816c6632299c65.jpg",
			"title": "CZEPEKU Map 62",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/5a4b1fa102df1ba17652dfc397997a8b/f008e0cfe1e261f0-37/s640x960/5f7215dbd32330c5ca925314177c62086a80fa37.jpg",
			"player_map": "https://64.media.tumblr.com/5a4b1fa102df1ba17652dfc397997a8b/f008e0cfe1e261f0-37/s640x960/5f7215dbd32330c5ca925314177c62086a80fa37.jpg",
			"title": "CZEPEKU Map 63",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/3ee420e5251e1cfcd1921fa641167b3d/55d054ac8a702b7b-9d/s1280x1920/00cd0aece0d723f8ffc474ebe0e43fbfbf539585.jpg",
			"player_map": "https://64.media.tumblr.com/3ee420e5251e1cfcd1921fa641167b3d/55d054ac8a702b7b-9d/s1280x1920/00cd0aece0d723f8ffc474ebe0e43fbfbf539585.jpg",
			"title": "CZEPEKU Map 64",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/974e4fbfe6c2c8b4851bc080b031e96e/2086ecf3e6c8bb9f-31/s1280x1920/1b5c76a5b4f7d0cd2752e40f9e50276b8e481a10.jpg",
			"player_map": "https://64.media.tumblr.com/974e4fbfe6c2c8b4851bc080b031e96e/2086ecf3e6c8bb9f-31/s1280x1920/1b5c76a5b4f7d0cd2752e40f9e50276b8e481a10.jpg",
			"title": "CZEPEKU Map 65",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/5ad3171fcddb45fd943baf7074780c28/b6accda7ff13e6f2-73/s1280x1920/c3ab675cc8afd698bd190b4f5ecfb1d3479a0618.jpg",
			"player_map": "https://64.media.tumblr.com/5ad3171fcddb45fd943baf7074780c28/b6accda7ff13e6f2-73/s1280x1920/c3ab675cc8afd698bd190b4f5ecfb1d3479a0618.jpg",
			"title": "CZEPEKU Map 66",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/120eb048a5385b4aeceb25094d9227e6/b6accda7ff13e6f2-e9/s1280x1920/6283c885275b5e34e22a26daa808ddc0e53ed9c6.jpg",
			"player_map": "https://64.media.tumblr.com/120eb048a5385b4aeceb25094d9227e6/b6accda7ff13e6f2-e9/s1280x1920/6283c885275b5e34e22a26daa808ddc0e53ed9c6.jpg",
			"title": "CZEPEKU Map 67",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/ca4b74d6500806e55edbb400f53a1e69/b6accda7ff13e6f2-bd/s1280x1920/75cfe5710e07a9e805c4ca53b3a7938c23656630.jpg",
			"player_map": "https://64.media.tumblr.com/ca4b74d6500806e55edbb400f53a1e69/b6accda7ff13e6f2-bd/s1280x1920/75cfe5710e07a9e805c4ca53b3a7938c23656630.jpg",
			"title": "CZEPEKU Map 68",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/f8291f0a8dc0a3130272c702dc1a270e/b6accda7ff13e6f2-d3/s1280x1920/3979ef3c52a90ad57b61609e1b2144dcd045030d.jpg",
			"player_map": "https://64.media.tumblr.com/f8291f0a8dc0a3130272c702dc1a270e/b6accda7ff13e6f2-d3/s1280x1920/3979ef3c52a90ad57b61609e1b2144dcd045030d.jpg",
			"title": "CZEPEKU Map 69",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/8ca86248cb667f797919ad9cd40d207f/85d9287a2a944c73-25/s1280x1920/af3895860d0f20214019f9c0c14e52a9f37c4e51.jpg",
			"player_map": "https://64.media.tumblr.com/8ca86248cb667f797919ad9cd40d207f/85d9287a2a944c73-25/s1280x1920/af3895860d0f20214019f9c0c14e52a9f37c4e51.jpg",
			"title": "CZEPEKU Map 70",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/27f771c012f67a497d32d22e442938e5/4650664682455a23-12/s1280x1920/3e7874a5b4ed96ed3913aea316d739fe4ea760b3.jpg",
			"player_map": "https://64.media.tumblr.com/27f771c012f67a497d32d22e442938e5/4650664682455a23-12/s1280x1920/3e7874a5b4ed96ed3913aea316d739fe4ea760b3.jpg",
			"title": "CZEPEKU Map 71",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/a13104ad1eaa16c9b29afd1796aaed05/407d0d9e1928b6ac-80/s1280x1920/5b9b2a1f19984cc110ab9c73871f572835b9548f.jpg",
			"player_map": "https://64.media.tumblr.com/a13104ad1eaa16c9b29afd1796aaed05/407d0d9e1928b6ac-80/s1280x1920/5b9b2a1f19984cc110ab9c73871f572835b9548f.jpg",
			"title": "CZEPEKU Map 72",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/e281a7194b61972bee2091fae8f4c3df/e8d3841d95121894-6a/s1280x1920/36367aa952dd8ebfda07f92de623928971bb9e15.jpg",
			"player_map": "https://64.media.tumblr.com/e281a7194b61972bee2091fae8f4c3df/e8d3841d95121894-6a/s1280x1920/36367aa952dd8ebfda07f92de623928971bb9e15.jpg",
			"title": "CZEPEKU Map 73",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/c31101893c69c9ec5fe2c11c46d16d23/ccd6e0281ad2db1e-eb/s1280x1920/cac0b2a7269ab66613fc6b19740d4189151e0e7b.jpg",
			"player_map": "https://64.media.tumblr.com/c31101893c69c9ec5fe2c11c46d16d23/ccd6e0281ad2db1e-eb/s1280x1920/cac0b2a7269ab66613fc6b19740d4189151e0e7b.jpg",
			"title": "CZEPEKU Map 74",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/13ffd2d4a3505706952f282bef0837c5/ddc1cf9fc7b1bbc3-c7/s1280x1920/4053cfe1d19f2472bab678a9392c7b5f376d6416.jpg",
			"player_map": "https://64.media.tumblr.com/13ffd2d4a3505706952f282bef0837c5/ddc1cf9fc7b1bbc3-c7/s1280x1920/4053cfe1d19f2472bab678a9392c7b5f376d6416.jpg",
			"title": "CZEPEKU Map 75",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/79f65debf218785c4fa7ff474bd74103/ac236331f68f6b50-4c/s1280x1920/3b343cd3980604fa3e3cb8ab564ef21a779449d4.jpg",
			"player_map": "https://64.media.tumblr.com/79f65debf218785c4fa7ff474bd74103/ac236331f68f6b50-4c/s1280x1920/3b343cd3980604fa3e3cb8ab564ef21a779449d4.jpg",
			"title": "CZEPEKU Map 76",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/f4b0e930feb5b329ea60b870a33e6a24/d3935c2107ba62b5-6c/s1280x1920/296f86b89de90436b5d06e714a635e35c65ca000.jpg",
			"player_map": "https://64.media.tumblr.com/f4b0e930feb5b329ea60b870a33e6a24/d3935c2107ba62b5-6c/s1280x1920/296f86b89de90436b5d06e714a635e35c65ca000.jpg",
			"title": "CZEPEKU Map 77",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/0e2783211ce41e68cc9e2f23bb6d0d1e/9a9f726ae3403847-e5/s1280x1920/58ab9900d64678126da1a5fe2f256b5f801726e6.jpg",
			"player_map": "https://64.media.tumblr.com/0e2783211ce41e68cc9e2f23bb6d0d1e/9a9f726ae3403847-e5/s1280x1920/58ab9900d64678126da1a5fe2f256b5f801726e6.jpg",
			"title": "CZEPEKU Map 78",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/a13104ad1eaa16c9b29afd1796aaed05/86687398dbeb36bf-b8/s1280x1920/580ed8e5843ca0b332fd3de95621f1541cab6da8.jpg",
			"player_map": "https://64.media.tumblr.com/a13104ad1eaa16c9b29afd1796aaed05/86687398dbeb36bf-b8/s1280x1920/580ed8e5843ca0b332fd3de95621f1541cab6da8.jpg",
			"title": "CZEPEKU Map 79",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/3227596499b03b83c57479db2b5f0f06/07f6b2f5176d6849-cc/s1280x1920/ca5264884727ecac743279b2e03dab190134d5dd.jpg",
			"player_map": "https://64.media.tumblr.com/3227596499b03b83c57479db2b5f0f06/07f6b2f5176d6849-cc/s1280x1920/ca5264884727ecac743279b2e03dab190134d5dd.jpg",
			"title": "CZEPEKU Map 80",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/0e92c7840dfcf4576a0f158c276660ec/ee5bc0e431657806-69/s1280x1920/056273c673d467a4f4a9c5b02bd1249ce69516c6.jpg",
			"player_map": "https://64.media.tumblr.com/0e92c7840dfcf4576a0f158c276660ec/ee5bc0e431657806-69/s1280x1920/056273c673d467a4f4a9c5b02bd1249ce69516c6.jpg",
			"title": "CZEPEKU Map 81",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/596b4e7be83c2135c4827065552d3723/cd759b1e37182b64-f2/s1280x1920/cad8725c0764f028a7bd1c5e0566bdcbd0431307.jpg",
			"player_map": "https://64.media.tumblr.com/596b4e7be83c2135c4827065552d3723/cd759b1e37182b64-f2/s1280x1920/cad8725c0764f028a7bd1c5e0566bdcbd0431307.jpg",
			"title": "CZEPEKU Map 82",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/16f82fd3a37bfb9a13f9811cc24544ed/6b24f41fb1ba5647-4f/s1280x1920/6ad10674e0a949c849c42baf0bf0d0256d2a9a1c.jpg",
			"player_map": "https://64.media.tumblr.com/16f82fd3a37bfb9a13f9811cc24544ed/6b24f41fb1ba5647-4f/s1280x1920/6ad10674e0a949c849c42baf0bf0d0256d2a9a1c.jpg",
			"title": "CZEPEKU Map 83",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/96af477e7d1a305b8e29612a177843f8/316dbd9c1e70125b-55/s1280x1920/bc6928ede8b044375c57abde0564305c2607d4ea.jpg",
			"player_map": "https://64.media.tumblr.com/96af477e7d1a305b8e29612a177843f8/316dbd9c1e70125b-55/s1280x1920/bc6928ede8b044375c57abde0564305c2607d4ea.jpg",
			"title": "CZEPEKU Map 84",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/12fce3f634e2aad0ede94760bd1fca15/316dbd9c1e70125b-b0/s1280x1920/4fde261c6d92066f6416c9a8b826a201517f02ea.jpg",
			"player_map": "https://64.media.tumblr.com/12fce3f634e2aad0ede94760bd1fca15/316dbd9c1e70125b-b0/s1280x1920/4fde261c6d92066f6416c9a8b826a201517f02ea.jpg",
			"title": "CZEPEKU Map 85",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/170fe5f728ca7b800e3c4022f2da7f7d/316dbd9c1e70125b-99/s1280x1920/6ca63d5e563fbf2fe703124fd106c86cf8bb8990.jpg",
			"player_map": "https://64.media.tumblr.com/170fe5f728ca7b800e3c4022f2da7f7d/316dbd9c1e70125b-99/s1280x1920/6ca63d5e563fbf2fe703124fd106c86cf8bb8990.jpg",
			"title": "CZEPEKU Map 86",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/7144340b5635589865124b50e9a8eb24/316dbd9c1e70125b-21/s1280x1920/2c32c380635e959d002605ade682b73aada053b6.jpg",
			"player_map": "https://64.media.tumblr.com/7144340b5635589865124b50e9a8eb24/316dbd9c1e70125b-21/s1280x1920/2c32c380635e959d002605ade682b73aada053b6.jpg",
			"title": "CZEPEKU Map 87",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/1c8df5a00ae979fa3864b76583fb6f52/ceaa074bf7df8359-f0/s1280x1920/ed8adc9e62eaf3c1760389afa6022f36b7b177d7.jpg",
			"player_map": "https://64.media.tumblr.com/1c8df5a00ae979fa3864b76583fb6f52/ceaa074bf7df8359-f0/s1280x1920/ed8adc9e62eaf3c1760389afa6022f36b7b177d7.jpg",
			"title": "CZEPEKU Map 88",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/a4b14384053804c55cba218bf0e2560e/c3d46bd6a1ea41e0-42/s1280x1920/829dd46e349c40e28f7c18fc6f17642dda76dc0b.jpg",
			"player_map": "https://64.media.tumblr.com/a4b14384053804c55cba218bf0e2560e/c3d46bd6a1ea41e0-42/s1280x1920/829dd46e349c40e28f7c18fc6f17642dda76dc0b.jpg",
			"title": "CZEPEKU Map 89",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/bc85ae3f01964305fd646111f1fcd98d/c8929f6b87a67d3c-96/s640x960/7c3893306ccc31d4ea44767f570d00689368863d.jpg",
			"player_map": "https://64.media.tumblr.com/bc85ae3f01964305fd646111f1fcd98d/c8929f6b87a67d3c-96/s640x960/7c3893306ccc31d4ea44767f570d00689368863d.jpg",
			"title": "CZEPEKU Map 90",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/b45d5fa0750798beecd797c09a7d19dc/a5aeac5cf331f8e2-4a/s1280x1920/1f144fbd29299137df32483d34f91aa1fd157d9a.jpg",
			"player_map": "https://64.media.tumblr.com/b45d5fa0750798beecd797c09a7d19dc/a5aeac5cf331f8e2-4a/s1280x1920/1f144fbd29299137df32483d34f91aa1fd157d9a.jpg",
			"title": "CZEPEKU Map 91",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/04d565f484430bc7861a76d4409fc46f/90991c8a89a2dd1b-37/s1280x1920/3cda417a98dde7175f42a58068f710f2417a9c3e.jpg",
			"player_map": "https://64.media.tumblr.com/04d565f484430bc7861a76d4409fc46f/90991c8a89a2dd1b-37/s1280x1920/3cda417a98dde7175f42a58068f710f2417a9c3e.jpg",
			"title": "CZEPEKU Map 92",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/8b90bb7e39630b897c2938f8a819774a/228ce21e257a5ace-b7/s1280x1920/d8a99991459e14426884ba274c558ac0cfd1c2cb.jpg",
			"player_map": "https://64.media.tumblr.com/8b90bb7e39630b897c2938f8a819774a/228ce21e257a5ace-b7/s1280x1920/d8a99991459e14426884ba274c558ac0cfd1c2cb.jpg",
			"title": "CZEPEKU Map 93",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/1479253d418d449bb8cb93966082cc9e/32bff1869b9c439c-78/s1280x1920/0282b5d600add8042962563248b3056dc7dad4eb.jpg",
			"player_map": "https://64.media.tumblr.com/1479253d418d449bb8cb93966082cc9e/32bff1869b9c439c-78/s1280x1920/0282b5d600add8042962563248b3056dc7dad4eb.jpg",
			"title": "CZEPEKU Map 94",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/ef9505c6e009088a1f25d66afb0943cf/e3151455005d15a3-61/s1280x1920/485b3a803cb128c8c57843cd684d2c46c0b5792c.jpg",
			"player_map": "https://64.media.tumblr.com/ef9505c6e009088a1f25d66afb0943cf/e3151455005d15a3-61/s1280x1920/485b3a803cb128c8c57843cd684d2c46c0b5792c.jpg",
			"title": "CZEPEKU Map 95",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/cbf3aff513c4194344a33893f319e9a8/9ac420aa9e12a14a-05/s1280x1920/9d53b962d4cc61a67d76feaf04479c54ea977f3c.jpg",
			"player_map": "https://64.media.tumblr.com/cbf3aff513c4194344a33893f319e9a8/9ac420aa9e12a14a-05/s1280x1920/9d53b962d4cc61a67d76feaf04479c54ea977f3c.jpg",
			"title": "CZEPEKU Map 96",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/9b47cc250df212ee97326b060e9d77fe/4c16ff1438435c18-8a/s1280x1920/c3bed91ec1a1dc3385c601a8f1a13cafa1d680b3.jpg",
			"player_map": "https://64.media.tumblr.com/9b47cc250df212ee97326b060e9d77fe/4c16ff1438435c18-8a/s1280x1920/c3bed91ec1a1dc3385c601a8f1a13cafa1d680b3.jpg",
			"title": "CZEPEKU Map 97",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/ca4b74d6500806e55edbb400f53a1e69/debe8a926a6490e9-30/s1280x1920/18ea17bb937f544d93b2dce1ca92620c6187006d.jpg",
			"player_map": "https://64.media.tumblr.com/ca4b74d6500806e55edbb400f53a1e69/debe8a926a6490e9-30/s1280x1920/18ea17bb937f544d93b2dce1ca92620c6187006d.jpg",
			"title": "CZEPEKU Map 98",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/7d99e76272e3512f761fe53c19969321/395895417ddc3da2-b7/s1280x1920/ec948a1dbbb0acaf828635ad5b2d8516d2f9a0bd.jpg",
			"player_map": "https://64.media.tumblr.com/7d99e76272e3512f761fe53c19969321/395895417ddc3da2-b7/s1280x1920/ec948a1dbbb0acaf828635ad5b2d8516d2f9a0bd.jpg",
			"title": "CZEPEKU Map 99",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/79289800423af2f3c967fa9d6152c400/8360ebc2e1fa26ff-0e/s1280x1920/6253ea4e566103c405eae6b1ed06cdda16d8ccbe.jpg",
			"player_map": "https://64.media.tumblr.com/79289800423af2f3c967fa9d6152c400/8360ebc2e1fa26ff-0e/s1280x1920/6253ea4e566103c405eae6b1ed06cdda16d8ccbe.jpg",
			"title": "CZEPEKU Map 100",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/dc791185a05a4b1108430391b799263b/3a69242f4bf46e71-86/s1280x1920/59e6a5facaf6aaed9c98aec9dda389fba9a9d0ab.jpg",
			"player_map": "https://64.media.tumblr.com/dc791185a05a4b1108430391b799263b/3a69242f4bf46e71-86/s1280x1920/59e6a5facaf6aaed9c98aec9dda389fba9a9d0ab.jpg",
			"title": "CZEPEKU Map 101",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/bc4ea513686cab0dffd5326ac33b6d6c/526a4d423224842d-ae/s1280x1920/6e35869c4a20d9ae55c8cd30d996b6f654ce3020.jpg",
			"player_map": "https://64.media.tumblr.com/bc4ea513686cab0dffd5326ac33b6d6c/526a4d423224842d-ae/s1280x1920/6e35869c4a20d9ae55c8cd30d996b6f654ce3020.jpg",
			"title": "CZEPEKU Map 102",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/ddb90ef751fba96f42b12971297b6e65/4b5606867f42fe94-ee/s1280x1920/77ff6d99083b1c43b469aaeb95e6a6183b26cbbd.jpg",
			"player_map": "https://64.media.tumblr.com/ddb90ef751fba96f42b12971297b6e65/4b5606867f42fe94-ee/s1280x1920/77ff6d99083b1c43b469aaeb95e6a6183b26cbbd.jpg",
			"title": "CZEPEKU Map 103",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/924807aeb2e185d6712500823fc7ea27/b89b89f93a27cead-75/s1280x1920/7d8368a8be1c4ede7cb12570be84c1828b5ffe58.jpg",
			"player_map": "https://64.media.tumblr.com/924807aeb2e185d6712500823fc7ea27/b89b89f93a27cead-75/s1280x1920/7d8368a8be1c4ede7cb12570be84c1828b5ffe58.jpg",
			"title": "CZEPEKU Map 104",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/771c4e7eea1fa5ef4bb0270f0137764d/a7055aa46708cde1-ad/s1280x1920/47efa273ac4d372bee6e690609b1a1a7130a836d.jpg",
			"player_map": "https://64.media.tumblr.com/771c4e7eea1fa5ef4bb0270f0137764d/a7055aa46708cde1-ad/s1280x1920/47efa273ac4d372bee6e690609b1a1a7130a836d.jpg",
			"title": "CZEPEKU Map 105",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/3987b721fa7d40194c16ca9aca713d56/9d6d8c8697f8195e-d0/s1280x1920/f609f0d213173995a31961342bad152203dec2e1.jpg",
			"player_map": "https://64.media.tumblr.com/3987b721fa7d40194c16ca9aca713d56/9d6d8c8697f8195e-d0/s1280x1920/f609f0d213173995a31961342bad152203dec2e1.jpg",
			"title": "CZEPEKU Map 106",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/3ee420e5251e1cfcd1921fa641167b3d/c4510d62c9eae33f-69/s1280x1920/57b495f87e90a31b2719c61a7a1c3e6668175b66.jpg",
			"player_map": "https://64.media.tumblr.com/3ee420e5251e1cfcd1921fa641167b3d/c4510d62c9eae33f-69/s1280x1920/57b495f87e90a31b2719c61a7a1c3e6668175b66.jpg",
			"title": "CZEPEKU Map 107",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/fb57af5565a2ef1531d2e51f3bf755f1/236510190d6fce73-1f/s1280x1920/75b800c09490cce49f4f7a0f7ed55381152fe692.jpg",
			"player_map": "https://64.media.tumblr.com/fb57af5565a2ef1531d2e51f3bf755f1/236510190d6fce73-1f/s1280x1920/75b800c09490cce49f4f7a0f7ed55381152fe692.jpg",
			"title": "CZEPEKU Map 108",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/3660874a12b5418da3828f514892be94/977f7e38511ea67c-33/s1280x1920/c78d7f11daf8c5e5d9f13c95f801652d5d7275e2.jpg",
			"player_map": "https://64.media.tumblr.com/3660874a12b5418da3828f514892be94/977f7e38511ea67c-33/s1280x1920/c78d7f11daf8c5e5d9f13c95f801652d5d7275e2.jpg",
			"title": "CZEPEKU Map 109",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/d6e23726b8be64ef11a1e698b3bc4789/48830453849e2d73-77/s1280x1920/817ef6e732398de77a8ad74db9d33d6d7681f19a.jpg",
			"player_map": "https://64.media.tumblr.com/d6e23726b8be64ef11a1e698b3bc4789/48830453849e2d73-77/s1280x1920/817ef6e732398de77a8ad74db9d33d6d7681f19a.jpg",
			"title": "CZEPEKU Map 110",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/65d2036032a263d0fa0253b8e969ca70/75494e053062b520-db/s1280x1920/5b35869cbf487207e7de89973ba5b374cb7bdf56.jpg",
			"player_map": "https://64.media.tumblr.com/65d2036032a263d0fa0253b8e969ca70/75494e053062b520-db/s1280x1920/5b35869cbf487207e7de89973ba5b374cb7bdf56.jpg",
			"title": "CZEPEKU Map 111",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/62f4589f9e9b39e653324cc150d9da08/7ae53b581e09bcba-97/s1280x1920/1c8a7d02ee614cb19035645548f6eb52c26e6d39.jpg",
			"player_map": "https://64.media.tumblr.com/62f4589f9e9b39e653324cc150d9da08/7ae53b581e09bcba-97/s1280x1920/1c8a7d02ee614cb19035645548f6eb52c26e6d39.jpg",
			"title": "CZEPEKU Map 112",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/e281a7194b61972bee2091fae8f4c3df/fa176a7e9b159112-9c/s1280x1920/2716b5cc87cbf3c6ef7d9b39329b9f013d6f4dce.jpg",
			"player_map": "https://64.media.tumblr.com/e281a7194b61972bee2091fae8f4c3df/fa176a7e9b159112-9c/s1280x1920/2716b5cc87cbf3c6ef7d9b39329b9f013d6f4dce.jpg",
			"title": "CZEPEKU Map 113",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/8d35a6db1db817a8bf9ad625024109f6/e7ea876c35596166-d4/s1280x1920/11d487f518c57e5144cbf97002aa81e183dd638d.jpg",
			"player_map": "https://64.media.tumblr.com/8d35a6db1db817a8bf9ad625024109f6/e7ea876c35596166-d4/s1280x1920/11d487f518c57e5144cbf97002aa81e183dd638d.jpg",
			"title": "CZEPEKU Map 114",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/ed44899b07fa929197b84ca566fe8518/3233c39c8c159de6-b3/s1280x1920/466dc5328828dbd2061437650923dc2bf8239c76.jpg",
			"player_map": "https://64.media.tumblr.com/ed44899b07fa929197b84ca566fe8518/3233c39c8c159de6-b3/s1280x1920/466dc5328828dbd2061437650923dc2bf8239c76.jpg",
			"title": "CZEPEKU Map 115",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/49977157de2d6b2a9f0bc16f5ef7b90b/7714b90fdff87a55-91/s1280x1920/09f2970e5f5308d61fd78064d8296a1e96dd6c57.jpg",
			"player_map": "https://64.media.tumblr.com/49977157de2d6b2a9f0bc16f5ef7b90b/7714b90fdff87a55-91/s1280x1920/09f2970e5f5308d61fd78064d8296a1e96dd6c57.jpg",
			"title": "CZEPEKU Map 116",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/1a2243f6c150b777cd649756f82e7603/cfe784709d8b5d8c-a9/s1280x1920/fc96243d1b8383d011bbc1148cb73729a66cf844.jpg",
			"player_map": "https://64.media.tumblr.com/1a2243f6c150b777cd649756f82e7603/cfe784709d8b5d8c-a9/s1280x1920/fc96243d1b8383d011bbc1148cb73729a66cf844.jpg",
			"title": "CZEPEKU Map 117",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/32a50d3ffba16dc5bfcc7b47c3f7224d/8120e91ec7204267-2e/s1280x1920/fae763e932048ab924d39022a573d19c24b78312.jpg",
			"player_map": "https://64.media.tumblr.com/32a50d3ffba16dc5bfcc7b47c3f7224d/8120e91ec7204267-2e/s1280x1920/fae763e932048ab924d39022a573d19c24b78312.jpg",
			"title": "CZEPEKU Map 118",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/98466a4281fdb5fb489e480a69a77eef/fda998eb80397241-4c/s1280x1920/661e7012fd3f9fec5ac0db35e5e2f80bff55b502.jpg",
			"player_map": "https://64.media.tumblr.com/98466a4281fdb5fb489e480a69a77eef/fda998eb80397241-4c/s1280x1920/661e7012fd3f9fec5ac0db35e5e2f80bff55b502.jpg",
			"title": "CZEPEKU Map 119",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/69674c87aa302cefbbb16b98b3ef3e79/ec26a6896c4145a6-d1/s1280x1920/c0bc5a3c4323c48944548844dcbf1befa13cbd77.jpg",
			"player_map": "https://64.media.tumblr.com/69674c87aa302cefbbb16b98b3ef3e79/ec26a6896c4145a6-d1/s1280x1920/c0bc5a3c4323c48944548844dcbf1befa13cbd77.jpg",
			"title": "CZEPEKU Map 120",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/9221473943687aaa101575ae5edd055e/09b338374bc8465c-a8/s1280x1920/4286e9e2004627c68659a705c8d8b5b2a29281d3.jpg",
			"player_map": "https://64.media.tumblr.com/9221473943687aaa101575ae5edd055e/09b338374bc8465c-a8/s1280x1920/4286e9e2004627c68659a705c8d8b5b2a29281d3.jpg",
			"title": "CZEPEKU Map 121",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/dc27289bcc6cf0d917716cf26548e982/c6ab898fd13fc303-61/s1280x1920/4545e22478bd0a104696e6d92a6ce39e4b3e44ad.jpg",
			"player_map": "https://64.media.tumblr.com/dc27289bcc6cf0d917716cf26548e982/c6ab898fd13fc303-61/s1280x1920/4545e22478bd0a104696e6d92a6ce39e4b3e44ad.jpg",
			"title": "CZEPEKU Map 122",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/7ef50528e766f5958583c3a828a5850a/0215e2971a7ed282-5b/s1280x1920/c9a5121fb9271597c2529d98f62f029db644239e.jpg",
			"player_map": "https://64.media.tumblr.com/7ef50528e766f5958583c3a828a5850a/0215e2971a7ed282-5b/s1280x1920/c9a5121fb9271597c2529d98f62f029db644239e.jpg",
			"title": "CZEPEKU Map 123",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/0d51e19fc00d49d1f56610fdc53c7792/530a25e4d01c50e7-df/s1280x1920/5d62d3acb9c1ed91d0a56e97243f2464dc4ad7fc.jpg",
			"player_map": "https://64.media.tumblr.com/0d51e19fc00d49d1f56610fdc53c7792/530a25e4d01c50e7-df/s1280x1920/5d62d3acb9c1ed91d0a56e97243f2464dc4ad7fc.jpg",
			"title": "CZEPEKU Map 124",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/359a075d04757b802b89e9d1023c4c71/d71861c06f84ed8a-30/s1280x1920/a9d6ae39816a12df8da6828aa4c0750107ce3e48.jpg",
			"player_map": "https://64.media.tumblr.com/359a075d04757b802b89e9d1023c4c71/d71861c06f84ed8a-30/s1280x1920/a9d6ae39816a12df8da6828aa4c0750107ce3e48.jpg",
			"title": "CZEPEKU Map 125",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/8f6ca5ecee85797069780c6d58bed008/a735ad162b159dd1-9a/s1280x1920/645a2a74b0a67b2c28f2070e6c304d5b45857935.jpg",
			"player_map": "https://64.media.tumblr.com/8f6ca5ecee85797069780c6d58bed008/a735ad162b159dd1-9a/s1280x1920/645a2a74b0a67b2c28f2070e6c304d5b45857935.jpg",
			"title": "CZEPEKU Map 126",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/068deee19b284fe45dec2061b2835e9e/33f1651f2c880408-58/s1280x1920/78fe56ba90422bff5898f6fe8c4d3f8b6a3036a7.jpg",
			"player_map": "https://64.media.tumblr.com/068deee19b284fe45dec2061b2835e9e/33f1651f2c880408-58/s1280x1920/78fe56ba90422bff5898f6fe8c4d3f8b6a3036a7.jpg",
			"title": "CZEPEKU Map 127",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/2d7abe649b90e5ab6879ec4ea10fa079/277265943dda04af-98/s1280x1920/92196de32479d2be819fe2b4e3f86773b9c8ae53.jpg",
			"player_map": "https://64.media.tumblr.com/2d7abe649b90e5ab6879ec4ea10fa079/277265943dda04af-98/s1280x1920/92196de32479d2be819fe2b4e3f86773b9c8ae53.jpg",
			"title": "CZEPEKU Map 128",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/38f4c36d5cb7a3984d02c8d1337a35db/66740e3094aa65f7-37/s1280x1920/20d5275ea355aeb2c298ecdf048ce91a4dac0d64.jpg",
			"player_map": "https://64.media.tumblr.com/38f4c36d5cb7a3984d02c8d1337a35db/66740e3094aa65f7-37/s1280x1920/20d5275ea355aeb2c298ecdf048ce91a4dac0d64.jpg",
			"title": "CZEPEKU Map 129",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/d05deac542124d21483228b73741d877/tumblr_pux2zqSB6v1yofkpro1_1280.jpg",
			"player_map": "https://64.media.tumblr.com/d05deac542124d21483228b73741d877/tumblr_pux2zqSB6v1yofkpro1_1280.jpg",
			"title": "CZEPEKU Map 130",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/19992002f61aca064768ee7465692b3e/tumblr_prtqpjmeoO1yofkpro1_1280.jpg",
			"player_map": "https://64.media.tumblr.com/19992002f61aca064768ee7465692b3e/tumblr_prtqpjmeoO1yofkpro1_1280.jpg",
			"title": "CZEPEKU Map 131",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/36c7f036dc9c9615394cb1dc6141927c/798a6e4794400512-69/s1280x1920/0d1832a247f931929c746fa7c32f74e5d1c62409.jpg",
			"player_map": "https://64.media.tumblr.com/36c7f036dc9c9615394cb1dc6141927c/798a6e4794400512-69/s1280x1920/0d1832a247f931929c746fa7c32f74e5d1c62409.jpg",
			"title": "CZEPEKU Map 132",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/3603576782c769c66f870fbc6bcd72a2/3fcb3852559d4cb1-fd/s1280x1920/792a0a6463d3e2cb71fde1ffd03317a617cbb3d4.jpg",
			"player_map": "https://64.media.tumblr.com/3603576782c769c66f870fbc6bcd72a2/3fcb3852559d4cb1-fd/s1280x1920/792a0a6463d3e2cb71fde1ffd03317a617cbb3d4.jpg",
			"title": "CZEPEKU Map 133",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/d7b2c1cc00c1e80ba4197a908f5c169e/619127510ab2b442-67/s1280x1920/4566dc253478b6176c924600057c22b337859a03.jpg",
			"player_map": "https://64.media.tumblr.com/d7b2c1cc00c1e80ba4197a908f5c169e/619127510ab2b442-67/s1280x1920/4566dc253478b6176c924600057c22b337859a03.jpg",
			"title": "CZEPEKU Map 134",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/ad1fb4958981ffc573f02658735a0bab/9bee8523cf463b05-57/s1280x1920/e4dc097ae97e6bb3a5c801d161064396758ad0b5.jpg",
			"player_map": "https://64.media.tumblr.com/ad1fb4958981ffc573f02658735a0bab/9bee8523cf463b05-57/s1280x1920/e4dc097ae97e6bb3a5c801d161064396758ad0b5.jpg",
			"title": "CZEPEKU Map 135",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/96fa49b330cf3bc68072f49f9a010c72/30efc56860ebf4d3-37/s1280x1920/e536151b6f5f9bc9dba726bd72bfcabfb0aaccc5.jpg",
			"player_map": "https://64.media.tumblr.com/96fa49b330cf3bc68072f49f9a010c72/30efc56860ebf4d3-37/s1280x1920/e536151b6f5f9bc9dba726bd72bfcabfb0aaccc5.jpg",
			"title": "CZEPEKU Map 136",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/0bd527237af841b11ad0f572bcaa361e/tumblr_prglt8AQAZ1yofkpro1_1280.png",
			"player_map": "https://64.media.tumblr.com/0bd527237af841b11ad0f572bcaa361e/tumblr_prglt8AQAZ1yofkpro1_1280.png",
			"title": "CZEPEKU Map 137",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/d98573b84665911293a21eaa97f59eb8/0d38f4e7a617c8a7-41/s1280x1920/d208c163fd67a6b9a6482ee99f1803179a7d50bf.jpg",
			"player_map": "https://64.media.tumblr.com/d98573b84665911293a21eaa97f59eb8/0d38f4e7a617c8a7-41/s1280x1920/d208c163fd67a6b9a6482ee99f1803179a7d50bf.jpg",
			"title": "CZEPEKU Map 138",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/948b9945ca9759c9e97f1d5933fd61b1/tumblr_prgllvWJ061yofkpro1_1280.jpg",
			"player_map": "https://64.media.tumblr.com/948b9945ca9759c9e97f1d5933fd61b1/tumblr_prgllvWJ061yofkpro1_1280.jpg",
			"title": "CZEPEKU Map 139",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/7b7187c891f1bb91cf6714c83265c241/tumblr_prglh65rgz1yofkpro1_1280.jpg",
			"player_map": "https://64.media.tumblr.com/7b7187c891f1bb91cf6714c83265c241/tumblr_prglh65rgz1yofkpro1_1280.jpg",
			"title": "CZEPEKU Map 140",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/b9ddb7ca39cd3392ec6bdf3636b830b4/tumblr_prgl9rADmg1yofkpro1_1280.jpg",
			"player_map": "https://64.media.tumblr.com/b9ddb7ca39cd3392ec6bdf3636b830b4/tumblr_prgl9rADmg1yofkpro1_1280.jpg",
			"title": "CZEPEKU Map 141",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/c45378949732d7eb45f7f971deed57b8/tumblr_prgl3v42Rg1yofkpro1_1280.jpg",
			"player_map": "https://64.media.tumblr.com/c45378949732d7eb45f7f971deed57b8/tumblr_prgl3v42Rg1yofkpro1_1280.jpg",
			"title": "CZEPEKU Map 142",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/3af15268410f263dacee44a8f9b0b1dc/tumblr_prgkv2gIcm1yofkpro1_1280.jpg",
			"player_map": "https://64.media.tumblr.com/3af15268410f263dacee44a8f9b0b1dc/tumblr_prgkv2gIcm1yofkpro1_1280.jpg",
			"title": "CZEPEKU Map 143",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/28cc3c2ccab11b7b496cb3be4fb3bf3d/tumblr_prgldc2HMV1yofkpro1_1280.jpg",
			"player_map": "https://64.media.tumblr.com/28cc3c2ccab11b7b496cb3be4fb3bf3d/tumblr_prgldc2HMV1yofkpro1_1280.jpg",
			"title": "CZEPEKU Map 144",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/fa5b3aff39687586feb474a98163f4de/4d259d0eb962be2b-bf/s1280x1920/310f8d3ff7840064aae6c8cbaf3dbf639b8d8e9f.jpg",
			"player_map": "https://64.media.tumblr.com/fa5b3aff39687586feb474a98163f4de/4d259d0eb962be2b-bf/s1280x1920/310f8d3ff7840064aae6c8cbaf3dbf639b8d8e9f.jpg",
			"title": "CZEPEKU Map 145",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/6f61313c8be8c558312378dd1a0ce518/tumblr_puec607btO1yofkpro1_1280.jpg",
			"player_map": "https://64.media.tumblr.com/6f61313c8be8c558312378dd1a0ce518/tumblr_puec607btO1yofkpro1_1280.jpg",
			"title": "CZEPEKU Map 146",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/592b2623a0a21faa0669fae7cb3b1cc3/b2d9871388566cb7-f0/s1280x1920/56caaff6c450f8ccbbd89134b387e43149aaef72.jpg",
			"player_map": "https://64.media.tumblr.com/592b2623a0a21faa0669fae7cb3b1cc3/b2d9871388566cb7-f0/s1280x1920/56caaff6c450f8ccbbd89134b387e43149aaef72.jpg",
			"title": "CZEPEKU Map 147",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/4514a2d64299aa268867eef277726ca6/tumblr_prhxctKgh81yofkpro1_1280.png",
			"player_map": "https://64.media.tumblr.com/4514a2d64299aa268867eef277726ca6/tumblr_prhxctKgh81yofkpro1_1280.png",
			"title": "CZEPEKU Map 148",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/ca880244c85612d8d0afc75fb40c307c/063e8dca19929c92-29/s1280x1920/8fa57744acb3b30cdc73b1dcee2d2175d83849c6.jpg",
			"player_map": "https://64.media.tumblr.com/ca880244c85612d8d0afc75fb40c307c/063e8dca19929c92-29/s1280x1920/8fa57744acb3b30cdc73b1dcee2d2175d83849c6.jpg",
			"title": "CZEPEKU Map 149",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/3608851a8de2c156acb29d789fb0b81f/4b2db85c350feab6-7d/s1280x1920/eedad8e04eb69902dcb0bb794a696a73492db9e5.jpg",
			"player_map": "https://64.media.tumblr.com/3608851a8de2c156acb29d789fb0b81f/4b2db85c350feab6-7d/s1280x1920/eedad8e04eb69902dcb0bb794a696a73492db9e5.jpg",
			"title": "CZEPEKU Map 150",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/f37e71bee24df7dc4c15ed35739c25e5/b5d994a24058f546-c2/s1280x1920/807bc445d9c79b50388fe2ce781c21b0007e5647.jpg",
			"player_map": "https://64.media.tumblr.com/f37e71bee24df7dc4c15ed35739c25e5/b5d994a24058f546-c2/s1280x1920/807bc445d9c79b50388fe2ce781c21b0007e5647.jpg",
			"title": "CZEPEKU Map 151",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/e662d56afefbfb1f9f9bf1d9ee2a23dd/tumblr_py6xo0Jw9b1yofkpro1_1280.jpg",
			"player_map": "https://64.media.tumblr.com/e662d56afefbfb1f9f9bf1d9ee2a23dd/tumblr_py6xo0Jw9b1yofkpro1_1280.jpg",
			"title": "CZEPEKU Map 152",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/daf01dd153941ea61deb6f5f1f915895/db2d1130d83571aa-67/s1280x1920/68cd4b041d3e7deb68d4f86a47468a55a6002847.jpg",
			"player_map": "https://64.media.tumblr.com/daf01dd153941ea61deb6f5f1f915895/db2d1130d83571aa-67/s1280x1920/68cd4b041d3e7deb68d4f86a47468a55a6002847.jpg",
			"title": "CZEPEKU Map 153",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/4db8aa26c59dc8faf01772f9dbe27bd7/tumblr_pxmlu0PzVu1yofkpro1_1280.jpg",
			"player_map": "https://64.media.tumblr.com/4db8aa26c59dc8faf01772f9dbe27bd7/tumblr_pxmlu0PzVu1yofkpro1_1280.jpg",
			"title": "CZEPEKU Map 154",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/24c25515a7acce60d61b04bcd68021cc/tumblr_pwx2cbyhrk1yofkpro1_1280.jpg",
			"player_map": "https://64.media.tumblr.com/24c25515a7acce60d61b04bcd68021cc/tumblr_pwx2cbyhrk1yofkpro1_1280.jpg",
			"title": "CZEPEKU Map 155",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/1b0d019a5b56fb26c01ef67786972b38/8c4a329113eee353-e0/s1280x1920/5879b06d76ddf28af1ec22e2cd4d57397264e908.jpg",
			"player_map": "https://64.media.tumblr.com/1b0d019a5b56fb26c01ef67786972b38/8c4a329113eee353-e0/s1280x1920/5879b06d76ddf28af1ec22e2cd4d57397264e908.jpg",
			"title": "CZEPEKU Map 156",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/191c363185e2239b15328c2aa25e4d83/tumblr_pv9yrzllwh1yofkpro1_1280.jpg",
			"player_map": "https://64.media.tumblr.com/191c363185e2239b15328c2aa25e4d83/tumblr_pv9yrzllwh1yofkpro1_1280.jpg",
			"title": "CZEPEKU Map 157",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/397f2677c3689a53e3149755b745ad3b/tumblr_pv0uxzRf5D1yofkpro1_1280.jpg",
			"player_map": "https://64.media.tumblr.com/397f2677c3689a53e3149755b745ad3b/tumblr_pv0uxzRf5D1yofkpro1_1280.jpg",
			"title": "CZEPEKU Map 158",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/a7e028d7b0dcb6dd4ff29ac84fa0984d/f2adb022e1d031f4-a7/s1280x1920/f067f6bc61b773404acdafe50d23823417f78db4.jpg",
			"player_map": "https://64.media.tumblr.com/a7e028d7b0dcb6dd4ff29ac84fa0984d/f2adb022e1d031f4-a7/s1280x1920/f067f6bc61b773404acdafe50d23823417f78db4.jpg",
			"title": "CZEPEKU Map 159",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/9b5efad22d6eb1cd0d742c8e93543f06/1ed9719521784f65-e6/s1280x1920/e6b381d76f10818d78dd959172338f94c98f7b17.jpg",
			"player_map": "https://64.media.tumblr.com/9b5efad22d6eb1cd0d742c8e93543f06/1ed9719521784f65-e6/s1280x1920/e6b381d76f10818d78dd959172338f94c98f7b17.jpg",
			"title": "CZEPEKU Map 160",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/159e7387f79bf9ffe1187e3723dc65dc/5953bb1ae8e3d426-91/s1280x1920/0c5954f34a5db18b0eaea1a521380761ed161349.jpg",
			"player_map": "https://64.media.tumblr.com/159e7387f79bf9ffe1187e3723dc65dc/5953bb1ae8e3d426-91/s1280x1920/0c5954f34a5db18b0eaea1a521380761ed161349.jpg",
			"title": "CZEPEKU Map 161",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/160dc26ae6f935364cf0f69577e5befd/86f1ecf48a38ba6e-38/s1280x1920/bc87111ffe50db437fe57557e36cd2eebf003820.jpg",
			"player_map": "https://64.media.tumblr.com/160dc26ae6f935364cf0f69577e5befd/86f1ecf48a38ba6e-38/s1280x1920/bc87111ffe50db437fe57557e36cd2eebf003820.jpg",
			"title": "CZEPEKU Map 162",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/3fce2a140d73be5a1bfe9a04bd9febe1/ba760c9795b1f2e1-c3/s1280x1920/1e473bf9a52b5fbab8f7947e97e2d9c72277d8a8.jpg",
			"player_map": "https://64.media.tumblr.com/3fce2a140d73be5a1bfe9a04bd9febe1/ba760c9795b1f2e1-c3/s1280x1920/1e473bf9a52b5fbab8f7947e97e2d9c72277d8a8.jpg",
			"title": "CZEPEKU Map 163",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/f82130d6f94d1c839724f22f05edd2fc/tumblr_pv0tf6Co3A1yofkpro1_1280.jpg",
			"player_map": "https://64.media.tumblr.com/f82130d6f94d1c839724f22f05edd2fc/tumblr_pv0tf6Co3A1yofkpro1_1280.jpg",
			"title": "CZEPEKU Map 164",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/971e4dab3e45c34739258909410822ce/d9a63c58325cdbc8-33/s1280x1920/cc1dea8fb24811fee5a0249e4d842c06040836e9.jpg",
			"player_map": "https://64.media.tumblr.com/971e4dab3e45c34739258909410822ce/d9a63c58325cdbc8-33/s1280x1920/cc1dea8fb24811fee5a0249e4d842c06040836e9.jpg",
			"title": "CZEPEKU Map 165",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/56767f746bd17fa84c153e45ec8924f1/1ef429c792f3a9e0-ea/s1280x1920/937ecc2eb442d3b74326e838497d4b52362535b7.jpg",
			"player_map": "https://64.media.tumblr.com/56767f746bd17fa84c153e45ec8924f1/1ef429c792f3a9e0-ea/s1280x1920/937ecc2eb442d3b74326e838497d4b52362535b7.jpg",
			"title": "CZEPEKU Map 166",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/00605ea31de71e9a9c95ff4bdd3de4a3/43cff71a4047d1a0-e7/s1280x1920/2c475361a8a30d9422ceecfee509bac7cbd306d2.jpg",
			"player_map": "https://64.media.tumblr.com/00605ea31de71e9a9c95ff4bdd3de4a3/43cff71a4047d1a0-e7/s1280x1920/2c475361a8a30d9422ceecfee509bac7cbd306d2.jpg",
			"title": "CZEPEKU Map 167",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/c51d409be11fb2a0b9ad3b5b6cb8236a/677d5bb5605d978f-f1/s1280x1920/0194cc2abba3382c2844ec39fc949c9c6f38da48.jpg",
			"player_map": "https://64.media.tumblr.com/c51d409be11fb2a0b9ad3b5b6cb8236a/677d5bb5605d978f-f1/s1280x1920/0194cc2abba3382c2844ec39fc949c9c6f38da48.jpg",
			"title": "CZEPEKU Map 168",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/863d650ef05c8e0e7f62745155527803/dc17144976450cab-37/s1280x1920/c758d407a4509550fe06be1561f9cce1d799a9e1.jpg",
			"player_map": "https://64.media.tumblr.com/863d650ef05c8e0e7f62745155527803/dc17144976450cab-37/s1280x1920/c758d407a4509550fe06be1561f9cce1d799a9e1.jpg",
			"title": "CZEPEKU Map 169",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/3ea35fdc361182b6207ee02b2cab30a8/cf23f4303e274748-73/s1280x1920/0dc0114f7269bbbb38f0a868561ba8ddad6c1ee3.jpg",
			"player_map": "https://64.media.tumblr.com/3ea35fdc361182b6207ee02b2cab30a8/cf23f4303e274748-73/s1280x1920/0dc0114f7269bbbb38f0a868561ba8ddad6c1ee3.jpg",
			"title": "CZEPEKU Map 170",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/40b22e0ca555cc84e344ef0e79d9e811/47a22a684067a1b3-b0/s1280x1920/582ae47fc4418b2d01260f20196508d4fe4b6b6e.jpg",
			"player_map": "https://64.media.tumblr.com/40b22e0ca555cc84e344ef0e79d9e811/47a22a684067a1b3-b0/s1280x1920/582ae47fc4418b2d01260f20196508d4fe4b6b6e.jpg",
			"title": "CZEPEKU Map 171",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/de7ee99c2bb36830e39b1c92291b3ac1/fb96a17778df629c-dd/s1280x1920/fa571def8278572a25f2da883bad7fd3051bd02c.jpg",
			"player_map": "https://64.media.tumblr.com/de7ee99c2bb36830e39b1c92291b3ac1/fb96a17778df629c-dd/s1280x1920/fa571def8278572a25f2da883bad7fd3051bd02c.jpg",
			"title": "CZEPEKU Map 172",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/895107e4b22b0910a8645e26640c952a/92a5fa34e7d1a526-2a/s1280x1920/f48baa907edb3667ed9e57eba3b55547a75ebf3a.jpg",
			"player_map": "https://64.media.tumblr.com/895107e4b22b0910a8645e26640c952a/92a5fa34e7d1a526-2a/s1280x1920/f48baa907edb3667ed9e57eba3b55547a75ebf3a.jpg",
			"title": "CZEPEKU Map 173",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/6f4109f966e5c27d5db2c74029d19410/76d6b144fdb59269-42/s1280x1920/04bd7b16408cdeaf49e8189170eb9cf7f30b93f4.jpg",
			"player_map": "https://64.media.tumblr.com/6f4109f966e5c27d5db2c74029d19410/76d6b144fdb59269-42/s1280x1920/04bd7b16408cdeaf49e8189170eb9cf7f30b93f4.jpg",
			"title": "CZEPEKU Map 174",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/d9bd629b1b6c20cbbac2aa60519b8e53/731c5114f2d4d15a-31/s1280x1920/dd48c5be59c5aefb2edb5552bda57f5f19289433.jpg",
			"player_map": "https://64.media.tumblr.com/d9bd629b1b6c20cbbac2aa60519b8e53/731c5114f2d4d15a-31/s1280x1920/dd48c5be59c5aefb2edb5552bda57f5f19289433.jpg",
			"title": "CZEPEKU Map 175",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/a522e95514b14b3efb6fe68afa8b652c/48a22c8fbd1d3cd0-59/s1280x1920/fd798f18fe3fa8b684208286bdfb6caa40062ed5.jpg",
			"player_map": "https://64.media.tumblr.com/a522e95514b14b3efb6fe68afa8b652c/48a22c8fbd1d3cd0-59/s1280x1920/fd798f18fe3fa8b684208286bdfb6caa40062ed5.jpg",
			"title": "CZEPEKU Map 176",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/3702c846763c18cd1b6d6a9cc8924e4b/316ebb4e0502f94e-35/s1280x1920/447398f6b4436711c4b2fa312ca945f954e49e7a.jpg",
			"player_map": "https://64.media.tumblr.com/3702c846763c18cd1b6d6a9cc8924e4b/316ebb4e0502f94e-35/s1280x1920/447398f6b4436711c4b2fa312ca945f954e49e7a.jpg",
			"title": "CZEPEKU Map 177",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/22764a4d02223c1a31ba8266f7318847/99f89220d9090937-c9/s1280x1920/4309c5e9a4a6601a99b289da565eb7ddc5772720.jpg",
			"player_map": "https://64.media.tumblr.com/22764a4d02223c1a31ba8266f7318847/99f89220d9090937-c9/s1280x1920/4309c5e9a4a6601a99b289da565eb7ddc5772720.jpg",
			"title": "CZEPEKU Map 178",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/577a7ecdbb4e4924915a8ac79500b3e7/f810c19465a7a5b5-b4/s1280x1920/dbfd731b575ae36899616fd4b9a0689129230e01.jpg",
			"player_map": "https://64.media.tumblr.com/577a7ecdbb4e4924915a8ac79500b3e7/f810c19465a7a5b5-b4/s1280x1920/dbfd731b575ae36899616fd4b9a0689129230e01.jpg",
			"title": "CZEPEKU Map 179",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/9662b6b42e9906cfdfe1ea4b8c304d85/123faa4a947d6b3e-da/s1280x1920/1a466b49d863c3b965785393157c10877eb416c0.jpg",
			"player_map": "https://64.media.tumblr.com/9662b6b42e9906cfdfe1ea4b8c304d85/123faa4a947d6b3e-da/s1280x1920/1a466b49d863c3b965785393157c10877eb416c0.jpg",
			"title": "CZEPEKU Map 180",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/78eb788f7b9b044d0a109186fa50303c/c0577ae8ce12f1b9-74/s1280x1920/ac95e0a60a90dc99b9e0214ffd15ce1689a5a1c5.jpg",
			"player_map": "https://64.media.tumblr.com/78eb788f7b9b044d0a109186fa50303c/c0577ae8ce12f1b9-74/s1280x1920/ac95e0a60a90dc99b9e0214ffd15ce1689a5a1c5.jpg",
			"title": "CZEPEKU Map 181",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/f3476b1c5f965ba5e3a5f92d6775eaf9/tumblr_prhx7roelA1yofkpro1_1280.jpg",
			"player_map": "https://64.media.tumblr.com/f3476b1c5f965ba5e3a5f92d6775eaf9/tumblr_prhx7roelA1yofkpro1_1280.jpg",
			"title": "CZEPEKU Map 182",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/83f8a12bfd58ccca58c8cf4c9e223580/eb7adda35f6f9843-96/s1280x1920/8c1d3dbf8bc4ff8a2132949114a10304d0ed06b2.jpg",
			"player_map": "https://64.media.tumblr.com/83f8a12bfd58ccca58c8cf4c9e223580/eb7adda35f6f9843-96/s1280x1920/8c1d3dbf8bc4ff8a2132949114a10304d0ed06b2.jpg",
			"title": "CZEPEKU Map 183",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/0293bfbd78724062f8061bf88527c606/7d99e2613b89a372-da/s1280x1920/9d4b3fbd760b7962c113a9acd124fc2561d7d011.jpg",
			"player_map": "https://64.media.tumblr.com/0293bfbd78724062f8061bf88527c606/7d99e2613b89a372-da/s1280x1920/9d4b3fbd760b7962c113a9acd124fc2561d7d011.jpg",
			"title": "CZEPEKU Map 184",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/8dd09296f3a8b884408c895eec30440d/42cdec8cf8ff129d-aa/s1280x1920/72b643f9a3cbbfa020108e4f9cae332c0cd7a24c.jpg",
			"player_map": "https://64.media.tumblr.com/8dd09296f3a8b884408c895eec30440d/42cdec8cf8ff129d-aa/s1280x1920/72b643f9a3cbbfa020108e4f9cae332c0cd7a24c.jpg",
			"title": "CZEPEKU Map 185",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/9b8a34668b89acce81fe2f2337788213/8a3bbfd3a346e07c-84/s1280x1920/d19a9df9b1d75913f81d14d33ee9b26995ca50b1.jpg",
			"player_map": "https://64.media.tumblr.com/9b8a34668b89acce81fe2f2337788213/8a3bbfd3a346e07c-84/s1280x1920/d19a9df9b1d75913f81d14d33ee9b26995ca50b1.jpg",
			"title": "CZEPEKU Map 186",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/107588ca48182059f3b44f177ba75248/b9001b2adc67d6e4-66/s1280x1920/b9f8101e2c577246130cc63dd324c93590edbae0.jpg",
			"player_map": "https://64.media.tumblr.com/107588ca48182059f3b44f177ba75248/b9001b2adc67d6e4-66/s1280x1920/b9f8101e2c577246130cc63dd324c93590edbae0.jpg",
			"title": "CZEPEKU Map 187",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/783671bcf0e93a83b380b7170a41fa87/aed4cd08434b9e28-66/s1280x1920/277ba3afc819c545290f7fc312ec91123e17071e.jpg",
			"player_map": "https://64.media.tumblr.com/783671bcf0e93a83b380b7170a41fa87/aed4cd08434b9e28-66/s1280x1920/277ba3afc819c545290f7fc312ec91123e17071e.jpg",
			"title": "CZEPEKU Map 188",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/854ebb96dc55a955ba6c8cffd9d80f04/tumblr_prglpjc0EQ1yofkpro1_1280.png",
			"player_map": "https://64.media.tumblr.com/854ebb96dc55a955ba6c8cffd9d80f04/tumblr_prglpjc0EQ1yofkpro1_1280.png",
			"title": "CZEPEKU Map 189",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/61737a21c7fc55862dc8dc916a7e6da5/89bfca1f8329ddd6-e2/s1280x1920/6c3a8ccbaf3251405374f299e4f31788ad094d39.jpg",
			"player_map": "https://64.media.tumblr.com/61737a21c7fc55862dc8dc916a7e6da5/89bfca1f8329ddd6-e2/s1280x1920/6c3a8ccbaf3251405374f299e4f31788ad094d39.jpg",
			"title": "CZEPEKU Map 190",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/4e032586a6e984168e77e6dd220ac56b/dce9fc629f9569c2-b6/s1280x1920/70abde65dbd1ba670f789f1cca684805c95a8313.jpg",
			"player_map": "https://64.media.tumblr.com/4e032586a6e984168e77e6dd220ac56b/dce9fc629f9569c2-b6/s1280x1920/70abde65dbd1ba670f789f1cca684805c95a8313.jpg",
			"title": "CZEPEKU Map 191",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/ace6f5b6603c843230f490a51d7c5818/tumblr_prhxliVXI51yofkpro1_1280.jpg",
			"player_map": "https://64.media.tumblr.com/ace6f5b6603c843230f490a51d7c5818/tumblr_prhxliVXI51yofkpro1_1280.jpg",
			"title": "CZEPEKU Map 192",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/d9ac6fa2835bf73b635c632ae5d60c0c/d4dd1052cf4b6fbd-f2/s1280x1920/336e87cd1d8ca4f489193db649a5170ebbb1b6dd.jpg",
			"player_map": "https://64.media.tumblr.com/d9ac6fa2835bf73b635c632ae5d60c0c/d4dd1052cf4b6fbd-f2/s1280x1920/336e87cd1d8ca4f489193db649a5170ebbb1b6dd.jpg",
			"title": "CZEPEKU Map 193",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/aa8995a4c91a75cddd0aba8fb3ef9119/tumblr_ptxozdi2oC1yofkpro1_1280.jpg",
			"player_map": "https://64.media.tumblr.com/aa8995a4c91a75cddd0aba8fb3ef9119/tumblr_ptxozdi2oC1yofkpro1_1280.jpg",
			"title": "CZEPEKU Map 194",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/51c81286b5d391ce33d16bc0fd59e838/tumblr_pv80t8DAyE1yofkpro1_1280.jpg",
			"player_map": "https://64.media.tumblr.com/51c81286b5d391ce33d16bc0fd59e838/tumblr_pv80t8DAyE1yofkpro1_1280.jpg",
			"title": "CZEPEKU Map 195",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/27dd432d39af4a8e7e95941d818d8734/tumblr_putkphyKQ31yofkpro1_1280.jpg",
			"player_map": "https://64.media.tumblr.com/27dd432d39af4a8e7e95941d818d8734/tumblr_putkphyKQ31yofkpro1_1280.jpg",
			"title": "CZEPEKU Map 196",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/aa41fc5809142768a6700d7eaf10841e/7e71f96fbe8d1b5f-ec/s1280x1920/50d1a0fec4374a870f92d4913f206e4e7e6ba10a.jpg",
			"player_map": "https://64.media.tumblr.com/aa41fc5809142768a6700d7eaf10841e/7e71f96fbe8d1b5f-ec/s1280x1920/50d1a0fec4374a870f92d4913f206e4e7e6ba10a.jpg",
			"title": "CZEPEKU Map 197",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/969870062ae62bc03b5384b3112d17d6/c9e599b22077aafa-91/s1280x1920/f28aafbd2742c219e1ff60f8ccc71de9637d1863.jpg",
			"player_map": "https://64.media.tumblr.com/969870062ae62bc03b5384b3112d17d6/c9e599b22077aafa-91/s1280x1920/f28aafbd2742c219e1ff60f8ccc71de9637d1863.jpg",
			"title": "CZEPEKU Map 198",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/0952d6f9edd7a069d1e5103058364690/e4374fde49d62c95-4b/s1280x1920/1443b2fb171781b44073a806a8d79a6099e69248.jpg",
			"player_map": "https://64.media.tumblr.com/0952d6f9edd7a069d1e5103058364690/e4374fde49d62c95-4b/s1280x1920/1443b2fb171781b44073a806a8d79a6099e69248.jpg",
			"title": "CZEPEKU Map 199",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/4f1ca26a2bf022de0ef61d7661bd835e/7ba5d09f50712a74-25/s1280x1920/36d1cde6e52b76741364cba7f76c9448387f4b71.jpg",
			"player_map": "https://64.media.tumblr.com/4f1ca26a2bf022de0ef61d7661bd835e/7ba5d09f50712a74-25/s1280x1920/36d1cde6e52b76741364cba7f76c9448387f4b71.jpg",
			"title": "CZEPEKU Map 200",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/754928f2233c02dfa8e72ce060c8b712/tumblr_prhx3tpUR71yofkpro1_1280.jpg",
			"player_map": "https://64.media.tumblr.com/754928f2233c02dfa8e72ce060c8b712/tumblr_prhx3tpUR71yofkpro1_1280.jpg",
			"title": "CZEPEKU Map 201",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/8ba150f11ed701db3a8741f9128e5d05/tumblr_pzklteBk6K1yofkpro1_1280.jpg",
			"player_map": "https://64.media.tumblr.com/8ba150f11ed701db3a8741f9128e5d05/tumblr_pzklteBk6K1yofkpro1_1280.jpg",
			"title": "CZEPEKU Map 202",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/ac515d339c1ee1a05a72649a241b1c54/tumblr_py6ya8wj1C1yofkpro1_1280.jpg",
			"player_map": "https://64.media.tumblr.com/ac515d339c1ee1a05a72649a241b1c54/tumblr_py6ya8wj1C1yofkpro1_1280.jpg",
			"title": "CZEPEKU Map 203",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/76fee3f7ea14aa029e2c51a593692e4d/tumblr_py6xy2WRyw1yofkpro1_1280.jpg",
			"player_map": "https://64.media.tumblr.com/76fee3f7ea14aa029e2c51a593692e4d/tumblr_py6xy2WRyw1yofkpro1_1280.jpg",
			"title": "CZEPEKU Map 204",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/77109e45e699fe3b43b9d1b69e396a76/tumblr_pxy3tp1gfe1yofkpro1_1280.jpg",
			"player_map": "https://64.media.tumblr.com/77109e45e699fe3b43b9d1b69e396a76/tumblr_pxy3tp1gfe1yofkpro1_1280.jpg",
			"title": "CZEPEKU Map 205",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/a92377f3417e9ccb7040e09b92c75ac9/tumblr_pxmm9hEKup1yofkpro1_1280.jpg",
			"player_map": "https://64.media.tumblr.com/a92377f3417e9ccb7040e09b92c75ac9/tumblr_pxmm9hEKup1yofkpro1_1280.jpg",
			"title": "CZEPEKU Map 206",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/ee9e08c9567cfb614307211589ae9ed9/tumblr_pww60wfTi21yofkpro1_1280.jpg",
			"player_map": "https://64.media.tumblr.com/ee9e08c9567cfb614307211589ae9ed9/tumblr_pww60wfTi21yofkpro1_1280.jpg",
			"title": "CZEPEKU Map 207",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/b653b83e12070a820db9ca1e96fd06f5/tumblr_pv0um5ErbU1yofkpro1_1280.jpg",
			"player_map": "https://64.media.tumblr.com/b653b83e12070a820db9ca1e96fd06f5/tumblr_pv0um5ErbU1yofkpro1_1280.jpg",
			"title": "CZEPEKU Map 208",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/e6da1cf83d0c8fe1928ad272ba63f56c/tumblr_pv0uguB5CI1yofkpro1_1280.jpg",
			"player_map": "https://64.media.tumblr.com/e6da1cf83d0c8fe1928ad272ba63f56c/tumblr_pv0uguB5CI1yofkpro1_1280.jpg",
			"title": "CZEPEKU Map 209",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/9e2ddb2405340c938fa5b17224301b99/tumblr_pv0ub2Ilsv1yofkpro1_1280.jpg",
			"player_map": "https://64.media.tumblr.com/9e2ddb2405340c938fa5b17224301b99/tumblr_pv0ub2Ilsv1yofkpro1_1280.jpg",
			"title": "CZEPEKU Map 210",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/ab5932277c6d7719b00fae966e222044/tumblr_pv0u3cXROu1yofkpro1_1280.jpg",
			"player_map": "https://64.media.tumblr.com/ab5932277c6d7719b00fae966e222044/tumblr_pv0u3cXROu1yofkpro1_1280.jpg",
			"title": "CZEPEKU Map 211",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/010f83863300e9b0ffe65af342233c92/tumblr_pv0ttxPa4V1yofkpro1_1280.jpg",
			"player_map": "https://64.media.tumblr.com/010f83863300e9b0ffe65af342233c92/tumblr_pv0ttxPa4V1yofkpro1_1280.jpg",
			"title": "CZEPEKU Map 212",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/c9730606a003b2c8eed3003c5519bfb3/tumblr_puwvskI2Dj1yofkpro1_1280.jpg",
			"player_map": "https://64.media.tumblr.com/c9730606a003b2c8eed3003c5519bfb3/tumblr_puwvskI2Dj1yofkpro1_1280.jpg",
			"title": "CZEPEKU Map 213",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/345f42be90efccfc1f763c8277334b9d/tumblr_ptj0l2OIRs1yofkpro1_1280.jpg",
			"player_map": "https://64.media.tumblr.com/345f42be90efccfc1f763c8277334b9d/tumblr_ptj0l2OIRs1yofkpro1_1280.jpg",
			"title": "CZEPEKU Map 214",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/319a629924c701bf856c59c76b2f504f/tumblr_prgkxjDRuU1yofkpro1_1280.png",
			"player_map": "https://64.media.tumblr.com/319a629924c701bf856c59c76b2f504f/tumblr_prgkxjDRuU1yofkpro1_1280.png",
			"title": "CZEPEKU Map 215",
			"scale": 100,
			"dm_map": ""
		},
		{
			"thumb": "https://64.media.tumblr.com/8f6544a69898b5f0e2e10fc6b10ac0a8/tumblr_prgkpkA7ji1yofkpro1_1280.jpg",
			"player_map": "https://64.media.tumblr.com/8f6544a69898b5f0e2e10fc6b10ac0a8/tumblr_prgkpkA7ji1yofkpro1_1280.jpg",
			"title": "CZEPEKU Map 216",
			"scale": 100,
			"dm_map": ""
		}
	]
};

var CONDITIONS = {
    "Blinded": [
        "A blinded creature can’t see and automatically fails any ability check that requires sight.",
        "Attack rolls against the creature have advantage, and the creature’s attack rolls have disadvantage."
    ],
    "Charmed": [
        "A charmed creature can’t attack the charmer or target the charmer with harmful abilities or magical effects.",
        "The charmer has advantage on any ability check to interact socially with the creature."
    ],
    "Deafened": [
        "A deafened creature can’t hear and automatically fails any ability check that requires hearing."
    ],
    "Exhaustion": [
        "Some special abilities and environmental hazards, such as starvation and the long-term effects of freezing or scorching temperatures, can lead to a special condition called exhaustion. Exhaustion is measured in six levels. An effect can give a creature one or more levels of exhaustion, as specified in the effect’s description.",
		"\n",
		"Table:",
		"Level 1: Disadvantage on ability checks.",
		"Level 2: Speed halved.",
		"Level 3: Disadvantage on attack rolls and saving throws.",
		"Level 4: Hit point maximum halved.",
		"Level 5: Speed reduced to 0.",
		"Level 6: Death.",
		"\n",
		"If an already exhausted creature suffers another effect that causes exhaustion, its current level of exhaustion increases by the amount specified in the effect’s description.",
		"A creature suffers the effect of its current level of exhaustion as well as all lower levels. For example, a creature suffering level 2 exhaustion has its speed halved and has disadvantage on ability checks.",
		"An effect that removes exhaustion reduces its level as specified in the effect’s description, with all exhaustion effects ending if a creature’s exhaustion level is reduced below 1.",
		"Finishing a long rest reduces a creature’s exhaustion level by 1, provided that the creature has also ingested some food and drink."
	],
    "Frightened": [
        "A frightened creature has disadvantage on ability checks and attack rolls while the source of its fear is within line of sight.",
        "The creature can’t willingly move closer to the source of its fear."
    ],
    "Grappled": [
        "A grappled creature’s speed becomes 0, and it can’t benefit from any bonus to its speed.",
        "The condition ends if the grappler is incapacitated (see the condition).",
        "The condition also ends if an effect removes the grappled creature from the reach of the grappler or grappling effect, such as when a creature is hurled away by the *thunder-wave* spell."
    ],
    "Incapacitated": [
        "An incapacitated creature can’t take actions or reactions."
    ],
    "Invisible": [
        "An invisible creature is impossible to see without the aid of magic or a special sense. For the purpose of hiding, the creature is heavily obscured. The creature’s location can be detected by any noise it makes or any tracks it leaves.",
        "Attack rolls against the creature have disadvantage, and the creature’s attack rolls have advantage."
    ],
    "Paralyzed": [
        "A paralyzed creature is incapacitated (see the condition) and can’t move or speak.",
        "The creature automatically fails Strength and Dexterity saving throws.",
        "Attack rolls against the creature have advantage.",
        "Any attack that hits the creature is a critical hit if the attacker is within 5 feet of the creature."
    ],
    "Petrified": [
        "A petrified creature is transformed, along with any nonmagical object it is wearing or carrying, into a solid inanimate substance (usually stone). Its weight increases by a factor of ten, and it ceases aging.",
        "The creature is incapacitated (see the condition), can’t move or speak, and is unaware of its surroundings.",
        "Attack rolls against the creature have advantage.",
        "The creature automatically fails Strength and Dexterity saving throws.",
        "The creature has resistance to all damage.",
        "The creature is immune to poison and disease, although a poison or disease already in its system is suspended, not neutralized."
    ],
    "Poisoned": [
        "A poisoned creature has disadvantage on attack rolls and ability checks."
    ],
    "Prone": [
        "A prone creature’s only movement option is to crawl, unless it stands up and thereby ends the condition.",
        "The creature has disadvantage on attack rolls.",
        "An attack roll against the creature has advantage if the attacker is within 5 feet of the creature. Otherwise, the attack roll has disadvantage."
    ],
    "Restrained": [
        "A restrained creature’s speed becomes 0, and it can’t benefit from any bonus to its speed.",
        "Attack rolls against the creature have advantage, and the creature’s attack rolls have disadvantage.",
        "The creature has disadvantage on Dexterity saving throws."
    ],
    "Stunned": [
        "A stunned creature is incapacitated (see the condition), can’t move, and can speak only falteringly.",
        "The creature automatically fails Strength and Dexterity saving throws.",
        "Attack rolls against the creature have advantage."
    ],
    "Unconscious": [
        "An unconscious creature is incapacitated (see the condition), can’t move or speak, and is unaware of its surroundings",
        "The creature drops whatever it’s holding and falls prone.",
        "The creature automatically fails Strength and Dexterity saving throws.",
        "Attack rolls against the creature have advantage.",
        "Any attack that hits the creature is a critical hit if the attacker is within 5 feet of the creature."
    ]
}
