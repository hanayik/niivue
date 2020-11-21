<template>
  <b-container fluid id="viewer">
    <canvas id="gl" width="640" height="480">

    </canvas>
  </b-container>
</template>
<script>
import * as nii from "nifti-reader-js"
import * as glmat from "gl-matrix"


console.log(glmat)
console.log(nii)
export default {
  name: 'NiiVue',
  /*
  props are passed to the nii-vue component from it's parent
  they can be used as:

  <nii-vue
    :volumes=[{src: String}] array of objects. src is the String URL or relative file path
  >
  </nii-vue>
  */
  props: {
    volume: String,
    shader: String,
  },
  data () {
    return {

    }
  },
  mounted() {
    // get the gl context after the component has been mounted and initialized
    const canvas = document.querySelector("#gl")
    const gl = canvas.getContext("webgl")
    this.gl = gl
    
  }
}
</script>

<style scoped>
#viewer {
  background-color: black;  
  min-width: 100%;
  min-height: 600px;
}

body {
  background-color: black;
  
}

</style>
