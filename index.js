canvas = document.getElementById("canvas")
gl = canvas.getContext("webgl2")
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

var angleY = 0, angleX = 0;
var camX = 0, camY = 0, camZ = 0;
var zoom = 1;

var positions = [];
var types = [];
var states = [];
var lifetimes = [];

var positionBufferA, positionBufferB;
var typeBuffer;
var stateBufferA, stateBufferB;
var timeBufferA, timeBufferB;
var lifetimeBuffer;

var transformFeedbackA, transformFeedbackB;

var VAOA, VAOB;
var currentVertexArray;
var currentTransformFeedback;

var program = null;
var UBOIndex;

var numPoints = 1000;
var drawPoints;

var spawnRadius = 1;
var lifetimeMultiplier = 1;

function loadStuff(){
	if (!gl) {
		alert("Sorry, Webgl2 doesn't appear to be supported on this device\n:(");
	}

	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);

	ratios=[1,0,0,0,0];
	for (var i = 0; i < numPoints; i++){
		positions.push((Math.random()*2-1)*spawnRadius)
		positions.push((Math.random()*2-1)*spawnRadius)
		positions.push((Math.random()*2-1)*spawnRadius)
		types.push(0)
		states.push(i*10000)
		lifetimes.push(Math.random()*5*1000)
	}

	drawPoints = numPoints;

	program = CreateProgram(vertexShader,fragmentShader)
	UBOIndex = gl.getUniformBlockIndex(program, "Uniforms")
	var blockSize = gl.getActiveUniformBlockParameter(program, UBOIndex, gl.UNIFORM_BLOCK_DATA_SIZE);
	UBO = gl.createBuffer();
	gl.bindBuffer(gl.UNIFORM_BUFFER, UBO);
	gl.bufferData(gl.UNIFORM_BUFFER, blockSize, gl.DYNAMIC_DRAW);
	gl.bindBuffer(gl.UNIFORM_BUFFER, null);

	//the 0 is the index of the uniform block
	gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, UBO);

	UBOVariableIndicies = gl.getUniformIndices(program, ["transform","dt","spawnRadius","lifetimeMultiplier"]);
	UBOVariableOffsets = gl.getActiveUniforms(program, UBOVariableIndicies, gl.UNIFORM_OFFSET);

	VAOA = gl.createVertexArray()
	gl.bindVertexArray(VAOA)

	positionBufferA = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBufferA);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW);
	gl.enableVertexAttribArray(0);
	gl.vertexAttribPointer(0,3,gl.FLOAT, false, 0, 0)

	typeBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, typeBuffer)
	gl.bufferData(gl.ARRAY_BUFFER, new Uint32Array(types), gl.DYNAMIC_DRAW);
	gl.enableVertexAttribArray(1);
	gl.vertexAttribIPointer(1,1,gl.UNSIGNED_INT, false, 0, 0)

	stateBufferA = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, stateBufferA);
	gl.bufferData(gl.ARRAY_BUFFER, new Uint32Array(states), gl.DYNAMIC_DRAW);
	gl.enableVertexAttribArray(2);
	gl.vertexAttribIPointer(2,1,gl.UNSIGNED_INT, false, 0, 0)

	timeBufferA = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, timeBufferA);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(numPoints).fill(0), gl.DYNAMIC_DRAW);
	gl.enableVertexAttribArray(3);
	gl.vertexAttribPointer(3,1,gl.FLOAT, false, 0, 0);

	lifetimeBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, lifetimeBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lifetimes), gl.STATIC_DRAW);
	gl.enableVertexAttribArray(4);
	gl.vertexAttribPointer(4,1,gl.FLOAT, false, 0, 0);

	transformFeedbackA = gl.createTransformFeedback();
	gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, transformFeedbackA);
	gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER,0,positionBufferA);
	gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER,1,stateBufferA);
	gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER,2,timeBufferA);


	VAOB = gl.createVertexArray()
	gl.bindVertexArray(VAOB)
	positionBufferB = gl.createBuffer()
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBufferB)
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW)
	gl.enableVertexAttribArray(0);
	gl.vertexAttribPointer(0,3,gl.FLOAT,false,0,0)

	gl.bindBuffer(gl.ARRAY_BUFFER, typeBuffer)
	gl.enableVertexAttribArray(1)
	gl.vertexAttribIPointer(1,1,gl.UNSIGNED_INT,false,0,0)

	stateBufferB = gl.createBuffer()
	gl.bindBuffer(gl.ARRAY_BUFFER, stateBufferB)
	gl.bufferData(gl.ARRAY_BUFFER, new Uint32Array(states), gl.DYNAMIC_DRAW);
	gl.enableVertexAttribArray(2)
	gl.vertexAttribIPointer(2,1,gl.UNSIGNED_INT, false, 0, 0);

	timeBufferB = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, timeBufferB);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(numPoints).fill(0), gl.DYNAMIC_DRAW);
	gl.enableVertexAttribArray(3);
	gl.vertexAttribPointer(3,1,gl.FLOAT,false,0,0);

	gl.bindBuffer(gl.ARRAY_BUFFER,lifetimeBuffer);
	gl.enableVertexAttribArray(4);
	gl.vertexAttribPointer(4,1,gl.FLOAT,false,0,0);

	transformFeedbackB = gl.createTransformFeedback();
	gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, transformFeedbackB);
	gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER,0,positionBufferB);
	gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER,1,stateBufferB);
	gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER,2,timeBufferB);

	gl.bindBuffer(gl.ARRAY_BUFFER, null)
	gl.bindVertexArray(null)

	currentVertexArray = VAOA;
	currentTransformFeedback = transformFeedbackB;

	updateParticleNum()
	updateParticleTypes(0)

	requestAnimationFrame(Draw)
	startTime = Date.now()
}


