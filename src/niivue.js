import * as nii from "nifti-reader-js"
import { Shader } from "./webgl-util/shader.js";
import * as mat from "gl-matrix";
import { vertSliceShader, fragSliceShader } from "./shader-srcs.js";
import { vertLineShader, fragLineShader } from "./shader-srcs.js";
import { vertRenderShader, fragRenderShader } from "./shader-srcs.js";
import {bus} from "@/bus.js"

export var crosshairWidth = 0.005;
export var crosshairColor =  [1, 0, 0, 1];
export var crosshairPos = [0.5, 0.5, 0.5];
export var backColor =  [0, 0, 0, 1];
export const sliceTypeAxial = 0;
export const sliceTypeCoronal = 1;
export const sliceTypeSagittal = 2;
export const sliceTypeMultiplanar = 3;
export const sliceTypeRender = 4;
export var sliceType = sliceTypeRender; //view: axial, coronal, sagittal, multiplanar or render
export var renderAzimuth = 120;
export var renderElevation = 15;
var _overlayItem = null

var colormapTexture = null
var volumeTexture = null
var sliceShader = null //program for 2D slice views
var lineShader = null //program for cross-hairs
var renderShader = null //program for 3D views
var mousePos = [0,0];
var numScreenSlices = 0; //e.g. for multiplanar view, 3 simultaneous slices: axial, coronal, sagittal
var screenSlices = [ //location and type of each 2D slice on screen, allows clicking to detect position
  {leftBottomWidthHeight: [1, 0, 0, 1], axCorSag: sliceTypeAxial},
  {leftBottomWidthHeight: [1, 0, 0, 1], axCorSag: sliceTypeAxial},
  {leftBottomWidthHeight: [1, 0, 0, 1], axCorSag: sliceTypeAxial},
  {leftBottomWidthHeight: [1, 0, 0, 1], axCorSag: sliceTypeAxial}
];

export function mouseDown(x, y) {
	if (sliceType != sliceTypeRender) return;
	mousePos = [x,y];
} // mouseDown()

export function mouseMove(x, y) {
	if (sliceType != sliceTypeRender) return;
	renderAzimuth += x - mousePos[0];
	renderElevation += y - mousePos[1];
	mousePos = [x,y];
	drawSlices(getGL(), _overlayItem) //_overlayItem is local to niivue.js and is set in loadVolume()
} // mouseMove()

export function setSliceType(st) {
  sliceType = st
  drawSlices(getGL(), _overlayItem) //_overlayItem is local to niivue.js and is set in loadVolume()
} // setSliceType()

export function getGL() {
  var gl = document.querySelector("#gl").getContext("webgl2")
  if (!gl) {
    return null
  }
  return gl
} // getGL()

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
} // scaleTo8Bit()

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
} // calibrateIntensity()

export function loadVolume(overlayItem) {
	var hdr = null
	var img = null
	var url = overlayItem.volumeURL
	var req = new XMLHttpRequest();
	req.open("GET", url, true);
	req.responseType = "arraybuffer";
	req.onerror = function () {
		console.log = "Error Loading Volume";
	}
	req.onload = function () {
		var dataBuffer = req.response;
		if (dataBuffer) {
			hdr = nii.readHeader(dataBuffer);
			if (nii.isCompressed(dataBuffer)) {
				img = nii.readImage(hdr, nii.decompress(dataBuffer));
			} else {
				img = nii.readImage(hdr, dataBuffer);
			}
		} else {

			alert("Unable to load buffer properly from volume?");
			console.log("no buffer?");
		}
		overlayItem.volume.hdr = hdr
		overlayItem.volume.img = img
		_overlayItem = overlayItem
		selectColormap(getGL(), overlayItem.colorMap)
		updateGLVolume(getGL(), overlayItem)
	};
	req.send();
	return
} // loadVolume()

