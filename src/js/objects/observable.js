/**
 * <p>
 *  Constructs a ProAct.Observable. It can be used both as observer and observable.
 * </p>
 * <p>
 *  The observables in ProAct.js form the dependency graph.
 *  If some observable listens to changes from another - it depends on it.
 * </p>
 * <p>
 *  The observables can transform the values or events incoming to them.
 * </p>
 * <p>
 *  Every observable can have a parent observable, that will be notified for all the changes
 *  on the child-observable, it is something as special observer.
 * </p>
 * <p>
 *  ProAct.Observable is part of the core module of ProAct.js.
 * </p>
 *
 * TODO listeners must be divided to types in one hash map.
 *
 * @class ProAct.Observable
 * @param {Array} transforms
 *      A list of transformation to be used on all incoming chages.
 */
ProAct.Observable = function (transforms) {
  this.listeners = [];
  this.errListeners = [];
  this.sources = [];

  this.listener = null;
  this.errListener = null;

  this.transforms = transforms ? transforms : [];

  this.parent = null;
};

P.U.ex(P.Observable, {

  /**
   * A constant defining bad values or bad events.
   *
   * @type Object
   * @static
   * @constant
   */
  BadValue: {},

  /**
   * Transforms the passed <i>val</i> using the ProAct.Observable#transforms of the passed <i>observable</i>.
   *
   * @function transforms
   * @memberof ProAct.Observable
   * @static
   * @param {ProAct.Observable} observable
   *      The ProAct.Observable which transformations should be used.
   * @param {Object} val
   *      The value to transform.
   * @return {Object}
   *      The transformed value.
   */
  transform: function (observable, val) {
    var i, t = observable.transforms, ln = t.length;
    for (i = 0; i < ln; i++) {
      val = t[i].call(observable, val);
      if (val === P.Observable.BadValue) {
        break;
      }
    }

    return val;
  }
});

