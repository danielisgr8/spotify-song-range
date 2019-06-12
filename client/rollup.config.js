import babel from "rollup-plugin-babel";
import commonjs from "rollup-plugin-commonjs";
import postcss from "rollup-plugin-postcss";
import replace from "rollup-plugin-replace";
import resolve from "rollup-plugin-node-resolve";

module.exports = {
    input: "src/index.js",
    output: {
        file: "public/index.js",
        format: "umd"
    },
    plugins: [
        replace({
            "process.env.NODE_ENV": JSON.stringify("development")
        }),
        resolve({
            browser: true
        }),
        postcss(),
        babel({
            exclude: "node_modules/**"
        }),
        commonjs()
    ]
};