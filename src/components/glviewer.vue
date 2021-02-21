<template>
  <div id="viewer">
  </div>
</template>
<script>
import * as nv from "../niivue.js";

export default {
  name: "glviewer",
  /*
  props are passed to the nii-vue component from it's parent
  they can be used. Similar to passing variables to a function
  */
  props: {
    overlays: Array,
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
    "volume.hdr": function () {
      nv.selectColormap(this.gl, "gray")
      nv.updateGLVolume(this.gl, this.volume, 0.5, 0.5, 0.5)
    },
  },
  mounted() {
    // get the gl context after the component has been mounted and initialized
    const glEl = document.createElement('canvas')
    const viewer = document.querySelector("#viewer")
    glEl.id = "gl"
    glEl.width = viewer.offsetWidth-1
    glEl.height = viewer.offsetHeight-1
    viewer.appendChild(glEl)
    const canvas = document.querySelector("#gl");
    const gl = canvas.getContext("webgl2");
    gl.canvas.addEventListener('mousedown', (e) => {
      const rect = canvas.getBoundingClientRect()
      nv.mouse.x = e.clientX - rect.left
      nv.mouse.y = e.clientY - rect.top
      console.log(nv.mouse)
    })
    this.gl = gl;
    this.gl.enable(this.gl.CULL_FACE);
    this.gl.cullFace(this.gl.FRONT);
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
    nv.loadVolume(this.overlays[0].volumeURL, this.volume); // just load first overlay. addtional overlays are not handled yet
  },
};
</script>

<style scoped>
#viewer {
  background-color: black;
  min-width: 100%;
  height: 100%;
  min-height: 600px;
}

body {
  background-color: black;
}
</style>
