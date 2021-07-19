/******************
Código por Vamoss
Link original:
https://www.openprocessing.org/sketch/1003377

Links do autor:
http://vamoss.com.br
http://twitter.com/vamoss
http://github.com/vamoss
******************/

class Mapping {
	constructor(p5js) {
		addEvent("init_mapping")
		this.p5js = p5js;
		this.injectSmoothQuad();

		const RESOLUTION = 600;
		const cubeCameraSize = 100;//things near than this value will be inside the camera walls
		this.hidden = false;

		this.cameras = [];
		this.canvases = [];
		this.mappingCoords = [];

		//DRAG
		this.selectedDragIndex = 0;
		this.dragable = [];
		this.originalDragable = [];
		this.startDragPos;
		this.DRAG_SIZE = 30;

		//CANVAS POSITIONS
		const scaledResolution = RESOLUTION * (this.p5js.min(this.p5js.width, this.p5js.height)/RESOLUTION/4);//fit screen
		var canvasPos = [
			{x: -scaledResolution, y: -scaledResolution},//FRONT VIEW = TOP RIGHT
			{x: scaledResolution, y: -scaledResolution},//LEFT VIEW = TOP LEFT
			{x: scaledResolution, y: scaledResolution}//BOTTOM VIEW = BOTTON LEFT
		];

		//CAMERA POSITIONS
		var rotations = [
			Dw.Rotation.create({angles_xyz: [0, 0, 0]}),//FROND VIEW
			Dw.Rotation.create({angles_xyz: [0, -this.p5js.HALF_PI, 0]}),//LEFT VIEW
			Dw.Rotation.create({angles_xyz: [this.p5js.HALF_PI, 0, this.p5js.HALF_PI]})//BOTTOM VIEW
		];
		var centers = [
			[0, 0, -cubeCameraSize],//FROND VIEW
			[cubeCameraSize, 0, 0],//LEFT VIEW
			[0, cubeCameraSize, 0]//BOTTOM VIEW
		];

		//CREATE CAMERAS AND CANVAS
		for(var i = 0; i < rotations.length; i++){
			var canvas = this.p5js.createGraphics(RESOLUTION, RESOLUTION, this.p5js.WEBGL);
			canvas.perspective(this.p5js.HALF_PI, canvas.width / canvas.height, 0.1, 1000);
			this.canvases.push(canvas);

			Particle.setup(canvas._renderer);
			
			var cam = new Dw.EasyCam(canvas._renderer, {
				distance : cubeCameraSize,
				center   : centers[i],
				rotation : rotations[i],
			});
			this.cameras.push(cam);
			
			//no distortion coordnates
			this.mappingCoords.push({
				vecTL: this.addDrag(canvasPos[i].x - scaledResolution, canvasPos[i].y - scaledResolution),//TOP LEFT
				vecTR: this.addDrag(canvasPos[i].x + scaledResolution, canvasPos[i].y - scaledResolution),//TOP RIGHT
				vecBR: this.addDrag(canvasPos[i].x + scaledResolution, canvasPos[i].y + scaledResolution),//BOTTOM LEFT
				vecBL: this.addDrag(canvasPos[i].x - scaledResolution, canvasPos[i].y + scaledResolution)//BOTTOM RIGHT
			});
	  	}
		
		if(!this.loadMapping()){
			//default initial state are the distorted room
			var initMapState = [
				[-scaledResolution * 2, -scaledResolution * 2 + 20],
				[0, -scaledResolution * 1.5],
				[0, -scaledResolution / 2],
				[-scaledResolution * 2, 0],
				[scaledResolution * 2, -scaledResolution * 2 + 20],
				[scaledResolution * 2, 0],
				[0, scaledResolution * 2 - 20],
				[-scaledResolution * 2, 0]
			];
			for (let i=0; i < initMapState.length; i++) {
				this.dragable[i].x = initMapState[i][0];
				this.dragable[i].y = initMapState[i][1];
			}
		}

		//GUI
		config.mappingEnabled = true;
        this.toggleMapping();
        initGui(this);
	}

