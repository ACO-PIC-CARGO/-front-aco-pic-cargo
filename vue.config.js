const path = require("path");
module.exports = {
  filenameHashing: true,
  productionSourceMap: false,
  pwa: {
    name: "Sistema ChainSolver",
    themeColor: "#252C32",
    msTileColor: "#252C32",
    appleMobileWebAppCapable: "yes",
    appleMobileWebAppStatusBarStyle: "#252C32",
    // Agrega estas dos líneas:
    workboxPluginMode: "GenerateSW",
    workboxOptions: {
      skipWaiting: true,
      clientsClaim: true,
      // Fuerza al service worker a limpiar cachés antiguas de runtime si las hubiera
      cleanupOutdatedCaches: true,
    },
  },
  configureWebpack: {
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    optimization: {
      splitChunks: {
        chunks: "all",
      },
    },
  },
};
