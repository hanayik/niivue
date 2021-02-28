<template>
  <v-app>
    <v-app-bar app>
      <!-- make app bar scroll in horizontal direction -->
      <v-tabs v-model='tab'>
        <v-tabs-slider color='black'></v-tabs-slider>
        <v-tab
          v-for='item in appTabs'
          :key='item'>
          {{ item }}
        </v-tab>
      </v-tabs>
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
        <v-toolbar class="pa-0">
          <v-btn @click='setSliceType(0)'>A</v-btn>
          <v-btn @click='setSliceType(2)'>S</v-btn>
          <v-btn @click='setSliceType(1)'>C</v-btn>
          <v-btn @click='setSliceType(4)'>R</v-btn>
          <v-btn @click='setSliceType(3)'>MP</v-btn>
          <v-spacer></v-spacer>
        </v-toolbar>
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
      //console.log(posString)
    });

  },
  data (){
    return {
      tab: null,
      appTabs: ['Menu', 'Draw', 'Edit', 'Scripting'],
      coordinateString: '0x0x0',
      overlayList: [
        {
          volumeURL: "./mni152.nii.gz",
          volume: {hdr: null, img: null},
          name: "mni152.nii.gz",
          intensityMin: 0,
          intensityMax: 100,
          intensityRange:[0, 100],
          colorMap: "gray", // gray
          opacity: 100,
        },
        /*{
          volumeURL: "./chris_T1.nii.gz",
          volume: {hdr: null, img: null},
          name: "chris_T1.nii.gz",
          intensityMin: 0,
          intensityMax: 100,
          intensityRange:[0, 100],
          colorMap: "gray", // gray
          opacity: 100,
        }*/
      ]
    }
  },

  methods: {
    setSliceType: function(sliceType) {

      bus.$emit('slice-type-change', sliceType);
    }
  },
};
</script>

<style>


</style>
