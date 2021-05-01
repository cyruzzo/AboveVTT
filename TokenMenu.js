
tokenbuiltin={
			folders:{
				'Overlays':{
					tokens:{
						'Big Bang':{
							'data-img':'https://drive.google.com/file/d/19pbEuWVSQo15vmlsnJry-q3ordcAlaej/view?usp=sharing'
						}
					}
				},
				'Traps':{
					tokens:{
						'Generic Test':{
							'data-img':'https://www.enworld.org/attachments/female_human_wizard_t01-png.121370/',
						}
					}
				},
				'Letters':{},
			}
		};
		

tokendata={
	folders:{},
};


function init_tokenmenu(){
	var button=$("<button id='switch_tokens' data-target='#tokens-panel'>T</button>");
	button.click(switch_control);
	$(".sidebar__controls").append(button);
	
	
	if(localStorage.getItem('CustomTokens') != null){
		tokendata=$.parseJSON(localStorage.getItem('CustomTokens'));
	}
	tokendata.folders['AboveVTT BUILTIN']=tokenbuiltin;
	tokens_panel=$("<div id='tokens-panel' class='sidepanel-content'/>");
	tokens_panel.hide();
	tokens_panel.append("<div id='tokens-panel-warning'>THIS IS STILL EXPERIMENTAL. DON'T START SPENDING HOURS ADDING TOKENS YET. YOU MAY LOOSE THEM</div>");
	header=$("<div id='tokens-panel-header'/>");
	tokens_panel.append(header);
	addfolder=$("<button id='token-addfolder'>Add Folder</button>");
	
	addfolder.click(function(){
		var newfoldername=prompt("Enter the name of the new folder");
		if(!window.CURRENT_TOKEN_FOLDER.folders)
			window.CURRENT_TOKEN_FOLDER.folders={};
		window.CURRENT_TOKEN_FOLDER.folders[newfoldername]={};
		fill_tokenmenu(window.CURRENT_TOKEN_PATH);
	});
	
	header.append(addfolder);
	addtoken=$("<button id='token-addtoken'>Add Token</button>");
	addtoken.click(function(){
		if($("#token-form").is(":hidden"))
			$("#token-form").show();
	});
	header.append(addtoken);
	
	
	tokenform=$("<div id='token-form'/>");
	
	tokenform.append(`
		<form>
			<div>
				<div>Name</div>
				<div><input name='data-name'></div>
			</div>
			<div>
				<div>Image URL:</div>
				<div><input name='data-img'></div>
			</div>
			<div>
				<div>Image type</div>
				<div><select name='data-square'><option value='0'>Round</option><option value='1'>Square</option></select></div>
			</div>
			<div>
				<button id='tokenform-save'>Save</button>
				<button id='tokenform-cancel'>Cancel</button>
			</div>
		</form>
	`);
	
	tokenform.find("form").on('submit',function(e) { e.preventDefault(); });
	tokenform.find("#tokenform-save").click(function(){
		var tokenname=tokenform.find("[name='data-name']").val();
		var newtoken={};
		newtoken['data-img']=tokenform.find("[name='data-img']").val();
		newtoken['data-square']=tokenform.find("[name='data-square']").val();
		newtoken['data-name']=tokenform.find("[name='data-name']").val();
		
		if(!window.CURRENT_TOKEN_FOLDER.tokens)
			window.CURRENT_TOKEN_FOLDER.tokens={};
		window.CURRENT_TOKEN_FOLDER.tokens[tokenname]=newtoken;
		fill_tokenmenu(window.CURRENT_TOKEN_PATH);
		tokenform.hide();
	});
	
	tokenform.find("#tokenform-cancel").click(function(){
		tokenform.hide();
	});
	
	tokenform.hide();
	tokens_panel.append(tokenform);
	tokens_panel.append("<div id='tokens-panel-data' />");
	$(".sidebar__pane-content").append(tokens_panel);
	fill_tokenmenu("");
}

function convert_path(path){
	var pieces=path.split("/");
	var current=tokendata;
	
	for(var i=0;i<pieces.length;i++){
		if(pieces[i]=="")
			continue;
		current=current.folders[pieces[i]];
	}
	return current;
}

function fill_tokenmenu(path){
	console.log(path);
	var folder=convert_path(path);
	window.CURRENT_TOKEN_FOLDER=folder;
	window.CURRENT_TOKEN_PATH=path;
	$("#tokens-panel-data").empty();
	
	if (path.startsWith("/AboveVTT BUILTIN")){
		$("#token-addfolder").attr("disabled","disabled");
		$("#token-addtoken").attr("disabled","disabled");
	}
	else{
		$("#token-addfolder").removeAttr("disabled");
		$("#token-addtoken").removeAttr("disabled");
	}
	
	if(path!="/"){
		var previous=path.substring(0,path.lastIndexOf("/"));
		var newentry=$(`
			<div data-path='${previous}' class='tokenfolder tokenmenuitem'>
				<img class='tokenentryimg' src='${window.EXTENSION_PATH+"assets/folder.svg"}'>
				<div>..</div>
			</div>
		`);
		$("#tokens-panel-data").append(newentry);
	}
	
	
	for(let f in folder.folders){
		var newpath=path+"/"+f;
		var newentry=$(`
			<div data-path='${newpath}' class='tokenfolder tokenmenuitem'>
				<img class='tokenentryimg' src='${window.EXTENSION_PATH+"assets/folder.svg"}'>
				<div>${f}</div>
			</div>
		`);
		$("#tokens-panel-data").append(newentry);
	}
	$(".tokenfolder").click(function(e){
		fill_tokenmenu($(this).attr('data-path'));
	});
	
	for(let t in folder.tokens){
		var newentry=$(`
			<div class='tokenentry tokenmenuitem'>
				<img class='tokenentryimg' src='${folder.tokens[t]["data-img"]}'></img>
				<div>${t}</div>
				<button class='tokenadd' >Token</button>
			</div>
		`);
		
		for(prop in folder.tokens[t]){
			newentry.find(".tokenadd").attr(prop,folder.tokens[t][prop]);
		}
		
		$("#tokens-panel-data").append(newentry);
	}
	
	$(".tokenadd").click(token_button);
}

function persist_customtokens(){
	
}
