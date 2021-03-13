import * as nii from "nifti-reader-js"
import { Shader } from "./webgl-util/shader.js";
import * as mat from "gl-matrix";
import { vertSliceShader, fragSliceShader } from "./shader-srcs.js";
import { vertLineShader, fragLineShader } from "./shader-srcs.js";
import { vertRenderShader, fragRenderShader } from "./shader-srcs.js";
import { vertColorbarShader, fragColorbarShader } from "./shader-srcs.js";
import { vertFontShader, fragFontShader } from "./shader-srcs.js";

//import {bus} from "@/bus.js"

export let Niivue = function(opts){
  this.opts = {} // will be populate with opts or defaults when a new Niivue object instance is created
  this.defaults = {
    textHeight: 0.03,  // 0 for no text, fraction of canvas height
    colorbarHeight: 0.05, // 0 for no colorbars, fraction of Nifti j dimension
    crosshairWidth: 1, // 0 for no crosshairs
    backColor: [0, 0, 0, 1],
    crosshairColor: [1, 0, 0 ,1],
    colorBarMargin: 0.05 // x axis margin arount color bar, clip space coordinates

  }

  this.gl = null
  this.colormapTexture = null
  this.volumeTexture = null
  this.overlayTexture = null
  this.sliceShader = null
  this.lineShader = null
  this.renderShader = null
  this.colorbarShader = null
  this.fontShader = null
  this.fontMets = null

  this.sliceTypeAxial = 0
  this.sliceTypeCoronal = 1
  this.sliceTypeSagittal = 2
  this.sliceTypeMultiplanar = 3
  this.sliceTypeRender = 4
  this.sliceType = this.sliceTypeMultiplanar // sets current view in webgl canvas
  this.scene = {}
  this.scene.renderAzimuth = 120
  this.scene.renderElevation = 15
  this.scene.crosshairPos = [0.5, 0.5, 0.5]
  this.scene.clipPlane = [0, 0, 0, 0]
  this.overlays = [] // layers added on top of base image (e.g. masks or stat maps)
  this.volumes = [] // base layer(s)
  this.isRadiologicalConvention = false
  this.volScaleMultiplier = 1
  this.mousePos = [0, 0]
  this.numScreenSlices = 0 // e.g. for multiplanar view, 3 simultaneous slices: axial, coronal, sagittal
  this.screenSlices = [ //location and type of each 2D slice on screen, allows clicking to detect position
  {leftTopWidthHeight: [1, 0, 0, 1], axCorSag: this.sliceTypeAxial},
  {leftTopWidthHeight: [1, 0, 0, 1], axCorSag: this.sliceTypeAxial},
  {leftTopWidthHeight: [1, 0, 0, 1], axCorSag: this.sliceTypeAxial},
  {leftTopWidthHeight: [1, 0, 0, 1], axCorSag: this.sliceTypeAxial}
];
  this.sliceOpacity = 1.0

  // loop through known Niivue properties
  // if the user supplied opts object has a
  // property listed in the known properties, then set
  // Niivue.opts.<prop> to that value, else apply defaults.
  for (let prop in this.defaults) {
    this.opts[prop] = (opts[prop] === undefined) ? this.defaults[prop] : opts[prop]
  }
}

// test if two arrays have equal values for each element
Niivue.prototype.arrayEquals = function(a, b) {
  return Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length &&
    a.every((val, index) => val === b[index]);
}

// update mouse position from new mouse down coordinates
Niivue.prototype.mouseDown = function mouseDown(x, y) {
  if (this.sliceType != this.sliceTypeRender) return;
	this.mousePos = [x,y];
} // mouseDown()

Niivue.prototype.mouseMove = function mouseMove(x, y) {
	if (this.sliceType != this.sliceTypeRender) return;
	this.scene.renderAzimuth += x - this.mousePos[0];
	this.scene.renderElevation += y - this.mousePos[1];
	this.mousePos = [x,y];
	this.drawScene() // TODO: change drawSlices to drawScene
} // mouseMove()

Niivue.prototype.sph2cartDeg = function sph2cartDeg(azimuth, elevation) {
//convert spherical AZIMUTH,ELEVATION,RANGE to Cartesion
//see Matlab's [x,y,z] = sph2cart(THETA,PHI,R)
// reverse with cart2sph
 let Phi = -elevation * (Math.PI/180);
 let Theta = ((azimuth-90) % 360) * (Math.PI/180);
 let ret = [Math.cos(Phi)* Math.cos(Theta), Math.cos(Phi) * Math.sin(Theta), Math.sin(Phi) ];
 let len = Math.sqrt(ret[0] * ret[0] + ret[1] * ret[1] + ret[2] * ret[2] );
 if (len <= 0.0) return ret;
 ret[0] /= len;
 ret[1] /= len;
 ret[2] /= len;
 return ret;
} // sph2cartDeg()

