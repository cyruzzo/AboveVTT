const POLYGON_CLOSE_DISTANCE = 15;


function sync_fog(){
	window.MB.sendMessage("custom/myVTT/fogdata",window.REVEALED);
}

function sync_drawings(){
	window.MB.sendMessage("custom/myVTT/drawdata",window.DRAWINGS);
}



function roundRect(ctx, x, y, width, height, radius, fill, stroke) {

	if (typeof stroke == "undefined" ) {
	  stroke = true;
	}
	if (typeof radius === "undefined") {
	  radius = 5;
	}
	ctx.beginPath();
	ctx.moveTo(x + radius, y);
	ctx.lineTo(x + width - radius, y);
	ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
	ctx.lineTo(x + width, y + height - radius);
	ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
	ctx.lineTo(x + radius, y + height);
	ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
	ctx.lineTo(x, y + radius);
	ctx.quadraticCurveTo(x, y, x + radius, y);
	ctx.closePath();
	if (stroke) {
	  ctx.stroke();
	}
	if (fill) {
	  ctx.fill();
	}
}

/**
 * Class to manage measure waypoints
 */
class WaypointManagerClass {

	constructor(){
		this.canvas=undefined;
		this.ctx=undefined;
		this.numWaypoints = 0;
		this.coords = [];
		this.currentWaypointIndex = 0;
		this.mouseDownCoords = { mousex: undefined, mousey: undefined };
		this.timeout = undefined;
		this.timerId = undefined;
		this.drawStyle = {
			lineWidth: Math.max(25 * Math.max((1 - window.ZOOM), 0), 5),
			color: window.color ? window.color : "#f2f2f2",
			outlineColor: "black",
			textColor: "black",
			backgroundColor: "rgba(255, 255, 255, 0.7)"
		}
	}

	resetDefaultDrawStyle(){
		this.drawStyle = {
			lineWidth: Math.max(25 * Math.max((1 - window.ZOOM), 0), 5),
			color: window.color ? window.color : "#f2f2f2",
			outlineColor: "black",
			textColor: "black",
			backgroundColor: "rgba(255, 255, 255, 0.7)"
		}
	}

	// Set canvas and further set context

	setCanvas(canvas) {

		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");
	}

	// Are we in the middle of measuring?
	isMeasuring() {

		return this.numWaypoints != 0;
	}

	// Store a waypoint in the array
	storeWaypoint(index, startX, startY, endX, endY) {

		// Check if we have this waypoint in our array, if not then increment how many waypoints we have
		if (typeof this.coords[index] === 'undefined') {
			this.numWaypoints++;
		}

		// If this is the first segment we store the values as passed in
		if (this.numWaypoints == 1) {
			this.coords[index] = { startX: startX, startY: startY, endX: endX, endY: endY, distance: 0 };
		}
		else {
			// If this is NOT the first, then we stitch the segments together by setting the start of this one to the end of the previous one
			this.coords[index] = { startX: this.coords[index - 1].endX, startY: this.coords[index - 1].endY, endX: endX, endY: endY, distance: 0 };
		}
	}

	// Draw a nice circle
	drawBobble(x, y, radius) {

		if(radius == undefined) {
			radius = Math.floor(Math.max(15 * Math.max((1 - window.ZOOM), 0)/window.CURRENT_SCENE_DATA.scale_factor, 2));
		}

		this.ctx.beginPath();
		this.ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
		this.ctx.lineWidth = radius
		this.ctx.strokeStyle = this.drawStyle.outlineColor
		this.ctx.stroke();
		this.ctx.fillStyle =  this.drawStyle.color
		this.ctx.fill();
	}

	// Increment the current index into the array of waypoints, and draw a small indicator
	checkNewWaypoint(mousex, mousey) {
			//console.log("Incrementing waypoint");
			this.currentWaypointIndex++;

			// Draw an indicator for cosmetic niceness
			var snapCoords = this.getSnapPointCoords(mousex, mousey);
			this.drawBobble(snapCoords.x, snapCoords.y, Math.max(15 * Math.max((1 - window.ZOOM), 0)/window.CURRENT_SCENE_DATA.scale_factor, 3));
	}

	// Track mouse moving
	registerMouseMove(mousex, mousey) {

		this.mouseDownCoords.mousex = mousex;
		this.mouseDownCoords.mousey = mousey;
	}

	// On mouse up, clear out the waypoints
	clearWaypoints() {

		this.numWaypoints = 0;
		this.coords = [];
		this.currentWaypointIndex = 0;
		this.mouseDownCoords = { mousex: undefined, mousey: undefined };
		clearTimeout(this.timeout);
		this.timeout = undefined;
		this.cancelFadeout()
	}

	// Helper function to convert mouse coordinates to 'snap' or 'centre of current grid cell' coordinates
	getSnapPointCoords(x, y) {
		if (!$('#measure-button').hasClass('button-enabled')) {
			// only snap if the ruler tool is selected.
			// The select tool manages the snapping based on ctrl key, scene settings, etc. so let it do it's thing
			return { x: x, y: y };
		}

		x -= window.CURRENT_SCENE_DATA.offsetx;
		y -= window.CURRENT_SCENE_DATA.offsety;

		var gridSize = window.CURRENT_SCENE_DATA.hpps/window.CURRENT_SCENE_DATA.scale_factor;
		var currGridX = Math.floor(x / gridSize);
		var currGridY = Math.floor(y / gridSize);
		var snapPointXStart = (currGridX * gridSize) + (gridSize/2);
		var snapPointYStart = (currGridY * gridSize);

		// Add in scene offset
		snapPointXStart += window.window.CURRENT_SCENE_DATA.offsetx/window.CURRENT_SCENE_DATA.scale_factor;
		snapPointYStart += window.window.CURRENT_SCENE_DATA.offsety/window.CURRENT_SCENE_DATA.scale_factor;

		return { x: snapPointXStart, y: snapPointYStart }
	}

	// Draw the waypoints, note that we sum up the cumulative distance, midlineLabels is true for token drag
	// as otherwise the token sits on the measurement label
	draw(midlineLabels, labelX, labelY) {

		var cumulativeDistance = 0
		for (var i = 0; i < this.coords.length; i++) {
			// We do the beginPath here because otherwise the lines on subsequent waypoints get
			// drawn over the labels...
			this.ctx.beginPath();
			if (i < this.coords.length - 1) {
				this.drawWaypointSegment(this.coords[i], cumulativeDistance, midlineLabels);
			} else {
				this.drawWaypointSegment(this.coords[i], cumulativeDistance, midlineLabels, labelX, labelY);
			}
			cumulativeDistance += this.coords[i].distance;
		}
	}

	// Draw a waypoint segment with all the lines and labels etc.
	drawWaypointSegment(coord, cumulativeDistance, midlineLabels, labelX, labelY) {

		// Snap to centre of current grid square
		var gridSize = window.CURRENT_SCENE_DATA.hpps/window.CURRENT_SCENE_DATA.scale_factor;
		var snapPointXStart = coord.startX;
		var snapPointYStart = coord.startY;
		this.ctx.moveTo(snapPointXStart, snapPointYStart);

		var snapPointXEnd = coord.endX;
		var snapPointYEnd = coord.endY;

		// Pull the scene data for units, unless it doesn't exist (i.e. older maps)
		if (typeof window.CURRENT_SCENE_DATA.upsq !== "undefined")
			var unitSymbol = window.CURRENT_SCENE_DATA.upsq;
		else
			var unitSymbol = 'ft'

		// Calculate the distance and set into the waypoint object
		var distance = Math.max(Math.abs(snapPointXStart - snapPointXEnd), Math.abs(snapPointYStart - snapPointYEnd));
		distance = Math.round(distance / gridSize);
		distance = distance * window.CURRENT_SCENE_DATA.fpsq;
		coord.distance = distance;

		var textX = 0;
		var textY = 0;
		var margin = 2;
		var heightOffset = 30;
		var slopeModifier = 0;

		// Setup text metrics
		this.ctx.font = Math.max(150 * Math.max((1 - window.ZOOM), 0)/window.CURRENT_SCENE_DATA.scale_factor, 26) + "px Arial";
		const totalDistance = Number.isInteger(distance + cumulativeDistance)
			? (distance + cumulativeDistance)
			: (distance + cumulativeDistance).toFixed(1)
		var text = `${totalDistance}${unitSymbol}`
		var textMetrics = this.ctx.measureText(text);

		// Calculate our positions and dmensions based on if we are measuring (midlineLabels == false) or
		// token dragging (midlineLabels == true)
		var contrastRect = { x: 0, y: 0, width: 0, height: 0 }
		var textRect = { x: 0, y: 0, width: 0, height: 0 }

		if (midlineLabels === true) {

			// Calculate our coords and dimensions
			textX = (snapPointXStart + snapPointXEnd) / 2;
			textY = (snapPointYStart + snapPointYEnd) / 2;

			contrastRect.x = textX - margin;
			contrastRect.y = textY - margin;
			contrastRect.width = textMetrics.width + (margin * 4);
			contrastRect.height = heightOffset + (margin * 3);

			textRect.x = textX;
			textRect.y = textY;
			textRect.width = textMetrics.width + (margin * 3);
			textRect.height = heightOffset + margin;

			// Knock the text down slightly
			textY += (margin * 2);
		} else if (labelX !== undefined && labelY !== undefined) {

			// Calculate our coords and dimensions
			contrastRect.x = labelX - margin + slopeModifier;
			contrastRect.y = labelY - margin + slopeModifier;
			contrastRect.width = textMetrics.width + (margin * 4);
			contrastRect.height =  Math.max(150 * Math.max((1 - window.ZOOM), 0)/window.CURRENT_SCENE_DATA.scale_factor, 30) + (margin * 3);

			textRect.x = labelX + slopeModifier;
			textRect.y = labelY + slopeModifier;
			textRect.width = textMetrics.width + (margin * 3);
			textRect.height =  Math.max(150 * Math.max((1 - window.ZOOM), 0)/window.CURRENT_SCENE_DATA.scale_factor, 30) + margin;

			textRect.x -= (textRect.width / 2);
			textX = (labelX + margin + slopeModifier - (textRect.width / 2));
			textY = (labelY + (margin * 2) + slopeModifier);
		} else {
			// Calculate slope modifier so we can float the rectangle away from the line end, all a bit magic number-y
			if (snapPointYStart <= snapPointYEnd) {
				// Push right and down
				slopeModifier = margin * 4;
			}
			else {
				// Push up and left, bigger number as whole rect height pushed
				slopeModifier = -heightOffset - (margin * 4);
			}

			// Need to further tweak the modifier if we are on the right hand side of the map
			if (snapPointXEnd + gridSize > this.canvas.width) {
				slopeModifier = -(heightOffset * 1.5);
			}

			// Calculate our coords and dimensions
			contrastRect.x = snapPointXEnd - margin + slopeModifier;
			contrastRect.y = snapPointYEnd - margin + slopeModifier;
			contrastRect.width = textMetrics.width + (margin * 4);
			contrastRect.height =  Math.max(150 * Math.max((1 - window.ZOOM), 0)/window.CURRENT_SCENE_DATA.scale_factor, 30) + (margin * 3);

			textRect.x = snapPointXEnd + slopeModifier;
			textRect.y = snapPointYEnd + slopeModifier;
			textRect.width = textMetrics.width + (margin * 3);
			textRect.height =  Math.max(150 * Math.max((1 - window.ZOOM), 0)/window.CURRENT_SCENE_DATA.scale_factor, 30) + margin;

			textX = snapPointXEnd + margin + slopeModifier;
			textY = snapPointYEnd + (margin * 2) + slopeModifier;
		}

		// Draw our 'contrast line'
		this.ctx.strokeStyle = this.drawStyle.outlineColor
		this.ctx.lineWidth = Math.floor(Math.max(25 * Math.max((1 - window.ZOOM), 0)/window.CURRENT_SCENE_DATA.scale_factor, 3));
		this.ctx.lineTo(snapPointXEnd, snapPointYEnd);
		this.ctx.stroke();

		// Draw our centre line
		this.ctx.strokeStyle = this.drawStyle.color
		this.ctx.lineWidth = Math.floor(Math.max(15 * Math.max((1 - window.ZOOM), 0)/window.CURRENT_SCENE_DATA.scale_factor, 2));
		this.ctx.lineTo(snapPointXEnd, snapPointYEnd);
		this.ctx.stroke();

		this.ctx.strokeStyle = this.drawStyle.outlineColor
		this.ctx.fillStyle = this.drawStyle.backgroundColor
		this.ctx.lineWidth = Math.floor(Math.max(15 * Math.max((1 - window.ZOOM), 0)/window.CURRENT_SCENE_DATA.scale_factor, 3));
		roundRect(this.ctx, Math.floor(textRect.x), Math.floor(textRect.y), Math.floor(textRect.width), Math.floor(textRect.height), 10, true);
		// draw the outline of the text box
		roundRect(this.ctx, Math.floor(textRect.x), Math.floor(textRect.y), Math.floor(textRect.width), Math.floor(textRect.height), 10, false, true);

		// Finally draw our text
		this.ctx.fillStyle = this.drawStyle.textColor
		this.ctx.textBaseline = 'top';
		this.ctx.fillText(text, textX, textY);

		this.drawBobble(snapPointXStart, snapPointYStart);
		this.drawBobble(snapPointXEnd, snapPointYEnd);
	}

	/**
	 * redraws the waypoints using various levels of opacity until completely clear
	 * then removes all waypoints and resets canvas opacity
	 */
	fadeoutMeasuring(){
		let alpha = 1.0
		const self = this
		if(self.ctx == undefined){
				self.cancelFadeout()
				self.clearWaypoints();
				clear_temp_canvas()
				return;
		} 
		// only ever allow a single fadeout to occur
		// this stops weird flashing behaviour with interacting
		// interval function calls
		if (this.timerId){
			return
		}
		this.timerId = setInterval(function(){ fadeout() }, 100);

		function fadeout(){
			self.ctx.clearRect(0,0, self.canvas.width, self.canvas.height);
			self.ctx.globalAlpha = alpha;
			self.draw(false)
			alpha = alpha - 0.08;
			if (alpha <= 0.0){
				self.cancelFadeout()
				self.clearWaypoints();
				clear_temp_canvas()
			}
		}
	}

	/**
	 *
	 */
	cancelFadeout(){
		if (this.timerId !== undefined){
			clearInterval(this.timerId);
			this.ctx.globalAlpha = 1.0
			this.timerId = undefined

		}
	}
};


function is_token_under_fog(tokenid){
	if(window.DM)
		return false;
	let canvas = document.getElementById("fog_overlay");
	let ctx = canvas.getContext("2d", {willReadFrequently: true});
	let canvas2 = document.getElementById("raycastingCanvas");
	let ctx2 = canvas2.getContext("2d", {willReadFrequently: true});


	let left = (parseInt(window.TOKEN_OBJECTS[tokenid].options.left.replace('px', '')) + (window.TOKEN_OBJECTS[tokenid].options.size / 2)) / window.CURRENT_SCENE_DATA.scale_factor;
	let top = (parseInt(window.TOKEN_OBJECTS[tokenid].options.top.replace('px', '')) + (window.TOKEN_OBJECTS[tokenid].options.size / 2)) / window.CURRENT_SCENE_DATA.scale_factor;
	let pixeldata = ctx.getImageData(left, top, 1, 1).data;
	let pixeldata2 = ctx2.getImageData(parseInt(window.TOKEN_OBJECTS[tokenid].options.left.replace('px', ''))/ window.CURRENT_SCENE_DATA.scale_factor, parseInt(window.TOKEN_OBJECTS[tokenid].options.top.replace('px', ''))/ window.CURRENT_SCENE_DATA.scale_factor, window.TOKEN_OBJECTS[tokenid].sizeWidth()/ window.CURRENT_SCENE_DATA.scale_factor, window.TOKEN_OBJECTS[tokenid].sizeHeight()/ window.CURRENT_SCENE_DATA.scale_factor).data;
		
	let playerTokenId = $(`.token[data-id*='${window.PLAYER_ID}']`).attr("data-id");
	let playerTokenAuraIsLight = (playerTokenId == undefined) ? true : window.TOKEN_OBJECTS[playerTokenId].options.auraislight;
	let someFilter = function(color, index) {return (index) % 4 == 0 && color == 255};

	if (!window.TOKEN_OBJECTS[tokenid].options.revealInFog && (pixeldata[3] == 255 || (!pixeldata2.some(someFilter) && playerTokenAuraIsLight && (window.CURRENT_SCENE_DATA.darkness_filter > 0 || window.walls.length>4))))
		return true;
	else
		return false;
}

function is_token_under_light_aura(tokenid){
	let horizontalMiddle = (parseInt(window.TOKEN_OBJECTS[tokenid].options.left.replace('px', '')) + (window.TOKEN_OBJECTS[tokenid].options.size / 2))/window.CURRENT_SCENE_DATA.scale_factor;
	let verticalMiddle = (parseInt(window.TOKEN_OBJECTS[tokenid].options.top.replace('px', '')) + (window.TOKEN_OBJECTS[tokenid].options.size / 2))/window.CURRENT_SCENE_DATA.scale_factor;
	

	let visibleLightAuras = $(".aura-element-container-clip .aura-element:not([style*='visibility: hidden'])");

	for(let auraIndex = 0; auraIndex < visibleLightAuras.length; auraIndex++){
		let auraId = $(visibleLightAuras[auraIndex]).attr('data-id');
		if(window.lightAuraClipPolygon == undefined)
			continue;
		if(window.lightAuraClipPolygon[auraId] == undefined)
			continue;
		let bounds = {
			left: parseInt($(visibleLightAuras[auraIndex]).css('left').replace('px', '')), 
			top:  parseInt($(visibleLightAuras[auraIndex]).css('top').replace('px', '')),
			right:  parseInt($(visibleLightAuras[auraIndex]).css('left').replace('px', '')) + $(visibleLightAuras[auraIndex]).width(),
			bottom:  parseInt($(visibleLightAuras[auraIndex]).css('top').replace('px', '')) + $(visibleLightAuras[auraIndex]).width()
		};

		if(horizontalMiddle > bounds.left && horizontalMiddle < bounds.right && verticalMiddle > bounds.top && verticalMiddle < bounds.bottom){
				

			let pixeldata = window.lightAuraClipPolygon[auraId].canvas.getContext('2d').getImageData(parseInt(window.TOKEN_OBJECTS[tokenid].options.left.replace('px', ''))/ window.CURRENT_SCENE_DATA.scale_factor, parseInt(window.TOKEN_OBJECTS[tokenid].options.top.replace('px', ''))/ window.CURRENT_SCENE_DATA.scale_factor, window.TOKEN_OBJECTS[tokenid].sizeWidth()/ window.CURRENT_SCENE_DATA.scale_factor, window.TOKEN_OBJECTS[tokenid].sizeHeight()/ window.CURRENT_SCENE_DATA.scale_factor).data;
			
			if(pixeldata.some(function(color, index) {return (index) % 4 == 0 && color == 255}))
				return true;
		}		
	}
	return  false;
}
function is_token_under_light_overlay(tokenid){
	let horizontalMiddle = (parseInt(window.TOKEN_OBJECTS[tokenid].options.left.replace('px', '')) + (window.TOKEN_OBJECTS[tokenid].options.size / 2))/window.CURRENT_SCENE_DATA.scale_factor;
	let verticalMiddle = (parseInt(window.TOKEN_OBJECTS[tokenid].options.top.replace('px', '')) + (window.TOKEN_OBJECTS[tokenid].options.size / 2))/window.CURRENT_SCENE_DATA.scale_factor;
		

	let pixeldata = $('#light_overlay')[0].getContext('2d').getImageData(parseInt(window.TOKEN_OBJECTS[tokenid].options.left.replace('px', ''))/ window.CURRENT_SCENE_DATA.scale_factor, parseInt(window.TOKEN_OBJECTS[tokenid].options.top.replace('px', ''))/ window.CURRENT_SCENE_DATA.scale_factor, window.TOKEN_OBJECTS[tokenid].sizeWidth()/ window.CURRENT_SCENE_DATA.scale_factor, window.TOKEN_OBJECTS[tokenid].sizeHeight()/ window.CURRENT_SCENE_DATA.scale_factor).data;
	
	for(let i=0; i<pixeldata.length; i+=4){
		if(pixeldata[i]>0 || pixeldata[i+1]>0 || pixeldata[i+2]>0)
			return true;
	}
		
		
	return  false;
}

