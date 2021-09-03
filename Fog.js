const POLYGON_CLOSE_DISTANCE = 15;

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
			radius = 5;
		}

		this.ctx.beginPath();
		this.ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
		this.ctx.lineWidth = 5;
		this.ctx.strokeStyle = "black";
		this.ctx.stroke();
		this.ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
		this.ctx.fill();
	}

	// Increment the current index into the array of waypoints, and draw a small indicator
	checkNewWaypoint(mousex, mousey) {

		if (this.mouseDownCoords.mousex == mousex && this.mouseDownCoords.mousey == mousey) {

			//console.log("Incrementing waypoint");
			this.currentWaypointIndex++;

			// Draw an indicator for cosmetic niceness
			var snapCoords = this.getSnapPointCoords(mousex, mousey);
			this.drawBobble(snapCoords.x, snapCoords.y, 20);
		}
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

		// In future we may support other units(?), defaulting to 'ft' for feet
		var unitSymbol = "ft";

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
		this.ctx.font = "30px Arial";
		var text = "" + (distance + cumulativeDistance) + unitSymbol;
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
			contrastRect.height = 30 + (margin * 3);

			textRect.x = snapPointXEnd + slopeModifier;
			textRect.y = snapPointYEnd + slopeModifier;
			textRect.width = textMetrics.width + (margin * 3);
			textRect.height = 30 + margin;

			textX = snapPointXEnd + margin + slopeModifier;
			textY = snapPointYEnd + (margin * 2) + slopeModifier;
		}

		// Draw our 'contrast line'
		this.ctx.strokeStyle = "black";
		this.ctx.lineWidth = 5;
		this.ctx.lineTo(snapPointXEnd, snapPointYEnd);
		this.ctx.stroke();

		// Draw our centre line
		this.ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
		this.ctx.lineWidth = 3;
		this.ctx.lineTo(snapPointXEnd, snapPointYEnd);
		this.ctx.stroke();

		this.ctx.lineWidth = 3;
		this.ctx.strokeStyle = "black";
		this.ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
		roundRect(this.ctx, textRect.x, textRect.y, textRect.width, textRect.height, 10, true);

		// Finally draw our text
		this.ctx.fillStyle = "black";
		this.ctx.textBaseline = 'top';
		this.ctx.fillText(text, textX, textY);

		this.drawBobble(snapPointXStart, snapPointYStart);
		this.drawBobble(snapPointXEnd, snapPointYEnd, 3);
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

		var selector = "div[data-id='" + id + "']";
		if (pixeldata[3] == 255) {
			$(selector).hide();
		}
		else if (!window.TOKEN_OBJECTS[id].options.hidden) {
			$(selector).show();
			//console.log('SHOW '+id);
		}
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

function reset_canvas() {
	$('#fog_overlay').width($("#scene_map").width());
	$('#fog_overlay').height($("#scene_map").height());

	$('#grid_overlay').width($("#scene_map").width());
	$('#grid_overlay').height($("#scene_map").height());

	$('#draw_overlay').width($("#scene_map").width());
	$('#draw_overlay').height($("#scene_map").height());

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
			let al1 = {
				x: parseInt($("#aligner1").css("left")) + 29,
				y: parseInt($("#aligner1").css("top")) + 29,
			};

			let al2 = {
				x: parseInt($("#aligner2").css("left")) + 29,
				y: parseInt($("#aligner2").css("top")) + 29,
			};
			ctx_grid.setLineDash([30, 5]);

			ctx_grid.lineWidth = 2;
			ctx_grid.strokeStyle = "green";
			ctx_grid.beginPath();
			ctx_grid.moveTo(al1.x, al1.y);
			ctx_grid.lineTo(al2.x, al1.y);
			ctx_grid.stroke();
			ctx_grid.beginPath();
			ctx_grid.moveTo(al2.x, al1.y);
			ctx_grid.lineTo(al2.x, al2.y);
			ctx_grid.stroke();
			ctx_grid.beginPath();
			ctx_grid.moveTo(al2.x, al2.y);
			ctx_grid.lineTo(al1.x, al2.y);
			ctx_grid.stroke();
			ctx_grid.beginPath();
			ctx_grid.moveTo(al1.x, al2.y);
			ctx_grid.lineTo(al1.x, al1.y);
			ctx_grid.stroke();

			ctx_grid.strokeStyle = "rgba(255,0,0,1)";
			if (window.ScenesHandler.scene.upscaled == "1")
				ctx_grid.lineWidth = 2;
			else
				ctx_grid.lineWidth = 1;
			ctx_grid.setLineDash([30, 5]);
		}
		else {
			ctx_grid.strokeStyle = "rgba(0,0,0,0.5)";
			//ctx_grid.strokeStyle = "green";
			ctx_grid.lineWidth = 3;
		}

		//alert('inizio 1');

		if (window.CURRENT_SCENE_DATA.grid == "1") {
			var increment = window.CURRENT_SCENE_DATA.hpps;
			ctx_grid.lineWidth = 1;
			var skip = true;
			for (var i = startX; i < $("#scene_map").width(); i = i + increment) {
				if (window.CURRENT_SCENE_DATA.grid_subdivided == "1" && skip) {
					skip = false;
					continue;
				}
				else {
					skip = true;
				}

				ctx_grid.beginPath();
				ctx_grid.moveTo(i, 0);
				ctx_grid.lineTo(i, $("#scene_map").height());
				ctx_grid.stroke();

			}
			var increment = window.CURRENT_SCENE_DATA.vpps;
			skip = true;
			for (var i = startY; i < $("#scene_map").height(); i = i + increment) {
				if (window.CURRENT_SCENE_DATA.grid_subdivided == "1" && skip) {
					skip = false;
					continue;
				}
				else {
					skip = true;
				}
				ctx_grid.beginPath();
				ctx_grid.moveTo(0, i);
				ctx_grid.lineTo($("#scene_map").width(), i);
				ctx_grid.stroke();
			}
		}
		//alert('sopravvissuto');
	}
	else {
		ctx_grid.clearRect(0, 0, canvas_grid.width, canvas_grid.height);
	}
}

