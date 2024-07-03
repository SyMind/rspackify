// packages/next/src/compiled/webpack/webpack.js

exports.__esModule = true

exports.default = undefined

exports.init = function () {
    Object.assign(exports, {
        // BasicEvaluatedExpression: require('webpack/lib/javascript/BasicEvaluatedExpression'),
        // ModuleFilenameHelpers: require('webpack/lib/ModuleFilenameHelpers'),
        NodeTargetPlugin: require('@rspack/core').node.NodeTargetPlugin,
        // StringXor: require('@rspack/core/dist/util/StringXor'),
        NormalModule: require('@rspack/core').NormalModule,
        sources: require('@rspack/core').sources,
        webpack: require('@rspack/core'),
    })
    Object.assign(exports, require('@rspack/core'))
}
