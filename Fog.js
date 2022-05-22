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
			radius = Math.max(15 * Math.max((1 - window.ZOOM), 0), 3);
		}

		this.ctx.beginPath();
		this.ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
		this.ctx.lineWidth = Math.max(25 * Math.max((1 - window.ZOOM), 0), 5);
		this.ctx.strokeStyle = "black";
		this.ctx.stroke();
		this.ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
		this.ctx.fill();
	}

	// Increment the current index into the array of waypoints, and draw a small indicator
	checkNewWaypoint(mousex, mousey) {
			//console.log("Incrementing waypoint");
			this.currentWaypointIndex++;

			// Draw an indicator for cosmetic niceness
			var snapCoords = this.getSnapPointCoords(mousex, mousey);
			this.drawBobble(snapCoords.x, snapCoords.y, Math.max(15 * Math.max((1 - window.ZOOM), 0), 3));
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
	}

	// Helper function to convert mouse coordinates to 'snap' or 'centre of current grid cell' coordinates
	getSnapPointCoords(x, y) {

		x -= window.CURRENT_SCENE_DATA.offsetx;
		y -= window.CURRENT_SCENE_DATA.offsety;

		var gridSize = window.CURRENT_SCENE_DATA.hpps;
		var currGridX = Math.floor(x / gridSize);
		var currGridY = Math.floor(y / gridSize);
		var snapPointXStart = (currGridX * gridSize) + (gridSize / 2);
		var snapPointYStart = (currGridY * gridSize) + (gridSize / 2);

		// Add in scene offset
		snapPointXStart += window.window.CURRENT_SCENE_DATA.offsetx;
		snapPointYStart += window.window.CURRENT_SCENE_DATA.offsety;

		return { x: snapPointXStart, y: snapPointYStart }
	}

	// Draw the waypoints, note that we sum up the cumulative distance, midlineLabels is true for token drag
	// as otherwise the token sits on the measurement label
	draw(midlineLabels) {

		var cumulativeDistance = 0
		for (var i = 0; i < this.coords.length; i++) {
			// We do the beginPath here because otherwise the lines on subsequent waypoints get
			// drawn over the labels...
			this.ctx.beginPath();
			this.drawWaypointSegment(this.coords[i], cumulativeDistance, midlineLabels);
			cumulativeDistance += this.coords[i].distance;
		}
	}

	// Draw a waypoint segment with all the lines and labels etc.
	drawWaypointSegment(coord, cumulativeDistance, midlineLabels) {

		// Snap to centre of current grid square
		var gridSize = window.CURRENT_SCENE_DATA.hpps;
		var snapCoords = this.getSnapPointCoords(coord.startX, coord.startY);
		var snapPointXStart = snapCoords.x;
		var snapPointYStart = snapCoords.y;
		this.ctx.moveTo(snapPointXStart, snapPointYStart);

		snapCoords = this.getSnapPointCoords(coord.endX, coord.endY);
		var snapPointXEnd = snapCoords.x;
		var snapPointYEnd = snapCoords.y;

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
		this.ctx.font = Math.max(150 * Math.max((1 - window.ZOOM), 0), 30) + "px Arial";
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
		}
		else {
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
			contrastRect.height =  Math.max(150 * Math.max((1 - window.ZOOM), 0), 30) + (margin * 3);

			textRect.x = snapPointXEnd + slopeModifier;
			textRect.y = snapPointYEnd + slopeModifier;
			textRect.width = textMetrics.width + (margin * 3);
			textRect.height =  Math.max(150 * Math.max((1 - window.ZOOM), 0), 30) + margin;

			textX = snapPointXEnd + margin + slopeModifier;
			textY = snapPointYEnd + (margin * 2) + slopeModifier;
		}

		// Draw our 'contrast line'
		this.ctx.strokeStyle = "black";
		this.ctx.lineWidth = Math.round(Math.max(25 * Math.max((1 - window.ZOOM), 0), 5));
		this.ctx.lineTo(snapPointXEnd, snapPointYEnd);
		this.ctx.stroke();

		// Draw our centre line
		this.ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
		this.ctx.lineWidth = Math.round(Math.max(15 * Math.max((1 - window.ZOOM), 0), 3));
		this.ctx.lineTo(snapPointXEnd, snapPointYEnd);
		this.ctx.stroke();

		this.ctx.lineWidth = Math.round(Math.max(15 * Math.max((1 - window.ZOOM), 0), 3));
		this.ctx.strokeStyle = "black";
		this.ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
		roundRect(this.ctx, textRect.x, textRect.y, textRect.width, textRect.height, 10, true);

		// Finally draw our text
		this.ctx.fillStyle = "black";
		this.ctx.textBaseline = 'top';
		this.ctx.fillText(text, textX, textY);

		this.drawBobble(snapPointXStart, snapPointYStart);
		this.drawBobble(snapPointXEnd, snapPointYEnd, Math.max(15 * Math.max((1 - window.ZOOM), 0), 3));
	}

	/**
	 * redraws the waypoints using various levels of opacity until completely clear
	 * then removes all waypoints and resets canvas opacity
	 */
	fadeoutMeasuring(){
		let alpha = 1.0
		const self = this
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
			alpha = alpha - 0.2;
			if (alpha <= 0.0){
				self.cancelFadeout()
				self.clearWaypoints();
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


function check_token_visibility() {
	if (window.DM || $("#fog_overlay").is(":hidden"))
		return;
	var canvas = document.getElementById("fog_overlay");
	var ctx = canvas.getContext("2d");


	for (var id in window.TOKEN_OBJECTS) {
		var left = parseInt(window.TOKEN_OBJECTS[id].options.left.replace('px', '')) + (window.TOKEN_OBJECTS[id].options.size / 2);
		var top = parseInt(window.TOKEN_OBJECTS[id].options.top.replace('px', '')) + (window.TOKEN_OBJECTS[id].options.size / 2);
		var pixeldata = ctx.getImageData(left, top, 1, 1).data;
		auraSelectorId = $(".token[data-id='" + id + "']").attr("data-id").replaceAll("/", "");
		var selector = "div[data-id='" + id + "']";
		let auraSelector = ".aura-element[id='aura_" + auraSelectorId + "']";
		if (pixeldata[3] == 255) {
			$(selector).hide();
			if(window.TOKEN_OBJECTS[id].options.hideaurafog)
			{
					$(auraSelector).hide();
			}			
		}
		else if (!window.TOKEN_OBJECTS[id].options.hidden) {
			$(selector).show();
			$(auraSelector).show();
			//console.log('SHOW '+id);
		}
		$(".aura-element[id='aura_" + auraSelectorId + "'] ~ .aura-element[id='aura_" + auraSelectorId + "']").remove();
	}
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
	clear_grid()
	gridContext.setLineDash(dash);
	let startX = offsetX || window.CURRENT_SCENE_DATA.offsetx;
	let startY = offsetY || window.CURRENT_SCENE_DATA.offsety;
	startX = Math.round(startX)
	startY = Math.round(startY)
	const incrementX = hpps || window.CURRENT_SCENE_DATA.hpps;
	const incrementY = vpps || window.CURRENT_SCENE_DATA.vpps; 
	gridContext.lineWidth = lineWidth || window.CURRENT_SCENE_DATA.grid_line_width;
	gridContext.strokeStyle = color || window.CURRENT_SCENE_DATA.grid_color;
	let isSubdivided = subdivide === "1" || window.CURRENT_SCENE_DATA.grid_subdivided === "1"
	let skip = true;

	gridContext.beginPath();
	for (var i = startX; i < $("#scene_map").width(); i = i + incrementX) {
		if (isSubdivided && skip) {
			skip = false;
			continue;
		}
		else {
			skip = true;
		}
		gridContext.moveTo(i, 0);
		gridContext.lineTo(i, $("#scene_map").height());
	}
	gridContext.stroke();
	skip = true;

	gridContext.beginPath();
	for (var i = startY; i < $("#scene_map").height(); i = i + incrementY) {
		if (isSubdivided && skip) {
			skip = false;
			continue;
		}
		else {
			skip = true;
		}
		gridContext.moveTo(0, i);
		gridContext.lineTo($("#scene_map").width(), i);
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
		x: parseInt($("#aligner1").css("left")) + 29,
		y: parseInt($("#aligner1").css("top")) + 29,
	};

	let al2 = {
		x: parseInt($("#aligner2").css("left")) + 29,
		y: parseInt($("#aligner2").css("top")) + 29,
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

function reset_canvas() {
	$('#temp_overlay').get(0).width =($("#scene_map").width());
	$('#temp_overlay').get(0).height =($("#scene_map").width());

	$('#fog_overlay').get(0).width =($("#scene_map").width());
	$('#fog_overlay').get(0).height =($("#scene_map").height());

	$('#grid_overlay').get(0).width =($("#scene_map").width());
	$('#grid_overlay').get(0).height =($("#scene_map").height());

	$('#text_overlay').get(0).width= ($("#scene_map").width());
	$('#text_overlay').get(0).height = ($("#scene_map").height());

	$('#draw_overlay').get(0).width = $("#scene_map").width();
	$('#draw_overlay').get(0).height = $("#scene_map").height();
	var canvas = document.getElementById("fog_overlay");
	var ctx = canvas.getContext("2d");

	if (!window.FOG_OF_WAR) {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		return;
	}


	canvas.width = $("#scene_map").width();
	canvas.height = $("#scene_map").height();
	if (window.DM) {
		ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
	}
	else {
		ctx.fillStyle = "rgb(0, 0, 0)";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
	}


	var canvas_grid = document.getElementById("grid_overlay");
	var ctx_grid = canvas_grid.getContext("2d");
	if (window.CURRENT_SCENE_DATA && (window.CURRENT_SCENE_DATA.grid == "1" || window.WIZARDING) && window.CURRENT_SCENE_DATA.hpps > 10 && window.CURRENT_SCENE_DATA.vpps > 10) {
		//alert(window.CURRENT_SCENE_DATA.hpps + " "+ window.CURRENT_SCENE_DATA.vpps);
		canvas_grid.width = $("#scene_map").width();
		canvas_grid.height = $("#scene_map").height();

		startX = Math.round(window.CURRENT_SCENE_DATA.offsetx);
		startY = Math.round(window.CURRENT_SCENE_DATA.offsety);

		//alert(startX+ " "+startY);
		if (window.WIZARDING) {
			draw_wizarding_box()
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
		if (d.length == 4) { // SIMPLE CASE OF RECT TO REVEAL
			ctx.clearRect(d[0], d[1], d[2], d[3]);
			continue;
		}
		if (d[5] == 0) { //REVEAL
			if (d[4] == 0) { // REVEAL SQUARE
				ctx.clearRect(d[0], d[1], d[2], d[3]);
			}
			if (d[4] == 1) { // REVEAL CIRCLE
				clearCircle(ctx, d[0], d[1], d[2]);
			}
			if (d[4] == 2) {
				// reveal ALL!!!!!!!!!!
				ctx.clearRect(0, 0, $("#scene_map").width(), $("#scene_map").height());
			}
			if (d[4] == 3) {
				// REVEAL POLYGON
				clearPolygon(ctx, d[0]);
			}
		}
		if (d[5] == 1) { // HIDE
			if (d[4] == 0) { // HIDE SQUARE
				ctx.clearRect(d[0], d[1], d[2], d[3]);
				ctx.fillStyle = fogStyle;
				ctx.fillRect(d[0], d[1], d[2], d[3]);
			}
			if (d[4] == 1) { // HIDE CIRCLE
				clearCircle(ctx, d[0], d[1], d[2]);
				drawCircle(ctx, d[0], d[1], d[2], fogStyle);
			}
			if (d[4] == 3) {
				// HIDE POLYGON
				drawPolygon(ctx, d[0], fogStyle);
			}
		}
	}
}


/**
 * Redraws all text drawing types from window.DRAWINGS
 */
function redraw_text() {
	const canvas = document.getElementById("text_overlay");
	const context = canvas.getContext("2d");
	context.clearRect(0, 0, canvas.width, canvas.height);

	const textDrawings = window.DRAWINGS.filter(d => d[0].includes("text"))

	textDrawings.forEach(drawing => {
		const [shape, fill, color, x, y, width, height, text, font, stroke] = drawing
		switch (shape) {
			case "text":
				draw_text(context, ...drawing);
				break;
			case "text-rect":
				// incase we have a drop-shadow filter applied still
				context.filter = "none"
				drawRect(context,x,y,width,height,color);
				break;
			case "text-eraser":
				context.clearRect(x, y, width, height);
				break;
			default:
				break;
		}
	})
}

function redraw_drawings() {
	let canvas = document.getElementById("draw_overlay");
	let ctx = canvas.getContext("2d");

	ctx.clearRect(0, 0, canvas.width, canvas.height);
	const drawings = window.DRAWINGS.filter(d => !d[0].includes("text"))

	for (var i = 0; i < drawings.length; i++) {
		const [shape, fill, color, x, y, width, height, lineWidth] = drawings[i];
		const isFilled = fill === "filled"

		if (shape == "eraser") {
			ctx.clearRect(x, y, width, height);
		}
		if (shape == "rect") {
			drawRect(ctx,x, y, width, height, color, isFilled, lineWidth);
		}
		if (shape == "arc") {
			const radius = width
			drawCircle(ctx,x, y, radius, color, isFilled, lineWidth);
		}
		if (shape == "cone") {
			drawCone(ctx, x, y, width, height, color, isFilled, lineWidth);
		}
		if (shape == "line") {
			drawLine(ctx,x, y, width, height, color, lineWidth);
		}
		if (shape == "polygon") {
			drawPolygon(ctx,x, color, isFilled, lineWidth);
			// ctx.stroke();
		}
		if (shape == "brush") {
			drawBrushstroke(ctx, x, color, lineWidth, false);
		}
	}
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
	const pointX = Math.round(((event.pageX - 200) * (1.0 / window.ZOOM)));
	const pointY = Math.round(((event.pageY - 200) * (1.0 / window.ZOOM)));
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
	clear_temp_canvas()
	WaypointManager.cancelFadeout()
	if(e.button !== 2){
		WaypointManager.clearWaypoints()
	}

	// always draw unbaked drawings to the temp overlay
	canvas = document.getElementById("temp_overlay");
	context = canvas.getContext("2d");
	// select modifies this line but never resets it, so reset it here
	// otherwise all drawings are dashed
	context.setLineDash([])
	// get teh data from the menu's/buttons
	const data = get_draw_data(e.data.clicked,  e.data.menu)
	
	// these are generic values used by most drawing functionality
	window.LINEWIDTH = data.draw_line_width
	window.DRAWTYPE = data.fill
	window.DRAWCOLOR = data.background_color
	window.DRAWSHAPE = data.shape;
	window.DRAWFUNCTION = data.function;

	// some functions don't have selectable features
	// such as colour / filltype so set them here
	if(window.DRAWFUNCTION === "reveal" || window.DRAWFUNCTION === "eraser"){
		// semi transparent red
		window.DRAWCOLOR = "rgba(255, 0, 0, 0.5)"
		window.DRAWTYPE = "filled"
	}
	else if (window.DRAWFUNCTION === "hide" || window.DRAWFUNCTION === "draw_text"){
		// semi transparent black
		window.DRAWCOLOR = "rgba(0, 0, 0, 0.5)"
		window.DRAWTYPE = "filled"
	}
	else if (window.DRAWFUNCTION === "select"){
		window.DRAWCOLOR = "rgba(255, 255, 255, 1)"
		context.setLineDash([10, 5])
		if (e.which == 1) {
			$("#temp_overlay").css('cursor', 'crosshair');
		}		
	}
// figure out what these 3 returns are supposed to be for.
	if ($(".context-menu-list.context-menu-root ~ .context-menu-list.context-menu-root:visible, .body-rpgcharacter-sheet .context-menu-list.context-menu-root").length>0){
		return;
	}

	if (window.DRAGGING && window.DRAWSHAPE != 'align')
		return;
	if (e.button != 0 && window.DRAWFUNCTION != "measure")
		return;

	if (shiftHeld == false || window.DRAWFUNCTION != 'select') {
		deselect_all_tokens();
	}
	// end of wtf is this return block doing?
	const [pointX, pointY] = get_event_cursor_position(e)
	
	if(window.DRAWSHAPE === "brush"){
		window.BRUSHWAIT = false;
		window.BRUSHPOINTS = [];
		window.BRUSHPOINTS.push({x:window.BEGIN_MOUSEX, y:window.BEGIN_MOUSEY});
		// draw a dot
		window.BRUSHPOINTS.push({x:window.BEGIN_MOUSEX+1, y:window.BEGIN_MOUSEY+1});
		window.BRUSHPOINTS.push({x:window.BEGIN_MOUSEX-1, y:window.BEGIN_MOUSEY-1});
		window.BRUSHPOINTS.push({x:window.BEGIN_MOUSEX, y:window.BEGIN_MOUSEY});
		drawBrushstroke(context, window.BRUSHPOINTS,window.DRAWCOLOR,window.LINEWIDTH);
	}
	else if (window.DRAWSHAPE === "polygon") {
		if (window.BEGIN_MOUSEX && window.BEGIN_MOUSEX.length > 0) {
			if (
				isPointWithinDistance(
					{ x: window.BEGIN_MOUSEX[0], y: window.BEGIN_MOUSEY[0] },
					{ x: pointX , y: pointY}
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
	const [mouseX, mouseY] = get_event_cursor_position(e)

	var canvas = document.getElementById("temp_overlay");
	var context = canvas.getContext("2d");

	const color = window.DRAWCOLOR
	const isFilled = window.DRAWTYPE === "filled"
	const mouseMoveFps = Math.round((1000.0 / 16.0));

	
	window.MOUSEMOVEWAIT = true;
	setTimeout(function() {
		window.MOUSEMOVEWAIT = false;
	}, mouseMoveFps);

	if (window.MOUSEDOWN) {
		clear_temp_canvas()
		var width = mouseX - window.BEGIN_MOUSEX;
		var height = mouseY - window.BEGIN_MOUSEY;
		// bain todo why is this here?
		if(window.DRAWSHAPE !== "brush")
		{
			redraw_fog();
		}

		if (window.DRAWSHAPE == "rect") {
			drawRect(context,
					 window.BEGIN_MOUSEX,
				 	 window.BEGIN_MOUSEY,
				  	 width,
				   	 height,
					 window.DRAWCOLOR,
					 isFilled,
					 window.LINEWIDTH);
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
			centerX = (window.BEGIN_MOUSEX + mouseX) / 2;
			centerY = (window.BEGIN_MOUSEY + mouseY) / 2;
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
					WaypointManager.storeWaypoint(WaypointManager.currentWaypointIndex, window.BEGIN_MOUSEX, window.BEGIN_MOUSEY, mouseX, mouseY);
					WaypointManager.draw(false);
					console.log(WaypointManager)
					context.fillStyle = '#f50';
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
			
		}
		else if (window.DRAWSHAPE == "brush"){
			// Only add a new point every 75ms to keep the drawing size low
			// Subtract mouseMoveFps from 75ms to avoid waiting too much
			if(!window.BRUSHWAIT)
			{
				window.BRUSHPOINTS.push({x:mouseX, y:mouseY});

				drawBrushstroke(context, window.BRUSHPOINTS, window.DRAWCOLOR, lineWidth);

				window.BRUSHWAIT = true;
				if (mouseMoveFps < 75) {
					setTimeout(function() {
						window.BRUSHWAIT = false;
					}, (75 - mouseMoveFps));
				}
			}
		}
	}
	else {
		if (window.DRAWSHAPE === "polygon" &&
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
	}
}

/**
 * Drawing finished (most of the time) set the final shape into window.DRAWING/windo.REVEAL
 * then call redraw functions and sync functions
 * @param {Event} e 
 * @returns 
 */
function drawing_mouseup(e) {
	const [mouseX, mouseY] = get_event_cursor_position(e)
	// Return early from this function if we are measuring and have hit the right mouse button
	if (window.DRAWFUNCTION == "measure" && e.button == 2) {
		if(window.MOUSEDOWN && WaypointManager.isMeasuring()) {
			WaypointManager.checkNewWaypoint(mouseX, mouseY);
		}
		//console.log("Measure right click");
		return;
	}
	// ignore if right mouse button for drawing or fog, cancel is done in drawing_contextmenu
	if((window.DRAWFUNCTION == "draw" || window.DRAWFUNCTION == "reveal" || window.DRAWFUNCTION == "hide" || window.DRAWFUNCTION == "draw_text") && e.which !== 1)
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
	if (window.DRAWSHAPE !== "polygon" && window.DRAWFUNCTION !== "measure"){
		clear_temp_canvas()
	}

	if (window.DRAWFUNCTION === 'select') {
		$("#temp_overlay").css('cursor', '');
	}
	
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
		 window.LINEWIDTH];

	if ((window.DRAWFUNCTION !== "select" || window.DRAWFUNCTION !== "measure") &&
		(window.DRAWFUNCTION === "draw")){
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
				window.BRUSHPOINTS.push({x:window.mouseX+1, y:window.mouseY+1});
				window.BRUSHPOINTS.push({x:window.mouseX-1, y:window.mouseY-1});
				data[0] = "brush"
				data[3] = window.BRUSHPOINTS
				data[4] = null
				data[5] = null
				data[6] = null
				break;
			default:
				break;
		}
		window.DRAWINGS.push(data);
		redraw_drawings();
		window.ScenesHandler.persist();
		if(window.CLOUD)
			sync_drawings();
		else
			window.MB.sendMessage('custom/myVTT/drawing', data);
	}
	else if (window.DRAWFUNCTION === "eraser"){
		if (window.DRAWSHAPE === "rect"){
			data[0] = "eraser"
			window.DRAWINGS.push(data);
			redraw_drawings();
		}
		else if (window.DRAWSHAPE === "text_erase"){
			// text eraser lives on a different overlay and thus can't just be eraser
			data[0] = "text-eraser"
			window.DRAWINGS.push(data);
			redraw_text();
		}
		window.ScenesHandler.persist();
		if(window.CLOUD)
			sync_drawings();
		else
			window.MB.sendMessage('custom/myVTT/drawing', data);
	}
	else if (window.DRAWFUNCTION === "draw_text"){
		data[0] = "text"
		data[3] = e.clientX
		data[4] = e.clientY
		add_text_drawing_input(data)
	}
	else if (window.DRAWFUNCTION == "hide" || window.DRAWFUNCTION == "reveal"){
		finalise_drawing_fog(mouseX, mouseY, width, height)
	}
	
	else if (window.DRAWFUNCTION == "select") {
		// FIND TOKENS INSIDE THE AREA
		var c = 0;
		for (id in window.TOKEN_OBJECTS) {
			var curr = window.TOKEN_OBJECTS[id];
			var toktop = parseInt(curr.options.top);
			if ((Math.min(window.BEGIN_MOUSEY, mouseY, toktop)) == toktop || (Math.max(window.BEGIN_MOUSEY, mouseY, toktop) == toktop))
				continue;
			var tokleft = parseInt(curr.options.left);
			if ((Math.min(window.BEGIN_MOUSEX, mouseX, tokleft)) == tokleft || (Math.max(window.BEGIN_MOUSEX, mouseX, tokleft) == tokleft))
				continue;
			c++;
			// TOKEN IS INSIDE THE SELECTION
			if (window.DM || !curr.options.hidden) {
				let tokenDiv = $("#tokens>div[data-id='" + curr.options.id + "']")
				if(tokenDiv.css("pointer-events")!="none" && tokenDiv.css("display")!="none" && !tokenDiv.hasClass("ui-draggable-disabled")) {
					curr.selected = true;
				}
			}
			//$("#tokens div[data-id='"+id+"']").addClass("tokenselected").css("border","2px solid white");
			curr.place();
		}

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
				Math.round(((e.pageX - 200) * (1.0 / window.ZOOM))),
				Math.round(((e.pageY - 200) * (1.0 / window.ZOOM)))
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
		centerX = (window.BEGIN_MOUSEX + mouseX) / 2;
		centerY = (window.BEGIN_MOUSEY + mouseY) / 2;
		radius = Math.round(Math.sqrt(Math.pow(centerX - mouseX, 2) + Math.pow(centerY - mouseY, 2)));
		data = [centerX, centerY, radius, 0, 1, fog_type_to_int()];
		window.REVEALED.push(data);
		if(window.CLOUD)
			sync_fog();
		else
			window.MB.sendMessage('custom/myVTT/reveal', data);
		window.ScenesHandler.persist();
		redraw_fog();
	} else if (window.DRAWSHAPE == "rect") {
		data = [window.BEGIN_MOUSEX, window.BEGIN_MOUSEY, width, height, 0, fog_type_to_int()];
		window.REVEALED.push(data);
		if(window.CLOUD)
			sync_fog();
		else
			window.MB.sendMessage('custom/myVTT/reveal', data);
		window.ScenesHandler.persist();
		redraw_fog();
	}
}

/**
 * Hides all open menus from the top buttons and deselects all the buttons
 */
function deselect_all_top_buttons(buttonSelectedClasses) {
	topButtonIDs = ["select-button", "measure-button", "fog_button", "draw_button", "aoe_button", "text_button"]
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
	console.group("get_draw_data")
	console.log(button)
	console.log(menu)
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
		target =  $("#temp_overlay, #black_layer")
		data = {
			clicked:$(clicked),
			menu:$(menu)
		}
		// allow all drawing to be done above the tokens
		if ($(clicked).is("#select-button")){
			$("#temp_overlay").css("z-index", "25")
		}
		else{
			$("#temp_overlay").css("z-index", "50")
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
	ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
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
		ctx.fillRect(startx, starty, width, height);
	}
	else
	{
		ctx.lineWidth = lineWidth;
		ctx.strokeStyle = style;
		ctx.beginPath();
		ctx.rect(startx, starty, width, height);
		ctx.stroke();
	}
	
}

function drawCone(ctx, startx, starty, endx, endy, style, fill=true, lineWidth = 6)
{
	var L = Math.sqrt(Math.pow(endx - startx, 2) + Math.pow(endy - starty, 2));
	var T = Math.sqrt(Math.pow(L, 2) + Math.pow(L / 2, 2));
	var res = circle_intersection(startx, starty, T, endx, endy, L / 2);
	ctx.beginPath();
	ctx.moveTo(startx, starty);
	ctx.lineTo(res[0], res[2]);
	ctx.lineTo(res[1], res[3]);
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

function drawLine(ctx, startx, starty, endx, endy, style, lineWidth = 6)
{
	ctx.beginPath();
	ctx.strokeStyle = style;
	ctx.lineWidth = lineWidth;
	ctx.moveTo(startx, starty);
	ctx.lineTo(endx, endy);
	ctx.stroke();
}

function drawBrushstroke(ctx, points, style, lineWidth=6)
{
	// Copyright (c) 2021 by Limping Ninja (https://codepen.io/LimpingNinja/pen/qBmpvqj)
    // Fork of an original work  (https://codepen.io/kangax/pen/pxfCn

	var p1 = points[0];
	var p2 = points[1];

	ctx.strokeStyle = style;
	ctx.lineWidth = lineWidth;
	ctx.beginPath();
	ctx.moveTo(p1.x, p1.y);

	for (var i = 1, len = points.length; i < len; i++) {
	// we pick the point between pi+1 & pi+2 as the
	// end point and p1 as our control point
	var midPoint = midPointBtw(p1, p2);
	ctx.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
	p1 = points[i];
	p2 = points[i+1];
	}
	// Draw last line as a straight line
	ctx.lineTo(p1.x, p1.y);
	ctx.stroke();
}

function drawPolygon (
	ctx,
	points,
	style = 'rgba(255,0,0,0.6)',
	fill = true,
	lineWidth,
	mouseX = null,
	mouseY = null
) {
	ctx.save();
	ctx.beginPath();
	ctx.moveTo(points[0].x, points[0].y);
	ctx.lineWidth = lineWidth;

	points.forEach((vertice) => {
		ctx.lineTo(vertice.x, vertice.y);
	})

	if (mouseX !== null && mouseY !== null) {
		ctx.lineTo(mouseX, mouseY);
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
	}
	else{
		ctx.strokeStyle = style;
		ctx.stroke();
	}
	
}

function clear_temp_canvas(){
	const canvas = document.getElementById("temp_overlay");
	const context = canvas.getContext("2d");
	context.clearRect(0, 0, canvas.width, canvas.height);
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
			fog_type_to_int()
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
			window.LINEWIDTH
		];
		window.DRAWINGS.push(data);
		redraw_drawings();
	}
	clear_temp_canvas()
	
	window.ScenesHandler.persist();

	if(window.CLOUD){
		if(window.DRAWFUNCTION === "draw"){
			sync_drawings();
		}
		else{
			sync_fog();
		}			
	}
	else{
		window.MB.sendMessage(
			window.DRAWFUNCTION === "draw" ?
				 'custom/myVTT/reveal' : 'custom/myVTT/drawing',
			data
		);
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

function clearPolygon (ctx, points) {

	/*
	 * globalCompositeOperation does not accept alpha transparency,
	 * need to set it to opaque color.
	 */
	ctx.fillStyle = "#000";
	ctx.globalCompositeOperation = 'destination-out';
	ctx.beginPath();
	ctx.moveTo(points[0].x, points[0].y);
	points.forEach((vertice) => {
		ctx.lineTo(vertice.x, vertice.y);
	})
	ctx.closePath();
	ctx.fill();
	ctx.stroke();
	ctx.restore();
	ctx.globalCompositeOperation = "source-over";
}

function clearCircle(ctx, centerX, centerY, radius)
{
	ctx.save();
	ctx.beginPath();
	ctx.fillStyle = "rgba(0,0,0,0);"
	ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
	ctx.clip();
	ctx.clearRect(centerX - radius, centerY - radius, radius * 2, radius * 2);
	ctx.restore();
}

function drawClosingArea(ctx, pointX, pointY) {
	ctx.strokeStyle = "#00FFFF";
	ctx.lineWidth = "2";
	ctx.beginPath();
	ctx.rect(
		pointX - POLYGON_CLOSE_DISTANCE,
		pointY - POLYGON_CLOSE_DISTANCE,
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

	var clear_button = $("<button class='ddbc-tab-options__header-heading menu-option' data-skip='true' >ALL</button>");
	clear_button.click(function() {

		r = confirm("This will delete all FOG zones and REVEAL ALL THE MAP to the player. THIS CANNOT BE UNDONE. Are you sure?");
		if (r == true) {
			window.REVEALED = [[0, 0, $("#scene_map").width(), $("#scene_map").height()]];
			redraw_fog();
			if(window.CLOUD){
				sync_fog();
			}
			else{
				window.ScenesHandler.persist();
				window.ScenesHandler.sync();
			}
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



	var hide_all_button = $("<button class='ddbc-tab-options__header-heading menu-option'>ALL</button>");
	hide_all_button.click(function() {
		r = confirm("This will delete all FOG zones and HIDE ALL THE MAP to the player. THIS CANNOT BE UNDONE. Are you sure?");
		if (r == true) {
			window.REVEALED = [];
			redraw_fog();
			if(window.CLOUD){
				sync_fog();
			}
			else{
				window.ScenesHandler.persist();
				window.ScenesHandler.sync();
			}
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
	fog_menu.css("width", "75px");
	fog_menu.css('background', "url('/content/1-0-1487-0/skins/waterdeep/images/mon-summary/paper-texture.png')")
	$("body").append(fog_menu);
	fog_menu.find("#fog_undo").click(function(){
		window.REVEALED.pop();
		redraw_fog();
		if(window.CLOUD){
			sync_fog();
		}
		else{
			window.ScenesHandler.persist();
			window.ScenesHandler.sync();
		}
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
	

	draw_menu.append(`
        <input title='Background color' data-required="background_color" class='spectrum'
            id='background_color' name='background color' value='#e66465'/>
        `)

    let colorPickers = draw_menu.find('input.spectrum');
	colorPickers.spectrum({
		type: "color",
		showInput: true,
		showInitial: true,
		clickoutFiresChange: false
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
			<input id='draw_line_width' data-required="draw_line_width" type='range' style='width:90%' min='1'
			max='60' value='6' class='drawWidthSlider'>
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
	draw_menu.append(
		`<div class='ddbc-tab-options--layout-pill' data-skip='true'>
			<button class='ddbc-tab-options__header-heading  menu-option' id='delete_drawing'>
				CLEAR
			</button>
		</div>`);

	draw_menu.find("#delete_drawing").click(function() {
		r = confirm("DELETE ALL DRAWINGS (cannot be undone!)");
		if (r === true) {
			// keep only text
			window.DRAWINGS = window.DRAWINGS.filter(d => d[0].includes("text"));
			redraw_drawings();
			sync_drawings
		}
	});

	draw_menu.find("#draw_undo").click(function() {
		// start at the end
        let currentElement = window.DRAWINGS.length
        // loop from the last element and remove if it's not text
        while (currentElement--) {
            if (!window.DRAWINGS[currentElement][0].includes("text")){
                window.DRAWINGS.splice(currentElement, 1)
                redraw_drawings();
				sync_drawings()
                break
            }
        }
	});

	draw_menu.css("position", "fixed");
	draw_menu.css("top", "50px");
	draw_menu.css("width", "75px");
	draw_menu.css('background', "url('/content/1-0-1487-0/skins/waterdeep/images/mon-summary/paper-texture.png')")

	$("body").append(draw_menu);

	draw_button = $("<button style='display:inline;width:75px' id='draw_button' class='drawbutton menu-button hideable ddbc-tab-options__header-heading'><u>D</u>RAW</button>");

	buttons.append(draw_button);
	draw_menu.css("left",draw_button.position().left);	
}