	toggleMapping(){
		if(config.mappingEnabled) {
			this.p5js.noDebugMode();
			this.p5js.setCamera(this.p5js.createCamera());
			document.getElementsByTagName("header")[0].style.display = "none";
		}else{
			this.p5js.debugMode();
			document.getElementsByTagName("header")[0].style.display = "";
		}
	}

	drawViewports(draw3DScene){
		this.canvases.forEach((canvas, index) => {
			
			//check if this square is enabled
			if(!config["mappingSquare" + (index+1)])
				return;

			canvas.clear();
			canvas.push();
				canvas.translate(config.mappingPosX, config.mappingPosY, config.mappingPosZ);
				canvas.rotateY(-this.p5js.HALF_PI/2);
				canvas.scale(config.mappingScale);
				draw3DScene(canvas, canvas._renderer);
			canvas.pop();
			//map canvas
			this.p5js.noStroke();
			this.p5js.texture(canvas);
			var coord = this.mappingCoords[index];
			this.p5js.smoothQuad(
				coord.vecTL.x, coord.vecTL.y, 
				coord.vecTR.x, coord.vecTR.y,
				coord.vecBR.x, coord.vecBR.y,
				coord.vecBL.x, coord.vecBL.y
			);
		});
		
		if(this.isCloseToPoints() && !this.hidden){
			this.p5js.resetShader();
			this.drawDrag();
		}
	}

	saveMapping() {
		this.saveDragPoints();
		localStorage.setItem("bgColor", config.bgColor);
		localStorage.setItem("mappingEnabled", config.mappingEnabled);
		localStorage.setItem("mappingSquare1", config.mappingSquare1);
		localStorage.setItem("mappingSquare2", config.mappingSquare2);
		localStorage.setItem("mappingSquare3", config.mappingSquare3);
		localStorage.setItem("mappingPosX", config.mappingPosX);
		localStorage.setItem("mappingPosY", config.mappingPosY);
		localStorage.setItem("mappingPosZ", config.mappingPosZ);
		localStorage.setItem("mappingScale", config.mappingScale);
		localStorage.setItem("waveAmplitude", config.waveAmplitude);
		localStorage.setItem("fogX", config.fogX);
		localStorage.setItem("fogY", config.fogY);
		localStorage.setItem("fogSizeX", config.fogSizeX);
		localStorage.setItem("fogSizeY", config.fogSizeY);
		localStorage.setItem("fogPower", config.fogPower);
	}

	loadMapping() {
		this.loadItemFromLocalStorge(config, "bgColor");
		this.loadItemFromLocalStorge(config, "mappingEnabled", true);
		this.loadItemFromLocalStorge(config, "mappingSquare1", true);
		this.loadItemFromLocalStorge(config, "mappingSquare2", true);
		this.loadItemFromLocalStorge(config, "mappingSquare3", true);
		this.loadItemFromLocalStorge(config, "mappingPosX", true);
		this.loadItemFromLocalStorge(config, "mappingPosY", true);
		this.loadItemFromLocalStorge(config, "mappingPosZ", true);
		this.loadItemFromLocalStorge(config, "mappingScale", true);
		this.loadItemFromLocalStorge(config, "waveAmplitude", true);
		this.loadItemFromLocalStorge(config, "fogX", true);
		this.loadItemFromLocalStorge(config, "fogY", true);
		this.loadItemFromLocalStorge(config, "fogSizeX", true);
		this.loadItemFromLocalStorge(config, "fogSizeY", true);
		this.loadItemFromLocalStorge(config, "fogPower", true);
		return this.loadDragPoints();
	}

	loadItemFromLocalStorge(prop, itemName, parse){
		var loaded = localStorage.getItem(itemName);
		if(loaded){
			if(parse)
				prop[itemName] = JSON.parse(loaded);
			else
				prop[itemName] = loaded;
		}
	}

	resetMapping() {
		localStorage.removeItem("bgColor");
		localStorage.removeItem("mappingEnabled");
		localStorage.removeItem("mappingPosX");
		localStorage.removeItem("mappingPosY");
		localStorage.removeItem("mappingPosZ");
		localStorage.removeItem("mappingScale");
		localStorage.removeItem("waveAmplitude");
		localStorage.removeItem("fogX");
		localStorage.removeItem("fogY");
		localStorage.removeItem("fogSizeX");
		localStorage.removeItem("fogSizeY");
		localStorage.removeItem("fogPower");
		this.resetDragPoints();
	}

