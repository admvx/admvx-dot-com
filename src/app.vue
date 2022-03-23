<style lang="scss">
  @use '@/style/main.scss';
  @use '@/style/shared.scss';
  
  $gradientColor1: rgba(shared.$navy, 100%);
  $gradientColor2: rgba(shared.$navy, 75%);
  $gradientColor3: rgba(shared.$navy, 0%);
  $gradientHeight: shared.$headerHeight * 1.3;
  
  #common {
    position: fixed;
    pointer-events: none;
    width: 100%;
    top: 0;
    z-index: 2;
    transition: transform 0.7s;
    transition-timing-function: cubic-bezier(0, 0.1, 0.1, 1);
    transition-delay: 0.3s;
    
    &.hidden {
      transform: translateY(-$gradientHeight);
      transition-timing-function: cubic-bezier(0.9, 0, 1, 0.9);
      transition-delay: 0s;
    }
    
    &>.nav-backing {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: $gradientHeight;
      background: linear-gradient(to bottom, $gradientColor1, $gradientColor2, $gradientColor3);
    }
    
    &>nav {
      position: relative;
      z-index: 3;
    }
    
    &>figure {
      position: absolute;
      top: 0;
      z-index: 2;
    }
  }
  
  main {
    position: relative;
    z-index: 1;
  }
  
</style>

<template>
  <div id="app">
    <div id="common" :class="{ hidden: siteState.atWorkEntryPage }">
      <div v-once class="nav-backing"></div>
      <nav-bar/>
      <polyhedron/>
    </div>
    <transition v-on:leave="onRouteLeave">
      <keep-alive>
        <router-view/>
      </keep-alive>
    </transition>
  </div>
</template>


<script lang="ts">
  import { Component, Vue } from 'vue-property-decorator';
  import Polyhedron from '@/components/polyhedron.vue';
  import NavBar from '@/components/nav-bar.vue';
  import { RouteNames } from '@/router';
  import { siteState } from '@/core/site-state';

  @Component({
    components: { NavBar, Polyhedron },
    data() { return { siteState }; }
  })
  export default class App extends Vue {
    
    protected onRouteLeave(_: HTMLElement, done: Function): void {
      if (this.$route.name === RouteNames.home) {
        siteState.pageAnimationCompleteCallback = done;
      } else {
        done();
      }
    }
    
  }
</script>
