import tseslint from "typescript-eslint";

export default [
    ...tseslint.configs.recommended,
    {
        files: ["src/**/*.ts"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            parserOptions: {
                tsconfigRootDir: import.meta.dirname
            },
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
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-unused-vars": "warn",
            "no-unused-vars": "off",
            "no-undef": "off",
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
