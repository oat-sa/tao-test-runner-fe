module.exports = {
    root: true,
    extends: '@oat-sa/eslint-config-tao',
    env : {
        "browser" : true,
        "es6" : true,
        "qunit" : true,
        "node" : true
    },
    globals : {
        "requirejs": true,
        "define": true
    }
};
