import Vue from 'vue';
import VueRouter, { RouteConfig, Route, RawLocation } from 'vue-router';
import Home from '@/views/home.vue';
import { siteState } from '@/core/site-state';
import { workEntries } from '@/core/work-entries';
import { doubleRaf } from '@/core/utils/ticker';

Vue.use(VueRouter);

export enum RouteNames {
  home = 'home',
  work = 'work'
};

const pageTitleLookup: {[id: string]: string} = { };
workEntries.forEach(entry => pageTitleLookup[entry.id] = entry.page_title!);

const routes: Array<RouteConfig> = [
  {
    path: '/',
    name: RouteNames.home,
    component: Home,
    meta: {
      title: 'admvx'
    }
  }, {
    path: '/work/:entry?',
    name: RouteNames.work,
    component: () => import(/* webpackChunkName: "work" */ '../views/work.vue'),
    meta: {
      title: 'Portfolio | admvx'
    }
  }
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
  scrollBehavior: () => { return null }
});

export const backOrReplace = (fallbackLocation: RawLocation) => {
  let priorPath = router.currentRoute.path;
  router.back();
  doubleRaf().then(() => {
    if (priorPath !== router.currentRoute.path) {
      return;
    }
    router.replace(fallbackLocation);
  });
};

// Set central page data after each change to allow components to react
const updateSiteState = (toRoute: Route, fromRoute: Route) => {
  siteState.currentRoute = toRoute;
  siteState.atHomePage = toRoute.name === RouteNames.home;
  siteState.atWorkEntryPage = toRoute.name === RouteNames.work && !!toRoute.params.entry;
  if (siteState.atWorkEntryPage) {
    document.title = pageTitleLookup[toRoute.params.entry] + ' | admvx';
  } else {
    document.title = toRoute.meta!.title;
  }
};
router.afterEach(updateSiteState);

// Catch initial route to set atHomePage flag before components load
let removeInitialNavGuard = router.beforeEach((toRoute, fromRoute, next) => {
  removeInitialNavGuard();
  updateSiteState(toRoute, fromRoute);
  next();
});

export default router;
