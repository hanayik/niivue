<template>
  <div id="app">
    <nii-vue
      :filename="volumeURL">
    </nii-vue>
  </div>
</template>

<script>
import NiiVue from './components/NiiVue.vue'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

export default {
  name: 'App',
  components: {
    NiiVue 
  },
  data () {
    // the properties contained here are reactive. 
    return {
      // changing volumeURL has the immediate effect of rendering the new volume
      volumeURL: "./Chris_T1.nii.gz"
    }
  }
}
</script>

<style>
</style>
