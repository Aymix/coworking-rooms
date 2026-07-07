// Server-renders the real FloorMap component to an SVG, then rasterizes to PNG.
const fs = require("fs");
const path = require("path");
const { transform } = require("sucrase");

const origJs = require.extensions[".js"];
require.extensions[".js"] = function (module, filename) {
  if (filename.includes("node_modules")) return origJs(module, filename);
  const src = fs.readFileSync(filename, "utf8");
  const { code } = transform(src, {
    transforms: ["jsx", "imports"],
    jsxRuntime: "automatic",
    production: true,
    filePath: filename,
  });
  module._compile(code, filename);
};

const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const sharp = require("sharp");

const FloorMap = require(path.join(__dirname, "..", "app", "visitor", "FloorMap.js")).default;

const rooms = [
  { room: "A", status: "booked", event: { title: "Design Workshop", start: new Date().toISOString(), end: new Date().toISOString() }, next: null },
  { room: "B", status: "upcoming", event: null, next: { title: "Client Call", start: new Date(Date.now() + 7200000).toISOString(), end: new Date(Date.now() + 10800000).toISOString() } },
];

const html = renderToStaticMarkup(React.createElement(FloorMap, { rooms }));
const svg = html.match(/<svg[\s\S]*?<\/svg>/)[0];

sharp(Buffer.from(svg), { density: 220 })
  .resize(820)
  .flatten({ background: "#f8fafc" })
  .png()
  .toFile(path.join(__dirname, "..", "map-preview.png"))
  .then(() => console.log("wrote map-preview.png"))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
