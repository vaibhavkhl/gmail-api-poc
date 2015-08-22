'use strict';

/**
 * @ngdoc function
 * @name gmailAppApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the gmailAppApp
 */
angular.module('gmailAppApp')
    .controller('MainCtrl', function ($scope, $filter) {
        // Your Client ID can be retrieved from your project in the Google
        // Developer Console, https://console.developers.google.com
        var CLIENT_ID = '1042316795013-09puaanar8ickpkeq1cnlnp7m3il9p16.apps.googleusercontent.com';

        var SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

        $scope.isAuthorized = true;
        $scope.messages = [];
        /**
         * Check if current user has authorized this application.
         */
        function checkAuth() {
            gapi.auth.authorize(
                {
                    'client_id': CLIENT_ID,
                    'scope': SCOPES,
                    'immediate': true
                }, handleAuthResult);
        }

        $scope.authorize = function () {
            gapi.auth.authorize(
                {client_id: CLIENT_ID, scope: SCOPES, immediate: false},
                handleAuthResult);
            return false;
        };

        checkAuth();

        /**
         * Handle response from authorization server.
         *
         * @param {Object} authResult Authorization result.
         */
        function handleAuthResult(authResult) {
            if (authResult && !authResult.error) {
                console.log('authorized');
                $scope.isAuthorized = true;
                loadGmailApi();
            } else {
                console.log('not authorized');
                $scope.isAuthorized = false;
                $scope.$apply();
            }
        }

        /**
         * Load Gmail API client library. List labels once client library
         * is loaded.
         */
        function loadGmailApi() {
            gapi.client.load('gmail', 'v1', loadData);
        }

        function loadData() {
            console.log('loading data');
            listLabels();
            //listMessages();
        }

        function listLabels() {
            var request = gapi.client.gmail.users.labels.list({
                'userId': 'me'
            });
            request.execute(function (resp) {
                $scope.labels = resp.labels;
                $scope.$apply()
            })
        }

        $scope.searchMsg = function () {
            var q = getQueryParam();

            var request = gapi.client.gmail.users.messages.list({
                'userId': 'me',
                'q': q
            });

            request.then(function (resp) {
                getMessages(resp.result.messages)
            })
        };

        function getQueryParam() {
            if ($scope.param.start_date) {
                var after = 'after:' + $filter('date')($scope.param.start_date, 'yyyy/MM/dd');
            }

            if ($scope.param.end_date) {
                var before = 'before:' + $filter('date')($scope.param.end_date, 'yyyy/MM/dd');
            }

            if ($scope.param.from) {
                var from = 'from:' + $scope.param.from;
            }

            if (from) {
                var q = after + before + from;
            } else {
                var q = after + before;
            }
            return encodeURI(q.toString());
        }

        $scope.getMsgsForLabel = function (labelId) {
            var request = gapi.client.gmail.users.messages.list({
                'userId': 'me',
                'labelIds': labelId
            });

            request.execute(function (resp) {
                //$scope.msgCount = resp.resultSizeEstimate;
                getMessages(resp.messages)
            })
        };

        // function listMessages() {
        //   var request = gapi.client.gmail.users.messages.list({
        //     'userId': 'me'
        //   });

        //   request.execute(function(resp) {
        //     getMessages(resp.messages);
        //   })
        // }

        function getMessages(msgs) {

            $scope.messages.length = 0;

            _.each(msgs.slice(0, 9), function (msg) {
                //count = count + 1

                gapi.client.gmail.users.messages.get({
                    'userId': 'me',
                    'id': msg.id
                }).then(function (resp) {
                    buildMsg(resp);
                })

            })
        }

        var extractField = function (resp_result, fieldName) {
            var field = _.find(resp_result.payload.headers, function (header) {
                return header.name.toLowerCase() === fieldName.toLowerCase();
            });
            return field.value
        };

        function buildMsg(resp) {
            var m = {};
            m.from = extractField(resp.result, 'FROM');
            m.subject = extractField(resp.result, 'SUBJECT');
            m.date = extractField(resp.result, 'DATE');
            m.id = resp.result.id;
            //m.text = getText(resp.result.payload)
            getAttachment(resp.result);

            $scope.messages.push(m);
            $scope.$apply();
        }

        function getAttachment(msg) {
            var parts = msg.payload.parts;

            _.each(parts, function (part) {

                if (part.filename && part.filename.length > 0) {
                    var attachId = part.body.attachmentId;
                    var request = gapi.client.gmail.users.messages.attachments.get({
                        'id': attachId,
                        'messageId': msg.id,
                        'userId': 'me'
                    });

                    request.then(function (resp) {
                        addAttachment(msg.id, part.filename);
                        console.log('attachement', resp)
                    })
                }

            })
        }

        function addAttachment(mid, filename) {
            _.each($scope.messages, function (m) {
                if (m.id == mid) {
                    m.attachmentName = filename;
                    $scope.$apply();
                }
            })
        }

        //function getText(payload) {
        //    console.log(payload);
        //    var part = payload.parts.filter(function (part) {
        //        return part.mimeType == 'text/html';
        //    });
        //    console.log('part', part);
        //    var html = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        //    console.log('msg html', html);
        //    return html
        //}

    });
