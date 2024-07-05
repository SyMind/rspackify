# Rspackify

Experience lightning-fast builds by instantly switching from Webpack to [Rspack](https://www.rspack.dev/) ⚡️.

> 🚨 Please note: very early work in progress. Contributions welcome!

# Using with `npx`

To quickly use Rspackify without installing it globally, you can run:

```bash
npx rspackify npm run dev
```

Replace `npm run dev` with your project's actual development or build command.

# Installation

You can also install Rspackify globally or as part of your project.

```bash
npm install -g rspackify
```

Once installed, you can run `rspackify` from the terminal followed by your regular commands for build or development.

## 🟢 Using with [Wepback CLI](https://webpack.js.org/api/cli/)

To build a Webpack CLI project, update your `package.json` as follows:

```json
{
  "scripts": {
    "start": "rspackify webpack serve",
    "build": "rspackify webpack"
  }
}
```

## 🟢 Using with [Vue CLI](https://cli.vuejs.org/)

To build a Vue CLI project, update your `package.json`:

```json
{
  "scripts": {
    "serve": "rspackify vue-cli-service serve",
    "build": "rspackify vue-cli-service build"
  }
}
```

## 🟢 Using with [UmiJS](https://cli.vuejs.org/)

To build an UmiJS project, update your `package.json`:

```json
{
  "scripts": {
    "serve": "rspackify umi dev",
    "build": "rspackify umi build"
  }
}
```

## 🟢 Using with [Create React App](https://github.com/facebook/create-react-app)

To build a Create React App project, update your `package.json`:

```json
{
  "scripts": {
    "start": "rspackify react-scripts start",
    "build": "rspackify react-scripts build"
  }
}
```

## 🚧 Using with [Taro](https://github.com/nervjs/taro)

To build a Taro project targeting Weapp, update your `package.json`:

```json
{
  "scripts": {
    "build:weapp": "rspackify taro build --type weapp",
  }
}
```

# Roadmap

Here's our future directions and plans for the development of this project:

## Dependency Stage: Enhance Rspack Compatibility

Our first essential step for this project is to identify and address the unsupported functionalities in rspack. This pre-initial stage will focus extensively on gaining in-depth insights into rspack, recognizing its limitations, and exploring viable solutions for overcoming these. Our commitment at this juncture is to expedite the detection and resolution of any shortcomings in rspack to prepare a solid foundation for the seamless progression of this project.

## Initial Focus: Availability Across Different Framework Development Modes

The initial and primary goal is to ensure workability across different frameworks in developer mode. The emphasis here is on improving the developer experience without compromising on essential functionality. In development mode, we expect a higher degree of tolerance for differences from the original webpack configuration and inconsistencies in final output, as long as the project runs correctly.

## Ultimate Goal: Production Mode Build Availability

As the project progresses, our ultimate goal is to guarantee that the package will work under a production environment. We strive to address all operational issues to ensure seamless integration during production builds. This includes addressing scalability and performance issues, minimizing the final output sizes, and optimizing load times. We understand that a smooth, reliable production mode is crucial for any application, and we're committed to making that a reality.

# License

MIT
