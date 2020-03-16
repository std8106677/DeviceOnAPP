import _ from "lodash";
import {SET_GOODSLIST } from "../actions";

export default function(state = [], action) {
  switch (action.type) {
    case SET_GOODSLIST:
      return action.payload;
    default:
      return state;
  }
}