P.Observable.prototype = {

  /**
   * Reference to the constructor of this object.
   *
   * @memberof ProAct.Observable
   * @instance
   * @constant
   * @type {Object}
   * @default ProAct.Observable
   */
  constructor: ProAct.Observable,

  /**
   * Creates the <i>listener</i> of this observable.
   * Every observable should have one listener that should pass to other observables.
   * <p>
   *  This listener turns the observable in a observer.
   * </p>
   * <p>
   *  Should be overriden with specific listener, by default it returns null.
   * </p>
   *
   * @memberof ProAct.Observable
   * @instance
   * @method makeListener
   * @default null
   * @return {Object}
   *      The <i>listener of this observer</i>.
   */
  makeListener: function () {
    return null;
  },

  /**
   * Creates the <i>error listener</i> of this observable.
   * Every observable should have one error listener that should pass to other observables.
   * <p>
   *  This listener turns the observable in a observer for errors.
   * </p>
   * <p>
   *  Should be overriden with specific listener, by default it returns null.
   * </p>
   *
   * @memberof ProAct.Observable
   * @instance
   * @method makeErrListener
   * @default null
   * @return {Object}
   *      The <i>error listener of this observer</i>.
   */
  makeErrListener: function () {
    return null;
  },

  /**
   * Creates the <i>event</i> to be send to the listeners on update.
   * <p>
   *  The <i>event</i> should be an instance of {@link ProAct.Event}.
   * </p>
   * <p>
   *  By default this method returns {@link ProAct.Event.Types.value} event.
   * </p>
   *
   * @memberof ProAct.Observable
   * @instance
   * @method makeEvent
   * @default {ProAct.Event} with type {@link ProAct.Event.Types.value}
   * @param {ProAct.Event} source
   *      The source event of the event. It can be null
   * @return {ProAct.Event}
   *      The event.
   */
  makeEvent: function (source) {
    return new P.Event(source, this, P.Event.Types.value);
  },

  /**
   * Attaches a new listener to this ProAct.Observable.
   * The listener may be function or object that defines a <i>call</i> method.
   *
   * TODO The action is not used here, ProAct.Observable#listeners should be a set of collections. ~meddle@2014-07-12
   *
   * @memberof ProAct.Observable
   * @instance
   * @method on
   * @param {String} action
   *      The action to listen for. It is the default action if it is empty or skipped.
   *      <p>
   *        The action can be skipped and on its place as first parameter to be passed the <i>listener</i>.
   *      </p>
   * @param {Object} listener
   *      The listener to attach. It must be instance of Function or object with a <i>call</i> method.
   * @param {Array} listeners
   *      By default the listener is attached to the ProAct.Observable#listeners collection.
   *      This behavior can be changed by passing another collection here.
   * @return {ProAct.Observable}
   *      <b>this</b>
   */
  on: function (action, listener, listeners) {
    if (!P.U.isString(action)) {
      listener = action;
    }

    if (P.U.isArray(listeners)) {
      listeners.push(listener);
    } else {
      this.listeners.push(listener);
    }

    return this;
  },

  /**
   * Removes a <i>listener</i> from the passed <i>action</i>.
   *
   * @memberof ProAct.Observable
   * @instance
   * @method off
   * @param {String} action
   *      The action to stop listening for. It is the default action if it is empty or skipped.
   *      <p>
   *        The action can be skipped and on its place as first parameter to be passed the <i>listener</i>.
   *      </p>
   * @param {Object} listener
   *      The listener to detach. If it is skipped, null or undefined all the listeners are removed from this observable.
   * @param {Array} listeners
   *      By default the listener is detached from the ProAct.Observable#listeners collection.
   *      This behavior can be changed by passing another collection here.
   * @return {ProAct.Observable}
   *      <b>this</b>
   * @see {@link ProAct.Observable#on}
   */
  off: function (action, listener, listeners) {
    if (!action && !listener) {
      if (P.U.isArray(listeners)) {
        listeners.length = 0;
      } else {
        this.listeners = [];
      }
      return;
    }
    if (!P.U.isString(action)) {
      listener = action;
    }

    if (P.U.isArray(listeners)) {
      P.U.remove(listeners, listener);
    } else {
      P.U.remove(this.listeners, listener);
    }

    return this;
  },

  /**
   * Attaches a new error listener to this ProAct.Observable.
   * The listener may be function or object that defines a <i>call</i> method.
   *
   * @memberof ProAct.Observable
   * @instance
   * @method onErr
   * @param {String} action
   *      The action to listen for errors. It is the default action if it is empty or skipped.
   *      <p>
   *        The action can be skipped and on its place as first parameter to be passed the <i>listener</i>.
   *      </p>
   * @param {Object} listener
   *      The listener to attach. It must be instance of Function or object with a <i>call</i> method.
   * @return {ProAct.Observable}
   *      <b>this</b>
   * @see {@link ProAct.Observable#on}
   */
  onErr: function (action, listener) {
    return this.on(action, listener, this.errListeners);
  },

  /**
   * Removes an error <i>listener</i> from the passed <i>action</i>.
   *
   * @memberof ProAct.Observable
   * @instance
   * @method offErr
   * @param {String} action
   *      The action to stop listening for errors. It is the default action if it is empty or skipped.
   *      <p>
   *        The action can be skipped and on its place as first parameter to be passed the <i>listener</i>.
   *      </p>
   * @param {Object} listener
   *      The listener to detach. If it is skipped, null or undefined all the listeners are removed from this observable.
   * @return {ProAct.Observable}
   *      <b>this</b>
   * @see {@link ProAct.Observable#onErr}
   */
  offErr: function (action, listener) {
    return this.off(action, listener, this.errListeners);
  },

  into: function () {
    var args = slice.call(arguments),
        ln = args.length, i, source;
    for (i = 0; i < ln; i++) {
      source = args[i];
      this.sources.push(source);
      source.on(this.makeListener());
      source.onErr(this.makeErrListener());
    }

    return this;
  },

  out: function (destination) {
    destination.into(this);

    return this;
  },

  offSource: function (source) {
    Pro.U.remove(this.sources, source);
    source.off(this.listener);
    source.offErr(this.errListener);

    return this;
  },

  transform: function (transformation) {
    this.transforms.push(transformation);
    return this;
  },

  mapping: function (f) {
    return this.transform(f)
  },

  filtering: function(f) {
    var _this = this;
    return this.transform(function (val) {
      if (f.call(_this, val)) {
        return val;
      }
      return Pro.Observable.BadValue;
    });
  },

  accumulation: function (initVal, f) {
    var _this = this, val = initVal;
    return this.transform(function (newVal) {
      val = f.call(_this, val, newVal)
      return val;
    });
  },

  map: Pro.N,
  filter: Pro.N,
  accumulate: Pro.N,

  reduce: function (initVal, f) {
    return new Pro.Val(initVal).into(this.accumulate(initVal, f));
  },

  update: function (source, callbacks) {
    if (this.listeners.length === 0 && this.errListeners.length === 0 && this.parent === null) {
      return this;
    }

    var observable = this;
    if (!Pro.flow.isRunning()) {
      Pro.flow.run(function () {
        observable.willUpdate(source, callbacks);
      });
    } else {
      observable.willUpdate(source, callbacks);
    }
    return this;
  },

  willUpdate: function (source, callbacks) {
    var i, listener,
        listeners = Pro.U.isArray(callbacks) ? callbacks : this.listeners,
        length = listeners.length,
        event = this.makeEvent(source);

    for (i = 0; i < length; i++) {
      listener = listeners[i];

      this.defer(event, listener);

      if (listener.property) {
        listener.property.willUpdate(event);
      }
    }

    if (this.parent && this.parent.call) {
      this.defer(event, this.parent);
    }

    return this;
  },

  defer: function (event, callback) {
    if (Pro.U.isFunction(callback)) {
      Pro.flow.pushOnce(callback, [event]);
    } else {
      Pro.flow.pushOnce(callback, callback.call, [event]);
    }
    return this;
  }
};
