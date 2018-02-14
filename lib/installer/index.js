"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var pkgDir = require("pkg-dir");
var getConf_1 = require("../getConf");
var getScript_1 = require("./getScript");
var is_1 = require("./is");
var hookList = [
    'applypatch-msg',
    'pre-applypatch',
    'post-applypatch',
    'pre-commit',
    'prepare-commit-msg',
    'commit-msg',
    'post-commit',
    'pre-rebase',
    'post-checkout',
    'post-merge',
    'pre-push',
    'pre-receive',
    'update',
    'post-receive',
    'post-update',
    'push-to-checkout',
    'pre-auto-gc',
    'post-rewrite',
    'sendemail-validate'
];
function writeHook(filename, script) {
    fs.writeFileSync(filename, script, 'utf-8');
    fs.chmodSync(filename, parseInt('0755', 8));
}
function createHook(filename, script) {
    // Get name, used for logging
    var name = path.basename(filename);
    // Check if hook exist
    if (fs.existsSync(filename)) {
        var hook = fs.readFileSync(filename, 'utf-8');
        // Migrate
        if (is_1.isGhooks(hook)) {
            console.log("migrating existing ghooks script: " + name + " ");
            return writeHook(filename, script);
        }
        // Migrate
        if (is_1.isPreCommit(hook)) {
            console.log("migrating existing pre-commit script: " + name);
            return writeHook(filename, script);
        }
        // Update
        if (is_1.isHusky(hook)) {
            return writeHook(filename, script);
        }
        // Skip
        console.log("skipping existing user hook: " + name);
        return;
    }
    // Create hook if it doesn't exist
    writeHook(filename, script);
}
function createHooks(filenames, script) {
    filenames.forEach(function (filename) { return createHook(filename, script); });
}
function canRemove(filename) {
    if (fs.existsSync(filename)) {
        var data = fs.readFileSync(filename, 'utf-8');
        return is_1.isHusky(data);
    }
    return false;
}
function removeHook(filename) {
    fs.unlinkSync(filename);
}
function removeHooks(filenames) {
    filenames.filter(canRemove).forEach(removeHook);
}
function getHooks(gitDir) {
    var gitHooksDir = path.join(gitDir, 'hooks');
    return hookList.map(function (hookName) { return path.join(gitHooksDir, hookName); });
}
function install(gitDir, huskyDir, isCI) {
    console.log('husky > setting up git hooks');
    var userDir = pkgDir.sync(path.join(huskyDir, '..'));
    var conf = getConf_1.default(userDir);
    if (process.env.HUSKY_SKIP_INSTALL === 'true') {
        console.log("HUSKY_SKIP_INSTALL environment variable is set to 'true',", 'skipping Git hooks installation');
        return;
    }
    if (isCI && conf.skipCI) {
        console.log('CI detected, skipping Git hooks installation');
        return;
    }
    if (userDir === null) {
        console.log("Can't find package.json, skipping Git hooks installation");
        return;
    }
    // Create hooks
    var hooks = getHooks(gitDir);
    var script = getScript_1.default(userDir);
    createHooks(hooks, script);
    console.log("husky > done");
}
exports.install = install;
function uninstall(gitDir, huskyDir) {
    console.log('husky > uninstalling git hooks');
    var userDir = pkgDir.sync(path.join(huskyDir, '..'));
    if (path.join(userDir, '.git') === gitDir) {
        // Remove hooks
        var hooks = getHooks(gitDir);
        removeHooks(hooks);
    }
    console.log('husky > done');
}
exports.uninstall = uninstall;