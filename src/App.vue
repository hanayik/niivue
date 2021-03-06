<template>
  <v-app>
    <v-app-bar app>
      <!-- make app bar scroll in horizontal direction -->
      <!--
      <v-tabs v-model='tab'>
        <v-tabs-slider color='black'></v-tabs-slider>
        <v-tab
          v-for='item in appTabs'
          :key='item'>
          {{ item }}
        </v-tab>
      </v-tabs>
      -->
      <h2>Niivue</h2>
      <v-spacer>
      </v-spacer>
    </v-app-bar>

    <v-main>
      <v-row style="height:100%">
      <!-- app uses a 12 column layout, so the controls take up 4 columns on the left of the screen -->
      <v-col sm=12 md=12 lg=4>
        <controls :overlays="overlayList">
        </controls>
      </v-col>

      <v-col sm=12 md=12 lg=8>
        <v-toolbar elevation=0 class="pa-0 ma-0">
          <v-btn @click='setSliceType(0)'>A</v-btn>
          <v-btn @click='setSliceType(2)'>S</v-btn>
          <v-btn @click='setSliceType(1)'>C</v-btn>
          <v-btn @click='setSliceType(4)'>R</v-btn>
          <v-btn @click='setSliceType(3)'>MP</v-btn>
          <v-spacer></v-spacer>
        </v-toolbar>
      <v-expansion-panels v-if="viewShown2D == true || viewShown3D == true">
          <v-expansion-panel>
          <v-expansion-panel-header>
            <v-row no-gutters class="align-center">
              Controls
              <v-icon class="mx-2"> mdi-arrow-expand-vertical </v-icon>
            </v-row>
          </v-expansion-panel-header>
          <v-expansion-panel-content>
            <v-row v-if="viewShown2D == true">
            <v-slider
              v-model="sliceScrollVal"
              step="0.01"
              max="1"
              min="0"
              thumb-label
              @input="onSliceSlider2D"
              label="slice"
            >
            </v-slider>
          </v-row>
          <v-row v-if="viewShown3D == true">
            <v-slider
                v-model="clipValX"
                step="0.005"
                max="1"
                min="-1"
                thumb-label
                @input="onClipPlaneChange"
                label="clip x"
              >
            </v-slider>
          </v-row>
          <v-row v-if="viewShown3D == true">
            <v-slider
                v-model="clipValY"
                step="0.005"
                max="1"
                min="-1"
                thumb-label
                @input="onClipPlaneChange"
                label="clip y"
              >
            </v-slider>
          </v-row>
          <v-row v-if="viewShown3D == true">
            <v-slider
                v-model="clipValZ"
                step="0.005"
                max="1"
                min="-1"
                thumb-label
                @input="onClipPlaneChange"
                label="clip z"
              >
            </v-slider>
          </v-row>
          <v-row v-if="viewShown3D == true">
            <v-slider
                v-model="clipValW"
                step="0.005"
                max="0.5"
                min="-0.5"
                thumb-label
                @input="onClipPlaneChange"
                label="clip w"
              >
            </v-slider>
          </v-row>
          <v-row>
            <v-btn @click="onResetClipPlane" class='mx-auto'>reset</v-btn>
          </v-row>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>

        <glviewer :overlays="overlayList"></glviewer>
      </v-col>
    </v-row>
    </v-main>
    <v-footer app>
      <v-row >
        <v-col align="center" justify="center" >
          <span class='text-caption'>{{ coordinateString }}</span> 
        </v-col>
      </v-row>
    </v-footer>
  </v-app>
</template>

<script>
import controls from './components/controls.vue'
import glviewer from './components/glviewer.vue'
import {bus} from "@/bus.js"

export default {
  name: 'App',

  components: {
    controls,
    glviewer
  },

  created () {
    bus.$on('crosshair-pos-change', (posString) => {
    this.coordinateString = posString 
    });

  },
  data (){
    return {
      tab: null,
      viewShown2D: false,
      viewShown3D: false,
      clipValX: 0,
      clipValY: 0,
      clipValZ: 0,
      clipValW: 0,
      sliceScrollVal: 0.5,
      appTabs: ['Menu', 'Draw', 'Edit', 'Scripting'],
      coordinateString: '0x0x0',
      overlayList: [
        {
          volumeURL: "./spm152.nii.gz",
          volume: {hdr: null, img: null},
          name: "standard",
          intensityMin: 0,
          intensityMax: 100,
          intensityRange:[0, 100],
          colorMap: "gray", // gray
          opacity: 100,
        },
        {
          volumeURL: "./motor.nii.gz",
          volume: {hdr: null, img: null},
          name: "motor",
          intensityMin: 0,
          intensityMax: 100,
          intensityRange:[0, 100],
          colorMap: "Warm", // gray
          opacity: 100,
        },

      ]
    }
  },

  methods: {
    setSliceType: function(sliceType) {
      if (sliceType < 3 ){
        this.viewShown2D = true
        this.viewShown3D = false
      } else if (sliceType == 4) {
        this.viewShown2D = false
        this.viewShown3D = true
      } else {
        this.viewShown2D = false
        this.viewShown3D = false
      }
      bus.$emit('slice-type-change', sliceType);
    },

    onSliceSlider2D: function() {
      if (this.viewShown2D){
        bus.$emit('set-2D-slice', this.sliceScrollVal);
      }           
    },

    onClipPlaneChange: function() {
      if (this.viewShown3D){
        bus.$emit('set-clip-planes', [this.clipValX, this.clipValY, this.clipValZ, this.clipValW]);

      }           
    },

    onResetClipPlane: function() {
      if (this.viewShown3D){
        this.clipValX = 0
        this.clipValY = 0
        this.clipValZ = 0
        this.clipValW = 0
        bus.$emit('set-clip-planes', [this.clipValX, this.clipValY, this.clipValZ, this.clipValW]);

      }           
    }


  },
};
</script>

<style>


</style>
