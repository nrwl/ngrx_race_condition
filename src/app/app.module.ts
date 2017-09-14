import {BrowserModule} from '@angular/platform-browser';
import {Component, Injectable, NgModule} from '@angular/core';
import {ActivatedRoute, RouterModule} from '@angular/router';
import {Store, StoreModule} from '@ngrx/store';
import {Actions, Effect, EffectsModule} from '@ngrx/effects';
import 'rxjs/add/operator/switchMap';
import {of} from 'rxjs/observable/of';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/concatMap';
import {StoreDevtoolsModule} from '@ngrx/store-devtools';
import {timer} from 'rxjs/observable/timer';
import 'rxjs/add/operator/filter';

// components
@Component({
  selector: 'app-root',
  template: `
    <router-outlet></router-outlet>
  `
})
export class AppComponent {
}

@Component({
  selector: 'app-list',
  template: `
    <div *ngFor="let i of items|async">
      {{i.id}}: {{i.value}} <a [routerLink]="['items', i.id]">Open</a>
    </div>

    <button (click)="reload()">Reload Items</button>
  `
})
export class ListComponent {
  items = this.store.select('items');

  constructor(private store: Store<any>) {
    store.dispatch({type: 'LOAD_ITEMS'});
  }

  reload() {
    this.store.dispatch({type: 'LOAD_ITEMS'});
  }
}

@Component({
  selector: 'app-item',
  template: `
    id {{(item | async).id}}: {{(item | async).value}}
    <button (click)="update()">Update Item</button>
    <a routerLink="/">Back</a>
  `
})
export class ItemComponent {
  item = this.store.select('items').map(items => items[+this.route.snapshot.params.id]);

  constructor(private store: Store<any>, private route: ActivatedRoute) {
  }

  reload() {
    this.store.dispatch({type: 'LOAD_ITEMS'});
  }

  update() {
    this.store.dispatch({type: 'UPDATE_ITEM', payload: {id: +this.route.snapshot.params.id}});
  }
}



// Simulating backend data
// for convenience: the id is the index of an item in the array
let backendData = [
  {id: 0, value: 'one'},
  {id: 1, value: 'two'}
];


@Injectable()
export class AppEffects {
  @Effect() loadAll = this.actions.ofType('LOAD_ITEMS').switchMap(() => {
    // we are coping the data first to simulate us reaching the backend quickly and then waiting
    // for 4 seconds to get the response to the client
    const copy = [{...backendData[0]}, {...backendData[1]}];
    return timer(4000).map(() => {
      return {
        type: 'ITEMS_LOADED',
        payload: copy
      };
    });
  });

  @Effect() loadOne = this.actions.ofType('LOAD_ITEM').switchMap((l: any) => {
    return of({
      type: 'ITEM_LOADED',
      payload: backendData[l.payload.id]
    });
  });

  @Effect() updateItem = this.actions.ofType('UPDATE_ITEM').concatMap((l: any) => {
    // we are simulating waiting for 4 seconds to reach the backend
    return timer(4000).map(() => {
      const newBackendData = [{...backendData[0]}, {...backendData[1]}];
      newBackendData[l.payload.id].value = 'UPDATED';
      backendData = newBackendData;

      return {
        type: 'LOAD_ITEM',
        payload: l.payload
      };
    });
  });

  constructor(private actions: Actions) {
  }
}

export function items(state, action) {
  switch (action.type) {
    case 'ITEMS_LOADED': {
      return action.payload;
    }
    case 'ITEM_LOADED': {
      const index = action.payload.id;
      return [...state.slice(0, index), action.payload, ...state.slice(index + 1)];
    }
    default: {
      return state;
    }
  }
}

@NgModule({
  declarations: [
    AppComponent,
    ListComponent,
    ItemComponent
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot([
      {path: '', component: ListComponent},
      {path: 'items/:id', component: ItemComponent}
    ]),
    StoreModule.forRoot({
      items
    }),
    EffectsModule.forRoot([AppEffects]),
    StoreDevtoolsModule.instrument()
  ],
  providers: [AppEffects],
  bootstrap: [AppComponent]
})
export class AppModule {
}