function check_single_token_visibility(id){
	console.log("check_single_token_visibility");
	if (window.DM || $("#fog_overlay").is(":hidden"))
		return;

	let auraSelectorId = $(".token[data-id='" + id + "']").attr("data-id").replaceAll("/", "");
	let auraSelector = ".aura-element[id='aura_" + auraSelectorId + "']";
	let selector = "div.token[data-id='" + id + "']";
	let playerTokenId = $(`.token[data-id*='${window.PLAYER_ID}']`).attr("data-id");
	let playerTokenHasVision = (playerTokenId == undefined) ? ((window.walls.length > 4 || window.CURRENT_SCENE_DATA.darkness_filter > 0) ? true : false) : window.TOKEN_OBJECTS[playerTokenId].options.auraislight;
	const hideThisTokenInFogOrDarkness = (!window.TOKEN_OBJECTS[id].options.revealInFog); //we want to hide this token in fog or darkness
	
	const inFog = is_token_under_fog(id); // this token is in fog
	
	const notInLight = (playerTokenHasVision && !is_token_under_light_aura(id) && !is_token_under_light_overlay(id) && window.CURRENT_SCENE_DATA.darkness_filter > 0); // this token is not in light, the player is using vision/light and darkness > 0
	
	if (hideThisTokenInFogOrDarkness && ( inFog || notInLight )) {
		$(selector + "," + auraSelector).hide();
	}
	else if (!window.TOKEN_OBJECTS[id].options.hidden) {
		$(selector).css('opacity', 1);
		$(selector).show();
		if(!window.TOKEN_OBJECTS[id].options.hideaura && id != playerTokenId)
			$(auraSelector).show();
		//console.log('SHOW '+id);
	}
}


// if it was not executed in the last 1 second, execute it immediately and asynchronously
// if it's already scheduled to be executed, return
// otherwise, schedule it to execute in 1 second
async function check_token_visibility(){
	if(window.DM)
		return;
	else if(window.NEXT_CHECK_TOKEN_VISIBILITY  && (window.NEXT_CHECK_TOKEN_VISIBILITY - Date.now() > 0)){
		return;
	}
	else if(!window.NEXT_CHECK_TOKEN_VISIBILITY  || (window.NEXT_CHECK_TOKEN_VISIBILITY - Date.now() < -1000)){
		window.NEXT_CHECK_TOKEN_VISIBILITY = Date.now();
		await do_check_token_visibility();
		return;
	}
	else {
		window.NEXT_CHECK_TOKEN_VISIBILITY = Date.now() + 1000;
		setTimeout(async () => do_check_token_visibility(), 1000);
		return;
	}
}

async function do_check_token_visibility() {
	console.log("do_check_token_visibility");
	let canvas = document.getElementById("fog_overlay");

	if (canvas.style.diplay == "none")
		return;
	let ctx = canvas.getContext("2d",  { willReadFrequently: true });
	let canvas2 = document.getElementById("raycastingCanvas");
	let ctx2 = canvas2.getContext("2d",  { willReadFrequently: true });

	let promises = [];
	for (let id in window.TOKEN_OBJECTS) {
		promises.push(new Promise(function() {
			let left = (parseInt(window.TOKEN_OBJECTS[id].options.left.replace('px', '')) + (window.TOKEN_OBJECTS[id].sizeWidth() / 2)) / window.CURRENT_SCENE_DATA.scale_factor;
			let top = (parseInt(window.TOKEN_OBJECTS[id].options.top.replace('px', '')) + (window.TOKEN_OBJECTS[id].sizeHeight() / 2)) / window.CURRENT_SCENE_DATA.scale_factor;
			let pixelData = ctx.getImageData(left, top, 1, 1).data;
			let auraSelectorId = $(".token[data-id='" + id + "']").attr("data-id").replaceAll("/", "");
			let auraSelector = ".aura-element[id='aura_" + auraSelectorId + "']";
			let tokenSelector = "div.token[data-id='" + id + "']";


			let playerTokenId = $(`.token[data-id*='${window.PLAYER_ID}']`).attr("data-id");
			let playerTokenHasVision = (playerTokenId == undefined) ? ((window.walls.length > 4 || window.CURRENT_SCENE_DATA.darkness_filter > 0) ? true : false) : window.TOKEN_OBJECTS[playerTokenId].options.auraislight;

			//Combining some and filter cut down about 140ms for average sized picture
			let someFilter = function(ctx) {
				let pixelData = ctx2.getImageData(parseInt(window.TOKEN_OBJECTS[id].options.left.replace('px', ''))/ window.CURRENT_SCENE_DATA.scale_factor, parseInt(window.TOKEN_OBJECTS[id].options.top.replace('px', ''))/ window.CURRENT_SCENE_DATA.scale_factor, window.TOKEN_OBJECTS[id].sizeWidth()/ window.CURRENT_SCENE_DATA.scale_factor, window.TOKEN_OBJECTS[id].sizeHeight()/ window.CURRENT_SCENE_DATA.scale_factor).data;
				//return (index) % 4 == 0 && color == 255
				for (let i = 0; i < pixelData.length; i += 4) {
					if (pixelData[i] === 255) {
						return true;
					}
				}

				return false;
			};
			const hideThisTokenInFogOrDarkness = (!window.TOKEN_OBJECTS[id].options.revealInFog); //we want to hide this token in fog or darkness
			
			const inFog = (pixelData[3] == 255); // this token is in fog
			
			const fullyOutOfLoS = (!someFilter(ctx2) && playerTokenHasVision); //somefilter checks for a white pixel - if one exists the token isn't out of line of sight. We also check the player token is using vision.
			
			const notInLight = (playerTokenHasVision && !is_token_under_light_aura(id) && !is_token_under_light_overlay(id) && window.CURRENT_SCENE_DATA.darkness_filter > 0); // this token is not in light, the player is using vision/light and darkness > 0
			
			if (hideThisTokenInFogOrDarkness && ( inFog || fullyOutOfLoS || notInLight )) {
				$(tokenSelector + "," + auraSelector).hide();
			}
			else if (!window.TOKEN_OBJECTS[id].options.hidden ) {
				$(tokenSelector).css({'opacity': 1, 'display': 'flex'});
				if(!window.TOKEN_OBJECTS[id].options.hideaura || id == playerTokenId)
					$(auraSelector).show();
			}
		}));
	}

	await Promise.all(promises);
	console.log("finished");
}

function circle2(a, b) {
	var R = a.r,
		r = b.r,
		dx = b.x - a.x,
		dy = b.y - a.y,
		d = Math.sqrt(dx * dx + dy * dy),
		x = (d * d - r * r + R * R) / (2 * d),
		y = Math.sqrt(R * R - x * x);
	dx /= d;
	dy /= d;
	return [
		[a.x + dx * x - dy * y, a.y + dy * x + dx * y],
		[a.x + dx * x + dy * y, a.y + dy * x - dx * y]
	];
}

function circle_intersection(x0, y0, r0, x1, y1, r1) {
	var a, dx, dy, d, h, rx, ry;
	var x2, y2;

	/* dx and dy are the vertical and horizontal distances between
	 * the circle centers.
	 */
	dx = x1 - x0;
	dy = y1 - y0;

	/* Determine the straight-line distance between the centers. */
	d = Math.sqrt((dy * dy) + (dx * dx));

	/* Check for solvability. */
	if (d > (r0 + r1)) {
		/* no solution. circles do not intersect. */
		return false;
	}
	if (d < Math.abs(r0 - r1)) {
		/* no solution. one circle is contained in the other */
		return false;
	}

	/* 'point 2' is the point where the line through the circle
	 * intersection points crosses the line between the circle
	 * centers.
	 */

	/* Determine the distance from point 0 to point 2. */
	a = ((r0 * r0) - (r1 * r1) + (d * d)) / (2.0 * d);

	/* Determine the coordinates of point 2. */
	x2 = x0 + (dx * a / d);
	y2 = y0 + (dy * a / d);

	/* Determine the distance from point 2 to either of the
	 * intersection points.
	 */
	h = Math.sqrt((r0 * r0) - (a * a));

	/* Now determine the offsets of the intersection points from
	 * point 2.
	 */
	rx = -dy * (h / d);
	ry = dx * (h / d);

	/* Determine the absolute intersection points. */
	var xi = x2 + rx;
	var xi_prime = x2 - rx;
	var yi = y2 + ry;
	var yi_prime = y2 - ry;

	return [xi, xi_prime, yi, yi_prime];
}

function midPointBtw(p1, p2) {
  return {
    x: p1.x + (p2.x - p1.x) / 2,
    y: p1.y + (p2.y - p1.y) / 2
  };
}

function clear_grid(){
	const gridCanvas = document.getElementById("grid_overlay");
	const gridContext = gridCanvas.getContext("2d");
	gridContext.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
}

function redraw_grid(hpps=null, vpps=null, offsetX=null, offsetY=null, color=null, lineWidth=null, subdivide=null, dash=[]){
	const gridCanvas = document.getElementById("grid_overlay");
	const gridContext = gridCanvas.getContext("2d");
	clear_grid();
	gridContext.setLineDash(dash);
	let startX = offsetX / window.CURRENT_SCENE_DATA.scale_factor || window.CURRENT_SCENE_DATA.offsetx / window.CURRENT_SCENE_DATA.scale_factor;
	let startY = offsetY / window.CURRENT_SCENE_DATA.scale_factor || window.CURRENT_SCENE_DATA.offsety / window.CURRENT_SCENE_DATA.scale_factor;
	startX = Math.round(startX)
	startY = Math.round(startY) 
	const incrementX = hpps / window.CURRENT_SCENE_DATA.scale_factor || window.CURRENT_SCENE_DATA.hpps / window.CURRENT_SCENE_DATA.scale_factor;
	const incrementY = vpps / window.CURRENT_SCENE_DATA.scale_factor || window.CURRENT_SCENE_DATA.vpps / window.CURRENT_SCENE_DATA.scale_factor;
	gridContext.lineWidth = lineWidth || window.CURRENT_SCENE_DATA.grid_line_width;
	gridContext.strokeStyle = color || window.CURRENT_SCENE_DATA.grid_color;
	let isSubdivided = subdivide === "1" || window.CURRENT_SCENE_DATA.grid_subdivided === "1"
	let skip = true;

	gridContext.beginPath();	
	for (var i = startX; i < $("#grid_overlay").width(); i = i + incrementX) {
		if (isSubdivided && skip) {
			skip = false;
			continue;
		}
		else {
			skip = true;
		}
		gridContext.moveTo(i, 0);
		gridContext.lineTo(i, $("#grid_overlay").height());
	}
	gridContext.stroke();
	skip = true;

	
	gridContext.beginPath();
	for (var i = startY; i < $("#grid_overlay").height(); i = i + incrementY) {
		if (isSubdivided && skip) {
			skip = false;
			continue;
		}
		else {
			skip = true;
		}

		gridContext.moveTo(0, i);
		gridContext.lineTo($("#grid_overlay").width(), i);

	}
	gridContext.stroke();
}

function draw_wizarding_box() {

	var gridCanvas = document.getElementById("grid_overlay");
	var gridContext = gridCanvas.getContext("2d");
	gridCanvas.width = $("#scene_map").width();
	gridCanvas.height = $("#scene_map").height();

	startX = Math.round(window.CURRENT_SCENE_DATA.offsetx);
	startY = Math.round(window.CURRENT_SCENE_DATA.offsety);

	let al1 = {
		x: (parseInt($("#aligner1").css("left")) + 29)/window.CURRENT_SCENE_DATA.scale_factor,
		y: (parseInt($("#aligner1").css("top")) + 29)/window.CURRENT_SCENE_DATA.scale_factor,
	};

	let al2 = {
		x: (parseInt($("#aligner2").css("left")) + 29)/window.CURRENT_SCENE_DATA.scale_factor,
		y: (parseInt($("#aligner2").css("top")) + 29)/window.CURRENT_SCENE_DATA.scale_factor,
	};
	gridContext.setLineDash([30, 5]);

	gridContext.lineWidth = 2;
	gridContext.strokeStyle = "green";
	gridContext.beginPath();
	gridContext.moveTo(al1.x, al1.y);
	gridContext.lineTo(al2.x, al1.y);
	gridContext.moveTo(al2.x, al1.y);
	gridContext.lineTo(al2.x, al2.y);
	gridContext.moveTo(al2.x, al2.y);
	gridContext.lineTo(al1.x, al2.y);
	gridContext.moveTo(al1.x, al2.y);
	gridContext.lineTo(al1.x, al1.y);
	gridContext.stroke();

}
function ctxScale(canvasid){
	let canvas = document.getElementById(canvasid);
	canvas.width = $("#scene_map").width();
  	canvas.height = $("#scene_map").height();
	$(canvas).css({
		'transform-origin': 'top left',
		'transform': 'scale(var(--scene-scale))'
	});
}

function reset_canvas() {
	let sceneMapWidth = $("#scene_map").width();
	let sceneMapHeight = $("#scene_map").height();

	$('#darkness_layer').css({"width": sceneMapWidth, "height": sceneMapHeight});
	$("#scene_map_container").css({"width": sceneMapWidth, "height": sceneMapHeight});

	ctxScale('peer_overlay');
	ctxScale('temp_overlay');
	ctxScale('fog_overlay');
	ctxScale('grid_overlay');	
	ctxScale('draw_overlay');

	let canvas = document.getElementById('raycastingCanvas');
	canvas.width = $("#scene_map").width();
  	canvas.height = $("#scene_map").height();

  	canvas = document.getElementById('light_overlay');
	canvas.width = $("#scene_map").width();
  	canvas.height = $("#scene_map").height();

	$("#text_div").css({"width": sceneMapWidth * window.CURRENT_SCENE_DATA.scale_factor,  "height": sceneMapHeight * window.CURRENT_SCENE_DATA.scale_factor});

	canvas = document.getElementById("fog_overlay");
	let ctx = canvas.getContext("2d");

	if (!window.FOG_OF_WAR) {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		return;
	}
	let darknessfilter = (window.CURRENT_SCENE_DATA.darkness_filter != undefined) ? window.CURRENT_SCENE_DATA.darkness_filter : 0;
 	let darknessPercent = 100 - parseInt(darknessfilter);
 	if(window.DM && darknessPercent < 40){
 		darknessPercent = 40;
 		$('#raycastingCanvas').css('opacity', '0');
 	}
 	else if(window.DM){
 		$('#raycastingCanvas').css('opacity', '');
 	}
 	if(!parseInt(darknessfilter) && window.walls.length>4){
 		$('#light_container').css({
 			'mix-blend-mode': 'unset',
 			'background':  '#FFF',
 			'opacity': '0.3'
 		});
 	} else{
 		$('#light_container').css({
 			'mix-blend-mode': '',
 			'background': '',
 			'opacity': ''
 		});
 	}
 	$('#VTT').css('--darkness-filter', darknessPercent + "%");

 	delete window.lightAuraClipPolygon;
 	delete window.lineOfSightPolygons;

	redraw_drawings();
	redraw_light_walls();
	redraw_light();
	redraw_fog();
	redraw_text();
	

	var canvas_grid = document.getElementById("grid_overlay");
	var ctx_grid = canvas_grid.getContext("2d");
	if (window.CURRENT_SCENE_DATA && (window.CURRENT_SCENE_DATA.grid == "1" || window.WIZARDING) && window.CURRENT_SCENE_DATA.hpps > 10 && window.CURRENT_SCENE_DATA.vpps > 10) {
		//alert(window.CURRENT_SCENE_DATA.hpps + " "+ window.CURRENT_SCENE_DATA.vpps);
		if(window.WIZARDING){
			$("#VTT").css("--scene-scale", 1)
		}
		else{
			$("#VTT").css("--scene-scale", window.CURRENT_SCENE_DATA.scale_factor);
		}
		canvas_grid.width = $("#scene_map").width();
		canvas_grid.height = $("#scene_map").height();

		startX = Math.round(window.CURRENT_SCENE_DATA.offsetx);
		startY = Math.round(window.CURRENT_SCENE_DATA.offsety);

		//alert(startX+ " "+startY);
		if (window.WIZARDING) {
			draw_wizarding_box();
		}
		//alert('inizio 1');

		if (window.CURRENT_SCENE_DATA.grid == "1" && !window.WIZARDING) {
			redraw_grid()
		}
		//alert('sopravvissuto');
	}
	else {
		ctx_grid.clearRect(0, 0, canvas_grid.width, canvas_grid.height);
	}

}

