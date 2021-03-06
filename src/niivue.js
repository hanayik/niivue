import * as nii from "nifti-reader-js"
import { Shader } from "./webgl-util/shader.js";
import * as mat from "gl-matrix";
import { vertSliceShader, fragSliceShader } from "./shader-srcs.js";
import { vertLineShader, fragLineShader } from "./shader-srcs.js";
import { vertRenderShader, fragRenderShader } from "./shader-srcs.js";
import { vertColorbarShader, fragColorbarShader } from "./shader-srcs.js";
import { vertFontShader, fragFontShader } from "./shader-srcs.js";

import {bus} from "@/bus.js"

export var textHeight = 0.03; //0 for no text, fraction of canvas height
export var colorbarHeight = 0.05; //0 for no colorbars, fraction of NIfTI j dimension
export var crosshairWidth = 1; //0 for no crosshairs, pixels
export var backColor =  [0, 0, 0, 1];
export const sliceTypeAxial = 0;
export const sliceTypeCoronal = 1;
export const sliceTypeSagittal = 2;
export const sliceTypeMultiplanar = 3;
export const sliceTypeRender = 4;
export var sliceType = sliceTypeMultiplanar; //view: axial, coronal, sagittal, multiplanar or render
export var renderAzimuth = 120;
export var renderElevation = 15;
export var crosshairPos = [0.5, 0.5, 0.5];
export var overlays = 1; //number of loaded overlays _DEMO_: 0
export var clipPlane = [0, 0, 0, 0]; //x,y,z and depth of clip plane _DEMO_: [0.5, 0.5, 0.0, 2.0]
export var isRadiologicalConvention = false;

var crosshairColor =  [1, 0, 0, 1];
var volScaleMultiplier = 1;
var _overlayItem = null
var colorBarMargin = 0.05

var colormapTexture = null
var volumeTexture = null
var overlayTexture = null
var sliceShader = null //program for 2D slice views
var lineShader = null //program for cross-hairs
var renderShader = null //program for 3D views
var colorbarShader = null //program for 3D views
var fontShader = null //program for displaying text
var fontMets = null //position/height/width of each character in font texture
var mousePos = [0,0];
var numScreenSlices = 0; //e.g. for multiplanar view, 3 simultaneous slices: axial, coronal, sagittal
var screenSlices = [ //location and type of each 2D slice on screen, allows clicking to detect position
  {leftTopWidthHeight: [1, 0, 0, 1], axCorSag: sliceTypeAxial},
  {leftTopWidthHeight: [1, 0, 0, 1], axCorSag: sliceTypeAxial},
  {leftTopWidthHeight: [1, 0, 0, 1], axCorSag: sliceTypeAxial},
  {leftTopWidthHeight: [1, 0, 0, 1], axCorSag: sliceTypeAxial}
];
var sliceOpacity = 1.0

bus.$on('colormap-change', function (selectedColorMap) {
    selectColormap(getGL(), selectedColorMap)
    drawSlices(getGL(), _overlayItem)
});

function arrayEquals(a, b) {
  return Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length &&
    a.every((val, index) => val === b[index]);
}

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

export function clipPlaneMove(newPlane) {
	if (sliceType != sliceTypeRender) return;
  clipPlane = newPlane
	drawSlices(getGL(), _overlayItem) //_overlayItem is local to niivue.js and is set in loadVolume()
} // clipPlaneMove

export function setCrosshairColor(color) {
  crosshairColor = color
  drawSlices(getGL(), _overlayItem) //_overlayItem is local to niivue.js and is set in loadVolume()
} // setCrosshairColor()

export function sliceScroll2D(posChange, x, y, isDelta=true) {
  if (sliceType === sliceTypeMultiplanar){
    //mouseMPScroll(posChange, x, y) // not working when mouse over axial or Sag slices (works over Cor for some reason)
    return
  }
  var idx
  if (sliceType == sliceTypeAxial) idx = 2;
  if (sliceType == sliceTypeSagittal) idx = 0;
  if (sliceType == sliceTypeCoronal) idx = 1;
  if (isDelta){
    var posNow = crosshairPos[idx]
    var posFuture = posNow + posChange
    if (posFuture > 1) posFuture = 1;
    if (posFuture < 0) posFuture = 0;
    crosshairPos[idx] = posFuture
  } else {
    crosshairPos[idx] = posChange
  }
  drawSlices(getGL(), _overlayItem) //_overlayItem is local to niivue.js and is set in loadVolume()
} // sliceScroll2D()

