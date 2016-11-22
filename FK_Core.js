var Imported = Imported || {};
Imported.FK_Core = true;

var FK = FK || {};
FK.Core = {};

/*:
 * @plugindesc v1.0 Core functionality for Fenrirknight's plugins.
 * @author Fenrirknight
 */

//------------------------------------------------------------------------------
// Game_Actor
//

Game_Actor.prototype.battleSprite = function() {
  var spriteset = SceneManager._scene._spriteset;
  if (spriteset && spriteset._actorSprites) {
    var sprites = spriteset._actorSprites || [];
    return sprites.filter(function(sprite) {
      return sprite && sprite._actor === this;
    }, this)[0];
  } else {
    return null;
  }
}

Game_Actor.prototype.mapSprite = function() {
  var spriteset = SceneManager._scene._spriteset;
  if(spriteset && spriteset._characterSprites) {
    var sprites = spriteset._characterSprites;
    return sprites.filter(function(sprite) {
      if(sprite) {
        if(sprite._character instanceof Game_Player) {
          return $gameParty.leader() === this;
        }
        else if(sprite._character instanceof Game_Follower) {
          return sprite._character.actor() === this;
        }
      }
    }, this)[0];
  }
  return null;
}


//------------------------------------------------------------------------------
// Game_Enemy
//

Game_Enemy.prototype.battleSprite = function() {
  var spriteset = SceneManager._scene._spriteset;
  if (spriteset && spriteset._enemySprites) {
    var sprites = spriteset._enemySprites || [];
    return sprites.filter(function(sprite) {
      return sprite && sprite._enemy === this;
    }, this)[0];
  } else {
    return null;
  }
}


//------------------------------------------------------------------------------
// DataManager
//

FK.DataManager = FK.DataManager || {};
FK.DataManager._parseNotes = [];
FK.DataManager._gameObjects = [];
FK.DataManager._databaseFiles = [];

DataManager.FK_ParseNotes = function(group, callback) {
  FK.DataManager._parseNotes.push({
    group: group,
    callback: callback
  });
}

FK.Core.DataManager_loadDatabase = DataManager.loadDatabase;
DataManager.loadDatabase = function() {
  FK.Core.DataManager_loadDatabase.call(this);
  var group = FK.DataManager._databaseFiles;
  for(var a = 0;a < group.length;a++) {
    var file = group[a];
    var name = file.name;
    var src = file.src;
    this.loadDataFile(name, src);
  }
}

FK.Core.DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
DataManager.isDatabaseLoaded = function() {
  if(!FK.Core.DataManager_isDatabaseLoaded.call(this)) return false;

  for(var a = 0;a < FK.DataManager._parseNotes.length;a++) {
    var obj = FK.DataManager._parseNotes[a];
    obj.callback.call(this, eval(obj.group));
  }
  FK.DataManager._parseNotes = [];

  return true;
}

DataManager.FK_AddDatabaseFile = function(name, src) {
  FK.DataManager._databaseFiles.push({
    name: "$data" + name, src: src
  });
}

DataManager.FK_AddGameObject = function(name, cls) {
  FK.DataManager._gameObjects.push({
    name: name,
    cls: cls
  });
}

FK.Core.DataManager_createGameObjects = DataManager.createGameObjects;
DataManager.createGameObjects = function() {
  FK.Core.DataManager_createGameObjects.call(this);
  for(var a = 0;a < FK.DataManager._gameObjects.length;a++) {

    var obj = FK.DataManager._gameObjects[a];
    if(obj.cls) {
      var cls = obj.cls;
      window["$game" + obj.name] = new cls();
    }

  }
}

FK.Core.DataManager_extractSaveContents = DataManager.extractSaveContents;
DataManager.extractSaveContents = function(contents) {
  FK.Core.DataManager_extractSaveContents.call(this, contents);
  for(var a = 0;a < FK.DataManager._gameObjects.length;a++) {

    var obj = FK.DataManager._gameObjects[a];
    if(obj.cls) {
      window["$game" + obj.name] = contents["FK_" + obj.name];
    }

  }
}

FK.Core.DataManager_makeSaveContents = DataManager.makeSaveContents;
DataManager.makeSaveContents = function() {
  var contents = FK.Core.DataManager_makeSaveContents.call(this);
  for(var a = 0;a < FK.DataManager._gameObjects.length;a++) {

    var obj = FK.DataManager._gameObjects[a];
    if(obj.cls) {
      contents["FK_" + obj.name] = window["$game" + obj.name];
    }

  }
  return contents;
}

DataManager.isActor = function(obj) {
  return obj && $dataActors.contains(obj);
}

DataManager.isEnemy = function(obj) {
  return obj && $dataEnemies.contains(obj);
}


//------------------------------------------------------------------------------
// Math
//

Math.distanceTo = function(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

Math.rotationTo = function(x1, y1, x2, y2) {
  var delta = new Point(x2 - x1, y2 - y1);
  var radians = Math.atan2(delta.y, delta.x);
  return radians;
}

Math.lengthDir = function(x, y, length, angle) {
  return new Point(
    x + length * Math.cos(angle),
    y + length * Math.sin(angle)
  );
}

Math.radians = function(degrees) {
  return degrees * Math.PI / 180;
}

Math.degrees = function(radians) {
  return radians * 180 / Math.PI;
}


//------------------------------------------------------------------------------
// Game_Event
//

FK.Core.Game_Event_initialize = Game_Event.prototype.initialize;
Game_Event.prototype.initialize = function(mapId, eventId) {
  FK.Core.Game_Event_initialize.call(this, mapId, eventId);
  var comments = this.getEligibleComments();
  for(var a = 0;a < comments.length;a++) {
    var comment = comments[a];
    this.setupFromComment(comment);
  }
}

Game_Event.prototype.getEligibleComments = function() {
  var result = [];
  if(this.page()) {
    var list = this.list();
    list = list.filter(function(obj) {
      if(obj.code === 0 || obj.code === 108 || obj.code === 111 || obj.code === 411 || obj.code === 412) return true;
      return false;
    });
    var interpreter = new Game_Interpreter();
    interpreter.setup(list, this.eventId());
    interpreter.command108 = function() {
      result.push(this.currentCommand().parameters[0]);
      return true;
    };
    interpreter.update();
  }
  return result;
}

Game_Event.prototype.mapSprite = function() {
  var spriteset = SceneManager._scene._spriteset;
  if(spriteset) {
    var sprites = spriteset._characterSprites;
    for(var a = 0;a < sprites.length;a++) {
      var spr = sprites[a];
      if(spr._character === this) return spr;
    }
  }
  return null;
}

Game_Event.prototype.setupFromComment = function(comment) {}
