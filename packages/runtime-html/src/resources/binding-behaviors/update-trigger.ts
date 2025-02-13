import { BindingMode, IObserverLocator, LifecycleFlags, bindingBehavior } from '@aurelia/runtime';
import { EventSubscriber } from '../../observation/event-delegator.js';
import { NodeObserverConfig } from '../../observation/observer-locator.js';

import type { Writable } from '@aurelia/kernel';
import type { Scope } from '@aurelia/runtime';
import type { CheckedObserver } from '../../observation/checked-observer.js';
import type { SelectValueObserver } from '../../observation/select-value-observer.js';
import type { ValueAttributeObserver } from '../../observation/value-attribute-observer.js';
import type { PropertyBinding } from '../../binding/property-binding.js';

export type UpdateTriggerableObserver = (
  (ValueAttributeObserver & Required<ValueAttributeObserver>) |
  (CheckedObserver & Required<CheckedObserver>) |
  (SelectValueObserver & Required<SelectValueObserver>)
) & {
  originalHandler?: EventSubscriber;
};

export type UpdateTriggerableBinding = PropertyBinding & {
  targetObserver: UpdateTriggerableObserver;
};

export class UpdateTriggerBindingBehavior {
  public static inject = [IObserverLocator];
  private readonly oL: IObserverLocator;
  public constructor(
    observerLocator: IObserverLocator,
  ) {
    this.oL = observerLocator;
  }

  public bind(flags: LifecycleFlags, _scope: Scope, binding: UpdateTriggerableBinding, ...events: string[]): void {
    if (events.length === 0) {
      if (__DEV__)
        throw new Error('The updateTrigger binding behavior requires at least one event name argument: eg <input value.bind="firstName & updateTrigger:\'blur\'">');
      else
        throw new Error(`AUR0802`);
    }

    if (binding.mode !== BindingMode.twoWay && binding.mode !== BindingMode.fromView) {
      if (__DEV__)
        throw new Error('The updateTrigger binding behavior can only be applied to two-way/ from-view bindings.');
      else
        throw new Error('AUR0803');
    }

    // ensure the binding's target observer has been set.
    const targetObserver = this.oL.getObserver(binding.target, binding.targetProperty) as UpdateTriggerableObserver;
    if (!targetObserver.handler) {
      if (__DEV__)
        throw new Error('The updateTrigger binding behavior can only be applied to two-way/ from-view bindings on input/select elements.');
      else
        throw new Error('AUR0804');
    }

    binding.targetObserver = targetObserver;

    // stash the original element subscribe function.
    const originalHandler = targetObserver.handler;
    targetObserver.originalHandler = originalHandler;

    // replace the element subscribe function with one that uses the correct events.
    (targetObserver as Writable<typeof targetObserver>).handler = new EventSubscriber(new NodeObserverConfig({
      default: originalHandler.config.default,
      events,
      readonly: originalHandler.config.readonly
    }));
  }

  public unbind(flags: LifecycleFlags, _scope: Scope, binding: UpdateTriggerableBinding): void {
    // restore the state of the binding.
    binding.targetObserver.handler.dispose();
    (binding.targetObserver as Writable<typeof binding.targetObserver>).handler = binding.targetObserver.originalHandler!;
    binding.targetObserver.originalHandler = null!;
  }
}

bindingBehavior('updateTrigger')(UpdateTriggerBindingBehavior);
