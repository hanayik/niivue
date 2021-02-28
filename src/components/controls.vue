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
              <v-icon class="mx-2" @click.stop="toggleEye"> {{ eyeIcon }} </v-icon>{{ overlay.name }}
            </v-row>
            
          </v-expansion-panel-header>
          <v-expansion-panel-content>
            <v-row>
              <v-select
                :items="colorMaps"
                v-model="selectedColorMap"
                @change="onColorChange"
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

              >
                <template v-slot:prepend>
                  <v-text-field
                    :value="overlay.intensityRange[0]"
                    class="mt-0 pt-0"
                    hide-details
                    single-line
                    type="number"
                    style="width: 60px"
                    @input="$set(overlay.intensityRange, 0, $event)"
                  ></v-text-field>
                </template>
                <template v-slot:append>
                  <v-text-field
                    :value="overlay.intensityRange[1]"
                    class="mt-0 pt-0"
                    hide-details
                    single-line
                    type="number"
                    style="width: 60px"
                    @input="$set(overlay.intensityRange, 1, $event)"
                  ></v-text-field>
                </template>
              </v-range-slider>
            </v-col> 
            </v-row>

            <v-row>
              <v-col>
              <p>Opacity</p>
                <v-slider
                  v-model="opacity"
                  step="0.01"
                  max="1"
                  min="0"
                  thumb-label
                  ticks
                  @input="onOpacityChange"
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
      colorSelected: 'gray',
      colorMaps:['gray', 'Winter', 'Warm', 'Plasma', 'Viridis', 'Inferno'],
      selectedColorMap: 'gray',
      eyeIcon: "mdi-eye",
      overlays_: this.overlays,
      draggable: true,
      opacity: 1.0,
      
    }
  },

  methods: {
    toggleEye: function() {
      this.eyeIcon = this.eyeIcon == "mdi-eye" ? "mdi-eye-off" : "mdi-eye"
    },

    onColorChange: function() {
      bus.$emit('colormap-change', this.selectedColorMap);

    },

    onOpacityChange: function() {
      bus.$emit('opacity-change', this.opacity);

    },

    onAddOverlay: function () {
      alert('adding overlays in this demo is not implemented yet! :)')
    }
  }

};

</script>

<style scoped>

drag-handle {
  color: black;
}

</style>
