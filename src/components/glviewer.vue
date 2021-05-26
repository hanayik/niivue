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
// import * as Hammer from 'hammerjs';
// import {Niivue} from "../niivue.js";
import {Niivue} from '@niivue/niivue'
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
    
  },
  
  data() {
    return {
      niivue: null,
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
  // watch: {
  //   // watch for changes to hdr property of volume object
  //   // this detects changes from hdr=null to hdr=real_data
  //   overlays: {
  //     deep: true,
  //     handler () {
  //       //nv.selectColormap(this.gl, this.overlays[this.selectedOverlay].colorMap)
  //       //nv.updateGLVolume(this.gl, this.overlays[this.selectedOverlay])
  //   },

  //   }
    
  //     },
  methods: {
    setNewPos: function(){
      let newMM = this.niivue.frac2mm([this.niivue.scene.crosshairPos[0],this.niivue.scene.crosshairPos[1],this.niivue.scene.crosshairPos[2]]); 
      bus.$emit('mm-change', newMM);

    },

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
      this.niivue.drawScene()
    },

    onCrosshairColorChange: function() {
      var floatColor = [this.crosshairColor.r/255, this.crosshairColor.g/255, this.crosshairColor.b/255, this.crosshairColor.a]
      this.niivue.setCrosshairColor(floatColor)
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

    this.niivue = new Niivue({}).attachTo('gl')
    this.niivue.resizeListener = this.onWindowResize
    window.addEventListener('resize', this.niivue.resizeListener.bind(this)) 
    
    this.niivue.loadVolumes(this.overlays) // pass in all overlays (an array)

    setTimeout(() => {
      for (var i=0; i<this.overlays.length; i++){
      console.log('intensity-range-update')
      console.log(this.overlays[i].cal_max)
      // console.log(this.overlays[i].cal_max)
      this.overlays[i].intensityRange = [this.overlays[i].cal_min, this.overlays[i].cal_max]
      var intensityRange = [this.overlays[i].cal_min, this.overlays[i].cal_max]
      console.log(this.overlays[i].intensityRange)
      bus.$emit('intensity-range-update', {volIdx:i, newRangeArr:intensityRange});
    }
    // bus.$emit('intensity-range-update');
    }, 3000);
    console.log('blah')
    
    
    bus.$on('opacity-change', (opacity) => {
      this.niivue.setOpacity(opacity.volIdx, opacity.newOpacity)
    });

    bus.$on('intensity-change', (intensity) => {
      // this.niivue.setOpacity(intensity.volIdx, intensity.newRangeArr)
      this.overlays[intensity.volIdx].cal_min = intensity.newRangeArr[0] 
      this.overlays[intensity.volIdx].cal_max = intensity.newRangeArr[1] 
      this.niivue.updateGLVolume(this.overlays);
    });

    bus.$on('slice-type-change', function (sliceType) {
      this.niivue.setSliceType(sliceType)
    }.bind(this));

    bus.$on('set-2D-slice', function (slicePosVal) {
      this.niivue.sliceScroll2D(slicePosVal, null, null, false) // x,y = null
    }.bind(this));

    bus.$on('set-clip-planes', function (newPlanes) {
      this.niivue.clipPlaneUpdate(newPlanes)
    }.bind(this));

    bus.$on('colormap-change', function () {
      this.niivue.loadVolumes(this.overlays); 
    }.bind(this));

    bus.$on('refresh', function () {
      this.niivue.updateGLVolume(this.overlays); 
    }.bind(this));
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
