<template>
  <div class="viewer" id="viewer" >
    <v-dialog
      v-model="dialog"
      max-width="400">
      <v-color-picker width=400 mode='rgba' v-model="crosshairColor" @input="onCrosshairColorChange">
      </v-color-picker>
    </v-dialog>

    <v-dialog
      v-model="discoMode"
      max-width="400">
      <v-card color="rgba(0, 0, 0, 0.4)">
        <v-row no-gutters>  
          <v-spacer></v-spacer>
          <h2 style="color: white;">Disco mode</h2>
          <v-spacer></v-spacer>
        </v-row>
      </v-card>
    </v-dialog>
  </div>
</template>
<script>
import * as Hammer from 'hammerjs';
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

    bus.$on('set-2D-slice', function (slicePosVal) {
      nv.sliceScroll2D(slicePosVal, null, null, false) // x,y = null
    });

    bus.$on('set-clip-planes', function (newPlanes) {
      nv.clipPlaneMove(newPlanes)
    });



  },
  
  data() {
    return {
      selectedOverlay: 0,
      last2DSliceVal: 0.5,
      mouseDown: false,
      touchDown: false,
      zDown: false,
      discoMode: false,
      discoModeColorMapTimer: null,
      discoModeCrosshairTimer: null,
      scale: 1,
      dialog: false,
      crosshairColor: { r: 255, g: 0, b: 0, a: 1 },
      colorMaps:['Winter', 'Warm', 'Plasma', 'Viridis', 'Inferno'],
      selectedColorMap: 'Winter',

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

    var gc = new Hammer(canvas); // gesture controller
    gc.get('press').set({ time: 2000 });
    gc.get('pinch').set({ enable: true });

    gl.canvas.addEventListener('mousedown', (e) => {
      e.preventDefault()
      this.dialog = false
      this.mouseDown = true
      var rect = canvas.getBoundingClientRect()
      nv.mouseClick(this.gl, this.overlays[0], e.clientX - rect.left, e.clientY - rect.top)
      nv.mouseDown(e.clientX - rect.left,e.clientY - rect.top)
    })
    
    gl.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault()
      this.dialog = false
      this.touchDown = true
      var rect = canvas.getBoundingClientRect()
      nv.mouseClick(this.gl, this.overlays[0], e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top)
      nv.mouseDown(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top)
    })

    
    gl.canvas.addEventListener('mousemove', (e) => {
      if (this.mouseDown) {
        var rect = canvas.getBoundingClientRect()
        // mouseClick if any 2D mode
        nv.mouseClick(this.gl, this.overlays[0], e.clientX - rect.left, e.clientY - rect.top)
        // mouseMove if 3D render mode
        nv.mouseMove(e.clientX - rect.left,e.clientY - rect.top)
      }
    })

    gl.canvas.addEventListener('touchmove', (e) => {
      if (this.touchDown && e.touches.length < 2) {
        var rect = canvas.getBoundingClientRect()
        nv.mouseClick(this.gl, this.overlays[0], e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top)
        nv.mouseMove(e.touches[0].clientX - rect.left,e.touches[0].clientY - rect.top)
      }
    })


    gc.on('pinchin', () => {
      // scroll 2D slices 
      nv.sliceScroll2D(0.001, null, null)
    })

    gc.on('pinchout', () => {
      // scroll 2D slices 
      nv.sliceScroll2D(-0.001, null, null)
    })

    gl.canvas.addEventListener('wheel', (e) => {
      if (this.zDown) {
        e.preventDefault()
        this.scale += e.deltaY * -0.01
        nv.setScale(this.scale)
      } else {
        // scroll 2D slices 
        e.preventDefault()
        e.stopPropagation()
        var rect = canvas.getBoundingClientRect()
        if (e.deltaY < 0){
          nv.sliceScroll2D(-0.01, e.clientX - rect.left, e.clientY - rect.top)
        } else {
          nv.sliceScroll2D(0.01, e.clientX - rect.left, e.clientY - rect.top)
        }
        
      }
    })

    gc.on('press', () => {
      this.dialog = true
    })

    gl.canvas.addEventListener('mouseup', () => {
      this.mouseDown = false
    })

    gl.canvas.addEventListener('tocuhend', () => {
      this.touchDown = false
    })


    window.addEventListener('keypress', (e) => {
      if (e.key === 'z') {
        this.zDown = true
      }
      if (e.key === 'd') {
        this.discoMode = this.discoMode == false ? true: false
        clearInterval(this.discoModeColorMapTimer)
        clearInterval(this.discoModeCrosshairTimer)
        if (this.discoMode) {
          this.discoModeColorMapTimer = setInterval(
            () => {
              bus.$emit('colormap-change', this.colorMaps[Math.floor(Math.random() * this.colorMaps.length)]);

            }, 200)
          this.discoModeCrosshairTimer = setInterval(
            function () {
              nv.setCrosshairColor([Math.random(), Math.random(), Math.random(), 1])
            }, 200)
        } else {
          bus.$emit('colormap-change', "gray");
          nv.setCrosshairColor([1, 0, 0, 1])

        }
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
    //this.overlays.forEach((overlay, i) =>  nv.loadVolume(overlay, i))
    nv.loadVolume(this.overlays[this.selectedOverlay]); // just load first overlay. addtional overlays are not handled yet
    
    bus.$on('opacity-change', (opacity) => {
      nv.setSliceOpacity(opacity)
    });

  },
};

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
