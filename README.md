# Angular and NgRx: A Race Condition Illustration + An Easy Fix

This is an Angular app using NgRx. It illustrates a race condition that occurs in many web applications. It also shows how easy it is to fix it when you use NgRx.

It's important to understand that such race conditions are not Angular or NgRx specific. Any web application that talks to the backend can have them. The ease with which we can fix it, however, is due to the awesomeness of NgRx.


## Repro

Check out the "first" commit and run `ng serve` . Do the following:

* Wait for the data to load (takes 4 seconds)
* Click on "Open"
* Click on "Update Item" (it will take 4 seconds for the item to update),
* Immediately click on "Back"

If you have the redux dev tools open, you will see the following actions:

* LOAD_ITEMS
* ITEMS_LOADED
* UPDATE_ITEM
* LOAD_ITEMS
* LOAD_ITEM
* ITEM_LOADED
* ITEMS_LOADED

And the value of the item will flicker from the updated one to the old one. There is a bug!

The second `LOAD_ITEMS` executes before `LOAD_ITEM` and captures the state of the server before the update is applied. The response for `LOAD_ITEMS` takes longer to propagate, and, as a result, its obsolete data overwrites the new updated version.


## Fix

Every time we have a situation like this, we run multiple requests independently, whereas they should run them in order. In this case, all operations loading items must run in order.

Check out the "second" commit and run `ng serve` . If you follow the same instructions, the order of actions will look like this:

* LOAD_ITEMS
* ITEMS_LOADED
* UPDATE_ITEM
* LOAD_ITEMS
* LOAD_ITEM
* ITEMS_LOADED
* ITEM_LOADED

We achieved that by applying both `LOAD_ITEMS` and `LOAD_ITEM` in the same effect. There are other ways to fix it, but of them boil down to: **Take 2 independent observables** and combine them using `concatMap`.

<br>

##  <a href="http://nrwl.io">Nrwl — Enterprise Angular Consulting.
<img src="https://cdn-images-1.medium.com/max/422/1*vrdzsX6fCG7bxnqF0qku0A@2x.png">
</a>