function redraw_fog() {
	if (!window.FOG_OF_WAR)
		return;
	var canvas = document.getElementById("fog_overlay");
	var ctx = canvas.getContext("2d");

	if (window.DM)
		fogStyle = "rgba(0, 0, 0, 0.5)";
	else
		fogStyle = "rgb(0, 0, 0)";


	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = fogStyle;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	for (var i = 0; i < window.REVEALED.length; i++) {
		var d = window.REVEALED[i];
		let adjustedArray = [];
		let revealedScale = (d[6] != undefined) ? d[6] : window.CURRENT_SCENE_DATA.scale_factor;
		if (d.length == 4) { // SIMPLE CASE OF RECT TO REVEAL
			ctx.clearRect(d[0]/window.CURRENT_SCENE_DATA.scale_factor, d[1]/window.CURRENT_SCENE_DATA.scale_factor, d[2]/window.CURRENT_SCENE_DATA.scale_factor, d[3]/window.CURRENT_SCENE_DATA.scale_factor);
			continue;
		}
		if (d[5] == 0) { //REVEAL

			if (d[4] == 0) { // REVEAL SQUARE
				for(let adjusted = 0; adjusted < 4; adjusted++){
					adjustedArray[adjusted] = d[adjusted] / (revealedScale/window.CURRENT_SCENE_DATA.scale_factor);
				}
				ctx.clearRect(adjustedArray[0]/window.CURRENT_SCENE_DATA.scale_factor, adjustedArray[1]/window.CURRENT_SCENE_DATA.scale_factor, adjustedArray[2]/window.CURRENT_SCENE_DATA.scale_factor, adjustedArray[3]/window.CURRENT_SCENE_DATA.scale_factor);
			}
			if (d[4] == 1) { // REVEAL CIRCLE
				for(let adjusted = 0; adjusted < 3; adjusted++){
					adjustedArray[adjusted] = d[adjusted] / (revealedScale/window.CURRENT_SCENE_DATA.scale_factor);
				}
				clearCircle(ctx, adjustedArray[0], adjustedArray[1], adjustedArray[2]);
			}
			if (d[4] == 2) {
				// reveal ALL!!!!!!!!!!
				ctx.clearRect(0, 0, $("#scene_map").width()*window.CURRENT_SCENE_DATA.scale_factor, $("#scene_map").height()*window.CURRENT_SCENE_DATA.scale_factor);
			}
			if (d[4] == 3) {
				// REVEAL POLYGON
				clearPolygon(ctx, d[0], d[6]);
			}
			if (d[4] == 4) {
				for(let adjusted = 0; adjusted < 2; adjusted++){
					adjustedArray[adjusted] = d[adjusted] / (revealedScale);
				}
				// REVEAL BUCKET				
				bucketFill(ctx, adjustedArray[0], adjustedArray[1]);
			}
			if (d[4] == 5) {
				//HIDE 3 POINT RECT
				clear3PointRect(ctx, d[0], d[6]);		
			}
		}
		if (d[5] == 1) { // HIDE
			if (d[4] == 0) { // HIDE SQUARE
				for(let adjusted = 0; adjusted < 4; adjusted++){
					adjustedArray[adjusted] = d[adjusted] / (revealedScale/window.CURRENT_SCENE_DATA.scale_factor);
				}
				ctx.clearRect(adjustedArray[0]/window.CURRENT_SCENE_DATA.scale_factor, adjustedArray[1]/window.CURRENT_SCENE_DATA.scale_factor, adjustedArray[2]/window.CURRENT_SCENE_DATA.scale_factor, adjustedArray[3]/window.CURRENT_SCENE_DATA.scale_factor);
				ctx.fillStyle = fogStyle;
				ctx.fillRect(adjustedArray[0]/window.CURRENT_SCENE_DATA.scale_factor, adjustedArray[1]/window.CURRENT_SCENE_DATA.scale_factor, adjustedArray[2]/window.CURRENT_SCENE_DATA.scale_factor, adjustedArray[3]/window.CURRENT_SCENE_DATA.scale_factor);
			}
			if (d[4] == 1) { // HIDE CIRCLE
				for(let adjusted = 0; adjusted < 3; adjusted++){
					adjustedArray[adjusted] = d[adjusted] / (revealedScale/window.CURRENT_SCENE_DATA.scale_factor);
				}
				clearCircle(ctx, adjustedArray[0], adjustedArray[1], adjustedArray[2]);
				drawCircle(ctx, adjustedArray[0], adjustedArray[1], adjustedArray[2], fogStyle);
			}
			if (d[4] == 3) {
				// HIDE POLYGON
				clearPolygon(ctx, d[0], d[6], true);
				drawPolygon(ctx, d[0], fogStyle, undefined, undefined, undefined, undefined, d[6], true);
			
			}
			if (d[4] == 4) {
				for(let adjusted = 0; adjusted < 2; adjusted++){
					adjustedArray[adjusted] = d[adjusted] / (revealedScale);
				}
				// HIDE BUCKET
				bucketFill(ctx, adjustedArray[0], adjustedArray[1], fogStyle, 1);			
			}
			if (d[4] == 5) {
				//HIDE 3 POINT RECT
				draw3PointRect(ctx, d[0], fogStyle, undefined, undefined, undefined, undefined, d[6], true);		
			}
		}
	}
}


/**
 * Redraws all text drawing types from window.DRAWINGS
 */
function redraw_text() {

	$('#text_div').empty();
	for(let drawing in window.DRAWINGS){
		const [shape, x, y, width, height, text, font, stroke, rectColor, textid, scale, hidden] = window.DRAWINGS[drawing]

		if(shape == 'text' && textid == undefined){
			let newTextId = uuid();
			setScale = (window.CURRENT_SCENE_DATA.scale_factor == "") ? 1 : window.CURRENT_SCENE_DATA.scale_factor;
			window.DRAWINGS[drawing].push(rectColor);
			window.DRAWINGS[drawing].push(newTextId);
			window.DRAWINGS[drawing].push(setScale);
		}
		if(shape == 'text' && hidden == undefined){
			window.DRAWINGS[drawing].push(false);
		}
   		if(shape == 'text'){
   			let text_clone = $.extend(true, [], window.DRAWINGS[drawing]);
			draw_text(undefined, ...text_clone);	
		}
	}
}

function redraw_drawings() {

	let canvas = document.getElementById("draw_overlay");
	let ctx = canvas.getContext("2d");

	let lightCanvas = document.getElementById("light_overlay");
	let lightCtx = lightCanvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	lightCtx.clearRect(0, 0, lightCanvas.width, lightCanvas.height);
	const drawings = window.DRAWINGS.filter(d => !d[0].includes("text") && d[1] !==  "wall")

	for (var i = 0; i < drawings.length; i++) {
		let drawing_clone = $.extend(true, [], drawings[i]);
		let [shape, fill, color, x, y, width, height, lineWidth, scale] = drawing_clone;
		let isFilled = fill === "filled" || fill === "light";
		let targetCtx = ctx;
		if(fill == "light"){
			targetCtx = lightCtx;
		}

		scale = (scale == undefined) ? window.CURRENT_SCENE_DATA.scale_factor : scale;
		let adjustedScale = scale/window.CURRENT_SCENE_DATA.scale_factor;

		if(shape == "eraser" || shape =="rect" || shape == "arc" || shape == "cone" || shape == "paint-bucket"){
			x = x / adjustedScale;
			y = y / adjustedScale;
			height = height / adjustedScale;
			width = width / adjustedScale;
		}


		if (shape == "eraser") {
			targetCtx.clearRect(x/window.CURRENT_SCENE_DATA.scale_factor, y/window.CURRENT_SCENE_DATA.scale_factor, width/window.CURRENT_SCENE_DATA.scale_factor, height/window.CURRENT_SCENE_DATA.scale_factor);
		}
		if (shape == "rect") {
			drawRect(targetCtx,x, y, width, height, color, isFilled, lineWidth);
		}
		if (shape == "arc") {
			const radius = width
			drawCircle(targetCtx,x, y, radius, color, isFilled, lineWidth);
		}
		if (shape == "cone") {
			drawCone(targetCtx, x, y, width, height, color, isFilled, lineWidth);
		}
		if (shape == "line") {
			drawLine(targetCtx,x, y, width, height, color, lineWidth, scale);		
		}
		if (shape == "polygon") {
			drawPolygon(targetCtx,x, color, isFilled, lineWidth, undefined, undefined, scale);
			// ctx.stroke();
		}
		if (shape == "brush") {
			drawBrushstroke(targetCtx, x, color, lineWidth, scale);
		}
		if(shape == "paint-bucket"){
			bucketFill(targetCtx, x/window.CURRENT_SCENE_DATA.scale_factor, y/window.CURRENT_SCENE_DATA.scale_factor, color, 1, true);
		}
		if(shape == "3pointRect"){
		 	draw3PointRect(targetCtx, x, color, isFilled, lineWidth, undefined, undefined, scale);	
		}
	}
}
function  redraw_light_walls(clear=true){

	let canvas = document.getElementById("temp_overlay");
	let ctx = canvas.getContext("2d", {willReadFrequently: true});
	ctx.setLineDash([]);
		
	if(clear)
		ctx.clearRect(0, 0, canvas.width, canvas.height);


	window.walls =[];
	let sceneMapContainer = $('#scene_map_container');
	let sceneMapHeight = sceneMapContainer.height();
	let sceneMapWidth = sceneMapContainer.width();

	let wall5 = new Boundary(new Vector(0, 0), new Vector(sceneMapWidth, 0));
	window.walls.push(wall5);
	let wall6 = new Boundary(new Vector(0, 0), new Vector(0, sceneMapHeight));
	window.walls.push(wall6);
	let wall7 = new Boundary(new Vector(sceneMapWidth, 0), new Vector(sceneMapWidth, sceneMapHeight));
	window.walls.push(wall7);
	let wall8 = new Boundary(new Vector(0, sceneMapHeight), new Vector(sceneMapWidth, sceneMapHeight));
	window.walls.push(wall8);

	const drawings = window.DRAWINGS.filter(d => d[1] == "wall");


	if(drawings.length > 0){
		$('#VTT').css('--walls-up-shadow-percent', '30%');
	}
	else{
		$('#VTT').css('--walls-up-shadow-percent', '0%');
	}
	$('.door-button').remove();
	for (var i = 0; i < drawings.length; i++) {
		let drawing_clone = $.extend(true, [], drawings[i]);
		let [shape, fill, color, x, y, width, height, lineWidth, scale] = drawing_clone;

		if(lineWidth == undefined || lineWidth == null){
			lineWidth = 6;
		}
		scale = (scale == undefined) ? window.CURRENT_SCENE_DATA.scale_factor : scale;
		let adjustedScale = scale/window.CURRENT_SCENE_DATA.scale_factor;

		if (shape == "line" && ($('#wall_button').hasClass('button-enabled') || $('[data-shape="paint-bucket"]').hasClass('button-enabled'))) {
			drawLine(ctx, x, y, width, height, color, lineWidth, scale);		
		}

		if(window.DM && (color == "rgba(255, 100, 255, 0.5)" || color == "rgba(255, 100, 255, 1)")){
			let doorButtonColor;
			if(color == "rgba(255, 100, 255, 0.5)")
				doorButtonColor = '#9eff61ad'
			if(color == "rgba(255, 100, 255, 1)")
				doorButtonColor = '#ff6168ad'
			

			let midX = Math.floor((x+width)/2) / scale * window.CURRENT_SCENE_DATA.scale_factor;
			let midY = Math.floor((y+height)/2) / scale * window.CURRENT_SCENE_DATA.scale_factor;
			let openCloseDoorButton = $(`<div class='door-button' data-x1='${x}' data-y1='${y}' data-x2='${width}' data-y2='${height}' style='--mid-x: ${midX}px; --mid-y: ${midY}px; background:${doorButtonColor};'>
											<span class="material-symbols-outlined">
												door_open
											</span>
										</div>`)
			openCloseDoorButton.on('click', function(){open_close_door(x, y, width, height)});
			$('#tokens').append(openCloseDoorButton);
		}
		if(color == "rgba(255, 100, 255, 0.5)"){
			continue;
		}
		let drawnWall = new Boundary(new Vector(x/adjustedScale/window.CURRENT_SCENE_DATA.scale_factor, y/adjustedScale/window.CURRENT_SCENE_DATA.scale_factor), new Vector(width/adjustedScale/window.CURRENT_SCENE_DATA.scale_factor, height/adjustedScale/window.CURRENT_SCENE_DATA.scale_factor))
		window.walls.push(drawnWall);
	}
	let darknessfilter = (window.CURRENT_SCENE_DATA.darkness_filter != undefined) ? window.CURRENT_SCENE_DATA.darkness_filter : 0;
 	if(!parseInt(darknessfilter) && window.walls.length>4){
 		$('#light_container').css({
 			'mix-blend-mode': 'unset',
 			'background': '#FFF',
 			'opacity': '0.3'
 		});
 	} else{
 		$('#light_container').css({
 			'mix-blend-mode': '',
 			'background': '',
 			'opacity': ''
 		});
 	}
}
function open_close_door(x1, y1, x2, y2){
	let doors = window.DRAWINGS.filter(d => (d[1] == "wall" && (d[2] == "rgba(255, 100, 255, 1)" || d[2] == "rgba(255, 100, 255, 0.5)")  && d[3] == x1 && d[4] == y1 && d[5] == x2 && d[6] == y2)) 
	let color;
	if(doors[0][2] == "rgba(255, 100, 255, 0.5)"){
		color = "rgba(255, 100, 255, 1)"
	}
	else{
		color = "rgba(255, 100, 255, 0.5)";
	}

	 window.DRAWINGS = window.DRAWINGS.filter(d => d != doors[0]);
		
	let data = ['line',
				 'wall',
				 color,
				 x1,
				 y1,
				 x2,
				 y2,
				 12,
				 doors[0][8]
				 ];	
	window.DRAWINGS.push(data);

	redraw_light_walls();
	redraw_light();


	sync_drawings();						
}

function stop_drawing() {
	$("#reveal").css("background-color", "");
	window.MOUSEDOWN = false;
	var target = $("#temp_overlay, #fog_overlay, #VTT, #black_layer");
	target.css('cursor', '');
	target.off('mousedown', drawing_mousedown);
	target.off('mouseup', drawing_mouseup);
	target.off('mousemove', drawing_mousemove);
	target.off('contextmenu', drawing_contextmenu);
	window.StoredWalls = [];
	window.wallToStore = [];
}

/**
 * Checks if an RGBA value is fully transparent
 * @param {String} rgba String that represents a RGBA value
 * @returns {Boolean}
 */
function is_rgba_fully_transparent(rgba){
	return rgba.split(",")?.[3]?.trim().replace(")","") === "0"
}

function get_event_cursor_position(event){
	const pointX = Math.round(((event.pageX - window.VTTMargin) * (1.0 / window.ZOOM)));
	const pointY = Math.round(((event.pageY - window.VTTMargin) * (1.0 / window.ZOOM)));
	return [pointX, pointY]
}

/**
 * Pulls information from menu's or buttons without menu's to set values used by
 * drawing mousemove, mousedown, mousecontext events
 * @param {Event} e
 * @returns
 */
function drawing_mousedown(e) {
	// perform some cleanup of the canvas/objects
	if(e.button !== 2 && !window.MOUSEDOWN){
		clear_temp_canvas()
		WaypointManager.resetDefaultDrawStyle()
		WaypointManager.cancelFadeout()
		WaypointManager.clearWaypoints()
	}

	// always draw unbaked drawings to the temp overlay
	let canvas = document.getElementById("temp_overlay");
	let context = canvas.getContext("2d");
	// select modifies this line but never resets it, so reset it here
	// otherwise all drawings are dashed
	context.setLineDash([])
	// get teh data from the menu's/buttons
	const data = get_draw_data(e.data.clicked,  e.data.menu)

	// these are generic values used by most drawing functionality
	window.LINEWIDTH = data.draw_line_width
	window.DRAWTYPE = (data.from == 'vision_menu') ? 'light' : data.fill
	window.DRAWCOLOR = data.background_color
	window.DRAWSHAPE = data.shape;
	window.DRAWFUNCTION = data.function;

	// some functions don't have selectable features
	// such as colour / filltype so set them here
	if(window.DRAWFUNCTION === "reveal"){
		// semi transparent red
		window.DRAWCOLOR = "rgba(255, 0, 0, 0.5)"
		window.DRAWTYPE = "filled"
	}
	if(window.DRAWFUNCTION === "eraser"){
		if(window.DRAWTYPE == "border")
			window.DRAWTYPE = "filled"
	}
	else if (window.DRAWFUNCTION === "hide" || window.DRAWFUNCTION === "draw_text"){
		// semi transparent black
		window.DRAWCOLOR = "rgba(0, 0, 0, 0.5)"
		window.DRAWTYPE = "filled"
	}
	else if(window.DRAWFUNCTION === "wall"){
		// semi transparent black
		window.DRAWCOLOR = "rgba(0, 255, 0, 1)"
		if(window.DRAWSHAPE == 'line')
			window.DRAWTYPE = "filled"
		window.LINEWIDTH = 6;
	}
	else if(window.DRAWFUNCTION === "wall-door-convert" || window.DRAWFUNCTION === "wall-door" ){
		// semi transparent black
		window.DRAWCOLOR = "rgba(255, 100, 255, 1)"
		window.DRAWTYPE = "filled"
		window.LINEWIDTH = 12;
	}
	else if (window.DRAWFUNCTION === "select"){
		window.DRAWCOLOR = "rgba(255, 255, 255, 1)"
		context.setLineDash([10, 5])
		if (e.which == 1) {
			$("#temp_overlay").css('cursor', 'crosshair');
			$("#temp_overlay").css('z-index', '50');
		}		
	}
	// figure out what these 3 returns are supposed to be for.
	if ($(".context-menu-list.context-menu-root ~ .context-menu-list.context-menu-root:visible, .body-rpgcharacter-sheet .context-menu-list.context-menu-root").length>0){
		return;
	}

	if (window.DRAGGING && window.DRAWSHAPE != 'align')
		return;
	if (e.button != 0 && window.DRAWFUNCTION != "measure" && window.DRAWFUNCTION != "wall" && window.DRAWFUNCTION != "wall-door")
		return;

	if (e.button == 0 && !shiftHeld && window.StoredWalls.length > 0 && (window.DRAWFUNCTION == "wall" || window.DRAWFUNCTION == "wall-door"))
		return;

	if((window.DRAWFUNCTION == "wall" || window.DRAWFUNCTION == "wall-door") && window.MOUSEDOWN && window.wallToStore != undefined){
		if(window.StoredWalls == undefined){
			window.StoredWalls =[];
		}
		window.StoredWalls.push(window.wallToStore);
	}
	if ((e.button != 0 || (shiftHeld && window.StoredWalls.length > 0)) && (window.DRAWFUNCTION == "wall" || window.DRAWFUNCTION == "wall-door") && !window.MOUSEDOWN)
		return;

	if (shiftHeld == false || window.DRAWFUNCTION != 'select') {
		deselect_all_tokens();
	}
	// end of wtf is this return block doing?
	const [pointX, pointY] = get_event_cursor_position(e)

	if(window.DRAWSHAPE === "brush"){
		window.BEGIN_MOUSEX = pointX
		window.BEGIN_MOUSEY = pointY
		window.MOUSEDOWN = true;
		window.BRUSHWAIT = false;
		window.BRUSHPOINTS = [];
		window.BRUSHPOINTS.push({x:window.BEGIN_MOUSEX, y:window.BEGIN_MOUSEY});
		// draw a dot
		window.BRUSHPOINTS.push({x:window.BEGIN_MOUSEX+1, y:window.BEGIN_MOUSEY+1});
		window.BRUSHPOINTS.push({x:window.BEGIN_MOUSEX-1, y:window.BEGIN_MOUSEY-1});
		drawBrushstroke(context, window.BRUSHPOINTS,window.DRAWCOLOR,window.LINEWIDTH);
	}
	else if (window.DRAWSHAPE === "polygon") {
		if (window.BEGIN_MOUSEX && window.BEGIN_MOUSEX.length > 0) {
			if (
				isPointWithinDistance(
					{ x: window.BEGIN_MOUSEX[0]/window.CURRENT_SCENE_DATA.scale_factor, y: window.BEGIN_MOUSEY[0]/window.CURRENT_SCENE_DATA.scale_factor },
					{ x: pointX/window.CURRENT_SCENE_DATA.scale_factor , y: pointY/window.CURRENT_SCENE_DATA.scale_factor}
				)
			) {
				savePolygon(e);
				return;
			} else {
				window.BEGIN_MOUSEX.push(pointX);
				window.BEGIN_MOUSEY.push(pointY);
			}
		} else {
			window.BEGIN_MOUSEX = [pointX];
			window.BEGIN_MOUSEY = [pointY];
		}
		clear_temp_canvas()
		drawPolygon(context,
			joinPointsArray(
				window.BEGIN_MOUSEX,
				window.BEGIN_MOUSEY
			),
			window.DRAWCOLOR,
			window.DRAWTYPE === "filled",
			false,
			window.DRAWTYPE === "filled" ? 1 : window.LINEWIDTH,
		);
		drawClosingArea(context, window.BEGIN_MOUSEX[0], window.BEGIN_MOUSEY[0]);
	}
	else if (window.DRAWSHAPE === "3pointRect"){
		if (window.BEGIN_MOUSEX && window.BEGIN_MOUSEX.length > 0) {
			if (window.BEGIN_MOUSEX.length == 2) {
				window.BEGIN_MOUSEX.push(pointX);
				window.BEGIN_MOUSEY.push(pointY);
				save3PointRect(e);
				if(window.DRAWFUNCTION == 'wall')
					redraw_light_walls(false);
				return;
			} else {
				window.BEGIN_MOUSEX.push(pointX);
				window.BEGIN_MOUSEY.push(pointY);
			}
		} else {
			window.BEGIN_MOUSEX = [pointX];
			window.BEGIN_MOUSEY = [pointY];
		}
		clear_temp_canvas()
		draw3PointRect(context,
			joinPointsArray(
				window.BEGIN_MOUSEX,
				window.BEGIN_MOUSEY
			),
			window.DRAWCOLOR,
			window.DRAWTYPE === "filled",
			false,
			window.DRAWTYPE === "filled" ? 1 : window.LINEWIDTH,
		);
	}
	else if (window.DRAWFUNCTION === "draw_text"){
		window.BEGIN_MOUSEX = e.clientX;
		window.BEGIN_MOUSEY = e.clientY;
		window.MOUSEDOWN = true;
		window.MOUSEMOVEWAIT = false;
	}
	else if((window.DRAWFUNCTION == "wall" || window.DRAWFUNCTION == "wall-door") && window.wallToStore != undefined){
		if(window.wallToStore.length>0) {
			window.BEGIN_MOUSEX = window.wallToStore[2];
			window.BEGIN_MOUSEY = window.wallToStore[3];
			window.MOUSEDOWN = true;
			window.MOUSEMOVEWAIT = false;
		}
		else{
			window.BEGIN_MOUSEX = pointX
			window.BEGIN_MOUSEY = pointY
			window.MOUSEDOWN = true;
			window.MOUSEMOVEWAIT = false;
		}
	}
	else{
		window.BEGIN_MOUSEX = pointX
		window.BEGIN_MOUSEY = pointY
		window.MOUSEDOWN = true;
		window.MOUSEMOVEWAIT = false;
	}


}


