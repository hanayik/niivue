// import * as glmat from "gl-matrix"
import * as nii from "nifti-reader-js"
import { Shader } from "./webgl-util/shader.js";
import { vertSliceShader, fragSliceShader } from "./shader-srcs.js";
import { vertLineShader, fragLineShader } from "./shader-srcs.js";

export var colormapTexture = null
export var volumeTexture = null
export var sliceShader = null //program for 2D slice views
export var lineShader = null //program for cross-hairs
export var crosshairWidth = 0.005;
export var crosshairColor =  [1, 0, 0, 1];
export var backColor =  [0, 0, 0, 1];
export var mouse = {x: -1, y:-1}

export function getGL() {

  var gl = document.querySelector("#gl").getContext("webgl2")
  if (!gl) {
    return null
  }
  return gl

}
function scaleTo8Bit(A, overlayItem) {
  var volume = overlayItem.volume
	var mn = volume.hdr.cal_min;
	var mx = volume.hdr.cal_max;
	var vox = A.length
	var img8 = new Uint8ClampedArray(vox);
	var scale = 1;
	var i
	if (mx > mn) scale = 255 / (mx - mn);
	for (i = 0; i < (vox - 1); i++) {
		var v = A[i];
		v = (v * volume.hdr.scl_slope) + volume.hdr.scl_inter;
		img8[i] = (v - mn) * scale;
	}
	return img8 // return scaled
}

export function calibrateIntensity(A, overlayItem) {
  var volume = overlayItem.volume
  var vox = A.length;
	var mn = Infinity;
	var mx = -Infinity;
	var i
	for (i = 0; i < (vox - 1); i++) {
		if (!isFinite(A[i])) continue;
		if (A[i] < mn) mn = A[i];
		if (A[i] > mx) mx = A[i];
	}
	//calibrate intensity
	if ((isFinite(volume.hdr.scl_slope)) && (isFinite(volume.hdr.scl_inter)) && (volume.hdr.scl_slope !== 0.0)) {
		//console.log(">> mn %f mx %f %f %f", mn, mx, hdr.scl_slope, hdr.scl_inter);
		mn = (mn * volume.hdr.scl_slope) + volume.hdr.scl_inter;
		mx = (mx * volume.hdr.scl_slope) + volume.hdr.scl_inter;
	} else {
		volume.hdr.scl_slope = 1.0;
		volume.hdr.scl_inter = 0.0;
	}
	//console.log("vx %d type %d mn %f mx %f", vox, hdr.datatypeCode, mn, mx);
	//console.log("cal mn..mx %f..%f", hdr.cal_min, hdr.cal_max);
	volume.hdr.global_min = mn;
	volume.hdr.global_max = mx;
	if ((!isFinite(volume.hdr.cal_min)) || (!isFinite(volume.hdr.cal_max)) || (volume.hdr.cal_min >= volume.hdr.cal_max)) {
		volume.hdr.cal_min = mn;
		volume.hdr.cal_max = mx;
	}
}

export function loadVolume(overlayItem) {
	var hdr = null
	var img = null
  var url = overlayItem.volumeURL
	// var volume = Object
	var req = new XMLHttpRequest();
	req.open("GET", url, true);
	req.responseType = "arraybuffer";
	req.onerror = function () {
		console.log = "Error Loading Volume";
	};
	req.onload = function () {
		var dataBuffer = req.response;
		if (dataBuffer) {
			hdr = nii.readHeader(dataBuffer);
			if (nii.isCompressed(dataBuffer)) {
				img = nii.readImage(hdr, nii.decompress(dataBuffer));
			} else {
				img = nii.readImage(hdr, dataBuffer);
			}
			//img = new Uint8Array(img);
		} else {

			alert("Unable to load buffer properly from volume?");
			console.log("no buffer?");
		}
		overlayItem.volume.hdr = hdr
		overlayItem.volume.img = img

	};
	req.send();
	return
}

export function init(gl) {
	//initial setup: only at the startup of the component
	console.log("niivue: init");
	sliceShader = new Shader(gl, vertSliceShader, fragSliceShader);
	sliceShader.use(gl)
	gl.uniform1i(sliceShader.uniforms["volume"], 0);
	gl.uniform1i(sliceShader.uniforms["colormap"], 1);
	lineShader = new Shader(gl, vertLineShader, fragLineShader);
}

