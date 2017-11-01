import json from "rollup-plugin-json";
import babel from "rollup-plugin-babel";

export default {
  output: {
    format: "cjs"
  },
  onwarn: ()=>{},
  plugins: [
    json(),
    babel({
      exclude: [ "node_modules/**" ]
    })
  ]
};
