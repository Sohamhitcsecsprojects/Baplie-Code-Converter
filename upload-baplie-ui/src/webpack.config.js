const path = require("path");

module.exports = {
  entry: "./src/index.js", // Entry point for your app
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js", // Output bundle
  },
  resolve: {
    mainFields: ["browser", "module", "main"], // Add this property here
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/, // Matches JavaScript/JSX files
        exclude: /node_modules/, // Ignore node_modules
        use: {
          loader: "babel-loader", // Transpile ES6+
        },
      },
      {
        test: /\.css$/, // Matches CSS files
        use: ["style-loader", "css-loader"], // Load styles
      },
    ],
  },
  devServer: {
    static: path.join(__dirname, "public"), // Development server
    compress: true,
    port: 3000,
  },
};