export function init(gl) {
	//initial setup: only at the startup of the component
	console.log("niivue: init");
	sliceShader = new Shader(gl, vertSliceShader, fragSliceShader);
	sliceShader.use(gl)
	gl.uniform1i(sliceShader.uniforms["volume"], 0);
	gl.uniform1i(sliceShader.uniforms["colormap"], 1);
	lineShader = new Shader(gl, vertLineShader, fragLineShader);
	renderShader = new Shader(gl, vertRenderShader, fragRenderShader);
	renderShader.use(gl)
	gl.uniform1i(renderShader.uniforms["volume"], 0);
	gl.uniform1i(renderShader.uniforms["colormap"], 1);
} // init()

export function updateGLVolume(gl, overlayItem) { //load volume or change contrast
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
	drawSlices(gl, overlayItem)
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

function sliceScale(gl, overlayItem) {
	var hdr = overlayItem.volume.hdr
	//console.log("viewport (w,h):", gl.canvas.width, gl.canvas.height)
	var dims = [1.0, hdr.dims[1] * hdr.pixDims[1], hdr.dims[2] * hdr.pixDims[2], hdr.dims[3] * hdr.pixDims[3]];
	var longestAxis = Math.max(dims[1], Math.max(dims[2], dims[3]));
	var volScale = [dims[1] / longestAxis, dims[2] / longestAxis, dims[3] / longestAxis];
	//console.log("volScale (x,y,z):", volScale)
	var AR = [gl.canvas.clientHeight / gl.canvas.clientWidth, 1.0];
	if (AR[0] > 1.0) {
		AR[1] = gl.canvas.clientWidth / gl.canvas.clientHeight;
		AR[0] = 1.0;
	}
	//console.log("Canvas aspect ratio (x,y):", AR[0], AR[1])
	var vox = [hdr.dims[1], hdr.dims[2], hdr.dims[3]];
	return { volScale, AR, vox }
} // sliceScale()

export function mouseClick(gl, overlayItem, x, y) {
	if (sliceType === sliceTypeRender)
		return
	//console.log("Click pixels (x,y):", x, y);
	let {volScale, AR} = sliceScale(gl, overlayItem);
	if ((numScreenSlices < 1) || (gl.canvas.height < 1) || (AR[0] <= 0) || (AR[1] <= 0) || (volScale[0] <= 0) || (volScale[1] <= 0) || (volScale[2] <= 0)) 		return;
	//mouse click X,Y in screen coordinates, origin at top left
	// webGL clip space L,R,T,B = [-1, 1, 1, 1]
	// n.b. webGL Y polarity reversed
	// https://webglfundamentals.org/webgl/lessons/webgl-fundamentals.html
	var glx = ((x / gl.canvas.width) - 0.5) * 2.0;
	var gly = (((gl.canvas.height - y) / (gl.canvas.height)) - 0.5) * 2.0;
	//console.log("Click clip space (x,y):", glx, gly);
	for (let i = 0; i < numScreenSlices; i++) {
		var axCorSag = screenSlices[i].axCorSag;
		if (axCorSag > sliceTypeSagittal) continue;
		var lbwh = screenSlices[i].leftBottomWidthHeight;
		var fracX = (glx - lbwh[0]) / lbwh[2];
		var fracY = (gly - lbwh[1]) / lbwh[3];
		if ((fracX >= 0.0) && (fracX < 1.0) && (fracY >= 0.0) && (fracY < 1.0)) { //user clicked on slice i
			if (axCorSag === sliceTypeAxial) {
				crosshairPos[0] = fracX;
				crosshairPos[1] = fracY;
			}
			if (axCorSag === sliceTypeCoronal) {
				crosshairPos[0] = fracX;
				crosshairPos[2] = fracY;
			}
			if (axCorSag === sliceTypeSagittal) {
				crosshairPos[1] = fracX;
				crosshairPos[2] = fracY;
			}
			drawSlices(gl, overlayItem);
			return;
		} //if click in slice i
	} //for i: each slice on screen
} // mouseClick()

function draw2D(gl, leftBottomWidthHeight, axCorSag) {
	var crossXYZ = [crosshairPos[0], crosshairPos[1],crosshairPos[2]]; //axial: width=i, height=j, slice=k
	if (axCorSag === 1)
		crossXYZ = [crosshairPos[0], crosshairPos[2],crosshairPos[1]]; //coronal: width=i, height=k, slice=j
	if (axCorSag === 2)
		crossXYZ = [crosshairPos[1], crosshairPos[2],crosshairPos[0]]; //sagittal: width=j, height=k, slice=i
	sliceShader.use(gl);
	gl.uniform1i(sliceShader.uniforms["axCorSag"], axCorSag);
	gl.uniform1f(sliceShader.uniforms["slice"], crossXYZ[2]);
	gl.uniform4f(sliceShader.uniforms["leftBottomWidthHeight"], leftBottomWidthHeight[0], leftBottomWidthHeight[1], leftBottomWidthHeight[2], leftBottomWidthHeight[3]);
	gl.drawArrays(gl.TRIANGLE_STRIP, 5, 4);
	//record screenSlices to detect mouse click positions
	screenSlices[numScreenSlices].leftBottomWidthHeight = leftBottomWidthHeight;
	screenSlices[numScreenSlices].axCorSag = axCorSag;
	numScreenSlices += 1;
	if (crosshairWidth <= 0.0) return;
	lineShader.use(gl)
	gl.uniform4fv(lineShader.uniforms["lineColor"], crosshairColor);
	//vertical line of crosshair:
	var left = leftBottomWidthHeight[0] + (leftBottomWidthHeight[2] * crossXYZ[0]);
	gl.uniform4f(lineShader.uniforms["leftBottomWidthHeight"], left - crosshairWidth, leftBottomWidthHeight[1],  crosshairWidth, leftBottomWidthHeight[3]);
	gl.drawArrays(gl.TRIANGLE_STRIP, 5, 4);
	//horizontal line of crosshair:
	var bottom = leftBottomWidthHeight[1] + (leftBottomWidthHeight[3] * crossXYZ[1]);
	gl.uniform4f(lineShader.uniforms["leftBottomWidthHeight"], leftBottomWidthHeight[0], bottom - crosshairWidth, leftBottomWidthHeight[2], crosshairWidth);
	gl.drawArrays(gl.TRIANGLE_STRIP, 5, 4);
}

function draw3D(gl, overlayItem) {
	/* eslint-disable */
	let {volScale, AR, vox} = sliceScale(gl, overlayItem);
	/* eslint-enable */
	renderShader.use(gl);
	if (gl.canvas.width < gl.canvas.height) // screen aspect ratio
			gl.viewport(0, (gl.canvas.height - gl.canvas.width)* 0.5, gl.canvas.width, gl.canvas.width);
	else
		gl.viewport((gl.canvas.width - gl.canvas.height)* 0.5, 0, gl.canvas.height, gl.canvas.height);
	gl.clearColor(0.2, 0, 0, 1);
	var m = mat.mat4.create();
	var fDistance = -0.54;
	//modelMatrix *= TMat4.Translate(0, 0, -fDistance);
	mat.mat4.translate(m,m, [0, 0, fDistance]);
	// https://glmatrix.net/docs/module-mat4.html  https://glmatrix.net/docs/mat4.js.html
	var rad = (90-renderElevation-volScale[0]) * Math.PI / 180;
	mat.mat4.rotate(m,m, rad, [-1, 0, 0]);
	rad = (renderAzimuth) * Math.PI / 180;
	mat.mat4.rotate(m,m, rad, [0, 0, 1]);
	mat.mat4.scale(m, m, volScale); // volume aspect ratio
	//compute ray direction
	var inv = mat.mat4.create();
	mat.mat4.invert(inv, m);
	var rayDir4 = mat.vec4.fromValues(0,0,-1,1);
	mat.vec4.transformMat4(rayDir4, rayDir4, inv);
	var rayDir = mat.vec3.fromValues(rayDir4[0],rayDir4[1],rayDir4[2]);
	mat.vec3.normalize(rayDir, rayDir);
	//defuzz
	const tiny = 0.00001;
	if (Math.abs(rayDir[0]) < tiny) rayDir[0] = tiny;
	if (Math.abs(rayDir[1]) < tiny) rayDir[1] = tiny;
	if (Math.abs(rayDir[2]) < tiny) rayDir[2] = tiny;
	//console.log( ">>", renderAzimuth, " : ", renderElevation, ">>>> ", rayDir);
	//gl.disable(gl.DEPTH_TEST);
	//gl.enable(gl.CULL_FACE);
	//gl.cullFace(gl.FRONT);
	gl.uniformMatrix4fv(renderShader.uniforms["mvpMtx"], false, m);
	gl.uniform3fv(renderShader.uniforms["rayDir"], rayDir);
	gl.uniform3fv(renderShader.uniforms["texVox"], vox);
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 14);//cube is 12 triangles, triangle-strip creates n-2 triangles
	let posString = 'azimuth: ' + renderAzimuth.toFixed(0)+' elevation: '+renderElevation.toFixed(0);
	bus.$emit('crosshair-pos-change', posString);
	return posString;
}