/**
 * Draws the respective shape from window.DRAWSHAPE onto the screen
 *
 * @param {Event} e
 * @returns
 */
function drawing_mousemove(e) {

	if (window.MOUSEMOVEWAIT) {
		return;
	}
	// don't perform any drawing when dragging a token
	if ($(".ui-draggable-dragging").length > 0){
		return
	}
	const [mouseX, mouseY] = get_event_cursor_position(e)

	const canvas = document.getElementById("temp_overlay");
	const context = canvas.getContext("2d");

	const isFilled = window.DRAWTYPE === "filled" || window.DRAWTYPE === "light";
	const mouseMoveFps = Math.round((1000.0 / 24.0));


	window.MOUSEMOVEWAIT = true;
	setTimeout(function() {
		window.MOUSEMOVEWAIT = false;
	}, mouseMoveFps);

	if (window.MOUSEDOWN) {
		clear_temp_canvas()
		const width = mouseX - window.BEGIN_MOUSEX;
		const height = mouseY - window.BEGIN_MOUSEY;
		// bain todo why is this here?
		// if(window.DRAWSHAPE !== "brush")
		// {
		// 	redraw_fog();
		// }

		if (window.DRAWSHAPE == "rect") {
			if(window.DRAWFUNCTION == "wall-eraser" || window.DRAWFUNCTION == "wall-door-convert" ||  window.DRAWFUNCTION == "wall" || window.DRAWFUNCTION == "wall-eraser-one"  ){
				redraw_light_walls(false);
			}
			if(window.DRAWFUNCTION == "draw_text")
			{
				drawRect(context,
					Math.round(((window.BEGIN_MOUSEX - window.VTTMargin + window.scrollX))) * (1.0 / window.ZOOM),
					Math.round(((window.BEGIN_MOUSEY - window.VTTMargin + window.scrollY))) * (1.0 / window.ZOOM),
					((e.clientX - window.VTTMargin + window.scrollX) * (1.0 / window.ZOOM)) - ((window.BEGIN_MOUSEX - window.VTTMargin + window.scrollX) * (1.0 / window.ZOOM)),
					((e.clientY - window.VTTMargin + window.scrollY) * (1.0 / window.ZOOM)) - ((window.BEGIN_MOUSEY - window.VTTMargin + window.scrollY) * (1.0 / window.ZOOM)),
					window.DRAWCOLOR,
					isFilled,
					window.LINEWIDTH);
			}
			else{
				drawRect(context,
						window.BEGIN_MOUSEX,
						window.BEGIN_MOUSEY,
						width,
						height,
						window.DRAWCOLOR,
						isFilled,
						window.LINEWIDTH);
			}
		}
		if (window.DRAWSHAPE === "text_erase") {
			// draw a rect that will be removed and replaced with an input box
			// when mouseup
			drawRect(context,
					 window.BEGIN_MOUSEX,
					 window.BEGIN_MOUSEY,
					 width,
					 height,
					 window.DRAWCOLOR,
					 isFilled,
					 window.LINEWIDTH);
		}
		else if (window.DRAWSHAPE == "arc") {
			centerX = window.BEGIN_MOUSEX;
			centerY = window.BEGIN_MOUSEY;
			radius = Math.round(Math.sqrt(Math.pow(centerX - mouseX, 2) + Math.pow(centerY - mouseY, 2)));
			drawCircle(context,
				       centerX,
					   centerY,
					   radius,
					   window.DRAWCOLOR,
					   isFilled,
					   window.LINEWIDTH);
		}
		else if (window.DRAWSHAPE == "cone") {
			drawCone(context,
				     window.BEGIN_MOUSEX,
					 window.BEGIN_MOUSEY,
					 mouseX,
					 mouseY,
					 window.DRAWCOLOR,
					 isFilled,
					 window.LINEWIDTH);
		}
		else if (window.DRAWSHAPE == "line") {
			if(window.DRAWFUNCTION === "measure"){
				if(e.which === 1){
					WaypointManager.setCanvas(canvas);
					WaypointManager.cancelFadeout()
					WaypointManager.registerMouseMove(mouseX, mouseY);
					WaypointManager.storeWaypoint(WaypointManager.currentWaypointIndex, window.BEGIN_MOUSEX/window.CURRENT_SCENE_DATA.scale_factor, window.BEGIN_MOUSEY/window.CURRENT_SCENE_DATA.scale_factor, mouseX/window.CURRENT_SCENE_DATA.scale_factor, mouseY/window.CURRENT_SCENE_DATA.scale_factor);
					WaypointManager.draw(false);
					context.fillStyle = '#f50';
					sendRulerPositionToPeers();
				}
			}else{
				drawLine(context,
					window.BEGIN_MOUSEX,
					window.BEGIN_MOUSEY,
					mouseX,
					mouseY,
					window.DRAWCOLOR,
					window.LINEWIDTH);
			}
			if(window.DRAWFUNCTION == 'wall' || window.DRAWFUNCTION == 'wall-door'){
				window.wallToStore = [window.BEGIN_MOUSEX,window.BEGIN_MOUSEY, mouseX, mouseY];
				redraw_light_walls(false);
				if(window.StoredWalls != undefined){
					for(let wall in window.StoredWalls){
						drawLine(context,
							window.StoredWalls[wall][0],
							window.StoredWalls[wall][1],
							window.StoredWalls[wall][2],
							window.StoredWalls[wall][3],
							window.DRAWCOLOR,
							window.LINEWIDTH);
					}
				}
				
			}

		}
		else if (window.DRAWSHAPE == "brush"){
			// Only add a new point every 75ms to keep the drawing size low
			// Subtract mouseMoveFps from 75ms to avoid waiting too much
			if(!window.BRUSHWAIT)
			{
				window.BRUSHPOINTS.push({x:mouseX, y:mouseY});

				drawBrushstroke(context, window.BRUSHPOINTS, window.DRAWCOLOR, window.LINEWIDTH);

				window.BRUSHWAIT = true;
				if (mouseMoveFps < 75) {
					setTimeout(function() {
						window.BRUSHWAIT = false;
					}, (75 - mouseMoveFps));
				}
			}
		}
	}
	else if (window.DRAWSHAPE === "polygon" &&
		window.BEGIN_MOUSEX && window.BEGIN_MOUSEX.length > 0) {
		clear_temp_canvas()
		WaypointManager.setCanvas(canvas);
		WaypointManager.cancelFadeout()
		drawPolygon( context,
			joinPointsArray(
				window.BEGIN_MOUSEX,
				window.BEGIN_MOUSEY
			),
			window.DRAWCOLOR,
			isFilled,
			isFilled ? 1 : window.LINEWIDTH,
			mouseX,
			mouseY
		);
		drawClosingArea(context,window.BEGIN_MOUSEX[0], window.BEGIN_MOUSEY[0], !isNaN(window.DRAWFUNCTION));
	}
	else if (window.DRAWSHAPE === "3pointRect" &&
		window.BEGIN_MOUSEX && window.BEGIN_MOUSEX.length > 0) {
		clear_temp_canvas()
		if(window.DRAWFUNCTION =='wall')
			redraw_light_walls(false);
		WaypointManager.setCanvas(canvas);
		WaypointManager.cancelFadeout()
		draw3PointRect( context,
			joinPointsArray(
				window.BEGIN_MOUSEX,
				window.BEGIN_MOUSEY
			),
			window.DRAWCOLOR,
			isFilled,
			isFilled ? 1 : window.LINEWIDTH,
			mouseX,
			mouseY
		);
	}
	
}

/**
 * Drawing finished (most of the time) set the final shape into window.DRAWING/windo.REVEAL
 * then call redraw functions and sync functions
 * @param {Event} e
 * @returns
 */
