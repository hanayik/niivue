export function drawSlices(gl, shader, hdr, a, c, s) {
  gl.clearColor(0.0, 0.0, 0.0, 0.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  
	gl.canvas.style.backgroundColor = "black"
	xAR = gl.canvas.clientHeight/gl.canvas.clientWidth;
	yAR = 1.0;
	if (xAR > 1.0) {
		yAR = gl.canvas.clientWidth/gl.canvas.clientHeight;
		xAR =  1.0;
	} 
	//Draw Axial width=x, height=y
	//lower left quadrant (LTRB= -1,-1,0,0) is axial
	shader.use();
	gl.uniform1i(shader.uniforms["axCorSag"], 0);
	gl.uniform1f(shader.uniforms["slice"], a);
	var w = volScale[0]*xAR;
	var h = volScale[1]*yAR; 
	gl.uniform4f(shader.uniforms["leftBottomWidthHeight"], -w, -h, w, h);
	//gl.uniform4f(sliceShader.uniforms["leftBottomWidthHeight"], 1-ys, -1+ys, xs, ys); 	
	gl.drawArrays(gl.TRIANGLE_STRIP, 5, 4);
	//draw coronal  width=x, height=z
	// upper left quadrant
	shader.use();
	gl.uniform1i(shader.uniforms["axCorSag"], 1);
	gl.uniform1f(shader.uniforms["slice"], c);
	w = volScale[0]*xAR;
	h = volScale[2]*yAR; 
	gl.uniform4f(shader.uniforms["leftBottomWidthHeight"], -w, 0, w, h);
	gl.drawArrays(gl.TRIANGLE_STRIP, 5, 4);
	//draw sagital width=y, height=z
	//  upper right quadrant
	shader.use();
	w = volScale[1]*xAR;
	h = volScale[2]*yAR; 
	gl.uniform1i(shader.uniforms["axCorSag"], 2);
	gl.uniform1f(shader.uniforms["slice"], s);
	gl.uniform4f(shader.uniforms["leftBottomWidthHeight"], 0, 0, w, h); 
	gl.drawArrays(gl.TRIANGLE_STRIP, 5, 4);

  gl.viewport(gl.canvas.width / 2, 0, gl.canvas.width / 2, gl.canvas.height / 2);
  // Wait for rendering to actually finish
  gl.finish()
}