export function setSliceType(st) {
  sliceType = st
  drawSlices(getGL(), _overlayItem) //_overlayItem is local to niivue.js and is set in loadVolume()
} // setSliceType()

export function setSliceOpacity(op) {
  sliceOpacity = op
  drawSlices(getGL(), _overlayItem) //_overlayItem is local to niivue.js and is set in loadVolume()
} // setSliceOpacity()

export function setScale(scale) {
  volScaleMultiplier = scale
  drawSlices(getGL(), _overlayItem) //_overlayItem is local to niivue.js and is set in loadVolume()
} // setScale()

export function getGL() {
	var gl = document.querySelector("#gl").getContext("webgl2");
	if (!gl)
		return null;
	return gl;
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

function overlayRGBA(overlayItem) {
	let hdr = overlayItem.volume.hdr;
	let vox = hdr.dims[1] * hdr.dims[2] * hdr.dims[3];
	let imgRGBA = new Uint8ClampedArray(vox * 4);
	let radius = 0.2 * Math.min(Math.min(hdr.dims[1], hdr.dims[2]), hdr.dims[3]);
	let halfX = 0.5 * hdr.dims[1];
	let halfY = 0.5 * hdr.dims[2];
	let halfZ = 0.5 * hdr.dims[3];
	let j = 0;
	for (let z = 0; z < hdr.dims[3]; z++) {
		for (let y = 0; y < hdr.dims[2]; y++) {
			for (let x = 0; x < hdr.dims[1]; x++) {
				let dx = (Math.abs(x - halfX));
				let dy = (Math.abs(y - halfY));
				let dz = (Math.abs(z - halfZ));
				let dist = Math.sqrt(dx*dx + dy*dy + dz * dz);
				let v = 0;
				if (dist < radius) v = 255;
				imgRGBA[j] = 0; //Red
				j++;
				imgRGBA[j] = v; //Green
				j++;
				imgRGBA[j] = 0; //Blue
				j++;
				imgRGBA[j] = v * 0.5; //Alpha
				j++;
			}
		}
	}
	return imgRGBA;
} // overlayRGBA()

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

function reorient(hdr) {
// port of Matlab reorient() https://github.com/xiangruili/dicm2nii/blob/master/nii_viewer.m
// not elegant, as JavaScript arrays are always 1D
	let a = hdr.affine;
	let absR = mat.mat3.fromValues(Math.abs(a[0][0]),Math.abs(a[0][1]),Math.abs(a[0][2]), Math.abs(a[1][0]),Math.abs(a[1][1]),Math.abs(a[1][2]), Math.abs(a[2][0]),Math.abs(a[2][1]),Math.abs(a[2][2]));
	//mat.mat3.transpose(A,A);
	//first column = x
	let ixyz = [1, 1, 1];
    if (absR[3] > absR[0]) ixyz[0] = 2;//(absR[1][0] > absR[0][0]) ixyz[0] = 2;
    if ((absR[6] > absR[0]) && (absR[6]> absR[3])) ixyz[0] = 3;//((absR[2][0] > absR[0][0]) && (absR[2][0]> absR[1][0])) ixyz[0] = 3;
    ixyz[1] = 1;
    if (ixyz[0] === 1) {
		if (absR[4] > absR[7]) //(absR[1][1] > absR[2][1])
			ixyz[1] = 2
		else
			ixyz[1] = 3;
	} else if (ixyz[0] === 2) {
       if  (absR[1] > absR[7])//(absR[0][1] > absR[2][1])
          ixyz[1] = 1
       else
           ixyz[1] = 3;
    } else {
       if (absR[1] > absR[4])//(absR[0][1] > absR[1][1])
          ixyz[1] = 1
       else
           ixyz[1] = 2;
    }
    //third column = z: constrained as x+y+z = 1+2+3 = 6
    ixyz[2] = 6 - ixyz[1] - ixyz[0];
	let perm = [1,2,3];
    perm[ixyz[0]-1] = 1;
    perm[ixyz[1]-1] = 2;
    perm[ixyz[2]-1] = 3;
	let rotM = mat.mat4.fromValues(a[0][0],a[0][1],a[0][2],a[0][3], a[1][0],a[1][1],a[1][2],a[1][3], a[2][0],a[2][1],a[2][2],a[2][3], 0,0,0,1);
	let R = mat.mat4.create();
	mat.mat4.copy(R, rotM);
	for (let i = 0; i < 3; i++)
		for (let j = 0; j < 3; j++)
			R[(i*4)+j] =  rotM[(i*4)+perm[j]-1] ;//rotM[i+(4*(perm[j]-1))];//rotM[i],[perm[j]-1];
	let flip = [0, 0, 0];
    if (R[0] < 0) flip[0] = 1; //R[0][0]
    if (R[5] < 0) flip[1] = 1; //R[1][1]
    if (R[10] < 0) flip[2] = 1; //R[2][2]
	let requiresRot = false;
	if (arrayEquals(perm, [1,2,3]) && arrayEquals(flip, [0,0,0]))
		return {perm, R, requiresRot};
	requiresRot = true;
	mat.mat4.identity(rotM);
    rotM[0+(0 * 4)] = 1-flip[0]*2;
    rotM[1+(1 * 4)] = 1-flip[1]*2;
    rotM[2+(2 * 4)] = 1-flip[2]*2;
    rotM[3+(0*4)] = ((hdr.dims[perm[0]])-1) * flip[0];
    rotM[3+(1*4)] = ((hdr.dims[perm[1]])-1) * flip[1];
	rotM[3+(2*4)] = ((hdr.dims[perm[2]])-1) * flip[2];
	let residualR = mat.mat4.create();
	mat.mat4.invert(residualR, rotM);
	mat.mat4.multiply(residualR, residualR, R);
	for (let i = 0; i < 3; i++)
		if (flip[i] !== 0) perm[i] = -perm[i];
    return {perm, residualR, requiresRot};
} // reorient()

function reorientVolume(hdr, img) {
	//rotate 3D volume to match approximately match RAS
	//lots of room for speed/memory opitmization, e.g. LAS -> RAS all in plane
	let {perm, residualR, requiresRot} = reorient(hdr);
	if (!requiresRot) return; //already rotated
	console.log("FLIP!");
	var imgRaw = null
	if (hdr.datatypeCode === 2) //data already uint8
		imgRaw = new Uint8Array(img);
	else if (hdr.datatypeCode === 4)
		imgRaw = new Int16Array(img);
	else if (hdr.datatypeCode === 16)
		imgRaw = new Float32Array(img);
	else if (hdr.datatypeCode === 512)
		imgRaw = new Uint16Array(img);
	let aperm = [Math.abs(perm[0]), Math.abs(perm[1]), Math.abs(perm[2])];
	let outdim = [hdr.dims[aperm[0]], hdr.dims[aperm[1]], hdr.dims[aperm[2]] ];
	let inRaw = [...imgRaw];
	let inStep = [1, hdr.dims[1], hdr.dims[1] * hdr.dims[2]]; //increment i,j,k
	let outStep = [inStep[aperm[0]-1], inStep[aperm[1]-1], inStep[aperm[2]-1] ];
	let outStart = [0,0,0];
	for (let p = 0; p < 3; p++) { //flip dimensions
		if (perm[p] < 0) {
			outStart[p] = (outStep[p] * (outdim[p] - 1));
			outStep[p] = -outStep[p];
		}
	}
	let j = 0;
	for (let z = 0; z < outdim[2]; z++) {
		let zi = outStart[2] + (z * outStep[2]);
		for (let y = 0; y < outdim[1]; y++) {
			let yi = outStart[1] + (y * outStep[1]);
			for (let x = 0; x < outdim[0]; x++) {
				let xi = outStart[0] + (x * outStep[0]);
				imgRaw[j] = inRaw[xi+yi+zi];
				j ++;
			} //for x
		} //for y
	} //for z
	hdr.dims[1] = outdim[0];
	hdr.dims[2] = outdim[1];
	hdr.dims[3] = outdim[2];
	let outpix = [hdr.pixDims[aperm[0]], hdr.pixDims[aperm[1]], hdr.pixDims[aperm[2]] ];
	hdr.pixDims[1] = outpix[0];
	hdr.pixDims[2] = outpix[1];
	hdr.pixDims[3] = outpix[2];
	hdr.affine[0] = [residualR[0], residualR[1], residualR[2], residualR[3] ];
	hdr.affine[1] = [residualR[4], residualR[5], residualR[6], residualR[7] ];
	hdr.affine[2] = [residualR[8], residualR[9], residualR[10], residualR[11] ];
} // reorientVolume()

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
			reorientVolume(hdr, img);
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

var loadPng = function(gl, pngName) {
	var pngImage = null;
	pngImage = new Image();
	pngImage.onload = function() {
		//console.log("PNG resolution ", pngImage.width, ",", pngImage.height);
		var pngTexture = gl.createTexture();
		gl.activeTexture(gl.TEXTURE3);
		gl.bindTexture(gl.TEXTURE_2D, pngTexture);
		// Set the parameters so we can render any size image.
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		// Upload the image into the texture.
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, pngImage);
	}
	pngImage.src = pngName;  // MUST BE SAME DOMAIN!!!
	//console.log("loading PNG ", pngName);
} // loadPng()

