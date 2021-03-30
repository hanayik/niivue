<template>

  <div class='mt-5' id="controls" >
    <v-dialog
      v-model="dialog"
      width="500"
    >   
      <v-card>
        <v-card-title class="headline grey lighten-2">
          Load Overlay
        </v-card-title>

        <v-card-text>
          Select an overlay to add to the display
        </v-card-text>
        <v-text-field
          v-model="overlayUrl"
          label="Overlay URL"
          hide-details="auto"
        ></v-text-field>
        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="red lighten-2"
            dark
            @click="dialog = false"
          >
          Cancel
          </v-btn>
          <v-btn
            color="primary"
            @click="dialog = false; loadOverlay()"
          >
            OK
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
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
      dialog: false,
      overlayUrl: '',      
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

    onColorChange: function(i) {
      console.log(i)
      bus.$emit('colormap-change');

    },

    onOpacityChange: function(i, newOpacity) {
      bus.$emit('opacity-change', {volIdx:i, newOpacity:newOpacity});

    },

    onAddOverlay: function () {
      this.dialog = true;
    },

    loadOverlay: function() {
      if(this.overlayUrl) {
        let newVol =
        { 
              url: this.overlayUrl,
              volume:{hdr:null, img:null},
              name: this.overlayUrl.split('/').pop(),
              intensityMin:0,
              intensityMax:100,
              intensityRange: [0,100],
              colorMap: "gray",
              opacity: 100,
              visible: true,
        };

        this.$set(this.overlays_, this.overlays_.length, newVol);
        this.overlayUrl = '';
        bus.$emit('refresh');
      }
    },

  }

};

</script>

<style scoped>

drag-handle {
  color: black;
}

</style>