Niivue.prototype.setClipPlane = function (azimuthElevationDepth) {
	// azimuthElevationDepth is 3 component vector [a, e, d]
	//  azimuth: camera position in degrees around object, typically 0..360 (or -180..+180)
	//  elevation: camera height in degrees, range -90..90
	//  depth: distance of clip plane from center of volume, range 0..~1.73 (e.g. 2.0 for no clip plane)
	if (this.sliceType != this.sliceTypeRender) return;
	let v = this.sph2cartDeg(azimuthElevationDepth[0], azimuthElevationDepth[1]);
	this.scene.clipPlane = [v[0], v[1], v[2], azimuthElevationDepth[2]];
	this.drawScene()
} // clipPlaneUpdate()

Niivue.prototype.setCrosshairColor = function (color) {
  this.opts.crosshairColor = color
  this.drawScene()
} // setCrosshairColor()

Niivue.prototype.sliceScroll2D = function (posChange, x, y, isDelta=true) {
  if (this.sliceType === this.sliceTypeMultiplanar){
    //mouseMPScroll(posChange, x, y) // not working when mouse over axial or Sag slices (works over Cor for some reason)
    return
  }
  var idx
  if (this.sliceType == this.sliceTypeAxial) idx = 2;
  if (this.sliceType == this.sliceTypeSagittal) idx = 0;
  if (this.sliceType == this.sliceTypeCoronal) idx = 1;
  if (isDelta){
    var posNow = this.scene.crosshairPos[idx]
    var posFuture = posNow + posChange
    if (posFuture > 1) posFuture = 1;
    if (posFuture < 0) posFuture = 0;
    this.scene.crosshairPos[idx] = posFuture
  } else {
    this.scene.crosshairPos[idx] = posChange
  }
  this.drawScene()
} // sliceScroll2D()

Niivue.prototype.setSliceType = function(st) {
  this.sliceType = st
  this.drawScene()
} // setSliceType()

Niivue.prototype.setSliceOpacity = function (op) {
  this.sliceOpacity = op
  this.drawScene()
} // setSliceOpacity()

Niivue.prototype.setScale = function (scale) {
  this.volScaleMultiplier = scale
  this.drawScene()
} // setScale()

// attach the Niivue instance to the webgl2 canvas by element id
// @example niivue = new Niivue().attachTo('#gl')
Niivue.prototype.attachTo = function (id) {
	this.gl = document.querySelector(id).getContext("webgl2");
	if (!this.gl){
    alert("unable to get webgl2 context. Perhaps this browser does not support webgl2")
  }
  this.init()
  return this
} // attachTo

