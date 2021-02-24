export var vertRenderShader =
`#version 300 es
#line 434
layout(location=0) in vec3 pos;
uniform mat4 mvpMtx;
out vec3 vColor;
void main(void) {
	gl_Position = mvpMtx * vec4((pos.xyz - 0.5), 1.0);
	vColor = pos;
}`;

export var fragRenderShader =
`#version 300 es
#line 456
precision highp int;
precision highp float;
uniform vec3 rayDir;
in vec3 vColor;
out vec4 fColor;
void main() {
	fColor = vec4(vColor, 1.0);
}`;

export var vertShader =
`#version 300 es
#line 4
layout(location=0) in vec3 pos;
uniform mat4 proj_view;
uniform vec3 eye_pos;
uniform vec3 volume_scale;
out vec3 vray_dir;
flat out vec3 transformed_eye;
void main(void) {
	vec3 volume_translation = vec3(0.5) - volume_scale * 0.5;
	gl_Position = proj_view * vec4(pos * volume_scale + volume_translation, 1);
	transformed_eye = (eye_pos - volume_translation) / volume_scale;
	vray_dir = pos - transformed_eye;
}`;

export var fragShaderLighting =
`#version 300 es
#line 20
precision highp int;
precision highp float;
uniform highp sampler3D volume;
uniform highp sampler3D gradients;
uniform highp sampler2D colormap;
uniform ivec3 volume_dims;
uniform float dt_scale;
uniform vec3 light_pos;
in vec3 vray_dir;
flat in vec3 transformed_eye;
out vec4 color;

vec2 intersect_box(vec3 orig, vec3 dir) {
	const vec3 box_min = vec3(0);
	const vec3 box_max = vec3(1);
	vec3 inv_dir = 1.0 / dir;
	vec3 tmin_tmp = (box_min - orig) * inv_dir;
	vec3 tmax_tmp = (box_max - orig) * inv_dir;
	vec3 tmin = min(tmin_tmp, tmax_tmp);
	vec3 tmax = max(tmin_tmp, tmax_tmp);
	float t0 = max(tmin.x, max(tmin.y, tmin.z));
	float t1 = min(tmax.x, min(tmax.y, tmax.z));
	return vec2(t0, t1);
}

// Pseudo-random number gen from
// http://www.reedbeta.com/blog/quick-and-easy-gpu-random-numbers-in-d3d11/
// with some tweaks for the range of values
float wang_hash(int seed) {
	seed = (seed ^ 61) ^ (seed >> 16);
	seed *= 9;
	seed = seed ^ (seed >> 4);
	seed *= 0x27d4eb2d;
	seed = seed ^ (seed >> 15);
	return float(seed % 2147483647) / float(2147483647);
}

void main(void) {
	float ambient = 1.0;
	float diffuse = 0.2;
	float specular = 0.2;
	float shininess = 10.0;
	vec3 ray_dir = normalize(vray_dir);
	vec3 lightPosition = normalize(light_pos) ;
	vec3 lightdir = normalize(ray_dir);
	vec2 t_hit = intersect_box(transformed_eye, ray_dir);
	if (t_hit.x > t_hit.y)
		discard;
	t_hit.x = max(t_hit.x, 0.0);
	vec3 dt_vec = 1.0 / (vec3(volume_dims) * abs(ray_dir));
	float dt = dt_scale * min(dt_vec.x, min(dt_vec.y, dt_vec.z));
	float offset = wang_hash(int(gl_FragCoord.x + 640.0 * gl_FragCoord.y));
	vec3 p = transformed_eye + (t_hit.x + offset * dt) * ray_dir;
	for (float t = t_hit.x; t < t_hit.y; t += dt) {
		float val = texture(volume, p).r;
		vec4 val_color = texture(colormap, vec2(val, 0.5)).rgba;
		//use gradients to estimate 'a'mbient, 'd'iffuse and 's'pecular lighting
		vec4 gradSample= texture(gradients, p);
		gradSample.rgb = normalize(gradSample.rgb*2.0 - 1.0);
		float lightNormDot = dot(gradSample.rgb, lightPosition); //with respect to light location
		vec3 a = val_color.rgb * ambient;
		vec3 d = max(lightNormDot, 0.0) * val_color.rgb * diffuse;
		float s =   specular * pow(max(dot(reflect(lightPosition, gradSample.rgb), lightdir), 0.0), shininess);
		val_color.rgb = a + d + s; //color = ambient + diffuse + specular
		//accumulate color:
		val_color.a = 1.0-pow((1.0 - val_color.a), dt_scale); //opacityCorrection
		color.rgb += (1.0 - color.a) * val_color.a * val_color.rgb;
		color.a += (1.0 - color.a) * val_color.a;
		if (color.a >= 0.95)
			break;
		p += ray_dir * dt;
	}
}`;

