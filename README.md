# Intermediary.js
[![Build Status](https://travis-ci.org/tbusser/Intermediary.js.svg?branch=master)](https://travis-ci.org/tbusser/Intermediary.js)

Intermediary is a singleton class which can be used for communication between modules without them having to know about each other. It is written in plain JavaScript and doesn't have any dependencies.

## Based on Mediator.js
This module is heavily inspired by [Mediator.js](https://github.com/ajacksified/Mediator.js). The modules are for almost all intents and purposes the same. The biggest difference is that this is a singleton and it exposes less methods and classes. All credits must go to [@ajacksified](https://twitter.com/ajacksified).

## Project set-up
The project comes setup with two Grunt tasks. To use these you will first have to install the needed modules using the `npm install` command from within the project root folder.

### Distribution task
To create a minified version of the library you can use `grunt dist` to run the Uglify task. It will take the file in the `lib` folder and generate a minified version in the `dist` folder.

### Test & coverage task
There is a unit test for the Intermediary module. It is located in the `test\spec` folder and can be run using `grunt testcover`. This will run the unit test and also provides code coverage. Code coverage is generate by [Istanbul](http://gotwarlost.github.io/istanbul/). The code coverage report will be generated after succesfuly running the unit tests and can be found in `test\reports\html\index.html`

### Test task
For Travis CI there is a separate task which will run the tests without the code coverage. This task can be started by running `grunt test:travis` or `npm test`

## Usage
Intermediary can be used as-is without any other libraries. It can also be loaded with an AMD loader like Require.js and it is compatible with CommonJS. Once the module is loaded it can be accessed as Intermediary

### Used as an AMD module
```javascript
define(['Intermediary'], function(Intermediary) {
	...

	function subscribe() {
		Intermediary.subscribe(..., ..., ...);
	}

	...
});
```

### Used as a global object
```javascript
Intermediary.subscribe(..., ..., ...);
```

## Namespaces
A lot of the methods on `Intermediary` take a namespace as a parameter. The namespace is used to give channel a hierarchy. An example of a namespace would be `my:awesome:name`. This namespace consists of three channels: `my`, `awesome`, and `name`. Each channel in the namespace needs to be separated by a `:`.

Any message posted to a channel will also be posted to all the ancestors of that channel. Using the namespace above, any message published to `name` will also get published on the channels `awesome` and `my` (in that particular order). A message posted to `awesome` will only get republished on the channel `my` as the channel `name` is no ancestor of `awesome`.


##API

### `getSubscriber(namespace, id)`
This returns the subscriber for the namespace and id. Do not use this to change the priority of the subscriber as it will have no effect. To change the
priority for the subscriber use [`setSubscriberPriority`](#-setsubscriberpriority-namespace-id-priority-).

#### Parameter: `namespace` (string)
The namespace of the channel to which the subscriber is subscribed.

#### Parameter: `id` (string)
The ID of the subscriber to get

#### Returns: (`null` or Object)
The result is `null` if the namespace could not be resolved to an existing channel or of the channel doesn't have a subscriber with the supplied ID. Otherwise it returns the instance of Subscriber matching the ID.


### `once(namespace, callback, [context = {}], [options = {}])`
This is a convenience method for calling `subscribe` for a subscriber which should only be called once. See the description for [`subscribe`](#-subscribe-namespace-callback-context-options-) for further information.


### `publish(namespace, args)`
Publishes a message to the channel at the given namespace. When the namespace is resolved it will attempt to resolve it to the most specific channel. Example: when there is a subscriber to the channel `root:sub1` and the supplied namespace is `root:sub1:sub2`, the message will be published to `root:sub1` as this is the most specific channel the namespace could be resolved to.

#### Parameter: `namespace` (string)
The namespace for the channel to publish the message to. The message will be published to all the subscribers in the namespace hierarchy.

#### Parameter: `args`
Whatever parameters are used after the `namespace` parameter will be published as is to the subscribers of the channel and its ancestors. When the callback method of the subscribers is called there will be one additional parameter added to the method call. The last parameter the callback will receive is the namespace the message was originally posted to. When you have a subscriber to `my:awesome` and the message is posted to `my:awesome:name` this will allow you to tell the message originated from `my:awesome:name`.

#### Returns: (`null` or true)
The method returns `null` when the namespace could not be resolved to an existing channel in the namespace. This in turn means the message did not get posted. If the namespace was resolved to a channel the method will return `true`. This is no guarantee any subscriber was notified, it could be the only subscriber has a predicate which prevented the subscriber from getting notified of the message.


### `reset()`
Removes all subscribers from all channels and removes the channels from the Intermediary.


### `setSubscriberPriority(namespace, id, priority)`
Updates the priority of the subscriber. The higher the number, the higher the priority of the subscriber. Higher priority subscribers will be called before lower priority subscribers.

#### Parameter: `namespace` (string)
The namespace of the channel to which the subscriber is subscribed.

#### Parameter: `id` (string)
The ID of the subscriber whose priority should be updated.

#### Parameter: `priority` (number)
The new priority for the subscriber.

#### Returns: (Object or boolean)
The result is `null` when the namespace could not be resolved to an actual channel. The method will return `false` if the channel has no subscriber with the supplied ID. The result will be `true` when the priority of the subscriber has been updated.


### `subscribe(namespace, callback, [context = {}], [options = {}])`
This adds a subscriber to the channel at the specified namespace. Subscribe will create any channels in the namespace that do not yet exist.

#### Parameter: `namespace` (string)
An example of a namespace would be `my:awesome:name`. This namespace consists of three channels: `my`, `awesome`, and `name`. Each channel in the namespace needs to be separated by a `:`. Any message posted to a channel will also be posted to all the ancestors of that channel. Using the namespace above, any message published to `name` will also get published on the channels `awesome` and `my`. A message posted to `awesome` will only get republished on the channel `my` as the channel `name` is no ancestor of `awesome`.

#### Parameter: `callback` (function)
This is the method which will be called when the channel determines the subscriber should be notified. The callback method will receive the following two parameters:
1. Data: this is the data as it was published to the channel.
2. Namespace: this is the original namespace which was used to publish the data to.

#### Parameter: `context` (Object)
This is the context to be used when the callback method is invoked. This parameter is optional and defaults to `{}`.

#### Parameter: `options` (Object)
The last parameter can be used to set some options for the subscriber. This too is an optional parameter and will default to `{}`.

property | default value | description
-------- | - | -----------
calls | infinite | The maximum number of times the subscriber should be called before it is automatically removed from the channel. When nothing is specified the subscriber will stay until it is manually removed
priority | 0 | The subscriber's priority. The higher the number, the higher the priority. When nothing is specified the priority is 0
predicate | null | If specified it should be a function which returns either true or false and it should take a single parameter which is the data posted to the channel. When the method returns true the subscriber will be called; when the method returns false the subscriber won't be called. When the predicate returns false and the subscriber has a max number of calls set the number of calls will not get decreased

#### Returns: (string)
The method returns a string which is the unique identifier for the subscriber. This can be used to retrieve the subscriber at a later point or to manually remove the subscriber from the channel.

### `unsubscribe(namespace, id)`
Removes the subscriber with the specified ID from the namespace. Removing a subscriber from the channel will trigger an auto clean up action. The channel will check if it no longer has subscribers and if it isn't a parent to other channels. If there are no more subscriber and no sub-channels the channel will remove itself. This in turn will cause its parent channel to check if it should still exist all the way up to the root channel.

#### Parameter: `namespace` (string)
The namespace of the channel from which the subscriber should be removed.

#### Parameter: `id` (string)
The ID of the subscriber which should be removed from the channel.

#### Returns: (`null` or boolean)
The method returns `null` when the provided namespace could not be resolved to an existing channel. It will return `false` when the namespace was resolved to a channel but the channel as no subscriber with the provided ID. The result is `true` when the subscriber was removed from the channel.
