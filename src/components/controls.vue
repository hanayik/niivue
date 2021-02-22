<template>

  <div id="controls" >
    <v-row class="my-2 mx-2 align-center">
      <h3>Overlay list</h3>
      <v-spacer></v-spacer>
      <v-btn class="mx-2" small>Add overlay</v-btn>
    </v-row>
    <v-row no-gutters>
      <v-expansion-panels>
        <v-expansion-panel
          v-for="(overlay, i) in overlays"
          :key="i">
          <v-expansion-panel-header>
            <v-row no-gutters class="align-center">
              <v-icon class="mx-2" @click.stop="toggleEye"> {{ eyeIcon }} </v-icon>{{ overlay.name }}
            </v-row>
            
          </v-expansion-panel-header>
          <v-expansion-panel-content>
            <v-row>
              <v-select
                :items="colorMaps"
                v-model="colorSelected"
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
                    @change="$set(overlay.intensityRange, 0, $event)"
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
                    @change="$set(overlay.intensityRange, 1, $event)"
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
                  step="1"
                  thumb-label
                  ticks
                >
                </v-slider>
              </v-col>
            </v-row>
            
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-row>

  </div>

</template>

<script>

export default {
  props: {
    overlays: Array,
  },

  name: 'controls',

  components: {
  },

  data (){
    return {
      colorSelected: 'gray',
      colorMaps:['gray', 'red', 'blue', 'green'],
      eyeIcon: "mdi-eye"
      
    }
  },

  methods: {
    toggleEye: function() {
      this.eyeIcon = this.eyeIcon == "mdi-eye" ? "mdi-eye-off" : "mdi-eye"
    }
  }

};

</script>

<style scoped>

#controls {
}

</style>