export var fragShaderGradients =
`#version 300 es
#line 97
precision highp int;
precision highp float;
uniform highp sampler3D gradients;
uniform ivec3 volume_dims;
uniform float dt_scale;
in vec3 vray_dir;
flat in vec3 transformed_eye;
out vec4 color;

vec2 intersect_box(vec3 orig, vec3 dir) {
	const vec3 box_min = vec3(0);
	const vec3 box_max = vec3(1);
	vec3 inv_dir = 1.0 / dir;
	vec3 tmin_tmp = (box_min - orig) * inv_dir;
	vec3 tmax_tmp = (box_max - orig) * inv_dir;
	vec3 tmin = min(tmin_tmp, tmax_tmp);
	vec3 tmax = max(tmin_tmp, tmax_tmp);
	float t0 = max(tmin.x, max(tmin.y, tmin.z));
	float t1 = min(tmax.x, min(tmax.y, tmax.z));
	return vec2(t0, t1);
}

// Pseudo-random number gen from
// http://www.reedbeta.com/blog/quick-and-easy-gpu-random-numbers-in-d3d11/
// with some tweaks for the range of values
float wang_hash(int seed) {
	seed = (seed ^ 61) ^ (seed >> 16);
	seed *= 9;
	seed = seed ^ (seed >> 4);
	seed *= 0x27d4eb2d;
	seed = seed ^ (seed >> 15);
	return float(seed % 2147483647) / float(2147483647);
}

void main(void) {
	vec3 ray_dir = normalize(vray_dir);
	vec2 t_hit = intersect_box(transformed_eye, ray_dir);
	if (t_hit.x > t_hit.y)
		discard;
	t_hit.x = max(t_hit.x, 0.0);
	vec3 dt_vec = 1.0 / (vec3(volume_dims) * abs(ray_dir));
	float dt = dt_scale * min(dt_vec.x, min(dt_vec.y, dt_vec.z));
	float offset = wang_hash(int(gl_FragCoord.x + 640.0 * gl_FragCoord.y));
	vec3 p = transformed_eye + (t_hit.x + offset * dt) * ray_dir;
	for (float t = t_hit.x; t < t_hit.y; t += dt) {
		vec4 gradSample = texture(gradients, p);
		vec4 val_color = gradSample;
		//val_color.rgb = abs((gradSample.rgb * 2.0) - 1.0); //optional
		//accumulate color:
		val_color.a = 1.0-pow((1.0 - val_color.a), dt_scale); //opacityCorrection
		color.rgb += (1.0 - color.a) * val_color.a * val_color.rgb;
		color.a += (1.0 - color.a) * val_color.a;
		if (color.a >= 0.95)
			break;
		p += ray_dir * dt;
	}
}`;