export function updateGLVolume(gl, overlayItem, aS, cS, sS) { //load volume or change contrast
	var cubeStrip = [0, 1, 0, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 0, 1, 0, 0];
	var vao = gl.createVertexArray();
	gl.bindVertexArray(vao);
	var vbo = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeStrip), gl.STATIC_DRAW);
	gl.enableVertexAttribArray(0);
	gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
	// selectColormap(gl, "gray")
	var hdr = overlayItem.volume.hdr
	var img = overlayItem.volume.img
	// console.log(hdr)
	// var vox = hdr.dims[1] * hdr.dims[2] * hdr.dims[3];
	var imgRaw = null
	if (hdr.datatypeCode === 2) //data already uint8
		imgRaw = new Uint8Array(img);
	else if (hdr.datatypeCode === 4)
		imgRaw = new Int16Array(img);
	else if (hdr.datatypeCode === 16)
		imgRaw = new Float32Array(img);
	else if (hdr.datatypeCode === 512)
		imgRaw = new Uint16Array(img);
	calibrateIntensity(imgRaw, overlayItem)
	var img8 = scaleTo8Bit(imgRaw, overlayItem)
	// console.log(img8)
	if (volumeTexture)
		gl.deleteTexture(volumeTexture);
	volumeTexture = gl.createTexture();
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_3D, volumeTexture);
	gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
	gl.texStorage3D(gl.TEXTURE_3D, 1, gl.R8, hdr.dims[1], hdr.dims[2], hdr.dims[3]);
	gl.texSubImage3D(gl.TEXTURE_3D, 0, 0, 0, 0, hdr.dims[1], hdr.dims[2], hdr.dims[3], gl.RED, gl.UNSIGNED_BYTE, img8);
	/*
	//Volume Rendering values:
	var dims = [1.0, hdr.dims[1] * hdr.pixDims[1], hdr.dims[2] * hdr.pixDims[2], hdr.dims[3] * hdr.pixDims[3]];
	var longestAxis = Math.max(dims[1], Math.max(dims[2], dims[3]));
	var volScale = [dims[1] / longestAxis, dims[2] / longestAxis, dims[3] / longestAxis];
	shader.use(gl)
	gl.uniform3iv(shader.uniforms["volume_dims"], [hdr.dims[1], hdr.dims[2], hdr.dims[3]]);
	gl.uniform3fv(shader.uniforms["volume_scale"], volScale);
	*/
	/*if (sliceShader)
		gl.deleteShader(sliceShader);
	sliceShader = new Shader(gl, vertSliceShader, fragSliceShader);
	sliceShader.use(gl)
	gl.uniform1i(sliceShader.uniforms["volume"], 0);
	gl.uniform1i(sliceShader.uniforms["colormap"], 1);*/
	drawSlices(gl, overlayItem, aS, cS, sS)
} // updateVolume()

export function selectColormap(gl, lutName = "") {
	var lut = makeLut([0, 255], [0, 255], [0, 255], [0, 128], [0, 255]); //gray
	if (lutName === "Plasma")
		lut = makeLut([13, 156, 237, 240], [8, 23, 121, 249], [135, 158, 83, 33], [0, 56, 80, 88], [0, 64, 192, 255]); //plasma
	if (lutName === "Viridis")
		lut = makeLut([68, 49, 53, 253], [1, 104, 183, 231], [84, 142, 121, 37], [0, 56, 80, 88], [0, 65, 192, 255]);//viridis
	if (lutName === "Inferno")
		lut = makeLut([0, 120, 237, 240], [0, 28, 105, 249], [4, 109, 37, 33], [0, 56, 80, 88], [0, 64, 192, 255]);//inferno
	if (colormapTexture !== null)
		gl.deleteTexture(colormapTexture);
	colormapTexture = gl.createTexture();
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, colormapTexture);
	gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, 256, 1);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 256, 1, gl.RGBA, gl.UNSIGNED_BYTE, lut);
	console.log("set colormap")
} // selectColormap()

function makeLut(Rs, Gs, Bs, As, Is) {
	//create color lookup table provided arrays of reds, greens, blues, alphas and intensity indices
	//intensity indices should be in increasing order with the first value 0 and the last 255.
	// makeLut([0, 255], [0, 0], [0,0], [0,128],[0,255]); //red gradient
	var lut = new Uint8ClampedArray(256 * 4);
	for (var i = 0; i < (Is.length - 1); i++) {
		//return a + f * (b - a);
		var idxLo = Is[i];
		var idxHi = Is[i + 1];
		var idxRng = idxHi - idxLo;
		var k = idxLo * 4;
		for (var j = idxLo; j <= idxHi; j++) {
			var f = (j - idxLo) / idxRng;
			lut[k] = Rs[i] + f * (Rs[i + 1] - Rs[i]); //Red
			k++;
			lut[k] = Gs[i] + f * (Gs[i + 1] - Gs[i]); //Green
			k++;
			lut[k] = Bs[i] + f * (Bs[i + 1] - Bs[i]); //Blue
			k++;
			lut[k] = As[i] + f * (As[i + 1] - As[i]); //Alpha
			k++;
		}
	}
	//console.log(lut)
	return lut;
} // makeLut()


