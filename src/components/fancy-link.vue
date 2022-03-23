<style scoped lang="scss">
  @use '@/style/shared';

  $color1: shared.$green;
  $color2: shared.$tan;
  $color3: shared.$red;
  $blockWidth: 20vmin;
  
  a {
    display: inline-block;
    width: fit-content;
    
    background: linear-gradient(to right,
      $color1 0, $color1 $blockWidth,
      $color2 $blockWidth, $color2 $blockWidth*2,
      $color3 $blockWidth*2, $color3 $blockWidth*3
    );
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    background-size: $blockWidth*3 auto;
    background-repeat: repeat-y;
    background-position: $blockWidth * -2;
    transition: background-position 0.45s ease-in-out;
    &:hover, &.page-active {
      background-position: 0;
    }
  }
</style>

<template>
  <a :href="to" :title="isActive ? '' : title || label" :class="{ 'page-active': isActive }">
    <div v-once v-text="label"></div>
  </a>
</template>

<script lang="ts">
  import { Component, Vue, Prop } from 'vue-property-decorator';

  @Component
  export default class FancyLink extends Vue {
    
    @Prop({required: true}) protected to: string;
    @Prop({required: true}) protected label: string;
    @Prop({required: false}) protected title: string;
    @Prop({required: false}) protected isActive: boolean;
    
  }
</script>
