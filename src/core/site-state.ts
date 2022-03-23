import { Route } from 'vue-router';

export enum NavEvent {
  pagePreloaded = 1,
  pageWithdrawing,
  pageWithdrawn,
  polyhedronAnimatingToHome,
  polyhedronAnimatingToHeader,
  polyhedronReadyAtHome,
  polyhedronReadyAtHeader
}

let awaitingLogo = true;
let atHomePage = null as null | boolean;
let atWorkEntryPage = null as null | boolean;
let currentRoute = null as null | Route;
let lastPageNavEvent = null as null | NavEvent;
let lastPolyhedronNavEvent = null as null | NavEvent;
let pageAnimationCompleteCallback = null as null | Function;
let hoveringHeaderHomeLink = false;


export const siteState = {
  awaitingLogo,
  atHomePage,
  atWorkEntryPage,
  currentRoute,
  hoveringHeaderHomeLink,
  lastPageNavEvent,
  lastPolyhedronNavEvent,
  pageAnimationCompleteCallback
};