export var fragShader =
`#version 300 es
#line 159
precision highp int;
precision highp float;
uniform highp sampler3D volume;
uniform highp sampler2D colormap;
uniform ivec3 volume_dims;
uniform float dt_scale;
in vec3 vray_dir;
flat in vec3 transformed_eye;
out vec4 color;

vec2 intersect_box(vec3 orig, vec3 dir) {
	const vec3 box_min = vec3(0);
	const vec3 box_max = vec3(1);
	vec3 inv_dir = 1.0 / dir;
	vec3 tmin_tmp = (box_min - orig) * inv_dir;
	vec3 tmax_tmp = (box_max - orig) * inv_dir;
	vec3 tmin = min(tmin_tmp, tmax_tmp);
	vec3 tmax = max(tmin_tmp, tmax_tmp);
	float t0 = max(tmin.x, max(tmin.y, tmin.z));
	float t1 = min(tmax.x, min(tmax.y, tmax.z));
	return vec2(t0, t1);
}

// Pseudo-random number gen from
// http://www.reedbeta.com/blog/quick-and-easy-gpu-random-numbers-in-d3d11/
// with some tweaks for the range of values
float wang_hash(int seed) {
	seed = (seed ^ 61) ^ (seed >> 16);
	seed *= 9;
	seed = seed ^ (seed >> 4);
	seed *= 0x27d4eb2d;
	seed = seed ^ (seed >> 15);
	return float(seed % 2147483647) / float(2147483647);
}

void main(void) {
	vec3 ray_dir = normalize(vray_dir);
	vec2 t_hit = intersect_box(transformed_eye, ray_dir);
	if (t_hit.x > t_hit.y)
		discard;
	t_hit.x = max(t_hit.x, 0.0);
	vec3 dt_vec = 1.0 / (vec3(volume_dims) * abs(ray_dir));
	float dt = dt_scale * min(dt_vec.x, min(dt_vec.y, dt_vec.z));
	float offset = wang_hash(int(gl_FragCoord.x + 640.0 * gl_FragCoord.y));
	vec3 p = transformed_eye + (t_hit.x + offset * dt) * ray_dir;
	for (float t = t_hit.x; t < t_hit.y; t += dt) {
		float val = texture(volume, p).r;
		vec4 val_color = texture(colormap, vec2(val, 0.5)).rgba;
		val_color.a = 1.0-pow((1.0 - val_color.a), dt_scale); //opacityCorrection
		color.rgb += (1.0 - color.a) * val_color.a * val_color.rgb;
		color.a += (1.0 - color.a) * val_color.a;
		if (color.a >= 0.95)
			break;
		p += ray_dir * dt;
	}
}`;

export var fragShaderMIP =
`#version 300 es
#line 219
precision highp int;
precision highp float;
uniform highp sampler3D volume;
uniform highp sampler2D colormap;
uniform ivec3 volume_dims;
uniform float dt_scale;
in vec3 vray_dir;
flat in vec3 transformed_eye;
out vec4 color;

vec2 intersect_box(vec3 orig, vec3 dir) {
	const vec3 box_min = vec3(0);
	const vec3 box_max = vec3(1);
	vec3 inv_dir = 1.0 / dir;
	vec3 tmin_tmp = (box_min - orig) * inv_dir;
	vec3 tmax_tmp = (box_max - orig) * inv_dir;
	vec3 tmin = min(tmin_tmp, tmax_tmp);
	vec3 tmax = max(tmin_tmp, tmax_tmp);
	float t0 = max(tmin.x, max(tmin.y, tmin.z));
	float t1 = min(tmax.x, min(tmax.y, tmax.z));
	return vec2(t0, t1);
}

// Pseudo-random number gen from
// http://www.reedbeta.com/blog/quick-and-easy-gpu-random-numbers-in-d3d11/
// with some tweaks for the range of values
float wang_hash(int seed) {
	seed = (seed ^ 61) ^ (seed >> 16);
	seed *= 9;
	seed = seed ^ (seed >> 4);
	seed *= 0x27d4eb2d;
	seed = seed ^ (seed >> 15);
	return float(seed % 2147483647) / float(2147483647);
}

void main(void) {
	vec3 ray_dir = normalize(vray_dir);
	vec2 t_hit = intersect_box(transformed_eye, ray_dir);
	if (t_hit.x > t_hit.y)
		discard;
	t_hit.x = max(t_hit.x, 0.0);
	vec3 dt_vec = 1.0 / (vec3(volume_dims) * abs(ray_dir));
	float dt = dt_scale * min(dt_vec.x, min(dt_vec.y, dt_vec.z));
	float offset = wang_hash(int(gl_FragCoord.x + 640.0 * gl_FragCoord.y));
	vec3 p = transformed_eye + (t_hit.x + offset * dt) * ray_dir;
	float maxA = 0.0;
	for (float t = t_hit.x; t < t_hit.y; t += dt) {
		float val = texture(volume, p).r;
		//select maximum intensity. We could write this:
		// if (val > maxA) maxA = val;
		//http://theorangeduck.com/page/avoiding-shader-conditionals
		maxA = mix(val, maxA, max(sign(maxA - val), 0.0));
		p += ray_dir * dt;
	}
	if (maxA > 0.0)
		color = texture(colormap, vec2(maxA, 0.5)).rgba;
	color.r = 1.0;
}`;

