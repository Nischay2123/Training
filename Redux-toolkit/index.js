const  redux = require('redux')
const createStore= redux.createStore
const combineReducers= redux.combineReducers;

const CAKE_ORDERED = "CAKE_ORDERED";
const CAKE_RESTOCK = "CAKE_RESTOCK";
const ICECREAM_ORDERED = "ICECREAM_ORDERED";
const ICECREAM_RESTOCK = "ICECREAM_RESTOCK";

function orderCake() {
  return {
    type: CAKE_ORDERED,
    quatity: 1,
  };
}

function restockCake(qty=1){
    return {
        type: CAKE_RESTOCK,
        quatity: qty
    }
}
function orderIcecream() {
  return {
    type: ICECREAM_ORDERED,
    quatity: 1,
  };
}

function restockIcecream(qty=1){
    return {
        type: ICECREAM_RESTOCK,
        quatity: qty
    }
}

const initialCakeState= {
    numOfCakes: 10
}

const initialICreamState= {
    numOfIceCreams: 10
}

const CakeReducer = (state= initialCakeState, action) => { 
    switch(action.type){
        case CAKE_ORDERED:
            return {
                ...state,
                numOfCakes: state.numOfCakes-action.quatity,
            }
        case CAKE_RESTOCK:
            return{
                ...state,
                numOfCakes: state.numOfCakes + action.quatity,
            }
        default:
            return state;
    }
}
const IcecreamReducer = (state= initialICreamState, action) => { 
    switch(action.type){
        case ICECREAM_ORDERED:
            return {
                ...state,
                numOfIceCreams: state.numOfIceCreams-action.quatity,
            }
        case ICECREAM_RESTOCK:
            return{
                ...state,
                numOfIceCreams: state.numOfIceCreams + action.quatity,
            }
        default:
            return state;
    }
}

const rootReducer = combineReducers({
    cake: CakeReducer,
    icecream: IcecreamReducer
})

const store = createStore(rootReducer);
console.log("inital state", store.getState());

const unsubscribe = store.subscribe(()=> console.log('update state',store.getState()))

store.dispatch(orderCake())
store.dispatch(orderCake())
store.dispatch(restockCake(2))
store.dispatch(orderIcecream())
store.dispatch(orderIcecream())
store.dispatch(restockIcecream(2))

unsubscribe()