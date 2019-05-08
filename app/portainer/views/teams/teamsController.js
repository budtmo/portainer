import _ from 'lodash-es';

angular.module('portainer.app')
.controller('TeamsController', ['$q', '$scope', '$state', 'TeamService', 'UserService', 'ModalService', 'Notifications', 'Authentication', 'ExtensionService', 'RoleService',
function ($q, $scope, $state, TeamService, UserService, ModalService, Notifications, Authentication, ExtensionService, RoleService) {
  $scope.state = {
    actionInProgress: false
  };

  $scope.formValues = {
    Name: '',
    Leaders: [],
    RoleId: 1
  };

  $scope.checkNameValidity = function(form) {
    var valid = true;
    for (var i = 0; i < $scope.teams.length; i++) {
      if ($scope.formValues.Name === $scope.teams[i].Name) {
        valid = false;
        break;
      }
    }
    form.team_name.$setValidity('validName', valid);
  };

  $scope.addTeam = function() {
    var teamName = $scope.formValues.Name;
    var leaderIds = [];
    angular.forEach($scope.formValues.Leaders, function(user) {
      leaderIds.push(user.Id);
    });
    var roleId = $scope.formValues.RoleId;

    $scope.state.actionInProgress = true;
    TeamService.createTeam(teamName, leaderIds, roleId)
    .then(function success() {
      Notifications.success('Team successfully created', teamName);
      $state.reload();
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to create team');
    })
    .finally(function final() {
      $scope.state.actionInProgress = false;
    });
  };

  $scope.removeAction = function (selectedItems) {
    ModalService.confirmDeletion(
      'Do you want to delete the selected team(s)? Users in the team(s) will not be deleted.',
      function onConfirm(confirmed) {
        if(!confirmed) { return; }
        deleteSelectedTeams(selectedItems);
      }
    );
  };

  function deleteSelectedTeams(selectedItems) {
    var actionCount = selectedItems.length;
    angular.forEach(selectedItems, function (team) {
      TeamService.deleteTeam(team.Id)
      .then(function success() {
        Notifications.success('Team successfully removed', team.Name);
        var index = $scope.teams.indexOf(team);
        $scope.teams.splice(index, 1);
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to remove team');
      })
      .finally(function final() {
        --actionCount;
        if (actionCount === 0) {
          $state.reload();
        }
      });
    });
  }

  function associateRoles(teams, roles) {
    for (var i = 0; i < teams.length; i++) {
      var team = teams[i];
      var role = _.find(roles, { Id: team.RoleId });
      if (role) {
        team.RoleName = role.Name;
      }
    }
  }

  function initView() {
    var userDetails = Authentication.getUserDetails();
    var isAdmin = Authentication.isAdmin();
    $scope.isAdmin = isAdmin;
    $q.all({
      users: UserService.users(false),
      teams: isAdmin ? TeamService.teams() : UserService.userLeadingTeams(userDetails.ID),
      rbac: ExtensionService.extensionEnabled(ExtensionService.EXTENSIONS.RBAC),
      roles: RoleService.roles()
    })
    .then(function success(data) {
      var teams = data.teams;
      associateRoles(teams, data.roles);
      $scope.teams = teams;
      $scope.users = data.users;
      $scope.rbacEnabled = data.rbac;
      $scope.roles = data.roles;
    })
    .catch(function error(err) {
      $scope.teams = [];
      $scope.users = [];
      Notifications.error('Failure', err, 'Unable to retrieve teams');
    });
  }

  initView();
}]);
