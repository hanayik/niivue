<template>
  <v-app>
      <v-row no-gutters>
      <!-- app uses a 12 column layout, so the controls take up 4 columns on the left of the screen -->
      <v-col cols="4">
        <controls :overlays="overlayList">
        </controls>
      </v-col>

      <v-col cols="8">
        <!--scene controls -->
        <v-row class='scene-controls' no-gutters>

        </v-row>
        <glviewer :overlays="overlayList">

        </glviewer>
      </v-col>
      
    </v-row>

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
      // changing volumeURL has the immediate effect of rendering the new volume
      volumeURL: "./Chris_T1.nii.gz",
      overlayList: [
        {
          volumeURL: "./mni152.nii.gz",
          name: "mni152.nii.gz",
          intensityMin: 0,
          intensityMax: 100,
          intensityRange:[0, 100],
          colorMap: "gray", // gray
          opacity: 100,
        },
        {
          volumeURL: "./spm152.nii.gz",
          name: "spm152.nii.gz",
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
