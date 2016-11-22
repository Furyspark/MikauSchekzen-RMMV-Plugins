var Imported = Imported || {};
Imported.FK_Beams = true;

/*:
 * @author Fenrirknight
 * @plugindesc v1.0 Adds beams (like chain lightning effects) to RMMV.
 *
 * @param --- Image ---
 *
 * @param Beam Filename
 * @desc Filename of the file containing the beams (as located in img/system/) (without .png)
 * @default Beams
 *
 * @param Number of Beams
 * @desc Number of beams in this image (1 per column)
 * @default 2
*/

var FK = FK || {};
FK.Beams = {};

FK.Beams.Config = {};
(function($) {
  var params = PluginManager.parameters("FK_Beams");

  $.image = {};
  $.image.filename = params["Beam Filename"];
  $.image.beamCount = parseInt(params["Number of Beams"]);
})(FK.Beams.Config);

FK.Beams.pool = {};
FK.Beams.createBeam = function(key, beamType, xFrom, yFrom, xTo, yTo) {
  var beam = new Sprite_Beam(key, beamType, xFrom, yFrom, xTo, yTo);
  var spriteset = SceneManager._scene._spriteset;
  if(spriteset && spriteset._baseSprite) {
    spriteset._baseSprite.addChild(beam);
  } else {
    console.log("Invalid scene to use beams in");
  }
  if(key) {
    var oldBeam = this.pool[key];
    if(oldBeam) oldBeam.remove();
    this.pool[key] = beam;
  }
  return beam;
}

FK.Beams.getBeam = function(key) {
  return this.pool[key];
}


DataManager.FK_AddDatabaseFile("Beams", "Beams.json");

// Preload image
ImageManager.loadSystem(FK.Beams.Config.image.filename);


//------------------------------------------------------------------------------
// Sprite_Beam
//

function Sprite_Beam() {
  this.initialize.apply(this, arguments);
}

Sprite_Beam.prototype = Object.create(Sprite_Base.prototype);
Sprite_Beam.prototype.constructor = Sprite_Beam;

Sprite_Beam.prototype.initialize = function(key, beamType, xFrom, yFrom, xTo, yTo) {
  Sprite_Base.prototype.initialize.call(this);
  this.key = null;
  if(key) this.key = key;
  this._beamOrigin = new Point(xFrom, yFrom);
  this._beamTarget = new Point(xTo, yTo);
  this._actions = [];
  this._activeTime = 0;
  this._segments = [];
  this.setBeamType(beamType);
}

Sprite_Beam.prototype.actions = function() {
  return this._actions;
}

Sprite_Beam.prototype.setBeamType = function(beamType) {
  this._type = beamType;
  if(!this.getBeamType()) {
    console.log("Invalid beam type");
    return false;
  }
  this._activeTime = 0;
  this.setSegments(1);
}

Sprite_Beam.prototype.getBeamType = function() {
  return $dataBeams[this._type];
}

Sprite_Beam.prototype.remove = function() {
  if(this.key && FK.Beams.getBeam(this.key)) delete FK.Beams.pool[this.key];
  this.parent.removeChild(this);
}

Sprite_Beam.prototype.update = function() {
  // Add new actions
  var list = this.getBeamType().timeline;
  for(var a = 0;a < list.length;a++) {
    var action = list[a];
    if(action.frame === this._activeTime) {
      this.addAction(new FK_Beam_Action(this, action));
    }
  }
  // Update actions
  this.actions().forEach(function(action) {
    action.update();
  });
  // Update self duration
  this._activeTime++;
}

Sprite_Beam.prototype.addAction = function(action) {
  this._actions.push(action);
}

Sprite_Beam.prototype.imageRow = function() {
  return this.getBeamType().imageRow;
}

