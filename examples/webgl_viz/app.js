'use strict';

define(['ol', 
        'toolbar', 
        'layermanager', 
        'WfsSource', 'query', 
        'search', 
        'print', 
        'permalink', 
        'measure', 
        'geolocation', 
        'api', 
        'glutils','wgl','manager','mapcontroller','dataloader','d3','dimension','heatmapdimension'],

    function(ol, toolbar, layermanager, WfsSource) {
        var module = angular.module('hs', [
            'hs.toolbar',
            'hs.layermanager',
            'hs.query',
            'hs.search', 'hs.print', 'hs.permalink',
            'hs.geolocation']);

        module.directive('hs', ['OlMap', 'Core', '$compile', 'webgl_viz', function(OlMap, Core, $compile, webgl_viz) {
            return {
                templateUrl: hsl_path + 'hslayers.html',
                link: function(scope, element) {
                    Core.fullscreenMap(element);
                    //webgl_viz.webgl_el = $compile('<canvas id="webglayer"></canvas>')(scope);
                    //element.append(webgl_viz.webgl_el);
                    webgl_viz.init();
                    //$("#right-pane", element).append($compile('<div yearselector ng-controller="YearSelector"></div>')(scope));
                }
            };
        }]);
        
        module.service('webgl_viz', ['OlMap', function(OlMap) {
            var me = {
                map: OlMap.map,
                ol: ol,
                init: function(){wgl(this);}
            };

            return me;
        }])

        module.value('box_layers', []);

        module.value('default_layers', [
            new ol.layer.Tile({
                source: new ol.source.OSM(),
                title: "Base layer",
                box_id: 'osm',
                base: true
            })
        ]);

        module.value('default_view', new ol.View({
            center: ol.proj.transform([17.474129, 52.574000], 'EPSG:4326', 'EPSG:3857'), //Latitude longitude    to Spherical Mercator
            zoom: 4,
            units: "m"
        }));

        module.controller('Main', ['$scope', 'Core', 'OlMap', 'default_layers', 'webgl_viz',
            function($scope, Core, OlMap, default_layers, webgl_viz) {
                if (console) console.log("Main called");
                $scope.hsl_path = hsl_path; //Get this from hslayers.js file
                $scope.Core = Core;
                
                var map = OlMap.map;                
                $scope.$on('infopanel.updated', function(event) {});
                  
              
            }
        ]);

        return module;
    });
