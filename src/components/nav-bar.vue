<style lang="scss">
  @use '@/style/shared.scss';

  $headerTextScaleMultiplier: 0.475;
  $homeFontSize: 5.2vmin * $headerTextScaleMultiplier;
  $letterSpacing: 4.8vmin * $headerTextScaleMultiplier;

  nav {
    display: flex;
    flex-direction: row-reverse;
    justify-content: space-between;
    transform: translateY(-70%);
    height: shared.$headerHeight;
    pointer-events: none;
    
    &.await-logo {
      transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
    }
    &.logo-ready {
      transform: translateY(0);
    }
  }
  
  .nav-link {
    font-size: 4.5vmin;
    letter-spacing: 0.6vmin;
    font-weight: 600;
    pointer-events: auto;
    margin: 2vmin 3.5vmin auto 3.5vmin;
    
    @media screen and (min-width: 640px) {
      font-size: 3vmin;
      letter-spacing: 0.4vmin;
      margin: 3vmin 3.5vmin auto 3.5vmin;
    }
  }
  
  .home-link {
    display: flex;
    align-items: center;
    color: transparent;
    pointer-events: auto;
    figure {
      width: shared.$headerHeight;
      height: shared.$headerHeight;
    }
    h1 {
      font-size: $homeFontSize;
      font-weight: inherit;
      letter-spacing: $letterSpacing;
    }
  }
</style>

<template>
  <nav :class="{ 'await-logo': awaitLogoAtLoad, 'logo-ready': ! siteState.awaitingLogo }">
    <router-link custom to="/work" v-slot="{ href, route, navigate, isActive }">
      <fancy-link :to="href"
                  :label="route.name"
                  :title="'View portfolio'"
                  :isActive="isActive"
                  :tabindex="siteState.atWorkEntryPage ? -1 : null"
                  @click.native="navigate"
                  class="nav-link" />
    </router-link>
    <router-link custom to="/" v-slot="{ href, navigate }" v-if="! siteState.atHomePage">
      <a :href="href"
         @click="navigate"
         class="home-link"
         @mousemove="updateHomeMouseHover(true)"
         @mouseleave="updateHomeMouseHover(false)"
         title="View homepage"
         :tabindex="siteState.atWorkEntryPage ? -1 : null">
        <figure v-once></figure>
        <h1 v-once>admvx</h1>
      </a>
    </router-link>
  </nav>
</template>

<script lang="ts">
  import { Component, Vue } from 'vue-property-decorator';
  import { siteState } from '@/core/site-state';
  import FancyLink from '@/components/fancy-link.vue';

  @Component({
    components: { FancyLink },
    data() { return { siteState }; }
  })
  export default class NavBar extends Vue {
    
    protected awaitLogoAtLoad: boolean;
    
    protected created(): void {
      this.awaitLogoAtLoad = siteState.awaitingLogo;
    }
    
    protected updateHomeMouseHover(nowHovering: boolean): void {
      siteState.hoveringHeaderHomeLink = nowHovering;
    }
  }
</script>
