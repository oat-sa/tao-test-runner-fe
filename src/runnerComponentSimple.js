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
 * Copyright (c) 2017-2023 (original work) Open Assessment Technologies SA ;
 */

/**
 * A component that loads and instantiate a test runner inside an element:
 * A light-weight version of `runnerComponent.js`:
 * - removes `handlebars` template dependency
 * - removes `ui/component` dependency, so it's api is not inherited
 * Logic stays the same:
 * - provider initialization
 * - configuration validation
 * Use it instead of `runnerComponent.js` in projects which do not use `handlebars`
 */

import _ from 'lodash';
import eventifier from 'core/eventifier';
import runnerFactory from 'taoTests/runner/runner';
import providerLoader from 'taoTests/runner/providerLoader';

/**
 * Validate required options from the configuration
 * @param {Object} config
 * @returns {Boolean} true if valid
 * @throws {TypeError} in case of validation failure
 */
function validateTestRunnerConfiguration(config = {}) {
    const requiredProperties = ['providers', 'options', 'serviceCallId'];
    if (typeof config !== 'object') {
        throw new TypeError(`The runner configuration must be an object, '${typeof config}' received`);
    }
    if (requiredProperties.some(property => typeof config[property] === 'undefined')) {
        throw new TypeError(
            `The runner configuration must contains at least the following properties : ${requiredProperties.join(',')}`
        );
    }
    return true;
}

/**
 * Get the selected provider if set or infer it from the providers list
 * @param {String} type - the type of provider (runner, communicator, proxy, etc.)
 * @param {Object} config
 * @returns {String} the selected provider for the given type
 */
function getSelectedProvider(type = 'runner', config = {}) {
    if (config.provider && config.provider[type]) {
        return config.provider[type];
    }

    if (config.providers && config.providers[type]) {
        const typeProviders = config.providers[type];
        if (typeof typeProviders === 'object' && (typeProviders.id || typeProviders.name)) {
            return typeProviders.id || typeProviders.name;
        }
        if (Array.isArray(typeProviders) && typeProviders.length > 0) {
            return typeProviders[0].id || typeProviders[0].name;
        }
    }
    return false;
}

/**
 * Wraps a test runner into a component
 * @param {jQuery|HTMLElement|String} container - The container in which renders the component
 * @param {Object} config - The component configuration options
 * @param {String} config.serviceCallId - The identifier of the test session
 * @param {Object} config.providers
 * @param {Object} config.options
 * @param {Boolean} [config.loadFromBundle=false] - do we load the modules from the bundles
 * @param {Boolean} [config.replace] - When the component is appended to its container, clears the place before
 * @param {Number|String} [config.width] - The width in pixels, or 'auto' to use the container's width
 * @param {Number|String} [config.height] - The height in pixels, or 'auto' to use the container's height
 * @returns {runnerComponent}
 */
export default function runnerComponentFactory(container = null, config = {}) {
    let runner = null;
    let plugins = [];

    if (!container) {
        throw new TypeError('A container element must be defined to contain the runnerComponent');
    }

    validateTestRunnerConfiguration(config);

    const runnerComponentApi = {
        /**
         * Initializes the component
         * @param {Object} configuration
         * @returns {runner}
         * @fires runner#init
         */
        init: function init(configuration) {
            this.config = _(configuration || {})
                .omit(function (value) {
                    return value === null || typeof value === 'undefined';
                })
                .value();

            this.trigger('init');
            return this;
        },

        /**
         * Uninstalls the component
         * @returns {runner}
         * @fires component#destroy
         */
        destroy: function destroy() {
            this.trigger('destroy');
            return this;
        },

        /**
         * Renders the component
         * @returns {runner}
         * @fires runner#render
         */
        render: function render() {
            this.trigger('render');
            return this;
        },

        /**
         * Shows the component
         * @returns {runner}
         * @fires runner#show
         */
        show: function show() {
            this.trigger('show', this);
            return this;
        },

        /**
         * Hides the component
         * @returns {runner}
         * @fires runner#hide
         */
        hide: function hide() {
            this.trigger('hide', this);
            return this;
        },

        /**
         * Get the component's configuration
         * @returns {Object}
         */
        getConfig: function getConfig() {
            return this.config || {};
        },

        /**
         * Gets the test runner
         * @returns {runner}
         */
        getRunner() {
            return runner;
        }
    };
    const runnerComponent = eventifier(runnerComponentApi);

    runnerComponent
        .on('init', function () {
            //load the defined providers for the runner, the proxy, the communicator, the plugins, etc.
            return providerLoader(config.providers, config.loadFromBundle)
                .then(results => {
                    if (results && results.plugins) {
                        plugins = results.plugins;
                    }

                    this.render(container);
                    this.hide();
                })
                .catch(err => this.trigger('error', err));
        })
        .on('render', function () {
            this.component = document.createElement('div');
            this.component.classList.add('runner-component');
            container.append(this.component);

            const runnerConfig = Object.assign(_.omit(this.config, ['providers']), {
                renderTo: this.component
            });
            runnerConfig.provider = Object.keys(this.config.providers).reduce((acc, providerType) => {
                if (!acc[providerType] && providerType !== 'plugins') {
                    acc[providerType] = getSelectedProvider(providerType, this.config);
                }
                return acc;
            }, runnerConfig.provider || {});

            runner = runnerFactory(runnerConfig.provider.runner, plugins, runnerConfig)
                .on('ready', () => {
                    _.defer(() => {
                        this.trigger('ready', runner).show();
                    });
                })
                .on('destroy', () => (runner = null))
                .spread(this, 'error')
                .init();
        })
        .on('hide', function () {
            if (this.component) {
                this.component.classList.add('hidden');
            }
        })
        .on('show', function () {
            if (this.component) {
                this.component.classList.remove('hidden');
            }
        })
        .on('destroy', function () {
            var destroying = runner && runner.destroy();
            runner = null;

            if (this.component) {
                this.component.remove();
            }
            return destroying;
        })
        .after('destroy', function () {
            this.removeAllListeners();
        });

    return runnerComponent.init(config);
}
