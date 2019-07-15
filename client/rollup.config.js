import babel from "rollup-plugin-babel";
import commonjs from "rollup-plugin-commonjs";
import postcss from "rollup-plugin-postcss";
import replace from "rollup-plugin-replace";
import resolve from "rollup-plugin-node-resolve";
module.exports = {
    input: "src/index.jsx",
    output: {
        file: "public/index.js",
        format: "umd",
        sourcemap: true
    },
    plugins: [
        replace({
            "process.env.NODE_ENV": JSON.stringify("development")
        }),
        babel({
            exclude: "node_modules/**"
        }),
        resolve({
            browser: true,
            extensions: [".js", ".jsx"]
        }),
        postcss(),
        commonjs({
            include: "node_modules/**",
            namedExports: {
                "node_modules/react/index.js": ["useState", "useEffect", "Component", "isValidElement", "cloneElement"],
                "node_modules/react-dom/index.js": ["render"]
            }
        })
    ]
};