function drawing_mouseup(e) {
	if(!window.MOUSEDOWN)
		return;
	// ignore this if we're dragging a token
	if ($(".ui-draggable-dragging").length > 0){
		return
	}
	if (window.DRAWSHAPE == "3pointRect" || ((shiftHeld || e.button != 0) && (window.DRAWFUNCTION == "wall" || window.DRAWFUNCTION == "wall-door"))){
		return;
	}
	const [mouseX, mouseY] = get_event_cursor_position(e)
	// Return early from this function if we are measuring and have hit the right mouse button
	if (window.DRAWFUNCTION == "measure" && e.button == 2) {
		if(window.MOUSEDOWN && WaypointManager.isMeasuring()) {
			WaypointManager.checkNewWaypoint(mouseX, mouseY);
		}
		//console.log("Measure right click");
		return;
	}

	// ignore if right mouse buttons for the following
	if((window.DRAWFUNCTION == "draw" ||
		window.DRAWFUNCTION == "reveal" ||
		window.DRAWFUNCTION == "hide" ||
		window.DRAWFUNCTION == "draw_text" ||
		window.DRAWFUNCTION === "select") && e.which !== 1)
	{
		return;
	}

	// ignore middle-mouse clicks
	if(e.which == 2)
	{
		return;
	}
	// restore to what it looked like when first clicked
	// but not polygons as they have a close box to clear and then save
	// measure gets special treatment later on in this function
	if (window.DRAWSHAPE !== "polygon" && window.DRAWFUNCTION !== "measure" && window.DRAWFUNCTION != "wall"){
		clear_temp_canvas()
	}

	if (window.DRAWFUNCTION === 'select') {
		$("#temp_overlay").css('cursor', '');
	}
	if(e.button !== 2 && window.DRAWFUNCTION != 'wall')
		window.MOUSEDOWN = false;
	const width = mouseX - window.BEGIN_MOUSEX;
	const height = mouseY - window.BEGIN_MOUSEY;
	// data is modified by each shape/function but as a starting point fill it up
	let data = ['',
		 window.DRAWTYPE,
		 window.DRAWCOLOR,
		 window.BEGIN_MOUSEX,
		 window.BEGIN_MOUSEY,
		 width,
		 height,
		 window.LINEWIDTH,
		 window.CURRENT_SCENE_DATA.scale_factor];

	if ((window.DRAWFUNCTION !== "select" || window.DRAWFUNCTION !== "measure") &&
		(window.DRAWFUNCTION === "draw" || window.DRAWFUNCTION === 'wall' || window.DRAWFUNCTION == 'wall-door' )){
		switch (window.DRAWSHAPE) {
			case "line":
				data[0] = "line"
				data[5] = mouseX
				data[6] = mouseY
				break
			case "rect":
				data[0] = "rect"
				break;
			case "arc":
				const centerX = window.BEGIN_MOUSEX;
				const centerY = window.BEGIN_MOUSEY;
				const radius = Math.round(Math.sqrt(Math.pow(centerX - mouseX, 2) + Math.pow(centerY - mouseY, 2)));
				data[0] = "arc"
				data[3] = centerX
				data[4] = centerY
				data[5] = radius
				data[6] = null
				break;
			case "cone":
				data[0] = "cone"
				data[5] = mouseX
				data[6] = mouseY
				break;
			case "brush":
				window.BRUSHPOINTS.push({x:mouseX, y:mouseY});
				// cap with a dot
				window.BRUSHPOINTS.push({x:mouseX+1, y:mouseY+1});
				window.BRUSHPOINTS.push({x:mouseX-1, y:mouseY-1});
				data[0] = "brush"
				data[3] = window.BRUSHPOINTS
				data[4] = null
				data[5] = null
				data[6] = null
				break;
			case "paint-bucket":
				data[0] = "paint-bucket"
			default:
				break;
		}
		switch(window.DRAWFUNCTION){
		case 'wall':
			data[1] = "wall"
			break;
		case 'wall-door':
			data[1] = "wall"
			data[2] = "rgba(255, 100, 255, 1)"
			break;
		default:
			break;
		}
		if(window.DRAWFUNCTION == 'wall' && window.DRAWSHAPE == 'rect'){
			let rectLine = {
				rx: window.BEGIN_MOUSEX,
				ry: window.BEGIN_MOUSEY,		
				rw: width,
				rh: height
			};
			let line1 = ['line',
				"wall",
				window.DRAWCOLOR,
				rectLine.rx,
				rectLine.ry,
				rectLine.rx,
				rectLine.ry + rectLine.rh,
				window.LINEWIDTH,
				window.CURRENT_SCENE_DATA.scale_factor];
			window.DRAWINGS.push(line1);

			let line2 = ['line',
				"wall",
				window.DRAWCOLOR,
				rectLine.rx,
				rectLine.ry,
				rectLine.rx + rectLine.rw,
				rectLine.ry,
				window.LINEWIDTH,
				window.CURRENT_SCENE_DATA.scale_factor];
			window.DRAWINGS.push(line2);
			let line3 = ['line',
				"wall",
				window.DRAWCOLOR,
				rectLine.rx + rectLine.rw,
				rectLine.ry,
				rectLine.rx + rectLine.rw,
				rectLine.ry + rectLine.rh,
				window.LINEWIDTH,
				window.CURRENT_SCENE_DATA.scale_factor];
			window.DRAWINGS.push(line3);
			let line4 = ['line',
				"wall",
				 window.DRAWCOLOR,
				 rectLine.rx,
				 rectLine.ry + rectLine.rh,
				 rectLine.rx + rectLine.rw,
				 rectLine.ry + rectLine.rh,
				 window.LINEWIDTH,
				 window.CURRENT_SCENE_DATA.scale_factor];
			window.DRAWINGS.push(line4);
		}
		else{
			window.DRAWINGS.push(data);
		}

		if(window.DRAWFUNCTION == "wall" || window.DRAWFUNCTION == 'wall-door'){
			if ( e.button == 2) {
				return;
			}
			for(let walls in window.StoredWalls){
					data = ['line',
						"wall",
						window.DRAWCOLOR,
						window.StoredWalls[walls][0],
						window.StoredWalls[walls][1],
						window.StoredWalls[walls][2],
						window.StoredWalls[walls][3],
						window.LINEWIDTH,
						window.CURRENT_SCENE_DATA.scale_factor];
					window.DRAWINGS.push(data);
			}
			window.StoredWalls = [];
			window.wallToStore = [];
			window.MOUSEDOWN = false;
			redraw_light_walls();
			redraw_light();
		}

		
		redraw_drawings();
		sync_drawings();
	}
	else if (window.DRAWFUNCTION === "eraser"){
		if (window.DRAWSHAPE === "rect"){
			data[0] = "eraser"
			window.DRAWINGS.push(data);
			redraw_drawings();
		}
		else if (window.DRAWSHAPE === "text_erase"){
			// text eraser lives on a different overlay and thus can't just be eraser
			var c = 0;
			let svgTextArray = $('#text_div svg');
			for (svgText in svgTextArray) {
				var curr = svgTextArray[svgText].id;

				if($("#text_div svg[id='" + curr+ "'] text")[0] == undefined)
					continue;
				let textImageRect = $("#text_div svg[id='" + curr+ "'] text")[0].getBoundingClientRect();	

				
				var texttop = (parseInt(textImageRect.top) + window.scrollY - window.VTTMargin) * (1.0 / window.ZOOM);
				var textleft = (parseInt(textImageRect.left)  + window.scrollX - window.VTTMargin) * (1.0 / window.ZOOM);
				var textright = (parseInt(textImageRect.right) + window.scrollX - window.VTTMargin) * (1.0 / window.ZOOM);
				var textbottom = (parseInt(textImageRect.bottom) + window.scrollY - window.VTTMargin) * (1.0 / window.ZOOM);
				let scaledRemainderTop = (textbottom-texttop-textImageRect.height)/2;
				let scaledRemainderLeft = (textright-textleft-textImageRect.width)/2;

				if (Math.min(window.BEGIN_MOUSEY, mouseY, textbottom-scaledRemainderTop) == textbottom-scaledRemainderTop || Math.max(window.BEGIN_MOUSEY, mouseY, texttop+scaledRemainderTop) == texttop+scaledRemainderTop)
					continue;
				if (Math.min(window.BEGIN_MOUSEX, mouseX, textright-scaledRemainderLeft) == textright-scaledRemainderLeft || Math.max(window.BEGIN_MOUSEX, mouseX, textleft+scaledRemainderLeft) == textleft+scaledRemainderLeft)
					continue;

				c++;
				// TOKEN IS INSIDE THE SELECTION
				$("#text_div svg[id='" + curr + "']").remove();
				window.DRAWINGS = window.DRAWINGS.filter(d => d[9] != curr);

			}
		}

		sync_drawings();

	}		
	else if (window.DRAWFUNCTION === "wall-eraser" || window.DRAWFUNCTION === "wall-door-convert" || window.DRAWFUNCTION == "wall-eraser-one"){
		let walls = window.DRAWINGS.filter(d => (d[1] == "wall" && d[0].includes("line")));
		let rectLine = {
			rx: window.BEGIN_MOUSEX,
			ry: window.BEGIN_MOUSEY,		
			rw: width,
			rh: height
		};
		
	
		for(let i=0; i<walls.length; i++){

			let wallInitialScale = walls[8];
			let scale_factor = window.CURRENT_SCENE_DATA.scale_factor != undefined ? window.CURRENT_SCENE_DATA.scale_factor : 1;
			let adjustedScale = walls[i][8]/window.CURRENT_SCENE_DATA.scale_factor;

			

			if(walls[i][3] < walls[i][5] && walls[i][4] < walls[i][6] ){
				wallLine = [{
					a: {
						x: walls[i][3]/adjustedScale,
						y: walls[i][4]/adjustedScale
					},
					b: {
						x: walls[i][5]/adjustedScale,
						y: walls[i][6]/adjustedScale
					}			
				}]
			}
			else{
				wallLine = [{
					a: {
						x: walls[i][5]/adjustedScale,
						y: walls[i][6]/adjustedScale	
					},
					b: {x: walls[i][3]/adjustedScale,
						y: walls[i][4]/adjustedScale					
					}			
				}]
			}
			let eraserToRight  = rectLine.rw > 0;
			let eraserToBottom = rectLine.rh > 0;
			let left;
			let right;
			let top;
			let bottom;

			if(!eraserToRight){
				rectLine.rx = rectLine.rx + rectLine.rw;
				rectLine.rw = Math.abs(rectLine.rw);
			}
			if(!eraserToBottom){
				rectLine.ry = rectLine.ry + rectLine.rh;
				rectLine.rh = Math.abs(rectLine.rh);
			}

			left = lineLine(wallLine[0].a.x,wallLine[0].a.y,wallLine[0].b.x,wallLine[0].b.y, rectLine.rx,rectLine.ry,rectLine.rx, rectLine.ry+rectLine.rh);
			right = lineLine(wallLine[0].a.x,wallLine[0].a.y,wallLine[0].b.x,wallLine[0].b.y, rectLine.rx+rectLine.rw,rectLine.ry, rectLine.rx+rectLine.rw,rectLine.ry+rectLine.rh);
			

			top = lineLine(wallLine[0].a.x,wallLine[0].a.y,wallLine[0].b.x,wallLine[0].b.y, rectLine.rx,rectLine.ry,rectLine.rx+rectLine.rw,rectLine.ry);
			bottom = lineLine(wallLine[0].a.x,wallLine[0].a.y,wallLine[0].b.x,wallLine[0].b.y, rectLine.rx,rectLine.ry+rectLine.rh, rectLine.rx+rectLine.rw,rectLine.ry+rectLine.rh);
		
		
			let fullyInside;
			let xInside; 
			let yInside;
			
			xInside = (rectLine.rx < wallLine[0].a.x) && (rectLine.rx < wallLine[0].b.x) && (rectLine.rx+rectLine.rw > wallLine[0].b.x ) && (rectLine.rx+rectLine.rw > wallLine[0].a.x )		
			yInside = (rectLine.ry < wallLine[0].a.y) && (rectLine.ry < wallLine[0].b.y) && (rectLine.ry+rectLine.rh > wallLine[0].b.y ) && (rectLine.ry+rectLine.rh > wallLine[0].a.y )
			
			

			fullyInside = (yInside &&  xInside)
	


			if(left != false || right != false || top != false || bottom != false || fullyInside){
				if(window.DRAWFUNCTION == "wall-eraser-one" ){
					fullyInside = true;
				}
				for(let j = 0; j < window.DRAWINGS.length; j++){
					if(window.DRAWINGS[j][1] == ("wall") && window.DRAWINGS[j][0] == ("line") && window.DRAWINGS[j][3] == walls[i][3] && window.DRAWINGS[j][4] == walls[i][4] && window.DRAWINGS[j][5] == walls[i][5] && window.DRAWINGS[j][6] == walls[i][6]){
						window.DRAWINGS.splice(j, 1);
						break;
					}
				}
				if(!fullyInside){
					let x1;
					let x2;
					let y1;
					let y2;
					if(left != false){
						if(wallLine[0].b.x > wallLine[0].a.x){
							x1 = (wallLine[0].a.x);
							y1 = (wallLine[0].a.y);
						}
						else{
							x1 = (wallLine[0].b.x);
							y1 = (wallLine[0].b.y);
						}	
						x2 = left.x;
						y2 = left.y;
						let data = ['line',
						 'wall',
						 "rgba(0, 255, 0 ,1)",
						 x1,
						 y1,
						 x2,
						 y2,
						 6,
						 window.CURRENT_SCENE_DATA.scale_factor,
						 ];	
						window.DRAWINGS.push(data);
					}	
					if(right != false){
						if(wallLine[0].b.x > wallLine[0].a.x){
							x1 = (wallLine[0].b.x);
							y1 = (wallLine[0].b.y);
						}
						else{
							x1 = (wallLine[0].a.x);
							y1 = (wallLine[0].a.y);
						}	
						
						x2 = right.x;
						y2 = right.y;
						let data = ['line',
						 'wall',
						 'rgba(0, 255, 0, 1)',
						 x1,
						 y1,
						 x2,
						 y2,
						 6,
						 window.CURRENT_SCENE_DATA.scale_factor,
						 ];	
						window.DRAWINGS.push(data);				
					}
					if(top != false){
						if(wallLine[0].a.y > wallLine[0].b.y){
							x1 = (wallLine[0].b.x);
							y1 = (wallLine[0].b.y);
						}
						else{
							x1 = (wallLine[0].a.x);
							y1 = (wallLine[0].a.y);
						}
						x2 = top.x;
						y2 = top.y;
						let data = ['line',
						 'wall',
						 "rgba(0, 255, 0 ,1)",
						 x1,
						 y1,
						 x2,
						 y2,
						 6,
						 window.CURRENT_SCENE_DATA.scale_factor,
						 ];	
						window.DRAWINGS.push(data);
					
					}
					if(bottom != false){
						if(wallLine[0].a.y > wallLine[0].b.y){
							x1 = (wallLine[0].a.x);
							y1 = (wallLine[0].a.y);
						}
						else{
							x1 = (wallLine[0].b.x);
							y1 = (wallLine[0].b.y);
						}
						x2 = bottom.x;
						y2 = bottom.y;
							let data = ['line',
						 'wall',
						 "rgba(0, 255, 0 ,1)",
						 x1,
						 y1,
						 x2,
						 y2,
						 6,
						 window.CURRENT_SCENE_DATA.scale_factor,
						 ];	
						window.DRAWINGS.push(data);					
					}

					if(window.DRAWFUNCTION == 'wall-door-convert'){
						x1 = undefined;

						if(bottom != false){
							x1 = bottom.x;
							y1 = bottom.y;
						}
						if(left != false){
							if(x1 == undefined){
								x1 = left.x;
								y1 = left.y;
							}
							else{
								x2 = left.x;
								y2 = left.y;
							}
						}
						if(right != false){
							if(x1 == undefined){
								x1 = right.x;
								y1 = right.y;
							}
							else{
								x2 = right.x;
								y2 = right.y;
							}
						}
						if(top != false){							
								x2 = top.x;
								y2 = top.y;							
						}
						let data = ['line',
						 'wall',
						 "rgba(255, 100, 255, 1)",
						 x1,
						 y1,
						 x2,
						 y2,
						 12,
						 window.CURRENT_SCENE_DATA.scale_factor
						 ];	
						window.DRAWINGS.push(data);
						
					}	
				}	
			}		
		}
 		

		redraw_light_walls();
		redraw_light();
		sync_drawings();
	}
	else if (window.DRAWFUNCTION === "draw_text"){
		data[0] = "text";
		const textWidth = e.clientX - window.BEGIN_MOUSEX
		const textHeight = e.clientY - window.BEGIN_MOUSEY
		data[5] = textWidth
		data[6] = textHeight
		add_text_drawing_input(data);
	}
	else if (window.DRAWFUNCTION == "hide" || window.DRAWFUNCTION == "reveal"){
		finalise_drawing_fog(mouseX, mouseY, width, height)
	}

	else if (window.DRAWFUNCTION == "select") {
		// FIND TOKENS INSIDE THE AREA
		var c = 0;
		for (let id in window.TOKEN_OBJECTS) {
			var curr = window.TOKEN_OBJECTS[id];


			let tokenImageRect = $("#tokens>div[data-id='" + curr.options.id + "'] .token-image")[0].getBoundingClientRect();	
			let size = window.TOKEN_OBJECTS[curr.options.id].options.size;	
			var toktop = (parseInt(tokenImageRect.top) + window.scrollY - window.VTTMargin) * (1.0 / window.ZOOM);
			var tokleft = (parseInt(tokenImageRect.left)  + window.scrollX - window.VTTMargin) * (1.0 / window.ZOOM);
			var tokright = (parseInt(tokenImageRect.right) + window.scrollX - window.VTTMargin) * (1.0 / window.ZOOM);
			var tokbottom = (parseInt(tokenImageRect.bottom) + window.scrollY - window.VTTMargin) * (1.0 / window.ZOOM);
			let scaledRemainderTop = (tokbottom-toktop-size)/2;
			let scaledRemainderLeft = (tokright-tokleft-size)/2;
			if(window.TOKEN_OBJECTS[curr.options.id].options.tokenStyleSelect == 'circle' || window.TOKEN_OBJECTS[curr.options.id].options.tokenStyleSelect == 'square' || $("#tokens>div[data-id='" + curr.options.id + "']").hasClass("isAoe")){
				scaledRemainderTop = 0;
				scaledRemainderLeft = 0;
			}
			if (Math.min(window.BEGIN_MOUSEY, mouseY, tokbottom-scaledRemainderTop) == tokbottom-scaledRemainderTop || Math.max(window.BEGIN_MOUSEY, mouseY, toktop+scaledRemainderTop) == toktop+scaledRemainderTop)
				continue;
			if (Math.min(window.BEGIN_MOUSEX, mouseX, tokright-scaledRemainderLeft) == tokright-scaledRemainderLeft || Math.max(window.BEGIN_MOUSEX, mouseX, tokleft+scaledRemainderLeft) == tokleft+scaledRemainderLeft)
				continue;

			c++;
			// TOKEN IS INSIDE THE SELECTION
			if (window.DM || !curr.options.hidden) {
				let tokenDiv = $("#tokens>div[data-id='" + curr.options.id + "']")
				if(tokenDiv.css("pointer-events")!="none" && tokenDiv.css("display")!="none" && !tokenDiv.hasClass("ui-draggable-disabled")) {
					curr.selected = true;
					curr.place();
				}
			}

		}
		$("#temp_overlay").css('z-index', '25');
		window.MULTIPLE_TOKEN_SELECTED = (c > 1);

		redraw_fog();
		draw_selected_token_bounding_box();
		console.log("READY");
	}
	else if (window.DRAWFUNCTION == "measure") {
		WaypointManager.fadeoutMeasuring()
	}

}

function drawing_contextmenu(e) {

	if (window.DRAWSHAPE === "polygon") {
		window.BEGIN_MOUSEX.pop();
		window.BEGIN_MOUSEY.pop();
		if(window.BEGIN_MOUSEX.length > 0){
			var canvas = document.getElementById("temp_overlay");
			var ctx = canvas.getContext("2d");

			if (window.DRAWFUNCTION === "draw") {
				redraw_drawings();
			} else {
				redraw_fog();
			}
			drawPolygon(
				ctx,
				joinPointsArray(
					window.BEGIN_MOUSEX,
					window.BEGIN_MOUSEY
				),
				window.DRAWCOLOR,
				window.DRAWTYPE === "fill",
				window.LINEWIDTH,
				Math.round(((e.pageX - window.VTTMargin) * (1.0 / window.ZOOM))),
				Math.round(((e.pageY - window.VTTMargin) * (1.0 / window.ZOOM)))
			);
		}
		else{
			// cancel polygon if on last point
			clear_temp_canvas();
		}
	}	
	else if (window.DRAWSHAPE === "3pointRect") {
		window.BEGIN_MOUSEX.pop();
		window.BEGIN_MOUSEY.pop();
		if(window.BEGIN_MOUSEX.length > 0){
			var canvas = document.getElementById("temp_overlay");
			var ctx = canvas.getContext("2d");

			if (window.DRAWFUNCTION === "draw") {
				redraw_drawings();
			} else {
				redraw_fog();
			}
			draw3PointRect(
				ctx,
				joinPointsArray(
					window.BEGIN_MOUSEX,
					window.BEGIN_MOUSEY
				),
				window.DRAWCOLOR,
				window.DRAWTYPE === "fill",
				window.LINEWIDTH,
				Math.round(((e.pageX - window.VTTMargin) * (1.0 / window.ZOOM))),
				Math.round(((e.pageY - window.VTTMargin) * (1.0 / window.ZOOM)))
			);
		}
		else{
			// cancel polygon if on last point
			clear_temp_canvas();
		}
	}
	else if((window.DRAWFUNCTION == "draw") || (window.DRAWFUNCTION == "reveal") || (window.DRAWFUNCTION == "hide"))
	{
		// cancel shape
		window.MOUSEDOWN = false;
		redraw_fog();
	}
}

/**
 * maps "hide" or "reveal" to a bool to be stored in window.REVEALED
 * @returns 1 | 0
 */
 function fog_type_to_int(){
	return window.DRAWFUNCTION === "hide" ? 1 : 0
}

/**
 * sets window.REVEALED with arcs/rects for fog before redrawing them and syncing
 * @param {Number} mouseX end position of mouse
 * @param {Number} mouseY end position of mouse
 * @param {Number} width width of fog
 * @param {Number} height height of fog
 */
function finalise_drawing_fog(mouseX, mouseY, width, height) {
	if (window.DRAWSHAPE == "arc") {
		const centerX = window.BEGIN_MOUSEX;
		const centerY = window.BEGIN_MOUSEY;
		const radius = Math.round(Math.sqrt(Math.pow(centerX - mouseX, 2) + Math.pow(centerY - mouseY, 2)));
		data = [centerX, centerY, radius, 0, 1, fog_type_to_int(), window.CURRENT_SCENE_DATA.scale_factor];
		window.REVEALED.push(data);
		sync_fog();
		redraw_fog();
	} else if (window.DRAWSHAPE == "rect") {
		data = [window.BEGIN_MOUSEX, window.BEGIN_MOUSEY, width, height, 0, fog_type_to_int(), window.CURRENT_SCENE_DATA.scale_factor];
		window.REVEALED.push(data);
		sync_fog();
		redraw_fog();
	}
	else if(window.DRAWSHAPE == "paint-bucket"){
		data = [mouseX, mouseY, null, null, 4, fog_type_to_int(), window.CURRENT_SCENE_DATA.scale_factor]
		window.REVEALED.push(data);
		sync_fog();
		redraw_fog();
	}
}



/**
 * Hides all open menus from the top buttons and deselects all the buttons
 */
function deselect_all_top_buttons(buttonSelectedClasses) {
	topButtonIDs = ["select-button", "measure-button", "fog_button", "draw_button", "aoe_button", "text_button", "wall_button", "vision_button"]
	$(".top_menu").removeClass("visible")
	topButtonIDs.forEach(function(id) {
		$(`#${id}`).removeClass(buttonSelectedClasses)
	})
}

/**
 * Gets the relevant draw information from the button and menu provided
 *
 * @param {$} button the selected button when the user clicks on the canvas
 * @param {$} menuSelector the open menu if it exists
 * @returns {Object} draw data, containing at least "shape" and "function", optionally "frommenu"
 * as well as any other selected buttons/required options, such as color/line width, or font family/fontsize
 */
function get_draw_data(button, menu){
	if($("#prewiz").length > 0 || $("#wizard_popup").length>0){
		return {
			shape:'rect',
			function:'select'
		}
	}
	if (!$(button).hasClass("menu-option") && !$(button).hasClass("menu-button")){
		console.groupEnd()
		return {
			shape:$(button).attr("data-shape"),
			function:$(button).attr("data-function")
		}
	}
	// find all active buttons within this menu
	// and any required value
	else{
		const requiredValuesInMenu = $(menu).find('[data-required]')
		const selectedInMenu = $(menu).find(".ddbc-tab-options__header-heading--is-active")
		const selectedShape = $(menu).find(".ddbc-tab-options__header-heading--is-active[data-shape]").attr("data-shape")
		const selectedFunction = $(menu).find(".ddbc-tab-options__header-heading--is-active[data-function]").attr("data-function")

		const requiredOptions = $(requiredValuesInMenu).map(function() {
			const key = $(this).attr("id")
			const value = $(this).val()
			return details = {
				[key]: value
			}
		})
		const selectedOptions = $(selectedInMenu).map(function() {
			const key = $(this).attr("data-key")
			const value = $(this).attr("data-value")
			return details = {
				[key]: value
			}
		})
		const options = Object.assign({}, ...requiredOptions, ...selectedOptions);

		console.groupEnd()
		return{
			shape:selectedShape,
			function:selectedFunction,
			from:menu.attr("id"),
			...options
		}
	}
}


/**
 * The main event handler for all drawing buttons (select/measure/fog/draw/text)
 * Allows unified controller for selecting buttons/menus/menu options
 * Uses data attr's on the menu's to select correct information such as
 * data-toggle - a button can be toggled on or off
 * data-required - the data of this element is always extracted in get_draw_data
 * data-unique-with - only one of these can be selected at a time, mostly used with the draw shape
 * data-shape - the shape of the drawing
 * data-function - the drawing function, draw/erase/text-erase/measure/select/hide/reveal
 */
function handle_drawing_button_click() {
	$(".drawbutton").click(function(e) {
		const buttonSelectedClasses = "button-enabled ddbc-tab-options__header-heading--is-active"
		const clicked = this;
		let menu
		// FIND THE MENU
		// button has a menu
		if ($(clicked).hasClass("menu-button")){
			menu = clicked.id.replace("button", "menu" )
			menu = "#" + menu
			$(`${menu} :input:enabled:visible:not([readonly]):first`).focus();
		}
		// button is in a menu
		else if($(clicked).hasClass("menu-option")){
			menu = $(clicked).closest("[id*='menu']")
		}

		// HANDLE SELECTING OF BUTTONS
		// button is a selected button, hide it's menu
		if ($(clicked).hasClass(buttonSelectedClasses)){
			if(!$(clicked).attr("data-toggle")){
				$(menu).toggleClass("visible")
			}
			// toggle the button off...
			if($(clicked).hasClass("menu-option")){
				// but only toggled on or off if they're not a unique-with which must always have
				// 1 option selected
				if(!$(clicked).attr("data-unique-with")){
					$(clicked).removeClass(`${buttonSelectedClasses}`)
				}
			}
		}else{
			// unselect any matching unique-with buttons
			if($(clicked).hasClass("menu-option")){
				const uniqueWith = $(clicked).attr("data-unique-with")
				menu.find(`[data-unique-with=${uniqueWith}]`).removeClass(`${buttonSelectedClasses}` )
			}else{
				// clicked on an unselected non menu-option so must be either
				// select/ruler/fog/draw/aoe/text
				deselect_all_top_buttons(buttonSelectedClasses)
			}
			// button isn't selected, so select it and open
			$(clicked).addClass(buttonSelectedClasses)
			$(menu).addClass("visible")
		}

		stop_drawing();
		if(window.CURRENT_SCENE_DATA != undefined)
			redraw_light_walls();
		target =  $("#temp_overlay, #black_layer")
		data = {
			clicked:$(clicked),
			menu:$(menu)
		}
		// allow all drawing to be done above the tokens
		if ($(clicked).is("#select-button")){
			$("#temp_overlay").css("z-index", "25")
			$
		}
		else{
			$("#temp_overlay").css("z-index", "50")
		}
		if (($(clicked).is("#text_button") ||$(clicked).is("#text_select")) && $("#text_select").hasClass('ddbc-tab-options__header-heading--is-active')){
			$("#text_div").css("z-index", "51")
		}
		else{
			$("#text_div").css("z-index", "20")
		}
		target.on('mousedown', data, drawing_mousedown);
		target.on('mouseup',  data, drawing_mouseup);
		target.on('mousemove', data, drawing_mousemove);
		target.on('contextmenu', data, drawing_contextmenu);
	})
	// during initialisation of VTT default to the select button
	$('#select-button').click();

}

