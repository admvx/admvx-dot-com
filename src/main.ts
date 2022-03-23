import Vue from 'vue';
import App from './app.vue';
import router from './router';
import Component from 'vue-class-component';
import { loadOverlayScrollStyleIfRequired } from '@/core/utils/detect-scroll-style';
import { enableFocusEffectsOnTab } from '@/core/utils/enable-focus-effects';

// Register router navigation hooks
Component.registerHooks([
  'beforeRouteLeave',
  'beforeRouteUpdate'
]);

Vue.config.productionTip = false;

loadOverlayScrollStyleIfRequired();
enableFocusEffectsOnTab();

new Vue({
  router,
  render: h => h(App)
}).$mount('#app');
