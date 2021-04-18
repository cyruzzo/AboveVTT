
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
		if (pixeldata[3] === 255) {
			console.log(selector);
			$(selector).hide();
			console.log('HIDE ' + id);
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
	if (window.CURRENT_SCENE_DATA && (window.CURRENT_SCENE_DATA.grid === "1" || window.WIZARDING) && window.CURRENT_SCENE_DATA.hpps > 10 && window.CURRENT_SCENE_DATA.vpps > 10) {
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
			if (window.ScenesHandler.scene.upscaled === "1")
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

		if (window.CURRENT_SCENE_DATA.grid === "1") {
			var increment = window.CURRENT_SCENE_DATA.hpps;
			ctx_grid.lineWidth = 1;
			var skip = true;
			for (var i = startX; i < $("#scene_map").width(); i = i + increment) {
				if (window.CURRENT_SCENE_DATA.grid_subdivided === "1" && skip) {
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
				if (window.CURRENT_SCENE_DATA.grid_subdivided === "1" && skip) {
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
	//ctx.globalCompositeOperation = 'destination-out';

	if (window.DM)
		fogStyle = "rgba(0, 0, 0, 0.5)";
	else
		fogStyle = "rgb(0, 0, 0)";


	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = fogStyle;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	for (var i = 0; i < window.REVEALED.length; i++) {
		var d = window.REVEALED[i];
		if (d.length === 4) { // SIMPLE CASE OF RECT TO REVEAL
			ctx.clearRect(d[0], d[1], d[2], d[3]);
			continue;
		}
		if (d[5] === 0) { //REVEAL
			if (d[4] === 0) { // REVEAL SQUARE
				ctx.clearRect(d[0], d[1], d[2], d[3]);
			}
			if (d[4] === 1) { // REVEAL CIRCLE
				ctx.save();
				ctx.beginPath();
				ctx.fillStyle = "rgba(0,0,0,0);"
				ctx.arc(d[0], d[1], d[2], 0, 2 * Math.PI, false);
				ctx.clip();
				ctx.clearRect(d[0] - d[2], d[1] - d[2], d[2] * 2, d[2] * 2);
				ctx.restore();
			}
			if (d[4] === 2) {
				// reveal ALL!!!!!!!!!!
				ctx.clearRect(0, 0, $("#scene_map").width(), $("#scene_map").height());
			}
		}
		if (d[5] === 1) { // HIDE
			if (d[4] === 0) { // HIDE SQUARE
				ctx.clearRect(d[0], d[1], d[2], d[3]);
				ctx.fillStyle = fogStyle;
				ctx.fillRect(d[0], d[1], d[2], d[3]);
			}
			if (d[4] === 1) { // HIDE CIRCLE
				ctx.save();
				ctx.beginPath();
				ctx.arc(d[0], d[1], d[2], 0, 2 * Math.PI, false);
				ctx.clip();
				ctx.clearRect(d[0] - d[2], d[1] - d[2], d[2] * 2, d[2] * 2);
				ctx.restore();
				ctx.fillStyle = fogStyle;
				ctx.arc(d[0], d[1], d[2], 0, 2 * Math.PI, false);
				ctx.fill();


			}
		}
	}
}


function redraw_drawings() {
	var canvas = document.getElementById("draw_overlay");
	var ctx = canvas.getContext("2d");

	ctx.clearRect(0, 0, canvas.width, canvas.height);

	for (var i = 0; i < window.DRAWINGS.length; i++) {
		data = window.DRAWINGS[i];


		if (data[0] === "eraser") {
			ctx.clearRect(data[3], data[4], data[5], data[6]);
		}
		if (data[0] === "rect" && data[1] === "filled") {
			ctx.fillStyle = data[2];
			ctx.fillRect(data[3], data[4], data[5], data[6]);
		}
		if (data[0] === "rect" && data[1] === "transparent") {
			ctx.fillStyle = data[2].replace(')', ', 0.5)').replace('rgb', 'rgba');
			ctx.fillRect(data[3], data[4], data[5], data[6]);
		}
		if (data[0] === "rect" && data[1] === "border") {
			ctx.strokeStyle = data[2];
			ctx.lineWidth = "6";
			ctx.beginPath();
			ctx.rect(data[3], data[4], data[5], data[6]);
			ctx.stroke();
		}
		if (data[0] === "arc" && data[1] === "filled") {
			ctx.fillStyle = data[2];
			ctx.save();
			ctx.beginPath();
			ctx.arc(data[3], data[4], data[5], 0, 2 * Math.PI, false);
			ctx.clip();
			ctx.clearRect(data[3] - data[5], data[4] - data[5], data[5] * 2, data[5] * 2);
			ctx.restore();
			ctx.arc(data[3], data[4], data[5], 0, 2 * Math.PI, false);
			ctx.fill();
		}
		if (data[0] === "arc" && data[1] === "transparent") {
			ctx.fillStyle = data[2].replace(')', ', 0.5)').replace('rgb', 'rgba');
			ctx.save();
			ctx.beginPath();
			ctx.arc(data[3], data[4], data[5], 0, 2 * Math.PI, false);
			ctx.clip();
			ctx.clearRect(data[3] - data[5], data[4] - data[5], data[5] * 2, data[5] * 2);
			ctx.restore();
			ctx.arc(data[3], data[4], data[5], 0, 2 * Math.PI, false);
			ctx.fill();
		}
		if (data[0] === "arc" && data[1] === "border") {
			ctx.strokeStyle = data[2];
			ctx.lineWidth = "6";
			ctx.beginPath();
			ctx.arc(data[3], data[4], data[5], 0, 2 * Math.PI, false);
			ctx.stroke();
		}
		if (data[0] === "cone" && data[1] === "transparent") {
			ctx.fillStyle = data[2].replace(')', ', 0.5)').replace('rgb', 'rgba');
			var L = Math.sqrt(Math.pow(data[5] - data[3], 2) + Math.pow(data[6] - data[4], 2));
			var T = Math.sqrt(Math.pow(L, 2) + Math.pow(L / 2, 2));
			var res = circle_intersection(data[3], data[4], T, data[5], data[6], L / 2);
			ctx.lineWidth = "6";
			ctx.beginPath();
			ctx.moveTo(data[3], data[4]);
			ctx.lineTo(res[0], res[2]);
			ctx.lineTo(res[1], res[3]);
			ctx.closePath();
			ctx.fill();
		}
		if (data[0] === "cone" && data[1] === "filled") {
			ctx.fillStyle = data[2];
			var L = Math.sqrt(Math.pow(data[5] - data[3], 2) + Math.pow(data[6] - data[4], 2));
			var T = Math.sqrt(Math.pow(L, 2) + Math.pow(L / 2, 2));
			var res = circle_intersection(data[3], data[4], T, data[5], data[6], L / 2);
			ctx.lineWidth = "6";
			ctx.beginPath();
			ctx.moveTo(data[3], data[4]);
			ctx.lineTo(res[0], res[2]);
			ctx.lineTo(res[1], res[3]);
			ctx.closePath();
			ctx.fill();
		}
		if (data[0] === "cone" && data[1] === "border") {
			ctx.strokeStyle = data[2];
			var L = Math.sqrt(Math.pow(data[5] - data[3], 2) + Math.pow(data[6] - data[4], 2));
			var T = Math.sqrt(Math.pow(L, 2) + Math.pow(L / 2, 2));
			var res = circle_intersection(data[3], data[4], T, data[5], data[6], L / 2);
			ctx.lineWidth = "6";
			ctx.beginPath();
			ctx.moveTo(data[3], data[4]);
			ctx.lineTo(res[0], res[2]);
			ctx.lineTo(res[1], res[3]);
			ctx.closePath();
			ctx.stroke();
		}
		if (data[0] === "line") {
			ctx.strokeStyle = data[2];
			ctx.lineWidth = "6";
			ctx.beginPath();
			ctx.moveTo(data[3], data[4]);
			ctx.lineTo(data[5], data[6]);
			ctx.stroke();
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
	var target = $("#VTT");
	target.css('cursor', '');
	target.off('mousedown', drawing_mousedown);
	target.off('mouseup', drawing_mouseup);
	target.off('mousemove', drawing_mousemove);
}

function drawing_mousedown(e) {
	if (window.DRAGGING && e.data.shap !== 'align')
		return;
	if (e.button !== 0)
		return;
	deselect_all_tokens();




	window.BEGIN_MOUSEX = (e.pageX - 200) * (1.0 / window.ZOOM);
	window.BEGIN_MOUSEY = (e.pageY - 200) * (1.0 / window.ZOOM);
	window.MOUSEDOWN = true;

}


function drawing_mousemove(e) {

	if (window.MOUSEDOWN) {
		var canvas = document.getElementById("fog_overlay");
		var ctx = canvas.getContext("2d");
		var mousex = (e.pageX - 200) * (1.0 / window.ZOOM);
		var mousey = (e.pageY - 200) * (1.0 / window.ZOOM);
		var width = mousex - window.BEGIN_MOUSEX;
		var height = mousey - window.BEGIN_MOUSEY;
		redraw_canvas();

		ctx.fillStyle = "#FF0000";
		if (e.data.shape === "rect") {
			ctx.fillStyle = "rgba(255,0,0,0.7)";
			ctx.fillRect(window.BEGIN_MOUSEX, window.BEGIN_MOUSEY, width, height);
		}
		else if (e.data.shape === "align") {
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
		else if (e.data.shape === "arc") {
			centerX = (window.BEGIN_MOUSEX + mousex) / 2;
			centerY = (window.BEGIN_MOUSEY + mousey) / 2;
			radius = Math.round(Math.sqrt(Math.pow(centerX - mousex, 2) + Math.pow(centerY - mousey, 2)));
			ctx.beginPath();
			ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
			ctx.fill();
		}
		else if (e.data.shape === "cone") {
			var L = Math.sqrt(Math.pow(mousex - window.BEGIN_MOUSEX, 2) + Math.pow(mousey - window.BEGIN_MOUSEY, 2));
			var T = Math.sqrt(Math.pow(L, 2) + Math.pow(L / 2, 2));
			var res = circle_intersection(window.BEGIN_MOUSEX, window.BEGIN_MOUSEY, T, mousex, mousey, L / 2);
			ctx.fillStyle = "rgba(255,0,0,0.7)";
			ctx.lineWidth = "6";
			ctx.beginPath();
			ctx.moveTo(window.BEGIN_MOUSEX, window.BEGIN_MOUSEY);
			ctx.lineTo(res[0], res[2]);
			ctx.lineTo(res[1], res[3]);
			ctx.closePath();
			ctx.fill();
		}
		else if (e.data.shape === "line") {
			ctx.beginPath();
			ctx.strokeStyle = "rgba(255,0,0,0.7)";
			ctx.lineWidth = 6;
			ctx.moveTo(window.BEGIN_MOUSEX, window.BEGIN_MOUSEY);
			ctx.lineTo(mousex, mousey);
			ctx.stroke();
		}
		else if (e.data.shape === "select") {
			ctx.save();
			ctx.beginPath();
			ctx.strokeStyle = "white";
			ctx.rect(window.BEGIN_MOUSEX, window.BEGIN_MOUSEY, width, height);
			ctx.stroke();
			ctx.restore();
		}
		else if (e.data.shape === "measure") {
			ctx.save();
			ctx.beginPath();
			ctx.strokeStyle = "rgba(255,0,0,0.9)";
			ctx.lineWidth = 10;
			ctx.moveTo(window.BEGIN_MOUSEX, window.BEGIN_MOUSEY);
			ctx.lineTo(mousex, mousey);
			ctx.stroke();
			ctx.font = "30px Arial";
			ctx.fillStyle = "black";
			// distance in pixel / 60px * fpsq
			//var foots=Math.round(Math.sqrt(Math.pow(mousex-window.BEGIN_MOUSEX,2)+Math.pow(mousey-window.BEGIN_MOUSEY,2))/60)*window.ScenesHandler.scene.fpsq;
			var foots = Math.round(Math.max(Math.abs(mousex - window.BEGIN_MOUSEX), Math.abs(mousey - window.BEGIN_MOUSEY)) / window.CURRENT_SCENE_DATA.hpps) * window.CURRENT_SCENE_DATA.fpsq;
			var textwidth = ctx.measureText(foots).width;

			ctx.fillStyle = "white";
			ctx.fillRect(window.BEGIN_MOUSEX, window.BEGIN_MOUSEY, textwidth, 30);

			ctx.fillStyle = "black";
			ctx.textBaseline = 'top';
			//ctx.fillText(foots,(window.BEGIN_MOUSEX+mousex)/2,(window.BEGIN_MOUSEY+mousey)/2);
			ctx.fillText(foots, window.BEGIN_MOUSEX, window.BEGIN_MOUSEY);

			ctx.fillStyle = '#f50';

			ctx.restore();
		}


	}
}

function drawing_mouseup(e) {
	if (!window.MOUSEDOWN)
		return;

	window.MOUSEDOWN = false;
	mousex = (e.pageX - 200) * (1.0 / window.ZOOM);
	mousey = (e.pageY - 200) * (1.0 / window.ZOOM);
	var width = mousex - window.BEGIN_MOUSEX;
	var height = mousey - window.BEGIN_MOUSEY;


	// [0-3] is always shape data [4] is shape and [5] is type

	if (e.data.shape === "line" && e.data.type === "draw") {
		data = ['line', $(".drawTypeSelected ").attr('data-value'), $(".colorselected").css('background-color'), window.BEGIN_MOUSEX, window.BEGIN_MOUSEY, mousex, mousey];
		window.DRAWINGS.push(data);
		redraw_canvas();
		redraw_drawings();
		window.ScenesHandler.persist();
		window.MB.sendMessage('custom/myVTT/drawing', data);
	}

	if (e.data.shape === "rect" && e.data.type === "draw") {
		console.log('disegno');
		data = ['rect', $(".drawTypeSelected ").attr('data-value'), $(".colorselected").css('background-color'), window.BEGIN_MOUSEX, window.BEGIN_MOUSEY, width, height];
		window.DRAWINGS.push(data);
		redraw_canvas();
		redraw_drawings();
		window.ScenesHandler.persist();
		window.MB.sendMessage('custom/myVTT/drawing', data);
	}
	if (e.data.shape === "rect" && e.data.type === "eraser") {
		console.log('disegno');
		data = ['eraser', $(".drawTypeSelected ").attr('data-value'), $(".colorselected").css('background-color'), window.BEGIN_MOUSEX, window.BEGIN_MOUSEY, width, height];
		window.DRAWINGS.push(data);
		redraw_canvas();
		redraw_drawings();
		window.ScenesHandler.persist();
		window.MB.sendMessage('custom/myVTT/drawing', data);
	}
	if (e.data.shape === "arc" && e.data.type === "draw") {
		console.log('son qua');
		centerX = (window.BEGIN_MOUSEX + mousex) / 2;
		centerY = (window.BEGIN_MOUSEY + mousey) / 2;
		radius = Math.round(Math.sqrt(Math.pow(centerX - mousex, 2) + Math.pow(centerY - mousey, 2)));
		data = ['arc', $(".drawTypeSelected ").attr('data-value'), $(".colorselected").css('background-color'), centerX, centerY, radius];
		window.DRAWINGS.push(data);
		redraw_canvas();
		redraw_drawings();
		window.ScenesHandler.persist();
		window.MB.sendMessage('custom/myVTT/drawing', data);
	}
	if (e.data.shape === "cone" && e.data.type === "draw") {
		data = ['cone', $(".drawTypeSelected ").attr('data-value'), $(".colorselected").css('background-color'), window.BEGIN_MOUSEX, window.BEGIN_MOUSEY, mousex, mousey];
		window.DRAWINGS.push(data);
		redraw_canvas();
		redraw_drawings();
		window.ScenesHandler.persist();
		window.MB.sendMessage('custom/myVTT/drawing', data);
	}
	if (e.data.shape === "rect" && (e.data.type === "0" || e.data.type === "1")) {
		data = [window.BEGIN_MOUSEX, window.BEGIN_MOUSEY, width, height, 0];
		data[5] = parseInt(e.data.type);
		window.REVEALED.push(data);
		window.MB.sendMessage('custom/myVTT/reveal', data);
		window.ScenesHandler.persist();
		redraw_canvas();
	}



	if (e.data.shape === "arc" && (e.data.type === 0 || e.data.type === 1)) {
		centerX = (window.BEGIN_MOUSEX + mousex) / 2;
		centerY = (window.BEGIN_MOUSEY + mousey) / 2;
		radius = Math.round(Math.sqrt(Math.pow(centerX - mousex, 2) + Math.pow(centerY - mousey, 2)));
		data = [centerX, centerY, radius, 0, 1];
		data[5] = parseInt(e.data.type);
		window.REVEALED.push(data);
		window.MB.sendMessage('custom/myVTT/reveal', data);
		window.ScenesHandler.persist();
		redraw_canvas();
	}
	if (e.data.shape === "select") {
		// FIND TOKENS INSIDE THE AREA
		var c = 0;
		for (id in window.TOKEN_OBJECTS) {
			var curr = window.TOKEN_OBJECTS[id];
			var toktop = parseInt(curr.options.top);
			if ((Math.min(window.BEGIN_MOUSEY, mousey, toktop)) === toktop || (Math.max(window.BEGIN_MOUSEY, mousey, toktop) === toktop))
				continue;
			var tokleft = parseInt(curr.options.left);
			if ((Math.min(window.BEGIN_MOUSEX, mousex, tokleft)) === tokleft || (Math.max(window.BEGIN_MOUSEX, mousex, tokleft) === tokleft))
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
	}
	if (e.data.shape === "measure") {
		setTimeout(redraw_canvas, 3000); // hide the mea			
	}
	if (e.data.shape === "align") {
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


function setup_draw_buttons() {


	var canvas = document.getElementById('fog_overlay');
	var ctx = canvas.getContext('2d');

	$(".drawbutton").click(function(e) {
		if ($(this).hasClass('button-enabled')) {
			stop_drawing();
			$(".drawbutton").removeClass('button-enabled').css('background-color', '');

			if (window.ALIGNING === true) {
				window.ALIGNING = false;
				window.ScenesHandler.reload();
			}

			return;
		}
		stop_drawing();
		$(".drawbutton").removeClass('button-enabled').css('background-color', '');
		$(this).addClass('button-enabled');
		$(this).css("background-color", "red");


		var target = $("#fog_overlay");

		if ($(e.target).attr('id') === "measure-button") {
			target = $("#VTT");
		}


		target.css('cursor', 'crosshair');

		$(this).css("background-color", "red");
		$(this).addClass('button-enabled');

		var data = {
			shape: $(this).attr('data-shape'),
			type: $(this).attr('data-type'),
		}

		if ($(this).attr('id') === "align-button") {
			window.ALIGNING = true;

			// ALIGNING REQURES SPECIAL SETTINGS
			$("#scene_map").css("width", "auto");
			$("#scene_map").css("height", "auto");
			reset_canvas();
			redraw_canvas();
			$("#tokens").hide();
			$("#grid_overlay").hide();

		}
		else if (window.ALIGNING === true) {
			window.ALIGNING = false;
			window.ScenesHandler.reload();
		}


		target.on('mousedown', data, drawing_mousedown);
		target.on('mouseup', data, drawing_mouseup);
		target.on('mousemove', data, drawing_mousemove);
	})
}

