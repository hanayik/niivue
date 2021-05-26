<template>

  <div class='mt-5' id="controls" >
    <v-row class="my-2 mx-2 align-center">
      <h3>Layers</h3>
      <v-spacer></v-spacer>
      <v-btn @click='onAddOverlay' class="mx-2" small>Add overlay</v-btn>
    </v-row>
    <v-row no-gutters>
      <v-expansion-panels>
        <draggable handle='.drag-handle' class="row mx-2 my-2" v-model="overlays">
          <v-expansion-panel
          v-for="(overlay, i) in overlays"
          :key="i">
          <v-expansion-panel-header>
            <v-row no-gutters class="align-center">
              <v-icon class="mx-2 drag-handle"> mdi-drag-horizontal-variant </v-icon>
              <v-icon class="mx-2" @click.stop="toggleVisibility(i)">{{ visibilityIcon(overlays_[i].visible) }}</v-icon>{{ overlay.name }}
            </v-row>
            
          </v-expansion-panel-header>
          <v-expansion-panel-content>
            <v-row>
              <v-select
                :items="colorMaps"
                v-model="overlay.colorMap"
                @change="onColorChange(i)"
                label="Color map">
              </v-select>
            </v-row>
            <v-row>
             <v-col class="px-4">
              <p>Intensity range</p>
              <v-range-slider
                v-model="overlay.intensityRange"
                :max="overlay.intensityMax"
                :min="overlay.intensityMin"
                hide-details
                class="align-center"
                @input="onIntensitySliderChange(i, [overlay.intensityRange[0], overlay.intensityRange[1]])"
              >
                <template v-slot:prepend>
                  <v-text-field
                    :value="overlay.intensityRange[0]"
                    class="mt-0 pt-0"
                    hide-details
                    single-line
                    type="text"
                    readonly
                    style="width: 60px"
                    @input="onIntensity0Change(i, overlay.intensityRange[0])"
                  ></v-text-field>
                </template>
                <template v-slot:append>
                  <v-text-field
                    :value="overlay.intensityRange[1]"
                    class="mt-0 pt-0"
                    hide-details
                    single-line
                    type="text"
                    readonly
                    style="width: 60px"
                    @input="onIntensity1Change(i, overlay.intensityRange[1])"
                  ></v-text-field>
                </template>
              </v-range-slider>
            </v-col> 
            </v-row>

            <v-row>
              <v-col>
              <p>Opacity</p>
                <v-slider
                  v-model="overlay.opacity"
                  step="0.01"
                  max="1"
                  min="0"
                  thumb-label
                  ticks
                  @input="onOpacityChange(i, overlay.opacity)"
                >
                </v-slider>
              </v-col>
            </v-row>
          </v-expansion-panel-content>
        </v-expansion-panel>
        </draggable>
      </v-expansion-panels>
    </v-row>

    
  </div>

</template>

<script>
import draggable from "vuedraggable";
import {bus} from "@/bus.js"

export default {
  props: {
    overlays: Array,
  },

  name: 'controls',

  components: {
    draggable
  },

  data (){
    return {
      //colorSelected: 'gray',
      colorMaps:['gray', 'Winter', 'Warm', 'Plasma', 'Viridis', 'Inferno'],
      //selectedColorMap: 'gray',
      eyeIcon: "mdi-eye",
      overlays_: this.overlays,
      draggable: true,
      opacity: 1.0,
      overlayVisibilityState: {},
      
    }
  },

  methods: {
    toggleVisibility: function(index) {
      // to trigger change detection: https://vuejs.org/v2/guide/reactivity.html#Change-Detection-Caveats
      // https://stackoverflow.com/questions/53557086/vue-how-to-perform-reactive-object-change-detection-in-v-for
      if (this.overlays_.length === 1) {
        // disable eye toggle if only one overlay. Why remove the only visiable thing?
        return
      }
      this.$set(this.overlays_[index], 'visible', !this.overlays_[index].visible);

      let vis = this.overlays_[index].visible
      if (vis){
        bus.$emit('opacity-change', {volIdx:index, newOpacity:1});
      } else {
        bus.$emit('opacity-change', {volIdx:index, newOpacity:0});
      }
    },

    visibilityIcon: function(val) {
      return val ? 'mdi-eye' : 'mdi-eye-off';
    },

    onColorChange: function() {
      bus.$emit('colormap-change');

    },

    onOpacityChange: function(i, newOpacity) {
      bus.$emit('opacity-change', {volIdx:i, newOpacity:newOpacity});

    },

    onIntensity0Change: function(i, newVal) {
      bus.$emit('intensity-change', {volIdx:i, newRangeArr:[newVal, this.overlays[i].intensityMax]});
    },

    onIntensity1Change: function(i, newVal) {
      bus.$emit('intensity-change', {volIdx:i, newRangeArr:[this.overlays[i].intensityMin, newVal]});
    },

    onIntensitySliderChange: function(i, newRangeArr) {
      bus.$emit('intensity-change', {volIdx:i, newRangeArr:newRangeArr});
    },
    

    onAddOverlay: function () {
      alert('adding overlays in this demo is not implemented yet! :)')
    },

  },

  mounted() {
    bus.$on('intensity-range-update', (intensity) => {
      // console.log(intensity)
      this.overlays[intensity.volIdx].intensityMin = intensity.newRangeArr[0]
      this.overlays[intensity.volIdx].intensityMax = intensity.newRangeArr[1]
      this.overlays[intensity.volIdx].intensityRange = intensity.newRangeArr
      this.$forceUpdate()
    });
  }

};

</script>

<style scoped>

drag-handle {
  color: black;
}

</style>
