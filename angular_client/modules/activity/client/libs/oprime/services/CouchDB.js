console.log("Loading CouchDBServices");
/*
 * http://guide.couchdb.org/draft/security.html
 * http://docs-next.angularjs.org/api/angular.module.ngCookies.$cookies
 * https://groups.google.com/forum/#!topic/angular/yc8tODmDm18
 * http://mail-archives.apache.org/mod_mbox/couchdb-user/201011.mbox/%3CAANLkTimSxUWQhwYfTTGe1vNkhkf2xnMiWmt9eriKMU8P@mail.gmail.com%3E
 *
 */

'use strict';
define(
  ["angular", "OPrime"],
  function(angular, OPrime) {

    var CouchDBServices = angular
      .module('CouchDBServices', ['ngResource'])
      .factory(
        "isAUser",
        function($resource) {
          return $resource(OPrime.couchURL().complete + "_design/user/_view/isauser", {}, {
            run: {
              method: "POST",
              data: {
                name: "semisecureadmin",
                password: "none"
              }
              // isArray : false
            }
          });
        })
      .factory(
        "getUserRoles",
        function($resource) {
          return $resource(OPrime.couchURL().complete + "_design/user/_view/roles", {}, {
            run: {
              method: "GET",
              isArray: false
            }
          });
        })
      .factory(
        'GetSessionToken',
        function($http) {
          OPrime.debug("Contacting the DB to log user in.");
          if (!OPrime.useUnsecureCouchDB()) {
            return {
              'run': function(dataToPost) {
                OPrime.debug("Getting session token.");
                var couchInfo = OPrime.couchURL();
                var promise = $http.get(
                  couchInfo.protocol + couchInfo.domain + couchInfo.port + '/_session', dataToPost).then(
                  function(response) {
                    OPrime.debug("Session token set, probably", response);
                    if (localStorage.getItem(response.data.userCtx.name)) {
                      return JSON.parse(localStorage.getItem(response.data.userCtx.name));
                    }
                    if (response.data.userCtx.name) {
                      localStorage.setItem(response.data.userCtx.name, JSON.stringify(response.data.userCtx));
                    }
                    return response.data.userCtx;
                  },
                  function(error) {
                    return {
                      error: error
                    };
                  });
                return promise;
              }
            };
          } else {
            OPrime
              .debug("Not getting session token, instead using an unsecure TouchDB.");
            return {
              'run': function(dataToPost) {
                var couchInfo = OPrime.couchURL();
                var promise = $http.get(
                  couchInfo.protocol + couchInfo.domain + couchInfo.port + '', dataToPost).then(
                  function(response) {
                    OPrime.debug("Faking Session token set");
                    return response;
                  });
                return promise;
              }
            };
          }
        }).factory(
        'Login',
        function($http) {
          OPrime.debug("Contacting the DB to log user in.");
          if (!OPrime.useUnsecureCouchDB()) {
            return {
              'run': function(dataToPost) {
                OPrime.debug("Getting session token.");
                var couchInfo = OPrime.couchURL();
                var promise = $http.post(
                  couchInfo.protocol + couchInfo.domain + couchInfo.port + '/_session', dataToPost).then(
                  function(response) {
                    OPrime.debug("Session token set, probably", response);
                    if (response.data.name) {
                      localStorage.setItem(response.data.name, JSON.stringify(response.data));
                    }
                    return response.data;
                  },
                  function(error) {
                    return {
                      error: error
                    };
                  });
                return promise;
              }
            };
          } else {
            OPrime
              .debug("Not getting session token, instead using an unsecure TouchDB.");
            return {
              'run': function(dataToPost) {
                var couchInfo = OPrime.couchURL();
                var promise = $http.get(
                  couchInfo.protocol + couchInfo.domain + couchInfo.port + '', dataToPost).then(
                  function(response) {
                    OPrime.debug("Faking Session token set");
                    return response;
                  });
                return promise;
              }
            };
          }
        }).factory(
        'Logout',
        function($http) {
          OPrime.debug("Contacting the DB to log user in.");
          return {
            'run': function() {
              OPrime.debug("Getting session token.");
              var couchInfo = OPrime.couchURL();
              var promise = $http.delete(
                couchInfo.protocol + couchInfo.domain + couchInfo.port + '/_session').then(
                function(response) {
                  OPrime.debug("Session token set, probably",
                    response);
                  return response;
                },
                function(error) {
                  return {
                    error: error
                  };
                });
              return promise;
            }
          };
        });

    return CouchDBServices;

  });
