import _ from "lodash";
import {SET_WATCHLIST } from "../actions";

export default function(state = [], action) {
  switch (action.type) {
    case SET_WATCHLIST:
      return action.payload;
    default:
      return state;
  }
}
