import _ from "lodash";
import {SET_ABNORMALFILTER } from "../actions";

export default function(state ={From:'undefined',To:'undefined', Filter:[], FilterOther:[]}, action) {
  switch (action.type) {
    case SET_ABNORMALFILTER:
      return action.payload;
    default:
      return state;
  }
}