Niivue.prototype.scaleTo8Bit = function (A, volume) {
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

Niivue.prototype.overlayRGBA = function (volume) {
	let hdr = volume.hdr;
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

Niivue.prototype.calibrateIntensity = function(A, volume) {
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

Niivue.prototype.reorient = function (hdr) {
// port of Matlab reorient() https://github.com/xiangruili/dicm2nii/blob/master/nii_viewer.m
// not elegant, as JavaScript arrays are always 1D
	let a = hdr.affine;
	let absR = mat.mat3.fromValues(Math.abs(a[0][0]),Math.abs(a[0][1]),Math.abs(a[0][2]), Math.abs(a[1][0]),Math.abs(a[1][1]),Math.abs(a[1][2]), Math.abs(a[2][0]),Math.abs(a[2][1]),Math.abs(a[2][2]));
	//1st column = x
	let ixyz = [1, 1, 1];
    if (absR[3] > absR[0]) ixyz[0] = 2;//(absR[1][0] > absR[0][0]) ixyz[0] = 2;
    if ((absR[6] > absR[0]) && (absR[6]> absR[3])) ixyz[0] = 3;//((absR[2][0] > absR[0][0]) && (absR[2][0]> absR[1][0])) ixyz[0] = 3;
	//2nd column = y
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
    //3rd column = z: constrained as x+y+z = 1+2+3 = 6
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
	if (this.arrayEquals(perm, [1,2,3]) && this.arrayEquals(flip, [0,0,0]))
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

Niivue.prototype.reorientVolume = function (hdr, img) {
	//rotate 3D volume to match approximately match RAS
	//lots of room for speed/memory opitmization, e.g. LAS -> RAS all in plane
	let {perm, residualR, requiresRot} = this.reorient(hdr);
	if (!requiresRot) return; //already rotated
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
	//update header to show new dimensions and rotated affine matrix. ToDo: qform now wrong!
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

//TODO: pass in overlayList and load all volumes in list
Niivue.prototype.loadVolumes  = function(volumeList) {
  this.volumes = volumeList
  let overlayItem = this.volumes[0] // load first volume for demo
	let hdr = null
	let img = null
	let url = overlayItem.volumeURL
	let req = new XMLHttpRequest();
	req.open("GET", url, true);
	req.responseType = "arraybuffer";
	req.onerror = function () {
		console.log = "Error Loading Volume";
	}
	req.onload = function () {
		let dataBuffer = req.response;
		if (dataBuffer) {
			hdr = nii.readHeader(dataBuffer);
			if (nii.isCompressed(dataBuffer)) {
				img = nii.readImage(hdr, nii.decompress(dataBuffer));
			} else {
				img = nii.readImage(hdr, dataBuffer);
			}
			this.reorientVolume(hdr, img);
		} else {
			alert("Unable to load buffer properly from volume?");
			console.log("no buffer?");
		}
    this.volumes[0].volume = {}
    this.volumes[0].volume.hdr = hdr
    this.volumes[0].volume.img = img
		//_overlayItem = overlayItem
    console.log(this.volumes)
		this.selectColormap(this.volumes[0].colorMap)
		this.updateGLVolume(this.volumes[0])
	}.bind(this) // bind "this" niivue instance context
	req.send();
	return this
} // loadVolume()

Niivue.prototype.loadPng = function(pngName) {
	var pngImage = null;
	pngImage = new Image();
	pngImage.onload = function() {
		//console.log("PNG resolution ", pngImage.width, ",", pngImage.height);
		var pngTexture = this.gl.createTexture();
		this.gl.activeTexture(this.gl.TEXTURE3);
		this.gl.bindTexture(this.gl.TEXTURE_2D, pngTexture);
		// Set the parameters so we can render any size image.
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
		// Upload the image into the texture.
		this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pngImage);
	}.bind(this) // bind "this" context to niivue instance
	pngImage.src = pngName;  // MUST BE SAME DOMAIN!!!
	//console.log("loading PNG ", pngName);
} // loadPng()

Niivue.prototype.initText = async function () {
	//load bitmap
	await this.loadPng('fnt.png');
	//create font metrics
	this.fontMets = [];
	for (let id = 0; id < 256; id++) { //clear ASCII codes 0..256
		this.fontMets[id] = {};
		this.fontMets[id].xadv = 0;
		this.fontMets[id].uv_lbwh = [0, 0, 0, 0];
		this.fontMets[id].lbwh = [0, 0, 0, 0];
	}
	//load metrics values: may only sparsely describe range 0..255
	var metrics = [];
	async function fetchMetrics() {
		const response = await fetch('./fnt.json');
		metrics = await response.json();
	}
	await fetchMetrics();
	this.fontMets.distanceRange = metrics.atlas.distanceRange;
	this.fontMets.size = metrics.atlas.size;
	let scaleW = metrics.atlas.width;
	let scaleH = metrics.atlas.height;
	for (let i = 0; i < metrics.glyphs.length; i++) {
		let glyph = metrics.glyphs[i];
		let id = glyph.unicode;
		this.fontMets[id].xadv = glyph.advance;
		if (glyph.planeBounds  === undefined) continue;
		let l = glyph.atlasBounds.left / scaleW;
		let b = ((scaleH - glyph.atlasBounds.top) / scaleH);
		let w = (glyph.atlasBounds.right - glyph.atlasBounds.left) / scaleW;
		let h = (glyph.atlasBounds.top - glyph.atlasBounds.bottom) / scaleH;
		this.fontMets[id].uv_lbwh = [l, b, w, h];
		l = glyph.planeBounds.left;
		b = glyph.planeBounds.bottom;
		w = glyph.planeBounds.right - glyph.planeBounds.left;
		h = glyph.planeBounds.top - glyph.planeBounds.bottom;
		this.fontMets[id].lbwh = [l, b, w, h];
	}
} // initText()

// TODO: run init from attachTo
Niivue.prototype.init = async function () {
	//initial setup: only at the startup of the component
  this.gl.enable(this.gl.CULL_FACE);
  this.gl.cullFace(this.gl.FRONT);
  this.gl.enable(this.gl.BLEND);
  this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
	this.sliceShader = new Shader(this.gl, vertSliceShader, fragSliceShader);
	this.sliceShader.use(this.gl);
	this.gl.uniform1i(this.sliceShader.uniforms["volume"], 0);
	this.gl.uniform1i(this.sliceShader.uniforms["colormap"], 1);
	this.gl.uniform1i(this.sliceShader.uniforms["overlay"], 2);
	this.lineShader = new Shader(this.gl, vertLineShader, fragLineShader);
	this.renderShader = new Shader(this.gl, vertRenderShader, fragRenderShader);
	this.renderShader.use(this.gl);
	this.gl.uniform1i(this.renderShader.uniforms["volume"], 0);
	this.gl.uniform1i(this.renderShader.uniforms["colormap"], 1);
	this.gl.uniform1i(this.renderShader.uniforms["overlay"], 2);
	this.colorbarShader = new Shader(this.gl, vertColorbarShader, fragColorbarShader);
	this.colorbarShader.use(this.gl);
	this.gl.uniform1i(this.colorbarShader.uniforms["colormap"], 1);
	//multi-channel signed distance font https://github.com/Chlumsky/msdfgen
	this.fontShader = new Shader(this.gl, vertFontShader, fragFontShader);
	this.fontShader.use(this.gl);
	this.gl.uniform1i(this.fontShader.uniforms["fontTexture"], 3);
	await this.initText();
  return this
} // init()

Niivue.prototype.updateGLVolume = function(overlayItem) { //load volume or change contrast
	var cubeStrip = [0, 1, 0, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 0, 1, 0, 0];
	var vao = this.gl.createVertexArray();
	this.gl.bindVertexArray(vao);
	var vbo = this.gl.createBuffer();
	this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vbo);
	this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(cubeStrip), this.gl.STATIC_DRAW);
	this.gl.enableVertexAttribArray(0);
	this.gl.vertexAttribPointer(0, 3, this.gl.FLOAT, false, 0, 0);
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
	this.calibrateIntensity(imgRaw, overlayItem.volume)
	var img8 = this.scaleTo8Bit(imgRaw, overlayItem.volume)
	if (this.volumeTexture)
		this.gl.deleteTexture(this.volumeTexture);
	this.volumeTexture = this.gl.createTexture();
	this.gl.activeTexture(this.gl.TEXTURE0);
	this.gl.bindTexture(this.gl.TEXTURE_3D, this.volumeTexture);
	this.gl.texParameteri(this.gl.TEXTURE_3D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
	this.gl.texParameteri(this.gl.TEXTURE_3D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
	this.gl.texParameteri(this.gl.TEXTURE_3D, this.gl.TEXTURE_WRAP_R, this.gl.CLAMP_TO_EDGE);
	this.gl.texParameteri(this.gl.TEXTURE_3D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
	this.gl.texParameteri(this.gl.TEXTURE_3D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
	this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, 1)
	this.gl.texStorage3D(this.gl.TEXTURE_3D, 1, this.gl.R8, hdr.dims[1], hdr.dims[2], hdr.dims[3]);
	this.gl.texSubImage3D(this.gl.TEXTURE_3D, 0, 0, 0, 0, hdr.dims[1], hdr.dims[2], hdr.dims[3], this.gl.RED, this.gl.UNSIGNED_BYTE, img8);
	//overlay texture
	let imgRGBA8 = this.overlayRGBA(overlayItem.volume)
	if (this.overlayTexture)
		this.gl.deleteTexture(this.overlayTexture);
	this.overlayTexture = this.gl.createTexture();
	this.gl.activeTexture(this.gl.TEXTURE2);
	this.gl.bindTexture(this.gl.TEXTURE_3D, this.overlayTexture);
	this.gl.texParameteri(this.gl.TEXTURE_3D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
	this.gl.texParameteri(this.gl.TEXTURE_3D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
	this.gl.texParameteri(this.gl.TEXTURE_3D, this.gl.TEXTURE_WRAP_R, this.gl.CLAMP_TO_EDGE);
	this.gl.texParameteri(this.gl.TEXTURE_3D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
	this.gl.texParameteri(this.gl.TEXTURE_3D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
	this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, 1)
	this.gl.texStorage3D(this.gl.TEXTURE_3D, 4, this.gl.RGBA8, hdr.dims[1], hdr.dims[2], hdr.dims[3]);
	this.gl.texSubImage3D(this.gl.TEXTURE_3D, 0, 0, 0, 0, hdr.dims[1], hdr.dims[2], hdr.dims[3], this.gl.RGBA, this.gl.UNSIGNED_BYTE, imgRGBA8);
	this.drawScene(); // TODO: drawScene should draw all volumes in this.overlays
} // updateVolume()

Niivue.prototype.selectColormap = function(lutName = "") {
	var lut = this.makeLut([0, 255], [0, 255], [0, 255], [0, 128], [0, 255]); //gray
	if (lutName === "Winter")
		lut = this.makeLut([0, 0, 0], [0, 128, 255], [255, 196, 128], [0, 64, 128], [0, 128, 255]); //winter
	if (lutName === "Warm")
		lut = this.makeLut([255, 255, 255], [127, 196, 254], [0, 0, 0], [0, 64, 128], [0, 128, 255]); //warm
	if (lutName === "Plasma")
		lut = this.makeLut([13, 156, 237, 240], [8, 23, 121, 249], [135, 158, 83, 33], [0, 56, 80, 88], [0, 64, 192, 255]); //plasma
	if (lutName === "Viridis")
		lut = this.makeLut([68, 49, 53, 253], [1, 104, 183, 231], [84, 142, 121, 37], [0, 56, 80, 88], [0, 65, 192, 255]);//viridis
	if (lutName === "Inferno")
		lut = this.makeLut([0, 120, 237, 240], [0, 28, 105, 249], [4, 109, 37, 33], [0, 56, 80, 88], [0, 64, 192, 255]);//inferno
	if (this.colormapTexture !== null)
		this.gl.deleteTexture(this.colormapTexture);
	this.colormapTexture = this.gl.createTexture();
	this.gl.activeTexture(this.gl.TEXTURE1);
	this.gl.bindTexture(this.gl.TEXTURE_2D, this.colormapTexture);
	this.gl.texStorage2D(this.gl.TEXTURE_2D, 1, this.gl.RGBA8, 256, 1);
	this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
	this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_R, this.gl.CLAMP_TO_EDGE);
	this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
	this.gl.texSubImage2D(this.gl.TEXTURE_2D, 0, 0, 0, 256, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, lut);
  return this
} // selectColormap()

Niivue.prototype.makeLut = function(Rs, Gs, Bs, As, Is) {
	//create color lookup table provided arrays of reds, greens, blues, alphas and intensity indices
	//intensity indices should be in increasing order with the first value 0 and the last 255.
	// this.makeLut([0, 255], [0, 0], [0,0], [0,128],[0,255]); //red gradient
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
	return lut;
} // makeLut()

// TODO: ?? maybe pass in overlayList to scale all volumes
Niivue.prototype.sliceScale = function(overlayItem) {
	var hdr = overlayItem.volume.hdr
	var dims = [1.0, hdr.dims[1] * hdr.pixDims[1], hdr.dims[2] * hdr.pixDims[2], hdr.dims[3] * hdr.pixDims[3]];
	var longestAxis = Math.max(dims[1], Math.max(dims[2], dims[3]));
	var volScale = [dims[1] / longestAxis, dims[2] / longestAxis, dims[3] / longestAxis];
	volScale = volScale.map(function(v) {return v * this.volScaleMultiplier;}.bind(this)) // bind "this"context to niivue
	var vox = [hdr.dims[1], hdr.dims[2], hdr.dims[3]];
	return { volScale, vox }
} // sliceScale()

Niivue.prototype.mouseClick = function(overlayItem, x, y) {
	if (this.sliceType === this.sliceTypeRender)
		return
	//console.log("Click pixels (x,y):", x, y);
	if ((this.numScreenSlices < 1) || (this.gl.canvas.height < 1) || (this.gl.canvas.width < 1))
		return;
	//mouse click X,Y in screen coordinates, origin at top left
	// webGL clip space L,R,T,B = [-1, 1, 1, 1]
	// n.b. webGL Y polarity reversed
	// https://webglfundamentals.org/webgl/lessons/webgl-fundamentals.html
	for (let i = 0; i < this.numScreenSlices; i++) {
		var axCorSag = this.screenSlices[i].axCorSag;
		if (axCorSag > this.sliceTypeSagittal) continue;
		var ltwh = this.screenSlices[i].leftTopWidthHeight;
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
			if (axCorSag === this.sliceTypeAxial) {
				this.scene.crosshairPos[0] = fracX;
				this.scene.crosshairPos[1] = fracY;
			}
			if (axCorSag === this.sliceTypeCoronal) {
				this.scene.crosshairPos[0] = fracX;
				this.scene.crosshairPos[2] = fracY;
			}
			if (axCorSag === this.sliceTypeSagittal) {
				this.scene.crosshairPos[1] = fracX;
				this.scene.crosshairPos[2] = fracY;
			}
			this.drawScene();
			return;
		} //if click in slice i
	} //for i: each slice on screen
} // mouseClick()

Niivue.prototype.drawColorbar = function(leftTopWidthHeight) {
	if ((leftTopWidthHeight[2] <= 0) || (leftTopWidthHeight[3] <= 0))
		return;
	//console.log("bar:", leftTopWidthHeight[0], leftTopWidthHeight[1], leftTopWidthHeight[2], leftTopWidthHeight[3]);
	if (this.opts.crosshairWidth > 0) {
		//gl.disable(gl.DEPTH_TEST);
		this.lineShader.use(this.gl)
		this.gl.uniform4fv(this.lineShader.uniforms["lineColor"], this.opts.crosshairColor);
		this.gl.uniform2fv(this.lineShader.uniforms["canvasWidthHeight"], [this.gl.canvas.width, this.gl.canvas.height]);
		let ltwh = [leftTopWidthHeight[0]-1, leftTopWidthHeight[1]-1, leftTopWidthHeight[2]+2, leftTopWidthHeight[3]+2];
		this.gl.uniform4f(this.lineShader.uniforms["leftTopWidthHeight"], ltwh[0], ltwh[1], ltwh[2], ltwh[3]);
		this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 5, 4);
	}
	this.colorbarShader.use(this.gl);
	this.gl.uniform2fv(this.colorbarShader.uniforms["canvasWidthHeight"], [this.gl.canvas.width, this.gl.canvas.height]);
	this.gl.uniform4f(this.colorbarShader.uniforms["leftTopWidthHeight"], leftTopWidthHeight[0], leftTopWidthHeight[1], leftTopWidthHeight[2], leftTopWidthHeight[3]);
	this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 5, 4);
	//gl.enable(gl.DEPTH_TEST);
} // drawColorbar()

Niivue.prototype.textWidth = function(scale, str) {
	let w = 0;
	var bytes = new Buffer(str);
	for (let i = 0; i < str.length; i++)
		w += scale * this.fontMets[bytes[i]].xadv;
	return w;
} // textWidth()

Niivue.prototype.drawChar = function(xy, scale, char) { //draw single character, never call directly: ALWAYS call from drawText()
	let metrics = this.fontMets[char];
	let l = xy[0] + (scale * metrics.lbwh[0]);
	let b = -(scale * metrics.lbwh[1]);
	let w = (scale * metrics.lbwh[2]);
	let h = (scale * metrics.lbwh[3]);
	let t = xy[1] + (b - h) + scale;
	this.gl.uniform4f(this.fontShader.uniforms["leftTopWidthHeight"], l, t, w, h);
	this.gl.uniform4fv(this.fontShader.uniforms["uvLeftTopWidthHeight"], metrics.uv_lbwh);
	this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 5, 4);
	return scale * metrics.xadv;
} // drawChar()

Niivue.prototype.drawText = function(xy, str) { //to right of x, vertically centered on y
	if (this.opts.textHeight <= 0) return;
	this.fontShader.use(this.gl);
	let scale = (this.opts.textHeight * this.gl.canvas.height);
	this.gl.uniform2f(this.fontShader.uniforms["canvasWidthHeight"], this.gl.canvas.width, this.gl.canvas.height);
	this.gl.uniform4fv(this.fontShader.uniforms["fontColor"], this.opts.crosshairColor);
	let screenPxRange = scale / this.fontMets.size * this.fontMets.distanceRange;
	screenPxRange = Math.max(screenPxRange, 1.0) //screenPxRange() must never be lower than 1
	this.gl.uniform1f(this.fontShader.uniforms["screenPxRange"], screenPxRange);
	var bytes = new Buffer(str);
	for (let i = 0; i < str.length; i++)
		xy[0] += this.drawChar(xy, scale, bytes[i]);
} // drawText()

Niivue.prototype.drawTextRight = function(xy, str) { //to right of x, vertically centered on y
	if (this.opts.textHeight <= 0) return;
	this.fontShader.use(this.gl)
	xy[1] -= (0.5 * this.opts.textHeight * this.gl.canvas.height);
	this.drawText(xy, str)
} // drawTextRight()

Niivue.prototype.drawTextBelow = function(xy, str) { //horizontally centered on x, below y
	if (this.opts.textHeight <= 0) return;
	this.fontShader.use(this.gl)
	let scale = (this.opts.textHeight * this.gl.canvas.height);
	xy[0] -= 0.5 * this.textWidth(scale, str);
	this.drawText(xy, str)
} // drawTextBelow()

Niivue.prototype.draw2D = function(leftTopWidthHeight, axCorSag) {
	var crossXYZ = [this.scene.crosshairPos[0], this.scene.crosshairPos[1],this.scene.crosshairPos[2]]; //axial: width=i, height=j, slice=k
	if (axCorSag === this.sliceTypeCoronal)
		crossXYZ = [this.scene.crosshairPos[0], this.scene.crosshairPos[2],this.scene.crosshairPos[1]]; //coronal: width=i, height=k, slice=j
	if (axCorSag === this.sliceTypeSagittal)
		crossXYZ = [this.scene.crosshairPos[1], this.scene.crosshairPos[2],this.scene.crosshairPos[0]]; //sagittal: width=j, height=k, slice=i
	let isMirrorLR = ((this.isRadiologicalConvention) && (axCorSag < this.sliceTypeSagittal))
	this.sliceShader.use(this.gl);
	this.gl.uniform1f(this.sliceShader.uniforms["opacity"], this.sliceOpacity);
	this.gl.uniform1i(this.sliceShader.uniforms["axCorSag"], axCorSag);
	this.gl.uniform1f(this.sliceShader.uniforms["slice"], crossXYZ[2]);
	this.gl.uniform2fv(this.sliceShader.uniforms["canvasWidthHeight"], [this.gl.canvas.width, this.gl.canvas.height]);
	if (isMirrorLR) {
		this.gl.disable(this.gl.CULL_FACE);
		leftTopWidthHeight[2] = - leftTopWidthHeight[2];
		leftTopWidthHeight[0] = leftTopWidthHeight[0] - leftTopWidthHeight[2];
	}
	this.gl.uniform4f(this.sliceShader.uniforms["leftTopWidthHeight"], leftTopWidthHeight[0], leftTopWidthHeight[1], leftTopWidthHeight[2], leftTopWidthHeight[3]);
	//console.log(leftTopWidthHeight);
	//gl.uniform4f(sliceShader.uniforms["leftTopWidthHeight"], leftTopWidthHeight[0], leftTopWidthHeight[1], leftTopWidthHeight[2], leftTopWidthHeight[3]);
	//gl.drawArrays(gl.TRIANGLE_STRIP, 5, 4);
	this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 5, 4);
	//record screenSlices to detect mouse click positions
	this.screenSlices[this.numScreenSlices].leftTopWidthHeight = leftTopWidthHeight;
	this.screenSlices[this.numScreenSlices].axCorSag = axCorSag;
	this.numScreenSlices += 1;
	if (this.opts.crosshairWidth <= 0.0) return;
	this.lineShader.use(this.gl)
	this.gl.uniform4fv(this.lineShader.uniforms["lineColor"], this.opts.crosshairColor);
	this.gl.uniform2fv(this.lineShader.uniforms["canvasWidthHeight"], [this.gl.canvas.width, this.gl.canvas.height]);
	//vertical line of crosshair:
	var xleft = leftTopWidthHeight[0] + (leftTopWidthHeight[2] * crossXYZ[0]);
	this.gl.uniform4f(this.lineShader.uniforms["leftTopWidthHeight"], xleft - (0.5*this.opts.crosshairWidth), leftTopWidthHeight[1],  this.opts.crosshairWidth, leftTopWidthHeight[3]);
	this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 5, 4);
	//horizontal line of crosshair:
	var xtop = leftTopWidthHeight[1] + (leftTopWidthHeight[3] * (1.0 - crossXYZ[1]));
	this.gl.uniform4f(this.lineShader.uniforms["leftTopWidthHeight"], leftTopWidthHeight[0], xtop - (0.5*this.opts.crosshairWidth), leftTopWidthHeight[2],  this.opts.crosshairWidth);
	this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 5, 4);
	this.gl.enable(this.gl.CULL_FACE);
	if (isMirrorLR)
		this.drawTextRight([leftTopWidthHeight[0] +leftTopWidthHeight[2] + 1, leftTopWidthHeight[1] + (0.5 * leftTopWidthHeight[3]) ], "R");
	else if (axCorSag < this.sliceTypeSagittal)
		this.drawTextRight([leftTopWidthHeight[0] + 1, leftTopWidthHeight[1] + (0.5 * leftTopWidthHeight[3]) ], "L");
	if ( axCorSag === this.sliceTypeAxial)
		this.drawTextBelow([leftTopWidthHeight[0] + (0.5 * leftTopWidthHeight[2]), leftTopWidthHeight[1] + 1 ], "A");
	if ( axCorSag > this.sliceTypeAxial)
		this.drawTextBelow([leftTopWidthHeight[0] + (0.5 * leftTopWidthHeight[2]), leftTopWidthHeight[1] + 1 ], "S");
} // draw2D()

