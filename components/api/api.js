/**
 * @namespace hs.api
 * @memberOf hs
 */
define(['angular', 'ol', 'app', 'map', 'core'],

    function(angular, ol, app, map) {
        angular.module('hs.api', ['hs', 'hs.map', 'hs.core'])
            .service("Api", ['$rootScope', 'hs.map.service', '$controller', 'Core',
                function($rootScope, OlMap, $controller, Core) {
                    var me = {};
                    me.gui = {};
                    $rootScope.$on("scope_loaded", function(event, args) {
                        me.gui[args] = {};
                        for (var key in event.targetScope) {
                            //Dont show angularjs functions in the api
                            if (typeof event.targetScope.__proto__[key] === 'undefined') {
                                me.gui[args][key] = event.targetScope[key];
                            }
                        }
                    });
                    me.listScopes = function() {
                        var scopes = Core.getAllScopes();
                        var tmp = {};
                        for (var i = 0; i < scopes.length; i++) {
                            if (scopes[i].scope_name) {
                                tmp[scopes[i].scope_name] = scopes[i];
                            }
                        }
                        return tmp;
                    }
                    me.gui.setLanguage = function(lang) {
                        Core.setLanguage(lang);
                    }

                    me.getMap = function() {
                        return OlMap.map;
                    }

                    var recurseObject = function(obj, levels) {
                        levels += '\t';
                        if (levels.length > 5) return;
                        if (typeof obj === 'function') {
                            var fnStr = obj.toString().replace(/[\n\t]/g, ' '),
                                argStr = fnStr.match(/\((.+?\))/),
                                len = (argStr ? (argStr.index + argStr[0].length) : 11),
                                fnBodyStr = fnStr.substring(len),
                                metaData = {
                                    func: [],
                                    args: {}
                                };

                            console.log(levels, 'function', key, argStr ? argStr[0].split('{')[0] : "()");
                        }
                        if (typeof obj === 'object') {
                            var has_indexes = !(obj && typeof obj.length === 'undefined');
                            console.log(levels, key + (has_indexes ? '' : '.'));
                            if (!has_indexes) {
                                for (key in obj) {
                                    recurseObject(obj[key], levels);
                                }
                            }
                        }
                    }

                    me.printApiDefinitions = function() {
                        for (key in window.hslayers_api) {
                            recurseObject(window.hslayers_api[key], '');
                        }
                    }

                    window.hslayers_api = me;


                }
            ])

        .run(function(Api) {});
    })
