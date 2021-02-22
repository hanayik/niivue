<template>
  <v-app>
    <v-app-bar app>
      Toolbar
    </v-app-bar>

    <v-main>
      <v-row>
      <!-- app uses a 12 column layout, so the controls take up 4 columns on the left of the screen -->
      <v-col cols="4">
        <controls :overlays="overlayList">
        </controls>
      </v-col>

      <v-col cols="8">
        <glviewer :overlays="overlayList"></glviewer>
      </v-col>
      
    </v-row>

    </v-main>

    <v-footer app>
      <v-row >
        <v-col align="center" justify="center" >
          coordinates: x, y, z
        </v-col>
        <v-col align="center" justify="center" >
          region: N/A
        </v-col>

      </v-row>
    </v-footer>

  </v-app>
</template>

<script>
import controls from './components/controls.vue'
import glviewer from './components/glviewer.vue'

export default {
  name: 'App',

  components: {
    controls,
    glviewer
  },

  data (){
    return {
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
        {
          volumeURL: "./chris_T1.nii.gz",
          volume: {hdr: null, img: null},
          name: "chris_T1.nii.gz",
          intensityMin: 0,
          intensityMax: 100,
          intensityRange:[0, 100],
          colorMap: "gray", // gray
          opacity: 100,
        }
      ]
    }
  },
};
</script>

<style scoped>

  .scene-controls {
    height: 140px;
    width: auto;
  }

</style>