Niivue.prototype.draw3D = function() {
	let {volScale, vox} = this.sliceScale(this.volumes[0]);
	this.renderShader.use(this.gl);
	if (this.gl.canvas.width < this.gl.canvas.height) // screen aspect ratio
		this.gl.viewport(0, (this.gl.canvas.height - this.gl.canvas.width)* 0.5, this.gl.canvas.width, this.gl.canvas.width);
	else
		this.gl.viewport((this.gl.canvas.width - this.gl.canvas.height)* 0.5, 0, this.gl.canvas.height, this.gl.canvas.height);
	this.gl.clearColor(0.2, 0, 0, 1);
	var m = mat.mat4.create();
	var fDistance = -0.54;
	//modelMatrix *= TMat4.Translate(0, 0, -fDistance);
	mat.mat4.translate(m,m, [0, 0, fDistance]);
	// https://glmatrix.net/docs/module-mat4.html  https://glmatrix.net/docs/mat4.js.html
	var rad = (90-this.scene.renderElevation-volScale[0]) * Math.PI / 180;
	mat.mat4.rotate(m,m, rad, [-1, 0, 0]);
	rad = (this.scene.renderAzimuth) * Math.PI / 180;
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
	this.gl.uniformMatrix4fv(this.renderShader.uniforms["mvpMtx"], false, m);
	this.gl.uniform1f(this.renderShader.uniforms["overlays"], this.overlays); // TODO: keep overlays as overlays, but maybe change this.overlays to volumes
	this.gl.uniform4fv(this.renderShader.uniforms["clipPlane"], this.scene.clipPlane);
	this.gl.uniform3fv(this.renderShader.uniforms["rayDir"], rayDir);
	this.gl.uniform3fv(this.renderShader.uniforms["texVox"], vox);
	this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 14); //cube is 12 triangles, triangle-strip creates n-2 triangles
	let posString = 'azimuth: ' + this.scene.renderAzimuth.toFixed(0)+' elevation: '+this.scene.renderElevation.toFixed(0);
	//bus.$emit('crosshair-pos-change', posString);
	return posString;
} // draw3D()