	injectSmoothQuad() {
		p5.prototype.smoothQuad = function(x1, y1, x2, y2, x3, y3, x4, y4, detailX, detailY) {
			if (typeof detailX === 'undefined') {
				detailX = 8;
			}
			if (typeof detailY === 'undefined') {
				detailY = 8;
			}

			const gId = `smoothQuad|${x1}|${y1}|${x2}|${y2}|${x3}|${y3}|${x4}|${y4}|${detailX}|${detailY}`;

				if (!this._renderer.geometryInHash(gId)) {
				const smoothQuadGeom = new p5.Geometry(detailX, detailY, function() {
					//algorithm adapted from c++ to js
					//https://stackoverflow.com/questions/16989181/whats-the-correct-way-to-draw-a-distorted-plane-in-opengl/16993202#16993202
					let xRes = 1.0 / (this.detailX - 1);
					let yRes = 1.0 / (this.detailY - 1);
					for(let y = 0; y < this.detailY; y++){
						for(let x = 0; x < this.detailX; x++){
							let pctx  = x * xRes;
							let pcty  = y * yRes;

							let linePt0x  = (1 - pcty) * x1 + pcty * x4;
							let linePt0y  = (1 - pcty) * y1 + pcty * y4;
							let linePt1x  = (1 - pcty) * x2 + pcty * x3;
							let linePt1y  = (1 - pcty) * y2 + pcty * y3;

							let ptx       = (1-pctx) * linePt0x + pctx * linePt1x;
							let pty       = (1-pctx) * linePt0y + pctx * linePt1y;

							this.vertices.push(new p5.Vector(ptx, pty));
							this.uvs.push([pctx, pcty]);
						}
					}
				});
				
				//compute faces and uvs
				smoothQuadGeom.faces = [];

				for(let y = 0; y < detailY-1; y++){
					for(let x = 0; x < detailX-1; x++){
						let pt0 = x + y * detailX;
						let pt1 = (x + 1) + y * detailX;
						let pt2 = (x + 1) + (y + 1) * detailX;
						let pt3 = x + (y + 1) * detailX;
						smoothQuadGeom.faces.push([pt0, pt1, pt2]);
						smoothQuadGeom.faces.push([pt0, pt2, pt3]);
					}
				}
				smoothQuadGeom
					.computeNormals()
					._makeTriangleEdges()
					._edgesToVertices();
				this._renderer.createBuffers(gId, smoothQuadGeom);
			}
			this._renderer.drawBuffers(gId);

			return this;
		}
	}

	//DRAG
	addDrag(x, y, group) 
	{
		if(group === undefined) group = true;
		var vec = this.p5js.createVector(x, y);
		if(group){
			const found = this.dragable.find(e => e.equals(vec));
			if(found) {
				vec = found;
			}else{
				this.dragable.push(vec);
				this.originalDragable.push(vec.copy());
			}
		}else{
		this.dragable.push(vec);
			this.originalDragable.push(vec.copy());
		}
		return vec;
	}

	drawDrag() 
	{
		this.p5js.noFill();
		for (let i=0; i < this.dragable.length; i++) {
			this.p5js.stroke(this.selectedDragIndex==i ? 100 : 255);
			this.p5js.circle(this.dragable[i].x, this.dragable[i].y, this.DRAG_SIZE) ;
		}
	}
	 
	dragMousePressed() {
		this.findSelected();
	}
	 
	dragMouseReleased() {
		//this.selectedDragIndex = -1;
	}
	 
	dragMouseDragged() {
		//bugfix, this function is called more than once
		if (this.selectedDragIndex == -1 || this.lastFrameCount == this.p5js.frameCount) return;
		this.lastFrameCount = this.p5js.frameCount;
		this.dragable[this.selectedDragIndex].add(this.p5js.mouseX - this.startDragPos.x, this.p5js.mouseY - this.startDragPos.y, 0);
		this.startDragPos.x = this.p5js.mouseX;
		this.startDragPos.y = this.p5js.mouseY;
	}

