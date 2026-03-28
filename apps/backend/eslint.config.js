export default [
    {
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                console: "readonly",
                process: "readonly",
                Buffer: "readonly",
                __dirname: "readonly",
                __filename: "readonly",
                fetch: "readonly",
                document: "readonly",
                window: "readonly",
                navigator: "readonly",
                setTimeout: "readonly",
                Date: "readonly",
                JSON: "readonly",
                encodeURIComponent: "readonly",
                event: "readonly"
            }
        },
        rules: {
            "no-unused-vars": "warn",
            "no-undef": "error",
            "no-console": "off",
            "semi": ["error", "always"],
            "quotes": ["error", "double", { avoidEscape: true }],
            "indent": ["error", 4],
            "no-trailing-spaces": "warn"
        }
    },
    {
        ignores: ["node_modules/**", "dist/**"]
    }
];
