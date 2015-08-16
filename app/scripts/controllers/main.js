'use strict';

/**
 * @ngdoc function
 * @name gmailAppApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the gmailAppApp
 */
angular.module('gmailAppApp')
  .controller('MainCtrl', function ($scope, $q) {
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

    $scope.authorize = function() {
    	gapi.auth.authorize(
        {client_id: CLIENT_ID, scope: SCOPES, immediate: false},
        handleAuthResult);
      return false;
    }

    checkAuth();

    /**
       * Handle response from authorization server.
       *
       * @param {Object} authResult Authorization result.
       */
    function handleAuthResult(authResult) {
      if (authResult && !authResult.error) {
      	console.log('already authorized')
      	$scope.isAuthorized = true;
        loadGmailApi();
      } else {
        console.log('not authorized')
        $scope.isAuthorized = false
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
    	console.log('loading data')
    	listLabels();
    	//listMessages();
    }

    function listLabels() {
      var request = gapi.client.gmail.users.labels.list({
        'userId': 'me'
      });
      request.execute(function(resp) {
      	$scope.labels = resp.labels;
      	$scope.$apply()
      })
    }

    $scope.getMsgsForLabel = function(labelId) {
    	var request = gapi.client.gmail.users.messages.list({
        'userId': 'me',
        'labelIds': labelId
      });

      request.execute(function(resp) {
      	$scope.msgCount = resp.resultSizeEstimate;
      	getMessages(resp.messages)
      })
    }

    // function listMessages() {
    //   var request = gapi.client.gmail.users.messages.list({
    //     'userId': 'me'
    //   });

    //   request.execute(function(resp) {
    //     getMessages(resp.messages);
    //   })
    // }

    function getMessages(msgs) {
    	var count = 0;
    	var maxCount = msgs.length;
    	console.log('max count', maxCount)

    	$scope.messages.length = 0;

    	_.each(msgs, function(msg) {
    		count = count + 1

    		gapi.client.gmail.users.messages.get({
			    'userId': 'me',
			    'id': msg.id
			  }).then(function(resp) {
			  	$scope.messages.push(resp);

			  	if (count === maxCount) {
			  		console.log('got msgs')
			  		$scope.$apply()
			  	};
			  })

    	})
    }



   //  function getMsgBody(msg) {
	  //   var part = msg.parts.filter(function(part) {
			//   return part.mimeType == 'text/html';
			// });
			// //var html = urlSafeBase64Decode(part.body.data);
			
			// console.log('part', part)
			// console.log(part.body)
			// var html = atob(part.body.data);

			// console.log('html', html)
			// //return html;
   //  }

  });
