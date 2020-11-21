// import * as glmat from "gl-matrix"
import * as nii from "nifti-reader-js"

export function loadVolume(url, volume) {
	var hdr = null
	var img = null
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
		// console.log(hdr)
		volume.hdr = hdr
		volume.img = img
	};
	req.send();
	return
}

export function updateGLVolume(gl, shader, volume) { //load volume or change contrast
	//convert data to 8-bit image
	
	var hdr = volume.hdr
	var img = volume.img
	// console.log(hdr)
	var vox = hdr.dims[1] * hdr.dims[2] * hdr.dims[3];
	var img8 = new Uint8Array(vox);
	var imgRaw = new Uint8Array(img)
	if (hdr.datatypeCode === 2) //data already uint8
		imgRaw = new Uint8Array(img);
	else if (hdr.datatypeCode === 4)
		imgRaw = new Int16Array(img);
	else if (hdr.datatypeCode === 16)
		imgRaw = new Float32Array(img);
	else if (hdr.datatypeCode === 512)
		imgRaw = new Uint16Array(img);
	var mn = hdr.cal_min;
	var mx = hdr.cal_max;
	var scale = 1;
	if (mx > mn) scale = 255 / (mx-mn);
	for (var i = 0; i < (vox-1); i++) {
		var v = imgRaw[i];
		v = (v * hdr.scl_slope) + hdr.scl_inter;
		if (v < mn)
			img8[i] = 0;
		else if (v > mx)
			img8[i] = 255;
		else
			img8[i] = (v-mn) * scale;
	}
	var tex = gl.createTexture();
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_3D, tex);
	gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.pixelStorei( gl.UNPACK_ALIGNMENT, 1 )
	gl.texStorage3D(gl.TEXTURE_3D, 1, gl.R8, hdr.dims[1], hdr.dims[2], hdr.dims[3]);
	gl.texSubImage3D(gl.TEXTURE_3D, 0, 0, 0, 0,hdr.dims[1], hdr.dims[2], hdr.dims[3],gl.RED, gl.UNSIGNED_BYTE, img8);
	// var dims = [1.0, hdr.dims[1]*hdr.pixDims[1], hdr.dims[2]*hdr.pixDims[2],  hdr.dims[3]*hdr.pixDims[3]];
	// var longestAxis = Math.max(dims[1], Math.max(dims[2], dims[3]));
	// var volScale = [dims[1] / longestAxis, dims[2] / longestAxis, dims[3] / longestAxis];
	// shader.use(gl)
	// gl.uniform3iv(shader.uniforms["volume_dims"], [hdr.dims[1],hdr.dims[2],hdr.dims[3]]);
	// gl.uniform3fv(shader.uniforms["volume_scale"], volScale);
	// drawSlices(gl, shader, hdr,0.5, 0.5, 0.5)
} // updateVolume()

export function bindBlankGL(gl, hdr) {
	let texR = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_3D, texR);
	gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
	gl.texStorage3D(gl.TEXTURE_3D, 1, gl.RGBA8, hdr.dims[1], hdr.dims[2], hdr.dims[3]);
	return texR;
}

export function byteBound(flt) { //return range 0..255
	var ret = Math.min(flt, 255);
	return Math.max(ret, 0);
}

export function selectColormap(gl, lutName = "") {
	var lut = makeLut([0, 255], [0, 255], [0, 255], [0, 128], [0, 255]); //gray
	if (lutName === "Plasma")
		lut = makeLut([13, 156, 237, 240], [8, 23, 121, 249], [135, 158, 83, 33], [0, 56, 80, 88], [0, 64, 192, 255]); //plasma
	if (lutName === "Viridis")
		lut = makeLut([68, 49, 53, 253], [1, 104, 183, 231], [84, 142, 121, 37], [0, 56, 80, 88], [0, 65, 192, 255]);//viridis
	if (lutName === "Inferno")
		lut = makeLut([0, 120, 237, 240], [0, 28, 105, 249], [4, 109, 37, 33], [0, 56, 80, 88], [0, 64, 192, 255]);//inferno
	var colormapTexture = gl.createTexture();
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, colormapTexture);
	gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, 256, 1);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 256, 1, gl.RGBA, gl.UNSIGNED_BYTE, lut);
} // selectColormap()

