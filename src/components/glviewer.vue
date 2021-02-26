<template>
  <div class="viewer" id="viewer" >
    <v-dialog
      v-model="dialog"
      max-width="400">
      <v-color-picker width=400 mode='rgba' v-model="crosshairColor" @input="onCrosshairColorChange">
      </v-color-picker>
    </v-dialog>
   
  </div>
</template>
<script>
import * as nv from "../niivue.js";
import {bus} from "@/bus.js"



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
  created () {
    bus.$on('slice-type-change', function (sliceType) {
    nv.setSliceType(sliceType)
});

  },
  
  data() {
    return {
      selectedOverlay: 0,
      mouseDown: false,
      zDown: false,
      scale: 1,
      dialog: false,
      crosshairColor: { r: 255, g: 0, b: 0, a: 1 }
    };
  },
  watch: {
    // watch for changes to hdr property of volume object
    // this detects changes from hdr=null to hdr=real_data
    overlays: {
      deep: true,
      handler () {
        //nv.selectColormap(this.gl, this.overlays[this.selectedOverlay].colorMap)
        //nv.updateGLVolume(this.gl, this.overlays[this.selectedOverlay])
    },

    }
    
      },
  methods: {
    onWindowResize: function() {
      var bottomStatusBarHeight = 100 // this is an estimate
      var canvas = document.querySelector("#gl") 
      var viewer = document.querySelector("#viewer")
      canvas.width =  viewer.clientWidth
      canvas.height = viewer.clientHeight
      // there has to be a better way to handle this resizing. It seems odd to need the document (window) client
      // height for this to work. 
      if (viewer.getBoundingClientRect().bottom > document.documentElement.clientHeight){
        viewer.style.height = document.documentElement.clientHeight - bottomStatusBarHeight
        canvas.height = document.documentElement.clientHeight - bottomStatusBarHeight
      }
      nv.drawSlices(this.gl, this.overlays[this.selectedOverlay])
    },

    onCrosshairColorChange: function() {
      var floatColor = [this.crosshairColor.r/255, this.crosshairColor.g/255, this.crosshairColor.b/255, this.crosshairColor.a]
      nv.setCrosshairColor(floatColor)
    }

  },
  mounted() {
    // get the gl context after the component has been mounted and initialized
    const glEl = document.createElement('canvas')
    glEl.classList.add('fillParent')
    const viewer = document.querySelector("#viewer")
    glEl.id = "gl"
    glEl.width = viewer.clientWidth//viewer.offsetWidth-1
    glEl.height = viewer.clientHeight//viewer.offsetHeight-1
    viewer.appendChild(glEl)
    const canvas = document.querySelector("#gl");
    const gl = canvas.getContext("webgl2");

    gl.canvas.addEventListener('mousedown', (e) => {
      e.preventDefault()
      this.dialog = false
      this.mouseDown = true
      var rect = canvas.getBoundingClientRect()
      nv.mouseClick(this.gl, this.overlays[0], e.clientX - rect.left, e.clientY - rect.top)
      nv.mouseDown(e.clientX - rect.left,e.clientY - rect.top)
    })

    gl.canvas.addEventListener('mousemove', (e) => {
      if (this.mouseDown) {
        var rect = canvas.getBoundingClientRect()
        nv.mouseClick(this.gl, this.overlays[0], e.clientX - rect.left, e.clientY - rect.top)
        nv.mouseMove(e.clientX - rect.left,e.clientY - rect.top)
      }
    })

    gl.canvas.addEventListener('wheel', (e) => {
      if (this.zDown) {
        e.preventDefault()
        this.scale += e.deltaY * -0.01
        nv.setScale(this.scale)
      }
      
    })

    gl.canvas.addEventListener('mouseup', () => {
      this.mouseDown = false
    })

    gl.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault()
      this.dialog = true
    })


    window.addEventListener('keypress', (e) => {
      if (e.key === 'z') {
        this.zDown = true
      }
    })

    window.addEventListener('keyup', (e) => {
      if (e.key === 'z') {
        this.zDown = false
      }
    })

    window.addEventListener('resize', this.onWindowResize)
    this.gl = gl;
    this.gl.enable(this.gl.CULL_FACE);
    this.gl.cullFace(this.gl.FRONT);
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    nv.init(this.gl);
    nv.loadVolume(this.overlays[this.selectedOverlay]); // just load first overlay. addtional overlays are not handled yet

    bus.$on('opacity-change', (opacity) => {
      nv.setSliceOpacity(opacity)
    });

  },
};
/*
min-height: 600px;
  max-height: 600px;
  min-width: 600px;
  max-width: 1200px;
  overflow-x: hidden;
  overflow-y: hidden;
  */
</script>

<style scoped>
.viewer {
  background-color: black;
  width: 100%;
  height:100%;
  line-height:0;
}

.fillParent {
  height: 100%;
  width: 100%;
}

</style>
