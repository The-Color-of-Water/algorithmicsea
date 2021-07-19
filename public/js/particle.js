/******************
Código por Vamoss
Link original:
https://www.openprocessing.org/sketch/903104

Links do autor:
http://vamoss.com.br
http://twitter.com/vamoss
http://github.com/vamoss
******************/

class Particle {
	constructor(color, x, y, z, size) {
		this.size = size ? size : config.gridSize;
		this.setPosition(x, y, z);
		this.setColor(color);
		this.createPoligon(6);

		this.id = Particle.counter++;

		this.itemSize = 3;//x, y, z
	}

	//need to be set before all
	static init(p5js){
		Particle.p5js = p5js;

		Particle.counter = 0;

		Particle.fogR = 255;
		Particle.fogG = 255;
		Particle.fogB = 255;
	}

	static setup(renderer){
		const vert = `
			float rand(vec2 n) { 
				return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
			}

			float noise(vec2 p){
				vec2 ip = floor(p);
				vec2 u = fract(p);
				u = u*u*(3.0-2.0*u);

				float res = mix(
					mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
					mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
				return res*res;
			}

			attribute vec3 aPosition;

			// matrices
			uniform mat4 uModelViewMatrix;
			uniform mat4 uProjectionMatrix;

			uniform float uTime;
			uniform bool uNoise;
			uniform float uAmplitude;
			void main() {
				vec3 pos = aPosition;
				if(uNoise) pos.z += noise(vec2(pos.x/200. + uTime/10. + 10., pos.y/200. + uTime/10. + 10.)) * uAmplitude;
				gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(pos, 1.0);
			}
		`

	
		const frag = `
			#ifdef GL_ES
			precision highp float;
			#endif

			uniform vec3 uColor;

			void main() {
				gl_FragColor = vec4(uColor, 1.0);
			}
		`
		var vs = renderer.drawingContext.createShader(renderer.drawingContext.VERTEX_SHADER);
		renderer.drawingContext.shaderSource(vs, vert);
		renderer.drawingContext.compileShader(vs);

		var fs = renderer.drawingContext.createShader(renderer.drawingContext.FRAGMENT_SHADER);
		renderer.drawingContext.shaderSource(fs, frag);
		renderer.drawingContext.compileShader(fs);

		renderer.program = renderer.drawingContext.createProgram();
		renderer.drawingContext.attachShader(renderer.program, vs);
		renderer.drawingContext.attachShader(renderer.program, fs);
		renderer.drawingContext.linkProgram(renderer.program);

		if (!renderer.drawingContext.getShaderParameter(vs, renderer.drawingContext.COMPILE_STATUS))
			console.log(renderer.drawingContext.getShaderInfoLog(vs));

		if (!renderer.drawingContext.getShaderParameter(fs, renderer.drawingContext.COMPILE_STATUS))
			console.log(renderer.drawingContext.getShaderInfoLog(fs));

		if (!renderer.drawingContext.getProgramParameter(renderer.program, renderer.drawingContext.LINK_STATUS))
			console.log(renderer.drawingContext.getProgramInfoLog(renderer.program));
		
		renderer.program.aPosition = renderer.drawingContext.getAttribLocation(renderer.program, "aPosition");
		renderer.program.uModelViewMatrix = renderer.drawingContext.getUniformLocation(renderer.program, "uModelViewMatrix");
		renderer.program.uProjectionMatrix = renderer.drawingContext.getUniformLocation(renderer.program, "uProjectionMatrix");
		renderer.program.uTime = renderer.drawingContext.getUniformLocation(renderer.program, "uTime");
		renderer.program.uColor = renderer.drawingContext.getUniformLocation(renderer.program, "uColor");
		renderer.program.uNoise = renderer.drawingContext.getUniformLocation(renderer.program, "uNoise");
		renderer.program.uAmplitude = renderer.drawingContext.getUniformLocation(renderer.program, "uAmplitude");

		renderer.drawingContext.enableVertexAttribArray(renderer.program.aPosition);

		Particle.updateOnce = function(renderer, time){
			renderer.drawingContext.useProgram(renderer.program);
			renderer.drawingContext.uniformMatrix4fv(renderer.program.uModelViewMatrix, false, renderer.uMVMatrix.mat4);
			renderer.drawingContext.uniformMatrix4fv(renderer.program.uProjectionMatrix, false, renderer.uPMatrix.mat4);
			renderer.drawingContext.uniform1f(renderer.program.uTime, time);
			renderer.drawingContext.uniform1f(renderer.program.uNoise, config.moviment);
			renderer.drawingContext.uniform1f(renderer.program.uAmplitude, config.waveAmplitude);
		}
	}

	select() {

	}

	setColor(color){
		if(Array.isArray(color)){
			this.animateColor = true;
			this.colors = color;
			this.currentColor = Particle.p5js.floor(Particle.p5js.random(this.colors.length));
			this.nextChange = 3;
			this.lastChange = Particle.p5js.millis() / 1000;
			this.elapsed = Math.random();
			this.storeRGBColors();
			this.color = [
				Particle.p5js.red(color[this.currentColor])/255,
				Particle.p5js.green(color[this.currentColor])/255,
				Particle.p5js.blue(color[this.currentColor])/255
			];
		}else{
			this.animateColor = false;
			this.color = [
				Particle.p5js.red(color)/255,
				Particle.p5js.green(color)/255,
				Particle.p5js.blue(color)/255
			];
		}
	}

