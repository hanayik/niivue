<template>
  <div id="viewer" ></div>
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
      selectedOverlay: 0
    };
  },
  watch: {
    // watch for changes to hdr property of volume object
    // this detects changes from hdr=null to hdr=real_data
    overlays: {
      deep: true,
      handler () {
        nv.selectColormap(this.gl, this.overlays[this.selectedOverlay].colorMap)
        nv.updateGLVolume(this.gl, this.overlays[this.selectedOverlay])
    },

    }
    
      },
  methods: {
    onWindowResize: function() {
      var canvas = document.querySelector("#gl") 
      var viewer = document.querySelector("#viewer")
      canvas.width = viewer.offsetWidth-1
      canvas.height = viewer.offsetHeight-1
      nv.drawSlices(this.gl, this.overlays[this.selectedOverlay])
    }
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
      //nv.mouse.x = e.clientX - rect.left
      //nv.mouse.y = e.clientY - rect.top
      nv.mouseClick(this.gl, this.overlays[0], e.clientX - rect.left, e.clientY - rect.top)
      //console.log(nv.mouse)
    })

    window.addEventListener('resize', this.onWindowResize)
    this.gl = gl;
    this.gl.enable(this.gl.CULL_FACE);
    this.gl.cullFace(this.gl.FRONT);
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
    nv.init(this.gl);
    nv.loadVolume(this.overlays[this.selectedOverlay]); // just load first overlay. addtional overlays are not handled yet

  },
};
</script>

<style scoped>
#viewer {
  background-color: black;
  width: 100%;
  height:100%;
  min-height: 600px;
  max-height: 600px;
  min-width: 600px;
  max-width: 1200px;
  overflow-x: hidden;
  overflow-y: hidden;
}

body {
  background-color: black;
}
</style>
