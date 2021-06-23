
function download(data, filename, type) {
    var file = new Blob([data], {type: type});
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement("a"),
                url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);  
        }, 0); 
    }
}


function init_settings(){
	settings_panel = $("<div id='settings-panel' class='sidepanel-content'/>");
	settings_panel.hide();
	$(".sidebar__pane-content").append(settings_panel);
	settings_panel.append("<div class='panel-warning'>EXPERIMENTAL FEATURE ( again?!? :) )</div>");
	
	settings_panel.append("<button onclick='export_file();'>Save Data to File</button>");
	settings_panel.append("<button onclick='import_file();'>Open File</button>");
}

function export_file(){
	var DataFile={
		scenes:[],
		};
	for(i=0;i<window.ScenesHandler.scenes.length;i++){
		// CHECK IF THE MAP IS FROM DNDBEYOND
		var scene=Object.assign({}, window.ScenesHandler.scenes[i]);
		console.log(scene);
		if(scene.player_map.includes("media-waterdeep.cursecdn.com/") && uuid!=""){
			scene.player_map="##UUID##";
		}
		if(scene.dm_map.includes("media-waterdeep.cursecdn.com/") && uuid!=""){
			scene.dm_map="##UUID##";
		}
		DataFile.scenes.push(scene);
	}
	download(JSON.stringify(DataFile,null,"\t"),"DataFile.abovevtt","text/plain");
};


function import_scene(){
	
}