var startTime = Date.now();

function Draw(){
	var elapsedTime = Date.now() - startTime;

	gl.clearColor(0,0,0,1)
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

	gl.uniformBlockBinding(program, UBOIndex, 0)

	gl.bindBuffer(gl.UNIFORM_BUFFER, UBO)

	var translate = [
		1, 0, 0, -camX,
		0, 1, 0, -camY,
		0, 0, 1, -camZ,
		0, 0, 0, 1
	];
	var yRot = [
		Math.cos(angleY), 0, -Math.sin(angleY), 0,
		0, 1, 0, 0,
		Math.sin(angleY), 0, Math.cos(angleY), 0,
		0, 0, 0, 1
	];
	var xRot = [
		1, 0, 0, 0,
		0, Math.cos(angleX), -Math.sin(angleX), 0,
		0, Math.sin(angleX), Math.cos(angleX), 0,
		0, 0, 0, 1
	];
	var project = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		0, 0, 1, 0
	]
	var screenStretch = [
		(canvas.width > canvas.height) ? canvas.height / canvas.width : 1, 0, 0, 0,
		0, (canvas.width < canvas.height) ? canvas.width / canvas.height : 1, 0, 0,
		0, 0, 1, 0,
		0, 0, 0, 1
	]
	var zoomMat = [
		zoom, 0, 0, 0,
		0, zoom, 0, 0,
		0, 0, 1, 0,
		0, 0, 0, 1
	]
	var combined = MulMatrix4x4(yRot, translate);
	combined = MulMatrix4x4(xRot, combined);
	combined = MulMatrix4x4(project, combined);
	combined = MulMatrix4x4(screenStretch, combined);
	combined = MulMatrix4x4(zoomMat, combined);

	gl.bufferSubData(gl.UNIFORM_BUFFER, UBOVariableOffsets[0], new Float32Array(combined));
	gl.bufferSubData(gl.UNIFORM_BUFFER, UBOVariableOffsets[1], new Float32Array([elapsedTime]));
	gl.bufferSubData(gl.UNIFORM_BUFFER, UBOVariableOffsets[2], new Float32Array([spawnRadius]));
	gl.bufferSubData(gl.UNIFORM_BUFFER, UBOVariableOffsets[3], new Float32Array([lifetimeMultiplier]));
	gl.bindBuffer(gl.UNIFORM_BUFFER, null);

	gl.viewport(0, 0, canvas.width, canvas.height);

	gl.useProgram(program)
	gl.bindVertexArray(currentVertexArray)
	gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, currentTransformFeedback);
	if(currentTransformFeedback==transformFeedbackA){
		gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER,0,positionBufferA);
		gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER,1,stateBufferA);
		gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER,2,timeBufferA);
	} else{
		gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER,0,positionBufferB);
		gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER,1,stateBufferB);
		gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER,2,timeBufferB);
	}
	gl.beginTransformFeedback(gl.POINTS);
	gl.drawArrays(gl.POINTS, 0, drawPoints);
	gl.endTransformFeedback();
	if(currentVertexArray == VAOA){
		currentVertexArray = VAOB;
		currentTransformFeedback = transformFeedbackA;
	} else{
		currentVertexArray = VAOA;
		currentTransformFeedback = transformFeedbackB
	}


	var timeMultiplier = elapsedTime * 0.1;

	if (keydown[10]) {
		speedModifier = 5;
	}
	else if (keydown[11]) {
		speedModifier = 0.1;
	}
	else {
		speedModifier = 1;
	}

	if (keydown[0] && canvasFocused) {
		camZ += 0.01 * Math.cos(angleY) * speedModifier * timeMultiplier;
		camX += 0.01 * Math.sin(angleY) * speedModifier * timeMultiplier;
	}
	if (keydown[1] && canvasFocused) {
		camX -= 0.01 * Math.cos(angleY) * speedModifier * timeMultiplier;
		camZ += 0.01 * Math.sin(angleY) * speedModifier * timeMultiplier;
	}
	if (keydown[2] && canvasFocused) {
		camZ -= 0.01 * Math.cos(angleY) * speedModifier * timeMultiplier;
		camX -= 0.01 * Math.sin(angleY) * speedModifier * timeMultiplier;
	}
	if (keydown[3] && canvasFocused) {
		camX += 0.01 * Math.cos(angleY) * speedModifier * timeMultiplier;
		camZ -= 0.01 * Math.sin(angleY) * speedModifier * timeMultiplier;
	}
	if (keydown[8] && canvasFocused) {
		camY += 0.01 * speedModifier * timeMultiplier;
	}
	if (keydown[9] && canvasFocused) {
		camY -= 0.01 * speedModifier * timeMultiplier;
	}
	if (keydown[4] && canvasFocused) {
		angleX += 0.01 * timeMultiplier;
		angleX = Math.max(Math.min(angleX, Math.PI / 2), -Math.PI / 2)
	}
	if (keydown[5] && canvasFocused) {
		angleY -= 0.01 * timeMultiplier;
	}
	if (keydown[6] && canvasFocused) {
		angleX -= 0.01 * timeMultiplier;
		angleX = Math.max(Math.min(angleX, Math.PI / 2), -Math.PI / 2)
	}
	if (keydown[7] && canvasFocused) {
		angleY += 0.01 * timeMultiplier;
	}

	//updateParticleNum()

	startTime = Date.now()
	requestAnimationFrame(Draw)
}

