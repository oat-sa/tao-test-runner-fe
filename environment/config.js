/**
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; under version 2
 * of the License (non-upgradable).
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 *
 * Copyright (c) 2019 (original work) Open Assessment Technologies SA ;
 */

define(['/node_modules/@oat-sa/tao-core-libs/dist/pathdefinition.js'], function() {
    requirejs.config({
        baseUrl: '/',
        paths: {
            css: '/node_modules/require-css/css',
            text: '/node_modules/requirejs-plugins/lib/text',
            json: '/node_modules/requirejs-plugins/src/json',

            /* TEST related */
            'qunit-parameterize': '/environment/qunit2-parameterize',
            qunit: '/node_modules/qunit/qunit',
            'taoTests/test/runner': '/test',

            'taoTests/runner': '/dist',

            ui: '/node_modules/@oat-sa/tao-core-ui/dist',
            core: '/node_modules/@oat-sa/tao-core-sdk/dist/core'
        },
        shim: {
            'qunit-parameterize': {
                deps: ['qunit/qunit']
            }
        },
        waitSeconds: 15
    });

    define('qunitLibs', ['qunit/qunit', 'css!qunit/qunit.css']);
    define('qunitEnv', ['qunitLibs', 'qunit-parameterize'], function() {
        requirejs.config({ nodeIdCompat: true });
    });

    define('context', ['module'], function(module) {
        return module.config();
    });

    define('i18n', [], () => text => text);
});
