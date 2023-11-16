# Rspackify

Seamlessly switch from Webpack to Rspack on the fly ⚡️.

Perfect for use with various frameworks such as Taro, Next.js, and more that deeply integrate Webpack, now allowing you to switch to Rspack with ease.

> 🚨 Please note: rspackify is currently under active development. While it is ready for experimental usage, it may still have certain edge cases to address. Use it at your own discretion and feel free to report any issues you encounter!

# Usage

Rspackify is a command-line utility that can be installed globally or as part of a Node.js project.

```bash
npm install -g rspackify
```

Once installed, you can run rspackify from the terminal followed by your regular commands for build or development. This will replace Webpack invocations with Rspack behind the scenes during runtime.

## Using with [Taro](https://github.com/nervjs/taro)

For instance, to build a Taro project targeting weapp, you update your package.json as follows:

```json
{
  "scripts": {
    "build:weapp": "rspackify taro build --type weapp",
  }
}
```

# License

MIT