function frac2mm(overlayItem) {
	//compute crosshair in mm, not fractions:
	let pos = mat.vec4.fromValues(crosshairPos[0],crosshairPos[1],crosshairPos[2],1);
	let d = overlayItem.volume.hdr.dims;
	let dim = mat.vec4.fromValues(d[1], d[2], d[3], 1); 
	let sf = overlayItem.volume.hdr.affine;
	let sform = mat.mat4.fromValues(
		sf[0][0], sf[1][0], sf[2][0], sf[3][0],
		sf[0][1], sf[1][1], sf[2][1], sf[3][1],
		sf[0][2], sf[1][2], sf[2][2], sf[3][2],
		sf[0][3], sf[1][3], sf[2][3], sf[3][3]);
	mat.vec4.mul(pos, pos, dim);
	let shim = mat.vec4.fromValues(-0.5, -0.5, -0.5, 0); //bitmap with 5 voxels scaled 0..1, voxel centers are 0.1,0.3,0.5,0.7,0.9 
	mat.vec4.add(pos, pos, shim);
	mat.vec4.transformMat4(pos, pos, sform);
	return pos;
} // frac2mm()

export function drawSlices(gl, overlayItem) {
	//console.log(overlayItem.volumeURL);
	gl.clearColor(backColor[0], backColor[1], backColor[2], backColor[3]);
	gl.clear(gl.COLOR_BUFFER_BIT);
	if (sliceType === sliceTypeRender) //draw rendering
		return draw3D(gl, overlayItem);
	let {volScale, AR} = sliceScale(gl, overlayItem);
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	var w = volScale[0] * AR[0];
	var h = volScale[1] * AR[1];
	numScreenSlices = 0;
	screenSlices[0].leftBottomWidthHeight = [w,h,0,0,0];
	if (sliceType === sliceTypeAxial) { //draw axial
		draw2D(gl, [-w, -h, w*2, h*2], 0);
	} else if (sliceType === sliceTypeCoronal) { //draw coronal
		w = volScale[0] * AR[0];
		h = volScale[2] * AR[1];
		draw2D(gl, [-w, -h, w * 2, h * 2], 1)
	} else if (sliceType === sliceTypeSagittal) { //draw sagittal
		w = volScale[1] * AR[0];
		h = volScale[2] * AR[1];
		draw2D(gl, [-w, -h, w * 2, h * 2], 2);
	} else { //sliceTypeMultiplanar
		//draw axial
		draw2D(gl, [-w, -h, w, h], 0);
		//draw coronal
		w = volScale[0] * AR[0];
		h = volScale[2] * AR[1];
		draw2D(gl, [-w, 0, w, h], 1);
		//draw sagittal
		w = volScale[1] * AR[0];
		h = volScale[2] * AR[1];
		draw2D(gl, [0, 0, w, h], 2);
	}
	gl.finish();
	let pos = frac2mm(overlayItem);
	let posString = pos[0].toFixed(2)+'×'+pos[1].toFixed(2)+'×'+pos[2].toFixed(2);
	// temporary event bus mechanism. It uses Vue, but it would be ideal to divorce vue from this gl code.
	bus.$emit('crosshair-pos-change', posString);
	return posString
} // drawSlices()