export function makeLut(Rs, Gs, Bs, As, Is) {
	//create color lookup table provided arrays of reds, greens, blues, alphas and intensity indices
	//intensity indices should be in increasing order with the first value 0 and the last 255.
	// makeLut([0, 255], [0, 0], [0,0], [0,128],[0,255]); //red gradient
	var lut = new Uint8Array(256 * 4);
	for (var i = 0; i < (Is.length - 1); i++) {
		//return a + f * (b - a);
		var idxLo = Is[i];
		var idxHi = Is[i + 1];
		var idxRng = idxHi - idxLo;
		var k = idxLo * 4;
		for (var j = idxLo; j <= idxHi; j++) {
			var f = (j - idxLo) / idxRng;
			lut[k] = byteBound(Rs[i] + f * (Rs[i + 1] - Rs[i])); //Red
			k++;
			lut[k] = byteBound(Gs[i] + f * (Gs[i + 1] - Gs[i])); //Green
			k++;
			lut[k] = byteBound(Bs[i] + f * (Bs[i + 1] - Bs[i])); //Blue
			k++;
			lut[k] = byteBound(As[i] + f * (As[i + 1] - As[i])); //Alpha
			k++;
		}
	}
	return lut;
} // makeLut()


export function drawSlices(gl, shader, hdr, a, c, s) {
	console.log("drawing slices")
	gl.clearColor(0.0, 0.0, 0.0, 0.0);
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	var dims = [1.0, hdr.dims[1]*hdr.pixDims[1], hdr.dims[2]*hdr.pixDims[2],  hdr.dims[3]*hdr.pixDims[3]];
	var longestAxis = Math.max(dims[1], Math.max(dims[2], dims[3]));
	var volScale = [dims[1] / longestAxis, dims[2] / longestAxis, dims[3] / longestAxis];
	// gl.canvas.style.backgroundColor = "black"
	var xAR = gl.canvas.clientHeight / gl.canvas.clientWidth;
	var yAR = 1.0;
	if (xAR > 1.0) {
		yAR = gl.canvas.clientWidth / gl.canvas.clientHeight;
		xAR = 1.0;
	}

	var w = volScale[0] * xAR;
	var h = volScale[1] * yAR;
	console.log("drawing axial")
	shader.use(gl);
	gl.uniform1i(shader.uniforms["axCorSag"], 0);
	gl.uniform1f(shader.uniforms["slice"], a);
	gl.uniform4f(shader.uniforms["leftBottomWidthHeight"], -w, -h, w, h);
	gl.drawArrays(gl.TRIANGLE_STRIP, 5, 4);

	w = volScale[0] * xAR;
	h = volScale[2] * yAR;
	console.log("drawing coronal")
	shader.use(gl);
	gl.uniform1i(shader.uniforms["axCorSag"], 1);
	gl.uniform1f(shader.uniforms["slice"], c);
	gl.uniform4f(shader.uniforms["leftBottomWidthHeight"], -w, 0, w, h);
	gl.drawArrays(gl.TRIANGLE_STRIP, 5, 4);

	w = volScale[1] * xAR;
	h = volScale[2] * yAR;
	console.log("drawing sagital")
	shader.use(gl);
	gl.uniform1i(shader.uniforms["axCorSag"], 2);
	gl.uniform1f(shader.uniforms["slice"], s);
	gl.uniform4f(shader.uniforms["leftBottomWidthHeight"], 0, 0, w, h);
	gl.drawArrays(gl.TRIANGLE_STRIP, 5, 4);

	// gl.viewport(gl.canvas.width / 2, 0, gl.canvas.width / 2, gl.canvas.height / 2);
	// Wait for rendering to actually finish
	gl.finish()
}