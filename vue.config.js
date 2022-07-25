const {
    defineConfig
} = require('@vue/cli-service')

// https://stackoverflow.com/questions/53307636/vue-cli-3-display-info-from-the-package-json
// top answer
process.env.VUE_APP_VERSION = process.env.npm_package_version

module.exports = defineConfig({
    transpileDependencies: true,
    pluginOptions: {
        // electron builder config
        electronBuilder: {
            // 必须配置，使用node的内部api
            // https://nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration
            nodeIntegration: true,
            productName: "socket-tool",
            nsis: {
                createDesktopShortcut: true,
                createStartMenuShortcut: true,
                // 允许自定义安装目录
                allowToChangeInstallationDirectory: true
                // shortcutName: ""
            }
        }
    }
})