async function initText(gl) {
	//load bitmap
	await loadPng(gl, 'fnt.png');
	//create font metrics
	fontMets = [];
	for (let id = 0; id < 256; id++) { //clear ASCII codes 0..256
		fontMets[id] = {};
		fontMets[id].xadv = 0;
		fontMets[id].uv_lbwh = [0, 0, 0, 0];
		fontMets[id].lbwh = [0, 0, 0, 0];
	}
	//load metrics values: may only sparsely describe range 0..255
	var metrics = [];
	async function fetchMetrics() {
		const response = await fetch('./fnt.json');
		metrics = await response.json();
	}
	await fetchMetrics();
	fontMets.distanceRange = metrics.atlas.distanceRange;
	fontMets.size = metrics.atlas.size;
	let scaleW = metrics.atlas.width;
	let scaleH = metrics.atlas.height;
	for (let i = 0; i < metrics.glyphs.length; i++) {
		let glyph = metrics.glyphs[i];
		let id = glyph.unicode;
		fontMets[id].xadv = glyph.advance;
		if (glyph.planeBounds  === undefined) continue;
		let l = glyph.atlasBounds.left / scaleW;
		let b = ((scaleH - glyph.atlasBounds.top) / scaleH);
		let w = (glyph.atlasBounds.right - glyph.atlasBounds.left) / scaleW;
		let h = (glyph.atlasBounds.top - glyph.atlasBounds.bottom) / scaleH;
		fontMets[id].uv_lbwh = [l, b, w, h];
		l = glyph.planeBounds.left;
		b = glyph.planeBounds.bottom;
		w = glyph.planeBounds.right - glyph.planeBounds.left;
		h = glyph.planeBounds.top - glyph.planeBounds.bottom;
		fontMets[id].lbwh = [l, b, w, h];
	}
} // initText()