	findSelected() {
		this.selectedDragIndex = -1;
		const MIN_DIST = this.p5js.pow(this.DRAG_SIZE, 3);
		let mX = this.getMouseX();
		let mY = this.getMouseY();
		let closest = 999999;
		for (let i=0; i < this.dragable.length; i++) {
			let distX = this.dragable[i].x - mX;
			let distY = this.dragable[i].y - mY;
			let distance = distX * distX + distY * distY;
			if(distance < MIN_DIST && distance < closest){
				closest = distance;
				this.selectedDragIndex = i;
				this.startDragPos = this.p5js.createVector(this.p5js.mouseX, this.p5js.mouseY);
			}
	  }
	}

	isCloseToPoints(){
		const MIN_DIST = this.p5js.pow(this.DRAG_SIZE, 3);
		let mX = this.getMouseX();
		let mY = this.getMouseY();
		for (let i=0; i < this.dragable.length; i++) {
			let distX = this.dragable[i].x - mX;
			let distY = this.dragable[i].y - mY;
			let distance = distX * distX + distY * distY;
			if(distance < MIN_DIST){
				return true;
			}
	  }
		return false;
	}

	getMouseX(){
		return this.p5js.mouseX - this.p5js.width/2;
	}

	getMouseY(){
		return this.p5js.mouseY - this.p5js.height/2;
	}

	getPmouseX(){
		return this.p5js.pmouseX - this.p5js.width/2;
	}

	getPmouseY(){
		return this.p5js.pmouseY - this.p5js.height/2;
	}

	saveDragPoints(){
		var arr = [];
		for (let i=0; i < this.dragable.length; i++) {
			arr.push([this.dragable[i].x, this.dragable[i].y]);
		}
		localStorage.setItem("dragable", JSON.stringify(arr));
	}

	loadDragPoints(){
		var loaded = localStorage.getItem("dragable");
		if(loaded){
			loaded = JSON.parse(loaded);
			for (let i=0; i < loaded.length; i++) {
				this.dragable[i].x = loaded[i][0];
				this.dragable[i].y = loaded[i][1];
			}
			return true;
		}
		return false;
	}

	resetDragPoints() {
		localStorage.removeItem("dragable");
		for (let i=0; i < this.dragable.length; i++) {
			this.dragable[i].x = this.originalDragable[i].x;
			this.dragable[i].y = this.originalDragable[i].y;
		}
	}

	dragKeyPressed(){
		if(this.p5js.key == 's') {
			this.saveMapping();
		}else if(this.p5js.key == 'l') {
			this.loadMapping();
		}else if(this.p5js.key == 'R') {
			this.resetMapping();
		}else if(this.p5js.key == 'f') {
		    this.p5js.fullscreen(!this.p5js.fullscreen())
		}else if(this.p5js.key == 'h') {
			this.hidden = !this.hidden;
		}
		if(this.p5js.keyIsDown(this.p5js.SHIFT)){
			if (this.p5js.keyIsDown(this.p5js.LEFT_ARROW)) {
				this.selectedDragIndex--;
				if(this.selectedDragIndex < 0)
					this.selectedDragIndex = this.dragable.length-1;
			}else if (this.p5js.keyIsDown(this.p5js.RIGHT_ARROW)) {
				this.selectedDragIndex++;
				if(this.selectedDragIndex>=this.dragable.length)
					this.selectedDragIndex = 0;
			}
		}else{
			if (this.p5js.keyIsDown(this.p5js.LEFT_ARROW)) {
				this.dragable[this.selectedDragIndex].x--;
			}else if (this.p5js.keyIsDown(this.p5js.RIGHT_ARROW)) {
				this.dragable[this.selectedDragIndex].x++;
			}else if (this.p5js.keyIsDown(this.p5js.UP_ARROW)) {
				this.dragable[this.selectedDragIndex].y--;
			}else if (this.p5js.keyIsDown(this.p5js.DOWN_ARROW)) {
				this.dragable[this.selectedDragIndex].y++;
			}
		}
	}
}