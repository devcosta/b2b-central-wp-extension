const moduleRaid = function () {
  moduleRaid.mID = Math.random().toString(36).substring(7);
  moduleRaid.mObj = {};

  fillModuleArray = function () {
    if (parseFloat(window?.Debug?.VERSION) < 2.3) {
      (window.webpackChunkbuild || window.webpackChunkwhatsapp_web_client).push([
        [moduleRaid.mID],
        {},
        function (e) {
          Object.keys(e.m).forEach(function (mod) {
            moduleRaid.mObj[mod] = e(mod);
          });
        }
      ]);
    } else {
      let modules = self.require("__debug").modulesMap;
      Object.keys(modules)
        .filter((e) => e.includes("WA"))
        .forEach(function (mod) {
          let modulos = modules[mod];
          if (modulos) {
            moduleRaid.mObj[mod] = {
              default: modulos.defaultExport,
              factory: modulos.factory,
              ...modulos
            };
            if (Object.keys(moduleRaid.mObj[mod].default).length == 0) {
              try {
                self.ErrorGuard.skipGuardGlobal(true);
                Object.assign(moduleRaid.mObj[mod], self.importNamespace(mod));
              } catch (e) {}
            }
          }
        });
    }
  };

  fillModuleArray();

  get = function get(id) {
    return moduleRaid.mObj[id];
  };

  findModule = function findModule(query) {
    results = [];
    modules = Object.keys(moduleRaid.mObj);

    modules.forEach(function (mKey) {
      mod = moduleRaid.mObj[mKey];

      if (typeof mod !== "undefined") {
        if (typeof query === "string") {
          if (typeof mod.default === "object") {
            for (key in mod.default) {
              if (key == query) results.push(mod);
            }
          }

          for (key in mod) {
            if (key == query) results.push(mod);
          }
        } else if (typeof query === "function") {
          if (query(mod)) {
            results.push(mod);
          }
        } else {
          throw new TypeError(
            "findModule can only find via string and function, " + typeof query + " was passed"
          );
        }
      }
    });

    return results;
  };

  return {
    modules: moduleRaid.mObj,
    constructors: moduleRaid.cArr,
    findModule: findModule,
    get: get
  };
};

if (typeof module === "object" && module.exports) {
  module.exports = moduleRaid;
} else {
  window.mR = moduleRaid();
}