export async function init(gl) {
	//initial setup: only at the startup of the component
	sliceShader = new Shader(gl, vertSliceShader, fragSliceShader);
	sliceShader.use(gl);
	gl.uniform1i(sliceShader.uniforms["volume"], 0);
	gl.uniform1i(sliceShader.uniforms["colormap"], 1);
	gl.uniform1i(sliceShader.uniforms["overlay"], 2);
	lineShader = new Shader(gl, vertLineShader, fragLineShader);
	renderShader = new Shader(gl, vertRenderShader, fragRenderShader);
	renderShader.use(gl);
	gl.uniform1i(renderShader.uniforms["volume"], 0);
	gl.uniform1i(renderShader.uniforms["colormap"], 1);
	gl.uniform1i(renderShader.uniforms["overlay"], 2);
	colorbarShader = new Shader(gl, vertColorbarShader, fragColorbarShader);
	colorbarShader.use(gl);
	gl.uniform1i(colorbarShader.uniforms["colormap"], 1);
	//multi-channel signed distance font https://github.com/Chlumsky/msdfgen
	fontShader = new Shader(gl, vertFontShader, fragFontShader);
	fontShader.use(gl);
	gl.uniform1i(fontShader.uniforms["fontTexture"], 3);
	await initText(gl);
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
	var hdr = overlayItem.volume.hdr
	var img = overlayItem.volume.img
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
	//overlay texture
	let imgRGBA8 = overlayRGBA(overlayItem)
	if (overlayTexture)
		gl.deleteTexture(overlayTexture);
	overlayTexture = gl.createTexture();
	gl.activeTexture(gl.TEXTURE2);
	gl.bindTexture(gl.TEXTURE_3D, overlayTexture);
	gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
	gl.texStorage3D(gl.TEXTURE_3D, 4, gl.RGBA8, hdr.dims[1], hdr.dims[2], hdr.dims[3]);
	gl.texSubImage3D(gl.TEXTURE_3D, 0, 0, 0, 0, hdr.dims[1], hdr.dims[2], hdr.dims[3], gl.RGBA, gl.UNSIGNED_BYTE, imgRGBA8);
	drawSlices(gl, overlayItem)
} // updateVolume()