Sprite_Beam.prototype.setSegments = function(amount) {
  this.removeSegments();
  var xFrom = this._beamOrigin.x;
  var yFrom = this._beamOrigin.y;
  var lengthPerSegment = Math.ceil(Math.distanceTo(xFrom, yFrom, this._beamTarget.x, this._beamTarget.y) / amount);
  var angle = Math.rotationTo(xFrom, yFrom, this._beamTarget.x, this._beamTarget.y);
  for(var a = 0;a < amount;a++) {
    var destination = Math.lengthDir(xFrom, yFrom, lengthPerSegment, angle);
    var segment = new Sprite_BeamSegment(this.imageRow(), xFrom, yFrom, destination.x, destination.y);
    this._segments.push(segment);
    this.addChild(segment);
    xFrom = destination.x;
    yFrom = destination.y;
  }
}

Sprite_Beam.prototype.removeSegments = function() {
  while(this._segments.length > 0) {
    var segment = this._segments.shift();
    segment.remove();
  }
}

/**
 * @function crackle
 * @param {number} segmentCount - Amount of segments for this beam
 * @param {number} minAngleDifference - Minimum difference in angle from the original (in degrees)
 * @param {number} maxAngleDifference - Maximum difference in angle from the original (in degrees)
 * @param {number} overlapPixels - Amount of pixels to overlap segment ends
*/
Sprite_Beam.prototype.crackle = function(segmentCount, minAngleDifference, maxAngleDifference, overlapPixels) {
  segmentCount = Math.max(2, segmentCount);
  if(!overlapPixels && overlapPixels !== 0) overlapPixels = 0;
  this.setSegments(segmentCount);
  var firstPoint = new Point(this._beamOrigin.x, this._beamOrigin.y);
  var lengthMultiplier = 1.2;
  var lengthPerSegment = Math.ceil(Math.distanceTo(this._beamOrigin.x, this._beamOrigin.y, this._beamTarget.x, this._beamTarget.y) / segmentCount) * lengthMultiplier;
  var originalAngle = Math.rotationTo(this._beamOrigin.x, this._beamOrigin.y, this._beamTarget.x, this._beamTarget.y);
  var secondPoint;
  for(var a = 0;a < this._segments.length;a++) {
    var segment = this._segments[a];
    if(overlapPixels > 0 && secondPoint) {
      var angle = Math.rotationTo(secondPoint.x, secondPoint.y, firstPoint.x, firstPoint.y);
      firstPoint = Math.lengthDir(firstPoint.x, firstPoint.y, angle, overlapPixels);
    }
    secondPoint = new Point(this._beamTarget.x, this._beamTarget.y);
    if(a < this._segments.length - 1) {
      var angle = Math.degrees(originalAngle);
      var angleDiff = minAngleDifference + (Math.random() * (maxAngleDifference - minAngleDifference));
      var mult = (Math.random() < 0.5) ? 1 : -1;
      angle = Math.radians(angle + (angleDiff * mult));
      secondPoint = Math.lengthDir(firstPoint.x, firstPoint.y, lengthPerSegment, angle);
    }
    segment._beamOrigin.x = firstPoint.x;
    segment._beamOrigin.y = firstPoint.y;
    segment._beamTarget.x = secondPoint.x;
    segment._beamTarget.y = secondPoint.y;
    segment.refresh();
    firstPoint.x = secondPoint.x;
    firstPoint.y = secondPoint.y;
  }
}


//------------------------------------------------------------------------------
// Sprite_BeamSegment
//

function Sprite_BeamSegment() {
  this.initialize.apply(this, arguments);
}

Sprite_BeamSegment.prototype = Object.create(TilingSprite.prototype);
Sprite_BeamSegment.prototype.constructor = Sprite_Beam;

Sprite_BeamSegment.prototype.initialize = function(imageRow, xFrom, yFrom, xTo, yTo) {
  TilingSprite.prototype.initialize.call(this);
  this.bitmap = ImageManager.loadSystem(FK.Beams.Config.image.filename);
  this._imageRow = imageRow;
  this._beamOrigin = new Point(xFrom, yFrom);
  this._beamTarget = new Point(xTo, yTo);
  this.refresh();
}

