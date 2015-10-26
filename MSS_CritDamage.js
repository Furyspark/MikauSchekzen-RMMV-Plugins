var MikauSchekzen = MikauSchekzen || {};
MikauSchekzen.Critical = MikauSchekzen.Critical || {};

/*:
@plugindesc Changes the critical strike damage (and healing)
@author MikauSchekzen

@param Critical Multiplier
@desc The multiplier of criticals
Default 3
@default 3
*/

MikauSchekzen.Parameters = PluginManager.parameters('MSS_CritDamage');

MikauSchekzen.Critical._critMultiplier = Number(MikauSchekzen.Parameters['Critical Multiplier']);

Game_Action.prototype.applyCritical = function(damage) {
    return damage * MikauSchekzen.Critical._critMultiplier;
};