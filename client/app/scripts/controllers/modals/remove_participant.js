'use strict';

/**
 * @ngdoc function
 * @name hirepoolApp.controller:ModalsRemoveParticipantCtrl
 * @description
 * # ModalsRemoveInteractionCtrl
 * Controller of the hirepoolApp
 */
angular.module('hirepoolApp')
  .controller('ModalsRemoveParticipantCtrl', function ($scope, currentlySelectedEvent, $rootScope, $http, jQuery, $timeout, _, eventRecorder) {

    $scope.close = function () {
      $timeout(function() {
        jQuery('.modal .close-button').click();
      });
    };

    $scope.event = {};
    var eventCleanupFunc = $rootScope.$on('settingCurrentlySelectedEvent', function () {
      $scope.event = currentlySelectedEvent.get();
    });
    var interactionCleanupFunc = $rootScope.$on('settingCurrentlySelectedInteraction', function () {
      $scope.interaction = currentlySelectedEvent.getInteraction();
    });
    var participantCleanupFunc = $rootScope.$on('settingCurrentlySelectedParticipant', function () {
      $scope.participant = currentlySelectedEvent.getParticipant();
    });

    $scope.remove = function () {
      var interactionId = $scope.interaction.id;
      var participantId = $scope.participant.id;
      var participantRemoved;
      _.each($scope.event.interactions, function (interaction) {
        var index;
        if (interaction.id === interactionId) {
          _.each(interaction.participants, function (participant, pIndex) {
            if (participant.id === participantId) {
              index = pIndex;
            }
          });
          if (typeof index === 'number') {
            interaction.participants.splice(index, 1);
            participantRemoved = true;
          }
        }
      });
      if (participantRemoved) {

        var interactions = [];
        _.each($scope.event.interactions, function (interaction) {
          var participants = [];
          _.each(interaction.participants, function (participant) {
            participants.push({
              name: participant.name,
              email: participant.email,
              excited: participant.excited,
              relationship: participant.relationship
            });
          });
          interactions.push({
            id: interaction.id,
            style: interaction.style,
            culture_val: interaction.culture_val,
            one_word: interaction.one_word,
            interviewers: participants
          });
        });
        $http({
          method: 'PUT',
          url: '/api/events/' + $scope.event.id,
          data: {
            interview: {
              id: $scope.event.interview_id
            },
            event: {
              style: $scope.event.style,
              date: $scope.event.date,
              time_specified: false,
              interviewer_relationship: $scope.event.interviewer_relationship,
              interviewer: {
                name: $scope.event.interviewer.name,
                email: $scope.event.interviewer.email,
              },
              interactions: interactions
            }
          }
        }).then(function successCallback (response) {
          eventRecorder.trackEvent({
            action: 'deleted-participant',
            modal: 'remove-participant',
            interviews: [response.data.event.interview_id],
            event_id: response.data.event.id
          });
          $rootScope.$broadcast('cardUpdated', {id: response.data.event.interview_id});
          $rootScope.$broadcast('updated-existing-event', response.data.event, response.data.event.interview_id);
          $scope.close();
        }, function errorCallback (error) {
          console.log(error);
        });
      }
    };

    $scope.$on('$destroy', function() {
      eventCleanupFunc();
      interactionCleanupFunc();
      participantCleanupFunc();
    });

  });
