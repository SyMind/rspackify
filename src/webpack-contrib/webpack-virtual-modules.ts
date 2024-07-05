import { RspackVirtualModulePlugin } from 'rspack-plugin-virtual-module';

class RspackifyVirtualModulePlugin extends RspackVirtualModulePlugin {
    constructor(staticModules: Record<string, string>, tempDir?: string) {
        super(staticModules, tempDir);
        // fix: follow error in umijs
        // TypeError: Cannot read private member from an object whose class did not declare it
        this.apply = this.apply.bind(this);
    }
}

export = RspackifyVirtualModulePlugin;