export var blurVertShader =
`#version 300 es
#line 280
precision highp int;
precision highp float;
in vec3 vPos;
out vec2 TexCoord;
void main() {
    TexCoord = vPos.xy;
    gl_Position = vec4( (vPos.xy-vec2(0.5,0.5))* 2.0, 0.0, 1.0);
}`;

export var blurFragShader =
`#version 300 es
#line 292
precision highp int;
precision highp float;
in vec2 TexCoord;
out vec4 FragColor;
uniform float coordZ;
uniform float dX;
uniform float dY;
uniform float dZ;
uniform highp sampler3D intensityVol;
void main(void) {
 vec3 vx = vec3(TexCoord.xy, coordZ);
 vec4 samp = texture(intensityVol,vx+vec3(+dX,+dY,+dZ));
 samp += texture(intensityVol,vx+vec3(+dX,+dY,-dZ));
 samp += texture(intensityVol,vx+vec3(+dX,-dY,+dZ));
 samp += texture(intensityVol,vx+vec3(+dX,-dY,-dZ));
 samp += texture(intensityVol,vx+vec3(-dX,+dY,+dZ));
 samp += texture(intensityVol,vx+vec3(-dX,+dY,-dZ));
 samp += texture(intensityVol,vx+vec3(-dX,-dY,+dZ));
 samp += texture(intensityVol,vx+vec3(-dX,-dY,-dZ));
 FragColor = samp*0.125;
}`;

export var sobelFragShader =
`#version 300 es
#line 317
precision highp int;
precision highp float;
in vec2 TexCoord;
out vec4 FragColor;
uniform float coordZ;
uniform float dX;
uniform float dY;
uniform float dZ;
uniform highp sampler3D intensityVol;
void main(void) {
  vec3 vx = vec3(TexCoord.xy, coordZ);
  //Neighboring voxels 'T'op/'B'ottom, 'A'nterior/'P'osterior, 'R'ight/'L'eft
  float TAR = texture(intensityVol,vx+vec3(+dX,+dY,+dZ)).r;
  float TAL = texture(intensityVol,vx+vec3(+dX,+dY,-dZ)).r;
  float TPR = texture(intensityVol,vx+vec3(+dX,-dY,+dZ)).r;
  float TPL = texture(intensityVol,vx+vec3(+dX,-dY,-dZ)).r;
  float BAR = texture(intensityVol,vx+vec3(-dX,+dY,+dZ)).r;
  float BAL = texture(intensityVol,vx+vec3(-dX,+dY,-dZ)).r;
  float BPR = texture(intensityVol,vx+vec3(-dX,-dY,+dZ)).r;
  float BPL = texture(intensityVol,vx+vec3(-dX,-dY,-dZ)).r;
  vec4 gradientSample = vec4 (0.0, 0.0, 0.0, 0.0);
  gradientSample.r =   BAR+BAL+BPR+BPL -TAR-TAL-TPR-TPL;
  gradientSample.g =  TPR+TPL+BPR+BPL -TAR-TAL-BAR-BAL;
  gradientSample.b =  TAL+TPL+BAL+BPL -TAR-TPR-BAR-BPR;
  gradientSample.a = (abs(gradientSample.r)+abs(gradientSample.g)+abs(gradientSample.b))*0.29;
  gradientSample.rgb = normalize(gradientSample.rgb);
  gradientSample.rgb =  (gradientSample.rgb * 0.5)+0.5;
  FragColor = gradientSample;
}`;

