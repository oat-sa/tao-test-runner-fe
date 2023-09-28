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
 * Copyright (c) 2019-2023 (original work) Open Assessment Technologies SA ;
 */

import path from 'path';
import glob from 'glob';
import alias from 'rollup-plugin-alias';
import handlebarsPlugin from 'rollup-plugin-handlebars-plus';
import babel from 'rollup-plugin-babel';
import istanbul from 'rollup-plugin-istanbul';
import wildcardExternal from '@oat-sa/rollup-plugin-wildcard-external';

const { srcDir, outputDir, aliases } = require('./path');
const Handlebars = require('handlebars');

const isDev = process.env.NODE_ENV === 'development';

const globPath = p => p.replace(/\\/g, '/');
const inputs = glob.sync(globPath(path.join(srcDir, '**', '*.js')));

/**
 * Define all modules as external, so rollup won't bundle them together.
 */
const localExternals = inputs.map(
    input => `taoTests/runner/${path.relative(srcDir, input).replace(/\\/g, '/').replace(/\.js$/, '')}`
);

export default inputs.map(input => {
    const name = path.relative(srcDir, input).replace(/\.js$/, '');
    const dir = path.dirname(path.relative(srcDir, input));

    return {
        input,
        output: {
            dir: path.join(outputDir, dir),
            format: 'amd',
            sourcemap: isDev,
            name
        },
        watch: {
            clearScreen: false
        },
        external: [...localExternals, 'lodash', 'context', 'async', 'moment', 'handlebars'],
        plugins: [
            wildcardExternal(['core/**', 'ui/**', 'lib/**', 'taoItems/runner/**']),
            alias({
                resolve: ['.js', '.tpl'],
                ...aliases
            }),
            handlebarsPlugin({
                handlebars: {
                    id: 'handlebars',
                    options: {
                        sourceMap: false
                    },
                    module: Handlebars
                },
                // helpers: ['build/tpl.js'],
                templateExtension: '.tpl'
            }),
            ...(process.env.COVERAGE ? [istanbul()] : []),
            babel({
                presets: [
                    [
                        '@babel/env',
                        {
                            useBuiltIns: false
                        }
                    ]
                ]
            })
        ]
    };
});
