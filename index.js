canvas = document.getElementById("canvas")
gl = canvas.getContext("webgl2")
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;


function MulMatrix4x4(leftMat, rightMat) {
	return [
		rightMat[0] * leftMat[0] + rightMat[4] * leftMat[1] + rightMat[8] * leftMat[2] + rightMat[12] * leftMat[3], rightMat[1] * leftMat[0] + rightMat[5] * leftMat[1] + rightMat[9] * leftMat[2] + rightMat[13] * leftMat[3], rightMat[2] * leftMat[0] + rightMat[6] * leftMat[1] + rightMat[10] * leftMat[2] + rightMat[14] * leftMat[3], rightMat[3] * leftMat[0] + rightMat[7] * leftMat[1] + rightMat[11] * leftMat[2] + rightMat[15] * leftMat[3],
		rightMat[0] * leftMat[4] + rightMat[4] * leftMat[5] + rightMat[8] * leftMat[6] + rightMat[12] * leftMat[7], rightMat[1] * leftMat[4] + rightMat[5] * leftMat[5] + rightMat[9] * leftMat[6] + rightMat[13] * leftMat[7], rightMat[2] * leftMat[4] + rightMat[6] * leftMat[5] + rightMat[10] * leftMat[6] + rightMat[14] * leftMat[7], rightMat[3] * leftMat[4] + rightMat[7] * leftMat[5] + rightMat[11] * leftMat[6] + rightMat[15] * leftMat[7],
		rightMat[0] * leftMat[8] + rightMat[4] * leftMat[9] + rightMat[8] * leftMat[10] + rightMat[12] * leftMat[11], rightMat[1] * leftMat[8] + rightMat[5] * leftMat[9] + rightMat[9] * leftMat[10] + rightMat[13] * leftMat[11], rightMat[2] * leftMat[8] + rightMat[6] * leftMat[9] + rightMat[10] * leftMat[10] + rightMat[14] * leftMat[11], rightMat[3] * leftMat[8] + rightMat[7] * leftMat[9] + rightMat[11] * leftMat[10] + rightMat[15] * leftMat[11],
		rightMat[0] * leftMat[12] + rightMat[4] * leftMat[13] + rightMat[8] * leftMat[14] + rightMat[12] * leftMat[15], rightMat[1] * leftMat[12] + rightMat[5] * leftMat[13] + rightMat[9] * leftMat[14] + rightMat[13] * leftMat[15], rightMat[2] * leftMat[12] + rightMat[6] * leftMat[13] + rightMat[10] * leftMat[14] + rightMat[14] * leftMat[15], rightMat[3] * leftMat[12] + rightMat[7] * leftMat[13] + rightMat[11] * leftMat[14] + rightMat[15] * leftMat[15]
	];
}

var keydown = new Array(12).fill(false);

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


document.addEventListener("resize",function(e){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});