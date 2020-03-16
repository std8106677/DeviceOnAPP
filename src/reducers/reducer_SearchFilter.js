import _ from "lodash";
import { SET_SEARCHFILTER } from "../actions";

export default function(state ={From:'undefined',To:'undefined', Filter:[], FilterOther:[]}, action) {

  switch (action.type) {
    case SET_SEARCHFILTER:
      //console.log('SEARCHFILTER',action.payload);
      return action.payload;
    default:
      return state;
  }
}
