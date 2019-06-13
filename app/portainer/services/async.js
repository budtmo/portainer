const $async = ['$q', ($q) => {
  return (asyncFunc) => {
    const wrapper = () => {
      const deferred = $q.defer();
      asyncFunc()
        .then(deferred.resolve)
        .catch(deferred.reject);
      return deferred.promise;
    };
    wrapper().then(() => {/*no op*/});
  };
}];

export default angular.module('portainer')
  .factory('$async', $async)