/******************
Código por Vamoss
Link original:
https://www.openprocessing.org/sketch/903104

Links do autor:
http://vamoss.com.br
http://twitter.com/vamoss
http://github.com/vamoss
******************/

const sketch = p5js => {
	//DEBUG
	let skipUpload = false;
	var stats;// = new Stats();
	if(stats){
		stats.showPanel( 1 ); // 0: fps, 1: ms, 2: mb, 3+: custom
		document.body.appendChild( stats.dom );
	}


	//MODE
	const MODES = {
		SEA: 0,
		SELECT_IMAGE: 1,
		COLOR_MEMORY: 2,
		COLOR_PERCEPTION: 3,
		COLOR_CV: 4,
		CONFIRM: 5
	}
	let mode, svgText, button;

	//FORM
	let form, fileInput, selectedColorField, uploadComplete;
	let imageUrl, openCvColors = [], selectedColors = [], uuid;

	//SEA
	let allData, seaGrid;

	//COLOR PICKER
	const TOTAL_RINGS = 6;
	let colorPickerGrid;

	//IMAGE GRID
	let imageGrid, image, centerPos;
	let canSelect, selectedIndex, selectedZ, selected;

	//WEBGL
	let renderer;

	//MAPPING
	let mapping, hideMouseCount = 0;

	p5js.setup = () => {
		renderer = p5js.createCanvas(p5js.windowWidth, p5js.windowHeight, p5js.WEBGL);
		p5js.pixelDensity(1);

		Particle.init(p5js);
		Particle.setup(renderer);
		
		//SOCKET
		initSocket();

		//METABALLS
		var spaceX = p5SketchMetaball.width / (selectedColors.length + 1);
		selectedColors.forEach((color, index) => {
			p5SketchMetaball.addToMetaball(new MetaBall(p5js.color(color), spaceX * (index + 1), p5SketchMetaball.height / 2));
		});

		if(skipUpload) {
			openCvColors.push("#ff0000")
			openCvColors.push("#00ff00")
			selectedColors.push("#3b78ae")
			imageUrl = "imgs/1593519609125.jpg"
			setMode(MODES.COLOR_PERCEPTION);
		}else if(mode !== undefined) {
			setMode(mode);
		}else {
			setMode(MODES.SEA);
		}

		var mappingEnabled = localStorage.getItem("mappingEnabled");
		if(mappingEnabled){
			mapping = new Mapping(p5js);
		}
	}

	p5js.show = () => {
		setMode(MODES.SELECT_IMAGE)
	}

	p5js.hide = () => {
		removeText();
		removeButton();
		p5SketchMetaball.hide();
		setTimeout(function(){
			setMode(MODES.SEA);
		}, 500);
	}

	//----------------------
	// MODE
	function setMode(m){
		// console.log("mode", m)
		mode = m;
		switch(mode) {
			case MODES.SEA: {
				if(allData)
					initSeaGrid();
				}
				break;
			case MODES.SELECT_IMAGE: {
				if(renderer) {
					initForm();
				}
				break;
			}
			case MODES.COLOR_MEMORY: {
				initColorPicker();
				break;
			}
			case MODES.COLOR_PERCEPTION: {
				initImage();
				break;
			}
			case MODES.COLOR_CV: {
				if(selectedColors.length == 2)
					setText('images/first-color-most-recognized-by-the-computer.svg');
				else
					setText('images/second-color-most-recognized-by-the-computer.svg');
				selected = new Particle(
										p5js.color(openCvColors.shift()),
										-config.gridSize, -config.gridSize, 100
									);
				addToMetaball(selected);
				break;
			}
			case MODES.CONFIRM: {
				initConfirmScreen();
			}
        }
	}

	function setText(file){
		removeText();
		svgText = new Vivus('textContainer', { file: file, duration: 2000 });
	}
	function removeText(){
		document.getElementById("textContainer").innerHTML = "";
		if(svgText) svgText.destroy();
		svgText = null;
	}

	function setButton(text, y, callback){
		removeButton();
		button = p5js.createButton(text);
		button.position(p5js.width/2-button.width/2, y);
		if(callback) button.mousePressed(callback);
	}
	function removeButton(){
		if(button) button.remove();
		button = null;
	}

	//----------------------
	// SEA
	function initSocket(){
		var socket = io();

		//listen load all data
		socket.on('all', function (data) {
			// console.log("all data", data)
			allData = data;
			if(mode == MODES.SEA)
				initSeaGrid();
		});

		//listen new data
		socket.on('new', function (data) {
			// console.log('new data', data)
			var maxDist = p5js.min(p5js.width/4, p5js.height/3)
			if(data.uuid != uuid && seaGrid){
				var duration = 10000;
				var startZ = -600;
				var particle = p5js.random(seaGrid);
				while(p5js.mag(particle.pos.x, particle.pos.y) > maxDist){
					particle = p5js.random(seaGrid);
				}
				particle.setColor(data.selectedColors);
				particle.pos.z = startZ;
				const tween = new TWEEN.Tween(particle.pos)
					.to({ z: 0 }, duration)
					.easing(TWEEN.Easing.Elastic.Out)
					.start();
			}
		});
	}

	function initSeaGrid(){
		var parsedData = [];

		document.getElementById('send').style.display = "";

		allData.forEach(data => {
			// colorchosen1: "91C92A"
			// filePath: "imgs/1593777346688.jpg"
			// gdata: "[{"color":{"red":120,"green":120,"blue":120,"alpha":null},"score":0.35752296447753906,"pixelFraction":0.14438438415527344},{"color":{"red":153,"green":153,"blue":153,"alpha":null},"score":0.22313828766345978,"pixelFraction":0.12126126140356064},{"color":{"red":88,"green":88,"blue":88,"alpha":null},"score":0.14873488247394562,"pixelFraction":0.12396396696567535},{"color":{"red":194,"green":194,"blue":194,"alpha":null},"score":0.12751592695713043,"pixelFraction":0.22882883250713348},{"color":{"red":228,"green":228,"blue":228,"alpha":null},"score":0.07613667100667953,"pixelFraction":0.15333333611488342},{"color":{"red":54,"green":54,"blue":54,"alpha":null},"score":0.05366909131407738,"pixelFraction":0.1342342346906662},{"color":{"red":28,"green":28,"blue":28,"alpha":null},"score":0.013282151892781258,"pixelFraction":0.09399399161338806}]"
			// id: 1593777348194
			// _id: "5eff1cc46a00c70017a9ce45"
			var colors = [];
			if(data.colorchosen1){
				colors.push(p5js.color("#"+data.colorchosen1));
			}
			if(data.colorchosen2){
				colors.push(p5js.color("#"+data.colorchosen2));
			}

			if(data.gdata){
				var gdataObj = JSON.parse(data.gdata);
				gdataObj.every((gdata, index) => {
					colors.push(p5js.color(gdata.color.red, gdata.color.green, gdata.color.blue))
					return index < 2;
				});
			}

			if(colors.length > 0){
				parsedData.push(colors);
			}
		})
		// console.log("colors", parsedData)

		const radius = config.gridSize;
		const altitude = Math.sqrt(3)/2 * radius;

		let startPos = p5js.createVector(0, 0, -1000);

		seaGrid = [];
		let counter = 0;
		let rowCount = 0;
		for(let y = - radius * 10; y < p5js.height; y+=radius * 1.5){
			let trapeziumIncrease = p5js.floor(p5js.map(y, -radius, p5js.height, 20, 0)) * altitude * 2;
			for(let x = 150 - trapeziumIncrease; x < p5js.width - 150 + trapeziumIncrease; x+=altitude * 2){
				let xx = x + (rowCount%2==0 ? 0 : altitude);
				let yy = y;

				//center page
				xx -= p5js.width / 2;
				yy -= p5js.height / 2;

				xx -= radius;
				yy -= radius;

				
				var colors = parsedData[counter % parsedData.length];
				var delay = p5js.random(3000);
				var easing = TWEEN.Easing.Exponential.Out;
				var duration = p5js.random(1000,3000);
				var startZ = startPos.z;
				if(selectedColors.length>0 && p5js.abs(xx) < config.gridSize && p5js.abs(yy) < config.gridSize){
					selectedColors.forEach((col, index) => {
						selectedColors[index] = p5js.color(col);
					})
					colors = [...selectedColors];
					selectedColors = [];
					delay = 1500;
					duration = 10000;
					easing = TWEEN.Easing.Elastic.Out;
					startZ = -600;
				}
				
				var particle = new Particle(colors, startPos.x, startPos.y, startZ, radius);
				seaGrid.push(particle);
				const tween = new TWEEN.Tween(particle.pos)
					.to({ x: xx, y: yy, z: 0 }, duration)
					.easing(easing)
					.delay(delay)
					.start();
				counter++;
			}
			rowCount++;
		}

		canSelect = false;
		config.moviment = true;
	}

	//----------------------
	// FORM
	function processForm(e) {
		uploadComplete = false;

		var http = new XMLHttpRequest();
		http.open("POST", "/upload-profile-pic", true);
		http.onload = function() {
			var response = JSON.parse(http.responseText);
			if(response.status){
				if(response.cvColors.length > 0) {
					var rgb1 = response.cvColors[0].color
					var hex1 = rgbToHex(rgb1.red, rgb1.green, rgb1.blue)
					openCvColors.push(hex1)
				}
				if(response.cvColors.length > 1){
					var rgb2 = response.cvColors[1].color
					var hex2 = rgbToHex(rgb2.red, rgb2.green, rgb2.blue)
					openCvColors.push(hex2)
				}
				// selectedColors.push("#"+selectedColorField.value)
				uuid = response.uuid;
				imageUrl = response.url
				uploadComplete = true;
				fileInput.value = "";
			}else{
				console.error(response.message)
			}
		}
		http.onError = function(err){
			console.error(err)
		}
		http.send(new FormData(form));

		return false;
	}

	function initForm() {
		setText('images/submit-your-water-photograph.svg');
		setButton('click to choose', p5js.height/2);

		document.getElementById('send').style.display = "none";
		config.moviment = false;
	
		if(!form){
			form = document.getElementById('uploadForm');
			form.style.display = "none"
			if (form.attachEvent) {
				form.attachEvent("submit", processForm);
			} else {
				form.addEventListener("submit", processForm);
			}

			fileInput = document.getElementById("profile_pic")
			fileInput.addEventListener('change', function () {
				if(fileInput.files[0]){
					addEvent('3_selected_photo_from_computer', {uuid, selectedColors});
					setMode(MODES.COLOR_MEMORY);
				}
			}, false);
		}
		
		selectedColorField = document.getElementById("valueInput");
		addEvent('1_Add_your_color_to_the_sea', {uuid, selectedColors});
	}

	//----------------------
	//COLOR PICKER
	function initColorPicker() {
		setText('images/select-the-dominant-color.svg');
	    removeButton();

		colorPickerGrid = [];

		const borderTop = 50;
		const radius = p5js.min(p5js.width, p5js.height) / (TOTAL_RINGS * 6);
		const altitude = Math.sqrt(3) * radius;
		let startPos = p5js.createVector(0, borderTop, -5001);
		for (let x = -TOTAL_RINGS; x <= TOTAL_RINGS; x++) {
			let y1 = Math.max(-TOTAL_RINGS, -x-TOTAL_RINGS);
			let y2 = Math.min(TOTAL_RINGS, -x+TOTAL_RINGS);
			for (let y = y1; y <= y2; y++) {
				let xx = x * altitude + 0.5 * y * altitude;
				let yy = y * radius * 1.5;

				let angle = (p5js.atan2(yy, xx) + p5js.PI) / p5js.TWO_PI;
				let distance = p5js.mag(xx, yy) / (altitude * TOTAL_RINGS);

				xx *= 1.3;
				yy *= 1.3;

				xx -= radius;
				yy -= radius - borderTop;

				var particle = new Particle(
					p5js.color('hsl(' + parseInt(angle * 360) + ', 100%, ' + parseInt(distance * 90 + 5) + '%)'),
					startPos.x, startPos.y, startPos.z,
					radius
				);

				colorPickerGrid.push(particle);

				const tween = new TWEEN.Tween(particle.pos)
					.to({ x: xx, y: yy, z: 0 }, 4000)
					.easing(TWEEN.Easing.Exponential.InOut)
					.delay(p5js.random(1000))
					.start();
			}
		}

		canSelect = false;
		setTimeout(() => {canSelect = true}, 5000);
	}


	//----------------------
	// IMAGE GRID
	function initImage(){
		if(!uploadComplete){
			setTimeout(initImage, 500);
			return;
		}

		setText('images/pull-out-the-most-memorable-color.svg');
		p5js.loadImage(imageUrl, img => {
			image = img;

			//RESIZE IMAGE
			let width = image.width;
			let height = image.height;
			const maxWidth = 12;
			const maxHeight = 12;
			if(width > height){
				let ratio = maxWidth / width;
				height *= ratio;
				width = maxWidth;
			} else {
				let ratio = maxHeight / height;
				width *= ratio;
				height = maxHeight;
			}
			image.resize(p5js.floor(width), p5js.floor(height));

			initImageGrid();
		});
	}

	function initImageGrid(){
		const borderTop = -20;
		const radius = p5js.min(p5js.width/image.width, p5js.height/image.height) / 4;
		const altitude = Math.sqrt(3)/2 * radius;

		let startPos = p5js.createVector(0, borderTop, -5001);

		imageGrid = [];
		for(let x = 0; x < image.width; x++){
			let rowCount = 0;
			for(let y = 0; y < image.height; y++){
				let xx = x * altitude * 2 + (rowCount%2==0 ? 0 : altitude);
				let yy = y * radius * 1.5;

				//center page
				xx -= image.width / 2 * altitude * 2;
				yy -= image.height / 2 * radius * 1.5;

				xx -= radius;
				yy -= radius - borderTop;

				xx *= 1.3;
				yy *= 1.3;

				var particle = new Particle(p5js.color(image.get(x,y)), startPos.x, startPos.y, startPos.z, radius);
				imageGrid.push(particle);
				
				const tween = new TWEEN.Tween(particle.pos)
					.to({ x: xx, y: yy, z: 0 }, 4000)
					.easing(TWEEN.Easing.Exponential.InOut)
					.delay(p5js.random(1000))
					.start();
				
				rowCount++;
			}
		}

		canSelect = false;
		setTimeout(() => {canSelect = true}, 5000);
	}

	//----------------------
	p5js.draw = () => {
		if(stats) stats.begin();
		// p5js.orbitControl();
		
		TWEEN.update();


		let time = p5js.millis() / 1000;

		let grid = getGrid();
		if(grid)
			grid.forEach(g => g.update(time));
		if(selected)
			selected.update(time)

		Particle.fogR = p5js.red(config.bgColor);
		Particle.fogG = p5js.green(config.bgColor);
		Particle.fogB = p5js.blue(config.bgColor);

		if(config.mappingEnabled) {
			p5js.background(0);
			mapping.drawViewports(draw3DScene);

			//auto hide mouse
			if(hideMouseCount < 60){
				if(p5js.pmouseX == p5js.mouseX && p5js.pmouseY == p5js.mouseY)
					hideMouseCount++;
				if(hideMouseCount == 60)
					p5js.noCursor();
			}
		}else{
			draw3DScene(p5js, renderer);
		}

		if(stats) stats.end();
	}

	function getGrid(){
		if(mode == MODES.COLOR_MEMORY)
	        return colorPickerGrid;
	    else if(mode == MODES.COLOR_PERCEPTION)
			return imageGrid;
	    else if(mode == MODES.SEA)
	        return seaGrid;
	    return undefined;
	}

	function draw3DScene(canvas, renderer) {
		canvas.background(config.bgColor);

		if(mode == MODES.SEA) {
			canvas.translate(0, 100);
			canvas.rotateX(p5js.HALF_PI/1.5);
        }

		let time = p5js.millis() / 1000;

		Particle.updateOnce(renderer, time);

		if(selected){
			selected.c = true;
		}
		let grid = getGrid();
		if(grid) {
			var mouse = {x: p5js.mouseX - p5js.width/2, y: p5js.mouseY - p5js.height/2};
			selectedIndex = -1;

			canvas.noStroke();
			grid.forEach((g, index) => {
				var z = 0;

				if(selectedIndex==-1 && canSelect){
					var mouseDist = p5js.dist(g.pos.x + g.size, g.pos.y + g.size, mouse.x, mouse.y)
					if(mouseDist < g.size * 0.82){
						var dist = p5js.mag(g.pos.x + g.size, g.pos.y + g.size) / p5js.max(p5js.width, p5js.height)
						selectedIndex = index;
						selectedZ = 100 * (1-dist);
					}
				}
				if(selectedIndex != index)
					g.draw(renderer);
			});

			if(selectedIndex != -1){
				canvas.push();
					canvas.translate(0, 0, selectedZ);
					Particle.updateOnce(renderer, time);
					grid[selectedIndex].draw(renderer, true);
				canvas.pop();
			}
		}

		if(selected)
			selected.draw(renderer, true);
		
		if(config.showImage && image){
			canvas.fill(255);
			canvas.image(image, 0, 0);
		}
	}

	function selectedConfirm() {
		if(!canSelect) return;

		let grid, endPos, organizeBeforeExit, exitDelay, metaballDelay, exitDuration;
		if(mode == MODES.COLOR_MEMORY){
			addEvent('4_selected_color_from_memory', {uuid, selectedColors});
			grid = colorPickerGrid;
			endPos = p5js.createVector(0, 0, -2000);
			organizeBeforeExit = false;
			exitDelay = 2000;
			metaballDelay = 0;
			exitDuration = 1000;
		}else if(mode == MODES.COLOR_PERCEPTION){
			addEvent('5_selected_color_from_perception', {uuid, selectedColors});
			grid = imageGrid;
			endPos = p5js.createVector(image.width/2, image.height/2, -2000);
			organizeBeforeExit = true;
			exitDelay = 3000;
			metaballDelay = 6000;
			exitDuration = 2000;
		}

		selected = grid.splice(selectedIndex, 1)[0];
		selectedIndex = -1;
		canSelect = false;
		selected.pos.z = 100;

		grid.forEach(g => {
			var tempDelay = 0;
			if(organizeBeforeExit){
				//go to color space
				var {x, y, z, delay} = getXYFromColor(g.color[0], g.color[1], g.color[2]);
				const tween = new TWEEN.Tween(g.pos)
					.to({ x: x, y: y, z: z }, exitDuration)
					.easing(TWEEN.Easing.Quadratic.InOut)
					.delay(delay)
					.start();

				tempDelay = exitDelay + delay;
			}

			//go to infinity center
			setTimeout(() => {
				const tween2 = new TWEEN.Tween(g.pos)
					.to({ x: endPos.x, y: endPos.y, z: endPos.z }, exitDuration)
					.easing(TWEEN.Easing.Quadratic.In)
					.delay(p5js.random(exitDelay))
					.onComplete(() => {
						grid.splice(grid.indexOf(g), 1);
					})
					.start();
			}, tempDelay);
		});

		if(mode == MODES.COLOR_MEMORY){
			//convert rgb array (that comes with 0 to 1) to FF0000 string
			selectedColorField.value = rgbToHex(p5js.floor(selected.color[0] * 255), p5js.floor(selected.color[1] * 255), p5js.floor(selected.color[2] * 255)).replace("#", "");
			processForm(null);
		}else if(mode == MODES.COLOR_PERCEPTION){
			//convert rgb array (that comes with 0 to 1) to FF0000 string
			var color = rgbToHex(selected.color[0] * 255, selected.color[1] * 255, selected.color[2] * 255).replace("#", "");
			p5js.httpPost("/color2", 'json', { uuid: uuid, colorchosen2: color }, function(result) {
				//console.log(result);
			});
		}

		//move selected to center
		setTimeout(() => {
			addToMetaball(selected);
		}, metaballDelay);
	}

	function addToMetaball(particle){
		// console.log("addToMetaball")
		var metaballContainerWidth = p5SketchMetaball.width;
		var metaballContainerHeight = p5SketchMetaball.height;
		var metaballContainerX = 0;
		var metaballContainerY = p5js.height/2-metaballContainerHeight/2;

		var dest = p5SketchMetaball.getNextCoord();
		var metaballPos = p5js.createVector(metaballContainerX + dest.x - particle.size, metaballContainerY + dest.y - particle.size);
		
		setTimeout(() => particle.toCircle(), 1000);
		
		//centralize
		centerPos = p5js.createVector(-particle.size, -particle.size, 100);
		const tween = new TWEEN.Tween(particle.pos)
			.to({ x: centerPos.x, y: centerPos.y, z: centerPos.z }, 2000)
			.easing(TWEEN.Easing.Quadratic.InOut)
			.start()
			.onComplete(() => {
				// console.log("go to metaball container")
				setTimeout(() => {
					const tween2 = new TWEEN.Tween(particle.pos)
						.to({ x: metaballPos.x, y: metaballPos.y, z: 0 }, 2000)
						.easing(TWEEN.Easing.Quadratic.InOut)
						.start()
						.onComplete(() => {
							// console.log("move particles to metaball")
							//change to next state
							var color = p5js.color(particle.color[0] * 255, particle.color[1] * 255, particle.color[2] * 255);
							selectedColors.push(color.toString('#rrggbb'));
							p5SketchMetaball.addToMetaball(particle);
							selected = null;
							
							if(mode == MODES.COLOR_MEMORY){
								setMode(MODES.COLOR_PERCEPTION);
							}else if(mode == MODES.COLOR_PERCEPTION || mode == MODES.COLOR_CV){
								if(openCvColors.length > 0){
									setMode(MODES.COLOR_CV);
								}else{
									selected = null;
									setMode(MODES.CONFIRM);
								}
							}
						})
				}, 1000)
			});
	}

	function initConfirmScreen(){
		setText('images/the-colours-of-your-image-have-been-chosen.svg');
		p5SketchMetaball.goToCenter();
		setTimeout(function(){
			setButton('Send off your color to the sea', p5js.height/2, onConfirm);
		}, 2000);
	}

	function onConfirm(){
		addEvent('6_send_off_the_color_to_the_sea', {uuid, selectedColors});
		window.location.hash = '#sea';
		// console.log("confirming", uuid, selectedColors)
		p5js.httpPost("/send", 'json', { uuid: uuid, selectedColors: selectedColors }, function(result) {
			// console.log("onConfirm", result);
		});
	}


	p5js.mouseMoved = () => {
		//auto show mouse
		if(mapping){
			hideMouseCount = 0;
			p5js.cursor(p5js.ARROW);
		}
	}

	p5js.mousePressed = () => {
		switch(mode) {
			case MODES.SELECT_IMAGE: {
				if(p5js.mouseY > 100){
					addEvent('2_click_to_choose_photo', {uuid, selectedColors});
					fileInput.click();
				}
				break;
			}
		}
		if(mapping)
			mapping.dragMousePressed();
	}
 
	p5js.mouseReleased = () => {
		switch(mode) {
			case MODES.COLOR_MEMORY:
			case MODES.COLOR_PERCEPTION: {
				if(selectedIndex!=-1){
					selectedConfirm();
				}
				break;
			}
		}
		if(mapping)
			mapping.dragMouseReleased();
	}
	 
	p5js.mouseDragged = () => {
		if(mapping)
			mapping.dragMouseDragged();
	}

	p5js.keyPressed = () => {
		konami();
		if(mapping)
			mapping.dragKeyPressed();
	}

	var konamiInput = "";
	var konamiPattern = "38384040373937396665";
	var konamiEnabled = true;
	function konami(){
		if(konamiEnabled){
			konamiInput += p5js.keyCode;
            if (konamiInput.length > konamiPattern.length) {
                konamiInput = konamiInput.substr((konamiInput.length - konamiPattern.length));
            }
            if (konamiInput === konamiPattern) {
				mapping = new Mapping(p5js);
                konamiEnabled = false;
            }
        }
	}

	//COLOR UTILS
	function rgbToHex(r, g, b) {
		return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
	}

	function getXYFromColor(r, g, b){
		var rgb = [r, g, b];
		var hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);

		var pos = {
			x: propToColor(config.plotX, rgb, hsl),
			y: propToColor(config.plotY, rgb, hsl),
			z: propToColor(config.plotZ, rgb, hsl),
			delay: hsl[2]
		}

		const radius = config.gridSize;
		const altitude = Math.sqrt(3)/2 * radius;
		pos.x -= 0.5;
		pos.y -= 0.5;
		pos.z -= 0.5;
		pos.x *= image.width * altitude * 2;
		pos.y *= image.height * radius * 1.5;
		pos.z *= -400;
		return pos;
	}

	function propToColor(prop, rgb, hsl){
		switch (prop) {
			case 'R':
				return rgb[0];
			case 'G':
				return rgb[1];
			case 'B':
				return rgb[2];
			case 'H':
				return hsl[0];
			case 'S':
				return hsl[1];
			case 'L':
				return hsl[2];
		}
	}

	function rgbToHsl(r, g, b) {
		var max = Math.max(r, g, b), min = Math.min(r, g, b);
		var h, s, l = (max + min) / 2;
		if (max == min) {
			h = s = 0; // achromatic
		} else {
			var d = max - min;
			s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
			switch (max) {
				case r: h = (g - b) / d + (g < b ? 6 : 0); break;
				case g: h = (b - r) / d + 2; break;
				case b: h = (r - g) / d + 4; break;
			}
			h /= 6;
		}
		return [h, s, l];
	}
}