function CreateShader(source, type) {
	var shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
	if (success) {
		return shader;
	}
	console.error(gl.getShaderInfoLog(shader));
	alert(gl.getShaderInfoLog(shader))
	gl.deleteShader(shader);
}

function CreateProgram(vertexSource, fragmentSource) {
	var vertexShader = CreateShader(vertexSource, gl.VERTEX_SHADER);
	var fragmentShader = CreateShader(fragmentSource, gl.FRAGMENT_SHADER);

	var ShaderProgram = gl.createProgram();
	gl.attachShader(ShaderProgram, vertexShader);
	gl.attachShader(ShaderProgram, fragmentShader);

	gl.transformFeedbackVaryings(ShaderProgram, ["pos", "s", "t"], gl.SEPARATE_ATTRIBS);

	gl.linkProgram(ShaderProgram);
	var success = gl.getProgramParameter(ShaderProgram, gl.LINK_STATUS);
	if (success) {
		return ShaderProgram;
	}
	console.error(gl.getProgramInfoLog(ShaderProgram));
	gl.deleteProgram(ShaderProgram);
}

function MulMatrix4x4(leftMat, rightMat) {
	return [
		rightMat[0] * leftMat[0] + rightMat[4] * leftMat[1] + rightMat[8] * leftMat[2] + rightMat[12] * leftMat[3], rightMat[1] * leftMat[0] + rightMat[5] * leftMat[1] + rightMat[9] * leftMat[2] + rightMat[13] * leftMat[3], rightMat[2] * leftMat[0] + rightMat[6] * leftMat[1] + rightMat[10] * leftMat[2] + rightMat[14] * leftMat[3], rightMat[3] * leftMat[0] + rightMat[7] * leftMat[1] + rightMat[11] * leftMat[2] + rightMat[15] * leftMat[3],
		rightMat[0] * leftMat[4] + rightMat[4] * leftMat[5] + rightMat[8] * leftMat[6] + rightMat[12] * leftMat[7], rightMat[1] * leftMat[4] + rightMat[5] * leftMat[5] + rightMat[9] * leftMat[6] + rightMat[13] * leftMat[7], rightMat[2] * leftMat[4] + rightMat[6] * leftMat[5] + rightMat[10] * leftMat[6] + rightMat[14] * leftMat[7], rightMat[3] * leftMat[4] + rightMat[7] * leftMat[5] + rightMat[11] * leftMat[6] + rightMat[15] * leftMat[7],
		rightMat[0] * leftMat[8] + rightMat[4] * leftMat[9] + rightMat[8] * leftMat[10] + rightMat[12] * leftMat[11], rightMat[1] * leftMat[8] + rightMat[5] * leftMat[9] + rightMat[9] * leftMat[10] + rightMat[13] * leftMat[11], rightMat[2] * leftMat[8] + rightMat[6] * leftMat[9] + rightMat[10] * leftMat[10] + rightMat[14] * leftMat[11], rightMat[3] * leftMat[8] + rightMat[7] * leftMat[9] + rightMat[11] * leftMat[10] + rightMat[15] * leftMat[11],
		rightMat[0] * leftMat[12] + rightMat[4] * leftMat[13] + rightMat[8] * leftMat[14] + rightMat[12] * leftMat[15], rightMat[1] * leftMat[12] + rightMat[5] * leftMat[13] + rightMat[9] * leftMat[14] + rightMat[13] * leftMat[15], rightMat[2] * leftMat[12] + rightMat[6] * leftMat[13] + rightMat[10] * leftMat[14] + rightMat[14] * leftMat[15], rightMat[3] * leftMat[12] + rightMat[7] * leftMat[13] + rightMat[11] * leftMat[14] + rightMat[15] * leftMat[15]
	];
}