Sprite_BeamSegment.prototype.refresh = function() {
  if(!this.imageFileValid()) {
    console.log("Invalid beam image file");
    this.bitmap = null;
    return false;
  }
  var row = this.imageRow();
  var w = this.imageWidth();
  var h = this.imageHeight();
  this.setFrame(0, row * h, w, h);
  this.setLine(this._beamOrigin, this._beamTarget);
  // this.anchor.set(0, 0.5);
}

Sprite_BeamSegment.prototype.setLine = function(origin, target) {
  this.x = origin.x;
  this.y = origin.y;
  this._width = Math.distanceTo(origin.x, origin.y, target.x, target.y);
  this._height = this.imageHeight();
  this.rotation = Math.rotationTo(origin.x, origin.y, target.x, target.y);
  // Can't use anchors properly with RMMV 1.3.3, so change position instead
  var shift = Math.lengthDir(0, 0, this.imageHeight() * 0.5, this.rotation - (Math.PI * 0.5));
  this.x += shift.x;
  this.y += shift.y;
}

Sprite_BeamSegment.prototype.imageRow = function() {
  return this._imageRow;
}

Sprite_BeamSegment.prototype.imageWidth = function() {
  return this.bitmap.width;
}

Sprite_BeamSegment.prototype.imageHeight = function() {
  return this.bitmap.height / FK.Beams.Config.image.beamCount;
}

Sprite_BeamSegment.prototype.imageFileValid = function() {
  var h = this.imageHeight();
  if(h !== Math.floor(h)) return false;
  return true;
}

Sprite_BeamSegment.prototype.remove = function() {
  this.parent.removeChild(this);
}


//------------------------------------------------------------------------------
// FK_Beam_Action
//

function FK_Beam_Action() {
  this.initialize.apply(this, arguments);
}

FK_Beam_Action.prototype.initialize = function(beam, config) {
  this._beam = beam;
  this._action = config.action;
  this._duration = this.action().over || -1;
  this.setInitialActionData();
}

FK_Beam_Action.prototype.beam = function() {
  return this._beam;
}

FK_Beam_Action.prototype.action = function() {
  return this._action;
}

FK_Beam_Action.prototype.duration = function() {
  return this._duration;
}

FK_Beam_Action.prototype.type = function() {
  return this.action().type.toUpperCase();
}

FK_Beam_Action.prototype.update = function() {
  if(this._duration > 0) this._duration--;
  this.updateAction();
  if(this._duration <= 0) this.end();
}

FK_Beam_Action.prototype.end = function() {
  var beam = this.beam();
  var index = beam.actions().indexOf(this);
  beam.actions().splice(index, 1);
}

FK_Beam_Action.prototype.setInitialActionData = function() {
  if(this.type() === "TWEEN") {
    var varName = this.action().variable;
    this._initialValue = eval("this.beam()." + varName);
  }
}

FK_Beam_Action.prototype.updateAction = function() {
  // TWEEN
  if(this.type() === "TWEEN") {
    return this.updateActionTween();
  }
  // REMOVE
  if(this.type() === "REMOVE") {
    return this.updateActionRemove();
  }
  // FUNCTION
  if(this.type() === "FUNCTION") {
    return this.updateActionFunction();
  }
  // REWIND
  if(this.type() === "REWIND") {
    return this.updateActionRewind();
  }
  return false;
}

FK_Beam_Action.prototype.updateActionTween = function() {
  var varName = this.action().variable;
  var currentValue = eval("this.beam()." + varName);
  var newValue = currentValue + ((this.action().to - this._initialValue) / this.action().over);
  eval("this.beam()." + varName + " = " + newValue.toString() + ";");
}

FK_Beam_Action.prototype.updateActionRemove = function() {
  this.beam().remove();
  return true;
}

