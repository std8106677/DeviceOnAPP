import _ from "lodash";
import {SET_WATCHFILTER } from "../actions";

export default function(state ={From:'undefined',To:'undefined', Filter:[], FilterOther:[]}, action) {
  switch (action.type) {
    case SET_WATCHFILTER:
      return action.payload;
    default:
      return state;
  }
}
