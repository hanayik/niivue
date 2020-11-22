<template>
  <b-container fluid id="viewer">
    <canvas id="gl" width="640" height="480"> </canvas>
  </b-container>
</template>
<script>
import * as nv from "../niivue.js";
// import { Shader } from "../webgl-util/shader.js";
// import { vertSliceShader, fragSliceShader } from "../shader-srcs.js";

export default {
  name: "NiiVue",
  /*
  props are passed to the nii-vue component from it's parent
  they can be used as:

  <nii-vue
    :volumes=[{src: String}] array of objects. src is the String URL or relative file path
  >
  </nii-vue>
  */
  props: {
    filename: String,
    shader: String,
  },
  data() {
    return {
      volume: { hdr: null, img: null },
    };
  },
  watch: {
    // watch for changes to hdr property of volume object
    // this detects changes from hdr=null to hdr=real_data
    "volume.hdr": function (val) {
      console.log(val);

      // nv.bindBlankGL(this.gl, this.volume.hdr)
      // this.sliceShader.use(this.gl)
      // nv.selectColormap(this.gl)
      // var samplingRate = 1.0;
			// this.gl.uniform1f(this.sliceShader.uniforms["dt_scale"], samplingRate);
      // this.gl.uniform1i(this.sliceShader.uniforms["volume"], 0);
      // this.gl.uniform1i(this.sliceShader.uniforms["colormap"], 1);

      nv.updateGLVolume(this.gl, this.volume)

      // nv.drawSlices(this.gl, this.sliceShader, this.volume, 0.5, 0.5, 0.5)
    },
  },
  mounted() {
    // get the gl context after the component has been mounted and initialized
    const canvas = document.querySelector("#gl");
    const gl = canvas.getContext("webgl2");
    this.gl = gl;
    // this.sliceShader = new Shader(this.gl, vertSliceShader, fragSliceShader);
    // this.sliceShader.use(this.gl)
    this.gl.enable(this.gl.CULL_FACE);
    this.gl.cullFace(this.gl.FRONT);
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
    nv.loadVolume(this.filename, this.volume);
  },
};
</script>

<style scoped>
#viewer {
  background-color: black;
  min-width: 100%;
  min-height: 600px;
}

body {
  background-color: black;
}
</style>
