/******************
Código por Vamoss
Link original:
https://www.openprocessing.org/sketch/903104

Links do autor:
http://vamoss.com.br
http://twitter.com/vamoss
http://github.com/vamoss
******************/

const sketchMetaball = p5js => {	
	//METABALLS
	const TOTAL_METABALL = 4;
	let metaballs = [], sha, shaGraph;

	var points = [];
	const radius = 70;

	//DEBUG
	var useMouse = false;

	var isSafari = false;

	class MetaBall {
		constructor(color, x, y) {
			this.pos = p5js.createVector(x, y);
			this.color = color;
			this.r = color[0];
			this.g = color[1];
			this.b = color[2];
		}
	}

	p5js.preload = () => {
		sha = p5js.loadShader("js/shader.vert", "js/shader.frag");
	}

	p5js.setup = () => {
		p5js.createCanvas(250, 200, p5js.WEBGL);
		shaGraph = p5js.createGraphics(250, 250, p5js.WEBGL);
		p5js.pixelDensity(2);
		shaGraph.pixelDensity(2);

		for(let i = 0; i <= p5js.TWO_PI + 0.01; i += p5js.TWO_PI/6){
			var xx = p5js.cos(i) * radius;
			var yy = p5js.sin(i) * radius;
			points.push(p5js.createVector(xx, yy));
		}

		if(useMouse){
			p5js.addToMetaball({pos:{x: 0, y: 0}, color:p5js.color(255,0,0)});
		}

		p5js.noLoop();
		p5js.draw();

		var ua = navigator.userAgent.toLowerCase(); 
		if (ua.indexOf('safari') != -1) { 
			if (ua.indexOf('chrome') == -1) {
				isSafari = true;
			}
		}
	}

	p5js.draw = () => {
		p5js.frameCount++;

		p5js.clear();

		if(metaballs.length>0){

			p5js.fill(0, 0, 0, 0);
			p5js.stroke(200, 200, 200);
			p5js.beginShape();
			for(let i = 0; i < points.length; i++){
				p5js.vertex(points[i].x*1.4, points[i].y*1.4, 0);
			}
			p5js.endShape();

			// p5js.circle(getMouseX(), getMouseY(), 10);
		
			if(useMouse){
				var coord = constrainCoord(
					{
						x: getMouseX(),
						y: getMouseY()
					}, 
					points
				)
				metaballs[0].pos.x = coord.x;
				metaballs[0].pos.y = coord.y;
			}

			let posX = new Array(TOTAL_METABALL);
			let posY = new Array(TOTAL_METABALL);
			let R = new Array(TOTAL_METABALL);
			let G = new Array(TOTAL_METABALL);
			let B = new Array(TOTAL_METABALL);
			for(let i = 0; i < TOTAL_METABALL; i++){
				if(i < metaballs.length) {
					posX[i] = metaballs[i].pos.x;
					posY[i] = metaballs[i].pos.y;
					R[i] = metaballs[i].r;
					G[i] = metaballs[i].g;
					B[i] = metaballs[i].b;
				}else{
					posX[i] = -1000;
					posY[i] = -1000;
					R[i] = 1;
					G[i] = 1;
					B[i] = 1;
				}
			}

			sha.setUniform("resolution", [p5js.width * p5js.pixelDensity(), p5js.height * p5js.pixelDensity()]);
			sha.setUniform("time", p5js.millis() / 1000.0);
			sha.setUniform("mouse", [p5js.mouseX, p5js.mouseY]);
			sha.setUniform("posX", posX);
			sha.setUniform("posY", posY);
			sha.setUniform("R", R);
			sha.setUniform("G", G);
			sha.setUniform("B", B);
			sha.setUniform("intensity", config.intensity);
			sha.setUniform("contour", config.contour);
			shaGraph.shader(sha);

			p5js.push();
				if(isSafari){
					p5js.scale(1, -1);
					p5js.translate(0, -50);
				}
				shaGraph.quad(0, 0, 1, 0, 1, 1, 0, 1);

				p5js.image(shaGraph, -p5js.width/2, -p5js.height/2);
			p5js.pop();
		}
		/*
		p5js.clear();
		p5js.stroke(0);
		p5js.noFill();
		p5js.beginShape();
		for(let i = 0; i < points.length; i++){
			p5js.vertex(points[i].x, points[i].y);
		}
		p5js.endShape();

		p5js.fill(255, 0, 0);
		p5js.ellipse(coord.x, coord.y, 50, 50);
		/**/
	}

	p5js.getNextCoord = () => {
		switch(metaballs.length) {
			case 0: {
				return {x: 0, y: radius/3};
				break;
			}
			case 1: {
				return {x: -radius/2, y: 0}
				break;
			}
			case 2: {
				return {x: radius/2, y: 0}
				break;
			}
			case 3: {
				return {x: 0, y: -radius/3}
				break;
			}
		}

	}

	/*
	p5js.keyPressed = e => {
		if(e.key=="a"){
			p5js.goToCenter();
		}else if(e.key=="b"){
			p5js.hide();
		}
	}
	/**/

	p5js.goToCenter = () => {
		this.bottom = 0;
		const tween = new TWEEN.Tween(this)
			.to({ bottom: p5js.windowHeight/2 + 10 }, 2000)
			.easing(TWEEN.Easing.Quadratic.InOut)
			.onUpdate(() => {
				p5js.canvas.style.bottom = this.bottom + "px";
			})
			.start();
	}

	p5js.hide = () => {
		this.scale = 1.0;
		const tween = new TWEEN.Tween(this)
			.to({ bottom: 0, scale: 0}, 1000)
			.easing(TWEEN.Easing.Quadratic.InOut)
			.onUpdate(() => {
				p5js.canvas.style.bottom = this.bottom + "px";
				p5js.canvas.style.transform = "scale(" + scale + ", " + scale + ")";
			})
			.onComplete(() => {
				metaballs = [];
				this.scale = 1.0;
				p5js.canvas.style.transform = "scale(" + scale + ", " + scale + ")";
				p5js.draw();
			})
			.start();
	}

	p5js.addToMetaball = particle => {
		var coord = p5js.getNextCoord();
		metaballs.push(new MetaBall(particle.color, coord.x, coord.y));
		addDrag(metaballs[metaballs.length-1].pos);
		p5js.draw();
		p5js.draw();//twice because one make it black...
	}

	p5js.mousePressed = () => {
		dragMousePressed();
	}

	p5js.mouseReleased = () => {
		dragMouseReleased();
	}
	 
	p5js.mouseDragged = () => {
		dragMouseDragged();
	}

	//DRAG
	let dragging = false;
	let dragSelectedIndex = -1;
	let dragabble = [];
	let startDragPos;
	const DRAG_SIZE = 30;

	function addDrag(vec) 
	{
	  dragabble.push(vec);
	}
	 
	function drawDrag() 
	{
		for (let i=0; i < dragabble.length; i++) {
	    p5js.fill(dragSelectedIndex==i ? 100 : 255);
	    p5js.circle( dragabble[i].x, dragabble[i].y, DRAG_SIZE) ;
	  }
	}
	 
	function dragMousePressed() {
	  findSelected();
	}
	 
	function dragMouseReleased() {
	  dragSelectedIndex = -1;
	}
	 
	//bugfix, this function is called more than once
	let lastFrameCount;
	function dragMouseDragged() {
		if (dragSelectedIndex == -1 || lastFrameCount == p5js.frameCount) return;
		lastFrameCount = p5js.frameCount;
		dragabble[dragSelectedIndex].add(getMouseX() - startDragPos.x, getMouseY() - startDragPos.y, 0);
		startDragPos.x = getMouseX();
		startDragPos.y = getMouseY();
		var coord = constrainCoord(dragabble[dragSelectedIndex], points);
		dragabble[dragSelectedIndex].x = coord.x;
		dragabble[dragSelectedIndex].y = coord.y;
		p5js.draw();
	}

	function findSelected() {
		dragSelectedIndex = -1;
		const MIN_DIST = p5js.pow(DRAG_SIZE, 3);
		let mX = getMouseX();
		let mY = getMouseY();
		let closest = 999999;
		for (let i=0; i < dragabble.length; i++) {
			let distX = dragabble[i].x - mX;
			let distY = dragabble[i].y - mY;
			let distance = distX * distX + distY * distY;
			if(distance < MIN_DIST && distance < closest){
				closest = distance;
				dragSelectedIndex = i;
				startDragPos = p5js.createVector(getMouseX(), getMouseY());
			}
		}
	}

	function isCloseToPoints(){
		const MIN_DIST = p5js.pow(DRAG_SIZE, 3);
		let mX = getMouseX();
		let mY = getMouseY();
		for (let i=0; i < dragabble.length; i++) {
			let distX = dragabble[i].x - mX;
			let distY = dragabble[i].y - mY;
			let distance = distX * distX + distY * distY;
			if(distance < MIN_DIST){
				return true;
			}
		}
		return false;
	}

	function getMouseX(){
		return p5js.mouseX - p5js.width/2;//WEBGL
		//return p5js.mouseX * p5js.pixelDensity();//P2D
	}

	function getMouseY(){
		return p5js.mouseY - p5js.height/2;//WEBGL
		//return p5js.mouseY * p5js.pixelDensity();//P2D
	}

	function constrainCoord(coord, points){
		if(!inside(coord.x, coord.y, points)){
			let index = findClosestIndex(coord.x, coord.y, points);
			let nextIndex = (index+1)%(points.length-1);
			return getIntersectionPoint(0, 0,
										coord.x, coord.y,
										points[index].x, points[index].y,
										points[nextIndex].x, points[nextIndex].y);
		}else{
			return coord;
		}
	}

	function inside(x, y, vs) {
		// ray-casting algorithm based on
		// https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html/pnpoly.html

		var inside = false;
		for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
			var xi = vs[i].x, yi = vs[i].y;
			var xj = vs[j].x, yj = vs[j].y;

			var intersect = ((yi > y) != (yj > y))
			&& (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
			if (intersect) inside = !inside;
		}

		return inside;
	};

	function findClosestIndex(x, y, points){
		// look for the closest avarage point between two points
		let closest = 99999999;
		let closestIndex = -1;
		for (let i=0; i < points.length; i++) {
			let nextIndex = (i+1)%(points.length-1);

			let avarageX = points[i].x + (points[nextIndex].x - points[i].x) / 2;
			let avarageY = points[i].y + (points[nextIndex].y - points[i].y) / 2;

			let distX = avarageX - x;
			let distY = avarageY - y;
			let distance = distX * distX + distY * distY;
			if(distance < closest){
				closest = distance;
				closestIndex = i;
			}
		}
		return closestIndex;
	}

	function getIntersectionPoint(line1StartX, line1StartY, line1EndX, line1EndY, line2StartX, line2StartY, line2EndX, line2EndY) {
		// if the lines intersect, the result contains the x and y of the intersection (treating the lines as infinite) and booleans for whether line segment 1 or line segment 2 contain the point
		let denominator = ((line2EndY - line2StartY) * (line1EndX - line1StartX)) - ((line2EndX - line2StartX) * (line1EndY - line1StartY));
		if (denominator == 0) return {x:0, y:0};
		let a = line1StartY - line2StartY;
		let b = line1StartX - line2StartX;
		let numerator = ((line2EndX - line2StartX) * a) - ((line2EndY - line2StartY) * b);
		let c = numerator / denominator;

		// if we cast these lines infinitely in both directions, they intersect here:
		return {
			x: line1StartX + (c * (line1EndX - line1StartX)),
	 		y: line1StartY + (c * (line1EndY - line1StartY))
		};
	}
}
