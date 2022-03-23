<style lang="scss">
  @use '@/style/shared';
  
  a.arrow-link {
    --slidePercentage: 0%;
    
    position: relative;
    display: inline-block;
    overflow: hidden;
    
    font-weight: 600;
    color: #fff;
    text-transform: uppercase;
    
    .main {
      position: relative;
    }
    .background {
      position: absolute;
      background: shared.$green;
      transform: rotate(-45deg);
      transform-origin: 100% 100%;
      right: 0;
    }
    .hover-wrapper {
      @include shared.absoluteTL;
      width: 100%;
      height: 100%;
      
      transform: translate(var(--slidePercentage), 0);
      
      .hover {
        position: absolute;
        background: shared.$red;
        transform: rotate(-45deg);
        transform-origin: 100% 100%;
        right: 100%;
      }
    }
    
    @each $width, $unit in shared.$unitSizePerMinWidth {
      @media screen and (min-width: $width) {
        $mainWidth: 60 * $unit;
        $linkHeight: 4.5 * $unit;
        
        font-size: 2.5 * $unit;
        
        .background {
          width: $mainWidth * 0.75;
          height: $mainWidth * 0.75;
          bottom: $linkHeight * 0.5;
        }
        .hover-wrapper {
          .hover {
            width: $mainWidth * 0.75;
            height: $mainWidth * 0.75;
            bottom: $linkHeight * 0.5;
          }
        }
        .main {
          line-height: $linkHeight;
          margin: 0 4.5*$unit 0 3*$unit;
        }
      }
    }
  }
</style>

<template>
  <a class="arrow-link"
     :href="isDisabled ? null : to"
     :title="isDisabled ? null : title || label"
      target="_blank"
     @mousemove="updateMouseHover(true)"
     @mouseleave="updateMouseHover(false)">
    <div v-once class="background"></div>
    <div v-once class="hover-wrapper">
      <div class="hover"></div>
    </div>
    <div v-once class="main" v-text="label"></div>
  </a>
</template>

<script lang="ts">
  import { Component, Vue, Prop } from 'vue-property-decorator';
  import { getCssVarProxyWithAutoUnit, ProxyTargetNumeric } from '@/animation/utils/css-var-animator';
  import { SpringEase } from '@/animation/utils/spring-ease';
  
  const baseDuration = 450;
  const baseMagnitude = 100;
  const cssVarName = '--slidePercentage';
  
  @Component
  export default class ArrowLink extends Vue {
    
    @Prop({required: true}) protected to: string;
    @Prop({required: true}) protected label: string;
    @Prop({required: false}) protected title: string;
    @Prop({required: false}) protected isDisabled: boolean;
    
    private hovering = false;
    private hoverProxy: ProxyTargetNumeric;
    
    protected mounted(): void {
      this.hoverProxy = getCssVarProxyWithAutoUnit(this.$el.querySelector('.hover-wrapper') as HTMLElement, [cssVarName], '%');
    }
    
    protected updateMouseHover(hovering: boolean): void {
      if (hovering === this.hovering || this.isDisabled) return;
      this.hovering = hovering;
      SpringEase.to(this.hoverProxy, cssVarName, hovering ? baseMagnitude : 0, { baseDuration, baseMagnitude });
    }
    
  }
</script>