export function drawSlices(gl, overlayItem, a, c, s) {
	var hdr = overlayItem.volume.hdr
	console.log("drawing slices")
	gl.clearColor(backColor[0], backColor[1], backColor[2], backColor[3]);
	//gl.clearColor(1.0, 1.0, 0.0, 0.0);
	gl.clear(gl.COLOR_BUFFER_BIT);
	console.log("viewport width ", gl.canvas.width)
	console.log("viewport height ", gl.canvas.height)
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	var dims = [1.0, hdr.dims[1] * hdr.pixDims[1], hdr.dims[2] * hdr.pixDims[2], hdr.dims[3] * hdr.pixDims[3]];
	var longestAxis = Math.max(dims[1], Math.max(dims[2], dims[3]));
	var volScale = [dims[1] / longestAxis, dims[2] / longestAxis, dims[3] / longestAxis];
	console.log("volScale", volScale)
	gl.canvas.style.backgroundColor = "black"
	var xAR = gl.canvas.clientHeight / gl.canvas.clientWidth;
	var yAR = 1.0;
	if (xAR > 1.0) {
		yAR = gl.canvas.clientWidth / gl.canvas.clientHeight;
		xAR = 1.0;
	}
	console.log("xAR ", xAR)
	console.log("yAR ", yAR)
	sliceShader.use(gl);

	console.log("drawing axial")
	var w = volScale[0] * xAR;
	var h = volScale[1] * yAR;
	gl.uniform1i(sliceShader.uniforms["axCorSag"], 0);
	gl.uniform1f(sliceShader.uniforms["slice"], a);
	gl.uniform4f(sliceShader.uniforms["leftBottomWidthHeight"], -w, -h, w, h);
	gl.drawArrays(gl.TRIANGLE_STRIP, 5, 4);

	console.log("drawing coronal")
	w = volScale[0] * xAR;
	h = volScale[2] * yAR;

	gl.uniform1i(sliceShader.uniforms["axCorSag"], 1);
	gl.uniform1f(sliceShader.uniforms["slice"], c);
	gl.uniform4f(sliceShader.uniforms["leftBottomWidthHeight"], -w, 0, w, h);
	gl.drawArrays(gl.TRIANGLE_STRIP, 5, 4);

	console.log("drawing sagittal")
	w = volScale[1] * xAR;
	h = volScale[2] * yAR;
	gl.uniform1i(sliceShader.uniforms["axCorSag"], 2);
	gl.uniform1f(sliceShader.uniforms["slice"], s);
	gl.uniform4f(sliceShader.uniforms["leftBottomWidthHeight"], 0, 0, w, h);
	gl.drawArrays(gl.TRIANGLE_STRIP, 5, 4);

	if (crosshairWidth <= 0.0) {
		//gl.finish()
		return;
	}
	lineShader.use(gl)
	gl.uniform4fv(lineShader.uniforms["lineColor"], crosshairColor);
	console.log("drawing axial crosshairs")
	w = volScale[0] * xAR;
	h = volScale[1] * yAR;
	gl.uniform4f(lineShader.uniforms["leftBottomWidthHeight"], -w, -h+(c* h)-crosshairWidth, w, crosshairWidth);
	gl.drawArrays(gl.TRIANGLE_STRIP, 5, 4);
	gl.uniform4f(lineShader.uniforms["leftBottomWidthHeight"], -w+(s* w)-crosshairWidth, -h, crosshairWidth, h);
	gl.drawArrays(gl.TRIANGLE_STRIP, 5, 4);

	console.log("drawing coronal crosshairs")
	w = volScale[0] * xAR;
	h = volScale[2] * yAR;
	gl.uniform4f(lineShader.uniforms["leftBottomWidthHeight"], -w, 0+(a* h)-crosshairWidth, w, crosshairWidth);
	gl.drawArrays(gl.TRIANGLE_STRIP, 5, 4);
	gl.uniform4f(lineShader.uniforms["leftBottomWidthHeight"], -w+(s* w)-crosshairWidth, 0, crosshairWidth, h);
	gl.drawArrays(gl.TRIANGLE_STRIP, 5, 4);

	console.log("drawing sagittal crosshairs")
	w = volScale[1] * xAR;
	h = volScale[2] * yAR;
	//gl.uniform4f(lineShader.uniforms["leftBottomWidthHeight"], -w, h+(c* h)-crosshairWidth, w, crosshairWidth);
	gl.uniform4f(lineShader.uniforms["leftBottomWidthHeight"], 0, 0+(a* h)-crosshairWidth, w, crosshairWidth);
	gl.drawArrays(gl.TRIANGLE_STRIP, 5, 4);
	gl.uniform4f(lineShader.uniforms["leftBottomWidthHeight"], 0+(c* w)-crosshairWidth, 0, crosshairWidth, h);
	gl.drawArrays(gl.TRIANGLE_STRIP, 5, 4);



	// gl.viewport(gl.canvas.width / 2, 0, gl.canvas.width / 2, gl.canvas.height / 2);
	// Wait for rendering to actually finish
	gl.finish()
}
