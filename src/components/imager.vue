<style lang="scss">
  figure>picture {
    color: transparent;
  }
</style>

<template>
  <picture v-once>
    <source :srcset="primaryPath" type="image/webp">
    <img :src="altPath" :alt="description || ''">
  </picture>
</template>

<script lang="ts">
  import { Component, Vue, Prop } from 'vue-property-decorator';
  
  const basePath = '/img/';

  @Component
  export default class Imager extends Vue {
    
    @Prop({required: true}) protected name: string;
    @Prop({required: true}) protected fallbackExtension: string;
    @Prop({required: false}) protected description: string;
    
    protected get primaryPath(): string {
      return basePath + this.name + '.webp';
    }
    
    protected get altPath(): string {
      return basePath + this.name + '.' + this.fallbackExtension;
    }
    
  }
</script>