export function selectColormap(gl, lutName = "") {
	var lut = makeLut([0, 255], [0, 255], [0, 255], [0, 128], [0, 255]); //gray
	if (lutName === "Winter")
		lut = makeLut([0, 0, 0], [0, 128, 255], [255, 196, 128], [0, 64, 128], [0, 128, 255]); //winter
	if (lutName === "Warm")
		lut = makeLut([255, 255, 255], [127, 196, 254], [0, 0, 0], [0, 64, 128], [0, 128, 255]); //warm
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
	console.log("set colormap", lutName)
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
	volScale = volScale.map(function(v) {return v * volScaleMultiplier;})
	var vox = [hdr.dims[1], hdr.dims[2], hdr.dims[3]];
	return { volScale, vox }
} // sliceScale()

export function mouseMPScroll(scrollVal, x, y) {
  var gl = getGL()
  var overlayItem = _overlayItem
	if (sliceType === sliceTypeRender)
		return
	//console.log("Click pixels (x,y):", x, y);
	if ((numScreenSlices < 1) || (gl.canvas.height < 1) || (gl.canvas.width < 1))
		return;
	//mouse click X,Y in screen coordinates, origin at top left
	// webGL clip space L,R,T,B = [-1, 1, 1, 1]
	// n.b. webGL Y polarity reversed
	// https://webglfundamentals.org/webgl/lessons/webgl-fundamentals.html
	for (let i = 0; i < numScreenSlices; i++) {
		var axCorSag = screenSlices[i].axCorSag;
		if (axCorSag > sliceTypeSagittal) continue;
		var ltwh = screenSlices[i].leftTopWidthHeight;
		let isMirror = false;
		if (ltwh[2] < 0) {
			isMirror = true;
			ltwh[0] += ltwh[2];
			ltwh[2] = - ltwh[2];
		}
		var fracX = (x - ltwh[0]) / ltwh[2];
		if (isMirror) fracX = 1.0 - fracX;
		var fracY = 1.0 - ((y - ltwh[1]) / ltwh[3]);

		if ((fracX >= 0.0) && (fracX < 1.0) && (fracY >= 0.0) && (fracY < 1.0)) { //user clicked on slice i
      var posNow = crosshairPos[axCorSag]
      var posFuture = posNow + scrollVal
      if (posFuture > 1) posFuture = 1;
      if (posFuture < 0) posFuture = 0;
			if (axCorSag === sliceTypeAxial) {
				//crosshairPos[0] = fracX;
				//crosshairPos[1] = fracY;
        crosshairPos[2] = posFuture
			}
			if (axCorSag === sliceTypeCoronal) {
				//crosshairPos[0] = fracX;
				//crosshairPos[2] = fracY;
        crosshairPos[1] = posFuture
			}
			if (axCorSag === sliceTypeSagittal) {
				//crosshairPos[1] = fracX;
				//crosshairPos[2] = fracY;
        crosshairPos[0] = posFuture
			}
			drawSlices(gl, overlayItem);
			return;
		} //if click in slice i
	} //for i: each slice on screen
} // mouseMPScroll()


