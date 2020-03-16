import _ from "lodash";
import {SET_TRANSPORTLIST } from "../actions";

export default function(state = [], action) {
  switch (action.type) {
    case SET_TRANSPORTLIST:
      return action.payload;
    default:
      return state;
  }
}