function redraw_canvas() {
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

function redraw_drawings() {
	var canvas = document.getElementById("draw_overlay");
	var ctx = canvas.getContext("2d");
	var lineWidth = 6;
	var style = "#FF0000";

	ctx.clearRect(0, 0, canvas.width, canvas.height);

	for (var i = 0; i < window.DRAWINGS.length; i++) {
		data = window.DRAWINGS[i];
		
		if (data[0] == "eraser") {
			ctx.clearRect(data[3], data[4], data[5], data[6]);
		}
		if (data[0] == "rect" && data[1] == "filled") {
			style = data[2];
			drawRect(ctx,data[3], data[4], data[5], data[6], style, true);
		}
		if (data[0] == "rect" && data[1] == "transparent") {
			style = data[2].replace(')', ', 0.5)').replace('rgb', 'rgba');
			drawRect(ctx,data[3], data[4], data[5], data[6], style, true);
		}
		if (data[0] == "rect" && data[1] == "border") {
			lineWidth = data.length > 7 ? data[7] : "6";
			style = data[2];
			drawRect(ctx,data[3], data[4], data[5], data[6], style, false, true,lineWidth );
		}
		if (data[0] == "arc" && data[1] == "filled") {
			style = data[2];
			drawCircle(ctx,data[3], data[4], data[5], style);
		}
		if (data[0] == "arc" && data[1] == "transparent") {
			style = data[2].replace(')', ', 0.5)').replace('rgb', 'rgba');
			drawCircle(ctx,data[3], data[4], data[5], style);
		}
		if (data[0] == "arc" && data[1] == "border") {
			style = data[2];
			lineWidth = data.length > 7 ? data[7] : "6";
			drawCircle(ctx,data[3], data[4], data[5], style, false, true, lineWidth);
		}
		if (data[0] == "cone" && data[1] == "transparent") {
			style = data[2].replace(')', ', 0.5)').replace('rgb', 'rgba');
			drawCone(ctx,data[3], data[4], data[5],data[6], style);
		}
		if (data[0] == "cone" && data[1] == "filled") {
			style = data[2];
			drawCone(ctx,data[3], data[4], data[5],data[6], style);
		}
		if (data[0] == "cone" && data[1] == "border") {
			style = data[2];
			lineWidth = data.length > 7 ? data[7] : "6";
			drawCone(ctx,data[3], data[4], data[5],data[6], style, false, true, lineWidth);
		}
		if (data[0] == "line") {
			style = data[2];
			lineWidth = data.length > 7 ? data[7] : "6";
			drawLine(ctx,data[3], data[4], data[5], data[6], style, lineWidth);
		}

		if (data[0] == "polygon" && data[1] == "filled") {
			style = data[2];
			drawPolygon(ctx,data[3], style, true);
		}
		if (data[0] == "polygon" && data[1] == "transparent") {
			style = data[2].replace(')', ', 0.5)').replace('rgb', 'rgba');
			drawPolygon(ctx,data[3], style, true);
		}
		if (data[0] == "polygon" && data[1] == "border") {
			style = data[2];
			lineWidth = data.length > 7 ? data[7] : "6";
			drawPolygon(ctx,data[3], style, false, true, lineWidth);
			ctx.stroke();
		}
		if (data[0] == "brush") {
			drawBrushstroke(ctx, data[3],data[2], (data.length > 7 ? data[7] : "6"), false);
		}
	}
}

function stop_drawing() {
	$("#reveal").css("background-color", "");
	window.MOUSEDOWN = false;
	var target = $("#fog_overlay");
	target.css('cursor', '');
	target.off('mousedown', drawing_mousedown);
	target.off('mouseup', drawing_mouseup);
	target.off('mousemove', drawing_mousemove);
	target.off('contextmenu', drawing_contextmenu);
	var target = $("#VTT");
	target.css('cursor', '');
	target.off('mousedown', drawing_mousedown);
	target.off('mouseup', drawing_mouseup);
	target.off('mousemove', drawing_mousemove);
	target.off('contextmenu', drawing_contextmenu);
}

function drawing_mousedown(e) {

	window.LINEWIDTH = $("#draw_line_width").val();
	window.DRAWTYPE = $(".drawTypeSelected ").attr('data-value');
	window.DRAWCOLOR = $(".colorselected").css('background-color');
	window.DRAWSHAPE = e.data.shape;
	window.DRAWFUNCTION = e.data.type;
	
	if (window.DRAWSHAPE === 'select') {
		$("#fog_overlay").css("z-index", "50");
		if (e.which == 1) {
			$("#fog_overlay").css('cursor', 'crosshair');
		}
	}

	if (window.DRAGGING && window.DRAWSHAPE != 'align')
		return;
	if (e.button != 0)
		return;
	deselect_all_tokens();
	if (shiftHeld == false || window.DRAWSHAPE != 'select') {
		deselect_all_tokens();
	}
	

	if (window.DRAWSHAPE === "polygon") {
		
		redraw_canvas();
		const pointX = (e.pageX - 200) * (1.0 / window.ZOOM);
		const pointY = (e.pageY - 200) * (1.0 / window.ZOOM);
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
		var canvas = document.getElementById("fog_overlay");
		var ctx = canvas.getContext("2d");
		var drawStroke = getDrawingStroke();
		var fill = getDrawingFill();
		var style = getDrawingStyle();
		var lineWidth = getDrawingLineWidth();
		drawPolygon(ctx,
			joinPointsArray(
				window.BEGIN_MOUSEX,
				window.BEGIN_MOUSEY
			),
			style,
			fill,
			drawStroke,
			lineWidth
		);
		drawClosingArea(ctx,window.BEGIN_MOUSEX[0], window.BEGIN_MOUSEY[0], !isNaN(window.DRAWFUNCTION));
	} else {
		window.BEGIN_MOUSEX = (e.pageX - 200) * (1.0 / window.ZOOM);
		window.BEGIN_MOUSEY = (e.pageY - 200) * (1.0 / window.ZOOM);
		window.MOUSEDOWN = true;
		if(window.DRAWSHAPE === "brush")
		{
			window.BRUSHWAIT = false;
			window.BRUSHPOINTS = [];
			window.BRUSHPOINTS.push({x:window.BEGIN_MOUSEX, y:window.BEGIN_MOUSEY});
			// draw a dot
			var canvas = document.getElementById("fog_overlay");
			var ctx = canvas.getContext("2d");
			window.BRUSHPOINTS.push({x:window.BEGIN_MOUSEX+1, y:window.BEGIN_MOUSEY+1});
			window.BRUSHPOINTS.push({x:window.BEGIN_MOUSEX-1, y:window.BEGIN_MOUSEY-1});
			window.BRUSHPOINTS.push({x:window.BEGIN_MOUSEX, y:window.BEGIN_MOUSEY});
			drawBrushstroke(ctx, window.BRUSHPOINTS,getDrawingStyle(),getDrawingLineWidth());
		}
	}

}

function drawing_mousemove(e) {

	var mousex = (e.pageX - 200) * (1.0 / window.ZOOM);
	var mousey = (e.pageY - 200) * (1.0 / window.ZOOM);
	
	var canvas = document.getElementById("fog_overlay");
	var ctx = canvas.getContext("2d");
	var drawStroke = getDrawingStroke();
	var fill = getDrawingFill();
	var style = getDrawingStyle();
	var lineWidth = getDrawingLineWidth();
	
	if (window.MOUSEDOWN) {
		var width = mousex - window.BEGIN_MOUSEX;
		var height = mousey - window.BEGIN_MOUSEY;
		
		if(window.DRAWSHAPE !== "brush")
		{
			redraw_canvas();
		}
		
		if (window.DRAWSHAPE == "rect") {
			drawRect(ctx,window.BEGIN_MOUSEX, window.BEGIN_MOUSEY, width, height, style, fill, drawStroke,lineWidth);
		}
		else if (window.DRAWSHAPE == "align") {
			for (i = 0; i < 4; i++) {
				ctx.strokeStyle = "rgba(255,0,0,0.7)";
				ctx.lineWidth = 1;
				ctx.beginPath();
				ctx.moveTo(window.BEGIN_MOUSEX + i * (width / 3.0), window.BEGIN_MOUSEY);
				ctx.lineTo(window.BEGIN_MOUSEX + i * (width / 3.0), window.BEGIN_MOUSEY + height);
				ctx.stroke();
				ctx.beginPath();
				ctx.moveTo(window.BEGIN_MOUSEX, window.BEGIN_MOUSEY + i * (height / 3.0));
				ctx.lineTo(window.BEGIN_MOUSEX + width, window.BEGIN_MOUSEY + i * (height / 3.0));
				ctx.stroke();

			}

			//ctx.fillRect(window.BEGIN_MOUSEX, window.BEGIN_MOUSEY, width, height);
		}
		else if (window.DRAWSHAPE == "arc") {
			centerX = (window.BEGIN_MOUSEX + mousex) / 2;
			centerY = (window.BEGIN_MOUSEY + mousey) / 2;
			radius = Math.round(Math.sqrt(Math.pow(centerX - mousex, 2) + Math.pow(centerY - mousey, 2)));
			drawCircle(ctx,centerX, centerY, radius, style, fill, drawStroke, lineWidth);
		}
		else if (window.DRAWSHAPE == "cone") {
			drawCone(ctx,window.BEGIN_MOUSEX, window.BEGIN_MOUSEY, mousex, mousey, style, fill, drawStroke, lineWidth);
		}
		else if (window.DRAWSHAPE == "line") {
			drawLine(ctx,window.BEGIN_MOUSEX, window.BEGIN_MOUSEY, mousex, mousey, style, lineWidth);
		}
		else if (window.DRAWSHAPE == "select") {
			ctx.save();
			ctx.strokeStyle = "white";
			ctx.setLineDash([10,5]);
			drawRect(ctx,window.BEGIN_MOUSEX, window.BEGIN_MOUSEY, width, height,"white",false,true);
			ctx.restore();
		}
		else if (window.DRAWSHAPE == "measure") {
			ctx.save();
			// ctx.beginPath();

			WaypointManager.setCanvas(canvas);
			WaypointManager.registerMouseMove(mousex, mousey);
			WaypointManager.storeWaypoint(WaypointManager.currentWaypointIndex, window.BEGIN_MOUSEX, window.BEGIN_MOUSEY, mousex, mousey);
			WaypointManager.draw(false);

			ctx.fillStyle = '#f50';

			ctx.restore();
		}
		else if (window.DRAWSHAPE == "brush"){
			// Only add a new point every 75ms to keep the drawing size low
			if(!window.BRUSHWAIT)
			{
				window.BRUSHPOINTS.push({x:mousex, y:mousey});
				
				drawBrushstroke(ctx, window.BRUSHPOINTS,style,lineWidth);
				
				window.BRUSHWAIT = true;
				setTimeout(function() {
					window.BRUSHWAIT = false;
				}, 75);
			}
		}
	} 
	else {
		if (window.DRAWSHAPE === "polygon" &&
			window.BEGIN_MOUSEX && window.BEGIN_MOUSEX.length > 0) {
			
			redraw_canvas();

			drawPolygon( ctx,
				joinPointsArray(
					window.BEGIN_MOUSEX,
					window.BEGIN_MOUSEY
				),
				style,
				fill,
				drawStroke,
				lineWidth,
				mousex,
				mousey
			);
			drawClosingArea(ctx,window.BEGIN_MOUSEX[0], window.BEGIN_MOUSEY[0], !isNaN(window.DRAWFUNCTION));
		}
	}
}

function drawing_mouseup(e) {

	mousex = (e.pageX - 200) * (1.0 / window.ZOOM);
	mousey = (e.pageY - 200) * (1.0 / window.ZOOM);

	if (window.DRAWSHAPE === 'select') {
		$("#fog_overlay").css("z-index", "31");
		$("#fog_overlay").css('cursor', '');
	}

	// Return early from this function if we are measuring and have hit the right mouse button
	if (window.DRAWSHAPE == "measure" && e.button == 2) {
		WaypointManager.checkNewWaypoint(mousex, mousey);
		//console.log("Measure right click");
		return;
	}
	
	// ignore if right mouse button for drawing or fog, cancel is done in drawing_contextmenu
	if((window.DRAWFUNCTION == "draw" || window.DRAWFUNCTION == "1" || window.DRAWFUNCTION == "0") && e.which !== 1)
	{
		return;
	}
	
	// ignore middle-mouse clicks
	if(e.which == 2)
	{
		return;
	}

	if (!window.MOUSEDOWN) {
		return;
	}

	window.MOUSEDOWN = false;
	var width = mousex - window.BEGIN_MOUSEX;
	var height = mousey - window.BEGIN_MOUSEY;


	// [0-3] is always shape data [4] is shape and [5] is type

	if (window.DRAWSHAPE == "line" && window.DRAWFUNCTION === "draw") {
		data = ['line', window.DRAWTYPE, window.DRAWCOLOR, window.BEGIN_MOUSEX, window.BEGIN_MOUSEY, mousex, mousey, window.LINEWIDTH];
		window.DRAWINGS.push(data);
		redraw_canvas();
		redraw_drawings();
		window.ScenesHandler.persist();
		window.MB.sendMessage('custom/myVTT/drawing', data);
	}

	if (window.DRAWSHAPE == "rect" && window.DRAWFUNCTION === "draw") {
		console.log('disegno');
		data = ['rect', window.DRAWTYPE, window.DRAWCOLOR, window.BEGIN_MOUSEX, window.BEGIN_MOUSEY, width, height,window.LINEWIDTH];
		window.DRAWINGS.push(data);
		redraw_canvas();
		redraw_drawings();
		window.ScenesHandler.persist();
		window.MB.sendMessage('custom/myVTT/drawing', data);
	}
	if (window.DRAWSHAPE == "rect" && window.DRAWFUNCTION === "eraser") {
		console.log('disegno');
		data = ['eraser', window.DRAWTYPE, window.DRAWCOLOR, window.BEGIN_MOUSEX, window.BEGIN_MOUSEY, width, height];
		window.DRAWINGS.push(data);
		redraw_canvas();
		redraw_drawings();
		window.ScenesHandler.persist();
		window.MB.sendMessage('custom/myVTT/drawing', data);
	}
	if (window.DRAWSHAPE == "arc" && window.DRAWFUNCTION === "draw") {
		console.log('son qua');
		centerX = (window.BEGIN_MOUSEX + mousex) / 2;
		centerY = (window.BEGIN_MOUSEY + mousey) / 2;
		radius = Math.round(Math.sqrt(Math.pow(centerX - mousex, 2) + Math.pow(centerY - mousey, 2)));
		data = ['arc', window.DRAWTYPE, window.DRAWCOLOR, centerX, centerY, radius,null,window.LINEWIDTH];
		window.DRAWINGS.push(data);
		redraw_canvas();
		redraw_drawings();
		window.ScenesHandler.persist();
		window.MB.sendMessage('custom/myVTT/drawing', data);
	}
	if (window.DRAWSHAPE == "cone" && window.DRAWFUNCTION === "draw") {
		data = ['cone', window.DRAWTYPE, window.DRAWCOLOR, window.BEGIN_MOUSEX, window.BEGIN_MOUSEY, mousex, mousey,window.LINEWIDTH];
		window.DRAWINGS.push(data);
		redraw_canvas();
		redraw_drawings();
		window.ScenesHandler.persist();
		window.MB.sendMessage('custom/myVTT/drawing', data);
	}
	if (window.DRAWSHAPE == "rect" && (window.DRAWFUNCTION === "0" || window.DRAWFUNCTION === "1")) {
		data = [window.BEGIN_MOUSEX, window.BEGIN_MOUSEY, width, height, 0];
		data[5] = parseInt(window.DRAWFUNCTION);
		window.REVEALED.push(data);
		window.MB.sendMessage('custom/myVTT/reveal', data);
		window.ScenesHandler.persist();
		redraw_canvas();
	}
	if(window.DRAWSHAPE == "brush" && window.DRAWFUNCTION === "draw") {
		window.BRUSHPOINTS.push({x:mousex, y:mousey});
		// cap with a dot
		window.BRUSHPOINTS.push({x:window.mousex+1, y:window.mousey+1});
		window.BRUSHPOINTS.push({x:window.mousex-1, y:window.mousey-1});
		data = ['brush', window.DRAWTYPE,window.DRAWCOLOR, window.BRUSHPOINTS,null,null,null,window.LINEWIDTH];
		//console.log("save brush");
		//console.log(data);
		window.DRAWINGS.push(data);
		redraw_canvas();
		redraw_drawings();
		window.ScenesHandler.persist();
		window.MB.sendMessage('custom/myVTT/drawing', data);
	}

	if (window.DRAWSHAPE == "arc" && (window.DRAWFUNCTION == 0 || window.DRAWFUNCTION == 1)) {
		centerX = (window.BEGIN_MOUSEX + mousex) / 2;
		centerY = (window.BEGIN_MOUSEY + mousey) / 2;
		radius = Math.round(Math.sqrt(Math.pow(centerX - mousex, 2) + Math.pow(centerY - mousey, 2)));
		data = [centerX, centerY, radius, 0, 1];
		data[5] = parseInt(window.DRAWFUNCTION);
		window.REVEALED.push(data);
		window.MB.sendMessage('custom/myVTT/reveal', data);
		window.ScenesHandler.persist();
		redraw_canvas();
	}
	if (window.DRAWSHAPE == "select") {
		// FIND TOKENS INSIDE THE AREA
		var c = 0;
		for (id in window.TOKEN_OBJECTS) {
			var curr = window.TOKEN_OBJECTS[id];
			var toktop = parseInt(curr.options.top);
			if ((Math.min(window.BEGIN_MOUSEY, mousey, toktop)) == toktop || (Math.max(window.BEGIN_MOUSEY, mousey, toktop) == toktop))
				continue;
			var tokleft = parseInt(curr.options.left);
			if ((Math.min(window.BEGIN_MOUSEX, mousex, tokleft)) == tokleft || (Math.max(window.BEGIN_MOUSEX, mousex, tokleft) == tokleft))
				continue;
			c++;
			// TOKEN IS INSIDE THE SELECTION
			curr.selected = true;
			//$("#tokens div[data-id='"+id+"']").addClass("tokenselected").css("border","2px solid white");
			curr.place();
		}

		window.MULTIPLE_TOKEN_SELECTED = (c > 1);

		redraw_canvas();
		console.log("READY");
		draw_selected_token_bounding_box();
	}
	if (window.DRAWSHAPE == "measure") {

		setTimeout(function () {
			// We do not clear if we are still measuring, added this as it somehow appeared multiple
			// timers could be set, may be a race condition or something still here...
			if (!WaypointManager.isMeasuring()) {
				redraw_canvas();
			}
		}, 2000);
		WaypointManager.clearWaypoints();
	}
	if (window.DRAWSHAPE == "align") {
		window.ScenesHandler.scene.grid_subdivided = "0";
		console.log("Horizontal Pixel Per Square: " + (width / 3.0) + " Vertical Pixel Per Square " + (height / 3.0));
		//ppsX=Math.round((width/window.ScenesHandler.scene.scaleX)/3);
		//ppsY=Math.round((height/window.ScenesHandler.scene.scaleY)/3);
		ppsX = Math.abs(width / 3.0); // let's try with subpixel precision
		ppsY = Math.abs(height / 3.0);
		offsetX = (window.BEGIN_MOUSEX) % ppsX;
		offsetY = (window.BEGIN_MOUSEY) % ppsY;

		let gotWidth = width;
		let gotHeight = height;
		let gotBeginX = window.BEGIN_MOUSEX;
		let gotBeginY = window.BEGIN_MOUSEY;

		// ASK FOR CONFIRMATION

		$("#grid_overlay").show();
		$("#tokens").show();
		window.ALIGNING = false;
		window.WIZARDING = true;
		$("#align-button").removeClass("button-enabled").css('background-color', '');
		stop_drawing();
		window.ScenesHandler.scene.hpps = ppsX;
		window.ScenesHandler.scene.vpps = ppsY;
		window.ScenesHandler.scene.offsetx = offsetX;
		window.ScenesHandler.scene.offsety = offsetY;
		window.ScenesHandler.scene.snap = "1";
		window.ScenesHandler.scene.grid = "1";
		window.ScenesHandler.persist();
		stop_drawing();
		$("#wizard_popup").empty();

		$("#wizard_popup").append("We are now super-imposing a grid on the image. Does the grid match ? (no need to be 100% accurate, but try to get close) <button id='grid_yes'>YES</button> <button id='grid_no'>NO</button>");

		$("#wizard_popup").find("#grid_no").click(
			function() {
				$("#wizard_popup").empty().append("Try again. Remember to ZOOM IN so that you can be more accurate!!!");
				$("#align-button").click();
			}
		);

		$("#wizard_popup").find("#grid_yes").click(
			function() {
				$("#wizard_popup").empty().append("Nice!! How many feet per square ? <button id='grid_5'>5</button> or <button id='grid_10'>10</button>");

				$("#grid_5").click(function() {
					window.WIZARDING = false;
					window.ScenesHandler.scene.snap = "1";
					window.ScenesHandler.scene.grid = "0";
					window.ScenesHandler.scene.fpsq = "5";
					window.ScenesHandler.scene.grid_subdivided = "0";
					window.ScenesHandler.persist();
					window.ScenesHandler.reload();
					$("#wizard_popup").empty().append("You're good to go!! Measurement tool calibrated. Token Snapping Enabled (you can remove it from manual grid data)");

					$("#wizard_popup").delay(2000).animate({ opacity: 0 }, 4000, function() {

						$("#wizard_popup").remove();
					});
				});

				$("#grid_10").click(function() {
					$("#wizard_popup").empty().append("Do you want me to subdivide the map grid in 2 so that you can get in-scale token size? <button id='grid_divide'>Yes</button> <button id='grid_nodivide'>No</button>");

					$("#grid_divide").click(function() {
						window.WIZARDING = false;
						$("#wizard_popup").empty().append("You're good to go! AboveVTT is now super-imposing a grid that divides the original grid map in half. If you want to hide this grid just edit the manual grid data.");
						window.ScenesHandler.scene.grid_subdivided = "1";
						window.ScenesHandler.scene.snap = "1";

						window.ScenesHandler.scene.grid = "1";
						window.ScenesHandler.scene.fpsq = "5";

						$("#wizard_popup").delay(5000).animate({ opacity: 0 }, 4000, function() {
							$("#wizard_popup").remove();
						});
						window.ScenesHandler.persist();
						window.ScenesHandler.reload();
					});

					$("#grid_nodivide").click(function() {
						window.WIZARDING = false;
						window.ScenesHandler.scene.snap = "1";
						window.ScenesHandler.scene.grid_subdivided = "0";
						window.ScenesHandler.scene.grid = "0";
						window.ScenesHandler.scene.fpsq = "10";
						window.ScenesHandler.persist();
						$("#wizard_popup").empty().append("You're good to go! Medium token will match the original grid size");
					});


				});


			}
		);


		setTimeout(function() {
			window.ScenesHandler.reload();
		}, 500);
	}
}

function drawing_contextmenu(e) {
	window.LINEWIDTH = $("#draw_line_width").val();
	window.DRAWTYPE = $(".drawTypeSelected ").attr('data-value');
	window.DRAWCOLOR = $(".colorselected").css('background-color');
	window.DRAWSHAPE = e.data.shape;
	window.DRAWFUNCTION = e.data.type;
	
	if (window.DRAWSHAPE === "polygon") {
		window.BEGIN_MOUSEX.pop();
		window.BEGIN_MOUSEY.pop();
		if(window.BEGIN_MOUSEX.length > 0)
		{
			var canvas = document.getElementById("fog_overlay");
			var ctx = canvas.getContext("2d");
			
			var drawStroke = getDrawingStroke();
			var fill = getDrawingFill();
			var style = getDrawingStyle();
			var lineWidth = getDrawingLineWidth();

			if (isNaN(window.DRAWFUNCTION)) {
				redraw_drawings();
			} else {
				redraw_canvas();
			}
			drawPolygon(
				ctx,
				joinPointsArray(
					window.BEGIN_MOUSEX,
					window.BEGIN_MOUSEY
				),
				style,
				fill,
				drawStroke,
				lineWidth,
				(e.pageX - 200) * (1.0 / window.ZOOM),
				(e.pageY - 200) * (1.0 / window.ZOOM)
			);
		}
		else
		{
			// cancel polygon if on last point
			redraw_canvas();
		}
	}
	else if((window.DRAWFUNCTION == "draw") || (window.DRAWFUNCTION == "1") || (window.DRAWFUNCTION == "0"))
	{
		// cancel shape
		window.MOUSEDOWN = false;
		redraw_canvas();
	}
}

function setup_draw_buttons() {

	var canvas = document.getElementById('fog_overlay');
	var ctx = canvas.getContext('2d');

	$(".drawbutton").click(function(e) {
		var clicked = this;
		if (!($(clicked).hasClass('menu-option'))) {						//handle menu open/close toggling
			$(".menu-button").not(clicked).removeClass('button-selected');
		}

		if ($(clicked).hasClass('menu-button')) {
			$(clicked).toggleClass('button-selected');
		}

		$(".top_menu").removeClass('visible');
		if ($("#fog_button").hasClass('button-selected')) {
			$("#fog_menu").addClass('visible');
			if ($(clicked).is("#fog_button") && !($(clicked).hasClass('button-enabled'))) {
				clicked = $(".fog-option.remembered-selection");
			}
		}

		if ($("#draw_button").hasClass('button-selected')) {
			$("#draw_menu").addClass('visible');
			if ($(clicked).is("#draw_button") && !($(clicked).hasClass('button-enabled'))) {
				clicked = $(".draw-option.remembered-selection");
			}
		}



		if (!($(clicked).hasClass('menu-button'))) {
			if ($(clicked).hasClass('button-enabled')  && !($(clicked).is('#select-button'))) {
				stop_drawing();
				$(".drawbutton").removeClass('button-enabled');
				$("#fog_overlay").css("z-index", "20");

				if (window.ALIGNING == true) {
					window.ALIGNING = false;
					window.ScenesHandler.reload();
				}

				$('#select-button').click();
				return;
			}

			stop_drawing();
			$(".drawbutton").removeClass('button-enabled');
			$(clicked).addClass('button-enabled');
			if ($(clicked).hasClass('fog-option')) {
				$(".fog-option").removeClass('remembered-selection');
				$(clicked).addClass('remembered-selection');
				$("#fog_button").addClass('button-enabled');
			}
			if ($(clicked).hasClass('draw-option')) {
				$(".draw-option").removeClass('remembered-selection');
				$(clicked).addClass('remembered-selection');
				$("#draw_button").addClass('button-enabled');
			}

			var target = $("#fog_overlay");
			if (!e.currentTarget.id || e.currentTarget.id !== "select-button") {
				target.css("z-index", "50");
			} else {
				target.css("z-index", "31");
			}

			if ($(e.target).attr('id') == "measure-button") {
				target = $("#VTT");
			}


			target.css('cursor', 'crosshair');
			if (e.currentTarget.id != "select-button") {
				target.css('cursor', 'crosshair');
			}

			$(clicked).addClass('button-enabled');

			var data = {
				shape: $(clicked).attr('data-shape'),
				type: $(clicked).attr('data-type'),
			}

			if ($(clicked).attr('id') == "align-button") {
				window.ALIGNING = true;

				// ALIGNING REQURES SPECIAL SETTINGS
				$("#scene_map").css("width", "auto");
				$("#scene_map").css("height", "auto");
				reset_canvas();
				redraw_canvas();
				$("#tokens").hide();
				$("#grid_overlay").hide();

			}
			else if (window.ALIGNING == true) {
				window.ALIGNING = false;
				window.ScenesHandler.reload();
			}


			target.on('mousedown', data, drawing_mousedown);
			target.on('mouseup', data, drawing_mouseup);
			target.on('mousemove', data, drawing_mousemove);
			target.on('contextmenu', data, drawing_contextmenu);
		}
	})
	$('#select-button').click();
}

function getDrawingStyle()
{
	var style = window.DRAWCOLOR;
	if(window.DRAWFUNCTION === "draw")
	{
		if(window.DRAWTYPE == "transparent")
		{
			style = style.replace(')', ', 0.5)').replace('rgb', 'rgba');
		}
		else
		{
			style =style.replace(')', ', 0.9)').replace('rgb', 'rgba');
		}
	}
	else if (window.DRAWFUNCTION === "1")
	{
		style = "rgba(0,0,0,0.5)";
	}
	else
	{
		style = "rgba(255,0,0,0.5)";
	}
	return style;
}

function getDrawingLineWidth()
{
	var lineWidth = window.LINEWIDTH;
	if(window.DRAWFUNCTION !== "draw")
	{
		lineWidth = 0;
	}
	return lineWidth;
}

function getDrawingFill()
{
	var fill = true;
	if((window.DRAWFUNCTION === "draw") && (window.DRAWTYPE == "border"))
	{
		fill = false;
	}
	return fill;
}

function getDrawingStroke()
{
	var drawStroke = false;
	if((window.DRAWFUNCTION === "draw") && (window.DRAWTYPE == "border"))
	{
		drawStroke = true;
	}
	return drawStroke;
}

function drawCircle(ctx, centerX, centerY, radius, style, fill=true, drawStroke = false, lineWidth = 6)
{
	ctx.beginPath();
	ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
	if(drawStroke)
	{
		ctx.strokeStyle = style;
		ctx.lineWidth = lineWidth;
		ctx.stroke();
	}
	if(fill)
	{
		ctx.fillStyle = style;
		ctx.fill();
	}
}

function drawRect(ctx, startx, starty, width, height, style, fill=true, drawStroke = false, lineWidth = 6)
{
	ctx.beginPath();
	if(drawStroke)
	{
		ctx.lineWidth = lineWidth;
		ctx.strokeStyle = style;
		ctx.beginPath();
		ctx.rect(startx, starty, width, height);
		ctx.stroke();
	}
	if(fill)
	{
		ctx.fillStyle = style;
		ctx.fillRect(startx, starty, width, height);
	}
}

function drawCone(ctx, startx, starty, endx, endy, style, fill=true, drawStroke = false, lineWidth = 6)
{
	var L = Math.sqrt(Math.pow(endx - startx, 2) + Math.pow(endy - starty, 2));
	var T = Math.sqrt(Math.pow(L, 2) + Math.pow(L / 2, 2));
	var res = circle_intersection(startx, starty, T, endx, endy, L / 2);
	ctx.beginPath();
	ctx.moveTo(startx, starty);
	ctx.lineTo(res[0], res[2]);
	ctx.lineTo(res[1], res[3]);
	ctx.closePath();
	if(drawStroke)
	{
		ctx.lineWidth = lineWidth;
		ctx.strokeStyle = style;
		ctx.stroke();
	}
	if(fill)
	{
		ctx.fillStyle = style;
		ctx.fill();
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
	drawStroke = false,
	lineWidth = 1,
	mouseX = null,
	mouseY = null
) {

	ctx.fillStyle = style;
	ctx.save();
	ctx.beginPath();


	ctx.moveTo(points[0].x, points[0].y);

	points.forEach((vertice) => {
		ctx.lineTo(vertice.x, vertice.y);
	})

	if (mouseX !== null && mouseY !== null) {
		ctx.lineTo(mouseX, mouseY);
	}
	
	ctx.closePath();
	if(drawStroke)
	{
		ctx.lineWidth = lineWidth;
	}
	else
	{
		ctx.lineWidth = 1;
	}
	
	if ((drawStroke) || (points.length < 2)) {
		ctx.strokeStyle = style;
		ctx.stroke();
	}
	if(fill)
	{
		ctx.fill();
	}
}

function savePolygon(e) {
	const polygonPoints = joinPointsArray(window.BEGIN_MOUSEX, window.BEGIN_MOUSEY);
	let data;
	if (isNaN(window.DRAWFUNCTION)) {
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
	} else {
		data = [
			polygonPoints,
			null,
			null,
			null,
			3,
			window.DRAWFUNCTION
		];
		window.REVEALED.push(data);
	}
	redraw_canvas();
	redraw_drawings();
	window.ScenesHandler.persist();
	window.MB.sendMessage(
		isNaN(window.DRAWFUNCTION) ?
			'custom/myVTT/drawing' : 'custom/myVTT/reveal',
		data
	);
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

function drawClosingArea(ctx, pointX, pointY, fog = true) {
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
