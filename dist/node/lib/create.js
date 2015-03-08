"use strict";

var _ = require("./utils/mindash");
var warnings = require("./warnings");
var constants = require("./constants");
var StateMixin = require("./stateMixin");
var STORE_CHANGED_EVENT = "store-changed";
var createStoreClass = require("./store/createStoreClass");
var createQueriesClass = require("./queries/createQueriesClass");
var createStateSourceClass = require("./stateSource/createStateSourceClass");
var createActionCreatorsClass = require("./actionCreators/createActionCreatorsClass");
var DEFAULT_CLASS_NAME = "Class";

module.exports = {
  register: register,
  createStore: createStore,
  createQueries: createQueries,
  createContext: createContext,
  createConstants: createConstants,
  createStateMixin: createStateMixin,
  createStateSource: createStateSource,
  createActionCreators: createActionCreators,
  addStoreChangeListener: addStoreChangeListener
};

function register(id, clazz) {
  if (!_.isString(id)) {
    clazz = id;
    id = null;
  }

  var className = getClassName(clazz);

  if (!clazz.id) {
    clazz.id = id || className;
  }

  if (!clazz.displayName) {
    clazz.displayName = clazz.id;
  }

  var defaultInstance = this.container.register(clazz);

  // TODO: Find a nicer way of listening to objects being registered
  if (defaultInstance.constructor.type === "Store") {
    warnings.without("callingResolverOnServer", function () {
      defaultInstance.addChangeListener(_.bind(onStoreChanged, this));
    }, this);
  }

  return defaultInstance;
}

function addStoreChangeListener(callback, context) {
  var events = this.__events;

  if (context) {
    callback = _.bind(callback, context);
  }

  events.on(STORE_CHANGED_EVENT, callback);

  return {
    dispose: _.bind(function () {
      events.removeListener(STORE_CHANGED_EVENT, callback);
    }, this)
  };
}

function createContext(req) {
  return this.container.createContext(req);
}

function createStore(properties) {
  var StoreClass = createStoreClass(properties);
  var defaultInstance = this.register(StoreClass);

  return defaultInstance;
}

function getClassName(clazz) {
  var funcNameRegex = /function (.{1,})\(/;
  var results = funcNameRegex.exec(clazz.toString());
  var className = results && results.length > 1 ? results[1] : "";

  return className === DEFAULT_CLASS_NAME ? null : className;
}

function onStoreChanged() {
  var events = this.__events;
  var args = _.toArray(arguments);

  args.unshift(STORE_CHANGED_EVENT);
  events.emit.apply(events, args);
}

function createConstants(obj) {
  return constants(obj);
}

function createStateMixin(options) {
  return new StateMixin(options);
}

function createActionCreators(properties) {
  var ActionCreatorsClass = createActionCreatorsClass(properties);
  var defaultInstance = this.register(ActionCreatorsClass);

  return defaultInstance;
}

function createQueries(properties) {
  var QueriesClass = createQueriesClass(properties);
  var defaultInstance = this.register(QueriesClass);

  return defaultInstance;
}

function createStateSource(properties) {
  var StateSourceClass = createStateSourceClass(properties);
  var defaultInstance = this.register(StateSourceClass);

  return defaultInstance;
}