export var fragShaderMatCap =
`#version 300 es
#line 350
precision highp int;
precision highp float;
uniform highp sampler3D volume;
uniform highp sampler3D gradients;
uniform highp sampler2D colormap;
uniform sampler2D matcap;
uniform ivec3 volume_dims;
uniform mat4 proj_view;
uniform mat4 normal_matrix;
uniform float dt_scale;
in vec3 vray_dir;
flat in vec3 transformed_eye;
out vec4 color;

vec2 intersect_box(vec3 orig, vec3 dir) {
	const vec3 box_min = vec3(0);
	const vec3 box_max = vec3(1);
	vec3 inv_dir = 1.0 / dir;
	vec3 tmin_tmp = (box_min - orig) * inv_dir;
	vec3 tmax_tmp = (box_max - orig) * inv_dir;
	vec3 tmin = min(tmin_tmp, tmax_tmp);
	vec3 tmax = max(tmin_tmp, tmax_tmp);
	float t0 = max(tmin.x, max(tmin.y, tmin.z));
	float t1 = min(tmax.x, min(tmax.y, tmax.z));
	return vec2(t0, t1);
}

// Pseudo-random number gen from
// http://www.reedbeta.com/blog/quick-and-easy-gpu-random-numbers-in-d3d11/
// with some tweaks for the range of values
float wang_hash(int seed) {
	seed = (seed ^ 61) ^ (seed >> 16);
	seed *= 9;
	seed = seed ^ (seed >> 4);
	seed *= 0x27d4eb2d;
	seed = seed ^ (seed >> 15);
	return float(seed % 2147483647) / float(2147483647);
}

mat3 mat3_emu(mat4 m4) {
//https://www.khronos.org/registry/webgl/conformance-suites/1.0.2/conformance/glsl/matrices/glsl-mat4-to-mat3.html
  return mat3(
      m4[0][0], m4[0][1], m4[0][2],
      m4[1][0], m4[1][1], m4[1][2],
      m4[2][0], m4[2][1], m4[2][2]);
}

void main(void) {
	float matCapMix = 1.0; //0..1: 0=100% color from matcap, 1= color is volume*matcap
	float brighten = 1.0 + (matCapMix/2.0); //modulating makes average intensity darker
	vec3 ray_dir = normalize(vray_dir);
	vec2 t_hit = intersect_box(transformed_eye, ray_dir);
	if (t_hit.x > t_hit.y)
		discard;
	t_hit.x = max(t_hit.x, 0.0);
	vec3 dt_vec = 1.0 / (vec3(volume_dims) * abs(ray_dir));
	float dt = dt_scale * min(dt_vec.x, min(dt_vec.y, dt_vec.z));
	float offset = wang_hash(int(gl_FragCoord.x + 640.0 * gl_FragCoord.y));
	vec3 p = transformed_eye + (t_hit.x + offset * dt) * ray_dir;
	mat3 normalMatrix = mat3_emu(normal_matrix);
	for (float t = t_hit.x; t < t_hit.y; t += dt) {
		float val = texture(volume, p).r;
		vec4 val_color = texture(colormap, vec2(val, 0.5)).rgba;
		vec4 gradSample = texture(gradients, p);
		gradSample.rgb = normalize(gradSample.rgb*2.0 - 1.0);
		vec3 n = normalize(normalMatrix * gradSample.rgb);
		vec2 uv = n.xy * 0.5 + 0.5;
		uv.y = 1.0 - uv.y;
		vec3 matcap_color = texture(matcap, vec2(uv.xy)).rgb;
		matcap_color = mix(val_color.rgb, matcap_color, matCapMix);
		val_color.rgb = val_color.rgb * matcap_color * brighten;
		val_color.a = 1.0-pow((1.0 - val_color.a), dt_scale); //opacityCorrection
		color.rgb += (1.0 - color.a) * val_color.a * val_color.rgb;
		color.a += (1.0 - color.a) * val_color.a;
		if (color.a >= 0.95)
			break;
		p += ray_dir * dt;
	}
}`;

export var vertSliceShader =
`#version 300 es
#line 434
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
#line 456
precision highp int;
precision highp float;
uniform highp sampler3D volume;
uniform highp sampler2D colormap;
in vec3 texPos;
out vec4 color;
void main() {
    //color = vec4(texPos, 1.0); //show texture sample location
    //color = texture(volume, texPos); //show color index
    float val = texture(volume, texPos).r;
	//color = texture(colormap, vec2(val, 0.5)); //apply color scheme, use texture Alpha
	color = vec4(texture(colormap, vec2(val, 0.5)).rgb, 1.0); //apply color scheme, use texture Alpha	
}`;

export var vertLineShader =
`#version 300 es
#line 434
layout(location=0) in vec3 pos;
uniform vec4 leftBottomWidthHeight;
void main(void) {
	gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
	gl_Position.x = leftBottomWidthHeight.x + (pos.x * leftBottomWidthHeight.b);
	gl_Position.y = leftBottomWidthHeight.y + (pos.y * leftBottomWidthHeight.a);
}`;

export var fragLineShader =
`#version 300 es
#line 456
precision highp int;
precision highp float;
uniform vec4 lineColor;
out vec4 color;
void main() {
	color = lineColor;
	//color = vec4(1.0, 0.0, 0.0, 1.0);	
}`;