Object.defineProperty(exports, "__esModule", {
    value: true
})

const spans = new WeakMap();

class ProfilingPlugin {
    apply() {
    }
}

const webpackInvalidSpans = new WeakMap();

module.exports = {
    ProfilingPlugin,
    spans,
    webpackInvalidSpans
}
