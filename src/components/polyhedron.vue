<style lang="scss">
  @use '@/style/shared.scss';
  
  figure {
    pointer-events: none;
      
    #polyhedron {
      --x-vw: 50vw;
      --x-vmin: 0vmin;
      --y-vmin: 40vmin;
      --x: 0px;
      --y: 0px;
      
      position: absolute;
      width: shared.$basePolyhedronSize;
      height: shared.$basePolyhedronSize;
      left: calc(var(--x-vw) + var(--x-vmin));
      top: var(--y-vmin);
      z-index: 2;
      
      opacity: 0;
      transform: translate(var(--x), var(--y));
      
      path {
        fill: currentColor;
        stroke: currentColor;
        stroke-width: 0.03vmin;
      }
    }
    
    h1 {
      font-size: 5.2vmin;
      font-weight: inherit;
      z-index: 1;
      
      &>.letter {
        --x-vw: 0vw;
        --x-vmin: 0vmin;
        --y-vmin: 0vmin;
        
        --x: 0px;
        --y: 0px;
        --scale: 1;
        
        position: absolute;
        left: calc(var(--x-vw) + var(--x-vmin));
        top: var(--y-vmin);
        
        opacity: 0;
        transform: translate(var(--x), var(--y)) scale(var(--scale));
        transform-origin: top left;
      }
    }
  }
</style>

<template>
  <figure v-once>
    <svg :id="svgId" viewBox="0 0 200 200"></svg>
    <h1>
      <span :class="letterClass" v-for="letter in logoLetters" :key="letter" v-text="letter"></span>
    </h1>
  </figure>
</template>

<script lang="ts">
  import { Component, Vue, Watch } from 'vue-property-decorator';
  import { PolyhedronAnimation } from '@/animation/polyhedron-animation';
  import { siteState, NavEvent } from '@/core/site-state';
  import { RouteNames } from '@/router';

  // Constants
  const svgId = 'polyhedron';
  const letterClass = 'letter';
  const logoLetters = 'admvx'.split('');
  const logoAnimation = new PolyhedronAnimation();
  
  @Component({
    data() { return { logoLetters, siteState, svgId, letterClass }; }
  })
  export default class Polyhedron extends Vue {
    
    private awaitingFirstPageLoad: boolean = true;
    
    protected mounted(): void {
      this.awaitingFirstPageLoad = ! (siteState.atHomePage || siteState.lastPageNavEvent === NavEvent.pagePreloaded);
      logoAnimation.initialize(svgId, letterClass);
      (! this.awaitingFirstPageLoad) && this.animateLogoIn();
    }
    
    @Watch('siteState.lastPageNavEvent')
    protected onNavEventFire(navEvent: NavEvent): void {
      switch (navEvent) {
        
        case NavEvent.pagePreloaded:
          if (this.awaitingFirstPageLoad) {
            this.awaitingFirstPageLoad = false;
            this.animateLogoIn(0);
          } else {
            siteState.lastPolyhedronNavEvent = NavEvent.polyhedronAnimatingToHeader;
            logoAnimation.validatePageState(false).then(this.setNavStatePostAnimation);
          }
          break;
          
        case NavEvent.pageWithdrawn:
          siteState.lastPolyhedronNavEvent = NavEvent.polyhedronAnimatingToHome;
          logoAnimation.validatePageState(true).then(this.setNavStatePostAnimation);
          break;
          
      }
    }
    
    @Watch('siteState.hoveringHeaderHomeLink')
    protected onHomeMouseHoverChange(hoveringHeaderHomeLink: boolean): void {
      logoAnimation.validateHoverState();
    }
    
    private animateLogoIn(delay?: number): void {
      logoAnimation.animateIn(delay).then(() => {
        this.setNavStatePostAnimation();
        siteState.awaitingLogo = false;
      });
    }
    
    private setNavStatePostAnimation(): void {
      siteState.lastPolyhedronNavEvent = this.$route.name === RouteNames.home ? NavEvent.polyhedronReadyAtHome : NavEvent.polyhedronReadyAtHeader;
    }
    
  }
</script>
