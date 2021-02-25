export var vertRenderShader =
`#version 300 es
#line 4
layout(location=0) in vec3 pos;
uniform mat4 mvpMtx;
out vec3 vColor;
void main(void) {
	gl_Position = mvpMtx * vec4(2.0 * (pos.xyz - 0.5), 1.0);
	vColor = pos;
}`;

export var fragRenderShader =
`#version 300 es
#line 15
precision highp int;
precision highp float;
uniform vec3 rayDir;
uniform vec3 texVox;
uniform highp sampler3D volume;
uniform highp sampler2D colormap;
in vec3 vColor;
out vec4 fColor;
vec3 GetBackPosition (vec3 startPosition) {
 vec3 invR = 1.0 / rayDir;
 vec3 tbot = invR * (vec3(0.0)-startPosition);
 vec3 ttop = invR * (vec3(1.0)-startPosition);
 vec3 tmax = max(ttop, tbot);
 vec2 t = min(tmax.xx, tmax.yz);
 return startPosition + (rayDir * min(t.x, t.y));
}
void main() {
    fColor = vec4(0.0,0.0,0.0,0.0);
	vec3 start = vColor;
	//fColor = vec4(start, 1.0); return;
	vec3 backPosition = GetBackPosition(start);
	//fColor = vec4(backPosition, 1.0); return;
    vec3 dir = backPosition - start;
    float len = length(dir);
	float lenVox = length((texVox * start) - (texVox * backPosition));
	float sliceSize = len / lenVox; //e.g. if ray length is 1.0 and traverses 50 voxels, each voxel is 0.02 in unit cube
	float stepSize = sliceSize; //quality: larger step is faster traversal, but fewer samples
	float opacityCorrection = stepSize/sliceSize;
    dir = normalize(dir);
	vec4 deltaDir = vec4(dir.xyz * stepSize, stepSize);
	vec4 samplePos = vec4(start.xyz, 0.0); //ray position
	//start: OPTIONAL fast pass: rapid traversal until first hit
	float stepSizeFast = sliceSize * 1.9;
	vec4 deltaDirFast = vec4(dir.xyz * stepSizeFast, stepSizeFast);
	while (samplePos.a <= len) {
		float val = texture(volume, samplePos.xyz).r;
		if (val > 0.01) break;
		samplePos += deltaDirFast; //advance ray position
	}
	if (samplePos.a > len) return;
	samplePos -= deltaDirFast;
	if (samplePos.a < 0.0)
		vec4 samplePos = vec4(start.xyz, 0.0); //ray position
	//end: fast pass
	vec4 colAcc = vec4(0.0,0.0,0.0,0.0);
	const float earlyTermination = 0.95;
    float ran = fract(sin(gl_FragCoord.x * 12.9898 + gl_FragCoord.y * 78.233) * 43758.5453);
    samplePos += deltaDir * ran; //jitter ray
	while (samplePos.a <= len) {
		float val = texture(volume, samplePos.xyz).r;
		samplePos += deltaDir; //advance ray position
		if (val < 0.01) continue;
		vec4 colorSample = texture(colormap, vec2(val, 0.5)).rgba;
		colorSample.a = 1.0-pow((1.0 - colorSample.a), opacityCorrection);
		colorSample.rgb *= colorSample.a;
		colAcc= (1.0 - colAcc.a) * colorSample + colAcc;
		if ( colAcc.a > earlyTermination )
			break;
	}
	colAcc.a = colAcc.a / earlyTermination;
	fColor = colAcc;
}`;

export var vertSliceShader =
`#version 300 es
#line 81
layout(location=0) in vec3 pos;
uniform int axCorSag;
uniform float slice;
uniform vec4 leftBottomWidthHeight;
out vec3 texPos;
void main(void) {
	gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
	gl_Position.x = leftBottomWidthHeight.x + (pos.x * leftBottomWidthHeight.b);
	gl_Position.y = leftBottomWidthHeight.y + (pos.y * leftBottomWidthHeight.a);
	if (axCorSag == 1)
		texPos = vec3(pos.x, slice, pos.y);
	else if (axCorSag == 2)
		texPos = vec3(slice, pos.x, pos.y);
	else
		texPos = vec3(pos.xy, slice);
}`;

export var fragSliceShader =
`#version 300 es
#line 100
precision highp int;
precision highp float;
uniform highp sampler3D volume;
uniform highp sampler2D colormap;
uniform float opacity;
in vec3 texPos;
out vec4 color;
void main() {
	color = vec4(texture(colormap, vec2(texture(volume, texPos).r, 0.5)).rgb, opacity);
}`;

export var vertLineShader =
`#version 300 es
#line 114
layout(location=0) in vec3 pos;
uniform vec4 leftBottomWidthHeight;
void main(void) {
	gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
	gl_Position.x = leftBottomWidthHeight.x + (pos.x * leftBottomWidthHeight.b);
	gl_Position.y = leftBottomWidthHeight.y + (pos.y * leftBottomWidthHeight.a);
}`;

export var fragLineShader =
`#version 300 es
#line 125
precision highp int;
precision highp float;
uniform vec4 lineColor;
out vec4 color;
void main() {
	color = lineColor;
}`;

export var vertColorbarShader =
`#version 300 es
#line 136
layout(location=0) in vec3 pos;
uniform vec4 leftBottomWidthHeight;
out float vColor;
void main(void) {
	gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
	gl_Position.x = leftBottomWidthHeight.x + (pos.x * leftBottomWidthHeight.b);
	gl_Position.y = leftBottomWidthHeight.y + (pos.y * leftBottomWidthHeight.a);
	vColor = pos.x;
}`;

export var fragColorbarShader =
`#version 300 es
#line 149
precision highp int;
precision highp float;
uniform highp sampler2D colormap;
in float vColor;
out vec4 color;
void main() {
	color = vec4(texture(colormap, vec2(vColor, 0.5)).rgb, 1.0);
}`;
