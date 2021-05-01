
tokenbuiltin={
			folders:{
				'Overlays':{
					tokens:{
						'Blood':{
							'data-img': 'https://drive.google.com/file/d/1frTuvq-64DA23ayC6P0XGZyo0M6paEID/view?usp=sharing',
							'data-disablestat':true,
							'data-disableborder':true,
						},
						'Big Bang':{
							'data-img':'https://drive.google.com/file/d/19pbEuWVSQo15vmlsnJry-q3ordcAlaej/view?usp=sharing',
							'data-disablestat':true,
							'data-disableborder':true,
						}
					}
				},
				'NPC':{
					
				}
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
	tokens_panel.append("<div id='tokens-panel-warning'>THIS IS AN EXPERIMENTAL FEATURE. DON'T START SPENDING HOURS ADDING TOKENS YET. YOU MAY LOOSE THEM</div>");
	header=$("<div id='tokens-panel-header'/>");
	tokens_panel.append(header);
	addfolder=$("<button id='token-addfolder'>Add Folder</button>");
	
	addfolder.click(function(){
		var newfoldername=prompt("Enter the name of the new folder");
		if(!window.CURRENT_TOKEN_FOLDER.folders)
			window.CURRENT_TOKEN_FOLDER.folders={};
		window.CURRENT_TOKEN_FOLDER.folders[newfoldername]={};
		fill_tokenmenu(window.CURRENT_TOKEN_PATH);
		persist_customtokens();
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
			<!--<div>
				<div>Image type</div>
				<div><select name='data-square'><option value='0'>Round</option><option value='1'>Square</option></select></div>
			</div>-->
			<div>
				<div>Hide Border</div>
				<div><input type='checkbox' name='data-disableborder'></div>
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
		//newtoken['data-square']=tokenform.find("[name='data-square']").val();
		newtoken['data-name']=tokenform.find("[name='data-name']").val();
		newtoken['data-disablestat']=true;
		if(tokenform.find("[name='data-disableborder']").is(":checked"))
			newtoken['data-disableborder']=true;
		
		if(!window.CURRENT_TOKEN_FOLDER.tokens)
			window.CURRENT_TOKEN_FOLDER.tokens={};
		window.CURRENT_TOKEN_FOLDER.tokens[tokenname]=newtoken;
		fill_tokenmenu(window.CURRENT_TOKEN_PATH);
		tokenform.hide();
		persist_customtokens();
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
	
	if(path!=""){
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
				<button></button>
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
				<img class='tokenentryimg' src='${parse_img(folder.tokens[t]["data-img"])}'></img>
				<div>${t}</div>
				<button class='tokenadd' >Token</button>
			</div>
		`);
		
		if(!path.startsWith("/AboveVTT BUILTIN")){
			delbutton=$("<button class='tokendel'>DEL</button>");
			delbutton.attr('data-target',t);
			newentry.append(delbutton);
		}
		
		for(prop in folder.tokens[t]){
			newentry.find(".tokenadd").attr(prop,folder.tokens[t][prop]);
		}
		
		newentry.find(".tokendel").click(function(){
			delete window.CURRENT_TOKEN_FOLDER.tokens[$(this).attr('data-target')];
			fill_tokenmenu(window.CURRENT_TOKEN_PATH);
			persist_customtokens();
		});
		
		$("#tokens-panel-data").append(newentry);
	}
	
	$(".tokenadd").click(token_button);
}

function persist_customtokens(){
	tokendata.folders["AboveVTT BUILTIN"]={};
	localStorage.setItem("CustomTokens",JSON.stringify(tokendata));
	tokendata.folders["AboveVTT BUILTIN"]=tokenbuiltin;
}