FK_Beam_Action.prototype.updateActionFunction = function() {
  var funcName = this.action().name;
  var args = this.action().args;
  var beam = this.beam();
  var context = this.action().context || beam;
  if(typeof context === "string") context = eval(context);
  if(beam && beam[funcName]) {
    beam[funcName].apply(context, args);
    return true;
  }
  return false;
}

FK_Beam_Action.prototype.updateActionRewind = function() {
  this.beam()._activeTime = -1;
  return true;
}


//------------------------------------------------------------------------------
// BattleManager
//

FK.Beams.BattleManager_processActionSequence = BattleManager.processActionSequence;
BattleManager.processActionSequence = function(actionName, actionArgs) {
  // BEAM
  if(actionName === "BEAM") {
    return this.actionBeam(actionArgs);
  }
  return FK.Beams.BattleManager_processActionSequence.call(this, actionName, actionArgs);
}

BattleManager.actionBeam = function(actionArgs) {
  var type = actionArgs[0];
  var origin = actionArgs[1].toUpperCase();
  var target = actionArgs[2].toUpperCase();
  var checks = [origin, target];
  var points = [[], []];
  for(var a = 0;a < 2;a++) {
    var check = checks[a];
    if(check.match(/(?:POINT|POSITION|COORDINATE[S]?)[ ](\d+)[ ](\d+)/i)) {
      var point = new Point(parseInt(RegExp.$1), parseInt(RegExp.$2));
      points[a].push(point);
    } else if(check.match(/(.*);[ ](.*)/i)) {
      var targets = this.makeActionTargets(RegExp.$1.toUpperCase());
      if(targets.length === 0) return false;
      var targetType = RegExp.$2.toUpperCase();
      for(var b = 0;b < targets.length;b++) {
        var tar = [targets[b]];
        var point = new Point(0, 0);
        points[a].push(point);
        if(["FRONT BASE", "FRONT"].contains(targetType)) {
          point.x = this.targetPosX(tar, "FRONT");
          point.y = this.targetPosY(tar, "BASE");
        } else if(["BASE"].contains(type)) {
          point.x = this.targetPosX(tar, "MIDDLE");
          point.y = this.targetPosY(tar, "BASE");
        } else if(["BACK BASE", "BACK"].contains(targetType)) {
          point.x = this.targetPosX(tar, "BACK");
          point.y = this.targetPosY(tar, "BASE");
        } else if(["FRONT CENTER", "FRONT MIDDLE"].contains(targetType)) {
          point.x = this.targetPosX(tar, "FRONT");
          point.y = this.targetPosY(tar, "MIDDLE");
        } else if(["CENTER", "MIDDLE"].contains(targetType)) {
          point.x = this.targetPosX(tar, "MIDDLE");
          point.y = this.targetPosY(tar, "MIDDLE");
        } else if(["BACK CENTER", "BACK MIDDLE"].contains(targetType)) {
          point.x = this.targetPosX(tar, "BACK");
          point.y = this.targetPosY(tar, "MIDDLE");
        } else if(["FRONT HEAD", "FRONT TOP"].contains(targetType)) {
          point.x = this.targetPosX(tar, "FRONT");
          point.y = this.targetPosY(tar, "TOP");
        } else if(["HEAD", "TOP"].contains(targetType)) {
          point.x = this.targetPosX(tar, "MIDDLE");
          point.y = this.targetPosY(tar, "TOP");
        } else if(["BACK HEAD", "BACK TOP"].contains(targetType)) {
          point.x = this.targetPosX(tar, "BACK");
          point.y = this.targetPosY(tar, "TOP");
        } else {
          return true;
        }
      }
    }
  }
  for(var a = 0;a < points[0].length;a++) {
    var from = points[0][a];
    for(var b = 0;b < points[1].length;b++) {
      var to = points[1][b];
      FK.Beams.createBeam(undefined, type, from.x, from.y, to.x, to.y);
    }
  }
  return true;
}