var keydown = new Array(12).fill(false);

canvasFocused = true;

document.addEventListener("keyup", function(e) {
	if (e.key.toLowerCase() == "w") { keydown[0] = false }
	if (e.key.toLowerCase() == "a") { keydown[1] = false }
	if (e.key.toLowerCase() == "s") { keydown[2] = false }
	if (e.key.toLowerCase() == "d") { keydown[3] = false }
	if (e.key == "ArrowUp") { keydown[4] = false }
	if (e.key == "ArrowLeft") { keydown[5] = false }
	if (e.key == "ArrowDown") { keydown[6] = false }
	if (e.key == "ArrowRight") { keydown[7] = false }
	if (e.key == " ") { keydown[8] = false }
	if (e.key == "Shift") { keydown[9] = false }
	if (e.key.toLowerCase() == "c") { keydown[10] = false }
	if (e.key.toLowerCase() == "x") { keydown[11] = false }
});

document.addEventListener("keydown", function(e) {
	if (e.key.toLowerCase() == "w") { keydown[0] = true }
	if (e.key.toLowerCase() == "a") { keydown[1] = true }
	if (e.key.toLowerCase() == "s") { keydown[2] = true }
	if (e.key.toLowerCase() == "d") { keydown[3] = true }
	if (e.key == "ArrowUp") { keydown[4] = true; if (canvasFocused) { e.preventDefault(); } }
	if (e.key == "ArrowLeft") { keydown[5] = true }
	if (e.key == "ArrowDown") { keydown[6] = true; if (canvasFocused) { e.preventDefault(); } }
	if (e.key == "ArrowRight") { keydown[7] = true }
	if (e.key == " ") { keydown[8] = true; e.preventDefault(); }
	if (e.key == "Shift") { keydown[9] = true }
	if (e.key.toLowerCase() == "c") { keydown[10] = true }
	if (e.key.toLowerCase() == "x") { keydown[11] = true }
	if (e.key == "Enter") { switch (canvasFocused) { case true: canvasFocused = false; break; case false: canvasFocused = true; break; } }
	if (e.key.toLowerCase() == "p") { switch (showDetails) { case false: showDetails = true; infoPointer.parentNode.style.display = "block"; break; case true: showDetails = false; infoPointer.parentNode.style.display = "none"; break; } };
});


var isPointerCaptured = false;

function CanvasClick() {
	canvasFocused = true;
	canvas.requestPointerLock();
	document.body.style.overflow = "hidden";
}

document.addEventListener("pointerlockchange", function() {
	if (document.pointerLockElement === canvas) {
		isPointerCaptured = true;
		canvasFocused = true;
		pastTouches = [];
	}
	else {
		isPointerCaptured = false;
		canvasFocused = false;
		pastTouches = [];
		document.body.style.overflow = "scroll";
	}
});

