import 'material-design-icons-iconfont/dist/material-design-icons.css'
import 'typeface-roboto/index.css'
import Vue from 'vue'
import App from './App.vue'
import Router from "vue-router"
import vuetify from './plugins/vuetify';

Vue.use(Router)

Vue.config.productionTip = false

const router = new Router({
   routes: [],
   mode: 'history'
 })

new Vue({
  vuetify,
  router,
  render: h => h(App)
}).$mount('#app')