function drawCircle(ctx, centerX, centerY, radius, style, fill=true, lineWidth = 6)
{
	ctx.beginPath();
	ctx.arc(centerX/window.CURRENT_SCENE_DATA.scale_factor, centerY/window.CURRENT_SCENE_DATA.scale_factor, radius/window.CURRENT_SCENE_DATA.scale_factor, 0, 2 * Math.PI, false);
	if(fill){
		ctx.fillStyle = style;
		ctx.fill();
	}
	else{
		ctx.strokeStyle = style;
		ctx.lineWidth = lineWidth;
		ctx.stroke();
	}

}

function drawRect(ctx, startx, starty, width, height, style, fill=true, lineWidth = 6)
{
	ctx.beginPath();
	if(fill)
	{
		ctx.fillStyle = style;
		ctx.fillRect(startx/window.CURRENT_SCENE_DATA.scale_factor, starty/window.CURRENT_SCENE_DATA.scale_factor, width/window.CURRENT_SCENE_DATA.scale_factor, height/window.CURRENT_SCENE_DATA.scale_factor);
	}
	else
	{
		ctx.lineWidth = lineWidth;
		ctx.strokeStyle = style;
		ctx.beginPath();
		ctx.rect(startx/window.CURRENT_SCENE_DATA.scale_factor, starty/window.CURRENT_SCENE_DATA.scale_factor, width/window.CURRENT_SCENE_DATA.scale_factor, height/window.CURRENT_SCENE_DATA.scale_factor);
		ctx.stroke();
	}

}

function drawCone(ctx, startx, starty, endx, endy, style, fill=true, lineWidth = 6)
{
	var L = Math.sqrt(Math.pow(endx - startx, 2) + Math.pow(endy - starty, 2));
	var T = Math.sqrt(Math.pow(L, 2) + Math.pow(L / 2, 2));
	var res = circle_intersection(startx, starty, T, endx, endy, L / 2);
	ctx.beginPath();
	ctx.moveTo(startx/window.CURRENT_SCENE_DATA.scale_factor, starty/window.CURRENT_SCENE_DATA.scale_factor);
	ctx.lineTo(res[0]/window.CURRENT_SCENE_DATA.scale_factor, res[2]/window.CURRENT_SCENE_DATA.scale_factor);
	ctx.lineTo(res[1]/window.CURRENT_SCENE_DATA.scale_factor, res[3]/window.CURRENT_SCENE_DATA.scale_factor);
	ctx.closePath();
	if(fill){
		ctx.fillStyle = style;
		ctx.fill();
	}
	else{
		ctx.lineWidth = lineWidth;
		ctx.strokeStyle = style;
		ctx.stroke();
	}

}

function drawLine(ctx, startx, starty, endx, endy, style, lineWidth = 6, scale=window.CURRENT_SCENE_DATA.scale_factor)
{
	ctx.beginPath();
	ctx.strokeStyle = style;
	ctx.lineWidth = lineWidth;

	let adjustScale = (scale/window.CURRENT_SCENE_DATA.scale_factor);	

	ctx.moveTo(startx/adjustScale/window.CURRENT_SCENE_DATA.scale_factor, starty/adjustScale/window.CURRENT_SCENE_DATA.scale_factor);
	ctx.lineTo(endx/adjustScale/window.CURRENT_SCENE_DATA.scale_factor, endy/adjustScale/window.CURRENT_SCENE_DATA.scale_factor);
	ctx.stroke();
}

function drawBrushstroke(ctx, points, style, lineWidth=6, scale=window.CURRENT_SCENE_DATA.scale_factor)
{
	// Copyright (c) 2021 by Limping Ninja (https://codepen.io/LimpingNinja/pen/qBmpvqj)
    // Fork of an original work  (https://codepen.io/kangax/pen/pxfCn

	var p1 = points[0];
	var p2 = points[1];

	ctx.strokeStyle = style;
	ctx.lineWidth = lineWidth;
	ctx.beginPath();

	let adjustScale = (scale/window.CURRENT_SCENE_DATA.scale_factor)	

	ctx.moveTo(p1.x/adjustScale/window.CURRENT_SCENE_DATA.scale_factor, p1.y/adjustScale/window.CURRENT_SCENE_DATA.scale_factor);

	for (var i = 1, len = points.length; i < len; i++) {
	// we pick the point between pi+1 & pi+2 as the
	// end point and p1 as our control point
	var midPoint = midPointBtw(p1, p2);
	ctx.quadraticCurveTo(p1.x/adjustScale/window.CURRENT_SCENE_DATA.scale_factor, p1.y/adjustScale/window.CURRENT_SCENE_DATA.scale_factor, midPoint.x/adjustScale/window.CURRENT_SCENE_DATA.scale_factor, midPoint.y/adjustScale/window.CURRENT_SCENE_DATA.scale_factor);
	p1 = points[i];
	p2 = points[i+1];
	}
	// Draw last line as a straight line
	ctx.lineTo(p1.x/adjustScale/window.CURRENT_SCENE_DATA.scale_factor, p1.y/adjustScale/window.CURRENT_SCENE_DATA.scale_factor);
	ctx.stroke();
}

function drawPolygon (
	ctx,
	points,
	style = 'rgba(255,0,0,0.6)',
	fill = true,
	lineWidth,
	mouseX = null,
	mouseY = null,
	scale = window.CURRENT_SCENE_DATA.scale_factor,
	replacefog = false,
	islight = false
) {
	ctx.save();
	ctx.beginPath();
	let adjustScale = (scale/window.CURRENT_SCENE_DATA.scale_factor)	
	
	ctx.moveTo(points[0].x/adjustScale/window.CURRENT_SCENE_DATA.scale_factor, points[0].y/adjustScale/window.CURRENT_SCENE_DATA.scale_factor);
	ctx.lineWidth = lineWidth;
		
	points.forEach((vertice) => {
		ctx.lineTo(vertice.x/adjustScale/window.CURRENT_SCENE_DATA.scale_factor, vertice.y/adjustScale/window.CURRENT_SCENE_DATA.scale_factor);
	})

	if (mouseX !== null && mouseY !== null) {
		ctx.lineTo(mouseX/adjustScale/window.CURRENT_SCENE_DATA.scale_factor, mouseY/adjustScale/window.CURRENT_SCENE_DATA.scale_factor);
	}

	ctx.closePath();

	// draw a line between first 2 points
	if (points.length < 2){
		ctx.strokeStyle = style;
		ctx.stroke();
	}
	// any more we use the filltype to decide how the polygon is drawn
	else if(fill){
		ctx.fillStyle = style;
		ctx.fill();
		if(!islight){
			if(replacefog && window.DM)
			{
				ctx.strokeStyle = 'rgba(0,0,0,0.1)';
				ctx.stroke();
			}
			else if(replacefog){
				ctx.strokeStyle = 'rgba(0,0,0,1)';
				ctx.stroke();
			}
		}
		else{
			ctx.strokeStyle = style;
			ctx.stroke();
		}
		
	}
	else{
		ctx.strokeStyle = style;
		ctx.stroke();
	}

}
function draw3PointRect(
	ctx,
	points,
	style = 'rgba(255,0,0,0.6)',
	fill = true,
	lineWidth,
	mouseX = null,
	mouseY = null,
	scale = window.CURRENT_SCENE_DATA.scale_factor,
	replacefog = false,
	islight = false
) {
	ctx.save();
	ctx.beginPath();
	let adjustScale = (scale/window.CURRENT_SCENE_DATA.scale_factor)	
	
	ctx.moveTo(points[0].x/adjustScale/window.CURRENT_SCENE_DATA.scale_factor, points[0].y/adjustScale/window.CURRENT_SCENE_DATA.scale_factor);
	ctx.lineWidth = lineWidth;
		
	points.forEach((vertice) => {
		ctx.lineTo(vertice.x/adjustScale/window.CURRENT_SCENE_DATA.scale_factor, vertice.y/adjustScale/window.CURRENT_SCENE_DATA.scale_factor);
	})

	if (mouseX !== null && mouseY !== null) {
		ctx.lineTo(mouseX/adjustScale/window.CURRENT_SCENE_DATA.scale_factor, mouseY/adjustScale/window.CURRENT_SCENE_DATA.scale_factor);
	}

	
	// draw a line between first 2 points
	if (points.length < 2){
		ctx.strokeStyle = style;
		ctx.stroke();
	}
	// any more we use the filltype to decide how the polygon is drawn
	else if(fill){
		if(!points[2]){
			points[2] = {x: mouseX, y: mouseY}
			ctx.lineTo(points[2].x/adjustScale/window.CURRENT_SCENE_DATA.scale_factor, points[2].y/adjustScale/window.CURRENT_SCENE_DATA.scale_factor);
		}

		let point4 = calculateFourthPoint(points[0], points[1], points[2]);

		ctx.lineTo(point4.x/adjustScale/window.CURRENT_SCENE_DATA.scale_factor, point4.y/adjustScale/window.CURRENT_SCENE_DATA.scale_factor);
		ctx.closePath();
		ctx.fillStyle = style;
		ctx.fill();
		if(!islight){
			if(replacefog && window.DM)
			{
				ctx.strokeStyle = 'rgba(0,0,0,0.1)';
				ctx.stroke();
			}
			else if(replacefog){
				ctx.strokeStyle = 'rgba(0,0,0,1)';
				ctx.stroke();
			}
		}

		
	}
	else{
		if(!points[2]){
			points[2] = {x: mouseX, y: mouseY}
			ctx.lineTo(points[2].x/adjustScale/window.CURRENT_SCENE_DATA.scale_factor, points[2].y/adjustScale/window.CURRENT_SCENE_DATA.scale_factor);
		}
		let point4 = calculateFourthPoint(points[0], points[1], points[2]);
		ctx.lineTo(point4.x/adjustScale/window.CURRENT_SCENE_DATA.scale_factor, point4.y/adjustScale/window.CURRENT_SCENE_DATA.scale_factor);
		ctx.closePath();
		ctx.strokeStyle = style;
		ctx.stroke();
	}
}
function calculateFourthPoint(point1, point2, point3) {
    var length = Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
    var angle = Math.atan2(point2.y - point1.y, point2.x - point1.x);
    var dx = Math.cos(angle) * length;
    var dy = Math.sin(angle) * length;
    return { x: point3.x - dx, y: point3.y - dy };
}
function clear_temp_canvas(){
	const canvas = document.getElementById("temp_overlay");
	const context = canvas.getContext("2d");
	context.clearRect(0, 0, canvas.width, canvas.height);
}

function bucketFill(ctx, mouseX, mouseY, fogStyle = 'rgba(0,0,0,0)', fogType=0, islight=false){
	if(window.PARTICLE == undefined){
		initParticle(new Vector(200, 200), 1);
	}
	let fog = true;
	let distance = 10000;
  	particleUpdate(mouseX, mouseY); // moves particle
	particleLook(ctx, window.walls, distance, fog, fogStyle, fogType, true, islight); 
	redraw_light_walls();
}

function save3PointRect(e){
	const polygonPoints = joinPointsArray(window.BEGIN_MOUSEX, window.BEGIN_MOUSEY);
	let data;
	if (window.DRAWFUNCTION === "hide" || window.DRAWFUNCTION === "reveal"){
		data = [
			polygonPoints,
			null,
			null,
			null,
			5,
			fog_type_to_int(), 
			window.CURRENT_SCENE_DATA.scale_factor
		];
		window.REVEALED.push(data);
		redraw_fog();
	}
	else if(window.DRAWFUNCTION === "wall"){

		polygonPoints[3] = calculateFourthPoint(polygonPoints[0], polygonPoints[1], polygonPoints[2]);
		for(let point = 0; point<polygonPoints.length; point++){
			if(point<3){
				data = ['line',
				"wall",
				window.DRAWCOLOR,
				polygonPoints[point].x,
				polygonPoints[point].y,
				polygonPoints[point+1].x,
				polygonPoints[point+1].y,
				window.LINEWIDTH,
				window.CURRENT_SCENE_DATA.scale_factor];
			}
			else{
			data = ['line',
				"wall",
				window.DRAWCOLOR,
				polygonPoints[point].x,
				polygonPoints[point].y,
				polygonPoints[0].x,
				polygonPoints[0].y,
				window.LINEWIDTH,
				window.CURRENT_SCENE_DATA.scale_factor];
			}
			window.DRAWINGS.push(data);
		}
		window.MOUSEDOWN = false;
		redraw_light_walls();
		redraw_light();
	}
	else{
		data = [
			'3pointRect',
			window.DRAWTYPE,
			window.DRAWCOLOR,
			polygonPoints,
			null,
			null,
			null,
			window.LINEWIDTH,
			window.CURRENT_SCENE_DATA.scale_factor
		];
		window.DRAWINGS.push(data);
		redraw_drawings();
	}
	clear_temp_canvas()

	if (window.DRAWFUNCTION === "draw" || window.DRAWFUNCTION === "wall") {
		sync_drawings();
	} else {
		sync_fog();
	}
	window.BEGIN_MOUSEX = [];
	window.BEGIN_MOUSEY = [];
}
function savePolygon(e) {
	const polygonPoints = joinPointsArray(window.BEGIN_MOUSEX, window.BEGIN_MOUSEY);
	let data;
	if (window.DRAWFUNCTION === "hide" || window.DRAWFUNCTION === "reveal"){
		data = [
			polygonPoints,
			null,
			null,
			null,
			3,
			fog_type_to_int(), 
			window.CURRENT_SCENE_DATA.scale_factor
		];
		window.REVEALED.push(data);
		redraw_fog();
	}
	else{
		data = [
			'polygon',
			window.DRAWTYPE,
			window.DRAWCOLOR,
			polygonPoints,
			null,
			null,
			null,
			window.LINEWIDTH,
			window.CURRENT_SCENE_DATA.scale_factor
		];
		window.DRAWINGS.push(data);
		redraw_drawings();
	}
	clear_temp_canvas()

	if (window.DRAWFUNCTION === "draw") {
		sync_drawings();
	} else {
		sync_fog();
	}
	window.BEGIN_MOUSEX = [];
	window.BEGIN_MOUSEY = [];
}

function joinPointsArray(pointsX, pointsY) {
	return pointsX.map((pointX, i) => {
		return { x: pointX, y: pointsY[i] };
	});
}

function isPointWithinDistance(points1, points2) {
	return Math.abs(points1.x - points2.x) <= POLYGON_CLOSE_DISTANCE
			&& Math.abs(points1.y - points2.y) <= POLYGON_CLOSE_DISTANCE;
}
function clear3PointRect (ctx, points, scale = window.CURRENT_SCENE_DATA.scale_factor, layeredFog = false) {

	/*
	 * globalCompositeOperation does not accept alpha transparency,
	 * need to set it to opaque color.
	 */
	ctx.fillStyle = "#000";
	ctx.globalCompositeOperation = 'destination-out';
	ctx.beginPath();
	let adjustScale = (scale/window.CURRENT_SCENE_DATA.scale_factor)	
	ctx.moveTo(points[0].x/adjustScale/window.CURRENT_SCENE_DATA.scale_factor, points[0].y/adjustScale/window.CURRENT_SCENE_DATA.scale_factor);
	points.forEach((vertice) => {
		ctx.lineTo(vertice.x/adjustScale/window.CURRENT_SCENE_DATA.scale_factor, vertice.y/adjustScale/window.CURRENT_SCENE_DATA.scale_factor);
	})
	let point4 = calculateFourthPoint(points[0], points[1], points[2]);
	ctx.lineTo(point4.x/adjustScale/window.CURRENT_SCENE_DATA.scale_factor, point4.y/adjustScale/window.CURRENT_SCENE_DATA.scale_factor);
	ctx.closePath();
	ctx.fill();
	if(!layeredFog)
		ctx.stroke();
	ctx.restore();
	ctx.globalCompositeOperation = "source-over";
}
function clearPolygon (ctx, points, scale = window.CURRENT_SCENE_DATA.scale_factor, layeredFog = false) {

	/*
	 * globalCompositeOperation does not accept alpha transparency,
	 * need to set it to opaque color.
	 */
	ctx.fillStyle = "#000";
	ctx.globalCompositeOperation = 'destination-out';
	ctx.beginPath();
	let adjustScale = (scale/window.CURRENT_SCENE_DATA.scale_factor)	
	ctx.moveTo(points[0].x/adjustScale/window.CURRENT_SCENE_DATA.scale_factor, points[0].y/adjustScale/window.CURRENT_SCENE_DATA.scale_factor);
	points.forEach((vertice) => {
		ctx.lineTo(vertice.x/adjustScale/window.CURRENT_SCENE_DATA.scale_factor, vertice.y/adjustScale/window.CURRENT_SCENE_DATA.scale_factor);
	})
	ctx.closePath();
	ctx.fill();
	if(!layeredFog)
		ctx.stroke();
	ctx.restore();
	ctx.globalCompositeOperation = "source-over";
}

function clearCircle(ctx, centerX, centerY, radius)
{
	ctx.save();
	ctx.beginPath();
	ctx.fillStyle = "rgba(0,0,0,0);"
	ctx.arc(centerX/window.CURRENT_SCENE_DATA.scale_factor, centerY/window.CURRENT_SCENE_DATA.scale_factor, radius/window.CURRENT_SCENE_DATA.scale_factor, 0, 2 * Math.PI, false);
	ctx.clip();
	ctx.clearRect(centerX/window.CURRENT_SCENE_DATA.scale_factor - radius/window.CURRENT_SCENE_DATA.scale_factor, centerY/window.CURRENT_SCENE_DATA.scale_factor - radius/window.CURRENT_SCENE_DATA.scale_factor, radius * 2/window.CURRENT_SCENE_DATA.scale_factor, radius * 2/window.CURRENT_SCENE_DATA.scale_factor);
	ctx.restore();
}

function drawClosingArea(ctx, pointX, pointY) {
	ctx.strokeStyle = "#00FFFF";
	ctx.lineWidth = "2";
	ctx.beginPath();
	ctx.rect(
		pointX/window.CURRENT_SCENE_DATA.scale_factor - POLYGON_CLOSE_DISTANCE,
		pointY/window.CURRENT_SCENE_DATA.scale_factor - POLYGON_CLOSE_DISTANCE,
		POLYGON_CLOSE_DISTANCE * 2,
		POLYGON_CLOSE_DISTANCE * 2);
	ctx.stroke();
}

