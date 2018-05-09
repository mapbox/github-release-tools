module.exports = {
    parserOptions: {
        ecmaVersion: 8
    },
    extends: [
        'eslint:recommended'
    ],
    rules: {
        'semi': 2,
        'no-console': 0
    },
    env: {
        node: true,
        es6: true
    }
};