Niivue.prototype.mm2frac = function(overlayItem, mm) {
	//given mm, return volume fraction
	//convert from object space in millimeters to normalized texture space XYZ= [0..1, 0..1 ,0..1]
	let mm4 = mat.vec4.fromValues( mm[0], mm[1], mm[2],1);
	let d = overlayItem.volume.hdr.dims;
	let frac = [0, 0, 0];
	if ((d[1] < 1) || (d[2] < 1) || (d[3] < 1))
		return frac;
	let sf = overlayItem.volume.hdr.affine;
	let sform = mat.mat4.fromValues(
		sf[0][0], sf[1][0], sf[2][0], sf[3][0],
		sf[0][1], sf[1][1], sf[2][1], sf[3][1],
		sf[0][2], sf[1][2], sf[2][2], sf[3][2],
		sf[0][3], sf[1][3], sf[2][3], sf[3][3]);
	mat.mat4.invert(sform, sform);
	mat.vec4.transformMat4(mm4, mm4, sform);
	frac[0] = (mm4[0] + 0.5) / d[1];
	frac[1] = (mm4[1] + 0.5) / d[2];
	frac[2] = (mm4[2] + 0.5) / d[3];
	//console.log("mm", mm, " -> frac", frac);
	return frac;
} // mm2frac()

