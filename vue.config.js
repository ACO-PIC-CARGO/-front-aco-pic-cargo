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