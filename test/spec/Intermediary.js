/* global afterEach, beforeEach, describe, expect, it, sinon */
define(['Intermediary'], function(Intermediary) {
	'use strict';

	var subscribers = [];

	function addSubscriber(channelName, callback, once) {
		var guid = null;
		if (once) {
			guid = Intermediary.once(channelName, callback);
		} else {
			guid = Intermediary.subscribe(channelName, callback);
		}
		subscribers.push({channel: channelName, id: guid});
		return guid;
	}

	function addSubscriberWithOptions(channelName, callback, options, once) {
		var guid = null;
		if (once) {
			guid = Intermediary.once(channelName, callback, {}, options);
		} else {
			guid = Intermediary.subscribe(channelName, callback, {}, options);
		}
		subscribers.push({channel: channelName, id: guid});
		return guid;
	}
	describe('Intermediary', function() {
		afterEach(function() {
			while(subscribers.length > 0) {
				var subscriber = subscribers.pop();
				Intermediary.unsubscribe(subscriber.channel, subscriber.id);
				subscriber = null;
			}
			Intermediary.reset();
		});

		it('should be an object', function() {
			expect(Intermediary).to.be.an('object');
		});
		it('should have a method named \'getSubscriber\'', function() {
			expect(Intermediary.getSubscriber).to.be.a('function');
		});
		it('should have a method named \'once\'', function() {
			expect(Intermediary.once).to.be.a('function');
		});
		it('should have a method named \'publish\'', function() {
			expect(Intermediary.publish).to.be.a('function');
		});
		it('should have a method named \'reset\'', function() {
			expect(Intermediary.publish).to.be.a('function');
		});
		it('should have a method named \'setSubcriberPriority\'', function() {
			expect(Intermediary.setSubscriberPriority).to.be.a('function');
		});
		it('should have a method named \'subscribe\'', function() {
			expect(Intermediary.subscribe).to.be.a('function');
		});
		it('should have a method named \'unsubscribe\'', function() {
			expect(Intermediary.unsubscribe).to.be.a('function');
		});

		describe('#subscribe()', function() {
			var callback = function() {},
			    spy = sinon.spy();

			beforeEach(function() {
				spy.reset();
			});

			it('should return a GUID', function() {
				var guid = addSubscriber('achievements:criteria:met', callback);
				expect(guid).to.match(/[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}/i);
			});
			it('should return null when subscribing to null', function() {
				expect(Intermediary.subscribe(null, callback)).to.be(null);
			});
			it('should return null when subscribing to undefined', function() {
				expect(Intermediary.subscribe(undefined, callback)).to.be(null);
			});
			it('should return null when subscribing to ""', function() {
				expect(Intermediary.subscribe('', callback)).to.be(null);
			});

			describe('options.call', function() {
				it('should remove the subscriber after the specified number of calls', function() {
					addSubscriberWithOptions('root', spy, {calls: 2});
					Intermediary.publish('root');
					Intermediary.publish('root');
					expect(Intermediary.publish('root')).to.be(null);
					expect(spy.callCount).to.be(2);
				});
				it('should remove the subscriber after the first call if option.calls is a negative number', function() {
					addSubscriberWithOptions('root', spy, {calls: -1});
					Intermediary.publish('root');
					expect(Intermediary.publish('root')).to.be(null);
					expect(spy.callCount).to.be(1);
				});
				it('should call the next subscriber like normal after removing the current subscriber', function() {
					var spy2 = sinon.spy(),
					    spy3 = sinon.spy();
					addSubscriberWithOptions('root', spy2, {calls: 2});
					addSubscriberWithOptions('root', spy, {calls: 1});
					addSubscriberWithOptions('root', spy3, {calls: 3});
					Intermediary.publish('root');
					Intermediary.publish('root');
					Intermediary.publish('root');
					Intermediary.publish('root');
					expect(spy.callCount).to.be(1);
					expect(spy2.callCount).to.be(2);
					expect(spy3.callCount).to.be(3);
				});
				it('complicated case', function() {
					var callback = {
							myCallback: function() {
								Intermediary.publish('root');
							}
						},
						spy2 = sinon.spy();

					addSubscriber('root', spy);
					addSubscriberWithOptions('root', spy2, {calls: 2});
					addSubscriberWithOptions('root', callback.myCallback, {calls: 1});
					expect(Intermediary.publish('root')).to.not.be(null);
					expect(Intermediary.publish('root')).to.not.be(null);
					expect(spy.callCount).to.be(3);
					expect(spy2.callCount).to.be(2);
				});
			});
			describe('options.predicate', function() {
				it('should only call the subscriber when the predicate matches', function() {
					addSubscriberWithOptions('root', spy, {predicate: function(data) { return data.value === 1; }});
					// This should NOT result in a call
					Intermediary.publish('root', {value: 0});
					// This should result in a call
					Intermediary.publish('root', {value: 1});
					// This should NOT result in a call
					Intermediary.publish('root', {value: '1'});
					expect(spy.callCount).to.be(1);
				});
				it('should not decrease the call count when the predicate doesn\'t match', function() {
					// Add a subscriber with a call count of 1
					addSubscriberWithOptions('root', spy, {predicate: function(data) { return data.value === 1; }}, true);
					// This should NOT result in a call
					Intermediary.publish('root', {value: 0});
					// This should result in a call and the removal of the subscriber
					Intermediary.publish('root', {value: 1});
					// This should NOT result in a call as the subscriber should already be removed
					Intermediary.publish('root', {value: 1});
					expect(spy.callCount).to.be(1);
				});
				it('a predicate that doesn\'t return true or false will cause the subscriber to never get called', function() {
					addSubscriberWithOptions('root', spy, {predicate: function(data) {  }});
					Intermediary.publish('root', {value: 0});
					expect(spy.callCount).to.be(0);
				});
			});

			describe('options.priority', function() {
				it('should sort subscribers descending based on their priority', function() {
					var spy2 = sinon.spy(),
					    spy3 = sinon.spy();

					addSubscriberWithOptions('root', spy, {priority: 1});
					addSubscriber('root', spy2);
					addSubscriberWithOptions('root', spy3, {priority: '3'});

					Intermediary.publish('root');

					expect(spy3.calledBefore(spy)).to.be(true);
					expect(spy.calledAfter(spy3)).to.be(true);
					expect(spy.calledBefore(spy2)).to.be(true);
					expect(spy2.calledAfter(spy)).to.be(true);
				})
			});
		});

		describe('#once()', function() {
			var spy = sinon.spy();

			beforeEach(function() {
				spy.reset();
			});

			it('should register a subscriber which is only called once', function() {
				addSubscriber('root', spy, true);
				Intermediary.publish('root');
				Intermediary.publish('root');
				expect(spy.callCount).to.be(1);
			});
			it('should still call the parent channel', function() {
				addSubscriber('root', spy);
				addSubscriber('root:sub1', spy, true);
				// This should call spy twice, for root:sub1 and root
				expect(Intermediary.publish('root:sub1')).to.not.be(null);
				// This should call spy once, for root
				expect(Intermediary.publish('root:sub1')).to.not.be(null);
				// This should call spy once, for root
				expect(Intermediary.publish('root')).to.not.be(null);
				// The total number of calls to spy should be 4
				expect(spy.callCount).to.be(4);
			});
			it('should call the subscriber once, even if the subscriber publishes to the same channel', function() {
				var callback = { myCallback: function() {
						//console.log('should be called once');
						Intermediary.publish('root');
					}},
					callbackSpy = sinon.spy(callback, 'myCallback');

				addSubscriber('root', callback.myCallback, true);
				Intermediary.publish('root');
				expect(callbackSpy.callCount).to.be(1);
			});
		});

		describe('#getSubscriber()', function() {
			var callback = function() {};

			it('should return null when the specified namespace doesn\'t exist', function() {
				expect(Intermediary.getSubscriber('fake-root', 'fake-guid')).to.be(null);
			});
			it('should return undefined when there is no subscriber to the channel with the ID', function() {
				addSubscriber('root', callback);
				expect(Intermediary.getSubscriber('root', 'fake-guid')).to.be(undefined);
			});
			it('should return a Subscriber object when the channel has a subscriber with the specified ID', function() {
				var guid = addSubscriber('root:sub1:sub2', callback);
				var object = Intermediary.getSubscriber('root:sub1:sub2', guid);
				expect(object.id).to.be(guid);
			});
		});

		describe('#unsubscribe()', function() {
			var spy = sinon.spy();

			beforeEach(function() {
				spy.reset();
			});

			it('should return null when the supplied namespace doesn\'t exist', function() {
				expect(Intermediary.unsubscribe('fake-root:sub1:sub2:sub3')).to.be(null);
			});
			it('should return false when the supplied ID was not found on the channel', function() {
				addSubscriber('root', spy);
				expect(Intermediary.unsubscribe('root', 'fake-guid')).to.be(false);
				Intermediary.publish('root');
				expect(spy.called).to.be(true);
			});
			it('should return true when the subscriber with the specified ID was removed from the channel', function() {
				var guid = addSubscriber('root', spy);
				expect(Intermediary.unsubscribe('root', guid)).to.be(true);
				expect(Intermediary.getSubscriber('root', guid)).to.be(null);
				Intermediary.publish('root');
				expect(spy.called).to.be(false);
			});
			it('should remove all channel subscribers when the ID is null', function() {
				var guidA = addSubscriber('root', spy);
				var guidB = addSubscriber('root', spy);
				// Verify that there are two subscribers to the channel
				expect(Intermediary.getSubscriber('root', guidA).id).to.be(guidA);
				expect(Intermediary.getSubscriber('root', guidB).id).to.be(guidB);
				// Remove all subscribers
				expect(Intermediary.unsubscribe('root', null)).to.be(true);
				// Publish to the channel
				Intermediary.publish('root');
				expect(spy.called).to.be(false);
			});
			describe('Automatic channel cleanup', function() {
				it('should remove the channel when it no longer has subscribers and sub-channels', function() {
					var guid = addSubscriber('root', spy);
					Intermediary.unsubscribe('root', guid);
					expect(Intermediary.publish('root')).to.be(null);
					expect(spy.called).to.be(false);
				});
				it('should remove the channel and parent(s) when they no longer have subscribers and sub-channels', function() {
					var guidA = addSubscriber('root', spy),
					    guidB = addSubscriber('root:sub1', spy);

					Intermediary.unsubscribe('root', guidA);
					expect(Intermediary.publish('root')).to.not.be(null);
					Intermediary.unsubscribe('root:sub1', guidB);
					expect(Intermediary.publish('root:sub1')).to.be(null);
					expect(Intermediary.publish('root')).to.be(null);
					expect(spy.called).to.be(false);
				});
				it('should NOT remove the channel when there are still other subscribers', function() {
					var guid = addSubscriber('root', spy);
					addSubscriber('root', spy);
					Intermediary.unsubscribe('root', guid);
					expect(Intermediary.publish('root')).to.not.be(null);
					expect(spy.calledOnce).to.be.ok();
				});
				it('should NOT remove the channel when it is a parent to other channels', function() {
					var guid = addSubscriber('root', spy);
					addSubscriber('root:sub1', spy);
					Intermediary.unsubscribe('root', guid);
					expect(Intermediary.publish('root')).to.not.be(null);
					expect(spy.called).to.be(false);
				});

			});
		});

		describe('#reset()', function() {
			it('should remove all subscribers and channels', function() {
				var callback = sinon.spy();
				Intermediary.subscribe('root', callback);
				Intermediary.subscribe('root:sub1', callback);
				Intermediary.subscribe('root:sub1:subA', callback);
				Intermediary.subscribe('root:sub1:subB', callback);
				Intermediary.subscribe('root:sub2', callback);
				Intermediary.subscribe('root:sub2:subB', callback);
				Intermediary.reset();
				expect(Intermediary.publish('root')).to.be(null);
				expect(Intermediary.publish('root:sub1')).to.be(null);
				expect(Intermediary.publish('root:sub1:subA')).to.be(null);
				expect(Intermediary.publish('root:sub1:subB')).to.be(null);
				expect(Intermediary.publish('root:sub2')).to.be(null);
				expect(Intermediary.publish('root:subB')).to.be(null);
				expect(callback.called).to.be(false);
			});
		});

		describe('#setSubscriberPriority()', function() {
			var spyA = sinon.spy(),
				spyB = sinon.spy();

			beforeEach(function() {
				spyA.reset();
				spyB.reset();
			});

			it('should return null when the namespace can\'t be resolved', function() {
				var guid = addSubscriber('root', spyA);
				expect(Intermediary.setSubscriberPriority('root:sub1', guid, 2)).to.be(null);
			});
			it('should return false when the subscriber ID can\'t be found', function() {
				addSubscriber('root', spyA);
				expect(Intermediary.setSubscriberPriority('root', 'my-fake-id', 2)).to.be(false);
			});
			it('should return true when the subscriber ID was updated', function() {
				var guid = addSubscriber('root', spyA);
				expect(Intermediary.setSubscriberPriority('root', guid, 2)).to.be(true);
			});
			it('should update the priority of the subscriber', function() {
				addSubscriberWithOptions('root', spyA, {priority: 3});
				var guid = addSubscriber('root', spyB);
				Intermediary.publish('root');
				// Verify the subscribers are called in the order A -> B
				expect(spyA.calledBefore(spyB)).to.be.ok();
				expect(spyB.calledAfter(spyA)).to.be.ok();

				spyA.reset();
				spyB.reset();
				Intermediary.setSubscriberPriority('root', guid, '9');

				Intermediary.publish('root');
				// Verify the subscribers are called in the order B -> A
				expect(spyB.calledBefore(spyA)).to.be.ok();
				expect(spyA.calledAfter(spyB)).to.be.ok();
			});
		});

		describe('#publish()', function() {
			var spyIt = sinon.spy(),
				spyNotIt = sinon.spy();

			beforeEach(function() {
				spyIt.reset();
				spyNotIt.reset();
			});

			it('should return false when trying to publish to a non-existing channel', function() {
				expect(Intermediary.publish('fake-root', {data: 1})).to.be(null);
			});
			it('should pass the message data along to the subscribers', function () {
				addSubscriber('root', spyIt);
				expect(Intermediary.publish('root', {data: 'thisIsIt'})).to.be.ok();
				expect(spyIt.calledWith({data: 'thisIsIt'})).to.be(true);
			});
			it('should inform the subscriber which channel the message was posted to', function() {
				addSubscriber('root', spyIt);
				Intermediary.publish('root');
				expect(spyIt.calledWith(null, 'root')).to.be(true);
			});
			it('should inform the subscriber which virtual channel the message was posted to', function() {
				addSubscriber('root', spyIt);
				Intermediary.publish('root:sub1');
				expect(spyIt.calledWith(null, 'root:sub1')).to.be(true);
			});


			describe('namespaces', function() {
				it('should call the callback of all subscribers of the channel', function() {
					addSubscriber('root', spyIt);
					addSubscriber('root', spyIt);
					Intermediary.publish('root');
					expect(spyIt.callCount).to.be(2);
				});
				it('should call the callback of all subscribers in the hierarchy of the channel', function() {
					addSubscriber('root', spyIt);
					addSubscriber('root:sub1', spyIt);
					addSubscriber('root:sub1:sub2', spyIt);
					Intermediary.publish('root:sub1:sub2');
					expect(spyIt.callCount).to.be(3);
				});
				it('should not make calls to subchannels of the specified channel', function() {
					addSubscriber('root', spyIt);
					addSubscriber('root:sub1', spyIt);
					addSubscriber('root:sub1:sub2', spyNotIt);
					Intermediary.publish('root:sub1');
					expect(spyIt.callCount).to.be(2);
					expect(spyNotIt.called).to.be(false);
				});
				it('should call the parent of a non-existing channel', function() {
					addSubscriber('root', spyIt);
					Intermediary.publish('root:sub1:sub2');
					expect(spyIt.called).to.be(true);
				});
				it('should not make calls to channels outside of the namespace', function() {
					addSubscriber('root', spyIt);
					addSubscriber('root-alt', spyNotIt);
					Intermediary.publish('root');
					expect(spyIt.callCount).to.be(1);
					expect(spyNotIt.called).to.be(false);
				});
			});
		});
	});
});