Niivue.prototype.frac2mm = function(overlayItem, frac) {
	//convert from normalized texture space XYZ= [0..1, 0..1 ,0..1] to object space in millimeters
	let pos = mat.vec4.fromValues(frac[0], frac[1], frac[2], 1);
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

Niivue.prototype.scaleSlice = function(w, h) {
	let scalePix = this.gl.canvas.clientWidth / w;
	if ((h * scalePix) > this.gl.canvas.clientHeight)
		scalePix = this.gl.canvas.clientHeight / h;
	//canvas space is 0,0...w,h with origin at upper left
	let wPix = w * scalePix;
	let hPix = h * scalePix;
	let leftTopWidthHeight = [(this.gl.canvas.clientWidth-wPix) * 0.5, ((this.gl.canvas.clientHeight-hPix) * 0.5), wPix, hPix];
	//let leftTopWidthHeight = [(gl.canvas.clientWidth-wPix) * 0.5, 80, wPix, hPix];
	return leftTopWidthHeight;
} // scaleSlice()


Niivue.prototype.drawScene = function() {
	this.gl.clearColor(this.opts.backColor[0], this.opts.backColor[1], this.opts.backColor[2], this.opts.backColor[3]);
	this.gl.clear(this.gl.COLOR_BUFFER_BIT);
	if (this.sliceType === this.sliceTypeRender) //draw rendering
		return this.draw3D();
	let {volScale} = this.sliceScale(this.volumes[0]);
	this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
	this.numScreenSlices = 0;
	if (this.sliceType === this.sliceTypeAxial) { //draw axial
		let leftTopWidthHeight = this.scaleSlice(volScale[0], volScale[1]);
		this.draw2D(leftTopWidthHeight, 0);
	} else if (this.sliceType === this.sliceTypeCoronal) { //draw coronal
		let leftTopWidthHeight = this.scaleSlice(volScale[0], volScale[2]);
		this.draw2D(leftTopWidthHeight, 1);
	} else if (this.sliceType === this.sliceTypeSagittal) { //draw sagittal
		let leftTopWidthHeight = this.scaleSlice(this.gl, volScale[1], volScale[2]);
		this.draw2D(leftTopWidthHeight, 2);
	} else { //sliceTypeMultiplanar
		let ltwh = this.scaleSlice(volScale[0]+volScale[1], volScale[1]+volScale[2]);
		let wX = ltwh[2] * volScale[0]/(volScale[0]+volScale[1]);
		let ltwh3x1 = this.scaleSlice(volScale[0]+volScale[0]+volScale[1], Math.max(volScale[1],volScale[2]));
		let wX1 = ltwh3x1[2] * volScale[0]/(volScale[0]+volScale[0]+volScale[1]);
		if (wX1 > wX) {
			let pixScale = (wX1 / volScale[0]);
			let hY1 = volScale[1] * pixScale;
			let hZ1 = volScale[2] * pixScale;
			//draw axial
			this.draw2D([ltwh3x1[0],ltwh3x1[1], wX1, hY1], 0);
			//draw coronal
			this.draw2D([ltwh3x1[0] + wX1,ltwh3x1[1], wX1, hZ1], 1);
			//draw sagittal
			this.draw2D([ltwh3x1[0] + wX1 + wX1,ltwh3x1[1], hY1, hZ1], 2);

		} else {
			let wY = ltwh[2] - wX;
			let hY = ltwh[3] * volScale[1]/(volScale[1]+volScale[2]);
			let hZ = ltwh[3] - hY;
			//draw axial
			this.draw2D([ltwh[0],ltwh[1]+hZ, wX, hY], 0);
			//draw coronal
			this.draw2D([ltwh[0],ltwh[1], wX, hZ], 1);
			//draw sagittal
			this.draw2D([ltwh[0]+wX,ltwh[1], wY, hZ], 2);
			//draw colorbar (optional)
			var margin = this.opts.colorBarMargin * hY;
			this.drawColorbar([ltwh[0]+wX+margin, ltwh[1] + hZ + margin, wY - margin - margin, hY * this.opts.colorbarHeight]);
			// drawTextBelow(gl, [ltwh[0]+ wX + (wY * 0.5), ltwh[1] + hZ + margin + hY * colorbarHeight], "Syzygy"); //DEMO
		}
	}
	this.gl.finish();
	let pos = this.frac2mm(this.volumes[0], [this.scene.crosshairPos[0],this.scene.crosshairPos[1],this.scene.crosshairPos[2]]);
	let posString = pos[0].toFixed(2)+'×'+pos[1].toFixed(2)+'×'+pos[2].toFixed(2);
	// temporary event bus mechanism. It uses Vue, but it would be ideal to divorce vue from this gl code.
	//bus.$emit('crosshair-pos-change', posString);
	return posString
} // drawScene()


/* TODO: remove bus and handle this as Niivue.prototype method
bus.$on('colormap-change', function (selectedColorMap) {
    selectColormap(getGL(), selectedColorMap)
    drawSlices(getGL(), _overlayItem)
});
*/


