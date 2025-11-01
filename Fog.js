const POLYGON_CLOSE_DISTANCE = 15;
const doorColors = {
	0: {
		'open': "rgba(255, 100, 255, 0.5)", // door
		'closed': "rgba(255, 100, 255, 1)"
	},
	1: {
		'open': "rgba(255, 255, 0, 0.5)", // window
		'closed': "rgba(255, 255, 0, 1)"
	},
	2: {
		'open': "rgba(150, 50, 150, 0.5)", // locked door
		'closed': "rgba(150, 50, 150, 1)"
	},
	3: {
		'open': "rgba(150, 150, 0, 0.5)", // locked window
		'closed': "rgba(150, 150, 0, 1)"
	},
	4: {
		'open': "rgba(100, 0, 255, 0.5)", //secret door
		'closed': "rgba(100, 0, 255, 1)"
	},
	5: {
		'open': "rgba(50, 0, 180, 0.5)", // secret locked door
		'closed': "rgba(50, 0, 180, 1)"
	},
	6: {
		'open': "rgba(50, 255, 255, 0.5)", // secret window
		'closed': "rgba(50, 255, 255, 1)"
	},
	7: {
		'open': "rgba(50, 180, 180, 0.5)", // secret locked window
		'closed': "rgba(50, 180, 180, 1)"
	},
	8: {
		'open': "rgba(255, 150, 0, 0.5)", // curtain
		'closed': "rgba(255, 150, 0, 1)"
	},
	9: {
		'open': "rgba(150, 100, 0, 0.5)", // locked curtain
		'closed': "rgba(150, 100, 0, 1)"
	},
	10: {
		'open': "rgba(180, 0, 0, 0.5)", // secret curtain
		'closed': "rgba(180, 0, 0, 1)"
	},
	11: {
		'open': "rgba(100, 25, 0, 0.5)", // secret locked curtain
		'closed': "rgba(100, 25, 0, 1)"
	},
	12: {
		'open': "rgba(25, 25, 180, 0.5)", // portal
		'closed': "rgba(25, 25, 180, 1)"
	},	
	13: {
		'open': "rgba(10, 10, 50, 0.5)", // secret portal
		'closed': "rgba(10, 10, 50, 1)"
	},
};
var doorColorsArray = [];

for(let i in doorColors){
	for(let j in doorColors[i]){
		doorColorsArray.push(doorColors[i][j])
	}
}
function sync_fog(){
	window.MB.sendMessage("custom/myVTT/fogdata",window.REVEALED);
}