function init_fog_menu(buttons){



	fog_menu = $("<div id='fog_menu' class='top_menu'></div>");
	fog_menu.append("<div class='menu-subtitle' data-skip='true'>Reveal</div>");
	fog_menu.append(
		`<div class='ddbc-tab-options--layout-pill'>
			<button id='fog_square_r' class='ddbc-tab-options__header-heading drawbutton menu-option fog-option button-enabled ddbc-tab-options__header-heading--is-active'
				data-shape='rect' data-function="reveal" data-unique-with="fog" >
					Square
			</button>
		</div>`);
	fog_menu.append(
		`<div class='ddbc-tab-options--layout-pill'>
			<button id='fog_square_r' class='ddbc-tab-options__header-heading drawbutton menu-option fog-option'
				data-shape='3pointRect' data-function="reveal" data-unique-with="fog" >
					3p Rect
			</button>
		</div>`);
	fog_menu.append(
		`<div class='ddbc-tab-options--layout-pill'>
			<button id='fog_circle_r' class='ddbc-tab-options__header-heading drawbutton menu-option fog-option'
				data-shape='arc' data-function="reveal" data-unique-with="fog" >
					Circle
				</button>
			</div>`);
	fog_menu.append(
		`<div class='ddbc-tab-options--layout-pill'>
			<button id='fog_polygon_r' class='ddbc-tab-options__header-heading drawbutton menu-option fog-option'
				data-shape='polygon' data-function="reveal" data-unique-with="fog">
					Polygon
			</button>
		</div>`);
	fog_menu.append(
		`<div class='ddbc-tab-options--layout-pill'>
			<button id='fog_paint_r' class='ddbc-tab-options__header-heading drawbutton menu-option fog-option'
				data-shape='paint-bucket' data-function="reveal" data-unique-with="fog">
					Bucket Fill
			</button>
		</div>`);

	var clear_button = $("<button class='ddbc-tab-options__header-heading menu-option' data-skip='true' >ALL</button>");
	clear_button.click(function() {

		r = confirm("This will delete all FOG zones and REVEAL ALL THE MAP to the player. THIS CANNOT BE UNDONE. Are you sure?");
		if (r == true) {
			window.REVEALED = [[0, 0, $("#scene_map").width()*window.CURRENT_SCENE_DATA.scale_factor, $("#scene_map").height()*window.CURRENT_SCENE_DATA.scale_factor, 0, 0, window.CURRENT_SCENE_DATA.scale_factor]];

			redraw_fog();
			sync_fog();
		}
	});

	fog_menu.append($("<div class='ddbc-tab-options--layout-pill' data-skip='true' />").append(clear_button));
	fog_menu.append("<div class='menu-subtitle' data-skip='true'>Hide</div>");
	fog_menu.append(
		`<div class='ddbc-tab-options--layout-pill'>
			<button id='fog_square_h' class='ddbc-tab-options__header-heading drawbutton menu-option fog-option'
				data-shape='rect' data-function="hide" data-unique-with="fog" >
					Square
			</button>
		</div>`);
	fog_menu.append(
		`<div class='ddbc-tab-options--layout-pill'>
			<button id='fog_square_h' class='ddbc-tab-options__header-heading drawbutton menu-option fog-option'
				data-shape='3pointRect' data-function="hide" data-unique-with="fog" >
					3p Rect
			</button>
		</div>`);
	fog_menu.append(
		`<div class='ddbc-tab-options--layout-pill'>
			<button id='fog_circle_h' class='ddbc-tab-options__header-heading drawbutton menu-option fog-option'
				data-shape='arc' data-function="hide" data-unique-with="fog" >
					Circle
			</button>
		</div>`);
	fog_menu.append(
		`<div class='ddbc-tab-options--layout-pill'>
			<button id='fog_polygon_h' class='ddbc-tab-options__header-heading drawbutton menu-option fog-option'
				data-shape='polygon' data-function="hide" data-unique-with="fog">
					Polygon
			</button>
		</div>`);
		fog_menu.append(
		`<div class='ddbc-tab-options--layout-pill'>
			<button id='fog_paint_h' class='ddbc-tab-options__header-heading drawbutton menu-option fog-option'
				data-shape='paint-bucket' data-function="hide" data-unique-with="fog">
					Bucket Fill
			</button>
		</div>`);



	var hide_all_button = $("<button class='ddbc-tab-options__header-heading menu-option'>ALL</button>");
	hide_all_button.click(function() {
		r = confirm("This will delete all FOG zones and HIDE ALL THE MAP to the player. THIS CANNOT BE UNDONE. Are you sure?");
		if (r == true) {
			window.REVEALED = [];
			redraw_fog();
			sync_fog();
		}
	});

	fog_menu.append($("<div class='ddbc-tab-options--layout-pill' data-skip='true'/>").append(hide_all_button));
	fog_menu.append(
		`<div class='ddbc-tab-options--layout-pill' data-skip='true'>
			<button class='ddbc-tab-options__header-heading menu-option' id='fog_undo'>
				UNDO
			</button>
		</div>`)
	fog_menu.css("position", "fixed");
	fog_menu.css("top", "25px");
	fog_menu.css("width", "90px");
	fog_menu.css('background', "url('/content/1-0-1487-0/skins/waterdeep/images/mon-summary/paper-texture.png')")
	$("body").append(fog_menu);
	fog_menu.find(`[data-shape='paint-bucket']`).on('click', function(){
		redraw_light_walls();
	});
	fog_menu.find("#fog_undo").click(function(){
		window.REVEALED.pop();
		redraw_fog();
		sync_fog();
	});

	fog_button = $("<button style='display:inline;width:75px;' id='fog_button' class='drawbutton menu-button hideable ddbc-tab-options__header-heading'><u>F</u>OG</button>");

	buttons.append(fog_button);
	fog_menu.css("left", fog_button.position().left);
}

function init_draw_menu(buttons){
	draw_menu = $("<div id='draw_menu' class='top_menu'></div>");
	draw_menu.append(
		`<div class='ddbc-tab-options--layout-pill'>
			<button id='draw_rect' class='drawbutton menu-option  ddbc-tab-options__header-heading button-enabled ddbc-tab-options__header-heading--is-active'
				data-shape="rect" data-function="draw" data-unique-with="draw">
					Rectangle
			</button>
		</div>`);
	draw_menu.append(
		`<div class='ddbc-tab-options--layout-pill'>
			<button id='draw_rect' class='drawbutton menu-option  ddbc-tab-options__header-heading'
				data-shape="3pointRect" data-function="draw" data-unique-with="draw">
					3p Rect
			</button>
		</div>`);
	draw_menu.append(
		`<div class='ddbc-tab-options--layout-pill'>
			<button id='draw_circle' class='drawbutton menu-option  ddbc-tab-options__header-heading'
				data-shape='arc' data-function="draw" data-unique-with="draw">
					Circle
			</button>
		</div>`);
	draw_menu.append(
		`<div class='ddbc-tab-options--layout-pill'>
			<button id='draw_cone' class='drawbutton menu-option  ddbc-tab-options__header-heading'
				data-shape='cone' data-function="draw" data-unique-with="draw">
					Cone
			</button>
		</div>`);
	draw_menu.append(
		`<div class='ddbc-tab-options--layout-pill'>
			<button id='draw_line' class='drawbutton menu-option  ddbc-tab-options__header-heading'
				data-shape='line' data-function="draw" data-unique-with="draw">
					Line
			</button>
			</div>`);
		draw_menu.append(
		`<div class='ddbc-tab-options--layout-pill'>
			<button id='draw_brush' class='drawbutton menu-option  ddbc-tab-options__header-heading'
				data-shape='brush' data-function="draw" data-unique-with="draw">
					Brush
			</button>
		</div>`);
	draw_menu.append(
		`<div class='ddbc-tab-options--layout-pill'>
			<button id='draw_polygon' class='drawbutton menu-option  ddbc-tab-options__header-heading'
				data-shape='polygon' data-function="draw" data-unique-with="draw">
				 	Polygon
			</button>
		</div>`);
	if(window.DM){
		draw_menu.append(
		`<div class='ddbc-tab-options--layout-pill'>
			<button id='paint-bucket' class='drawbutton menu-option  ddbc-tab-options__header-heading'
				data-shape='paint-bucket' data-function="draw" data-unique-with="draw">
				 	Bucket Fill
			</button>
		</div>`);
	}

	draw_menu.find(`[data-shape='paint-bucket']`).on('click', function(){
		redraw_light_walls();
	});
	draw_menu.append(`
        <input title='Background color' data-required="background_color" class='spectrum'
            id='background_color' name='background color' value='${(!window.DM) ? $('.ddbc-svg--themed path').css('fill') : '#e66465'}'/>
        `)

    let colorPickers = draw_menu.find('input.spectrum');
	colorPickers.spectrum({
		type: "color",
		showInput: true,
		showInitial: true,
		clickoutFiresChange: true
	});

    const colorPickerChange = function(e, tinycolor) {
		let color = `rgba(${tinycolor._r}, ${tinycolor._g}, ${tinycolor._b}, ${tinycolor._a})`;
        $(e.target).val(color)

	};
	draw_menu.find(".sp-replacer").attr("data-skip",'true')
	colorPickers.on('move.spectrum', colorPickerChange);   // update the token as the player messes around with colors
	colorPickers.on('change.spectrum', colorPickerChange); // commit the changes when the user clicks the submit button
	colorPickers.on('hide.spectrum', colorPickerChange);   // the hide event includes the original color so let's change it back when we get it


	draw_menu.append("<div class='menu-subtitle' data-skip='true'>Type</div>");
	draw_menu.append(
		`<div class='ddbc-tab-options--layout-pill'>
			<button class='drawbutton menu-option ddbc-tab-options__header-heading button-enabled ddbc-tab-options__header-heading--is-active'
				data-key="fill" data-value='border' data-unique-with="fill">
				BORDER
			</button>
		</div>`);
	draw_menu.append(
		`<div class='ddbc-tab-options--layout-pill'>
			<button class='drawbutton menu-option ddbc-tab-options__header-heading'
				data-key="fill" data-value='filled' data-unique-with="fill">
				FILLED
			</button>
		</div>`);

	draw_menu.append("<div class='menu-subtitle'>Line Width</div>");
	draw_menu.append(`
		<div>
			<input id='draw_line_width' data-required="draw_line_width" type='number' style='width:90%' min='1'
			value='6' class='drawWidthSlider'>
		</div>`
	);


	draw_menu.append(`<div class='menu-subtitle'>Controls</div>`);
	draw_menu.append(
		`<div class='ddbc-tab-options--layout-pill menu-option data-skip='true''>
			<button id='draw_erase' class='drawbutton menu-option  ddbc-tab-options__header-heading'
				data-shape='rect' data-function="eraser" data-unique-with="draw">
				 	Erase
			</button>
		</div>`);
	if(window.DM){
		draw_menu.append(`
			<div class='ddbc-tab-options--layout-pill' data-skip='true'>
				<button class='ddbc-tab-options__header-heading  menu-option' id='draw_undo'>
					UNDO
				</button>
			</div>`);
		draw_menu.append(
			`<div class='ddbc-tab-options--layout-pill' data-skip='true'>
				<button class='ddbc-tab-options__header-heading  menu-option' id='delete_drawing'>
					CLEAR DRAW
				</button>
			</div>`);
	}


	draw_menu.find("#delete_drawing").click(function() {
		r = confirm("DELETE ALL DRAWINGS (cannot be undone!)");
		if (r === true) {
			// keep only text
			window.DRAWINGS = window.DRAWINGS.filter(d => d[0].includes("text") || d[1].includes('wall') || d[1].includes('light') );
			redraw_drawings()
			sync_drawings()
		}
	});

	draw_menu.find("#draw_undo").click(function() {
		// start at the end
        let currentElement = window.DRAWINGS.length
        // loop from the last element and remove if it's not text
        while (currentElement--) {
            if (!window.DRAWINGS[currentElement][0].includes("text")){
                window.DRAWINGS.splice(currentElement, 1)
                redraw_drawings()
				sync_drawings()
                break
            }
        }
	});

	draw_menu.css("position", "fixed");
	draw_menu.css("top", "50px");
	draw_menu.css("width", "90px");
	draw_menu.css('background', "url('/content/1-0-1487-0/skins/waterdeep/images/mon-summary/paper-texture.png')")

	$("body").append(draw_menu);

	draw_button = $("<button style='display:inline;width:75px' id='draw_button' class='drawbutton menu-button hideable ddbc-tab-options__header-heading'><u>D</u>RAW</button>");

	buttons.append(draw_button);
	draw_menu.css("left",draw_button.position().left);
}
function init_walls_menu(buttons){
	wall_menu = $("<div id='wall_menu' class='top_menu'></div>");

	wall_menu.append(
		`<div class='ddbc-tab-options--layout-pill'>
			<button id='draw_line' class='drawbutton menu-option  ddbc-tab-options__header-heading'
				data-shape='line' data-function="wall" data-unique-with="draw">
					Draw Wall
			</button>
		</div>`);
		wall_menu.append(
		`<div class='ddbc-tab-options--layout-pill'>
			<button id='draw_line' class='drawbutton menu-option  ddbc-tab-options__header-heading'
				data-shape='rect' data-function="wall" data-unique-with="draw">
					Rect Wall
			</button>
		</div>`);
		wall_menu.append(
		`<div class='ddbc-tab-options--layout-pill'>
			<button id='draw_line' class='drawbutton menu-option  ddbc-tab-options__header-heading'
				data-shape='3pointRect' data-function="wall" data-unique-with="draw">
					3p Rect
			</button>
		</div>`);
		wall_menu.append(
		`<div class='ddbc-tab-options--layout-pill menu-option data-skip='true''>
			<button id='draw_door' class='drawbutton menu-option  ddbc-tab-options__header-heading'
				data-shape='line' data-function="wall-door" data-unique-with="draw">
				 	Draw Door 
			</button>
		</div>`);
	wall_menu.append(
		`<div class='ddbc-tab-options--layout-pill menu-option data-skip='true''>
			<button id='draw_door_erase' class='drawbutton menu-option  ddbc-tab-options__header-heading'
				data-shape='rect' data-function="wall-door-convert" data-unique-with="draw">
				 	Wall>Door 
			</button>
		</div>`);
	wall_menu.append(
		`<div class='ddbc-tab-options--layout-pill menu-option data-skip='true''>
			<button id='draw_erase' class='drawbutton menu-option  ddbc-tab-options__header-heading'
				data-shape='rect' data-function="wall-eraser-one" data-unique-with="draw">
				 	Erase Line
			</button>
		</div>`);
	wall_menu.append(
		`<div class='ddbc-tab-options--layout-pill menu-option data-skip='true''>
			<button id='draw_erase' class='drawbutton menu-option  ddbc-tab-options__header-heading'
				data-shape='rect' data-function="wall-eraser" data-unique-with="draw">
				 	Erase Area
			</button>
		</div>`);
	wall_menu.append(
		`<div class='ddbc-tab-options--layout-pill' data-skip='true'>
			<button class='ddbc-tab-options__header-heading  menu-option' id='delete_walls'>
				CLEAR
			</button>
		</div>`);

	wall_menu.find("#delete_walls").click(function() {
		r = confirm("DELETE ALL WALLS (cannot be undone!)");
		if (r === true) {
			// keep only non wall
			window.DRAWINGS = window.DRAWINGS.filter(d => d[1] !== "wall");

			redraw_light_walls();
			redraw_light();
			sync_drawings();
		}
	});


	wall_menu.css("position", "fixed");
	wall_menu.css("top", "50px");
	wall_menu.css("width", "90px");
	wall_menu.css('background', "url('/content/1-0-1487-0/skins/waterdeep/images/mon-summary/paper-texture.png')")

	$("body").append(wall_menu);

	wall_button = $("<button style='display:inline;width:75px' id='wall_button' class='drawbutton menu-button hideable ddbc-tab-options__header-heading'><u>W</u>alls</button>");
	wall_button.on('click', function(){
		redraw_light_walls();
	});
	buttons.append(wall_button);
	wall_menu.css("left",wall_button.position().left);
}
function init_vision_menu(buttons){
	vision_menu = $("<div id='vision_menu' class='top_menu'></div>");

	vision_menu.append(
		`<div class='ddbc-tab-options--layout-pill'>
			<button id='vision_settings' class='settings menu-option  ddbc-tab-options__header-heading'
				data-shape='settings' data-function="settings" data-unique-with="settings">
					Settings
			</button>
		</div>`);
	vision_menu.append(`<div class='menu-subtitle'>Light Drawing</div>`);
	vision_menu.append(
		`<div class='ddbc-tab-options--layout-pill'>
			<button id='draw_rect' class='drawbutton menu-option  ddbc-tab-options__header-heading button-enabled ddbc-tab-options__header-heading--is-active'
				data-shape="rect" data-function="draw" data-unique-with="draw">
					Rectangle
			</button>
		</div>`);
	vision_menu.append(
		`<div class='ddbc-tab-options--layout-pill'>
			<button id='draw_rect' class='drawbutton menu-option  ddbc-tab-options__header-heading'
				data-shape="3pointRect" data-function="draw" data-unique-with="draw">
					3p Rect
			</button>
		</div>`);
	vision_menu.append(
		`<div class='ddbc-tab-options--layout-pill'>
			<button id='draw_circle' class='drawbutton menu-option  ddbc-tab-options__header-heading'
				data-shape='arc' data-function="draw" data-unique-with="draw">
					Circle
			</button>
		</div>`);
	vision_menu.append(
		`<div class='ddbc-tab-options--layout-pill'>
			<button id='draw_cone' class='drawbutton menu-option  ddbc-tab-options__header-heading'
				data-shape='cone' data-function="draw" data-unique-with="draw">
					Cone
			</button>
		</div>`);
	vision_menu.append(
		`<div class='ddbc-tab-options--layout-pill'>
			<button id='draw_line' class='drawbutton menu-option  ddbc-tab-options__header-heading'
				data-shape='line' data-function="draw" data-unique-with="draw">
					Line
			</button>
			</div>`);
	vision_menu.append(
		`<div class='ddbc-tab-options--layout-pill'>
			<button id='draw_brush' class='drawbutton menu-option  ddbc-tab-options__header-heading'
				data-shape='brush' data-function="draw" data-unique-with="draw">
					Brush
			</button>
		</div>`);
	vision_menu.append(
		`<div class='ddbc-tab-options--layout-pill'>
			<button id='draw_polygon' class='drawbutton menu-option  ddbc-tab-options__header-heading'
				data-shape='polygon' data-function="draw" data-unique-with="draw">
				 	Polygon
			</button>
		</div>`);
	vision_menu.append(
		`<div class='ddbc-tab-options--layout-pill'>
			<button id='paint-bucket' class='drawbutton menu-option  ddbc-tab-options__header-heading'
				data-shape='paint-bucket' data-function="draw" data-unique-with="draw">
				 	Bucket Fill
			</button>
		</div>`);
	vision_menu.find(`[data-shape='paint-bucket']`).on('click', function(){
		redraw_light_walls();
	});
	vision_menu.append(`
        <input title='Background color' data-required="background_color" class='spectrum'
            id='background_color' name='background color' value='${(!window.DM) ? $('.ddbc-svg--themed path').css('fill') : '#FFF'}'/>
        `)

    let colorPickers = vision_menu.find('input.spectrum');
	colorPickers.spectrum({
		type: "color",
		showInput: true,
		showInitial: true,
		clickoutFiresChange: true
	});

    const colorPickerChange = function(e, tinycolor) {
		let color = `rgba(${tinycolor._r}, ${tinycolor._g}, ${tinycolor._b}, ${tinycolor._a})`;
        $(e.target).val(color)

	};
	vision_menu.find(".sp-replacer").attr("data-skip",'true')
	colorPickers.on('move.spectrum', colorPickerChange);   // update the token as the player messes around with colors
	colorPickers.on('change.spectrum', colorPickerChange); // commit the changes when the user clicks the submit button
	colorPickers.on('hide.spectrum', colorPickerChange);   // the hide event includes the original color so let's change it back when we get it


	vision_menu.append("<div class='menu-subtitle'>Line Width</div>");
	vision_menu.append(`
		<div>
			<input id='draw_line_width' data-required="draw_line_width" type='number' style='width:90%' min='1'
			value='${window.CURRENT_SCENE_DATA.hpps}' class='drawWidthSlider'>
		</div>`
	);


	vision_menu.append(`<div class='menu-subtitle'>Controls</div>`);
	vision_menu.append(
		`<div class='ddbc-tab-options--layout-pill menu-option data-skip='true''>
			<button id='draw_erase' class='drawbutton menu-option  ddbc-tab-options__header-heading'
				data-shape='rect' data-function="eraser" data-unique-with="draw">
				 	Erase
			</button>
		</div>`);

	vision_menu.append(`
	<div class='ddbc-tab-options--layout-pill' data-skip='true'>
		<button class='ddbc-tab-options__header-heading  menu-option' id='draw_undo'>
			UNDO
		</button>
	</div>`);
	vision_menu.append(
	`<div class='ddbc-tab-options--layout-pill' data-skip='true'>
		<button class='ddbc-tab-options__header-heading  menu-option' id='delete_light'>
			CLEAR LIGHT
		</button>
	</div>`);

	vision_menu.find("#vision_settings").click(function() {
		let scene_index = window.ScenesHandler.scenes.findIndex(s => s.id === window.CURRENT_SCENE_DATA.id);
		edit_scene_vision_settings(scene_index);
	})

	vision_menu.find("#delete_light").click(function() {
		r = confirm("DELETE ALL DRAWN LIGHT (cannot be undone!)");
		if (r === true) {
			// keep only text
			window.DRAWINGS = window.DRAWINGS.filter(d => !d[1].includes('light') );
			redraw_drawings()
			sync_drawings()
		}
	});

	vision_menu.find("#draw_undo").click(function() {
		// start at the end
        let currentElement = window.DRAWINGS.length
        // loop from the last element and remove if it's not text
        while (currentElement--) {
            if (!window.DRAWINGS[currentElement][0].includes("text")){
                window.DRAWINGS.splice(currentElement, 1)
                redraw_drawings()
				sync_drawings()
                break
            }
        }
	});

	vision_menu.css("position", "fixed");
	vision_menu.css("top", "50px");
	vision_menu.css("width", "90px");
	vision_menu.css('background', "url('/content/1-0-1487-0/skins/waterdeep/images/mon-summary/paper-texture.png')")

	$("body").append(vision_menu);

	vision_button = $("<button style='display:inline;width:75px' id='vision_button' class='drawbutton menu-button hideable ddbc-tab-options__header-heading'><u>L</u>IGHT/VISION</button>");

	buttons.append(vision_button);
	vision_menu.css("left",vision_button.position().left);
}


