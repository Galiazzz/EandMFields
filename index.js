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

program = null;
var UBOIndex;

numPoints = 1000;

function loadStuff(){
	if (!gl) {
		alert("Sorry, Webgl2 doesn't appear to be supported on this device\n:(");
	}

	for (var i = 0; i < numPoints; i++){
		positions.push(Math.random()*2-1)
		positions.push(Math.random()*2-1)
		positions.push(Math.random()*2-1)
		types.push(Math.floor(Math.random()*5))
		states.push(i*10000)
		lifetimes.push(Math.random()*5*1000)
	}

	program = CreateProgram(vertexShader,fragmentShader)
	UBOIndex = gl.getUniformBlockIndex(program, "Uniforms")
	var blockSize = gl.getActiveUniformBlockParameter(program, UBOIndex, gl.UNIFORM_BLOCK_DATA_SIZE);
	UBO = gl.createBuffer();
	gl.bindBuffer(gl.UNIFORM_BUFFER, UBO);
	gl.bufferData(gl.UNIFORM_BUFFER, blockSize, gl.DYNAMIC_DRAW);
	gl.bindBuffer(gl.UNIFORM_BUFFER, null);

	//the 0 is the index of the uniform block
	gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, UBO);

	UBOVariableIndicies = gl.getUniformIndices(program, ["transform","dt"]);
	UBOVariableOffsets = gl.getActiveUniforms(program, UBOVariableIndicies, gl.UNIFORM_OFFSET);

	VAOA = gl.createVertexArray()
	gl.bindVertexArray(VAOA)

	positionBufferA = gl.createBuffer()
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBufferA)
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW);
	gl.enableVertexAttribArray(0)
	gl.vertexAttribPointer(0,3,gl.FLOAT, false, 0, 0)

	typeBuffer = gl.createBuffer()
	gl.bindBuffer(gl.ARRAY_BUFFER, typeBuffer)
	gl.bufferData(gl.ARRAY_BUFFER, new Uint32Array(types), gl.DYNAMIC_DRAW);
	gl.enableVertexAttribArray(1)
	gl.vertexAttribIPointer(1,1,gl.UNSIGNED_INT, false, 0, 0)

	stateBufferA = gl.createBuffer()
	gl.bindBuffer(gl.ARRAY_BUFFER, stateBufferA)
	gl.bufferData(gl.ARRAY_BUFFER, new Uint32Array(states), gl.DYNAMIC_DRAW);
	gl.enableVertexAttribArray(2)
	gl.vertexAttribIPointer(2,1,gl.UNSIGNED_INT, false, 0, 0)

	timeBufferA = gl.createBuffer()
	gl.bindBuffer(gl.ARRAY_BUFFER, timeBufferA)
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(numPoints).fill(0), gl.DYNAMIC_DRAW);
	gl.enableVertexAttribArray(3)
	gl.vertexAttribPointer(3,1,gl.FLOAT, false, 0, 0)

	lifetimeBuffer = gl.createBuffer()
	gl.bindBuffer(gl.ARRAY_BUFFER, lifetimeBuffer)
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lifetimes), gl.STATIC_DRAW);
	gl.enableVertexAttribArray(4)
	gl.vertexAttribPointer(4,1,gl.FLOAT, false, 0, 0)

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
	gl.enableVertexAttribArray(3)
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
	gl.drawArrays(gl.POINTS, 0, numPoints);
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