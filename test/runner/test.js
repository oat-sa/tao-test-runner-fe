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
 * Copyright (c) 2015 (original work) Open Assessment Technologies SA ;
 */
/**
 * @author Jean-Sébastien Conan <jean-sebastien.conan@vesperiagroup.com>
 * @author Sam <sam@taotesting.com>
 */
define(['lodash', 'core/eventifier', 'taoTests/runner/runner', 'taoTests/runner/plugin'], function(
    _,
    eventifier,
    runnerFactory,
    pluginFactory
) {
    'use strict';

    var mockProvider = {
        init: _.noop,
        loadAreaBroker: _.noop,
        loadProxy: _.noop
    };

    var items = {
        aaa: 'AAA',
        zzz: 'ZZZ'
    };

    QUnit.module('factory', {
        afterEach: function() {
            runnerFactory.clearProviders();
        }
    });

    QUnit.test('module', function(assert) {
        assert.expect(5);
        runnerFactory.registerProvider('mock', mockProvider);

        assert.equal(typeof runnerFactory, 'function', 'The runner module exposes a function');
        assert.equal(typeof runnerFactory('mock'), 'object', 'The runner factory produces an object');
        assert.notStrictEqual(
            runnerFactory('mock'),
            runnerFactory('mock'),
            'The runner factory provides a different object on each call'
        );
        assert.equal(
            typeof runnerFactory.registerProvider,
            'function',
            'The runner module exposes a function registerProvider()'
        );
        assert.equal(
            typeof runnerFactory.getProvider,
            'function',
            'The runner module exposes a function getProvider()'
        );
    });

    QUnit.cases
        .init([
            { title: 'init' },
            { title: 'render' },
            { title: 'finish' },
            { title: 'flush' },
            { title: 'destroy' },
            { title: 'loadItem' },
            { title: 'renderItem' },
            { title: 'unloadItem' },
            { title: 'disableItem' },
            { title: 'enableItem' },

            { title: 'getConfig' },
            { title: 'getOptions' },
            { title: 'getPlugins' },
            { title: 'getPlugin' },
            { title: 'getPluginsConfig' },
            { title: 'getPluginConfig' },
            { title: 'getState' },
            { title: 'setState' },
            { title: 'getItemState' },
            { title: 'setItemState' },
            { title: 'getTestData' },
            { title: 'getTestContext' },
            { title: 'getTestMap' },
            { title: 'getAreaBroker' },
            { title: 'getProxy' },
            { title: 'getProbeOverseer' },
            { title: 'getDataHolder' },

            { title: 'next' },
            { title: 'previous' },
            { title: 'jump' },
            { title: 'skip' },
            { title: 'exit' },
            { title: 'pause' },
            { title: 'resume' },
            { title: 'timeout' },

            { title: 'trigger' },
            { title: 'before' },
            { title: 'on' },
            { title: 'after' }
        ])
        .test('api', function(data, assert) {
            var runner;
            runnerFactory.registerProvider('mock', mockProvider);
            runner = runnerFactory();
            assert.equal(
                typeof runner[data.title],
                'function',
                `The runner instance exposes a "${data.title}" function`
            );
        });

    QUnit.module('provider', {
        afterEach() {
            runnerFactory.clearProviders();
        }
    });

    QUnit.test('init', function(assert) {
        var ready = assert.async();
        var runner;

        assert.expect(1);

        runnerFactory.registerProvider('foo', {
            loadAreaBroker: _.noop,
            init: function() {
                assert.equal(this.bar, 'baz', 'The provider is executed on the runner context');
                ready();
            }
        });

        runner = runnerFactory('foo');
        runner.bar = 'baz';
        runner.init();
    });

    QUnit.test('get configurations', assert => {
        const ready = assert.async();
        const config = {
            serviceCallId : '123-456-789',
            provider : {
                proxy : 'foo',
                communicator: 'bar'
            },
            bootstrap : {
                serviceUrl : '/foo'
            },
            options : {
                exitUrl : '/bye',
                fullScreen : false,
                progress : 'percent',
                plugins : {
                    title :  {
                        section : true
                    },
                    connectivity : {
                        icon : 'net'
                    }
                }
            }
        };
        assert.expect(3);

        runnerFactory.registerProvider('foo', {
            loadAreaBroker: _.noop,
            init() {
                const testRunnerConfig = this.getConfig();
                assert.deepEqual(testRunnerConfig, config, 'The retrieved config match');

                const testRunnerOptions = this.getOptions();
                assert.deepEqual(testRunnerOptions, config.options, 'The retrieved options match');

                const pluginsConfig = this.getPluginsConfig();
                assert.deepEqual(pluginsConfig, config.options.plugins, 'The retrieved plugins config match');

                ready();
            }
        });

        runnerFactory('foo', {}, config).init();
    });

    QUnit.test('render after async init', function(assert) {
        var ready = assert.async();
        var runner;
        var resolved = false;

        assert.expect(4);

        runnerFactory.registerProvider('foo', {
            loadAreaBroker: _.noop,
            init: function() {
                var p = new Promise(function(resolve) {
                    setTimeout(function() {
                        resolved = true;
                        resolve();
                    }, 50);
                });
                assert.equal(resolved, false, 'Init is not yet resolved');
                return p;
            },
            render: function() {
                assert.equal(resolved, true, 'Render is called only when init is resolved');
            }
        });

        runner = runnerFactory('foo');

        assert.equal(resolved, false, 'Init is not yet resolved');
        runner
            .on('ready', function() {
                assert.equal(resolved, true, 'Ready is triggered only when init is resolved');
                ready();
            })
            .init();
    });

    QUnit.test('states', function(assert) {
        var ready = assert.async();
        var runner;
        assert.expect(31);

        runnerFactory.registerProvider('foo', {
            loadAreaBroker: _.noop,
            init: _.noop
        });
        runner = runnerFactory('foo');

        assert.throws(
            function() {
                runner.setState({ custom: true });
            },
            TypeError,
            'A state must have a name'
        );

        runner
            .setState('custom', true)
            .on('init', function() {
                assert.equal(this.getState('custom'), true, 'The runner has the custom state');
                assert.equal(this.getState('init'), true, 'The runner is initialized');
                assert.equal(this.getState('ready'), false, 'The runner is not rendered');
                assert.equal(this.getState('finish'), false, 'The runner is not  finished');
                assert.equal(this.getState('flush'), false, 'The runner is not flushed');
                assert.equal(this.getState('destroy'), false, 'The runner is not destroyed');
            })
            .on('ready', function() {
                assert.equal(this.getState('init'), true, 'The runner is initialized');
                assert.equal(this.getState('ready'), true, 'The runner is rendered');
                assert.equal(this.getState('finish'), false, 'The runner is not finished');
                assert.equal(this.getState('flush'), false, 'The runner is not flushed');
                assert.equal(this.getState('destroy'), false, 'The runner is not destroyed');

                this.finish();
            })
            .on('finish', function() {
                assert.equal(this.getState('init'), true, 'The runner is initialized');
                assert.equal(this.getState('ready'), true, 'The runner is rendered');
                assert.equal(this.getState('finish'), true, 'The runner is finished');
                assert.equal(this.getState('flush'), false, 'The runner is not flushed');
                assert.equal(this.getState('destroy'), false, 'The runner is not destroyed');

                this.flush();
            })
            .on('flush', function() {
                assert.equal(this.getState('init'), true, 'The runner is initialized');
                assert.equal(this.getState('ready'), true, 'The runner is rendered');
                assert.equal(this.getState('finish'), true, 'The runner is finished');
                assert.equal(this.getState('flush'), true, 'The runner is flushed');
                assert.equal(this.getState('destroy'), false, 'The runner is not destroyed');

                this.destroy();
            })
            .on('destroy', function() {
                assert.equal(this.getState('init'), true, 'The runner is initialized');
                assert.equal(this.getState('ready'), true, 'The runner is rendered');
                assert.equal(this.getState('finish'), true, 'The runner is finished');
                assert.equal(this.getState('flush'), true, 'The runner is flushed');
                assert.equal(this.getState('destroy'), true, 'The runner is destroyed');
                ready();
            })
            .init();

        assert.throws(function() {
            runner.getItemState('', '');
        }, 'getItemState needs an itemRef');

        assert.throws(function() {
            runner.getItemState('123', '');
        }, 'getItemState needs a state name');

        assert.throws(function() {
            runner.setItemState('', '');
        }, 'setItemState needs an itemRef');

        assert.throws(function() {
            runner.setItemState('123', '');
        }, 'setItemState needs a state name');
    });

    QUnit.test('load and render item', function(assert) {
        var ready = assert.async();
        assert.expect(2);

        runnerFactory.registerProvider('foo', {
            loadAreaBroker: _.noop,
            init: _.noop,
            loadItem: function(itemRef) {
                return items[itemRef];
            },
            renderItem: function(itemRef, itemData) {
                assert.equal(itemRef, 'zzz', 'The rendered item is correct');
                assert.equal(itemData, 'ZZZ', 'The rendered item is correct');
                ready();
            }
        });

        runnerFactory('foo')
            .on('ready', function() {
                this.loadItem('zzz');
            })
            .init();
    });

    QUnit.test('load async and render item', function(assert) {
        var ready = assert.async();
        var resolved = false;

        assert.expect(4);

        runnerFactory.registerProvider('foo', {
            loadAreaBroker: _.noop,
            init: _.noop,
            loadItem: function(itemRef) {
                var p = new Promise(function(resolve) {
                    setTimeout(function() {
                        resolved = true;
                        resolve(items[itemRef]);
                    }, 50);
                });
                assert.equal(resolved, false, 'Item loading is not yet resolved');
                return p;
            },
            renderItem: function(itemRef, itemData) {
                assert.equal(resolved, true, 'Item loading is resolved');
                assert.equal(itemRef, 'zzz', 'The rendered item is correct');
                assert.equal(itemData, 'ZZZ', 'The rendered item is correct');
                ready();
            }
        });

        runnerFactory('foo')
            .on('ready', function() {
                this.loadItem('zzz');
            })
            .init();
    });

    QUnit.test('block render item', function(assert) {
        var ready = assert.async();
        assert.expect();

        runnerFactory.registerProvider('foo', {
            loadAreaBroker: _.noop,
            init: _.noop,
            loadItem: function(itemRef) {
                var p = new Promise(function(resolve) {
                    setTimeout(function() {
                        resolve(items[itemRef]);
                    }, 50);
                });
                return p;
            },
            renderItem: function() {
                assert.ok(false, 'renderItem should not be called');
                ready();
            }
        });

        runnerFactory('foo')
            .on('loaditem', function(itemRef, itemData) {
                assert.equal(itemRef, 'zzz', 'The rendered item is correct');
                assert.equal(itemData, 'ZZZ', 'The rendered item is correct');
                return Promise.reject();
            })
            .on('ready', function() {
                this.loadItem('zzz');
                setTimeout(function() {
                    assert.ok(true, 'renderItem has been blocked');
                    ready();
                }, 100);
            })
            .init();
    });

    QUnit.test('unload item async', function(assert) {
        var ready = assert.async();
        var loaded = true;

        assert.expect(4);

        runnerFactory.registerProvider('foo', {
            loadAreaBroker: _.noop,
            init: _.noop,
            unloadItem: function(itemRef) {
                assert.equal(itemRef, 'zzz', 'The provider is called with the correct reference');
                assert.equal(loaded, true, 'The item is not yet unloaded');

                return new Promise(function(resolve) {
                    setTimeout(function() {
                        loaded = false;
                        resolve();
                    }, 50);
                });
            }
        });

        runnerFactory('foo')
            .on('ready', function() {
                this.unloadItem('zzz');
            })
            .on('unloaditem', function(itemRef) {
                assert.equal(itemRef, 'zzz', 'The provider is called with the correct reference');
                assert.equal(loaded, false, 'The item is now unloaded');
                ready();
            })
            .init();
    });

    QUnit.test('item state', function(assert) {
        var ready = assert.async();
        assert.expect(17);

        runnerFactory.registerProvider('foo', {
            loadAreaBroker: _.noop,
            init: _.noop,
            loadItem: function(itemRef) {
                return items[itemRef];
            }
        });

        runnerFactory('foo')
            .on('init', function() {
                assert.throws(
                    function() {
                        this.getItemState();
                    },
                    TypeError,
                    'The item state should have an itemRef'
                );

                assert.throws(
                    function() {
                        this.getItemState('zzz');
                    },
                    TypeError,
                    'The item state should have an itemRef and a name'
                );

                assert.throws(
                    function() {
                        this.setItemState();
                    },
                    TypeError,
                    'The item state should have an itemRef'
                );

                assert.throws(
                    function() {
                        this.setItemState('zzz');
                    },
                    TypeError,
                    'The item state should have an itemRef and a name'
                );

                assert.equal(this.getItemState('zzz', 'loaded'), false, 'The item is not loaded');
                assert.equal(this.getItemState('zzz', 'ready'), false, 'The item is not ready');
                assert.equal(this.getItemState('zzz', 'foo'), false, 'The item is not foo');
            })
            .on('ready', function() {
                this.loadItem('zzz');
            })
            .on('loaditem', function(itemRef, itemData) {
                assert.equal(itemRef, 'zzz', 'The loaded item is correct');
                assert.equal(itemData, 'ZZZ', 'The loaded item data is correct');
                assert.equal(this.getItemState('zzz', 'loaded'), true, 'The item is loaded');
                assert.equal(this.getItemState('zzz', 'ready'), false, 'The item is not ready');

                this.setItemState('zzz', 'foo', true);
                assert.equal(this.getItemState('zzz', 'foo'), true, 'The item is foo');
            })
            .on('renderitem', function(itemRef, itemData) {
                assert.equal(itemRef, 'zzz', 'The rendered item is correct');
                assert.equal(itemData, 'ZZZ', 'The rendered item data is correct');
                assert.equal(this.getItemState('zzz', 'loaded'), true, 'The item is loaded');
                assert.equal(this.getItemState('zzz', 'ready'), true, 'The item is ready');
                assert.equal(this.getItemState('zzz', 'foo'), true, 'The item is foo');

                ready();
            })
            .init();
    });

    QUnit.test('disable items', function(assert) {
        var ready = assert.async();
        assert.expect(6);

        runnerFactory.registerProvider('foo', {
            loadAreaBroker: _.noop,
            init: _.noop,
            loadItem: function(itemRef) {
                return items[itemRef];
            },
            renderItem: function(itemRef) {
                var self = this;
                this.disableItem(itemRef);
                setTimeout(function() {
                    self.enableItem(itemRef);
                }, 50);
            }
        });

        runnerFactory('foo')
            .on('ready', function() {
                this.loadItem('zzz');
            })
            .on('loaditem', function(itemRef) {
                assert.equal(itemRef, 'zzz', 'The provider is called with the correct reference');
                assert.equal(this.getItemState('zzz', 'disabled'), false, 'The item is not disabled');
            })
            .on('disableitem', function(itemRef) {
                assert.equal(itemRef, 'zzz', 'The provider is called with the correct reference');
                assert.equal(this.getItemState('zzz', 'disabled'), true, 'The item is now disabled');
            })
            .on('enableitem', function(itemRef) {
                assert.equal(itemRef, 'zzz', 'The provider is called with the correct reference');
                assert.equal(this.getItemState('zzz', 'disabled'), false, 'The item is not disabled anymore');

                ready();
            })
            .init();
    });

    QUnit.test('init error', function(assert) {
        var ready = assert.async();
        assert.expect(2);

        runnerFactory.registerProvider('foo', {
            loadAreaBroker: _.noop,
            init: function() {
                return new Promise(function(resolve, reject) {
                    reject(new Error('test'));
                });
            }
        });

        runnerFactory('foo')
            .on('error', function(err) {
                assert.ok(err instanceof Error, 'The parameter is an error');
                assert.equal(err.message, 'test', 'The error message is correct');
                ready();
            })
            .init();
    });

    QUnit.test('context and data', function(assert) {
        var ready = assert.async();
        var testData = {
            items: {
                lemmy: 'kilmister',
                david: 'bowie'
            }
        };

        var testMap = {
            jumps: [],
            parts: [],
            map: {}
        };

        assert.expect(12);

        runnerFactory.registerProvider('foo', {
            loadAreaBroker: _.noop,
            init: function() {
                this.setTestData(testData);
                this.setTestContext({ best: testData.items.lemmy });
                this.setTestMap(testMap);
            }
        });

        runnerFactory('foo')
            .on('error', function(err) {
                assert.ok(false, err);
                ready();
            })
            .on('init', function() {
                var context = this.getTestContext();
                var data = this.getTestData();
                var map = this.getTestMap();

                assert.equal(typeof context, 'object', 'The test context is an object');
                assert.equal(typeof data, 'object', 'The test data is an object');
                assert.equal(typeof map, 'object', 'The test map is an object');
                assert.deepEqual(data, testData, 'The test data is correct');
                assert.equal(context.best, 'kilmister', 'The context gives you the best');
                assert.equal(map, testMap, 'The map is correct');

                this.destroy();
            })
            .on('destroy', function() {
                var context = this.getTestContext();
                var data = this.getTestData();
                var map = this.getTestMap();

                assert.equal(typeof context, 'object', 'The test context is an object');
                assert.equal(typeof data, 'object', 'The test data is an object');
                assert.equal(typeof map, 'object', 'The test map is an object');
                assert.deepEqual(data, testData, 'The test data is correct');
                assert.equal(typeof context.best, 'undefined', 'The context is now empty');
                assert.equal(typeof map.jumps, 'undefined', 'The map is now empty');

                ready();
            })
            .init();
    });

    QUnit.test('move next', function(assert) {
        var ready = assert.async();
        assert.expect(2);

        runnerFactory.registerProvider('foo', {
            loadAreaBroker: _.noop,
            init: function init() {
                this.on('init', function() {
                    assert.ok(true, 'we can listen for init in providers init');
                    this.next();
                }).on('move', function(type) {
                    assert.equal(type, 'next', 'The sub event is correct');
                    ready();
                });
            }
        });

        runnerFactory('foo').init();
    });

    QUnit.test('move previous', function(assert) {
        var ready = assert.async();
        assert.expect(2);

        runnerFactory.registerProvider('foo', {
            loadAreaBroker: _.noop,
            init: function init() {
                this.on('init', function() {
                    assert.ok(true, 'we can listen for init in providers init');
                    this.previous();
                }).on('move', function(type) {
                    assert.equal(type, 'previous', 'The sub event is correct');
                    ready();
                });
            }
        });

        runnerFactory('foo').init();
    });

    QUnit.test('jump', function(assert) {
        var ready = assert.async();
        var expectedScope = 'section';
        var expectedPosition = 3;

        assert.expect(4);

        runnerFactory.registerProvider('foo', {
            loadAreaBroker: _.noop,
            init: function init() {
                this.on('init', function() {
                    assert.ok(true, 'we can listen for init in providers init');
                    this.jump(expectedPosition, expectedScope);
                }).on('move', function(type, scope, position) {
                    assert.equal(type, 'jump', 'The sub event is correct');
                    assert.equal(scope, expectedScope, 'The scope is correct');
                    assert.equal(position, expectedPosition, 'The position is correct');

                    ready();
                });
            }
        });

        runnerFactory('foo').init();
    });

    QUnit.test('skip', function(assert) {
        var ready = assert.async();
        assert.expect(4);

        runnerFactory.registerProvider('mock', mockProvider);

        runnerFactory('mock')
            .on('ready', function() {
                assert.ok(true, 'The runner is ready');
                this.skip('section', 1, 'jump');
            })
            .on('move', function() {
                assert.ok(false, 'Skip is not a move');
            })
            .on('skip', function(scope, ref, direction) {
                console.log(scope, ref, direction)
                assert.equal(scope, 'section', 'The scope is correct');
                assert.equal(ref, 1, 'The ref is correct');
                assert.equal(direction, 'jump', 'The direction is correct');
                ready();
            })
            .init();
    });

    QUnit.test('timeout', function(assert) {
        var ready = assert.async();
        var expectedScope = 'assessmentSection';
        var expectedRef = 'assessmentSection-1';
        var expectedTimer = {
            time: 30
        };

        assert.expect(5);

        runnerFactory.registerProvider('foo', {
            loadAreaBroker: _.noop,
            init: function init() {
                this.on('init', function() {
                    assert.ok(true, 'we can listen for init in providers init');
                    this.timeout(expectedScope, expectedRef, expectedTimer);
                }).on('timeout', function(scope, ref, timer) {
                    assert.ok(true, 'The timeout event has been triggered');

                    assert.equal(scope, expectedScope, 'The timeout scope is provided');
                    assert.equal(ref, expectedRef, 'The timeout ref is provided');
                    assert.equal(timer, expectedTimer, 'The timer is provided');

                    ready();
                });
            }
        });

        runnerFactory('foo').init();
    });

    QUnit.test('exit', function(assert) {
        var ready = assert.async();
        var expectedReason = 'the reason why';

        assert.expect(3);

        runnerFactory.registerProvider('foo', {
            loadAreaBroker: _.noop,
            init: function init() {
                this.on('init', function() {
                    assert.ok(true, 'we can listen for init in providers init');
                    this.exit(expectedReason);
                }).on('exit', function(why) {
                    assert.ok(true, 'The exit event has been triggered');

                    assert.equal(why, expectedReason, 'The exit reason is provided');

                    ready();
                });
            }
        });

        runnerFactory('foo').init();
    });

    QUnit.test('pause and resume', function(assert) {
        var ready = assert.async();
        assert.expect(5);

        runnerFactory.registerProvider('foo', {
            loadAreaBroker: _.noop,
            init: function init() {
                this.on('init', function() {
                    assert.ok(true, 'we can listen for init in providers init');

                    this.pause();
                })
                    .on('pause', function() {
                        assert.ok(true, 'The pause event has been triggered');
                        assert.ok(this.getState('pause'), 'The runner is paused');

                        this.resume();
                    })
                    .on('resume', function() {
                        assert.ok(true, 'The resume event has been triggered');
                        assert.ok(!this.getState('resume'), 'The runner is resumed');

                        ready();
                    });
            }
        });

        runnerFactory('foo').init();
    });

    QUnit.test('proxy', function(assert) {
        var ready = assert.async();

        var expectedProxy = eventifier({
            init: _.noop,
            install: _.noop,
            destroy: function() {
                assert.ok(true, 'The proxy.destroy method has been called');
                return Promise.resolve();
            }
        });

        var expectedError = 'an error';

        assert.expect(6);

        runnerFactory.registerProvider('foo', {
            loadAreaBroker: _.noop,
            loadProxy: function() {
                assert.ok(true, 'The loadProxy method has been called');
                return expectedProxy;
            },
            init: function init() {
                this.on('init', function() {
                    assert.ok(true, 'we can listen for init in providers init');
                    this.destroy();
                })
                    .on('error', function(error) {
                        assert.ok(true, 'The error event has been triggered');
                        assert.equal(error, expectedError, 'The right error is provided');
                    })
                    .on('destroy', function() {
                        assert.ok(true, 'The runner is destroying');
                        ready();
                    })
                    .getProxy()
                    .trigger('error', expectedError);
            }
        });

        runnerFactory('foo').init();
    });

    QUnit.test('probeOverseer', function(assert) {
        var probeOverseer;
        var expectedProbeOverseer = {
            init: function() {},
            destroy: function() {}
        };

        assert.expect(2);

        runnerFactory.registerProvider('foo', {
            loadAreaBroker: _.noop,
            init: _.noop,
            loadProbeOverseer: function() {
                assert.ok(true, 'The loadProbeOverseer method has been called');
                return expectedProbeOverseer;
            }
        });

        probeOverseer = runnerFactory('foo').getProbeOverseer();

        assert.equal(probeOverseer, expectedProbeOverseer, 'The right probeOverseer has been provided');
    });

    QUnit.test('no loadProxy', function(assert) {
        assert.expect(1);

        runnerFactory.registerProvider('foo', mockProvider);

        assert.throws(function() {
            runnerFactory('foo').getProxy();
        }, 'An exception is thrown when the loadAreaBroker() is missing');
    });

    QUnit.test('no loadAreaBroker', function(assert) {
        assert.expect(1);

        assert.throws(function() {
            runnerFactory.registerProvider('foo', {
                init: _.noop
            });
        }, 'An exception is thrown when the loadAreaBroker() is missing');
    });

    QUnit.test('getDataHolder', function(assert) {
        var dataHolder;

        assert.expect(5);

        runnerFactory.registerProvider('foo', mockProvider);

        dataHolder = runnerFactory('foo').getDataHolder();

        assert.equal(typeof dataHolder, 'object', 'The runner exposes the data holder');
        assert.equal(typeof dataHolder.get, 'function', 'The data holder has the get method');
        assert.equal(typeof dataHolder.set, 'function', 'The data holder has the set method');
        assert.equal(typeof dataHolder.get('testContext'), 'object', 'The data holder holds the correct data');
        assert.equal(typeof dataHolder.get('testMap'), 'object', 'The data holder holds the correct data');
    });

    QUnit.test('load dataholder', function(assert) {
        const expectedDataHolder = new Map();

        assert.expect(2);

        runnerFactory.registerProvider('foo', {
            loadAreaBroker: _.noop,
            init: _.noop,
            loadDataHolder() {
                assert.ok(true, 'The loadDataHolder method has been called');
                return expectedDataHolder;
            }
        });

        const dataHolder = runnerFactory('foo').getDataHolder();

        assert.equal(dataHolder, expectedDataHolder, 'The custom data holder has been loaded');
    });

    QUnit.cases.init([
        { title: 'next', parameters: ['item'] },
        { title: 'previous', parameters: ['section'] },
        { title: 'jump', parameters: [10, 'item'] },
        { title: 'skip', parameters: ['item', null, 'next'] },
        { title: 'exit', parameters: ['logout'] },
        { title: 'pause', parameters: [] },
        { title: 'resume', parameters: [] , pause : true },
        { title: 'timeout', parameters: ['test', 'test1', { t0 : 50 }] },
    ]).test('action exposed on provider', function(data, assert) {
        assert.expect(2);
        const action = data.title;

        runnerFactory.registerProvider('foo', {
            loadAreaBroker: _.noop,
            init: _.noop,
            [action](...parameters){
                assert.ok(true, 'the action is called from the provider');
                assert.deepEqual(parameters, data.parameters, 'Parameters are delegated to the provider');
            }
        });

        const runner = runnerFactory('foo').init();
        runner.setState('pause', data.pause);
        runner[action](...data.parameters);
    });

    QUnit.module('plugins', {
        beforeEach() {
            runnerFactory.clearProviders();
        }
    });

    QUnit.test('initialize', function(assert) {
        var ready = assert.async();

        var boo = pluginFactory({
            name: 'boo',
            init: function init() {
                assert.ok(true, 'the plugin is initializing');
            }
        });

        assert.expect(6);

        runnerFactory.registerProvider('foo', {
            loadAreaBroker: _.noop,
            init: function init() {
                this.on('plugin-init.boo', function(plugin) {
                    assert.equal(plugin, this.getPlugin('boo'), 'The event has a plugin in parameter');
                    assert.equal(typeof plugin, 'object', 'The event has a plugin in parameter');
                    assert.ok(plugin.getState('init'), 'The plugin is initialized');
                    ready();
                });
            }
        });

        runnerFactory('foo', {
            boo: boo
        })
            .on('ready', function() {
                assert.equal(typeof this.getPlugin('moo'), 'undefined', 'The moo plugin does not exist');
                assert.equal(typeof this.getPlugin('boo'), 'object', 'The boo plugin exists');
            })
            .init();
    });


    QUnit.test('get plugin config', assert => {
        const ready = assert.async();
        const config = {
            serviceCallId : '123-456-789',
            provider : {
                proxy : 'foo'
            },
            bootstrap : {
                serviceUrl : '/foo'
            },
            options : {
                fullScreen : false,
                plugins : {
                    boo :  {
                        section : true,
                        testPart : false
                    },
                    bar : {
                        icon : 'net',
                        timeout : 3500
                    }
                }
            }
        };

        const boo = pluginFactory({
            name: 'boo',
            init() {}
        });
        const bar = pluginFactory({
            name: 'bar',
            init() {}
        });

        assert.expect(7);

        runnerFactory.registerProvider('foo', {
            loadAreaBroker: _.noop,
            init() {
                assert.equal(typeof this.getPlugin('moo'), 'undefined', 'The moo plugin does not exist');
                assert.equal(typeof this.getPlugin('boo'), 'object', 'The boo plugin exists');
                assert.equal(typeof this.getPlugin('bar'), 'object', 'The bar plugin exists');

                assert.deepEqual(this.getPluginsConfig(), config.options.plugins, 'The plugins config is set');

                assert.deepEqual(this.getPluginConfig('yup'), {},  'No plugin, no config');

                assert.deepEqual(this.getPluginConfig('boo'), config.options.plugins.boo, 'The plugin config is set');

                assert.deepEqual(this.getPluginConfig('bar'), config.options.plugins.bar, 'The plugin config is set');
                ready();
            }
        });

        runnerFactory('foo', { boo, bar }, config).init();
    });

    QUnit.test('persistent state', function(assert) {
        var ready2 = assert.async();
        var ready1 = assert.async();
        var states = {};

        var expectedName = 'pause';
        var expectedValue = true;

        assert.expect(9);
        const ready = assert.async();

        runnerFactory.registerProvider('foo', {
            loadAreaBroker: _.noop,
            init: _.noop,
            getPersistentState: function(name) {
                assert.equal(
                    name,
                    expectedName,
                    'The getPersistentState() method has been delegated to the provider with the right name'
                );
                return states[name];
            },
            setPersistentState: function(name, value) {
                assert.equal(
                    name,
                    expectedName,
                    'The setPersistentState() method has been delegated to the provider with the right name'
                );
                assert.equal(
                    value,
                    expectedValue,
                    'The setPersistentState() method has been delegated to the provider with the right value'
                );
                states[name] = value;
            }
        });

        runnerFactory('foo')
            .on('ready', function() {
                var self = this;
                this.setPersistentState(expectedName, 1).then(function() {
                    assert.ok(true, 'The setPersistentState() method has returned a promise that has been resolved');

                    assert.equal(
                        self.getPersistentState(expectedName),
                        expectedValue,
                        'The getPersistentState() method has returned the expected value'
                    );

                    runnerFactory('foo')
                        .on('ready', function() {
                            assert.equal(
                                this.getPersistentState(expectedName),
                                expectedValue,
                                'The state has persisted between runner instances'
                            );

                            ready();
                        })
                        .init();
                });

                this.setPersistentState().catch(function() {
                    assert.ok(
                        true,
                        'The setPersistentState() method has returned a promise that has been rejected due to missing name'
                    );

                    ready1();
                });

                this.setPersistentState('').catch(function() {
                    assert.ok(
                        true,
                        'The setPersistentState() method has returned a promise that has been rejected due to empty name'
                    );

                    ready2();
                });
            })
            .init();
    });
});
