/*
 * @package jsDAV
 * @subpackage DAV
 * @copyright Copyright(c) 2011 Ajax.org B.V. <info AT ajax DOT org>
 * @author Mike de Boer <info AT mikedeboer DOT nl>
 * @license http://github.com/mikedeboer/jsDAV/blob/master/LICENSE MIT License
 */
"use strict";

var jsDAV_Tree = require("./../../tree");
var jsDAV_FS_Directory = require("./directory");
var jsDAV_FS_File = require("./file");

var Fs = require("fs-extra");
var Path = require("path");
var Async = require("asyncjs");
var Util = require("./../../../shared/util");
var Exc = require("./../../../shared/exceptions");
var spawn = require('child_process').spawn;

/**
 * jsDAV_FS_Tree
 *
 * Creates this tree
 * Supply the path you'd like to share.
 *
 * @param {String} basePath
 * @contructor
 */
var jsDAV_FS_Tree = module.exports = jsDAV_Tree.extend({
    initialize: function(basePath) {
        this.basePath = basePath;
    },

    /**
     * Returns a new node for the given path
     *
     * @param {String} path
     * @return void
     */
    getNodeForPath: function(path, cbfstree) {
        var realPath = this.getRealPath(path);
        var nicePath = this.stripSandbox(realPath);
        if (!this.insideSandbox(realPath))
            return cbfstree(new Exc.Forbidden("You are not allowed to access " + nicePath));

        Fs.stat(realPath, function(err, stat) {
            if (!Util.empty(err))
                return cbfstree(new Exc.FileNotFound("File at location " + nicePath + " not found"));
            cbfstree(null, stat.isDirectory()
                ? jsDAV_FS_Directory.new(realPath)
                : jsDAV_FS_File.new(realPath))
        });
    },

    /**
     * Returns the real filesystem path for a webdav url.
     *
     * @param {String} publicPath
     * @return string
     */
    getRealPath: function(publicPath) {
        return Path.join(Util.rtrim(this.basePath, Path.sep), Util.trim(publicPath, Path.sep));
    },

    /**
     * Copies a file or directory.
     *
     * This method must work recursively and delete the destination
     * if it exists
     *
     * @param {String} source
     * @param {String} destination
     * @return void
     */
    copy: function(source, destination, cbfscopy) {
        var src = this.getRealPath(source);
        var dest = this.getRealPath(destination);

        if (!this.insideSandbox(dest)) {
            return cbfscopy(new Exc.Forbidden("You are not allowed to copy to " +
                this.stripSandbox(dest)));
        }
        Fs.stat(src, function(err, stat) {
            if (!Util.empty(err))
                return cbfscopy(new Exc.FileNotFound("File at location " + source + " not found"));
            Fs.copy(src, dest, { overwrite: true }, cbfscopy);
        });
    },

    /**
     * Moves a file or directory recursively.
     *
     * @param {String} source
     * @param {String} destination
     * @return void
     */
    move: function(source, destination, cbfsmove) {
        var src = this.getRealPath(source);
        var dest = this.getRealPath(destination);

        if (!this.insideSandbox(dest)) {
            return cbfsmove(new Exc.Forbidden("You are not allowed to move to " +
                this.stripSandbox(dest)));
        }
        Fs.stat(src, function(err, stat) {
            if (!Util.empty(err))
                return cbfsmove(new Exc.FileNotFound("File at location " + source + " not found"));
            Fs.move(src, dest, { overwrite: true }, cbfsmove);
        });
    }
});