export function mouseClick(gl, overlayItem, x, y) {
	if (sliceType === sliceTypeRender)
		return
	//console.log("Click pixels (x,y):", x, y);
	if ((numScreenSlices < 1) || (gl.canvas.height < 1) || (gl.canvas.width < 1))
		return;
	//mouse click X,Y in screen coordinates, origin at top left
	// webGL clip space L,R,T,B = [-1, 1, 1, 1]
	// n.b. webGL Y polarity reversed
	// https://webglfundamentals.org/webgl/lessons/webgl-fundamentals.html
	for (let i = 0; i < numScreenSlices; i++) {
		var axCorSag = screenSlices[i].axCorSag;
		if (axCorSag > sliceTypeSagittal) continue;
		var ltwh = screenSlices[i].leftTopWidthHeight;
		let isMirror = false;
		if (ltwh[2] < 0) {
			isMirror = true;
			ltwh[0] += ltwh[2];
			ltwh[2] = - ltwh[2];
		}
		var fracX = (x - ltwh[0]) / ltwh[2];
		if (isMirror) fracX = 1.0 - fracX;
		var fracY = 1.0 - ((y - ltwh[1]) / ltwh[3]);
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

function drawColorbar(gl, leftTopWidthHeight) {
	if ((leftTopWidthHeight[2] <= 0) || (leftTopWidthHeight[3] <= 0))
		return;
	//console.log("bar:", leftTopWidthHeight[0], leftTopWidthHeight[1], leftTopWidthHeight[2], leftTopWidthHeight[3]);
	if (crosshairWidth > 0) {
		//gl.disable(gl.DEPTH_TEST);
		lineShader.use(gl)
		gl.uniform4fv(lineShader.uniforms["lineColor"], crosshairColor);
		gl.uniform2fv(lineShader.uniforms["canvasWidthHeight"], [gl.canvas.width, gl.canvas.height]);
		let ltwh = [leftTopWidthHeight[0]-1, leftTopWidthHeight[1]-1, leftTopWidthHeight[2]+2, leftTopWidthHeight[3]+2];
		gl.uniform4f(lineShader.uniforms["leftTopWidthHeight"], ltwh[0], ltwh[1], ltwh[2], ltwh[3]);
		gl.drawArrays(gl.TRIANGLE_STRIP, 5, 4);
	}
	colorbarShader.use(gl);
	gl.uniform2fv(colorbarShader.uniforms["canvasWidthHeight"], [gl.canvas.width, gl.canvas.height]);
	gl.uniform4f(colorbarShader.uniforms["leftTopWidthHeight"], leftTopWidthHeight[0], leftTopWidthHeight[1], leftTopWidthHeight[2], leftTopWidthHeight[3]);
	gl.drawArrays(gl.TRIANGLE_STRIP, 5, 4);
	//gl.enable(gl.DEPTH_TEST);
} // drawColorbar()

function textWidth(scale, str) {
	let w = 0;
	var bytes = new Buffer(str);
	for (let i = 0; i < str.length; i++)
		w += scale * fontMets[bytes[i]].xadv;
	return w;
} // textWidth()

function drawChar(gl, xy, scale, char) { //draw single character, never call directly: ALWAYS call from drawText()
	let metrics = fontMets[char];
	let l = xy[0] + (scale * metrics.lbwh[0]);
	let b = -(scale * metrics.lbwh[1]);
	let w = (scale * metrics.lbwh[2]);
	let h = (scale * metrics.lbwh[3]);
	let t = xy[1] + (b - h) + scale;
	gl.uniform4f(fontShader.uniforms["leftTopWidthHeight"], l, t, w, h);
	gl.uniform4fv(fontShader.uniforms["uvLeftTopWidthHeight"], metrics.uv_lbwh);
	gl.drawArrays(gl.TRIANGLE_STRIP, 5, 4);
	return scale * metrics.xadv;
} // drawChar()

function drawText(gl, xy, str) { //to right of x, vertically centered on y
	if (textHeight <= 0) return;
	fontShader.use(gl);
	let scale = (textHeight * gl.canvas.height);
	gl.uniform2f(fontShader.uniforms["canvasWidthHeight"], gl.canvas.width, gl.canvas.height);
	gl.uniform4fv(fontShader.uniforms["fontColor"], crosshairColor);
	let screenPxRange = scale / fontMets.size * fontMets.distanceRange;
	screenPxRange = Math.max(screenPxRange, 1.0) //screenPxRange() must never be lower than 1
	gl.uniform1f(fontShader.uniforms["screenPxRange"], screenPxRange);
	var bytes = new Buffer(str);
	for (let i = 0; i < str.length; i++)
		xy[0] += drawChar(gl, xy, scale, bytes[i]);
} // drawText()

function drawTextRight(gl, xy, str) { //to right of x, vertically centered on y
	if (textHeight <= 0) return;
	fontShader.use(gl)
	xy[1] -= (0.5 * textHeight * gl.canvas.height);
	drawText(gl, xy, str)
} // drawText()

function drawTextBelow(gl, xy, str) { //horizontally centered on x, below y
	if (textHeight <= 0) return;
	fontShader.use(gl)
	let scale = (textHeight * gl.canvas.height);
	xy[0] -= 0.5 * textWidth(scale, str);
	drawText(gl, xy, str)
} // drawTextBelow()

function draw2D(gl, leftTopWidthHeight, axCorSag) {
	var crossXYZ = [crosshairPos[0], crosshairPos[1],crosshairPos[2]]; //axial: width=i, height=j, slice=k
	if (axCorSag === sliceTypeCoronal)
		crossXYZ = [crosshairPos[0], crosshairPos[2],crosshairPos[1]]; //coronal: width=i, height=k, slice=j
	if (axCorSag === sliceTypeSagittal)
		crossXYZ = [crosshairPos[1], crosshairPos[2],crosshairPos[0]]; //sagittal: width=j, height=k, slice=i
	let isMirrorLR = ((isRadiologicalConvention) && (axCorSag < sliceTypeSagittal))
	sliceShader.use(gl);
	gl.uniform1f(sliceShader.uniforms["opacity"], sliceOpacity);
	gl.uniform1i(sliceShader.uniforms["axCorSag"], axCorSag);
	gl.uniform1f(sliceShader.uniforms["slice"], crossXYZ[2]);
	gl.uniform2fv(sliceShader.uniforms["canvasWidthHeight"], [gl.canvas.width, gl.canvas.height]);
	if (isMirrorLR) {
		gl.disable(gl.CULL_FACE);
		leftTopWidthHeight[2] = - leftTopWidthHeight[2];
		leftTopWidthHeight[0] = leftTopWidthHeight[0] - leftTopWidthHeight[2];
	}
	gl.uniform4f(sliceShader.uniforms["leftTopWidthHeight"], leftTopWidthHeight[0], leftTopWidthHeight[1], leftTopWidthHeight[2], leftTopWidthHeight[3]);
	//console.log(leftTopWidthHeight);
	//gl.uniform4f(sliceShader.uniforms["leftTopWidthHeight"], leftTopWidthHeight[0], leftTopWidthHeight[1], leftTopWidthHeight[2], leftTopWidthHeight[3]);
	//gl.drawArrays(gl.TRIANGLE_STRIP, 5, 4);
	gl.drawArrays(gl.TRIANGLE_STRIP, 5, 4);
	//record screenSlices to detect mouse click positions
	screenSlices[numScreenSlices].leftTopWidthHeight = leftTopWidthHeight;
	screenSlices[numScreenSlices].axCorSag = axCorSag;
	numScreenSlices += 1;
	if (crosshairWidth <= 0.0) return;
	lineShader.use(gl)
	gl.uniform4fv(lineShader.uniforms["lineColor"], crosshairColor);
	gl.uniform2fv(lineShader.uniforms["canvasWidthHeight"], [gl.canvas.width, gl.canvas.height]);
	//vertical line of crosshair:
	var xleft = leftTopWidthHeight[0] + (leftTopWidthHeight[2] * crossXYZ[0]);
	gl.uniform4f(lineShader.uniforms["leftTopWidthHeight"], xleft - (0.5*crosshairWidth), leftTopWidthHeight[1],  crosshairWidth, leftTopWidthHeight[3]);
	gl.drawArrays(gl.TRIANGLE_STRIP, 5, 4);
	//horizontal line of crosshair:
	var xtop = leftTopWidthHeight[1] + (leftTopWidthHeight[3] * (1.0 - crossXYZ[1]));
	gl.uniform4f(lineShader.uniforms["leftTopWidthHeight"], leftTopWidthHeight[0], xtop - (0.5*crosshairWidth), leftTopWidthHeight[2],  crosshairWidth);
	gl.drawArrays(gl.TRIANGLE_STRIP, 5, 4);
	gl.enable(gl.CULL_FACE);
	if (isMirrorLR)
		drawTextRight(gl, [leftTopWidthHeight[0] +leftTopWidthHeight[2] + 1, leftTopWidthHeight[1] + (0.5 * leftTopWidthHeight[3]) ], "R");
	else if (axCorSag < sliceTypeSagittal)
		drawTextRight(gl, [leftTopWidthHeight[0] + 1, leftTopWidthHeight[1] + (0.5 * leftTopWidthHeight[3]) ], "L");
	if ( axCorSag === sliceTypeAxial)
		drawTextBelow(gl, [leftTopWidthHeight[0] + (0.5 * leftTopWidthHeight[2]), leftTopWidthHeight[1] + 1 ], "A");
	if ( axCorSag > sliceTypeAxial)
		drawTextBelow(gl, [leftTopWidthHeight[0] + (0.5 * leftTopWidthHeight[2]), leftTopWidthHeight[1] + 1 ], "S");
} // draw2D()

function draw3D(gl, overlayItem) {
	let {volScale, vox} = sliceScale(gl, overlayItem);
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
	//defuzz, avoid divide by zero
	const tiny = 0.00001;
	if (Math.abs(rayDir[0]) < tiny) rayDir[0] = tiny;
	if (Math.abs(rayDir[1]) < tiny) rayDir[1] = tiny;
	if (Math.abs(rayDir[2]) < tiny) rayDir[2] = tiny;
	//console.log( ">>", renderAzimuth, " : ", renderElevation, ">>>> ", rayDir);
	//gl.disable(gl.DEPTH_TEST);
	//gl.enable(gl.CULL_FACE);
	//gl.cullFace(gl.FRONT);
	gl.uniformMatrix4fv(renderShader.uniforms["mvpMtx"], false, m);
	gl.uniform1f(renderShader.uniforms["overlays"], overlays);
	gl.uniform4fv(renderShader.uniforms["clipPlane"], clipPlane);
	gl.uniform3fv(renderShader.uniforms["rayDir"], rayDir);
	gl.uniform3fv(renderShader.uniforms["texVox"], vox);
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 14); //cube is 12 triangles, triangle-strip creates n-2 triangles
	let posString = 'azimuth: ' + renderAzimuth.toFixed(0)+' elevation: '+renderElevation.toFixed(0);
	bus.$emit('crosshair-pos-change', posString);
	return posString;
} // draw3D()

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

function scaleSlice(gl, w, h) {
	let scalePix = gl.canvas.clientWidth / w;
	if ((h * scalePix) > gl.canvas.clientHeight)
		scalePix = gl.canvas.clientHeight / h;
	//canvas space is 0,0...w,h with origin at upper left
	let wPix = w * scalePix;
	let hPix = h * scalePix;
	let leftTopWidthHeight = [(gl.canvas.clientWidth-wPix) * 0.5, ((gl.canvas.clientHeight-hPix) * 0.5), wPix, hPix];
	//let leftTopWidthHeight = [(gl.canvas.clientWidth-wPix) * 0.5, 80, wPix, hPix];
	return leftTopWidthHeight;
} // scaleSlice()

export function drawSlices(gl, overlayItem) {
	gl.clearColor(backColor[0], backColor[1], backColor[2], backColor[3]);
	gl.clear(gl.COLOR_BUFFER_BIT);
	if (sliceType === sliceTypeRender) //draw rendering
		return draw3D(gl, overlayItem);
	let {volScale} = sliceScale(gl, overlayItem);
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	numScreenSlices = 0;
	if (sliceType === sliceTypeAxial) { //draw axial
		let leftTopWidthHeight = scaleSlice(gl, volScale[0], volScale[1]);
		draw2D(gl, leftTopWidthHeight, 0);
	} else if (sliceType === sliceTypeCoronal) { //draw coronal
		let leftTopWidthHeight = scaleSlice(gl, volScale[0], volScale[2]);
		draw2D(gl, leftTopWidthHeight, 1);
	} else if (sliceType === sliceTypeSagittal) { //draw sagittal
		let leftTopWidthHeight = scaleSlice(gl, volScale[1], volScale[2]);
		draw2D(gl, leftTopWidthHeight, 2);
	} else { //sliceTypeMultiplanar
		let ltwh = scaleSlice(gl, volScale[0]+volScale[1], volScale[1]+volScale[2]);
		let wX = ltwh[2] * volScale[0]/(volScale[0]+volScale[1]);
		let wY = ltwh[2] - wX;
		let hY = ltwh[3] * volScale[1]/(volScale[1]+volScale[2]);
		let hZ = ltwh[3] - hY;
		//draw axial
		draw2D(gl, [ltwh[0],ltwh[1]+hZ, wX, hY], 0);
		//draw coronal
		draw2D(gl, [ltwh[0],ltwh[1], wX, hZ], 1);
		//draw sagittal
		draw2D(gl, [ltwh[0]+wX,ltwh[1], wY, hZ], 2);
		//draw colorbar (optional)
		var margin = colorBarMargin * hY;
		drawColorbar(gl, [ltwh[0]+wX+margin, ltwh[1] + hZ + margin, wY - margin - margin, hY * colorbarHeight]);
		// drawTextBelow(gl, [ltwh[0]+ wX + (wY * 0.5), ltwh[1] + hZ + margin + hY * colorbarHeight], "Syzygy"); //DEMO
	}
	gl.finish();
	let pos = frac2mm(overlayItem);
	let posString = pos[0].toFixed(2)+'×'+pos[1].toFixed(2)+'×'+pos[2].toFixed(2);
	// temporary event bus mechanism. It uses Vue, but it would be ideal to divorce vue from this gl code.
	bus.$emit('crosshair-pos-change', posString);
	return posString
} // drawSlices()