document.addEventListener("mousemove", function(e) {
	if (isPointerCaptured) {
		angleY += e.movementX * 0.005;
		angleX -= e.movementY * 0.005;
		angleX = Math.max(Math.min(angleX, Math.PI / 2), -Math.PI / 2)
	}
})

function CanvasDoubleClick() {
	canvasFocused = false;
	document.exitPointerLock();
	document.body.style.overflow = "scroll";
}


document.addEventListener("resize",function(e){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});


//find point on unit sphere given coodinates
function RadiansToPointOnSphere(coordObj) {
	return [
		Math.cos(coordObj.DEC) * -Math.sin(coordObj.RA),
		Math.sin(coordObj.DEC),
		Math.cos(coordObj.DEC) * Math.cos(coordObj.RA)];
}

var numTouches = 0;
var pastTouches = [];
document.addEventListener("touchstart", function(e) {
	if (canvasFocused) {
		e.preventDefault();
		for (var i = 0; i < e.changedTouches.length; i++) {
			pastTouches.push(e.changedTouches[i]);
			numTouches++;
		}
	}
});
document.addEventListener("touchmove", function(e) {
	if (canvasFocused) {
		e.preventDefault();
		e.stopImmediatePropagation();
		if (numTouches == 1) {
			angleY += 0.005 * (pastTouches[0].clientX - e.changedTouches[0].clientX);
			angleX -= 0.005 * (pastTouches[0].clientY - e.changedTouches[0].clientY);
			angleX = Math.max(Math.min(angleX, Math.PI / 2), -Math.PI / 2)
			pastTouches[0] = e.changedTouches[0];
		}
		else if (numTouches == 2) {
			if (e.changedTouches.length == 1) {
				var replacedIndex = 1;
				if (Math.hypot(pastTouches[0].clientX - e.changedTouches[0].clientX, pastTouches[0].clientY - e.changedTouches[0].clientY) < Math.hypot(pastTouches[1].clientX - e.changedTouches[0].clientX, pastTouches[1].clientY - e.changedTouches[0].clientY)) {
					replacedIndex = 0;
				}
				var dist = Math.hypot(pastTouches[1 - replacedIndex].clientX - e.changedTouches[0].clientX, pastTouches[1 - replacedIndex].clientY - e.changedTouches[0].clientY) - Math.hypot(pastTouches[0].clientX - pastTouches[1].clientX, pastTouches[0].clientY - pastTouches[1].clientY);
				var direction = RadiansToPointOnSphere({ RA: -angleY, DEC: angleX });
				camX += 0.01 * dist * direction[0] * speedModifier;
				camY += 0.01 * dist * direction[1] * speedModifier;
				camZ += 0.01 * dist * direction[2] * speedModifier;
				pastTouches[replacedIndex] = e.changedTouches[0];
			}
			else {
				var dist = Math.hypot(e.changedTouches[0].clientX - e.changedTouches[1].clientX, e.changedTouches[0].clientY - e.changedTouches[1].clientY) - Math.hypot(pastTouches[0].clientX - pastTouches[1].clientX, pastTouches[0].clientY - pastTouches[1].clientY);
				var direction = RadiansToPointOnSphere({ RA: -angleY, DEC: angleX });
				camX += 0.01 * dist * direction[0] * speedModifier;
				camY += 0.01 * dist * direction[1] * speedModifier;
				camZ += 0.01 * dist * direction[2] * speedModifier;
				pastTouches[0] = e.changedTouches[0];
				pastTouches[1] = e.changedTouches[1];
			}
		}
	}
}, { passive: false });

function EndPointer(e) {
	for (var j = 0; j < e.changedTouches.length; j++) {
		var minDist = Infinity;
		var minDistIndex = null;
		for (var i = 0; i < pastTouches.length; i++) {
			var dist = Math.hypot(pastTouches[i].clientX - e.changedTouches[j].clientX, pastTouches[i].clientY - e.changedTouches[j].clientY);
			if (dist < minDist) {
				minDist = dist;
				minDistIndex = i;
			}
		}
		if (minDistIndex != null) {
			pastTouches.splice(minDistIndex, 1);
			numTouches--;
		}
	}
}

document.addEventListener("touchend", EndPointer);
document.addEventListener("touchcancel", EndPointer);

