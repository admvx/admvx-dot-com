<style lang="scss">
@use '@/style/shared';

$headerShortPad: 1.3%;
$headerLongPad: 20%;
$infoProportionalWidth: 0.88;
$collapseScaleFactor: 0.56;
$infoBackground: lighten(shared.$navy, 4);
$overlayTransparent: transparentize($infoBackground, 1);

article.entry {
  // Animation properties
  --mainProgress: 1;
  --figureProgress: 0;
  --infoHeightProgress: 1;
  --infoOverlayProgress: 1;
  --linkProgress: 1;
  --headerProgress: 1;
  --closeProgress: 1;
  
  // Left/right position multiplier
  --alternator: 1;
  
  /* -- Unitless style -- */
  header {
    @include shared.absoluteTL;
    width: 100%;
    z-index: 2;
    will-change: transform;
    
    h1 {
      position: relative;
      z-index: 2;
      line-height: 0.85;
      color: shared.$textColor;
      font-weight: 800;
      text-transform: uppercase;
    }
    
    button {
      position: absolute;
      z-index: 1;
      opacity: calc(1 - var(--closeProgress));
      transform: translate(calc(500% * var(--closeProgress) * var(--alternator)), -50%);
      will-change: transform;
      svg {
        stroke-width: 6.5;
        stroke-linecap: round;
        stroke: shared.$red;
      }
      
      &:hover>svg {
        stroke: shared.$green;
      }
    }
  }
  
  figure {
    position: relative;
    overflow: hidden;
    width: 100%;
    z-index: 1;
    pointer-events: auto;
    
    picture {
      width: 100%;
      height: auto;
      &.main {
        @include shared.absoluteTL;
        opacity: var(--figureProgress);
      }
      &.low-opacity {
        opacity: 0.75;
      }
      // Vertical offset is half the percentage difference between collapsed and full size: 0.5 * (1 - (26 / (60 * 9 / 16))) = 0.114815;
      transform: translate(0, calc(-11.481% * var(--mainProgress)));
    }
  }
  
  .info {
    @include shared.absoluteT;
    z-index: 3;
    
    .core {
      font-weight: 300;
      
      &.visible {
        position: absolute;
        overflow: hidden;
        background: $infoBackground;
        pointer-events: auto;
      }
      &.measurable {
        visibility: hidden;
        pointer-events: none;
      }
      
      h2 {
        font-weight: 600;
        color: shared.$red;
      }
      
      .overlay {
        @include shared.absoluteB;
        opacity: var(--infoOverlayProgress);
      }
      
    }
    .core p {
      line-height: 1.2;
      
      strong {
        font-weight: 600;
        letter-spacing: 0.1em;
      }
      a,span {
        color: shared.$green;
        font-weight: 600;
        &:hover {
          color: shared.$red;
        }
      }
    }
    
    a.arrow-link {
      @include shared.absoluteR;
      opacity: calc(1 - var(--linkProgress));
    }
  }
  
  // Alt style adjustment
  &.alt {
    header {
      h1 {
        text-align: right;
      }
    }
  }
  
  /* -- Unit-based layout -- */
  @each $width, $unit in shared.$unitSizePerMinWidth {
    @media screen and (min-width: $width) {
      
      $mainWidth: 60 * $unit;
      $infoWidth: $infoProportionalWidth * $mainWidth;
      $figureHeight: $mainWidth * 9 / 16;
      $collapsedFigureHeight: 26 * $unit;
      $closeButtonOffset: -4.25 * $unit;
      
      $bodySizeMultiplier: 1;
      $subheadingSizeMultiplier: 1;
      @if $width < 640px {
        $bodySizeMultiplier: 1.3;
        $subheadingSizeMultiplier: 1.15;
      }
      
      $collapsedInfoHeight: 20 * $unit;
      $collapsedFigureOffsetX: $mainWidth * (0.5 - 0.5 / $collapseScaleFactor);
      $collapsedInfoOffsetX: 0.5 * $mainWidth / $collapseScaleFactor - 0.5 * $infoWidth;
      $collapsedInfoOffsetY: 0.5 * ($collapsedFigureHeight - $collapsedInfoHeight);
      
      width: $mainWidth;
      margin-bottom: -4 * $unit;
      transform: scale(shared.getRangeCalc(1, $collapseScaleFactor, "--mainProgress"));
      
      header {
        transform: translate(calc(#{$unit*3 + $collapsedFigureOffsetX} * var(--mainProgress) * var(--alternator)), calc(#{-1 * $unit} + var(--headerProgress) * #{4 * $unit} - (1 - var(--headerProgress)) * 100%));
        h1 {
          font-size: 6*$unit;
          padding: 0 $headerLongPad 0 $headerShortPad;
        }
        button {
          left: $closeButtonOffset;
          top: 50%;
          width: 3.2*$unit;
          height: 3.2*$unit;
        }
      }
      
      figure {
        height: shared.getRangeCalc($figureHeight, $collapsedFigureHeight, "--mainProgress");
        border-radius: 2.5 * $unit;
        transform: translate(calc($collapsedFigureOffsetX * var(--mainProgress) * var(--alternator)), 0);
      }
      
      .info {
        left: ($mainWidth - $infoWidth) * 0.5;
        width: $infoWidth;
        transform: translate(calc($collapsedInfoOffsetX * var(--mainProgress) * var(--alternator)), shared.getRangeCalc($figureHeight - (2.5 * $unit), $collapsedInfoOffsetY, "--mainProgress"));
        
        .core {
          padding: 2.7*$unit 3.8*$unit 8.5*$unit;
          font-size: 2.15 * $unit * $bodySizeMultiplier;
          
          &.visible {
            border-radius: 2 * $unit;
            box-shadow: 0 0 3.8*$unit -1*$unit #01092766;
            height: calc((1 - var(--infoHeightProgress)) * 100% + #{20 * $unit} * var(--infoHeightProgress));
          }
          
          h2 {
            margin-bottom: $unit * $subheadingSizeMultiplier;
            font-size: 3.5 * $unit * $subheadingSizeMultiplier;
          }
          .overlay {
            left: 3 * $unit;
            width: 46 * $unit;
            height: 13 * $unit;
            background: linear-gradient(to bottom, $overlayTransparent 0, $infoBackground 10 * $unit);
          }
        }
        
        .core p {
          margin: $unit*1.4*$bodySizeMultiplier 0;
        }
        
        a.arrow-link {
          $linkHeight: 4.5 * $unit;
          bottom: $linkHeight - 1.5*$unit;
          transform: translate(shared.getRangeCalc(4*$unit, -4*$unit, "--linkProgress"), 0);
          will-change: transform;
        }
      }
      
      // Alt style adjustment
      &.alt {
        --alternator: -1;
        header {
          h1 {
            padding: 0 $headerShortPad 0 $headerLongPad;
          }
          button {
            left: unset;
            right: $closeButtonOffset;
          }
        }
      }
    }
  }
}
</style>

<template>
  <article class="entry" :class="{ alt: isAltStyle }">
    
    <header>
      <h1 v-once v-text="entryData.title"></h1>
      <button @click="closeClicked()" class="icon-button" title="Minimize entry" :disabled="! expanded">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" v-once><line x1="77" y1="23" x2="23" y2="77"/><line x1="23" y1="23" x2="77" y2="77"/></svg>
      </button>
    </header>
    
    <figure v-once>
      <imager :name="thumbnailId" fallback-extension="png" :class="{ 'low-opacity': entryData.low_opacity }" aria-hidden="true" />
      <imager class="main" :name="mainImageId" :fallback-extension="entryData.fallback_extension" :description="entryData.image_description" />
    </figure>
    
    <section class="info">
      <div class="core visible">
        <h2 v-once v-text="entryData.subtitle"></h2>
        <div v-once class="body" v-html="entryData.body"></div>
        <div class="overlay" :class="{ 'non-blocking': expanded }"></div>
      </div>
      <div v-once class="core measurable">
        <h2 v-text="entryData.subtitle"></h2>
        <div class="body" v-html="entryData.false_body"></div>
      </div>
      <arrow-link :isDisabled="! expanded" :to="entryData.link.url" :label="entryData.link.text" :title="entryData.link.hover" />
    </section>
  </article>
</template>

<script lang="ts">
  import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
  import { WorkEntryData } from '@/core/work-entries';
  import { WorkEntryAnimation } from '@/animation/work-entry-animation';
  import { RouteNames, backOrReplace } from '@/router';
  import Imager from '@/components/imager.vue';
  import FancyLink from '@/components/fancy-link.vue';
  import ArrowLink from '@/components/arrow-link.vue';

  @Component({
    components: { Imager, FancyLink, ArrowLink }
  })
  export default class WorkEntry extends Vue {
    
    @Prop({required: true}) protected entryData: WorkEntryData;
    @Prop({required: true}) protected index: number;
    @Prop({required: true}) protected expanded: boolean;
    
    private animator: WorkEntryAnimation;
    
    @Watch('expanded')
    protected onExpandedChanged(expanded: boolean): void {
      this.animator.setExpanded(expanded);
    }
    
    protected isAltStyle: boolean = false;
    protected thumbnailId: string = '';
    protected mainImageId: string = '';
    
    protected created(): void {
      this.isAltStyle = !! (this.index % 2);
      this.thumbnailId = this.entryData.id + (this.isAltStyle ? '-tr' : '-tg');
      this.mainImageId = this.entryData.id + '-main';
    }
    
    protected mounted(): void {
      this.animator = new WorkEntryAnimation(this.$el as HTMLElement, this.expanded);
    }
    
    protected closeClicked(): void {
      backOrReplace({ name: RouteNames.work });
    }
    
  }
</script>
