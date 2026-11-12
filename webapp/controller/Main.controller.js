sap.ui.define(["project1/controller/Base.controller"], (BaseController) => {
  "use strict";

  const VALID_TAB_KEYS = ["json", "odataV2", "odataV4"];
  const DEFAULT_TAB_KEY = "json";

  return BaseController.extend("project1.controller.Main", {
    onInit() {
      const router = this.getOwnerComponent().getRouter();
      router.getRoute("RouteMain").attachPatternMatched(this._onRouteMatched, this);
      router.getRoute("RouteTab").attachPatternMatched(this._onRouteMatched, this);
    },

    onTabSelect(event) {
      const selectedKey = event.getParameter("key");
      this.getOwnerComponent().getRouter().navTo("RouteTab", {
        tabKey: selectedKey,
      });
    },

    _onRouteMatched(event) {
      const args = event.getParameter("arguments") || {};
      const tabKey = VALID_TAB_KEYS.includes(args.tabKey)
        ? args.tabKey
        : DEFAULT_TAB_KEY;

      const iconTabBar = this.byId("mainIconTabBar");
      if (iconTabBar && iconTabBar.getSelectedKey() !== tabKey) {
        iconTabBar.setSelectedKey(tabKey);
      }

      if (!args.tabKey) {
        this.getOwnerComponent().getRouter().navTo(
          "RouteTab",
          { tabKey },
          true, 
        );
      }
    },
  });
});