	setPosition(x, y, z){
		this.pos = Particle.p5js.createVector(x, y, z);
		this.lastPos = Particle.p5js.createVector(x, y, z);
	}

	storeRGBColors(){
		this.curRed = Particle.p5js.red(this.colors[this.currentColor]);
		this.curGreen = Particle.p5js.green(this.colors[this.currentColor]);
		this.curBlue = Particle.p5js.blue(this.colors[this.currentColor]);

		var nextColor = this.currentColor + 1;
		if(nextColor >= this.colors.length)
			nextColor = 0;

		this.nextRed = Particle.p5js.red(this.colors[nextColor]);
		this.nextGreen = Particle.p5js.green(this.colors[nextColor]);
		this.nextBlue = Particle.p5js.blue(this.colors[nextColor]);
	}

	update(time, forceUpdate) {
	    var diffX = this.pos.x - this.lastPos.x;
		var diffY = this.pos.y - this.lastPos.y;
		var diffZ = this.pos.z - this.lastPos.z;
		this.posChanged = diffX != 0 || diffY != 0 || diffZ != 0;
		this.lastPos.x = this.pos.x;
		this.lastPos.y = this.pos.y;
		this.lastPos.z = this.pos.z;

		if(this.animateColor){
			this.elapsed += (time - this.lastChange) / this.nextChange;
			this.lastChange = time;
			if(this.elapsed > 1){
				this.elapsed = 0;
				
				this.currentColor++;
				if(this.currentColor>=this.colors.length)
					this.currentColor = 0;

				this.storeRGBColors();
			}else if(this.posChanged){
				this.storeRGBColors();
			}

			// console.log(this.red, this.nextRed, this.elapsed);
			this.color[0] = Particle.p5js.lerp(this.curRed, this.nextRed, this.elapsed);
			this.color[1] = Particle.p5js.lerp(this.curGreen, this.nextGreen, this.elapsed);
			this.color[2] = Particle.p5js.lerp(this.curBlue, this.nextBlue, this.elapsed);

			//fog
			var dist = Particle.p5js.pow(Particle.p5js.mag(this.pos.x / Particle.p5js.width * config.fogSizeX + config.fogX, this.pos.y / Particle.p5js.height * config.fogSizeY + config.fogY), config.fogPower);
			this.color[0] = Particle.p5js.round(Particle.p5js.lerp(this.color[0], Particle.fogR, dist))/255;
			this.color[1] = Particle.p5js.round(Particle.p5js.lerp(this.color[1], Particle.fogG, dist))/255;
			this.color[2] = Particle.p5js.round(Particle.p5js.lerp(this.color[2], Particle.fogB, dist))/255;
		}
		if(this.posChanged){
			//or position has changed: 'posChanged'
			for (var i = 0; i < this.shape.length; i+=3) {
				this.shape[i+0] += diffX;
				this.shape[i+1] += diffY;
				this.shape[i+2] += diffZ;
			}
		}
	}

	draw(renderer, forceDraw){
		//start webgl buffer
		if(!renderer["buffer" + this.id]){
			renderer["buffer" + this.id] = renderer.drawingContext.createBuffer();
			renderer.drawingContext.useProgram(renderer.program);
			renderer.drawingContext.enableVertexAttribArray(renderer.program.aPosition);
			renderer.drawingContext.bindBuffer(renderer.drawingContext.ARRAY_BUFFER, renderer["buffer" + this.id]);
			renderer.drawingContext.bufferData(renderer.drawingContext.ARRAY_BUFFER, this.shape, renderer.drawingContext.STATIC_DRAW);
		}else{
			renderer.drawingContext.bindBuffer(renderer.drawingContext.ARRAY_BUFFER, renderer["buffer" + this.id]);
			if(this.posChanged || forceDraw) {
				renderer.drawingContext.bufferData(renderer.drawingContext.ARRAY_BUFFER, this.shape, renderer.drawingContext.STATIC_DRAW);
			}
		}

		renderer.drawingContext.vertexAttribPointer(renderer.program.aPosition, this.itemSize, renderer.drawingContext.FLOAT, false, 0, 0);
	
		//update uniforms
		renderer.drawingContext.useProgram(renderer.program);
		renderer.drawingContext.uniform3f(renderer.program.uColor, this.color[0], this.color[1], this.color[2]);

		//draw
		renderer.drawingContext.drawArrays(renderer.drawingContext.TRIANGLE_FAN, 0, this.shape.length / this.itemSize);
	}

	toCircle() {
		const tween = new TWEEN.Tween(this)
			.to({ sides: 30 }, 2000)
			.easing(TWEEN.Easing.Quadratic.InOut)
			.onUpdate(() => {
				this.createPoligon(this.sides);
			})
			.start();
	}

	createPoligon(sides){
		this.sides = sides;
		this.shape = [];
		for(let a = 0; a < Particle.p5js.TWO_PI-0.01; a+=Particle.p5js.TWO_PI/sides){
			this.shape.push(Particle.p5js.sin(a) * this.size + this.size + this.pos.x);
			this.shape.push(Particle.p5js.cos(a) * this.size + this.size + this.pos.y);
			this.shape.push(this.pos.z);
		}
		this.shape = new Float32Array(this.shape);
	}
}