document.addEventListener("wheel", function(e) {
	if (canvasFocused) {
		e.preventDefault();
		var dist = -e.deltaY * 0.5;
		var direction = RadiansToPointOnSphere({ RA: -angleY, DEC: angleX });
		camX += 0.01 * dist * direction[0] * speedModifier;
		camY += 0.01 * dist * direction[1] * speedModifier;
		camZ += 0.01 * dist * direction[2] * speedModifier;
	}
}, { passive: false });


numSlider = document.getElementById("numParticleSlider");
numDisplay = document.getElementById("particleDisplay");
function updateParticleNum(){
	var base = parseInt(numSlider.value);
	var nP = Math.pow(base,3);
	var diff = nP - numPoints;
	if(diff>0){
		var tmp = [[],[],[],[]];
		for(i = 0; i < diff; i++){
			tmp[0].push((Math.random()*2-1)*spawnRadius);
			tmp[0].push((Math.random()*2-1)*spawnRadius);
			tmp[0].push((Math.random()*2-1)*spawnRadius);

			tmp[2].push(Math.floor(Math.random()*10000));
			tmp[3].push(Math.random()*5*1000)
		}
		
		numE = Math.round(diff*ratios[0]);
		numB = Math.round(diff*ratios[1]);
		numD = Math.round(diff*ratios[2]);
		numH = Math.round(diff*ratios[3]);
		numV = Math.round(diff*ratios[4]);
		for(i = 0; i < numE; i++){tmp[1].push(0);}
		for(i = 0; i < numB; i++){tmp[1].push(1);}
		for(i = 0; i < numD; i++){tmp[1].push(2);}
		for(i = 0; i < numH; i++){tmp[1].push(3);}
		for(i = 0; i < numV; i++){tmp[1].push(4);}

		gl.bindVertexArray(VAOA);
		gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);

		var newBuffer = gl.createBuffer();
		gl.bindBuffer(gl.COPY_WRITE_BUFFER,newBuffer);
		gl.bindBuffer(gl.COPY_READ_BUFFER,positionBufferA);
		gl.bufferData(gl.COPY_WRITE_BUFFER, nP*4*3, gl.DYNAMIC_DRAW)
		gl.copyBufferSubData(gl.COPY_READ_BUFFER, gl.COPY_WRITE_BUFFER, 0, 0, numPoints*4*3);
		gl.bufferSubData(gl.COPY_WRITE_BUFFER, numPoints*4*3, new Float32Array(tmp[0]));
		positionBufferA = newBuffer;
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBufferA);
		gl.vertexAttribPointer(0,3,gl.FLOAT, false, 0, 0);

		newBuffer = gl.createBuffer();
		gl.bindBuffer(gl.COPY_WRITE_BUFFER,newBuffer);
		gl.bindBuffer(gl.COPY_READ_BUFFER,typeBuffer);
		gl.bufferData(gl.COPY_WRITE_BUFFER, nP*4, gl.DYNAMIC_DRAW)
		gl.copyBufferSubData(gl.COPY_READ_BUFFER, gl.COPY_WRITE_BUFFER, 0, 0, numPoints*4);
		gl.bufferSubData(gl.COPY_WRITE_BUFFER, numPoints*4, new Uint32Array(tmp[1]));
		typeBuffer = newBuffer;
		gl.bindBuffer(gl.ARRAY_BUFFER, typeBuffer);
		gl.vertexAttribIPointer(1,1,gl.UNSIGNED_INT, false, 0, 0);

		newBuffer = gl.createBuffer();
		gl.bindBuffer(gl.COPY_WRITE_BUFFER, newBuffer);
		gl.bindBuffer(gl.COPY_READ_BUFFER,stateBufferA);
		gl.bufferData(gl.COPY_WRITE_BUFFER, nP*4, gl.DYNAMIC_DRAW)
		gl.copyBufferSubData(gl.COPY_READ_BUFFER, gl.COPY_WRITE_BUFFER, 0, 0, numPoints*4);
		gl.bufferSubData(gl.COPY_WRITE_BUFFER, numPoints*4, new Uint32Array(tmp[2]));
		stateBufferA = newBuffer;
		gl.bindBuffer(gl.ARRAY_BUFFER, stateBufferA);
		gl.vertexAttribIPointer(2,1,gl.UNSIGNED_INT, false, 0, 0);

		newBuffer = gl.createBuffer();
		gl.bindBuffer(gl.COPY_WRITE_BUFFER, newBuffer);
		gl.bindBuffer(gl.COPY_READ_BUFFER,timeBufferA);
		gl.bufferData(gl.COPY_WRITE_BUFFER, nP*4, gl.DYNAMIC_DRAW)
		gl.copyBufferSubData(gl.COPY_READ_BUFFER, gl.COPY_WRITE_BUFFER, 0, 0, numPoints*4);
		gl.bufferSubData(gl.COPY_WRITE_BUFFER, numPoints*4, new Float32Array(diff).fill(0));
		timeBufferA = newBuffer;
		gl.bindBuffer(gl.ARRAY_BUFFER, timeBufferA);
		gl.vertexAttribPointer(3,1,gl.FLOAT, false, 0, 0);

		newBuffer = gl.createBuffer();
		gl.bindBuffer(gl.COPY_WRITE_BUFFER, newBuffer);
		gl.bindBuffer(gl.COPY_READ_BUFFER,lifetimeBuffer);
		gl.bufferData(gl.COPY_WRITE_BUFFER, nP*4, gl.STATIC_DRAW)
		gl.copyBufferSubData(gl.COPY_READ_BUFFER, gl.COPY_WRITE_BUFFER, 0, 0, numPoints*4);
		gl.bufferSubData(gl.COPY_WRITE_BUFFER, numPoints*4, new Float32Array(tmp[3]));
		lifetimeBuffer = newBuffer;
		gl.bindBuffer(gl.ARRAY_BUFFER, lifetimeBuffer);
		gl.vertexAttribPointer(4,1,gl.FLOAT, false, 0, 0);

		gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, transformFeedbackA);
		gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER,0,positionBufferA);
		gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER,1,stateBufferA);
		gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER,2,timeBufferA);

		gl.bindVertexArray(VAOB)
		newBuffer = gl.createBuffer();
		gl.bindBuffer(gl.COPY_WRITE_BUFFER, newBuffer);
		gl.bindBuffer(gl.COPY_READ_BUFFER,positionBufferB);
		gl.bufferData(gl.COPY_WRITE_BUFFER, nP*4*3, gl.DYNAMIC_DRAW)
		gl.copyBufferSubData(gl.COPY_READ_BUFFER, gl.COPY_WRITE_BUFFER, 0, 0, numPoints*4*3);
		gl.bufferSubData(gl.COPY_WRITE_BUFFER, numPoints*4*3, new Float32Array(tmp[0]));
		positionBufferB = newBuffer;
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBufferB);
		gl.vertexAttribPointer(0,3,gl.FLOAT,false,0,0);

		gl.bindBuffer(gl.ARRAY_BUFFER, typeBuffer);
		gl.vertexAttribIPointer(1,1,gl.UNSIGNED_INT, false, 0, 0);

		newBuffer = gl.createBuffer();
		gl.bindBuffer(gl.COPY_WRITE_BUFFER, newBuffer);
		gl.bindBuffer(gl.COPY_READ_BUFFER,stateBufferB);
		gl.bufferData(gl.COPY_WRITE_BUFFER, nP*4, gl.DYNAMIC_DRAW)
		gl.copyBufferSubData(gl.COPY_READ_BUFFER, gl.COPY_WRITE_BUFFER, 0, 0, numPoints*4);
		gl.bufferSubData(gl.COPY_WRITE_BUFFER, numPoints*4, new Uint32Array(tmp[2]));
		stateBufferB = newBuffer;
		gl.bindBuffer(gl.ARRAY_BUFFER, stateBufferB);
		gl.vertexAttribIPointer(2,1,gl.UNSIGNED_INT,false,0,0);

		newBuffer = gl.createBuffer();
		gl.bindBuffer(gl.COPY_WRITE_BUFFER, newBuffer);
		gl.bindBuffer(gl.COPY_READ_BUFFER,timeBufferB);
		gl.bufferData(gl.COPY_WRITE_BUFFER, nP*4, gl.DYNAMIC_DRAW)
		gl.copyBufferSubData(gl.COPY_READ_BUFFER, gl.COPY_WRITE_BUFFER, 0, 0, numPoints*4);
		gl.bufferSubData(gl.COPY_WRITE_BUFFER, numPoints*4, new Float32Array(diff).fill(0));
		timeBufferB = newBuffer;
		gl.bindBuffer(gl.ARRAY_BUFFER, timeBufferB);
		gl.vertexAttribPointer(3,1,gl.FLOAT,false,0,0);

		gl.bindBuffer(gl.ARRAY_BUFFER, lifetimeBuffer);
		gl.vertexAttribPointer(4,1,gl.FLOAT, false, 0, 0);

		gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, transformFeedbackB);
		gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER,0,positionBufferB);
		gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER,1,stateBufferB);
		gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER,2,timeBufferB);

		gl.bindBuffer(gl.ARRAY_BUFFER, null)
		gl.bindBuffer(gl.COPY_READ_BUFFER, null)
		gl.bindBuffer(gl.COPY_WRITE_BUFFER, null);

		gl.bindVertexArray(null);

		numPoints = nP;
		drawPoints = numPoints;

		positions.concat(tmp[0]);
		types.concat(tmp[1]);
		states.push(tmp[2]);
		lifetimes.push(tmp[3]);
	} else{
		drawPoints = nP;
	}
	numDisplay.innerText = `Number of Particles: ${base}^3 = ${drawPoints}`;
	updateParticleTypes(0);
}
				 //[     0,      1,      2,      3,      4]
