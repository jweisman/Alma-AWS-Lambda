Array.prototype.groupBy = function(hash){
  var _hash = hash ? hash : function(o){return o;};

  var _map = {};
  var put = function(map, key, value){
    if (!map[_hash(key)]) {
        map[_hash(key)] = {};
        map[_hash(key)].group = [];
        map[_hash(key)].key = key;

    }
    map[_hash(key)].group.push(value); 
  }

  this.map(function(obj){
    put(_map, obj, obj);
  });

  return Object.keys(_map).map(function(key){
    return {key: _map[key].key, group: _map[key].group};
  });
}