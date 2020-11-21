<template>
  <div id="app">
    <nii-vue
      filename="./brain.nii.gz">
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
  }
}
</script>

<style>
</style>
