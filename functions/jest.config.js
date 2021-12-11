module.exports = {
  moduleNameMapper: {},
  testPathIgnorePatterns: ["<rootDir>/node_modules/"],
  transform: {
    // Use babel-jest to transpile tests with the next/babel preset
    // https://jestjs.io/docs/configuration#transform-objectstring-pathtotransformer--pathtotransformer-object
    "^.+\\.(js)$": ["babel-jest", { presets: ["next/babel"] }],
  },
  transformIgnorePatterns: [
    // "/node_modules/",
  ],
};
