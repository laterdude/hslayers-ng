/**
 * @namespace hs.ows
 * @memberOf hs
 */

define(['angular', 'map', 'ows.wms', 'ows.wmts', 'ows.wfs', 'ows.nonwms', 'ows.wmsprioritized', 'permalink'],

    function(angular) {
        var ows = angular.module('hs.ows', ['hs.map', 'hs.ows.wms', 'hs.ows.wmts', 'hs.ows.nonwms', 'hs.ows.wmsprioritized'])
            .directive('hs.ows.directive', function() {
                return {
                    templateUrl: hsl_path + 'components/ows/partials/ows.html?bust=' + gitsha
                };
            })
            .controller('hs.ows.controller', ['$scope', '$injector', 'hs.ows.wms.service_capabilities', 'hs.ows.wmts.service_capabilities', 'hs.map.service', 'hs.permalink.service_url', 'Core', 'hs.ows.nonwms.service', 'config',
                function($scope, $injector, srv_wms_caps, srv_wmts_caps, OlMap, permalink, Core, nonwmsservice, config) {
                    var map = OlMap.map;
                    if (window.allowWFS2) {
                        srv_wfs_caps = $injector.get('hs.ows.wfs.service_capabilities');
                    }
                    if (angular.isArray(config.connectTypes)) {
                        $scope.types = config.connectTypes;
                    } else {
                        $scope.types = ["", "WMS", "KML", "GeoJSON"];
                    }
                    $scope.type = "";
                    $scope.image_formats = [];
                    $scope.query_formats = [];
                    $scope.tile_size = 512;
                    $scope.setUrlAndConnect = function(url, type) {
                        $scope.url = url;
                        $scope.type = type;
                        $scope.connect();
                    }
                    $scope.connect = function() {
                        $('.ows-capabilities').slideDown();
                        switch ($scope.type.toLowerCase()) {
                            case "wms":
                                srv_wms_caps.requestGetCapabilities($scope.url);
                                $scope.showDetails = true;
                                break;
                            case "wmts":
                                srv_wmts_caps.requestGetCapabilities($scope.url);
                                $scope.showDetails = true;
                                break;
                            case "wfs":
                                if (window.allowWFS2) {
                                    srv_wfs_caps.requestGetCapabilities($scope.url);
                                    $scope.showDetails = true;
                                }
                                break;
                        }
                    };

                    /**TODO: move variables out of this function. Call $scope.connected = false when template change */
                    $scope.templateByType = function() {
                        var template;
                        var ows_path = hsl_path + 'components/ows/partials/';
                        switch ($scope.type.toLowerCase()) {
                            case "wms":
                                template = ows_path + 'owswms.html';
                                break;
                            case "wmts":
                                template = ows_path + 'owswmts.html';
                                break;
                            case "wms with priorities":
                                template = ows_path + 'owsprioritized.html';
                                break;
                            case "wfs":
                                if (window.allowWFS2) {
                                    template = ows_path + 'owswfs.html';
                                }
                                break;
                            case "kml":
                            case "geojson":
                                template = ows_path + 'owsnonwms.html';
                                $scope.showDetails = true;
                                break;
                            default:
                                break;
                        }
                        return template;
                    };

                    $scope.isService = function() {
                        if (["kml", "geojson", "json"].indexOf($scope.type.toLowerCase()) > -1) {
                            return false;
                        } else {
                            return true;
                        }
                    }

                    $scope.clear = function() {
                        $scope.url = '';
                        $('.ows-capabilities').slideUp();
                        $scope.showDetails = false;
                    }

                    function zoomToVectorLayer(lyr) {
                        Core.setMainPanel('layermanager');
                        lyr.getSource().on('change', function() { //Event needed because features are loaded asynchronously
                            var extent = lyr.getSource().getExtent();
                            if (extent != null) map.getView().fit(extent, map.getSize());
                        });
                    }

                    if (permalink.getParamValue('wms_to_connect')) {
                        var wms = permalink.getParamValue('wms_to_connect');
                        Core.setMainPanel(Core.singleDatasources ? 'datasource_selector' : 'ows');
                        $scope.setUrlAndConnect(wms, 'WMS');
                        if (Core.singleDatasources) $('.dss-tabs a[href="#OWS"]').tab('show');
                    }

                    if (permalink.getParamValue('wfs_to_connect') && window.allowWFS2) {
                        var wfs = permalink.getParamValue('wfs_to_connect');
                        Core.setMainPanel(Core.singleDatasources ? 'datasource_selector' : 'ows');
                        $scope.setUrlAndConnect(wfs, 'WFS');
                        if (Core.singleDatasources) $('.dss-tabs a[href="#OWS"]').tab('show');
                    }

                    var title = decodeURIComponent(permalink.getParamValue('title')) || 'Layer';
                    var abstract = decodeURIComponent(permalink.getParamValue('abstract'));

                    if (permalink.getParamValue('geojson_to_connect')) {
                        var url = permalink.getParamValue('geojson_to_connect');
                        var lyr = nonwmsservice.add('geojson', url, title, abstract, false, 'EPSG:4326');
                        zoomToVectorLayer(lyr);
                    }

                    if (permalink.getParamValue('kml_to_connect')) {
                        var url = permalink.getParamValue('kml_to_connect');
                        var lyr = nonwmsservice.add('kml', url, title, abstract, true, 'EPSG:4326');
                        zoomToVectorLayer(lyr);
                    }



                    $scope.$emit('scope_loaded', "Ows");
                }
            ]);
        if (window.allowWFS2) {
            ows.requires.push('hs.ows.wfs');
        }
    })