var ratios = []; //[ratioE, ratioB, ratioD, ratioH, ratioV]
var inputE = document.getElementById("fracE");
var inputB = document.getElementById("fracB");
var inputD = document.getElementById("fracD");
var inputH = document.getElementById("fracH");
var inputV = document.getElementById("fracV");
function updateParticleTypes(selection){
	var E = parseFloat(inputE.value);
	var B = parseFloat(inputB.value);
	var D = parseFloat(inputD.value);
	var H = parseFloat(inputH.value);
	var V = parseFloat(inputV.value);

	var arr = [E, B, D, H, V];
	var otherSum = 0;
	for(i=0; i < arr.length; i++){
		if(i != selection){
			otherSum += arr[i];
		}
	}
	if(otherSum > 0){
		switch(selection){
			case 0:
				ratios[0] = E;
				// var rB = ratios[1]/(ratios[1]+ratios[2]+ratios[3]+ratios[4]);
				// var rDB = ratios[2]/ratios[1];
				// var rHB = ratios[3]/ratios[1];
				// var rVB = ratios[4]/ratios[1];
				// ratios[1] = (1-ratios[0])*rB;
				// ratios[2] = ratios[1]*rDB;
				// ratios[3] = ratios[1]*rHB;
				// ratios[4] = ratios[1]*rVB;
				break;
			case 1:
				ratios[1]=B;
				break;
			case 2:
				ratios[2]=D;
				break;
			case 3:
				ratios[3]=H;
				break;
			case 4:
				ratios[4]=V;
				break;
			default: break;
		}
	}

	baseIndex = -1;
	for(var i = 0; i < arr.length; i++){
		if(arr[i]>0 && i != selection){
			baseIndex = i;
			break;
		}
	}
	if(baseIndex > -1){
		ratios[baseIndex] = (1-ratios[selection]) * arr[baseIndex]/otherSum;
		for(var i = 0; i < arr.length; i++){
			if(i == selection || i == baseIndex){
				continue;
			}
			ratios[i]=ratios[baseIndex]*arr[i]/arr[baseIndex];
		}
	}

	document.getElementById("Edisplay").innerText = "E particle fraction: "+ratios[0];
	document.getElementById("Bdisplay").innerText = "B particle fraction: "+ratios[1];
	document.getElementById("Ddisplay").innerText = "D particle fraction: "+ratios[2];
	document.getElementById("Hdisplay").innerText = "H particle fraction: "+ratios[3];
	document.getElementById("Vdisplay").innerText = "V particle fraction: "+ratios[4];
	document.getElementById("fracE").value = ratios[0];
	document.getElementById("fracB").value = ratios[1];
	document.getElementById("fracD").value = ratios[2];
	document.getElementById("fracH").value = ratios[3];
	document.getElementById("fracV").value = ratios[4];

	for(var i = 0; i < arr.length; i++){
		arr[i]=Math.round(drawPoints*ratios[i]);
	}
	var index = 0;
	for(var i = 0; i < drawPoints; i++){
		while(arr[index]==0){
			index++;
		}
		if(index >= arr.length){break;}
		types[i] = index;
		arr[index]--;
	}
	gl.bindVertexArray(VAOA);
	gl.bindBuffer(gl.ARRAY_BUFFER, typeBuffer);
	gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Uint32Array(types));
	gl.vertexAttribIPointer(1,1,gl.UNSIGNED_INT, false, 0, 0);

	gl.bindVertexArray(VAOB);
	gl.vertexAttribIPointer(1,1,gl.UNSIGNED_INT, false, 0, 0);


	gl.bindBuffer(gl.ARRAY_BUFFER, null);
}