// helper functions
let degreeToRadian = function(degree) {
  return (degree / 180) * Math.PI;
};

// vector object
let Vector = function(x,y) {
  this.x = x;
  this.y = y;
};

// static vector object methods
Vector.fromAngle = function(angle, v) {
  if (v === undefined || v === null) {
    v = new Vector();
  }
  v.x = Math.cos(angle);
  v.y = Math.sin(angle);
  return v;
};

Vector.dist = function(v1, v2) {
  let dx = v1.x - v2.x,
      dy = v1.y - v2.y;
  return Math.sqrt(dx * dx + dy * dy);
};

// vector object instance methods
Vector.prototype.mag = function() {
  let x = this.x,
      y = this.y,
      z = this.z;
  return Math.sqrt(x * x + y * y + z * z);
};

Vector.prototype.div = function(v) {
  if (typeof v === 'number') {
    this.x /= v;
    this.y /= v;
    this.z /= v;
  } else {
    this.x /= v.x;
    this.y /= v.y;
    this.z /= v.z;
  }
};

Vector.prototype.normalize = function() {
  let m = this.mag();
  if (m > 0) {
    this.div(m);
  }
};

// boundary object a: vector, b: vector
let Boundary = function(aVec, bVec) {
  this.a = aVec;
  this.b = bVec;
};


// ray object
let Ray = function(pos, angle) {
  this.pos = pos;
  this.dir = Vector.fromAngle(angle);
};

/* test line used to show position a distribution of rays
Ray.prototype.draw = function(ctx) {
  ctx.translate(this.pos.x, this.pos.y);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(this.dir.x * 10, this.dir.y * 10);
  ctx.strokeStyle = "rgba(255, 255, 255, 1)";
  ctx.stroke();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}; */

Ray.prototype.cast = function(boundary) {
  const x1 = boundary.a.x;
  const y1 = boundary.a.y;
  const x2 = boundary.b.x;
  const y2 = boundary.b.y;
  
  const x3 = this.pos.x;
  const y3 = this.pos.y;
  const x4 = this.pos.x + this.dir.x;
  const y4 = this.pos.y + this.dir.y;
  
  const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  // if denominator is zero then the ray and boundary are parallel
  if (den === 0) {
    return;
  }
  
  // numerator divided by denominator
  let t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
  let u = -((x1 -x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;
  
  if (t > 0 && t < 1 && u > 0) {
    const pt = new Vector();
    pt.x = x1 + t * (x2 - x1);
    pt.y = y1 + t * (y2 - y1);
    return pt;
  } else {
    return;
  }
};

// particle object
function initParticle(pos, divisor) {
	if(window.walls == undefined)
		return;
	window.PARTICLE = {};
	window.PARTICLE.pos = pos;
	window.PARTICLE.rays = [];
	window.PARTICLE.divisor =  divisor || 40; // the degree of approximation
	for (let a = 0; a < 360; a += window.PARTICLE.divisor) {
    	window.PARTICLE.rays.push(new Ray(window.PARTICLE.pos, degreeToRadian(a)));
	}
};

function particleUpdate(x, y) {
	window.PARTICLE.pos.x = x;
	window.PARTICLE.pos.y = y;
};

function particleLook(ctx, walls, lightRadius=100000, fog=false, fogStyle, fogType=0, draw=true, islight=false) {
	lightPolygon = [{x: window.PARTICLE.pos.x*window.CURRENT_SCENE_DATA.scale_factor, y: window.PARTICLE.pos.y*window.CURRENT_SCENE_DATA.scale_factor}];
	let prevClosestWall = null;
    let prevClosestPoint = null;
    let closestWall = null;
	for (let i = 0; i < window.PARTICLE.rays.length; i++) {
	    
	    let pt;
	    let closest = null;
	    let record = Infinity;

	    for (let j = 0; j < walls.length; j++) {
	    
	      pt = window.PARTICLE.rays[i].cast(walls[j]);
	      
	      if (pt) {
	        const dist = (Vector.dist(window.PARTICLE.pos, pt) < lightRadius) ? Vector.dist(window.PARTICLE.pos, pt) : lightRadius;
	        if (dist < record) {
	          record = dist;
	          if(dist == lightRadius){
	          	pt = {
		          	x: window.PARTICLE.pos.x+window.PARTICLE.rays[i].dir.x * lightRadius,
		          	y: window.PARTICLE.pos.y+window.PARTICLE.rays[i].dir.y * lightRadius
		          }
	          }
	          closest=pt;
	          if(dist != lightRadius){
	          	closestWall = walls[j]
	          }
	          
	        }

	      }
	    }	    
	    if (closest && closestWall != prevClosestWall) {
	    	if(prevClosestPoint){
	    		 lightPolygon.push({x: prevClosestPoint.x*window.CURRENT_SCENE_DATA.scale_factor, y: prevClosestPoint.y*window.CURRENT_SCENE_DATA.scale_factor})
	    	}
	    	lightPolygon.push({x: closest.x*window.CURRENT_SCENE_DATA.scale_factor, y: closest.y*window.CURRENT_SCENE_DATA.scale_factor})
	    } 

	    prevClosestPoint = closest;
	    prevClosestWall = closestWall;
	}
	if(lightPolygon[1] != undefined)
  		lightPolygon.push(lightPolygon[1]);
  	if(draw == true){
		if(!fog){
			  drawPolygon(ctx, lightPolygon, 'rgba(255, 255, 255, 1)', true);
		}
		else{	
			if(fogType == 0){
				clearPolygon(ctx, lightPolygon);
			}
			else{
				if(!islight){
					clearPolygon(ctx, lightPolygon, undefined, true);
					drawPolygon(ctx, lightPolygon, fogStyle, undefined, undefined, undefined, undefined, undefined, true);
				}
				drawPolygon(ctx, lightPolygon, fogStyle, undefined, undefined, undefined, undefined, undefined, undefined, true);
			}
		}
	}
  
};

function rectLineIntersection(x1, y1, x2, y2, rectx, rexty, rectw, recth) {

	let left = lineLine(x1, y1, x2, y2, rectx, rexty, rectx, rexty+recth);
	let right = lineLine(x1, y1, x2, y2, rectx+rectw, rexty, rectx+rectw, rexty+recth);
	

	let top = lineLine(x1, y1, x2, y2, rectx, rexty, rectx+rectw, rexty);
	let bottom = lineLine(x1, y1, x2, y2, rectx, rexty+recth, rectx+rectw, rexty+recth);

	return{
		left: left,
		right: right,
		top: top,
		bottom: bottom
	}

}
function lineLine(x1, y1, x2, y2, x3, y3, x4, y4) {

  // calculate the direction of the lines
  let uA = ((x4-x3)*(y1-y3) - (y4-y3)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1));
  let uB = ((x2-x1)*(y1-y3) - (y2-y1)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1));

  // if uA and uB are between 0-1, lines are colliding
  if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {

    // optionally, draw a circle where the lines meet
    let intersectionX = x1 + (uA * (x2-x1));
    let intersectionY = y1 + (uA * (y2-y1));

    return {x: intersectionX, y: intersectionY};
  }
  return false;
}

//Checks if a pixel is in line of current line of sight
function detectInLos(x, y) {
	let canvas = document.getElementById("raycastingCanvas");
	let ctx = canvas.getContext("2d", { willReadFrequently: true });
	const pixeldata = ctx.getImageData(x/window.CURRENT_SCENE_DATA.scale_factor, y/window.CURRENT_SCENE_DATA.scale_factor, 1, 1).data;
	if (pixeldata[2] == 0)
	{	
		return false;			
	}
	else{
		return true;
	}
}

async function redraw_light(){
	redraw_drawings();
	let canvas = document.getElementById("raycastingCanvas");
	let canvasWidth = canvas.width;
	let canvasHeight = canvas.height;

	if(canvasWidth == 0 || canvasHeight == 0){
		console.warn("Draw light attempted before map load");
		return; // prevent error if redraw is called before map initialized
	}

	if(window.PARTICLE == undefined){
		initParticle(new Vector(200, 200), 1);
	}

	let context = canvas.getContext("2d");
	
	let offscreenCanvasMask = document.createElement('canvas');
	let offscreenContext = offscreenCanvasMask.getContext('2d', {willReadFrequently: true});

	offscreenCanvasMask.width = canvasWidth;
	offscreenCanvasMask.height = canvasHeight;


	if(window.CURRENT_SCENE_DATA.disableSceneVision == true){
		context.fillStyle = "white";
		context.fillRect(0,0,canvasWidth,canvasHeight);
		return;
	}

	offscreenContext.fillStyle = "black";
	offscreenContext.fillRect(0,0,canvasWidth,canvasHeight);


	let light_auras = $(`.aura-element.islight:not([style*='visibility: hidden'])`)
	let selectedIds = [];
	let selectedTokens = $('.tokenselected');
	if(selectedTokens.length>0){
		if(window.SelectedTokenVision){
			if(window.CURRENT_SCENE_DATA.darkness_filter > 0){
				$('#VTT').css('--darkness-filter', `0%`)
			}
	  		$('#raycastingCanvas').css('opacity', '1');
	  		
		 	$('#light_container').css({
	 			'opacity': '1'
	 		});

		 	
	  	}
	  	
	  
	  	
  		
		for(let j = 0; j < selectedTokens.length; j++){
		  	let tokenId = $(selectedTokens[j]).attr('data-id');
			if(tokenId.includes(window.PLAYER_ID) || window.DM || window.TOKEN_OBJECTS[tokenId].options.share_vision == true)
		  		selectedIds.push(tokenId)
		}	  	
	}
	else {
  		if(!parseInt(window.CURRENT_SCENE_DATA.darkness_filter) && window.walls.length>4){
		 	$('#light_container').css({
	 			'opacity': '0.3'
		 	});
		 	 
	  	}
	  	else{
	  		$('#light_container').css({
	 			'opacity': ''
	 		});
  		}
  	}


	let promises = []
	let adjustScale = (window.CURRENT_SCENE_DATA.scale_factor != undefined) ? window.CURRENT_SCENE_DATA.scale_factor : 1;
	let playerTokenId = $(`.token[data-id*='${window.PLAYER_ID}']`).attr("data-id");

	for(let i = 0; i < light_auras.length; i++){
		promises.push(new Promise((resolve) => {
			let currentLightAura = $(light_auras[i]);
			let auraId = currentLightAura.attr('data-id');

			found = selectedIds.some(r=> r == auraId);

			let tokenPos = {
				x: (parseInt(currentLightAura.css('left'))+(parseInt(currentLightAura.css('width'))/2)),
				y: (parseInt(currentLightAura.css('top'))+(parseInt(currentLightAura.css('height'))/2))
			}
			
			if(window.lineOfSightPolygons == undefined){
				window.lineOfSightPolygons = {};
			}
			if(window.lineOfSightPolygons[auraId]?.x == tokenPos.x && 
				window.lineOfSightPolygons[auraId]?.y == tokenPos.y && 
				window.lineOfSightPolygons[auraId]?.numberofwalls == walls.length){
				lightPolygon = window.lineOfSightPolygons[auraId].polygon;  // if the token hasn't moved and walls haven't changed don't look for a new poly.
			}
			else{
				particleUpdate(tokenPos.x, tokenPos.y); // moves particle
				particleLook(context, walls, 100000, undefined, undefined, undefined, false);  // if the token has moved or walls have changed look for a new vision poly. This function takes a lot of processing time - so keeping this limited is prefered.
				window.lineOfSightPolygons[auraId] = {
					polygon: lightPolygon,
					x: tokenPos.x,
					y: tokenPos.y,
					numberofwalls: walls.length
				}

				let path = "";
				for( let i = 0; i < lightPolygon.length; i++ ){
					path += (i && "L" || "M") + lightPolygon[i].x/adjustScale+','+lightPolygon[i].y/adjustScale
				}
				$(`.aura-element-container-clip[id='${auraId}']`).css('clip-path', `path('${path}')`)
			}


			if(window.lightAuraClipPolygon == undefined)
				window.lightAuraClipPolygon = {};
				

			let tokenVisionAura = $(`.aura-element-container-clip[id='${auraId}'] [id*='vision_']`);

			if(window.SelectedTokenVision){
				tokenVisionAura.css('visibility', 'hidden');
			}
			else if(window.DM && !window.SelectedTokenVision){
				tokenVisionAura.css('visibility', 'visible'); 
			}

			clipped_light(auraId, lightPolygon, playerTokenId);
			
			if(selectedIds.length == 0 || found || !window.SelectedTokenVision){	
				
				let hideVisionWhenNoPlayerToken = (playerTokenId == undefined && window.TOKEN_OBJECTS[auraId].options.share_vision != true && !window.DM && window.TOKEN_OBJECTS[auraId].options.itemType != 'pc')
				if(hideVisionWhenNoPlayerToken) //when player token does not exist show vision for all pc tokens and shared vision for other tokens. Mostly used by DM's, streams and tabletop tv games.			
					return resolve();//we don't want to draw this tokens vision no need for further checks - go next token.
				
				let hideVisionWhenPlayerTokenExists = (!auraId.includes(window.PLAYER_ID) && !window.DM && window.TOKEN_OBJECTS[auraId].options.share_vision != true && playerTokenId != undefined)
				if(hideVisionWhenPlayerTokenExists)	//when player token does exist show your own vision and shared vision.
					return resolve(); //we don't want to draw this tokens vision - go next token.

				tokenVisionAura.css('visibility', 'visible'); 		
				drawPolygon(offscreenContext, lightPolygon, 'rgba(255, 255, 255, 1)', true); //draw to offscreen canvas so we don't have to render every draw and use this for a mask
			}
			resolve();
		})); 	
	}
	await Promise.all(promises);
	context.drawImage(offscreenCanvasMask, 0, 0); // draw to visible canvas only once so we render this once
}


function clipped_light(auraId, maskPolygon, playerTokenId){
	//this saves clipped light offscreen canvas' to a window object so we can check them later to see what tokens are visible to the players
	if(window.DM)
		return;
	
	let lightRadius =(parseInt(window.TOKEN_OBJECTS[auraId].options.light1.feet)+parseInt(window.TOKEN_OBJECTS[auraId].options.light2.feet))*window.CURRENT_SCENE_DATA.hpps/window.CURRENT_SCENE_DATA.fpsq 
	let darkvisionRadius = parseInt(window.TOKEN_OBJECTS[auraId].options.vision.feet)*window.CURRENT_SCENE_DATA.hpps/window.CURRENT_SCENE_DATA.fpsq 
	let circleRadius = (lightRadius > darkvisionRadius) ? lightRadius : (window.TOKEN_OBJECTS[auraId].options.share_vision || auraId.includes(window.PLAYER_ID) || (window.TOKEN_OBJECTS[auraId].options.itemType == 'pc' && playerTokenId == undefined)) ? darkvisionRadius : (lightRadius > 0) ? lightRadius : 0;
	let horizontalTokenMiddle = (parseInt(window.TOKEN_OBJECTS[auraId].options.left.replace('px', '')) + (window.TOKEN_OBJECTS[auraId].options.size / 2));
	let verticalTokenMiddle = (parseInt(window.TOKEN_OBJECTS[auraId].options.top.replace('px', '')) + (window.TOKEN_OBJECTS[auraId].options.size / 2));
	if(window.lightAuraClipPolygon[auraId] != undefined){
		if(circleRadius == 0){
			delete window.lightAuraClipPolygon[auraId];
			return; // remove 0 range light and return
		}
		if(window.lightAuraClipPolygon[auraId].light == lightRadius && window.lightAuraClipPolygon[auraId].darkvision == darkvisionRadius && window.lightAuraClipPolygon[auraId].middle.x == horizontalTokenMiddle && window.lightAuraClipPolygon[auraId].middle.y == verticalTokenMiddle)
			return; // token settings and position have not changed - a lot of light will be stationary do not redraw checker canvas
	}
	else if(circleRadius == 0){
		return; // don't make an object for 0 range light
	}
	let lightCanvas = document.createElement('canvas');
	let lightAuraClipPolygonCtx = lightCanvas.getContext('2d');
	lightCanvas.width = $("#raycastingCanvas").width();
	lightCanvas.height =  $("#raycastingCanvas").height();

	lightAuraClipPolygonCtx.globalCompositeOperation='source-over';
	drawPolygon(lightAuraClipPolygonCtx, maskPolygon, 'rgba(255, 255, 255, 1)', true);

	lightAuraClipPolygonCtx.globalCompositeOperation='source-in';

	drawCircle(lightAuraClipPolygonCtx, horizontalTokenMiddle, verticalTokenMiddle, circleRadius, 'rgba(255, 255, 255, 1)', true, 0)
	

	window.lightAuraClipPolygon[auraId] = {
		canvas: lightCanvas,
		light: lightRadius,
		darkvision: darkvisionRadius,
		middle: {
			x: horizontalTokenMiddle,
			y: verticalTokenMiddle
		} 
	}
}




