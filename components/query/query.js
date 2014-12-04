define(['angular', 'map', 'toolbar'],

    function(angular) {
        angular.module('hs.query', ['hs.map', 'hs.toolbar'])
            .directive('infopanel', function() {
                return {
                    templateUrl: hsl_path + 'components/query/partials/infopanel.html'
                };
            }).service("WmsGetFeatureInfo", ['$http',
                function($http) {
                    this.request = function(url) {
                        var url = window.escape(url);
                        $http.get("/cgi-bin/hsproxy.cgi?toEncoding=utf-8&url=" + url).success(this.featureInfoReceived);
                    };

                }
            ]).service("InfoPanelService", ['$rootScope',
                function($rootScope) {
                    var me = {
                        //Used for tool specific info, such as lodexplorer region names and values
                        attributes: [],
                        //Used for getfeatureinfo. There exists a seperate group for each feature which is found at the specific coordinates
                        groups: [],
                        setAttributes: function(j) {
                            me.attributes = j;
                            $rootScope.$broadcast('infopanel.updated');
                        },
                        setGroups: function(j) {
                            me.groups = j;
                            $rootScope.$broadcast('infopanel.updated');
                        }
                    };

                    return me;
                }
            ])

        .controller('Query', ['$scope', 'OlMap', 'WmsGetFeatureInfo', 'InfoPanelService', 'ToolbarService',
            function($scope, OlMap, WmsGetFeatureInfo, InfoPanelService, ToolbarService) {
                var map = OlMap.map;
                $scope.myname = "shady";
                $scope.InfoPanelService = InfoPanelService;

                var point_clicked = new ol.geom.Point([0, 0]);
                var lyr = null;

                $scope.$on('layermanager.updated', function(event) {
                    if (lyr) map.getLayers().remove(lyr);
                    lyr = new ol.layer.Vector({
                        title: "Point clicked",
                        source: new ol.source.Vector({
                            features: [new ol.Feature({
                                geometry: point_clicked
                            })]
                        }),
                        show_in_manager: false
                    });
                    map.addLayer(lyr);
                });

                //For vector layers use this to get the selected features
                var selector = new ol.interaction.Select({
                    condition: ol.events.condition.click
                });
                selector.getFeatures().on('add', function(e) {
                    if (ToolbarService.mainpanel == 'measure') return;
                    var attributes = [];
                    e.element.getKeys().forEach(function(key) {
                        if (key == 'gid' || key == 'geometry') return;
                        attributes.push({
                            name: key,
                            value: e.element.get(key)
                        });
                    })
                    ToolbarService.setMainPanel("info");
                    InfoPanelService.setAttributes(attributes);
                })
                map.addInteraction(selector);

                //For wms layers use this to get the features at mouse coordinates
                map.on('singleclick', function(evt) {
                    if (ToolbarService.mainpanel == 'measure') return;
                    point_clicked.setCoordinates(evt.coordinate, 'XY');
                    InfoPanelService.setGroups([{
                        name: "Coordinates",
                        attributes: [{
                            "name": "EPSG:4326",
                            "value": ol.coordinate.toStringHDMS(ol.proj.transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326'))
                        }, {
                            "name": "EPSG:3857",
                            "value": ol.coordinate.createStringXY(7)(evt.coordinate)
                        }]
                    }]);
                    map.getLayers().forEach(function(layer) {
                        queryLayer(layer, evt)
                    });
                });

                var queryLayer = function(layer, evt) {
                    if (layer instanceof ol.layer.Tile &&
                        layer.getSource() instanceof ol.source.TileWMS &&
                        layer.getSource().getParams().INFO_FORMAT) {
                        var source = layer.getSource();
                        var viewResolution = map.getView().getResolution();
                        var url = source.getGetFeatureInfoUrl(
                            evt.coordinate, viewResolution, source.getProjection() ? source.getProjection() : map.getView().getProjection(), {
                                'INFO_FORMAT': source.getParams().INFO_FORMAT
                            });
                        if (url) {
                            if (console) console.log(url);
                            WmsGetFeatureInfo.request(url);
                        }
                    }
                }

                WmsGetFeatureInfo.featureInfoReceived = function(response) {
                    /* Maybe this will work in future OL versions
                     *
                     * var format = new ol.format.GML();
                     *  console.log(format.readFeatures(response, {}));
                     */

                    var x2js = new X2JS();
                    var json = x2js.xml_str2json(response);
                    var something_updated = false;
                    for (var feature in json.FeatureCollection.featureMember) {
                        if (feature == "__prefix") continue;
                        feature = json.FeatureCollection.featureMember[feature];
                        var group = {
                            name: "Feature",
                            attributes: []
                        };

                        for (var attribute in feature) {
                            if (feature[attribute].__text) {
                                group.attributes.push({
                                    "name": attribute,
                                    "value": feature[attribute].__text
                                });
                                something_updated = true;
                            }
                        }
                        if (something_updated)
                            InfoPanelService.groups.push(group);
                    }
                    if (something_updated) InfoPanelService.setGroups(InfoPanelService.groups);
                }

                $scope.$on('infopanel.updated', function(event) {
                    if (console) console.log(new Date());
                    if (!$scope.$$phase) $scope.$digest();
                });

            }
        ]);
    })