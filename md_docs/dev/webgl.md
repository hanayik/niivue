## Introduction

This project requires WebGL2. This specification was [finalized in January 2017](https://en.wikipedia.org/wiki/WebGL). It is supported by the current Chrome and Firefox browsers, but users of Safari must enable this `experimental` feature. NiiVue exploits WebGL2 features that [are not available in WebGL1](https://webgl2fundamentals.org/webgl/lessons/webgl2-whats-new.html). Specifically, the images are represented using non-Power of two 3D textures. The shaders used by WebGL2 are written using the [OpenGL ES 3.0](https://en.wikipedia.org/wiki/OpenGL_ES)version of the [OpenGL Shading Language (GLSL)](https://en.wikipedia.org/wiki/OpenGL_Shading_Language).

https://gamedev.stackexchange.com/questions/132262/how-to-use-texelfetch
but in OpenGL when specifying an integer vertex attribute you must use glVertexAttribIPointer, not glVertexAttribPointer; see
For glVertexAttribIPointer ... Values are always left as integer values
vec2 copies of the ivec2

##### Textures

The term Textures refers to bitmap images that are stored on the graphics card. The WebGL context can only have a limited number of textures active at one time (with the command `activeTexture` deterimining which textures are available). You can think of these active textures as slots that are available for the shaders to access. NiiVue consistently uses the same slots for specific textures. This means that each draw call does not need to explicitly set the active textures. Therefore, these slots should be considered reserved and not used for other functions.

 - TEXTURE0: Background volume. This 3D scalar bitmap stores the voxel intensities of the background image.
 - TEXTURE1: Background volume colormap. This 1D RGBA bitmap converts the scalar background voxel intensities to RGBA values (e.g. Grayscale, Warm, Winter).
 - TEXTURE2: Overlay volumes. This 3D RGBA bitmap stores the blended values of all loaded overlays.
 - TEXTURE3: Font. This is a 2D bitmap that stores the [multi-channel signed distance field typeface](https://github.com/Chlumsky/msdfgen) 
 - TEXTURE7: Temporary 3D texture: this is used for compute shaders to reorient volumes (e.g. reformat an image from ASR to LIP orientation).

 