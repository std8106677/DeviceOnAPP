import _ from "lodash";
import {SET_GOODSFILTER } from "../actions";

export default function(state ={From:'undefined',To:'undefined', Filter:[], FilterOther:[]}, action) {
  switch (action.type) {
    case SET_GOODSFILTER:
      return action.payload;
    default:
      return state;
  }
}
