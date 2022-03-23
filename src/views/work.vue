<style lang="scss">
  @use '@/style/shared';
  
  main {
    --count: 0;
    
    width: 100vw;
    margin: 0 auto;
    padding-top: shared.$headerHeight*0.9;
    
    .modal-cover {
      position: absolute;
      width: 100%;
      min-height: 100vh;
      top: 0;
      left: 0;
      bottom: 0;
      
      background-color: rgba(shared.$navy, 0.8);
      z-index: 2;
      opacity: 0;
      transition: opacity 1500ms;
      pointer-events: none;
      
      &.active {
        opacity: 1;
        pointer-events: auto;
      }
    }
    
    &>a {
      --index: 0;
      --offset: 0;
      opacity: 0;
      
      left: 50vw;
      display: block;
      position: absolute;
      will-change: transform;
      
      &[href] {
        pointer-events: none;
      }
      
      &.last-active {
        z-index: 3;
        will-change: initial; // Clear `will-change: transform` to avoid unwanted bitmap caching of the current/most-recently animating item
      }
    }
    
    @each $width, $unit in shared.$unitSizePerMinWidth {
      @media screen and (min-width: $width) {
        $indexMultiplier: $unit * 22;
        $offsetMultiplier: $unit;
        
        height: calc((var(--count) + 1) * #{$indexMultiplier});
        
        &>a {
          transform: translate(-50%, calc(var(--index) * #{$indexMultiplier} + var(--offset) * #{$offsetMultiplier}));
        }
      }
    }
  }
</style>

<template>
  <main :style="{ '--count': workEntries.length }">
    <router-link custom
                 v-slot="{ href, navigate }"
                 v-for="(entry, index) in workEntries"
                 :key="entry.id"
                 :to="{ name: 'work', params: { entry: entry.id } }"
                 :replace="itemExpanded">
      <a :href="index === pExpandedIndex ? null : href"
         :aria-expanded="index === pExpandedIndex ? 'true' : 'false'"
         :aria-label="entry.aria_title"
         :tabindex="itemExpanded ? -1 : null"
         :style="{ '--index': index }"
         :class="{ 'last-active': index === lastActiveIndex }"
         class="work-entry-link"
         :title="index === pExpandedIndex ? null : 'Expand entry'"
         v-on="index === pExpandedIndex ? { } : { click: navigate }">
        <work-entry :entry-data="entry" :index="index" :expanded="index === pExpandedIndex" />
      </a>
    </router-link>
    <div class="modal-cover"
         :class="{ 'active': itemExpanded }"
         v-on="itemExpanded ? { click: backOut } : { }">
    </div>
  </main>
</template>

<script lang="ts">
  import { Component, Vue, Watch } from 'vue-property-decorator';
  import WorkEntry from '@/components/work-entry.vue';
  import { Route, NavigationGuardNext } from 'vue-router';
  import { RouteNames, backOrReplace } from '@/router';
  import { workEntries } from '@/core/work-entries';
  import { WorkPageAnimation } from '@/animation/work-page-animation';
  import { doubleRaf } from '@/core/utils/ticker';
  import { siteState, NavEvent } from '@/core/site-state';

  const idToIndex: { [id: string]: number } = { };
  workEntries.forEach((entry, index) => {
    idToIndex[entry.id] = index;
  });
  
  const topPageReference = { name: RouteNames.work };

  @Component({
    components: { WorkEntry },
    data() { return { workEntries, siteState }; }
  })
  export default class Work extends Vue {
    
    protected lastActiveIndex: number = -1;
    protected itemExpanded: boolean = false;
    private pendingExpandedIndex: number = -1;
    private animateInPending: boolean = true;
    private animateOutPending: boolean = false;
    private animator: WorkPageAnimation;
    
    protected mounted(): void {
      this.animator = new WorkPageAnimation(this.$el as HTMLElement);
    }
    
    protected activated(): void {
      if (this.animateOutPending) {
        siteState.lastPageNavEvent = NavEvent.pagePreloaded;
        this.animateInPending = this.animateOutPending = false;
        this.handleNewRoute(this.$route);
        this.animator.animateIn();
        return;
      }
      
      this.animateInPending = true;
      this.animateOutPending = false;
      
      this.$nextTick()
        .then(doubleRaf)
        .then(() => {
          this.handleNewRoute(this.$route, true);
          siteState.lastPageNavEvent = NavEvent.pagePreloaded;
          // In case the event was missed (component reloading out of sequence for example) trigger it manually
          if (siteState.lastPolyhedronNavEvent === NavEvent.polyhedronReadyAtHeader) {
            this.onNavEventFire(NavEvent.polyhedronReadyAtHeader);
          }
        });
    }
    
    @Watch('siteState.lastPolyhedronNavEvent')
    protected onNavEventFire(navEvent: NavEvent): void {
      if (navEvent === NavEvent.polyhedronReadyAtHeader && this.animateInPending) {
        this.animateInPending = false;
        if (this.pendingExpandedIndex !== -1) {
          this.expandedIndex = this.pendingExpandedIndex;
          this.pendingExpandedIndex = -1;
        }
        this.animator.animateIn();
      }
    }
    
    protected beforeRouteUpdate(to: Route, from: Route, next: NavigationGuardNext): void {
      this.handleNewRoute(to);
      next();
    }
    
    protected beforeRouteLeave(to: Route, from: Route, next: NavigationGuardNext): void {
      if (this.animateOutPending) return;
      
      siteState.lastPageNavEvent = NavEvent.pageWithdrawing;  // Not tracked directly but needed for poly to differentiate between withdrawals
      this.expandedIndex = -1;
      this.pendingExpandedIndex = -1;
      
      this.animateOutPending = true;
      this.animateInPending = false;
      
      let { mostlyDone, allDone } = this.animator.animateOut();
      mostlyDone.then(() => {
        if (! this.animateOutPending) return;
        siteState.lastPageNavEvent = NavEvent.pageWithdrawn;
      });
      allDone.then(() => {
        if (! this.animateOutPending) return;
        this.animateOutPending = false;
        siteState.lastPageNavEvent = NavEvent.pageWithdrawn;
        if (siteState.pageAnimationCompleteCallback) {
          siteState.pageAnimationCompleteCallback();
          siteState.pageAnimationCompleteCallback = null;
        }
      });
      
      next();
    }
    
    private handleNewRoute(route: Route, pageStillHidden = false): void {
      let newExpandedIndex = -1;
      if (route.params.entry) {
        newExpandedIndex = idToIndex[route.params.entry];
        if (isNaN(newExpandedIndex)) {
          this.$router.replace(topPageReference);
          return;
        }
      }
      if (newExpandedIndex === this.expandedIndex) {
        return;
      }
      if (newExpandedIndex !== -1 && pageStillHidden) {
        this.pendingExpandedIndex = newExpandedIndex;
        this.animator.scrollToItem(newExpandedIndex, workEntries[newExpandedIndex].tall_title, true);
        return;
      }
      this.expandedIndex = newExpandedIndex;
    }
    
    protected backOut(): void {
      backOrReplace(topPageReference);
    }
    
    private pExpandedIndex: number = -1;
    protected get expandedIndex(): number { return this.pExpandedIndex; }
    protected set expandedIndex(value: number) {
      if (value !== -1) {
        this.lastActiveIndex = value;
      }
      this.pExpandedIndex = value;
      this.itemExpanded = value !== -1;
      this.animator.setExpandedIndex(this.pExpandedIndex, this.itemExpanded ? workEntries[this.pExpandedIndex].tall_title : false);
    }
    
  }
</script>