function sync_drawings(newDraw = true){

	if(!window.DM && newDraw == true){
		if(window.playerDrawUndo == undefined)
			window.playerDrawUndo = [];
		window.playerDrawUndo.push(window.DRAWINGS[window.DRAWINGS.length-1]);
	}
	
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
* @returns {{sceneHeight: number, sceneWidth: number}}
*/
function getSceneMapSize() {
	if(window.CURRENT_SCENE_DATA?.width === undefined)
		return {sceneWidth: 0, sceneHeight: 0}
	return {sceneWidth: window.CURRENT_SCENE_DATA.width, sceneHeight: window.CURRENT_SCENE_DATA.height }
}
/**
 * Class to manage measure waypoints
 */
class WaypointManagerClass {

	constructor(){
		this.canvas=undefined;
		this.ctx=undefined;
		this.numWaypoints = 0;
		
		/**
		* @type {{startX: number, startY: number, endX: number, endY: number, distance: number}[]}
		*/
		this.coords = [];
		this.currentWaypointIndex = 0;
		this.mouseDownCoords = { mousex: undefined, mousey: undefined };
		this.timeout = undefined;
		/**
		* @type {number | undefined}
		*/
		this.fadeoutAnimationId = undefined;
		this.drawStyle = {
			lineWidth: Math.max(25 * Math.max((1 - window.ZOOM), 0), 5),
			color: window.color ? window.color : "#f2f2f2",
			outlineColor: "black",
			textColor: "black",
			backgroundColor: "rgba(255, 255, 255, 0.7)"
		}
		this.playerId = window.PLAYER_ID;
		this.throttleDraw = throttle((callback) => {requestAnimationFrame(callback)}, 1000/240);
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

	/**
	* Draw a nice circle
	* @param x {number}
	* @param y {number}
	* @returns {string} <circle> tag
	*/
	makeBobble(x, y) {
		/*
		this.ctx.beginPath();
		this.ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
		this.ctx.lineWidth = radius
		this.ctx.strokeStyle = this.drawStyle.outlineColor
		this.ctx.stroke();
		this.ctx.fillStyle =  this.drawStyle.color
		this.ctx.fill();
		*/
	    return `<circle cx='${x}' cy='${y}' fill='${this.drawStyle.color}' stroke='${this.drawStyle.outlineColor}' />`;
	}

	// Increment the current index into the array of waypoints, and draw a small indicator
	checkNewWaypoint(mousex, mousey) {
			//console.log("Incrementing waypoint");
			this.currentWaypointIndex++;

			// Draw an indicator for cosmetic niceness
			//let snapCoords = this.getSnapPointCoords(mousex, mousey);
			//this.drawBobble(snapCoords.x, snapCoords.y, Math.max(15 * Math.max((1 - window.ZOOM), 0)/window.CURRENT_SCENE_DATA.scale_factor, 3));
	}

	// Track mouse moving
	registerMouseMove(mousex, mousey) {

		this.mouseDownCoords.mousex = mousex;
		this.mouseDownCoords.mousey = mousey;
	}

	// On mouse up, clear out the waypoints
	clearWaypoints(cancelFadeout=true) {
		this.numWaypoints = 0;
		this.coords = [];
		this.currentWaypointIndex = 0;
		this.mouseDownCoords = { mousex: undefined, mousey: undefined };
		if(cancelFadeout)
			this.cancelFadeout();
	}

	// Helper function to convert mouse coordinates to 'snap' or 'centre of current grid cell' coordinates
	getSnapPointCoords(x, y) {
		if (!$('#ruler_menu').hasClass('button-enabled')) {
			// only snap if the ruler tool is selected.
			// The select tool manages the snapping based on ctrl key, scene settings, etc. so let it do it's thing
			return { x: x, y: y };
		}

		x -= window.CURRENT_SCENE_DATA.offsetx;
		y -= window.CURRENT_SCENE_DATA.offsety;

		let gridSize = window.CURRENT_SCENE_DATA.hpps/window.CURRENT_SCENE_DATA.scale_factor;
		let currGridX = Math.floor(x / gridSize);
		let currGridY = Math.floor(y / gridSize);
		let snapPointXStart = (currGridX * gridSize) + (gridSize/2);
		let snapPointYStart = (currGridY * gridSize);

		// Add in scene offset
		snapPointXStart += window.window.CURRENT_SCENE_DATA.offsetx/window.CURRENT_SCENE_DATA.scale_factor;
		snapPointYStart += window.window.CURRENT_SCENE_DATA.offsety/window.CURRENT_SCENE_DATA.scale_factor;

		return { x: snapPointXStart, y: snapPointYStart }
	}

	/**
	* Find ruler container for this player or create it
	* @param playerId {string | boolean}
	*/
	getOrCreateDrawingContainer(playerId) {
		playerId = `${playerId}`;
		const rulerContainerId = `ruler-container-${playerId.replace(' ','')}`;

		let rulerContainer = document.getElementById(rulerContainerId)
		if (!rulerContainer) {
			const rulerContainerDiv = document.createElement("div");
			rulerContainerDiv.id = rulerContainerId;
			document.getElementById("VTT").append(rulerContainerDiv);

			// re-query to get created element
			rulerContainer = document.getElementById(rulerContainerId);
		}
		return rulerContainer;
	}

	/**
	* Empties ruler container for this player
	* @param playerId
	*/
	clearWaypointDrawings(playerId) {
		let rulerContainer = this.getOrCreateDrawingContainer(playerId)
		if (!rulerContainer) {
			// it's empty then
			return;
		}

		rulerContainer.innerHTML = "";
		if (window.PEER_TOKEN_DRAGGING != undefined && window.PEER_TOKEN_DRAGGING[playerId]) {
	        const html = window.PEER_TOKEN_DRAGGING[playerId];
	        delete window.PEER_TOKEN_DRAGGING[playerId];
	        $(html).remove();
      	}
	}



	/**
	* Draw the waypoints, note that we sum up the cumulative distance
	* @param labelX {number | undefined} if provided, move last text of last waypoint there
	* @param labelY {number | undefined} if provided, move last text of last waypoint there
	* @param alpha {number | undefined} set alpha of drawings to this, 1 if unset
	* @param playerId {string | false | undefined} `window.PLAYER_ID` if unset
	*/
	draw(labelX = undefined, labelY = undefined, alpha = 1, playerId=window.PLAYER_ID) {
		const sceneMapSize = getSceneMapSize();

		let cumulativeDistance = 0;
		this.numberOfDiagonals = 0;
		let elementsToDraw = "";
		const [sceneWidth, sceneHeight] = [sceneMapSize.sceneWidth, sceneMapSize.sceneHeight];
		const bobbles = $(`<svg viewbox='0 0 ${sceneWidth} ${sceneHeight}' width='${sceneWidth}' height='${sceneHeight}' class='ruler-svg-bobbles' style='top:0px; left:0px;'></svg>`);
		const lines = $(`<svg viewbox='0 0 ${sceneWidth} ${sceneHeight}' width='${sceneWidth}' height='${sceneHeight}' class='ruler-svg-line' style='top:0px; left:0px;'></svg>`);

		
		for (let i = 0; i < this.coords.length; i++) {
			
			if (i < this.coords.length - 1) {
				elementsToDraw += this.makeWaypointSegment(this.coords[i], cumulativeDistance, undefined, undefined, sceneMapSize, bobbles, lines);
			} else {
				elementsToDraw += this.makeWaypointSegment(this.coords[i], cumulativeDistance, labelX, labelY, sceneMapSize, bobbles, lines);
			}

			cumulativeDistance += this.coords[i].distance
		}
		elementsToDraw = `${lines[0].outerHTML}${elementsToDraw}${bobbles[0].outerHTML}`

	
		const rulerContainer = this.getOrCreateDrawingContainer(playerId);
		const self = this;
		this.throttleDraw(function(){
			// update alpha for the entire container
			if(alpha>0){
				rulerContainer.style.setProperty("--svg-text-alpha", alpha.toString());
				rulerContainer.innerHTML = elementsToDraw;	
			}
			else{
				self.clearWaypointDrawings(playerId);
			}
		})
	}

	/**
	* Make a waypoint segment SVGs with all the lines and labels etc.
	* @param coord {{startX: number, startY: number, endX: number, endY: number, distance: number}}
	* @param cumulativeDistance {number}
	* @param labelX {number}
	* @param labelY {number}
	* @param sceneMapSize {{sceneHeight: number, sceneWidth: number}}
	* @returns {string} SVG elements for waypoint line and label
	*/
	makeWaypointSegment(coord, cumulativeDistance, labelX, labelY, sceneMapSize, bobbles, lines) {
		// Snap to centre of current grid square
		let gridSize =  window.CURRENT_SCENE_DATA.hpps/window.CURRENT_SCENE_DATA.scale_factor;
		let snapPointXStart = coord.startX;
		let snapPointYStart = coord.startY;
	

		let snapPointXEnd = coord.endX;
		let snapPointYEnd = coord.endY;
		let unitSymbol;
		// Pull the scene data for units, unless it doesn't exist (i.e. older maps)
		if (typeof window.CURRENT_SCENE_DATA.upsq !== "undefined")
			unitSymbol = window.CURRENT_SCENE_DATA.upsq;
		else
			unitSymbol = 'ft'

		// Calculate the distance and set into the waypoint object
		const xAdjustment = window.CURRENT_SCENE_DATA.scaleAdjustment?.x != undefined ? window.CURRENT_SCENE_DATA.scaleAdjustment.x : 1;
		const yAdjustment = window.CURRENT_SCENE_DATA.scaleAdjustment?.y != undefined ? window.CURRENT_SCENE_DATA.scaleAdjustment.y : 1;
		const xLength = Math.abs(snapPointXStart - snapPointXEnd)/xAdjustment;
		const yLength = Math.abs(snapPointYStart - snapPointYEnd)/yAdjustment;
		let distance = Math.max(xLength, yLength);
		const rulerType = $('#ruler_menu .button-enabled').attr('data-type');
		if(window.CURRENT_SCENE_DATA.gridType != undefined){
			if((xLength > yLength && window.CURRENT_SCENE_DATA.gridType != 1 && rulerType != 'euclidean') || (window.CURRENT_SCENE_DATA.gridType == 2 && rulerType == 'euclidean')){
				gridSize = window.hexGridSize.width/window.CURRENT_SCENE_DATA.scale_factor;
			} else if((xLength < yLength && window.CURRENT_SCENE_DATA.gridType != 1 && rulerType != 'euclidean' )|| (window.CURRENT_SCENE_DATA.gridType == 3 && rulerType == 'euclidean')){
				gridSize = window.hexGridSize.height/window.CURRENT_SCENE_DATA.scale_factor;
			}
		}
		
		

		const eucDistance = Math.sqrt(xLength*xLength+yLength*yLength)/gridSize * window.CURRENT_SCENE_DATA.fpsq;
		distance = Math.round(distance / gridSize);

		let addedDistance = 0;
		
		if(rulerType == "fiveten" ){		
        	const dx = Math.round(xLength / gridSize);
       		const dy = Math.round(yLength / gridSize);
       		//The below keeps the even/odd count for number of diagonals based on last waypoint position and sets addedDistance to the number of extra squares depending on the starting pattern.
       		//If the last waypoint ended on even it follows the 1,2,1 squares pattern. If the last waypoint ended on odd it follows the 2,1,2 squares pattern for the next diagonal segments.

			this.numberOfDiagonals = this.numberOfDiagonals%2 == 0 ? Math.min(dx, dy) : Math.min(dx, dy)+1;
			addedDistance = Math.floor(this.numberOfDiagonals/2);
		}

		distance = (rulerType == 'euclidean') ? eucDistance : (distance+addedDistance) * window.CURRENT_SCENE_DATA.fpsq;
		
	
		
		

		coord.distance = distance;

		let textX = 0;
		let textY = 0;
		let margin = 2;
		let heightOffset = 30;
		let slopeModifier = 0;

		// Setup text metrics
		let fontSize = Math.max(75 * Math.max((1 - window.ZOOM), 0)/window.CURRENT_SCENE_DATA.scale_factor, 26)
		const totalDistance = Number.isInteger(distance + cumulativeDistance)
			? (distance + cumulativeDistance)
			: (distance + cumulativeDistance).toFixed(1)
		let text = `${totalDistance}${unitSymbol}`
		let textMetrics = this.ctx.measureText(text);

		let contrastRect = { x: 0, y: 0, width: 0, height: 0 }
		let textRect = { x: 0, y: 0, width: 0, height: 0 }

		if (labelX !== undefined && labelY !== undefined) {
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
			
			slopeModifier = margin;
		

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


		/*
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
	    
		/*this.ctx.strokeStyle = this.drawStyle.outlineColor
		this.ctx.fillStyle = this.drawStyle.backgroundColor
		this.ctx.lineWidth = Math.floor(Math.max(15 * Math.max((1 - window.ZOOM), 0)/window.CURRENT_SCENE_DATA.scale_factor, 3));
		roundRect(this.ctx, Math.floor(textRect.x), Math.floor(textRect.y), Math.floor(textRect.width), Math.floor(textRect.height), 10, true);
		// draw the outline of the text box
		roundRect(this.ctx, Math.floor(textRect.x), Math.floor(textRect.y), Math.floor(textRect.width), Math.floor(textRect.height), 10, false, true);

		// Finally draw our text
		this.ctx.fillStyle = this.drawStyle.textColor
		this.ctx.textBaseline = 'top';
		this.ctx.fillText(text, textX, textY);*/

		const { sceneWidth, sceneHeight } = sceneMapSize;

		// add ruler line and text

		const rulerLineSVG = `
			<line x1='${snapPointXStart}' y1='${snapPointYStart}' x2='${snapPointXEnd}' y2='${snapPointYEnd}' stroke="${this.drawStyle.outlineColor}"></line>
			<line x1='${snapPointXStart}' y1='${snapPointYStart}' x2='${snapPointXEnd}' y2='${snapPointYEnd}' stroke="${this.drawStyle.color}"></line>
		`;
		lines.append(rulerLineSVG);

		
		if(bobbles.children().length == 0){
			const startBobble = this.makeBobble(snapPointXStart, snapPointYStart);
			const endBobble = this.makeBobble(snapPointXEnd, snapPointYEnd)
			bobbles.append(startBobble, endBobble);
		}
		else{
			const endBobble = this.makeBobble(snapPointXEnd, snapPointYEnd)
			bobbles.append(endBobble);
		}

		const textSVG = `
			<svg class='ruler-svg-text' style='top:${textY*window.CURRENT_SCENE_DATA.scale_factor}px; left:${textX*window.CURRENT_SCENE_DATA.scale_factor}px; width:${textRect.width}px;'>
				<text x="1" y="11">
					${text}
				</text>
			</svg>
		`;
	
		return `${textSVG}`;
	}

	/**
	 * redraws the waypoints using various levels of opacity until completely clear
	 * then removes all waypoints and resets canvas opacity
	 */
	fadeoutMeasuring(playerID){
		let alpha = 1.0
		const self = this

		// only ever allow a single fadeout to occur
		if (self.fadeoutAnimationId) {
			self.cancelFadeout(true);
		}

		let prevFrameTime= undefined;
		let deltaTime = 0;
		/**
		* This is a function expression to make sure `this` is available.
		* @type {FrameRequestCallback}
		*/
		const fadeout = (time) =>{
			if (prevFrameTime === undefined) {
				deltaTime = 0;
			} else {
				deltaTime = time - prevFrameTime;
			}
			prevFrameTime = time;


			this.throttleDraw(function(){
				self.draw(undefined, undefined, alpha, playerID)
				if (window.PEER_TOKEN_DRAGGING != undefined && window.PEER_TOKEN_DRAGGING[self.playerId]) {
			        const html = window.PEER_TOKEN_DRAGGING[self.playerId];
			        $(html).css('opacity', 0.5 * alpha);
		      	}
			})
			
			alpha = alpha - (0.08 * deltaTime / 100); // 0.08 per 100 ms
			if (alpha <= 0.0 || this.fadeoutAnimationId == undefined) {
				self.clearWaypoints();
				self.throttleDraw(function(){
					self.clearWaypointDrawings(self.playerId)
				})
				return;
			}

			self.fadeoutAnimationId = requestAnimationFrame(fadeout)
		};

		self.fadeoutAnimationId = requestAnimationFrame(fadeout);
	}

	/**
	 *
	 */
	cancelFadeout(dontClearCanvas=false){
		cancelAnimationFrame(this.fadeoutAnimationId);
		this.fadeoutAnimationId = undefined	
		const self = this
		if(!dontClearCanvas){
			self.throttleDraw(function(){
				self.clearWaypointDrawings(self.playerId)
			})
		}

	}
};


function is_token_under_fog(tokenid, fogContext=undefined){
	if((window.DM && !window.SelectedTokenVision) || window.TOKEN_OBJECTS[tokenid].options.revealInFog)
		return false;
	if(fogContext == undefined){
		fogContext = $('#fog_overlay')[0].getContext('2d');
	}
	let left = (parseInt(window.TOKEN_OBJECTS[tokenid].options.left) + (window.TOKEN_OBJECTS[tokenid].options.size / 2)) / window.CURRENT_SCENE_DATA.scale_factor;
	let top = (parseInt(window.TOKEN_OBJECTS[tokenid].options.top) + (window.TOKEN_OBJECTS[tokenid].options.size / 2)) / window.CURRENT_SCENE_DATA.scale_factor;
	let pixeldata = fogContext.getImageData(left, top, 1, 1).data;

	if (pixeldata[3] >= 100)
		return true;
	else
		return false;
}

function in_fog_or_dark_image_data(tokenid, imageData) {
	if (imageData == undefined) {
		return false;
	}

	const centerX = (window.TOKEN_OBJECTS[tokenid].options.left.replace('px', '') / window.CURRENT_SCENE_DATA.scale_factor) + (window.TOKEN_OBJECTS[tokenid].sizeWidth() / 2 / window.CURRENT_SCENE_DATA.scale_factor)
	const centerY = (window.TOKEN_OBJECTS[tokenid].options.top.replace('px', '') / window.CURRENT_SCENE_DATA.scale_factor) + (window.TOKEN_OBJECTS[tokenid].sizeHeight() / 2 / window.CURRENT_SCENE_DATA.scale_factor)
	let pixeldata = getPixelFromImageData(imageData, centerX, centerY);

	for (let i = 0; i < pixeldata.length; i += 4) {
		if (pixeldata[i] > 4 || pixeldata[i + 1] > 4 || pixeldata[i + 2] > 4) {
			return true;
		}
	}

	return false;
}

function is_token_in_raycasting_context(tokenid, rayContext=undefined){
	if(rayContext == undefined){
		rayContext = $("#raycastingCanvas")[0].getContext('2d');
	}
	const centerX = (window.TOKEN_OBJECTS[tokenid].options.left.replace('px', '') / window.CURRENT_SCENE_DATA.scale_factor) + (window.TOKEN_OBJECTS[tokenid].sizeWidth() / 2 / window.CURRENT_SCENE_DATA.scale_factor)
	const centerY = (window.TOKEN_OBJECTS[tokenid].options.top.replace('px', '') / window.CURRENT_SCENE_DATA.scale_factor) + (window.TOKEN_OBJECTS[tokenid].sizeHeight() / 2 / window.CURRENT_SCENE_DATA.scale_factor)
	let pixeldata = rayContext.getImageData(centerX, centerY, 1, 1).data;
	
	for(let i=0; i<pixeldata.length; i+=4){
		if(pixeldata[i]>4 || pixeldata[i+1]>4 || pixeldata[i+2]>4){
			return true;
		}
	}
				
	return  false;
}

function is_token_in_aoe_context(tokenid, aoeContext=undefined){
	if(aoeContext == undefined)
		return;
	
	let gridSquares = window.TOKEN_OBJECTS[tokenid].options.gridSquares;

	if(gridSquares != undefined){
		gridSquares = Math.max(Math.round(gridSquares), 1);
		let centerSquareLeft = (parseInt(window.TOKEN_OBJECTS[tokenid].options.left)/ window.CURRENT_SCENE_DATA.scale_factor) + window.CURRENT_SCENE_DATA.hpps/2/window.CURRENT_SCENE_DATA.scale_factor;
		let centerSquareTop = (parseInt(window.TOKEN_OBJECTS[tokenid].options.top)/ window.CURRENT_SCENE_DATA.scale_factor) + window.CURRENT_SCENE_DATA.vpps/2/window.CURRENT_SCENE_DATA.scale_factor;
		let pixeldata = aoeContext.getImageData(centerSquareLeft - 2, centerSquareTop -2, 4, 4).data;

		for(let x = 0; x<=gridSquares-1; x++){
			let left = centerSquareLeft + (window.CURRENT_SCENE_DATA.hpps/window.CURRENT_SCENE_DATA.scale_factor)*x;
			for(let y = 0; y<=gridSquares-1; y++){
				let top = centerSquareTop + (window.CURRENT_SCENE_DATA.vpps/window.CURRENT_SCENE_DATA.scale_factor)*y;
				let pixeldata = aoeContext.getImageData(left-2, top-2, 4, 4).data;
				for(let i=0; i<pixeldata.length; i+=4){
					if(pixeldata[i]>100 || pixeldata[i+1]>100 || pixeldata[i+2]>100){
						return true;
					}
				}
			}	
		}
	}			
	return  false;
}
function is_token_under_light_aura(tokenid, lightContext=undefined){
	if(lightContext == undefined){
		lightContext = window.lightInLos.getContext('2d');
	}

	let pixeldata = lightContext.getImageData(parseInt(window.TOKEN_OBJECTS[tokenid].options.left)/ window.CURRENT_SCENE_DATA.scale_factor, parseInt(window.TOKEN_OBJECTS[tokenid].options.top)/ window.CURRENT_SCENE_DATA.scale_factor,  window.TOKEN_OBJECTS[tokenid].sizeWidth()/window.CURRENT_SCENE_DATA.scale_factor, window.TOKEN_OBJECTS[tokenid].sizeHeight()/window.CURRENT_SCENE_DATA.scale_factor).data;
	
	for(let i=0; i<pixeldata.length; i+=4){
		if(pixeldata[i]>4 || pixeldata[i+1]>4 || pixeldata[i+2]>4){
			return true;
		}
	}
				
	return  false;
}

function is_token_under_truesight_aura(tokenid, truesightContext=undefined){
	if(truesightContext == undefined){
		truesightContext = window.truesightCanvas.getContext('2d');
	}

	let pixeldata = truesightContext.getImageData(parseInt(window.TOKEN_OBJECTS[tokenid].options.left)/ window.CURRENT_SCENE_DATA.scale_factor, parseInt(window.TOKEN_OBJECTS[tokenid].options.top)/ window.CURRENT_SCENE_DATA.scale_factor, window.TOKEN_OBJECTS[tokenid].sizeWidth()/ window.CURRENT_SCENE_DATA.scale_factor, window.TOKEN_OBJECTS[tokenid].sizeHeight()/ window.CURRENT_SCENE_DATA.scale_factor).data;
	
	for(let i=0; i<pixeldata.length; i+=4){
		if(pixeldata[i]>4 || pixeldata[i+1]>4 || pixeldata[i+2]>4)
			return true;
	}
				
	return  false;
}


function is_door_in_visible_light(door, imageData){

	if (imageData == undefined) {
		return false;
	}
	const centerX = parseFloat($(door).css('--mid-x')) / window.CURRENT_SCENE_DATA.scale_factor;
	const centerY = parseFloat($(door).css('--mid-y')) / window.CURRENT_SCENE_DATA.scale_factor;
	let pixeldata;

	for(let x=centerX-10; x<=centerX+10; x++){
		for(let y=centerY-10; y<=centerY+10; y++){
			pixeldata = getPixelFromImageData(imageData, x, y);
			if(pixeldata[0]>=5 || pixeldata[1]>=5 || pixeldata[2]>=5)
				return true;
		}
	}

	return false;
}



function check_single_token_visibility(id){

	if (window.DM || $("#fog_overlay").is(":hidden") || window.TOKEN_OBJECTS[id].options.combatGroupToken)
		return;	
	
	let auraSelectorId = id.replaceAll("/", "").replaceAll('.', '');
	let auraSelector = ".aura-element[id='aura_" + auraSelectorId + "']";
	let selector = "div.token[data-id='" + id + "']";
	let playerTokenId = $(`.token[data-id*='${window.PLAYER_ID}']`).attr("data-id");

	let playerTokenHasVision;

	const fogCanvas = document.getElementById('fog_overlay');
	const lightCanvas = window.lightInLos;



	if(window.tokenCheckOffscreenCanvas == undefined){
		window.tokenCheckOffscreenCanvas = new OffscreenCanvas(fogCanvas.width, fogCanvas.height);
		window.tokenCheckOffscreenContext = window.tokenCheckOffscreenCanvas.getContext('2d');
	}


	const tokenObjectValues = Object.values(window.TOKEN_OBJECTS);
	const aPlayerToken = tokenObjectValues.some(d => d.options.id.startsWith('/profile'));
	const playerTokenWithVisionEnabled = aPlayerToken == true && (window.TOKEN_OBJECTS[playerTokenId]?.options?.auraislight === true || (playerTokenId === undefined && tokenObjectValues.some(d => d.options.id.startsWith('/profile') && d.options.auraislight == true)));
	const sharedVisionToken = tokenObjectValues.some(d => d.options.share_vision !== undefined && (d.options.share_vision === true || d.options.share_vision == window.myUser || (d.options.share_vision != false && is_spectator_page())) && d.options.auraislight == true);

	if ((((playerTokenId === undefined && playerTokenWithVisionEnabled) || sharedVisionToken) && (window.walls?.length > 4 || window.CURRENT_SCENE_DATA.darkness_filter > 0)) || (playerTokenId !== undefined && window.TOKEN_OBJECTS[playerTokenId].options.auraislight === true))
		playerTokenHasVision = true
	else
		playerTokenHasVision = false;



	const offScreenCanvas = window.tokenCheckOffscreenCanvas;
	offScreenCanvas.width = fogCanvas.width;
	offScreenCanvas.height = fogCanvas.height;
	const offScreenCtx = window.tokenCheckOffscreenContext;

	if ((window.DM || playerTokenHasVision) && window.CURRENT_SCENE_DATA.disableSceneVision != 1) {
		offScreenCtx.clearRect(0, 0, offScreenCanvas.width, offScreenCanvas.height);
		offScreenCtx.drawImage(lightCanvas, 0, 0);
	} else if (aPlayerToken == true || window.CURRENT_SCENE_DATA.disableSceneVision == 1) {
		offScreenCtx.fillStyle = 'rgba(255, 255, 255 , 1)';
		offScreenCtx.fillRect(0, 0, offScreenCanvas.width, offScreenCanvas.height)
	}

	offScreenCtx.globalCompositeOperation = 'multiply';
	offScreenCtx.drawImage(fogCanvas, 0, 0);
	
	const offscreenImageData = offScreenCtx.getImageData(0, 0, offScreenCanvas.width, offScreenCanvas.height);

	const isSelected = window.CURRENTLY_SELECTED_TOKENS.includes(id);

	const sharedVision = (playerTokenId == id || window.TOKEN_OBJECTS[id].options.share_vision == true || window.TOKEN_OBJECTS[id].options.share_vision == window.myUser || (window.TOKEN_OBJECTS[id].options.share_vision && is_spectator_page()));

	const hideThisTokenInFogOrDarkness = (window.TOKEN_OBJECTS[id].options.revealInFog !== true); //we want to hide this token in fog or darkness

	const inVisibleLight = (sharedVision && (!window.SelectedTokenVision || window.CURRENTLY_SELECTED_TOKENS.length == 0 || isSelected)) || in_fog_or_dark_image_data(id, offscreenImageData) === true; // this token is not in fog or darkness and not the players token

	const dmSelected = window.DM === true && isSelected;

	const showThisPlayerToken = window.TOKEN_OBJECTS[id].options.itemType === 'pc' && window.DM !== true && playerTokenId === undefined //show this token when logged in as a player without your own token

	const hideInvisible = dmSelected !== true && window.TOKEN_OBJECTS[id].options.conditions.some(d => d.name == 'Invisible') && !sharedVision

	
	let inTruesight = false;
	if(window.TOKEN_OBJECTS[id].conditions.includes('Invisible') && $(`.aura-element-container-clip.truesight`).length>0 ){
		inTruesight = is_token_under_truesight_aura(id);
	}
	if (showThisPlayerToken !== true && (hideThisTokenInFogOrDarkness === true && inVisibleLight !== true || (window.TOKEN_OBJECTS[id].options.hidden === true && inTruesight !== true) || (hideInvisible === true && inTruesight !== true))) {
		$(selector + "," + auraSelector).hide();
	}
	else if (window.TOKEN_OBJECTS[id].options.hidden !== true || inTruesight === true) {
		$(selector).css('opacity', 1);
		$(selector).show();
		if(window.TOKEN_OBJECTS[id].options.hideaura !== true && id !== playerTokenId)
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
function getPixelFromImageData(imageData, x, y){
	const index = (Math.round(x) + Math.round(y) * imageData.width) * 4;
	return [
		imageData.data[index + 0],
		imageData.data[index + 1],
		imageData.data[index + 2],
		imageData.data[index + 3],
	]

}
function do_check_token_visibility() {
	console.log("do_check_token_visibility");
	if(window.LOADING)
		return;
	if((window.DM && !window.SelectedTokenVision) || (window.DM && $('#tokens .tokenselected:not(.isAoe)').length == 0)){
		$(`.token`).show();
		$(`.door-button`).toggleClass('notVisible', false);
		$(`.aura-element`).show();
		return;
	}


	let hideIds = $('');
	let showTokenIds = $('');
	let showAuraIds = $('');
	let showDoors = $('');
	let hideDoors = $('');
	let dmSelectedTokens = $('');

	if(window.fogCanvas == undefined){
		window.fogCanvas = document.getElementById('fog_overlay');
		window.fogContext = window.fogCanvas.getContext('2d');
	}
	const fogCanvas = window.fogCanvas;
	const fogContext = window.fogContext;

	const lightCanvas = window.lightInLos;
	let lightContext = window.lightInLosContext;

	
	let playerTokenId = $(`.token[data-id*='${window.PLAYER_ID}']`).attr("data-id");
	
	let playerTokenHasVision;
	const tokenObjectValues = Object.values(window.TOKEN_OBJECTS);
	const aPlayerToken = tokenObjectValues.some(d => d.options.id.startsWith('/profile'));
	const playerTokenWithVisionEnabled = aPlayerToken == true && (window.TOKEN_OBJECTS[playerTokenId]?.options?.auraislight === true || (playerTokenId === undefined && tokenObjectValues.some(d => d.options.id.startsWith('/profile') && d.options.auraislight == true)));
	const sharedVisionToken = tokenObjectValues.some(d => d.options.share_vision !== undefined && (d.options.share_vision === true || d.options.share_vision == window.myUser || (d.options.share_vision != false && is_spectator_page())) && d.options.auraislight == true);



	if (((playerTokenWithVisionEnabled || sharedVisionToken) && (window.walls.length > 4 || window.CURRENT_SCENE_DATA.darkness_filter > 0)) || (playerTokenId !== undefined && window.TOKEN_OBJECTS[playerTokenId].options.auraislight === true))
		playerTokenHasVision = true
	else
		playerTokenHasVision = false;
	


	
	if (window.tokenCheckOffscreenCanvas == undefined) {
		window.tokenCheckOffscreenCanvas = new OffscreenCanvas(fogCanvas.width, fogCanvas.height);
		window.tokenCheckOffscreenContext = window.tokenCheckOffscreenCanvas.getContext('2d');
	}
	const offScreenCanvas = window.tokenCheckOffscreenCanvas;
	offScreenCanvas.width = fogCanvas.width;
	offScreenCanvas.height = fogCanvas.height;
	const offScreenCtx = window.tokenCheckOffscreenContext;
	if ((window.DM || playerTokenHasVision) && window.CURRENT_SCENE_DATA.disableSceneVision != 1){
		offScreenCtx.clearRect(0, 0, offScreenCanvas.width, offScreenCanvas.height);
		offScreenCtx.drawImage(lightCanvas, 0, 0);	
	} else if (aPlayerToken == true || window.CURRENT_SCENE_DATA.disableSceneVision == 1){
		offScreenCtx.fillStyle = 'rgba(255, 255, 255 , 1)';
		offScreenCtx.fillRect(0, 0, offScreenCanvas.width, offScreenCanvas.height)
	}

	const truesightAuraExists = $(`.aura-element-container-clip.truesight`).length > 0;

	let truesightContext;

	if (truesightAuraExists){
		offScreenCtx.drawImage(truesightCanvas, 0, 0);
		truesightContext = window.truesightCanvas.getContext('2d');
	}


	offScreenCtx.globalCompositeOperation = 'multiply';
	offScreenCtx.drawImage(fogCanvas, 0, 0);

	


	const offscreenImageData = offScreenCtx.getImageData(0, 0, offScreenCanvas.width, offScreenCanvas.height);
	

	for (let id in window.TOKEN_OBJECTS) {
		if(window.TOKEN_OBJECTS[id].options.combatGroupToken || window.TOKEN_OBJECTS[id].options.type != undefined)
			continue;
		
		const auraSelector = window.ON_SCREEN_TOKENS[id].onScreenAura;
		const tokenSelector = window.ON_SCREEN_TOKENS[id].onScreenToken;
		const darknessTokenSelector = window.ON_SCREEN_TOKENS[id].onScreenDarknessToken;
		
		const isSelected = window.CURRENTLY_SELECTED_TOKENS.includes(id);

		const sharedVision = (playerTokenId == id ||  window.TOKEN_OBJECTS[id].options.share_vision == true || window.TOKEN_OBJECTS[id].options.share_vision == window.myUser);

		const hideThisTokenInFogOrDarkness = (window.TOKEN_OBJECTS[id].options.revealInFog !== true); //we want to hide this token in fog or darkness
		
		const inVisibleLight = (sharedVision && (!window.SelectedTokenVision || window.CURRENTLY_SELECTED_TOKENS.length == 0 || isSelected)) || in_fog_or_dark_image_data(id, offscreenImageData) === true; // this token is not in fog or darkness and not the players token

		const dmSelected = window.DM === true && isSelected;

		const showThisPlayerToken = window.TOKEN_OBJECTS[id].options.itemType === 'pc' && window.DM !== true && playerTokenId === undefined //show this token when logged in as a player without your own token

		const hideInvisible = dmSelected !== true && window.TOKEN_OBJECTS[id].options.conditions.some(d=> d.name == 'Invisible') && !sharedVision


		let inTruesight = false;
		if(window.TOKEN_OBJECTS[id].conditions.includes('Invisible') && truesightAuraExists){
			inTruesight = is_token_under_truesight_aura(id, truesightContext);
		}

		if (showThisPlayerToken !== true && ((hideThisTokenInFogOrDarkness === true && inVisibleLight !== true && dmSelected !== true) || (window.TOKEN_OBJECTS[id].options.hidden === true && inTruesight !== true && dmSelected !== true) || (hideInvisible === true && inTruesight !== true))) {
			hideIds = hideIds.add(tokenSelector).add(auraSelector).add(darknessTokenSelector)
		}	
		else if (window.TOKEN_OBJECTS[id].options.hidden !== true || inTruesight === true) {
			showTokenIds = showTokenIds.add(tokenSelector).add(darknessTokenSelector);
			if(window.TOKEN_OBJECTS[id].options.hideaura !== true || id === playerTokenId)
				showAuraIds = showAuraIds.add(auraSelector);
		}else if(dmSelected === true){
			dmSelectedTokens = dmSelectedTokens.add(tokenSelector).add(darknessTokenSelector);
		}	
		
	}

	let doors = $('.door-button');
	for(let i=0; i<doors.length; i++){
		let door = doors[i];

		const inVisibleLight = (is_door_in_visible_light(door, offscreenImageData) === true); 

		if (!inVisibleLight || $(door).hasClass('secret')) {
			hideDoors = hideDoors.add(door)
		}
		else {
			showDoors = showDoors.add(door)
		}
	}
	
	hideIds.hide();
	showTokenIds.css({ 'opacity': 1, 'display': 'flex' });
	showAuraIds.show();
	dmSelectedTokens.css({ 'display': 'flex' });

	showDoors.toggleClass('notVisible', false);
	hideDoors.toggleClass('notVisible', true);
	


	console.log("finished");
}

function circle2(a, b) {
	let R = a.r,
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
	let a, dx, dy, d, h, rx, ry;
	let x2, y2;

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
	let xi = x2 + rx;
	let xi_prime = x2 - rx;
	let yi = y2 + ry;
	let yi_prime = y2 - ry;

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
function redraw_hex_grid(hpps=null, vpps=null, offsetX=null, offsetY=null, color=null, lineWidth=null, subdivide=null, dash=[], columns=true, drawGrid = window.CURRENT_SCENE_DATA.grid){
	
	window.gridCentersArray = [];
	
	const gridCanvas = document.getElementById("grid_overlay");
	gridCanvas.width = $('#scene_map').width() / window.CURRENT_SCENE_DATA.scaleAdjustment.x
	gridCanvas.height = $('#scene_map').height() / window.CURRENT_SCENE_DATA.scaleAdjustment.y;
	const gridContext = gridCanvas.getContext("2d");
	if(window.CURRENT_SCENE_DATA.gridType == 2){
		hpps = vpps || window.CURRENT_SCENE_DATA.vpps;
		window.CURRENT_SCENE_DATA.hpps = vpps || window.CURRENT_SCENE_DATA.vpps;
	}
	clear_grid();
	gridContext.setLineDash(dash);
	let startX = offsetX / window.CURRENT_SCENE_DATA.scale_factor || window.CURRENT_SCENE_DATA.offsetx / window.CURRENT_SCENE_DATA.scale_factor;
	let startY = offsetY / window.CURRENT_SCENE_DATA.scale_factor || window.CURRENT_SCENE_DATA.offsety / window.CURRENT_SCENE_DATA.scale_factor;
	startX = Math.round(startX)
	startY = Math.round(startY) 
	const hexSize = hpps/1.5 / window.CURRENT_SCENE_DATA.scale_factor || window.CURRENT_SCENE_DATA.hpps/1.5 / window.CURRENT_SCENE_DATA.scale_factor;
	gridContext.lineWidth = lineWidth || window.CURRENT_SCENE_DATA.grid_line_width;
	gridContext.strokeStyle = color || window.CURRENT_SCENE_DATA.grid_color;


	const a = 2 * Math.PI / 6;
			
	


	if(window.CURRENT_SCENE_DATA.gridType == 2){
		
		for (let x = startX-4*(hexSize * Math.sin(a)), j = 0; x + hexSize * Math.sin(a) < gridCanvas.width+4*hexSize+startX; x += 2 ** ((j + 1) % 2) * hexSize * Math.sin(a), j = 0){
		   for (let y = startY-4*(hexSize * (1 + Math.cos(a))); y + hexSize * (1 + Math.cos(a)) < gridCanvas.height+4*hexSize+startY; y += hexSize * (1 + Math.cos(a)), x += (-1) ** j++ * hexSize * Math.sin(a)){		    
		    drawHexagon(x, y);
		  }
		}	
		
			

		let hexWidth = hexSize * Math.sin(a) * 2 * window.CURRENT_SCENE_DATA.scale_factor;
		let hexHeight = hexSize * (1 + Math.cos(a)) * window.CURRENT_SCENE_DATA.scale_factor;
		window.hexGridSize = {
			width: hexWidth,
			height: hexHeight
		}
	}
	else{
		
		for (let y = startY-4*(hexSize * Math.sin(a)), j = 0; y + hexSize * Math.sin(a) < gridCanvas.height+startY+4*hexSize; y += 2 ** ((j + 1) % 2) * hexSize * Math.sin(a), j = 0){
		   for (let x = startX-4*(hexSize * (1 + Math.cos(a))); x + hexSize * (1 + Math.cos(a)) < gridCanvas.width+startX+4*hexSize; x += hexSize * (1 + Math.cos(a)), y += (-1) ** j++ * hexSize * Math.sin(a)){
		    drawHexagon(x, y);
		  }
		}
		
		let hexWidth = hexSize * (1 + Math.cos(a)) * window.CURRENT_SCENE_DATA.scale_factor;
		let hexHeight = hexSize * Math.sin(a) * 2 * window.CURRENT_SCENE_DATA.scale_factor;
		window.hexGridSize = {
			width: hexWidth,
			height: hexHeight
		}
	}

	function drawHexagon(x, y) {
		if(drawGrid == 1 || window.WIZARDING){
			if(window.CURRENT_SCENE_DATA.gridType == 3){
			  gridContext.beginPath();
			  gridContext.moveTo(x + hexSize, y);
			  for (let i = 1; i <= 6; i++) {
			    let angle = i * Math.PI / 3;
			    let dx = hexSize * Math.cos(angle);
			    let dy = hexSize * Math.sin(angle);
			    gridContext.lineTo(x + dx, y + dy);
			  }
			  gridContext.closePath();
			  gridContext.stroke();
			}
			else{
			  gridContext.beginPath();
			  gridContext.moveTo(x, y + hexSize);
			  for (let i = 1; i <= 6; i++) {
			    let angle = i * Math.PI / 3;
			    let dx = hexSize * Math.sin(angle);
			    let dy = hexSize * Math.cos(angle);
			    gridContext.lineTo(x + dx, y + dy);
			  }
			  gridContext.closePath();
			  gridContext.stroke();
			}
		}
		
		window.gridCentersArray.push([x,y]);
	}
	$('#grid_overlay').css('transform', `scale(calc(var(--scene-scale) * ${window.CURRENT_SCENE_DATA.scaleAdjustment.x}), calc(var(--scene-scale) * ${window.CURRENT_SCENE_DATA.scaleAdjustment.y}))`)

}

function redraw_grid(hpps=null, vpps=null, offsetX=null, offsetY=null, color=null, lineWidth=null, subdivide=null, dash=[]){
	if(window.CURRENT_SCENE_DATA.gridType && window.CURRENT_SCENE_DATA.gridType != 1){
		let type = (window.CURRENT_SCENE_DATA.gridType == 2) ? false : true;
		redraw_hex_grid(hpps, vpps, offsetX, offsetY, color, lineWidth, subdivide, dash, type)
		return;
	}
	if(window.CURRENT_SCENE_DATA.grid != '1' && !window.WIZARDING){
		return;
	}
	const gridCanvas = document.getElementById("grid_overlay");
	gridCanvas.width = $('#scene_map').width();
	gridCanvas.height = $('#scene_map').height();
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
	for (let i = startX; i < $("#grid_overlay").width(); i = i + incrementX) {
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
	for (let i = startY; i < $("#grid_overlay").height(); i = i + incrementY) {
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
	$('#grid_overlay').css('transform', `scale(var(--scene-scale))`)

}

function draw_wizarding_box() {

	let gridCanvas = document.getElementById("grid_overlay");
	let gridContext = gridCanvas.getContext("2d");
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

	if($('#gridType input:checked').val() == 1){
		gridContext.beginPath();
		gridContext.moveTo(al1.x, al1.y);
		gridContext.lineTo(al2.x, al1.y);
		gridContext.moveTo(al2.x, al1.y);
		gridContext.lineTo(al2.x, al2.y);
		gridContext.moveTo(al2.x, al2.y);
		gridContext.lineTo(al1.x, al2.y);
		gridContext.moveTo(al1.x, al2.y);
		gridContext.lineTo(al1.x, al1.y);
	
		let hpps = (al2.x - al1.x)/3
		let vpps = (al2.y - al1.y)/3
	
		gridContext.moveTo(al1.x, al1.y + vpps);
		gridContext.lineTo(al2.x, al1.y + vpps);
		gridContext.moveTo(al1.x, al1.y + vpps*2);
		gridContext.lineTo(al2.x, al1.y + vpps*2);
		gridContext.moveTo(al1.x + hpps, al1.y);
		gridContext.lineTo(al1.x + hpps, al2.y);
		gridContext.moveTo(al1.x + hpps*2, al1.y);
		gridContext.lineTo(al1.x + hpps*2, al2.y);
	
		gridContext.stroke();
	}
	else{
		drawHexagon(al1.x, al1.y);
		let hexSize = (al2.x - al1.x)/1.5/2;
		const a = 2 * Math.PI / 6;
		if($('#gridType input:checked').val() == 3){			
				drawHexagon(al1.x, al1.y + hexSize* Math.sin(a)*2);
				drawHexagon(al1.x, al1.y - hexSize * Math.sin(a)*2);
				drawHexagon(al1.x+hexSize * (1 + Math.cos(a)), al1.y+hexSize * Math.sin(a));
				drawHexagon(al1.x-hexSize * (1 + Math.cos(a)), al1.y+hexSize * Math.sin(a));
				drawHexagon(al1.x+hexSize * (1 + Math.cos(a)), al1.y-hexSize * Math.sin(a));
				drawHexagon(al1.x-hexSize * (1 + Math.cos(a)), al1.y-hexSize * Math.sin(a));
		}
		if($('#gridType input:checked').val() == 2){				
				drawHexagon(al1.x + hexSize * Math.sin(a)*2, al1.y);
				drawHexagon(al1.x - hexSize * Math.sin(a)*2, al1.y);
				drawHexagon(al1.x+hexSize * Math.sin(a), al1.y+hexSize * (1 + Math.cos(a)));
				drawHexagon(al1.x+hexSize * Math.sin(a), al1.y-hexSize * (1 + Math.cos(a)));
				drawHexagon(al1.x-hexSize * Math.sin(a), al1.y+hexSize * (1 + Math.cos(a)));
				drawHexagon(al1.x-hexSize * Math.sin(a), al1.y-hexSize * (1 + Math.cos(a)));
		}
	}


	function drawHexagon(x, y) {
		let hexSize = (al2.x - al1.x)/2/1.5 / window.CURRENT_SCENE_DATA.scale_factor;
		if(window.CURRENT_SCENE_DATA.gridType == 3){
		  gridContext.beginPath();
		  gridContext.moveTo(x + hexSize, y);
		  for (let i = 1; i <= 6; i++) {
		    let angle = i * Math.PI / 3;
		    let dx = hexSize * Math.cos(angle);
		    let dy = hexSize * Math.sin(angle);
		    gridContext.lineTo(x + dx, y + dy);
		  }
		  gridContext.closePath();
		  gridContext.stroke();
		}
		else{
		  gridContext.beginPath();
		  gridContext.moveTo(x, y + hexSize);
		  for (let i = 1; i <= 6; i++) {
		    let angle = i * Math.PI / 3;
		    let dx = hexSize * Math.sin(angle);
		    let dy = hexSize * Math.cos(angle);
		    gridContext.lineTo(x + dx, y + dy);
		  }
		  gridContext.closePath();
		  gridContext.stroke();
		}
	}

}
function ctxScale(canvasid, doNotScale=false){
	let canvas = document.getElementById(canvasid);
	canvas.width = $("#scene_map").width();
  	canvas.height = $("#scene_map").height();
  	if (!doNotScale) {
		$(canvas).css({
			'transform-origin': 'top left',
			'transform': 'scale(var(--scene-scale))'
		});
	}
}

function reset_canvas(apply_zoom=true) {
	let sceneMapWidth = $("#scene_map").width();
	let sceneMapHeight = $("#scene_map").height();

	$('#darkness_layer').css({"width": sceneMapWidth, "height": sceneMapHeight});
	$("#scene_map_container").css({"width": sceneMapWidth, "height": sceneMapHeight});
	
	ctxScale('peer_overlay');
	ctxScale('temp_overlay');
	ctxScale('draw_overlay_under_fog_darkness', true);
	ctxScale('fog_overlay');
	ctxScale('grid_overlay');	
	ctxScale('draw_overlay');
	ctxScale('walls_layer');
	ctxScale('elev_overlay');
	ctxScale('weather_overlay');
	ctxScale('weather_light', true);

	window.WeatherOverlay?.setSize(sceneMapWidth, sceneMapHeight);

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
	
	redraw_light_walls();
	redraw_drawings();
	redraw_drawn_light();
	redraw_light();
	redraw_fog();
	redraw_elev();
	set_weather();


 	delete window.lightAuraClipPolygon;
 	delete window.lineOfSightPolygons;


	
	

	let canvas_grid = document.getElementById("grid_overlay");
	let ctx_grid = canvas_grid.getContext("2d");

	window.temp_canvas = document.getElementById("temp_overlay");;
	window.temp_context = window.temp_canvas.getContext("2d");
	if (window.CURRENT_SCENE_DATA && window.CURRENT_SCENE_DATA.hpps > 10 && window.CURRENT_SCENE_DATA.vpps > 10) {
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

		if (!window.WIZARDING) {
			redraw_grid()
		}
		//alert('sopravvissuto');
	}
	else {
		ctx_grid.clearRect(0, 0, canvas_grid.width, canvas_grid.height);
	}
	if(apply_zoom)
		apply_zoom_from_storage();
	redraw_text();
	return;
}
function check_darkness_value(){
	
	let selectedTokens = $('#tokens .tokenselected:not(.isAoe)');
	let playerTokenId = $(`.token[data-id*='${window.PLAYER_ID}']`).attr("data-id");
	let darknessfilter = (window.CURRENT_SCENE_DATA.darkness_filter != undefined) ? window.CURRENT_SCENE_DATA.darkness_filter : 0;
	let darknessPercent = window.DM ? Math.max(40, 100 - parseInt(darknessfilter)) : 100 - parseInt(darknessfilter);
	$('#raycastingCanvas').css('visibility', '');

	let tokenHasSharedVision = false;
	if(selectedTokens.length>0){
		for(let j = 0; j < selectedTokens.length; j++){
		  	let tokenId = $(selectedTokens[j]).attr('data-id');
			if (window.TOKEN_OBJECTS[tokenId] == undefined)
				continue;
			if (tokenId.includes(window.PLAYER_ID) || window.DM || window.TOKEN_OBJECTS[tokenId].options.share_vision == true || window.TOKEN_OBJECTS[tokenId].options.share_vision == window.myUser || (window.TOKEN_OBJECTS[tokenId].options.share_vision && is_spectator_page()) || (playerTokenId == undefined && window.TOKEN_OBJECTS[tokenId].options.itemType == 'pc')){
				tokenHasSharedVision = true;
				break;
			}
		}	  
	}	



	if(selectedTokens.length>0){
		
		if ((window.SelectedTokenVision === true && tokenHasSharedVision && window.CURRENT_SCENE_DATA.disableSceneVision != 1)){
			if(window.CURRENT_SCENE_DATA.darkness_filter > 0){
				$('#VTT').css('--darkness-filter', `${100 - window.CURRENT_SCENE_DATA.darkness_filter}%`)
			}
	  		$('#raycastingCanvas').css('opacity', '1');
	  		
		 	$('#light_container').css({
	 			'opacity': '1'
	 		});

		 	$('#exploredCanvas').css('opacity', '0');
	  	}
	  	else {
  		 	if(window.DM && darknessPercent < 40){
  		 		darknessPercent = 40;
  		 		$('#raycastingCanvas').css('opacity', '0');
  		 	}
			else if (window.DM || window.CURRENT_SCENE_DATA.disableSceneVision != 1){
  		 		$('#raycastingCanvas').css('opacity', '');
  		 	}
			else if (window.CURRENT_SCENE_DATA.disableSceneVision == 1) {
				$('#raycastingCanvas').css('opacity', '0');
			}
  			$('#VTT').css('--darkness-filter', darknessPercent + "%");
  		   	if(window.DM){
  		   		$("#light_container [id^='light_']").css('visibility', "visible");
  		   		$(`.token`).show();
  				$(`.door-button`).css('visibility', '');
  				$(`.aura-element`).show();
  		   	}
	  		if(!parseInt(window.CURRENT_SCENE_DATA.darkness_filter) && window.walls?.length>4){
			 	$('#light_container').css({
		 			'opacity': '0.3'
			 	});
		  	}
		  	else{
		  		$('#light_container').css({
		 			'opacity': ''
		 		});
  			}
  			$('#exploredCanvas').css('opacity', '');
  		}	
	}
	else {
		if((window.DM && darknessPercent < 40)){
			darknessPercent = 40;
			$('#raycastingCanvas').css('opacity', '0');
		}
		else if (window.DM || window.CURRENT_SCENE_DATA.disableSceneVision != 1){
			$('#raycastingCanvas').css('opacity', '');
		}
		else if (window.CURRENT_SCENE_DATA.disableSceneVision == 1){
			$('#raycastingCanvas').css('opacity', '0');
		}
		

		if(!parseInt(darknessfilter) && window.walls?.length>4){
			$('#outer_light_container').css({
				'mix-blend-mode': 'unset',
				'background':  '#FFF',
				'opacity': '0.3'
			});
		} else{
			$('#outer_light_container').css({
				'mix-blend-mode': '',
				'background': '',
				'opacity': ''
			});
		}
		$('#VTT').css('--darkness-filter', darknessPercent + "%");
		if(!parseInt(window.CURRENT_SCENE_DATA.darkness_filter) && window.walls?.length>4){
			$('#light_container').css({
				'opacity': '0.3'
			});
		}
		else{
			$('#light_container').css({
				'opacity': ''
			});
		}
		$('#exploredCanvas').css('opacity', '');
		
		
  	}
}

function redraw_fog() {
	if (!window.FOG_OF_WAR)
		return;
	let canvas = document.getElementById("fog_overlay");
	let fogContext = canvas.getContext("2d");
	let fogStyle;
	if (window.DM)
		fogStyle = "rgba(0, 0, 0, 0.5)";
	else
		fogStyle = "rgb(0, 0, 0)";


	let offscreenDraw = new OffscreenCanvas(canvas.width, canvas.height); 
	let ctx = offscreenDraw.getContext('2d');



	fogContext.clearRect(0, 0, canvas.width, canvas.height);

	ctx.fillStyle = fogStyle;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	function drawHexagon(ctx, x, y) {
		const hpps = window.CURRENT_SCENE_DATA.gridType == 2 ? window.CURRENT_SCENE_DATA.vpps : window.CURRENT_SCENE_DATA.hpps;

		const hexSize = hpps/1.5 / window.CURRENT_SCENE_DATA.scale_factor || window.CURRENT_SCENE_DATA.hpps/1.5 / window.CURRENT_SCENE_DATA.scale_factor;

		if(window.CURRENT_SCENE_DATA.gridType == 3){
		  ctx.beginPath();
		  ctx.moveTo(x + hexSize, y);
		  for (let i = 1; i <= 6; i++) {
		    let angle = i * Math.PI / 3;
		    let dx = hexSize * Math.cos(angle);
		    let dy = hexSize * Math.sin(angle);
		    ctx.lineTo(x + dx, y + dy);
		  }
		  ctx.closePath();
		  ctx.fill();
		}
		else{
		  ctx.beginPath();
		  ctx.moveTo(x, y + hexSize);
		  for (let i = 1; i <= 6; i++) {
		    let angle = i * Math.PI / 3;
		    let dx = hexSize * Math.sin(angle);
		    let dy = hexSize * Math.cos(angle);
		    ctx.lineTo(x + dx, y + dy);
		  }
		  ctx.closePath();
		  ctx.fill();
		}
	}

	for (let i = 0; i < window.REVEALED.length; i++) {
		let d = window.REVEALED[i];
		let adjustedArray = [];
		let revealedScale = (d[6] != undefined) ? d[6]/window.CURRENT_SCENE_DATA.conversion : window.CURRENT_SCENE_DATA.scale_factor/window.CURRENT_SCENE_DATA.conversion;
		const revealedRatio = (revealedScale/window.CURRENT_SCENE_DATA.scale_factor);
		if (d.length == 4) { // SIMPLE CASE OF RECT TO REVEAL
			ctx.clearRect(d[0]/window.CURRENT_SCENE_DATA.scale_factor, d[1]/window.CURRENT_SCENE_DATA.scale_factor, d[2]/window.CURRENT_SCENE_DATA.scale_factor, d[3]/window.CURRENT_SCENE_DATA.scale_factor);
			continue;
		}
		if (d[5] == 0) { //REVEAL

			if (d[4] == 0) { // REVEAL SQUARE
				for(let adjusted = 0; adjusted < 4; adjusted++){
					adjustedArray[adjusted] = d[adjusted] / revealedRatio;
				}
				ctx.clearRect(adjustedArray[0]/window.CURRENT_SCENE_DATA.scale_factor, adjustedArray[1]/window.CURRENT_SCENE_DATA.scale_factor, adjustedArray[2]/window.CURRENT_SCENE_DATA.scale_factor, adjustedArray[3]/window.CURRENT_SCENE_DATA.scale_factor);
			}
			if (d[4] == 1) { // REVEAL CIRCLE
				for(let adjusted = 0; adjusted < 3; adjusted++){
					adjustedArray[adjusted] = d[adjusted] / revealedRatio;
				}
				clearCircle(ctx, adjustedArray[0], adjustedArray[1], adjustedArray[2]);
			}
			if (d[4] == 2) {
				// reveal ALL!!!!!!!!!!
				ctx.clearRect(0, 0, $("#scene_map").width()*window.CURRENT_SCENE_DATA.scale_factor, $("#scene_map").height()*window.CURRENT_SCENE_DATA.scale_factor);
			}
			if (d[4] == 3) {
				// REVEAL POLYGON
				clearPolygon(ctx, d[0], d[6]/window.CURRENT_SCENE_DATA.conversion);
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
				clear3PointRect(ctx, d[0], d[6]/window.CURRENT_SCENE_DATA.conversion);		
			}
			if(d[4] == 6){
				ctx.globalCompositeOperation = 'destination-out';
				drawBrushstroke(ctx, d[0], "#000", d[1], d[6]/window.CURRENT_SCENE_DATA.conversion);

				ctx.globalCompositeOperation = 'source-over';
			}
			if(d[4] == 7){
				ctx.globalCompositeOperation = 'destination-out';

				if(window.CURRENT_SCENE_DATA.gridType == '1'){
					for(let i=0; i<d[0].length; i++){
						ctx.clearRect(d[0][i][0]/window.CURRENT_SCENE_DATA.scale_factor/revealedRatio, d[0][i][1]/window.CURRENT_SCENE_DATA.scale_factor/revealedRatio, window.CURRENT_SCENE_DATA.hpps/window.CURRENT_SCENE_DATA.scale_factor, window.CURRENT_SCENE_DATA.vpps/window.CURRENT_SCENE_DATA.scale_factor);
					}
 				}
				else{
					ctx.fillStyle = "#000"
					ctx.scale(window.CURRENT_SCENE_DATA.scaleAdjustment.x, window.CURRENT_SCENE_DATA.scaleAdjustment.y)
	 				for(let i=0; i<d[0].length; i++){
	 					drawHexagon(ctx, d[0][i][0], d[0][i][1])
	 				}
	 				ctx.setTransform(1, 0, 0, 1, 0, 0);
	 			}
			

				ctx.globalCompositeOperation = 'source-over';
			}
		}
		if (d[5] == 1) { // HIDE
			if (d[4] == 0) { // HIDE SQUARE
				for(let adjusted = 0; adjusted < 4; adjusted++){
					adjustedArray[adjusted] = d[adjusted] / revealedRatio;
				}
				ctx.clearRect(adjustedArray[0]/window.CURRENT_SCENE_DATA.scale_factor, adjustedArray[1]/window.CURRENT_SCENE_DATA.scale_factor, adjustedArray[2]/window.CURRENT_SCENE_DATA.scale_factor, adjustedArray[3]/window.CURRENT_SCENE_DATA.scale_factor);
				ctx.fillStyle = fogStyle;
				ctx.fillRect(adjustedArray[0]/window.CURRENT_SCENE_DATA.scale_factor, adjustedArray[1]/window.CURRENT_SCENE_DATA.scale_factor, adjustedArray[2]/window.CURRENT_SCENE_DATA.scale_factor, adjustedArray[3]/window.CURRENT_SCENE_DATA.scale_factor);
			}
			if (d[4] == 1) { // HIDE CIRCLE
				for(let adjusted = 0; adjusted < 3; adjusted++){
					adjustedArray[adjusted] = d[adjusted] / revealedRatio;
				}
				clearCircle(ctx, adjustedArray[0], adjustedArray[1], adjustedArray[2]);
				drawCircle(ctx, adjustedArray[0], adjustedArray[1], adjustedArray[2], fogStyle);
			}
			if (d[4] == 3) {
				// HIDE POLYGON
				clearPolygon(ctx, d[0], d[6]/window.CURRENT_SCENE_DATA.conversion, true);
				drawPolygon(ctx, d[0], fogStyle, undefined, undefined, undefined, undefined, d[6]/window.CURRENT_SCENE_DATA.conversion, true);
			
			}
			if (d[4] == 4) {
				for(let adjusted = 0; adjusted < 2; adjusted++){
					adjustedArray[adjusted] = d[adjusted] / (revealedScale);
				}
				// HIDE BUCKET
				bucketFill(ctx, adjustedArray[0], adjustedArray[1], fogStyle, 1, false);			
			}
			if (d[4] == 5) {
				//HIDE 3 POINT RECT	
				draw3PointRect(ctx, d[0], fogStyle, undefined, undefined, undefined, undefined, d[6]/window.CURRENT_SCENE_DATA.conversion, true, false, true);		
			}
			if(d[4] == 6){
				ctx.globalCompositeOperation = 'destination-out';
				drawBrushstroke(ctx, d[0], "#000", d[1], d[6]/window.CURRENT_SCENE_DATA.conversion);				
				ctx.globalCompositeOperation = 'source-over';
				drawBrushstroke(ctx, d[0], fogStyle, d[1], d[6]/window.CURRENT_SCENE_DATA.conversion);
			}
			if(d[4] == 7){
				
				if(window.CURRENT_SCENE_DATA.gridType == '1'){
					for(let i=0; i<d[0].length; i++){
						ctx.clearRect(d[0][i][0]/window.CURRENT_SCENE_DATA.scale_factor/revealedRatio, d[0][i][1]/window.CURRENT_SCENE_DATA.scale_factor/revealedRatio, window.CURRENT_SCENE_DATA.hpps/window.CURRENT_SCENE_DATA.scale_factor, window.CURRENT_SCENE_DATA.vpps/window.CURRENT_SCENE_DATA.scale_factor);
					}
 				}
				else{
					ctx.globalCompositeOperation = 'destination-out';
					ctx.scale(window.CURRENT_SCENE_DATA.scaleAdjustment.x, window.CURRENT_SCENE_DATA.scaleAdjustment.y)
	 				ctx.fillStyle = "#000000";
	 				for(let i=0; i<d[0].length; i++){
	 					drawHexagon(ctx, d[0][i][0], d[0][i][1])
	 				}
	 				ctx.setTransform(1, 0, 0, 1, 0, 0);
	 			}				

				ctx.globalCompositeOperation = 'source-over';
				ctx.fillStyle = fogStyle;

				if(window.CURRENT_SCENE_DATA.gridType == '1'){
					for(let i=0; i<d[0].length; i++){
						drawRect(ctx, d[0][i][0]/revealedRatio, d[0][i][1]/revealedRatio, window.CURRENT_SCENE_DATA.hpps, window.CURRENT_SCENE_DATA.vpps);
					}
				}
				else{
					ctx.scale(window.CURRENT_SCENE_DATA.scaleAdjustment.x, window.CURRENT_SCENE_DATA.scaleAdjustment.y)
	 				for(let i=0; i<d[0].length; i++){
	 					drawHexagon(ctx, d[0][i][0], d[0][i][1])
	 				}
	 				ctx.setTransform(1, 0, 0, 1, 0, 0);
	 			}
			}
		}
	}
	fogContext.filter='blur(3px)'
	fogContext.drawImage(offscreenDraw, 0, 0); // draw to visible canvas only once so we render this once
}


/**
 * Redraws all text drawing types from window.DRAWINGS
 */
function redraw_text() {

	$('#text_div').empty();
	for(let drawing=0; drawing<window.DRAWINGS.length; drawing++){
		
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

	let canvasAboveFog = document.getElementById("draw_overlay");
	let ctxAboveFog = canvasAboveFog.getContext("2d");
	ctxAboveFog.clearRect(0, 0, canvasAboveFog.width, canvasAboveFog.height);

	let canvasBelowFog = document.getElementById("draw_overlay_under_fog_darkness");
	let ctxBelowFog = canvasBelowFog.getContext("2d");
	ctxBelowFog.clearRect(0, 0, canvasBelowFog.width, canvasBelowFog.height);

	const drawings = window.DRAWINGS.filter(d => !d[0].includes("text") && d[1] !==  "wall" && d[1] !== 'light' && d[1] !== 'elev')
		
	 

	let offscreenDrawAboveFog = new OffscreenCanvas(canvasAboveFog.width, canvasAboveFog.height);
	let offscreenContextAboveFog = offscreenDrawAboveFog.getContext('2d');
	let offscreenDrawBelowFog = new OffscreenCanvas(canvasBelowFog.width, canvasBelowFog.height);
	let offscreenContextBelowFog = offscreenDrawBelowFog.getContext('2d');

	offscreenDrawAboveFog.width = canvasAboveFog.width;
	offscreenDrawAboveFog.height = canvasAboveFog.height;
	offscreenDrawBelowFog.width = canvasBelowFog.width;
	offscreenDrawBelowFog.height = canvasBelowFog.height;

	for (let i = 0; i < drawings.length; i++) {
		let drawing_clone = $.extend(true, [], drawings[i]);
		let [shape, fill, color, x, y, width, height, lineWidth, scale, location] = drawing_clone;
		let isFilled = fill === 'filled';
		
		if(drawings[i][1] =='elev'){
		  let arr = window.elevHeights != undefined && Object.keys(window.elevHeights).length != 0 ? Object.values(window.elevHeights) : [50];
		  let max = Math.max(...arr) ;
		  let min = Math.min(...arr);
		  max = Math.max(Math.abs(min), max);

		  color = numToColor(color, 0.8, max);
		}

		// Will default to 'above fog' draw layer for existing drawings
		let targetCtx = location == 'below' ? offscreenContextBelowFog : offscreenContextAboveFog;

		if(fill == 'dot'){
			targetCtx.setLineDash([lineWidth, 3*lineWidth])
		}
		else if(fill == 'dash'){
			targetCtx.setLineDash([5*lineWidth, 5*lineWidth])
		}
		else{
			targetCtx.setLineDash([])
		}

		scale = (scale == undefined) ? window.CURRENT_SCENE_DATA.scale_factor/window.CURRENT_SCENE_DATA.conversion : scale/window.CURRENT_SCENE_DATA.conversion;
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
		if(shape == 'brush-arrow'){
			drawBrushArrow(targetCtx, x, color, lineWidth, scale, fill);
		}
		if(shape == "paint-bucket"){
			bucketFill(targetCtx, x/window.CURRENT_SCENE_DATA.scale_factor, y/window.CURRENT_SCENE_DATA.scale_factor, color, 1, true);
		}
		if(shape == "3pointRect"){
		 	draw3PointRect(targetCtx, x, color, isFilled, lineWidth, undefined, undefined, scale);	
		}
	}

	ctxAboveFog.drawImage(offscreenDrawAboveFog, 0, 0); // draw to visible canvas only once so we render this once

	ctxBelowFog.drawImage(offscreenDrawBelowFog, 0, 0); // draw to visible canvas only once so we render this once
	
}
function redraw_elev(openLegened = false) {
	window.elevHeights = {};
	let canvas = document.getElementById("elev_overlay");
	let ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.setLineDash([]);
	const showElevToggle = $('#show_elev').hasClass('button-enabled');
	const displayElev = $('#elev_button').hasClass('button-enabled') || showElevToggle == true
	if(displayElev){
		$('#elev_overlay').css('display', '');
	}
	else{
		$('#elev_overlay').css('display', 'none');
	}

	const drawings = window.DRAWINGS.filter(d => d[1] == 'elev')
		
	 

	let offscreenDraw = new OffscreenCanvas(canvas.width, canvas.height);
	let offscreenContext = offscreenDraw.getContext('2d');

	offscreenDraw.width = canvas.width;
	offscreenDraw.height = canvas.height;
	let elevColorArr = drawings.length > 0 ? drawings.map(d=> d[2]) : [50]
	let maxHeight = Math.max(...elevColorArr);
	let minHeight = Math.min(...elevColorArr);
	maxHeight = maxHeight == 0 && minHeight == 0 ? 50 : Math.max(Math.abs(minHeight), maxHeight);


	for (let i = 0; i < drawings.length; i++) {
		let drawing_clone = $.extend(true, [], drawings[i]);
		let [shape, fill, color, x, y, width, height, lineWidth, scale] = drawing_clone;
		fill = 'filled';
		let isFilled = true;
		
		let mapElev = color;

		color = numToColor(color, 1, maxHeight);
		
		window.elevHeights[color] = mapElev;

		let targetCtx = offscreenContext;

		if(fill == 'dot'){
			targetCtx.setLineDash([lineWidth, 3*lineWidth])
		}
		else if(fill == 'dash'){
			targetCtx.setLineDash([5*lineWidth, 5*lineWidth])
		}
		else{
			targetCtx.setLineDash([])
		}

		scale = (scale == undefined) ? window.CURRENT_SCENE_DATA.scale_factor/window.CURRENT_SCENE_DATA.conversion : scale/window.CURRENT_SCENE_DATA.conversion;
		let adjustedScale = scale/window.CURRENT_SCENE_DATA.scale_factor;

		if(shape == "rect" || shape == "arc" || shape == "paint-bucket"){
			x = x / adjustedScale;
			y = y / adjustedScale;
			height = height / adjustedScale;
			width = width / adjustedScale;
		}
		if (shape == "rect") {
			targetCtx.clearRect(x, y, width, height);
			drawRect(targetCtx,x, y, width, height, color, isFilled, lineWidth);
		}
		if (shape == "arc") {
			const radius = width
			clearCircle(targetCtx, x, y, radius);
			drawCircle(targetCtx,x, y, radius, color, isFilled, lineWidth);
		}
		if (shape == "polygon") {
			clearPolygon(targetCtx, x, scale,true);
			drawPolygon(targetCtx, x, color, isFilled, lineWidth, undefined, undefined, scale);
			// ctx.stroke();
		}
		if(shape == "3pointRect"){
			clear3PointRect(targetCtx, x, scale,true);	
		 	draw3PointRect(targetCtx, x, color, isFilled, lineWidth, undefined, undefined, scale);	
		}
		if(shape == "paint-bucket"){
			bucketFill(targetCtx, x/window.CURRENT_SCENE_DATA.scale_factor, y/window.CURRENT_SCENE_DATA.scale_factor, color, 1, false);
		}
					
	}

	ctx.drawImage(offscreenDraw, 0, 0); // draw to visible canvas only once so we render this once
	if($('#elev_legend_window').length>0 || openLegened == true){
		open_elev_legend()
	}
}
function open_elev_legend(){
	const mobileUI = $('body').hasClass('mobileAVTTUI');
	const position = {
		top: mobileUI ? '7px' :'32px',
		left: mobileUI ? '150px':'317px'
	}
	let elevationWindow = find_or_create_generic_draggable_window('elev_legend_window', 'Elevation Legend', false, false, undefined, '200px', 'fit-content', position.top, position.left, false, '.row-color');
	elevationWindow.find('.elevationLegendDiv').remove();


	let legend = $(`<div class='elevationLegendDiv'></div>`)
	let legendHeights = Object.entries(window.elevHeights)
								.sort(([,a],[,b]) => b-a)
							    .reduce((r, [k, v]) => ({ ...r, [k]: v }), {});
	for(let i in legendHeights){
		let row = $(`<div class='row'><div class='row-color' style='background: ${i};'></div><div>${window.elevHeights[i]}</div></div>`)
		row.off('click.legendRow').on('click.legendRow', `.row-color`, function(e){
			e.stopPropagation();
			$('input#elev_height').val(`${window.elevHeights[i]}`)
		});
		legend.append(row);
	}

	elevationWindow.append(legend);
}

function close_elev_legend(){
	close_and_cleanup_generic_draggable_window('elev_legend_window')
}

function check_token_elev(tokenid, elevContext=undefined){
	if(elevContext == undefined){
		elevContext = $('#elev_overlay')[0].getContext('2d');
	}
	let token = window.TOKEN_OBJECTS[tokenid];
	let left = (parseInt(token.options.left) + (token.options.size / 2)) / window.CURRENT_SCENE_DATA.scale_factor;
	let top = (parseInt(token.options.top) + (token.options.size / 2)) / window.CURRENT_SCENE_DATA.scale_factor;
	let pixeldata = elevContext.getImageData(left, top, 1, 1).data;
	let mapElev =`rgba(${pixeldata[0]},${pixeldata[1]},${pixeldata[2]},1)`;

	if(window.elevHeights != undefined && mapElev != undefined){
		token.options.mapElev = window.elevHeights[mapElev] != undefined && window.elevHeights[mapElev] != '' ? window.elevHeights[mapElev] : 0;
	}
}

function redraw_drawn_light(){
	let lightCanvas = document.getElementById("light_overlay");
	let lightCtx = lightCanvas.getContext("2d");
	lightCtx.clearRect(0, 0, lightCanvas.width, lightCanvas.height);
	const drawings = window.DRAWINGS.filter(d => d[1] == "light")

	let offscreenDraw = new OffscreenCanvas(lightCanvas.width, lightCanvas.height);
	let offscreenContext = offscreenDraw.getContext('2d');


	for (let i = 0; i < drawings.length; i++) {
		let drawing_clone = $.extend(true, [], drawings[i]);
		let [shape, fill, color, x, y, width, height, lineWidth, scale, bucketRaidus] = drawing_clone;
		let isFilled = true;
		
		let targetCtx = offscreenContext;
	
		if(color == true){
			color = window.CURRENT_SCENE_DATA.daylight;
		}
		scale = (scale == undefined) ? window.CURRENT_SCENE_DATA.scale_factor/window.CURRENT_SCENE_DATA.conversion : scale/window.CURRENT_SCENE_DATA.conversion;
		let adjustedScale = scale/window.CURRENT_SCENE_DATA.scale_factor;

	if(shape == "eraser" || shape =="rect" || shape == "arc" || shape == "cone" || shape == "paint-bucket"){
			x = x / adjustedScale;
			y = y / adjustedScale;
			if(shape != "paint-bucket"){
				height = height / adjustedScale;
				width = width / adjustedScale;
			}
			else{
				width = (width != undefined) ? width/window.CURRENT_SCENE_DATA.fpsq*window.CURRENT_SCENE_DATA.hpps/window.CURRENT_SCENE_DATA.scale_factor : undefined
				height = (height != undefined) ? height/window.CURRENT_SCENE_DATA.fpsq*window.CURRENT_SCENE_DATA.hpps/window.CURRENT_SCENE_DATA.scale_factor : undefined
			}
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
			bucketFill(targetCtx, x/window.CURRENT_SCENE_DATA.scale_factor, y/window.CURRENT_SCENE_DATA.scale_factor, color, 1, true, width, height);
		}
		if(shape == "3pointRect"){
		 	draw3PointRect(targetCtx, x, color, isFilled, lineWidth, undefined, undefined, scale);	
		}
	}

	lightCtx.drawImage(offscreenDraw, 0, 0); // draw to visible canvas only once so we render this once
}

function redraw_light_walls(clear=true, editingWallPoints = false){
	let showWallsToggle = $('#show_walls').hasClass('button-enabled');
	let canvas = document.getElementById("walls_layer");	

	$(`[id*='wallHeight']`).remove();
	let ctx = canvas.getContext("2d");
	ctx.setLineDash([]);
	let displayWalls = showWallsToggle == true || $('#wall_button').hasClass('button-enabled') || $('.top_menu.visible [data-shape="paint-bucket"]').hasClass('button-enabled')
	if(displayWalls){
		$('#walls_layer').css('display', '');
	}
	else{
		$('#walls_layer').css('display', 'none');
	}
		
	if(displayWalls == true || clear)
		ctx.clearRect(0, 0, canvas.width, canvas.height);



	window.walls =[];
	const sceneSize = getSceneMapSize();
	let sceneMapHeight = sceneSize.sceneHeight;
	let sceneMapWidth = sceneSize.sceneWidth;

	let wall5 = new Boundary(new Vector(0, 0), new Vector(sceneMapWidth, 0), 0);
	window.walls.push(wall5);
	let wall6 = new Boundary(new Vector(0, 0), new Vector(0, sceneMapHeight), 0);
	window.walls.push(wall6);
	let wall7 = new Boundary(new Vector(sceneMapWidth, 0), new Vector(sceneMapWidth, sceneMapHeight), 0);
	window.walls.push(wall7);
	let wall8 = new Boundary(new Vector(0, sceneMapHeight), new Vector(sceneMapWidth, sceneMapHeight), 0);
	window.walls.push(wall8);

	const drawings = window.DRAWINGS.filter(d => d[1] == "wall");


	let currentDoors = $('.door-button');
	currentDoors.attr('removeAfterDraw', 'true');
	

	if(drawings.length > 0){
		$('#VTT').css('--walls-up-shadow-percent', '30%');
	}
	else{
		$('#VTT').css('--walls-up-shadow-percent', '0%');
	}
	const offscreenCanvas = new OffscreenCanvas(canvas.width, canvas.height);

	const offscreenContext = offscreenCanvas.getContext('2d');
	for (let i = 0; i < drawings.length; i++) {
		let drawing_clone = $.extend(true, [], drawings[i]);
		let [shape, fill, color, x, y, width, height, lineWidth, scale, hidden, wallBottom, wallTop] = drawing_clone;

		if(lineWidth == undefined || lineWidth == null){
			lineWidth = 6;
		}
		wallBottom = wallBottom == null ? "" : wallBottom;
		wallTop = wallTop == null ? "" : wallTop;

		let currentSceneScale = window.CURRENT_SCENE_DATA.scale_factor ? parseFloat(window.CURRENT_SCENE_DATA.scale_factor) : 1;
		let currentSceneConversion = window.CURRENT_SCENE_DATA.conversion ? parseFloat(window.CURRENT_SCENE_DATA.conversion) : 1;

		scale = (scale == undefined) ?  currentSceneScale/currentSceneConversion : scale/currentSceneConversion;
		let adjustedScale = scale/currentSceneScale;
		lineWidth = Math.min(lineWidth, Math.max(lineWidth/window.ZOOM/scale, lineWidth/2));
		if (displayWalls) {
				
			if(!editingWallPoints && ((wallBottom != undefined && wallBottom != '') || (wallTop != undefined && wallTop != ''))){
				draw_text(
				    ctx,
				    undefined,
					((x+width)/2-(10 * parseFloat(window.CURRENT_SCENE_DATA.scale_factor))) / adjustedScale,
					((y+height)/2) / adjustedScale,
				    30 * parseFloat(window.CURRENT_SCENE_DATA.scale_factor),
				    30 * parseFloat(window.CURRENT_SCENE_DATA.scale_factor),
				    `${wallBottom && wallBottom != '' ? `B: ${wallBottom}` : ``} \n ${wallTop && wallTop != '' ? `T: ${wallTop}`: ``}`,
				    {
					    "font": "Arial",
					    "size": 10 * window.CURRENT_SCENE_DATA.scale_factor,
					    "weight": "400",
					    "style": "normal",
					    "underline": false,
					    "align": "left",
					    "color": "rgb(255, 255, 255)",
					    "shadow": "none"
					},
				    {size: 2, color: 'rgb(0, 0, 0)'},
				    undefined,
				    `wallHeight${parseInt(x)}${parseInt(y)}`,
				    undefined,
				    undefined,
				    true
				);
				drawLine(offscreenContext, x, y, width, height, color, lineWidth, scale, true);
			}
			else{
				drawLine(offscreenContext, x, y, width, height, color, lineWidth, scale);
			}
			
		}
		if(!editingWallPoints){
			let type = Object.keys(doorColors).find(key => Object.keys(doorColors[key]).find(key2 => doorColors[key][key2] === color))
			let open;
			let doorButton = $(`.door-button[data-x1='${x}'][data-y1='${y}'][data-x2='${width}'][data-y2='${height}'][data-scale='${scale}']`);
			let hiddenDoor = hidden ? ` hiddenDoor` : ``;
			let dataHidden = hidden;
			let notVisible = doorButton?.hasClass('notVisible') ? true : doorButton.length > 0 ? false : undefined;

			let doorType = (type == 1 || type == 3 || type == 6 || type == 7) ? `window` : (type == 8 || type == 9 || type == 10 || type == 11) ? `curtain` : (type == 12 || type == 13) ? `teleporter` : `door`;

			if(doorButton.find('.window').length > 0 && doorType != 'window' || doorButton.find('.window').length == 0 && doorType == 'window'){
				doorButton.remove();
			}


			if(doorButton.length==0 && doorColorsArray.includes(color)){
				
				let midX = Math.floor((x+width)/2) / scale * currentSceneScale;
				let midY = Math.floor((y+height)/2) / scale * currentSceneScale;


				let doorType = (type == 1 || type == 3 || type == 6 || type == 7) ? `window` : (type == 8 || type == 9 || type == 10 || type == 11) ? `curtain` : (type == 12 || type == 13) ? `teleporter` : `door`;
				
				let locked = (type == 2 || type == 3 || type == 5 || type == 7 || type == 9 || type == 11) ? ` locked` : ``;
				let secret = (type == 4 || type == 5 || type == 6 || type == 7 || type == 10 || type == 11 || type == 13) ? ` secret` : ``;
			
				open = (/rgba.*0\.5\)/g).test(color) ? ` open` : ` closed`;
				
				let openCloseDoorButton = $(`<div class='door-button ${locked}${secret}${open}${hiddenDoor}' ${dataHidden ? `data-hidden=true`: ''} data-x1='${x}' data-y1='${y}' data-x2='${width}' data-y2='${height}' data-scale='${scale}' style='--mid-x: ${midX}px; --mid-y: ${midY}px;'>
													<div class='${doorType} background'><div></div></div>
													<div class='${doorType} foreground'><div></div></div>
													<div class='door-icon'></div>
											</div>`)
				openCloseDoorButton.off('click.doors').on('click.doors', function(){

						if(doorType == `teleporter`){
							

							let alreadyHighlighted = false;
							let tokenObject = window.TOKEN_OBJECTS[`${x}${y}${width}${height}${window.CURRENT_SCENE_DATA.id}`.replaceAll('.','')]

								
							if(tokenObject?.options?.teleporterCoords?.linkedPortalId != undefined){
								copy_selected_tokens(tokenObject.options.teleporterCoords.linkedPortalId);

								if(!window.DM){
									async function teleportScene(tokenObject){
										let currentScene = await AboveApi.getCurrentScene(true);
										let sceneIds = {}
										let playerId = window.PLAYER_ID;
										if(currentScene.playerscene && currentScene.playerscene.players){
											sceneIds = {
												...currentScene.playerscene,         
											};
											sceneIds[playerId] = tokenObject.options.teleporterCoords.sceneId
										}
										else if(typeof currentScene.playerscene == 'string'){
											sceneIds = {
												players: currentScene.playerscene,
											};
											sceneIds[playerId] = tokenObject.options.teleporterCoords.sceneId
										}
										window.splitPlayerScenes = sceneIds;
										window.MB.sendMessage("custom/myVTT/switch_scene", { sceneId: sceneIds});
										window.MB.sendMessage("custom/myVTT/update_dm_player_scenes", {splitPlayerScenes: window.splitPlayerScenes});
									}
									teleportScene(tokenObject);
								}
								else{
									window.MB.sendMessage("custom/myVTT/switch_scene", { sceneId: tokenObject.options.teleporterCoords.sceneId, switch_dm: true });
								}
							}
							else if(tokenObject?.options?.teleporterCoords != undefined){

							
								for(let i=0; i<window.CURRENTLY_SELECTED_TOKENS.length; i++){

									let curr = window.TOKEN_OBJECTS[window.CURRENTLY_SELECTED_TOKENS[i]];
									if(!window.DM && (curr.options.restrictPlayerMove || curr.options.locked) && !curr.isCurrentPlayer() && curr.options.groupId == undefined){
										continue;
									}
										
									const scaleCoversion = window.CURRENT_SCENE_DATA.scale_factor != undefined ? window.CURRENT_SCENE_DATA.scale_factor / tokenObject.options.teleporterCoords.scale : 1 / tokenObject.options.teleporterCoords.scale;
									curr.options.left = `${tokenObject.options.teleporterCoords.left*scaleCoversion - curr.options.size/2}px`;
									curr.options.top = `${tokenObject.options.teleporterCoords.top*scaleCoversion - curr.options.size/2}px`
								

									curr.place(0);
									let optionsClone = $.extend(true, {}, curr.options);
									if(shiftHeld){
										optionsClone.speedAnim = true;
									}
									
									if(!alreadyHighlighted){
										if(shiftHeld){					
											optionsClone.highlightCenter = true;
										}
										alreadyHighlighted = true;
										curr.highlight();
									}
									curr.sync(optionsClone);
								
								}
							}
							return;
						}

						let locked = $(this).hasClass('locked');
						let secret = $(this).hasClass('secret');
						let type = $(this).children('.door').length > 0 ? (secret && locked  ?  5 : (locked ? 2 : (secret ? 4 : 0 ))) : $(this).children('.window').length > 0 ? (secret && locked  ?  7 : (locked ? 3 : (secret ? 6 : 1 ))) : $(this).children('.curtain').length > 0 ? (secret && locked  ?  11 : (locked ? 9 : (secret ? 10 : 8 ))) : secret ? 13 : 12
						if(!$(this).hasClass('locked') && (!shiftHeld || !window.DM)){
							open_close_door(x, y, width, height, type)
						}
						else if(shiftHeld && window.DM){
							const type = doorType == `door` ? (secret ? (!locked ? 5 : 4) : (!locked ? 2 : 0)) : doorType == `window` ? (secret ? (!locked ? 7 : 6) : (!locked ? 3 : 1)) : doorType == `curtain` ? (secret ? (!locked ? 11 : 10) : (!locked ? 9 : 8)) : secret ? 13 : 12
							const isOpen = $(this).hasClass('open') ? `open` : `closed`;
							openCloseDoorButton.toggleClass('locked', !locked);
							let doors = window.DRAWINGS.filter(d => (d[1] == "wall" && doorColorsArray.includes(d[2]) && d[3] == x && d[4] == y && d[5] == width && d[6] == height))  
						
							window.DRAWINGS = window.DRAWINGS.filter(d => d != doors[0]);
							

							let data = ['line',
										'wall',
										doorColors[type][isOpen],
										x,
										y,
										width,
										height,
										12,
										doors[0][8],
										doors[0][9],
										(doors[0][10] != undefined ? doors[0][10] : ""),
										(doors[0][11] != undefined ? doors[0][11] : "")
							];	
							window.DRAWINGS.push(data);
							window.wallUndo.push({
								undo: [[...data]],
								redo: [[...doors[0]]]
							})
							redraw_light_walls();
							redraw_drawn_light();
							redraw_light();


							sync_drawings();
						}
					});
				openCloseDoorButton.off('mouseleave.doors').on('mouseleave.doors', function(){
					$(this).toggleClass('ignore-hover', false);
				});

				
				$('#tokens').append(openCloseDoorButton);
				doorButton = openCloseDoorButton;
				
			}
			else if (doorColorsArray.includes(color)){		
				let secret = (type == 4 || type == 5 || type == 6 || type == 7 || type == 10 || type == 11 || type == 13) ? ` secret` : ``;

		
				let locked = (type == 2 || type == 3 || type == 5 || type == 7 || type == 9 || type == 11) ? ` locked` : ``;
				open = (/rgba.*0\.5\)/g).test(color) ? ` open` : ` closed`;
				if(doorButton.attr('class') != `door-button ${locked}${secret}${open}${hiddenDoor}`){
					doorButton.attr('class', `door-button ${locked}${secret}${open}${hiddenDoor}`)
					doorButton.toggleClass('ignore-hover', true);
				}
				
				doorButton.find('.condition-container').remove();		
			}
			if(doorButton.length ==1){
				let id = `${x}${y}${width}${height}${window.CURRENT_SCENE_DATA.id}`.replaceAll('.','') 
				doorButton.attr('data-id', `${x}${y}${width}${height}${window.CURRENT_SCENE_DATA.id}`.replaceAll('.',''))
				if(notVisible != undefined)
					doorButton.toggleClass('notVisible', notVisible)
				doorButton.removeAttr('removeAfterDraw');

				door_note_icon(id);
				if(window.TOKEN_OBJECTS[id]?.options?.teleporterCoords != undefined || window.TOKEN_OBJECTS[id]?.options?.teleporterCoords?.linkedPortalId !== undefined){
					doorButton.toggleClass('linked', true);
				}
				if(window.TOKEN_OBJECTS[id] != undefined){
					setTokenLight(doorButton, window.TOKEN_OBJECTS[id].options);
				}
				
			}
			if((/rgba.*0\.5\)/g).test(color))
				continue;
			let drawnWall = new Boundary(new Vector(x/adjustedScale/window.CURRENT_SCENE_DATA.scale_factor, y/adjustedScale/window.CURRENT_SCENE_DATA.scale_factor), new Vector(width/adjustedScale/window.CURRENT_SCENE_DATA.scale_factor, height/adjustedScale/window.CURRENT_SCENE_DATA.scale_factor), type)
			drawnWall.scaleAdjustment = adjustedScale;
			drawnWall.wallBottom = wallBottom;
			drawnWall.wallTop = wallTop;
			drawnWall.terrainWall = color === 'rgba(0, 180, 80, 1)'
			window.walls.push(drawnWall);
		}
	}

	if(window.DM && $('#wall_button').hasClass('button-enabled') && $('#edit_wall').hasClass('button-enabled')){
		const selectedWallCanvas = new OffscreenCanvas(canvas.width, canvas.height); 
		window.selectedWallCtx = selectedWallCanvas.getContext('2d')
		window.selectedWallCtx.clearRect(0, 0, canvas.width, canvas.height);
		const currentSceneScale = window.CURRENT_SCENE_DATA.scale_factor ? parseFloat(window.CURRENT_SCENE_DATA.scale_factor)*window.CURRENT_SCENE_DATA.conversion : 1
		const circleSize = 15*window.CURRENT_SCENE_DATA.scale_factor;
		const centerDotSize = 4*window.CURRENT_SCENE_DATA.scale_factor;
		if(window.wallsBeingDragged?.length > 0){
			for(let i=0; i<window.wallsBeingDragged.length; i++){
				const drawIndex = window.wallsBeingDragged[i].drawingIndex;
				const pt1 = window.wallsBeingDragged[i].pt1;
				const pt2 = window.wallsBeingDragged[i].pt2;
				const scale = window.DRAWINGS[drawIndex][8];
				if(pt1 !== undefined){
					drawCircle(offscreenContext, window.DRAWINGS[drawIndex][3]/scale*currentSceneScale, window.DRAWINGS[drawIndex][4]/scale*currentSceneScale, centerDotSize, '#FFF', true, 0)
					drawCircle(offscreenContext, window.DRAWINGS[drawIndex][3]/scale*currentSceneScale, window.DRAWINGS[drawIndex][4]/scale*currentSceneScale, centerDotSize, '#000000', false, 1)
					
					drawCircle(offscreenContext, window.DRAWINGS[drawIndex][3]/scale*currentSceneScale, window.DRAWINGS[drawIndex][4]/scale*currentSceneScale, circleSize, '#000000', false, 1)	
					drawCircle(offscreenContext, window.DRAWINGS[drawIndex][3]/scale*currentSceneScale, window.DRAWINGS[drawIndex][4]/scale*currentSceneScale, circleSize, '#FFFFFF33', true, 0)
						
					drawCircle(window.selectedWallCtx, window.DRAWINGS[drawIndex][3]/scale*currentSceneScale, window.DRAWINGS[drawIndex][4]/scale*currentSceneScale, circleSize, '#FFFFFF33', true, 0)	
				}
				if(pt2 !== undefined){
					drawCircle(offscreenContext, window.DRAWINGS[drawIndex][5]/scale*currentSceneScale, window.DRAWINGS[drawIndex][6]/scale*currentSceneScale, centerDotSize, '#FFF', true, 0)
					drawCircle(offscreenContext, window.DRAWINGS[drawIndex][5]/scale*currentSceneScale, window.DRAWINGS[drawIndex][6]/scale*currentSceneScale, centerDotSize, '#000000', false, 1)
					drawCircle(offscreenContext, window.DRAWINGS[drawIndex][5]/scale*currentSceneScale, window.DRAWINGS[drawIndex][6]/scale*currentSceneScale, circleSize, '#000000', false, 1)
					drawCircle(offscreenContext, window.DRAWINGS[drawIndex][5]/scale*currentSceneScale, window.DRAWINGS[drawIndex][6]/scale*currentSceneScale, circleSize, '#FFFFFF33', true, 0)
					
					drawCircle(window.selectedWallCtx, window.DRAWINGS[drawIndex][5]/scale*currentSceneScale, window.DRAWINGS[drawIndex][6]/scale*currentSceneScale, circleSize, '#FFFFFF33', true, 0)
				}
			}
		}
		else if(window.selectedWalls != undefined){
			for(let i=0; i<window.selectedWalls.length; i++){
				
				const pt1 = window.selectedWalls[i].pt1;
				const pt2 = window.selectedWalls[i].pt2;
				const scale = window.selectedWalls[i].wall[8];
				if(pt1 !== undefined){			
					drawCircle(offscreenContext, pt1.x, pt1.y, centerDotSize, '#FFFFFF', true, 0)
					drawCircle(offscreenContext, pt1.x, pt1.y, centerDotSize, '#000000', false, 1)		
					drawCircle(offscreenContext, pt1.x, pt1.y, circleSize,  '#000000', false, 1)		
					drawCircle(offscreenContext, pt1.x, pt1.y, circleSize, '#FFFFFF33', true, 0)

					drawCircle(window.selectedWallCtx, pt1.x, pt1.y, circleSize, '#FFFFFF33', true, 0)
				}
				if(pt2 !== undefined){
					drawCircle(offscreenContext, pt2.x, pt2.y, centerDotSize, '#FFFFFF', true, 0)
					drawCircle(offscreenContext, pt2.x, pt2.y, centerDotSize, '#000000', false, 1)
					drawCircle(offscreenContext, pt2.x, pt2.y, circleSize,  '#000000', false, 1)
					drawCircle(offscreenContext, pt2.x, pt2.y, circleSize, '#FFFFFF33', true, 0)

					drawCircle(window.selectedWallCtx, pt2.x, pt2.y, circleSize, '#FFFFFF33', true, 0)
				}
			}
		}
	}
	else if(window.DM){
		delete window.selectedWallCanvas;
		delete window.selectedWallCtx;
	}

	ctx.drawImage(offscreenCanvas, 0, 0); 
	if(!editingWallPoints){
		check_darkness_value();
		if(window.DM){
			let regTest = new RegExp(window.CURRENT_SCENE_DATA.id,"g");
			let sceneDoorJournal = Object.keys(window.JOURNAL.notes).filter(d => regTest.test(d));

			for(journal in sceneDoorJournal){
				if($(`[data-id='${sceneDoorJournal[journal]}']`).length == 0){
					delete window.JOURNAL.notes[sceneDoorJournal[journal]]
					window.JOURNAL.persist();
				}

			}
		}
		$('.door-button[removeAfterDraw]').remove();
		if(displayWalls){
			$('.hiddenDoor').css('display', 'block');
		}
		else{
			$('.hiddenDoor').css('display', '');
		}
	}
		

		
	

	

	
}

function door_note_icon(id){

	let doorButton = $(`.door-button[data-id='${id}']`);

	let x = doorButton.attr('data-x1');
	let y = doorButton.attr('data-y1');

	doorButton.find('.condition-container').remove();

	if (id in window.JOURNAL.notes && (window.DM || window.JOURNAL.notes[id].player == true)) {
			const conditionName = "note"
			const conditionContainer = $(`<div id='${conditionName}' class='condition-container' />`);
			const symbolImage = $("<img class='condition-img note-condition' src='" + window.EXTENSION_PATH + "assets/conditons/note.svg'/>");
			conditionContainer.append(symbolImage);
			conditionContainer.click(function(e){
				e.stopPropagation();
			})
			conditionContainer.dblclick(function(e){
				e.stopPropagation();
				window.JOURNAL.display_note(id);
			})

			doorButton.append(conditionContainer);




						
			let flyoutLocation = convert_point_from_map_to_view(parseInt(x), parseInt(y))
	
			let hoverNoteTimer;
			symbolImage.on({
				'mouseover': function(e){
					hoverNoteTimer = setTimeout(function () {
		            	build_and_display_sidebar_flyout(e.clientY, function (flyout) {
				            flyout.addClass("prevent-sidebar-modal-close"); // clicking inside the tooltip should not close the sidebar modal that opened it
				            let noteHover = `<div>
								<div class="tooltip-header">
						       	 	<div class="tooltip-header-icon">
						            
							        	</div>
							        <div class="tooltip-header-text">
							            ${window.JOURNAL.notes[id].title}
							        </div>
							        <div class="tooltip-header-identifier tooltip-header-identifier-condition">
							           Note
							        </div>
					    		</div>
						   		<div class="tooltip-body note-text">
							        <div class="tooltip-body-description">
							            <div class="tooltip-body-description-text note-text">
							                ${window.JOURNAL.notes[id].text}
							            </div>
							        </div>
							    </div>
							</div>`
				            const tooltipHtml = $(noteHover);
							window.JOURNAL.translateHtmlAndBlocks(tooltipHtml, id);	
							add_journal_roll_buttons(tooltipHtml);
							window.JOURNAL.add_journal_tooltip_targets(tooltipHtml);
							add_stat_block_hover(tooltipHtml);
							add_aoe_statblock_click(tooltipHtml);
				            flyout.append(tooltipHtml);
				            let sendToGamelogButton = $(`<a class="ddbeb-button" href="#">Send To Gamelog</a>`);
				            sendToGamelogButton.css({ "float": "right" });
				            sendToGamelogButton.on("click", function(ce) {
				                ce.stopPropagation();
				                ce.preventDefault();
				                const tooltipWithoutButton = $(noteHover);
				                tooltipWithoutButton.css({
				                    "width": "100%",
				                    "max-width": "100%",
				                    "min-width": "100%"
				                });
				                send_html_to_gamelog(noteHover);
				            });
				            let flyoutLeft = e.clientX+20
				            if(flyoutLeft + 400 > window.innerWidth){
				            	flyoutLeft = window.innerWidth - 420
				            }
				            flyout.css({
				            	left: flyoutLeft,
				            	width: '400px'
				            })

				            const buttonFooter = $("<div></div>");
				            buttonFooter.css({
				                height: "40px",
				                width: "100%",
				                position: "relative",
				                background: "#fff"
				            });
				            flyout.append(buttonFooter);
				            buttonFooter.append(sendToGamelogButton);
				            flyout.find("a").attr("target","_blank");
				      		flyout.off('click').on('click', '.tooltip-hover[href*="https://www.dndbeyond.com/sources/dnd/"], .int_source_link ', function(event){
								event.preventDefault();
								render_source_chapter_in_iframe(event.target.href);
							});
							

				            flyout.hover(function (hoverEvent) {
				                if (hoverEvent.type === "mouseenter") {
				                    clearTimeout(removeToolTipTimer);
				                    removeToolTipTimer = undefined;
				                } else {
				                    remove_tooltip(500);
				                }
				            });
				            flyout.css("background-color", "#fff");
				        });
		        	}, 500);		
				
				},
				'mouseout': function(e){
					clearTimeout(hoverNoteTimer)
				}
		
		    });
		}
}

function open_close_door(x1, y1, x2, y2, type=0){
	let doors = window.DRAWINGS.filter(d => (d[1] == "wall" && doorColorsArray.includes(d[2]) && d[3] == x1 && d[4] == y1 && d[5] == x2 && d[6] == y2)) 

	let color = ((/rgba.*0\.5\)/g).test(doors[0][2])) ? doorColors[type].closed : doorColors[type].open;
		
	

	window.DRAWINGS = window.DRAWINGS.filter(d => d != doors[0]);
		
	let data = ['line',
				 'wall',
				 color,
				 x1,
				 y1,
				 x2,
				 y2,
				 12,
				 doors[0][8],
				 doors[0][9],
				 (doors[0][10] != undefined ? doors[0][10] : ""),
				 (doors[0][11] != undefined ? doors[0][11] : "")
				];	
	window.DRAWINGS.push(data);
	window.wallUndo.push({
		undo: [[...data]],
		redo: [[...doors[0]]]
	})
	redraw_light_walls();
	redraw_drawn_light();
	debounceLightChecks();
	sync_drawings();						
}

function stop_drawing() {
	$("#reveal").css("background-color", "");
	window.MOUSEDOWN = false;
	let target = $("#temp_overlay, #fog_overlay, #VTT, #black_layer");
	target.css('cursor', '');
	target.off('mousedown touchstart', drawing_mousedown);
	target.off('mouseup touchend', drawing_mouseup);
	target.off('mousemove touchmove', drawing_mousemove);
	target.off('contextmenu', drawing_contextmenu);
	window.StoredWalls = [];
	window.wallToStore = [];
	window.selectedWalls = [];
	window.wallsBeingDragged = [];
}

/**
 * Checks if an RGBA value is fully transparent
 * @param {String} rgba String that represents a RGBA value
 * @returns {Boolean}
 */
function is_rgba_fully_transparent(rgba){
	return rgba.split(",")?.[3]?.trim().replace(")","") === "0"
}

/**
 * Snaps the given coordinates to the nearest grid intersection, based on the current scene data.
 * Supports square grids and includes offsets if they are defined. TODO vert and horz hex
 * 
 * @param {number} pointX - The X-coordinate to be snapped.
 * @param {number} pointY - The Y-coordinate to be snapped.
 * @returns {Array<number>} - The snapped [X, Y] coordinates.
 */
function get_snapped_coordinates(pointX, pointY) {

    const offsetX = parseFloat(window.CURRENT_SCENE_DATA.offsetx) || 0;
    const offsetY = parseFloat(window.CURRENT_SCENE_DATA.offsety) || 0;

    if (window.CURRENT_SCENE_DATA.gridType == "1" || typeof window.CURRENT_SCENE_DATA.gridType == "undefined") {
        // Square grid
        const gridWidth = parseFloat(window.CURRENT_SCENE_DATA.hpps)/2;
        const gridHeight = parseFloat(window.CURRENT_SCENE_DATA.vpps)/2;
        pointX = Math.round((pointX-offsetX) / gridWidth) * gridWidth + offsetX;
        pointY = Math.round((pointY-offsetY) / gridHeight) * gridHeight + offsetY;
    } else if (window.CURRENT_SCENE_DATA.gridType == "2" || window.CURRENT_SCENE_DATA.gridType == "3") {
        // Hex grid (vertical or horizontal)
        console.log("Hex snapping is not implemented yet.");
    }

    return [pointX, pointY];
}

/**
 * Converts a cursor event to coordinates in the virtual tabletop, with optional snapping.
 * Snapping behavior is controlled by the global toggleSnap flag.
 * 
 * @param {Event} event - The cursor event (e.g., mouse or touch event).
 * @returns {Array<number>} - The calculated [X, Y] coordinates.
 */
function get_event_cursor_position(event, preventSnap = false) {
    // Determine the cursor location from the event
    let eventLocation = {
        pageX: (event.touches) ? ((event.touches[0]) ? event.touches[0].pageX : event.changedTouches[0].pageX) : event.pageX,
        pageY: (event.touches) ? ((event.touches[0]) ? event.touches[0].pageY : event.changedTouches[0].pageY) : event.pageY,
    };

    // Convert to local coordinates
    let pointX = Math.round(((eventLocation.pageX - window.VTTMargin) * (1.0 / window.ZOOM)));
    let pointY = Math.round(((eventLocation.pageY - window.VTTMargin) * (1.0 / window.ZOOM)));

    // Apply snapping if enabled
    if (!preventSnap && ((window.toggleSnap && !window.toggleDrawingSnap) || (window.toggleDrawingSnap && !window.toggleSnap))) {
        [pointX, pointY] = get_snapped_coordinates(pointX, pointY);
    }

    return [pointX, pointY];
}

function numToColor(num, alpha, max) {
    let valueAsPercentageOfMax = num / max;
	// actual max is 16777215 but represnts white so we will take a max that is
	// below this to avoid white
	let MAX_RGB_INT = 255;
	let valueFromMaxRgbInt = Math.floor(MAX_RGB_INT * valueAsPercentageOfMax);
	  
	  
	let blue = num < 0 ? Math.floor(MAX_RGB_INT * -1 * valueAsPercentageOfMax) : 0;
	let green = num < 0 ? Math.floor(MAX_RGB_INT * (1 + valueAsPercentageOfMax)) : Math.floor(MAX_RGB_INT * (1 - valueAsPercentageOfMax));
	let red =  num < 0 ? 0 : Math.floor(MAX_RGB_INT * valueAsPercentageOfMax);

  	return "rgba(" + red + "," + green + "," + blue + "," + alpha + ")";
}
/**
 * Pulls information from menu's or buttons without menu's to set values used by
 * drawing mousemove, mousedown, mousecontext events
 * @param {Event} e
 * @returns
 */
function drawing_mousedown(e) {
	if($(e.target).is('#context-menu-layer, .context-menu-list'))
		return;
	// perform some cleanup of the canvas/objects
	if(e.button !== 2 && !window.MOUSEDOWN){
		clear_temp_canvas()
		WaypointManager.resetDefaultDrawStyle()
		WaypointManager.clearWaypoints(false)
	}
	const mousePosition = {
		clientX: (e.touches) ? e.touches[0].clientX : e.clientX,
		pageX: (e.touches) ? e.touches[0].pageX : e.pageX,
		clientY: (e.touches) ? e.touches[0].clientY : e.clientY,
		pageY: (e.touches) ? e.touches[0].pageY : e.pageY
	}
	// always draw unbaked drawings to the temp overlay
	let canvas = document.getElementById("temp_overlay");
	let context = canvas.getContext("2d");

	// get teh data from the menu's/buttons
	const data = get_draw_data(e.data.clicked,  e.data.menu)
	// select modifies this line but never resets it, so reset it here
	// otherwise all drawings are dashed


	
	// these are generic values used by most drawing functionality
	window.LINEWIDTH = data.draw_line_width
	window.DRAWTYPE = (data.from == 'vision_menu') ? 'light' : data.fill
	window.DRAWCOLOR = data.background_color
	window.DRAWLOCATION = data.location
	window.DRAWSHAPE = window.drawAudioPolygon ? 'polygon' : data.shape;
	window.DRAWFUNCTION = window.drawAudioPolygon ? 'audio-polygon' : data.function;

	//these are used with walls or elevation tool
	window.wallTop = data.wall_top_height;
	window.wallBottom = data.wall_base_height;
	window.mapElev = data.elev_height

	if(window.DRAWTYPE == 'dot'){
		context.setLineDash([data.draw_line_width, 3*data.draw_line_width])
	}
	else if(window.DRAWTYPE == 'dash'){
		context.setLineDash([5*data.draw_line_width, 5*data.draw_line_width])
	}
	else{
		context.setLineDash([])
	}
	

	window.DRAWDAYLIGHT = (data.from == 'vision_menu' && $('#daylight').hasClass('button-enabled'));

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
		if(data.type == 'terrain')
			window.DRAWCOLOR = "rgba(0, 180, 80, 1)"
		if(window.DRAWSHAPE == 'line')
			window.DRAWTYPE = "filled"
		window.LINEWIDTH = 6;
	}
	else if(window.DRAWFUNCTION === "wall-door-convert" || window.DRAWFUNCTION === "wall-door" || window.DRAWFUNCTION === "door-door-convert"){
		// semi transparent black
		window.DRAWCOLOR = doorColors[$('#door_types').val()].closed
		window.DRAWTYPE = (window.DRAWFUNCTION === "door-door-convert") ? 'border' : "filled"
		window.LINEWIDTH = 12;
	}
	else if(window.DRAWFUNCTION === "wall-edit"){
			const [pointX, pointY] = get_event_cursor_position(e)
			let pixeldata = window.selectedWallCtx.getImageData(pointX/window.CURRENT_SCENE_DATA.scale_factor, pointY/window.CURRENT_SCENE_DATA.scale_factor, 1, 1).data;
			window.rescalingWalls = false;
			if (pixeldata[0] >= 200 && pixeldata[1] >= 200 && pixeldata[2] >= 200){
				window.DraggingWallPoints = true;
				if(window.shiftHeld)
					window.rescalingWalls = true;
			}
			else{
				window.DraggingWallPoints = false;
			}
			window.DRAWCOLOR = "rgba(255, 255, 255, 1)"
			context.setLineDash([10, 5])
	}
	else if (window.DRAWFUNCTION === "select"){
		window.DRAWCOLOR = "rgba(255, 255, 255, 1)"
		context.setLineDash([10, 5])
		if (e.which == 1) {
			$("#temp_overlay").css('cursor', 'crosshair');
			$("#temp_overlay").css('z-index', '50');
		}		
	}
	else if(window.DRAWFUNCTION === 'elev'){
		let elevColorArr = window.elevHeights != undefined && Object.keys(window.elevHeights).length != 0 ? Object.values(window.elevHeights) : [50];
		let maxHeight = Math.max(...elevColorArr);
		let minHeight = Math.min(...elevColorArr);
		maxHeight = Math.max(Math.abs(minHeight), maxHeight);
		window.DRAWCOLOR = numToColor(window.mapElev, 0.8, maxHeight);
	}
	
	if ($(".context-menu-list.context-menu-root ~ .context-menu-list.context-menu-root:visible, .body-rpgcharacter-sheet .context-menu-list.context-menu-root").length>0){
		return; // if context menu open as we are interacting with that, causes drawing behind if no return
	}

	if (window.DRAGGING && window.DRAWSHAPE != 'align')
		return;
	if (!e.touches && e.button != 0 && window.DRAWFUNCTION != "measure" && window.DRAWFUNCTION != "wall" && window.DRAWFUNCTION != "wall-door" && window.DRAWFUNCTION != "wall-window" )
		return; // right click for tools other than measure/wall drawings that have right click waypoints

	if (!e.touches && e.button == 0 && !shiftHeld && window.StoredWalls.length > 0 && (window.DRAWFUNCTION == "wall" || window.DRAWFUNCTION == "wall-door" || window.DRAWFUNCTION == "wall-window" ))
		return; // final point on waypointed wall - return and finish drawing

	if((window.DRAWFUNCTION == "wall" || window.DRAWFUNCTION == "wall-door" || window.DRAWFUNCTION == "wall-window") && window.MOUSEDOWN && window.wallToStore != undefined){
		if(window.StoredWalls == undefined){
			window.StoredWalls =[];
		}
		window.StoredWalls.push(window.wallToStore);
	}
	if ((!e.touches && e.button != 0 || (shiftHeld && window.StoredWalls.length > 0)) && (window.DRAWFUNCTION == "wall" || window.DRAWFUNCTION == "wall-door" || window.DRAWFUNCTION == "wall-window") && !window.MOUSEDOWN)
		return; // right click or shift click without left click being down

	if (shiftHeld == false || window.DRAWFUNCTION != 'select') {
		deselect_all_tokens();
	}
	
	const [pointX, pointY] = get_event_cursor_position(e)

	if(window.DRAWSHAPE === "brush"){
		window.BEGIN_MOUSEX = pointX
		window.BEGIN_MOUSEY = pointY
		window.MOUSEDOWN = true;
		window.BRUSHWAIT = false;
		window.BRUSHPOINTS = [];
		window.BRUSHPOINTS.push({x:window.BEGIN_MOUSEX, y:window.BEGIN_MOUSEY});
		window.BRUSHPOINTS.push({x:window.BEGIN_MOUSEX-1, y:window.BEGIN_MOUSEY-1});
		window.BRUSHPOINTS.push({x:window.BEGIN_MOUSEX+1, y:window.BEGIN_MOUSEY+1});
		drawBrushstroke(context, window.BRUSHPOINTS,window.DRAWCOLOR,window.LINEWIDTH);
	}
	else if(window.DRAWSHAPE === 'brush-arrow'){
		window.BEGIN_MOUSEX = pointX
		window.BEGIN_MOUSEY = pointY
		window.MOUSEDOWN = true;
		window.BRUSHWAIT = false;
		window.BRUSHPOINTS = [];
		window.BRUSHPOINTS.push({x:window.BEGIN_MOUSEX, y:window.BEGIN_MOUSEY});
		// draw a dot
		window.BRUSHPOINTS.push({x:window.BEGIN_MOUSEX+1, y:window.BEGIN_MOUSEY+1});
		window.BRUSHPOINTS.push({x:window.BEGIN_MOUSEX-1, y:window.BEGIN_MOUSEY-1});
		drawBrushArrow(context, window.BRUSHPOINTS,window.DRAWCOLOR,window.LINEWIDTH, undefined, window.DRAWTYPE);
	}
	else if (window.DRAWSHAPE == "grid-brush"){
		window.BEGIN_MOUSEX = pointX
		window.BEGIN_MOUSEY = pointY
		window.MOUSEDOWN = true;
		window.BRUSHWAIT = false;
		window.BRUSHPOINTS = [];
		window.DRAWCOLOR = 'rgba(255,0,0,0.6)'

		window.temp_context.fillStyle = window.DRAWCOLOR;
		const hpps = window.CURRENT_SCENE_DATA.gridType == 2 ? window.CURRENT_SCENE_DATA.vpps : window.CURRENT_SCENE_DATA.hpps;

		const hexSize = hpps/1.5 / window.CURRENT_SCENE_DATA.scale_factor || window.CURRENT_SCENE_DATA.hpps/1.5 / window.CURRENT_SCENE_DATA.scale_factor;

		function drawHexagon(ctx, x, y) {
			if(window.CURRENT_SCENE_DATA.gridType == 3){
			  ctx.beginPath();
			  ctx.moveTo(x + hexSize, y);
			  for (let i = 1; i <= 6; i++) {
			    let angle = i * Math.PI / 3;
			    let dx = hexSize * Math.cos(angle);
			    let dy = hexSize * Math.sin(angle);
			    ctx.lineTo(x + dx, y + dy);
			  }
			  ctx.closePath();
			  ctx.fill();
			}
			else{
			  ctx.beginPath();
			  ctx.moveTo(x, y + hexSize);
			  for (let i = 1; i <= 6; i++) {
			    let angle = i * Math.PI / 3;
			    let dx = hexSize * Math.sin(angle);
			    let dy = hexSize * Math.cos(angle);
			    ctx.lineTo(x + dx, y + dy);
			  }
			  ctx.closePath();
			  ctx.fill();
			}
		}


		clear_temp_canvas()

		const offscreen_canvas = new OffscreenCanvas($('#scene_map')[0].width, $('#scene_map')[0].height); 
		const offscreen_context = offscreen_canvas.getContext('2d');
		offscreen_context.fillStyle = "#FFF";

		const [scaledX,scaledY] = [window.BEGIN_MOUSEX/window.CURRENT_SCENE_DATA.scale_factor, window.BEGIN_MOUSEY/window.CURRENT_SCENE_DATA.scale_factor];
	

		
		if(window.CURRENT_SCENE_DATA.gridType == '1'){
			const {x,y} = snap_point_to_grid(window.BEGIN_MOUSEX, window.BEGIN_MOUSEY, true);
			window.BRUSHPOINTS.push([Math.round(x), Math.round(y)])
		}
		else{
			const hpps = window.CURRENT_SCENE_DATA.gridType == 2 ? window.CURRENT_SCENE_DATA.vpps : window.CURRENT_SCENE_DATA.hpps;

			const hexSize = hpps/1.5 / window.CURRENT_SCENE_DATA.scale_factor || window.CURRENT_SCENE_DATA.hpps/1.5 / window.CURRENT_SCENE_DATA.scale_factor;

			const closeHexes = window.gridCentersArray.filter(d => Math.abs(d[0]*window.CURRENT_SCENE_DATA.scaleAdjustment.x-scaledX) < hexSize && Math.abs(d[1]*window.CURRENT_SCENE_DATA.scaleAdjustment.y-scaledY)< hexSize);

			for(let i in closeHexes){
				const hexCenter = closeHexes[i];
				const x = hexCenter[0];
				const y = hexCenter[1];
				offscreen_context.clearRect(0, 0, offscreen_canvas.width, offscreen_canvas.height); 
				offscreen_context.scale(window.CURRENT_SCENE_DATA.scaleAdjustment.x, window.CURRENT_SCENE_DATA.scaleAdjustment.y)
				drawHexagon(offscreen_context, x, y);
				const pixeldata = offscreen_context.getImageData(scaledX, scaledY, 1, 1).data;
			    offscreen_context.setTransform(1, 0, 0, 1, 0, 0);
			    if(pixeldata[1] > 200){
			    	window.BRUSHPOINTS.push([Math.round(x),Math.round(y)]);
				}
			}	
			window.BRUSHPOINTS = Array.from(new Set(window.BRUSHPOINTS.map(JSON.stringify)), JSON.parse)
		
		
			if(window.CURRENT_SCENE_DATA.gridType == '1'){
				for(let i in window.BRUSHPOINTS){
						drawRect(window.temp_context, window.BRUSHPOINTS[i][0], window.BRUSHPOINTS[i][1], window.CURRENT_SCENE_DATA.hpps, window.CURRENT_SCENE_DATA.vpps, window.DRAWCOLOR, true, window.DRAWTYPE);
					}
				}
			else{
			window.temp_context.scale(window.CURRENT_SCENE_DATA.scaleAdjustment.x, window.CURRENT_SCENE_DATA.scaleAdjustment.y)
				for(let i in window.BRUSHPOINTS){
					drawHexagon(window.temp_context, window.BRUSHPOINTS[i][0], window.BRUSHPOINTS[i][1])
				}
				window.temp_context.setTransform(1, 0, 0, 1, 0, 0);
			}
		}
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
		window.BEGIN_MOUSEX = mousePosition.clientX;
		window.BEGIN_MOUSEY = mousePosition.clientY;
		window.MOUSEDOWN = true;
		window.MOUSEMOVEWAIT = false;
	}
	else if((window.DRAWFUNCTION == "wall" || window.DRAWFUNCTION == "wall-door" || window.DRAWFUNCTION == "wall-window") && window.wallToStore != undefined){
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
	else if(e.button !== 2 && !window.MOUSEDOWN && !WaypointManager.isMeasuring()){
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

	if ((window.MOUSEMOVEWAIT && !['grid-brush'].includes(window.DRAWSHAPE)) || (window.DRAWFUNCTION === "select" && e.touches != undefined) ) {
		return;
	}
	// don't perform any drawing when dragging a token
	if ($(".ui-draggable-dragging").length > 0){
		return
	}
	 
	const [mouseX, mouseY] = get_event_cursor_position(e)

	

	const isFilled = window.DRAWTYPE === "filled" || window.DRAWTYPE === "light";
	const mouseMoveFps = Math.round((1000.0 / 24.0));


	window.MOUSEMOVEWAIT = true;
	setTimeout(function() {
		window.MOUSEMOVEWAIT = false;
	}, mouseMoveFps);

	const mousePosition = {
		clientX: (e.touches) ? e.touches[0].clientX : e.clientX,
		pageX: (e.touches) ? e.touches[0].pageX : e.pageX,
		clientY: (e.touches) ? e.touches[0].clientY : e.clientY,
		pageY: (e.touches) ? e.touches[0].pageY : e.pageY
	}

	if (window.MOUSEDOWN || window.DRAWSHAPE === "brush") {
		if(window.DRAWFUNCTION != "measure" && !window.DRAGGING && window.DRAWSHAPE != "grid-brush")
			clear_temp_canvas()
		const width = mouseX - window.BEGIN_MOUSEX;
		const height = mouseY - window.BEGIN_MOUSEY;
		// bain todo why is this here?
		// if(window.DRAWSHAPE !== "brush")
		// {
		// 	redraw_fog();
		// }

		if (window.DRAWSHAPE == "rect") {
			if(window.DRAWFUNCTION == "draw_text")
			{
				drawRect(window.temp_context,
					Math.round(((window.BEGIN_MOUSEX - window.VTTMargin + window.scrollX))) * (1.0 / window.ZOOM),
					Math.round(((window.BEGIN_MOUSEY - window.VTTMargin + window.scrollY))) * (1.0 / window.ZOOM),
					((mousePosition.clientX - window.VTTMargin + window.scrollX) * (1.0 / window.ZOOM)) - ((window.BEGIN_MOUSEX - window.VTTMargin + window.scrollX) * (1.0 / window.ZOOM)),
					((mousePosition.clientY - window.VTTMargin + window.scrollY) * (1.0 / window.ZOOM)) - ((window.BEGIN_MOUSEY - window.VTTMargin + window.scrollY) * (1.0 / window.ZOOM)),
					window.DRAWCOLOR,
					isFilled,
					window.LINEWIDTH);
			}
			else if(window.DRAWFUNCTION === "wall-door-convert" || window.DRAWFUNCTION === "wall-door" || window.DRAWFUNCTION === "door-door-convert"){
				drawRect(window.temp_context,
						window.BEGIN_MOUSEX,
						window.BEGIN_MOUSEY,
						width,
						height,
						window.DRAWCOLOR,
						isFilled,
						3,
						true);
			}
			else if(window.DRAWFUNCTION === "wall-eraser" || window.DRAWFUNCTION === "wall-height-convert" || window.DRAWFUNCTION === "wall-door-convert"  || window.DRAWFUNCTION == "wall-eraser-one" || window.DRAWFUNCTION === "door-door-convert"){
				drawRect(window.temp_context,
						window.BEGIN_MOUSEX,
						window.BEGIN_MOUSEY,
						width,
						height,
						`rgba(255, 255, 255, 1)`,
						isFilled,
						3,
						undefined,
						true);
			}
			else if(window.DraggingWallPoints == true && window.DRAWFUNCTION == 'wall-edit'){
				
				const currentSceneScale = window.CURRENT_SCENE_DATA.scale_factor ? parseFloat(window.CURRENT_SCENE_DATA.scale_factor) : 1;
				
				
				const mouseDifX = mouseX - window.BEGIN_MOUSEX;
				const mouseDifY = mouseY - window.BEGIN_MOUSEY;
				
				const scaleAdjustFactor = window.BEGIN_MOUSEY/mouseY
			
						



				if(window.wallsBeingDragged.length == 0){
					for(let j = 0; j < window.DRAWINGS.length; j++){
						const wallData = window.selectedWalls.find(d => JSON.stringify(d.wall)==JSON.stringify(window.DRAWINGS[j]));
						const [pt1, pt2, tokenId] = [wallData?.pt1, wallData?.pt2, wallData?.tokenId]
						const scale = window.DRAWINGS[j][8]/window.CURRENT_SCENE_DATA.conversion;
						const newScale = window.DRAWINGS[j][8]/scaleAdjustFactor;
						if(wallData){
							window.wallsBeingDragged.push({'drawingIndex': j, 'pt1': pt1, 'pt2': pt2, 'wallScale': window.DRAWINGS[j][8], 'tokenId': tokenId})
						}
			
						if(window.rescalingWalls == true){
							if(pt1 != undefined || pt2 != undefined){
								window.DRAWINGS[j][8] *= scaleAdjustFactor;
								window.DRAWINGS[j][8] = Math.max(window.DRAWINGS[j][8], 0.1);
							}
						}
						else{
							if(pt1 != undefined){
								window.DRAWINGS[j][3] = (pt1.x + mouseDifX)*scale/currentSceneScale;
								window.DRAWINGS[j][4] = (pt1.y + mouseDifY)*scale/currentSceneScale;
							}
							if(pt2 != undefined){
								window.DRAWINGS[j][5] = (pt2.x + mouseDifX)*scale/currentSceneScale;
								window.DRAWINGS[j][6] = (pt2.y + mouseDifY)*scale/currentSceneScale;
							}
						}
						
					}
				}
				else{					
					for(let i=0; i<window.wallsBeingDragged.length; i++){
						const [pt1, pt2, drawIndex, tokenId] = [window.wallsBeingDragged[i].pt1, window.wallsBeingDragged[i].pt2, window.wallsBeingDragged[i].drawingIndex, window.wallsBeingDragged[i].tokenId]
						const scale = window.DRAWINGS[drawIndex][8]/window.CURRENT_SCENE_DATA.conversion;
						const originalScale = window.wallsBeingDragged[i].wallScale;
						if(window.rescalingWalls == true){	
							window.DRAWINGS[drawIndex][8] = originalScale*scaleAdjustFactor;
							window.DRAWINGS[drawIndex][8] = Math.max(window.DRAWINGS[drawIndex][8], 0.1);
						}
						else{
							if(pt1 != undefined){
								window.DRAWINGS[drawIndex][3] = (pt1.x + mouseDifX)*scale/currentSceneScale;
								window.DRAWINGS[drawIndex][4] = (pt1.y + mouseDifY)*scale/currentSceneScale;
							}
							if(pt2 != undefined){
								window.DRAWINGS[drawIndex][5] = (pt2.x + mouseDifX)*scale/currentSceneScale;
								window.DRAWINGS[drawIndex][6] = (pt2.y + mouseDifY)*scale/currentSceneScale;
							}
						}

					}
				}
	

				
				
				redraw_light_walls(true, true);
			}
			else{
				drawRect(window.temp_context,
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
			drawRect(window.temp_context,
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
			drawCircle(window.temp_context,
				       centerX,
					   centerY,
					   radius,
					   window.DRAWCOLOR,
					   isFilled,
					   window.LINEWIDTH);
		}
		else if (window.DRAWSHAPE == "cone") {
			drawCone(window.temp_context,
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
				if(e.which === 1 || e.touches){					
					WaypointManager.cancelFadeout(true);
					WaypointManager.setCanvas(window.temp_canvas);
					WaypointManager.registerMouseMove(mouseX, mouseY);
					WaypointManager.storeWaypoint(WaypointManager.currentWaypointIndex, window.BEGIN_MOUSEX/window.CURRENT_SCENE_DATA.scale_factor, window.BEGIN_MOUSEY/window.CURRENT_SCENE_DATA.scale_factor, mouseX/window.CURRENT_SCENE_DATA.scale_factor, mouseY/window.CURRENT_SCENE_DATA.scale_factor);
					WaypointManager.draw();
					sendRulerPositionToPeers();
				}
			}else{
				let lineWidth = window.LINEWIDTH
				if(window.DRAWFUNCTION == 'wall' || window.DRAWFUNCTION == 'wall-door' || window.DRAWFUNCTION == 'wall-window')
					lineWidth = Math.min(window.LINEWIDTH, Math.max(window.LINEWIDTH/window.ZOOM/window.CURRENT_SCENE_DATA.scale_factor, window.LINEWIDTH/2));
		
				drawLine(window.temp_context,
					window.BEGIN_MOUSEX,
					window.BEGIN_MOUSEY,
					mouseX,
					mouseY,
					window.DRAWCOLOR,
					lineWidth);
			}
			if(window.DRAWFUNCTION == 'wall' || window.DRAWFUNCTION == 'wall-door' || window.DRAWFUNCTION == 'wall-window'){
				window.wallToStore = [window.BEGIN_MOUSEX,window.BEGIN_MOUSEY, mouseX, mouseY];
				if(window.StoredWalls != undefined){
					const lineWidth = Math.min(window.LINEWIDTH, Math.max(window.LINEWIDTH/window.ZOOM/window.CURRENT_SCENE_DATA.scale_factor, window.LINEWIDTH/2));
		
					for(let wall in window.StoredWalls){
						drawLine(window.temp_context,
							window.StoredWalls[wall][0],
							window.StoredWalls[wall][1],
							window.StoredWalls[wall][2],
							window.StoredWalls[wall][3],
							window.DRAWCOLOR,
							lineWidth);
					}
				}
				
			}

		}
		else if (window.DRAWSHAPE == "brush"){
		
			// Only add a new point every 75ms to keep the drawing size low
			// Subtract mouseMoveFps from 75ms to avoid waiting too much
			if(Array.isArray(window.BRUSHPOINTS)) {
				const clonePoints = [...window.BRUSHPOINTS];
				if(window.MOUSEDOWN){
					clonePoints.push({x:mouseX, y:mouseY});
					clonePoints.push({x:mouseX-1, y:mouseY-1});
					clonePoints.push({x:mouseX+1, y:mouseY+1});
				}
					
				drawBrushstroke(window.temp_context, clonePoints, window.DRAWCOLOR, window.LINEWIDTH);
			}
			drawCircle(window.temp_context, mouseX, mouseY, window.LINEWIDTH/2*window.CURRENT_SCENE_DATA.scale_factor, '#fff8', true, 1);
			drawCircle(window.temp_context, mouseX, mouseY, window.LINEWIDTH/2*window.CURRENT_SCENE_DATA.scale_factor, '#000000ff', false, 1);
			

			if(!window.MOUSEDOWN || window.BRUSHWAIT)
				return;
			
			window.BRUSHPOINTS.push({x:mouseX, y:mouseY});
			window.BRUSHWAIT = true
			setTimeout(function() {
				window.BRUSHWAIT = false;
			}, 75);
		
			
		}
		else if(window.DRAWSHAPE == "brush-arrow"){
			// Only add a new point every 75ms to keep the drawing size low
			// Subtract mouseMoveFps from 75ms to avoid waiting too much
			if(!window.BRUSHWAIT)
			{

				window.BRUSHPOINTS.push({x:mouseX, y:mouseY});

				drawBrushArrow(window.temp_context, window.BRUSHPOINTS, window.DRAWCOLOR, window.LINEWIDTH, undefined, window.DRAWTYPE);

				window.BRUSHWAIT = true;
				if (mouseMoveFps < 75) {
					setTimeout(function() {
						window.BRUSHWAIT = false;
					}, (75 - mouseMoveFps));
				}	
			}
		}
		else if (window.DRAWSHAPE == "grid-brush"){
			
			window.temp_context.fillStyle = window.DRAWCOLOR;
			const hpps = window.CURRENT_SCENE_DATA.gridType == 2 ? window.CURRENT_SCENE_DATA.vpps : window.CURRENT_SCENE_DATA.hpps;

			const hexSize = hpps/1.5 / window.CURRENT_SCENE_DATA.scale_factor || window.CURRENT_SCENE_DATA.hpps/1.5 / window.CURRENT_SCENE_DATA.scale_factor;

			function drawHexagon(ctx, x, y) {
				if(window.CURRENT_SCENE_DATA.gridType == 3){
				  ctx.beginPath();
				  ctx.moveTo(x + hexSize, y);
				  for (let i = 1; i <= 6; i++) {
				    let angle = i * Math.PI / 3;
				    let dx = hexSize * Math.cos(angle);
				    let dy = hexSize * Math.sin(angle);
				    ctx.lineTo(x + dx, y + dy);
				  }
				  ctx.closePath();
				  ctx.fill();
				}
				else{
				  ctx.beginPath();
				  ctx.moveTo(x, y + hexSize);
				  for (let i = 1; i <= 6; i++) {
				    let angle = i * Math.PI / 3;
				    let dx = hexSize * Math.sin(angle);
				    let dy = hexSize * Math.cos(angle);
				    ctx.lineTo(x + dx, y + dy);
				  }
				  ctx.closePath();
				  ctx.fill();
				}
			}
		

			clear_temp_canvas()

			const offscreen_canvas = new OffscreenCanvas($('#scene_map')[0].width, $('#scene_map')[0].height); 
			const offscreen_context = offscreen_canvas.getContext('2d');
			offscreen_context.fillStyle = "#FFF";

			const [scaledX,scaledY] = [mouseX/window.CURRENT_SCENE_DATA.scale_factor, mouseY/window.CURRENT_SCENE_DATA.scale_factor];
			

		

			if(window.CURRENT_SCENE_DATA.gridType == '1'){
				const roundDown = true;
				const { x, y } = snap_point_to_grid(mouseX, mouseY, true, undefined, undefined, undefined, roundDown);
				window.BRUSHPOINTS.push([Math.round(x), Math.round(y)])
			}
			else{
				const hpps = window.CURRENT_SCENE_DATA.gridType == 2 ? window.CURRENT_SCENE_DATA.vpps : window.CURRENT_SCENE_DATA.hpps;

				const hexSize = hpps/1.5 / window.CURRENT_SCENE_DATA.scale_factor || window.CURRENT_SCENE_DATA.hpps/1.5 / window.CURRENT_SCENE_DATA.scale_factor;

				const closeHexes = window.gridCentersArray.filter(d => Math.abs(d[0]*window.CURRENT_SCENE_DATA.scaleAdjustment.x-scaledX) < hexSize && Math.abs(d[1]*window.CURRENT_SCENE_DATA.scaleAdjustment.y-scaledY)< hexSize);

				for(let i in closeHexes){
					const hexCenter = closeHexes[i];
					const x = hexCenter[0];
					const y = hexCenter[1];
					offscreen_context.clearRect(0, 0, offscreen_canvas.width, offscreen_canvas.height); 
					offscreen_context.scale(window.CURRENT_SCENE_DATA.scaleAdjustment.x, window.CURRENT_SCENE_DATA.scaleAdjustment.y)
					drawHexagon(offscreen_context, x, y);
					const pixeldata = offscreen_context.getImageData(scaledX, scaledY, 1, 1).data;
				    offscreen_context.setTransform(1, 0, 0, 1, 0, 0);
				    if(pixeldata[1] > 200){
				    	window.BRUSHPOINTS.push([Math.round(x),Math.round(y)]);
					}
				}	
			}
			
			window.BRUSHPOINTS = Array.from(new Set(window.BRUSHPOINTS.map(JSON.stringify)), JSON.parse)
			
			
			if(window.CURRENT_SCENE_DATA.gridType == '1'){
				for(let i in window.BRUSHPOINTS){
					drawRect(window.temp_context, window.BRUSHPOINTS[i][0], window.BRUSHPOINTS[i][1], window.CURRENT_SCENE_DATA.hpps, window.CURRENT_SCENE_DATA.vpps, window.DRAWCOLOR, true, window.DRAWTYPE);
					}
				}
			else{
				window.temp_context.scale(window.CURRENT_SCENE_DATA.scaleAdjustment.x, window.CURRENT_SCENE_DATA.scaleAdjustment.y)
 				for(let i in window.BRUSHPOINTS){
 					drawHexagon(window.temp_context, window.BRUSHPOINTS[i][0], window.BRUSHPOINTS[i][1])
 				}
 				window.temp_context.setTransform(1, 0, 0, 1, 0, 0);
 			}
		}
	}
			
	

	else if (window.DRAWSHAPE === "polygon" &&
		window.BEGIN_MOUSEX && window.BEGIN_MOUSEX.length > 0) {
		clear_temp_canvas()
		WaypointManager.setCanvas(window.temp_canvas);
		WaypointManager.cancelFadeout()
		drawPolygon( window.temp_context,
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
		drawClosingArea(window.temp_context,window.BEGIN_MOUSEX[0], window.BEGIN_MOUSEY[0], !isNaN(window.DRAWFUNCTION));
	}
	else if (window.DRAWSHAPE === "3pointRect" &&
		window.BEGIN_MOUSEX && window.BEGIN_MOUSEX.length > 0) {
		clear_temp_canvas()
		WaypointManager.setCanvas(window.temp_canvas);
		WaypointManager.cancelFadeout()
		draw3PointRect( window.temp_context,
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
	// ignore this if we're dragging a token
	if ($(".ui-draggable-dragging:not([data-clone-id])").length > 0) {
		$(".ui-draggable-dragging:not([data-clone-id])").toggleClass('.ui-draggable-dragging', false);
		return
	}

	if(!window.MOUSEDOWN || (window.DRAWFUNCTION === "select" && e.touches != undefined))
		return;

	if (window.DRAWSHAPE == "3pointRect" || ((shiftHeld || (!e.touches && e.button != 0))  && ((window.DRAWFUNCTION == "wall" && window.DRAWSHAPE != 'rect')|| window.DRAWFUNCTION == "wall-door" || window.DRAWFUNCTION == 'wall-window'))){
		return;
	}

	const mousePosition = {
		clientX: (e.touches) ? ((e.touches[0]) ? e.touches[0].clientX : e.changedTouches[0].clientX) : e.clientX,
		pageX: (e.touches) ? ((e.touches[0]) ? e.touches[0].pageX : e.changedTouches[0].pageX) : e.pageX,
		clientY: (e.touches) ? ((e.touches[0]) ? e.touches[0].clientY : e.changedTouches[0].clientY) : e.clientY,
		pageY: (e.touches) ? ((e.touches[0]) ? e.touches[0].pageY : e.changedTouches[0].pageY) : e.pageY,
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
		window.DRAWFUNCTION === "select" || 
		window.DRAWFUNCTION == "elev" || 
		window.DRAWFUNCTION == "audio-polygon") && e.which !== 1 && !e.touches)
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
	if (window.DRAWSHAPE !== "polygon" && window.DRAWFUNCTION !== "measure" && (window.DRAWFUNCTION != "wall" && !window.shiftHeld || window.DRAWSHAPE == 'rect') || (window.DRAWFUNCTION == "wall" && !window.shiftHeld))  {
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
	let hidden = $('[data-hidden]').hasClass('button-enabled');
	let data = ['',
		 window.DRAWTYPE,
		 (window.DRAWDAYLIGHT) ? window.DRAWDAYLIGHT : window.DRAWCOLOR,
		 window.BEGIN_MOUSEX,
		 window.BEGIN_MOUSEY,
		 width,
		 height,
		 window.LINEWIDTH,
		 window.CURRENT_SCENE_DATA.scale_factor*window.CURRENT_SCENE_DATA.conversion,
		 window.DRAWLOCATION];

	if ((window.DRAWFUNCTION !== "select" && window.DRAWFUNCTION !== "measure") &&
		(window.DRAWFUNCTION === "draw" || window.DRAWFUNCTION === "elev" || window.DRAWFUNCTION === 'wall' || window.DRAWFUNCTION == 'wall-door' || window.DRAWFUNCTION == 'wall-window' )){
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
				window.BRUSHPOINTS.push({x:mouseX-1, y:mouseY-1});
				window.BRUSHPOINTS.push({x:mouseX+1, y:mouseY+1});
				data[0] = "brush"
				data[3] = window.BRUSHPOINTS
				data[4] = null
				data[5] = null
				data[6] = null
				break;
			case "brush-arrow":
				data[0] = "brush-arrow"
				data[3] = window.BRUSHPOINTS
				data[4] = null
				data[5] = null
				data[6] = null
				break;
			case "grid-brush":
				data[0] = "grid-brush"
				data[3] = Array.from(new Set(window.BRUSHPOINTS.map(JSON.stringify)), JSON.parse)
				data[4] = null
				data[5] = null
				data[6] = window.CURRENT_SCENE_DATA.scale_factor
			case "paint-bucket":
				data[0] = "paint-bucket"
				data[7] = 0
			default:
				break;
		}
		switch(window.DRAWFUNCTION){
		case 'wall':
			data[1] = "wall"
			data[10] = window.wallBottom
			data[11] = window.wallTop
			break;
		case 'wall-door':
			data[1] = "wall"
			data[9] = hidden
			data[10] = window.wallBottom
			data[11] = window.wallTop
			break;
		case 'wall-window':
			data[1] = "wall"
			data[10] = window.wallBottom
			data[11] = window.wallTop
		case 'elev':
			data[1] = "elev"
			data[2] = window.mapElev
		default:
			break;
		}
		if(window.DRAWTYPE == 'light' && window.DRAWSHAPE == 'paint-bucket'){
			data[5] = $('#bucket_radius1').val() != '' ? parseFloat($('#bucket_radius1').val()) : 10000;
			data[6] = $('#bucket_radius2').val() != '' ? parseFloat($('#bucket_radius2').val()) : 0;
		}
		let undoArray =[];
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
				window.CURRENT_SCENE_DATA.scale_factor*window.CURRENT_SCENE_DATA.conversion,
				0,
				window.wallBottom,
				window.wallTop];
			window.DRAWINGS.push(line1);

			let line2 = ['line',
				"wall",
				window.DRAWCOLOR,
				rectLine.rx,
				rectLine.ry,
				rectLine.rx + rectLine.rw,
				rectLine.ry,
				window.LINEWIDTH,
				window.CURRENT_SCENE_DATA.scale_factor*window.CURRENT_SCENE_DATA.conversion,
				0,
				window.wallBottom,
				window.wallTop];
			window.DRAWINGS.push(line2);
			let line3 = ['line',
				"wall",
				window.DRAWCOLOR,
				rectLine.rx + rectLine.rw,
				rectLine.ry,
				rectLine.rx + rectLine.rw,
				rectLine.ry + rectLine.rh,
				window.LINEWIDTH,
				window.CURRENT_SCENE_DATA.scale_factor*window.CURRENT_SCENE_DATA.conversion,
				0,
				window.wallBottom,
				window.wallTop];
			window.DRAWINGS.push(line3);
			let line4 = ['line',
				"wall",
				 window.DRAWCOLOR,
				 rectLine.rx,
				 rectLine.ry + rectLine.rh,
				 rectLine.rx + rectLine.rw,
				 rectLine.ry + rectLine.rh,
				 window.LINEWIDTH,
				 window.CURRENT_SCENE_DATA.scale_factor*window.CURRENT_SCENE_DATA.conversion,
				 0,
				 window.wallBottom,
				 window.wallTop];
			window.DRAWINGS.push(line4);

			window.wallUndo.push({
				undo: [[...line1], [...line2], [...line3], [...line4]]
			});
		}
		else{
			window.DRAWINGS.push(data);
			if(window.DRAWFUNCTION == "wall" || window.DRAWFUNCTION == 'wall-door'){
				undoArray.push([...data]);
			}
		}

		if(window.DRAWFUNCTION == "wall" || window.DRAWFUNCTION == 'wall-door' ){
			if ( e.button == 2) {
				return;
			}
			for(let walls=0; walls<window.StoredWalls.length; walls++){
					data = ['line',
						"wall",
						window.DRAWCOLOR,
						window.StoredWalls[walls][0],
						window.StoredWalls[walls][1],
						window.StoredWalls[walls][2],
						window.StoredWalls[walls][3],
						window.LINEWIDTH,
						window.CURRENT_SCENE_DATA.scale_factor*window.CURRENT_SCENE_DATA.conversion,
						hidden,
						window.wallBottom,
				 		window.wallTop];
					window.DRAWINGS.push(data);
					window.wallUndo.push({
						undo: [[...data]]
					});
			}
			if(undoArray.length > 0){
				window.wallUndo.push({
					undo: [...undoArray]
				});
			}

			window.StoredWalls = [];
			window.wallToStore = [];
			window.MOUSEDOWN = false;
			redraw_light_walls();
			redraw_light();
		}
		redraw_elev();
		redraw_drawn_light();
		redraw_drawings();
		sync_drawings();
	}
	else if (window.DRAWFUNCTION === "eraser"){
		if (window.DRAWSHAPE === "rect"){
			data[0] = "eraser"
			window.DRAWINGS.push(data);
			redraw_drawn_light();
			redraw_drawings();
		}
		else if (window.DRAWSHAPE === "text_erase"){
			// text eraser lives on a different overlay and thus can't just be eraser
			let c = 0;
			let svgTextArray = $('#text_div svg');
			for (svgText in svgTextArray) {
				let curr = svgTextArray[svgText].id;

				if($("#text_div svg[id='" + curr+ "'] text")[0] == undefined)
					continue;
				let textImageRect = $("#text_div svg[id='" + curr+ "'] text")[0].getBoundingClientRect();	

				
				let texttop = (parseInt(textImageRect.top) + window.scrollY - window.VTTMargin) * (1.0 / window.ZOOM);
				let textleft = (parseInt(textImageRect.left)  + window.scrollX - window.VTTMargin) * (1.0 / window.ZOOM);
				let textright = (parseInt(textImageRect.right) + window.scrollX - window.VTTMargin) * (1.0 / window.ZOOM);
				let textbottom = (parseInt(textImageRect.bottom) + window.scrollY - window.VTTMargin) * (1.0 / window.ZOOM);
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
	else if (window.DRAWFUNCTION === "wall-eraser" || window.DRAWFUNCTION === "wall-height-convert" || window.DRAWFUNCTION === "wall-door-convert"  || window.DRAWFUNCTION == "wall-eraser-one" || window.DRAWFUNCTION === "door-door-convert"){
		let walls = window.DRAWINGS.filter(d => (d[1] == "wall" && d[0].includes("line")));
		let rectLine = {
			rx: window.BEGIN_MOUSEX,
			ry: window.BEGIN_MOUSEY,		
			rw: width,
			rh: height
		};
		let intersectingWalls = [];
		let wallLine = [];
		let undoArray = [];
		let redoArray = [];
		for(let i=0; i<walls.length; i++){
			if(walls[i][2].startsWith('rgba(0, 255, 0') && window.DRAWFUNCTION === "door-door-convert")
				continue;
			let wallInitialScale = walls[i][8];
			let scale_factor = window.CURRENT_SCENE_DATA.scale_factor != undefined ? window.CURRENT_SCENE_DATA.scale_factor : 1;
			let adjustedScale = walls[i][8]/window.CURRENT_SCENE_DATA.scale_factor/window.CURRENT_SCENE_DATA.conversion;

			

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
			
			xInside = (rectLine.rx <= wallLine[0].a.x) && (rectLine.rx <= wallLine[0].b.x) && (rectLine.rx+rectLine.rw >= wallLine[0].b.x ) && (rectLine.rx+rectLine.rw >= wallLine[0].a.x )		
			yInside = (rectLine.ry <= wallLine[0].a.y) && (rectLine.ry <= wallLine[0].b.y) && (rectLine.ry+rectLine.rh >= wallLine[0].b.y ) && (rectLine.ry+rectLine.rh >= wallLine[0].a.y )
			
			if(Array.isArray(left?.x)){
				left.x = left.x.sort((n1,n2) => n2-n1)[2]
			}
			if(Array.isArray(right?.x)){
				right.x = right.x.sort((n1,n2) => n2-n1)[1]
			}
			if(Array.isArray(top?.y)){
				top.y = top.y.sort((n1,n2) => n2-n1)[2]
			}
			if(Array.isArray(bottom?.y)){
				bottom.y = bottom.y.sort((n1,n2) => n2-n1)[1]
			}


			fullyInside = (yInside &&  xInside);
			const onePixel = (top.y == bottom.y && (Array.isArray(left?.y) || Array.isArray(right?.y))) || (left.x == right.x && (Array.isArray(top?.x) || Array.isArray(bottom?.x)))
	


			if(fullyInside || (!onePixel && (left != false || right != false || top != false || bottom != false))){
				if(window.DRAWFUNCTION == "wall-eraser-one" || window.DRAWFUNCTION === "door-door-convert" || window.DRAWFUNCTION == 'wall-height-convert'){
					fullyInside = true;
				}
				let wallColor;
				let wallBottom;
				let wallTop;
				let wallHidden;
				let wallWidth;
				for(let j = 0; j < window.DRAWINGS.length; j++){
					if(window.DRAWINGS[j][1] == ("wall") && window.DRAWINGS[j][0] == ("line") && window.DRAWINGS[j][3] == walls[i][3] && window.DRAWINGS[j][4] == walls[i][4] && window.DRAWINGS[j][5] == walls[i][5] && window.DRAWINGS[j][6] == walls[i][6]){
						
						let doorButton = $(`.door-button[data-x1='${window.DRAWINGS[j][3]}'][data-y1='${window.DRAWINGS[j][4]}'][data-x2='${window.DRAWINGS[j][5]}'][data-y2='${window.DRAWINGS[j][6]}']`);

						let wallId = doorButton.attr('data-id');
					
						if(window.TOKEN_OBJECTS[wallId]){						
							window.TOKEN_OBJECTS[wallId].delete(true)				
						}	
						if(doorButton){
							doorButton.remove();
						}		
						if(window.DRAWFUNCTION === "door-door-convert"){
							redoArray.push([...window.DRAWINGS[j]]);
							window.DRAWINGS[j][2] = window.DRAWCOLOR;
							undoArray.push([...window.DRAWINGS[j]]);
							break;
						}
						else if(window.DRAWFUNCTION == 'wall-height-convert'){
							redoArray.push([...window.DRAWINGS[j]]);
							window.DRAWINGS[j][10] = window.wallBottom;
							window.DRAWINGS[j][11] = window.wallTop;
							undoArray.push([...window.DRAWINGS[j]]);
							break;
						}
						wallColor = window.DRAWINGS[j][2];
						wallWidth = window.DRAWINGS[j][7];
						wallHidden = window.DRAWINGS[j][9];
						wallBottom = window.DRAWINGS[j][10];
						wallTop = window.DRAWINGS[j][11];
						redoArray.push([...window.DRAWINGS[j]]);
						window.DRAWINGS.splice(j, 1);
						break;
					}
				}

				if(!fullyInside){
					intersectingWalls.push({
						wallLine: wallLine[0],
						left: left,
						right: right,
						top: top,
						bottom: bottom
					});
					let x1;
					let x2;
					let y1;
					let y2;
	
					if(left != false && !Array.isArray(left?.y)){
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
						 wallColor,
						 x1,
						 y1,
						 x2,
						 y2,
						 wallWidth,
						 window.CURRENT_SCENE_DATA.scale_factor*window.CURRENT_SCENE_DATA.conversion,
						 wallHidden, 
						 wallBottom, 
						 wallTop];	
						window.DRAWINGS.push(data);
						undoArray.push([...data]);
					}	
					if(right != false && !Array.isArray(right?.y)){
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
						 wallColor,
						 x1,
						 y1,
						 x2,
						 y2,
						 wallWidth,
						 window.CURRENT_SCENE_DATA.scale_factor*window.CURRENT_SCENE_DATA.conversion,
						 wallHidden, 
						 wallBottom, 
						 wallTop
						 ];	
						window.DRAWINGS.push(data);	
						undoArray.push([...data]);			
					}
					if(top != false && !Array.isArray(top?.x)){
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
						 wallColor,
						 x1,
						 y1,
						 x2,
						 y2,
						 wallWidth,
						 window.CURRENT_SCENE_DATA.scale_factor*window.CURRENT_SCENE_DATA.conversion,
						 wallHidden, 
						 wallBottom, 
						 wallTop
						 ];	
						window.DRAWINGS.push(data);
						undoArray.push([...data]);
					
					}
					if(bottom != false && !Array.isArray(bottom?.x)){
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
						 wallColor,
						 x1,
						 y1,
						 x2,
						 y2,
						 wallWidth,
						 window.CURRENT_SCENE_DATA.scale_factor*window.CURRENT_SCENE_DATA.conversion,
						 wallHidden, 
						 wallBottom, 
						 wallTop
						 ];	
						window.DRAWINGS.push(data);	
						undoArray.push([...data]);				
					}
				}
					
			}		
		}




		if(intersectingWalls.length>0 && window.DRAWFUNCTION == 'wall-door-convert'){
			
			let x1;
			let x2;
			let y1;
			let y2;


			for(let i = 0; i < intersectingWalls.length; i++){

				let bottom = intersectingWalls[i].bottom;
				let top = intersectingWalls[i].top;
				let left = intersectingWalls[i].left;
				let right = intersectingWalls[i].right ;

				if(bottom != false && !Array.isArray(bottom?.x)){
					if(x1 == undefined){
						x1 = bottom.x;
						y1 = bottom.y;
					}
					else{
						x2 = bottom.x;
						y2 = bottom.y;
					}
					
				}
				if(left != false && !Array.isArray(right?.y)){
					if(x1 == undefined){
						x1 = left.x;
						y1 = left.y;
					}
					else{
						x2 = left.x;
						y2 = left.y;
					}
				}
				if(right != false && !Array.isArray(left?.y)){
					if(x1 == undefined){
						x1 = right.x;
						y1 = right.y;
					}
					else{
						x2 = right.x;
						y2 = right.y;
					}
				}
				if(top != false && !Array.isArray(top?.x)){	
					if(x1 == undefined){
						x1 = top.x;
						y1 = top.y;
					}
					else{
						x2 = top.x;
						y2 = top.y;	
					}																
				}				
			}
			
			if(x1 != undefined && x2 != undefined && y1 != undefined && y2 != undefined){
				let data = ['line',
				 'wall',
				 window.DRAWCOLOR,
				 x1,
				 y1,
				 x2,
				 y2,
				 12,
				 window.CURRENT_SCENE_DATA.scale_factor*window.CURRENT_SCENE_DATA.conversion,
				 0, 
				 window.wallBottom, 
				 window.wallTop
				 ];	
				window.DRAWINGS.push(data);
				undoArray.push([...data]);
			}					
		}
 		window.wallUndo.push({
			undo: [...undoArray],
			redo: [...redoArray]
		});

		redraw_light_walls();
        redraw_drawn_light();
        redraw_light();
		sync_drawings();
	}
	else if(window.DRAWFUNCTION === "wall-edit"){
		if(window.DraggingWallPoints == undefined || window.DraggingWallPoints == false){
			let walls = window.DRAWINGS.filter(d => (d[1] == "wall" && d[0].includes("line")));
			let rectLine = {
				rx: window.BEGIN_MOUSEX,
				ry: window.BEGIN_MOUSEY,		
				rw: width,
				rh: height
			};
			let intersectingWalls = [];
			let wallLine = [];
			let eraserToRight  = rectLine.rw > 0;
			let eraserToBottom = rectLine.rh > 0;
			if(!eraserToRight){
				rectLine.rx = rectLine.rx + rectLine.rw;
				rectLine.rw = Math.abs(rectLine.rw);
			}
			if(!eraserToBottom){
				rectLine.ry = rectLine.ry + rectLine.rh;
				rectLine.rh = Math.abs(rectLine.rh);
			}
			if(!window.shiftHeld)
				window.selectedWalls = [];	
			
			for(let i=0; i<walls.length; i++){
				let wallInitialScale = walls[i][8];
				let scale_factor = window.CURRENT_SCENE_DATA.scale_factor != undefined ? window.CURRENT_SCENE_DATA.scale_factor : 1;
				let adjustedScale = walls[i][8]/window.CURRENT_SCENE_DATA.scale_factor/window.CURRENT_SCENE_DATA.conversion;				

				let pt1 = {
						x: walls[i][3]/adjustedScale,
						y: walls[i][4]/adjustedScale
					};
				let pt2 =  {
						x: walls[i][5]/adjustedScale,
						y: walls[i][6]/adjustedScale
					};

				
				const pt1Inside = (rectLine.rx <= pt1.x) && (rectLine.rx+rectLine.rw >= pt1.x) && (rectLine.ry <= pt1.y) && (rectLine.ry+rectLine.rh >= pt1.y); 
				const pt2Inside = (rectLine.rx <= pt2.x) && (rectLine.rx+rectLine.rw >= pt2.x) && (rectLine.ry <= pt2.y) && (rectLine.ry+rectLine.rh >= pt2.y);
				
				pt1 = pt1Inside ? pt1 : undefined;
				pt2 = pt2Inside ? pt2 : undefined;

				if(pt1Inside || pt2Inside){
					const [x1,y1,x2,y2] = [walls[i][3], walls[i][4], walls[i][5], walls[i][6]];
					const doorTokenId = `${x1}${y1}${x2}${y2}${window.CURRENT_SCENE_DATA.id}`.replaceAll('.','');
					const drawIndex = window.DRAWINGS.findIndex(d => JSON.stringify(d)==JSON.stringify(walls[i]));
					if(window.shiftHeld){
						const currentWall = window.selectedWalls.find(d => d.drawIndex == drawIndex);
					    if(currentWall){
					    	if(pt1 != undefined)
					    		currentWall.pt1 = pt1;
					    	if(pt2 != undefined)
					    		currentWall.pt2 = pt2;
					    }
					    else{
					    	window.selectedWalls.push({pt1: pt1, pt2: pt2, wall: [...walls[i]], tokenId: doorTokenId, drawIndex: drawIndex})
					    }

					}		
					else{
						window.selectedWalls.push({pt1: pt1, pt2: pt2, wall: [...walls[i]], tokenId: doorTokenId, drawIndex: drawIndex})
					}
				}
	    	}


		}
		else{
			const undoArray = [], redoArray = [];
			const originalSelected = JSON.parse(JSON.stringify(window.selectedWalls));
			for(let i=0; i<window.selectedWalls.length; i++){
				const wall = window.selectedWalls[i];
				const index = wall.drawIndex;
				const pt1 = wall.pt1;
				const pt2 = wall.pt2;
				const tokenId = wall.tokenId;
				const adjustedScale = window.DRAWINGS[index][8]/window.CURRENT_SCENE_DATA.scale_factor/window.CURRENT_SCENE_DATA.conversion;					
				const [x1, y1, x2, y2] = [window.DRAWINGS[index][3]/adjustedScale, window.DRAWINGS[index][4]/adjustedScale, window.DRAWINGS[index][5]/adjustedScale, window.DRAWINGS[index][6]/adjustedScale]
				
				redoArray.push([...wall.wall]);	
			
				if(pt1 != undefined){
					wall.pt1 = {'x':x1, 'y':y1};
				}
				if(pt2 != undefined){
					wall.pt2 = {'x':x2, 'y':y2}
				}
						
				if(window.rescalingWalls !== true && window.TOKEN_OBJECTS[tokenId] !== undefined){
					const newOptions = $.extend(true, [], window.TOKEN_OBJECTS[tokenId].options);
					const newId = `${x1*adjustedScale}${y1*adjustedScale}${x2*adjustedScale}${y2*adjustedScale}${window.CURRENT_SCENE_DATA.id}`.replaceAll('.','');
	
	
					const midX = Math.floor((x1+x2)*adjustedScale/2);
					const midY = Math.floor((y1+y2)*adjustedScale/2);
					let options = {
						...newOptions,
						left: `${parseFloat(midX) - 25}px`,
						top: `${parseFloat(midY) - 25}px`,
						id: newId
					};
					window.ScenesHandler.create_update_token(options, noScale=true)
					window.TOKEN_OBJECTS[tokenId].delete();
					window.selectedWalls[i].tokenId = newId;
				}
				else if(window.TOKEN_OBJECTS[tokenId] !== undefined){
					window.TOKEN_OBJECTS[tokenId].options.scaleCreated = window.DRAWINGS[index][8];
					window.TOKEN_OBJECTS[tokenId].sync($.extend(true, {}, window.TOKEN_OBJECTS[tokenId].options));		

					window.selectedWalls[i].pt1 = {'x':x1*adjustedScale, 'y':y1*adjustedScale};
					window.selectedWalls[i].pt2 = {'x':x2*adjustedScale, 'y':y2*adjustedScale}
				}
				undoArray.push([...window.DRAWINGS[index]])
				window.selectedWalls[i].wall = [...window.DRAWINGS[index]];	
			}	
			window.wallUndo.push({undo: [...undoArray], redo:[...redoArray], selectedWalls: originalSelected});
		}

      	redraw_light_walls();
        redraw_drawn_light();
        redraw_light(true);
		sync_drawings();
		window.MB.sendMessage("custom/myVTT/forceRedrawLight");
		window.wallsBeingDragged = [];
	
	}
	else if (window.DRAWFUNCTION === "draw_text"){
		data[0] = "text";
		const textWidth = mousePosition.clientX - window.BEGIN_MOUSEX
		const textHeight = mousePosition.clientY - window.BEGIN_MOUSEY
		data[5] = textWidth
		data[6] = textHeight
		add_text_drawing_input(data);
	}
	else if (window.DRAWFUNCTION == "hide" || window.DRAWFUNCTION == "reveal"){
		finalise_drawing_fog(mouseX, mouseY, width, height)
	}

	else if (window.DRAWFUNCTION == "select") {
		// FIND TOKENS INSIDE THE AREA
		let c = 0;
		for (let id in window.TOKEN_OBJECTS) {
			if(window.TOKEN_OBJECTS[id].options.type == 'door' || window.TOKEN_OBJECTS[id].options.combatGroupToken){
				continue;
			}

			let curr = window.TOKEN_OBJECTS[id];


			let tokenImageRect = $("#tokens>div[data-id='" + curr.options.id + "'] .token-image")[0].getBoundingClientRect();	
			let size = window.TOKEN_OBJECTS[curr.options.id].options.size;	
			let toktop = (parseInt(tokenImageRect.top) + window.scrollY - window.VTTMargin) * (1.0 / window.ZOOM);
			let tokleft = (parseInt(tokenImageRect.left)  + window.scrollX - window.VTTMargin) * (1.0 / window.ZOOM);
			let tokright = (parseInt(tokenImageRect.right) + window.scrollX - window.VTTMargin) * (1.0 / window.ZOOM);
			let tokbottom = (parseInt(tokenImageRect.bottom) + window.scrollY - window.VTTMargin) * (1.0 / window.ZOOM);
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
				let tokenDiv = curr.isLineAoe() ? $(`#tokens>div[data-id='${curr.options.id}'] [data-img]`) : $(`#tokens>div[data-id='${curr.options.id}']`)
				if(tokenDiv.css("pointer-events")!="none" && tokenDiv.css("display")!="none" && !tokenDiv.hasClass("ui-draggable-disabled")) {
					curr.selected = true;
				}
			}

		}
		$("#temp_overlay").css('z-index', '25');
		window.MULTIPLE_TOKEN_SELECTED = (c > 1);
		draw_selected_token_bounding_box();
		

		console.log("READY");
	}
	else if (window.DRAWFUNCTION == "measure") {
		WaypointManager.fadeoutMeasuring(window.PLAYER_ID)
	}
	window.BRUSHPOINTS = null;
}

function drawing_contextmenu(e) {
	const mousePosition = {
		clientX: (e.touches) ? e.touches[0].clientX : e.clientX,
		pageX: (e.touches) ? e.touches[0].pageX : e.pageX,
		clientY: (e.touches) ? e.touches[0].clientY : e.clientY,
		pageY: (e.touches) ? e.touches[0].pageY : e.pageY
	}
	if (window.DRAWSHAPE === "polygon") {
		window.BEGIN_MOUSEX.pop();
		window.BEGIN_MOUSEY.pop();
		if(window.BEGIN_MOUSEX.length > 0){
			let canvas = document.getElementById("temp_overlay");
			let ctx = canvas.getContext("2d");
			clear_temp_canvas();
			drawPolygon(
				ctx,
				joinPointsArray(
					window.BEGIN_MOUSEX,
					window.BEGIN_MOUSEY
				),
				window.DRAWCOLOR,
				window.DRAWTYPE === "fill" || window.DRAWTYPE === "light",
				1,
				Math.round(((mousePosition.pageX - window.VTTMargin) * (1.0 / window.ZOOM))),
				Math.round(((mousePosition.pageY - window.VTTMargin) * (1.0 / window.ZOOM)))
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
			let canvas = document.getElementById("temp_overlay");
			let ctx = canvas.getContext("2d");
			clear_temp_canvas();
			draw3PointRect(
				ctx,
				joinPointsArray(
					window.BEGIN_MOUSEX,
					window.BEGIN_MOUSEY
				),
				window.DRAWCOLOR,
				window.DRAWTYPE === "fill" || window.DRAWTYPE === "light",
				1,
				Math.round(((mousePosition.pageX - window.VTTMargin) * (1.0 / window.ZOOM))),
				Math.round(((mousePosition.pageY - window.VTTMargin) * (1.0 / window.ZOOM)))
			);
		}
		else{
			// cancel polygon if on last point
			clear_temp_canvas();
		}
	}
	else if((window.DRAWFUNCTION == "draw") || (window.DRAWFUNCTION == "elev") || (window.DRAWFUNCTION == "reveal") || (window.DRAWFUNCTION == "hide"))
	{
		// cancel shape
		window.MOUSEDOWN = false;
	
		if (window.DRAWSHAPE !== "paint-bucket")
			clear_temp_canvas();
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
		data = [centerX, centerY, radius, 0, 1, fog_type_to_int(), window.CURRENT_SCENE_DATA.scale_factor*window.CURRENT_SCENE_DATA.conversion];
		window.REVEALED.push(data);
		sync_fog();
		redraw_fog();
	} else if (window.DRAWSHAPE == "rect") {
		data = [window.BEGIN_MOUSEX, window.BEGIN_MOUSEY, width, height, 0, fog_type_to_int(), window.CURRENT_SCENE_DATA.scale_factor*window.CURRENT_SCENE_DATA.conversion];
		window.REVEALED.push(data);
		sync_fog();
		redraw_fog();
	}
	else if(window.DRAWSHAPE == "paint-bucket"){
		data = [mouseX, mouseY, null, null, 4, fog_type_to_int(), window.CURRENT_SCENE_DATA.scale_factor*window.CURRENT_SCENE_DATA.conversion]
		window.REVEALED.push(data);
		sync_fog();
		redraw_fog();
	}
	else if(window.DRAWSHAPE == 'brush'){
			window.BRUSHPOINTS.push({x:mouseX, y:mouseY});
			window.BRUSHPOINTS.push({x:mouseX+1, y:mouseY+1});
			window.BRUSHPOINTS.push({x:mouseX-1, y:mouseY-1});
			data = [
				window.BRUSHPOINTS,
				window.LINEWIDTH,
				null,
				null,
				6,
				fog_type_to_int(), 
				window.CURRENT_SCENE_DATA.scale_factor*window.CURRENT_SCENE_DATA.conversion
			];
			window.REVEALED.push(data);
			sync_fog();
			redraw_fog();
	}
	else if(window.DRAWSHAPE == 'grid-brush'){
		data = [
			window.BRUSHPOINTS,
			window.LINEWIDTH,
			null,
			null,
			7,
			fog_type_to_int(), 
			window.CURRENT_SCENE_DATA.scale_factor*window.CURRENT_SCENE_DATA.conversion
		];
		window.REVEALED.push(data);
		sync_fog();
		redraw_fog();
	}
}



/**
 * Hides all open menus from the top buttons and deselects all the buttons
 */
function deselect_all_top_buttons(buttonSelectedClasses) {
	topButtonIDs = ["select-button", "ruler_button", "fog_button", "draw_button", "aoe_button", "text_button", "wall_button", "vision_button", "elev_button"]
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
	if(window.WIZARDING){
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
		const selectedType = $(menu).find(".ddbc-tab-options__header-heading--is-active[data-type]")?.attr("data-type");

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
			type: selectedType,
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

	$(".drawWidthSlider").on("input change blur", function() {
		window.LINEWIDTH = parseInt($(this).val());
	});

	$(".drawbutton").click(function(e) {
		const buttonSelectedClasses = "button-enabled ddbc-tab-options__header-heading--is-active"
		const clicked = this;
		let menu
		// FIND THE MENU
		// button has a menu
		window.WaypointManager?.clearWaypoints();
		if ($(clicked).hasClass("menu-button")){
			menu = clicked.id.replace("button", "menu" )
			menu = "#" + menu
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
		if(window.CURRENT_SCENE_DATA != undefined){
			if($('#show_walls').hasClass('button-enabled') || $(clicked).is("#wall_button") || $("#wall_button").hasClass('ddbc-tab-options__header-heading--is-active')  || $('.top_menu.visible [data-shape="paint-bucket"]').hasClass('button-enabled')){
				redraw_light_walls();
				$('.hiddenDoor').css('display', 'block');	
				$(`[id*='wallHeight']`).css('display', 'block');
			}
			else{
				$(`[id*='wallHeight']`).css('display', 'none');
				$('#walls_layer').css('display', 'none');		
				$('.hiddenDoor').css('display', '');	
			}

			if($(clicked).is("#elev_button") || $("#elev_button").hasClass('ddbc-tab-options__header-heading--is-active') || $('#show_elev').hasClass('button-enabled')){
				redraw_elev(true);
			}	
			else{
				$('#elev_overlay').css('display', 'none');
				close_elev_legend();
			}
			
		}
		let target =  $("#temp_overlay, #black_layer")
		data = {
			clicked:$(clicked),
			menu:$(menu)
		}
		// allow all drawing to be done above the tokens
		if ($(clicked).is("#select-button")){
			$("#temp_overlay").css({
				"z-index": "25",
				'touch-action' : ''
			})
		}
		else{
			$("#temp_overlay").css({
				"z-index": "50",
				'touch-action' : 'none'
			})
		}
		if (($(clicked).is("#text_button") ||$(clicked).is("#text_select")) && $("#text_select").hasClass('ddbc-tab-options__header-heading--is-active')){
			$("#text_div").css("z-index", "51")
		}
		else{
			$("#text_div").css("z-index", "20")
		}
		if ($("#vision_button").hasClass('ddbc-tab-options__header-heading--is-active')){
			$("#temp_overlay").css("mix-blend-mode", "soft-light")
		}
		else{
			$("#temp_overlay").css("mix-blend-mode", "")
		}
		const drawData = get_draw_data(data.clicked,  data.menu)

		window.LINEWIDTH = drawData.draw_line_width
		window.DRAWTYPE = (drawData.from == 'vision_menu') ? 'light' : drawData.fill
		window.DRAWCOLOR = drawData.background_color
		window.DRAWLOCATION = drawData.location
		window.DRAWSHAPE = window.drawAudioPolygon ? 'polygon' : drawData.shape;
		window.DRAWFUNCTION = window.drawAudioPolygon ? 'audio-polygon' : drawData.function;

		target.on('mousedown touchstart', data, drawing_mousedown);
		target.on('mouseup touchend',  data, drawing_mouseup);
		target.on('mousemove touchmove', data, drawing_mousemove);
		target.on('contextmenu', data, drawing_contextmenu);
		
	})
	$("#door_types").click(function(){
		if(!$(`#draw_door`).hasClass('button-enabled') && !$(`#draw_door_convert`).hasClass('button-enabled') && !$(`#draw_door_erase`).hasClass('button-enabled')  && !$(`#draw_door_hidden`).hasClass('button-enabled')){
			$('#wall_menu .ddbc-tab-options__header-heading--is-active:not(#show_walls)').toggleClass(['button-enabled','ddbc-tab-options__header-heading--is-active'], false);
			$(`#draw_door_erase`).toggleClass(['button-enabled','ddbc-tab-options__header-heading--is-active'], true)
		}
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

function drawRect(ctx, startx, starty, width, height, style, fill=true, lineWidth = 6, addStrokeToFill = false, addDottedStrokeToBorder)
{
	ctx.beginPath();
	ctx.lineWidth = lineWidth;
	ctx.strokeStyle = style;
	ctx.fillStyle = style;
	if(fill)
	{
		ctx.rect(startx/window.CURRENT_SCENE_DATA.scale_factor, starty/window.CURRENT_SCENE_DATA.scale_factor, width/window.CURRENT_SCENE_DATA.scale_factor, height/window.CURRENT_SCENE_DATA.scale_factor);
		ctx.fill()
		if(addStrokeToFill){
			ctx.stroke();
		}
	}
	else
	{
		ctx.rect(startx/window.CURRENT_SCENE_DATA.scale_factor, starty/window.CURRENT_SCENE_DATA.scale_factor, width/window.CURRENT_SCENE_DATA.scale_factor, height/window.CURRENT_SCENE_DATA.scale_factor);
		ctx.stroke();
		if(addDottedStrokeToBorder){
			ctx.setLineDash([2*lineWidth, 2*lineWidth])
			ctx.strokeStyle = `rgba(0,0,0,1)`;
			ctx.stroke();
			ctx.setLineDash([]);
		}
	}

}

function drawCone(ctx, startx, starty, endx, endy, style, fill=true, lineWidth = 6, addStrokeToFill = false)
{
	let L = Math.sqrt(Math.pow(endx - startx, 2) + Math.pow(endy - starty, 2));
	let T = Math.sqrt(Math.pow(L, 2) + Math.pow(L / 2, 2));
	let res = circle_intersection(startx, starty, T, endx, endy, L / 2);
	ctx.beginPath();
	ctx.moveTo(startx/window.CURRENT_SCENE_DATA.scale_factor, starty/window.CURRENT_SCENE_DATA.scale_factor);
	ctx.lineTo(res[0]/window.CURRENT_SCENE_DATA.scale_factor, res[2]/window.CURRENT_SCENE_DATA.scale_factor);
	ctx.lineTo(res[1]/window.CURRENT_SCENE_DATA.scale_factor, res[3]/window.CURRENT_SCENE_DATA.scale_factor);
	ctx.closePath();
	if(fill){
		ctx.fillStyle = style;
		ctx.fill();
		if(addStrokeToFill){
			ctx.lineWidth = lineWidth;
			ctx.strokeStyle = style;
			ctx.stroke();
		}
	}
	else{
		ctx.lineWidth = lineWidth;
		ctx.strokeStyle = style;
		ctx.stroke();
	}

}

function drawLine(ctx, startx, starty, endx, endy, style, lineWidth = 6, scale=window.CURRENT_SCENE_DATA.scale_factor, addStroke = false)
{
	ctx.beginPath();
	ctx.strokeStyle = style;
	ctx.lineWidth = lineWidth;

	let adjustScale = (scale/window.CURRENT_SCENE_DATA.scale_factor);	

	ctx.moveTo(startx/adjustScale/window.CURRENT_SCENE_DATA.scale_factor, starty/adjustScale/window.CURRENT_SCENE_DATA.scale_factor);
	ctx.lineTo(endx/adjustScale/window.CURRENT_SCENE_DATA.scale_factor, endy/adjustScale/window.CURRENT_SCENE_DATA.scale_factor);
	ctx.stroke();

	if(addStroke == true){
		ctx.setLineDash([2*lineWidth, 2*lineWidth])
		ctx.strokeStyle = `rgba(0,0,0,0.4)`;
		ctx.moveTo(startx/adjustScale/window.CURRENT_SCENE_DATA.scale_factor, starty/adjustScale/window.CURRENT_SCENE_DATA.scale_factor);
		ctx.lineTo(endx/adjustScale/window.CURRENT_SCENE_DATA.scale_factor, endy/adjustScale/window.CURRENT_SCENE_DATA.scale_factor);
		ctx.stroke();
		ctx.setLineDash([]);
	}
}

function drawBrushstroke(ctx, points, style, lineWidth=6, scale=window.CURRENT_SCENE_DATA.scale_factor)
{
	// Copyright (c) 2021 by Limping Ninja (https://codepen.io/LimpingNinja/pen/qBmpvqj)
    // Fork of an original work  (https://codepen.io/kangax/pen/pxfCn
	let p1 = points[0];
	let p2 = points[1];
	ctx.save();


	ctx.strokeStyle = style;
	ctx.lineWidth = lineWidth;
	ctx.beginPath();

	let adjustScale = (scale/window.CURRENT_SCENE_DATA.scale_factor)	

	ctx.moveTo(p1.x/adjustScale/window.CURRENT_SCENE_DATA.scale_factor, p1.y/adjustScale/window.CURRENT_SCENE_DATA.scale_factor);

	for (let i = 1, len = points.length; i < len; i++) {
		let midPoint = midPointBtw(p1, p2);	
		ctx.quadraticCurveTo(p1.x/adjustScale/window.CURRENT_SCENE_DATA.scale_factor, p1.y/adjustScale/window.CURRENT_SCENE_DATA.scale_factor, midPoint.x/adjustScale/window.CURRENT_SCENE_DATA.scale_factor, midPoint.y/adjustScale/window.CURRENT_SCENE_DATA.scale_factor);
		p1 = points[i];
		p2 = points[i+1];
	}	
	// Draw last line as a straight line
	ctx.lineTo(p1.x/adjustScale/window.CURRENT_SCENE_DATA.scale_factor, p1.y/adjustScale/window.CURRENT_SCENE_DATA.scale_factor);
	ctx.stroke();

	ctx.restore();
	
}

function drawBrushArrow(ctx, points, style, lineWidth=6, scale=window.CURRENT_SCENE_DATA.scale_factor, fill = [])
{
	// Copyright (c) 2021 by Limping Ninja (https://codepen.io/LimpingNinja/pen/qBmpvqj)
    // Fork of an original work  (https://codepen.io/kangax/pen/pxfCn

	let p1 = points[0];
	let p2 = points[1];


	ctx.strokeStyle = style;
	ctx.lineWidth = lineWidth;
	ctx.beginPath();
	if(fill == 'dot'){
		ctx.setLineDash([lineWidth, 3*lineWidth])
	}
	else if(fill == 'dash'){
		ctx.setLineDash([5*lineWidth, 5*lineWidth])
	}
		

	let adjustScale = (scale/window.CURRENT_SCENE_DATA.scale_factor)	

	ctx.moveTo(p1.x/adjustScale/window.CURRENT_SCENE_DATA.scale_factor, p1.y/adjustScale/window.CURRENT_SCENE_DATA.scale_factor);

	for (let i = 1, len = points.length; i < len; i++) {
	// we pick the point between pi+1 & pi+2 as the
	// end point and p1 as our control point
	let midPoint = midPointBtw(p1, p2);
	ctx.quadraticCurveTo(p1.x/adjustScale/window.CURRENT_SCENE_DATA.scale_factor, p1.y/adjustScale/window.CURRENT_SCENE_DATA.scale_factor, midPoint.x/adjustScale/window.CURRENT_SCENE_DATA.scale_factor, midPoint.y/adjustScale/window.CURRENT_SCENE_DATA.scale_factor);
	p1 = points[i];
	p2 = points[i+1];
	}

	ctx.lineTo(p1.x/adjustScale/window.CURRENT_SCENE_DATA.scale_factor, p1.y/adjustScale/window.CURRENT_SCENE_DATA.scale_factor);
	ctx.stroke();

	
	if(points.length <= 4)
		return;
	let toy = points[points.length-1].y;
	let tox = points[points.length-1].x;
	let fromy = points[points.length-4].y;
	let fromx = points[points.length-4].x;

	let angle = Math.atan2(toy - fromy, tox - fromx);




	// calculate the points.
	let arrowPoints = [
	    {
	        x: tox, 
	        y: toy
		}, 
	   	{
		    x: tox - (2)*window.CURRENT_SCENE_DATA.scale_factor*adjustScale * Math.cos(angle) - 3*window.CURRENT_SCENE_DATA.scale_factor*adjustScale*Math.cos(angle - Math.PI/2),
		    y: toy - (2)*window.CURRENT_SCENE_DATA.scale_factor*adjustScale * Math.sin(angle) - 3*window.CURRENT_SCENE_DATA.scale_factor*adjustScale*Math.sin(angle - Math.PI/2)
		},{
		    x: tox + 6*window.CURRENT_SCENE_DATA.scale_factor*adjustScale*Math.cos(angle),  // tip
		    y: toy + 6*window.CURRENT_SCENE_DATA.scale_factor*adjustScale*Math.sin(angle)
		}, {
		    x: tox - (2)*window.CURRENT_SCENE_DATA.scale_factor*adjustScale * Math.cos(angle) - 3*window.CURRENT_SCENE_DATA.scale_factor*adjustScale*Math.cos(angle + Math.PI/2),
		    y: toy - (2)*window.CURRENT_SCENE_DATA.scale_factor*adjustScale * Math.sin(angle) - 3*window.CURRENT_SCENE_DATA.scale_factor*adjustScale*Math.sin(angle + Math.PI/2)
		}
	];
	ctx.setLineDash([])
	drawPolygon(ctx, arrowPoints, style, false, Math.max(lineWidth, 1), undefined, undefined, scale);
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
	if(fill && islight && replacefog){
		
		ctx.lineWidth = 6;
		ctx.fillStyle = 'rgba(255,255,255,1)';
		ctx.strokeStyle = 'rgba(0,0,0,1)';
		
		ctx.beginPath();
		let adjustScale = (scale/window.CURRENT_SCENE_DATA.scale_factor)	
		
		ctx.moveTo(points[0].x/adjustScale/window.CURRENT_SCENE_DATA.scale_factor, points[0].y/adjustScale/window.CURRENT_SCENE_DATA.scale_factor);
		ctx.lineWidth = lineWidth;
		
		for(let vertice of points){
			ctx.lineTo(vertice.x/adjustScale/window.CURRENT_SCENE_DATA.scale_factor, vertice.y/adjustScale/window.CURRENT_SCENE_DATA.scale_factor);
		}

		if (mouseX !== null && mouseY !== null) {
			ctx.lineTo(mouseX/adjustScale/window.CURRENT_SCENE_DATA.scale_factor, mouseY/adjustScale/window.CURRENT_SCENE_DATA.scale_factor);
		}
		ctx.closePath();
		
	
		ctx.fill();
		ctx.stroke();

	}
	else{
		ctx.save();
		ctx.beginPath();
		let adjustScale = (scale/window.CURRENT_SCENE_DATA.scale_factor)	
		
		ctx.moveTo(points[0].x/adjustScale/window.CURRENT_SCENE_DATA.scale_factor, points[0].y/adjustScale/window.CURRENT_SCENE_DATA.scale_factor);
		ctx.lineWidth = lineWidth;
			
		for(let vertice of points) {
			ctx.lineTo(vertice.x/adjustScale/window.CURRENT_SCENE_DATA.scale_factor, vertice.y/adjustScale/window.CURRENT_SCENE_DATA.scale_factor);
		}

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
		}
		else{
			ctx.strokeStyle = style;
			ctx.stroke();
		}
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
	islight = false,
	clear = false
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
		if(clear){
			ctx.fillStyle = "#000";
			ctx.globalCompositeOperation = 'destination-out';
			ctx.fill();
			ctx.fillStyle = style;
			ctx.globalCompositeOperation = 'source-over';
		}
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
    let length = Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
    let angle = Math.atan2(point2.y - point1.y, point2.x - point1.x);
    let dx = Math.cos(angle) * length;
    let dy = Math.sin(angle) * length;
    return { x: point3.x - dx, y: point3.y - dy };
}
function clear_temp_canvas(playerId=window.PLAYER_ID){
	window.temp_context.clearRect(0, 0, window.temp_canvas.width, window.temp_canvas.height); 
}

function bucketFill(ctx, mouseX, mouseY, fogStyle = 'rgba(0,0,0,0)', fogType=0, islight=false, distance1=10000, distance2){
	if(window.PARTICLE == undefined){
		initParticle(new Vector(200, 200), 1);
	}
	let fog = true;
  	particleUpdate(mouseX, mouseY); // moves particle
  	let darknessBoundarys = getDarknessBoundarys();
  	if(distance1 != 0){
  		particleLook(ctx, [...window.walls, ...darknessBoundarys], distance1, fog, fogStyle, fogType, true, islight); 
  	}

	if(distance2 != undefined){
		function halfLuminosity(rgbaStr) {
			const m = rgbaStr
				.replace(/\s+/g, '')
				.match(/^rgba?\((\d{1,3}\.?\d*),(\d{1,3}\.?\d*),(\d{1,3}\.?\d*)(?:,([01]?\.?\d*))?\)$/i);
			if (!m) 
				return rgbaStr;

			let r = m[1] * 0.5;
			let g = m[2] * 0.5;
			let b = m[3] * 0.5;
			const a = m[4] !== undefined ? parseFloat(m[4]) : 1;


			return `rgba(${r}, ${g}, ${b}, ${a})` 
		}
		distance2+=distance1;
		particleLook(ctx, [...window.walls, ...darknessBoundarys], distance2, fog, halfLuminosity(fogStyle), fogType, true, islight); 
	}

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
			window.CURRENT_SCENE_DATA.scale_factor*window.CURRENT_SCENE_DATA.conversion
		];
		window.REVEALED.push(data);
		redraw_fog();
	}
	else if(window.DRAWFUNCTION === "wall"){

		polygonPoints[3] = calculateFourthPoint(polygonPoints[0], polygonPoints[1], polygonPoints[2]);
		let undoArray = []
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
				window.CURRENT_SCENE_DATA.scale_factor*window.CURRENT_SCENE_DATA.conversion,
				0,
				window.wallBottom,
				window.wallTop];
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
				window.CURRENT_SCENE_DATA.scale_factor*window.CURRENT_SCENE_DATA.conversion,
				0,
				window.wallBottom,
				window.wallTop];
			}
			window.DRAWINGS.push(data);
			undoArray.push([...data]);
		}

		window.wallUndo.push({
			undo: [...undoArray]
		});
			

		window.MOUSEDOWN = false;
		redraw_light_walls();
        redraw_drawn_light();
        redraw_light();
	}
	else if(window.DRAWFUNCTION === "elev"){
		data = [
			'3pointRect',
			'elev',
			window.mapElev,
			polygonPoints,
			null,
			null,
			null,
			window.LINEWIDTH,
			window.CURRENT_SCENE_DATA.scale_factor*window.CURRENT_SCENE_DATA.conversion
		];
		window.DRAWINGS.push(data);	
		redraw_elev();
		redraw_drawn_light();
		redraw_drawings();
	}
	else{
		data = [
			'3pointRect',
			window.DRAWTYPE,
			(window.DRAWDAYLIGHT) ? window.DRAWDAYLIGHT : window.DRAWCOLOR,
			polygonPoints,
			null,
			null,
			null,
			window.LINEWIDTH,
			window.CURRENT_SCENE_DATA.scale_factor*window.CURRENT_SCENE_DATA.conversion,
			window.DRAWLOCATION
		];
		window.DRAWINGS.push(data);	
		redraw_drawn_light();
		redraw_drawings();
	}
	clear_temp_canvas()

	if (window.DRAWFUNCTION === "draw" || window.DRAWFUNCTION === "wall" || window.DRAWFUNCTION === 'elev') {
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
			window.CURRENT_SCENE_DATA.scale_factor*window.CURRENT_SCENE_DATA.conversion
		];
		window.REVEALED.push(data);
		redraw_fog();
	}
	else if(window.DRAWFUNCTION === "elev"){
		data = [
			'polygon',
			'elev',
			window.mapElev,
			polygonPoints,
			null,
			null,
			null,
			window.LINEWIDTH,
			window.CURRENT_SCENE_DATA.scale_factor*window.CURRENT_SCENE_DATA.conversion
		];
		window.DRAWINGS.push(data);
		redraw_elev();
		redraw_drawn_light();
		redraw_drawings();
	}
	else if(window.DRAWFUNCTION === 'audio-polygon'){
		const token = window.TOKEN_OBJECTS[window.drawingAudioTokenId];
		token.options.audioChannel.audioArea = polygonPoints;
		token.options.audioChannel.audioAreaOrigScale = window.CURRENT_SCENE_DATA.scale_factor;
		token.place_sync_persist();
		debounceAudioChecks();
		delete window.drawingAudioTokenId 
		delete window.drawAudioPolygon
	}
	else{
		data = [
			'polygon',
			window.DRAWTYPE,
			(window.DRAWDAYLIGHT) ? window.DRAWDAYLIGHT : window.DRAWCOLOR,
			polygonPoints,
			null,
			null,
			null,
			window.LINEWIDTH,
			window.CURRENT_SCENE_DATA.scale_factor*window.CURRENT_SCENE_DATA.conversion,
			window.DRAWLOCATION
		];
		window.DRAWINGS.push(data);
		redraw_drawn_light();
		redraw_drawings();
	}
	clear_temp_canvas()

	if (window.DRAWFUNCTION === "draw" || window.DRAWFUNCTION === 'elev') {
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
	ctx.save();
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
	ctx.save();
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

function init_ruler_menu(buttons){
	const storedRulerSelection = localStorage.getItem('RulerSettings' + window.gameid);
	let ruler_menu = $("<div id='ruler_menu' class='top_menu'></div>");
	ruler_menu.append(
		`<div class='ddbc-tab-options--layout-pill'>
			<button id='ruler_raw' class='ddbc-tab-options__header-heading drawbutton menu-option ruler-option ${(storedRulerSelection == 'raw' || storedRulerSelection == null) ? 'button-enabled ddbc-tab-options__header-heading--is-active' : ''}'
				data-shape='line' data-function="measure" data-type="raw" data-unique-with="ruler" >
					${window.CURRENT_SCENE_DATA.fpsq} ${window.CURRENT_SCENE_DATA.upsq} per Grid
			</button>
		</div>`);
		ruler_menu.append(
		`<div class='ddbc-tab-options--layout-pill'>
			<button id='ruler_fiveten' class='ddbc-tab-options__header-heading drawbutton menu-option ruler-option ${(storedRulerSelection == 'fiveten')? 'button-enabled ddbc-tab-options__header-heading--is-active' : ''}'
				data-shape='line' data-function="measure" data-type="fiveten" data-unique-with="ruler" >
					${parseFloat(window.CURRENT_SCENE_DATA.fpsq)} ${parseFloat(window.CURRENT_SCENE_DATA.fpsq)*2} ${parseFloat(window.CURRENT_SCENE_DATA.fpsq)} diagonal
			</button>
		</div>`);
	ruler_menu.append(
		`<div class='ddbc-tab-options--layout-pill'>
			<button id='ruler_euc' class='ddbc-tab-options__header-heading drawbutton menu-option ruler-option ${(storedRulerSelection == 'euclidean')? 'button-enabled ddbc-tab-options__header-heading--is-active' : ''}'
				data-shape='line' data-function="measure" data-type="euclidean" data-unique-with="ruler" >
					Euclidean
			</button>
		</div>`);


	ruler_menu.css("position", "fixed");
	ruler_menu.css("top", "25px");
	ruler_menu.css("width", "110px");
	ruler_menu.css('background', "url('/content/1-0-1487-0/skins/waterdeep/images/mon-summary/paper-texture.png')")
	$("body").append(ruler_menu);


	let ruler_button = $("<button style='display:inline;width:75px;' id='ruler_button' class='drawbutton menu-button hideable ddbc-tab-options__header-heading'><u>R</u>ULER</button>");


	ruler_button.off('click.update').on('click.update', function(){
		$('#ruler_raw').text(`${window.CURRENT_SCENE_DATA.fpsq} ${window.CURRENT_SCENE_DATA.upsq} per Grid`);
		$('#ruler_fiveten').text(`${parseFloat(window.CURRENT_SCENE_DATA.fpsq)} ${parseFloat(window.CURRENT_SCENE_DATA.fpsq)*2} ${parseFloat(window.CURRENT_SCENE_DATA.fpsq)} diagonal`);
	});

	ruler_menu.find('button').off('click.store').on('click.store', function(){
		localStorage.setItem('RulerSettings' + window.gameid, $(this).attr('data-type'));
	})

	buttons.append(ruler_button);

	ruler_menu.css("left", ruler_button.position().left);

}

function init_fog_menu(buttons){



	let fog_menu = $("<div id='fog_menu' class='top_menu'></div>");
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
			<button id='draw_brush' class='drawbutton menu-option  ddbc-tab-options__header-heading'
				data-shape='brush' data-function="reveal" data-unique-with="fog">
					Brush
			</button>
		</div>`);
	fog_menu.append(
		`<div class='ddbc-tab-options--layout-pill'>
			<button id='draw_grid_brush_r' class='drawbutton menu-option  ddbc-tab-options__header-heading'
				data-shape='grid-brush' data-function="reveal" data-unique-with="fog">
					Grid Brush
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
					Point LoS Fill
			</button>
		</div>`);

	let clear_button = $("<button class='ddbc-tab-options__header-heading menu-option' data-skip='true' >ALL</button>");
	clear_button.click(function() {

		r = confirm("This will delete all FOG zones and REVEAL ALL THE MAP to the player. THIS CANNOT BE UNDONE. Are you sure?");
		if (r == true) {
			window.REVEALED = [[0, 0, 0, 0, 2, 0]];

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
			<button id='draw_brush' class='drawbutton menu-option  ddbc-tab-options__header-heading'
				data-shape='brush' data-function="hide" data-unique-with="fog">
					Brush
			</button>
		</div>`);
	fog_menu.append(
		`<div class='ddbc-tab-options--layout-pill'>
			<button id='draw_grid_brush_h' class='drawbutton menu-option  ddbc-tab-options__header-heading'
				data-shape='grid-brush' data-function="hide" data-unique-with="fog">
					Grid Brush
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
					Point LoS Fill
			</button>
		</div>`);



	let hide_all_button = $("<button class='ddbc-tab-options__header-heading menu-option'>ALL</button>");
	hide_all_button.click(function() {
		r = confirm("This will delete all FOG zones and HIDE ALL THE MAP to the player. THIS CANNOT BE UNDONE. Are you sure?");
		if (r == true) {
			window.REVEALED = [];
			redraw_fog();
			sync_fog();
		}
	});

	fog_menu.append($("<div class='ddbc-tab-options--layout-pill' data-skip='true'/>").append(hide_all_button));
	fog_menu.append("<div class='menu-subtitle'>Line Width</div>");
	fog_menu.append(`
		<div>
			<input id='draw_line_width' data-required="draw_line_width" type='number' style='width:90%' min='1'
			value='${window.CURRENT_SCENE_DATA.hpps}' class='drawWidthSlider'>
		</div>`
	);
	fog_menu.append("<div class='menu-subtitle'>Controls</div>");

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
	fog_menu.find("#fog_undo").click(function(){
		window.REVEALED.pop();
		redraw_fog();
		sync_fog();
	});

	let fog_button = $("<button style='display:inline;width:75px;' id='fog_button' class='drawbutton menu-button hideable ddbc-tab-options__header-heading'><u>F</u>OG</button>");

	buttons.append(fog_button);
	fog_menu.css("left", fog_button.position().left);
}
function get_available_doors(){
    return {
		0: `door`,
		1: `window`,
		2: `Locked Door`,
		3: `Locked Window`,
		4: `Secret Door`,
		5: `Secret Locked Door`,
		6: `Secret Window`,
		7: `Secret Locked Window`,
		8: `Curtain`,
		9: `Locked Curtain`,
		10: `Secret Curtain`,
		11: `Secret Locked Curtain`,
		12: `Portal`,
		13: `Secret Portal`
	}
}

function init_draw_menu(buttons){
	let draw_menu = $("<div id='draw_menu' class='top_menu'></div>");
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
			<button id='draw_brush_arrow' class='drawbutton menu-option  ddbc-tab-options__header-heading'
				data-shape='brush-arrow' data-function="draw" data-unique-with="draw">
					Arrow
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
				 	Point LoS Fill
			</button>
		</div>`);
	}
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
				data-key="fill" data-value='border' data-toggle='true' data-unique-with="fill">
				BORDER
			</button>
		</div>`);
	draw_menu.append(
		`<div class='ddbc-tab-options--layout-pill'>
			<button class='drawbutton menu-option ddbc-tab-options__header-heading'
				data-key="fill" data-value='filled' data-toggle='true' data-unique-with="fill">
				FILLED
			</button>
		</div>`);
		draw_menu.append(
		`<div class='ddbc-tab-options--layout-pill'>
			<button class='drawbutton menu-option ddbc-tab-options__header-heading'
				data-key="fill" data-value='dot' data-toggle='true' data-unique-with="fill">
				DOTTED
			</button>
		</div>`);
		draw_menu.append(
		`<div class='ddbc-tab-options--layout-pill'>
			<button class='drawbutton menu-option ddbc-tab-options__header-heading'
				data-key="fill" data-value='dash' data-toggle='true' data-unique-with="fill">
				DASHED
			</button>
		</div>`);
		
	draw_menu.append("<div class='menu-subtitle'>Draw Location</div>");
	draw_menu.append(
		`<div class='ddbc-tab-options--layout-pill'>
			<button class='drawbutton menu-option ddbc-tab-options__header-heading button-enabled ddbc-tab-options__header-heading--is-active'
				data-key="location" data-value='above' data-toggle='true' data-unique-with="location">
				ABOVE FOG
			</button>
		</div>`);
	draw_menu.append(
		`<div class='ddbc-tab-options--layout-pill'>
			<button class='drawbutton menu-option ddbc-tab-options__header-heading'
				data-key="location" data-value='below' data-toggle='true' data-unique-with="location">
				BELOW FOG
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
	draw_menu.append(`
	<div class='ddbc-tab-options--layout-pill' data-skip='true'>
		<button class='ddbc-tab-options__header-heading  menu-option' id='draw_undo'>
			UNDO
		</button>
	</div>`);
	if(window.DM){

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
			// keep only text, walls, light
			window.DRAWINGS = window.DRAWINGS.filter(d => d[0].includes("text") || d[1].includes('wall') || d[1].includes('light') || d[1].includes('elev'));
			redraw_drawings()
			sync_drawings()
		}
	});

	draw_menu.find("#draw_undo").click(function() {
		// start at the end
        let currentElement = window.DRAWINGS.length
        // loop from the last element and remove if it's not text
        if(!window.DM){
        	currentElement = window.playerDrawUndo.length;
        	 while (currentElement--) {
        	 	if(!window.DRAWINGS.some(d => JSON.stringify(d) == JSON.stringify(window.playerDrawUndo[currentElement]))){
        	 		window.playerDrawUndo.splice(currentElement, 1)
        	 	}
        	 	else{
        	 		break;
        	 	}	
        	 }
        	window.DRAWINGS = window.DRAWINGS.filter(d => JSON.stringify(d) != JSON.stringify(window.playerDrawUndo[window.playerDrawUndo.length-1]))
        	window.playerDrawUndo.splice(window.playerDrawUndo.length-1, 1)
		    redraw_drawn_light();
            redraw_drawings()
			sync_drawings(false)
        }
        else{
	        while (currentElement--) {
	            if (!window.DRAWINGS[currentElement][0].includes("text") && !['wall', 'light', 'elev'].includes(window.DRAWINGS[currentElement][1])){     
	                window.DRAWINGS.splice(currentElement, 1)
	                redraw_drawn_light();
	                redraw_drawings()
					sync_drawings()
	                break
	            }
	        }
        }

	});

	draw_menu.css("position", "fixed");
	draw_menu.css("top", "50px");
	draw_menu.css("width", "90px");
	draw_menu.css('background', "url('/content/1-0-1487-0/skins/waterdeep/images/mon-summary/paper-texture.png')")

	$("body").append(draw_menu);

	let draw_button = $("<button style='display:inline;width:75px' id='draw_button' class='drawbutton menu-button hideable ddbc-tab-options__header-heading'><u>D</u>RAW</button>");

	buttons.append(draw_button);
	draw_menu.css("left",draw_button.position().left);
}
function init_walls_menu(buttons){
	let wall_menu = $("<div id='wall_menu' class='top_menu'></div>");

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
	`<div class='ddbc-tab-options--layout-pill'>
		<button id='draw_line' class='drawbutton menu-option  ddbc-tab-options__header-heading'
			data-shape='line' data-function="wall" data-type="terrain" data-unique-with="draw">
				Object Wall
		</button>
	</div>`);
	wall_menu.append(
		`<div class='ddbc-tab-options--layout-pill menu-option data-skip='true''>
			<button id='draw_height_convert' class='drawbutton menu-option  ddbc-tab-options__header-heading'
				data-shape='rect' data-function="wall-height-convert" data-unique-with="draw">
				 	Height Convert
			</button>
		</div>`);
	wall_menu.append("<div class='wall-input menu-subtitle'>Wall Base</div>");
	wall_menu.append(
		`<div>
			<input id='wall_base_height' type='number' step='5' data-required="wall_base_height" style='width:90%'
			value='' >
		</div>`);
	wall_menu.append("<div class='wall-input menu-subtitle'>Wall Top</div>");
	wall_menu.append(
		`<div>
			<input id='wall_top_height' type='number' step='5' data-required="wall_top_height" style='width:90%'
			value=''>
		</div>`);
    wall_menu.append("<div class='menu-subtitle'>Door/Windows</div>");
    wall_menu.append(
        `<div class='ddbc-tab-options--layout-pill'>
            <select id='door_types' class="ddbc-select ddbc-tab-options__header-heading" >
	            ${Object.entries(get_available_doors()).map(([k, doorType]) => {
				    	return `<option class="ddbc-tab-options__header-heading" value="${k}">${doorType}</option>`;
				   	}
				)}  
            </select>
        </div>
            `)

	wall_menu.append(
	`<div class='ddbc-tab-options--layout-pill menu-option data-skip='true''>
		<button id='draw_door' class='drawbutton menu-option  ddbc-tab-options__header-heading'
			data-shape='line' data-function="wall-door" data-unique-with="draw">
			 	Draw Selected
		</button>
	</div>`);
	wall_menu.append(
		`<div class='ddbc-tab-options--layout-pill menu-option data-skip='true''>
			<button id='draw_door_erase' class='drawbutton menu-option  ddbc-tab-options__header-heading'
				data-shape='rect' data-function="wall-door-convert" data-unique-with="draw">
				 	Wall>Selected
			</button>
		</div>`);
	wall_menu.append(
		`<div class='ddbc-tab-options--layout-pill menu-option data-skip='true''>
			<button id='draw_door_hidden' class='drawbutton menu-option  ddbc-tab-options__header-heading'
				data-shape='line' data-function="wall-door" data-unique-with="draw" data-hidden="true">
				 	Hidden Icon
			</button>
		</div>`);
	wall_menu.append(
		`<div class='ddbc-tab-options--layout-pill menu-option data-skip='true''>
			<button id='draw_door_convert' class='drawbutton menu-option  ddbc-tab-options__header-heading'
				data-shape='rect' data-function="door-door-convert" data-unique-with="draw">
				 	Door Convert
			</button>
		</div>`);
	wall_menu.append("<div class='menu-subtitle'>Controls</div>");
	wall_menu.append(
		`<div class='ddbc-tab-options--layout-pill menu-option data-skip='true''>
			<button id='edit_wall' class='drawbutton menu-option  ddbc-tab-options__header-heading'
				data-shape='rect' data-function="wall-edit" data-unique-with="draw">
				 	Edit Points
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
		`<div class='ddbc-tab-options--layout-pill menu-option data-skip='true''>
			<button id='show_walls' data-toggle='true' class='drawbutton menu-option ddbc-tab-options__header-heading ${(window.showWallsToggle) ? "button-enabled" : ''}'>
				Always Show
			</button>
		</div>`);
	wall_menu.append(`
			<div class='ddbc-tab-options--layout-pill' data-skip='true'>
				<button class='ddbc-tab-options__header-heading  menu-option' id='wall_undo'>
					UNDO
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
			window.selectedWalls = [];
			window.DRAWINGS = window.DRAWINGS.filter(d => d[1] !== "wall");
			for(let token in window.TOKEN_OBJECTS){
				if(window.TOKEN_OBJECTS[token].options.type=='door'){
					window.TOKEN_OBJECTS[token].delete(true);
				}
			}
			redraw_light_walls();
			redraw_drawn_light();
			redraw_light();
			sync_drawings();
		}
	});
	wall_menu.find("#wall_undo").click(function() {

        let wallUndo = window.wallUndo.pop();
        if(wallUndo){
        	if(wallUndo.undo != undefined){
				for(let i=0; i<wallUndo.undo.length; i++){
					let x = wallUndo.undo[i][3],
					y = wallUndo.undo[i][4],
					width = wallUndo.undo[i][5],
					height = wallUndo.undo[i][6];

					let tokenObject = window.TOKEN_OBJECTS[`${x}${y}${width}${height}${window.CURRENT_SCENE_DATA.id}`.replaceAll('.','')];		
					let doorInRedo = wallUndo.redo != undefined ? wallUndo.redo.filter(d=> d[3] == x && d[4] == y && d[5] == width && d[6] == height) : [];

					if(doorInRedo.length == 0 && tokenObject != undefined && tokenObject.options.type == 'door'){
						tokenObject.delete();
					}
	        		window.DRAWINGS = window.DRAWINGS.filter(d => !wallUndo.undo[i].every((value, index) => value === d[index]));
	        	}
	        }
	        if(wallUndo.redo != undefined){
	        	for(let i=0; i<wallUndo.redo.length; i++){
	        		window.DRAWINGS.push(wallUndo.redo[i])
	        	}
	        }
	        if(wallUndo.selectedWalls != undefined){
	        	window.selectedWalls = [...wallUndo.selectedWalls]
	        }
          	redraw_light_walls();
	        redraw_drawn_light();
	        redraw_light();
			sync_drawings();
        }   
	});

	wall_menu.css("position", "fixed");
	wall_menu.css("top", "50px");
	wall_menu.css("width", "110px");
	wall_menu.css('background', "url('/content/1-0-1487-0/skins/waterdeep/images/mon-summary/paper-texture.png')")

	$("body").append(wall_menu);

	let wall_button = $("<button style='display:inline;width:75px' id='wall_button' class='drawbutton menu-button hideable ddbc-tab-options__header-heading'><u>W</u>alls</button>");
	buttons.append(wall_button);
	wall_menu.css("left",wall_button.position().left);
}
function init_elev_menu(buttons){
	let elev_menu = $("<div id='elev_menu' class='top_menu'></div>");

	elev_menu.append(
		`<div class='ddbc-tab-options--layout-pill'>
			<button id='draw_line' class='drawbutton menu-option  ddbc-tab-options__header-heading'
				data-shape='polygon' data-function="elev" data-unique-with="draw">
					Elev Poly
			</button>
		</div>`);
	elev_menu.append(
	`<div class='ddbc-tab-options--layout-pill'>
		<button id='draw_line' class='drawbutton menu-option  ddbc-tab-options__header-heading'
			data-shape='rect' data-function="elev" data-unique-with="draw">
				Elev Rect
		</button>
	</div>`);
	elev_menu.append(
	`<div class='ddbc-tab-options--layout-pill'>
		<button id='draw_line' class='drawbutton menu-option  ddbc-tab-options__header-heading'
			data-shape='3pointRect' data-function="elev" data-unique-with="draw">
				3p Rect
		</button>
	</div>`);
	elev_menu.append(
		`<div class='ddbc-tab-options--layout-pill'>
			<button id='draw_circle' class='drawbutton menu-option  ddbc-tab-options__header-heading'
				data-shape='arc' data-function="elev" data-unique-with="draw">
					Circle
			</button>
		</div>`);
	elev_menu.append(
		`<div class='ddbc-tab-options--layout-pill'>
			<button id='paint-bucket' class='drawbutton menu-option  ddbc-tab-options__header-heading'
				data-shape='paint-bucket' data-function="elev" data-unique-with="draw">
				 	Point LoS Fill
			</button>
		</div>`);
	elev_menu.append("<div class='elev-input menu-subtitle'>Elevation</div>");
	elev_menu.append(
		`<div>
			<input id='elev_height' type='number' step='5' data-required="elev_height" style='width:90%'
			value='0' >
		</div>`);
	elev_menu.append(`<div class='ddbc-tab-options--layout-pill'>
			<button id='elev_legend' class='legend menu-option ddbc-tab-options__header-heading'
				data-shape='Legend' data-function="Legend" data-unique-with="Legend">
					Legend
			</button>
		</div>`)
	elev_menu.append("<div class='menu-subtitle'>Controls</div>");
	elev_menu.append(
	`<div class='ddbc-tab-options--layout-pill menu-option data-skip='true''>
		<button id='show_elev' data-toggle='true' class='drawbutton menu-option ddbc-tab-options__header-heading'>
			Always Show
		</button>
	</div>`);
	elev_menu.append(`
			<div class='ddbc-tab-options--layout-pill' data-skip='true'>
				<button class='ddbc-tab-options__header-heading  menu-option' id='elev_undo'>
					UNDO
				</button>
			</div>`);
	elev_menu.append(
		`<div class='ddbc-tab-options--layout-pill' data-skip='true'>
			<button class='ddbc-tab-options__header-heading  menu-option' id='delete_elev'>
				CLEAR
			</button>
		</div>`);
 
	elev_menu.find("#delete_elev").click(function() {
		r = confirm("DELETE ALL MAP ELEVATION (cannot be undone!)");
		if (r === true) {
			// keep only non elev
			window.DRAWINGS = window.DRAWINGS.filter(d => d[1] !== "elev");
			redraw_elev();
			redraw_light_walls();
	        redraw_drawn_light();
	        redraw_light();
			sync_drawings();
		}
	});
	elev_menu.find("#elev_undo").click(function() {

        		// start at the end
        let currentElement = window.DRAWINGS.length
        // loop from the last element and remove if it's not text
        while (currentElement--) {
            if (window.DRAWINGS[currentElement][1] == 'elev'){
                window.DRAWINGS.splice(currentElement, 1)
                redraw_elev();
                redraw_light_walls();
		        redraw_drawn_light();
		        redraw_light();
				sync_drawings()
                break
            }
        }     
	});

	elev_menu.find("#elev_legend").click(function() {
        open_elev_legend();   
	});

	elev_menu.css("position", "fixed");
	elev_menu.css("top", "50px");
	elev_menu.css("width", "110px");
	elev_menu.css('background', "url('/content/1-0-1487-0/skins/waterdeep/images/mon-summary/paper-texture.png')")

	$("body").append(elev_menu);

	let elev_button = $("<button style='display:inline;width:75px' id='elev_button' class='drawbutton menu-button hideable ddbc-tab-options__header-heading'><u>E</u>levation</button>");
	elev_button.on('click', function(){
		redraw_elev();
	});
	buttons.append(elev_button);
	elev_menu.css("left",elev_button.position().left);
}

function init_vision_menu(buttons){
	let vision_menu = $("<div id='vision_menu' class='top_menu'></div>");

	vision_menu.append(
		`<div class='ddbc-tab-options--layout-pill'>
			<button id='vision_settings' class='settings menu-option  ddbc-tab-options__header-heading'
				data-shape='settings' data-function="settings" data-unique-with="settings">
					Settings <svg class='settings-gear' xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 1792 1792"><path d="M1152 896q0-106-75-181t-181-75-181 75-75 181 75 181 181 75 181-75 75-181zm512-109v222q0 12-8 23t-20 13l-185 28q-19 54-39 91 35 50 107 138 10 12 10 25t-9 23q-27 37-99 108t-94 71q-12 0-26-9l-138-108q-44 23-91 38-16 136-29 186-7 28-36 28h-222q-14 0-24.5-8.5t-11.5-21.5l-28-184q-49-16-90-37l-141 107q-10 9-25 9-14 0-25-11-126-114-165-168-7-10-7-23 0-12 8-23 15-21 51-66.5t54-70.5q-27-50-41-99l-183-27q-13-2-21-12.5t-8-23.5v-222q0-12 8-23t19-13l186-28q14-46 39-92-40-57-107-138-10-12-10-24 0-10 9-23 26-36 98.5-107.5t94.5-71.5q13 0 26 10l138 107q44-23 91-38 16-136 29-186 7-28 36-28h222q14 0 24.5 8.5t11.5 21.5l28 184q49 16 90 37l142-107q9-9 24-9 13 0 25 10 129 119 165 170 7 8 7 22 0 12-8 23-15 21-51 66.5t-54 70.5q26 50 41 98l183 28q13 2 21 12.5t8 23.5z"/></svg>
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
				 	Point LoS Fill
			</button>
		</div>`);

	let bucket_menu = $(`<div id='bucket_menu'></div>`);
	bucket_menu.append(`<div class='menu-subtitle'>Inner Radius (${window.CURRENT_SCENE_DATA.upsq})</div>`);
	bucket_menu.append(`
		<div>
			<input id='bucket_radius1' data-required="draw_line_width" type='number' style='width:90%' min='0' step='5'
			value='' class='drawWidthSlider'>
		</div>`
	);
	bucket_menu.append(`<div class='menu-subtitle'>Outer Radius (${window.CURRENT_SCENE_DATA.upsq})</div>`);
	bucket_menu.append(`
		<div>
			<input id='bucket_radius2' data-required="draw_line_width" type='number' style='width:90%' min='0' step='5'
			value='' class='drawWidthSlider'>
		</div>`
	);
	vision_menu.find('#paint-bucket').parent().append(bucket_menu);
	vision_menu.append(`<div class='menu-subtitle'>Color Choice</div>`);
	vision_menu.append(`
        <input title='Background color' data-required="background_color" class='spectrum'
            id='background_color' name='background color' value='#fff'/>
        `)
	vision_menu.append(
		`<div class='ddbc-tab-options--layout-pill'>
			<button id='daylight' class='drawbutton menu-option  ddbc-tab-options__header-heading'
				 data-toggle='true' class='drawbutton menu-option ddbc-tab-options__header-heading'>
				 	Daylight
			</button>
		</div>`);

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
	let colorData = vision_menu.find('#background_color').spectrum('get');
	vision_menu.find('#background_color').val(`rgba(${colorData._r}, ${colorData._g}, ${colorData._b}, ${colorData._a})`);

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
		<button class='ddbc-tab-options__header-heading  menu-option' id='light_undo'>
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
			window.DRAWINGS = window.DRAWINGS.filter(d => d[1] != 'light');
			redraw_drawn_light();
			redraw_drawings()
			sync_drawings()
		}
	});

	vision_menu.find("#light_undo").click(function() {
		// start at the end
        let currentElement = window.DRAWINGS.length
        // loop from the last element and remove if it's not text
        while (currentElement--) {
            if (window.DRAWINGS[currentElement][1].includes("light")){
                window.DRAWINGS.splice(currentElement, 1)
                redraw_drawn_light();
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

	let vision_button = $("<button style='display:inline;width:75px' id='vision_button' class='drawbutton menu-button hideable ddbc-tab-options__header-heading'><u>L</u>IGHT/VISION</button>");

	buttons.append(vision_button);
	vision_menu.css("left",vision_button.position().left);
	bucket_menu.css({
		left: `${parseInt(vision_button.position().left)+100}px`,
		top: `${parseInt(vision_menu.find('#paint-bucket').position().top)+20}px`
	})
}


// helper functions
var degreeToRadian = function(degree) {
  return (degree / 180) * Math.PI;
};

// vector object
var Vector = function(x,y) {
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
Vector.sqDist = function (v1, v2) {
	let dx = v1.x - v2.x,
		dy = v1.y - v2.y;
	return (dx * dx + dy * dy);
};
// vector object instance methods
Vector.prototype.mag = function() {
  let x = this.x,
      y = this.y;
  return Math.sqrt(x * x + y * y);
};

Vector.prototype.div = function(v) {
  if (typeof v === 'number') {
    this.x /= v;
    this.y /= v;
  } else {
    this.x /= v.x;
    this.y /= v.y;
  }
};

Vector.prototype.normalize = function() {
  let m = this.mag();
  if (m > 0) {
    this.div(m);
  }
};

// boundary object a: vector, b: vector
var Boundary = function(aVec, bVec, type=0) {
  this.a = aVec;
  this.b = bVec;
  this.c = type;
};


// ray object
var Ray = function(pos, angle) {
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
  	if(boundary.radius !== undefined){
		let u = {
			x: boundary.a.x - this.pos.x,
			y: boundary.a.y - this.pos.y
		}

		let scalar = (u.x * this.dir.x) + (this.dir.y * u.y);
		let u1 = {
			x:scalar*this.dir.x,
			y:scalar*this.dir.y
		};

		let u2 = new Vector(u.x - u1.x, u.y - u1.y);
		let d = Math.hypot(u2.x,  u2.y);
	
		let m = Math.sqrt(boundary.radius**2 - d**2);

		if(d>boundary.radius){
			return;
		}
		else{
			let p1 = new Vector(this.pos.x + u1.x + m*this.dir.x, this.pos.y + u1.y + m*this.dir.y);
					  
		  	if(d < boundary.radius && Vector.sqDist(this.pos, boundary.a) > boundary.radius**2){
		  		
		  		let p2 = new Vector(this.pos.x + u1.x - m*this.dir.x, this.pos.y + u1.y - m*this.dir.y);
				let distance1 = Vector.sqDist(this.pos, p1);
				let distance2 = Vector.sqDist(this.pos, p2);
			  	if(distance1 >= distance2){
			  		return p2
			  	}
	            
			 }
			else{
				return p1
			}
		}
	}			
	else{
		let x1 = boundary.a.x;
		let y1 = boundary.a.y;
		let x2 = boundary.b.x;
		let y2 = boundary.b.y;
		
		const x3 = this.pos.x;
		const y3 = this.pos.y;
		const x4 = this.pos.x + this.dir.x;
		const y4 = this.pos.y + this.dir.y;

		const r = {
			x: (x2 - x1),
			y: (y2 - y1)
		}
		const s = {
			x: (x4 - x3),
			y: (y4 - y3)
		}
		const den = (r.x * s.y) - (s.x * r.y);
		// if denominator is zero then the ray and boundary are parallel
		if (den === 0) {
		  return;
		}
		
		const ca = {
			x: (x3 - x1),
			y: (y3 - y1)
		}
		// numerator divided by denominator
		let t = ((ca.x * s.y) - (ca.y * s.x)) / den;
		let u = ((ca.x * r.y) - (ca.y * r.x)) / den;
		
		if (t >= 0 && t <= 1 && u >= 0) {
		  const pt = new Vector();
		  pt.x = x1 + t * r.x;
		  pt.y = y1 + t * r.y;
		  return pt;
		} else {
		  return;
		}
	}
 
};

// particle object
function initParticle(pos, divisor) {
	if(window.walls == undefined)
		return;
	window.PARTICLE = {};
	window.PARTICLE.pos = pos;
	window.PARTICLE.rays = [];
	window.PARTICLE.baseAngles = [];
	window.PARTICLE.featureRayCache = {};
	window.PARTICLE.divisor =  divisor || 40; // the degree of approximation
	for (let a = 0; a < 360; a += window.PARTICLE.divisor) {
    	window.PARTICLE.rays.push(new Ray(window.PARTICLE.pos, degreeToRadian(a)));
    	window.PARTICLE.baseAngles.push(a);
	}
};

function particleUpdate(x, y) {
	window.PARTICLE.pos.x = x;
	window.PARTICLE.pos.y = y;
};

const FEATURE_RAY_LIMIT = 1000;
const FEATURE_RAY_ANGLE_OFFSET = 0.1; // degrees to sample just off wall edges
const FEATURE_RAY_ANGLE_PERCISION = 100; // precision factor for deduplicating angles, multiplying offset by this should >= 10 otherwise it will deduplicate it

function radianToDegree(radian) {
	return radian * (180 / Math.PI);
}

function normalizeAngleDegrees(angle) {
	let normalized = angle % 360;
	if(normalized < 0)
		normalized += 360;
	return normalized;
}

function featureAngleRounded(angle) {
	return Math.round(normalizeAngleDegrees(angle) * FEATURE_RAY_ANGLE_PERCISION) / FEATURE_RAY_ANGLE_PERCISION;
}

function distanceSquared(pointA, pointB) {
	const dx = pointA.x - pointB.x;
	const dy = pointA.y - pointB.y;
	return dx * dx + dy * dy;
}

function collectFeatureAnglesForWalls(origin, walls, limit) {
	if(!origin || !walls || walls.length === 0 || limit <= 0)
		return [];
	const endpoints = [];
	for(let i = 0; i < walls.length; i++){
		const wall = walls[i];
		if(!wall)
			continue;
		if(wall.radius !== undefined)
			continue;
		if(wall.a !== undefined)
			endpoints.push(wall.a);
		if(wall.b !== undefined)
			endpoints.push(wall.b);
	}
	if(endpoints.length === 0)
		return [];
	endpoints.sort(function(a, b){
		return distanceSquared(a, origin) - distanceSquared(b, origin);
	});
	const angles = [];
	const seen = new Set();
	const offsetValues = FEATURE_RAY_ANGLE_OFFSET > 0 ? [0, -FEATURE_RAY_ANGLE_OFFSET, FEATURE_RAY_ANGLE_OFFSET] : [0];
	let added = 0;
	for(let i = 0; i < endpoints.length && added < limit; i++){
		const endpoint = endpoints[i];
		if(endpoint === undefined)
			continue;
		const baseAngleDeg = normalizeAngleDegrees(radianToDegree(Math.atan2(endpoint.y - origin.y, endpoint.x - origin.x)));
		for(let j = 0; j < offsetValues.length && added < limit; j++){
			const normAngle = normalizeAngleDegrees(baseAngleDeg + offsetValues[j]);
			const roundedAngle = featureAngleRounded(normAngle);
			if(seen.has(roundedAngle))
				continue;
			seen.add(roundedAngle);
			angles.push(normAngle);
			added++;
		}
	}
	angles.sort(function(a, b){ return a - b; });
	return angles;
}

function buildActiveRays(particle, walls) {
	if(!particle)
		return [];
	const combined = [];
	const used = new Set();
	const baseAngles = particle.baseAngles || [];
	const baseRays = particle.rays || [];
	for(let i = 0; i < baseRays.length; i++){
		const baseAngle = baseAngles[i] !== undefined ? baseAngles[i] : i * (particle.divisor || 1);
		const normAngle = normalizeAngleDegrees(baseAngle);
		combined.push({ angle: normAngle, ray: baseRays[i] });
		used.add(featureAngleRounded(normAngle));
	}
	const limit = FEATURE_RAY_LIMIT;
	const featureAngles = collectFeatureAnglesForWalls(particle.pos, walls, limit);
	if(featureAngles.length > 0){
		if(particle.featureRayCache === undefined)
			particle.featureRayCache = {};
		for(let i = 0; i < featureAngles.length; i++){
			const angleDeg = featureAngles[i];
			const angleRounded = featureAngleRounded(angleDeg);
			if(used.has(angleRounded))
				continue;
			used.add(angleRounded);
			let ray = particle.featureRayCache[angleRounded];
			if(ray === undefined){
				ray = new Ray(particle.pos, degreeToRadian(angleDeg));
				particle.featureRayCache[angleRounded] = ray;
			}
			combined.push({ angle: angleDeg, ray: ray });
		}
	}
	combined.sort(function(a, b){ return a.angle - b.angle; });
	return combined.map(function(entry){ return entry.ray; });
}

function particleLook(ctx, walls, lightRadius=100000, fog=false, fogStyle, fogType=0, draw=true, islight=false, auraId=undefined) {

	lightPolygon = [];
	movePolygon = [];
	noDarknessPolygon = [];

	let canSeeDarkness = (auraId !== undefined && (window.TOKEN_OBJECTS[auraId].options.sight == 'devilsight' || window.TOKEN_OBJECTS[auraId].options.sight =='truesight'));
	let tokenElev = 0;
	if(auraId !== undefined && window.TOKEN_OBJECTS[auraId].options.elev !== undefined && window.TOKEN_OBJECTS[auraId].options.elev !== '') 
		tokenElev = parseInt(window.TOKEN_OBJECTS[auraId].options.elev)

	if(auraId !== undefined && window.TOKEN_OBJECTS[auraId].options.mapElev !== undefined)
		tokenElev += parseInt(window.TOKEN_OBJECTS[auraId].options.mapElev)

	let prevClosestWall = null;
    let prevClosestPoint = null;
   	let prevClosestBarrier = null;
    let prevClosestBarrierPoint = null;
    let prevClosestNoDarkness = null;
    let prevClosestNoDarknessPoint = null;
    let closestWall = null;
    let closestBarrier = null;
    let closestNoDarknessWall = null;

    let secondClosestWall = null;
    let secondClosestBarrier = null;
    let secondClosestNoDarknessWall = null;

    const tokenIsDoor = window.TOKEN_OBJECTS[auraId]?.options?.type =='door';

	const diffNeedForTerrainWalls = 100;
    
    let notBlockVision = [1, 3, 6, 7, 12, 13, '1', '3', '6', '7', '12', '13'];
    let notBlockMove = [8, 9, 10, 11, 12, 13, '8', '9', '10', '11', '12', '13'];
	const activeRays = buildActiveRays(window.PARTICLE, walls);
	const lastRayIndex = activeRays.length - 1;
	const squaredRadius = lightRadius ** 2;
	for (let i = 0; i < activeRays.length; i++) {
	    const ray = activeRays[i];
	    let pt;
	    let closestLight = null;
	    let closestMove = null;
	    let recordLight = Infinity;
	    let recordMove = Infinity;
	    let closestNoDarkness = null;
	    let recordNoDarkness = Infinity;

	    let secondClosestLight = null;
	    let secondClosestMove = null;
	    let secondClosestNoDarkness = null;
	    let secondRecordLight = Infinity;
	    let secondRecordMove = Infinity;
	    let secondRecordNoDarkness = Infinity;


	    for (let j = 0; j < walls.length; j++) {

	      	let wallTop = Infinity;
			if(walls[j].wallTop !== undefined && walls[j].wallTop !== '')
	    		wallTop = walls[j].wallTop

	  		let wallBottom = -Infinity;
			if(walls[j].wallBottom !== undefined && walls[j].wallBottom !== '')
	    		wallBottom = walls[j].wallBottom
	    	

			if(auraId != undefined && (tokenElev < wallBottom || tokenElev >= wallTop))
				continue;

			pt = ray.cast(walls[j]);


			if (pt) {
				if (walls[j].terrainWall && closestLight && Vector.sqDist(pt, closestLight) < diffNeedForTerrainWalls) {
					continue;
				}
				let dist = squaredRadius;
				let pointDistance = Vector.sqDist(window.PARTICLE.pos, pt);
				if (pointDistance < squaredRadius)
					dist = pointDistance;
				
				const recordLightFurtherThanNeed = Math.abs(recordLight - dist) > diffNeedForTerrainWalls;
				const recordNoDarknessFurtherThanNeed = Math.abs(recordNoDarkness - dist) > diffNeedForTerrainWalls;
				const recordMoveFurtherThanNeed = Math.abs(recordMove - dist) > diffNeedForTerrainWalls;

				

				if (dist < recordLight && !notBlockVision.includes(walls[j].c)) {
				  	if(!tokenIsDoor || auraId != `${walls[j].a.x}${walls[j].a.y}${walls[j].b.x}${walls[j].b.y}${window.CURRENT_SCENE_DATA.id}`.replaceAll('.', ''))
						{
						
						if(recordLightFurtherThanNeed)
							secondRecordLight = recordLight;
				      	recordLight = dist;         
				      	
						if (dist == squaredRadius){
				          	pt = {
					          	x: window.PARTICLE.pos.x+ray.dir.x * lightRadius,
					          	y: window.PARTICLE.pos.y+ray.dir.y * lightRadius
					          }
				   		}	       
				   		if(recordLightFurtherThanNeed) 
							secondClosestLight = closestLight;
						   			
				      	closestLight = pt;

						if (dist != squaredRadius){    
				        	if(recordLightFurtherThanNeed)   
			        			secondClosestWall = closestWall;	
				          	closestWall = walls[j];
				        }      
			       }
				}
				else if(dist < secondRecordLight && !notBlockVision.includes(walls[j].c) && recordLightFurtherThanNeed){
					secondRecordLight = dist;       
			     	
					if (dist == squaredRadius){
			          	pt = {
				          	x: window.PARTICLE.pos.x+ray.dir.x * lightRadius,
				          	y: window.PARTICLE.pos.y+ray.dir.y * lightRadius
				          }
			   		}	           	
			   		
		      		secondClosestLight = pt;

			           
		        	
	        		secondClosestWall = walls[j];	
			        
				}

				if(canSeeDarkness === true && walls[j].darkness !== true){
					if (dist < recordNoDarkness && !notBlockVision.includes(walls[j].c)) {
				      	if(!tokenIsDoor || auraId != `${walls[j].a.x}${walls[j].a.y}${walls[j].b.x}${walls[j].b.y}${window.CURRENT_SCENE_DATA.id}`.replaceAll('.', ''))
						{
							if(recordNoDarknessFurtherThanNeed)
								secondRecordNoDarkness = recordNoDarkness;
				          	recordNoDarkness = dist;         
				          	
							if (dist == squaredRadius){
					          	pt = {
						          	x: window.PARTICLE.pos.x+ray.dir.x * lightRadius,
						          	y: window.PARTICLE.pos.y+ray.dir.y * lightRadius
						          }
				       		}	 
				       		if(recordNoDarknessFurtherThanNeed)
			       				secondClosestNoDarkness = closestNoDarkness;          	
				          	closestNoDarkness = pt;

							if (dist != squaredRadius){    	
					        	if(recordNoDarknessFurtherThanNeed)
				        			secondClosestNoDarknessWall = closestNoDarknessWall;
					          	closestNoDarknessWall = walls[j];
				       	 	}      
			       		}
			   	 	}
					else if (dist < secondRecordNoDarkness && !notBlockVision.includes(walls[j].c) && recordNoDarknessFurtherThanNeed) {
	   	 		      	if(!tokenIsDoor || auraId != `${walls[j].a.x}${walls[j].a.y}${walls[j].b.x}${walls[j].b.y}${window.CURRENT_SCENE_DATA.id}`.replaceAll('.', ''))
	   	 				{
	   	 					secondRecordNoDarkness = dist;       
	   	 		          	
							if (dist == squaredRadius){
	   	 			          	pt = {
	   	 				          	x: window.PARTICLE.pos.x+ray.dir.x * lightRadius,
	   	 				          	y: window.PARTICLE.pos.y+ray.dir.y * lightRadius
	   	 				          }
	   	 		       		}	 
	   	 		       		secondClosestNoDarkness = pt;          	


							if (dist != squaredRadius){    	
	   	 			        	secondClosestNoDarknessWall = walls[j];
	   	 		       	 	}      
	   	 	       		}
	   	 	   	 	}
				}
				if(walls[j].darkness !== true && !notBlockMove.includes(walls[j].c)){


				    if(dist < recordMove){
				    	if(recordMoveFurtherThanNeed)
				    		secondRecordMove = recordMove;
				    	recordMove = dist;
			    		if(!tokenIsDoor || auraId != `${walls[j].a.x}${walls[j].a.y}${walls[j].b.x}${walls[j].b.y}${window.CURRENT_SCENE_DATA.id}`.replaceAll('.', ''))
						{
							if (dist == squaredRadius){
					          	pt = {
						          	x: window.PARTICLE.pos.x+ray.dir.x * lightRadius,
						          	y: window.PARTICLE.pos.y+ray.dir.y * lightRadius
						          }
					   		}
					   		if(recordMoveFurtherThanNeed)
				   				secondClosestMove = closestMove;
					   		closestMove = pt;
							if (dist != squaredRadius){
					   			if(recordMoveFurtherThanNeed)
				   					secondClosestBarrier = closestBarrier;
					          	closestBarrier = walls[j];
					        }	
				    	}
				    }
				    else if(dist < secondRecordMove && recordMoveFurtherThanNeed){
				    	secondRecordMove = dist;
			    		if(!tokenIsDoor || auraId != `${walls[j].a.x}${walls[j].a.y}${walls[j].b.x}${walls[j].b.y}${window.CURRENT_SCENE_DATA.id}`.replaceAll('.', ''))
						{
							if (dist == squaredRadius){
					          	pt = {
						          	x: window.PARTICLE.pos.x+ray.dir.x * lightRadius,
						          	y: window.PARTICLE.pos.y+ray.dir.y * lightRadius
						          }
					   		}
					   		secondClosestMove = pt;
							if (dist != squaredRadius){
					   			secondClosestBarrier = walls[j];
					        }	
				    	}
				    }
				}

			}

	    }	    
	   
		if (closestWall?.terrainWall == true && secondClosestLight != null && (secondClosestWall != null || secondRecordLight == squaredRadius)){
			closestLight = secondClosestLight;	
		}
		
		if (closestNoDarknessWall?.terrainWall == true && secondClosestNoDarkness != null){
			closestNoDarkness = secondClosestNoDarkness;
    	}

		if (closestBarrier?.terrainWall == true && secondClosestMove != null){
			closestMove = secondClosestMove;
	 	}

		
		if (closestLight !== null && ((closestWall?.terrainWall && (secondClosestWall != null || secondRecordLight == squaredRadius)) || closestWall != prevClosestWall || i === lastRayIndex || closestWall?.radius !== undefined)) {
			if (closestWall !== prevClosestWall && prevClosestWall !== null && prevClosestPoint !== null) {
				lightPolygon.push({ x: prevClosestPoint.x * window.CURRENT_SCENE_DATA.scale_factor, y: prevClosestPoint.y * window.CURRENT_SCENE_DATA.scale_factor })
			}
			lightPolygon.push({ x: closestLight.x * window.CURRENT_SCENE_DATA.scale_factor, y: closestLight.y * window.CURRENT_SCENE_DATA.scale_factor })
		}
		if (closestMove !== null && ((closestBarrier?.terrainWall && (secondClosestBarrier != null || secondRecordMove == squaredRadius)) || (closestBarrier !== prevClosestBarrier || i === lastRayIndex))) {
			if (closestBarrier != prevClosestBarrier && prevClosestBarrierPoint) {
				movePolygon.push({ x: prevClosestBarrierPoint.x * window.CURRENT_SCENE_DATA.scale_factor, y: prevClosestBarrierPoint.y * window.CURRENT_SCENE_DATA.scale_factor })
			}
			movePolygon.push({ x: closestMove.x * window.CURRENT_SCENE_DATA.scale_factor, y: closestMove.y * window.CURRENT_SCENE_DATA.scale_factor })
		}
		if (closestLight !== null && recordLight === squaredRadius) {
			if ( prevClosestWall !== null && prevClosestPoint !== null) {
				lightPolygon.push({ x: prevClosestPoint.x * window.CURRENT_SCENE_DATA.scale_factor, y: prevClosestPoint.y * window.CURRENT_SCENE_DATA.scale_factor })
			}
			lightPolygon.push({ x: closestLight.x * window.CURRENT_SCENE_DATA.scale_factor, y: closestLight.y * window.CURRENT_SCENE_DATA.scale_factor })
		}
		if (closestMove !== null && recordMove === squaredRadius) {
			if (prevClosestBarrier !== null && prevClosestBarrierPoint !== null) {
				movePolygon.push({ x: prevClosestBarrierPoint.x * window.CURRENT_SCENE_DATA.scale_factor, y: prevClosestBarrierPoint.y * window.CURRENT_SCENE_DATA.scale_factor })
			}
			movePolygon.push({ x: closestMove.x * window.CURRENT_SCENE_DATA.scale_factor, y: closestMove.y * window.CURRENT_SCENE_DATA.scale_factor })
		}

		if (canSeeDarkness) {
			if (closestNoDarkness !== null && ((closestNoDarknessWall?.terrainWall && (secondClosestNoDarkness != null || secondRecordNoDarkness == squaredRadius)) || (closestNoDarknessWall !== prevClosestNoDarkness || i === lastRayIndex || closestNoDarknessWall?.radius !== undefined))) {
				if (closestNoDarknessWall !== prevClosestNoDarkness && prevClosestNoDarkness !== null && prevClosestNoDarknessPoint !== null) {
					noDarknessPolygon.push({ x: prevClosestNoDarknessPoint.x * window.CURRENT_SCENE_DATA.scale_factor, y: prevClosestNoDarknessPoint.y * window.CURRENT_SCENE_DATA.scale_factor })
				}
				noDarknessPolygon.push({ x: closestNoDarkness.x * window.CURRENT_SCENE_DATA.scale_factor, y: closestNoDarkness.y * window.CURRENT_SCENE_DATA.scale_factor })
			}

			if (closestNoDarkness !== null && recordNoDarkness === squaredRadius) {
				if (prevClosestNoDarkness !== null && prevClosestNoDarknessPoint !== null) {
					noDarknessPolygon.push({ x: prevClosestNoDarknessPoint.x * window.CURRENT_SCENE_DATA.scale_factor, y: prevClosestNoDarknessPoint.y * window.CURRENT_SCENE_DATA.scale_factor })
				}
				noDarknessPolygon.push({ x: closestNoDarkness.x * window.CURRENT_SCENE_DATA.scale_factor, y: closestNoDarkness.y * window.CURRENT_SCENE_DATA.scale_factor })
			}

			prevClosestNoDarknessPoint = closestNoDarkness;
			prevClosestNoDarkness = closestNoDarknessWall;
		}
		

	    



	    prevClosestPoint = closestLight;
	    prevClosestWall = closestWall;

	    prevClosestBarrierPoint = closestMove;
	    prevClosestBarrier = closestBarrier;

	   

	}
  	if(draw === true){
		if(!fog){
			  drawPolygon(ctx, lightPolygon, 'rgba(255, 255, 255, 1)', true);
		}
		else{	
			if(fogType === 0){
				clearPolygon(ctx, lightPolygon);
			}
			else{
				if(!islight){
					clearPolygon(ctx, lightPolygon, undefined, true);
					drawPolygon(ctx, lightPolygon, fogStyle, undefined, undefined, undefined, undefined, undefined, true);
				}
				else {
					const canvasWidth = getSceneMapSize().sceneWidth;
					const canvasHeight = getSceneMapSize().sceneHeight;
					
					if(window.offScreenCombine == undefined){
						window.offScreenCombine = new OffscreenCanvas(canvasWidth, canvasHeight);
					}
					combineCtx = window.offScreenCombine.getContext('2d');
					combineCtx.clearRect(0, 0, canvasWidth, canvasHeight);
					combineCtx.globalCompositeOperation = "source-over";
					drawPolygon(combineCtx, lightPolygon, "#FFF", true);
					combineCtx.globalCompositeOperation = "destination-out";
					drawPolygon(combineCtx, lightPolygon, "#000", false, 10);

					ctx.save();
					ctx.globalCompositeOperation = 'lighten';
					ctx.drawImage(window.offScreenCombine, 0, 0);
					ctx.restore();
				}	
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
  else if(isNaN(uB) && isNaN(uB)){
  	if((x3<x1&&x3<x2&&x4<x1&&x4<x2) || (x3>x1&&x3>x2&&x4>x1&&x4>x2) || (y3<y1&&y3<y2&&y4<y1&&y4<y2) || (y3>y1&&y3>y2&&y4>y1&&y4>y2))
  		return false;
  	else if(y1==y2 && y2==y3 && y3==y4){
  		return {x: [x1, x2, x3, x4], y: y1};
  	}
  	else if(x1==x2 && x2==x3 && x3==x4){
  		return {x: x1, y: [y1, y2, y3, y4]};
  	}
  }
  return false;
}

//Checks if a pixel is in line of current line of sight
function detectInLos(x, y) {
	let canvas = window.moveOffscreenCanvasMask;
	let ctx = canvas.getContext("2d", { willReadFrequently: true });
	const pixeldata = ctx.getImageData((x-5)/window.CURRENT_SCENE_DATA.scale_factor, (y-5)/window.CURRENT_SCENE_DATA.scale_factor, 10, 10).data;


	for(let i=0; i<pixeldata.length; i+=4){
		if(pixeldata[i] <= 5)
			return false;
	}
	return true;
	
}
	


function redraw_light(darknessMoved = false){
	const canvasWidth = getSceneMapSize().sceneWidth;
	const canvasHeight = getSceneMapSize().sceneHeight;
    if(window.rayContext == undefined){
		window.rayCanvas = document.getElementById('raycastingCanvas');
		window.rayContext = window.rayCanvas.getContext('2d');

		window.offscreenCanvasMask = new OffscreenCanvas(canvasWidth, canvasHeight); 
		window.offscreenContext = window.offscreenCanvasMask.getContext('2d');

		window.moveOffscreenCanvasMask = new OffscreenCanvas(canvasWidth, canvasHeight);  
		window.moveOffscreenContext = window.moveOffscreenCanvasMask.getContext('2d', { willReadFrequently: true });
	}
	
    const canvas = window.rayCanvas;
	const context = window.rayContext;



	context.clearRect(0, 0, canvasWidth, canvasHeight)

	if(canvasWidth == 0 || canvasHeight == 0){
		console.warn("Draw light attempted before map load");
		return; // prevent error if redraw is called before map initialized
	}

	if(window.PARTICLE == undefined){
		initParticle(new Vector(200, 200), 1);
	}
	if(window.offScreenCombine == undefined){
		window.offScreenCombine = new OffscreenCanvas(canvasWidth, canvasHeight);
	}
	else{
		window.offScreenCombine.width = canvasWidth;
		window.offScreenCombine.height = canvasHeight;
	}

	const combineCtx = window.offScreenCombine.getContext("2d");


	if (window.offScreenCombine2 == undefined) {
		window.offScreenCombine2 = new OffscreenCanvas(canvasWidth, canvasHeight);
	}
	else {
		window.offScreenCombine2.width = canvasWidth;
		window.offScreenCombine2.height = canvasHeight;
	}

	const combineCtx2 = window.offScreenCombine2.getContext("2d");


	const offscreenCanvasMask = window.offscreenCanvasMask;
	const offscreenContext = window.offscreenContext;
    
	offscreenCanvasMask.width = canvasWidth;
	offscreenCanvasMask.height = canvasHeight;
	offscreenContext.clearRect(0, 0, canvasWidth, canvasHeight);

	
	const moveOffscreenContext = window.moveOffscreenContext;

	window.moveOffscreenCanvasMask.width = canvasWidth;
	window.moveOffscreenCanvasMask.height = canvasHeight;


	if(window.lightInLos == undefined){
		window.lightInLos = new OffscreenCanvas(canvasWidth, canvasHeight);
		window.lightInLosContext = window.lightInLos.getContext('2d');
	}
	window.lightInLosContext.clearRect(0, 0, window.lightInLos.width, window.lightInLos.width.height);
	window.lightInLos.width = canvasWidth;
	window.lightInLos.height = canvasHeight;


	

	if(window.CURRENT_SCENE_DATA.disableSceneVision == true){
		context.fillStyle = "white";
		context.fillRect(0,0,canvasWidth,canvasHeight);

		moveOffscreenContext.fillStyle = "white";
		moveOffscreenContext.fillRect(0,0,canvasWidth,canvasHeight);
		return;
	}

	if(window.truesightCanvas == undefined){
		window.truesightCanvas = new OffscreenCanvas(canvasWidth, canvasHeight);
		window.truesightCanvasContext = window.truesightCanvas.getContext('2d');
	}
	const truesightCanvasContext = window.truesightCanvasContext;

	window.truesightCanvas.width = canvasWidth;
	window.truesightCanvas.height = canvasHeight;

	truesightCanvasContext.clearRect(0,0,canvasWidth,canvasHeight);

	if (window.devilsightCanvas == undefined){
		window.devilsightCanvas = new OffscreenCanvas(canvasWidth, canvasHeight);
		window.devilsightCtx = window.devilsightCanvas.getContext('2d');
	}
 
	const devilsightCanvas = window.devilsightCanvas;
	const devilsightCtx = window.devilsightCtx;

	devilsightCanvas.width = canvasWidth;
	devilsightCanvas.height = canvasHeight;

	devilsightCtx.clearRect(0,0,canvasWidth,canvasHeight);

	if (window.tempDarkvisionCanvas == undefined){
		window.tempDarkvisionCanvas = new OffscreenCanvas(canvasWidth, canvasHeight);
		window.tempDarkvisionCtx = window.tempDarkvisionCanvas.getContext('2d');
	}
	const tempDarkvisionCanvas = window.tempDarkvisionCanvas;
	const tempDarkvisionCtx = window.tempDarkvisionCtx;

	tempDarkvisionCanvas.width = canvasWidth;
	tempDarkvisionCanvas.height = canvasHeight;

	tempDarkvisionCtx.clearRect(0,0,canvasWidth,canvasHeight);

	if (window.tempDarknessCanvas == undefined) {
		window.tempDarknessCanvas = new OffscreenCanvas(canvasWidth, canvasHeight);
		window.tempDarknessCtx = window.tempDarknessCanvas.getContext('2d');
	}
	const tempDarknessCanvas = window.tempDarknessCanvas;
	const tempDarknessCtx = window.tempDarknessCtx;

	tempDarknessCanvas.width = canvasWidth;
	tempDarknessCanvas.height = canvasHeight;

	tempDarknessCtx.clearRect(0, 0, canvasWidth, canvasHeight);

	let darknessBoundarys = getDarknessBoundarys();
	
	if(window.walls?.length <= 4 && window.CURRENT_SCENE_DATA.darkness_filter == 0){
		moveOffscreenContext.fillStyle = "white";
	}else{
		moveOffscreenContext.fillStyle = "black";
	}

	moveOffscreenContext.fillRect(0,0,canvasWidth,canvasHeight);

	if(window.CURRENT_SCENE_DATA.darkness_filter == 0){
		moveOffscreenContext.fillStyle = "white";
	}

	let light_auras = $(`.light:not([style*='display: none'])>.aura-element.islight:not([style*='visibility: hidden'])`).map(function () {
		return $(this).attr("data-id");
	}).get();



	let selectedIds = [];
	let selectedTokens = $('#tokens .tokenselected:not(.isAoe)');

	let playerTokenId = $(`.token[data-id*='${window.PLAYER_ID}']`).attr("data-id");



	if (selectedTokens.length > 0) {
		for (let j = 0; j < selectedTokens.length; j++) {
			let tokenId = $(selectedTokens[j]).attr('data-id');

			if (tokenId.includes(window.PLAYER_ID) || window.DM || window.TOKEN_OBJECTS[tokenId].options.share_vision == true || window.TOKEN_OBJECTS[tokenId].options.share_vision == window.myUser || (window.TOKEN_OBJECTS[tokenId].options.share_vision && is_spectator_page()) || (playerTokenId == undefined && window.TOKEN_OBJECTS[tokenId].options.itemType == 'pc'))
				selectedIds.push(tokenId)
		}
	}
	if (window.SelectedTokenVision == true && selectedIds.length > 0) {
		light_auras = [...new Set(light_auras.concat(selectedIds))];
	}
	if (selectedIds.length > 0 || selectedTokens.length == 0)
		check_darkness_value();


	const adjustScale = (window.CURRENT_SCENE_DATA.scale_factor != undefined) ? window.CURRENT_SCENE_DATA.scale_factor : 1;







	if (window.elevContext == undefined) {
		window.elevContext = $('#elev_overlay')[0].getContext('2d');
	}


	const allWalls = [...walls, ...darknessBoundarys];
	const tokenVisionAuras = $(`.aura-element-container-clip [id*='vision_']`);

	if (window.SelectedTokenVision === true) {
		tokenVisionAuras.toggleClass('notVisible', true);
	}
	else if (window.DM && window.SelectedTokenVision !== true) {
		tokenVisionAuras.toggleClass('notVisible', false);
	}
	for (let i = 0; i < light_auras.length; i++) {

		let auraId = light_auras[i];

		let found = selectedIds.includes(auraId);
		let tokenHalfWidth = window.TOKEN_OBJECTS[auraId].sizeWidth() / 2;
		let tokenHalfHeight = window.TOKEN_OBJECTS[auraId].sizeHeight() / 2;
		let tokenPos = {
			x: (parseInt(window.TOKEN_OBJECTS[auraId].options.left) + tokenHalfWidth) / window.CURRENT_SCENE_DATA.scale_factor,
			y: (parseInt(window.TOKEN_OBJECTS[auraId].options.top) + tokenHalfHeight) / window.CURRENT_SCENE_DATA.scale_factor
		}
		if (window.TOKEN_OBJECTS[auraId].options.type == 'door' && window.TOKEN_OBJECTS[auraId].options.scaleCreated) {
			tokenPos.x = tokenPos.x / (window.TOKEN_OBJECTS[auraId].options.scaleCreated / window.CURRENT_SCENE_DATA.scale_factor);
			tokenPos.y = tokenPos.y / (window.TOKEN_OBJECTS[auraId].options.scaleCreated / window.CURRENT_SCENE_DATA.scale_factor);
		}
		if (window.lineOfSightPolygons === undefined) {
			window.lineOfSightPolygons = {};
		}
		if (window.lineOfSightPolygons[auraId] !== undefined &&
			window.lineOfSightPolygons[auraId].x === tokenPos.x &&
			window.lineOfSightPolygons[auraId].y === tokenPos.y &&
			window.lineOfSightPolygons[auraId].numberofwalls === allWalls.length &&
			window.lineOfSightPolygons[auraId].visionType === window.TOKEN_OBJECTS[auraId].options.sight &&
			window.lineOfSightPolygons[auraId].scaleCreated === window.TOKEN_OBJECTS[auraId].options.scaleCreated &&
			darknessMoved !== true) {
			lightPolygon = window.lineOfSightPolygons[auraId].polygon;  // if the token hasn't moved and walls haven't changed don't look for a new poly.
			movePolygon = window.lineOfSightPolygons[auraId].move;  // if the token hasn't moved and walls haven't changed don't look for a new poly.
			noDarknessPolygon = window.lineOfSightPolygons[auraId].noDarkness;
		}
		else {

			check_token_elev(auraId);
			particleUpdate(tokenPos.x, tokenPos.y); // moves particle
			particleLook(context, allWalls, 100000, undefined, undefined, undefined, false, false, auraId);  // if the token has moved or walls have changed look for a new vision poly. This function takes a lot of processing time - so keeping this limited is prefered.

			let path = "";
			for (let i = 0; i < lightPolygon.length; i++) {
				path += (i && "L" || "M") + lightPolygon[i].x / adjustScale + ',' + lightPolygon[i].y / adjustScale
			}

			window.lineOfSightPolygons[auraId] = {
				polygon: lightPolygon,
				move: movePolygon,
				noDarkness: noDarknessPolygon,
				x: tokenPos.x,
				y: tokenPos.y,
				numberofwalls: walls.length + darknessBoundarys.length,
				clippath: path,
				visionType: window.TOKEN_OBJECTS[auraId].options.sight,
				scaleCreated: window.TOKEN_OBJECTS[auraId].options.scaleCreated
			}


			$(`.aura-element-container-clip[id='${auraId}']:not(.vision)`).css('clip-path', `path('${path}')`)




			if (window.lineOfSightPolygons[auraId] !== undefined && (window.TOKEN_OBJECTS[auraId].options.sight === 'devilsight' || window.TOKEN_OBJECTS[auraId].options.sight === 'truesight')) {
				let path = "";
				for (let i = 0; i < noDarknessPolygon.length; i++) {
					path += (i && "L" || "M") + noDarknessPolygon[i].x / adjustScale + ',' + noDarknessPolygon[i].y / adjustScale
				}
				window.lineOfSightPolygons[auraId].devilsightClip = path;
				$(`.aura-element-container-clip[id='${auraId}'].vision`).css('clip-path', `path('${path}')`)

			}

			if (window.lightAuraClipPolygon === undefined) {
				window.lightAuraClipPolygon = {};
			}
			clipped_light(auraId, lightPolygon, playerTokenId, canvasWidth, canvasHeight, darknessBoundarys, selectedIds.length);
		}



		
		combineCtx2.clearRect(0, 0, canvasWidth, canvasHeight);
		combineCtx2.globalCompositeOperation = "source-over";
		drawPolygon(combineCtx2, lightPolygon, "#FFF", true);
		combineCtx2.globalCompositeOperation = "destination-out";
		drawPolygon(combineCtx2, lightPolygon, "#000", false, 10);

		if (window.lightAuraClipPolygon[auraId]?.light !== undefined) {
			combineCtx.globalCompositeOperation = 'lighten';
			drawCircle(combineCtx, window.lightAuraClipPolygon[auraId].middle.x, window.lightAuraClipPolygon[auraId].middle.y, window.lightAuraClipPolygon[auraId].light2.range, window.lightAuraClipPolygon[auraId].light2.color)
			drawCircle(combineCtx, window.lightAuraClipPolygon[auraId].middle.x, window.lightAuraClipPolygon[auraId].middle.y, window.lightAuraClipPolygon[auraId].light1.range, window.lightAuraClipPolygon[auraId].light1.color)		
			combineCtx.globalCompositeOperation = 'destination-in';
			combineCtx.drawImage(offScreenCombine2, 0, 0);
			lightInLosContext.globalCompositeOperation = "lighten";
			lightInLosContext.drawImage(offScreenCombine, 0, 0);
		}


		if (selectedIds.length === 0 || found || (window.SelectedTokenVision !== true && !window.DM)) {

			let hideVisionWhenNoPlayerToken = (playerTokenId === undefined && window.TOKEN_OBJECTS[auraId].options.share_vision === undefined && !window.DM && window.TOKEN_OBJECTS[auraId].options.itemType !== 'pc')
			if (hideVisionWhenNoPlayerToken) //when player token does not exist show vision for all pc tokens and shared vision for other tokens. Mostly used by DM's, streams and tabletop tv games.			
				continue;//we don't want to draw this tokens vision no need for further checks - go next token.


			let hideVisionWhenPlayerTokenExists = (auraId.includes(window.PLAYER_ID) !== true && window.DM !== true && window.TOKEN_OBJECTS[auraId].options.share_vision !== true && window.TOKEN_OBJECTS[auraId].options.share_vision != window.myUser && playerTokenId !== undefined)

			if (hideVisionWhenPlayerTokenExists)	//when player token does exist show your own vision and shared vision.
				continue; //we don't want to draw this tokens vision - go next token.



			if (window.DM !== true || window.SelectedTokenVision === true) {
				if (window.lightAuraClipPolygon[auraId] != undefined && (window.TOKEN_OBJECTS[auraId].options.sight === 'devilsight' || window.TOKEN_OBJECTS[auraId].options.sight === 'truesight')) {
					tempDarkvisionCtx.globalCompositeOperation = 'source-over';
					drawCircle(tempDarkvisionCtx, window.lightAuraClipPolygon[auraId].middle.x, window.lightAuraClipPolygon[auraId].middle.y, window.lightAuraClipPolygon[auraId].darkvision, 'white')

					tempDarkvisionCtx.globalCompositeOperation = 'destination-in';
					drawPolygon(tempDarkvisionCtx, noDarknessPolygon, 'rgba(255, 255, 255, 1)', true);
					offscreenContext.globalCompositeOperation = 'source-over';
					offscreenContext.drawImage(tempDarkvisionCanvas, 0, 0)
				}
				if (window.TOKEN_OBJECTS[auraId].options.sight === 'devilsight') {
					devilsightCtx.globalCompositeOperation = 'source-over';
					devilsightCtx.drawImage(tempDarkvisionCanvas, 0, 0);
				}
				if (window.TOKEN_OBJECTS[auraId].options.sight === 'truesight') {
					truesightCanvasContext.globalCompositeOperation = 'source-over';
					truesightCanvasContext.drawImage(tempDarkvisionCanvas, 0, 0);
				}

			}

			if (window.lightAuraClipPolygon[auraId]?.darkvision !== undefined) {
				combineCtx.globalCompositeOperation = 'lighten';
				drawCircle(combineCtx, window.lightAuraClipPolygon[auraId].middle.x, window.lightAuraClipPolygon[auraId].middle.y, window.lightAuraClipPolygon[auraId].darkvision, window.lightAuraClipPolygon[auraId].vision.color);
				combineCtx.globalCompositeOperation = 'destination-in';
				combineCtx.drawImage(offScreenCombine2, 0, 0);
				lightInLosContext.globalCompositeOperation = "lighten";
				lightInLosContext.drawImage(offScreenCombine, 0, 0);
			}

			$(`.aura-element-container-clip[id='${auraId}'] [id*='vision_']`).toggleClass('notVisible', false);
			offscreenContext.globalCompositeOperation = "lighten";
			drawPolygon(offscreenContext, lightPolygon, 'rgba(255, 255, 255, 1)', true, 6, undefined, undefined, undefined, true, true); //draw to offscreen canvas so we don't have to render every draw and use this for a mask	
			drawPolygon(moveOffscreenContext, movePolygon, 'rgba(255, 255, 255, 1)', true, 6, undefined, undefined, undefined, true, true); //draw to offscreen canvas so we don't have to render every draw and use this for a mask



		}

	}



	const tokenObjectValues = Object.values(window.TOKEN_OBJECTS);
	const aPlayerTokenExists = tokenObjectValues.some(d => d.options.id.startsWith('/profile'))
	const playerTokenWithVisionEnabled = window.TOKEN_OBJECTS[playerTokenId]?.options?.auraislight === true || (playerTokenId === undefined && tokenObjectValues.some(d => d.options.id.startsWith('/profile') && d.options.auraislight == true));
	const sharedVisionToken = tokenObjectValues.some(d => d.options.share_vision !== undefined && (d.options.share_vision === true || d.options.share_vision == window.myUser || (d.options.share_vision && is_spectator_page())) && d.options.auraislight == true);

	if (aPlayerTokenExists && playerTokenWithVisionEnabled === false && sharedVisionToken === false) {
		offscreenContext.globalCompositeOperation = "lighten";
		offscreenContext.fillStyle = "white";
		moveOffscreenContext.fillStyle = "white";
		offscreenContext.fillRect(0, 0, canvasWidth, canvasHeight);
		moveOffscreenContext.fillRect(0, 0, canvasWidth, canvasHeight);
	} 

	

	

	
	

	lightInLosContext.globalCompositeOperation='source-over';
	if(window.CURRENT_SCENE_DATA.darkness_filter == 0){

		offscreenContext.globalCompositeOperation='destination-over';
		offscreenContext.fillStyle = "black";
		offscreenContext.fillRect(0,0,canvasWidth,canvasHeight);

		lightInLosContext.drawImage(offscreenCanvasMask, 0, 0);
		if(window.DM !== true || window.SelectedTokenVision === true){
			draw_darkness_aoe_to_canvas(lightInLosContext);
	
			lightInLosContext.globalCompositeOperation='source-over';	
			lightInLosContext.drawImage(devilsightCanvas, 0, 0);

			

			truesightCanvasContext.globalCompositeOperation='destination-in';
			truesightCanvasContext.drawImage(offscreenCanvasMask, 0, 0);
		}
	}
	if(window.CURRENT_SCENE_DATA.darkness_filter != 0){
		lightInLosContext.globalCompositeOperation='destination-over';
		
		lightInLosContext.drawImage($('#light_overlay')[0], 0, 0);
		

		if(window.DM !== true || window.SelectedTokenVision === true){
			draw_darkness_aoe_to_canvas(lightInLosContext);

			lightInLosContext.globalCompositeOperation='source-over';
			lightInLosContext.drawImage(devilsightCanvas, 0, 0);

			
			truesightCanvasContext.globalCompositeOperation='destination-in';
			truesightCanvasContext.drawImage(offscreenCanvasMask, 0, 0);	
		}
		
		lightInLosContext.globalCompositeOperation='destination-in';
		lightInLosContext.drawImage(offscreenCanvasMask, 0, 0);
		

		offscreenContext.globalCompositeOperation='destination-over';
		offscreenContext.fillStyle = "black";
		offscreenContext.fillRect(0,0,canvasWidth,canvasHeight);		
	}	

		
	context.drawImage(offscreenCanvasMask, 0, 0); // draw to visible canvas only once so we render this once
	
	if(gameIndexedDb !== undefined && window.CURRENT_SCENE_DATA.visionTrail == '1' && window.DM !== true){

		let exploredCanvas = document.getElementById("exploredCanvas");
		if (!exploredCanvas){
			exploredCanvas =  document.createElement("canvas")
			exploredCanvas.width = canvasWidth;
			exploredCanvas.height = canvasHeight;			
			window.exploredCanvasContext = exploredCanvas.getContext('2d');
			

			window.exploredCanvasContext.globalCompositeOperation='source-over';
			window.exploredCanvasContext.fillStyle = "black";
			window.exploredCanvasContext.fillRect(0,0,canvasWidth,canvasHeight);	
			$(exploredCanvas).attr('id', 'exploredCanvas');

			$('#outer_light_container').append(exploredCanvas)	
			gameIndexedDb.transaction(["exploredData"])
			  .objectStore(`exploredData`)
			  .get(`explore${window.gameId}${window.CURRENT_SCENE_DATA.id}`).onsuccess = (event) => {
			 	if(event?.target?.result?.exploredData){
				  	let img = new Image;

					img.onload = function(){
						requestAnimationFrame(function(){
						  window.exploredCanvasContext.drawImage(img,0,0); 
						  window.exploredCanvasContext.globalCompositeOperation='lighten';
						  window.exploredCanvasContext.drawImage(window.lightInLos, 0, 0);
						});
					};
					img.src = event.target.result.exploredData;
				}
			};		
		}
		else{
			if(window.exploredCanvasContext == undefined){
				window.exploredCanvasContext = exploredCanvas.getContext('2d');
			}
			requestAnimationFrame(function(){
				window.exploredCanvasContext.globalCompositeOperation='lighten';
				window.exploredCanvasContext.drawImage(window.lightInLos, 0, 0);
			});
			debounceStoreExplored(exploredCanvas, window.CURRENT_SCENE_DATA.id);
		}
	
	}

	else{
		$('#exploredCanvas').remove();
	}
	
	
	if(!window.DM || window.SelectedTokenVision){
		throttleTokenCheck();	
	}

	if(window.CURRENTLY_SELECTED_TOKENS.length > 0){
		debounceAudioChecks();
	}
	
	

}
function getTokenVision(tokenId, darknessMoved){
	if(window.lineOfSightPolygons[tokenId] !== undefined)
		return window.lineOfSightPolygons[tokenId];



	if(window.PARTICLE == undefined){
		initParticle(new Vector(200, 200), 1);
	}
	const darknessBoundarys = getDarknessBoundarys();
	const allWalls = [...walls, ...darknessBoundarys];
	
	const tokenHalfWidth = window.TOKEN_OBJECTS[tokenId].sizeWidth()/2;
	const tokenHalfHeight = window.TOKEN_OBJECTS[tokenId].sizeHeight()/2;
	let tokenPos = {
		x: (parseInt(window.TOKEN_OBJECTS[tokenId].options.left)+tokenHalfWidth)/ window.CURRENT_SCENE_DATA.scale_factor,
		y: (parseInt(window.TOKEN_OBJECTS[tokenId].options.top)+tokenHalfHeight)/ window.CURRENT_SCENE_DATA.scale_factor
	}
	if(window.TOKEN_OBJECTS[tokenId].options.type == 'door' && window.TOKEN_OBJECTS[tokenId].options.scaleCreated){
		tokenPos.x = tokenPos.x / (window.TOKEN_OBJECTS[tokenId].options.scaleCreated/ window.CURRENT_SCENE_DATA.scale_factor);
		tokenPos.y = tokenPos.y / (window.TOKEN_OBJECTS[tokenId].options.scaleCreated/ window.CURRENT_SCENE_DATA.scale_factor);
	}	
	if(window.PARTICLE == undefined){
		initParticle(new Vector(200, 200), 1);
	}
	check_token_elev(tokenId);
	particleUpdate(tokenPos.x, tokenPos.y); // moves particle
	particleLook(undefined, allWalls, 100000, undefined, undefined, undefined, false, false, tokenId);  // if the token has moved or walls have changed look for a new vision poly. This function takes a lot of processing time - so keeping this limited is prefered.
	const adjustScale = (window.CURRENT_SCENE_DATA.scale_factor != undefined) ? window.CURRENT_SCENE_DATA.scale_factor : 1;
	let path = "";
	for(let i = 0; i < lightPolygon.length; i++){
		path += (i && "L" || "M") + lightPolygon[i].x/adjustScale+','+lightPolygon[i].y/adjustScale
	}
	window.lineOfSightPolygons[tokenId] = {
		polygon: lightPolygon,
		move: movePolygon,
		noDarkness: noDarknessPolygon,
		x: tokenPos.x,
		y: tokenPos.y,
		numberofwalls: walls.length+darknessBoundarys.length,
		clippath: path,
		visionType: window.TOKEN_OBJECTS[tokenId].options.sight,
		scaleCreated: window.TOKEN_OBJECTS[tokenId].options.scaleCreated
	}
	if(window.lineOfSightPolygons[tokenId] !== undefined &&(window.TOKEN_OBJECTS[tokenId].options.sight === 'devilsight' || window.TOKEN_OBJECTS[tokenId].options.sight === 'truesight')){
		let path = "";
		for(let i = 0; i < noDarknessPolygon.length; i++){
			path += (i && "L" || "M") + noDarknessPolygon[i].x/adjustScale+','+noDarknessPolygon[i].y/adjustScale
		}
		window.lineOfSightPolygons[tokenId].devilsightClip = path;
	}

	return window.lineOfSightPolygons[tokenId];
		
}
function rotatePoint(px, py, cx, cy, R) {
        const cosA = Math.cos(R);
        const sinA = Math.sin(R);
	return {x: cx + (px - cx) * cosA - (py - cy) * sinA,
		y: cy + (px - cx) * sinA + (py - cy) * cosA};
}
function rotatePoints(poly, cx, cy, R) {
	return poly.map(point => rotatePoint(point.x, point.y, cx, cy, R));	
}
function conePoly(startx, starty, endx, endy) {
	const L = Math.sqrt(Math.pow(endx - startx, 2) + Math.pow(endy - starty, 2));
	const T = Math.sqrt(Math.pow(L, 2) + Math.pow(L / 2, 2));
	const res = circle_intersection(startx, starty, T, endx, endy, L / 2);
	return [{x: startx/window.CURRENT_SCENE_DATA.scale_factor,
		 y: starty/window.CURRENT_SCENE_DATA.scale_factor},
		{x: res[0]/window.CURRENT_SCENE_DATA.scale_factor,
		 y: res[2]/window.CURRENT_SCENE_DATA.scale_factor},
		{x: res[1]/window.CURRENT_SCENE_DATA.scale_factor,
		 y: res[3]/window.CURRENT_SCENE_DATA.scale_factor}];
}

function getDarknessBoundarys(){
	let darknessAoes = $('[data-darkness]');
	let darknessBoundarys = [];

	for(let i = 0; i<darknessAoes.length; i++){
		const currentAoe = $(darknessAoes[i]);

		const left = parseFloat(currentAoe.css('left'));
		const top = parseFloat(currentAoe.css('top'));
		const width = parseFloat(currentAoe.css('width'));
		const height = parseFloat(currentAoe.css('height'));
		const scale = window.CURRENT_SCENE_DATA.scale_factor != undefined ? window.CURRENT_SCENE_DATA.scale_factor : 1;
		const cX = (left + width/2);
		const cY = (top + height/2);
		const rot = parseFloat(currentAoe.css('--token-rotation')) * (Math.PI/180);

		if(currentAoe.find('.aoe-shape-circle').length>0){
			let radius = (width/2);

			let boundary = new Boundary({x: cX, y: cY});
			boundary.radius = radius;
			boundary.darkness = true;

			darknessBoundarys.push(boundary);
		}

		
		if(currentAoe.find('.aoe-shape-square').length>0 || currentAoe.find('.aoe-shape-line').length>0){
			const poly = rotatePoints([
				{x: cX-width/2, y: cY-height/2},
				{x: cX-width/2, y: cY+height/2},
				{x: cX+width/2, y: cY+height/2},
				{x: cX+width/2, y: cY-height/2}
			], cX, cY, rot);

			for(let i in poly){
				let boundary = new Boundary()
				if(i == poly.length-1){
					boundary.a = poly[i];
					boundary.b = poly[0];
				}
				else{
					boundary.a = poly[i];
					boundary.b = poly[parseInt(i)+1];
				}
				boundary.darkness = true;
				darknessBoundarys.push(boundary)
			}

			
		}
		if(currentAoe.find('.aoe-shape-cone').length>0){


			const poly = rotatePoints(conePoly(cX*scale,
						   (cY-height/2)*scale,
						   cX*scale,
						   (cY+height/2)*scale), 
			cX, cY, rot);
		
			for(let i in poly){
				let boundary = new Boundary()
				if(i == poly.length-1){
					boundary.a = poly[i];
					boundary.b = poly[0];
				}
				else{
					boundary.a = poly[i];
					boundary.b = poly[parseInt(i)+1];
				}
				boundary.darkness = true;
				darknessBoundarys.push(boundary);
			}

		}
	}
	return darknessBoundarys;
}

function draw_aoe_to_canvas(targetAoes, ctx, isDarkness = false){

	for(let i = 0; i<targetAoes.length; i++){
		let currentAoe = $(targetAoes[i]);

		let left = parseFloat(currentAoe.css('left'));
		let top = parseFloat(currentAoe.css('top'));
		let width = parseFloat(currentAoe.css('width'));
		let height = parseFloat(currentAoe.css('height'));
		let scale = window.CURRENT_SCENE_DATA.scale_factor != undefined ? window.CURRENT_SCENE_DATA.scale_factor : 1;
		let halfGrid = window.CURRENT_SCENE_DATA.hpps/2;
		let divideScale = 1;
		let color = 'black';

		if(isDarkness == false){
			scale = 1;
			halfGrid = 0;
			divideScale = window.CURRENT_SCENE_DATA.scale_factor != undefined ? window.CURRENT_SCENE_DATA.scale_factor : 1;
			color = 'white';
		}
		if(currentAoe.find('.aoe-shape-circle').length>0){
			let centerX = (left + width/2) * scale;
			let centerY = (top + height/2) * scale;
			let radius = (width/2) * scale;
			drawCircle(ctx, centerX, centerY, radius, color)
		}
		if(currentAoe.find('.aoe-shape-square').length>0){
			width = width;
			height = height;
			let centerX = (left + width/2)/divideScale;
			let centerY = (top + height/2)/divideScale;

			let rotationRad = parseFloat(currentAoe.css('--token-rotation')) * (Math.PI/180) 

			ctx.translate(centerX, centerY);
			ctx.rotate(rotationRad);
			drawRect(ctx, -width/2*scale, -height/2*scale, width*scale, height*scale, color)
			ctx.rotate(-rotationRad);
			ctx.translate(-centerX, -centerY);
		}
		if(currentAoe.find('.aoe-shape-line').length>0){
			width = width;
			height = height;
			let centerX = (left + width/2)/divideScale;
			let centerY = (top + height/2)/divideScale;

			let rotationRad = parseFloat(currentAoe.css('--token-rotation')) * (Math.PI/180) 

			ctx.translate(centerX, centerY);
			ctx.rotate(rotationRad);
			drawRect(ctx, -width/2*scale, -height/2*scale, width*scale, height*scale, color)
			ctx.rotate(-rotationRad);
			ctx.translate(-centerX, -centerY);
		}
		if(currentAoe.find('.aoe-shape-cone').length>0){
			width = width;
			height = height;
			let centerX = (left + width/2)/divideScale;
			let centerY = (top + height/2)/divideScale;

			let rotationRad = parseFloat(currentAoe.css('--token-rotation')) * (Math.PI/180) 

			ctx.translate(centerX, centerY);
			ctx.rotate(rotationRad);
			drawCone(ctx, 0, (-height)/2*scale, 0, (height)/2*scale, color, true);
			ctx.rotate(-rotationRad);
			ctx.translate(-centerX, -centerY);
		}
	}
}

function draw_darkness_aoe_to_canvas(ctx){
	let darknessAoes = $('[data-darkness]');
	ctx.globalCompositeOperation='source-over';
	draw_aoe_to_canvas(darknessAoes, ctx, true);
}
function clipped_light(auraId, maskPolygon, playerTokenId, canvasWidth = getSceneMapSize().sceneWidth, canvasHeight = getSceneMapSize().sceneHeight, darknessBoundarys = getDarknessBoundarys(), numberOfSharedVisionTokens = 0){

	
	let visionColor = `rgba(0,0,0,0)`;
	let visionRange = 0;
	let light1Color = `rgba(0,0,0,0)`;
	let light2Color = `rgba(0,0,0,0)`;
	let light1Range = 0;
	let light2Range = 0;
	let blackLight1 = 1;
	let blackLight2 = 1;
	let blackVision = 1;

	if(window.TOKEN_OBJECTS[auraId] !== undefined){
		if(window.TOKEN_OBJECTS[auraId].options.vision !== undefined){
			if(window.TOKEN_OBJECTS[auraId].options.vision.color !== undefined)
				visionColor =  window.TOKEN_OBJECTS[auraId].options.vision.color;

			if(window.TOKEN_OBJECTS[auraId].options.vision.feet !== undefined)
				visionRange = window.TOKEN_OBJECTS[auraId].options.vision.feet;
		}
		if(window.TOKEN_OBJECTS[auraId].options.light1 !== undefined){
			if(window.TOKEN_OBJECTS[auraId].options.light1.color !== undefined)
				light1Color =  window.TOKEN_OBJECTS[auraId].options.light1.color; 
			if(window.TOKEN_OBJECTS[auraId].options.light1.feet !== undefined)
				light1Range =  window.TOKEN_OBJECTS[auraId].options.light1.feet; 
		}
		if(window.TOKEN_OBJECTS[auraId].options.light2 !== undefined){	
			if(window.TOKEN_OBJECTS[auraId].options.light2.color !== undefined)
				light2Color =  window.TOKEN_OBJECTS[auraId].options.light2.color; 

			if( window.TOKEN_OBJECTS[auraId].options.light2.feet !== undefined)
				light2Range =  window.TOKEN_OBJECTS[auraId].options.light2.feet 
		}
	}

	if(light1Color.match(/rgba\(0, 0, 0.*/g) !== null)
		blackLight1 = 0;

	if(light2Color.match(/rgba\(0, 0, 0.*/g) !== null)
		blackLight2 = 0;

	if(visionColor.match(/rgba\(0, 0, 0.*/g) !== null)
		blackVision = 0;


	let lightRadius = ((parseFloat(light1Range) * blackLight1) + (parseFloat(light2Range)*blackLight2))*window.CURRENT_SCENE_DATA.hpps/window.CURRENT_SCENE_DATA.fpsq 
	let darkvisionRadius = parseFloat(visionRange)*window.CURRENT_SCENE_DATA.hpps/window.CURRENT_SCENE_DATA.fpsq*blackVision;
	
	const selectedTokenCheck = numberOfSharedVisionTokens == 0 || (window.SelectedTokenVision !== true || window.CURRENTLY_SELECTED_TOKENS.includes(auraId) || window.CURRENTLY_SELECTED_TOKENS.length===0)

	let circleRadius = 0

	if(lightRadius > darkvisionRadius)
		circleRadius = lightRadius;
	else if (selectedTokenCheck === true && (window.DM === true || window.TOKEN_OBJECTS[auraId].options.share_vision === true || window.TOKEN_OBJECTS[auraId].options.share_vision == window.myUser || (window.TOKEN_OBJECTS[auraId].options.share_vision && is_spectator_page()) || auraId.includes(window.PLAYER_ID) || (window.TOKEN_OBJECTS[auraId].options.itemType === 'pc' && playerTokenId === undefined)))
		circleRadius = darkvisionRadius;
	else if(lightRadius > 0)
		circleRadius = lightRadius;
	
	darkvisionRadius += (window.TOKEN_OBJECTS[auraId].options.size / 2);
	let horizontalTokenMiddle = (parseInt(window.TOKEN_OBJECTS[auraId].options.left) + (window.TOKEN_OBJECTS[auraId].options.size / 2));
	let verticalTokenMiddle = (parseInt(window.TOKEN_OBJECTS[auraId].options.top) + (window.TOKEN_OBJECTS[auraId].options.size / 2));
	if(window.TOKEN_OBJECTS[auraId].options.type == 'door' && window.TOKEN_OBJECTS[auraId].options.scaleCreated){
		horizontalTokenMiddle /=  window.TOKEN_OBJECTS[auraId].options.scaleCreated;
		verticalTokenMiddle /=  window.TOKEN_OBJECTS[auraId].options.scaleCreated;
	}
	if(window.lightAuraClipPolygon[auraId] !== undefined){
		if(circleRadius === 0){
			delete window.lightAuraClipPolygon[auraId];
			return; // remove 0 range light and return
		}
		if(!window.SelectedTokenVision && window.lightAuraClipPolygon[auraId].numberOfWalls == walls.length+darknessBoundarys.length && window.lightAuraClipPolygon[auraId].light == lightRadius && window.lightAuraClipPolygon[auraId].darkvision == darkvisionRadius && window.lightAuraClipPolygon[auraId].middle.x == horizontalTokenMiddle && window.lightAuraClipPolygon[auraId].middle.y == verticalTokenMiddle)
			return; // token settings and position have not changed - a lot of light will be stationary do not redraw checker canvas
	}
	else if(circleRadius === 0){
		return; // don't make an object for 0 range light
	}

	

	window.lightAuraClipPolygon[auraId] = {
		light: lightRadius,
		darkvision: darkvisionRadius,
		light1: {
			range: light1Range > 0 ? light1Range * window.CURRENT_SCENE_DATA.hpps / window.CURRENT_SCENE_DATA.fpsq + (window.TOKEN_OBJECTS[auraId].options.size / 2) : 0,
			color: light1Color
		},
		light2: {
			range: light2Range > 0 ? (parseInt(light1Range) + parseInt(light2Range)) * window.CURRENT_SCENE_DATA.hpps / window.CURRENT_SCENE_DATA.fpsq + (window.TOKEN_OBJECTS[auraId].options.size / 2) : 0,
			color: light2Color
		},
		vision: {
			range: darkvisionRadius,
			color: visionColor
		},
		middle: {
			x: horizontalTokenMiddle,
			y: verticalTokenMiddle
		},
		numberOfWalls: walls.length+darknessBoundarys.length
	}


}




