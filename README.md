# Rspackify

Seamlessly switch from Webpack to Rspack on the fly ⚡️.

Perfect for use with various frameworks such as Taro, Next.js, and more that deeply integrate Webpack, now allowing you to switch to Rspack with ease.

> 🚨 Please note: very early work in progress. Almost nothing works yet. Contributions welcome!

# Usage

Rspackify is a command-line utility that can be installed globally or as part of a Node.js project.

```bash
npm install -g rspackify
```

Once installed, you can run rspackify from the terminal followed by your regular commands for build or development. This will replace Webpack invocations with Rspack behind the scenes during runtime.

## 🚧 Using with [Taro](https://github.com/nervjs/taro)

For instance, to build a Taro project targeting weapp, you update your package.json as follows:

```json
{
  "scripts": {
    "build:weapp": "rspackify taro build --type weapp",
  }
}
```

## 🚧 Using with [Create React App](https://github.com/facebook/create-react-app)

For instance, to build a Create React App project, you update your package.json as follows:

```json
{
  "scripts": {
    "start": "rspackify react-scripts start",
    "build": "rspackify react-scripts build"
  }
}
```

# License

MIT
