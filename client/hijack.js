var ConnectionProto = getConnectionProto();

/*
 * Hijack method calls
 */
var original_Connection_apply = ConnectionProto.apply;
ConnectionProto.apply = hijackConnection(original_Connection_apply, 'Connection.apply');

// for better stackTraces
var originalMeteorCall = Meteor.call;
Meteor.call = hijackConnection(originalMeteorCall, 'Meteor.call');

/*
 * Hijack DDP subscribe method
 * Used when connecting to external DDP servers
 */
var original_Connection_subscribe = ConnectionProto.subscribe;
ConnectionProto.subscribe = hijackSubscribe(original_Connection_subscribe, 'Connection.subscribe');

/**
 * Hijack Meteor.subscribe because Meteor.subscribe binds to
 * Connection.subscribe before the hijack
 */
var original_Meteor_subscribe = Meteor.subscribe;
Meteor.subscribe = hijackSubscribe(original_Meteor_subscribe, 'Meteor.subscribe');

hijackCursor(LocalCollection.Cursor.prototype);

/**
 * Hijack DomRange.prototype.on to add useful owner info to zone object
 * e.g. {type: 'domEvent', events: 'click', selector: '.some-selector'}
 */
var original_DomRange_on = UI.DomRange.prototype.on;
UI.DomRange.prototype.on = hijackDomRangeOn(original_DomRange_on);

/**
 * Hijack each templates rendered handler to add template name to owner info
 */
Meteor.startup(function () {
  _(Template).each(function (template, name) {
    if(typeof template === 'object' && typeof template.rendered == 'function') {
      var original = template.rendered;
      template.rendered = hijackTemplateRendered(original, name);
    }
  });
});

function getConnectionProto() {
  var con = DDP.connect(window.location.origin);
  con.disconnect();
  var proto = con.constructor.prototype;
  return proto;
}

// we've a better error handling support with zones
// Meteor._debug will prevent it (specially inside deps)
// So we are killing Meteor._debug
Meteor._debug = function(message, stack) {
  var err = new Error(message);
  err.stack = stack;
  throw err;
};
